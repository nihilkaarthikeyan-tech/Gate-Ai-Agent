import { Router } from 'express';
import {
  solvePhoto,
  getMotivation,
  startInterviewMock,
  continueInterviewMock,
  getCounsellingGuidance,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/advanced.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);


router.post('/photo-solver', solvePhoto);
router.get('/motivation', getMotivation);
router.post('/interview-prep/start', startInterviewMock);
router.post('/interview-prep/message', continueInterviewMock);
router.post('/counselling', getCounsellingGuidance);
router.post('/payments/create-order', createRazorpayOrder);
router.post('/payments/verify', verifyRazorpayPayment);

export default router;
