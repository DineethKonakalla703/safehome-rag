import { Router } from 'express';
import { assignTechnician, createTicket, getTicket, listTickets, updateTicketStatus } from '../controllers/ticketController.js';
const router = Router();
router.get('/', listTickets);
router.get('/:ticketId', getTicket);
router.post('/', createTicket);
router.patch('/:ticketId/assign', assignTechnician);
router.patch('/:ticketId/status', updateTicketStatus);
export default router;

