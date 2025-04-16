const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../routes/contacts');

// Mock auth middleware
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

// Mock Sequelize to avoid real DB
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    Sequelize: jest.fn().mockImplementation(() => ({
      define: jest.fn(() => ({}))
    })),
    DataTypes: actual.DataTypes
  };
});

// Mock Contact model
jest.mock('../../models/contact', () => ({
  findOne: jest.fn()
}));

const Contact = require('../../models/contact');

describe('GET /contacts/:id', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/contacts', contactRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return 404 if contact is not found', async () => {
    Contact.findOne.mockResolvedValue(null);

    const res = await request(app).get('/contacts/99');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
    expect(Contact.findOne).toHaveBeenCalledWith({
      where: { id: '99', created_by: 1 }
    });
  });

  it('should return contact if found', async () => {
    const mockContact = { id: 1, name: 'Jane', email: 'jane@test.com', created_by: 1 };

    Contact.findOne.mockResolvedValue(mockContact);

    const res = await request(app).get('/contacts/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockContact);
  });

  it('should return 500 if an error occurs', async () => {
    Contact.findOne.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/contacts/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch contact/i);
  });
});