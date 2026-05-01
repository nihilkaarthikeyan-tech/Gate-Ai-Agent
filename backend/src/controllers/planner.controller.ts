import { Response } from 'express';
import { generateStudyPlan, StudyPlanParams } from '../services/claude.service';
import { prisma } from '../lib/prisma';

export const createPlan = async (req: any, res: Response) => {
  const { targetDate, dailyHours, weakSubjects, targetScore, paper } = req.body;

  if (!targetDate || !dailyHours || !targetScore) {
    return res.status(400).json({ message: 'targetDate, dailyHours, and targetScore are required' });
  }
  if (isNaN(Date.parse(targetDate))) {
    return res.status(400).json({ message: 'targetDate must be a valid date (YYYY-MM-DD)' });
  }
  if (Number(dailyHours) < 1 || Number(dailyHours) > 18) {
    return res.status(400).json({ message: 'dailyHours must be between 1 and 18' });
  }

  try {
    const params: StudyPlanParams = {
      targetDate,
      dailyHours: Number(dailyHours),
      weakSubjects: Array.isArray(weakSubjects) ? weakSubjects : [],
      targetScore: Number(targetScore),
      paper: paper || 'CS',
    };

    const planJson = await generateStudyPlan(params);

    const plan = await prisma.studyPlan.upsert({
      where: { userId: req.user.userId },
      update: {
        planJson,
        targetDate: new Date(targetDate),
        dailyHours: Number(dailyHours),
        targetScore: Number(targetScore),
        lastAdaptedAt: new Date(),
      },
      create: {
        userId: req.user.userId,
        planJson,
        targetDate: new Date(targetDate),
        dailyHours: Number(dailyHours),
        targetScore: Number(targetScore),
      },
    });

    res.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generating study plan';
    res.status(500).json({ message });
  }
};

export const getPlan = async (req: any, res: Response) => {
  try {
    const plan = await prisma.studyPlan.findUnique({
      where: { userId: req.user.userId },
    });
    if (!plan) return res.status(404).json({ message: 'No study plan found. Generate one first.' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching study plan' });
  }
};

export const updateProgress = async (req: any, res: Response) => {
  const { completedTopics } = req.body;
  if (!Array.isArray(completedTopics)) {
    return res.status(400).json({ message: 'completedTopics must be an array' });
  }
  try {
    const plan = await prisma.studyPlan.findUnique({ where: { userId: req.user.userId } });
    if (!plan) return res.status(404).json({ message: 'No study plan found' });

    const updated = await prisma.studyPlan.update({
      where: { userId: req.user.userId },
      data: { completedTopics },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress' });
  }
};
