"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../redis");
exports.emailQueue = new bullmq_1.Queue("emailQueue", {
    connection: redis_1.redis,
});
//# sourceMappingURL=emailQueue.js.map