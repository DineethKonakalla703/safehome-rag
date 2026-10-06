import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Home,
  IndianRupee,
  Info,
  Layers,
  Lock,
  Mail,
  Package,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDemoUsers, login } from '../api/userApi';
import { getCurrentUser, getToken, setSession } from '../utils/auth';

const roleOptions = [
  { role: 'MAIN_ADMIN', title: 'Main Admin', email: 'admin@safehome.com', icon: Crown, theme: 'main-admin' },
  { role: 'BLOCK_SUB_ADMIN', title: 'Block Admin', email: 'blocka.admin@safehome.com', icon: Building2, theme: 'block-admin' },
  { role: 'RESIDENT', title: 'Resident', email: 'resident1@safehome.com', icon: Home, theme: 'resident' },
  { role: 'TECHNICIAN', title: 'Technician', email: 'technician@safehome.com', icon: Wrench, theme: 'technician' },
  { role: 'SECURITY', title: 'Security', email: 'security@safehome.com', icon: Shield, theme: 'security' },
  { role: 'FACILITY_MANAGER', title: 'Facility Manager', email: 'facility@safehome.com', icon: Users, theme: 'facility' },
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
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
    <main className="modern-login-layout">
      {/* Left Column: Architectural Photo/Gradient Background with Floating Login Card */}
      <section className="login-card-section">
        <div className="login-card-container">
          {/* Brand Header */}
          <div className="brand-header-row">
            <div className="brand-shield-badge">
              <ShieldCheck size={24} className="shield-icon-svg" />
            </div>
            <div className="brand-title-group">
              <span className="brand-main-title">SafeHome-RAG</span>
              <span className="brand-sub-title">Green Valley Residency</span>
            </div>
          </div>

          {/* Heading */}
          <div className="login-heading-group">
            <h1>Welcome back</h1>
            <p>Access your residential operations workspace.</p>
          </div>

          {/* Form */}
          <form className="login-auth-form" onSubmit={submit}>
            {/* Email Field */}
            <div className="form-field-block">
              <label htmlFor="login-email">Email</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-lead-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email or select a role"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-field-block">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-lead-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-aux-row">
              <label className="remember-me-checkbox">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setForm({ email: form.email, password: 'Demo@123' })}
              >
                Forgot password?
              </button>
            </div>

            {state.error && (
              <div className="login-error-badge">
                <AlertTriangle size={15} />
                <span>{state.error.message || 'Invalid email or password.'}</span>
              </div>
            )}

            {/* Sign in Button */}
            <button
              type="submit"
              className="primary-login-button"
              disabled={state.submitting}
            >
              <span>{state.submitting ? 'Signing in…' : 'Sign in'}</span>
              <ArrowRight size={17} />
            </button>
          </form>

            {/* Centered 'or' divider */}
            <div className="auth-or-divider">
              <span>or</span>
            </div>

          {/* Demo Access Section */}
          <div className="demo-access-panel">
            <div className="demo-access-header">
              <h3>Demo access</h3>
              <p>Try the system with a pre-filled role account.</p>
            </div>

            {/* 6 Role Shortcuts (3x2 Grid) */}
            <div className="roles-shortcut-grid">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    className={`role-shortcut-pill ${option.theme} ${isSelected ? 'active' : ''}`}
                    onClick={() => chooseRole(option)}
                    disabled={state.submitting}
                    title={`Fill ${option.title} credentials`}
                  >
                    <span className="role-icon-box">
                      <Icon size={15} />
                    </span>
                    <span className="role-label-text">{option.title}</span>
                    <ChevronRight size={14} className="role-chevron-icon" />
                  </button>
                );
              })}
            </div>

            <div className="demo-helper-caption">
              <Info size={13} className="info-icon-svg" />
              <span>Role shortcuts fill demo credentials automatically.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Hero Showcase + Detailed Tablet/Laptop Dashboard Preview */}
      <aside className="login-showcase-section">
        <div className="showcase-content-container">
          {/* Kicker & Heading */}
          <div className="showcase-header-copy">
            <div className="showcase-kicker-line">
              <span className="dash-bar" />
              <span>RESIDENTIAL OPERATIONS PLATFORM</span>
            </div>
            <h2>
              One platform for every <span className="sky-highlight">residential service.</span>
            </h2>
            <p>
              Manage complaints, work orders, visitors, billing, amenities, parking,
              inventory, and reports with role-based access.
            </p>
          </div>

          {/* Rendered Tablet / Laptop Dashboard Frame */}
          <div className="mock-device-tablet-frame">
            <div className="mock-device-inner">
              {/* Mini Left Sidebar */}
              <div className="mini-sidebar">
                <div className="mini-brand">
                  <div className="mini-brand-icon">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="mini-brand-labels">
                    <strong>SafeHome-RAG</strong>
                    <small>Green Valley Residency</small>
                  </div>
                </div>

                <nav className="mini-nav-list">
                  <div className="mini-nav-item active">
                    <Layers size={13} />
                    <span>Dashboard</span>
                  </div>
                  <div className="mini-nav-item">
                    <Users size={13} />
                    <span>Residents</span>
                  </div>
                  <div className="mini-nav-item with-chevron">
                    <Settings size={13} />
                    <span>Operations</span>
                    <ChevronRight size={10} className="mini-item-chevron" />
                  </div>
                  <div className="mini-nav-item">
                    <FileText size={13} />
                    <span>Tickets</span>
                  </div>
                  <div className="mini-nav-item">
                    <User size={13} />
                    <span>Visitors</span>
                  </div>
                  <div className="mini-nav-item">
                    <Home size={13} />
                    <span>Amenities</span>
                  </div>
                  <div className="mini-nav-item">
                    <CreditCard size={13} />
                    <span>Billing</span>
                  </div>
                  <div className="mini-nav-item">
                    <Package size={13} />
                    <span>Inventory</span>
                  </div>
                  <div className="mini-nav-item">
                    <BarChart3 size={13} />
                    <span>Reports</span>
                  </div>
                  <div className="mini-nav-item">
                    <Settings size={13} />
                    <span>Settings</span>
                  </div>
                </nav>
              </div>

              {/* Mini Main Content Area */}
              <div className="mini-content-screen">
                {/* Mini Top Navbar */}
                <div className="mini-topbar">
                  <div className="mini-search-box">
                    <Search size={11} className="search-lead-icon" />
                    <span>Search residents, tickets, visitors...</span>
                  </div>
                  <div className="mini-topbar-actions">
                    <div className="mini-bell-wrapper">
                      <Bell size={13} />
                      <span className="bell-red-badge" />
                    </div>
                    <div className="mini-user-profile">
                      <div className="mini-avatar-initials">RK</div>
                      <div className="mini-user-meta">
                        <strong>Rohan Kapoor</strong>
                        <small>Main Admin</small>
                      </div>
                      <ChevronDown size={11} className="mini-dropdown-arrow" />
                    </div>
                  </div>
                </div>

                {/* Mini Greetings & Date Banner */}
                <div className="mini-greeting-row">
                  <div>
                    <h4>Good morning, Rohan! 👋</h4>
                    <p>Here's what's happening at Green Valley Residency today.</p>
                  </div>
                  <div className="mini-date-pill">
                    <span>Tue, 12 Mar 2024</span>
                  </div>
                </div>

                {/* 4 Stat Cards in 1 Row */}
                <div className="mini-stat-cards-row">
                  {/* Card 1: Open Tickets */}
                  <div className="mini-stat-card">
                    <div className="mini-stat-icon-square blue">
                      <FileText size={13} />
                    </div>
                    <span className="mini-card-title">Open Tickets</span>
                    <strong className="mini-card-number">24</strong>
                    <div className="mini-card-trend-row blue">
                      <span className="trend-arrow">↗ 12%</span>
                      <svg width="34" height="12" viewBox="0 0 34 12" className="mini-sparkline">
                        <path d="M1 9 L9 9 L17 4 L25 6 L33 1" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Pending Visitors */}
                  <div className="mini-stat-card">
                    <div className="mini-stat-icon-square green">
                      <Users size={13} />
                    </div>
                    <span className="mini-card-title">Pending Visitors</span>
                    <strong className="mini-card-number">8</strong>
                    <div className="mini-card-trend-row green">
                      <span className="trend-arrow">↑ 0%</span>
                      <svg width="34" height="12" viewBox="0 0 34 12" className="mini-sparkline">
                        <path d="M1 7 L9 7 L17 9 L25 4 L33 6" fill="none" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 3: SLA Risks */}
                  <div className="mini-stat-card">
                    <div className="mini-stat-icon-square amber">
                      <AlertTriangle size={13} />
                    </div>
                    <span className="mini-card-title">SLA Risks</span>
                    <strong className="mini-card-number">3</strong>
                    <div className="mini-card-trend-row amber">
                      <span className="trend-arrow">↑ 50%</span>
                      <svg width="34" height="12" viewBox="0 0 34 12" className="mini-sparkline">
                        <path d="M1 10 L9 8 L17 9 L25 4 L33 1" fill="none" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 4: Pending Bills */}
                  <div className="mini-stat-card">
                    <div className="mini-stat-icon-square purple">
                      <IndianRupee size={13} />
                    </div>
                    <span className="mini-card-title">Pending Bills</span>
                    <strong className="mini-card-number">₹42,500</strong>
                    <div className="mini-card-trend-row purple">
                      <span className="trend-arrow">↑ 8%</span>
                      <svg width="34" height="12" viewBox="0 0 34 12" className="mini-sparkline">
                        <path d="M1 8 L9 10 L17 4 L25 7 L33 2" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="mini-activity-section">
                  <div className="mini-activity-header">
                    <h5>Recent activity</h5>
                    <button type="button" className="view-all-link">View all</button>
                  </div>

                  <div className="mini-activity-list">
                    {/* Item 1: Water leakage */}
                    <div className="mini-activity-item">
                      <div className="item-round-icon blue">
                        <Droplets size={12} />
                      </div>
                      <div className="item-detail-column">
                        <strong>Water leakage escalated</strong>
                        <small>#TK-1042 · B Block · Reported by A-301</small>
                      </div>
                      <span className="item-timestamp">10 min ago</span>
                      <span className="mini-status-pill red">High</span>
                    </div>

                    {/* Item 2: Visitor approved */}
                    <div className="mini-activity-item">
                      <div className="item-round-icon green">
                        <User size={12} />
                      </div>
                      <div className="item-detail-column">
                        <strong>Visitor approved for A-204</strong>
                        <small>Ravi Sharma · Expected at 11:30 AM</small>
                      </div>
                      <span className="item-timestamp">28 min ago</span>
                      <span className="mini-status-pill green">Approved</span>
                    </div>

                    {/* Item 3: Lift issue */}
                    <div className="mini-activity-item">
                      <div className="item-round-icon orange">
                        <Wrench size={12} />
                      </div>
                      <div className="item-detail-column">
                        <strong>Technician assigned to lift issue</strong>
                        <small>#TK-1038 · Tower A · Assigned to Manoj</small>
                      </div>
                      <span className="item-timestamp">1 hour ago</span>
                      <span className="mini-status-pill blue">In Progress</span>
                    </div>

                    {/* Item 4: Monthly bills */}
                    <div className="mini-activity-item">
                      <div className="item-round-icon purple">
                        <FileText size={12} />
                      </div>
                      <div className="item-detail-column">
                        <strong>Monthly bills generated</strong>
                        <small>April 2024 · 320 units</small>
                      </div>
                      <span className="item-timestamp">3 hours ago</span>
                      <span className="mini-status-pill green">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
