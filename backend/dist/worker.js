"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("./lib/redis"));
exports.emailWorker = new bullmq_1.Worker("email-queue", async (job) => {
    console.log("Processing email job:", job.id, job.data);
}, {
    connection: redis_1.default,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
});
//# sourceMappingURL=worker.js.map