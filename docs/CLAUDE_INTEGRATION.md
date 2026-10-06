# Claude Integration

Configure only the backend:

```env
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-3-5-sonnet-latest
AI_PROVIDER=claude
AI_FALLBACK_ENABLED=true
```

`claudeClient.js` requests JSON-only output and parses plain JSON or JSON enclosed in accidental markdown fences. Missing keys, invalid values, parse errors, API errors, or a missing API key cause the caller to use a safe fallback value. Errors are logged without secrets.

The API key is never returned by an endpoint or exposed through Vite variables.
