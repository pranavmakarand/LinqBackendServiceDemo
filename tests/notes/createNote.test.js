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
  create: jest.fn()
}));

// Mock noteQueue
jest.mock('../../utils/noteQueue', () => ({
  add: jest.fn()
}));

const Note = require('../../models/notes');
const noteQueue = require('../../utils/noteQueue');

describe('POST /contacts/:id/notes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/contacts/:id/notes', noteRoutes);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return 400 if body is empty', async () => {
    const res = await request(app).post('/contacts/1/notes').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/request body cannot be empty/i);
  });

  it('should return 400 if contactId is missing or invalid', async () => {
    const res = await request(app).post('/contacts/   /notes').send({ body: 'Hello' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/contact id.*required/i);
  });

  it('should return 400 if note body is missing', async () => {
    const res = await request(app).post('/contacts/1/notes').send({ noteTextBody: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/note body is required/i);
  });

  it('should create a note and queue a job', async () => {
    const mockNote = {
      id: 1,
      body: 'This is a test note',
      contactId: 1,
      created_by: 1
    };

    Note.create.mockResolvedValue(mockNote);

    const res = await request(app)
      .post('/contacts/1/notes')
      .send({ body: 'This is a test note' });

    expect(res.statusCode).toBe(201);
    expect(Note.create).toHaveBeenCalledWith({
      body: 'This is a test note',
      contactId: '1'
    });

    expect(noteQueue.add).toHaveBeenCalledWith('note.created', {
      noteId: 1,
      contactId: 1,
      userId: 1,
      body: 'This is a test note'
    }, expect.any(Object));
  });

  it('should return 500 if note creation fails', async () => {
    Note.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/contacts/1/notes')
      .send({ body: 'Note text' });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to create note/i);
  });
});