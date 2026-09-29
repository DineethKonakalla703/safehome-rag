import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import Apartment from '../models/Apartment.js';
import AuditLog from '../models/AuditLog.js';
import Bill from '../models/Bill.js';
import Block from '../models/Block.js';
import Community from '../models/Community.js';
import Technician from '../models/Technician.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

dotenv.config();

async function seed() {
  try {
    await connectDatabase();
    await Promise.all([AuditLog.deleteMany({}), Bill.deleteMany({}), Ticket.deleteMany({}), Technician.deleteMany({}), Apartment.deleteMany({}), Block.deleteMany({}), Community.deleteMany({}), User.deleteMany({})]);

    await Community.create({ communityId: 'C001', name: 'Green Valley Residency', address: 'Vijayawada, Andhra Pradesh' });
    await Block.insertMany([{ blockId: 'B001', name: 'Block A', communityId: 'C001' }, { blockId: 'B002', name: 'Block B', communityId: 'C001' }]);
    await Apartment.insertMany([
      { apartmentId: 'A101', number: 'A-101', blockId: 'B001', communityId: 'C001', status: 'Occupied' },
      { apartmentId: 'A102', number: 'A-102', blockId: 'B001', communityId: 'C001', status: 'Occupied' },
      { apartmentId: 'B101', number: 'B-101', blockId: 'B002', communityId: 'C001', status: 'Occupied' },
    ]);
    await User.insertMany([
      { userId: 'U001', name: 'Main Admin', email: 'admin@safehome.com', role: 'MAIN_ADMIN', communityId: 'C001' },
      { userId: 'U002', name: 'Block A Admin', email: 'blocka.admin@safehome.com', role: 'BLOCK_SUB_ADMIN', communityId: 'C001', blockId: 'B001' },
      { userId: 'U003', name: 'Resident One', email: 'resident1@safehome.com', role: 'RESIDENT', communityId: 'C001', blockId: 'B001', apartmentId: 'A102' },
      { userId: 'U004', name: 'Technician Suresh', email: 'technician@safehome.com', role: 'TECHNICIAN', communityId: 'C001', blockId: 'B001', technicianId: 'T002' },
    ]);
    await Technician.insertMany([
      { technicianId: 'T001', name: 'Ramesh', skill: 'Plumber', available: true, communityId: 'C001', blockId: 'B001', rating: 4.7, workload: 1 },
      { technicianId: 'T002', name: 'Suresh', skill: 'Electrician', available: true, communityId: 'C001', blockId: 'B001', rating: 4.8, workload: 0 },
      { technicianId: 'T003', name: 'Kiran', skill: 'General Maintenance', available: true, communityId: 'C001', blockId: 'B001', rating: 4.5, workload: 2 },
    ]);
    await Ticket.create({
      ticketId: 'TK001', title: 'Water leakage near electrical switchboard', description: 'Water is leaking near the electrical switchboard in A-102.', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', category: 'Plumbing + Electrical Risk', severity: 'High', safetyRisk: true, suggestedAction: 'Immediate escalation required. Assign electrician and plumber.', humanApprovalRequired: true, status: 'New', assignedTechnicianId: null,
      timeline: [{ message: 'Ticket created by Resident One', actor: 'U003' }, { message: 'AI simulation detected high safety risk', actor: 'RULE_ENGINE' }],
    });
    await Bill.create({ billId: 'BILL001', ticketId: 'TK001', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', serviceCharge: 300, partsCharge: 200, totalAmount: 500, paymentStatus: 'Pending', generatedAt: new Date() });
    await AuditLog.create({ action: 'DATABASE_SEEDED', entityType: 'System', entityId: 'safehome_rag', actorId: 'SEED_SCRIPT', message: 'Priority 2 demo data seeded successfully.' });
    console.log('SafeHome-RAG demo data seeded successfully.');
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
