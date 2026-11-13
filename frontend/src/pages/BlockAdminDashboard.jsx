import { getCurrentUser } from '../utils/auth';
import { DashboardView } from './DashboardShared';
export default function BlockAdminDashboard() { return <DashboardView user={getCurrentUser()} type="block" />; }

