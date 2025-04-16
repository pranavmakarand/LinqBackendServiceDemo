const request = require('supertest');
const express = require('express');
const noteRoutes = require('../../routes/notes');

// Mock auth middleware
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.userId = 1;
  next();
});

// Mock Sequelize
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    Sequelize: jest.fn().mockImplementation(() => ({
      define: jest.fn(() => ({}))
    })),
    DataTypes: actual.DataTypes
  };
});

// Mock Note model
jest.mock('../../models/notes', () => ({
  findByPk: jest.fn()
}));

const Note = require('../../models/notes');

describe('GET /notes/:noteId', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/notes', noteRoutes); // assume note routes are mounted on /notes
  });

  afterEach(() => jest.clearAllMocks());

  it('should return note if it exists', async () => {
    const mockNote = {
      id: 1,
      body: 'Test note',
      contactId: 1
    };

    Note.findByPk.mockResolvedValue(mockNote);

    const res = await request(app).get('/notes/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockNote);
    expect(Note.findByPk).toHaveBeenCalledWith('1');
  });

  it('should return 404 if note is not found', async () => {
    Note.findByPk.mockResolvedValue(null);

    const res = await request(app).get('/notes/999');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/note not found/i);
  });

  it('should return 500 if database fails', async () => {
    Note.findByPk.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/notes/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch note/i);
  });
});