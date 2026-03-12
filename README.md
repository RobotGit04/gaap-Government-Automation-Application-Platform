# GAAP – Government Application Automation Platform

> A full-stack SaaS platform that automates government applications in India — Passport, Driving License, Subsidies, and more.

## 🏗️ Architecture

```
gaap/
├── backend/          # Node.js + Express + TypeScript + Prisma
├── frontend/         # React + TypeScript + TailwindCSS + Vite
├── docker-compose.yml
└── README.md
```

## ✨ Core Features

| Feature | Description |
|---|---|
| 🔐 Auth & Roles | JWT-based auth with Citizen / Agent / Admin roles |
| 🪪 KYC Verification | Mock Aadhaar & PAN verification with real API structure |
| 📄 OCR Extraction | Auto-extract data from uploaded documents |
| ⚙️ Workflow Engine | Step-based application processing with state machine |
| 🔄 Retry Logic | Auto-retry portal submissions (3 attempts, exp backoff) |
| ✍️ eSign | OTP-based digital signing of applications |
| 📊 Admin Dashboard | Real-time analytics, charts, user & application management |

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and run everything
git clone <repo>
cd gaap
docker-compose up --build
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Option 2: Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 14+

**Backend:**
```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run prisma:seed

# Start dev server
npm run dev
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## 🔑 Demo Accounts

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gaap.gov.in | admin@123 |
| Agent | agent@gaap.gov.in | agent@123 |
| Citizen | citizen@example.com | citizen@123 |

Use the **Quick Demo Access** buttons on the login page for instant access.

## 📡 API Reference

### Authentication
```
POST /api/auth/register    # Create account
POST /api/auth/login       # Login
GET  /api/auth/profile     # Get profile (auth required)
```

### Applications
```
POST /api/applications           # Create application
GET  /api/applications/my        # My applications
GET  /api/applications/:id       # Application detail
POST /api/applications/:id/advance   # Advance workflow step
POST /api/applications/:id/submit    # Submit to portal (with retry)
```

### KYC
```
POST /api/kyc/consent            # Record consent
POST /api/kyc/verify-aadhaar     # Verify Aadhaar
POST /api/kyc/verify-pan         # Verify PAN
```

### Documents
```
POST /api/documents/upload                      # Upload + OCR
GET  /api/documents/application/:applicationId  # Get docs for app
```

### eSign
```
POST /api/esign/send-otp         # Send OTP
POST /api/esign/verify-sign      # Verify OTP & sign
```

### Admin (Admin role only)
```
GET /api/admin/dashboard         # Analytics
GET /api/admin/users             # All users
GET /api/admin/applications      # All applications
```

## 🔄 Application State Machine

```
DRAFT → DATA_COLLECTED → VALIDATED → SUBMITTED → APPROVED
                                    ↘ FAILED ↗
                                    ↘ RETRYING ↗
                                    → REJECTED
```

## 🏛️ Supported Application Types

1. **PASSPORT** - 6 steps
2. **DRIVING_LICENSE** - 6 steps
3. **SUBSIDY** - 5 steps
4. **BIRTH_CERTIFICATE** - 5 steps
5. **INCOME_CERTIFICATE** - 5 steps

## 📦 Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- Winston logging
- Multer for file uploads

**Frontend:**
- React 18 + TypeScript
- TailwindCSS (dark theme)
- React Query (server state)
- Zustand (client state)
- Recharts (admin analytics)
- React Router v6

**Infrastructure:**
- Docker + Docker Compose
- Nginx (frontend serving + API proxy)
- PostgreSQL 16

## 🔧 Production Considerations

1. Replace mock KYC APIs with real UIDAI/NSDL APIs
2. Replace mock OCR with AWS Textract or Azure Form Recognizer
3. Use Redis for OTP storage (not in-memory)
4. Use S3/GCS for document storage (not local filesystem)
5. Add rate limiting per user
6. Implement proper Aadhaar OTP via UIDAI AUA/KUA
7. Add email notifications (SendGrid/SES)
8. Add SMS notifications (MSG91/Textlocal)

## 📐 Database Schema

Key tables: `users`, `applications`, `documents`, `workflow_steps`, `verification_logs`, `retry_logs`, `esign_records`, `consent_records`, `audit_logs`

---

Built with ❤️ for simplifying government processes in India.
