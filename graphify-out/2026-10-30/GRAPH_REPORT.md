# Graph Report - morning-desk  (2026-10-27)

## Corpus Check
- 24 files · ~20,308 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 293 nodes · 427 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5a88d31`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dashboard Client (app.js)
- Store, Tests & Field Rules
- Settings & Sign-in UI
- Solar Provider Contract
- Server Routes & Access
- Design System Rules
- Sessions & Password Auth
- store.test.mjs
- Docker Compose
- CI Test Workflow
- Package Manifest
- Proxmox Installer
- Provider Registry
- Install Scripts
- Nightly Update Script
- Container Entrypoint
- Product

## God Nodes (most connected - your core abstractions)
1. `loadAll()` - 12 edges
2. `Morning Desk Design System` - 12 edges
3. `morning-desk` - 9 edges
4. `Dashboard page (index.html)` - 9 edges
5. `esc()` - 8 edges
6. `Product` - 8 edges
7. `fetchReadings()` - 7 edges
8. `loadSolar()` - 7 edges
9. `populateSettings()` - 7 edges
10. `saveSettings()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Profile switcher (#profile-select)` --implements--> `Profiles`  [INFERRED]
  public/index.html → README.md
- `Dashboard page (index.html)` --implements--> `Dashboard two-column grid layout`  [INFERRED]
  public/index.html → DESIGN.md
- `Solar diagram markup (#solar-diagram)` --implements--> `Solar Flow Diagram (signature component)`  [INFERRED]
  public/index.html → DESIGN.md
- `Settings dialog (#settings-dialog)` --implements--> `Solar provider plugin system (providers/)`  [INFERRED]
  public/index.html → README.md
- `Poodle House users field (ssoUsers)` --implements--> `Sign in with Poodle House (OIDC SSO)`  [INFERRED]
  public/index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sign-in flow (local accounts and Poodle House SSO)** — public_login, readme_house_admin, readme_sso_poodle_house, readme_remember_me, readme_scrypt_password_hashing, design_sign_in_card [INFERRED 0.85]
- **Solar flow diagram design and implementation** — design_solar_flow_diagram, design_solar_diagram_palette, design_meaningful_flow_rule, design_glow_means_live_rule, public_index_solar_diagram [INFERRED 0.85]

## Communities (17 total, 4 thin omitted)

### Community 0 - "Dashboard Client (app.js)"
Cohesion: 0.10
Nodes (40): api(), batteryRuntime(), blankProfile(), clockTime(), codeMap, dialog, energy(), esc() (+32 more)

### Community 1 - "Store, Tests & Field Rules"
Cohesion: 0.11
Nodes (22): applyFields(), ADMIN_USERNAME, applyProfileInput(), applySolarInput(), blankProfile(), cleanLogin(), cleanProfile(), cleanSession() (+14 more)

### Community 2 - "Settings & Sign-in UI"
Cohesion: 0.09
Nodes (27): Inline SVG line icons (Lucide, icon() helper), Password change / sign out section, Profile switcher (#profile-select), Settings dialog (#settings-dialog), Poodle House users field (ssoUsers), Confirm password row (first-run setup), form, Show-password toggle (#login-eye) (+19 more)

### Community 3 - "Solar Provider Contract"
Cohesion: 0.11
Nodes (26): DEFAULT_MAX, describeSettings(), FETCH_TIMEOUT_MS, FLOW_KEYS, keepPreviousFlow(), publicSchema(), secretFields(), USER_AGENT (+18 more)

### Community 4 - "Server Routes & Access"
Cohesion: 0.11
Nodes (23): app, applyLogin(), canEdit(), decode(), decodeEntities(), __dirname, httpError(), isAdmin() (+15 more)

### Community 5 - "Design System Rules"
Cohesion: 0.09
Nodes (18): button-primary-pill component, Dashboard two-column grid layout, DM Mono font, Ember Coral (#ff846c), Manrope font, Mealie, Morning Desk Design System, Morning Lime (#c7ff47) (+10 more)

### Community 6 - "Sessions & Password Auth"
Cohesion: 0.10
Nodes (14): COOKIE_NAME, createSession(), destroySession(), DUMMY_RECORD, failures, hashPassword(), hashToken(), readCookie() (+6 more)

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

### Community 16 - "Product"
Cohesion: 0.22
Nodes (8): Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Product, Product Principles, Product Purpose, Users

## Knowledge Gaps
- **12 isolated node(s):** `Password change / sign out section`, `Show-password toggle (#login-eye)`, `Cloudflare proxy/tunnel`, `Poodle House`, `Proxmox install script` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 127 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `Package Manifest` to `Server Routes & Access`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `Password change / sign out section`, `Show-password toggle (#login-eye)`, `Cloudflare proxy/tunnel` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Client (app.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.10452961672473868 - nodes in this community are weakly interconnected._
- **Why does `Morning Desk Design System` connect `Design System Rules` to `Settings & Sign-in UI`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `Store, Tests & Field Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Why does `Dashboard page (index.html)` connect `Design System Rules` to `Settings & Sign-in UI`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Should `Settings & Sign-in UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09113300492610837 - nodes in this community are weakly interconnected._