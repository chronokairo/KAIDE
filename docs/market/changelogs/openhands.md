## v1.24.0 — 2026-09-25

## 1.24.0 (2026-09-25)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: toggle all workspace folders from the Conversations header by @kuldeepsinh19 in https://github.com/OpenHands/OpenHands/pull/17409
* feat: scope OpenAI subscription caches by backend by @uczltw6 in https://github.com/OpenHands/OpenHands/pull/16699
* feat(home): reframe splash copy around day-to-day engineering work by @errmakov in https://github.com/OpenHands/OpenHands/pull/17545
* feat(conversation): open shared automation conversations read-only on cloud by @hieptl in https://github.com/OpenHands/OpenHands/pull/17683
### Bug Fixes
* fix: cap conversation Skills/Hooks/Tools dialogs at 90vw by @gokay-ai in https://github.com/OpenHands/OpenHands/pull/17586
* fix(automation): accept single-start stepped cron fields in the schedule validator by @Harsh23Kashyap in https://github.com/OpenHands/OpenHands/pull/17274
* fix(canvas): call agent-server runtime directly instead of /api/cloud-proxy (405 on verification confirm & compact-context) by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/17511
* fix: render ACP tool-call content blocks in chat cards by @Chocolatine75 in https://github.com/OpenHands/OpenHands/pull/17407
* fix: recover stale organization selections by @ak684 in https://github.com/OpenHands/OpenHands/pull/17671
* fix: warn when saved LLM profiles reference unavailable models by @ak684 in https://github.com/OpenHands/OpenHands/pull/17675
* fix(agent-canvas): replace dead Tailwind classes with theme tokens on device verify page by @Harsh23Kashyap in https://github.com/OpenHands/OpenHands/pull/17603
* fix(agent-canvas): replace dead Tailwind classes with theme tokens in MCP surfaces by @Harsh23Kashyap in https://github.com/OpenHands/OpenHands/pull/17604
* fix(settings): key the settings cache on the backend that answered by @L4XB in https://github.com/OpenHands/OpenHands/pull/17430
* fix(ci): keep a section whose first line opens a fenced block by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16814
* fix: preserve newer failed messages when history reloads by @ak684 in https://github.com/OpenHands/OpenHands/pull/17647
* fix(mcp): keep OAuth credentials on cloud saves and skip consent when tokens still work by @hieptl in https://github.com/OpenHands/OpenHands/pull/17677
### Documentation
* docs: correct outdated cloud-proxy Rule 2 in AGENTS.md by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/17663
* docs: align README Node.js version with engines.node >=24 by @tsumon in https://github.com/OpenHands/OpenHands/pull/17410
### Maintenance
* chore(deps): bump downshift from 9.3.2 to 9.4.0 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16653
* chore(deps): bump uuid from 14.0.0 to 14.0.1 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16652
* chore(deps-dev): bump the eslint group across 1 directory with 4 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16647
* refactor: split contributor guidance into skills by @neubig in https://github.com/OpenHands/OpenHands/pull/17686
* test(automations,backends): drive switch timing deterministically by @haroontrailblazer in https://github.com/OpenHands/OpenHands/pull/17571
* test: run verified DOM-free suites in a Node project by @errmakov in https://github.com/OpenHands/OpenHands/pull/17556
* chore: remove merged PR artifacts by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17695
* refactor: remove test-conversation-id fallbacks in websocket context + add state-update tests by @Lothnic in https://github.com/OpenHands/OpenHands/pull/16516
* chore: consume SDK 1.49.6 and Automation 1.15.1 by @hieptl in https://github.com/OpenHands/OpenHands/pull/17702
* chore(deps): bump @openhands/extensions to 0.24.0 by @DevinVinson in https://github.com/OpenHands/OpenHands/pull/17681

## New Contributors
* @gokay-ai made their first contribution in https://github.com/OpenHands/OpenHands/pull/17586
* @tsumon made their first contribution in https://github.com/OpenHands/OpenHands/pull/17410
* @haroontrailblazer made their first contribution in https://github.com/OpenHands/OpenHands/pull/17571
* @L4XB made their first contribution in https://github.com/OpenHands/OpenHands/pull/17430
* @errmakov made their first contribution in https://github.com/OpenHands/OpenHands/pull/17556
* @kuldeepsinh19 made their first contribution in https://github.com/OpenHands/OpenHands/pull/17409
* @uczltw6 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16699

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.23.0...v1.24.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.23.0 — 2026-09-23

## 1.23.0 (2026-09-23)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(desktop): universal macOS DMG with per-arch bundled runtimes by @harsh-batheja in https://github.com/OpenHands/OpenHands/pull/17225
* feat: Support Light+ and Solarized Light theme by @davideuler in https://github.com/OpenHands/OpenHands/pull/16632
* feat: tag Agent Canvas telemetry by deployment kind (OSS-13530) by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17529
### Bug Fixes
* fix: refresh Canvas image packages by @neubig in https://github.com/OpenHands/OpenHands/pull/17633
* fix(chat): restore 11px mode label on the change-agent button by @Harsh23Kashyap in https://github.com/OpenHands/OpenHands/pull/17616
* fix(test): drain MSW's in-flight requests instead of 30 event-loop turns by @alanhuangyoo in https://github.com/OpenHands/OpenHands/pull/16890
* fix(chat): avoid re-rendering unchanged historical Markdown by @Jokasa7 in https://github.com/OpenHands/OpenHands/pull/17015
* fix: load logs for script automation runs and show their script by @hieptl in https://github.com/OpenHands/OpenHands/pull/17519
* fix(chat): clear a "Failed to send" bubble once its message is echoed back by @hieptl in https://github.com/OpenHands/OpenHands/pull/17639
* fix: show conversation tag keys in sidebar chips by @mvanhorn in https://github.com/OpenHands/OpenHands/pull/16853
* fix(ci): let triage and repository writers own readiness by @neubig in https://github.com/OpenHands/OpenHands/pull/17598
### Maintenance
* chore: remove merged PR artifacts by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17591
* chore: consume SDK 1.49.5 and Automation 1.15.0 by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/17650

## New Contributors
* @harsh-batheja made their first contribution in https://github.com/OpenHands/OpenHands/pull/17225
* @davideuler made their first contribution in https://github.com/OpenHands/OpenHands/pull/16632
* @Jokasa7 made their first contribution in https://github.com/OpenHands/OpenHands/pull/17015

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.22.0...v1.23.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.22.0 — 2026-09-22

## 1.22.0 (2026-09-22)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: test remote MCP servers on cloud backends via the app server by @hieptl in https://github.com/OpenHands/OpenHands/pull/17276
* feat: open Git Sync to org admins on cloud backends by @hieptl in https://github.com/OpenHands/OpenHands/pull/17216
* feat(i18n): translate recently added Turkish UI strings by @alkank in https://github.com/OpenHands/OpenHands/pull/17581
### Bug Fixes
* fix: show the add automation menu to org members by @hieptl in https://github.com/OpenHands/OpenHands/pull/17526
* fix(canvas): keep the base path on links that leave the app by @tofarr in https://github.com/OpenHands/OpenHands/pull/17617
* fix: preserve sibling MCP servers when saving to a cloud backend by @hieptl in https://github.com/OpenHands/OpenHands/pull/17467
* fix: link home automation rows to the automation view by @hieptl in https://github.com/OpenHands/OpenHands/pull/17466
* fix(canvas): hide cloud orgs the server marks is_visible=false by @tofarr in https://github.com/OpenHands/OpenHands/pull/17624
### Documentation
* docs(review): add repository and product scope to the Canvas review guide by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17606
### Maintenance
* chore(deps-dev): bump the testing group across 1 directory with 7 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/17589
* chore: consume SDK 1.49.4 and Automation 1.14.0 by @hieptl in https://github.com/OpenHands/OpenHands/pull/17628

## New Contributors
* @alkank made their first contribution in https://github.com/OpenHands/OpenHands/pull/17581

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.21.0...v1.22.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.21.0 — 2026-09-22

## 1.21.0 (2026-09-22)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: request Docker execution workspaces from Docker servers by @neubig in https://github.com/OpenHands/OpenHands/pull/17177
### Bug Fixes
* fix: prevent stale conversation history merges by @adbcodes in https://github.com/OpenHands/OpenHands/pull/16913
* fix: query the Forgejo host for Forgejo PR and issue lists by @Harsh23Kashyap in https://github.com/OpenHands/OpenHands/pull/17486
* fix(apps): accept GitHub tree URLs as app source by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/17504
* fix: Disable PostHog autocapture  by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17502
* fix(static-server): serve current assets after rebuilding Canvas by @neubig in https://github.com/OpenHands/OpenHands/pull/17402
* fix: show non-resumable local conversations as archived by @neubig in https://github.com/OpenHands/OpenHands/pull/17500
* fix: advertise host services to Docker conversations by @neubig in https://github.com/OpenHands/OpenHands/pull/17518
### Documentation
* docs: refresh AGENTS.md guidance by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17590
* docs(codereview): clarify Agent Canvas checkpoints by @neubig in https://github.com/OpenHands/OpenHands/pull/17523
### Maintenance
* chore: consume SDK 1.49.2 and Automation 1.13.2 by @neubig in https://github.com/OpenHands/OpenHands/pull/17515
* test: cover draft persistence by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17334
* test: strengthen LLM profile configuration by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17338
* test: strengthen shared utility behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17341
* test: cover MCP config utilities by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17344
* chore: remove merged PR artifacts by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17507
* refactor(shadcn-lint): agentic linting - first pass, map --oh-* tokens into the Tailwind theme by @smolpaws in https://github.com/OpenHands/OpenHands/pull/17435
* chore: consume SDK 1.49.3 and Automation 1.13.3 by @neubig in https://github.com/OpenHands/OpenHands/pull/17600

## New Contributors
* @Harsh23Kashyap made their first contribution in https://github.com/OpenHands/OpenHands/pull/17486

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.20.0...v1.21.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.20.0 — 2026-09-17

## 1.20.0 (2026-09-17)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(agent-profiles): select secrets available to a profile by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/17237
* feat: forward Docker conversation runtime settings by @neubig in https://github.com/OpenHands/OpenHands/pull/17462
* feat(automations): select saved agent profiles by @neubig in https://github.com/OpenHands/OpenHands/pull/17396
### Maintenance
* test: isolate Mock-LLM profiles from ambient secrets by @neubig in https://github.com/OpenHands/OpenHands/pull/17482
* chore: bump released agent runtime dependencies by @neubig in https://github.com/OpenHands/OpenHands/pull/17489


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.19.0...v1.20.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.19.0 — 2026-09-16

## 1.19.0 (2026-09-16)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: scope an agent profile to specific MCP servers by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/17289
* feat: add GPT-6 Astra model support by @neubig in https://github.com/OpenHands/OpenHands/pull/17164
* feat: track authenticated Canvas arrivals by @neubig in https://github.com/OpenHands/OpenHands/pull/17083
* feat: surface automation disablement reason in the UI by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17425
### Bug Fixes
* fix: recognize Azure DevOps SSH remotes by @Chocolatine75 in https://github.com/OpenHands/OpenHands/pull/17375
* fix(static-server): HTML-escape injected runtime config and set Cache-Control: no-store on credential injection by @Tyagiquamar in https://github.com/OpenHands/OpenHands/pull/17175
* fix: avoid redundant automation SDK version refetches by @workvahedi in https://github.com/OpenHands/OpenHands/pull/16991
* fix(acp): tie the client ACP registry pin to agent-server, drop the codex shim by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/17423
* fix(ci): apply inferred issue type labels by @enyst in https://github.com/OpenHands/OpenHands/pull/17218
* fix(automations): admit plugin sources in catalog bundles by @neubig in https://github.com/OpenHands/OpenHands/pull/17403
### Maintenance
* test: cover small state stores by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17326
* test: cover chat input events by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17292
* test: strengthen workspace path resolution by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17356
* test: strengthen change-agent control by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17365
* test: strengthen git tools submenu behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17324
* test: cover chat attachment hooks by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17291
* test: cover user-facing errors by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17327
* test: cover websocket event handler by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17312
* test: cover git service by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17330
* test: cover hook execution events by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17311
* test: cover conversation confirmation controls by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17310
* test: cover mono component behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17295
* test: cover chat input utilities by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17332
* test: cover observation content formatting by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17335
* test: cover observation results by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17329
* test: strengthen optimistic message store by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17328
* test: cover fixed popover placement by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17315
* test: cover conversation store by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17333
* test: cover MCP marketplace utilities by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17331
* test: cover mock git browsing handlers by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17313
* test: strengthen root layout behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17349
* test: cover chat submission behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17300
* test: cover settings value pickers by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17302
* test: cover pause conversation behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17316
* test: cover infinite scroll behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17314
* test: cover unified git change ordering by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17307
* test: cover pause conversation mutation by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17303
* test: cover transcript export modal by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17299
* test: cover plugin display helpers by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17301
* test: cover MCP server deletion behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17321
* test: strengthen action event content by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17355
* test: cover attachment size validation by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17296
* test: cover repository data selection by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17298
* test: preserve unrelated conversation caches by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17337
* test: cover branch data selection by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17297
* test: strengthen task tracking presentation by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17325
* test: cover home store behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17306
* test: strengthen query client error handling by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17308
* test: cover event logger behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17305
* test: strengthen chat auto-resize behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17368
* test: strengthen command menu integration by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17348
* test: cover conversation query hooks by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17304
* test: kill event search filter mutants by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17336
* test: strengthen device-flow authentication UI by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17320
* test: strengthen skill-ready content formatting by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17353
* test: strengthen LLM subscription normalization by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17357
* test: strengthen home project setup and launch by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17364
* test: cover secret form behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17318
* test: cover conversation context menu by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17319
* test: cover bash command runner by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17317
* test: cover config service by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17343
* chore: remove merged PR artifacts by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17414
* test: cover core utilities and state stores by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17290
* test: cover service routing and repository queries by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17309
* test: strengthen automation detail reporting by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17339
* test: strengthen conversation observability by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17340
* test: cover conversation and workspace mock contracts by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17369
* test: strengthen MCP service OAuth behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17347
* chore: bump SDK to 1.48.0 and automation to 1.12.1 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/17479
* test: cover telemetry consent banner by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17322
* test: cover conversation name status controls by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17323
* test: cover cloud git service by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17342
* test: strengthen MCP credential matching by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17345
* test: strengthen cloud settings behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17346
* test: strengthen unified VS Code URL behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17350
* test: strengthen conversation websocket runtime by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17351
* test: strengthen agent server connection behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17354
* test: strengthen drag resize cleanup by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17358
* test: strengthen chat composer behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17359
* test: strengthen conversation service behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17360
* test: strengthen SDK settings schema behavior by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17361
* test: strengthen chat event content by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17362
* test: strengthen conversation browsing by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17363
* test: strengthen event content dispatch by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17366
* test: strengthen mock settings and auth contracts by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17367
* test: cover automations list workflows by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/17370

## New Contributors
* @Chocolatine75 made their first contribution in https://github.com/OpenHands/OpenHands/pull/17375
* @Tyagiquamar made their first contribution in https://github.com/OpenHands/OpenHands/pull/17175
* @workvahedi made their first contribution in https://github.com/OpenHands/OpenHands/pull/16991

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.18.0...v1.19.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.18.0 — 2026-09-11

## 1.18.0 (2026-09-11)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: click an image attachment to open it full size by @palrohitg in https://github.com/OpenHands/OpenHands/pull/17179
* feat: only the creator can turn an automation back on by @hieptl in https://github.com/OpenHands/OpenHands/pull/17190
* feat: allow editing automations on cloud backends by @hieptl in https://github.com/OpenHands/OpenHands/pull/17191
* feat: show which identity an automation runs as by @hieptl in https://github.com/OpenHands/OpenHands/pull/17138
* feat: use DB-driven free/default model flags in Canvas by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16685
### Bug Fixes
* fix: pass the active org from the gear icon to cloud settings by @hieptl in https://github.com/OpenHands/OpenHands/pull/17256
* fix: hide unlisted settings pages from the command menu when locked to a Cloud host by @hieptl in https://github.com/OpenHands/OpenHands/pull/17254
* fix: open Cloud settings in the same tab when locked to a Cloud host by @hieptl in https://github.com/OpenHands/OpenHands/pull/17253
* fix: OHE-3110 : remove misleading "No budget limit" line from Token Usage panel by @tofarr in https://github.com/OpenHands/OpenHands/pull/17264
* fix: force an explicit decision on every ACP harness the registry adds by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/17228
### Documentation
* docs: add PR design document skill by @enyst in https://github.com/OpenHands/OpenHands/pull/17221
### Maintenance
* ci: add .pr/ cleanup-after-merge and fork-aware notice by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/17245

## New Contributors
* @palrohitg made their first contribution in https://github.com/OpenHands/OpenHands/pull/17179

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.17.0...v1.18.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.17.0 — 2026-09-09

## 1.17.0 (2026-09-09)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: show manifest-declared value statements on dashboard cards and rows by @hieptl in https://github.com/OpenHands/OpenHands/pull/16921
* feat: Make automation run UI task-outcome aware by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16937
* feat: enable LLM provider connections on cloud by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16757
* feat: allow editing a custom cron expression from the edit-automation modal by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16964
* feat: unified cloud settings entrypoint for Agent Canvas by @jpelletier1 in https://github.com/OpenHands/OpenHands/pull/16883
* feat: add local Agent Canvas Planner support by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16178
* feat(conversation-panel): add conversation tags and filtering by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16600
* feat: split automation permissions into view/manage with creator escape hatch by @tofarr in https://github.com/OpenHands/OpenHands/pull/17105
* feat: display message timestamps on hover by @LosAveRoad in https://github.com/OpenHands/OpenHands/pull/17123
* feat: support generic custom automation manifests in Canvas by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17129
### Bug Fixes
* fix(chat): re-derive active profile stamp from event history on reload by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16439
* fix: Add --disable-telemetry runtime flag for self-hosted canvas by @lilagrc in https://github.com/OpenHands/OpenHands/pull/16908
* fix(ci): accept h2 readiness sections by @neubig in https://github.com/OpenHands/OpenHands/pull/17011
* fix(automations): flip the kebab menu above the trigger when it would clip by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16926
* fix(settings): disable save when edits are reverted by @ShashwatXD in https://github.com/OpenHands/OpenHands/pull/16120
* fix(desktop): parse window-open URLs instead of prefix-matching localhost by @simpleqt in https://github.com/OpenHands/OpenHands/pull/16961
* fix: scope plugin queries to the active backend by @alanhuangyoo in https://github.com/OpenHands/OpenHands/pull/16891
* fix: scope the settings nav to Application when locked to Cloud by @hieptl in https://github.com/OpenHands/OpenHands/pull/17045
* fix: hide Cloud reconnect controls in cookie-auth (OHE-hosted) Canvas by @hieptl in https://github.com/OpenHands/OpenHands/pull/17044
* fix(api): auto-load workspace hooks on conversation start by @aashikantkumar in https://github.com/OpenHands/OpenHands/pull/16971
* fix(utils): correctly count diff stats for hunk lines starting with -- or ++ (#16979) by @Prakhar00001 in https://github.com/OpenHands/OpenHands/pull/17071
* fix(deps): patch DOMPurify sanitization bypass by @lzhan011 in https://github.com/OpenHands/OpenHands/pull/17060
* fix: pass the active org when opening cloud settings links by @hieptl in https://github.com/OpenHands/OpenHands/pull/17066
* fix: list a cloud conversation own skills in show available skills by @hieptl in https://github.com/OpenHands/OpenHands/pull/17067
* fix(i18n): use i18next placeholders in budget usage format by @PranshulSoni in https://github.com/OpenHands/OpenHands/pull/16903
* fix(utils): percent-encode branch names in provider branch URLs by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/17107
* fix(test): keep ProgressEvent resolvable after jsdom teardown by @lzhan011 in https://github.com/OpenHands/OpenHands/pull/17116
* fix: preserve base_url for subscription LLM configs by @neubig in https://github.com/OpenHands/OpenHands/pull/16089
* fix: join local Canvas Extension source and path for install by @lorenzozanee in https://github.com/OpenHands/OpenHands/pull/17072
* fix(canvas-extensions): show the install failure reason by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/17120
* fix: keep confirmation prompt visible outside grouped events by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/17134
### Documentation
* docs: strengthen code review evidence policy by @neubig in https://github.com/OpenHands/OpenHands/pull/17089
* docs: remove duplicate OpenHands/extensions bullet in DEVELOPMENT.md by @imitater-dou in https://github.com/OpenHands/OpenHands/pull/17136
* docs: correct OH_*_GIT_REF defaults and merge duplicated bullet in DEVELOPMENT.md by @simpleqt in https://github.com/OpenHands/OpenHands/pull/17167
### Maintenance
* chore: Bump agent server and automation defaults by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16970
* chore: Bump automation default to 1.10.0 by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17086
* refactor: rename Canvas Extensions to Apps by @DevinVinson in https://github.com/OpenHands/OpenHands/pull/17064
* chore: bump automation default to 1.11.0 and agent-server to 1.45.0 by @hieptl in https://github.com/OpenHands/OpenHands/pull/17203
* refactor: infer issue readiness type from body instead of label by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16955
* ci: run e2e suites after merge to main by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16944
* chore: use OpenHands project name consistently by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16939
* chore: require Node 24 for agent canvas by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/17009
* refactor: use React Query for automation SDK version by @enyst in https://github.com/OpenHands/OpenHands/pull/16982
* chore: bump SDK to 1.46.0 and automation to 1.11.1 by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/17238

## New Contributors
* @simpleqt made their first contribution in https://github.com/OpenHands/OpenHands/pull/16961
* @alanhuangyoo made their first contribution in https://github.com/OpenHands/OpenHands/pull/16891
* @aashikantkumar made their first contribution in https://github.com/OpenHands/OpenHands/pull/16971
* @Prakhar00001 made their first contribution in https://github.com/OpenHands/OpenHands/pull/17071
* @lzhan011 made their first contribution in https://github.com/OpenHands/OpenHands/pull/17060
* @PranshulSoni made their first contribution in https://github.com/OpenHands/OpenHands/pull/16903
* @LosAveRoad made their first contribution in https://github.com/OpenHands/OpenHands/pull/17123
* @imitater-dou made their first contribution in https://github.com/OpenHands/OpenHands/pull/17136
* @lorenzozanee made their first contribution in https://github.com/OpenHands/OpenHands/pull/17072

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.16.0...v1.17.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.16.0 — 2026-08-27

## 1.16.0 (2026-08-27)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(settings): select supported LLM providers by @keeltrace in https://github.com/OpenHands/OpenHands/pull/16772
* feat: add linux desktop installer build (CI + deb maintainer fix) by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16656
* feat(automations): show a run's live phase by @aartem1 in https://github.com/OpenHands/OpenHands/pull/16740
* feat(settings): expose the LLM-switching toggle in Agent settings by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16441
* feat(skills): replace the all-on skill catalog with an explicit allow-list by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16860
* feat: link chat file paths to the Files drawer by @ShashwatXD in https://github.com/OpenHands/OpenHands/pull/16181
* feat: pin a favorite sidebar page as the home route by @hieptl in https://github.com/OpenHands/OpenHands/pull/16868
* feat: skip onboarding when a user-added Local backend has a usable LLM by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16931
* feat: fix default and free models by @neubig in https://github.com/OpenHands/OpenHands/pull/16922
* feat: land the Canvas Extensions frontend (load pages, sidebar, customize) by @hieptl in https://github.com/OpenHands/OpenHands/pull/16895
### Bug Fixes
* fix: render the VSCode button on self-hosted (local) backends by @harish-chandramowli in https://github.com/OpenHands/OpenHands/pull/16106
* fix: correlate local conversation telemetry with Canvas identity by @neubig in https://github.com/OpenHands/OpenHands/pull/16796
* fix(ci): ignore fenced headings in readiness checks by @ump45nose in https://github.com/OpenHands/OpenHands/pull/16595
* fix: forward disabled_skills into agent_context so backend excludes them by @jdlake in https://github.com/OpenHands/OpenHands/pull/16812
* fix(ci): prevent issue readiness workflow from failing on not-ready issues by @KHARSHAVARDHAN-eng in https://github.com/OpenHands/OpenHands/pull/16514
* fix(ci): use reproduction steps for ready-for-dev checks by @neubig in https://github.com/OpenHands/OpenHands/pull/16828
* fix(acp): surface a 'credentials configured' banner state on Docker/cloud (#15643) by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16145
* fix(ci): edit the mock-LLM E2E PR comment in place by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16591
* fix(providers): follow next_page_id so cloud picks surface past the default page size by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16758
* fix(ci): refresh readiness comment when label is added by @neubig in https://github.com/OpenHands/OpenHands/pull/16830
* fix(desktop): ship the bundled Node's npm on Windows by @Telov in https://github.com/OpenHands/OpenHands/pull/16381
* fix(agent-canvas): scope baked working_dir to the default-local backend by @enyst in https://github.com/OpenHands/OpenHands/pull/16759
* fix: clean up dev:extra-backend agent-server on SIGHUP by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16280
* fix: clean up dev:minimal services on SIGHUP by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16279
* fix: hide API key for OpenHands provider on cloud by @tofarr in https://github.com/OpenHands/OpenHands/pull/16863
* fix(home): remember local workspace mode selection by @tofarr in https://github.com/OpenHands/OpenHands/pull/16881
* fix: bound automation run-history fan-out and pause sidebar polling by @hieptl in https://github.com/OpenHands/OpenHands/pull/16867
* fix: validate api key before advancing backend connection step by @JatinJain703 in https://github.com/OpenHands/OpenHands/pull/16840
* fix: rename conversation title on cloud backends by @jpelletier1 in https://github.com/OpenHands/OpenHands/pull/16966
### Documentation
* docs: fix broken reference to new-conversation-button.tsx in AGENTS.md (#16783) by @kris3984 in https://github.com/OpenHands/OpenHands/pull/16807
* docs: require acceptance criteria review checklist by @neubig in https://github.com/OpenHands/OpenHands/pull/16832
* docs: document OpenHands repository boundaries by @neubig in https://github.com/OpenHands/OpenHands/pull/16834
* docs: refresh AGENTS.md guidance by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16310
* docs: refresh AGENTS.md guidance by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16923
* docs: clarify PR template agent section by @enyst in https://github.com/OpenHands/OpenHands/pull/16942
* docs: refresh Canvas code review guidelines by @enyst in https://github.com/OpenHands/OpenHands/pull/16941
### Maintenance
* ci(deps): bump actions/setup-python from 6 to 7 in the actions group by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16645
* chore: remove unused random tip code by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16935
* chore: bump SDK deps (software-agent-sdk 1.44.0, automation 1.9.0, extensions 0.19.0) by @hieptl in https://github.com/OpenHands/OpenHands/pull/16968

## New Contributors
* @harish-chandramowli made their first contribution in https://github.com/OpenHands/OpenHands/pull/16106
* @keeltrace made their first contribution in https://github.com/OpenHands/OpenHands/pull/16772
* @kris3984 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16807
* @ump45nose made their first contribution in https://github.com/OpenHands/OpenHands/pull/16595
* @jdlake made their first contribution in https://github.com/OpenHands/OpenHands/pull/16812
* @KHARSHAVARDHAN-eng made their first contribution in https://github.com/OpenHands/OpenHands/pull/16514
* @Telov made their first contribution in https://github.com/OpenHands/OpenHands/pull/16381
* @aartem1 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16740
* @JatinJain703 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16840

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.15.0...v1.16.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.15.0 — 2026-08-21

## 1.15.0 (2026-08-21)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(sidebar): add getting started checklist with settings toggle by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16182
* feat: show workspace path in Files view by @HurrairaBaloch in https://github.com/OpenHands/OpenHands/pull/16362
* feat(automations): install a catalog entry that ships a script bundle by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16680
* feat: add LLM provider-connections UI (local agent-server) by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16616
* feat: polish automations dashboard, recommended rail, and Add/Import flow by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16688
* feat(conversation): add overview panel and unified commits drawer by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16230
* feat: send template provenance for versioned setup entries by @hieptl in https://github.com/OpenHands/OpenHands/pull/16458
* feat: instrument onboarding checklist link clicks by @hieptl in https://github.com/OpenHands/OpenHands/pull/16777
### Bug Fixes
* fix: prevent silent agent profile downgrade by @neubig in https://github.com/OpenHands/OpenHands/pull/16523
* fix: always show all workspace folders in grouped view regardless of pagination by @mohitdebian in https://github.com/OpenHands/OpenHands/pull/16444
* fix: honor the home LLM dropdown selection over an agent profile's pinned LLM by @hieptl in https://github.com/OpenHands/OpenHands/pull/16671
* fix: restore onboarding modal bottom padding and stop leftover scrollbars by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16684
* fix(ci): stop treating markdown as frontend evidence-bearing code by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16693
* fix: clear stale urlSearchResults for non-matching HTTPS URLs in useUrlSearch by @xxiaoxiong in https://github.com/OpenHands/OpenHands/pull/16700
* fix: normalize trailing slash in git remote URLs by @mikemikimike in https://github.com/OpenHands/OpenHands/pull/16536
* fix(scripts): use 127.0.0.1 for remaining localhost service URLs by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16409
* fix(backend-registry): preserve URL fragments in withBackendSelectionParams by @chrislazar25 in https://github.com/OpenHands/OpenHands/pull/16619
* fix: combine stats.usage_to_metrics into AppConversation.metrics when metrics is unset by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16510
* fix: reconcile non-native tool-call streamed <function=...> XML delta by @sideeffffect in https://github.com/OpenHands/OpenHands/pull/16220
* fix(chat): scope Cmd+Enter build shortcut to plan mode by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16703
* fix(skills): keep modal actions visible for long descriptions by @KXHXK in https://github.com/OpenHands/OpenHands/pull/16115
* fix: unsandbox the PDF preview iframe so the built-in viewer renders by @hieptl in https://github.com/OpenHands/OpenHands/pull/16702
* fix: do not silently persist ACP model picks to agent_settings when profile discovery fails by @hieptl in https://github.com/OpenHands/OpenHands/pull/16701
* fix: support mouse drag-to-scroll on recommended rails by @hieptl in https://github.com/OpenHands/OpenHands/pull/16742
* fix(git): stop reading a remote URL's port as part of the repository path by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16723
* fix: keep the events socket alive across refetches and bound hung handshakes by @hieptl in https://github.com/OpenHands/OpenHands/pull/16732
### Performance
* perf: batch StreamingDeltaEvents so the UI keeps up with fast models by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16164
### Documentation
* docs: fix broken internal links by @karan-963 in https://github.com/OpenHands/OpenHands/pull/16627
* docs: add DefenseClaw and testing matrix to the docs index by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16408
* docs(tests): point the router example at a test that exists by @marmar9615-cloud in https://github.com/OpenHands/OpenHands/pull/16711
### Maintenance
* ci: bump agent-canvas chart image tag on release by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/16665
* refactor: finish the microagent→skill rename in the frontend by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16672
* refactor: serve the automation interface from the manifest alone by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16676
* chore: bump openhands-automation to 1.8.0 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16712
* chore: bump @openhands/extensions to 0.17.0 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16717
* chore: bump @openhands/extensions to 0.18.0 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16754
* chore: bump @openhands/typescript-client to 1.38.1 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16780

## New Contributors
* @mohitdebian made their first contribution in https://github.com/OpenHands/OpenHands/pull/16444
* @karan-963 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16627
* @marmar9615-cloud made their first contribution in https://github.com/OpenHands/OpenHands/pull/16408
* @xxiaoxiong made their first contribution in https://github.com/OpenHands/OpenHands/pull/16700
* @mikemikimike made their first contribution in https://github.com/OpenHands/OpenHands/pull/16536
* @HurrairaBaloch made their first contribution in https://github.com/OpenHands/OpenHands/pull/16362
* @chrislazar25 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16619
* @sideeffffect made their first contribution in https://github.com/OpenHands/OpenHands/pull/16220
* @KXHXK made their first contribution in https://github.com/OpenHands/OpenHands/pull/16115

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.14.0...v1.15.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.14.0 — 2026-08-17

## 1.14.0 (2026-08-17)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(canvas): present structured error outcomes by @neubig in https://github.com/OpenHands/OpenHands/pull/16231
* feat: add LLM pre-flight validation to prevent saving misconfigured profiles by @neubig in https://github.com/OpenHands/OpenHands/pull/16417
* feat(automations): add a Git Sync page by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16521
* feat: set Canvas default model to Kimi K3 and tag it free by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16657
### Bug Fixes
* fix(onboarding): preselect OpenHands LLM provider after picking OpenHands agent by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16531
* fix: preserve backend scope in conversation links by @neubig in https://github.com/OpenHands/OpenHands/pull/16091
* fix(dev): stop baking absolute VITE_BACKEND_BASE_URL in npm run dev by @neubig in https://github.com/OpenHands/OpenHands/pull/16605
* fix(automations): set local responder URL from browser origin by @adbcodes in https://github.com/OpenHands/OpenHands/pull/16332
* fix: show full workspace file tree in Files tab on cloud backends (OHE-3053) by @lilagrc in https://github.com/OpenHands/OpenHands/pull/16344
### Documentation
* docs(agents): add a repository map clarifying what belongs where by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16612
### Maintenance
* ci: remove broken QA Changes workflow by @neubig in https://github.com/OpenHands/OpenHands/pull/16549
* ci: re-run PR description check when new commits are pushed by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16607
* chore: remove unreachable frontend modules and their tests by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16606
* ci: run PR description check on draft PRs by @neubig in https://github.com/OpenHands/OpenHands/pull/16547
* test: capture Docker E2E container logs by @neubig in https://github.com/OpenHands/OpenHands/pull/16660

## New Contributors
* @adbcodes made their first contribution in https://github.com/OpenHands/OpenHands/pull/16332

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.13.0...v1.14.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.13.0 — 2026-08-13

## 1.13.0 (2026-08-13)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(conversations): add client-side conversation archive by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16100
* feat(chat): add inline markdown artifact previews by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16185
* feat: add ready-for-dev issue readiness gate with type-specific criteria by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16449
* feat: context window usage meter, usage drawer, and manual compaction by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16311
### Bug Fixes
* fix: add postinstall message showing how to start agent-canvas by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16338
* fix: configure agent-server telemetry in Canvas launchers by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16348
* fix: make overflow menus usable on touch devices by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16101
* fix: make sidebar "Load more" discover folders, not folder contents by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16179
* fix: disable chat input drag-resize when not bottom-anchored (OHE-3062) by @tofarr in https://github.com/OpenHands/OpenHands/pull/16479
* fix(automations): surface non-MCP-installable integrations instead of silently dropping them by @lokesh75-kank in https://github.com/OpenHands/OpenHands/pull/16324
* fix: resolve flaky ProgressEvent unhandled rejection in CI by @neubig in https://github.com/OpenHands/OpenHands/pull/16504
* fix: spawn launcher services without implicit shell by @lufen in https://github.com/OpenHands/OpenHands/pull/16093
* fix: stop truncating the Basic LLM provider list at 100 entries by @opensource-joe in https://github.com/OpenHands/OpenHands/pull/16453
* fix(context-meter): draw the ring track from the foreground, not a border token by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16534
* fix: drain pending MSW callbacks before jsdom teardown to stop ProgressEvent ReferenceError by @neubig in https://github.com/OpenHands/OpenHands/pull/16558
### Maintenance
* chore(deps): bump @microlink/react-json-view from 1.31.20 to 1.31.25 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16472
* chore(deps-dev): bump @eslint/eslintrc from 3.3.1 to 3.3.6 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16469
* chore(deps-dev): bump the testing group with 2 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16466
* chore(deps-dev): bump the react group with 2 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16464
* ci(deps): bump docker/login-action from 4.5.2 to 4.6.0 in the actions group by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16461
* chore(deps): bump zustand from 5.0.12 to 5.0.14 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16470
* chore(deps): bump i18next-http-backend from 4.0.0 to 4.0.1 in the i18next group by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16463
* chore(deps-dev): bump lint-staged from 16.4.0 to 17.3.0 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16471
* chore(deps-dev): bump the eslint group across 1 directory with 6 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16467
* refactor: replace positional createConversation params with an options object (#1587) by @Lothnic in https://github.com/OpenHands/OpenHands/pull/16500
* chore: enforce typed @openhands/typescript-client for agent-server API calls (no ad-hoc fetch) by @neubig in https://github.com/OpenHands/OpenHands/pull/16508
* chore: bump SDK deps (software-agent-sdk 1.42.1, automation 1.7.1, typescript-client 1.38.0) by @neubig in https://github.com/OpenHands/OpenHands/pull/16554

## New Contributors
* @Lothnic made their first contribution in https://github.com/OpenHands/OpenHands/pull/16500
* @lokesh75-kank made their first contribution in https://github.com/OpenHands/OpenHands/pull/16324
* @lufen made their first contribution in https://github.com/OpenHands/OpenHands/pull/16093
* @opensource-joe made their first contribution in https://github.com/OpenHands/OpenHands/pull/16453

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.12.0...v1.13.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.12.0 — 2026-08-07

## 1.12.0 (2026-08-07)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: clarify free OpenHands model endpoints by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16281


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.11.0...v1.12.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).


<!-- AGENT_CANVAS_DOCKER_START -->

## v1.11.0 — 2026-08-07

## 1.11.0 (2026-08-07)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: show per-run LLM cost in the Activity Log and exports by @hieptl in https://github.com/OpenHands/OpenHands/pull/16351
* feat: reorder Customize navigation by @DevinVinson in https://github.com/OpenHands/OpenHands/pull/16358
* feat(settings): polish Agent Canvas version update UI by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16343
* feat(home): keep Automations pane visible when empty by @neubig in https://github.com/OpenHands/OpenHands/pull/16372
* feat: add a typed agent action for launching local or Cloud child conversations by @hieptl in https://github.com/OpenHands/OpenHands/pull/16380
* feat: add automation tag filter and recognition by @hieptl in https://github.com/OpenHands/OpenHands/pull/16388
* feat(conversations): add tag chips, overflow, and hovercard labels by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16346
### Bug Fixes
* fix: ship multi-size app icons for Windows and macOS by @hieptl in https://github.com/OpenHands/OpenHands/pull/16352
* fix: rename desktop app to OpenHands Agent Canvas by @hieptl in https://github.com/OpenHands/OpenHands/pull/16353
* fix(metrics): fetch runtime conversation directly instead of removed cloud-proxy by @tofarr in https://github.com/OpenHands/OpenHands/pull/16392

## New Contributors
* @DevinVinson made their first contribution in https://github.com/OpenHands/OpenHands/pull/16358

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.10.0...v1.11.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.10.0 — 2026-08-05

## 1.10.0 (2026-08-05)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: set Canvas default model to GLM 5.2 by @juanmichelini in https://github.com/OpenHands/OpenHands/pull/16146
* feat: activity log export by @ShashwatXD in https://github.com/OpenHands/OpenHands/pull/16234
* feat: ship the featured automations landing dashboard by @hieptl in https://github.com/OpenHands/OpenHands/pull/16266
* feat(skills): filter the skills page with a faceted rail by @sleeyax in https://github.com/OpenHands/OpenHands/pull/16124
* feat: add manifest-driven sub-pages to the automation interface by @hieptl in https://github.com/OpenHands/OpenHands/pull/16303
### Bug Fixes
* fix: derive automation timeout cap from deployment by @neubig in https://github.com/OpenHands/OpenHands/pull/16233
* fix(backends): pin backend identity on sidebar conversation links by @rishavnaskar in https://github.com/OpenHands/OpenHands/pull/16243
* fix: use IPv4 loopback for local proxy targets by @wangmeiwen in https://github.com/OpenHands/OpenHands/pull/16290
* fix: resolve npm audit vulnerabilities by @hieptl in https://github.com/OpenHands/OpenHands/pull/16264
* fix: preserve MCP credentials during Canvas mutations by @neubig in https://github.com/OpenHands/OpenHands/pull/16144
### Maintenance
* chore: ignore all of /.tmp/, not three of its subdirectories by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16272
* chore(deps-dev): bump eslint-import-resolver-typescript from 4.4.4 to 4.4.5 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16256
* chore(deps): bump the react group across 1 directory with 3 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16250
* chore(deps): bump the tanstack group with 2 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16248
* chore(deps): bump the tailwind group across 1 directory with 4 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16247
* chore(deps-dev): bump @types/node from 25.6.0 to 26.1.2 in the types group across 1 directory by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16255
* chore(deps-dev): bump the testing group across 1 directory with 6 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16252
* ci(deps): bump the actions group with 3 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16246
* chore(deps): bump monaco-editor from 0.55.1 to 0.56.0 in the monaco group across 1 directory by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16254
* chore(deps): bump the i18next group across 1 directory with 3 updates by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/16249
* chore: bump @openhands/extensions to 0.16.0 by @hieptl in https://github.com/OpenHands/OpenHands/pull/16321
* ci: require frontend screenshot/video and checked human-tested box by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16325
* chore: bump agent-server 1.40.1 and automation 1.6.0 by @hieptl in https://github.com/OpenHands/OpenHands/pull/16334

## New Contributors
* @ShashwatXD made their first contribution in https://github.com/OpenHands/OpenHands/pull/16234
* @rishavnaskar made their first contribution in https://github.com/OpenHands/OpenHands/pull/16243
* @wangmeiwen made their first contribution in https://github.com/OpenHands/OpenHands/pull/16290
* @sleeyax made their first contribution in https://github.com/OpenHands/OpenHands/pull/16124

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.9.0...v1.10.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.9.0 — 2026-08-03

## 1.9.0 (2026-08-03)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: add a domain-neutral extension-manifest host by @hieptl in https://github.com/OpenHands/OpenHands/pull/16127
* feat(backends): compact Cloud vs Agent-server add-backend chooser by @FraterCCCLXIII in https://github.com/OpenHands/OpenHands/pull/16211
* feat: show live agent activity in chat by @roian6 in https://github.com/OpenHands/OpenHands/pull/16110
* feat: mock the setup contract from the published fixtures by @hieptl in https://github.com/OpenHands/OpenHands/pull/16221
* feat: drive the automation UI from the interface manifest by @hieptl in https://github.com/OpenHands/OpenHands/pull/16222
### Bug Fixes
* fix(settings): use "Default" label for Agent Profile badge by @arush73 in https://github.com/OpenHands/OpenHands/pull/16206
* fix(chat): allow dismissing failed pending user messages by @syf2211 in https://github.com/OpenHands/OpenHands/pull/16142
* fix(automations): render CANCELLED and SKIPPED run statuses by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16198
* fix(home): don't gate the composer on the seeded default profile's LLM ref by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16200
* fix: route runtime services through server_info by @neubig in https://github.com/OpenHands/OpenHands/pull/16090
* fix: clean up dev services on SIGHUP by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16239
* fix: rename frontend conversation start telemetry by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16269
### Documentation
* docs: fix runtime modes table in architecture doc by @hi-neason in https://github.com/OpenHands/OpenHands/pull/16163
* docs: refresh AGENTS.md guidance by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16260
### Maintenance
* refactor(types): use client error events by @neubig in https://github.com/OpenHands/OpenHands/pull/16214
* chore: bump @openhands/extensions to 0.13.0 by @hieptl in https://github.com/OpenHands/OpenHands/pull/16258

## New Contributors
* @arush73 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16206
* @FraterCCCLXIII made their first contribution in https://github.com/OpenHands/OpenHands/pull/16211
* @roian6 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16110
* @syf2211 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16142
* @hi-neason made their first contribution in https://github.com/OpenHands/OpenHands/pull/16163

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.8.0...v1.9.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.8.0 — 2026-07-30

## 1.8.0 (2026-07-30)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: enable/disable an installed MCP server from its card by @hieptl in https://github.com/OpenHands/OpenHands/pull/16171
### Bug Fixes
* fix: exclude disabled skills from agent context by @d3f4w2 in https://github.com/OpenHands/OpenHands/pull/16168
* fix: regenerate favicon PNG/ICO from favicon.svg for consistent design by @neubig in https://github.com/OpenHands/OpenHands/pull/16202
* fix: identify PostHog users with Cloud identity by @neubig in https://github.com/OpenHands/OpenHands/pull/16087
### Maintenance
* chore: bump agent-server 1.39.1, automation 1.5.0, typescript-client 1.36.1 by @hieptl in https://github.com/OpenHands/OpenHands/pull/16197

## New Contributors
* @d3f4w2 made their first contribution in https://github.com/OpenHands/OpenHands/pull/16168

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.7.2...v1.8.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.7.2 — 2026-07-30

## 1.7.2 (2026-07-30)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(e2e): disable browser tools during mock LLM builds by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16188
### Maintenance
* test: add Stryker mutation testing by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16184


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.7.1...v1.7.2

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.7.1 — 2026-07-30

## 1.7.1 (2026-07-30)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(backend-registry): pick a healthy local backend as the fallback by @mvanhorn in https://github.com/OpenHands/OpenHands/pull/16173
* fix: update release repository metadata by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16186
### Documentation
* docs: refresh AGENTS.md guidance by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/16121

## New Contributors
* @mvanhorn made their first contribution in https://github.com/OpenHands/OpenHands/pull/16173

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.7.0...v1.7.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.7.0 — 2026-07-29

## 1.7.0 (2026-07-29)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: always show the LLM selector; move agent-profile switching to the tools menu by @hieptl in https://github.com/OpenHands/OpenHands/pull/16099
* feat: add persistent agent memory toggle by @hieptl in https://github.com/OpenHands/OpenHands/pull/16097
* feat: allow overwriting a secret value from the edit form by @hieptl in https://github.com/OpenHands/OpenHands/pull/16134
### Bug Fixes
* fix: mount telemetry lifecycle from provider by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16092
* fix: Disable analytics toggle for cloud backends by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16098
* fix(security): authenticate WebSockets outside URLs by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/16095
* fix: Track cookie-auth Cloud backend connections by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16113
* fix(e2e): shut the mock-LLM stack down gracefully so it stops leaking processes by @georgeglarson in https://github.com/OpenHands/OpenHands/pull/16152
* fix: enable Agent Canvas pageview telemetry by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16169
* fix(settings): de-duplicate LLM Profile attributes in the "All" tab by @smolpaws in https://github.com/OpenHands/OpenHands/pull/16154
* fix: Revive local telemetry consent banner by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16183
### Maintenance
* chore: remove the human-tested checkbox from the PR template by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/16122
* chore: bump software-agent-sdk to 1.38.0 and automation to 1.4.1 by @hieptl in https://github.com/OpenHands/OpenHands/pull/16129
* ci: disable tag publish triggers for release migration by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16133
* ci: remove stale release-please bootstrap sha by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16138
* ci: restore tag publish triggers by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/16141
### Other Changes
* chore: replay Agent Canvas history by @neubig in https://github.com/OpenHands/OpenHands/pull/15413

## New Contributors
* @georgeglarson made their first contribution in https://github.com/OpenHands/OpenHands/pull/16152

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/v1.6.1...v1.7.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

## v1.6.1 — 2026-07-28

## 1.6.1 (2026-07-24)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(release): recover npm publish after tombstoned 1.6.0 by @malhotra5 in https://github.com/OpenHands/agent-canvas/pull/1940


**Full Changelog**: https://github.com/OpenHands/agent-canvas/compare/v1.6.0...v1.6.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
<!-- AGENT_CANVAS_DOCKER_START -->

---

Migrated from https://github.com/OpenHands/agent-canvas/releases/tag/v1.6.1 to seed Agent Canvas release history in OpenHands/OpenHands.

This release migration was performed by an AI agent (OpenHands) on behalf of the user.


## cloud-1.47.1 — 2026-07-21

## 1.47.1 (2026-07-21)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Maintenance
* revert(agent-profiles): restore default tools in cloud launches by @jlav in https://github.com/OpenHands/OpenHands/pull/15339


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.47.0...cloud-1.47.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.47.0 — 2026-07-21

## 1.47.0 (2026-07-21)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: protect Agent Canvas behind SaaS auth by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/15286
### Bug Fixes
* fix: retry idempotent runtime-api reads once on timeout by @ak684 in https://github.com/OpenHands/OpenHands/pull/15266
* fix(agent-profiles): honor profile settings in cloud launches by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15228
* fix: Fix CVE-2026-53571: Update vite to 8.0.16, 7.3.5, 6.4.3 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14982
* fix: restore automations login redirects by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/15295
* fix(enterprise): PLTF-3259 recognize openhands.dev in staging/feature + managed-domain detection by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/15304
* fix: Avoid logout on transient provider get_user errors by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/15305
* fix: treat Integrations Hub as a cross-app route by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/15324
* fix: add managed LLM key refresh endpoint by @neubig in https://github.com/OpenHands/OpenHands/pull/15023
* fix(app-server): restore previous DB pool_size default by @dylan-openhands in https://github.com/OpenHands/OpenHands/pull/15333
* fix: Debounce last_used_at writes in ApiKeyStore.validate_api_key by @tofarr in https://github.com/OpenHands/OpenHands/pull/15331
* fix(jira): allow conversations without repositories by @tofarr in https://github.com/OpenHands/OpenHands/pull/15328
### Maintenance
* refactor: Expand better-error-logging patterns across the codebase by @tofarr in https://github.com/OpenHands/OpenHands/pull/15241


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.46.2...cloud-1.47.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.46.2 — 2026-07-15

## 1.46.2 (2026-07-15)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(frontend): restore cross-domain PostHog tracking by aligning client/server distinct_id (WIP) by @lilagrc in https://github.com/OpenHands/OpenHands/pull/15100
* fix(app-server): lower DB pool defaults and make them env-tunable by @dylan-openhands in https://github.com/OpenHands/OpenHands/pull/15270
* fix(mcp): preserve MCP auth secrets stripped by settings GET round-trip by @jlav in https://github.com/OpenHands/OpenHands/pull/15285
### Maintenance
* chore: Update README.md by @rbren in https://github.com/OpenHands/OpenHands/pull/15271

## New Contributors
* @dylan-openhands made their first contribution in https://github.com/OpenHands/OpenHands/pull/15270

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.46.1...cloud-1.46.2

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.46.1 — 2026-07-14

## 1.46.1 (2026-07-14)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(app-server): preserve conversation created_at across lifecycle webhooks by @Sujit-1509 in https://github.com/OpenHands/OpenHands/pull/15243
* fix(mcp): preserve SaaS credentials with encrypted storage by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15257
### Maintenance
* ci: wait for the docker build before retagging images by @jlav in https://github.com/OpenHands/OpenHands/pull/15213
* chore: bump SDK packages to v1.35.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15240
* chore: bump SDK packages to v1.36.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15256

## New Contributors
* @Sujit-1509 made their first contribution in https://github.com/OpenHands/OpenHands/pull/15243

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.46.0...cloud-1.46.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.46.0 — 2026-07-10

## 1.46.0 (2026-07-10)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(app-server): enrich final archive manifests and remove initial snapshots by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15058
* feat(enterprise): make BYOR key alias pattern configurable by @tofarr in https://github.com/OpenHands/OpenHands/pull/15232
### Bug Fixes
* fix(frontend): mention SMTP env vars for budget alerts by @saurya in https://github.com/OpenHands/OpenHands/pull/15218
* fix(enterprise): cascade-delete conversation_cost_events on conversation delete by @tofarr in https://github.com/OpenHands/OpenHands/pull/15220
* fix: Enable LIFO database connection pooling by @tofarr in https://github.com/OpenHands/OpenHands/pull/15225
* fix(app-server): preserve observability context metadata by @hxaxd in https://github.com/OpenHands/OpenHands/pull/15215
### Maintenance
* ci: PLTF-2960 sync chart appVersion with cloud image tag by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/15219

## New Contributors
* @hxaxd made their first contribution in https://github.com/OpenHands/OpenHands/pull/15215

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.45.1...cloud-1.46.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.11.0 — 2026-07-09

## 1.11.0 (2026-07-09)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: pass repository metadata to observability traces by @neubig in https://github.com/OpenHands/OpenHands/pull/14431
* feat(enterprise): Agent Profiles on the cloud/SaaS backend (#15044) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15060
* feat(backend): Add Budgets dashboard and expand Usage Dashboard by @saurya in https://github.com/OpenHands/OpenHands/pull/15149
* feat: budgets and usage monitoring UI by @saurya in https://github.com/OpenHands/OpenHands/pull/15186
* feat: surface email enabled for smtp/resend by @saurya in https://github.com/OpenHands/OpenHands/pull/15214
### Bug Fixes
* fix: prevent webhook-driven DB connection leaks by @tofarr in https://github.com/OpenHands/OpenHands/pull/15212
### Maintenance
* chore(main): release cloud 1.43.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15178
* chore: bump SDK packages to v1.34.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15200
* chore(main): release cloud 1.44.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15201
* chore(main): release cloud 1.45.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15210


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.10.0...1.11.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.45.1 — 2026-07-09

## 1.45.1 (2026-07-09)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Maintenance
* chore(main): release 1.11.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15202


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.45.0...cloud-1.45.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.45.0 — 2026-07-09

## 1.45.0 (2026-07-09)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(enterprise): Agent Profiles on the cloud/SaaS backend (#15044) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15060
* feat(backend): Add Budgets dashboard and expand Usage Dashboard by @saurya in https://github.com/OpenHands/OpenHands/pull/15149
* feat: budgets and usage monitoring UI by @saurya in https://github.com/OpenHands/OpenHands/pull/15186
* feat: surface email enabled for smtp/resend by @saurya in https://github.com/OpenHands/OpenHands/pull/15214
### Bug Fixes
* fix: prevent webhook-driven DB connection leaks by @tofarr in https://github.com/OpenHands/OpenHands/pull/15212


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.44.0...cloud-1.45.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.44.0 — 2026-07-09

## 1.44.0 (2026-07-09)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: pass repository metadata to observability traces by @neubig in https://github.com/OpenHands/OpenHands/pull/14431
### Maintenance
* chore: bump SDK packages to v1.34.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15200


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.43.0...cloud-1.44.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.10.0 — 2026-07-08

## 1.10.0 (2026-07-08)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: rename admin dashboard to usage & monitoring by @saurya in https://github.com/OpenHands/OpenHands/pull/15146
* feat: add SMTP email service by @saurya in https://github.com/OpenHands/OpenHands/pull/15144
* feat: track user login timestamps by @saurya in https://github.com/OpenHands/OpenHands/pull/15148
* feat: surface email enabled for smtp/resend by @saurya in https://github.com/OpenHands/OpenHands/pull/15185
### Bug Fixes
* fix: send authenticated marketplace URLs to agent-server by @hieptl in https://github.com/OpenHands/OpenHands/pull/15187


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.9.3...1.10.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.9.3 — 2026-07-08

## 1.9.3 (2026-07-08)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Bug Fixes
* fix(app-server): pass index columns as a list in migration 013 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15176
* fix: default ENABLE_ACP on so ACP agent settings show in OH Cloud by @hieptl in https://github.com/OpenHands/OpenHands/pull/15183
### Maintenance
* chore: bump SDK packages to v1.33.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15177


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.9.2...1.9.3

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.43.0 — 2026-07-08

## 1.43.0 (2026-07-08)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: rename admin dashboard to usage & monitoring by @saurya in https://github.com/OpenHands/OpenHands/pull/15146
* feat: add SMTP email service by @saurya in https://github.com/OpenHands/OpenHands/pull/15144
* feat: track user login timestamps by @saurya in https://github.com/OpenHands/OpenHands/pull/15148
* feat: surface email enabled for smtp/resend by @saurya in https://github.com/OpenHands/OpenHands/pull/15185
### Bug Fixes
* fix(app-server): pass index columns as a list in migration 013 by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15176
* fix: default ENABLE_ACP on so ACP agent settings show in OH Cloud by @hieptl in https://github.com/OpenHands/OpenHands/pull/15183
* fix: send authenticated marketplace URLs to agent-server by @hieptl in https://github.com/OpenHands/OpenHands/pull/15187
### Maintenance
* chore(main): release 1.9.2 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15171
* chore: bump SDK packages to v1.33.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15177
* chore(main): release 1.9.3 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15179


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.42.0...cloud-1.43.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.9.2 — 2026-07-07

## 1.9.2 (2026-07-07)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Maintenance
* chore(main): release cloud 1.42.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15151


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.9.1...1.9.2

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.9.1 — 2026-07-07

## 1.9.1 (2026-07-07)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(enterprise/auth): super-admin management endpoint (grant/revoke/list) by @jpshackelford in https://github.com/OpenHands/OpenHands/pull/15006
### Bug Fixes
* fix: settings page scroll layout by @saurya in https://github.com/OpenHands/OpenHands/pull/15147
* fix(app_server): pass flat mcp_config shape to SDK Agent by @tofarr in https://github.com/OpenHands/OpenHands/pull/15159
* fix: scroll settings sidebar so Skills is reachable in orgs by @hieptl in https://github.com/OpenHands/OpenHands/pull/15138
* fix(frontend): read SDK 1.31.x flat mcp_config wire format by @tofarr in https://github.com/OpenHands/OpenHands/pull/15165
* fix(app_server): derive agent server image from package version by @tofarr in https://github.com/OpenHands/OpenHands/pull/15168
### Maintenance
* chore(main): release cloud 1.41.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15013
* chore: bump SDK packages to v1.31.2 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15156
* chore: bump SDK packages to v1.32.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15157
* ci: PLTF-2960 open a chart image-tag bump PR on cloud release by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/15166


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.9.0...1.9.1

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.42.0 — 2026-07-07

## 1.42.0 (2026-07-07)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat(enterprise/auth): super-admin management endpoint (grant/revoke/list) by @jpshackelford in https://github.com/OpenHands/OpenHands/pull/15006
### Bug Fixes
* fix: settings page scroll layout by @saurya in https://github.com/OpenHands/OpenHands/pull/15147
* fix(app_server): pass flat mcp_config shape to SDK Agent by @tofarr in https://github.com/OpenHands/OpenHands/pull/15159
* fix: scroll settings sidebar so Skills is reachable in orgs by @hieptl in https://github.com/OpenHands/OpenHands/pull/15138
* fix(frontend): read SDK 1.31.x flat mcp_config wire format by @tofarr in https://github.com/OpenHands/OpenHands/pull/15165
* fix(app_server): derive agent server image from package version by @tofarr in https://github.com/OpenHands/OpenHands/pull/15168
### Maintenance
* chore: bump SDK packages to v1.31.2 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15156
* chore: bump SDK packages to v1.32.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15157
* ci: PLTF-2960 open a chart image-tag bump PR on cloud release by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/15166
* chore(main): release 1.9.1 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/15142


**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.41.0...cloud-1.42.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.9.0 — 2026-07-06

## 1.9.0 (2026-07-06)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: move existing users into the default org when first auto-added by @ak684 in https://github.com/OpenHands/OpenHands/pull/14740
* feat: route unclaimed automation events to the default org on single-org installs by @ak684 in https://github.com/OpenHands/OpenHands/pull/14745
* feat: add hide_personal_workspaces flag for org-only OHE installs by @ak684 in https://github.com/OpenHands/OpenHands/pull/14741
* feat: make the first signed-in user the default org owner, track the org by is_default flag by @ak684 in https://github.com/OpenHands/OpenHands/pull/14752
* feat(acp): add switch_acp_model proxy endpoint for cloud conversations by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14744
* feat(acp): add model dropdown and credential fields to agent settings page by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14733
* feat: add validation for secret names to ensure valid env var format by @jpshackelford in https://github.com/OpenHands/OpenHands/pull/12980
* feat: auto-accept invitation links instead of the confirm/cancel modal by @ak684 in https://github.com/OpenHands/OpenHands/pull/14786
* feat: expose copyable invite links so invitations work without email delivery by @ak684 in https://github.com/OpenHands/OpenHands/pull/14758
* feat: accept pending invitations by verified-email match at sign-in by @ak684 in https://github.com/OpenHands/OpenHands/pull/14759
* feat: explicit OH_DEPLOYMENT_MODE flag; gate cloud-account CTA to enterprise cloud by @ak684 in https://github.com/OpenHands/OpenHands/pull/14794
* feat: OHE multi-model LLM discovery + BYOK gating (proxy discovery, catalogue union, UX) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14773
* feat(acp): allow MCP server config for ACP agents by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14613
* feat: enforce conversation limits by @HeyItsChloe in https://github.com/OpenHands/OpenHands/pull/14168
* feat(APP-2136): expose automations menu item for all users by @erisfully in https://github.com/OpenHands/OpenHands/pull/14688
* feat(jira-dc): persist and inject per-user OAuth tokens in resolver conversations by @ak684 in https://github.com/OpenHands/OpenHands/pull/14650
* feat(jira-dc): share linked OAuth token with eligible conversations by @ak684 in https://github.com/OpenHands/OpenHands/pull/14697
* feat: add DynamicRemoteSandboxSpecService backed by runtime-api warm configs by @tofarr in https://github.com/OpenHands/OpenHands/pull/14849
* feat: encode harness in chip icon, surface model in chip text by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14510
* feat: PLTF-2956 parallelize GitHub GraphQL queries in get_suggested_tasks by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14821
* feat: surface a clear error when a custom sandbox image's agent-server SDK mismatches by @ak684 in https://github.com/OpenHands/OpenHands/pull/14883
* feat: PLTF-2968 allow per-deployment resolver macro via OH_RESOLVER_LABEL by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14895
* feat: Support Slack attachments in agent context by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14934
* feat: add sub-agent task (TaskToolSet) visualizer to the chat UI by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14928
* feat: Add full Git history user setting by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14950
* feat(enterprise): add admin user-provisioning endpoint by @chuckbutkus in https://github.com/OpenHands/OpenHands/pull/14864
* feat: Use interrupt endpoint for agent pause UI by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14972
* feat: add default_sandbox_spec_id to user settings by @tofarr in https://github.com/OpenHands/OpenHands/pull/14985
* feat(azure-devops): add resolver mentions + org-level one-click webhook setup by @ak684 in https://github.com/OpenHands/OpenHands/pull/14991
* feat(jira-dc): email-mode auto-link, targeted repo lookup, and picker mentions by @ak684 in https://github.com/OpenHands/OpenHands/pull/15001
* feat: implement semantic file chunking using tree-sitter AST parsing by @ysinghc in https://github.com/OpenHands/OpenHands/pull/14699
* feat(org): Add organization conversation admin dashboard by @saurya in https://github.com/OpenHands/OpenHands/pull/14846
* feat(app-server): capture production workspace state — initial snapshot at start + archive before delete (APP-2403) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14953
* feat(device-verify): align warning, button color, and add workspace dropdown by @tofarr in https://github.com/OpenHands/OpenHands/pull/15031
* feat(enterprise/auth): add super roles via user.role_id with permission fallback by @chuckbutkus in https://github.com/OpenHands/OpenHands/pull/14937
* feat(org): expose caller permissions on GET /organizations/{id}/me by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15048
* feat(api-keys): add optional active window (not_before & expires_at) by @tofarr in https://github.com/OpenHands/OpenHands/pull/15085
* feat(app-server): add repo/branch to Laminar trace metadata by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15059
* feat: add parallel tool calls (tool_concurrency_limit) to agent settings by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14929
* feat(api-keys): make 'unbound' org scope an explicit, first-class option by @tofarr in https://github.com/OpenHands/OpenHands/pull/15096
* feat(jira-dc): fix the integration panel so members get guidance, not the admin setup form by @ak684 in https://github.com/OpenHands/OpenHands/pull/15040
* feat: Add dynamic marketplace support for plugin registration by @HeyItsChloe in https://github.com/OpenHands/OpenHands/pull/14887
* feat(saas-auth): accept api_key cookie as a fallback credential by @tofarr in https://github.com/OpenHands/OpenHands/pull/15101
### Bug Fixes
* fix: bump agent-server to 1.27.1 for Gemini cache fix by @ak684 in https://github.com/OpenHands/OpenHands/pull/14751
* fix: bump agent-server to 1.28.0 by @ak684 in https://github.com/OpenHands/OpenHands/pull/14754
* fix(acp): sanitize agent-server error body in switch_acp_model proxy by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14760
* fix: Pin duplicate checker action to extensions release by @enyst in https://github.com/OpenHands/OpenHands/pull/14771
* fix(deps): bump postcss to 8.5.15 to fix XSS (GHSA-qx2v-qp2m-jg93) by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14770
* fix(frontend): start new LLM profiles on basic settings with blank fields by @ak684 in https://github.com/OpenHands/OpenHands/pull/14782
* fix: preserve LLM base URL on basic saves by @he-yufeng in https://github.com/OpenHands/OpenHands/pull/14776
* fix(enterprise): litellm_proxy/ → openhands/ on settings load by @smolpaws in https://github.com/OpenHands/OpenHands/pull/14766
* fix(frontend): treat managed openhands base URLs as provider defaults in view inference by @ak684 in https://github.com/OpenHands/OpenHands/pull/14783
* fix(frontend): only render the API key input once a provider is selected by @ak684 in https://github.com/OpenHands/OpenHands/pull/14787
* fix(frontend): hydrate the LLM profile edit form from the selected profile by @ak684 in https://github.com/OpenHands/OpenHands/pull/14789
* fix(frontend): accept typed emails without requiring Space in the invite input by @ak684 in https://github.com/OpenHands/OpenHands/pull/14790
* fix: redact credentials from PluginSpec.source during serialization by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14795
* fix: reconcile and label per-(user,org) LiteLLM managed keys by @ak684 in https://github.com/OpenHands/OpenHands/pull/14803
* fix: default enterprise injector kinds in the image, not just the chart by @ak684 in https://github.com/OpenHands/OpenHands/pull/14811
* fix(frontend): avoid dirty language filter input by @mturac in https://github.com/OpenHands/OpenHands/pull/14812
* fix(acp): surface acp_server on cloud conversations so the model picker renders by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14797
* fix: Add SaaS migration for sandbox pause state by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14829
* fix: Use final response endpoint for resolver callbacks by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14828
* fix: Ignore OpenHands bot GitHub resolver events by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14832
* fix: duplicate Slack no-repository selections by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14833
* fix: write trajectory exports as utf-8 by @wgu9 in https://github.com/OpenHands/OpenHands/pull/14810
* fix: use runtime /list API for sandbox concurrency count, not is_paused DB flag by @tofarr in https://github.com/OpenHands/OpenHands/pull/14834
* fix: renumber duplicate migration 122 → 123 (drop is_paused) by @tofarr in https://github.com/OpenHands/OpenHands/pull/14840
* fix: API key CORS header handling by @neubig in https://github.com/OpenHands/OpenHands/pull/14835
* fix: PLTF-2956 batch_get_sandboxes to gracefully handle runtime API failures by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14853
* fix: Fix CVE-2026-48526: Update pyjwt to 2.13.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14854
* fix: PLTF-2956 log level from warning to error for automation service forwarding failures by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14820
* fix: log error level for failed GitHub payload processing (#14814) by @GautamKumarOffical in https://github.com/OpenHands/OpenHands/pull/14863
* fix: Fix CVE-2026-49855: Update tornado to 6.5.7 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14856
* fix: decouple API-key (Bearer) auth from Keycloak offline sessions by @hieptl in https://github.com/OpenHands/OpenHands/pull/14867
* fix: Fix CVE-2026-54278: Update aiohttp to 3.14.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14871
* fix: PLTF-2956 Log 5xx responses at error level in AutomationEventService by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14819
* fix: revert conversation limit enforcement from #14168 by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14877
* fix: Fix CVE-2026-12143: Update form-data to 4.0.6 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14875
* fix: Fix CVE-2026-53539: Update python-multipart to >=0.0.30 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14876
* fix: post Bitbucket DC comments as the bot account and background webhook handling by @ak684 in https://github.com/OpenHands/OpenHands/pull/14881
* fix(frontend): send on Enter for touchscreen laptops by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14870
* fix: PLTF-2956 Tests for GitHub payload-processing failure log level by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14818
* fix: clean up LLM Profile auth fields (dedupe variant section + exclude inert auth_type) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14893
* fix: prevent conversation export overload by @neubig in https://github.com/OpenHands/OpenHands/pull/14899
* fix: Forgejo/Gitea clone failure when hosted under a subpath by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14930
* fix: self-heal stale LiteLLM user on re-onboarding by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14932
* fix: load global user & org skills without a selected repository by @hieptl in https://github.com/OpenHands/OpenHands/pull/14780
* fix: Fix GHSA-gj48-438w-jh9v: Update bleach to 6.4.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14945
* fix: Fix CVE-2026-45409: Update idna to 3.15 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14946
* fix: Fix GHSA-6v7p-g79w-8964: Update msgpack to 1.2.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14944
* fix: Fix CVE-2026-49458: Update dompurify to 3.4.6 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14872
* fix: Fix CVE-2026-44727: Update jupyter-server to 2.20.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14943
* fix: binaryornot Python 3 crash on binary reads by @enyst in https://github.com/OpenHands/OpenHands/pull/14518
* fix: Fix GHSA-jm82-fx9c-mx94: Update pypdf to >=6.13.3 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14959
* fix: Fix GHSA-cmwh-pvxp-8882: Update dompurify to 3.4.11 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14956
* fix: Fix CVE-2026-41691: Update i18next-http-backend to 3.0.5 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14955
* fix: Fix CVE-2026-54283: Update starlette to 1.3.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14874
* fix: Fix CVE-2026-8723: Update qs to 6.15.2 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14957
* fix: avoid decrypting org_member.llm_api_key when not set by @saurya in https://github.com/OpenHands/OpenHands/pull/14898
* fix: Fix CVE-2026-54285: Update @opentelemetry/core to 2.8.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14980
* fix: Fix GHSA-4xgf-cpjx-pc3j: Update pydantic-settings to 2.14.2 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14979
* fix: Fix CVE-2026-48712: Update protobufjs to 7.6.4 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14981
* fix: handle None git_full_clone from DB in SaasSettingsStore by @tofarr in https://github.com/OpenHands/OpenHands/pull/14988
* fix(frontend): stop polling app-conversations with task IDs on new conversation by @hieptl in https://github.com/OpenHands/OpenHands/pull/14989
* fix: return actionable error when Jira DC token endpoint is unreachable by @ak684 in https://github.com/OpenHands/OpenHands/pull/14990
* fix(llm): restore managed member-key fallback in effective LLM key resolution by @ak684 in https://github.com/OpenHands/OpenHands/pull/14992
* fix: Fix CVE-2026-48779: Update ws to 8.21.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/15007
* fix: remove duplicate Close button on the org invite links modal by @ak684 in https://github.com/OpenHands/OpenHands/pull/14974
* fix(jira): make Jira Cloud and Jira DC HTTP timeouts configurable and consistent by @ak684 in https://github.com/OpenHands/OpenHands/pull/15012
* fix: Fix CVE-2026-44681: Update authlib to >=1.6.12 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14983
* fix: don't switch LLM profile before the conversation UUID exists (avoids 422) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14900
* fix(enterprise): log automation HTTP response failures as errors by @wgu9 in https://github.com/OpenHands/OpenHands/pull/15004
* fix(enterprise): add alembic migration for execution_status column by @tofarr in https://github.com/OpenHands/OpenHands/pull/15030
* fix(jira-dc): more forgiving repo + mention resolution for Data Center by @ak684 in https://github.com/OpenHands/OpenHands/pull/15034
* fix(device-verify): rename 'Workspace' dropdown to 'Organization' by @tofarr in https://github.com/OpenHands/OpenHands/pull/15057
* fix(jira-dc): don't org-gate a personal-workspace Jira DC integration by @ak684 in https://github.com/OpenHands/OpenHands/pull/15036
* fix: stream LLM tokens for cloud conversations and profile switches by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15021
* fix: set email person property in PostHog during onboarding completion by @lilagrc in https://github.com/OpenHands/OpenHands/pull/15070
* fix: Timezones stored in the db do not have a timezone by @tofarr in https://github.com/OpenHands/OpenHands/pull/15092
* fix: add test for InMemoryRateLimiter.__init__ to prevent duplicate assignment regression by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14729
* fix(frontend): stop streamed deltas rendering twice and fragmenting in V1 chat by @shanemort1982 in https://github.com/OpenHands/OpenHands/pull/15108
* fix: crash when request.client is None in InMemoryRateLimiter by @rakshith1928 in https://github.com/OpenHands/OpenHands/pull/15119
* fix(sandbox-spec): fall back to defaults when runtime-api has no warm runtimes by @tofarr in https://github.com/OpenHands/OpenHands/pull/15141
### Documentation
* docs: Bring README.md over from Agent Canvas by @rbren in https://github.com/OpenHands/OpenHands/pull/14844
* docs(skills): fix typo in OpenHands docs URL in add_agent.md by @sanjibani in https://github.com/OpenHands/OpenHands/pull/14865
* docs: revise source code links in README.md by @enyst in https://github.com/OpenHands/OpenHands/pull/14869
* docs: fix broken README urls by @lexcodes-dev in https://github.com/OpenHands/OpenHands/pull/14907
* docs: fix dead link to self-hosting guide in README by @tomsen-ai in https://github.com/OpenHands/OpenHands/pull/14975
### Maintenance
* refactor(llm): clean up reverse-mapping OpenHands provider models by @enyst in https://github.com/OpenHands/OpenHands/pull/14725
* refactor(settings): delegate agent-settings merge to SDK apply_agent_settings_diff by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14677
* build(deps): bump SDK packages to v1.28.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/14753
* chore(deps): bump pyjwt from 2.12.1 to 2.13.0 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/14852
* chore: bump SDK and agent-server to 1.29.0 by @ak684 in https://github.com/OpenHands/OpenHands/pull/14889
* test: replace real sleeps in maintenance runner tests by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/13930
* refactor: extract billing test fixtures for PLTF-1269 by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/13998
* test: PLTF-1269 replace test_should_ naming with test_verb_noun_context convention by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14015
* chore: purge dead acp_env field footprint (removed in SDK 1.29.0) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14921
* chore(main): release cloud 1.39.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/14748
* chore(security): add Python dependency freshness guardrails by @nehaaprasad in https://github.com/OpenHands/OpenHands/pull/13754
* chore(deps-dev): bump jupyterlab from 4.5.7 to 4.5.9 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/15009
* chore(main): release cloud 1.40.0 by @openhands-release-bot[bot] in https://github.com/OpenHands/OpenHands/pull/14969
* chore: bump SDK and agent-server to 1.30.0 by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15079
* build: pin dependency versions exactly by @rbren in https://github.com/OpenHands/OpenHands/pull/14384
* ci: add release ready gate by @enyst in https://github.com/OpenHands/OpenHands/pull/14987
* chore: bump SDK packages to v1.31.1 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15127
### Other Changes
* Release 1.8.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14743
* PLTF-2895: add enterprise migration integrity check by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14689
* PLTF-2895: scope DB sessions tightly in poll_agent_servers to prevent idle-in-transaction by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14637
* ci: adopt release-please for app and cloud releases by @jlav in https://github.com/OpenHands/OpenHands/pull/14718
* Fix OpenHands LLM key access for credited orgs by @enyst in https://github.com/OpenHands/OpenHands/pull/14724
* Use reusable issue duplicate checker action by @enyst in https://github.com/OpenHands/OpenHands/pull/14609
* fix: delete LiteLLM user on personal org reset by @fengjikui in https://github.com/OpenHands/OpenHands/pull/14700
* fix(frontend): skip Git-related API calls when no Git provider is configured by @saurya in https://github.com/OpenHands/OpenHands/pull/14338

## New Contributors
* @he-yufeng made their first contribution in https://github.com/OpenHands/OpenHands/pull/14776
* @fengjikui made their first contribution in https://github.com/OpenHands/OpenHands/pull/14700
* @mturac made their first contribution in https://github.com/OpenHands/OpenHands/pull/14812
* @wgu9 made their first contribution in https://github.com/OpenHands/OpenHands/pull/14810
* @sanjibani made their first contribution in https://github.com/OpenHands/OpenHands/pull/14865
* @GautamKumarOffical made their first contribution in https://github.com/OpenHands/OpenHands/pull/14863
* @lexcodes-dev made their first contribution in https://github.com/OpenHands/OpenHands/pull/14907
* @openhands-release-bot[bot] made their first contribution in https://github.com/OpenHands/OpenHands/pull/14748
* @tomsen-ai made their first contribution in https://github.com/OpenHands/OpenHands/pull/14975
* @ysinghc made their first contribution in https://github.com/OpenHands/OpenHands/pull/14699
* @rakshith1928 made their first contribution in https://github.com/OpenHands/OpenHands/pull/15119

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.8.0...1.9.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.41.0 — 2026-07-06

## 1.41.0 (2026-07-06)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: implement semantic file chunking using tree-sitter AST parsing by @ysinghc in https://github.com/OpenHands/OpenHands/pull/14699
* feat(org): Add organization conversation admin dashboard by @saurya in https://github.com/OpenHands/OpenHands/pull/14846
* feat(app-server): capture production workspace state — initial snapshot at start + archive before delete (APP-2403) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14953
* feat(device-verify): align warning, button color, and add workspace dropdown by @tofarr in https://github.com/OpenHands/OpenHands/pull/15031
* feat(enterprise/auth): add super roles via user.role_id with permission fallback by @chuckbutkus in https://github.com/OpenHands/OpenHands/pull/14937
* feat(org): expose caller permissions on GET /organizations/{id}/me by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15048
* feat(api-keys): add optional active window (not_before & expires_at) by @tofarr in https://github.com/OpenHands/OpenHands/pull/15085
* feat(app-server): add repo/branch to Laminar trace metadata by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15059
* feat: add parallel tool calls (tool_concurrency_limit) to agent settings by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14929
* feat(api-keys): make 'unbound' org scope an explicit, first-class option by @tofarr in https://github.com/OpenHands/OpenHands/pull/15096
* feat(jira-dc): fix the integration panel so members get guidance, not the admin setup form by @ak684 in https://github.com/OpenHands/OpenHands/pull/15040
* feat: Add dynamic marketplace support for plugin registration by @HeyItsChloe in https://github.com/OpenHands/OpenHands/pull/14887
* feat(saas-auth): accept api_key cookie as a fallback credential by @tofarr in https://github.com/OpenHands/OpenHands/pull/15101
### Bug Fixes
* fix(jira): make Jira Cloud and Jira DC HTTP timeouts configurable and consistent by @ak684 in https://github.com/OpenHands/OpenHands/pull/15012
* fix: Fix CVE-2026-44681: Update authlib to >=1.6.12 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14983
* fix: don't switch LLM profile before the conversation UUID exists (avoids 422) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14900
* fix(enterprise): log automation HTTP response failures as errors by @wgu9 in https://github.com/OpenHands/OpenHands/pull/15004
* fix(enterprise): add alembic migration for execution_status column by @tofarr in https://github.com/OpenHands/OpenHands/pull/15030
* fix(jira-dc): more forgiving repo + mention resolution for Data Center by @ak684 in https://github.com/OpenHands/OpenHands/pull/15034
* fix(device-verify): rename 'Workspace' dropdown to 'Organization' by @tofarr in https://github.com/OpenHands/OpenHands/pull/15057
* fix(jira-dc): don't org-gate a personal-workspace Jira DC integration by @ak684 in https://github.com/OpenHands/OpenHands/pull/15036
* fix: stream LLM tokens for cloud conversations and profile switches by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/15021
* fix: set email person property in PostHog during onboarding completion by @lilagrc in https://github.com/OpenHands/OpenHands/pull/15070
* fix: Timezones stored in the db do not have a timezone by @tofarr in https://github.com/OpenHands/OpenHands/pull/15092
* fix: add test for InMemoryRateLimiter.__init__ to prevent duplicate assignment regression by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14729
* fix(frontend): stop streamed deltas rendering twice and fragmenting in V1 chat by @shanemort1982 in https://github.com/OpenHands/OpenHands/pull/15108
* fix: crash when request.client is None in InMemoryRateLimiter by @rakshith1928 in https://github.com/OpenHands/OpenHands/pull/15119
* fix(sandbox-spec): fall back to defaults when runtime-api has no warm runtimes by @tofarr in https://github.com/OpenHands/OpenHands/pull/15141
### Maintenance
* chore: bump SDK and agent-server to 1.30.0 by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/15079
* build: pin dependency versions exactly by @rbren in https://github.com/OpenHands/OpenHands/pull/14384
* ci: add release ready gate by @enyst in https://github.com/OpenHands/OpenHands/pull/14987
* chore: bump SDK packages to v1.31.1 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/15127

## New Contributors
* @ysinghc made their first contribution in https://github.com/OpenHands/OpenHands/pull/14699
* @rakshith1928 made their first contribution in https://github.com/OpenHands/OpenHands/pull/15119

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.40.0...cloud-1.41.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.40.0 — 2026-06-26

## 1.40.0 (2026-06-26)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: Add full Git history user setting by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14950
* feat(enterprise): add admin user-provisioning endpoint by @chuckbutkus in https://github.com/OpenHands/OpenHands/pull/14864
* feat: Use interrupt endpoint for agent pause UI by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14972
* feat: add default_sandbox_spec_id to user settings by @tofarr in https://github.com/OpenHands/OpenHands/pull/14985
* feat(azure-devops): add resolver mentions + org-level one-click webhook setup by @ak684 in https://github.com/OpenHands/OpenHands/pull/14991
* feat(jira-dc): email-mode auto-link, targeted repo lookup, and picker mentions by @ak684 in https://github.com/OpenHands/OpenHands/pull/15001
### Bug Fixes
* fix: avoid decrypting org_member.llm_api_key when not set by @saurya in https://github.com/OpenHands/OpenHands/pull/14898
* fix: Fix CVE-2026-54285: Update @opentelemetry/core to 2.8.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14980
* fix: Fix GHSA-4xgf-cpjx-pc3j: Update pydantic-settings to 2.14.2 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14979
* fix: Fix CVE-2026-48712: Update protobufjs to 7.6.4 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14981
* fix: handle None git_full_clone from DB in SaasSettingsStore by @tofarr in https://github.com/OpenHands/OpenHands/pull/14988
* fix(frontend): stop polling app-conversations with task IDs on new conversation by @hieptl in https://github.com/OpenHands/OpenHands/pull/14989
* fix: return actionable error when Jira DC token endpoint is unreachable by @ak684 in https://github.com/OpenHands/OpenHands/pull/14990
* fix(llm): restore managed member-key fallback in effective LLM key resolution by @ak684 in https://github.com/OpenHands/OpenHands/pull/14992
* fix: Fix CVE-2026-48779: Update ws to 8.21.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/15007
* fix: remove duplicate Close button on the org invite links modal by @ak684 in https://github.com/OpenHands/OpenHands/pull/14974
### Documentation
* docs: fix dead link to self-hosting guide in README by @tomsen-ai in https://github.com/OpenHands/OpenHands/pull/14975
### Maintenance
* chore(security): add Python dependency freshness guardrails by @nehaaprasad in https://github.com/OpenHands/OpenHands/pull/13754
* chore(deps-dev): bump jupyterlab from 4.5.7 to 4.5.9 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/15009

## New Contributors
* @tomsen-ai made their first contribution in https://github.com/OpenHands/OpenHands/pull/14975

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.39.0...cloud-1.40.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## cloud-1.39.0 — 2026-06-24

## 1.39.0 (2026-06-24)

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Features
* feat: move existing users into the default org when first auto-added by @ak684 in https://github.com/OpenHands/OpenHands/pull/14740
* feat: route unclaimed automation events to the default org on single-org installs by @ak684 in https://github.com/OpenHands/OpenHands/pull/14745
* feat: add hide_personal_workspaces flag for org-only OHE installs by @ak684 in https://github.com/OpenHands/OpenHands/pull/14741
* feat: make the first signed-in user the default org owner, track the org by is_default flag by @ak684 in https://github.com/OpenHands/OpenHands/pull/14752
* feat(acp): add switch_acp_model proxy endpoint for cloud conversations by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14744
* feat(acp): add model dropdown and credential fields to agent settings page by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14733
* feat: add validation for secret names to ensure valid env var format by @jpshackelford in https://github.com/OpenHands/OpenHands/pull/12980
* feat: auto-accept invitation links instead of the confirm/cancel modal by @ak684 in https://github.com/OpenHands/OpenHands/pull/14786
* feat: expose copyable invite links so invitations work without email delivery by @ak684 in https://github.com/OpenHands/OpenHands/pull/14758
* feat: accept pending invitations by verified-email match at sign-in by @ak684 in https://github.com/OpenHands/OpenHands/pull/14759
* feat: explicit OH_DEPLOYMENT_MODE flag; gate cloud-account CTA to enterprise cloud by @ak684 in https://github.com/OpenHands/OpenHands/pull/14794
* feat: OHE multi-model LLM discovery + BYOK gating (proxy discovery, catalogue union, UX) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14773
* feat(acp): allow MCP server config for ACP agents by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14613
* feat: enforce conversation limits by @HeyItsChloe in https://github.com/OpenHands/OpenHands/pull/14168
* feat(APP-2136): expose automations menu item for all users by @erisfully in https://github.com/OpenHands/OpenHands/pull/14688
* feat(jira-dc): persist and inject per-user OAuth tokens in resolver conversations by @ak684 in https://github.com/OpenHands/OpenHands/pull/14650
* feat(jira-dc): share linked OAuth token with eligible conversations by @ak684 in https://github.com/OpenHands/OpenHands/pull/14697
* feat: add DynamicRemoteSandboxSpecService backed by runtime-api warm configs by @tofarr in https://github.com/OpenHands/OpenHands/pull/14849
* feat: encode harness in chip icon, surface model in chip text by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14510
* feat: PLTF-2956 parallelize GitHub GraphQL queries in get_suggested_tasks by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14821
* feat: surface a clear error when a custom sandbox image's agent-server SDK mismatches by @ak684 in https://github.com/OpenHands/OpenHands/pull/14883
* feat: PLTF-2968 allow per-deployment resolver macro via OH_RESOLVER_LABEL by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14895
* feat: Support Slack attachments in agent context by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14934
* feat: add sub-agent task (TaskToolSet) visualizer to the chat UI by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14928
### Bug Fixes
* fix: bump agent-server to 1.27.1 for Gemini cache fix by @ak684 in https://github.com/OpenHands/OpenHands/pull/14751
* fix: bump agent-server to 1.28.0 by @ak684 in https://github.com/OpenHands/OpenHands/pull/14754
* fix(acp): sanitize agent-server error body in switch_acp_model proxy by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14760
* fix: Pin duplicate checker action to extensions release by @enyst in https://github.com/OpenHands/OpenHands/pull/14771
* fix(deps): bump postcss to 8.5.15 to fix XSS (GHSA-qx2v-qp2m-jg93) by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14770
* fix(frontend): start new LLM profiles on basic settings with blank fields by @ak684 in https://github.com/OpenHands/OpenHands/pull/14782
* fix: preserve LLM base URL on basic saves by @he-yufeng in https://github.com/OpenHands/OpenHands/pull/14776
* fix(enterprise): litellm_proxy/ → openhands/ on settings load by @smolpaws in https://github.com/OpenHands/OpenHands/pull/14766
* fix(frontend): treat managed openhands base URLs as provider defaults in view inference by @ak684 in https://github.com/OpenHands/OpenHands/pull/14783
* fix(frontend): only render the API key input once a provider is selected by @ak684 in https://github.com/OpenHands/OpenHands/pull/14787
* fix(frontend): hydrate the LLM profile edit form from the selected profile by @ak684 in https://github.com/OpenHands/OpenHands/pull/14789
* fix(frontend): accept typed emails without requiring Space in the invite input by @ak684 in https://github.com/OpenHands/OpenHands/pull/14790
* fix: redact credentials from PluginSpec.source during serialization by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14795
* fix: reconcile and label per-(user,org) LiteLLM managed keys by @ak684 in https://github.com/OpenHands/OpenHands/pull/14803
* fix: default enterprise injector kinds in the image, not just the chart by @ak684 in https://github.com/OpenHands/OpenHands/pull/14811
* fix(frontend): avoid dirty language filter input by @mturac in https://github.com/OpenHands/OpenHands/pull/14812
* fix(acp): surface acp_server on cloud conversations so the model picker renders by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14797
* fix: Add SaaS migration for sandbox pause state by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14829
* fix: Use final response endpoint for resolver callbacks by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14828
* fix: Ignore OpenHands bot GitHub resolver events by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14832
* fix: duplicate Slack no-repository selections by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14833
* fix: write trajectory exports as utf-8 by @wgu9 in https://github.com/OpenHands/OpenHands/pull/14810
* fix: use runtime /list API for sandbox concurrency count, not is_paused DB flag by @tofarr in https://github.com/OpenHands/OpenHands/pull/14834
* fix: renumber duplicate migration 122 → 123 (drop is_paused) by @tofarr in https://github.com/OpenHands/OpenHands/pull/14840
* fix: API key CORS header handling by @neubig in https://github.com/OpenHands/OpenHands/pull/14835
* fix: PLTF-2956 batch_get_sandboxes to gracefully handle runtime API failures by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14853
* fix: Fix CVE-2026-48526: Update pyjwt to 2.13.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14854
* fix: PLTF-2956 log level from warning to error for automation service forwarding failures by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14820
* fix: log error level for failed GitHub payload processing (#14814) by @GautamKumarOffical in https://github.com/OpenHands/OpenHands/pull/14863
* fix: Fix CVE-2026-49855: Update tornado to 6.5.7 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14856
* fix: decouple API-key (Bearer) auth from Keycloak offline sessions by @hieptl in https://github.com/OpenHands/OpenHands/pull/14867
* fix: Fix CVE-2026-54278: Update aiohttp to 3.14.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14871
* fix: PLTF-2956 Log 5xx responses at error level in AutomationEventService by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14819
* fix: revert conversation limit enforcement from #14168 by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/14877
* fix: Fix CVE-2026-12143: Update form-data to 4.0.6 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14875
* fix: Fix CVE-2026-53539: Update python-multipart to >=0.0.30 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14876
* fix: post Bitbucket DC comments as the bot account and background webhook handling by @ak684 in https://github.com/OpenHands/OpenHands/pull/14881
* fix(frontend): send on Enter for touchscreen laptops by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14870
* fix: PLTF-2956 Tests for GitHub payload-processing failure log level by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14818
* fix: clean up LLM Profile auth fields (dedupe variant section + exclude inert auth_type) by @ak684 in https://github.com/OpenHands/OpenHands/pull/14893
* fix: prevent conversation export overload by @neubig in https://github.com/OpenHands/OpenHands/pull/14899
* fix: Forgejo/Gitea clone failure when hosted under a subpath by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14930
* fix: self-heal stale LiteLLM user on re-onboarding by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14932
* fix: load global user & org skills without a selected repository by @hieptl in https://github.com/OpenHands/OpenHands/pull/14780
* fix: Fix GHSA-gj48-438w-jh9v: Update bleach to 6.4.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14945
* fix: Fix CVE-2026-45409: Update idna to 3.15 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14946
* fix: Fix GHSA-6v7p-g79w-8964: Update msgpack to 1.2.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14944
* fix: Fix CVE-2026-49458: Update dompurify to 3.4.6 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14872
* fix: Fix CVE-2026-44727: Update jupyter-server to 2.20.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14943
* fix: binaryornot Python 3 crash on binary reads by @enyst in https://github.com/OpenHands/OpenHands/pull/14518
* fix: Fix GHSA-jm82-fx9c-mx94: Update pypdf to >=6.13.3 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14959
* fix: Fix GHSA-cmwh-pvxp-8882: Update dompurify to 3.4.11 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14956
* fix: Fix CVE-2026-41691: Update i18next-http-backend to 3.0.5 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14955
* fix: Fix CVE-2026-54283: Update starlette to 1.3.1 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14874
* fix: Fix CVE-2026-8723: Update qs to 6.15.2 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14957
### Documentation
* docs: Bring README.md over from Agent Canvas by @rbren in https://github.com/OpenHands/OpenHands/pull/14844
* docs(skills): fix typo in OpenHands docs URL in add_agent.md by @sanjibani in https://github.com/OpenHands/OpenHands/pull/14865
* docs: revise source code links in README.md by @enyst in https://github.com/OpenHands/OpenHands/pull/14869
* docs: fix broken README urls by @lexcodes-dev in https://github.com/OpenHands/OpenHands/pull/14907
### Maintenance
* refactor(llm): clean up reverse-mapping OpenHands provider models by @enyst in https://github.com/OpenHands/OpenHands/pull/14725
* refactor(settings): delegate agent-settings merge to SDK apply_agent_settings_diff by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14677
* build(deps): bump SDK packages to v1.28.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/14753
* chore(deps): bump pyjwt from 2.12.1 to 2.13.0 by @dependabot[bot] in https://github.com/OpenHands/OpenHands/pull/14852
* chore: bump SDK and agent-server to 1.29.0 by @ak684 in https://github.com/OpenHands/OpenHands/pull/14889
* test: replace real sleeps in maintenance runner tests by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/13930
* refactor: extract billing test fixtures for PLTF-1269 by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/13998
* test: PLTF-1269 replace test_should_ naming with test_verb_noun_context convention by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14015
* chore: purge dead acp_env field footprint (removed in SDK 1.29.0) by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14921
### Other Changes
* PLTF-2899: keep resume flow responsive during rate limits by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14660
* fix: _configure_llm now preserves user LLM settings by @shanemort1982 in https://github.com/OpenHands/OpenHands/pull/14451
* Enable org LLM profiles in settings by @ak684 in https://github.com/OpenHands/OpenHands/pull/14715
* Revert ACP bootstrap-prompt resume + enable acp_isolate_data_dir on the cloud start path by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14722
* PLTF-2899: Add async/await static analysis checks for enterprise code by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14664
* fix: remove org_id from ownership assertion in save_app_conversation_info by @tofarr in https://github.com/OpenHands/OpenHands/pull/14727
* Harden workflow GitHub context handling by @enyst in https://github.com/OpenHands/OpenHands/pull/14537
* ci: add label-triggered OpenHands QA workflow by @enyst in https://github.com/OpenHands/OpenHands/pull/14730
* Bump SDK packages to v1.27.0 by @all-hands-bot in https://github.com/OpenHands/OpenHands/pull/14726
* perf: skip runtime API call in webhook auth via SandboxRecord by @tofarr in https://github.com/OpenHands/OpenHands/pull/14732
* fix(bitbucket-dc): resolve user via whoami so avatars load with OAuth tokens by @ak684 in https://github.com/OpenHands/OpenHands/pull/14734
* Release 1.8.0 by @mamoodi in https://github.com/OpenHands/OpenHands/pull/14743
* PLTF-2895: add enterprise migration integrity check by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14689
* PLTF-2895: scope DB sessions tightly in poll_agent_servers to prevent idle-in-transaction by @aivong-openhands in https://github.com/OpenHands/OpenHands/pull/14637
* ci: adopt release-please for app and cloud releases by @jlav in https://github.com/OpenHands/OpenHands/pull/14718
* Fix OpenHands LLM key access for credited orgs by @enyst in https://github.com/OpenHands/OpenHands/pull/14724
* Use reusable issue duplicate checker action by @enyst in https://github.com/OpenHands/OpenHands/pull/14609
* fix: delete LiteLLM user on personal org reset by @fengjikui in https://github.com/OpenHands/OpenHands/pull/14700
* fix(frontend): skip Git-related API calls when no Git provider is configured by @saurya in https://github.com/OpenHands/OpenHands/pull/14338

## New Contributors
* @he-yufeng made their first contribution in https://github.com/OpenHands/OpenHands/pull/14776
* @fengjikui made their first contribution in https://github.com/OpenHands/OpenHands/pull/14700
* @mturac made their first contribution in https://github.com/OpenHands/OpenHands/pull/14812
* @wgu9 made their first contribution in https://github.com/OpenHands/OpenHands/pull/14810
* @sanjibani made their first contribution in https://github.com/OpenHands/OpenHands/pull/14865
* @GautamKumarOffical made their first contribution in https://github.com/OpenHands/OpenHands/pull/14863
* @lexcodes-dev made their first contribution in https://github.com/OpenHands/OpenHands/pull/14907

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/cloud-1.38.0...cloud-1.39.0

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).

## 1.8.0 — 2026-06-10

## What's Changed
### Added
* Added LLM profiles by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/14149
* Users can select the sandbox grouping strategy by @tofarr in https://github.com/OpenHands/OpenHands/pull/14291
* Enabled sub-agent delegation by @xingyaoww in https://github.com/OpenHands/OpenHands/pull/14122
* Minimal generic ACP agent UI by @simonrosenberg in https://github.com/OpenHands/OpenHands/pull/14401

### Changed
* Removed App tab from conversation by @neubig in https://github.com/OpenHands/OpenHands/pull/14395

### Fixed
* Many UI bug fixes

## New Contributors
* @Cao-R made their first contribution in https://github.com/OpenHands/OpenHands/pull/14261
* @DisabledAbel made their first contribution in https://github.com/OpenHands/OpenHands/pull/14367
* @smolpaws made their first contribution in https://github.com/OpenHands/OpenHands/pull/14444
* @Kage18 made their first contribution in https://github.com/OpenHands/OpenHands/pull/14437
* @Sanjays2402 made their first contribution in https://github.com/OpenHands/OpenHands/pull/14577
* @lilagrc made their first contribution in https://github.com/OpenHands/OpenHands/pull/14519

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.7.0...1.8.0

## 1.7.0 — 2026-05-01

## What's Changed
### Added
* Added LLM model on conversation cards and header by @sjathin in https://github.com/OpenHands/OpenHands/pull/13616
* Added SANDBOX_KVM_ENABLED environment variable to enable passing /dev/kvm to sandbox containers. When enabled, sandboxes can run KVM-accelerated virtual machines instead of using slower emulation by @gpothier in https://github.com/OpenHands/OpenHands/pull/13618
* Exposed SDK settings schema to OpenHands by @neubig in https://github.com/OpenHands/OpenHands/pull/13306

### Changed
* Moved Tavily search key to MCP settings by @neubig in https://github.com/OpenHands/OpenHands/pull/14000

### Fixed
* Resolved multiple CVEs through dependency updates
* Fixed multiple UI issues

## New Contributors
* @gpothier made their first contribution in https://github.com/OpenHands/OpenHands/pull/13618
* @Ricardo-M-L made their first contribution in https://github.com/OpenHands/OpenHands/pull/13817
* @buyua9 made their first contribution in https://github.com/OpenHands/OpenHands/pull/13802
* @octo-patch made their first contribution in https://github.com/OpenHands/OpenHands/pull/13996
* @JefferyLiu6 made their first contribution in https://github.com/OpenHands/OpenHands/pull/13890
* @xsfX20 made their first contribution in https://github.com/OpenHands/OpenHands/pull/13708

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.6.0...1.7.0

## 1.6.0 — 2026-03-30

## What's Changed
### Added
* Added support for hooks by @xingyaoww in https://github.com/OpenHands/OpenHands/pull/12773
* Added Catalan language by @jordimas in https://github.com/OpenHands/OpenHands/pull/13299
* Added /clear command for V1 conversations. Typing /clear in the chat creates a new conversation that inherits the current sandbox and configuration, giving you a fresh chat history while keeping your runtime state intact by @MkDev11 in https://github.com/OpenHands/OpenHands/pull/12786
* Added copy button to code blocks by @VascoSch92 in https://github.com/OpenHands/OpenHands/pull/13458
* Added support to enable/disable default global skills by @statxc in https://github.com/OpenHands/OpenHands/pull/13046
* Added the `/new` slash command to the slash command menu by @karanjaxyz in https://github.com/OpenHands/OpenHands/pull/13599

### Fixed
* Fixed an issue where sometimes conversations were not persisted by @tofarr in https://github.com/OpenHands/OpenHands/pull/13629
* Fixed a bug in `Export Conversation` that caused events to be duplicated multiple times by @tofarr in https://github.com/OpenHands/OpenHands/pull/13364
* Multiple CVE fixes through dependency updates


## New Contributors
* @ankit2235 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12596
* @travellingsoldier85 made their first contribution in https://github.com/OpenHands/OpenHands/pull/13444
* @stakeswky made their first contribution in https://github.com/OpenHands/OpenHands/pull/13039
* @jordimas made their first contribution in https://github.com/OpenHands/OpenHands/pull/13299
* @veeceey made their first contribution in https://github.com/OpenHands/OpenHands/pull/12792
* @LarytheLord made their first contribution in https://github.com/OpenHands/OpenHands/pull/13471
* @sjathin made their first contribution in https://github.com/OpenHands/OpenHands/pull/13522
* @erisfully made their first contribution in https://github.com/OpenHands/OpenHands/pull/13549
* @statxc made their first contribution in https://github.com/OpenHands/OpenHands/pull/13046
* @karanjaxyz made their first contribution in https://github.com/OpenHands/OpenHands/pull/13599

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.5.0...1.6.0

## 1.5.0 — 2026-03-11

## What's Changed
### Added
* Added ability to attach or change the Git repository for existing conversations by @MkDev11 in https://github.com/OpenHands/OpenHands/pull/12671
* Added a `Task List` tab in the right panel that shows the agent's current task list with real-time status updates by @eureka928 in https://github.com/OpenHands/OpenHands/pull/13065
* Added planning agent by @hieptl in https://github.com/OpenHands/OpenHands/pull/12880
* Added a slash command menu to the chat input that displays available agent skills and commands when typing `/` by @eureka928 in https://github.com/OpenHands/OpenHands/pull/12982
* Added support for Bitbucket datacenter by @phymbert in https://github.com/OpenHands/OpenHands/pull/11052
* Added support for the following models: Claude Opus 4.6, GLM-4.7, Claude-Sonnet-4-6, GLM-5, Kimi-K2.5, Qwen3-Coder-Next, Gemini-3.1-Pro-Preview 

### Changed
* Hid the microagent management ui by @hieptl in https://github.com/OpenHands/OpenHands/pull/13060

### Fixed
* Fixed the pinning and unpinning functionality of tabs by @bendarte in https://github.com/OpenHands/OpenHands/pull/12932
* Many CVEs fixed through dependency updates
* Fixed multiple UI issues 


## New Contributors
* @314clay made their first contribution in https://github.com/OpenHands/OpenHands/pull/12874
* @hobostay made their first contribution in https://github.com/OpenHands/OpenHands/pull/12810
* @machov made their first contribution in https://github.com/OpenHands/OpenHands/pull/12941
* @aivong-openhands made their first contribution in https://github.com/OpenHands/OpenHands/pull/13016
* @bittoby made their first contribution in https://github.com/OpenHands/OpenHands/pull/12833
* @Fieldnote-Echo made their first contribution in https://github.com/OpenHands/OpenHands/pull/12870
* @cbagwell made their first contribution in https://github.com/OpenHands/OpenHands/pull/12595
* @Shruti1128 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12557
* @bendarte made their first contribution in https://github.com/OpenHands/OpenHands/pull/12932
* @phymbert made their first contribution in https://github.com/OpenHands/OpenHands/pull/11052
* @04cb made their first contribution in https://github.com/OpenHands/OpenHands/pull/13236
* @Povo-43 made their first contribution in https://github.com/OpenHands/OpenHands/pull/13261
* @jlav made their first contribution in https://github.com/OpenHands/OpenHands/pull/13228

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.4.0...1.5.0

## 1.4.0 — 2026-02-18

## What's Changed
### Added
* Add MiniMax-M2.5 model support by @neubig in https://github.com/OpenHands/OpenHands/pull/12835

### Fixed
* Fixed an issue where resumed conversations would incorrectly display an error status during startup by @tofarr in https://github.com/OpenHands/OpenHands/pull/12718


## New Contributors
* @huangkevin-apr made their first contribution in https://github.com/OpenHands/OpenHands/pull/12728
* @agrattan0820 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12809

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.3.0...1.4.0

## 1.3.0 — 2026-02-02

## What's Changed
### Added
* Added CORS support to Docker sandbox service for remote browser access. Users running OpenHands on remote servers should set `WEB_HOST` environment variable (e.g., WEB_HOST=192.168.1.100:3000) along with `SANDBOX_CONTAINER_URL_PATTERN` for proper remote access configuration by @tofarr in https://github.com/OpenHands/OpenHands/pull/12489
* Added support for host networking mode via `OH_SANDBOX_USE_HOST_NETWORK=true`. This enables reverse proxy setups to access user-launched applications on any port, not just the predefined worker ports by @MkDev11 in https://github.com/OpenHands/OpenHands/pull/12445

### Fixed
* Fixed a bug in the UI where the agent's thought content from ThinkAction was not displayed by @abhayymishraa in https://github.com/OpenHands/OpenHands/pull/12597
* Fixed cursor jumping to end of input when editing branch or repository names in dropdown search fields by @abhayymishraa in https://github.com/OpenHands/OpenHands/pull/12501
* Fixed `Display Cost` for conversations by @tofarr in https://github.com/OpenHands/OpenHands/pull/12678

## New Contributors
* @timon0305 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12527

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.2.1...1.3.0

## 1.2.1 — 2026-01-16

## What's Changed
### Fixed
* Error messages in the chat interface now include a dismiss button and automatically truncate long messages with a "View More" toggle by @VedantMadane in https://github.com/OpenHands/OpenHands/pull/12354

## New Contributors
* @MkDev11 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12439
* @VedantMadane made their first contribution in https://github.com/OpenHands/OpenHands/pull/12354

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.2.0...1.2.1

## 1.2.0 — 2026-01-16

## What's Changed
### Added
* Adding a status indicator above the chat until the conversation is ready by @HeyItsChloe in https://github.com/OpenHands/OpenHands/pull/12111

### Changed
* Conversation title is now displayed in delete confirmation modal by @naaa760 in https://github.com/OpenHands/OpenHands/pull/11818
* Bumped condenser defaults max_size from 120 to 240 by @xingyaoww in https://github.com/OpenHands/OpenHands/pull/12267

### Fixed
* Fixed a bug where the Search API Key was getting reset when saving other settings by @sarva-20 in https://github.com/OpenHands/OpenHands/pull/12243
* Many bug fixes and improvements


## New Contributors
* @all-hands-bot made their first contribution in https://github.com/OpenHands/OpenHands/pull/12218
* @aaron-seq made their first contribution in https://github.com/OpenHands/OpenHands/pull/11953
* @kub938 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12215
* @O2sa made their first contribution in https://github.com/OpenHands/OpenHands/pull/12174
* @Ryanakml made their first contribution in https://github.com/OpenHands/OpenHands/pull/12219
* @adithya-naik made their first contribution in https://github.com/OpenHands/OpenHands/pull/12230
* @pdaxt made their first contribution in https://github.com/OpenHands/OpenHands/pull/12256
* @sarva-20 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12243
* @zxkane made their first contribution in https://github.com/OpenHands/OpenHands/pull/12284
* @leonace924 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12400

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.1.0...1.2.0

## 1.1.0 — 2025-12-30

## What's Changed
### Added
* Added OAuth 2.0 Device Flow for CLI authentication by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/11984
* Added refresh button to the Changes tab by @hieptl in https://github.com/OpenHands/OpenHands/pull/12036
* Added `Export Conversation` button for conversations in the conversation panel by @tofarr in https://github.com/OpenHands/OpenHands/pull/12030
* Added Forgejo integration by @johba37 in https://github.com/OpenHands/OpenHands/pull/11111

### Changed
* Changed the init process for each runtime container from micromamba to tini so that child processes of tmux get reaped properly by @GuyPaddock in https://github.com/OpenHands/OpenHands/pull/12133

### Fixed
* Local (non‑Docker) runs now use host‑writable paths by default and keep Playwright downloads out of /workspace, preventing permissions errors and making it easier to find your files on the host by @Wangmerlyn in https://github.com/OpenHands/OpenHands/pull/12015
* Fixed multiple UI and performance issues

## New Contributors
* @Mariam-Saeed made their first contribution in https://github.com/OpenHands/OpenHands/pull/12041
* @Wangmerlyn made their first contribution in https://github.com/OpenHands/OpenHands/pull/12015
* @aditya-gaharawar made their first contribution in https://github.com/OpenHands/OpenHands/pull/12103
* @majiayu000 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12117
* @shanemort1982 made their first contribution in https://github.com/OpenHands/OpenHands/pull/12113
* @GuyPaddock made their first contribution in https://github.com/OpenHands/OpenHands/pull/12133
* @johba37 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11111
* @phenric26 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11600

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/1.0.0...1.1.0

## 1.0.0 — 2025-12-16

## What's Changed

New OpenHands 1.0.0 using the [new software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) with many optimizations across the app. Check out the documentation on [how the OpenHands V1 uses the software-agent-sdk](https://docs.openhands.dev/sdk/arch/overview#relationship-with-openhands-applications).

### Added
* Chat messages are queued during runtime connection by @naaa760 in https://github.com/OpenHands/OpenHands/pull/11687
* Implemented new task tracker interface by @hieptl in https://github.com/OpenHands/OpenHands/pull/11692
* Added Azure DevOps integration support by @zerofltexx in https://github.com/OpenHands/OpenHands/pull/11243

### Changed
* Enabled native tool calling for gemini-3-pro-preview by @enyst in https://github.com/OpenHands/OpenHands/pull/11774

### Fixed
* Fixed many UI issues

### Notes
* OpenHands CLI has been moved to its own repo - https://github.com/OpenHands/OpenHands-CLI

## New Contributors
* @naaa760 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11687
* @TuringND made their first contribution in https://github.com/OpenHands/OpenHands/pull/11719
* @rodneyaquino made their first contribution in https://github.com/OpenHands/OpenHands/pull/11783
* @zerofltexx made their first contribution in https://github.com/OpenHands/OpenHands/pull/11243
* @aoi127 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11767
* @18jeffreyma made their first contribution in https://github.com/OpenHands/OpenHands/pull/11716
* @adshrc made their first contribution in https://github.com/OpenHands/OpenHands/pull/11841
* @AVBharath10 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11958
* @VascoSch92 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11947
* @HeyItsChloe made their first contribution in https://github.com/OpenHands/OpenHands/pull/11981
* @KyeongJooni made their first contribution in https://github.com/OpenHands/OpenHands/pull/11980
* @nathannewyen made their first contribution in https://github.com/OpenHands/OpenHands/pull/12001

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/0.62.0...1.0.0

## 1.0.7-cli — 2025-11-11

### Fixes

- Cleanup CLI outputs when conversation is first started #11677
- Prevent tool calls with `security_risk` parameter from crashing conversations #11710 

## 0.62.0 — 2025-11-11

## What's Changed
### Added
* Allow pinning and unpinning of conversation tabs by @hieptl in https://github.com/OpenHands/OpenHands/pull/11659
* Add Documentation link to profile menu by @jpshackelford in https://github.com/OpenHands/OpenHands/pull/11583


## New Contributors
* @jeis4wpi made their first contribution in https://github.com/OpenHands/OpenHands/pull/11701

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/0.61.0...0.62.0

## 1.0.6-cli — 2025-11-07

### Fixes

- Fix broken entrypoint when using UV #11643
- Fix MCP settings persisting even after removal #11602
- Remove preset MCPs from upstream package agent-sdk #11602
- Lazy load conversation when calling `/new` command #11601
- Remove noisy logs when loading conversations #11603

## 0.61.0 — 2025-11-05

## What's Changed
### Changed
* Made terminal tab read-only by @amanape in https://github.com/OpenHands/OpenHands/pull/11546
* Removed Jupyter tab by @amanape in https://github.com/OpenHands/OpenHands/pull/11563

## New Contributors
* @aphix made their first contribution in https://github.com/OpenHands/OpenHands/pull/11044
* @jarrycyx made their first contribution in https://github.com/OpenHands/OpenHands/pull/11419
* @jessitron made their first contribution in https://github.com/OpenHands/OpenHands/pull/11610

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/0.60.0...0.61.0

## 1.0.5-cli — 2025-10-31

### Fixes

- Allow users to configure settings before conversation has started #11588
- Fix conversation ending abruptly with error when invoking condenser (requires users to re-configure llm settings) #11587

## 1.0.4-cli — 2025-10-31

### Fixed

- CLI command to launch OpenHands GUI (`openhands serve` command) #11584

## 1.0.3-cli — 2025-10-30

### Fixed
- Fixed LLM args to remove deprecation warnings https://github.com/OpenHands/OpenHands/pull/11568
- Fixes from OpenHands SDK dependency for MCP tool validation error  https://github.com/OpenHands/OpenHands/pull/11566

## 0.60.0 — 2025-10-29

## What's Changed
### Breaking
* Removed V0 CLI. V0 CLI is officially unsupported by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/11538

### Added
* Added support for Clarifai provider
* Added automatic sandbox lifecycle management to prevent resource exhaustion by limiting the number of running sandboxes by @tofarr in https://github.com/OpenHands/OpenHands/pull/11399

### Changed
* Simplified security analyzer confirmation interface by replacing two reject options with a single "Reject" option that prompts for optional reason by @malhotra5 in https://github.com/OpenHands/OpenHands/pull/11443

### Fixed
* Implemented graceful shutdown for headless mode by @li-boxuan in https://github.com/OpenHands/OpenHands/pull/11401
* Improved VSCode integration in sandbox environments with proper authentication and working directory support by @tofarr in https://github.com/OpenHands/OpenHands/pull/11426
* Fixed an issue where git operations would sometimes fail on resuming a conversation after some time by @ak684 in https://github.com/OpenHands/OpenHands/pull/11296
* Fixed an issue where config.toml was not respected by the swe-bench/run_infer.py entrypoint by @Zacharias030 in https://github.com/OpenHands/OpenHands/pull/11091
* Fixed terminal not rendering input commands by @amanape in https://github.com/OpenHands/OpenHands/pull/11537
* Fixed multiple UI issues

## New Contributors
* @Papadopulus made their first contribution in https://github.com/OpenHands/OpenHands/pull/10913
* @rstar327 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11325
* @Chesars made their first contribution in https://github.com/OpenHands/OpenHands/pull/11366
* @mogith-pn made their first contribution in https://github.com/OpenHands/OpenHands/pull/11324
* @softpudding made their first contribution in https://github.com/OpenHands/OpenHands/pull/11439
* @Akindotcome made their first contribution in https://github.com/OpenHands/OpenHands/pull/11430
* @wolfspyre made their first contribution in https://github.com/OpenHands/OpenHands/pull/10863
* @CLFutureX made their first contribution in https://github.com/OpenHands/OpenHands/pull/11332
* @jpshackelford made their first contribution in https://github.com/OpenHands/OpenHands/pull/11478
* @Alex42006 made their first contribution in https://github.com/OpenHands/OpenHands/pull/11227
* @ludwig-n made their first contribution in https://github.com/OpenHands/OpenHands/pull/11423
* @Evelyn-Colon made their first contribution in https://github.com/OpenHands/OpenHands/pull/11230

**Full Changelog**: https://github.com/OpenHands/OpenHands/compare/0.59.0...0.60.0

## 1.0.2-cli — 2025-10-21

## What's Changed
### Changed 
- Simplified option to reject agent action in confirmation mode in #11443

### Fixed 
- Broken CLI entrypoint when using package managers (e.g `uvx --python 3.12 openhands`) in #11411


## 1.0.1-cli — 2025-10-13

## What's Changed
### Fixed 
- CLI binary GLIBC compatibility for older Linux systems
- Unexpected/unrecoverable crashes when disabling confirmation mode mid conversation
- Existing API key disappearing from CLI settings when updating settings

## 1.0.0-cli — 2025-10-10

V1 CLI 

- Multi-platform standalone executable binaries to run CLI without additional setup
- Faster startup time running CLI using `uv`, `pip`, etc
- New and refreshed UI 
- Simplified JSON MCP configuration + mcp oauth support

## 0.59.0 — 2025-10-10

## What's Changed
### Added
* Added support for Lemonade Provider by @eddierichter-amd in https://github.com/All-Hands-AI/OpenHands/pull/11181

### Fixed
* Improvement to the searching of repositories by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/11203
* Fixed file ownership on mounted volumes by @YakshithK in https://github.com/All-Hands-AI/OpenHands/pull/11231
* Fixed prompt box resizing behavior (fixes #11025) by @patilatharv in https://github.com/All-Hands-AI/OpenHands/pull/11035
* Multiple UI bug fixes

## New Contributors
* @YakshithK made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/11202
* @caocao-sys made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10875
* @patilatharv made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/11035
* @eddierichter-amd made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/11181

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.58.0...0.59.0

## 0.58.0 — 2025-10-01

## What's Changed
### Added
* Added configurable timeout settings for SHTTP MCP servers to prevent tool calls from hanging by @tejas-goyal in https://github.com/All-Hands-AI/OpenHands/pull/11029
* Added claude-sonnet-4-5 model support

### Changed
* Converted settings to vertical sidebar layout

### Fixed
* Significantly improved the security of the OpenHands enterprise Docker image by fixing multiple critical and high-severity security vulnerabilities (CVEs)
* Fixed issue with users sometimes getting stuck in the initializing agent step on a resume attempt
* Fixed multiple UI bugs

## New Contributors
* @ak684 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/11026
* @Betty1202 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10246
* @BenYao21 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10450
* @tejas-goyal made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/11029

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.57.2...0.58.0

## 0.57.2 — 2025-09-25

## What's Changed
### Fixed
* Pinned litellm version to fix dependency issues
* Set Claude Sonnet output token limit

## 0.57.0 — 2025-09-19

## What's Changed
### Added
* New UI for landing and conversation pages
* New bring your own key (BYOK) feature in OpenHands Cloud

## New Contributors
* @AshwinKumarBV-git made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10866
* @jrobles98 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10702
* @tksrmz made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10948
* @kashodiya made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10908
* @eliotjones1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10898

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.56.0...0.57.0

## 0.56.0 — 2025-09-09

## What's Changed
### Added
* Added support for [AGENTS.md](https://agents.md/) files in microagents by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/10528
* Added new microagent management feature by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/10769
* Added support for routing between different LLMs in an agent trajectory by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/9738

### Fixed
* Fixed wrong working dir in local runtime by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/10801

## New Contributors
* @linhaowei1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10724
* @AnkitKrYadav made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10779
* @loyx made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10757
* @embersax made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10832
* @JAxeAddepar made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10573

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.55.0...0.56.0

## 0.55.0 — 2025-09-02

## What's Changed
### Added
* Added LLM risk analyzer by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9349
* Added setting for condenser max history size by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/10591

### Changed
* Improved performance and user experience when working with repositories that have many branches by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/10588

### Fixed
* Fixed usage of some reasoning models by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/10414
* Resolved visual formatting issues in the OpenHands CLI where markdown content was not properly rendered with adequate spacing by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10538
* Fixed cases where GitHub Cloud Resolver doesn't consider context around comments by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/10517
* Fixed cases where GitLab cloud resolver doesn't consider context around comments by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/10509
* Fixed tokens expiring in the middle of a running conversation by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/10637
* Resolved an issue where API requests with very long or malformed conversation IDs would return a `500 Internal Server Error` instead of a proper `400 Bad Request` error by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/10496


## New Contributors
* @Zacharias030 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10476
* @Joeoc2001 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9566
* @hereisok made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10033
* @danieljbruntz made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10255
* @jamiechicago312 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10485
* @underth-moon99 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10644

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.54.0...0.55.0

## 0.54.0 — 2025-08-20

## What's Changed
### Added
* Added task tracking tool and planning mode for long-horizon tasks by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/10166
* Added a new feedback reason: "The agent didn't finish the job" by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10417
* Enabled MCP in OpenHands Cloud by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10480

### Changed
* Improved the MCP config UI with add, edit, and delete functionality by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10145

### Fixed
* Fixed an issue where the UI would sometimes flash repeatedly by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/10352
* Fixed an issue where the browser tab title could revert to a previous conversation title by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/10406

## New Contributors
* @ZhonghaoJiang made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10229
* @KevinMusgrave made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10270
* @suixinio made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10454

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.53.0...0.54.0

## 0.53.0 — 2025-08-14

## What's Changed
### Added
* Added support for binding named Docker volumes into the runtime by @olyashok in https://github.com/All-Hands-AI/OpenHands/pull/10268
* Allowed partial modification of CLI settings by @aeft in https://github.com/All-Hands-AI/OpenHands/pull/10240
* Added ability to specify the user OpenHands should commit as by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10293

### Changed
* Added explicit instructions for OpenHands resolver to encourage pushing code changes by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10290

## New Contributors
* @createthis made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10274
* @787627858 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10089

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.52.0...0.53.0

## 0.52.0 — 2025-08-13

## What's Changed
### Added
* Added qwen-3-coder-480b to OpenHands provider by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9985
* Added gpt-5-2025-08-07 to OpenHands provider by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10172
* Added support for model `claude-opus-4-1-20250805` by @KennyDizi in https://github.com/All-Hands-AI/OpenHands/pull/10120
* Added search API key settings to CLI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9976
* Added support for launching the OpenHands UI using the CLI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9783
* Added support for overlay mounts in the Docker runtime by @olyashok in https://github.com/All-Hands-AI/OpenHands/pull/10222
* Added a switch to enable or disable additional solvability analysis in the resolver on OpenHands Cloud by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/9727
* Added branch information to repository context by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9833
* Added auto-pagination for conversation list with infinite scroll by @xingyaoww  in https://github.com/All-Hands-AI/OpenHands/pull/10129

### Changed
* Improved the conversation card context menu by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9917
* Improved handling of the `/resume` command in CLI by adding validation by @aeft in https://github.com/All-Hands-AI/OpenHands/pull/10066
* Changed the conversation history limit from 20 to 100 by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10128
* Improved repository loading reliability for OpenHands App by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9826
* Enhanced the CLI interface by adding proper markdown rendering for agent messages and final thoughts by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10193

### Fixed
* Fixed an issue where user input commands were echoed twice in the terminal by @erkinalp in https://github.com/All-Hands-AI/OpenHands/pull/9959
* Improved the reliability of models through the OpenHands provider by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10009
* Fixed an issue where `git clone` during workspace creation sometimes caused the server to hang by @denysvitali in https://github.com/All-Hands-AI/OpenHands/pull/9334
* Fixed the `ports are not available` error message on Windows by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9924
* Fixed an issue where CodeActAgent system prompts and in-context learning examples referenced "bash" on Windows platforms, which should have been "powershell" for consistency with the Windows runtime environment by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/10179
* Fixed an issue where Global Microagents did not work in OpenHands Cloud by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/10245
* Fixed CLI errorno21 warning by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/9990
* 

## New Contributors
* @denysvitali made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9334
* @greese-insight made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9915
* @aeft made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10054
* @izyuumi made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9757
* @chasefarmer-pixee made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10078
* @JamesZ12b made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9895
* @insop made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10241
* @ibragim-bad made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/10251

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.51.1...0.52.0

## 0.51.0 — 2025-07-31

## What's Changed
### Added
* Add MCP support for CLI by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/9519

### Changed
* Improved the resolver summary generation by instructing the agent to focus only on new changes since the last summary, preventing repetitive information in consecutive summaries by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9834
* Optimized git change detection in the `Changes` tab with performance improvement and multi-repository support by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/9870

### Fixed
* Fixed an issue where the agent would stop due to per-minute rate limit errors by increasing retry delays by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9489
* Fixed configuration precedence in CLI mode (from low to high: settings.json < workspace config.toml < command line parameters) by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/9911
* Resolved an issue where the terminal, VSCode, Jupyter, and other tabs would show a "Waiting for runtime to start..." message when the agent was stopped, instead of displaying their actual content by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/9941
* Fixed MCP configuration merging where settings from config.toml files were not properly combined with frontend UI settings. Previously, MCP servers defined in config.toml could be overwritten by frontend settings by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9237

## New Contributors
* @ckavili made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9877
* @C9luster made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9840

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.50.0...0.51.0

## 0.50.0 — 2025-07-24

## What's Changed
### Added
* Added Moonshot AI Kimi-K2 model to recommended models by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9706
* Added kimi-k2-0711-preview model to OpenHands provider by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9755
* Added new options to the CLI confirmation dialogs by @VasilisAvgoustakis in https://github.com/All-Hands-AI/OpenHands/pull/9758

### Changed
* Improved the agent’s file management behavior by preventing the creation of multiple similar files with different suffixes by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9741
* Removed the Poetry dependency in the Jupyter Plugin for local runtime by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/9789
* Improved layout and clarity of MCP settings UI by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9771
* Removed the storage of unused content in a cmd observation by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7404
* Persisted alias choices in the CLI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9828

### Fixed
* Fixed navigation to the conversation page after clicking Launch button on task suggestions by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9760
* Resolved an issue where MCP tool timeouts caused the agent to stall indefinitely by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9779
* Fixed incorrect Git provider in the `Push & Create PR` button by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9803
* Fixed the conversation menu closing behavior by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/9822
* Fixed a crash on Windows systems that occurred when searching or listing conversation histories by @bojackli in https://github.com/All-Hands-AI/OpenHands/pull/9732
* Fixed a bug where secret replacement in event streams was corrupting timestamps by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9793
* Updated the agent to use tokens when accessing provider APIs by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9807


## New Contributors
* @bojackli made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9732

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.49.0...0.50.0

## 0.49.0 — 2025-07-16

## What's Changed
### Added
* Added CLI/VSCode integration by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/9085
* Added OpenHands provider for LLM through OpenHands Cloud by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9526
* Introduced new Memory UI feature by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/8592
* Added branch name and git provider on conversation cards by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9480
* Added configuration file path to CLI /settings command by @VasilisAvgoustakis in https://github.com/All-Hands-AI/OpenHands/pull/9481
* Enabled users to edit the conversation's title by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9648
* Added CLI alias setup for first-time users. When users first run the CLI, they'll be offered to create openhands and oh aliases that make it easier to launch OpenHands without typing the full command by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9542

### Changed
* Split the suggested tasks based on the git providers by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9608

### Fixed
* Resolved warnings related to missing ffmpeg by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9500
* Fixed CLI confirmation input to handle invalid input properly by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/9503
* Fixed /init command on CLI Runtime by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/9474
* Addressed WebSocket disconnection when uploading large files by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/9504
* Fixed Jupyter tab display issues by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9533
* Fixed CLI mode ignoring LOG_LEVEL environment variable. Users can now control log verbosity in CLI mode using either LOG_LEVEL=DEBUG or the new --log-level argument by @seiriosPlus in https://github.com/All-Hands-AI/OpenHands/pull/9382
* Fixed compatibility with xAI Grok-4 by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/9666
* Made access to the VSCode tab more reliable by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/966
* Resolved several UI issues throughout the app and added more consistency by @hieptl


## New Contributors
* @TakumaNakao made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9546
* @seiriosPlus made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9382
* @intellectronica made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9597
* @VasilisAvgoustakis made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9481
* @xhguo7 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8515

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.48.0...0.49.0

## 0.48.0 — 2025-07-02

## What's Changed
### Added
* Added support for reading microagents from the user directory (~/.openhands/microagents/) in addition to existing sources by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/9333
* Added support for .cursorrules. It can be placed in the root directory by @AutoLTX in https://github.com/All-Hands-AI/OpenHands/pull/9327
* Added ability to stop conversations by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9458
* Added setup.sh script execution to event stream, allowing users to see when and how the setup script is run by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9427

### Changed
* Made the --file option more interactive and user friendly by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9398
* Disabled Jupyter plugin by default in CLI runtime by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/9452

### Fixed
* Reduced the severity of pending action timeout messages by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9415
* Improved CLI exit messaging by @Adityauyadav in https://github.com/All-Hands-AI/OpenHands/pull/9432
* Added tooltip for `suggested tasks` by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9447
* Updating LLM settings are now applied to existing conversations after stopping and restarting them by @hieptl in https://github.com/All-Hands-AI/OpenHands/pull/9460

## New Contributors
* @Adityauyadav made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9432
* @hieptl made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9442

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.47.0...0.48.0

## 0.47.0 — 2025-06-27

## What's Changed
### Added
* Add new feedback options by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9332
* Add GitLab alternative directory support (openhands-config) for microagents. [See updated documentation](https://docs.all-hands.dev/usage/prompting/microagents-org#usage) by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9331

### Changed
* Changed terminal truncation to trim middle of long outputs instead of suffix by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/9365

### Fixed
* Fix Bitbucket pagination and sorting to fetch all repositories by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/9356

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.46.0...0.47.0

## 0.46.0 — 2025-06-24

## What's Changed
### Added
* Allowed custom model names during CLI model selection by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9205
* Introduced optional vi-style keybindings for confirmation prompts navigating menus (j and k) in the command-line interface. Users can enable this feature by setting the CLI_VI_MODE environment variable to true by @ikuo in https://github.com/All-Hands-AI/OpenHands/pull/9287
* Added support for customizable safety settings for Mistral AI and Gemini models by @Mahdiglm in https://github.com/All-Hands-AI/OpenHands/pull/8802
* Added ability to override the hardcoded system prompt by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9265

### Changed
* Improved timeout behavior for long-running commands by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9140
* Enabled users to provide feedback on agent performance even when the agent encountered errors or was waiting for user input by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9292

### Fixed
* Fixed duplicated Command Action display in CLI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9260

## New Contributors
* @TommasoBendinelli made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9152
* @ikuo made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9287
* @Mahdiglm made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8802
* @2ero20ne made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8986
* @mindflow-cn made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9174

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.45.0...0.46.0

## 0.45.0 — 2025-06-20

## What's Changed

### Added
* **Kubernetes Runtime Support** by @brettstewart in https://github.com/All-Hands-AI/OpenHands/pull/8814
* **File and Image Upload Support** in conversations by @mislavlukach in https://github.com/All-Hands-AI/OpenHands/pull/8945
* **Bitbucket Integration** for local usage by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9021
* **Budget Configuration** per conversation by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8812
* **Japanese Language Support** by @solahsoyalp in https://github.com/All-Hands-AI/OpenHands/pull/9244

### Changed
* **Increased Max Iterations** from 250 to 500 for more complex tasks by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9203
* **Unified Configuration Directory** from ~/.openhands-state to ~/.openhands by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9135
* **Improved Analytics Labels** by @mislavlukach in https://github.com/All-Hands-AI/OpenHands/pull/9161

### Fixed
* **Deprecation Warnings** in CLI and during LLM API calls by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9188, https://github.com/All-Hands-AI/OpenHands/pull/9261
* **Remote Runtime Status Display** by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/9190
* **Microagent Loading** for non-GitHub integrations by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9189
* **Daytona Runtime** sandbox handling by @idagelic in https://github.com/All-Hands-AI/OpenHands/pull/9187
* **Git Ownership Errors** in containers by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9136
* **Server Errors** when accessing conversation trajectories by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9238
* **Token Persistence** for restarted cloud conversations by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9111
* **Empty Image URLs** causing litellm errors by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9214

### Documentation
* **FAQ Documentation** by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/9132
* **Python Version Requirements** for CLI by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9164
* **Ollama Local Serving Guide** by @Truenya in https://github.com/All-Hands-AI/OpenHands/pull/8807
* **uvx Installation Option** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9186
* **"OpenHands with OpenHands" Documentation** for recursive development by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9146

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/v0.44.0...v0.45.0

## New Contributors
* @Truenya made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8807
* @maximevtush made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9145
* @brettstewart made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8814
* @solahsoyalp made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9244

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.44.0...0.45.0

## 0.44.0 — 2025-06-20

## What's Changed

### Added
* **Agent can control whether PRs/MRs opened via Git MCP have draft status** by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9117 
* **Support for evaluation on SWE-bench-Live** by @StarryZhang-whu in https://github.com/All-Hands-AI/OpenHands/pull/9137 - Added support for running evaluations on SWE-bench-Live (https://swe-bench-live.github.io/), which provides the latest issue resolving tasks for more realistic benchmarking
* **Support for dev container networking without host mode** by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9122 - Updated devcontainer configuration and docker-dev setup to enable proper runtime connections without requiring host network mode, improving security and portability
* **Install Slack Integration in Cloud OpenHands from "Integrations" tab in Settings page** by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9162 

### Changed
* **Improved linting coverage** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9131 
* **Updated CLI documentation for API key setup** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9134

### Fixed
* **Fixed broken conversation links in pull request descriptions** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9143 - OpenHands now generates working links in pull request descriptions that allow users to return to the original conversation and continue refining the PR
* **Fixed CLI displaying incorrect default model for Anthropic provider** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9101 - Corrected an issue where the CLI showed "claude-2" as the default model instead of the current default
* **Fixed error in run_localize for issue #9150** by @better629 in https://github.com/All-Hands-AI/OpenHands/pull/9151 - Resolved dependency issues by avoiding optional packages in the base image and installing necessary packages through the extra_deps method
* **Fixed bash timeout issue with interactive git clone prompts** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9148 - Resolved an issue where bash commands would timeout immediately on first run due to git clone operations hanging while waiting for user credentials
* **Fixed incorrect tracking for cost and token usage for main agent and delegates** by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9012  

### Documentation
* **Removed outdated "coming soon" mentions** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9112 - Updated Slack app installation documentation to remove placeholder text
* **Fixed broken link to LLMs section** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9121 - Corrected a broken link in the GUI mode documentation
* **Added secrets manager documentation** by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9084 - New documentation for secrets management in GUI mode

## New Contributors
* @leopardracer made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9058
* @wutong8023 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8221
* @kilavvy made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9129
* @StarryZhang-whu made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9137
* @zeevick10 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9139
* @better629 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9151

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.43.0...0.44.0

## 0.43.0 — 2025-06-20

## What's Changed

### Added
* Slack Integration (Beta) with Cloud OpenHands @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8903
* Example code review microagent by @jpelletier1 in https://github.com/All-Hands-AI/OpenHands/pull/9093

* Microagents UI in conversation context menu, making it easier to understand what specialized knowledge is available in their conversations by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8984
* Support for lower scoped GitLab tokens by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/9017
* JSON serialization for array and object parameters when converting tools by @yeyan1996 in https://github.com/All-Hands-AI/OpenHands/pull/8780

### Changed
* Improved RuntimeStatus handling by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/9050
* Updated CLI settings to save directly under ~/.openhands by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/9079
* Enhanced security by ensuring redirect URI is HTTPS unless it is for localhost by @chuckbutkus in https://github.com/All-Hands-AI/OpenHands/pull/9076
* Changed default provider in CLI to 'anthropic' instead of 'openai' by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/9004

### Fixed
* Workspace directory is no longer hardcoded to /workspace in VS Code by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/9080
* Fixed context window truncation issues by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/9052
* Change docker-dev network configuration to allow the app to reach the runtime by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/9072

### Deprecated
*  Deprecating `ActionMessage` type in favor of types in `frontend/src/types/core` by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/9063

## New Contributors
* @dowithless made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9038
* @jpelletier1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/9093

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.42.0...0.43.0

## 0.42.0 — 2025-06-10

## What's Changed
### Added
* Added new API endpoints that allow users to explicitly start and stop conversations. by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8883
* Added feature flag `VSCODE_IN_NEW_TAB` for opening vscode in a new tab by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8917
* Allowed user to change their email address by @chuckbutkus in https://github.com/All-Hands-AI/OpenHands/pull/8861

### Changed
* Improved WebSocket error handling to provide better reliability and user experience by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8924

### Fixed
* Fixed an issue where new events that arrive during the replay of the event stream for a new connection might not be sent to the client by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8818
* Ensured PRs opened by agent is properly tracked in conversation metadata by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8949
* Increased code quality of resulting resolver PRs by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/8975
* Prevented LLM settings reset when page loses focus during initial setup by @llamantino in https://github.com/All-Hands-AI/OpenHands/pull/8928

## New Contributors
* @iSevenDays made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8889
* @WiseBird made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8987
* @leandermaben made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8677
* @reneleonhardt made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8796

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.41.0...0.42.0

## 0.41.0 — 2025-06-05

## What's Changed
### Added
* Added support for Cloud GitLab Resolver by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8770
* Implemented streamable http mcp by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8864
* Added support on windows without WSL by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/8674

### Changed
* Improved CLI mode setup flow when settings were not found by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8775

### Fixed
* Ensured agent uses MCP tool to open PRs/MRs by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8800
* Fixed LocalRuntime resource leak by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8821
* Fixed GitLab server token validation by @littlebai3618 in https://github.com/All-Hands-AI/OpenHands/pull/8782

## New Contributors
* @llamantino made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8829
* @mingfang made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8839
* @littlebai3618 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8782

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.40.0...0.41.0

## 0.40.0 — 2025-06-01

## What's Changed
### Added
* Enabled OpenHands to use in-house MCP to open PRs/MRs in for Github and Gitlab by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8348
* Incorporated LocAgent into OpenHands by @czlll in https://github.com/All-Hands-AI/OpenHands/pull/7371
* Added first-class search API support to OpenHands by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8638
* Added a dev container setup for development by @kentyman23 in https://github.com/All-Hands-AI/OpenHands/pull/8589
* Added Interactive SWE-Bench benchmark by @XuhuiZhou in https://github.com/All-Hands-AI/OpenHands/pull/8714

### Changed
* Improved visualization for MCP tool usage in the UI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8644

### Fixed
* Fixed an issue where MCP tool names were not properly displayed in the frontend UI when an MCP action was executed by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8623
* Resolved an issue where terminal commands run by the user were showed in the chat by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/8729

## New Contributors
* @czlll made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7371
* @yeyan1996 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8654
* @CoreJa made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8692
* @kentyman23 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8589
* @KianoshArian made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8711
* @Auroral0810 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8693
* @XuhuiZhou made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8714

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.39.1...0.40.0

## 0.39.1 — 2025-05-22

## What's Changed
### Fixed
* Fixed issue where the setup.sh script was not being executed when using the GitHub resolver by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/8548
* Limited the size of browser events by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/8559
* LocalRuntime now implements the SESSION_API_KEY from the environment correctly by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8550
* Fixed MCP fetch tool not being compatible with Gemini by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/8610

## New Contributors
* @jcoffi made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8436
* @luolin101 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7131
* @erkinalp made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8350

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.39.0...0.39.1

## 0.39.0 — 2025-05-20

## What's Changed
### Added
* Added ability to save custom secrets for agent through UI settings by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/8068
* Enhanced API support for nested runtimes, allowing for more flexible and scalable agent deployments by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/8525

### Changed
* Only volumes explicitly mounted to /workspace will be treated as workspace mounts by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8500

### Fixed
* Improved github resolver prompt to confirm that issues were successfully solved by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/8473

## New Contributors
* @omahs made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8469

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.38.0...0.39.0

## 0.38.0 — 2025-05-12

## What's Changed
### Added
* Added self-hosted gitlab or enterprise github host settings for local installation by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8274
* Introduced support for user-defined runners for the resolver by @farovictor in https://github.com/All-Hands-AI/OpenHands/pull/8216
* Added Windows local runtime support with PowerShell by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/7410
* Added the ability for the agent to save browser screenshots as image files by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8383
* Facilitated the integration of custom Agent implementations from arbitrary Python packages via config.toml by @cshimmin in https://github.com/All-Hands-AI/OpenHands/pull/8245
* Added MCP configuration in settings by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8029
* Added support for user/org level microagents by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8402

### Changed
* Simplified workspace mounting with SANDBOX_VOLUMES by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8242

### Fixed
* Resolved GitHub authentication issues in headless mode by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/8341
* Fixed an issue where conversations started with OpenHands API wouldn't generate titles properly by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8292
* Fixed an issue where browsing sometimes would get the agent stuck in a loop by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/8294
* Enabled prompt caching for claude-3.7-sonnet model through OpenRouter by @Polly2014 in https://github.com/All-Hands-AI/OpenHands/pull/8426
* Resolved an issue where the browser tab was not showing the most recent screenshot after browser actions by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8389

## New Contributors
* @kotauchisunsun made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8297
* @farovictor made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8216
* @alienatix made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8340
* @npneeraj made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8229
* @rbrugaro made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8295
* @Polly2014 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8415
* @mulyoved made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8423
* @emmanuel-ferdman made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8432

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.37.0...0.38.0

## 0.37.0 — 2025-05-07

## What's Changed
### Added
* Added helpful tips to Changes tab zero state by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8230
* Added branch picker for repository on homepage by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8259
* Made proactive conversation starters for Cloud Resolver configurable on a per-user basis. Can be toggled in account settings on cloud openhands (enabled by default) by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8272

### Fixed
* Fixed VS Code tab to not reload every time it is selected by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8243
* Fixed cmd+click or ctrl+click to open a new tab for logo and Start new conversation buttons by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8072

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.36.1...0.37.0

## 0.36.1 — 2025-05-05

## What's Changed
### Fixed
* Fixed an issue where the VS Code tab would always use localhost in the URL, causing it to fail when accessing the application remotely. by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8191
* Fixed an issue where memory recall events were not appearing in the UI until after a page refresh by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8196
* Updated the OpenHands API to require only the repo name to start a new conversation by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8159
* Fixed an issue with an infinite LLM loop when a delegated agent returned by @cshimmin in https://github.com/All-Hands-AI/OpenHands/pull/8189
* Made tool call JSON decode errors recoverable by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/8233
* Improved the display of the settings tab by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8240
* Made small tweaks for mobile styles by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8228


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.36.0...0.36.1

## 0.36.0 — 2025-05-01

## What's Changed
### Added
* Added support for agent pause and resume functionality in the CLI by @pandukamuditha in https://github.com/All-Hands-AI/OpenHands/pull/8129
* Added search support for documentation by @Shimada666 in https://github.com/All-Hands-AI/OpenHands/pull/8193

### Changed
* Separated settings into multiple sections by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/7929
* Increased conversation panel limit from 9 to 20 by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8194

### Fixed
* Fixed system and user message missing after emergency handling of context window error by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/8103
* Fixed mobile layout for repo picker and suggested tasks by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/8137
* Ensure only images are uploaded on the frontend by @LoneRifle in https://github.com/All-Hands-AI/OpenHands/pull/8054

## New Contributors
* @hayashikun made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8121
* @SDGLBL made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8148
* @dan1dr made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8165
* @hiroki0525 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8169
* @liuq901 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8174

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.35.0...0.36.0

## 0.35.0 — 2025-04-29

## What's Changed
### Added
* Introduced API keys management UI to the settings page on OpenHands Cloud by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7710
* Added the ability to view and launch suggested tasks for GitLab from the homepage by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8049
* Replaced the workspace tab with a VS Code tab by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/8033
* Enabled support for /new, /status, and /settings in the CLI by @pandukamuditha in https://github.com/All-Hands-AI/OpenHands/pull/8017

### Changed
* Github repos in OpenHands Cloud are sorted by when the repo was last pushed to by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8083
* Simplified the use of microagents: names in the frontmatter are no longer required, only triggers matter for dynamically loaded microagents by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/8114

### Fixed
* Fixed short tool descriptions for o4-mini - less than 1024 tokens by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/8022
* Resolved an issue where comments did not start with the expected error message on the cloud resolver by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8053
* PATs are retained when resetting settings to default values by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8076 by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/8075
* Allow cmd execution after running a background command by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/8093
* Fixed a bug where long-running setup scripts failed to complete due to being interrupted by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/8101

## New Contributors
* @cshimmin made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8021
* @LENSHOOD made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/8058

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.34.0...0.35.0

## 0.34.0 — 2025-04-23

## What's Changed
### Added
* Introduced a new Changes tab to show modifications made by OpenHands by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6934
* Added ability to disable default tools by @MischaPanch in https://github.com/All-Hands-AI/OpenHands/pull/7951
* Enabled custom sandbox for resolver by @Tetsu-is in https://github.com/All-Hands-AI/OpenHands/pull/7612

### Changed
* Updated home screen layout by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/7784
* Restored interactivity to the terminal by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7903
* Implemented branch naming convention in resolver; branches now start with `openhands/` by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7989

### Fixed
* Resolved issue where tokens used by LLM calls weren’t included in trajectory.json and cost/tokens window by @happyherp in https://github.com/All-Hands-AI/OpenHands/pull/7890
* Improved logic to prevent agent from getting stuck by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7897
* Addressed failure of Docker containers to start on Windows  by @happyherp in https://github.com/All-Hands-AI/OpenHands/pull/7722
* Corrected token validation error in GitHub Actions when using the default github.token by @Tei1988 in https://github.com/All-Hands-AI/OpenHands/pull/7934
* Simplified and fixed local runtime initialization by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7997

## New Contributors
* @bashwara made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7886
* @LoneRifle made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7892
* @nielstron made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7201
* @MischaPanch made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7920
* @Tei1988 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7934
* @KennyDizi made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7898
* @alexlitz made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7805
* @Tetsu-is made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7612
* @hamiltop made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7956

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.33.0...0.34.0

## 0.33.0 — 2025-04-16

## What's Changed
### Added
* Added support for MCP servers natively via CodeActAgent by @ducphamle2 in https://github.com/All-Hands-AI/OpenHands/pull/7637
* Added support for GitLab API calling using both OAuth and PAT tokens by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7828
* Added functionality to allow PR type specification for the resolver by @Chocksy in https://github.com/All-Hands-AI/OpenHands/pull/7619
* Added support for GitHub Enterprise and on-prem GitLab in the GitHub Action resolver by @tdeckers in https://github.com/All-Hands-AI/OpenHands/pull/7754

### Changed
* Improved baseline single-pass results for SWE-bench_Verified to 59.6% by @juanmichelini in https://github.com/All-Hands-AI/OpenHands/pull/7546
* Enhanced CLI startup and UI; added interactive commands `/init`, `/help`, and `/exit` by by @pandukamuditha in https://github.com/All-Hands-AI/OpenHands/pull/7801
* Added "think" to the list of handled actions so they are displayed correctly as collapsible elements by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7852
* Converted the Terminal panel from a fixed bottom panel to a tab by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7795

### Fixed
* Fixed a bug where users could provide a base URL without the required protocol (e.g., http:// or https://) when using a model from LiteLLM by @NarwhalChen in https://github.com/All-Hands-AI/OpenHands/pull/7782
* Fixed an issue where the token usage metrics in the frontend displayed only the latest request's token count instead of the total across all requests by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7803
* Fixed the export conversation button not working in Safari by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/7662
* Fixed a bug where the error message "The action has not been executed." was being displayed twice in the chat by by @g-votte in https://github.com/All-Hands-AI/OpenHands/pull/7858

## New Contributors
* @ducphamle2 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7637
* @NarwhalChen made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7782
* @Randonee1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7648
* @Chocksy made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7619
* @sumeetkumar1701 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7788
* @g-votte made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7858
* @tdeckers made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7754

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.32.0...0.33.0

## 0.32.0 — 2025-04-10

## What's Changed
### Added
* Display microagent context in the UI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7566
* The paths of edited files are now displayed in the headline by @happyherp in https://github.com/All-Hands-AI/OpenHands/pull/7530

### Changed
* Enables condensation by default by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/7746
* List GitLab repositories for which you have membership, but may not be the owner by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7682
* Support microagents files without required header by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/7655
* User-friendly UI for a content policy violation error by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/7660
* Prompt agent to follow existing PR template when create new PR by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7698
* Improve the performance of event retrieval in OpenHands, particularly for conversations with a large number of events by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/7667

### Fixed
* Fixed some UI elements not updating after language change by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/7485
* Fix Azure version with the resolver by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7756

## New Contributors
* @samthemagicman made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7663
* @KPCOFGS made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7652
* @pandukamuditha made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7709

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.31.0...0.32.0

## 0.31.0 — 2025-04-02

## What's Changed
### Added
* Turn on vision-based browsing by default and allow OpenHands to see PDF / images in browser by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7457
* Add documentation and LLM support for OpenHands LM by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7598
* Users can configure multiple providers at once (Github + Gitlab) for local OpenHands by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7125

### Changed
* Use LLM-generated natural-language descriptions as conversation title by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7049

### Fixed
* Improvements to the condenser by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/7353
* Prevent OpenHands from creating additional pull requests unless explicitly instructed by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7476
* Better error handling for the resolver by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7584
* Fixed "start from scratch" workflow by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7564
* Fixed setting API key for first-time users by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7654

## New Contributors
* @lociko made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7541
* @happyherp made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7548
* @kjenney made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7586
* @mkusaka made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7589
* @yuchenlin made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7593

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.30.1...0.31.0

## 0.30.1 — 2025-03-27

## What's Changed
### Added
* Support trajectory replay on web app, can be enabled by FEATURE_TRAJECTORY_REPLAY feature flag by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6348

### Changed
* Track accumulated token usage instead of per-request token usage by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7511
* Better startup experience for VSCode by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/7518
* Set max iterations to 250 by default by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7535

### Fixed
* Fixed Github token failing to refresh on OpenHands Cloud by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7532


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.30.0...0.30.1

## 0.30.0 — 2025-03-25

## What's Changed
### Added
* Display API cost and token usage in frontend by @AutoLTX in https://github.com/All-Hands-AI/OpenHands/pull/7099
* Add a config for headless mode to include web screenshots in trajectories by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/7284

### Changed
* Remove download workspace and download files buttons and redirect users to VS Code by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7333
* Remove continue button by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7425
* Remove upload functionality and redirect users to VS Code by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7431
* Auto-generate conversation titles from first user message by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7390
* Reduce bash SOFT timeout from 30 to 10 seconds by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7423
* Updated styles for file explorer by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7453
* Improved UI for interactive browser action by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7452

### Fixed
* Fix issue that was slowing agent responses as the conversation got longer by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7384


## New Contributors
* @zaidsheikh made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7329
* @dynamicwebpaige made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7420
* @SugiKent made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7443
* @vinisdl made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7267

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.29.1...0.30.0

## 0.29.1 — 2025-03-19

## What's Changed
### Added
* feat(microagents): Add security microagent by @h55nick in https://github.com/All-Hands-AI/OpenHands/pull/7323

### Fixed
* Better error messages to users by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/7344
* Better handling of GitHub token refresh by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/7330


## New Contributors
* @jasonburt made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7220
* @h55nick made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7323
* @turian made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7194
* @blacksmith-sh made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7148

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.29.0...0.29.1

## 0.29.0 — 2025-03-18

## What's Changed
### Added
* Add Swift Linux Installation Microagent by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7195
* Make microagents available in the event stream as recall observations (accessible from the UI, LLM) by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6909
* Add TestGenEval benchmark by @kjain14 in https://github.com/All-Hands-AI/OpenHands/pull/5534

### Fixed
* Fix CWD path suggestions for agent from openhands-aci and fix error when reading file with encoding other than utf-8 by @ryanhoangt in https://github.com/All-Hands-AI/OpenHands/pull/7233
* Fix visual browsing by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7278
* Improve the stability of OpenHands application and evaluation harness by retry on ConnectionError by default by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7294


## New Contributors
* @answer-huang made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7114
* @AutoLTX made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7082
* @juanmichelini made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7221
* @tchewik made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7214
* @kjain14 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5534

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.28.1...0.29.0

## 0.28.1 — 2025-03-10

## What's Changed
### Changed
* Restyle toasts by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6854

### Fixed
* Fix infinite loop when condensing messages by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7132
* Improve agent loop tracking by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6945
* Change back the runtime binding address to 0.0.0.0 by @mamoodi in https://github.com/All-Hands-AI/OpenHands/pull/7161


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.28.0...0.28.1

## 0.28.0 — 2025-03-07

## What's Changed
### Added
* Add sound and browser notifications for agent state changes by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6530
* Added a new microagent template system that helps users create properly structured domain-specific agents by @jaybutera in https://github.com/All-Hands-AI/OpenHands/pull/6891
* Add a "thinking" tool to CodeAct agent by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6977
* Allow OpenHands to run docker inside its own runtime by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7027
* Allow OpenHands to start a kubernetes cluster by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/7028
* Add the option of structured logging in JSON for better observability. You can turn this on by setting the LOG_JSON environment variable by @raymyers in https://github.com/All-Hands-AI/OpenHands/pull/7034

### Changed
* Update context window exceeded detection by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/7024
* Default version of Claude is now claude-3-7-sonnet-20250219 by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/7072

### Fixed
* Truncate long conversation card titles by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/7001
* Specify which network interface on the host machine Docker should bind the runtime ports to by @fredysierra in https://github.com/All-Hands-AI/OpenHands/pull/6992
* Fix for `tool_choice` error on OpenAI models by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/7045
* Resolver correctly validates GitHub Actions tokens, allowing workflows to run without additional token setup by @tawago in https://github.com/All-Hands-AI/OpenHands/pull/7065

## New Contributors
* @jaybutera made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6891
* @magic3007 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6536
* @kiwamizamurai made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7037
* @Pepsi1x1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6778
* @tawago made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7065
* @kinza99 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/7092

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.27.0...0.28.0

## 0.27.0 — 2025-02-27

## What's Changed
### Added
* Add an "extended" section to config.toml, allowing random user-defined keys to be set on the fly by @celek in https://github.com/All-Hands-AI/OpenHands/pull/5932
* Allow selecting the Claude 3.7 model from via the Anthropic provider by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6931
* Allow advanced users to define their own custom runtimes by @raymyers in https://github.com/All-Hands-AI/OpenHands/pull/6955

### Changed
* Changed the UI to have consistent colors by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6835

### Fixed
* Fix prompt extensions matching on the first user message by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6963

## New Contributors
* @celek made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5932

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.26.0...0.27.0

## 0.26.0 — 2025-02-24

## What's Changed
### Added
* Add ability to use CLI with a task to execute automatically by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6260 by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6187
* Enable memory condensation from settings page by @csmith49 in https://github.com/All-Hands-AI/OpenHands/pull/6868
* Adds support for a [Daytona](https://www.daytona.io/) runtime to manage sandboxes by @idagelic in https://github.com/All-Hands-AI/OpenHands/pull/6863

### Changed
* By default, OpenHands truncates history by half when it hits LLM context limit. by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6820
* Condensers keep the first user message by default by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6888

### Fixed
* Fix error on Azure for unsupported max_completion_tokens by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6806


## New Contributors
* @dai-dao made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6850
* @idagelic made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6863
* @mateuszkwiatkowski made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6876

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.25.0...0.26.0

## 0.25.0 — 2025-02-19

## What's Changed
### Added
* Gitlab support for OpenHands resolver by @wtiger9218 in https://github.com/All-Hands-AI/OpenHands/pull/6458
* New multi conversation navigation allowing users to navigate between different conversations by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6374

### Changed
* New Settings screen by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6550
* Better filtering of sensitive data from logs by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6755

### Fixed
* Better error when LLM settings do not exist by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6704
* Fix download workspace zip file event loop hanging by @diwu-sf in https://github.com/All-Hands-AI/OpenHands/pull/6722

## New Contributors
* @wtiger9218 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6458
* @kripper made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6695
* @arpandaze made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6752
* @nbyidiandian made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6744
* @nottherealironman made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6575

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.24.0...0.25.0

## 0.24.0 — 2025-02-13

## What's Changed
### Added
* Add comprehensive error logging to PostHog by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/6346
* Add success/failure indicators for file read/edit operations by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/6653
* Preliminary/experimental support for running OpenHands without docker by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5284

### Changed
* Optimize memory usage in FileEditObservation by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/6622

### Fixed
* Fixed issue where GITHUB_TOKEN would go missing by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/6533
* Fix memory leak in JSON encoder by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/6620
* Limit resource usage of command to avoid OOM Runtime Kill by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6338
* Fix public github repo cannot be selected by @xyeric in https://github.com/All-Hands-AI/OpenHands/pull/6680
* Fixed an issue where temporary files could end up empty when copying files in the action execution client by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6669


## New Contributors
* @Aktsvigun made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6610
* @PeterDaveHello made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6621
* @zchn made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6658
* @fredysierra made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6672
* @xyeric made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6680

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.23.0...0.24.0

## 0.23.0 — 2025-02-04

## What's Changed
### Added
* Show LLM retries as they happen and allow resume from Rate-Limited state by @raymyers in https://github.com/All-Hands-AI/OpenHands/pull/6438
* Support o3-mini by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6570

### Fixed
* Filtering lost+found directory from root of workspace by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6487
* Fix some situations where conversations could not be resumed after an agent error by @raymyers in https://github.com/All-Hands-AI/OpenHands/pull/6549
* Better error toast handling mechanism by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6561


## New Contributors
* @ryanpeach made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6507
* @wolph made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6582

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.22.0...0.23.0

## 0.22.0 — 2025-01-29

## What's Changed
### Added
* Support for VisualWebArena evaluation in OpenHands by @adityasoni9998 in https://github.com/All-Hands-AI/OpenHands/pull/4773

### Changed
* Improved performance of GitHub API integration by using modern async HTTP client by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6325
* Remove redis dependency from OpenHands by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6278

### Fixed
* Display confirmation buttons when using confirmation mode by @zxh3 in https://github.com/All-Hands-AI/OpenHands/pull/6426
* Fix resolver crash when the project's requirements.txt doesn't end in a newline by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/6327
* Fix for continuing sessions, which would originally result in a `session_was_closed` error by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6478
* Fix DeepSeek error on consecutive user messages by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6471
* Prevent chat message from overflowing when the continuous text is long by @jcppman in https://github.com/All-Hands-AI/OpenHands/pull/6421

## New Contributors
* @mjewell made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6423
* @chuckbutkus made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6375
* @zxh3 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6435
* @jcppman made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6421

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.21.0...0.22.0

## 0.21.0 — 2025-01-22

## What's Changed
### Added
* Add multiple languages by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/6070
* The [reasoning_effort parameter](https://platform.openai.com/docs/api-reference/chat) can be defined for the o1 family by @AlexCuadron in https://github.com/All-Hands-AI/OpenHands/pull/6256
* Users can now define a different LLM as a custom LLM config named with a predefined name: draft_editor. To use it for edit drafts, you can, as before, set the agent option to use llm editor (codeact_enable_llm_editor) by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6281
* Add trajectory replay feature for headless mode by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6215
* Add a button on chat panel that allows the user to download current trajectory by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6378

### Changed
* Rename trajectories_path config to save_trajectory_path by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6216
* Restore fallback to defaults for custom LLM configurations by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4415
* Improve the handling of multiple conversations and session management in OpenHands by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6322
* Better handling of long running commands and interactive commands by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6280
* When connecting to a GitHub repo, the agent now explicitly knows which repo was cloned and where it's located by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6057

### Fixed
* Fixed agent delegation and fixed the lockup when the model returns a message instead of a tool call by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6165
* Fixed the issue with microagent loading when directory paths have trailing slashes by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6239
* Better error messages when UI is disconnected from backend by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6323
* Static Assets are not rate limited by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6360
* Keeping runtimes alive again by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6395

## New Contributors
* @oconnorjoseph made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6243
* @Honyii made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6178
* @kadykov made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6330
* @mannaandpoem made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6315
* @louria made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6385

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.20.0...0.21.0

## 0.20.0 — 2025-01-13

## What's Changed
### Added
* Display current conversation info in the bottom right by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6143
* Added new `App` tab which allows users to interact with the web app run in OpenHands (Beta) @amanape in https://github.com/All-Hands-AI/OpenHands/pull/5577

### Fixed
* Fix potential issue with loading history twice by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6089
* Support custom base container image when running OpenHands in Docker by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/6039
* Make the logs inside the runtime container optional (DEBUG_RUNTIME env var to set) by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/6141
* Fixed UI terminal output by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6182
* Fixed a race condition that could cause server errors when disconnecting sessions, improving server stability by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6053
* Multiple bash improvements by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/6175
* Fixes for minor cases where FDs were not closed by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6228

## New Contributors
* @raymyers made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6101
* @jmtatsch made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6203

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.19.0...0.20.0

## 0.19.0 — 2025-01-07

## What's Changed
### Added
* Custom microagents are now supported in headless and CLI modes by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5971
* Enable/disable function calling by user configuration by @young010101 in https://github.com/All-Hands-AI/OpenHands/pull/5992
* Added RateLimitError status on UI and Agent state by @rkat7 in https://github.com/All-Hands-AI/OpenHands/pull/5910
* Enable Multi Conversation Feature behind feature flag by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/6011
* Add runtime size configuration feature by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/5805

### Changed
* Restructure microagents system by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5886
* Developer mode now defaults to storing data on the filesystem instead of in-memory, to help LLM settings persist by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6016
* Replace pexpect with libtmux in BashSession by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4881

### Fixed
* OpenHands will now default to opening draft PRs, and is better about not opening multiple PRs by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5986
* Performance improvement of UI during long sessions by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/6006
* Fixes an issue where long repository names would cause layout issues in the project menu card by @mkwatson in https://github.com/All-Hands-AI/OpenHands/pull/6091
* Fixed file upload, especially for large zip files by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/6126


## New Contributors
* @siu-issiki made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6025
* @rkat7 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5910
* @plutack made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6026
* @stefand678 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6043
* @dkozlov made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6076
* @mkwatson made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/6091

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.18.0...0.19.0

## 0.18.0 — 2025-01-02

## What's Changed
### Added
* Documented the new .openhands directory for customizing prompts for individual repositories by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5821
* Added tooltips for navbar by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5807
* Add resizable and collapsible panel layout by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5926

### Changed
* Migrate settings storage from localStorage to server API by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5703
* Allow downloading workspace on phones / browsers where the DirectoryAPI is not available by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5770
* Add loading spinner to task form during conversation creation by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5828
* Remove file editing functionality from OpenHands UI by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5823

### Fixed
* Fixed images not being rendered in the chat interface by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/5626
* Minor style fixes for the navbar by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5780
* In headless mode, make OpenHands finish a task if it thinks the task is finished by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/5879
* Fix cases where a RuntimeError can leave the agent history in an inconsistent stateby @enyst in https://github.com/All-Hands-AI/OpenHands/pull/5666
* Fix history loading when state was corrupt or not saved properly by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/5946

## New Contributors
* @ScottBrenner made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5742

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.17.0...0.18.0

## 0.17.0 — 2024-12-26

## What's Changed
### Added
* Add support for custom PR titles for the resolver by @d-walsh in https://github.com/All-Hands-AI/OpenHands/pull/5706
* Add TheAgentCompany evaluation harness by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/5731
* Show most recent convo on homepage by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5769

### Changed
* Settings store type is defined in openhands_config rather than main config by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5701
* More informative failures in the resolver by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/5685
* Each conversation now gets its own URL by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5493

### Fixed
* Frontend Hyperlink in Chat window should open link in a new tab by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5677

## New Contributors
* @d-walsh made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5706

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.16.1...0.17.0

## 0.16.1 — 2024-12-19

## What's Changed
### Added
* Implement file-by-file download with progress by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5008

### Changed
* Infrastructure for saving config on the backend rather than the frontend by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5594

### Fixed
* Agent gets stuck in closing and server won't die by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5675
* Fixed pagination on repository picker by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/5687

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.16.0...0.16.1

## 0.16.0 — 2024-12-18

## What's Changed
### Added
* Changes to Github Authentication by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/5371

### Fixed
* Fixed an issue where sessions sometimes don't close properly, causing memory and FD leaks by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5656
* Minor fixes for status messages in the chat window by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5650


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.15.3...0.16.0

## 0.15.3 — 2024-12-17

## What's Changed
### Added
* Add color to the line next to `Ran a Command` based on return value by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5483

### Changed
* Reset iteration budget and update default max_iterations to 500 by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5590
* The turn limit should be measured from the last user interaction by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5560
* Persist jwt_secret in config file by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5353

### Fixed
* Prevent VSCode from opening unexpectedly by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/5544
* Let user continue when the agent gets stuck in a loop (UI-only) by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/5597
* Fixed Jupyter tab has no vertical scroll bar by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5607

## New Contributors
* @motin made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5624

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.15.2...0.15.3

## 0.15.2 — 2024-12-12

## What's Changed
### Added
* Custom MicroAgents can now be added directly to the connected workspace by @RajWorking in https://github.com/All-Hands-AI/OpenHands/pull/4983
* Request code review from the person who initiated the resolver by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5451
* Add browser observations to chat interface by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5514

### Fixed
* Improve error message when issue/PR not found in resolver by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/5455
* Fix duplicate search messages in web browsing actions by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5511
* Make layout responsive for mobile devices by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5475
* Fix for issue where double scroll hides save button by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5488
* Better error handling for commands that timeout or kill the runtime by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5518
* Fixed issue where session data is lost on refresh by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5516

## New Contributors
* @regismesquita made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5278

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.15.1...0.15.2

## 0.15.1 — 2024-12-06

## What's Changed
### Added
* A message is shown every time the agent runs a command by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5190
* Add support for multiline user messages, and default user message when running headless by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/5400

### Changed
* Only send the last agent state changed event on init by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5411
* Updated initial Sign in with Github modal by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/5416

### Fixed
* Prioritize version from pyproject.toml over importlib by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5412
* Fix for some agent messages not appearing by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/5421
* Fix duplicate events on re-initialize by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5424

## New Contributors
* @STF-Zero made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5379

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.15.0...0.15.1

## 0.15.0 — 2024-12-04

## What's Changed
### Added
* Using SocketIO as the Underlying Communication Protocol by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5056
* Add BrowseURLAction to CodeAct by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5285
* Added Alignment checker for browsing agent by @s-aniruddha in https://github.com/All-Hands-AI/OpenHands/pull/5105
* Support custom sandbox for resolver by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/5348
* Added a microagent to handle timeout issues with npm by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/5314

### Changed
* Migrate from Remix to React Router 7 by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/5304
* Do not keep runtimes alive by default by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5288
* Multiple tabs can now connect to the same session by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5370

### Fixed
* Fix for issue where exit session intermittently does not return to splash by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5291
* When an invalid token error occurs, a message is displayed in the UI by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/5302
* Fixed an issue with setting runtime_extra_deps by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5330
* Fixed resolver not finding issue with empty description by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5357
* Fixed Asyncio issues with security analyzer by @mbalunovic in https://github.com/All-Hands-AI/OpenHands/pull/5356


## New Contributors
* @s-aniruddha made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5105

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.14.3...0.15.0

## 0.14.3 — 2024-11-26

## What's Changed
### Added
* Added commit0 benchmark by @nanjiangwill in https://github.com/All-Hands-AI/OpenHands/pull/5153
* Added a new `Push & Create PR` button by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/5181

### Changed
* Set server process to run with highest system priority by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/5206

### Fixed
* Fixed an issue when using an LLM from OpenRouter by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/4822

## New Contributors
* @diwu-sf made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5180
* @nanjiangwill made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5153

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.14.2...0.14.3

## 0.14.2 — 2024-11-21

## What's Changed
### Changed
* Put some liberal rate limiting in place by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4976

### Fixed
* Fix 400 error on HuggingFace models and KeyError on multiple LLMs by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/5026


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.14.1...0.14.2

## 0.14.1 — 2024-11-19

## What's Changed
### Added
* Add push to Github action button in chat interface by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4993

### Fixed
* Multiple fixes and improvements to the OpenHands resolver by @ryx2 and @malhotra5

## New Contributors
* @ryx2 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5063
* @young010101 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5117

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.14.0...0.14.1

## 0.14.0 — 2024-11-15

## What's Changed
### Added
* Add VSCode to OpenHands runtime and UI by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4745
* Integrate OpenHands resolver into main repository by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/4964
* Add a general utility that automatically converts function-calling LLM requests to non-function-calling LLM requests by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4711

### Fixed
* Allow continuation after reaching max iterations by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4949
* If the websocket disconnects, we try 5 times to automatically reconnect it by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4954
* Truncate agent history when context window is exceeded by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4977
* Fix agent crash when terminal commands are sent and function calling is enabled by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4955

## New Contributors
* @csmith49 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4943
* @ketan1741 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/5000

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.13.1...0.14.0

## 0.13.1 — 2024-11-12

## What's Changed
### Added
* Support displaying images/videos/pdfs in the workspace by @malhotra5 in https://github.com/All-Hands-AI/OpenHands/pull/4898

### Changed
* Better support for pushing changes to GitHub by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4568
* Restore visible logs for each action and observation when ran locally by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4729

### Fixed
* Fixed running with bedrock by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4935
* Fixed runtime restarting when multiple tabs connected to the same session,or tab was closed by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4900

## New Contributors
* @ross-rl made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4598
* @nafisreza made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4850
* @Mr-Imperium made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4878

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.13.0...0.13.1

## 0.13.0 — 2024-11-08

## What's Changed
### Added
* Add the ability to drag images into chat input by @xingyaoww (and @openhands-agent!) in https://github.com/All-Hands-AI/OpenHands/pull/4762
* Show a loading indicator when downloading a zip by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4833

### Changed
* Overhaul of error handling and reporting by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4575
* New chat interface empty state by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4737
* Modified agent instructions to include fewer redundant comments in the code it generates by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4681

### Fixed
* Fixed a bug where docker containers were not removed on session close by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4765
* Fixed terminal not working by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4800
* Fix Jupyter tab overflow by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4818
* Fixed copy paste into chat input by @openhands-agent in https://github.com/All-Hands-AI/OpenHands/pull/4832

## New Contributors
* @danicruz0415 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4464

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.12.3...0.13.0

## 0.12.2 — 2024-11-04

## What's Changed
### Added
* Analytics with PostHog by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4655
* Allow CodeAct agent to perform web browsing by itself (no more delegation to BrowsingAgent) by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4667
* DiscoveryBench OpenHands Integration by @Ethan0456 in https://github.com/All-Hands-AI/OpenHands/pull/4627

### Fixed
* Fixed issue running on Linux by @Polygons1 in https://github.com/All-Hands-AI/OpenHands/pull/4721
* Fix error in the main agent when a browsing agent task fails by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4728

## New Contributors
* @ronch99 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4645
* @malhotra5 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4712
* @Polygons1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4721

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.12.1...0.12.2

## 0.12.0 — 2024-10-31

## What's Changed

This release contains improvements that allow OpenHands to score **53%** on [SWE-Bench](https://www.swebench.com/) Verified & **41.7%** on [SWE-Bench](https://www.swebench.com/) Lite, making it the best OSS AI SWE system now: https://github.com/swe-bench/experiments/pull/97 

### Added
* Add function calling to CodeAct 2.1 by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4537
* Display error messages in the chat by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4509
* Support prompt caching on the latest `claude-3-5-sonnet-20241022` by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4552

### Changed
* Pared down the backend logging to make it less verbose and more informative by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4563

### Fixed
* Split bash commands by the new line character by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4462
* Bugfix for loading the `/app` page directly by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4547
* Fix for connection leak by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4560
* Fix for crash on some models on OpenRouter by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4641
* Fix compatibility for models like llama on Groq that don't support vision or tools by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4644

## New Contributors
* @msehsah1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4580

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.11.0...0.12.0

## 0.11.0 — 2024-10-22

## What's Changed
### Changed
* Improvements to Agent Editing using LLM by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3985

### Fixed
* Fixed unlimited retries when queries are blocked by CloudFlare by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/4482
* Better frontend error handling for failed requests by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/4501


**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.10.0...0.11.0

## 0.10.0 — 2024-10-17

## What's Changed
### Added
* New OpenHands Ul by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/3604
* Add Modal sandbox support as a new runtime by @pawalt in https://github.com/All-Hands-AI/OpenHands/pull/4133

### Changed
* Display in the logs the prompt cache hit or miss for Deepseek Chat by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4343

### Fixed
* Multiple improvements to the reliability of Remote Runtime by @xingyaoww
* Multiple improvements to the SWE-Bench evaluation by @xingyaoww
* Lockup Resiliency and Asyncio Improvements by @tofarr
* Fix browsing agent parsing responses by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4226
* Fix AgentDelegateAction to send only the task to the delegate agent, not the main agent by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4327
* Fix syntax error in the browsing agent @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4354

## New Contributors
* @Vaishakh-SM made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4177
* @amantyagiprojects made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4229
* @adityasoni9998 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4100
* @AlexCuadron made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4244
* @JeevaRamanathan made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4240
* @klieret made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4390
* @pawalt made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4133
* @Ethan0456 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4364

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.8...0.10.0

## 0.9.8 — 2024-10-03

## What's Changed
### Added
* Allow specification of config.toml location via args by @rehanganapathy in https://github.com/All-Hands-AI/OpenHands/pull/4168

### Fixed
* Better error messages when sessions fail to start by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4134
* SigTerm now gracefully shuts down the server during startup by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4155
* Improve the docker runtime build speed & fix issues in build by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/4154

## New Contributors
* @rehanganapathy made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4168

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.7...0.9.8

## 0.9.7 — 2024-09-30

## What's Changed
### Fixed
* Bash commands do not block the main runtime by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4058
* Vision and prompt caching fixes by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/4014

## New Contributors
* @openhands-agent made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4104
* @anthrocypher made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4091

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.6...0.9.7

## 0.9.6 — 2024-09-30

## What's Changed
### Fixed
* Better handling of task cancellation by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4075
* Fixed terminal getting cleared on session resume  by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/4074

## New Contributors
* @jaki300 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3795
* @micky-amir made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/4060

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.5...0.9.6

## 0.9.5 — 2024-09-26

## What's Changed
### Added
* More granular messages displayed on the UI during startup by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3771

### Fixed
* Display full model name in Settings UI (#3900) by @iaavas in https://github.com/All-Hands-AI/OpenHands/pull/3991
* Multiple improvements to evaluation by @xingyaoww 
* Fixed an issue where Base URL was not getting reset in Settings by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4037
* Fix persistence of `Advanced Settings` when re-opening the Settings by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/4038
* Fixed an issue with the o1-mini model by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/4012
* Fixed server lock up during session initialization by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/4007
* CodeActAgent responds to user cancellation by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3968

## New Contributors
* @iaavas made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3991

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.4...0.9.5

## 0.9.4 — 2024-09-20

## What's Changed
### Added
* Add --version to cli by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3924

### Changed
* Reduced safety thresholds for Gemini by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3925

### Fixed
* Improved detecting syntax error loops by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3663
* Multiple evaluation fixes by @xingyaoww
* Improvements to timeout and interrupt conditions by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3926
* Fix UID management for ubuntu users by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/3937


## New Contributors
* @qiangli made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3911

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.3...0.9.4

## 0.9.3 — 2024-09-13

## What's Changed
### Added
* Support interactive commands by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/3653

### Changed
* Redesign of the settings modal by @rbren and @amanape
* Make prompt caching optional instead of enabled default by @WannaTen in https://github.com/All-Hands-AI/OpenHands/pull/3689

### Fixed
* Fix issues with vision support in prompts by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3665
* Improve rate limit error handling by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3729
* Fixed prompt caching in CodeActAgent by @ColeMurray in https://github.com/All-Hands-AI/OpenHands/pull/3773

## New Contributors
* @defineprogramming made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3706
* @ColeMurray made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3775

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.2...0.9.3

## 0.9.2 — 2024-09-04

## What's Changed
### Changed
* Improve system prompt to reduce file editing errors made by LLM by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3610

### Fixed
* Better syntax error loop detection by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3628
* Fix a global step count out-of-sync bug when delegated agent fails by @li-boxuan in https://github.com/All-Hands-AI/OpenHands/pull/3680
* Fix confirmation mode by @mbalunovic in https://github.com/All-Hands-AI/OpenHands/pull/3695
* Files display updated content after agent edit by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/3694
* CodeActAgent recovers upon a llm completion exception by @shubhamofbce in https://github.com/All-Hands-AI/OpenHands/pull/3678
* Anthropic provider points to the correct LiteLLM model ID by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/3715

## New Contributors
* @shubhamofbce made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3621
* @mbalunovic made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3695

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.1...0.9.2

## 0.9.1 — 2024-08-29

## What's Changed
### Added
* Add CLI mode by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/3564
* Add prompt caching to CodeActAgent (Sonnet, Haiku only) by @Kaushikdkrikhanu in https://github.com/All-Hands-AI/OpenHands/pull/3411
* Specialize CodeAct into micro agents by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3511

### Changed
* Improved model selection in the settings by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/3530
* Multiple improvements to Aider-Bench by @tobitege and @RajWorking

### Fixed
* Stop exposing API key in evaluation outputs by @RajWorking in https://github.com/All-Hands-AI/OpenHands/pull/3603
* Better startup handling and logging for more user clarity by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3645
* EventStreamRuntime will wait for runtime client to be initialized once, for up to 10s by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3612

## New Contributors
* @WannaTen made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3647

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.9.0...0.9.1

## 0.9.0 — 2024-08-23

## What's Changed

### Added
* Implement `copy_to` for Runtime by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3211
* Enhance the LLM class with async support by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3202
*  Add Vision Input Support for LLM with Vision Capabilities by @Kaushikdkrikhanu in https://github.com/All-Hands-AI/OpenHands/pull/2848
* Support the ability to specify whether to keep prompt for CmdRun by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3218
* Allow injecting additional dependency to OD runtime docker image by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3237
* Clear history at the beginning of a new task🧹 by @mkavinkumar1 in https://github.com/All-Hands-AI/OpenHands/pull/3285
* Collapsible resizers in the UI by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3330
* Add Security Analyzer functionality by @adrgs in https://github.com/All-Hands-AI/OpenHands/pull/3058
* Integrate Aider Benchmark by @RajWorking in https://github.com/All-Hands-AI/OpenHands/pull/3507
* Add error observations to codeact SWE by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/3392
* Print a warning message when a config has an unknown key by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3428
* Include guide for OpenAI LLMs by @amanape in https://github.com/All-Hands-AI/OpenHands/pull/3552
* Agent to accept agent config by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/3430

### Changed
* Rename OpenDevin to OpenHands by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/3472
* Switch default runtime to EventStream Runtime by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3271
* Tweaks to chat message CSS stylings for lists by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3449
* Copy manifest file into the app container by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3396
* Convert agent prompts into structured Jinja2 templates by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3360
* Handle error observations in codeact by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/3383
* Show exact python interpreter to the agent in IPython and Bash by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3448

### Fixed
* Add pip to the runtime by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3306
* Minor UI fix to workspace UI by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3328
* Correct list rendering for chat window by @sb-git-cloud in https://github.com/All-Hands-AI/OpenHands/pull/3273
* Workspace folder permission & app container cannot access client API by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3300
* Metrics should be updated when agent reaches max iterations. by @RajWorking in https://github.com/All-Hands-AI/OpenHands/pull/3549
* Fix restore cli sessions by @enyst in https://github.com/All-Hands-AI/OpenHands/pull/3409
* Bump max iterations when resuming due to throttling by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3410
* Custom runtime image won't work for go by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3464
* App docker permission issue by @xingyaoww in https://github.com/All-Hands-AI/OpenHands/pull/3427
* Show workspace UI even if no files exist by @rbren in https://github.com/All-Hands-AI/OpenHands/pull/3213
* EventStreamRuntime: fix config passing on init (fixes test_runtime.py errors) by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3233
* Exclude Python cache files/folders from sdist by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3381
* Better error handling for RuntimeClient by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3400
* Fix typing for fake user response function by @neubig in https://github.com/All-Hands-AI/OpenHands/pull/3438
* Fix error when workspace has spaces in path by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3547
* Prevent 500 server error on a just removed folder when listing files by @tobitege in https://github.com/All-Hands-AI/OpenHands/pull/3553
* Unsaved content is not lost in the UI by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3358
* Allow easier copy paste into the terminal by @tofarr in https://github.com/All-Hands-AI/OpenHands/pull/3484

## New Contributors
* @Kaushikdkrikhanu made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/2848
* @mkavinkumar1 made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3285
* @Ma-hawaj made their first contribution in https://github.com/All-Hands-AI/OpenHands/pull/3495

**Full Changelog**: https://github.com/All-Hands-AI/OpenHands/compare/0.8.3...0.9.0

## 0.8.3 — 2024-08-01

## What's Changed
* [Agent, LLM] Make sure codeact agent produce message in u/a/u/a order by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3193
* [Arch] Test `EventStreamRuntime` to ensure its feature parity with `ServerRuntime` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3157
* (Docker) Fix passing of POETRY_CACHE_DIR into RUN command by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3163
* (Eval) Apply config arguments for miniwob ssh box if None is passed by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3198
* Feat: Dev Container for GitHub Codespaces by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2689
* Fix swe-bench sandbox config parameter by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3189
* (fix) test_runtime.py parametrization for box_class by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3186
* (fix) Remove unneeded message about config file not found by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3158
* Fix: Add missing arguments for SSHBox in evaluation by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/3075
* Fix: Parse exit code correctly for background commands by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/3161
* (fix) tests: temp_dir fixture fix in 4 tests by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3160
* [docs] Update README.md for new OpenDevin Runtime by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3142
* (docs) Update custom sandbox guide: added nikolaik image consideration by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3197
* [Runtime] Reduce dependency to speed up CI and reduce image size by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3195
* Clear last_error when restoring a session by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3146
* Fix max budget per task error in headless mode by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3147
* Finish action is missing from the prompt by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3149
* Migrate multi-line-bash-related sandbox tests into runtime tests and fix multi-line issue by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3128
* Add toggle to enable/disable agent selection - default is agent selection is off by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/3174
* Add unit tests for LLM init function by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3188
* Rename to UserRejectObservation by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3175
* Remove the use of realpath when the file doesn't exist by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3200
* Chore: Add line breaks in pull_request_template.md by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2988
* chore: Release 0.8.2 by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/3150
* chore(deps): bump litellm from 1.42.3 to 1.42.5 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3167
 chore(deps-dev): bump pre-commit from 3.7.1 to 3.8.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3168
* chore(deps-dev): bump husky from 9.1.2 to 9.1.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3166
* chore(deps): bump @reduxjs/toolkit from 2.2.6 to 2.2.7 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3164
* chore(deps-dev): bump @types/node from 20.14.12 to 22.0.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3165
* chore(deps): bump boto3 from 1.34.149 to 1.34.150 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3182
* chore(deps-dev): bump husky from 9.1.3 to 9.1.4 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3179
* chore(deps-dev): bump @typescript-eslint/parser from 7.17.0 to 7.18.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3180
* chore(deps-dev): bump mypy from 1.11.0 to 1.11.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3190
* chore(deps): bump boto3 from 1.34.150 to 1.34.151 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3191
* chore(deps-dev): bump @types/node from 22.0.0 to 22.0.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3205


**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.8.2...0.8.3

## 0.8.2 — 2024-07-27

## What's Changed

* [Eval,Arch] Update GPTQ eval and add `headless_mode` for Controller by @xingyaoww in 
* [eval,fix]: metrics get carried across eval instances by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3072
* [Eval] Support SWE-Bench pull from custom docker namespace by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3136
* [Arch] Shrink runtime image size by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3051
* [Arch] Add runtime image build CI & clean up runtime build using `jinja2` template by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3055
* CI: Force stop colima by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/3053
* [FIX] Update SWEBenchSSHBox after global config was removed from sandbox. by @RajWorking in 
* fix: add llm `drop_params` parameter to LLMConfig by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2471
* (fix) colima: use a docker context specific to runner; prevent duplicate start by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3097
* Bug fix: Metrics not accumulated across agent delegation by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/3012
* fix: Remove extra arg from swebench ssh box by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3054
* (fix) fixed ghcr_push use of image name by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3101
* (fix) Runtime yml missing zip handling (fixes #3101) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3104
* (fix) ghcr-runtime: no unzip, artifact downloads as-is (followup to #3104) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3105
* fix: make max_budget_per_task optional in `run_agent_controller` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3071
* Fix: revert torch version by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/3118
* (fix) test_runtime: run tests per runtime, not alternating by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3103
* (fix) colima: fix return code handling (followup to #3097) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3106
* fix (ghcr push): add missing extension by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3120
* fix (ghcr-runtime): fix filename for docker image tar by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3121
* (fix) Fix DummyAgent (used in E2E test) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3137
* Fix(test,CI): runtime build tests by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3126
* [Docs] fixed broken shell command by @tolik518 in https://github.com/OpenDevin/OpenDevin/pull/3135
* refactor: rename 'changeAgentState' Issue#2977 by @DecodersLord in https://github.com/OpenDevin/OpenDevin/pull/3050
* (test|refactor)(frontend): Refactor and test the `FileIcon` component by @amanape in https://github.com/OpenDevin/OpenDevin/pull/3108
* Remove monologue agent by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3036
https://github.com/OpenDevin/OpenDevin/pull/3014
* Remove config from files by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3039
https://github.com/OpenDevin/OpenDevin/pull/2994
* Update Dockerfile casing by @charliez0 in https://github.com/OpenDevin/OpenDevin/pull/3045
* Remove global config from tests by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3052
* Removed config from agent controller by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3038
* Validate to_replace in edit_file_by_replace AgentSkill by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/3073
* Modify codeAct paper link by @linshaoxin-maker in https://github.com/OpenDevin/OpenDevin/pull/3076
* Change doc title of agent hub by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3100
* Update paper link in README.md by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3102
* Remove remaining global config by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3099
* Always log user messages by @enyst in https://github.com/OpenDevin/OpenDevin/pull/3145
* chore-icon-transparency by @tofarr in https://github.com/OpenDevin/OpenDevin/pull/3138
* chore: Release 0.8.1 by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/3035
* chore(deps): bump @nextui-org/react from 2.4.3 to 2.4.5 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3021
* chore(deps-dev): bump openai from 1.35.13 to 1.36.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3033
* chore(deps): bump uvicorn from 0.30.1 to 0.30.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3062
* chore(deps-dev): bump mypy from 1.10.1 to 1.11.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3066
* chore(deps): bump react-use from 17.5.0 to 17.5.1 in /docs by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3063
* chore(deps-dev): bump eslint-plugin-react from 7.34.4 to 7.35.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3060
* chore(deps-dev): bump jsdom from 24.1.0 to 24.1.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3057
* chore(deps-dev): bump openai from 1.36.0 to 1.36.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3069
* chore(deps): bump litellm from 1.41.24 to 1.41.25 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3064
* chore(deps-dev): bump pytest from 8.2.2 to 8.3.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3065
* chore(deps-dev): bump ruff from 0.5.3 to 0.5.4 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3068
* chore(deps): bump @nextui-org/react from 2.4.5 to 2.4.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3059
* chore(deps-dev): bump typescript from 5.5.3 to 5.5.4 in /docs by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3079
* chore(deps-dev): bump @typescript-eslint/parser from 7.16.1 to 7.17.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3080
* chore(deps-dev): bump openai from 1.36.1 to 1.37.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3088
* chore(deps): bump litellm from 1.41.25 to 1.41.27 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3086
* chore(deps-dev): bump typescript from 5.5.3 to 5.5.4 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3084
* chore(deps-dev): bump @testing-library/jest-dom from 6.4.6 to 6.4.8 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3083
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.16.1 to 7.17.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3081
* chore(deps): bump boto3 from 1.34.145 to 1.34.146 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3087
* chore(deps-dev): bump chromadb from 0.5.4 to 0.5.5 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3085
* chore(deps): bump litellm from 1.41.27 to 1.41.28 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3092
* chore(deps): bump boto3 from 1.34.146 to 1.34.147 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3093
* chore(deps): bump @react-types/shared from 3.24.0 to 3.24.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3094
* chore(deps-dev): bump @types/node from 20.14.11 to 20.14.12 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3095
* chore(deps): bump litellm from 1.41.28 to 1.42.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3109
* chore(deps-dev): bump torch from 2.2.2 to 2.4.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3110
* chore(deps): bump google-cloud-aiplatform from 1.59.0 to 1.60.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3111
* chore(deps): bump boto3 from 1.34.147 to 1.34.148 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3112
* chore(deps-dev): bump pytest from 8.3.1 to 8.3.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3113
* chore(deps-dev): bump postcss from 8.4.39 to 8.4.40 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3114
* chore(deps): bump vite from 5.3.4 to 5.3.5 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3115
* chore(deps-dev): bump tailwindcss from 3.4.6 to 3.4.7 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3116
* chore(deps-dev): bump husky from 9.1.1 to 9.1.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3117
* chore(deps): bump litellm from 1.42.1 to 1.42.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3131
* chore(deps-dev): bump ruff from 0.5.4 to 0.5.5 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3132
* chore(deps-dev): bump streamlit from 1.36.0 to 1.37.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3129
* chore(deps): bump boto3 from 1.34.148 to 1.34.149 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3133
* chore(deps-dev): bump openai from 1.37.0 to 1.37.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3134
* chore(deps): bump @react-types/shared from 3.23.1 to 3.24.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3082

## New Contributors
* @charliez0 made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3045
* @DecodersLord made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3050
* @linshaoxin-maker made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3076
* @tolik518 made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3135
* @tofarr made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3138

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.8.1...0.8.2

## 0.8.1 — 2024-07-19

## What's Changed
* Arch: refactor and add unit tests for `EventStreamRuntime` docker image build by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2908
* [Arch] Add tests for `EventStreamRuntime` and fix bash parsing by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2933
* [Agent, Eval] Fixes LLM config issue for delegation & Add eval to measure the delegation accuracy by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2948
* CI: Add retry mechanism by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2915
* CI: Stop colima instance if failed to start by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2989
* docs: Add doc on how issues are triaged by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2928
* docs: updated docstrings using ruff's autofix feature by @anushkumarv in https://github.com/OpenDevin/OpenDevin/pull/2923
* [SWE-bench] Util: Compare files modified between gold patches and OpenDevin patches by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2934
* refactor: Frontend tests by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2959
* Refactor: remove the use of global variable in test_sandbox by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2985
* (test|refactor)(frontend): Refactor and extend tests for `ChatMessage.tsx` by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2976
* (test|refactor)(frontend): Refactor/cleanup and extend tests for `ChatInterface`, its children, and introduce improvements to the feedback flow by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2997
* Run all tests in development.md by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2951
* Rework --llm-config CLI arg by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2957
* Ref: Remove make-i18n from makefile by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2905
* Remove legacy swe_bench/scripts/summarise_results.py by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2932
* hotfix(frontend): Remove unused `framer-motion` package by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2973
* Remove global config from bedrock by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2954
* Support Instance Level Images for SWE-Bench Evaluation by @Jiayi-Pan in https://github.com/OpenDevin/OpenDevin/pull/2874
* Remove global config from sandbox by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2961
* Remove global config from logger by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2974
* Remove global config from auth by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2962
* Refactor LLM config by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2953
* Fix bug with model list by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2978
* fix bug in config.py file, update reference to variable by @JeffKatzy in https://github.com/OpenDevin/OpenDevin/pull/2984
* docs-issue-#2887: Create openshift-example.md by @eng-waleed1 in https://github.com/OpenDevin/OpenDevin/pull/2960
* [LLM] Increase the default retries for LLM by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2986
* Fix: Review PR Dogfood by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2916
* INT: prevent error on repeat integration tests after failed test(s) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2935
* fix(frontend): Remove unused react router package by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2972
* Fix: Run Unit Test by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2993
* State: Add local_iteration attribute by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2990
* Remove global config from session by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2987
* Fix: evaluation leaks api_key in metadata; fix `llm_config` argument in run infer by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2998
* Convert docs to new URL by @neubig in https://github.com/OpenDevin/OpenDevin/pull/3002
* (fix) Session: set base_url in default_llm_config by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/3003
* fix: runtime test for mac by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3005
* frontend: update url for share opendevin trajectory visualization by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3009
* Fix playwright cache error during container restart by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/3011
* Fix: handle the case where env var is empty by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/3016
* fix docs links by @juliangums in https://github.com/OpenDevin/OpenDevin/pull/3017
* #2220, integrated aider style linting, currently passes related o… by @jigsawlabs-student in https://github.com/OpenDevin/OpenDevin/pull/2489
* husky: Run package commands directly by @amanape in https://github.com/OpenDevin/OpenDevin/pull/3013
* chore: Release 0.8.0 by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2919
* chore: Update wordings in pull request template by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2926
* chores: remove useless code in eval by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2922
* chore(deps-dev): bump ruff from 0.5.2 to 0.5.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3026
* chore(deps-dev): bump llama-index-embeddings-azure-openai from 0.1.10 to 0.1.11 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3024
* chore(deps): bump boto3 from 1.34.144 to 1.34.145 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3022
* chore(deps): bump i18next from 23.12.1 to 23.12.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3020
* chore(deps-dev): bump jupyterlab from 4.2.3 to 4.2.4 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3028
* chore(deps): bump litellm from 1.41.15 to 1.41.19 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2906
* chore(deps-dev): bump prettier from 3.3.2 to 3.3.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2938
* chore(deps): bump fastapi from 0.111.0 to 0.111.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2944
* chore(deps-dev): bump ruff from 0.5.1 to 0.5.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2945
* chore(deps-dev): bump eslint-plugin-react from 7.34.3 to 7.34.4 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2940
* chore(deps): bump i18next from 23.11.5 to 23.12.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2939
* chore(deps): bump boto3 from 1.34.143 to 1.34.144 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2941
* chore(deps): bump litellm from 1.41.19 to 1.41.21 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2942
* chore(deps-dev): bump whatthepatch from 1.0.5 to 1.0.6 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2943
* chore(deps): bump react-i18next from 14.1.2 to 14.1.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2965
* chore(deps): bump vite from 5.3.3 to 5.3.4 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2967
* chore(deps-dev): bump @typescript-eslint/parser from 7.16.0 to 7.16.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2969
* chore(deps-dev): bump tailwindcss from 3.4.4 to 3.4.5 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2971
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.16.0 to 7.16.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2970
* chore(deps): bump litellm from 1.41.21 to 1.41.23 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2964
* chore(deps-dev): bump eslint-plugin-prettier from 5.1.3 to 5.2.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2980
* chore(deps): bump react-i18next from 14.1.3 to 15.0.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2981
* chore(deps-dev): bump tailwindcss from 3.4.5 to 3.4.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2983
* chore(deps-dev): bump @types/node from 20.14.10 to 20.14.11 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2982
* chore(deps): bump pyarrow from 16.1.0 to 17.0.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2963
* chore(deps): bump litellm from 1.41.23 to 1.41.24 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2999
* chore(deps-dev): bump pytest-asyncio from 0.23.7 to 0.23.8 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/3000
* chore(deps): bump @nextui-org/react from 2.4.2 to 2.4.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2995
* chore(deps-dev): bump husky from 9.0.11 to 9.1.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2996

## New Contributors
* @anushkumarv made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2923
* @JeffKatzy made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2984
* @eng-waleed1 made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2960
* @juliangums made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/3017
* @jigsawlabs-student made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2489

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.8.0...0.8.1

## 0.8.0 — 2024-07-13

## What's Changed

* [Arch] Remove supports for Background Commands by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2803
https://github.com/OpenDevin/OpenDevin/pull/2810
* arch: deprecating recall action and `search_memory` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2900
* arch: refractor eventstream into async by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2907
* [Arch] Implement EventStream Runtime Client with Jupyter Support using Agnostic Sandbox by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2879
* [Arch] `EventStreamRuntime` supports browser by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2899
* [Agent] Improve edits by adding back `append_file` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2722
* Bugfix: add missing f in f-string for logging debug message in task creation by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2836
* CI: Delete colima default profile by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2807
* CI: Support uploading frontend unit test coverage. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2772
* CI: Check exit code for E2E test by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2834
* docs: Reorder docs and small update to README by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2860
* doc: Mention negative feedback feature in bug report. by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2827
* Doc: Fix Azure Guide by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2894
* Doc: LM Studio Guide by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2875
* Doc: Mention FORCE_REGENERATE var by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2833
* [Evaluation] Simplify eval & and multi-processing related fixes by @xingyaoww in 
* feat: Implement user confirmation mode, request confirmation when running bash/python code in this mode by @adrgs in https://github.com/OpenDevin/OpenDevin/pull/2774
* Fix delegator LLM config when config is set from UI by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2913
* Fix: hostname in logging by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2914
* [Fix] Minor bug in parse_response of CodeActResponseParser by @RajWorking in https://github.com/OpenDevin/OpenDevin/pull/2912
* fix: Runtime import by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2897
* Refactor: Remove extra log in property by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2687
* Refactoring: event stream based agent history by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2709
* Refractor: move image agnostic util to shared runtime util by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2859
* Test: Update regenerate.sh by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2832
* Update README for release 0.7.1 by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2814
* Use README as the only place for getting started instructions by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2815
* Make the sandbox Python runtime completely transparent by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2796
* Fix gemini-1.5-flash crash due to missing 'vertexai' module by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2826
* trim the sandbox image and install plugin dependencies in agnostic image by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2792
* Update custom sandbox usage guide by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2829
* fix git diff TIMEOUT problem in swe_bench evaluation by @bin123apple in https://github.com/OpenDevin/OpenDevin/pull/2828
* Two fixes to swe bench eval by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2831
* Streamline Logging Events by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2532
* Display real-time build logs for the agnostic image by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2830
* added netcat to the requirements by @rdmueller in https://github.com/OpenDevin/OpenDevin/pull/2822
* History clean up by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2849
* Add websocket runtime and od-client-runtime by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2603
* add od runtime clinet dependencies in sandbox image by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2858
* fix client pexpect remove permission todo by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2863
* fix pexpect output code error in docker image by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2862
* Fix instance agonistic: remove Miniforge after installation by @Jiayi-Pan in https://github.com/OpenDevin/OpenDevin/pull/2878
* Customize LLM config per agent by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2756
* chores: open the websockets ports for port mapping and remove chores. by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2864
* Ref: Restore last mute setting by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2895
* Integration testing: unset irrelevant env variables by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2902
* Remove legacy dummy action from CI by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2903
* chore(deps): bump litellm from 1.41.6 to 1.41.7 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2812
* chore(deps-dev): bump ruff from 0.5.0 to 0.5.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2811
* chore(deps): bump tenacity from 8.4.2 to 8.5.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2813
* chore(deps): bump tailwind-merge from 2.3.0 to 2.4.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2851
* chore(deps-dev): bump @types/node from 20.14.9 to 20.14.10 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2852
* chore(deps): bump litellm from 1.41.7 to 1.41.11 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2854
* chore(deps): bump boto3 from 1.34.139 to 1.34.140 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2855
* chore(deps-dev): bump @typescript-eslint/parser from 7.15.0 to 7.16.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2873
* chore(deps): bump framer-motion from 11.2.13 to 11.2.14 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2871
* chore(deps): bump google-generativeai from 0.7.1 to 0.7.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2868
* chore(deps): bump boto3 from 1.34.140 to 1.34.141 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2869
* chore(deps): bump litellm from 1.41.11 to 1.41.13 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2870
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.15.0 to 7.16.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2872
* chore(deps): bump json-repair from 0.25.2 to 0.25.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2881
* chore(deps): bump litellm from 1.41.13 to 1.41.14 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2883
* chore(deps-dev): bump openai from 1.35.10 to 1.35.13 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2885
* chore(deps): bump framer-motion from 11.2.14 to 11.3.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2880
* chore(deps): bump boto3 from 1.34.141 to 1.34.142 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2882
* chore(deps): bump google-cloud-aiplatform from 1.58.0 to 1.59.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2884
* chore(deps): bump framer-motion from 11.3.0 to 11.3.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2890
* chore(deps): bump litellm from 1.41.14 to 1.41.15 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2891
* chore(deps-dev): bump chromadb from 0.5.3 to 0.5.4 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2892
* chore(deps): bump boto3 from 1.34.142 to 1.34.143 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2893

## New Contributors
* @bin123apple made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2828
* @rdmueller made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2822
* @adrgs made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2774
* @RajWorking made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2912

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.7.1...0.8.0

## 0.7.1 — 2024-07-05

## What's Changed
* Update tag to use in README and docs to 0.7.0 by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2683
* Remove MAX_CHARS traffic control by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2694
* doc: Update CONTRIBUTING.md by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2671
* Sync history to stream by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2640
* [Evaluation] Default to not use hint for SWE-Bench eval by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2696
* CLI concurrency by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2695
* Add ability to restore the cli session (optional) by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2699
* Small refactoring of obs truncation by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2701
* Bypass MAX_ITERATIONS and MAX_BUDGET_PER_TASK on web GUI by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2697
* docs: Update documentation with some consistency by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2706
* Remove SWE agent by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2708
* feat: added make run-wsl by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2711
* mixin: improve logging by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2713
* style: refine the copy button and add copy feedback for the icon. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2715
* test: fix the failed unit tests. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2721
* fix(docs): translate missing parts in `zh-Hans` and `fr` by @Umpire2018 in https://github.com/OpenDevin/OpenDevin/pull/2724
* fix: improve exit_code processing (ssh_box) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2726
* [Evaluation] Use the latest official SWE-Bench Dockerization for evaluation by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2728
* [Agent] (Potentially) improve Editing using `diff` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2685
* refactor: Renamed variables to resolve naming conflicts and eliminate warnings by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2732
* Refactor: Enhance file handling and code editing functionality by @PierrunoYT in https://github.com/OpenDevin/OpenDevin/pull/2646
* Fix: Add scroll functionality to file explorer sidepane by @richardokonicha in https://github.com/OpenDevin/OpenDevin/pull/2731
* CI: For colima, modify CPU count and memory by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2712
* [Evaluation] fix SWE-Bench docker image name by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2751
* feature: Add config template. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2736
* Remove global args by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2760
* feature: Enable DEBUG level logging based on config setting. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2762
* docs: Update custom sandbox guide to include steps to use pre-existin… by @richardokonicha in https://github.com/OpenDevin/OpenDevin/pull/2740
* Fix the FE failed unit test. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2773
* Restore SWE-bench dep refs by @john-b-yang in https://github.com/OpenDevin/OpenDevin/pull/2752
* Add 'latest' tag to Docker builds for stable releases only by @richardokonicha in https://github.com/OpenDevin/OpenDevin/pull/2781
* refactor: multiple code improvements by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2771
* Added local ollama models by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2433
* Make CodeAct finish task by @sb-git-cloud in https://github.com/OpenDevin/OpenDevin/pull/2673
* Add event synchronously by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2700
* [Evaluation] Log empty patch stats for SWE-Bench by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2776
* [Arch] Removing docker exec box by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2802
* [Eval] initialize llm inside process_instance to circumvent "AttributeError:… by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2805
* [LLM] Retry for internal server error by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2806
* Refactored sandbox config  by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2455
* docs: update docker run command to pull default 'latest' tag by @richardokonicha in https://github.com/OpenDevin/OpenDevin/pull/2804
* Simplify eval code by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2775
* chore: Add architecture diagram. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2783
* chore(deps): bump boto3 from 1.34.138 to 1.34.139 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2788
* chore(deps): bump litellm from 1.41.3 to 1.41.6 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2790
* chore(deps): bump react from 18.2.0 to 18.3.1 in /docs by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2786
* chore(deps): bump react-dom from 18.2.0 to 18.3.1 in /docs by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2787
* chore(deps-dev): bump typescript from 5.2.2 to 5.5.3 in /docs by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2785
* chore(deps-dev): bump openai from 1.35.9 to 1.35.10 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2789
* chore(deps): bump framer-motion from 11.2.12 to 11.2.13 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2793
* chore: Add docs for dependabot and add the open pr limit from 5 to 20. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2784
* chore(deps): bump vite from 5.3.2 to 5.3.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2767
* chore(deps): bump jose from 5.6.2 to 5.6.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2766
* chore(deps): bump boto3 from 1.34.137 to 1.34.138 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2769
* chore(deps-dev): bump openai from 1.35.8 to 1.35.9 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2770
* chore(deps): bump react-router-dom from 6.24.0 to 6.24.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2768
* chore(deps-dev): bump typescript from 5.5.2 to 5.5.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2741
* chore(deps): bump litellm from 1.40.29 to 1.41.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2746
* chore(deps-dev): bump openai from 1.35.7 to 1.35.8 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2745
* chore(deps-dev): bump @typescript-eslint/parser from 7.14.1 to 7.15.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2743
* chore(deps): bump boto3 from 1.34.136 to 1.34.137 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2744
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.14.1 to 7.15.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2742
* chore(deps): bump boto3 from 1.34.135 to 1.34.136 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2718
* chore(deps-dev): bump postcss from 8.4.38 to 8.4.39 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2716
* chore(deps): bump @reduxjs/toolkit from 2.2.5 to 2.2.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2717
* chore(deps-dev): bump ruff from 0.4.10 to 0.5.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2719

## New Contributors
* @richardokonicha made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2731
* @john-b-yang made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2752
* @sb-git-cloud made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2673

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.7.0...0.7.1

## 0.7.0 — 2024-06-29

## What's Changed
* Update screenshot by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2286
* Bump openai from 1.30.5 to 1.31.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2283
* [feat] WebArena benchmark, MiniWoB++ benchmark and related arch changes by @frankxu2004 in https://github.com/OpenDevin/OpenDevin/pull/2170
* fix: test_sandbox tests didn't close dockers by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2274
* [Hotfix] Fix ML-Bench continue ``run_inference.py`` by @super-dainiu in https://github.com/OpenDevin/OpenDevin/pull/2284
* Bump boto3 from 1.34.118 to 1.34.119 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2280
* Update AgentHub README.md by @isavita in https://github.com/OpenDevin/OpenDevin/pull/2290
* doc: add Python keyring to Troubleshooting documentation by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2289
* Bump openai from 1.31.0 to 1.31.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2301
* Bump litellm from 1.40.2 to 1.40.4 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2300
* Bump ruff from 0.4.7 to 0.4.8 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2297
* Bump boto3 from 1.34.119 to 1.34.120 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2299
* Makefile setup-config to store the persist_sandbox boolean value by @mohammadkazem-sadoughi in https://github.com/OpenDevin/OpenDevin/pull/2304
* Bump tailwindcss from 3.4.3 to 3.4.4 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2298
* fix: ExplorerActions overlapping with file name. by @birajsilwal in https://github.com/OpenDevin/OpenDevin/pull/2287
* CodeActAgent to delegate to BrowsingAgent by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2103
* [bugfix] browse actions shouldn't change url and screenshot, only observations  by @frankxu2004 in https://github.com/OpenDevin/OpenDevin/pull/2311
* Fix failed test_browse_internet CodeActAgent integration prompts  by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2318
* tests: more Agentskills tests; updated .gitignore by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2307
* Fix python environment in solve-issue dogfood action by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2313
* Bump openai from 1.31.2 to 1.32.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2317
* Bump boto3 from 1.34.120 to 1.34.121 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2316
* Bump vite from 5.2.12 to 5.2.13 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2315
* fix: hide special paths; sort models by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2325
* fix: remove bottom chatbox fade (frontend) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2323
* Add back jupyter PWD env var for agentskills by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2327
* feat: support ToolQA benchmark by @yueqis in https://github.com/OpenDevin/OpenDevin/pull/2263
* feat: revert hiden special paths change in file action by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2328
* Support gpqa benchmark evaluation by @1jsingh in https://github.com/OpenDevin/OpenDevin/pull/2080
* fix(frontend): prevent API key from resetting after modal change by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2329
* fix: codeact bug [If running a command that never returns, it gets stuck #1895] by @assertion in https://github.com/OpenDevin/OpenDevin/pull/2034
* Feat: Support Gorilla APIBench  by @yueqis in https://github.com/OpenDevin/OpenDevin/pull/2081
* Remote deprecated file by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2332
* fix: Backticks get always escaped by runtime; add Ipython test by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2321
* fix: warning about zope-interface (pyproject) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2335
* Revamp AgentRejectAction and allow ManagerAgent to handle rejection by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/1735
* Downgraded Python version to 3.12.3 by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2331
* remove deprecated github-token config by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2334
* Restore previous browsing agent behavior when evaluating on WebArena and miniwob++ only by @frankxu2004 in https://github.com/OpenDevin/OpenDevin/pull/2341
* doc: Added citation subsection  in README by @poudel-bibek in https://github.com/OpenDevin/OpenDevin/pull/2339
* Refactored prompt.py to reduce token usage by @temotskipa in https://github.com/OpenDevin/OpenDevin/pull/1996
* Parameterize Python version by @ohhmm in https://github.com/OpenDevin/OpenDevin/pull/2348
* fix typos by @RainRat in https://github.com/OpenDevin/OpenDevin/pull/2352
* fix: remove backtick escaping from run_ipython by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2347
* Issues Category Update: Removed Question Type by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2345
* conftest: Exit without revealing secrets by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2351
* BioCoder integration by @tangxiangru in https://github.com/OpenDevin/OpenDevin/pull/2076
* Refactor response to action in agent step by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2350
* fix: remove some MonologueAgent mentions by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2364
* chore(deps): bump litellm from 1.40.4 to 1.40.7 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2370
* chore(deps): bump boto3 from 1.34.121 to 1.34.122 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2372
* chore(deps-dev): bump openai from 1.32.0 to 1.33.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2373
* chore(deps-dev): bump llama-index-embeddings-azure-openai from 0.1.9 to 0.1.10 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2374
* chore(deps-dev): bump llama-index-vector-stores-chroma from 0.1.8 to 0.1.9 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2375
* Fix llm key leaks bug by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2376
* chore(deps): bump @vitejs/plugin-react from 4.3.0 to 4.3.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2371
* feat: append_file incl. all tests [agentskills] by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2346
* Add SWEBench-docker eval by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2085
* fix: avoid repeat logging of unneeded messages by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2380
* Minor SWE-Bench inference config tweak by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2381
* fix(swe_bench_eval): Mkdir `infer_logs` instead of `logs` by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2382
* refactor browsing agent response parse by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2366
* chore(deps): bump boto3 from 1.34.122 to 1.34.123 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2391
* chore(deps): bump litellm from 1.40.7 to 1.40.8 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2392
* chore(deps-dev): bump prettier from 3.3.1 to 3.3.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2390
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.12.0 to 7.13.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2389
* chore(deps-dev): bump @testing-library/jest-dom from 6.4.5 to 6.4.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2388
* chore(deps-dev): bump @typescript-eslint/parser from 7.12.0 to 7.13.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2387
* Add integration test for CodeActSWEAgent by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2377
* fix the failed unit test. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2405
* chore(deps-dev): bump lint-staged from 15.2.5 to 15.2.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2407
* chore(deps): bump litellm from 1.40.8 to 1.40.9 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2411
* chore(deps): bump boto3 from 1.34.123 to 1.34.124 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2410
* Use LLM to analyze ML-Bench failure cases by @super-dainiu in https://github.com/OpenDevin/OpenDevin/pull/2399
* Refactor MonologueAgent, PlannerAgent add response parser  by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2400
* Refactor CodeActSWEAgent, add response parser by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2368
* Dockerfile for make plugins sandbox-agnostic by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2409
* chore(deps-dev): bump lint-staged from 15.2.6 to 15.2.7 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2414
* chore(deps): bump vite from 5.2.13 to 5.3.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2416
* chore(deps-dev): bump openai from 1.33.0 to 1.34.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2422
* chore(deps): bump boto3 from 1.34.124 to 1.34.125 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2423
* chore(deps): bump datasets from 2.19.2 to 2.20.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2424
* Replace all instances of OPENDEVIN_WORKSPACE with WORKSPACE_BASE by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2418
* workspace_mount_path sentinel: an undefined string by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2431
* regenerate.sh: Exit upon common known errors by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2385
* Adjust is-stuck check for the same steps to 3 until it's stopped by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2437
* chore(deps): bump litellm from 1.40.9 to 1.40.12 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2440
* chore(deps): bump boto3 from 1.34.125 to 1.34.126 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2439
* chore(deps): bump vite from 5.3.0 to 5.3.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2441
* refactor browsing agent code by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2442
* chores: fix DelegatorAgent description by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2446
* Stopped persisted container on closing to prevent port issues. by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2447
* chore: remove useless browsing code in CodeActSWEAgent by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2438
* Added Pull Request Template by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2454
* Fixed typo in PR template name by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2461
* Evaluation time travel: allow evaluation on a specific version  by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2356
* fix: improve toml parsing exception in config class by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2459
* docs: Update Development and CONTRIBUTING docs by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2453
* chores: remove useless code by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2465
* Detailed jupyter error log by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2448
* fix: Agentskills enhancements by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2384
* Codecov after_n_builds=5 by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2468
* fix: logger with more masking of sensitive data by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2470
* fix: test_ipython being skipped by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2477
* Reworded port forward msg by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2478
* Integration tests: check agent error and fix test_edits by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2473
* Bump docker version by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2479
* chore(deps-dev): bump flake8 from 7.0.0 to 7.1.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2481
* chore(deps): bump litellm from 1.40.12 to 1.40.15 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2484
* chore(deps): bump tenacity from 8.3.0 to 8.4.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2483
* chore(deps): bump @nextui-org/react from 2.4.1 to 2.4.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2485
* chore(deps-dev): bump ruff from 0.4.8 to 0.4.9 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2482
* feat: add environments in global bashrc file by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2486
* chore(deps): bump jose from 5.4.0 to 5.4.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2496
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.13.0 to 7.13.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2495
* chore(deps-dev): bump @types/node from 20.14.2 to 20.14.5 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2498
* chore(deps): bump google-generativeai from 0.6.0 to 0.7.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2500
* Update SWE-Bench README.md by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2505
* chore(deps): bump litellm from 1.40.15 to 1.40.16 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2501
* Split container image build & push by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2456
* chore(deps): bump boto3 from 1.34.126 to 1.34.128 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2504
* Document, rename Agent* exceptions to LLM* by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2508
* Use the completion decorator with cost logging by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2509
* dep: poetry.lock updated (lots of changes) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2492
* feat: default timezone in build by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2513
* Fix Docker tagging issue with upper case by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2512
* chore(deps-dev): bump @typescript-eslint/parser from 7.13.0 to 7.13.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2497
* Add dev config for frontend for WSL by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2506
* Show relevant error in UI by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2516
* chore(deps-dev): bump chromadb from 0.5.1 to 0.5.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2514
* chore(deps): bump json-repair from 0.23.1 to 0.25.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2521
* chore(deps): bump boto3 from 1.34.128 to 1.34.129 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2520
* chore(deps): bump litellm from 1.40.16 to 1.40.17 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2522
* chore(deps): bump framer-motion from 11.2.10 to 11.2.11 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2523
* Update CONTRIBUTING.md by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2525
* chore(deps-dev): bump eslint-plugin-react from 7.34.2 to 7.34.3 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2524
* docs: Fix formatting in CONTRIBUTING by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2526
* docs: Update link to evaluation benchmark on README.md by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2530
* docs: Add visualizer instruction for SWE-Bench by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2529
* Make plugins sandbox-agnostic by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2101
* Downgrade Mac version in CI/CD Pipeline by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2499
* remove gcc by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2536
* Architecture documentation by @rbren in https://github.com/OpenDevin/OpenDevin/pull/2116
* chore(deps): bump monaco-editor from 0.49.0 to 0.50.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2541
* chore(deps): bump boto3 from 1.34.129 to 1.34.130 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2546
* chore(deps-dev): bump @types/node from 20.14.5 to 20.14.6 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2542
* Fix Mac OS CI test by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2544
* add workspace text by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2548
* Fix od_sandbox's docker image rename rule by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2550
* chore(deps-dev): bump openai from 1.34.0 to 1.35.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2547
* Always pull sandbox image by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2538
* Evaluation time travel: build sandbox on the fly by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2491
* Enable test_agnostic_sandbox_jupyter_agentskills_fileop_pwd in CI by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2534
* sec: update npm module "ws" to 8.17.1 by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2554
* Use :main instead of :latest by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2539
* chore(deps-dev): bump eslint-plugin-jsx-a11y from 6.8.0 to 6.9.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2543
* Fix Mac OS CI - usernet unable to resolve IP for SSH forwarding by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2556
* Enforce linter in tests folder by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2557
* Stop always pulling the latest image. by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2558
* Revert "Always pull sandbox image" by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2560
* fix: Makefile shall pull sandbox:main, not :latest by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2561
* Update doc to clarify OpenDevin mission and link directly to content by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2568
* chore(deps-dev): bump typescript from 5.4.5 to 5.5.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2570
* chore(deps-dev): bump @types/node from 20.14.6 to 20.14.7 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2571
* chore(deps-dev): bump streamlit from 1.35.0 to 1.36.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2572
* chore(deps-dev): bump openai from 1.35.1 to 1.35.3 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2574
* chore(deps): bump json-repair from 0.25.0 to 0.25.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2575
* No longer chown -R the miniforge3 folder by @Shimada666 in https://github.com/OpenDevin/OpenDevin/pull/2566
* Fix Mac CI Test by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2569
* Interactive Terminal by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2493
* chore(deps): bump litellm from 1.40.17 to 1.40.20 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2576
* chore(deps-dev): bump ruff from 0.4.9 to 0.4.10 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2573
* Add links to a feedback sharing site by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2580
* Update feedback modal content by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2582
* Mention Ubuntu supported versions by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2584
* Enable "vz" vm-type for MacOS CI by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2586
* Update documentation regarding feedback data usage by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2585
* Revert "Enable "vz" vm-type for MacOS CI" by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2588
* Remove PERSIST_SANDBOX=true option by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2591
* Add NUM_WORKERS variable to run_infer.sh scripts for configurable woker settings by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2597
* Remove Colima and lima directory after uninstalling for Mac OS CI by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2598
* fix(frontend): Prevent actions from disappearing before sending data by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2599
* fix(frontend): Disable eslint rule that throws `useEffect` warning by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2600
* fix(frontend): Replace console errors with toast errors by @amanape in https://github.com/OpenDevin/OpenDevin/pull/2601
* Add i18n support for official website by @Umpire2018 in https://github.com/OpenDevin/OpenDevin/pull/2463
* Default makefile for persist_sandbox to be false by @mamoodi in https://github.com/OpenDevin/OpenDevin/pull/2605
* [Evaluation] Update SWE-bench output with eval results by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2606
* Track metrics throughout delegation & Polish UX for out of budget error by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2595
* Tweak prompts of ManagerAgent and CommitWriterAgent by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2609
* feat: update version to 0.6.2. added Action to update pyproject on Release by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2552
* chore(deps): bump boto3 from 1.34.130 to 1.34.131 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2616
* chore(deps): bump litellm from 1.40.20 to 1.40.25 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2615
* chore(deps-dev): bump @types/node from 20.14.7 to 20.14.8 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2617
* Bug fix: add error observation to history by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2610
* feat(frontend): Add "Copy" Button to Chat Messages by @PierrunoYT in https://github.com/OpenDevin/OpenDevin/pull/2619
* feat: Agent buttons hover decor by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2623
* chore(deps): bump framer-motion from 11.2.11 to 11.2.12 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2626
* chore(deps-dev): bump @typescript-eslint/parser from 7.13.1 to 7.14.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2627
* chore(deps-dev): bump mypy from 1.10.0 to 1.10.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2634
* chore(deps): bump litellm from 1.40.25 to 1.40.26 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2633
* chore(deps-dev): bump @typescript-eslint/eslint-plugin from 7.13.1 to 7.14.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2629
* chore(deps): bump tenacity from 8.4.1 to 8.4.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2631
* chore(deps-dev): bump reportlab from 4.2.0 to 4.2.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2635
* chore(deps): bump boto3 from 1.34.131 to 1.34.132 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2632
* feat(frontend): Add Typing Indicator for Agent Response using Tailwind CSS by @PierrunoYT in https://github.com/OpenDevin/OpenDevin/pull/2630
* frontend: apply more translations to frontend components by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2639
* feat: allow SANDBOX_CONTAINER_IMAGEs built from opendevin/sandbox:main by @xverges in https://github.com/OpenDevin/OpenDevin/pull/2622
* Frontend support for delegation and rejection by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2608
* dev: added make-i18n to "build" (package.json) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2641
* chore(deps): bump react-router-dom from 6.23.1 to 6.24.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2628
* chore(deps-dev): bump @types/node from 20.14.8 to 20.14.9 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2644
* Added Documentation for How To Run Custom Sandbox Image  by @sheunaluko in https://github.com/OpenDevin/OpenDevin/pull/2637
* chore(deps): bump jose from 5.4.1 to 5.5.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2645
* chore(deps): bump boto3 from 1.34.132 to 1.34.133 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2647
* chore(deps): bump litellm from 1.40.26 to 1.40.27 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2648
* chore(deps-dev): bump openai from 1.35.3 to 1.35.4 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2649
* docs: Update custom_sandbox_guide.md by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2650
* Update docusaurus.config.ts for a changed Doc URL by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2653
* Added Sound Notification 🎵 by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2203
* Add test for auto_lint after file edit by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2655
* Revert "Show relevant error in UI" by @enyst in https://github.com/OpenDevin/OpenDevin/pull/2657
* Provide [Package already installed] info to LLM by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2642
* chore(deps): bump boto3 from 1.34.133 to 1.34.134 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2661
* chore(deps-dev): bump openai from 1.35.4 to 1.35.6 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2660
* chore(deps): bump google-generativeai from 0.7.0 to 0.7.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2662
* chore(deps): bump jose from 5.5.0 to 5.6.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2663
* chore(deps): bump litellm from 1.40.27 to 1.40.28 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2664
* Fix doc error in evals by @Jiayi-Pan in https://github.com/OpenDevin/OpenDevin/pull/2654
* refactor: Simplify message formatting by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2670
* CodeActAgent: Fix delegate history by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2672
* chore(deps): bump boto3 from 1.34.134 to 1.34.135 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2678
* chore(deps): bump jose from 5.6.1 to 5.6.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2682
* chore(deps): bump vite from 5.3.1 to 5.3.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2681
* chore(deps-dev): bump openai from 1.35.6 to 1.35.7 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2676
* chore(deps): bump litellm from 1.40.28 to 1.40.29 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2677
* chore(deps): bump json-repair from 0.25.1 to 0.25.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2679
* chore(deps-dev): bump llama-index-vector-stores-chroma from 0.1.9 to 0.1.10 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2680
* feat: file explorer: better sorting; .gitignore support; file upload config by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2621
* [Evaluation] Improve patch apply in SWE-Bench by @xingyaoww in https://github.com/OpenDevin/OpenDevin/pull/2684
* ghcr: Fix local built image name in tests by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2686

## New Contributors
* @mohammadkazem-sadoughi made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2304
* @birajsilwal made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2287
* @yueqis made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2263
* @1jsingh made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2080
* @ohhmm made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2348
* @tangxiangru made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2076
* @xverges made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2622
* @sheunaluko made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2637

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.6.2...0.7.0

## 0.6.2 — 2024-06-05

## What's Changed
* Bump pytest from 8.2.1 to 8.2.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2252
* Bump boto3 from 1.34.117 to 1.34.118 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2253
* Bugfix by added config to disable plugin initialization for Persistent sandbox by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2179
* Bump google-generativeai from 0.5.4 to 0.6.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2254
* Bump opencv-python from 4.9.0.80 to 4.10.0.82 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2255
* Bump litellm from 1.39.5 to 1.40.0 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2256
* Bump @typescript-eslint/parser from 7.11.0 to 7.12.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2261
* Fixed output logging by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2244
* Bump jose from 5.3.0 to 5.4.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2259
* Bump @types/node from 20.14.0 to 20.14.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2258
* fix frontend tests; minor readme update by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2219
* fix test_config to prevent leaks by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2245
* Fix agentskills tests by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2242
* Fix SWE-Bench README typos by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2250
* fix: add an early exit check for agent answers in agent bench. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2257
* Add ML-Bench Evaluation with OpenDevin by @super-dainiu in https://github.com/OpenDevin/OpenDevin/pull/2015
* [Mint evaluation] Fix bug in stopping when the agent reaches max steps or solution proposals by @ryanhoangt in https://github.com/OpenDevin/OpenDevin/pull/2268
* Bump @testing-library/react from 15.0.7 to 16.0.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2227
* [AgentBench evaluation] set run_as_devin to true by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2269
* Bump @typescript-eslint/eslint-plugin from 7.11.0 to 7.12.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2260
* fix: there maybe unexpected files in event file list, not like 1.json… by @assertion in https://github.com/OpenDevin/OpenDevin/pull/2270
* Improved logs by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2272
* fix typos by @RainRat in https://github.com/OpenDevin/OpenDevin/pull/2267
* Bump prettier from 3.3.0 to 3.3.1 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2281
* Bump @types/node from 20.14.1 to 20.14.2 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2279
* Bump json-repair from 0.21.0 to 0.23.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2278
* Bump litellm from 1.40.0 to 1.40.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2282
* Solved Hugging Face cache issue. by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2277

## New Contributors
* @super-dainiu made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2015

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.6.1...0.6.2

## 0.6.1 — 2024-06-04

## What's Changed
* Bump litellm from 1.39.3 to 1.39.5 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2163
* Fix: Feedback should be sent through the backend to avoid CORS issues by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2046
* Bump boto3 from 1.34.115 to 1.34.116 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2164
* Install chromium only once by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2100
* Add remaining subsets for MINT benchmark by @ryanhoangt in https://github.com/OpenDevin/OpenDevin/pull/2142
* Added logs by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2153
* Lazy launching BrowseEnv / making BrowseEnv optional by @assertion in https://github.com/OpenDevin/OpenDevin/pull/2155
* Fixed makefile by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2168
* Fix: Codebase font fixed, and other fixes for #2138 PR by @zeul22 in https://github.com/OpenDevin/OpenDevin/pull/2154
* Fix persist_sandbox in Makefile by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2171
* Initialized plugins only once for persistent sandboxes by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2162
* Fix ssh box hung issue by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2172
* Detailed logs for ssh_box by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2173
* Add AgentBench. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2012
* Fix: Avoid bash backtick eval in runtime commands. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2180
* Support BIRD benchmark by @huybery in https://github.com/OpenDevin/OpenDevin/pull/2117
* Update slack invite link to make it valid by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2182
* Restricted persistent sandbox to opendevin user only by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2177
* Refactored logging by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2159
* Auto started persistent container by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2151
* Add supported benchmarks to evaluation README by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2183
* fix typos by @RainRat in https://github.com/OpenDevin/OpenDevin/pull/2187
* fix: Fix husky install deprecated message (since v9 of husky) (#2190) by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2191
* [Eval, EDA] modify the exiting logic and reward calculation, delete unused function by @dreasysnail in https://github.com/OpenDevin/OpenDevin/pull/2198
* Add cost metrics to evaluation outputs for all benchmarks by @ryanhoangt in https://github.com/OpenDevin/OpenDevin/pull/2199
* Bump docs to 0.6 by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2193
* Windows doc extended with more WSL hints by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2205
* ssh_box: Close containers before throwing exception by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2206
* fix: German translations added/updated by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2208
* Fix file descriptor leaks in agentskills by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2209
* ssh_box: Fix Docker client descriptor leak by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2212
* evaluation: Reset configs in finally block by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2214
* Named docker app container by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2202
* logger.py: Fix resource leak by @li-boxuan in https://github.com/OpenDevin/OpenDevin/pull/2215
* Add consent dialog by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2169
* Bump prettier from 3.2.5 to 3.3.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2225
* Bump @types/node from 20.12.13 to 20.14.0 in /frontend by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2226
* fix: keep colon part in model name for OpenRouter by @tobitege in https://github.com/OpenDevin/OpenDevin/pull/2223
* Bump e2b from 0.17.0 to 0.17.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2229
* Bump uvicorn from 0.30.0 to 0.30.1 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2230
* Bump datasets from 2.19.1 to 2.19.2 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2231
* Bump boto3 from 1.34.116 to 1.34.117 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2232
* doc: changed the welcome logo from 60vh to auto by @poudel-bibek in https://github.com/OpenDevin/OpenDevin/pull/2235
* chore: fix some comments by @finaltrip in https://github.com/OpenDevin/OpenDevin/pull/2234
* Bump ruff from 0.4.6 to 0.4.7 by @dependabot in https://github.com/OpenDevin/OpenDevin/pull/2233
* Fix: Properly close Docker client in DockerExecBox to prevent resource leakage by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2224
* Transition Share-OpenDevin to gcloud endpoint by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2240
* Add docs for sharing feedback by @neubig in https://github.com/OpenDevin/OpenDevin/pull/2241
* Fix python environment in review-pr dogfood action by @yufansong in https://github.com/OpenDevin/OpenDevin/pull/2237
* One-step launch instructions by @renxida in https://github.com/OpenDevin/OpenDevin/pull/2189
* fix: restore python linting. by @iFurySt in https://github.com/OpenDevin/OpenDevin/pull/2228
* Quick doc fix  by @SmartManoj in https://github.com/OpenDevin/OpenDevin/pull/2243

## New Contributors
* @tobitege made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2191
* @poudel-bibek made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2235
* @finaltrip made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2234
* @renxida made their first contribution in https://github.com/OpenDevin/OpenDevin/pull/2189

**Full Changelog**: https://github.com/OpenDevin/OpenDevin/compare/0.6.0...0.6.1

