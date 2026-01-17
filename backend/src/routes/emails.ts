import express from 'express';
import { prisma } from '../index';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const emailQueue = new Queue('email-queue', { connection: redis });

router.post('/schedule', upload.single('csvFile'), async (req, res) => {
  try {
    const { senderId, subject, body, startTime, delayMs, hourlyLimit } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    // Validate sender belongs to user
    const sender = await prisma.sender.findFirst({
      where: { id: parseInt(senderId), userId }
    });

    if (!sender) {
      return res.status(400).json({ error: 'Invalid sender' });
    }

    // Parse CSV
    const emails: string[] = [];
    const stream = Readable.from(req.file.buffer.toString());
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          // Assume email column is named 'email' or first column
          const email = row.email || row.Email || Object.values(row)[0] as string;
          if (email && email.includes('@')) {
            emails.push(email.trim());
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid emails found in CSV' });
    }

    const startDate = new Date(startTime);
    const delayBetween = parseInt(delayMs) || 2000;
    const maxPerHour = parseInt(hourlyLimit) || 200;

    // Schedule emails
    const scheduledEmails = [];
    let currentTime = startDate.getTime();

    for (let i = 0; i < emails.length; i++) {
      const email = await prisma.email.create({
        data: {
          userId,
          senderId: sender.id,
          toEmail: emails[i],
          subject,
          body,
          scheduledAt: new Date(currentTime)
        }
      });

      // Add to queue with delay
      const delay = Math.max(0, currentTime - Date.now());
      const job = await emailQueue.add('send-email', {
        emailId: email.id,
        delayMs: delayBetween,
        hourlyLimit: maxPerHour
      }, { delay });

      // Update jobId
      await prisma.email.update({
        where: { id: email.id },
        data: { jobId: job.id?.toString() }
      });

      scheduledEmails.push(email);

      // Calculate next email time
      currentTime += delayBetween;
    }

    res.json({
      message: `${emails.length} emails scheduled`,
      count: emails.length,
      startTime: startTime,
      delayMs: delayBetween,
      hourlyLimit: maxPerHour
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/scheduled', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const emails = await prisma.email.findMany({
      where: { userId, status: 'scheduled' },
      include: { sender: true },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const emails = await prisma.email.findMany({
      where: { userId, status: 'sent' },
      include: { sender: true },
      orderBy: { sentAt: 'desc' }
    });

    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/senders', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const senders = await prisma.sender.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(senders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/senders', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const { fromEmail, fromName } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!fromEmail || !fromName) {
      return res.status(400).json({ error: 'fromEmail and fromName are required' });
    }

    // Check if sender already exists for this user
    const existingSender = await prisma.sender.findFirst({
      where: { userId, fromEmail }
    });

    if (existingSender) {
      return res.status(400).json({ error: 'Sender with this email already exists' });
    }

    const sender = await prisma.sender.create({
      data: {
        userId,
        fromEmail,
        fromName
      }
    });

    res.json(sender);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
