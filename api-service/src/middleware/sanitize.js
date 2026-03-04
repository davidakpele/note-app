const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/\0/g, '') 
          .trim();
      }
    }
  }
  next();
};

module.exports = { sanitizeBody };