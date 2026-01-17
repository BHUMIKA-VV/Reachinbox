# ReachInbox Email Job Scheduler

A production-grade email scheduler service with a dashboard for scheduling and managing email campaigns.

## Features

### Backend
- **Email Scheduling**: Accept email send requests via APIs and schedule them using BullMQ delayed jobs
- **Persistence**: Survives server restarts without losing jobs
- **Rate Limiting**: Configurable emails per hour per sender with Redis-backed counters
- **Concurrency**: Configurable worker concurrency with delays between sends
- **SMTP**: Uses Ethereal Email for testing
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth with Passport.js

### Frontend
- **Dashboard**: View scheduled and sent emails
- **Compose**: Schedule new emails with CSV upload for leads
- **Authentication**: Google OAuth login
- **UI**: Built with Next.js, Tailwind CSS, and TypeScript

## Tech Stack

- **Backend**: TypeScript, Express.js, BullMQ, Redis, PostgreSQL, Prisma
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Infra**: Docker Compose for Redis and PostgreSQL

## Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Google OAuth credentials

### Environment Variables

Create `.env` in the backend directory with:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/reachinbox
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_user
ETHEREAL_PASS=your_ethereal_pass
MAX_EMAILS_PER_HOUR_PER_SENDER=200
EMAIL_DELAY_MS=2000
WORKER_CONCURRENCY=5
```

### Running the Application

1. Start Docker services:
   ```bash
   cd docker
   docker-compose up -d
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

5. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. Open http://localhost:3000 for the frontend, backend runs on http://localhost:5000

## Architecture

### Scheduling
- Emails are scheduled using BullMQ delayed jobs
- Jobs are stored in Redis with delay times
- Worker processes jobs, checking rate limits before sending

### Persistence
- Job state is persisted in Redis
- Email records stored in PostgreSQL
- On restart, BullMQ resumes pending jobs

### Rate Limiting
- Per-sender hourly limits enforced using Redis counters
- Counters reset hourly
- Exceeded jobs are rescheduled to next hour

### Concurrency
- Worker concurrency set to 5
- 2-second delay between sends using BullMQ limiter

## API Endpoints

### Auth
- `GET /auth/google` - Initiate Google login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout

### Emails
- `POST /emails/schedule` - Schedule emails
- `GET /emails/scheduled` - Get scheduled emails
- `GET /emails/sent` - Get sent emails
- `GET /emails/senders` - Get senders
- `POST /emails/senders` - Create sender

## Testing

### Authentication Flow
1. Visit http://localhost:3000
2. Click "Sign in with Google"
3. Redirect to dashboard

### Email Scheduling
1. Go to dashboard
2. Click "Compose New Email"
3. Fill subject, body, upload CSV
4. Set start time, delay, hourly limit
5. Click Schedule

### Rate Limiting
- Schedule multiple emails quickly
- Check that sends are delayed and limited per hour

### Restart Scenario
1. Schedule future emails
2. Stop backend
3. Start backend
4. Verify emails still send at correct times

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect Vercel to your repo
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
   ```
4. Deploy

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables from `.env.example`
6. For database, use Render's PostgreSQL or external Redis
7. Deploy

### Database and Redis

- Use Render's managed PostgreSQL and Redis services
- Update `DATABASE_URL` and `REDIS_URL` in environment variables

### Notes

- Backend includes worker process that starts with the server
- Ensure Redis and DB are accessible from Render
- For production SMTP, replace Ethereal with real provider

## Assumptions and Trade-offs

- Ethereal Email used for testing; in production, use real SMTP
- Simple CSV parsing; assumes email column
- No advanced retry logic beyond BullMQ defaults
- Rate limiting counters reset at hour boundaries
- No email templates; plain text/HTML
- Single worker instance; scale horizontally for production

## Submission

- Private GitHub repo with access to `Mitrajit`
- Demo video showing scheduling, dashboard, and restart
- Form submission: https://forms.gle/PstJgufbi5Qn3y5X9
