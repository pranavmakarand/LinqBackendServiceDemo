const { Queue, connection } = require('../db/redis');

const noteQueue = new Queue('note-jobs', { connection });

module.exports = noteQueue;