import { Router, Response } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { PortalService } from '../services/portal.service';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const workflowService = new WorkflowService();
const portalService = new PortalService();

// Create new application
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, agentId } = req.body;
  if (!type) return res.status(400).json({ success: false, message: 'Application type required' });

  const application = await workflowService.createApplication(req.user!.id, type, agentId);
  res.status(201).json({ success: true, data: application });
}));

// Get user's applications
router.get('/my', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const applications = await workflowService.getUserApplications(req.user!.id);
  res.json({ success: true, data: applications });
}));

// Get agent's assigned applications
router.get('/agent', authenticate, authorize('AGENT', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const applications = await workflowService.getAgentApplications(req.user!.id);
  res.json({ success: true, data: applications });
}));

// Get single application with full workflow
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await workflowService.getApplicationWithWorkflow(req.params.id);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  // Check ownership
  if (application.userId !== req.user!.id && req.user!.role !== 'ADMIN' && application.agentId !== req.user!.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: application });
}));

// Advance workflow step
router.post('/:id/advance', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { stepData } = req.body;
  const updated = await workflowService.advanceStep(req.params.id, stepData || {});
  res.json({ success: true, data: updated });
}));

// Submit to government portal (with retry logic)
router.post('/:id/submit', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const application = await workflowService.getApplicationWithWorkflow(req.params.id);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  const result = await portalService.executeWithRetry(req.params.id, application.type);
  res.json({ success: true, data: result });
}));

export { router as applicationRouter };
