# HKLOblogg – Fas 3: Fullständig flerspråkig UI

## Current State
Fas 1 och Fas 2 är klara. translations.ts innehåller nycklar för: inloggningssidan, headern, subnavigationen, kategoripanelen, MittFlödePage och FeedPage (banners). LanguageContext och useLang() är på plats. Språkväljare finns på inloggningssidan och i headern.

Komponenter som SAKNAR översättning:
- FeedPage – postkort (datum, läs-tid, kommentarantal, like-knapp, kategoritext)
- PostView – inläggsvy (redigera, radera, verifiera, följa, gillningar)
- CommentsSection – kommentarer (svara, gilla, skicka, tomt tillstånd)
- PostForm – skapa/redigera inlägg (formulärfält, knappar, valideringsfel)
- ProfilePage – profil (spara, radera konto, felmeddelanden)
- AdminPanel – hela adminpanelen (flikar, knappar, sökfält, bekräftelsedialoger)
- MediaUploader – uppladdningsinstruktioner och felmeddelanden
- AuthorName, NotificationBell (partiella)
- Generella felmeddelanden och bekräftelsedialoger

## Requested Changes (Diff)

### Add
- Hundratals nya översättningsnycklar i translations.ts för alla 5 språk (EN, SV, FR, DE, ES) som täcker: postkort, inläggsvy, kommentarer, postformulär, profil, adminpanel, felmeddelanden

### Modify
- FeedPage.tsx: använd useLang() för alla UI-texter på postkorten
- PostView.tsx: använd useLang() för knappar, etiketter, dialoger, verifieringspanel
- CommentsSection.tsx: använd useLang() för alla kommentarsrelaterade texter
- PostForm.tsx: använd useLang() för formulärfält, knappar, valideringsmeddelanden
- ProfilePage.tsx: använd useLang() för alla texter inkl. raderingsdialog
- AdminPanel.tsx: använd useLang() för flikar, knappar, sökfält, bekräftelsedialoger
- MediaUploader.tsx: använd useLang() för uppladdningsinstruktioner och fel

### Remove
- Inga hårdkodade svenska/engelska UI-strängar kvar i ovan nämnda komponenter

## Implementation Plan
1. Utöka translations.ts med alla nya nycklar för alla 5 språk
2. Uppdatera FeedPage (postkort-delar)
3. Uppdatera PostView
4. Uppdatera CommentsSection
5. Uppdatera PostForm
6. Uppdatera ProfilePage
7. Uppdatera AdminPanel
8. Uppdatera MediaUploader
9. Validera (lint + typecheck + build)
