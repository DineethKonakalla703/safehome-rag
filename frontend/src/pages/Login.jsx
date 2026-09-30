import { Building2, HardHat, Home, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDemoUsers, login } from '../api/userApi';
import { ErrorState, LoadingState } from '../components/DataState';
import { getCurrentUser, getToken, setSession } from '../utils/auth';

const roleOptions = [
  { role: 'MAIN_ADMIN', title: 'Main Admin', roleLabel: 'MAIN ADMIN', icon: ShieldCheck, description: 'Community-wide administration, reports, and governance.', access: 'Global access', email: 'admin@safehome.com' },
  { role: 'BLOCK_SUB_ADMIN', title: 'Block Admin', roleLabel: 'BLOCK SUB ADMIN', icon: Building2, description: 'Manage assigned block residents, tickets, operations, and billing.', access: 'Block access', email: 'blocka.admin@safehome.com' },
  { role: 'RESIDENT', title: 'Resident', roleLabel: 'RESIDENT', icon: Home, description: 'Raise complaints, track tickets, visitors, bills, and bookings.', access: 'Personal access', email: 'resident1@safehome.com' },
  { role: 'TECHNICIAN', title: 'Technician', roleLabel: 'TECHNICIAN', icon: HardHat, description: 'View assigned tickets, work orders, and update work progress.', access: 'Work access', email: 'technician@safehome.com' },
];
const destination = (role) => role === 'MAIN_ADMIN' ? '/main-admin/dashboard' : role === 'BLOCK_SUB_ADMIN' ? '/block-admin/dashboard' : role === 'RESIDENT' ? '/resident/dashboard' : role === 'SECURITY' ? '/security/dashboard' : '/work-orders';

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '' });
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
  const chooseRole = (option) => {
    const seededUser = users.find((user) => user.role === option.role);
    setForm({ email: seededUser?.email || option.email, password: 'Demo@123' });
    setState((value) => ({ ...value, error: null }));
  };

  return <main className="login-page"><section className="login-panel"><div className="login-brand"><span className="brand-mark large"><ShieldCheck size={28} /></span><div><strong>SafeHome-RAG</strong><span>Green Valley Residency</span></div></div><div className="login-intro"><span className="eyebrow">Phase 1 core platform</span><h1>Residential operations,<br />connected end to end.</h1><h2>Secure community management, maintenance, access, billing, and resident services</h2><p>Choose a role shortcut to fill the demo credentials, then use the normal sign-in flow.</p></div><form className="login-form" onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Select a role or enter an email" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter password" required /></label><button className="primary-button" disabled={state.submitting}><LockKeyhole size={16} /> {state.submitting ? 'Signing in…' : 'Sign in'}</button></form>{state.error && !state.loading && <ErrorState error={state.error} onRetry={state.error.status === 0 ? load : undefined} />}{state.loading ? <LoadingState label="Loading demo accounts…" /> : !state.error && <div className="role-grid">{roleOptions.filter((option) => users.some((user) => user.role === option.role)).map((option) => { const Icon = option.icon; return <button type="button" className="role-card" key={option.role} disabled={state.submitting} onClick={() => chooseRole(option)}><span className="role-icon"><Icon size={23} /></span><span className="role-content"><span className="role-topline"><strong>{option.title}</strong><em>{option.access}</em></span><small>Role: {option.roleLabel}</small><p>{option.description}</p></span><span className="enter">Use role</span></button>; })}</div>}<p className="login-notice"><ShieldCheck size={14} /> Demo password: Demo@123 · Select a role, then sign in securely</p></section><aside className="login-aside"><div className="login-aside-content"><span className="signal">Phase 1 operations suite</span><h2>Every resident service.<br />One accountable system.</h2><p>Coordinate community records, maintenance, visitors, parking, amenities, billing, inventory, and reporting with role-aware access.</p></div><div className="workflow-orbit"><span>Residents</span><span>Operations</span><span>Security</span><span>Finance</span></div><div className="flow-list"><span>01 <b>Authenticated role access</b></span><span>02 <b>Persistent operational records</b></span><span>03 <b>Audited service workflows</b></span><span>04 <b>Reports and exports</b></span></div></aside></main>;
}
