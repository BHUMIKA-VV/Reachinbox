import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL!, {
  tls: {
    rejectUnauthorized: false
  },
  maxRetriesPerRequest: null,
});

export default redis;
