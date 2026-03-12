import { prisma } from '../utils/prisma';
import { WORKFLOW_STEPS } from '../types';
import { logger } from '../utils/logger';

export class WorkflowService {
  async createApplication(userId: string, type: string, agentId?: string) {
    const steps = WORKFLOW_STEPS[type];
    if (!steps) throw Object.assign(new Error(`Invalid application type: ${type}`), { statusCode: 400 });

    const application = await prisma.application.create({
      data: {
        userId,
        agentId,
        type: type as any,
        status: 'DRAFT',
        currentStep: 0,
        totalSteps: steps.length,
        workflowSteps: {
          create: steps.map(step => ({
            stepNumber: step.stepNumber,
            stepName: step.stepName,
            status: 'PENDING',
            data: { description: step.description, required: step.required },
          })),
        },
      },
      include: { workflowSteps: true },
    });

    await prisma.auditLog.create({
      data: { userId, applicationId: application.id, action: 'APPLICATION_CREATED', details: { type } },
    });

    return application;
  }

  async advanceStep(applicationId: string, stepData: Record<string, any>) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflowSteps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

    const nextStep = application.currentStep + 1;
    const currentStepRecord = application.workflowSteps.find(s => s.stepNumber === application.currentStep + 1);

    if (currentStepRecord) {
      await prisma.workflowStep.update({
        where: { id: currentStepRecord.id },
        data: { status: 'COMPLETED', data: stepData, completedAt: new Date() },
      });
    }

    // Determine new status based on step
    let newStatus: any = application.status;
    if (nextStep === 1) newStatus = 'DATA_COLLECTED';
    if (nextStep >= 3) newStatus = 'VALIDATED';

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { currentStep: nextStep, status: newStatus },
      include: { workflowSteps: { orderBy: { stepNumber: 'asc' } } },
    });

    logger.info(`Workflow: Application ${applicationId} advanced to step ${nextStep}`);
    return updated;
  }

  async getApplicationWithWorkflow(applicationId: string) {
    return prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        workflowSteps: { orderBy: { stepNumber: 'asc' } },
        documents: true,
        verificationLog: true,
        eSignRecord: true,
        retryLogs: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  async getUserApplications(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: {
        workflowSteps: { orderBy: { stepNumber: 'asc' } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAgentApplications(agentId: string) {
    return prisma.application.findMany({
      where: { agentId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        workflowSteps: { orderBy: { stepNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
