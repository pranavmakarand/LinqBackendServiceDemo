const request = require('supertest');
const express = require('express');
const { notePostLimiter } = require('../../middleware/rateLimiter');

describe('notePostLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.userId = 'user-1'; // Simulate authenticated user
      next();
    });
    app.use(notePostLimiter);
    app.post('/', (req, res) => res.status(200).send('Note created'));
  });

  it('should allow POST requests within the rate limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/').send({ body: `note-${i}` });
      expect(res.statusCode).toBe(200);
    }
  });

  it('should block POST requests after exceeding the rate limit', async () => {
    for (let i = 0; i < 31; i++) {
      await request(app).post('/').send({ body: `note-${i}` });
    }

    const res = await request(app).post('/').send({ body: 'final note' });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
});
