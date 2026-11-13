import { API_URL, getAuthToken } from './api';

// Streams one agent turn over SSE. React Native's fetch has no readable body stream,
// so we use XMLHttpRequest and parse responseText incrementally as it grows.
export function streamAgentTurn(body, onEvent) {
  const xhr = new XMLHttpRequest();
  let seen = 0;
  let buffer = '';
  const flush = (final = false) => {
    const chunk = xhr.responseText.slice(seen);
    seen = xhr.responseText.length;
    buffer += chunk;
    const blocks = buffer.split('\n\n');
    buffer = final ? '' : blocks.pop();
    for (const block of blocks) {
      let event = 'message'; const data = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trim());
      }
      if (!data.length || event === 'ping') continue;
      let parsed; try { parsed = JSON.parse(data.join('\n')); } catch { parsed = data.join('\n'); }
      onEvent(event, parsed);
    }
  };
  const done = new Promise((resolve, reject) => {
    xhr.open('POST', `${API_URL}/agent/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onprogress = () => flush();
    xhr.onload = () => {
      if (xhr.status >= 400) {
        let message = `Copilot request failed (${xhr.status}).`;
        try { message = JSON.parse(xhr.responseText)?.error?.message || message; } catch { /* not JSON */ }
        reject(Object.assign(new Error(message), { status: xhr.status }));
        return;
      }
      flush(true); resolve();
    };
    xhr.onerror = () => reject(new Error(`Can't reach the Copilot at ${API_URL}.`));
    xhr.onabort = () => resolve();
    xhr.send(JSON.stringify(body));
  });
  return { done, abort: () => xhr.abort() };
}

// Web routes the agent may "navigate" to, mapped onto app screens.
const ROUTES = [
  [/^\/tickets\/(TK\w+)/, (m) => `/tickets/${m[1]}`],
  [/^\/(tickets|resident\/create-complaint|work-orders)/, () => '/requests'],
  [/^\/(visitors|security\/dashboard)/, () => '/gate'],
  [/^\/billing/, () => '/bills'],
  [/^\/notices/, () => '/notices'],
  [/^\/events/, () => '/events'],
  [/^\/polls/, () => '/polls'],
  [/^\/parcels/, () => '/parcels'],
  [/^\/sos/, () => '/sos'],
  [/^\/staff/, () => '/staff'],
  [/^\/maintenance/, () => '/maintenance'],
  [/^\/forum/, () => '/forum'],
  [/^\/accounts/, () => '/accounts'],
  [/^\/move-requests/, () => '/move'],
  [/dashboard/, () => '/'],
];
export function mapWebPath(path = '') {
  for (const [re, to] of ROUTES) { const m = path.match(re); if (m) return to(m); }
  return null;
}
