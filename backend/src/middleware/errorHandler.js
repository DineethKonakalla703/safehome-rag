export function notFound(req, res) {
  res.status(404).json({ success: false, error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const duplicate = error?.code === 11000;
  const validation = error?.name === 'ValidationError';
  const status = error.statusCode || (duplicate ? 409 : validation ? 400 : 500);
  const message = duplicate ? `A record with that ${Object.keys(error.keyPattern || {}).join(', ')} already exists.` : validation ? Object.values(error.errors).map((item) => item.message).join(' ') : error.message || 'Unexpected server error.';
  if (status >= 500) console.error(`[${req.requestId || 'no-request-id'}]`, error);
  const safeMessage = status >= 500 && process.env.NODE_ENV === 'production' ? 'Unexpected server error.' : message;
  res.status(status).json({ success: false, error: { message: safeMessage, requestId: req.requestId, ...(error.details ? { details: error.details } : {}) } });
}
