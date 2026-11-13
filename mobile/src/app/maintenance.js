import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, Card, Chips, Empty, ErrorNote, Field, Loading, Row, Screen, T, fmtDate, inr, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';

const ORDER = { Overdue: 0, 'Due Soon': 1, 'On Track': 2 };

export default function Maintenance() {
  const { user } = useAuth();
  const { data, loading, error, reload, refreshing } = useResource(() => api('/maintenance'));
  const [filter, setFilter] = useState('Due');
  const [doing, setDoing] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const canComplete = ['MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'].includes(user.role);
  const list = (data || []).filter((s) => s.status === 'Active' && (filter === 'All' || s.dueState !== 'On Track')).sort((a, b) => (ORDER[a.dueState] ?? 3) - (ORDER[b.dueState] ?? 3) || new Date(a.nextDueAt) - new Date(b.nextDueAt));

  const complete = async (s) => {
    setBusy(true); setErr(null);
    try { await api(`/maintenance/${s.scheduleId}/complete`, { method: 'POST', body: { note: note.trim() || 'Serviced (logged from mobile)' } }); setDoing(null); setNote(''); await reload(); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ marginTop: 6 }} />
      <Chips options={[{ value: 'Due', label: 'Due & overdue' }, { value: 'All', label: 'All assets' }]} value={filter} onChange={setFilter} />
      <ErrorNote error={err || error} onRetry={reload} />
      {loading ? <Loading /> : !list.length ? <Empty icon="check-circle" title="Nothing due" message="Every asset is serviced and on schedule." /> : list.map((s) => (
        <Card key={s.scheduleId} style={{ marginBottom: 10 }} accent={s.dueState === 'Overdue' ? colors.danger : s.dueState === 'Due Soon' ? colors.warning : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{s.assetName}</T.title>
              <T.muted>{s.category} · {s.location || s.blockId || 'Community'} · {s.frequency}</T.muted>
            </View>
            <Badge>{s.dueState}</Badge>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <T.muted>Next service {fmtDate(s.nextDueAt)}{typeof s.daysToDue === 'number' ? ` (${s.daysToDue < 0 ? `${-s.daysToDue} d late` : `in ${s.daysToDue} d`})` : ''}</T.muted>
          </Row>
          {s.amcProvider ? <T.muted style={{ marginTop: 4 }}>AMC · {s.amcProvider}{s.amcExpiry ? ` until ${fmtDate(s.amcExpiry)}` : ''}{s.amcCost ? ` · ${inr(s.amcCost)}` : ''}{s.amcState && s.amcState !== 'Active' ? ` · ${s.amcState}` : ''}</T.muted> : null}
          {canComplete ? (doing === s.scheduleId ? (
            <View style={{ marginTop: 12 }}>
              <Field value={note} onChangeText={setNote} placeholder="What was done? (optional)" multiline />
              <Row gap={8}>
                <Button small title="Cancel" variant="secondary" onPress={() => setDoing(null)} style={{ flex: 1 }} />
                <Button small title="Log service" icon="check" loading={busy} onPress={() => complete(s)} style={{ flex: 1.4 }} />
              </Row>
            </View>
          ) : <Button small title="Mark serviced" icon="check-square" variant="brass" onPress={() => { setDoing(s.scheduleId); setNote(''); }} style={{ marginTop: 12, alignSelf: 'flex-start' }} />) : null}
        </Card>
      ))}
    </Screen>
  );
}
