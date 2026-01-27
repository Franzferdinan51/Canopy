## 2025-05-23 - [Initial Sentinel Setup]
**Vulnerability:** Missing security journal.
**Learning:** Security learnings need to be tracked.
**Prevention:** Created .jules/sentinel.md.

## 2025-05-23 - [Prompt Injection Defense]
**Vulnerability:** Indirect Prompt Injection via User Input (URL, Inventory Names).
**Learning:** `new URL()` strips control characters, making it insufficient for validating strings used in prompts. Custom strict validation is required.
**Prevention:** Implemented strict URL validation and generic prompt input sanitization.
