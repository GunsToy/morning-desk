# Graph Report - morning-desk  (2026-11-13)

## Corpus Check
- 29 files · ~28,341 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .woff2 2, .css 1)

## Summary
- 351 nodes · 546 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a13a053`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Solar Provider Adapters
- Color tokens
- Dashboard Front-end
- Config Store and Profiles
- Installers and Env Settings
- HTTP Server Routes
- Sessions and Passwords
- README Concepts
- CI Test Workflow
- Docker Compose Service
- Package Manifest
- Login Page Script
- Container Entrypoint
- Nightly Self-Update
- app.js (dashboard script)
- growatt.mjs
- sso.mjs
- Morning Desk dashboard and sign-in

## God Nodes (most connected - your core abstractions)
1. `loadAll()` - 12 edges
2. `Solar Providers` - 10 edges
3. `morning-desk` - 9 edges
4. `esc()` - 8 edges
5. `install-proxmox.sh script` - 7 edges
6. `summariseFlow()` - 7 edges
7. `fetchReadings()` - 7 edges
8. `loadSolar()` - 7 edges
9. `populateSettings()` - 7 edges
10. `saveSettings()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Inline SVG line icons (icon() helper, Lucide)` --references--> `app.js (dashboard script)`  [EXTRACTED]
  DESIGN.md → public/index.html
- `Dashboard layout grid` --references--> `Dashboard page (index.html)`  [INFERRED]
  DESIGN.md → public/index.html
- `Solar panel (flow diagram)` --implements--> `Solar Flow Diagram (signature)`  [INFERRED]
  public/index.html → DESIGN.md
- `Sign-in page (login.html)` --conceptually_related_to--> `Inline SVG line icons (icon() helper, Lucide)`  [INFERRED]
  public/login.html → DESIGN.md
- `Sign-in page (login.html)` --implements--> `Sign-in card`  [INFERRED]
  public/login.html → DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication and Sign-In** — readme_login_page, readme_house_admin, readme_profile_sign_in, readme_remember_me, readme_login_lockout, readme_poodle_house_sso [EXTRACTED 1.00]
- **Solar Provider Plugin System** — readme_solar_providers, readme_growatt, readme_sunsynk_deye, readme_victron_vrm, providers_common, providers_index [EXTRACTED 1.00]
- **Light-on-hardware constraints** — product_light_on_hardware, design_cheap_effects, readme_min_interval_ms, readme_container_requirements [INFERRED 0.75]
- **Installation and Self-Update** — install, install_proxmox, update, readme_update_timer, readme_test_gated_update [INFERRED 0.85]
- **Sign-in flow (password, remember me, Poodle House SSO)** — public_login_login_page, public_login_login_form, public_login_sso_button, readme_remember_me [INFERRED 0.85]
- **Home power at a glance (solar diagram)** — product_power_question, public_index_solar_panel, design_solar_flow_diagram, design_meaningful_flow_rule, readme_solar_providers [INFERRED 0.85]

## Communities (19 total, 4 thin omitted)

### Community 0 - "Solar Provider Adapters"
Cohesion: 0.10
Nodes (27): applyFields(), DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), numberOrNull(), publicSchema() (+19 more)

### Community 1 - "Color tokens"
Cohesion: 0.10
Nodes (15): Button components, Color tokens, Ember Coral (#ff846c), Input fields, Morning Desk Design System, Morning Lime (#c7ff47), Night Page (#090d13), Panel card (+7 more)

### Community 2 - "Dashboard Front-end"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 3 - "Config Store and Profiles"
Cohesion: 0.08
Nodes (25): ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), claimSsoUser(), cleanLogin(), cleanProfile(), cleanSession() (+17 more)

### Community 4 - "Installers and Env Settings"
Cohesion: 0.08
Nodes (26): services, ensure_template(), log(), next_ctid(), prompt_ip(), prompt_settings(), select_storage(), install-proxmox.sh script (+18 more)

### Community 5 - "HTTP Server Routes"
Cohesion: 0.10
Nodes (22): app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError(), isAdmin() (+14 more)

### Community 6 - "Sessions and Passwords"
Cohesion: 0.10
Nodes (17): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), MAX_SESSIONS_PER_SIGN_IN (+9 more)

### Community 7 - "README Concepts"
Cohesion: 0.11
Nodes (21): Inline SVG line icons (icon() helper, Lucide), config.example.json (Erasmuskloof example), Profiles (per home or screen), Settings dialog (profiles), Login form (username, password, remember me), login.js (sign-in script), Login mark (inline rising-sun logo), Sign-in page (login.html) (+13 more)

### Community 8 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 9 - "Docker Compose Service"
Cohesion: 0.14
Nodes (14): interval, retries, start_period, test, timeout, build, container_name, environment (+6 more)

### Community 10 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 11 - "Login Page Script"
Cohesion: 0.40
Nodes (3): form, SSO_ERRORS, status

### Community 15 - "app.js (dashboard script)"
Cohesion: 0.12
Nodes (18): Header navigation, Dashboard layout grid, Night mode overlay, Growatt OpenAPI, Household users and admin, Morning Desk product definition, RSS news feeds and Sky News YouTube stream, Open-Meteo (+10 more)

### Community 16 - "growatt.mjs"
Cohesion: 0.22
Nodes (8): fetchReadings(), growattLatestDeviceData(), growattOpenApiRequest(), normaliseSolar(), openApiBase(), pickDevices(), pickPlant(), SERVERS

### Community 17 - "sso.mjs"
Cohesion: 0.25
Nodes (10): USER_AGENT, adminGroup, authorizeUrl(), enabled, endpoints(), fetchJson(), identify(), name (+2 more)

## Ambiguous Edges - Review These
- `TRUST_PROXY` → `Sign in with Poodle House (OIDC SSO)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **24 isolated node(s):** `Login mark (inline rising-sun logo)`, `Sign in with Poodle House button`, `Ember Coral (#ff846c)`, `Input fields`, `Dashboard layout grid` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 138 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Solar Providers` connect `README Concepts` to `Solar Provider Adapters`, `Color tokens`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Solar Providers` (e.g. with `Settings dialog (profiles)` and `Sign in with Poodle House (OIDC SSO)`) actually correct?**
  _`Solar Providers` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Login mark (inline rising-sun logo)`, `Sign in with Poodle House button`, `Ember Coral (#ff846c)` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Solar Provider Adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._
- **Why does `Sign in with Poodle House (OIDC SSO)` connect `README Concepts` to `Installers and Env Settings`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `Color tokens` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `TRUST_PROXY` and `Sign in with Poodle House (OIDC SSO)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._