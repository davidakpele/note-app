/**
 * Integration tests — Rate Limiting
 *
 * Uses createApp() with tiny limits (globalMax: 3, writeMax: 2)
 * so we can trigger 429s with a handful of requests — no mocking needed.
 *
 * The service IS mocked so no database is required.
 */
jest.mock('../../src/services/notesService');

const request      = require('supertest');
const createApp    = require('../../src/app');
const notesService = require('../../src/services/notesService');

const mockNote = {
  id:         'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title:      'Test Note',
  content:    'Hello world',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fire `count` requests sequentially and return all responses.
 */
const fireRequests = async (app, method, url, body, count) => {
  const responses = [];
  for (let i = 0; i < count; i++) {
    const req = request(app)[method](url);
    if (body) req.send(body);
    responses.push(await req);
  }
  return responses;
};

const lastOf = (arr) => arr[arr.length - 1];

describe('Global rate limiter', () => {
  let app;

  beforeEach(() => {
    app = createApp({ globalMax: 3, writeMax: 20 });
    jest.clearAllMocks();
  });

  it('allows requests up to the global limit', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const responses = await fireRequests(app, 'get', '/api/notes', null, 3);

    responses.forEach((res) => expect(res.statusCode).toBe(200));
  });

  it('returns 429 after exceeding the global limit', async () => {
    notesService.getAllNotes.mockResolvedValue([]);
    const responses = await fireRequests(app, 'get', '/api/notes', null, 4);

    expect(lastOf(responses).statusCode).toBe(429);
  });

  it('429 response has correct JSON error shape', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const responses = await fireRequests(app, 'get', '/api/notes', null, 4);
    const blocked   = lastOf(responses);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toMatchObject({
      status:     'error',
      statusCode: 429,
      error:      'Too Many Requests',
      message:    expect.stringContaining('Too many requests'),
    });
    expect(blocked.body.timestamp).toBeDefined();
  });

  it('sets RateLimit-* headers on responses', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const res = await request(app).get('/api/notes');

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('decrements RateLimit-Remaining with each request', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const [first, second] = await fireRequests(app, 'get', '/api/notes', null, 2);

    const remaining1 = parseInt(first.headers['ratelimit-remaining']);
    const remaining2 = parseInt(second.headers['ratelimit-remaining']);

    expect(remaining2).toBe(remaining1 - 1);
  });

  it('does not expose X-RateLimit legacy headers', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const res = await request(app).get('/api/notes');

    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    expect(res.headers['x-ratelimit-remaining']).toBeUndefined();
  });
});

describe('Write rate limiter — POST /api/notes', () => {
  let app;

  beforeEach(() => {
    app = createApp({ globalMax: 100, writeMax: 2 });
    jest.clearAllMocks();
  });

  it('allows write requests up to the write limit', async () => {
    notesService.createNote.mockResolvedValue(mockNote);

    const responses = await fireRequests(
      app, 'post', '/api/notes',
      { title: 'Note', content: 'Body' }, 2
    );

    responses.forEach((res) => expect(res.statusCode).toBe(201));
  });

  it('returns 429 after exceeding the write limit', async () => {
    notesService.createNote.mockResolvedValue(mockNote);

    // 2 allowed + 1 over = 3 total
    const responses = await fireRequests(
      app, 'post', '/api/notes',
      { title: 'Note', content: 'Body' }, 3
    );

    expect(lastOf(responses).statusCode).toBe(429);
  });

  it('429 body contains write-specific message', async () => {
    notesService.createNote.mockResolvedValue(mockNote);

    const responses = await fireRequests(
      app, 'post', '/api/notes',
      { title: 'Note', content: 'Body' }, 3
    );

    expect(lastOf(responses).body.message).toContain('write requests');
  });
});

describe('Write rate limiter — PUT /api/notes/:id', () => {
  let app;

  beforeEach(() => {
    app = createApp({ globalMax: 100, writeMax: 2 });
    jest.clearAllMocks();
  });

  it('returns 429 after exceeding the write limit on PUT', async () => {
    notesService.updateNote.mockResolvedValue(mockNote);

    const responses = await fireRequests(
      app, 'put', `/api/notes/${mockNote.id}`,
      { title: 'Updated', content: 'Body' }, 3
    );

    expect(lastOf(responses).statusCode).toBe(429);
  });
});

describe('Write rate limiter — DELETE /api/notes/:id', () => {
  let app;

  beforeEach(() => {
    app = createApp({ globalMax: 100, writeMax: 2 });
    jest.clearAllMocks();
  });

  it('returns 429 after exceeding the write limit on DELETE', async () => {
    notesService.deleteNote.mockResolvedValue(undefined);

    const responses = await fireRequests(
      app, 'delete', `/api/notes/${mockNote.id}`,
      null, 3
    );

    expect(lastOf(responses).statusCode).toBe(429);
  });
});

describe('GET routes are not affected by write limiter', () => {
  let app;

  beforeEach(() => {
    app = createApp({ globalMax: 100, writeMax: 1 });
    jest.clearAllMocks();
  });

  it('GET /api/notes is not blocked by the write limiter', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    const responses = await fireRequests(app, 'get', '/api/notes', null, 5);

    responses.forEach((res) => expect(res.statusCode).toBe(200));
  });

  it('GET /api/notes/:id is not blocked by the write limiter', async () => {
    notesService.getNoteById.mockResolvedValue(mockNote);

    const responses = await fireRequests(
      app, 'get', `/api/notes/${mockNote.id}`, null, 5
    );

    responses.forEach((res) => expect(res.statusCode).toBe(200));
  });
});
