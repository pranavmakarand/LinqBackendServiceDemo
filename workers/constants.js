// constants.js

module.exports = {
    NOTE_JOB_QUEUE_NAME: 'note-jobs',
    NOTE_JOB_MAX_RETRIES: 2,
    NOTE_JOB_ATTEMPTS: 3,
    NOTE_JOB_BACKOFF_DELAY: 2000,
    NOTE_JOB_TYPES: ['note.created', 'note.updated']
  };