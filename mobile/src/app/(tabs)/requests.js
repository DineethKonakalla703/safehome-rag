import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Chips, Empty, ErrorNote, Loading, PageTitle, Screen, ago, tap, useResource } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, fonts, radius, shadow } from '../../theme';

const FILTERS = ['Open', 'Resolved', 'All'];
const OPEN = ['New', 'Assigned', 'In Progress'];

export default function Requests() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('Open');
  const { data, loading, refreshing, reload, error } = useResource(() => api('/tickets'), [user.userId]);
  const list = (data || []).filter((t) => filter === 'All' || (filter === 'Open' ? OPEN.includes(t.status) : !OPEN.includes(t.status)));
  const canRaise = user.role !== 'TECHNICIAN';
  const tech = user.role === 'TECHNICIAN';

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshing={refreshing} onRefresh={reload}
        header={<PageTitle eyebrow={tech ? 'Work orders' : 'Service desk'} title={tech ? 'Your jobs' : 'Requests'} subtitle={tech ? 'Start, update and close the work assigned to you.' : 'Every issue, from the first report to the fix.'} />}>
        <Chips options={FILTERS.map((f) => ({ value: f, label: `${f}${data ? ` · ${(data || []).filter((t) => f === 'All' || (f === 'Open' ? OPEN.includes(t.status) : !OPEN.includes(t.status))).length}` : ''}` }))} value={filter} onChange={setFilter} />
        <ErrorNote error={error} onRetry={reload} />
        {loading ? <Loading /> : !list.length ? (
          <Empty icon="check-circle" title={filter === 'Open' ? 'All clear' : 'Nothing here'} message={filter === 'Open' ? 'No open requests right now.' : 'No requests match this filter.'}
            action={canRaise && filter === 'Open' ? 'Raise a request' : null} onAction={() => router.push('/tickets/new')} />
        ) : list.map((t) => (
          <Card key={t.ticketId} onPress={() => router.push(`/tickets/${t.ticketId}`)} style={{ marginBottom: 10 }}
            accent={t.priority === 'Critical' ? colors.danger : t.priority === 'High' ? colors.warning : undefined}>
            <View style={styles.rowTop}>
              <Text style={styles.id}>{t.ticketId}</Text>
              <Badge>{t.status}</Badge>
            </View>
            <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
            <View style={styles.metaRow}>
              <Meta icon="tag" text={t.category} />
              <Meta icon="home" text={`${t.blockName || t.blockId} · ${t.apartmentNumber || t.apartmentId}`} />
              <Meta icon="clock" text={ago(t.createdAt)} />
            </View>
            {t.assignedTechnicianName ? <Text style={styles.assigned}>Assigned to {t.assignedTechnicianName}</Text> : null}
          </Card>
        ))}
        <View style={{ height: 70 }} />
      </Screen>
      {canRaise ? (
        <Pressable onPress={() => { tap(); router.push('/tickets/new'); }} style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]}>
          <Feather name="plus" size={20} color={colors.ink} />
          <Text style={styles.fabText}>New request</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Meta({ icon, text }) {
  if (!text) return null;
  return <View style={styles.meta}><Feather name={icon} size={12} color={colors.faint} /><Text style={styles.metaText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  id: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.2, color: colors.brassDeep },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  assigned: { fontFamily: fonts.semibold, fontSize: 12, color: colors.info, marginTop: 8 },
  fab: { position: 'absolute', right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 50, borderRadius: radius.pill, backgroundColor: colors.brassLight, ...shadow.lift },
  fabText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.ink },
});
