# HKLOblogg

## Current State
Backend stöder följning (Fas 1, v22) och notissystem (Fas 2, v23). Alla metoder finns i backend.d.ts men declarations-filerna saknar notification-typer/-metoder, och idlFactory saknar follow-metoderna. Frontend saknar UI för följning, Mitt flöde och notiser.

## Requested Changes (Diff)

### Add
- Notification/NotificationEvent-typer i declarations/backend.did.d.ts och backend.did.js
- Notification-metoder i declarations: getMyNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, deleteNotification
- Follow-metoder i idlFactory i backend.did.js (de finns i idlService men saknas i idlFactory)
- Nya hooks i useQueries.ts för follow/unfollow/notifications
- Ny sida MittFlodePage.tsx med flikar: Följda användare och Följda inlägg
- Notisklocka med unread-badge i FeedPage header med notisdropdown
- Följ/avfölja-knapp på PostView
- View 'myFeed' i App.tsx

### Modify
- declarations/backend.did.d.ts och backend.did.js: komplettera med notification och follow
- App.tsx: myFeed-routing
- FeedPage.tsx: notisklocka i header
- PostView.tsx: följ/avfölja-knapp

### Remove
- Ingenting

## Implementation Plan
1. Uppdatera declarations/backend.did.d.ts
2. Uppdatera declarations/backend.did.js
3. Lägg till hooks i useQueries.ts
4. Skapa MittFlodePage.tsx
5. Uppdatera FeedPage.tsx med notisklocka
6. Uppdatera PostView.tsx med följ/avfölja
7. Uppdatera App.tsx
8. Validera
