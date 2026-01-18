import { Worker } from "bullmq";
import redis from "./lib/redis";

new Worker(
  "emailQueue",
  async (job) => {
    // process email job here
    console.log("Processing email job", job.data);
  },
  {
    connection: redis,
  }
);
