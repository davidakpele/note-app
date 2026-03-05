/**
 * Unit tests — NotesService

 */
jest.mock('../../src/repositories/notesRepository');

const notesRepository = require('../../src/repositories/notesRepository');
const notesService    = require('../../src/services/notesService');
const AppError        = require('../../src/utils/AppError');

const mockNote = {
  id:         'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title:      'Test Note',
  content:    'Some content',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());
describe('NotesService.createNote', () => {
  it('trims input and calls repository.create', async () => {
    notesRepository.create.mockResolvedValueOnce(mockNote);

    const result = await notesService.createNote({
      title:   '  Test Note  ',
      content: '  Some content  ',
    });

    expect(notesRepository.create).toHaveBeenCalledWith({
      title:   'Test Note',
      content: 'Some content',
    });
    expect(result).toEqual(mockNote);
  });

  it('passes null content when not provided', async () => {
    notesRepository.create.mockResolvedValueOnce({ ...mockNote, content: null });

    await notesService.createNote({ title: 'Title only' });

    expect(notesRepository.create).toHaveBeenCalledWith({
      title:   'Title only',
      content: null,
    });
  });
});

describe('NotesService.getAllNotes', () => {
  it('returns all notes from repository', async () => {
    notesRepository.findAll.mockResolvedValueOnce([mockNote]);

    const result = await notesService.getAllNotes();

    expect(notesRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });
});

describe('NotesService.getNoteById', () => {
  it('returns the note when found', async () => {
    notesRepository.findById.mockResolvedValueOnce(mockNote);

    const result = await notesService.getNoteById(mockNote.id);
    expect(result).toEqual(mockNote);
  });

  it('throws AppError 404 when not found', async () => {
    notesRepository.findById.mockResolvedValueOnce(null);

    await expect(notesService.getNoteById('bad-id'))
      .rejects
      .toMatchObject({ statusCode: 404 });
  });

  it('throws an instance of AppError', async () => {
    notesRepository.findById.mockResolvedValueOnce(null);

    await expect(notesService.getNoteById('bad-id'))
      .rejects
      .toBeInstanceOf(AppError);
  });
});

describe('NotesService.updateNote', () => {
  it('fetches existing note then calls repository.update with trimmed values', async () => {
    notesRepository.findById.mockResolvedValueOnce(mockNote);
    const updated = { ...mockNote, title: 'Updated' };
    notesRepository.update.mockResolvedValueOnce(updated);

    const result = await notesService.updateNote(mockNote.id, {
      title:   '  Updated  ',
      content: '  new body  ',
    });

    expect(notesRepository.update).toHaveBeenCalledWith(mockNote.id, {
      title:   'Updated',
      content: 'new body',
    });
    expect(result.title).toBe('Updated');
  });

  it('throws 404 when note does not exist', async () => {
    notesRepository.findById.mockResolvedValueOnce(null);

    await expect(notesService.updateNote('bad-id', { title: 'X' }))
      .rejects
      .toMatchObject({ statusCode: 404 });
  });
});

describe('NotesService.deleteNote', () => {
  it('calls repository.delete and resolves when note exists', async () => {
    notesRepository.delete.mockResolvedValueOnce(true);

    await expect(notesService.deleteNote(mockNote.id)).resolves.toBeUndefined();
    expect(notesRepository.delete).toHaveBeenCalledWith(mockNote.id);
  });

  it('throws 404 when note does not exist', async () => {
    notesRepository.delete.mockResolvedValueOnce(false);

    await expect(notesService.deleteNote('ghost-id'))
      .rejects
      .toMatchObject({ statusCode: 404 });
  });
});
