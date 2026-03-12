import { Router, Response } from 'express';
import { WORKFLOW_STEPS } from '../types';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

// Get workflow template for application type
router.get('/template/:type', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const steps = WORKFLOW_STEPS[req.params.type.toUpperCase()];
  if (!steps) {
    return res.status(404).json({ success: false, message: 'Workflow template not found' });
  }
  res.json({ success: true, data: { type: req.params.type, steps } });
}));

// Get all available application types
router.get('/types', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const types = Object.keys(WORKFLOW_STEPS).map(type => ({
    type,
    totalSteps: WORKFLOW_STEPS[type].length,
    steps: WORKFLOW_STEPS[type],
  }));
  res.json({ success: true, data: types });
}));

export { router as workflowRouter };
