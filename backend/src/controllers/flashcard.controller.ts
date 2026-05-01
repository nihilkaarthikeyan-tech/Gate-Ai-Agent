import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── SM-2 Algorithm ────────────────────────────────────────────────────────
function sm2(card: { easeFactor: number; intervalDays: number; repetitions: number }, quality: number) {
  // quality: 0-5 (0=complete blackout, 5=perfect)
  let { easeFactor, intervalDays, repetitions } = card;

  if (quality < 3) {
    // Failed: reset
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return { easeFactor, intervalDays, repetitions, nextReviewAt };
}

// ─── Deck CRUD ─────────────────────────────────────────────────────────────
export const createDeck = async (req: any, res: Response) => {
  try {
    const { title, subject, description } = req.body;
    const deck = await prisma.flashcardDeck.create({
      data: { userId: req.user.id, title, subject, description },
    });
    res.status(201).json(deck);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDecks = async (req: any, res: Response) => {
  try {
    const decks = await prisma.flashcardDeck.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    // Add due-count per deck
    const now = new Date();
    const decksWithDue = await Promise.all(
      decks.map(async (d: any) => {
        const due = await prisma.flashcard.count({
          where: { deckId: d.id, nextReviewAt: { lte: now } },
        });
        return { ...d, dueCount: due };
      })
    );
    res.json(decksWithDue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDeck = async (req: any, res: Response) => {
  try {
    const { deckId } = req.params;
    await prisma.flashcardDeck.delete({ where: { id: deckId, userId: req.user.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Card CRUD ─────────────────────────────────────────────────────────────
export const addCard = async (req: any, res: Response) => {
  try {
    const { deckId } = req.params;
    const { frontMd, backMd, subject, tags } = req.body;
    const card = await prisma.flashcard.create({
      data: {
        deckId,
        userId: req.user.id,
        frontMd,
        backMd,
        subject,
        tags: tags || [],
      },
    });
    res.status(201).json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeckCards = async (req: any, res: Response) => {
  try {
    const { deckId } = req.params;
    const cards = await prisma.flashcard.findMany({
      where: { deckId, userId: req.user.id },
      orderBy: { nextReviewAt: 'asc' },
    });
    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCard = async (req: any, res: Response) => {
  try {
    const { cardId } = req.params;
    const { frontMd, backMd, subject, tags } = req.body;
    const card = await prisma.flashcard.update({
      where: { id: cardId, userId: req.user.id },
      data: { frontMd, backMd, subject, tags },
    });
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCard = async (req: any, res: Response) => {
  try {
    const { cardId } = req.params;
    await prisma.flashcard.delete({ where: { id: cardId, userId: req.user.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Review Session ────────────────────────────────────────────────────────
export const getDueCards = async (req: any, res: Response) => {
  try {
    const { deckId } = req.query;
    const cards = await prisma.flashcard.findMany({
      where: {
        userId: req.user.id,
        nextReviewAt: { lte: new Date() },
        ...(deckId ? { deckId: deckId as string } : {}),
      },
      orderBy: { nextReviewAt: 'asc' },
      take: 50,
    });
    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitReview = async (req: any, res: Response) => {
  try {
    const { cardId } = req.params;
    const { quality } = req.body; // 0–5

    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, userId: req.user.id },
    });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const updated = sm2(card, quality);

    const [updatedCard] = await prisma.$transaction([
      prisma.flashcard.update({
        where: { id: cardId },
        data: updated,
      }),
      prisma.flashcardReview.create({
        data: { cardId, userId: req.user.id, quality },
      }),
    ]);

    res.json({ card: updatedCard, nextReviewAt: updated.nextReviewAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Stats ─────────────────────────────────────────────────────────────────
export const getFlashcardStats = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const [totalCards, dueCards, reviewsToday] = await Promise.all([
      prisma.flashcard.count({ where: { userId } }),
      prisma.flashcard.count({ where: { userId, nextReviewAt: { lte: new Date() } } }),
      prisma.flashcardReview.count({
        where: {
          userId,
          reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    res.json({ totalCards, dueCards, reviewsToday });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
