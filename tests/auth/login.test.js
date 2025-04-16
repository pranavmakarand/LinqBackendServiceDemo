const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');

jest.mock('../../models/user', () => ({
  findOne: jest.fn()
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));
jest.mock('../../utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn()
}));

const bcrypt = require('bcrypt');
const User = require('../../models/user');
const { signAccessToken, signRefreshToken } = require('../../utils/jwt');

describe('POST /auth/login', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid credentials (user not found)', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/auth/login').send({
      email: 'missing@example.com',
      password: 'wrongpass'
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should return 401 for invalid password', async () => {
    User.findOne.mockResolvedValue({ email: 'user@example.com', password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false); // invalid password

    const res = await request(app).post('/auth/login').send({
      email: 'user@example.com',
      password: 'wrongpass'
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should login user and return tokens', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      password: 'hashed',
      update: jest.fn()
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    signAccessToken.mockReturnValue('access-token');
    signRefreshToken.mockReturnValue('refresh-token');

    const res = await request(app).post('/auth/login').send({
      email: 'user@example.com',
      password: 'correctpass'
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });

    expect(mockUser.update).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
  });
});