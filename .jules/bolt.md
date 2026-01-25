## 2025-05-20 - Lazy Loading Named Exports
**Learning:** `React.lazy` only supports default exports. To lazy load named exports, you must use an intermediate Promise that resolves to an object with a `default` property: `import('./Comp').then(module => ({ default: module.Comp }))`.
**Action:** Use this pattern when lazy loading components that are not default exports to avoid refactoring the component files themselves.

## 2025-05-20 - Vite Entry Point
**Learning:** Vite requires an explicit `<script type="module" src="/src/main.tsx">` (or similar) in `index.html` to bootstrap the React app. Without it, the app will serve a blank page.
**Action:** Always check `index.html` for the entry script if the app fails to load.
