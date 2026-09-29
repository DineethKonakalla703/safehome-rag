import { useEffect, useState } from 'react';
import { AlertTriangle, Banknote, Building2, CircleCheck, Clock3, FileText, Receipt, Users } from 'lucide-react';
import { apartments, blocks, users } from '../data/mockData';
import { filterBillsByUser, filterTicketsByUser } from '../utils/filters';
import { getAllBills, getAllTickets } from '../utils/storage';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import PageHeader from '../components/PageHeader';

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
  const eyebrow = type === 'main' ? 'Global operations' : type === 'block' ? 'Block A restricted view' : 'Resident workspace';
  const billingTotal = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  return <><PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} meta={<><span className="live-indicator"><i /> Live local data</span><span>Updated from this browser</span></>} />{highRisk > 0 && <div className="risk-banner"><span className="risk-banner-icon"><AlertTriangle size={20} /></span><div><strong>{highRisk} high-risk ticket{highRisk === 1 ? '' : 's'} require attention</strong><p>Review safety guidance and confirm the appropriate human response before work begins.</p></div><span className="risk-count">{highRisk}</span></div>}<section className="stats-grid">{cards.map(([label, value, Icon, tone]) => <StatCard key={label} label={label} value={value} icon={Icon} tone={tone} helper={label.includes('Billing') || label.includes('Amount') ? 'Current visible records' : undefined} />)}</section><div className="dashboard-grid"><section className="content-card"><div className="section-heading"><div><span className="section-kicker">Operations</span><h2>Recent tickets</h2><p>The latest complaints visible to your role.</p></div></div><TicketTable tickets={recent} compact /></section><aside className="content-card billing-snapshot"><div className="section-heading"><div><span className="section-kicker">Financial snapshot</span><h2>Billing summary</h2><p>Based on your permitted records.</p></div></div><div className="snapshot-total"><span>Total billed</span><strong>{money(billingTotal)}</strong></div><div className="snapshot-row"><span>Pending</span><strong>{pendingBills.length}</strong></div><div className="snapshot-row"><span>Paid</span><strong>{paidBills.length}</strong></div><div className="snapshot-progress"><span style={{ width: `${bills.length ? (paidBills.length / bills.length) * 100 : 0}%` }} /></div><small>{bills.length ? `${Math.round((paidBills.length / bills.length) * 100)}% of bills paid` : 'No bills generated yet'}</small></aside></div></>;
}

export { default as PageHeader } from '../components/PageHeader';

