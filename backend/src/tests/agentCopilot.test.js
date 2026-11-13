import test from 'node:test';
import assert from 'node:assert/strict';
import { pageAllowed, catalogText } from '../ai/agent/catalog.js';
import { toolNeedsApproval, toolIsDestructive, TOOL_DEFINITIONS } from '../ai/agent/tools.js';

test('agent navigation is restricted to pages the role can open', () => {
  assert.equal(pageAllowed('MAIN_ADMIN', '/audit-logs'), true);
  assert.equal(pageAllowed('RESIDENT', '/audit-logs'), false);
  assert.equal(pageAllowed('RESIDENT', '/tickets/TK001'), true);
  assert.equal(pageAllowed('SECURITY', '/tickets/TK001'), false);
  assert.equal(pageAllowed('TECHNICIAN', '/tickets/'), false);
});

test('agent writes need approval; reads and navigation do not', () => {
  assert.equal(toolNeedsApproval('query_records', { resource: 'tickets' }), false);
  assert.equal(toolNeedsApproval('navigate', { path: '/tickets' }), false);
  assert.equal(toolNeedsApproval('create_record', { resource: 'notices' }), true);
  assert.equal(toolNeedsApproval('run_action', { action: 'ticket_assign_technician' }), true);
  assert.equal(toolNeedsApproval('run_action', { action: 'knowledge_query' }), false);
});

test('deletes and bulk billing are destructive and never auto-approved', () => {
  assert.equal(toolIsDestructive('delete_record', { resource: 'blocks' }), true);
  assert.equal(toolIsDestructive('run_action', { action: 'bills_generate_monthly' }), true);
  assert.equal(toolIsDestructive('create_record', { resource: 'notices' }), false);
});

test('tool catalog describes schema fields for the model', () => {
  const text = catalogText();
  assert.match(text, /tickets \[list,get,create\] id=ticketId/);
  assert.match(text, /status\(New\|Assigned\|In Progress\|Resolved\|Closed\)/);
  assert.ok(TOOL_DEFINITIONS.every((tool) => tool.name && tool.input_schema?.type === 'object'));
});

test('bulk_build planner multiplies nested counts and checks expected totals', async () => {
  const { planBulkBuild } = await import('../ai/agent/tools.js');
  const nodes = [{ resource: 'communities', count: 4, data: { name: 'C{n}', address: 'X' }, children: [
    { resource: 'blocks', count: 3, data: { name: 'Block {letter}', communityId: '@parent.communityId' }, children: [
      { resource: 'apartments', count: 10, start: 101, data: { number: '{n}', blockId: '@parent.blockId' } }] }] }];
  const ok = planBulkBuild(nodes, { communities: 4, blocks: 12, apartments: 120 });
  assert.equal(ok.total, 136);
  assert.deepEqual(ok.byResource, { communities: 4, blocks: 12, apartments: 120 });
  assert.equal(ok.problems.length, 0);
  const wrong = planBulkBuild(nodes, { communities: 7, blocks: 21, apartments: 210 });
  assert.ok(wrong.problems.some((p) => /expected_totals/.test(p)));
  assert.ok(planBulkBuild([{ resource: 'apartments', count: 200, data: {}, children: [{ resource: 'parking-slots', count: 3, data: {} }] }]).problems.some((p) => /limit/.test(p)));
  assert.ok(planBulkBuild([{ resource: 'incidents', data: {} }]).problems.some((p) => /cannot be created/.test(p)));
});

test('community and operations modules are exposed per role', () => {
  for (const page of ['/staff', '/polls', '/events', '/sos', '/parcels', '/move-requests', '/forum']) assert.equal(pageAllowed('RESIDENT', page), true, page);
  assert.equal(pageAllowed('RESIDENT', '/maintenance'), false);
  assert.equal(pageAllowed('TECHNICIAN', '/maintenance'), true);
  assert.equal(pageAllowed('TECHNICIAN', '/forum'), false);
  assert.equal(pageAllowed('SECURITY', '/parcels'), true);
  for (const action of ['sos_raise', 'parcel_log', 'parcel_collect', 'move_approve', 'maintenance_mark_done', 'poll_vote', 'forum_comment']) {
    assert.equal(toolNeedsApproval('run_action', { action }), true, action);
  }
  const text = catalogText();
  for (const key of ['staff', 'ledger-entries', 'polls', 'events', 'sos-alerts', 'move-requests', 'parcels', 'maintenance-schedules', 'forum-posts']) assert.ok(text.includes(`- ${key} [`), key);
  assert.equal(text.split('\n').filter((l) => l.includes('pickupCode') && !l.startsWith('- parcel_collect')).length, 0, 'pickup codes stay out of the parcel schema');
});
