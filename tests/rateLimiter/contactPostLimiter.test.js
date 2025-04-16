const request = require('supertest');
const express = require('express');
const { contactPostLimiter } = require('../../middleware/rateLimiter');

describe('contactPostLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.userId = 'user-1';
      next();
    });
    app.use(contactPostLimiter);
    app.post('/', (req, res) => res.send('Created'));
  });

  it('should allow POSTs within limit', async () => {
    const res = await request(app).post('/').send({});
    expect(res.statusCode).toBe(200);
  });

  it('should block after limit', async () => {
    for (let i = 0; i < 21; i++) await request(app).post('/').send({});
    const res = await request(app).post('/').send({});
    expect(res.statusCode).toBe(429);
  });
});
