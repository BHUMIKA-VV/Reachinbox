import { Worker, Queue } from "bullmq";
import redis from "./lib/redis";

export const emailQueue = new Queue("email-queue", { connection: redis });

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    console.log("Processing job:", job.id);
  },
  {
    connection: redis,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  }
);
