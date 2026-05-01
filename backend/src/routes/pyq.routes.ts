import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { listQuestions, getQuestion, getExplanation, getSubjects, verifyNatAnswer } from '../controllers/pyq.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', listQuestions);
router.get('/subjects', getSubjects);
router.get('/:id', getQuestion);
router.get('/:id/explanation', getExplanation);
router.post('/verify-nat', verifyNatAnswer);

export default router;
