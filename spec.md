# HKLOblogg

## Current State
Fas 1 (layout/navigation) is live: sticky header, improved post cards, typography, back-to-top button, active menu highlight. The app uses PostView, FeedPage, and CommentsSection as the main content components.

## Requested Changes (Diff)

### Add
- Breadcrumbs in PostView: "Hem › [Kategorinamn] › [Inläggstitel]" shown below the header, above the post title
- Read-time indicator on post cards in FeedPage (e.g. "ca 2 min läsning") based on stripping HTML and counting words
- Read-time indicator in PostView meta row (next to author and date)
- Comment count badge on each post card in FeedPage, shown with a speech-bubble icon and count (fetched lazily per card via useListComments)

### Modify
- CommentsSection: improve visual thread separator for nested comments — increase border-l thickness/color contrast and add a subtle left-line color per depth level for clarity
- PostCard in FeedPage: add comment count (MessageCircle icon + count) and read-time in the footer meta row
- PostView meta row: add read-time indicator

### Remove
- Nothing removed

## Implementation Plan
1. Add `readTime(html: string): string` utility function that strips HTML, counts words, divides by 200 wpm and returns Swedish string "ca X min läsning"
2. Add `CommentCount` sub-component in FeedPage that calls `useListComments(postId)` lazily and renders the count
3. Update PostCard to show read-time and comment count in the footer meta row
4. Update PostView to show breadcrumbs (Hem > category > title) and read-time in meta row
5. Update CommentsSection CommentItem: increase visual differentiation of depth levels using different border colors per depth (depth 1: border-primary/30, depth 2: border-amber-300/50, depth 3: border-muted-foreground/30) with slight background tint per depth
