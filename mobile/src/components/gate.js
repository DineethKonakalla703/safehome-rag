import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api';
import { colors, fonts, radius } from '../theme';
import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Row, Sheet, T, ago, fmtTime, useResource } from './ui';

const GATE_ROLES = ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'];

// ---------------- Visitors ----------------
export function VisitorsPanel({ user }) {
  const gate = GATE_ROLES.includes(user.role);
  const { data, loading, reload, error } = useResource(() => api('/visitors'), [user.userId]);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const run = async (key, fn) => { setBusy(key); setErr(null); try { await fn(); await reload(); } catch (e) { setErr(e); } finally { setBusy(null); } };

  const today = (data || []).filter((v) => v.status !== 'Exited' && v.status !== 'Rejected').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const past = (data || []).filter((v) => v.status === 'Exited' || v.status === 'Rejected').slice(0, 5);

  return (
    <>
      {gate ? <VerifyPass onDone={reload} /> : <InviteGuest onDone={reload} />}
      <ErrorNote error={err || error} onRetry={reload} />
      <Text style={styles.section}>{gate ? 'Expected & inside' : 'Your guests'}</Text>
      {loading ? <Loading /> : !today.length ? (
        <Empty icon="users" title="No guests expected" message={gate ? 'Pre-approved and walk-in visitors show up here.' : 'Invite a guest and share their gate pass.'} />
      ) : today.map((v) => (
        <Card key={v.visitorId} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{v.name}</T.title>
              <T.muted>{v.purpose} · {v.apartmentId}{v.vehicleNumber ? ` · ${v.vehicleNumber}` : ''}</T.muted>
            </View>
            <Badge>{v.status}</Badge>
          </Row>
          {v.passCode ? (
            <Row style={styles.passRow}>
              <Text style={styles.passLabel}>GATE PASS</Text>
              <Text style={styles.passCode}>{v.passCode}</Text>
              {!gate ? <Button small variant="ghost" icon="share-2" title="Share" onPress={() => Share.share({ message: `Your SafeHome gate pass for ${user.apartmentId}: ${v.passCode}. Show this at the gate.` }).catch(() => {})} /> : null}
            </Row>
          ) : null}
          {v.entryTime ? <T.muted style={{ marginTop: 6 }}>Entered {fmtTime(v.entryTime)}</T.muted> : null}
          <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
            {v.status === 'Pending' ? <Button small title="Approve" icon="check" loading={busy === `a${v.visitorId}`} onPress={() => run(`a${v.visitorId}`, () => api(`/visitors/${v.visitorId}/approve`, { method: 'PATCH' }))} /> : null}
            {gate && v.status === 'Approved' ? <Button small title="Check in" icon="log-in" loading={busy === `i${v.visitorId}`} onPress={() => run(`i${v.visitorId}`, () => api(`/visitors/${v.visitorId}/check-in`, { method: 'PATCH' }))} /> : null}
            {gate && v.status === 'Inside' ? <Button small variant="secondary" title="Mark exit" icon="log-out" loading={busy === `e${v.visitorId}`} onPress={() => run(`e${v.visitorId}`, () => api(`/visitors/${v.visitorId}/exit`, { method: 'PATCH' }))} /> : null}
          </Row>
        </Card>
      ))}
      {past.length ? (
        <>
          <Text style={styles.section}>Recently left</Text>
          <Card style={{ paddingVertical: 6 }}>
            {past.map((v, i) => (
              <Row key={v.visitorId} style={[styles.pastRow, i < past.length - 1 && styles.divider]}>
                <Text style={styles.pastName} numberOfLines={1}>{v.name}</Text>
                <T.muted>{v.exitTime ? ago(v.exitTime) : v.status}</T.muted>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </>
  );
}

function InviteGuest({ onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', purpose: 'Guest', vehicleNumber: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [made, setMade] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.name.trim() || form.phone.trim().length < 6) return setErr(new Error('Add the guest\'s name and phone number.'));
    setBusy(true); setErr(null);
    try {
      let v = await api('/visitors', { method: 'POST', body: { ...form, name: form.name.trim(), phone: form.phone.trim(), vehicleNumber: form.vehicleNumber.trim() || undefined } });
      if (v.status === 'Pending') v = await api(`/visitors/${v.visitorId}/approve`, { method: 'PATCH' });
      setMade(v); setForm({ name: '', phone: '', purpose: 'Guest', vehicleNumber: '' }); setOpen(false); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (!open) {
    return (
      <>
        {made?.passCode ? (
          <Card style={styles.madeCard}>
            <T.label style={{ color: colors.brassLight }}>Pass ready for {made.name}</T.label>
            <Text style={styles.madeCode}>{made.passCode}</Text>
            <T.muted style={{ color: colors.onInkMuted }}>Share this code. Security will verify it at the gate.</T.muted>
          </Card>
        ) : null}
        <Button title="Invite a guest" icon="user-plus" onPress={() => setOpen(true)} style={{ marginBottom: 6 }} />
      </>
    );
  }
  return (
    <Sheet title="Pre-approve a guest">
      <ErrorNote error={err} />
      <Field label="Name" value={form.name} onChangeText={set('name')} placeholder="Guest's full name" />
      <Field label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="10-digit mobile" keyboardType="phone-pad" />
      <Field label="Purpose" value={form.purpose} onChangeText={set('purpose')} placeholder="Guest, delivery, service…" />
      <Field label="Vehicle (optional)" value={form.vehicleNumber} onChangeText={set('vehicleNumber')} placeholder="KA 01 AB 1234" autoCapitalize="characters" />
      <Row gap={10}>
        <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} style={{ flex: 1 }} />
        <Button title="Create pass" icon="check" onPress={submit} loading={busy} style={{ flex: 1.4 }} />
      </Row>
    </Sheet>
  );
}

function VerifyPass({ onDone }) {
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const verify = async () => {
    if (!code.trim()) return;
    setBusy('verify'); setErr(null); setFound(null);
    try { setFound(await api(`/visitors/verify-pass?passCode=${encodeURIComponent(code.trim())}`)); } catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const move = async (action) => {
    setBusy(action); setErr(null);
    try { setFound(await api(`/visitors/${found.visitorId}/${action}`, { method: 'PATCH' })); onDone(); } catch (e) { setErr(e); } finally { setBusy(null); }
  };
  return (
    <Sheet title="Verify a gate pass">
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Field value={code} onChangeText={(v) => { setCode(v); setFound(null); }} placeholder="Pass code or phone" autoCapitalize="characters" onSubmitEditing={verify} returnKeyType="search" style={{ flex: 1, marginBottom: 0 }} />
        <Button title="Verify" onPress={verify} loading={busy === 'verify'} style={{ paddingHorizontal: 16 }} />
      </Row>
      <ErrorNote error={err} />
      {found ? (
        <View style={styles.found}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{found.name}</T.title>
              <T.muted>{found.purpose} · visiting {found.apartmentId} · {found.phone}</T.muted>
            </View>
            <Badge>{found.status}</Badge>
          </Row>
          <Row gap={8} style={{ marginTop: 12 }}>
            {found.status === 'Pending' ? <Button small title="Approve" icon="check" loading={busy === 'approve'} onPress={() => move('approve')} /> : null}
            {found.status === 'Approved' ? <Button small title="Allow entry" icon="log-in" loading={busy === 'check-in'} onPress={() => move('check-in')} /> : null}
            {found.status === 'Inside' ? <Button small variant="secondary" title="Mark exit" icon="log-out" loading={busy === 'exit'} onPress={() => move('exit')} /> : null}
          </Row>
        </View>
      ) : null}
    </Sheet>
  );
}

// ---------------- Parcels ----------------
export function ParcelsPanel({ user }) {
  const gate = GATE_ROLES.includes(user.role);
  const { data, loading, reload, error } = useResource(() => api('/parcels'), [user.userId]);
  const [codes, setCodes] = useState({});
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const waiting = (data || []).filter((p) => p.status === 'At Gate');
  const done = (data || []).filter((p) => p.status !== 'At Gate').slice(0, 6);

  const handOver = async (p) => {
    setBusy(p.parcelId); setErr(null);
    try { await api(`/parcels/${p.parcelId}/collect`, { method: 'PATCH', body: { pickupCode: (codes[p.parcelId] || '').trim() } }); await reload(); }
    catch (e) { setErr(e); } finally { setBusy(null); }
  };

  return (
    <>
      {gate ? <LogParcel onDone={reload} /> : null}
      <ErrorNote error={err || error} onRetry={reload} />
      <Text style={styles.section}>Waiting at the gate · {waiting.length}</Text>
      {loading ? <Loading /> : !waiting.length ? (
        <Empty icon="package" title="No parcels waiting" message={gate ? 'Log deliveries as they arrive; residents get a pickup code.' : 'You\'ll be notified with a pickup code when something arrives.'} />
      ) : waiting.map((p) => (
        <Card key={p.parcelId} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{p.courier}{p.packages > 1 ? ` · ${p.packages} packages` : ''}</T.title>
              <T.muted>{gate ? `${p.residentName || 'Resident'} · ${p.apartmentId} · ` : ''}{p.storageLocation} · {ago(p.receivedAt)}</T.muted>
            </View>
            <Badge>{p.status}</Badge>
          </Row>
          {p.pickupCode && !gate ? (
            <Row style={styles.passRow}>
              <Text style={styles.passLabel}>PICKUP CODE</Text>
              <Text style={styles.passCode}>{p.pickupCode}</Text>
            </Row>
          ) : null}
          {gate ? (
            <Row gap={10} style={{ marginTop: 12, alignItems: 'flex-start' }}>
              <Field value={codes[p.parcelId] || ''} onChangeText={(v) => setCodes((c) => ({ ...c, [p.parcelId]: v }))} placeholder="Resident's 4-digit code" keyboardType="number-pad" maxLength={4} style={{ flex: 1, marginBottom: 0 }} />
              <Button title="Hand over" small loading={busy === p.parcelId} disabled={(codes[p.parcelId] || '').length !== 4} onPress={() => handOver(p)} style={{ minHeight: 48 }} />
            </Row>
          ) : null}
        </Card>
      ))}
      {done.length ? (
        <>
          <Text style={styles.section}>History</Text>
          <Card style={{ paddingVertical: 6 }}>
            {done.map((p, i) => (
              <Row key={p.parcelId} style={[styles.pastRow, i < done.length - 1 && styles.divider]}>
                <Text style={styles.pastName} numberOfLines={1}>{p.courier}{gate ? ` · ${p.apartmentId}` : ''}</Text>
                <Badge>{p.status}</Badge>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </>
  );
}

const COURIERS = ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'BlueDart', 'Delhivery', 'Other'];
function LogParcel({ onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ apartmentId: '', courier: 'Amazon', packages: '1', description: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.apartmentId.trim()) return setErr(new Error('Which apartment is it for?'));
    setBusy(true); setErr(null);
    try {
      const p = await api('/parcels', { method: 'POST', body: { ...form, apartmentId: form.apartmentId.trim().toUpperCase(), packages: Number(form.packages) || 1 } });
      setOk(`Logged ${p.parcelId} for ${p.apartmentId}. The resident has their pickup code.`);
      setForm({ apartmentId: '', courier: 'Amazon', packages: '1', description: '' }); setOpen(false); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (!open) return (
    <>
      {ok ? <Card style={{ marginBottom: 10, backgroundColor: colors.successSoft, borderColor: '#BFE3D0' }}><Row><Feather name="check-circle" size={16} color={colors.success} /><T.body style={{ flex: 1, color: colors.success }}>{ok}</T.body></Row></Card> : null}
      <Button title="Log a delivery" icon="package" onPress={() => { setOk(null); setOpen(true); }} style={{ marginBottom: 6 }} />
    </>
  );
  return (
    <Sheet title="Log a delivery">
      <ErrorNote error={err} />
      <Field label="Apartment" value={form.apartmentId} onChangeText={set('apartmentId')} placeholder="e.g. A102" autoCapitalize="characters" />
      <Text style={styles.fieldLabel}>Courier</Text>
      <Row gap={8} style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        {COURIERS.map((c) => <Button key={c} small title={c} variant={form.courier === c ? 'primary' : 'secondary'} onPress={() => set('courier')(c)} />)}
      </Row>
      <Field label="Packages" value={form.packages} onChangeText={set('packages')} keyboardType="number-pad" maxLength={2} />
      <Field label="Note (optional)" value={form.description} onChangeText={set('description')} placeholder="Large box, fragile…" />
      <Row gap={10}>
        <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} style={{ flex: 1 }} />
        <Button title="Log parcel" icon="check" onPress={submit} loading={busy} style={{ flex: 1.4 }} />
      </Row>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.8, color: colors.muted, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  passRow: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 12 },
  passLabel: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1.6, color: colors.brassDeep },
  passCode: { flex: 1, fontFamily: fonts.display, fontSize: 19, letterSpacing: 1.5, color: colors.ink },
  pastRow: { justifyContent: 'space-between', paddingVertical: 10 },
  pastName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  found: { marginTop: 14, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  madeCard: { marginBottom: 12, backgroundColor: colors.ink2, borderColor: colors.ink2 },
  madeCode: { fontFamily: fonts.display, fontSize: 34, letterSpacing: 6, color: colors.onInk, marginVertical: 6 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textSoft, marginBottom: 8 },
});
