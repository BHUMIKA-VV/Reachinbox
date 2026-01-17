import { PrismaClient } from '@prisma/client';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import './worker'; // Start the worker

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
