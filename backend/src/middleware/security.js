import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

const minutes = (name, fallback) => Math.max(1, Number(process.env[name] || fallback));
export const requestId = (req, res, next) => { req.requestId = req.headers['x-request-id'] || crypto.randomUUID(); res.setHeader('x-request-id', req.requestId); next(); };
export const apiLimiter = rateLimit({ windowMs: minutes('RATE_LIMIT_WINDOW_MINUTES', 15) * 60000, limit: Math.max(10, Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300)), standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { message: 'Too many requests. Please try again later.' } } });
export const loginLimiter = rateLimit({ windowMs: minutes('RATE_LIMIT_WINDOW_MINUTES', 15) * 60000, limit: Math.max(3, Number(process.env.LOGIN_RATE_LIMIT_MAX || 10)), standardHeaders: 'draft-7', legacyHeaders: false, skipSuccessfulRequests: true, message: { success: false, error: { message: 'Too many failed login attempts. Please try again later.' } } });
export const sanitizeInput = (req, _res, next) => {
  const clean = (value) => { if (Array.isArray(value)) return value.map(clean); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('$') && !key.includes('.')).map(([key, child]) => [key, clean(child)])); return typeof value === 'string' ? value.replace(/\0/g, '').trim() : value; };
  if (req.body) req.body = clean(req.body);
  next();
};
