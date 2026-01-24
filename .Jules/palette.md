## 2026-01-24 - Accessibility for Floating Assistants
**Learning:** Floating assistant components often become accessibility traps if they lack proper labels for their icon-only controls (minimize, close, send). They are highly interactive but often forgotten in a11y sweeps.
**Action:** Always verify `aria-label`s on all interactive elements of floating widgets, especially those with dynamic states (like minimize/maximize).
