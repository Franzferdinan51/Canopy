## 2024-05-23 - Inline List Rendering
**Learning:** Rendering complex list items inline within a component that handles frequent state changes (like forms) causes the entire list to re-render on every keystroke.
**Action:** Extract list items to memoized components (`React.memo`) and wrap handlers in `useCallback` to ensure referential stability.
