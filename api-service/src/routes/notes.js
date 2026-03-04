const { Router } = require('express');
const notesController = require('../controllers/notesController');
const { noteRules, validateNote } = require('../validators/noteValidator');
const { sanitizeBody } = require('../middleware/sanitize');

/**
 * Accepts the writeLimiter middleware from app.js so rate limit
 * config stays in one place and is easy to test.
 */
module.exports = (writeLimiter) => {
  const router = Router();
  router.get('/',    (req, res, next) => notesController.getAllNotes(req, res, next));
  router.get('/:id', (req, res, next) => notesController.getNoteById(req, res, next));
  router.post('/', writeLimiter, sanitizeBody, noteRules, validateNote, (req, res, next) => notesController.createNote(req, res, next));

  router.put('/:id', writeLimiter, sanitizeBody, noteRules, validateNote, (req, res, next) => notesController.updateNote(req, res, next));
  router.delete('/:id', writeLimiter, (req, res, next) => notesController.deleteNote(req, res, next));

  return router;
};