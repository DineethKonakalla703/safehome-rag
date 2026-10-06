import { Bell, Check, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markNotificationRead } from '../api/notificationApi';
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

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.notificationId === id ? { ...item, read: true } : item))
      );
    } catch {}
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
                <strong>Notifications ({unreadCount} unread)</strong>
                <button
                  className="icon-button"
                  style={{ width: 24, height: 24 }}
                  onClick={() => setShowDropdown(false)}
                >
                  <X size={14} />
                </button>
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
    </header>
  );
}
