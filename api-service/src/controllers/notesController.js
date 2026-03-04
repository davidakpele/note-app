const notesService = require('../services/notesService');

class NotesController {
  /**
   * POST /api/notes
   */
  async createNote(req, res, next) {
    try {
      const { title, content } = req.body;
      const note = await notesService.createNote({ title, content });

      return res.status(201).json({
        status: 'success',
        data: note,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notes
   */
  async getAllNotes(req, res, next) {
    try {
      const notes = await notesService.getAllNotes();

      return res.status(200).json({
        status: 'success',
        count: notes.length,
        data: notes,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notes/:id
   */
  async getNoteById(req, res, next) {
    try {
      const note = await notesService.getNoteById(req.params.id);

      return res.status(200).json({
        status: 'success',
        data: note,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/notes/:id
   */
  async updateNote(req, res, next) {
    try {
      const { title, content } = req.body;
      const note = await notesService.updateNote(req.params.id, { title, content });

      return res.status(200).json({
        status: 'success',
        data: note,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notes/:id
   */
  async deleteNote(req, res, next) {
    try {
      await notesService.deleteNote(req.params.id);

      return res.status(200).json({
        status: 'success',
        message: `Note "${req.params.id}" deleted successfully`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotesController();