const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config(); // ✅ Load .env variables

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  maxRetriesPerRequest: null
});

module.exports = {
  Queue,
  Worker,
  connection
};