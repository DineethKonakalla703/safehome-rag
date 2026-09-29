import { getCurrentUser } from '../utils/auth';
import { DashboardView } from './DashboardShared';
export default function MainAdminDashboard() { return <DashboardView user={getCurrentUser()} type="main" />; }

