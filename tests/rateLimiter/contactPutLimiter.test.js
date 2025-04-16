const request = require('supertest');
const express = require('express');
const { contactPutLimiter } = require('../../middleware/rateLimiter');

describe('contactPutLimiter middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.userId = 'user-1'; // simulate logged-in user
      next();
    });

    app.use(contactPutLimiter);
    app.put('/', (req, res) => res.send('Updated'));
  });

  it('should allow PUTs within the limit', async () => {
    const res = await request(app).put('/').send({ name: 'John' });
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Updated');
  });

  it('should block PUTs after exceeding the limit', async () => {
    for (let i = 0; i < 21; i++) {
      await request(app).put('/').send({ name: 'John' });
    }

    const res = await request(app).put('/').send({ name: 'John' });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
});