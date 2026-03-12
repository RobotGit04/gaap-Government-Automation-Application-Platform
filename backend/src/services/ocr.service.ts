import { OCRResult } from '../types';
import { logger } from '../utils/logger';

// Mock OCR data for different document types
const MOCK_AADHAAR_DATA = {
  name: 'Rajesh Kumar Singh',
  dob: '15/08/1990',
  gender: 'Male',
  address: '123, MG Road, Bengaluru, Karnataka - 560001',
  aadhaarNumber: '1234 5678 9012',
  fatherName: 'Suresh Kumar Singh',
};

const MOCK_PAN_DATA = {
  name: 'RAJESH KUMAR SINGH',
  dob: '15/08/1990',
  panNumber: 'ABCDE1234F',
  fatherName: 'SURESH KUMAR SINGH',
};

export class OCRService {
  async extractFromDocument(fileBuffer: Buffer, documentType: string): Promise<OCRResult> {
    // Simulate processing delay
    await this.delay(800 + Math.random() * 700);

    logger.info(`OCR processing document type: ${documentType}`);

    // Simulate occasional low confidence
    const confidence = 0.75 + Math.random() * 0.24;

    switch (documentType.toUpperCase()) {
      case 'AADHAAR':
        return {
          ...MOCK_AADHAAR_DATA,
          confidence,
          rawText: `GOVERNMENT OF INDIA\nAadhaar\n${MOCK_AADHAAR_DATA.name}\nDOB: ${MOCK_AADHAAR_DATA.dob}\n${MOCK_AADHAAR_DATA.aadhaarNumber}`,
        };

      case 'PAN':
        return {
          name: MOCK_PAN_DATA.name,
          dob: MOCK_PAN_DATA.dob,
          panNumber: MOCK_PAN_DATA.panNumber,
          fatherName: MOCK_PAN_DATA.fatherName,
          confidence,
          rawText: `INCOME TAX DEPARTMENT\nPAN: ${MOCK_PAN_DATA.panNumber}\n${MOCK_PAN_DATA.name}`,
        };

      case 'PHOTO':
        return {
          confidence: 0.99,
          rawText: 'Photograph extracted successfully',
        };

      default:
        return {
          confidence: 0.60,
          rawText: `Document processed: ${documentType}`,
        };
    }
  }

  async validateOCRData(ocrResult: OCRResult, documentType: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ocrResult.confidence < 0.5) {
      errors.push('Document quality too low for reliable extraction');
    } else if (ocrResult.confidence < 0.75) {
      warnings.push('Low confidence extraction - please verify data manually');
    }

    if (documentType === 'AADHAAR') {
      if (!ocrResult.aadhaarNumber) errors.push('Aadhaar number not detected');
      if (!ocrResult.name) errors.push('Name not detected');
      if (!ocrResult.dob) errors.push('Date of birth not detected');
    }

    if (documentType === 'PAN') {
      if (!ocrResult.panNumber) errors.push('PAN number not detected');
      if (!ocrResult.name) errors.push('Name not detected');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
