import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseIntent, sensitiveIntent } from '../ai/chatbot/permissionGuard.js';
import { parseResidentWorkbook } from '../utils/excelParser.js';
import { validImageSignature } from '../middleware/imageUpload.js';
import { scoreVendor } from '../ai/vendorRecommender.js';
import { formatCitations } from '../ai/rag/answerGenerator.js';
import { classifyIncidentCategory } from '../ai/collectiveIncidentDetector.js';

test('Integration: role permissions enforce strict boundary between Resident and Admin', () => {
  // Resident cannot generate bills or bulk import
  assert.equal(canUseIntent('RESIDENT', 'GENERATE_BILL'), false);
  assert.equal(canUseIntent('RESIDENT', 'BULK_CREATE_BLOCK_RESIDENTS'), false);
  assert.equal(canUseIntent('RESIDENT', 'CREATE_NOTICE'), false);

  // Resident can create complaints, visitor requests, and view bills
  assert.equal(canUseIntent('RESIDENT', 'CREATE_TICKET'), true);
  assert.equal(canUseIntent('RESIDENT', 'CREATE_VISITOR_REQUEST'), true);
  assert.equal(canUseIntent('RESIDENT', 'SHOW_BILLS'), true);

  // Main Admin has full capabilities
  assert.equal(canUseIntent('MAIN_ADMIN', 'BULK_CREATE_BLOCK_RESIDENTS'), true);
  assert.equal(canUseIntent('MAIN_ADMIN', 'GENERATE_BILL'), true);
  assert.equal(canUseIntent('MAIN_ADMIN', 'CREATE_BLOCK'), true);
});

test('Integration: sensitive write operations require explicit human confirmation', () => {
  const sensitiveList = [
    'CREATE_TICKET',
    'CREATE_BLOCK',
    'CREATE_APARTMENT',
    'CREATE_RESIDENT',
    'CREATE_NOTICE',
    'GENERATE_BILL',
    'CREATE_VISITOR_REQUEST',
    'CREATE_AMENITY_BOOKING',
    'UPDATE_TICKET_STATUS',
    'ASSIGN_TECHNICIAN',
    'BULK_CREATE_BLOCK_RESIDENTS',
  ];

  for (const intent of sensitiveList) {
    assert.equal(sensitiveIntent(intent), true, `${intent} must be marked as sensitive requiring confirmation`);
  }

  // Pure query intents must NOT require confirmation
  assert.equal(sensitiveIntent('SHOW_TICKETS'), false);
  assert.equal(sensitiveIntent('SHOW_BILLS'), false);
  assert.equal(sensitiveIntent('QUERY_KNOWLEDGE'), false);
});

test('Integration: Excel file signature validation rejects corrupt or non-office files', () => {
  const fakeBuffer = Buffer.from('NOT_AN_EXCEL_FILE_CONTENT_AT_ALL');
  assert.throws(() => parseResidentWorkbook(fakeBuffer), {
    message: 'Excel file signature is invalid.',
  });
});

test('Integration: Image signature validation correctly verifies JPEG, PNG, and WebP magic bytes', () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webpHeader = Buffer.from('RIFF1234WEBPVP8 ');
  const invalidHeader = Buffer.from('<html><body>malware</body></html>');

  assert.equal(validImageSignature(jpegHeader, 'image/jpeg'), true);
  assert.equal(validImageSignature(pngHeader, 'image/png'), true);
  assert.equal(validImageSignature(webpHeader, 'image/webp'), true);
  assert.equal(validImageSignature(invalidHeader, 'image/jpeg'), false);
  assert.equal(validImageSignature(invalidHeader, 'image/png'), false);
});

test('Integration: Multi-attribute vendor scoring prioritizes rating, cost, warranty, and emergency', () => {
  const ticket = { category: 'Plumbing', severity: 'Critical' };

  const vendorA = {
    category: 'Plumbing',
    rating: 4.9,
    hourlyRate: 400,
    warrantyPeriodMonths: 12,
    emergencyAvailable: true,
  };

  const vendorB = {
    category: 'Plumbing',
    rating: 3.5,
    hourlyRate: 1500,
    warrantyPeriodMonths: 0,
    emergencyAvailable: false,
  };

  const { score: scoreA } = scoreVendor(vendorA, ticket);
  const { score: scoreB } = scoreVendor(vendorB, ticket);

  assert.ok(scoreA > scoreB, `Vendor A (${scoreA}) should outscore Vendor B (${scoreB})`);
  assert.ok(scoreA >= 80, 'Top vendor should have score >= 80');
});

test('Integration: Grounded knowledge citation formatting properly produces source citations', () => {
  const chunks = [
    { chunkId: 'KCH001', documentId: 'KDOC001', sourceTitle: 'Electrical SOP', content: 'Turn off mains.' },
    { chunkId: 'KCH002', documentId: 'KDOC002', sourceTitle: 'Water SOP', content: 'Shut main valve.' },
  ];

  const citations = formatCitations(chunks);
  assert.equal(citations.length, 2);
  assert.equal(citations[0].citation, '[KDOC001-C0]');
  assert.equal(citations[1].citation, '[KDOC002-C1]');
  assert.equal(citations[0].title, 'Electrical SOP');
});

test('Integration: Collective incident categorization correctly groups gas and fire keywords', () => {
  const gasTicket = { title: 'LPG cylinder smell in corridor', description: 'Strong gas smell reported.' };
  const fireTicket = { title: 'Smoke observed near meter room', description: 'Burning plastic smell and dark smoke.' };

  assert.equal(classifyIncidentCategory(gasTicket).category, 'gas-safety');
  assert.equal(classifyIncidentCategory(fireTicket).category, 'fire-safety');
});
