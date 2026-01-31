## 2026-01-31 - LLM Prompt Injection Prevention
**Vulnerability:** User inputs (UserName, URL, etc.) were interpolated directly into LLM system prompts. This allows "Prompt Injection" where a user can override system instructions by injecting newlines and new commands.
**Learning:** Sanitization for LLMs requires "flattening" (removing newlines) to prevent structure injection, not just character escaping.
**Prevention:** Implemented `sanitizeForPrompt` in `services/security.ts` to flatten and trim all user inputs before they reach the LLM context.
