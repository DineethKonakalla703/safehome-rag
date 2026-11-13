import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Chips, Empty, ErrorNote, Loading, Row, Screen, T, fmtDate, inr, useResource } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

export default function Bills() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('Pending');
  const { data, loading, error, reload, refreshing } = useResource(() => api('/bills'), [user.userId]);
  const bills = (data || []).sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
  const pending = bills.filter((b) => b.paymentStatus === 'Pending');
  const due = pending.reduce((n, b) => n + (b.totalAmount || 0) + (b.lateFee || 0), 0);
  const list = filter === 'All' ? bills : bills.filter((b) => b.paymentStatus === filter);
  const overdue = (b) => b.paymentStatus === 'Pending' && b.dueDate && new Date(b.dueDate) < new Date();

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Card style={styles.total}>
        <T.label style={{ color: colors.brassLight }}>{user.role === 'RESIDENT' ? 'Outstanding' : 'Outstanding across your scope'}</T.label>
        <Text style={styles.amount}>{inr(due)}</Text>
        <Text style={styles.sub}>{pending.length ? `${pending.length} bill${pending.length > 1 ? 's' : ''} pending · ${pending.filter(overdue).length} overdue` : 'You\'re all settled.'}</Text>
      </Card>
      <Chips options={['Pending', 'Paid', 'All']} value={filter} onChange={setFilter} />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Loading /> : !list.length ? <Empty icon="file-text" title="No bills here" /> : list.map((b) => (
        <Card key={b.billId} style={{ marginBottom: 10 }} accent={overdue(b) ? colors.danger : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T.title>{b.billType === 'Monthly' ? `Maintenance · ${b.billingMonth || ''}` : `Repair · ${b.ticketId}`}</T.title>
              <T.muted>{b.billId}{user.role !== 'RESIDENT' ? ` · ${b.residentName || b.residentId} · ${b.apartmentId}` : ''}</T.muted>
            </View>
            <Text style={styles.billAmt}>{inr((b.totalAmount || 0) + (b.lateFee || 0))}</Text>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <Badge tone={overdue(b) ? 'danger' : undefined}>{overdue(b) ? 'Overdue' : b.paymentStatus}</Badge>
            <T.muted>{b.paymentStatus === 'Paid' ? `Paid ${fmtDate(b.paidAt)}` : b.dueDate ? `Due ${fmtDate(b.dueDate)}` : ''}</T.muted>
          </Row>
        </Card>
      ))}
      {pending.length && user.role === 'RESIDENT' ? <T.muted style={{ textAlign: 'center', marginTop: 8 }}>Online payment is available on the SafeHome web portal.</T.muted> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { backgroundColor: colors.ink2, borderColor: colors.ink2, marginBottom: 16, marginTop: 6 },
  amount: { fontFamily: fonts.display, fontSize: 38, color: colors.onInk, marginTop: 6, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.onInkMuted, marginTop: 4 },
  billAmt: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
});
