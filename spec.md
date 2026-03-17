# HKLOblogg

## Current State
Appen har en fullt fungerande bloggplattform med kategorier, inlägg, kommentarer, media-uppladdning, adminpanel och möjlighet att dölja kategorier via eye-ikonen. Dolda kategorier är osynliga för vanliga användare.

## Requested Changes (Diff)

### Add
- `categoryAllowedUsers` Map<Text, List<Principal>> i backend -- lagrar vitlistade användare per kategori-ID
- `addUserToCategoryAllowedList(categoryId, userPrincipal)` -- superadmin kan lägga till en användare i en kategoris vitlista
- `removeUserFromCategoryAllowedList(categoryId, userPrincipal)` -- superadmin kan ta bort en användare från vitlistan
- `getCategoryAllowedUsers(categoryId)` -- superadmin kan hämta vilka användare som har åtkomst till en dold kategori

### Modify
- `listCategories`: Dolda kategorier visas för användare som finns i kategorins vitlista (samma som synliga kategorier)

### Remove
- Inget tas bort

## Implementation Plan
1. Lägg till `categoryAllowedUsers` Map i backend state
2. Implementera `addUserToCategoryAllowedList`, `removeUserFromCategoryAllowedList`, `getCategoryAllowedUsers`
3. Uppdatera `listCategories` för att inkludera dolda kategorier om caller finns i allowedUsers
4. Uppdatera `backend.d.ts` med de nya metodsignaturerna
5. Uppdatera `backend.did.d.ts` med de nya metoderna
