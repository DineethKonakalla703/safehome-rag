import { AlertTriangle, Clock3, Filter, Plus, Search, Tickets } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import TicketTable from '../components/TicketTable';
import { getCurrentUser } from '../utils/auth';
import { PageHeader, useRecords } from './DashboardShared';
import StatCard from '../components/StatCard';

export default function TicketList() {
  const user = getCurrentUser(); const { tickets } = useRecords(user);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const visibleTickets = tickets.filter((ticket) => {
    const matchesQuery = `${ticket.id} ${ticket.title} ${ticket.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === 'All' || ticket.status === status);
  });
  const open = tickets.filter((ticket) => !['Resolved', 'Closed'].includes(ticket.status)).length;
  const highRisk = tickets.filter((ticket) => ticket.safetyRisk).length;
  const title = user.role === 'RESIDENT' ? 'My tickets' : user.role === 'TECHNICIAN' ? 'Assigned tickets' : 'Maintenance tickets';
  return <><PageHeader eyebrow="Service desk" title={title} subtitle={`${tickets.length} record${tickets.length === 1 ? '' : 's'} available under your access level.`} action={user.role === 'RESIDENT' ? <Link className="primary-button" to="/resident/create-complaint"><Plus size={17} /> Create complaint</Link> : null} /><section className="stats-grid ticket-stats"><StatCard label="Visible Tickets" value={tickets.length} icon={Tickets} /><StatCard label="Open Tickets" value={open} icon={Clock3} tone="amber" /><StatCard label="High Risk" value={highRisk} icon={AlertTriangle} tone="red" /></section><section className="content-card"><div className="table-toolbar"><div className="search-control"><Search size={17} /><input aria-label="Search tickets" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, title, or category" /></div><div className="filter-control"><Filter size={16} /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>New</option><option>Assigned</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select></div><span className="result-count">{visibleTickets.length} shown</span></div><TicketTable tickets={visibleTickets} /></section></>;
}

