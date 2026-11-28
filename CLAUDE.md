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
- Current version: **V2.27.4** (shown at the bottom of the left clipboard).

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
- **Staffing rules** (V2.27.0) shared via the same script: `action=rules` (read) / `action=rules_save&rules=JSON&pin=`
  (manager PIN; `pin-check.gs` now also guards `rules_save`). Code: `apps-script/staffing-rules.gs` (`handleRules_`,
  stored in Script Property `STAFF_RULES`). **Owner must install it** (paste file, replace pin-check.gs, add 2 lines at
  the top of doGet, redeploy). Until then the page says "Saved on this device only — the Google script needs the update".
- Everything else is client-side. Per-browser settings in `localStorage`:
  `bs7012.hlMgr`, `bs7012.boldEnd`, `bs7012.rings`, `bs7012.whoLock`, `bs7012.rules2` (this device's copy of the shared Staffing rules). (`bs7012.rules` = never-released per-day version; deleted on load.) (`bs7012.printRev` = removed Print last day first; deleted on load.) (`bs7012.session` = removed V2.25.0 auto-save; the app now deletes it on load.) (`bs7012.hiStyle*` = removed Bold/Darker choice; now ignored.) (`bs7012.look` was used by the removed Colours setting; now ignored.)

## Current features (V2.27.4)
**Layout / look ("desk")**
- Left: wooden **clipboard** with title "Breaksheet Download", two upload boxes, then **two big half-width brown buttons**
  (raised: top shine, dark bottom edge, sink while pressed — no animation) with **embossed / stamped** gold-cream
  **download** and **printer** icons (icons only, V2.22.0 — owner asked). **Shortcuts:** Ctrl/⌘+S downloads,
  Ctrl/⌘+P prints the breaksheet (only once a report is loaded); hover hints "Download breaksheet (Ctrl+S)". warnings ("Check before downloading"), version line.
- Right: black clipboard holding the day's breaksheet as a true **A4 page** (shrinks to fit; blank
  bottom when few names). Phones: flowing sheet instead of A4, and (V2.18.1) only **name + time** columns — the
  left note column and the 30 / 15 columns are hidden on phones (notes show under the name; a slim end slot keeps
  the ✗). Screen only: computer view, print and Excel unchanged.
  Phones only: once a report is loaded the **black clipboard moves to the top** (`#view-main.loaded`), and tapping
  its **metal clip** does the same as tapping the logo (Who's in PIN / tuck back). Computers unchanged.
- **Sticky index flags** pick the day; only the selected flag sits on the page. Since V2.16.0 the flags
  **stick out past the black clipboard** (board is standard width: 26px padding both sides, `margin-right:94px`
  leaves room for the flags) and show the **number of people in brackets**, e.g. `Sat 14 (50)` (screen only).
  Phones: flags stay inside the board, three lines (day / date / (count)).
- **"Who's in" staffing view** (V2.18.0, screen only — never printed, not in Excel). **Hidden:** a **glowing gold**
  flag (no border, soft shine) sits **tucked** behind the sheet above the day flags (only a **"?"** on it — V2.20.4; tapping it while tucked shows a yellow "Access restricted 🚫" note — V2.22.1)
  so people wonder what it is. **Tap the left clipboard's logo once → PIN box → the Who's in PIN** (a separate
  4-digit PIN chosen by the owner — NOT the manager PIN; stored only as a scrambled check value `WHO_PIN_HASH`,
  never write the digits in the repo; ask the owner if needed) → flag comes out. 5 wrong tries → 15-min lock
  (`bs7012.whoLock`). Tap the logo again to tuck it back; a reload tucks it back in. Google is not involved. Rejected flag looks: 4-tap unlock, sliver-only white tab, turn-the-sheet-over, holographic,
  neon green, silver, platinum, bordered gold. Pulled-out flag toggles the view; day flags / arrows pick the day. Four shift cards — Morning 05–11, Day 11–19,
  Evening 19–23:30 (owner: 23:00–23:30 belongs to evenings too), Overnight 23–07 (`WHO_WIN`) — each with *most at once* (true max at exact times) and
  ↑ start / ↓ go home badges (= sums of that shift's list, boundary times count in both shifts). Tapping a card
  highlights it in an hourly bar chart (bars = people in on the hour; −/+ under a bar = changes since the hour
  before) and lists **exact-time** changes (time · badges · **↑ starters' names** · **↓ leavers' names** (V2.18.4) · then "22 in"; **every** first name — no "+4";
  **green** = starting, **red** = going home, V2.18.3). Counts follow sheet edits
  and include the **night before's overnight crew** until they finish (phones: no bar chart, cards + list only) (first day of a report: noted as unknown).
  Owner rejected: plain table/list versions ("2007"), crew timeline / staffing clock / week heatmap ("too complicated").
  Also declined (Nov 2026, Who's in look): OK/SHORT rubber stamps on the shift cards, green/red name chips (mocked up, dropped);
  ideas not picked: sticky-note cards, pen-drawn chart, big number header, mini bars per card, ruled-paper texture, gold touches.
  Who's in extras not picked: manager on duty, morning check, rest-gap check, hours per shift.
  Who's in UI fix (compact half-height cards + one-line list without the "N go home" badges) mocked up — owner: "let it stay this way".
  Open: Day end 19:00 assumed (owner said 6, 7 or 8 pm); on-screen only assumed.
- **Heads up follows the tapped shift card** (V2.20.2, owner; since V2.27.0 by Staffing rules overlapping the card):
  **Evening** / **Overnight** also get the closing check (00:00/00:30). Title "Heads up · Evening · this week".
- **Friday & Saturday** (V2.20.5, owner): Day and Evening checks warn at **9 or fewer** in (other days 8 or fewer) — now the
  defaults of the Staffing rules below.
- **Staffing rules** (V2.27.0, owner: "work smarter", "everything entered manually"): replaces the fixed Day / Evening
  checks. **Since V2.27.2 the rules live inside Who's in** (owner: not on the left clipboard): a **"⚙ Staffing rules"**
  button top-right of the Who's in page (**renamed "⚙ Parameters" in V2.27.4**, owner; page heading "Parameters") opens them on the big white sheet (`whoRules`; one persistent `rulesBox` moved
  into `#rules-slot`, kept in hidden `#rules-home` otherwise); **"← Back to Who's in"** returns; 2 columns on computers.
  **V2.27.3 editor simplified (owner):** a rule is now only **name · days · from–to · "Short at [N] or fewer" · "Tight at
  [N] or fewer" (empty = no tight) · on/off**. Stored as min = short + 1, good = tight + 1. Brief dips, skip dates and event
  date were **removed**; `cleanRule` forces dip 0, skip [], date ''. No description text, no "Put back the starting rules"
  link, no standing "Shared on every device" line (only Saving… / Saved ✓ / errors). Heads up lines: "only 8 in" / "10 in".
  **Brief = dimmer** (owner): any short / tight stretch of **15 min or less** is still listed but at 45% opacity with
  "· 15 min" added (`brief`, `.closing .dim`); the "✗ … short" / "~ … tight" heading dims too when all its lines are brief. Below is the earlier, fuller design for reference. Each rule: **name**,
  **days** (chips Mon–Sun) **or one event date** ("Only on one date", owner asked), **from–to** (time pickers; to ≤ from =
  past midnight), **bare minimum** (below = ✗ short), **good number** (below but ≥ min = ~ tight), **brief dips** (one under
  the minimum for less than N min = tight), **on/off** switch (e.g. schools shut), **skip dates** (date-picker ranges, e.g.
  school holidays). Add / Edit / Delete (confirm) / "Put back the starting rules". Saving asks the **manager PIN** once per
  page load (`commitRules`; reverts on cancel / no connection). Three or more under the minimum → ✗✗ very short.
  Starting set (`RULES_DEF`, V2.27.3 — owner: "remove all the rules, keep what was there till yesterday"): **Day** Sun–Thu
  11–19 min 9 · **Day (Fri / Sat)** min 10 · **Evening** Sun–Thu 19–23 min 9 · **Evening (Fri / Sat)** min 10 — good = min,
  no dips, so the Heads up is **identical to V2.26.0** (checked on Oct + Nov reports). School rush / Dinner rush removed
  (owner can add them back himself). Any saved copy of the first starting set (ids `day`/`school`/`dinner`, local or
  shared) is replaced on load (`oldSet`); rules the owner made himself are kept.
  Heads up shows each rule by name ("✗ Dinner rush short · 18:00–18:45 only 19 in · min 20" / "~ School rush tight · 10 in ·
  good 11"); a rule shows under every shift card its times overlap; Evening + Overnight also show closing.
  Engine: `ruleOn(r, d)`, `checkRule(d, r)` (`low` = short/very, `tight`), `cleanRules` sanitises everything loaded.
- **"Heads up" note** (V2.20.1) also has a **Day check**: any moment **11:00 up to 19:00** with **8 or fewer** in →
  "✗ Day short" (`dayFor`; both use `shortFor(d, from, to)`).
- **"Heads up" note** (V2.20.0) adds an **evening check**: any moment from **19:00 up to (not incl.) 23:00** (owner moved it from 22:30) with
  **8 or fewer** people in → "✗ Evening short · 21:30–22:30 only 8 in" (`eveningFor`). Same note as the closing check;
  **Whole week:** the note shows on **every** selected day if **any** day in the report has a problem (owner's
  request) — title "Heads up · this week", one block per problem day (viewed day first, marked "(this day)"),
  day names are links that jump to that day. No note only when the whole week is fine.
- **Closing check** (V2.19.0): yellow sticky note on the left clipboard, **only while Who's in is open** and **only
  when the selected day is NOT covered** (owner: no note when covered). Covered = at least **1 finishing at 00:00 +
  1 at 00:30**, or **2+ finishing at 00:30** (exact finish times). Shows ✗ Not covered, names at 00:00 / 00:30,
  what's needed, and "Also not covered: …" for other failing days. Follows edits. **Phones:** the note shows at the top of the
  Who's in page (`.closing-ph`) instead of the left clipboard, so no scrolling.
- **Switching days** is instant: ←/→ keys; swipe on phones. (The paper-curl page turn was
  **switched off by the owner in V2.14.2**; its code was removed in V2.14.3.)
- **Settings on the back of the left clipboard**: folded **SETTINGS** corner flips it; **BACK** corner
  or Esc flips back; `#managers` URL opens it.
- **PIN boxes** (manager list and Who's in) show **dots**, never the digits (V2.18.2).
- Mouse pointer: slim **blue biro** (up-left like an arrow) on desktop; normal hand over clickables;
  text cursor in inputs; phones unchanged.
- Colours: warm wood only. (A Colours choice — Warm wood / Office grey / Ketchup & mustard — was
  added in V2.14.0 and **reverted by the owner in V2.14.1**; don't bring it back unless asked.)
- **Christmas hat** (V2.26.0, owner): small deep-red Santa hat (SVG `.xhat`) on the **"B"** of the title, added by JS
  only from **27 Nov to 31 Dec** (device date; comes back each year), gone in January. Screen only (hidden in print).
  Owner picked the title spot over the clips / logo / flags, and deeper red to match the wood.
- Heading font Fraunces; handwriting Kalam (notes, flags); blue pen colour `#1F3FBF`; rust `#C2410C`.

**Reading reports**
- Upload boxes show what was read: crew → `Store 7012 · Mon 16 – Sun 22 Nov`; swap →
  `N approved swaps · N cancelled` (+ store only if different). File name on hover.
- Stores accepted: **7012, 7079**. Warnings: different stores; store not 7012/7079; swap report for
  a **different week**; swaps for other days; person listed twice; shift > 12 h; unreadable rows; **same person spelled
  two ways** across the week (V2.23.0): `sameName` matches with different text → "look like the same person written
  two ways"; near-misses (≤ 2 letters different on the squashed name, ≥ 6 letters, or same surname + first name ≤ 2
  letters off) → "might be the same person". Shows the days each spelling is on; fixing the name clears it.
  No false alarms on the owner's Oct and Nov reports (e.g. Aravindan Murthy vs Aravindhan Kumaran not flagged).
- Tested on the owner's real reports (Oct 2026 week): all 403 + 15 rows read; deletes, re-adds,
  "Shift Assigned", "Shift Reassigned", time changes and the approved swap all handled correctly.

**Editing (not remembered — a refresh or a new report starts fresh)**
- **Same report added again keeps the edits** (V2.25.1, owner asked): `addFile` compares the new report with the
  loaded one (`sig` = type/store/range/records); identical → crossed-out / added / retimed / renamed stay. Different → fresh.
- On-device auto-save (V2.25.0) was **removed by the owner** in V2.25.1 — don't bring it back unless asked.
- **Cross out** a row: blue pen ✗ at row end (tap row first on phones) → pen strike-through (animations on:
  line draws across in 0.4 s; animations off: full line shows instantly for 0.65 s, then the row goes — V2.17.1); yellow
  sticky "undo ↶" note; "Crossed out" sticky note on the left with "put back".
  **V2.20.3 iPhone fix:** the ✗ and the strike line are positioned inside the row's **last cell**
  (`td.b:last-child{position:relative}`), never against the `<tr>` — older iPhone Safari can't position against
  table rows, so every ✗ stacked mid-sheet and crossed out a random person. Don't move them back onto `tr`.
- **Add someone**: tap/click the page → handwritten "+ add someone" appears for 6 s (NOT on hover);
  name (browser's own suggestion list from report names) + shift (`16:00-23:00`, `1600-2300`,
  `16-23`, `6.30-14.30`, `9 to 17`, `23-7`). Slots in by start time.
- **Change a time**: tap the shift cell → dashed box, Enter saves / Esc cancels; row moves; handwritten
  "was …" note on screen only.
- **Change a name** (V2.21.0): computer → click the name; phone → first tap shows the ✗, **second tap** on the name
  opens the box (browser's own suggestion list of report names, `#known-names`, V2.21.1). Enter saves / Esc cancels / click away saves; empty → "Type a name."; handwritten "was …" note on
  screen only; undo toast. Stored in `renamed` (original row key → new name; added rows edit `added[].name`).
- All edits flow into the Excel download and the print.

**Highlighting (Settings)**: Highlight managers (bold), Highlight early finish times (bold end time
when someone finishes before the person above), Circles around breaks. Highlighting is **always bold**
(the Bold / Darker "Highlight style" choice was removed by the owner in V2.17.0; Excel = Lucida Sans Unicode bold).
Since V2.16.1 the switches redraw the sheet on the right **instantly** (before, only on flipping back).

**Print** (printer icon → browser print dialog)
- One A4 page per day; long days shrink to fit one page (Excel-style whole-percent scaling).
- "Print last day first" switch (V2.24.0) was **removed by the owner in V2.27.1** — pages always print first day first.
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
- Settings corner hidden until mouse-over (built as V2.18.0 on the branch, owner said don't push; undone).
  Hints for it (peeking corner, "settings ↘" note, text link, Settings sticky flag, word on the clip) — not wanted.
- Colours setting in Settings (V2.14.0, reverted in V2.14.1). Bold/Darker highlight style (removed V2.17.0). Paper-curl page turn (off in V2.14.2).
- Main-screen looks (Nov 2026): two wooden clipboards, clear acrylic clipboard + cool desk, desk props (cup / pen) —
  owner: "leave the design choices". Also not wanted: name search / Ctrl+K, spotlight person, shift colour strips,
  focus mode, two days side by side, time-of-day desk light, daily briefing, ask-a-question box, compare weeks,
  notice-board poster, open-on-today ★, page stack, reading progress, warnings sticky note, tidier left clipboard.
- Dark mode; dark desk colours (Green desk mat, Night shift); bright red Ketchup variant.
- Themed name-suggestion card (V1.9.3, reverted) — keep the browser's own list.
- Upload boxes as paper slips / envelope / label-maker tape / RECEIVED stamp / kitchen ticket rail /
  crew name badges / single smart drop zone (only the "what was read" summary line was kept).
- Shift count in the crew summary (removed). Colour swatch icons (removed).
- Big pen cursor, dot cursor, pen with click sparks; realistic chrome clip; folder tabs; ☰ menu;
  on-screen PIN keypad (PIN is typed into four rings); right-panel placeholder before upload.
- Print-which-days picker (#8) — not wanted for now. Icon-only download button (first rejected as too empty, then chosen by the owner in V2.22.0);
  Download/Print half-width or tile buttons with words (options A/B) — icon-only big blocks chosen later (V2.22.0).

## Open / suggested next (owner hasn't chosen)
- Swap summary says "1 cancelled" for a cancelled *drop* — offered rewording ("cancelled request").
- Ask whether the black right clipboard should become lighter ("no dark background").
- Ideas: breaks by shift length (print only);
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
2.13.0 PDF file name + different-week warning · 2.14.0 Colours in Settings · 2.14.1 Colours setting reverted (page = 2.13.0 + version number) · 2.14.2 page-turn animation off · 2.14.3 unused code removed (page 156 KB → 134 KB, everything else identical) · 2.15.0 download icon added in front of "Download breaksheet" (owner tried icon-only: "too empty"; chose option C) · 2.15.1 print fix: long days / circles no longer print grid lines through the names · 2.16.0 flags outside the clipboard + people count · 2.16.1 Settings switches update the sheet instantly · 2.17.0 Bold/Darker highlight style removed (always bold) · 2.17.1 cross-out line visible with animations off · 2.18.1 "Who's in" staffing view, hidden behind a tucked gold flag + its own PIN (owner chose the number;
2.18.0 was used on the branch for the never-released hover-only Settings corner) · 2.18.2 phones: sheet on top + clip
opens the PIN; PIN boxes show dots (●), never the digits · 2.18.3 Who's in: green = starting, red = going home;
names before the "N in" count · 2.18.4 Who's in lists starters' names too (green ↑ / red ↓) · 2.19.0 Closing check sticky note · 2.20.0 "Heads up" note also flags a short evening (≤ 8 in, 19:00–23:00) · 2.20.1 also a short Day (≤ 8 in, 11:00–19:00) · 2.20.2 note follows the tapped shift card · 2.20.3 iPhone fix: ✗ / cross-out line pinned to the last cell · 2.20.4 "?" on the tucked gold flag · 2.20.5 Fri/Sat short-staff limit 9 or fewer · 2.21.0 change a name on the sheet · 2.21.1 name box offers report names · 2.22.0 Download / Print as two big brown icon-only buttons (owner's request; tan / cream options declined), embossed
icons, Ctrl/⌘+S / Ctrl/⌘+P shortcuts · 2.22.1 tucked flag says "Access restricted 🚫" · 2.23.0 same-person-two-spellings warning · 2.24.0 "Print last day first" switch · 2.25.0 auto-save of reports + edits on the device (quiet, no notes) · 2.25.1 auto-save removed (owner); same report added again keeps the edits · 2.26.0 Christmas hat on the title (27 Nov – 31 Dec) · 2.27.0 Staffing rules: your own rules per days / event date / times with minimum + good number, on/off, skip dates, shared on every device · 2.27.1 "Print last day first" switch removed (owner) · 2.27.2 Staffing rules moved from Settings into Who's in · 2.27.3 starting rules = the old Day / Evening checks only; editor reduced to name, days, times, short at / tight at; 15 min or less shown dimmer · 2.27.4 "Staffing rules" renamed "Parameters".
