import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { CopilotProvider, useCopilot } from '../ai/CopilotContext';
import CopilotPanel from '../ai/CopilotPanel';
import '../ai/copilot.css';
import { SosBanner } from '../pages/CommunityLifePages';

export default function Layout() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  const navigate = useNavigate();
  useEffect(() => { const unauthorized = () => { logout(); navigate('/login'); }; window.addEventListener('safehome:unauthorized', unauthorized); return () => window.removeEventListener('safehome:unauthorized', unauthorized); }, [navigate]);
  return (
    <CopilotProvider>
    <div className="app-shell">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <div className="main-shell"><Navbar user={user} onMenu={() => setOpen(true)} /><PageArea /></div>
      <CopilotPanel />
    </div>
    </CopilotProvider>
  );
}

// Remounts the current page after the copilot changes data so lists refresh.
function PageArea() {
  const copilot = useCopilot();
  const navigate = useNavigate();
  return <main className="page" key={copilot?.refreshKey || 0}><SosBanner onOpen={() => navigate('/sos')} /><Outlet /></main>;
}
