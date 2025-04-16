const Note = require('../models/notes');
const noteQueue = require('../utils/noteQueue');

// Helper to normalize note fields
const normalizeNoteInput = (input) => {
  return {
    body: input.body || input.note_body || input.noteText || input.noteTextBody
  };
};

// Create Note for a Contact
exports.createNote = async (req, res) => {

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Invalid request: request body cannot be empty' });
  }

  const { id: contactId } = req.params;
  const noteData = normalizeNoteInput(req.body);

  if (!contactId || contactId.trim() === '') {
    return res.status(400).json({ error: 'Contact ID (path parameter) is required' });
  }

  if (!noteData.body) {
    return res.status(400).json({ error: 'Note body is required' });
  }

  try {
    const note = await Note.create({
      ...noteData,
      contactId
    });

    console.log('✅ Note created in DB:', note.id);

    await noteQueue.add('note.created', {
      noteId: note.id,
      contactId: note.contactId,
      userId: note.created_by,
      body: note.body
    }, {
      attempts: 3, //max retries
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true, // auto-cleanup
      removeOnFail: false     // keep failed jobs so we can inspect them
    });

    console.log('Job added to queue');

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

// Get all notes for a contact
exports.getNotesForContact = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: {
        contactId: req.params.id
      }
    });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

exports.getNoteById = async (req, res) => {
  const { noteId } = req.params;

  try {
    const note = await Note.findByPk(noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(200).json(note);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

// Update Note for a Contact
exports.updateNote = async (req, res) => {

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Invalid request: request body cannot be empty' });
  }

  const { noteId } = req.params;

  const normalized = normalizeNoteInput(req.body);

  if (!noteId || noteId.trim() === '') {
    return res.status(400).json({ error: 'Note ID (path parameter) is required' });
  }

  if (!normalized.body) {
    return res.status(400).json({ error: 'Note body is required' });
  }

  try {

    const [updatedCount] = await Note.update(normalized, {
      where: { id: noteId }
    });

    if (!updatedCount) {
      return res.status(404).json({ error: 'Note not found or not updated' });
    }

    // 2. Fetch the updated note for job context
    const updatedNote = await Note.findByPk(noteId);

    // 3. Add async job to queue
    await noteQueue.add('note.updated', {
      noteId: updatedNote.id,
      contactId: updatedNote.contactId,
      userId: updatedNote.updated_by, // assuming you handle this field
      body: updatedNote.body
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });

    console.log('Update job queued for note:', noteId);

    const updatNote = await Contact.findOne({
      where: { id: req.params.id, created_by: req.userId }
    });

    return res.status(201).json(updatNote);

  } catch (err) {
    console.error('Note update failed:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {

  try {
    const deleted = await Note.destroy({
      where: {
        id: req.params.noteId
      }
    });

    if (!deleted) return res.status(404).json({ error: 'Note not found or not authorized' });

    return res.status(204).send();

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};