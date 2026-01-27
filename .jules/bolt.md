## 2024-05-23 - Vite Build and Entry Points
**Learning:** `vite build` may produce an empty build (only copying public assets) if `index.html` is missing the `<script type="module" src="...">` entry point and no input is configured in `vite.config.ts`. Always verify `index.html` has the correct entry point.
**Action:** Check `index.html` for valid entry point scripts before debugging build output issues.
