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
  findAll: jest.fn()
}));

const Note = require('../../models/notes');

describe('GET /contacts/:id/notes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/contacts/:id/notes', noteRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return notes for a given contact ID', async () => {
    const mockNotes = [
      { id: 1, body: 'Note A', contactId: 1 },
      { id: 2, body: 'Note B', contactId: 1 }
    ];

    Note.findAll.mockResolvedValue(mockNotes);

    const res = await request(app).get('/contacts/1/notes');

    expect(res.statusCode).toBe(200);
    expect(Note.findAll).toHaveBeenCalledWith({
      where: { contactId: '1' }
    });
    expect(res.body).toEqual(mockNotes);
  });

  it('should return 500 if database call fails', async () => {
    Note.findAll.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/contacts/1/notes');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch notes/i);
  });
});