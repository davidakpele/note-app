const AppError = require('../utils/AppError');

const errorResponse = (res, { statusCode, error, message, details }) => {
  const body = {
    status:    'error',
    statusCode,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

const getErrorName = (statusCode) => {
  const names = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return names[statusCode] || 'Error';
};

const handlePgError = (err) => {
  switch (err.code) {
    case '22P02':
      return new AppError('Invalid ID format. A valid UUID is required.', 400);
    case '23502':
      return new AppError(`Missing required field: "${err.column || 'unknown'}"`, 400);
    case '23503':
      return new AppError('Referenced resource does not exist.', 400);
    case '23505':
      return new AppError('A record with that value already exists.', 409);
    case '42P01':
      return new AppError('Database table not found. Run migrations.', 500);
    default:
      return null;
  }
};

const notFound = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (err.code && err.code.length === 5) {
    const pgErr = handlePgError(err);
    if (pgErr) {
      return errorResponse(res, {
        statusCode: pgErr.statusCode,
        error:      getErrorName(pgErr.statusCode),
        message:    pgErr.message,
        details:    isDev
          ? { pg: { code: err.code, detail: err.detail, hint: err.hint } }
          : undefined,
      });
    }
  }

  if (err instanceof AppError) {
    return errorResponse(res, {
      statusCode: err.statusCode,
      error:      getErrorName(err.statusCode),
      message:    err.message,
    });
  }

  return errorResponse(res, {
    statusCode: 500,
    error:      'Internal Server Error',
    message:    isDev
      ? err.message
      : 'Something went wrong. Please try again later.',
    details: isDev
      ? { stack: err.stack }
      : undefined,
  });
};

module.exports = { notFound, errorHandler };