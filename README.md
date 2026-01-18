# ReachInbox Email Job Scheduler

A robust, production-ready email scheduling platform built with modern web technologies. Schedule bulk emails with configurable delays, rate limiting, and real-time monitoring through an intuitive dashboard.

## 🚀 Features

### Backend Capabilities
- **Advanced Email Scheduling**: Queue emails with precise timing using BullMQ delayed jobs
- **Fault-Tolerant Persistence**: Survives server restarts with Redis-backed job storage
- **Intelligent Rate Limiting**: Per-sender hourly limits with automatic rescheduling
- **Configurable Concurrency**: Adjustable worker threads with customizable delays
- **Secure Authentication**: Google OAuth 2.0 integration with session management
- **Bulk Email Support**: CSV upload for mass email campaigns
- **Database Integration**: PostgreSQL with Prisma ORM for reliable data storage
- **SMTP Integration**: Ethereal Email for testing (easily configurable for production)

### Frontend Dashboard
- **Real-Time Monitoring**: View scheduled, sent, and failed emails
- **Bulk Scheduling**: Upload CSV files with recipient data
- **Flexible Configuration**: Set custom delays, hourly limits, and start times
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS
- **Secure Access**: OAuth-protected dashboard

## 🛠 Tech Stack

- **Backend**: Node.js, TypeScript, Express.js, BullMQ, Redis, PostgreSQL, Prisma
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Infrastructure**: Docker Compose (development), Vercel (frontend), Render (backend)
- **Authentication**: Passport.js with Google OAuth 2.0
- **Email**: Nodemailer with SMTP transport

## 📋 Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose (for local development)
- Google OAuth 2.0 credentials
- GitHub account for deployment

## ⚙️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd reachinbox
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Create `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/reachinbox

# Redis
# REDIS_URL should be set to your Redis instance URL (e.g., from Redis Cloud)

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Security
SESSION_SECRET=your_secure_random_session_secret

# Email Configuration (Ethereal for testing)
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASS=your_ethereal_password

# Rate Limiting & Performance
MAX_EMAILS_PER_HOUR_PER_SENDER=200
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=5
```

### 3. Start Infrastructure Services

```bash
cd docker
docker-compose up -d
```

### 4. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Launch Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🏗 Architecture Overview

### Email Scheduling Pipeline
1. **API Reception**: Emails received via REST API with scheduling parameters
2. **Queue Management**: Jobs queued in Redis with BullMQ for persistence
3. **Worker Processing**: Background workers process jobs with rate limiting
4. **SMTP Delivery**: Emails sent via configured SMTP provider
5. **Status Tracking**: Real-time updates in database and UI

### Key Components

- **Rate Limiting**: Redis counters enforce per-sender hourly limits
- **Job Persistence**: BullMQ ensures no emails are lost on restarts
- **Concurrency Control**: Configurable worker pools with delays
- **Error Handling**: Automatic retries and failure tracking

## 📡 API Reference

### Authentication Endpoints
- `GET /auth/google` - Initiate OAuth login
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/user` - Retrieve current user info
- `POST /auth/logout` - Destroy user session

### Email Management Endpoints
- `POST /emails/schedule` - Schedule new emails (supports CSV upload)
- `GET /emails/scheduled` - List pending emails
- `GET /emails/sent` - List delivered emails
- `GET /emails/senders` - List configured senders
- `POST /emails/senders` - Create new sender profile

## 🧪 Testing Guide

### Authentication Testing
1. Navigate to `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify dashboard access

### Email Scheduling Testing
1. Access the dashboard
2. Click "Compose New Email"
3. Upload CSV file with recipient data
4. Configure scheduling parameters
5. Submit and monitor queue

### Rate Limiting Verification
- Schedule emails exceeding hourly limit
- Observe automatic rescheduling to next hour
- Check Redis counters and logs

### Resilience Testing
- Schedule future emails
- Restart backend service
- Confirm jobs resume automatically

## 🚀 Production Deployment

### Frontend Deployment (Vercel)

1. **Repository Setup**: Push code to GitHub
2. **Vercel Connection**: Link repository in Vercel dashboard
3. **Build Configuration**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```
5. **Deploy**: Trigger automatic deployment

### Backend Deployment (Render)

1. **Service Creation**: New Web Service in Render dashboard
2. **Repository Connection**: Link GitHub repository
3. **Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Environment Variables**: Configure from `.env.example`
5. **Database & Redis**: Use Render managed services or external providers

### Infrastructure Setup

- **PostgreSQL**: Render managed database
- **Redis**: Render managed Redis or cloud provider
- **Domain Configuration**: Update OAuth redirect URIs
- **SSL**: Automatic HTTPS provisioning

### Post-Deployment Checklist

- [ ] Update Google OAuth redirect URIs
- [ ] Execute Prisma migrations: `npx prisma migrate deploy`
- [ ] Test authentication flow
- [ ] Verify email scheduling and delivery
- [ ] Monitor application logs
- [ ] Configure monitoring and alerts

## 📊 Monitoring & Maintenance

- **Logs**: Monitor Render/Vercel logs for errors
- **Database**: Regular backups and performance monitoring
- **Redis**: Monitor queue lengths and memory usage
- **Rate Limits**: Adjust based on usage patterns
- **Updates**: Keep dependencies updated for security

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

