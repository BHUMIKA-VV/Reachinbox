"use strict";

const { Worker, Queue } = require("bullmq");
const Redis = require("ioredis");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Redis connection (shared, TLS-safe)
 */
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

const isTLS = process.env.REDIS_URL.startsWith("rediss://");

const redisConnection = new Redis(process.env.REDIS_URL, {
  ...(isTLS ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
});

/**
 * Queue
 */
const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
});

/**
 * Worker
 */
const worker = new Worker(
  "email-queue",
  async (job) => {
    const { emailId, delayMs, hourlyLimit } = job.data;

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { sender: true, user: true },
    });

    if (!email || email.status !== "scheduled") {
      console.log(`Email ${emailId} already processed or not found`);
      return;
    }

    /**
     * Rate limiting (per sender per hour)
     */
    const hourWindow = new Date().toISOString().slice(0, 13).replace("T", "-");
    const rateLimitKey = `rate:${email.senderId}:${hourWindow}`;

    const currentCount = await redisConnection.incr(rateLimitKey);

    if (currentCount === 1) {
      await redisConnection.expire(rateLimitKey, 7200); // 2 hours
    }

    const maxEmails =
      hourlyLimit ||
      parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || "200");

    if (currentCount > maxEmails) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

      const delay = nextHour.getTime() - Date.now();

      await emailQueue.add(
        "send-email",
        { emailId, delayMs, hourlyLimit },
        { delay }
      );

      console.log(
        `Rate limit exceeded for sender ${email.senderId}, re-queued for ${nextHour.toISOString()}`
      );
      return;
    }

    /**
     * Mark sending
     */
    await prisma.email.update({
      where: { id: emailId },
      data: { status: "sending" },
    });

    try {
      /**
       * SMTP (CORRECT TLS CONFIG)
       */
      const transporter = nodemailer.createTransport({
        host: process.env.ETHEREAL_HOST || "smtp.ethereal.email",
        port: Number(process.env.ETHEREAL_PORT || 587),
        secure: false, // MUST be false for port 587
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"${email.sender.fromName}" <${email.sender.fromEmail}>`,
        to: email.toEmail,
        subject: email.subject,
        text: email.body,
        html: email.body.replace(/\n/g, "<br>"),
      });

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });

      console.log(`Email sent: ${info.messageId}`);
      console.log(
        `Preview URL: ${nodemailer.getTestMessageUrl(info)}`
      );
    } catch (error) {
      console.error(`Failed to send email ${emailId}:`, error);

      await prisma.email.update({
        where: { id: emailId },
        data: { status: "failed" },
      });

      throw error; // BullMQ retry handling
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("✅ Email worker started");
