import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { explainAnswer } from '../services/claude.service';

export const listQuestions = async (req: any, res: Response) => {
  const { subject, topic, year, type, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: Record<string, unknown> = {
      pyqYear: { not: null },
    };
    if (topic) where.topicId = topic;
    if (year) where.pyqYear = parseInt(year);
    if (type) where.type = type;

    // Filter by subject name via topic relation
    const questionWhere = subject
      ? { ...where, topic: { subject: { name: subject } } }
      : where;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: questionWhere,
        skip,
        take: limitNum,
        orderBy: [{ pyqYear: 'desc' }],
        select: {
          id: true,
          pyqYear: true,
          type: true,
          statementMd: true,
          marks: true,
          optionsJson: true,
          topic: { select: { name: true, subject: { select: { name: true } } } },
        },
      }),
      prisma.question.count({ where: questionWhere }),
    ]);

    res.json({
      questions: questions.map((q) => ({
        id: q.id,
        year: q.pyqYear,
        subject: q.topic.subject.name,
        topic: q.topic.name,
        questionText: q.statementMd,
        questionType: q.type,
        marks: q.marks,
        options: q.optionsJson,
      })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

export const getQuestion = async (req: any, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { topic: { include: { subject: true } }, solutions: true },
    });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({
      id: question.id,
      year: question.pyqYear,
      subject: question.topic.subject.name,
      topic: question.topic.name,
      questionText: question.statementMd,
      questionType: question.type,
      marks: question.marks,
      options: question.optionsJson,
      correctAnswer: question.correctAnswer,
      solutions: question.solutions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching question' });
  }
};

export const getExplanation = async (req: any, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { topic: { include: { subject: true } } },
    });
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.explanation) {
      return res.json({ explanation: question.explanation });
    }

    const options = Array.isArray(question.optionsJson) ? question.optionsJson as string[] : undefined;
    const explanation = await explainAnswer(
      question.statementMd,
      question.correctAnswer,
      question.type as 'MCQ' | 'MSQ' | 'NAT',
      options
    );

    await prisma.question.update({
      where: { id: question.id },
      data: { explanation },
    });

    res.json({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generating explanation';
    res.status(500).json({ message });
  }
};

export const getSubjects = async (_req: any, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { topics: true } },
      },
    });
    res.json(subjects.map((s) => ({ id: s.id, name: s.name, topicCount: s._count.topics })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
};

export const verifyNatAnswer = async (req: any, res: Response) => {
  const { questionId, userAnswer } = req.body;
  if (!questionId || userAnswer === undefined) {
    return res.status(400).json({ message: 'questionId and userAnswer are required' });
  }

  let correctAnswer = '';
  try {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (question.type !== 'NAT') {
      return res.status(400).json({ message: 'Question is not NAT type' });
    }
    correctAnswer = question.correctAnswer;

    const sympyUrl = process.env.SYMPY_VERIFIER_URL || 'http://localhost:8000';
    const verifyRes = await fetch(`${sympyUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct_answer: correctAnswer, user_answer: String(userAnswer) }),
    });

    if (!verifyRes.ok) throw new Error('SymPy verifier unavailable');
    const result = await verifyRes.json() as { is_correct: boolean };
    res.json({ isCorrect: result.is_correct, correctAnswer });
  } catch {
    const numeric = parseFloat(String(userAnswer));
    const correct = parseFloat(correctAnswer);
    const isCorrect = !isNaN(numeric) && !isNaN(correct) && Math.abs(numeric - correct) < 0.01;
    res.json({ isCorrect, correctAnswer, fallback: true });
  }
};
