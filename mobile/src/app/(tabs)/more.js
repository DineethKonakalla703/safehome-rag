import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, ListItem, PageTitle, Screen, SectionHeader } from '../../components/ui';
import { API_URL } from '../../lib/api';
import { ROLE_LABELS, useAuth } from '../../lib/auth';
import { colors, fonts } from '../../theme';

const ALL = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT', 'TECHNICIAN', 'SECURITY', 'FACILITY_MANAGER'];
const SECTIONS = [
  {
    title: 'Home & money',
    items: [
      { href: '/bills', icon: 'credit-card', label: 'Bills & dues', sub: 'Maintenance and repair bills', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'] },
      { href: '/accounts', icon: 'pie-chart', label: 'Society accounts', sub: 'Income, expenses and balance', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT'] },
      { href: '/move', icon: 'truck', label: 'Move in / out', sub: 'Schedule and approvals', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
      { href: '/staff', icon: 'briefcase', label: 'Staff & domestic help', sub: 'Passes and attendance', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY', 'FACILITY_MANAGER'] },
      { href: '/parcels', icon: 'package', label: 'Parcels', sub: 'Deliveries held at the gate', roles: ['RESIDENT', 'SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
      { href: '/maintenance', icon: 'settings', label: 'Preventive maintenance', sub: 'Service schedules and AMCs', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'] },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/notices', icon: 'volume-2', label: 'Notices', sub: 'Announcements from the office', roles: ALL },
      { href: '/events', icon: 'calendar', label: 'Events', sub: 'RSVP to what\'s on', roles: ALL },
      { href: '/polls', icon: 'check-square', label: 'Polls & voting', sub: 'Have your say', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'SECURITY'] },
      { href: '/forum', icon: 'message-square', label: 'Forum & marketplace', sub: 'Discuss, buy, sell, recommend', roles: ALL },
    ],
  },
  {
    title: 'Safety',
    items: [
      { href: '/sos', icon: 'alert-octagon', label: 'Emergency SOS', sub: 'Raise or respond to alerts', roles: ALL, tone: 'danger' },
      { href: '/notifications', icon: 'bell', label: 'Notifications', sub: 'Everything sent to you', roles: ALL },
    ],
  },
];

export default function More() {
  const { user, signOut } = useAuth();
  const initials = String(user.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Screen header={<PageTitle eyebrow="SafeHome" title="More" />}>
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{ROLE_LABELS[user.role]}{user.apartmentId ? ` · ${user.apartmentId}` : ''}{user.blockId ? ` · ${user.blockId}` : ''}</Text>
          <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
        </View>
      </Card>

      {SECTIONS.map((section) => {
        const items = section.items.filter((i) => i.roles.includes(user.role));
        if (!items.length) return null;
        return (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            <Card style={{ paddingVertical: 2 }}>
              {items.map((i, idx) => <ListItem key={i.href} icon={i.icon} tone={i.tone || 'brass'} title={i.label} subtitle={i.sub} onPress={() => router.push(i.href)} last={idx === items.length - 1} />)}
            </Card>
          </View>
        );
      })}

      <Button title="Sign out" icon="log-out" variant="secondary" onPress={async () => { await signOut(); router.replace('/login'); }} style={{ marginTop: 26 }} />
      <Text style={styles.foot}>SafeHome Residences · v1.0{'\n'}{API_URL.replace(/^https?:\/\//, '')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink2, borderColor: colors.ink2 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.brassLight },
  avatarText: { fontFamily: fonts.display, fontSize: 20, color: colors.brassLight },
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.onInk },
  meta: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.brassLight, marginTop: 2 },
  email: { fontFamily: fonts.body, fontSize: 12.5, color: colors.onInkMuted, marginTop: 2 },
  foot: { fontFamily: fonts.body, fontSize: 11.5, color: colors.faint, textAlign: 'center', marginTop: 18, lineHeight: 17 },
});
