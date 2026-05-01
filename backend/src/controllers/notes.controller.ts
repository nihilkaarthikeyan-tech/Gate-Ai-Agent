import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { summarizeNote } from '../services/claude.service';

// ─── CRUD ──────────────────────────────────────────────────────────────────
export const createNote = async (req: any, res: Response) => {
  try {
    const { title, contentMd, subject, tags } = req.body;
    const note = await prisma.note.create({
      data: {
        userId: req.user.id,
        title,
        contentMd,
        subject,
        tags: tags || [],
      },
    });
    res.status(201).json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getNotes = async (req: any, res: Response) => {
  try {
    const { subject, search } = req.query;
    const notes = await prisma.note.findMany({
      where: {
        userId: req.user.id,
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
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        tags: true,
        summaryMd: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getNote = async (req: any, res: Response) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.noteId, userId: req.user.id },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateNote = async (req: any, res: Response) => {
  try {
    const { title, contentMd, subject, tags } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.noteId, userId: req.user.id },
      data: { title, contentMd, subject, tags },
    });
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNote = async (req: any, res: Response) => {
  try {
    await prisma.note.delete({ where: { id: req.params.noteId, userId: req.user.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── AI Summarize ──────────────────────────────────────────────────────────
export const summarizeNoteById = async (req: any, res: Response) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.noteId, userId: req.user.id },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const summaryMd = await summarizeNote(note.title, note.contentMd, note.subject || '');

    const updated = await prisma.note.update({
      where: { id: note.id },
      data: { summaryMd },
    });

    res.json({ summaryMd: updated.summaryMd });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
