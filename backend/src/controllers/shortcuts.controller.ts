import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── List Shortcuts ────────────────────────────────────────────────────────
export const getShortcuts = async (req: Request, res: Response) => {
  try {
    const { subject, search } = req.query;
    const shortcuts = await prisma.shortcut.findMany({
      where: {
        ...(subject ? { subject: subject as string } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search as string, mode: 'insensitive' } },
                { contentMd: { contains: search as string, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ subject: 'asc' }, { title: 'asc' }],
    });
    res.json(shortcuts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getShortcut = async (req: Request, res: Response) => {
  try {
    const shortcut = await prisma.shortcut.findUnique({ where: { id: req.params.shortcutId as string } });
    if (!shortcut) return res.status(404).json({ error: 'Shortcut not found' });
    res.json(shortcut);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubjectList = async (_req: Request, res: Response) => {
  try {
    const subjects = await prisma.shortcut.findMany({
      distinct: ['subject'],
      select: { subject: true },
    });
    res.json(subjects.map((s: any) => s.subject));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
