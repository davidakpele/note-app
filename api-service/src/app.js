const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const notesRouter   = require('./routes/notes');

const createApp = ({
  globalMax = parseInt(process.env.RATE_LIMIT_PER_MINUTE)       || 100,
  writeMax  = parseInt(process.env.WRITE_RATE_LIMIT_PER_MINUTE) || 30,
} = {}) => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestLogger);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy: origin "${origin}" is not allowed`));
    },
    methods:            ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders:     ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders:     ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining'],
    credentials:        true,
    optionsSuccessStatus: 200,
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:              ["'self'"],
        scriptSrc:               ["'self'"],
        styleSrc:                ["'self'"],
        imgSrc:                  ["'self'", 'data:'],
        connectSrc:              ["'self'"],
        fontSrc:                 ["'self'"],
        objectSrc:               ["'none'"],
        frameSrc:                ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge:            31536000,  
      includeSubDomains: true,
      preload:           true,
    },
    xContentTypeOptions:    true, 
    xFrameOptions:          { action: 'deny' },
    xXssProtection:         true,
    referrerPolicy:         { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    crossOriginEmbedderPolicy:    true,
    crossOriginOpenerPolicy:      { policy: 'same-origin' },
    crossOriginResourcePolicy:    { policy: 'same-origin' },
  }));

  app.disable('x-powered-by');

  const globalLimiter = rateLimit({
    windowMs:        60 * 1000,
    max:             globalMax,
    standardHeaders: true,
    legacyHeaders:   false,
    store:           new rateLimit.MemoryStore(),
    message: {
      status:     'error',
      statusCode: 429,
      error:      'Too Many Requests',
      message:    'Too many requests. Please slow down and try again later.',
      timestamp:  new Date().toISOString(),
    },
  });

  const writeLimiter = rateLimit({
    windowMs:        60 * 1000,
    max:             writeMax,
    standardHeaders: true,
    legacyHeaders:   false,
    store:           new rateLimit.MemoryStore(),
    message: {
      status:     'error',
      statusCode: 429,
      error:      'Too Many Requests',
      message:    'Too many write requests. Please slow down and try again later.',
      timestamp:  new Date().toISOString(),
    },
  });

  app.use(globalLimiter);

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/notes', notesRouter(writeLimiter));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;