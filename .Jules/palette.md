## 2025-05-18 - Empty States & A11y
**Learning:** Adding explicit empty states transforms a "broken-looking" empty page into a helpful onboarding moment.
**Action:** Always implement a dedicated `EmptyState` component for lists, providing a clear call-to-action.

**Learning:** `aria-label` or `title` on icon-only buttons is not just for screen readers; it's essential for robust automated testing (locating elements by role/name).
**Action:** Enforce `aria-label` on all icon-only buttons during development.
