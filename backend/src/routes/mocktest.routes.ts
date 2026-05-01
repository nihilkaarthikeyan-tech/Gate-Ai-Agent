import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { generateTest, submitTest, getAttemptHistory, getAttempt } from '../controllers/mocktest.controller';

const router = Router();
router.use(authMiddleware);

router.post('/generate', generateTest);
router.post('/:attemptId/submit', submitTest);
router.get('/history', getAttemptHistory);
router.get('/:attemptId', getAttempt);

export default router;
