import { AlertTriangle, Camera, CheckCircle2, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeComplaint } from '../utils/aiRules';
import { getCurrentUser } from '../utils/auth';
import { getAllTickets, nextId, updateTicket } from '../utils/storage';
import { PageHeader } from './DashboardShared';

export default function CreateComplaint() {
  const user = getCurrentUser(); const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [error, setError] = useState('');
  const sample = 'Water is leaking near the electrical switchboard in A-102.';
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { setError('Add a title and description before submitting.'); return; }
    const ai = analyzeComplaint(form.description);
    const ticket = { id: nextId('TK', getAllTickets()), title: form.title.trim(), description: form.description.trim(), residentId: user.id, apartmentId: user.apartmentId, blockId: user.blockId, ...ai, category: form.category.trim() || ai.category, status: 'New', assignedTechnicianId: null, createdAt: new Date().toISOString().slice(0, 10), timeline: [{ text: `Ticket created by ${user.name}`, at: new Date().toLocaleString() }, { text: ai.safetyRisk ? 'AI simulation detected high safety risk' : 'AI simulation completed', at: new Date().toLocaleString() }] };
    updateTicket(ticket); navigate(`/tickets/${ticket.id}`);
  };
  return <><PageHeader eyebrow="Resident service desk" title="Create a complaint" subtitle="Describe the issue clearly so the simulation can classify and prioritize it." meta={<span><MapPin size={14} /> A-102 · Block A</span>} /><div className="form-layout"><form className="content-card complaint-form" onSubmit={submit}><div className="form-alert"><Sparkles size={20} /><div><strong>Rule-based safety check enabled</strong><p>AI output is simulated using rules in Priority 1. Descriptions are checked for water, electrical, lift, and lighting keywords.</p></div></div><div className="sample-hint"><Lightbulb size={18} /><div><span>Try the review scenario</span><p>“{sample}”</p></div><button type="button" onClick={() => setForm({ ...form, title: 'Water leakage near electrical switchboard', description: sample })}>Use sample</button></div><label>Complaint title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water leakage near switchboard" /></label><label>Description<textarea rows="7" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explain where the issue is and what you observed." /></label><label>Category <span>(optional)</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Leave blank for automatic classification" /></label><div className="upload-placeholder"><Camera size={25} /><div><strong>Photo evidence</strong><p>Upload placeholder only — files are not stored in this prototype.</p></div><button type="button" className="secondary-button" disabled>Choose photo</button></div>{error && <p className="form-error"><AlertTriangle size={16} />{error}</p>}<div className="form-actions"><span><CheckCircle2 size={16} /> Saved securely in this browser</span><button className="primary-button" type="submit">Submit complaint</button></div></form><aside className="tip-card"><span className="section-kicker">Submission checklist</span><h2>Help the team respond faster</h2><ul><li>State the exact location.</li><li>Mention water or electrical risk.</li><li>Describe whether access is blocked.</li></ul><div className="tip-divider" /><p><AlertTriangle size={16} /> For immediate danger, contact local emergency services first.</p></aside></div></>;
}

