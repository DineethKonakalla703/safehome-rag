import { CreditCard, LayoutDashboard, ListChecks, PlusCircle, ShieldCheck, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = {
  MAIN_ADMIN: [
    ['/main-admin/dashboard', 'Dashboard', LayoutDashboard], ['/tickets', 'Tickets', ListChecks], ['/billing', 'Billing', CreditCard],
  ],
  BLOCK_SUB_ADMIN: [
    ['/block-admin/dashboard', 'Dashboard', LayoutDashboard], ['/tickets', 'Tickets', ListChecks], ['/billing', 'Billing', CreditCard],
  ],
  RESIDENT: [
    ['/resident/dashboard', 'Dashboard', LayoutDashboard], ['/resident/create-complaint', 'Create Complaint', PlusCircle], ['/tickets', 'My Tickets', ListChecks], ['/billing', 'Billing', CreditCard],
  ],
  TECHNICIAN: [['/tickets', 'Assigned Tickets', ListChecks]],
};

export default function Sidebar({ user, open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark"><ShieldCheck size={22} /></span><div><strong>SafeHome</strong><small>RAG prototype</small></div><button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><X /></button></div>
      <nav>{links[user.role].map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={onClose}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
      <div className="prototype-note"><ShieldCheck size={18} /><p><strong>Priority 1 Prototype</strong><span>Mock data + rule-based AI simulation</span></p></div>
    </aside>
  );
}

