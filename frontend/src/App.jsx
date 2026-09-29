import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedPage from './components/ProtectedPage';
import Billing from './pages/Billing';
import BlockAdminDashboard from './pages/BlockAdminDashboard';
import CreateComplaint from './pages/CreateComplaint';
import Login from './pages/Login';
import MainAdminDashboard from './pages/MainAdminDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import TicketDetails from './pages/TicketDetails';
import TicketList from './pages/TicketList';

const protect = (element, roles) => <ProtectedPage roles={roles}>{element}</ProtectedPage>;

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route element={protect(<Layout />)}>
      <Route path="/main-admin/dashboard" element={protect(<MainAdminDashboard />, ['MAIN_ADMIN'])} />
      <Route path="/block-admin/dashboard" element={protect(<BlockAdminDashboard />, ['BLOCK_SUB_ADMIN'])} />
      <Route path="/resident/dashboard" element={protect(<ResidentDashboard />, ['RESIDENT'])} />
      <Route path="/resident/create-complaint" element={protect(<CreateComplaint />, ['RESIDENT'])} />
      <Route path="/tickets" element={<TicketList />} />
      <Route path="/tickets/:id" element={<TicketDetails />} />
      <Route path="/billing" element={protect(<Billing />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'])} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

