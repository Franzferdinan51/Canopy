## 2024-05-22 - CSP Implementation Constraints
**Vulnerability:** Lack of Content Security Policy (CSP) allowed potential XSS and loading of unauthorized resources.
**Learning:** The application relies on `cdn.tailwindcss.com` with an inline script configuration, and `importmap` pointing to `aistudiocdn.com`. This forces the CSP to include `'unsafe-inline'` for scripts and styles, which weakens XSS protection.
**Prevention:** In the future, move Tailwind configuration to a build step (PostCSS) and bundle dependencies locally to remove the need for CDN and inline scripts, allowing a stricter CSP.
