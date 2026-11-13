import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Empty, ErrorNote, Loading, Row, Screen, T, useResource } from '../components/ui';
import { api } from '../lib/api';
import { colors, fonts, radius } from '../theme';

export default function Events() {
  const { data, loading, error, reload, refreshing } = useResource(async () => {
    const list = await api('/events');
    const cutoff = Date.now() - 3600000;
    return list.filter((e) => e.status === 'Scheduled' && new Date(e.endAt || e.startAt).getTime() >= cutoff).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  });
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const upcoming = data || [];
  const rsvp = async (e, response) => {
    setBusy(`${e.eventId}${response}`); setErr(null);
    try { await api(`/events/${e.eventId}/rsvp`, { method: 'POST', body: { response } }); await reload(); } catch (x) { setErr(x); } finally { setBusy(null); }
  };
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ErrorNote error={err || error} onRetry={reload} />
      {loading ? <Loading /> : !upcoming.length ? <Empty icon="calendar" title="Nothing scheduled" message="Upcoming festivals, meetings and workshops appear here." /> : upcoming.map((e) => {
        const d = new Date(e.startAt);
        return (
          <Card key={e.eventId} style={{ marginBottom: 12, marginTop: 4 }}>
            <Row gap={14} style={{ alignItems: 'flex-start' }}>
              <View style={styles.date}>
                <Text style={styles.month}>{d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</Text>
                <Text style={styles.day}>{d.getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <T.title>{e.title}</T.title>
                <T.muted>{d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {e.location}</T.muted>
                <Row gap={6} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                  <Badge tone="brass">{e.category}</Badge>
                  <Badge tone="neutral">{`${e.headcount || 0} going${e.capacity ? ` / ${e.capacity}` : ''}`}</Badge>
                </Row>
              </View>
            </Row>
            {e.description ? <T.body style={{ marginTop: 12 }}>{e.description}</T.body> : null}
            <Row gap={8} style={{ marginTop: 14 }}>
              {['Going', 'Maybe', 'Not Going'].map((r) => (
                <Button key={r} small title={r} variant={e.myRsvp === r ? 'primary' : 'secondary'} loading={busy === `${e.eventId}${r}`} onPress={() => rsvp(e, r)} style={{ flex: 1 }} />
              ))}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { width: 54, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.ink2, alignItems: 'center' },
  month: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1.4, color: colors.brassLight },
  day: { fontFamily: fonts.display, fontSize: 24, color: colors.onInk },
});
