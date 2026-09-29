import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { DashboardView } from './DashboardShared';
export default function ResidentDashboard() { return <><Link className="floating-create" to="/resident/create-complaint"><Plus size={18} /> New complaint</Link><DashboardView user={getCurrentUser()} type="resident" /></>; }

