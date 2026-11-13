import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Empty, ErrorNote, Loading, Screen, T, ago, useResource } from '../components/ui';
import { api } from '../lib/api';
import { colors, fonts } from '../theme';

export default function Notifications() {
  const { data, loading, error, reload, refreshing } = useResource(() => api('/notifications'));
  const unread = (data || []).filter((n) => !n.read).length;
  const markAll = async () => { try { await api('/notifications/read-all', { method: 'PATCH' }); await reload(); } catch { /* shown on next load */ } };
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ headerRight: () => (unread ? <Pressable onPress={markAll} hitSlop={10}><Text style={styles.markAll}>Mark all read</Text></Pressable> : null) }} />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Loading /> : !(data || []).length ? <Empty icon="bell" title="You're all caught up" /> : (
        <Card style={{ paddingVertical: 4, marginTop: 6 }}>
          {data.map((n, i) => (
            <View key={n.notificationId} style={[styles.row, i < data.length - 1 && styles.divider]}>
              <View style={[styles.dot, n.read && { backgroundColor: 'transparent' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, n.read && { fontFamily: fonts.semibold, color: colors.textSoft }]}>{n.title}</Text>
                <T.muted>{n.message}</T.muted>
                <Text style={styles.time}>{ago(n.createdAt)}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.brassDeep },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 13 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brass, marginTop: 6 },
  title: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text, marginBottom: 2 },
  time: { fontFamily: fonts.semibold, fontSize: 11, color: colors.faint, marginTop: 4 },
});
