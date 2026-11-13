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
import { getDemoUsers, login, requestPasswordReset, resetPassword } from '../api/userApi';
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

  // Self-Service Password Reset
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ loading: false, error: '', success: '', demoToken: '' });

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotStatus({ loading: true, error: '', success: '', demoToken: '' });
    try {
      const res = await requestPasswordReset(forgotEmail);
      setForgotStatus({
        loading: false,
        error: '',
        success: res.message || 'Reset instructions have been generated.',
        demoToken: res.demoResetToken || '',
      });
      if (res.demoResetToken) {
        setForgotToken(res.demoResetToken);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotStatus({ loading: false, error: err.message || 'Failed to request reset.', success: '', demoToken: '' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotStatus({ ...forgotStatus, loading: true, error: '', success: '' });
    if (forgotNewPassword.length < 8) {
      setForgotStatus({ ...forgotStatus, loading: false, error: 'Password must be at least 8 characters.' });
      return;
    }
    if (forgotNewPassword !== forgotConfirm) {
      setForgotStatus({ ...forgotStatus, loading: false, error: 'Passwords do not match.' });
      return;
    }
    try {
      await resetPassword(forgotToken, forgotNewPassword);
      setForgotStatus({
        loading: false,
        error: '',
        success: 'Password reset successfully! You can now sign in with your new password.',
        demoToken: '',
      });
      setForm({ email: forgotEmail, password: forgotNewPassword });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
      }, 2500);
    } catch (err) {
      setForgotStatus({ ...forgotStatus, loading: false, error: err.message || 'Failed to reset password.' });
    }
  };

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
            <img className="brand-logo" src="/brand/safehome-mark.svg" alt="" width="46" height="46" />
            <div className="brand-title-group">
              <span className="brand-main-title">SafeHome</span>
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
                onClick={() => {
                  setForgotEmail(form.email || '');
                  setForgotStatus({ loading: false, error: '', success: '', demoToken: '' });
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
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
      <aside className="login-showcase-section" aria-label="About SafeHome">
        <div className="showcase-content-container">
          <img className="showcase-mark" src="/brand/safehome-mark-reversed.svg" alt="" width="64" height="64" />
          <div className="showcase-header-copy">
            <div className="showcase-kicker-line"><span className="dash-bar" /><span>Residential operations</span></div>
            <h2>Quietly running <em>everything</em> your community depends on.</h2>
            <p>Complaints and work orders, gate and visitors, dues and accounts, amenities and events, all in one place, each person seeing exactly what their role allows.</p>
          </div>
          <ul className="showcase-pillars">
            <li><strong>Gate &amp; safety</strong><span>Visitor passes, staff entry, parcels and one-tap SOS.</span></li>
            <li><strong>Money, transparently</strong><span>Bills, collections and a society ledger every resident can trust.</span></li>
            <li><strong>An assistant that acts</strong><span>Ask in plain words, review the change, approve. Every step audited.</span></li>
          </ul>
          <p className="showcase-foot">Green Valley Residency</p>
        </div>
      </aside>

      {/* Self-Service Password Recovery Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => !forgotStatus.loading && setShowForgotModal(false)}>
          <div className="forgot-password-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} className="text-primary" />
                <strong>Self-Service Password Reset</strong>
              </div>
              <button
                type="button"
                className="icon-action"
                disabled={forgotStatus.loading}
                onClick={() => setShowForgotModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestReset} className="forgot-password-form">
                <p className="forgot-modal-instructions">
                  Enter your registered SafeHome account email. We will generate a secure 30-minute password reset token.
                </p>

                <div className="form-field-block">
                  <label>Account Email</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="field-lead-icon" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. resident1@safehome.com"
                      required
                    />
                  </div>
                </div>

                {forgotStatus.error && (
                  <div className="login-error-badge">
                    <AlertTriangle size={15} />
                    <span>{forgotStatus.error}</span>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="primary-login-button"
                    disabled={forgotStatus.loading}
                  >
                    <span>{forgotStatus.loading ? 'Generating Token...' : 'Send Reset Instructions'}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={forgotStatus.loading}
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="forgot-password-form">
                <p className="forgot-modal-instructions">
                  Enter the reset token sent to your email/SMS and select a new secure password.
                </p>

                {forgotStatus.demoToken && (
                  <div className="demo-helper-caption" style={{ marginBottom: '12px', background: '#f1f3f8', padding: '8px 12px', borderRadius: '6px' }}>
                    <Info size={14} className="text-primary" />
                    <span>
                      Demo Mode Token: <code>{forgotStatus.demoToken}</code> (auto-filled below)
                    </span>
                  </div>
                )}

                <div className="form-field-block">
                  <label>Reset Token</label>
                  <input
                    type="text"
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    placeholder="Paste 48-character reset token"
                    required
                  />
                </div>

                <div className="form-field-block">
                  <label>New Password (min 8 characters)</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-lead-icon" />
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                </div>

                <div className="form-field-block">
                  <label>Confirm New Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="field-lead-icon" />
                    <input
                      type="password"
                      value={forgotConfirm}
                      onChange={(e) => setForgotConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                {forgotStatus.error && (
                  <div className="login-error-badge">
                    <AlertTriangle size={15} />
                    <span>{forgotStatus.error}</span>
                  </div>
                )}

                {forgotStatus.success && (
                  <div className="feedback-banner success mb-2">
                    <CheckCircle2 size={16} />
                    <span>{forgotStatus.success}</span>
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="primary-login-button"
                    disabled={forgotStatus.loading}
                  >
                    <span>{forgotStatus.loading ? 'Updating Password...' : 'Save & Sign In'}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={forgotStatus.loading}
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
