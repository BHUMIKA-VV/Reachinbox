import { Worker, Job, Queue } from 'bullmq';
import nodemailer from 'nodemailer';
import { prisma } from './index';
import { redis, connection } from './redis';

export const emailQueue = new Queue("emails", { connection });

export const emailWorker = new Worker(
  "emails",
  async (job: Job) => {
    const { emailId } = job.data;

    // Check DB status
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { sender: true, user: true }
    });

    if (!email || email.status !== 'scheduled') {
      console.log(`Email ${emailId} already processed or not found`);
      return;
    }

    // Check rate limit
    const hourWindow = new Date().toISOString().slice(0, 13).replace('T', '-'); // YYYY-MM-DD-HH
    const rateLimitKey = `rate:${email.senderId}:${hourWindow}`;

    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      // Set TTL to 2 hours
      await redis.expire(rateLimitKey, 7200);
    }

    const maxEmailsPerHour = job.data.hourlyLimit || parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200');

    if (currentCount > maxEmailsPerHour) {
      // Calculate next hour start
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const delay = nextHour.getTime() - Date.now();

      // Re-add job with delay
      await emailQueue.add('send-email', { emailId, delayMs: job.data.delayMs, hourlyLimit: job.data.hourlyLimit }, { delay });
      console.log(`Rate limit exceeded for sender ${email.senderId}, re-queuing for ${nextHour.toISOString()}`);
      return;
    }

    // Update status to sending
    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'sending' }
    });

    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS
        }
      });

      // Send email
      const info = await transporter.sendMail({
        from: `"${email.sender.fromName}" <${email.sender.fromEmail}>`,
        to: email.toEmail,
        subject: email.subject,
        text: email.body,
        html: email.body.replace(/\n/g, '<br>')
      });

      // Update to sent
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

      console.log(`Email sent: ${info.messageId}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error(`Failed to send email ${emailId}:`, error);
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'failed' }
      });
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
      max: 1,
      duration: parseInt(process.env.EMAIL_DELAY_MS || '2000')
    }
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed:`, err.message);
});

console.log('Email worker started');

export { emailQueue };
