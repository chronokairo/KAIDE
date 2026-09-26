## rust-v0.157.1 — 2026-09-26

## Chores

- Release highlights could not be determined: the supplied PR index is empty, and the GitHub tag comparison returned 404.

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.157.0...rust-v0.157.1





## rust-v0.157.0 — 2026-09-25

## New Features

- Added GPT-6 Sol and Luna, including Amazon Bedrock support and migration prompts for older models. (#47332, #47347)
- Enabled fullscreen transcripts by default and added Shift-click to extend text selections. (#47178, #47414)
- Enabled automatic background-server startup for eligible interactive sessions, with recovery choices when server settings are incompatible. (#47179, #47318)
- Added an `f` shortcut to fork conversations open in another app, preserving drafts and queued prompts. (#47185)
- Made `/import` available in remote sessions and local background-server sessions. (#47317)
- Improved terminal rendering with Unicode bullets, checkboxes, aligned equations, and optimization notation. (#47191, #47322)

## Bug Fixes

- Preserved active voice conversations when switching threads. (#47381)
- Recovered unsent question answers into the composer when turns end, without disrupting active history searches. (#47422, #47423)
- Respected tmux mouse settings and restored native scrollback for Terminal.app over SSH in automatic screen mode. (#47399, #47417)
- Fixed configured proxy routing for realtime connections and standalone web search, including search redirects. (#47101, #47142, #47204)
- Added retries for transient file-upload failures and increased the upload timeout to five minutes. (#47122, #47393)
- Enforced network restrictions across redirects and ongoing HTTP and WebSocket traffic, including cancellation when policy changes revoke access. (#47389, #47407)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.156.0...rust-v0.157.0

- #47063 Add a partial index for agent message board root posts @jif-oai
- #47064 Stop redundant message-board reads when limits reach one @jif-oai
- #47065 Deduplicate deprecation notices in the TUI transcript @etraut-openai
- #47068 Highlight selected newlines in the transcript view @etraut-openai
- #47073 Wait for thread idle in Guardian context budget tests @jif-oai
- #47074 Refresh host-supplied cloud skills at turn startup @TAFOYA-OAI
- #47075 Include attributed previews in agent message board notifications @jif-oai
- #47077 Serialize environment updates and cancel removed pending attachments @sayan-oai
- #47079 Mask daemon socket paths exposed through ancestor bind mounts @nicksteele-oai
- #47081 Track cumulative MCP attribution across requests and thread history @peilin-openai
- #47082 Show the voice toggle in the TUI shortcut overlay @etraut-openai
- #47083 Extract per-thread enrichment into a dedicated async helper @aibrahim-oai
- #47084 Avoid building a host SQLite driver for SQLx macros @aibrahim-oai
- #47085 Update model catalog descriptions and GPT-5.6-Sol priority @andrewgu-oai
- #47086 Format analytics credit usage with consistent decimal precision @fcoury-oai
- #47088 Disable unused default dependency features @aibrahim-oai
- #47089 Centralize JSON-RPC response serialization through payloads @aibrahim-oai
- #47094 Restrict Unix local MCP servers to stdio descriptors @yuzhu-oai
- #47095 Remove the `rust-release-prepare` workflow @andrewgu-oai
- #47096 Keep TUI hints immediately above the composer @fcoury-oai
- #47100 Preserve assistant answers in bounded TUI task responses @etraut-openai
- #47101 Honor configured proxies for realtime WebSocket connections @celia-oai
- #47106 Preserve originating turn metadata for yielded skill calls @eddie-openai
- #47108 Preserve required Windows runtime variables for filesystem helpers @iceweasel-oai
- #47112 Lowercase the retry hint for conversations open in another app @fcoury-oai
- #47113 Persist thread creator identity in rollouts and SQLite @nornagon-openai
- #47114 Preserve and expose thread item lifecycle timestamps @chiam-oai
- #47116 Honor the configured product SKU in remote plugin requests @jessedu-oai
- #47118 Support model-catalog overrides for Code Mode tool messages @rhan-oai
- #47121 Pass thread IDs to attachment uploads @kchainani-oai
- #47122 Increase OpenAI file blob upload timeout from 60 seconds to 5 minutes @wilkes-oai
- #47125 Add extra policy configuration for Guardian reviews @won-openai
- #47129 Preserve foreign working directories in extension tool environments @anp-oai
- #47130 Remove the `ultrafast` service tier from `gpt-5.6-sol` @andrewgu-oai
- #47132 Support caller-provided MITM CAs in the network proxy @viyatb-oai
- #47137 Prevent horizontal transcript selection from triggering autoscroll @imac-oai
- #47142 Honor system proxy settings for standalone web search @celia-oai
- #47143 Extract exec-server CLI startup into a dedicated module @anp-oai
- #47149 Update code mode catalog snapshot hashes @andrewgu-oai
- #47155 Ignore stale thread-close notifications after resuming a thread @etraut-openai
- #47158 Harden gateway OAuth credential persistence and error redaction @alexsong-oai
- #47159 Expose HTTP origins in MCP server status @frantic-openai
- #47162 Apply workspace routing to Guardian v2 classifier requests @acrognale-oai
- #47170 Add explicit gateway login control and authentication status @alexsong-oai
- #47174 Preserve empty cell metadata under pending tool-call pressure @ningyi-oai
- #47178 Enable the fullscreen transcript by default @etraut-openai
- #47179 Enable automatic daemon startup by default @etraut-openai
- #47185 Allow forking conversations locked by another app in the TUI @fcoury-oai
- #47191 Render aligned equations and optimization notation in TUI math @etraut-openai
- #47199 Separate thread preparation from execution persistence @dermanyang-oai
- #47204 Resolve proxy routes for standalone web search redirects @celia-oai
- #47207 Add explicit gateway OAuth sign-in to app-server @alexsong-oai
- #47212 Preserve MCP request trace context across transport workers @bromano-oai
- #47235 Route multi-agent spawning through `SpawnRequest` @jif-oai
- #47236 Suppress agent message board notifications to the post author @jif-oai
- #47240 Prevent V2 agent eviction from racing with queued messages @jif-oai
- #47244 Centralize agent resume handling in `LocalAgentControl` @jif-oai
- #47248 Add explicit app and account targets to MCP resource reads @victor-openai
- #47249 Drop descendant channel posts from retained remote compaction v2 history @jif-oai
- #47252 Return agent snapshots from `close_agent` @jif-oai
- #47257 Preserve explicit message-board unsubscribes when posting @jif-oai
- #47258 Test spawn settings reporting after child removal @jif-oai
- #47259 Subscribe authors to message-board channels created by posting @jif-oai
- #47263 Expose hosted plugin extensions in app-server summaries @victor-openai
- #47267 Stream agent snapshots from local status subscriptions @jif-oai
- #47271 Implement `AgentControl` for `LocalAgentControl` @jif-oai
- #47272 Allow Guardian sync review across compaction hash differences @felixxia-oai
- #47275 Enable Guardian thread context by default @felixxia-oai
- #47281 Add regression coverage for message board unsubscribe persistence @jif-oai
- #47287 Update the Guardian extra-policy snapshot for retained instructions @felixxia-oai
- #47292 Consolidate agent operations in the `AgentControl` implementation @jif-oai
- #47301 Separate local agent runtime state from controller handles @jif-oai
- #47302 Use compact display metadata for Guardian review threads @charliemarsh-oai
- #47303 Clean up legacy Guardian thread metadata in SQLite @charliemarsh-oai
- #47317 Enable `/import` in remote and local daemon sessions @etraut-openai
- #47318 Offer explicit recovery for incompatible background servers @etraut-openai
- #47319 Match agent status symbols to the selected row style @etraut-openai
- #47320 Fix Escape navigation in read-only agent sessions @etraut-openai
- #47321 Honor the system clock preference across more TUI timestamps @etraut-openai
- #47322 Render TUI Markdown lists with Unicode bullets and checkboxes @etraut-openai
- #47323 Persist resume metadata in compaction checkpoints @owenlin0
- #47325 Keep report reason tags within Sentry limits @ningyi-oai
- #47326 Restrict MCP OAuth authorization endpoints to HTTP(S) @viyatb-oai
- #47327 Preserve image generation request IDs on failure @chrisdong-oai
- #47329 Standardize TUI menu description wording and punctuation @etraut-openai
- #47330 Identify failed SQLite databases in `codex doctor` output @dkovalenko-oai
- #47331 Avoid redundant spacing above the transcript composer @fcoury-oai
- #47332 Add GPT-6 Sol and Luna to the model catalog @andrewgu-oai
- #47338 Move the activity inspection hint into keyboard shortcut help @fcoury-oai
- #47340 Add conditional turn interruption that preserves pending input @pmccrary-oai
- #47342 Skip stored title lookups for ephemeral forks @keyz
- #47347 Add GPT-6 Sol and Luna to Amazon Bedrock catalogs @celia-oai
- #47348 Overlap subagent spawn persistence and clean up cancelled children @owenlin0
- #47349 Move plugin recommendations into developer context @adaley-openai
- #47350 Reuse cloud skill catalogs across turns until invalidated @hlevy-openai
- #47353 Preserve `invalid_prompt` as a distinct error classification @rennie-openai
- #47355 Reserve spacing after recaps at the transcript tail @fcoury-oai
- #47358 Color paths and URLs in `codex doctor` by check status @dkovalenko-oai
- #47360 Preserve user prompt URL destinations across terminal widths @fcoury-oai
- #47361 Restrict Windows sandbox default object access to the logon session @viyatb-oai
- #47362 Bound inbound exec-server requests across client transports @viyatb-oai
- #47365 Resume model context from the latest compaction boundary @owenlin0
- #47369 Overlap agent metadata reads when resuming a V2 root @vkg-oai
- #47375 Add an opt-in preference for the local MXC sandbox @iceweasel-oai
- #47377 Add opt-in reasoning status for realtime V3 delegations @guinness-oai
- #47380 Route TUI voice controls through the app @etraut-openai
- #47381 Keep voice conversations running across TUI thread navigation @etraut-openai
- #47382 Show a voice badge in the agents overview @etraut-openai
- #47384 Restore composer hints after clearing selection at the transcript bottom @fcoury-oai
- #47389 Enforce network policy throughout HTTP and WebSocket requests @acrognale-oai
- #47393 Retry transient OpenAI file blob upload failures @mtsui-oai
- #47397 Refresh bundled model metadata and instructions @andrewgu-oai
- #47399 Respect tmux mouse settings in fullscreen and overlays @fcoury-oai
- #47407 Enforce application network policy across app-server requests @acrognale-oai
- #47408 Enforce application network policy for AWS auth and telemetry @acrognale-oai
- #47410 Honor network policy in remote control and recover remote execution @acrognale-oai
- #47411 Apply shared network policy throughout embedded Codex startup @acrognale-oai
- #47413 Cache decrypted gateway OAuth secrets per backend @charliemarsh-oai
- #47414 Support Shift-click to extend transcript selections @etraut-openai
- #47417 Use native scrollback for Terminal.app over SSH in auto mode @fcoury-oai
- #47422 Recover unsent question drafts when TUI turns end @imac-oai
- #47423 Preserve history search during background draft recovery @imac-oai
- #47424 Clear pending async question notifications when turns end @imac-oai
- #47428 Apply inherited environment settings at turn boundaries @sayan-oai
- #47435 Allow environment selection updates during an active turn @sayan-oai
- #47437 Stabilize retry timing and WebSocket tests @anp-oai




## rust-v0.156.1 — 2026-09-23

## New Features

- Choose GPT-6 Sol or GPT-6 Luna from the model picker. The rate-limit switch prompt now recommends GPT-6 Luna. (#47405)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.156.0...rust-v0.156.1

- #47405 [hotfix 0.156.0] Add GPT-6 Sol and Luna to the model catalog (#47332) @imac-oai




## rust-v0.156.0 — 2026-09-22

## New Features

- Choose an optional fullscreen UI with `/tui` for your next launch, including transcript search, mouse selection, and right-click copying. (#46732, #46734, #46883, #46895)
- Voice conversations are enabled by default, with an F8 toggle, a `/voice settings` picker, and bundled audio runtimes for Linux and Windows. (#44921, #46071, #44622, #44714, #44922)
- Explore account usage, token totals, and plugin and skill activity through the `/usage` analytics dashboard. (#45764, #45769)
- Filter tasks by status and create worktree sessions from the agent command center; worktree support is now enabled by default. (#46839, #45276, #44870)
- Customize the terminal with six new themes and view supported Mermaid diagrams and display equations directly in responses. (#46504, #46054, #45612)
- Update the local background server through `/daemon`, or bypass it with `--no-daemon`. (#45854, #46088)

## Bug Fixes

- Preserve streamed answers and plans when turns fail, are interrupted, or receive subagent completion events. (#45549, #46867)
- Fix clipboard forwarding in tmux and SSH sessions and preserve tab indentation when terminals send pasted text as individual keystrokes. (#45457, #45454)
- Restore Plan mode when resuming sessions and preserve thread identity and settings when editing earlier prompts. (#45519, #45845)
- Recover login through system proxies and refresh MCP credentials when OAuth discovery returns a 503 error. (#46562, #44636)
- Prevent speech from being dropped during playback pauses or bursts of incoming audio. (#46880)
- Close sandbox isolation gaps involving inbound Windows connections, privileged Linux/macOS sockets, and writes through read-only macOS file handles. (#44639, #45984, #46500)

## Documentation

- Clarify that deprecated `friendly` and `pragmatic` personality settings no longer select response styles. (#45809)
- Explain how `?` matches a single character in network proxy allow and deny patterns. (#46027)

## Chores

- Update bundled TLS dependencies, including OpenSSL 3.6.4 for Linux musl builds. (#45149, #45489)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.155.0...rust-v0.156.0

- #44606 Preserve whole diagnostic attachments and report incomplete uploads @chess-oai
- #44611 Preserve root turn attribution in turn-start events @owenlin0
- #44613 Enable user verification for local Codex Desktop sessions @riley-oai
- #44615 Treat non-interactive dumb terminals as warnings in `codex doctor` @etraut-openai
- #44616 Simplify enterprise OAuth login helpers and expand callback tests @nicksteele-oai
- #44617 Invalidate cached Guardian approvals for unscored permission widening @jif-oai
- #44619 Allow discarded code mode tool responses to be garbage collected @jif-oai
- #44620 Support temporary and minimal filesystem grants in MXC @iceweasel-oai
- #44622 Add `/voice settings` to choose a voice for future conversations @bc-openai
- #44626 Add bounded environment transport for MXC launch requests @iceweasel-oai
- #44628 Expose session analytics state in Responses turn metadata @marksteinbrick-oai
- #44629 Add manual callback input to MCP OAuth login @willwang-openai
- #44631 Focus the task list when reopening the agent command center @etraut-openai
- #44636 Recover OAuth metadata discovery from 503 responses via OIDC @malsamiri-oai
- #44639 Block non-loopback inbound traffic for the Windows offline sandbox @viyatb-oai
- #44646 Honor thread analytics opt-outs when using shared clients @priyanshusingh-de
- #44650 Enforce managed model provider selection and definitions @alexsong-oai
- #44651 Keep command center errors visible and preserve drafts @etraut-openai
- #44654 Preserve missing environment variable diagnostics in Codex Doctor @etraut-openai
- #44655 Honor thread-level plugin exclusions across runtime capabilities @mzeng-openai
- #44656 Attribute turn metrics to the models used during the turn @eternal-openai
- #44658 Keep Windows sandbox private desktops alive across helper exits @chess-oai
- #44659 Preserve turn triggers across delegated agent work @joeytrasatti-openai
- #44661 Trace tool call receipt, result readiness, and code-mode dispatch @anp-oai
- #44666 Honor system reduced-motion preferences in the TUI @imac-oai
- #44669 Resolve filesystem denials with explicit path context @seanh-oai
- #44670 Restrict login setup redirects to known platform origins @hintz-openai
- #44671 Keep voice sessions alive through mute and audio backlog @bc-openai
- #44675 Refresh global instructions at model-request boundaries @vkg-oai
- #44676 Resolve permission profiles with explicit execution-host path context @seanh-oai
- #44691 Warn about ignored configuration settings @andrewgu-oai
- #44693 Preserve selected profile settings over managed new-thread defaults @alexr-oai
- #44694 Include the Windows sandbox service in release artifacts @johnl-oai
- #44701 Add a provider for thread-scoped instructions @vkg-oai
- #44711 Return to the command center after session cancellation or deletion @etraut-openai
- #44714 Bundle Linux voice runtimes and improve audio reliability @bc-openai
- #44732 Clarify folder trust prompts and add restricted widget support @etraut-openai
- #44742 Preserve editor yanks across new sessions and thread switches @bc-openai
- #44744 Make archive confirmation number shortcuts act immediately @etraut-openai
- #44746 Check folder trust after resolving the startup destination @etraut-openai
- #44747 Update `quinn-proto` and allow the pinned H3 Git source @richardopenai
- #44749 Preserve voice caption order when replaying TUI history @bc-openai
- #44752 Render Markdown in agent overview task details @etraut-openai
- #44755 Check folder consent before creating or resuming TUI tasks @etraut-openai
- #44814 Test approved command execution with managed unified exec disabled @jif-oai
- #44826 Expose advertised MCP server capabilities in status responses @gpeal
- #44832 Add trusted enterprise MCP auth configuration @nicksteele-oai
- #44857 Add consistent theme-based thread colors across the TUI @etraut-openai
- #44862 Preserve parent cache affinity for ephemeral forks @jif-oai
- #44865 Scope code mode callback delegates to individual executions @abhinav-oai
- #44866 Preserve originating context for yielded code-mode tool calls @abhinav-oai
- #44867 Preserve originating budgets for code mode notifications @abhinav-oai
- #44870 Enable worktrees by default and clarify local daemon errors @bc-openai
- #44872 Add managed network policy support to the Windows MXC sandbox @iceweasel-oai
- #44877 Return public key metadata from user verification enrollment @riley-oai
- #44879 Fade Astra composer stars and stabilize cursor redraws @imac-oai
- #44883 Reject token-budget history notes for unsupported starting models @jif-oai
- #44893 Expose available access programs in model discovery @faizan-oai
- #44903 Wire up the native Windows MXC helper entry point @iceweasel-oai
- #44905 Expose disabled plugin settings in the app-server API @mzeng-openai
- #44915 Remove the deprecated `thread/rollback` API @owenlin0
- #44921 Enable TUI voice conversations by default @bc-openai
- #44922 Bundle native voice runtimes in Windows releases @bc-openai
- #44924 Refresh the speaker format when restarting voice output @bc-openai
- #44925 Accept voice response audio before captions on quiet turns @bc-openai
- #44928 Preserve voice meter history through quiet samples @bc-openai
- #44930 Embed friendly instructions in bundled GPT-5.4 and GPT-5.5 @rhan-oai
- #44931 Stop setting `YARN_NO_PROXY` in the managed proxy environment @viyatb-oai
- #44932 Unify context snapshots and group requests into windows @pakrym-oai
- #44933 Remove Windows world-writable scans and warnings from the TUI @etraut-openai
- #44934 Add scenario snapshots for remote compaction and Code Mode tools @pakrym-oai
- #44935 Remove personality selection from the TUI @rhan-oai
- #44938 Add connector auth failure detection without an install URL @priyanshusingh-de
- #44939 Respect execution hosts in Windows sandbox setup @etraut-openai
- #44942 Clarify the Windows Visual C++ runtime notice for voice packages @bc-openai
- #44944 Enforce managed provider requirements on existing app-server threads @alexsong-oai
- #44945 Route TUI Windows sandbox setup through the app server @etraut-openai
- #44946 Retire Friendly and Pragmatic personality selection @rhan-oai
- #44948 Add context snapshots for async questions and plugin refresh @pakrym-oai
- #44952 Keep voice captions visible across speaker updates and history handoff @bc-openai
- #44957 Add model grouping to the agent command center @etraut-openai
- #44969 Open tasks managed elsewhere as read-only history in the command center @etraut-openai
- #44970 Show task tokens and usage estimates in the agent command center @etraut-openai
- #44976 Make context snapshot text rendering consistent @pakrym-oai
- #45035 Run DotSlash publishing directly on Ubuntu runners @charliemarsh-oai
- #45039 Use gzip compression level 6 for Codex package archives @charliemarsh-oai
- #45051 Consolidate Rust release artifact downloads @charliemarsh-oai
- #45089 Delay automatic recaps and compact their TUI layout @fcoury-oai
- #45090 Preserve conversation context and separate next actions in recaps @fcoury-oai
- #45094 Estimate history tokens from content instead of serialized envelopes @won-openai
- #45108 Cancel pending thread title generation after manual renames @fcoury-oai
- #45112 Use blueberry in the realtime background-agent test fixture @anp-oai
- #45116 Prevent multiline report notes from submitting early @etraut-openai
- #45124 Add a feature flag for asynchronous user messages @alishobeiri-oai
- #45135 Preview streaming prose before a newline arrives in the TUI @etraut-openai
- #45137 Remove Astra sparkle animation from the TUI composer @fcoury-oai
- #45149 Use OpenSSL 3.6.4 for musl builds @zm-oai
- #45169 Extract Windows sandbox setup and installation storage into the library @zm-oai
- #45176 Wire the Windows MXC sandbox into command execution @iceweasel-oai
- #45178 Split Windows sandbox cleanup into preparation and completion phases @zm-oai
- #45180 Extract shared network configuration and environment policy helpers @seanh-oai
- #45182 Validate Windows sandbox token groups before copying SIDs @zm-oai
- #45185 Bind direct tool-call metadata to invocation outputs @ningyi-oai
- #45224 Register Windows desktop uninstall ownership before sandbox setup @chess-oai
- #45248 Use captured step settings for request metadata and tool hooks @abhinav-oai
- #45255 Open new sessions directly from the command center @etraut-openai
- #45262 Route pastes into the active history search query @charliemarsh-oai
- #45271 Preserve terminal scrollback when growing the TUI viewport @fcoury-oai
- #45276 Add worktree session creation to the agents overview @etraut-openai
- #45312 Extract Windows sandbox configuration preparation into a helper @seanh-oai
- #45345 Publish opt-in provisioned macOS packages with Rust releases @riley-oai
- #45399 Cancel code mode timer tasks when cleared or the cell finishes @jif-oai
- #45409 Add session and originating window IDs to MCP request metadata @jif-oai
- #45413 Invalidate Guardian review sessions after parent history resets @jif-oai
- #45417 Extract guardian transcript selection into `guardian-context` @felixxia-oai
- #45418 Extract Guardian conversation bookkeeping into the reviewer crate @felixxia-oai
- #45420 Extract Guardian sampler execution into a dedicated module @felixxia-oai
- #45428 Avoid cloning MCP server status snapshot data @charliemarsh-oai
- #45439 Share tool output schemas and defer MCP envelope construction @charliemarsh-oai
- #45440 Share Apps tool catalogs without retaining unused snapshots @charliemarsh-oai
- #45441 Preserve Guardian parent response IDs across sampling requests @jif-oai
- #45445 Attribute command and plugin analytics to the invoking model @jwang-openai
- #45454 Preserve tabs in non-bracketed paste bursts @etraut-openai
- #45455 Refactor Windows sandbox setup and service helpers @zm-oai
- #45457 Fix clipboard routing for tmux and SSH sessions @fcoury-oai
- #45459 Resolve enterprise-managed MCP registrations in the catalog @nicksteele-oai
- #45461 Label rollout compression failures by stage and I/O error kind @jif-oai
- #45463 Allow dedicated listeners for managed network proxies @iceweasel-oai
- #45475 Fix fuzzy match scoring within Unicode lowercase expansions @etraut-openai
- #45487 Retain thread persistence acquisition through session cancellation @jif-oai
- #45489 Update `rustls` and AWS-LC dependencies in Cargo and Bazel lockfiles @zm-oai
- #45491 Remove Guardian subagent-spawner plumbing @felixxia-oai
- #45492 Split Guardian V2 async scoring into focused modules @felixxia-oai
- #45493 Make the Guardian deadline cancellation helper crate-private @felixxia-oai
- #45495 Expose effective login methods in config requirements @acrognale-oai
- #45496 Trace global user instruction loading @vkg-oai
- #45499 Send local TUI images as portable attachments to remote app servers @etraut-openai
- #45501 Render inline TeX math as Unicode in the TUI @etraut-openai
- #45502 Add managed thread lifetimes with cancellation-safe startup @jif-oai
- #45503 Add revocable network policy primitives to the HTTP client @acrognale-oai
- #45504 Allow ConPTY output to close after the last console client exits @iceweasel-oai
- #45505 Add lifecycle tracing for unified exec @anp-oai
- #45506 Allow background persistence for steered user input @bryanashley
- #45509 Share MCP tool specs until search results are selected @owenlin0
- #45513 Allow setting `daybreakEnabled` when starting a thread @faizan-oai
- #45515 Filter plugin-install test analytics by event type @zm-oai
- #45516 Allow configuring the Guardian prompt template @won-openai
- #45517 Use a dedicated mock server in the provider enforcement test @zm-oai
- #45518 Route Guardian reviewers through ThreadManager for inline parents @jif-oai
- #45519 Restore collaboration mode when resuming threads @etraut-openai
- #45520 Add dependencies to the Windows sandbox service @zm-oai
- #45521 Move Guardian reviewer startup into the pool @jif-oai
- #45524 Enable MXC TTY launches and managed networking in the exec server @iceweasel-oai
- #45526 Stage Python runtime wheels directly from package directories @charliemarsh-oai
- #45528 Compress larger Windows release artifacts first @charliemarsh-oai
- #45529 Expose selected workspace routing in app-server account reads @acrognale-oai
- #45533 Harden and share Windows sandbox identity helpers @zm-oai
- #45534 Honor explicit Unix socket grants in the Linux managed sandbox @viyatb-oai
- #45535 Classify tool analytics events by call origin @eddie-openai
- #45537 Move Guardian reviewer lifecycle into the extension @jif-oai
- #45542 Add service-managed package registration for Windows sandbox accounts @zm-oai
- #45543 Refactor image content to use a shared `ImageReference` type @kchainani-oai
- #45544 Discourage logging full image generation results @Gan-Tu
- #45546 Move daemon packages out of the standalone CLI installation @etraut-openai
- #45548 Honor prepared Unix socket permissions in Seatbelt @viyatb-oai
- #45549 Preserve streamed answers and plans when turns terminate @etraut-openai
- #45550 Add opt-in registered package execution to the Windows sandbox @zm-oai
- #45554 Use shared Bazel cache preparation in SDK CI @charliemarsh-oai
- #45556 Add attachment upload and resolution APIs and pass stores into sessions @kchainani-oai
- #45558 Seed missing daemon installs from complete local CLI packages @etraut-openai
- #45559 Resume Windows sandbox registration refresh after service restarts @zm-oai
- #45579 Copy current thread attachments into non-ephemeral forks @joeytrasatti-openai
- #45580 Add explicit daemon package replacement from the CLI @etraut-openai
- #45602 Fix retry classification for throttling and quota errors @sdcoffey
- #45612 Render standalone display math in the TUI @etraut-openai
- #45649 Add elicitation classification support to app and MCP analytics @priyanshusingh-de
- #45669 Centralize child agent configuration in the agent module @jif-oai
- #45670 Move V2 agent message delivery into `AgentControl` @jif-oai
- #45672 Consolidate Guardian reviewer lifecycle ownership @jif-oai
- #45676 Move spawned-agent interruption rules into `AgentControl` @jif-oai
- #45677 Move Guardian review reporting and denial accounting into the extension @jif-oai
- #45679 Retire the unused Guardian extension prototype API @felixxia-oai
- #45680 Restrict guardian assessment parsing and circuit breaker visibility @felixxia-oai
- #45683 Consolidate guardian transcript tests in `guardian-context` @felixxia-oai
- #45684 Pass `ReviewModel` through guardian review sessions @felixxia-oai
- #45693 Move Guardian approval routing into the reviewer extension @jif-oai
- #45711 Add startup tool allowlists for threads @jif-oai
- #45716 Classify MCP auth and approval outcomes in analytics @priyanshusingh-de
- #45729 Move Guardian reviewer configuration into the extension @jif-oai
- #45730 Separate executor sandbox selection from Windows sandbox levels @iceweasel-oai
- #45736 Route Guardian requests through `/responses` with identifying headers @jif-oai
- #45737 Separate Windows sandbox implementations from legacy setup modes @iceweasel-oai
- #45739 Add typed account analytics reports to the backend client @fcoury-oai
- #45740 Add account analytics data normalization to the TUI @fcoury-oai
- #45741 Add token history and credit formatting helpers for analytics @fcoury-oai
- #45742 Add account-bound authentication for analytics requests @fcoury-oai
- #45746 Explicitly gate DotSlash publishing on release success @chess-oai
- #45749 Extract reusable Bash and Zsh startup scripts @jif-oai
- #45755 Honor canonical plugin disables for shared connectors @mzeng-openai
- #45757 Wire Windows sandbox selection into managed proxy routing @iceweasel-oai
- #45760 Disable V8 optimization paths affected by array sort bugs @kliu128
- #45762 Load analytics reports with server plans and account identity checks @fcoury-oai
- #45763 Add stacked chart primitives for account analytics @fcoury-oai
- #45764 Add an account analytics dashboard to `/usage` @fcoury-oai
- #45765 Add Top chats to usage analytics @fcoury-oai
- #45766 Add gated plan usage history to TUI analytics @fcoury-oai
- #45768 Add consumer Top chats usage analytics @fcoury-oai
- #45769 Add an account Summary tab to Analytics @fcoury-oai
- #45770 Improve analytics chart readability and navigation @fcoury-oai
- #45772 Expose experimental analytics plan history and improve navigation @fcoury-oai
- #45779 Use native process identities for PID-managed daemons @etraut-openai
- #45780 Allow daemon updates to restore pinned packages to latest stable @etraut-openai
- #45781 Normalize bullet glyphs in the image preparation disconnect snapshot @jgershen-oai
- #45782 Preserve Guardian authorization evidence across checkpoint migration @felixxia-oai
- #45789 Preserve Guardian evidence during checkpoint migration @felixxia-oai
- #45794 Support image references by file ID in inputs and tool outputs @kchainani-oai
- #45796 Preserve `ImageUserInput` in the Python SDK @kchainani-oai
- #45799 Complete Windows sandbox uninstall cleanup @chess-oai
- #45805 Preserve MCP App UI metadata in tool-call events and history @victor-openai
- #45806 Restrict plugin install requests to the root thread @rennie-openai
- #45807 Record interrupted turns in managed daemon recovery snapshots @etraut-openai
- #45809 Retire the personality feature flag and document deprecated settings @rhan-oai
- #45811 Bound WSL terminal detection and handle inconclusive probes safely @etraut-openai
- #45812 Add workspace routing support for Responses requests @acrognale-oai
- #45813 Track Windows sandbox policy and per-thread executor hosts in the TUI @etraut-openai
- #45817 Add a bounded Mermaid text renderer @etraut-openai
- #45820 Continue interrupted work after managed daemon restarts @etraut-openai
- #45821 Use app-server state for TUI Windows sandbox decisions @etraut-openai
- #45822 Add opt-in response body limits to the HTTP transport @sergio-oai
- #45823 Run R2 publishing when release dependencies succeed @dkumar-oai
- #45825 Add opt-in nonfatal handling for clock read failures @vivi
- #45830 Use app-server configuration for Windows sandbox state in the TUI @etraut-openai
- #45831 Allow session-only model and reasoning selection in the TUI @etraut-openai
- #45837 Hide WSLg's duplicate root in restricted Linux sandboxes @etraut-openai
- #45845 Revert the current thread when editing an earlier TUI prompt @etraut-openai
- #45849 Preserve the app-server shutdown signal future across loop iterations @jgershen-oai
- #45852 Preserve executor path conventions in permission summaries @seanh-oai
- #45854 Add `/daemon` menu for local background server updates @etraut-openai
- #45863 Preserve executor path URIs in permission profile workspace roots @seanh-oai
- #45865 Reject paths in project documentation fallback filenames @etraut-openai
- #45900 Add a hidden HTTP/3 TCP tunnel command @richardopenai
- #45915 Make Code Mode wrappers transparent to Guardian model policies @jif-oai
- #45928 Bound model catalog decode errors and classify request timeouts @jif-oai
- #45933 Avoid redundant model catalog lookups in reused Guardian reviewers @jif-oai
- #45956 Record memory storage size after successful consolidation @jif-oai
- #45957 Centralize Guardian policy resolution in config and protocol @jif-oai
- #45960 Tag memory usage telemetry with the memory version @jif-oai
- #45964 Expose partial completion in rollout compression metrics @jif-oai
- #45966 Measure rollout read and materialization durations @jif-oai
- #45978 Keep selection adjacent when hiding tasks in the agents overview @etraut-openai
- #45980 Fall back to summary history for read-only conversations @etraut-openai
- #45981 Preserve session config when switching thread permission profiles @etraut-openai
- #45982 Use native DNS resolution for the network proxy on macOS @jdkula-openai
- #45983 Show a loading message when opening tasks from the agents overview @etraut-openai
- #45984 Isolate app-server Unix sockets from filesystem-restricted commands @etraut-openai
- #45985 Replace guardian review result tuples with named structs @felixxia-oai
- #45987 Centralize Guardian action preparation for review @felixxia-oai
- #46002 Extract route-aware HTTP request execution into a separate module @acrognale-oai
- #46004 Preserve attachment Unix socket grants when controller policy is omitted @open-matt
- #46006 Report clock failures again after recovery @anp-oai
- #46008 Route built-in permission selections through the app server @etraut-openai
- #46009 Centralize compaction checkpoint selection and validation @felixxia-oai
- #46010 Enable app tool result metadata with analytics controls @ningyi-oai
- #46011 Enforce managed residency when constructing API providers @andrewgu-oai
- #46013 Route permission shortcuts through the shared selection flow @etraut-openai
- #46015 Allow callers to disable executor skills per environment @vkg-oai
- #46019 Allow hosted Apps MCP contributions to override the protocol mode @teddywyly-oai
- #46020 Add an experimental rollout compression endpoint @jif-oai
- #46026 Centralize model-message resolution and rendering in `codex-prompts` @rhan-oai
- #46027 Document and test `?` wildcards in network proxy domain patterns @viyatb-oai
- #46029 Allow browser app cleanup hooks on interrupt @syuan-oai
- #46031 Keep Noise relay streams alive after repeated handshake failures @viyatb-oai
- #46032 Require forced macOS preferences for managed configuration @joeflorencio-openai
- #46033 Preserve orchestrator skill caches across MCP runtime updates @hlevy-openai
- #46035 Add per-app tool exposure configuration @ptiet-oai
- #46036 Preserve config error causes when saving the approvals reviewer @darius-oai
- #46038 Test Windows sandbox bin DACL modification permissions @zm-oai
- #46040 Default TUI animations off when a screen reader is detected @etraut-openai
- #46041 Tighten request handling in Guardian approval tests @jgershen-oai
- #46042 Add read-only policy support to MCP tool requests @rennie-openai
- #46043 Repair expired Windows sandbox account passwords during setup @zm-oai
- #46044 Include Code Mode tool metadata in compaction prompts @ningyi-oai
- #46047 Tag rollout compression metrics by trigger @jif-oai
- #46051 Track WebSocket continuation modes and full-input send reasons @vkg-oai
- #46054 Render Mermaid code blocks as diagrams in the TUI @etraut-openai
- #46058 Attribute analytics events to realtime voice sessions @chrisdong-oai
- #46063 Trim Guardian tests and tighten request layout assertions @felixxia-oai
- #46064 Consolidate Guardian tests at shared policy and context boundaries @felixxia-oai
- #46065 Route prepared images through the attachment store @kchainani-oai
- #46066 Keep MCP user interaction on the root thread @rennie-openai
- #46067 Remove the `done` prefix from TUI completion timestamps @etraut-openai
- #46069 Use syntax theme colors for inline code and file paths @etraut-openai
- #46070 Suppress warnings when skill descriptions are shortened @etraut-openai
- #46071 Add a configurable F8 shortcut for voice conversations @etraut-openai
- #46072 Account for file images in context budgets and Guardian reviews @kchainani-oai
- #46073 Bound code-mode output previews across result blocks @etraut-openai
- #46075 Use captured step settings when spawning subagents @rhan-oai
- #46077 Keep the composer responsive during Command Center session creation @etraut-openai
- #46081 Mark finished empty Code Mode tool inventories as complete @nf-openai
- #46088 Add `--no-daemon` to bypass the shared background server @etraut-openai
- #46096 Add a one-time composer starfield for new Astra tasks @imac-oai
- #46104 Pause TUI events in the agents overview regression test @etraut-openai
- #46107 Box app-server request handler futures to reduce stack usage @etraut-openai
- #46108 Replace Sites migration state with a runtime compatibility guard @jiwon-oai
- #46112 Preserve filesystem sandbox policy context when the cwd disappears @anp-oai
- #46116 Make TUI web and image activity summaries compact and descriptive @etraut-openai
- #46117 Add opt-in automatic background server startup @etraut-openai
- #46122 Route filesystem reads and writes by their own sandbox permissions @anp-oai
- #46123 Allow model catalogs to override the V2 `spawn_agent` description @rhan-oai
- #46125 Fix daemon socket isolation checks for private tmp mounts @open-matt
- #46126 Record daemon startup and update telemetry with consent handling @etraut-openai
- #46179 Include sender user messages in Guardian delegation reviews @jif-oai
- #46230 Preserve configured Flex tiers without catalog or fast-mode support @sdcoffey
- #46237 Improve Windows sandbox error details and registry cleanup @chess-oai
- #46239 Prefer the provisioning service for automatic Windows sandbox setup @zm-oai
- #46241 Repair Windows sandbox access to existing runtime children @chess-oai
- #46245 Publish Guardian cached scores and coverage atomically @felixxia-oai
- #46258 Preserve uploaded image file IDs in user message display history @kchainani-oai
- #46264 Relax delegation guidance in the v2 `spawn_agent` description @surajs-oai
- #46266 Expand Unicode math rendering with accents, symbols, and delimiters @etraut-openai
- #46268 Add filesystem accessors bound to environment permissions @anp-oai
- #46271 Enable MXC selection through Windows sandbox configuration @iceweasel-oai
- #46278 Reduce R2 release upload concurrency and enable standard retries @anp-oai
- #46279 Preserve Guardian's reusable history prefix across approval requests @jif-oai
- #46281 Connect app-server workspace discovery to model request routing @acrognale-oai
- #46288 Add opt-in overhead timing to code-mode responses @cassirer-openai
- #46291 Filter saved reasoning overrides from requests when disabled @felixxia-oai
- #46292 Preserve selected reasoning effort for synchronous Guardian reviews @felixxia-oai
- #46293 Route skill discovery and loading through `EnvironmentAccess` @anp-oai
- #46294 Separate thread startup metadata from replay history @charliemarsh-oai
- #46297 Support catalog descriptions for all multi-agent V2 tools @rhan-oai
- #46300 Centralize OAuth login and refresh handling with safer diagnostics @alexsong-oai
- #46302 Validate network socket policies using the executor OS @seanh-oai
- #46303 Serialize release asset uploads to avoid secondary rate limits @imac-oai
- #46305 Avoid cloning turn items for app-server active turn lookups @charliemarsh-oai
- #46306 Preserve bio policy errors as a distinct non-retryable error @rennie-openai
- #46309 Preserve plugin caches across display metadata refreshes @vkg-oai
- #46310 Defer environment selection changes until the next turn @sayan-oai
- #46318 Add OAuth credential management for model provider gateways @alexsong-oai
- #46319 Preserve web search actions and results in exec JSON output @etraut-openai
- #46322 Set the Windows sandbox type in the pending environment test @sayan-oai
- #46323 Record active plugin inventory in turn analytics @marksteinbrick-oai
- #46324 Broaden compaction fallback to the current model @aibrahim-oai
- #46328 Avoid persisting project trust for projectless directories @viyatb-oai
- #46330 Move retry backoff into `codex-async-utils` @bolinfest
- #46331 Defer environment network policy validation until after composition @seanh-oai
- #46332 Dim conversation recaps in the TUI @etraut-openai
- #46333 Handle disabled Windows sandbox accounts during cleanup @chess-oai
- #46334 Share platform identity across path, network, and sandbox configuration @seanh-oai
- #46335 Keep MCP policy evaluation consistent with turn environments @sayan-oai
- #46482 Handle unknown error classifications and configure gateway OAuth @etraut-openai
- #46486 Make TUI async question replies compatible with desktop @etraut-openai
- #46487 Keep TUI exploration grouped across reasoning and nonzero exits @etraut-openai
- #46488 Split analytics tests into focused suites @rhan-oai
- #46490 Compose gateway OAuth with primary provider authentication @alexsong-oai
- #46492 Unify TUI tool output previews with a three-row limit @etraut-openai
- #46493 Allow `/review` during MCP startup @etraut-openai
- #46494 Keep remote workspace roots under server control @etraut-openai
- #46495 Preserve the provisioned macOS CLI's code-signing identity @riley-oai
- #46498 Allow worktree sessions to use an existing local daemon @etraut-openai
- #46499 Allow approved escalation with environment-owned network policies @sayan-oai
- #46500 Block mutating fcntls in restricted macOS Seatbelt policies @nornagon-openai
- #46501 Add configuration and feature diagnostics to report metadata @pakrym-oai
- #46503 Use catalog model display names throughout the TUI @etraut-openai
- #46504 Add six bundled TUI themes and theme-aware accents @etraut-openai
- #46505 Support catalog parameter schemas for Multi-Agent V2 tools @rhan-oai
- #46506 Share ChatGPT cookies between HTTP and WebSocket transports @jif-oai
- #46507 Run Windows sandbox tests exclusively when local @jif-oai
- #46508 Refresh the model catalog before turns after auth changes @jif-oai
- #46509 Flush completed Guardian reviews before delivering decisions @jif-oai
- #46510 Avoid cloning active turn items for metadata-only thread resumes @charliemarsh-oai
- #46511 Avoid cloning excluded turn items during thread resume @charliemarsh-oai
- #46512 Capture Guardian review checkpoints from live context @jif-oai
- #46513 Rename `AgentControl` to `LocalAgentControl` @jif-oai
- #46514 Replay guardian checkpoints into a fresh session in tests @jif-oai
- #46516 Handle completion timing in the multi-agent resume test @jif-oai
- #46517 Stabilize the TUI exit interruption test @jif-oai
- #46518 Handle delayed process startup in the Guardian network approval test @jif-oai
- #46519 Use paused time in sampler and model catalog timeout tests @jif-oai
- #46521 Use macOS member fallback in shared process-group termination helpers @jif-oai
- #46522 Enable Guardian parent-compaction reuse by default @felixxia-oai
- #46523 Default local binding to true for MXC managed networking @iceweasel-oai
- #46524 Retry busy executable launches in packaged daemon tests @felixxia-oai
- #46527 Pin WinGet publishing dependencies in the release workflow @imac-oai
- #46528 Bind executor plugin measurements to the trusted plugin version @papayo-oai
- #46529 Allow compatible feature overrides when starting the shared daemon @etraut-openai
- #46530 Gate reasoning effort updates on explicit model support @felixxia-oai
- #46531 Preserve request-level reasoning effort for memory and title workers @felixxia-oai
- #46532 Remove `com.apple.runningboard` from Seatbelt platform defaults @nornagon-openai
- #46533 Disable reasoning summaries by default for new TUI threads @celia-oai
- #46534 Support `env_inherit` in `workspace_root_test` @bolinfest
- #46535 Allow unrelated namespace mounts in Linux sandbox socket checks @pash-openai
- #46539 Add a command-start callback for tool lifecycle extensions @papayo-oai
- #46540 Centralize retry decisions and delays in `CodexErr` @anp-oai
- #46541 Add opt-in compaction after final responses @hlevy-openai
- #46542 Add authenticated remote plugin measurement references @papayo-oai
- #46543 Add bounded filesystem path diagnostics to `codex doctor` @etraut-openai
- #46544 Expose declared onboarding skills in plugin details @victor-openai
- #46546 Skip skill discovery when injecting items into initialized threads @hlevy-openai
- #46547 Expose a backend-independent agent control contract @jif-oai
- #46548 Advertise the control socket's WebSocket message size limit @konsti-openai
- #46551 Add a composite action to build and smoke-test Codex packages @anp-oai
- #46552 Move child completion routing into the agent controller @jif-oai
- #46553 Return `LiveAgent` records from agent listing @jif-oai
- #46554 Always use private desktops for legacy Windows sandboxes @iceweasel-oai
- #46555 Track executor registrations across connection refresh and recovery @viyatb-oai
- #46556 Keep step settings and approval environments consistent @sayan-oai
- #46557 Fix active-turn environment selection lookup @sayan-oai
- #46558 Add shared plugin catalog discovery APIs @TAFOYA-OAI
- #46559 Encapsulate rollout budget accounting in `LocalAgentControl` @jif-oai
- #46560 Fix stale environment config in the network approval test @sayan-oai
- #46561 Support explicit provider model catalog URLs @andrewgu-oai
- #46562 Add system proxy fallback for login and startup requests @abhinav-oai
- #46564 Rename plugin MCP and app extension APIs @TAFOYA-OAI
- #46565 Preserve reasoning order in TUI activity groups @etraut-openai
- #46566 Allow recovery commands when the current thread is unavailable @etraut-openai
- #46567 Separate plugin catalog listing from package resolution @TAFOYA-OAI
- #46568 Use captured environment state for permissions and daemon recovery @sayan-oai
- #46569 Set explicit turn triggers for exec and TUI requests @eddie-openai
- #46570 Tag remote model fetch duration by authentication mode @andrewgu-oai
- #46571 Preserve macOS Seatbelt exclusions in scratch directories @nornagon-openai
- #46572 Add turn-start cloud plugin discovery to the MCP extension @TAFOYA-OAI
- #46573 Add a standalone network proxy binary with JSON configuration @viyatb-oai
- #46574 Notify users when asynchronous questions arrive in the TUI @etraut-openai
- #46575 Preserve Windows package identity for sandboxed descendants @zm-oai
- #46577 Allow thread instruction providers to share updates with subagents @vinh-gpt
- #46578 Fix standalone network proxy policy initialization @etraut-openai
- #46579 Limit the agent command center to 10 recent sessions on startup @etraut-openai
- #46580 Keep Guardian reviews on the applied instruction snapshot @jif-oai
- #46583 Deny XPC service lookups in macOS Seatbelt profiles @nornagon-openai
- #46659 Move local child-process spawning into `codex-utils-pty` @charliemarsh-oai
- #46660 Make local child process launch settings explicit @charliemarsh-oai
- #46661 Avoid fork when spawning macOS filesystem helpers @charliemarsh-oai
- #46673 Extend server version notices to prerelease and local clients @etraut-openai
- #46680 Improve TUI contrast, keyboard hints, and picker layouts @etraut-openai
- #46691 Standardize TUI picker presentation and fix wrapping boundaries @etraut-openai
- #46692 Unify TUI picker styling and improve compact layouts @etraut-openai
- #46694 Unify TUI completion popup styling and preserve result identity @etraut-openai
- #46695 Unify TUI prompts with shared picker styling and layouts @etraut-openai
- #46697 Unify TUI picker styling and improve compact session layouts @etraut-openai
- #46708 Preserve logical source text and styles across TUI wrapping @etraut-openai
- #46709 Add compact activity rendering and preserve transcript source text @etraut-openai
- #46710 Restore rich tool details in persisted TUI transcripts @etraut-openai
- #46711 Align persisted TUI activity groups and reasoning with live output @etraut-openai
- #46712 Recover executed tool call metadata under recorder capacity pressure @ningyi-oai
- #46714 Skip polling delays in the external queue lifecycle test @charliemarsh-oai
- #46715 Split shell snapshot credential tests into focused cases @charliemarsh-oai
- #46719 Extract the TUI transcript overlay into its own module @etraut-openai
- #46720 Cache transcript layouts across measurement and rendering @etraut-openai
- #46721 Anchor transcript scrolling to entries and bound viewport rendering @etraut-openai
- #46722 Cancel pending transcript Home jumps on subsequent navigation @etraut-openai
- #46731 Render dynamic tool activity and preserve TUI history ordering @etraut-openai
- #46732 Add selection and copying to the transcript viewer @etraut-openai
- #46733 Integrate the interactive transcript into the alternate-screen TUI @etraut-openai
- #46734 Add transcript search and per-activity detail controls @etraut-openai
- #46739 Add compact transcript browsing and prompt navigation to the TUI @etraut-openai
- #46749 Stabilize transcript and composer interactions in the TUI @etraut-openai
- #46750 Preserve startup drafts and submit them when the session is ready @etraut-openai
- #46751 Add a warning footer and dedicated warnings viewer to the TUI @etraut-openai
- #46752 Add an animated Codex logo to fresh conversations and onboarding @etraut-openai
- #46832 Add independent controls for TUI visual effects @etraut-openai
- #46835 Respect reduced motion in the voice UI @etraut-openai
- #46837 Improve agent command center rows and page navigation @etraut-openai
- #46838 Refine the agent command center layout and metadata editing @etraut-openai
- #46839 Add status filter tabs to the agent command center @etraut-openai
- #46840 Simplify agent command center hints and back navigation @etraut-openai
- #46844 Select read-only permissions for temporary structured threads @etraut-openai
- #46845 Honor the system clock preference in TUI completion timestamps @etraut-openai
- #46849 Move fullscreen transcript control to TUI configuration @etraut-openai
- #46855 Increase the default terminal probe timeout from 100 ms to 250 ms @etraut-openai
- #46856 Support stadium nodes in Mermaid terminal diagrams @etraut-openai
- #46857 Extract shared text selection helpers for the TUI @etraut-openai
- #46858 Add mouse selection and editing to the fullscreen composer @etraut-openai
- #46859 Limit the welcome logo animation to onboarding @etraut-openai
- #46861 Remove analytics TUI snapshots @etraut-openai
- #46862 Refresh analytics on identity changes and compact usage menus @etraut-openai
- #46863 Stabilize usage dashboard navigation and add keyboard help @etraut-openai
- #46864 Improve usage report layouts and preserve reading positions @etraut-openai
- #46866 Enable mouse navigation in the TUI usage view @etraut-openai
- #46867 Preserve streamed answers when subagents finish @fcoury-oai
- #46877 Allow subagents to request MCP elicitation input @rennie-openai
- #46879 Count TUI launches by fullscreen transcript configuration @etraut-openai
- #46880 Preserve voice playback across pauses and packet bursts @etraut-openai
- #46882 Streamline agent command-center shortcuts and layout @etraut-openai
- #46883 Add `/tui` to choose the terminal UI mode for the next launch @fcoury-oai
- #46884 Enable plain clicks on transcript links and style bare URLs @etraut-openai
- #46895 Add right-click copying for transcript and composer selections @fcoury-oai
- #46897 Honor the effective terminal color level in activity charts @etraut-openai
- #46899 Make transcript list spacing uniform after streaming @fcoury-oai
- #46902 Hide Back to bottom when the current transcript tail is visible @fcoury-oai
- #46905 Identify local background servers in `/status` @etraut-openai
- #46910 Preserve transcript position when opening settings pickers @etraut-openai
- #46912 Keep quota warnings visible in the TUI @fcoury-oai
- #46917 Enforce current provider requirements for the model catalog @alexsong-oai
- #46922 Fix realtime V3 transcript reconciliation for handoffs @etraut-openai
- #46929 Remove the `Error` prefix from TUI `config.toml` load errors @etraut-openai
- #46931 Use shared, keymap-aware tips in the fullscreen composer @etraut-openai
- #46938 Add independent TUI rendering toggles for Mermaid, math, and tables @etraut-openai
- #46946 Populate the agents overview from background tool responses @etraut-openai
- #46952 Preserve metadata in native user verification requests @teddywyly-oai
- #46959 Add shared agent message-board extension interfaces @jif-oai
- #46962 Avoid exposing config values in `codex doctor` errors @jif-oai
- #46966 Add SQLite storage for local agent message boards @jif-oai
- #46978 Implement paginated queries for the local agent message board @jif-oai
- #46979 Index channel posts by timestamp for latest-message lookups @jif-oai
- #46981 Canonicalize the workspace trust key in the doctor config test @jif-oai
- #46985 Add collaboration tools for the agent message board @jif-oai
- #46989 Expand agent message board tool integration coverage @jif-oai
- #46993 Clarify Bazel lockfile verification failures @jif-oai
- #46994 Route agent delivery through captured send requests @jif-oai
- #46999 Decouple tool restrictions from session identity with `ToolPolicy` @felixxia-oai
- #47010 Add agent inspection without restoring unloaded runtimes @jif-oai
- #47017 Wire agent message boards into persistent multi-agent runtimes @jif-oai
- #47026 Add diagnostics for rollout compression metadata failures @jif-oai
- #47028 Align message-board tools with the multi-agent namespace @jif-oai
- #47029 Delete persisted message boards with their root threads @jif-oai
- #47030 Preserve ordered assistant context in Guardian reviews @felixxia-oai
- #47035 Defer extension tool history materialization until first access @charliemarsh-oai
- #47036 Share stored JSON payloads across code mode cells with `Arc` @charliemarsh-oai
- #47038 Cache OS discovery for user agents and telemetry @charliemarsh-oai
- #47039 Preserve delivered messages through post-tool hook failures @felixxia-oai
- #47042 Recover corrupt message-board storage during thread deletion @jif-oai
- #47049 Share SQLite pools across local agent message-board handles @jif-oai
- #47050 Batch message-board subscriber reads into one SQLite result @jif-oai
- #47055 Fetch local message board thread summaries in one query @jif-oai




## rust-v0.155.1 — 2026-09-18

## Bug Fixes

- New local TUI sessions now leave reasoning summaries disabled by default, fixing request rejection by providers that do not support them. Explicit reasoning-summary settings remain respected. (#46467)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.155.0...rust-v0.155.1

- #46467 Restore none as the TUI reasoning summary default (@celia-oai)




## rust-v0.155.0 — 2026-09-17

## New Features

- Added experimental `/voice` conversations with live transcripts and microphone controls on supported builds, enabled through `/experimental`. (#43581, #43651, #44331)
- The TUI now shows live reasoning summaries in the status row and completion timestamps after successful turns. (#43558, #43921)
- Added task hiding, archiving, and deletion in the agents overview, plus worktree ownership details and confirmed deletion of clean managed worktrees. (#43942, #44424, #44433)
- Added Touch ID verification for MCP requests in local TUI sessions on supported Macs. (#43624, #43712, #43715)
- Added configurable daemon update schedules and `codex app-server daemon update`; saved threads and active goals can recover after daemon restarts. (#43542, #43562, #44314)
- Amazon Bedrock can now obtain AWS credentials from configured commands, with caching, expiration-based refresh, and authentication recovery. (#44028)

## Bug Fixes

- Accepted prompts are now saved even when compaction fails before a turn starts. (#44487)
- Fixed missed tmux resizes, transcript viewport restoration, and stale history appearing after switching threads. (#43603, #43889, #43994)
- MCP servers now report expired OAuth credentials accurately and provide reconnect guidance when token refresh fails. (#43947, #44359)
- Automatic approval reviews now preserve complete actions and authorization evidence more reliably, retry transient failures, and distinguish review failures from unsafe-action findings. (#44482, #44569, #44570)
- Switching accounts now invalidates remote-control sessions, cached WebSocket state, and model catalogs belonging to the previous identity. (#43906, #44341, #44489)
- Blocked Windows-process escapes from restricted WSL sandboxes and hardened brokered shell snapshots against credential exposure. (#44286, #43909, #44040)

## Chores

- Aligned Python SDK and runtime publishing with stable CLI releases, using matching versions and verifying runtime assets before SDK publication. (#44067)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.154.0...rust-v0.155.0

- #43521 Preserve standalone release pins during daemon updates @copyberry
- #43524 Restrict MCP user verification and add workspace-scoped identity @copyberry
- #43527 Discount an approval's own code-mode wrapper from Guardian score lag @copyberry
- #43529 Ensure the standalone updater runs on managed daemon starts @copyberry
- #43533 Fix jemalloc tools and compiler flags for Bazel musl builds @copyberry
- #43534 Preserve Guardian context sections and share planned-action rendering @copyberry
- #43538 Move Guardian permission context into the shared section registry @copyberry
- #43540 Preserve the multi-agent version when forking at a turn cutoff @copyberry
- #43542 Make app-server daemon automatic updates configurable @copyberry
- #43545 Preserve fork runtime versions without loading full model context @copyberry
- #43547 Add user-verification provider abstractions and RPC adapters @copyberry
- #43552 Record the launched app-server executable identity in PID files @copyberry
- #43558 Show completion timestamps after successful TUI turns @copyberry
- #43562 Add an explicit app-server daemon update command @copyberry
- #43568 Wire app-server user verification RPCs to the native provider @copyberry
- #43570 Manage synchronous Guardian reviewers through the thread manager @copyberry
- #43572 Make the managed app-server shutdown grace period configurable @copyberry
- #43576 Group adjacent computer actions in the TUI @copyberry
- #43581 Add live WebRTC voice conversations to the TUI @copyberry
- #43584 Remove a stale transcript field assignment from the TUI @copyberry
- #43595 Centralize bounded Guardian review evidence in guardian-context @copyberry
- #43597 Move trusted tool metadata into shared Guardian context @copyberry
- #43599 Move trusted skill evidence into the Guardian context registry @copyberry
- #43601 Move Guardian image selection into shared context sections @copyberry
- #43602 Move Guardian REPL evidence rendering into the shared context registry @copyberry
- #43603 Recover missed tmux resize notifications in the TUI @copyberry
- #43604 Exclude base instructions from the bundled model catalog @copyberry
- #43619 Add a stable TUI/app-server version comparison helper @copyberry
- #43621 Add worktree classification to thread telemetry @copyberry
- #43622 Warn when the connected Codex service is older than the CLI @copyberry
- #43624 Add macOS user verification with Secure Enclave signing @copyberry
- #43645 Expand TUI regression coverage for realtime voice conversations @copyberry
- #43651 Add voice mute shortcut and recording activity indicators @copyberry
- #43656 Animate live voice transcripts with split-flap tiles @copyberry
- #43676 Style spoken prompts and link workspace files in voice transcripts @copyberry
- #43683 Move voice controls into a dedicated composer strip @copyberry
- #43690 Make the voice mute shortcut configurable in the TUI @copyberry
- #43695 Stabilize realtime voice meter sampling across redraws @copyberry
- #43698 Make older app-server notices configurable in the TUI @copyberry
- #43699 Preserve split-flap animation state when voice transcripts scroll @copyberry
- #43702 Add a TUI user verification prompt component @copyberry
- #43704 Disable clock synchronization in the voice audio sink @copyberry
- #43708 Add TUI request bookkeeping for user verification @copyberry
- #43712 Enable MCP user verification in the TUI @copyberry
- #43715 Enable user verification for the bundled TUI on supported devices @copyberry
- #43790 Limit app-server storage metrics to session directories @copyberry
- #43795 Pin request reasoning effort while configuration overrides are active @copyberry
- #43796 Preserve reasoning effort through compaction and reset it on success @copyberry
- #43797 Add configurable memory versions with isolated storage @copyberry
- #43798 Batch non-user history eviction to preserve Guardian transcript deltas @copyberry
- #43799 Prioritize human evidence in memory v2 extraction @copyberry
- #43800 Add summary-only extraction for memory v2 @copyberry
- #43805 Centralize Guardian context composition @copyberry
- #43806 Centralize Guardian transcript policy in context profiles @copyberry
- #43808 Move v2 extraction chunking into the memory writer @copyberry
- #43813 Add dedicated memory v2 consolidation and read prompts @copyberry
- #43827 Add memory dual writing and v2 readiness reporting @copyberry
- #43842 Wait for parent idle before rollback in guardian fork tests @copyberry
- #43844 Add staged enterprise OIDC login and coordinated logout @copyberry
- #43846 Include completed commentary in the `/copy` picker @copyberry
- #43848 Preserve runtime workspace roots across thread resume @copyberry
- #43853 Add canonical permission translation for MXC execution requests @copyberry
- #43870 Close MCP stderr readers on client teardown @copyberry
- #43873 Handle undefined values before JSON serialization in code mode @copyberry
- #43876 Detach Unix hook commands from the controlling terminal @copyberry
- #43884 Close active network proxy connections on teardown @copyberry
- #43889 Fix transcript viewer restoration and half-page scrolling @copyberry
- #43894 Preserve thread identity in code-mode tool dispatch traces @copyberry
- #43895 Preserve `__oailb` routing cookies in ChatGPT HTTP clients @copyberry
- #43897 Persist provider and auth identity with model catalog caches @copyberry
- #43900 Propagate Apps tool refreshes to existing threads @copyberry
- #43903 Extract Windows deny-read glob scan planning into protocol @copyberry
- #43906 Scope model catalog caches to the current provider and auth identity @copyberry
- #43907 Preserve complete shell snapshot exports through filtering and replay @copyberry
- #43909 Protect shell snapshots when credential brokerage is enabled @copyberry
- #43912 Keep Guardian reviewers on summary-based compaction @copyberry
- #43913 Add tracing for project instructions and filesystem sandbox operations @copyberry
- #43915 Remove the repository devcontainer configurations @copyberry
- #43918 Expose the queued event count on `CodexThread` @copyberry
- #43921 Show streaming reasoning summaries in the TUI status row @copyberry
- #43925 Add cancellation for native user-verification RPCs @copyberry
- #43927 Rename thread artifacts to attachments in the state database @copyberry
- #43930 Avoid Windows sandbox setup for irrelevant proxy port changes @copyberry
- #43934 Track voice session lifecycle metrics in the TUI @copyberry
- #43936 Stabilize subagent and unified exec test fixtures @copyberry
- #43937 Tag TUI startup metrics with terminal and multiplexer categories @copyberry
- #43939 Add executor-context filesystem permission helpers @copyberry
- #43942 Show worktree owner details and add confirmed deletion @copyberry
- #43943 Gate new turn submissions on host shutdown admission @copyberry
- #43947 Surface MCP reconnect signals when expired OAuth tokens cannot refresh @copyberry
- #43948 Show configured app-server updater settings in doctor @copyberry
- #43949 Add transactional thread attachment mutations to the state runtime @copyberry
- #43950 Keep app-server thread RPCs active until delegated work completes @copyberry
- #43953 Preserve per-image generation IDs in image generation analytics @copyberry
- #43954 Cache protected shell snapshots and harden capture cleanup @copyberry
- #43956 Increase the TUI thread capability test stack to 12 MiB @copyberry
- #43959 Gate new app-server work during graceful shutdown @copyberry
- #43961 Use curly apostrophes in protocol error messages @copyberry
- #43966 Heap-allocate the resume future in the legacy history test @copyberry
- #43983 Bundle signed voice resources in macOS releases @copyberry
- #43994 Clear stale transcript history when switching threads @copyberry
- #44002 Encapsulate executed tool call metadata recording @copyberry
- #44025 Refresh workspace lockfile before building macOS voice releases @copyberry
- #44027 Support image attachments in agents overview background tasks @copyberry
- #44028 Add AWS credential export commands for Amazon Bedrock @copyberry
- #44032 Generate Python SDK types from repository app-server schemas @copyberry
- #44038 Handle copied credentials in the broker and shell snapshots @copyberry
- #44040 Harden credential handling in shell snapshots and replay @copyberry
- #44043 Use `StartThreadOptions` across thread fork APIs @copyberry
- #44049 Extract credential broker environment and registry helpers @copyberry
- #44053 Test Python SDK against the built CLI and installed runtime @copyberry
- #44055 Gate Python SDK publishing on runtime availability and verify PyPI files @copyberry
- #44056 Add configurable credential providers to the network proxy @copyberry
- #44060 Raise Guardian's action review limit to 200,000 bytes @copyberry
- #44061 Build Python SDK artifacts before publishing the runtime @copyberry
- #44062 Fix voice runtime release builds and packaging @copyberry
- #44066 Extend configured credential brokerage to embedded aliases @copyberry
- #44067 Publish Python packages after stable CLI releases @copyberry
- #44068 Preserve credential broker destinations across environment filtering @copyberry
- #44070 Reject empty audio payloads in data URLs @copyberry
- #44072 Support configured credential providers across shell snapshots @copyberry
- #44077 Refactor credential-broker tunnel protocol detection @copyberry
- #44080 Make staged macOS voice runtimes writable before packaging @copyberry
- #44084 Expose Python SDK history selection and per-turn options @copyberry
- #44086 Add untrusted external messages to the Python SDK @copyberry
- #44089 Support credential brokering in plaintext HTTP tunnels @copyberry
- #44101 Handle empty voice arguments in macOS release packaging @copyberry
- #44121 Reuse MCP bindings while cached servers remain dormant @copyberry
- #44138 Coordinate rollout compression with active thread writers @copyberry
- #44164 Add Guardian context cost and request token telemetry @copyberry
- #44166 Add aggregate budget enforcement for Guardian context @copyberry
- #44175 Attach compressed rollouts to diagnostic reports as JSONL @copyberry
- #44176 Reduce TUI stack usage during session transitions @copyberry
- #44181 Use explicit histogram buckets for Guardian context metrics @copyberry
- #44183 Release persistent writers when session startup is cancelled @copyberry
- #44198 Preserve voice indicator styles during composer sparkle effects @copyberry
- #44200 Use captured step settings when building model context @copyberry
- #44202 Use captured step model settings for extension context @copyberry
- #44207 Measure total exec-server request duration including queueing @copyberry
- #44226 Continue rollout searches when a compressed rollout cannot be searched @copyberry
- #44227 Extract Guardian review policy into a dedicated crate @copyberry
- #44238 Fix MCP elicitation cancellation and reset state on reconnect @copyberry
- #44241 Handle credential provider source remapping across config layers @copyberry
- #44242 Use captured step settings for tool planning and execution @copyberry
- #44243 Use the originating model when recording conversation history @copyberry
- #44248 Preserve tool output truncation budgets across resume and fork @copyberry
- #44249 Normalize image detail for the receiving model @copyberry
- #44250 Remove retired model entries while preserving migration prompts @copyberry
- #44252 Move synchronous Guardian orchestration into the reviewer extension @copyberry
- #44255 Always use streamed remote compaction for supported providers @copyberry
- #44259 Remove the Windows `/sandbox-add-read-dir` slash command @copyberry
- #44273 Remove the unused legacy remote compaction implementation @copyberry
- #44276 Avoid duplicate reasoning effort updates during turn recovery @copyberry
- #44277 Surface environment startup failure reasons to the model @copyberry
- #44281 Enforce complete request budgets for Guardian reviews @copyberry
- #44283 Persist loaded threads before managed daemon shutdown @copyberry
- #44284 Add telemetry for the Windows system config namespace @copyberry
- #44285 Preserve prewarmed reasoning effort across replay and early rollback @copyberry
- #44286 Block WSL interop escapes from restricted filesystem sandboxes @copyberry
- #44288 Prevent command hooks from hanging on blocked stdin @copyberry
- #44289 Expand MXC volume grants and resolve deny globs @copyberry
- #44290 Allow user-requested goal pauses through `update_goal` @copyberry
- #44293 Enforce the async Guardian classifier's complete input budget @copyberry
- #44297 Isolate the hook pipe I/O timeout test from shell startup files @copyberry
- #44298 Set turn triggers for guardian and memory requests @copyberry
- #44299 Record thread recovery candidates on managed daemon shutdown @copyberry
- #44307 Add opt-in provisioned macOS CLI release candidates @copyberry
- #44311 Honor shared Retry-After deadlines for remote control @copyberry
- #44314 Restore saved threads when the managed daemon restarts @copyberry
- #44318 Give hosted Codex Apps an independent MCP protocol opt-in @copyberry
- #44320 Block goals after three empty automatic continuation turns @copyberry
- #44325 Return the prompt hash in upload responses @copyberry
- #44327 Prevent filesystem-root read denies in the Windows sandbox @copyberry
- #44328 Clear pending TUI questions when accepting a new prompt @copyberry
- #44330 Add paginated thread attachment listing to the state runtime @copyberry
- #44331 Expose voice conversations in experimental features @copyberry
- #44332 Persist disabled plugin IDs in thread settings @copyberry
- #44336 Add bounded tool-result metadata support to executed tool calls @copyberry
- #44337 Return to the agent command center after archiving on shared servers @copyberry
- #44341 Bind remote-control sessions to their authentication owner @copyberry
- #44344 Open tasks with Right from the agents overview @copyberry
- #44346 Support native verification in MCP tool continuations @copyberry
- #44349 Distinguish forked sessions in session-start hooks @copyberry
- #44350 Add thread attachment operations with coordinated deletion @copyberry
- #44352 Remove path-bearing fields from Guardian review analytics @copyberry
- #44354 Extract shared footer hint wrapping in the TUI @copyberry
- #44359 Report OAuth authentication failures in MCP status snapshots @copyberry
- #44360 Return focus to the agents overview composer on Escape @copyberry
- #44377 Update the forked-thread hook test to use `StartThreadOptions` @copyberry
- #44392 Add opt-in model discovery for OpenAI API keys @copyberry
- #44400 Start Python SDK turn subscriptions at their attachment point @copyberry
- #44424 Add a hide shortcut to the agents overview @copyberry
- #44433 Add archive and delete actions to the agents overview @copyberry
- #44472 Harden Code Mode tool-call completeness tracking @copyberry
- #44482 Improve Guardian retries and review failure reporting @copyberry
- #44487 Preserve incoming prompts when pre-turn compaction fails @copyberry
- #44489 Reset cached WebSocket state when auth ownership changes @copyberry
- #44492 Distinguish HTTP quota errors from rate limits @copyberry
- #44493 Bound MCP descriptions separately from Guardian action JSON @copyberry
- #44521 Decouple session isolation from subagent attribution @copyberry
- #44523 Bound app-server stdio shutdown and handle Unix SIGTERM gracefully @copyberry
- #44536 Move Guardian reviewer settings and execution into the reviewer crate @copyberry
- #44544 Move Guardian reporting and denial accounting into the extension @copyberry
- #44548 Add MIME-filtered resource listing for Codex Apps @copyberry
- #44564 Add app-server APIs for stored thread attachments @copyberry
- #44569 Preserve complete actions in Guardian approval reviews @copyberry
- #44570 Preserve Guardian authorization evidence until request budgeting @copyberry
- #44571 Allow extensions to select MCP protocol mode per HTTP server @copyberry
- #44574 Use captured action settings for Guardian reviews @copyberry
- #44575 Tie network approval reviews to their originating execution @copyberry
- #44580 Support symbolic `:root` filesystem policies in MXC @copyberry
- #44586 Remove `repo_url` from skill invocation analytics events @copyberry




## python-v0.154.0 — 2026-09-10

Install with `pip install --upgrade openai-codex==0.154.0` (Python 3.10 or later). This release includes the matching `openai-codex-cli-bin==0.154.0` runtime.

- Add `max` and `ultra` reasoning-effort values. [#39662](https://github.com/openai/codex/pull/39662)
- Add `ExternalMessage` to synchronous and asynchronous `run()` and `turn()` calls. External content can start a turn or join an active regular turn with tool-level authority; it does not grant user authorization. Consumers receive independent event streams. [#44086](https://github.com/openai/codex/pull/44086)
- Add `include_turns` on resume/fork, `turn_service_tier` for one newly started turn, and `source` metadata. History selection changes the returned response, not model context. Existing defaults are preserved when these options are omitted. [#44084](https://github.com/openai/codex/pull/44084)
- Refresh generated protocol models and notifications, and preserve completion events that arrive before a turn-start response. [#44032](https://github.com/openai/codex/pull/44032), [#44400](https://github.com/openai/codex/pull/44400)

Check these migrations when upgrading:

- `HookMetadata` wraps its handler in `.root`. Replace accesses such as `hook.command` with `hook.root.command`, checking `hook.root.handler_type` before reading handler-specific fields.
- Some previously unknown notifications now have typed payloads. Read named fields instead of `.params`; unknown or invalid payloads still use `UnknownNotification`.
- Manually constructed or late-joining turn handles receive events from their attachment point. Earlier output is not replayed, so collected results can be partial; attaching after completion can raise `TransportClosedError`. Use `thread.read(include_turns=True)` for saved history. Handles returned directly by `thread.turn(...)` retain events from when their request is sent.

Custom `codex_bin` overrides require CLI 0.151.0 or newer for `ExternalMessage` and the new history/per-turn options.


## rust-v0.154.0 — 2026-09-09

## New Features

- GPT-6-Astra is now available in the model picker and Amazon Bedrock catalogs. (#42879, #42619)
- Experimental worktree support lets you create isolated checkouts for new or forked sessions using `--worktree` or `/worktree`, then browse and resume them. (#42652, #43069, #43120, #43286)
- Answer questions inline while Codex continues working, using suggested choices or custom text without losing your main draft. (#42891, #42894, #42897)
- Windows sessions can now share a background Codex server, with daemon lifecycle commands and managed updates. (#42405, #42392)
- Vim editing gains `R` replace mode with undo and dot-repeat, plus more reliable Escape handling in legacy terminals. (#42194, #42584)
- Copying responses preserves formatting in rich-text apps, and `/copy` can copy status output or individual session fields. (#42847, #43055)

## Bug Fixes

- Existing sessions pick up newly installed plugin tools and refresh skills and hooks after external plugin upgrades or rollbacks. (#42284, #42593, #42990)
- MCP connections coordinate OAuth token refreshes and surface login challenges when refresh fails, without automatically replaying rejected tool calls. (#42413, #42552)
- Startup avoids running workspace-controlled helpers before trust is established, and the macOS sandbox blocks terminal input injection. (#42324, #42590)
- Remote resume and fork operations preserve saved permissions; fresh sessions and forks respect server model defaults unless explicitly overridden. (#43330, #43177, #43355)
- Resuming a conversation open in another app now shows a read-only transcript with a retry option while preserving your draft. (#43253)
- Automatic approval reviews better preserve authorization context through compaction and reject approvals invalidated by new user instructions or answers. (#42844, #42852, #43442)

## Documentation

- Updated the bundled OpenAI Docs skill with GPT-6-Astra migration, compatibility, and prompting guidance. (#42931)

## Chores

- The deprecated `codex mcp-server` entry point is no longer available. (#42993)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.153.0...rust-v0.154.0

- #42188 Fix punctuation in npm packaging documentation @copyberry
- #42192 Use native spawning for bare macOS MCP commands @copyberry
- #42194 Add Vim replace mode to the TUI composer @copyberry
- #42196 Add managed worktree creation @copyberry
- #42199 Refactor shared TUI input routing @copyberry
- #42202 Separate TUI preferences from server configuration @copyberry
- #42204 Add macOS voice runtime projection @copyberry
- #42207 Retry TUI reconnects while threads are closing @copyberry
- #42208 Add GNU Linux voice runtime preparation @copyberry
- #42209 Add Windows voice runtime preparation @copyberry
- #42247 Track history notes thread hint outcomes @copyberry
- #42256 Skip Guardian scoring in User approval mode @copyberry
- #42270 Report the exec-server release version in environment info @copyberry
- #42284 Refresh plugin skills after out-of-process version changes @copyberry
- #42288 Fetch rules_rs zlib packages from Ubuntu snapshots @copyberry
- #42290 Expand Guardian history coverage across resume and rollback @copyberry
- #42293 Preserve verified answers across history compaction @copyberry
- #42298 Preserve retained answers across steer rollbacks @copyberry
- #42306 Stabilize the detached exec-server session resume test @copyberry
- #42309 Separate Windows sandbox provisioning from ACL refresh @copyberry
- #42314 Preserve target-native cwd in permission approval requests @copyberry
- #42316 Refactor exec-server startup futures @copyberry
- #42318 Support packaged managed Codex binary paths @copyberry
- #42319 Show live context compaction status in the TUI @copyberry
- #42320 Make the app-server thread unload delay configurable @copyberry
- #42324 Avoid executing PATH helpers before workspace trust @copyberry
- #42325 Render completed assistant messages directly during replay @copyberry
- #42326 Harden Windows control socket rendezvous @copyberry
- #42328 Support durable reasoning configuration updates @copyberry
- #42330 Protect Windows sandbox binaries from inherited write access @copyberry
- #42332 Package prepared runtimes with the voice host @copyberry
- #42334 Add a Windows sandbox provisioning protocol @copyberry
- #42337 Add an authenticated Windows sandbox provisioning client @copyberry
- #42341 Add Windows sandbox service lifecycle scaffolding @copyberry
- #42342 Harden Windows sandbox provisioning file handling @copyberry
- #42344 Prepare managed policy validation for Windows sandbox provisioning @copyberry
- #42348 Add Windows sandbox client authentication @copyberry
- #42351 Enable authenticated Windows sandbox provisioning @copyberry
- #42353 Add experimental Windows sandbox service provisioning @copyberry
- #42354 Add free-form asynchronous user messages @copyberry
- #42356 Initialize questions in buffered replay test messages @copyberry
- #42358 Extend rate limit reads with usage capabilities @copyberry
- #42364 Support graceful daemon shutdown on Windows @copyberry
- #42366 List managed worktrees for a repository @copyberry
- #42369 Keep SQLite history projection moving past invalid records @copyberry
- #42370 Improve MCP server startup error logging @copyberry
- #42372 Add Luna Reserve usage fallback to the TUI @copyberry
- #42373 Add attributed exec process lifecycle telemetry @copyberry
- #42374 Extract PID startup into a dedicated module @copyberry
- #42375 Clean up Windows sandbox resources on app uninstall @copyberry
- #42377 Make app-server realtime sessions always available @copyberry
- #42378 Route rollout reads through the canonical JSON decoder @copyberry
- #42380 Require confirmation for safety-buffered retries @copyberry
- #42381 Support managed app-server lifecycle on Windows @copyberry
- #42383 Update rmcp to 3.2.0 @copyberry
- #42384 Add an RMCP OAuth credential store adapter @copyberry
- #42385 Add experimental context management activation @copyberry
- #42386 Expose loaded thread environments in app-server responses @copyberry
- #42388 Recover deferred environments after provisioning failure @copyberry
- #42391 Authorize `apply_patch` in the executor path context @copyberry
- #42392 Support managed daemon updates on Windows @copyberry
- #42395 Expose the Codex version to commands and turn metadata @copyberry
- #42397 Extract focused TUI logic into submodules @copyberry
- #42399 Preserve restored input after resolved misalignment errors @copyberry
- #42401 Discover TUI collaboration modes from the app server @copyberry
- #42403 Expose the last accepted environment ready report @copyberry
- #42404 Read voice helper frames independently of pipe chunks @copyberry
- #42405 Support the app-server daemon on Windows @copyberry
- #42406 Honor explicit plugin mentions during MCP startup @copyberry
- #42408 Harden embedded composer input handling @copyberry
- #42410 Allow reviewing and continuing misalignment-paused chats @copyberry
- #42413 Enable coordinated MCP OAuth refresh @copyberry
- #42417 Expose managed application network requirements @copyberry
- #42419 Add session resume to the agent command center @copyberry
- #42422 Honor model requirements in Guardian computer-use scoring @copyberry
- #42425 Discover TUI experimental features from the server @copyberry
- #42428 Use the shared composer in the agent command center @copyberry
- #42432 Box the TUI resume picker future @copyberry
- #42445 Include originator in plugin measurement analytics @copyberry
- #42451 Acknowledge pending TUI steers by submission ID @copyberry
- #42453 Discover permission profiles from the app server @copyberry
- #42455 Show live task details in the agent command center @copyberry
- #42458 Expose thread originators through the app-server API @copyberry
- #42529 Register the Guardian thread context feature flag @copyberry
- #42552 Preserve MCP authentication challenges on tool calls @copyberry
- #42577 Preserve target-native paths in command approvals @copyberry
- #42579 Persist verified user answers in Guardian thread context @copyberry
- #42584 Recover Vim escape input in legacy terminals @copyberry
- #42588 Require Guardian review for incompatible compaction checkpoints @copyberry
- #42590 Harden the macOS sandbox against terminal input injection @copyberry
- #42593 Reload user config after local plugin installation @copyberry
- #42596 Record Windows sandbox private desktop usage @copyberry
- #42598 Report MCP tool discovery errors in server status @copyberry
- #42602 Deprecate detached review delivery @copyberry
- #42603 Expose global metrics installation in `codex-otel` @copyberry
- #42606 Support trusted headers for remote exec WebSockets @copyberry
- #42607 Add GPT-6-Astra to the bundled model catalog @copyberry
- #42609 Condense TUI startup warnings @copyberry
- #42619 Add GPT-6-Astra to Amazon Bedrock catalogs @copyberry
- #42623 Bound Noise handshakes by the exec server initialization timeout @copyberry
- #42624 Centralize prompt image detail modes @copyberry
- #42631 Initialize the packaged GStreamer runtime in the voice host @copyberry
- #42634 Add an injectable attachment store to ThreadManager @copyberry
- #42638 Update GPT-6-Astra Fast tier speed description @copyberry
- #42639 Warn when saved model defaults are overridden @copyberry
- #42640 Harden TUI parsing of assistant markup @copyberry
- #42641 Restore the inline TUI after full-screen overlays @copyberry
- #42650 Render assistant file citations as local links @copyberry
- #42652 Add managed worktrees to `codex exec` @copyberry
- #42654 Update the stable exec-server test to Codex 0.153.1 @copyberry
- #42657 Use a generic fallback model name in status tests @copyberry
- #42667 Tailor TUI cyber refusal notices to Daybreak eligibility @copyberry
- #42668 Cancel remote control enrollment on stdio shutdown @copyberry
- #42671 Preserve TUI sessions while starting replacement threads @copyberry
- #42674 Persist server-advertised experimental features from the TUI @copyberry
- #42676 Add WebRTC negotiation to the voice host @copyberry
- #42677 Narrow async user message guidance @copyberry
- #42682 Fix the worktrees experimental feature test fixture @copyberry
- #42716 Allow trusted symlinks beneath CODEX_HOME on macOS @copyberry
- #42718 Gate unified exec TTY support behind a feature flag @copyberry
- #42741 Make the TUI symlink startup test Bazel-compatible @copyberry
- #42744 Honor model-provided Guardian review policies @copyberry
- #42746 Handle pending network reviews after process completion @copyberry
- #42749 Improve automatic thread naming in the TUI @copyberry
- #42752 Preserve response IDs for fast collaborator tool events @copyberry
- #42755 Stabilize the interactive tmux startup safety test @copyberry
- #42758 Propagate response tickets to Guardian reviews @copyberry
- #42762 Retain user instructions in guardian thread context @copyberry
- #42767 Avoid port races in streamable HTTP tests @copyberry
- #42770 Preserve acceptance order in retained thread context @copyberry
- #42773 Avoid holding metadata permit during cold resume config load @copyberry
- #42781 Add direct SigV4 transport to exec-server @copyberry
- #42791 Keep TUI prompt history tied to local settings @copyberry
- #42792 Extract the note input view into its own module @copyberry
- #42798 Add data-use disclosures to the user report dialog @copyberry
- #42801 Keep the Windows sandbox command runner hidden @copyberry
- #42807 Add request-scoped Guardian approval decisions @copyberry
- #42811 Enable staging login issuer overrides in packaged builds @copyberry
- #42814 Support custom report event titles @copyberry
- #42819 Route Guardian approvals independently of async scoring @copyberry
- #42821 Report managed filesystem policy in `codex doctor` @copyberry
- #42823 Expose managed WebMCP policy through the app server @copyberry
- #42824 Refine user input guidance for GPT-6 @copyberry
- #42832 Preserve root authorization context in Guardian reviews @copyberry
- #42833 Preserve SystemRoot for Windows sandbox wrapper setup @copyberry
- #42835 Preserve Windows managed deny reads in the sandbox CLI @copyberry
- #42836 Make GPT-6-Astra user input guidance conditional @copyberry
- #42838 Preserve executor paths in Guardian approval reviews @copyberry
- #42841 Add a native Windows MXC sandbox adapter @copyberry
- #42842 Add Astra sparkle effects to the TUI composer @copyberry
- #42844 Retain user instructions in Guardian context @copyberry
- #42847 Preserve Markdown formatting when copying TUI responses @copyberry
- #42850 Use jemalloc for Linux musl binaries @copyberry
- #42852 Harden Guardian reviews after context compaction @copyberry
- #42854 Persist Daybreak preferences in thread metadata @copyberry
- #42863 Preserve precedence across feature requirement aliases @copyberry
- #42870 Avoid redundant filesystem sandbox path resolution @copyberry
- #42879 List GPT-6-Astra in the model picker @copyberry
- #42883 Add client-side exec-server RPC attempt metrics @copyberry
- #42889 Add TUI building blocks for inline async question editing @copyberry
- #42891 Integrate asynchronous questions into the TUI @copyberry
- #42894 Support selectable answers for asynchronous TUI questions @copyberry
- #42897 Add inline Other answers to async question choices @copyberry
- #42900 Establish root turn identity for independent tasks and memory requests @copyberry
- #42903 Preserve TUI question state and integrate history and queue navigation @copyberry
- #42904 Use static instructions for the Default collaboration mode @copyberry
- #42931 Update OpenAI Docs skill guidance for GPT-6 Astra @copyberry
- #42933 Wait for turn analytics before shutting down the Guardian v2 test @copyberry
- #42990 Refresh session hooks after external plugin updates @copyberry
- #42993 Remove the deprecated `codex mcp-server` command @copyberry
- #43000 Preserve the resolved multi-agent version when reverting threads @copyberry
- #43002 Replace Guardian tickets with parent response IDs @copyberry
- #43005 Add Guardian V2 failure reasons and connection timing metrics @copyberry
- #43031 Keep refreshed MCP tool catalogs with their clients @copyberry
- #43039 Refresh live thread tools through `app/installed` @copyberry
- #43043 Avoid filesystem scans when seeding the agents overview @copyberry
- #43055 Allow `/copy` to copy status output and individual fields @copyberry
- #43069 Support managed worktrees for interactive sessions and forks @copyberry
- #43070 Clarify comments in CI setup and the Rust workflow @copyberry
- #43074 Show a retryable error when the apps popup fails to load @copyberry
- #43079 Add opt-in local audio devices to the voice helper @copyberry
- #43083 Supply Bazel-managed CMake and Ninja for the bundled Opus build @copyberry
- #43090 Send processed microphone audio over RTP in voice-host @copyberry
- #43097 Add a helper-backed realtime WebRTC session API @copyberry
- #43099 Add receipt-verified native voice SDK export @copyberry
- #43100 Add bounded incoming Opus RTP handling to the voice host @copyberry
- #43102 Include GIO in voice SDKs and native runtimes @copyberry
- #43104 Move Guardian thread context into `guardianv2` configuration @copyberry
- #43109 Add explicit toolchain inputs for native voice builds @copyberry
- #43110 Record reasoning effort changes in conversation history behind a flag @copyberry
- #43111 Add a Bazel target for native voice dependencies @copyberry
- #43113 Save subagent and memory opt-ins through the app server @copyberry
- #43114 Add Bazel preparation for native voice runtimes @copyberry
- #43117 Link Unix Bazel bindings against the prepared voice runtime @copyberry
- #43120 Add managed worktree creation to TUI session commands @copyberry
- #43121 Require a prepared runtime when assembling voice helper packages @copyberry
- #43125 Add explicit Windows tool selection for native voice builds @copyberry
- #43126 Expose native Windows build tools through Bazel targets @copyberry
- #43144 Add Windows MSVC Bazel targets for native voice libraries @copyberry
- #43147 Gate experimental context by model capability at session startup @copyberry
- #43177 Use server model defaults for fresh TUI startup @copyberry
- #43178 Allow guarded legacy resume with background migration enabled @copyberry
- #43244 Add bounded GStreamer playback components to the voice host @copyberry
- #43248 Connect voice-host RTP audio to speaker playback @copyberry
- #43253 Show read-only conversations when resume encounters an active writer @copyberry
- #43261 Use server defaults when starting TUI background tasks @copyberry
- #43265 Add experimental user verification API contracts @copyberry
- #43279 Include linked worktrees in TUI session discovery @copyberry
- #43281 Move npm package staging into a separate release workflow job @copyberry
- #43282 Make Bazel binary stamping opt-in @copyberry
- #43286 Add a managed worktree browser to the TUI @copyberry
- #43289 Add capability-gated MCP user-verification handling @copyberry
- #43298 Defer managed worktree transitions to fresh TUI loop iterations @copyberry
- #43304 Isolate Bazel build commit metadata from Rust compilation inputs @copyberry
- #43308 Replace Windows app-server shutdown files with socket requests @copyberry
- #43315 Resolve session labels uniquely before acting on them @copyberry
- #43325 Sort JSON schema object keys for consistent Cargo and Bazel output @copyberry
- #43330 Preserve saved permissions when resuming or forking remote tasks @copyberry
- #43340 Enable remote named permission profile selection in the TUI @copyberry
- #43352 Add opt-in MCP user-verification transport @copyberry
- #43355 Let the app server resolve implicit model settings for CLI forks @copyberry
- #43359 Show the server's model provider ID in TUI status @copyberry
- #43360 Use app-server metadata for TUI session restoration @copyberry
- #43376 Defer resume picker and directory changes to a fresh TUI stack @copyberry
- #43408 Avoid WebSocket connection waits in Guardian v2 classification @copyberry
- #43419 Initialize `cwd` in TUI resume and fork test fixtures @copyberry
- #43421 Remove the app-server README and its contributor guidance references @copyberry
- #43423 Remove the app-server docs update requirement from `AGENTS.md` @copyberry
- #43426 Handle Luna HTTP requests in guardian history tests @copyberry
- #43428 Notify opted-in stdio MCP servers of auth changes @copyberry
- #43432 Route approvals through the extension decision API @copyberry
- #43442 Keep Guardian review evidence consistent and reject stale approvals @copyberry
- #43444 Pin V8 release manifests and prevent published release replacement @copyberry
- #43447 Route MCP elicitations through the shared approval decision path @copyberry
- #43454 Add diagnostic labels to shell snapshot capture metrics @copyberry
- #43456 Wait for thread idle before rollback in model-switching tests @copyberry
- #43458 Centralize Guardian context mode and checkpoint policy @copyberry
- #43462 Remove legacy Guardian approval review paths @copyberry
- #43472 Recover missing Guardian root instructions in acceptance order @copyberry
- #43478 Retain inherited Guardian instructions in standalone forks @copyberry
- #43490 Expose shared Guardian reviewer helpers through `guardian_review` @copyberry
- #43491 Include unloaded children in multi-agent v2 environment context @copyberry
- #43494 Limit archive rollout reads to requested threads @copyberry
- #43495 Allow internal sessions to fork from selected history @copyberry
- #43504 Treat zombie processes as inactive in the Unix PID backend @copyberry
- #43513 Expose a stable executor build identity in environment metadata @copyberry
- #43519 Set `recursion_limit` to 256 for app-server, exec, and TUI @copyberry




## rust-v0.153.4 — 2026-09-04

## Bug Fixes

- Fixed Astra’s visibility in the bundled model picker and made it the bundled default when no model is explicitly configured. (#42874)
- Updated Astra’s guidance to use asynchronous questions only when the tool is available in the session. (#42878)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.153.3...rust-v0.153.4

- #42874 [0.153 hotfix] Show Astra in bundled model picker @rhan-oai
- #42878 [0.153 hotfix] Qualify Astra async-question guidance by tool availability @rhan-oai




## rust-v0.153.3 — 2026-09-04

## New Features
- Added GPT-6-Astra to the Amazon Bedrock model picker for Mantle and Runtime global/US routes. (#42805)

## Bug Fixes
- Corrected GPT-6-Astra’s guidance for asynchronous clarification questions to use the supported tool and recognize that it accepts text only. (#42809)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.153.2...rust-v0.153.3

- #42805 [0.153 hotfix] Add GPT-6-Astra to Amazon Bedrock catalogs @celia-oai
- #42809 [0.153 hotfix] Update Astra async-question guidance @rhan-oai




## rust-v0.153.2 — 2026-09-03

## Bug Fixes

- Corrected the GPT-6-Astra Fast tier description to say “2x speed, increased usage” instead of “1.5x.” This changes only the displayed text, not how requests run. (#42632)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.153.1...rust-v0.153.2

- #42632 Fix GPT-6-Astra Fast tier description for 0.153.2 @anp-oai




## rust-v0.153.1 — 2026-09-03

## New Features

- Added support for configuring GPT-6-Astra through the API without changing the default model or showing it in the model picker. (#42605)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.153.0...rust-v0.153.1

- #42605 Backport GPT-6-Astra model catalog to 0.153 @anp-oai




## rust-v0.153.0 — 2026-09-03

## New Features

- Vim mode now supports undo with `u` and redo with `Ctrl+R`, preserving complete drafts including pasted content and attachments. ([#41941](https://github.com/openai/codex/pull/41941), [#42140](https://github.com/openai/codex/pull/42140))
- The plugin CLI can list, install, and remove plugins from remote marketplaces. ([#42150](https://github.com/openai/codex/pull/42150))
- Set `tui.auto_recap = false` to disable automatic recaps while keeping manual `/recap` available. ([#42101](https://github.com/openai/codex/pull/42101))
- TUI history shows complete patches, input sent to background terminals, and individual completed commands. ([#41893](https://github.com/openai/codex/pull/41893), [#42107](https://github.com/openai/codex/pull/42107))
- Plus and Team users receive an earlier warning when less than half of their allowance remains in an approximately five-hour usage window. ([#42142](https://github.com/openai/codex/pull/42142))

## Bug Fixes

- TUI sessions reconnect after an external app-server connection drops, preserving drafts and transcripts while keeping uncertain or queued submissions paused for review. ([#41911](https://github.com/openai/codex/pull/41911), [#41916](https://github.com/openai/codex/pull/41916), [#41918](https://github.com/openai/codex/pull/41918))
- Full Access skips Guardian reviews for confirmation-only actions. User approval mode skips background Guardian scoring and prewarming, while sensitive-action checks and requests for user input retain their existing handling. ([#42147](https://github.com/openai/codex/pull/42147), [#42256](https://github.com/openai/codex/pull/42256))
- Guardian review history survives compaction, restarts, and user-created forks while respecting rollback boundaries and isolating subagent history. ([#41879](https://github.com/openai/codex/pull/41879), [#42065](https://github.com/openai/codex/pull/42065))
- Remembered MCP tool approvals are scoped to the selected app account, and relative MCP executable paths start more reliably on macOS. ([#42133](https://github.com/openai/codex/pull/42133), [#42117](https://github.com/openai/codex/pull/42117))
- Rollout compression includes shared histories, `codex exec resume` handles compressed rollouts when selecting by working directory, and thread forks work with symlinked session roots. ([#42039](https://github.com/openai/codex/pull/42039), [#42135](https://github.com/openai/codex/pull/42135))

## Configuration and API Updates

- App-server thread metadata includes nullable `model` and `reasoningEffort` fields. Structured asynchronous questions are supported through `request_user_input_async` when enabled by the model catalog. ([#42151](https://github.com/openai/codex/pull/42151), [#42178](https://github.com/openai/codex/pull/42178))
- `tui.disable_paste_burst` replaces the top-level setting, which remains supported as a fallback. ([#41976](https://github.com/openai/codex/pull/41976))
- Adds the disabled-by-default `features.context_management.experimental_mode` configuration. When enabled for eligible ChatGPT Plus, Pro, or Pro Lite sessions using the Codex backend, it activates token-budget context, history notes, and the `new_context` tool. API-key sessions, custom providers, and temporary structured threads remain excluded. ([#42385](https://github.com/openai/codex/pull/42385))

## Changelog

[Full Changelog](https://github.com/openai/codex/compare/rust-v0.152.1...rust-v0.153.0)

- [#41870](https://github.com/openai/codex/pull/41870) Use shared transcript collection for Guardian reviews
- [#41879](https://github.com/openai/codex/pull/41879) Preserve Guardian review evidence across compaction
- [#41884](https://github.com/openai/codex/pull/41884) Add pinned native voice source preparation
- [#41890](https://github.com/openai/codex/pull/41890) Add native voice dependency build recipe
- [#41892](https://github.com/openai/codex/pull/41892) Retain the MCP client for event streams
- [#41893](https://github.com/openai/codex/pull/41893) Show successful TUI commands individually
- [#41894](https://github.com/openai/codex/pull/41894) Fix Windows native voice dependency builds
- [#41897](https://github.com/openai/codex/pull/41897) Add the voice helper lifecycle foundation
- [#41899](https://github.com/openai/codex/pull/41899) Keep MCP event subscriptions alive after task unloading
- [#41901](https://github.com/openai/codex/pull/41901) Load bounded context after empty wake turns
- [#41902](https://github.com/openai/codex/pull/41902) Add installed voice host lifecycle support
- [#41906](https://github.com/openai/codex/pull/41906) Add a manager for MCP event streams
- [#41908](https://github.com/openai/codex/pull/41908) Avoid scanning archived rollouts when archiving threads
- [#41909](https://github.com/openai/codex/pull/41909) Make permission transforms aware of executor path context
- [#41911](https://github.com/openai/codex/pull/41911) Preserve TUI drafts after app-server disconnects
- [#41912](https://github.com/openai/codex/pull/41912) Persist response token usage in rollout history
- [#41913](https://github.com/openai/codex/pull/41913) Preserve TUI status timing when the status row is hidden
- [#41915](https://github.com/openai/codex/pull/41915) Move the config schema generator into a dedicated crate
- [#41916](https://github.com/openai/codex/pull/41916) Reconnect TUI app-server sessions automatically
- [#41917](https://github.com/openai/codex/pull/41917) Open the agents overview from an empty composer
- [#41918](https://github.com/openai/codex/pull/41918) Restore agent navigation after TUI reconnects
- [#41923](https://github.com/openai/codex/pull/41923) Allow per-call sideband endpoints for existing realtime calls
- [#41924](https://github.com/openai/codex/pull/41924) Record realtime conversation history in Core
- [#41925](https://github.com/openai/codex/pull/41925) Test repository-wide Rust formatter discovery
- [#41928](https://github.com/openai/codex/pull/41928) Use executor path context for permission preapproval
- [#41929](https://github.com/openai/codex/pull/41929) Open the agents overview directly in the reconnect test
- [#41933](https://github.com/openai/codex/pull/41933) Report configured sandbox policy consistently
- [#41934](https://github.com/openai/codex/pull/41934) Omit undersized WAV output from Code Mode
- [#41936](https://github.com/openai/codex/pull/41936) Attach failed Guardian reviews to diagnostic reports
- [#41937](https://github.com/openai/codex/pull/41937) Limit background terminal input previews
- [#41938](https://github.com/openai/codex/pull/41938) Clarify resume guidance in exit summaries
- [#41940](https://github.com/openai/codex/pull/41940) Preserve transcript layout caches during backtrack selection
- [#41941](https://github.com/openai/codex/pull/41941) Add Vim undo to the TUI composer
- [#41944](https://github.com/openai/codex/pull/41944) Emit turn cost telemetry for ChatGPT sessions
- [#41946](https://github.com/openai/codex/pull/41946) Expand extension permission regression coverage
- [#41949](https://github.com/openai/codex/pull/41949) Add plugin reconciliation app-server API
- [#41950](https://github.com/openai/codex/pull/41950) Improve tracing for nested tool calls and exec processes
- [#41953](https://github.com/openai/codex/pull/41953) Enforce marketplace source policy for curated plugins
- [#41974](https://github.com/openai/codex/pull/41974) Track TUI starts by app server mode
- [#41976](https://github.com/openai/codex/pull/41976) Move `disable_paste_burst` under `[tui]`
- [#41980](https://github.com/openai/codex/pull/41980) Preserve raw response usage metadata
- [#42003](https://github.com/openai/codex/pull/42003) Report turn trigger and source in turn analytics
- [#42031](https://github.com/openai/codex/pull/42031) Share Guardian user-message retention logic
- [#42033](https://github.com/openai/codex/pull/42033) Improve Guardian report diagnostics
- [#42039](https://github.com/openai/codex/pull/42039) Include shared histories in rollout compression
- [#42043](https://github.com/openai/codex/pull/42043) Tag Codex home size metrics with compression state
- [#42047](https://github.com/openai/codex/pull/42047) Add per-account approval settings for apps
- [#42054](https://github.com/openai/codex/pull/42054) Honor explicit account selectors for Apps tool calls
- [#42056](https://github.com/openai/codex/pull/42056) Honor app link settings for MCP tool approvals
- [#42065](https://github.com/openai/codex/pull/42065) Preserve Guardian history across thread reconstruction
- [#42066](https://github.com/openai/codex/pull/42066) Remove selected core test cases
- [#42068](https://github.com/openai/codex/pull/42068) Detect standalone installs from the macOS CLI bundle
- [#42069](https://github.com/openai/codex/pull/42069) Remove redundant test coverage
- [#42071](https://github.com/openai/codex/pull/42071) Detect Vite+-managed Codex installs
- [#42076](https://github.com/openai/codex/pull/42076) Unify Guardian context section collection
- [#42082](https://github.com/openai/codex/pull/42082) Attribute nested REPL reviews to their tool calls
- [#42085](https://github.com/openai/codex/pull/42085) Centralize Guardian context composition
- [#42086](https://github.com/openai/codex/pull/42086) Attribute Guardian reviews to OpenAI app tools
- [#42094](https://github.com/openai/codex/pull/42094) Record Windows MXC availability
- [#42096](https://github.com/openai/codex/pull/42096) Make diagnostic report uploads resilient to slow networks
- [#42100](https://github.com/openai/codex/pull/42100) Prefer remote Sites over the bundled plugin
- [#42101](https://github.com/openai/codex/pull/42101) Add a TUI setting to disable automatic recaps
- [#42102](https://github.com/openai/codex/pull/42102) Extract OTEL trace WebSocket into a reusable crate
- [#42104](https://github.com/openai/codex/pull/42104) Show recent sessions in the agent command center
- [#42107](https://github.com/openai/codex/pull/42107) Show full patches and terminal input in TUI history
- [#42109](https://github.com/openai/codex/pull/42109) Format Python scripts across the repository
- [#42110](https://github.com/openai/codex/pull/42110) Treat bundled cleanup hooks as built-ins
- [#42113](https://github.com/openai/codex/pull/42113) Apply remote platform semantics to exec safety checks
- [#42114](https://github.com/openai/codex/pull/42114) Centralize remote plugin mutations in `PluginsManager`
- [#42117](https://github.com/openai/codex/pull/42117) Fix relative MCP server spawning on macOS
- [#42118](https://github.com/openai/codex/pull/42118) Refine hook activity rendering in the TUI
- [#42121](https://github.com/openai/codex/pull/42121) Allow updating the approval reviewer for active turns
- [#42123](https://github.com/openai/codex/pull/42123) Preserve descriptive labels on local file links
- [#42126](https://github.com/openai/codex/pull/42126) Ignore non-JSON files in plugin catalog test helpers
- [#42128](https://github.com/openai/codex/pull/42128) Prepare MCP connections for coordinated OAuth refresh
- [#42132](https://github.com/openai/codex/pull/42132) Bound Git root discovery for metadata enrichment
- [#42133](https://github.com/openai/codex/pull/42133) Scope session MCP approvals to app account links
- [#42134](https://github.com/openai/codex/pull/42134) Include app link metadata in MCP approval elicitations
- [#42135](https://github.com/openai/codex/pull/42135) Support thread forks from symlinked session roots
- [#42137](https://github.com/openai/codex/pull/42137) Prewarm shell snapshots for eligible turns
- [#42140](https://github.com/openai/codex/pull/42140) Add redo support to Vim composer history
- [#42142](https://github.com/openai/codex/pull/42142) Add early rate-limit warnings for Plus and Team plans
- [#42144](https://github.com/openai/codex/pull/42144) Add Guardian V2 analytics events
- [#42146](https://github.com/openai/codex/pull/42146) Resolve permission requests in the executor context
- [#42147](https://github.com/openai/codex/pull/42147) Skip Guardian reviews in Full Access
- [#42149](https://github.com/openai/codex/pull/42149) Upgrade Git marketplaces from merged configuration
- [#42150](https://github.com/openai/codex/pull/42150) Support remote marketplaces in the plugin CLI
- [#42151](https://github.com/openai/codex/pull/42151) Expose model settings in app-server thread metadata
- [#42161](https://github.com/openai/codex/pull/42161) Split tool JSON Schema code into focused modules
- [#42164](https://github.com/openai/codex/pull/42164) Record result sources in app tool analytics
- [#42173](https://github.com/openai/codex/pull/42173) Support header injections in network requirements
- [#42174](https://github.com/openai/codex/pull/42174) Add a cacheable Bazel app-server schema bundle
- [#42178](https://github.com/openai/codex/pull/42178) Add structured asynchronous user input requests
- [#42256](https://github.com/openai/codex/pull/42256) Skip Guardian scoring in User approval mode
- [#42385](https://github.com/openai/codex/pull/42385) Add experimental context management activation




## rust-v0.152.1 — 2026-09-01

## Bug Fixes
- Guardian approval review now honors Node REPL policies provided through model metadata.

**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.152.0...rust-v0.152.1


## rust-v0.152.0 — 2026-09-01

## New Features

- Vim mode supports `/` and `?` searches within drafts, highlighted matches, and repeat navigation with `n` and `N`. (#41586)
- Rate-limit banners offer actions for checking usage, managing credits, resetting limits, and managing plans. (#41742)
- The terminal UI and `codex exec` show credential-refresh progress, including Amazon Bedrock reauthentication. (#41239)
- MCP server names can contain `:`, `@`, `/`, and `.`, supporting package-style names throughout CLI commands and authentication. (#41700)
- Individual MCP tools support an `output_token_limit` setting, with consistent truncation across session resumes. (#41421)
- App-server clients can configure `thread/shellCommand` timeouts, including deadlines longer than one hour. (#41384)

## Bug Fixes

- Vim-enabled composers now start fresh drafts in Insert mode, including after submitting messages or dispatching slash commands. (#41921)
- Automatic approval reviews can retain longer messages and a larger conversation transcript. (#41931)

- Automatic approval reviews preserve user instructions, answers, and valid authorizations across history compaction. (#41660, #41846, #41852)
- Resumed threads restore their saved working directory when none is supplied, and client metadata updates preserve filesystem permissions. (#41567, #41464)
- MCP tools remain available through cache refreshes and remote plugin changes; authentication retries use refreshed helper-provided headers. (#41336, #41344, #41396, #41400)
- Opening the model picker refreshes available models without losing the highlighted choice. (#41467)
- Fixed Windows sandbox execution with Microsoft Store PowerShell, subprocess hangs on terminal queries, and cursor-related display corruption in older JediTerm terminals. (#41227, #41436, #41673)
- Cloud task requests reject untrusted backend URLs and disable redirects to protect saved credentials. (#41403)

## Chores

- The planning tool is disabled by default; enable it with `tools.update_plan.enabled = true`. (#41744)
- Plugin recommendations begin loading during startup, reducing delays before the first turn. (#41375)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.151.0...rust-v0.152.0

- #41210 Enable clock tools from model metadata @copyberry
- #41215 Roll over Guardian context before follow-up reviews @copyberry
- #41218 Share linked tool mention parsing in the TUI @copyberry
- #41219 Retry confirmed remote registration conflicts @copyberry
- #41221 Honor turn token budgets in Guardian review rollover @copyberry
- #41223 Add recency sorting to `project/list` @copyberry
- #41226 Move Guardian review session tests to a separate file @copyberry
- #41227 Use compatible PowerShell for elevated Windows sandbox commands @copyberry
- #41230 Apply app routing policy to unauthenticated plugin reads @copyberry
- #41231 Instrument the loaded plugin cache @copyberry
- #41232 Expose the PowerShell version in environment context @copyberry
- #41235 Sanitize history notes backend errors @copyberry
- #41239 Surface model provider authentication recovery progress @copyberry
- #41243 Add configurable gating for the sleep tool @copyberry
- #41250 Include thread source in realtime connection metadata @copyberry
- #41260 Let the history backend enforce tool output budgets @copyberry
- #41285 Drive keymap conflict checks from the action registry @copyberry
- #41292 Forward history note images to the model @copyberry
- #41308 Make subagents follow the root service tier @copyberry
- #41309 Honor required reviews when reusing Guardian scores @copyberry
- #41313 Decouple HTTP retry backoff from overload integration testing @copyberry
- #41322 Isolate required-model Guardian approval coverage @copyberry
- #41328 Review terminal input against retained permissions @copyberry
- #41331 Classify clock tools as built-in control tools @copyberry
- #41336 Preserve cached MCP tools during binding capture @copyberry
- #41344 Use refreshed MCP tool caches during binding capture @copyberry
- #41349 Assign stable IDs to generated Responses input items @copyberry
- #41354 Reject NUL bytes in reviewed terminal input @copyberry
- #41357 Support compression for shared rollout lineages @copyberry
- #41360 Measure Codex home usage at app-server startup @copyberry
- #41364 Test resuming compressed shared rollouts @copyberry
- #41365 Restrict async user messages to questions @copyberry
- #41368 Match Windows shell guidance to the executor platform @copyberry
- #41375 Preload plugin recommendations during session startup @copyberry
- #41380 Clarify proactive multi-agent delegation guidance @copyberry
- #41384 Support configurable timeouts for thread shell commands @copyberry
- #41385 Give Guardian classifications distinct turn identities @copyberry
- #41392 Add shared Guardian context primitives @copyberry
- #41393 Preserve one-shot exec when unified exec is disabled @copyberry
- #41396 Refresh runtimes for remote plugin state changes @copyberry
- #41400 Refresh MCP HTTP helper headers after authorization failures @copyberry
- #41403 Restrict cloud task credentials to trusted origins @copyberry
- #41413 Optimize history item lookups @copyberry
- #41416 Add app-server notification media filtering @copyberry
- #41421 Support per-tool MCP output limits @copyberry
- #41422 Add shared Guardian transcript collection @copyberry
- #41424 Preserve context baselines across nested agent forks @copyberry
- #41427 Filter media from function call output notifications @copyberry
- #41429 Retain the last selected step context for each turn @copyberry
- #41432 Run executor hooks for interrupted turns @copyberry
- #41435 Allow bundled browser cleanup hooks on subagent stop @copyberry
- #41436 Respond to terminal queries from TTY subprocesses @copyberry
- #41447 Support `openai/elicitation` form requests @copyberry
- #41448 Clarify question handling in Default collaboration mode @copyberry
- #41449 Rename the read-only Seatbelt platform defaults policy @copyberry
- #41452 Report code mode host request durations @copyberry
- #41454 Block goals after repeated execution host failures @copyberry
- #41456 Support app targets in executor plugin hooks @copyberry
- #41457 Source proactive multi-agent instructions from the model catalog @copyberry
- #41461 Source async user message descriptions from the model catalog @copyberry
- #41464 Preserve permissions when updating session metadata @copyberry
- #41467 Refresh the TUI model picker from the app server @copyberry
- #41476 Use rules_rs platforms for release binaries @copyberry
- #41477 Organize bundled Rust resources under asset directories @copyberry
- #41562 Preserve turn lineage across goal continuations @copyberry
- #41567 Restore thread cwd from owned settings snapshots @copyberry
- #41569 Harden diagnostic report uploads @copyberry
- #41570 Fix proactive multi-agent instruction grammar @copyberry
- #41586 Add Vim search motions to the composer @copyberry
- #41613 Move Vim history tests into the history search module @copyberry
- #41630 Update tests for default-enabled update_plan @copyberry
- #41660 Preserve Guardian authorization across history compaction @copyberry
- #41666 Approve the first Node REPL execution without a Guardian wait @copyberry
- #41673 Repair cursor-style rendering on older JediTerm terminals @copyberry
- #41683 Set working directories for environment MCP tests @copyberry
- #41700 Support package-style MCP server names @copyberry
- #41742 Show actionable rate-limit banners in the TUI @copyberry
- #41743 Mark history ingestion requests in turn metadata @copyberry
- #41744 Make the update_plan tool opt-in @copyberry
- #41803 Allow models to enable token budgeting by default @copyberry
- #41840 Use the async stack budget for approval reviews @copyberry
- #41846 Preserve Guardian review evidence across compaction @copyberry
- #41852 Preserve Guardian user answers across compaction @copyberry
- #41853 Box the session startup future at its API boundary @copyberry
- #41857 Preserve Guardian user answers from current history @copyberry
- #41858 Preserve user text when Guardian history drops oversized images @copyberry
- #41861 Keep history extension tools out of Guardian reviews @copyberry
- #41921 Start fresh Vim drafts in Insert mode
- #41931 Increase Guardian message transcript limits


## rust-v0.151.0 — 2026-08-29

## New Features

- Added a configurable grace period for discovering tools from optional MCP servers. (#41199)
- Extensions can now inspect or replace MCP tool results before they reach the model. (#41202)
- Plugin catalogs now combine per-repository configuration and report invalid project marketplaces without hiding valid plugins. (#41208)

## Bug Fixes

- Preserved restored permission profiles across TUI turns and prevented `/cd` from weakening sandbox restrictions. (#41192)
- Kept tool availability and reasoning effort correct when switching models or falling back to another model. (#41195, #41206)
- Improved remote sandbox enforcement using the executor’s actual home directory, operating system, and path conventions. (#41196, #41204, #41207, #41209)
- Preserved structured MCP tool and resource errors in app-server responses. (#41196)
- Counted nested subagent token usage toward root goal budgets. (#41183)
- Prevented stale Guardian classifications from authorizing actions after permission state changes. (#41196)

## Chores

- Added telemetry for escalated stdin reviews and remote executor MCP discovery. (#41189, #41205)
- Stabilized Guardian WebSocket and core fixture tests under slow or highly concurrent CI. (#41191, #41194)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.150.0...rust-v0.151.0

- #41183 Account subagent token usage toward root goals @copyberry
- #41189 Instrument stdin review size checks @copyberry
- #41191 Stabilize Guardian WebSocket tests @copyberry
- #41192 Preserve restored permission profiles in TUI sessions @copyberry
- #41193 Report affected capabilities from remote plugin syncs @copyberry
- #41194 Harden core test fixture startup assertions @copyberry
- #41195 Finalize model-specific tool plans in `ToolRouter` @copyberry
- #41196 Improve sandboxing, MCP errors, and cached approvals @copyberry
- #41199 Make the optional MCP startup grace configurable @copyberry
- #41202 Let extensions process MCP tool results @copyberry
- #41204 Propagate executor home directories into sandbox contexts @copyberry
- #41205 Track executor MCP discovery telemetry @copyberry
- #41206 Make Ultra reasoning fallback model-aware @copyberry
- #41207 Propagate executor OS into turn environments @copyberry
- #41208 Honor per-repository plugin configuration in catalog requests @copyberry
- #41209 Align deny-read matching with executor path semantics @copyberry




## rust-v0.150.1 — 2026-08-27

## Bug Fixes
- Remote compaction now counts retained images toward its token budget by default, trimming older images as needed. (#41003)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.150.0...rust-v0.150.1

- #41003 Backport retained-image compaction budgeting to 0.150 @rhan-oai




## rust-v0.150.0 — 2026-08-26

## New Features

- Reference other Codex tasks with `@` mentions, and ask agents to read, create, or message tasks from the terminal. (#40308, #40315)
- `/copy` now offers a picker for full responses, individual code blocks, and blockquotes. (#39997)
- Unnamed terminal tasks receive descriptive titles automatically, and `/rename` suggests an editable title based on the conversation. (#40492, #40495)
- Markdown links appear as clickable labels in supported terminals, with visible URLs retained elsewhere. (#40471)
- Bind shortcuts to cycle permission modes, and use `.` in Vim mode to repeat your last edit. (#39873, #40521)
- New `Interrupt` hooks can run commands or MCP handlers when an active top-level turn is interrupted. (#40511)

## Bug Fixes

- Untrusted projects no longer supply project-level `AGENTS.md` instructions, and managed deny-read rules remain enforced after permission changes. (#39837, #40004)
- Improved credential redaction in app-server diagnostics, including provider, authentication refresh, and attestation fields. (#39993)
- Fixed remote MCP bearer-token lookup and required-server startup while preserving compatibility with older executors. (#39926, #39952, #39979)
- Fixed elevated Windows sandbox setup and launch aliases under Unicode user paths. (#39971, #40570)
- Prevented Unix shutdown hangs caused by detached processes retaining a terminal or full terminal output buffers. (#40460)
- Fixed conversation compaction and multi-agent compatibility for Amazon Bedrock models. (#39804, #39825)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.149.0...rust-v0.150.0

- #39667 Trace MCP runtime refresh coordination @copyberry
- #39691 Make Guardian v2 parent compaction reuse configurable @copyberry
- #39700 Fail closed on unsafe config and sed parsing @copyberry
- #39702 Wait for turn completion events in multi-agent resume tests @copyberry
- #39703 Move the global scope check into the code-mode runtime @copyberry
- #39706 Harden Seatbelt writable root path binding @copyberry
- #39707 Remove redundant code mode image helper test @copyberry
- #39709 Log TUI app event variants without their payloads @copyberry
- #39712 Reduce unified exec output buffer allocations @copyberry
- #39717 Pass CI workflow inputs through environment variables @copyberry
- #39719 Stop persisting checkout credentials in V8 workflows @copyberry
- #39720 Expose managed policy for browser settings imports @copyberry
- #39722 Track multi-agent v2 spawn calls in analytics @copyberry
- #39726 Box the WebSocket dial future @copyberry
- #39731 Avoid rollout reads for configured TUI sessions @copyberry
- #39736 Remove private executor directory creation @copyberry
- #39738 Honor Guardian runtime settings from model defaults @copyberry
- #39741 Use model-specific auto-review outcome instructions @copyberry
- #39744 Skip postprocessing for short composer input @copyberry
- #39746 Refresh resumed thread capability roots from executors @copyberry
- #39749 Require filesystem backends to implement directory walks @copyberry
- #39752 Expose uncompiled permission profile selection @copyberry
- #39755 Add managed developer instructions to requirements @copyberry
- #39756 Cache shell snapshots in the exec server @copyberry
- #39757 Standardize shell execution on unified exec @copyberry
- #39761 Add app-server MCP event streaming @copyberry
- #39765 Include suggestion IDs in plugin install metadata @copyberry
- #39770 Refresh bundled model definitions @copyberry
- #39772 Standardize shell execution on unified exec @copyberry
- #39776 Verify Codex app signatures before launch or install @copyberry
- #39777 Retry transient registry failures during initial exec connection @copyberry
- #39779 Make tool-result telemetry limits configurable @copyberry
- #39782 Support standalone named function call outputs @copyberry
- #39784 Classify rollout migration failures @copyberry
- #39785 Support turn cost telemetry for custom model providers @copyberry
- #39786 Support host-accepted exec-server WebSockets @copyberry
- #39790 Deduplicate zsh fork test setup @copyberry
- #39791 Handle standalone tool outputs as external context @copyberry
- #39792 Reject settings updates for parent-owned subagents @copyberry
- #39794 Install build tools in full Rust CI @copyberry
- #39795 Add hostname to the configurable TUI status line @copyberry
- #39797 Enrich thread archive analytics with thread context @copyberry
- #39798 Update rmcp to 3.1.3 @copyberry
- #39802 Optimize case-insensitive thread history matching @copyberry
- #39804 Use multi-agent V1 for Amazon Bedrock models @copyberry
- #39807 Finalize reserved PDF uploads with creation context @copyberry
- #39809 Preserve WINDIR in core Windows shell environments @copyberry
- #39811 Restrict macOS preference reads to full-disk policies @copyberry
- #39812 Avoid materializing writable-root carveouts for presence checks @copyberry
- #39813 Defer legacy filesystem policy projection @copyberry
- #39822 Preserve uncapped Guardian classifier instructions @copyberry
- #39825 Use Responses compaction for Amazon Bedrock @copyberry
- #39827 Add history and notes tools for token-budget sessions @copyberry
- #39830 Rename the history notes extension config option @copyberry
- #39837 Ignore project instructions for untrusted projects @copyberry
- #39847 Include context window IDs in response metadata @copyberry
- #39852 Reset registry retries when refreshing Noise bundles @copyberry
- #39864 Limit pending input preview wrapping work @copyberry
- #39870 Allow session configuration with `codex agents` @copyberry
- #39873 Add keybindings for cycling TUI permission modes @copyberry
- #39876 Support attaching to existing realtime calls @copyberry
- #39917 Honor request PATH in exec-server shell snapshots @copyberry
- #39926 Resolve HTTP MCP bearer tokens in executor environments @copyberry
- #39930 Track remote MCP header environment variables @copyberry
- #39935 Enforce issuer binding for MCP OAuth endpoints @copyberry
- #39937 Bound unified exec output delta frames @copyberry
- #39940 Allow more time for local code-mode host startup @copyberry
- #39941 Discover HTTP MCP servers from selected executors @copyberry
- #39952 Honor required MCP servers from selected executors @copyberry
- #39953 Support voice-aware configuration and version-skew builds @copyberry
- #39957 Add in-memory shell snapshots to unified exec @copyberry
- #39958 Stop advertising shell snapshots from local exec servers @copyberry
- #39961 Test browser MCP bearer tokens over executor WebSockets @copyberry
- #39962 Keep Guardian reviews isolated from executor MCP servers @copyberry
- #39967 Upgrade pnpm to 10.34.5 @copyberry
- #39969 Consolidate code mode output helper tests @copyberry
- #39971 Fix elevated Windows sandbox setup activation @copyberry
- #39975 Preserve root user authorization in subagent Guardian reviews @copyberry
- #39976 Allow semaphore limit queries in the macOS sandbox @copyberry
- #39979 Preserve MCP compatibility with older executors @copyberry
- #39980 Enforce environment network policies for remote execution @copyberry
- #39981 Bypass risk scoring for models that require automatic review @copyberry
- #39985 Truncate Guardian instructions after rendering the policy @copyberry
- #39991 Preserve TUI event ordering during active-thread draining @copyberry
- #39992 Keep keymap action descriptions stable while navigating @copyberry
- #39993 Keep credentials out of app-server logs @copyberry
- #39994 Add Guardian internal session support @copyberry
- #39995 Expand browser and computer use requirements @copyberry
- #39997 Add a response target picker to `/copy` @copyberry
- #39999 Hide Fast mode status for unsupported models @copyberry
- #40000 Expose browser and computer-use requirements through app-server @copyberry
- #40004 Preserve managed deny-read rules across permission updates @copyberry
- #40005 Route escalated commands through synchronous Guardian review @copyberry
- #40006 Synchronize Git enrichment tests explicitly @copyberry
- #40007 Implement Amazon Bedrock setup in the app server @copyberry
- #40009 Run allowlisted executor plugin stop hooks @copyberry
- #40011 Synchronize concurrent Git enrichment test explicitly @copyberry
- #40012 Preserve executor context for MCP stop hooks @copyberry
- #40013 Reuse Guardian reviews in async risk scoring @copyberry
- #40015 Harden remote installed plugin cache reconciliation @copyberry
- #40017 Trace turn context creation and realtime state checks @copyberry
- #40018 Add browser and computer use configuration @copyberry
- #40020 Add end-to-end tests for executor Stop hooks @copyberry
- #40021 Cancel Guardian reviews with their tool calls @copyberry
- #40024 Honor granular sandbox approvals in unified exec @copyberry
- #40028 Log Guardian V2 classification results @copyberry
- #40031 Preserve strict MCP auto-review outcomes @copyberry
- #40038 Add unfinished root turn suspension @copyberry
- #40068 Report runtime MCP connection status @copyberry
- #40150 Use thread source metadata for Guardian classifiers @copyberry
- #40161 Allow exec callers to classify new threads @copyberry
- #40166 Move the TUI cursor before showing it @copyberry
- #40169 Add regression coverage for patch approval paging @copyberry
- #40174 Preserve content item kinds in message metadata @copyberry
- #40177 Require content kinds for extension prompt fragments @copyberry
- #40179 Shut down resumed descendants when archiving thread trees @copyberry
- #40180 Classify contextual fragments with content kinds @copyberry
- #40184 Preserve context annotations in merged messages @copyberry
- #40186 Identify detached memory requests as memory consolidation @copyberry
- #40196 Annotate user input and contextual fragments with content kinds @copyberry
- #40200 Remove the Plan mode composer nudge @copyberry
- #40221 Distinguish Guardian review threads from subagents @copyberry
- #40257 Support `cua_repl` as a Node REPL-backed MCP server @copyberry
- #40264 Preserve content metadata when truncating messages @copyberry
- #40266 Preserve content annotations when filtering forked agent history @copyberry
- #40271 Preserve content annotations when rolling back model switches @copyberry
- #40273 Normalize compacted user message annotations @copyberry
- #40275 Classify additional generated context fragments @copyberry
- #40277 Preserve annotations when omitting unsupported media @copyberry
- #40280 Budget retained images during remote compaction @copyberry
- #40281 Preserve content kinds during image preparation @copyberry
- #40292 Add smoke tests for assembled Codex packages @copyberry
- #40294 Classify internal model context by source @copyberry
- #40295 Classify permission instructions under the permissions namespace @copyberry
- #40296 Annotate Responses Lite base instructions @copyberry
- #40297 Preserve developer instruction annotations in subagent forks @copyberry
- #40301 Label Business Pro Lite plans as Business Premium @copyberry
- #40302 Harden bubblewrap synthetic mount registry isolation @copyberry
- #40308 Add TUI tools for managing Codex tasks @copyberry
- #40315 Add task mentions to the TUI composer @copyberry
- #40321 Update the frameless realtime default model @copyberry
- #40343 Cache executor metadata from initialization @copyberry
- #40363 Forward local env vars to Agent Plugin MCP servers @copyberry
- #40368 Use snapshot session sources for MCP projection @copyberry
- #40376 Advertise shell snapshot v2 support on Unix @copyberry
- #40381 Preserve sandbox errors during session initialization @copyberry
- #40382 Expose invocation sources to extension tools @copyberry
- #40393 Classify Guardian V2 risk with a single token @copyberry
- #40398 Stabilize the mismatched executor Stop hook test @copyberry
- #40403 Prewarm more Guardian sampling WebSockets @copyberry
- #40410 Strengthen Agent Plugin MCP environment overlay tests @copyberry
- #40413 Honor response budgets when listing skills @copyberry
- #40420 Represent Guardian policy as a contextual fragment @copyberry
- #40422 Harden Windows updater command execution @copyberry
- #40423 Harden Windows file URI conversion @copyberry
- #40431 Render Guardian review evidence with async scorer truncation @copyberry
- #40436 Add a managed gate for in-app local automation @copyberry
- #40437 Report completed sub-agent activity on parent turns @copyberry
- #40438 Use rust-lld for Bazel Windows MSVC Rust links @copyberry
- #40441 Preserve Windows root reads with deny-read rules @copyberry
- #40443 Batch sandboxed capability root discovery @copyberry
- #40447 Retry failed shell snapshot captures @copyberry
- #40449 Route peer agent completion activity to the initiating turn @copyberry
- #40450 Gate content item kinds behind a feature flag @copyberry
- #40460 Prevent Unix PTY I/O from blocking runtime shutdown @copyberry
- #40464 Enforce subagent ownership across app-server inputs @copyberry
- #40465 Record Guardian classifier input truncation metrics @copyberry
- #40466 Add credential brokering to network proxy feature config @copyberry
- #40471 Render Markdown links as clickable labels in supported terminals @copyberry
- #40472 Add structured full approval reviews to extensions @copyberry
- #40475 Request read control when updating Windows sandbox ACLs @copyberry
- #40477 Reload Multi-Agent V2 children through their parent @copyberry
- #40480 Add a computer-use-only Guardian v2 review scope @copyberry
- #40481 Support managed AWS access keys for Amazon Bedrock @copyberry
- #40484 Broker credential aliases in child environments @copyberry
- #40486 Add root turn IDs to turn and tool analytics @copyberry
- #40487 Extract agent role loading into a dedicated crate @copyberry
- #40488 Export turn cost as an OTEL metric @copyberry
- #40489 Honor disabled managed network configuration @copyberry
- #40490 Harden project config when credential brokering is active @copyberry
- #40491 Honor response budgets when reading skill resources @copyberry
- #40492 Generate descriptive TUI thread titles @copyberry
- #40494 Hide ephemeral system threads from TUI routing @copyberry
- #40495 Suggest conversation-based thread titles in `/rename` @copyberry
- #40496 Track history, notes, and async messages as control tools @copyberry
- #40497 Harden internal Guardian session isolation @copyberry
- #40498 Increase the app-server model refresh interval @copyberry
- #40499 Harden startup rollout migration against concurrent updates @copyberry
- #40501 Deduplicate plugin skills in unified mentions @copyberry
- #40502 Collapse home paths in AGENTS.md status summaries @copyberry
- #40504 Route cyber Trusted Access links by plan type @copyberry
- #40508 Persist realtime events in the thread timeline @copyberry
- #40509 Add persisted thread artifact models @copyberry
- #40511 Add hooks for interrupted turns @copyberry
- #40521 Add dot-repeat to Vim mode @copyberry
- #40523 Retry provider auth commands after initial failures @copyberry
- #40528 Represent terminal input in approval reviews @copyberry
- #40533 Route extension hints into context-window metadata @copyberry
- #40539 Inject history notes hints into context windows @copyberry
- #40544 Include transparent background in image generation analytics @copyberry
- #40551 Derive sandbox contexts from turn environments @copyberry
- #40554 Register the transcript v2 feature flag @copyberry
- #40570 Preserve Unicode paths in Windows batch aliases @copyberry
- #40585 Track remaining multi-agent v2 tools in analytics @copyberry
- #40587 Scope stop hooks for memory consolidation @copyberry
- #40594 Preserve conversation context in Guardian transcripts @copyberry


## rust-v0.149.1 — 2026-08-24



## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.149.0...rust-v0.149.1





## rust-v0.149.0 — 2026-08-20

## New Features

- Added an interactive `codex agents` dashboard for searching, starting, opening, renaming, and stopping tasks, with configurable shortcuts. (#39094, #39112, #39114, #39142)
- Added `/cd`, `/pwd`, and `/cwd` commands for managing the working directory in TUI sessions. (#38894)
- Added `codex queue` for sending messages to existing local or remote sessions. (#39092)
- Expanded Vim editing with character replacement and more change motions such as `cw`, `c$`, and `cc`. (#39661)
- `codex doctor` now diagnoses endpoint protection, network/proxy failures, desktop app state, and update connectivity. (#38827, #38918, #39060, #39074)
- SDK users can now pass exact CLI config overrides and select `max` or `ultra` reasoning effort. (#38817, #39662)

## Bug Fixes

- Queued messages now wake idle sessions reliably, resolve duplicate session names more usefully, and preserve pasted or deferred command semantics. (#39034, #39385, #39604)
- Resumed and forked threads now restore their active permission profile instead of silently falling back to current defaults. (#39153)
- Fixed duplicate sub-agent activity and tightened TUI routing for sub-agent notifications and approvals. (#39049, #39088)
- Realtime WebRTC sideband connections now reconnect after unexpected transport loss without dropping pending output. (#39257)
- Inline TUI history now remains available in Windows Terminal scrollback. (#39619)
- Inactive TUI thread replay buffers are now bounded to prevent excessive retained streamed output. (#39081)

## Documentation

- Clarified that external contributions should go through issues and design discussion rather than pull requests. (#39089)
- Documented DNS exfiltration risks and trust limitations for secure devcontainers. (#39283)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.148.0...rust-v0.149.0

- #38817 Add raw config overrides to the TypeScript SDK @copyberry
- #38819 Support metadata staging for reserved thread IDs @copyberry
- #38822 Avoid cloning TUI history span content @copyberry
- #38823 Avoid allocating per character when decorating hyperlinks @copyberry
- #38827 Add endpoint protection checks to `codex doctor` @copyberry
- #38830 Isolate external editor buffers from sandbox-writable paths @copyberry
- #38837 Share editor keymaps across TUI composer components @copyberry
- #38840 Identify Mac mini hosts in remote control handshakes @copyberry
- #38893 Restore thread timestamp maxima independently @copyberry
- #38894 Add working-directory commands to the TUI @copyberry
- #38899 Move requirements policy ownership to execpolicy @copyberry
- #38902 Honor per-environment shell variable policies @copyberry
- #38907 Edit queued messages with Vim history-up @copyberry
- #38913 Stop rendering columns after filling their area @copyberry
- #38916 Honor legacy `:project_roots` permission entries @copyberry
- #38918 Improve `codex doctor` network diagnostics @copyberry
- #38919 Reject obsolete app-server permission profile fields @copyberry
- #38921 Compact successful command activity in the TUI @copyberry
- #38940 Add experimental app-server project APIs @copyberry
- #38941 Prevent Noise auth tokens from reaching child processes @copyberry
- #38942 Enforce environment-specific command policies @copyberry
- #38947 Stop loading legacy managed config on Windows @copyberry
- #38978 Add a configurable skill catalog token budget @copyberry
- #38980 Bound Guardian v2 parent compaction context @copyberry
- #38987 Include images in Guardian v2 transcripts @copyberry
- #38990 Source Guardian v2 defaults from the model catalog @copyberry
- #38993 Evaluate recent and character-routed skill selection @copyberry
- #38994 Remove the workspace settings gate for apps and plugins @copyberry
- #38997 Retry transient Guardian sampling failures @copyberry
- #39001 Ignore stale Guardian tool risk scores @copyberry
- #39005 Disable Guardian V2 for managed automatic reviewers @copyberry
- #39006 Emit API-key turn cost telemetry from app-server @copyberry
- #39007 Wait for Guardian score progress in approval tests @copyberry
- #39008 Add task context to shadow skill selection @copyberry
- #39017 Move MCP policy types into `codex-protocol` @copyberry
- #39019 Isolate MCP resource headers during OAuth requests @copyberry
- #39020 Restrict Windows IDE pipe client impersonation @copyberry
- #39022 Hang soft-break whitespace in the TUI composer @copyberry
- #39023 Reduce retained MCP result data in TUI history @copyberry
- #39025 Speed up the large diff highlighting test @copyberry
- #39026 Use simulated time in the long typing test @copyberry
- #39028 Cache the test pet spritesheet encoding @copyberry
- #39030 Speed up the in-app resume cwd test @copyberry
- #39032 Encapsulate TUI shimmer under the motion module @copyberry
- #39033 Bound legacy resume preview scans @copyberry
- #39034 Dispatch queued messages written by other processes @copyberry
- #39035 Add app-server coverage for Guardian V2 approval routing @copyberry
- #39036 Allow config reads to join active app-server read batches @copyberry
- #39038 Restore Guardian risk scores across thread lifecycles @copyberry
- #39040 Preserve foreign paths in managed network approvals @copyberry
- #39043 Enforce managed authentication backend settings @copyberry
- #39045 Add managed gates for in-app chat and dictation @copyberry
- #39046 Restrict MCP HTTP redirects to the configured origin @copyberry
- #39047 Skip plugin hook loading when hooks are disabled @copyberry
- #39049 Avoid rendering sub-agent activity twice in the TUI @copyberry
- #39050 Prepare the telemetry shutdown worker during initialization @copyberry
- #39051 Use installed callable apps for TUI mentions @copyberry
- #39055 Add network policy metadata to environment configuration @copyberry
- #39056 Verify the pinned zsh manifest in release builds @copyberry
- #39057 Rate-limit TUI frames from their actual emission time @copyberry
- #39058 Tag Codex Apps protocol discovery metrics @copyberry
- #39060 Add desktop app diagnostics to `codex doctor` @copyberry
- #39061 Avoid rerendering streamed code fences @copyberry
- #39063 Render only visible rows in the transcript pager @copyberry
- #39064 Restrict queued-message editing to its dedicated binding @copyberry
- #39065 Limit terminal hyperlink layout to the visible viewport @copyberry
- #39067 Add desktop security enforcement diagnostics @copyberry
- #39068 Remove skill model delegation support @copyberry
- #39072 Persist generated images through turn executors @copyberry
- #39073 Propagate caller metadata to rendezvous connections @copyberry
- #39074 Add desktop update diagnostics to `codex doctor` @copyberry
- #39075 Avoid redundant terminal row clears @copyberry
- #39077 Build filesystem JSON params only for remote TUI sessions @copyberry
- #39078 Preserve tracing context for environment resolution @copyberry
- #39079 Apply user MCP policy to selected executor plugins @copyberry
- #39081 Bound TUI thread replay buffers by delta size @copyberry
- #39082 Prompt for project trust in remote TUI workspaces @copyberry
- #39083 Harden Windows sandbox provisioning against reparse points @copyberry
- #39084 Preserve filesystem permission path conventions @copyberry
- #39087 Read plugin authentication state from AuthManager @copyberry
- #39088 Harden TUI subagent navigation @copyberry
- #39089 Clarify the external contribution policy @copyberry
- #39092 Add a command to queue messages for existing sessions @copyberry
- #39094 Add an agents overview dashboard to the TUI @copyberry
- #39098 Trace exec-server requests from receipt through completion @copyberry
- #39100 Avoid redundant terminal size queries during history insertion @copyberry
- #39101 Update rmcp to 3.1.2 @copyberry
- #39102 Raise the GPT-5.6 maximum context window @copyberry
- #39103 Drop capabilities from Linux sandbox processes @copyberry
- #39112 Make the agents overview an interactive task dashboard @copyberry
- #39113 Surface interactive requests in realtime conversations @copyberry
- #39114 Add a dedicated `codex agents` dashboard command @copyberry
- #39115 Remove the experimental thread config endpoint @copyberry
- #39117 Reject lossy legacy permission projections @copyberry
- #39122 Fail closed on deeply nested command wrappers @copyberry
- #39131 Validate identifiers in plugin creator workflows @copyberry
- #39141 Redact auth tokens from app-server response logs @copyberry
- #39142 Add configurable shortcuts for the agents dashboard @copyberry
- #39143 Hydrate recommended plugin metadata on selection @copyberry
- #39145 Persist active permission profiles in turn context @copyberry
- #39147 Centralize persisted resume settings lookup @copyberry
- #39152 Update PyPI publish action to v1.14.2 @copyberry
- #39153 Restore permission profiles when resuming threads @copyberry
- #39154 Box the TUI future to bound CLI stack usage @copyberry
- #39155 Prepare Python SDK 0.147.0 stable release @copyberry
- #39157 Notify clients when Guardian requires strict review @copyberry
- #39159 Require approval for commands with dynamic shell words @copyberry
- #39163 Refresh collaboration instructions when their content changes @copyberry
- #39165 Prevent marketplace identity spoofing @copyberry
- #39174 Skip empty user messages for automatic idle turns @copyberry
- #39176 Drop descendant progress updates after remote compaction @copyberry
- #39187 Scope MCP app resource reads to their originating call @copyberry
- #39192 Preserve MCP resource origins across compaction @copyberry
- #39200 Add a symlink-safe reader for sensitive files @copyberry
- #39205 Reject symbolic links in memory workspaces @copyberry
- #39213 Add a fail-closed Tree-sitter PowerShell lowerer @copyberry
- #39214 Prevent custom providers from inheriting ambient auth @copyberry
- #39220 Reconnect Guardian sampling WebSockets after auth changes @copyberry
- #39221 Skip redirected external-agent migration destinations @copyberry
- #39224 Add Guardian v2 approval review metrics @copyberry
- #39227 Include node_repl screenshots in Guardian v2 reviews @copyberry
- #39235 Decouple Noise relay streams from JSON-RPC processing @copyberry
- #39240 Deduplicate remote plugin bundle syncs with shared semaphores @copyberry
- #39241 Record Guardian v2 classification metrics @copyberry
- #39242 Add safe permission profile intersection @copyberry
- #39244 Scope MCP resource reads by connector @copyberry
- #39246 Give Guardian classifier connections distinct thread identities @copyberry
- #39249 Add exec-server forwarding mode @copyberry
- #39256 Deduplicate rollout moves when archiving threads @copyberry
- #39257 Reconnect WebRTC Realtime sideband transports @copyberry
- #39259 Simplify unified exec output snapshots @copyberry
- #39261 Stop TUI chats on misalignment policy violations @copyberry
- #39262 Prevent ConPTY DLL loading from the current directory @copyberry
- #39264 Improve Guardian v2 risk classification @copyberry
- #39266 Require fresh approval beneath denied permission paths @copyberry
- #39267 Inject Node REPL policy into Guardian review sessions @copyberry
- #39273 Preserve thread names during rollout migration @copyberry
- #39274 Add provider-owned authentication recovery @copyberry
- #39277 Declare experimental Amazon Bedrock setup APIs @copyberry
- #39278 Preserve owner-provided environment configuration @copyberry
- #39279 Propagate Windows sandbox ACL update failures @copyberry
- #39281 Move shell snapshot scripts into `codex-shell-command` @copyberry
- #39283 Document secure devcontainer DNS exfiltration risk @copyberry
- #39284 Report network disconnects during approval @copyberry
- #39285 Show file destinations in TUI change approvals @copyberry
- #39287 Report diagnostic upload failures @copyberry
- #39288 Register the async message feature flag @copyberry
- #39290 Add Windows sandbox diagnostics to `codex doctor` @copyberry
- #39293 Remove app-server's direct reqwest dependency @copyberry
- #39294 Increase SQLite log sink batching @copyberry
- #39296 Enable MCP tool hooks in Codex sessions @copyberry
- #39298 Allow overriding Codex package versions @copyberry
- #39299 Restrict agent roles to bounded configuration overrides @copyberry
- #39301 Prevent Node REPL auth tokens from reaching child processes @copyberry
- #39303 Record Guardian v2 classification token usage @copyberry
- #39304 Keep Guardian v2 risk scores in memory @copyberry
- #39306 Honor managed config during project discovery @copyberry
- #39307 Fail closed on Guardian V2 risk scoring errors @copyberry
- #39309 Attribute executor skill invocations to plugins @copyberry
- #39311 Bind unified exec approvals to shell executables @copyberry
- #39312 Add async delivery metadata to agent messages @copyberry
- #39314 Run hooks with the captured session environment @copyberry
- #39315 Evict guardian transcript entries in cacheable chunks @copyberry
- #39316 Support Edu Plus and Edu Pro account plans @copyberry
- #39319 Add the async user message tool @copyberry
- #39320 Expand OAuth metadata redirect test coverage @copyberry
- #39322 Enforce workspace restrictions for header authentication @copyberry
- #39325 Stop migrating Cursor sandbox settings @copyberry
- #39331 Route hook MCP calls through current connections @copyberry
- #39335 Enforce environment MCP policies @copyberry
- #39372 Scope TUI approval requests to their threads @copyberry
- #39385 Prefer the most recent session when queueing by name @copyberry
- #39402 Remove npm package staging from repo checks @copyberry
- #39404 Support FD mounts with older system Bubblewrap versions @copyberry
- #39410 Refresh expired AWS credentials for Bedrock @copyberry
- #39452 Remove the feature gate for async user messages @copyberry
- #39474 Consolidate Guardian extensions into `codex-guardian-v2` @copyberry
- #39480 Move shell snapshot tests into shell-command @copyberry
- #39493 Make head-tail buffer capacity const generic @copyberry
- #39494 Test panoramic Guardian transcript image resizing @copyberry
- #39496 Use default timeouts in cyber exec policy tests @copyberry
- #39497 Correct normalized dynamic tool coverage across response modes @copyberry
- #39501 Use a narrow fixture for the unified image resize test @copyberry
- #39505 Test text stringify errors in the code mode runtime @copyberry
- #39506 Test code mode notifications without a sync tool call @copyberry
- #39509 Test disabled enhanced Node REPL transcript images separately @copyberry
- #39510 Track built-in control tool calls in analytics @copyberry
- #39514 Use stored item types when materializing turn summaries @copyberry
- #39515 Use `mem::take` to drain unified exec output buffers @copyberry
- #39520 Isolate automatic plugin Git operations @copyberry
- #39523 Persist thread section moves before the first turn @copyberry
- #39524 Stop treating Git commands as inherently safe @copyberry
- #39584 Add a just recipe for assembling Codex packages @copyberry
- #39585 Test plugin sync isolation from repository Git config @copyberry
- #39586 Isolate IPC in Bubblewrap sandboxes @copyberry
- #39588 Preserve unparsed shell wrappers in exec policy @copyberry
- #39590 Harden plugin manifest handling during installation @copyberry
- #39592 Prevent SQLx warnings from feeding back into SQLite logs @copyberry
- #39594 Raise the MCP tool name limit to 128 bytes @copyberry
- #39595 Keep marketplace upgrade state out of config @copyberry
- #39597 Separate thread settings from environment configuration @copyberry
- #39599 Protect macOS Seatbelt writable root anchors @copyberry
- #39601 Keep async user messages on the direct tool surface @copyberry
- #39602 Use in-process parsing for PowerShell command classification @copyberry
- #39604 Preserve queued TUI input semantics @copyberry
- #39605 Hide approved automatic review warnings in the TUI @copyberry
- #39606 Enable user namespaces in shared CI setup @copyberry
- #39607 Resolve model-provided shells by type @copyberry
- #39608 Harden skill installation against unsafe symlinks @copyberry
- #39609 Limit Bazel integration test threads on macOS @copyberry
- #39611 Harden MCP OAuth fallback credential writes @copyberry
- #39614 Prevent `apply_patch` from widening write permissions @copyberry
- #39615 Bind MCP OAuth refresh tokens to their issuer @copyberry
- #39616 Validate linked worktrees before inheriting project trust @copyberry
- #39618 Apply composer editing preferences to TUI text prompts @copyberry
- #39619 Preserve inline TUI scrollback in Windows Terminal @copyberry
- #39620 Stream executor capability and skill file reads @copyberry
- #39623 Prevent protected-path rename bypasses in macOS Seatbelt @copyberry
- #39625 Add cwd-relative turn diff paths @copyberry
- #39629 Preserve parent repository discovery through sandbox metadata mounts @copyberry
- #39630 Retire the untrusted approval policy @copyberry
- #39631 Skip sandboxed shell commands in Guardian v2 by default @copyberry
- #39632 Expose permission profile resolution in the core API @copyberry
- #39635 Show strict review warnings in the TUI @copyberry
- #39637 Treat `invalid_grant` refresh failures as permanent @copyberry
- #39640 Prompt to unarchive sessions before resuming or forking @copyberry
- #39641 Sanitize developer context in full-history agent forks @copyberry
- #39645 Enforce managed residency for model providers @copyberry
- #39646 Exercise restricted-token sandboxing in cyber policy tests @copyberry
- #39649 Resolve bundled Windows helpers through bin junctions @copyberry
- #39653 Enforce filesystem permissions when loading AGENTS.md @copyberry
- #39655 Make core integration test permissions explicit @copyberry
- #39656 Advertise the Desktop app in graphical Linux sessions @copyberry
- #39657 Warn when launching the deprecated MCP server @copyberry
- #39658 Let Guardian V2 satisfy required model reviews @copyberry
- #39659 Harden unsandboxed patch filesystem access @copyberry
- #39661 Expand Vim change commands and add character replacement @copyberry
- #39662 Add max and ultra reasoning efforts to the SDKs @copyberry
- #39663 Restrict plugin migration to home scope @copyberry
- #39665 Add macOS Seatbelt filesystem integration tests @copyberry
- #39666 Improve no-follow filesystem behavior across platforms @copyberry




## rust-v0.148.0 — 2026-08-18

## New Features

- Export complete TUI conversations to Markdown with `/export`, either to the clipboard or a new file. (#37358)
- Fork sessions with `codex exec fork`, and archive or restore sessions from the TUI resume picker. (#37367, #37369, #37371)
- Draft prompts while the TUI initializes, with resume and fork progress shown during startup. (#38642, #38788)
- View estimated thread credits or cost in `/status`, status lines, and terminal titles for eligible workspaces. (#38281, #38282)
- Use Amazon Bedrock Runtime as a built-in provider with AWS profile, region, and GPT-5.6 routing support. (#38470)
- Hooks can now run commands asynchronously and invoke MCP tools. (#37533, #38705)

## Bug Fixes

- Model switches and settings updates no longer leave stale instructions behind or change an active turn midstream. (#37260, #38785)
- Resumed sessions now restore their persisted working directory and approval policy, with more accurate transcript previews. (#37198, #37368, #38605)
- Turns reconnect through temporary provider outages, and MCP servers recover after OAuth reauthentication without restarting Codex. (#37337, #37485, #38418)
- TUI startup no longer lets buffered terminal input activate prompts accidentally, and onboarding appears when authentication is missing. (#38641, #38643, #38644)
- Composer and transcript rendering now handle CRLF pastes, wrapped whitespace, and long URLs correctly. (#37709, #38380, #38704)
- Sandbox restrictions now fail closed for denied or unreadable paths across Linux and Windows. (#37875, #38026, #38416, #38660)

## Documentation

- The bundled skill-creator guide is more focused, and validation now rejects unfinished TODO placeholders. (#38384)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.147.0...rust-v0.148.0

- #37190 Interrupt cyber model turns after one Guardian denial @copyberry
- #37191 Preserve legacy semantics during rollout migration @copyberry
- #37198 Prefer persisted cwd when reading local threads @copyberry
- #37199 Track thread archive analytics @copyberry
- #37204 Add durable user-message queue dispatch @copyberry
- #37206 Add a unified image budget @copyberry
- #37210 Fetch remote installed plugins across all scopes @copyberry
- #37211 Harden network proxy MITM authorization @copyberry
- #37248 Cover remote MCP discovery timeout cleanup @copyberry
- #37252 Allow agent roles on full-history forks @copyberry
- #37260 Fix first-turn model switching and rollback @copyberry
- #37261 Start cached MCP servers lazily for subagents @copyberry
- #37267 Support plugin roots in the host skill loader @copyberry
- #37273 Reuse MCP handlers across sampling steps @copyberry
- #37279 Avoid cloning immutable metadata on tool search cache hits @copyberry
- #37335 Fully repaint inline viewports after history overlap @copyberry
- #37336 Use step environments for extension turn input @copyberry
- #37337 Recover MCP servers after OAuth reauthentication @copyberry
- #37338 Honor the configured ChatGPT origin in connector install URLs @copyberry
- #37339 Reload app-server telemetry after account changes @copyberry
- #37340 Consolidate deferred environment provisioning APIs @copyberry
- #37341 Support content references for inline visualizations @copyberry
- #37342 Preserve foreign cwd URIs for turn-input contributors @copyberry
- #37343 Stage Bazel app-server test binaries in `TEST_TMPDIR` @copyberry
- #37344 Fix subagent MCP startup status settling @copyberry
- #37345 Send model routing hints to the Codex backend @copyberry
- #37347 Track context windows per agent @copyberry
- #37348 Add rollout migration tooling and background migration @copyberry
- #37349 Mount a minimal `/dev` in full-filesystem Bubblewrap sandboxes @copyberry
- #37350 Allow `ThreadManager` to customize thread ID generation @copyberry
- #37352 Configure the default code-mode exec yield timeout @copyberry
- #37354 Retry busy app-server test executable spawns @copyberry
- #37356 Support agent identity endpoint overrides @copyberry
- #37357 Clamp short wait_agent timeouts to the configured minimum @copyberry
- #37358 Add Markdown conversation export to the TUI @copyberry
- #37360 Use consistent TUI input placeholders @copyberry
- #37363 Recognize MCP tool hook configurations @copyberry
- #37366 Harden local MCP server process tree cleanup @copyberry
- #37367 Add session forking to `codex exec` @copyberry
- #37368 Restore approval policy when resuming threads @copyberry
- #37369 Add session archiving to the resume picker @copyberry
- #37371 Restore archived sessions from the resume picker @copyberry
- #37389 Add tool namespace metadata configuration @copyberry
- #37400 Rename the tool registry metadata setting @copyberry
- #37406 Add a loader for executor-local config layers @copyberry
- #37408 Add executor-local config reads to the exec server @copyberry
- #37424 Cap project instructions across environments @copyberry
- #37433 Expose multi-agent versions in model/list @copyberry
- #37434 Add process diagnostics snapshots @copyberry
- #37439 Add shared skill root loading interfaces @copyberry
- #37440 Load plugin skill roots through the host skills service @copyberry
- #37444 Unify plugin skill loading with the host skill service @copyberry
- #37446 Preserve base instruction provenance across sessions @copyberry
- #37447 Respect plugin skill availability in tool suggestions @copyberry
- #37452 Unify plugin skill loading through the shared loader @copyberry
- #37457 Remove the legacy core skill loader @copyberry
- #37461 Remove the unused remote skills client @copyberry
- #37466 Move skill config rule resolution into `codex-config` @copyberry
- #37470 Expose app-server diagnostics through the experimental API @copyberry
- #37477 Include call IDs in MCP requests and clarify metadata config @copyberry
- #37478 Shard state unit tests under Bazel @copyberry
- #37479 Report temporary directories in exec-server environment info @copyberry
- #37480 Delegate remote process sandboxing to the executor @copyberry
- #37483 Interrupt active code-mode cells with their turn @copyberry
- #37485 Keep response streams alive through connection failures @copyberry
- #37486 Expose runtime activity in server diagnostics @copyberry
- #37488 Generalize skill locator aliases across providers @copyberry
- #37489 Alias resource-backed skill locators under context pressure @copyberry
- #37492 Include tool namespace inventory in turn metadata @copyberry
- #37494 Add MCP event discovery and subscriptions @copyberry
- #37497 Limit payload traces in diagnostic logs @copyberry
- #37498 Preserve child waiters during process termination @copyberry
- #37500 Remove the legacy code-mode tool metadata inventory @copyberry
- #37503 Move host skill prompt injection into the skills extension @copyberry
- #37504 Disable Nagle's algorithm for code-mode WebSockets @copyberry
- #37505 Remove the codex-core-skills crate @copyberry
- #37507 Include sandbox mode in response metadata @copyberry
- #37510 Define the code-mode host gRPC protocol @copyberry
- #37511 Enforce automatic review for managed models @copyberry
- #37513 Reuse parent compactions in Guardian review sessions @copyberry
- #37516 Ignore reusable command approvals for cyber models @copyberry
- #37519 Expose auto-review ignore rules in config requirements @copyberry
- #37527 Terminate timed-out hook process trees @copyberry
- #37528 Keep external agent detection from blocking config requests @copyberry
- #37530 Implement the gRPC code-mode host service @copyberry
- #37533 Support asynchronous command hooks @copyberry
- #37538 Expose execution mode in hook listings @copyberry
- #37607 Prevent launch context from reaching child processes @copyberry
- #37610 Add workload identity token exchange support @copyberry
- #37618 Use step environments for Guardian approval reviews @copyberry
- #37622 Include buffered turns when editing prompts @copyberry
- #37641 Use the step context for command approval prefix rules @copyberry
- #37644 Generalize hook handler execution @copyberry
- #37645 Improve plugin install failure analytics @copyberry
- #37654 Advertise environment config read support @copyberry
- #37709 Keep wrapped composer whitespace with following text @copyberry
- #37723 Report I/O subtypes for session config import failures @copyberry
- #37745 Add gRPC TCP transport to the code-mode host @copyberry
- #37747 Bound Cursor project path resolution @copyberry
- #37757 Add a line-ending preservation mode to `apply_patch` @copyberry
- #37758 Add a feature flag to preserve apply_patch line endings @copyberry
- #37773 Forward install attempt IDs for remote plugins @copyberry
- #37788 Use native transparency in the imagegen skill @copyberry
- #37806 Initialize the install attempt ID in the plugin analytics test @copyberry
- #37807 Share model-visible tool specs across prompts @copyberry
- #37808 Simplify package-based skill reads @copyberry
- #37810 Support packaged defaults in config layering @copyberry
- #37812 Keep multi-workspace skill listings consistent @copyberry
- #37828 Track running unified exec processes at turn completion @copyberry
- #37832 Remove obsolete plugin skill discovery helpers @copyberry
- #37833 Encapsulate watchable skill root selection @copyberry
- #37836 Run plugin and skill tests on Windows @copyberry
- #37838 Tighten the skills extension API surface @copyberry
- #37842 Speed up MCP OAuth credential reads @copyberry
- #37843 Use the shared environment scrubber in git-utils @copyberry
- #37847 Preserve environments when reloading V2 agents @copyberry
- #37848 Expose the session ID to shell commands @copyberry
- #37850 Expose plugin ownership in MCP server status @copyberry
- #37851 Route intercepted exec approvals through shared review @copyberry
- #37860 Speed up MCP OAuth credential reads @copyberry
- #37862 Rename environment config for turn scope @copyberry
- #37864 Support MCP form input in full-access user threads @copyberry
- #37866 Add MCP OAuth credential contention regression tests @copyberry
- #37867 Reject duplicate resolved paths in apply_patch @copyberry
- #37871 Extract persisted history types into a dedicated crate @copyberry
- #37874 Keep runtime summary metrics out of Statsig exports @copyberry
- #37875 Honor the configured Windows sandbox level for managed networking @copyberry
- #37878 Add configurable goal token budget limits @copyberry
- #37882 Read safety buffering from response metadata @copyberry
- #37886 Extend bundled package discovery and expose its version @copyberry
- #37889 Ignore Unix socket proxy settings on Windows @copyberry
- #37891 Use thread configuration for `app/read` @copyberry
- #37892 Validate images before returning `view_image` output @copyberry
- #37895 Add configurable Responses API request metadata @copyberry
- #37896 Add hermetic Windows SDK and MSVC runtime repositories @copyberry
- #37898 Add appearance metadata to thread sections @copyberry
- #37901 Make submission operations move-only @copyberry
- #37902 Defer `view_image` processing to history insertion @copyberry
- #37906 Make gRPC code-mode notifications fire-and-forget @copyberry
- #37908 Apply refreshed cloud config bundles to later sessions @copyberry
- #37922 Extract reusable code-mode host test support @copyberry
- #37926 Distinguish turn-start thread persistence @copyberry
- #37929 Add shared runtime build information @copyberry
- #37939 Validate images before returning `view_image` output @copyberry
- #37970 Cache tool catalogs for streamable HTTP MCP servers @copyberry
- #37979 Honor per-directory bundled skill settings in `skills/list` @copyberry
- #37984 Stop re-exporting skill APIs from `codex-core` @copyberry
- #38011 Remove config lockfile support @copyberry
- #38020 Retry transient exec-server startup failures @copyberry
- #38024 Expose image generation usage-limit failures @copyberry
- #38026 Fail closed on unsafe Linux unreadable globs @copyberry
- #38032 Hide approved Guardian assessments from TUI history @copyberry
- #38033 Use session metadata to validate thread history paths @copyberry
- #38034 Filter live rollout items in place @copyberry
- #38035 Propagate MCP elicitation event delivery failures @copyberry
- #38036 Limit TUI streaming traces in SQLite logs @copyberry
- #38040 Propagate custom CA settings to local MCP servers @copyberry
- #38041 Add gRPC-backed code-mode sessions @copyberry
- #38043 Sandbox remote apply_patch operations @copyberry
- #38044 Compact code mode tool calls in TUI history @copyberry
- #38045 Store model history in response item envelopes @copyberry
- #38046 Include auto-review state in turn metadata @copyberry
- #38047 Add turn-aware response item injection @copyberry
- #38049 Harden network proxy credential brokerage @copyberry
- #38051 Run required CI against pull request merge commits @copyberry
- #38052 Add per-login MCP OAuth client registration selection @copyberry
- #38054 Add configuration-backed external authentication @copyberry
- #38056 Configure PSP routing through the feature system @copyberry
- #38057 Track artifact operations from trusted plugin markers @copyberry
- #38058 Preserve harness metadata across conversation history @copyberry
- #38060 Disable storage for Azure Responses requests @copyberry
- #38061 Preserve proxy settings for Windows sandbox debug sessions @copyberry
- #38064 Grant Windows sandbox access to the Codex app root @copyberry
- #38066 Track resource-backed skill invocations @copyberry
- #38067 Scope environment readiness config to thread attachments @copyberry
- #38072 Forward gRPC code-mode callbacks to session delegates @copyberry
- #38074 Track implicit executor skill invocations @copyberry
- #38075 Respect rendered width when adding TUI history @copyberry
- #38078 Reduce cloning in world-state patch handling @copyberry
- #38080 Allow nested Git repositories in the Windows sandbox @copyberry
- #38081 Use `ReviewDecision` for MCP tool approvals @copyberry
- #38083 Remove standard form input from app-server docs @copyberry
- #38084 Allow empty input to start a turn @copyberry
- #38086 Support execution-host context when resolving cloud config @copyberry
- #38087 Route gRPC code-mode sessions through the shared HTTP client @copyberry
- #38089 Add CIMD support to MCP OAuth registration @copyberry
- #38092 Simplify queued user message admission @copyberry
- #38094 Test Guardian context for code mode commands @copyberry
- #38101 Attach hosted app context to file uploads @copyberry
- #38103 Avoid cloning MCP invocations in TUI history @copyberry
- #38108 Route MCP tool calls through shared approval handling @copyberry
- #38127 Distinguish rollout IDs from thread IDs @copyberry
- #38165 Resolve subagent analytics connections lazily @copyberry
- #38167 Read executor skill packages directly @copyberry
- #38170 Notify running turn watchers only on count changes @copyberry
- #38172 Update `lru` and `webbrowser` dependencies @copyberry
- #38179 Embed defaults in the packaged config layer @copyberry
- #38183 Add conservative restriction helpers for tool policies @copyberry
- #38184 Run search tool integration tests on Windows @copyberry
- #38186 Stop overriding environments in the skills user-turn test @copyberry
- #38188 Integrate workload identity with Codex authentication @copyberry
- #38189 Run plugin app-server tests in automatic environments @copyberry
- #38197 Add an LRU baseline to skill shadow selection @copyberry
- #38204 Fuse recent and lexical skills in shadow selection @copyberry
- #38205 Enforce non-interactive approval policy for Codex delegates @copyberry
- #38214 Avoid allocations when sanitizing TUI user text @copyberry
- #38217 Start required cached MCP servers lazily for subagents @copyberry
- #38227 Add a flag to retain client developer messages @copyberry
- #38228 Detect implicit skill invocations from PowerShell reads @copyberry
- #38232 Track root turns across delegated Codex requests @copyberry
- #38238 Add manifest-defined metrics for trusted plugin scripts @copyberry
- #38239 Add bounded plugin measurement analytics @copyberry
- #38241 Include Node REPL policy in turn metadata @copyberry
- #38242 Cache stable active-cell layout measurements @copyberry
- #38243 Track client-authored developer messages in rollout history @copyberry
- #38244 Resolve paginated thread history by rollout ID @copyberry
- #38245 Add dynamic HTTP header helpers for MCP servers @copyberry
- #38251 Read model ETags from WebSocket metadata events @copyberry
- #38252 Collect metrics from plugin shell commands @copyberry
- #38253 Collect plugin metrics from unified exec commands @copyberry
- #38256 Report the latest rejection from multiple network reviews @copyberry
- #38257 Reconnect gRPC code-mode sessions after host restarts @copyberry
- #38258 Unify external authentication provider handling @copyberry
- #38261 Resolve skill package aliases in `skills.read` @copyberry
- #38265 Use bounded fallback ports for Windows managed proxies @copyberry
- #38268 Expose executor skill roots from `skills.read` @copyberry
- #38270 Add per-thread usage queries to the backend client @copyberry
- #38272 Stamp conversation history items with creation times @copyberry
- #38274 Represent persisted world state as JSON objects @copyberry
- #38275 Unify turn input submission and routing @copyberry
- #38276 Track plugin metrics for background unified exec commands @copyberry
- #38278 Add app-server coverage for plugin measurement analytics @copyberry
- #38280 Use protobuf's built-in Bazel proto rule @copyberry
- #38281 Show estimated thread usage in `/status` @copyberry
- #38282 Add thread usage to TUI status surfaces @copyberry
- #38283 Collect plugin metrics from remote executors @copyberry
- #38285 Move `codex-execpolicy` to protocol dev dependencies @copyberry
- #38288 Support gRPC code-mode hosts in app server @copyberry
- #38291 Remove unused apply_patch prompt fallback @copyberry
- #38292 Add durable reverts for paginated threads @copyberry
- #38299 Route network access through the shared approval pipeline @copyberry
- #38303 Add interrupted turn recovery @copyberry
- #38306 Protect inline visualization viewers from sandbox writes @copyberry
- #38321 Make gRPC code-mode yield tests deterministic @copyberry
- #38336 Add Guardian V2 extension scaffold @copyberry
- #38356 Support sandboxed file streaming in exec-server @copyberry
- #38358 Optimize orphan output normalization @copyberry
- #38361 Test hook rejection for explicitly started queue items @copyberry
- #38362 Stabilize exec-server byte-budget tests @copyberry
- #38363 Persist security risk scores in rollout history @copyberry
- #38368 Add the Guardian V2 Luna sampler @copyberry
- #38377 Constrain Guardian reviews to parent filesystem permissions @copyberry
- #38380 Preserve user message styling when wrapping long URLs @copyberry
- #38381 Prevent unread events from blocking in-process requests @copyberry
- #38383 Return Luna samples when streamed JSON completes @copyberry
- #38384 Refine skill creation guidance and validation @copyberry
- #38390 Use effective permissions when trusting app-server projects @copyberry
- #38394 Reject sessions with unloadable required managed hooks @copyberry
- #38396 Reap orphaned processes in Linux sandboxes @copyberry
- #38397 Include Node REPL results in Guardian reviews @copyberry
- #38399 Preserve floating-point values when decoding rollout lines @copyberry
- #38400 Refresh tracing interest in the token estimate test @copyberry
- #38403 Expose conversation history to tool lifecycle extensions @copyberry
- #38406 Pool Guardian sampling WebSocket connections @copyberry
- #38409 Classify tool calls in the Guardian V2 extension @copyberry
- #38413 Allow metadata updates without materializing threads @copyberry
- #38414 Add bounded transcript rendering for Guardian v2 @copyberry
- #38415 Recognize PowerShell `Get-Content` file reads @copyberry
- #38416 Honor filesystem permissions for app file uploads @copyberry
- #38418 Clarify MCP OAuth reauthentication errors @copyberry
- #38419 Apply Codex attribution to app-created commits @copyberry
- #38420 Recover capability discovery after executor disconnects @copyberry
- #38423 Centralize thread environment selection state @copyberry
- #38424 Fail closed when workload identity initialization fails @copyberry
- #38426 Protect workload identity auth in app-server account RPCs @copyberry
- #38427 Add Guardian guidance for Node REPL tool calls @copyberry
- #38429 Route curated plugin catalogs by authentication mode @copyberry
- #38432 Gate Node REPL Guardian guidance on model metadata @copyberry
- #38436 Add rustls fallback for local MCP HTTP requests @copyberry
- #38439 Preserve approval policies for auto-reviewed models @copyberry
- #38440 Add app-server support for reverting paginated threads @copyberry
- #38441 Give Guardian V2 full tool action context @copyberry
- #38443 Tag current time reminders in model context @copyberry
- #38445 Retain client developer messages across context compaction @copyberry
- #38446 Refresh current-time reminders for full-history subagents @copyberry
- #38447 Add running-task exit choices to local daemon sessions @copyberry
- #38448 Support per-server MCP OAuth callback ports @copyberry
- #38449 Expose model upgrade retirement times @copyberry
- #38450 Embed the Windows sandbox setup manifest in Bazel builds @copyberry
- #38452 Add structured telemetry for response retries @copyberry
- #38454 Include node_repl images in Guardian review evidence @copyberry
- #38456 Add experimental thread queue APIs to app server @copyberry
- #38460 Add an `AbsolutePathBuf` conversion for `FileSystemPath` @copyberry
- #38461 Centralize turn environment selection state @copyberry
- #38463 Preserve thread subscriptions across revert reloads @copyberry
- #38467 Parse model annotations from skill frontmatter @copyberry
- #38470 Add an Amazon Bedrock Runtime provider @copyberry
- #38473 Stop generating accepted-line fingerprints @copyberry
- #38475 Add bounded skill model delegation instructions @copyberry
- #38483 Include agent names in turn metadata @copyberry
- #38484 Search selected plugin apps before falling back @copyberry
- #38492 Enforce strict auto-review for MCP tool calls @copyberry
- #38493 Reuse pending MCP startups during reconciliation @copyberry
- #38494 Verify bundled bwrap in Bazel builds @copyberry
- #38499 Enable parallel tool calls for all model prompts @copyberry
- #38521 Carry environment config in turn selections @copyberry
- #38527 Configure Guardian sampling for responses lite @copyberry
- #38540 Record Guardian V2 risk scores on threads @copyberry
- #38553 Initialize Guardian V2 samplers per thread @copyberry
- #38555 Preserve Guardian transcript boundaries in sampling input @copyberry
- #38558 Improve Guardian transcript context selection @copyberry
- #38561 Restrict filesystem helper sandbox access @copyberry
- #38564 Reuse compatible parent compactions in Guardian V2 @copyberry
- #38567 Store security risk scores as a snapshot @copyberry
- #38568 Run tool start callbacks after pre-tool hooks @copyberry
- #38569 Require automatic review for high-risk Guardian v2 actions @copyberry
- #38579 Report thread storage changes after rollout migration @copyberry
- #38580 Keep the latest Guardian risk score during concurrent sampling @copyberry
- #38581 Honor cloud-managed requirements in feature listings @copyberry
- #38586 Bound Guardian V2 tool actions before risk classification @copyberry
- #38592 Let extensions resolve approval reviews before Guardian @copyberry
- #38596 Prioritize new Guardian classifications under load @copyberry
- #38597 Install Guardian V2 in the app server @copyberry
- #38601 Make unbounded connection retries configurable @copyberry
- #38602 Isolate Guardian reviewer sessions from parent extensions @copyberry
- #38604 Avoid paginated resume requests for verified legacy rollouts @copyberry
- #38605 Fix resume transcript preview line selection @copyberry
- #38606 Allow larger gRPC code mode tool descriptions @copyberry
- #38608 Fix the missing resume picker history mode import @copyberry
- #38610 Support workload identity in remote exec-server auth @copyberry
- #38612 Skip stale Guardian risk score persistence @copyberry
- #38615 Remove the gRPC code-mode enabled tool limit @copyberry
- #38616 Route escalated approval retries through Guardian @copyberry
- #38617 Prioritize global models in the Bedrock Runtime catalog @copyberry
- #38618 Apply Guardian policies to v2 risk classification @copyberry
- #38619 Source multi-agent instructions from the model catalog @copyberry
- #38621 Preserve large gRPC code-mode tool errors @copyberry
- #38623 Preserve MCP namespace descriptions in the tool catalog cache @copyberry
- #38624 Open notes when accepting the request input Other option @copyberry
- #38625 Enable unified exec by default on Windows @copyberry
- #38628 Make Guardian v2 risk classification configurable @copyberry
- #38630 Remove the gRPC code-mode open session limit @copyberry
- #38634 Add MCP protocol discovery metrics @copyberry
- #38635 Remove repository-local Codex skills @copyberry
- #38639 Render the initial TUI session header before input @copyberry
- #38641 Harden TUI startup input handling @copyberry
- #38642 Keep the composer editable during TUI startup @copyberry
- #38643 Delay the startup composer until first-login onboarding @copyberry
- #38644 Show onboarding when Codex home lacks authentication state @copyberry
- #38645 Deliver gRPC code-mode notifications without truncation @copyberry
- #38646 Read Apple notarization issuer ID from Key Vault @copyberry
- #38647 Add an override to skip project configuration @copyberry
- #38649 Reuse the TUI startup account response during bootstrap @copyberry
- #38650 Canonicalize default namespaces in gRPC subscription filters @copyberry
- #38651 Move permission profile snapshots into the protocol @copyberry
- #38657 Skip terminal hyperlink layout when no links are present @copyberry
- #38660 Enforce managed deny-read rules in the Windows sandbox @copyberry
- #38662 Delete Thai combining marks one at a time in the composer @copyberry
- #38664 Resolve local JSON Schema refs in Code Mode types @copyberry
- #38670 Forward executor network policy decisions for auditing @copyberry
- #38673 Honor per-environment permission profiles @copyberry
- #38675 Exclude shortcut-modified input from TUI paste bursts @copyberry
- #38678 Preserve environment configuration ownership @copyberry
- #38681 Preserve HTTP fallback for delegated sessions @copyberry
- #38682 Surface misalignment policy violations as typed errors @copyberry
- #38684 Support pending environment attachment configuration @copyberry
- #38690 Propagate request trace context through exec-server relays @copyberry
- #38701 Route permission requests through shared Guardian approvals @copyberry
- #38703 Refresh hook runtimes after plugin changes @copyberry
- #38704 Normalize CRLF line endings in pasted text @copyberry
- #38705 Add MCP tool handler support to the hooks engine @copyberry
- #38743 Scope TUI app directory state to the active context @copyberry
- #38746 Remove the TUI test dependency on `codex-cli` @copyberry
- #38767 Forward workload identity context during token exchange @copyberry
- #38774 Use paginated history for persistent exec threads @copyberry
- #38785 Keep active-turn model settings stable across updates @copyberry
- #38788 Show resume and fork status during TUI startup @copyberry
- #38795 Add storage diagnostics to `codex doctor` @copyberry
- #38800 Route executor policy audits through log-only telemetry @copyberry
- #38806 Add a health endpoint to the code-mode gRPC listener @copyberry




## rust-v0.147.0 — 2026-08-07

## New Features
- Install portable Agent Plugins and search across local, personal, workspace, and remote plugin catalogs. (#36544, #36409, #36919, #36796)
- Organize conversations into persistent, manually ordered sections and browse long transcripts incrementally. (#35722, #36007, #36380, #36948, #36950)
- Enable automatically reviewed approvals with the new `--approve-for-me` CLI flag. (#36373)
- Import Cursor-managed skills and synchronize changes to imported Claude and Cursor conversations without creating duplicates. (#36361, #36356, #35623)
- Support the opt-in MCP 2026-07-28 protocol, including paginated discovery, multi-round requests, and non-blocking server startup. (#35724, #35725, #35590, #35742)
- Enable cached web search and remote conversation compaction for Amazon Bedrock. (#36938, #36981)

## Bug Fixes
- Redact secrets and complete bearer tokens from displayed commands and replayed conversation history. (#36893, #36908)
- Prevent lost or stalled terminal input when focus returns, MCP servers initialize, or Ghostty handles keyboard shortcuts. (#35649, #35957, #36834)
- Correct rendering and cursor positioning for Japanese characters, emoji, hyperlinks, and text near viewport boundaries. (#35960, #35962, #37166)
- Properly interrupt Windows background processes and handle Windows filesystem paths consistently. (#35655, #35851, #37129)
- Require explicit trust for unfamiliar local projects and enforce managed authentication restrictions before credentials are used. (#36960, #37132)
- Harden plugin isolation and deny network access when policy updates fail. (#37027, #36967, #36037)

## Documentation
- Improve the bundled OpenAI documentation skill with targeted official-source lookup and clearer guidance for Codex, model selection, and API workflows. (#36014)

## Chores
- Upgrade the MCP SDK to 3.0.0, Ratatui to 0.30.2, and V8 to 150.4.0. (#36001, #35959, #35831)
- Secure macOS release notarization using Azure Key Vault instead of exporting private signing keys. (#37154)
- Remove the deprecated `codex exec --full-auto` flag; use `--sandbox workspace-write` instead. (#36054)
- Stop publishing redundant Linux bundle archives; use the standard `codex-package-<target>` release archives. (#36342)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.146.0...rust-v0.147.0

- #35590 Expose cached MCP tools before server startup @copyberry
- #35594 Recommend longer waits in the v2 wait_agent schema @copyberry
- #35595 Allow alpha hotfix versions in R2 releases @copyberry
- #35597 Add metrics for extension-rendered skill catalogs @copyberry
- #35607 Record metrics for empty skill catalogs @copyberry
- #35608 Support model-owned token budget defaults @copyberry
- #35621 Skip restored token usage replay for exec resumes @copyberry
- #35623 Parse Claude and Cursor session records separately @copyberry
- #35642 Make OpenTelemetry provider shutdown idempotent @copyberry
- #35644 Preserve thread metadata when rollout files are missing @copyberry
- #35649 Preserve TUI input when terminal focus returns @copyberry
- #35652 Enable network policy callbacks for remote exec @copyberry
- #35653 Test developer instruction inheritance for multi-agent workers @copyberry
- #35655 Terminate Windows non-TTY processes on interrupt @copyberry
- #35656 Preserve multi-agent settings across config representations @copyberry
- #35661 Place host skills before permission instructions @copyberry
- #35663 Evaluate character matching over skill routing metadata @copyberry
- #35665 Fix the async watcher test harness on Windows @copyberry
- #35668 Expose the network proxy spec constructor @copyberry
- #35670 Raise the Windows exec yield floor to 10 seconds @copyberry
- #35671 Route curated plugins by authentication mode @copyberry
- #35675 Prepare MCP and plugin recommendations concurrently @copyberry
- #35678 Preserve paginated thread metadata across resumes @copyberry
- #35685 Load cloud-managed profiles for `codex sandbox` @copyberry
- #35688 Point crossterm patch to the OpenAI OSS fork @copyberry
- #35689 Preserve item timestamps in thread history projections @copyberry
- #35691 Include empty-preview threads in relationship listings @copyberry
- #35693 Refresh the subagent picker in the background @copyberry
- #35695 Honor the configured SQLite home in the logs client @copyberry
- #35708 Add configurable developer instructions for v2 subagents @copyberry
- #35715 Support streaming bodies in route-aware HTTP requests @copyberry
- #35717 Reuse route-aware clients for OpenAI file uploads @copyberry
- #35720 Upgrade rmcp to 3.0.0-beta.3 @copyberry
- #35721 Honor disabled code mode fallback without a process host @copyberry
- #35722 Add persisted sections for organizing threads @copyberry
- #35724 Add MCP 2026-07-28 discovery support @copyberry
- #35725 Complete MCP 2026 client support @copyberry
- #35738 Add bounded metadata for executed tool calls @copyberry
- #35742 Avoid blocking turns on optional MCP startup @copyberry
- #35744 Keep agent registry identities consistent @copyberry
- #35766 Emit host skill budget warnings from world state @copyberry
- #35769 Share the skills budget across host and executor catalogs @copyberry
- #35772 Throttle models cache TTL renewals @copyberry
- #35773 Scale skill metadata budgets with context windows @copyberry
- #35777 Resolve MCP tool catalogs concurrently @copyberry
- #35779 Load thread titles concurrently during session startup @copyberry
- #35785 Support self-serve Business ProLite accounts @copyberry
- #35787 Gate paginated thread history on the state database @copyberry
- #35794 Wait for MCP readiness in the curated sync test @copyberry
- #35802 Tag reports with the selected turn's model and effort @copyberry
- #35806 Route MCP OAuth through configured HTTP clients @copyberry
- #35814 Use configured HTTP clients for all MCP OAuth requests @copyberry
- #35818 Advance latest-alpha-cli after release publishing completes @copyberry
- #35821 Use the shared HTTP client for TUI network checks @copyberry
- #35825 Use the shared HTTP client for announcement tips @copyberry
- #35828 Enforce centralized SQLite connection creation @copyberry
- #35830 Route WebRTC sideband joins to the Realtime API @copyberry
- #35831 Update rusty_v8 to 150.4.0 @copyberry
- #35835 Track parent turns for nested Codex requests @copyberry
- #35836 Clean up cancelled MCP elicitation requests @copyberry
- #35837 Expose plugin eligibility metadata in app-server summaries @copyberry
- #35839 Decouple recommended plugins from tool suggestions @copyberry
- #35840 Handle legacy MCP discovery prevalidation errors @copyberry
- #35843 Tie remote exec servers to their parent stdin @copyberry
- #35845 Support plaintext collaboration tool messages @copyberry
- #35850 Preserve foreign paths in background terminal listings @copyberry
- #35851 Normalize Windows namespace paths in path URIs @copyberry
- #35854 Box app-server event payloads @copyberry
- #35856 Resolve imported connectors by MCP server name @copyberry
- #35857 Add Bazel unit test targets for Rust binaries @copyberry
- #35859 Expose plugin installation timestamps in app-server summaries @copyberry
- #35870 Include session titles in external agent import history @copyberry
- #35874 Mark the primary environment in model context @copyberry
- #35875 Allow environment readiness updates in place @copyberry
- #35878 Use step environments for MCP file uploads @copyberry
- #35886 Show blocked goals as stalled in the TUI @copyberry
- #35887 Clean up side conversations in the background @copyberry
- #35895 Inherit ready step environments when spawning agents @copyberry
- #35937 Let unrelated tools run while MCP servers start @copyberry
- #35941 Bound MCP namespace descriptions @copyberry
- #35942 Update tests for current tool call and app-server event types @copyberry
- #35944 Report direct input capability for listed subagents @copyberry
- #35957 Fix TUI input queue handling during MCP startup @copyberry
- #35959 Upgrade Ratatui to 0.30.2 @copyberry
- #35960 Preserve hyperlink cell widths during terminal diffing @copyberry
- #35962 Fix TUI layout for halfwidth Japanese sound marks @copyberry
- #35982 Avoid cloning rollout history when truncating forks @copyberry
- #35989 Display title-only reasoning summaries in the TUI @copyberry
- #35990 Test exec-server compatibility across Codex versions @copyberry
- #35992 Group external agent config migration into a module @copyberry
- #35997 Remove obsolete rusty_v8 146.4.0 Bazel targets @copyberry
- #36001 Upgrade rmcp to 3.0.0 @copyberry
- #36002 Resolve MCP file uploads with environment-native paths @copyberry
- #36006 Reduce response serialization and rollout scan overhead @copyberry
- #36007 Add persisted manual ordering for thread sections @copyberry
- #36008 Route pet asset downloads through the shared HTTP client @copyberry
- #36011 Share optional MCP startup grace across connection sets @copyberry
- #36014 Refine OpenAI docs skill source routing @copyberry
- #36020 Avoid cloning ignored analytics notifications @copyberry
- #36030 Increase the app-server tracing test stack size @copyberry
- #36031 Load cloud-managed servers in MCP CLI commands @copyberry
- #36033 Use the shared HTTP client in codex-protocol @copyberry
- #36035 Exit the stdio app-server when its connection closes @copyberry
- #36036 Allow naming forked chats from the TUI @copyberry
- #36037 Deny network access when an allow amendment fails @copyberry
- #36039 Limit MCP catalog pagination @copyberry
- #36043 Document the Responses API proxy reqwest exception @copyberry
- #36045 Distinguish unknown MCP authentication status @copyberry
- #36047 Extract MCP environment headers into a local variable @copyberry
- #36049 Keep tool-call metrics out of Statsig exports @copyberry
- #36051 Avoid overwriting symlinked migration targets @copyberry
- #36054 Remove legacy `--full-auto` handling from `codex exec` @copyberry
- #36055 Expose MCP read-only hints in tool call items @copyberry
- #36076 Remove codex-core's direct reqwest dependency @copyberry
- #36078 Route Ollama through the shared HTTP client @copyberry
- #36083 Handle fractional rate limits in thread history projection @copyberry
- #36092 Correlate image requests and explicit interrupts with turns @copyberry
- #36119 Unify tool runtime assembly before router construction @copyberry
- #36120 Delegate readiness waits to tool runtimes @copyberry
- #36121 Sandbox executor skill resource reads @copyberry
- #36124 Respect filesystem permissions during capability discovery @copyberry
- #36127 Centralize tool registration and protect host tools @copyberry
- #36128 Preserve delegated tasks across remote compaction @copyberry
- #36129 Resolve normalized tool name collisions in code mode @copyberry
- #36133 Preserve executor workspace permissions for apply_patch @copyberry
- #36138 Isolate apply-patch permission test variants @copyberry
- #36139 Bound the code mode output termination test @copyberry
- #36140 Wait for memory consolidation shutdown before finishing jobs @copyberry
- #36146 Stabilize approval scenario tests @copyberry
- #36148 Harden the file change approval integration test @copyberry
- #36149 Strengthen session file change approval coverage @copyberry
- #36165 Stabilize file approval replay test @copyberry
- #36166 Make pending realtime sideband test deterministic @copyberry
- #36167 Harden the auto-review model override test @copyberry
- #36168 Make tool telemetry tag collection synchronous @copyberry
- #36171 Test workspace-root patch protection for metadata @copyberry
- #36177 Test remote Guardian network approval scoping @copyberry
- #36181 Record attempted tool calls in response metadata @copyberry
- #36183 Use permission profiles throughout sandbox execution @copyberry
- #36184 Coalesce concurrent remote metadata requests @copyberry
- #36187 Refresh environment dates from the configured clock @copyberry
- #36188 Make thread history projection resilient to malformed rollouts @copyberry
- #36191 Label explicit skill injection metrics @copyberry
- #36194 Avoid shifting bytes in streaming output buffers @copyberry
- #36207 Record normalized sandbox violation events @copyberry
- #36212 Precompute app-server protocol exports @copyberry
- #36217 Run code mode exclusively through the standalone host @copyberry
- #36218 Expose connector candidates in external agent detection @copyberry
- #36221 Ignore passthrough metadata when reconciling rollout items @copyberry
- #36223 Preserve executor paths in read command actions @copyberry
- #36228 Support Enterprise automation account plans @copyberry
- #36237 Ignore symbolic slash-tmp permissions on Windows @copyberry
- #36239 Refresh precomputed app-server protocol exports @copyberry
- #36264 Prefer the bundled resource for the code mode host @copyberry
- #36271 Derive report prompt hashes from persisted rollouts @copyberry
- #36306 Restrict hosted MCP credentials to local environments @copyberry
- #36309 Use the host skill provider catalog in world state @copyberry
- #36310 Isolate MCP OAuth credentials by environment @copyberry
- #36311 Include skills in debug prompt input output @copyberry
- #36327 Preserve discovery order for host skill path aliases @copyberry
- #36329 Restrict `shell_command` to a single local environment @copyberry
- #36336 Detect connectors used in external agent sessions @copyberry
- #36339 Enable skills in the MCP server @copyberry
- #36342 Stop publishing legacy Linux bundle archives @copyberry
- #36350 Require explicit sandbox permissions with shell justifications @copyberry
- #36351 Use model catalog collaboration mode messages @copyberry
- #36354 Pass sessions directly to session tasks @copyberry
- #36355 Keep MCP tool calls bound to their thread @copyberry
- #36356 Sync updates to imported external agent sessions @copyberry
- #36357 Use the step-scoped router for tool execution @copyberry
- #36359 Consolidate MCP config editing in codex-core @copyberry
- #36360 Use MCP bindings as the step tool catalog @copyberry
- #36361 Migrate Cursor-managed skills into Codex @copyberry
- #36364 Move skill catalog rendering out of core @copyberry
- #36365 Add strict automatic review for MCP elicitations @copyberry
- #36367 Keep effective tool exposure in the registry @copyberry
- #36372 Run native Windows Bazel tests with MSVC @copyberry
- #36373 Add an `--approve-for-me` CLI flag @copyberry
- #36374 Enable sandboxed V8 for code mode @copyberry
- #36378 Load local session pickers from the state DB first @copyberry
- #36380 Add thread section management APIs @copyberry
- #36384 Load turn summaries with paginated queries @copyberry
- #36385 Add acknowledged user message submission to core @copyberry
- #36388 Track image preparation details in turn analytics @copyberry
- #36389 Enforce single-writer ownership for all thread histories @copyberry
- #36393 Avoid redundant filesystem probes @copyberry
- #36402 Declare the experimental plugin search API @copyberry
- #36408 Allow custom Codex instructions for realtime transitions @copyberry
- #36409 Implement remote plugin search @copyberry
- #36410 Make user input blocking behavior explicit @copyberry
- #36411 Use Git repositories as pre-tool hook test markers @copyberry
- #36413 Add a realtime delegation acknowledgement control @copyberry
- #36440 Extract exec-server request dispatching @copyberry
- #36482 Avoid querying terminal size on every TUI redraw @copyberry
- #36485 Increase remote plugin bundle size limits @copyberry
- #36507 Retain attempted tool metadata across prompts @copyberry
- #36511 Support two-stroke TUI key chords @copyberry
- #36534 Raise the MCP catalog item limit to 2,048 @copyberry
- #36544 Support portable Agent Plugins throughout installation @copyberry
- #36632 Preserve SQLite thread metadata during goal mutations @copyberry
- #36635 Expose onboarding hints in login completion notifications @copyberry
- #36641 Capture rollout budget units from response usage @copyberry
- #36715 Use provider-reported rollout budget units @copyberry
- #36716 Deduplicate MCP resource operation handling @copyberry
- #36727 Simplify turn metadata state ownership @copyberry
- #36729 Correlate code mode tool analytics with model responses @copyberry
- #36732 Stabilize the cloud environment HTTP test @copyberry
- #36734 Deduplicate MCP resource list handling @copyberry
- #36740 Store turn skill state in extension data @copyberry
- #36742 Simplify contextual user fragment registration @copyberry
- #36744 Store the extension registry directly in its builder @copyberry
- #36745 Consolidate apply_patch runtime execution @copyberry
- #36757 Wait for patch events before reading shell snapshots @copyberry
- #36759 Harden the TUI focus palette regression test @copyberry
- #36764 Avoid building code-mode definitions during registration @copyberry
- #36769 Stabilize the startup Git enrichment integration test @copyberry
- #36770 Stabilize deferred goal fork testing @copyberry
- #36771 Harden Linux managed proxy helper lifecycles @copyberry
- #36772 Raise the host-owned Codex Apps catalog limit @copyberry
- #36773 Derive the active user config layer from the layer stack @copyberry
- #36774 Clarify config layer iteration APIs @copyberry
- #36779 Stabilize network policy event capture in concurrent tests @copyberry
- #36781 Add per-surface MCP tool exposure controls @copyberry
- #36782 Add Guardian session reuse and interruption tests @copyberry
- #36787 Consolidate model instructions in `ModelMessages` @copyberry
- #36792 Gate plugin usage instructions by model capability @copyberry
- #36793 Terminate timed-out Git process trees @copyberry
- #36796 Add Agent Plugins MCP config parsing @copyberry
- #36797 Normalize rusty_v8 checksum manifest line endings @copyberry
- #36800 Avoid reinjecting permissions after command approvals @copyberry
- #36807 Extract audio preparation into a utility crate @copyberry
- #36808 Prefer SQLite names for local session archive commands @copyberry
- #36809 Prefer the state database for `exec resume --last` @copyberry
- #36810 Add MCP client conformance regression gates @copyberry
- #36811 Honor per-environment login shell policy @copyberry
- #36812 Add a dual-WebSocket transport for code mode @copyberry
- #36815 Identify agents by name in token budget context @copyberry
- #36822 Fix typo in approval resolver name @copyberry
- #36825 Consolidate approval telemetry context @copyberry
- #36830 Time out stalled code-mode host requests @copyberry
- #36834 Avoid requesting key-release events in Ghostty @copyberry
- #36840 Keep API request metrics out of Statsig exports @copyberry
- #36856 Support deferred loading for freeform tools @copyberry
- #36857 Support custom tools in namespaces @copyberry
- #36862 Consolidate thread spawning behind a request object @copyberry
- #36871 Parallelize R2 asset publishing with DotSlash @copyberry
- #36877 Move executor skill bundle loading into the skills extension @copyberry
- #36880 Move direct executor skill discovery into the skills extension @copyberry
- #36882 Preserve complete MCP namespace descriptions @copyberry
- #36884 Add host skill root loading @copyberry
- #36892 Support leaf models in multi-agent v2 @copyberry
- #36893 Redact secrets from app-server command execution items @copyberry
- #36895 Handle late MCP startup results after lag timeout @copyberry
- #36898 Avoid redundant filesystem metadata probes @copyberry
- #36900 Register app tools independently of the connector list @copyberry
- #36901 Propagate updated permissions to review threads @copyberry
- #36903 Load skill interface metadata in the host loader @copyberry
- #36904 Limit RMCP logs persisted to SQLite @copyberry
- #36906 Preserve model providers when reloading v2 agents @copyberry
- #36908 Improve bearer token secret redaction @copyberry
- #36910 Negotiate MCP extensions per app-server session @copyberry
- #36912 Read approval policy from the current turn configuration @copyberry
- #36913 Move skill policy resolution into `codex-skills` @copyberry
- #36916 Centralize app enabled-state evaluation @copyberry
- #36917 Test explicit plugin mentions with disabled apps @copyberry
- #36919 Merge local plugins into plugin search results @copyberry
- #36921 Move the host skills service into the skills extension @copyberry
- #36924 Reject implicitly discovered bare Git repositories @copyberry
- #36930 Read turn permissions from the current configuration @copyberry
- #36935 Trust undecided local projects automatically @copyberry
- #36938 Enable cached web search for Amazon Bedrock @copyberry
- #36939 Include policy approval reasons in Guardian reviews @copyberry
- #36941 Use current session settings for review threads @copyberry
- #36943 Move host skill root resolution into the skills extension @copyberry
- #36945 Grant the blob size policy job read access to contents @copyberry
- #36947 Accept user input when starting idle turns @copyberry
- #36948 Paginate transcript history in the TUI @copyberry
- #36949 Improve paginated TUI history loading @copyberry
- #36950 Paginate TUI transcript history @copyberry
- #36951 Harden paginated history handling in the TUI @copyberry
- #36952 Add durable per-thread user submission queues @copyberry
- #36954 Add tool registry collision policy configuration @copyberry
- #36956 Keep image resize notices attached during remote compaction @copyberry
- #36959 Track connectors detected in external agent sessions @copyberry
- #36960 Prompt before trusting local project directories @copyberry
- #36963 Link Codex attribution in pull request bodies @copyberry
- #36964 Preserve working directories when importing external sessions @copyberry
- #36966 Allow disabling the built-in image viewer @copyberry
- #36967 Skip symlinks when installing plugins @copyberry
- #36970 Make token budget context identity configurable @copyberry
- #36976 Honor explicit-only orchestrator skills @copyberry
- #36977 Improve connector detection for migrated sessions @copyberry
- #36979 Add Fence auditing to the blob size workflow @copyberry
- #36981 Enable remote compaction for Amazon Bedrock @copyberry
- #36983 Preserve ChatGPT auth for trusted staging MCP servers @copyberry
- #36984 Support configured ChatGPT cookies in HTTP clients @copyberry
- #36986 Add process-scoped PSP routing for ChatGPT requests @copyberry
- #36987 Add opt-in concurrent exec-server request dispatch @copyberry
- #36989 Preserve shared bundled skill caches @copyberry
- #36990 Remove legacy collaboration mode variants @copyberry
- #36992 Allow injecting model catalog caches @copyberry
- #36993 Support `includeTurns` reads for paginated threads @copyberry
- #36998 Support deferred custom tools in tool search @copyberry
- #37000 Keep shared skill caches fresh across plugin loads @copyberry
- #37020 Enforce strict tool name collision errors @copyberry
- #37022 Canonicalize default tools under the `functions` namespace @copyberry
- #37027 Enforce Agent Plugin runtime boundaries @copyberry
- #37031 Apply permission profile updates to future turn environments @copyberry
- #37035 Align registry tests with canonical tool names @copyberry
- #37038 Use turn environment permissions for tool execution @copyberry
- #37040 Use turn environment permissions for context and discovery @copyberry
- #37053 Reject conflicting namespace descriptions in strict tool mode @copyberry
- #37055 Add safer TUI defaults for cyber models @copyberry
- #37066 Preserve longer MCP source descriptions in tool search @copyberry
- #37068 Fall back to per-process MCP cleanup on macOS @copyberry
- #37083 Consolidate unified exec output state @copyberry
- #37101 Reuse stable MCP bindings across sampling steps @copyberry
- #37103 Use Luna for API-key Guardian reviews @copyberry
- #37109 Bound interactive telemetry shutdown @copyberry
- #37114 Add per-session code-mode execution limits @copyberry
- #37128 Centralize tool approval handling in `Session` @copyberry
- #37129 Make Windows path URI comparisons ASCII-case-insensitive @copyberry
- #37132 Enforce managed authentication requirements locally @copyberry
- #37134 Report prompt image resizing to the model @copyberry
- #37144 Preserve discovery paths for symlinked skills @copyberry
- #37145 Gate Apps usage instructions by model capability @copyberry
- #37147 Track provisioned environment state across registration @copyberry
- #37149 Project orchestrator skills through world state @copyberry
- #37151 Coalesce concurrent Git status scans @copyberry
- #37154 Use Azure Key Vault for macOS notarization @copyberry
- #37156 Test remote environments reported ready before selection @copyberry
- #37157 Harden named session lookup in the TUI @copyberry
- #37162 Load host skill roots through the skills extension @copyberry
- #37166 Keep textarea cursors and rendering inside the viewport @copyberry
- #37167 Expose session sources to MCP contributors @copyberry
- #37168 Bound remote MCP handshake HTTP requests @copyberry
- #37169 Move plugin skill snapshot integration tests into core @copyberry
- #37174 Centralize skill invocation helpers in `codex-skills` @copyberry
- #37175 Add legacy rollout migration to paginated history @copyberry
- #37177 Move explicit skill selection into the skills crate @copyberry
- #37178 Preserve image transparency metadata in app-server items @copyberry
- #37188 Reserve the `tool_search` namespace for the search tool @copyberry
- #37189 Track multi-agent usage hints in world state @copyberry




## rust-v0.146.1 — 2026-08-05

## Bug Fixes

- Apply safer automatic-review defaults for cyber-capable models and explain permission changes in the terminal interface. (#37057)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.146.0...rust-v0.146.1

- #37057 [0.146] Backport safer cyber-model auto-review defaults @anp-oai




## rust-v0.146.0 — 2026-07-29

## New Features

- Name new sessions with `/new` or `/clear`, pin important threads, and switch between side conversations without closing them. (#34605, #34840, #35011)
- Support Agent Plugins manifests, workspace plugin publishing, and additional plugin marketplaces for Amazon Bedrock and Claude Code. (#35105, #35254, #34931, #34979)
- Fork threads with paginated history, including temporary forks that do not appear in thread listings. (#35220, #35251)
- Connect app-server to remote Code Mode hosts over WebSocket. (#35078, #35098)
- Enable standalone web search for compatible custom model providers. (#34846)
- Discover executor-provided skills and securely read their associated resources, including explicitly selected skills. (#35184, #35198)

## Bug Fixes

- Honor configured proxies across authentication, plugin downloads, MCP authorization, remote execution, WebSockets, redirects, and LM Studio connections. (#34479, #34509, #34655, #34678, #35023, #35056, #35239)
- Keep MCP connections and Apps tools current when authentication or configuration changes, reconnecting closed servers without restarting healthy connections. (#34952, #34957, #35028, #35144, #35146, #35151)
- Preserve submitted messages, final responses, failed-turn errors, imported timestamps, and approval settings across interruptions, replay, imports, and forks. (#34839, #34777, #35524, #34989, #34664)
- Improve terminal responsiveness and rendering, including nonblocking interrupts, keyboard handling, narrow layouts, hyperlinks, and refreshed mention results. (#35000, #35021, #34775, #34778, #35365, #35375)
- Fix Windows navigation keys, reliably terminate sandboxed process trees, and preserve proxy settings during security reviews. (#34625, #34624, #35036)
- Retain more available skills under tight context budgets and warn when skill catalogs must be truncated. (#34732, #34738, #34997)

## Documentation

- Document shared HTTP-client usage, proxy-aware connection pooling, and safe outbound request handling. (#34669)
- Clarify Windows drive-letter canonicalization for `PathUri` values. (#34667)

## Chores

- Publish release artifacts, channel metadata, and installer aliases through OpenAI-hosted release infrastructure, with GitHub fallback. (#34505, #34508, #34729, #34910)
- Sign and notarize bundled macOS helper executables before packaging. (#35264)
- Reduce app-server serialization overhead and unnecessary request-building allocations. (#34761, #34766, #34825)
- Add enterprise-plan recognition and administrator controls for in-app updates. (#35238, #35537)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.145.0...rust-v0.146.0

- #34447 Add a route-aware HTTP client pool @copyberry
- #34449 Make external session detection limits configurable @copyberry
- #34451 Attribute external agent imports by provider @copyberry
- #34463 Support alpha hotfix release versions @copyberry
- #34469 Preserve thread settings for goal-first and forked threads @copyberry
- #34476 Separate HTTP execution from request logging @copyberry
- #34478 Honor `CARGO_HTTP_CAINFO` in managed proxy environments @copyberry
- #34479 Re-resolve system proxy routes across redirects @copyberry
- #34481 Add route-aware redirect test coverage @copyberry
- #34483 Expand route-aware proxy redirect coverage @copyberry
- #34490 Route backend requests through the HTTP client factory @copyberry
- #34491 Route cloud environment discovery through the HTTP client pool @copyberry
- #34495 Honor system proxy settings in the daemon updater @copyberry
- #34497 Preserve custom arg0 for sandboxed exec-server processes @copyberry
- #34505 Mirror Rust release artifacts to Cloudflare R2 @copyberry
- #34506 Respect system proxies during plugin startup sync @copyberry
- #34508 Publish release metadata to R2 channels @copyberry
- #34509 Honor system proxy settings for remote plugins @copyberry
- #34514 Add an optional releases.openai.com installer source @copyberry
- #34516 Allow `numer` in codespell checks @copyberry
- #34517 Pass empty inherited FDs in the Wine PTY test @copyberry
- #34522 Split MCP connection manager into focused modules @copyberry
- #34525 Add step-scoped data to extension contributors @copyberry
- #34533 Centralize compacted rollout item construction @copyberry
- #34540 Detach Git metadata commands from stdin @copyberry
- #34544 Size Noise handshake buffers to their messages @copyberry
- #34547 Add reciprocal rank fusion skill selection @copyberry
- #34550 Test thread-scoped MCP refresh behavior @copyberry
- #34551 Simplify TUI restoration for the external editor @copyberry
- #34552 Remove unused RtOptions setters @copyberry
- #34553 Remove the unused TUI shutdown app command @copyberry
- #34558 Remove obsolete ignored tests @copyberry
- #34559 Add backend client support for Codex user settings @copyberry
- #34561 Extract MCP binding clients from the connection manager @copyberry
- #34562 Record rollout boundaries for materialized turns @copyberry
- #34563 Page through inherited thread history @copyberry
- #34566 Protect fork history references during rollout cleanup @copyberry
- #34570 Highlight CUDA files as C++ in the TUI @copyberry
- #34573 Accept `forceRefetch` in plugin list requests @copyberry
- #34578 Gate the TUI suspend restore helper on Unix @copyberry
- #34581 Add routing-card lexical skill selection @copyberry
- #34588 Bind MCP calls to captured catalog revisions @copyberry
- #34590 Add keyed shell environment policy filters @copyberry
- #34597 Enforce exact values from managed config requirements @copyberry
- #34598 Skip missing paths in filesystem sandbox entries @copyberry
- #34601 Sanitize skill names in injection metrics @copyberry
- #34603 Allow explicitly permitted loopback proxy targets @copyberry
- #34605 Allow naming sessions with `/new` and `/clear` @copyberry
- #34611 Add compatibility policies for skill catalog rendering @copyberry
- #34612 Detach non-interactive subprocesses from stdin @copyberry
- #34613 Route Windows sandbox proxy traffic by restricting SID @copyberry
- #34615 Initialize missing-path behavior in exec-server sandbox test @copyberry
- #34620 Add exec-server network policy callback types @copyberry
- #34621 Load paginated model context across rollout lineages @copyberry
- #34622 Increase the auto-review model override test timeout @copyberry
- #34624 Terminate Windows process trees with job objects @copyberry
- #34625 Fix Windows TUI navigation key handling @copyberry
- #34626 Scale skill metadata budgets with model context windows @copyberry
- #34629 Harden Windows elevated sandbox startup @copyberry
- #34630 Add a policy-aware HTTP client builder @copyberry
- #34631 Migrate agent identity to the shared HTTP client @copyberry
- #34636 Keep the TUI open when starting a turn fails @copyberry
- #34637 Attribute review findings to repository rules @copyberry
- #34640 Update Windows process-tree tests for inherited FDs @copyberry
- #34641 Harden managed proxy setup for sandboxed executions @copyberry
- #34643 Migrate login HTTP construction to `HttpClient` @copyberry
- #34644 Verify Git plugin SHA checkouts @copyberry
- #34645 Always assign response item IDs @copyberry
- #34649 Propagate resolved proxy policy through auth routing @copyberry
- #34650 Require auth managers to receive routing configuration @copyberry
- #34651 Migrate core test support to the shared HTTP client @copyberry
- #34654 Render turn diffs for foreign environment paths @copyberry
- #34655 Honor configured proxy routes for auth refreshes @copyberry
- #34664 Preserve approvals reviewer when forking threads @copyberry
- #34667 Document `PathUri` drive letter canonicalization @copyberry
- #34669 Expand codex-http-client usage guidance @copyberry
- #34678 Route LM Studio requests through the shared HTTP client @copyberry
- #34681 Add session headers to realtime conversation starts @copyberry
- #34687 Configure Codex Auto Review model metadata @copyberry
- #34708 Rename the MCP connection manager to `McpConnectionSet` @copyberry
- #34713 Order unified exec lifecycle events reliably @copyberry
- #34728 Skip Git enrichment for prewarm and Guardian turns @copyberry
- #34729 Publish stable installer aliases to R2 @copyberry
- #34732 Preserve skill catalog entries under metadata pressure @copyberry
- #34733 Make MCP resource clients follow the latest runtime @copyberry
- #34734 Remove step-scoped data from extension contributors @copyberry
- #34738 Drop skill descriptions before omitting catalog entries @copyberry
- #34744 Update skills budget tests for extension API changes @copyberry
- #34746 Match core skill ordering in extension catalogs @copyberry
- #34747 Register the MCP 2026-07-28 feature flag @copyberry
- #34761 Reduce app-server JSON serialization overhead @copyberry
- #34763 Retry websocket requests when the previous response is missing @copyberry
- #34766 Reduce typed app-server request serialization overhead @copyberry
- #34769 Add the git attribution extension @copyberry
- #34770 Enable exec-server network policy callbacks @copyberry
- #34771 Size unified mention popups to visible results @copyberry
- #34772 Normalize whitespace-only lines in agent messages @copyberry
- #34775 Clamp session headers to narrow terminal widths @copyberry
- #34777 Include the final agent message in turn completion summaries @copyberry
- #34778 Coalesce wrapped OSC 8 hyperlinks in the TUI terminal @copyberry
- #34779 Use the live parent history mode when forking agents @copyberry
- #34781 Upgrade Bazel Rust and LLVM dependencies @copyberry
- #34784 Reject dynamic environments named `local` @copyberry
- #34785 Report skill catalog truncation during rendering @copyberry
- #34786 Simplify app-server integration test setup @copyberry
- #34789 Avoid unnecessary post-sampling token estimates @copyberry
- #34795 Remove obsolete step store from git attribution tests @copyberry
- #34796 Skip syntax highlighting for lines over 4 KiB @copyberry
- #34797 Suppress omission notices in core-compatible skill catalogs @copyberry
- #34806 Use path URIs in shell approval keys @copyberry
- #34808 Centralize SQLite connection configuration @copyberry
- #34811 Fix network access rendering in sandbox prompts @copyberry
- #34814 Consolidate thread startup around `StartThreadOptions` @copyberry
- #34816 Support configurable realtime BEM channel prefixes @copyberry
- #34819 Enable git attribution across Codex entry points @copyberry
- #34823 Run code-mode tests in non-Windows Bazel CI @copyberry
- #34824 Normalize Guardian review cwd reuse keys @copyberry
- #34825 Reduce cloning when building Responses requests @copyberry
- #34827 Remove Windows Bazel lint toolchain overrides @copyberry
- #34831 Flush analytics before in-process app server shutdown @copyberry
- #34835 Track compaction time in turn profiles @copyberry
- #34839 Preserve user input when MCP startup is interrupted @copyberry
- #34840 Add persisted thread pinning to the app server @copyberry
- #34844 Remove first-party type from app metadata @copyberry
- #34845 Track multi-agent mode in world state @copyberry
- #34846 Allow custom providers to opt into standalone web search @copyberry
- #34847 Use Guardian model limits for review sessions @copyberry
- #34849 Cache remote plugin catalogs by scope @copyberry
- #34850 Disable image generation for Free-plan accounts @copyberry
- #34851 Use batch metadata for plugin app summaries @copyberry
- #34852 Wake sleeping threads for queued agent mail @copyberry
- #34877 Wait for local plugin cache refreshes in `plugin/list` @copyberry
- #34883 Set a default user agent for MCP HTTP requests @copyberry
- #34887 Allow disabling the multi-agent wait tool @copyberry
- #34910 Prefer releases.openai.com in standalone installers @copyberry
- #34930 Centralize thread MCP state in `McpRuntime` @copyberry
- #34931 Use the API plugin marketplace for Amazon Bedrock @copyberry
- #34940 Keep session defaults static during config batch writes @copyberry
- #34952 Reuse MCP connections across runtime refreshes @copyberry
- #34957 Replace closed MCP connections during reconciliation @copyberry
- #34959 Handle @ in local marketplace paths @copyberry
- #34962 Move MCP connection helpers into the test module @copyberry
- #34969 Keep the sleep tool outside code mode @copyberry
- #34978 Honor disabled redirects in route-aware HTTP clients @copyberry
- #34979 Infer the bundled Claude Code plugin marketplace @copyberry
- #34981 Record externally completed agent config imports @copyberry
- #34986 Enforce single-writer ownership for paginated threads @copyberry
- #34989 Preserve timestamps when importing external agent sessions @copyberry
- #34991 Allow omitting MCP tool prefixes per server @copyberry
- #34994 Honor the configured SQLite home across state consumers @copyberry
- #34995 Initialize execution environments with the final HTTP policy @copyberry
- #34996 Separate Codex error details from retry metadata @copyberry
- #34997 Warn when skill catalogs exceed their context budget @copyberry
- #35000 Make TUI turn interrupts nonblocking @copyberry
- #35011 Keep side conversations open when switching threads @copyberry
- #35012 Expose remote skill icon URLs through app server @copyberry
- #35013 Support incremental replay of updated thread items @copyberry
- #35015 Align installed app duration metrics with the legacy baseline @copyberry
- #35016 Add trusted plugin script attribution @copyberry
- #35020 Attribute command executions to trusted plugin scripts @copyberry
- #35021 Adapt keyboard event reporting to the terminal @copyberry
- #35023 Route exec-server HTTP through configured proxy policy @copyberry
- #35028 Preserve refreshed Apps tools across MCP runtime updates @copyberry
- #35029 Preserve plugin attribution across command approvals @copyberry
- #35031 Enforce writer ownership for thread archive and deletion @copyberry
- #35033 Expose Browser Use requirements through the app server @copyberry
- #35034 Route environment registry requests through the shared HTTP client @copyberry
- #35036 Preserve Windows sandbox proxy settings in guardian sessions @copyberry
- #35048 Track app/read request duration @copyberry
- #35049 Register the Guardian V2 feature flag @copyberry
- #35054 Allow disabling the update_plan tool @copyberry
- #35056 Route exec-server WebSockets through configured proxies @copyberry
- #35059 Decouple exec-server HTTP from reqwest types @copyberry
- #35063 Track deferred tool namespaces in world state @copyberry
- #35065 Avoid duplicating deferred sources in tool search @copyberry
- #35067 Fix Bazel test configuration for platform-specific data @copyberry
- #35078 Add WebSocket transport to the code-mode host @copyberry
- #35098 Support remote code-mode hosts in app-server @copyberry
- #35105 Support Agent Plugins manifests @copyberry
- #35106 Allow hosts to customize `wait_for_environment` descriptions @copyberry
- #35144 Prewarm MCP runtime updates in the background @copyberry
- #35146 Refresh MCP runtimes when session auth changes @copyberry
- #35151 Reconnect MCP servers on explicit refresh @copyberry
- #35164 Encapsulate MCP refresh coordination @copyberry
- #35168 Route extension warnings to app-server threads @copyberry
- #35172 Compact host skill paths under metadata pressure @copyberry
- #35175 Wait for reloaded worker completion in the resume test @copyberry
- #35184 Expose executor skills through skill tools @copyberry
- #35194 Preserve output from hooks that exit before reading stdin @copyberry
- #35196 Make the Apps recovery exposure test deterministic @copyberry
- #35198 Enable resource reads for explicit executor skills @copyberry
- #35204 Refresh MCP runtimes across thread startup @copyberry
- #35205 Use current MCP authority for elicitation reviews @copyberry
- #35213 Refresh managed MCP requirements for active threads @copyberry
- #35216 Refresh MCP config independently across threads @copyberry
- #35220 Support paginated thread forks @copyberry
- #35221 Avoid persisting non-local threads for hook transcripts @copyberry
- #35238 Support the ent26 enterprise plan @copyberry
- #35239 Route MCP auth discovery through runtime HTTP clients @copyberry
- #35251 Support ephemeral forks of paginated threads @copyberry
- #35254 Expose workspace plugin publish capability @copyberry
- #35261 Propagate remote plugin IDs to skill metadata @copyberry
- #35262 Track remote plugin IDs in skill invocation analytics @copyberry
- #35264 Sign bundled macOS helper binaries @copyberry
- #35266 Allow disabling the in-process code-mode host fallback @copyberry
- #35267 Harden network approval cancellation and concurrency @copyberry
- #35271 Include code-mode tool names in Responses Lite metadata @copyberry
- #35275 Trace remote exec-server connection setup @copyberry
- #35280 Skip plugin MCP filtering when no allowlists are configured @copyberry
- #35359 Handle exec-server network policy requests in the client @copyberry
- #35363 Include item start times in completion events @copyberry
- #35364 Bound Code Mode metadata compatibility headers @copyberry
- #35365 Keep unified mention results fresh @copyberry
- #35375 Make the keymap action menu responsive @copyberry
- #35408 Ignore generated system skills in the skills watcher @copyberry
- #35414 Raise the MCP server recursion limit @copyberry
- #35523 Shut down the in-process outbound router explicitly @copyberry
- #35524 Preserve terminal turn errors in replayed history @copyberry
- #35525 Skip inactive TUI threads without pending user interaction @copyberry
- #35530 Track model and personality in world state @copyberry
- #35537 Add managed policy for in-app updates @copyberry




## rust-v0.145.0 — 2026-07-21

## New Features

- Added experimental paginated thread history with efficient resume, search, persisted names, sub-agent support, and memories. (#33364, #33907, #34085, #34229, #34386)
- Expanded `/import` to migrate Cursor and Claude Code settings, MCP servers, plugins, sessions, commands, and project-scoped memories. (#31672, #33411, #33426, #33444)
- Added experimental Amazon Bedrock login, custom endpoint and authentication support, and GPT-5.6 Sol as the default Bedrock model. (#31327, #33170, #33175, #32288, #33695)
- Added audio inputs and tool outputs, including common local audio formats, and introduced streaming realtime V3 conversations. (#33261, #33856, #33932, #34080, #34385)
- Stabilized the opt-in multi-agent V2 experience with configurable sub-agent models, reasoning levels, concurrency, restored roles, and improved agent navigation. (#33550, #33631, #33657, #33841, #34383)
- Added secure, clickable inline visualization links in the terminal UI. (#33925, #34217, #34346)

## Bug Fixes

- Editing an earlier prompt or retrying a safety-buffered turn now creates a contextual branch, preserving the original conversation, attachments, and mention bindings. (#33201, #33207, #33211)
- Improved terminal responsiveness for long conversations and streamed output through incremental Markdown rendering, fewer redraws, caching, and bounded command output. (#34045, #34049, #34216, #34223, #34359)
- Prevented slow or conflicting MCP startup and authentication flows by enforcing startup timeouts, avoiding blocking OAuth discovery, serializing refreshes, and reusing tool catalogs safely. (#32229, #32781, #32825, #33184, #33297)
- Improved Windows execution and sandbox reliability, including native exec-server sandboxing, network-proxy enforcement, hidden helper consoles, and correctly quoted hook commands. (#32849, #32857, #33926, #34423)
- Fixed compact release-metadata parsing and macOS code-mode installation, with an in-process fallback when the external code-mode host is unavailable. (#31667, #31876, #31899)
- Strengthened safety and approval handling with better forced-`rm` detection, consistent full-access confirmation, and preserved rejection reasons across tools. (#32989, #33464, #34400)

## Documentation

- Updated the bundled OpenAI Docs skill with current GPT-5.6 model resolution, prompting, and migration guidance across macOS, Linux, and Windows. (#31842, #33121)

## Chores

- Migrated bundled GPT-5.4 selections and internal uses to the corresponding GPT-5.6 Terra and Luna variants. (#33173)
- Reduced startup and large-context overhead with concurrent skill/plugin discovery and more efficient remote compaction. (#31566, #33369, #33423, #34431)
- Updated the packaged ripgrep binary to 15.2.0. (#34384)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.0...rust-v0.145.0

- #31667 fix: parse compact release metadata in installer @efrazer-oai
- #31362 core: route realtime and memories through HTTP client factory @bolinfest
- #31566 perf(skills): reuse walk inventory for host loading @jif-oai
- #31576 Bound exec-server process event reordering @jif-oai
- #31756 test(skills): assert symlinked metadata loading @jif-oai
- #31581 Resolve selected capability roots without starting executors @jif-oai
- #31789 Stop persisting RMCP service traces @jif-oai
- #31792 Summarize streamed response item logs @jif-oai
- #31791 Filter routine Hyper logs from SQLite @jif-oai
- #31790 Reduce MCP tool-list trace volume @jif-oai
- #31804 Stabilize the memories feature flag @jif-oai
- #31803 fix(mcp): default Apps product SKU to codex @alecbarber-oai
- #31745 code-mode: retain shared MCP types for deferred tools @sayan-oai
- #31672 Import enabled plugins from known marketplaces @charlesgong-openai
- #31652 fix(tui): hide empty reasoning summaries @fcoury-oai
- #31767 Remove the network proxy config wrapper @jif-oai
- #31481 fix: forward originator to Codex Apps MCP @raquel-openai
- #31363 codex-api: route file uploads through HTTP client factory @bolinfest
- #31813 tui: update safety buffering copy @etraut-openai
- #31830 fix(sandboxing): initialize network proxy config inline @fcoury-oai
- #31431 build: ratchet direct reqwest dependencies @bolinfest
- #31876 code-mode: fix installation on darwin @cconger
- #31842 Update bundled OpenAI Docs skill for GPT-5.6 @kkahadze-oai
- #31637 login: route raw auth flows through HTTP client @bolinfest
- #31686 [codex-apps] Filter optional file fields by tool schema @tsarlandie-oai
- #31899 code-mode: fall back to using in process v8 if we fail to resolve external process @cconger
- #31805 Bound remote MCP stdio lines @jif-oai
- #30293 Resolve and pin MCP OAuth credential stores @stevenlee-oai
- #31892 exec-server: materialize filesystem workspace roots @pakrym-oai
- #31327 feat: add managed Bedrock login API @celia-oai
- #31295 bench: add codex help e2e macrobenchmark @anp-oai
- #31428 bench: add e2e benchmark entrypoints @anp-oai
- #31937 exec-server: expose process helper to outer sandbox @pakrym-oai
- #32093 Remove the legacy exec policy engine @copyberry
- #32106 Reduce startup latency for ancestor discovery @copyberry
- #32112 Bound streamed exec-server HTTP response bodies @copyberry
- #32122 Test the shared exec-server HTTP response byte budget @copyberry
- #32123 Bound exec-server stdio JSON-RPC messages @copyberry
- #32126 Test bounded concurrency in ancestor discovery @copyberry
- #32134 Test stdio JSON-RPC size limits with LF and CRLF @copyberry
- #32135 Propagate tracing subscribers to exec start tasks @copyberry
- #32150 Keep unified exec output collection bounded @copyberry
- #32193 Validate memory consolidation artifacts before succeeding @copyberry
- #32197 Rebind memory consolidation workspace roots @copyberry
- #32200 Add a skill invocation extension contributor @copyberry
- #32206 Always send reasoning parameters in Responses requests @copyberry
- #32213 Generate unique IDs for review rollout messages @copyberry
- #32214 Propagate workspace roots to exec-server sandboxes @copyberry
- #32229 Serialize MCP OAuth credential refreshes @copyberry
- #32231 Support pending remote environment registration @copyberry
- #32232 Let permission hooks resolve strict auto-review requests @copyberry
- #32234 Add dedicated storage for paginated thread history @copyberry
- #32246 Extract reverse JSONL scanning from session indexing @copyberry
- #32256 Improve Responses WebSocket timing telemetry @copyberry
- #32261 Preserve local path conventions in automatic approvals @copyberry
- #32263 Include start times in terminal turn events @copyberry
- #32272 Expose scheduled tasks in plugin details @copyberry
- #32274 Remove the personality migration @copyberry
- #32276 Repair unterminated rollout files before appending @copyberry
- #32277 Honor `personality = "none"` in model instructions @copyberry
- #32280 Include terminal errors in turn completion events @copyberry
- #32286 Clarify waiting behavior in safety buffering prompts @copyberry
- #32288 Make GPT-5.6 Sol the default Bedrock model @copyberry
- #32289 Persist paginated items in the local thread store @copyberry
- #32290 Respect model support for reasoning summaries @copyberry
- #32301 Trust hooks from materialized workspace plugins @copyberry
- #32302 Prefer the Codex home socket for Unix IDE context @copyberry
- #32305 Improve file blob upload diagnostics @copyberry
- #32312 Require prefixes for outbound response item IDs @copyberry
- #32316 Stop falling back to older model availability announcements @copyberry
- #32326 Use canonical links in the moved config notice @copyberry
- #32332 Add ordinals to paginated rollout records @copyberry
- #32441 Preserve parent sandbox enforcement for memory consolidation @copyberry
- #32460 Emit thread-idle lifecycle after guardian interrupts @copyberry
- #32461 Expand tabs when rendering TUI diffs @copyberry
- #32485 Use available width for skill names in the toggle view @copyberry
- #32628 Improve composer completion target resolution @copyberry
- #32698 Extract connector runtime snapshot management @copyberry
- #32744 Log missing personality messages at trace level @copyberry
- #32746 Make advanced reasoning selection explicit in the TUI @copyberry
- #32747 Align Guardian reviews with session configuration @copyberry
- #32749 Expose model overrides for multi-agent v2 spawns @copyberry
- #32751 Restrict spawned-agent models to the active backend @copyberry
- #32761 Add shadow metrics for lexical skill selection @copyberry
- #32768 Align shadow skill selection with observable sources @copyberry
- #32780 Enable skill search shadow selection by default @copyberry
- #32781 Apply MCP startup timeouts during client creation @copyberry
- #32801 Refactor OAuth store lock contention tests @copyberry
- #32822 Make explicit multi-agent mode override proactive delegation @copyberry
- #32825 Avoid blocking thread startup on MCP OAuth discovery @copyberry
- #32835 Forward turn metadata in standalone web search @copyberry
- #32837 Restore V2 agent identities on root thread resume @copyberry
- #32838 Reap exited PID-managed app-server children @copyberry
- #32844 Expand millisecond duration histogram boundaries @copyberry
- #32849 Hide Windows filesystem helper console windows @copyberry
- #32857 Require the elevated Windows sandbox for network proxies @copyberry
- #32858 Persist slash-command popup dismissal @copyberry
- #32864 Coalesce concurrent Windows sandbox setup requests @copyberry
- #32866 Allow responses after image generation @copyberry
- #32867 Include connector IDs in MCP tool call analytics @copyberry
- #32875 Use model catalog policies for Guardian auto review @copyberry
- #32881 Broaden remote compaction model fallback @copyberry
- #32884 Prepare external agent migration for source adapters @copyberry
- #32887 Tag shell tool telemetry by command category @copyberry
- #32891 Attach connector caches to diagnostic uploads @copyberry
- #32894 Serialize plugin install requests @copyberry
- #32896 Load model context from a bounded rollout suffix @copyberry
- #32897 Route blocked network requests to their owning calls @copyberry
- #32898 Expose structured standalone web search results @copyberry
- #32899 Add exec-server environment status checks @copyberry
- #32900 Derive collaboration settings from turn context @copyberry
- #32903 Include session IDs in tool item analytics events @copyberry
- #32905 Timestamp app-server notifications at emission @copyberry
- #32911 Allow injecting the models manager into `ThreadManager` @copyberry
- #32920 Expose environment status through app-server @copyberry
- #32923 Materialize paginated thread history in SQLite @copyberry
- #32928 Resume thread history projection from its SQLite checkpoint @copyberry
- #32945 Restrict Guardian reviewer tools @copyberry
- #32949 Tighten recommended plugin install suggestions @copyberry
- #32952 Scope runtime workspace roots to execution environments @copyberry
- #32985 Expose exact per-response usage in raw app-server events @copyberry
- #32989 Always confirm before enabling full access @copyberry
- #33013 Bound exec-server JSON-RPC decoding complexity @copyberry
- #33026 Include raw response completions in TypeScript envelopes @copyberry
- #33030 Remove task messages from `list_agents` output @copyberry
- #33031 Preserve JSON number precision in exec-server RPC messages @copyberry
- #33035 Use session IDs for prompt cache keys @copyberry
- #33040 Send plugin analytics with API key authentication @copyberry
- #33076 Add an agent extension runner @copyberry
- #33093 Preserve streamed output during capped history replay @copyberry
- #33105 Fix TUI status visibility around streamed output @copyberry
- #33107 Preserve special filesystem subpaths as wire strings @copyberry
- #33109 Reject forks of paginated threads @copyberry
- #33113 Allow injecting the Codex Apps tools cache @copyberry
- #33121 Refine GPT-5.6 prompting and migration guidance @copyberry
- #33147 Support model catalog permission messages @copyberry
- #33149 Build MCP tool runtimes before router planning @copyberry
- #33150 Clarify exec yield timing on Windows @copyberry
- #33152 Support paginated thread history in app-server list APIs @copyberry
- #33155 Trace startup prewarm tasks @copyberry
- #33156 Run detached reviews as review-agent turns @copyberry
- #33159 Move sleep items to the extension-owned lifecycle path @copyberry
- #33166 Defer Noise environment connections until registration @copyberry
- #33167 Document the Windows exec yield time range @copyberry
- #33170 Support Amazon Bedrock login in the app server @copyberry
- #33173 Migrate GPT-5.4 uses to GPT-5.6 variants @copyberry
- #33175 Handle Amazon Bedrock credentials during logout @copyberry
- #33177 Support model catalog templates for Guardian policy prompts @copyberry
- #33180 Serialize concurrent MCP stdin writes @copyberry
- #33182 Preserve plugin install failure subtypes during imports @copyberry
- #33184 Reuse MCP tool catalogs across sessions @copyberry
- #33185 Keep approval test targets in the temporary home @copyberry
- #33187 Honor workspace spend controls in rate-limit handling @copyberry
- #33198 Keep interrupted prompts in conversation history @copyberry
- #33200 Separate exec permission paths from core models @copyberry
- #33201 Branch conversations when editing earlier TUI prompts @copyberry
- #33203 Preserve in-flight state when restoring thread input @copyberry
- #33207 Retry safety-buffered turns on a forked thread @copyberry
- #33209 Separate session state from session I/O @copyberry
- #33211 Preserve thread context when retrying or editing turns @copyberry
- #33213 Prepare Python SDK 0.144.4 stable release @copyberry
- #33223 Instrument environment and plugin resolution paths @copyberry
- #33232 Disambiguate skill mentions from shell parameters @copyberry
- #33237 Fix skill completion around bound mentions with suffixes @copyberry
- #33239 Render TUI composer tabs as single-column spaces @copyberry
- #33243 Add auto-compaction fallback token-budget settings @copyberry
- #33251 Report selected environment connection transitions @copyberry
- #33255 Add a fallback phase before automatic context rollover @copyberry
- #33261 Add Frameless Bidi support for realtime conversations @copyberry
- #33297 Allow MCP servers to opt out of tool catalog caching @copyberry
- #33308 Expand MCP tool catalog cache regression coverage @copyberry
- #33364 Enable paginated thread history in app-server @copyberry
- #33367 Respect final-answer boundaries for queued agent mail @copyberry
- #33369 Scan skill roots concurrently @copyberry
- #33373 Render TUI prompts before submitting user turns @copyberry
- #33411 Migrate plugin commands into skills on install @copyberry
- #33412 Refactor world-state rendering tests into snapshots @copyberry
- #33414 Expose connector candidates from imported sessions @copyberry
- #33421 Fetch workspace connectors concurrently @copyberry
- #33423 Load executor plugin declarations concurrently @copyberry
- #33424 Attribute OpenAI docs MCP requests to Codex @copyberry
- #33425 Refresh host skill catalogs through world state @copyberry
- #33426 Add Cursor support to setup import @copyberry
- #33427 Propagate deferred environment capability roots to MCP @copyberry
- #33430 Avoid creating metadata paths in the Windows sandbox @copyberry
- #33432 Preserve paginated history for spawned subagents @copyberry
- #33435 Warn on conflicting capability root locations @copyberry
- #33441 Shut down Codex threads after approval scenarios @copyberry
- #33444 Add external agent memory migration @copyberry
- #33445 Select the elevated Windows sandbox for network proxies @copyberry
- #33446 Remove the unused network proxy loader @copyberry
- #33454 Track prompt cache write token usage @copyberry
- #33456 Move external agent migration into its crate @copyberry
- #33457 Use final answers in turn history summaries @copyberry
- #33459 Allow more time for image generation in code mode @copyberry
- #33464 Strengthen forced `rm` command detection @copyberry
- #33467 Remove template IDs from MCP tool call metadata @copyberry
- #33500 Add cache-write tokens to the raw response schema @copyberry
- #33509 Preserve encrypted content in MCP tool outputs @copyberry
- #33550 Unify multi-agent settings under `agents` @copyberry
- #33572 Expose spawn agent types only when roles are configured @copyberry
- #33605 Add fielded BM25 to shadow skill selection @copyberry
- #33613 Add character n-gram skill selection @copyberry
- #33614 Add multi-query lexical skill selection @copyberry
- #33631 Honor configured model defaults for spawned agents @copyberry
- #33632 Remove generated-default filesystem path variants @copyberry
- #33633 Clarify when to wait for starting environments @copyberry
- #33636 Clarify when to wait for starting environments @copyberry
- #33639 Remove the unused realtime WebRTC crate @copyberry
- #33640 Avoid duplicate cached app list update notifications @copyberry
- #33645 Run `write_stdin` concurrently across terminal sessions @copyberry
- #33651 Add an app-server API for reading app metadata @copyberry
- #33656 Validate reasoning effort after applying spawn roles @copyberry
- #33657 Restore agent roles when reloading v2 sub-agents @copyberry
- #33658 Keep active-turn environments stable across settings updates @copyberry
- #33659 Require data URLs for code-mode image output @copyberry
- #33665 Refresh step world state for all sessions @copyberry
- #33677 Forward thread originators from standalone extensions @copyberry
- #33680 Reword the apply_patch tool description @copyberry
- #33683 Preserve scope and provenance for imported agent memory @copyberry
- #33684 Extract TUI approval request payloads into structs @copyberry
- #33687 Avoid unnecessary writes during migration repair @copyberry
- #33695 Support custom transports for Amazon Bedrock @copyberry
- #33841 Make parent-owned sub-agent threads read-only in the TUI @copyberry
- #33842 Give the zsh fork decline test more execution time @copyberry
- #33843 Add an API for reading installed app runtime state @copyberry
- #33845 Confirm usage-limit resets before redemption @copyberry
- #33848 Fix the managed Bedrock logout test assertion @copyberry
- #33851 Record web search result payload sizes @copyberry
- #33852 Add batched executor capability discovery @copyberry
- #33855 Tag realtime transcript tail flush delegations @copyberry
- #33856 Stream realtime V3 Codex handoff output @copyberry
- #33858 Isolate core tests from shell and rollout persistence @copyberry
- #33861 Test workspace write isolation across exec servers @copyberry
- #33862 Suppress empty multi-agent mode messages @copyberry
- #33863 Report detailed session import error types @copyberry
- #33864 Keep feature tests focused on behavior @copyberry
- #33866 Remove the redundant tool dispatch wrapper @copyberry
- #33867 Add grace period to code-mode yield timeouts @copyberry
- #33868 Remove stale ignored core tests @copyberry
- #33870 Remove the redundant borrowed line wrapping helper @copyberry
- #33872 Remove unused TUI collaboration mode indicators @copyberry
- #33876 Track collaboration mode instructions in world state @copyberry
- #33883 Report CLI as the external agent config import source @copyberry
- #33889 Centralize thread MCP connections in `McpRuntime` @copyberry
- #33892 Limit rollout metadata reads to headers @copyberry
- #33893 Track realtime conversation state in world state @copyberry
- #33895 Add SessionEnd hooks for thread teardown @copyberry
- #33896 Expose plugin installation interstitial requirements @copyberry
- #33901 Support ChatGPT-branded Desktop app builds @copyberry
- #33902 Add bounded batch lookups for message history @copyberry
- #33903 Route realtime V3 handoffs by response channel @copyberry
- #33905 Batch persistent history reads during reverse search @copyberry
- #33906 Launch managed network proxies on remote executors @copyberry
- #33907 Add occurrence search for paginated threads @copyberry
- #33908 Allow publishing plugins through share updates @copyberry
- #33921 Preserve sub-agent liveness in the agent picker @copyberry
- #33922 Allow selecting path-backed agents in the TUI picker @copyberry
- #33923 Add audio variants to user input protocols @copyberry
- #33925 Render inline visualization links in the TUI @copyberry
- #33926 Fix quoted hook commands on Windows @copyberry
- #33929 Handle audio inputs and Bazel unit test arguments @copyberry
- #33930 Track inherited paginated rollout prefixes @copyberry
- #33932 Forward audio inputs to the Responses API @copyberry
- #33938 Centralize SQLite connection configuration @copyberry
- #33944 Track permission instructions in world state @copyberry
- #33950 Let users remember the working directory for resumed sessions @copyberry
- #33961 Refresh bundled model metadata @copyberry
- #33963 Add context to sampling retry logs @copyberry
- #33982 Gate audio history by model input modalities @copyberry
- #34038 Handle compressed rollouts in doctor thread inventory @copyberry
- #34045 Render streamed Markdown incrementally @copyberry
- #34047 Avoid resending the model for reasoning shortcuts @copyberry
- #34049 Avoid redundant TUI redraws while streaming @copyberry
- #34067 Seed realtime V3 sessions with initial text items @copyberry
- #34080 Add audio output support to dynamic tools and code mode @copyberry
- #34085 Support legacy views for paginated thread history @copyberry
- #34194 Avoid cloning thread data when rendering transcripts @copyberry
- #34197 Use the Markdown collector as the streaming source of truth @copyberry
- #34198 Start side conversations without replaying inherited turns @copyberry
- #34199 Avoid liveness races when starting side conversations @copyberry
- #34204 Avoid cloning buffered TUI history lines @copyberry
- #34206 Avoid retaining decoded MCP images in history cells @copyberry
- #34216 Speed up TUI Markdown layout @copyberry
- #34217 Keep incremental rendering with visualization context @copyberry
- #34218 Track TUI command completion separately from output @copyberry
- #34222 Avoid buffering replay-irrelevant thread notifications @copyberry
- #34223 Cache finalized Markdown history rendering @copyberry
- #34224 Avoid cloning file changes in TUI diff rendering @copyberry
- #34226 Backfill completion items only for the active exec turn @copyberry
- #34229 Persist names for paginated threads @copyberry
- #34232 Remeasure dynamic cells in the transcript overlay @copyberry
- #34234 Avoid redundant TUI subagent metadata requests @copyberry
- #34271 Migrate legacy exec policy allow rules @copyberry
- #34293 Preserve zsh tied PATH exports in shell snapshots @copyberry
- #34344 Reject unsupported history modes when loading rollouts @copyberry
- #34345 Remove unused Rust helpers @copyberry
- #34346 Track inline visualization directives during streaming @copyberry
- #34347 Avoid cloning deferred TUI lifecycle payloads @copyberry
- #34348 Cache TUI flex heights across frame passes @copyberry
- #34355 Parallelize TUI bootstrap requests @copyberry
- #34357 Render streamed command output through preview iterators @copyberry
- #34359 Keep streamed command output bounded in the TUI @copyberry
- #34361 Avoid cloning thread history for token usage replay @copyberry
- #34365 Animate Max and Ultra reasoning effort changes @copyberry
- #34366 Avoid cloning hyperlink text during TUI rendering @copyberry
- #34368 Use app-server skill metadata directly in the TUI @copyberry
- #34371 Clear stale Guardian reviews when turns end @copyberry
- #34375 Extend second-based latency histogram buckets @copyberry
- #34378 Avoid rendering generated images twice @copyberry
- #34380 Stop retrying turns with invalid tool images @copyberry
- #34381 Avoid cloning Responses WebSocket payloads @copyberry
- #34382 Keep paginated thread Git metadata in SQLite @copyberry
- #34383 Mark multi-agent v2 as stable @copyberry
- #34384 Update packaged ripgrep to 15.2.0 @copyberry
- #34385 Preserve audio across history and tool outputs @copyberry
- #34386 Enable memories for paginated threads @copyberry
- #34387 Refresh bundled model metadata @copyberry
- #34389 Route Codex Apps MCP through plugin service @copyberry
- #34390 Use copy-on-write storage for history snapshots @copyberry
- #34392 Ignore inherited ACEs when refreshing Windows write roots @copyberry
- #34393 Add configurable hook context spill limits @copyberry
- #34396 Run compact session-start hooks before turn continuation @copyberry
- #34400 Propagate approval rejection reasons @copyberry
- #34403 Update tests for history and hook API changes @copyberry
- #34407 Resolve paginated rollout lineages @copyberry
- #34408 Support threadless MCP connections without event channels @copyberry
- #34409 Limit the Linux `/proc` preflight filesystem view @copyberry
- #34411 Require absolute paths for test SQLite configuration @copyberry
- #34413 Remove CSV-backed agent jobs @copyberry
- #34416 Show completed hook warnings in TUI headers @copyberry
- #34417 Enrich app/read connector metadata @copyberry
- #34423 Support Windows sandboxing in the exec server @copyberry
- #34429 Move shared skill models into `codex-skills` @copyberry
- #34431 Optimize remote compaction history handling @copyberry
- #34434 Support catalog messages for non-request approval policies @copyberry
- #34435 Resolve outbound proxy routes explicitly @copyberry
- #34436 Honor managed permission profiles in network proxy resolution @copyberry
- #34438 Increase the patch approval test timeout @copyberry
- #34441 Add buffered code-mode exec yields @copyberry




## rust-v0.144.6 — 2026-07-18

## Bug Fixes

- Refreshed bundled instructions for GPT-5.6 Sol, Terra, and Luna, and corrected their context windows to 272,000 tokens. (#33972, #34009)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.5...rust-v0.144.6

- #33972 Backport refreshed bundled model metadata to 0.144 @sayan-oai
- #34009 Narrow 0.144 hotfix to GPT-5.6 prompts and context @sayan-oai




## rust-v0.144.5 — 2026-07-16

## Bug Fixes

- Improved dangerous-command detection, including more forced `rm` forms, and provides clearer rejection reasons when commands are denied. (#33455)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.4...rust-v0.144.5

- #33455 [release/0.144] fix(core) expand is_dangerous_command @dylan-hurd-oai




## rust-v0.144.4 — 2026-07-14

## Chores

- No user-facing changes in this patch release.

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.3...rust-v0.144.4





## rust-v0.144.3 — 2026-07-13

## Chores

- Published a version-only release with no merged pull request changes since `rust-v0.144.2`.

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.2...rust-v0.144.3





## rust-v0.144.2 — 2026-07-13

## Bug Fixes

- Restored the previous Guardian auto-review policy, request format, and tool behavior after rolling back a prompting regression. (#32672)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.1...rust-v0.144.2

- #32672 [release/0.144] Revert "Update auto review prompting" @dylan-hurd-oai




## rust-v0.144.1 — 2026-07-09

## Bug Fixes

- Fixed standalone installs failing when GitHub returns compact or reordered release metadata. (#31913)
- Ensured macOS package installs expose the code-mode host alongside the `codex` executable. (#31913)
- Kept code mode working when the companion host binary is unavailable by falling back to the embedded runtime. (#31913)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.144.0...rust-v0.144.1

- #31913 [0.144] Backport installer and code-mode reliability fixes @bolinfest




## rust-v0.144.0 — 2026-07-09

## New Features

- Usage-limit reset credits now show their type and expiration, and let you choose which credit to redeem. (#30488)
- Added a `writes` app-approval mode that allows declared read-only actions while prompting for writes. (#30482)
- MCP tools can now request authentication interactively without an experimental opt-in. (#28772)
- App-server hosts can provide Codex authentication at runtime and redirect successful logins to a hosted page. (#28745, #31274)
- Global pnunen installs are now detected so diagnostics and updates use the correct package manager. (#31503)
- Selecting Ultra reasoning now warns when high multi-agent concurrency could increase usage quickly. (#31621)

## Bug Fixes

- Resumed ChatGPT threads recover when compaction references a retired model by retrying with the currently selected model. (#30319)
- Fixed Code Mode crashes in Intel macOS release binaries. (#30953)
- Windows sandbox sessions can delete files in writable roots and access the managed primary runtime. (#31138, #31574)
- Pasted terminal control sequences can no longer corrupt TUI rendering or resumed conversation history. (#31494)
- Long-running app sessions now refresh expired authentication for the hosted `codex_apps` connector. (#31486)
- Responses WebSockets continue using the low-latency transport while respecting system proxies and custom certificate authorities. (#31441, #31622)

## Documentation

- Device-code login warnings now explain how to recognize and stop phishing attempts. (#31648)

## Chores

- Reduced plugin skill-loading time on remote executors by resolving namespaces once per root. (#31348)
- Made the `/review` branch picker faster and more reliable in large repositories. (#31464)
- Improved automatic review behavior with clearer instructions and a focused tool set. (#31480)
- Made Amazon Bedrock model names clearly identify their GPT-5.6 family and variant. (#31636)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.143.0...rust-v0.144.0

- #30292 Serialize shared MCP OAuth credential stores @stevenlee-oai
- #30488 [codex-cli] Show reset details in redemption picker @jayp-oai
- #31297 feat(core): emit canonical command execution items @owenlin0
- #31298 feat(core): emit canonical dynamic tool call items @owenlin0
- #31369 test(skills): cover plugin namespace loading @anp-oai
- #30953 fix(release): add missing Intel V8 signing entitlement @malsamiri-oai
- #31355 refactor: make ExternalAuth return CodexAuth @lt-oai
- #31352 ci: increase Windows Bazel local test jobs @anp-oai
- #30482 [codex-rs] Add writes app approval mode @zamoshchin-openai
- #31439 Handle bio policy errors in Codex @fc-oai
- #31319 [codex] add connector runtime latency metrics @mzeng-openai
- #31312 Use model catalog approval messages @dylan-hurd-oai
- #31422 test: generalize exec-server fixture @anp-oai
- #28772 [codex] Enable auth elicitation by default @mzeng-openai
- #28745 [login] support hosted success redirects @rafael-jac
- #31316 chore: extract remote compaction request attempts @celia-oai
- #31299 feat(core): emit canonical sub-agent activity items @owenlin0
- #31285 [1/5] [codex] sync managed-layer bundle schema @hefuc-oai
- #31300 feat(core): emit canonical collab tool call items @owenlin0
- #31301 feat(core): emit canonical collab wait items @owenlin0
- #30319 fix: retry rejected previous-model compaction with selected model @celia-oai
- #30879 Handle mixed-case URLs in Windows command safety @charliemarsh-oai
- #31191 Handle completion separators and popup dismissal @charliemarsh-oai
- #31425 test: add TestAppServer builder @anp-oai
- #31342 http-client: expose WebSocket proxy prerequisites @bolinfest
- #31348 perf(skills): resolve plugin namespaces per root @anp-oai
- #31289 Use canonical indexed web access field @winston-openai
- #31464 Speed up review branch picker via `for-each-ref` @charliemarsh-oai
- #31332 ci: parameterize Cargo target paths @anp-oai
- #31421 refactor: unify external auth resolution @pakrym-oai
- #31451 test: migrate TestAppServer callers to builder @anp-oai
- #31274 [codex] Add externally provided Codex auth @lt-oai
- #31501 trace hook command execution @wiltzius-openai
- #31356 ci: run V8 source builds on Windows 2025 @anp-oai
- #31283 core: support extension-owned turn items @owenlin0
- #31570 fs: support pruning hidden directories during walks @jif-oai
- #31465 Align empty branch list message with search @charliemarsh-oai
- #31586 Stabilize encrypted MAv2 spawn request test @jif-oai
- #31585 Stabilize remote compaction parity against dynamic skill catalogs @jif-oai
- #31518 Log plugin install failure subtypes @charlesgong-openai
- #31587 Stabilize shared rollout budget test @jif-oai
- #31503 Detect Codex installs managed by pnpm @charliemarsh-oai
- #31525 core: migrate standalone web search to extension-owned turn items @owenlin0
- #31473 feat(core): emit canonical review mode items @owenlin0
- #31452 test: remove TestAppServer constructors @anp-oai
- #31612 Round MCP timeout durations in error messages @jif-oai
- #31138 fix(windows-sandbox): allow deletion in writable roots @fcoury-oai
- #31500 code-mode: move to hosted mode by default  @cconger
- #31494 tui: sanitize terminal controls in user messages @etraut-openai
- #31524 chore(protocol): use UUIDv7 for generated item IDs @owenlin0
- #31496 Fall back to HTTP when Apple Git is unavailable @fc-oai
- #31578 Bound exec-server pending RPCs @jif-oai
- #29875 [codex] Sanitize imported session fallback titles @stefanstokic-oai
- #31621 tui: warn on Ultra with high multi-agent concurrency @shijie-oai
- #31622 websocket-client: add proxy-aware connector @bolinfest
- #31574 [codex] Grant Windows sandbox access to primary runtime @abhinav-oai
- #31292 Reuse MCP tool snapshot within a sampling request @sayan-oai
- #31630 feat(core): emit canonical hook prompt items @owenlin0
- #31636 feat: change amazon Bedrock GPT-5.6 display names @celia-oai
- #31629 core: stop emitting legacy command events directly @owenlin0
- #31441 core: preserve Responses WebSockets with system proxy @bolinfest
- #31357 ci: route build IO through Dev Drives @anp-oai
- #31461 chore: remove inert cargo audit workflow @anp-oai
- #31614 test: migrate app-server v2 starts to auto env @anp-oai
- #31497 [codex] increase tool schema compaction threshold @fbauer33
- #31650 code-mode: make all approvals trigger elicitation pause @cconger
- #31648 Clarify device-code phishing warning @etraut-openai
- #31663 test(app-server): use native rollout fixture paths @fcoury-oai
- #31330 [codex-apps] Omit internal fields from file payloads @jacobzhou-oai
- #31480 Update auto review prompting @olliem-oai
- #21818 Update models.json @github-actions
- #31427 test: add delayed exec-server transport @anp-oai
- #30278 [codex] Preserve reviewer when resuming threads @viyatb-oai
- #31675 Expand agent core ownership @pakrym-oai
- #31486 [connectors] Refresh codex_apps /ps/mcp auth @stevenlee-oai
- #31361 model-provider: route model discovery through HTTP client factory @bolinfest
- #30188 feat(rollout): persist TurnItems for paginated thread rollouts @owenlin0
- #31596 Use the image generation extension by default @won-openai
- #31684 Update models.json @github-actions




## rust-v0.143.0 — 2026-07-08

## New Features

- Remote plugins are now enabled by default, with richer catalog rows, npm marketplace sources, and visible remote/local versions. (#30297, #26705, #29375, #30981)
- Codex can route authentication and Responses API traffic through macOS and Windows system proxies, including PAC and WPAD configurations. (#26708, #26709, #31335)
- Added `codex remote-control pair` for generating manual pairing codes from a running daemon. (#29913)
- Added Amazon Bedrock GPT-5.6 Sol, Terra, and Luna models, with first-class support for `max` reasoning effort. (#30285, #30467)
- MCP tools now use tool search by default, and ChatGPT-hosted MCP servers can explicitly use session authentication. (#29486, #29733)
- App-server clients can inspect environments, list descendant threads, and fork history through a specific turn. (#30291, #29591, #30277)

## Bug Fixes

- Fixed Windows ConPTY input handling for line endings and backspace, plus sandbox credential retry edge cases. (#29734, #29624, #29637)
- Fixed stale TUI safety prompts and cancelled reviews that could leave MCP startup appearing busy. (#30490, #31189)
- Improved recovery when exec servers are temporarily offline and prevented remote-control token refresh retry storms. (#30098, #30201)
- Preserved trailing realtime transcript text and terminal rollout events during shutdown. (#29918, #30144)
- Improved incremental WebSocket request success by ignoring response metadata during comparisons. (#30770)
- Reduced installer failures from GitHub API rate limits by reusing release metadata. (#31056)

## Documentation

- Documented UUID7 thread and turn IDs, plus recommended remote-executor integration-test workflows. (#27714, #29790)

## Chores

- Updated OpenSSL, Hono, fast-uri, quick-xml, and crossbeam-epoch to address security advisories. (#29487, #29650, #30941, #31308)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.0...rust-v0.143.0

- #26708 PAC 3 - Add Windows system proxy resolver @canvrno-oai
- #28769 Register full CDP requirements feature @syuan-oai
- #29485 [codex] fetch featured IDs for remote plugins @ericning-o
- #29487 Upgrade bundled OpenSSL to 3.6.3 @jif-oai
- #29489 [codex] Update esbuild to 0.28.1 @pakrym-oai
- #29488 [plugins] Add dark-mode logo metadata @drewschuster-openai
- #29249 [codex] migrate environment context to model world state @pakrym-oai
- #29494 core: wrap token budget window context @bolinfest
- #29417 [codex] replace remote images with model-visible error text @rka-oai
- #28360 feat(core): store turn_id on ResponseItem metadata @owenlin0
- #29486 [codex] Use tool search for MCP tools by default @sayan-oai
- #29501 path-uri: clarify host-native path conversion @anp-oai
- #29504 fix: world state response item test @celia-oai
- #26704 TUI Plugin Sharing 4 - cover remote plugin catalog flows @canvrno-oai
- #29419 [codex] reject remote images at app-server ingress @rka-oai
- #28992 chore: improve expired Bedrock credential errors @celia-oai
- #29467 Make formatter output quiet on success @anp-oai
- #26709 PAC 4 - Add macOS system proxy resolver @canvrno-oai
- #29490 chore: warn when Code Mode lacks model metadata @celia-oai
- #29493 mcp: accept foreign absolute cwd for remote stdio @anp-oai
- #29473 Propagate safety buffering treatment metadata @fc-oai
- #24092 [codex] Reject unlowered PowerShell AST regions @bookholt-oai
- #29155 [codex] Expose service tier and reasoning effort in OTEL @daniel-oai
- #29068 [codex] stylistic changes @rka-oai
- #29518 Remove redundant Codex Apps manager flag @aibrahim-oai
- #27946 [codex] Use input items for Responses Lite tools @rka-oai
- #29528 Centralize Codex Apps client handling @aibrahim-oai
- #29577 Handle additional tools in image URL validation @aibrahim-oai
- #29575 Remove redundant Codex Apps cache guard @aibrahim-oai
- #29583 Group Codex Apps client setup @aibrahim-oai
- #29358 Allow codex sandbox to consume MCP sandbox state @jif-oai
- #29599 Stop persisting bridged log events @jif-oai
- #29615 Fix Codex Apps auth elicitation hang @jif-oai
- #29067 Namespace multi-agent v2 tools under collaboration @jif-oai
- #29614 path-uri: add lexical containment @jif-oai
- #28426 Share resumed rollout history @charliemarsh-oai
- #29634 Update rmcp to 1.8.0 @jif-oai
- #29650 Update vulnerable Hono and fast-uri dependencies @jif-oai
- #29498 [codex] Instrument rollout persistence bytes @wiltzius-openai
- #29659 [core] debounce current-time reminders by elapsed time @rka-oai
- #29608 Shut down superseded MCP managers on refresh @jif-oai
- #29527 core: use turn-owned world state for inline compaction @sayan-oai
- #29672 [codex] Handle additional tools in rollout persistence metrics @rka-oai
- #29669 Handle additional tools in rollout persistence metrics @winston-openai
- #29680 Revert "Handle additional tools in rollout persistence metrics" @rasmusrygaard
- #27714 app-server: document thread and turn IDs are UUID7 @owenlin0
- #29456 Prepare managed network sandbox context @jif-oai
- #28418 chore(core) rm AskForApproval::OnFailure @dylan-hurd-oai
- #29675 core: add extra metadata field to Thread struct @kumquatexpress
- #29013 Keep managed MITM CA private keys in proxy memory @winston-openai
- #29495 Separate local and remote plugin analytics IDs @jameswt-oai
- #29671 [codex] Preserve proxy state for filesystem sandbox helpers @iceweasel-oai
- #29513 [codex] allow image generation with provider auth @richardopenai
- #29526 core: resolve view_image paths in selected environment @anp-oai
- #29696 [codex] Fix stale approval policy in MCP test @sayan-oai
- #29704 [codex] Fix stale approval policy in MCP test @kumquatexpress
- #29547 core: use current step environments for tools @sayan-oai
- #28976 Add MCP tool call error metrics @stevenlee-oai
- #27045 feat(guardian): include connected account email in app reviews @viyatb-oai
- #29620 Decouple plugin manifest path resolution @jif-oai
- #29666 [codex] Report the exec-server working directory @rasmusrygaard
- #29705 feat(app-server): thread/turns/items/list -> thread/items/list @owenlin0
- #29716 code-mode: Rename codex_code_mode::CodeModeService @cconger
- #29712 test: branch on target OS instead of runner flavor @anp-oai
- #29728 core tests: rename automatic environment builder @anp-oai
- #29158 path-uri: remove legacy path deserialization @anp-oai
- #29519 core: persist initial context window metadata @bolinfest
- #28918 Make selected plugin roots URI-native @jif-oai
- #29515 [codex] define code mode host handshake protocol @cconger
- #29715 [codex] surface rollout budget exhaustion @rka-oai
- #29732 code-mode: Remove Session::is_alive() @cconger
- #29626 Load executor skills without host path conversion @jif-oai
- #29714 protocol: separate app and exec RPC ownership @anp-oai
- #29664 refactor: extract context window token status @bolinfest
- #29665 fix: scope context remaining to body window @bolinfest
- #29744 [codex] rename rollout budget error to session budget error @rka-oai
- #29739 Update new_context_window instructions @andmis
- #29743 core: reset context for token budget compaction @bolinfest
- #29477 Support thread-level originator overrides @alexsong-oai
- #29745 core: add wait_for_environment for starting environments @sayan-oai
- #28630 [codex] trace MCP startup latency @rphilizaire-openai
- #29750 chore: assign `amsg_` IDs to agent messages @bolinfest
- #29746 test: add app-server auto environment helper @anp-oai
- #29711 Let image generation extension hosts control output persistence @won-openai
- #29762 [codex] Reuse compacted history replacement for new context windows @pakrym-oai
- #29768 [codex] Update bundled skill installer guidance @sayan-oai
- #29690 [plugins] Add marketplace source requirements @xl-openai
- #29765 [codex] Ignore local curated plugins when remote catalog is active @xl-openai
- #29767 [codex] Assign response item IDs in forked history @pakrym-oai
- #29721 auth: move domain mode below app wire types @anp-oai
- #29753 [plugins] Enforce marketplace source admission requirements @xl-openai
- #29722 config: own layer provenance types @anp-oai
- #29723 connectors: own app metadata types @anp-oai
- #29788 test: run app-server integration tests under Wine @anp-oai
- #29789 test: use automatic environments in app-server integration tests @anp-oai
- #29790 docs: document remote executor integration testing @anp-oai
- #29815 [codex] Remove auto-compaction opt-out @rhan-oai
- #29628 Keep executor plugin MCP paths URI-native @jif-oai
- #29731 [codex] Emit implicit skill usage for support reads @alexsong-oai
- #29829 Persist agent messages as response items @jif-oai
- #29841 Add a bounded filesystem walk RPC @jif-oai
- #29842 Use fs/walk for environment skill discovery @jif-oai
- #29567 [codex] show external import result counts @charlesgong-openai
- #29831 Cache plugin namespace during executor skill discovery @jif-oai
- #29720 ci: fail jobs that dirty the worktree @anp-oai
- #29887 Fix environment skill discovery after merge @jif-oai
- #29734 [codex] fix Windows ConPTY input handling @iceweasel-oai
- #28593 [codex] suppress low usage remaining warnings when credits are available @brooks-oai
- #29624 Preserve Windows sandbox identity during credential retry @jif-oai
- #27466 [codex] Trace exec-server JSON-RPC requests @richardopenai
- #29844 Follow directory symlinks in filesystem walks @jif-oai
- #29637 Skip credential refresh for WindowsApps launch failures @jif-oai
- #29591 feat(app-server): list descendant threads by ancestor @btraut-openai
- #28034 feat(network-proxy): experimental local credential broker @winston-openai
- #29736 [codex] Inject agent graph store into ThreadManager @wiltzius-openai
- #29889 [apps] Thread structured icon assets through app list @drewschuster-openai
- #29724 mcp: keep elicitation requests below app wire types @anp-oai
- #29684 [plugins] Track plugin install requests by ID @adaley-openai
- #29870 Pipeline bounded AGENTS.md and Git root probes @jif-oai
- #29893 [codex] dedupe remote control account header @shuo-openai
- #29851 Add a connector declaration snapshot @jif-oai
- #29903 path-uri: normalize parent segments in absolute joins @anp-oai
- #29852 Read connector declarations from executor plugins @jif-oai
- #29785 Isolate curated plugin sync Git environment @etraut-openai
- #29907 [codex] namespace sleep under clock @rka-oai
- #29910 [codex] nest sleep config under current time reminder @rka-oai
- #29913 feat(remote-control): add daemon pairing command @apanasenko-oai
- #29936 core: add configurable <context_window_guidance> message @bolinfest
- #26705 TUI Plugin Sharing 5 - polish remote plugin catalog rows @canvrno-oai
- #29733 Allow ChatGPT-hosted MCP servers to use session auth @aibrahim-oai
- #29833 [1/3] core: make world state snapshots serializable @sayan-oai
- #29919 TUI support for buffer experience @etraut-openai
- #29924 Represent MCP authentication with an enum @aibrahim-oai
- #29804 code-mode: define process host wire protocol @cconger
- #29956 [codex] Populate remote plugin local versions @abhinav-oai
- #29835 [2/3] core: persist world state in rollouts @sayan-oai
- #29899 [codex] Update reasoning effort @shijie-oai
- #29837 [3/3] core: replay persisted world state @sayan-oai
- #29969 Report MCP error codes with server attribution @aibrahim-oai
- #29970 core: raise token budget message limits @bolinfest
- #29973 [codex] route sleep through time providers @rka-oai
- #19051 feat: use run agent task auth for inference @adrian-openai
- #29810 core: make AGENTS.md react to environment changes @sayan-oai
- #29997 core: reconcile legacy WorldState sections @sayan-oai
- #29990 Parallelize environment skill loading @anp-oai
- #28522 Support HTTP MCP servers from selected executor plugins @jif-oai
- #28529 Support OAuth for HTTP MCP servers from selected executor plugins @jif-oai
- #29656 Test executor-routed MCP OAuth token exchange @jif-oai
- #29928 chore(app-server): mark thread/rollback as deprecated @owenlin0
- #29856 Persist selected capability roots and resolve availability per model step @jif-oai
- #27467 [codex] Record exec-server lifecycle metrics @richardopenai
- #29942 feat: add provider-aware model fallback to thread start @celia-oai
- #30095 cli: rename sandbox permission profile flag @bolinfest
- #30029 [codex] current time reminder interval to be set to 0 @rka-oai
- #29941 core: expose permission profile to shell tools @bolinfest
- #30031 [codex] add current time reminder delivery mode config @rka-oai
- #30098 [codex] Retry temporarily offline exec-server recovery @richardopenai
- #30033 [codex] impl delivery_mode: current time reminders on response boundaries @rka-oai
- #30108 [codex] extend code-mode host IPC transport @cconger
- #27470 [codex] Observe remote exec-server lifecycle @richardopenai
- #30113 [codex] poll external clock during sleep @rka-oai
- #29003 feat(core, mcp): cache codex_apps tools in memory @owenlin0
- #30114 release: publish standalone zsh artifacts @bolinfest
- #30116 release: consume standalone zsh artifacts @bolinfest
- #29648 [codex] Add managed MCP server matchers @felixxia-oai
- #30100 Let extensions contribute World State sections @jif-oai
- #30124 fix(app-server): suppress TUI rollback warning @fcoury-oai
- #29877 [codex] Surface MCP reauthentication-required startup failures @felixxia-oai
- #29988 Recognize Work web and mobile thread originators @chiam-oai
- #30110 [codex] add code-mode host failure supervision hooks @cconger
- #30088 Project executor skills through World State @jif-oai
- #30117 [codex] Propagate traces through exec-server HTTP @wiltzius-openai
- #30101 Pin MCP runtimes to model steps @jif-oai
- #30134 ci: narrow Windows test skips @anp-oai
- #30093 Project selected plugin runtime by environment availability @jif-oai
- #30145 Reuse walk inventory for environment skill metadata @jif-oai
- #30111 [codex] implement standalone code-mode process host @cconger
- #29935 [codex] Attribute app-server analytics by thread originator @alexsong-oai
- #30152 Reinject missing World State fragments on resume @jif-oai
- #30127 Keep MCP elicitation routable across runtime refreshes @jif-oai
- #29934 Expose MCP app identity in app context @martinauyeung-oai
- #29909 [codex] allow CCA image generation and web search extensions @won-openai
- #30157 Test selected capabilities across availability and resume @jif-oai
- #30144 [codex] fix terminal rollout event durability @wiltzius-openai
- #29920 Retry failed Codex Apps MCP startup @kbazzi
- #29516 Persist Cloudflare affinity cookies for MCP HTTP @stevenlee-oai
- #30112 [codex] add process-owned code-mode session client @cconger
- #30142 [codex] wire process-owned code mode host into core @cconger
- #30198 [codex] fix CreateThreadParams test initializer @anp-oai
- #30148 Reuse MCP runtimes when selected availability changes nothing @jif-oai
- #30215 Test selected capabilities across unavailable resume @jif-oai
- #29991 [codex] narrow unused skills intro export @aibrahim-oai
- #30229 Relax hooks.json top-level metadata validation @charlesgong-openai
- #29927 feat(app-server): add history_mode to thread @owenlin0
- #30276 fix main @owenlin0
- #29683 [codex] Add managed new-thread model settings @hefuc-oai
- #30225 Overlap executor skill reads with namespace discovery @jif-oai
- #30274 [codex] allow AGENTS.md and skills to authorize delegation @charlesdu-openai
- #30147 [codex] Use managed defaults for TUI threads @hefuc-oai
- #30261 ensure thread.history_mode is immutable @owenlin0
- #30277 feat(app-server): add optional turn_id to thread/fork @owenlin0
- #30143 Let Codex consult user-level code-review-* skills. @anp-oai
- #30285 feat: add GPT-5.6 variants to Bedrock catalog @celia-oai
- #30173 Close thread persistence when submission channel closes @alfozan
- #30257 [codex] Classify nested MCP authentication startup errors @felixxia-oai
- #29375 [codex] Support npm marketplace plugin sources @charlesgong-openai
- #30146 [codex] group blocking and postmerge CI workflows @anp-oai
- #30282 feat(protocol): define missing rollout turn items @owenlin0
- #30201 fix(remote-control): avoid server token refresh retry storms @apanasenko-oai
- #30273 [codex] consume pushed exec-server process events @richardopenai
- #30286 core: overlap diff root discovery with world state @anp-oai
- #30314 app-server: structure and test JSON shutdown logs @bolinfest
- #30317 Update security check wording @etraut-openai
- #30302 Preserve namespaces on custom tool calls @nhamidi-oai
- #30327 core: stabilize synthesized call output IDs @bolinfest
- #30291 [app-server] expose environment info RPC @maxj-oai
- #29691 [plugins] Enforce marketplace source policy at runtime @xl-openai
- #30384 [app-server] increase currentTime/read timeout @rka-oai
- #30297 [codex] Enable remote plugins by default @xl-openai
- #30490 fix(tui): clear completed safety buffering prompt @fcoury-oai
- #29740 [codex] Use model metadata for skills usage instructions @ani-oai
- #30511 [codex] Restore v1 delegation guidance @aibrahim-oai
- #30508 Revert "Make auto-review on-request prompt more proactive" @dylan-hurd-oai
- #30467 [codex] Treat max as a first-class reasoning effort @shijie-oai
- #30491 Update safety check links @etraut-openai
- #30607 [codex] auto-label AWS Bedrock issues @etraut-openai
- #30269 [codex] disable Nagle on Rendezvous WebSockets @richardopenai
- #30645 [codex] Update safety notice wording @etraut-openai
- #30757 fix(core) Remove full text websocket trace @dylan-hurd-oai
- #30851 docs: add tag to fenced code block @bolinfest
- #30643 [codex] bound Rendezvous WebSocket liveness @richardopenai
- #30867 Consolidate multi-agent v2 communication sends @bolinfest
- #30872 Log multi-agent communication lifecycle @bolinfest
- #30883 [codex] emit per-request TTFT completion telemetry @xli-oai
- #30897 Fix inherited availability metadata for Bedrock models @shijie-oai
- #30941 fix: address quick-xml security advisories @bolinfest
- #30770 fix(websockets) ignore metadata for incremental requests @dylan-hurd-oai
- #30334 telemetry: log structured direct tool-call timing @bolinfest
- #30493 [codex] Add configurable multi-agent mode hint text @shijie-oai
- #30796 Fix MIME types for path-backed feedback attachments @btraut-openai
- #31056 fix(install): reuse GitHub release metadata @bolinfest
- #30981 [codex] expose remote plugin versions @ericning-o
- #31066 chore: remove unused git-cliff configuration @bolinfest
- #31064 [codex] Read buffering metadata from response events @fc-oai
- #30223 Make plugin guidance react to environment readiness @sayan-oai
- #31189 Fix cancelled review leaving MCP startup busy @charliemarsh-oai
- #30876 [core] Support interleaved response items @alexi-openai
- #31262 [codex] Read retry model from buffering events @fc-oai
- #31261 Revert "[core] Support interleaved response items" @alexi-openai
- #31253 Emit exec-policy warnings for freshly loaded thread config @etraut-openai
- #31179 Remove TUI exec-policy core exports @etraut-openai
- #29959 Conditional codex_home dotenv @canvrno-oai
- #30627 elicitations: Move to shared ElicitationService @cconger
- #30318 core: trace executor skill discovery @anp-oai
- #31276 Revert "Conditional codex_home dotenv" @canvrno-oai
- #30956 refactor(protocol): isolate legacy item fanout @owenlin0
- #30395 [app-server] Include reset-credit details in rate limits @jayp-oai
- #31267 chore(approvals) consolidate guardian calls for shell tools @dylan-hurd-oai
- #31252 [tui] Truncate hook context in conversation history @abhinav-oai
- #29918 [codex] Flush trailing realtime transcript tail @guinness-oai
- #30226 Make Apps guidance react to MCP availability @sayan-oai
- #31190 Use popup token ranges for autocomplete insertion @charliemarsh-oai
- #29697 fix: attribut network requests to the exact exec on linux @jif-oai
- #31303 feat(code-mode): allow disabling V8 JIT @cconger
- #31271 chore: use .worktreeinclude for user Bazel config @anp-oai
- #31308 fix: update crossbeam-epoch for RUSTSEC-2026-0204 @cconger
- #30202 [codex] bundle code mode host in release packages @cconger
- #31293 [codex] app-server: expose plugin install policy source @ericning-o
- #31318 ci: share common workflow setup @anp-oai
- #29992 app-server: cover selected environments in integration tests @anp-oai
- #31284 Warn when configured service tiers are unsupported @etraut-openai
- #31323 Extract shared HTTP transport into codex-http-client @bolinfest
- #31331 Migrate direct HTTP consumers to codex-http-client @bolinfest
- #31337 fix: restore Codex environment setup table @anp-oai
- #31188 Preserve managed exec policy after rules parse errors @etraut-openai
- #31306 [codex] Support sequential cutoff reasoning summaries @ashwinnathan-openai
- #31344 exec-server: use virtual time in Noise relay test @bolinfest
- #31296 refactor(protocol): map canonical tool items to legacy events @owenlin0
- #31335 core: route Responses API through system proxy @bolinfest




## rust-v0.142.5 — 2026-07-01

## Bug Fixes

- Prevented full Responses WebSocket request payloads from being written to trace logs. (#30771)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.4...rust-v0.142.5

- #30771 [codex] Backport websocket trace fix to release/0.142 @dylan-hurd-oai




## rust-v0.142.4 — 2026-06-29

## Chores

- No user-facing changes were identified for this release.

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.3...rust-v0.142.4





## rust-v0.142.3 — 2026-06-26

## Chores

- Maintenance-only patch release with no user-facing changes since 0.142.2.

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.2...rust-v0.142.3





## rust-v0.142.2 — 2026-06-25

## New Features

- MCP tools now use tool search by default when supported, improving tool discovery while preserving compatibility with older models and providers. (#29486)
- macOS authentication clients can honor system proxy, PAC, and WPAD settings when `respect_system_proxy` is enabled. (#26709)
- Plugins can provide dedicated dark-mode logos through local manifests and remote catalogs. (#29488)
- Apps can display richer safety-buffering UI using server-provided visibility and faster-model metadata. (#29473)

## Bug Fixes

- Remote plugin catalogs now return curated featured-plugin rankings. (#29485)
- Expired Amazon Bedrock credentials now produce actionable recovery guidance instead of a generic authorization error. (#28992)
- Remote stdio MCP servers now accept absolute working directories written in the remote platform’s path format. (#29493)
- Remote HTTP(S) image inputs now return clear model-visible validation errors; inline data URLs and local images remain supported. (#29417, #29419)
- PowerShell commands containing executable AST regions the safety classifier cannot inspect now require approval. (#24092)
- Code Mode now warns when the selected model lacks the required metadata. (#29490)

## Chores

- Updated bundled OpenSSL and esbuild dependencies to patched releases. (#29487, #29489)
- Successful formatter runs are now quiet while failures still show diagnostics. (#29467)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.1...rust-v0.142.2

- #28769 Register full CDP requirements feature @syuan-oai
- #29485 [codex] fetch featured IDs for remote plugins @ericning-o
- #29487 Upgrade bundled OpenSSL to 3.6.3 @jif-oai
- #29489 [codex] Update esbuild to 0.28.1 @pakrym-oai
- #29488 [plugins] Add dark-mode logo metadata @drewschuster-openai
- #29249 [codex] migrate environment context to model world state @pakrym-oai
- #29494 core: wrap token budget window context @bolinfest
- #29417 [codex] replace remote images with model-visible error text @rka-oai
- #28360 feat(core): store turn_id on ResponseItem metadata @owenlin0
- #29486 [codex] Use tool search for MCP tools by default @sayan-oai
- #29501 path-uri: clarify host-native path conversion @anp-oai
- #29504 fix: world state response item test @celia-oai
- #26704 TUI Plugin Sharing 4 - cover remote plugin catalog flows @canvrno-oai
- #29419 [codex] reject remote images at app-server ingress @rka-oai
- #28992 chore: improve expired Bedrock credential errors @celia-oai
- #29467 Make formatter output quiet on success @anp-oai
- #26709 PAC 4 - Add macOS system proxy resolver @canvrno-oai
- #29490 chore: warn when Code Mode lacks model metadata @celia-oai
- #29493 mcp: accept foreign absolute cwd for remote stdio @anp-oai
- #29473 Propagate safety buffering treatment metadata @fc-oai
- #24092 [codex] Reject unlowered PowerShell AST regions @bookholt-oai




## rust-v0.142.1 — 2026-06-25

## New Features

- Added opt-in Windows system proxy support for authentication, including PAC, WPAD, static proxies, and bypass rules. (#26708)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.142.0...rust-v0.142.1

- #26708 PAC 3 - Add Windows system proxy resolver @canvrno-oai




## rust-v0.142.0 — 2026-06-22

## New Features

- `/usage` can now show and redeem earned usage-limit reset credits, with confirmation, retry, and refreshed availability states. (#28154, #28793)
- `/plugins` now organizes remote plugins into OpenAI Curated, Workspace, and Shared with me sections, while eligible turns can recommend and install relevant plugins. (#26703, #28399, #28400, #27704, #28403)
- Configurable rollout token budgets track usage across agent threads, provide remaining-budget reminders, and abort turns when exhausted. (#28746, #28494, #28707, #29423)
- App-server clients can configure multi-agent delegation as disabled, explicit-request-only, or proactive at the thread and turn level. (#28685, #28792, #29324)
- Added an indexed web-search mode that permits live searches while restricting direct page access to server-approved URLs. (#28489)
- Codex can now receive scheduled UTC time reminders and query the current time directly, including through client-provided app-server clocks. (#28822, #28824, #28835, #29011)

## Bug Fixes

- Restored reliable Linux TUI rendering after suspending with `Ctrl+Z` and resuming with `fg`. (#28342)
- Exec-server processes and stdio MCP sessions now survive transient disconnects, including signed-URL refresh and retry-safe stdin writes. (#28512, #28374, #28546, #28895)
- Remote environments now preserve executor-native paths, shells, `AGENTS.md` discovery, and sandbox behavior across operating systems. (#28146, #28152, #28958, #28983, #29099, #29108, #29113, #29424)
- Plugin loading and installation now handle root marketplace layouts, manifest fallbacks, multiple skill paths, actionable download errors, and immediate tool refreshes. (#28771, #28789, #28790, #28863, #28951)
- Parent agents now receive terminal subagent errors instead of seeing failed work as an empty successful completion. (#28375)
- Goal-first threads are once again persisted and returned by `thread/list` and `thread/search`. (#28808)

## Chores

- Reduced startup and session latency by deferring unnecessary DNS work, warming the model cache, reusing parsed plugin skills, parallelizing skill metadata reads, and skipping redundant catalog synchronization. (#28542, #28699, #28844, #29326, #29005)
- Reduced persistent-log churn by removing per-event WebSocket payload logging and filtering duplicated telemetry records. (#29432, #29457)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.141.0...rust-v0.142.0

- #28396 [codex] Record external agent import results @charlesgong-openai
- #27751 [codex] expose Bedrock credential source in account/read @celia-oai
- #28338 [codex] Compress cold active rollouts @jif-oai
- #28368 feat: render typed envelopes for multi-agent v2 messages @jif-oai
- #28508 [tests] Keep Apps out of generic core test harness @jif-oai
- #28472 [codex] Clarify plugin load and runtime capability stages @xl-openai
- #28375 core: surface terminal subagent errors to parent agents @jif-oai
- #28542 perf(config): defer remote sandbox hostname lookup @fcoury-oai
- #28473 path-uri: clarify invalid host path errors @anp-oai
- #28342 fix(tui): restore TUI after suspend @fcoury-oai
- #28354 [codex] exec-server: stream files in chunks @pakrym-oai
- #28553 chore: side prompt @jif-oai
- #27099 [codex-app-server-test-client & codex-app-server] Plugin Usage Analytics Smoke Test @jameswt-oai
- #28554 fix(tui): highlight C++ module files @fcoury-oai
- #28467 [codex] Warn clearly when code mode output is truncated @aibrahim-oai
- #27750 [codex] Add incremental thread history changes @wiltzius-openai
- #28154 feat(tui): add rate-limit reset redemption to /usage @jayp-oai
- #28562 ci: run code-mode unit tests on all bazel targets @cconger
- #27923 [codex] Route MCP file uploads through environment filesystem @pakrym-oai
- #27100 [codex-app-server-test-client] Plugin Install/Uninstall Analytics Smoke Test @jameswt-oai
- #28581 [codex] re-enable absolute workdir integration test @anp-oai
- #28468 code-mode: extend test coverage to lock in cell lifecycle @cconger
- #28587 [codex] test exec relative additional permissions @anp-oai
- #28577 Clarify model-generated and legacy app path types @anp-oai
- #28589 Record invariants for path migration. @anp-oai
- #28146 app-server: preserve target-native environment cwd @anp-oai
- #28595 Tell codex about PathUri serde compat. @anp-oai
- #28399 [codex] [1/4] Add recommended plugin endpoint cache @adaley-openai
- #28400 [codex] [2/4] Generalize plugin suggestion presentation @adaley-openai
- #27704 [codex] [3/4] Activate endpoint plugin recommendations @adaley-openai
- #28152 core: render remote environment cwd natively @anp-oai
- #28403 [codex] [4/4] Simplify recommended plugin install schema @adaley-openai
- #26706 PAC 1 - Add system proxy feature config surface @canvrno-oai
- #27910 Add thread recencyAt for sidebar ordering @nornagon-openai
- #28627 Revert "Tell codex about PathUri serde compat. (#28595)" @anp-oai
- #28625 [codex] Gate remote plugin catalog by auth @xl-openai
- #28629 [codex] core: restore absolute turn context cwd @anp-oai
- #28642 thread-store: fix response fixture compilation @pakrym-oai
- #28580 [codex] Support object-valued plugin MCP manifests @charlesgong-openai
- #28599 code-mode: move cell state into library actor @cconger
- #28471 [codex] Test code-mode variable truncation @aibrahim-oai
- #28655 Revert thread recencyAt for sidebar ordering @pakrym-oai
- #28638 core: remove redundant TurnContext and Prompt fields @pakrym-oai
- #28656 [codex] Persist built-in image results reported as generating @won-openai
- #28512 Resume exec-server sessions after disconnect @jif-oai
- #28546 Back off registry retries during exec recovery @jif-oai
- #28561 Add join key for MAv2 inter-agent messages @jif-oai
- #28699 app-server: keep the model cache warm @jif-oai
- #28705 Replace SkillsManager with SkillsService @jif-oai
- #27965 [ez][codex-rs] Support apps._default.default_tools_approval_mode @zamoshchin-openai
- #28359 Run fs helper through Windows sandbox wrapper @iceweasel-oai
- #28628 [codex] Repair invalid skill frontmatter scalars @charlesgong-openai
- #28632 Tell codex to avoid changing rollout format. @anp-oai
- #28738 Scope command approvals by execution environment @jif-oai
- #19047 feat: add run task identity primitives @adrian-openai
- #28671 [codex] Restore thread recency with compatible migration history @nornagon-openai
- #28768 Extract TUI plugin catalog rendering @canvrno-oai
- #28389 [codex] Use compact OpenAI docs search queries @kkahadze-oai
- #28681 unified-exec: preserve PathUri through exec-server @anp-oai
- #28731 [codex] Track plugin install and import telemetry failures @charlesgong-openai
- #28651 exec-server: expose environment registry payloads @viyatb-oai
- #28771 fix(plugins): support root local marketplace plugins @caseychow-oai
- #28791 bazel: refresh expired macOS SDK pin @anp-oai
- #28782 [codex] trace tools build latency @owenlin0
- #28778 path-uri: decouple native path parsing @anp-oai
- #28774 feat(exec-server): add Noise rendezvous environment @apanasenko-oai
- #28812 [codex] Add optional IDs to response items @pakrym-oai
- #28784 fix(install): support older awk checksum parsing @fcoury-oai
- #28826 [codex] Use unique IDs for realtime-routed turns @guinness-oai
- #27986 [codex] control automatic realtime handoff delivery @jiayuhuang-openai
- #28836 [codex] Support assistant realtime append text @guinness-oai
- #28374 Refresh signed exec-server URLs on reconnect @apanasenko-oai
- #28825 Expose selecte namespaces as direct model tools @won-openai
- #28790 [codex] Support plugin manifest path lists @charlesgong-openai
- #28851 Record more path migration guidance for codex. @anp-oai
- #28780 unified-exec: retain PathUri in command events @anp-oai
- #28605 [codex] Split plugin and skill warmup tracing @mzeng-openai
- #28608 [codex] Pass plugin namespace into skill loading @mzeng-openai
- #28746 [codex] add rollout token budget configuration (1/N) @rka-oai
- #28766 Add network environment ID plumbing @jif-oai
- #28915 Avoid sandbox helper in apply_patch approval tests @jif-oai
- #28813 Pause active goals before TUI interrupts @etraut-openai
- #28895 Recover exec process stdin writes @jif-oai
- #28940 Pin Windows argument lint to Windows 2022 @rka-oai
- #28914 Scope MCP sandbox metadata to server environment @jif-oai
- #28911 Add turn-scoped context contributions @jif-oai
- #28808 Fix goal-first live threads missing from thread/list @etraut-openai
- #25019 [codex] Initialize exec-server OpenTelemetry at startup @starr-openai
- #28943 [codex] Fix Windows sandbox runtime ACL refresh @iceweasel-oai
- #28946 Synchronize realtime notification test requests @rka-oai
- #28822 Add Config for Time Reminders (1/n) @rka-oai
- #28494 [codex] rollout budget implementation (2/N) @rka-oai
- #27500 Support `openai/form` extended form elicitations @gpeal
- #28949 [codex] Make thread store turn filter optional @wiltzius-openai
- #28824 current time reminders impl for system clock (2/n) @rka-oai
- #27812 [codex] Cache plugin metadata for tool suggestions @mzeng-openai
- #28854 apply-patch: carry paths as PathUri @anp-oai
- #28835 Add app-server current-time impl (3/n) @rka-oai
- #26496 Make auto-review on-request prompt more proactive @maja-openai
- #28947 [codex] Remove hardcoded app ID filters @ericning-o
- #28959 TUI: improve unified mention selection visibility @canvrno-oai
- #27132 Emit Trusted MCP App Identity on Tool-Call Items @martinauyeung-oai
- #19049 feat: opt ChatGPT auth into agent identity @adrian-openai
- #28770 [connectors] Ignore synthetic links for app accessibility @adaley-openai
- #28863 [codex] Preserve remote plugin download status errors @xl-openai
- #28958 core: load AGENTS.md from foreign environments @anp-oai
- #28789 [codex] Support marketplace plugin manifest fallback @charlesgong-openai
- #28993 [codex] Remove child AGENTS.md prompt experiment @pakrym-oai
- #28989 core: log AGENTS.md paths as URIs @anp-oai
- #28983 core: keep remote exec on reported shell @anp-oai
- #28844 [codex] Reuse parsed plugin skills during session startup @xl-openai
- #28953 core: add UUIDv7 context window IDs @pakrym-oai
- #28951 [plugins] Refresh plugin and tool caches after remote install @adaley-openai
- #28856 Always use AVAS for realtime WebRTC calls @bakks
- #28814 [codex] Assign response item IDs when recording history @pakrym-oai
- #29005 [codex] Skip curated repo sync for remote plugins @xl-openai
- #29011 [codex] add clock current-time tool @rka-oai
- #29012 core: assign item IDs to compacted replacement history @pakrym-oai
- #29022 [codex] Support protected resource OAuth discovery @xl-openai
- #28674 [1/3] core: add remote environment connection lifecycle @sayan-oai
- #28683 [2/3] core: track starting environments in snapshots @sayan-oai
- #29025 [3/3] app-server: configure environment connection timeout @sayan-oai
- #28685 Add per-turn multi-agent mode @shijie-oai
- #28792 Expose thread-level multi-agent mode @shijie-oai
- #28707 [codex] abort turns when rollout budgets expire (token budget 3/3) @rka-oai
- #28899 Scope network approvals by environment @jif-oai
- #29086 Document raw response item compatibility @jif-oai
- #28489 Add indexed web search mode @winston-openai
- #28942 Add config toggles for orchestrator skills and MCP @jif-oai
- #29099 Keep remote exec commands native to the executor @jif-oai
- #29095 Use cached and live web access terminology @winston-openai
- #29042 [codex] trace pre-sampling skill and persistence latency @rphilizaire-openai
- #29132 chore(deps): advance tokio-tungstenite @apanasenko-oai
- #29006 [codex] Preserve skill descriptions outside model context @charlesgong-openai
- #29154 Allow resume and settings commands during tasks and MCP startup @etraut-openai
- #29256 core: add context window lineage IDs @pakrym-oai
- #29259 [codex] prototype mcp_history thread hint injection @pakrym-oai
- #29255 [codex] add configurable token budget compaction reminder @pakrym-oai
- #29295 [codex] simplify token budget context @pakrym-oai
- #29108 Carry sandbox intent to remote exec servers @jif-oai
- #29325 Test pipelined scalar exec-server requests @jif-oai
- #29326 Parallelize skill metadata stats @jif-oai
- #29329 Use controlled time for remote initialization timeout test @jif-oai
- #29170 code-mode: define transport-neutral runtime types @cconger
- #29285 code-mode: move session ownership into runtime @cconger
- #29286 code-mode: linearize cell terminal state @cconger
- #29287 code-mode: make session shutdown authoritative @cconger
- #29301 [prompting] updated plan mode prompt @rhan-oai
- #29288 code-mode: preserve dropped observation output @cconger
- #29289 code-mode: preserve initial yield at completion @cconger
- #28260 [codex] Add internal auto-compaction opt-out @rhan-oai
- #29371 Propagate safety buffering events to app-server clients @fc-oai
- #29393 chore: fix merge race (auto-compaction feature access) @sayan-oai
- #29327 Persist session IDs across thread resume @jif-oai
- #29324 Simplify multi-agent mode controls @jif-oai
- #29113 Apply sandbox intent inside remote exec servers @jif-oai
- #29001 Add workspace messages app-server API @xli-oai
- #29432 Stop logging every Responses WebSocket event @jif-oai
- #29073 core: refresh environment context before sampling @sayan-oai
- #29455 fix(core): restore thread_source in x-codex-turn-metadata @owenlin0
- #29457 Filter noisy targets from persistent logs @jif-oai
- #29429 remove flag for image preparation @rka-oai
- #29143 ci: restore custom Windows runner with hermetic LLVM 0.7.9 @anp-oai
- #27102 [codex] Centralize Plugin Analytics Metadata @jameswt-oai
- #26703 TUI Plugin Sharing 3 - render remote plugin catalog sections @canvrno-oai
- #29424 Report remote sandbox denials semantically @jif-oai
- #28968 core: rename metadata -> internal_chat_message_metadata_passthrough @owenlin0
- #29464 [sdk/python] Stop advertising HTTP image URLs @rka-oai
- #28793 [codex] Fix usage-limit reset copy and state @jayp-oai
- #27982 [codex] Start the guardian child session when parent session is started @jgershen-oai
- #29468 core: remove unused permissions cwd plumbing @bolinfest
- #26707 PAC 2 - Add shared auth system proxy contract @canvrno-oai
- #28991 Allow ChatGPT accounts without email @efrazer-oai
- #29423 [codex] configure rollout budget reminder thresholds @rka-oai
- #26678 permission profiles: expose availability to clients @viyatb-oai
- #29476 [codex] handle request_user_input in app-server test client @celia-oai
- #29479 fix(config): address permission profile review follow-ups @viyatb-oai
- #29014 Honor startup custom CA bundles with managed MITM @winston-openai
- #29480 chore: advance tungstenite fork pins @apanasenko-oai
- #27669 [codex-core-plugins] Remote Plugin ID Persisted to File @jameswt-oai




## rust-v0.141.0 — 2026-06-18

## New Features

- Remote executors now use authenticated, end-to-end encrypted Noise relay channels. (#26242, #26245)
- Cross-platform remote execution now preserves executor-native working directories and shells, including filesystem permission paths across app-server and exec-server boundaries. (#27819, #27995, #28032, #28122, #28165, #28367)
- Selected executor plugins can activate their stdio MCP servers per thread; plugin discovery also adds a created-by-me marketplace and auth-specific curated catalogs. (#27870, #27884, #27893, #28203, #28383)
- App-server clients can list immediate child threads, correlate external-agent imports with detailed results, and read or redeem rate-limit reset credits. (#26662, #28008, #28143)
- Realtime clients can explicitly append speech, control how Codex responses enter conversations, and omit startup context. (#27917, #28405)
- TUI input prompts can auto-resolve after inactivity, with a countdown that pauses on interaction. (#28235)

## Bug Fixes

- Hook trust bypass now persists through `codex exec` thread start and resume, while blocking `PostToolUse` hooks correctly reject code-mode tool calls. (#26434, #28365)
- Plugin capabilities now route consistently by authentication mode, deduplicate conflicting App/MCP declarations, and preserve remote marketplace ordering. (#27461, #27602, #27607, #27902, #27958, #28395)
- Windows sandbox execution repairs stale credentials automatically and gives PowerShell commands more time before backgrounding. (#27086, #27944)
- Idle exec-server relays remain connected, and steered user input immediately interrupts `wait_agent`. (#28286, #28341)
- Bundled SQLite is pinned to a version containing the WAL-reset corruption fix. (#27992)
- TLS connections now support P-521 certificate signatures commonly used by enterprise proxies. (#27706)

## Chores

- Reduced latency and memory use in large, tool-heavy sessions by caching tool search and eliminating repeated request and history copies. (#27258, #27813, #28306, #28309, #28313, #28323, #28327)
- Bounded prompt-image caching to 64 MiB and feedback uploads to eight related threads. (#28294, #28332)
- Terminal resize reflow is now always enabled, ignoring obsolete disabled settings. (#27794)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.140.0...rust-v0.141.0

- #28001 [codex] package Windows ARM64 on x64 @tamird
- #28032 [codex] Carry exec-server cwd as PathUri @anp-oai
- #27607 [codex] Dedupe plugin MCPs by app declaration name @felixxia-oai
- #27992 [codex] Pin bundled SQLite to fixed WAL-reset version @gpeal
- #28125 build: run buildifier from just fmt @anp-oai
- #28120 bazel: add PowerShell to Wine test harness @anp-oai
- #27819 path-uri: render native paths across platforms @anp-oai
- #28122 [codex] exec-server honors remote environment cwd and shell @anp-oai
- #26662 feat(app-server): filter threads by parent @btraut-openai
- #27884 Add selected-plugin precedence and attribution to the MCP catalog @jif-oai
- #27870 Discover stdio MCP servers from selected executor plugins @jif-oai
- #28283 [codex] update multi-agent v2 prompts @jif-oai
- #27602 [codex] Preserve plugin apps in connector listings @felixxia-oai
- #27461 [codex] Skip plugin MCP OAuth for matching app routes @felixxia-oai
- #27893 Activate selected executor plugin MCPs in app-server @jif-oai
- #28332 [codex] Cap feedback upload subtrees @jif-oai
- #27365 Represent dynamic tools with explicit namespaces internally @sayan-oai
- #28333 skills: hide orchestrator skills with a local executor @jif-oai
- #27756 [codex] simplify shell snapshot ownership @pakrym-oai
- #27794 Remove terminal resize reflow flag gates @etraut-openai
- #28286 chore: restore exec-server relay keepalives @jif-oai
- #28164 [codex] simplify memory read metrics @pakrym-oai
- #27371 Expose explicit dynamic tool namespaces in thread start @sayan-oai
- #28309 linearize history output normalization @jif-oai
- #28306 avoid cloning sampling request input @jif-oai
- #28323 serialize websocket requests directly @jif-oai
- #28313 avoid cloning websocket request history @jif-oai
- #28344 [codex] remove stale PathExt import @pakrym-oai
- #27059 [codex] Cover OTLP HTTP log and trace event export @richardopenai
- #28327 reuse encoded Responses request bodies @jif-oai
- #27995 [codex] preserve explicit environment cwd @pakrym-oai
- #28285 guardian: isolate review context from skills and memories @jif-oai
- #26702 TUI Plugin Sharing 2 - add remote plugin section plumbing @canvrno-oai
- #28294 bound prompt image cache retention @jif-oai
- #28257 Support staging OAuth client ID overrides @apanasenko-oai
- #28341 core: let steer interrupt wait_agent @jif-oai
- #28336 skills: cache orchestrator resources per thread @jif-oai
- #28357 Extract shared Windows sandbox session runner @iceweasel-oai
- #27706 Use aws-lc-rs for rustls crypto provider @malsamiri-oai
- #28347 [codex] add path-types skill @anp-oai
- #28235 Add request user input auto-resolution timer @shijie-oai
- #28234 [mcp] Increase default tool timeout to 300 seconds @adaley-openai
- #28008 [codex] Add external agent import result accounting @charlesgong-openai
- #27944 recover stale Windows sandbox credentials @iceweasel-oai
- #27086 Add Windows unified exec yield floor @iceweasel-oai
- #28358 Add hidden Windows sandbox wrapper entrypoint @iceweasel-oai
- #27258 core: cache the tool search handler per session @mchen-oai
- #28143 feat(app-server): expose rate-limit reset credits @jayp-oai
- #28355 feat(core): add metadata field to ResponseItem @owenlin0
- #28203 [codex] Add created-by-me remote plugin marketplace @ericning-o
- #28365 Respect blocking PostToolUse hooks in code mode @abhinav-oai
- #27813 [codex] Reuse Apps policy evaluation across MCP tool exposure @mzeng-openai
- #28300 Deflake realtime handoff steering test @felixxia-oai
- #28395 [codex] Preserve remote plugin directory order @jameswt-oai
- #27955 [codex] retain resolved environments across turns @pakrym-oai
- #27917 Add realtime speech append control @guinness-oai
- #27093 [codex-analytics] Analytics Capture to File in Debug Builds @jameswt-oai
- #26242 exec-server: add Noise relay transport @viyatb-oai
- #28165 Use PathUri in filesystem permission paths for exec-server @anp-oai
- #28415 [codex] Fix missing response item metadata in tests @adaley-openai
- #27058 [codex] Add second-based OTEL duration histograms @richardopenai
- #27902 [codex] Centralize plugin auth capability filtering @felixxia-oai
- #28405 Add a toggle for realtime startup context @guinness-oai
- #26434 Preserve hook trust bypass in codex exec threads @abhinav-oai
- #26245 exec-server: default remote transport to Noise @viyatb-oai
- #28383 [codex] Load API curated marketplace by auth @felixxia-oai
- #27958 [codex] Make plugin details capability aware @felixxia-oai
- #28367 Use ApiPathString in app-server filesystem permission paths @anp-oai
- #28421 [codex] Bind shell snapshots to retained thread environments @pakrym-oai
- #28429 [codex] Add interruptible sleep tool @pakrym-oai
- #28441 [codex] Use expect in integration tests @pakrym-oai
- #28163 [codex] Use local environment for user shell commands @pakrym-oai




## rust-v0.140.0 — 2026-06-15

## New Features

- Added `/usage` views for daily, weekly, and cumulative account token activity. (#27925)
- `/goal` now preserves oversized text, large pasted blocks, and image attachments, including in remote app-server sessions. (#27508, #27509, #27510)
- Added permanent session deletion through `codex delete`, `/delete`, and app-server `thread/delete`, with confirmation safeguards and subagent cleanup. (#25018, #27476)
- Added `/import` for selectively importing setup, project configuration, and recent chats from Claude Code. (#27070, #27071, #27703)
- Typing `@` now opens the unified mentions menu for files, plugins, and skills by default. (#27499)
- Added managed Amazon Bedrock API-key authentication and encrypted local storage for CLI and MCP OAuth credentials. (#27443, #27689, #27504, #27535, #27539, #27541)

## Bug Fixes

- Corrupted SQLite state databases are now backed up and rebuilt automatically from rollout data, including malformed database-directory cases. (#26859, #27719)
- Prevented `/review` from crashing when `Esc` is pressed with queued guidance, while preserving that guidance when the review is canceled. (#22879)
- Improved MCP reliability by retrying transient startup failures, reporting unusable OAuth credentials as logged out, and preserving explicitly disabled servers. (#25147, #26713, #27414)
- Fixed remote plugin uninstall requests and correctly surfaced apps requiring authentication during installation. (#27085, #27223)
- Persisted “Don’t remind me” update dismissals reliably and cleared stale running-hook indicators after completed turns. (#27619, #27783)
- Non-TTY background commands can now be interrupted with Ctrl-C while preserving their final output and exit status. (#26734)

## Documentation

- Clarified contributor guidance around keeping crate APIs narrow and supporting Linux, macOS, and Windows. (#27939, #27966)

## Chores

- Improved responsiveness for large repositories and long sessions by preserving Git’s built-in filesystem monitor, avoiding duplicate history reads, accelerating archive lookup, and caching turn-diff rendering. (#26880, #27031, #27276, #27489)
- Removed the experimental `/realtime` voice controls and related audio dependencies from the TUI. (#27801)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.139.0...rust-v0.140.0

- #26880 [codex] preserve fsmonitor for worktree Git reads @tamird
- #27085 Use server app auth requirements for remote plugin install @xl-openai
- #27098 [codex] Return workspace directory installed plugins @xl-openai
- #27007 multi-agent: add path-based v2 activity tracking @jif-oai
- #27166 app-server: clear stale thread watches after v2 agent interruption @jif-oai
- #27080 [codex] Ignore pending PR review comments @anp-oai
- #26420 Avoid no-op backfill state writes @zanie-oai
- #27031 Avoid rereading rollout history during cold resume @zanie-oai
- #22879 fix: Prevent /review crash when entering Esc on steer message @canvrno-oai
- #27173 app-server: reject direct input to multi-agent v2 sub-agents @jif-oai
- #27184 Load selected executor skills through extensions @jif-oai
- #26835 [codex] Test extension API contracts @anp-oai
- #27063 [codex-analytics] add extensible feature thread sources @marksteinbrick-oai
- #26479 [codex] Speed up local nextest runs @anp-oai
- #27223 fix: use plugin service route for remote uninstall @ericning-o
- #22685 Add SOCKS5 TCP MITM coverage @winston-openai
- #26681 Allow creating a new goal after completion @etraut-openai
- #26711 Reduce TUI legacy core dependencies @etraut-openai
- #27110 [1/6] Add Python goal routing foundation @aibrahim-oai
- #27191 Route hosted Apps MCP through extensions @jif-oai
- #26830 [codex] Characterize global instruction lifecycle @anp-oai
- #26713 [codex] Report unusable MCP OAuth credentials as logged out @anp-oai
- #26734 [codex] Handle Ctrl-C for non-TTY unified exec @pakrym-oai
- #27116 Stop mirroring Codex user input into realtime @guinness-oai
- #27111 [2/6] Add private Python goal operations @aibrahim-oai
- #25147 [codex] Retry streamable HTTP initialize failures @ssetty-oai
- #27257 [codex] Tighten MCP connection manager API visibility and order @aibrahim-oai
- #26701 TUI Plugin Sharing 1 - add remote plugin identity @canvrno-oai
- #27129 feat: use provider defaults for memory models @celia-oai
- #27094 Add spans to build_tool_router @mchen-oai
- #24999 Add per-session realtime model and version overrides @guinness-oai
- #27078 [codex-analytics] emit goal lifecycle analytics @marksteinbrick-oai
- #27285 [codex] Fix post-merge analytics integration failures @anp-oai
- #27107 Add spans to run_turn @mchen-oai
- #27261 [codex] Make MCP connection startup fallible @aibrahim-oai
- #27174 feat: keep child MCP warnings out of parent transcript @jif-oai
- #27198 Use plugin-service MCP as the hosted plugin runtime @jif-oai
- #27375 [codex] Tag multi-agent spawn metrics with version @jif-oai
- #27383 Remove async-trait from extension contributors @jif-oai
- #27259 Use latest-wins MCP manager replacement @charliemarsh-oai
- #27264 [codex] Store compact window id in rollout @pakrym-oai
- #27280 [codex] add io PathUri native conversion APIs @anp-oai
- #27315 [codex] link Windows releases with LLD @tamird
- #27276 Reduce archive rollout lookup CPU @etraut-openai
- #27299 [codex] Outline ToolExecutor handler bodies @anp-oai
- #27391 Index visible thread list ordering @zanie-oai
- #27407 Fix compressed rollout search path matching @jif-oai
- #27304 [codex] Remove async_trait from ToolExecutor @anp-oai
- #26041 Add app-server background terminal process APIs @etraut-openai
- #25018 Add app-server `thread/delete` API @etraut-openai
- #26859 fix: Auto-recover from corrupted sqlite databases @ddr-oai
- #27064 [codex] remove blocking external agent migration flow @stefanstokic-oai
- #27421 [codex] Raise app-server recursion limit @anp-oai
- #27062 [codex] Retry transient Guardian review failures @kbazzi
- #27065 [codex] extract external agent import picker renderer @stefanstokic-oai
- #26409 [plugins] Inject remote_plugin_id into install elicitations @adaley-openai
- #27439 feat: make ThreadStore available on ThreadExtensionDependencies @bolinfest
- #27343 Guard core test subprocess cleanup @etraut-openai
- #27070 [codex] add external agent import picker UX @stefanstokic-oai
- #27321 [codex] Move release platform rules into bazel package @anp-oai
- #27071 [codex] add /import for external agents @stefanstokic-oai
- #27311 [codex] Skip local curated discovery for remote plugins @xl-openai
- #27414 [codex] Preserve disabled MCP servers across runtime overlays @e-provencher
- #27312 [codex] reuse release artifacts for npm staging @tamird
- #27319 Forward standalone assistant output to realtime @guinness-oai
- #27057 [codex] Add reusable OTEL gauge instruments @richardopenai
- #27245 image: add shared data URL preparation utilities @fjord-oai
- #27392 [codex-analytics] emit internally started turn events @marksteinbrick-oai
- #27322 [codex] Preserve build-script dependencies in rules_rs annotations @anp-oai
- #27489 core: cache turn diff rendering @nornagon-openai
- #27465 [codex] Remove redundant plugin app auth state @xl-openai
- #27484 Remove TUI legacy core test_support dependencies @etraut-openai
- #27476 Add session delete commands in CLI and TUI @etraut-openai
- #27247 core: resize all history images behind a feature flag @fjord-oai
- #27487 Trim TUI legacy telemetry and migration dependencies @etraut-openai
- #27438 [codex] Add token budget context feature @pakrym-oai
- #27501 [codex] Expand hosted web search citation guidance @yuning-oai
- #27526 tools: simplify default tool search text @sayan-oai
- #27488 [codex] Add new context window tool @pakrym-oai
- #27443 feat: add Bedrock API key as a managed auth mode @celia-oai
- #27532 [codex] Add comp_hash to model metadata @aibrahim-oai
- #27246 core: strip image detail from Responses Lite requests @fjord-oai
- #27517 [codex] Pass auth mode to plugin manager @xl-openai
- #27520 [codex] Compact when comp_hash changes @aibrahim-oai
- #27518 [codex] Add context remaining tool @pakrym-oai
- #27266 image: preserve metadata when resizing prompt images @fjord-oai
- #27103 [codex-analytics] report cached input tokens for v2 compaction @rhan-oai
- #27356 Use generic search metadata for dynamic tools @sayan-oai
- #27082 [codex-analytics] Emit structured compaction codex errors @rhan-oai
- #26513 [codex] Tune cloud config cache intervals @alexsong-oai
- #27387 skills: make backend plugin skills invocable without an executor @jif-oai
- #27403 skills: cache remote catalog failures per thread @jif-oai
- #27573 core: enable remote compaction v2 by default @jif-oai
- #27388 skills: expose remote skill resource tools @jif-oai
- #27569 multi-agent: move concurrency guidance into v2 usage hints @jif-oai
- #27585 nit: cap error @jif-oai
- #27404 test: cover referenced backend skill reads without an executor @jif-oai
- #27591 skills: render catalog locators by authority @jif-oai
- #27413 skills: decouple the skills extension from core @jif-oai
- #27527 [codex] publish npm packages concurrently @tamird
- #27528 [codex] publish DotSlash alongside npm @tamird
- #27529 [codex] download only release artifacts @tamird
- #27490 Remove TUI legacy Windows sandbox dependency @etraut-openai
- #27483 Emit plugin ID on MCP tool call analytics events @chrisdong-oai
- #27417 Print TUI session info on fatal exits @etraut-openai
- #27507 lint: allow self-documenting builder arguments @anp-oai
- #27420 [codex] Propagate plugin app categories @charlesgong-openai
- #27454 [codex] add cross-platform filesystem adapter coverage @anp-oai
- #27415 [codex] Surface runtime warnings in codex exec @anp-oai
- #27639 [codex] revert concurrent npm publishing @tamird
- #27646 feat: disable orchestrator skills for now @jif-oai
- #27323 [codex] Provide ARM64 MinGW powl compatibility support @anp-oai
- #27433 [codex] remove EnvironmentPathRef @anp-oai
- #27424 [codex] migrate ExecutorFileSystem paths to PathUri @anp-oai
- #27101 [codex] Load user instructions through an injected provider @anp-oai
- #27634 Resolve MCP server registrations through a catalog @jif-oai
- #27122 core: Consolidate Responses API Codex metadata @owenlin0
- #27450 [codex-rs] enforce PAT workspace restrictions @cooper-oai
- #27653 [codex] migrate exec-server filesystem protocol to PathUri @anp-oai
- #27663 Include thread id in token budget context @pakrym-oai
- #26418 [codex] Avoid duplicate hooks.json discovery with profiles @abhinav-oai
- #27689 feat: prefer managed Bedrock auth in model provider @celia-oai
- #27700 Remove fs/join and fs/parent from exec-server protocol @anp-oai
- #26426 Warn when hooks.json has unsupported top-level fields @abhinav-oai
- #27318 [codex] Move persistence policy application into ThreadStore @wiltzius-openai
- #27498 Route image extension reads through turn environments v2 @won-openai
- #27623 Add spans to turn lifecycle gaps @mchen-oai
- #27619 tui: clear stale hook row after turn completion @kotakem-openai
- #27711 Fix image extension PathUri conversion @anp-oai
- #27475 [codex] Remove async_trait from first-party code @anp-oai
- #27719 fix: Recover from sqlite directory being a file @ddr-oai
- #27715 ci(v8): gate Windows source builds on relevant changes @cconger
- #27702 [codex] parallelize release code generation @tamird
- #27709 [codex] resolve environment shell metadata eagerly @pakrym-oai
- #27445 feat(app-server): persist remote-control desired state @apanasenko-oai
- #27508 [1 of 3] Support long raw TUI goal objectives @etraut-openai
- #27256 Add request_user_input auto-resolution window contract @shijie-oai
- #27724 code-mode standalone: extract protocol and add host crate @cconger
- #27778 Translate non-English issues @etraut-openai
- #27316 Keep request_user_input direct-model only @shijie-oai
- #27696 [codex] Load AGENTS.md from all bound environments @anp-oai
- #27670 Make MCP server contributions thread-scoped @jif-oai
- #27732 [code-mode] Reject remote image URLs from output helpers @rka-oai
- #27692 Add executor-owned plugin resolution @jif-oai
- #27863 Extract shared plugin MCP config parsing @jif-oai
- #27703 [codex] restore source-specific import copy @stefanstokic-oai
- #27879 fix: serialize auth environment tests @jif-oai
- #27791 Reject transcript backtrack in side conversations @etraut-openai
- #27075 [ez][codex-rs] Support approvals reviewer in app defaults @zamoshchin-openai
- #27538 Use dependency groups for Python SDK tooling @charliemarsh-oai
- #27783 Persist update dismissal without cache @etraut-openai
- #27814 tui: Allow extra o's in /goal command @btraut-openai
- #27901 Use uv as Python SDK build backend @charliemarsh-oai
- #27720 realtime: add AVAS architecture override @bakks
- #27919 chore: prompt MAv2 @jif-oai
- #27816 sandboxing: migrate cwd inputs to PathUri @anp-oai
- #27890 [codex] expose remote plugin share URL @ericning-o
- #27913 [codex] unify apply patch parsing @pakrym-oai
- #27920 Handle standalone image generation failures as terminal items @won-openai
- #27927 [codex] Add size to internal filesystem metadata @pakrym-oai
- #27504 feat: add secret auth storage configuration @celia-oai
- #27674 [login] revoke existing auth before starting login @cooper-oai
- #27535 feat: add auth-specific encrypted secret namespaces @celia-oai
- #27939 [codex] Add crate API surface review rule @pakrym-oai
- #27926 [codex] Align implicit skill reads with parser @alexsong-oai
- #23254 fix(plugins) rm plugin descriptions @dylan-hurd-oai
- #27830 Support plaintext agent messages @jif-oai
- #27801 Remove TUI realtime voice support @etraut-openai
- #27539 feat: use encrypted local secrets for CLI auth @celia-oai
- #27076 Warn for structured feature toggles @canvrno-oai
- #27541 feat: use encrypted local secrets for MCP OAuth @celia-oai
- #27936 [codex] add roles to realtime append text @agamble-oai
- #27509 [2 of 3] Support long pasted text in TUI goals @etraut-openai
- #27109 Add Guardian catalog diagnostics metadata @won-openai
- #27966 Specify platform support in AGENTS.md @anp-oai
- #27855 [codex] parallelize Windows compression @tamird
- #27499 Promote TUI unified mentions in composer to default mentions feature @canvrno-oai
- #27972 [codex] Let generic test turns inherit their environment @pakrym-oai
- #27856 [codex] package Windows symbols in parallel @tamird
- #27976 [codex] make PathUri::from_abs_path infallible @anp-oai
- #27854 [codex] parallelize Windows package archives @tamird
- #27853 [codex] stage npm packages concurrently @tamird
- #27710 [codex] add latency tracing spans @rphilizaire-openai
- #27510 [3 of 3] Support images in TUI goals @etraut-openai
- #27925 feat(tui): reland token activity command @fcoury-oai
- #27988 [codex] Limit app-based plugin suggestions to remote catalogs @xl-openai
- #27652 [codex] Add auth mode to plugin manager constructor @felixxia-oai
- #27964 [codex] Add hermetic Wine test support @anp-oai
- #27459 [codex] Gate plugin MCP servers by auth route @felixxia-oai
- #27961 feat(app-server): enforce managed remote control disable @apanasenko-oai
- #27937 [codex] Add hermetic Wine exec-server test @anp-oai
- #27996 [codex] Send request-scoped turn state over WebSocket @aibrahim-oai
- #28002 [codex] Send turn state through compact requests @aibrahim-oai




## rust-v0.139.0 — 2026-06-09

## New Features
- Code mode can now call standalone web search directly, including from nested JavaScript tool calls, and receive plaintext search results. (#26719)
- Tool and connector input schemas now preserve `oneOf` and `allOf`, and large schemas keep more shallow structure when compacted, improving compatibility with richer MCP tools. (#24118, #27084)
- `codex doctor` now includes editor and pager environment details in the local report while redacting raw values in JSON output. (#27081)
- Plugin marketplace automation is more informative and responsive: `codex plugin marketplace list --json` now includes each marketplace source, and plugin lists can return from the cached remote catalog before refreshing in the background. (#27009, #26932)

## Bug Fixes
- `codex resume --last "..."` and `codex fork --last "..."` now treat the trailing argument as the initial prompt instead of misreading it as a session ID. (#26818)
- MCP startup warnings from subagents now stay in the thread that owns them, avoiding duplicate parent-thread alerts and stuck startup spinners in the TUI. (#26639)
- Image edits now use the exact referenced image file paths instead of guessing from conversation history, so attached-image edits land on the intended input. (#26486)
- Bare URLs with `~` in the path are now linkified end to end in the TUI instead of being truncated before the tilde. (#27088)
- Thread resets such as `/new`, `/clear`, and `/fork` no longer drop cloud-managed requirements or feature flags during TUI config reloads. (#25177)
- Sandbox execution now preserves approved escalation decisions and enforces configured proxy-only networking more consistently. (#24981, #27035)

## Chores
- Release builds once again publish separate symbol archives with line tables, improving post-release crash symbolication without bringing back the earlier full-debug build slowdown. (#26202)
- The embedded V8 toolchain was updated to `rusty_v8` 149.2.0. (#26464)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.138.0...rust-v0.139.0

- #26741 fix(remote-control): preserve enrollment on generic websocket 404s @apanasenko-oai
- #26804 fix(core-plugins): send Codex product SKU to plugin-service @ericning-o
- #26464 build(v8): update rusty_v8 to 149.2.0 @cconger
- #26895 ci: use bazel environment for BuildBuddy secret @bolinfest
- #24981 fix: preserve approval sandbox decisions in unified exec @bolinfest
- #26818 fix(tui): accept prompts with resume and fork @fcoury-oai
- #24820 deps: update starlark to 0.14.2 @bolinfest
- #26639 fix(tui): scope MCP startup status by thread @fcoury-oai
- #26719 [codex] Enable standalone web search in code mode @rka-oai
- #26632 feat: add v2 agent residency lru @jif-oai
- #26974 Ignore proc-macro-error2 advisory @jif-oai
- #26969 feat: count V2 concurrency by active execution @jif-oai
- #26994 Rename multi-agent v2 close_agent to interrupt_agent @jif-oai
- #26997 Avoid reopening v2 descendants on resume @jif-oai
- #26821 [codex] Exclude external tool output from memories @rka-oai
- #26202 [codex] Restore release symbol artifacts with line tables @nornagon-openai
- #26852 fix(app-server): avoid blocking connection cleanup @apanasenko-oai
- #26923 Add HTTP window ID to Responses client metadata @ningyi-oai
- #26680 [codex-analytics] report compaction analytics details @rhan-oai
- #26637 [codex] Speed up external agent session imports @stefanstokic-oai
- #27009 [plugins] Expose marketplace source in marketplace list JSON @mpc-oai
- #27024 ci: template custom runner names by repo @bolinfest
- #26230 fix: preserve auto review across config and delegation @viyatb-oai
- #27038 [codex] Clarify PR babysitter state mutations @anp-oai
- #27037 [codex] Calm multi-agent v2 usage prompts @jif-oai
- #26687 Pair thread environment settings @pakrym-oai
- #27054 cli: add -P sandbox permissions profile alias @bolinfest
- #27035 Enforce configured network proxy in codex sandbox @viyatb-oai
- #26486 Route image edits through referenced file paths @won-openai
- #27060 [codex-analytics] stop sending codex error subreason @rhan-oai
- #27044 [codex] Require complete main-agent skill reads @fchen-oai
- #24118 feat: support oneOf and allOf in tool input schemas @celia-oai
- #26934 [codex] Prune stale curated plugin caches @xl-openai
- #26932 Use cached remote plugin catalog for plugin list @xl-openai
- #26091 [codex] Add OTEL counter descriptions @richardopenai
- #27081 feat(doctor): report editor and pager environment @fcoury-oai
- #27084 chore: preserve one more schema layer during large tool compaction @celia-oai
- #26840 Add typed file URIs @anp-oai
- #27088 fix(tui): linkify complete bare URLs with tildes @fcoury-oai
- #27068 Show effective sandbox modes in /debug-config @canvrno-oai
- #27092 Add extra config to StoredThread, leave empty for now @kumquatexpress
- #27096 Update web search citation prompt @yuning-oai
- #25177 Preserve cloud requirements across TUI thread resets @canvrno-oai
- #27106 [codex] Remove remote compaction failure log @pakrym-oai




## rust-v0.138.0 — 2026-06-08

## New Features

- The `/app` command can now hand off the current CLI thread into Codex Desktop on macOS and native Windows, and Windows workspace launches can open directly into Desktop instead of stopping at a manual prompt. (#25638, #26500)
- Local image attachments and standalone image generations now expose their saved file paths to the model, which makes follow-up edits and file references more reliable. (#25944, #25947)
- Reasoning effort selection is more flexible: the TUI adds fallback shortcuts for terminals that miss `Alt` bindings, and model-defined effort levels now flow through in the order advertised by the model. (#25623, #26444, #26446)
- App-server integrations can now read account token usage, and Codex auth supports v2 personal access tokens in CLI and app-server flows. (#25344, #25731)
- Plugin automation got richer structured output: add/remove and marketplace commands support `--json`, plugin list JSON includes marketplace source, and plugin detail data now exposes default prompts, remote MCP servers, and unavailable app templates. (#26631, #26417, #25887, #26453, #26317)

## Bug Fixes

- Goal workflows are more predictable: multiline paste in `/goal edit` no longer submits early, idle auto-turns stay out of Plan mode, and goals stop auto-continuing after terminal turn failures. (#26047, #26147, #26690)
- Forked threads now keep user-renamed titles instead of falling back to the original first-prompt name. (#26075)
- The TUI no longer adds extra blank space while streaming, and cancelled prompts reopen with the cursor at the end so you can keep editing naturally. (#26636, #26457)
- TUI config write failures now show the underlying cause, making validation problems and read-only filesystem issues much easier to diagnose. (#26537)
- Startup is more resilient across environments, with support for `/usr/bin/bash`, shorter Linux proxy socket paths, and pre-refresh of expired OAuth-backed MCP credentials. (#26538, #26553, #26482)
- Workspace instruction loading is more accurate for remote and symlinked workspaces, so the right `AGENTS.md` files are picked up consistently. (#26205, #26465)

## Documentation

- The CLI README was refreshed to remove stale guidance and better match the current documentation flow. (#26313)

## Chores

- TUI startup does less repeated plugin work by reusing discovery results and loading only hook metadata on the critical path. (#26469, #26272)
- `resume --last` now finds the newest matching session through the state DB first, which speeds up restore on large local histories. (#26462)
- Large MCP/Ollama streams and long message histories process much faster thanks to optimized byte scanning. (#26265)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.137.0...rust-v0.138.0

- #26179 nit: small prompt update for MAv2 @jif-oai
- #26175 feat: guard git enrichment @jif-oai
- #26047 Fix multiline paste in /goal edit @etraut-openai
- #25700 core: stop threading SandboxPolicy through exec @bolinfest
- #25925 [codex] Copy user Bazel settings into Codex worktrees @anp-oai
- #26216 [codex] Pin Python SDK to runtime 0.137.0a4 @aibrahim-oai
- #25887 Preserve remote plugin default prompts @ericning-o
- #25944 Expose local image paths to models @won-openai
- #25469 [profile-switcher][rust] -- [1/2] Add app-server account session protocol @dhruvgupta-oai
- #26075 Fix forked thread name inheritance @etraut-openai
- #25960 Restore Windows coverage for code-mode image generation exposure @won-openai
- #26226 [codex] Split Python runtime release workflow @aibrahim-oai
- #26254 feat: catalog multi-agent v2 config @jif-oai
- #26251 Rewrite oversized tool outputs during remote compaction @pakrym-oai
- #26260 codex-pr-body: avoid confidential references @anp-oai
- #26074 Use Windows setup marker as completion signal @abhinav-oai
- #26002 log plugin MCP server names @chrisdong-oai
- #25623 fix(tui): add reasoning effort fallback shortcuts @fcoury-oai
- #25638 feat(tui): add /app desktop handoff @fcoury-oai
- #26189 cli: add package path from install context @bolinfest
- #25946 [codex-analytics] report compaction request token counts @rhan-oai
- #26252 ci: sign macOS release artifacts with Azure Key Vault @eburke-openai
- #26367 chore: calm down @jif-oai
- #26147 Gate automatic idle turns in Plan mode @jif-oai
- #26172 Bridge host-loaded skills into the skills extension @jif-oai
- #26265 Optimize unbounded byte scans with memchr @charliemarsh-oai
- #26396 Reduce SQLite contention from OpenTelemetry SDK debug logs @zanie-oai
- #26272 Load plugin hooks without other plugin capabilities @charliemarsh-oai
- #26313 Simplify Codex CLI README @etraut-openai
- #25947 Add saved image path hint to standalone image generation @won-openai
- #26291 Bound external agent session detection work @stefanstokic-oai
- #26417 Expose configured marketplace source in plugin list JSON @mpc-oai
- #26436 app-server: support -c config overrides @bolinfest
- #26435 external-agent-migration: avoid mixed MCP transport configs @stefanstokic-oai
- #26248 [codex-analytics] emit forked thread id on initialization @kbazzi
- #26320 core: allow excluding tool namespaces from code mode @sayan-oai
- #25945 Use Azure artifact signing environment secrets @shijie-oai
- #26205 Route AGENTS.md loading through environment filesystems @anp-oai
- #26445 [codex] Fix Windows sandbox build script lint @pakrym-oai
- #23710 build: use ThinLTO for release binaries @anp-oai
- #26447 Remove response.processed websocket request @pakrym-oai
- #26312 Cleanup experimentalFeature/enablement/set @mzeng-openai
- #26444 [codex] Support model-defined reasoning efforts @aibrahim-oai
- #26446 [codex] Use model-advertised reasoning effort order @aibrahim-oai
- #26466 Use Winget release environment secret @shijie-oai
- #26465 [codex] Preserve logical paths during AGENTS.md discovery @anp-oai
- #26453 fix(app-server): expose remote MCP servers in plugin read @ericning-o
- #26473 Add skill for pushing CI configuration changes @anp-oai
- #26317 [codex] Expose unavailable app templates in plugin detail @charlesgong-openai
- #26471 Improve Windows sandbox setup refresh diagnostics @iceweasel-oai
- #26431 Pull plugin service less frequently @beggers-openai
- #25000 ci: test windows cross build @cconger
- #25955 [codex] Emit sandbox outcome telemetry event @rreichel3-oai
- #26487 [codex] Add use_responses_lite 'override' logic @rka-oai
- #26482 fix(rmcp): refresh expired OAuth tokens before startup @anp-oai
- #26256 [codex] Keep Bazel startup options stable across commands @anp-oai
- #26499 core: derive exec policy filesystem policy from profile @bolinfest
- #26215 feat(remote-control): allow pairing while disabled @apanasenko-oai
- #26480 [codex] Add environment shell info @pakrym-oai
- #26210 Encrypt multi-agent v2 message payloads @jif-oai
- #26566 nit: doc @jif-oai
- #25710 [codex] Forward turn moderation metadata through app-server @carlc-oai
- #26599 [codex] Keep v1 spawn metadata visible @jif-oai
- #26610 refactor: split agent control modules @jif-oai
- #25344 feat(app-server): expose account token usage [1 of 2] @fcoury-oai
- #26553 [codex] Fix long proxy socket paths @viyatb-oai
- #26537 Surface TUI config write error causes @etraut-openai
- #26500 Open Windows app workspaces via deep link @etraut-openai
- #26551 Fix `/goal` usage text for control commands @etraut-openai
- #26554 Render code comment directives in TUI replay @etraut-openai
- #26623 feat: reload v2 agents on delivery @jif-oai
- #26532 Require absolute cwd in thread settings @pakrym-oai
- #26625 [codex] Allow socketpair in proxy-routed Linux sandbox @viyatb-oai
- #26538 [codex] Add /usr/bin/bash shell fallback @pakrym-oai
- #26449 feat(remote-control): add pairing status transport @hefuc-oai
- #26433 Make turn diff tracker multi-env aware @pakrym-oai
- #26636 fix(tui): avoid doubled blank rows while streaming @fcoury-oai
- #26450 feat(app-server): add remote control pairing status RPC @hefuc-oai
- #26335 Clean up Rust release workflow @shijie-oai
- #26547 [1 of 2] Align goal extension with core behavior @etraut-openai
- #26181 fix(tui): Windows composer background @fcoury-oai
- #26457 fix(tui): restore cancelled prompt cursor at end @fcoury-oai
- #26307 [codex] Respect Windows sandbox backend in exec policy @iceweasel-oai
- #26484 [codex] Add turn profiling analytics @aibrahim-oai
- #26552 Make runtime workspace roots absolute in app-server API @pakrym-oai
- #26462 Use state DB first for `resume --last` @charliemarsh-oai
- #26469 Speed up TUI startup by reusing plugin discovery @charliemarsh-oai
- #26631 Add JSON output for plugin subcommands @mpc-oai
- #26669 [codex] Bound WSL local curated discovery @xl-openai
- #26548 [2 of 2] Finish moving goal runtime to extension @etraut-openai
- #26674 protocol: remove submission-side serde from Op @pakrym-oai
- #26690 Block active goals after terminal turn errors @etraut-openai
- #25936 [codex] Remove legacy remote plugin startup sync @xl-openai
- #26490 [codex] Use standalone tools for Responses Lite @rka-oai
- #26013 [codex] Gate terminal visualization instructions in TUI @vie-oai
- #25731 [codex-rs] support v2 personal access tokens @cooper-oai
- #26542 [codex] Send Responses Lite transport header @rka-oai
- #24852 permissions: enforce managed permission profile allowlists @viyatb-oai
- #26698 [codex] Deduplicate skill load warnings @xl-openai
- #26716 Remove `just bench-smoke` from `just test`. @anp-oai




## rust-v0.137.0 — 2026-06-04

## New Features
- TUI controls now support F13-F24 keybindings, paste in searchable menus, and a compact reasoning-only status/title item (#25329, #25400, #25504).
- Enterprise/admin flows now show monthly credit limits and can apply cloud-managed config bundles, including EDU workspaces (#24812, #24617, #24619, #24620, #24622, #25963).
- Remote-control clients can start pairing and list or revoke controller grants through app-server v2 RPCs (#25675, #25785).
- Plugin workflows gained machine-readable `codex plugin list --json` output and cached remote catalog suggestions (#25330, #25457).
- Hosted web and image tools are available in more code-mode flows, with standalone web searches able to run in parallel (#25176, #25702, #25890, #25923).
- Multi-agent v2 keeps runtime choice with each thread and exposes cleaner follow-up and metadata defaults for spawned agents (#25266, #25636, #25720, #25721, #25722, #25841, #26114).

## Bug Fixes
- Cancelling a submitted prompt before visible output now restores the draft, attachments, and collaboration mode for editing (#25316).
- Slash-command filtering and footer shortcut hints now reset or render according to the current UI state (#25492, #25625).
- Platform reliability improved for macOS app launches and Windows SQLite startup, thread resume, and sandbox setup refreshes (#25485, #25490, #25509, #25949).
- Plugin loading preserves app manifest order, deduplicates local/remote curated installs, and treats malformed `skills` fields as warnings (#25491, #25681, #25717, #25782).
- Permission requests and approvals now carry environment identity, and managed MITM proxying exports readable CA bundles to child commands (#25850, #25858, #25862, #22668).
- Local session history is safer for compressed rollouts, renamed titles, pathless side-chat reloads, and stack-heavy startup/config rebuilds (#25087, #25624, #25661, #25814, #25844, #25847).

## Documentation
- Added app-server docs and generated schema updates for monthly credit limits, remote-control RPCs, and environment-scoped permission approvals (#24812, #25675, #25785, #25862).
- Moved repo review rules and contributor conventions into `AGENTS.md`, including Rust test-module layout and Python 3 compatibility guidance (#25682, #25690, #25738).

## Chores
- Root formatting and Justfile workflows are more complete and Windows-aware (#24983, #25165, #25683).
- Rust CI and release workflows use the git CLI for Cargo fetches to avoid intermittent libgit2/submodule failures (#25644, #25775).
- Python SDK releases now publish runtime wheels from the SDK workflow and pin to a glibc-compatible runtime package (#25906, #25907).
- Bazel CI’s BuildBuddy wrapper was reintroduced with Windows-safe process handling and validation (#25915).
- Shared prompts, context fragments, and skills plumbing moved into dedicated crates/extension paths to reduce `codex-core` coupling (#25151, #25953, #25959, #26106, #26122, #26167).

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.136.0...rust-v0.137.0

- #25329 feat(tui): allow function keys through f24 in keymaps @fcoury-oai
- #24617 Add config bundle transport types @joeflorencio-openai
- #25435 Add build_unsigned_archive release mode @shijie-oai
- #24619 Compose requirements layers @joeflorencio-openai
- #24620 Add cloud-managed config layer support @joeflorencio-openai
- #25462 Revert "Add build_unsigned_archive release mode" @shijie-oai
- #25113 store and expose parent_thread_id on Threads @owenlin0
- #25266 Set multi-agent v2 dogfood defaults @jif-oai
- #25060 Add goal extension idle continuation @jif-oai
- #25576 Use templates for goal steering prompts @jif-oai
- #25577 Remove Plan-mode gate from idle turn injection @jif-oai
- #25096 Add goal extension GoalApi @jif-oai
- #25087 Read compressed rollouts and materialize before append @jif-oai
- #25628 [codex] fix compressed rollout fixture SessionMeta initialization @fcoury-oai
- #25316 feat(tui): restore output-free cancelled prompts @fcoury-oai
- #23763 Preserve auto-review approval policy in codex exec @won-openai
- #25400 Allow paste in searchable selection menus @charliemarsh-oai
- #25485 Use deep links for macOS codex app paths @etraut-openai
- #25492 Reset slash popup selection when filter changes @etraut-openai
- #25504 Add reasoning-only status surface item @etraut-openai
- #25624 Preserve renamed thread titles during reconciliation @jif-oai
- #25089 Compress cold local rollouts @jif-oai
- #25490 Disable SQLite intrinsics for Windows x64 releases @etraut-openai
- #25603 [codex] Inherit raw events for spawned child listeners @vivi
- #25644 [codex] Use git CLI for release Cargo fetches @shijie-oai
- #25655 nit: drop todo @jif-oai
- #25654 Parallelize cold rollout compression @jif-oai
- #25121 exec-server: add environment path refs @starr-openai
- #25636 [codex] Rename multi-agent v2 assign_task to followup_task @jif-oai
- #25491 Preserve plugin app manifest order @charlesgong-openai
- #24983 [codex] Make justfile recipes Windows-aware @iceweasel-oai
- #25151 [codex] Consolidate shared prompts in codex-prompts @anp-oai
- #25659 Throttle repeated rollout compression runs @jif-oai
- #25165 Check root Python script formatting in CI @anp-oai
- #23767 [codex-rs] auto-review model override  @won-openai
- #25149 exec-server: canonicalize bound filesystem paths @starr-openai
- #25669 fix: deflake zsh-fork approval test @jif-oai
- #24979 feat: gate unified exec zsh fork composition @bolinfest
- #24980 refactor: hide shell override for zsh fork unified exec @bolinfest
- #25679 Add rollout compression counters @jif-oai
- #25682 [codex] document out-of-line test module convention @anp-oai
- #25680 Add rollout compression histograms @jif-oai
- #25689 [codex] Generalize deferred nested tool guidance @sayan-oai
- #25690 Add Python version compatibility guidance @anp-oai
- #25681 fix: Deduplicate installed local and remote curated plugins @xl-openai
- #25701 fix: rename McpServer to TestAppServer @bolinfest
- #25702 [codex] enable parallel standalone web search calls @sayan-oai
- #25705 Fix stale TestAppServer rename in plugin_list test @bolinfest
- #25684 Move tool search metadata onto ToolExecutor @jif-oai
- #25625 fix(tui): clarify footer shortcut overlay hints @fcoury-oai
- #25649 [codex] Publish release symbol artifacts @nornagon-openai
- #25661 Reject directory rollout paths for pathless side chats @bolinfest
- #22668 Wire managed MITM CA trust into child env @winston-openai
- #25712 app-server: remove experimental persist_extended_history bool flag @owenlin0
- #24621 Move cloud requirements crate to cloud config @joeflorencio-openai
- #25717 Handle invalid plugin skills manifest field @xli-oai
- #25675 feat(remote-control): add pairing start @apanasenko-oai
- #25683 [codex] Add comprehensive root formatting check @anp-oai
- #25738 Move code review rules into AGENTS @pakrym-oai
- #24812 feat: show enterprise monthly credit limits in status @efrazer-oai
- #25330 [codex] Add plugin list JSON output @xl-openai
- #25457 [codex] Cache remote plugin catalog for suggestions @xl-openai
- #25783 [codex] Move plugin discoverable logic into core-plugins @xl-openai
- #25782 [codex] Validate plugin skill base names @xl-openai
- #25814 feat: reuse compressed rollout search snippets @jif-oai
- #25720 Add multi-agent runtime metadata types @jif-oai
- #25721 Persist multi-agent runtime metadata @jif-oai
- #25722 Resolve per-thread multi-agent runtime @jif-oai
- #25841 session: keep startup prewarm aligned with resolved multi-agent runtime @jif-oai
- #25840 fix: main oops @jif-oai
- #25723 Test remote multi-agent runtime selector override @jif-oai
- #25724 Test runtime selector before first turn @jif-oai
- #25844 Reduce stack pressure in session startup and config rebuilds @jif-oai
- #25857 flake: Keep plugin test homes alive @jif-oai
- #25847 Run Codex async main on a sized stack @jif-oai
- #25775 [codex] Use git CLI for Cargo fetches across Rust workflows @anp-oai
- #25167 [app-server][core] Add connector-level Guardian reviewer overrides @zamoshchin-openai
- #25868 Skip startup prewarm when websockets are disabled @jif-oai
- #25156 Route Bazel CI through shared BuildBuddy remote config wrapper @anp-oai
- #25739 core: derive built-in permission profiles from raw policies @bolinfest
- #25909 [codex] Revert shared BuildBuddy Bazel wrapper @anp-oai
- #25850 Key request-permission grants by environment @jif-oai
- #25707 [codex-analytics] Track CodexErr details in turn analytics @rhan-oai
- #25858 Add environmentId to request_permissions @jif-oai
- #25176 Route standalone image generation through host finalization md @won-openai
- #25916 Fix Windows release PDB staging @shijie-oai
- #25862 Propagate permission approval environment id @jif-oai
- #25907 [codex] Pin Python SDK to glibc-compatible runtime @aibrahim-oai
- #24859 Use environment secrets for Azure signing @shijie-oai
- #25509 Fix Windows running thread resume path normalization @etraut-openai
- #25135 Populate workspace kind on Codex turn events @knittel-openai
- #24622 Switch runtime to cloud config bundle @joeflorencio-openai
- #25938 fix: update image generation test helper rename @joeflorencio-openai
- #25911 core: stop passing legacy SandboxPolicy to guardian reviews @bolinfest
- #25668 Split cloud config bundle service modules @joeflorencio-openai
- #25890 [codex] Keep hosted tools visible in code-only mode @aibrahim-oai
- #25867 Add remote request permissions integration coverage @jif-oai
- #25943 config: remove dead profile sandbox fallback @bolinfest
- #25948 Revert "Use environment secrets for Azure signing" @shijie-oai
- #25923 Expose standalone image generation in code mode @won-openai
- #25906 [codex] Publish Python runtime wheels with Python SDK releases @aibrahim-oai
- #25953 feat: add skills extension scaffold @jif-oai
- #25915 [codex] Fix Windows BuildBuddy Bazel wrapper execution @anp-oai
- #25926 config: express implicit sandbox defaults as permission profiles @bolinfest
- #25959 feat: add extension turn-input contributors @jif-oai
- #25963 Allow EDU accounts to fetch cloud config bundles @joeflorencio-openai
- #25785 feat(app-server): add remote control client management RPCs @apanasenko-oai
- #25988 revert: publish release symbol artifacts @shijie-oai
- #26114 feat: default hide_spawn_agent_metadata to true @jif-oai
- #26122 chore: extract context fragments into dedicated crate @jif-oai
- #26144 Reject MAv2 close_agent self-targets @jif-oai
- #26106 skills: resolve per-turn catalogs from turn input context @jif-oai
- #26155 fix: serialize goal progress accounting @jif-oai
- #26156 chore: mechanical rename @jif-oai
- #26167 Implement v1 skills extension prompt injection @jif-oai
- #26176 fix: main @jif-oai
- #25949 [codex] Restore setup helper UAC manifest @iceweasel-oai




## rust-v0.136.0 — 2026-06-01

## New Features

- TUI markdown now keeps web links clickable with OSC 8 metadata, and cramped tables switch to readable key/value records without losing link targets. (#24472, #24636, #24825)
- Sessions can now be archived from the TUI with `/archive` or from the CLI with `codex archive` / `codex unarchive`; archived sessions are protected from resume/fork until restored. (#25027, #25021)
- App-server integrations can resume a thread with its initial turns page, see richer MCP server status, and launch stdio mode with `codex app-server --stdio`. (#23534, #24698, #24940)
- Remote execution setup now supports `CODEX_API_KEY` registration for approved OpenAI hosts, while remote-control websockets use short-lived server tokens instead of ChatGPT access tokens. (#24666, #24141)
- Windows admins get an alpha `codex sandbox setup --elevated` provisioning path, plus requirements support for allowed Windows sandbox implementations. (#24831, #23766)
- A feature-gated standalone image generation extension can run through the native Codex image artifact completion pipeline. (#24723, #24972)

## Bug Fixes

- ChatGPT auth refreshes tokens before the five-minute expiry window and shows a relogin-required path for reused refresh tokens instead of collapsing into a generic cloud error. (#23546, #24830)
- Command-safety hardening prevents `/diff` from running repository-provided Git helpers/hooks, avoids PowerShell parser execution on non-Windows hosts, and rejects browser-origin exec-server websocket handshakes. (#24954, #24946, #24947)
- Sandboxed commands clean up more reliably after interruptions or denied Windows network attempts, and `deny` read rules stay enforced for safe-command and approval-bypass paths. (#22729, #19880, #23943)
- Resumed TUI sessions seed prompt history from the session transcript, multiline hook output renders as separate rows, and Vim normal-mode editing behaves correctly. (#24298, #24965, #25022)
- App-server filesystem watchers debounce later batches correctly, and standalone web search calls now show and restore completed search activity. (#24716, #24693)
- Bedrock auth now falls back to `AWS_REGION` / `AWS_DEFAULT_REGION`, and unsupported Bedrock GPT service tiers are no longer advertised or sent. (#25171, #25318)

## Documentation

- Python SDK beta docs and package metadata now present the standard `pip install openai-codex` path, refreshed quickstarts, API reference, FAQ, and examples. (#24836, #24866, #24868, #24870)
- Python SDK examples and docs now use the public `CodexConfig` name for configuring `Codex` / `AsyncCodex`. (#24800)
- The bundled OpenAI Docs skill was updated with current Codex manual routing and a cached manual fetch helper. (#24914)
- Built-in tool schema descriptions now clarify defaults, optional fields, bounds, and enums across shell, Code Mode, MCP, image, goal, plan, multi-agent, and related tools. (#24794)
- App-server and exec-server docs now cover API-key remote registration, `--stdio`, runtime extra skill roots, and remote-control server-token behavior. (#24666, #24940, #24977, #24141)

## Chores

- Python SDK releases can now be staged and published independently from runtime releases using `python-v*` tags while preserving the reviewed runtime dependency pin. (#24828, #24872)
- Updated MCP dependencies to `rmcp` 1.7.0 and refreshed compatibility code. (#24763)
- Refreshed Amazon Bedrock catalog metadata, including GPT-5.5, removal of unsupported OSS entries, and default-tier-only GPT model behavior. (#24701, #24960, #25318)
- Removed the stale app-server debug-client pieces and cleaned up the workspace after deletion. (#25063, #25064, #25065, #25066, #25067, #25068, #25069, #25070, #25075)
- Trimmed CI/build maintenance by moving Bazel Windows jobs to Codex runners, removing the libubsan workaround, and reverting the startup benchmark that broke musl builders. (#24952, #24782, #24937)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.135.0...rust-v0.136.0

- #22729 fix(linux-sandbox): preserve shell cleanup on interruption @viyatb-oai
- #24472 feat(tui): add OSC 8 web links to rich content @fcoury-oai
- #24636 feat(tui): render cramped markdown tables as key-value records [2 of 2] @fcoury-oai
- #24666 Allow API-key auth for remote exec-server registration @sdcoffey
- #24763 Update rmcp to 1.7.0 @anp-oai
- #24825 [codex] Fix hyperlink-aware key-value table rendering @sayan-oai
- #24800 [codex] Rename Python SDK AppServerConfig to CodexConfig @aibrahim-oai
- #24819 [codex] Remove redundant SQLite dynamic tool storage @sayan-oai
- #24828 [codex] Add independent beta release for the Python SDK @aibrahim-oai
- #24836 [codex] Prepare Python SDK beta documentation and package metadata @aibrahim-oai
- #24830 Treat refresh_token_reused 400s as relogin-required @alexsong-oai
- #24866 [codex] Simplify Python SDK install guidance @aibrahim-oai
- #24868 [codex] Remove Python SDK language classifiers @aibrahim-oai
- #24870 [codex] Remove Python SDK beta warning note @aibrahim-oai
- #24872 [codex] Stage Python SDK beta versions from release tags @aibrahim-oai
- #24758 Move memories root setup out of core config @jif-oai
- #24891 Stabilize Guardian client cache key handling @jif-oai
- #24892 Export Guardian prompt cache key helper @jif-oai
- #24893 Add Guardian review prompt cache key @jif-oai
- #24894 Assert Guardian prompt cache key reuse @jif-oai
- #24895 Thread Guardian cache key through session @jif-oai
- #24803 Use stable Guardian prompt cache keys @jif-oai
- #24902 [codex] Fix Guardian argument comment lint @jif-oai
- #24898 Fix memories namespace for Responses API tools @jif-oai
- #24897 Add Guardian review metrics @jif-oai
- #23546 [codex-cli] Refresh near-expiry ChatGPT access tokens before requests @cooper-oai
- #24915 Add thread start contributor facts @jif-oai
- #24916 Add turn error lifecycle contributor @jif-oai
- #24865 [codex] Store pending response items directly @pakrym-oai
- #24914 [codex] Update OpenAI Docs skill @vb-openai
- #24651 Add app-server startup benchmark crate @anp-oai
- #24925 Gate goal tools by thread eligibility @jif-oai
- #24782 Remove libubsan CI workaround @anp-oai
- #24813 extension-api: add TurnItemEmitter to tool calls @sayan-oai
- #23534 feat(app-server): include turns page on thread resume @btraut-openai
- #24698 Expose MCP server info as part of server status @gpeal
- #24903 Reap stale multi-agent slots @jif-oai
- #24936 Fix extension turn item emitter test event ordering @bolinfest
- #24700 [codex] Support ui visibility meta for tools @gpeal
- #24701 chore: add GPT-5.5 to the Amazon Bedrock catalog @celia-oai
- #23363 TUI: Unified mentions tweaks + polish mentions rendering @canvrno-oai
- #24937 Revert "Add app-server startup benchmark crate" @anp-oai
- #24928 Wire task completion into thread-idle lifecycle @jif-oai
- #24723 Add feature-gated standalone image generation extension @won-openai
- #24952 Move Bazel Windows jobs onto codex-runners @anp-oai
- #24940 Add `codex app-server --stdio` alias @anp-oai
- #24954 fix(tui): prevent repository-configured code execution in /diff @fcoury-oai
- #24949 [codex] Handle PowerShell UTF-8 setup failures @iceweasel-oai
- #24960 [codex] Remove Bedrock OSS models from catalog @celia-oai
- #23768 runtime: prepend zsh fork bin dir to PATH @bolinfest
- #19880 fix: cancel Windows sandbox on network denial @viyatb-oai
- #24947 fix(exec-server): reject websocket requests with Origin headers @viyatb-oai
- #24653 [codex] Add user input client ids @alexi-openai
- #23924 Surface filesystem permission profiles in prompt context @bolinfest
- #24108 windows-sandbox: pass workspace roots to runner @bolinfest
- #24974 windows-sandbox: fix capture cancellation test roots @bolinfest
- #24962 Tighten hook output event schemas @abhinav-oai
- #24141 feat(app-server): migrate remote control to server tokens @apanasenko-oai
- #24970 fix(config): use deny for Unix socket permissions @viyatb-oai
- #24946 [codex] Avoid PowerShell safety parsing off Windows @adrian-openai
- #24977 Add runtime extra skill roots API @xl-openai
- #24298 Seed prompt history from resumed messages @etraut-openai
- #23943 fix: preserve deny-read sandboxing for safe commands @bolinfest
- #24716 Fix fs/watch debounce batching @etraut-openai
- #24918 Use internal model context fragments for goal steering @jif-oai
- #24924 Use inject_if_running for active goal steering @jif-oai
- #25063 Drop the stale debug-client manifest @jif-oai
- #25064 Remove the generated debug-client README @jif-oai
- #25065 Delete debug-client app-server process plumbing @jif-oai
- #25066 Retire debug-client interactive command parsing @jif-oai
- #25067 Remove the debug-client CLI entrypoint @jif-oai
- #25068 Delete debug-client JSONL output helper @jif-oai
- #25069 Remove debug-client server event reader @jif-oai
- #25070 Drop debug-client prompt state tracking @jif-oai
- #25075 fix: main @jif-oai
- #24794 [codex] Improve built-in tool schema docs @jif-oai
- #25095 Handle goal usage limits from turn errors @jif-oai
- #25106 Remove stale rollout TODO tests @jif-oai
- #24965 Render multiline hook output in TUI @abhinav-oai
- #25031 [codex] Add model tool mode selector @aibrahim-oai
- #24693 Show activity for standalone web search calls @sayan-oai
- #25110 Move config document helpers into their own module @jif-oai
- #25013 feat: Add focused diagnostics for MCP HTTP send failures @xl-openai
- #24964 [codex] Wait for MCP readiness in core integration tests @anp-oai
- #24972 Route extension image generation through the native image completion pipeline @won-openai
- #24831 Add Windows sandbox provisioning setup command @iceweasel-oai
- #25017 Align TUI permissions labels with app @etraut-openai
- #25027 Add `/archive` slash command @etraut-openai
- #25035 Use session wording in `/rename` confirmation @etraut-openai
- #24161 Add subagent lineage metadata for responsesapi @owenlin0
- #25116 [exec-server] Kill dropped filesystem helpers @erichoracek
- #24180 code-mode: introduce durable session interface @cconger
- #23165 thread-store: store permission profiles @bolinfest
- #25131 [codex] Require model for standalone web search @sayan-oai
- #25134 ci: use issue triage environment for issue workflows @etraut-openai
- #25118 exec-server: preserve fs helper CoreFoundation env @starr-openai
- #25022 [codex] Fix Vim normal mode editing @jinghanx88
- #25161 Recommend Bazel VSCode extension. @anp-oai
- #24996 Filter plugin install suggestions by installed apps @nm-openai
- #23766 Constrain Windows sandbox requirements @abhinav-oai
- #25172 [codex] Update remote connector suggestions @ericning-o
- #25171 fix: Bedrock API key region fallback @celia-oai
- #24541 feat(config) experimental_request_user_input toggle @dylan-hurd-oai
- #25021 Add thread archive CLI commands @etraut-openai
- #25267 Rename multi-agent v2 assignment tool @jif-oai
- #25318 fix: Limit Bedrock GPT models to default service tier @owenlin0
- #25381 [codex] Avoid forced directory refresh during plugin install auth checks @xl-openai




## rust-v0.135.0 — 2026-05-28

## New Features
- `codex doctor` now reports richer environment, Git, terminal, app-server, and thread inventory diagnostics for support cases. (#24261, #24311, #24305)
- `/status` shows remote connection details and server version when the TUI is connected over a remote transport. (#24420)
- Vim mode gained text-object editing, improved word/line-end behavior, and a configurable interrupt-turn binding. (#24382, #24380, #24766)
- `/permissions` now understands named permission profiles and displays configured custom profiles. (#21559)
- Packaged Codex builds can discover and use the bundled patched zsh helper across supported macOS and Linux targets. (#23756, #24171)
- The Python SDK now exposes friendly `Sandbox` presets for thread and turn APIs. (#24772)
- `install.sh`/`install.ps1` supports a non-interactive installation mode when `CODEX_NON_INTERACTIVE=1` is set. (#21567)

## Bug Fixes
- Markdown tables and multiline lists render more readably in the TUI, with better column sizing and app-style table formatting. (#24489, #24346, #24351)
- TUI output is more stable on macOS and Zellij, avoiding stderr/composer corruption and raw-output overlap. (#24459, #24479, #24593)
- Slash-command completion now preserves existing draft text for commands that accept inline arguments. (#23950)
- Older tmux/iTerm control-mode sessions no longer lose normal `Ctrl-C` handling from unsupported keyboard enhancement setup. (#24371)
- App mentions now exclude inaccessible or disabled apps instead of offering unusable `$` suggestions. (#24625)
- Resume flows now include non-interactive exec sessions when requested and honor cwd overrides for idle cached threads. (#24503, #24528)

## Documentation
- Clarified image-viewing tool detail behavior and removed stale TUI composer documentation references. (#23949, #24641)
- Updated Python SDK docs, examples, and notebook content to use the new sandbox preset API. (#24772)

## Chores
- Updated Rust toolchain pins and SQLx/SQLite dependencies. (#24684, #24728)
- Moved memory runtime state into a dedicated SQLite database. (#24591)
- Removed remaining legacy config-profile consumers and routed more TUI config/plugin state through app-server-owned APIs. (#24076, #24254, #24255, #24265, #24266, #24257)
- Centralized Responses retry handling and MCP tool naming logic to reduce duplicated internal plumbing. (#24131, #21576)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.134.0...rust-v0.135.0

- #24164 fix(remote-control): cap reconnect backoff @apanasenko-oai
- #23756 package: include zsh fork in Codex package @bolinfest
- #23757 Default function tools into tool hooks @abhinav-oai
- #24171 package: add x64 macOS codex-zsh artifact @bolinfest
- #24159 code-mode: merge stored values by key @cconger
- #23983 fix: plugin bundle archive handling for upload and install @xl-openai
- #24261 feat(doctor): add environment diagnostics @fcoury-oai
- #24311 Report app-server version in codex doctor @etraut-openai
- #24314 tui: label compact rate-limit percentages @etraut-openai
- #24420 Show remote connection details in /status @etraut-openai
- #24317 Respect hook trust bypass during TUI startup @etraut-openai
- #24254 TUI config cleanup: oss_provider @etraut-openai
- #24255 TUI config cleanup: trusted projects @etraut-openai
- #24265 TUI config cleanup: MCP inventory @etraut-openai
- #24305 Add doctor thread inventory audit @etraut-openai
- #24346 fix(tui): improve markdown table column allocation @fcoury-oai
- #24351 fix(tui): improve multiline markdown list readability @fcoury-oai
- #24459 fix(tui): prevent macos stderr from corrupting composer @fcoury-oai
- #24479 fix(process-hardening): preserve macos malloc diagnostics @fcoury-oai
- #24474 Log rollout writer OS errors @etraut-openai
- #24076 chore: stop consuming legacy config profiles @jif-oai
- #24131 centralize Responses retry policy @rhan-oai
- #23858 [wip] goal shift @jif-oai
- #24555 chore: drop orphaned codex memories MCP crate @jif-oai
- #24558 chore: move memory prompt builder into extension @jif-oai
- #24562 Add ad-hoc memory note tool @jif-oai
- #24567 Wire metrics client into memories extension @jif-oai
- #24588 fix: drop flake @jif-oai
- #24583 Add memory tool call metrics to memories extension @jif-oai
- #24586 Wire app-server extension event sink @jif-oai
- #24532 Use thread config for TUI MCP inventory @etraut-openai
- #24105 [codex] Make active turn task singular @pakrym-oai
- #21576 Move MCP tool naming mode into manager @pakrym-oai
- #24503 tui: include exec sessions in resume list @etraut-openai
- #24600 feat: gate dedicated memories tools in config @jif-oai
- #21559 tui: add named permission profile picker @viyatb-oai
- #24608 feat: add manual and remote_v2 tags to compaction metric @jif-oai
- #24611 test: clean up apply_patch allow-session artifact @jif-oai
- #24609 Remove reserved namespaces dedup @pakrym-oai
- #23964 Move slash input logic out of chat composer @canvrno-oai
- #24615 Add goal extension telemetry parity @jif-oai
- #24371 fix(tui): avoid modifyOtherKeys for unknown tmux formats @fcoury-oai
- #24626 fix: restore goal accounting after thread resume @jif-oai
- #24591 Move memory state to a dedicated SQLite DB @jif-oai
- #23823 standalone websearch extension @sayan-oai
- #24593 fix(tui): keep raw output above composer in zellij @fcoury-oai
- #24625 tui: keep inaccessible apps out of mentions @canvrno-oai
- #24154 Add experimental turn additional context @pakrym-oai
- #24473 fix(remote-control): surface websocket task stalls @apanasenko-oai
- #24528 Respect resume cwd overrides for idle cached threads @etraut-openai
- #24160 Add forked_from_thread_id turn metadata @owenlin0
- #24646 make direct only allowed caller for standalone websearch @sayan-oai
- #23949 Clarify view_image tool description @fjord-oai
- #24266 TUI config cleanup: plugin mentions @etraut-openai
- #24320 Avoid repeated marketplace upgrades for alternate layouts @etraut-openai
- #23813 windows-sandbox: remove SandboxPolicy runner plumbing @bolinfest
- #24652 [codex] remove plain image wrapper spans @pakrym-oai
- #24623 Attach Windows sandbox log to feedback reports @iceweasel-oai
- #24644 Restore legacy image detail values @rhan-oai
- #24655 [codex-analytics] add grouped session id to runtime events @marksteinbrick-oai
- #24658 [codex] Remove obsolete goal continuation turn marker @pakrym-oai
- #24660 fix: dont compact standalone websearch schema @sayan-oai
- #24667 fix(core): instrument stalled tool-listing handoff @apanasenko-oai
- #24684 Uprev Rust toolchain pins to 1.95.0 @anp-oai
- #21567 fix: add noninteractive install script mode @efrazer-oai
- #24707 Allow runtime enablement for remote plugins @xl-openai
- #24714 fix(auto-review) skip legacy notify for auto review threads @dylan-hurd-oai
- #24690 Revert "Add Bedrock Mantle GovCloud region (#23860)" @celia-oai
- #24628 feat: handle goal usage limits in goal extension @jif-oai
- #24746 Fix guardian review test user input @jif-oai
- #24744 feat: add thread idle lifecycle hook @jif-oai
- #24751 Drop startup context when truncating forked rollouts @jif-oai
- #24257 TUI config cleanup: plugin marketplace @etraut-openai
- #24380 fix(tui): complete vim word-end and line-end behavior @fcoury-oai
- #24728 Bump SQLx to pick up newer bundled SQLite @jif-oai
- #24637 fix: run standalone updates noninteractively @efrazer-oai
- #24778 make vercel webhook url an env secret @sayan-oai
- #23950 fix: Preserve draft text when completing argument-taking slash commands @canvrno-oai
- #24641 [codex] Remove stale composer narrative doc references @canvrno-oai
- #24368 [codex] add compaction metadata to turn headers @ningyi-oai
- #24772 [codex] Add friendly Python SDK sandbox presets @aibrahim-oai
- #24382 feat(tui): add vim text object bindings @fcoury-oai
- #24766 feat(tui): make turn interruption keybind configurable @fcoury-oai
- #24489 feat(tui): render markdown tables in app style [1 of 2] @fcoury-oai
- #24713 chore: enable namespace tools for Bedrock @celia-oai




## rust-v0.134.0 — 2026-05-26

## New Features
- Added search across local conversation history, including case-insensitive content matches with result previews. (#23519, #23921)
- Made `--profile` the primary profile selector across CLI, TUI permissions, and sandbox flows, with legacy profile configs rejected through migration guidance. (#23708, #23883, #23890, #24051, #24055, #24059, #24067, #24110)
- Improved MCP setup with per-server environment targeting and OAuth options for streamable HTTP servers. (#23583, #24120)
- Made connector tool schemas more reliable by preserving local `$ref`/`$defs` structures and compacting oversized schemas before exposure. (#23357, #23904)
- Let read-only MCP tools run concurrently when they advertise `readOnlyHint`. (#23750)
- Added richer extension and hook context, including conversation history for extension tools and subagent identity in hook inputs. (#22882, #23963)

## Bug Fixes
- Improved remote reliability by reconnecting stale exec-server websocket clients, retrying remote control immediately after auth recovery, and retrying remote compaction v2 streams. (#23867, #23775, #23951)
- Fixed Windows TUI rendering corruption by restoring virtual terminal mode before drawing. (#24082)
- Displayed workspace-specific usage-limit messages for credit and spend-cap failures. (#24114)
- Allowed plugin skills to reuse shared plugin-level icon assets. (#23776)
- Preserved active permission profile metadata when syncing auto-review runtime settings. (#23956)
- Ensured Node-based tools honor Codex’s managed network proxy environment. (#23905)

## Documentation
- Documented the curl and PowerShell installer paths in the README. (#24106)
- Updated developer docs to prefer `just test` over direct `cargo test` for repo-local test runs. (#23910)
- Added profile migration documentation links to relevant config errors. (#23879)

## Chores
- Simplified release packaging around canonical native artifacts, reusable DotSlash fetching, and a new macOS x64 zsh artifact. (#23833, #23836, #24129, #24165)
- Added release-build support for Codex-produced V8 artifacts. (#23934)
- Added image re-encoding benchmarks and connector-style JSON schema policy fixtures. (#23935, #24152)
- Improved tracing and analytics for websocket requests, turn starts, and remote compaction v2. (#23581, #23980, #24146)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.133.0...rust-v0.134.0

- #23581 Trace logical websocket request after untraced warmup @jif-oai
- #23718 [codex] Steer budget-limited goal extension turns @jif-oai
- #23861 fix: cargo lock @jif-oai
- #23728 feat: retain remote compaction truncation parity in v2 @jif-oai
- #23870 Make tool executor specs mandatory @jif-oai
- #23882 [codex] Stabilize subagent start hook test @jif-oai
- #23876 refactor: centralize tool exposure planning @jif-oai
- #23879 chore: link doc in profile error messages @jif-oai
- #23883 cli: rename profile v2 flag to --profile @jif-oai
- #23835 docs: add description to codex-cli/package.json @bolinfest
- #23583 Route MCP servers through explicit environments @starr-openai
- #23886 cli: remove legacy profile v1 plumbing @jif-oai
- #23708 tui: plumb permission profile selection @viyatb-oai
- #23833 packaging: move rg manifest out of npm bin @bolinfest
- #23796 Improve `/goal` error messages for ephemeral sessions @etraut-openai
- #23867 Reconnect disconnected exec-server websocket clients with fresh sessions @starr-openai
- #23792 TUI: skip goal replace prompt for completed goals @etraut-openai
- #23519 [codex] Add rollout-backed thread content search @fc-oai
- #22552 Remove plugin hooks feature flag @abhinav-oai
- #23836 npm: remove legacy package artifact synthesis @bolinfest
- #23921 [codex] Make thread search case-insensitive @fc-oai
- #23775 fix(remote-control): retry after auth recovery @apanasenko-oai
- #22882 Add subagent identity to hook inputs @abhinav-oai
- #22915 [3 of 4] tui: route feature and memory toggles through app server @etraut-openai
- #23776 fix: Allow plugin skills to share plugin-level icon assets @xl-openai
- #23860 Add Bedrock Mantle GovCloud region @CHARLESPALEN-OAI
- #23956 Fix auto-review permission profile override @etraut-openai
- #23357 feat: support local refs and defs in tool input schemas @celia-oai
- #23963 Expose conversation history to extension tools @sayan-oai
- #23904 feat: best-effort compact large tool schemas @celia-oai
- #23750 Allow parallel MCP tool calls when annotated readOnly @anp-oai
- #23905 [codex] Enable Node env proxy for managed network proxy @rreichel3-oai
- #23890 mcp: surface profile migration guidance under --profile @jif-oai
- #24051 config: remove legacy profile v1 resolution @jif-oai
- #24055 config: remove legacy profile write paths @jif-oai
- #24057 Avoid config snapshots in live agent subtree traversal @jif-oai
- #24061 otel: drop legacy profile usage telemetry @jif-oai
- #24059 fix: reject legacy profile selectors @jif-oai
- #23934 ci: Use codex produced v8 artifacts for release builds @cconger
- #24099 fix(app-server): fix optional bool annotations @owenlin0
- #23910 Prefer `just test` over `cargo test` in docs @anp-oai
- #23951 retry remote compaction v2 requests @rhan-oai
- #24081 tui: make `codex-tui.log` opt-in @jif-oai
- #24102 cli: infer host sandbox backend @bolinfest
- #24067 app-server: drop legacy profile config surface @jif-oai
- #23736 Add new enterprise requirement gate @adams-oai
- #24117 [codex] Use rolling files for Windows sandbox logs @iceweasel-oai
- #24106 docs: update README.md to mention curl-based installer @bolinfest
- #24082 fix(tui): restore Windows VT before TUI renders @fcoury-oai
- #24110 cli: support --profile for codex sandbox @bolinfest
- #23980 Add trace_id to TurnStartedEvent @mchen-oai
- #24120 Support OAuth options in codex mcp add @mzeng-openai
- #23989 Add typed Images client to codex-api @won-openai
- #24146 [codex-analytics] split compaction v2 analytics implementation @rhan-oai
- #24129 package: factor DotSlash executable fetching @bolinfest
- #24151 [codex] Use TurnInput for session task input @pakrym-oai
- #23935 [codex] Add image re-encoding benchmarks @anp-oai
- #24152 chore: add JSON schema policy fixture coverage @celia-oai
- #24157 [codex] Remove external client session reset plumbing @pakrym-oai
- #24114 Display workspace usage limit error copy from response header @dhruvgupta-oai
- #24165 release: build macOS x64 zsh artifact @bolinfest




## rust-v0.133.0 — 2026-05-21

## New Features
- Goals are now enabled by default, backed by dedicated storage, and track progress across active turns. (#23300, #23685, #23696, #23732)
- `codex remote-control` now runs like a foreground command, waits for readiness, reports machine status, and keeps explicit daemon-style `start`/`stop` commands. (#22878)
- Permission profiles gained list APIs, inheritance, managed `requirements.toml` support, runtime refresh behavior, and stronger Windows sandbox integration. (#22928, #23412, #22270, #23433, #22931, #23715)
- Plugin discovery is easier to inspect, with marketplace-aware list output, installed versions, visible marketplace roots, and remote collection support. (#23372, #23584, #23727, #23730)
- Extensions can observe more lifecycle events, including subagent start/stop, tool execution, turn metadata, and async approval/turn processing. (#22782, #22873, #23309, #23688, #23690, #23692)

## Bug Fixes
- Fixed TUI startup choosing the wrong working directory when reusing a local app-server socket. (#23538)
- Fixed plan-mode free-form answers so modified Enter keys, like Shift+Enter, no longer submit unexpectedly. (#23536)
- Removed stale background terminal poll events after a process exits. (#23231)
- Preserved raw code-mode exec output unless an explicit output token limit is requested. (#23564)
- Made AGENTS instruction loading more reliable, including local global reads and warnings for invalid UTF-8 instead of silent drops. (#23343, #23232)
- Fixed app-server startup/shutdown races, empty resume/fork paths, plugin upgrade failures, and realtime v1 websocket compatibility. (#23516, #23578, #23400, #23356, #23771)

## Documentation
- Added clearer plugin-creator guidance for updating and reinstalling local personal plugins. (#23542)
- Expanded app-server/API docs and schema coverage around managed permission profile requirements. (#23433, #23555)

## Chores
- Added a canonical Codex package archive pipeline and moved installers, npm packages, DotSlash, and SDK runtimes toward that shared layout. (#23513, #23582, #23586, #23596, #23635, #23636, #23637, #23638, #23786)
- Fixed Linux Python runtime wheel tags so glibc-based systems can install the runtime artifacts. (#21812)
- Improved release and CI reliability with package-builder tests, prebuilt resource packaging, DotSlash zstd handling, platform-sharded Rust tests, and Codex Linux release runners. (#23760, #23759, #23752, #23358, #23761)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.132.0...rust-v0.133.0

- #23343 codex: route global AGENTS reads through LOCAL_FS @starr-openai
- #22380 fix: default unknown tool schemas to empty schemas @celia-oai
- #23309 Add tool lifecycle extension contributor @jif-oai
- #23253 Reduce rust-ci-full Windows nextest timeout flakes @starr-openai
- #22878 Improve `codex remote-control` CLI UX @owenlin0
- #21812 Publish Linux runtime wheels with glibc-compatible tags @aibrahim-oai
- #22709 [codex] Trim unused TurnContextItem fields @pakrym-oai
- #23353 Include plugin id in plugin MCP tool metadata @mzeng-openai
- #22728 [codex] Move pending input into input queue @pakrym-oai
- #23371 fix(tui): warn on unsupported iTerm2 pet versions @fcoury-oai
- #23376 [codex-analytics] preserve user thread source for exec threads @marksteinbrick-oai
- #23360 app-server: use profile ids in v2 permission params @bolinfest
- #23384 [codex] Remove external websocket session resets @pakrym-oai
- #22721 cleanup: Remove skill env var dependency prompting @xl-openai
- #23389 Remove ToolSearch feature toggle @sayan-oai
- #23080 [1 of 7] Add thread settings to UserInput @etraut-openai
- #23081 [2 of 7] Remove UserInputWithTurnContext @etraut-openai
- #23075 [3 of 7] Remove UserTurn @etraut-openai
- #23396 [codex] Extract turn skill and plugin injections @pakrym-oai
- #23356 fix(plugins): keep version upgrades additive @iceweasel-oai
- #22508 [5 of 7] Replace OverrideTurnContext with ThreadSettings @etraut-openai
- #22086 CI: Customize v8 building @cconger
- #23390 Remove explicit connector tool undeferral @sayan-oai
- #22928 core: expose permission profile picker metadata @viyatb-oai
- #23352 Preserve context baselines for full-history agent forks @jif-oai
- #23300 feat: dedicated goal DB @jif-oai
- #22835 Remove ToolsConfig from tool planning @jif-oai
- #22870 Add `body_after_prefix` auto-compact token limit scope @jif-oai
- #23144 Defer v1 multi-agent tools behind tool search @jif-oai
- #23409 [codex] Allow empty turn/start requests @pakrym-oai
- #23388 [codex] Move hook request plumbing into hook runtime @pakrym-oai
- #23405 [codex] Preserve steer input as user input @pakrym-oai
- #22914 [2 of 4] tui: route app and skill enablement through app server @etraut-openai
- #23397 [codex] Make contextual user fragments dyn-renderable @pakrym-oai
- #23475 chore: namespace v1 sub-agent tools @jif-oai
- #23493 Make `deny` canonical for filesystem permission entries @viyatb-oai
- #22929 Harden CLI rate limit window labels @ase-openai
- #22782 Add SubagentStart hook @abhinav-oai
- #23513 build: add Codex package builder @bolinfest
- #23369 Make local environment optional in EnvironmentManager @starr-openai
- #23327 Refactor exec-server websocket pump @starr-openai
- #23536 fix(tui): preserve modified enter in plan questions @fcoury-oai
- #23400 Fix empty rollout path app-server handling @wiltzius-openai
- #23551 Route local-only app-server gating through processors @starr-openai
- #23372 Split plugin install discovery into list and request tools @mzeng-openai
- #23516 fix: serialize unix app-server startup @efrazer-oai
- #22169 [codex] Honor role-defined spawn service tiers @aibrahim-oai
- #23555 Add CUA requirements subsection for locked computer use @adams-oai
- #23538 Fix: TUI starting in wrong CWD @canvrno-oai
- #23526 build: fetch rg for Codex packages @bolinfest
- #23573 Remove unused ARC monitor path @mzeng-openai
- #23576 test: fix multi-agent service tier assertion @bolinfest
- #23541 build: default Codex package target and output @bolinfest
- #23358 Fan out rust-ci-full nextest by platform @starr-openai
- #23593 feat: expose codex-app-server version flag @bolinfest
- #23412 feat: add permission profile list api @viyatb-oai
- #23535 Move plugin and skill warmup into session startup @aibrahim-oai
- #23231 Fix stale background terminal poll events @etraut-openai
- #23564 [codex] Preserve raw code-mode exec output by default @aibrahim-oai
- #23232 Warn on invalid UTF-8 in AGENTS.md files @etraut-openai
- #23584 feat: Add vertical remote plugin collection support @xl-openai
- #23586 build: package prebuilt Codex entrypoints @bolinfest
- #23582 ci: build Codex package archives in release workflow @bolinfest
- #23596 runtime: detect Codex package layout @bolinfest
- #23500 add encryptedcontent to functioncalloutput @sayan-oai
- #23633 Migrate exec-server remote registration to environments @richardopenai
- #23451 Add timeout for remote compaction requests @jif-oai
- #23667 feat: rename 1 @jif-oai
- #23669 feat: rename 3 @jif-oai
- #23668 feat: rename 2 @jif-oai
- #23675 fix: main @jif-oai
- #23685 feat: wire goal extension tools to the dedicated goal store @jif-oai
- #23690 feat: async approval contrib @jif-oai
- #23692 feat: async turn item process @jif-oai
- #23688 feat: expose turn-start metadata to extensions @jif-oai
- #23605 [codex] Hide deferred tools from code mode prompt @pakrym-oai
- #23634 runtime: use install context for bundled bwrap @bolinfest
- #23635 release: publish Codex package archive checksums @bolinfest
- #23592 feat: Add btw alias for side slash command @anp-oai
- #23696 feat: account active goal progress in the goal extension @jif-oai
- #23176 [2 of 2] Start fresh TUI thread in background @etraut-openai
- #23578 fix(app-server): speed up shutdown @fcoury-oai
- #22896 windows-sandbox: add resolved permissions helper @bolinfest
- #23502 Add thread/settings/update app-server API @etraut-openai
- #23507 Sync TUI thread settings through app server @etraut-openai
- #23666 feat: add turn_id and truncation_policy to extension tool calls @jif-oai
- #23636 install: consume Codex package archives @bolinfest
- #23717 [codex] Preserve failed goal accounting flushes @jif-oai
- #23655 add standalone websearch api client @sayan-oai
- #23724 Fix thread settings clippy failure @etraut-openai
- #23637 npm: ship platform packages in Codex package layout @bolinfest
- #23729 fix(config): resolve cloud requirements deny-read globs @viyatb-oai
- #23638 dotslash: publish Codex entrypoints from package archives @bolinfest
- #22918 windows-sandbox: send permission profiles to elevated runner @bolinfest
- #23735 windows-sandbox: share bundled helper lookup @bolinfest
- #18868 Add MITM hook config model @evawong-oai
- #22270 feat(permissions): resolve permission profile inheritance @viyatb-oai
- #23719 cli: add strict config to exec-server @bolinfest
- #23542 [skills] Create a personal update flow for plugin creator @caseychow-oai
- #21272 Support compact SessionStart hooks @abhinav-oai
- #20659 Wire MITM hooks into runtime enforcement @evawong-oai
- #23752 release: use DotSlash zstd for package archives @bolinfest
- #22923 windows-sandbox: drive write roots from resolved permissions @bolinfest
- #23761 chore: use Codex Linux runners for Rust releases @bolinfest
- #23759 release: package prebuilt resource binaries @bolinfest
- #23167 windows-sandbox: feed setup from resolved permissions @bolinfest
- #22931 core: refresh active permission profiles at runtime @viyatb-oai
- #22873 Add SubagentStop hook @abhinav-oai
- #23727 feat(plugins): tabulate plugin list output @caseychow-oai
- #23732 Make goals feature on by default and no longer experimental @etraut-openai
- #23537 Honor client-resolved service tier defaults @shijie-oai
- #23771 [codex] Fix realtime v1 websocket compatibility @guinness-oai
- #23764 Remove Windows sandbox resource stamping @iceweasel-oai
- #23730 [codex] List marketplaces considered by plugin discovery @caseychow-oai
- #23760 ci: run Codex package builder tests @bolinfest
- #23737 [codex] Add plugin id to MCP tool call items @mzeng-openai
- #18240 Use named MITM permissions config @evawong-oai
- #23774 [codex] Reject read-only fallback with approvals disabled @viyatb-oai
- #23714 windows-sandbox: add profile-native elevated APIs @bolinfest
- #23433 feat: support managed permission profiles in requirements.toml @viyatb-oai
- #23715 core: pass permission profiles to Windows runner @bolinfest
- #23786 sdk: launch packaged Codex runtimes @bolinfest




## rust-v0.132.0 — 2026-05-20

## New Features
- The Python SDK now supports first-class authentication, including API key login, ChatGPT browser and device-code flows, account inspection, and logout APIs. (#23093)
- Python turn APIs are easier to use for text-only workflows: you can pass a plain string as input, and handle-based runs now return a richer `TurnResult` with collected items, timing, and usage data. (#23151, #23162)
- `codex exec resume` now accepts `--output-schema`, so resumed automations can keep session context while still enforcing structured JSON output. (#23123)
- TUI startup is faster because terminal capability probes are now batched instead of waiting on several serial checks before the first interactive frame. (#23175)
- Remote executor registration can now use standard Codex auth instead of a separate registry credential flow. (#22769)
- App-server turns can preserve requested image fidelity, including original-resolution local images, across user inputs and image-producing tools. (#20693)

## Bug Fixes
- Goal continuations now stop when they hit usage limits or a repeated blocker instead of looping and burning more tokens, and completion responses phrase usage more naturally. (#23094, #22907)
- The session picker is easier to trust: renamed threads now show `name (thread-id)` in resume hints, and pasted text works in the picker search box. (#23234, #23338)
- Multi-session TUI flows are more reliable: in-progress MCP calls stay marked as active during replay, and elicitation replies are sent back to the thread that requested them. (#23236, #23241)
- Remote sessions now keep websocket connections alive and show repo-relative diff paths again instead of `/tmp/...`-prefixed paths. (#23226, #23261)
- Windows installs are more robust: `codex doctor` now detects npm-managed installs correctly, and MSVC release binaries no longer depend on separately installed VC++ runtime DLLs. (#22967, #22905)
- TUI polish fixes include immediate shutdown feedback on exit, hiding the ChatGPT usage link for non-OpenAI providers, and keeping a cleared Fast tier from reappearing after side-thread resume. (#23323, #23127, #23121)

## Documentation
- The Python SDK docs, FAQ, and examples were refreshed around the new auth flow and turn APIs, with clearer setup guidance and simpler text-only examples. (#22941, #23093, #23151, #23162)

## Chores
- Memory summaries are now versioned and rebuilt when the stored format is stale, which should keep long-lived memory context leaner and more predictable. (#23148)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.131.0...rust-v0.132.0

- #20693 Preserve image detail in app-server inputs @fjord-oai
- #22891 tui: pass active permission profiles through app commands @bolinfest
- #22924 app-server-protocol: remove PermissionProfile from API @bolinfest
- #22941 [codex] Refine Python SDK user-facing docs @aibrahim-oai
- #22967 Fix Windows doctor npm root probe @etraut-openai
- #22920 core: set permission profiles from snapshots @bolinfest
- #22939 [codex] Split Python SDK helper logic @aibrahim-oai
- #22907 Improve goal completion usage reporting @etraut-openai
- #23030 test: construct permission profiles directly @bolinfest
- #22769 exec-server: support auth-backed remote executor registration @miz-openai
- #22946 [codex] preserve MCP result meta in McpToolCallItemResult @miaolin-oai
- #23069 multiagent: trim model-visible description, cap to 5 models @sayan-oai
- #22913 [1 of 4] tui: route primary settings writes through app server @etraut-openai
- #23093 sdk/python: add first-class login support @aibrahim-oai
- #23151 [codex] Return TurnResult from Python turn handles @aibrahim-oai
- #23147 Make multi-agent v2 tool namespace configurable @jif-oai
- #23036 test: reduce core sandbox policy test setup @bolinfest
- #23162 [codex] Accept string input for Python turns @aibrahim-oai
- #23226 Add exec-server websocket keepalive @starr-openai
- #23148 Densify and version memory summaries @jif-oai
- #22448 [codex] Add installed-plugin mention API @xli-oai
- #23288 chore: goal ext skeleton @jif-oai
- #23291 Make extension lifecycle hooks async @jif-oai
- #23293 feat: add extension event sink capability @jif-oai
- #23295 chore: isolate thread goal storage behind GoalStore @jif-oai
- #23301 chore: goal resumed metrics @jif-oai
- #23305 chore: make token usage async @jif-oai
- #23306 Emit goal update events from goal extension tools @jif-oai
- #23121 tui: keep cleared Fast tier from reappearing after side-thread resume @etraut-openai
- #23123 Support --output-schema for exec resume @etraut-openai
- #23128 Fix TUI stream cleanup after turn errors @etraut-openai
- #23127 Hide ChatGPT usage link for non-OpenAI status @etraut-openai
- #23175 [1 of 2] Optimize TUI startup terminal probes @etraut-openai
- #22706 [codex] Remove legacy shell output formatting paths @pakrym-oai
- #23332 nit: read prompt @jif-oai
- #22905 windows: link MSVC release binaries with static CRT @iceweasel-oai
- #23323 fix(tui): show shutdown feedback on exit @fcoury-oai
- #23261 Fix remote turn diff display roots @starr-openai
- #22569 Simplify legacy Windows sandbox ACL persistence @iceweasel-oai
- #23273 Upload rust full CI JUnit reports @starr-openai
- #22893 fix: harden plugin creator sharing validation @efrazer-oai
- #23094 goal: pause continuation loops on usage limits and blockers @etraut-openai
- #23234 Clarify resume hints for renamed threads @etraut-openai
- #23241 TUI: route elicitation responses to request thread @etraut-openai
- #23236 TUI: replay in-progress MCP calls as started @etraut-openai
- #23088 goals: keep pause transitions explicit @etraut-openai
- #23338 feat(tui): handle paste in session picker @fcoury-oai
- #23335 feat(app-server): add optional thread_id to experimentalFeature/list @owenlin0




## rust-v0.131.0 — 2026-05-18

## New Features
- The TUI now offers richer session controls and display: data-driven service-tier commands, blended token usage, permissions/approval mode, effective workspace roots, and responsive Markdown tables. (#21745, #21906, #21991, #21669, #21677, #22052, #22612)
- `@` mentions now search files, directories, plugins, and skills in one picker, backed by app-server plugin metadata. (#19068, #22375)
- Plugin workflows gained marketplace CLI commands, version-aware sharing, share checkout, clearer shared-workspace buckets, and default-enabled plugin hooks. (#21396, #22397, #22425, #22435, #22549)
- Remote workflows now support daemon-managed `codex remote-control`, runtime enable/disable APIs, status reads, and registry-backed/configured remote environments. (#20718, #22218, #22562, #22578, #22877, #20667, #21323)
- The Python SDK moved to `openai-codex` / `openai_codex`, with pinned runtime-generated types, concurrent turn routing, approval modes, and integration coverage. (#21778, #21891, #21893, #21896, #21905, #21910, #22014)
- Added `codex doctor` for support-ready diagnostics across runtime, auth, terminal, network, config, and local state. (#22336)

## Bug Fixes
- Fixed several TUI interaction and rendering issues, including URL wrapping, light-mode selection contrast, Shift+Enter in tmux, `/review` MCP startup status, `/side` Esc handling, and network approval history text. (#21760, #21950, #21943, #21624, #22710, #22229)
- Hardened Windows sandbox behavior around deny-read rules, scoped write roots, ineffective firewall policy, and PowerShell edge cases. (#18202, #21479, #22353, #21400, #22643)
- Preserved managed read restrictions during permission escalation and cleaned up workspace-root permission profile resolution. (#15977, #22624, #22683)
- Made app-server and local state startup safer by preserving SQLite data, failing closed when state cannot open, adding recovery paths, and softening optional metadata sync failures. (#21831, #21847, #22580, #22734, #22899)
- Improved Git and auth reliability by using root worktree hooks consistently, ignoring repo hook/fsmonitor config in helper commands, binding local MCP OAuth callbacks, and revoking superseded login tokens. (#21969, #22843, #22652, #20237, #21747)
- Reduced remote and Windows cleanup friction with longer exec-server transport timeouts, quieter `taskkill` cleanup, and non-queued plugin reads. (#21825, #21759, #22058, #22703)

## Documentation
- Clarified that general Codex product docs should not be added to this repo, while app-server API docs remain in scope. (#21772)
- Updated plugin-creator guidance for the simplified local plugin handoff links. (#22240)
- Documented new app-server/API contracts for remote environments and the desktop-owned config namespace. (#21323, #22584)

## Chores
- Improved CI and release reliability across Rust CI, exact PR-head checkout, Windows Bazel sharding, unsigned macOS artifacts, and signed macOS promotion. (#21604, #21628, #21835, #22408, #22559, #22649, #22737, #22788, #22900)
- Split large TUI ChatWidget, history, and composer code into focused modules without intended behavior changes. (#21866, #22269, #22407, #22433, #22518, #22537, #22704, #22581, #22656)
- Continued extracting extension and tool internals, including shared tool contracts plus guardian and memory extension plumbing. (#21736, #21737, #21738, #22138, #22147, #22216, #22258, #22344, #22476, #22480, #22485, #22498)
- Removed obsolete tool paths, feature flags, config gates, and legacy hooks as defaults stabilized. (#21651, #21805, #22173, #22246, #22565, #22711, #22717, #22724, #22730)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.130.0...rust-v0.131.0

- #21550 [codex] make shutdown pending-touch test deterministic @jif-oai
- #21697 Allow string service tiers in config TOML @aibrahim-oai
- #21687 [codex] Enable apply_patch freeform by default @aibrahim-oai
- #19896 Update models.json @github-actions
- #21669 Display blended token count in status line @etraut-openai
- #21677 Show permissions and approval mode in the TUI status line @etraut-openai
- #21757 api: send hyphenated session and thread headers @jif-oai
- #21763 nit: comment @jif-oai
- #21749 codex-otel: validate provider span attributes consistently @bbrown-oai
- #21767 chore: thread tui @jif-oai
- #21443 [sandboxing] Remove Darwin user cache write from Seatbelt network policy @evawong-oai
- #21604 Fix `rust-ci-full` failures due to missing `bwrap` @zanie-oai
- #21628 Use `CARGO_NET_GIT_FETCH_WITH_CLI` in `rust-ci-full` for more reliable git fetches @zanie-oai
- #21745 [codex] Generalize service tier slash commands @aibrahim-oai
- #21772 Clarify docs folder guidance in AGENTS.md @etraut-openai
- #21622 [codex] Address some more GHA hygiene issues @ww-oai
- #21662 feat: Use installation ID in remote enrollments @ddr-oai
- #20667 Load configured environments from CODEX_HOME @starr-openai
- #21776 Update models.json @github-actions
- #21787 Support resource binaries in Python runtime staging @aibrahim-oai
- #21784 Publish Python runtime wheels on release @aibrahim-oai
- #21601 Emit accepted line fingerprint analytics @alexsong-oai
- #21465 Remove ToolName display helper @pakrym-oai
- #20619 [codex] request desktop attestation from app @jiamingz42
- #21810 Revert "Publish Python runtime wheels on release" @aibrahim-oai
- #21651 [codex] Delete function-style apply_patch @pakrym-oai
- #21805 [codex] Remove legacy after tool use hooks @pakrym-oai
- #21616 Enable `--deny-warnings` for `cargo shear` @charliemarsh-oai
- #21497 Using cached connector directory for discoverable tools list @mzeng-openai
- #21835 ci: check out PR head commits in workflows @bolinfest
- #21794 Make environment provider snapshots path-free @starr-openai
- #21831 app-server: support daemon-safe restart handling @euroelessar
- #20293 Support openai library tool @lt-oai
- #21323 [codex] support executor registry remote environments @miz-openai
- #21825 Increase exec-server environment transport timeouts @starr-openai
- #20718 [daemon] Add app-server daemon lifecycle management @euroelessar
- #21840 feat: add Bedrock Mantle client agent header @celia-oai
- #21847 sqlite: no more destructive version bumps @owenlin0
- #21652 Reapply "Move skills watcher to app-server" @pakrym-oai
- #21290 Move file watcher out of core @pakrym-oai
- #21867 feat: Add role-aware plugin share context APIs @xl-openai
- #21875 [codex] compact network context rendering @sayan-oai
- #21778 Route Python SDK turn notifications by ID @aibrahim-oai
- #21906 [codex] Lowercase TUI service tier commands @aibrahim-oai
- #21819 tests: cover sandbox link write behavior @bolinfest
- #21760 fix(tui): preserve wrapped prose beside URLs @fcoury-oai
- #21950 fix(tui): improve light-mode selection contrast @fcoury-oai
- #21755 Improve hooks trust flow in TUI @abhinav-oai
- #21870 Avoid blocking TUI on agent metadata hydration @etraut-openai
- #21866 Split ChatWidget state into focused modules @etraut-openai
- #21991 Persist 'priority' service tier as fast in config @aibrahim-oai
- #21943 fix(tui): preserve Shift+Enter in tmux csi-u panes @fcoury-oai
- #21759 fix(tui): suppress taskkill output for MCP teardown on Windows @fcoury-oai
- #22039 Deduplicate issue digest interactions by user @etraut-openai
- #22052 feat(tui): render responsive Markdown tables in TUI @fcoury-oai
- #20825 Read cached metadata for installed Git plugins @xli-oai
- #21736 extension: add initial typed extension API @jif-oai
- #21737 extension: wire extension registries into sessions @jif-oai
- #21738 extension: move git attribution into an extension @jif-oai
- #22138 refactor: extract executable tool contracts into codex-tool-api @jif-oai
- #22140 feat: drop `CodexExtension` @jif-oai
- #22143 [codex] default unknown contributed tools to mutating @jif-oai
- #22147 feat: wire extension tool bundles into core @jif-oai
- #22163 feat: move extensions tool @jif-oai
- #22113 Add x-codex-ws-stream-request-start-ms @andmis
- #21860 Persist /goal commands in history @etraut-openai
- #22141 [codex] Harden overflow auto-compaction recovery @aibrahim-oai
- #22170 Revert "[codex] Harden overflow auto-compaction recovery" @aibrahim-oai
- #22106 Fix side conversation config inheritance @etraut-openai
- #22045 Improve goal continuation based on feedback @etraut-openai
- #21981 Use goal preview metadata for goal-first threads @etraut-openai
- #21843 app-server: remove TCP websocket listener @euroelessar
- #22173 chore: drop built-in MCPs @jif-oai
- #21954 Fix goal update and add `/goal edit` command in TUI @etraut-openai
- #22110 Make auto-review denial short-circuit use a rolling review window @won-openai
- #21431 [codex-analytics] add turn tool counts to turn events @rhan-oai
- #22154 Add process-scoped SQLite telemetry @jif-oai
- #19068 Unified mentions in TUI @canvrno-oai
- #20305 fix(exec-policy) use is_known_safe_command less @dylan-hurd-oai
- #22058 fix(exec-server): suppress Windows taskkill output @fcoury-oai
- #22178 fix(app-server): thread history redaction for remote clients @owenlin0
- #15977 fix(permissions): preserve managed deny-read during escalation @viyatb-oai
- #21061 feat(connectors): support managed app tool approval requirements @viyatb-oai
- #22188 [elicitation] Advertise new url elicitation capability when auth_elicitation is enabled. @mzeng-openai
- #22192 config: accept `minus` in TUI keymap config @fcoury-oai
- #21853 daemon: refresh updater after validated binary rollout @euroelessar
- #21747 [login] revoke superseded auth tokens on relogin @cooper-oai
- #20147 feat: add network proxy feature flag @viyatb-oai
- #21891 [1/8] Pin Python SDK runtime dependency @aibrahim-oai
- #21893 [2/8] Generate Python SDK types from pinned runtime @aibrahim-oai
- #21895 [3/8] Run Python SDK tests in CI @aibrahim-oai
- #21896 [4/8] Define Python SDK public API surface @aibrahim-oai
- #21905 [5/8] Rename Python SDK package to openai-codex @aibrahim-oai
- #21910 [6/8] Add high-level Python SDK approval mode @aibrahim-oai
- #22014 [7/8] Add Python SDK app-server integration harness @aibrahim-oai
- #22021 [8/8] Add Python SDK Ruff formatting @aibrahim-oai
- #18748 [codex-analytics] emit terminal review events @rhan-oai
- #22159 Add Windows hook command overrides @abhinav-oai
- #22218 Update codex remote-control to start the daemon @owenlin0
- #22180 Stop uploading accepted line fingerprints @alexsong-oai
- #21617 Support multi-environment apply_patch selection @starr-openai
- #22198 Add production startup and TTFT telemetry @mzeng-openai
- #21963 [exec-server] serve websocket listener via HTTP upgrade @euroelessar
- #21946 fix(tui): handle hidden app git directives @fcoury-oai
- #21595 Simplify MCP tool handler plumbing @pakrym-oai
- #22221 feat(skills): default plugin creator to personal share flow @efrazer-oai
- #21861 Apply sandbox context to local view_image reads @starr-openai
- #20527 Support PreToolUse updatedInput rewrites @abhinav-oai
- #22243 [codex] Filter legacy warning messages during compaction @pakrym-oai
- #22254 [codex] Make handlers own parallel tool support @pakrym-oai
- #18202 feat(sandbox): add Windows deny-read parity @viyatb-oai
- #22265 feat: Normalize remote plugin summary identities. @xl-openai
- #22216 feat: guardian as an extension (contributors part) @jif-oai
- #22311 [rollout-trace] Add x-codex-inference-call-id header to inference calls. @cassirer-openai
- #21206 feat(tui): add ambient terminal pets @fcoury-oai
- #22323 fix: uv lock @jif-oai
- #22207 [codex] Tighten unified exec sandbox setup @bookholt-oai
- #22382 tools: remove is_mutating dispatch gating @pakrym-oai
- #22383 chore(config) include_collaboration_mode_instructions @dylan-hurd-oai
- #22377 code-mode: carry nested tool kind through runtime @pakrym-oai
- #22392 test(tui): relax configured pet load timeout @fcoury-oai
- #22343 feat(exec-server): use protobuf relay frames @apanasenko-oai
- #20509 [codex] Remove workspace owner usage nudge gate @richardopenai
- #22256 Refactor namespaced tool spec registration @pakrym-oai
- #22280 code-mode: Add pending-aware code mode execution @cconger
- #22266 core: box multi-agent handler futures @bolinfest
- #22398 [codex] Add search term coverage for tool_search @pakrym-oai
- #22236 Unify thread metadata updates above store @wiltzius-openai
- #22269 Refactor chatwidget state into modules @etraut-openai
- #22381 [codex] Remove tool search bucket limit override @sayan-oai
- #22386 mark Feature::RemoteControl as removed @owenlin0
- #22240 docs(skills): simplify plugin creator deeplink shape @efrazer-oai
- #22397 feat: Expose plugin versions and gate plugin sharing @xl-openai
- #22404 Restore app-server websocket listener with auth guard @etraut-openai
- #22258 feat: route guardian review model selection through providers @celia-oai
- #22268 hooks: use new session IDs instead of thread IDs for hooks, apply parent's session ID to subagents' hooks @eternal-openai
- #20319 Add allow_managed_hooks_only hook requirement @eternal-openai
- #22413 Remove CODEX_RS_SSE_FIXTURE test hook @pakrym-oai
- #22406 tools: infer code-mode namespace descriptions from specs @pakrym-oai
- #22261 Encapsulate tool search entries in handlers @pakrym-oai
- #22425 feat: Split shared workspace plugins by discoverability @xl-openai
- #22414 Add support for UDS in `codex --remote` @etraut-openai
- #22407 Refactor chatwidget input flow into modules @etraut-openai
- #22439 Remove unavailable MCP placeholder tool backfill @sayan-oai
- #21969 Use root repo hooks in linked worktrees @abhinav-oai
- #21768 add --dangerously-bypass-hook-trust CLI flag @abhinav-oai
- #22435 feat: Add plugin share checkout @xl-openai
- #22355 chore: Keep view_image sandbox test in temp dir @jif-oai
- #22344 extension-api: add approval review contributor flow @jif-oai
- #22359 feat: extract shared tool executor interface @jif-oai
- #22369 Refactor extension tools onto shared ToolExecutor @jif-oai
- #22338 [app-server] Gate login issuer override constant @cassirer-openai
- #22437 [codex] isolate plugin/list from config serialization queue @xli-oai
- #22476 feat: add thread lifecycle contributor hooks @jif-oai
- #22479 nit: codeowners @jif-oai
- #22480 feat: add turn lifecycle contributors @jif-oai
- #22482 fix: emit thread stop lifecycle on implicit shutdown @jif-oai
- #22485 feat: add token usage contributor hook @jif-oai
- #22443 Scope macOS signing secrets to release environment @shijie-oai
- #22490 feat: move extension scope ids into ExtensionData @jif-oai
- #22491 Make context contributors async @jif-oai
- #22214 feat(tui): remove Zellij TUI workarounds @fcoury-oai
- #22139 Add service tier overrides to spawned agents @aibrahim-oai
- #22488 feat: add config-change extension contributor @jif-oai
- #22498 feat: memories ext @jif-oai
- #22503 fix: main @jif-oai
- #22347 feat(tui): standardize picker navigation keys @fcoury-oai
- #22500 refactor: split memories extension crate modules @jif-oai
- #22433 Refactor chatwidget protocol flows into modules (phase 3) @etraut-openai
- #22505 fix: prevent fmt from updating Python SDK lockfile @jif-oai
- #22326 [rollout-trace] Add a trace ID to MCP calls. @cassirer-openai
- #20559 config: add strict config parsing @bolinfest
- #22489 Introduce tool exposure for deferred registration @jif-oai
- #22193 fix: drop underscored id headers @jif-oai
- #22246 [codex] Remove unused legacy shell tools @pakrym-oai
- #22520 revert: mark Feature::RemoteControl as removed @owenlin0
- #22513 Revert "Scope macOS signing secrets to release environment" @shijie-oai
- #22514 feat: expose multi-agent v2 as model-only tools @jif-oai
- #22366 Pass Codex product SKU to ChatGPT backend @ericning-o
- #22519 Deprecate TurnContext cwd and resolve_path @pakrym-oai
- #22518 Refactor chatwidget settings surfaces into modules (phase 4) @etraut-openai
- #21479 [codex] Scope Windows sandbox write-root capability SIDs @adrianbravo-oai
- #22353 windows-sandbox: fail elevated setup when firewall policy is ineffective @iceweasel-oai
- #22527 [codex] Reuse Apps MCP path override for plugin-service rollout @adaley-openai
- #22412 chore(config) rm Feature::CodexGitCommit @dylan-hurd-oai
- #22501 chore(config) rm tools.view_image @dylan-hurd-oai
- #22533 fix: prevent codex-backend from stealing originator @owenlin0
- #22408 Shard Bazel Windows tests across jobs @starr-openai
- #22542 Use selected environment cwd for filesystem helpers @pakrym-oai
- #20237 Add callback ids to local MCP OAuth redirects @stevenlee-oai
- #22549 Enable plugin hooks by default @abhinav-oai
- #22375 Use plugin/list to get list of plugins for mentions @canvrno-oai
- #21235 [codex] Fix TUI wrapping for external borrowed slices @canvrno-oai
- #22336 feat(cli): add codex doctor diagnostics @fcoury-oai
- #22543 clean up instructions @sayan-oai
- #21400 Avoid PowerShell profiles in elevated Windows sandbox @iceweasel-oai
- #22528 Make multi_agent_v2 wait_agent timeouts configurable @andmis
- #22529 Spill oversized PreToolUse additionalContext @abhinav-oai
- #22556 feat: namespace in ext @jif-oai
- #22535 Remove resurrected `/collab` slash command @etraut-openai
- #22537 Refactor chatwidget orchestration into modules (phase 5) @etraut-openai
- #22564 [codex] Canonicalize shared workspace plugin IDs @xl-openai
- #22559 Add unsigned macOS release artifacts @shijie-oai
- #22574 Deprecate issue labeler @maxb-openai
- #22555 Remove connector_openai prefix filtering @ericning-o
- #22580 fix: Block appserver startup if state db can't be opened @ddr-oai
- #22565 chore(config) rm experimental_use_freeform_apply_patch @dylan-hurd-oai
- #22562 Improve remote-control daemon UX @owenlin0
- #22578 enable/disable remote control at runtime, not via features @owenlin0
- #22573 Simplify TUI startup test coverage @etraut-openai
- #22594 Relax remote plugin sync gate @xli-oai
- #22587 Defer startup NUX impressions until startup succeeds @etraut-openai
- #22560 feat: make ToolExecutor an async trait @jif-oai
- #22494 Wire turn item contributors into stream output @jif-oai
- #17141 feat: add layered --profile-v2 config files @jif-oai
- #22643 [codex] treat PowerShell stop-parsing forms as unsupported @bookholt-oai
- #22646 Fix abort-path turn extension data plumbing @jif-oai
- #22624 permissions: canonicalize workspace_roots and danger-full-access names @bolinfest
- #22649 Chore: better published unsigned artifacts @shijie-oai
- #22581 tui: split composer attachment and popup state @etraut-openai
- #21396 [codex] add plugin marketplace CLI commands @caseychow-oai
- #22576 tests: avoid ambient temp sandbox roots @starr-openai
- #22652 [codex] Ignore fsmonitor config in Git metadata reads @bookholt-oai
- #22229 fix(tui): render network approval history by target @fcoury-oai
- #22547 Prefer the model list fetched from the backend for SIWC users @jeevnayak
- #22666 [codex] fix plugin CLI active user layer compile @caseychow-oai
- #22575 Support explicit MCP OAuth client IDs @mzeng-openai
- #22512 test: isolate exec review policy config test @bolinfest
- #22572 Fix remote environment test fixtures @starr-openai
- #22563 tests: isolate codex home for live cli @starr-openai
- #18161 [codex] Support multiple forced ChatGPT workspaces @rreichel3-oai
- #22702 make rust-release-prepare use env secret @sayan-oai
- #22703 Unqueue plugin list and read requests @xli-oai
- #22687 Fix Windows sandbox clippy clones @starr-openai
- #22711 chore(features) rm Feature::ApplyPatchFreeform @dylan-hurd-oai
- #22717 chore(config) rm windows_wsl_setup_acknowledged @dylan-hurd-oai
- #22695 Trim TUI legacy core helper usage @etraut-openai
- #21624 Fix /review mode MCP startup render issue @canvrno-oai
- #22684 Remove SSE fixture loaders @pakrym-oai
- #22730 [codex] Group removed feature flags @dylan-hurd-oai
- #22724 [codex] Remove experimental instructions file config @dylan-hurd-oai
- #22237 Add `user_input_requested_during_turn` to MCP turn metadata @mchen-oai
- #22737 ci: support signed macOS release promotion @bolinfest
- #22303 Stabilize compact rollback follow-up test @dylan-hurd-oai
- #22683 permissions: resolve profile identity with constraints @bolinfest
- #22734 tui: recover local state db startup failures @etraut-openai
- #22584 [codex] Add opaque desktop config namespace @guinness-oai
- #22710 Prevent Esc from dismissing or rewinding `/side` @etraut-openai
- #22704 TUI: split history cells into focused modules @etraut-openai
- #22611 app-server: use permission ids and runtime workspace roots @bolinfest
- #22612 tui/exec: show effective workspace roots in summaries @bolinfest
- #22788 Fix signed macOS release promotion follow-up jobs @shijie-oai
- #22647 Reject legacy [profiles] when using profile-v2 @jif-oai
- #22809 [codex] Use compaction_trigger item for remote compaction v2 @jif-oai
- #22636 Simplify tool executor and registry plumbing @jif-oai
- #22820 Remove zombie tools spec module @jif-oai
- #22828 Run compact hooks for remote compaction v2 @jif-oai
- #22841 Move memory prompt injection to app-server extension @jif-oai
- #22789 guardian: use permission profile for review sandbox @bolinfest
- #22656 tui: split remaining composer draft and footer state @etraut-openai
- #22843 Ignore configured hooks in git helpers @bookholt-oai
- #22790 context: remove legacy permissions instructions helper @bolinfest
- #22791 telemetry: tag sandboxes from permission profiles @bolinfest
- #22872 Forward apps MCP product SKU from Codex config @kumquatexpress
- #22582 Workflow updates @viyatb-oai
- #22792 app-server: stop returning thread permission profiles @bolinfest
- #22795 core: construct test permission profiles directly @bolinfest
- #22900 Disable DMG staging for signed macOS promotion @shijie-oai
- #22877 feat(app-server): update remote control APIs for better UX @owenlin0
- #22899 [codex] Soften SQLite metadata sync failures @wiltzius-openai




## rust-v0.130.0 — 2026-05-08

## New Features
- Plugin details now show bundled hooks, and plugin sharing exposes link metadata plus discoverability controls. (#21447, #21495, #21637)
- Added `codex remote-control` as a simpler entrypoint for starting a headless, remotely controllable app-server. (#21424)
- App-server clients can page large threads with unloaded, summary, or full turn item views. (#21566)
- Bedrock auth can now use AWS console-login credentials from `aws login` profiles. (#21623)
- `view_image` can resolve files through the selected environment for multi-environment sessions. (#21143)

## Bug Fixes
- Live app-server threads now pick up config changes without requiring a restart. (#21187)
- Turn diffs stay accurate across apply-patch operations, including partial failures that still mutated files. (#21180, #21518)
- Thread summaries, renames, resume, and fork paths work better through `ThreadStore`, including threads without local rollout paths. (#21264, #21265, #21266)
- Remote compaction now emits `response.processed` for v2 streams and avoids sending `service_tier` on API-key compact requests. (#21642, #21676)
- Windows sandbox setup now grants sandbox users access to the desktop runtime binary cache. (#21564)
- Removed stale “research preview” wording from the `codex exec` startup banner. (#21683)

## Documentation
- Fixed issue templates so CLI reports keep the intended guidance, labels apply correctly, and feature requests link to the right contributing docs. (#21685, #21686, #21688)
- Updated install and tooling docs to consistently use `cargo install --locked`. (#21592)

## Chores
- Added a faster Cargo profiling build profile and disabled empty doctest targets to speed up Rust development loops. (#21574, #21584)
- Hardened dependency and CI hygiene with fully qualified GitHub Action pins, a Dependabot cooldown, and a `cargo-shear` upgrade. (#21436, #21547, #21599)
- Simplified internal surfaces by removing unused device-key APIs, extra skills roots, the remote thread-store implementation, and string-keyed MCP tool maps. (#21487, #21485, #21596, #21454)
- Added configurable OpenTelemetry trace metadata and richer review/feedback analytics for better debugging and triage. (#21556, #18747, #21434, #21498)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.129.0...rust-v0.130.0

- #21494 [codex] fix PluginListParams test initializer @xli-oai
- #21447 Show plugin hooks in plugin details @abhinav-oai
- #21356 feat: make built-in MCPs first-class runtime servers @jif-oai
- #21180 Make turn diff tracking operation backed @jif-oai
- #21498 [codex] add account id to feedback uploads @pakrym-oai
- #21487 device-key: clean up unused crate @euroelessar
- #21518 fix: preserve exact turn diffs after partial apply_patch failures @jif-oai
- #18747 [codex-analytics] add tool review event schema @rhan-oai
- #21495 feat: Expose plugin share metadata in shareContext @xl-openai
- #21454 [codex] Remove string-keyed MCP tool maps @pakrym-oai
- #21424 add top-level remote-control command @owenlin0
- #21187 app-server: refresh live threads from latest config snapshot @jif-oai
- #21461 [codex] Move tool specs onto handlers @pakrym-oai
- #21547 Upgrade `cargo-shear` to 1.11.2 @charliemarsh-oai
- #21264 Move thread name edits to ThreadStore @wiltzius-openai
- #21266 [codex] Fix pathless thread summaries @wiltzius-openai
- #21265 Route ThreadManager rollout path reads through thread store @wiltzius-openai
- #21564 Grant sandbox users access to desktop runtime bin @iceweasel-oai
- #21582 Use descriptive names for Cargo profile options @zanie-oai
- #21574 Add a Cargo build profile for benchmarking @zanie-oai
- #21436 [codex] Fully qualify hash-pins in GitHub Actions @ww-oai
- #21592 Ensure all mentions of cargo-install are --locked @gankra-oai
- #21584 Disable empty Cargo test targets @charliemarsh-oai
- #21566 feat(app-server, threadstore): Thread pagination APIs and ThreadStore contract @owenlin0
- #21556 codex-otel: add configurable trace metadata @bbrown-oai
- #21599 [codex] Apply a Dependabot cooldown of 7 days @ww-oai
- #21602 Use `--locked` in cargo build and lint invocations @zanie-oai
- #20664 Add stdio exec-server client transport @starr-openai
- #21596 [codex] Remove remote thread store implementation @wiltzius-openai
- #20665 Make environment providers own default selection @starr-openai
- #21143 Route view_image through selected environments @starr-openai
- #20666 Add CODEX_HOME environments TOML provider @starr-openai
- #21642 Send response.processed after remote compaction v2 @pakrym-oai
- #21646 Revert "Use `--locked` in cargo build and lint invocations" @pakrym-oai
- #21434 [codex-analytics] plumb protocol-native review timing @rhan-oai
- #21485 Remove skills list extra roots @xli-oai
- #21623 feat: enable AWS login credentials for Bedrock auth @celia-oai
- #21637 feat: Update plugin share settings with discoverability @xl-openai
- #21685 Fix duplicate CLI issue template description @etraut-openai
- #21686 Fix issue template labels @etraut-openai
- #21688 Fix feature request Contributing link @etraut-openai
- #21683 Remove exec research preview banner wording @etraut-openai
- #21676 Omit service_tier from remote /responses/compact requests under API auth @aibrahim-oai




## rust-v0.129.0 — 2026-05-07

## New Features
- The TUI now supports modal Vim editing in the composer, including `/vim`, default-mode config, and Vim-specific keymap contexts. (#18595)
- TUI workflows are easier to resume and copy from with a redesigned resume/fork picker, raw scrollback mode, `/ide` context injection, and workspace-aware `/diff`. (#20065, #20819, #20294, #21001)
- The status line can show theme-aware colors plus optional PR and branch-change summaries, and `/keymap debug` helps inspect terminal key events. (#19631, #20892, #20794)
- Plugin management now supports workspace sharing, share access controls, source filtering, local share path tracking, marketplace removal/upgrades, remote bundle sync, and admin-disabled status handling. (#20278, #21124, #21419, #20560, #19843, #20478, #20268, #20298)
- Hooks can be browsed and toggled from `/hooks`, can run before/after compaction, and can add `PreToolUse` context; Codex Apps auth and eligible MCP elicitations now surface through TUI/Guardian flows. (#19882, #19905, #20692, #19193, #19431)
- Experimental goals are now discoverable, stay paused across resume unless the user opts back in, and show clearer validation and multi-day duration output. (#20083, #20790, #20746, #20558)

## Bug Fixes
- `/copy` works better in tmux, Alt+Enter and modified Delete/Backspace keys behave correctly, and Windows typing/paste latency was reduced. (#20207, #20535, #21058, #18914)
- Large paste placeholders and Ctrl+C-stashed drafts now survive clear/editor workflows without corrupting draft history. (#21091, #21190, #21351, #21397)
- TUI startup and accessibility were tightened by bounding terminal probes, clearing the first inline viewport render, and honoring `animations = false` for live rows. (#20654, #21450, #20564)
- Linux sandbox startup is more reliable across older `bwrap`, slow mount probes, symlink-protected paths, and shared `/tmp` setups. (#20628, #20111, #21127, #21234)
- Windows sandbox and exec policy now handle named pipes, ConPTY teardown, PowerShell-wrapped allow rules, worktree `safe.directory`, and unsafe Git options more reliably. (#20270, #20685, #20336, #21409, #21275)
- Fixed custom CA login behind TLS-inspecting proxies, Bedrock runtime endpoint reporting, dangerous project config keys, heredoc redirect approval matching, and unbounded MCP/hook output growth. (#20676, #20275, #20098, #20113, #20260, #21069)

## Documentation
- Updated the embedded OpenAI Docs sample skill so API-key setup guidance stays aligned with other docs variants. (#21263)
- Documented how generated git commit attribution is gated by `codex_git_commit` and configured in `config.toml`. (#21379)
- Removed local-only planning/spec docs and redirected config docs toward the maintained external documentation surface. (#20896)

## Chores
- Linux releases now build, publish, bundle, and verify a standalone `bwrap` fallback for npm and DotSlash installs. (#21255, #21256, #21257, #21312, #21285)
- Vendored Bubblewrap was updated to 0.11.2, including upstream security changes around setuid support. (#21389)
- Windows Bazel CI now uses faster cross-compilation for tests, clippy, and release-build checks, and Bazel now runs sharded Rust integration tests. (#20585, #20701, #21057)
- App-server and protocol internals were split and slimmed down, including transport extraction, protocol module decomposition, thread/message history moves, and tool-handler cleanup. (#20324, #20325, #20348, #20545, #21251, #21278, #21395)
- Analytics and diagnostics coverage expanded for tool lifecycles, goals, plugin skills, thread sources, service tiers, and PR issue labeling. (#17089, #17090, #20799, #20923, #20949, #20969, #20893)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.128.0...rust-v0.129.0

- #20278 feat: Add workspace plugin sharing APIs @xl-openai
- #20334 Make missing config clears no-ops @etraut-openai
- #20246 Gate multi-agent v2 tools independently of collab @jif-oai
- #20361 realtime: rename provider session ids @aibrahim-oai
- #20260 fix(core): truncate large mcp tool outputs in rollouts @owenlin0
- #20083 Mark goals feature as experimental @etraut-openai
- #19843 /plugins: remove marketplace @canvrno-oai
- #20458 [Extension] Allowlist Chrome Extension in the tool_suggest tool @teddywyly-oai
- #20324 Remove core protocol dependency [1/2] @etraut-openai
- #20299 Move item event mapping into app-server-protocol @pakrym-oai
- #20325 Remove core protocol dependency [2/2] @etraut-openai
- #20471 Stop emitting item/fileChange/outputDelta output delta notifications @pakrym-oai
- #20245 [Codex] Add browser use external feature flag @khoi-oai
- #19882 Add /hooks browser for lifecycle hooks @abhinav-oai
- #20275 fix: show correct Bedrock runtime endpoint in /status @celia-oai
- #20270 [codex] Fix elevated Windows sandbox named-pipe access @iceweasel-oai
- #20463 feat(rollouts): store EventMsg::ApplyPatchEnd in limited history mode @owenlin0
- #20101 install WFP filters for Windows sandbox setup @iceweasel-oai
- #20474 [plugin] Add Canva to suggesteable list. @mzeng-openai
- #20379 Send external import completion for sync imports @alexsong-oai
- #19280 [codex] Migrate thread turns list to thread store @wiltzius-openai
- #20348 Move plugin out of core. @xl-openai
- #19160 Make apply_patch streaming parser stateful @akshaynathan
- #20504 fix flaky test falls_back_to_registered_fallback_port_when_default_po… @owenlin0
- #20098 fix: ignore dangerous project-level config keys @owenlin0
- #20268 Sync remote installed plugin bundles @xli-oai
- #20502 fix(tui): set persist_extended_history: false @owenlin0
- #20069 Bypass review for always-allow MCP tools in auto-review @maja-openai
- #18595 feat(tui): add vim composer mode @fcoury-oai
- #20267 Emit analytics for remote plugin installs @xli-oai
- #20499 fix(app-server): mark thread/turns/list and exclude_turns as experime… @owenlin0
- #20522 Alias codex_hooks feature as hooks @abhinav-oai
- #20336 execpolicy: unwrap PowerShell -Command wrappers on Windows @iceweasel-oai
- #20113 fix(exec_policy) heredoc parsing file_redirect @dylan-hurd-oai
- #20341 app-server: switch remote control to protocol v3 segmentation @euroelessar
- #20300 [codex-analytics] centralize thread analytics state @rhan-oai
- #20484 [codex] Improve PR babysitter CI diagnostics and guardrails @wiltzius-openai
- #20298 Surface admin-disabled remote plugin status @xli-oai
- #20511 [codex] Remove unused event messages @pakrym-oai
- #19474 Make thread store process-scoped @wiltzius-openai
- #20558 Format multi-day goal durations in the TUI @etraut-openai
- #19631 Color TUI statusline from active theme @etraut-openai
- #20265 Refresh remote plugin cache on auth changes @xli-oai
- #20150 Add remote plugin skill read API @xli-oai
- #20560 feat: Track local paths for shared plugins @xl-openai
- #20600 chore: allow memories edition @jif-oai
- #20602 feat: ad-hoc instructions @jif-oai
- #20610 chore: improve remember prompt @jif-oai
- #20606 feat: seed ad-hoc memory extension instructions @jif-oai
- #20405 feat: export and replay effective config locks @jif-oai
- #20540 Move apply-patch file changes into turn items @pakrym-oai
- #20564 Enforce `animations = false` for screen readers @etraut-openai
- #20523 Remove no-tool goal continuation suppression @etraut-openai
- #20627 fix: cargo deny @jif-oai
- #20545 app-server: move transport into dedicated crate @euroelessar
- #20294 Add /ide context support to the TUI @etraut-openai
- #20630 [codex] Add Codex environment config @pakrym-oai
- #20524 deprecate legacy notify @abhinav-oai
- #20486 [codex] Migrate loaded thread/read history to ThreadStore @wiltzius-openai
- #20281 Use selected turn environments for runtime context @starr-openai
- #20535 fix(tui): restore alt-enter newline alias @fcoury-oai
- #20650 fix: reduce ConfigBuilder::build stack usage @jif-oai
- #20478 /plugins: add marketplace upgrade flow @canvrno-oai
- #20512 [codex] Emit image view as core item @pakrym-oai
- #20562 Use the 2025-06-18 elicitation capability shape @abhinav-oai
- #20674 Clear live hook rows when turns finalize @abhinav-oai
- #20646 Surface multi-environment choices in environment context @starr-openai
- #20542 Prune unused code-mode globals @cconger
- #20585 ci: cross-compile Windows Bazel tests @bolinfest
- #20701 ci: cross-compile Windows Bazel clippy @bolinfest
- #20676 Fix custom CA login behind TLS-inspecting proxies @jgershen-oai
- #20654 fix(tui): bound startup terminal probes @fcoury-oai
- #20566 [tool_suggest] More prompt polishes. @mzeng-openai
- #20751 Bound websocket request sends with idle timeout @pakrym-oai
- #20893 [codex] Add issue labeler area labels @etraut-openai
- #20896 Remove local docs and specs @etraut-openai
- #20897 [codex] Refactor app-server dispatch result flow @pakrym-oai
- #20677 [codex] Emit MCP tool calls as turn items @pakrym-oai
- #20973 feat: support template interpolation in multi-agent usage hints @jif-oai
- #20622 feat: memories mcp v1 @jif-oai
- #20773 feat: add remote compaction v2 Responses client path @jif-oai
- #20986 feat: add line offsets to memory read MCP @jif-oai
- #20991 feat: add max_lines to memories MCP read @jif-oai
- #20993 feat: paginate MCP memories list @jif-oai
- #20994 feat: make memories MCP list shallow @jif-oai
- #20996 feat: paginate memories MCP search results @jif-oai
- #20997 feat: add context lines to memories MCP search @jif-oai
- #20998 nit: renaming @jif-oai
- #21004 feat: support multi-query memories search @jif-oai
- #21006 nit: legacy @jif-oai
- #20815 Speed up /side parent restore replay @etraut-openai
- #20790 Keep paused goals paused on thread resume @etraut-openai
- #20940 [codex] Split app-server request processors @pakrym-oai
- #21023 typo @jif-oai
- #21012 memories/mcp: generate tool schemas with schemars @jif-oai
- #21010 memories-mcp: reject symlink traversal in local backend @jif-oai
- #20989 core: share responses request builder with compact requests @jif-oai
- #20853 [mcp-apps] Persist MCP Apps specific tool call end event. @mzeng-openai
- #20750 Unify skip-review handling for approval_mode = "approve" @mzeng-openai
- #20682 feat(app-server): always return limited thread history @owenlin0
- #20628 fix(linux-sandbox): fall back when system bwrap lacks perms @viyatb-oai
- #20794 feat(tui): add keymap debug inspector @fcoury-oai
- #21034 tui: retire /approvals and rename /autoreview to /approve @won-openai
- #20669 Prepare selected environment plumbing @starr-openai
- #20685 Fix Windows PTY teardown by preserving ConPTY ownership @iceweasel-oai
- #20663 Add stdio exec-server listener @starr-openai
- #20561 state: pass state db handles through consumers @euroelessar
- #21054 rollout: store web search and mcp tool calls @owenlin0
- #20892 feat(tui): add PR summary statusline items @fcoury-oai
- #20798 feat(tui): improve TUI keymap coverage @fcoury-oai
- #21053 Use MCP server instructions in deferred namespace descriptions @sayan-oai
- #21026 core: preserve last model ids in feedback tags @sayan-oai
- #21060 core: fix apply_patch request permissions test @bolinfest
- #20060 Add reasoning effort to turn tracing spans @charley-openai
- #21058 fix(tui): support modified backspace/delete keys @fcoury-oai
- #21057 bazel: run sharded rust integration tests @bolinfest
- #18914 fix(tui): use shared paste burst interval on Windows @fcoury-oai
- #20715 Make realtime sideband startup async @kmeelu-oai
- #20514 [codex-analytics] add item lifecycle timing @rhan-oai
- #20722 Remove remote plugin uninstall prefix gate @xli-oai
- #19040 [codex] Add unsandboxed process exec API @euroelessar
- #21105 [network-proxy] Cover DNS timeout blocking @evawong-oai
- #21059 Rename agent identity login surface to access token @shijie-oai
- #20576 codex: route metadata updates through ThreadStore @wiltzius-openai
- #20923 Add plugin ID to skill analytics @alexsong-oai
- #21122 Add turn_id to Codex skill invocation analytics @edwardysun3
- #20575 codex: migrate (more) app-server thread history reads to ThreadStore @wiltzius-openai
- #21069 Spill large hook outputs from context @abhinav-oai
- #20969 1- Add model service tiers metadata @aibrahim-oai
- #21170 tools: remove unused experimental `list_dir` tool @jif-oai
- #21201 memories-mcp: hide dot paths from list, read, and search @jif-oai
- #21204 feat: support windowed multi-query memory search @jif-oai
- #21205 feat: add normalized matching to memory search @jif-oai
- #20207 fix(tui): make /copy work inside tmux without passthrough @fcoury-oai
- #20799 Add goal lifecycle metrics @etraut-openai
- #20746 Validate /goal objective length in TUI @etraut-openai
- #20708 Add Windows sandbox readiness RPC @iceweasel-oai
- #20692 Support PreToolUse additionalContext @abhinav-oai
- #21091 [codex] Fix TUI large paste placeholder numbering after Ctrl+C @canvrno-oai
- #21089 [codex] Fix fork --last cwd filtering @canvrno-oai
- #21152 revert legacy notify deprecation @abhinav-oai
- #21190 fix(tui): external editor expansion for same-size large pastes @fcoury-oai
- #20111 fix(sandboxing): Bound advisory system bwrap startup probe @viyatb-oai
- #21220 chore: add minimal proxy egress diagnostics @viyatb-oai
- #20819 feat(tui): add raw scrollback mode @fcoury-oai
- #21225 app-server: ignore persist_extended_history param @owenlin0
- #17089 [codex-analytics] add tool item event schemas @rhan-oai
- #20647 Route process tools to selected environments @starr-openai
- #20321 hook trust metadata and enforcement @abhinav-oai
- #21221 [codex] Use shared app-server JSON-RPC error helpers @pakrym-oai
- #21063 add turn items view to app-server turns @rhan-oai
- #21001 feat(tui): route /diff through workspace commands @fcoury-oai
- #20065 feat(tui): redesign session picker @fcoury-oai
- #21127 fix(linux-sandbox): avoid panic on bwrap build failures @viyatb-oai
- #21234 fix(linux-sandbox): isolate Linux sandbox synthetic mount registry per user for shared codex use case @viyatb-oai
- #20687 [codex] Split tool handlers by tool name @pakrym-oai
- #21113 Auto-deny MCP elicitations for Xcode 26.4 clients @etraut-openai
- #21243 [codex] fix TUI turn items view fixtures @fcoury-oai
- #21146 Enable V8 sandboxing for source-built builds @cconger
- #20689 Inject state DB, agent graph store @rasmusrygaard
- #19575 Add cloud executor registration to exec-server @miz-openai
- #20577 codex: use ThreadStore history for core review forks @wiltzius-openai
- #21261 fix build @bolinfest
- #21251 chore(app-server-protocol): split v2 API definitions into modules @owenlin0
- #21259 ci: trigger rusty-v8 releases from tags @cconger
- #21255 linux-sandbox: use standalone bundled bwrap @bolinfest
- #21256 release: publish standalone bwrap artifacts @bolinfest
- #21260 [codex] Move thread naming to app server @pakrym-oai
- #21219 Add model and reasoning effort to MCP turn metadata @mchen-oai
- #21275 Share Git safe-command logic on Windows @iceweasel-oai
- #21257 release/npm: bundle standalone bwrap on Linux @bolinfest
- #21276 [codex] Remove unused ListModels op @pakrym-oai
- #21282 [codex] Remove legacy ListSkills op @pakrym-oai
- #21271 Expose plugin manifest keywords in app server @alfozan
- #20949 [codex-analytics] rework thread_source for thread analytics @rhan-oai
- #21124 feat: Add plugin share access controls @xl-openai
- #20724 app-server: align dynamic tool identifiers with Responses API @eternal-openai
- #21055 Preserve session MCP config on refresh @aaronl-openai
- #21277 [mcp] Return Accept early per feedback. @mzeng-openai
- #21285 fix(bwrap): emit libcap after standalone archive @viyatb-oai
- #21312 release: bundle bwrap with Linux codex DotSlash artifact @bolinfest
- #19193 Support Codex Apps auth elicitations @mzeng-openai
- #20437 feat: add `session_id` @jif-oai
- #21328 test: isolate app-server-client in-process test state @jif-oai
- #21329 feat: include thread ID in MCP turn metadata @jif-oai
- #21332 feat: return session ID from thread/fork @jif-oai
- #21337 Revert "feat: support template interpolation in multi-agent usage hints" @jif-oai
- #21249 Propagate cache key and service tiers in compact @aibrahim-oai
- #21182 Move installation ID resolution out of core startup @jif-oai
- #21214 chore: spawn MCP for memories @jif-oai
- #21336 feat(app-server): move v2 `sessionId` onto `Thread` @jif-oai
- #21350 [codex] fix builtin MCP Windows path test @jif-oai
- #20971 2- Use string service tiers in session protocol @aibrahim-oai
- #21278 Move message history out of core @pakrym-oai
- #21284 [codex] Add response.processed websocket request @pakrym-oai
- #21367 rollout: coalesce thread updated_at touches @jif-oai
- #21378 feat: move auto vaccum @jif-oai
- #21263 [codex] Coordinate OpenAI docs sample with API key setup @mifan-oai
- #21351 fix(tui): keep Ctrl-C stashed drafts after /clear @fcoury-oai
- #21389 vendor: update bubblewrap to 0.11.2 @bolinfest
- #21281 Remove core MCP list tools op @pakrym-oai
- #21381 [codex] Handle git pagination flags by position @iceweasel-oai
- #21397 fix(tui): persist ctrl-c draft via app event @fcoury-oai
- #19431 Route opted-in MCP elicitations through Guardian @cd-oai
- #21107 Avoid noisy OTEL diagnostics in codex exec @cpaasch-oai
- #21390 Avoid hard-coded environment context shell @starr-openai
- #21090 [codex] Dedupe fallback model metadata warnings @canvrno-oai
- #21395 [codex] Split tool handlers into separate files @pakrym-oai
- #21401 [codex-tui] pass thread source for tui threads @rhan-oai
- #17090 [codex-analytics] emit tool item events from item lifecycle @rhan-oai
- #21409 [codex] Fix Windows sandbox git safe.directory for worktrees @iceweasel-oai
- #21379 Document Codex git commit attribution config @henzelmann-oai
- #21287 Move skills watcher to app-server @pakrym-oai
- #21416 [codex] Move tool specs into core handlers @pakrym-oai
- #21419 feat: Add marketplace source filtering and plugin share context @xl-openai
- #19905 Add compact lifecycle hooks (started by vincentkoc - external contrib) @eternal-openai
- #21460 Revert "Move skills watcher to app-server" @pakrym-oai
- #21450 fix(tui): clear first inline viewport render @fcoury-oai
- #21427 [codex] Delete tool handler plan indirection @pakrym-oai
- #21423 [codex] Add OpenAI Developers to tool suggest allowlist @mifan-oai
- #21340 [codex] allow shared config reads in app-server queue @xli-oai
- #21441 [codex] Parallelize skills list cwd loading @xli-oai
- #21481 Revert state DB injection and agent graph store @pakrym-oai




## rust-v0.128.0 — 2026-04-30

## New Features
- Added persisted `/goal` workflows with app-server APIs, model tools, runtime continuation, and TUI controls for create, pause, resume, and clear. (#18073, #18074, #18075, #18076, #18077, #20082)
- Added `codex update`, configurable TUI keymaps, plan-mode nudges, action-required terminal titles, and active-turn `/statusline` and `/title` edits. (#19933, #18593, #19901, #18372, #19917)
- Expanded permission profiles with built-in defaults, sandbox CLI profile selection, cwd controls, and active-profile metadata for clients. (#19900, #20117, #20118, #20095)
- Improved plugin workflows with marketplace installation, remote bundle caching, remote uninstall, plugin-bundled hooks, hook enablement state, and external-agent config import. (#18704, #19914, #19456, #19705, #19840, #19949)
- Added external agent session import, including background imports and imported-session title handling. (#19895, #20284, #20261)
- Made MultiAgentV2 configuration more explicit with thread caps, wait-time controls, root/subagent hints, and v2-specific depth handling. (#19360, #19792, #19805, #20052, #20180)

## Bug Fixes
- Fixed several resume and interruption issues, including stale interrupt hangs, persisted provider restoration, large remote resume responses, and slow filtered resume lists. (#18392, #19287, #19920, #19591)
- Improved TUI reliability around terminal resize reflow, markdown list spacing, slash-command popup layout, keyboard cleanup, shell-mode escape, and working status updates. (#18575, #19706, #19511, #19625, #19986, #19939)
- Hardened managed network behavior for deferred denials, proxy bypass defaults, resolved target checks, IPv6 host matching, and `git -C` approval handling. (#19184, #20002, #19999, #19995, #20085)
- Fixed Windows sandbox and PTY edge cases, including pseudoconsole startup, elevated runner process handling, core shell environment inheritance, and named-pipe validation. (#20042, #19211, #20089, #19283)
- Fixed Bedrock model support for `apply_patch`, GPT-5.4 reasoning levels, and updated Bedrock GPT-5.4 endpoint/model metadata. (#19416, #19461, #20109)
- Fixed MCP/plugin edge cases around stdio server cleanup, plugin MCP approval persistence, and custom MCP metadata isolation. (#19753, #19537, #19836, #19875)

## Documentation
- Updated the bundled OpenAI Docs skill for GPT-5.5, `gpt-image-2`, and clearer upgrade guidance. (#19407, #19443, #19422)
- Clarified contributor-facing docs, including the PR template, Rust async trait guidance, and README wording. (#19912, #20242, #19514)
- Added a checked-in `codex-core` public API listing and a ThreadManager sample crate. (#20243, #20141)

## Chores
- Published `codex-app-server` release artifacts, stopped publishing GNU Linux binaries, and increased release workflow timeouts. (#19447, #19445, #20271, #20343)
- Added Codex-pinned versioning for the Python app-server SDK package. (#18996)
- Deprecated `--full-auto` while steering users toward explicit permission profiles and trust flows. (#20133)
- Stabilized CI and release plumbing with Bazel setup migration, release smoke-test pinning, and updated workflow pins/timeouts. (#19851, #19854, #19472, #19609)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.125.0...rust-v0.128.0

- #19124 Make MultiAgentV2 interruption markers assistant-authored @jif-oai
- #19354 chore: alias max_concurrent_threads_per_session @jif-oai
- #19360 feat: surface multi-agent thread limit in spawn description @jif-oai
- #19351 Add agents.interrupt_message for interruption markers @jif-oai
- #18392 Fix hang on turn/interrupt @danwang-oai
- #19380 chore: drop MCP Plugins and App from Morpheus @jif-oai
- #18907 respect workspace option for disabling plugins @zamoshchin-openai
- #19283 check PID of named pipe consumer @iceweasel-oai
- #19407 Update bundled OpenAI Docs skill for GPT-5.5 @kkahadze-oai
- #19163 Harden package-manager install policy @mcgrew-oai
- #19416 Fix: use function apply_patch tool for Bedrock model @celia-oai
- #19093 [codex] Omit fork turns from thread started notifications @euroelessar
- #19244 Update unix socket transport to use WebSocket upgrade @willwang-openai
- #19170 Skip disabled rows in selection menu numbering and default focus @canvrno-oai
- #19414 permissions: make legacy profile conversion cwd-free @bolinfest
- #18900 Migrate fork and resume reads to thread store @wiltzius-openai
- #19445 ci: stop publishing GNU Linux release artifacts @bolinfest
- #19443 Add gpt-image-2 to bundled OpenAI Docs skill @kkahadze-oai
- #18584 [4/4] Honor Streamable HTTP MCP placement @aibrahim-oai
- #19447 ci: publish codex-app-server release artifacts @bolinfest
- #19422 Clarify bundled OpenAI Docs upgrade guide wording @kkahadze-oai
- #19266 [codex] add non-local thread store regression harness @wiltzius-openai
- #19098 feat: Compress skill paths with root aliases @xl-openai
- #19207 [codex] Forward Codex Apps tool call IDs to backend metadata @rreichel3-oai
- #19453 Serialize legacy Windows PowerShell sandbox tests @dylan-hurd-oai
- #19234 Refactor log DB into LogWriter interface @rasmusrygaard
- #19461 fix: Bedrock GPT-5.4 reasoning levels @celia-oai
- #19449 permissions: remove legacy read-only access modes @bolinfest
- #19472 ci: pin codex-action v1.7 @viyatb-oai
- #19468 Fix Bazel cargo_bin runfiles paths @fjord-oai
- #19410 Remove js_repl feature @fjord-oai
- #18073 Add goal persistence foundation (1 / 5) @etraut-openai
- #18074 Add goal app-server API (2 / 5) @etraut-openai
- #18075 Add goal model tools (3 / 5) @etraut-openai
- #18076 Add goal core runtime (4 / 5) @etraut-openai
- #18077 Add goal TUI UX (5 / 5) @etraut-openai
- #19454 Split approval matrix test groups @dylan-hurd-oai
- #19514 Fix codex-rs README grammar @etraut-openai
- #19459 Enable unavailable dummy tools by default @mzeng-openai
- #19524 [codex] Prune unused codex-mcp API and duplicate helpers @aibrahim-oai
- #19526 [codex] Order codex-mcp items by visibility @aibrahim-oai
- #19578 fix: increase Bazel timeout to 45 minutes @bolinfest
- #19287 Restore persisted model provider on thread resume @etraut-openai
- #19593 test: isolate remote thread store regression from plugin warmups @bolinfest
- #19511 Keep slash command popup columns stable while scrolling @etraut-openai
- #19595 [codex] Bypass managed network for escalated exec @viyatb-oai
- #19604 test: stabilize app-server path assertions on Windows @bolinfest
- #19609 fix: restore 30-minute timeout for Bazel builds @bolinfest
- #19389 Guard npm update readiness @shijie-oai
- #18575 fix(tui): reflow scrollback on terminal resize @fcoury-oai
- #19610 Support end_turn in response.completed @andmis
- #19640 [codex] remove responses command @tibo-openai
- #19683 test: harden app-server integration tests @bolinfest
- #18904 feat: load AgentIdentity from JWT login/env @efrazer-oai
- #19606 permissions: make runtime config profile-backed @bolinfest
- #19392 permissions: derive compatibility policies from profiles @bolinfest
- #19484 Lift app-server JSON-RPC error handling to request boundary @pakrym-oai
- #19487 [codex] Move config loading into codex-config @pakrym-oai
- #19393 permissions: migrate approval and sandbox consumers to profiles @bolinfest
- #19726 Fix codex-core config test type paths @pakrym-oai
- #19727 test: increase core-all-test shard count to 16 @bolinfest
- #19725 Split MCP connection modules @aibrahim-oai
- #19605 Delete unused ResponseItem::Message.end_turn @andmis
- #19394 permissions: remove core legacy policy round trips @bolinfest
- #19733 Allow agents.max_threads to work with multi_agent_v2 @andmis
- #19395 permissions: finish profile-backed app surfaces @bolinfest
- #19739 inline hostname resolution for remote sandbox config @abhinav-oai
- #19734 permissions: centralize legacy sandbox projection @bolinfest
- #19058 Add /auto-review-denials retry approval flow @won-openai
- #19735 permissions: store only constrained permission profiles @bolinfest
- #19736 permissions: constrain requirements as profiles @bolinfest
- #19737 permissions: derive legacy exec policies at boundaries @bolinfest
- #19779 Add Codex issue digest skill @etraut-openai
- #19792 multi_agent_v2: move thread cap into feature config @jif-oai
- #18982 feat: use git-backed workspace diffs for memory consolidation @jif-oai
- #19809 Allow Phase 2 memory claims after retry exhaustion @jif-oai
- #19812 Avoid rewriting Phase 2 selection on clean workspace @jif-oai
- #19813 nit: one more fix @jif-oai
- #19818 chore: split memories part 1 @jif-oai
- #19510 Hide rewind preview when no user message exists @etraut-openai
- #19618 Persist shell mode commands in prompt history @etraut-openai
- #19709 Render delegated patch approval details @etraut-openai
- #19490 Streamline plugin, apps, and skills handlers @pakrym-oai
- #19762 refactor: make auth loading async @efrazer-oai
- #19854 ci: pin npm staging smoke test to a recent rust-release run @bolinfest
- #19851 ci: migrate Bazel setup away from archived setup-bazelisk @bolinfest
- #19491 Streamline account and command handlers @pakrym-oai
- #19771 fix: filter dynamic deferred tools from model_visible_specs @sayan-oai
- #19863 [codex-analytics] remove ga flag @rhan-oai
- #19865 Cap original-detail image token estimates @fjord-oai
- #19591 Fix filtered thread-list resume regression in TUI @etraut-openai
- #19513 Delay approval prompts while typing @etraut-openai
- #19706 Preserve TUI markdown list spacing after code blocks @etraut-openai
- #19841 permissions: remove cwd special path @bolinfest
- #19492 Streamline thread start handler @pakrym-oai
- #19874 [codex-backend] Prefer state git metadata in filtered thread lists @joeytrasatti-openai
- #19493 Streamline thread mutation handlers @pakrym-oai
- #19862 [codex] Shard exec Bazel integration test @starr-openai
- #18996 Publish Python SDK with Codex-pinned versioning @sdcoffey
- #19494 Streamline thread read handlers @pakrym-oai
- #19839 [codex] Trace cancelled inference streams @cassirer-openai
- #19495 Streamline thread resume and fork handlers @pakrym-oai
- #19497 Streamline turn and realtime handlers @pakrym-oai
- #18372 Show action required in terminal title @canvrno-oai
- #19884 Add MCP app feature flag @mzeng-openai
- #19498 Streamline review and feedback handlers @pakrym-oai
- #19772 permissions: derive config defaults as profiles @bolinfest
- #19836 disallow fileparams metadata for custom mcps @colby-oai
- #19892 Refactor exec-server filesystem API into codex-file-system @miz-openai
- #19452 Stabilize plugin MCP fixture tests @dylan-hurd-oai
- #19481 Remove ghost snapshots  @pakrym-oai
- #19773 permissions: require profiles in TUI thread state @bolinfest
- #19917 Allow /statusline and /title slash commands during active turns @canvrno-oai
- #19763 refactor: load agent identity runtime eagerly @efrazer-oai
- #17689 [codex-analytics] include user agent in default headers @marksteinbrick-oai
- #19912 Clarify PR template invitation requirement @etraut-openai
- #19630 Avoid persisting ShutdownComplete after thread shutdown @etraut-openai
- #19774 permissions: make SessionConfigured profile-only @bolinfest
- #19775 permissions: derive snapshot sandbox projections @bolinfest
- #19920 Allow large remote app-server resume responses @etraut-openai
- #19776 permissions: store thread sessions as profiles @bolinfest
- #19899 app-server-protocol: mark permission profiles experimental @bolinfest
- #19933 Add `codex update` command @etraut-openai
- #19914 feat: Cache remote plugin bundles on install @xl-openai
- #19456 Add remote plugin uninstall API @xli-oai
- #19805 Add MultiAgentV2 root and subagent context hints @jif-oai
- #19860 feat: split memories part 2 @jif-oai
- #19961 feat: fix hinting 2 @jif-oai
- #19963 feat: fix hinting 3 @jif-oai
- #19967 Stabilize memory Phase 2 input ordering @jif-oai
- #19970 feat: trigger memories from user turns with cooldown @jif-oai
- #19904 fix: configure AgentIdentity AuthAPI base URL @efrazer-oai
- #19990 feat: skip memory startup when Codex rate limits are low @jif-oai
- #19998 feat: house-keeping memories 1 @jif-oai
- #20000 feat: house-keeping memories 2 @jif-oai
- #19832 Preserve assistant phase for replayed messages @friel-openai
- #19625 Reset TUI keyboard reporting on exit @etraut-openai
- #18593 feat(tui): add configurable keymap support @fcoury-oai
- #19846 [sandbox] Enforce protected workspace metadata paths @evawong-oai
- #20005 feat: house-keeping memories 3 @jif-oai
- #19929 TUI: use cumulative turn duration for worked-for separator @etraut-openai
- #19753 Terminate stdio MCP servers on shutdown to avoid process leaks @etraut-openai
- #19473 Add turn start timestamp to turn metadata @mchen-oai
- #19875 Strip connector provenance metadata from custom MCP tools @colby-oai
- #19764 feat: verify agent identity JWTs with JWKS @efrazer-oai
- #19847 Enforce workspace metadata protections in Seatbelt @evawong-oai
- #19509 Record MCP result telemetry on mcp.tools.call spans @mchen-oai
- #19907 Clarify network approval auto-review prompts @maja-openai
- #19901 feat(tui): suggest plan mode from composer drafts @fcoury-oai
- #19931 Move local /resume cwd filtering into thread/list @canvrno-oai
- #19986 fix(tui): let esc exit empty shell mode @fcoury-oai
- #19895 External agent session support @stefanstokic-oai
- #20002 fix(network-proxy): tighten network proxy bypass defaults @viyatb-oai
- #19900 permissions: add built-in default profiles @bolinfest
- #20045 Fix plan mode nudge test after task completion signature change @canvrno-oai
- #19432 [codex] Add token usage to turn tracing spans @charley-openai
- #20001 fix(network-proxy): harden linux proxy bridge helpers @viyatb-oai
- #19959 Fix log db batch flush flake @dylan-hurd-oai
- #17373 app-server: run initialized rpcs with keyed serialization @euroelessar
- #19708 Load cloud requirements for agent identity @shijie-oai
- #19999 fix(network-proxy): recheck network proxy connect targets @viyatb-oai
- #20047 app-server: allow remote_control runtime feature override @euroelessar
- #20052 Make MultiAgentV2 wait minimum configurable @jif-oai
- #20008 tui: use permission profiles for sandbox state @bolinfest
- #20068 app-server: disable remote control without sqlite @euroelessar
- #20066 [rollout-trace] Include x-request-id in rollout trace. @cassirer-openai
- #19705 Discover hooks bundled with plugins @abhinav-oai
- #18704 /plugins: add marketplace install flow @canvrno-oai
- #20085 fix: don't auto approve git -C ... @owenlin0
- #20088 Fix flaky plugin hook env test @abhinav-oai
- #19995 fix(network-proxy): normalize network proxy host matching @viyatb-oai
- #20010 core tests: submit turns with permission profiles @bolinfest
- #20092 Return None when auth refresh fails @gpeal
- #19919 app-server: notify clients of remote-control status changes @euroelessar
- #20097 Refine Codex issue digest summaries @etraut-openai
- #20011 core tests: build user turns from permission profiles @bolinfest
- #20013 core tests: migrate more turns to permission profiles @bolinfest
- #20015 core tests: configure profiles directly @bolinfest
- #20016 core tests: send model turns with permission profiles @bolinfest
- #20100 Increase plugin hook env test timeout @abhinav-oai
- #20018 core tests: migrate model/personality turns to profiles @bolinfest
- #20021 core tests: migrate view image turns to profiles @bolinfest
- #20024 core tests: migrate safety check turns to profiles @bolinfest
- #20026 core tests: migrate plan item turns to profiles @bolinfest
- #20027 core tests: migrate tools tests to permission profiles @bolinfest
- #20028 core tests: migrate permissions message tests to profiles @bolinfest
- #20030 core tests: migrate exec policy turns to profiles @bolinfest
- #20032 core tests: migrate prompt caching turns to profiles @bolinfest
- #20033 core tests: migrate request permissions tool turns to profiles @bolinfest
- #20034 core tests: migrate zsh-fork permissions to profiles @bolinfest
- #20035 core tests: migrate compact turns to profiles @bolinfest
- #20037 core tests: migrate rmcp turns to profiles @bolinfest
- #20040 core tests: migrate apply patch turns to profiles @bolinfest
- #20041 core tests: migrate hook turns to profiles @bolinfest
- #20072 Support disabling tool suggest for specific tools. @mzeng-openai
- #19949 Support detect and import MCP, Subagents, hooks, commands from external @alexsong-oai
- #19442 feat: disable capabilities by model provider @celia-oai
- #20108 fix: restore live event submit path for apply patch tests @bolinfest
- #19939 Restore TUI working status after steer message is set @canvrno-oai
- #20086 Fix plugin list workspace settings test isolation @canvrno-oai
- #20049 feat: expose provider capability bounds to app server clients @celia-oai
- #20109 feat: update Bedrock Mantle endpoint and GPT-5.4 model ID @celia-oai
- #20106 linux-sandbox: switch helper plumbing to PermissionProfile @bolinfest
- #20112 Soften skill description budget warnings @xl-openai
- #20058 Add environment provider snapshot @starr-openai
- #20133 chore(cli) deprecate --full-auto @dylan-hurd-oai
- #20117 feat(cli): add explicit sandbox permission profiles @viyatb-oai
- #20139 Delete multi_agent_v2 followup_task interrupt parameter @andmis
- #20118 feat(cli): add sandbox profile config controls @viyatb-oai
- #20144 Fix migrated hook path rewriting @alexsong-oai
- #20042 Fix Windows pseudoconsole attribute handling for sandboxed PTY sessions @iceweasel-oai
- #20186 nit: drop old memories things @jif-oai
- #20180 Make multi-agent v2 ignore agents.max_depth @jif-oai
- #20082 Use /goal resume for paused goals @etraut-openai
- #20172 TUI: Remove core protocol dependency [1/7] @etraut-openai
- #19211 Improve Windows process management edge cases @iceweasel-oai
- #20123 [rollout-tracer] Match analysis messages on encrypted id. @cassirer-openai
- #20173 TUI: Remove core protocol dependency [2/7] @etraut-openai
- #20174 TUI: Remove core protocol dependency [3/7] @etraut-openai
- #20228 [codex-backend] Prefer sqlite git info for rollout-path reads @joeytrasatti-openai
- #20141 Add ThreadManager sample crate @pakrym-oai
- #20046 test protocol: lock inter-agent commentary phase @friel-openai
- #20064 Include auto-review rollout in feedback uploads @won-openai
- #20096 feat: Use remote installed plugin cache for skills and MCP @xl-openai
- #19184 fix: handle deferred network proxy denials @viyatb-oai
- #20089 expand the set of core shell env vars for Windows. @iceweasel-oai
- #17088 [codex-analytics] ingest server requests and responses @rhan-oai
- #20091 [tool_suggest] Improve tool_suggest triggering conditions. @mzeng-openai
- #20258 app-server: fix outgoing sender test setup @sayan-oai
- #20050 [app-server] type client response payloads @rhan-oai
- #19966 Require remote plugin detail before uninstall @xli-oai
- #20059 [app-server] centralize client response analytics @rhan-oai
- #19334 Fallback login callback port when default is busy @xli-oai
- #20231 [apps] Add apps MCP path override @adaley-openai
- #20242 docs: discourage `#[async_trait]` and `#[allow(async_fn_in_trait)]` @bolinfest
- #19620 Escape turn metadata headers as ASCII JSON @etraut-openai
- #19537 [mcp] Fix plugin MCP approval policy. @mzeng-openai
- #19229 Add agent graph store interface @rasmusrygaard
- #20243 Add codex-core public API listing @pakrym-oai
- #19435 stop blocking unified_exec on Windows @iceweasel-oai
- #19852 Enforce workspace metadata protections in Linux sandbox @evawong-oai
- #20136 Update Codex login success page UX @rafael-jac
- #20271 chore: increase release build timeout from 60 min to 90 @bolinfest
- #19778 Add hooks/list app-server RPC @abhinav-oai
- #20261 Consume ai-title from external sessions and add end marker @alexsong-oai
- #20284 Import external agent sessions in background @stefanstokic-oai
- #20149 Reduce the surface of collaboration modes @pakrym-oai
- #20282 tui: return from side chat on Ctrl-D @etraut-openai
- #20250 update codex_plugins_beta_setting (from workspace settings) @zamoshchin-openai
- #20080 [codex-analytics] prevent stale guardian events from satisfying reused reviews @rhan-oai
- #20291 app-server: remove dead api version handling from bespoke events @pakrym-oai
- #20304 [plugins] Allow MSFT curated plugins in tool_suggest @mzeng-openai
- #20095 permissions: expose active profile metadata @bolinfest
- #19840 Add persisted hook enablement state @abhinav-oai
- #20343 ci: increase Windows release workflow timeouts @bolinfest




## rust-v0.125.0 — 2026-04-24

## New Features

- App-server integrations now support Unix socket transport, pagination-friendly resume/fork, sticky environments, and remote thread config/store plumbing. (#18255, #18892, #18897, #18908, #19008, #19014)
- App-server plugin management can install remote plugins and upgrade configured marketplaces. (#18917, #19074)
- Permission profiles now round-trip across TUI sessions, user turns, MCP sandbox state, shell escalation, and app-server APIs. (#18284, #18285, #18286, #18287, #19231)
- Model providers now own model discovery, with AWS/Bedrock account state exposed to app clients. (#18950, #19048)
- `codex exec --json` now reports reasoning-token usage for programmatic consumers. (#19308)
- Rollout tracing now records tool, code-mode, session, and multi-agent relationships, with a debug reducer command for inspection. (#18878, #18879, #18880)

## Bug Fixes

- Interrupting `/review` and exiting the TUI no longer leaves the interface wedged on delegate startup or unsubscribe. (#18921)
- Exec-server no longer drops buffered output after process exit and now waits correctly for stream closure. (#18946, #19130)
- App-server now respects explicitly untrusted project config instead of auto-persisting trust. (#18626)
- WebSocket app-server clients are less likely to disconnect during bursts of turn and tool-output notifications. (#19246)
- Windows sandbox startup handles multiple CLI versions and installed app directories better, and background `Start-Process` calls avoid visible PowerShell windows. (#19044, #19180, #19214)
- Config/schema handling now rejects conflicting MultiAgentV2 thread limits, resolves relative agent-role config paths, hides unsupported MCP bearer-token fields, and rejects invalid `js_repl` image MIME types. (#19129, #19261, #19294, #19292)

## Documentation

- App-server docs and generated schemas were refreshed for the new transport, thread, marketplace, sticky environment, and permission-profile APIs. (#18255, #18897, #19014, #19074, #19231)
- Rollout-trace documentation now covers the debug trace reduction workflow. (#18880)

## Chores

- Refreshed `models.json` and related core, app-server, SDK, and TUI fixtures for the latest model catalog and reasoning defaults. (#19323)
- Windows Bazel CI now uses a stable PATH and shared query startup path for better cache reuse. (#19161, #19232)
- Plugin marketplace add/remove/startup-sync internals moved out of `codex-core`, and curated plugin cache versions now use short SHAs. (#19099, #19095)
- Reverted a macOS signing entitlement change after it caused alpha startup failures. (#19167, #19350)
- Stabilized flaky approval-popup and plugin MCP tool-discovery tests. (#19178, #19191)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.124.0...rust-v0.125.0

- #19129 Reject agents.max_threads with multi_agent_v2 @jif-oai
- #19130 exec-server: wait for close after observed exit @jif-oai
- #19149 Update safety check wording @etraut-openai
- #18284 tui: sync session permission profiles @bolinfest
- #18710 [codex] Fix plugin marketplace help usage @xli-oai
- #19127 feat: drop spawned-agent context instructions @jif-oai
- #18892 Add remote thread config loader protos @rasmusrygaard
- #19014 Add excludeTurns parameter to thread/resume and thread/fork @ddr-oai
- #18882 [codex] Route live thread writes through ThreadStore @wiltzius-openai
- #19008 [codex] Implement remote thread store methods @wiltzius-openai
- #18626 Respect explicit untrusted project config @etraut-openai
- #18255 app-server: add Unix socket transport @euroelessar
- #19167 ci: add macOS keychain entitlements @euroelessar
- #19099 Move marketplace add/remove and startup sync out of core. @xl-openai
- #19168 Use Auto-review wording for fallback rationale @maja-openai
- #18908 Add remote thread config endpoint @rasmusrygaard
- #18285 tui: carry permission profiles on user turns @bolinfest
- #18286 mcp: include permission profiles in sandbox state @bolinfest
- #18878 [rollout_trace] Trace tool and code-mode boundaries @cassirer-openai
- #18287 shell-escalation: carry resolved permission profiles @bolinfest
- #18946 fix(exec-server): retain output until streams close @bolinfest
- #19074 Add app-server marketplace upgrade RPC @xli-oai
- #19180 use a version-specific suffix for command runner binary in .sandbox-bin @iceweasel-oai
- #19178 Stabilize approvals popup disabled-row test @etraut-openai
- #18921 Fix /review interrupt and TUI exit wedges @etraut-openai
- #19191 Stabilize plugin MCP tools test @etraut-openai
- #19194 Mark hooks schema fixtures as generated @abhinav-oai
- #18288 tests: isolate approval fixtures from host rules @bolinfest
- #19044 guide Windows to use -WindowStyle Hidden for Start-Process calls @iceweasel-oai
- #19214 do not attempt ACLs on installed codex dir @iceweasel-oai
- #19161 ci: derive cache-stable Windows Bazel PATH @bolinfest
- #18811 refactor: route Codex auth through AuthProvider @efrazer-oai
- #19246 Increase app-server WebSocket outbound buffer @etraut-openai
- #19048 feat: expose AWS account state from account/read @celia-oai
- #18880 [rollout_trace] Add debug trace reduction command @cassirer-openai
- #18897 Add sticky environment API and thread state @starr-openai
- #18879 [rollout_trace] Trace sessions and multi-agent edges @cassirer-openai
- #19095 feat: Use short SHA versions for curated plugin cache entries @xl-openai
- #18950 feat: let model providers own model discovery @celia-oai
- #19206 app-server: persist device key bindings in sqlite @euroelessar
- #18917 [codex] Support remote plugin install writes @xli-oai
- #19231 permissions: make profiles represent enforcement @bolinfest
- #19261 Resolve relative agent role config paths from layers @etraut-openai
- #19232 ci: reuse Bazel CI startup for target-discovery queries @bolinfest
- #19292 Reject unsupported js_repl image MIME types @etraut-openai
- #19247 chore: apply truncation policy to unified_exec @sayan-oai
- #19294 Hide unsupported MCP bearer_token from config schema @etraut-openai
- #19308 Surface reasoning tokens in exec JSON usage @etraut-openai
- #19323 Update models.json and related fixtures @sayan-oai
- #19350 fix alpha build @jif-oai




## rust-v0.124.0 — 2026-04-23

## New Features
- The TUI now has quick reasoning controls: `Alt+,` lowers reasoning, `Alt+.` raises it, and accepted model upgrades now reset reasoning to the new model’s default instead of carrying over stale settings. (#18866, #19085)
- App-server sessions can now manage multiple environments and choose an environment and working directory per turn, which makes multi-workspace and remote setups easier to target precisely. (#18401, #18416)
- Added first-class Amazon Bedrock support for OpenAI-compatible providers, including AWS SigV4 signing and AWS credential-based auth. (#17820)
- Remote plugin marketplaces can now be listed and read directly, with more reliable detail lookups and larger result pages. (#18452, #19079)
- Hooks are now stable, can be configured inline in `config.toml` and managed `requirements.toml`, and can observe MCP tools as well as `apply_patch` and long-running Bash sessions. (#18893, #18385, #18391, #18888, #19012)
- Eligible ChatGPT plans now default to the Fast service tier unless you explicitly opt out. (#19053)

## Bug Fixes
- Preserved Cloudflare cookies across approved ChatGPT hosts, reducing auth breakage in HTTP-backed ChatGPT flows. (#17783)
- Fixed remote app-server reliability issues so websocket events keep draining under load and shutdown no longer fails when the remote worker exits during cleanup. (#18932, #18936)
- Fixed permission-mode drift so `/permissions` changes survive side conversations and updated Full Access state is correctly reflected in MCP approval handling. (#18924, #19033)
- Fixed `wait_agent` so it returns promptly when mailbox work is already queued instead of waiting for a fresh notification or timing out. (#18968)
- Fixed local stdio MCP launches for relative commands without an explicit `cwd`, bringing fallback path resolution in line with CLI behavior. (#19031)
- Startup now fails less often on managed config edge cases: unknown feature requirements warn instead of aborting, and cloud-requirements errors are clearer about what failed. (#19038, #19078)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.123.0...rust-v0.124.0

- #18870 Load app-server config through ConfigManager @pakrym-oai
- #18866 feat(tui): shortcuts to change reasoning level temporarily @fcoury-oai
- #18430 app-server: implement device key v2 methods @euroelessar
- #18757 fix: fully revert agent identity runtime wiring @efrazer-oai
- #17783 Preserve Cloudfare HTTP cookies in codex @shijie-oai
- #18876 [rollout_trace] Add rollout trace crate @cassirer-openai
- #18401 Support multiple managed environments @starr-openai
- #18797 Allow guardian bare allow output @maja-openai
- #18886 Normalize /statusline & /title items @canvrno-oai
- #18768 [codex] Tighten external migration prompt tests @alexsong-oai
- #18909 Update /statusline and /title snapshots @canvrno-oai
- #18867 sandboxing: materialize cwd-relative permission globs @bolinfest
- #18915 fix: windows snapshot for external_agent_config_migration::tests::prompt_snapshot did not match windows output @bolinfest
- #18416 Add turn-scoped environment selections @starr-openai
- #18391 fix(core): emit hooks for apply_patch edits @fcoury-oai
- #18916 test(core): move prompt debug coverage to integration suite @bolinfest
- #17820 feat: add AWS SigV4 auth for OpenAI-compatible model providers @celia-oai
- #18913 bazel: run wrapped Rust unit test shards @bolinfest
- #18452 feat: Support remote plugin list/read. @xl-openai
- #18936 Fix remote app-server shutdown race @bolinfest
- #18871 refactor: add agent identity crate @efrazer-oai
- #18276 exec-server: carry filesystem sandbox profiles @bolinfest
- #18926 ci: keep argument comment lint checks materialized @bolinfest
- #18935 Keep TUI status surfaces in sync @etraut-openai
- #18923 chore(tui) debug-config guardian_policy_config @dylan-hurd-oai
- #18943 tests: serialize process-heavy Windows CI suites @bolinfest
- #18934 [codex] Clean guardian instructions @dylan-hurd-oai
- #18948 chore: remove unused Bedrock auth lazy loading @celia-oai
- #18277 core: derive active permission profiles @bolinfest
- #18785 feat: add explicit AgentIdentity auth mode @efrazer-oai
- #18953 use long-lived sessions for codex sandbox windows @iceweasel-oai
- #18278 app-server: expose thread permission profiles @bolinfest
- #17693 [codex-analytics] guardian review analytics events emission @rhan-oai
- #17695 [codex-analytics] guardian review truncation @rhan-oai
- #17696 [codex-analytics] guardian review TTFT plumbing and emission @rhan-oai
- #18962 nit: expose lib @jif-oai
- #18502 Support multiple cwd filters for thread list @acrognale-oai
- #18968 fix: wait_agent timeout for queued mailbox mail @jif-oai
- #18971 fix: cargo deny @jif-oai
- #18973 chore: prep memories for AB @jif-oai
- #18852 [codex] Update imagegen system skill @vb-openai
- #18865 Stage publishable Python runtime wheels @sdcoffey
- #18932 TUI: Keep remote app-server events draining @etraut-openai
- #18877 [rollout_trace] Record core session rollout traces @cassirer-openai
- #18959 feat(auto-review) policy config @dylan-hurd-oai
- #18955 Add plumbing to approve stored Auto-Review denials @won-openai
- #18999 arg0: keep dispatch aliases alive during async main @bolinfest
- #18925 feat: Fairly trim skill descriptions within context budget @xl-openai
- #18890 feat(auto-review) short-circuit @dylan-hurd-oai
- #18279 app-server: accept permission profile overrides @bolinfest
- #18582 [2/4] Implement executor HTTP request runner @aibrahim-oai
- #18197 feat: add guardian network approval trigger context @viyatb-oai
- #19033 Fix MCP permission policy sync @leoshimo-oai
- #19016 exec-server: expose arg0 alias root to fs sandbox @bolinfest
- #19036 Overlay state DB git metadata for filtered thread lists @joeytrasatti-openai
- #18956 [Codex] Register browser requirements feature keys @khoi-oai
- #19043 Update bundled OpenAI Docs skill freshness check @kkahadze-oai
- #18504 Rebrand approvals reviewer config to auto-review @won-openai
- #19046 exec-server: require explicit filesystem sandbox cwd @bolinfest
- #18280 clients: send permission profiles to app-server @bolinfest
- #18281 rollout: persist turn permission profiles @bolinfest
- #18888 hooks: emit Bash PostToolUse when exec_command completes via write_stdin @eternal-openai
- #19056 Rename approvals reviewer variant to auto-review @won-openai
- #18583 [3/4] Add executor-backed RMCP HTTP client @aibrahim-oai
- #19059 core: box multi-agent wrapper futures @bolinfest
- #19031 Fix relative stdio MCP cwd fallback @mzeng-openai
- #19063 chore(auto-review) feature => stable @dylan-hurd-oai
- #19050 feat(request-permissions) approve with strict review @dylan-hurd-oai
- #19067 test: set Rust test thread stack size @bolinfest
- #19072 tui: fix approvals popup disabled shortcut test @bolinfest
- #18893 codex: support hooks in config.toml and requirements.toml @eternal-openai
- #18282 protocol: report session permission profiles @bolinfest
- #19053 Default Fast service tier for eligible ChatGPT plans @shijie-oai
- #19055 Add safety check notification and error handling @etraut-openai
- #18283 app-server: accept command permission profiles @bolinfest
- #19012 Mark codex_hooks stable @abhinav-oai
- #18924 TUI: preserve permission state after side conversations @etraut-openai
- #19071 Add computer_use feature requirement key @leoshimo-oai
- #19079 Use remote plugin IDs for detail reads and enlarge list pages @xl-openai
- #19038 feat: Warn and continue on unknown feature requirements @xl-openai
- #19078 Clarify cloud requirements error messages @gverma-openai
- #19085 Persist target default reasoning on model upgrade @shijie-oai
- #19086 app-server: include filesystem entries in permission requests @bolinfest
- #18385 Support MCP tools in hooks @abhinav-oai
- #19113 Fix auto-review config compatibility across protocol and SDK @won-openai




## rust-v0.123.0 — 2026-04-23

## New Features
- Added a built-in `amazon-bedrock` model provider with configurable AWS profile support (#18744).
- Added `/mcp verbose` for full MCP server diagnostics, resources, and resource templates while keeping plain `/mcp` fast (#18610).
- Made plugin MCP loading accept both `mcpServers` and top-level server maps in `.mcp.json` (#18780).
- Improved realtime handoffs so background agents receive transcript deltas and can explicitly stay silent when appropriate (#18597, #18761, #18635).
- Added host-specific `remote_sandbox_config` requirements for remote environments (#18763).
- Refreshed bundled model metadata, including the current `gpt-5.4` default (#18586, #18388, #18719).

## Bug Fixes
- Fixed `/copy` after rollback so it copies the latest visible assistant response, not a pre-rollback response (#18739).
- Queued normal follow-up text submitted while a manual shell command is running, preventing stuck `Working` states (#18820).
- Fixed Unicode/dead-key input in VS Code WSL terminals by disabling the enhanced keyboard mode there (#18741).
- Prevented stale proxy environment variables from being restored from shell snapshots (#17271).
- Made `codex exec` inherit root-level shared flags such as sandbox and model options (#18630).
- Removed leaked review prompts from TUI transcripts (#18659).

## Documentation
- Added and tightened the Code Review skill instructions used by Codex-driven reviews (#18746, #18818).
- Documented intentional await-across-lock cases and enabled Clippy linting for them (#18423, #18698).
- Updated app-server protocol docs for threadless MCP resource reads and namespaced dynamic tools (#18292, #18413).

## Chores
- Fixed high-severity dependency alerts by pinning patched JS and Rust dependencies (#18167).
- Reduced Rust dev build debug-info overhead while preserving useful backtraces (#18844).
- Refreshed generated Python app-server SDK types from the current schema (#18862).

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.122.0...rust-v0.123.0

- #18662 feat: add metric to track the number of turns with memory usage @jif-oai
- #18659 chore: drop review prompt from TUI UX @jif-oai
- #18661 feat: log client use min log level @jif-oai
- #18094 [codex] Use background agent task auth for backend calls @adrian-openai
- #18441 Avoid false shell snapshot cleanup warnings @etraut-openai
- #18260 [codex] Use background task auth for additional backend calls @adrian-openai
- #18657 fix: auth.json leak in tests @jif-oai
- #18610 Add verbose diagnostics for /mcp @etraut-openai
- #18633 Use app server thread names in TUI picker @etraut-openai
- #18591 Surface parent thread status in side conversations @etraut-openai
- #18361 codex: move thread/name/set and thread/memoryModeSet into ThreadStore @wiltzius-openai
- #18274 protocol: canonicalize file system permissions @bolinfest
- #18403 refactor: use semaphores for async serialization gates @bolinfest
- #18586 Update models.json @aibrahim-oai
- #18289 Wire the PatchUpdated events through app_server @akshaynathan
- #18631 Remove simple TUI legacy_core reexports @etraut-openai
- #18697 [codex] Fix agent identity auth test fixture @adrian-openai
- #18388 Update models.json @github-actions
- #18167 [codex] Fix high severity dependency alerts @caseysilver-oai
- #17692 [codex-analytics] guardian review analytics schema polishing @rhan-oai
- #18722 chore(guardian) disable mcps and plugins @dylan-hurd-oai
- #18597 Update realtime handoff transcript handling @guinness-oai
- #18627 Surface TUI skills refresh failures @etraut-openai
- #18719 Fix stale model test fixtures @aibrahim-oai
- #18714 Add experimental remote thread store config @wiltzius-openai
- #18739 fix(tui): keep /copy aligned with rollback @fcoury-oai
- #18701 [codex] prefer inherited spawn agent model @tibo-openai
- #18632 Use app server metadata for fork parent titles @etraut-openai
- #18112 feat: cascade thread archive @jif-oai
- #18716 Read conversation summaries through thread store @wiltzius-openai
- #18635 Add realtime silence tool @guinness-oai
- #18254 uds: add async Unix socket crate @euroelessar
- #18746 Add Code Review skill @pakrym-oai
- #18208 Add session config loader interface @rasmusrygaard
- #18753 Refactor TUI app module into submodules @etraut-openai
- #18630 Fix exec inheritance of root shared flags @etraut-openai
- #18027 [6/6] Fail exec client operations after disconnect @aibrahim-oai
- #17271 fix: fix stale proxy env restoration after shell snapshots @viyatb-oai
- #18602 Warn when trusting Git subdirectories @etraut-openai
- #18761 [codex] Send realtime transcript deltas on handoff @guinness-oai
- #18435 /statusline & /title - Shared preview values @canvrno-oai
- #18744 feat: add a built-in Amazon Bedrock model provider @celia-oai
- #18581 [1/4] Add executor HTTP request protocol @aibrahim-oai
- #18418 refactor: narrow async lock scopes @bolinfest
- #18780 feat: Support more plugin MCP file shapes. @xl-openai
- #18713 protocol: preserve glob scan depth in permission profiles @bolinfest
- #18795 fix(guardian) Dont hard error on feature disable @dylan-hurd-oai
- #18292 Make MCP resource read threadless @mzeng-openai
- #18786 Fallback display names for TUI skill mentions @canvrno-oai
- #18807 chore(app-server) linguist-generated @dylan-hurd-oai
- #18393 feat(auto-review) Handle request_permissions calls @dylan-hurd-oai
- #18763 Add remote_sandbox_config to our config requirements @abhinav-oai
- #18794 Organize context fragments  @pakrym-oai
- #18423 chore: document intentional await-holding cases @bolinfest
- #18698 chore: enable await-holding clippy lints @bolinfest
- #18413 [tool search] support namespaced deferred dynamic tools @pash-openai
- #18818 [codex] Tighten code review skill wording @pakrym-oai
- #18271 show bash mode in the TUI @abhinav-oai
- #18741 fix(tui): disable enhanced keys for VS Code WSL @fcoury-oai
- #18850 Move external agent config out of core @pakrym-oai
- #18844 build: reduce Rust dev debuginfo @bolinfest
- #18848 feat: baseline lib @jif-oai
- #18846 core: make test-log a dev dependency @bolinfest
- #18428 app-server: define device key v2 protocol @euroelessar
- #18093 Propagate thread id in MCP tool metadata @rennie-openai
- #17836 [codex] Add tmux-aware OSC 9 notifications @caseychow-oai
- #18820 Queue follow-up input during user shell commands @etraut-openai
- #18858 Stabilize debug clear memories integration test @jif-oai
- #18799 Move TUI app tests to modules they cover @etraut-openai
- #18442 Refactor app-server config loading into ConfigManager @pakrym-oai
- #18813 Split DeveloperInstructions into individual fragments. @pakrym-oai
- #18275 sandboxing: intersect permission profiles semantically @bolinfest
- #18862 Refresh generated Python app-server SDK types @sdcoffey
- #15578 Add Windows sandbox unified exec runtime support @iceweasel-oai
- #18429 app-server: add codex-device-key crate @euroelessar
- #18872 app-server: fix Bazel clippy in tracing tests @euroelessar
- #18885 skip busted tests while I fix them @iceweasel-oai
- #18873 chore: default multi-agent v2 fork to all @jif-oai




## rust-v0.122.0 — 2026-04-20

## New Features
- Standalone installs are more self-contained, and `codex app` now opens or installs Desktop correctly on Windows and Intel Macs (#17022, #18500).
- The TUI can open `/side` conversations for quick side questions, and queued input now supports slash commands and `!` shell prompts while work is running (#18190, #18542).
- Plan Mode can start implementation in a fresh context, with context-usage shown before deciding whether to carry the planning thread forward (#17499, #18573).
- Plugin workflows now include tabbed browsing, inline enable/disable toggles, marketplace removal, and remote, cross-repo, or local marketplace sources (#18222, #18395, #17752, #17751, #17277, #18017, #18246).
- Filesystem permissions now support deny-read glob policies, managed deny-read requirements, platform sandbox enforcement, and isolated `codex exec` runs that ignore user config or rules (#15979, #17740, #18096, #18646).
- Tool discovery and image generation are now enabled by default, with higher-detail image handling and original-detail metadata support for MCP and `js_repl` image outputs (#17854, #17153, #17714, #18386).

## Bug Fixes
- App-server approvals, user-input prompts, and MCP elicitations now disappear from the TUI when another client resolves them, instead of leaving stale prompts behind (#15134).
- Remote-control startup now tolerates missing ChatGPT auth, and MCP startup cancellation works again through app-server sessions (#18117, #18078).
- Resumed and forked app-server threads now replay token usage immediately so context/status UI starts with the restored state (#18023).
- Security-sensitive flows were tightened: logout revokes managed ChatGPT tokens, project hooks and exec policies require trusted workspaces, and Windows sandbox setup avoids broad user-profile and SSH-root grants (#17825, #14718, #18443, #18493).
- Sandboxed `apply_patch` writes work correctly with split filesystem policies, and file watchers now notice files created after watching begins (#18296, #18492).
- Several TUI rough edges were fixed, including fatal skills-list failures, invalid resume hints, duplicate context statusline entries, `/model` menu loops, redundant memory notices, and terminal title quoting in iTerm2 (#18061, #18059, #18054, #18154, #18580, #18261).

## Documentation
- Added a security-boundaries reference to `SECURITY.md` for sandboxing, approvals, and network controls (#17848, #18004).
- Documented custom MCP server approval defaults and exec-server stdin behavior (#17843, #18086).
- Updated app-server docs for plugin API changes, marketplace removal, resume/fork token-usage replay, and warning notifications (#17277, #17751, #18023, #18298).
- Added a short guide for the responses API proxy (#18604).

## Chores
- Split plugin and marketplace code into `codex-core-plugins`, moved more connector code into `connectors`, and continued breaking up the large core session/turn modules (#18070, #18158, #18200, #18206, #18244, #18249).
- Refactored config loading and `AGENTS.md` discovery behind narrower filesystem and manager abstractions (#18209, #18035).
- Stabilized Bazel and CI with flake fixes, native Rust test sharding, scoped repository caches, stronger Windows clippy coverage, and updated `rules_rs`/LLVM pins (#17791, #18082, #18366, #18350, #18397).
- Added core CODEOWNERS and a smaller development build profile (#18362, #18612).
- Removed the stale core `models.json` and updated release preparation to refresh the active model catalog (#18585).

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.121.0...rust-v0.122.0

- #17958 Support remote compaction for Azure responses providers @ivanmurashko
- #17848 [docs] Add security boundaries reference in SECURITY.md @evawong-oai
- #17990 Auto install start-codex-exec.sh dependencies @pakrym-oai
- #17892 Migrate archive/unarchive to local ThreadStore @wiltzius-openai
- #17989 [codex] Restore remote exec-server filesystem tests @starr-openai
- #15134 Dismiss stale app-server requests after remote resolution @ebrevdo
- #18002 Re-enable it @jif-oai
- #17885 feat: Support alternate marketplace manifests and local string @xl-openai
- #18003 [docs] Revert extra changes from PR 17848 @evawong-oai
- #17714 Support original-detail metadata on MCP image outputs @fjord-oai
- #17022 Significantly improve standalone installer @efrazer-oai
- #17853 [mcp] Add dummy tools for previously called but currently missing tools. @mzeng-openai
- #18004 [docs] Restore SECURITY.md update from PR 17848 @evawong-oai
- #17896 Clarify realtime v2 context and handoff messages @bxie-openai
- #17742 removing network proxy for yolo @won-openai
- #17999 [codex] Make command exec delta tests chunk tolerant @euroelessar
- #18033 feat: introduce codex-pr-body skill @bolinfest
- #17877 Display YOLO mode permissions if set when launching TUI @canvrno-oai
- #18022 Async config loading @pakrym-oai
- #17854 Update ToolSearch to be enabled by default @mzeng-openai
- #17831 [codex][mcp] Add resource uri meta to tool call item. @mzeng-openai
- #18070 Extract plugin loading and marketplace logic into codex-core-plugins @xl-openai
- #18078 Fix MCP startup cancellation through app server @etraut-openai
- #17151 [codex] Route Fed ChatGPT auth through Fed edge @jackz-oai
- #18006 fix: more flake @jif-oai
- #18127 fix: windows flake @jif-oai
- #18137 nit: add min values for memories @jif-oai
- #18135 debug: windows flake @jif-oai
- #18138 chore: more pollution filtering @jif-oai
- #18134 chore: unify memory drop endpoints @jif-oai
- #18144 nit: get rid of an expect @jif-oai
- #17791 Stabilize Bazel tests (timeout tweaks and flake fixes) @ddr-oai
- #18117 fix: auth preflight @jif-oai
- #18146 chore: use `justfile_directory` in just file @jif-oai
- #18085 [1/8] Add MCP server environment config @aibrahim-oai
- #18054 fix(tui): remove duplicate context statusline item @etraut-openai
- #17287 [code mode] defer mcp tools from exec description @sayan-oai
- #18057 Prefill rename prompt with current thread name @etraut-openai
- #18059 Fix invalid TUI resume hints @etraut-openai
- #17153 Launch image generation by default @won-openai
- #18042 Make yolo skip managed-network tool enforcement @won-openai
- #18154 fix: model menu pop @jif-oai
- #17826 [codex] Add remote thread store implementation @wiltzius-openai
- #18086 [2/8] Support piped stdin in exec process API @aibrahim-oai
- #18061 Avoid fatal TUI errors on skills list failure @etraut-openai
- #15979 feat(permissions): add glob deny-read policy support @viyatb-oai
- #18055 Improve external agent plugin migration for configured marketplaces @alexsong-oai
- #17425 Auto-upgrade configured marketplaces @xli-oai
- #18035 Refactor AGENTS.md discovery into AgentsMdManager @pakrym-oai
- #18158 Move more connector logic into connectors crate @pakrym-oai
- #17843 Add server-level approval defaults for custom MCP servers @mzeng-openai
- #18178 fix: drop lock earlier; was held across send_event().await unnecessarily @bolinfest
- #18000 Make thread unsubscribe test deterministic @starr-openai
- #17996 Add codex_hook_run analytics event @abhinav-oai
- #18184 fix: fix clippy issue in examples/ folder @bolinfest
- #18023 fix(app-server): replay token usage after resume and fork @fcoury-oai
- #18172 [codex] Make realtime startup context truncation deterministic @bxie-openai
- #18192 Throttle Windows Bazel test concurrency @starr-openai
- #18200 [codex] Split codex op handlers @pakrym-oai
- #17387 Register agent tasks behind use_agent_identity @adrian-openai
- #18026 Add OTEL metrics for hook runs @abhinav-oai
- #18092 [codex] Update realtime V2 VAD silence delay and 1.5 prompt @bxie-openai
- #18188 Add tabbed lists, single line rendering, col width changes @canvrno-oai
- #18206 [codex] Split codex turn logic @pakrym-oai
- #18169 Use codex-auto-review for guardian reviews @jeffsharris
- #18196 Use in-process app-server for unknown-thread MCP read test @mzeng-openai
- #18116 Move marketplace add under plugin command @xli-oai
- #18096 feat(sandbox): add glob deny-read platform enforcement @viyatb-oai
- #17971 fix: deprecate use_legacy_landlock feature flag @viyatb-oai
- #18209 Refactor config loading to use filesystem abstraction @pakrym-oai
- #17862 Stream apply_patch changes @akshaynathan
- #18244 Split codex session modules @pakrym-oai
- #17713 feat: add opt-in provider runtime abstraction @celia-oai
- #18182 feat: Handle alternate plugin manifest paths @xl-openai
- #18219 Move Computer Use tool suggestion to core @leoshimo-oai
- #18231 codex: split thread/read view loading @wiltzius-openai
- #18126 fix(exec-policy) rules parsing @dylan-hurd-oai
- #17825 [codex] Revoke ChatGPT tokens on logout @sashank-oai
- #18304 Fix Windows exec policy test flake @etraut-openai
- #17947 fix: reduce writable root @jif-oai
- #18246 Sync local plugin imports, async remote imports, refresh caches after… @alexsong-oai
- #18097 defer all tools behind feature flag @sayan-oai
- #17563 Add PermissionRequest hooks support @abhinav-oai
- #18338 nit: phase 2 ephemeral @jif-oai
- #18267 Support Ctrl+P/Ctrl+N in resume picker @etraut-openai
- #18261 fix(tui): use BEL for terminal title updates @etraut-openai
- #17740 feat(config): support managed deny-read requirements @viyatb-oai
- #18249 Move codex module under session @pakrym-oai
- #18351 Fix config-loader tests after filesystem abstraction race @bolinfest
- #18021 Guardian -> Auto-Review  @won-openai
- #18140 feat: config aliases @jif-oai
- #17232 Make app tool hint defaults pessimistic for app policies @colby-oai
- #17499 feat(tui): add clear-context plan implementation @fcoury-oai
- #18352 codex: route thread/read persistence through thread store @wiltzius-openai
- #18263 enable tool search over dynamic tools @sayan-oai
- #18350 ci: make Windows Bazel clippy catch core test imports @bolinfest
- #18362 Add core CODEOWNERS @aibrahim-oai
- #18366 ci: scope Bazel repository cache by job @bolinfest
- #17305 Add sorting/backwardsCursor to thread/list and new thread/turns/list api @ddr-oai
- #18020 [3/6] Add pushed exec process events @aibrahim-oai
- #12640 Update models.json @github-actions
- #18373 Show default reasoning in /status @aibrahim-oai
- #18379 Attribute automated PR Babysitter review replies @etraut-openai
- #18087 [4/6] Abstract MCP stdio server launching @aibrahim-oai
- #18370 perf(tui): defer startup skills refresh @fcoury-oai
- #18222  /plugins: Add v2 tabbed marketplace menu @canvrno-oai
- #18227 [codex] Propagate rate limit reached type @richardopenai
- #18380 exec-server: preserve fs helper runtime env @starr-openai
- #18381 Remove the tier constraint from connectors directory requests @xl-openai
- #18211 refactor: narrow async lock guard lifetimes @bolinfest
- #18017 [codex] Add cross-repo plugin sources to marketplace manifests @xli-oai
- #18398 refactor: use cloneable async channels for shared receivers @bolinfest
- #18296 fix: fix fs sandbox helper for apply_patch @viyatb-oai
- #18397 [codex] Upgrade rules_rs and llvm to latest BCR versions @zbarsky-openai
- #18082 bazel: use native rust test sharding @bolinfest
- #18384 Update image resizing to fit 2048 square bounds @pakrym-oai
- #17277 feat: Add remote plugin fields to plugin API @xl-openai
- #18395 /plugins: Add inline enablement toggles @canvrno-oai
- #14718 fix: trust-gate project hooks and exec policies @viyatb-oai
- #17891 [TUI] add external config migration prompt when start TUI @alexsong-oai
- #18369 Feat/auto review dev message marker @won-openai
- #18298 feat: Budget skill metadata and surface trimming as a warning @xl-openai
- #18449 [codex] Describe uninstalled cross-repo plugin reads @xli-oai
- #18220 [codex] Add owner nudge app-server API @richardopenai
- #17752 [codex] Add marketplace remove command and shared logic @xli-oai
- #18382 Add max context window model metadata @aibrahim-oai
- #18325 Revert "[codex] drain mailbox only at request boundaries" @jif-oai
- #18386 Update image outputs to default to high detail @pakrym-oai
- #18499 Fix plugin cache panic when cwd is unavailable @etraut-openai
- #18212 [5/6] Wire executor-backed MCP stdio @aibrahim-oai
- #18573 feat(tui): show context used in plan implementation prompt @fcoury-oai
- #18500 Support `codex app` on macOS (Intel) and Windows @etraut-openai
- #18542 Queue slash and shell prompts in the TUI @etraut-openai
- #18524 Add fallback source for external official marketplace @alexsong-oai
- #18571 Log realtime session id @aibrahim-oai
- #18585 Remove unused models.json @aibrahim-oai
- #18190 Add `/side` conversations @etraut-openai
- #18580 Avoid redundant memory enable notice @etraut-openai
- #18443 Do not grant Windows sandbox ACLs on USERPROFILE @efrazer-oai
- #18493 Filter Windows sandbox roots from SSH config dependencies @efrazer-oai
- #17978 Persist and prewarm agent tasks per thread @adrian-openai
- #18604 Add tldr docs for responses-api-proxy @andmis
- #18601 Soften Fast mode plan usage copy @pash-openai
- #18596 chore(multiagent) skills instructions toggle @dylan-hurd-oai
- #18599 fix(guardian) disable skills message in guardian thread @dylan-hurd-oai
- #18612 Create dev-small build profile @andmis
- #18440 Use thread IDs in TUI resume hints @etraut-openai
- #18605 TUI: remove simple legacy_core re-exports @etraut-openai
- #18625 Add `codex debug models` to show model catalog @andmis
- #18221 [codex] Add workspace owner usage nudge UI @richardopenai
- #17980 [codex] Use AgentAssertion downstream behind use_agent_identity @adrian-openai
- #17751 [codex] Add marketplace/remove app-server RPC @xli-oai
- #18644 feat: add mem 2 agent header @jif-oai
- #18353 chore: morpheus to path @jif-oai
- #18649 fix: main 2 @jif-oai
- #17721 Stabilize marketplace/remove installedRoot test @xli-oai
- #18492 fix: FS watcher when file does not exist yet @jif-oai
- #18646 feat: add `--ignore-user-config` and `--ignore-rules` @jif-oai
- #18652 nit: telepathy to chronicle in tests @jif-oai
- #18654 fix: exec policy loading for sub-agents @jif-oai
- #18651 feat: chronicle alias @jif-oai




## rust-v0.121.0 — 2026-04-15

## New Features
- Added `codex marketplace add` and app-server support for installing plugin marketplaces from GitHub, git URLs, local directories, and direct `marketplace.json` URLs (#17087, #17717, #17756).
- Added TUI prompt history improvements, including `Ctrl+R` reverse search and local recall for accepted slash commands (#17550, #17336).
- Added TUI and app-server controls for memory mode, memory reset/deletion, and memory-extension cleanup (#17632, #17626, #17913, #17937, #17844).
- Expanded MCP/plugin support with MCP Apps tool calls, namespaced MCP registration, parallel-call opt-in, and sandbox-state metadata for MCP servers (#17364, #17404, #17667, #17763).
- Added realtime and app-server APIs for output modality, transcript completion events, raw turn item injection, and symlink-aware filesystem metadata (#17701, #17703, #17719).
- Added a secure devcontainer profile with bubblewrap support, plus macOS sandbox allowlists for Unix sockets (#10431, #17547, #17654).

## Bug Fixes
- Fixed macOS sandbox/proxy handling for private DNS and removed the `danger-full-access` denylist-only network mode (#17370, #17732).
- Fixed Windows cwd/session matching so `resume --last` and `thread/list` work when paths use verbatim prefixes (#17414).
- Fixed rate-limit/account handling for `prolite` plans and made unknown WHAM plan values decodable (#17419).
- Made Guardian timeouts distinct from policy denials, with timeout-specific guidance and visible TUI history entries (#17381, #17486, #17521, #17557).
- Stabilized app-server behavior by avoiding premature thread unloads, tolerating failed trust persistence on startup, and skipping broken symlinks in `fs/readDirectory` (#17398, #17595, #17907).
- Fixed MCP/tool-call edge cases including flattened deferred tool names, elicitation timeout accounting, and empty namespace descriptions (#17556, #17566, #17946).

## Documentation
- Documented the secure devcontainer profile and its bubblewrap requirements (#10431, #17547).
- Added TUI composer documentation for history search behavior (#17550).
- Updated app-server docs for new MCP, marketplace, turn injection, memory reset, filesystem metadata, external-agent migration, and websocket token-hash APIs (#17364, #17717, #17703, #17913, #17719, #17855, #17871).
- Documented WSL1 bubblewrap limitations and WSL2 behavior (#17559).
- Added memory pipeline documentation for extension cleanup (#17844).

## Chores
- Hardened supply-chain and CI inputs by pinning GitHub Actions, cargo installs, git dependencies, V8 checksums, and cargo-deny source allowlists (#17471).
- Added Bazel release-build verification so release-only Rust code is compiled in PR CI (#17704, #17705).
- Introduced the `codex-thread-store` crate/interface and moved local thread listing behind it (#17659, #17824).
- Required reviewed pnpm dependency build scripts for workspace installs (#17558).
- Reduced Rust maintenance surface with broader absolute-path types and removal of unused helper APIs (#17407, #17792, #17146).

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.120.0...rust-v0.121.0

- #17087 Add marketplace command @xli-oai
- #17409 Fix Windows exec-server output test flake @etraut-openai
- #17381 representing guardian review timeouts in protocol types @won-openai
- #17399 TUI: enforce core boundary @etraut-openai
- #17370 fix: unblock private DNS in macOS sandbox @viyatb-oai
- #17396 update cloud requirements parse failure msg @alexsong-oai
- #17364 [mcp] Support MCP Apps part 3 - Add mcp tool call support. @mzeng-openai
- #17424 Stabilize marketplace add local source test @ningyi-oai
- #17414 Fix thread/list cwd filtering for Windows verbatim paths @etraut-openai
- #10431 feat(devcontainer): add separate secure customer profile @viyatb-oai
- #17314 Pass turn id with feedback uploads @ningyi-oai
- #17336 fix(tui): recall accepted slash commands locally @fcoury-oai
- #17430 Handle closed TUI input stream as shutdown @etraut-openai
- #17385 Add use_agent_identity feature flag @adrian-openai
- #17483 Update issue labeler agent labels @etraut-openai
- #17493 fix @aibrahim-oai
- #17419 Support prolite plan type @etraut-openai
- #17416 Clear /ps after /stop @etraut-openai
- #17415 Restore codex-tui resume hint on exit @etraut-openai
- #17402 chore: refactor name and namespace to single type @sayan-oai
- #17486 changing decision semantics after guardian timeout @won-openai
- #17521 Clarify guardian timeout guidance @won-openai
- #17547 [codex] Support bubblewrap in secure Docker devcontainer @viyatb-oai
- #17519 Budget realtime current thread context @aibrahim-oai
- #17556 [codex] Support flattened deferred MCP tool calls @fc-oai
- #17558 build(pnpm): require reviewed dependency build scripts @mcgrew-oai
- #17559 fix(sandboxing): reject WSL1 bubblewrap sandboxing @viyatb-oai
- #17520 Mirror user text into realtime @aibrahim-oai
- #17550 feat(tui): add reverse history search to composer @fcoury-oai
- #17420 Remove context status-line meter @etraut-openai
- #17506 Expose instruction sources (AGENTS.md) via app server @etraut-openai
- #17566 fix(mcp) pause timer for elicitations @dylan-hurd-oai
- #17406 Add MCP tool wall time to model output @pakrym-oai
- #17294 Run exec-server fs operations through sandbox helper @starr-openai
- #17605 Stabilize exec-server process tests @etraut-openai
- #17221 feat: ignore keyring on 0.0.0 @jif-oai
- #17216 Build remote exec env from exec-server policy @jif-oai
- #17633 nit: change consolidation model @jif-oai
- #17640 fix: stability exec server @jif-oai
- #17643 fix: dedup compact @jif-oai
- #17247 Make forked agent spawns keep parent model config @friel-openai
- #17470 Fix custom tool output cleanup on stream failure @etraut-openai
- #17417 Emit plan-mode prompt notifications for questionnaires @etraut-openai
- #17481 Wrap status reset timestamps in narrow layouts @etraut-openai
- #17601 Suppress duplicate compaction and terminal wait events @etraut-openai
- #17657 Fix TUI compaction item replay @etraut-openai
- #17595 Do not fail thread start when trust persistence fails @etraut-openai
- #17407 Use AbsolutePathBuf in skill loading and codex_home @pakrym-oai
- #17626 feat: disable memory endpoint @jif-oai
- #17365 Include legacy deny paths in elevated Windows sandbox setup @iceweasel-oai
- #17638 feat: Avoid reloading curated marketplaces for tool-suggest discovera… @jif-oai
- #17398 app-server: Only unload threads which were unused for some time @euroelessar
- #17669 only specify remote ports when the rule needs them @iceweasel-oai
- #17691 Fix tui compilation @davidhao3300
- #17384 Update phase 2 memory model to gpt-5.4 @kliu128
- #17395 Remove unnecessary tests @kliu128
- #17685 Cap realtime mirrored user turns @aibrahim-oai
- #17699 change realtime tool description @aibrahim-oai
- #17667 Add `supports_parallel_tool_calls` flag to included mcps @josiah-openai
- #17703 Add turn item injection API @pakrym-oai
- #17671 Stabilize exec-server filesystem tests in CI @starr-openai
- #17557 guardian timeout fix pr 3 - ux touch for timeouts @won-openai
- #17719 [codex] Add symlink flag to fs metadata @pakrym-oai
- #17146 [codex] Remove unused Rust helpers @pakrym-oai
- #17471 fix: pin inputs @viyatb-oai
- #17717 [codex] Refactor marketplace add into shared core flow @xli-oai
- #17747 Refactor plugin loading to async @pakrym-oai
- #17709 [codex] Initialize ICU data for code mode V8 @pakrym-oai
- #17749 [codex] drain mailbox only at request boundaries @tibo-openai
- #16640 [codex-analytics] feature plumbing and emittance @rhan-oai
- #17761 Tighten realtime handoff finalization @aibrahim-oai
- #17701 Add realtime output modality and transcript events @aibrahim-oai
- #17777 nit: feature flag @jif-oai
- #17637 feat: add context percent to status line @jif-oai
- #17665 Always enable original image detail on supported models @fjord-oai
- #17374 [codex-analytics] add session source to client metadata @marksteinbrick-oai
- #17489 Moving updated-at timestamps to unique millisecond times @ddr-oai
- #17784 feat: codex sampler @jif-oai
- #17732 fix: Revert danger-full-access denylist-only mode @viyatb-oai
- #17234 Redirect debug client output to a file @rasmusrygaard
- #17803 Keep image_detail_original as a removed feature flag @fjord-oai
- #17372 app-server: prepare to run initialized rpcs concurrently @euroelessar
- #17704 Refactor Bazel CI job setup @bolinfest
- #17674 Route apply_patch through the environment filesystem @starr-openai
- #17702 Fix remote skill popup loading @starr-openai
- #17830 [codex] Fix app-server initialized request analytics build @etraut-openai
- #17389 [codex-analytics] enable general analytics by default @rhan-oai
- #17659 thread store interface @wiltzius-openai
- #17792 Spread AbsolutePathBuf @pakrym-oai
- #17808 fix: apply patch bin refresh @jif-oai
- #17838 Add realtime wire trace logs @aibrahim-oai
- #17684 Adjust default tool search result caps @malone-oai
- #17705 Add Bazel verify-release-build job @bolinfest
- #17720 Make skill loading filesystem-aware @pakrym-oai
- #17756 [codex] Support local marketplace sources @xli-oai
- #17846 Fix for Guardian CI Tests stack overflow, applying Box to reduce stack pressure @won-openai
- #17855 support plugins in external agent config migration @alexsong-oai
- #17872 Disable hooks in guardian review sessions @abhinav-oai
- #17868 Wrap delegated input text @guinness-oai
- #17884 Fix clippy warnings in external agent config migration @canvrno-oai
- #17837 Reuse remote exec-server in core tests @starr-openai
- #17859 sandbox: remove dead seatbelt helper and update tests @bolinfest
- #17870 fix: cleanup the contract of the general-purpose exec() function @bolinfest
- #17871 fix: add websocket capability token hash support @viyatb-oai
- #17763 Send sandbox state through MCP tool metadata @aaronl-openai
- #17654 Support Unix socket allowlists in macOS sandbox @aaronl-openai
- #17915 fix: cargo deny @jif-oai
- #17913 feat: add endpoint to delete memories @jif-oai
- #17844 feat: cleaning of memories extension @jif-oai
- #17921 chore: exp flag @jif-oai
- #17917 [codex] Fix current main CI blockers @sayan-oai
- #17919 chore: do not disable memories for past rollouts on reset @jif-oai
- #17924 nit: stable test @jif-oai
- #17632 feat: memories menu @jif-oai
- #17404 register all mcp tools with namespace @sayan-oai
- #17941 nit: doc @jif-oai
- #17938 feat: sanitize rollouts before phase 1 @jif-oai
- #17937 feat: reset memories button @jif-oai
- #17883 Remove exec-server fs sandbox request preflight @pakrym-oai
- #17386 Register agent identities behind use_agent_identity @adrian-openai
- #17907 Fix fs/readDirectory to skip broken symlinks @willwang-openai
- #17960 chore(features) codex dependencies feat @dylan-hurd-oai
- #17965 fix: rename is_azure_responses_wire_base_url to is_azure_responses_provider @bolinfest
- #17946 Fix empty tool descriptions @shijie-oai
- #17824 [codex] Add local thread store listing @wiltzius-openai
- #17942 Add CLI update announcement @shijie-oai
- #17866 Refactor auth providers to mutate request headers @pakrym-oai
- #17902 app-server: track remote-control seq IDs per stream @euroelessar
- #17957 mcp: remove codex/sandbox-state custom request support @bolinfest
- #17953 fix: propagate log db @jif-oai
- #17920 chore(tui) cleanup @dylan-hurd-oai
- #17981 chore: tmp disable @jif-oai




## rust-v0.120.0 — 2026-04-11

## New Features
- Realtime V2 can now stream background agent progress while work is still running and queue follow-up responses until the active response completes (#17264, #17306)
- Hook activity in the TUI is easier to scan, with live running hooks shown separately and completed hook output kept only when useful (#17266)
- Custom TUI status lines can include the renamed thread title (#17187)
- Code-mode tool declarations now include MCP `outputSchema` details so structured tool results are typed more precisely (#17210)
- SessionStart hooks can distinguish sessions created by `/clear` from fresh startup or resume sessions (#17073)

## Bug Fixes
- Fixed Windows elevated sandbox handling for split filesystem policies, including read-only carveouts under writable roots (#14568)
- Fixed sandbox permission handling for symlinked writable roots and carveouts, preventing failures in shell and `apply_patch` workflows (#15981)
- Fixed `codex --remote wss://...` panics by installing the Rustls crypto provider before TLS websocket connections (#17288)
- Preserved tool search result ordering instead of alphabetically reordering results (#17263)
- Fixed live Stop-hook prompts so they appear immediately instead of only after thread history reloads (#17189)
- Fixed app-server MCP cleanup on disconnect so unsubscribed threads and resources are torn down correctly (#17223)

## Documentation
- Documented the elevated vs restricted-token Windows sandbox support split in the core README (#14568)
- Updated app-server protocol documentation for the new `/clear` SessionStart source (#17073)

## Chores
- Made rollout recording more reliable by retrying failed flushes and surfacing durability failures instead of dropping buffered items (#17214)
- Added analytics schemas and metadata wiring for compaction and Guardian review events (#17155, #17055)
- Improved Guardian follow-up efficiency by sending transcript deltas instead of repeatedly resending full history (#17269)
- Added stable Guardian review IDs across app-server events and internal approval state (#17298)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.119.0...rust-v0.120.0

- #17268 remove windows gate that disables hooks @iceweasel-oai
- #17267 Stop Realtime V2 response.done delegation @aibrahim-oai
- #14568 fix: support split carveouts in windows elevated sandbox @viyatb-oai
- #17263 preserve search results order in tool_search_output @sayan-oai
- #17189 Emit live hook prompts before raw-event filtering @abhinav-oai
- #17288 Install rustls provider for remote websocket client @etraut-openai
- #16969 Option to Notify Workspace Owner When Usage Limit is Reached @richardopenai
- #17278 Rename Realtime V2 tool to background_agent @aibrahim-oai
- #17280 Extract realtime input task handlers @aibrahim-oai
- #17249 adding parent_thread_id in guardian @won-openai
- #17264 Stream Realtime V2 background agent progress @aibrahim-oai
- #17210 Add output_schema to code mode render @vivi
- #16344 feat: move exec-server ownership @jif-oai
- #17214 feat: make rollout recorder reliable against errors @jif-oai
- #17223 fix: MCP leaks in app-server @jif-oai
- #17338 feat: description multi-agent v2 @jif-oai
- #17269 feat(guardian): send only transcript deltas on guardian followups @owenlin0
- #17306 Queue Realtime V2 response.create while active @aibrahim-oai
- #17352 fix: main @jif-oai
- #17363 Strengthen realtime backend delegation prompt @aibrahim-oai
- #17155 [codex-analytics] add compaction analytics event @rhan-oai
- #17187 Add thread title to configurable TUI status line @canvrno-oai
- #17194 add parent-id to guardian context @won-openai
- #17266 [codex] Improve hook status rendering @abhinav-oai
- #17073 Support clear SessionStart source @abhinav-oai
- #17298 fix(guardian, app-server): introduce guardian review ids @owenlin0
- #17391 Revert "Option to Notify Workspace Owner When Usage Limit is Reached" @shijie-oai
- #17371 app-server: add pipelined config rpc regression test @euroelessar
- #15981 fix(permissions): fix symlinked writable roots in sandbox permissions @viyatb-oai
- #17055 feat(analytics): add guardian review event schema @owenlin0




## rust-v0.119.0 — 2026-04-10

## New Features

- Realtime voice sessions now default to the v2 WebRTC path, with configurable transport, voice selection, native TUI media support, and app-server coverage for the new flow (#16960, #17057, #17058, #17093, #17097, #17145, #17165, #17176, #17183, #17188).
- MCP Apps and custom MCP servers gained richer support, including resource reads, tool-call metadata, custom-server tool search, server-driven elicitations, file-parameter uploads, and more reliable plugin cache refreshes (#16082, #16465, #16944, #17043, #15197, #16191, #16947).
- Remote/app-server workflows now support egress websocket transport, remote `--cd` forwarding, runtime remote-control enablement, sandbox-aware filesystem APIs, and an experimental `codex exec-server` subcommand (#15951, #16700, #16973, #16751, #17059, #17142, #17162).
- The TUI can copy the latest agent response with `Ctrl+O`, including better clipboard behavior over SSH and across platforms (#16966).
- `/resume` can now jump directly to a session by ID or name from the TUI (#17222).
- TUI notifications are more configurable, including Warp OSC 9 support and an opt-in mode for notifications even while the terminal is focused (#17174, #17175).

## Bug Fixes

- The TUI starts faster by fetching rate limits asynchronously, and `/status` now refreshes stale limits instead of showing frozen or misleading quota information (#16201, #17039).
- Resume flows are more stable: the picker no longer flashes false empty states, uses fresher thread names, stabilizes timestamp labels, preserves resume hints on zero-token exits, and avoids crashing when resuming the current thread (#16591, #16601, #16822, #16987, #17086).
- Composer and chat behavior are smoother, including fixed paste teardown, CJK word navigation, stale `/copy` output, percent-decoded local file links, and clearer truncated exec-output hints (#16202, #16829, #16648, #16810, #17076).
- Fast Mode no longer stays stuck on after `/fast off` in app-server-backed TUI sessions (#16833).
- MCP status and startup are less noisy and faster: hyphenated server names list tools correctly, `/mcp` avoids slow full inventory probes, disabled servers skip auth probing, and residency headers are honored by `codex mcp-server` (#16674, #16831, #17098, #16952).
- Sandbox, network, and platform edge cases were tightened, including clearer read-only `apply_patch` errors, refreshed network proxy policy after sandbox changes, suppressed irrelevant bubblewrap warnings, a macOS HTTP-client sandbox panic fix, and Windows firewall address handling (#16885, #17040, #16667, #16670, #17053).

## Documentation

- The README now uses the current ChatGPT Business plan name (#16348).
- Developer guidance for `argument_comment_lint` was updated to favor getting CI started instead of blocking on slow local lint runs (#16375).
- Obsolete `codex-cli` README content was removed to avoid stale setup guidance (#17096).
- `codex exec --help` now shows clearer usage and approval-mode wording (#16881, #16888).

## Chores

- `codex-core` was slimmed down through major crate extractions for MCP, tools, config, model management, auth, feedback, protocol, and related ownership boundaries (#15919, #16379, #16508, #16523, #16962).
- Rust CI and workspace guardrails were simplified by blocking new crate features and dropping routine `--all-features` runs (#16455, #16473).
- Core compile times were reduced by removing expensive async-trait expansion from hot tool/task abstractions (#16630, #16631).
- Bazel diagnostics and dependency wiring improved with compact execution logs, repository-cache persistence, remote downloader support, and several platform-specific build fixes (#16577, #16926, #16928, #16634, #16744).

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.118.0...rust-v0.119.0

- #16308 fix: one shot end of turn @jif-oai
- #16238 fix: ma2 @jif-oai
- #16317 chore: clean wait v2 @jif-oai
- #16318 nit: update aborted line @jif-oai
- #15771 feat: fork pattern v2 @jif-oai
- #16322 fix: update fork boundaries computation @jif-oai
- #16325 feat: restrict spawn_agent v2 to messages @jif-oai
- #16324 chore: drop interrupt from send_message @jif-oai
- #16345 fix: fix clippy issue caught by cargo but not bazel @bolinfest
- #16184 Route TUI `/feedback` submission through the app server @etraut-openai
- #16330 feat: log db better maintenance @jif-oai
- #15690 [codex-analytics] thread events @rhan-oai
- #16363 Fix PR babysitter review comment monitoring @etraut-openai
- #16356 Refactor external auth to use a single trait @etraut-openai
- #16366 Fix Windows external bearer refresh test @bolinfest
- #16353 ci: verify codex-rs Cargo manifests inherit workspace settings @bolinfest
- #16361 Refactor chatwidget tests into topical modules @etraut-openai
- #16201 Fix stale /status rate limits in active TUI sessions @etraut-openai
- #16351 ci: sync Bazel clippy lints and fix uncovered violations @bolinfest
- #16378 fix: suppress status card expect_used warnings after #16351 @bolinfest
- #16406 Use message string in v2 spawn_agent @jif-oai
- #16409 Use message string in v2 send_message @jif-oai
- #16419 Use message string in v2 assign_task @jif-oai
- #16424 feat: tasks can't be assigned to root agent @jif-oai
- #16425 nit: update wait v2 desc @jif-oai
- #16426 chore: interrupted as state @jif-oai
- #16427 nit: deny field v2 @jif-oai
- #16433 chore: drop log DB @jif-oai
- #16434 feat: auto vaccum state DB @jif-oai
- #16422 fix(core) rm execute_exec_request sandbox_policy @dylan-hurd-oai
- #16375 docs: update argument_comment_lint instructions in AGENTS.md @bolinfest
- #16449 fix: remove unused import @bolinfest
- #15772 Make fuzzy file search case insensitive @meyers-oai
- #16455 ci: block new workspace crate features @bolinfest
- #16456 cloud-tasks: split the mock client out of cloud-tasks-client @bolinfest
- #16457 tui: remove debug/test-only crate features @bolinfest
- #16467 tui: remove the voice-input crate feature @bolinfest
- #16379 Extract tool config into codex-tools @bolinfest
- #16469 otel: remove the last workspace crate feature @bolinfest
- #16471 Extract tool spec helpers into codex-tools @bolinfest
- #16473 ci: stop running rust CI with --all-features @bolinfest
- #16477 Extract tool discovery helpers into codex-tools @bolinfest
- #16480 login: treat provider auth refresh_interval_ms=0 as no auto-refresh @bolinfest
- #16448 fix(guardian): make GuardianAssessmentEvent.action strongly typed @owenlin0
- #16481 Extract update_plan tool spec into codex-tools @bolinfest
- #15919 Extract MCP into codex-mcp crate @aibrahim-oai
- #16482 Remove client_common tool re-exports @bolinfest
- #16495 fix: remove unused import @bolinfest
- #16493 Extract built-in tool spec constructors into codex-tools @bolinfest
- #16273 Fix regression: "not available in TUI" error message @etraut-openai
- #16497 Extract tool-search output helpers into codex-tools @bolinfest
- #16498 fix: guard guardian_command_source_tool_name with cfg(unix) @bolinfest
- #16499 Extract tool-suggest wire helpers into codex-tools @bolinfest
- #16284 Fix TUI app-server permission profile conversions @etraut-openai
- #16202 Fix paste-driven bottom pane completion teardown @etraut-openai
- #16504 core: use codex-tools config types directly @bolinfest
- #16503 Extract request_user_input normalization into codex-tools @bolinfest
- #16510 core: use codex-mcp APIs directly @bolinfest
- #16509 Extract code-mode nested tool collection into codex-tools @bolinfest
- #16512 core: remove cross-crate re-exports from lib.rs @bolinfest
- #16516 fix: add update to Cargo.lock that was missed in #16512 @bolinfest
- #16513 Extract tool registry planning into codex-tools @bolinfest
- #16521 Move tool registry plan tests into codex-tools @bolinfest
- #16523 [codex] Move config types into codex-config @bolinfest
- #16524 fix: move some test utilities out of codex-rs/core/src/tools/spec.rs @bolinfest
- #16529 [codex] Remove codex-core config type shim @bolinfest
- #16559 chore: memories mini model @jif-oai
- #16561 fix: race pending @jif-oai
- #16564 nit: lint @jif-oai
- #16566 fix: races in end of turn @jif-oai
- #16567 chore: rework state machine further @jif-oai
- #16569 nit: state machine desc @jif-oai
- #16571 chore: rename assign_task for followup_task @jif-oai
- #16577 ci: upload compact Bazel execution logs for bazel.yml @bolinfest
- #16581 chore: move codex-exec unit tests into sibling files @bolinfest
- #16590 Fix non-determinism in rules_rs/crate_git_repository.bzl @tyler-french
- #16604 test: deflake external bearer auth token tests on Windows @bolinfest
- #16606 fix: add more detail to test assertion @bolinfest
- #16608 fix: increase timeout to account for slow PowerShell startup @bolinfest
- #16591 Fix resume picker initial loading state @etraut-openai
- #16613 fix: increase another startup timeout for PowerShell @bolinfest
- #16601 Fix resume picker stale thread names @etraut-openai
- #16616 Fixed some existing labels and added a few new ones @etraut-openai
- #16588 Fix stale turn steering during TUI review follow-ups @etraut-openai
- #16617 fix: add shell fallback paths for pwsh/powershell that work on GitHub Actions Windows runners @bolinfest
- #16596 Fix fork source display in /status (expose forked_from_id in app server) @etraut-openai
- #16578 fix(tui): handle zellij redraw and composer rendering @fcoury-oai
- #16630 core: cut codex-core compile time 63% with native async ToolHandler @bolinfest
- #16631 core: cut codex-core compile time 48% with native async SessionTask @bolinfest
- #16492 Auto-trust cwd on thread start @aibrahim-oai
- #16633 fix: address unused variable on windows @bolinfest
- #16635 app-server: make thread/shellCommand tests shell-aware @bolinfest
- #16629 test: use cmd.exe for ProviderAuthScript on Windows @bolinfest
- #16634 build: fix Bazel lzma-sys wiring @starr-openai
- #16658 Fix deprecated login --api-key parsing @etraut-openai
- #16508 extract models manager and related ownership from core @aibrahim-oai
- #16662 fix: changes to test that should help them pass on Windows under Bazel @bolinfest
- #16665 fix: use COMSPEC in Windows unicode shell test @bolinfest
- #16668 fix: use cmd.exe in Windows unicode shell test @bolinfest
- #16626 remove temporary ownership re-exports @aibrahim-oai
- #16648 Fix stale /copy output after commentary-only turns @etraut-openai
- #16674 Fix MCP tool listing for hyphenated server names @etraut-openai
- #16667 Suppress bwrap warning when sandboxing is bypassed @etraut-openai
- #16670 Fix macOS sandbox panic in Codex HTTP client @etraut-openai
- #16699 Fix macOS malloc diagnostics leaking into TUI composer @etraut-openai
- #16700 Add remote --cd forwarding for app-server sessions @etraut-openai
- #16707 fix: preserve platform-specific core shell env vars @bolinfest
- #16715 fix: address clippy violations that sneaked in @bolinfest
- #16722 fix windows-only clippy lint violation @bolinfest
- #16710 fix(tui): sort skill mentions by display name first @fcoury-oai
- #16709 Sanitize forked child history @aibrahim-oai
- #16711 Fix Windows Bazel app-server trust tests @bolinfest
- #16720 Remove OPENAI_BASE_URL config fallback @etraut-openai
- #16528 Codex/windows bazel rust test coverage no rs @bolinfest
- #16450 bazel: lint rust_test targets in clippy workflow @bolinfest
- #16735 [codex] allow disabling prompt instruction blocks @tibo-openai
- #16745 [codex] allow disabling environment context injection @tibo-openai
- #16725 Preempt mailbox mail after reasoning/commentary items @aibrahim-oai
- #16755 Use Node 24 for npm publish @aibrahim-oai
- #16753 [codex] add responses proxy JSON dumps @tibo-openai
- #16746 Add spawn context for MultiAgentV2 children @aibrahim-oai
- #16757 Back out "bazel: lint rust_test targets in clippy workflow (#16450)" @bolinfest
- #16737 test: avoid PowerShell startup in Windows auth fixture @bolinfest
- #16740 ci: align Bazel repo cache and Windows clippy target handling @bolinfest
- #16758 [codex] add context-window lineage headers @tibo-openai
- #16763 Add CODEX_SKIP_VENDORED_BWRAP @andmis
- #15915 [codex-analytics] subagent analytics @rhan-oai
- #16823 Fix flaky test relating to metadata remote URL @etraut-openai
- #16825 Fix flaky permissions escalation test on Windows @etraut-openai
- #16881 Fix misleading codex exec help usage @etraut-openai
- #16888 Clarify `codex exec` approval help @etraut-openai
- #16876 [codex] add response proxy subagent header test @tibo-openai
- #16829 Fix CJK word navigation in the TUI composer @etraut-openai
- #16833 Fix TUI fast mode toggle regression @etraut-openai
- #16795 [regression] Fix ephemeral turn backfill in exec @etraut-openai
- #16822 Fix resume picker timestamp labels and stability @etraut-openai
- #16813 Annotate skill doc reads with skill names @etraut-openai
- #16810 (tui): Decode percent-escaped bare local file links @etraut-openai
- #16877 [codex-backend] Make thread metadata updates tolerate pending backfill @joeytrasatti-openai
- #16701 feat(requirements): support allowed_approval_reviewers @owenlin0
- #16925 fix(bazel): fix simdutf @owenlin0
- #16926 bazel: Always save bazel repository cache @euroelessar
- #16928 bazel: Enable `--experimental_remote_downloader` @euroelessar
- #16462 fix(guardian): fix ordering of guardian events @owenlin0
- #16924 fix(sqlite): don't hard fail migrator if DB is newer @owenlin0
- #16744 build: restore lzma-sys Bazel wiring for devbox codex run @starr-openai
- #16764 app-server: centralize AuthManager initialization @euroelessar
- #16939 Fix clippy warning @mzeng-openai
- #16923 Revert "[codex-backend] Make thread metadata updates tolerate pending backfill" @joeytrasatti-openai
- #15951 app-server: Add egress websocket transport @euroelessar
- #16945 [codex] Allow PyTorch libomp shm in Seatbelt @viyatb-oai
- #16947 feat: fallback curated plugin download from backend endpint. @xl-openai
- #16191 feat: refresh non-curated cache from plugin list. @xl-openai
- #16952 Respect residency requirements in mcp-server @etraut-openai
- #16827 tui: route device-code auth through app server @etraut-openai
- #16638 [codex-analytics] add protocol-native turn timestamps @rhan-oai
- #16831 Speed up /mcp inventory listing @etraut-openai
- #16349 Disable env-bound tools when exec server is none @starr-openai
- #16957 Promote image_detail_original to experimental @fjord-oai
- #16962 Refactor config types into a separate crate @pakrym-oai
- #16153 Add setTimeout support to code mode @pakrym-oai
- #16961 app-server: Unify config changes handling a bit @euroelessar
- #16890 Validate exec input before starting app-server @etraut-openai
- #16082 [mcp] Support MCP Apps part 1. @mzeng-openai
- #15893 fix: warn when bwrap cannot create user namespaces @viyatb-oai
- #16946 [codex] Add danger-full-access denylist-only network mode @viyatb-oai
- #16972 app-server: Fix compilation of a test in mcp_resource @euroelessar
- #15826 Make AGENTS.md discovery FS-aware @pakrym-oai
- #16964 Honor null thread instructions @aibrahim-oai
- #16988 collapse dev message into one @won-openai
- #16724 [codex] ez - rename env=>request in codex-rs/core/src/unified_exec/process_manager.rs @starr-openai
- #16999 feat: empty role ok @jif-oai
- #17002 chore: debug flag to hide some parameters @jif-oai
- #17005 feat: drop agent ID from v2 @jif-oai
- #17008 chore: send_message and followup_task do not return anything @jif-oai
- #17007 chore: hide nickname for debug flag @jif-oai
- #16442 feat: /feedback cascade @jif-oai
- #16978 [codex] reduce module visibility @pakrym-oai
- #17009 chore: keep request_user_input tool to persist cache on multi-agents @jif-oai
- #16739 Stabilize flaky multi-agent followup interrupt test @etraut-openai
- #16885 Fix read-only apply_patch rejection message @etraut-openai
- #16882 Fix nested exec thread ID restore @etraut-openai
- #16976 Preserve null developer instructions @aibrahim-oai
- #16987 Fix missing resume hint on zero-token exits @etraut-openai
- #16912 feat(analytics): generate an installation_id and pass it in responsesapi client_metadata @owenlin0
- #16956 fix(guardian): don't throw away transcript when over budget @owenlin0
- #16981 [codex] Make AbsolutePathBuf joins infallible @pakrym-oai
- #16348 Update README @romainhuet
- #16977 [codex] Make unified exec tests remote aware @pakrym-oai
- #16465 [mcp] Support MCP Apps part 2 - Add meta to mcp tool call result. @mzeng-openai
- #17026 app-server: Move watch_id to request of fs/watch @euroelessar
- #16980 Add full-ci branch trigger @pakrym-oai
- #16973 app-server: Allow enabling remote control in runtime @euroelessar
- #17032 [codex] Fix unified exec test build @pakrym-oai
- #17031 fix(core) revert Command line in unified exec output @dylan-hurd-oai
- #17027 [codex] Migrate apply_patch to executor filesystem @pakrym-oai
- #17044 [app-server-protocol] introduce generic ServerResponse for app-server-protocol @rhan-oai
- #17047 fix(app-server) revert null instructions changes @dylan-hurd-oai
- #16960 Add WebRTC transport to realtime start @aibrahim-oai
- #17053 Fix remote address format to work with Windows Firewall rules. @iceweasel-oai
- #17048 [codex] Apply patches through executor filesystem @pakrym-oai
- #16949 Use model metadata for Fast Mode status @pash-openai
- #17039 fix(tui): reduce startup and new-session latency @fcoury-oai
- #17052 Add regression tests for JsonSchema @vivi
- #17059 Add remote exec start script @pakrym-oai
- #17064 Add project-local codex bug triage skill @etraut-openai
- #17040 fix: refresh network proxy settings when sandbox mode changes @viyatb-oai
- #16698 Remove expired April 2nd tooltip copy @etraut-openai
- #17096 Remove obsolete codex-cli README @etraut-openai
- #16875 Support anyOf and enum in JsonSchema @vivi
- #16880 Render function attribute descriptions @vivi
- #16879 Render namespace description for tools @vivi
- #16582 feat: single app-server bootstrap in TUI @jif-oai
- #17117 codex debug 1 (guardian approved) @jif-oai
- #17119 codex debug 3 (guardian approved) @jif-oai
- #17121 codex debug 5 (guardian approved) @jif-oai
- #17123 codex debug 7 (guardian approved) @jif-oai
- #17125 codex debug 9 (guardian approved) @jif-oai
- #17127 codex debug 11 (guardian approved) @jif-oai
- #17129 codex debug 13 (guardian approved) @jif-oai
- #17131 codex debug 15 (guardian approved) @jif-oai
- #17118 codex debug 2 (guardian approved) @jif-oai
- #17120 codex debug 4 (guardian approved) @jif-oai
- #17122 codex debug 6 (guardian approved) @jif-oai
- #17124 codex debug 8 (guardian approved) @jif-oai
- #17126 codex debug 10 (guardian approved) @jif-oai
- #17128 codex debug 12 (guardian approved) @jif-oai
- #17130 codex debug 14 (guardian approved) @jif-oai
- #17071 Configure multi_agent_v2 spawn agent hints @pakrym-oai
- #17091 Show global AGENTS.md in /status @etraut-openai
- #17086 Fix TUI crash when resuming the current thread @etraut-openai
- #17098 Skip MCP auth probing for disabled servers @etraut-openai
- #17097 Add realtime transport config @aibrahim-oai
- #17043 [mcp] Support server-driven elicitations @mzeng-openai
- #17058 Add WebRTC media transport to realtime TUI @aibrahim-oai
- #17063 Use AbsolutePathBuf for exec cwd plumbing @pakrym-oai
- #17138 fix(debug-config, guardian): fix /debug-config rendering and guardian… @owenlin0
- #17046 release ready, enabling only for siwc users @won-openai
- #16751 Add sandbox support to filesystem APIs @starr-openai
- #17142 [codex] Support remote exec cwd in TUI startup @pakrym-oai
- #17149 Fix missing fields @canvrno-oai
- #17154 Fix ToolsConfigParams initializer in tool registry test @won-openai
- #17145 Wire realtime WebRTC native media into Bazel @aibrahim-oai
- #17057 Attach WebRTC realtime starts to sideband websocket @aibrahim-oai
- #17162 Add top-level exec-server subcommand @starr-openai
- #17061 Update guardian output schema @maja-openai
- #17164 Auto-approve MCP server elicitations in Full Access mode @leoshimo-oai
- #17093 Add WebRTC realtime app-server e2e tests @aibrahim-oai
- #17174 Support Warp for OSC 9 notifications @etraut-openai
- #16646 Fix stale thread-name resume lookups @etraut-openai
- #17165 Move default realtime prompt into core @aibrahim-oai
- #17176 Add realtime voice selection @aibrahim-oai
- #17175 Add TUI notification condition config @etraut-openai
- #17183 Default realtime startup to v2 model @aibrahim-oai
- #17186 Skip update prompts for source builds @etraut-openai
- #17188 make webrtc the default experience @aibrahim-oai
- #17163 [codex] Defer steering until after sampling the model post-compaction @jgershen-oai
- #17222 feat: /resume per ID/name @jif-oai
- #17226 feat: advanced announcements per OS and plans @jif-oai
- #17170 Render statusline context as a meter @etraut-openai
- #17217 Skip local shell snapshots for remote unified exec @jif-oai
- #17116 chore: merge name and title @jif-oai
- #16276 [codex] add memory extensions @kliu128
- #17168 refactor(proxy): clarify sandbox block messages @viyatb-oai
- #17076 [codex] Show ctrl + t hint on truncated exec output in TUI @mom-oai
- #15197 Add Codex Apps sediment file remapping @caseychow-oai
- #16009 Forward app-server turn clientMetadata to Responses @neil-oai
- #17256 app-server: Use shared receivers for app-server message processors @euroelessar
- #16944 [mcp] Expand tool search to custom MCPs. @mzeng-openai
- #16966 feat(tui): Ctrl+O copy hotkey and harden copy-as-markdown behavior @fcoury-oai
- #17262 app-server: Fix clippy by removing extra `mut` @euroelessar
- #17258 Omit empty app-server instruction overrides @aibrahim-oai




## rust-v0.118.0 — 2026-03-31

## New Features
- Windows sandbox runs can now enforce proxy-only networking with OS-level egress rules, instead of relying on environment variables alone. (#12220)
- App-server clients can now start ChatGPT sign-in with a device code flow, which helps when browser callback login is unreliable or unavailable. (#15525)
- `codex exec` now supports the prompt-plus-stdin workflow, so you can pipe input and still pass a separate prompt on the command line. (#15917)
- Custom model providers can now fetch and refresh short-lived bearer tokens dynamically, instead of being limited to static credentials from config or environment variables. (#16286, #16287, #16288)

## Bug Fixes
- Project-local `.codex` files are now protected even on first creation, closing a gap where the initial write could bypass normal approval checks. (#15067)
- Linux sandbox launches are more reliable because Codex once again finds a trusted system `bwrap` on normal multi-entry `PATH`s. (#15791, #15973)
- The app-server-backed TUI regained several missing workflows: hook notifications replay correctly, `/copy` and `/resume <name>` work again, `/agent` no longer shows stale threads, and the skills picker scrolls past the first page. (#16013, #16021, #16050, #16014, #16109, #16110)
- MCP startup is more robust: local servers get a longer startup window, and failed handshakes surface warnings in the TUI again instead of looking like clean startups. (#16080, #16041)
- On Windows, `apply_patch` is less likely to fail because it no longer adds redundant writable roots that could trigger unnecessary ACL churn. (#16030)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.117.0...rust-v0.118.0

- #15891 [plugins] Polish tool suggest prompts. @mzeng-openai
- #15791 fix: resolve bwrap from trusted PATH entry @viyatb-oai
- #15900 skills: remove unused skill permission metadata @bolinfest
- #15811 app-server: Split transport module @euroelessar
- #15067 Protect first-time project .codex creation across Linux and macOS sandboxes @rreichel3-oai
- #15903 [codex] import token_data from codex-login directly @bolinfest
- #15897 sandboxing: use OsString for SandboxCommand.program @bolinfest
- #15910 docs: update AGENTS.md to discourage adding code to codex-core @bolinfest
- #15898 chore: move bwrap config helpers into dedicated module @viyatb-oai
- #15906 chore: remove skill metadata from command approval payloads @bolinfest
- #15909 fix(network-proxy): fail closed on network-proxy DNS lookup errors @viyatb-oai
- #14495 Preserve bazel repository cache in github actions @siggisim
- #15522 bazel: re-organize bazelrc @sluongng
- #15923 codex-tools: extract shared tool schema parsing @bolinfest
- #15918 permissions: remove macOS seatbelt extension profiles @bolinfest
- #12220 feat(windows-sandbox): add network proxy support @viyatb-oai
- #15931 fix: make MACOS_DEFAULT_PREFERENCES_POLICY part of MACOS_SEATBELT_BASE_POLICY @bolinfest
- #15933 fix: use matrix.target instead of matrix.os for actions/cache build action @bolinfest
- #15928 codex-tools: extract MCP schema adapters @bolinfest
- #15948 fix: increase timeout for rust-ci to 45 minutes for now @bolinfest
- #15921 [app-server-protocol] introduce generic ClientResponse for app-server-protocol @rhan-oai
- #15120 chore: refactor network permissions to use explicit domain and unix socket rule maps @celia-oai
- #15525 Add ChatGPT device-code login to app server @daniel-oai
- #15876 chore: drop useless stuff @jif-oai
- #15954 chore: move pty and windows sandbox to Rust 2024 @bolinfest
- #15986 feat: spawn v2 make task name as mandatory @jif-oai
- #16000 Use codex-utils-template for login error page @jif-oai
- #16001 Use codex-utils-template for review prompts @jif-oai
- #15998 Use codex-utils-template for sandbox mode prompts @jif-oai
- #15995 Use codex-utils-template for collaboration mode presets @jif-oai
- #15996 Use codex-utils-template for search tool descriptions @jif-oai
- #15999 Use codex-utils-template for review exit XML @jif-oai
- #15985 feat: spawn v2 as inter agent communication @jif-oai
- #15973 fix(sandbox): fix bwrap lookup for multi-entry PATH @viyatb-oai
- #15944 codex-tools: extract dynamic tool adapters @bolinfest
- #15955 ci: add Bazel clippy workflow for codex-rs @bolinfest
- #15953 codex-tools: introduce named tool definitions @bolinfest
- #16027 fix: fix Windows CI regression introduced in #15999 @bolinfest
- #16036 fix: disable plugins in SDK integration tests @bolinfest
- #15946 Normalize /mcp tool grouping for hyphenated server names @pakrym-oai
- #16035 plugins: Clean up stale curated plugin sync temp dirs and add sync metrics @xl-openai
- #15934 Add usage-based business plan types @bwanner-oai
- #16031 codex-tools: extract responses API tool models @bolinfest
- #16013 Fix tui_app_server hook notification rendering and replay @etraut-openai
- #16021 Fix /copy regression in tui_app_server turn completion @etraut-openai
- #16044 [mcp] Bypass read-only tool checks. @mzeng-openai
- #16030 don't include redundant write roots in apply_patch @iceweasel-oai
- #15922 Remove the legacy TUI split @etraut-openai
- #15828 [codex] Pin GitHub Actions workflow references @hintz-openai
- #16046 ci: run SDK tests with a Bazel-built codex @bolinfest
- #16050 Fix tui_app_server resume-by-name lookup regression @etraut-openai
- #16014 Fix tui_app_server agent picker closed-state regression @etraut-openai
- #16054 chore: clean up argument-comment lint and roll out all-target CI on macOS @bolinfest
- #15917 Support Codex CLI stdin piping for `codex exec` @jliccini
- #16057 shell-command: reuse a PowerShell parser process on Windows @bolinfest
- #16063 refactor: rewrite argument-comment lint wrappers in Python @bolinfest
- #15952 bazel: enable the full Windows gnullvm CI path @bolinfest
- #16067 ci: run Bazel clippy on Windows gnullvm @bolinfest
- #16071 fix: clean up remaining Windows argument-comment-lint violations @bolinfest
- #16072 ci: split fast PR Rust CI from full post-merge Cargo CI @bolinfest
- #16074 bazel: add Windows gnullvm stack flags to unit test binaries @bolinfest
- #16026 fix(tui): refresh footer on collaboration mode changes @fcoury
- #16112 Update PR babysitter skill for review replies and resolution @etraut-openai
- #16104 Rename tui_app_server to tui @etraut-openai
- #16118 fix: fix comment linter lint violations in Linux-only code @bolinfest
- #16106 build: migrate argument-comment-lint to a native Bazel aspect @bolinfest
- #16115 Remove remaining custom prompt support @etraut-openai
- #16116 Remove the codex-tui app-server originator workaround @etraut-openai
- #16047 codex-tools: extract tool spec models @bolinfest
- #16128 bazel: refresh the expired macOS SDK pin @bolinfest
- #16129 codex-tools: extract configured tool specs @bolinfest
- #16130 ci: keep rust-ci-full Windows argument-comment-lint on packaged wrapper @bolinfest
- #16126 core: fix stale curated plugin cache refresh races @bolinfest
- #16132 codex-tools: extract code mode tool spec adapters @bolinfest
- #16136 ci: use BuildBuddy for rust-ci-full non-Windows argument-comment-lint @bolinfest
- #16137 exec: make review-policy tests hermetic @bolinfest
- #16109 Fix skills picker scrolling in tui app server @etraut-openai
- #16138 codex-tools: extract local host tool specs @bolinfest
- #16114 Remove TUI voice transcription feature @etraut-openai
- #16080 [mcp] Increase MCP startup timeout. @mzeng-openai
- #16141 codex-tools: extract collaboration tool specs @bolinfest
- #16041 Fix app-server TUI MCP startup warnings regression @etraut-openai
- #16110 Fix tui_app_server ghost subagent entries in /agent @etraut-openai
- #16154 codex-tools: extract utility tool specs @bolinfest
- #16204 [codex] Normalize Windows path in MCP startup snapshot test @etraut-openai
- #16010 feat: add mailbox concept for wait @jif-oai
- #16237 fix: ma1 @jif-oai
- #16193 codex-tools: extract discovery tool specs @bolinfest
- #16254 codex-tools: extract discoverable tool models @bolinfest
- #16253 fix: close Bazel argument-comment-lint CI gaps @bolinfest
- #16225 [codex-analytics] refactor analytics to use reducer architecture @rhan-oai
- #16279 Update code mode exec() instructions @andmis
- #16120 ci: run Windows argument-comment-lint via native Bazel @bolinfest
- #16286 auth: generalize external auth tokens for bearer-only sources @bolinfest
- #16287 auth: let AuthManager own external bearer auth @bolinfest
- #16288 core: support dynamic auth tokens for model providers @bolinfest




## rust-v0.117.0 — 2026-03-26

## New Features
- Plugins are now a first-class workflow: Codex can sync product-scoped plugins at startup, browse them in `/plugins`, and install or remove them with clearer auth/setup handling. (#15041, #15042, #15195, #15215, #15217, #15264, #15275, #15342, #15580, #15606, #15802)
- Sub-agents now use readable path-based addresses like `/root/agent_a`, with structured inter-agent messaging and agent listing for multi-agent v2 workflows. (#15313, #15515, #15556, #15570, #15621, #15647)
- The `/title` terminal-title picker now works in both the classic TUI and the app-server TUI, making parallel sessions easier to tell apart. (#12334, #15860)
- App-server clients can now send `!` shell commands, watch filesystem changes, and connect to remote websocket servers with bearer-token auth. (#14988, #14533, #14847, #14853)
- Image workflows got smoother: `view_image` now returns image URLs for code mode, generated images are reopenable from the TUI, and image-generation history survives resume. (#15072, #15154, #15223)
- Prompt history recall now works in the app-server TUI, including across sessions. (#14945)

## Bug Fixes
- `tui_app_server` no longer duplicates live reasoning summaries or `/review` output, and it preserves transcript text instead of dropping it under backpressure. (#15758, #15839, #15759)
- ChatGPT login in `tui_app_server` now opens the local browser again, cancels cleanly on `Ctrl+C`, and no longer fails startup when you're logged out. (#15672, #15673, #15670)
- Early exits now restore terminal state reliably, avoiding broken shell state after quitting; tmux users also get a working queued-message edit shortcut on `Shift+Left`. (#15671, #15480)
- Linux sandboxed tool calls are more reliable on older distributions with older `bubblewrap`, and Windows restricted-token sandboxing now supports more split-policy carveout layouts. (#15693, #14172)
- Remote multi-agent sessions now show agent names instead of raw IDs and recover more gracefully from stale turn-steering races. (#15513, #15714, #15163)
- Plugin-backed mentions and product gating now behave more predictably, fixing cases where explicit mentions lost context or plugins were filtered incorrectly. (#15372, #15263, #15279)

## Documentation
- Expanded the app-server and exec-server docs/schema fixtures to cover exec-server setup, filesystem watch RPCs, realtime transcript notifications, and the new Python `thread.run(...)` quickstart flow. (#15089, #14533, #15344, #15088)

## Chores
- The app-server-backed TUI is now enabled by default, and the plugin/app rollout flags have been flipped on in normal builds. (#15661, #15713, #15719, #15820)
- Removed the legacy artifact tool and retired the old `read_file` and `grep_files` handlers as part of ongoing tool-surface cleanup. (#15851, #15864, #15773, #15775)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.116.0...rust-v0.117.0

- #14945 feat(tui): restore composer history in app-server tui @fcoury
- #15092 fix: try to fix "Stage npm package" step in ci.yml @bolinfest
- #15075 Propagate tool errors to code mode @pakrym-oai
- #15072 Return image URL from view_image tool @pakrym-oai
- #15076 Add a startup deprecation warning for custom prompts @etraut-openai
- #15102 Revert "fix: harden plugin feature gating" @xl-openai
- #15077 Add final message prefix to realtime handoff output @aibrahim-oai
- #13494 Align SQLite feedback logs with feedback formatter @charley-oai
- #14888 Feat: reuse persisted model and reasoning effort on thread resume @shijie-oai
- #15111 don't add transcript for v2 realtime @aibrahim-oai
- #15103 Add update_plan code mode result @pakrym-oai
- #15100 Add apply_patch code mode result @pakrym-oai
- #15104 fix: harden plugin feature gating @xl-openai
- #15089 Add exec-server stub server and protocol docs @starr-openai
- #15042 Support featured plugins @alexsong-oai
- #15088 Add Python SDK thread.run convenience methods @shaqayeq-oai
- #15119 Remove stdio transport from exec server @pakrym-oai
- #14632 feat(core, tracing): create turn spans over websockets @owenlin0
- #15011 Forward session and turn headers to MCP HTTP requests @nicholasclark-openai
- #15118 [hooks] turn_id extension for Stop & UserPromptSubmit @eternal-openai
- #14970 Simple directory mentions @canvrno-oai
- #14988 Add thread/shellCommand to app server API surface @etraut-openai
- #15041 feat: support product-scoped plugins. @xl-openai
- #15056 feat: add graph representation of agent network @jif-oai
- #15163 fix: case where agent is already closed @jif-oai
- #15125 Move environment abstraction into exec server @pakrym-oai
- #15180 chore: add metrics for profile @jif-oai
- #15175 chore: morpheus does not generate memories @jif-oai
- #15185 Revert "Forward session and turn headers to MCP HTTP requests" @nicholasclark-openai
- #14867 [hooks] use a user message > developer message for prompt continuation @eternal-openai
- #15196 Add experimental exec server URL handling @pakrym-oai
- #15198 Publish runnable DotSlash package for argument-comment lint @bolinfest
- #15090 Add exec-server process and filesystem RPCs @starr-openai
- #15201 Log automated reviewer approval sources distinctly @gabec-openai
- #12334 feat(tui): add /title terminal title configuration @yvolovich-cyber
- #15206 feat(tracing): tag app-server turn spans with turn_id @owenlin0
- #15216 Move terminal module to terminal-detection crate @aibrahim-oai
- #15207 add specific tool guidance for Windows destructive commands @iceweasel-oai
- #15154 adding full imagepath to tui @won-openai
- #15217 feat: expose needs_auth for plugin/read. @xl-openai
- #15190 Plumb MCP turn metadata through _meta @nicholasclark-openai
- #15220 feat(app-server): add mcpServer/startupStatus/updated notification @owenlin0
- #15222 changed save directory to codex_home @won-openai
- #15232 Refactor ExecServer filesystem split between local and remote @pakrym-oai
- #15021 V8 Bazel Build @cconger
- #15150 Move auth code into login crate @aibrahim-oai
- #15195 [plugins] Install MCPs when calling plugin/install @mzeng-openai
- #15254 core: add a full-buffer exec capture policy @bolinfest
- #15263 fix: Distinguish missing and empty plugin products @xl-openai
- #15253 Split features into codex-features crate @aibrahim-oai
- #15233 Split exec process into local and remote implementations @starr-openai
- #15199 Use released DotSlash package for argument-comment lint @bolinfest
- #15215 Initial plugins TUI menu - list and read only. tui + tui_app_server @canvrno-oai
- #15252 Disable hooks on windows for now @eternal-openai
- #15264 feat: Add One-Time Startup Remote Plugin Sync @xl-openai
- #15262 Add guardian follow-up reminder @charley-oai
- #15223 Feat/restore image generation history @won-openai
- #15275 feat: prefer git for curated plugin sync  @xl-openai
- #14869 Add remote env CI matrix and integration test @pakrym-oai
- #15218 Add temporary app-server originator fallback for codex-tui @etraut-openai
- #15328 try to fix bazel @jif-oai
- #15324 Add remote test skill @pakrym-oai
- #15313 feat: change multi-agent to use path-like system instead of uuids @jif-oai
- #15244 Pin Python SDK app-server stdio to UTF-8 on Windows @shaqayeq-oai
- #15337 Bump aws-lc-rs @cconger
- #15203 Add v8-poc consumer of our new built v8 @cconger
- #15273 [apps] Use ARC for yolo mode. @mzeng-openai
- #15128 chore(core) Remove Feature::PowershellUtf8 @dylan-hurd-oai
- #15344 Add realtime transcript notification in v2 @aibrahim-oai
- #15285 Gate tui /plugins menu behind flag @canvrno-oai
- #15114 fix: allow restricted filesystem profiles to read helper executables @celia-oai
- #15231 chore(core) update prefix_rule guidance @dylan-hurd-oai
- #15036 fix(core) disable command_might_be_dangerous when unsandboxed @dylan-hurd-oai
- #15348 Pass platform param to featured plugins @alexsong-oai
- #15276 Code mode on v8 @cconger
- #15372 [plugins] Fix plugin explicit mention context management. @mzeng-openai
- #15366 chore(context) Include guardian approval context @dylan-hurd-oai
- #15390 Remove legacy app-server notification handling from tui_app_server @etraut-openai
- #15409 Add JIT entitlement for macosx @cconger
- #15414 Remove legacy auth and notification handling from tui_app_server @etraut-openai
- #15376 [apps] Improve app tools loading for TUI. @mzeng-openai
- #15415 chore(exec_policy) ExecPolicyRequirementScenario tests @dylan-hurd-oai
- #15464 Remove smart_approvals alias migration @charley-oai
- #15443 core: snapshot fork startup context injection @charley-oai
- #15480 Use Shift+Left to edit queued messages in tmux @charley-oai
- #15317 nit: guard -> registry @jif-oai
- #15338 fix: fall back to vendored bubblewrap when system bwrap lacks --argv0 @bolinfest
- #15520 fix: cargo deny @jif-oai
- #15279 Label plugins as plugins, and hide skills/apps for given plugin @canvrno-oai
- #15259 tui: queue follow-ups during manual /compact @charley-oai
- #15515 feat: structured multi-agent output @jif-oai
- #15357 Fix: proactive auth refresh to reload guarded disk state first @celia-oai
- #15342 Plugins TUI install/uninstall @canvrno-oai
- #15540 chore: split sub-agent v2 implementation @jif-oai
- #15516 Thread guardian Responses API errors into denial rationale @charley-oai
- #15378 feat: support disable skills by name. @xl-openai
- #15529 Unify realtime stop handling in TUI @aibrahim-oai
- #15557 fix: main tui @jif-oai
- #15556 feat: new op type for sub-agents communication @jif-oai
- #15211 [hooks] add non-streaming (non-stdin style) shell-only PreToolUse support @eternal-openai
- #15560 feat: use serde to differenciate inter agent communication @jif-oai
- #15426 chore(core) Add approvals reviewer to UserTurn @dylan-hurd-oai
- #15562 [codex] Add rollback context duplication snapshot @charley-oai
- #15570 feat: custom watcher for multi-agent v2 @jif-oai
- #15575 feat: custom watcher for multi-agent v2 @jif-oai
- #15576 feat: custom watcher for multi-agent v2 @jif-oai
- #15360 fix: build PATH env var using OsString instead of String @bolinfest
- #15239 Add fork snapshot modes @charley-oai
- #15554 Add plugin-creator as system skill @alexsong-oai
- #15592 Extract landlock helpers into codex-sandboxing @pakrym-oai
- #15593 Move macOS sandbox builders into codex-sandboxing @pakrym-oai
- #15478 [codex-cli][app-server] Update self-serve business usage limit copy in error returned @dhruvgupta-oai
- #15600 move imagegen skill into system skills @dkundel-openai
- #15599 Move sandbox policy transforms into codex-sandboxing @pakrym-oai
- #15580 Remove filter from plugins/list result @canvrno-oai
- #15581 Stabilize macOS CI test timeouts @dylan-hurd-oai
- #15613 nit: split v2 wait @jif-oai
- #15614 fix: flaky test @jif-oai
- #15621 feat: list agents for sub-agent v2 @jif-oai
- #15623 nit: optim on list agents @jif-oai
- #15549 Allow global network allowlist wildcard @rreichel3-oai
- #15424 Finish moving codex exec to app-server @etraut-openai
- #15603 Extract sandbox manager and transforms into codex-sandboxing @pakrym-oai
- #15484 chore(deps): bump pnpm/action-setup from 4 to 5 @dependabot
- #14777 Bump vedantmgoyal9/winget-releaser from 19e706d4c9121098010096f9c495a70a7518b30f to 7bd472be23763def6e16bd06cc8b1cdfab0e2fd5 @dependabot
- #15558 [Codex TUI] - Sort /plugins TUI menu by installed status first, alpha second @canvrno-oai
- #15598 Refresh mentions list after plugin install/uninstall @canvrno-oai
- #15624 feat: disable notifier v2 and start turn on agent interaction @jif-oai
- #15605 [codex] Stabilize compact resume and fork snapshot flaky tests @charley-oai
- #15658 try to fix git glitch @jif-oai
- #15657 try to fix git glitch @jif-oai
- #15656 try to fix git glitch @jif-oai
- #15655 try to fix git glitch @jif-oai
- #15654 try to fix git glitch @jif-oai
- #15653 try to fix git glitch @jif-oai
- #15652 try to fix git glitch @jif-oai
- #15651 try to fix git glitch @jif-oai
- #15650 try to fix git glitch @jif-oai
- #15606 Pretty plugin labels, preserve plugin app provenance during MCP tool refresh @canvrno-oai
- #15579 Increase voice space hold timeout to 1s @aibrahim-oai
- #15093 core: Make FileWatcher reusable @euroelessar
- #15547 app-server: Add back pressure and batching to `command/exec` @euroelessar
- #15647 feat: communication pattern v2 @jif-oai
- #15438 feat: include marketplace loading error in plugin/list @xl-openai
- #15545 chore:  use access token expiration for proactive auth refresh @celia-oai
- #15530 chore: stop app-server auth refresh storms after permanent token failure @celia-oai
- #15577 Trim pre-turn context updates during rollback @charley-oai
- #15660 Hide numeric prefixes on disabled TUI list rows @canvrno-oai
- #15644 fix: keep zsh-fork release assets after removing shell-tool-mcp @bolinfest
- #15670 tui_app_server: tolerate missing rate limits while logged out @etraut-openai
- #15564 Move git utilities into a dedicated crate @aibrahim-oai
- #15669 Clean up TUI /plugins row allignment @canvrno-oai
- #15671 tui: always restore the terminal on early exit @etraut-openai
- #15672 tui_app_server: open ChatGPT login in the local browser @etraut-openai
- #15673 tui_app_server: cancel active login before Ctrl+C exit @etraut-openai
- #15676 Tweak /plugin menu wording @canvrno-oai
- #15666 Suppress plugin-install MCP OAuth URL console spam @canvrno-oai
- #15573 [plugins] Additional gating for tool suggest and apps. @mzeng-openai
- #15665 Drop sandbox_permissions from sandbox exec requests @pakrym-oai
- #15572 Move string truncation helpers into codex-utils-string @aibrahim-oai
- #14533 app-server: add filesystem watch support @euroelessar
- #15674 Use delayed shimmer for plugin loading headers in tui and tui_app_server @canvrno-oai
- #15689 app-server: Return codex home in initialize response @euroelessar
- #15363 fix: keep rmcp-client env vars as OsString @bolinfest
- #15700 Remove provenance filtering in $mentions for apps and skills from plugins @canvrno-oai
- #15692 Add legal link to TUI /plugin details @canvrno-oai
- #15351 Expand ~ in MDM workspace write roots @evawong-oai
- #15548 Extract rollout into its own crate @aibrahim-oai
- #15699 [codex] Defer fork context injection until first turn @charley-oai
- #15601 [app-server] Add a method to override feature flags. @mzeng-openai
- #15708 TUI plugin menu cleanup - hide app ID @canvrno-oai
- #15677 Fix stale quickstart integration assertion @shaqayeq-oai
- #15713 [plugins] Flip the flags. @mzeng-openai
- #15719 [plugins] Flip on additional flags. @mzeng-openai
- #14172 fix: support split carveouts in windows restricted-token sandbox @viyatb-oai
- #15714 Fix stale turn steering fallback in tui_app_server @etraut-openai
- #15722 [plugins] Add a flag for tool search. @mzeng-openai
- #15734 Update plugin creator skill. @xl-openai
- #15766 chore: tty metric @jif-oai
- #15519 fix(core): default approval behavior for mcp missing annotations @fouad-openai
- #15775 chore: remove grep_files handler @jif-oai
- #15710 Use AbsolutePathBuf for cwd state @pakrym-oai
- #15778 feat: rendering library v1 @jif-oai
- #15758 fix(tui): avoid duplicate live reasoning summaries @fcoury
- #15773 chore: remove read_file handler @jif-oai
- #15776 feat: add multi-thread log query @jif-oai
- #15744 Extract codex-instructions crate @aibrahim-oai
- #15339 Add non-interactive resume filter option @nornagon-openai
- #15746 Extract codex-utils-plugins crate @aibrahim-oai
- #15747 Extract codex-plugin crate @aibrahim-oai
- #15748 Extract codex-analytics crate @aibrahim-oai
- #15707 Clarify codex_home base for MDM path resolution @evawong-oai
- #15513 fix(tui_app_server): fix remote subagent switching and agent names @fcoury
- #14856 [apps][tool_suggest] Remove tool_suggest's dependency on tool search. @mzeng-openai
- #14847 feat: add websocket auth for app-server @viyatb-oai
- #15759 fix(tui_app_server): preserve transcript events under backpressure @fcoury
- #15749 Extract codex-core-skills crate @aibrahim-oai
- #15798 Avoid duplicate auth refreshes in `getAuthStatus` @etraut-openai
- #15659 Add MCP tool call spans @nicholasclark-openai
- #15789 Treat ChatGPT `hc` plan as Enterprise @arnavdugar-openai
- #15802 TUI plugin menu polish @canvrno-oai
- #15785 Add cached environment manager for exec server URL @pakrym-oai
- #15806 Add ReloadUserConfig to tui_app_server @canvrno-oai
- #15810 app-server: Organize app-server to allow more transports @euroelessar
- #15800 [mcp] Improve custom MCP elicitation @mzeng-openai
- #15531 [hooks] add non-streaming (non-stdin style) shell-only PostToolUse support @eternal-openai
- #15820 [plugins] Flip flags on. @mzeng-openai
- #15825 Fix quoted command rendering in tui_app_server @etraut-openai
- #14853 Wire remote app-server auth through the client @etraut-openai
- #15817 Expand home-relative paths on Windows @tiffanycitra
- #15693 fix: fix old system bubblewrap compatibility without falling back to vendored bwrap @viyatb-oai
- #15784 feat: replace askama by custom lib @jif-oai
- #15851 feat: drop artifact tool and feature @jif-oai
- #15861 feat: clean spawn v1 @jif-oai
- #15691 feat: exec-server prep for unified exec @jif-oai
- #15864 chore: drop artifacts lib @jif-oai
- #15812 core: remove special execve handling for skill scripts @bolinfest
- #15869 fix: flaky @jif-oai
- #15877 chore: ask agents md not to play with PIDs @jif-oai
- #15866 feat: use `ProcessId` in `exec-server` @jif-oai
- #15829 [plugins] Update the suggestable plugins list. @mzeng-openai
- #15880 fix: max depth agent still has v2 tools @jif-oai
- #15839 Fix duplicate /review messages in app-server TUI @etraut-openai
- #15805 Add MCP connector metrics @nicholasclark-openai
- #15661 Enable `tui_app_server` feature by default @etraut-openai
- #15835 fix: box apply_patch test harness futures @bolinfest
- #15796 [codex] Block unsafe git global options from safe allowlist @adrian-openai
- #15813 Add wildcard in the middle test coverage @evawong-oai
- #15881 fix: root as std agent @jif-oai
- #15860 feat(tui): add terminal title support to tui app server @fcoury
- #15885 [mcp] Fix legacy_tools @mzeng-openai




## rust-v0.116.0 — 2026-03-19

## New Features
- App-server TUI now supports device-code ChatGPT sign-in during onboarding and can refresh existing ChatGPT tokens. (#14952)
- Plugin setup is smoother: Codex can prompt to install missing plugins or connectors, honor a configured suggestion allowlist, and sync install/uninstall state remotely. (#14896, #15022, #14878)
- Added a `userpromptsubmit` hook so prompts can be blocked or augmented before execution and before they enter history. (#14626)
- Realtime sessions now start with recent thread context and are less likely to self-interrupt during audio playback. (#14829, #14827)

## Bug Fixes
- Fixed a first-turn stall where websocket prewarm could delay `turn/start`; startup now times out and falls back cleanly. (#14838)
- Restored conversation history for remote resume/fork in the app-server TUI and stopped duplicate live transcript output from legacy stream events. (#14930, #14892)
- Improved Linux sandbox startup on symlinked checkouts, missing writable roots, and Ubuntu/AppArmor hosts by preferring system `bwrap` when available. (#14849, #14890, #14963)
- Fixed an agent job finalization race and reduced status polling churn for worker threads. (#14843)

## Documentation
- Refreshed the Python SDK public API docs, examples, and walkthrough around the generated app-server models. (#14446)

## Chores
- Pinned the `setup-zig` GitHub Action to an immutable SHA for more reproducible CI. (#14858)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.115.0...rust-v0.116.0

- #14717 Move TUI on top of app server (parallel code) @etraut-openai
- #14665 Use request permission profile in app server @mousseau-oai
- #14826 Fixed build failures related to PR 14717 @etraut-openai
- #14833 fix(core): fix sanitize name to use '_' everywhere @apanasenko-oai
- #14268 memories: exclude AGENTS and skills from stage1 input @andi-oai
- #14139 windows-sandbox: add runner IPC foundation for future unified_exec @iceweasel-oai
- #14851 Add exit helper to code mode scripts @pakrym-oai
- #14828 [stack 1/4] Split realtime websocket methods by version @aibrahim-oai
- #14652 Apply argument comment lint across codex-rs @bolinfest
- #14837 skill-creator: default new skills to ~/.codex/skills @xl-openai
- #14861 Add marketplace display names to plugin/list @xl-openai
- #14878 feat: support remote_sync for plugin install/uninstall. @xl-openai
- #14830 [stack 2/4] Align main realtime v2 wire and runtime flow @aibrahim-oai
- #14886 fix: align marketplace display name with existing interface conventions @xl-openai
- #14881 [codex] add Jason as a predefined subagent name @tibo-openai
- #14864 fix: tighten up shell arg quoting in GitHub workflows @bolinfest
- #14829 [stack 3/4] Add current thread context to realtime startup @aibrahim-oai
- #14827 [stack 4/4] Reduce realtime self-interruptions during playback @aibrahim-oai
- #14849 fix: canonicalize symlinked Linux sandbox cwd @viyatb-oai
- #14892 Fix tui_app_server: ignore duplicate legacy stream events @etraut-openai
- #14899 Revert tui code so it does not rely on in-process app server @etraut-openai
- #14890 fix(linux-sandbox): ignore missing writable roots @viyatb-oai
- #14920 feat: centralize package manager version @jif-oai
- #14935 feat: rename to get more explicit close agent @jif-oai
- #14843 Fix agent jobs finalization race and reduce status polling churn @daveaitel-openai
- #14944 feat: show effective model in spawn agent event @jif-oai
- #14838 fix(core): prevent hanging turn/start due to websocket warming issues @owenlin0
- #14859 Feat: CXA-1831 Persist latest model and reasoning effort in sqlite @shijie-oai
- #14930 fix(tui): restore remote resume and fork history @fcoury
- #14955 Fix fuzzy search notification buffering in app-server tests @aibrahim-oai
- #14938 feat: add suffix to shell snapshot name @jif-oai
- #14959 Fix code mode yield startup race @aibrahim-oai
- #14434 generate an internal json schema for `RolloutLine` @keyz
- #14846 use framed IPC for elevated command runner @iceweasel-oai
- #14952 Add device-code onboarding and ChatGPT token refresh to app-server TUI @etraut-openai
- #14896 [plugins] Support plugin installation elicitation. @mzeng-openai
- #14958 Stabilize Windows cmd-based shell test harnesses @aibrahim-oai
- #14966 Stabilize permissions popup selection tests @aibrahim-oai
- #14968 Stabilize approval matrix write-file command @aibrahim-oai
- #14986 temporarily disable private desktop until it works with elevated IPC path @iceweasel-oai
- #14983 Rename exec_wait tool to wait @pakrym-oai
- #14905 Add auth env observability @ccy-oai
- #14931 fix(tui): implement /mcp inventory for tui_app_server @fcoury
- #14977 Cleanup skills/remote/xxx endpoints. @xl-openai
- #14984 Gate realtime audio interruption logic to v2 @aibrahim-oai
- #14902 Unify realtime shutdown in core @aibrahim-oai
- #14963 fix(linux-sandbox): prefer system /usr/bin/bwrap when available @viyatb-oai
- #14446 Add Python SDK public API and examples @shaqayeq-oai
- #14993 feat: Add product-aware plugin policies and clean up manifest naming @xl-openai
- #14995 app-server: reject websocket requests with Origin headers @maxj-oai
- #14960 Add FS abstraction and use in view_image @pakrym-oai
- #14293 fix: honor active permission profiles in sandbox debug @viyatb-oai
- #14610 feat: support restricted ReadOnlyAccess in elevated Windows sandbox @viyatb-oai
- #13592 Prefer websockets when providers support them @pakrym-oai
- #14903 Handle realtime conversation end in the TUI @aibrahim-oai
- #14727 Use workspace requirements for guardian prompt override @charley-oai
- #14626 [hooks] userpromptsubmit - hook before user's prompt is executed @eternal-openai
- #14858 Pin setup-zig GitHub Action to immutable SHA @viyatb-oai
- #13702 fix(subagents) share execpolicy by default @dylan-hurd-oai
- #15022 [plugins] Support configuration tool suggest allowlist. @mzeng-openai
- #14947 feat: adapt artifacts to new packaging and 2.5.6 @jif-oai
- #14821 feat: add memory citation to agent message @jif-oai
- #15058 nit: disable live memory edition @jif-oai
- #14942 Removed remaining core events from tui_app_server @etraut-openai
- #15059 chore: disable memory read path for morpheus @jif-oai
- #14842 Add notify to code-mode @pakrym-oai
- #15020 fix: harden plugin feature gating @xl-openai




## rust-v0.115.0 — 2026-03-16

## New Features
- Supported models can now request full-resolution image inspection through both `view_image` and `codex.emitImage(..., detail: "original")`, which helps with precision visual tasks. (#14175)
- `js_repl` now exposes `codex.cwd` and `codex.homeDir`, and saved `codex.tool(...)` / `codex.emitImage(...)` references keep working across cells. (#14385, #14503)
- Realtime websocket sessions gained a dedicated transcription mode, plus v2 handoff support through the `codex` tool, with a unified `[realtime]` session config. (#14554, #14556, #14606)
- The v2 app-server now exposes filesystem RPCs for file reads, writes, copies, directory operations, and path watching, and there is a new Python SDK for integrating with that API. (#14245, #14435)
- Smart Approvals can now route review requests through a guardian subagent in core, app-server, and TUI, reducing repeated setup work on follow-up approvals. (#13860, #14668)
- App integrations now use the Responses API tool-search flow, can suggest missing tools, and fall back cleanly when the active model does not support search-based lookup. (#14274, #14287, #14732)

## Bug Fixes
- Spawned subagents now inherit sandbox and network rules more reliably, including project-profile layering, persisted host approvals, and symlinked writable roots. (#14619, #14650, #14674, #14807)
- `js_repl` no longer hangs when dynamic tool responses contain literal U+2028 or U+2029 characters. (#14421)
- The TUI no longer stalls on exit after creating subagents, and interrupting a turn no longer tears down background terminals by default. (#14816, #14602)
- `codex exec --profile` once again preserves profile-scoped settings when starting or resuming a thread. (#14524)
- MCP and elicitation flows are more robust, with safer tool-name normalization and preserved `tool_params` in approval prompts. (#14491, #14605, #14769)
- The local network proxy now serves CONNECT traffic as explicit HTTP/1, improving compatibility with HTTP proxy clients. (#14395)

## Chores
- The subagent wait tool is now consistently named `wait_agent`, aligning it with `spawn_agent` and `send_input`. (#14631)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.114.0...rust-v0.115.0

- #14395 fix(network-proxy): serve HTTP proxy listener as HTTP/1 @viyatb-oai
- #14385 Add js_repl cwd and homeDir helpers @fjord-oai
- #14376 Keep agent-switch word-motion keys out of draft editing @joshka-oai
- #14175 Let models opt into original image detail @fjord-oai
- #14382 check for large binaries in CI @owenlin0
- #14392 chore(app-server): stop emitting codex/event/ notifications @owenlin0
- #14274 feat: search_tool migrate to bring you own tool of Responses API @apanasenko-oai
- #14174 refactor: centralize filesystem permissions precedence @viyatb-oai
- #14394 chore(app-server): delete unused rpc methods from v1.rs @owenlin0
- #14171 fix: align core approvals with split sandbox policies @viyatb-oai
- #14410 Make collab model metadata accurate on completion @aibrahim-oai
- #14387 feat(app-server): propagate traces across tasks and core ops @owenlin0
- #14407 chore: use AVAILABLE and ON_INSTALL as default plugin install and auth policies @sayan-oai
- #14287 [apps] Add tool_suggest tool. @mzeng-openai
- #14432 Clarify spawn agent authorization @aibrahim-oai
- #14295 Support waiting for code_mode sessions @pakrym-oai
- #14427 feat: refactor on openai-curated plugins. @xl-openai
- #13996 refactor: make bubblewrap the default Linux sandbox @viyatb-oai
- #14440 fix: follow up on linux sandbox review nits @viyatb-oai
- #14431 Handle pre-approved permissions in zsh fork @mousseau-oai
- #14403 [elicitation] User-friendly tool call messages. @mzeng-openai
- #14429 Use granted permissions when invoking apply_patch @mousseau-oai
- #14471 Updated out-of-date tip about availability on free and go plans @etraut-openai
- #14444 fix: move inline codex-rs/core unit tests into sibling files @bolinfest
- #14437 Dispatch tools when code mode is not awaited directly @pakrym-oai
- #14435 Add Python app-server SDK @shaqayeq-oai
- #14473 fix(cli): support legacy use_linux_sandbox_bwrap flag @viyatb-oai
- #13882 Fix stdio-to-uds peer-close flake @aibrahim-oai
- #14476 Move code mode tool files under tools/code_mode and split functionality @pakrym-oai
- #14475 rename spawn_csv feature flag to enable_fanout @daveaitel-openai
- #14173 fix: preserve split filesystem semantics in linux sandbox @viyatb-oai
- #14480 Cleanup code_mode tool descriptions @pakrym-oai
- #14488 Handle malformed agent role definitions nonfatally @gabec-openai
- #14398 Do not allow unified_exec for sandboxed scenarios on Windows @iceweasel-oai
- #14419 use scopes_supported for OAuth when present on MCP servers @jgershen-oai
- #14484 Add default code-mode yield timeout @pakrym-oai
- #14494 Add parallel tool call test @pakrym-oai
- #14478 chore(app-server): stop exporting EventMsg schemas @owenlin0
- #14490 fix turn_start_jsonrpc_span_parents_core_turn_spans flakiness @owenlin0
- #14496 Reuse tool runtime for code mode worker @pakrym-oai
- #14421 Fix js_repl hangs on U+2028/U+2029 dynamic tool responses @aaronl-openai
- #14505 Skip nested tool call parallel test on Windows @pakrym-oai
- #14491 Fix MCP tool calling @pakrym-oai
- #14493 memories: focus write prompts on user preferences @andi-oai
- #14510 Rename exec session IDs to cell IDs @pakrym-oai
- #14500 Update tool search prompts @mzeng-openai
- #14426 Decouple request permissions feature and tool @mousseau-oai
- #14503 Persist js_repl codex helpers across cells @fjord-oai
- #14517 Expose code-mode tools through globals @pakrym-oai
- #14502 feat(search_tool): gate search_tool on model supports_search_tool field @apanasenko-oai
- #14521 Reapply "Pass more params to compaction" (#14298) @rasmusrygaard
- #14524 Fix `codex exec --profile` handling @etraut-openai
- #14516 Rename reject approval policy to granular @mousseau-oai
- #14445 feat: add plugin/read. @xl-openai
- #14178 login: add custom CA support for login flows @joshka-oai
- #14535 Split multi-agent handlers per tool @pakrym-oai
- #13329 [js_repl] Hard-stop active js_repl execs on explicit user interrupts @aaronl-openai
- #14239 client: extend custom CA handling across HTTPS and websocket clients @joshka-oai
- #14536 Add typed multi-agent tool outputs @pakrym-oai
- #14514 fix: reopen writable linux carveouts under denied parents @viyatb-oai
- #14531 Add plugin usage telemetry @alexsong-oai
- #14511 code_mode: Move exec params from runtime declarations to @pragma @cconger
- #14504 Refactor cloud requirements error and surface in JSON-RPC error @alexsong-oai
- #14537 Add realtime v2 event parser behind feature flag @aibrahim-oai
- #14529 Simplify permissions available in request permissions tool @mousseau-oai
- #14522 feat: support skill-scoped managed network domain overrides in skill config @celia-oai
- #14554 Add codex tool support for realtime v2 handoff @aibrahim-oai
- #14556 Add realtime transcription mode for websocket sessions @aibrahim-oai
- #14518 Add diagnostics for read_only_unless_trusted timeout flake @aibrahim-oai
- #14603 Split multi-agent handler into dedicated files @pakrym-oai
- #14526 code mode: single line tool declarations @pakrym-oai
- #14400 Use a private desktop for Windows sandbox instead of Winsta0\Default @iceweasel-oai
- #14558 sending back imagaegencall response back to responseapi @won-openai
- #14553 Improve granular approval policy prompt @mousseau-oai
- #14541 chore: clarify plugin + app copy in model instructions @sayan-oai
- #14542 [bazel] Bump up cc and rust toolchains @zbarsky-openai
- #14512 Start TUI on embedded app server @etraut-openai
- #14606 Unify realtime v1/v2 session config @aibrahim-oai
- #14527 app-server: Add platform os and family to init response @euroelessar
- #14618 Use subagents naming in the TUI @aibrahim-oai
- #14304 Override local apps settings with requirements.toml settings @canvrno-oai
- #14479 feat(app-server, core): add more spans @owenlin0
- #13644 fix: preserve zsh-fork escalation fds across unified-exec spawn paths @bolinfest
- #14617 Add code_mode_only feature @pakrym-oai
- #13201 Slash copy osc52 wsl support @won-openai
- #14631 Rename multi-agent wait tool to wait_agent @aibrahim-oai
- #14622 Stabilize multi-agent feature flag @aibrahim-oai
- #14245 app-server: add v2 filesystem APIs @euroelessar
- #14605 Normalize MCP tool names to code-mode safe form @pakrym-oai
- #14637 Fix wait_agent expectations in core tests @charley-oai
- #13860 Add Smart Approvals guardian review across core, app-server, and TUI @charley-oai
- #14639 Fix stale create_wait_tool reference @charley-oai
- #14532 [hooks] stop continuation & stop_hook_active mechanics @eternal-openai
- #14635 Fix realtime transcription session.update tools payload @aibrahim-oai
- #14636 Use parser-specific realtime voice enum @aibrahim-oai
- #14633 refactor: make unified-exec zsh-fork state explicit @bolinfest
- #12031 Add openai_base_url config override for built-in provider @etraut-openai
- #14645 Fix Windows CI assertions for guardian and Smart Approvals @aibrahim-oai
- #14616 Fix turn context reconstruction after backtracking @charley-oai
- #14619 fix: persist future network host approvals across sessions @viyatb-oai
- #14650 fix: sync split sandbox policies for spawned subagents @viyatb-oai
- #14609 move plugin/skill instructions into dev msg and reorder @sayan-oai
- #12024 Enforce errors on overriding built-in model providers @etraut-openai
- #14646 Refresh Python SDK generated types @sayan-oai
- #14649 make defaultPrompt an array, keep backcompat @sayan-oai
- #14501 dynamic tool calls: add param `exposeToContext` to optionally hide tool @cconger
- #14651 Add argument-comment Dylint runner @bolinfest
- #14674 fix: fix symlinked writable roots in sandbox policies @viyatb-oai
- #14611 Add auth 401 recovery observability to client bug reports @ccy-oai
- #14647 [apps] Add tool call meta. @mzeng-openai
- #14732 [apps] Improve search tool fallback. @mzeng-openai
- #14602 Preserve background terminals on interrupt and rename cleanup command to /stop @friel-openai
- #14668 Reuse guardian session across approvals @charley-oai
- #14769 fix(core): preserve tool_params for elicitations @mzeng-openai
- #14807 fix: sub-agent role when using profiles @jif-oai
- #14806 feat: improve skills cache key to take into account config layering @jif-oai
- #13850 feat: make interrupt state not final for multi-agents @jif-oai
- #14816 fix: tui freeze when sub-agents are present @jif-oai




## rust-v0.114.0 — 2026-03-11

## New Features
- Added an experimental code mode for more isolated coding workflows. (#13418)
- Added an experimental hooks engine with `SessionStart` and `Stop` hook events. (#13276)
- WebSocket app-server deployments now expose `GET /readyz` and `GET /healthz` on the same listener for easier health checks. (#13782)
- Added a config switch to disable bundled system skills entirely. (#13792)
- Handoffs now carry realtime transcript context, which improves continuity when work is transferred between turns. (#14132)
- Improved the `$` mention picker by clearly labeling Skills, Apps, and Plugins, and by surfacing plugins first. (#14147, #14163)

## Bug Fixes
- Fixed a Linux `tmux` crash caused by concurrent user-shell lookups. (#13900)
- Fixed apps being enabled in unsupported sessions by tightening the enablement check. (#14011)
- Fixed reopened threads getting stuck as in-progress after quitting mid-run and then resuming later. (#14125)
- Fixed permission handling so legacy `workspace-write` behavior is preserved and newer permission profiles degrade more safely on older builds. (#13957, #14107)
- Fixed approval flows so granted permissions persist across turns, work with reject-style configs, and are honored by `apply_patch`. (#14009, #14055, #14118, #14165)

## Chores
- Laid the groundwork for the Python SDK’s generated v2 schema types and pinned platform-specific runtime binaries. (#13953)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.113.0...rust-v0.114.0

- #14009 feat(core) Persist request_permission data across turns @dylan-hurd-oai
- #14136 fix(core): use dedicated types for responsesapi web search tool config @owenlin0
- #13782 codex-rs/app-server: add health endpoints for --listen websocket server @maxj-oai
- #14055 fix(core) RequestPermissions + ApplyPatch @dylan-hurd-oai
- #14118 feat(approvals) RejectConfig for request_permissions @dylan-hurd-oai
- #13957 fix(protocol): preserve legacy workspace-write semantics @viyatb-oai
- #14107 fix: keep permissions profiles forward compatible @viyatb-oai
- #14147 make dollar-mention always clarify item category (skill, app, plugin) @sayan-oai
- #14152 Refactor tool output into trait implementations @pakrym-oai
- #14163 sort plugins first in  menu @sayan-oai
- #13418 Add code_mode experimental feature @pakrym-oai
- #13276 start of hooks engine @eternal-openai
- #14135 tui: only show fast status for gpt-5.4 @pash-openai
- #14157 Enforce single tool output type in codex handlers @pakrym-oai
- #14165 fix(core) default RejectConfig.request_permissions @dylan-hurd-oai
- #14167 Export tools module into code mode runner @pakrym-oai
- #13792 feat: support disabling bundled system skills @xl-openai
- #14169 Move exec command truncation into ExecCommandToolOutput @pakrym-oai
- #14011 [apps] Fix apps enablement condition. @mzeng-openai
- #14000 Delay pending cleanup until task aborts @aibrahim-oai
- #12296 Implemented thread-level atomic elicitation counter for stopwatch pausing @cconger
- #14132 Use realtime transcript for handoff context @aibrahim-oai
- #13879 Stabilize incomplete SSE retry test @aibrahim-oai
- #14184 Fix unified exec test output assertion @aibrahim-oai
- #14002 Stabilize websocket test server binding @aibrahim-oai
- #13939 Stabilize app-server notify initialize test @aibrahim-oai
- #13953 python-sdk: generated type foundation (all v2 schemas) @shaqayeq-oai
- #13603 Fix release-mode integration test compiler failure @etraut-openai
- #13900 Fix Linux tmux segfault in user shell lookup @etraut-openai
- #13901 Log ChatGPT user ID for feedback tags @etraut-openai
- #14183 Expose strongly-typed result for exec_command @pakrym-oai
- #14003 Stabilize split PTY output on Windows @aibrahim-oai
- #14229 Reuse McpToolOutput in McpHandler @pakrym-oai
- #14125 Mark incomplete resumed turns interrupted when idle @guinness-oai




## rust-v0.113.0 — 2026-03-10

## New Features
- Added a built-in `request_permissions` tool so running turns can request additional permissions at runtime, with new TUI rendering for those approval calls. (#13092, #14004)
- Expanded plugin workflows with curated marketplace discovery, richer `plugin/list` metadata, install-time auth checks, and a `plugin/uninstall` endpoint. (#13712, #13540, #13685, #14111)
- Upgraded app-server command execution with streaming stdin/stdout/stderr plus TTY/PTY support, and wired `exec` to the new in-process app server path. (#13640, #14005)
- Web search settings now support full tool configuration (for example filters and location), not just on/off. (#13675)
- Added the new permission-profile config language and split filesystem/network sandbox policy plumbing for more precise policy control. (#13434, #13439, #13440, #13448, #13449, #13453)
- Image generation now saves output files into the current working directory. (#13607)

## Bug Fixes
- Fixed auth error handling for cloud requirements fetch so 401s trigger the normal auth-recovery messaging instead of a generic workspace-config failure. (#14049)
- Fixed trust bootstrap to avoid running `git` commands before project trust is established. (#13804)
- Fixed Windows execution edge cases, including incorrect PTY `TerminateProcess` success handling and stricter sandbox startup cwd validation. (#13989, #13833, #13742)
- Fixed plugin startup behavior so curated plugins are loaded in TUI sessions as expected. (#14050)
- Hardened network proxy policy parsing by rejecting global wildcard (`*`) domains while preserving scoped wildcard support. (#13789)
- Fixed approval payload compatibility for macOS automation permissions by accepting both supported input shapes. (#13683)

## Documentation
- Clarified `js_repl` guidance for persistent bindings and redeclaration recovery to reduce avoidable REPL errors. (#13803)

## Chores
- Reduced log/storage overhead by moving logs to a dedicated SQLite DB, adding timestamps to feedback logs, pruning old data, and tightening retention/row limits. (#13645, #13688, #13734, #13763, #13772, #13781)
- Improved Windows distribution automation by publishing CLI releases to winget. (#12943)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.112.0...rust-v0.113.0

- #13626 feat(otel): safe tracing @owenlin0
- #13560 Refine realtime startup context formatting @aibrahim-oai
- #13615 Replay thread rollback from rollout history @aibrahim-oai
- #13642 fix(tui): clean up pending steer preview wrapping @charley-oai
- #13645 Add timestamped SQLite /feedback logs without schema changes @charley-oai
- #13654 tui: sort resume picker by last updated time @charley-oai
- #13540 support plugin/list. @xl-openai
- #13677 chore: remove unused legacy macOS permission types @celia-oai
- #13683 fix: accept two macOS automation input shapes  for approval payload compatibility @celia-oai
- #13687 refactor: remove proxy admin endpoint @viyatb-oai
- #13669 copy current exe to CODEX_HOME/.sandbox-bin for apply_patch @iceweasel-oai
- #11874 fix(tui) remove config check for trusted setting @dylan-hurd-oai
- #13685 check app auth in plugin/install @sayan-oai
- #13697 change sound @aibrahim-oai
- #13607 Enabling CWD Saving for Image-Gen @won-openai
- #13621 [elicitations] Switch to use MCP style elicitation payload for mcp tool approvals. @mzeng-openai
- #13619 feat: status line with real data @jif-oai
- #13734 feat: prune old memories in DB @jif-oai
- #13688 Add timestamps to feedback log lines @etraut-openai
- #13742 fix: windows normalization @jif-oai
- #13514 [rmcp-client] Recover from streamable HTTP 404 sessions @caseychow-oai
- #13750 feat: drop sqlite db feature flag @jif-oai
- #13753 feat: drop discrepency metrics @jif-oai
- #13763 feat: limit number of rows per log @jif-oai
- #13703 Clarify sandbox permission override helper semantics @charley-oai
- #13770 fix(app-server): fix turn_start_shell_zsh_fork_executes_command_v2 flake @owenlin0
- #13630 feat(otel, core): record turn TTFT and TTFM metrics in codex-core @owenlin0
- #13674 app-server: Emit `thread/name/updated` event globally @euroelessar
- #13772 Move sqlite logs to a dedicated database @charley-oai
- #13620 chore: improve DB flushing @jif-oai
- #13711 feat: structured plugin parsing @sayan-oai
- #13781 Reduce SQLite log retention to 10 days @charley-oai
- #13780 fix: move unit tests in codex-rs/core/src/config/mod.rs into their own file @bolinfest
- #13783 fix: move unit tests in codex-rs/core/src/codex.rs into their own file @bolinfest
- #13787 fix bazel build @bolinfest
- #13789 fix: reject global wildcard network proxy domains @viyatb-oai
- #12943 Codex/winget auto update @iceweasel-oai
- #13800 chore(otel): reorganize codex-otel crate @owenlin0
- #13797 feat: add auth login diagnostics @joshka-oai
- #13695 utils/pty: add streaming spawn and terminal sizing primitives @euroelessar
- #13803 Clarify js_repl binding reuse guidance @fjord-oai
- #13810 docs: remove auth login logging plan @joshka-oai
- #13434 config: add initial support for the new permission profile config language in config.toml @bolinfest
- #13796 Add realtime startup context override @aibrahim-oai
- #13814 fix: include libcap-dev dependency when creating a devcontainer for building Codex @bolinfest
- #13808 chore(otel): rename OtelManager to SessionTelemetry @owenlin0
- #13712 feat: Add curated plugin marketplace + Metadata Cleanup. @xl-openai
- #13791 fix(core): skip exec approval for permissionless skill scripts @celia-oai
- #13675 Allow full web search tool config @rm-openai
- #13640 app-server: Add streaming and tty/pty capabilities to `command/exec` @euroelessar
- #13819 feat(app-server-protocol): address naming conflicts in json schema exporter @owenlin0
- #13804 fix: avoid invoking git before project trust is established @viyatb-oai
- #12752 fix: support managed network allowlist controls @viyatb-oai
- #13439 sandboxing: plumb split sandbox policies through runtime @bolinfest
- #13440 protocol: derive effective file access from filesystem policies @bolinfest
- #13816 fix(core): respect reject policy by approval source for skill scripts @celia-oai
- #13833 app-server: require absolute cwd for windowsSandbox/setupStart @iceweasel-oai
- #13670 Add Fast mode status-line indicator @etraut-openai
- #13445 safety: honor filesystem policy carveouts in apply_patch @bolinfest
- #13771 feat: simplify DB further @jif-oai
- #13692 Add guardian approval MVP @charley-oai
- #13851 tmp: drop artifact skills @jif-oai
- #13910 fix(core) rm guardian snapshot test @dylan-hurd-oai
- #13911 fix(ci) fix guardian ci @dylan-hurd-oai
- #13896 Fix TUI context window display before first TokenCount @etraut-openai
- #13448 seatbelt: honor split filesystem sandbox policies @bolinfest
- #13921 chore: use @plugin instead of $plugin for plaintext mentions @sayan-oai
- #13807 [elicitations] Support always allow option for mcp tool calls. @mzeng-openai
- #13449 linux-sandbox: plumb split sandbox policies through helper @bolinfest
- #13451 sandboxing: preserve denied paths when widening permissions @bolinfest
- #13452 protocol: keep root carveouts sandboxed @bolinfest
- #13874 Stabilize abort task follow-up handling @aibrahim-oai
- #13453 linux-sandbox: honor split filesystem policies in bwrap @bolinfest
- #13989 Fix inverted Windows PTY `TerminateProcess` handling @etraut-openai
- #13912 fix(ci): restore guardian coverage and bazel unit tests @charley-oai
- #13877 Stabilize shell serialization tests @aibrahim-oai
- #13839 [app-server] Support hot-reload user config when batch writing config. @mzeng-openai
- #14005 Add in-process app server and wire up exec to use it @etraut-openai
- #13929 app-server: include experimental skill metadata in exec approval requests @celia-oai
- #14014 fix(core) patch otel test @dylan-hurd-oai
- #13841 tui: clarify pending steer follow-ups @charley-oai
- #13092 Add request permissions tool @mousseau-oai
- #14027 fix(bazel) add missing app-server-client BUILD.bazel @dylan-hurd-oai
- #14004 feat(tui) render request_permissions calls @dylan-hurd-oai
- #14052 Stabilize app list update ordering test @aibrahim-oai
- #13897 guardian initial feedback / tweaks @charley-oai
- #13884 Reduce app-server test timeout pressure @aibrahim-oai
- #13872 Stabilize zsh fork app-server tests @aibrahim-oai
- #13881 Stabilize RMCP pid file cleanup test @aibrahim-oai
- #13883 Stabilize PTY Python REPL test @aibrahim-oai
- #14058 Stabilize plan item app-server tests @aibrahim-oai
- #13943 Order websocket initialize after handshake @aibrahim-oai
- #13885 Stabilize thread resume replay tests @aibrahim-oai
- #13878 Serialize shell snapshot stdin test @aibrahim-oai
- #13876 Stabilize realtime startup context tests @aibrahim-oai
- #14050 fix(plugin): Also load curated plugins for TUI. @xl-openai
- #14049 fix: properly handle 401 error in clound requirement fetch. @xl-openai
- #14101 Stabilize shell approval MCP test @aibrahim-oai
- #14102 Stabilize interrupted task approval cleanup @aibrahim-oai
- #14103 Stabilize guardian approval coverage @aibrahim-oai
- #14060 Stabilize resumed rollout messages @aibrahim-oai
- #14114 fix(ci) Faster shell_command::unicode_output test @dylan-hurd-oai
- #14111 chore: plugin/uninstall endpoint @sayan-oai
- #14117 feat(otel): Centralize OTEL metric names and shared tag builders @owenlin0
- #13880 Stabilize RMCP streamable HTTP readiness tests @aibrahim-oai
- #14123 pass on save info to model + ui tweaks @won-openai
- #13886 Stabilize protocol schema fixture generation @aibrahim-oai




## rust-v0.112.0 — 2026-03-08

## New Features
- Added `@plugin` mentions so users can reference plugins directly in chat and auto-include their associated MCP/app/skill context. (#13510)
- Added a new model-selection surface update so the latest model catalog changes are surfaced in the TUI picker flow. (#13617)
- Merged executable permission profiles into per-turn sandbox policy for zsh-fork skill execution, allowing safer, additive privilege handling for tool runs. (#13496)

## Bug Fixes
- Fixed JS REPL state handling so previously-initialized bindings persist after a failed cell, reducing brittle restarts during iterative sessions. (#13482)
- Treated `SIGTERM` like Ctrl-C for graceful app-server websocket shutdown instead of abrupt termination behavior. (#13594)
- Hardened js_repl image emission to accept only `data:` URLs, preventing external URL forwarding through `emitImage`. (#13507)
- Ensured Linux bubblewrap sandbox runs always unshare the user namespace to keep isolation consistent even for root-owned invocations. (#13624)
- Improved macOS sandbox network and unix-socket handling in Seatbelt, improving reliability for constrained subprocess environments. (#12702)
- Surfaced feedback/diagnostics earlier in the workflow so connectivity and diagnostics are visible before later steps. (#13604)

## Documentation
- Clarified js_repl image guidance (emission and encoding semantics), including clearer usage around repeated `emitImage` calls. (#13639)

## Chores
- Fixed a small codespell warning in the TUI theme picker path. (#13605)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.111.0...rust-v0.112.0

- #13594 treat SIGTERM like ctrl-c for graceful shutdown @maxj-oai
- #13605 Fix codespell warning about pre-selects @fjord-oai
- #13482 Persist initialized js_repl bindings after failed cells @fjord-oai
- #13604 [diagnostics] show diagnostics earlier in workflow @rhan-oai
- #13496 feat: merge skill permission profiles into the turn sandbox for zsh-fork execs @celia-oai
- #13507 Harden js_repl emitImage to accept only data: URLs @fjord-oai
- #13602 feat(core): persist trace_id for turns in RolloutItem::TurnContext @owenlin0
- #13624 fix(linux-sandbox): always unshare bwrap userns @viyatb-oai
- #12702 Improve macOS Seatbelt network and unix socket handling @viyatb-oai
- #13639 Clarify js_repl image emission and encoding guidance @fjord-oai
- #13510 add @plugin mentions @sayan-oai
- #13499 core/protocol: add structured macOS additional permissions and merge them into sandbox execution @celia-oai
- #13617 Update models.json @aibrahim-oai




## rust-v0.111.0 — 2026-03-05

## New Features
- Fast mode is now enabled by default, and the TUI header shows whether the session is running in Fast or Standard mode. (#13450, #13446)
- `js_repl` can now dynamically import local `.js` and `.mjs` files, making it easier to reuse workspace scripts from the REPL. (#13437)
- Codex now tells the model which plugins are enabled at session start, improving discovery of installed MCPs, apps, and skills. (#13433)
- App-server v2 now exposes MCP elicitation as a structured request/response flow instead of raw events, which simplifies client integrations. (#13425)
- Expanded image workflow support for clients, including client-side handling of image-generation events and model metadata for image-capable web search. (#13512, #13538)

## Bug Fixes
- Resuming a thread now preserves its stored git context and keeps apps enabled, avoiding broken state after `codex resume`. (#13504, #13533)

## Documentation
- Added sample skill documentation for artifact workflows, including slide deck and spreadsheet examples. (#13525)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.110.0...rust-v0.111.0

- #13516 Log non-audio realtime events @aibrahim-oai
- #13208 chore(deps): bump actions/download-artifact from 7 to 8 @dependabot
- #13512 image-gen-event/client_processing @won-openai
- #13210 chore(deps): bump strum_macros from 0.27.2 to 0.28.0 in /codex-rs @dependabot
- #13209 chore(deps): bump serde_with from 3.16.1 to 3.17.0 in /codex-rs @dependabot
- #13504 Preserve persisted thread git info in resume @joeytrasatti-openai
- #13207 chore(deps): bump actions/upload-artifact from 6 to 7 @dependabot
- #13433 feat: track plugins mcps/apps and add plugin info to user_instructions @sayan-oai
- #13450 [core] Enable fast mode by default @pash-openai
- #13438 [tui] rotate paid promo tips to include fast mode @pash-openai
- #13515 [tui] Update fast mode plan usage copy @pash-openai
- #13533 [apps] Fix the issue where apps is not enabled after codex resume. @mzeng-openai
- #13437 [js_repl] Support local ESM file imports @aaronl-openai
- #13539 Reduce realtime audio submission log noise @aibrahim-oai
- #13538 chore: add web_search_tool_type for image support @sayan-oai
- #13446 [tui] Show speed in session header @pash-openai
- #13392 refactor: prepare unified exec for zsh-fork backend @bolinfest
- #13571 feat: bind package manager @jif-oai
- #13525 feat: skills for artifacts @jif-oai
- #13573 feat: ultra polish package manager @jif-oai
- #13577 chore: ultra-clean artifacts @jif-oai
- #13425 feat(app-server): support mcp elicitations in v2 api @owenlin0




## rust-v0.110.0 — 2026-03-05

## New Features
- Added a plugin system that can load skills, MCP entries, and app connectors from config or a local marketplace, with an install endpoint for enabling plugins from the app server. (#12864, #13333, #13401, #13422)
- Expanded the TUI multi-agent flow with approval prompts, `/agent`-based enablement, clearer prompts, ordinal nicknames, and role-labeled handoff context. (#12995, #13246, #13404, #13412, #13505)
- Added a persisted `/fast` toggle in the TUI and app-server support for `fast` and `flex` service tiers. (#13212, #13334, #13391)
- Improved memories with workspace-scoped writes, renamed memory settings, and guardrails against saving stale or polluted facts. (#13008, #13088, #13237, #13467)
- Added a direct Windows installer script to published release artifacts. (#12741)

## Bug Fixes
- Fixed `@` file mentions so parent-directory `.gitignore` rules no longer hide valid repository files. (#13250)
- Made sub-agents faster and more reliable by reusing shell state correctly and fixing `/status`, `Esc`, pending-message handling, and startup/profile race conditions. (#12935, #13052, #13130, #13131, #13235, #13240, #13248)
- Fixed project trust parsing so CLI overrides apply correctly to trusted project-local MCP transports. (#13090)
- Fixed read-only sandbox policies so network access is preserved when it is explicitly enabled. (#13409)
- Fixed multiline environment export capture and Windows state DB path handling in session state. (#12642, #13336)
- Fixed ANSI/base16 syntax highlighting so terminal-themed colors render correctly in the TUI. (#13382)

## Documentation
- Expanded app-server docs around service tiers, plugin installation, renaming unloaded threads, and the new `skills/changed` notification. (#13282, #13391, #13414, #13422)

## Chores
- Removed the remaining legacy app-server v1 websocket/RPC surfaces in favor of the current protocol. (#13364, #13375, #13397)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.107.0...rust-v0.110.0

- #13086 Fix CLI feedback link @etraut-openai
- #13063 Make cloud_requirements fail close @alexsong-oai
- #13083 Enable analytics in codex exec and codex mcp-server @etraut-openai
- #12995 feat: approval for sub-agent in the TUI @jif-oai
- #13027 feat: skill disable respect config layer @jif-oai
- #13125 chore: change mem default @jif-oai
- #13088 Tune memory read-path for stale facts @andi-oai
- #13128 nit: ignore `resume_startup_does_not_consume_model_availability_nux_c… @jif-oai
- #12935 Speed up subagent startup @daveaitel-openai
- #13127 nit: disable on windows @jif-oai
- #13129 fix: package `models.json` for Bazel tests @jif-oai
- #13065 core: resolve host_executable() rules during preflight @bolinfest
- #12864 feat: load from plugins @xl-openai
- #12989 fix: MacOSAutomationPermission::BundleIDs should allow communicating … @leoshimo-oai
- #13181 [codex] include plan type in account updates @tibo-openai
- #13058 Record realtime close marker on replacement @aibrahim-oai
- #13215 Fix issue deduplication workflow for Codex issues @etraut-openai
- #13197 Improve subagent contrast in TUI @gabec-openai
- #13130 fix: `/status` when sub-agent @jif-oai
- #13008 feat: polluted memories @jif-oai
- #13237 feat: update memories config names @jif-oai
- #13131 fix: esc in `/agent` @jif-oai
- #13052 core: reuse parent shell snapshot for thread-spawn subagents @daveaitel-openai
- #13249 chore: `/multiagent` alias for `/agent` @jif-oai
- #13057 fix: use https://git.savannah.gnu.org/git/bash instead of https://github.com/bolinfest/bash @bolinfest
- #13090 Fix project trust config parsing so CLI overrides work @etraut-openai
- #13202 tui: restore draft footer hints @charley-oai
- #13246 feat: enable ma through `/agent` @jif-oai
- #12642 fix(core) shell_snapshot multiline exports @dylan-hurd-oai
- #11814 test(app-server): increase flow test timeout to reduce flake @joshka-oai
- #13282 app-server: Update `thread/name/set` to support not-loaded threads @euroelessar
- #13285 feat(app-server): add tracing to all app-server APIs @owenlin0
- #13265 Update realtime websocket API @aibrahim-oai
- #13261 fix(app-server): emit turn/started only when turn actually starts @owenlin0
- #13079 app-server: Silence thread status changes caused by thread being created @euroelessar
- #13284 Adjusting plan prompt for clarity and verbosity @bfioca-openai
- #13286 feat(app-server-test-client): support tracing @owenlin0
- #13061 chore:  remove SkillMetadata.permissions and derive skill sandboxing from permission_profile @celia-oai
- #12006 tui: preserve kill buffer across submit and slash-command clears @rakan-oai
- #13212 add fast mode toggle @pash-openai
- #13250 fix(core): scope file search gitignore to repository context @fcoury
- #13313 Renaming Team to Business plan during TUI onboarding @bwanner-oai
- #13248 fix: agent race @jif-oai
- #13235 fix: agent when profile @jif-oai
- #13336 fix: db windows path @jif-oai
- #13334 app-server service tier plumbing (plus some cleanup) @pash-openai
- #13341 feat: presentation artifact p1 @jif-oai
- #13344 feat: pres artifact 2 @jif-oai
- #13346 feat: pres artifact 3 @jif-oai
- #13345 feat: spreadsheet artifact @jif-oai
- #13347 feat: spreadsheet v2 @jif-oai
- #13348 feat: presentation part 4 @jif-oai
- #13350 feat: spreadsheet part 3 @jif-oai
- #13355 feat: pres artifact part 5 @jif-oai
- #13357 feat: add multi-actions to presentation tool @jif-oai
- #13360 feat: artifact presentation part 7 @jif-oai
- #13362 feat: wire spreadsheet artifact @jif-oai
- #12741 Add Windows direct install script @efrazer-oai
- #13376 realtime prompt changes @aibrahim-oai
- #13324 app-server-protocol: export flat v2 schema bundle @apanasenko-oai
- #13364 Remove Responses V1 websocket implementation @pakrym-oai
- #12969 app-server: source /feedback logs from sqlite at trace level @charley-oai
- #13381 chore: rm --all-features flag from rust-analyzer @sayan-oai
- #13043 Collapse parsed command summaries when any stage is unknown @nornagon-openai
- #13385 Revert "realtime prompt changes" @aibrahim-oai
- #13389 fix @aibrahim-oai
- #13375 chore(app-server): delete v1 RPC methods and notifications @owenlin0
- #13397 chore(app-server): restore EventMsg TS types @owenlin0
- #13395 Build delegated realtime handoff text from all messages @aibrahim-oai
- #13399 Require deduplicator success before commenting @etraut-openai
- #13398 Revert "Revert "realtime prompt changes"" @aibrahim-oai
- #13333 Refactor plugin config and cache path @xl-openai
- #13275 fix(network-proxy): reject mismatched host headers @viyatb-oai
- #12868 tui: align pending steers with core acceptance @charley-oai
- #13280 Add thread metadata update endpoint to app server @joeytrasatti-openai
- #13050 Add under-development original-resolution view_image support @fjord-oai
- #13402 Ensure the env values of imported shell_environment_policy.set is string @alexsong-oai
- #13331 Make js_repl image output controllable @fjord-oai
- #13401 feat: load plugin apps @sayan-oai
- #13292 [feedback] diagnostics @rhan-oai
- #13414 feat(app-server): add a skills/changed v2 notification @owenlin0
- #13368 feat(app-server): propagate app-server trace context into core @owenlin0
- #13413 copy command-runner to CODEX_HOME so sandbox users can always execute it @iceweasel-oai
- #13366 [bazel] Bump rules_rs and llvm @zbarsky-openai
- #13409 Feat: Preserve network access on read-only sandbox policies @celia-oai
- #13388 config: enforce enterprise feature requirements @bolinfest
- #13218 Add role-specific subagent nickname overrides @gabec-openai
- #13427 chore: Nest skill and protocol network permissions under `network.enabled` @celia-oai
- #13429 core: box wrapper futures to reduce stack pressure @bolinfest
- #13391 support 'flex' tier in app-server in addition to 'fast' @kharvd
- #13290 image-gen-core @won-openai
- #13404 feat: better multi-agent prompt @jif-oai
- #13412 feat: ordinal nick name @jif-oai
- #13454 add metric for per-turn token usage @jif-oai
- #13240 fix: pending messages in `/agent` @jif-oai
- #13461 fix: bad merge @jif-oai
- #13460 feat: disable request input on sub agent @jif-oai
- #13456 feat: add metric for per-turn tool count and add tmp_mem flag @jif-oai
- #13468 nit: citation prompt @jif-oai
- #13467 feat: memories in workspace write @jif-oai
- #12383 add new scopes to login @adaley-openai
- #13484 allow apps to specify cwd for sandbox setup. @iceweasel-oai
- #13424 feat(core, tracing): add a span representing a turn @owenlin0
- #13489 remove serviceTier from app-server examples @kharvd
- #13458 [tui] Update Fast slash command description @pash-openai
- #13382 fix(tui): decode ANSI alpha-channel encoding in syntax themes @fcoury
- #13485 feat: external artifacts builder @jif-oai
- #13493 feat(app-server-test-client): OTEL setup for tracing @owenlin0
- #13501 add metrics for external config import @alexsong-oai
- #13495 Notify TUI about plan mode prompts and user input requests @etraut-openai
- #13506 [release] temporarily use thin LTO for releases @bolinfest
- #13505 Prefix handoff messages with role @aibrahim-oai
- #13422 plugin: support local-based marketplace.json + install endpoint. @xl-openai


## rust-v0.107.0 — 2026-03-02

## New Features
- You can now fork a thread into sub-agents, making it easier to branch work without leaving the current conversation. (#12499)
- Realtime voice sessions now let you pick microphone and speaker devices, persist those choices, and send audio in a format better aligned with transcription. (#12849, #12850, #13030)
- Custom tools can now return multimodal output, including structured content like images, instead of being limited to plain text. (#12948)
- The app server now exposes richer model availability and upgrade metadata, and the TUI uses it to explain plan-gated models with limited-run tooltips. (#12958, #12972, #13021)
- Memories are now configurable, and there is a new `codex debug clear-memories` command to fully reset saved memory state when needed. (#12997, #12999, #13002, #13085)

## Bug Fixes
- Reconnecting with `thread/resume` now restores pending approval and input requests instead of leaving clients out of sync. (#12560)
- `thread/start` no longer blocks unrelated app-server requests, reducing stalls during slow startup paths such as MCP auth checks. (#13033)
- Interactive terminal sessions no longer print the final assistant response twice. (#13082)
- Large pasted-content placeholders now survive file completion correctly, fixing a regression from `0.106.0`. (#13070)
- ChatGPT accounts that arrive without plan info now handle account reads correctly instead of triggering repeated login issues. (#13072)
- Diff rendering in the TUI now respects theme colors better and displays more cleanly in Windows Terminal and other low-color environments. (#13016, #13037)
- MCP OAuth login flows now forward configured `oauth_resource` values correctly for servers that require a `resource` parameter. (#12866)

## Documentation
- Updated sandbox escalation guidance so dependency-install failures caused by sandboxed network access are more clearly treated as escalation candidates. (#13051)

## Chores
- Tightened sandbox filesystem behavior by improving restricted read-only handling on Linux and avoiding sensitive directories like `~/.ssh` on Windows. (#12369, #12835)
- Escalated shell commands now keep their sandbox configuration when rerun, closing a gap where approvals could lose the intended restrictions. (#12839)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.106.0...rust-v0.107.0

- #12925 chore: calm down awaiter @jif-oai
- #12499 feat: fork thread multi agent @jif-oai
- #12837 Log js_repl nested tool responses in rollout history @fjord-oai
- #12774 feat: add post-compaction sub-agent infos @jif-oai
- #12929 Remove noisy log @pakrym-oai
- #12835 don't grant sandbox read access to ~/.ssh and a few other dirs. @iceweasel-oai
- #12839 feat: include sandbox config with escalation request @bolinfest
- #12940 feat: add git info to memories @jif-oai
- #12727 tui: use thread_id for resume/fork cwd resolution @charley-oai
- #12950 Allow clients not to send summary as an option @pakrym-oai
- #12944 fix: sort codex features list alphabetically @bolinfest
- #12849 Add realtime audio device config @aibrahim-oai
- #12957 test: move unix_escalation tests into sibling file @bolinfest
- #12947 feat: add local date/timezone to turn environment context @celia-oai
- #12959 Make realtime audio test deterministic @aibrahim-oai
- #12958 Feat: cxa-1833 update model/list @shijie-oai
- #12850 Add realtime audio device picker @aibrahim-oai
- #12948 Support multimodal custom tool outputs @fjord-oai
- #12745 [apps] Improve app/list with force_fetch=true @mzeng-openai
- #12866 Add oauth_resource handling for MCP login flows @etraut-openai
- #12936 Add a background job to refresh the requirements local cache @alexsong-oai
- #12972 Add model availability NUX metadata @aibrahim-oai
- #12981 Add realtime websocket tracing @aibrahim-oai
- #12968 notify: include client in legacy hook payload @bolinfest
- #12997 feat: add use memories config @jif-oai
- #12999 feat: gen memories config @jif-oai
- #13002 feat: use the memory mode for phase 1 extraction @jif-oai
- #13001 chore: tmp remove awaiter @jif-oai
- #13011 fix: more stable notify script @jif-oai
- #12970 fix: use AbsolutePathBuf for permission profile file roots @bolinfest
- #13016 fix(tui): promote windows terminal diff ansi16 to truecolor @fcoury
- #13030 Align TUI voice transcription audio with 4o ASR @nornagon-openai
- #13047 app-server: deflake running thread resume tests @bolinfest
- #12560 app-server: Replay pending item requests on `thread/resume` @euroelessar
- #13055 fix: disable Bazel builds in CI on ubuntu-24.04-arm until we can stabilize them @bolinfest
- #12964 execpolicy: add host_executable() path mappings @bolinfest
- #13051 Clarify escalation guidance for sandbox-related network failures @daniel-oai
- #12612 Unify rollout reconstruction with resume/fork TurnContext hydration @charley-oai
- #13067 [apps] Stablize app list updated event. @mzeng-openai
- #12369 feat(linux-sandbox): support restricted ReadOnlyAccess in bwrap @viyatb-oai
- #13037 fix(tui): theme-aware diff backgrounds with fallback behavior @fcoury
- #13070 Keep large-paste placeholders intact during file completion @etraut-openai
- #13072 Handle missing plan info for ChatGPT accounts @etraut-openai
- #13021 Add model availability NUX tooltips @aibrahim-oai
- #13080 app-server: Add an ability to watch events in the test client @euroelessar
- #13082 Suppress duplicate assistant output on stdout in interactive sessions @etraut-openai
- #13033 fix(app-server): make thread/start non-blocking @owenlin0
- #13046 core: adopt host_executable() rules in zsh-fork @bolinfest
- #13084 app-server: Add `ephemeral` field to `Thread` object @euroelessar
- #13085 feat: add debug clear-memories command to hard-wipe memories state @sayan-oai




## rust-v0.106.0 — 2026-02-26

## New Features
- Added a direct install script for macOS and Linux and publish it as a GitHub release asset, using the existing platform payload (including `codex` and `rg`) (#12740)
- Expanded the app-server v2 thread API with experimental thread-scoped realtime endpoints/notifications and a `thread/unsubscribe` flow to unload live threads without archiving them (#12715, #10954)
- Promoted `js_repl` to `/experimental`, added startup compatibility checks with user-visible warnings, and lowered the validated minimum Node version to `22.22.0` (#12712, #12824, #12857)
- Enabled `request_user_input` in Default collaboration mode (not just Plan mode) (#12735)
- Made `5.3-codex` visible in the CLI model list for API users (#12808)
- Improved memory behavior with diff-based forgetting and usage-aware memory selection (#12900, #12909)

## Bug Fixes
- Improved realtime websocket reliability by retrying timeout-related HTTP 400 handshake failures and preferring WebSocket v2 when supported by the selected model (#12791, #12838)
- Fixed a zsh-fork shell execution path that could drop sandbox wrappers and bypass expected filesystem restrictions (#12800)
- Added a shared ~1M-character input size cap in the TUI and app-server to prevent hangs/crashes on oversized pastes, with explicit error responses (#12823)
- Improved TUI local file-link rendering to hide absolute paths while preserving visible line/column references (#12705, #12870)
- Fixed `Ctrl-C` handling for sub-agents in the TUI (#12911)

## Documentation
- Fixed a stale sign-in success link in the auth/onboarding flow (#12805)
- Clarified the CLI login hint for remote/device-auth login scenarios (#12813)

## Chores
- Added structured OTEL audit logging for embedded `codex-network-proxy` policy decisions and blocks (#12046)
- Removed the `steer` feature flag and standardized on the always-on steer path in the TUI composer (#12026)
- Reduced sub-agent startup overhead by skipping expensive history metadata scans for subagent spawns (#12918)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.105.0...rust-v0.106.0

- #12046 feat(network-proxy): add embedded OTEL policy audit logging @mcgrew-oai
- #12712 Promote js_repl to experimental with Node requirement @fjord-oai
- #12715 Add app-server v2 thread realtime API @aibrahim-oai
- #12795 Revert "fix(bazel): replace askama templates with include_str! in memories" @jif-oai
- #12791 Handle websocket timeout @pakrym-oai
- #12800 fix: enforce sandbox envelope for zsh fork execution @bolinfest
- #12802 Propagate session ID when compacting @rasmusrygaard
- #12732 feat(app-server): add ThreadItem::DynamicToolCall @owenlin0
- #12807 Add simple realtime text logs @aibrahim-oai
- #12805 Update Codex docs success link @etraut-openai
- #12809 fix: harden zsh fork tests and keep subcommand approvals deterministic @bolinfest
- #12808 make 5.3-codex visible in cli for api users @sayan-oai
- #10954 feat(app-server): thread/unsubscribe API @owenlin0
- #12806 only use preambles for realtime @aibrahim-oai
- #12830 Revert "only use preambles for realtime" @aibrahim-oai
- #12721 Revert "Ensure shell command skills trigger approval (#12697)" @celia-oai
- #12831 only use preambles for realtime @aibrahim-oai
- #12735 Enable request_user_input in Default mode @charley-oai
- #12814 feat: scope execve session approvals by approved skill metadata @bolinfest
- #12026 Remove steer feature flag @aibrahim-oai
- #12740 Add macOS and Linux direct install script @EFRAZER-oai
- #12838 Use websocket v2 as model-preferred websocket protocol @pakrym-oai
- #12811 Revert "Add skill approval event/response (#12633)" @celia-oai
- #12758 feat: include available decisions in command approval requests @bolinfest
- #12824 Disable js_repl when Node is incompatible at startup @fjord-oai
- #12813 Clarify device auth login hint @xl-openai
- #12848 Try fixing windows pipeline @pakrym-oai
- #12856 Attempt 2 to fix release @pakrym-oai
- #12744 Skip system skills for extra roots @xl-openai
- #12857 Reduce js_repl Node version requirement to 22.22.0 @fjord-oai
- #12865 Fix release build take @pakrym-oai
- #12705 Hide local file link destinations in TUI markdown @pash-openai
- #12823 Enforce user input length cap @etraut-openai
- #12417 core: bundle settings diff updates into one dev/user envelope @charley-oai
- #12884 chore: new agents name @jif-oai
- #12885 nit: captial @jif-oai
- #12870 tui: restore visible line numbers for hidden file links @pash-openai
- #12684 Add rollout path to memory files and search for them during read @wendyjiao-openai
- #12901 chore: better awaiter description @jif-oai
- #12900 feat: memories forgetting @jif-oai
- #12905 chore: clean DB runtime @jif-oai
- #12918 Skip history metadata scan for subagents @daveaitel-openai
- #12871 split-debuginfo @pakrym-oai
- #12909 feat: use memory usage for selection @jif-oai
- #12887 fix: do not apply turn cwd to metadata @jif-oai
- #12911 fix: ctrl c sub agent @jif-oai
- #12873 Use model catalog default for reasoning summary fallback @pakrym-oai




## rust-v0.105.0 — 2026-02-25

## New Features
- The TUI now syntax-highlights fenced code blocks and diffs, adds a `/theme` picker with live preview, and uses better theme-aware diff colors for light and dark terminals. (#11447, #12581)
- You can now dictate prompts by holding the spacebar to record and transcribe voice input directly in the TUI. This feature is still under development; to enable it set features.voice_transcription = true in your config. (#3381)
- Multi-agent workflows are easier to run and track: `spawn_agents_on_csv` can fan out work from a CSV with built-in progress/ETA, and sub-agents are easier to follow with nicknames, a cleaner picker, and visible child-thread approval prompts. (#10935, #12320, #12327, #12332, #12570, #12767)
- The TUI picked up new convenience commands: `/copy` copies the latest complete assistant reply, while `/clear` and `Ctrl-L` clear the screen without losing thread context, with `/clear` also able to start a fresh chat. (#12444, #12520, #12613, #12628)
- Approval controls are more flexible: Codex can now ask for extra sandbox permissions for a command, and you can auto-reject specific approval prompt types without turning approvals off entirely. (#11871, #12087)
- App-server clients can do more with threads: `thread/list` can search by title, thread status is exposed in read/list responses and notifications, and `thread/resume` returns the latest turn inline so reconnects are less lossy. (#11776, #11786, #12578)

## Bug Fixes
- Long links in the TUI stay clickable when wrapped, which also fixes related clipping and layout issues in several views. (#12067)
- Several TUI interaction edge cases were fixed: queued-message editing now works in more terminals, follow-up prompts no longer get stuck if you press Enter while a final answer is still streaming, and approval dialogs now respond with the correct request id. (#12240, #12569, #12746)
- `@` parsing in the chat composer is more reliable, so commands like `npx -y @scope/pkg@latest` no longer accidentally open the file picker or block submission. (#12643)
- App-server websocket handling is more robust: thread listeners survive disconnects, Ctrl-C waits for in-flight turns before restarting, and websocket clients that send `permessage-deflate` can connect successfully. (#12373, #12517, #12629)
- Linux sandboxed commands now get a minimal `/dev`, fixing failures in tools that need entropy or other standard device nodes. (#12081)
- `js_repl` now reports uncaught kernel failures more clearly, recovers cleanly afterward, and correctly attaches `view_image` results from nested tool calls. (#12636, #12725)

## Documentation
- Added a public security policy with Bugcrowd reporting guidance. (#12193)
- Updated install and local workflow docs to use `cargo install --locked cargo-nextest` and to avoid routine `--all-features` builds unless you specifically need full feature coverage. (#12377, #12429)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.104.0...rust-v0.105.0

- #12071 Use V2 websockets if feature enabled @pakrym-oai
- #12052 feat(core): zsh exec bridge @owenlin0
- #12072 Add message phase to agent message thread item @mousseau-oai
- #12077 got rid of experimental_mode for configtoml @won-openai
- #12036 codex-api: realtime websocket session.create + typed inbound events @aibrahim-oai
- #12073 Add model-visible context layout snapshot tests @charley-oai
- #12096 Updated issue labeler script to include safety-check label @etraut-openai
- #11944 [js_repl] paths for node module resolution can be specified for js_repl @aaronl-openai
- #11798 fix: Restricted Read: /System is too permissive for macOS platform de… @leoshimo-oai
- #12015 Enable default status line indicators in TUI config @jif-oai
- #12124 feat: phase 1 and phase 2 e2e latencies @jif-oai
- #12121 feat: phase 2 usage @jif-oai
- #12120 feat: memory usage metrics @jif-oai
- #12133 feat: validate agent config file paths @jif-oai
- #12137 nit: change model for phase 1 @jif-oai
- #12069 Stop filtering model tools in js_repl_tools_only mode @fjord-oai
- #12135 feat: better slug for rollout summaries @jif-oai
- #12157 Disable collab tools during review delegation @jif-oai
- #11802 Fixed a hole in token refresh logic for app server @etraut-openai
- #12105 fix: file watcher @jif-oai
- #12167 memories: bump rollout summary slug cap to 60 @zuxin-oai
- #12177 js_repl: canonicalize paths for node_modules boundary checks @fjord-oai
- #12025 app-server support for Windows sandbox setup. @iceweasel-oai
- #12187 fix: Remove citation @zuxin-oai
- #12180 [apps] Temporary app block. @mzeng-openai
- #11786 app-server: expose loaded thread status via read/list and notifications @euroelessar
- #12038 state: enforce 10 MiB log caps for thread and threadless process logs @charley-oai
- #12203 Stabilize app-server detached review and running-resume tests @charley-oai
- #12211 [apps] Update apps allowlist. @mzeng-openai
- #12081 fix(linux-sandbox): mount /dev in bwrap sandbox @viyatb-oai
- #12164 Update docs links for feature flag notice @etraut-openai
- #12231 Adjust memories rollout defaults @jif-oai
- #12152 feat: sub-agent injection @jif-oai
- #12233 feat: add shell snapshot failure reason @jif-oai
- #12193 docs: add codex security policy @viyatb-oai
- #12228 feat: add configurable write_stdin timeout @jif-oai
- #11787 Adjust MCP tool approval handling for custom servers @colby-oai
- #12179 Move previous turn context tracking into ContextManager history @charley-oai
- #12244 Restore phase when loading from history @mousseau-oai
- #12101 client side modelinfo overrides @sayan-oai
- #12251 Add configurable agent spawn depth @jif-oai
- #12254 chore: increase stack size for everyone @jif-oai
- #12250 feat: no timeout mode on ue @jif-oai
- #12255 chore: consolidate new() and initialize() for McpConnectionManager @bolinfest
- #12256 Revert "feat: no timeout mode on ue" @jif-oai
- #12258 Undo stack size Bazel test hack @charley-oai
- #12264 Fix flaky test @jif-oai
- #12087 feat: add Reject approval policy with granular prompt rejection controls @bolinfest
- #12253 Skip removed features during metrics emission @jif-oai
- #12265 Clarify cumulative proposed_plan behavior in Plan mode @charley-oai
- #12266 app-server tests: reduce intermittent nextest LEAK via graceful child shutdown @bolinfest
- #11953 ws turn metadata via client_metadata @pash-openai
- #11778 fix(bazel): replace askama templates with include_str! in memories @rupurt
- #11382 Add configurable MCP OAuth callback URL for MCP login @dkumar-oai
- #12274 [bazel] Fix proc_macro_dep libs @zbarsky-openai
- #12054 feat(config): add permissions.network proxy config wiring @viyatb-oai
- #12269 tests(thread_resume): interrupt running turns in resume error-path tests @bolinfest
- #12009 Update pnpm versions to fix cve-2026-24842 @mjr-openai
- #12080 skill-creator: lazy-load PyYAML in frontmatter parsing @xl-openai
- #12271 tests: centralize in-flight turn cleanup helper @bolinfest
- #12286 app-server: fix flaky list_apps_returns_connectors_with_accessible_flags test @bolinfest
- #11776 app-server: improve thread resume rejoin flow @maxj-oai
- #11822 [apps] Store apps tool cache in disk to reduce startup time. @mzeng-openai
- #12221 memories: add rollout_summary_file header to raw memories and tune prompts @zuxin-oai
- #12309 Set memories phase reasoning effort constants @jif-oai
- #12315 chore: nit explorer @jif-oai
- #12320 feat: add nick name to sub-agents @jif-oai
- #12328 chore: better agent names @jif-oai
- #12326 disable collab for phase 2 @jif-oai
- #12267 Add MCP server context to otel tool_result logs @colby-oai
- #12327 feat: cleaner TUI for sub-agents @jif-oai
- #12332 feat: better agent picker in TUI @jif-oai
- #12344 feat: do not enqueue phase 2 if not necessary @jif-oai
- #12340 fix: simplify macOS sleep inhibitor FFI @yvolovich-cyber
- #12347 fix: nick name at thread/read @jif-oai
- #12294 Reuse connection between turns @pakrym-oai
- #12287 app-server: add JSON tracing logs @maxj-oai
- #12140 Refactor network approvals to host/protocol/port scope @viyatb-oai
- #12300 js_repl: block wrapped payload prefixes in grammar @fjord-oai
- #11368 fix(network-proxy): add unix socket allow-all and update seatbelt rules @viyatb-oai
- #12275 js_repl: remove codex.state helper references @fjord-oai
- #12289 CODEX-4927: Surface local login entitlement denials in browser @daniel-oai
- #12205 ci(bazel): install Node from node-version.txt in remote image @fjord-oai
- #12312 feat: add config `allow_login_shell` @jif-oai
- #12086 [apps] Implement apps configs. @mzeng-openai
- #12353 fix(core): require approval for destructive MCP tool calls @colby-oai
- #12218 app-server: harden disconnect cleanup paths @maxj-oai
- #12291 core tests: use hermetic mock server in review suite @viyatb-oai
- #12374 [apps] Enforce simple logo url format. @mzeng-openai
- #12377 docs: use --locked when installing cargo-nextest @derekf-oai
- #12370 Add ability to attach extra files to feedback @pakrym-oai
- #12306 Move sanitizer into codex-secrets @viyatb-oai
- #12379 clarify model_catalog_json only applied on startup @sayan-oai
- #12307 Show model/reasoning hint when switching modes @charley-oai
- #12403 [apps] Fix gateway url. @mzeng-openai
- #12240 fix(tui): queued-message edit shortcut unreachable in some terminals @fcoury
- #12405 [apps] Bump MCP tool call timeout. @mzeng-openai
- #12406 fix: explicitly list name collisions in JSON schema generation @bolinfest
- #12301 Add field to Thread object for the latest rename set for a given thread @natea-oai
- #12268 Wire realtime api to core @aibrahim-oai
- #12415 fix(nix): include libcap dependency on linux builds @rgodha24
- #12416 Add experimental realtime websocket URL override @aibrahim-oai
- #12303 Improve Plan mode reasoning selection flow @charley-oai
- #12418 Add experimental realtime websocket overrides and text mirroring @aibrahim-oai
- #12381 fix: address flakiness in thread_resume_rejoins_running_thread_even_with_override_mismatch @bolinfest
- #12422 feat: use OAI Responses API MessagePhase type directly in App Server v2 @bolinfest
- #12376 test(app-server): wait for turn/completed in turn_start tests @yvolovich-cyber
- #12408 ignore v1 in JSON schema codegen @bolinfest
- #12314 fix(core) Filter non-matching prefix rules @dylan-hurd-oai
- #12429 feat: discourage the use of the --all-features flag @bolinfest
- #12252 Fix compaction context reinjection and model baselines @charley-oai
- #12427 chore: move config diagnostics out of codex-core @bolinfest
- #12430 Collapse waited message @pakrym-oai
- #12432 chore: remove codex-core public protocol/shell re-exports @bolinfest
- #12434 fix: codex-arg0 no longer depends on codex-core @bolinfest
- #12435 refactor(core): move embedded system skills into codex-skills crate @bolinfest
- #12440 chore: delete empty codex-rs/code file @bolinfest
- #12441 Delete AggregatedStream @pakrym-oai
- #11293 feat(linux-sandbox): implement proxy-only egress via TCP-UDS-TCP bridge @viyatb-oai
- #12410 profile-level model_catalog_json overrie @sayan-oai
- #12420 Prevent replayed runtime events from forcing active status @etraut-openai
- #12428 Prefer v2 websockets if available @pakrym-oai
- #12419 Improve token usage estimate for images @etraut-openai
- #12474 fix: make skills loader tests hermetic with ~/.agents skills @bolinfest
- #12473 core: preserve constrained approval/sandbox policies in TurnContext @bolinfest
- #12067 fix(tui): preserve URL clickability across all TUI views @fcoury
- #12469 Route inbound realtime text into turn start or steer @aibrahim-oai
- #12479 Revert "Route inbound realtime text into turn start or steer" @aibrahim-oai
- #12475 fix: make realtime conversation flake test order-insensitive @bolinfest
- #12476 Make shell detection tests
     robust to Nix shell paths @rupurt
- #11447 feat(tui): syntax highlighting via syntect with theme picker @fcoury
- #12373 app-server: retain thread listener across disconnects @maxj-oai
- #12444 feat(tui) /clear @won-openai
- #12485 fix(core) exec policy parsing 3 @dylan-hurd-oai
- #12423 Send events to realtime api @aibrahim-oai
- #12364 feat: monitor role @jif-oai
- #12313 Handle orphan exec ends without clobbering active exploring cell @jif-oai
- #12455 feat(tui): support Alt-d delete-forward-word @dougEfresh
- #12480 Revert "Revert "Route inbound realtime text into turn start or steer"" @aibrahim-oai
- #12509 Sort themes case-insensitively in picker @etraut-openai
- #12511 Add C# syntax option to highlight selections @etraut-openai
- #12513 Add PR babysitting skill for this repo @etraut-openai
- #12518 test: vendor zsh fork via DotSlash and stabilize zsh-fork tests @bolinfest
- #12553 Return image content from view_image @pakrym-oai
- #12555 refactor: decouple MCP policy construction from escalate server @bolinfest
- #12559 chore: nit name @jif-oai
- #12562 chore: awaiter @jif-oai
- #12565 chore: add doc to memories @jif-oai
- #12568 chore: phase 2 name @jif-oai
- #12571 fix: TUI constraint @jif-oai
- #12570 feat: keep dead agents in the agent picker @jif-oai
- #12575 feat: agent nick names to model @jif-oai
- #12500 feat: add uuid helper @jif-oai
- #12580 chore: rename memory feature flag @jif-oai
- #12541 Allow exec resume to parse output-last-message flag after command @etraut-openai
- #12579 feat: role metrics multi-agent @jif-oai
- #12141 feat: land sqlite @jif-oai
- #12576 chore: better bazel test logs @jif-oai
- #12028 remove feature flag collaboration modes @aibrahim-oai
- #12520 tweaked /clear to support clear + new chat, also fix minor bug for macos terminal @won-openai
- #12556 refactor: normalize unix module layout for exec-server and shell-escalation @bolinfest
- #12421 app-server: box request dispatch future to reduce stack pressure @charley-oai
- #12528 chore(deps): bump libc from 0.2.180 to 0.2.182 in /codex-rs @dependabot
- #12529 chore(deps): bump syn from 2.0.114 to 2.0.117 in /codex-rs @dependabot
- #12583 Use Arc-based ToolCtx in tool runtimes @bolinfest
- #12540 fix: add ellipsis for truncated status indicator @sayan-oai
- #12609 fix(tui): recover on owned wrap mapping mismatch @fcoury
- #12569 fix(tui): queue steer Enter while final answer is still streaming to prevent dead state @guidedways
- #12530 chore(deps): bump owo-colors from 4.2.3 to 4.3.0 in /codex-rs @dependabot
- #12549 fix: show command running in background terminal in details under status indicator @sayan-oai
- #3381 voice transcription @nornagon-openai
- #12619 Handle realtime spawn_transcript delegation @aibrahim-oai
- #11408 Update models.json @github-actions
- #12629 app-server: fix connecting via websockets with `Sec-WebSocket-Extensions: permessage-deflate` @JaviSoto
- #12632 refactor: delete exec-server and move execve wrapper into shell-escalation @bolinfest
- #12638 refactor: decouple shell-escalation from codex-core @bolinfest
- #12357 feat(core): persist network approvals in execpolicy @viyatb-oai
- #12648 fix(exec) Patch resume test race condition @dylan-hurd-oai
- #12049 Support implicit skill invocation analytics events @alexsong-oai
- #12647 Avoid `AbsolutePathBuf::parent()` panic under `EMFILE` by skipping re-absolutization @etraut-openai
- #12633 Add skill approval event/response @pakrym-oai
- #12650 chore: rm hardcoded PRESETS list @sayan-oai
- #12652 Simplify skill tracking @pakrym-oai
- #12653 memories: tighten consolidation prompt schema and indexing guidance @zuxin-oai
- #12667 feat: mutli agents persist config overrides @jif-oai
- #12635 memories: tighten memory lookup guidance and citation requirements @zuxin-oai
- #12663 fix: replay after `/agent` @jif-oai
- #11258 Send warmup request @pakrym-oai
- #12688 feat: use process group to kill the PTY @jif-oai
- #11871 feat(core) Introduce Feature::RequestPermissions @dylan-hurd-oai
- #12628 ctrl-L (clears terminal but does not start a new chat)  @won-openai
- #9859 feat(network-proxy): add MITM support and gate limited-mode CONNECT @viyatb-oai
- #12649 feat: run zsh fork shell tool via shell-escalation @bolinfest
- #12643 Fix @mention token parsing in chat composer @etraut-openai
- #12658 fix: also try matching namespaced prefix for modelinfo candidate @sayan-oai
- #11766 feat(sleep-inhibitor): add Linux and Windows idle-sleep prevention @yvolovich-cyber
- #12581 feat(tui): add theme-aware diff backgrounds with capability-graded palettes @fcoury
- #12697 Ensure shell command skills trigger approval @pakrym-oai
- #12707 refactor: remove unused seatbelt unix socket arg @bolinfest
- #12687 Add TUI realtime conversation mode @aibrahim-oai
- #12639 Honor `project_root_markers` when discovering `AGENTS.md` @etraut-openai
- #10935 Agent jobs (spawn_agents_on_csv) + progress UI @daveaitel-openai
- #12700 revert audio scope @nornagon-openai
- #12711 fix: temp remove citation @zuxin-oai
- #12613 feat(tui) - /copy @won-openai
- #12695 Add app-server event tracing @pakrym-oai
- #12717 Raise image byte estimate for compaction token accounting @etraut-openai
- #12724 fix: make EscalateServer public and remove shell escalation wrappers @bolinfest
- #12517 codex-rs/app-server: graceful websocket restart on Ctrl-C @maxj-oai
- #12636 fix(js_repl): surface uncaught kernel errors and reset cleanly @fjord-oai
- #12729 fix: clarify the value of SkillMetadata.path @bolinfest
- #12719 feat: pass helper executable paths via Arg0DispatchPaths @bolinfest
- #12720 add AWS_LC_SYS_NO_JITTER_ENTROPY=1 to release musl build step to unblock releases @sayan-oai
- #12725 Fix js_repl view_image attachments in nested tool calls @fjord-oai
- #12656 chore: change catalog mode to enum @sayan-oai
- #12731 chore: migrate additional permissions to PermissionProfile @celia-oai
- #12407 tests(js_repl): stabilize CI runtime test execution @fjord-oai
- #12737 feat:  add experimental additionalPermissions to v2 command execution approval requests @celia-oai
- #12372 feat: update Docker image digest to reflect #12205 @fjord-oai
- #12746 fix: chatwidget was not honoring approval_id for an ExecApprovalRequestEvent @bolinfest
- #12185 tests(js_repl): remove node-related skip paths from js_repl tests @fjord-oai
- #12358 feat(ui): add network approval persistence plumbing @viyatb-oai
- #12730 feat: zsh-fork forces scripts/**/* for skills to trigger a prompt @bolinfest
- #12750 fix: keep shell escalation exec paths absolute @bolinfest
- #12753 Surface skill permission profiles in zsh-fork exec approvals @celia-oai
- #12319 feat: add service name to app-server @jif-oai
- #12692 fix: flaky test due to second-resolution for thread ordering @jif-oai
- #12578 feat: add search term to thread list @jif-oai
- #12660 Support external agent config detect and import @alexsong-oai
- #12756 feat: record whether a skill script is approved for the session @bolinfest
- #12767 Display pending child-thread approvals in TUI @jif-oai
- #12768 feat: add large stack test macro @jif-oai
- #12666 feat: adding stream parser @jif-oai
- #12761 feat: record memory usage @jif-oai
- #12772 nit: migration @jif-oai
- #12352 otel: add host.name resource attribute to logs/traces via gethostname @mcgrew-oai
- #12770 chore: unify max depth parameter @jif-oai
- #12787 feat: fix sqlite home @jif-oai




## rust-v0.104.0 — 2026-02-18

## New Features
- Added `WS_PROXY`/`WSS_PROXY` environment support (including lowercase variants) for websocket proxying in the network proxy. (#11784)
- App-server v2 now emits notifications when threads are archived or unarchived, enabling clients to react without polling. (#12030)
- Protocol/core now carry distinct approval IDs for command approvals to support multiple approvals within a single shell command execution flow. (#12051)

## Bug Fixes
- `Ctrl+C`/`Ctrl+D` now cleanly exits the cwd-change prompt during resume/fork flows instead of implicitly selecting an option. (#12040)
- Reduced false-positive safety-check downgrade behavior by relying on the response header model (and websocket top-level events) rather than the response body model slug. (#12061)

## Documentation
- Updated docs and schemas to cover websocket proxy configuration, new thread archive/unarchive notifications, and the command approval ID plumbing. (#11784, #12030, #12051)

## Chores
- Made the Rust release workflow resilient to `npm publish` attempts for an already-published version. (#12044)
- Standardized remote compaction test mocking and refreshed related snapshots to align with the default production-shaped behavior. (#12050)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.103.0...rust-v0.104.0

- #11784 feat(network-proxy): add websocket proxy env support @viyatb-oai
- #12044 don't fail if an npm publish attempt is for an existing version. @iceweasel-oai
- #12040 tui: exit session on Ctrl+C in cwd change prompt @charley-oai
- #12030 app-server: Emit thread archive/unarchive notifications @euroelessar
- #12061 Chore: remove response model check and rely on header model for downgrade @shijie-oai
- #12051 feat(core): plumb distinct approval ids for command approvals @owenlin0
- #12050 Unify remote compaction snapshot mocks around default endpoint behavior @charley-oai




## rust-v0.103.0 — 2026-02-17

## New Features
- App listing responses now include richer app details (`app_metadata`, branding, and labels), so clients can render more complete app cards without extra requests. (#11706)
- Commit co-author attribution now uses a Codex-managed `prepare-commit-msg` hook, with `command_attribution` override support (default label, custom label, or disable). (#11617)

## Bug Fixes
- Removed the `remote_models` feature flag to prevent fallback model metadata when it was disabled, improving model selection reliability and performance. (#11699)

## Chores
- Updated Rust dependencies (`clap`, `env_logger`, `arc-swap`) and refreshed Bazel lock state as routine maintenance. (#11888, #11889, #11890, #12032)
- Reverted the Rust toolchain bump to `1.93.1` after CI breakage. (#11886, #12035)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.102.0...rust-v0.103.0

- #11699 chore: rm remote models fflag @sayan-oai
- #11706 [apps] Expose more fields from apps listing endpoints. @mzeng-openai
- #11890 chore(deps): bump arc-swap from 1.8.0 to 1.8.2 in /codex-rs @dependabot
- #11886 chore(deps): bump rust-toolchain from 1.93.0 to 1.93.1 in /codex-rs @dependabot
- #12032 chore: just bazel-lock-update @bolinfest
- #11888 chore(deps): bump clap from 4.5.56 to 4.5.58 in /codex-rs @dependabot
- #11889 chore(deps): bump env_logger from 0.11.8 to 0.11.9 in /codex-rs @dependabot
- #11617 Use prompt-based co-author attribution with config override @gabec-openai
- #12035 Revert "chore(deps): bump rust-toolchain from 1.93.0 to 1.93.1 in /co…dex-rs (#11886)" @etraut-openai




## rust-v0.102.0 — 2026-02-17

## New Features
- Added a more unified permissions flow, including clearer permissions history in the TUI and a slash command to grant sandbox read access when directories are blocked. (#11633, #11512, #11550, #11639)
- Introduced structured network approval handling, with richer host/protocol context shown directly in approval prompts. (#11672, #11674)
- Expanded app-server fuzzy file search with explicit session-complete signaling so clients can stop loading indicators reliably. (#10268, #11773)
- Added customizable multi-agent roles via config, including migration toward the new multi-agent naming/config surface. (#11917, #11982, #11939, #11918)
- Added a `model/rerouted` notification so clients can detect and render model reroute events explicitly. (#12001)

## Bug Fixes
- Fixed remote image attachments so they persist correctly across resume/backtrack and history replay in the TUI. (#10590)
- Fixed a TUI accessibility regression where animation gating for screen reader users was not consistently respected. (#11860)
- Fixed app-server thread resume behavior to correctly rejoin active in-memory threads and tighten invalid resume cases. (#11756)
- Fixed `model/list` output to return full model data plus visibility metadata, avoiding unintended server-side filtering. (#11793)
- Fixed several `js_repl` stability issues, including reset hangs, in-flight tool-call races, and a `view_image` panic path. (#11932, #11922, #11800, #11796)
- Fixed app integration edge cases in mention parsing and app list loading/filtering behavior. (#11894, #11518, #11697)

## Documentation
- Updated contributor guidance to require snapshot coverage for user-visible TUI changes. (#10669)
- Updated docs/help text around Codex app and MCP command usage. (#11926, #11813)

## Chores
- Improved developer log tooling with new `just log --search` and `just log --compact` modes. (#11995, #11994)
- Updated vendored `rg` and tightened Bazel/Cargo lockfile sync checks to reduce dependency drift. (#12007, #11790)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.101.0...rust-v0.102.0

- #10268 app-server: add fuzzy search sessions for streaming file search @nornagon-openai
- #11547 Parse first order skill/connector mentions @canvrno-oai
- #11227 feat(app-server): experimental flag to persist extended history @owenlin0
- #10672 Add js_repl host helpers and exec end events @fjord-oai
- #11512 add a slash command to grant sandbox read access to inaccessible directories @iceweasel-oai
- #11631 chore(core) Deprecate approval_policy: on-failure @dylan-hurd-oai
- #11636 Better error message for model limit hit. @xl-openai
- #11633 feat: introduce Permissions @bolinfest
- #10669 docs: require insta snapshot coverage for UI changes @joshka-oai
- #11645 fix: skip review_start_with_detached_delivery_returns_new_thread_id o… @owenlin0
- #11639 [feat] add seatbelt permission files @celia-oai
- #11622 Remove absolute path in rollout_summary @wendyjiao-openai
- #10671 Add js_repl_tools_only model and routing restrictions @fjord-oai
- #11657 app-server tests: disable shell_snapshot for review suite @bolinfest
- #11646 app-server: stabilize detached review start on Windows @bolinfest
- #11638 fix(app-server): surface more helpful errors for json-rpc @owenlin0
- #11417 [apps] Add is_enabled to app info. @mzeng-openai
- #11630 Add new apps_mcp_gateway @canvrno-oai
- #11656 Persist complete TurnContextItem state via canonical conversion @charley-oai
- #11510 Remove git commands from dangerous command checks @joshka-oai
- #11668 feat(shell-tool-mcp): add patched zsh build pipeline @nornagon-openai
- #11275 Added a test to verify that feature flags that are enabled by default are stable @etraut-openai
- #11651 Add cwd as an optional field to thread/list @acrognale-oai
- #11660 chore(approvals) More approvals scenarios @dylan-hurd-oai
- #11518 [apps] Fix app loading logic. @mzeng-openai
- #11679 fix: dont show NUX for upgrade-target models that are hidden @sayan-oai
- #11515 Point Codex App tooltip links to app landing page @joshka-oai
- #11671 chore(core) Restrict model-suggested rules @dylan-hurd-oai
- #11703 fix(ci) lock rust toolchain at 1.93.0 to unblock @dylan-hurd-oai
- #11662 feat(network-proxy): structured policy signaling and attempt correlation to core @viyatb-oai
- #11709 fix(shell-tool-mcp) build dependencies @dylan-hurd-oai
- #11618 feat: add token usage on memories @jif-oai
- #11722 Lower missing rollout log level @jif-oai
- #11712 chore: streamline phase 2 @jif-oai
- #11731 feat: memories config @jif-oai
- #11736 feat: increase windows workers stack @jif-oai
- #11739 feat: add slug in name @jif-oai
- #11745 chore: move explorer to spark @jif-oai
- #11748 Fix memories output schema requirements @jif-oai
- #11669 core: limit search_tool_bm25 to Apps and clarify discovery guidance @apanasenko-oai
- #11755 app-server-test-client websocket client and thread tools @maxj-oai
- #11663 fix: reduce flakiness of compact_resume_after_second_compaction_preserves_history @bolinfest
- #11667 sandbox NUX metrics update @iceweasel-oai
- #11695 Updated app bug report template @etraut-openai
- #11477 feat: switch on dying sub-agents @jif-oai
- #11711 feat(tui): prevent macOS idle sleep while turns run @yvolovich-cyber
- #11686 Report syntax errors in rules file @etraut-openai
- #11763 Update read_path prompt @zuxin-oai
- #11772 chore: mini @jif-oai
- #11697 [apps] Improve app listing filtering. @mzeng-openai
- #11666 Add js_repl kernel crash diagnostics @fjord-oai
- #11687 support app usage analytics @alexsong-oai
- #11769 Improve GitHub issue deduplication reliability by introducing a stage… @etraut-openai
- #11770 fix(nix): use correct version from Cargo.toml in flake build @rupurt
- #11677 turn metadata: per-turn non-blocking @pash-openai
- #11692 rmcp-client: fix auth crash @maxj-oai
- #10590 tui: preserve remote image attachments across resume/backtrack @charley-oai
- #11782 turn metadata followups @pash-openai
- #11773 [app-server] add fuzzyFileSearch/sessionCompleted @nornagon-openai
- #11756 codex-rs: fix thread resume rejoin semantics @maxj-oai
- #11793 fix: send unfiltered models over model/list @sayan-oai
- #11799 fix(protocol): make local image test Bazel-friendly @joshka-oai
- #11796 Fix js_repl view_image test runtime panic @fjord-oai
- #11800 Fix js_repl in-flight tool-call waiter race @fjord-oai
- #11658 feat(skills): add permission profiles from openai.yaml metadata @celia-oai
- #11790 bazel: enforce MODULE.bazel.lock sync with Cargo.lock @joshka-oai
- #11803 add perf metrics for connectors load @alexsong-oai
- #11659 Handle model-switch base instructions after compaction @charley-oai
- #11813 Fixed help text for `mcp` and `mcp-server` CLI commands @etraut-openai
- #11672 feat(core): add structured network approval plumbing and policy decision model @viyatb-oai
- #11674 feat(tui): render structured network approval prompts in approval overlay @viyatb-oai
- #11550 feat(tui) Permissions update history item @dylan-hurd-oai
- #11767 fix(core): add linux bubblewrap sandbox tag @viyatb-oai
- #11534 Add process_uuid to sqlite logs @charley-oai
- #11487 core: snapshot tests for compaction requests, post-compaction layout, some additional compaction tests @charley-oai
- #11690 fix: show user warning when using default fallback metadata @sayan-oai
- #11780 chore(tui): reduce noisy key logging @apanasenko-oai
- #11884 fix: only emit unknown model warning on user turns @sayan-oai
- #11893 bazel: fix snapshot parity for tests/*.rs rust_test targets @apanasenko-oai
- #11759 feat: use shell policy in shell snapshot @jif-oai
- #11615 Allow hooks to error @gt-oai
- #11918 chore: rename collab feature flag key to multi_agent @jif-oai
- #11924 nit: memory storage @jif-oai
- #11917 feat: add customizable roles for multi-agents @jif-oai
- #11926 docs: mention Codex app in README intro @vb-openai
- #11900 feat: drop MCP managing tools if no MCP servers @jif-oai
- #11939 Rename collab modules to multi agents @jif-oai
- #11894 [apps] Fix app mention syntax. @mzeng-openai
- #11866 chore(core) rm Feature::RequestRule @dylan-hurd-oai
- #11948 add(feedback): over-refusal / safety check @fouad-openai
- #11860 Fixed screen reader regression in CLI @etraut-openai
- #11964 add(core): safety check downgrade warning @fouad-openai
- #11951 fix(core) exec_policy parsing fixes @dylan-hurd-oai
- #11932 fix: js_repl reset hang by clearing exec tool calls without waiting @jif-oai
- #11974 Hide /debug slash commands from popup menu @jif-oai
- #11922 fix: race in js repl @jif-oai
- #11969 fix(ci) Fix shell-tool-mcp.yml @dylan-hurd-oai
- #11908 Exit early when session initialization fails @jif-oai
- #11986 nit: wording multi-agent @jif-oai
- #11995 feat: add `--search` to `just log` @jif-oai
- #11994 feat: add `--compact` mode to `just log` @jif-oai
- #11833 Don't allow model_supports_reasoning_summaries to disable reasoning @etraut-openai
- #11807 Centralize context update diffing logic @charley-oai
- #12007 Update vendored rg to the latest stable version (15.1) @etraut-openai
- #11970 Protect workspace .agents directory in Windows sandbox @etraut-openai
- #12005 Add /statusline tooltip entry @jif-oai
- #11982 feat: move agents config to main config @jif-oai
- #11224 chore: clarify web_search deprecation notices and consolidate tests @sayan-oai
- #12001 Feat: add model reroute notification @shijie-oai
- #11801 Add remote skill scope/product_surface/enabled params and cleanup @xl-openai




## rust-v0.101.0 — 2026-02-12

## Bug Fixes
- Model resolution now preserves the requested model slug when selecting by prefix, so model references stay stable instead of being rewritten. (#11602)
- Developer messages are now excluded from phase-1 memory input, reducing noisy or irrelevant content entering memory. (#11608)
- Memory phase processing concurrency was reduced to make consolidation/staging more stable under load. (#11614)

## Chores
- Cleaned and simplified the phase-1 memory pipeline code paths. (#11605)
- Minor repository maintenance: formatting and test-suite hygiene updates in remote model tests. (#11619)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.100.0...rust-v0.101.0

- #11605 chore: drop and clean from phase 1 @jif-oai
- #11602 fix(core) model_info preserves slug @dylan-hurd-oai
- #11608 exclude developer messages from phase-1 memory input @wendyjiao-openai
- #11591 Add cwd to memory files @wendyjiao-openai
- #11614 chore: reduce concurrency of memories @jif-oai
- #11619 fix: fmt @jif-oai




## rust-v0.100.0 — 2026-02-12

## New Features
- Added an experimental, feature-gated JavaScript REPL runtime (`js_repl`) that can persist state across tool calls, with optional runtime path overrides. (#10674)
- Added support for multiple simultaneous rate limits across the protocol, backend client, and TUI status surfaces. (#11260)
- Reintroduced app-server websocket transport with a split inbound/outbound architecture, plus connection-aware thread resume subscriptions. (#11370, #11474)
- Added memory management slash commands in the TUI (`/m_update`, `/m_drop`) and expanded memory-read/metrics plumbing. (#11569, #11459, #11593)
- Enabled Apps SDK apps in ChatGPT connector handling. (#11486)
- Promoted sandbox capabilities on both Linux and Windows, and introduced a new `ReadOnlyAccess` policy shape for configurable read access. (#11381, #11341, #11387)

## Bug Fixes
- Fixed websocket incremental output duplication, prevented appends after `response.completed`, and treated `response.incomplete` as an error path. (#11383, #11402, #11558)
- Improved websocket session stability by continuing ping handling when idle and suppressing noisy first-retry errors during quick reconnects. (#11413, #11548)
- Fixed stale thread entries by dropping missing rollout files and cleaning stale DB metadata during thread listing. (#11572)
- Fixed Windows multi-line paste reliability in terminals (especially VS Code integrated terminal) by increasing paste burst timing tolerance. (#9348)
- Fixed incorrect inheritance of `limit_name` when merging partial rate-limit updates. (#11557)
- Reduced repeated skill parse-error spam during active edits by increasing file-watcher debounce from 1s to 10s. (#11494)

## Documentation
- Added JS REPL documentation and config/schema guidance for enabling and configuring the feature. (#10674)
- Updated app-server websocket transport documentation in the app-server README. (#11370)

## Chores
- Split `codex-common` into focused `codex-utils-*` crates to simplify dependency boundaries across Rust workspace components. (#11422)
- Improved Rust release pipeline throughput and reliability for Windows and musl targets, including parallel Windows builds and musl link fixes. (#11488, #11500, #11556)
- Prevented GitHub release asset upload collisions by excluding duplicate `cargo-timing.html` artifacts. (#11564)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.99.0...rust-v0.100.0

- #11383 Do not resend output items in incremental websockets connections @pakrym-oai
- #11246 chore: persist turn_id in rollout session and make turn_id uuid based @celia-oai
- #11260 feat: support multiple rate limits @xl-openai
- #11412 tui: show non-file layer content in /debug-config @bolinfest
- #11405 Remove `test-support` feature from `codex-core` and replace it with explicit test toggles @bolinfest
- #11428 fix: flaky test @jif-oai
- #11429 feat: improve thread listing @jif-oai
- #11422 feat: split codex-common into smaller utils crates @bolinfest
- #11439 feat: new memory prompts @jif-oai
- #11305 Cache cloud requirements @gt-oai
- #11452 nit: increase max raw memories @jif-oai
- #11455 feat: close mem agent after consolidation @jif-oai
- #11454 fix: optional schema of memories @jif-oai
- #11449 feat: set policy for phase 2 memory @jif-oai
- #11420 chore: rename disable_websockets -> websockets_disabled @sayan-oai
- #11402 Do not attempt to append after response.completed @pakrym-oai
- #11462 clean: memory rollout recorder @jif-oai
- #11381 feat(core): promote Linux bubblewrap sandbox to Experimental @viyatb-oai
- #11389 Extract `codex-config` from `codex-core` @bolinfest
- #11370 Reapply "Add app-server transport layer with websocket support" @maxj-oai
- #11470 feat: panic if Constrained<WebSearchMode> does not support Disabled @bolinfest
- #11475 feat: remove "cargo check individual crates" from CI @bolinfest
- #11459 feat: memory read path @jif-oai
- #11471 chore: clean rollout extraction in memories @jif-oai
- #9348 fix(tui): increase paste burst char interval on Windows to 30ms @yuvrajangadsingh
- #11464 chore: sub-agent never ask for approval @jif-oai
- #11414 Linkify feedback link @pakrym-oai
- #11480 chore: update mem prompt @jif-oai
- #11485 fix: Constrained import @owenlin0
- #11341 Promote Windows Sandbox @iceweasel-oai
- #10674 Add feature-gated freeform js_repl core runtime @fjord-oai
- #11419 refactor: codex app-server ThreadState @maxj-oai
- #11413 Pump pings @pakrym-oai
- #11488 feat: use more powerful machines for building Windows releases @bolinfest
- #11479 nit: memory truncation @jif-oai
- #11494 Increased file watcher debounce duration from 1s to 10s @etraut-openai
- #11335 Add AfterToolUse hook @gt-oai
- #11500 feat: build windows support binaries in parallel @bolinfest
- #11290 chore(tui) Simplify /status Permissions @dylan-hurd-oai
- #11503 Make codex-sdk depend on openai/codex @pakrym-oai
- #11474 app-server: thread resume subscriptions @maxj-oai
- #11277 Added seatbelt policy rule to allow os.cpus @etraut-openai
- #11506 chore: inject originator/residency headers to ws client @apanasenko-oai
- #11497 Hydrate previous model across resume/fork/rollback/task start @aibrahim-oai
- #11513 feat: try to fix bugs I saw in the wild in the resource parsing logic @bolinfest
- #11509 Consolidate search_tool feature into apps @apanasenko-oai
- #11388 change model cap to server overload @willwang-openai
- #11504 Pre-sampling compact with previous model context @aibrahim-oai
- #11516 Clamp auto-compact limit to context window @aibrahim-oai
- #11520 Update context window after model switch @aibrahim-oai
- #11519 Use slug in tui @pakrym-oai
- #11522 fix: add --test_verbose_timeout_warnings to bazel.yml @bolinfest
- #11526 fix: remove errant Cargo.lock files @bolinfest
- #11521 test(app-server): stabilize app/list thread feature-flag test by using file-backed MCP OAuth creds @bolinfest
- #11387 feat: make sandbox read access configurable with `ReadOnlyAccess` @bolinfest
- #11486 [apps] Allow Apps SDK apps. @mzeng-openai
- #11532 fix compilation @sayan-oai
- #11531 Teach codex to test itself @pakrym-oai
- #11540 ci: remove actions/cache from rust release workflows @bolinfest
- #11542 ci(windows): use DotSlash for zstd in rust-release-windows @bolinfest
- #11498 build(linux-sandbox): always compile vendored bubblewrap on Linux; remove CODEX_BWRAP_ENABLE_FFI @viyatb-oai
- #11545 fix: make project_doc skill-render tests deterministic @bolinfest
- #11543 ci: capture cargo timings in Rust CI and release workflows @bolinfest
- #11539 Bump rmcp to 0.15 @gpeal
- #11548 Hide the first websocket retry @pakrym-oai
- #11551 Add logs to model cache @aibrahim-oai
- #11556 Fix rust-release failures in musl linking and release asset upload @bolinfest
- #11558 Handle response.incomplete @pakrym-oai
- #11557 fix: stop inheriting rate-limit limit_name @xl-openai
- #11564 rust-release: exclude cargo-timing.html from release assets @bolinfest
- #11546 fix: update memory writing prompt @zuxin-oai
- #11448 Fix test flake @gt-oai
- #11569 feat: mem slash commands @jif-oai
- #11573 Fix flaky pre_sampling_compact switch test @jif-oai
- #11571 feat: mem drop cot @jif-oai
- #11572 Ensure list_threads drops stale rollout files @jif-oai
- #11575 fix: db stuff mem @jif-oai
- #11581 nit: upgrade DB version @jif-oai
- #11577 feat: truncate with model infos @jif-oai
- #11590 chore: clean consts @jif-oai
- #11593 feat: metrics to memories @jif-oai
- #11579 Fix config test on macOS @gt-oai
- #11600 feat: add sanitizer to redact secrets @jif-oai
- #11609 chore: drop mcp validation of dynamic tools @jif-oai




## rust-v0.99.0 — 2026-02-11

## New Features

- Running direct shell commands no longer interrupts an in-flight turn; commands can execute concurrently when a turn is active. (#10513)
- Added `/statusline` to configure which metadata appears in the TUI footer interactively. (#10546)
- The TUI resume picker can now toggle sort order between creation time and last-updated time with an in-picker mode indicator. (#10752)
- App-server clients now get dedicated APIs for steering active turns, listing experimental features, resuming agents, and opting out of specific notifications. (#10721, #10821, #10903, #11319)
- Enterprise/admin requirements can now restrict web search modes and define network constraints through `requirements.toml`. (#10964, #10958)
- Image attachments now accept GIF and WebP inputs in addition to existing formats. (#11237)
- Enable snapshotting of the shell environment and `rc` files (#11172)

## Bug Fixes

- Fixed a Windows startup issue where buffered keypresses could cause the TUI sign-in flow to exit immediately. (#10729)
- Required MCP servers now fail fast during start/resume flows instead of continuing in a broken state. (#10902)
- Fixed a file-watcher bug that emitted spurious skills reload events and could generate very large log files. (#11217)
- Improved TUI input reliability: long option labels wrap correctly, Tab submits in steer mode when idle, history recall keeps cursor placement consistent, and stashed drafts restore image placeholders correctly. (#11123, #10035, #11295, #9040)
- Fixed model-modality edge cases by surfacing clearer `view_image` errors on text-only models and stripping unsupported image history during model switches. (#11336, #11349)
- Reduced false approval mismatches for wrapped/heredoc shell commands and guarded against empty command lists in exec policy evaluation. (#10941, #11397)

## Documentation

- Expanded app-server docs and protocol references for `turn/steer`, experimental-feature discovery, `resume_agent`, notification opt-outs, and null `developer_instructions` normalization. (#10721, #10821, #10903, #10983, #11319)
- Updated TUI composer docs to reflect draft/image restoration, steer-mode Tab submit behavior, and history-navigation cursor semantics. (#9040, #10035, #11295)

## Chores

- Reworked npm release packaging so platform-specific binaries are distributed via `@openai/codex` dist-tags, reducing package-size pressure while preserving platform-specific installs (including `@alpha`). (#11318, #11339)
- Pulled in a security-driven dependency update for `time` (RUSTSEC-2026-0009). (#10876)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.98.0...rust-v0.99.0

- #10729 fix(tui): flush input buffer on init to prevent early exit on Windows @Ashutosh0x
- #10689 fix: flaky landlock @jif-oai
- #10513 Allow user shell commands to run alongside active turns @jif-oai
- #10738 nit: backfill stronger @jif-oai
- #10246 adding fork information (UI) when forking @pap-openai
- #10748 Update explorer role default model @jif-oai
- #10425 Include real OS info in metrics. @iceweasel-oai
- #10745 feat: resumable backfill @jif-oai
- #10758 feat: wire ephemeral in `codex exec` @jif-oai
- #10756 chore: handle shutdown correctly in tui @jif-oai
- #10637 feat: add memory tool @jif-oai
- #10751 feat: repair DB in case of missing lines @jif-oai
- #10762 nit: add DB version in discrepancy recording @jif-oai
- #10621 Leverage state DB metadata for thread summaries @jif-oai
- #9691 Add hooks implementation and wire up to `notify` @gt-oai
- #10546 feat(tui): add /statusline command for interactive status line configuration @fcoury
- #10752 feat(tui): add sortable resume picker with created/updated timestamp toggle @fcoury
- #10769 fix(tui): fix resume_picker_orders_by_updated_at test @owenlin0
- #10423 fix(auth): isolate chatgptAuthTokens concept to auth manager and app-server @owenlin0
- #10775 nit: gpt-5.3-codex announcement @jif-oai
- #10782 nit: gpt-5.3-codex announcement 2 @jif-oai
- #10711 add sandbox policy and sandbox name to codex.tool.call metrics @iceweasel-oai
- #10660 chore: rm web-search-eligible header @sayan-oai
- #10783 fix: announcement in prio @jif-oai
- #10721 [app-server] Add a method to list experimental features. @mzeng-openai
- #10787 chore: limit update to 0.98.0 NUX to < 0.98.0 ver @sayan-oai
- #10655 Add analytics for /rename and /fork @pap-openai
- #10790 feat: wait for backfill to be ready @jif-oai
- #10693 Add app-server transport layer with websocket support @maxj-oai
- #10818 other announcement @jif-oai
- #10815 Sync app-server requirements API with refreshed cloud loader @xl-openai
- #10820 go back to auto-enabling web_search for azure @sayan-oai
- #10727 Send beta header with websocket connects @pakrym-oai
- #10809 updates: use brew api for version check @magus
- #10793 Add stage field for experimental flags. @mzeng-openai
- #10821 feat(app-server): turn/steer API @owenlin0
- #10792 Print warning when config does not meet requirements @gt-oai
- #10699 feat: expose detailed metrics to runtime metrics @apanasenko-oai
- #10784 Gate app tooltips to macOS @aibrahim-oai
- #10843 Log an event (info only) when we receive a file watcher event @etraut-openai
- #10852 Personality setting is no longer available in experimental menu @etraut-openai
- #10840 Removed the "remote_compaction" feature flag @etraut-openai
- #10876 sec: fix version of `time` to prevent vulnerability @jif-oai
- #10892 nit: test an @jif-oai
- #10894 feat: backfill async again @jif-oai
- #10902 Handle required MCP startup failures across components @jif-oai
- #10851 Removed "exec_policy" feature flag @etraut-openai
- #10457 Queue nudges while plan generating @charley-oai
- #10822 Add app configs to config.toml @canvrno-oai
- #10420 feat(network-proxy): add structured policy decision to blocked errors @viyatb-oai
- #10814 fix(linux-sandbox): block io_uring syscalls in no-network seccomp policy @viyatb-oai
- #10698 core: preconnect Responses websocket for first turn @joshka-oai
- #10574 core: refresh developer instructions after compaction replacement history @charley-oai
- #10914 chore(app-server): update AGENTS.md for config + optional collection guidance @owenlin0
- #10928 chore(app-server): add experimental annotation to relevant fields @owenlin0
- #10927 Treat compaction failure as failure state @aibrahim-oai
- #10861 Support alternative websocket API @by-openai
- #10826 add originator to otel @alexsong-oai
- #10855 TUI/Core: preserve duplicate skill/app mention selection across submit + resume @daniel-oai
- #10943 app-server: print help message to console when starting websockets server @JaviSoto
- #10938 Mark Config.apps as experimental, correct schema generation issue @canvrno-oai
- #10947 fix(tui): conditionally restore status indicator using message phase @sayan-oai
- #10965 refactor(network-proxy): flatten network config under [network] @viyatb-oai
- #10970 Fixed a flaky test @etraut-openai
- #10710 Process-group cleanup for stdio MCP servers to prevent orphan process storms @etraut-openai
- #10964 feat: add support for allowed_web_search_modes in requirements.toml @bolinfest
- #10977 fix: use expected line ending in codex-rs/core/config.schema.json @bolinfest
- #10973 Do not poll for usage when using API Key auth @etraut-openai
- #10921 Show left/right arrows to navigate in tui request_user_input @charley-oai
- #10988 fix: normalize line endings when reading file on Windows @bolinfest
- #10903 Add resume_agent collab tool @jif-oai
- #10909 Bootstrap shell commands via user shell snapshot @jif-oai
- #10993 Fix flaky windows CI test @etraut-openai
- #10987 Fixed a flaky Windows test that is consistently causing a CI failure @etraut-openai
- #10958 feat(core): add network constraints schema to requirements.toml @viyatb-oai
- #10983 app-server: treat null mode developer instructions as built-in defaults @charley-oai
- #11039 feat: include state of [experimental_network] in /debug-config output @bolinfest
- #11040 Simplify pre-connect @pakrym-oai
- #10966 feat: enable premessage-deflate for websockets @apanasenko-oai
- #9040 fix(tui): rehydrate drafts and restore image placeholders @Chriss4123
- #10824 Fallback to HTTP on UPGRADE_REQUIRED @pakrym-oai
- #11028 Defer persistence of rollout file @etraut-openai
- #10980 fix: remove config.schema.json from tag check @bolinfest
- #11051 Gate view_image tool by model input_modalities @wiltzius-openai
- #11109 [bazel] Upgrade some rulesets in preparation for enabling windows @zbarsky-openai
- #11114 chore: refactor network-proxy so that ConfigReloader is injectable behavior @bolinfest
- #10718 Upgrade rmcp to 0.14 @mzeng-openai
- #11044 feat: include [experimental_network] in <environment_context> @bolinfest
- #10994 [apps] Improve app loading. @mzeng-openai
- #11121 chore: reverse the codex-network-proxy -> codex-core dependency @bolinfest
- #11105 feat: include NetworkConfig through ExecParams @bolinfest
- #11155 tui: avoid no-op status-line redraws @rakan-oai
- #10799 feat: do not close unified exec processes across turns @jif-oai
- #11172 chore: enable shell snapshot @jif-oai
- #11175 fix: do not show closed agents in `/agent` @jif-oai
- #11173 chore: enable sub agents @jif-oai
- #11193 Deflake mixed parallel tools timing test @gt-oai
- #10770 Load requirements on windows @gt-oai
- #11132 core: account for all post-response items in auto-compact token checks @charley-oai
- #11198 tools: remove get_memory tool and tests @jif-oai
- #10937 Translate websocket errors @rasmusrygaard
- #11217 Fixed bug in file watcher that results in spurious skills update events and large log files @etraut-openai
- #11216 Move warmup to the task level @pakrym-oai
- #11203 Try to stop small helper methods @pakrym-oai
- #11197 [bazel] Upgrade some rulesets in preparation for enabling windows, part 2 @zbarsky-openai
- #11158 chore: remove network-proxy-cli crate @viyatb-oai
- #11230 Revert "chore: enable sub agents" @jif-oai
- #11123 TUI: fix request_user_input wrapping for long option labels @charley-oai
- #11133 core: add focused diagnostics for remote compaction overflows @charley-oai
- #10657 feat: search_tool @apanasenko-oai
- #11199 state: add memory consolidation lock primitives @jif-oai
- #10835 feat: extend skills/list to support additional roots. @xl-openai
- #10960 skill-creator: Remove invalid reference. @xl-openai
- #11219 feat: use a notify instead of grace to close ue process @jif-oai
- #11231 feat: tie shell snapshot to cwd @jif-oai
- #10962 fix(tui): keep unified exec summary on working line @joshka-oai
- #11232 Add originator to otel metadata tags @alexsong-oai
- #11237 adding image support for gif and webp @natea-oai
- #10924 [apps] Add gated instructions for Apps. @mzeng-openai
- #11228 Use longest remote model prefix matching @aibrahim-oai
- #11242 fix(feature) UnderDevelopment feature must be off @dylan-hurd-oai
- #11185 fix: nix build by adding missing dependencies and fix outputHashes @Philipp-M
- #10035 fix(tui): tab submits when no task running in steer mode @joshka-oai
- #11238 Remove offline fallback for models @aibrahim-oai
- #9739 Update models.json @github-actions
- #11255 Revert "Update models.json" @aibrahim-oai
- #11245 deflake linux-sandbox NoNewPrivs timeout @joshka-oai
- #11256 Revert "Revert "Update models.json"" @aibrahim-oai
- #11262 chore: change ConfigState so it no longer depends on a single config.toml file for reloading @bolinfest
- #11263 test: deflake nextest child-process leak in MCP harnesses @joshka-oai
- #11247 Adjust shell command timeouts for Windows @dylan-hurd-oai
- #11240 fix(app-server): for external auth, replace id_token with chatgpt_acc… @owenlin0
- #11140 chore(deps): bump insta from 1.46.2 to 1.46.3 in /codex-rs @dependabot
- #11139 chore(deps): bump anyhow from 1.0.100 to 1.0.101 in /codex-rs @dependabot
- #11138 chore(deps): bump regex from 1.12.2 to 1.12.3 in /codex-rs @dependabot
- #11239 Disable dynamic model refresh for custom model providers @etraut-openai
- #11269 feat: reserve loopback ephemeral listeners for managed proxy @bolinfest
- #11279 [apps] Add thread_id param to optionally load thread config for apps feature check. @mzeng-openai
- #11244 feat: add SkillPolicy to skill metadata and support allow_implicit_invocation @alexsong-oai
- #10215 chore(tui) cleanup /approvals @dylan-hurd-oai
- #11113 feat(sandbox): enforce proxy-aware network routing in sandbox @viyatb-oai
- #10940 feat: support configurable metric_exporter @alexsong-oai
- #11294 chore: put crypto provider logic in a shared crate @bolinfest
- #11207 feat: retain NetworkProxy, when appropriate @bolinfest
- #11200 memories: add extraction and prompt module foundation @jif-oai
- #11191 feat: add connector capabilities to sub-agents @jif-oai
- #11304 Fix spawn_agent input type @jif-oai
- #11300 feat: align memory phase 1 and make it stronger @jif-oai
- #11311 Extract hooks into dedicated crate @jif-oai
- #11306 feat: phase 2 consolidation @jif-oai
- #11318 chore: split NPM packages @jif-oai
- #11322 Fix pending input test waiting logic @jif-oai
- #11265 Remove ApiPrompt @pakrym-oai
- #11295 tui: keep history recall cursor at line end @joshka-oai
- #11288 fix(protocol): approval policy never prompt @fouad-openai
- #11323 Revert "Add app-server transport layer with websocket support (#10693)" @maxj-oai
- #11162 Fix: update parallel tool call exec approval to approve on request id @shijie-oai
- #11249 [apps] Improve app installation flow. @mzeng-openai
- #11319 feat: opt-out of events in the app-server @jif-oai
- #11241 Treat first rollout session_meta as canonical thread identity @guinness-oai
- #11339 # Use `@openai/codex` dist-tags for platform binaries instead of separate package names @bolinfest
- #11330 test(core): stabilize ARM bazel remote-model and parallelism tests @dylan-hurd-oai
- #11345 core: remove stale apply_patch SandboxPolicy TODO in seatbelt @bolinfest
- #11343 Compare full request for websockets incrementality @pakrym-oai
- #11344 fix: reduce usage of `open_if_present`  @jif-oai
- #11336 Always expose view_image and return unsupported image-input error @aibrahim-oai
- #11346 Sanitize MCP image output for text-only models @aibrahim-oai
- #11337 Extract tool building @pakrym-oai
- #10941 fix(core): canonicalize wrapper approvals and support heredoc prefix … @viyatb-oai
- #10946 include sandbox (seatbelt, elevated, etc.) as in turn metadata header @iceweasel-oai
- #11349 Strip unsupported images from prompt history to guard against model switch @aibrahim-oai
- #11348 Use thin LTO for alpha Rust release builds @bolinfest
- #11334 chore: unify memory job flow @jif-oai
- #11364 feat: mem v2 - PR1 @jif-oai
- #11365 feat: mem v2 - PR2 @jif-oai
- #11366 feat: mem v2 - PR3 @jif-oai
- #11274 Update models.json @github-actions
- #11361 # Split command parsing/safety out of `codex-core` into new `codex-command` @bolinfest
- #11369 feat: mem v2 - PR4 @jif-oai
- #11362 Enable SOCKS defaults for common local network proxy use cases @viyatb-oai
- #11359 ci: fall back to local Bazel on forks without BuildBuddy key @joshka-oai
- #11372 feat: mem v2 - PR5 @jif-oai
- #11374 feat: mem v2 - PR6 (consolidation) @jif-oai
- #11377 feat: prevent double backfill @jif-oai
- #11378 chore: rename codex-command to codex-shell-command @bolinfest
- #11376 Update models.json @github-actions
- #11394 Disable very flaky tests @pakrym-oai
- #11386 Prefer websocket transport when model opts in @pakrym-oai
- #11373 tui: queue non-pending rollback trims in app-event order @charley-oai
- #11393 Remove `deterministic_process_ids` feature to avoid duplicate `codex-core` builds @bolinfest
- #11397 fix(exec-policy) No empty command lists @dylan-hurd-oai




## rust-v0.98.0 — 2026-02-05

## New Features
- Introducing GPT-5.3-Codex. [Learn More](https://openai.com/index/introducing-gpt-5-3-codex/)
- Steer mode is now stable and enabled by default, so `Enter` sends immediately during running tasks while `Tab` explicitly queues follow-up input. (#10690)

## Bug Fixes
- Fixed `resumeThread()` argument ordering in the TypeScript SDK so resuming with local images no longer starts an unintended new session. (#10709)
- Fixed model-instruction handling when changing models mid-conversation or resuming with a different model, ensuring the correct developer instructions are applied. (#10651, #10719)
- Fixed a remote compaction mismatch where token pre-estimation and compact payload generation could use different base instructions, improving trim accuracy and avoiding context overflows. (#10692)
- Cloud requirements now reload immediately after login instead of requiring a later refresh path to take effect. (#10725)

## Chores
- Restored the default assistant personality to Pragmatic across config and related tests/UI snapshots. (#10705)
- Unified collaboration mode naming and metadata across prompts, tools, protocol types, and TUI labels for more consistent mode behavior and messaging. (#10666)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.97.0...rust-v0.98.0

- #10709 fix: ensure resume args precede image args @cryptonerdcn
- #10705 chore(config) Default Personality Pragmatic @dylan-hurd-oai
- #10651 fix(core) switching model appends model instructions @dylan-hurd-oai
- #10666 Sync collaboration mode naming across Default prompt, tools, and TUI @charley-oai
- #10690 Make steer stable by default @aibrahim-oai
- #10692 Fix remote compaction estimator/payload instruction small mismatch @charley-oai
- #10725 Reload cloud requirements after user login @xl-openai
- #10719 fix(core,app-server) resume with different model @dylan-hurd-oai




## rust-v0.97.0 — 2026-02-05

## New Features
- Added a session-scoped “Allow and remember” option for MCP/App tool approvals, so repeated calls to the same tool can be auto-approved during the session. (#10584)
- Added live skill update detection, so skill file changes are picked up without restarting. (#10478)
- Added support for mixed text and image content in dynamic tool outputs for app-server integrations. (#10567)
- Added a new `/debug-config` slash command in the TUI to inspect effective configuration. (#10642)
- Introduced initial memory plumbing (API client + local persistence) to support thread memory summaries. (#10629, #10634)
- Added configurable `log_dir` so logs can be redirected (including via `-c` overrides) more easily. (#10678)

## Bug Fixes
- Fixed jitter in the TUI apps/connectors picker by stabilizing description-column rendering. (#10593)
- Restored and stabilized the TUI “working” status indicator/shimmer during preamble and early exec flows. (#10700, #10701)
- Improved cloud requirements reliability with higher timeouts, retries, and corrected precedence over MDM settings. (#10631, #10633, #10659)
- Persisted pending-input user events more consistently for mid-turn injected input handling. (#10656)

## Documentation
- Documented how to opt in to the experimental app-server API. (#10667)
- Updated docs/schema coverage for new `log_dir` configuration behavior. (#10678)

## Chores
- Added a gated Bubblewrap (`bwrap`) Linux sandbox path to improve filesystem isolation options. (#9938)
- Refactored model client lifecycle to be session-scoped and reduced implicit client state. (#10595, #10664)
- Added caching for MCP actions from apps to reduce repeated load latency for users with many installed apps. (#10662)
- Added a `none` personality option in protocol/config surfaces. (#10688)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.96.0...rust-v0.97.0

- #10595 Stop client from being state carrier @pakrym-oai
- #10584 Add option to approve and remember MCP/Apps tool usage @canvrno-oai
- #10644 fix: flaky test @jif-oai
- #10629 feat: add phase 1 mem client @jif-oai
- #10633 Cloud Requirements: take precedence over MDM @gt-oai
- #10659 Increase cloud req timeout @gt-oai
- #9938 feat(linux-sandbox): add bwrap support @viyatb-oai
- #10656 Persist pending input user events @aibrahim-oai
- #10634 feat: add phase 1 mem db @jif-oai
- #10593 Fix jitter in TUI apps/connectors picker  @canvrno-oai
- #10662 [apps] Cache MCP actions from apps. @mzeng-openai
- #10649 Fix test_shell_command_interruption flake @gt-oai
- #10642 Add /debug-config slash command @gt-oai
- #10478 Added support for live updates to skills @etraut-openai
- #10688 add none personality option @aibrahim-oai
- #10567 feat(app-server, core): allow text + image content items for dynamic tool outputs @owenlin0
- #10667 chore(app-server): document experimental API opt-in @owenlin0
- #10664 Session-level model client @pakrym-oai
- #10678 feat(core): add configurable log_dir @joshka-oai
- #10631 Cloud Requirements: increase timeout and retries @gt-oai
- #10650 chore(core) personality migration tests @dylan-hurd-oai
- #10701 fix(tui): restore working shimmer after preamble output @joshka-oai
- #10700 fix: ensure status indicator present earlier in exec path @sayan-oai




## rust-v0.96.0 — 2026-02-04

## New Features
- Added `thread/compact` to the v2 app-server API as an async trigger RPC, so clients can start compaction immediately and track completion separately. (#10445)
- Added websocket-side rate limit signaling via a new `codex.rate_limits` event, with websocket parity for ETag/reasoning metadata handling. (#10324)
- Enabled `unified_exec` on all non-Windows platforms. (#10641)
- Constrained requirement values now include source provenance, enabling source-aware config debugging in UI flows like `/debug-config`. (#10568)

## Bug Fixes
- Fixed `Esc` handling in the TUI `request_user_input` overlay: when notes are open, `Esc` now exits notes mode instead of interrupting the session. (#10569)
- Thread listing now queries the state DB first (including archived threads) and falls back to filesystem traversal only when needed, improving listing correctness and resilience. (#10544)
- Fixed thread path lookup to require that the resolved file actually exists, preventing invalid thread-id resolutions. (#10618)
- Dynamic tool injection now runs in a single transaction to avoid partial state updates. (#10614)
- Refined `request_rule` guidance used in approval-policy prompting to correct rule behavior. (#10379, #10598)

## Documentation
- Updated app-server docs for `thread/compact` to clarify its asynchronous behavior and thread-busy lifecycle. (#10445)
- Updated TUI docs to match the mode-specific `Esc` behavior in `request_user_input`. (#10569)

## Chores
- Migrated state DB helpers to a versioned SQLite filename scheme and cleaned up legacy state files during runtime initialization. (#10623)
- Expanded runtime telemetry with websocket timing metrics and simplified internal metadata flow in core client plumbing. (#10577, #10589)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.95.0...rust-v0.96.0

- #10569 tui: make Esc clear request_user_input notes while notes are shown @charley-oai
- #10577 feat: log webscocket timing into runtime metrics @apanasenko-oai
- #10445 Add thread/compact v2  @aibrahim-oai
- #10589 Move metadata calculation out of client @pakrym-oai
- #10379 fix(core) updated request_rule guidance @dylan-hurd-oai
- #10598 fix(core) Request Rule guidance tweak @dylan-hurd-oai
- #10544 Prefer state DB thread listings before filesystem @jif-oai
- #10614 fix: single transaction for dyn tools injection @jif-oai
- #10568 Requirements: add source to constrained requirement values @gt-oai
- #10611 chore: simplify user message detection @jif-oai
- #10618 fix: make sure file exist in `find_thread_path_by_id_str_in_subdir` @jif-oai
- #10619 nit: cleaning @jif-oai
- #10324 Add a codex.rate_limits event for websockets @rasmusrygaard
- #10623 Migrate state DB path helpers to versioned filename @jif-oai
- #10638 Update tests to stop using sse_completed fixture @pakrym-oai
- #10641 feat: land unified_exec @jif-oai




## rust-v0.95.0 — 2026-02-04

## New Features
- Added `codex app <path>` on macOS to launch Codex Desktop from the CLI, with automatic DMG download if it is missing. (#10418)
- Added personal skill loading from `~/.agents/skills` (with `~/.codex/skills` compatibility), plus app-server APIs/events to list and download public remote skills. (#10437, #10448)
- `/plan` now accepts inline prompt arguments and pasted images, and slash-command editing/highlighting in the TUI is more polished. (#10269)
- Shell-related tools can now run in parallel, improving multi-command execution throughput. (#10505)
- Shell executions now receive `CODEX_THREAD_ID`, so scripts and skills can detect the active thread/session. (#10096)
- Added vendored Bubblewrap + FFI wiring in the Linux sandbox as groundwork for upcoming runtime integration. (#10413)

## Bug Fixes
- Hardened Git command safety so destructive or write-capable invocations no longer bypass approval checks. (#10258)
- Improved resume/thread browsing reliability by correctly showing saved thread names and fixing thread listing behavior. (#10340, #10383)
- Fixed first-run trust-mode handling so sandbox mode is reported consistently, and made `$PWD/.agents` read-only like `$PWD/.codex`. (#10415, #10524)
- Fixed `codex exec` hanging after interrupt in websocket/streaming flows; interrupted turns now shut down cleanly. (#10519)
- Fixed review-mode approval event wiring so `requestApproval` IDs align with the corresponding command execution items. (#10416)
- Improved 401 error diagnostics by including server message/body details plus `cf-ray` and `requestId`. (#10508)

## Documentation
- Expanded TUI chat composer docs to cover slash-command arguments and attachment handling in plan/review flows. (#10269)
- Refreshed issue templates and labeler prompts to better separate CLI/app bug reporting and feature requests. (#10411, #10453, #10548, #10552)

## Chores
- Completed migration off the deprecated `mcp-types` crate to `rmcp`-based protocol types/adapters, then removed the legacy crate. (#10356, #10349, #10357)
- Updated the `bytes` dependency for a security advisory and cleaned up resolved advisory configuration. (#10525)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.94.0...rust-v0.95.0

- #10340 Session picker shows thread_name if set @pap-openai
- #10381 chore: collab experimental @jif-oai
- #10231 feat: experimental flags @jif-oai
- #10382 nit: shell snapshot retention to 3 days @jif-oai
- #10383 fix: thread listing @jif-oai
- #10386 fix: Rfc3339 casting @jif-oai
- #10356 feat: add MCP protocol types and rmcp adapters @bolinfest
- #10269 Nicer highlighting of slash commands, /plan accepts prompt args and pasted images @charley-oai
- #10274 Add credits tooltip @pakrym-oai
- #10394 chore: ignore synthetic messages @jif-oai
- #10398 feat: drop sqlx logging @jif-oai
- #10281 Select experimental features with space @pakrym-oai
- #10402 feat: add `--experimental` to `generate-ts` @jif-oai
- #10258 fix: unsafe auto-approval of git commands @viyatb-oai
- #10411 Updated labeler workflow prompt to include "app" label @etraut-openai
- #10399 emit a separate metric when the user cancels UAT during elevated setup @iceweasel-oai
- #10377 chore(tui) /personalities tip @dylan-hurd-oai
- #10252 [feat] persist thread_dynamic_tools in db @celia-oai
- #10437 feat: Read personal skills from .agents/skills @gverma-openai
- #10145 make codex better at git @pash-openai
- #10418 Add `codex app` macOS launcher @aibrahim-oai
- #10447 Fix plan implementation prompt reappearing after /agent thread switch @charley-oai
- #10064 TUI: Render request_user_input results in history and simplify interrupt handling @charley-oai
- #10349 feat: replace custom mcp-types crate with equivalents from rmcp @bolinfest
- #10415 Fixed sandbox mode inconsistency if untrusted is selected @etraut-openai
- #10452 Hide short worked-for label in final separator @aibrahim-oai
- #10357 chore: remove deprecated mcp-types crate @bolinfest
- #10454 app tool tip @aibrahim-oai
- #10455 chore: add phase to message responseitem @sayan-oai
- #10414 Require models refresh on cli version mismatch @aibrahim-oai
- #10271 [Codex][CLI] Gate image inputs by model modalities @ccy-oai
- #10374 Trim compaction input @pakrym-oai
- #10453 Updated bug and feature templates @etraut-openai
- #10465 Restore status after preamble @pakrym-oai
- #10406 fix: clarify deprecation message for features.web_search @sayan-oai
- #10474 Ignore remote_compact_trims_function_call_history_to_fit_context_window on windows @pakrym-oai
- #10413 feat(linux-sandbox): vendor bubblewrap and wire it with FFI @viyatb-oai
- #10142 feat(secrets): add codex-secrets crate @viyatb-oai
- #10157 chore: nuke chat/completions API @jif-oai
- #10498 feat: drop wire_api from clients @jif-oai
- #10501 feat: clean codex-api part 1 @jif-oai
- #10508 Add more detail to 401 error @gt-oai
- #10521 Avoid redundant transactional check before inserting dynamic tools @jif-oai
- #10525 chore: update bytes crate in response to security advisory @bolinfest
- #10408 fix WebSearchAction type clash between v1 and v2 @sayan-oai
- #10404 Cleanup collaboration mode variants @charley-oai
- #10505 Enable parallel shell tools @jif-oai
- #10532 feat: `find_thread_path_by_id_str_in_subdir` from DB @jif-oai
- #10524 fix: make $PWD/.agents read-only like $PWD/.codex @bolinfest
- #10096 Inject CODEX_THREAD_ID into the terminal environment @maxj-oai
- #10536 Revert "Load untrusted rules" @viyatb-oai
- #10412 fix(app-server): fix TS annotations for optional fields on requests @owenlin0
- #10416 fix(app-server): fix approval events in review mode @owenlin0
- #10545 Improve Default mode prompt (less confusion with Plan mode) @charley-oai
- #10289 [apps] Gateway MCP should be blocking. @mzeng-openai
- #10189 implement per-workspace capability SIDs for workspace specific ACLs @iceweasel-oai
- #10548 Updated bug templates and added a new one for app @etraut-openai
- #10531 [codex] Default values from requirements if unset @gt-oai
- #10552 Fixed icon for CLI bug template @etraut-openai
- #10039 chore(arg0): advisory-lock janitor for codex tmp paths @viyatb-oai
- #10448 feat: add APIs to list and download public remote skills @xl-openai
- #10519 Handle exec shutdown on Interrupt (fixes immortal `codex exec` with websockets) @rasmusrygaard
- #10556 Feat: add upgrade to app server modelList @shijie-oai
- #10461 feat(tui): pace catch-up stream chunking with hysteresis @joshka-oai
- #10367 chore: add `codex debug app-server` tooling @celia-oai




## rust-v0.94.0 — 2026-02-02

## New Features
- Plan mode is now enabled by default with updated interaction guidance in the plan prompt. (#10313, #10308, #10329)
- Personality configuration is now stable: default is friendly, the config key is `personality`, and existing settings migrate forward. (#10305, #10314, #10310, #10307)
- Skills can be loaded from `.agents/skills`, with clearer relative-path instructions and nested-folder markers supported. (#10317, #10282, #10350)
- Console output now includes runtime metrics for easier diagnostics. (#10278)

## Bug Fixes
- Unarchiving a thread updates its timestamp so sidebar ordering refreshes. (#10280)
- Conversation rules output is capped and prefix rules are deduped to avoid repeated rules. (#10351, #10309)
- Override turn context no longer appends extra items. (#10354)

## Documentation
- Fixed a broken image link in the npm README. (#10303)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.93.0...rust-v0.94.0

- #10278 feat: show runtime metrics in console @apanasenko-oai
- #10285 display promo message in usage error @willwang-openai
- #10302 fix(nix): update flake for newer Rust toolchain requirements @douglaz
- #10296 chore(features) remove Experimental tag from UTF8 @dylan-hurd-oai
- #10303 Fix npm README image link @fouad-openai
- #10306 chore(app-server) add personality update test @dylan-hurd-oai
- #10308 plan mode prompt @aibrahim-oai
- #10305 chore(core) Default to friendly personality @dylan-hurd-oai
- #10307 feat(core,tui,app-server) personality migration @dylan-hurd-oai
- #10313 enable plan mode @aibrahim-oai
- #10120 feat: fire tracking events for skill invocation @alexsong-oai
- #10317 feat: Support loading skills from .agents/skills @gverma-openai
- #10282 Make skills prompt explicit about relative-path lookup @xl-openai
- #10316 Add websocket telemetry metrics and labels @apanasenko-oai
- #10314 chore(config) Rename config setting to personality @dylan-hurd-oai
- #10310 chore(features) Personality => Stable @dylan-hurd-oai
- #10320 Sync system skills from public repo @gverma-openai
- #10322 Sync system skills from public repo for openai yaml changes @gverma-openai
- #10323 fix(config) config schema newline @dylan-hurd-oai
- #10329 Improve plan mode interaction rules @charley-oai
- #10280 Bump thread updated_at on unarchive to refresh sidebar ordering @charley-oai
- #10350 fix: System skills marker includes nested folders recursively @gverma-openai
- #10351 fix(rules) Limit rules listed in conversation @dylan-hurd-oai
- #10354 Do not append items on override turn context @pakrym-oai
- #10309 fix(core) Deduplicate prefix_rules before appending @dylan-hurd-oai
- #10373 chore(core) gpt-5.2-codex personality template @dylan-hurd-oai
- #10375 fix(personality) prompt patch @dylan-hurd-oai
- #10371 feat: vendor app-server protocol schema fixtures @bolinfest




## rust-v0.93.0 — 2026-01-31

## New Features
- Added an optional SOCKS5 proxy listener with policy enforcement and config gating. (#9803)
- Plan mode now streams proposed plans into a dedicated TUI view, plus a feature-gated `/plan` shortcut for quick mode switching. (#9786, #10103)
- Added `/apps` to browse connectors in TUI and `$` insertion for app prompts. (#9728)
- App-server can now run in external auth mode, accepting ChatGPT auth tokens from a host app and requesting refreshes when needed. (#10012)
- Smart approvals are now enabled by default, with explicit approval prompts for MCP tool calls. (#10286, #10200)
- Introduced a SQLite-backed log database with an improved logs client, thread-id filtering, retention, and heuristic coloring. (#10086, #10087, #10150, #10151, #10229, #10228)

## Bug Fixes
- MCP tool image outputs render reliably even when image blocks aren’t first or are partially malformed. (#9815)
- Input history recall now restores local image attachments and rich text elements. (#9628)
- File search now tracks session CWD changes and supports multi-root traversal with better performance. (#9279, #9939, #10240)
- Resuming a thread no longer updates `updated_at` until the first turn actually starts. (#9950)
- Shell snapshots no longer inherit stdin, avoiding hangs from startup scripts. (#9735)
- Connections fall back to HTTP when WebSocket proxies fail. (#10139)

## Documentation
- Documented app-server AuthMode usage and behavior. (#10191)

## Chores
- Upgraded the Rust toolchain to 1.93. (#10080)
- Updated pnpm versions used in the repo. (#9992, #10161)
- Bazel build and runfiles handling improvements, including remote cache compression. (#10079, #10098, #10102, #10104)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.92.0...rust-v0.93.0

- #9988 nit: better tool description @jif-oai
- #9991 nit: better unused prompt @jif-oai
- #9994 chore: clean orchestrator prompt @jif-oai
- #10001 backend-client: add get_config_requirements_file @gt-oai
- #9992 update pnpm to 10.28.2 to address security issues @mjr-openai
- #9993 description in role type @jif-oai
- #9944 TUI footer: right-align context and degrade shortcut summary + mode cleanly @charley-oai
- #9803 feat(network-proxy): add a SOCKS5 proxy with policy enforcement @viyatb-oai
- #9950 fix(app-server, core): defer initial context write to rollout file until first turn @owenlin0
- #10003 feat: make it possible to specify --config flags in the SDK @bolinfest
- #9797 remove sandbox globals. @iceweasel-oai
- #10009 chore: introduce *Args types for new() methods @bolinfest
- #10011 really fix pwd for windows codex zip @iceweasel-oai
- #10007 Remove load from SKILL.toml fallback @alexsong-oai
- #10008 enable live web search for DangerFullAccess sandbox policy @sayan-oai
- #9815 Fix: Render MCP image outputs regardless of ordering @Kbediako
- #9654 Show OAuth error descriptions in callback responses @blevy-oai
- #10030 Clarify external editor env var message @joshka-oai
- #9949 Ask user question UI footer improvements @charley-oai
- #9359 tui: stabilize shortcut overlay snapshots on WSL @slkzgm
- #10040 fix: enable per-turn updates to web search mode @sayan-oai
- #10041 fix: allow unknown fields on Notice in schema @sayan-oai
- #9628 Restore image attachments/text elements when recalling input history (Up/Down) @charley-oai
- #9982 [skills] Auto install MCP dependencies when running skils with dependency specs. @mzeng-openai
- #9986 fix(core) info cleanup @dylan-hurd-oai
- #9941 error code/msg details for failed elevated setup @iceweasel-oai
- #9489 feat(core) RequestRule @dylan-hurd-oai
- #10026 Add exec policy TOML representation @gt-oai
- #9821 feat: codex exec auto-subscribe to new threads @jif-oai
- #10004 feat: sqlite 1 @jif-oai
- #10083 feat: sort metadata by date @jif-oai
- #10092 Update shell-tool-mcp.yml @dylan-hurd-oai
- #10079 [bazel] Enable remote cache compression @zbarsky-openai
- #10025 Refine request_user_input TUI interactions and option UX @charley-oai
- #10080 Upgrade to rust 1.93 @zbarsky-openai
- #10095 Update shell-tool-mcp.yml @dylan-hurd-oai
- #9939 file-search: improve file query perf @nornagon-openai
- #10097 chore: deprecate old web search feature flags @sayan-oai
- #10034 compaction @aibrahim-oai
- #10028 allow elevated sandbox to be enabled without base experimental flag @iceweasel-oai
- #10101 fix(ci) fix shell-tool-mcp version v2 @dylan-hurd-oai
- #10043 Added `tui.notifications_method` config option @etraut-openai
- #10104 [bazel] Fix the build @zbarsky-openai
- #10102 default enable compression, update test helpers @sayan-oai
- #10111 fix(ci) more shell-tool-mcp issues @dylan-hurd-oai
- #10115 update the ci pnpm workflow for shell-tool-mcp to use corepack for pnpm versioning @mjr-openai
- #10098 [bazel] Improve runfiles handling @zbarsky-openai
- #10129 Ensure auto-compaction starts after turn started @aibrahim-oai
- #10116 chore(config) personality as a feature @dylan-hurd-oai
- #10123 Add app-server compaction item notifications tests @aibrahim-oai
- #10114 chore(config) Update personality instructions @dylan-hurd-oai
- #10128 removing quit from dropdown menu, but not autocomplete [cli] @natea-oai
- #9728 [connectors] Support connectors part 2 - slash command and tui @mzeng-openai
- #10133 chore(core) personality under development @dylan-hurd-oai
- #10125 emit a metric when we can't spawn powershell @iceweasel-oai
- #10134 fix(tui) reorder personality command @dylan-hurd-oai
- #10135 fix(ci) missing package.json for shell-mcp-tool @dylan-hurd-oai
- #10131 fix: ignore key release events during onboarding @joshka-oai
- #10138 fix: remove references to corepack @bolinfest
- #10086 feat: add log db @jif-oai
- #10089 feat: async backfill @jif-oai
- #10087 feat: log db client @jif-oai
- #10149 chore: improve client @jif-oai
- #10161 nit: update npm @jif-oai
- #10163 [experimental] nit: try to speed up apt-install @jif-oai
- #10164 [experimental] nit: try to speed up apt-install 2 @jif-oai
- #10150 feat: adding thread ID to logs + filter in the client @jif-oai
- #10151 feat: add log retention and delete them after 90 days @jif-oai
- #10152 chore: unify log queries @jif-oai
- #10175 Add OpenAI docs MCP tooltip @joshka-oai
- #10171 feat: reduce span exposition @jif-oai
- #10139 Fall back to http when websockets fail @pakrym-oai
- #10140 chore: ensure pnpm-workspace.yaml is up-to-date @bolinfest
- #9017 Better handling skill depdenencies on ENV VAR. @xl-openai
- #10182 fix: unify `npm publish` call across shell-tool-mcp.yml and rust-release.yml @bolinfest
- #10180 Add features enable/disable subcommands @joshka-oai
- #10184 fix: /approvals -> /permissions @bolinfest
- #10179 Remove WebSocket wire format @pakrym-oai
- #10186 updating comment to better indicate intent of skipping `quit` in the main slash command menu @natea-oai
- #10118 [Codex][CLI] Show model-capacity guidance on 429 @ccy-oai
- #10012 feat(app-server): support external auth mode @owenlin0
- #10103 tui: add feature-gated /plan slash command to switch to Plan mode @charley-oai
- #10191 chore(app-server): document AuthMode @owenlin0
- #10130 [feat] persist dynamic tools in session rollout file @celia-oai
- #10181 add error messages for the go plan type @willwang-openai
- #10198 feat(tui): route employee feedback follow-ups to internal link @joshka-oai
- #10194 load from yaml @alexsong-oai
- #10147 chore(personality) new schema with fallbacks @dylan-hurd-oai
- #10200 MCP tool call approval (simplified version) @mzeng-openai
- #10154 feat: add output to `/ps` @jif-oai
- #10217 nit: actually run tests @jif-oai
- #10177 Add community links to startup tooltips @joshka-oai
- #10210 Chore: plan mode do not include free form question and always include isOther @shijie-oai
- #10218 feat: backfill timing metric @jif-oai
- #10220 chore: unify metric @jif-oai
- #8991 Conversation naming @pap-openai
- #10167 Fetch Requirements from cloud @gt-oai
- #10225 explorer prompt @jif-oai
- #10222 fix: make sure the shell exists @jif-oai
- #10232 chore: do not clean the DB anymore @jif-oai
- #10229 feat: improve logs client @jif-oai
- #10228 feat: heuristic coloring of logs @jif-oai
- #10237 nit: fix db with multiple metadata lines @jif-oai
- #10208 feat: refactor CodexAuth so invalid state cannot be represented @bolinfest
- #10212 chore(feature) Experimental: Personality @dylan-hurd-oai
- #10211 chore(feature) Experimental: Smart Approvals @dylan-hurd-oai
- #10190 Load exec policy rules from requirements @gt-oai
- #10195 plan mode: add TL;DR checkpoint and client behavior note @baumann-oai
- #10239 chore: fix the build breakage that came from a merge race @bolinfest
- #9786 Plan mode: stream proposed plans, emit plan items, and render in TUI @charley-oai
- #10063 Tui: hide Code mode footer label @charley-oai
- #10244 chore: rename ChatGpt -> Chatgpt in type names @bolinfest
- #10238 Plan mode prompt @aibrahim-oai
- #10251 Fix deploy @charley-oai
- #10255 plan prompt @aibrahim-oai
- #10253 Make plan highlight use popup grey background @charley-oai
- #10207 Skip loading codex home as project layer @daniel-oai
- #10256 Update copy @pakrym-oai
- #9735 core: prevent shell_snapshot from inheriting stdin @swordfish444
- #10262 Fix main @pakrym-oai
- #10265 Hide /approvals from the slash-command list @pakrym-oai
- #10267 Update announcement_tip.toml @pakrym-oai
- #10240 file-search: multi-root walk @nornagon-openai
- #10266 fix: dont auto-enable web_search for azure @sayan-oai
- #9279 fix: update file search directory when session CWD changes @yuvrajangadsingh
- #10249 Validate CODEX_HOME before resolving @etraut-openai
- #10272 chore: implement Mul for TruncationPolicy @bolinfest
- #10241 Wire up cloud reqs in exec, app-server @gt-oai
- #10263 Add enforce_residency to requirements @gt-oai
- #10276 add missing fields to WebSearchAction and update app-server types @sayan-oai
- #10283 Turn on cloud requirements for business too @gt-oai
- #10287 Fix minor typos in comments and documentation @ruyut
- #10286 feat(core) Smart approvals on @dylan-hurd-oai




## rust-v0.92.0 — 2026-01-27

## New Features
- API v2 threads can now inject dynamic tools at startup and route their calls/responses end-to-end through the server and core tool pipeline. (#9539)
- Added filtering on the thread list in the app server to make large thread sets easier to browse. (#9897)
- Introduced a `thread/unarchive` RPC to restore archived rollouts back into active sessions. (#9843)
- MCP servers can now define OAuth scopes in `config.toml`, reducing the need to pass `--scopes` on each login. (#9647)
- Multi-agent collaboration is more capable and safer, with an explorer role, better collab event mapping, and max-depth guardrails. (#9817, #9818, #9918, #9899)
- Cached `web_search` is now the default client behavior. (#9974)

## Bug Fixes
- Fixed a TUI deadlock/freeze under high streaming throughput by avoiding blocking sends on the main Tokio thread. (#9951)
- The `web_search` tool now handles and displays all action types, and shows in-progress activity instead of appearing stuck. (#9960)
- Reduced high CPU usage in collaboration flows by eliminating busy-waiting on subagents. (#9776)
- Fixed `codex resume --last --json` so prompts parse correctly without conflicting argument errors. (#9475)
- Windows sandbox logging now handles UTF-8 safely, preventing failures when truncating multibyte content. (#8647)
- `request_user_input` is now rejected outside Plan/Pair modes to prevent invalid tool calls. (#9955)

## Documentation
- Updated the contribution guidelines for clearer onboarding and workflow expectations. (#9933)
- Refreshed protocol/MCP docs to reflect `thread/unarchive` and the updated `request_user_input` question shape. (#9843, #9890)

## Chores
- Self-update via Homebrew now uses an explicit cask upgrade command to avoid warnings and ambiguity. (#9823)
- Release packaging now consistently writes the bundle zip to `dist/`. (#9934)
- Updated key dependencies in the Rust workspace (including `axum`, `tracing`, `globset`, and `tokio-test`). (#9880, #9882, #9883, #9884)
- Aligned feature stage naming with public maturity stages and added clearer warnings for underdevelopment features. (#9929, #9954)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.91.0...rust-v0.92.0

- #9850 chore: remove extra newline in println @SohailRaoufi
- #9868 Adjust modes masks @aibrahim-oai
- #9874 Prompt @aibrahim-oai
- #9877 Plan prompt @aibrahim-oai
- #9718 feat(tui) /personality @dylan-hurd-oai
- #9871 chore(core) move model_instructions_template config @dylan-hurd-oai
- #9539 feat: dynamic tools injection @jif-oai
- #9818 feat: rebase multi-agent tui on `config_snapshot` @jif-oai
- #9789 Fix flakey resume test @gt-oai
- #9784 Fix flakey conversation flow test @gt-oai
- #9918 feat: explorer collab @jif-oai
- #9899 feat: disable collab at max depth @jif-oai
- #9916 Fix up config disabled err msg @gt-oai
- #9890 Feat: add isOther to question returned by request user input tool @shijie-oai
- #9817 feat: codex exec mapping of collab tools @jif-oai
- #9919 Fix flakey shell snapshot test @gt-oai
- #9776 fix: attempt to reduce high cpu usage when using collab @eugeneoden
- #9928 prompt @aibrahim-oai
- #9925 chore: update interrupt message @jif-oai
- #9843 Add thread/unarchive to restore archived rollouts @charley-oai
- #9929 Aligned feature stage names with public feature maturity stages @etraut-openai
- #9934 ensure codex bundle zip is created in dist/ @iceweasel-oai
- #9897 [app-server] feat: add filtering on thread list  @jif-oai
- #9647 Add MCP server `scopes` config and use it as fallback for OAuth login @blevy-oai
- #9943 plan prompt @aibrahim-oai
- #8647 fix: handle utf-8 in windows sandbox logs @davidgilbertson
- #9891 Add composer config and shared menu surface helpers @aibrahim-oai
- #9880 chore(deps): bump tracing from 0.1.43 to 0.1.44 in /codex-rs @dependabot
- #9882 chore(deps): bump tokio-test from 0.4.4 to 0.4.5 in /codex-rs @dependabot
- #9883 chore(deps): bump axum from 0.8.4 to 0.8.8 in /codex-rs @dependabot
- #9884 chore(deps): bump globset from 0.4.16 to 0.4.18 in /codex-rs @dependabot
- #9901 fix: remove cli tooltip references to custom prompts @mattridley
- #9823 fix: use `brew upgrade --cask codex` to avoid warnings and ambiguity @JBallin
- #9951 fix: try to fix freezes 2 @jif-oai
- #9955 Reject request_user_input outside Plan/Pair @charley-oai
- #9933 Updated contribution guidelines @etraut-openai
- #9892 Reuse ChatComposer in request_user_input overlay @aibrahim-oai
- #9957 NIT larger buffer @jif-oai
- #9953 feat: load interface metadata from SKILL.json @alexsong-oai
- #9954 Warn users on enabling underdevelopment features @aibrahim-oai
- #9961 Use test_codex more @pakrym-oai
- #9960 fix: handle all web_search actions and in progress invocations @sayan-oai
- #9966 plan prompt v7 @aibrahim-oai
- #9968 Improve plan mode prompt @aibrahim-oai
- #9969 prompt final @aibrahim-oai
- #9475 Fix `resume --last` with `--json` option @etraut-openai
- #9970 prompt @aibrahim-oai
- #9975 plan prompt @aibrahim-oai
- #9974 make cached web_search client-side default @sayan-oai
- #9971 tui: wrapping user input questions @aibrahim-oai
- #9977 make plan prompt less detailed @aibrahim-oai
- #9980 Fixing main and make plan mode reasoning effort medium @aibrahim-oai
- #9759 Fix: cap aggregated exec output consistently @Kbediako




## rust-v0.91.0 — 2026-01-25

## Chores
- Reduced the maximum allowed number of sub-agents to 6 to tighten resource usage and guardrails in agent fan-out behavior (#9861)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.90.0...rust-v0.91.0

- #9861 chore: half max number of sub-agents @jif-oai




## rust-v0.90.0 — 2026-01-25

## New Features
- Added a network sandbox proxy with policy enforcement to better control outbound network access. (#8442)
- Introduced the first phase of connectors support via the app server and MCP integration, including new config/docs updates. (#9667)
- Shipped collaboration mode as beta in the TUI, with a clearer plan → execute handoff and simplified mode selection (Coding vs Plan). (#9690, #9712, #9802, #9834)
- Added ephemeral threads and improved collaboration tool provenance metadata for spawned threads. (#9765, #9769)
- WebSocket connections now support proxy configuration. (#9719)
- More strict limitation on multi-agents

## Bug Fixes
- Fixed exec policy parsing for multiline quoted arguments. (#9565)
- `--yolo` now skips the git repository check instead of failing outside a repo. (#9590)
- Improved resume reliability by handling out-of-order events and prompting for the working directory when it differs. (#9512, #9731)
- Backspace no longer deletes a text element when the cursor is at the element’s left edge. (#9630)
- Config loading errors are clearer and more actionable across surfaces. (#9746)
- Default model selection now respects filtered presets to avoid invalid defaults. (#9782)

## Documentation
- Corrected a typo in the experimental collaboration prompt template. (#9716)
- Added documentation for the new connectors configuration surface. (#9667)

## Chores
- Refreshed the bundled model catalog/presets. (#9726)
- Updated GitHub Actions for Node 24 compatibility. (#9722)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.89.0...rust-v0.90.0

- #9715 feat: fix formatting of `codex features list` @bolinfest
- #9716 Fix typo in experimental_prompt.md @iudizm
- #9719 feat: support proxy for ws connection @apanasenko-oai
- #9712 TUI: prompt to implement plan and switch to Execute @charley-oai
- #9713 use machine scope instead of user scope for dpapi. @iceweasel-oai
- #9726 Update models.json @github-actions
- #9667 [connectors] Support connectors part 1 - App server & MCP @mzeng-openai
- #9674 feat(app-server) Expose `personality` @dylan-hurd-oai
- #9733 Change the prompt for planning and reasoning effort @aibrahim-oai
- #9730 Hide mode cycle hint while a task is running @charley-oai
- #9720 feat: add session source as otel metadata tag @alexsong-oai
- #9565 Fix execpolicy parsing for multiline quoted args @jdsalasca
- #9745 chore: use some raw strings to reduce quoting @bolinfest
- #9753 nit: exclude PWD for rc sourcing @jif-oai
- #9690 feat: tui beta for collab @jif-oai
- #9116 Persist text element ranges and attached images across history/resume @charley-oai
- #9777 plan mode prompt change @aibrahim-oai
- #9590 fix(exec): skip git repo check when --yolo flag is used @zerone0x
- #9722 Upgrade GitHub Actions for Node 24 compatibility @salmanmkc
- #9611 Print warning if we skip config loading @gt-oai
- #9782 Select default model from filtered presets @aibrahim-oai
- #9512 Fix resume picker when user event appears after head @jdsalasca
- #9787 Remove stale TODO comment from defs.bzl @jcoens-openai
- #9700 still load skills @gt-oai
- #9791 Load untrusted rules @gt-oai
- #9707 bundle sandbox helper binaries in main zip, for winget. @iceweasel-oai
- #9792 Chore: remove mode from header @aibrahim-oai
- #9793 change collaboration mode to struct @aibrahim-oai
- #8442 feat: introducing a network sandbox proxy @viyatb-oai
- #9802 Have a coding mode and only show coding and plan @aibrahim-oai
- #9746 Another round of improvements for config error messages @etraut-openai
- #9812 Remove batman reference from experimental prompt @charley-oai
- #9769 feat: add thread spawn source for collab tools @jif-oai
- #9765 feat: ephemeral threads @jif-oai
- #9819 fix: libcc link @jif-oai
- #9820 fix: musl build @jif-oai
- #9316 fix(windows-sandbox): remove request files after read @MaxMiksa
- #9630 Prevent backspace from removing a text element when the cursor is at the element’s left edge @charley-oai
- #9840 Revert "fix: musl build" @aibrahim-oai
- #9778 Raise welcome animation breakpoint to 37 rows @mzeng-openai
- #9731 Ask for cwd choice when resuming session from different cwd @charley-oai
- #9841 Revert "fix: libcc link" @aibrahim-oai
- #9806 Use collaboration mode masks without mutating base settings @aibrahim-oai
- #9834 Mark collab as beta @pakrym-oai
- #9847 Revert "Revert "fix: musl build"" @jif-oai
- #9855 feat: cap number of agents @jif-oai




## rust-v0.89.0 — 2026-01-22

## New Features
- Added a `/permissions` command with a shorter approval set while keeping `/approvals` for compatibility. (#9561)
- Added a `/skill` UI to enable or disable individual skills. (#9627)
- Improved slash-command selection by prioritizing exact and prefix matches over fuzzy matches. (#9629)
- App server now supports `thread/read` and can filter archived threads in `thread/list`. (#9569, #9571)
- App server clients now support layered `config.toml` resolution and `config/read` can compute effective config from a given cwd. (#9510)
- Release artifacts now include a stable URL for the published config schema. (#9572)

## Bug Fixes
- Prevented tilde expansion from escaping HOME on paths like `~//...`. (#9621)
- TUI turn timing now resets between assistant messages so elapsed time reflects the latest response. (#9599)

## Documentation
- Updated MCP subcommand docs to match current CLI behavior. (#9622)
- Refreshed the `skills/list` protocol README example to match the latest response shape. (#9623)

## Chores
- Removed the TUI2 experiment and its related config/docs, keeping Codex on the terminal-native UI. (#9640)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.88.0...rust-v0.89.0

- #9576 [bazel] Upgrade to bazel9 @zbarsky-openai
- #9606 nit: ui on interruption @jif-oai
- #9609 chore: defensive shell snapshot @jif-oai
- #9621 fix: Fix tilde expansion to avoid absolute-path escape @tiffanycitra
- #9573 define/emit some metrics for windows sandbox setup @iceweasel-oai
- #9622 docs: fix outdated MCP subcommands documentation @htiennv
- #9623 Update skills/list protocol readme @gverma-openai
- #9616 [bazel] Upgrade llvm toolchain and enable remote repo cache @zbarsky-openai
- #9624 forgot to add some windows sandbox nux events. @iceweasel-oai
- #9633 Add websockets logging @pakrym-oai
- #9592 Chore: update plan mode output in prompt @shijie-oai
- #9583 Add collaboration_mode to TurnContextItem @charley-oai
- #9510 Add layered config.toml support to app server @etraut-openai
- #9629 feat: better sorting of shell commands @jif-oai
- #9599 fix(tui) turn timing incremental @dylan-hurd-oai
- #9572 feat: publish config schema on release @sayan-oai
- #9549 Reduce burst testing flake @charley-oai
- #9640 feat(tui): retire the tui2 experiment @joshka-oai
- #9597 feat(core) ModelInfo.model_instructions_template @dylan-hurd-oai
- #9627 Add UI for skill enable/disable. @xl-openai
- #9650 chore: tweak AGENTS.md @dylan-hurd-oai
- #9656 Add tui.experimental_mode setting @pakrym-oai
- #9561 feat(tui) /permissions flow @dylan-hurd-oai
- #9653 Fix: Lower log level for closed-channel send @Kbediako
- #9659 Chore: add cmd related info to exec approval request @shijie-oai
- #9693 Revert "feat: support proxy for ws connection" @pakrym-oai
- #9698 Support end_turn flag @pakrym-oai
- #9645 Modes label below textarea @charley-oai
- #9644 feat(core) update Personality on turn @dylan-hurd-oai
- #9569 feat(app-server): thread/read API @owenlin0
- #9571 feat(app-server): support archived threads in thread/list @owenlin0




## rust-v0.88.0 — 2026-01-21

## New Features
- Added device-code auth as a standalone fallback in headless environments. (#9333)

## Bug Fixes
- Load configs from trusted folders only and fix symlinked `config.toml` resolution. (#9533, #9445)
- Fixed Azure endpoint invalid input errors. (#9387)
- Resolved a memory leak in core runtime. (#9543)
- Prevented interrupted turns from repeating. (#9043)
- Fixed WSL TUI image paste regression. (#9473)

## Documentation
- Updated MCP documentation link to the current destination. (#9490)
- Corrected a “Multi-agents” naming typo in docs. (#9542)
- Added developer instructions for collaboration modes. (#9424)

## Chores
- Upgraded to Rust 1.92 and refreshed core Rust dependencies. (#8860, #9465, #9466, #9467, #9468, #9469)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.87.0...rust-v0.88.0

- #9373 fix: flaky tests @jif-oai
- #9333 [device-auth] Add device code auth as a standalone option when headless environment is detected. @mzeng-openai
- #9352 Made `codex exec resume --last` consistent with `codex resume --last` @etraut-openai
- #9324 add codex cloud list @nornagon-openai
- #9332 Turn-state sticky routing per turn @aibrahim-oai
- #9364 feat: tool call duration metric @jif-oai
- #8860 chore: upgrade to Rust 1.92.0 @viyatb-oai
- #9385 feat: /fork the current session instead of opening session picker @apanasenko-oai
- #9247 feat(app-server, core): return threads by created_at or updated_at @owenlin0
- #9330 feat: show forked from session id in /status @apanasenko-oai
- #9340 Introduce collaboration modes @aibrahim-oai
- #9328 Support enable/disable skill via config/api. @xl-openai
- #9408 Add collaboration_mode override to turns @aibrahim-oai
- #9400 fix(codex-api): treat invalid_prompt as non-retryable @fouad-openai
- #9401 Defer backtrack trim until rollback confirms @aibrahim-oai
- #9414 fix unified_exec::tests::unified_exec_timeouts to use a more unique match value @ahornby
- #9421 Expose collaboration presets @aibrahim-oai
- #9422 chore(core) Create instructions module @dylan-hurd-oai
- #9423 chore(instructions) Remove unread SessionMeta.instructions field @dylan-hurd-oai
- #9424 Add collaboration developer instructions @aibrahim-oai
- #9425 Preserve slash command order in search @aibrahim-oai
- #9059 tui: allow forward navigation in backtrack preview @slkzgm
- #9443 Add collaboration modes test prompts @aibrahim-oai
- #9457 fix(tui2): running /mcp was not printing any output until another event triggered a flush @bolinfest
- #9445 Fixed symlink support for config.toml @etraut-openai
- #9466 chore(deps): bump log from 0.4.28 to 0.4.29 in /codex-rs @dependabot
- #9467 chore(deps): bump tokio from 1.48.0 to 1.49.0 in /codex-rs @dependabot
- #9468 chore(deps): bump arc-swap from 1.7.1 to 1.8.0 in /codex-rs @dependabot
- #9469 chore(deps): bump ctor from 0.5.0 to 0.6.3 in /codex-rs @dependabot
- #9465 chore(deps): bump chrono from 0.4.42 to 0.4.43 in /codex-rs @dependabot
- #9473 Fixed TUI regression related to image paste in WSL @etraut-openai
- #9382 feat: timer total turn metrics @jif-oai
- #9478 feat: close all threads in `/new` @jif-oai
- #9477 feat: detach non-tty childs @jif-oai
- #9479 prompt 3 @jif-oai
- #9387 Fix invalid input error on Azure endpoint @etraut-openai
- #9463 Remove unused protocol collaboration mode prompts @aibrahim-oai
- #9487 chore: warning metric @jif-oai
- #9490 Fixed stale link to MCP documentation @etraut-openai
- #9461 TUI: collaboration mode UX + always submit `UserTurn` when enabled @aibrahim-oai
- #9472 Feat: request user input tool @shijie-oai
- #9402 Act on reasoning-included per turn @aibrahim-oai
- #9496 chore: fix beta VS experimental @jif-oai
- #9495 Feat: plan mode prompt update @shijie-oai
- #9451 tui: avoid Esc interrupt when skill popup active @prateek-oai
- #9497 Migrate tui to use UserTurn @aibrahim-oai
- #9427 fix(core) Preserve base_instructions in SessionMeta @dylan-hurd-oai
- #9393 Persist text elements through TUI input and history @charley-oai
- #9407 fix(tui) fix user message light mode background @dylan-hurd-oai
- #9525 chore: collab in experimental @jif-oai
- #9374 nit: do not render terminal interactions if no task running @jif-oai
- #9529 feat: record timer with additional tags @jif-oai
- #9528 feat: metrics on remote models @jif-oai
- #9527 feat: metrics on shell snapshot @jif-oai
- #9533 Only load config from trusted folders @gt-oai
- #9409 feat: support proxy for ws connection @apanasenko-oai
- #9507 Tui: use collaboration mode instead of model and effort @aibrahim-oai
- #9193 fix: `writable_roots` doesn't recognize home directory symbol in non-windows OS @tiffanycitra
- #9542 Fix typo in feature name from 'Mult-agents' to 'Multi-agents' @simonw
- #9459 feat(personality) introduce model_personality config @dylan-hurd-oai
- #9543 fix: memory leak issue @jif-oai
- #9509 Fixed config merging issue with profiles @etraut-openai
- #9043 fix: prevent repeating interrupted turns @swordfish444
- #9553 fix(core): don't update the file's mtime on resume @owenlin0
- #9552 lookup system SIDs instead of hardcoding English strings. @iceweasel-oai
- #9314 fix(windows-sandbox): deny .git file entries under writable roots @MaxMiksa
- #9319 fix(windows-sandbox): parse PATH list entries for audit roots @MaxMiksa
- #9547 merge remote models @aibrahim-oai
- #9545 Add total (non-partial) TextElement placeholder accessors @charley-oai
- #9532 fix(cli): add execute permission to bin/codex.js @zerone0x
- #9162 Improve UI spacing for queued messages @charley-oai
- #9554 Enable remote models @aibrahim-oai
- #9558 queue only when task is working @aibrahim-oai
- #8590 fix(core): require approval for force delete on Windows @hdcodedev
- #9293 [codex-tui] exit when terminal is dumb @jmickey-oai
- #9562 feat(tui2): add /experimental menu @joshka-oai
- #9563 fix: bminor/bash is no longer on GitHub so use bolinfest/bash instead @bolinfest
- #9568 Show session header before configuration @aibrahim-oai
- #9555 feat: rename experimental_instructions_file to model_instructions_file @bolinfest
- #9518 Prompt Expansion: Preserve Text Elements @charley-oai
- #9560 Reject ask user question tool in Execute and Custom @charley-oai
- #9575 feat: add skill injected counter metric @alexsong-oai
- #9578 Feature to auto-enable websockets transport @pakrym-oai
- #9587 fix CI by running pnpm @aibrahim-oai
- #9586 don't ask for approval for `just fix` @aibrahim-oai
- #9585 Add request-user-input overlay @aibrahim-oai
- #9596 fix going up and down on questions after writing notes @aibrahim-oai
- #9483 feat: max threads config @jif-oai
- #9598 feat: display raw command on user shell @jif-oai
- #9594 Added "codex." prefix to "conversation.turn.count" metric name @etraut-openai
- #9600 feat: async shell snapshot @jif-oai
- #9602 fix: nit tui on terminal interactions @jif-oai
- #9551 nit: better collab tui @jif-oai




## rust-v0.87.0 — 2026-01-16

## New Features
- User message metadata (text elements and byte ranges) now round-trips through protocol/app-server/core so UI annotations can survive history rebuilds. (#9331)
- Collaboration wait calls can block on multiple IDs in one request, simplifying multi-thread coordination. (#9294)
- User shell commands now run under the user snapshot so aliases and shell config are honored. (#9357)
- The TUI now surfaces approval requests from spawned/unsubscribed threads. (#9232)

## Bug Fixes
- Token estimation during compaction is now accurate, improving budgeting during long sessions. (#9337)
- MCP CallToolResult now includes `threadId` in both `content` and `structuredContent`, and returns a defined output schema for compatibility. (#9338)
- The TUI “Worked for” separator only appears after actual work has occurred. (#8958)
- Piped non-PTY commands no longer hang waiting on stdin. (#9369)

## Documentation
- MCP interface docs updated to reflect structured output schema and `threadId` behavior. (#9338)

## Chores
- Windows builds enable the PowerShell UTF-8 feature by default. (#9195)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.86.0...rust-v0.87.0

- #9331 Add text element metadata to protocol, app server, and core @charley-oai
- #9195 chore(windows) Enable Powershell UTF8 feature @dylan-hurd-oai
- #8958 fix(tui): only show 'Worked for' separator when actual work was performed @ThanhNguyxn
- #9338 fix(mcp): include threadId in both content and structuredContent in CallToolResult @bolinfest
- #9337 Fix token estimate during compaction @etraut-openai
- #9336 rename model turn to sampling request @aibrahim-oai
- #9232 feat: propagate approval request of unsubscribed threads @jif-oai
- #9357 feat: run user commands under user snapshot @jif-oai
- #9294 feat: collab wait multiple IDs @jif-oai
- #9366 feat: CODEX_CI @jif-oai
- #9367 prompt collab @jif-oai
- #9369 chore: close pipe on non-pty processes @jif-oai




## rust-v0.86.0 — 2026-01-16

## New Features
- Skill metadata can now be defined in `SKILL.toml` (names, descriptions, icons, brand color, default prompt) and surfaced in the app server and TUI (#9125)
- Clients can explicitly disable web search and signal eligibility via a header to align with server-side rollout controls (#9249)

## Bug Fixes
- Accepting an MCP elicitation now sends an empty JSON payload instead of null to satisfy servers expecting content (#9196)
- Input prompt placeholder styling is back to non-italic to avoid terminal rendering issues (#9307)
- Empty paste events no longer trigger clipboard image reads (#9318)
- Unified exec cleans up background processes to prevent late End events after listeners stop (#9304)

## Chores
- Refresh the orchestrator prompt to improve internal routing behavior (#9301)
- Reduce noisy `needs_follow_up` error logging (#9272)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.85.0...rust-v0.86.0

- #9301 chore: better orchestrator prompt @jif-oai
- #9304 nit: clean unified exec background processes @jif-oai
- #9307 Revert recent styling change for input prompt placeholder text @etraut-openai
- #9125 Support SKILL.toml file. @xl-openai
- #9249 [search] allow explicitly disabling web search @sayan-oai
- #9272 remove needs_follow_up error log @pap-openai
- #9318 Revert empty paste image handling @aibrahim-oai
- #9196 fix: send non-null content on elicitation Accept @yuvrajangadsingh




## rust-v0.85.0 — 2026-01-15

## New Features
- App-server v2 now emits collaboration tool calls as item events in the turn stream, so clients can render agent coordination in real time. (#9213)
- Collaboration tools gained richer agent control: `spawn_agent` accepts an agent role preset, and `send_input` can optionally interrupt a running agent before delivering the message. (#9275, #9276)
- `/models` metadata now includes upgrade migration markdown so clients can display richer guidance when suggesting model upgrades. (#9219)

## Bug Fixes
- [revert] Linux sandboxing now falls back to Landlock-only restrictions when user namespaces are unavailable, and sets `no_new_privs` before applying sandbox rules. (#9250)
- `codex resume --last` now respects the current working directory, with `--all` as an explicit override. (#9245)
- Stdin prompt decoding now handles BOMs/UTF-16 and provides clearer errors for invalid encodings. (#9151)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.84.0...rust-v0.85.0

- #9219 Add `migration_markdown` in `model_info` @aibrahim-oai
- #9250 fix: fallback to Landlock-only when user namespaces unavailable and set PR_SET_NO_NEW_PRIVS early @viyatb-oai
- #9213 feat: collab tools app-server event mapping @jif-oai
- #9275 feat: add agent roles to collab tools @jif-oai
- #9276 feat: add interrupt capabilities to `send_input` @jif-oai
- #9209 feat: basic tui for event emission @jif-oai
- #9245 Changed `codex resume --last` to honor the current cwd @etraut-openai
- #9207 Propagate MCP disabled reason @gt-oai
- #9151 fix(exec): improve stdin prompt decoding @liqiongyu
- #9300 revert: remove pre-Landlock bind mounts apply @viyatb-oai




## rust-v0.84.0 — 2026-01-15

## New Features
- Extend the Rust protocol/types to include additional metadata on text elements, enabling richer client rendering and schema evolution (#9235)

## Chores
- Reduce flaky Rust release pipelines (notably on Windows) by increasing the release build job timeout (#9242)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.83.0...rust-v0.84.0

- #9242 fix: increase timeout for release builds from 30 to 60 minutes @bolinfest
- #9235 Add text element metadata to types @charley-oai




## rust-v0.81.0 — 2026-01-14

## New Features
- Default API model moved to gpt-5.2-codex. (#9188)
- The `codex` tool in `codex mcp-server` now includes the `threadId` in the response so it can be used with the `codex-reply` tool, fixing #3712. The documentation has been updated at https://developers.openai.com/codex/guides/agents-sdk/. (#9192)
- Headless runs now switch to device-code login automatically so sign-in works without a browser. (#8756)
- Linux sandbox can mount paths read-only to better protect files from writes. (#9112)
- Support partial tool calls rendering in `tui`

## Bug Fixes
- Alternate-screen handling now avoids breaking Zellij scrollback and adds a config/flag to control it. (#8555)
- Windows correctly prompts before unsafe commands when running with a read-only sandbox policy. (#9117)
- Config.toml and rules parsing errors are reported to app-server clients/TUI instead of failing silently. (#9182, #9011)
- Worked around a macOS system-configuration crash in proxy discovery. (#8954)
- Invalid user image uploads now surface an error instead of being silently replaced. (#9146)

## Documentation
- Published a generated JSON Schema for `config.toml` in `docs/` to validate configs. (#8956)
- Documented the TUI paste-burst state machine for terminals without reliable bracketed paste. (#9020)

## Chores
- Added Bazel build support plus a `just bazel-codex` helper for contributors. (#8875, #9177)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.80.0...rust-v0.81.0

- #8756 [device-auth] When headless environment is detected, show device login flow instead. @mzeng-openai
- #8930 feat: first pass on clb tool @jif-oai
- #8966 nit: rename session metric @jif-oai
- #8969 chore: non mutable btree when building specs @jif-oai
- #8968 chore: move otel provider outside of trace module @jif-oai
- #8973 chore: add mcp call metric @jif-oai
- #8970 chore: add approval metric @jif-oai
- #8975 chore: metrics tool call @jif-oai
- #8901 chore: update metrics temporality @jif-oai
- #8954 Work around crash in system-configuration library @etraut-openai
- #8873 fix(app-server): set originator header from initialize JSON-RPC request @owenlin0
- #8909 Add config to disable /feedback @gt-oai
- #8985 chore: nuke telemetry file @jif-oai
- #8986 Revert "fix(app-server): set originator header from initialize JSON-RPC request" @jif-oai
- #8978 nit: rename to analytics_enabled @jif-oai
- #8963 renaming: task to turn @jif-oai
- #8555 fix: add tui.alternate_screen config and --no-alt-screen CLI flag for Zellij scrollback @hjanuschka
- #8875 feat: add support for building with Bazel @zbarsky-openai
- #8988 fix(app-server): set originator header from initialize (re-revert) @owenlin0
- #8766 fix: harden arg0 helper PATH handling @viyatb-oai
- #8949 Log unhandled sse events @pakrym-oai
- #8996 Add hierarchical agent prompt @pakrym-oai
- #9003 Delete announcement_tip.toml @pakrym-oai
- #8940 Refactor remote models tests to use TestCodex builder @aibrahim-oai
- #8981 Add model provider info to /status if non-default @gt-oai
- #8984 Add URL to responses error messages @gt-oai
- #9008 fix: add .git to .bazelignore @bolinfest
- #9010 fix: include AGENTS.md as repo root marker for integration tests @bolinfest
- #8950 Label attached images so agent can understand in-message labels @charley-oai
- #9032 Revert "Delete announcement_tip.toml" @jif-oai
- #9018 fix: support remote arm64 builds, as well @zbarsky-openai
- #8983 feat: testing harness for collab 1 @jif-oai
- #9088 feat: add wait tool implementation for collab @jif-oai
- #9090 feat: add close tool implementation for collab @jif-oai
- #8971 add static mcp callback uri support @WhammyLeaf
- #9099 nit: add docstring @jif-oai
- #8994 feat: wire fork to codex cli @apanasenko-oai
- #9071 chore(deps): bump tui-scrollbar from 0.2.1 to 0.2.2 in /codex-rs @dependabot
- #9072 chore(deps): bump ts-rs from 11.0.1 to 11.1.0 in /codex-rs @dependabot
- #9074 chore(deps): bump which from 6.0.3 to 8.0.0 in /codex-rs @dependabot
- #9075 chore(deps): bump clap from 4.5.53 to 4.5.54 in /codex-rs @dependabot
- #9076 chore(deps): bump tokio-util from 0.7.16 to 0.7.18 in /codex-rs @dependabot
- #8957 feat: hot reload mcp servers @shijie-oai
- #9107 Remove unused conversation_id header @pakrym-oai
- #9080 Add some tests for image attachments @charley-oai
- #9114 Extract single responses SSE event parsing @pakrym-oai
- #8961 Assemble sandbox/approval/network prompts dynamically @aibrahim-oai
- #9102 Add model client sessions @pakrym-oai
- #8246 fix(tui): show in-flight coalesced tool calls in transcript overlay @Chriss4123
- #9127 Reuse websocket connection @pakrym-oai
- #9117 fix: prompt for unsafe commands on Windows @bolinfest
- #9128 Websocket append support @pakrym-oai
- #9077 Send message by default mid turn. queue messages by tab @aibrahim-oai
- #9049 Handle image paste from empty paste events @aibrahim-oai
- #8952 Use markdown for migration screen @aibrahim-oai
- #9109 Updated heuristic for tool call summary to detect file modifications @etraut-openai
- #9138 Show tab queue hint in footer @aibrahim-oai
- #9140 Use thread rollback for Esc backtrack @aibrahim-oai
- #9143 chore: better error handling on collab tools @jif-oai
- #9147 nit: collab send input cleaning @jif-oai
- #9129 Support response.done and add integration tests @pakrym-oai
- #8798 ollama: default to Responses API for built-ins @drifkin
- #8956 add generated jsonschema for config.toml @sayan-oai
- #9122 Fix queued messages during /review @charley-oai
- #9126 fix: drop session span at end of the session @apanasenko-oai
- #9101 Restrict MCP servers from `requirements.toml` @gt-oai
- #9020 fix(tui): document paste-burst state machine @joshka-oai
- #9118 feat(app-server): add an --analytics-default-enabled flag @owenlin0
- #9130 Fresh tooltips @mzeng-openai
- #9134 fix(windows-sandbox-rs) bump SETUP_VERSION @dylan-hurd-oai
- #9121 test(tui): add deterministic paste-burst tests @joshka-oai
- #8661 Fix spinner/Esc interrupt when MCP startup completes mid-turn @2mawi2
- #9165 Allow close skill popup with esc. @xl-openai
- #9169 Fix flakiness in WebSocket tests @pakrym-oai
- #9011 fix: report an appropriate error in the TUI for malformed rules @bolinfest
- #9166 fix: integration test for #9011 @bolinfest
- #9177 feat: add bazel-codex entry to justfile @bolinfest
- #9175 WebSocket test server script @pakrym-oai
- #9136 Update models.json @github-actions
- #9168 clean models manager @aibrahim-oai
- #8933 [CODEX-4427] improve parsed commands @aibrahim-oai
- #9174 Renew cache ttl on etag match @aibrahim-oai
- #9124 fix(tui): harden paste-burst state transitions @joshka-oai
- #9186 Use offline cache for tui migrations @aibrahim-oai
- #9182 Improve handling of config and rules errors for app server clients @etraut-openai
- #8997 chore: clarify default shell for unified_exec @sayan-oai
- #9192 feat: add threadId to MCP server messages @bolinfest
- #9188 change api default model @aibrahim-oai
- #9150 feat: add sourcing of rc files to shell snapshot @jif-oai
- #9155 fix: shell snapshot clean-up @jif-oai
- #9146 feat: return an error if the image sent by the user is a bad image @jif-oai
- #9197 feat: only source shell snapshot if the file exists @jif-oai
- #9145 fix: drop double waiting header in TUI @jif-oai
- #9194 Render exec output deltas inline @aibrahim-oai
- #9156 chore: clamp min yield time for empty write_stdin @jif-oai
- #9105 feat: add auto refresh on thread listeners @jif-oai
- #9112 feat: add support for read-only bind mounts in the linux sandbox @viyatb-oai
- #9179 Use current model for review @pakrym-oai




## rust-v0.80.0 — 2026-01-09

## New Features
- Add conversation/thread fork endpoints in the protocol and app server so clients can branch a session into a new thread. (#8866)
- Expose requirements via `requirement/list` so clients can read `requirements.toml` and adjust agent-mode UX. (#8800)
- Introduce metrics capabilities with additional counters for observability. (#8318, #8910)
- Add elevated sandbox onboarding with prompts for upgrade/degraded mode plus the `/elevate-sandbox` command. (#8789)
- Allow explicit skill invocations through v2 API user input. (#8864)

## Bug Fixes
- Codex CLI subprocesses again inherit env vars like `LD_LIBRARY_PATH`/`DYLD_LIBRARY_PATH` to avoid runtime issues. As explained in #8945, failure to pass along these environment variables to subprocesses that expect them (notably GPU-related ones), was causing 10x+ performance regressions! Special thanks to @johnzfitch for the detailed investigation and write-up in #8945. (#8951)
- `/review <instructions>` in TUI/TUI2 now launches the review flow instead of sending plain text. (#8823)
- Patch approval “allow this session” now sticks for previously approved files. (#8451)
- Model upgrade prompt now appears even if the current model is hidden from the picker. (#8802)
- Windows paste handling now supports non-ASCII multiline input reliably. Special thanks to @occurrent laying the groundwork for this fix in #8021! (#8774)
- Git apply path parsing now handles quoted/escaped paths and `/dev/null` correctly to avoid misclassified changes. (#8824)

## Documentation
- App-server README now documents skills support and usage. (#8853)
- Skill-creator docs clarify YAML frontmatter formatting and quoting rules. (#8610)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.79.0...rust-v0.80.0

- #8734 fix: do not propose to add multiline commands to execpolicy @tibo-openai
- #8802 Enable model upgrade popup even when selected model is no longer in picker @charley-oai
- #8805 chore: stabilize core tool parallelism test @tibo-openai
- #8820 chore: silent just fmt @jif-oai
- #8824 fix: parse git apply paths correctly @tibo-openai
- #8823 fix: handle /review arguments in TUI @tibo-openai
- #8822 chore: rename unified exec sessions @jif-oai
- #8825 fix: handle early codex exec exit @tibo-openai
- #8830 chore: unify conversation with thread name @jif-oai
- #8840 Move tests below auth manager @pakrym-oai
- #8845 fix: upgrade lru crate to 0.16.3 @bolinfest
- #8763 Merge Modelfamily into modelinfo @aibrahim-oai
- #8842 remove unnecessary todos @aibrahim-oai
- #8846 Stop using AuthManager as the source of codex_home @pakrym-oai
- #8844 Fix app-server `write_models_cache` to treat models with less priority number as higher priority.  @aibrahim-oai
- #8850 chore: drop useless feature flags @jif-oai
- #8848 chore: drop some deprecated @jif-oai
- #8853 [chore] update app server doc with skills @celia-oai
- #8451 fix: implement 'Allow this session' for apply_patch approvals @owenlin0
- #8856 Override truncation policy at model info level @aibrahim-oai
- #8849 Simplify error managment in `run_turn` @aibrahim-oai
- #8767 Add feature for optional request compression @cconger
- #8610 Clarify YAML frontmatter formatting in skill-creator @darlingm
- #8847 Warn in /model if BASE_URL set @gt-oai
- #8801 Support symlink for skills discovery. @xl-openai
- #8800 Feat: appServer.requirementList for requirement.toml @shijie-oai
- #8861 fix: update resource path resolution logic so it works with Bazel @bolinfest
- #8868 fix: use tokio for I/O in an async function @bolinfest
- #8867 add footer note to TUI @iceweasel-oai
- #8879 feat: introduce find_resource! macro that works with Cargo or Bazel @bolinfest
- #8864 Support UserInput::Skill in V2 API. @xl-openai
- #8876 add ability to disable input temporarily in the TUI. @iceweasel-oai
- #8884 fix: make the find_resource! macro responsible for the absolutize() call @bolinfest
- #8774 fix: windows can now paste non-ascii multiline text @dylan-hurd-oai, @occurrent
- #8855 chore: add list thread ids on manager @jif-oai
- #8318 feat: metrics capabilities @jif-oai
- #8826 fix: stabilize list_dir pagination order @tibo-openai
- #8892 chore: drop metrics exporter config @jif-oai
- #8896 chore: align error limit comment @tibo-openai
- #8899 fix: include project instructions in /review subagent @tibo-openai
- #8894 chore: add small debug client @jif-oai
- #8888 fix: leverage find_resource! macro in load_sse_fixture_with_id @bolinfest
- #8691 Avoid setpgid for inherited stdio on macOS @seeekr
- #8887 fix: leverage codex_utils_cargo_bin() in codex-rs/core/tests/suite @bolinfest
- #8907 chore: drop useless interaction_input @jif-oai
- #8903 nit: drop unused function call error @jif-oai
- #8910 feat: add a few metrics @jif-oai
- #8911 gitignore bazel-* @zbarsky-openai
- #8843 config requirements: improve requirement error messages @gt-oai
- #8914 fix: reduce duplicate include_str!() calls @bolinfest
- #8902 feat: add list loaded threads to app server @jif-oai
- #8870 [fix] app server flaky thread/resume tests @celia-oai
- #8916 clean: all history cloning @jif-oai
- #8915 otel test: retry WouldBlock errors @gt-oai
- #8792 Update models.json @github-actions
- #8897 fix: preserve core env vars on Windows @tibo-openai
- #8913 Add `read-only` when backfilling requirements from managed_config @gt-oai
- #8926 add tooltip hint for shell commands (!) @fps7806
- #8857 Immutable CodexAuth @pakrym-oai
- #8927 nit: parse_arguments @jif-oai
- #8932 fix: increase timeout for tests that have been flaking with timeout issues @bolinfest
- #8931 fix: correct login shell mismatch in the accept_elicitation_for_prompt_rule() test @bolinfest
- #8874 [fix] app server flaky send_messages test @celia-oai
- #8866 feat: fork conversation/thread @apanasenko-oai
- #8858 remove `get_responses_requests` and `get_responses_request_bodies` to use in-place matcher @aibrahim-oai
- #8939 [chore] move app server tests from chat completion to responses @celia-oai
- #8880 Attempt to reload auth as a step in 401 recovery @pakrym-oai
- #8946 fix: increase timeout for wait_for_event() for Bazel @bolinfest
- #8789 Elevated sandbox NUX @iceweasel-oai
- #8917 fix: treat null MCP resource args as empty @tibo-openai
- #8942 Add 5s timeout to models list call + integration test @aibrahim-oai
- #8951 fix: remove existing process hardening from Codex CLI @bolinfest




## rust-v0.79.0 — 2026-01-07

## New Features
- Add multi-conversation “agent control” so a session can spawn or message other conversations programmatically (#8783, #8788)
- Add app-server `thread/rollback` so IDE clients can undo the last N turns without rewriting history (#8454)
- Add `web_search_cached` to enable cached-only Web Search results as a safer alternative to live requests (#8795)
- Allow global exec flags (model/json/sandbox toggles, etc.) to be passed after `codex exec resume` (#8440)
- Show time/version-targeted announcement tips in the TUI, driven by a TOML file in the repo (#8752)
- Add an `[analytics] enabled=...` config section to control analytics behavior (#8350)

## Bug Fixes
- Fix TUI2 transcripts so streamed markdown reflows on resize and copy/paste preserves soft wraps (#8761)
- Make `apply_patch` parsing tolerant of whitespace-padded `*** Begin Patch` / `*** End Patch` markers (#8746)
- Render paths relative to the current working directory before checking git roots, improving output in non-git workspaces (#8771)
- Prevent `CODEX_MANAGED_CONFIG_PATH` from overriding managed config in production, closing a policy bypass (#8762)
- Ensure app-server conversations respect the config passed in by the client (#8765)
- Reduce TUI UX glitches: suppress popups when browsing input history, fix copy “pill” rendering, and clear background terminals on interrupt (#8772, #8777, #8786)

## Documentation
- Clarify onboarding/login guidance for headless/remote setups by steering users to `codex login --device-auth` (#8753)
- Update model examples used in tooling/config to current `gpt-5.2` naming (#8566)

## Chores
- Refactor skills discovery to use the config layer stack so all configured skill folders are considered (#8497)
- Auto-populate GitHub release notes at release creation time (#8799)
- Add more `apply_patch` test scenarios to harden coverage (#8230)
- Tweak unified exec event emission to only send “begin” when a PTY is present (#8780)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.78.0...rust-v0.79.0

- #8753 [device-auth] Update login instruction for headless environments. @mzeng-openai
- #8497 Use ConfigLayerStack for skills discovery. @xl-openai
- #8440 Allow global exec flags after `resume` and fix CI codex build/timeout @fjord-oai
- #8230 chore(apply-patch) additional scenarios @dylan-hurd-oai
- #8746 fix: accept whitespace-padded patch markers @tibo-openai
- #8761 tui2: stop baking streaming wraps; reflow agent markdown @joshka-oai
- #8771 fix: render cwd-relative paths in tui @joshka-oai
- #8770 fix: fix readiness subscribe token wrap-around @tibo-openai
- #8780 chore: emit unified exec begin only when PTY exist @jif-oai
- #8762 fix: stop honoring CODEX_MANAGED_CONFIG_PATH environment variable in production @bolinfest
- #8566 fix: update model examples to gpt-5.2 @seuros
- #8735 feat: add head-tail buffer for `unified_exec` @jif-oai
- #8331 chore: add model/list call to app-server-test-client @owenlin0
- #8752 feat: forced tool tips @jif-oai
- #8786 chore: clear background terminals on interrupt @jif-oai
- #8350 feat: add analytics config setting @JaviSoto
- #8783 feat: agent controller @jif-oai
- #8772 suppress popups while browsing input history @xl-openai
- #8777 Clear copy pill background and add snapshot test @joshka-oai
- #8788 feat: drop agent bus and store the agent status in codex directly @jif-oai
- #8454 feat(app-server): thread/rollback API @owenlin0
- #8765 [app-server] fix config loading for conversations @celia-oai
- #8795 add web_search_cached flag @sayan-oai
- #8799 fix: populate the release notes when the release is created @bolinfest




## rust-v0.78.0 — 2026-01-06

## New Features
- Add `Ctrl+G` to open the current prompt in your configured external editor (`$VISUAL`/`$EDITOR`) and sync edits back into the TUI. (#7606)
- Support project-aware config layering: load repo-local `.codex/config.toml`, honor configurable `project_root_markers`, and merge that with system config like `/etc/codex/config.toml`. (#8354, #8359, #8461)
- Support enterprise-managed configuration requirements on macOS via an MDM-provided TOML payload. (#8743)
- Improve `tui2` transcript navigation with multi-click selection, a copy shortcut/affordance, and a draggable auto-hiding scrollbar. (#8462, #8471, #8728)
- Start Windows PowerShell sessions in UTF-8 mode to reduce encoding-related prompt/output issues. (#7902)
- Exec policy rules can now include human-readable justifications, and policy loading follows the unified config-layer stack. (#8349, #8453, #8751)

## Bug Fixes
- Fix failures when the model returns multiple tool calls in a single turn by emitting tool calls in the format the Chat Completions API expects. (#8556)
- Make `/review` compute diffs from the session’s working directory so base-branch detection works correctly with runtime cwd overrides. (#8738)
- Handle the legacy Chat Completions streaming terminator cleanly to avoid spurious SSE parse errors. (#8708)
- Fix a set of `tui2` rendering/input edge cases (screen corruption, scroll stickiness, and selection/copy correctness). (#8463, #8695, #8449)
- Improve diagnostics when `ripgrep` download fails during CLI packaging so failures are easier to debug. (#8486)
- Avoid a panic when parsing alpha/stable version strings. (#8406)

## Documentation
- Replace and de-duplicate user docs with links to the developer documentation site (including skills docs). (#8662, #8407)
- Clarify configuration documentation, including the `developer_instructions` option. (#8376, #8701)
- Fix broken README links. (#8682)

## Chores
- Performance tuning for TUIs: cap redraw scheduling and reduce unnecessary rerenders during streaming to lower CPU usage. (#8499, #8681, #8693)
- Update Rust dependencies across `codex-rs`. (#8414, #8596, #8597)

## Changelog

Full Changelog: https://github.com/openai/codex/compare/rust-v0.77.0...rust-v0.78.0

- #8407 Point skills docs to developer documentation site @etraut-openai
- #8406 fix: do not panic on alphas @aibrahim-oai
- #8091 Update ghost_commit flag reference to undo @charlie-openai
- #8423 test(tui2): re-enable ANSI for VT100 tests @joshka-oai
- #8419 fix(tui2): constrain transcript mouse selection bounds @joshka-oai
- #8424 chore: un-ship undo @jif-oai
- #8376 docs: add `developer_instructions` config option and update descriptions @448523760
- #8431 chore: drop undo from the docs @jif-oai
- #8410 chore(deps): bump peter-evans/create-pull-request from 7 to 8 @dependabot
- #8412 chore(deps): bump test-log from 0.2.18 to 0.2.19 in /codex-rs @dependabot
- #8413 chore(deps): bump landlock from 0.4.2 to 0.4.4 in /codex-rs @dependabot
- #8414 chore(deps): bump clap from 4.5.47 to 4.5.53 in /codex-rs @dependabot
- #8416 chore(deps): bump openssl-sys from 0.9.109 to 0.9.111 in /codex-rs @dependabot
- #7902 feat(windows) start powershell in utf-8 mode @dylan-hurd-oai
- #8349 Add ExecPolicyManager @pakrym-oai
- #8354 feat: support in-repo .codex/config.toml entries as sources of config info @bolinfest
- #8359 feat: add support for project_root_markers in config.toml @bolinfest
- #8395 Handle concatenation nodes in bash command parser for exec policy @ivanmurashko
- #8446 Update models.json @github-actions
- #8444 use a junction for the cwd while read ACLs are being applied @iceweasel-oai
- #8447 remove minimal client version  @aibrahim-oai
- #8448 chore: add ConfigLayerStack as a field of Config @bolinfest
- #7606 feat: open prompt in configured external editor @sayan-oai
- #8449 fix(tui2): copy transcript selection outside viewport @joshka-oai
- #8418 chore(tui): include tracing targets in file logs @joshka-oai
- #8456 chore: include User layer in ConfigLayerStack even if config.toml is empty @bolinfest
- #8453 feat: load ExecPolicyManager from ConfigLayerStack @bolinfest
- #8462 feat(tui2): add copy selection shortcut + UI affordance @joshka-oai
- #8461 feat: honor /etc/codex/config.toml @bolinfest
- #8463 fix(tui2): fix screen corruption @joshka-oai
- #8458 chore: save more about turn context in rollout log file @apanasenko-oai
- #8466 fix(tui2): start transcript selection on drag @joshka-oai
- #8293 [tui] add optional details to TUI status header @sayan-oai
- #8471 feat(tui2): add multi-click transcript selection @joshka-oai
- #8486 fix(codex-cli): improve ripgrep download diagnostics @joshka-oai
- #8460 fix: limit output size for exec command in unified exec @shijie-oai
- #8493 fix: fix test that was writing temp file to cwd instead of TMPDIR @bolinfest
- #8484 Remove reasoning format @aibrahim-oai
- #8499 perf(tui): cap redraw scheduling to 60fps @joshka-oai
- #8496 feat: introduce codex-utils-cargo-bin as an alternative to assert_cmd::Command @bolinfest
- #8498 fix: declare test path relative to `$CARGO_MANIFEST_DIR` @bolinfest
- #8307 [chore] add additional_details to StreamErrorEvent + wire through @sayan-oai
- #8522 fix: restrict windows-sys to Windows target @RunjiLiu
- #8595 chore(deps): bump toml_edit from 0.23.7 to 0.24.0+spec-1.1.0 in /codex-rs @dependabot
- #8596 chore(deps): bump tracing-subscriber from 0.3.20 to 0.3.22 in /codex-rs @dependabot
- #8597 chore(deps): bump tokio from 1.47.1 to 1.48.0 in /codex-rs @dependabot
- #8598 chore(deps): bump regex-lite from 0.1.7 to 0.1.8 in /codex-rs @dependabot
- #8491 Refresh on models etag mismatch @aibrahim-oai
- #8483 use a SandboxUsers group for ACLs instead of granting to each sandbox user separately @iceweasel-oai
- #8676 Log compaction request bodies @pakrym-oai
- #8488 Remove model family from tui @aibrahim-oai
- #8662 Replaced user documentation with links to developers docs site @etraut-openai
- #8681 perf(tui2): reduce unnecessary redraws @joshka-oai
- #8682 Fixed broken link in README @etraut-openai
- #8677 Account for last token count on resume @aibrahim-oai
- #8687 hard disable remote models refresh when feature is disabled @aibrahim-oai
- #8415 chore(deps): bump tracing-opentelemetry from 0.31.0 to 0.32.0 in /codex-rs @dependabot
- #8688 Attach more tags to feedback submissions @pakrym-oai
- #8701 chore: update outdated docs @tibo-openai
- #8693 perf(tui2): cache transcript view rendering @joshka-oai
- #8697 fix: brighten transcript copy affordance @joshka-oai
- #8629 ci: prevent workflows from running on forks @leezenn
- #8695 fix(tui2): avoid scroll stickiness at cell boundaries @joshka-oai
- #8716 fix(tui2): render copy pill at viewport bottom @joshka-oai
- #8718 tui2: copy selection dismisses highlight @joshka-oai
- #8721 chore(deps): bump clap_complete from 4.5.57 to 4.5.64 in /codex-rs @dependabot
- #8723 chore(deps): bump tokio-stream from 0.1.17 to 0.1.18 in /codex-rs @dependabot
- #8724 chore(deps): bump derive_more from 2.0.1 to 2.1.1 in /codex-rs @dependabot
- #8725 chore(deps): bump insta from 1.44.3 to 1.46.0 in /codex-rs @dependabot
- #8556 fix: chat multiple tool calls @jif-oai
- #8738 fix: /review to respect session cwd @tibo-openai
- #8694 [MCP] Sanitize MCP tool names to ensure they are compatible with the Responses APO @gpeal
- #8728 feat(tui2): transcript scrollbar (auto-hide + drag) @joshka-oai
- #8708 fix(codex-api): handle Chat Completions DONE sentinel @joshka-oai
- #8743 (MacOS) Load config requirements from MDM @gt-oai
- #8377 feat: expose outputSchema to user_turn/turn_start app_server API @apanasenko-oai
- #8747 chore: GH pager @jif-oai
- #8686 better idempotency for creating/updating firewall rules during setup. @iceweasel-oai
- #8683 never let sandbox write to .codex/ or .codex/.sandbox/ @iceweasel-oai
- #8459 chore: improve skills render section @gverma-openai
- #7858 Use issuer URL in device auth prompt link @abrar71
- #8492 best effort to "hide" Sandbox users @iceweasel-oai
- #8751 feat: add justification arg to prefix_rule() in *.rules @bolinfest


## rust-v0.77.0 — 2025-12-21

  ## New Features
  - TUI2: Normalize mouse wheel + trackpad scrolling across terminals; add `tui.scroll_*` config settings (PR #8357)
  - Add `allowed_sandbox_modes` to `requirements.toml` to constrain permitted sandbox modes (PR #8298)
  - MCP: OAuth login for streamable HTTP MCP servers no longer requires the `rmcp_client` feature flag (PR #8087)
  - Improve fuzzy file search display/consistency by centralizing file-name derivation in `codex-file-search` (PR #8334)
  - Update bundled model metadata (`models.json`) (PR #8168)

  ## Bug Fixes
  - Fix `/undo` interacting destructively with git staging / ghost commits (PR #8303)
  - TUI2: Reduce redundant redraws while scrolling transcripts (PR #8295)
  - Docs: Fix link to `contributing.md` in `experimental.md` (PR #8311)

  Full Changelog: https://github.com/openai/codex/compare/rust-v0.76.0...rust-v0.77.0

  Changelog (PRs merged in this tag range)

  - #8374 Remove plan from system skills: https://github.com/openai/codex/pull/8374
  - #8357 TUI2 scroll normalization + config knobs: https://github.com/openai/codex/pull/8357
  - #8353 Thread config loading now receives cwd (internal plumbing): https://github.com/openai/codex/pull/8353
  - #8346 Rename “OpenAI models” to “models manager” (internal refactor): https://github.com/openai/codex/pull/8346
  - #8345 Bump cargo-deny-action version (CI): https://github.com/openai/codex/pull/8345
  - #8334 Move file-name derivation into codex-file-search: https://github.com/openai/codex/pull/8334
  - #8333 Enable resume_warning suite module (test coverage / wiring fix): https://github.com/openai/codex/pull/8333
  - #8330 Make ConstraintError an enum (more structured errors): https://github.com/openai/codex/pull/8330
  - #8303 Fix /undo staging interaction: https://github.com/openai/codex/pull/8303
  - #8298 Add allowed_sandbox_modes in requirements.toml: https://github.com/openai/codex/pull/8298
  - #8295 Coalesce transcript scroll redraws (TUI2 performance): https://github.com/openai/codex/pull/8295
  - #8168 Update models.json: https://github.com/openai/codex/pull/8168
  - #8087 Remove rmcp_client feature flag usage (no longer needed for OAuth login): https://github.com/openai/codex/pull/8087
  - #8311 Fix docs link in experimental.md: https://github.com/openai/codex/pull/8311

## rust-v0.76.0 — 2025-12-19

  ### New Features

  - Add a macOS DMG build target (PR #8207)
  - Improve terminal detection metadata for per-terminal scroll tuning (PR #8252)
  - UI tweaks on the skills popup (PR #8250)
  - TUI search cell rendering improvements (PR #8273)
  - Add /ps command (PR #8279)
  - Add support for /etc/codex/requirements.toml on UNIX (PR #8277)
  - Support shortDescription for skills (PR #8278, PR #8301)
  - Add model list UI (PR #8286)
  - Add app-server v2 deprecation notice event (PR #8285)
  - Introduce ExternalSandbox policy (PR #8290)
  - Skills default on (PR #8297)
  - Support admin-scoped skills (PR #8296)
  - Update bundled system skills (PR #8253, PR #8328)
  - Set exclude default to true in app server (PR #8281)

  ### Bug Fixes

  - Ensure pipes work in restricted sandbox tokens (PR #8280)
  - Grant read ACL to the command-runner directory earlier (PR #8275)
  - Fix duplicate shell_snapshot FeatureSpec regression (PR #8274)
  - Fix sandbox-state update ordering by switching to request (PR #8142)

  ### PRs Merged

  - #8328 Update system skills from OSS repo
  - #8325 Revert "Keep skills feature flag default OFF for windows."
  - #8308 Keep skills feature flag default OFF for windows.
  - #8305 Fix admin skills.
  - #8301 Add short descriptions to system skills
  - #8299 Fix tests
  - #8297 skills feature default on.
  - #8296 Support admin scope skills.
  - #8290 feat: introduce ExternalSandbox policy
  - #8288 chore: upgrade rmcp crate from 0.10.0 to 0.12.0
  - #8286 model list
  - #8285 feat(app-server): add v2 deprecation notice
  - #8282 fix: flaky tests 5
  - #8281 Set exclude to true by default in app server
  - #8280 add a default dacl to restricted token to enable reading of pipes
  - #8279 feat: add /ps
  - #8278 Support skills shortDescription.
  - #8277 feat: add support for /etc/codex/requirements.toml on UNIX
  - #8276 chore: migrate from Config::load_from_base_config_with_overrides to ConfigBuilder
  - #8275 grant read ACL to exe directory first so we can call the command runner
  - #8274 fix: remove duplicate shell_snapshot FeatureSpec
  - #8273 tui: improve rendering of search cell
  - #8271 use mainline version as baseline in ci
  - #8257 feat: collapse "waiting" of unified_exec
  - #8253 Update system skills bundled with codex-rs
  - #8252 Terminal Detection Metadata for Per-Terminal Scroll Scaling
  - #8250 UI tweaks on skills popup.
  - #8207 [release] Add a dmg target for MacOS
  - #8142 fix: change codex/sandbox-state/update from a notification to a request

## rust-v0.75.0 — 2025-12-18

### PRs Merged
#8270 — splash screen
#8251 — migrate to new constraint-based loading strategy
#7460 — cloud: default to current branch in cloud exec

## rust-v0.74.0 — 2025-12-18

### Highlights
- Introducing gpt-5.2-codex our latest frontier model with improvements across knowledge, reasoning and coding. [Learn more](https://openai.com/index/introducing-gpt-5-2-codex)
- Add new slash command `/experimental` for trying out `experimental` features
- Ghost snapshot warning disable toggle (#8178)
- UI polish (background terminals, picker cleanup) (#8255, #8232).

### PRs Merged
- #8266 feat: add name to beta features
- #8265 caribou
- #8264 docs: clarify codex resume --all (CWD column & filtering)
- #8255 nit: ui background terminals
- #8249 chore: prefer AsRef<Path> to &Path
- #8248 chore: simplify loading of Mac-specific logic in config_loader
- #8244 Reintroduce feature flags for skills.
- #8243 Make loading malformed skills fail-open
- #8235 fix: introduce ConfigBuilder
- #8232 chores: clean picker
- #8228 Show migration link
- #8226 chore: cleanup Config instantiation codepaths
- #8221 Change “Team” to “Buisness” and add Education
- #8220 Support SYSTEM skills.
- #8216 speed and reliability improvements for setting reads ACLs
- #8209 feat: model picker
- #8205 fix: PathBuf -> AbsolutePathBuf in ConfigToml struct
- #8203 download new windows binaries when staging npm package
- #8201 chore: add beta features
- #8199 chore: move back stuff out of beta program
- #8198 feat: make list_models non-blocking
- #8196 fix: session downgrade
- #8194 fix: proper skills dir cleanup
- #8186 nit: doc
- #8182 nit: drop dead branch with unified_exec tool
- #8181 nit: prevent race in event rendering
- #8178 feat: add config to disable warnings around ghost snapshot
- #8175 fix: flaky test 6
- #8163 fix the models script
- #8153 Load models from static file
- #8152 [app-server] add new RawResponseItem v2 event
- #8151 chore: update listMcpServerStatus to be non-blocking
- #8149 Add user_agent header
- #8141 chore(apply-patch) unicode scenario
- #8140 include new windows binaries in npm package.
- #8127 Revert “chore: review in read-only (#7593)”
- #8124 fix tui2 compile error
- #8122 docs: refine tui2 viewport roadmap
- #8118 Add a workflow for a hardcoded version of models
- #8117 feat: unified exec footer
- #8114 chore: update listMcpServers to listMcpServerStatus
- #8111 chore(apply-patch) move invocation tests
- #8109 Revert “feat: unified exec footer”
- #8108 feat(sdk): add xhigh reasoning effort support to TypeScript SDK
- #8102 Upgrade GitHub Actions for Node 24 compatibility
- #8098 Add public skills + improve repo skill discovery and error UX
- #8095 feat: change ConfigLayerName into a disjoint union rather than a simple enum
- #8094 bug fixes and perf improvements for elevated sandbox setup
- #8089 refactor(tui2): make transcript line metadata explicit
- #8088 feat: if .codex is a sub-folder of a writable root, then make it read-only to the sandbox
- #8086 chore(app-server): remove stubbed thread/compact API
- #8085 chore: mac codesign refactor
- #8084 chore(ci): drop Homebrew origin/main workaround for macOS runners
- #8079 docs: fix gpt-5.2 typo in config.md
- #8077 better name for windows sandbox features
- #8075 feat: fallback unified_exec to shell_command
- #8071 feat: experimental menu
- #8067 feat: unified exec footer
- #8060 feat: do not compact on last user turn
- #8057 chore: dedup review result duplication
- #8053 nit: trace span for regular task
- #8052 feat: close unified_exec at end of turn
- #8020 Fixes mcp elicitation test that fails for me when run locally
- #8004 Fix: Detect Bun global install via path check
- #8000 Fixed resume matching to respect case insensitivity when using WSL mount points
- #7997 feat: merge remote models instead of destructing
- #7969 Fix: Skip Option<()> schema generation to avoid invalid Windows filenames (#7479)
- #7961 refactor TUI event loop to enable dropping + recreating crossterm event stream
- #7956 fix parallel tool calls
- #7935 exec-server: additional context for errors
- #7931 chore: persist comments in edit
- #7791 chore(shell_command) fix freeform timeout output
- #7778 feat: Constrain values for approval_policy
- #7601 WIP: Rework TUI viewport, history printing, and selection/copy

## rust-v0.73.0 — 2025-12-15

  ## New Features
  - Add ghost snapshot v2 for improved session capture (PR #8055)
  - Support ghost commits in config (PR #7873)
  - Reimplement skills loading via SkillsManager and skills/list for consistent discovery (PR
  #7914)
  - Add OpenTelemetry tracing for Codex (PR #7844)

  ## Bug Fixes
  - Prevent panic when session contains a tool call without an output (PR #8048)
  - Avoid triggering keybindings view on input bursts (PR #7980)
  - Change default wrap algorithm from OptimalFit to FirstFit (PR #7960)
  - Introduce AbsolutePathBuf as part of sandbox config (PR #7856)
  - Include Error in log messages (PR #7955)

  ## PRs Merged
  - #8076 stage new windows sandbox binaries as artifacts
  - #8069 Fixed formatting issue
  - #8066 Update config.md
  - #8055 feat: ghost snapshot v2
  - #7873 feat: config ghost commits
  - #7980 fix: Don't trigger keybindings view on input burst
  - #8045 chore(deps): bump lru from 0.12.5 to 0.16.2 in /codex-rs
  - #8043 chore(deps): bump sentry from 0.34.0 to 0.46.0 in /codex-rs
  - #8039 chore(deps): bump actions/cache from 4 to 5
  - #8037 chore(deps): bump actions/download-artifact from 4 to 7
  - #8048 Do not panic when session contains a tool call without an output
  - #8046 chore(deps): bump socket2 from 0.6.0 to 0.6.1 in /codex-rs
  - #8038 chore(deps): bump actions/upload-artifact from 5 to 6
  - #8047 chore: fix tooltip typos and align tone
  - #8024 docs: document enabling experimental skills
  - #7914 Reimplement skills loading using SkillsManager + skills/list op.
  - #7962 docs: update the docs for @openai/codex-shell-tool-mcp
  - #7960 Changed default wrap algorithm from OptimalFit to FirstFit
  - #7965 Sync tui2 with tui and keep dual-run glue
  - #7844 [codex] add otel tracing
  - #7957 docs: remove blanket ban on unsigned integers
  - #7955 fix: include Error in log message
  - #7954 fix: added test helpers for platform-specific paths
  - #7856 fix: introduce AbsolutePathBuf as part of sandbox config

## rust-v0.72.0 — 2025-12-13

  # Highlights
  - Config API cleanup (#7924): new config API and cleaner config loading flow.
  - Remote compact for API-key users (#7835): enable remote compacting in key-based sessions.
  - MCP and TUI status visibility (#7828, #7907): restore MCP startup progress messages in the TUI and use latest disk values
  for server status.
  - Windows and PowerShell quality-of-life (#7607, #7893, #7942, #7137): locate pwsh/powershell reliably, parse PowerShell with
  PowerShell, sign additional Windows executables, and fix WSL2 toasts.
  - Sandbox and safety updates (#7809, #7889, #7728): Elevated Sandbox 3/4 plus expanded safe command list.
  - Model/prompt UX for gpt-5.2 (#7934, #7910, #7874, #7911): prompt updates and clearer xhigh reasoning warnings/docs.

  # PRs Merged
  - fix cargo build switch #7948 @[iceweasel-oai]
  - fix: restore MCP startup progress messages in TUI (fixes #7827) #7828 @[ivanmurashko]
  - support 1p #7945 @[aibrahim-oai]
  - Sign two additional exes for Windows #7942 @[iceweasel-oai]
  - fix: use PowerShell to parse PowerShell #7607 @[bolinfest]
  - chore(prompt) Update base prompt #7943 @[dylan-hurd-oai]
  - Elevated Sandbox 4 #7889 @[iceweasel-oai]
  - chore(prompt) Remove truncation details #7941 @[dylan-hurd-oai]
  - feat: clean config loading and config api #7924 @[jif-oai]
  - chores: models manager #7937 @[aibrahim-oai]
  - Remote compact for API-key users #7835 @[pakrym-oai]
  - chore(gpt-5.2) prompt update #7934 @[dylan-hurd-oai]
  - fix: race on rx subscription #7921 @[jif-oai]
  - fix: break tui #7876 @[jif-oai]
  - feat: more safe commands #7728 @[jif-oai]
  - fix(tui): show xhigh reasoning warning for gpt-5.2 #7910 @[voctory]
  - Make skill name and description limit based on characters not byte counts #7915 @[etraut-openai]
  - feat: introduce utilities for locating pwsh.exe and powershell.exe #7893 @[bolinfest]
  - docs: clarify xhigh reasoning effort on gpt-5.2 #7911 @[voctory]
  - feat: use latest disk value for mcp servers status #7907 @[shijie-oai]
  - Revert "fix(apply-patch): preserve CRLF line endings on Windows" #7903 @[dylan-hurd-oai]
  - Make migration screen dynamic #7896 @[aibrahim-oai]
  - Fix misleading 'maximize' high effort description on xhigh models #7874 @[voctory]
  - Added deprecation notice for "chat" wire_api #7897 @[etraut-openai]
  - Fix toasts on Windows under WSL 2 #7137 @[dank-openai]
  - fix: policy/*.codexpolicy -> rules/*.rules #7888 @[bolinfest]
  - Update RMCP client config guidance #7895 @[nornagon-openai]
  - Update Model Info #7853 @[aibrahim-oai]
  - Elevated Sandbox 3 #7809 @[iceweasel-oai]
  - remove release script #7885 @[aibrahim-oai]
  - Chore: limit find family visability #7891 @[aibrahim-oai]
  - fix: omit reasoning summary when ReasoningSummary::None #7845 @[apanasenko-oai]
  - fix: drop stale filedescriptor output hash for nix #7865 @[tyleranton]
  - fix: dont quit on 'q' in onboarding ApiKeyEntry state #7869 @[sayan-oai]

## rust-v0.71.0 — 2025-12-11

### Highlights
- Introducing gpt-5.2 our latest frontier model with improvements across knowledge, reasoning and coding. [Learn More](https://openai.com/index/introducing-gpt-5-2/)
### PRs Merged
#7838 Show the default model in model picker @aibrahim-oai
#7833 feat(tui2): copy tui crate and normalize snapshots @joshka-oai
#7509 fix: thread/list returning fewer than the requested amount due to filtering CXA-293 @JaviSoto
#7832 fix: ensure accept_elicitation_for_prompt_rule() test passes locally @bolinfest
#7847 fixing typo in execpolicy docs @zhao-oai
#7831 [app-server] make app server not throw error when login id is not found @celia-oai
#7848 fix: add a hopefully-temporary sleep to reduce test flakiness @bolinfest
#7850 [app-server] Update readme to include mcp endpoints @celia-oai
#7851 fix: remove inaccurate #[allow(dead_code)] marker @bolinfest
#7859 Fixed regression that broke fuzzy matching for slash commands @etraut-openai
#7854 Only show Worked for after the final assistant message @pakrym-oai
#7792 Elevated Sandbox 2 @iceweasel-oai
#7855 fix(stuff) @dylan-hurd-oai
#7870 feat: warning for long snapshots @jif-oai
#7786 feat: add shell snapshot for shell command @jif-oai
#7875 fix: flaky tests 4 @jif-oai
#7882 feat: robin @aibrahim-oai
#7884 Revert “Only show Worked for after the final assistant message” @pakrym-oai

## rust-v0.69.0 — 2025-12-10

  ### Highlights

  - Skills: Explicit skill selections now inject SKILL.md content into the turn; skills load once per session and warn if a file
    can’t be read (#7763).
  - Config API: config/read is fully typed; config writes preserve comments/order; model is optional to match real configs (#7658,
    #7789, #7769).
  - TUI/UX: Log files drop ANSI codes; vim navigation for option selection and transcript pager; transcript continuity fix; slash-
    command popup no longer triggers on invalid input; experimental tui2 frontend behind a flag (#7836, #7784, #7550, #7363,
    #7704, #7793).
  - Exec & sandbox: Shell snapshotting, reworked unified-exec events, elevated sandbox allowances (sendmsg/recvmsg), clearer rate-
    limit warnings, better request-id logging, and safer escalations (#7641, #7775, #7788, #7779, #7795, #7830, #7750).
  - Platform/auth/build: MCP in-session login, remote-branch review support, Windows signing toggles, ConPty vendoring, Nix hash
    fixes, and safer release guardrails (#7751, #7813, #7757/#7804/#7806, #7656, #7762, #7834).
  - Misc fixes: Unsupported images error cleanly, absolute config paths, parallel test stability, duplicated feature spec removal,
    experimental-model prompt/tools, and more (#7478, #7796, #7589, #7818, #7826, #7823, #7765).

  ### PRs Merged

  - #7836 Disable ansi codes in TUI log file
  - #7834 Error when trying to push a release while another release is in progress
  - #7830 Remove conversation_id and bring back request ID logging
  - #7826 fix: flaky tests 3
  - #7823 fix: remove duplicated parallel FeatureSpec
  - #7818 fix: flaky test 2
  - #7817 fix: Upgrade @modelcontextprotocol/sdk to ^1.24.0
  - #7813 feat: use remote branch for review is local trails
  - #7807 chore: disable trusted signing pkg cache hit
  - #7806 Revert "Revert "feat: windows codesign with Azure trusted signing""
  - #7804 Revert "feat: windows codesign with Azure trusted signing"
  - #7799 Removed experimental "command risk assessment" feature
  - #7797 parse rg | head a search
  - #7796 fix: introduce AbsolutePathBuf and resolve relative paths in config.toml
  - #7795 Express rate limit warning as % remaining
  - #7793 feat(tui2): add feature-flagged tui2 frontend
  - #7789 [app-server] Preserve comments & order in config writes
  - #7788 Elevated Sandbox 1
  - #7787 fix more typos in execpolicy.md
  - #7784 Add vim-style navigation for CLI option selection
  - #7779 allow sendmsg/recvmsg syscalls in Linux sandbox
  - #7775 chore: rework unified exec events
  - #7769 make model optional in config
  - #7765 Use codex-max prompt/tools for experimental models
  - #7763 Inject SKILL.md when it’s explicitly mentioned
  - #7762 Fix Nix cargo output hashes for rmcp and filedescriptor
  - #7757 Revert "Revert "feat: windows codesign with Azure trusted signing""
  - #7756 Vendor ConPtySystem
  - #7751 feat: support mcp in-session login
  - #7750 refactor with_escalated_permissions to use SandboxPermissions
  - #7704 fix: Prevent slash command popup from activating on invalid inputs
  - #7658 [app-server-protocol] Add types for config
  - #7641 feat: shell snapshotting
  - #7589 chore: enable parallel tc
  - #7550 Add vim navigation keys to transcript pager
  - #7478 Fix: gracefully error out for unsupported images
  - #7363 Fix transcript pager page continuity
  - #7779 allow sendmsg/recvmsg syscalls in Linux sandbox (already listed; ensure single entry)
  - #7788 Elevated Sandbox 1 (already listed)
  - #7784 Add vim-style navigation for CLI option selection (already listed)
  - #7807/7806/7804 Windows signing toggles (grouped above)

## rust-v0.66.0 — 2025-12-09

### Highlights

 - Execpolicy: TUI can whitelist command prefixes after an approval, sandbox denials propose an amendment you can accept, shell MCP now runs execpolicy so MCP tools follow the same rules, and
    fallback checks inspect each pipeline segment so unsafe tails (e.g., | rm -rf) are still caught (#7033, #7543, #7609, #7653, #7544).
  - Unified exec & shell stability: status line shows clearer progress, Windows unified-exec crash fixed, long commands wrap without breaking layout, and SSE/session cleanup reduces stuck or
    dangling sessions after tool calls (#7563, #7620, #7655, #7594, #7592).
  - TUI updates: cross-platform shortcut handling is consistent (Ctrl+N/P and list selection now work everywhere), so navigation matches between overlays, lists, and text areas (#7583, #7629).
  - Apply-patch: Windows CRLF line endings are preserved, new e2e scenarios cover more patch shapes, and Windows-specific test coverage reduces regressions in patch flows (#7515, #7567, #7554). Thanks to @cnaples79 who contributed the [core part](https://github.com/openai/codex/pull/4017) of this fix!
  - Cloud exec: codex cloud exec accepts --branch for remote runs and now exposes status/diff/apply flows so you can inspect and apply changes from the cloud path (#7602, #7614).
  - Signing: Linux artifacts are signed via sigstore. (#7674).
  - General fixes: parallel tool-call chat now returns correctly, ghost snapshot tokens aren’t billed, missing tool names no longer crash the litellm proxy, and migration prompts use HTTPS links
    (#7634, #7638, #7724, #7705).


### PRs Merged

  - #6793 FIX: WSL Paste image does not work @Waxime64
  - #6846 feat(core) Add login to shell_command tool @dylan-hurd-oai
  - #6918 Add Enterprise plan to ChatGPT login description @ae-openai
  - #7033 whitelist command prefix integration in core and tui @zhao-oai
  - #7310 Inline response recording and remove process_items indirection @aibrahim-oai
  - #7515 fix(apply-patch): preserve CRLF line endings on Windows @dylan-hurd-oai
  - #7543 execpolicy tui flow @zhao-oai
  - #7544 Refactor execpolicy fallback evaluation @zhao-oai
  - #7547 Use shared check sandboxing @pakrym-oai
  - #7554 chore(core): test apply_patch_cli on Windows @dylan-hurd-oai
  - #7561 Do not emit start/end events for write stdin @pakrym-oai
  - #7563 Slightly better status display for unified exec @pakrym-oai
  - #7567 chore(apply-patch) scenarios for e2e testing @dylan-hurd-oai
  - #7571 remove model_family from `config @aibrahim-oai
  - #7580 feat: update sandbox policy to allow TTY @jif-oai
  - #7583 Fix handle_shortcut_overlay_key for cross-platform consistency @448523760
  - #7588 chore: default warning messages to true @jif-oai
  - #7591 chore: tool tip for /prompt @jif-oai
  - #7592 fix: release session ID when not used @jif-oai
  - #7593 chore: review in read-only @jif-oai
  - #7594 fix: sse for chat @jif-oai
  - #7595 Update execpolicy.md @zhao-oai
  - #7602 add --branch to codex cloud exec @nornagon-openai
  - #7603 Add models endpoint @aibrahim-oai
  - #7605 fix(app-server): add duration_ms to McpToolCallItem @owenlin0
  - #7609 feat: exec policy integration in shell mcp @zhao-oai
  - #7610 fix: taking plan type from usage endpoint instead of thru auth token @zhao-oai
  - #7611 fix(app-server): add will_retry to ErrorNotification @owenlin0
  - #7614 cloud: status, diff, apply @nornagon-openai
  - #7615 chore: refactor to move Arc<RwLock> concern outside exec_policy_for @bolinfest
  - #7616 Call models endpoint in models manager @aibrahim-oai
  - #7617 fix: add integration tests for codex-exec-mcp-server with execpolicy @bolinfest
  - #7620 Fix unified_exec on windows @pakrym
  - #7621 Wire with_remote_overrides to construct model families @aibrahim-oai
  - #7626 fix typo @zhao-oai
  - #7629 fix(tui): add missing Ctrl+n/Ctrl+p support to ListSelectionView @pppp606
  - #7634 fix: chat completion with parallel tool call @jif-oai
  - #7638 fix: ignore ghost snapshots in token consumption @jif-oai
  - #7645 Also load skills from repo root. @xl-openai
  - #7648 Add remote models feature flag @aibrahim-oai
  - #7651 fix: OTEL HTTP exporter panic and mTLS support @asm89
  - #7652 Move justfile to repository root @joshka-oai
  - #7653 proposing execpolicy amendment when prompting due to sandbox denial @zhao-oai
  - #7654 fix: exec-server stream was erroring for large requests @bolinfest
  - #7655 fix wrap behavior for long commands @zhao-oai
  - #7660 Restore status header after stream recovery @joshka-oai
  - #7665 docs: fix documentation of rmcp client flag @JaySabva
  - #7669 fix(doc): TOML otel exporter example — multi-line inline table is invalid @448523760
  - #7672 docs: Remove experimental_use_rmcp_client from config @JaySabva
  - #7673 docs: point dev checks to just @voctory
  - #7674 feat: linux codesign with sigstore @shijie-oai
  - #7675 feat: windows codesign with Azure trusted signing @shijie-oai
  - #7678 fix: clear out space on ubuntu runners before running Rust tests @bolinfest
  - #7680 fix: ensure macOS CI runners for Rust tests include recent Homebrew fixes @bolinfest
  - #7685 fix: refine the warning message and docs for deprecated tools config @gameofby
  - #7705 fix: update URLs to use HTTPS in model migration prompts @rakleed
  - #7709 Enhance model picker @aibrahim-oai
  - #7711 Add formatting client version to the x.x.x style. @aibrahim-oai
  - #7713 chore(deps): bump ts-rs from 11.0.1 to 11.1.0 in /codex-rs @dependabot[bot]
  - #7714 chore(deps): bump derive_more from 2.0.1 to 2.1.0 in /codex-rs @dependabot[bot]
  - #7715 chore(deps): bump insta from 1.43.2 to 1.44.3 in /codex-rs @dependabot[bot]
  - #7716 chore(deps): bump wildmatch from 2.5.0 to 2.6.1 in /codex-rs @dependabot[bot]
  - #7722 load models from disk and set a ttl and etag @aibrahim-oai
  - #7724 Fixed regression for chat endpoint; missing tools name caused litellm proxy to crash @etraut-openai
  - #7729 feat: add is-mutating detection for shell command handler @jif-oai
  - #7745 Make the device auth instructions more clear. @mzeng-openai
  - #7747 updating app server types to support execpoilcy amendment @zhao-oai
  - #7748 Remove legacy ModelInfo and merge it with ModelFamily @aibrahim-oai
  - #7749 fix: pre-main hardening logic must tolerate non-UTF-8 env vars @bolinfest
  - #7753 Revert "feat: windows codesign with Azure trusted signing" @shijie-oai
  - #7754 override instructions using ModelInfo @aibrahim-oai
  - #7756 use chatgpt provider for /models @aibrahim-oai

## rust-v0.65.0 — 2025-12-04

### Highlights
- Codex Max as default (#7566): Codex Max is now the default model, and a TUI panic related to async-in-sync code was fixed.
- Better resume UX (#7302, #7303): Added a /resume slash command and improved resume performance so picking work back up is snappier.
- Tooltips & tips UX (#7557, #7440): Tips/tooltips are rendered via markdown with a bold “Tip” label and richer Codex tooltips across the app.
- TUI quality-of-life (#7530, #7448, #7514, #7461): TUI gets Ctrl‑P/N navigation, screen-line-capped shell output, restored Windows clipboard image paste, and a refactor for cleaner layout.
- History and context hygiene (#6242, #7483, #7545, #7431, #7483): history.jsonl is trimmed by history.max_bytes, common junk dirs (incl. __pycache__) are ignored by default, and paste placeholders stay distinct.

# PRs Merged
- use markdown for rendering tips #7557 @[Jeremy Rose]  
- Migrate codex max #7566 @[Ahmed Ibrahim]  
- Remove test from #7481 that doesn't add much value #7558 @[Eric Traut]  
- [app-server] make `file_path` for config optional #7560 @[Celia Chen]  
- Migrate model family to models manager #7565 @[Ahmed Ibrahim]  
- Migrate `tui` to use models manager #7555 @[Ahmed Ibrahim]  
- Introduce `ModelsManager` and migrate `app-server` to use it. #7552 @[Ahmed Ibrahim]  
- fix: wrap long exec lines in transcript overlay #7481 @[muyuanjin]  
- fix: Features should be immutable over the lifetime of a session/thread #7540 @[Michael Bolin]  
- feat: Support listing and selecting skills via $ or /skills #7506 @[xl-openai]  
- [app-server] fix: add thread_id to turn/plan/updated #7553 @[Owen Lin]  
- feat(tui): map Ctrl-P/N to arrow navigation in textarea #7530 @[Aofei Sheng]  
- fix(tui): limit user shell output by screen lines #7448 @[muyuanjin]  
- Migrate model preset #7542 @[Ahmed Ibrahim]  
- fix: main #7546 @[jif-oai]  
- feat: add pycache to excluded directories #7545 @[jif-oai]  
- chore: update unified exec sandboxing detection #7541 @[jif-oai]  
- add slash resume #7302 @[Ahmed Ibrahim]  
- chore: conversation_id -> thread_id in app-server feedback/upload #7538 @[Owen Lin]  
- chore: delete unused TodoList item from app-server #7537 @[Owen Lin]  
- chore: update app-server README #7510 @[Owen Lin]  
- chore: remove bun env var detect #7534 @[Shijie Rao]  
- feat: support list mcp servers in app server #7505 @[Shijie Rao]  
- seatbelt: allow openpty() #7507 @[Jeremy Rose]  
- feat: codex tool tips #7440 @[jif-oai]  
- feat: retroactive image placeholder to prevent poisoning #6774 @[jif-oai]  
- feat: model warning in case of apply patch #7494 @[jif-oai]  
- fix(tui) Support image paste from clipboard on native Windows #7514 @[Dylan Hurd]  
- fix(unified_exec): use platform default shell when unified_exec shell… #7486 @[Robby He]  
- Update device code auth strings. #7498 @[Matthew Zeng]  
- fix: inline function marked as dead code #7508 @[Michael Bolin]  
- improve resume performance #7303 @[Ahmed Ibrahim]  
- fix: path resolution bug in npx #7134 @[Michael Bolin]  
- Ensure duplicate-length paste placeholders stay distinct #7431 @[Joshua Sutton]  
- feat: support --version flag for @openai/codex-shell-tool-mcp #7504 @[Michael Bolin]  
- refactor: tui.rs extract several pieces #7461 @[Josh McKinney]  
- chore: make create_approval_requirement_for_command an async fn #7501 @[Michael Bolin]  
- Trim `history.jsonl` when `history.max_bytes` is set #6242 @[liam]  
- fix: remove serde(flatten) annotation for TurnError #7499 @[Owen Lin]  
- persisting credits if new snapshot does not contain credit info #7490 @[zhao-oai]  
- fix: drop lock once it is no longer needed #7500 @[Michael Bolin]  
- execpolicy helpers #7032 @[zhao-oai]  
- Show token used when context window is unknown #7497 @[Ahmed Ibrahim]  
- Use non-blocking mutex #7467 @[Ahmed Ibrahim]  
- Fix: track only untracked paths in ghost snapshots #7470 @[lionel-oai]  
- feat: ignore standard directories #7483 @[jif-oai]  
- fix: add ts number annotations for app-server v2 types #7492 @[Owen Lin]  
- feat: intercept apply_patch for unified_exec #7446 @[jif-oai]  
- chore: remove mention of experimental/unstable from app-server README #7474 @[Owen Lin]  
- Add request logging back #7471 @[pakrym-oai]  
- feat: add one off commands to app-server v2 #7452 @[jif-oai]  
- feat: add warning message for the model #7445 @[jif-oai]  
- chore: review everywhere #7444 @[jif-oai]  
- feat: alias compaction #7442 @[jif-oai]  
- feat: experimental support for skills.md #7412 @[Thibault Sottiaux]

## rust-v0.64.0 — 2025-12-02

## Features

  - Threads and turns now include git info, current working directory, CLI version, source metadata, and propagate thread and turn IDs on every item and error. They emit new notifications for diffs, plan updates, token-usage changes, and compaction events. File-change items provide output deltas, and ImageView items render images inline.
  - Review flow is enhanced with a detached review mode, explicit enter and exit events, review thread IDs, and review history remains visible after rollout filtering changes.
  - Execution gains an experimental “exp” model, unified exec pruning to limit session bloat, per-run custom environment injection, policy-approved command bypass, and Windows protections that flag risky browser or URL launches. History lookup now works on Windows and WSL, and model selection honors use_model.
  - Safety defaults improve via consolidated world-writable scanning and workspace-write enforcement of read-only .git directories. Sandbox assessment and approval flows align with trust policies.
  - MCP and shell tooling add shell-tool MCP login support, explicit capability declaration, sandbox awareness, publication to npm, and MCP elicitations. The rmcp client is upgraded to 0.10.0 for modern notifications.
  - Observability increases as command items expose process IDs and threads and turns emit token-usage and compaction events. Feedback metadata captures source information.
  - Tooling and ops gain follow-up v2 in the app-server test client, new config management utilities, and refreshed approvals documentation and quickstart placement.

 ## Bug fixes

  - PowerShell apply_patch parsing is corrected, and apply_patch tests now cover shell_command behavior.
  - Sandbox assessment regression is fixed, policy-approved commands are honored, dangerous-command checks are tightened on Windows, and workspace-write enforces .git read-only.
  - MCP startup tolerates missing type fields, stream error messages are clarified, and rmcp nix output hash issues are resolved.
  - Delegate cancellation no longer hangs unified exec, early-exit sessions are cleaned up, and duplicate “waited” renderings are suppressed.
  - recent_commits with limit zero now returns zero, and the NetBSD process-hardening build is unblocked.
  - Review rollout filtering is disabled so history shows, approval presets respect workspace-write, /approvals trust detection is corrected, and sandbox command assessment edge cases are fixed.
  - Compaction accounts for encrypted reasoning, handles token budgets accurately, and emits reliable token-usage and compaction events.
  - TTY stdin is required, WSL clipboard paths are normalized, and stale conversations are dropped on /new to avoid conflicts.
  - Custom prompt expansion with large pastes is fixed, example-config mistakes are corrected, and relative links and streamable_shell references are cleaned up. Upgrade messaging is corrected.
  - Windows sandbox treats <workspace_root>/.git as read-only, and risky browser launches are flagged before execution.
  - CLA allowlist now includes dependabot variants, and enterprises can skip upgrade checks and messages.
  - Flaky tests are stabilized, session recycling is improved, and rollout session initialization surfaces errors for diagnosis.

 ## Maintenance

  - Security and CI add cargo-audit and cargo-deny. GitHub Actions are updated to checkout v6 and upload-artifact v5. macOS 13 builds are dropped. A flaky Ubuntu variant is skipped. The next_minor_version script now resets the patch number correctly.
  - Dependencies are updated: libc 0.2.177, webbrowser 1.0.6, regex 1.12.2, toml_edit 0.23.5, arboard 3.6.1, serde_with 3.16.1, image 0.25.9, reqwest 0.12.24, tracing 0.1.43, and rmcp 0.10.0.
  - Documentation is refreshed: approvals and config guidance, codex max and xhigh defaults, example-config fixes, CLA guidance, and removal of streamable_shell references.

## PRs Merged

  - fix(scripts) next_minor_version should reset patch number by @dylan-hurd-oai in #7050
  - [app-server] feat: expose gitInfo/cwd/etc. on Thread by @owenlin0 in #7060
  - feat: Add exp model to experiment with the tools by @aibrahim-oai in #7115
  - enable unified exec for experiments by @aibrahim-oai in #7118
  - [app-server] doc: approvals by @owenlin0 in #7105
  - Windows: flag some invocations that launch browsers/URLs as dangerous by @iceweasel-oai in #7111
  - Use use_model by @pakrym-oai in #7121
  - feat: support login as an option on shell-tool-mcp by @bolinfest in #7120
  - fix(tui): Fail when stdin is not a terminal by @joshka-oai in #6382
  - support MCP elicitations by @nornagon-openai in #6947
  - refactor: inline sandbox type lookup in process_exec_tool_call by @bolinfest in #7122
  - bypass sandbox for policy approved commands by @zhao-oai in #7110
  - fix: start publishing @openai/codex-shell-tool-mcp to npm by @bolinfest in #7123
  - feat: declare server capability in shell-tool-mcp by @bolinfest in #7112
  - move execpolicy quickstart by @zhao-oai in #7127
  - Account for encrypted reasoning for auto compaction by @aibrahim-oai in #7113
  - chore: use proxy for encrypted summary by @jif-oai in #7252
  - fix: codex delegate cancellation by @jif-oai in #7092
  - feat: unified exec basic pruning strategy by @jif-oai in #7239
  - consolidate world-writable-directories scanning. by @iceweasel-oai in #7234
  - fix: flaky test by @jif-oai in #7257
  - [feedback] Add source info into feedback metadata. by @mzeng-openai in #7140
  - fix(windows) support apply_patch parsing in powershell by @dylan-hurd-oai in #7221
  - chore(deps): bump regex from 1.11.1 to 1.12.2 in /codex-rs by @dependabot[bot] in #7222
  - chore(deps): bump toml_edit from 0.23.4 to 0.23.5 in /codex-rs by @dependabot[bot] in #7223
  - chore(deps): bump actions/upload-artifact from 4 to 5 by @dependabot[bot] in #7229
  - chore(deps): bump actions/checkout from 5 to 6 by @dependabot[bot] in #7230
  - fix: Fix build process-hardening build on NetBSD by @0-wiz-0 in #7238
  - Removed streamable_shell from docs by @etraut-openai in #7235
  - chore(deps): bump libc from 0.2.175 to 0.2.177 in /codex-rs by @dependabot[bot] in #7224
  - chore(deps): bump webbrowser from 1.0.5 to 1.0.6 in /codex-rs by @dependabot[bot] in #7225
  - Added alternate form of dependabot to CLA allow list by @etraut-openai in #7260
  - Allow enterprises to skip upgrade checks and messages by @gpeal in #7213
  - fix: custom prompt expansion with large pastes by @Priya-753 in #7154
  - chore(ci): add cargo audit workflow and policy by @joshka-oai in #7108
  - chore: add cargo-deny configuration by @joshka-oai in #7119
  - Windows Sandbox: treat <workspace_root>/.git as read-only in workspace-write mode by @iceweasel-oai in #7142
  - chore: dedup unified exec "waited" rendering by @jif-oai in #7256
  - fix: don't store early exit sessions by @jif-oai in #7263
  - fix: Correct the stream error message by @CSRessel in #7266
  - [app-server-test-client] add send-followup-v2 by @celia-oai in #7271
  - feat[app-serve]: config management by @jif-oai in #7241
  - feat: add custom env for unified exec process by @jif-oai in #7286
  - [app-server] feat: add thread_id and turn_id to item and error notifications by @owenlin0 in #7124
  - feat: add compaction event by @jif-oai in #7289
  - [app-server] feat: add turn/diff/updated event by @owenlin0 in #7279
  - fix: Drop MacOS 13 by @jif-oai in #7295
  - fix: drop conversation when /new by @jif-oai in #7297
  - chore: proper client extraction by @jif-oai in #6996
  - tmp: drop flaky ubuntu by @jif-oai in #7300
  - [app-server] add thread/tokenUsage/updated v2 event by @celia-oai in #7268
  - correctly recognize WorkspaceWrite policy on /approvals by @iceweasel-oai in #7301
  - feat: update process ID for event handling by @jif-oai in #7261
  - Fixed regression in experimental "sandbox command assessment" feature by @etraut-openai in #7308
  - nit: drop file by @jif-oai in #7314
  - doc: fix relative links and add tips by @lionel-oai in #7319
  - Fixes two bugs in example-config.md documentation by @etraut-openai in #7324
  - chore: improve rollout session init errors by @jobchong in #7336
  - feat: detached review by @jif-oai in #7292
  - fix: other flaky tests by @jif-oai in #7372
  - chore: better session recycling by @jif-oai in #7368
  - chore(deps): bump arboard from 3.6.0 to 3.6.1 in /codex-rs by @dependabot[bot] in #7426
  - chore(deps): bump serde_with from 3.14.0 to 3.16.1 in /codex-rs by @dependabot[bot] in #7422
  - chore(deps): bump reqwest from 0.12.23 to 0.12.24 in /codex-rs by @dependabot[bot] in #7424
  - chore(deps): bump tracing from 0.1.41 to 0.1.43 in /codex-rs by @dependabot[bot] in #7428
  - Fixed CLA action to properly exempt dependabot by @etraut-openai in #7429
  - chore(deps): bump image from 0.25.8 to 0.25.9 in /codex-rs by @dependabot[bot] in #7421
  - [app-server] add turn/plan/updated event by @celia-oai in #7329
  - fix: disable review rollout filtering by @jif-oai in #7371
  - [app-server] fix: ensure thread_id and turn_id are on all events by @owenlin0 in #7408
  - [app-server] fix: emit item/fileChange/outputDelta for file change items by @owenlin0 in #7399
  - Fix recent_commits(limit=0) returning 1 commit instead of 0 by @Towaiji in #7334
  - fix: nix build missing rmcp output hash by @Alb-O in #7436
  - docs: clarify codex max defaults and xhigh availability by @kgruiz in #7449
  - fix: prevent MCP startup failure on missing 'type' field by @linuxmetel in #7417
  - chore: update to rmcp@0.10.0 to pick up support for custom client notifications by @bolinfest in #7462
  - fix(apply_patch) tests for shell_command by @dylan-hurd-oai in #7307
  - [app-server] Add ImageView item by @celia-oai in #7468
  - fix(core): enable history lookup on windows by @stevemostovoy-openai in #7457
  - fix(tui): handle WSL clipboard image paths by @manoelcalixto in #3990

**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.63.0...rust-v0.64.0

## rust-v0.63.0 — 2025-11-21

## Bug fixes
- Fixes the bug where enabling web search can lead to `Invalid value: 'other'.` errors. 

## PRs Merged 
* [app-server] feat: add Declined status for command exec by @owenlin0 in https://github.com/openai/codex/pull/7101
* chore: drop model_max_output_tokens by @jif-oai in https://github.com/openai/codex/pull/7100
* fix: clear out duplicate entries for `bash` in the GitHub release by @bolinfest in https://github.com/openai/codex/pull/7103


**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.62.0...rust-v0.63.0

## rust-v0.61.0 — 2025-11-20

### Highlights

- ExecPolicy2 integration and exec-server prep: core now integrates ExecPolicy2 with exec-server refactors and cutover groundwork, plus quickstart docs to help teams adopt the new policy engine.
- Improved truncation and error reporting: single-pass truncation reduces duplicate work, and error events can now carry optional status codes for clearer observability.
- Shell reliability and sandbox warnings: fallback shell selection is hardened and world-writable directory warnings are less noisy, including improved messaging on Windows.
- UX fixes: corrected reasoning display, preserved review footer context after `/review`, and the model migration screen now shows only once.

### PRs Merged

- fix(app-server) move windows world writable warning (#6916) — @dylan-hurd-oai
- [core] add optional status_code to error events (#6865) — @celia-oai
- fix: prepare ExecPolicy in exec-server for execpolicy2 cutover (#6888) — @bolinfest
- stop over-reporting world-writable directories (#6936) — @iceweasel-oai
- fix(context left after review): review footer context after `/review` (#5610) — @guidedways
- Fix/correct reasoning display (#6749) — @lionelchg
- chore: refactor exec-server to prepare it for standalone MCP use (#6944) — @bolinfest
- fix(shell) fallback shells (#6948) — @dylan-hurd-oai
- execpolicy2 core integration (#6641) — @zhao-oai
- Single pass truncation (#6914) — @pakrym-oai
- update execpolicy quickstart readme (#6952) — @zhao-oai
- stop model migration screen after first time. (#6954) — @aibrahim-oai


## rust-v0.60.1 — 2025-11-19

Bug fix release, most of the new important changes are in https://github.com/openai/codex/releases/tag/rust-v0.59.0

## Bug fix:
- Default model for API users is now `gpt-5.1-codex`

## rust-v0.59.0 — 2025-11-19

### Highlights

- GPT-5.1-Codex-Max: introducing our newest frontier agentic coding model. GPT-5.1-Codex-Max delivers higher reliability, faster iteration, and support for long-running, project-scale workflows. Learn more at https://www.openai.com/index/gpt-5-1-codex-max
- Native Compaction Support: added first-class support for Compaction, improving performance across extended coding sessions.
- Expanded Tool Token Limits: codex models now support up to 10,000 tool output tokens. Configure this via `tool_output_token_limit` in `config.toml`.
- Windows Agent mode: Introduced Agent mode for native Windows. Codex can read files, write files, and run commands in your working folder with fewer approvals. Agent mode uses a new experimental Windows sandbox to limit filesystem and network access. Learn more at https://developers.openai.com/codex/windows
- TUI and UX Improvements
  * Eliminated ghost snapshot notifications when no `git` repository is present.
  * Codex Resume now displays branches and respects the current working directory for filtering.
  * Added placeholder icons for images.
  * Credits are now visible in `/status`.

### PRs Merged

- fix: don't truncate at new lines (#6907) — @aibrahim
- feat: arcticfox in the wild (#6906) — @aibrahim
- [app-server] populate thread>turns>items on thread/resume (#6848) — @owenlin0
- nit: useless log to debug (#6898) — @jif
- fix(core) Support changing /approvals before conversation (#6836) — @dylan.hurd
- chore: consolidate compaction token usage (#6894) — @jif
- chore(app-server) world-writable windows notification (#6880) — @dylan.hurd
- fix: parallel tool call instruction injection (#6893) — @jif
- nit: stable (#6895) — @jif
- feat: warning large commits (#6838) — @jif
- fix label (#6892) — @tibo
- Move shell to use `truncate_text` (#6842) — @aibrahim
- Run remote auto compaction (#6879) — @pakrym
- flaky-unified_exec_formats_large_output_summary (#6884) — @aibrahim
- shell_command returns freeform output (#6860) — @pakrym
- chore(core) arcticfox (#6876) — @dylan.hurd
- fix(tui) ghost snapshot notifications (#6881) — @dylan.hurd
- fix: typos in model picker (#6859) — @aibrahim
- chore: update windows docs url (#6877) — @ae
- feat: tweak windows sandbox strings (#6875) — @ae
- fix: add more fields to ThreadStartResponse and ThreadResumeResponse (#6847) — @mbolin
- chore: update windows sandbox docs (#6872) — @ae
- Remote compaction on by-default (#6866) — @pakrym
- [app-server] introduce `turn/completed` v2 event (#6800) — @celia
- update credit status details (#6862) — @zhao
- tui: add branch to 'codex resume', filter by cwd (#6232) — @172423086+nornagon-openai
- smoketest for browser vuln, rough draft of Windows security doc (#6822) — @iceweasel
- windows sandbox: support multiple workspace roots (#6854) — @iceweasel
- updating codex backend models (#6855) — @zhao
- exec-server (#6630) — @172423086+nornagon-openai
- Fix tests so they don't emit an extraneous `config.toml` in the source tree (#6853) — @etraut
- [app-server-test-client] feat: auto approve command (#6852) — @owenlin0
- Improved runtime of `generated_ts_has_no_optional_nullable_fields` test (#6851) — @etraut
- fix: local compaction (#6844) — @jif
- Fix typo in config.md for MCP server (#6845) — @simcoea
- [codex][otel] support mtls configuration (#6228) — @apanasenko
- feat: review in app server (#6613) — @jif
- chore(config) enable shell_command (#6843) — @dylan.hurd
- Prompt to turn on windows sandbox when auto mode selected. (#6618) — @iceweasel
- Add the utility to truncate by tokens (#6746) — @aibrahim
- Update faq.md section on supported models (#6832) — @adpena
- fixing localshell tool calls (#6823) — @zhao
- feat: enable parallel tool calls (#6796) — @jif
- feat: remote compaction (#6795) — @jif
- nit: app server (#6830) — @jif
- nit: mark ghost commit as stable (#6833) — @jif
- feat: git branch tooling (#6831) — @jif
- :bug: fix(rmcp-client): refresh OAuth tokens using expires_at (#6574) — @LaelLuo
- fix(windows) shell_command on windows, minor parsing (#6811) — @dylan.hurd
- chore(core) Add shell_serialization coverage (#6810) — @dylan.hurd
- Update defaults to gpt-5.1 (#6652) — @aibrahim
- Demote function call payload log to debug to avoid noisy error-level stderr (#6808) — @cassirer
- execpolicy2 extension (#6627) — @zhao
- [app-server] feat: add v2 command execution approval flow (#6758) — @owenlin0
- background rate limits fetch (#6789) — @zhao
- move cap_sid file into ~/.codex so the sandbox cannot overwrite it (#6798) — @iceweasel
- Fix TUI issues with Alt-Gr on Windows (#6799) — @etraut
- core: add a feature to disable the shell tool (#6481) — @172423086+nornagon-openai
- chore(core) Update shell instructions (#6679) — @dylan.hurd
- fix: annotate all app server v2 types with camelCase (#6791) — @owenlin0
- LM Studio OSS Support (#2312) — @rugved
- [app-server] add events to readme (#6690) — @celia
- core/tui: non-blocking MCP startup (#6334) — @172423086+nornagon-openai
- chore: delete chatwidget::tests::binary_size_transcript_snapshot tui test (#6759) — @owenlin0
- feat: execpolicy v2 (#6467) — @zhao
- nit: personal git ignore (#6787) — @jif
- tmp: drop sccache for windows 2 (#6775) — @jif
- feat: placeholder for image that can't be decoded to prevent 400 (#6773) — @jif
- fix(core) serialize shell_command (#6744) — @dylan.hurd
- Fix FreeBSD/OpenBSD builds: target-specific keyring features and BSD hardening (#6680) — @jinxiaoyong
- Exempt the "codex" github user from signing the CLA (#6724) — @etraut
- chore(deps): bump actions/github-script from 7 to 8 (#6755) — @49699333+dependabot[bot]
- Fix: Claude models return incomplete responses due to empty finish_reason handling (#6728) — @dulikaifazr
- Fix AltGr/backslash input on Windows Codex terminal (#6720) — @pornotato
- Revert "tmp: drop sccache for windows (#6673)" (#6751) — @etraut
- fix: resolve Windows MCP server execution for script-based tools (#3828) — @jlee14281
- Fix documentation errors for Custom Prompts named arguments and add canonical examples (#5910) — @169171880+Sayeem3051
- Tighten panic on double truncation (#6701) — @aibrahim
- Improve compact (#6692) — @aibrahim
- Refactor truncation helpers into its own file (#6683) — @aibrahim
- Revert "templates and build step for validating/submitting winget package" (#6696) — @aibrahim
- ci: only run CLA assistant for openai org repos (#6687) — @joshka
- Handle "Don't Trust" directory selection in onboarding (#4941) — @viniciusmotta8
- Ignore unified_exec_respects_workdir_override (#6693) — @pakrym
- Order outputs before inputs (#6691) — @pakrym
- feat: add app-server-test-client crate for internal use (#5391) — @owenlin0
- fix codex detection, add new security-focused smoketests. (#6682) — @iceweasel
- feat(ts-sdk): allow overriding CLI environment (#6648) — @lopopolo
- templates and build step for validating/submitting winget package (#6485) — @iceweasel
- Add test timeout (#6612) — @pakrym
- Enable TUI notifications by default (#6633) — @172423086+nornagon-openai
- tmp: drop sccache for windows (#6673) — @jif
- [App server] add mcp tool call item started/completed events (#6642) — @celia
- feat: cache tokenizer (#6609) — @jif
- feat: better UI for unified_exec (#6515) — @jif
- feat: add resume logs when doing /new (#6660) — @jif
- tests: replace mount_sse_once_match with mount_sse_once for SSE mocking (#6640) — @pakrym
- Promote shared helpers for suite tests (#6460) — @aibrahim
- Use shared network gating helper in chat completion tests (#6461) — @aibrahim
- Avoid double truncation (#6631) — @aibrahim
- Revert "Revert \"Overhaul shell detection and centralize command generation for unified exec\"" (#6607) — @pakrym
- [app-server] small fixes for JSON schema export and one-of types (#6614) — @owenlin0
- [App-server] add new v2 events:`item/reasoning/delta`, `item/agentMessage/delta` & `item/reasoning/summaryPartAdded` (#6559) — @celia
- chore(core) Consolidate apply_patch tests (#6545) — @dylan.hurd
- Only list failed tests (#6619) — @pakrym
- feat: Add support for --add-dir to exec and TypeScript SDK (#6565) — @33551757+danfhernandez
- Add AbortSignal support to TypeScript SDK (#6378) — @33551757+danfhernandez
- Enable close-stale-contributor-prs.yml workflow (#6615) — @pakrym
- Update default yield time (#6610) — @pakrym
- Close stale PRs workflow (#6594) — @pakrym
- Migrate prompt caching tests to test_codex (#6605) — @pakrym
- Revert "Overhaul shell detection and centralize command generation for unified exec" (#6606) — @pakrym
- Overhaul shell detection and centralize command generation for unified exec (#6577) — @pakrym

## rust-v0.58.0 — 2025-11-13

### Highlights
- Support for gpt5.1 models family. [Read more](www.openai.com/index/gpt-5-1)
- App server enhancements: new JSON schema generator command, item started/completed events, macro cleanup, reduced boilerplate, and tightened duplicate-code hygiene (#6406 #6517 #6470 #6488).
- Quality of life fixes: doc updates (web_search, SDK, config), TUI shortcuts inline, seatbelt/Wayland/brew/compaction/cloud-tasks bugfixes, clearer warnings, auth-aware status output, and OTEL test stabilization (#5889 #6424 #6425 #6376 #6421 #4824 #6238 #5856 #6446 #6529 #6541).

### PRs Merged
- #6381 — Improve world-writable scan (`917f39ec1`)
- #5889 — feat(tui): Display keyboard shortcuts inline for approval options (`5beb6167c`)
- #6389 — more world-writable warning improvements (`a47181e47`)
- #6425 — Fix SDK documentation: replace “file diffs” with “file change notifications” (`8b80a0a26`)
- #6421 — fix(seatbelt): Allow reading hw.physicalcpu (`c07461e6f`)
- #5856 — fix(cloud-tasks): respect `cli_auth_credentials_store` config (`5f1fab0e7`)
- #6387 — For npm upgrade on Windows, go through cmd.exe to get path traversal working (`625f2208c`)
- #6437 — chore(deps): bump codespell-project/actions-codespell from 2.1 to 2.2 (`7c7c7567d`)
- #6438 — chore(deps): bump taiki-e/install-action from 2.60.0 to 2.62.49 (`082d2fa19`)
- #6443 — chore(deps): bump askama from 0.12.1 to 0.14.0 in /codex-rs (`78b2aeea5`)
- #6444 — chore(deps): bump zeroize from 1.8.1 to 1.8.2 in /codex-rs (`e2598f509`)
- #6446 — Fix warning message phrasing (`131c38436`)
- #6424 — Fix config documentation: correct TOML parsing description (`557ac6309`)
- #6454 — Move compact (`50a77dc13`)
- #6376 — Updated docs to reflect recent changes in `web_search` configuration (`65cb1a1b7`)
- #6407 — fix: use generate_ts from app_server_protocol (`42683dadf`)
- #6419 — Support exiting from the login menu (`b46012e48`)
- #6422 — Don’t lock PRs that have been closed without merging (`591615315`)
- #6406 — [app-server] feat: add command to generate json schema (`fbdedd9a0`)
- #6238 — fix: update brew auto update version check (`788badd22`)
- #6433 — Add opt-out for rate limit model nudge (`e743d251a`)
- #6246 — Add user command event types (`980886498`)
- #6466 — feat: add workdir to unified_exec (`f01f2ec9e`)
- #6468 — [app-server] chore: move initialize out of deprecated API section (`2ac49fea5`)
- #4824 — Fix wayland image paste error (`52e97b9b6`)
- #4098 — add codex debug seatbelt --log-denials (`0271c20d8`)
- #6477 — refactor(tui): job-control for Ctrl-Z handling (`60deb6773`)
- #6470 — [app-server] update macro to make renaming methods less boilerplate-y (`3838d6739`)
- #6478 — upload Windows .exe file artifacts for CLI releases (`9aff64e01`)
- #6482 — flip rate limit status bar (`930f81a17`)
- #6480 — Use codex-linux-sandbox in unified exec (`6c36318bd`)
- #6489 — Colocate more of bash parsing (`bb7b0213a`)
- #6488 — [hygiene][app-server] have a helper function for duplicate code in turn APIs (`695187277`)
- #6041 — Enable ghost_commit feature by default (`052b05283`)
- #6503 — nit: logs to trace (`ad279eacd`)
- #6492 — Add unified exec escalation handling and tests (`807e2c27f`)
- #6517 — [app-server] add item started/completed events for turn items (`e357fc723`)
- #6523 — Update full-auto description with on-request (`eb1c651c0`)
- #6528 — Re-add prettier log-level=warn to generate-ts (`424bfecd0`)
- #6507 — feat: warning switch model on resume (`530db0ad7`)
- #6510 — feat: shell_command tool (`29364f3a9`)
- #6516 — chore: verify boolean values can be parsed as config overrides (`c3a710ee1`)
- #6541 — Fix otel tests (`7d9ad3eff`)
- #6534 — feat: only wait for mutating tools for ghost commit (`e00eb50db`)
- #6529 — Fixed status output to use auth information from AuthManager (`ad09c138b`)
- #6551 — Add gpt-5.1 model definitions (`ec69a4a81`)
- #6558 — Do not double encode request bodies in logging (`2f58e6999`)
- #6483 — [app-server] feat: thread/resume supports history, path, and overrides (`964220ac9`)
- #6561 — NUX for gpt5.1 (`e63ab0dd6`)
- #6568 — Set verbosity to low for 5.1 (`f97874093`)
- #6567 — Update subtitle of model picker as part of the nux (`966d71c02`)
- #6569 — Change model picker to include gpt5.1 (`ad7eaa80f`)
- #6575 — Avoid hang when tool’s process spawns grandchild that shares stderr/stdout (`73ed30d7e`)
- #6580 — remove porcupine model slug (`b1979b70a`)
- #6583 — feat: show gpt mini (`e3aaee00c`)
- #6585 — copy for model migration nudge (`305fe73d8`)
- #6586 — Reasoning level update (`e3dd362c9`)
- #6593 — Default to explicit medium reasoning for 5.1 (`34621166d`)
- #6588 — chore(core) Update prompt for gpt-5.1 (`8dcbd29ed`)
- #6597 — feat: proxy context left after compaction (`2a417c47a`)
- #6589 — fix model picker wrapping (`ba74cee6f`)

## rust-v0.57.0 — 2025-11-09

### Highlights
- TUI quality-of-life: ctrl-n/p navigation for slash command lists and backtracking skips the /status noise.
- Improve timeout on long running commasnds

### PRs Merged
- #6233 – Freeform unified exec output formatting  
- #6342 – Make `generate_ts` prettier output warn-only  
- #6335 – TUI: fix backtracking past `/status`  
- #1994 – Enable CTRL-n/CTRL-p for navigating slash commands, files, history  
- #6340 – Skip retries on `insufficient_quota` errors  
- #6345 – Remove shell tool when unified exec is enabled  
- #6347 – Refresh AI labeler rules to match issue tracker labels  
- #6346 – Prefer `wait_for_event` over `wait_for_event_with_timeout` (initial update)  
- #5486 – Fix `apply_patch` rename/move path resolution  
- #6349 – Prefer `wait_for_event` over `wait_for_event_with_timeout` (follow-up)  
- #6336 – App-server: implement `account/read` endpoint  
- #6338 – App-server: expose additional fields on `Thread`  
- #6353 – App-server: add auth v2 doc & update Codex MCP interface section  
- #6368 – App-server: README updates for threads and turns  
- #6351 – Promote shell config tool to model family config  
- #6369 – TUI: add inline comments to `tui.rs`  
- #6370 – Add `--promote-alpha` option to `create_github_release` script  
- #6367 – SDK: add `network_access` and `web_search` options to TypeScript SDK  
- #6097 (includes work from #6086) – WSL: normalize Windows paths during update  
- #6377 – App-server docs: add initialization section  
- #6373 – Terminal refactor: remove deprecated flush logic  
- #6252 – Core: replace Cloudflare 403 HTML with friendly message  
- #6380 – Unified exec: allow safe commands without approval  
- #5258 – Kill shell tool process groups on timeout  

## rust-v0.56.0 — 2025-11-07

### Highlights
  - Introducing our new model GPT-5-Codex-Mini — a more compact and cost-efficient version of GPT-5-Codex
### PRs merged
  - #6211 fix: Update the deprecation message to link to the docs
  - #6212 [app-server] feat: export.rs supports a v2 namespace, initial v2
    notifications
  - #6230 Fix nix build
  - #3643 fix(core): load custom prompts from symlinked Markdown files
  - #4200 allow codex to be run from pid 1
  - #6234 Upgrade rmcp to 0.8.4
  - #6237 Add modelReasoningEffort option to TypeScript SDK
  - #5565 tui: refactor ChatWidget and BottomPane to use Renderables
  - #6229 refactor Conversation history file into its own directory
  - #6231 Improved token refresh handling to address “Re-connecting” behavior
  - #6261 Update rmcp to 0.8.5
  - #6214 [app-server] feat: v2 Thread APIs
  - #6282 Fixes intermittent test failures in CI
  - #6249 stop capturing r when environment selection modal is open
  - #6183 [App-server] Implement v2 for account/login/start and account/login/completed
  - #6285 Prevent dismissal of login menu in TUI
  - #4388 fix: ToC so it doesn’t include itself or duplicate the end marker
  - #6288 [App-server] Add account/login/cancel v2 endpoint
  - #6286 feat: add model nudge for queries
  - #6300 feat: support models with single reasoning effort
  - #6319 chore: rename for clarity
  - #6216 [app-server] feat: v2 Turn APIs
  - #6295 docs: Fix code fence and typo in advanced guide
  - #6326 chore: fix grammar mistakes
  - #6283 Windows Sandbox: Show Everyone-writable directory warning
  - #6289 chore: move relevant tests to app-server/tests/suite/v2
  - #6333 feat: clarify that gpt-5-codex should not amend commits unless requested
  - #6332 Updated contributing guidelines and PR template to request link to bug report
    in PR notes
  - #5980 core: widen sandbox to allow certificate ops when network is enabled
  - #6337 [App Server] Add more session metadata to listConversations

## rust-v0.55.0 — 2025-11-04

## Highlights

#6222 reverted #6189, fixing #6220 (and other similar reports of the Codex CLI failing to start on Linux).

## Merged PRs
 
- #6222 Revert "fix: pin musl 1.2.5 for DNS fixes"
- #6208 ignore deltas in `codex_delegate`

## rust-v0.54.0 — 2025-11-04

 **⚠️ WARNING:** Attempting to pin musl 1.2.5 for DNS fixes in #6189 turned out to be the wrong fix. We reverted it in #6222 and published [0.55.0](https://github.com/openai/codex/releases/rust-v0.55.0).

Otherwise, this release was mostly bugfixes and documentation tweaks.

## Merged PRs

- #6189 fix: pin musl 1.2.5 for DNS fixes (#6189)
- #6202 fix: ignore reasoning deltas because we send it with turn item (#6202)
- #6175 [App-server] v2 for account/updated and account/logout (#6175)
- #6156 Fix is_api_message to correctly exclude reasoning messages (#6156)
- #4453 Follow symlinks during file search (#4453)
- #5175 docs: add example config.toml (#5175)
- #6180 fix: `--search` shouldn't show deprecation message (#6180)
- #6143 Fixed notify handler so it passes correct `input_messages` details (#6143)
- #6171 log sandbox commands to $CODEX_HOME instead of cwd (#6171)
- #5996 feat: add the time after aborting (#5996)
- #5541 tui: refine text area word separator handling (#5541)
- #6167 Do not skip trust prompt on Windows if sandbox is enabled. (#6167)
- #6129 feat: add options to responses-api-proxy to support Azure (#6129)
- #6161 Include reasoning tokens in the context window calculation (#6161)
- #6051 Fix rmcp client feature flag reference (#6051)
- #6159 Fix typo in error message for OAuth login (#6159)
- #5685 Add documentation for slash commands in `docs/slash_commands.md`. (#5685)
- #6111 fix: improve usage URLs in status card and snapshots (#6111)
- #6124 Fix "archive conversation" on Windows (#6124)
- #6137 chore(deps): bump actions/upload-artifact from 4 to 5 (#6137)
- #4903 fix: pasting api key stray character (#4903)
- #6131 Fix incorrect "deprecated" message about experimental config key (#6131)
- #6091 Changes to sandbox command assessment feature based on initial experiment feedback (#6091)
- #5956 Parse the Azure OpenAI rate limit message (#5956)
- #5649 docs: Fix link anchor and markdown format in advanced guide (#5649)
- #5659 Fixing small typo in docs (#5659)
- #5935 tui: patch crossterm for better color queries (#5935)
- #6050 [codex][app-server] improve error response for client requests (#6050)
- #4973 docs: fix broken link in contributing guide (#4973)
- #6027 feat: compactor 2 (#6027)
- #6052 Add warning on compact (#6052)
- #6043 chore: Add shell serialization tests for json (#6043)
- #5979 Truncate total tool calls text (#5979)
- #4797 docs: "Configuration" is not belongs "Getting started" (#4797)
- #4804 chore(deps): bump indexmap from 2.10.0 to 2.11.4 in /codex-rs (#4804)
- #4802 chore(deps): bump anyhow from 1.0.99 to 1.0.100 in /codex-rs (#4802)
- #4800 chore(deps): bump actions/checkout from 4 to 5 (#4800)
- #4801 chore(deps): bump actions/github-script from 7 to 8 (#4801)
- #6045 fix: brew upgrade link (#6045)
- #6034 test: undo (#6034)
- #4426 chore(deps): bump thiserror from 2.0.16 to 2.0.17 in /codex-rs (#4426)
- #6010 Update user instruction message format (#6010)
- #4266 fix(tui): propagate errors in insert_history_lines_to_writer (#4266)



## rust-v0.53.0 — 2025-10-31

### Highlights
- Fixing error 400 issues
- Improve sandboxing for Java

### PRs
#5897 – codex: add developer instructions
#5939 – app-server: remove serde(skip_serializing_if = "Option::is_none") annotations
#3754 – docs: add missing period
#5976 – hygiene: remove include_view_image_tool config
#3987 – fix: update Seatbelt policy for Java on macOS
#4905 – Windows Sandbox alpha version
#5997 – build: bump Windows stack size to 8 MB
#5986 – remove last-turn reasoning filtering
#6005 – app-server: split API types into v1 and v2
#6002 – feat: add /exit slash-command alias for quit
#6000 – rate-limit errors now return absolute time
#4144 – docs: fix markdown list spacing in review_prompt.md
#6007 – override verbosity for gpt-5-codex

## rust-v0.52.0 — 2025-10-30

### Highlights
- TUI polish: queued messages visible during streaming; Windows auto-mode guidance; undo op; compaction prompt configurable.
- Images: client-side image resizing; prevent crashes with MIME verification; SDK image forwarding tests re-enabled.
- Execute commands directly with `!<cmd>`
- Ability to buy credits for more usage. [More information](https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-pluspro)

### Other improvements
- Auth: new CLI auth storage abstraction with keyring support and configurable backend.
- App server: GetConversationSummary RPC; fetch/resume conversation summaries by id; refined account/protocol types.
- Execution/events: item streaming events; ghost commits; clearer deprecation warnings; better token refresh handling and logs.
- Conversation management: centralized truncation for all tool outputs; filter out prior-turn reasoning; annotate conversations with model_provider.

### List of merged PRs

1. Log HTTP Version in https://github.com/openai/codex/pull/5475
2. feat: local tokenizer in https://github.com/openai/codex/pull/5508
3. chore: drop approve all in https://github.com/openai/codex/pull/5503
4. [MCP] Add support for specifying scopes for MCP oauth in https://github.com/openai/codex/pull/5487
5. chore: clean spec tests in https://github.com/openai/codex/pull/5517
6. [MCP] Remove the legacy stdio client in favor of rmcp in https://github.com/openai/codex/pull/5529
7. [app-server] send account/rateLimits/updated notifications in https://github.com/openai/codex/pull/5477
8. Fix unified exec session id test helper in https://github.com/openai/codex/pull/5535
9. [app-server] add new account method API stubs in https://github.com/openai/codex/pull/5527
10. chore: clean handle_container_exec_with_params in https://github.com/openai/codex/pull/5516
11. fix: approval issue in https://github.com/openai/codex/pull/5525
12. tui: show aggregated output in display in https://github.com/openai/codex/pull/5539
13. Handle cancelling/aborting while processing a turn in https://github.com/openai/codex/pull/5543
14. chore: testing on apply_path in https://github.com/openai/codex/pull/5557
15. feat: use actual tokenizer for unified_exec truncation in https://github.com/openai/codex/pull/5514
16. feat: end events on unified exec in https://github.com/openai/codex/pull/5551
17. Use Option symbol for mac key hints in https://github.com/openai/codex/pull/5582
18. Moving token_info to ConversationHistory in https://github.com/openai/codex/pull/5581
19. [MCP] Update rmcp to 0.8.3 in https://github.com/openai/codex/pull/5542
20. [MCP] Improve startup errors for timeouts and github in https://github.com/openai/codex/pull/5595
21. fix: flaky tests in https://github.com/openai/codex/pull/5625
22. adding messaging for stale rate limits + when no rate limits are cached in https://github.com/openai/codex/pull/5570
23. Add CodexHttpClient wrapper with request logging in https://github.com/openai/codex/pull/5564
24. [app-server] fix account/read response annotation in https://github.com/openai/codex/pull/5642
25. Add instruction for upgrading codex with brew in https://github.com/openai/codex/pull/5640
26. Log more types of request IDs in https://github.com/openai/codex/pull/5645
27. Added model summary and risk assessment for commands that violate sandbox policy in https://github.com/openai/codex/pull/5536
28. [MCP] Redact environment variable values in /mcp and mcp get in https://github.com/openai/codex/pull/5648
29. [MCP] Properly gate login after mcp add with experimental_use_rmcp_client in https://github.com/openai/codex/pull/5653
30. [codex][app-server] introduce codex/event/raw_item events in https://github.com/openai/codex/pull/5578
31. Fixed flaky unit test in https://github.com/openai/codex/pull/5654
32. Improve feedback in https://github.com/openai/codex/pull/5661
33. Followup feedback in https://github.com/openai/codex/pull/5663
34. Skip flaky test in https://github.com/openai/codex/pull/5680
35. Added support for sandbox_mode in profiles in https://github.com/openai/codex/pull/5686
36. Reduced runtime of unit test that was taking multiple minutes in https://github.com/openai/codex/pull/5688
37. [MCP] Minor docs clarifications around stdio tokens in https://github.com/openai/codex/pull/5676
38. fix: use codex-exp prefix for experimental models and consider codex- models to be production in https://github.com/openai/codex/pull/5797
39. fix: revert "[app-server] fix account/read response annotation (#5642)" in https://github.com/openai/codex/pull/5796
40. Add feedback upload request handling in https://github.com/openai/codex/pull/5682
41. feat: annotate conversations with model_provider for filtering in https://github.com/openai/codex/pull/5658
42. feat: update NewConversationParams to take an optional model_provider in https://github.com/openai/codex/pull/5793
43. feat: undo wiring in https://github.com/openai/codex/pull/5630
44. feat: async ghost commit in https://github.com/openai/codex/pull/5618
45. feat: TUI undo op in https://github.com/openai/codex/pull/5629
46. nit: doc on session task in https://github.com/openai/codex/pull/5809
47. chore: undo nits in https://github.com/openai/codex/pull/5631
48. fix: test yield time in https://github.com/openai/codex/pull/5811
49. feat: introduce GetConversationSummary RPC in https://github.com/openai/codex/pull/5803
50. feat: return an error if unknown enabled/disabled feature in https://github.com/openai/codex/pull/5817
51. Made token refresh code resilient to missing id_token in https://github.com/openai/codex/pull/5782
52. [Auth] Introduce New Auth Storage Abstraction for Codex CLI in https://github.com/openai/codex/pull/5569
53. feat: support verbosity in model_family in https://github.com/openai/codex/pull/5821
54. [Auth] Add keyring support for Codex CLI in https://github.com/openai/codex/pull/5591
55. Centralize truncation in conversation history in https://github.com/openai/codex/pull/5652
56. fix: move account struct to app-server-protocol and use camelCase in https://github.com/openai/codex/pull/5829
57. [MCP] Render MCP tool call result images to the model in https://github.com/openai/codex/pull/5600
58. fix image drag drop in https://github.com/openai/codex/pull/5794
59. Truncate the content-item for mcp tools in https://github.com/openai/codex/pull/5835
60. feat(tui): clarify Windows auto mode requirements in https://github.com/openai/codex/pull/5568
61. [Auth] Choose which auth storage to use based on config in https://github.com/openai/codex/pull/5792
62. chore: speed-up pipeline in https://github.com/openai/codex/pull/5812
63. chore: drop useless shell stuff in https://github.com/openai/codex/pull/5848
64. chore: use anyhow::Result for all app-server integration tests in https://github.com/openai/codex/pull/5836
65. chore: decompose submission loop in https://github.com/openai/codex/pull/5854
66. fix advanced.md in https://github.com/openai/codex/pull/5833
67. tui: show queued messages during response stream in https://github.com/openai/codex/pull/5540
68. Filter out reasoning items from previous turns in https://github.com/openai/codex/pull/5857
69. revert #5812 release file in https://github.com/openai/codex/pull/5887
70. remove beta experimental header in https://github.com/openai/codex/pull/5892
71. Fixed bug that results in a sporadic hang when attaching images in https://github.com/openai/codex/pull/5891
72. verify mime type of images in https://github.com/openai/codex/pull/5888
73. [app-server] Annotate more exported types with a title in https://github.com/openai/codex/pull/5879
74. [App Server] Allow fetching or resuming a conversation summary from the conversation id in https://github.com/openai/codex/pull/5890
75. [codex][app-server] resume conversation from history in https://github.com/openai/codex/pull/5893
76. Refresh tokens more often and log a better message when both auth and token refresh fails in https://github.com/openai/codex/pull/5655
77. fix(windows-path): preserve PATH order; include core env vars in https://github.com/openai/codex/pull/5579
78. chore: merge git crates in https://github.com/openai/codex/pull/5909
79. feat: deprecation warning in https://github.com/openai/codex/pull/5825
80. feat: add output even in sandbox denied in https://github.com/openai/codex/pull/5908
81. Add missing "nullable" macro to protocol structs that contain optional fields in https://github.com/openai/codex/pull/5901
82. Add a wrapper around raw response items in https://github.com/openai/codex/pull/5923
83. fix: icu_decimal version in https://github.com/openai/codex/pull/5919
84. chore: config editor in https://github.com/openai/codex/pull/5878
85. Delegate review to codex instance in https://github.com/openai/codex/pull/5572
86. [exec] Add MCP tool arguments and results in https://github.com/openai/codex/pull/5899
87. Add item streaming events in https://github.com/openai/codex/pull/5546
88. Re-enable SDK image forwarding test in https://github.com/openai/codex/pull/5934
89. ignore agent message deltas for the review mode in https://github.com/openai/codex/pull/5937
90. asdf in https://github.com/openai/codex/pull/5940
91. Add debug-only slash command for rollout path in https://github.com/openai/codex/pull/5943
92. Add debug-only slash command for rollout path in https://github.com/openai/codex/pull/5936
93. Send delegate header in https://github.com/openai/codex/pull/5942
94. chore: unify config crates in https://github.com/openai/codex/pull/5958
95. Pass initial history as an optional to codex delegate in https://github.com/openai/codex/pull/5950
96. feat: compaction prompt configurable in https://github.com/openai/codex/pull/5959
97. nit: log rmcp_client in https://github.com/openai/codex/pull/5978
98. chore: testing on freeform apply_patch in https://github.com/openai/codex/pull/5952
99. [codex] add developer instructions in https://github.com/openai/codex/pull/5897
100. [app-server] remove serde(skip_serializing_if = \"Option::is_none\") annotations in https://github.com/openai/codex/pull/5939

## rust-v0.50.0 — 2025-10-25

### Highlights
- Improved `/feedback` to get better diagnostics. Please use it to report any issues. (#5661, #5663).

### Merged PRs

  - #5536 — Added model summary and risk assessment for commands that violate sandbox policy
    (@etraut-openai)
  - #5542 — [MCP] Update rmcp to 0.8.3 (@gpeal)
  - #5564 — Add CodexHttpClient wrapper with request logging (@pakrym-oai)
  - #5570 — adding messaging for stale rate limits + when no rate limits are cached (@zhao-oai)
  - #5578 — [codex][app-server] introduce codex/event/raw_item events (@apanasenko-oai)
  - #5581 — Moving token_info to ConversationHistory (@aibrahim-oai)
  - #5582 — Use Option symbol for mac key hints (@joshka-oai)
  - #5595 — [MCP] Improve startup errors for timeouts and github (@gpeal)
  - #5625 — fix: flaky tests (@jif-oai)
  - #5640 — Add instruction for upgrading codex with brew (@shijie-oai)
  - #5642 — [app-server] fix account/read response annotation (@owenlin0)
  - #5645 — Log more types of request IDs (@pakrym-oai)
  - #5648 — [MCP] Redact environment variable values in /mcp and mcp get (@gpeal)
  - #5653 — [MCP] Properly gate login after mcp add with experimental_use_rmcp_client (@gpeal)
  - #5654 — Fixed flaky unit test (@etraut-openai)
  - #5661 — Improve feedback (@aibrahim-oai)
  - #5663 — Followup feedback (@aibrahim-oai)
  - #5680 — Skip flaky test (@pakrym-oai)

## rust-v0.49.0 — 2025-10-24

## Highlights
* No major changes comparing to `v0.48.0` - `v0.49.0` is used for testing homebrew upgrade script. 

**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.48.0...rust-v0.49.0

## rust-v0.48.0 — 2025-10-23

## Highlights 
* `--add-dir` to add an additional working directory.
* Many MCP improvements:
  * stdio servers now use a new client backed by the official [rust MCP sdk](https://github.com/modelcontextprotocol/rust-sdk)
  * stdio servers can specify a `cwd`
  * All servers can specify `enabled_tools` or `disabled_tools`
  * Streamable HTTP servers can specify `scopes` during `codex mcp login`
  * Improved startup error messages
  * Better instruction following for calling tools
* Configuration options for `forced_login_method` and `forced_chatgpt_workspace_id` which can be paired with [managed configs](https://developers.openai.com/codex/security#managed-configuration) to give enterprises more control over Codex usage.

## Full list of merged PRs:
* Support graceful agent interruption by @pakrym-oai in https://github.com/openai/codex/pull/5287
* Fix nix build by @Mic92 in https://github.com/openai/codex/pull/4048
* [MCP] Render full MCP errors to the model by @gpeal in https://github.com/openai/codex/pull/5298
* Fix link to MCP Servers config section by @lopopolo-openai in https://github.com/openai/codex/pull/5301
* [MCP] When MCP auth expires, prompt the user to log in again. by @gpeal in https://github.com/openai/codex/pull/5300
* fix: switch rate limit reset handling to timestamps by @tibo-openai in https://github.com/openai/codex/pull/5304
* fix: diff_buffers clear-to-end when deleting wide graphemes by @MomentDerek in https://github.com/openai/codex/pull/4921
* docs(changelog): update install command to @openai/codex@<version> by @truls27a in https://github.com/openai/codex/pull/2073
* fix: handle missing resume session id gracefully by @tibo-openai in https://github.com/openai/codex/pull/5329
* fix: improve custom prompt documentation and actually use prompt descriptions by @tibo-openai in https://github.com/openai/codex/pull/5332
* Move rust analyzer target dir by @pakrym-oai in https://github.com/openai/codex/pull/5328
* Create independent TurnContexts by @pakrym-oai in https://github.com/openai/codex/pull/5308
* feat: add --add-dir flag for extra writable roots by @tibo-openai in https://github.com/openai/codex/pull/5335
* docs: add AGENTS.md discovery guide by @tibo-openai in https://github.com/openai/codex/pull/5353
* docs: improve overall documentation by @tibo-openai in https://github.com/openai/codex/pull/5354
* fix: config.md docs inaccuracies by @tibo-openai in https://github.com/openai/codex/pull/5355
* fix: update CLI usage order for codex -h by @tibo-openai in https://github.com/openai/codex/pull/5356
* docs: align sandbox defaults, dedupe sections and improve getting started guide by @tibo-openai in https://github.com/openai/codex/pull/5357
* [MCP] Prefix MCP tools names with `mcp__` by @gpeal in https://github.com/openai/codex/pull/5309
* feat: experimental `codex stdio-to-uds` subcommand by @bolinfest in https://github.com/openai/codex/pull/5350
* Add forced_chatgpt_workspace_id and forced_login_method configuration options by @gpeal in https://github.com/openai/codex/pull/5303
* Expand approvals integration coverage by @pakrym-oai in https://github.com/openai/codex/pull/5358
* feat: add images support to the Codex Typescript SDK by @needs in https://github.com/openai/codex/pull/5281
* Strip zsh -lc wrapper from TUI command headers by @hxreborn in https://github.com/openai/codex/pull/5374
* Update Homebrew install instructions to use cask by @shijie-oai in https://github.com/openai/codex/pull/5377
* Always enable plan tool in exec by @pakrym-oai in https://github.com/openai/codex/pull/5380
* Auto compact at ~90% by @aibrahim-oai in https://github.com/openai/codex/pull/5292
* Generate JSON schema for app-server protocol by @rasmusrygaard in https://github.com/openai/codex/pull/5063
* fix: warn when --add-dir would be ignored by @tibo-openai in https://github.com/openai/codex/pull/5351
* Use int timestamps for rate limit reset_at by @owenlin0 in https://github.com/openai/codex/pull/5383
* chore: rework tools execution workflow by @jif-oai in https://github.com/openai/codex/pull/5278
* Add ItemStarted/ItemCompleted events for UserInputItem by @pakrym-oai in https://github.com/openai/codex/pull/5306
* tui: drop citation rendering by @nornagon-openai in https://github.com/openai/codex/pull/4855
* [app-server] read rate limits API by @owenlin0 in https://github.com/openai/codex/pull/5302
* fix terminal corruption that could happen when onboarding and update banner by @nornagon-openai in https://github.com/openai/codex/pull/5269
* Reduce symbol size for tests by @pakrym-oai in https://github.com/openai/codex/pull/5389
* docs: update advanced guide details by @tibo-openai in https://github.com/openai/codex/pull/5395
* docs: clarify responses proxy metadata by @tibo-openai in https://github.com/openai/codex/pull/5406
* [MCP] Add configuration options to enable or disable specific tools by @gpeal in https://github.com/openai/codex/pull/5367
* Treat `zsh -lc` like `bash -lc` by @gpeal in https://github.com/openai/codex/pull/5411
* docs: clarify prompt metadata behavior by @tibo-openai in https://github.com/openai/codex/pull/5403
* docs: remove stale contribution reference by @tibo-openai in https://github.com/openai/codex/pull/5400
* docs: document exec json events by @tibo-openai in https://github.com/openai/codex/pull/5399
* docs: correct getting-started behaviors by @tibo-openai in https://github.com/openai/codex/pull/5407
* [MCP] Dedicated error message for GitHub MCPs missing a personal access token by @gpeal in https://github.com/openai/codex/pull/5393
* chore(ci): Speed up macOS builds by using larger runner by @JaviSoto in https://github.com/openai/codex/pull/5234
* feat: include cwd in notify payload by @tibo-openai in https://github.com/openai/codex/pull/5415
* fix(tui): Update WSL instructions by @dylan-hurd-oai in https://github.com/openai/codex/pull/5307
* [MCP] Bump rmcp to 0.8.2 by @gpeal in https://github.com/openai/codex/pull/5423
* Pass TurnContext around instead of sub_id by @pakrym-oai in https://github.com/openai/codex/pull/5421
* Fix flaky auth tests by @gpeal in https://github.com/openai/codex/pull/5461
* chore: drop env var flag by @jif-oai in https://github.com/openai/codex/pull/5462
* Enable plan tool by default by @pakrym-oai in https://github.com/openai/codex/pull/5384
* feat: emit events for unified_exec by @jif-oai in https://github.com/openai/codex/pull/5448
* fix: fix UI issue when 0 omitted lines by @jif-oai in https://github.com/openai/codex/pull/5451
* [app-server] model/list API by @owenlin0 in https://github.com/openai/codex/pull/5382
* Add a baseline test for resume initial messages by @pakrym-oai in https://github.com/openai/codex/pull/5466
* [otel] init otel for app-server by @apanasenko-oai in https://github.com/openai/codex/pull/5469
* feat: add experimental_bearer_token option to model provider definition by @bolinfest in https://github.com/openai/codex/pull/5467
* Log HTTP Version by @pakrym-oai in https://github.com/openai/codex/pull/5475
* feat: add text cleared with ctrl+c to the history so it can be recovered with up arrow by @JaviSoto in https://github.com/openai/codex/pull/5470
* docs: Add `--cask` option to brew command to suggest by @yanskun in https://github.com/openai/codex/pull/5432
* chore: align unified_exec by @jif-oai in https://github.com/openai/codex/pull/5442
* feat: local tokenizer by @jif-oai in https://github.com/openai/codex/pull/5508
* chore: drop approve all by @jif-oai in https://github.com/openai/codex/pull/5503
* [MCP] Add support for specifying scopes for MCP oauth by @gpeal in https://github.com/openai/codex/pull/5487
* Add new thread items and rewire event parsing to use them by @pakrym-oai in https://github.com/openai/codex/pull/5418
* chore: clean spec tests by @jif-oai in https://github.com/openai/codex/pull/5517
* docs: fix agents fallback example by @tibo-openai in https://github.com/openai/codex/pull/5396
* [MCP] Remove the legacy stdio client in favor of rmcp by @gpeal in https://github.com/openai/codex/pull/5529
* Move changing turn input functionalities to `ConversationHistory` by @aibrahim-oai in https://github.com/openai/codex/pull/5473
* [app-server] send account/rateLimits/updated notifications by @owenlin0 in https://github.com/openai/codex/pull/5477
* Fix IME submissions dropping leading digits by @genki in https://github.com/openai/codex/pull/4359
* [app-server] add new account method API stubs by @owenlin0 in https://github.com/openai/codex/pull/5527
* chore: clean `handle_container_exec_with_params` by @jif-oai in https://github.com/openai/codex/pull/5516
* fix: approval issue by @jif-oai in https://github.com/openai/codex/pull/5525
* tui: show aggregated output in display by @nornagon-openai in https://github.com/openai/codex/pull/5539
* Handle cancelling/aborting while processing a turn by @aibrahim-oai in https://github.com/openai/codex/pull/5543
* chore: testing on apply_path by @jif-oai in https://github.com/openai/codex/pull/5557
* feat: use actual tokenizer for unified_exec truncation by @jif-oai in https://github.com/openai/codex/pull/5514
* fix: resume lookup for gitignored CODEX_HOME by @tibo-openai in https://github.com/openai/codex/pull/5311
* feat: end events on unified exec by @jif-oai in https://github.com/openai/codex/pull/5551

## New Contributors
* @Mic92 made their first contribution in https://github.com/openai/codex/pull/4048
* @lopopolo-openai made their first contribution in https://github.com/openai/codex/pull/5301
* @MomentDerek made their first contribution in https://github.com/openai/codex/pull/4921
* @truls27a made their first contribution in https://github.com/openai/codex/pull/2073
* @needs made their first contribution in https://github.com/openai/codex/pull/5281
* @hxreborn made their first contribution in https://github.com/openai/codex/pull/5374
* @owenlin0 made their first contribution in https://github.com/openai/codex/pull/5383
* @yanskun made their first contribution in https://github.com/openai/codex/pull/5432
* @genki made their first contribution in https://github.com/openai/codex/pull/4359

**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.47.0...rust-v0.48.0

## rust-v0.47.0 — 2025-10-17

## Highlights

- Improvements and bug-fixes in Codex CLI
- Code signing binaries on MacOS
- Auto update banner
- :new: Warning when enabling "full access" mode

## Full list of merged PRs:

- Indentation mode for read_file (#4887)
- Message when stream get correctly resumed (#4988)
- Make shortcut works even with capslock (#5049)
- Discard prompt starting with a slash (#5048)
- Add header for task kind (#5142)
- Pass codex thread ID in notifier metadata (#4582)
- Updated github issue template (#5191)
- Agent override file (#5215)
- Prompt mcp login when adding a streamable HTTP server that supports oauth (#5193)
- Add parsed command to ExecApprovalRequestEvent (#5222)
- Add warning about rate limit when using high effort (#5035)
- Auto update approval (#5185)
- Add macOS notarization step to release workflow (#5233)
- Add confirmation prompt for enabling full access approvals (#4980)
- Add path field to `ParsedCommand::Read` variant (#5275)
- Better UX during refusal (#5260)
- Lagged output in unified_exec buffer (#4992)
- Sandbox denied error logs (#4874)
- Add code signing for MacOS binary (#4899)
- Fix wrapping in user approval decisions (#5008)
- Fix wrapping in trust_directory (#5007)
- /diff mode wraps long lines (#4891)
- Fix crash when alt+bksp past unicode nbsp (#5016)
- Include the image name in the textarea placeholder (#5056)
- Detect Bun installs in CLI update banner (#5074)
- Add dangerous auto-approval for codex exec (#5043)
- Update tui to sandbox_workspace_write (#3341)
- Codex cloud exec (#5060)


## rust-v0.46.0 — 2025-10-09

## Highlights

### Improved MCP support
We are in the middle of significantly improving support for connecting to MCP servers including support for streamable http servers with optional bearer token or oauth login support.

Enable the `experimental_use_rmcp_client = true` flag in `config.toml` to use the new MCP stack. If you encounter issues, create a GitHub issue and add the `mcp` label. We would like to remove the experimental flag soon and will continue to expand MCP support over time.

## What's Changed
* [MCP] Fix the bearer token authorization header by @gpeal in https://github.com/openai/codex/pull/4846
* Print codex resume note when quitting after codex resume by @nornagon-openai in https://github.com/openai/codex/pull/4695
* Use Number instead of BigInt for TokenCountEvent by @ccy-oai in https://github.com/openai/codex/pull/4856
* Simplify request body assertions by @pakrym-oai in https://github.com/openai/codex/pull/4845
* Fix zsh completion by @tamird in https://github.com/openai/codex/pull/4692
* [Cloud Tasks] Use workspace deps by @tamird in https://github.com/openai/codex/pull/4693
* Simplify parallel by @pakrym-oai in https://github.com/openai/codex/pull/4829
* [TUI] Remove bottom padding by @gpeal in https://github.com/openai/codex/pull/4854
* [TUI] Dynamic width for line numbers in diffs by @nornagon-openai in https://github.com/openai/codex/pull/4664
* [TUI] Wrapping bugfix by @nornagon-openai in https://github.com/openai/codex/pull/4674
* Fix flaky test by @jif-oai in https://github.com/openai/codex/pull/4878
* `list_dir` tool by @jif-oai in https://github.com/openai/codex/pull/4817
* [TUI] Breathing spinner on true-color terms by @nornagon-openai in https://github.com/openai/codex/pull/4853
* [TUI] Remove instruction hack for /review by @dedrisian-oai in https://github.com/openai/codex/pull/4896
* Set codex SDK TypeScript originator by @pakrym-oai in https://github.com/openai/codex/pull/4894
* [TUI] Bring the transcript closer to display mode by @nornagon-openai in https://github.com/openai/codex/pull/4848
* [TUI] Switch to tree-sitter-highlight bash highlighting by @nornagon-openai in https://github.com/openai/codex/pull/4666
* remove experimental prefix by @rakesh-oai in https://github.com/openai/codex/pull/4907
* [MCP] Add the ability to explicitly specify a credentials store by @gpeal in https://github.com/openai/codex/pull/4857
* [MCP] Add support for streamable http servers with `codex mcp add` and replace bearer token handling by @gpeal in https://github.com/openai/codex/pull/4904
* featgrep_files as a tool by @jif-oai in https://github.com/openai/codex/pull/4820
* CLI UP/ENTER by @jif-oai in https://github.com/openai/codex/pull/4944
* change log_sse_event() so it no longer takes a closure by @bolinfest in https://github.com/openai/codex/pull/4953
* truncate on compact by @jif-oai in https://github.com/openai/codex/pull/4942
* Fix transcript mode rendering issue when showing tab chars by @dedrisian-oai in https://github.com/openai/codex/pull/4911
* [TUI] hardcode xterm palette, shimmer blends between fg and bg by @nornagon-openai in https://github.com/openai/codex/pull/4957
* [MCP] Add an `enabled` config field by @gpeal in https://github.com/openai/codex/pull/4917
* Make context line permanent by @dedrisian-oai in https://github.com/openai/codex/pull/4699
* [MCP] Add auth status to MCP servers by @gpeal in https://github.com/openai/codex/pull/4918
* [TUI] fix off-by-16 in terminal_palette by @nornagon-openai in https://github.com/openai/codex/pull/4967
* Create alias by @rakesh-oai in https://github.com/openai/codex/pull/4971
* Set chat name by @dedrisian-oai in https://github.com/openai/codex/pull/4974
* revert /name for now by @dedrisian-oai in https://github.com/openai/codex/pull/4978

## New Contributors
* @ccy-oai made their first contribution in https://github.com/openai/codex/pull/4856
* @tamird made their first contribution in https://github.com/openai/codex/pull/4692

**Full Changelog**: https://github.com/openai/codex/compare/rust-v0.45.0...rust-v0.46.0

## rust-v0.45.0 — 2025-10-06

## Breaking changes
`codex login --api-key` was replaced with `codex login --with-api-key` that reads the key from `stdin` to improve security.

Sample usage:
```bash
printenv OPENAI_API_KEY | codex login --with-api-key
```

## Highlights:

- #4517 Experimental support for OAuth MCP server authentication

## Full list of merged PRs:

- #4636 Replace `--api-key` with `--with-api-key` for logging into the CLI with an API key
- #4644 Only write the final message to stdout for `codex exec`
- #4676 Default to `gpt-5` for Windows users who have not set a default model
- #4689 Remove the requirement to use `experimental_use_rmcp_client` for streamable HTTP MCP servers that don't require OAuth
- #4673 Fix colors when refocusing the terminal after a system theme update
- #4694 Fix reasoning effort title
- #4616 Updated device code login copy
- #4706 Fix command output truncation that sometimes used too much of the context window
- #4663 Initial parallel tool call support
- #4736 Pulsing dot loading state

## rust-v0.44.0 — 2025-10-03

## Highlights:

- New UI refresh! Updated chat composer, bottom pane, model picker, and upgrade nudge (#4240, #4316, #4178, #4405)
- Custom prompts now support named & positional arguments (#4474, #4470)
- Add support for streamable HTTP MCP servers (#4317)
- (experimental) Reduce repetitive approval for read-only commands on Windows (#4269)
- (very experimental) Manage cloud tasks with `codex cloud` (#3197)

+ many more fixes and improvements


## Full list of merged PRs:

- #4642 Nit: Pop model effort picker on esc
- #4641 Move gpt-5-codex to top
- #4639 Fix tab+enter regression on slash commands
- #4619 feat: add file name to fuzzy search response
- #4629 tui: • Working, 100% context dim
- #4633 Use supports_color in codex exec
- #4636 Enable codex workflows
- #4638 Update issue-deduplicator.yml
- #4571 feat: write pid in addition to port to server info
- #4635 Deduplicator fixes
- #4627 fix false "task complete" state during agent message
- #4634 Bump codex version in actions to latest
- #4610 Rename assistant message to agent message and fix item type field naming
- #4630 Use GH cli to fetch current issue
- #4622 tui: tweaks to dialog display
- #4628 Add issue deduplicator workflow
- #4585 Minor cleanup of codex exec output
- #4626 Revert "chore: sandbox extraction"
- #4621 Add issue labeler workflow
- #4583 Add a separate exec doc
- #4612 Separate interactive and non-interactive sessions
- #4178 Make model switcher two-stage
- #4475 show "Viewed Image" when the model views an image
- #4586 normalize key hints
- #4584 Fix status usage ratio
- #4454 fix: handle JSON Schema in additionalProperties for MCP tools
- #4615 Support CODEX_API_KEY for codex exec
- #4569 fix: update the gpt-5-codex prompt to be more explicit that it should always used fenced code blocks info tags
- #4579 Store settings on the thread instead of turn
- #4572 Include request ID in the error message
- #4577 canonicalize display of Agents.md paths on Windows.
- #4573 rework patch/exec approval UI
- #4513 Add initial set of doc comments to the SDK
- #4576 Revert "chore: prompt update to enforce good usage of apply_patch"
- #4567 Explicit node imports
- #4568 Fix hang on second oauth login attempt
- #4575 fix: use `number` instead of `bigint` for the generated TS for RequestId
- #4566 fix ctr-n hint
- #4556 feat: add --emergency-version-override option to create_github_release script
- #4563 SDK: support working directory and skipGitRepoCheck options
- #4544 Fall back to configured instruction files if AGENTS.md isn't available
- #4536 Show context window usage while tasks run
- #4509 Show placeholder for commands with no output
- #4468 Add Updated at time in resume picker
- #4559 Handle trailing backslash properly
- #4269 implement command safety for PowerShell commands
- #4555 fix: pnpm/action-setup@v4 should run before actions/setup-node@v5
- #4543 chore: introduce publishing logic for @openai/codex-sdk
- #4286 chore: sanbox extraction
- #4533 Fix Callback URL for staging and prod environments
- #4537 fix: remove mcp-types from app server protocol
- #4532 Add executable detection and export Codex from the SDK
- #4529 fix: use macros to ensure request/response symmetry
- #4525 Remove legacy codex exec --json format
- #4506 wrap markdown at render time
- #4520 Delete codex proto
- #4521 fix: enable process hardening in Codex CLI for release builds
- #4518 fix: clean up TypeScript exports
- #4512 fix: ensure every variant of ClientRequest has a params field
- #4511 Wire up web search item
- #4508 [SDK] Test that a tread can be continued with extra params
- #3846 chore: prompt update to enforce good usage of apply_patch
- #4474 Named args for custom prompts
- #4503 Support model and sandbox mode in the sdk
- #3197 Add cloud tasks
- #4471 fix: separate `codex mcp` into `codex mcp-server` and `codex app-server`
- #4422 Update MCP docs to reference experimental RMCP client
- #4486 Move PR-style review to top
- #4483 SDK CI
- #4485 Set originator for codex exec
- #4482 Rename conversation to thread in codex exec
- #4481 Add MCP tool call item to codex exec
- #4472 Add some types and a basic test to the SDK
- #3531 Rakesh/support device auth
- #4478 Add turn.failed and rename session created to thread started
- #4476 Custom prompts begin with `/prompts:`
- #4458 Fixes
- #4364 reintroduce "? for shortcuts"
- #4470 Custom prompt args (numeric)
- #4469 no background for /command or @file popup
- #4467 render • as dim
- #4461 [Core]: add tail in the rollout data
- #4455 TypeScript SDK scaffold
- #4456 Parse out frontmatter for custom prompts
- #2677 [mcp-server] Expose fuzzy file search in MCP
- #2103 OpenTelemetry events
- #4447 fix clear-to-end being emitted at the end of a row
- #4419 [CODEX-3595] Remove period when copying highlighted text in iTerm
- #4417 feat: introduce npm module for codex-responses-api-proxy
- #4416 Add /review to main commands
- #4408 fix: clean up some minor issues with .github/workflows/ci.yml
- #4406 feat: build codex-responses-api-proxy for all platforms as part of the GitHub Release
- #4404 chore: remove responses-api-proxy from the multitool
- #4412 chore: lower logging level from error to info for MCP startup
- #4403 chore: move pre_main_hardening() utility into its own crate
- #4405 Improve update nudge
- #4332 chore: remove model upgrade popup
- #4362 fix(tui): make `?` work again
- #4336 fix: remove default timeout of 30s in the proxy
- #4330 Edit the spacing in shortcuts
- #4324 tui: separator above final agent message
- #4335 fix: set gpt-5-codex medium preset reasoning
- #4333 docs: refresh README under codex-rs
- #4316 Add "? for shortcuts"
- #4317 [MCP] Add support for streamable HTTP MCP servers
- #4240 update composer + user message styling
- #4309 Add turn started/completed events and correct exit code on error
- #4307 reject dangerous commands for AskForApproval::Never

## rust-v0.42.0 — 2025-09-26

## Notable Changes

- Experimental Rust SDK–based MCP client introduced (#4252)
- New `responses-api-proxy` component to simplify and secure response handling/proxying (#4246)
- Added secure mode: `CODEX_SECURE_MODE=1` to restrict process observability (#4220)
- More explicit `codex exec` events, including `item.started` and improved output display (#4177, #4250, #4113)
- Safer command execution: dangerous command checks in core and Windows-specific safety (#4211, #4119)
- UX improvements:  revamped `/status` with clearer presentation and details, pageless session list, approvals moved to `ListSelectionView`, better MCP tool call styling, and hiding status indicator during streaming (#3194, #4275, #3871, #4101,  #4196)
- Stability and correctness: token usage fix for compaction, SSE mounting reliability, and improving bugs on editing previous conversations (#4281, #4264, #4237)
- IDE extension reliability: fix login with API key when `.codex` directory is missing (#4258)
- Internal cleanup and refactors for state, footer logic, and unused code (#4174, #4259, #4310)

## Merged PRs

- [#4304] /status followup (#4304)
- [#4310] chore: dead code removal; remove frame count and stateful render helpers (#4310)
- [#4252] [MCP] Introduce an experimental official rust sdk based mcp client (#4252)
- [#4255] Add todo-list tool support (#4255)
- [#4246] feat: introduce responses-api-proxy (#4246)
- [#4281] fix: token usage for compaction (#4281)
- [#4113] Show exec output on success with trimmed display (#4113)
- [#4275] Move approvals to use ListSelectionView (#4275)
- [#4259] Refactor the footer logic to a new file (#4259)
- [#4229] ref: state - 2 (#4229)
- [#4211] core: add potentially dangerous command check (#4211)
- [#4264] Actually mount sse once (#4264)
- [#4254] Add codex exec testing helpers (#4254)
- [#4258] Fixed login failure with API key in IDE extension when a `.codex` directory doesn't exist (#4258)
- [#4256] fix typo in sandbox doc (#4256)
- [#4250] [codex exec] Add item.started and support it for command execution (#4250)
- [#4251] fix (#4251)
- [#4248] fix bug when resizing to a smaller width (#4248)
- [#4067] make tests pass cleanly in sandbox (#4067)
- [#4204] Fix error message (#4204)
- [#4177] Add explicit codex exec events (#4177)
- [#4194] chore: refactor attempt_stream_responses() out of stream_responses() (#4194)
- [#4237] fix: esc w/ queued messages overwrites draft in composer (#4237)
- [#4220] feat: add support for CODEX_SECURE_MODE=1 to restrict process observability (#4220)
- [#4196] revamp /status (#4196)
- [#4174] ref: full state refactor (#4174)
- [#4205] github: update codespell action to v2.1 in workflow (#4205)
- [#4195] Send text parameter for non-gpt-5 models (#4195)
- [#4188] chore: drop unused values from env_flags (#4188)
- [#4119] adds a windows-specific method to check if a command is safe (#4119)
- [#3194] pageless session list (#3194)
- [#3871] improve MCP tool call styling (#3871)
- [#4101] hide the status indicator when the answer stream starts (#4101)
- [#4160] Simplify tool implemetations (#4160)

## rust-v0.41.0 — 2025-09-24

### Highlights:
- Rate limits visibility: You can see when is your limits resetting (#4111) and see your usage when rate limited (#4102)
- You can specify output schema in `exec` mode using `output-schema`. (#4079)
- Ripgrep (`rg`) is now vendored into the `npm` release (#3660), which should fix issues such as #3842 where the `postinstall` step of `@vscode/ripgrep` would sometimes fail when installing `codex` via `npm`.

### Merged PRs:
#4090 feat: readiness tool
#4088 chore: compact do not modify instructions
#4069 refactor codex card layout
#4105 Use anyhow::Result in tests for error propagation
#4079 Add exec output-schema parameter
#4102 Send limits when getting rate limited
#3461 [exec] add include-plan-tool flag and print it nicely
#3660 fix: vendor ripgrep in the npm module
#4112 fix: npm publish --tag alpha when building an alpha release
#4031 chore(deps): bump serde from 1.0.224 to 1.0.226 in /codex-rs
#4027 chore(deps): bump log from 0.4.27 to 0.4.28 in /codex-rs
#4030 chore(deps): bump tempfile from 3.20.0 to 3.22.0 in /codex-rs
#4135 nit: update auto compact to 250k
#4137 nit: drop instruction override for auto-compact
#4140 chore: extract readiness in a dedicated utils crate
#4111 Add Reset in for rate limits
#4156 nit: 350k tokens
#4124 chore: upgrade to Rust 1.90
#4162 fix: add tolerance for ambiguous behavior in gh run list
#4154 chore: remove once_cell dependency from multiple crates
#2156 chore(deps): bump unicode-width from 0.1.14 to 0.2.1 in /codex-rs
#4028 chore(deps): bump chrono from 0.4.41 to 0.4.42 in /codex-rs

## rust-v0.40.0 — 2025-09-23

## Notable Changes

- Default model is now `gpt-5-codex` (#4076)
- Autocompaction is triggered automatically for `gpt-5-codex` when hitting 220k tokens (#4093)
- Usage limits are now visible in `/status` (#4053)
- New `/review` commands (review specific commit, against a base branch, or custom instructions) (#3961)
- The default timeout for MCP tool calls is `60s` and can be overridden in `config.toml` by setting `tool_timeout_sec` for an individual MCP server. (#3959)

## Merged PRs

- [#3881] fix: update try_parse_word_only_commands_sequence() to return commands in order (#3881)
- [#3814] Use a unified shell tell to not break cache (#3814)
- [#3878] Move responses mocking helpers to a shared lib (#3878)
- [#3888] Use helpers instead of fixtures (#3888)
- [#3937] fix alignment in slash command popup (#3937)
- [#3925] don't clear screen on startup (#3925)
- [#3950] Cache keyboard enhancement detection before event streams (#3950)
- [#3965] Forward Rate limits to the UI (#3965)
- [#3977] Tui: Rate limits (#3977)
- [#3961] feat: Add more /review options (#3961)
- [#3880] Add non_sandbox_test helper (#3880)
- [#4044] chore: unify cargo versions (#4044)
- [#4057] chore: more clippy rules 2 (#4057)
- [#3959] timeouts for mcp tool calls (#3959)
- [#4053] Add limits to /status (#4053)
- [#3928] simplify StreamController (#3928)
- [#4020] Tui: fix backtracking (#4020)
- [#4055] Remove /limits after moving to /status (#4055)
- [#4026] feat: Add view stack to BottomPane (#4026)
- [#4059] Change limits warning copy (#4059)
- [#4058] chore: clippy on redundant closure (#4058)
- [#4061] Fix branch mode prompt for /review (#4061)
- [#4060] Change headers and struct of rate limits (#4060)
- [#3952] Fix pager overlay clear between pages (#3952)
- [#3957] fix codex resume message at end of session (#3957)
- [#4068] Truncate potentially long user messages in compact message. (#4068)
- [#4076] feat: update default (#4076)
- [#4064] Add notifier tests (#4064)
- [#4093] chore: enable auto-compaction for `gpt-5-codex` (#4093)
- [#4096] Use TestCodex builder in stream retry tests (#4096)
- [#3914] feat: git tooling for undo (#3914)
- [#4082] fix: usage data tweaks (#4082)
- [#4075] Rate limits warning (#4075)

## rust-v0.39.0 — 2025-09-18

## New Features

- new `/review` command introduced in #3774

## Merged PRs:

- [#3874] fix: ensure cwd for conversation and sandbox are separate concerns (#3874)
- [#3774] feat: /review (#3774)
- [#3753] Reland "refactor transcript view to handle HistoryCells" (#3753)
- [#3867] fix error on missing notifications in [tui] (#3867)
- [#3850] chore: use tokio mutex and async function to prevent blocking a worker (#3850)
- [#3849] fix: some nit Rust reference issues (#3849)
- [#3757] hint for codex resume on tui exit (#3757)
- [#3857] Make ESC button work when auto-compaction (#3857)
- [#3729] Unify animations (#3729)
- [#3819] Switch to uuid_v7 and tighten ConversationId usage (#3819)
- [#3777] bug: Ignore tests for now (#3777)
- [#3822] chore: update "Codex CLI harness, sandboxing, and approvals" section (#3822)
- [#3756] Use agent reply text in turn notifications (#3756)
- [#3807] AGENTS.md: Add instruction to install missing commands (#3807)

## rust-v0.38.0 — 2025-09-17

This release includes only one change on top of [0.37.0](https://github.com/openai/codex/releases/tag/rust-v0.37.0), which is a fix to the `npm-publish` step in the release process (#3806). Updating `npm` with the latest release is now fully automated, and if you visit https://www.npmjs.com/package/@openai/codex#provenance-details-header, you should now see this special _Provenance_ badge:

<img width="777" height="196" alt="Screenshot 2025-09-17 at 11 24 50 AM" src="https://github.com/user-attachments/assets/faea39e2-9f21-4f60-9053-24e40c77b110" />

Merged PRs:

- [#3806] fix: specify --repo when calling gh (#3806)

## rust-v0.37.0 — 2025-09-17

Mostly small quality-of-life fixes in this release.

## Highlights

Updated the npm release process to use ["trusted publishing"](https://docs.npmjs.com/trusted-publishers) (#3431). Though apparently there was a bug, so we may not see the benefit until `0.38.0`. Fix is in #3806.

## Merged PRs

- [#3329] notifications on approvals and turn end (#3329)
- [#3659] chore: restore prerelease logic in rust-release.yml (#3659)
- [#3617] chore(deps): bump serde_json from 1.0.143 to 1.0.145 in /codex-rs (#3617)
- [#3664] chore: simplify dep so serde=1 in Cargo.toml (#3664)
- [#3618] chore(deps): bump serde from 1.0.219 to 1.0.223 in /codex-rs (#3618)
- [#3619] chore(deps): bump wildmatch from 2.4.0 to 2.5.0 in /codex-rs (#3619)
- [45bccd36](https://github.com/openai/codex/commit/45bccd36b038a28b23663189cc6f7557e49e06d0) fix permissions alignment
- [#3673] fix: read-only escalations (#3673)
- [#3680] Update azure model provider example (#3680)
- [#3745] Persist search items (#3745)
- [#3678] fix: Record EnvironmentContext in SendUserTurn (#3678)
- [#3701] Review mode core updates (#3701)
- [#3755] restyle thinking outputs (#3755)
- [#3758] Add dev message upon review out (#3758)
- [#3431] fix: make GitHub Action publish to npm using trusted publishing (#3431)
- [#3763] fix: ensure pnpm is installed before running `npm install` (#3763)
- [#3767] fix: make publish-npm its own job with specific permissions (#3767)
- [#3806] fix: specify --repo when calling gh (#3806)

## rust-v0.36.0 — 2025-09-15

### **Breaking change:** `OPENAI_API_KEY` is no longer read from the environment

API login is no longer implicit; we do not pick up `OPENAI_API_KEY` from the environment. To use an API key programmatically, run the following _once_:

```shell
codex login --api-key "your-api-key-here"
```

and this value will be stored in `CODEX_HOME/auth.json`.

The next time you run `codex`, the API key stored in `auth.json` will be used automatically.

To switch to ChatGPT login instead of using your API key, run `codex login`.

Note that `codex logout` will remove whatever login credential is stored in `auth.json` (API key or ChatGPT auth token).

### Highlights

**Introducing our newest model GPT-5-Codex**
GPT-5-Codex works faster through easy tasks and harder on complex tasks, improves on code quality, and is more steerable with AGENTS.md. [Learn More](https://openai.com/index/introducing-upgrades-to-codex/)
  
**Resuming old sessions** 
Resuming old conversations with `codex resume` (#3537, #3625).

**Unified execution and reliability**
Unified execution improvements (#3288, #3479) and race-condition fix (#3644); include command output on timeouts (#3576); do not execute when command parses as a patch (#3382); improved sandbox timeout handling (#3435); flaky test fixes (#3596, #3564).

**Auth and login experience**
- login polish (#3632); fix issue allowing to be both logged in and using API key simultaneously (#3611); fix stray login URL characters (#3639); fix `get_auth_status` for custom providers (#3581).

**JSON-RPC and MCP**
JSON-RPC: `SetDefaultModel` and `None` clears default (#3512, #3529), `UserInfo` (#3428), `reasoning_effort` in `NewConversationResponse` (#3506); initial MCP interface and docs (#3543, #3507, #3345); standardized shell description (#3514).

**TUI onboarding and polish**
New onboarding flow and animation (#3398, #3631, #3590, #3627), consistent headers on resume (#3615, #3592), improved spacing/padding (#3469, #3471, #3472, #3474), clearer interruption and status styling (#3470), numerous UX nits addressed (#3650, #3534).

**Core platform**
Experimental automatic context compaction (#3446); expanded default sandbox (#3483); Azure Responses API workaround (#3528); preserve more item IDs in Azure (#3542); logging and clippy improvements (#3488, #3489); `just test` via nextest (#3508).

### All merged PRs

- fix: change MIN_ANIMATION_HEIGHT so show_animation is calculated correctly (#3656)
- feat: tweak onboarding strings (#3650)
- fix stray login url characters persisting in login (#3639)
- Add file reference guidelines to gpt-5 prompt (#3651)
- feat: skip animations on small terminals (#3647)
- chore: rename (#3648)
- fix: add references (#3633)
- chore: set `prerelease:true` for now (#3645)
- fix: race condition unified exec (#3644)
- feat: update splash (#3631)
- chore(deps): bump tracing-subscriber from 0.3.19 to 0.3.20 in /codex-rs (#3620)
- chore(deps): bump slab from 0.4.10 to 0.4.11 in /codex-rs (#3635)
- Login flow polish (#3632)
- Fix codex resume so flags (cd, model, search, etc.) still work (#3625)
- feat: tighten preset filter, tame storage load logs, enable rollout prompt by default (#3628)
- Show abort in the resume (#3629)
- Change animation frames (#3627)
- initial mcp add interface (#3543)
- chore: update prompts for gpt-5-code (#3624)
- feat: add reasoning level to header (#3622)
- Revert "refactor transcript view to handle HistoryCells" (#3614)
- Show the header when resuming a conversation (#3615)
- When logging in using ChatGPT, make sure to overwrite API key (#3611)
- Don't show the model for apikey (#3607)
- Fix get_auth_status response when using custom provider (#3581)
- fix: model family and apply_patch consistency (#3603)
- fix(tui): update full-auto to default preset (#3608)
- fix(core): flaky test `completed_commands_do_not_persist_sessions` (#3596)
- Skip frames files in codespell (#3606)
- Add session header to chat widget (#3592)
- Append full raw reasoning event text (#3605)
- feat: UI animation (#3590)
- Fix EventMsg Optional (#3604)
- Single branch for gpt-5-code (#3601)
- enable-resume (#3537)
- feat: update model save (#3589)
- Fix flaky windows test (#3564)
- Fix gpt-5-code model selector (#3598)
- Add per-model-family prompts (#3597)
- Include command output when sending timeout to model (#3576)
- Align user history message prefix width (#3467)
- Gate model upgrade prompt behind ChatGPT auth (#3586)
- chore: update `output_lines()` to take a struct instead of bools (#3591)
- Add spacing before queued status indicator messages (#3474)
- Handle resuming/forking after compact (#3533)
- refactor transcript view to handle HistoryCells (#3538)
- Default gpt-5-code models to experimental reasoning summaries (#3560)
- Preserve IDs for more item types in azure (#3542)
- Always request encrypted cot (#3539)
- Review Mode (Core) (#3401)
- fix: NIT None reasoning effort (#3536)
- Fix NUX UI (#3534)
- core: expand default sandbox (#3483)
- Add Azure Responses API workaround (#3528)
- if a command parses as a patch, do not attempt to run it (#3382)
- Update interruption error message styling (#3470)
- feat: context compaction (#3446)
- Add spacing before composer footer hints (#3469)
- Add spacing between dropdown headers and items (#3472)
- feat: reasoning effort as optional (#3527)
- feat: change the behavior of SetDefaultModel RPC so None clears the value. (#3529)
- standardize shell description (#3514)
- bug: fix model save (#3525)
- Add spacing to timer duration formats (#3471)
- MCP Documentation Changes Requests in Code Review (#3507)
- chore: add `just test`, which runs `cargo nextest` (#3508)
- feat: added SetDefaultModel to JSON-RPC server (#3512)
- feat: include reasoning_effort in NewConversationResponse (#3506)
- add(readme): IDE (#3494)
- Log cf-ray header in client traces (#3488)
- bug: default to image (#3501)
- feat: TUI onboarding (#3398)
- Use PlanType enum when formatting usage-limit CTA (#3495)
- Add more detailed documentation on MCP server usage (#3345)
- fix: improve `handle_sandbox_error` timeouts (#3435)
- chore: enable `clippy::redundant_clone` (#3489)
- Assign the entire gpt-5 model family same characteristics (#3490)
- Clear composer on fork (#3445)
- fix: use -F instead of -f for force=true in gh call (#3486)
- Add Compact and Turn Context to the rollout items (#3444)
- NIT unified exec (#3479)
- Simplify auth flow and reconcile differences between ChatGPT and API Key auth (#3189)
- apply-patch: sort replacements and add regression tests (#3425)
- chore: rust-release.yml should update the latest-alpha-cli branch (#3458)
- fix: add check to ensure output of `generate_mcp_types.py` matches `codex-rs/mcp-types/src/lib.rs` (#3450)
- Change forking to read the rollout from file (#3440)
- Unified execution (#3288)
- feat: add UserInfo request to JSON-RPC server (#3428)
- fix: ensure output of `codex-rs/mcp-types/generate_mcp_types.py` matches `codex-rs/mcp-types/src/lib.rs` (#3439)
- fix trampling projects table when accepting trusted dirs (#3434)
- put workspace roots in the environment context (#3375)

## rust-v0.35.0 — 2025-09-15

See [0.36.0](https://github.com/openai/codex/releases/tag/rust-v0.36.0)

## rust-v0.34.0 — 2025-09-10

#3436: hotfix for issue that prevented Codex from initializing external MCP servers

## Merged PRs

- [#2799] Persist model & reasoning changes (#2799)
- [#3436] Make user_agent optional (#3436)

## rust-v0.33.0 — 2025-09-10

## Codex 0.33.0

Key change is https://github.com/openai/codex/pull/3430, which reverts https://github.com/openai/codex/pull/3179 because it introduced a regression.

New Features:
- Try out the new Markdown renderer on #3396.

## Merged PRs

- [#3394] alt+delete deletes the word to the right of the cursor (delete_forward_word) (#3394)
- [#3380] Introduce rollout items  (#3380)
- [#3395] Set a user agent suffix when used as a mcp server (#3395)
- [#3357] fix: remove unnecessary #[allow(dead_code)] annotation (#3357)
- [#3422] Move initial history to protocol (#3422)
- [#3400] Added images to `UserMessageEvent` (#3400)
- [#3356] fix: remove empty file: chatwidget_stream_tests.rs (#3356)
- [#2703] docs: fix codex exec heading typo (#2703)
- [#2858] Remove a broken link to prompting_guide.md in docs/getting-started.md (#2858)
- [#3427] Improved resiliency of two auth-related tests (#3427)
- [#3396] replace tui_markdown with a custom markdown renderer (#3396)
- [#3430] Back out "feat: POSIX unification and snapshot sessions (#3179)" (#3430)

## rust-v0.32.0 — 2025-09-10

### Codex 0.32.0

- MCP: add UA suffix when acting as a server; a few stability/compat tweaks
- OSS: Broader `apply_patch` OSS compatibility.
- Rollouts: initial groundwork and `rollout_path` included in responses.
- TUI: Alt+Delete deletes the next word.
- Protocol/Types: `ArchiveConversation` request; small exports and TS type improvements.
- CI/Build: faster tests with `nextest`, add `shear`; minor macOS permission adjustment.
- Docs: clarified shell quoting in config.

### Merged PRs

- [#3395] Set a user agent suffix when used as a mcp server
- [#3394] alt+delete deletes the word to the right of the cursor (delete_forward_word)
- [#3390] Do not send reasoning item IDs
- [#3388] Replace config.responses_originator_header_internal_override with CODEX_INTERNAL_ORIGINATOR_OVERRIDE_ENV_VAR
- [#3387] No fail fast
- [#3380] Introduce rollout items
- [#3374] tweak "failed to find expected lines" message in apply_patch
- [#3357] fix: remove unnecessary #[allow(dead_code)] annotation
- [#3353] feat: add ArchiveConversation to ClientRequest
- [#3352] fix: include rollout_path in NewConversationResponse
- [#3338] feat: Run cargo shear during CI
- [#3334] allow mach-lookup for com.apple.system.opendirectoryd.libinfo
- [#3323] chore: try switching to cargo nextest to speed up CI builds
- [#3222] fix: LoginChatGptCompleteNotification does not need to be listed explicitly in protocol-ts
- [#3270] feat(core): re-export InitialHistory from conversation_manager
- [#3219] Generate more typescript types and return conversation id with ConversationSummary
- [#3179] feat: POSIX unification and snapshot sessions
- [#3169] Improve explanation of how the shell handles quotes in config.md
- [#2811] Include apply_patch tool for oss models from gpt-oss providers with different naming convention (e.g. openai/gpt-oss-*)

## rust-v0.31.0 — 2025-09-08

### Codex 0.31.0

- https://github.com/openai/codex/pull/3182 added support for a `startup_timeout_ms` option when declaring an MCP server [(docs)](https://github.com/openai/codex/blob/main/docs/config.md#mcp_servers), which has been a highly requested feature, particularly for Windows users:
  - Issue: https://github.com/openai/codex/issues/3196
  - Issue: https://github.com/openai/codex/issues/2346
  - Issue: https://github.com/openai/codex/issues/2555
  - PR: https://github.com/openai/codex/pull/3249
  - PR: https://github.com/openai/codex/pull/3326
  - PR: https://github.com/openai/codex/pull/3006
  - and more...
- Thanks to @Bit-urd for adding more fault tolerance to MCP startup: https://github.com/openai/codex/pull/3243 
- #3211 fixes image pasting from Finder with `ctrl+v` on macOS

### Merged PRs

- [#3217] Added logic to cancel pending oauth login to free up localhost port
- [#3220] feat(tui): show minutes/hours in thinking timer
- [#3223] Added CLI version to `/status` output
- [#3176] [codex] respect overrides for model family configuration from toml file
- [#3226] chore: rewrite codex-rs/scripts/create_github_release.sh in Python
- [#3228] chore: change create_github_release to create a fresh clone in a temp directory
- [#3230] chore: use gh instead of git to do work to avoid overhead of a local clone
- [#3231] fix: change create_github_release to take either --publish-alpha or --publish-release
- [#3221] Move token usage/context information to session level
- [#3285] Clear non-empty prompts with ctrl + c
- [#3282] Use ConversationId instead of raw Uuids
- [#3300] docs: fix broken link to the "Memory with AGENTS.md" section in codex/README.md
- [#3182] feat(mcp): per-server startup timeout
- [#3294] chore(deps): bump insta from 1.43.1 to 1.43.2 in /codex-rs
- [#3295] chore(deps): bump tree-sitter from 0.25.8 to 0.25.9 in /codex-rs
- [#3296] chore(deps): bump clap from 4.5.45 to 4.5.47 in /codex-rs
- [#3297] chore(deps): bump image from 0.25.6 to 0.25.8 in /codex-rs
- [#3243] fix: improve MCP server initialization error handling #3196 #2346 #2555
- [#3211] tui: paste with ctrl+v checks file_list
- [#3316] chore: upgrade to actions/setup-node@v5
- [#3320] Add a getUserAgent MCP method
- [#3319] Highlight Proposed Command preview


## rust-v0.30.0 — 2025-09-05

### Codex 0.30.0
- **Breaking**: Stop loading project `.env` files automatically.
- **Security/behavior**: Never store requests; free port by canceling pending OAuth login.
- **Core/infra**: Introduce rollout policy; shared HTTP client; improved remaining context size; refined reasoning summary config/handling; corrected sandboxed shell tool description; improved server notification serialization.
- **TUI/UX**: Fix approval dialog for large commands; pause status timer during modals; pager auto‑scroll; bash syntax highlighting; mac key glyphs; avoid zero‑height panic; improved @ file search (hidden dirs).
- **DevEx/docs**: Recommended VS Code extensions; AGENTS.md prompt and clarifications; updated API key guidance; CI fixes.
- **Deps**: Bump `uuid` and `wiremock`.
- **Windows**: no more asking for approvals on Full Access mode

### Merged PRs
- [#3218] hide resume until it's complete
- [#3217] Added logic to cancel pending oauth login to free up localhost port
- [#3212] Never store requests
- [#3193] chore: improve serialization of ServerNotification
- [#3191] refactor: remove AttachImage tui event
- [#3190] Correctly calculate remaining context size
- [#3187] ZSH on UNIX system and better detection
- [#3185] MCP: add session resume + history listing;
- [#3184] [BREAKING] Stop loading project .env files
- [#3172] chore: add rust-lang.rust-analyzer and vadimcn.vscode-lldb to the list of recommended extensions
- [#3171] [codex] move configuration for reasoning summary format to model family config type
- [#3170] fix: fix serde_as annotation and verify with test
- [#3167] tui: pager pins scroll to bottom
- [#3163] fix: use a more efficient wire format for ExecCommandOutputDeltaEvent.chunk
- [#3146] fix: add callback to map before sending request to fix race condition
- [#3143] Use ⌥⇧⌃ glyphs for key hints on mac
- [#3142] syntax-highlight bash lines
- [#3138] [codex] improve handling of reasoning summary
- [#3135] TUI: Add session resume picker (--resume) and quick resume (--continue)
- [#3134] [tui] Update /mcp output
- [#3133] tui: avoid panic when active exec cell area is zero height
- [#3132] AGENTS.md: clarify test approvals for codex-rs
- [#3131] Pause status timer while modals are open
- [#3130] Fix failing CI
- [#3128] MCP sandbox call
- [#3127] Dividing UserMsgs into categories to send it back to the tui
- [#3123] Replay EventMsgs from Response Items when resuming a session with history.
- [#3122] prompt to read AGENTS.md files
- [#3121] remove bold the keyword from prompt
- [#3118] [codex] document `use_experimental_reasoning_summary` toml key config
- [#3117] Include originator in authentication URL parameters
- [#3116] Introduce Rollout Policy
- [#3112] Update guidance on API key permissions
- [#3110] Add a common way to create HTTP client
- [#3093] [mcp-server] Update read config interface
- [#3087] tui: fix approval dialog for large commands
- [#3069] core: correct sandboxed shell tool description (reads allowed anywhere)
- [#3056] chore: Clean up verbosity config
- [#2988] Auto-approve DangerFullAccess patches on non-sandboxed platforms
- [#2981] Improve @ file search: include specific hidden dirs such as .github, .gitlab
- [#2666] chore(deps): bump wiremock from 0.6.4 to 0.6.5 in /codex-rs
- [#2493] chore(deps): bump uuid from 1.17.0 to 1.18.0 in /codex-rs

## rust-v0.29.0 — 2025-09-03

### Codex 0.29.0
  - **Android/Termux support** by gating `arboard` on unsupported targets.
  - **Stable, cross‑platform file locking** using std `fs` APIs.
  - **Auth consolidation**: `CodexAuth` and `AuthManager` moved into the `core` crate.
  - **Rate‑limit handling restored** for API‑key usage.
  - **Core rollout refactor**: extract `rollout` module, add listing API, return file heads.
  - **Quality of life**: support `cd foo && ...` in `exec`/`apply_patch`, fix TUI flicker, prefer ratatui `Stylize`.
  - **Distribution**: include Windows ARM64 executable in the npm package.
  - **Switch to the latest search tool**.

### Merged PRs
- [#3086] Use the new search tool
- [#1634] core(rollout): extract rollout module, add listing API, and return file heads
- [#2895] Add Android/Termux support by gating arboard dependency
- [#2894] Add stable file locking using std::fs APIs
- [#3074] Move CodexAuth and AuthManager to the core crate
- [#3070] Add back rate‑limit error handling when using API key
- [#3083] Parse “cd foo && ...” for exec and apply_patch
- [#3068] Prefer ratatui Stylize for constructing lines/spans
- [#2918] TUI: fix occasional UI flicker
- [#3061] Show loading state when @ search results are pending
- [#2907] TUI: fix MCP docs hyperlink in empty_mcp_output
- [#3067] Include arm64 Windows executable in npm module
- [#2736] Unify history loading
- [#3071] Use experimental reasoning summary
- [#2461] Improve gpt‑oss compatibility
- [#2651] apply‑patch: fix lark grammar
- [#3089] Docs: update link to https://agents.md/
- [#3082] Docs: fix typo of config.md
- [#2667] Bump thiserror from 2.0.12 to 2.0.16 in codex‑rs

## rust-v0.28.0 — 2025-09-02

- [Highlights]
  - TUI polish and stability improvements: reduced typing lag, cleaner streamed message formatting, better error handling, and improved input behavior.
  - Better Windows ARM build reliability and faster release-time builds.
- [TUI/UX]
  - Fix laggy typing (#2922)
  - Rework message styling for clarity (#2877)
  - Remove extra blank lines in streamed agent messages (#3065)
  - Hide “/init” suggestion when `AGENTS.md` exists (#3038)
  - Ignore Enter on empty input to avoid queuing blank messages (#3047)
  - Catch `get_cursor_position` errors to avoid crashes (#2870)
  - Remove extra quote from disabled-command message (#3035)
- [Build & CI]
  - Leverage Windows 11 ARM for Windows ARM builds (#3062)
  - Install `zstd` on Windows 11 ARM image used for releases (#3066)
  - Populate Windows cache for release builds when PRs are opened (#2884)
- [Docs]
  - Fix config reference table (#3063)
  - Update PR template link after docs refactor (#2982)
- [Logging/Telemetry]
  - Add logs when users change the model (#3060)
- [Dependencies]
  - Bump `regex-lite` to 0.1.7 in `codex-rs` (#3010)
 
### PRs merged
- [#3066](https://github.com/openai/codex/pull/3066) fix: install zstd on the windows-11-arm image used to cut a release
- [#3065](https://github.com/openai/codex/pull/3065) tui: fix extra blank lines in streamed agent messages
- [#3063](https://github.com/openai/codex/pull/3063) fix config reference table
- [#3062](https://github.com/openai/codex/pull/3062) fix: leverage windows-11-arm for Windows ARM builds
- [#3060](https://github.com/openai/codex/pull/3060) Add logs to know when we users are changing the model
- [#3047](https://github.com/openai/codex/pull/3047) Bug fix: ignore Enter on empty input to avoid queuing blank messages
- [#3038](https://github.com/openai/codex/pull/3038) tui: hide '/init' suggestion when AGENTS.md exists
- [#3035](https://github.com/openai/codex/pull/3035) remove extra quote from disabled-command message
- [#3010](https://github.com/openai/codex/pull/3010) chore(deps): bump regex-lite from 0.1.6 to 0.1.7 in /codex-rs
- [#2982](https://github.com/openai/codex/pull/2982) Fix: Adapt pr template with correct link following doc refacto
- [#2922](https://github.com/openai/codex/pull/2922) tui: fix laggy typing
- [#2884](https://github.com/openai/codex/pull/2884) fix: try to populate the Windows cache for release builds when PRs are put up for review
- [#2877](https://github.com/openai/codex/pull/2877) rework message styling
- [#2870](https://github.com/openai/codex/pull/2870) tui: catch get_cursor_position errors

## rust-v0.27.0 — 2025-08-29

### Codex 0.27.0
  - **MCP stability**: drop mutexes earlier and avoid lock ordering pitfalls.
  - **Channel reliability**: switch to unbounded channel to prevent stalls.
  - **Performance/cleanup**: remove unnecessary flush() calls.
  - **CI**: fix release build; specify `--profile` for `cargo clippy`.
  - **Docs**: safer Homebrew snippet; suggest `just fix -p` in `AGENTS.md`.

### Merged PRs
- [#2881] Suggest just fix -p in agents.md
- [#2878] fix: drop Mutexes earlier in MCP server
- [#2876] fix: drop Mutex before calling tx_approve.send()
- [#2874] fix: switch to unbounded channel
- [#2873] fix: remove unnecessary flush() calls
- [#2871] fix: specify --profile to cargo clippy in CI
- [#2868] Bugfix: Prevents `brew install codex` in comment to be executed
- [#2864] Fix CI release build

## rust-v0.26.0 — 2025-08-29

## Highlights:

### New Features
- Custom `/prompts` loaded from `~/.codex/prompts` (#2696)
- New "View Image" tool to let Codex agentically view local images (#2723)
- MCP `GetConfig` endpoint to inspect resolved settings (#2725)

### TUI
- Fix image pasting in Windows + improve burst paste handling (#2683)
- Prevent slash commands during an active task (#2792)
- Fix cursor position when suspending (^Z) (#2690)
- Reduce doubled lines and hanging list markers (#2789)

### Docs & Templates
- Major README/docs refactor and navigation (#2724)
- CHANGELOG now points to Releases page (#2780)
- Add VS Code Extension issue template (#2853)


## Full list of merged PRs:

- #2864 Fix CI release build
- #2747 Bug fix: clone of incoming_tx can lead to deadlock
- #2852 Following up on #2371 post commit feedback
- #2696 Custom /prompts
- #2762 UI: Make slash commands bold in welcome message
- #2737 Changed OAuth success screen to use the string "Codex" rather than "Codex CLI"
- #2853 Add a VS Code Extension issue template
- #2683 burst paste edge cases
- #2746 Race condition in compact
- #2849 chore: print stderr from MCP server to test output using eprintln!
- #2848 chore: try to make it easier to debug the flakiness of test_shell_command_approval_triggers_elicitation
- #2845 chore: require uninlined_format_args from clippy
- #2792 disallow some slash commands while a task is running
- #2723 Add "View Image" tool
- #2690 fix cursor after suspend
- #2789 fix (most) doubled lines and hanging list markers
- #2780 Point the CHANGELOG to the releases page
- #2778 Added back codex-rs/config.md to link to new location
- #2724 README / docs refactor
- #2776 fix: for now, limit the number of deltas sent back to the UI
- #2725 [mcp-server] Add GetConfig endpoint

## rust-v0.25.0 — 2025-08-27

## Highlights:

### New Features
- Core: remove_conversation API for manual cleanup in long‑lived servers (#2613)
- TUI: mouse wheel alternate scrolling in transcript/diff views (#2686)
- TUI: Alt+Ctrl+H deletes the previous word (parity with Alt+Backspace) (#2717)
- Execution: include context window on task_started events; model may vary per turn (#2752)

### TUI
- Cache transcript line wraps to keep long transcripts responsive (#2739)
- Fix transcript lines appending to diff while a turn is running (#2721)
- Improve emoji rendering: proper spacing and ⌨️ emoji variant (#2735, #2728)
- ESC with queued messages returns them to the composer (#2687)
- Prevent crash when backspacing placeholders near multibyte text (#2674)

### Tools and execution
- Don’t send Exec deltas on apply_patch (#2742)
- Make git_diff_against_sha more robust (ignore custom drivers; handle dash‑prefixed files) (#2749)
- Reduce test load when running interactively (#2707)

### Misc
- Deduplicate assistant messages in history (#2758)
- Remove the Codex GitHub Action for now (#2729)


## Full list of merged PRs:

 - #2758 [fix] Deduplicate assistant messages
 - #2752 [feat] Send context window with task started (model may change per turn)
 - #2749 [fix] Make git_diff_against_sha more robust
 - #2739 [perf] Cache transcript wraps
 - #2707 [feat] Decrease testing when running interactively
 - #2742 [fix] Don’t send Exec deltas on apply patch
 - #2674 [fix] Crash when backspacing placeholders adjacent to multibyte text
 - #2735 [fix] Emoji spacing
 - #2721 [fix] Transcript lines added to diff view during running turn
 - #2717 [feat] Alt+Ctrl+H deletes backward word
 - #2687 [feat] Esc with queued messages returns them to composer
 - #2728 [tui] Render keyboard icon with emoji variation selector (⌨️)
 - #2613 [feat(core)] Add remove_conversation to ConversationManager
 - #2729 [chore] Remove GitHub Action that runs Codex
 - #2686 [feat] Enable alternate scroll in transcript mode



## rust-v0.24.0 — 2025-08-26

## Highlights:

### New Features
- Queued messages (#2637)
- Copy Paste / Drag & Drop image files (#2567)
- Transcript mode (Ctrl+T) with scrolling ability (#2525)
- Edit/resume conversation (esc-esc) from previous messages (#2607)
- Web search when using explicit --search option (#2371)


### TUI
- Hide CoT by default; show headers in status indicator (#2316)
- Show diff output in pager (+ with hunk headers) (#2568)
- Simplify command approval UI (#2708)
- Unify Esc/Ctrl+C interrupt handling (#2661)
- Fix windows powershell paste (#2544)

### Tools and execution
- Add support for long-running shell commands `exec_command`/`write_stdin` (#2574)
- Improve apply_patch reliability (#2646)
- Cap retry counts (#2701)
- Improve cache hit rate by sorting MCP tools deterministically (#2611)

### Misc
- Add model_verbosity config for GPT-5 (#2108)
- Read all AGENTS.md files up to git root (#2532)
- Fix git root resolution in worktrees (#2585)
- Improve error messages & handling (#2695, #2587, #2640, #2540)


## Full list of merged PRs:

 - #2708 [feat] Simplfy command approval UI
 - #2706 [chore] Tweak AGENTS.md so agent doesn't always have to test
 - #2701 Added caps on retry config settings
 - #2702 [fix] emoji padding
 - #2704 [feat] reduce bottom padding to 1 line
 - #2695 Improved user message for rate-limit errors
 - #2691 single control flow for both Esc and Ctrl+C
 - #2699 Fixed a bug that causes token refresh to not work in a seamless manner
 - #2587 do not show timeouts as "sandbox error"s
 - #2693 queued messages rendered italic
 - #2692 do not schedule frames for Tui::Draw events in backtrack
 - #2567 Copying / Dragging image files (MacOS Terminal + iTerm)
 - #2688 Add auth to send_user_turn
 - #2661 Fix esc
 - #2648 [exec] Clean up apply-patch tests
 - #2684 fix: use backslash as path separator on Windows
 - #2637 tui: queue messages
 - #2640 avoid error when /compact response has no token_usage (#2417)
 - #2678 Index file
 - #2665 chore(deps): bump toml_edit from 0.23.3 to 0.23.4 in /codex-rs
 - #2664 fix: Scope ExecSessionManager to Session instead of using global singleton
 - #2663 fix: build is broken on main; introduce ToolsConfigParams to help fix
 - #2611 Fix cache hit rate by making MCP tools order deterministic
 - #2649 fix: update gpt-5 stats
 - #2497 chore(deps): bump whoami from 1.6.0 to 1.6.1 in /codex-rs
 - #2646 feat: use the arg0 trick with apply_patch
 - #2643 [apply_patch] disable default freeform tool
 - #2633 test: faster test execution in codex-core
 - #2607 Resume conversation from an earlier point in history
 - #2371 Add web search tool
 - #2364 send-aggregated output
 - #2605 transcript hint
 - #2381 Add the ability to interrupt and provide feedback to the model
 - #2574 feat: StreamableShell with exec_command and write_stdin tools
 - #2575 fork conversation from a previous message
 - #2600 tui: fix resize on wezterm
 - #2590 tui: coalesce command output; show unabridged commands in transcript
 - #2592 tui: open transcript mode at the bottom
 - #2518 Fix typo in AGENTS.md
 - #2492 chore(deps): bump reqwest from 0.12.22 to 0.12.23 in /codex-rs
 - #2547 Fix flakiness in shell command approval test
 - #2498 chore(deps): bump serde_json from 1.0.142 to 1.0.143 in /codex-rs
 - #2595 Move models.rs to protocol
 - #2594 fix: prefer sending MCP structuredContent as the function call response, if available
 - #2586 test: simplify tests in config.rs
 - #2593 improve performance of 'cargo test -p codex-tui'
 - #2585 [config] Detect git worktrees for project trust
 - #2576 [apply_patch] freeform apply_patch tool
 - #2577 Add AuthManager and enhance GetAuthStatus command
 - #2544 Fix/tui windows multiline paste
 - #1695 ctrl+v image + @file accepts images
 - #2569 improve suspend behavior
 - #2108 feat(gpt5): add model_verbosity for GPT‑5 via Responses API
 - #2568 show diff output in the pager
 - #2539 [apply-patch] Clean up apply-patch tool definitions
 - #2571 [shell_tool] Small updates to ensure shell consistency
 - #2523 core: write explicit [projects] tables for trusted projects
 - #2533 tweak thresholds for shimmer on non-true-color terminals
 - #2564 Update README.md
 - #2562 tui: transcript mode updates live
 - #2536 refactor: move slash command handling into chatwidget
 - #2488 tui: show diff hunk headers to separate sections
 - #2532 read all AGENTS.md up to git root
 - #2535 scroll instead of clear on boot
 - #2540 Parse and expose stream errors
 - #2272 [prompt] xml-format EnvironmentContext
 - #2546 Add a serde tag to ParsedItem
 - #2496 Added new auth-related methods and events to mcp server
 - #2537 tui: show upgrade banner in history
 - #2538 show thinking in transcript
 - #2316 hide CoT by default; show headers in status indicator
 - #2525 add transcript mode
 - #2319 Bridge command generation to powershell when on Windows
 - #2534 fix: update build cache key in .github/workflows/codex.yml
 - #2516 tui: link docs when no MCP servers configured
 - #2528 Fix login for internal employees
 - #2524 refactor onboarding screen to a separate "app"
 - #2477 [apply-patch] Fix applypatch for heredocs
 - #2489 tui: switch to using tokio + EventStream for processing crossterm events
 - #2362 tui: tab-completing a command moves the cursor to the end
 - #2437 detect terminal and include in request headers
 - #2502 feat: copy tweaks

## rust-v0.23.0 — 2025-08-20

- Highlights
  - New commands and controls: support `/mcp` in TUI (#2430) and a slash command `/approvals` to control approvals (#2474).
  - Reasoning controls: change reasoning effort and model at runtime (#2435) `/model`; add “minimal” effort for GPT‑5 models (#2326).
  - Auth improvements: show login options when not signed in with ChatGPT (#2440) and auto‑refresh ChatGPT auth token (#2484).
  - UI/UX polish: Ghostty Ctrl‑b/Ctrl‑f fallback (#2427), Ctrl+H as backspace (#2412), cursor position tweak after tab completion (#2442), color/accessibility updates (#2401, #2421).
  - Distribution/infra: zip archived binaries added to releases (#2438) and DotSlash entry for Windows x86_64 (#2361); upgraded to Rust 1.89 (#2465, #2467).

- Full list of merged PRs
  - [#2352](https://github.com/openai/codex/pull/2352) tui: skip identical consecutive entries in local composer history
  - [#2355](https://github.com/openai/codex/pull/2355) fix: introduce codex-protocol crate
  - [#2326](https://github.com/openai/codex/pull/2326) Fix #2296 Add "minimal" reasoning effort for GPT 5 models
  - [#2357](https://github.com/openai/codex/pull/2357) Remove duplicated "Successfully logged in message"
  - [#2337](https://github.com/openai/codex/pull/2337) color the status letter in apply patch summary
  - [#2336](https://github.com/openai/codex/pull/2336) chore: remove duplicated lockfile
  - [#2361](https://github.com/openai/codex/pull/2361) fix: include an entry for windows-x86_64 in the generated DotSlash file
  - [#2245](https://github.com/openai/codex/pull/2245) Show progress indicator for /diff command
  - [#2314](https://github.com/openai/codex/pull/2314) replace /prompts with a rotating placeholder
  - [#2372](https://github.com/openai/codex/pull/2372) Added launch profile for attaching to a running codex CLI process
  - [#2373](https://github.com/openai/codex/pull/2373) Added MCP server command to enable authentication using ChatGPT
  - [#2388](https://github.com/openai/codex/pull/2388) fix: refactor login/src/server.rs so process_request() is a separate function
  - [#2365](https://github.com/openai/codex/pull/2365) fix: introduce EventMsg::TurnAborted
  - [#2360](https://github.com/openai/codex/pull/2360) remove mcp-server/src/mcp_protocol.rs and the code that depends on it
  - [#2401](https://github.com/openai/codex/pull/2401) fix: clean up styles & colors and define in styles.md
  - [#2411](https://github.com/openai/codex/pull/2411) chore(deps-dev): bump @types/node in /.github/actions/codex
  - [#2421](https://github.com/openai/codex/pull/2421) fix: stop using ANSI blue
  - [#2423](https://github.com/openai/codex/pull/2423) chore: move mcp-server/src/wire_format.rs to protocol/src/mcp_protocol.rs
  - [#2424](https://github.com/openai/codex/pull/2424) chore: add TS annotation to generated mcp-types
  - [#2428](https://github.com/openai/codex/pull/2428) consolidate reasoning enums into one
  - [#2431](https://github.com/openai/codex/pull/2431) Add an operation to override current task context
  - [#2425](https://github.com/openai/codex/pull/2425) protocol-ts
  - [#2432](https://github.com/openai/codex/pull/2432) Add cache tests for UserTurn
  - [#2412](https://github.com/openai/codex/pull/2412) Fix #2391 Add Ctrl+H as backspace keyboard shortcut
  - [#2405](https://github.com/openai/codex/pull/2405) chore(deps): bump anyhow in /codex-rs
  - [#2406](https://github.com/openai/codex/pull/2406) chore(deps): bump libc in /codex-rs
  - [#2389](https://github.com/openai/codex/pull/2389) chore: prefer returning Err to expect()
  - [#2393](https://github.com/openai/codex/pull/2393) fix: async-ify login flow
  - [#2404](https://github.com/openai/codex/pull/2404) chore(deps): bump clap in /codex-rs
  - [#2394](https://github.com/openai/codex/pull/2394) fix: change `shutdown_flag` from `Arc<AtomicBool>` to `tokio::sync::Notify`
  - [#2438](https://github.com/openai/codex/pull/2438) Release zip archived binaries
  - [#2395](https://github.com/openai/codex/pull/2395) fix: eliminate ServerOptions.login_timeout and use tokio::time::timeout()
  - [#2396](https://github.com/openai/codex/pull/2396) fix: make ShutdownHandle a private field of LoginServer
  - [#2398](https://github.com/openai/codex/pull/2398) fix: reduce references to Server in codex-login crate
  - [#2399](https://github.com/openai/codex/pull/2399) fix: remove shutdown_flag param to run_login_server()
  - [#2403](https://github.com/openai/codex/pull/2403) chore(deps): bump clap_complete in /codex-rs
  - [#2440](https://github.com/openai/codex/pull/2440) Show login options when not signed in with ChatGPT
  - [#2446](https://github.com/openai/codex/pull/2446) fix: exclude sysprompt etc from context left %
  - [#2430](https://github.com/openai/codex/pull/2430) [tui] Support /mcp command
  - [#2442](https://github.com/openai/codex/pull/2442) Fix #2429 Tweak the cursor position after tab completion
  - [#2457](https://github.com/openai/codex/pull/2457) fix: fix missing spacing in review decision response
  - [#2427](https://github.com/openai/codex/pull/2427) tui: support Ghostty Ctrl-b/Ctrl-f fallback
  - [#2407](https://github.com/openai/codex/pull/2407) chore(deps): bump actions/checkout from 4 to 5
  - [#2435](https://github.com/openai/codex/pull/2435) Support changing reasoning effort
  - [#2462](https://github.com/openai/codex/pull/2462) feat: move session ID bullet in /status
  - [#2464](https://github.com/openai/codex/pull/2464) docs: document writable_roots for sandbox_workspace_write
  - [#2466](https://github.com/openai/codex/pull/2466) fix: prefer `cargo check` to `cargo build` to save time and space
  - [#2465](https://github.com/openai/codex/pull/2465) chore: upgrade to Rust 1.89
  - [#2467](https://github.com/openai/codex/pull/2467) chore: Rust 1.89 promoted file locking to stdlib
  - [#2468](https://github.com/openai/codex/pull/2468) fix apply patch when only one file is rendered
  - [#2475](https://github.com/openai/codex/pull/2475) Fix: Sign in appear even if using other providers.
  - [#2460](https://github.com/openai/codex/pull/2460) Enable Dependabot updates for Rust toolchain
  - [#2476](https://github.com/openai/codex/pull/2476) Diff command
  - [#2487](https://github.com/openai/codex/pull/2487) Client headers
  - [#2484](https://github.com/openai/codex/pull/2484) Refresh ChatGPT auth token
  - [#2495](https://github.com/openai/codex/pull/2495) fix: prefer config var to env var
  - [#2474](https://github.com/openai/codex/pull/2474) Add a slash command to control permissions

## rust-v0.22.0 — 2025-08-15

- https://github.com/openai/codex/pull/2294 moves the login server from Python to Rust, which should help with both https://github.com/openai/codex/issues/2000 and https://github.com/openai/codex/issues/2044.
- https://github.com/openai/codex/pull/2029 adds support for markdown streaming
- https://github.com/openai/codex/pull/2270 improves the UI treatment of diffs so they are more readable when using a light background
- https://github.com/openai/codex/pull/2113 `ctrl-z` can be used to suspend the TUI

## rust-v0.21.0 — 2025-08-12

Fixes abound!

- https://github.com/openai/codex/pull/2200 send prompt cache key for better caching (should improve token efficiency!)
- https://github.com/openai/codex/pull/2202 split multiline commands to improve readability
- https://github.com/openai/codex/pull/2095 Parse exec commands and format them more nicely in the UI
- https://github.com/openai/codex/pull/2186 recognize `applypatch` command as `apply_patch` command string
- https://github.com/openai/codex/pull/2183 Include output truncation message in tool call results to tell the model when it did not get the full output from a command that it might have expected
- https://github.com/openai/codex/pull/2162 show feedback message after `/compact` command, fixing an issue when no deltas were sent
- https://github.com/openai/codex/pull/2050 show diff preview for `apply_patch`
- https://github.com/openai/codex/pull/1975 add JSON schema sanitization for MCP tools to ensure compatibility with internal JsonSchema enum external contributor: Thanks @yaroslavyaroslav!


## rust-v0.20.0 — 2025-08-09

Some key fixes for Windows:

- https://github.com/openai/codex/pull/2035 the `npm` release of `@openai/codex` now runs the Rust CLI instead of falling back to the old TypeScript CLI (TypeScript code was removed from the repo in https://github.com/openai/codex/pull/2048)
- https://github.com/openai/codex/pull/2019 fixes two things for Windows:
  - fixes one class of issues with login logic by writing Python program to a temp file instead of long string arg (FYI, we are planning to replace the Python with Rust: https://github.com/openai/codex/pull/2047)
  - ignores `PopKeyboardEnhancementFlags` failure since not all Windows terminals support it
- https://github.com/openai/codex/pull/2042 should help/fix the Python certificates issue with `codex login`: https://github.com/openai/codex/issues/2044

## rust-v0.19.0 — 2025-08-08



## rust-v0.16.0 — 2025-08-07

- Small fix for an error message around capacity: https://github.com/openai/codex/pull/1947
- Though the more significant upgrade today is to 0.15.0: https://github.com/openai/codex/releases/rust-v0.15.0

## rust-v0.15.0 — 2025-08-07

* `gpt-5` is the default model!
* new `--ask-for-approval on-request` option where the model decides whether to prompt the user (which is somewhat of a balance between the existing `on-failure` and `never`) options
* new onboarding flow that uses `--sandbox workspace-write and --ask-for-approval on-request` as the configuration when users mark a folder is trusted (recommended default when working in a Git repo)

## rust-v0.14.0 — 2025-08-06

* Removed some internal messaging from the conversation view: https://github.com/openai/codex/pull/1868, https://github.com/openai/codex/pull/1866
* Fixed issue where `codex exec` was printing `InternalAgentDied `: https://github.com/openai/codex/pull/1864

## rust-v0.13.0 — 2025-08-05

Introduces the `--oss` flag so Codex CLI can be used with the new open-weight models from OpenAI. See:

- https://github.com/openai/gpt-oss
- https://github.com/openai/codex/pull/1848

## rust-v0.12.0 — 2025-08-05

- Includes https://github.com/openai/codex/pull/1826 to fix a regression introduced in 0.11.0: https://github.com/openai/codex/issues/1796.

## rust-v0.11.0 — 2025-08-02

**Big News!!!** This release introduces a new UX where Codex is no longer fullscreen / manages its own scrollback, but "appends to the end" and uses the terminal's native scrolling.

This fixes some longstanding pain points:

- https://github.com/openai/codex/issues/1247 copy/paste works now
- https://github.com/openai/codex/issues/1502 use the terminal's native scrolling

But wait, there's more!

- https://github.com/openai/codex/pull/1527 adds support for the `/compact` command
- https://github.com/openai/codex/pull/1726 introduces an experimental planning tool
- https://github.com/openai/codex/pull/1705 security fix to ensure `apply_patch` is run through the sandbox for the session
- https://github.com/openai/codex/pull/1764 CLI now checks for new versions and lets you know if you are out of date

## rust-v0.10.0 — 2025-07-24

* More commands are "trusted" by default: https://github.com/openai/codex/pull/1668
* Thanks to @pbezglasny for fixing a UI inconsistency in the TUI header: https://github.com/openai/codex/pull/1675
* We now record some Git state in the `.jsonl` log due to @vishnu-oai https://github.com/openai/codex/pull/1598

## rust-v0.9.0 — 2025-07-23

- Numerous fixes to `codex mcp`.
- https://github.com/openai/codex/pull/1626 to ensure shell commands spawned by Codex get `SIGTERM` when `codex` is killed (Linux only)
- Do not auto-approve certain flags for ripgrep/`rg` https://github.com/openai/codex/pull/1644

## rust-v0.8.0 — 2025-07-19

- As of https://github.com/openai/codex/pull/1594, we now stream the response from the model in the TUI and when using `codex exec`
- https://github.com/openai/codex/pull/1589 changes `ctrl-d` so it only exits the TUI if the composer is empty (it will still exit the TUI if the composer is hidden because the Codex agent is thinking)
- As a heads up, https://github.com/openai/codex/pull/1596 changes the organization of the `~/.codex/sessions` folder so it has `YYYY/MM/DD` subfolders. This should make it easier to find recent sessions and avoid degrading filesystem performance because previously `~/.codex/sessions` could end up with an unbounded number of entries
- https://github.com/openai/codex/pull/1571 fixes a longstanding issue where we failed to handle long MCP tool names gracefully (https://github.com/openai/codex/issues/1289 was the relevant GitHub issue)
- https://github.com/openai/codex/pull/1603 introduced a `--json` flag to `codex exec` so that it prints output as JSONL to stdout
- https://github.com/openai/codex/pull/1590 tries to ensure that when the Codex CLI is launched via the Node.js script in the `npm` version that both the Codex CLI process and Node.js process exit together, though from the additional details on https://github.com/openai/codex/issues/1570, it seems like it is not sufficient to fix that specific problem.
- Though https://github.com/openai/codex/pull/1590 should make it so that, on Windows, the `npm` version will fall back to the TypeScript version (for now) rather than just crashing, fixing https://github.com/openai/codex/issues/1573.

## rust-v0.7.0 — 2025-07-14

Need to publish a new version on npm. See https://github.com/openai/codex/pull/1568 for details.

## rust-v0.6.0 — 2025-07-12

* `id` for notifications associated with a `codex` tool call now match the request id: https://github.com/openai/codex/pull/1554
* Paste summarization for large pastes: https://github.com/openai/codex/pull/1549
* Experimental `codex apply` command to interact with Codex Web: https://github.com/openai/codex/pull/1528

## rust-v0.5.0 — 2025-07-10

* Added new config option: `model_supports_reasoning_summaries`: https://github.com/openai/codex/pull/1524
* Thanks to @reneleonhardt for helping update a number of our dependencies (we now build with Rust 1.88!): https://github.com/openai/codex/pull/1494
* Removed reference to `/compact` in https://github.com/openai/codex/pull/1503 because it is not supported yet: https://github.com/openai/codex/issues/1257
* Thanks to @pchuri so that when running Codex installed via `npm`, `process.platform === "android"` will run the Rust CLI: https://github.com/openai/codex/pull/1488
* Fix generated shell completions to use the name `codex` instead of `codex-cli`: https://github.com/openai/codex/pull/1496

## rust-v0.4.0 — 2025-07-09

* Honor the `OPENAI_BASE_URL ` environment variable for the built-in `openai` model provider: https://github.com/openai/codex/pull/1487
* Support `model_reasoning_effort` and `model_reasoning_summary` when defining a profile thanks to https://github.com/openai/codex/pull/1484
* Add a `completion` subcommand to the CLI in https://github.com/openai/codex/pull/1491 so we can ultimately add `generate_completions_from_executable()` to our Homebrew formula: https://github.com/Homebrew/homebrew-core/blob/main/Formula/c/codex.rb

## rust-v0.3.0 — 2025-07-08

This addresses a number of important issues reported in 0.2.0:

- Fixes an issue where non-ASCII characters were crashing the CLI: https://github.com/openai/codex/issues/1450 (huge thanks to @ryozi-tn for the fix in https://github.com/openai/codex/pull/1467)
- Adds support for a `--sandbox` flag and makes some breaking changes to `config.toml` around this option. See https://github.com/openai/codex/pull/1476 for details.
- Makes it possible to configure custom HTTP headers when making requests to model providers: https://github.com/openai/codex/pull/1473.

## rust-v0.2.0 — 2025-06-30



