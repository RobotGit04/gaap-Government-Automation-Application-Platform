import { PortalSubmissionResult } from '../types';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

export class PortalService {
  async submitToPortal(applicationId: string, applicationType: string): Promise<PortalSubmissionResult> {
    await this.delay(1500 + Math.random() * 1000);
    logger.info(`Portal: Submitting application ${applicationId} of type ${applicationType}`);

    // Simulate portal failures (30% failure rate to demonstrate retry)
    const failureRoll = Math.random();

    if (failureRoll < 0.15) {
      return {
        success: false,
        errorCode: 'PORTAL_TIMEOUT',
        message: 'Government portal timed out. Will retry automatically.',
        attemptedAt: new Date(),
      };
    }

    if (failureRoll < 0.30) {
      return {
        success: false,
        errorCode: 'PORTAL_MAINTENANCE',
        message: 'Portal under scheduled maintenance. Will retry.',
        attemptedAt: new Date(),
      };
    }

    const referenceNumber = this.generateReferenceNumber(applicationType);
    return {
      success: true,
      referenceNumber,
      message: `Application submitted successfully. Reference: ${referenceNumber}`,
      attemptedAt: new Date(),
    };
  }

  async executeWithRetry(applicationId: string, applicationType: string): Promise<{
    success: boolean;
    referenceNumber?: string;
    totalAttempts: number;
    finalMessage: string;
  }> {
    let attempt = 0;
    let lastResult: PortalSubmissionResult | null = null;

    // Update status to SUBMITTED
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'SUBMITTED' },
    });

    while (attempt < MAX_RETRY_ATTEMPTS) {
      attempt++;
      logger.info(`Portal: Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for application ${applicationId}`);

      if (attempt > 1) {
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'RETRYING' },
        });
      }

      lastResult = await this.submitToPortal(applicationId, applicationType);

      // Log this attempt
      await prisma.retryLog.create({
        data: {
          applicationId,
          attempt,
          reason: lastResult.success ? 'SUCCESS' : lastResult.errorCode || 'UNKNOWN',
          errorCode: lastResult.errorCode,
          success: lastResult.success,
          retryAfter: !lastResult.success && attempt < MAX_RETRY_ATTEMPTS
            ? new Date(Date.now() + RETRY_DELAYS[attempt - 1])
            : null,
        },
      });

      if (lastResult.success) {
        await prisma.application.update({
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            metadata: {
              referenceNumber: lastResult.referenceNumber,
              submittedAt: lastResult.attemptedAt,
            },
            submittedAt: new Date(),
          },
        });

        return {
          success: true,
          referenceNumber: lastResult.referenceNumber,
          totalAttempts: attempt,
          finalMessage: lastResult.message,
        };
      }

      if (attempt < MAX_RETRY_ATTEMPTS) {
        logger.warn(`Portal: Attempt ${attempt} failed. Retrying after ${RETRY_DELAYS[attempt - 1]}ms`);
        await this.delay(RETRY_DELAYS[attempt - 1]);
      }
    }

    // All attempts exhausted
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'FAILED' },
    });

    return {
      success: false,
      totalAttempts: attempt,
      finalMessage: `Submission failed after ${attempt} attempts. ${lastResult?.message || 'Please try again later.'}`,
    };
  }

  private generateReferenceNumber(type: string): string {
    const prefix = {
      PASSPORT: 'PSP',
      DRIVING_LICENSE: 'DL',
      SUBSIDY: 'SUB',
      BIRTH_CERTIFICATE: 'BC',
      INCOME_CERTIFICATE: 'IC',
    }[type] || 'GOV';

    const year = new Date().getFullYear();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `${prefix}${year}${random}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
