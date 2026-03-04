const { body, validationResult } = require('express-validator');

const noteRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be 255 characters or fewer'),

  body('content')
    .optional()
    .trim(),
];

const validateNote = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { noteRules, validateNote };