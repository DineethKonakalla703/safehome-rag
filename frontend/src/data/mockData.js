export const community = {
  id: 'C001',
  name: 'Green Valley Residency',
  address: 'Vijayawada, Andhra Pradesh',
};

export const blocks = [
  { id: 'B001', name: 'Block A' },
  { id: 'B002', name: 'Block B' },
];

export const apartments = [
  { id: 'A101', name: 'A-101', blockId: 'B001' },
  { id: 'A102', name: 'A-102', blockId: 'B001' },
  { id: 'B101', name: 'B-101', blockId: 'B002' },
];

export const users = [
  { id: 'U001', name: 'Main Admin', email: 'admin@safehome.com', role: 'MAIN_ADMIN', communityId: 'C001', blockId: null },
  { id: 'U002', name: 'Block A Admin', email: 'blocka.admin@safehome.com', role: 'BLOCK_SUB_ADMIN', communityId: 'C001', blockId: 'B001' },
  { id: 'U003', name: 'Resident One', email: 'resident1@safehome.com', role: 'RESIDENT', communityId: 'C001', blockId: 'B001', apartmentId: 'A102' },
  { id: 'U004', name: 'Technician Suresh', email: 'technician@safehome.com', role: 'TECHNICIAN', communityId: 'C001', blockId: 'B001', technicianId: 'T002' },
];

export const technicians = [
  { id: 'T001', name: 'Ramesh', specialty: 'Plumber' },
  { id: 'T002', name: 'Suresh', specialty: 'Electrician' },
  { id: 'T003', name: 'Kiran', specialty: 'General Maintenance' },
];

export const initialTickets = [
  {
    id: 'TK001',
    title: 'Water leakage near electrical switchboard',
    description: 'Water is leaking near the electrical switchboard in A-102.',
    residentId: 'U003', apartmentId: 'A102', blockId: 'B001',
    category: 'Plumbing + Electrical Risk', severity: 'High', safetyRisk: true,
    suggestedAction: 'Immediate escalation required. Assign electrician and plumber.',
    humanApprovalRequired: true, status: 'New', assignedTechnicianId: null,
    createdAt: '2026-09-29',
    timeline: [
      { text: 'Ticket created by Resident One', at: '2026-09-29' },
      { text: 'AI simulation detected high safety risk', at: '2026-09-29' },
    ],
  },
];

export const initialBills = [
  {
    id: 'BILL001', ticketId: 'TK001', residentId: 'U003', apartmentId: 'A102', blockId: 'B001',
    serviceCharge: 300, partsCharge: 200, totalAmount: 500,
    paymentStatus: 'Pending', generatedAt: '2026-09-29',
  },
];

export const roleLabels = {
  MAIN_ADMIN: 'Main Admin', BLOCK_SUB_ADMIN: 'Block Sub Admin', RESIDENT: 'Resident', TECHNICIAN: 'Technician',
};

export const nameFor = (list, id, fallback = '—') => list.find((item) => item.id === id)?.name || fallback;

