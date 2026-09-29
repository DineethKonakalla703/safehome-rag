import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apartments, blocks, nameFor, technicians, users } from '../data/mockData';
import StatusBadge from './StatusBadge';

export default function TicketTable({ tickets, compact = false }) {
  if (!tickets.length) return <div className="empty-state"><ListIcon /><strong>No tickets to show</strong><p>Tickets available to this role will appear here.</p></div>;
  return (
    <div className="table-wrap"><table><thead><tr>
      <th>Ticket</th><th>Title</th>{!compact && <><th>Resident</th><th>Apartment</th><th>Block</th><th>Category</th><th>Severity</th><th>Safety</th></>}<th>Status</th>{!compact && <><th>Technician</th><th>Created</th></>}<th></th>
    </tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}>
      <td><strong className="ticket-id">{ticket.id}</strong></td><td><span className="cell-title">{ticket.title}</span></td>
      {!compact && <><td>{nameFor(users, ticket.residentId)}</td><td>{nameFor(apartments, ticket.apartmentId, ticket.apartmentId)}</td><td>{nameFor(blocks, ticket.blockId)}</td><td>{ticket.category}</td><td><StatusBadge value={ticket.severity === 'High' ? 'High Risk' : ticket.severity}>{ticket.severity}</StatusBadge></td><td>{ticket.safetyRisk ? <StatusBadge value="High Risk">Yes</StatusBadge> : 'No'}</td></>}
      <td><StatusBadge>{ticket.status}</StatusBadge></td>
      {!compact && <><td>{nameFor(technicians, ticket.assignedTechnicianId, 'Unassigned')}</td><td>{ticket.createdAt}</td></>}
      <td><Link className="view-link" to={`/tickets/${ticket.id}`} aria-label={`View ${ticket.id}`}><Eye size={16} /> View</Link></td>
    </tr>)}</tbody></table></div>
  );
}

function ListIcon() { return <div className="empty-icon"><Eye size={22} /></div>; }

