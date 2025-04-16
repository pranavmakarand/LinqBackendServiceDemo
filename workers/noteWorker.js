const { Worker, connection } = require('../db/redis');
const noteQueue = require('../utils/noteQueue');
const {
  NOTE_JOB_QUEUE_NAME,
  NOTE_JOB_MAX_RETRIES,
  NOTE_JOB_ATTEMPTS,
  NOTE_JOB_BACKOFF_DELAY,
  NOTE_JOB_TYPES
} = require('../constants');

const worker = new Worker(NOTE_JOB_QUEUE_NAME, async job => {
  if (job.name === NOTE_JOB_TYPES[0] || job.name === NOTE_JOB_TYPES[1]) {
    console.log(`⚙️ Processing note #${job.data.noteId}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Note #${job.data.noteId} processed`);
  }
}, { connection });

worker.on('failed', async (job, err) => {
  console.error(`Job ${job.id} failed after ${job.attemptsMade} attempt(s)`);
  console.error('Reason:', err.message);

  const currentRetryCount = job.data.retries || 0;

  if (currentRetryCount < NOTE_JOB_MAX_RETRIES) {
    console.log(`Requeueing job as retry #${currentRetryCount + 1}`);

    await noteQueue.add(job.name, {
      ...job.data,
      retries: currentRetryCount + 1
    }, {
      attempts: NOTE_JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: NOTE_JOB_BACKOFF_DELAY }
    });
  } else {
    console.warn(`Job ${job.id} reached global retry limit. Not requeueing again.`);
  }
});
