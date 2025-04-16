const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, //UUID primary key
    primaryKey: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Contacts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Note;