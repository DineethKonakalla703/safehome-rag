import assert from 'node:assert/strict';
import test from 'node:test';
import XLSX from 'xlsx';
import { fallbackChatIntent, fallbackComplaintAnalysis } from '../ai/aiFallbackRules.js';
import { parseClaudeJson } from '../ai/claudeJsonParser.js';
import { canUseIntent, sensitiveIntent } from '../ai/chatbot/permissionGuard.js';
import { parseResidentWorkbook } from '../utils/excelParser.js';
import { classifyIncidentCategory } from '../ai/collectiveIncidentDetector.js';

test('Claude JSON parser accepts plain and fenced JSON and rejects malformed output', () => {
  assert.deepEqual(parseClaudeJson('{"severity":"High"}'), { severity: 'High' });
  assert.deepEqual(parseClaudeJson('```json\n{"safetyRisk":true}\n```'), { safetyRisk: true });
  assert.equal(parseClaudeJson('not-json'), null);
});

test('fallback complaint rules classify water near electricity as critical', () => {
  const result = fallbackComplaintAnalysis({ description: 'Water is leaking near the electrical switchboard in A-102.' });
  assert.equal(result.category, 'Plumbing + Electrical Risk');
  assert.equal(result.severity, 'Critical');
  assert.equal(result.safetyRisk, true);
  assert.equal(result.fallbackUsed, true);
});

test('fallback chatbot recognizes bulk onboarding and requires confirmation', () => {
  const result = fallbackChatIntent('Add a new block named E using the uploaded Excel sheet');
  assert.equal(result.intent, 'BULK_CREATE_BLOCK_RESIDENTS');
  assert.equal(result.entities.blockName, 'E');
  assert.equal(result.requiresConfirmation, true);
});

test('fallback chatbot recognizes direct block creation and requires confirmation', () => {
  const result = fallbackChatIntent('Create a new block named C');
  assert.equal(result.intent, 'CREATE_BLOCK');
  assert.equal(result.entities.blockName, 'C');
  assert.equal(result.requiresConfirmation, true);
});

test('incident categories group different Claude wording into the same water family', () => {
  const first = classifyIncidentCategory({ category: 'Plumbing + Electrical Risk', description: 'Water near a switchboard' });
  const second = classifyIncidentCategory({ aiAnalysis: { category: 'Electrical & Plumbing - Combined Hazard' }, title: 'Leakage near wiring' });
  assert.equal(first.category, 'water-supply');
  assert.equal(second.category, first.category);
});

test('permission guard keeps billing from technicians and bulk import with Main Admin', () => {
  assert.equal(canUseIntent('TECHNICIAN', 'SHOW_BILLS'), false);
  assert.equal(canUseIntent('MAIN_ADMIN', 'BULK_CREATE_BLOCK_RESIDENTS'), true);
  assert.equal(canUseIntent('MAIN_ADMIN', 'CREATE_BLOCK'), true);
  assert.equal(canUseIntent('BLOCK_SUB_ADMIN', 'CREATE_BLOCK'), false);
  assert.equal(sensitiveIntent('BULK_CREATE_BLOCK_RESIDENTS'), true);
});

test('Excel parser normalizes expected resident headers', () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([{ 'Flat Number': 'E-101', 'Floor Number': '1', 'Resident Name': 'Review Resident', Phone: '9000000000' }]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Residents');
  const parsed = parseResidentWorkbook(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  assert.deepEqual(parsed.headers, ['flat_number', 'floor_number', 'resident_name', 'phone']);
  assert.equal(parsed.rows[0].flat_number, 'E-101');
});
