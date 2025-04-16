const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');

jest.mock('../../models/user', () => ({
  findByPk: jest.fn()
}));
jest.mock('../../utils/jwt', () => ({
  verifyRefreshToken: jest.fn(),
  signAccessToken: jest.fn()
}));

const User = require('../../models/user');
const { verifyRefreshToken, signAccessToken } = require('../../utils/jwt');

describe('POST /auth/refresh', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if refresh token is missing', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing token/i);
  });

  it('should return 403 if token is invalid or expired', async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad.token' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/token expired|invalid/i);
  });

  it('should return 403 if user is not found', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 123 });
    User.findByPk.mockResolvedValue(null);

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'valid.token' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/invalid refresh token/i);
  });

  it('should return 403 if stored refresh token does not match', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 123 });
    User.findByPk.mockResolvedValue({
      id: 123,
      refreshToken: 'different.token'
    });

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'valid.token' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/invalid refresh token/i);
  });

  it('should return a new access token if refresh token is valid and matches user', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 123 });
    User.findByPk.mockResolvedValue({
      id: 123,
      refreshToken: 'valid.token'
    });
    signAccessToken.mockReturnValue('new-access-token');

    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'valid.token' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('new-access-token');
  });
});