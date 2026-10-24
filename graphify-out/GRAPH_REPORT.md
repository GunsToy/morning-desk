# Graph Report - morning-desk  (2026-10-24)

## Corpus Check
- 9 files · ~15,472 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 285 nodes · 428 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.87)
- Token cost: 51,049 input · 0 output

## Community Hubs (Navigation)
- Product, Layout & Deployment
- Front-end App
- Provider Common Helpers
- Profile Store
- Docker Compose
- Auth & Sessions
- CI Test Workflow
- Config & Providers
- Package Manifest
- Proxmox Installer
- Install & Update Scripts
- Docker Entrypoint

## God Nodes (most connected - your core abstractions)
1. `Settings dialog` - 13 edges
2. `loadAll()` - 12 edges
3. `morning-desk` - 9 edges
4. `esc()` - 8 edges
5. `fetchReadings()` - 7 edges
6. `loadSolar()` - 7 edges
7. `saveSettings()` - 7 edges
8. `healthcheck` - 6 edges
9. `install-proxmox.sh script` - 6 edges
10. `Weather panel` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Auth dialog` --implements--> `Admin Password`  [INFERRED]
  public/index.html → README.md
- `Admin password change section` --implements--> `Admin Password`  [INFERRED]
  public/index.html → README.md
- `Solar power-flow diagram` --shares_data_with--> `Growatt solar provider`  [INFERRED]
  public/index.html → README.md
- `Settings dialog` --shares_data_with--> `config.json`  [EXTRACTED]
  public/index.html → README.md
- `install.sh script` --calls--> `install-update-timer.sh script`  [EXTRACTED]
  install.sh → install-update-timer.sh

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Admin authentication and lockout security** — readme_admin_password, readme_admin_password_env, readme_trust_proxy, readme_nginx_reverse_proxy [EXTRACTED 1.00]
- **Install and auto-update flow** — install, install_update_timer, update, readme_daily_update_gate [INFERRED 0.85]
- **Profile bundles location, solar provider and news channels** — public_index_solar_provider_fields, public_index_news_picker, public_index_settings_dialog, readme_config_json [INFERRED 0.85]
- **Solar power flow display** — public_index_solar_panel, design_solar_flow_diagram, design_meaningful_flow_rule, product_purpose_power, product_growatt_openapi [INFERRED 0.85]
- **Honest state across product and design** — product_principle_honest_state, design_honest_state_labelling, public_index_live_dot, design_glow_means_live_rule [INFERRED 0.75]
- **Low-cost always-on hardware constraint** — product_principle_light_on_hardware, design_cheap_motion_rule, design_solar_flow_diagram, product_docker_deployment [INFERRED 0.75]

## Communities (13 total, 2 thin omitted)

### Community 0 - "Product, Layout & Deployment"
Cohesion: 0.07
Nodes (10): Auth dialog, Morning Desk dashboard page, News channel picker, News stack, profile-select switcher, Settings dialog, Sky News live panel, Solar power-flow diagram (+2 more)

### Community 1 - "Front-end App"
Cohesion: 0.10
Nodes (41): api(), authDialog, batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy() (+33 more)

### Community 2 - "Provider Common Helpers"
Cohesion: 0.08
Nodes (28): applyFields(), DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), publicSchema(), secretFields() (+20 more)

### Community 3 - "Profile Store"
Cohesion: 0.10
Nodes (19): applyProfileInput(), applySolarInput(), blankProfile(), cleanProfile(), cleanSolar(), configPath, DEFAULT_LOCATION, DEFAULT_NEWS (+11 more)

### Community 5 - "Docker Compose"
Cohesion: 0.10
Nodes (18): interval, retries, start_period, test, timeout, build, container_name, environment (+10 more)

### Community 6 - "Auth & Sessions"
Cohesion: 0.12
Nodes (9): COOKIE_NAME, failures, hashPassword(), readCookie(), scrypt, SESSION_TTL, sessionFromReq(), sessions (+1 more)

### Community 7 - "CI Test Workflow"
Cohesion: 0.13
Nodes (14): jobs, test, name, permissions, contents, run, uses, with (+6 more)

### Community 8 - "Config & Providers"
Cohesion: 0.16
Nodes (8): config.example.json, all, byId, DEFAULT_PROVIDER, config.json, Growatt solar provider, Morning Desk, Profile

### Community 9 - "Package Manifest"
Cohesion: 0.20
Nodes (10): dependencies, express@^5.1.0, name, private, scripts, start, test, type (+2 more)

### Community 10 - "Proxmox Installer"
Cohesion: 0.39
Nodes (7): ensure_template(), log(), next_ctid(), prompt_ip(), select_storage(), install-proxmox.sh script, Minimum container requirements

### Community 11 - "Install & Update Scripts"
Cohesion: 0.32
Nodes (4): install.sh script, install-update-timer.sh script, log(), update.sh script

## Ambiguous Edges - Review These
- `Victron provider (on a branch)` → `Settings: Solar section (provider, fields, battery kWh)`  [AMBIGUOUS]
  public/index.html · relation: references

## Knowledge Gaps
- **4 isolated node(s):** `config.example.json`, `Solar provider settings fields`, `nginx reverse proxy`, `Minimum container requirements`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Solar provider plugin` connect `Config & Providers` to `Provider Common Helpers`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Settings dialog` (e.g. with `app.js script` and `Auth dialog`) actually correct?**
  _`Settings dialog` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config.example.json`, `Solar provider settings fields`, `nginx reverse proxy` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product, Layout & Deployment` be split into smaller, more focused modules?**
  _Cohesion score 0.06648936170212766 - nodes in this community are weakly interconnected._
- **Why does `config.json` connect `Config & Providers` to `Product, Layout & Deployment`, `Docker Compose`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **Should `Front-end App` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Victron provider (on a branch)` and `Settings: Solar section (provider, fields, battery kWh)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._