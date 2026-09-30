import { AlertTriangle, Camera, CheckCircle2, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/ticketApi';
import { getCurrentUser } from '../utils/auth';
import { PageHeader } from './DashboardShared';

export default function CreateComplaint() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sample = 'Water is leaking near the electrical switchboard in A-102.';

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return setError('Add a title and description before submitting.');
    setSubmitting(true); setError('');
    try {
      const ticket = await createTicket({ ...form, title: form.title.trim(), description: form.description.trim(), residentId: user.id, apartmentId: user.apartmentId, blockId: user.blockId, communityId: user.communityId });
      navigate(`/tickets/${ticket.id}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  };

  return <><PageHeader eyebrow="Resident service desk" title="Create a complaint" subtitle="Describe the issue clearly so the service team can classify and prioritize it." meta={<span><MapPin size={14} /> {user.apartmentId} · {user.blockId}</span>} /><div className="form-layout"><form className="content-card complaint-form" onSubmit={submit}><div className="form-alert"><Sparkles size={20} /><div><strong>Safety classification enabled</strong><p>The backend applies transparent rules to flag urgent water, electrical, lift, and lighting risks for human review.</p></div></div><div className="sample-hint"><Lightbulb size={18} /><div><span>Try the review scenario</span><p>“{sample}”</p></div><button type="button" onClick={() => setForm({ ...form, title: 'Water leakage near electrical switchboard', description: sample })}>Use sample</button></div><label>Complaint title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water leakage near switchboard" /></label><label>Description<textarea rows="7" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explain where the issue is and what you observed." /></label><label>Category <span>(optional)</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Leave blank for automatic classification" /></label><div className="upload-placeholder"><Camera size={25} /><div><strong>Photo evidence</strong><p>Metadata placeholder — file storage is planned for a later phase.</p></div><button type="button" className="secondary-button" disabled>Choose photo</button></div>{error && <p className="form-error"><AlertTriangle size={16} />{error}</p>}<div className="form-actions"><span><CheckCircle2 size={16} /> Submitted securely to the backend</span><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit complaint'}</button></div></form><aside className="tip-card"><span className="section-kicker">Submission checklist</span><h2>Help the team respond faster</h2><ul><li>State the exact location.</li><li>Mention water or electrical risk.</li><li>Describe whether access is blocked.</li></ul><div className="tip-divider" /><p><AlertTriangle size={16} /> For immediate danger, contact local emergency services first.</p></aside></div></>;
}
