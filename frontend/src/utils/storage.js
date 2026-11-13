import { initialBills, initialTickets } from '../data/mockData';

const TICKETS_KEY = 'safehome_tickets';
const BILLS_KEY = 'safehome_bills';

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};

const mergeById = (initial, stored) => {
  const map = new Map(initial.map((item) => [item.id, item]));
  stored.forEach((item) => map.set(item.id, item));
  return [...map.values()];
};

export const getStoredTickets = () => read(TICKETS_KEY);
export const saveStoredTickets = (tickets) => localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
export const getAllTickets = () => mergeById(initialTickets, getStoredTickets());
export const updateTicket = (ticket) => {
  const stored = getStoredTickets();
  const next = [...stored.filter((item) => item.id !== ticket.id), ticket];
  saveStoredTickets(next);
  window.dispatchEvent(new Event('safehome:data-change'));
  return ticket;
};

export const getStoredBills = () => read(BILLS_KEY);
export const saveStoredBills = (bills) => localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
export const getAllBills = () => mergeById(initialBills, getStoredBills());
export const createBill = (bill) => {
  const stored = getStoredBills();
  saveStoredBills([...stored.filter((item) => item.id !== bill.id), bill]);
  window.dispatchEvent(new Event('safehome:data-change'));
  return bill;
};

export const nextId = (prefix, records) => {
  const highest = records.reduce((max, item) => {
    const value = Number(item.id.replace(/\D/g, '')) || 0;
    return Math.max(max, value);
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
};

