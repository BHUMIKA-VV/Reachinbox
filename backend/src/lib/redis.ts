import IORedis from "ioredis";

const redis = new IORedis(process.env.REDIS_URL as string);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default redis;
