import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

const minutes = (name, fallback) => Math.max(1, Number(process.env[name] || fallback));
export const requestId = (req, res, next) => { req.requestId = req.headers['x-request-id'] || crypto.randomUUID(); res.setHeader('x-request-id', req.requestId); next(); };
// Per-process secret that marks loopback requests made by the AI agent on behalf of an
// already-authenticated user, so a multi-step agent run doesn't exhaust that user's rate limit.
export const INTERNAL_AGENT_TOKEN = crypto.randomBytes(32).toString('hex');
const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
export const isInternalAgentRequest = (req) => req.headers['x-agent-internal'] === INTERNAL_AGENT_TOKEN && loopback.has(req.socket?.remoteAddress);
export const apiLimiter = rateLimit({ skip: isInternalAgentRequest, windowMs: minutes('RATE_LIMIT_WINDOW_MINUTES', 15) * 60000, limit: Math.max(10, Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300)), standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { message: 'Too many requests. Please try again later.' } } });
export const loginLimiter = rateLimit({ windowMs: minutes('RATE_LIMIT_WINDOW_MINUTES', 15) * 60000, limit: Math.max(3, Number(process.env.LOGIN_RATE_LIMIT_MAX || 10)), standardHeaders: 'draft-7', legacyHeaders: false, skipSuccessfulRequests: true, message: { success: false, error: { message: 'Too many failed login attempts. Please try again later.' } } });
export const sanitizeInput = (req, _res, next) => {
  const clean = (value) => { if (Array.isArray(value)) return value.map(clean); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('$') && !key.includes('.')).map(([key, child]) => [key, clean(child)])); return typeof value === 'string' ? value.replace(/\0/g, '').trim() : value; };
  if (req.body) req.body = clean(req.body);
  next();
};
// Caps paid Claude calls per client.
export const agentLimiter = rateLimit({ windowMs: 15 * 60000, limit: Math.max(5, Number(process.env.AGENT_RATE_LIMIT_MAX || 120)), standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, error: { message: 'The AI assistant is receiving too many requests. Please wait a few minutes.' } } });
