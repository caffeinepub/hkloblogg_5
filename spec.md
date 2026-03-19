# HKLOblogg

## Current State
The blog has a horizontal scrollable category filter row directly below the sticky header. It shows pill-shaped buttons for each category (Alla, Teknik, Livsberättelser, Videos, etc.). This row is visible on both desktop and mobile.

## Requested Changes (Diff)

### Add
- A slim navigation bar below the header with three shortcut links: "Hem", "Mitt flöde", "Nytt inlägg"
- A hamburger menu button (three-line icon) in the same navigation bar, visible on both desktop and mobile
- A bottom sheet component that slides up from the bottom of the screen when hamburger is clicked
- Category list inside the bottom sheet (all categories, with "Alla" option)
- Active category highlighted in the bottom sheet
- Swipe-down gesture to dismiss the bottom sheet
- Backdrop overlay behind the bottom sheet (click to close)
- Currently selected category shown as a chip/badge next to the hamburger button (so user knows which category is active)

### Modify
- Remove the existing horizontal scrollable category filter row
- The category selection logic remains the same -- selecting a category in the bottom sheet filters the feed

### Remove
- Horizontal category pill row below the header

## Implementation Plan
1. Create a `CategoryBottomSheet` component with:
   - Animated slide-up from bottom (CSS transform transition)
   - Backdrop overlay
   - Touch/mouse swipe-down to dismiss (track touchstart/touchmove/touchend)
   - List of category buttons, active one highlighted
   - Close button at top
2. Create a `SubNavBar` component that replaces the category row:
   - Shortcut links: Hem, Mitt flöde, Nytt inlägg (using existing navigation)
   - Hamburger icon button on the right side
   - Small badge showing currently selected category name
3. Remove the old category filter row from the main feed/home page
4. Wire category state between SubNavBar, CategoryBottomSheet, and the post feed
