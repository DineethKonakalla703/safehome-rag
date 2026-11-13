import { ACTIONS, REPORTS, RESOURCES, pageAllowed } from './catalog.js';
import { INTERNAL_AGENT_TOKEN } from '../../middleware/security.js';

const resourceKeys = Object.keys(RESOURCES);
const actionKeys = Object.keys(ACTIONS);
const reportKeys = Object.keys(REPORTS);

export const TOOL_DEFINITIONS = [
  {
    name: 'query_records',
    description: 'List and search records the current user is allowed to see. Use for any "show / find / how many / which" question. Returns matching records (trimmed) plus total counts. Prefer specific filters over large result sets.',
    input_schema: {
      type: 'object',
      properties: {
        resource: { type: 'string', enum: resourceKeys },
        search: { type: 'string', description: 'Case-insensitive free-text match across all field values (e.g. a name, "leak", "Block A").' },
        filters: { type: 'object', description: 'Exact field matches, e.g. {"status":"New","blockId":"B001"}. Use an array value to match any of several values. Use {"$open": true} on tickets for not Resolved/Closed.', additionalProperties: true },
        sort_by: { type: 'string', description: 'Field to sort by, default createdAt.' },
        sort_desc: { type: 'boolean', description: 'Default true.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Default 15.' },
      },
      required: ['resource'],
    },
  },
  {
    name: 'get_record',
    description: 'Fetch one record by its public id (e.g. TK001, VIS004, B002).',
    input_schema: { type: 'object', properties: { resource: { type: 'string', enum: resourceKeys }, id: { type: 'string' } }, required: ['resource', 'id'] },
  },
  {
    name: 'create_record',
    description: 'Create a record. Requires the user to approve before it runs. Look up related ids (blockId, apartmentId, residentId, technicianId...) with query_records first instead of guessing.',
    input_schema: { type: 'object', properties: { resource: { type: 'string', enum: resourceKeys }, data: { type: 'object', additionalProperties: true }, summary: { type: 'string', description: 'One plain-language sentence describing what will be created, shown to the user for approval.' } }, required: ['resource', 'data', 'summary'] },
  },
  {
    name: 'update_record',
    description: 'Update fields on an existing record (generic resources only; for ticket/bill/work-order/visitor workflow changes use run_action). Requires user approval.',
    input_schema: { type: 'object', properties: { resource: { type: 'string', enum: resourceKeys }, id: { type: 'string' }, data: { type: 'object', additionalProperties: true }, summary: { type: 'string' } }, required: ['resource', 'id', 'data', 'summary'] },
  },
  {
    name: 'delete_record',
    description: 'Permanently delete a record. Always requires explicit user approval. Only use when the user clearly asked to delete.',
    input_schema: { type: 'object', properties: { resource: { type: 'string', enum: resourceKeys }, id: { type: 'string' }, summary: { type: 'string' } }, required: ['resource', 'id', 'summary'] },
  },
  {
    name: 'run_action',
    description: 'Run a workflow action (status changes, assignments, approvals, AI analysis, knowledge-base questions). Actions that change data require user approval.',
    input_schema: { type: 'object', properties: { action: { type: 'string', enum: actionKeys }, id: { type: 'string', description: 'Target record id when the action needs one.' }, data: { type: 'object', additionalProperties: true }, summary: { type: 'string', description: 'One sentence describing the effect, shown for approval.' } }, required: ['action'] },
  },
  {
    name: 'get_report',
    description: 'Get aggregated analytics: dashboard KPIs, ticket/billing/technician/resident/SLA reports, AI insights.',
    input_schema: { type: 'object', properties: { report: { type: 'string', enum: reportKeys } }, required: ['report'] },
  },
  {
    name: 'navigate',
    description: 'Open a page in the user\'s app (e.g. "/tickets", "/tickets/TK004", "/billing"). Use whenever the user asks to go/open/show a screen, and after creating or finding something the user will want to look at. Only pages allowed for the user\'s role work.',
    input_schema: { type: 'object', properties: { path: { type: 'string' }, highlight: { type: 'string', description: 'Optional search text to pre-fill / highlight on that page.' } }, required: ['path'] },
  },
  {
    name: 'bulk_build',
    description: `Build many related records in ONE approved run — use this whenever the user asks to set up or generate several records at once (e.g. "create 4 communities, each with 3 blocks and 20 apartments", "add 10 parking slots to every block", "add gym, pool and clubhouse"). Never loop create_record for this.
Give a tree of nodes. Each node creates "count" records of "resource"; its "children" are created once under EVERY record the node created.
In string values you can use templates: {n} = sequence number (starts at "start", default 1), {i} = 0-based index, {letter} = A, B, C… by index, {floor} = n divided by 100 (for apartment numbers like 101..410), {parent.<field>} = a field of the parent record (e.g. {parent.name}).
Link to the parent with a whole-value reference "@parent.<field>", e.g. blocks: {"name":"Block {letter}","communityId":"@parent.communityId"}; apartments: {"number":"{parent.name}-{n}", "blockId":"@parent.blockId","communityId":"@parent.communityId"}. Use "@root.<field>" for the top-level ancestor.
To create apartment floors, prefer one apartments node per floor with start 101 / 201 / 301, or a single node with start 101 and a count that fits.
Check required fields in the catalog. Max ${500} records per run. The user sees the full plan and approves it once.`,
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One sentence describing what will be built.' },
        expected_totals: { type: 'object', additionalProperties: { type: 'integer' }, description: 'Total records per resource you intend to create overall, e.g. {"communities":4,"blocks":12,"apartments":120}. The plan is checked against this before the user sees it.' },
        nodes: {
          type: 'array',
          description: 'Top-level nodes. Node shape: { resource: string, count?: integer, start?: integer, data: object, children?: Node[] }',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string', enum: resourceKeys },
              count: { type: 'integer', minimum: 1, maximum: 200 },
              start: { type: 'integer' },
              data: { type: 'object', additionalProperties: true },
              children: { type: 'array', items: { type: 'object' } },
            },
            required: ['resource', 'data'],
          },
        },
      },
      required: ['summary', 'expected_totals', 'nodes'],
    },
  },
];

export const BULK_LIMIT = 500;

export const toolNeedsApproval = (name, input) => {
  if (['create_record', 'update_record', 'delete_record', 'bulk_build'].includes(name)) return true;
  if (name === 'run_action') return Boolean(ACTIONS[input?.action]?.write);
  return false;
};
export const toolIsDestructive = (name, input) => name === 'delete_record' || (name === 'run_action' && Boolean(ACTIONS[input?.action]?.destructive));
// Always shown for approval, even with autopilot on.
export const toolAlwaysAsks = (name, input) => toolIsDestructive(name, input) || name === 'bulk_build';

// ---------- bulk build planning ----------

const LETTERS = (i) => { let s = ''; let x = i; do { s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x / 26) - 1; } while (x >= 0); return s; };

function renderValue(value, vars, parent, root) {
  if (typeof value === 'string') {
    const ref = value.match(/^@(parent|root)\.([\w]+)$/);
    if (ref) return (ref[1] === 'parent' ? parent : root)?.[ref[2]] ?? null;
    return value.replace(/\{(n|i|letter|floor|parent\.[\w]+|root\.[\w]+)\}/g, (_, key) => {
      if (key in vars) return String(vars[key]);
      const [scope, field] = key.split('.');
      return String((scope === 'parent' ? parent : root)?.[field] ?? '');
    });
  }
  if (Array.isArray(value)) return value.map((v) => renderValue(v, vars, parent, root));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renderValue(v, vars, parent, root)]));
  return value;
}

const varsFor = (node, i) => { const n = (Number.isFinite(node.start) ? node.start : 1) + i; return { n, i, letter: LETTERS(i), floor: n >= 100 ? Math.floor(n / 100) : 1 }; };

// Validates the plan and returns { total, byResource, problems, samples }.
export function planBulkBuild(nodes = [], expected = null) {
  const byResource = {};
  const problems = [];
  const samples = [];
  const walk = (list, multiplier, depth) => {
    if (!Array.isArray(list)) { problems.push('children must be an array'); return 0; }
    if (depth > 5) { problems.push('The plan is nested too deeply (max 5 levels).'); return 0; }
    let total = 0;
    for (const node of list) {
      const resource = RESOURCES[node?.resource];
      if (!resource) { problems.push(`Unknown resource "${node?.resource}".`); continue; }
      if (!resource.verbs.includes('create')) { problems.push(`${node.resource} cannot be created.`); continue; }
      const count = Math.max(1, Math.min(200, Number(node.count) || 1));
      const made = count * multiplier;
      byResource[node.resource] = (byResource[node.resource] || 0) + made;
      if (samples.length < 6) {
        const preview = renderValue(node.data || {}, varsFor(node, 0), { name: '<parent>' }, { name: '<root>' });
        samples.push({ resource: node.resource, count, perParent: depth > 0, example: Object.fromEntries(Object.entries(preview).filter(([, v]) => typeof v !== 'object').slice(0, 4)) });
      }
      total += made + walk(node.children || [], made, depth + 1);
    }
    return total;
  };
  const total = walk(nodes, 1, 0);
  if (expected && typeof expected === 'object') {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(byResource)])) {
      const want = Number(expected[key] || 0); const got = byResource[key] || 0;
      if (want !== got) problems.push(`Plan creates ${got} ${key} but expected_totals says ${want}. Each node's count multiplies under every parent record and every top-level node adds more; fix the tree so totals match.`);
    }
  }
  if (total > BULK_LIMIT) problems.push(`The plan creates ${total} records; the limit is ${BULK_LIMIT} per run. Split it into smaller runs.`);
  if (!total) problems.push('The plan creates nothing.');
  return { total, byResource, problems, samples };
}

async function runBulkBuild(ctx, input, stepId) {
  const plan = planBulkBuild(input.nodes, input.expected_totals);
  if (plan.problems.length) throw new Error(plan.problems.join(' '));
  const created = {};
  const errors = [];
  const tree = [];
  let done = 0; let failed = 0; let skipped = 0;
  const countSubtree = (list, mult = 1) => (list || []).reduce((sum, node) => { const c = Math.max(1, Math.min(200, Number(node.count) || 1)) * mult; return sum + c + countSubtree(node.children, c); }, 0);
  const progress = () => ctx.emit?.('step', { id: stepId, tool: 'bulk_build', label: `Building… ${done + failed + skipped}/${plan.total} (${done} created${failed ? `, ${failed} failed` : ''})`, status: 'running' });

  const build = async (list, parent, root, outline) => {
    for (const node of list) {
      const resource = RESOURCES[node.resource];
      const count = Math.max(1, Math.min(200, Number(node.count) || 1));
      for (let i = 0; i < count; i += 1) {
        const data = renderValue(node.data || {}, varsFor(node, i), parent, root);
        let record = null;
        try {
          record = await api(ctx, 'POST', resource.path, data);
          done += 1;
          created[node.resource] = created[node.resource] || [];
          created[node.resource].push(record?.[resource.idField]);
        } catch (error) {
          failed += 1;
          if (errors.length < 10) errors.push(`${node.resource} ${JSON.stringify(data).slice(0, 120)}: ${error.message}`);
          const lost = countSubtree(node.children);
          skipped += lost;
        }
        if ((done + failed) % 3 === 0) progress();
        if (record) {
          const entry = { resource: node.resource, id: record[resource.idField], name: record.name || record.number || record.title || record.slotNumber, page: resource.page || null };
          if (outline) outline.push(entry);
          if (node.children?.length) {
            entry.children = [];
            await build(node.children, record, root || record, entry.children);
            if (!entry.children.length) delete entry.children;
          }
        }
      }
    }
  };
  await build(input.nodes, null, null, tree);
  progress();
  if (done) ctx.emit?.('changed', { bulk: true });
  const byResource = Object.fromEntries(Object.entries(created).map(([k, ids]) => [k, ids.length]));
  ctx.emit?.('built', { id: stepId, total: done, failed, skipped, byResource, tree, errors });
  ctx.built = { total: done, failed, skipped, byResource, tree, errors };
  const shrink = (list) => list.slice(0, 12).map((e) => ({ resource: e.resource, id: e.id, name: e.name, ...(e.children ? { children: e.children.length > 6 ? [...shrink(e.children.slice(0, 3)), { more: e.children.length - 3 }] : shrink(e.children) } : {}) }));
  return {
    createdCount: done,
    failedCount: failed,
    skippedBecauseParentFailed: skipped,
    createdByResource: Object.fromEntries(Object.entries(created).map(([k, ids]) => [k, { count: ids.length, ids: ids.length > 20 ? [...ids.slice(0, 10), '…', ...ids.slice(-3)] : ids }])),
    outline: shrink(tree),
    errors,
    note: 'The user already sees a detailed card of everything created; keep your reply to a short summary.',
  };
}

export function describeToolCall(name, input = {}) {
  if (name === 'bulk_build') {
    const plan = planBulkBuild(input.nodes, input.expected_totals);
    const counts = Object.entries(plan.byResource).map(([k, v]) => `${v} ${k}`).join(', ');
    return `${input.summary || 'Bulk build'}${counts ? ` (${counts})` : ''}`;
  }
  if (input.summary) return input.summary;
  if (name === 'create_record') return `Create ${input.resource} record`;
  if (name === 'update_record') return `Update ${input.resource} ${input.id}`;
  if (name === 'delete_record') return `Delete ${input.resource} ${input.id}`;
  if (name === 'run_action') return `${input.action?.replace(/_/g, ' ')}${input.id ? ` on ${input.id}` : ''}`;
  if (name === 'query_records') return `Searching ${input.resource}${input.search ? ` for "${input.search}"` : ''}`;
  if (name === 'get_record') return `Opening ${input.resource} ${input.id}`;
  if (name === 'get_report') return `Reading ${input.report} report`;
  if (name === 'navigate') return `Navigating to ${input.path}`;
  return name;
}

// ---------- execution ----------

async function api(ctx, method, path, body) {
  const response = await fetch(`${ctx.baseUrl}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: ctx.authorization, 'x-agent-internal': INTERNAL_AGENT_TOKEN, 'x-request-id': `agent-${ctx.requestId}` },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* non-JSON */ }
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.error?.message || `Request failed with status ${response.status}`);
    error.status = response.status; error.details = payload?.error?.details;
    throw error;
  }
  return payload?.data;
}

const DROP_FIELDS = new Set(['_id', 'password', 'embedding', 'passwordResetTokenHash', 'attachments', 'aiHistory', 'content']);
// API timestamps are UTC ISO strings; the model misreads their date part near midnight, so show them in IST.
const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export function toIst(iso) {
  const d = new Date(new Date(iso).getTime() + 330 * 60000).toISOString();
  return `${d.slice(0, 10)} ${d.slice(11, 16)} IST`;
}
function compact(value, depth = 0) {
  if (typeof value === 'string' && ISO_TS.test(value)) return toIst(value);
  if (Array.isArray(value)) return value.slice(0, 8).map((v) => compact(v, depth + 1));
  if (value && typeof value === 'object') {
    if (depth > 2) return '[…]';
    return Object.fromEntries(Object.entries(value).filter(([k, v]) => !DROP_FIELDS.has(k) && v !== null && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => [k, compact(v, depth + 1)]));
  }
  if (typeof value === 'string' && value.length > 400) return `${value.slice(0, 400)}…`;
  return value;
}

const CLOSED = ['Resolved', 'Closed', 'Completed', 'Cancelled', 'Exited', 'Paid'];
function matches(record, filters = {}, search) {
  for (const [field, expected] of Object.entries(filters || {})) {
    if (field === '$open') { if (expected && CLOSED.includes(record.status || record.paymentStatus)) return false; continue; }
    const actual = field.split('.').reduce((obj, key) => obj?.[key], record);
    const list = Array.isArray(expected) ? expected : [expected];
    if (!list.some((item) => String(actual ?? '').toLowerCase() === String(item ?? '').toLowerCase())) return false;
  }
  if (search) {
    const needle = String(search).toLowerCase();
    if (!JSON.stringify(record).toLowerCase().includes(needle)) return false;
  }
  return true;
}

function countBy(records, field) {
  const out = {};
  for (const r of records) { const k = r[field]; if (k !== undefined && k !== null && k !== '') out[k] = (out[k] || 0) + 1; }
  return Object.keys(out).length && Object.keys(out).length <= 12 ? out : undefined;
}

async function queryRecords(ctx, input) {
  const resource = RESOURCES[input.resource];
  if (!resource) throw new Error(`Unknown resource ${input.resource}`);
  let data = await api(ctx, 'GET', resource.path);
  if (resource.pick) data = data?.[resource.pick];
  const all = Array.isArray(data) ? data : [];
  const filtered = all.filter((r) => matches(r, input.filters, input.search));
  const sortBy = input.sort_by || 'createdAt';
  const desc = input.sort_desc !== false;
  filtered.sort((a, b) => { const x = a[sortBy] ?? ''; const y = b[sortBy] ?? ''; return (x > y ? 1 : x < y ? -1 : 0) * (desc ? -1 : 1); });
  const limit = Math.min(Number(input.limit) || 15, 50);
  return {
    totalVisible: all.length,
    matched: filtered.length,
    returned: Math.min(limit, filtered.length),
    breakdown: { status: countBy(filtered, 'status') || countBy(filtered, 'paymentStatus'), severity: countBy(filtered, 'severity'), blockId: countBy(filtered, 'blockId') },
    records: filtered.slice(0, limit).map((r) => compact(r)),
  };
}

async function getRecord(ctx, input) {
  const resource = RESOURCES[input.resource];
  if (!resource) throw new Error(`Unknown resource ${input.resource}`);
  if (resource.verbs.includes('get')) {
    const record = await api(ctx, 'GET', `${resource.path}/${encodeURIComponent(input.id)}`);
    const { timeline, comments, ...rest } = record || {};
    return { ...compact(rest), ...(timeline ? { recentTimeline: compact(timeline.slice(-5)) } : {}), ...(comments ? { recentComments: compact(comments.slice(-5)) } : {}) };
  }
  const result = await queryRecords(ctx, { resource: input.resource, filters: { [resource.idField]: input.id }, limit: 1 });
  if (!result.records.length) throw new Error(`${input.id} was not found in your access scope.`);
  return result.records[0];
}

function fill(path, id) {
  if (!path.includes(':id')) return path;
  if (!id) throw new Error('This action needs an id.');
  return path.replace(':id', encodeURIComponent(id));
}

async function runAction(ctx, input) {
  const action = ACTIONS[input.action];
  if (!action) throw new Error(`Unknown action ${input.action}`);
  if (action.roles && !action.roles.includes(ctx.user.role)) throw new Error(`Your role (${ctx.user.role}) cannot run ${input.action}.`);
  const body = { ...(input.data || {}) };
  if (action.idInBody) body[action.idInBody] = input.id || body[action.idInBody];
  const result = await api(ctx, action.method, fill(action.path, input.id), body);
  return compact(result);
}

export async function executeTool(ctx, name, input = {}) {
  switch (name) {
    case 'query_records': return queryRecords(ctx, input);
    case 'get_record': return getRecord(ctx, input);
    case 'create_record': {
      const r = RESOURCES[input.resource];
      if (!r?.verbs.includes('create')) throw new Error(`Creating ${input.resource} is not supported. Check the catalog for a matching action.`);
      const record = await api(ctx, 'POST', r.path, input.data || {});
      ctx.emit?.('changed', { resource: input.resource });
      return { created: true, id: record?.[r.idField], record: compact(record), page: r.detailPage ? r.detailPage.replace(':id', record?.[r.idField]) : r.page };
    }
    case 'update_record': {
      const r = RESOURCES[input.resource];
      if (!r?.verbs.includes('update')) throw new Error(`${input.resource} cannot be edited directly; use run_action.`);
      const record = await api(ctx, 'PATCH', `${r.path}/${encodeURIComponent(input.id)}`, input.data || {});
      ctx.emit?.('changed', { resource: input.resource });
      return { updated: true, record: compact(record) };
    }
    case 'delete_record': {
      const r = RESOURCES[input.resource];
      if (!r?.verbs.includes('delete')) throw new Error(`${input.resource} cannot be deleted.`);
      const result = await api(ctx, 'DELETE', `${r.path}/${encodeURIComponent(input.id)}`);
      ctx.emit?.('changed', { resource: input.resource });
      return result;
    }
    case 'run_action': {
      const result = await runAction(ctx, input);
      if (ACTIONS[input.action]?.write) ctx.emit?.('changed', { action: input.action });
      return result;
    }
    case 'get_report': {
      const report = REPORTS[input.report];
      if (!report) throw new Error(`Unknown report ${input.report}`);
      if (!report.roles.includes(ctx.user.role)) throw new Error(`The ${input.report} report is not available for your role.`);
      return compact(await api(ctx, 'GET', report.path(ctx.user)));
    }
    case 'bulk_build': return runBulkBuild(ctx, input, ctx.currentToolId);
    case 'navigate': {
      const path = String(input.path || '').trim();
      if (!path.startsWith('/')) throw new Error('Path must start with "/".');
      if (!pageAllowed(ctx.user.role, path)) throw new Error(`${path} is not available for your role.`);
      ctx.emit?.('navigate', { path, highlight: input.highlight || null });
      return { navigated: true, path };
    }
    default: throw new Error(`Unknown tool ${name}`);
  }
}
