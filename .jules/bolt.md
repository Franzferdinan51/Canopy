## 2026-01-24 - [State-Based Routing Lazy Loading]
**Learning:** The application uses a custom state-based router (`currentView`) instead of a library like `react-router`. This means standard route-splitting plugins won't work automatically.
**Action:** Must implement `React.lazy` manually for each view component in `App.tsx` and wrap the conditional rendering block in `Suspense`. Use `.then(module => ({ default: module.Component }))` for named exports.
