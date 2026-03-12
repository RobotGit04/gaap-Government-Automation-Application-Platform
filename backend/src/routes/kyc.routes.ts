import { Router, Response } from 'express';
import { KYCService } from '../services/kyc.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const kycService = new KYCService();

router.post('/consent', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { purpose } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  const consent = await kycService.recordConsent(req.user!.id, purpose, ipAddress, userAgent);
  res.json({ success: true, data: consent });
}));

router.post('/verify-aadhaar', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { aadhaarNumber, name, dob, applicationId } = req.body;
  if (!aadhaarNumber || !name || !dob) {
    return res.status(400).json({ success: false, message: 'Aadhaar number, name, and DOB required' });
  }
  const result = await kycService.verifyAadhaar(aadhaarNumber, name, dob);
  if (result.verified && applicationId) {
    await kycService.saveVerification(applicationId, {
      aadhaarVerified: true,
      aadhaarNumber,
      name: result.name,
      dob: result.dob,
      address: result.address,
    });
  }
  res.json({ success: true, data: result });
}));

router.post('/verify-pan', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { panNumber, name, dob, applicationId } = req.body;
  if (!panNumber || !name) {
    return res.status(400).json({ success: false, message: 'PAN number and name required' });
  }
  const result = await kycService.verifyPAN(panNumber, name, dob || '');
  if (result.verified && applicationId) {
    await kycService.saveVerification(applicationId, {
      panVerified: true,
      panNumber,
    });
  }
  res.json({ success: true, data: result });
}));

export { router as kycRouter };
