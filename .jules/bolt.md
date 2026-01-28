## 2024-05-22 - Code Splitting Route Components
**Learning:** Code splitting route components significantly reduces initial bundle size. When using named exports, use the pattern `React.lazy(() => import('./path').then(module => ({ default: module.Component })))`.
**Action:** Always verify if components are default or named exports before applying `React.lazy`.

## 2024-05-22 - Vite Build Entry Point
**Learning:** Vite builds may silently fail to include JS bundles if the `index.html` does not contain a `<script type="module" src="...">` tag pointing to the entry file, even if `vite dev` works (often due to dev server magic).
**Action:** Ensure `index.html` has the correct entry point script tag.
