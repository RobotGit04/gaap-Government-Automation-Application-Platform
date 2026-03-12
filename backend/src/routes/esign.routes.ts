import { Router, Response } from 'express';
import { ESignService } from '../services/esign.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const esignService = new ESignService();

router.post('/send-otp', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId, phone } = req.body;
  if (!applicationId || !phone) {
    return res.status(400).json({ success: false, message: 'applicationId and phone required' });
  }
  const result = await esignService.generateOTP(applicationId, phone);
  res.json({ success: true, data: result });
}));

router.post('/verify-sign', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId, phone, otp } = req.body;
  if (!applicationId || !phone || !otp) {
    return res.status(400).json({ success: false, message: 'applicationId, phone, and otp required' });
  }
  const result = await esignService.verifyOTPAndSign(applicationId, phone, otp, req.ip);
  res.json({ success: true, data: result });
}));

router.get('/:applicationId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const record = await esignService.getSignRecord(req.params.applicationId);
  res.json({ success: true, data: record });
}));

export { router as esignRouter };
