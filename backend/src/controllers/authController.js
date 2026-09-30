import User from '../models/User.js';
import { signToken } from '../utils/auth.js';
import { AppError, asyncHandler, ok, requireFields } from '../utils/http.js';

const safeUser = (user) => ({ userId: user.userId, name: user.name, email: user.email, role: user.role, communityId: user.communityId, blockId: user.blockId, apartmentId: user.apartmentId, technicianId: user.technicianId, status: user.status });

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new AppError(401, 'Invalid email or password.');
  if (user.status !== 'Active') throw new AppError(403, 'This account is inactive.');
  ok(res, { token: signToken(user), user: safeUser(user) });
});

export const me = asyncHandler(async (req, res) => ok(res, safeUser(req.user)));
