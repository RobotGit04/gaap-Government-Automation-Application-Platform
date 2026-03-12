import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { applicationRouter } from './routes/application.routes';
import { documentRouter } from './routes/document.routes';
import { kycRouter } from './routes/kyc.routes';
import { adminRouter } from './routes/admin.routes';
import { workflowRouter } from './routes/workflow.routes';
import { esignRouter } from './routes/esign.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/documents', documentRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/admin', adminRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/esign', esignRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GAAP API', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 GAAP API running on port ${PORT}`);
});

export default app;
