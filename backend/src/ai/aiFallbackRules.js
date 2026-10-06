const hasAny = (text, terms) => terms.some((term) => text.includes(term));

export function fallbackComplaintAnalysis({ title = '', description = '', category = '' }) {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const base = { missingInfo: [], confidence: 0.72, provider: 'rules', modelVersion: 'fallback-v2', fallbackUsed: true };
  if (text.includes('water') && hasAny(text, ['electrical', 'switchboard', 'current', 'spark'])) return { ...base, category: 'Plumbing + Electrical Risk', severity: 'Critical', safetyRisk: true, safetyRiskType: 'Water near electrical equipment', suggestedAction: 'Isolate the area, avoid electrical contact, and obtain human approval for an electrician and plumber response.', confidence: 0.98 };
  if (hasAny(text, ['gas smell', 'gas leak', 'lpg leak'])) return { ...base, category: 'Gas Safety', severity: 'Critical', safetyRisk: true, safetyRiskType: 'Suspected gas leak', suggestedAction: 'Avoid switches or flames, ventilate if safe, evacuate the area, and escalate to emergency maintenance.', confidence: 0.98 };
  if (hasAny(text, ['fire', 'smoke', 'electrical spark', 'sparks'])) return { ...base, category: 'Fire/Electrical Safety', severity: 'Critical', safetyRisk: true, safetyRiskType: 'Fire or electrical hazard', suggestedAction: 'Keep people away, contact emergency services if required, and escalate for immediate human response.', confidence: 0.96 };
  if (text.includes('lift') && hasAny(text, ['stuck', 'trapped', 'person'])) return { ...base, category: 'Lift Emergency', severity: 'Critical', safetyRisk: true, safetyRiskType: 'Person trapped in lift', suggestedAction: 'Contact lift emergency support and security immediately. Do not force the doors.', confidence: 0.97 };
  if (hasAny(text, ['structural crack', 'wall crack', 'ceiling crack'])) return { ...base, category: 'Structural Safety', severity: 'High', safetyRisk: true, safetyRiskType: 'Possible structural damage', suggestedAction: 'Restrict access and arrange urgent inspection by qualified facility personnel.', confidence: 0.9 };
  if (hasAny(text, ['no water', 'water supply'])) return { ...base, category: 'Plumbing', severity: 'High', safetyRisk: false, safetyRiskType: null, suggestedAction: 'Inspect supply, pumps, valves, and affected units; notify residents if the issue is shared.', confidence: 0.84 };
  if (hasAny(text, ['garbage', 'cleaning', 'waste'])) return { ...base, category: 'Housekeeping', severity: 'Low', safetyRisk: false, safetyRiskType: null, suggestedAction: 'Assign housekeeping and confirm completion.', confidence: 0.84 };
  if (text.includes('parking')) return { ...base, category: 'Parking', severity: 'Low', safetyRisk: false, safetyRiskType: null, suggestedAction: 'Verify the vehicle and slot allocation before administrative action.', confidence: 0.82 };
  if (hasAny(text, ['light', 'bulb', 'power'])) return { ...base, category: 'Electrical', severity: 'Medium', safetyRisk: false, safetyRiskType: null, suggestedAction: 'Assign an electrician and verify the affected circuit.', confidence: 0.8 };
  return { ...base, category: category || 'General Maintenance', severity: 'Low', safetyRisk: false, safetyRiskType: null, missingInfo: ['Please provide the exact location and any visible damage.'], suggestedAction: 'Review the complaint and assign general maintenance.', confidence: 0.62 };
}

export function fallbackChatIntent(message = '') {
  const text = message.toLowerCase();
  if ((text.includes('block') || text.includes('residents')) && (text.includes('excel') || text.includes('sheet'))) return { intent: 'BULK_CREATE_BLOCK_RESIDENTS', entities: { blockName: (message.match(/block\s+(?:named\s+)?([a-z0-9-]+)/i) || [])[1] || '' }, requiresConfirmation: true, response: 'I can prepare a validated import preview before any records are created.' };
  if (text.includes('recommend') && text.includes('technician')) return { intent: 'RECOMMEND_TECHNICIAN', entities: { ticketId: (message.match(/TK\d+/i) || [])[0]?.toUpperCase() }, requiresConfirmation: false, response: 'I can generate ranked technician recommendations for an authorized administrator.' };
  if (text.includes('sla')) return { intent: 'PREDICT_SLA_RISK', entities: { ticketId: (message.match(/TK\d+/i) || [])[0]?.toUpperCase() }, requiresConfirmation: false, response: 'I can calculate the current SLA breach risk.' };
  if (text.includes('bill')) return { intent: 'SHOW_BILLS', entities: {}, requiresConfirmation: false, response: 'I will retrieve bills within your access scope.' };
  if (text.includes('work order')) return { intent: 'SHOW_WORK_ORDERS', entities: {}, requiresConfirmation: false, response: 'I will retrieve assigned work orders within your access scope.' };
  if (text.includes('visitor')) return { intent: 'SHOW_VISITORS', entities: {}, requiresConfirmation: false, response: 'I will retrieve visitor records within your access scope.' };
  if (text.includes('report')) return { intent: 'SHOW_REPORT_SUMMARY', entities: {}, requiresConfirmation: false, response: 'I will retrieve an authorized report summary.' };
  if (hasAny(text, ['sop', 'safety', 'knowledge', 'procedure', 'manual'])) return { intent: 'QUERY_KNOWLEDGE', entities: { question: message }, requiresConfirmation: false, response: 'I will search authorized knowledge sources.' };
  if (text.includes('ticket') || text.includes('complaint')) return { intent: 'SHOW_TICKETS', entities: { status: text.includes('unresolved') ? 'open' : undefined }, requiresConfirmation: false, response: 'I will retrieve tickets within your access scope.' };
  return { intent: 'UNKNOWN', entities: {}, requiresConfirmation: false, response: 'I could not map that request to a supported CRM action.' };
}
