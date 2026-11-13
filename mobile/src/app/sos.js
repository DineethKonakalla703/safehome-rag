import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Chips, ErrorNote, Field, Loading, Row, Screen, T, ago, useResource } from '../components/ui';
import { api } from '../lib/api';
import { MANAGERS, useAuth } from '../lib/auth';
import { colors, fonts, radius, shadow } from '../theme';

const TYPES = ['Medical', 'Fire', 'Security Threat', 'Gas Leak', 'Lift Stuck', 'Flooding', 'Electrical Hazard', 'Other'];

export default function Sos() {
  const { user } = useAuth();
  const responder = [...MANAGERS, 'SECURITY'].includes(user.role);
  const { data, loading, error, reload, refreshing } = useResource(() => api('/sos'), [user.userId]);
  const [type, setType] = useState('Medical');
  const [location, setLocation] = useState(user.apartmentId ? `Apartment ${user.apartmentId}` : '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [raised, setRaised] = useState(null);

  const raise = async () => {
    setBusy('raise'); setErr(null);
    try {
      const alert = await api('/sos', { method: 'POST', body: { emergencyType: type, location, message } });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setRaised(alert); setMessage(''); await reload();
    } catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const respond = async (a, action, body) => {
    setBusy(`${a.alertId}${action}`); setErr(null);
    try { await api(`/sos/${a.alertId}/${action}`, { method: 'PATCH', body }); await reload(); } catch (e) { setErr(e); } finally { setBusy(null); }
  };

  const active = (data || []).filter((a) => a.status === 'Active' || a.status === 'Acknowledged');
  const past = (data || []).filter((a) => a.status === 'Resolved' || a.status === 'False Alarm').slice(0, 6);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ErrorNote error={err || error} onRetry={reload} />
      {raised ? (
        <Card style={styles.raised}>
          <Row><Feather name="radio" size={18} color="#fff" /><Text style={styles.raisedTitle}>Alert {raised.alertId} sent</Text></Row>
          <Text style={styles.raisedText}>Security and the management team have been notified. Stay where you are if it&apos;s safe; help is on the way.</Text>
        </Card>
      ) : null}

      <Card style={{ marginTop: 6 }}>
        <T.label style={{ color: colors.sos, marginBottom: 10 }}>Raise an emergency</T.label>
        <Chips options={TYPES} value={type} onChange={setType} scroll={false} />
        <Field label="Where" value={location} onChangeText={setLocation} placeholder="Apartment, block, floor, common area…" />
        <Field label="What's happening (optional)" value={message} onChangeText={setMessage} placeholder="A few words help responders prepare" multiline />
        <Pressable onLongPress={raise} delayLongPress={600} disabled={busy === 'raise'}
          style={({ pressed }) => [styles.sosBtn, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}>
          <Feather name="alert-octagon" size={22} color="#fff" />
          <View>
            <Text style={styles.sosBtnText}>{busy === 'raise' ? 'Sending…' : 'Press and hold to send SOS'}</Text>
            <Text style={styles.sosBtnSub}>Prevents accidental alerts</Text>
          </View>
        </Pressable>
      </Card>

      <T.label style={{ marginTop: 22, marginBottom: 10, color: colors.muted }}>{responder ? 'Active alerts' : 'Your active alerts'} · {active.length}</T.label>
      {loading ? <Loading /> : !active.length ? <T.muted>No active emergencies. All quiet.</T.muted> : active.map((a) => (
        <Card key={a.alertId} accent={colors.sos} style={{ marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{a.emergencyType} · {a.location || a.apartmentId || 'location not given'}</T.title>
              <T.muted>{a.raisedByName || a.raisedBy} · {ago(a.createdAt)}</T.muted>
            </View>
            <Badge tone={a.status === 'Active' ? 'danger' : 'warning'}>{a.status}</Badge>
          </Row>
          {a.message ? <T.body style={{ marginTop: 8 }}>{a.message}</T.body> : null}
          {responder ? (
            <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
              {a.status === 'Active' ? <Button small title="Acknowledge" icon="eye" loading={busy === `${a.alertId}acknowledge`} onPress={() => respond(a, 'acknowledge', {})} /> : null}
              <Button small title="Resolve" icon="check" variant="secondary" loading={busy === `${a.alertId}resolve`} onPress={() => respond(a, 'resolve', { note: 'Resolved from mobile' })} />
              <Button small title="False alarm" variant="ghost" onPress={() => respond(a, 'resolve', { falseAlarm: true, note: 'Marked false alarm from mobile' })} />
            </Row>
          ) : null}
        </Card>
      ))}

      {past.length ? (
        <>
          <T.label style={{ marginTop: 18, marginBottom: 10, color: colors.muted }}>Recent</T.label>
          <Card style={{ paddingVertical: 6 }}>
            {past.map((a, i) => (
              <Row key={a.alertId} style={[{ justifyContent: 'space-between', paddingVertical: 10 }, i < past.length - 1 && styles.divider]}>
                <Text style={styles.pastText} numberOfLines={1}>{a.emergencyType} · {a.location || a.apartmentId}</Text>
                <Badge>{a.status}</Badge>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  raised: { backgroundColor: colors.sos, borderColor: colors.sos, marginTop: 6, marginBottom: 6 },
  raisedTitle: { fontFamily: fonts.heavy, fontSize: 15, color: '#fff' },
  raisedText: { fontFamily: fonts.body, fontSize: 13.5, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 19 },
  sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.sos, ...shadow.lift, shadowColor: colors.sos },
  sosBtnText: { fontFamily: fonts.heavy, fontSize: 15.5, color: '#fff' },
  sosBtnSub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pastText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
