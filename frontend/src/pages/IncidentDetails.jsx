import { AlertTriangle, ArrowLeft, Bell, Bot, CheckCircle2, MessageSquare, Network, Plus, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addIncidentComment, assignIncident, getIncident, getIncidentAudit, mergeTicketToIncident, notifyAffectedResidents, removeTicketFromIncident, updateIncidentStatus } from '../api/incidentApi';
import DataState from '../components/DataState';
import StatusBadge from '../components/StatusBadge';
import { PageHeader } from './DashboardShared';

export default function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Form states
  const [commentText, setCommentText] = useState('');
  const [mergeTicketId, setMergeTicketId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignType, setAssignType] = useState('TECHNICIAN');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, auditData] = await Promise.all([
        getIncident(id),
        getIncidentAudit(id).catch(() => []),
      ]);
      setIncident(data);
      setAudits(auditData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setBusy(true);
    setStatusMsg('');
    try {
      const updated = await updateIncidentStatus(id, newStatus);
      setIncident(updated);
      setStatusMsg(`Status updated to ${newStatus}`);
      const auditData = await getIncidentAudit(id).catch(() => []);
      setAudits(auditData);
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const updated = await addIncidentComment(id, commentText.trim());
      setIncident(updated);
      setCommentText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignName.trim()) return;
    setBusy(true);
    try {
      const updated = await assignIncident(id, {
        assignedTo: assignName.trim(),
        assignedToType: assignType,
      });
      setIncident(updated);
      setAssignName('');
      setStatusMsg(`Assigned to ${assignName}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMergeTicket = async (e) => {
    e.preventDefault();
    if (!mergeTicketId.trim()) return;
    setBusy(true);
    try {
      const updated = await mergeTicketToIncident(id, mergeTicketId.trim().toUpperCase());
      setIncident(updated);
      setMergeTicketId('');
      setStatusMsg(`Ticket merged`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveTicket = async (tId) => {
    if (!confirm(`Remove ticket ${tId} from this collective incident?`)) return;
    setBusy(true);
    try {
      const updated = await removeTicketFromIncident(id, tId);
      setIncident(updated);
      setStatusMsg(`Ticket ${tId} removed from incident`);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleNotifyResidents = async () => {
    setBusy(true);
    try {
      const res = await notifyAffectedResidents(id, notifyMsg.trim() || undefined);
      alert(`Successfully notified ${res.notified} affected resident(s).`);
      setNotifyMsg('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || error) {
    return <DataState loading={loading} error={error} onRetry={load} />;
  }

  if (!incident) return null;

  return (
    <>
      <div className="back-nav">
        <Link to="/collective-incidents" className="back-link">
          <ArrowLeft size={16} /> Back to Incidents
        </Link>
      </div>

      <PageHeader
        eyebrow="Collective Incident Lifecycle"
        title={incident.title}
        subtitle={`Incident ${incident.incidentId} in Block ${incident.blockId} · Category: ${incident.category}`}
        meta={
          <div className="header-meta-group">
            <StatusBadge>{incident.status}</StatusBadge>
            <StatusBadge>{incident.severity}</StatusBadge>
            <span>Confidence: {Math.round((incident.confidence || 0.75) * 100)}%</span>
          </div>
        }
      />

      {statusMsg && <div className="notice-banner">{statusMsg}</div>}

      <div className="incident-grid">
        {/* Left Column: Summary, Status Controls, Actions */}
        <div className="incident-main">
          {/* Incident AI & Cause Summary */}
          <section className="content-card">
            <div className="card-title">
              <Bot size={20} />
              <h2>Detection & Reason</h2>
            </div>
            <p className="incident-reason">{incident.aiReason}</p>
            <dl className="info-grid">
              <div>
                <dt>Affected Block</dt>
                <dd>{incident.blockId}</dd>
              </div>
              <div>
                <dt>Detected At</dt>
                <dd>{new Date(incident.detectedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Assigned To</dt>
                <dd>{incident.assignedTo ? `${incident.assignedToType}: ${incident.assignedTo}` : 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Resolved At</dt>
                <dd>{incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'Not resolved'}</dd>
              </div>
            </dl>
          </section>

          {/* Lifecycle Status Management */}
          <section className="content-card">
            <div className="card-title">
              <Network size={20} />
              <h2>Lifecycle Status Controls</h2>
            </div>
            <p className="muted">Transition incident through operational states:</p>
            <div className="lifecycle-actions">
              {['DETECTED', 'MONITORING', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'FALSE_POSITIVE'].map((st) => (
                <button
                  key={st}
                  className={incident.status === st ? 'primary-button' : 'secondary-button'}
                  disabled={busy || incident.status === st}
                  onClick={() => handleStatusChange(st)}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Related Tickets Management */}
          <section className="content-card">
            <div className="card-title">
              <AlertTriangle size={20} />
              <h2>Linked Complaint Tickets ({incident.relatedTickets?.length || 0})</h2>
            </div>
            <div className="linked-tickets-list">
              {incident.relatedTickets?.length ? (
                incident.relatedTickets.map((tId) => (
                  <div key={tId} className="linked-ticket-item">
                    <Link to={`/tickets/${tId}`} className="ticket-ref">
                      <strong>{tId}</strong>
                    </Link>
                    <button
                      className="icon-button danger-icon"
                      title="Remove from incident"
                      disabled={busy}
                      onClick={() => handleRemoveTicket(tId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">No tickets currently linked.</p>
              )}
            </div>

            <form onSubmit={handleMergeTicket} className="inline-action mt-3">
              <input
                value={mergeTicketId}
                onChange={(e) => setMergeTicketId(e.target.value)}
                placeholder="Merge ticket ID (e.g. TK005)"
              />
              <button className="secondary-button" type="submit" disabled={!mergeTicketId.trim() || busy}>
                <Plus size={16} /> Merge ticket
              </button>
            </form>
          </section>

          {/* Comments & Staff Notes */}
          <section className="content-card">
            <div className="card-title">
              <MessageSquare size={20} />
              <h2>Incident Notes & Comments</h2>
            </div>
            <div className="comment-list">
              {incident.comments?.length ? (
                incident.comments.map((c, i) => (
                  <div key={i} className="comment-item">
                    <strong>{c.createdBy || 'Staff'}</strong>
                    <p>{c.comment}</p>
                    <small>{new Date(c.createdAt).toLocaleString()}</small>
                  </div>
                ))
              ) : (
                <p className="muted">No comments recorded yet.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="inline-action mt-3">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add operational update or note..."
              />
              <button className="secondary-button" type="submit" disabled={!commentText.trim() || busy}>
                Post note
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Staff Assignment, Notify Residents, Timeline, Audit */}
        <div className="incident-sidebar">
          {/* Assignment Box */}
          <section className="content-card">
            <div className="card-title">
              <UserCheck size={18} />
              <h3>Assign Responsible Staff</h3>
            </div>
            <form onSubmit={handleAssign} className="assign-form">
              <select value={assignType} onChange={(e) => setAssignType(e.target.value)}>
                <option value="TECHNICIAN">Technician</option>
                <option value="VENDOR">External Vendor</option>
                <option value="USER">Facility Staff / Admin</option>
              </select>
              <input
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
                placeholder="Staff ID or Vendor Name"
              />
              <button className="primary-button full-width" type="submit" disabled={!assignName.trim() || busy}>
                Assign responsibility
              </button>
            </form>
          </section>

          {/* Notify Affected Residents */}
          <section className="content-card">
            <div className="card-title">
              <Bell size={18} />
              <h3>Notify Affected Residents</h3>
            </div>
            <p className="muted small-text">
              Sends an in-app incident notification to all residents linked to tickets in this incident.
            </p>
            <textarea
              rows={3}
              value={notifyMsg}
              onChange={(e) => setNotifyMsg(e.target.value)}
              placeholder="Custom notification message (optional)..."
            />
            <button
              className="secondary-button full-width"
              disabled={busy}
              onClick={handleNotifyResidents}
            >
              Send notification
            </button>
          </section>

          {/* Resolution Timeline */}
          <section className="content-card">
            <div className="card-title">
              <CheckCircle2 size={18} />
              <h3>Activity Timeline</h3>
            </div>
            <ol className="timeline">
              {incident.timeline?.map((item, index) => (
                <li key={index}>
                  <span />
                  <div>
                    <strong>{item.action || item.details}</strong>
                    <p>{item.details}</p>
                    <small>
                      {item.performedBy} · {item.performedAt ? new Date(item.performedAt).toLocaleString() : ''}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Audit History */}
          {audits.length > 0 && (
            <section className="content-card">
              <div className="card-title">
                <Bot size={18} />
                <h3>Audit History</h3>
              </div>
              <div className="audit-feed">
                {audits.map((a) => (
                  <div key={a._id || a.createdAt} className="audit-entry">
                    <span>{a.action}</span>
                    <small>{new Date(a.createdAt).toLocaleString()} by {a.actorId}</small>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
