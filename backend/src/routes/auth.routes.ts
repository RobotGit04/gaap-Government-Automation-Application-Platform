import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const authService = new AuthService();

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, name, password, role } = req.body;
  if (!email || !phone || !name || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const result = await authService.register({ email, phone, name, password, role });
  res.status(201).json({ success: true, data: result });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}));

router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.json({ success: true, data: user });
}));

export { router as authRouter };
