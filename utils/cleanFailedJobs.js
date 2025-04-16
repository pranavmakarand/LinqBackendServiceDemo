const noteQueue = require('../queues/noteQueue');

//This is to clean all the failed jobs

async function removeOldFailedJobs() {
  const now = Date.now();
  const failedJobs = await noteQueue.getFailed();

  for (const job of failedJobs) {
    const age = now - job.timestamp;

    if (age > 24 * 60 * 60 * 1000) { // 24 hours in ms
      console.log(`🧹 Removing failed job #${job.id} (age: ${Math.floor(age / 1000)}s)`);
      await job.remove();
    }
  }
}

async function cleanNoteQueueStates() {
  const states = ['failed', 'completed', 'delayed', 'wait', 'active'];

  for (const state of states) {
    const cleaned = await noteQueue.clean(0, 1000, state); // age=0ms, up to 1000 jobs
    console.log(`🧼 Cleaned ${cleaned.length} ${state} jobs`);
  }
}

// (async () => {
//   try {
//     console.log('🚀 Starting BullMQ cleanup...');
//     await removeOldFailedJobs();
//     await cleanNoteQueueStates();
//     console.log('✅ Queue cleanup complete');
//   } catch (err) {
//     console.error('❌ Cleanup failed:', err.message);
//   } finally {
//     process.exit(0);
//   }
// })();