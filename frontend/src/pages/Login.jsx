import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  HardHat,
  Home,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDemoUsers, login } from '../api/userApi';
import { ErrorState, LoadingState } from '../components/DataState';
import { getCurrentUser, getToken, setSession } from '../utils/auth';

const roleOptions = [
  { role: 'MAIN_ADMIN', title: 'Main Admin', email: 'admin@safehome.com', icon: ShieldCheck },
  { role: 'BLOCK_SUB_ADMIN', title: 'Block Admin', email: 'blocka.admin@safehome.com', icon: Building2 },
  { role: 'RESIDENT', title: 'Resident', email: 'resident1@safehome.com', icon: Home },
  { role: 'TECHNICIAN', title: 'Technician', email: 'technician@safehome.com', icon: HardHat },
  { role: 'SECURITY', title: 'Security', email: 'security@safehome.com', icon: ShieldAlert },
  { role: 'FACILITY_MANAGER', title: 'Facility Manager', email: 'facility@safehome.com', icon: Wrench },
];

const destination = (role) => {
  if (role === 'MAIN_ADMIN') return '/main-admin/dashboard';
  if (role === 'BLOCK_SUB_ADMIN') return '/block-admin/dashboard';
  if (role === 'RESIDENT') return '/resident/dashboard';
  if (role === 'SECURITY') return '/security/dashboard';
  if (role === 'TECHNICIAN') return '/technician/dashboard';
  if (role === 'FACILITY_MANAGER') return '/work-orders';
  return '/tickets';
};

export default function Login() {
  const navigate = useNavigate();
  const current = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: 'admin@safehome.com', password: 'Demo@123' });
  const [selectedRole, setSelectedRole] = useState('MAIN_ADMIN');
  const [state, setState] = useState({ loading: false, submitting: false, error: null });

  const load = () => {
    getDemoUsers()
      .then((data) => setUsers(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  if (current && getToken()) {
    return <Navigate to={destination(current.role)} replace />;
  }

  const authenticate = async (email, password) => {
    setState((v) => ({ ...v, submitting: true, error: null }));
    try {
      const session = await login(email, password);
      setSession(session.user, session.token);
      navigate(destination(session.user.role));
    } catch (error) {
      setState((v) => ({ ...v, error }));
    } finally {
      setState((v) => ({ ...v, submitting: false }));
    }
  };

  const submit = (event) => {
    event.preventDefault();
    authenticate(form.email, form.password);
  };

  const chooseRole = (option) => {
    const seededUser = users.find((user) => user.role === option.role);
    setForm({ email: seededUser?.email || option.email, password: 'Demo@123' });
    setSelectedRole(option.role);
    setState((v) => ({ ...v, error: null }));
  };

  return (
    <main className="saas-login-page">
      {/* Left Column: Compact Login Card */}
      <section className="login-form-pane">
        <div className="login-card-box">
          {/* Brand Header */}
          <div className="login-header-brand">
            <span className="brand-logo-icon">
              <ShieldCheck size={24} />
            </span>
            <div className="brand-text">
              <strong>SafeHome-RAG</strong>
              <span>Residential Operations CRM</span>
            </div>
          </div>

          {/* Heading */}
          <div className="login-headline">
            <h1>Welcome back</h1>
            <p>Access your residential operations workspace.</p>
          </div>

          {/* Login Form */}
          <form className="saas-form" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@community.com"
                required
                className="saas-input"
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
                <span className="pwd-hint">Demo: Demo@123</span>
              </div>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="saas-input"
              />
            </div>

            {state.error && (
              <div className="login-error-alert">
                <AlertTriangle size={15} />
                <span>{state.error.message || 'Invalid email or password.'}</span>
              </div>
            )}

            <button
              type="submit"
              className="saas-submit-btn"
              disabled={state.submitting}
            >
              <LockKeyhole size={16} />
              <span>{state.submitting ? 'Authenticating…' : 'Sign in to workspace'}</span>
            </button>
          </form>

          {/* Role Shortcuts Section */}
          <div className="role-shortcuts-section">
            <div className="divider-text">
              <span>Quick Role Shortcuts</span>
            </div>
            <div className="compact-roles-grid">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    className={`compact-role-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => chooseRole(option)}
                    disabled={state.submitting}
                    title={`Fill ${option.title} credentials`}
                  >
                    <Icon size={14} className="role-btn-icon" />
                    <span>{option.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="role-helper-note">
              <CheckCircle2 size={13} className="text-success" />
              <span>Select any role above to pre-fill credentials instantly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: SaaS Dashboard Product Preview */}
      <aside className="login-preview-pane">
        <div className="preview-content-wrapper">
          <div className="preview-hero-copy">
            <div className="preview-badge">
              <span>Enterprise Community Ops</span>
            </div>
            <h2>One platform for every residential service.</h2>
            <p>
              Track complaints, work orders, visitors, billing, amenities, parking,
              inventory and reports with role-based access.
            </p>
          </div>

          {/* Interactive Mock Dashboard Preview Cards */}
          <div className="preview-dashboard-mock">
            <div className="mock-grid-cards">
              {/* Card 1: Open Tickets */}
              <div className="mock-stat-card">
                <div className="mock-stat-header">
                  <span>Open Tickets</span>
                  <span className="mock-pill red">2 Urgent</span>
                </div>
                <div className="mock-stat-value">14</div>
                <div className="mock-stat-meta">12 under active review</div>
              </div>

              {/* Card 2: Pending Visitors */}
              <div className="mock-stat-card">
                <div className="mock-stat-header">
                  <span>Pending Visitors</span>
                  <span className="mock-pill blue">Gate Pass</span>
                </div>
                <div className="mock-stat-value">8</div>
                <div className="mock-stat-meta">Security checkpoint live</div>
              </div>

              {/* Card 3: SLA Risks */}
              <div className="mock-stat-card">
                <div className="mock-stat-header">
                  <span>SLA Risks</span>
                  <span className="mock-pill amber">&lt;4h Critical</span>
                </div>
                <div className="mock-stat-value">3</div>
                <div className="mock-stat-meta">Auto-escalation active</div>
              </div>

              {/* Card 4: Pending Bills */}
              <div className="mock-stat-card">
                <div className="mock-stat-header">
                  <span>Pending Bills</span>
                  <span className="mock-pill green">94% Collected</span>
                </div>
                <div className="mock-stat-value">₹42,500</div>
                <div className="mock-stat-meta">Monthly cycle current</div>
              </div>
            </div>

            {/* Recent Operational Activity Stream */}
            <div className="mock-activity-box">
              <div className="mock-activity-title">Recent Activity</div>
              <div className="mock-activity-list">
                <div className="mock-activity-row">
                  <span className="status-dot red" />
                  <div className="activity-info">
                    <strong>Water leakage escalated</strong>
                    <small>Block A · Immediate technician response</small>
                  </div>
                  <span className="activity-time">4m ago</span>
                </div>

                <div className="mock-activity-row">
                  <span className="status-dot green" />
                  <div className="activity-info">
                    <strong>Visitor approved for A-204</strong>
                    <small>Security cleared gate entry</small>
                  </div>
                  <span className="activity-time">12m ago</span>
                </div>

                <div className="mock-activity-row">
                  <span className="status-dot blue" />
                  <div className="activity-info">
                    <strong>Technician assigned to lift issue</strong>
                    <small>Work Order #WO-104 in progress</small>
                  </div>
                  <span className="activity-time">28m ago</span>
                </div>

                <div className="mock-activity-row">
                  <span className="status-dot purple" />
                  <div className="activity-info">
                    <strong>Monthly bills generated</strong>
                    <small>128 apartments updated</small>
                  </div>
                  <span className="activity-time">1h ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="preview-trust-footer">
            <span>Role-Scoped Security</span>
            <span>•</span>
            <span>Governed Claude AI</span>
            <span>•</span>
            <span>MongoDB ACID Transactions</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
