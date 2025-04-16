const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../routes/contacts');

// Mock auth middleware
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

// Mock Sequelize
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
  update: jest.fn(),
  findOne: jest.fn()
}));

const Contact = require('../../models/contact');

describe('PUT /contacts/:id', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/contacts', contactRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return 400 if request body is empty', async () => {
    const res = await request(app).put('/contacts/1').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/request body cannot be empty/i);
  });

  it('should return 404 if contact not found', async () => {
    Contact.update.mockResolvedValue([0]);

    const res = await request(app).put('/contacts/99').send({
      name: 'Updated Name'
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('should update contact successfully', async () => {
    const updatedContact = {
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com',
      created_by: 1
    };

    Contact.update.mockResolvedValue([1]);
    Contact.findOne.mockResolvedValue(updatedContact);

    const res = await request(app).put('/contacts/1').send({
      name: 'Updated Name'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(updatedContact);
  });

  it('should return 500 if update fails', async () => {
    Contact.update.mockRejectedValue(new Error('DB error'));

    const res = await request(app).put('/contacts/1').send({
      name: 'Jane'
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to update contact/i);
  });
});
