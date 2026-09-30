export function analyzeComplaint(description = '') {
  const text = description.toLowerCase();
  if (text.includes('water') && text.includes('electrical')) {
    return { category: 'Plumbing + Electrical Risk', severity: 'High', safetyRisk: true, suggestedAction: 'Immediate escalation required. Assign electrician and plumber.', humanApprovalRequired: true };
  }
  if (text.includes('lift')) {
    return { category: 'Lift Maintenance', severity: 'High', safetyRisk: true, suggestedAction: 'Escalate to facility manager and lift technician.', humanApprovalRequired: true };
  }
  if (text.includes('light') || text.includes('bulb')) {
    return { category: 'Electrical', severity: 'Medium', safetyRisk: false, suggestedAction: 'Assign electrician.', humanApprovalRequired: false };
  }
  return { category: 'General Maintenance', severity: 'Low', safetyRisk: false, suggestedAction: 'Assign general maintenance technician.', humanApprovalRequired: false };
}
