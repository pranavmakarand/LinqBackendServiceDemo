const request = require('supertest');
const express = require('express');
const { contactDeleteLimiter } = require('../../middleware/rateLimiter');

describe('contactDeleteLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use((req, res, next) => {
      req.userId = 'user-1'; // Simulate a user
      next();
    });
    app.use(contactDeleteLimiter);
    app.delete('/', (req, res) => res.status(200).send('Deleted'));
  });

  it('should allow DELETE requests within the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).delete('/');
      expect(res.statusCode).toBe(200);
    }
  });

  it('should block DELETE requests after exceeding the limit', async () => {
    for (let i = 0; i < 11; i++) {
      await request(app).delete('/');
    }

    const res = await request(app).delete('/');
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
});
