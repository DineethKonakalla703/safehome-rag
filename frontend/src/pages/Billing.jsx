import { Receipt } from 'lucide-react';
import { apartments, blocks, nameFor, users } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';
import { PageHeader, useRecords } from './DashboardShared';

export default function Billing() {
  const user = getCurrentUser(); const { bills } = useRecords(user);
  return <><PageHeader title="Billing records" subtitle={`${bills.length} bill${bills.length === 1 ? '' : 's'} visible to your role.`} /><section className="content-card">{bills.length ? <div className="table-wrap"><table><thead><tr><th>Bill ID</th><th>Ticket ID</th><th>Resident</th><th>Apartment</th><th>Block</th><th>Service</th><th>Parts</th><th>Total</th><th>Payment</th><th>Generated</th></tr></thead><tbody>{bills.map((bill) => <tr key={bill.id}><td><strong className="ticket-id">{bill.id}</strong></td><td>{bill.ticketId}</td><td>{nameFor(users, bill.residentId)}</td><td>{nameFor(apartments, bill.apartmentId, bill.apartmentId)}</td><td>{nameFor(blocks, bill.blockId)}</td><td>₹{bill.serviceCharge}</td><td>₹{bill.partsCharge}</td><td><strong>₹{bill.totalAmount}</strong></td><td><StatusBadge>{bill.paymentStatus}</StatusBadge></td><td>{bill.generatedAt}</td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><Receipt size={22} /></div><strong>No billing records</strong><p>Bills generated for completed service work will appear here.</p></div>}</section></>;
}

