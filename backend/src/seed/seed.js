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
import Amenity from '../models/Amenity.js';
import AmenityBooking from '../models/AmenityBooking.js';
import Document from '../models/Document.js';
import InventoryItem from '../models/InventoryItem.js';
import Notice from '../models/Notice.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Resident from '../models/Resident.js';
import Vehicle from '../models/Vehicle.js';
import Visitor from '../models/Visitor.js';
import WorkOrder from '../models/WorkOrder.js';
import Incident from '../models/Incident.js';
import Vendor from '../models/Vendor.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import AIConversation from '../models/AIConversation.js';
import BulkImport from '../models/BulkImport.js';
import { ingestKnowledgeDocument } from '../ai/rag/knowledgeIngestion.js';

dotenv.config();

async function seed() {
  try {
    await connectDatabase();
    await Promise.all([Vendor.deleteMany({}), BulkImport.deleteMany({}), AIConversation.deleteMany({}), KnowledgeChunk.deleteMany({}), KnowledgeDocument.deleteMany({}), Incident.deleteMany({}), AmenityBooking.deleteMany({}), Amenity.deleteMany({}), Document.deleteMany({}), InventoryItem.deleteMany({}), Notice.deleteMany({}), ParkingSlot.deleteMany({}), Vehicle.deleteMany({}), Visitor.deleteMany({}), WorkOrder.deleteMany({}), Resident.deleteMany({}), AuditLog.deleteMany({}), Bill.deleteMany({}), Ticket.deleteMany({}), Technician.deleteMany({}), Apartment.deleteMany({}), Block.deleteMany({}), Community.deleteMany({}), User.deleteMany({})]);

    await Community.create({ communityId: 'C001', name: 'Green Valley Residency', address: 'Vijayawada, Andhra Pradesh' });
    await Block.insertMany([{ blockId: 'B001', name: 'Block A', communityId: 'C001' }, { blockId: 'B002', name: 'Block B', communityId: 'C001' }]);
    await Apartment.insertMany([
      { apartmentId: 'A101', number: 'A-101', blockId: 'B001', communityId: 'C001', status: 'Occupied' },
      { apartmentId: 'A102', number: 'A-102', blockId: 'B001', communityId: 'C001', status: 'Occupied' },
      { apartmentId: 'B101', number: 'B-101', blockId: 'B002', communityId: 'C001', status: 'Occupied' },
    ]);
    await User.create([
      { userId: 'U001', name: 'Main Admin', email: 'admin@safehome.com', password: 'Demo@123', role: 'MAIN_ADMIN', communityId: 'C001', status: 'Active' },
      { userId: 'U002', name: 'Block A Admin', email: 'blocka.admin@safehome.com', password: 'Demo@123', role: 'BLOCK_SUB_ADMIN', communityId: 'C001', blockId: 'B001', status: 'Active' },
      { userId: 'U003', name: 'Resident One', email: 'resident1@safehome.com', password: 'Demo@123', role: 'RESIDENT', communityId: 'C001', blockId: 'B001', apartmentId: 'A102', phone: '9000000003', ownerOrTenant: 'Tenant', familyMembers: 3, status: 'Active' },
      { userId: 'U004', name: 'Technician Suresh', email: 'technician@safehome.com', password: 'Demo@123', role: 'TECHNICIAN', communityId: 'C001', blockId: 'B001', technicianId: 'T002', status: 'Active' },
      { userId: 'U005', name: 'Security Officer', email: 'security@safehome.com', password: 'Demo@123', role: 'SECURITY', communityId: 'C001', blockId: 'B001', status: 'Active' },
      { userId: 'U006', name: 'Facility Manager', email: 'facility@safehome.com', password: 'Demo@123', role: 'FACILITY_MANAGER', communityId: 'C001', status: 'Active' },
    ]);
    await Technician.insertMany([
      { technicianId: 'T001', name: 'Ramesh', skill: 'Plumber', available: true, communityId: 'C001', blockId: 'B001', rating: 4.7, workload: 1 },
      { technicianId: 'T002', name: 'Suresh', skill: 'Electrician', available: true, communityId: 'C001', blockId: 'B001', rating: 4.8, workload: 0 },
      { technicianId: 'T003', name: 'Kiran', skill: 'General Maintenance', available: true, communityId: 'C001', blockId: 'B001', rating: 4.5, workload: 2 },
    ]);
    await Vendor.insertMany([
      { vendorId: 'VEN001', name: 'QuickFix Plumbing Solutions', category: 'Plumbing', communityId: 'C001', phone: '9848011223', email: 'service@quickfixplumbing.com', hourlyRate: 450, rating: 4.8, completedJobsCount: 42, warrantyPeriodMonths: 6, emergencyAvailable: true, available: true, location: 'Vijayawada Central', status: 'Active' },
      { vendorId: 'VEN002', name: 'Spark Electrical & Controls', category: 'Electrical', communityId: 'C001', phone: '9848033445', email: 'support@sparkelectrical.in', hourlyRate: 500, rating: 4.9, completedJobsCount: 56, warrantyPeriodMonths: 12, emergencyAvailable: true, available: true, location: 'Benz Circle', status: 'Active' },
      { vendorId: 'VEN003', name: 'Otis & City Lift Services', category: 'Lift Emergency', communityId: 'C001', phone: '9848055667', email: 'emergency@citylifts.com', hourlyRate: 1200, rating: 4.7, completedJobsCount: 88, warrantyPeriodMonths: 24, emergencyAvailable: true, available: true, location: 'MG Road', status: 'Active' },
      { vendorId: 'VEN004', name: 'Apex Civil & Structural Repairs', category: 'Structural', communityId: 'C001', phone: '9848077889', email: 'info@apexstructural.com', hourlyRate: 750, rating: 4.6, completedJobsCount: 19, warrantyPeriodMonths: 36, emergencyAvailable: false, available: true, location: 'Auto Nagar', status: 'Active' },
    ]);
    await Resident.create({ residentId: 'U003', name: 'Resident One', email: 'resident1@safehome.com', phone: '9000000003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', ownerOrTenant: 'Tenant', familyMembers: 3, emergencyContact: '9000000099', moveInDate: new Date('2025-06-01'), status: 'Active' });
    await Ticket.create({
      ticketId: 'TK001', title: 'Water leakage near electrical switchboard', description: 'Water is leaking near the electrical switchboard in A-102.', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', category: 'Plumbing + Electrical Risk', severity: 'High', safetyRisk: true, suggestedAction: 'Immediate escalation required. Assign electrician and plumber.', humanApprovalRequired: true, status: 'New', assignedTechnicianId: null,
      aiAnalysis: { category: 'Plumbing + Electrical Risk', severity: 'Critical', safetyRisk: true, safetyRiskType: 'Water near electrical equipment', missingInfo: ['Is the electrical supply isolated?'], suggestedAction: 'Isolate the area and obtain human approval for an electrician and plumber response.', confidence: 0.98, provider: 'rules', modelVersion: 'fallback-v2', fallbackUsed: true, humanApprovalRequired: true, reviewedByHuman: false, createdAt: new Date() },
      timeline: [{ message: 'Ticket created by Resident One', actor: 'U003' }, { message: 'Fallback rules detected a safety risk', actor: 'AI_SERVICE' }],
    });
    await Ticket.create({ ticketId: 'TK002', title: 'Corridor light not working', description: 'The corridor light outside A-102 is not working.', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', category: 'Electrical', severity: 'Medium', safetyRisk: false, suggestedAction: 'Assign an electrician and verify the affected circuit.', humanApprovalRequired: false, status: 'New', priority: 'Medium', aiAnalysis: { category: 'Electrical', severity: 'Medium', safetyRisk: false, safetyRiskType: null, missingInfo: [], suggestedAction: 'Assign an electrician and verify the affected circuit.', confidence: 0.8, provider: 'rules', modelVersion: 'fallback-v2', fallbackUsed: true, humanApprovalRequired: false, reviewedByHuman: false, createdAt: new Date() }, timeline: [{ message: 'Ticket created by Resident One', actor: 'U003' }, { message: 'Fallback rule analysis completed', actor: 'AI_SERVICE' }] });
    await Bill.create({ billId: 'BILL001', ticketId: 'TK001', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', communityId: 'C001', serviceCharge: 300, partsCharge: 200, totalAmount: 500, paymentStatus: 'Pending', billType: 'Repair', dueDate: new Date(Date.now() + 14 * 86400000), generatedAt: new Date() });
    await Visitor.create({ visitorId: 'VIS001', name: 'Anil Kumar', phone: '9000000101', purpose: 'Family visit', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', status: 'Pending' });
    await Vehicle.create({ vehicleId: 'VEH001', residentId: 'U003', apartmentId: 'A102', blockId: 'B001', vehicleNumber: 'AP39AB1234', vehicleType: 'Car', parkingSlotId: 'PS001' });
    await ParkingSlot.insertMany([{ slotId: 'PS001', blockId: 'B001', slotNumber: 'A-P01', status: 'Assigned', assignedTo: 'VEH001' }, { slotId: 'PS002', blockId: 'B001', slotNumber: 'A-P02', status: 'Available' }, { slotId: 'PS003', blockId: 'B002', slotNumber: 'B-P01', status: 'Available' }]);
    await Amenity.insertMany([{ amenityId: 'AM001', name: 'Community Hall', location: 'Clubhouse Ground Floor', charge: 1000, availability: true }, { amenityId: 'AM002', name: 'Badminton Court', location: 'Sports Block', charge: 200, availability: true }]);
    await AmenityBooking.create({ bookingId: 'BK001', amenityId: 'AM002', residentId: 'U003', blockId: 'B001', date: new Date(Date.now() + 3 * 86400000), timeSlot: '18:00-19:00', status: 'Approved', charge: 200 });
    await Notice.create({ noticeId: 'NT001', title: 'Water tank maintenance', message: 'Water supply will be paused from 10:00 AM to 12:00 PM on Saturday.', targetType: 'Community', createdBy: 'U001' });
    await Document.create({ documentId: 'DOC001', title: 'Community Guidelines', type: 'Policy', fileUrl: 'https://example.com/community-guidelines.pdf', relatedEntityType: 'Community', relatedEntityId: 'C001', uploadedBy: 'U001' });
    await InventoryItem.insertMany([{ itemId: 'INV001', name: 'LED Bulb 12W', category: 'Electrical', quantity: 18, minimumStock: 10, unit: 'pieces', location: 'Maintenance Store', lastUpdatedBy: 'U001' }, { itemId: 'INV002', name: 'PVC Pipe 1 inch', category: 'Plumbing', quantity: 6, minimumStock: 8, unit: 'lengths', location: 'Maintenance Store', lastUpdatedBy: 'U001' }]);
    const knowledge = await KnowledgeDocument.insertMany([
      { documentId: 'KDOC001', title: 'Electrical Safety SOP', type: 'SOP', category: 'Electrical Safety', content: 'Keep people away from water near electrical equipment. Do not touch switches or exposed wiring. Isolate the electricity supply only if a trained person can do so safely. Escalate immediately to an authorized electrician and contact emergency services when fire or electrocution risk is present.', uploadedBy: 'U001' },
      { documentId: 'KDOC002', title: 'Plumbing Leakage Handling Guide', type: 'Guide', category: 'Plumbing', content: 'Identify the leak location, isolate the nearest water valve when safe, protect electrical equipment, record affected units, and assign a plumber. Shared leaks across several apartments should be treated as a possible block incident.', uploadedBy: 'U001' },
      { documentId: 'KDOC003', title: 'Lift Emergency Procedure', type: 'SOP', category: 'Lift Safety', content: 'When a person is trapped, contact lift emergency support and security, maintain communication, and never force lift doors. Restrict use until an authorized lift technician confirms safety.', uploadedBy: 'U001' },
      { documentId: 'KDOC004', title: 'Visitor and Security Rules', type: 'Policy', category: 'Security', content: 'Visitors require a resident-linked request and security approval. Security must verify identity, record entry status, and record exit. Access is limited to the authorized block and purpose.', uploadedBy: 'U001' },
      { documentId: 'KDOC005', title: 'Resident Community Guidelines & Noise Policy', type: 'Policy', category: 'Community Bylaws', content: 'Quiet hours are strictly observed between 10:00 PM and 6:00 AM. Household waste must be segregated into dry and wet bins and placed in floor chutes before 9:00 AM. Pets must be leashed in all common areas, elevators, and corridors. Balcony plants must be secured against falling hazards.', uploadedBy: 'U001' },
      { documentId: 'KDOC006', title: 'Amenity Booking & Clubhouse Rules', type: 'Guide', category: 'Amenities', content: 'Residents can book the community hall, badminton court, and party terrace up to 30 days in advance via the resident portal. Clubhouse facilities are open daily from 6:00 AM to 10:00 PM. A sanitization deposit applies to party hall bookings, refundable upon inspection. Cancellations 24 hours prior receive full refund.', uploadedBy: 'U001' },
      { documentId: 'KDOC007', title: 'Maintenance Billing & Payment FAQ', type: 'FAQ', category: 'Billing FAQ', content: 'Monthly society maintenance bills are generated on the 1st of every month and are due by the 10th. Payments can be completed online via UPI, net banking, or cards through the SafeHome billing portal. Late fee of ₹50 per week applies for payments past the 20th. Specific repair charges are billed separately upon work order sign-off.', uploadedBy: 'U001' },
    ]);
    for (const document of knowledge) await ingestKnowledgeDocument(document);
    await AuditLog.insertMany([
      { action: 'DATABASE_SEEDED', entityType: 'System', entityId: 'safehome_rag', actorId: 'SEED_SCRIPT', message: 'Phase 2 demo data seeded successfully.' },
      { action: 'AI_COMPLAINT_ANALYSIS_GENERATED', entityType: 'Ticket', entityId: 'TK001', actorId: 'AI_SERVICE', message: 'Fallback safety analysis generated with confidence 0.98 for the seeded high-risk complaint.' },
      { action: 'KNOWLEDGE_DOCUMENTS_INGESTED', entityType: 'KnowledgeDocument', entityId: 'KDOC001-KDOC007', actorId: 'SEED_SCRIPT', message: 'Seven Phase 2 demo knowledge documents were chunked for grounded retrieval.' },
    ]);
    console.log('SafeHome-RAG demo data seeded successfully.');
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
