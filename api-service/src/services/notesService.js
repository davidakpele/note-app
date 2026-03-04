const notesRepository = require('../repositories/notesRepository');
const AppError = require('../utils/AppError');

class NotesService {
  /**
   * Create a new note.
   * @param {{ title: string, content?: string }}
   * @returns {Promise<Object>}
   */
  async createNote({ title, content }) {
    const sanitized = {
      title:   title.trim(),
      content: content ? content.trim() : null,
    };

    return notesRepository.create(sanitized);
  }

  /**
   * Retrieve all notes.
   * @returns {Promise<Object[]>}
   */
  async getAllNotes() {
    return notesRepository.findAll();
  }

  /**
   * Retrieve a single note by id.
   * Throws 404 if not found.
   * @param {string}
   * @returns {Promise<Object>}
   */
  async getNoteById(id) {
    const note = await notesRepository.findById(id);

    if (!note) {
      throw new AppError(`Note with id ${id} not found`, 404);
    }

    return note;
  }

  /**
   * Update an existing note.
   * Throws 404 if the note does not exist.
   * @param {string} id
   * @param {{ title: string, content?: string }} 
   * @returns {Promise<Object>}
   */
  async updateNote(id, { title, content }) {
    await this.getNoteById(id);

    const sanitized = {
      title:   title.trim(),
      content: content != null ? content.trim() : null,
    };

    return notesRepository.update(id, sanitized);
  }

  /**
   * Delete a note by id.
   * Throws 404 if the note does not exist.
   * @param {string}
   * @returns {Promise<void>}
   */
  async deleteNote(id) {
    const deleted = await notesRepository.delete(id);

    if (!deleted) {
      throw new AppError(`Note with id ${id} not found`, 404);
    }
  }
}

module.exports = new NotesService();