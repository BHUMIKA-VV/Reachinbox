import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export default redis;
