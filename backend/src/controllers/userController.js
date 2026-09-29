import User from '../models/User.js';
import { asyncHandler, ok } from '../utils/http.js';

export const listUsers = asyncHandler(async (req, res) => ok(res, await User.find().sort({ userId: 1 }).lean()));
export const listDemoUsers = asyncHandler(async (req, res) => ok(res, await User.find({ role: { $in: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'TECHNICIAN'] } }).sort({ userId: 1 }).lean()));

