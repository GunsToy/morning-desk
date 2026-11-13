# Graph Report - morning-desk  (2026-11-13)

## Corpus Check
- 33 files · ~28,341 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 347 nodes · 546 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Design System & Brand
- Solar Provider Adapters
- Dashboard Front-end
- HTTP Server Routes
- Config Store and Profiles
- Sessions and Passwords
- Product Principles
- Docker Compose Service
- CI Test Workflow
- Test Suite
- Package Manifest
- SSO Sign-in
- Proxmox Installer
- Installers and Update Timer
- Desk Illustration
- Poodle Photo
- Settings Illustration
- Nightly Self-Update
- Container Entrypoint

## God Nodes (most connected - your core abstractions)
1. `Design System: Morning Desk` - 18 edges
2. `Morning Desk README` - 14 edges
3. `loadAll()` - 12 edges
4. `Morning Desk dashboard page` - 11 edges
5. `morning-desk` - 9 edges
6. `Sign-in page` - 9 edges
7. `esc()` - 8 edges
8. `Product purpose: weather and power at a glance` - 8 edges
9. `install-proxmox.sh script` - 7 edges
10. `summariseFlow()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Direction contract` --semantically_similar_to--> `Creative North Star: A Room of Poodle House`  [INFERRED] [semantically similar]
  .impeccable/surfaces/public-index-html.md → DESIGN.md
- `form` --implements--> `Remember me (90-day sign-in)`  [INFERRED]
  public/login.js → README.md
- `publicProfile()` --calls--> `describeSettings()`  [EXTRACTED]
  server.mjs → providers/common.mjs
- `Sign-in component` --implements--> `Sign-in page`  [INFERRED]
  DESIGN.md → public/login.html
- `Settings dialog form` --implements--> `Profiles`  [INFERRED]
  public/index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Solar power flow display** — design_solar_flow_diagram, design_three_paths_rule, public_index_solar_diagram, readme_solar_providers [INFERRED 0.85]
- **Poodle House shared identity and sign-in** — _impeccable_surfaces_public_index_html_poodle_house_theme, readme_sso_poodle_house, public_login_sso_button, design_room_of_poodle_house [INFERRED 0.85]
- **Always-on glance surface principles** — product_glanceable, product_light_on_hardware, design_night_layer_rule, design_tabular_readout_rule [INFERRED 0.75]

## Communities (19 total, 4 thin omitted)

### Community 0 - "Design System & Brand"
Cohesion: 0.05
Nodes (43): Desk poodle brand mark (desk.png), Poodle House theme (tokens.css), Morning Desk dashboard and sign-in surface, Assets copied from Poodle House theme, Buttons component, Cards / containers, Chips (LIVE pill, flow badges, live state), Tonal elevation and shadow vocabulary (+35 more)

### Community 1 - "Solar Provider Adapters"
Cohesion: 0.09
Nodes (33): applyFields(), DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, numberOrNull(), secretFields(), splitBatteryPower() (+25 more)

### Community 2 - "Dashboard Front-end"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 3 - "HTTP Server Routes"
Cohesion: 0.09
Nodes (25): keepPreviousFlow(), publicSchema(), app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname (+17 more)

### Community 4 - "Config Store and Profiles"
Cohesion: 0.11
Nodes (24): ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), claimSsoUser(), cleanLogin(), cleanProfile(), cleanSession() (+16 more)

### Community 5 - "Sessions and Passwords"
Cohesion: 0.10
Nodes (17): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), MAX_SESSIONS_PER_SIGN_IN (+9 more)

### Community 6 - "Product Principles"
Cohesion: 0.11
Nodes (19): First viewport layout, Dashboard layout and breakpoints, Data sources (Growatt, Open-Meteo, RSS, Sky News), Operating context (Docker, Proxmox LXC, daily update), Product purpose: weather and power at a glance, Household users and admin, ADMIN_PASSWORD env, config.json (v3) (+11 more)

### Community 7 - "Docker Compose Service"
Cohesion: 0.12
Nodes (15): interval, retries, start_period, test, timeout, build, container_name, environment (+7 more)

### Community 8 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 10 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 11 - "SSO Sign-in"
Cohesion: 0.29
Nodes (9): adminGroup, authorizeUrl(), enabled, endpoints(), fetchJson(), identify(), name, publicUrl (+1 more)

### Community 12 - "Proxmox Installer"
Cohesion: 0.42
Nodes (7): ensure_template(), log(), next_ctid(), prompt_ip(), prompt_settings(), select_storage(), install-proxmox.sh script

### Community 14 - "Desk Illustration"
Cohesion: 0.67
Nodes (4): Desk Illustration (Poodle Mascot with Laptop), Laptop with Text Lines, Gold/Green/White Palette, White Poodle Mascot

### Community 15 - "Poodle Photo"
Cohesion: 0.67
Nodes (4): Black Poodle, Poodle Photo (two standard poodles), Warm Neutral Interior Setting, White Standard Poodle

### Community 16 - "Settings Illustration"
Cohesion: 0.67
Nodes (4): Gold/Green Brand Palette, Gold Gear Icon, Settings Illustration (poodle + gear), White Poodle Mascot

## Knowledge Gaps
- **16 isolated node(s):** `Shapes (24px / 12px corners)`, `Buttons component`, `Cards / containers`, `Rows (news row, forecast tile)`, `Inputs / fields` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 128 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `Package Manifest` to `HTTP Server Routes`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Shapes (24px / 12px corners)`, `Buttons component`, `Cards / containers` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design System & Brand` be split into smaller, more focused modules?**
  _Cohesion score 0.050314465408805034 - nodes in this community are weakly interconnected._
- **Why does `Design System: Morning Desk` connect `Design System & Brand` to `Product Principles`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Solar Provider Adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.09393939393939393 - nodes in this community are weakly interconnected._
- **Why does `Morning Desk README` connect `Product Principles` to `Design System & Brand`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `Dashboard Front-end` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._