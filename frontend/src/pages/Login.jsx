import { Building2, HardHat, Home, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDemoUsers, login } from '../api/userApi';
import { ErrorState, LoadingState } from '../components/DataState';
import { getCurrentUser, getToken, setSession } from '../utils/auth';

const roleLabels = { MAIN_ADMIN: 'Main Admin', BLOCK_SUB_ADMIN: 'Block Sub Admin', RESIDENT: 'Resident', TECHNICIAN: 'Technician' };
const roleMeta = {
  MAIN_ADMIN: { icon: ShieldCheck, copy: 'Community-wide administration and reports.', access: 'Global access' },
  BLOCK_SUB_ADMIN: { icon: Building2, copy: 'Block A residents, operations, and billing.', access: 'Block A access' },
  RESIDENT: { icon: Home, copy: 'Personal services, visitors, bills, and bookings.', access: 'Personal access' },
  TECHNICIAN: { icon: HardHat, copy: 'Assigned tickets and work orders.', access: 'Work access' },
};
const destination = (role) => role === 'MAIN_ADMIN' ? '/main-admin/dashboard' : role === 'BLOCK_SUB_ADMIN' ? '/block-admin/dashboard' : role === 'RESIDENT' ? '/resident/dashboard' : role === 'SECURITY' ? '/security/dashboard' : '/work-orders';

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: 'admin@safehome.com', password: 'Demo@123' });
  const [state, setState] = useState({ loading: true, submitting: false, error: null });
  const load = () => { setState((v) => ({ ...v, loading: true, error: null })); getDemoUsers().then(setUsers).catch((error) => setState((v) => ({ ...v, error }))).finally(() => setState((v) => ({ ...v, loading: false }))); };
  useEffect(load, []);
  if (current && getToken()) return <Navigate to={destination(current.role)} replace />;

  const authenticate = async (email, password) => {
    setState((v) => ({ ...v, submitting: true, error: null }));
    try { const session = await login(email, password); setSession(session.user, session.token); navigate(destination(session.user.role)); }
    catch (error) { setState((v) => ({ ...v, error })); }
    finally { setState((v) => ({ ...v, submitting: false })); }
  };
  const submit = (event) => { event.preventDefault(); authenticate(form.email, form.password); };

  return <main className="login-page"><section className="login-panel"><div className="login-brand"><span className="brand-mark large"><ShieldCheck size={28} /></span><div><strong>SafeHome-RAG</strong><span>Green Valley Residency</span></div></div><div className="login-intro"><span className="eyebrow">Phase 1 core platform</span><h1>Residential operations,<br />connected end to end.</h1><h2>Secure community management, maintenance, access, billing, and resident services</h2><p>Sign in with a demo account or use the review shortcuts below.</p></div><form className="login-form" onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label><button className="primary-button" disabled={state.submitting}><LockKeyhole size={16} /> {state.submitting ? 'Signing in…' : 'Sign in'}</button></form>{state.error && !state.loading && <ErrorState error={state.error} onRetry={state.error.status === 0 ? load : undefined} />}{state.loading ? <LoadingState label="Loading demo accounts…" /> : !state.error && <div className="role-grid">{users.map((user) => { const meta = roleMeta[user.role]; const Icon = meta.icon; return <button className="role-card" key={user.id} disabled={state.submitting} onClick={() => authenticate(user.email, 'Demo@123')}><span className="role-icon"><Icon size={23} /></span><span className="role-content"><span className="role-topline"><strong>{user.name}</strong><em>{meta.access}</em></span><small>{roleLabels[user.role]}</small><p>{meta.copy}</p><span className="role-email">{user.email}</span></span><span className="enter">Open</span></button>; })}</div>}<p className="login-notice"><ShieldCheck size={14} /> Demo password: Demo@123 · JWT-secured review environment</p></section><aside className="login-aside"><div className="login-aside-content"><span className="signal">Phase 1 operations suite</span><h2>Every resident service.<br />One accountable system.</h2><p>Coordinate community records, maintenance, visitors, parking, amenities, billing, inventory, and reporting with role-aware access.</p></div><div className="workflow-orbit"><span>Residents</span><span>Operations</span><span>Security</span><span>Finance</span></div><div className="flow-list"><span>01 <b>Authenticated role access</b></span><span>02 <b>Persistent operational records</b></span><span>03 <b>Audited service workflows</b></span><span>04 <b>Reports and exports</b></span></div></aside></main>;
}
