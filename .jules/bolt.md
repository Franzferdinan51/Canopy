## 2024-05-22 - Code Splitting Named Exports
**Learning:** `React.lazy` expects the default export. When lazy loading components that use Named Exports (e.g. `export const Dashboard`), you must map the module manually: `React.lazy(() => import('./path').then(module => ({ default: module.ComponentName })))`.
**Action:** Always verify export type before implementing `React.lazy`. Use the mapping pattern for named exports to avoid "Element type is invalid" errors.
