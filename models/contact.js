const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // generates random UUID
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Contact;