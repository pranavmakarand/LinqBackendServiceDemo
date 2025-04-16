const express = require('express');
const authMiddleware = require('../middleware/auth');

const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact
} = require('../controllers/contactController');

const {
  contactGetLimiter,
  contactDetailLimiter,
  contactPostLimiter,
  contactPutLimiter,
  contactDeleteLimiter
} = require('../middleware/rateLimiter');

const router = express.Router();

const noteRoutes = require('./notes');

router.use(authMiddleware);

console.log("hello");

router.get('/', contactGetLimiter, getContacts);
router.get('/:id', contactDetailLimiter, getContactById);
router.post('/', contactPostLimiter, createContact);
router.put('/:id', contactPutLimiter, updateContact);
router.delete('/:id', contactDeleteLimiter, deleteContact);

router.use('/:id/notes', noteRoutes);

module.exports = router;