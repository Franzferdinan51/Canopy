## 2024-05-22 - Manual Code Splitting for State-Based Routing
**Learning:** This app uses state-based routing (`currentView` state) instead of a library like `react-router`. Standard route-based splitting guides often assume a Router. Here, we must apply `React.lazy` to the components and wrap the entire conditional rendering block in `Suspense`.
**Action:** When optimizing state-based views, wrap the entire switch/conditional block in a single `Suspense` boundary to avoid layout shifts or multiple spinners.
