import { Router, Response } from 'express';
import multer from 'multer';
import { OCRService } from '../services/ocr.service';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
const ocrService = new OCRService();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// Upload and OCR a document
router.post('/upload', authenticate, upload.single('document'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { applicationId, documentType } = req.body;
  if (!applicationId || !documentType) {
    return res.status(400).json({ success: false, message: 'applicationId and documentType required' });
  }

  // Run OCR
  const ocrResult = await ocrService.extractFromDocument(req.file.buffer, documentType);
  const validation = await ocrService.validateOCRData(ocrResult, documentType);

  // Save document record
  const document = await prisma.document.create({
    data: {
      applicationId,
      type: documentType,
      fileName: req.file.originalname,
      fileUrl: `uploads/${applicationId}/${documentType}_${Date.now()}`,
      ocrData: ocrResult as any,
      confidence: ocrResult.confidence,
      verified: validation.isValid,
    },
  });

  res.json({
    success: true,
    data: {
      document,
      ocr: ocrResult,
      validation,
    },
  });
}));

// Get documents for an application
router.get('/application/:applicationId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const documents = await prisma.document.findMany({
    where: { applicationId: req.params.applicationId },
  });
  res.json({ success: true, data: documents });
}));

export { router as documentRouter };
