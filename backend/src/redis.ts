import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

const isTLS = process.env.REDIS_URL.startsWith("rediss://");

export const redis = new Redis(process.env.REDIS_URL, {
  ...(isTLS ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
});

export const connection = {
  url: process.env.REDIS_URL,
};
