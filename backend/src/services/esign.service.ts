import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date; applicationId: string }>();

export class ESignService {
  async generateOTP(applicationId: string, phone: string): Promise<{ otpSent: boolean; message: string }> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    otpStore.set(phone, { otp, expiresAt, applicationId });

    logger.info(`eSign: OTP generated for ${phone} (Demo OTP: ${otp})`);

    // In production: send via SMS API (Textlocal, MSG91, etc.)
    // For demo: return OTP in response
    return {
      otpSent: true,
      message: `OTP sent to ${phone}. Demo OTP: ${otp}`,
    };
  }

  async verifyOTPAndSign(
    applicationId: string,
    phone: string,
    otp: string,
    ipAddress?: string
  ): Promise<{ signed: boolean; signatureHash?: string; message: string }> {
    const stored = otpStore.get(phone);

    if (!stored) {
      return { signed: false, message: 'OTP not found or expired. Please request a new OTP.' };
    }

    if (stored.applicationId !== applicationId) {
      return { signed: false, message: 'OTP not valid for this application.' };
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(phone);
      return { signed: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (stored.otp !== otp) {
      return { signed: false, message: 'Invalid OTP. Please try again.' };
    }

    // Clear used OTP
    otpStore.delete(phone);

    // Generate signature hash
    const signatureData = `${applicationId}:${phone}:${new Date().toISOString()}`;
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');

    // Save eSign record
    await prisma.eSignRecord.upsert({
      where: { applicationId },
      create: {
        applicationId,
        otpVerified: true,
        signedAt: new Date(),
        signatureHash,
        ipAddress,
      },
      update: {
        otpVerified: true,
        signedAt: new Date(),
        signatureHash,
        ipAddress,
      },
    });

    logger.info(`eSign: Application ${applicationId} signed successfully`);

    return {
      signed: true,
      signatureHash,
      message: 'Document signed successfully with eSign.',
    };
  }

  async getSignRecord(applicationId: string) {
    return prisma.eSignRecord.findUnique({ where: { applicationId } });
  }
}
