import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card, ErrorNote, ListItem, Loading, Screen, SectionHeader, Stat, ago, inr, tap, useResource } from '../../components/ui';
import { tryApi } from '../../lib/api';
import { MANAGERS, ROLE_LABELS, useAuth } from '../../lib/auth';
import { colors, fonts, radius, shadow } from '../../theme';

const OPEN = ['New', 'Assigned', 'In Progress'];
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

async function loadHome(user) {
  const role = user.role;
  const [tickets, sos, notifications] = await Promise.all([
    role === 'SECURITY' ? null : tryApi('/tickets'),
    tryApi('/sos'),
    tryApi('/notifications'),
  ]);
  const extra = {};
  if (role === 'RESIDENT') {
    Object.assign(extra, { dash: await tryApi(`/dashboard/resident/${user.userId}`), parcels: await tryApi('/parcels') });
  } else if (role === 'MAIN_ADMIN') {
    extra.dash = await tryApi('/dashboard/main-admin');
  } else if (role === 'BLOCK_SUB_ADMIN') {
    extra.dash = await tryApi(`/dashboard/block-admin/${user.blockId}`);
  } else if (role === 'SECURITY') {
    const [visitors, parcels, staff] = await Promise.all([tryApi('/visitors'), tryApi('/parcels'), tryApi('/staff')]);
    Object.assign(extra, { visitors, parcels, staff });
  } else if (role === 'FACILITY_MANAGER') {
    extra.maintenance = await tryApi('/maintenance');
  }
  return { tickets: tickets || [], sos: sos || [], notifications: notifications || [], ...extra };
}

export default function Home() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, reload, error } = useResource(() => loadHome(user), [user.userId]);
  const unread = (data?.notifications || []).filter((n) => !n.read).length;
  const activeSos = (data?.sos || []).filter((a) => a.status === 'Active' || a.status === 'Acknowledged');

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={reload}>
      <LinearGradient colors={[colors.ink, '#172A4C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 18 }]}>
        <View style={styles.heroTop}>
          <Image source={require('../../../assets/mark-reversed.png')} style={{ width: 30, height: 30 }} />
          <Pressable onPress={() => { tap(); router.push('/notifications'); }} style={styles.bell} hitSlop={8}>
            <Feather name="bell" size={19} color={colors.onInk} />
            {unread ? <View style={styles.bellDot}><Text style={styles.bellDotText}>{unread > 9 ? '9+' : unread}</Text></View> : null}
          </Pressable>
        </View>
        <Text style={styles.hello}>{greeting()},</Text>
        <Text style={styles.name}>{String(user.name || '').split(' ')[0]}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{ROLE_LABELS[user.role]}</Text>
          {user.apartmentId ? <><View style={styles.metaDot} /><Text style={styles.meta}>Apartment {user.apartmentId}</Text></> : null}
          {user.blockId && !user.apartmentId ? <><View style={styles.metaDot} /><Text style={styles.meta}>{user.blockId}</Text></> : null}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {activeSos.length ? (
          <Card onPress={() => router.push('/sos')} style={styles.sosLive}>
            <View style={styles.sosPulse}><Feather name="alert-triangle" size={18} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosLiveTitle}>{activeSos.length} active emergency alert{activeSos.length > 1 ? 's' : ''}</Text>
              <Text style={styles.sosLiveText} numberOfLines={1}>{activeSos[0].emergencyType} · {activeSos[0].location || activeSos[0].apartmentId || 'location pending'} · {activeSos[0].status}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.sos} />
          </Card>
        ) : null}

        <ErrorNote error={error} onRetry={reload} />
        {loading ? <Loading /> : data ? <RoleHome user={user} data={data} /> : null}

        {user.role === 'RESIDENT' || user.role === 'SECURITY' ? (
          <Pressable onPress={() => { tap(); router.push('/sos'); }} style={({ pressed }) => [styles.sosButton, pressed && { opacity: 0.9 }]}>
            <View style={styles.sosRing}><Feather name="radio" size={18} color={colors.sos} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosButtonTitle}>Emergency SOS</Text>
              <Text style={styles.sosButtonText}>Alerts security and the management team instantly</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

function QuickActions({ items }) {
  return (
    <View style={styles.quickGrid}>
      {items.map((q) => (
        <Pressable key={q.label} onPress={() => { tap(); router.push(q.href); }} style={({ pressed }) => [styles.quick, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={styles.quickIcon}><Feather name={q.icon} size={18} color={colors.brassDeep} /></View>
          <Text style={styles.quickLabel}>{q.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TicketList({ tickets, title = 'Recent requests', empty = 'Nothing open right now.' }) {
  return (
    <>
      <SectionHeader title={title} action={tickets.length ? 'View all' : null} onAction={() => router.push('/requests')} />
      <Card style={{ paddingVertical: 4 }}>
        {tickets.length ? tickets.slice(0, 4).map((t, i, arr) => (
          <ListItem key={t.ticketId} icon="tool" tone={t.priority === 'Critical' || t.priority === 'High' ? 'danger' : 'brass'} title={t.title}
            subtitle={`${t.ticketId} · ${t.category} · ${ago(t.createdAt)}`} right={<Badge>{t.status}</Badge>}
            onPress={() => router.push(`/tickets/${t.ticketId}`)} last={i === arr.length - 1} />
        )) : <Text style={styles.emptyLine}>{empty}</Text>}
      </Card>
    </>
  );
}

function RoleHome({ user, data }) {
  const open = data.tickets.filter((t) => OPEN.includes(t.status));
  const s = data.dash?.summary || {};

  if (user.role === 'RESIDENT') {
    const waiting = (data.parcels || []).filter((p) => p.status === 'At Gate');
    return (
      <>
        <View style={styles.stats}>
          <Stat label="Open requests" value={s.openTickets ?? open.length} icon="tool" onPress={() => router.push('/requests')} />
          <Stat label="Dues pending" value={inr(s.pendingAmount)} icon="credit-card" tone={s.pendingAmount ? 'warning' : 'success'} onPress={() => router.push('/bills')} />
        </View>
        {waiting.length ? (
          <Card accent={colors.brass} onPress={() => router.push('/gate')} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Feather name="package" size={20} color={colors.brassDeep} />
              <View style={{ flex: 1 }}>
                <Text style={styles.parcelTitle}>{waiting.length} parcel{waiting.length > 1 ? 's' : ''} waiting at the gate</Text>
                <Text style={styles.parcelText}>Pickup code {waiting[0].pickupCode} · {waiting[0].courier}</Text>
              </View>
            </View>
          </Card>
        ) : null}
        <SectionHeader title="Quick actions" />
        <QuickActions items={[
          { label: 'Raise request', icon: 'plus-circle', href: '/tickets/new' },
          { label: 'Invite guest', icon: 'user-plus', href: '/gate' },
          { label: 'Pay dues', icon: 'credit-card', href: '/bills' },
          { label: 'Events', icon: 'calendar', href: '/events' },
          { label: 'Polls', icon: 'check-square', href: '/polls' },
          { label: 'Community', icon: 'message-square', href: '/forum' },
        ]} />
        <TicketList tickets={data.dash?.recentTickets?.length ? data.dash.recentTickets : data.tickets} empty="No requests yet. Raise one in seconds." />
      </>
    );
  }

  if (user.role === 'SECURITY') {
    const visitors = data.visitors || [];
    const inside = visitors.filter((v) => v.status === 'Inside').length;
    const expected = visitors.filter((v) => v.status === 'Approved' || v.status === 'Pending').length;
    const parcels = (data.parcels || []).filter((p) => p.status === 'At Gate').length;
    const staffIn = (data.staff || []).filter((p) => p.insideNow).length;
    return (
      <>
        <View style={styles.stats}>
          <Stat label="Visitors inside" value={inside} icon="users" tone="info" onPress={() => router.push('/gate')} />
          <Stat label="Expected" value={expected} icon="clock" tone="warning" onPress={() => router.push('/gate')} />
          <Stat label="Parcels at gate" value={parcels} icon="package" onPress={() => router.push('/gate')} />
          <Stat label="Staff on premises" value={staffIn} icon="briefcase" tone="success" onPress={() => router.push('/staff')} />
        </View>
        <SectionHeader title="At the gate" />
        <QuickActions items={[
          { label: 'Verify pass', icon: 'check-circle', href: '/gate' },
          { label: 'Log parcel', icon: 'package', href: '/gate' },
          { label: 'Staff entry', icon: 'log-in', href: '/staff' },
        ]} />
      </>
    );
  }

  if (user.role === 'TECHNICIAN') {
    const mine = data.tickets;
    return (
      <>
        <View style={styles.stats}>
          <Stat label="Assigned to me" value={mine.filter((t) => t.status === 'Assigned').length} icon="inbox" tone="info" onPress={() => router.push('/requests')} />
          <Stat label="In progress" value={mine.filter((t) => t.status === 'In Progress').length} icon="activity" tone="warning" onPress={() => router.push('/requests')} />
        </View>
        <TicketList tickets={open} title="Your jobs" empty="No open jobs. Enjoy the quiet." />
      </>
    );
  }

  if (user.role === 'FACILITY_MANAGER') {
    const m = data.maintenance || [];
    const due = m.filter((x) => x.dueState === 'Overdue' || x.dueState === 'Due Soon');
    return (
      <>
        <View style={styles.stats}>
          <Stat label="Open requests" value={open.length} icon="tool" onPress={() => router.push('/requests')} />
          <Stat label="Service due" value={due.length} icon="calendar" tone={due.some((x) => x.dueState === 'Overdue') ? 'danger' : 'warning'} onPress={() => router.push('/maintenance')} />
        </View>
        <SectionHeader title="Manage" />
        <QuickActions items={[
          { label: 'Maintenance', icon: 'settings', href: '/maintenance' },
          { label: 'Accounts', icon: 'pie-chart', href: '/accounts' },
          { label: 'Staff', icon: 'briefcase', href: '/staff' },
        ]} />
        <TicketList tickets={open} title="Open requests" />
      </>
    );
  }

  // Admins
  return (
    <>
      <View style={styles.stats}>
        <Stat label="Open requests" value={s.openTickets ?? open.length} icon="tool" onPress={() => router.push('/requests')} />
        <Stat label="High risk" value={s.highRiskTickets ?? 0} icon="alert-triangle" tone="danger" onPress={() => router.push('/requests')} />
        <Stat label="Bills pending" value={s.pendingBills ?? 0} icon="file-text" tone="warning" onPress={() => router.push('/bills')} />
        <Stat label={user.role === 'MAIN_ADMIN' ? 'Residents' : 'SLA at risk'} value={user.role === 'MAIN_ADMIN' ? s.totalResidents ?? 0 : s.slaRiskTickets ?? 0} icon="users" tone="info" />
      </View>
      {MANAGERS.includes(user.role) ? (
        <>
          <SectionHeader title="Manage" />
          <QuickActions items={[
            { label: 'Move requests', icon: 'truck', href: '/move' },
            { label: 'Accounts', icon: 'pie-chart', href: '/accounts' },
            { label: 'Notices', icon: 'volume-2', href: '/notices' },
            { label: 'Polls', icon: 'check-square', href: '/polls' },
            { label: 'Maintenance', icon: 'settings', href: '/maintenance' },
            { label: 'Ask Copilot', icon: 'message-circle', href: '/copilot' },
          ]} />
        </>
      ) : null}
      <TicketList tickets={data.dash?.recentTickets?.length ? data.dash.recentTickets : open} />
    </>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 22, paddingBottom: 44, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bellDot: { position: 'absolute', top: 4, right: 3, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.brassLight, alignItems: 'center', justifyContent: 'center' },
  bellDotText: { fontFamily: fonts.heavy, fontSize: 9.5, color: colors.ink },
  hello: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.brassLight },
  name: { fontFamily: fonts.display, fontSize: 34, color: colors.onInk, letterSpacing: -0.5, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  meta: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onInkMuted },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.brass },
  body: { paddingHorizontal: 18, marginTop: -24 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quick: { flexBasis: '30%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 16, alignItems: 'center', gap: 9, ...shadow.card },
  quickIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brassSoft, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.text, textAlign: 'center' },
  emptyLine: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, paddingVertical: 16, textAlign: 'center' },
  parcelTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.text },
  parcelText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  sosLive: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, borderColor: '#F3C4C4', backgroundColor: '#FFF7F7' },
  sosPulse: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.sos, alignItems: 'center', justifyContent: 'center' },
  sosLiveTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.sos },
  sosLiveText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textSoft, marginTop: 2 },
  sosButton: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22, padding: 16, borderRadius: radius.lg, backgroundColor: colors.sos, ...shadow.lift, shadowColor: colors.sos },
  sosRing: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sosButtonTitle: { fontFamily: fonts.heavy, fontSize: 15, color: '#fff', letterSpacing: 0.2 },
  sosButtonText: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
