import { Router, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const adminService = new AdminService();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
}));

router.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await adminService.getAllUsers(page, limit);
  res.json({ success: true, data: result });
}));

router.get('/applications', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const result = await adminService.getAllApplications(page, limit, status);
  res.json({ success: true, data: result });
}));

router.get('/applications/:id/retries', asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await adminService.getApplicationRetryHistory(req.params.id);
  res.json({ success: true, data: history });
}));

export { router as adminRouter };
