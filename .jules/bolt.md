## 2025-05-23 - List Virtualization & Memoization
**Learning:** Large lists in this codebase (like `StrainList` and `NutrientList`) are rendered without virtualization. Extracting list items into `React.memo` components and wrapping handlers in `useCallback` significantly reduces re-renders when editing a single item.
**Action:** Apply this pattern to `NutrientList` and other large data grids in future optimizations.
