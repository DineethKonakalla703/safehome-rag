import { Building2, HardHat, Home, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleLabels, users } from '../data/mockData';
import { getCurrentUser, setCurrentUser } from '../utils/auth';

const roleMeta = {
  MAIN_ADMIN: { icon: ShieldCheck, copy: 'Community-wide dashboards, tickets and billing.', access: 'Global access' },
  BLOCK_SUB_ADMIN: { icon: Building2, copy: 'Manage Block A service operations and bills.', access: 'Block A access' },
  RESIDENT: { icon: Home, copy: 'Create complaints and track personal records.', access: 'Personal access' },
  TECHNICIAN: { icon: HardHat, copy: 'View maintenance work assigned to Suresh.', access: 'Assigned work only' },
};

const destination = (role) => role === 'MAIN_ADMIN' ? '/main-admin/dashboard' : role === 'BLOCK_SUB_ADMIN' ? '/block-admin/dashboard' : role === 'RESIDENT' ? '/resident/dashboard' : '/tickets';

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  if (current) return <Navigate to={destination(current.role)} replace />;
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark large"><ShieldCheck size={28} /></span><div><strong>SafeHome-RAG</strong><span>Green Valley Residency</span></div></div>
        <div className="login-intro"><span className="eyebrow">Priority 1 review prototype</span><h1>Residential operations,<br />connected end to end.</h1><h2>AI-Powered Residential Management, Maintenance and Billing CRM</h2><p>Priority 1 review prototype using mock data and rule-based AI simulation. Select a demo user to explore the complete service workflow.</p></div>
        <div className="role-grid">{users.map((user) => {
          const Icon = roleMeta[user.role].icon;
          return <button className="role-card" key={user.id} onClick={() => { setCurrentUser(user); navigate(destination(user.role)); }}><span className="role-icon"><Icon size={23} /></span><span className="role-content"><span className="role-topline"><strong>{user.name}</strong><em>{roleMeta[user.role].access}</em></span><small>{roleLabels[user.role]}</small><p>{roleMeta[user.role].copy}</p><span className="role-email">{user.email}</span></span><span className="enter">Open</span></button>;
        })}</div>
        <p className="login-notice"><ShieldCheck size={14} /> Demo login for project review. No password required · Local mock data only</p>
      </section>
      <aside className="login-aside"><div className="login-aside-content"><span className="signal">Live workflow preview</span><h2>One complaint.<br />Every handoff visible.</h2><p>Follow a service request from resident reporting through safety classification, block administration, technician assignment, and billing.</p></div><div className="workflow-orbit"><span>Resident</span><span>AI rules</span><span>Admin</span><span>Billing</span></div><div className="flow-list"><span>01 <b>Resident reports an issue</b></span><span>02 <b>Rules identify risk</b></span><span>03 <b>Admin coordinates action</b></span><span>04 <b>Billing reflects the work</b></span></div></aside>
    </main>
  );
}

