---
name: Morning Desk
description: A room of Poodle House that answers, at a glance, what the weather is doing and what state the home's power is in.
colors:
  green: "#146b4a"
  card: "#18714d"
  card-hover: "#1c7d56"
  row: "#125f42"
  deep: "#0f5a3e"
  cream: "#f4efe3"
  muted: "#d5e4d8"
  gold: "#c4a35a"
  gold-text: "#f5e6bb"
  gold-soft: "#e6cc8a"
  line: "rgba(244,239,227,.24)"
  cream-outline: "rgba(244,239,227,.6)"
  ink-on-light: "#0b3d2a"
  live: "#b44a3c"
  error: "#f0b3a6"
  flow-sun-glint: "#fff3cf"
  flow-battery: "#cfe2e3"
  flow-battery-glint: "#f1f8f8"
  flow-grid: "#ec9a86"
  flow-grid-glint: "#ffd9cf"
  flow-track: "rgba(244,239,227,.18)"
  night: "#03140d"
typography:
  display:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "clamp(3rem, 5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Marcellus, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 500
    lineHeight: 1.4
  control:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: ".9375rem"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: ".8125rem"
    fontWeight: 600
    letterSpacing: ".06em"
  micro:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: ".75rem"
    fontWeight: 700
    letterSpacing: ".08em"
rounded:
  track: "3px"
  control: "12px"
  section: "16px"
  card-compact: "20px"
  card: "24px"
  pill: "99px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  tap: "44px"
components:
  button-primary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.deep}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "{spacing.tap}"
  button-primary-hover:
    backgroundColor: "#ffffff"
    textColor: "{colors.deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "{spacing.tap}"
  button-secondary-hover:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.cream}"
  button-refresh:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.round}"
    size: "36px"
  input:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.cream}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "{spacing.tap}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
    padding: "22px 22px 24px"
  row:
    backgroundColor: "{colors.row}"
    textColor: "{colors.cream}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  row-hover:
    backgroundColor: "{colors.card-hover}"
  flow-badge-sun:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.ink-on-light}"
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  flow-badge-battery:
    backgroundColor: "{colors.flow-battery}"
    textColor: "{colors.ink-on-light}"
  flow-badge-grid:
    backgroundColor: "{colors.flow-grid}"
    textColor: "{colors.ink-on-light}"
  channel-badge:
    backgroundColor: "{colors.live}"
    textColor: "{colors.cream}"
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  plaque:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.green}"
    rounded: "{rounded.card}"
    padding: "20px 22px"
---

# Design System: Morning Desk

## Overview

**Creative North Star: "A Room of Poodle House"**

Morning Desk is not a separate gadget; it is a sibling room of the Poodle House WordPress theme (`~/poodle-house/poodle-house/tokens.css`), the world the user pinned. The household walks from the Poodle House "Morning Desk" tile into the same green house, the same cream type and the same gold hardware. Its colours and fonts are the house's tokens, copied by value into `public/styles.css`; the desk adds only what its own jobs need: three flow colours for the solar diagram, a LIVE red, an error tint and the night layer.

The screen is a glance surface, often an always-on wall display. Weather and power come first, with large Marcellus readouts and a solar diagram whose moving dashes say where the power is going. News and Sky News support. Density is calm: green cards on a green page, darker green rows inside them, no glowing tiles and no neon. It must stay light on cheap hardware: the only endless motion is a transform on the flow dashes.

The world rejects the generic dark dashboard of glowing neon tiles that this product used to be (the retired lime, coral and cyan system).

**Key Characteristics:**
- Poodle House green page (#146b4a), lighter green cards with 24px corners, darker green rows with 12px corners.
- Cream text, sage muted text, gold only for lines, accents and focus.
- Marcellus for headings and readouts, engraved like a house-name plate; Figtree for everything else.
- Cream primary buttons, cream-outline secondary buttons, as on Poodle House.
- Honest state everywhere: LIVE or OFFLINE with the last good time, stale labels instead of old data passed off as current.
- The desk-poodle illustration is the brand mark.

## Colors

One green house in four tones, cream ink, and gold hardware; the only other hues belong to the solar diagram and to warnings.

### Primary
- **House Green** (#146b4a): the page, the settings dialog surface, the sign-in page, and `theme-color`. Text on the plaque and the sign-in submit.
- **Brass Gold** (#c4a35a): lines and accents only (the news-row left rule, solar node rims at 45% alpha). Too dark for text on green.
- **Soft Gold** (#e6cc8a): focus rings, field focus border, `accent-color` and caret, the LIVE dot, weather icons, hover borders, and the sun flow (`--flow-sun` is this colour).
- **Gold Text** (#f5e6bb): gold-toned text on green: the LIVE label, source links, flow summary, region headings in Settings, success status.

### Tertiary (the solar diagram)
- **Sun Flow** (Soft Gold, #e6cc8a; glint #fff3cf): solar panels and household load. Lights the PV and home circles when they carry power.
- **Cream-Blue Battery** (#cfe2e3; glint #f1f8f8): the battery path, charging or discharging, and the battery-power label.
- **Lightened House Red** (#ec9a86; glint #ffd9cf): the grid path, and a grid-down voltage. It is the house danger red lightened to read on green.
- **Flow Track** (rgba(244,239,227,.18)): the resting 3px line under every path.

### Neutral
- **Card Green** (#18714d): cards and settings sections. A shade darker than the house's original so cream and muted text pass 4.5:1.
- **Hover Green** (#1c7d56): news-row hover.
- **Row Green** (#125f42): forecast tiles, news rows, solar node fills, check-row hover.
- **Deep Green** (#0f5a3e): fields, the video well, hovered secondary buttons, text on cream buttons and selection.
- **Cream** (#f4efe3): primary text, primary button fill, the plaque.
- **Sage** (#d5e4d8): secondary text, idle node icons, OFFLINE state, placeholders.
- **Hairline** (rgba(244,239,227,.24)): dividers, field and refresh borders, dialog border.
- **Cream Outline** (rgba(244,239,227,.6)): secondary button and header-control borders, active inverter rim.
- **Ink on Light** (#0b3d2a): text on the flow badges.
- **Night** (#03140d): the night-mode dim layer.

### Signals
- **LIVE Red** (#b44a3c): the Sky News LIVE pill only; the house danger red, deep enough for cream text.
- **Error Blush** (#f0b3a6): error messages and the danger outline button on green.

### Named Rules
**The Gold Hardware Rule.** Brass gold (#c4a35a) is for lines and rims, never text; text that needs to read as gold uses Gold Text (#f5e6bb). Gold never fills a card.

**The Three Paths Rule.** The solar diagram owns exactly three flow colours: sun gold for solar and load, cream-blue for battery, lightened red for grid. A path's colour also lights its circle when that source is live; idle circles stay plain row green with a sage icon.

## Typography

**Display Font:** Marcellus (with Georgia, serif), weight 400 only
**Body Font:** Figtree (with system-ui, sans-serif), weights 400 to 700

**Character:** Marcellus is engraved and formal, like the house-name plate; it carries every heading and the big readouts. Figtree is plain and friendly for text, labels and controls. Both are self-hosted from `public/fonts`.

### Hierarchy
- **Display** (Marcellus 400, clamp(3rem, 5vw, 4.5rem), 1, tabular figures): the current temperature.
- **Headline** (Marcellus 400, 36px/1.1; 28px at ≤760px): the brand name. Sign-in title 40px (32px at ≤820px), Settings title 30px, plaque 26px uppercase with .08em tracking.
- **Title** (Marcellus 400, 22px/1.25; 20px at ≤760px): card titles (news source, solar source), the weather date (26px), settings legends (20px).
- **Body** (Figtree 400, 16px/1.5): page default and field text.
- **Body small** (Figtree 500, .9375rem/1.4): news rows, dialog intros, loading text.
- **Control** (Figtree 600, .9375rem/1): buttons and header controls.
- **Label** (Figtree 600, .8125rem, .04 to .06em, uppercase): LIVE state, source links, forecast day names, Settings region headings, node labels (not uppercase).
- **Micro** (Figtree 700, .75rem, .08em): flow badges, the inverter mode, the LIVE pill, footer timestamps.

### Named Rules
**The Tabular Readout Rule.** Every figure that refreshes in place (temperature, forecast, flow summary, node values, badges, footer totals) uses `font-variant-numeric: tabular-nums`, so digits do not shift on a wall screen.

**The One Weight Plate Rule.** Marcellus is used at 400 only; hierarchy comes from size, never from bolding the display face.

## Layout

A centred dashboard (max 1420px; padding 24px top, clamp(20px, 4vw, 56px) sides, 56px bottom). Header row: desk poodle (64px) and "Morning Desk" left; profile switcher, live state and Settings right. Then a two-column grid (1.15fr / .85fr, 20px gap): the weather card spans both columns; the left column stacks Sky News then the solar card; the right column stacks news cards.

The weather card splits into a date-and-place block (with a hairline right divider) and the readout with a five-day forecast of row tiles (8px gap; a container query at 520px stacks max and min).

Breakpoints:
- **≤980px:** one column (weather, left, right), 16px gaps, padding respects safe-area insets.
- **≤820px (sign-in):** the photo moves to the top (34vh), the plaque sits on its lower edge, the form centres below (max 432px), the mark hides.
- **≤760px:** cards 16px padding and 20px corners; weather stacks; solar nodes shrink to 56px; **flow badges are hidden**, because the labels beside each circle carry the same figures.
- **≤520px:** header wraps. **≤420px:** nodes 46px.

Spacing rhythm is 4px-based: 4, 8, 12, 16, 20, 24.

The sign-in page copies the Poodle House login: a fixed photo column (31vw) on the left with a cream uppercase Marcellus plaque, and the form on green (max 400px) offset 8vw beyond it.

## Elevation & Depth

Depth is tonal: the page, cards, rows and fields are four greens, and cards carry no shadow. Shadows appear only on floating things.

### Shadow Vocabulary
- **Node lift** (`box-shadow: 0 6px 14px rgba(9,46,32,.35)`): the solar diagram circles, so lines read as passing behind them.
- **Dialog** (`box-shadow: 0 24px 60px rgba(4,30,20,.45)`, backdrop rgba(6,36,25,.72)): the Settings dialog.

### Named Rules
**The Night Layer Rule.** Between sunset and sunrise a fixed `#03140d` layer at .45 opacity dims the whole dashboard over a 2s fade. Clicks pass through it. It is the only full-screen overlay.

## Shapes

Soft, generous corners in two steps: 24px for cards, dialog and plaque (20px at ≤760px), 12px for everything inside a card (rows, forecast tiles, fields, buttons). Settings sections and the video well use 16px. Badges are full pills (99px); refresh buttons, the LIVE dot and solar nodes are circles. Flow tracks are 3px lines with 3px corners. News rows add a 3px brass-gold left rule. Borders are 1px hairlines; no card has a border.

## Components

### Buttons
- **Shape:** gently rounded (12px), at least 44px tall.
- **Primary:** cream fill with deep-green text (Save profile, Sign in), padding 0 18px, Figtree 600 15px. Hover: white fill.
- **Secondary:** transparent with a cream outline (rgba(244,239,227,.6)) and cream text. Hover (pointer devices only): soft-gold border on a deep-green fill.
- **Danger:** secondary with error-blush text and outline.
- **Refresh:** a 36px circle (40px at ≤760px) with a hairline border and a Lucide refresh icon; under `pointer: coarse` an invisible ring extends its hit area to 48px. Press: scale .94.
- **Settings:** cream-outline header button with the house's settings.png illustration (30px) and the word Settings.
- **Disabled:** .5 opacity, not-allowed cursor.

### Chips
- **LIVE pill:** live red with cream micro text over the Sky News video.
- **Flow badges:** pills in the path's colour with ink-on-light micro text, on each line; hidden at ≤760px.
- **Live state:** an 8px soft-gold dot and gold-text label LIVE; OFFLINE turns it into a sage ring with sage text and the last good time.

### Cards / Containers
- **Corner Style:** 24px (20px at ≤760px).
- **Background:** card green on the house-green page; no border, no shadow.
- **Internal Padding:** 22px 22px 24px (16px at ≤760px); Sky News 12px around its 16px-cornered video; the solar card pads its diagram 20px 22px.

### Rows
- **News row:** row green, 12px corners, 3px brass-gold left rule, 10px 14px padding, body-small cream text; hover card-hover green.
- **Forecast tile:** row green, 12px, centred: sage label, soft-gold Lucide weather icon, tabular max / sage min.

### Inputs / Fields
- **Style:** deep-green fill, hairline border, 12px corners, 44px tall, Figtree 16px cream.
- **Focus:** soft-gold border plus a 1px soft-gold ring; autofill keeps the deep-green field.
- **Labels:** cream 14px 500 above the field. Checkboxes sit in a 44px check row that tints row green on hover.

### Navigation
The header is the only navigation: brand left, actions right (profile select, live state, Settings), all as cream-outline 44px controls; it wraps at ≤520px. Settings opens in a 520px dialog on house green with card-green fieldsets.

### Solar Flow Diagram (signature)
Five circles (PV top, grid, inverter and home in a row, battery bottom), 76px, row-green fill with a 45% brass rim, joined by 3px tracks. A live path goes to full opacity and its dashes (8px on, 8px off) slide one 16px period in .5s, by `transform` only, so the endless loop never triggers layout. Idle paths rest at .35 opacity with no dashes. Under reduced motion the dashes drift three times slower (1.5s) rather than stopping, because direction is the information. Labels sit beside the PV, inverter and battery circles, clear of the vertical lines.

### Sign-in
Photo column (poodle.jpg) with the cream uppercase Marcellus plaque "Morning Desk"; the 96px desk poodle, Marcellus "Sign in", fields, a full-width cream submit and, when enabled, an outline "Sign in with Poodle House" button below an "or" divider. A Lucide eye toggle sits inside the password field.

### Icons
Lucide line icons (ISC License) at text size, stroke 1.75, round caps and joins, `currentColor`, inserted through the `icon()` helper in `app.js` (or `data-icon` attributes). An icon is hidden from screen readers unless it alone carries meaning, then it gets a label.

## Assets

Raster and font files are copied unchanged from the Poodle House theme repo (`~/poodle-house/poodle-house/`, GitHub GunsToy/poodle-house). Replace them there and re-copy; do not edit them here.

- `public/images/desk.png`: the desk-poodle illustration, the brand mark (header 64px, sign-in 96px) and the favicon. From `images/desk.png`, last changed in commit c00daad.
- `public/images/poodle.jpg`: the sign-in photo column. From `images/poodle.jpg`, last changed in commit f56d904.
- `public/images/settings.png`: the Settings button illustration. From `images/settings.png`, last changed in commit c00daad.
- `public/fonts/marcellus.woff2`, `public/fonts/figtree.woff2`: Marcellus and Figtree, Latin subset, from the theme's `fonts/`. SIL Open Font License (`public/fonts/OFL-Marcellus.txt`, `public/fonts/OFL-Figtree.txt`). Self-hosted; `server.mjs` sets CSP `font-src 'self'`.
- The old `public/logo.svg` is removed.

## Do's and Don'ts

### Do:
- **Do** take colours and fonts from the Poodle House tokens; add a desk-only token only for a job the house does not have.
- **Do** keep state honest: LIVE or OFFLINE with the last good time, "last update" labels when data is stale, never old data shown as current.
- **Do** use tabular figures for every readout that refreshes in place.
- **Do** keep every tap target at least 44px (`--tap`).
- **Do** animate endless motion with `transform` only, and slow it (1.5s) under reduced motion instead of stopping it.
- **Do** draw icons as Lucide line icons through the `icon()` helper.
- **Do** keep the night-mode dim layer above everything and click-through.
- **Do** hide the flow badges at ≤760px; the labels beside each circle already carry the figures.

### Don't:
- **Don't** bring back the dark neon dashboard (lime, coral, cyan, slate, Manrope, DM Mono).
- **Don't** use brass gold (#c4a35a) for text on green; use Gold Text (#f5e6bb).
- **Don't** add a fourth flow colour or recolour a path; sun, battery and grid colours are user-confirmed.
- **Don't** put shadows or borders on cards; depth is the four greens.
- **Don't** edit the copied images or fonts in this repo; change them in the Poodle House theme and re-copy.
- **Don't** add continuous effects (blur, glow, layout-driven animation, frequent polling) to the always-on screen.
