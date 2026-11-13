---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/login.html"]
---

# Morning Desk dashboard and sign-in

Scope: `/` (dashboard, Operate) and `/login` (sign-in, Operate). Household members glance at it each morning, often on an always-on wall screen at a distance, and reach it from the Poodle House "Morning Desk" tile. Weather and the home's power come first; news and Sky News support. Behaviour, data and markup hooks used by app.js/login.js stay as they are.

Visual world pinned by the user: the Poodle House theme (sibling site, `~/poodle-house/poodle-house/tokens.css`). Choices confirmed by the user: solar diagram in the green world with gold flow lines; brand mark is the Poodle House desk poodle (desk.png); sign-in copies the Poodle House login layout (photo column with plaque).

## Direction contract
THESIS: Morning Desk is a room of Poodle House, not a separate dark gadget. It refuses the generic dark dashboard of glowing neon tiles: same green house, same cream type, same gold hardware.
OWN-WORLD: Poodle House green page (#146b4a), slightly lighter green cards (24px corners) with darker green rows (12px), cream text, muted sage secondary, gold only for lines, accents and focus; Marcellus engraved headings and readouts, Figtree text; cream primary buttons with green text, cream-outline secondary; the desk-poodle illustration as the mark.
STORY: A glance reads today's temperature and whether the house is on sun, battery or grid; the household recognises the same home it just left on Poodle House.
FIRST VIEWPORT: Header row: desk poodle + "Morning Desk" in Marcellus left; profile switcher, live state and Settings right. Weather card full width: date and place left, large Marcellus temperature, five forecast row-tiles. Below: left column Sky News then the solar diagram card; right column news cards with stories as green rows.
FORM: Inherited established world (Poodle House), extended to a sibling surface; no concept roll, position 1 of 1. No concept roll was made: the world is inherited from Poodle House and pinned by the user, so there is no seed reference.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
