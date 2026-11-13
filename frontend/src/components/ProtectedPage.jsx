import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getToken } from '../utils/auth';

export default function ProtectedPage({ children, roles }) {
  const user = getCurrentUser();
  const location = useLocation();
  if (!user || !getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) { const home = { RESIDENT: '/resident/dashboard', BLOCK_SUB_ADMIN: '/block-admin/dashboard', MAIN_ADMIN: '/main-admin/dashboard', TECHNICIAN: '/technician/dashboard', SECURITY: '/security/dashboard', FACILITY_MANAGER: '/work-orders' }; return <Navigate to={home[user.role] || '/tickets'} replace />; }
  return children;
}
