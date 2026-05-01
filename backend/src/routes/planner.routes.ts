import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { createPlan, getPlan, updateProgress } from '../controllers/planner.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getPlan);
router.post('/generate', createPlan);
router.patch('/progress', updateProgress);

export default router;
