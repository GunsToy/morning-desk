---
name: Morning Desk
description: A quiet daily briefing of the weather and the home's power, on a dark screen.
colors:
  lime: "#c7ff47"
  coral: "#ff846c"
  cyan: "#58e2ff"
  ink: "#e9edf3"
  muted: "#8c98aa"
  panel: "#151c27"
  page: "#090d13"
  line: "rgba(236,242,255,.11)"
  control-fill: "#131a25"
  field-fill: "#0a1018"
  field-line: "#626d80"
  secondary-fill: "#263141"
  solar-panel: "#1a1f4a"
  solar-bg-top: "#161b45"
  solar-bg-mid: "#222868"
  solar-bg-end: "#1a2050"
  solar-ink: "#edf1ff"
  solar-label: "#c5cef0"
  solar-muted: "#9eabdb"
  node-fill-light: "#3d4688"
  node-fill-dark: "#2a3270"
  flow-solar: "#a8f06a"
  flow-solar-glint: "#e8ffb0"
  flow-battery: "#5ce2ff"
  flow-battery-glint: "#b8f4ff"
  flow-track: "rgba(140,155,220,.25)"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.7rem, 5vw, 4.5rem)"
    fontWeight: 800
    letterSpacing: "-.08em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.3rem)"
    fontWeight: 800
    letterSpacing: "-.07em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    letterSpacing: "-.03em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
    lineHeight: 1.35
  control:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".8125rem"
    fontWeight: 700
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: ".75rem"
    letterSpacing: ".13em"
  micro:
    fontFamily: "DM Mono, monospace"
    fontSize: ".6875rem"
rounded:
  track: "3px"
  badge: "4px"
  option: "6px"
  control: "7px"
  frame: "10px"
  group: "12px"
  panel-compact: "16px"
  panel: "18px"
  pill: "999px"
  round: "50%"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.page}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-secondary:
    backgroundColor: "{colors.secondary-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-round:
    backgroundColor: "{colors.control-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "38px"
  button-primary-pill:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.page}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    height: "44px"
  button-pill:
    backgroundColor: "{colors.control-fill}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
  input:
    backgroundColor: "{colors.field-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "25px"
---

# Design System: Morning Desk

## Overview

**Creative North Star: "The Morning Brief"**

Morning Desk is a quiet daily briefing, read in a glance before the day starts. The weather and the home's power come first; everything else on the screen is secondary and stays out of their way. The page is dark and calm so it can sit on a screen all day and dim itself at night without glaring.

The look is soft and friendly rather than technical: rounded panels, pill and round controls, and generous spacing, so the whole household is comfortable with it. Precision lives in the readouts, not in hard edges: large tabular numbers, small mono labels, and a solar diagram that reads like a lit night-blue instrument set into the page.

**Key Characteristics:**
- Dark charcoal page with softly lifted, rounded panels.
- One action colour (lime), used for primary actions, focus and live accents.
- The solar diagram is its own night-blue world, with flow colours that mean something (green for solar and household load, cyan for the battery).
- Readouts in large tabular numerals; labels in small uppercase mono.
- Honest state: LIVE or OFFLINE in the header, and stale data is labelled as stale.

## Colors

A near-black page, slate panels, and three accents that each carry one meaning.

### Primary
- **Morning Lime** (`colors.lime`): the one action and focus colour. Primary buttons, the keyboard focus ring, text selection and the caret, the power readout and active news indices.

### Secondary
- **Ember Coral** (`colors.coral`): "live" and attention. The header LIVE badge, the Sky News LIVE tag, destructive actions.
- **Signal Cyan** (`colors.cyan`): links and the battery. Source links, link hovers, battery badges.

### Neutral
- **Daybreak Ink** (`colors.ink`): primary text on dark.
- **Overcast Grey** (`colors.muted`): secondary text, labels, and the OFFLINE badge.
- **Slate Panel** (`colors.panel`) and **Night Page** (`colors.page`): panel and page backgrounds; Night Page is also the text colour on lime buttons.
- **Hairline** (`colors.line`): borders and dividers, always faint.

### Solar diagram
- **Night-blue ground** (`colors.solar-bg-top`, `colors.solar-bg-mid`, `colors.solar-bg-end`, `colors.solar-panel`): the diagram's own gradient background.
- **Moonlit text** (`colors.solar-ink`, `colors.solar-label`, `colors.solar-muted`): heading, node labels, and secondary lines inside the diagram.
- **Node fill** (`colors.node-fill-light` → `colors.node-fill-dark`): the round node buttons' gradient.
- **Flow colours** (`colors.flow-solar` + glint, `colors.flow-battery` + glint, `colors.flow-track`): the moving dashes on each active power path, and the unlit track under them.

### Named Rules
**The One Action Rule.** Lime means "act here" or "you are here" (primary button, focus, live readout). Don't use it for decoration.

**The Meaningful Flow Rule.** In the solar diagram, colour encodes the source: green for solar and household load, cyan for the battery, coral for the grid. Never recolour a path for looks.

## Typography

**Display Font:** Manrope (with sans-serif)
**Label/Mono Font:** DM Mono (with monospace)

**Character:** Manrope is round and friendly for headings, readouts and body text. DM Mono adds the instrument feel, for small labels, timestamps and diagram readouts.

### Hierarchy
- **Display** (800, clamp(2.7rem, 5vw, 4.5rem), tracking −.08em, tabular figures): the big power and temperature readouts.
- **Headline** (800, clamp(2rem, 4vw, 3.3rem), tracking −.07em): the page title.
- **Title** (700, 1rem–1.15rem, tracking −.03em): panel titles such as the date and news source names.
- **Body** (600, 0.875rem / 14px, line-height 1.35): news headlines, messages, dialog intro text.
- **Control** (700, 0.8125rem / 13px): form labels, buttons, selects.
- **Label** (DM Mono, 0.75rem / 12px, tracking .13em, uppercase): section labels, badges, source links, forecast days.
- **Micro** (DM Mono, 0.6875rem / 11px): solar diagram labels and flow badges only.

The sizes are CSS variables on `:root`: `--text-micro`, `--text-meta`, `--text-control`, `--text-body-sm`.

### Named Rules
**The 11px Floor Rule.** No text renders below 11px at any width, including the solar diagram on phones.

**The Steady Numbers Rule.** Numbers that refresh in place use tabular figures, so they never jitter.

## Layout

- **Container:** the dashboard is centred, up to 1420px wide, with side padding of clamp(20px, 4vw, 64px).
- **Grid:** a two-column grid (1fr : 1.25fr) placed by named areas. The weather panel spans the top. The left column holds Sky News and the solar diagram; the right column holds the news stack. Below 760px it becomes one column, in the order weather, left, right.
- **Order:** the HTML order matches the visual order, so keyboard and screen-reader order follow the screen.
- **Adaptive pieces:** the forecast is sized by its own space (a container query at 660px). Above that it's one inline row; below it, five stacked columns. The phone header lets its actions wrap to a second row rather than overflow.

## Elevation & Depth

Depth is soft and ambient. Panels sit on the page with a large, faint drop shadow (`0 20px 60px rgba(0,0,0,.18)`) over a subtle diagonal gradient fill. Inside the solar diagram, active nodes glow in their flow colour to show which sources are live. That glow is state, not decoration. Night mode lays a dark layer over the whole page between sunset and sunrise.

### Named Rules
**The Glow-Means-Live Rule.** A coloured glow appears only on something that is currently active (a live source node, the LIVE badge). Idle elements stay flat.

## Shapes

Soft, rounded forms throughout. Panels have generous 18px corners (16px on phones). Settings groups and fields use 12px, the video frame 10px, controls 7px, option rows 6px, and small badges 4px. Header and status controls are pills or circles. Flow tracks and badges are small, rounded capsules.

## Components

### Buttons
- **Shape:** dialog actions have gently rounded corners (7px); the header Settings control is a pill; refresh and close are circles.
- **Primary:** Morning Lime fill with Night Page text, 10px 14px padding, weight 800.
- **Secondary:** a darker slate fill (`colors.secondary-fill`) with Daybreak Ink text. Destructive actions use Ember Coral text.
- **Round and pill controls:** a dark fill (`colors.control-fill`) with a hairline border. On hover, the border brightens (only on pointers that can hover). On press, the button scales to 94%.
- **Focus:** a 2px Morning Lime ring, 2px outside the control, on every focusable element.
- **Touch:** on touch screens, refresh buttons and source links get an invisible tap area of at least 44px.

### Cards / Containers
- **Corner Style:** 18px radius.
- **Background:** a diagonal slate gradient over Slate Panel.
- **Shadow Strategy:** ambient only (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 25px (16px on phones).

### Inputs / Fields
- **Style:** a Field Fill background (`colors.field-fill`), 1px Field Line border (`colors.field-line`, at least 3:1 against both the field and the panel so the field's edge is visible), 7px radius, 10px padding.
- **Autofill:** browser autofill keeps the Field Fill and Daybreak Ink text; it never paints the field pale.
- **Focus:** the lime focus ring; the caret is lime.

### Sign-in card
- **What it is:** the `/login` page. One panel card, at most 440px wide, centred near the top of the page. Its layout follows the household's other self-hosted sign-in (Mealie), drawn in this system.
- **Parts, top to bottom:** a night-blue header bar (the solar diagram's gradient) with "MORNING DESK" as a Label; a round 88px night-blue mark with a sun line icon, sitting on a hairline; the title ("Sign in", or "Set up Morning Desk" on first run); fields with a leading line icon and a small Overcast Grey label above the value; a show-password eye (44px round, a toggle with a fixed label); "Remember me" (a 44px-tall check row, ticked by default); the status line; the primary pill button; a muted note.
- **The pill primary:** the sign-in button is the one primary button shaped as a pill (`components.button-primary-pill`, up to 300px wide, 44px tall), because it is the page's only action. Dialog actions stay 7px.
- **Focus:** the lime ring wraps the whole field, not just the text input.

### Navigation
- The header has the page title on the left. On the right are the profile switcher (shown only with two or more profiles), the LIVE/OFFLINE badge, and the Settings pill.

### The Solar Flow Diagram (signature)
- **What it is:** a night-blue instrument showing PV, grid, inverter, home and battery as round nodes, joined by thin tracks. Light travels along each active track in the direction the power flows, with a watt badge on each path.
- **Motion:** the dashes move with `transform` only (1.1s linear loop), so the browser never redoes the layout. With reduced motion, they stop, and a static gradient on each lit track shows the direction.

## Do's and Don'ts

### Do:
- **Do** keep weather and power the first things a glance lands on.
- **Do** use the type-size variables (`--text-micro` … `--text-body-sm`) and the colour variables; add a variable rather than a new one-off value when a colour gets reused.
- **Do** label stale or unavailable data in place ("Weather unavailable · last update 02:52", "OFFLINE · 02:53").
- **Do** keep continuous effects cheap: `transform` and `opacity` only, and always a reduced-motion alternative.
- **Do** draw icons as inline SVG line drawings with `currentColor` and round caps and joins, at a constant 1.5px line (the `icon()` helper in `app.js`; shapes from Lucide, ISC licence). Never use emoji or text glyphs as icons.

### Don't:
- **Don't** set text below 11px, even inside the diagram on phones.
- **Don't** use lime decoratively; it marks action, focus and live readouts.
- **Don't** animate layout properties (`top`, `left`, `width`, `height`) in loops.
- **Don't** add polling or effects that cost CPU or GPU continuously; this runs on cheap, always-on hardware.
