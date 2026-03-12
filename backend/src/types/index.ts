import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface AuthRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface OCRResult {
  name?: string;
  dob?: string;
  address?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  fatherName?: string;
  gender?: string;
  confidence: number;
  rawText: string;
}

export interface KYCVerificationResult {
  verified: boolean;
  name?: string;
  dob?: string;
  address?: string;
  message: string;
  code: string;
}

export interface PortalSubmissionResult {
  success: boolean;
  referenceNumber?: string;
  errorCode?: string;
  message: string;
  attemptedAt: Date;
}

export interface WorkflowStepData {
  stepNumber: number;
  stepName: string;
  required: boolean;
  description: string;
}

export const WORKFLOW_STEPS: Record<string, WorkflowStepData[]> = {
  PASSPORT: [
    { stepNumber: 1, stepName: 'IDENTITY_VERIFICATION', required: true, description: 'Verify Aadhaar & PAN' },
    { stepNumber: 2, stepName: 'DOCUMENT_UPLOAD', required: true, description: 'Upload required documents' },
    { stepNumber: 3, stepName: 'DATA_CONFIRMATION', required: true, description: 'Confirm extracted data' },
    { stepNumber: 4, stepName: 'APPLICATION_REVIEW', required: true, description: 'Review & validate application' },
    { stepNumber: 5, stepName: 'ESIGN', required: true, description: 'Digitally sign application' },
    { stepNumber: 6, stepName: 'PORTAL_SUBMISSION', required: true, description: 'Submit to government portal' },
  ],
  DRIVING_LICENSE: [
    { stepNumber: 1, stepName: 'IDENTITY_VERIFICATION', required: true, description: 'Verify Aadhaar & PAN' },
    { stepNumber: 2, stepName: 'DOCUMENT_UPLOAD', required: true, description: 'Upload documents & photo' },
    { stepNumber: 3, stepName: 'DATA_CONFIRMATION', required: true, description: 'Confirm extracted data' },
    { stepNumber: 4, stepName: 'APPLICATION_REVIEW', required: true, description: 'Review application' },
    { stepNumber: 5, stepName: 'ESIGN', required: true, description: 'Digitally sign' },
    { stepNumber: 6, stepName: 'PORTAL_SUBMISSION', required: true, description: 'Submit to RTO portal' },
  ],
  SUBSIDY: [
    { stepNumber: 1, stepName: 'IDENTITY_VERIFICATION', required: true, description: 'Verify Aadhaar' },
    { stepNumber: 2, stepName: 'DOCUMENT_UPLOAD', required: true, description: 'Upload income/address proof' },
    { stepNumber: 3, stepName: 'DATA_CONFIRMATION', required: true, description: 'Confirm details' },
    { stepNumber: 4, stepName: 'ESIGN', required: true, description: 'Digitally sign' },
    { stepNumber: 5, stepName: 'PORTAL_SUBMISSION', required: true, description: 'Submit to scheme portal' },
  ],
  BIRTH_CERTIFICATE: [
    { stepNumber: 1, stepName: 'IDENTITY_VERIFICATION', required: true, description: 'Verify parent identity' },
    { stepNumber: 2, stepName: 'DOCUMENT_UPLOAD', required: true, description: 'Upload hospital records' },
    { stepNumber: 3, stepName: 'DATA_CONFIRMATION', required: true, description: 'Confirm child details' },
    { stepNumber: 4, stepName: 'ESIGN', required: true, description: 'Sign declaration' },
    { stepNumber: 5, stepName: 'PORTAL_SUBMISSION', required: true, description: 'Submit to municipal portal' },
  ],
  INCOME_CERTIFICATE: [
    { stepNumber: 1, stepName: 'IDENTITY_VERIFICATION', required: true, description: 'Verify identity' },
    { stepNumber: 2, stepName: 'DOCUMENT_UPLOAD', required: true, description: 'Upload income documents' },
    { stepNumber: 3, stepName: 'DATA_CONFIRMATION', required: true, description: 'Confirm income details' },
    { stepNumber: 4, stepName: 'ESIGN', required: true, description: 'Sign application' },
    { stepNumber: 5, stepName: 'PORTAL_SUBMISSION', required: true, description: 'Submit to revenue dept' },
  ],
};