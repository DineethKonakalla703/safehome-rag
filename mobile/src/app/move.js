import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, Card, Chips, Empty, ErrorNote, Field, Loading, Row, Screen, Sheet, T, fmtDate, inr, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';

const SLOTS = ['07:00-11:00', '09:00-13:00', '13:00-17:00', '16:00-20:00'];
const isoDay = (offset) => { const d = new Date(Date.now() + offset * 86400000); return d.toISOString().slice(0, 10); };

export default function Move() {
  const { user } = useAuth();
  const admin = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const resident = user.role === 'RESIDENT';
  const { data, loading, error, reload, refreshing } = useResource(() => api('/move-requests'), [user.userId]);
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const list = (data || []).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const decide = async (m, action, body = {}) => {
    setBusy(`${m.requestId}${action}`); setErr(null);
    try { await api(`/move-requests/${m.requestId}/${action}`, { method: 'PATCH', body }); await reload(); } catch (e) { setErr(e); } finally { setBusy(null); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ marginTop: 6 }} />
      {resident ? (composing ? <NewMove onCancel={() => setComposing(false)} onDone={() => { setComposing(false); reload(); }} /> : <Button title="Schedule a move" icon="truck" onPress={() => setComposing(true)} style={{ marginBottom: 14 }} />) : null}
      <ErrorNote error={err || error} onRetry={reload} />
      {loading ? <Loading /> : !list.length ? <Empty icon="truck" title="No moves scheduled" message={resident ? 'Book your lift slot and get approval before moving day.' : 'Move-in and move-out requests appear here.'} /> : list.map((m) => (
        <Card key={m.requestId} style={{ marginBottom: 10 }} accent={m.pendingDues > 0 && m.type === 'Move-Out' ? colors.warning : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{m.type} · {m.apartmentId}</T.title>
              <T.muted>{m.residentName || m.residentId} · {fmtDate(m.scheduledDate)} · {m.timeSlot}{m.needsLift ? ' · lift' : ''}</T.muted>
            </View>
            <Badge>{m.status}</Badge>
          </Row>
          {m.pendingDues > 0 ? <T.body style={{ color: colors.warning, marginTop: 8 }}>Pending dues {inr(m.pendingDues)}{m.type === 'Move-Out' ? ' — must be cleared before approval' : ''}</T.body> : null}
          {m.decisionNote ? <T.muted style={{ marginTop: 6 }}>Note: {m.decisionNote}</T.muted> : null}
          <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
            {admin && m.status === 'Pending' ? <>
              <Button small title="Approve" icon="check" loading={busy === `${m.requestId}approve`} onPress={() => decide(m, 'approve')} />
              <Button small title="Reject" variant="secondary" loading={busy === `${m.requestId}reject`} onPress={() => decide(m, 'reject', { note: 'Rejected from mobile' })} />
            </> : null}
            {(admin || user.role === 'SECURITY') && m.status === 'Approved' ? <Button small title="Mark completed" icon="check-circle" loading={busy === `${m.requestId}complete`} onPress={() => decide(m, 'complete')} /> : null}
            {resident && ['Pending', 'Approved'].includes(m.status) ? <Button small title="Cancel" variant="ghost" loading={busy === `${m.requestId}cancel`} onPress={() => decide(m, 'cancel')} /> : null}
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

function NewMove({ onCancel, onDone }) {
  const [form, setForm] = useState({ type: 'Move-Out', scheduledDate: isoDay(7), timeSlot: '09:00-13:00', needsLift: true, moversCompany: '', vehicleNumber: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.scheduledDate)) return setErr(new Error('Use the date format YYYY-MM-DD.'));
    setBusy(true); setErr(null);
    try { await api('/move-requests', { method: 'POST', body: form }); onDone(); } catch (e) { setErr(e); setBusy(false); }
  };
  return (
    <Sheet title="Schedule a move">
      <ErrorNote error={err} />
      <Chips options={['Move-In', 'Move-Out']} value={form.type} onChange={set('type')} />
      <Field label="Date" value={form.scheduledDate} onChangeText={set('scheduledDate')} placeholder="YYYY-MM-DD" hint="Book at least a few days ahead." />
      <Chips options={SLOTS} value={form.timeSlot} onChange={set('timeSlot')} />
      <Chips options={[{ value: 'yes', label: 'Needs service lift' }, { value: 'no', label: 'No lift' }]} value={form.needsLift ? 'yes' : 'no'} onChange={(v) => set('needsLift')(v === 'yes')} />
      <Field label="Movers (optional)" value={form.moversCompany} onChangeText={set('moversCompany')} placeholder="Company name" />
      <Field label="Vehicle (optional)" value={form.vehicleNumber} onChangeText={set('vehicleNumber')} autoCapitalize="characters" />
      <Row gap={10}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        <Button title="Request slot" icon="send" loading={busy} onPress={submit} style={{ flex: 1.4 }} />
      </Row>
    </Sheet>
  );
}
