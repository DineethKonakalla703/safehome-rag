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
import { AmenitiesPage, ApartmentsPage, AuditLogsPage, BlocksPage, BookingsPage, CommunitiesPage, DocumentsPage, InventoryPage, NoticesPage, ParkingPage, ReportsPage, ResidentsPage, SecurityDashboard, TechniciansPage, VehiclesPage, VisitorsPage, WorkOrdersPage } from './pages/ManagementPages';

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
      <Route path="/communities" element={protect(<CommunitiesPage />, ['MAIN_ADMIN'])} />
      <Route path="/blocks" element={protect(<BlocksPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'])} />
      <Route path="/apartments" element={protect(<ApartmentsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'])} />
      <Route path="/residents" element={protect(<ResidentsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'])} />
      <Route path="/work-orders" element={protect(<WorkOrdersPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'])} />
      <Route path="/technician/dashboard" element={protect(<WorkOrdersPage />, ['TECHNICIAN'])} />
      <Route path="/technicians" element={protect(<TechniciansPage />, ['MAIN_ADMIN'])} />
      <Route path="/visitors" element={protect(<VisitorsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'SECURITY'])} />
      <Route path="/security/dashboard" element={protect(<SecurityDashboard />, ['SECURITY'])} />
      <Route path="/vehicles" element={protect(<VehiclesPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'])} />
      <Route path="/parking" element={protect(<ParkingPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'])} />
      <Route path="/amenities" element={protect(<AmenitiesPage />, ['MAIN_ADMIN', 'RESIDENT', 'FACILITY_MANAGER'])} />
      <Route path="/bookings" element={protect(<BookingsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'FACILITY_MANAGER'])} />
      <Route path="/notices" element={protect(<NoticesPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'])} />
      <Route path="/documents" element={protect(<DocumentsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'])} />
      <Route path="/inventory" element={protect(<InventoryPage />, ['MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'])} />
      <Route path="/reports" element={protect(<ReportsPage />, ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'])} />
      <Route path="/audit-logs" element={protect(<AuditLogsPage />, ['MAIN_ADMIN'])} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
