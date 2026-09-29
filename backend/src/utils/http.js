export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const ok = (res, data, meta) => res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
export const created = (res, data) => res.status(201).json({ success: true, data });

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) throw new AppError(400, `Missing required fields: ${missing.join(', ')}`, { missing });
}

export async function nextPublicId(Model, field, prefix) {
  const latest = await Model.findOne({ [field]: new RegExp(`^${prefix}\\d+$`) }).sort({ [field]: -1 }).select(field).lean();
  const number = latest ? Number(String(latest[field]).replace(/\D/g, '')) + 1 : 1;
  return `${prefix}${String(number).padStart(3, '0')}`;
}

