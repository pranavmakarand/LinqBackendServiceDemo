const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../routes/contacts');

// Mock auth middleware to inject userId
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

// Mock Sequelize to prevent real DB initialization
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
  findAll: jest.fn()
}));

const Contact = require('../../models/contact');

describe('GET /contacts', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/contacts', contactRoutes); // this uses the mocked auth middleware
  });

  afterEach(() => jest.clearAllMocks());

  it('should return a list of contacts for the user', async () => {
    const mockContacts = [
      { id: 1, name: 'Alice', email: 'alice@test.com', created_by: 1 },
      { id: 2, name: 'Bob', email: 'bob@test.com', created_by: 1 }
    ];

    Contact.findAll.mockResolvedValue(mockContacts);

    const res = await request(app).get('/contacts');

    expect(res.statusCode).toBe(200);
    expect(Contact.findAll).toHaveBeenCalledWith({ where: { created_by: 1 } });
    expect(res.body).toEqual(mockContacts);
  });

  it('should return 500 if something goes wrong', async () => {
    Contact.findAll.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/contacts');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch/i);
  });
});