/**
 * Integration tests — Notes API endpoints
 *
 * The service is mocked so tests cover the full HTTP pipeline
 * (routing → controller → response format → error handling)
 * without touching the database.
 */
jest.mock('../../src/services/notesService');

const request      = require('supertest');
const app          = require('../../src/app');
const notesService = require('../../src/services/notesService');
const AppError     = require('../../src/utils/AppError');

const mockNote = {
  id:         'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title:      'Test Note',
  content:    'Hello world',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/notes', () => {
  it('201 — returns the created note', async () => {
    notesService.createNote.mockResolvedValueOnce(mockNote);

    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test Note', content: 'Hello world' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toMatchObject({ title: 'Test Note' });
    expect(notesService.createNote).toHaveBeenCalledTimes(1);
  });

  it('422 — missing title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ content: 'No title' });

    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('title');
    expect(notesService.createNote).not.toHaveBeenCalled();
  });

  it('422 — whitespace-only title', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: '   ' });

    expect(res.statusCode).toBe(422);
  });

  it('201 — content is optional', async () => {
    notesService.createNote.mockResolvedValueOnce({ ...mockNote, content: null });

    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Title only' });

    expect(res.statusCode).toBe(201);
  });
});

describe('GET /api/notes', () => {
  it('200 — returns list with count', async () => {
    notesService.getAllNotes.mockResolvedValueOnce([mockNote, mockNote]);

    const res = await request(app).get('/api/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — returns empty list when no notes', async () => {
    notesService.getAllNotes.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/notes/:id', () => {
  it('200 — returns the note', async () => {
    notesService.getNoteById.mockResolvedValueOnce(mockNote);

    const res = await request(app).get(`/api/notes/${mockNote.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(mockNote.id);
  });

  it('404 — note not found', async () => {
    notesService.getNoteById.mockRejectedValueOnce(
      new AppError('Note not found', 404)
    );

    const res = await request(app).get(
      '/api/notes/00000000-0000-0000-0000-000000000000'
    );

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('400 — invalid UUID format', async () => {
    const pgError = new Error('invalid input syntax');
    pgError.code  = '22P02';
    notesService.getNoteById.mockRejectedValueOnce(pgError);

    const res = await request(app).get('/api/notes/not-a-uuid');

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/notes/:id', () => {
  it('200 — returns updated note', async () => {
    const updated = { ...mockNote, title: 'Updated Title' };
    notesService.updateNote.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put(`/api/notes/${mockNote.id}`)
      .send({ title: 'Updated Title', content: 'New body' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('404 — note not found', async () => {
    notesService.updateNote.mockRejectedValueOnce(
      new AppError('Note not found', 404)
    );

    const res = await request(app)
      .put('/api/notes/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Ghost' });

    expect(res.statusCode).toBe(404);
  });

  it('422 — title missing on update', async () => {
    const res = await request(app)
      .put(`/api/notes/${mockNote.id}`)
      .send({ content: 'no title' });

    expect(res.statusCode).toBe(422);
  });
});

describe('DELETE /api/notes/:id', () => {
  it('200 — deletes the note', async () => {
    notesService.deleteNote.mockResolvedValueOnce(undefined);

    const res = await request(app).delete(`/api/notes/${mockNote.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(notesService.deleteNote).toHaveBeenCalledWith(mockNote.id);
  });

  it('404 — note not found', async () => {
    notesService.deleteNote.mockRejectedValueOnce(
      new AppError('Note not found', 404)
    );

    const res = await request(app).delete(
      '/api/notes/00000000-0000-0000-0000-000000000000'
    );

    expect(res.statusCode).toBe(404);
  });
});

describe('Unknown routes', () => {
  it('404 for unregistered paths', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toBe(404);
  });
});