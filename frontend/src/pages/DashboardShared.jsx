import { useEffect, useState } from 'react';
import { AlertTriangle, Banknote, Building2, CircleCheck, Clock3, FileText, Receipt, Users } from 'lucide-react';
import { apartments, blocks, users } from '../data/mockData';
import { filterBillsByUser, filterTicketsByUser } from '../utils/filters';
import { getAllBills, getAllTickets } from '../utils/storage';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';

const money = (value) => `₹${value.toLocaleString('en-IN')}`;

export function useRecords(user) {
  const [version, setVersion] = useState(0);
  useEffect(() => { const refresh = () => setVersion((v) => v + 1); window.addEventListener('safehome:data-change', refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener('safehome:data-change', refresh); window.removeEventListener('storage', refresh); }; }, []);
  return { tickets: filterTicketsByUser(getAllTickets(), user), bills: filterBillsByUser(getAllBills(), user), version };
}

export function DashboardView({ user, type }) {
  const { tickets, bills } = useRecords(user);
  const open = tickets.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length;
  const highRisk = tickets.filter((item) => item.safetyRisk).length;
  const pendingBills = bills.filter((item) => item.paymentStatus === 'Pending');
  const paidBills = bills.filter((item) => item.paymentStatus === 'Paid');
  const recent = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  let cards;
  let title;
  let subtitle;
  if (type === 'main') {
    title = 'Community overview'; subtitle = 'A live summary of maintenance and billing across Green Valley Residency.';
    cards = [
      ['Total Blocks', blocks.length, Building2], ['Total Residents', users.filter((u) => u.role === 'RESIDENT').length, Users], ['Total Tickets', tickets.length, FileText], ['Open Tickets', open, Clock3, 'amber'],
      ['High Risk Tickets', highRisk, AlertTriangle, 'red'], ['Pending Bills', pendingBills.length, Receipt, 'amber'], ['Paid Bills', paidBills.length, CircleCheck, 'green'], ['Total Billing Amount', money(bills.reduce((sum, b) => sum + b.totalAmount, 0)), Banknote, 'green'],
    ];
  } else if (type === 'block') {
    title = 'Block A operations'; subtitle = 'Restricted view for residents, complaints, and billing within your assigned block.';
    cards = [
      ['Block Name', blocks.find((b) => b.id === user.blockId)?.name, Building2], ['Block Residents', users.filter((u) => u.role === 'RESIDENT' && u.blockId === user.blockId).length, Users], ['Block Tickets', tickets.length, FileText], ['Open Complaints', open, Clock3, 'amber'], ['High Risk Tickets', highRisk, AlertTriangle, 'red'], ['Pending Bills', pendingBills.length, Receipt, 'amber'],
    ];
  } else {
    title = `Welcome back, ${user.name}`; subtitle = `Track service activity for ${apartments.find((a) => a.id === user.apartmentId)?.name || user.apartmentId}.`;
    cards = [
      ['My Tickets', tickets.length, FileText], ['Open Tickets', open, Clock3, 'amber'], ['My Bills', bills.length, Receipt], ['Pending Amount', money(pendingBills.reduce((sum, b) => sum + b.totalAmount, 0)), Banknote, 'amber'], ['Recent Ticket Status', recent[0]?.status || 'No tickets', CircleCheck, recent[0]?.status === 'Resolved' ? 'green' : 'blue'],
    ];
  }
  return <><PageHeader title={title} subtitle={subtitle} /><section className="stats-grid">{cards.map(([label, value, Icon, tone]) => <StatCard key={label} label={label} value={value} icon={Icon} tone={tone} />)}</section><section className="content-card"><div className="section-heading"><div><h2>Recent tickets</h2><p>The latest complaints visible to your role.</p></div></div><TicketTable tickets={recent} compact /></section></>;
}

export function PageHeader({ title, subtitle, action }) { return <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }

