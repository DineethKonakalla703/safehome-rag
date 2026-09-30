import { Router } from 'express';
import { amenityController, apartmentController, blockController, bookingController, communityController, documentController, inventoryController, noticeController, parkingController, residentController, vehicleController, visitorController } from '../controllers/coreResourceControllers.js';
import { approveVisitor, assignParking, exitVisitor, updateBookingStatus, useInventory } from '../controllers/operationsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const managers = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];
const build = (controller, writeRoles = managers, { allowCreateRoles = writeRoles } = {}) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', authorize(...allowCreateRoles), controller.create);
  router.patch('/:id', authorize(...writeRoles), controller.update);
  router.delete('/:id', authorize(...writeRoles), controller.remove);
  return router;
};

export const communityRoutes = build(communityController, ['MAIN_ADMIN']);
export const blockRoutes = build(blockController, ['MAIN_ADMIN']);
export const apartmentRoutes = build(apartmentController, ['MAIN_ADMIN']);
export const residentRoutes = build(residentController, managers);

export const visitorRoutes = build(visitorController, managers, { allowCreateRoles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY', 'RESIDENT'] });
visitorRoutes.patch('/:id/approve', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY', 'RESIDENT'), approveVisitor);
visitorRoutes.patch('/:id/exit', authorize('MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'), exitVisitor);

export const vehicleRoutes = build(vehicleController, managers, { allowCreateRoles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'] });
export const parkingRoutes = build(parkingController, managers);
parkingRoutes.patch('/:id/assign', authorize(...managers), assignParking);

export const amenityRoutes = build(amenityController, ['MAIN_ADMIN', 'FACILITY_MANAGER']);
export const bookingRoutes = build(bookingController, managers, { allowCreateRoles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'] });
bookingRoutes.patch('/:id/status', authorize(...managers), updateBookingStatus);

export const noticeRoutes = build(noticeController, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN']);
export const documentRoutes = build(documentController, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN']);
export const inventoryRoutes = build(inventoryController, ['MAIN_ADMIN', 'FACILITY_MANAGER']);
inventoryRoutes.post('/:id/use', authorize('MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'), useInventory);
