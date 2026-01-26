## 2025-05-15 - [Vite Build & Code Splitting]
**Learning:** `index.html` was missing the module script entry point (`<script type="module" src="/index.tsx"></script>`), causing `vite build` to produce an empty bundle without errors. Always verify `index.html` structure when build artifacts look suspicious.
**Action:** Check `index.html` for valid entry point when build output is unexpectedly small.

**Learning:** Route components were eager loaded in `App.tsx` causing large initial bundle. `React.lazy` with named exports requires a specific pattern: `import(...).then(module => ({ default: module.NamedExport }))`.
**Action:** Use this pattern for code splitting without refactoring components to default exports.
