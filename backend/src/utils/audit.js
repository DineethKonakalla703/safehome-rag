import AuditLog from '../models/AuditLog.js';

export function writeAudit({ action, entityType, entityId, actorId, message }) {
  return AuditLog.create({ action, entityType, entityId, actorId, message });
}
