# Graph Report - morning-desk  (2026-11-03)

## Corpus Check
- 7 files · ~24,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 341 nodes · 526 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.89)
- Token cost: 58,562 input · 0 output

## Community Hubs (Navigation)
- Solar Providers
- Design System and UI
- Dashboard Frontend
- Profile Store
- Install Scripts
- Express Server
- Session Auth
- Profiles and Settings Docs
- Docker Compose
- CI Test Workflow
- Package Manifest
- Login Script
- Update Script
- Docker Entrypoint
- Daily Self-Update

## God Nodes (most connected - your core abstractions)
1. `loadAll()` - 12 edges
2. `morning-desk` - 9 edges
3. `esc()` - 8 edges
4. `Solar Providers` - 8 edges
5. `loadSolar()` - 7 edges
6. `populateSettings()` - 7 edges
7. `saveSettings()` - 7 edges
8. `install-proxmox.sh script` - 7 edges
9. `Morning Desk logo: lime sun rising over a desk line` - 7 edges
10. `summariseFlow()` - 7 edges

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
- **Settings held in .env** — readme_dotenv_file, readme_admin_password_env, readme_trust_proxy, readme_sso_env_vars [EXTRACTED 1.00]
- **Solar provider plugin architecture** — readme_growatt, readme_sunsynk_deye, readme_victron_vrm, readme_provider_common_shape, readme_provider_registry [EXTRACTED 1.00]
- **Light-on-hardware constraints** — product_light_on_hardware, design_cheap_effects, readme_min_interval_ms, readme_container_requirements [INFERRED 0.75]
- **Login security measures** — readme_scrypt_password_hashing, readme_login_lockout, readme_trust_proxy, readme_remember_me, readme_sso_username_pinning [INFERRED 0.85]
- **Sign-in flow (password, remember me, Poodle House SSO)** — public_login_login_page, public_login_login_form, public_login_sso_button, readme_remember_me [INFERRED 0.85]
- **Home power at a glance (solar diagram)** — product_power_question, public_index_solar_panel, design_solar_flow_diagram, design_meaningful_flow_rule, readme_solar_providers [INFERRED 0.85]

## Communities (16 total, 4 thin omitted)

### Community 0 - "Solar Providers"
Cohesion: 0.07
Nodes (44): applyFields(), DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), numberOrNull(), publicSchema() (+36 more)

### Community 1 - "Design System and UI"
Cohesion: 0.06
Nodes (37): Button components, Color tokens, Ember Coral (#ff846c), Header navigation, Inline SVG line icons (icon() helper, Lucide), Input fields, Dashboard layout grid, Morning Desk Design System (+29 more)

### Community 2 - "Dashboard Frontend"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 3 - "Profile Store"
Cohesion: 0.07
Nodes (25): ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), claimSsoUser(), cleanLogin(), cleanProfile(), cleanSession() (+17 more)

### Community 4 - "Install Scripts"
Cohesion: 0.09
Nodes (22): ensure_template(), log(), next_ctid(), prompt_ip(), prompt_settings(), select_storage(), install-proxmox.sh script, install.sh script (+14 more)

### Community 5 - "Express Server"
Cohesion: 0.10
Nodes (23): app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError(), isAdmin() (+15 more)

### Community 6 - "Session Auth"
Cohesion: 0.11
Nodes (14): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), readCookie() (+6 more)

### Community 7 - "Profiles and Settings Docs"
Cohesion: 0.12
Nodes (13): config.example.json (Erasmuskloof example), Profiles (per home or screen), Settings dialog (profiles), Login form (username, password, remember me), login.js (sign-in script), config.json, config.json v3 Migration, Growatt Provider (+5 more)

### Community 8 - "Docker Compose"
Cohesion: 0.12
Nodes (15): interval, retries, start_period, test, timeout, build, container_name, environment (+7 more)

### Community 9 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 10 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 11 - "Login Script"
Cohesion: 0.40
Nodes (3): form, SSO_ERRORS, status

## Knowledge Gaps
- **20 isolated node(s):** `Daily 04:15 self-update gated on passing tests`, `login.js (sign-in script)`, `Sign in with Poodle House button`, `Input fields`, `Dashboard layout grid` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 134 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `Package Manifest` to `Express Server`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Daily 04:15 self-update gated on passing tests`, `login.js (sign-in script)`, `Sign in with Poodle House button` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Solar Providers` be split into smaller, more focused modules?**
  _Cohesion score 0.06954887218045112 - nodes in this community are weakly interconnected._
- **Why does `app.js (dashboard script)` connect `Design System and UI` to `Profiles and Settings Docs`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Design System and UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05893719806763285 - nodes in this community are weakly interconnected._
- **Why does `config.json` connect `Profiles and Settings Docs` to `Install Scripts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Dashboard Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._