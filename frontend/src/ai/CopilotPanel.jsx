import { AlertTriangle, Bot, Building2, ChevronRight, Home, ExternalLink, LayoutGrid, Check, CheckCircle2, CircleDashed, Loader2, Mic, MicOff, Plus, Send, Settings2, Sparkles, Square, Sunrise, Volume2, VolumeX, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCopilot } from './CopilotContext';
import Markdown from './Markdown';
import { voiceInputSupported } from './useVoice';

const SUGGESTIONS = {
  MAIN_ADMIN: ['What needs my attention today?', 'Show high-severity open tickets and assign the best technician to the oldest one', 'Which tickets are at risk of breaching SLA?', 'Post a notice about the lift maintenance on Saturday', 'Create 2 communities, each with 3 blocks of 8 apartments', 'Summarise unpaid bills by block'],
  BLOCK_SUB_ADMIN: ['What needs my attention in my block?', 'List pending visitor requests', 'Which open tickets have no technician yet?', 'Post a block notice about parking repainting tomorrow'],
  RESIDENT: ['My kitchen tap is leaking, raise a complaint', 'Do I have any unpaid bills?', 'Add a visitor: Ravi, 9876543210, delivery', 'Book the clubhouse for Saturday 6-8 pm', 'What is the procedure if I smell gas?'],
  TECHNICIAN: ['What is assigned to me today?', 'Mark my in-progress work order as completed', 'How do I safely fix a tripping MCB?'],
  SECURITY: ['Show visitors waiting at the gate', 'Check in the next approved visitor', 'Who is currently inside?'],
  FACILITY_MANAGER: ['Give me an SLA risk overview', 'Which inventory items are low on stock?', 'Recommend vendors for the oldest plumbing ticket'],
};

function StepList({ steps }) {
  if (!steps?.length) return null;
  return (
    <ul className="copilot-steps">
      {steps.map((step, i) => (
        <li key={step.id || i} className={`is-${step.status}`}>
          {step.status === 'running' ? <Loader2 size={13} className="spin" /> : step.status === 'error' ? <XCircle size={13} /> : step.status === 'declined' ? <CircleDashed size={13} /> : <CheckCircle2 size={13} />}
          <span>{step.label}{step.status === 'error' && step.error ? ` — ${step.error}` : ''}{step.status === 'declined' ? ' (declined)' : ''}</span>
        </li>
      ))}
    </ul>
  );
}

function ApprovalCard({ message }) {
  const { decide, busy } = useCopilot();
  const items = message.pending || [];
  const destructive = items.some((i) => i.destructive);
  const [showDetails, setShowDetails] = useState(false);
  if (message.decided) {
    const approved = message.decisions?.some((d) => d.approved);
    return <div className={`copilot-approval decided ${approved ? 'ok' : 'no'}`}>{approved ? <Check size={14} /> : <X size={14} />}<span>{approved ? 'Approved' : 'Declined'}: {items.map((i) => i.label).join('; ')}</span></div>;
  }
  return (
    <div className={`copilot-approval ${destructive ? 'danger' : ''}`}>
      <div className="copilot-approval-title">{destructive ? <AlertTriangle size={15} /> : <Sparkles size={15} />}<strong>{items.length > 1 ? `${items.length} changes need your approval` : 'Approve this change?'}</strong></div>
      <ul>{items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
      {items.filter((i) => i.plan).map((item) => (
        <div className="copilot-plan" key={`plan-${item.id}`}>
          <div className="copilot-plan-total"><strong>{item.plan.total}</strong> records will be created</div>
          <div className="copilot-plan-chips">{Object.entries(item.plan.byResource).map(([resource, count]) => <span key={resource}><strong>{count}</strong> {resource.replace(/-/g, ' ')}</span>)}</div>
          {item.plan.samples?.length ? <ul className="copilot-plan-samples">{item.plan.samples.map((sample, i) => <li key={i}><b>{sample.resource}</b> ×{sample.count}{sample.perParent ? ' each' : ''}: {Object.values(sample.example).join(' · ')}</li>)}</ul> : null}
          {item.plan.problems?.length ? <p className="copilot-error"><AlertTriangle size={13} /> {item.plan.problems.join(' ')}</p> : null}
        </div>
      ))}
      <button type="button" className="copilot-link" onClick={() => setShowDetails((v) => !v)}>{showDetails ? 'Hide details' : 'Show details'}</button>
      {showDetails && <pre className="copilot-json">{JSON.stringify(items.map((i) => i.input), null, 2)}</pre>}
      <div className="copilot-approval-actions">
        <button type="button" className="primary-button" disabled={busy} onClick={() => decide(message.id, true)}><Check size={15} />{items.length > 1 ? 'Approve all' : 'Approve'}</button>
        <button type="button" className="secondary-button" disabled={busy} onClick={() => decide(message.id, false)}><X size={15} />Decline</button>
      </div>
      <small>Or say “yes” / “no”.</small>
    </div>
  );
}

const RESOURCE_ICON = { communities: Home, blocks: Building2, apartments: LayoutGrid };
const singular = (r) => ({ communities: 'Community', blocks: 'Block', apartments: 'Apartment', 'parking-slots': 'Parking slot', amenities: 'Amenity' }[r] || r.replace(/-/g, ' ').replace(/s$/, ''));

function BuildNode({ node, depth }) {
  const Icon = RESOURCE_ICON[node.resource] || ChevronRight;
  const kids = node.children || [];
  const leafKids = kids.length && kids.every((k) => !k.children?.length);
  const head = (
    <span className="copilot-build-row">
      <Icon size={13} />
      <span className="copilot-build-kind">{singular(node.resource)}</span>
      <strong>{node.name || node.id}</strong>
      <code>{node.id}</code>
      {kids.length ? <span className="copilot-build-count">{kids.length} {kids[0].resource.replace(/-/g, ' ')}</span> : null}
      {node.page ? <Link className="copilot-build-open" to={node.page} title={`Open ${node.page}`}><ExternalLink size={12} /></Link> : null}
    </span>
  );
  if (!kids.length) return <div className="copilot-build-node">{head}</div>;
  return (
    <details className="copilot-build-node" open={depth < 1}>
      <summary>{head}</summary>
      <div className="copilot-build-children">
        {leafKids
          ? <div className="copilot-build-chips">{kids.map((k) => <span key={k.id} title={`${singular(k.resource)} ${k.id}`}>{k.name || k.id}</span>)}</div>
          : kids.map((k) => <BuildNode key={k.id} node={k} depth={depth + 1} />)}
      </div>
    </details>
  );
}

function BuildResult({ built }) {
  if (!built) return null;
  const pages = [...new Set(JSON.stringify(built.tree).match(/"page":"[^"]+"/g)?.map((m) => m.slice(8, -1)) || [])];
  return (
    <div className="copilot-build">
      <div className="copilot-build-head">
        <CheckCircle2 size={16} />
        <strong>{built.total} records created</strong>
        {built.failed ? <span className="copilot-build-failed">{built.failed} failed{built.skipped ? `, ${built.skipped} skipped` : ''}</span> : null}
      </div>
      <div className="copilot-plan-chips">{Object.entries(built.byResource || {}).map(([r, c]) => <span key={r}><strong>{c}</strong> {r.replace(/-/g, ' ')}</span>)}</div>
      <div className="copilot-build-tree">{(built.tree || []).map((n) => <BuildNode key={n.id} node={n} depth={0} />)}</div>
      {built.errors?.length ? <ul className="copilot-build-errors">{built.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      {pages.length ? <div className="copilot-build-links">{pages.map((p) => <Link key={p} to={p}>Open {p.replace('/', '')} <ChevronRight size={12} /></Link>)}</div> : null}
    </div>
  );
}

function MessageView({ message }) {
  if (message.role === 'user') return <div className={`copilot-msg user ${message.chip ? 'chip' : ''}`}>{message.via === 'voice' && <Mic size={12} />}<span>{message.text}</span></div>;
  return (
    <div className="copilot-msg assistant">
      <span className="copilot-avatar"><Bot size={15} /></span>
      <div className="copilot-bubble">
        <StepList steps={message.steps} />
        {message.text ? <Markdown text={message.text} /> : message.status === 'streaming' && !message.steps?.length ? <p className="copilot-thinking"><Loader2 size={14} className="spin" /> Thinking…</p> : null}
        {message.status === 'error' && <p className="copilot-error"><AlertTriangle size={14} /> {message.error}</p>}
        {message.built ? <BuildResult built={message.built} /> : null}
        {message.pending?.length ? <ApprovalCard message={message} /> : null}
      </div>
    </div>
  );
}

function SettingsMenu({ onClose }) {
  const { settings, updateSettings, model } = useCopilot();
  const row = (key, label, hint) => (
    <label className="copilot-setting">
      <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => updateSettings({ [key]: e.target.checked })} />
      <span><strong>{label}</strong><small>{hint}</small></span>
    </label>
  );
  return (
    <div className="copilot-settings" role="dialog" aria-label="Copilot settings">
      <div className="copilot-settings-head"><strong>Copilot settings</strong><button type="button" className="copilot-icon" onClick={onClose} aria-label="Close settings"><X size={16} /></button></div>
      {row('autoApprove', 'Autopilot', 'Run creates/updates without asking. Deletes, bulk builds and bulk billing always ask.')}
      {row('handsFree', 'Hands-free voice', 'Reads replies aloud and listens again automatically.')}
      {row('speakReplies', 'Read replies aloud', 'Speak every answer, even typed ones.')}
      {row('briefing', 'Start-of-session briefing', 'On login, summarise priorities and open the right page.')}
      <p className="copilot-model">Model: {model || '—'} · Every action runs with your own permissions and is audit-logged.</p>
    </div>
  );
}

export default function CopilotPanel({ variant = 'drawer' }) {
  const { user, open, setOpen, enabled, messages, busy, send, briefing, newConversation, stop, voice, inputRef, toast, settings } = useCopilot();
  const [draft, setDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef(null);
  const location = useLocation();
  const isPage = variant === 'page';

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, voice.interim]);

  if (!user) return null;
  const hideFloating = !isPage && location.pathname === '/ai-chatbot';
  const visible = isPage || open;

  const submit = (event) => { event.preventDefault(); if (!draft.trim() || busy) return; send(draft); setDraft(''); };
  const suggestions = SUGGESTIONS[user.role] || SUGGESTIONS.RESIDENT;

  const panel = (
    <section className={`copilot-panel ${isPage ? 'as-page' : 'as-drawer'}`} aria-label="SafeHome Copilot">
      <header className="copilot-head">
        <span className="copilot-logo"><Sparkles size={17} /></span>
        <div className="copilot-title"><strong>SafeHome Copilot</strong><small>{enabled === false ? 'AI offline' : settings.autoApprove ? 'Autopilot on' : 'Ask, command, or talk'}</small></div>
        <button type="button" className="copilot-icon" title="Briefing" onClick={briefing} disabled={busy || !enabled}><Sunrise size={17} /></button>
        <button type="button" className="copilot-icon" title="New conversation" onClick={newConversation} disabled={busy}><Plus size={17} /></button>
        <button type="button" className="copilot-icon" title="Settings" onClick={() => setShowSettings((v) => !v)}><Settings2 size={17} /></button>
        {!isPage && <button type="button" className="copilot-icon" title="Close (Esc)" onClick={() => setOpen(false)}><X size={17} /></button>}
      </header>
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}

      <div className="copilot-scroll" ref={scrollRef}>
        {enabled === false && <div className="copilot-offline"><AlertTriangle size={16} /> The AI service isn't configured. Add ANTHROPIC_API_KEY to backend/.env and restart the backend.</div>}
        {!messages.length && enabled !== false && (
          <div className="copilot-empty">
            <span className="copilot-hero"><Bot size={26} /></span>
            <h3>Hi {user.name?.split(' ')[0] || 'there'} — what should we get done?</h3>
            <p>I can search records, create and update them, run workflows, analyse trends and take you to any screen. Talk to me with the mic or press <kbd>Alt</kbd>+<kbd>V</kbd>.</p>
            <div className="copilot-suggestions">{suggestions.map((s) => <button type="button" key={s} onClick={() => send(s)} disabled={busy}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m) => <MessageView key={m.id} message={m} />)}
        {voice.listening && <div className="copilot-msg user listening"><Mic size={12} /><span>{voice.interim || 'Listening…'}</span></div>}
      </div>

      {voice.error && <p className="copilot-voice-error">{voice.error}</p>}
      <form className="copilot-input" onSubmit={submit}>
        {voiceInputSupported && (
          <button type="button" className={`copilot-mic ${voice.listening ? 'live' : ''}`} onClick={() => (voice.listening ? voice.stop() : voice.start())} title={voice.listening ? 'Stop listening' : 'Talk (Alt+V)'} disabled={enabled === false}>
            {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder={voice.listening ? 'Listening…' : 'Ask anything or give a command…'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
          disabled={enabled === false}
        />
        {voice.speaking && <button type="button" className="copilot-icon" title="Stop speaking" onClick={voice.stopSpeaking}><VolumeX size={17} /></button>}
        {busy ? <button type="button" className="copilot-send stop" onClick={stop} title="Stop"><Square size={15} /></button>
          : <button type="submit" className="copilot-send" disabled={!draft.trim() || enabled === false} title="Send"><Send size={16} /></button>}
      </form>
      <p className="copilot-foot">{settings.handsFree ? <><Volume2 size={11} /> Hands-free on · </> : null}Ctrl+K to open · changes ask for approval{settings.autoApprove ? ' (autopilot: deletes & bulk builds only)' : ''}</p>
    </section>
  );

  if (isPage) return panel;
  return (
    <>
      {toast && <div className="copilot-toast"><Sparkles size={14} />{toast}</div>}
      {!hideFloating && !visible && (
        <button type="button" className={`copilot-launcher ${busy ? 'busy' : ''} ${voice.listening ? 'live' : ''}`} onClick={() => setOpen(true)} aria-label="Open SafeHome Copilot (Ctrl+K)">
          {busy ? <Loader2 size={22} className="spin" /> : <Sparkles size={22} />}
          <span>Copilot</span>
        </button>
      )}
      {!hideFloating && visible && panel}
    </>
  );
}

export function CopilotNavButton() {
  const copilot = useCopilot();
  if (!copilot) return null;
  return (
    <button type="button" className="copilot-nav-button" onClick={() => copilot.setOpen(true)} title="Open SafeHome Copilot (Ctrl+K)">
      <Sparkles size={15} /><span>Ask Copilot</span><kbd>Ctrl K</kbd>
    </button>
  );
}

export function CopilotNavMic() {
  const copilot = useCopilot();
  if (!copilot || !voiceInputSupported) return null;
  const { voice, setOpen } = copilot;
  return (
    <button type="button" className={`icon-button copilot-nav-mic ${voice.listening ? 'live' : ''}`} aria-label="Talk to Copilot (Alt+V)" title="Talk to Copilot (Alt+V)" onClick={() => { setOpen(true); if (voice.listening) voice.stop(); else voice.start(); }}>
      {voice.listening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
}

