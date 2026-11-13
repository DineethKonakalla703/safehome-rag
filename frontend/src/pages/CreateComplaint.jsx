import { AlertTriangle, BookOpen, Camera, CheckCircle2, Lightbulb, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyzeTicketImage, createTicket, uploadTicketImage } from '../api/ticketApi';
import { getCurrentUser } from '../utils/auth';
import { PageHeader } from './DashboardShared';

export default function CreateComplaint() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const sample = 'Water is leaking near the electrical switchboard in A-102.';

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return setError('Add a title and description before submitting.');
    setSubmitting(true); setError('');
    try {
      const ticket = await createTicket({ ...form, title: form.title.trim(), description: form.description.trim(), residentId: user.id, apartmentId: user.apartmentId, blockId: user.blockId, communityId: user.communityId });
      if (image) { const attachment = await uploadTicketImage(ticket.id, image); await analyzeTicketImage(ticket.id, attachment.attachmentId); }
      navigate(`/tickets/${ticket.id}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  };

  return <><PageHeader eyebrow="Resident service desk" title="Create a complaint" subtitle="Describe the issue clearly so the service team can classify and prioritize it." meta={<span><MapPin size={14} /> {user.apartmentId} · {user.blockId}</span>} /><div className="form-layout"><form className="content-card complaint-form" onSubmit={submit}><div className="form-alert"><Sparkles size={20} /><div><strong>Text and image safety analysis enabled</strong><p>Claude and safe fallback rules flag urgent maintenance risks for human review.</p></div></div><div className="sample-hint"><Lightbulb size={18} /><div><span>Try the review scenario</span><p>“{sample}”</p></div><button type="button" onClick={() => setForm({ ...form, title: 'Water leakage near electrical switchboard', description: sample })}>Use sample</button></div><label>Complaint title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water leakage near switchboard" /></label><label>Description<textarea rows="7" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explain where the issue is and what you observed." /></label><label>Category <span>(optional)</span><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Leave blank for automatic classification" /></label><label className="upload-placeholder"><Camera size={25} /><div><strong>Photo evidence</strong><p>{image ? `${image.name} · ${Math.round(image.size/1024)} KB` : 'JPG, PNG or WEBP up to 5 MB.'}</p></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>setImage(event.target.files?.[0]||null)}/></label>{error && <p className="form-error"><AlertTriangle size={16} />{error}</p>}<div className="form-actions"><span><CheckCircle2 size={16} /> Submitted securely to the backend</span><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Submitting and analyzing…' : 'Submit complaint'}</button></div></form><aside className="tip-card"><span className="section-kicker">Submission checklist</span><h2>Help the team respond faster</h2><ul><li>State the exact location.</li><li>Mention water or electrical risk.</li><li>Attach a clear image when safe.</li></ul><div className="tip-divider" /><Link to="/knowledge-support" className="tip-knowledge-link"><BookOpen size={15} /> Search Safety SOPs & FAQs</Link><p><AlertTriangle size={16} /> For immediate danger, contact local emergency services first.</p></aside></div></>;
}
