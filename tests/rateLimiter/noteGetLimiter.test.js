const request = require('supertest');
const express = require('express');
const { noteGetLimiter } = require('../../middleware/rateLimiter');

describe('noteGetLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use((req, res, next) => {
      req.userId = 'user-1'; // Simulated user
      next();
    });
    app.use(noteGetLimiter);
    app.get('/', (req, res) => res.status(200).send('Notes retrieved'));
  });

  it('should allow GET requests within the rate limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
    }
  });

  it('should block GET requests after exceeding the rate limit', async () => {
    for (let i = 0; i < 11; i++) {
      await request(app).get('/');
    }

    const res = await request(app).get('/');
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
});
