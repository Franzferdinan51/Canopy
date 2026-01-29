## 2024-05-23 - Critical Missing Entry Point
**Learning:** The `index.html` file was missing the `<script type="module" src="/index.tsx"></script>` tag, which caused Vite builds to fail silently (producing only HTML) or incompletely.
**Action:** Always verify `index.html` structure when "assets not found" or empty build outputs occur.

## 2024-05-23 - Heavy Service Dependency
**Learning:** `geminiService.ts` imports `@google/genai` which is ~260kB. Using dynamic imports (`await import(...)`) for this service in `App.tsx` and lazy-loading components significantly reduces the main bundle size.
**Action:** Use dynamic imports for AI services that are not required for the initial render.
