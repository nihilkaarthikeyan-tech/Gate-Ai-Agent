import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getDashboardAnalytics,
  analyzeWeakAreas,
  predictRank,
  toggleRevisionMode,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardAnalytics);
router.get('/weak-areas', analyzeWeakAreas);
router.get('/predict-rank', predictRank);
router.post('/revision-mode', toggleRevisionMode);

export default router;
