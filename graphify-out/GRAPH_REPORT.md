# Graph Report - morning-desk  (2026-10-30)

## Corpus Check
- Corpus is ~20,394 words - fits in a single context window. You may not need a graph.

## Summary
- 304 nodes · 441 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dashboard Frontend
- Profile Store
- Solar Providers and SSO
- Express Server
- Dashboard Design Concepts
- Session Auth
- Brand and Sign-in UI
- Profiles and Settings Docs
- Docker Compose
- CI Test Workflow
- Package Manifest
- Proxmox Installer
- Provider Registry
- Login Script
- Install Scripts
- Update Script
- Docker Entrypoint
- Daily Self-Update
- Container Requirements

## God Nodes (most connected - your core abstractions)
1. `loadAll()` - 12 edges
2. `morning-desk` - 9 edges
3. `esc()` - 8 edges
4. `fetchReadings()` - 7 edges
5. `loadSolar()` - 7 edges
6. `populateSettings()` - 7 edges
7. `saveSettings()` - 7 edges
8. `Profile sign-in and house admin` - 7 edges
9. `Morning Desk logo: lime sun rising over a desk line` - 7 edges
10. `healthcheck` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Night Page (#090d13)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Login mark (inline rising-sun logo)` --semantically_similar_to--> `Morning Desk logo: lime sun rising over a desk line`  [INFERRED] [semantically similar]
  public/login.html → public/logo.svg
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Morning Lime (#c7ff47)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Dashboard layout grid` --references--> `Dashboard page (index.html)`  [INFERRED]
  DESIGN.md → public/index.html
- `Sign-in card` --references--> `Morning Desk logo: lime sun rising over a desk line`  [EXTRACTED]
  DESIGN.md → public/logo.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Light-on-hardware constraints** — product_light_on_hardware, design_cheap_effects, readme_min_interval_ms, readme_container_requirements [INFERRED 0.75]
- **Home power at a glance (solar diagram)** — product_power_question, public_index_solar_panel, design_solar_flow_diagram, design_meaningful_flow_rule, readme_solar_providers [INFERRED 0.85]
- **Sign-in flow (password, remember me, Poodle House SSO)** — public_login_login_page, public_login_login_form, public_login_sso_button, readme_profile_sign_in, readme_poodle_house_sso, readme_remember_me [INFERRED 0.85]

## Communities (20 total, 6 thin omitted)

### Community 0 - "Dashboard Frontend"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 1 - "Profile Store"
Cohesion: 0.07
Nodes (23): applyFields(), ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), cleanLogin(), cleanProfile(), cleanSession() (+15 more)

### Community 2 - "Solar Providers and SSO"
Cohesion: 0.11
Nodes (26): DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), publicSchema(), secretFields(), USER_AGENT (+18 more)

### Community 3 - "Express Server"
Cohesion: 0.11
Nodes (23): app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError(), isAdmin() (+15 more)

### Community 4 - "Dashboard Design Concepts"
Cohesion: 0.10
Nodes (18): Dashboard layout grid, Morning Desk Design System, Night mode overlay, Solar Flow Diagram (signature), Typography (Manrope + DM Mono), Household users and admin, Morning Desk product definition, RSS news feeds and Sky News YouTube stream (+10 more)

### Community 5 - "Session Auth"
Cohesion: 0.10
Nodes (14): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), readCookie() (+6 more)

### Community 6 - "Brand and Sign-in UI"
Cohesion: 0.13
Nodes (17): Button components, Color tokens, Ember Coral (#ff846c), Header navigation, Inline SVG line icons (icon() helper, Lucide), Input fields, Morning Lime (#c7ff47), Night Page (#090d13) (+9 more)

### Community 7 - "Profiles and Settings Docs"
Cohesion: 0.13
Nodes (18): config.example.json (Erasmuskloof example), Growatt OpenAPI, Profiles (per home or screen), Victron provider (branch), Settings dialog (profiles), Login form (username, password, remember me), login.js (sign-in script), Sign in with Poodle House button (+10 more)

### Community 8 - "Docker Compose"
Cohesion: 0.12
Nodes (15): interval, retries, start_period, test, timeout, build, container_name, environment (+7 more)

### Community 9 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 10 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 11 - "Proxmox Installer"
Cohesion: 0.46
Nodes (6): ensure_template(), log(), next_ctid(), prompt_ip(), select_storage(), install-proxmox.sh script

### Community 12 - "Provider Registry"
Cohesion: 0.29
Nodes (3): all, byId, DEFAULT_PROVIDER

### Community 13 - "Login Script"
Cohesion: 0.40
Nodes (3): form, SSO_ERRORS, status

## Knowledge Gaps
- **19 isolated node(s):** `Ember Coral (#ff846c)`, `Signal Cyan (#58e2ff)`, `Dashboard layout grid`, `Night mode overlay`, `Panel card` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 126 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `Package Manifest` to `Express Server`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `Ember Coral (#ff846c)`, `Signal Cyan (#58e2ff)`, `Dashboard layout grid` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._
- **Why does `Sign-in page (login.html)` connect `Brand and Sign-in UI` to `Profiles and Settings Docs`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Should `Profile Store` be split into smaller, more focused modules?**
  _Cohesion score 0.07422402159244265 - nodes in this community are weakly interconnected._
- **Should `Solar Providers and SSO` be split into smaller, more focused modules?**
  _Cohesion score 0.10591133004926108 - nodes in this community are weakly interconnected._
- **Should `Express Server` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._