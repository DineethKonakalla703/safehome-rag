import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Community from '../models/Community.js';
import Technician from '../models/Technician.js';
import { asyncHandler, ok } from '../utils/http.js';

export const getReferenceData = asyncHandler(async (req, res) => {
  const [communities, blocks, apartments, technicians] = await Promise.all([
    Community.find().sort({ communityId: 1 }).lean(), Block.find().sort({ blockId: 1 }).lean(), Apartment.find().sort({ apartmentId: 1 }).lean(), Technician.find().sort({ technicianId: 1 }).lean(),
  ]);
  ok(res, { communities, blocks, apartments, technicians });
});

