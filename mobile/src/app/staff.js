import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Row, Screen, Sheet, T, ago, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

export default function Staff() {
  const { user } = useAuth();
  const gate = ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const { data, loading, error, reload, refreshing } = useResource(() => api('/staff'), [user.userId]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState(null);

  const move = async (id, dir, label) => {
    setBusy(`${id}${dir}`); setErr(null); setNote(null);
    try { const s = await api(`/staff/${encodeURIComponent(id)}/${dir}`, { method: 'PATCH' }); setNote(`${s.name} ${dir === 'check-in' ? 'checked in' : 'checked out'}.`); setCode(''); await reload(); }
    catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const list = (data || []).filter((s) => s.status !== 'Inactive').sort((a, b) => Number(b.insideNow) - Number(a.insideNow));

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {gate ? (
        <Sheet title="Staff entry">
          <Field value={code} onChangeText={setCode} placeholder="Staff pass code or ID" autoCapitalize="characters" />
          <Row gap={10}>
            <Button title="Check in" icon="log-in" disabled={!code.trim()} loading={busy === `${code.trim()}check-in`} onPress={() => move(code.trim(), 'check-in')} style={{ flex: 1 }} />
            <Button title="Check out" icon="log-out" variant="secondary" disabled={!code.trim()} loading={busy === `${code.trim()}check-out`} onPress={() => move(code.trim(), 'check-out')} style={{ flex: 1 }} />
          </Row>
          {note ? <T.body style={{ color: colors.success, marginTop: 10 }}>{note}</T.body> : null}
        </Sheet>
      ) : null}
      <ErrorNote error={err || error} onRetry={reload} />
      <T.label style={{ color: colors.muted, marginBottom: 10, marginTop: gate ? 4 : 6 }}>{gate ? `On premises · ${list.filter((s) => s.insideNow).length}` : 'Your staff'}</T.label>
      {loading ? <Loading /> : !list.length ? <Empty icon="briefcase" title="No staff registered" message={gate ? 'Registered staff appear here.' : 'Add your maid, driver or cook on the web portal to give them a gate pass.'} /> : list.map((s) => (
        <Card key={s.staffId} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{s.name}</T.title>
              <T.muted>{s.staffType} · {s.employment === 'Society' ? 'Society staff' : s.apartmentId} · {s.shift}</T.muted>
            </View>
            <Badge tone={s.status === 'Blacklisted' ? 'danger' : s.insideNow ? 'success' : 'neutral'}>{s.status === 'Blacklisted' ? 'Blacklisted' : s.insideNow ? 'Inside' : 'Away'}</Badge>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
            {!gate && s.passCode ? <Text style={styles.code}>PASS {s.passCode}</Text> : <T.muted>{s.policeVerified ? 'Police verified' : 'Verification pending'}</T.muted>}
            <T.muted>{s.insideNow && s.lastEntryAt ? `In ${ago(s.lastEntryAt)}` : s.lastExitAt ? `Left ${ago(s.lastExitAt)}` : ''}</T.muted>
          </Row>
          {gate && s.status === 'Active' ? (
            <Button small style={{ marginTop: 10, alignSelf: 'flex-start' }} variant={s.insideNow ? 'secondary' : 'primary'} icon={s.insideNow ? 'log-out' : 'log-in'}
              title={s.insideNow ? 'Check out' : 'Check in'} loading={busy === `${s.staffId}${s.insideNow ? 'check-out' : 'check-in'}`}
              onPress={() => move(s.staffId, s.insideNow ? 'check-out' : 'check-in')} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { fontFamily: fonts.heavy, fontSize: 13, letterSpacing: 1.6, color: colors.brassDeep },
});
