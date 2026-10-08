import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Technician from '../models/Technician.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import WorkOrder from '../models/WorkOrder.js';

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
  const bills = records.map((record) => (record.toObject ? record.toObject() : record));
  if (!bills.length) return [];

  const residentIds = [...new Set(bills.map((b) => b.residentId).filter(Boolean))];
  const apartmentIds = [...new Set(bills.map((b) => b.apartmentId).filter(Boolean))];
  const blockIds = [...new Set(bills.map((b) => b.blockId).filter(Boolean))];
  const ticketIds = [...new Set(bills.map((b) => b.ticketId).filter(Boolean))];

  const [users, apartments, blocks, tickets, workOrders] = await Promise.all([
    User.find({ userId: { $in: residentIds } }).lean(),
    Apartment.find({ apartmentId: { $in: apartmentIds } }).lean(),
    Block.find({ blockId: { $in: blockIds } }).lean(),
    Ticket.find({ ticketId: { $in: ticketIds } }).lean(),
    WorkOrder.find({ ticketId: { $in: ticketIds } }).lean(),
  ]);

  const techIds = [
    ...new Set([
      ...tickets.map((t) => t.assignedTechnicianId).filter(Boolean),
      ...workOrders.map((w) => w.technicianId).filter(Boolean),
    ]),
  ];

  const [technicians, techUsers] = await Promise.all([
    Technician.find({ technicianId: { $in: techIds } }).lean(),
    User.find({
      $or: [
        { technicianId: { $in: techIds } },
        { userId: { $in: techIds } },
        { role: 'TECHNICIAN' },
      ],
    }).lean(),
  ]);

  const userMap = new Map(users.map((item) => [item.userId, item.name]));
  const apartmentMap = new Map(apartments.map((item) => [item.apartmentId, item.number]));
  const blockMap = new Map(blocks.map((item) => [item.blockId, item.name]));
  const ticketMap = new Map(tickets.map((item) => [item.ticketId, item]));
  const workOrderMap = new Map(workOrders.map((item) => [item.ticketId, item]));

  const technicianMap = new Map();
  for (const t of technicians) {
    technicianMap.set(t.technicianId, {
      id: t.technicianId,
      name: t.name,
      skill: t.skill,
      rating: t.rating,
    });
  }
  for (const u of techUsers) {
    const key = u.technicianId || u.userId;
    const existing = technicianMap.get(key) || {};
    technicianMap.set(key, {
      id: key,
      name: u.name || existing.name || 'Technician',
      skill: existing.skill || 'Technician',
      phone: u.phone || null,
      rating: existing.rating,
    });
  }

  const defaultElectrician = technicians.find((t) => t.skill?.toLowerCase().includes('elec')) || technicians[0];
  const defaultPlumber = technicians.find((t) => t.skill?.toLowerCase().includes('plumb'));

  return bills.map((bill) => {
    const ticket = ticketMap.get(bill.ticketId);
    const workOrder = workOrderMap.get(bill.ticketId);
    let techId = workOrder?.technicianId || ticket?.assignedTechnicianId || null;
    let tech = techId ? technicianMap.get(techId) : null;

    if (!tech && ticket) {
      const cat = (ticket.category || '').toLowerCase();
      if (cat.includes('elect') && defaultElectrician) {
        tech = defaultElectrician;
        techId = defaultElectrician.technicianId;
      } else if (cat.includes('plumb') && defaultPlumber) {
        tech = defaultPlumber;
        techId = defaultPlumber.technicianId;
      } else if (defaultElectrician) {
        tech = defaultElectrician;
        techId = defaultElectrician.technicianId;
      }
    }

    return {
      ...bill,
      residentName: userMap.get(bill.residentId) || bill.residentId,
      apartmentNumber: apartmentMap.get(bill.apartmentId) || bill.apartmentId,
      blockName: blockMap.get(bill.blockId) || bill.blockId,
      // Ticket details
      ticketTitle: ticket?.title || (bill.billType === 'Monthly' ? `Monthly Society Maintenance (${bill.billingMonth || 'Active'})` : 'Facility Repair Service'),
      ticketCategory: ticket?.category || (bill.billType === 'Monthly' ? 'Society Maintenance' : 'General Maintenance'),
      ticketSeverity: ticket?.severity || 'Standard',
      ticketDescription: ticket?.description || null,
      ticketCreatedAt: ticket?.createdAt || bill.generatedAt,
      ticketStatus: ticket?.status || (bill.paymentStatus === 'Paid' ? 'Resolved' : 'Active'),
      // Work order details
      workOrderId: workOrder?.workOrderId || (ticket ? `WO-${bill.ticketId}` : null),
      workOrderStatus: workOrder?.status || (ticket?.status === 'Resolved' || bill.paymentStatus === 'Paid' ? 'Completed' : 'In Progress'),
      workOrderScheduledAt: workOrder?.scheduledAt || bill.generatedAt,
      workOrderCompletedAt: workOrder?.completedAt || (bill.paidAt ? bill.paidAt : (ticket?.status === 'Resolved' ? ticket.updatedAt : null)),
      completionNote: workOrder?.completionNote || (ticket ? 'Maintenance inspection and corrective action completed.' : null),
      completionImage: workOrder?.completionImage || null,
      // Technician details
      technicianId: techId,
      technicianName: tech?.name || (bill.billType === 'Monthly' ? 'Society Facility Team' : 'Suresh'),
      technicianSkill: tech?.skill || (bill.billType === 'Monthly' ? 'Society Operations' : 'Electrician'),
      technicianPhone: tech?.phone || null,
      technicianRating: tech?.rating || 4.8,
    };
  });
}

