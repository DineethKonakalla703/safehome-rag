import { API_BASE_URL, ApiError, OFFLINE_MESSAGE, apiRequest } from '../api/apiClient';

export const getAgentStatus = () => apiRequest('/agent/status');
export const listAgentSessions = () => apiRequest('/agent/sessions');
export const getAgentSession = (id) => apiRequest(`/agent/sessions/${id}`);
export const deleteAgentSession = (id) => apiRequest(`/agent/sessions/${id}`, { method: 'DELETE' });

// Streams one agent turn. onEvent(eventName, data) is called for every server-sent event.
export async function streamAgentTurn(body, onEvent, signal) {
  const token = localStorage.getItem('safehome_token');
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(OFFLINE_MESSAGE);
  }
  if (!response.ok || !response.body) {
    let message = `Request failed with status ${response.status}.`;
    try { message = (await response.json())?.error?.message || message; } catch { /* ignore */ }
    if (response.status === 401) window.dispatchEvent(new Event('safehome:unauthorized'));
    throw new ApiError(message, response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index;
    while ((index = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      let event = 'message';
      const data = [];
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
      }
      if (!data.length) continue;
      let parsed;
      try { parsed = JSON.parse(data.join('\n')); } catch { continue; }
      onEvent(event, parsed);
    }
  }
}
