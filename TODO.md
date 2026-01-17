# Redis Setup Fix - Completed Tasks

- [x] Create centralized redis.ts with correct ioredis setup (REDIS_URL check, tls config)
- [x] Update worker.ts to use centralized redis and connection for BullMQ
- [x] Update emails.ts to use centralized redis and connection for BullMQ
- [x] Remove unused Redis/Queue imports from index.ts
