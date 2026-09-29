import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  return (
    <div className="app-shell">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <div className="main-shell"><Navbar user={user} onMenu={() => setOpen(true)} /><main className="page"><Outlet /></main></div>
    </div>
  );
}

