import { AlertTriangle, CalendarCheck, CheckCircle2, Heart, MessageCircle, Package, PackageCheck, Pin, Plus, Send, Trash2, Truck, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ASSET_CATEGORIES, COURIERS, FREQUENCIES, POST_KINDS, forumApi, maintenanceApi, moveApi, parcelApi } from '../api/operationsPlusApi';
import DataState from '../components/DataState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';
import { Modal, useLoad } from './CommunityLifePages';
import '../styles/communityLife.css';
import '../styles/operationsPlus.css';

const me = () => getCurrentUser() || {};
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const time = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

function useAction(reload) {
  const [busy, setBusy] = useState(null); const [error, setError] = useState(null);
  const run = async (id, fn) => { setBusy(id); setError(null); try { const r = await fn(); await reload(); return r; } catch (e) { setError(e); return null; } finally { setBusy(null); } };
  return { busy, error, setError, run };
}
const Tabs = ({ value, onChange, options }) => <div className="segmented">{options.map(([v, l]) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;

// ======================= Move-in / move-out =======================
export function MoveRequestsPage() {
  const user = me();
  const resident = user.role === 'RESIDENT';
  const approver = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const canComplete = approver || user.role === 'SECURITY';
  const moves = useLoad(() => moveApi.list());
  const { busy, error, setError, run } = useAction(moves.reload);
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState(null);
  const list = useMemo(() => (moves.data || []).filter((m) => (tab === 'active' ? ['Pending', 'Approved'].includes(m.status) : true)), [moves.data, tab]);
  const submit = async (e) => { e.preventDefault(); const r = await run('form', () => moveApi.create(form)); if (r) setForm(null); };
  const approve = (m) => {
    const note = window.prompt(`Approve ${m.type} for ${m.apartmentId}? Optional note:`, ''); if (note === null) return;
    const override = m.type === 'Move-Out' && m.pendingDues > 0 ? window.confirm(`₹${m.pendingDues} in bills is unpaid. Approve anyway?`) : false;
    if (m.type === 'Move-Out' && m.pendingDues > 0 && !override) return;
    run(m.requestId, () => moveApi.approve(m.requestId, note, override));
  };
  return <>
    <PageHeader eyebrow="Residency" title="Move-in / Move-out" subtitle={resident ? 'Book your move. Admin approval reserves the service lift and informs the gate.' : approver ? 'Approve moves, check dues before move-out, and confirm completion at the gate.' : 'Approved moves expected at the gate. Mark each one completed when the movers leave.'}
      action={<><Tabs value={tab} onChange={setTab} options={[['active', 'Upcoming'], ['all', 'All']]} />{(resident || approver) && <button className="primary-button" onClick={() => { setError(null); setForm({ type: 'Move-In', scheduledDate: tomorrow(), timeSlot: '09:00-13:00', needsLift: true, residentId: '', vehicleNumber: '', moversCompany: '', notes: '' }); }}><Plus size={17} /> New request</button>}</>} />
    <DataState loading={moves.loading} error={moves.error} onRetry={moves.reload} />
    {error && !form && <p className="form-error">{error.message}</p>}
    {moves.data && list.length === 0 && <section className="content-card"><p className="empty-row">{tab === 'active' ? 'No upcoming moves.' : 'No move requests yet.'}</p></section>}
    <section className="ops-list">{list.map((m) => <article key={m.requestId} className={`content-card ops-card move-${m.type === 'Move-In' ? 'in' : 'out'}`}>
      <div className="ops-icon"><Truck size={20} /></div>
      <div className="ops-body">
        <header><h3>{m.type} · Apt {m.apartmentId}</h3><StatusBadge>{m.status}</StatusBadge><span className="muted">{m.requestId}</span></header>
        <p className="ops-meta"><span><CalendarCheck size={14} /> {day(m.scheduledDate)}, {m.timeSlot}</span><span>{m.residentName}</span>{m.blockId && <span>{m.blockId}</span>}{m.needsLift && <span>Service lift</span>}{m.vehicleNumber && <span>Vehicle {m.vehicleNumber}</span>}{m.moversCompany && <span>{m.moversCompany}</span>}</p>
        {m.type === 'Move-Out' && m.pendingDues > 0 && m.status === 'Pending' && <p className="ops-warn"><AlertTriangle size={14} /> {inr(m.pendingDues)} unpaid bills — clear before approval.</p>}
        {m.notes && <p className="muted">{m.notes}</p>}
        <ol className="sos-timeline">{m.timeline.map((t, i) => <li key={i}><span>{time(t.at)}</span> {t.message}</li>)}</ol>
        <footer>
          {approver && m.status === 'Pending' && <><button className="primary-button" disabled={busy === m.requestId} onClick={() => approve(m)}>Approve</button><button className="secondary-button" disabled={busy === m.requestId} onClick={() => { const n = window.prompt('Reason for rejection'); if (n) run(m.requestId, () => moveApi.reject(m.requestId, n)); }}>Reject</button></>}
          {canComplete && m.status === 'Approved' && <button className="primary-button" disabled={busy === m.requestId} onClick={() => window.confirm(`Mark ${m.type} for ${m.apartmentId} as completed? The apartment will be set to ${m.type === 'Move-In' ? 'Occupied' : 'Vacant'}.`) && run(m.requestId, () => moveApi.complete(m.requestId))}>Mark completed</button>}
          {(resident || approver) && ['Pending', 'Approved'].includes(m.status) && <button className="table-action danger" disabled={busy === m.requestId} onClick={() => window.confirm('Cancel this request?') && run(m.requestId, () => moveApi.cancel(m.requestId))}>Cancel</button>}
        </footer>
      </div>
    </article>)}</section>
    {form && <Modal title="New move request" kicker="Book a move" onClose={() => setForm(null)} onSubmit={submit} busy={busy === 'form'} error={error} submitLabel="Submit request">
      <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Move-In</option><option>Move-Out</option></select></label>
      {!resident && <label>Resident ID<input required value={form.residentId} onChange={(e) => setForm({ ...form, residentId: e.target.value })} placeholder="e.g. U003" /></label>}
      <label>Date<input type="date" required min={new Date().toISOString().slice(0, 10)} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></label>
      <label>Time slot<select value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>{['09:00-13:00', '14:00-18:00'].map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>Vehicle number<input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="Truck / tempo number" /></label>
      <label>Packers & movers<input value={form.moversCompany} onChange={(e) => setForm({ ...form, moversCompany: e.target.value })} /></label>
      <label className="check-label"><input type="checkbox" checked={form.needsLift} onChange={(e) => setForm({ ...form, needsLift: e.target.checked })} /> Reserve the service lift</label>
      <label className="span-2">Notes<textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
    </Modal>}
  </>;
}

// ======================= Parcels =======================
export function ParcelsPage() {
  const user = me();
  const desk = ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const resident = user.role === 'RESIDENT';
  const [tab, setTab] = useState('At Gate');
  const parcels = useLoad(() => parcelApi.list(tab === 'all' ? '' : tab), [tab]);
  const { busy, error, setError, run } = useAction(parcels.reload);
  const [form, setForm] = useState(null); const [done, setDone] = useState(null);
  const [codes, setCodes] = useState({});
  const submit = async (e) => { e.preventDefault(); const r = await run('form', () => parcelApi.log(form)); if (r) { setForm(null); setDone(`${r.parcelId} logged for ${r.apartmentId}${r.residentNotified ? ' — resident notified with a pickup code.' : ' — no resident on record to notify.'}`); } };
  const waiting = (parcels.data || []).filter((p) => p.status === 'At Gate').length;
  return <>
    <PageHeader eyebrow="Gate" title="Parcels & Deliveries" subtitle={resident ? 'Packages held at the gate for you. Show the pickup code to collect.' : 'Log deliveries, notify residents and hand over against the pickup code.'}
      action={<><Tabs value={tab} onChange={setTab} options={[['At Gate', 'Waiting'], ['Collected', 'Collected'], ['all', 'All']]} />{desk && <button className="primary-button" onClick={() => { setError(null); setForm({ apartmentId: '', courier: 'Amazon', description: '', packages: 1, storageLocation: 'Security cabin', trackingRef: '' }); }}><Package size={17} /> Log parcel</button>}</>} />
    {done && <p className="gate-ok ops-flash"><CheckCircle2 size={15} /> {done}</p>}
    <DataState loading={parcels.loading} error={parcels.error} onRetry={parcels.reload} />
    {error && !form && <p className="form-error">{error.message}</p>}
    {parcels.data && parcels.data.length === 0 && <section className="content-card"><p className="empty-row">{tab === 'At Gate' ? 'No parcels waiting.' : 'Nothing here yet.'}</p></section>}
    {tab === 'At Gate' && waiting > 0 && <p className="muted ops-count">{waiting} parcel{waiting === 1 ? '' : 's'} waiting</p>}
    <section className="parcel-grid">{parcels.data?.map((p) => <article key={p.parcelId} className={`content-card parcel-card ${p.status === 'At Gate' ? 'waiting' : ''}`}>
      <header><span className="parcel-apt">{p.apartmentId}</span><StatusBadge>{p.status}</StatusBadge></header>
      <h3>{p.courier}{p.packages > 1 ? ` × ${p.packages}` : ''}</h3>
      {p.description && <p>{p.description}</p>}
      <p className="muted">{p.residentName || 'No resident on record'} · {p.parcelId}</p>
      <p className="muted">Received {ago(p.receivedAt)} · {p.storageLocation}</p>
      {p.status === 'Collected' && <p className="muted">Collected {time(p.collectedAt)}{p.collectedByName ? ` by ${p.collectedByName}` : ''}</p>}
      {resident && p.status === 'At Gate' && <div className="pickup-code"><span>Pickup code</span><strong>{p.pickupCode}</strong></div>}
      {desk && p.status === 'At Gate' && <footer>
        <input inputMode="numeric" maxLength={4} placeholder="Code" value={codes[p.parcelId] || ''} onChange={(e) => setCodes({ ...codes, [p.parcelId]: e.target.value.replace(/\D/g, '') })} aria-label={`Pickup code for ${p.parcelId}`} />
        <button className="primary-button" disabled={busy === p.parcelId || (codes[p.parcelId] || '').length !== 4} onClick={() => run(p.parcelId, () => parcelApi.collect(p.parcelId, codes[p.parcelId]))}><PackageCheck size={15} /> Hand over</button>
        <button className="table-action" disabled={busy === p.parcelId} onClick={() => window.confirm('Mark as returned to the courier?') && run(p.parcelId, () => parcelApi.markReturned(p.parcelId))}>Returned</button>
      </footer>}
    </article>)}</section>
    {form && <Modal title="Log a parcel" kicker="Delivery received" onClose={() => setForm(null)} onSubmit={submit} busy={busy === 'form'} error={error} submitLabel="Log & notify">
      <label>Apartment ID<input required autoFocus value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value.toUpperCase() })} placeholder="e.g. A102" /></label>
      <label>Courier<select value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })}>{COURIERS.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Packages<input type="number" min="1" value={form.packages} onChange={(e) => setForm({ ...form, packages: e.target.value })} /></label>
      <label>Kept at<input value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} /></label>
      <label className="span-2">Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. medium box, fragile" /></label>
    </Modal>}
  </>;
}

// ======================= Preventive maintenance / AMC =======================
export function MaintenancePage() {
  const user = me();
  const manage = ['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role);
  const items = useLoad(() => maintenanceApi.list());
  const { busy, error, setError, run } = useAction(items.reload);
  const [editing, setEditing] = useState(null); const [servicing, setServicing] = useState(null);
  const [filter, setFilter] = useState('all');
  const data = items.data || [];
  const counts = { Overdue: data.filter((s) => s.dueState === 'Overdue').length, 'Due Soon': data.filter((s) => s.dueState === 'Due Soon').length, amc: data.filter((s) => s.amcState && s.amcState !== 'AMC Active').length };
  const list = data.filter((s) => filter === 'all' || (filter === 'attention' ? ['Overdue', 'Due Soon'].includes(s.dueState) || (s.amcState && s.amcState !== 'AMC Active') : true));
  const blank = { assetName: '', category: 'Lift', location: '', frequency: 'Monthly', lastDoneAt: '', nextDueAt: '', amcProvider: '', amcExpiry: '', amcCost: 0, checklist: '', blockId: '', vendorId: '', status: 'Active' };
  const d10 = (v) => (v ? String(v).slice(0, 10) : '');
  const save = async (e) => { e.preventDefault(); const body = { ...editing }; ['lastDoneAt', 'nextDueAt', 'amcExpiry'].forEach((k) => { if (!body[k]) delete body[k]; }); const r = await run('form', () => (editing.scheduleId ? maintenanceApi.update(editing.scheduleId, body) : maintenanceApi.create(body))); if (r) setEditing(null); };
  const service = async (e) => { e.preventDefault(); const r = await run('svc', () => maintenanceApi.complete(servicing.scheduleId, { note: servicing.note, cost: Number(servicing.cost) || 0, doneAt: servicing.doneAt })); if (r) setServicing(null); };
  return <>
    <PageHeader eyebrow="Facilities" title="Preventive Maintenance & AMC" subtitle="Service schedules for lifts, generators, pumps and fire systems, with AMC renewals. The facility manager is reminded automatically."
      action={<><Tabs value={filter} onChange={setFilter} options={[['all', 'All'], ['attention', 'Needs attention']]} />{manage && <button className="primary-button" onClick={() => { setError(null); setEditing(blank); }}><Plus size={17} /> Add asset</button>}</>} />
    {data.length > 0 && <section className="stats-grid ticket-stats">
      <StatCard label="Overdue services" value={counts.Overdue} icon={AlertTriangle} tone="red" helper="Past their due date" />
      <StatCard label="Due within 7 days" value={counts['Due Soon']} icon={Wrench} tone="amber" helper="Plan technicians now" />
      <StatCard label="AMC renewals" value={counts.amc} icon={CalendarCheck} tone="blue" helper="Expired or expiring in 30 days" />
    </section>}
    <DataState loading={items.loading} error={items.error} onRetry={items.reload} />
    {error && !editing && !servicing && <p className="form-error">{error.message}</p>}
    {items.data && list.length === 0 && <section className="content-card"><p className="empty-row">{filter === 'all' ? 'No assets scheduled yet.' : 'Nothing needs attention.'}</p></section>}
    {list.length > 0 && <section className="content-card resource-card"><div className="table-wrap"><table>
      <thead><tr><th>Asset</th><th>Category</th><th>Frequency</th><th>Last service</th><th>Next due</th><th>Status</th><th>AMC</th><th>Actions</th></tr></thead>
      <tbody>{list.map((s) => <tr key={s.scheduleId}>
        <td><strong>{s.assetName}</strong><br /><small className="muted">{s.scheduleId}{s.location ? ` · ${s.location}` : ''}</small></td>
        <td>{s.category}</td><td>{s.frequency}</td><td>{day(s.lastDoneAt)}</td>
        <td>{day(s.nextDueAt)}<br /><small className={s.daysToDue < 0 ? 'neg-text' : 'muted'}>{s.daysToDue < 0 ? `${-s.daysToDue} d overdue` : s.daysToDue === 0 ? 'today' : `in ${s.daysToDue} d`}</small></td>
        <td><StatusBadge>{s.dueState}</StatusBadge></td>
        <td>{s.amcState ? <><StatusBadge>{s.amcState.replace('AMC ', '')}</StatusBadge><br /><small className="muted">{s.amcProvider}{s.amcExpiry ? ` · till ${day(s.amcExpiry)}` : ''}</small></> : '—'}</td>
        <td><div className="row-actions">
          {s.status === 'Active' && <button className="table-action" onClick={() => { setError(null); setServicing({ ...s, note: '', cost: '', doneAt: new Date().toISOString().slice(0, 10) }); }}>Mark serviced</button>}
          {manage && <button className="table-action" onClick={() => { setError(null); setEditing({ ...blank, ...s, lastDoneAt: d10(s.lastDoneAt), nextDueAt: d10(s.nextDueAt), amcExpiry: d10(s.amcExpiry), blockId: s.blockId || '', vendorId: s.vendorId || '' }); }}>Edit</button>}
          {manage && <button className="icon-action danger" title="Delete" disabled={busy === s.scheduleId} onClick={() => window.confirm(`Delete schedule ${s.scheduleId}?`) && run(s.scheduleId, () => maintenanceApi.remove(s.scheduleId))}><Trash2 size={15} /></button>}
        </div></td>
      </tr>)}</tbody>
    </table></div></section>}
    {editing && <Modal title={editing.scheduleId || 'New asset schedule'} kicker={editing.scheduleId ? 'Update schedule' : 'Preventive maintenance'} onClose={() => setEditing(null)} onSubmit={save} busy={busy === 'form'} error={error}>
      <label>Asset name<input required value={editing.assetName} onChange={(e) => setEditing({ ...editing, assetName: e.target.value })} placeholder="e.g. Block A passenger lift" /></label>
      <label>Category<select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{ASSET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Location<input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></label>
      <label>Frequency<select value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}>{FREQUENCIES.map((f) => <option key={f}>{f}</option>)}</select></label>
      <label>Last serviced<input type="date" value={editing.lastDoneAt} onChange={(e) => setEditing({ ...editing, lastDoneAt: e.target.value })} /></label>
      <label>Next due (blank = from last service)<input type="date" value={editing.nextDueAt} onChange={(e) => setEditing({ ...editing, nextDueAt: e.target.value })} /></label>
      <label>AMC provider<input value={editing.amcProvider} onChange={(e) => setEditing({ ...editing, amcProvider: e.target.value })} /></label>
      <label>AMC expiry<input type="date" value={editing.amcExpiry} onChange={(e) => setEditing({ ...editing, amcExpiry: e.target.value })} /></label>
      <label>AMC cost (₹/yr)<input type="number" min="0" value={editing.amcCost} onChange={(e) => setEditing({ ...editing, amcCost: e.target.value })} /></label>
      <label>Vendor ID<input value={editing.vendorId} onChange={(e) => setEditing({ ...editing, vendorId: e.target.value })} /></label>
      <label>Block ID (blank = common)<input value={editing.blockId} onChange={(e) => setEditing({ ...editing, blockId: e.target.value })} /></label>
      {editing.scheduleId && <label>Status<select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>Active</option><option>Paused</option></select></label>}
      <label className="span-2">Service checklist<textarea rows="3" value={editing.checklist} onChange={(e) => setEditing({ ...editing, checklist: e.target.value })} placeholder={'Check brakes and ropes\nLubricate guide rails\nTest emergency alarm'} /></label>
    </Modal>}
    {servicing && <Modal title={servicing.assetName} kicker="Record service" onClose={() => setServicing(null)} onSubmit={service} busy={busy === 'svc'} error={error} submitLabel="Save service">
      <label>Serviced on<input type="date" required value={servicing.doneAt} onChange={(e) => setServicing({ ...servicing, doneAt: e.target.value })} /></label>
      {manage && <label>Cost (₹, adds a ledger expense)<input type="number" min="0" value={servicing.cost} onChange={(e) => setServicing({ ...servicing, cost: e.target.value })} /></label>}
      {servicing.checklist && <div className="span-2 checklist"><span className="section-kicker">Checklist</span><ul>{servicing.checklist.split('\n').filter(Boolean).map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
      <label className="span-2">Work done / findings<textarea rows="3" value={servicing.note} onChange={(e) => setServicing({ ...servicing, note: e.target.value })} /></label>
      <p className="span-2 muted">Next service will be scheduled {servicing.frequency.toLowerCase()} from this date.</p>
    </Modal>}
  </>;
}

// ======================= Forum & marketplace =======================
export function ForumPage() {
  const user = me();
  const canAnnounce = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user.role);
  const [kind, setKind] = useState('');
  const posts = useLoad(() => forumApi.list(kind), [kind]);
  const { busy, error, setError, run } = useAction(posts.reload);
  const [open, setOpen] = useState(null); const [reply, setReply] = useState('');
  const [form, setForm] = useState(null);
  const openPost = async (id) => { setReply(''); setOpen({ loading: true }); try { setOpen(await forumApi.get(id)); } catch (e) { setOpen(null); setError(e); } };
  const refreshOpen = async (id, fn) => { const r = await run(id, fn); if (r && open?.postId === id) setOpen(r.deleted ? null : r.comments ? r : await forumApi.get(id)); return r; };
  const submit = async (e) => { e.preventDefault(); const r = await run('form', () => forumApi.create(form)); if (r) setForm(null); };
  const kinds = POST_KINDS.filter((k) => k !== 'Announcement' || canAnnounce);
  return <>
    <PageHeader eyebrow="Neighbours" title="Community Forum & Marketplace" subtitle="Discuss, recommend, find lost items and buy or sell within the society."
      action={<button className="primary-button" onClick={() => { setError(null); setForm({ kind: 'Discussion', title: '', body: '', price: '', condition: 'Good' }); }}><Plus size={17} /> New post</button>} />
    <div className="forum-filters">{[['', 'All'], ...POST_KINDS.map((k) => [k, k])].map(([v, l]) => <button key={l} className={`chip-filter ${kind === v ? 'on' : ''}`} onClick={() => setKind(v)}>{l}</button>)}</div>
    <DataState loading={posts.loading} error={posts.error} onRetry={posts.reload} />
    {error && !form && <p className="form-error">{error.message}</p>}
    {posts.data && posts.data.length === 0 && <section className="content-card"><p className="empty-row">No posts yet — start the conversation.</p></section>}
    <section className="forum-list">{posts.data?.map((p) => <article key={p.postId} className={`content-card forum-card ${p.hidden ? 'hidden-post' : ''} ${p.pinned ? 'pinned' : ''}`}>
      <header>
        <span className={`chip kind-${p.kind.replace(/[^a-z]/gi, '').toLowerCase()}`}>{p.kind}</span>
        {p.pinned && <span className="muted pin"><Pin size={13} /> Pinned</span>}
        {p.hidden && <span className="ops-warn">Hidden by moderator</span>}
        {p.status === 'Closed' && <StatusBadge>{p.kind === 'Buy / Sell' ? 'Sold' : 'Closed'}</StatusBadge>}
        <span className="muted forum-when">{ago(p.createdAt)}</span>
      </header>
      <button className="forum-title" onClick={() => openPost(p.postId)}>{p.title}</button>
      {p.price != null && <p className="forum-price">{inr(p.price)}{p.condition ? <span className="muted"> · {p.condition}</span> : ''}</p>}
      {p.body && <p className="forum-body">{p.body.length > 220 ? `${p.body.slice(0, 220)}…` : p.body}</p>}
      <footer>
        <span className="muted">{p.authorName}{p.apartmentId ? ` · ${p.apartmentId}` : ''}{p.authorRole && p.authorRole !== 'RESIDENT' ? ` · ${p.authorRole.replace(/_/g, ' ').toLowerCase()}` : ''}</span>
        <button className={`forum-act ${p.likedByMe ? 'on' : ''}`} disabled={busy === p.postId} onClick={() => run(p.postId, () => forumApi.like(p.postId))}><Heart size={15} /> {p.likeCount}</button>
        <button className="forum-act" onClick={() => openPost(p.postId)}><MessageCircle size={15} /> {p.commentCount}</button>
      </footer>
    </article>)}</section>

    {open && <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(null)}><div className="resource-modal forum-thread">
      {open.loading ? <p className="muted">Loading…</p> : <>
        <div className="modal-head"><div><span className="section-kicker">{open.kind} · {open.postId}</span><h2>{open.title}</h2></div><button type="button" className="icon-action" onClick={() => setOpen(null)}>✕</button></div>
        {open.price != null && <p className="forum-price">{inr(open.price)}{open.condition ? <span className="muted"> · {open.condition}</span> : ''}</p>}
        {open.body && <p className="forum-full">{open.body}</p>}
        <p className="muted">{open.authorName}{open.apartmentId ? ` · ${open.apartmentId}` : ''} · {time(open.createdAt)}</p>
        <div className="row-actions thread-actions">
          {open.mine && open.status === 'Open' && <button className="table-action" onClick={() => refreshOpen(open.postId, () => forumApi.update(open.postId, { status: 'Closed' }))}>{open.kind === 'Buy / Sell' ? 'Mark sold' : 'Close'}</button>}
          {open.canModerate && <button className="table-action" onClick={() => refreshOpen(open.postId, () => forumApi.update(open.postId, { pinned: !open.pinned }))}>{open.pinned ? 'Unpin' : 'Pin'}</button>}
          {open.canModerate && !open.mine && <button className="table-action" onClick={() => { const reason = open.hidden ? '' : window.prompt('Reason for hiding (sent to the author)'); if (reason !== null) refreshOpen(open.postId, () => forumApi.update(open.postId, { hidden: !open.hidden, reason })); }}>{open.hidden ? 'Unhide' : 'Hide'}</button>}
          {(open.mine || open.canModerate) && <button className="table-action danger" onClick={() => window.confirm('Delete this post?') && refreshOpen(open.postId, () => forumApi.remove(open.postId))}>Delete</button>}
        </div>
        <h4 className="thread-head">{open.comments.length} repl{open.comments.length === 1 ? 'y' : 'ies'}</h4>
        <ul className="thread">{open.comments.map((c) => <li key={c.commentId}>
          <div><strong>{c.authorName}</strong><span className="muted">{c.apartmentId ? ` · ${c.apartmentId}` : ''} · {ago(c.at)}</span>{(c.authorId === user.userId || open.canModerate) && <button className="icon-action danger" title="Delete reply" onClick={() => refreshOpen(open.postId, () => forumApi.removeComment(open.postId, c.commentId))}><Trash2 size={13} /></button>}</div>
          <p>{c.text}</p>
        </li>)}</ul>
        {error && <p className="form-error">{error.message}</p>}
        {open.status === 'Open' ? <form className="reply-box" onSubmit={async (e) => { e.preventDefault(); const r = await refreshOpen(open.postId, () => forumApi.comment(open.postId, reply)); if (r) setReply(''); }}>
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" aria-label="Reply" />
          <button className="primary-button" disabled={!reply.trim() || busy === open.postId}><Send size={15} /></button>
        </form> : <p className="muted">This post is closed.</p>}
      </>}
    </div></div>}

    {form && <Modal title="New post" kicker="Share with neighbours" onClose={() => setForm(null)} onSubmit={submit} busy={busy === 'form'} error={error} submitLabel="Post">
      <label>Type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{kinds.map((k) => <option key={k}>{k}</option>)}</select></label>
      <label>Title<input required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      {form.kind === 'Buy / Sell' && <><label>Price (₹, 0 = free)<input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label>Condition<select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>{['New', 'Like New', 'Good', 'Fair'].map((c) => <option key={c}>{c}</option>)}</select></label></>}
      <label className="span-2">Details<textarea rows="5" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
    </Modal>}
  </>;
}
