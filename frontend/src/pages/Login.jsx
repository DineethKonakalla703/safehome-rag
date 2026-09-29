import { Building2, HardHat, Home, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { roleLabels, users } from '../data/mockData';
import { getCurrentUser, setCurrentUser } from '../utils/auth';

const roleMeta = {
  MAIN_ADMIN: { icon: ShieldCheck, copy: 'View community-wide operations and billing.' },
  BLOCK_SUB_ADMIN: { icon: Building2, copy: 'Manage Block A tickets, teams, and bills.' },
  RESIDENT: { icon: Home, copy: 'Raise complaints and follow their progress.' },
  TECHNICIAN: { icon: HardHat, copy: 'View tickets assigned to Suresh.' },
};

const destination = (role) => role === 'MAIN_ADMIN' ? '/main-admin/dashboard' : role === 'BLOCK_SUB_ADMIN' ? '/block-admin/dashboard' : role === 'RESIDENT' ? '/resident/dashboard' : '/tickets';

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  if (current) return <Navigate to={destination(current.role)} replace />;
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark large"><ShieldCheck size={28} /></span><div><strong>SafeHome-RAG</strong><span>Residential operations, simplified</span></div></div>
        <div className="login-intro"><span className="eyebrow">Priority 1 MVP</span><h1>Choose a demo role</h1><p>Explore the complete complaint, assignment, status, and billing workflow for Green Valley Residency.</p></div>
        <div className="role-grid">{users.map((user) => {
          const Icon = roleMeta[user.role].icon;
          return <button className="role-card" key={user.id} onClick={() => { setCurrentUser(user); navigate(destination(user.role)); }}><span className="role-icon"><Icon size={23} /></span><span><strong>{user.name}</strong><small>{roleLabels[user.role]}</small><p>{roleMeta[user.role].copy}</p></span><span className="enter">Enter</span></button>;
        })}</div>
        <p className="login-notice">No password required. This prototype uses local mock data only.</p>
      </section>
      <aside className="login-aside"><div><span className="signal">Live workflow preview</span><h2>One complaint.<br />Every handoff visible.</h2><p>Rule-based safety analysis, block-level access, technician assignment, progress tracking, and billing in one focused review experience.</p></div><div className="flow-list"><span>01 <b>Resident reports an issue</b></span><span>02 <b>Rules identify risk</b></span><span>03 <b>Admin coordinates action</b></span><span>04 <b>Billing reflects the work</b></span></div></aside>
    </main>
  );
}

