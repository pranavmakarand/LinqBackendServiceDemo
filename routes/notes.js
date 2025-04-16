const express = require('express');

const authMiddleware = require('../middleware/auth');

const {
  createNote,
  getNotesForContact,
  getNoteById,
  updateNote,
  deleteNote
} = require('../controllers/noteController');

const {
  noteGetLimiter,
  notePostLimiter,
  notePutLimiter,
  noteDeleteLimiter
} = require('../middleware/rateLimiter');

const router = express.Router({ mergeParams: true });

// Apply JWT auth
router.use(authMiddleware);

// Notes under a contact
router.get('/', noteGetLimiter, getNotesForContact); 
router.get('/:noteId', noteGetLimiter, getNoteById); 
router.post('/', notePostLimiter, createNote); 
router.put('/:noteId', notePutLimiter, updateNote); 
router.delete('/:noteId', noteDeleteLimiter, deleteNote);

module.exports = router;