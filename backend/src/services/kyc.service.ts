import { KYCVerificationResult } from '../types';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

export class KYCService {
  async verifyAadhaar(aadhaarNumber: string, name: string, dob: string): Promise<KYCVerificationResult> {
    await this.delay(1200 + Math.random() * 800);
    logger.info(`KYC: Verifying Aadhaar ending in ${aadhaarNumber.slice(-4)}`);

    // Mock: Valid Aadhaar format = 12 digits
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return {
        verified: false,
        message: 'Invalid Aadhaar number format',
        code: 'INVALID_FORMAT',
      };
    }

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      return {
        verified: false,
        message: 'UIDAI service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
      };
    }

    return {
      verified: true,
      name: 'Rajesh Kumar Singh',
      dob: '15/08/1990',
      address: '123, MG Road, Bengaluru, Karnataka - 560001',
      message: 'Aadhaar verification successful',
      code: 'SUCCESS',
    };
  }

  async verifyPAN(panNumber: string, name: string, dob: string): Promise<KYCVerificationResult> {
    await this.delay(800 + Math.random() * 600);
    logger.info(`KYC: Verifying PAN ${panNumber}`);

    // PAN format: AAAAA9999A
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return {
        verified: false,
        message: 'Invalid PAN format',
        code: 'INVALID_FORMAT',
      };
    }

    return {
      verified: true,
      name: 'RAJESH KUMAR SINGH',
      dob: '15/08/1990',
      message: 'PAN verification successful',
      code: 'SUCCESS',
    };
  }

  async saveVerification(applicationId: string, data: {
    aadhaarVerified?: boolean;
    panVerified?: boolean;
    aadhaarNumber?: string;
    panNumber?: string;
    name?: string;
    dob?: string;
    address?: string;
  }) {
    return prisma.verificationLog.upsert({
      where: { applicationId },
      create: {
        applicationId,
        ...data,
        verifiedAt: new Date(),
      },
      update: {
        ...data,
        verifiedAt: new Date(),
      },
    });
  }

  async recordConsent(userId: string, purpose: string, ipAddress?: string, userAgent?: string) {
    return prisma.consentRecord.create({
      data: { userId, purpose, granted: true, ipAddress, userAgent },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
