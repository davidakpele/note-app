/**
 * Unit tests — NotesRepository
 */
jest.mock('../../src/db/pool');

const pool = require('../../src/db/pool');
const notesRepository = require('../../src/repositories/notesRepository');

const mockNote = {
  id:         'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title:      'Test Note',
  content:    'Some content',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('NotesRepository.create', () => {
  it('executes INSERT and returns the new row', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockNote] });

    const result = await notesRepository.create({
      title: 'Test Note',
      content: 'Some content',
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toMatch(/INSERT INTO notes/i);
    expect(result).toEqual(mockNote);
  });

  it('passes null content when omitted', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...mockNote, content: null }] });

    await notesRepository.create({ title: 'No Content' });

    const [, params] = pool.query.mock.calls[0];
    expect(params[1]).toBeNull();
  });
});

describe('NotesRepository.findAll', () => {
  it('executes SELECT and returns all rows', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockNote, mockNote] });

    const result = await notesRepository.findAll();

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toMatch(/SELECT \* FROM notes/i);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when table is empty', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await notesRepository.findAll();
    expect(result).toEqual([]);
  });
});

describe('NotesRepository.findById', () => {
  it('returns the matched row', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockNote] });

    const result = await notesRepository.findById(mockNote.id);

    expect(pool.query.mock.calls[0][1]).toEqual([mockNote.id]);
    expect(result).toEqual(mockNote);
  });

  it('returns null when no row is found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await notesRepository.findById('non-existent-id');
    expect(result).toBeNull();
  });
});

describe('NotesRepository.update', () => {
  it('executes UPDATE and returns the updated row', async () => {
    const updated = { ...mockNote, title: 'Updated' };
    pool.query.mockResolvedValueOnce({ rows: [updated] });

    const result = await notesRepository.update(mockNote.id, {
      title: 'Updated',
      content: 'New content',
    });

    expect(pool.query.mock.calls[0][0]).toMatch(/UPDATE notes/i);
    expect(result.title).toBe('Updated');
  });

  it('returns null when the id does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await notesRepository.update('ghost-id', { title: 'X' });
    expect(result).toBeNull();
  });
});

describe('NotesRepository.delete', () => {
  it('returns true when a row was deleted', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await notesRepository.delete(mockNote.id);
    expect(result).toBe(true);
  });

  it('returns false when no row was deleted', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const result = await notesRepository.delete('ghost-id');
    expect(result).toBe(false);
  });
});
