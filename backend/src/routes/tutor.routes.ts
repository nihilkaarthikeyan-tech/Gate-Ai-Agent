import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { chat, explain, getSessions, getSession, createSession, saveMessage } from '../controllers/tutor.controller';

const router = Router();

router.use(authMiddleware);

router.post('/chat', chat);
router.post('/explain', explain);
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSession);
router.post('/messages', saveMessage);

export default router;
