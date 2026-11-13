import { writeAudit } from '../utils/audit.js';

export const writeAIAudit = ({ action, entityType = 'AI', entityId, actorId = 'AI_SERVICE', message }) => writeAudit({ action, entityType, entityId, actorId, message });
