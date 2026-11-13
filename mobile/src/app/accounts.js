import { StyleSheet, Text, View } from 'react-native';
import { Card, ErrorNote, Loading, Row, Screen, SectionHeader, Stat, T, inr, useResource } from '../components/ui';
import { api } from '../lib/api';
import { colors, fonts } from '../theme';

export default function Accounts() {
  const { data: s, loading, error, reload, refreshing } = useResource(() => api('/accounts/summary'));
  const months = (s?.monthly || []).slice(-6);
  const peak = Math.max(1, ...months.flatMap((m) => [m.income || 0, m.expense || 0]));
  const top = (s?.byCategory || []).slice(0, 6);
  const topMax = Math.max(1, ...top.map((c) => c.total));

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <ErrorNote error={error} onRetry={reload} />
      {loading || !s ? (loading ? <Loading /> : null) : (
        <>
          <Card style={styles.balance}>
            <T.label style={{ color: colors.brassLight }}>Society balance</T.label>
            <Text style={styles.balanceAmt}>{inr(s.balance)}</Text>
            <Row gap={18} style={{ marginTop: 10 }}>
              <View><Text style={styles.k}>Income</Text><Text style={styles.v}>{inr(s.totalIncome)}</Text></View>
              <View><Text style={styles.k}>Expenses</Text><Text style={styles.v}>{inr(s.totalExpense)}</Text></View>
            </Row>
          </Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Stat label="Bills collected" value={inr(s.billsCollected)} icon="check-circle" tone="success" />
            <Stat label="Outstanding" value={inr(s.billsOutstanding)} icon="clock" tone={s.overdueBills ? 'danger' : 'warning'} />
          </View>

          {months.length ? (
            <>
              <SectionHeader title="Last months" />
              <Card>
                <View style={styles.chart}>
                  {months.map((m) => (
                    <View key={m.month} style={styles.col}>
                      <View style={styles.bars}>
                        <View style={[styles.bar, { height: `${((m.income || 0) / peak) * 100}%`, backgroundColor: colors.ink3 }]} />
                        <View style={[styles.bar, { height: `${((m.expense || 0) / peak) * 100}%`, backgroundColor: colors.brassLight }]} />
                      </View>
                      <Text style={styles.colLabel}>{String(m.month).slice(5)}</Text>
                    </View>
                  ))}
                </View>
                <Row gap={16} style={{ marginTop: 12, justifyContent: 'center' }}>
                  <Row gap={6}><View style={[styles.dot, { backgroundColor: colors.ink3 }]} /><T.muted>Income</T.muted></Row>
                  <Row gap={6}><View style={[styles.dot, { backgroundColor: colors.brassLight }]} /><T.muted>Expenses</T.muted></Row>
                </Row>
              </Card>
            </>
          ) : null}

          {top.length ? (
            <>
              <SectionHeader title="Where the money goes" />
              <Card>
                {top.map((c) => (
                  <View key={`${c.type}${c.category}`} style={{ marginBottom: 12 }}>
                    <Row style={{ justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={styles.cat}>{c.category} <Text style={styles.catType}>· {c.type}</Text></Text>
                      <Text style={styles.catAmt}>{inr(c.total)}</Text>
                    </Row>
                    <View style={styles.track}><View style={[styles.fill, { width: `${(c.total / topMax) * 100}%`, backgroundColor: c.type === 'Income' ? colors.ink3 : colors.brassLight }]} /></View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}
          <T.muted style={{ textAlign: 'center', marginTop: 14 }}>{s.entryCount} ledger entries</T.muted>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { backgroundColor: colors.ink2, borderColor: colors.ink2, marginTop: 6, marginBottom: 12 },
  balanceAmt: { fontFamily: fonts.display, fontSize: 36, color: colors.onInk, marginTop: 6, letterSpacing: -0.5 },
  k: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.onInkMuted },
  v: { fontFamily: fonts.bold, fontSize: 15, color: colors.onInk, marginTop: 2 },
  chart: { flexDirection: 'row', height: 140, alignItems: 'flex-end', justifyContent: 'space-between' },
  col: { flex: 1, alignItems: 'center', height: '100%' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 10, borderRadius: 3, minHeight: 2 },
  colLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted, marginTop: 6 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  cat: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.text },
  catType: { fontFamily: fonts.body, color: colors.faint },
  catAmt: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.text },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
