import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL as string);
export default redis;
