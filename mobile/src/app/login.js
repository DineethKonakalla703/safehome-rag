import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorNote, Field, tap } from '../components/ui';
import { API_URL } from '../lib/api';
import { useAuth } from '../lib/auth';
import { colors, fonts, radius } from '../theme';

// Seeded demo accounts — local development only.
const DEMO = [
  { label: 'Resident', email: 'resident1@safehome.com' },
  { label: 'Security', email: 'security@safehome.com' },
  { label: 'Technician', email: 'technician@safehome.com' },
  { label: 'Facility', email: 'facility@safehome.com' },
  { label: 'Admin', email: 'admin@safehome.com' },
];

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!email || !password) return setError(new Error('Enter your email and password.'));
    setBusy(true); setError(null);
    try { await signIn(email, password); router.replace('/home'); }
    catch (e) { setError(e); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={[colors.ink, '#17284A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View style={styles.gridLine} />
          <Image source={require('../../assets/mark-reversed.png')} style={styles.mark} />
          <Text style={styles.kicker}>SAFEHOME · RESIDENCES</Text>
          <Text style={styles.headline}>Your home,{'\n'}<Text style={styles.headlineEm}>quietly</Text> looked after.</Text>
          <Text style={styles.lede}>Requests, visitors, parcels, dues and your community — in one calm place.</Text>
        </LinearGradient>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sign in</Text>
          <Text style={styles.panelSub}>Use the account your society office created for you.</Text>
          <ErrorNote error={error} />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@residence.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
          <Button title="Continue" icon="arrow-right" onPress={submit} loading={busy} style={{ marginTop: 4 }} />

          {__DEV__ ? (
            <View style={styles.demo}>
              <Text style={styles.demoLabel}>Demo accounts</Text>
              <View style={styles.demoRow}>
                {DEMO.map((d) => (
                  <Pressable key={d.email} onPress={() => { tap(); setEmail(d.email); setPassword('Demo@123'); setError(null); }}
                    style={({ pressed }) => [styles.demoChip, email === d.email && styles.demoChipOn, pressed && { opacity: 0.8 }]}>
                    <Text style={[styles.demoChipText, email === d.email && { color: colors.onInk }]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.foot}>
            <Feather name="shield" size={13} color={colors.faint} />
            <Text style={styles.footText} numberOfLines={1}>Secured session · {API_URL.replace(/^https?:\/\//, '')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 26, paddingBottom: 56, overflow: 'hidden' },
  gridLine: { position: 'absolute', right: -60, top: 40, width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(201,164,92,0.18)' },
  mark: { width: 52, height: 52, marginBottom: 26 },
  kicker: { fontFamily: fonts.heavy, fontSize: 10.5, letterSpacing: 2.6, color: colors.brassLight, marginBottom: 14 },
  headline: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42, color: colors.onInk, letterSpacing: -0.6 },
  headlineEm: { fontFamily: fonts.displayItalic, color: colors.brassLight },
  lede: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.onInkMuted, marginTop: 14, maxWidth: 340 },
  panel: { flex: 1, marginTop: -26, backgroundColor: colors.ivory, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 30 },
  panelTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  panelSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 20 },
  demo: { marginTop: 26, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
  demoLabel: { fontFamily: fonts.heavy, fontSize: 10.5, letterSpacing: 1.8, color: colors.brassDeep, textTransform: 'uppercase', marginBottom: 10 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  demoChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  demoChipOn: { backgroundColor: colors.ink2, borderColor: colors.ink2 },
  demoChipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSoft },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 26 },
  footText: { fontFamily: fonts.body, fontSize: 12, color: colors.faint },
});
