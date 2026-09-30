import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/http.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Authentication required.');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { throw new AppError(401, 'Your session is invalid or has expired.'); }
  const user = await User.findOne({ userId: payload.sub }).lean();
  if (!user || user.status !== 'Active') throw new AppError(401, 'User account is unavailable.');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to perform this action.'));
  next();
};

export function scopedFilter(user, { residentField = 'residentId', blockField = 'blockId', technicianField = 'technicianId' } = {}) {
  if (user.role === 'MAIN_ADMIN' || user.role === 'FACILITY_MANAGER') return {};
  if (user.role === 'BLOCK_SUB_ADMIN' || user.role === 'SECURITY') return { [blockField]: user.blockId };
  if (user.role === 'RESIDENT') return { [residentField]: user.userId };
  if (user.role === 'TECHNICIAN') return { [technicianField]: user.technicianId || '__none__' };
  return { _id: null };
}
