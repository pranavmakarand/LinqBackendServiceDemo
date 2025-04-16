const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');

jest.mock('../../models/user', () => ({
  create: jest.fn()
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));
jest.mock('../../utils/jwt');

const bcrypt = require('bcrypt');
const User = require('../../models/user');

describe('POST /auth/register', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
    bcrypt.hash.mockResolvedValue('hashed-password');
    User.create.mockResolvedValue({ id: 1, email: 'test@example.com' });

    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(User.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'hashed-password'
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 1, email: 'test@example.com' });
  });

  it('should return 400 if email or password is missing', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should return 400 if user creation fails (e.g. duplicate)', async () => {
    bcrypt.hash.mockResolvedValue('hashed-password');
    User.create.mockRejectedValue(new Error('Duplicate'));

    const res = await request(app).post('/auth/register').send({
      email: 'existing@example.com',
      password: 'password123'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exists|invalid input/i);
  });
});
