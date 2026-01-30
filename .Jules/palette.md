## 2024-05-22 - Empty State Persistence
**Learning:** Initializing state from localStorage with a fallback to default data often prevents users from persisting an empty state (e.g., deleting all items). The check `if (data && data.length > 0)` is too strict for user-controlled lists.
**Action:** Use `if (Array.isArray(data))` instead to respect empty arrays as valid user states.
