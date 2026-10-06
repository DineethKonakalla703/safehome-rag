import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmbedding, embeddingStatus } from '../ai/rag/embeddingService.js';
import { canUseIntent, sensitiveIntent } from '../ai/chatbot/permissionGuard.js';
import { fallbackChatIntent } from '../ai/aiFallbackRules.js';
import { sanitizeInput } from '../middleware/security.js';

test('embeddingService provides status and generates local feature embeddings or empty fallback', async () => {
  const status = embeddingStatus();
  assert.equal(typeof status.provider, 'string');
  assert.equal(typeof status.enabled, 'boolean');

  const embedding = await createEmbedding('water leak near elevator');
  assert.ok(Array.isArray(embedding));
});

test('chatbot fallback detects CRUD intents requiring confirmation', () => {
  const ticketIntent = fallbackChatIntent('Raise a complaint about broken pipe');
  assert.equal(ticketIntent.intent, 'CREATE_TICKET');
  assert.equal(ticketIntent.requiresConfirmation, true);

  const noticeIntent = fallbackChatIntent('Publish notice about maintenance tomorrow');
  assert.equal(noticeIntent.intent, 'CREATE_NOTICE');
  assert.equal(noticeIntent.requiresConfirmation, true);

  const billIntent = fallbackChatIntent('Generate bill for ticket TK001');
  assert.equal(billIntent.intent, 'GENERATE_BILL');
  assert.equal(billIntent.entities.ticketId, 'TK001');
  assert.equal(billIntent.requiresConfirmation, true);

  const assignIntent = fallbackChatIntent('Assign technician T001 to ticket TK002');
  assert.equal(assignIntent.intent, 'ASSIGN_TECHNICIAN');
  assert.equal(assignIntent.entities.ticketId, 'TK002');
  assert.equal(assignIntent.entities.technicianId, 'T001');
  assert.equal(assignIntent.requiresConfirmation, true);
});

test('permission guard correctly scopes expanded CRUD actions', () => {
  assert.equal(canUseIntent('RESIDENT', 'CREATE_TICKET'), true);
  assert.equal(canUseIntent('RESIDENT', 'GENERATE_BILL'), false);
  assert.equal(canUseIntent('RESIDENT', 'ASSIGN_TECHNICIAN'), false);
  assert.equal(canUseIntent('MAIN_ADMIN', 'GENERATE_BILL'), true);
  assert.equal(canUseIntent('MAIN_ADMIN', 'ASSIGN_TECHNICIAN'), true);
  assert.equal(canUseIntent('BLOCK_SUB_ADMIN', 'ASSIGN_TECHNICIAN'), true);

  assert.equal(sensitiveIntent('CREATE_TICKET'), true);
  assert.equal(sensitiveIntent('ASSIGN_TECHNICIAN'), true);
  assert.equal(sensitiveIntent('GENERATE_BILL'), true);
  assert.equal(sensitiveIntent('SHOW_INCIDENTS'), false);
});

test('security sanitizer strips dangerous NoSQL operator keys and null bytes', () => {
  const req = {
    body: {
      username: 'resident\0user',
      $where: 'malicious',
      nested: {
        'a.b': 'badKey',
        valid: 'safeValue',
      },
    },
  };
  sanitizeInput(req, {}, () => {});
  assert.equal(req.body.username, 'residentuser');
  assert.equal(req.body.$where, undefined);
  assert.equal(req.body.nested['a.b'], undefined);
  assert.equal(req.body.nested.valid, 'safeValue');
});
