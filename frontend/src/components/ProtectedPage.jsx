import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

export default function ProtectedPage({ children, roles }) {
  const user = getCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'RESIDENT' ? '/resident/dashboard' : user.role === 'BLOCK_SUB_ADMIN' ? '/block-admin/dashboard' : user.role === 'MAIN_ADMIN' ? '/main-admin/dashboard' : '/tickets'} replace />;
  return children;
}

