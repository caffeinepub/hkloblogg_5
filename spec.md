# HKLOblogg

## Current State
Bloggen har en ljus blå/grå palett. Ingen bakgrundstextur eller dekorativa bilder används för närvarande på webbplatsen.

## Requested Changes (Diff)

### Add
- Bladmönsterbilden (`/assets/uploads/20260319_111140-1.jpg`) används som dekorativt element på hela webbplatsen med varierad opacitet beroende på plats.

### Modify
- **Inloggningssidan:** Bladmönstret som helbakgrundsbild med vit/ljus semi-transparent overlay för läsbarhet. Tydligare utsmyckning.
- **Sidans body/main bakgrund:** Mycket subtil vattenstämpel (~6% opacitet) som täcker hela sidans bakgrund.
- **Sidfoten:** Bladmönsterband med medium opacitet (~25%) som dekorativt bakgrundselement.
- **Tomma vyer** (empty states för inga inlägg, inga notiser etc.): Bladmönster med ~15% opacitet som utfyllnad.

### Remove
- Inget tas bort.

## Implementation Plan
1. Lägg till global CSS i `index.css` eller via inline styles för body-bakgrundstextur med bladmönstret vid ~6% opacitet.
2. Uppdatera `LoginPage.tsx` (eller motsvarande) med bladmönster som hero-bakgrund med overlay.
3. Uppdatera sidfoten med dekorativt bladmönsterband.
4. Uppdatera empty state-komponenter med subtilt mönster.
5. Säkerställ att all text förblir läsbar med tillräcklig kontrast.
