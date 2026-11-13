import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, toneColors, toneFor } from '../theme';

export const tap = () => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {}); };

// ---------- Data loading ----------
export function useResource(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: null });
  const load = useCallback(async (refreshing = false) => {
    setState((s) => ({ ...s, loading: !s.data && !refreshing, refreshing, error: null }));
    try { setState({ data: await loader(), loading: false, refreshing: false, error: null }); }
    catch (error) { setState((s) => ({ ...s, loading: false, refreshing: false, error })); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: () => load(true) };
}

// ---------- Layout ----------
export function Screen({ children, refreshing = false, onRefresh, padded = true, scroll = true, header, bottomInset = true }) {
  const insets = useSafeAreaInsets();
  const content = <View style={[padded && styles.padded, { paddingBottom: bottomInset ? 32 : 0 }]}>{header}{children}</View>;
  if (!scroll) return <View style={[styles.screen, { paddingTop: 0 }]}>{content}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 12 }} keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brass} colors={[colors.brass]} /> : undefined}>
      {content}
    </ScrollView>
  );
}

// Large in-page title used by tab screens (their native header is hidden).
export function PageTitle({ eyebrow, title, subtitle, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageTitle, { paddingTop: insets.top + 14 }]}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.h1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction} hitSlop={10}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function Card({ children, style, onPress, accent, containerStyle }) {
  const body = <View style={[styles.card, accent && { borderLeftWidth: 3, borderLeftColor: accent }, style, onPress && containerStyle && { flex: 1 }]}>{children}</View>;
  if (!onPress) return containerStyle ? <View style={containerStyle}>{body}</View> : body;
  return <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [containerStyle, pressed && { opacity: 0.86, transform: [{ scale: 0.995 }] }]}>{body}</Pressable>;
}

export function Row({ children, style, gap = 10 }) { return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>; }

export const T = {
  title: (p) => <Text {...p} style={[styles.cardTitle, p.style]} />,
  body: (p) => <Text {...p} style={[styles.body, p.style]} />,
  muted: (p) => <Text {...p} style={[styles.muted, p.style]} />,
  label: (p) => <Text {...p} style={[styles.label, p.style]} />,
  display: (p) => <Text {...p} style={[styles.display, p.style]} />,
};

export function Badge({ children, tone }) {
  const [bg, fg] = toneColors[tone || toneFor(children)] || toneColors.neutral;
  return <View style={[styles.badge, { backgroundColor: bg }]}><View style={[styles.badgeDot, { backgroundColor: fg }]} /><Text style={[styles.badgeText, { color: fg }]}>{children}</Text></View>;
}

export function Button({ title, onPress, icon, variant = 'primary', disabled, loading, style, small }) {
  const v = VARIANTS[variant];
  return (
    <Pressable disabled={disabled || loading} onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => [styles.button, small && styles.buttonSmall, v.box, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}>
      {loading ? <ActivityIndicator color={v.text.color} size="small" /> : icon ? <Feather name={icon} size={small ? 14 : 16} color={v.text.color} /> : null}
      <Text style={[styles.buttonText, small && { fontSize: 13 }, v.text]}>{title}</Text>
    </Pressable>
  );
}
const VARIANTS = {
  primary: { box: { backgroundColor: colors.ink2, borderColor: colors.ink2 }, text: { color: colors.onInk } },
  secondary: { box: { backgroundColor: colors.surface, borderColor: colors.borderStrong }, text: { color: colors.ink2 } },
  brass: { box: { backgroundColor: colors.brassSoft, borderColor: '#E6D6B2' }, text: { color: colors.brassDeep } },
  danger: { box: { backgroundColor: colors.sos, borderColor: colors.sos }, text: { color: '#fff' } },
  ghost: { box: { backgroundColor: 'transparent', borderColor: 'transparent' }, text: { color: colors.brassDeep } },
};

export function Field({ label, hint, style, multiline, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.faint} {...props} multiline={multiline}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }} onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[styles.input, multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }, focused && styles.inputFocused]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips({ options, value, onChange, scroll = true }) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const inner = items.map((o) => {
    const on = o.value === value;
    return <Pressable key={o.value} onPress={() => { tap(); onChange(o.value); }} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text></Pressable>;
  });
  return scroll
    ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }} style={{ marginBottom: 14, flexGrow: 0 }}>{inner}</ScrollView>
    : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{inner}</View>;
}

export function Stat({ label, value, icon, tone = 'brass', onPress }) {
  const [bg, fg] = toneColors[tone];
  return (
    <Card style={styles.stat} onPress={onPress} containerStyle={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}><Feather name={icon} size={16} color={fg} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Card>
  );
}

export function ListItem({ icon, title, subtitle, right, onPress, tone = 'brass', last }) {
  const [bg, fg] = toneColors[tone];
  return (
    <Pressable onPress={onPress ? () => { tap(); onPress(); } : undefined} style={({ pressed }) => [styles.listItem, !last && styles.listDivider, pressed && onPress && { backgroundColor: colors.surfaceMuted }]}>
      {icon ? <View style={[styles.listIcon, { backgroundColor: bg }]}><Feather name={icon} size={17} color={fg} /></View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Feather name="chevron-right" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

export function Empty({ icon = 'inbox', title, message, action, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Feather name={icon} size={22} color={colors.brassDeep} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyText}>{message}</Text> : null}
      {action ? <Button title={action} onPress={onAction} variant="secondary" small style={{ marginTop: 14 }} /> : null}
    </View>
  );
}

export function Loading({ label = 'Loading…' }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.brass} /><Text style={styles.muted}>{label}</Text></View>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <View style={styles.errorBox}>
      <Feather name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.errorText}>{error.message || String(error)}</Text>
      {onRetry ? <Pressable onPress={onRetry} hitSlop={8}><Text style={styles.retry}>Retry</Text></Pressable> : null}
    </View>
  );
}

export function Sheet({ title, children }) {
  return <View style={styles.sheet}>{title ? <Text style={styles.sheetTitle}>{title}</Text> : null}{children}</View>;
}

// ---------- Formatters ----------
export const inr = (n) => { const v = Math.round(Number(n) || 0); return `${v < 0 ? '−' : ''}₹${Math.abs(v).toLocaleString('en-IN')}`; };
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
export const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: 18, paddingTop: 6 },
  pageTitle: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 18 },
  eyebrow: { fontFamily: fonts.heavy, fontSize: 10.5, letterSpacing: 2.2, color: colors.brassDeep, textTransform: 'uppercase', marginBottom: 6 },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 35, color: colors.ink, letterSpacing: -0.4 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.8, color: colors.muted, textTransform: 'uppercase' },
  sectionAction: { fontFamily: fonts.bold, fontSize: 13, color: colors.brassDeep },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 16, ...shadow.card },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text, lineHeight: 21 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.textSoft, lineHeight: 20 },
  muted: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  label: { fontFamily: fonts.heavy, fontSize: 10.5, letterSpacing: 1.6, color: colors.brassDeep, textTransform: 'uppercase' },
  display: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, letterSpacing: -0.3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 1 },
  buttonSmall: { minHeight: 36, paddingHorizontal: 12, borderRadius: radius.sm },
  buttonText: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.1 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textSoft, marginBottom: 7 },
  input: { minHeight: 48, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, color: colors.text },
  inputFocused: { borderColor: colors.brass, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.ink2, borderColor: colors.ink2 },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSoft },
  chipTextOn: { color: colors.onInk },
  stat: { padding: 14, gap: 4 },
  statBox: { flexGrow: 1, flexBasis: '46%' },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, letterSpacing: -0.3 },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.muted },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 2 },
  listDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  listIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  listSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2, lineHeight: 17 },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brassSoft, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, textAlign: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerSoft, marginBottom: 14 },
  errorText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.danger },
  retry: { fontFamily: fonts.heavy, fontSize: 13, color: colors.danger },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 18, marginBottom: 14, ...shadow.card },
  sheetTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: 14 },
});
