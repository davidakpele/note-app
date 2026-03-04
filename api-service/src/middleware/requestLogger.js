
const crypto = require('crypto');

const getLevel = (statusCode) => {
  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARN';
  return 'INFO';
};

const emit = (record) => {
  if (process.env.NODE_ENV === 'test') return;

  const line = JSON.stringify(record);

  if (record.level === 'ERROR') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
};

const requestLogger = (req, res, next) => {
  const startAt   = process.hrtime();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;

  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const [sec, nano] = process.hrtime(startAt);
    const durationMs  = (sec * 1_000 + nano / 1_000_000).toFixed(2);

    const record = {
      timestamp:     new Date().toISOString(),
      level:         getLevel(res.statusCode),
      requestId,
      method:        req.method,
      url:           req.originalUrl,
      statusCode:    res.statusCode,
      duration:      `${durationMs}ms`,
      ip:            req.ip || req.socket?.remoteAddress || '-',
      userAgent:     req.headers['user-agent'] || '-',
      contentLength: res.getHeader('content-length') || 0,
    };

    emit(record);
  });

  next();
};

module.exports = requestLogger;