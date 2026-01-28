## 2025-05-15 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** The application frequently uses icon-only buttons (e.g., Edit, Delete, Close, Sidebar Toggle) without `aria-label` attributes. This makes the app difficult to navigate for screen reader users as they only hear "button" or the icon name if exposed.
**Action:** When creating or modifying icon-only buttons, always ensure an `aria-label` describing the action is present. Also, ensure decorative icons are hidden or have meaningful text alternatives if they are the only content.
