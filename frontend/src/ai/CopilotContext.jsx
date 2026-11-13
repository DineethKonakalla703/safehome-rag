import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { getAgentSession, getAgentStatus, streamAgentTurn } from './agentApi';
import { useVoice } from './useVoice';

const CopilotContext = createContext(null);
export const useCopilot = () => useContext(CopilotContext);

const SETTINGS_KEY = 'safehome_copilot_settings';
const DEFAULT_SETTINGS = { autoApprove: false, speakReplies: false, handsFree: false, briefing: true };
const readSettings = () => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return DEFAULT_SETTINGS; } };
const sessionKey = (userId) => `safehome_copilot_session_${userId}`;

const YES = /^(yes|yeah|yep|sure|ok(ay)?|confirm(ed)?|approve(d)?|go ahead|do it|proceed)\b/i;
const NO = /^(no|nope|cancel|stop|decline|don'?t|reject)\b/i;

let uid = 0;
const nextId = () => { uid += 1; return `m${Date.now()}${uid}`; };

export function CopilotProvider({ children }) {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(null);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(readSettings);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const sessionIdRef = useRef(user ? localStorage.getItem(sessionKey(user.userId)) : null);
  const abortRef = useRef(null);
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const inputRef = useRef(null);
  const sendRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const updateSettings = useCallback((patch) => setSettings((prev) => {
    const next = { ...prev, ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  }), []);

  const pendingMessage = messages.find((m) => m.pending?.length && !m.decided);

  const voice = useVoice({
    onFinal: (text) => {
      const pending = messagesRef.current.find((m) => m.pending?.length && !m.decided);
      if (pending && YES.test(text)) { decideRef.current?.(pending.id, true, { voice: true }); return; }
      if (pending && NO.test(text)) { decideRef.current?.(pending.id, false, { voice: true }); return; }
      sendRef.current?.(text, { voice: true });
    },
  });

  // Load status + previous conversation once.
  useEffect(() => {
    if (!user) return;
    getAgentStatus().then((s) => { setEnabled(Boolean(s.enabled)); setModel(s.model); }).catch(() => setEnabled(false));
    const sid = sessionIdRef.current;
    if (sid) {
      getAgentSession(sid).then((s) => {
        setMessages((s.transcript || []).slice(-30).map((t) => ({ id: nextId(), role: t.role, text: t.text, steps: t.steps || [], built: t.built || null, status: 'done', pending: null, decided: true })));
        if (s.pending?.length) setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: 'I was waiting for your approval on this:', steps: [], status: 'done', pending: s.pending }]);
      }).catch(() => { sessionIdRef.current = null; localStorage.removeItem(sessionKey(user.userId)); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = useCallback((text) => { setToast(text); window.clearTimeout(flash.timer); flash.timer = window.setTimeout(() => setToast(null), 3200); }, []);

  const patchMessage = useCallback((id, patch) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m))), []);

  const runTurn = useCallback(async (body, { voice: fromVoice = false, userText = null, userLabel = null } = {}) => {
    if (busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev.map((m) => (m.pending?.length && !m.decided ? { ...m, decided: true } : m)),
      ...(userText || userLabel ? [{ id: nextId(), role: 'user', text: userText || userLabel, chip: Boolean(userLabel), via: fromVoice ? 'voice' : 'text' }] : []),
      { id: assistantId, role: 'assistant', text: '', steps: [], status: 'streaming', pending: null },
    ]);
    setBusy(true);
    let changed = false;
    let finalText = '';
    let awaiting = false;
    try {
      await streamAgentTurn({
        ...body,
        sessionId: sessionIdRef.current,
        autoApprove: settingsRef.current.autoApprove,
        context: { currentPath: locationRef.current, voice: fromVoice || settingsRef.current.handsFree },
      }, (event, data) => {
        if (event === 'session') { sessionIdRef.current = data.sessionId; if (user) localStorage.setItem(sessionKey(user.userId), data.sessionId); }
        else if (event === 'step') patchMessage(assistantId, (m) => { const steps = m.steps.filter((s) => s.id !== data.id); return { steps: [...steps, data] }; });
        else if (event === 'text') { finalText = finalText ? `${finalText}\n\n${data.text}` : data.text; patchMessage(assistantId, { text: finalText }); }
        else if (event === 'navigate') { navigate(data.path, { state: { aiHighlight: data.highlight || null } }); flash(`Copilot opened ${data.path}`); }
        else if (event === 'changed') changed = true;
        else if (event === 'built') patchMessage(assistantId, { built: data });
        else if (event === 'confirm') { awaiting = true; patchMessage(assistantId, { pending: data.items }); }
        else if (event === 'error') patchMessage(assistantId, { status: 'error', error: data.message });
      }, controller.signal);
      patchMessage(assistantId, (m) => ({ status: m.status === 'error' ? 'error' : 'done' }));
    } catch (error) {
      if (error.name !== 'AbortError') patchMessage(assistantId, { status: 'error', error: error.message });
      else patchMessage(assistantId, { status: 'done', text: finalText || 'Stopped.' });
    } finally {
      setBusy(false);
      if (changed) { setRefreshKey((k) => k + 1); window.dispatchEvent(new Event('safehome:data-change')); }
    }
    const s = settingsRef.current;
    const shouldSpeak = fromVoice || s.speakReplies || s.handsFree;
    const spokenText = awaiting ? `${finalText} I need your approval. Say yes to go ahead, or no to cancel.` : finalText;
    if (shouldSpeak && spokenText) {
      voice.speak(spokenText, { onEnd: () => { if (s.handsFree || (fromVoice && awaiting)) voice.start(); } });
    }
  }, [busy, flash, navigate, patchMessage, user, voice]);

  const send = useCallback((text, { voice: fromVoice = false } = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    setOpen(true);
    runTurn({ message: clean }, { voice: fromVoice, userText: clean });
  }, [runTurn]);
  sendRef.current = send;

  const decideRef = useRef(null);
  const decide = useCallback((messageId, approved, { voice: fromVoice = false, only } = {}) => {
    const target = messagesRef.current.find((m) => m.id === messageId);
    if (!target?.pending?.length) return;
    const decisions = target.pending.map((item) => ({ id: item.id, approved: only ? item.id === only && approved : approved }));
    patchMessage(messageId, { decided: true, decisions });
    runTurn({ decisions }, { voice: fromVoice, userLabel: approved ? 'Approved' : 'Declined' });
  }, [patchMessage, runTurn]);
  decideRef.current = decide;

  const briefing = useCallback(() => { setOpen(true); runTurn({ kind: 'briefing' }, { userLabel: 'Start-of-session briefing', voice: settingsRef.current.handsFree }); }, [runTurn]);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    sessionIdRef.current = null;
    if (user) localStorage.removeItem(sessionKey(user.userId));
    setMessages([]);
    voice.stopSpeaking();
  }, [user, voice]);

  const stop = useCallback(() => { abortRef.current?.abort(); voice.stopSpeaking(); voice.stop(); }, [voice]);

  // Automatic start-of-session briefing (once per login/browser session).
  useEffect(() => {
    if (!enabled || !user || !settings.briefing) return;
    const key = `safehome_copilot_briefed_${user.userId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    newConversation();
    const timer = window.setTimeout(() => briefing(), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Global shortcuts: Ctrl/Cmd+K opens the copilot, Alt+V talks to it.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 60);
      } else if (event.altKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        setOpen(true);
        if (voice.listening) voice.stop(); else voice.start();
      } else if (event.key === 'Escape' && voice.listening) voice.stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice]);

  const value = useMemo(() => ({
    user, open, setOpen, enabled, model, messages, busy, settings, updateSettings, send, decide, briefing, newConversation, stop,
    voice, refreshKey, toast, inputRef, pendingMessage,
  }), [user, open, enabled, model, messages, busy, settings, updateSettings, send, decide, briefing, newConversation, stop, voice, refreshKey, toast, pendingMessage]);

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}
