## 2025-02-14 - Prompt Injection Mitigation
**Vulnerability:** User-controlled inputs (URL, strain names, username) were interpolated directly into LLM prompts without sanitization, allowing for Prompt Injection attacks.
**Learning:** String interpolation is dangerous for LLM prompts just like it is for SQL queries.
**Prevention:** Always sanitize inputs (escape quotes, remove control characters) before placing them in a prompt context. Added `sanitizeForPrompt` helper.
