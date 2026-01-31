## 2024-05-23 - Critical Entry Point Fix
**Learning:** The `index.html` was missing the module entry point `<script type="module" src="/index.tsx"></script>`, preventing the app from mounting in dev mode. This is a critical setup requirement for Vite apps that was overlooked.
**Action:** Always check `index.html` for the entry script when a React/Vite app renders a blank page despite a successful build.
