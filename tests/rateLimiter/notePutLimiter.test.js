const request = require('supertest');
const express = require('express');
const { notePutLimiter } = require('../../middleware/rateLimiter');

describe('notePutLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.userId = 'user-1'; // Simulate authenticated user
      next();
    });
    app.use(notePutLimiter);
    app.put('/', (req, res) => res.status(200).send('Note updated'));
  });

  it('should allow PUT requests within the rate limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).put('/').send({ note: `update-${i}` });
      expect(res.statusCode).toBe(200);
    }
  });

  it('should block PUT requests after exceeding the rate limit', async () => {
    for (let i = 0; i < 21; i++) {
      await request(app).put('/').send({ note: `update-${i}` });
    }

    const res = await request(app).put('/').send({ note: 'final' });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
});
