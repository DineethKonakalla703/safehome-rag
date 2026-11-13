import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, ErrorNote, Field, Loading, Row, Screen, SectionHeader, T, fmtTime, useResource } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, fonts } from '../../theme';

export default function TicketDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: t, loading, error, reload, refreshing } = useResource(() => api(`/tickets/${id}`), [id]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  const act = async (key, path, body) => {
    setBusy(key); setActionError(null);
    try { await api(path, { method: key === 'comment' ? 'POST' : 'PATCH', body }); if (key === 'comment') setComment(''); await reload(); }
    catch (e) { setActionError(e); }
    finally { setBusy(null); }
  };

  if (loading) return <Screen><Loading /></Screen>;
  if (!t) return <Screen><ErrorNote error={error || new Error('Request not found.')} onRetry={reload} /></Screen>;

  const tech = user.role === 'TECHNICIAN';
  const manager = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user.role);
  const transitions = tech
    ? [t.status === 'Assigned' && ['In Progress', 'Start work', 'play'], t.status === 'In Progress' && ['Resolved', 'Mark resolved', 'check']].filter(Boolean)
    : manager ? [['In Progress', 'In progress', 'activity'], ['Resolved', 'Resolve', 'check'], ['Closed', 'Close', 'lock']].filter(([s]) => s !== t.status) : [];

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ title: t.ticketId }} />
      <View style={{ marginTop: 6, marginBottom: 16 }}>
        <Row gap={8} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          <Badge>{t.status}</Badge>
          <Badge tone={t.priority === 'Critical' || t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'neutral'}>{`${t.priority} priority`}</Badge>
          {t.safetyRisk ? <Badge tone="danger">Safety risk</Badge> : null}
        </Row>
        <Text style={styles.title}>{t.title}</Text>
        <T.body style={{ marginTop: 10 }}>{t.description}</T.body>
      </View>

      <Card>
        <Info label="Category" value={t.category} />
        <Info label="Location" value={`${t.blockName} · Apartment ${t.apartmentNumber}`} />
        <Info label="Raised by" value={t.residentName} />
        <Info label="Technician" value={t.assignedTechnicianName || 'Not assigned yet'} />
        <Info label="Raised" value={fmtTime(t.createdAt)} />
        {t.slaDueDate ? <Info label="Target" value={fmtTime(t.slaDueDate)} last /> : null}
      </Card>

      {t.suggestedAction ? (
        <Card style={{ marginTop: 12, backgroundColor: colors.brassSoft, borderColor: '#E6D6B2' }}>
          <T.label style={{ marginBottom: 6 }}>Suggested action</T.label>
          <T.body style={{ color: colors.text }}>{t.suggestedAction}</T.body>
        </Card>
      ) : null}

      <ErrorNote error={actionError} />
      {transitions.length ? (
        <Row gap={8} style={{ marginTop: 14, flexWrap: 'wrap' }}>
          {transitions.map(([status, label, icon], i) => (
            <Button key={status} title={label} icon={icon} small variant={i === 0 ? 'primary' : 'secondary'} loading={busy === status}
              onPress={() => act(status, `/tickets/${t.ticketId}/status`, { status })} style={{ flexGrow: 1 }} />
          ))}
        </Row>
      ) : null}

      <SectionHeader title={`Conversation · ${t.comments?.length || 0}`} />
      {(t.comments || []).map((c, i) => {
        const mine = c.actorId === user.userId;
        return (
          <View key={i} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, mine && { color: colors.onInk }]}>{c.message}</Text>
            <Text style={[styles.bubbleMeta, mine && { color: colors.onInkMuted }]}>{mine ? 'You' : c.actorId} · {fmtTime(c.createdAt)}</Text>
          </View>
        );
      })}
      <Field value={comment} onChangeText={setComment} placeholder="Add an update or question…" multiline style={{ marginTop: 6 }} />
      <Button title="Send update" icon="send" variant="secondary" disabled={!comment.trim()} loading={busy === 'comment'}
        onPress={() => act('comment', `/tickets/${t.ticketId}/comments`, { message: comment.trim() })} />

      <SectionHeader title="Timeline" />
      <Card>
        {[...(t.timeline || [])].reverse().map((s, i, arr) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepRail}>
              <View style={[styles.stepDot, i === 0 && { backgroundColor: colors.brass }]} />
              {i < arr.length - 1 ? <View style={styles.stepLine} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
              <Text style={styles.stepText}>{s.message}</Text>
              <Text style={styles.stepMeta}>{fmtTime(s.timestamp)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Info({ label, value, last }) {
  return (
    <View style={[styles.info, !last && styles.infoDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 25, lineHeight: 31, color: colors.ink, letterSpacing: -0.3 },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  infoDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  infoValue: { flex: 1, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13.5, color: colors.text },
  bubble: { maxWidth: '86%', padding: 12, borderRadius: 16, marginBottom: 8 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.ink2, borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },
  bubbleMeta: { fontFamily: fonts.semibold, fontSize: 11, color: colors.faint, marginTop: 4 },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 12 },
  stepDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.borderStrong, marginTop: 5 },
  stepLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginTop: 4 },
  stepText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text },
  stepMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.faint, marginTop: 2 },
});
