"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not set");
}
const isTLS = process.env.REDIS_URL.startsWith("rediss://");
exports.redis = new ioredis_1.default(process.env.REDIS_URL, {
    ...(isTLS ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
});
exports.connection = {
    url: process.env.REDIS_URL,
};
//# sourceMappingURL=redis.js.map