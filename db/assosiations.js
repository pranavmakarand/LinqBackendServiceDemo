const User = require('../models/user');
const Contact = require('../models/contact');
const Note = require('../models/notes');

// User to Contact: One-to-Many
User.hasMany(Contact, { foreignKey: 'created_by' });
Contact.belongsTo(User, { foreignKey: 'created_by' });

// Contact to Note: One-to-Many
Contact.hasMany(Note, { foreignKey: 'contactId' });
Note.belongsTo(Contact, { foreignKey: 'contactId' });