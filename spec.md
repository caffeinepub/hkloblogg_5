# HKLOblogg

## Current State
Admin panel has a Kategorier (Categories) tab where superadmin can:
- Create new categories
- Hide/show categories (eye icon)
- Manage whitelist for hidden categories (person icon)
- Delete categories

Backend (Fas 1 complete) now supports:
- `setCategorySchedule(categoryId, enabled, weekday, hour)` - set schedule per category
- `getCategorySchedule(categoryId)` - get schedule for a category (returns CategorySchedule | null)
- `listCleanupLogs(categoryId | null)` - list cleanup logs (optionally filtered by category)

CategorySchedule type: `{ enabled: boolean, weekday: bigint (0=Mon..6=Sun), hour: bigint (0-23 UTC), lastRunAt: bigint | null }`
CleanupLog type: `{ id: bigint, categoryId: string, categoryName: string, ranAt: Time, postsDeleted: bigint, commentsDeleted: bigint, mediaDeleted: bigint }`

## Requested Changes (Diff)

### Add
- In the CategoryRow component: a clock/timer icon button that opens a schedule panel (similar to how whitelist panel works)
- The schedule panel allows:
  - Toggle enabled/disabled (switch or checkbox)
  - Select weekday (Måndag, Tisdag, Onsdag, Torsdag, Fredag, Lördag, Söndag)
  - Select hour (0-23, displayed as HH:00)
  - Save button that calls `setCategorySchedule`
  - Show when schedule last ran (from `lastRunAt` field)
- A cleanup log section at the bottom of the categories tab showing recent cleanup history (calls `listCleanupLogs(null)` to get all)

### Modify
- `CategoryRow`: load schedule data for each category via `getCategorySchedule`, show schedule panel when clock icon clicked
- `AdminPanel.tsx`: add cleanup log section in categories tab, import new backend types
- `backend.d.ts`: already updated with new types and methods

### Remove
- Nothing

## Implementation Plan
1. Add `useGetCategorySchedule` and `useSetCategorySchedule` and `useListCleanupLogs` hooks in useQueries.ts
2. Update CategoryRow to include a clock icon button and expandable schedule panel
3. Load schedule on panel open and allow editing + saving
4. Add cleanup log table at bottom of categories tab in AdminPanel
5. Validate and build
