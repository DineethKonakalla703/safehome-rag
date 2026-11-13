import { FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import CopilotPanel from '../ai/CopilotPanel';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

export default function CopilotPage() {
  const user = getCurrentUser();
  return (
    <div className="copilot-page">
      <PageHeader eyebrow="AI automation" title="SafeHome Copilot" subtitle="Chat or talk to operate the platform: find records, create and update them, run workflows and jump to any screen. Every change runs with your permissions, asks for approval and is audit-logged." action={user?.role === 'MAIN_ADMIN' ? <Link className="secondary-button" to="/ai-chatbot/classic"><FileSpreadsheet size={15} />Bulk Excel import</Link> : null} />
      <CopilotPanel variant="page" />
    </div>
  );
}
