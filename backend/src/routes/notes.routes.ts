import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createNote, getNotes, getNote, updateNote, deleteNote, summarizeNoteById } from '../controllers/notes.controller';

const router = Router();
router.use(authMiddleware);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:noteId', getNote);
router.patch('/:noteId', updateNote);
router.delete('/:noteId', deleteNote);
router.post('/:noteId/summarize', summarizeNoteById);

export default router;
