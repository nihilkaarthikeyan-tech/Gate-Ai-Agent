import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GATE 2024 marking scheme
const MARKING = {
  MCQ:  { marks1: { correct: 1,  wrong: -1/3 }, marks2: { correct: 2,  wrong: -2/3 } },
  MSQ:  { marks1: { correct: 1,  wrong: 0    }, marks2: { correct: 2,  wrong: 0    } },
  NAT:  { marks1: { correct: 1,  wrong: 0    }, marks2: { correct: 2,  wrong: 0    } },
};

// ─── Generate Test ─────────────────────────────────────────────────────────
export const generateTest = async (req: any, res: Response) => {
  try {
    const { paperCode = 'CS', type = 'full-length', topicIds } = req.body;
    const userId = req.user.id;

    let questions;

    if (type === 'full-length') {
      // 65 questions: ~10 GA + 55 Technical
      questions = await prisma.question.findMany({
        where: { paperCode, ...(topicIds ? { topicId: { in: topicIds } } : {}) },
        take: 65,
        orderBy: { id: 'asc' },
        include: { topic: { include: { subject: true } } },
      });
    } else if (type === 'sectional') {
      const { subjectId } = req.body;
      questions = await prisma.question.findMany({
        where: { paperCode, topic: { subjectId } },
        take: 20,
        orderBy: { id: 'asc' },
        include: { topic: { include: { subject: true } } },
      });
    } else {
      // topic-wise
      questions = await prisma.question.findMany({
        where: { paperCode, topicId: { in: topicIds || [] } },
        take: 15,
        orderBy: { id: 'asc' },
        include: { topic: { include: { subject: true } } },
      });
    }

    // Strip correct answers for delivery
    const safeQuestions = questions.map((q) => ({
      id: q.id,
      type: q.type,
      statementMd: q.statementMd,
      optionsJson: q.optionsJson,
      marks: q.marks,
      topicName: q.topic.name,
      subjectName: q.topic.subject.name,
    }));

    const totalMarks = questions.reduce((s: number, q: any) => s + q.marks, 0);

    // Create attempt record
    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        testType: type,
        paperCode,
        questionsJson: safeQuestions as any,
        totalMarks,
      },
    });

    res.json({ attemptId: attempt.id, questions: safeQuestions, totalMarks, durationMins: 180 });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Submit Test ───────────────────────────────────────────────────────────
export const submitTest = async (req: any, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { responses, timeTaken } = req.body; // [{questionId, answer}]
    const userId = req.user.id;

    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
    });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Fetch all question answers
    const qIds = responses.map((r: any) => r.questionId);
    const questions = await prisma.question.findMany({ where: { id: { in: qIds } } });
    const qMap = new Map(questions.map((q: any) => [q.id, q]));

    let scored = 0;
    const responseRecords = [];

    for (const r of responses) {
      const q = qMap.get(r.questionId);
      if (!q) continue;

      const marksKey = q.marks === 1 ? 'marks1' : 'marks2';
      const scheme = MARKING[q.type as keyof typeof MARKING]?.[marksKey];
      let marksAwarded = 0;
      let isCorrect = false;

      if (q.type === 'MCQ') {
        if (r.answer === q.correctAnswer) {
          isCorrect = true;
          marksAwarded = scheme?.correct ?? q.marks;
        } else if (r.answer) {
          marksAwarded = scheme?.wrong ?? 0;
        }
      } else if (q.type === 'MSQ') {
        // All correct options must match exactly
        const correct = q.correctAnswer.split(',').sort();
        const given = (r.answer || '').split(',').filter(Boolean).sort();
        isCorrect = JSON.stringify(correct) === JSON.stringify(given);
        marksAwarded = isCorrect ? (scheme?.correct ?? q.marks) : 0;
      } else if (q.type === 'NAT') {
        // Allow ±1% tolerance for NAT
        const correctVal = parseFloat(q.correctAnswer);
        const givenVal = parseFloat(r.answer);
        if (!isNaN(correctVal) && !isNaN(givenVal)) {
          isCorrect = Math.abs(correctVal - givenVal) <= Math.abs(correctVal * 0.01);
          marksAwarded = isCorrect ? (scheme?.correct ?? q.marks) : 0;
        }
      }

      scored += marksAwarded;
      responseRecords.push({
        attemptId,
        questionId: q.id,
        answer: r.answer || '',
        isCorrect,
        timeTakenSec: r.timeTakenSec || 0,
        marksAwarded,
      });
    }

    // Persist responses and update attempt
    await prisma.$transaction([
      prisma.questionResponse.createMany({ data: responseRecords }),
      prisma.testAttempt.update({
        where: { id: attemptId },
        data: { scored, timeTaken },
      }),
    ]);

    // Accuracy stats
    const correct = responseRecords.filter((r) => r.isCorrect).length;
    const accuracy = responses.length ? Math.round((correct / responses.length) * 100) : 0;
    const percentage = attempt.totalMarks
      ? Math.round((scored / attempt.totalMarks) * 100)
      : 0;

    res.json({
      attemptId,
      scored,
      totalMarks: attempt.totalMarks,
      percentage,
      accuracy,
      correct,
      wrong: responses.length - correct,
      timeTaken,
      responses: responseRecords,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Attempt History ───────────────────────────────────────────────────
export const getAttemptHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        testType: true,
        paperCode: true,
        totalMarks: true,
        scored: true,
        timeTaken: true,
        createdAt: true,
      },
    });
    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Single Attempt with responses ────────────────────────────────────
export const getAttempt = async (req: any, res: Response) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        responses: {
          include: {
            question: {
              include: { topic: { include: { subject: true } } },
            },
          },
        },
      },
    });
    if (!attempt) return res.status(404).json({ error: 'Not found' });
    res.json(attempt);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
