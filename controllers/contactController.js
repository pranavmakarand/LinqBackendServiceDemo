const Contact = require('../models/contact');

// Create Contact
exports.createContact = async (req, res) => {

  try {

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Invalid request: request body cannot be empty' });
    }

    const { name, email, phone } = req.body;

    const validationErrors = {};
    if (!name) validationErrors.name = 'Name is required';
    if (!email) validationErrors.email = 'Email is required';

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      created_by: req.userId
    });

    return res.status(201).json(contact);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Server error while creating contact'
    });
  }
};

// Get All Contacts
exports.getContacts = async (req, res) => {

  try {

    if (!req.userId) {
      return res.status(400).json({ error: 'User ID is missing from request' });
    }

    const contacts = await Contact.findAll({ where: { created_by: req.userId } });

    res.status(200).json(contacts);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

// Get Single Contact
exports.getContactById = async (req, res) => {

  try {
    const contact = await Contact.findOne({
      where: { id: req.params.id, created_by: req.userId }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Return result
    res.status(200).json(contact);

  } catch (err) {
    console.error('Error fetching contact:', err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

// Update Contact
exports.updateContact = async (req, res) => {

  try {

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Invalid request: request body cannot be empty' });
    }

    const updated = await Contact.update(req.body, {
      where: { id: req.params.id, created_by: req.userId }
    });

    if (updated[0] === 0) return res.status(404).json({ error: 'Contact Not found' });

    const updatedContact = await Contact.findOne({
      where: { id: req.params.id, created_by: req.userId }
    });

    // 3. Return updated data
    return res.status(201).json(updatedContact);

  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// Delete Contact
exports.deleteContact = async (req, res) => {

  try {
    const deleted = await Contact.destroy({
      where: { id: req.params.id, created_by: req.userId }
    });

    if (deleted === 0) return res.status(404).json({ error: 'Not found or not authorized' });

    return res.status(204).send();

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};