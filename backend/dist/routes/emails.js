"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const worker_1 = require("../worker");
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = express_1.default.Router();
router.post('/schedule', upload.single('csvFile'), async (req, res) => {
    try {
        const { senderId, subject, body, startTime, delayMs, hourlyLimit } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required' });
        }
        // Validate sender belongs to user
        const sender = await index_1.prisma.sender.findFirst({
            where: { id: parseInt(senderId), userId }
        });
        if (!sender) {
            return res.status(400).json({ error: 'Invalid sender' });
        }
        // Parse CSV
        const emails = [];
        const stream = stream_1.Readable.from(req.file.buffer.toString());
        await new Promise((resolve, reject) => {
            stream
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                // Assume email column is named 'email' or first column
                const email = row.email || row.Email || Object.values(row)[0];
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
            const email = await index_1.prisma.email.create({
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
            const job = await worker_1.emailQueue.add('send-email', {
                emailId: email.id,
                delayMs: delayBetween,
                hourlyLimit: maxPerHour
            }, { delay });
            // Update jobId
            await index_1.prisma.email.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/scheduled', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const emails = await index_1.prisma.email.findMany({
            where: { userId, status: 'scheduled' },
            include: { sender: true },
            orderBy: { scheduledAt: 'asc' }
        });
        res.json(emails);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/sent', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const emails = await index_1.prisma.email.findMany({
            where: { userId, status: 'sent' },
            include: { sender: true },
            orderBy: { sentAt: 'desc' }
        });
        res.json(emails);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/senders', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const senders = await index_1.prisma.sender.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(senders);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/senders', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { fromEmail, fromName } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!fromEmail || !fromName) {
            return res.status(400).json({ error: 'fromEmail and fromName are required' });
        }
        // Check if sender already exists for this user
        const existingSender = await index_1.prisma.sender.findFirst({
            where: { userId, fromEmail }
        });
        if (existingSender) {
            return res.status(400).json({ error: 'Sender with this email already exists' });
        }
        const sender = await index_1.prisma.sender.create({
            data: {
                userId,
                fromEmail,
                fromName
            }
        });
        res.json(sender);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=emails.js.map