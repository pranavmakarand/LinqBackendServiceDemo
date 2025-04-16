const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../routes/contacts');

// Mock auth middleware
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

// Mock Sequelize to avoid real DB initialization
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    Sequelize: jest.fn().mockImplementation(() => ({
      define: jest.fn(() => ({}))
    })),
    DataTypes: actual.DataTypes
  };
});

//Mock Contact model
jest.mock('../../models/contact', () => ({
  destroy: jest.fn()
}));

const Contact = require('../../models/contact');

describe('DELETE /contacts/:id', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/contacts', contactRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return 404 if no contact is deleted', async () => {
    Contact.destroy.mockResolvedValue(0); // 0 rows deleted

    const res = await request(app).delete('/contacts/999');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
    expect(Contact.destroy).toHaveBeenCalledWith({
      where: { id: '999', created_by: 1 }
    });
  });

  it('should return 204 if contact is deleted successfully', async () => {
    Contact.destroy.mockResolvedValue(1); // 1 row deleted

    const res = await request(app).delete('/contacts/1');

    expect(res.statusCode).toBe(204);
    expect(res.text).toBe('');
  });

  it('should return 500 if deletion fails', async () => {
    Contact.destroy.mockRejectedValue(new Error('DB failure'));

    const res = await request(app).delete('/contacts/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to delete/i);
  });
});
