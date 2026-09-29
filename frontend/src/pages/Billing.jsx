import { Banknote, CheckCircle2, Clock3, Receipt } from 'lucide-react';
import { apartments, blocks, nameFor, users } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';
import { PageHeader, useRecords } from './DashboardShared';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

export default function Billing() {
  const user = getCurrentUser(); const { bills } = useRecords(user);
  const pending = bills.filter((bill) => bill.paymentStatus === 'Pending'); const paid = bills.filter((bill) => bill.paymentStatus === 'Paid'); const total = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  return <><PageHeader eyebrow="Financial records" title="Billing & service charges" subtitle={`${bills.length} bill${bills.length === 1 ? '' : 's'} visible to your role.`} /><section className="stats-grid billing-stats"><StatCard label="Total Bills" value={bills.length} icon={Receipt} /><StatCard label="Pending Bills" value={pending.length} icon={Clock3} tone="amber" /><StatCard label="Paid Bills" value={paid.length} icon={CheckCircle2} tone="green" /><StatCard label="Total Amount" value={`₹${total.toLocaleString('en-IN')}`} icon={Banknote} tone="green" /></section><section className="content-card"><div className="section-heading"><div><span className="section-kicker">Ledger</span><h2>Billing records</h2><p>Service and parts charges generated from maintenance tickets.</p></div></div>{bills.length ? <div className="table-wrap"><table><thead><tr><th>Bill ID</th><th>Ticket ID</th><th>Resident</th><th>Apartment</th><th>Block</th><th>Service</th><th>Parts</th><th>Total</th><th>Payment</th><th>Generated</th></tr></thead><tbody>{bills.map((bill) => <tr key={bill.id}><td><strong className="ticket-id">{bill.id}</strong></td><td>{bill.ticketId}</td><td>{nameFor(users, bill.residentId)}</td><td>{nameFor(apartments, bill.apartmentId, bill.apartmentId)}</td><td>{nameFor(blocks, bill.blockId)}</td><td>₹{bill.serviceCharge}</td><td>₹{bill.partsCharge}</td><td><strong className="amount-cell">₹{bill.totalAmount}</strong></td><td><StatusBadge>{bill.paymentStatus}</StatusBadge></td><td>{bill.generatedAt}</td></tr>)}</tbody></table></div> : <EmptyState icon={Receipt} title="No billing records" description="Bills generated for completed service work will appear here." />}</section></>;
}

