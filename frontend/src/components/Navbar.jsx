import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
const roleLabels = { MAIN_ADMIN: 'Main Admin', BLOCK_SUB_ADMIN: 'Block Sub Admin', RESIDENT: 'Resident', TECHNICIAN: 'Technician', FACILITY_MANAGER: 'Facility Manager', SECURITY: 'Security' };

export default function Navbar({ user, onMenu }) {
  const navigate = useNavigate();
  return (
    <header className="navbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="nav-title"><strong>Green Valley Residency</strong><span>Operations command center</span></div>
      <span className="prototype-pill">Phase 1 Core</span>
      <div className="user-area">
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <div className="avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
        <div className="user-copy"><strong>{user.name}</strong><span className="role-badge">{roleLabels[user.role]}</span></div>
        <button className="logout-button" onClick={() => { logout(); navigate('/login'); }}><LogOut size={17} /><span>Logout</span></button>
      </div>
    </header>
  );
}
