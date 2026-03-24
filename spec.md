# hkloblogg-dol

## Current State
The blog has a rich text editor with sticky toolbar and emoji picker for both posts and comments. The toolbar includes formatting buttons (bold, italic, headings, etc.).

## Requested Changes (Diff)

### Add
- A word lookup button in the editor toolbar (both posts and comments)
- When a word is selected/highlighted in the editor, clicking the button opens a small popup with 4 options:
  - Synonymer (SV) → opens synonymer.se/?ord=[word] in new tab
  - Synonymer (EN) → opens thesaurus.com/browse/[word] in new tab
  - Definition (SV) → opens svenska.se/tri/f_saol.php?sok=[word] in new tab
  - Definition (EN) → opens merriam-webster.com/dictionary/[word] in new tab
- If no word is selected, the button is disabled or shows a tooltip "Markera ett ord först"

### Modify
- RichTextEditor component toolbar to include the new lookup button

### Remove
- Nothing

## Implementation Plan
1. Add a lookup icon button to the RichTextEditor toolbar
2. On click, read the currently selected text from the editor
3. Show a small dropdown/popover with the 4 external links, each opening in a new tab with the selected word appended
4. Disable button (or show tooltip) when no text is selected
5. Validate and build
