# Graph Report - morning-desk  (2026-11-09)

## Corpus Check
- 27 files · ~24,317 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .css 1)

## Summary
- 344 nodes · 542 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c3dfb74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Solar Provider Adapters
- Brand and Page Design
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
- `Login mark (inline rising-sun logo)` --semantically_similar_to--> `Morning Desk logo: lime sun rising over a desk line`  [INFERRED] [semantically similar]
  public/login.html → public/logo.svg
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Night Page (#090d13)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Morning Lime (#c7ff47)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Dashboard layout grid` --references--> `Dashboard page (index.html)`  [INFERRED]
  DESIGN.md → public/index.html
- `Sign-in page (login.html)` --conceptually_related_to--> `Inline SVG line icons (icon() helper, Lucide)`  [INFERRED]
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

## Communities (15 total, 3 thin omitted)

### Community 0 - "Solar Provider Adapters"
Cohesion: 0.07
Nodes (43): applyFields(), DEFAULT_MAX, FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), numberOrNull(), publicSchema(), secretFields() (+35 more)

### Community 1 - "Brand and Page Design"
Cohesion: 0.05
Nodes (38): Button components, Color tokens, Ember Coral (#ff846c), Header navigation, Inline SVG line icons (icon() helper, Lucide), Input fields, Dashboard layout grid, Morning Desk Design System (+30 more)

### Community 2 - "Dashboard Front-end"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 3 - "Config Store and Profiles"
Cohesion: 0.07
Nodes (25): ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), claimSsoUser(), cleanLogin(), cleanProfile(), cleanSession() (+17 more)

### Community 4 - "Installers and Env Settings"
Cohesion: 0.09
Nodes (24): services, ensure_template(), log(), next_ctid(), prompt_ip(), prompt_settings(), select_storage(), install-proxmox.sh script (+16 more)

### Community 5 - "HTTP Server Routes"
Cohesion: 0.10
Nodes (25): describeSettings(), app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError() (+17 more)

### Community 6 - "Sessions and Passwords"
Cohesion: 0.11
Nodes (14): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), readCookie() (+6 more)

### Community 7 - "README Concepts"
Cohesion: 0.11
Nodes (19): config.example.json (Erasmuskloof example), Profiles (per home or screen), Settings dialog (profiles), Login form (username, password, remember me), login.js (sign-in script), config.json, Weather, Sky News Live and News Feeds, Growatt (+11 more)

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

## Ambiguous Edges - Review These
- `TRUST_PROXY` → `Sign in with Poodle House (OIDC SSO)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **22 isolated node(s):** `Sign in with Poodle House button`, `Ember Coral (#ff846c)`, `Input fields`, `Dashboard layout grid`, `Night mode overlay` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 131 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Solar Providers` connect `README Concepts` to `Solar Provider Adapters`, `Brand and Page Design`?**
  _High betweenness centrality (0.336) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Solar Providers` (e.g. with `Settings dialog (profiles)` and `Sign in with Poodle House (OIDC SSO)`) actually correct?**
  _`Solar Providers` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Sign in with Poodle House button`, `Ember Coral (#ff846c)`, `Input fields` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Solar Provider Adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
- **Why does `Sign in with Poodle House (OIDC SSO)` connect `README Concepts` to `Installers and Env Settings`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Should `Brand and Page Design` be split into smaller, more focused modules?**
  _Cohesion score 0.05442176870748299 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `TRUST_PROXY` and `Sign in with Poodle House (OIDC SSO)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._