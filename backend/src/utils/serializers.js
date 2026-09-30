import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Technician from '../models/Technician.js';
import User from '../models/User.js';

export async function decorateTickets(records) {
  const tickets = records.map((record) => record.toObject ? record.toObject() : record);
  if (!tickets.length) return [];
  const [users, apartments, blocks, technicians] = await Promise.all([
    User.find({ userId: { $in: [...new Set(tickets.map((t) => t.residentId))] } }).lean(),
    Apartment.find({ apartmentId: { $in: [...new Set(tickets.map((t) => t.apartmentId))] } }).lean(),
    Block.find({ blockId: { $in: [...new Set(tickets.map((t) => t.blockId))] } }).lean(),
    Technician.find({ technicianId: { $in: [...new Set(tickets.map((t) => t.assignedTechnicianId).filter(Boolean))] } }).lean(),
  ]);
  const maps = {
    users: new Map(users.map((item) => [item.userId, item.name])),
    apartments: new Map(apartments.map((item) => [item.apartmentId, item.number])),
    blocks: new Map(blocks.map((item) => [item.blockId, item.name])),
    technicians: new Map(technicians.map((item) => [item.technicianId, item.name])),
  };
  return tickets.map((ticket) => ({
    ...ticket,
    residentName: maps.users.get(ticket.residentId) || ticket.residentId,
    apartmentNumber: maps.apartments.get(ticket.apartmentId) || ticket.apartmentId,
    blockName: maps.blocks.get(ticket.blockId) || ticket.blockId,
    assignedTechnicianName: maps.technicians.get(ticket.assignedTechnicianId) || null,
  }));
}

export async function decorateBills(records) {
  const bills = records.map((record) => record.toObject ? record.toObject() : record);
  if (!bills.length) return [];
  const [users, apartments, blocks] = await Promise.all([
    User.find({ userId: { $in: [...new Set(bills.map((b) => b.residentId))] } }).lean(),
    Apartment.find({ apartmentId: { $in: [...new Set(bills.map((b) => b.apartmentId))] } }).lean(),
    Block.find({ blockId: { $in: [...new Set(bills.map((b) => b.blockId))] } }).lean(),
  ]);
  const userMap = new Map(users.map((item) => [item.userId, item.name]));
  const apartmentMap = new Map(apartments.map((item) => [item.apartmentId, item.number]));
  const blockMap = new Map(blocks.map((item) => [item.blockId, item.name]));
  return bills.map((bill) => ({ ...bill, residentName: userMap.get(bill.residentId) || bill.residentId, apartmentNumber: apartmentMap.get(bill.apartmentId) || bill.apartmentId, blockName: blockMap.get(bill.blockId) || bill.blockId }));
}
