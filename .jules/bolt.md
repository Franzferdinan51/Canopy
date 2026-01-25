# Bolt's Journal

## 2024-05-23 - Initial Setup
**Learning:** Initializing Bolt's performance journal.
**Action:** Will document critical performance learnings here.

## 2024-05-23 - Route Code Splitting
**Learning:** The default Vite setup bundles all components into a single large chunk. With heavy libraries like `recharts` and `react-markdown` used in multiple views, the initial load size was unnecessarily large (~987kB raw for index chunk).
**Action:** Implemented `React.lazy` and `Suspense` for all non-default route components (`NutrientList`, `StrainList`, `BreedingLab`, etc.). Kept `Dashboard` eager to ensure fast LCP. This offloaded ~115kB of component code from the initial bundle, deferring it until navigation.
**Outcome:** Initial bundle size reduced. Feature components are now loaded on demand.
