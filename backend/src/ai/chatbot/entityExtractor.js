export function normalizeEntities(intent, entities = {}, message = '') {
  const ticketId = entities.ticketId || (message.match(/TK\d+/i) || [])[0];
  const blockName = entities.blockName || (message.match(/block\s+(?:named\s+)?([a-z0-9-]+)/i) || [])[1];
  return { ...entities, ...(ticketId ? { ticketId: String(ticketId).toUpperCase() } : {}), ...(blockName ? { blockName: String(blockName).toUpperCase() } : {}), question: entities.question || (intent === 'QUERY_KNOWLEDGE' ? message : entities.question) };
}
