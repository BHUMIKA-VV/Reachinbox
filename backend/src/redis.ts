import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

export const redis = new Redis(process.env.REDIS_URL, {
  tls: {},                // REQUIRED for Redis Cloud
  maxRetriesPerRequest: null,
});

export const connection = {
  url: process.env.REDIS_URL!,
  tls: {},
};
