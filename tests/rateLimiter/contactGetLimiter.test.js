const request = require('supertest');
const express = require('express');
const { contactGetLimiter } = require('../../middleware/rateLimiter');

describe('contactGetLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use((req, res, next) => {
      req.userId = 'user-1';
      next();
    });
    app.use(contactGetLimiter);
    app.get('/', (req, res) => res.send('OK'));
  });

  it('should allow requests within limit', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  it('should block after limit exceeded', async () => {
    for (let i = 0; i < 61; i++) await request(app).get('/');
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(429);
  });
});
