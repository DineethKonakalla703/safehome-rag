import { Badge, Card, Empty, ErrorNote, Loading, Row, Screen, T, ago, useResource } from '../components/ui';
import { api } from '../lib/api';

export default function Notices() {
  const { data, loading, error, reload, refreshing } = useResource(() => api('/notices'));
  const list = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Loading /> : !list.length ? <Empty icon="volume-2" title="No notices" message="Announcements from the society office will appear here." /> : list.map((n) => (
        <Card key={n.noticeId} style={{ marginBottom: 12, marginTop: 4 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Badge tone="brass">{n.targetType === 'Block' ? n.blockId : 'Whole community'}</Badge>
            <T.muted>{ago(n.createdAt)}</T.muted>
          </Row>
          <T.display style={{ fontSize: 20, marginBottom: 6 }}>{n.title}</T.display>
          <T.body>{n.message}</T.body>
        </Card>
      ))}
    </Screen>
  );
}
