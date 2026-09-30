import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();
  useEffect(() => { const unauthorized = () => { logout(); navigate('/login'); }; window.addEventListener('safehome:unauthorized', unauthorized); return () => window.removeEventListener('safehome:unauthorized', unauthorized); }, [navigate]);
  return (
    <div className="app-shell">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <div className="main-shell"><Navbar user={user} onMenu={() => setOpen(true)} /><main className="page"><Outlet /></main></div>
    </div>
  );
}
