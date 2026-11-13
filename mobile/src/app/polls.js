import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Empty, ErrorNote, Loading, Row, Screen, T, fmtDate, tap, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts, radius } from '../theme';

export default function Polls() {
  const { user } = useAuth();
  const { data, loading, error, reload, refreshing } = useResource(() => api('/polls'));
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const canVote = ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const polls = (data || []).sort((a, b) => (a.status === b.status ? new Date(b.createdAt) - new Date(a.createdAt) : a.status === 'Open' ? -1 : 1));

  const vote = async (p, optionId) => {
    setBusy(p.pollId); setErr(null);
    try { await api(`/polls/${p.pollId}/vote`, { method: 'POST', body: { optionId } }); await reload(); } catch (x) { setErr(x); } finally { setBusy(null); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ErrorNote error={err || error} onRetry={reload} />
      {loading ? <Loading /> : !polls.length ? <Empty icon="check-square" title="No polls yet" /> : polls.map((p) => {
        const open = p.status === 'Open' && canVote;
        const showResults = Boolean(p.myVote) || p.status === 'Closed' || !canVote;
        return (
          <Card key={p.pollId} style={{ marginBottom: 12, marginTop: 4, opacity: busy === p.pollId ? 0.6 : 1 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Badge tone="brass">{p.kind}</Badge>
              <Badge>{p.status}</Badge>
            </Row>
            <T.display style={{ fontSize: 19 }}>{p.title}</T.display>
            {p.description ? <T.body style={{ marginTop: 6 }}>{p.description}</T.body> : null}
            <View style={{ gap: 8, marginTop: 14 }}>
              {(p.results || p.options || []).map((o) => {
                const mine = p.myVote === o.optionId;
                return (
                  <Pressable key={o.optionId} disabled={!open} onPress={() => { tap(); vote(p, o.optionId); }} style={[styles.option, mine && styles.optionMine]}>
                    {showResults ? <View style={[styles.fill, { width: `${o.percent || 0}%` }, mine && { backgroundColor: '#EADBB9' }]} /> : null}
                    <Text style={[styles.optionText, mine && { fontFamily: fonts.heavy }]}>{o.text}{mine ? '  ✓' : ''}</Text>
                    {showResults ? <Text style={styles.pct}>{o.percent || 0}%</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <T.muted style={{ marginTop: 10 }}>{p.totalVotes ?? 0} vote{p.totalVotes === 1 ? '' : 's'}{p.closesAt ? ` · closes ${fmtDate(p.closesAt)}` : ''}{p.onePerApartment ? ' · one vote per apartment' : ''}</T.muted>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: colors.surface },
  optionMine: { borderColor: colors.brass },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.surfaceMuted },
  optionText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  pct: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSoft },
});
