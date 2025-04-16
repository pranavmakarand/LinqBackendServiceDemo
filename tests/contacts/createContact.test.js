const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../routes/contacts');

//Mock auth middleware (returns req.userId = 1)
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

//Mock Sequelize to avoid env-related failures
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
  create: jest.fn()
}));

const Contact = require('../../models/contact');

describe('POST /contacts', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/contacts', contactRoutes); // route uses mocked auth
  });

  afterEach(() => jest.clearAllMocks());

  it('should return 400 if request body is empty', async () => {
    const res = await request(app).post('/contacts').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/request body cannot be empty/i);
  });

  it('should return 400 if name and email are missing', async () => {
    const res = await request(app).post('/contacts').send({ phone: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.details).toEqual({
      name: 'Name is required',
      email: 'Email is required'
    });
  });

  it('should create a contact successfully', async () => {
    const mockContact = {
      id: 1,
      name: 'Jane',
      email: 'jane@example.com',
      phone: '1234567890',
      created_by: 1
    };

    Contact.create.mockResolvedValue(mockContact);

    const res = await request(app).post('/contacts').send({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '1234567890'
    });

    expect(res.statusCode).toBe(201);
    expect(Contact.create).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '1234567890',
      created_by: 1
    });
    expect(res.body).toEqual(mockContact);
  });

  it('should return 500 if contact creation fails', async () => {
    Contact.create.mockRejectedValue(new Error('DB failure'));

    const res = await request(app).post('/contacts').send({
      name: 'Jane',
      email: 'jane@example.com'
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/server error/i);
  });
});
