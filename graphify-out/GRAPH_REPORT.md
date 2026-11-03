# Graph Report - morning-desk  (2026-11-03)

## Corpus Check
- 12 files · ~21,637 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 320 nodes · 469 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.88)
- Token cost: 58,291 input · 0 output

## Community Hubs (Navigation)
- Dashboard Frontend
- Profile Store
- Install Scripts
- Dashboard UI Components
- Solar Provider Helpers
- Express Server
- Session Auth
- Design System Tokens
- Docker Compose
- CI Test Workflow
- Package Manifest
- Provider Registry
- Login Script
- Update Script
- Docker Entrypoint
- Daily Self-Update

## God Nodes (most connected - your core abstractions)
1. `loadAll()` - 12 edges
2. `morning-desk` - 9 edges
3. `esc()` - 8 edges
4. `fetchReadings()` - 7 edges
5. `Morning Desk logo: lime sun rising over a desk line` - 7 edges
6. `install-proxmox.sh script` - 7 edges
7. `loadSolar()` - 7 edges
8. `populateSettings()` - 7 edges
9. `saveSettings()` - 7 edges
10. `TRUST_PROXY` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Night Page (#090d13)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Login mark (inline rising-sun logo)` --semantically_similar_to--> `Morning Desk logo: lime sun rising over a desk line`  [INFERRED] [semantically similar]
  public/login.html → public/logo.svg
- `Morning Desk logo: lime sun rising over a desk line` --references--> `Morning Lime (#c7ff47)`  [INFERRED]
  public/logo.svg → DESIGN.md
- `Dashboard layout grid` --references--> `Dashboard page (index.html)`  [INFERRED]
  DESIGN.md → public/index.html
- `Solar panel (flow diagram)` --implements--> `Solar Flow Diagram (signature)`  [INFERRED]
  public/index.html → DESIGN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Light-on-hardware constraints** — product_light_on_hardware, design_cheap_effects, readme_min_interval_ms, readme_container_requirements [INFERRED 0.75]
- **Sign-in flow (password, remember me, Poodle House SSO)** — public_login_login_page, public_login_login_form, public_login_sso_button, readme_profile_sign_in, readme_remember_me [INFERRED 0.85]
- **Home power at a glance (solar diagram)** — product_power_question, public_index_solar_panel, design_solar_flow_diagram, design_meaningful_flow_rule, readme_solar_providers [INFERRED 0.85]
- **Authentication and sign-in hardening** — readme_login_page, readme_house_admin, readme_profile_sign_in, readme_scrypt_password_hashing, readme_login_lockout, readme_trust_proxy, readme_sso_poodle_house [EXTRACTED 1.00]
- **Pluggable solar provider architecture** — readme_solar_providers, readme_growatt, providers_common, readme_providers_index, readme_min_interval_ms [EXTRACTED 1.00]
- **Install and update lifecycle** — install_proxmox, install, readme_update_sh, readme_test_gated_update, readme_env_file [INFERRED 0.85]

## Communities (17 total, 4 thin omitted)

### Community 0 - "Dashboard Frontend"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 1 - "Profile Store"
Cohesion: 0.07
Nodes (25): ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), claimSsoUser(), cleanLogin(), cleanProfile(), cleanSession() (+17 more)

### Community 2 - "Install Scripts"
Cohesion: 0.08
Nodes (26): ensure_template(), log(), next_ctid(), prompt_ip(), prompt_settings(), select_storage(), install-proxmox.sh script, install.sh script (+18 more)

### Community 3 - "Dashboard UI Components"
Cohesion: 0.08
Nodes (29): Button components, Header navigation, Inline SVG line icons (icon() helper, Lucide), Input fields, Dashboard layout grid, Morning Lime (#c7ff47), Night mode overlay, Panel card (+21 more)

### Community 4 - "Solar Provider Helpers"
Cohesion: 0.11
Nodes (26): applyFields(), DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), publicSchema(), secretFields() (+18 more)

### Community 5 - "Express Server"
Cohesion: 0.10
Nodes (23): app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError(), isAdmin() (+15 more)

### Community 6 - "Session Auth"
Cohesion: 0.10
Nodes (14): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), readCookie() (+6 more)

### Community 7 - "Design System Tokens"
Cohesion: 0.10
Nodes (17): Color tokens, Ember Coral (#ff846c), Morning Desk Design System, Night Page (#090d13), Signal Cyan (#58e2ff), Solar diagram night-blue palette, Solar Flow Diagram (signature), Typography (Manrope + DM Mono) (+9 more)

### Community 8 - "Docker Compose"
Cohesion: 0.12
Nodes (15): interval, retries, start_period, test, timeout, build, container_name, environment (+7 more)

### Community 9 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 10 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 11 - "Provider Registry"
Cohesion: 0.29
Nodes (3): all, byId, DEFAULT_PROVIDER

### Community 12 - "Login Script"
Cohesion: 0.40
Nodes (3): form, SSO_ERRORS, status

## Knowledge Gaps
- **19 isolated node(s):** `Daily 04:15 self-update gated on passing tests`, `Dashboard layout grid`, `Night mode overlay`, `Household users and admin`, `Open-Meteo` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 127 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Solar providers` connect `Design System Tokens` to `Solar Provider Helpers`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Morning Desk logo: lime sun rising over a desk line` (e.g. with `Login mark (inline rising-sun logo)` and `Morning Lime (#c7ff47)`) actually correct?**
  _`Morning Desk logo: lime sun rising over a desk line` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Daily 04:15 self-update gated on passing tests`, `Dashboard layout grid`, `Night mode overlay` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._
- **Why does `Settings dialog (profiles)` connect `Design System Tokens` to `Dashboard UI Components`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `Profile Store` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._
- **Why does `app.js (dashboard script)` connect `Dashboard UI Components` to `Design System Tokens`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._