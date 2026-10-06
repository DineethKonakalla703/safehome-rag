export const getAIConfig = () => ({
  provider: process.env.AI_PROVIDER || 'claude',
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  fallbackEnabled: String(process.env.AI_FALLBACK_ENABLED ?? 'true').toLowerCase() !== 'false',
});

// Retain the object-shaped export for callers while resolving every value lazily.
export const aiConfig = {
  get provider() { return getAIConfig().provider; },
  get model() { return getAIConfig().model; },
  get apiKey() { return getAIConfig().apiKey; },
  get fallbackEnabled() { return getAIConfig().fallbackEnabled; },
};

export const aiAvailable = () => Boolean(getAIConfig().apiKey);
