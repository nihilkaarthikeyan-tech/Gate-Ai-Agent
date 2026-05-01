import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── Dashboard Analytics ───────────────────────────────────────────────────
export const getDashboardAnalytics = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetPaper: true, examDate: true, isRevisionMode: true, planTier: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Test Attempts
    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        testType: true,
        scored: true,
        totalMarks: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Compute progress over time
    const performanceTrend = attempts.map((a) => ({
      date: a.createdAt.toISOString().split('T')[0],
      score: a.scored || 0,
      percentage: a.totalMarks ? Math.round(((a.scored || 0) / a.totalMarks) * 100) : 0,
    }));

    // Flashcards status
    const dueCardsCount = await prisma.flashcard.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    });
    const totalCardsCount = await prisma.flashcard.count({ where: { userId } });

    // Live exams participation
    const liveExams = await prisma.liveExamParticipant.count({
      where: { userId, submittedAt: { not: null } },
    });

    // Notes count
    const notesCount = await prisma.note.count({ where: { userId } });

    res.json({
      user,
      performanceTrend,
      stats: {
        testsTaken: attempts.length,
        averageScore: performanceTrend.length
          ? Math.round(performanceTrend.reduce((acc, curr) => acc + curr.percentage, 0) / performanceTrend.length)
          : 0,
        dueFlashcards: dueCardsCount,
        totalFlashcards: totalCardsCount,
        liveExamsParticipated: liveExams,
        totalNotes: notesCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Weak Area Analyzer ────────────────────────────────────────────────────
export const analyzeWeakAreas = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // We calculate topic performance dynamically from test responses
    const responses = await prisma.questionResponse.findMany({
      where: { attempt: { userId } },
      include: {
        question: {
          include: {
            topic: {
              include: { subject: true },
            },
          },
        },
      },
    });

    const topicStats: Record<string, { subject: string; topic: string; correct: number; total: number; marks: number; timeTaken: number }> = {};

    for (const r of responses) {
      const tId = r.question.topicId;
      if (!topicStats[tId]) {
        topicStats[tId] = {
          subject: r.question.topic.subject.name,
          topic: r.question.topic.name,
          correct: 0,
          total: 0,
          marks: 0,
          timeTaken: 0,
        };
      }
      topicStats[tId].total += 1;
      topicStats[tId].timeTaken += r.timeTakenSec;
      if (r.isCorrect) {
        topicStats[tId].correct += 1;
        topicStats[tId].marks += r.marksAwarded;
      }
    }

    const weakAreas = Object.values(topicStats)
      .map((stat) => ({
        ...stat,
        accuracy: Math.round((stat.correct / stat.total) * 100),
        avgTimePerQuestion: Math.round(stat.timeTaken / stat.total),
      }))
      // Filter out topics with high accuracy or too few questions
      .filter((stat) => stat.total >= 3 && stat.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10); // Top 10 weakest

    // Sync to TopicPerformance table (optional, for caching/future use)
    // For simplicity, we just return the calculated weak areas here

    res.json(weakAreas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Rank Predictor ────────────────────────────────────────────────────────
export const predictRank = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    // Get the latest full-length mock test
    const latestTest = await prisma.testAttempt.findFirst({
      where: { userId, testType: 'full-length' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestTest || !latestTest.scored) {
      return res.json({ predictedRank: null, message: 'Take a full-length mock test to predict rank.' });
    }

    const score = latestTest.scored;
    let rank = 0;

    // Rough heuristic for GATE CS (Out of 100)
    if (score >= 80) rank = Math.max(1, 100 - (score - 80) * 5); // 80 -> 100, 90 -> 50
    else if (score >= 70) rank = 100 + (80 - score) * 40;        // 70 -> 500
    else if (score >= 60) rank = 500 + (70 - score) * 150;       // 60 -> 2000
    else if (score >= 50) rank = 2000 + (60 - score) * 300;      // 50 -> 5000
    else if (score >= 40) rank = 5000 + (50 - score) * 500;      // 40 -> 10000
    else rank = 10000 + (40 - score) * 1000;

    rank = Math.round(rank);

    res.json({
      predictedRank: rank,
      latestScore: score,
      message: `Based on your recent mock score of ${score.toFixed(2)}, your estimated rank is ~${rank}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Dynamic Revision Mode ─────────────────────────────────────────────────
export const toggleRevisionMode = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { isRevisionMode } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isRevisionMode },
      select: { isRevisionMode: true },
    });

    res.json({ isRevisionMode: user.isRevisionMode, message: 'Revision mode updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
