import assert from 'node:assert/strict';
import test from 'node:test';
import { cosineSimilarity } from '../ai/rag/vectorStore.js';
import { classifyIncidentCategory } from '../ai/collectiveIncidentDetector.js';

test('cosineSimilarity calculates exact cosine distance for normalized vectors', () => {
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  const vecC = [0, 1, 0];

  assert.equal(Math.round(cosineSimilarity(vecA, vecB) * 100) / 100, 1);
  assert.equal(Math.round(cosineSimilarity(vecA, vecC) * 100) / 100, 0);
  assert.equal(cosineSimilarity([], []), 0);
});

test('collective incident detector classifies water hazard near electrical switchboard into water family', () => {
  const ticket = {
    title: 'Water leaking through ceiling',
    description: 'Dripping water near electrical wiring in Flat B-101',
    category: 'Plumbing',
  };
  const result = classifyIncidentCategory(ticket);
  assert.equal(result.category, 'water-supply');
});

test('collective incident detector classifies lift failure into lift family', () => {
  const ticket = {
    title: 'Elevator stopped between floors',
    description: 'Lift panel display showing error code E-3',
    category: 'Lift',
  };
  const result = classifyIncidentCategory(ticket);
  assert.equal(result.category, 'lift-emergency');
});
