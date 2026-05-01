import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── List Upcoming & Past Events ───────────────────────────────────────────
export const getEvents = async (_req: Request, res: Response) => {
  try {
    const events = await prisma.liveExamEvent.findMany({
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        title: true,
        paperCode: true,
        scheduledAt: true,
        durationMins: true,
        status: true,
        createdAt: true,
        _count: { select: { participants: true } },
      },
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Register for Event ────────────────────────────────────────────────────
export const registerForEvent = async (req: any, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.liveExamEvent.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status === 'completed') return res.status(400).json({ error: 'Event is over' });

    const existing = await prisma.liveExamParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: req.user.id } },
    });
    if (existing) return res.json({ message: 'Already registered', participant: existing });

    const participant = await prisma.liveExamParticipant.create({
      data: { eventId, userId: req.user.id },
    });
    res.status(201).json(participant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Submit Live Exam ──────────────────────────────────────────────────────
export const submitLiveExam = async (req: any, res: Response) => {
  try {
    const { eventId } = req.params;
    const { responses, timeTaken } = req.body;
    const userId = req.user.id;

    const event = await prisma.liveExamEvent.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const questions: any[] = (event.questionsJson as any[]) || [];
    const qMap = new Map(questions.map((q: any) => [q.id, q]));

    let scored = 0;
    let totalMarks = 0;

    for (const q of questions) totalMarks += q.marks;

    for (const r of responses) {
      const q = qMap.get(r.questionId);
      if (!q) continue;
      if (r.answer === q.correctAnswer) scored += q.marks;
      else if (q.type === 'MCQ') scored += q.marks === 1 ? -1 / 3 : -2 / 3;
    }
    scored = Math.max(0, scored);

    await prisma.liveExamParticipant.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { score: scored, totalMarks, timeTaken, submittedAt: new Date() },
      create: { eventId, userId, score: scored, totalMarks, timeTaken, submittedAt: new Date() },
    });

    // Calculate percentile after submission
    const allParticipants = await prisma.liveExamParticipant.findMany({
      where: { eventId, submittedAt: { not: null } },
      select: { score: true, userId: true },
    });
    const below = allParticipants.filter((p: any) => (p.score ?? 0) < scored).length;
    const percentile = allParticipants.length > 1
      ? Math.round((below / (allParticipants.length - 1)) * 100)
      : 100;

    await prisma.liveExamParticipant.update({
      where: { eventId_userId: { eventId, userId } },
      data: { percentile },
    });

    res.json({ scored, totalMarks, percentile, timeTaken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get My Result ─────────────────────────────────────────────────────────
export const getMyResult = async (req: any, res: Response) => {
  try {
    const { eventId } = req.params;
    const result = await prisma.liveExamParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: req.user.id } },
    });
    if (!result) return res.status(404).json({ error: 'No submission found' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Leaderboard ───────────────────────────────────────────────────────────
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const entries = await prisma.liveExamParticipant.findMany({
      where: { eventId: eventId as string, submittedAt: { not: null } },
      orderBy: { score: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } },
    });
    const board = entries.map((e: any, i: number) => ({
      rank: i + 1,
      name: e.user.name,
      score: e.score,
      percentile: e.percentile,
      timeTaken: e.timeTaken,
    }));
    res.json(board);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
