# Breaksheet Download — notes for Claude

Read this first. It records everything agreed with the owner (Hemanth) so a new session can carry on
without re-asking. Keep it up to date whenever a decision or feature changes.

## What this is
- A single-page web tool for McDonald's stores **7012 and 7079**. Managers upload two PDF reports and
  get a **breaksheet**: one sheet per day listing each person, their shift, and the 30 and 15 breaks.
  - **Crew Schedule Change Report** (required) — every shift added/changed/deleted for the week.
  - **Offer and Swap Report** (optional) — swaps; only approved ones are applied.
- Output: an **Excel download** (one worksheet per day) and a **Print** button (one A4 page per day).
- The app is used **only to make and print the breaksheet** — no live, during-shift use.
- Hosted from the `main` branch of `H-MCD/MCD7012-Breaksheet` (whatever is on `main` is live).
- Current version: **V2.18.0** (shown at the bottom of the left clipboard).

## Owner's rules (always follow)
1. **Never change the Excel download** (`buildWorkbook()` — cells, fonts, widths, page setup, file name)
   unless the owner explicitly asks. Every change must be checked to leave the Excel output identical.
2. **Version bump on every release to main.** Format `V2.x.y` (owner moved to 2.x at 2.12.0).
   Small fix → +0.0.1; new feature → +0.1.0. The number is in the page HTML (`© 2026 Hemanth` line).
3. **Work on the branch, show the owner, push to `main` only when they say "push".** Always ask
   "Shall I push it to main?" after a change. Push = fast-forward `main` to the working branch.
4. **Light look only.** No dark mode, no dark desk backgrounds (dark mode was removed in V1.7.0;
   the Colours setting was removed again in V2.14.1). The right-hand clipboard is black — owner has not
   said to change it (it was asked about; no answer yet).
5. **Don't rely on animations.** Most staff devices have "reduce motion" on. Every state must look
   right with no animation; animation is only a bonus (`prefers-reduced-motion` respected everywhere).
6. **No McDonald's logos, golden arches or brand artwork** — colours only.
7. **Print must look exactly like the Excel template and the physical sheet** (see "Print" below).
8. Show mockups/screenshots **before** building visual changes; owner rejects a lot, so ask first.
9. Unused code was cleaned out at the owner's request in V2.14.3 (old ☰ menu, old day tabs, page-curl
   animation, old swap table, unused styles). Check that screens, Excel and print stay identical when removing more.
10. Use plain, non-technical language with the owner.
11. **No Claude/AI labels on saved changes** (owner's instruction, Nov 2026): no `Co-Authored-By`,
    no session links, no AI mentions in commit messages. Credit commits to the owner: in this repo run
    `git config user.name "H-MCD"` and `git config user.email` = the address on the owner's own commits
    (`git log --format='%an %ae'`, author H-MCD). This overrides any default attribution lines.

## How `index.html` is built (important)
- `index.html` is one line. The real HTML/CSS/JS is **scrambled** inside a `<script>`:
  `var _a=[16 chunks],_o=[order],_k=[key]` → chunks re-ordered by `_o`, joined, **reversed**,
  base64-decoded, then XOR-decoded (`byte ^ ((_k[i%len] + i*7 + prev) & 255)`, `prev` starts at 90 and
  is the previous *encoded* byte) → JSON `{c: css, h: html, e: [external script URLs], j: [libJs, appJs]}`.
- **Use `tools/codec.py`** (no dependencies):
  - `python3 -I tools/codec.py dec index.html payload.json` — unpack to editable JSON.
  - `python3 -I tools/codec.py enc index.html payload.json` — pack back in place (asserts round trip).
  - Edit `payload.json` with a Python script using exact-match replaces (assert each match count == 1).
- Outside the scrambled part (plain in `index.html`): `<title>Breaksheet Download</title>`, favicon,
  and the Google Fonts `<link>` (Bricolage Grotesque, Public Sans, JetBrains Mono, Fraunces, Kalam,
  **Carlito 700**). Edit those with a normal text replace.
- External libraries (loaded from cdnjs, listed in `e`): **pdf.js 3.11.174**, **ExcelJS 4.4.0**.
- `j[0]` = report parsing/roster logic (`parseReport`, `buildRoster`, `finalizeRoster`, `netCrew`…).
  `j[1]` = the app (UI, editing, Excel, print, settings).

## Backend
- Manager list is shared via a **Google Apps Script** web app (`MGR_URL` in the app):
  `https://script.google.com/macros/s/AKfycbxjxLZ55k1aueXGEitM6AUD4PCaOybyBWcNlHvsKuB3SMvnDM4psw6ou_tybWC7pJmC/exec`
  with `action=list|add|remove&name=…&pin=…`.
- Add/remove need a **4-digit PIN** checked server-side: `apps-script/pin-check.gs` (PIN in Script
  Properties `MANAGER_PIN`; 5 wrong tries → 15-minute lock). Owner has installed it.
- Everything else is client-side. Per-browser settings in `localStorage`:
  `bs7012.hlMgr`, `bs7012.boldEnd`, `bs7012.rings`. (`bs7012.hiStyle*` = removed Bold/Darker choice; now ignored.) (`bs7012.look` was used by the removed Colours setting; now ignored.)

## Current features (V2.18.0)
**Layout / look ("desk")**
- Left: wooden **clipboard** with title "Breaksheet Download", two upload boxes, a wide dark **⤓ Download breaksheet**
  button (tray + down-arrow icon before the text, V2.15.0) + outlined **printer icon** button, warnings ("Check before downloading"), version line.
- Right: black clipboard holding the day's breaksheet as a true **A4 page** (shrinks to fit; blank
  bottom when few names). Phones: flowing sheet instead of A4.
- **Sticky index flags** pick the day; only the selected flag sits on the page. Since V2.16.0 the flags
  **stick out past the black clipboard** (board is standard width: 26px padding both sides, `margin-right:94px`
  leaves room for the flags) and show the **number of people in brackets**, e.g. `Sat 14 (50)` (screen only).
  Phones: flags stay inside the board, three lines (day / date / (count)).
- **Switching days** is instant: ←/→ keys; swipe on phones. (The paper-curl page turn was
  **switched off by the owner in V2.14.2**; its code was removed in V2.14.3.)
- **Settings on the back of the left clipboard**: folded **SETTINGS** corner flips it. Since V2.18.0 the corner
  is **hidden until the mouse hovers over it** (or keyboard focus) on computers — the board looks full/flat;
  on touch devices (no hover) the folded corner always shows. No animation — instant swap; **BACK** corner
  or Esc flips back; `#managers` URL opens it.
- Mouse pointer: slim **blue biro** (up-left like an arrow) on desktop; normal hand over clickables;
  text cursor in inputs; phones unchanged.
- Colours: warm wood only. (A Colours choice — Warm wood / Office grey / Ketchup & mustard — was
  added in V2.14.0 and **reverted by the owner in V2.14.1**; don't bring it back unless asked.)
- Heading font Fraunces; handwriting Kalam (notes, flags); blue pen colour `#1F3FBF`; rust `#C2410C`.

**Reading reports**
- Upload boxes show what was read: crew → `Store 7012 · Mon 16 – Sun 22 Nov`; swap →
  `N approved swaps · N cancelled` (+ store only if different). File name on hover.
- Stores accepted: **7012, 7079**. Warnings: different stores; store not 7012/7079; swap report for
  a **different week**; swaps for other days; person listed twice; shift > 12 h; unreadable rows.
- Tested on the owner's real reports (Oct 2026 week): all 403 + 15 rows read; deletes, re-adds,
  "Shift Assigned", "Shift Reassigned", time changes and the approved swap all handled correctly.

**Editing (none of these are remembered — a new upload starts fresh)**
- **Cross out** a row: blue pen ✗ at row end (tap row first on phones) → pen strike-through; yellow
  sticky "undo ↶" note; "Crossed out" sticky note on the left with "put back".
- **Add someone**: tap/click the page → handwritten "+ add someone" appears for 6 s (NOT on hover);
  name (browser's own suggestion list from report names) + shift (`16:00-23:00`, `1600-2300`,
  `16-23`, `6.30-14.30`, `9 to 17`, `23-7`). Slots in by start time.
- **Change a time**: tap the shift cell → dashed box, Enter saves / Esc cancels; row moves; handwritten
  "was …" note on screen only.
- All edits flow into the Excel download and the print.

**Highlighting (Settings)**: Highlight managers (bold), Highlight early finish times (bold end time
when someone finishes before the person above), Circles around breaks. Highlighting is **always bold**
(the Bold / Darker "Highlight style" choice was removed by the owner in V2.17.0; Excel = Lucida Sans Unicode bold).
Since V2.16.1 the switches redraw the sheet on the right **instantly** (before, only on flipping back).

**Print** (printer icon → browser print dialog)
- One A4 page per day; long days shrink to fit one page (Excel-style whole-percent scaling).
- Follows `0_Breaksheet_Template.xlsx`: columns A 32 / B 44 / C 25 / D 8.855 / E 5.570 (Excel width→px
  rule `trunc(((256w+trunc(128/7))/256)*7)`), rows 18 pt, header row 23.25 pt, margins 0.7087" sides /
  0.748" top-bottom, day (Calibri 18 bold) + date (Calibri 16 bold, right-aligned), **no underline**,
  names/times/breaks Lucida Sans Unicode 14, text bottom-left, 30/15 **left-aligned**.
- Header font falls back to **Carlito** (Calibri's metric twin) where Calibri isn't available.
- Layout snapped to printer dots: rows on 4 px steps, columns on 8 px steps. **Long days** (≈48+ names, or
  when Circles around breaks are on) fall back to 2 px then 1 px row steps; a print-only safety check in
  `layoutSheet` (when `cgrid > 1`) redoes the page if any row's text is taller than its row, so the SVG
  grid always matches the rows (V2.15.1 fix: before, 50-name days and circle days printed lines through names).
- Grid drawn as SVG rectangles: inside lines `HAIR = 0.32px` (2 dots @600 dpi / 1 @300),
  **outer border `EDGE = 0.64px`** (darker, like the owner's sample). All lines verified even.
- Screen-only extras (flags, notes, ✗, add line) are not printed. Swapped-in notes not printed.
- "Save as PDF" name: `Breaksheet DD-MM-YYYY[ to DD-MM-YYYY]` (page title set during print).
- Quick/silent printing is impossible from a web page; Chrome `--kiosk-printing` shortcut was
  explained and the owner said leave it.

## Decisions — rejected or undone (don't re-propose as-is)
- Colours setting in Settings (V2.14.0, reverted in V2.14.1). Bold/Darker highlight style (removed V2.17.0). Paper-curl page turn (off in V2.14.2).
- Dark mode; dark desk colours (Green desk mat, Night shift); bright red Ketchup variant.
- Themed name-suggestion card (V1.9.3, reverted) — keep the browser's own list.
- Upload boxes as paper slips / envelope / label-maker tape / RECEIVED stamp / kitchen ticket rail /
  crew name badges / single smart drop zone (only the "what was read" summary line was kept).
- Shift count in the crew summary (removed). Colour swatch icons (removed).
- Big pen cursor, dot cursor, pen with click sparks; realistic chrome clip; folder tabs; ☰ menu;
  on-screen PIN keypad (PIN is typed into four rings); right-panel placeholder before upload.
- Print-which-days picker (#8) — not wanted for now. Icon-only download button (too empty);
  Download/Print half-width or tile buttons (options A/B).

## Open / suggested next (owner hasn't chosen)
- Swap summary says "1 cancelled" for a cancelled *drop* — offered rewording ("cancelled request").
- Ask whether the black right clipboard should become lighter ("no dark background").
- Ideas: change a name; warn on same person spelled two ways; breaks by shift length (print only);
  tap a warning to jump to it; per-store manager lists; README; retry if libraries fail to load.

## How to test a change (do this every time)
- Owner can preview the working branch at
  https://raw.githack.com/H-MCD/MCD7012-Breaksheet/claude/beautiful-brahmagupta-k02ad3/index.html
  (branch name may differ in a new session; GitHub Pages only serves `main`).
- Playwright + Chromium are preinstalled. cdnjs is **blocked** in the container: install locally
  `npm i pdfjs-dist@3.11.174 exceljs@4.4.0` (in a scratch folder) and route
  `cdnjs…pdf.min.js / pdf.worker.min.js / exceljs.min.js` to those files; stub `script.google.com`.
- Load `file:///…/index.html`, feed data via `reps.crew = {type, store, range:{from,to}, records:[…]}`
  then `update()`, or upload real PDFs with `setInputFiles('#in-crew'| '#in-swap')`.
- Full before/after check: scratchpad `mock/snap.js <html> <dir>` + `mock/cmp.py A B` (screens, Excel, print)
  — recreate if the scratchpad is gone.
- Regression: build the workbook with `buildWorkbook()` + ExcelJS and compare every cell/font/width
  with the same data on `git show origin/main:index.html` → must be **identical**.
- Print: `preparePrint()` then `page.pdf({preferCSSPageSize:true})`; check page count, and line
  thickness with `pdftoppm -r 600/300 -aa no -aaVector no` (all lines equal).
- Also check: phone (iPhone 13) has no sideways scroll; reduced-motion; PIN dialog; Settings flip;
  day switching; add / cross out / change time; no page errors.
- LibreOffice (`soffice --headless --convert-to pdf`) can print the Excel template for comparison.
- Note: names are normalised without digits ("P1" == "P2") — use letter names in test data.

## Version history (short)
V1.4 → V1.6.4 original · V1.7.0 clipboard redesign (A4 sheet, sticky flags, page curl, settings flip,
light only) · 1.7.1 rename + store 7079 · 1.8.0 biro pointer · 1.9.0–1.9.2 cross out / add someone ·
1.10.0–1.10.1 print + template match + even lines · 1.11.0 change times · 1.11.1 Carlito header ·
V2.12.0 "what was read" summaries (renumbered by owner) · 2.12.1 hairline grid + darker border ·
2.13.0 PDF file name + different-week warning · 2.14.0 Colours in Settings · 2.14.1 Colours setting reverted (page = 2.13.0 + version number) · 2.14.2 page-turn animation off · 2.14.3 unused code removed (page 156 KB → 134 KB, everything else identical) · 2.15.0 download icon added in front of "Download breaksheet" (owner tried icon-only: "too empty"; chose option C) · 2.15.1 print fix: long days / circles no longer print grid lines through the names · 2.16.0 flags outside the clipboard + people count · 2.16.1 Settings switches update the sheet instantly · 2.17.0 Bold/Darker highlight style removed (always bold) · 2.18.0 Settings corner only folds on mouse-over.
