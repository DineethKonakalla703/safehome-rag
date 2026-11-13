import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Markdown } from '../../components/Markdown';
import { Button, tap } from '../../components/ui';
import { mapWebPath, streamAgentTurn } from '../../lib/agent';
import { useAuth } from '../../lib/auth';
import { colors, fonts, radius } from '../../theme';

const SUGGESTIONS = {
  RESIDENT: ['What do I owe this month?', 'My kitchen tap is leaking', 'Invite a guest for tomorrow evening', 'Any parcels for me?'],
  SECURITY: ['Who is inside right now?', 'Parcels still at the gate', 'Expected visitors today', 'Active SOS alerts'],
  TECHNICIAN: ['What jobs are assigned to me?', 'Which job is most urgent?', 'Summarise my open work'],
  FACILITY_MANAGER: ['What maintenance is overdue?', 'AMC contracts expiring soon', 'Open high-priority tickets'],
  MAIN_ADMIN: ['Give me a briefing', 'Pending move-out requests', 'Bills overdue this month', 'High-risk tickets'],
  BLOCK_SUB_ADMIN: ['Give me a briefing for my block', 'Pending approvals', 'Open tickets in my block'],
};

let nextId = 1;

export default function Copilot() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [speak, setSpeak] = useState(false);
  const sessionId = useRef(null);
  const streamRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => () => { streamRef.current?.abort(); Speech.stop(); }, []);

  const patch = (id, fn) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...(typeof fn === 'function' ? fn(m) : fn) } : m)));

  const runTurn = useCallback(async (body, userLabel) => {
    if (busy) return;
    const aid = nextId++;
    setMessages((prev) => [
      ...prev.map((m) => (m.pending?.length && !m.decided ? { ...m, decided: true } : m)),
      ...(userLabel ? [{ id: nextId++, role: 'user', text: userLabel }] : []),
      { id: aid, role: 'assistant', text: '', steps: [], status: 'streaming', links: [] },
    ]);
    setBusy(true); Speech.stop();
    let finalText = ''; let awaiting = false;
    const stream = streamAgentTurn({ ...body, sessionId: sessionId.current, context: { currentPath: '/mobile', client: 'mobile' } }, (event, data) => {
      if (event === 'session') sessionId.current = data.sessionId;
      else if (event === 'step') patch(aid, (m) => ({ steps: [...m.steps.filter((s) => s.id !== data.id), data] }));
      else if (event === 'text') { finalText = finalText ? `${finalText}\n\n${data.text}` : data.text; patch(aid, { text: finalText }); }
      else if (event === 'navigate') { const to = mapWebPath(data.path); if (to) patch(aid, (m) => ({ links: [...m.links.filter((l) => l !== to), to] })); }
      else if (event === 'built') patch(aid, { built: data });
      else if (event === 'confirm') { awaiting = true; patch(aid, { pending: data.items }); }
      else if (event === 'error') patch(aid, { status: 'error', error: data.message });
    });
    streamRef.current = stream;
    try { await stream.done; patch(aid, (m) => ({ status: m.status === 'error' ? 'error' : 'done' })); }
    catch (e) { patch(aid, { status: 'error', error: e.message }); }
    finally { setBusy(false); }
    if (speak && finalText) Speech.speak(awaiting ? `${finalText} I need your approval before I go ahead.` : finalText, { language: 'en-IN', rate: 1.0 });
  }, [busy, speak]);

  const send = (text) => { const t = String(text || input).trim(); if (!t) return; setInput(''); tap(); runTurn({ message: t }, t); };
  const decide = (msg, approved, only) => {
    const decisions = msg.pending.map((item) => ({ id: item.id, approved: only ? item.id === only && approved : approved }));
    patch(msg.id, { decided: true, decisions });
    runTurn({ decisions }, approved ? 'Approved' : 'Declined');
  };
  const reset = () => { streamRef.current?.abort(); Speech.stop(); sessionId.current = null; setMessages([]); };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ivory }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headIcon}><Feather name="feather" size={17} color={colors.brassLight} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headTitle}>Copilot</Text>
          <Text style={styles.headSub}>Asks before it changes anything</Text>
        </View>
        <Pressable onPress={() => { tap(); setSpeak((s) => { if (s) Speech.stop(); return !s; }); }} style={[styles.headBtn, speak && styles.headBtnOn]} hitSlop={6}>
          <Feather name={speak ? 'volume-2' : 'volume-x'} size={17} color={speak ? colors.ink : colors.onInk} />
        </Pressable>
        <Pressable onPress={() => { tap(); reset(); }} style={styles.headBtn} hitSlop={6}><Feather name="rotate-ccw" size={16} color={colors.onInk} /></Pressable>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {!messages.length ? (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>How can I help, <Text style={{ fontFamily: fonts.displayItalic, color: colors.brassDeep }}>{String(user.name || '').split(' ')[0]}</Text>?</Text>
            <Text style={styles.welcomeText}>Ask in plain words. I can look things up, raise requests, invite guests and more — and I’ll check with you before changing anything.</Text>
            <View style={{ gap: 8, marginTop: 18 }}>
              {(SUGGESTIONS[user.role] || SUGGESTIONS.RESIDENT).map((s) => (
                <Pressable key={s} onPress={() => send(s)} style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.brassSoft }]}>
                  <Feather name="corner-down-right" size={14} color={colors.brass} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : messages.map((m) => (m.role === 'user' ? (
          <View key={m.id} style={styles.userBubble}><Text style={styles.userText}>{m.text}</Text></View>
        ) : (
          <View key={m.id} style={styles.aiBlock}>
            {m.steps.length ? (
              <View style={styles.steps}>
                {m.steps.map((s) => (
                  <View key={s.id} style={styles.stepRow}>
                    {s.status === 'running' ? <ActivityIndicator size="small" color={colors.brass} style={{ transform: [{ scale: 0.7 }] }} />
                      : <Feather name={s.status === 'error' ? 'x-circle' : s.status === 'declined' ? 'slash' : 'check-circle'} size={13} color={s.status === 'error' ? colors.danger : s.status === 'declined' ? colors.faint : colors.success} />}
                    <Text style={styles.stepText} numberOfLines={2}>{s.label}{s.status === 'error' && s.error ? ` — ${s.error}` : ''}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {m.text ? <Markdown text={m.text} /> : m.status === 'streaming' && !m.steps.length ? <Text style={styles.thinking}>Thinking…</Text> : null}
            {m.built ? (
              <View style={styles.built}>
                <Text style={styles.builtTitle}>{m.built.total} records created{m.built.failed ? ` · ${m.built.failed} failed` : ''}</Text>
                <Text style={styles.builtText}>{Object.entries(m.built.byResource || {}).map(([r, c]) => `${c} ${r.replace(/-/g, ' ')}`).join(' · ')}</Text>
              </View>
            ) : null}
            {m.pending?.length ? (
              <View style={styles.confirm}>
                <Text style={styles.confirmTitle}>{m.decided ? (m.decisions?.some((d) => d.approved) ? 'Approved' : 'Declined') : 'Needs your approval'}</Text>
                {m.pending.map((item) => (
                  <View key={item.id} style={styles.confirmItem}>
                    <Feather name={item.destructive ? 'alert-triangle' : 'edit-3'} size={14} color={item.destructive ? colors.danger : colors.brassDeep} />
                    <Text style={styles.confirmText}>{item.label}{item.plan ? ` — ${item.plan.total} records` : ''}</Text>
                  </View>
                ))}
                {!m.decided ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Button small title="Decline" variant="secondary" onPress={() => decide(m, false)} style={{ flex: 1 }} />
                    <Button small title={m.pending.length > 1 ? 'Approve all' : 'Approve'} icon="check" onPress={() => decide(m, true)} style={{ flex: 1.3 }} disabled={busy} />
                  </View>
                ) : null}
              </View>
            ) : null}
            {m.links?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {m.links.map((l) => (
                  <Pressable key={l} onPress={() => { tap(); router.push(l); }} style={styles.link}>
                    <Text style={styles.linkText}>Open {l.replace('/', '').replace(/\//g, ' › ') || 'home'}</Text>
                    <Feather name="arrow-up-right" size={13} color={colors.brassDeep} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            {m.status === 'error' ? <Text style={styles.err}>{m.error || 'Something went wrong.'}</Text> : null}
          </View>
        )))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask or tell SafeHome…" placeholderTextColor={colors.faint} style={styles.input}
          multiline maxLength={2000} onSubmitEditing={() => send()} blurOnSubmit={false} returnKeyType="send" />
        <Pressable onPress={() => (busy ? streamRef.current?.abort() : send())} disabled={!busy && !input.trim()}
          style={({ pressed }) => [styles.sendBtn, !busy && !input.trim() && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}>
          <Feather name={busy ? 'square' : 'arrow-up'} size={18} color={colors.ink} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.ink },
  headIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,164,92,0.4)' },
  headTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.onInk },
  headSub: { fontFamily: fonts.body, fontSize: 12, color: colors.onInkMuted },
  headBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  headBtnOn: { backgroundColor: colors.brassLight },
  thread: { padding: 18, paddingBottom: 28, gap: 14 },
  welcome: { paddingTop: 12 },
  welcomeTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.ink, letterSpacing: -0.4 },
  welcomeText: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.muted, marginTop: 10 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  suggestionText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  userBubble: { alignSelf: 'flex-end', maxWidth: '84%', backgroundColor: colors.ink2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 5 },
  userText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.onInk, lineHeight: 20 },
  aiBlock: { alignSelf: 'stretch' },
  steps: { gap: 5, marginBottom: 8, paddingLeft: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 18 },
  stepText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  aiText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text },
  thinking: { fontFamily: fonts.displayItalic, fontSize: 15, color: colors.muted },
  built: { marginTop: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.successSoft },
  builtTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.success },
  builtText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textSoft, marginTop: 3 },
  confirm: { marginTop: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E6D6B2' },
  confirmTitle: { fontFamily: fonts.heavy, fontSize: 10.5, letterSpacing: 1.6, color: colors.brassDeep, textTransform: 'uppercase', marginBottom: 8 },
  confirmItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 3 },
  confirmText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text, lineHeight: 19 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.brassSoft },
  linkText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.brassDeep, textTransform: 'capitalize' },
  err: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger, marginTop: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 22, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.body, fontSize: 15, color: colors.text, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brassLight },
});
