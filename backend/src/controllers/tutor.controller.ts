import { Response } from 'express';
import { streamTutorResponse, explainAnswer, TutorMessage } from '../services/claude.service';
import { prisma } from '../lib/prisma';

export const chat = async (req: any, res: Response) => {
  const { messages, subject } = req.body as {
    messages: TutorMessage[];
    subject?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  try {
    for await (const chunk of streamTutorResponse(messages, subject)) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Streaming error';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  } finally {
    res.end();
  }
};

export const explain = async (req: any, res: Response) => {
  const { question, correctAnswer, questionType, options } = req.body;

  if (!question || !correctAnswer || !questionType) {
    return res.status(400).json({ message: 'question, correctAnswer, and questionType are required' });
  }

  if (!['MCQ', 'MSQ', 'NAT'].includes(questionType)) {
    return res.status(400).json({ message: 'questionType must be MCQ, MSQ, or NAT' });
  }

  try {
    const explanation = await explainAnswer(question, correctAnswer, questionType, options);
    res.json({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generating explanation';
    res.status(500).json({ message });
  }
};

export const getSessions = async (req: any, res: Response) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, subject: true, createdAt: true, updatedAt: true },
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions' });
  }
};

export const getSession = async (req: any, res: Response) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session' });
  }
};

export const createSession = async (req: any, res: Response) => {
  const { title, subject } = req.body;
  try {
    const session = await prisma.chatSession.create({
      data: { userId: req.user.userId, title: title || 'New Chat', subject },
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error creating session' });
  }
};

export const saveMessage = async (req: any, res: Response) => {
  const { sessionId, role, content } = req.body;
  if (!sessionId || !role || !content) {
    return res.status(400).json({ message: 'sessionId, role, and content are required' });
  }
  if (!['user', 'assistant'].includes(role)) {
    return res.status(400).json({ message: 'role must be user or assistant' });
  }
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.userId },
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const message = await prisma.chatMessage.create({
      data: { sessionId, role, content },
    });
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error saving message' });
  }
};
