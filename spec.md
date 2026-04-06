# hkloblogg-dol

## Current State

The blog has a standard single-column layout. All pages (FeedPage, PostView, MittFlodePage, ProfilePage, SearchPage, AdminPanel) use a `max-w-3xl mx-auto` container. There is no sidebar. The backend provides `listPosts()` which returns all posts including `likeCount` (bigint) and `listComments(postId)` which returns all comments for a post. No view count field exists.

## Requested Changes (Diff)

### Add
- `TopPostsSidebar` component: a permanent sticky right-side panel visible on all authenticated pages
  - Two tabs: "Most Liked" and "Most Commented" (top 10 each, all time)
  - Most Liked: sorts all posts by `likeCount` descending, shows top 10
  - Most Commented: requires fetching all posts then comment counts per post -- since this is expensive, use a lightweight approach: fetch all posts and sort by comment count using cached `useListComments` calls, OR show a simplified list sorted by likeCount as fallback and fetch comment counts progressively
  - Each item shows: post title (truncated), author name, like/comment count
  - Clicking an item navigates to that post
  - On mobile (< lg breakpoint): sidebar collapses to a collapsible section below the main content
  - Styled to match the existing blue/grey palette

### Modify
- `App.tsx`: wrap authenticated views (FeedPage, PostView, PostForm, MittFlodePage, ProfilePage, SearchPage) in a two-column layout (main content left, sidebar right) on desktop. The sidebar receives `onPost` callback for navigation.
- All page layouts: keep their existing `max-w` containers; the outer shell in App.tsx provides the sidebar column

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/components/TopPostsSidebar.tsx`
   - Uses `useListPosts(null)` to fetch all posts
   - For "Most Liked" tab: sorts posts by `likeCount` descending, top 10
   - For "Most Commented" tab: uses a helper that calls `listComments` for each post and sorts by count -- to avoid N backend calls on mount, fetch all posts and for each post use the already-cached `useListComments` hook data. Since React Query caches results, this is efficient if comment data is already fetched. If not cached, show likeCount as fallback and load progressively.
   - Two-tab UI using shadcn Tabs component
   - Sticky positioning on desktop, collapsible section on mobile
   - `onPost(postId)` callback for navigation

2. Modify `App.tsx`
   - Add a layout wrapper for authenticated views that renders a two-column grid (main content + sidebar)
   - Pass `onPost` to `TopPostsSidebar`
   - Only show sidebar when user is authenticated and has a profile (not on login/loading screens)

3. i18n: add translation keys for sidebar labels ("Most Liked", "Most Commented", "Top Posts") to all 5 language files
