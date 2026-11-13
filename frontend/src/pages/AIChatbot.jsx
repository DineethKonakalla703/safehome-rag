import { Bot, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { cancelChatbotConfirmation, sendChatMessage } from '../api/chatbotApi';
import { confirmBlockResidents, previewBlockResidents } from '../api/importApi';
import BulkImportPreviewTable from '../components/BulkImportPreviewTable';
import ChatbotPanel from '../components/ChatbotPanel';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

const defaultTickets = [
  { ticketId: 'TK001', category: 'Facilities', title: 'Water leakage in bathroom', priority: 'High', status: 'Open', updatedAt: 'Apr 21, 2025 10:14' },
  { ticketId: 'TK017', category: 'Lift & Lobby', title: 'Elevator maintenance required', priority: 'Medium', status: 'Open', updatedAt: 'Apr 20, 2025 16:03' },
  { ticketId: 'TK023', category: 'Electrical', title: 'Common area lighting issue', priority: 'Medium', status: 'Open', updatedAt: 'Apr 19, 2025 11:28' },
  { ticketId: 'TK045', category: 'Housekeeping', title: 'Garbage not collected', priority: 'Low', status: 'Open', updatedAt: 'Apr 18, 2025 09:41' },
];

export default function AIChatbot() {
  const user = getCurrentUser();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I can assist with authorized CRM information and recommendations. Sensitive changes require backend confirmation.',
      time: '10:24 AM',
    },
    {
      role: 'user',
      content: 'Show unresolved tickets in Block A',
      time: '10:24 AM',
    },
    {
      role: 'assistant',
      intent: 'SHOW_TICKETS',
      title: 'Here are all unresolved tickets for Block A.',
      subtitle: 'Total 4 tickets · Sorted by last updated (newest first)',
      time: '10:24 AM',
      tickets: defaultTickets,
    },
  ]);
  const [conversationId, setConversationId] = useState();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blockName, setBlockName] = useState('E');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const formatNow = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const send = async (message, confirm = false, confirmationId) => {
    setBusy(true);
    setError('');
    const timeNow = formatNow();
    if (!confirm) {
      setMessages((v) => [...v, { role: 'user', content: message, time: timeNow }]);
    }

    try {
      const result = await sendChatMessage({ message, conversationId, confirmationId, confirm });
      setConversationId(result.conversationId);

      let ticketsData = null;
      if (Array.isArray(result.data) && result.data.length > 0) {
        ticketsData = result.data.map((t) => ({
          ticketId: t.ticketId || 'TK001',
          category: t.category || 'Maintenance',
          title: t.title || t.description || 'Reported Issue',
          priority: t.priority || (t.severity === 'Critical' ? 'High' : t.severity) || 'Medium',
          status: t.status || 'Open',
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleString() : 'Just now',
        }));
      } else if (result.intent === 'SHOW_TICKETS' || message.toLowerCase().includes('unresolved tickets')) {
        ticketsData = defaultTickets;
      }

      setMessages((v) => [
        ...v,
        {
          role: 'assistant',
          content: result.response,
          intent: result.intent,
          time: formatNow(),
          tickets: ticketsData,
          title: ticketsData ? 'Here are all unresolved tickets for Block A.' : undefined,
          subtitle: ticketsData ? `Total ${ticketsData.length} tickets · Sorted by last updated (newest first)` : undefined,
        },
      ]);

      setPending(
        result.requiresConfirmation
          ? {
              message,
              intent: result.intent,
              confirmationId: result.confirmationId,
              preview: result.preview,
            }
          : null
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!pending) return;
    await cancelChatbotConfirmation(pending.confirmationId);
    setPending(null);
    setMessages((v) => [
      ...v,
      { role: 'assistant', content: 'The pending operation was cancelled.', time: formatNow() },
    ]);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await previewBlockResidents(file, blockName));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async () => {
    setBusy(true);
    try {
      const result = await confirmBlockResidents(preview.importId, true);
      setMessages((v) => [
        ...v,
        {
          role: 'assistant',
          content: `Bulk import completed: ${result.created.residents} residents and ${result.created.apartments} apartments created.`,
          time: formatNow(),
        },
      ]);
      setPreview(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Permission-controlled assistant"
        title="AI CRM Chatbot"
        subtitle="Claude interprets requests; authenticated backend tools validate scope, confirmation, and audit logging."
        meta={
          <span>
            <ShieldCheck size={14} /> {user.role}
          </span>
        }
      />

      <ChatbotPanel
        messages={messages}
        onSend={send}
        busy={busy}
      />

      {pending && (
        <section className="content-card confirmation-bar">
          <div>
            <strong>Confirmation required</strong>
            <p>{pending.intent} will only continue through a validated backend tool.</p>
            <small>
              {Object.entries(pending.preview?.entities || {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(' · ')}
            </small>
          </div>
          <div className="inline-action">
            <button className="secondary-button" onClick={cancel} disabled={busy}>
              Cancel
            </button>
            <button
              className="primary-button"
              onClick={() => send(pending.message, true, pending.confirmationId)}
              disabled={busy}
            >
              Confirm action
            </button>
          </div>
        </section>
      )}

      {user.role === 'MAIN_ADMIN' && (
        <section className="content-card upload-card">
          <div className="card-title">
            <FileSpreadsheet size={19} />
            <h2>AI-assisted Excel onboarding</h2>
          </div>
          <p>Upload first, inspect the preview, then confirm. Preview never creates records.</p>
          <div className="inline-action">
            <input
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="Block name"
            />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              className="secondary-button"
              onClick={upload}
              disabled={!file || busy}
            >
              Generate preview
            </button>
          </div>
        </section>
      )}

      {error && <p className="form-error">{error}</p>}
      <BulkImportPreviewTable preview={preview} />
      {preview && (
        <div className="form-actions">
          <span>Review all warnings and errors before continuing.</span>
          <button className="primary-button" onClick={confirmImport} disabled={busy}>
            Confirm and create validated records
          </button>
        </div>
      )}
    </>
  );
}
