"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_1 = require("./index");
const redis_1 = require("./lib/redis");
exports.emailQueue = new bullmq_1.Queue("emails", { connection: redis_1.redis });
exports.emailWorker = new bullmq_1.Worker("emails", async (job) => {
    const { emailId } = job.data;
    // Check DB status
    const email = await index_1.prisma.email.findUnique({
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
    const currentCount = await redis_1.redis.incr(rateLimitKey);
    if (currentCount === 1) {
        // Set TTL to 2 hours
        await redis_1.redis.expire(rateLimitKey, 7200);
    }
    const maxEmailsPerHour = job.data.hourlyLimit || parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '200');
    if (currentCount > maxEmailsPerHour) {
        // Calculate next hour start
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        const delay = nextHour.getTime() - Date.now();
        // Re-add job with delay
        await exports.emailQueue.add('send-email', { emailId, delayMs: job.data.delayMs, hourlyLimit: job.data.hourlyLimit }, { delay });
        console.log(`Rate limit exceeded for sender ${email.senderId}, re-queuing for ${nextHour.toISOString()}`);
        return;
    }
    // Update status to sending
    await index_1.prisma.email.update({
        where: { id: emailId },
        data: { status: 'sending' }
    });
    try {
        // Create transporter
        const transporter = nodemailer_1.default.createTransport({
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
        await index_1.prisma.email.update({
            where: { id: emailId },
            data: {
                status: 'sent',
                sentAt: new Date()
            }
        });
        console.log(`Email sent: ${info.messageId}`);
        console.log(`Preview URL: ${nodemailer_1.default.getTestMessageUrl(info)}`);
    }
    catch (error) {
        console.error(`Failed to send email ${emailId}:`, error);
        await index_1.prisma.email.update({
            where: { id: emailId },
            data: { status: 'failed' }
        });
        throw error; // Let BullMQ handle retries
    }
}, {
    connection: redis_1.redis,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
        max: 1,
        duration: parseInt(process.env.EMAIL_DELAY_MS || '2000')
    }
});
exports.emailWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});
exports.emailWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed:`, err.message);
});
console.log('Email worker started');
//# sourceMappingURL=worker.js.map