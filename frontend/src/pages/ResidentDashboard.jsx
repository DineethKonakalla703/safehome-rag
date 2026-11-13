import { BookOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { DashboardView } from './DashboardShared';

export default function ResidentDashboard() {
  const user = getCurrentUser();
  return (
    <>
      <div className="resident-quick-banner">
        <div className="resident-quick-banner-text">
          <BookOpen size={20} className="text-primary" />
          <div>
            <strong>Resident Knowledge Support & Emergency SOPs</strong>
            <p>Need safety advice or answers? Search approved community guidelines, emergency procedures, and society FAQs.</p>
          </div>
        </div>
        <Link to="/knowledge-support" className="secondary-button compact-btn">
          Search Knowledge Base &rarr;
        </Link>
      </div>
      <Link className="floating-create" to="/resident/create-complaint">
        <Plus size={18} /> New complaint
      </Link>
      <DashboardView user={user} type="resident" />
    </>
  );
}

