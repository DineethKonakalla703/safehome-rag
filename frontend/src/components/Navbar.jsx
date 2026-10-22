import {
  Bell,
  Check,
  CheckCheck,
  KeyRound,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi';
import { changePassword } from '../api/userApi';
import { logout } from '../utils/auth';

const roleLabels = {
  MAIN_ADMIN: 'Main Admin',
  BLOCK_SUB_ADMIN: 'Block Sub Admin',
  RESIDENT: 'Resident',
  TECHNICIAN: 'Technician',
  FACILITY_MANAGER: 'Facility Manager',
  SECURITY: 'Security',
};

export default function Navbar({ user, onMenu }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifs = () => {
    listNotifications()
      .then(setNotifications)
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 60000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: '', success: '' });
  const [pushEnabled, setPushEnabled] = useState(false);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.notificationId === id ? { ...item, read: true } : item))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.warn('Failed to mark all as read:', err.message);
    }
  };

  const togglePushAlerts = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    if (Notification.permission === 'granted') {
      setPushEnabled(!pushEnabled);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushEnabled(true);
      new Notification('SafeHome-RAG Alerts Enabled', {
        body: 'You will receive real-time notifications for complaints, visitors, and work orders.',
        icon: '/manifest-icon-192.png',
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdStatus({ loading: true, error: '', success: '' });
    if (pwdForm.newPassword.length < 8) {
      setPwdStatus({ loading: false, error: 'New password must be at least 8 characters.', success: '' });
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdStatus({ loading: false, error: 'New passwords do not match.', success: '' });
      return;
    }
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      setPwdStatus({ loading: false, error: '', success: 'Password changed successfully!' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err) {
      setPwdStatus({ loading: false, error: err.message || 'Failed to update password.', success: '' });
    }
  };

  return (
    <header className="navbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="nav-title">
        <strong>Green Valley Residency</strong>
        <span>Operations command center</span>
      </div>
      <span className="prototype-pill">Phase 2 AI-Powered</span>
      <div className="user-area">
        <div style={{ position: 'relative' }}>
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <i></i>}
          </button>

          {showDropdown && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <strong>Notifications ({unreadCount} unread)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button
                      className="icon-button"
                      style={{ width: 24, height: 24 }}
                      title="Mark all as read"
                      onClick={handleMarkAllRead}
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    className={`icon-button ${pushEnabled ? 'text-primary' : ''}`}
                    style={{ width: 24, height: 24 }}
                    title={pushEnabled ? 'Push notifications active' : 'Enable browser push notifications'}
                    onClick={togglePushAlerts}
                  >
                    <Smartphone size={14} />
                  </button>
                  <button
                    className="icon-button"
                    style={{ width: 24, height: 24 }}
                    onClick={() => setShowDropdown(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="notification-dropdown-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.notificationId}
                      className={`notification-dropdown-item ${n.read ? 'read' : 'unread'}`}
                    >
                      <div className="notification-dropdown-content">
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <small>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                      {!n.read && (
                        <button
                          className="mark-read-btn"
                          title="Mark as read"
                          onClick={(e) => handleMarkRead(n.notificationId, e)}
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="notification-empty">No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="avatar">
          {user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
        </div>
        <div className="user-copy">
          <strong>{user.name}</strong>
          <span className="role-badge">{roleLabels[user.role]}</span>
        </div>
        <button
          className="icon-button change-pwd-button"
          title="Change Password"
          onClick={() => {
            setPwdStatus({ loading: false, error: '', success: '' });
            setShowPasswordModal(true);
          }}
        >
          <KeyRound size={16} />
        </button>
        <button
          className="logout-button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => !pwdStatus.loading && setShowPasswordModal(false)}>
          <div className="change-password-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} className="text-primary" />
                <strong>Change Account Password</strong>
              </div>
              <button
                type="button"
                className="icon-action"
                disabled={pwdStatus.loading}
                onClick={() => setShowPasswordModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="change-password-form">
              <div className="form-field-block">
                <label>Current Password</label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-field-block">
                <label>New Password (min 8 characters)</label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Enter new strong password"
                  required
                />
              </div>

              <div className="form-field-block">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {pwdStatus.error && (
                <div className="feedback-banner error mb-2">
                  <span>{pwdStatus.error}</span>
                </div>
              )}

              {pwdStatus.success && (
                <div className="feedback-banner success mb-2">
                  <span>{pwdStatus.success}</span>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={pwdStatus.loading}
                >
                  <Lock size={15} />
                  <span>{pwdStatus.loading ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={pwdStatus.loading}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
