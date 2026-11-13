import { CheckCircle2, Clock, IndianRupee, LogIn, LogOut, MapPin, Plus, Siren, TrendingDown, TrendingUp, Users, Vote, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EMERGENCY_TYPES, EVENT_CATEGORIES, STAFF_TYPES, eventApi, ledgerApi, pollApi, sosApi, staffApi } from '../api/communityLifeApi';
import DataState from '../components/DataState';
import PageHeader from '../components/PageHeader';
import ResourceManager from '../components/ResourceManager';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';
import '../styles/communityLife.css';

const me = () => getCurrentUser() || {};
const MANAGERS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];
const isManager = () => MANAGERS.includes(me().role);
const req = (name, label, type = 'text') => ({ name, label, type, required: true });
const field = (name, label, type = 'text') => ({ name, label, type });
const col = (key, label, badge = false) => ({ key, label, badge });
const inr = (n) => { const v = Math.round(Number(n) || 0); return `${v < 0 ? '−' : ''}₹${Math.abs(v).toLocaleString('en-IN')}`; };
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = async () => { setState((s) => ({ ...s, loading: !s.data, error: null })); try { setState({ data: await loader(), loading: false, error: null }); } catch (error) { setState({ data: null, loading: false, error }); } };
  useEffect(() => { load(); }, deps);
  return { ...state, reload: load };
}

export function Modal({ title, kicker, onClose, onSubmit, busy, error, children, submitLabel = 'Save' }) {
  return <div className="modal-backdrop"><form className="resource-modal" onSubmit={onSubmit}>
    <div className="modal-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><button type="button" className="icon-action" onClick={onClose}><X /></button></div>
    {error && <p className="form-error">{error.message}</p>}
    <div className="resource-form">{children}</div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button></div>
  </form></div>;
}

// ---------------- Staff & domestic help ----------------
export function StaffPage() {
  const user = me();
  const gate = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role);
  const resident = user.role === 'RESIDENT';
  const [code, setCode] = useState(''); const [msg, setMsg] = useState(null); const [key, setKey] = useState(0);
  const quick = async (kind) => {
    setMsg(null);
    try { const s = await (kind === 'in' ? staffApi.checkIn(code.trim()) : staffApi.checkOut(code.trim())); setMsg({ ok: true, text: `${s.name} (${s.staffType}) ${kind === 'in' ? 'checked in' : 'checked out'} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.` }); setCode(''); setKey((k) => k + 1); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };
  const strip = gate ? <section className="content-card gate-strip">
      <div><strong>Gate desk</strong><span>Enter a staff pass code (e.g. STK3F9QA) or staff ID</span></div>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Pass code" aria-label="Staff pass code" />
      <button className="primary-button" disabled={!code.trim()} onClick={() => quick('in')}><LogIn size={16} /> Check in</button>
      <button className="secondary-button" disabled={!code.trim()} onClick={() => quick('out')}><LogOut size={16} /> Check out</button>
      {msg && <p className={msg.ok ? 'gate-ok' : 'gate-err'}>{msg.text}</p>}
    </section> : null;
  return <ResourceManager key={key} intro={strip}
      title="Staff & Domestic Help"
      subtitle={resident ? 'Register your maid, cook, driver or nanny. Share their pass code with them and you are notified each time they enter or leave.' : 'Daily-help and society staff with gate passes, verification status and entry tracking.'}
      api={staffApi} idKey="staffId"
      columns={[col('staffId', 'ID'), col('name', 'Name'), col('staffType', 'Role'), col('phone', 'Phone'), col('apartmentId', 'Works at'), col('passCode', 'Pass code'), { key: 'policeVerified', label: 'Verified', format: (v) => (v ? 'Yes' : 'No') }, { key: 'insideNow', label: 'On premises', format: (v, r) => (v ? `Inside since ${new Date(r.lastEntryAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Outside') }, col('status', 'Status', true)]}
      fields={[req('name', 'Full name'), req('phone', 'Phone'), { ...req('staffType', 'Role', 'select'), options: STAFF_TYPES }, { ...field('employment', 'Employed by', 'select'), options: ['Private', 'Society'] }, field('workingDays', 'Working days (e.g. Mon–Sat)'), field('shift', 'Shift (e.g. 7–10 AM)'), ...(resident ? [] : [field('apartmentId', 'Apartment ID'), field('blockId', 'Block ID'), field('policeVerified', 'Police verified', 'checkbox')]), { ...field('status', 'Status', 'select'), options: ['Active', 'Inactive', 'Blacklisted'] }]}
      defaults={{ employment: resident ? 'Private' : 'Society', status: 'Active', blockId: user.blockId || '' }}
      canCreate={user.role !== 'FACILITY_MANAGER'} canEdit={user.role !== 'SECURITY' && user.role !== 'FACILITY_MANAGER'} canDelete={['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'].includes(user.role)}
      actions={gate ? [{ label: 'Check in', show: (r) => !r.insideNow && r.status === 'Active', run: (r) => staffApi.checkIn(r.staffId) }, { label: 'Check out', show: (r) => r.insideNow, run: (r) => staffApi.checkOut(r.staffId) }] : []}
    />;
}

// ---------------- Society accounts ----------------
export function AccountsPage() {
  const user = me();
  const canWrite = ['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role);
  const canSeeLedger = MANAGERS.includes(user.role);
  const [months, setMonths] = useState(6); const [key, setKey] = useState(0);
  const summary = useLoad(() => ledgerApi.summary(months), [months, key]);
  const s = summary.data;
  const peak = s ? Math.max(1, ...s.monthly.flatMap((m) => [m.income, m.expense])) : 1;
  const ledger = { ...ledgerApi, create: async (b) => { const r = await ledgerApi.create(b); setKey((k) => k + 1); return r; }, update: async (id, b) => { const r = await ledgerApi.update(id, b); setKey((k) => k + 1); return r; }, remove: async (id) => { const r = await ledgerApi.remove(id); setKey((k) => k + 1); return r; } };
  const overview = <>
    <DataState loading={summary.loading} error={summary.error} onRetry={summary.reload} />
    {s && <>
      <section className="stats-grid accounts-stats">
        <StatCard label="Total income" value={inr(s.totalIncome)} icon={TrendingUp} tone="green" helper={`incl. ${inr(s.billsCollected)} resident bills paid`} />
        <StatCard label="Total expense" value={inr(s.totalExpense)} icon={TrendingDown} tone="red" helper={`${s.entryCount} ledger entries`} />
        <StatCard label="Balance" value={inr(s.balance)} icon={Wallet} tone={s.balance >= 0 ? 'blue' : 'amber'} helper={s.balance >= 0 ? 'Surplus' : 'Deficit'} />
        <StatCard label="Dues outstanding" value={inr(s.billsOutstanding)} icon={IndianRupee} tone="amber" helper={`${s.overdueBills} overdue bills`} />
      </section>
      <section className="accounts-grid">
        <article className="content-card accounts-card">
          <div className="accounts-card-head"><h3>Monthly income vs expense</h3>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Months to show">{[3, 6, 12].map((m) => <option key={m} value={m}>Last {m} months</option>)}</select></div>
          <div className="bar-chart" role="img" aria-label="Monthly income and expense chart">
            {s.monthly.map((m) => <div key={m.month} className="bar-group" title={`${m.month}: income ${inr(m.income)}, expense ${inr(m.expense)}`}>
              <div className="bars"><span className="bar income" style={{ height: `${(m.income / peak) * 100}%` }} /><span className="bar expense" style={{ height: `${(m.expense / peak) * 100}%` }} /></div>
              <small>{new Date(`${m.month}-01`).toLocaleDateString('en-IN', { month: 'short' })}</small>
            </div>)}
          </div>
          <div className="legend"><span><i className="income" /> Income</span><span><i className="expense" /> Expense</span></div>
        </article>
        <article className="content-card accounts-card">
          <div className="accounts-card-head"><h3>By category</h3></div>
          {s.byCategory.length === 0 && <p className="empty-row">No ledger entries yet.</p>}
          <ul className="category-list">{s.byCategory.slice(0, 10).map((c) => <li key={`${c.type}${c.category}`}>
            <div><span>{c.category}</span><strong className={c.type === 'Income' ? 'pos' : 'neg'}>{c.type === 'Income' ? '+' : '−'}{inr(c.total)}</strong></div>
            <span className="meter"><i className={c.type === 'Income' ? 'income' : 'expense'} style={{ width: `${(c.total / Math.max(...s.byCategory.map((x) => x.total))) * 100}%` }} /></span>
          </li>)}</ul>
        </article>
      </section>
    </>}
  </>;
  if (!canSeeLedger) return <><PageHeader eyebrow="Transparency" title="Society Accounts" subtitle="Where the society's money comes from and where it goes." />{overview}</>;
  return <ResourceManager intro={overview}
      title="Society Accounts" subtitle="Income and expense ledger. Paid resident bills are counted automatically."
      api={ledger} idKey="entryId"
      columns={[col('entryId', 'ID'), { key: 'date', label: 'Date', format: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '—') }, col('type', 'Type', true), col('category', 'Category'), { key: 'amount', label: 'Amount', format: inr }, col('description', 'Description'), col('paymentMode', 'Mode'), col('blockId', 'Block')]}
      fields={[{ ...req('type', 'Type', 'select'), options: ['Income', 'Expense'] }, { ...req('category', 'Category', 'select'), options: [...(s?.categories?.expense || []), ...(s?.categories?.income || [])] }, req('amount', 'Amount (₹)', 'number'), req('date', 'Date', 'date'), field('description', 'Description', 'textarea'), { ...field('paymentMode', 'Payment mode', 'select'), options: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'] }, field('reference', 'Reference / invoice no.'), field('vendorId', 'Vendor ID'), field('blockId', 'Block ID (blank = whole society)')]}
      defaults={{ type: 'Expense', date: new Date().toISOString().slice(0, 10), paymentMode: 'Bank Transfer' }}
      canCreate={canWrite} canEdit={canWrite} canDelete={user.role === 'MAIN_ADMIN'}
    />;
}

// ---------------- Polls & voting ----------------
export function PollsPage() {
  const user = me();
  const manage = isManager();
  const canVote = ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const polls = useLoad(() => pollApi.list());
  const [creating, setCreating] = useState(false); const [form, setForm] = useState({ title: '', description: '', kind: 'Poll', options: '', closesAt: '' });
  const [busy, setBusy] = useState(null); const [error, setError] = useState(null);
  const act = async (id, fn) => { setBusy(id); setError(null); try { await fn(); await polls.reload(); } catch (e) { setError(e); } finally { setBusy(null); } };
  const submit = async (e) => { e.preventDefault(); setBusy('new'); setError(null); try { await pollApi.create({ ...form, options: form.options.split('\n') }); setCreating(false); setForm({ title: '', description: '', kind: 'Poll', options: '', closesAt: '' }); await polls.reload(); } catch (err) { setError(err); } finally { setBusy(null); } };
  return <>
    <PageHeader eyebrow="Community voice" title="Polls & Voting" subtitle="Society decisions, surveys and resolutions — one vote per apartment." action={manage ? <button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> New poll</button> : null} />
    <DataState loading={polls.loading} error={polls.error} onRetry={polls.reload} />
    {error && !creating && <p className="form-error">{error.message}</p>}
    {polls.data && polls.data.length === 0 && <section className="content-card"><p className="empty-row">No polls yet.{manage ? ' Create one to ask residents.' : ''}</p></section>}
    <section className="poll-grid">{polls.data?.map((p) => <article key={p.pollId} className="content-card poll-card">
      <header><span className="section-kicker">{p.kind} · {p.pollId}</span><StatusBadge>{p.status}</StatusBadge></header>
      <h3>{p.title}</h3>{p.description && <p className="muted">{p.description}</p>}
      <ul className="poll-options">{p.results.map((o) => {
        const mine = p.myVote === o.optionId;
        return <li key={o.optionId}>
          <button className={`poll-option ${mine ? 'mine' : ''}`} disabled={!canVote || p.status === 'Closed' || busy === p.pollId} onClick={() => act(p.pollId, () => pollApi.vote(p.pollId, o.optionId))}>
            <span className="poll-fill" style={{ width: `${p.myVote || p.status === 'Closed' || manage ? o.percent : 0}%` }} />
            <span className="poll-text">{mine && <CheckCircle2 size={15} />} {o.text}</span>
            {(p.myVote || p.status === 'Closed' || manage) && <span className="poll-pct">{o.percent}% · {o.votes}</span>}
          </button>
        </li>;
      })}</ul>
      <footer><span><Vote size={14} /> {p.totalVotes} vote{p.totalVotes === 1 ? '' : 's'}{p.closesAt ? ` · closes ${when(p.closesAt)}` : ''}{p.targetType === 'Block' ? ` · ${p.blockId} only` : ''}</span>
        {manage && p.status === 'Open' && <button className="table-action" disabled={busy === p.pollId} onClick={() => act(p.pollId, () => pollApi.close(p.pollId))}>Close poll</button>}
        {['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role) && <button className="table-action danger" disabled={busy === p.pollId} onClick={() => window.confirm(`Delete ${p.pollId}?`) && act(p.pollId, () => pollApi.remove(p.pollId))}>Delete</button>}
      </footer>
      {canVote && p.status === 'Open' && !p.myVote && <p className="poll-hint">Tap an option to vote. You can change your vote until the poll closes.</p>}
    </article>)}</section>
    {creating && <Modal title="New poll" kicker="Ask the community" onClose={() => setCreating(false)} onSubmit={submit} busy={busy === 'new'} error={error} submitLabel="Publish poll">
      <label>Question<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Should we install EV chargers in the basement?" /></label>
      <label>Type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{['Poll', 'Survey', 'Resolution'].map((k) => <option key={k}>{k}</option>)}</select></label>
      <label className="span-2">Details<textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label className="span-2">Options (one per line)<textarea rows="4" required value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder={'Yes\nNo\nNeed more information'} /></label>
      <label>Closes on<input type="date" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></label>
    </Modal>}
  </>;
}

// ---------------- Events & calendar ----------------
export function EventsPage() {
  const user = me();
  const manage = isManager();
  const [showPast, setShowPast] = useState(false);
  const events = useLoad(() => eventApi.list());
  const [editing, setEditing] = useState(null); const [busy, setBusy] = useState(null); const [error, setError] = useState(null);
  const list = useMemo(() => (events.data || []).filter((e) => showPast || new Date(e.endAt || e.startAt) >= new Date(Date.now() - 6 * 3600000)), [events.data, showPast]);
  const byMonth = useMemo(() => list.reduce((acc, e) => { const k = new Date(e.startAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); (acc[k] ||= []).push(e); return acc; }, {}), [list]);
  const act = async (id, fn) => { setBusy(id); setError(null); try { await fn(); await events.reload(); } catch (e) { setError(e); } finally { setBusy(null); } };
  const blank = { title: '', category: 'Festival', startAt: '', endAt: '', location: 'Clubhouse', capacity: 0, description: '', targetType: 'Community', blockId: user.blockId || '', status: 'Scheduled' };
  const local = (d) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  const submit = async (e) => { e.preventDefault(); setBusy('form'); setError(null); try { const body = { ...editing, capacity: Number(editing.capacity) || 0, startAt: new Date(editing.startAt).toISOString(), endAt: editing.endAt ? new Date(editing.endAt).toISOString() : null, blockId: editing.targetType === 'Block' ? editing.blockId : null }; if (editing.eventId) await eventApi.update(editing.eventId, body); else await eventApi.create(body); setEditing(null); await events.reload(); } catch (err) { setError(err); } finally { setBusy(null); } };
  return <>
    <PageHeader eyebrow="Community calendar" title="Events" subtitle="Festivals, meetings, AGMs and activities — RSVP so organisers can plan." action={<>
      <label className="toggle-inline"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Show past</label>
      {manage && <button className="primary-button" onClick={() => setEditing(blank)}><Plus size={17} /> New event</button>}</>} />
    <DataState loading={events.loading} error={events.error} onRetry={events.reload} />
    {error && !editing && <p className="form-error">{error.message}</p>}
    {events.data && list.length === 0 && <section className="content-card"><p className="empty-row">No upcoming events.</p></section>}
    {Object.entries(byMonth).map(([month, items]) => <section key={month} className="event-month"><h3>{month}</h3>
      <div className="event-list">{items.map((e) => { const d = new Date(e.startAt); const full = e.capacity && e.headcount >= e.capacity; return <article key={e.eventId} className={`content-card event-card ${e.status !== 'Scheduled' ? 'dim' : ''}`}>
        <div className="event-date"><strong>{d.getDate()}</strong><span>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span></div>
        <div className="event-body">
          <header><h4>{e.title}</h4><span className="chip">{e.category}</span>{e.status !== 'Scheduled' && <StatusBadge>{e.status}</StatusBadge>}</header>
          <p className="event-meta"><span><Clock size={14} /> {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}{e.endAt ? ` – ${new Date(e.endAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span><span><MapPin size={14} /> {e.location}</span><span><Users size={14} /> {e.headcount} going{e.capacity ? ` / ${e.capacity}` : ''}{e.maybeCount ? ` · ${e.maybeCount} maybe` : ''}</span>{e.targetType === 'Block' && <span>{e.blockId} only</span>}</p>
          {e.description && <p className="muted">{e.description}</p>}
          {e.attendees?.length > 0 && <p className="attendees">Going: {e.attendees.slice(0, 8).join(', ')}{e.attendees.length > 8 ? ` +${e.attendees.length - 8}` : ''}</p>}
          <footer>
            {e.status === 'Scheduled' && ['Going', 'Maybe', 'Not Going'].map((r) => <button key={r} className={`rsvp ${e.myRsvp === r ? 'on' : ''}`} disabled={busy === e.eventId || (r === 'Going' && full && e.myRsvp !== 'Going')} onClick={() => act(e.eventId, () => eventApi.rsvp(e.eventId, r))}>{r}</button>)}
            {full && e.myRsvp !== 'Going' && <span className="muted">Full</span>}
            {manage && <span className="spacer" />}
            {manage && <button className="table-action" onClick={() => setEditing({ ...e, startAt: local(e.startAt), endAt: local(e.endAt), blockId: e.blockId || '' })}>Edit</button>}
            {manage && e.status === 'Scheduled' && <button className="table-action danger" disabled={busy === e.eventId} onClick={() => window.confirm(`Cancel "${e.title}"?`) && act(e.eventId, () => eventApi.update(e.eventId, { status: 'Cancelled' }))}>Cancel event</button>}
          </footer>
        </div>
      </article>; })}</div>
    </section>)}
    {editing && <Modal title={editing.eventId || 'New event'} kicker={editing.eventId ? 'Update event' : 'Plan an event'} onClose={() => setEditing(null)} onSubmit={submit} busy={busy === 'form'} error={error}>
      <label>Title<input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
      <label>Category<select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Starts<input type="datetime-local" required value={editing.startAt} onChange={(e) => setEditing({ ...editing, startAt: e.target.value })} /></label>
      <label>Ends<input type="datetime-local" value={editing.endAt} onChange={(e) => setEditing({ ...editing, endAt: e.target.value })} /></label>
      <label>Location<input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></label>
      <label>Capacity (0 = unlimited)<input type="number" min="0" value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: e.target.value })} /></label>
      <label>Audience<select value={editing.targetType} onChange={(e) => setEditing({ ...editing, targetType: e.target.value })}><option>Community</option><option>Block</option></select></label>
      {editing.targetType === 'Block' && <label>Block ID<input value={editing.blockId} onChange={(e) => setEditing({ ...editing, blockId: e.target.value })} /></label>}
      {editing.eventId && <label>Status<select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{['Scheduled', 'Cancelled', 'Completed'].map((s) => <option key={s}>{s}</option>)}</select></label>}
      <label className="span-2">Description<textarea rows="3" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
    </Modal>}
  </>;
}

// ---------------- Emergency SOS ----------------
export function SosPage() {
  const user = me();
  const responder = [...MANAGERS, 'SECURITY'].includes(user.role);
  const [filter, setFilter] = useState('open');
  const alerts = useLoad(() => sosApi.list(filter === 'all' ? '' : filter), [filter]);
  const [busy, setBusy] = useState(null); const [error, setError] = useState(null);
  useEffect(() => { const t = setInterval(() => alerts.reload(), 15000); return () => clearInterval(t); }, [filter]);
  const act = async (id, fn) => { setBusy(id); setError(null); try { await fn(); await alerts.reload(); window.dispatchEvent(new Event('safehome:sos-changed')); } catch (e) { setError(e); } finally { setBusy(null); } };
  return <>
    <PageHeader eyebrow="Safety" title="Emergency SOS" subtitle={responder ? 'Live emergency alerts. Acknowledge to tell the resident help is coming, then resolve.' : 'Your emergency alerts. Use the red SOS button at the top of any page to raise one.'} action={<div className="segmented">{[['open', 'Open'], ['all', 'All']].map(([v, l]) => <button key={v} className={filter === v ? 'on' : ''} onClick={() => setFilter(v)}>{l}</button>)}</div>} />
    <DataState loading={alerts.loading} error={alerts.error} onRetry={alerts.reload} />
    {error && <p className="form-error">{error.message}</p>}
    {alerts.data?.length === 0 && <section className="content-card sos-empty"><CheckCircle2 size={28} /><p>{filter === 'open' ? 'No open emergencies.' : 'No alerts yet.'}</p></section>}
    <section className="sos-list">{alerts.data?.map((a) => <article key={a.alertId} className={`content-card sos-card sos-${a.status.toLowerCase().replace(' ', '-')}`}>
      <div className="sos-icon"><Siren size={22} /></div>
      <div className="sos-body">
        <header><h3>{a.emergencyType}</h3><StatusBadge>{a.status}</StatusBadge><span className="muted">{a.alertId} · {ago(a.createdAt)}</span></header>
        <p className="sos-who"><strong>{a.raisedByName}</strong>{a.apartmentId ? ` · Apt ${a.apartmentId}` : ''}{a.blockId ? ` · ${a.blockId}` : ''}{a.location ? ` · ${a.location}` : ''}</p>
        {a.message && <p>{a.message}</p>}
        <ol className="sos-timeline">{a.timeline.map((t, i) => <li key={i}><span>{when(t.at)}</span> {t.message}</li>)}</ol>
        {responder && ['Active', 'Acknowledged'].includes(a.status) && <footer>
          {a.status === 'Active' && <button className="primary-button" disabled={busy === a.alertId} onClick={() => act(a.alertId, () => sosApi.acknowledge(a.alertId, window.prompt('Note for the resident (optional)', 'Security is on the way') || ''))}>Acknowledge</button>}
          <button className="secondary-button" disabled={busy === a.alertId} onClick={() => { const note = window.prompt('Resolution note'); if (note !== null) act(a.alertId, () => sosApi.resolve(a.alertId, note)); }}>Resolve</button>
          <button className="table-action" disabled={busy === a.alertId} onClick={() => { const note = window.prompt('Why was this a false alarm?'); if (note !== null) act(a.alertId, () => sosApi.resolve(a.alertId, note, true)); }}>False alarm</button>
        </footer>}
      </div>
    </article>)}</section>
  </>;
}

// Navbar SOS button: pick an emergency type, confirm, raise.
export function SosButton() {
  const user = me();
  const [open, setOpen] = useState(false); const [type, setType] = useState('Medical'); const [message, setMessage] = useState(''); const [location, setLocation] = useState('');
  const [state, setState] = useState(null);
  if (!user.role) return null;
  const raise = async (e) => { e.preventDefault(); setState({ busy: true }); try { const a = await sosApi.raise({ emergencyType: type, message, location }); setState({ done: a }); window.dispatchEvent(new Event('safehome:sos-changed')); } catch (err) { setState({ error: err.message }); } };
  const close = () => { setOpen(false); setState(null); setMessage(''); setLocation(''); };
  return <>
    <button className="sos-nav-button" onClick={() => setOpen(true)} title="Raise an emergency SOS" aria-label="Emergency SOS"><Siren size={16} /> SOS</button>
    {open && <div className="modal-backdrop"><form className="resource-modal sos-modal" onSubmit={raise}>
      <div className="modal-head"><div><span className="section-kicker">Emergency</span><h2>Raise SOS</h2></div><button type="button" className="icon-action" onClick={close}><X /></button></div>
      {state?.done ? <div className="sos-sent"><CheckCircle2 size={34} /><h3>Alert {state.done.alertId} sent</h3><p>{state.done.duplicate ? 'You already raised an alert in the last 2 minutes — responders have it.' : 'Security, admins and the facility manager have been notified. Stay where you are if it is safe.'}</p><p className="muted">For life-threatening emergencies also call 112.</p><div className="modal-actions"><button type="button" className="primary-button" onClick={close}>Close</button></div></div> : <>
        <div className="sos-types">{EMERGENCY_TYPES.map((t) => <button type="button" key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>)}</div>
        <div className="resource-form">
          <label className="span-2">What's happening? (optional)<textarea rows="2" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <label className="span-2">Where? {user.apartmentId ? `(defaults to apartment ${user.apartmentId})` : ''}<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Block A lift, basement parking" /></label>
        </div>
        {state?.error && <p className="form-error">{state.error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="danger-button" disabled={state?.busy}><Siren size={16} /> {state?.busy ? 'Sending…' : `Send ${type} SOS`}</button></div>
      </>}
    </form></div>}
  </>;
}

// Banner shown to responders on every page while an SOS is open.
export function SosBanner({ onOpen }) {
  const user = me();
  const responder = [...MANAGERS, 'SECURITY'].includes(user.role);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    if (!responder) return undefined;
    let alive = true;
    const load = () => sosApi.list('open').then((a) => alive && setAlerts(a)).catch(() => {});
    load(); const t = setInterval(load, 20000); window.addEventListener('safehome:sos-changed', load);
    return () => { alive = false; clearInterval(t); window.removeEventListener('safehome:sos-changed', load); };
  }, [responder]);
  const active = alerts.filter((a) => a.status === 'Active');
  if (!responder || alerts.length === 0) return null;
  const top = active[0] || alerts[0];
  return <button className={`sos-banner ${active.length ? 'live' : ''}`} onClick={onOpen}>
    <Siren size={18} />
    <span><strong>{active.length ? `${active.length} active emergenc${active.length === 1 ? 'y' : 'ies'}` : `${alerts.length} being handled`}</strong> — {top.emergencyType} · {top.raisedByName}{top.apartmentId ? ` · Apt ${top.apartmentId}` : ''} · {ago(top.createdAt)}</span>
    <span className="sos-banner-cta">Open SOS</span>
  </button>;
}

