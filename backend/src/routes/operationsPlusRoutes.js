import { Router } from 'express';
import {
  FORUM_ROLES, collectParcel, commentPost, completeService, createMove, createPost, createSchedule, decideMove, deleteComment, deletePost, deleteSchedule,
  getMove, getPost, getSchedule, likePost, listMoves, listParcels, listPosts, listSchedules, logParcel, returnParcel, updatePost, updateSchedule,
} from '../controllers/operationsPlusController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const MANAGERS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];

export const moveRoutes = Router();
moveRoutes.use(authenticate, authorize(...MANAGERS, 'RESIDENT', 'SECURITY'));
moveRoutes.get('/', listMoves);
moveRoutes.get('/:id', getMove);
moveRoutes.post('/', authorize('RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), createMove);
moveRoutes.patch('/:id/approve', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), decideMove('approve'));
moveRoutes.patch('/:id/reject', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), decideMove('reject'));
moveRoutes.patch('/:id/complete', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'), decideMove('complete'));
moveRoutes.patch('/:id/cancel', authorize('RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), decideMove('cancel'));

export const parcelRoutes = Router();
parcelRoutes.use(authenticate, authorize(...MANAGERS, 'RESIDENT', 'SECURITY'));
parcelRoutes.get('/', listParcels);
parcelRoutes.post('/', authorize('SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), logParcel);
parcelRoutes.patch('/:id/collect', authorize('SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), collectParcel);
parcelRoutes.patch('/:id/return', authorize('SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'), returnParcel);

export const maintenanceRoutes = Router();
maintenanceRoutes.use(authenticate, authorize(...MANAGERS, 'TECHNICIAN'));
maintenanceRoutes.get('/', listSchedules);
maintenanceRoutes.get('/:id', getSchedule);
maintenanceRoutes.post('/', authorize('MAIN_ADMIN', 'FACILITY_MANAGER'), createSchedule);
maintenanceRoutes.post('/:id/complete', authorize('MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'), completeService);
maintenanceRoutes.patch('/:id', authorize('MAIN_ADMIN', 'FACILITY_MANAGER'), updateSchedule);
maintenanceRoutes.delete('/:id', authorize('MAIN_ADMIN', 'FACILITY_MANAGER'), deleteSchedule);

export const forumRoutes = Router();
forumRoutes.use(authenticate, authorize(...FORUM_ROLES));
forumRoutes.get('/', listPosts);
forumRoutes.get('/:id', getPost);
forumRoutes.post('/', createPost);
forumRoutes.post('/:id/comments', commentPost);
forumRoutes.delete('/:id/comments/:commentId', deleteComment);
forumRoutes.post('/:id/like', likePost);
forumRoutes.patch('/:id', updatePost);
forumRoutes.delete('/:id', deletePost);
