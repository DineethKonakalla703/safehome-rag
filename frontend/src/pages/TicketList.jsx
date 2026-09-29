import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketTable from '../components/TicketTable';
import { getCurrentUser } from '../utils/auth';
import { PageHeader, useRecords } from './DashboardShared';

export default function TicketList() {
  const user = getCurrentUser(); const { tickets } = useRecords(user);
  const title = user.role === 'RESIDENT' ? 'My tickets' : user.role === 'TECHNICIAN' ? 'Assigned tickets' : 'Maintenance tickets';
  return <><PageHeader title={title} subtitle={`${tickets.length} record${tickets.length === 1 ? '' : 's'} available under your access level.`} action={user.role === 'RESIDENT' ? <Link className="primary-button" to="/resident/create-complaint"><Plus size={17} /> Create complaint</Link> : null} /><section className="content-card"><TicketTable tickets={tickets} /></section></>;
}

