import { Router } from 'express';
import {
  accountsSummary, acknowledgeSos, createPoll, deletePoll, eventController, getPoll, getSos, ledgerController, listPolls, listSos,
  raiseSos, resolveSos, rsvpEvent, staffCheckIn, staffCheckOut, staffController, updatePoll, votePoll,
} from '../controllers/communityLifeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const ADMINS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'];
const MANAGERS = [...ADMINS, 'FACILITY_MANAGER'];
const COMMUNITY = [...MANAGERS, 'RESIDENT', 'SECURITY'];

export const staffRoutes = Router();
staffRoutes.use(authenticate, authorize(...COMMUNITY));
staffRoutes.get('/', staffController.list);
staffRoutes.get('/:id', staffController.get);
staffRoutes.post('/', authorize(...ADMINS, 'RESIDENT', 'SECURITY'), staffController.create);
staffRoutes.patch('/:id/check-in', authorize(...ADMINS, 'SECURITY'), staffCheckIn);
staffRoutes.patch('/:id/check-out', authorize(...ADMINS, 'SECURITY'), staffCheckOut);
staffRoutes.patch('/:id', authorize(...ADMINS, 'RESIDENT'), staffController.update);
staffRoutes.delete('/:id', authorize(...ADMINS, 'RESIDENT'), staffController.remove);

export const ledgerRoutes = Router();
ledgerRoutes.use(authenticate);
ledgerRoutes.get('/summary', authorize(...COMMUNITY), accountsSummary);
ledgerRoutes.get('/', authorize(...MANAGERS), ledgerController.list);
ledgerRoutes.get('/:id', authorize(...MANAGERS), ledgerController.get);
ledgerRoutes.post('/', authorize('MAIN_ADMIN', 'FACILITY_MANAGER'), ledgerController.create);
ledgerRoutes.patch('/:id', authorize('MAIN_ADMIN', 'FACILITY_MANAGER'), ledgerController.update);
ledgerRoutes.delete('/:id', authorize('MAIN_ADMIN'), ledgerController.remove);

export const pollRoutes = Router();
pollRoutes.use(authenticate, authorize(...COMMUNITY));
pollRoutes.get('/', listPolls);
pollRoutes.get('/:id', getPoll);
pollRoutes.post('/', authorize(...MANAGERS), createPoll);
pollRoutes.post('/:id/vote', authorize('RESIDENT', ...ADMINS), votePoll);
pollRoutes.patch('/:id/close', authorize(...MANAGERS), (req, res, next) => { req.body = { status: 'Closed' }; next(); }, updatePoll);
pollRoutes.patch('/:id', authorize(...MANAGERS), updatePoll);
pollRoutes.delete('/:id', authorize(...ADMINS), deletePoll);

export const eventRoutes = Router();
eventRoutes.use(authenticate, authorize(...COMMUNITY));
eventRoutes.get('/', eventController.list);
eventRoutes.get('/:id', eventController.get);
eventRoutes.post('/', authorize(...MANAGERS), eventController.create);
eventRoutes.post('/:id/rsvp', rsvpEvent);
eventRoutes.patch('/:id', authorize(...MANAGERS), eventController.update);
eventRoutes.delete('/:id', authorize(...MANAGERS), eventController.remove);

export const sosRoutes = Router();
sosRoutes.use(authenticate);
sosRoutes.get('/', listSos);
sosRoutes.get('/:id', getSos);
sosRoutes.post('/', raiseSos);
sosRoutes.patch('/:id/acknowledge', authorize(...MANAGERS, 'SECURITY'), acknowledgeSos);
sosRoutes.patch('/:id/resolve', authorize(...MANAGERS, 'SECURITY'), resolveSos);
