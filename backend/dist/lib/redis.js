"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not set");
}
const redis = new ioredis_1.default(process.env.REDIS_URL, {
    tls: {
        rejectUnauthorized: false
    },
    maxRetriesPerRequest: null
});
redis.on("error", (err) => {
    console.error("Redis error:", err);
});
exports.default = redis;
//# sourceMappingURL=redis.js.map