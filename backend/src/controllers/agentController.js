import { deleteAgentSession, getAgentSession, listAgentSessions, runAgentTurn } from '../ai/agent/agentRunner.js';
import { asyncHandler, ok } from '../utils/http.js';

const MAX_MESSAGE = () => Number(process.env.CHATBOT_MAX_MESSAGE_LENGTH || 2000);

// POST /api/agent/chat — streams Server-Sent Events: session, step, text, navigate, changed, confirm, done, error.
export const agentChat = async (req, res) => {
  const { sessionId, message, kind, decisions, context, autoApprove } = req.body || {};
  if (message && String(message).length > MAX_MESSAGE()) return res.status(400).json({ success: false, error: { message: `Messages cannot exceed ${MAX_MESSAGE()} characters.` } });

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  res.on('close', () => { closed = true; });
  const emit = (event, data) => { if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
  const heartbeat = setInterval(() => { if (!closed) res.write(': ping\n\n'); }, 15000);

  try {
    const port = req.socket.localPort || process.env.PORT || 5000;
    const result = await runAgentTurn({
      user: req.user,
      authorization: req.headers.authorization,
      baseUrl: `http://127.0.0.1:${port}`,
      requestId: req.requestId,
      sessionId, message, kind,
      decisions: Array.isArray(decisions) ? decisions : [],
      context: { currentPath: String(context?.currentPath || '').slice(0, 200), voice: Boolean(context?.voice), client: context?.client === 'mobile' ? 'mobile' : 'web' },
      autoApprove: autoApprove === true,
      emit,
    });
    emit('done', result);
  } catch (error) {
    const status = error.status || error.statusCode;
    const message = status === 401 ? 'The AI service rejected the API key. Check ANTHROPIC_API_KEY in backend/.env.'
      : status === 429 ? 'The AI service is rate-limited right now. Please try again in a moment.'
      : status === 404 && /model/i.test(error.message || '') ? `The configured CLAUDE_MODEL (${process.env.CLAUDE_MODEL}) was not found.`
      : error.message || 'The AI copilot failed.';
    console.warn(`[agent] ${req.requestId}: ${error.name || 'Error'} ${status || ''} ${error.message}`);
    emit('error', { message });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};

export const agentSessions = asyncHandler(async (req, res) => ok(res, await listAgentSessions(req.user)));
export const agentSession = asyncHandler(async (req, res) => ok(res, await getAgentSession(req.user, req.params.id)));
export const removeAgentSession = asyncHandler(async (req, res) => ok(res, await deleteAgentSession(req.user, req.params.id)));
export const agentStatus = asyncHandler(async (req, res) => ok(res, { enabled: Boolean(process.env.ANTHROPIC_API_KEY), model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6' }));
