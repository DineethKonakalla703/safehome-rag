import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Community from '../models/Community.js';
import Technician from '../models/Technician.js';
import { asyncHandler, ok } from '../utils/http.js';

export const getReferenceData = asyncHandler(async (req, res) => {
  const community = { communityId: req.user.communityId };
  const block = ['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(req.user.role) || !req.user.blockId ? community : { ...community, blockId: req.user.blockId };
  const [communities, blocks, apartments, technicians] = await Promise.all([
    Community.find(community).sort({ communityId: 1 }).lean(), Block.find(block).sort({ blockId: 1 }).lean(), Apartment.find(block).sort({ apartmentId: 1 }).lean(), Technician.find(block).sort({ technicianId: 1 }).lean(),
  ]);
  ok(res, { communities, blocks, apartments, technicians });
});
