import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getEvents, registerForEvent, submitLiveExam, getMyResult, getLeaderboard,
} from '../controllers/liveexam.controller';

const router = Router();

router.get('/', getEvents);
router.get('/:eventId/leaderboard', getLeaderboard);
router.use(authMiddleware);
router.post('/:eventId/register', registerForEvent);
router.post('/:eventId/submit', submitLiveExam);
router.get('/:eventId/my-result', getMyResult);

export default router;
