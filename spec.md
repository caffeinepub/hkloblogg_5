# HKLOblogg – Fas 2: Header & Navigation Language Support

## Current State
Fas 1 is live: custom i18n with translations.ts (EN/SV/FR/DE/ES), LanguageSelector component, language state local to LoginPage. No shared language context. FeedPage, SubNavBar, CategoryBottomSheet, and MittFlodePage have hardcoded Swedish strings.

## Requested Changes (Diff)

### Add
- `LanguageContext` (React context + provider) so selected language is shared across all components without prop-drilling
- Translation keys for: header title, search placeholder, profile, admin panel, logout, notification labels, sub-nav (Home, My Feed, New Post, Categories), category sheet labels, MittFlodePage (page title, tabs, empty states, back button)

### Modify
- `translations.ts`: add all new keys for header/nav/MittFlode in all 5 languages
- `App.tsx`: wrap app in LanguageProvider
- `LoginPage.tsx`: read/write language via context instead of local state
- `FeedPage.tsx`: add LanguageSelector in header next to NotificationBell; translate all hardcoded strings
- `SubNavBar.tsx`: translate Hem, Mitt flöde, Nytt inlägg, Kategorier
- `CategoryBottomSheet.tsx`: translate Kategorier, Alla inlägg, Stäng
- `MittFlodePage.tsx`: add LanguageSelector in header; translate all strings
- `NotificationBell.tsx`: translate labels

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/locales/LanguageContext.tsx` with React context and provider
2. Extend `translations.ts` with nav/header/MittFlode keys
3. Update `App.tsx` to wrap with LanguageProvider
4. Update `LoginPage.tsx` to use context
5. Update `FeedPage.tsx` to include LanguageSelector and translate strings
6. Update `SubNavBar.tsx` to accept `t` translations prop
7. Update `CategoryBottomSheet.tsx` to accept `t` translations prop
8. Update `MittFlodePage.tsx` to add LanguageSelector and translate strings
9. Update `NotificationBell.tsx` to accept `t` translations prop
