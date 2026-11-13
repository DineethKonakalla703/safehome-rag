import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import AgentSession from '../../models/AgentSession.js';
import { writeAudit } from '../../utils/audit.js';
import { AppError } from '../../utils/http.js';
import { PAGES, catalogText } from './catalog.js';
import { TOOL_DEFINITIONS, describeToolCall, executeTool, planBulkBuild, toolAlwaysAsks, toolIsDestructive, toolNeedsApproval } from './tools.js';

const MAX_STEPS = () => Math.max(2, Number(process.env.AGENT_MAX_STEPS || 20));
const MAX_TOKENS = () => Math.max(512, Number(process.env.AGENT_MAX_TOKENS || 8192));
const MODEL = () => process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const HISTORY_LIMIT = 40;

let client;
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new AppError(503, 'The AI copilot is not configured. Add ANTHROPIC_API_KEY to backend/.env.');
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 60000) });
  return client;
};

// Static part of the system prompt: identical for every request so it is prompt-cached.
let staticPrompt;
const getStaticPrompt = () => staticPrompt ??= `You are SafeHome Copilot, the AI operator built into SafeHome — a residential community operations platform (complaints/tickets, work orders, billing, visitors, parking, amenities, notices, documents, inventory, vendors, residents).

You don't just chat: you operate the platform for the signed-in user through tools. Every tool call runs with that user's own permissions, so if the platform refuses something, explain plainly that their role can't do it.

How to work:
- Act, don't describe. If the user asks for something you can do with tools, do it. Chain several tools when needed (look up ids, then create; find a ticket, then assign the best technician; etc.).
- Never invent ids, names, or numbers. Look them up with query_records / get_record. If a required detail is genuinely missing and can't be looked up, ask one short question.
- Changes (create / update / delete / workflow actions) are shown to the user as an approval card before they run; you don't need to ask "shall I?" in text first — just call the tool with a clear one-sentence "summary". If the user declines, acknowledge and move on.
- Bulk setup (several communities/blocks/apartments/parking slots/amenities etc. in one request): plan it as ONE bulk_build call with a nested tree, not many create_record calls. Pick sensible realistic defaults (names, addresses in the user's city if known, apartment numbering by floor) instead of asking lots of questions; the user reviews the plan before anything is created. After it runs, report what was created and navigate to the most relevant list page.
- Use navigate to take the user to the relevant screen when they ask to go somewhere, and after you create or locate something they'll want to see. Prefer detail pages (/tickets/TK004) when a single record is the focus.
- For questions about rules, procedures, safety or how-to, use run_action knowledge_query.
- Safety: if a complaint mentions gas, fire, smoke, sparks, flooding, electrical hazard or anyone hurt, tell the user to contact emergency services / security first, then help log it.
- Replies: short, concrete, friendly. Lead with the answer or the outcome. Use small markdown lists or tables only when listing several records. Mention record ids (TK004, BILL012) so the user can refer to them. Currency is INR (₹).

Platform catalog:
${catalogText()}`;

function dynamicContext(user, context = {}) {
  const pages = (PAGES[user.role] || []).join(', ');
  return [
    `Signed-in user: ${user.name} (userId ${user.userId}, role ${user.role}${user.blockId ? `, blockId ${user.blockId}` : ''}${user.apartmentId ? `, apartmentId ${user.apartmentId}` : ''}${user.technicianId ? `, technicianId ${user.technicianId}` : ''}, communityId ${user.communityId}).`,
    `Pages this user can open: ${pages}. Detail pages: /tickets/<ticketId>${['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user.role) ? ', /incidents/<incidentId>' : ''}.`,
    `Current time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST (${new Date().toISOString()}). All timestamps returned by tools are UTC — always convert them to IST (UTC+05:30) before showing times to the user, and send datetimes to tools with a +05:30 offset. User is currently on page: ${context.currentPath || 'unknown'}.`,
    context.client === 'mobile' ? 'The user is on the SafeHome MOBILE app (narrow phone screen). Never use markdown tables or headings; write short paragraphs and simple "- " bullet lists (one item per line, key facts first), with **bold** used sparingly. Navigation still works: the app shows an "Open" button for pages you navigate to.' : '',
    context.voice ? 'The user is talking by VOICE and will hear your reply read aloud: answer in 1-3 short spoken sentences, no tables, no markdown, spell out ids naturally.' : '',
  ].filter(Boolean).join('\n');
}

const BRIEFING_PROMPT = 'Start-of-session briefing: check what needs my attention right now for my role (open/urgent items, SLA risks, pending approvals, unpaid bills or upcoming bookings as relevant). Give me a crisp summary with the top 3 priorities, then navigate me to the single most useful page to start with.';

// Keep history bounded without splitting a tool_use from its tool_result.
function trimHistory(messages) {
  if (messages.length <= HISTORY_LIMIT) return messages;
  for (let i = messages.length - HISTORY_LIMIT; i < messages.length; i += 1) {
    const m = messages[i];
    if (m.role === 'user' && (typeof m.content === 'string' || m.content.every((b) => b.type === 'text'))) return messages.slice(i);
  }
  return messages.slice(-2);
}

const parse = (json, fallback) => { try { return json ? JSON.parse(json) : fallback; } catch { return fallback; } };

async function loadSession(user, sessionId) {
  if (sessionId) {
    const existing = await AgentSession.findOne({ sessionId, userId: user.userId });
    if (existing) return existing;
  }
  return new AgentSession({ sessionId: crypto.randomUUID(), userId: user.userId, role: user.role, messagesJson: '[]', transcript: [] });
}

async function runTool(ctx, block) {
  const label = describeToolCall(block.name, block.input);
  ctx.emit('step', { id: block.id, tool: block.name, label, status: 'running' });
  ctx.currentToolId = block.id;
  try {
    const result = await executeTool(ctx, block.name, block.input);
    ctx.emit('step', { id: block.id, tool: block.name, label, status: 'done' });
    ctx.steps.push({ tool: block.name, label, status: 'done' });
    return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result ?? { ok: true }).slice(0, 24000) };
  } catch (error) {
    ctx.emit('step', { id: block.id, tool: block.name, label, status: 'error', error: error.message });
    ctx.steps.push({ tool: block.name, label, status: 'error', error: error.message });
    return { type: 'tool_result', tool_use_id: block.id, content: `Error: ${error.message}`, is_error: true };
  }
}

async function loop(ctx, session, messages) {
  const system = [
    { type: 'text', text: getStaticPrompt(), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicContext(ctx.user, ctx.context) },
  ];
  const textParts = [];
  for (let step = 0; step < MAX_STEPS(); step += 1) {
    const response = await getClient().messages.create({
      model: MODEL(),
      max_tokens: MAX_TOKENS(),
      system,
      tools: TOOL_DEFINITIONS,
      messages: trimHistory(messages),
    });
    session.usage.inputTokens += response.usage?.input_tokens || 0;
    session.usage.outputTokens += response.usage?.output_tokens || 0;
    session.usage.cacheReadTokens += response.usage?.cache_read_input_tokens || 0;
    messages.push({ role: 'assistant', content: response.content });

    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (text) { textParts.push(text); ctx.emit('text', { text }); }

    if (response.stop_reason === 'refusal') { const msg = 'I can\'t help with that request.'; textParts.push(msg); ctx.emit('text', { text: msg }); return { status: 'done', text: textParts.join('\n\n') }; }
    if (response.stop_reason === 'pause_turn') continue;
    if (response.stop_reason !== 'tool_use') return { status: 'done', text: textParts.join('\n\n') };

    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    const results = [];
    const needApproval = [];
    for (const block of toolUses) {
      const approval = toolNeedsApproval(block.name, block.input);
      const alwaysAsk = toolAlwaysAsks(block.name, block.input);
      if (block.name === 'bulk_build') {
        // Self-check: a plan that doesn't add up goes back to the model, not to the user.
        const plan = planBulkBuild(block.input?.nodes, block.input?.expected_totals);
        if (plan.problems.length) {
          ctx.emit('step', { id: block.id, tool: block.name, label: 'Checking build plan… fixing totals', status: 'done' });
          results.push({ type: 'tool_result', tool_use_id: block.id, content: `Plan rejected before showing the user: ${plan.problems.join(' ')}`, is_error: true });
          continue;
        }
      }
      if (approval && (!ctx.autoApprove || alwaysAsk)) needApproval.push(block);
      else results.push(await runTool(ctx, block));
    }
    if (needApproval.length) {
      const items = needApproval.map((b) => {
        const item = { id: b.id, tool: b.name, label: describeToolCall(b.name, b.input), destructive: toolIsDestructive(b.name, b.input), input: b.input };
        if (b.name === 'bulk_build') { const plan = planBulkBuild(b.input?.nodes, b.input?.expected_totals); item.plan = { total: plan.total, byResource: plan.byResource, samples: plan.samples, problems: plan.problems }; }
        return item;
      });
      session.pendingJson = JSON.stringify({ results, items, createdAt: Date.now() });
      ctx.emit('confirm', { items });
      return { status: 'awaiting_approval', text: textParts.join('\n\n'), items };
    }
    messages.push({ role: 'user', content: results });
  }
  const msg = 'I stopped after several steps to keep things safe. Tell me if you want me to continue.';
  textParts.push(msg); ctx.emit('text', { text: msg });
  return { status: 'done', text: textParts.join('\n\n') };
}

/**
 * One user turn: either a new message, a briefing request, or approval decisions for a paused run.
 * emit(event, data) streams progress to the client.
 */
export async function runAgentTurn({ user, authorization, baseUrl, requestId, sessionId, message, kind, decisions, context = {}, autoApprove = false, emit }) {
  const session = await loadSession(user, sessionId);
  const messages = parse(session.messagesJson, []);
  const pending = parse(session.pendingJson, null);
  const ctx = { user, authorization, baseUrl, requestId, context, autoApprove: Boolean(autoApprove), emit, steps: [] };
  emit('session', { sessionId: session.sessionId });

  let userText = kind === 'briefing' ? BRIEFING_PROMPT : String(message || '').trim();
  const userContent = [];

  if (pending) {
    // Resolve every paused tool call: run the approved ones, decline the rest.
    const byId = Object.fromEntries((decisions || []).map((d) => [d.id, d.approved === true]));
    const results = [...pending.results];
    for (const item of pending.items) {
      if (byId[item.id]) {
        results.push(await runTool(ctx, { id: item.id, name: item.tool, input: item.input }));
        await writeAudit({ action: 'AI_AGENT_ACTION_APPROVED', entityType: 'AgentSession', entityId: session.sessionId, actorId: user.userId, message: item.label.slice(0, 300) });
      } else {
        results.push({ type: 'tool_result', tool_use_id: item.id, content: userText ? 'The user did not approve this and moved on to a new request.' : 'The user declined this action. Do not retry it unless asked.' });
        ctx.steps.push({ tool: item.tool, label: item.label, status: 'declined' });
        emit('step', { id: item.id, tool: item.tool, label: item.label, status: 'declined' });
      }
    }
    userContent.push(...results);
    session.pendingJson = null;
  } else if (!userText) {
    throw new AppError(400, 'A message is required.');
  }

  if (userText) {
    userContent.push({ type: 'text', text: userText });
    session.transcript.push({ role: 'user', text: kind === 'briefing' ? 'Start-of-session briefing' : userText, at: new Date() });
    if (!messages.length || session.title === 'AI copilot') session.title = (kind === 'briefing' ? 'Briefing' : userText).slice(0, 80);
  }
  messages.push({ role: 'user', content: userContent });

  let outcome;
  try {
    outcome = await loop(ctx, session, messages);
  } catch (error) {
    // Roll back the dangling user turn so the stored history stays valid for the next request.
    while (messages.length && messages[messages.length - 1].role === 'user') messages.pop();
    if (messages.length && messages[messages.length - 1].content?.some?.((b) => b.type === 'tool_use')) messages.pop();
    session.messagesJson = JSON.stringify(messages);
    session.pendingJson = null;
    await session.save();
    throw error;
  }

  session.messagesJson = JSON.stringify(messages);
  session.transcript.push({ role: 'assistant', text: outcome.text, steps: ctx.steps, pending: outcome.items || null, built: ctx.built || null, at: new Date() });
  if (session.transcript.length > 200) session.transcript = session.transcript.slice(-200);
  session.markModified('transcript');
  await session.save();
  await writeAudit({ action: 'AI_AGENT_TURN', entityType: 'AgentSession', entityId: session.sessionId, actorId: user.userId, message: `${ctx.steps.length} tool step(s); ${outcome.status}.` });
  return { sessionId: session.sessionId, ...outcome };
}

export async function listAgentSessions(user) {
  return AgentSession.find({ userId: user.userId }).sort({ updatedAt: -1 }).limit(20).select('sessionId title updatedAt').lean();
}

export async function getAgentSession(user, sessionId) {
  const session = await AgentSession.findOne({ sessionId, userId: user.userId }).select('sessionId title transcript pendingJson updatedAt').lean();
  if (!session) throw new AppError(404, 'Conversation not found.');
  const pending = parse(session.pendingJson, null);
  return { sessionId: session.sessionId, title: session.title, transcript: session.transcript, pending: pending?.items || null };
}

export async function deleteAgentSession(user, sessionId) {
  await AgentSession.deleteOne({ sessionId, userId: user.userId });
  return { deleted: true };
}
