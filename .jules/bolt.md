# Bolt's Journal

This journal tracks critical performance learnings and decisions.

## 2024-05-23 - [Optimization Strategy]
**Learning:** React Component Memoization
**Action:** Extracting complex list items into memoized components prevents unnecessary re-renders of the entire list when parent state changes. This is particularly effective in lists with complex sub-trees or when the parent component manages frequent state updates (like modals or inputs).
