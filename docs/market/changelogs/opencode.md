## v1.18.32 — 2026-09-21

## Core

### Bugfixes

- Fixed Bedrock image attachments so they are only hoisted for Claude, Nova, and Llama 4 models.
- Fixed Together AI streaming usage reporting.

**Thank you to 1 community contributor:**
- @dc85:
  - docs: add DeepSeek V4.1 Flash to Zen (#49897)
  - feat: add Grok 4.7 to Zen and Go (#50288)


## v1.18.31 — 2026-09-14

## Core

### Bugfixes

- Restored ACP session model, effort, mode, and reasoning chunk boundaries when loading, resuming, or forking sessions. (@JacobNWolf)

## TUI

### Bugfixes

- Show remote config authentication errors during startup and exit with a failure status.

## Extensions

### Improvements

- Request summarized adaptive thinking for GitHub Copilot models.

**Thank you to 4 community contributors:**
- @heimoshuiyu:
  - feat(console): add batch workspace block endpoints (#48491)
- @JacobNWolf:
  - fix(acp): restore session options and reasoning boundaries (#48225)
- @R-Taneja:
  - chore(deps): bump @ai-sdk/gateway to 3.0.191 (#48710)
- @MatthewFeroz:
  - fix(ui): add Merge Gateway logo (#42015)


## v1.18.30 — 2026-09-09

## Core
### Improvements
- Added the Astra system prompt for GPT-6 models.

### Bugfixes
- Preserved Bedrock DeepSeek model IDs, including ARN-based IDs, so they resolve correctly. (@YeEmrick)
- Updated the Azure provider SDK to pick up compatibility fixes.
- Updated the OpenAI provider SDK to pick up compatibility fixes.
- Added reasoning effort variants for supported GitLab GPT and Claude models. (@far-ouq)

**Thank you to 3 community contributors:**
- @heimoshuiyu:
  - fix(console): openai usage normalization and tier threshold config (#47342)
- @far-ouq:
  - fix(opencode): add GitLab reasoning variants (#47306)
- @YeEmrick:
  - fix: preserve Bedrock DeepSeek model ids (#34441)


## v1.18.29 — 2026-09-04

## Core

### Bugfixes

- Allow Codex OAuth model filtering to recognize integer GPT versions like `gpt-6`
- Fixes issue of gpt-6-astra not showing up for openai subscription users

**Thank you to 2 community contributors:**
- @Peter267:
  - docs(zh): fix bold rendering by adding spaces around asterisks (#46231)
- @heimoshuiyu:
  - feat(console): add quota reset support action (#47313)


## v1.18.28 — 2026-09-04

## Core

### Improvements

- Send the session ID as GitHub Copilot's interaction header to improve request tracking across a session.

## Desktop

### Bugfixes

- Use the desktop client ID during OpenCode account device authentication.
- Increase the open-in app icon size for better visibility.

**Thank you to 1 community contributor:**
- @MVS-source:
  - docs: add Eden AI to the providers list (#43386)


## v1.18.27 — 2026-09-02

## Core

### Bugfixes

- Default provider header timeouts to five minutes so slow model startups fail less often.
- Default streamed chunk timeouts to five minutes, with `false` supported to disable them.
- Let Anthropic `thinking.blockBinding` opt out via config when you need to keep the provider default. (@dkindlund)
- Limit Anthropic thinking block binding to Claude 5.1+ models so older deployments do not reject requests.
- Avoid unhandled errors when canceling timed-out SSE reads. (@AlexanderWillner)

**Thank you to 2 community contributors:**
- @AlexanderWillner:
  - fix(provider): handle SSE reader cancel rejections (#44944)
- @dkindlund:
  - fix(opencode): let config opt out of Anthropic thinking blockBinding (#46820)


## v1.18.26 — 2026-09-01

## Core

### Bugfixes

- Claude 5 sessions now tolerate stale thinking blocks instead of failing after prompt or tool changes.
- Bedrock GPT-5.6 models now accept `none` reasoning effort.
- Bedrock reasoning and replay handling is more reliable. (@pengzh1)
- Tool call timing now stays accurate when tools update their metadata while still running. (@bartlettroscoe)
- `apply_patch` no longer emits an empty move path in permission metadata. (@altendky)

### Improvements

- Azure CLI sign-in now asks for the resource name directly instead of querying Azure management APIs.

## Desktop

### Bugfixes

- Session renames now save reliably from the title editor and tab context menu.

**Thank you to 3 community contributors:**
- @altendky:
  - fix(opencode): omit empty apply patch move path (#45329)
- @pengzh1:
  - fix(core): bump @ai-sdk/amazon-bedrock to 4.0.166 for reasoning and replay fixes (#45520)
- @bartlettroscoe:
  - fix(core): Fix for incorrect time.start reset in tool call logging (#32574) (#32596)


## v1.18.25 — 2026-08-28

## Core
### Bugfixes
- Fixed Azure authentication so Azure CLI sign-in works without requiring Bun.


## v1.18.24 — 2026-08-28

## Core

### Bugfixes

- Bedrock reasoning responses no longer get cached into unreplayable empty messages.

### Improvements

- Azure providers can now sign in with Microsoft Entra ID through the Azure CLI instead of requiring an API key.
- V1 now reads supported V2 config fields so newer config files keep working in more mixed setups.

## Desktop

### Bugfixes

- Archived sessions disappear from the Home list immediately. (@NathanTCode)

**Thank you to 3 community contributors:**
- @NathanTCode:
  - fix(app): drop archived sessions from home list right away (#44905)
- @OpeOginni:
  - fix(ui): restore focus in stacked dialogs (#44928)
- @dondetir:
  - docs: mention Exa and Parallel as web search backends (#38395)


## v1.18.23 — 2026-08-25

## Core

### Bugfixes

- Fixed Cloudflare AI Gateway routing for third-party providers so non-Workers models work through the gateway's REST API. (@superhighfives)
- Fixed Anthropic models through Cloudflare AI Gateway by converting dotted model IDs like `claude-haiku-4.5` to the dashed slug Anthropic expects. (@superhighfives)
- Fixed parent session IDs being sent in request headers for session-aware providers.

## TUI

### Bugfixes

- Fixed GitHub auth for immutable OIDC subject tokens.

**Thank you to 1 community contributor:**
- @superhighfives:
  - fix(provider): send Anthropic's dashed native slug through the AI Gateway (#44281)
  - fix(provider): route non-native Cloudflare AI Gateway providers via the REST API (#44828)


## v1.18.22 — 2026-08-24

## Core

### Bugfixes

- Removed outdated OpenCode Go first-month discount messaging and pricing.
- Fixed OpenCode device login links when servers return relative verification URLs or use a base path.
- Fixed `textVerbosity` being sent to OpenAI-compatible providers that do not support it. (@joelstucki-taulia)
- Updated the Amazon Bedrock provider for compatibility fixes.

## Desktop

### Bugfixes

- Keep model provider headers visible while scrolling the model picker.

**Thank you to 1 community contributor:**
- @joelstucki-taulia:
  - fix(provider): guard textVerbosity injection for @ai-sdk/openai-compatible providers (#43915)


## v1.18.21 — 2026-08-21

## Core

### Bugfixes

- Continue responses when a model reports an unknown finish reason instead of stopping early
- Route Vertex AI `eu` and `us` multi-region Gemini requests through REP endpoints

## Desktop

### Bugfixes

- Keep file search results visible while the next search is loading
- Register the archive session command in both desktop layouts (@NathanTCode)

**Thank you to 1 community contributor:**
- @NathanTCode:
  - fix(app): register archive session command in both layouts (#41741)


## v1.18.20 — 2026-08-21

## Core
### Bugfixes
- Surface failed subagent tool calls with a resumable `task_id`.
- Retry provider responses that end with `finish_reason: network_error`.
- Retry more network error variants, including `network-error` and `network_error`.
- Surface resumable subagent failures instead of returning an empty result.
- Preserve Cerebras `max_completion_tokens` without applying an extra output cap.
- Answer permission requests triggered by subagents during `opencode run`.
- Retry xAI capacity and temporary unavailability stream errors.


## v1.18.19 — 2026-08-20

## Core

### Improvements

- Added native OpenAI and Anthropic passthroughs for Cloudflare AI Gateway models.
- Matched Codex rate limits more closely to ChatGPT subscription limits. (@GameOn223)

### Bugfixes

- Removed built-in Qwen sampling defaults that could send unsupported settings.
- Properly show authenticated providers in `/connect`. (@OpeOginni)
- Ignore malformed model pricing instead of breaking usage cost calculation.
- Fall back when OpenAI websocket requests exceed message size limits.
- Forward ChatGPT workspace compute residency to Codex requests.
- Updated the default Console URL used by account connection flows.
- Enabled web search when using the OpenCode Go provider.
- Preserved compatibility with existing v1 databases.

## Desktop

### Bugfixes

- Kept saved server details editable in the server dialog.

**Thank you to 4 community contributors:**
- @TechyAditya:
  - fix(skills): Update global config path in documentation (#42337)
- @GameOn223:
  - tweak: match codex limits for openai models exactly when using chatgpt subscription (#39082)
- @OpeOginni:
  - fix(opencode): properly show authed providers on /connect command (#39915)
- @bhuvan2134686:
  - docs: add SCX.ai to the providers list (#42520)


## v1.18.18 — 2026-08-13

## Core
### Bugfixes
- Select the Kimi system prompt correctly for official Moonshot and Kimi providers
- Fix xhigh reasoning effort for xai models


## v1.18.17 — 2026-08-12

## Core

### Bugfixes

- Made session compaction keep complete recent turns and produce clearer summaries for smaller models.
- Added MERGE Gateway reasoning variants so those model options work correctly. (@MatthewFeroz)
- Capped automatic session retries and added jitter to reduce repeated retry storms.
- Enabled PDF attachments for GitHub Copilot models that advertise PDF vision support. (@stevenao)
- Applied the correct sampling defaults to DeepSeek V4 Flash on supported providers.
- Routed all Muse family models to the correct Meta system prompt. (@mreso)

## Desktop

### Bugfixes

- Updated Chinese developer terminology to use more widely recognized translations.
- Used the server's current default model instead of stale local config when choosing the default model.

**Thank you to 6 community contributors:**
- @mreso:
  - fix(session): route all Muse family models to the Meta system prompt (#41581)
- @OpeOginni:
  - fix(ui): correct OC-2 weak icon color (#41504)
- @peculiarnewbie:
  - feat(console): add go usage endpoint (#16513)
- @stevenao:
  - fix(opencode): detect Copilot PDF input support (#41522)
- @MatthewFeroz:
  - fix(provider): add Merge Gateway reasoning variants (#41867)
- @skyzhao1223:
  - docs: fix broken DigitalOcean and Daytona links (#42048)
  - docs: fix provider display name and PAT typos (#42034)


## v1.18.16 — 2026-08-10

## Core

### Bugfixes

- Ignore unknown top-level config fields instead of failing config parsing
- Register projects opened from Home so they are available to the rest of the app

## Desktop

### Improvements

- Open the project menu with a right-click in Home

### Bugfixes

- Fall back to listing and matching local directories when the project picker server does not support search
- Use 词元 instead of 令牌 for token-related labels in Simplified Chinese (@Speechlessmanbilibili)
- Keep the macOS app running after the last window closes and reopen a window when the app is activated

**Thank you to 1 community contributor:**
- @Speechlessmanbilibili:
  - fix(i18n): use 词元 instead of 令牌 for token in zh locale (#40977)


## v1.18.15 — 2026-08-07

## Core

### Bugfixes

- Chronological message ordering now stays correct even when imported or legacy message IDs are out of order.
- Revert and fork actions now use real message chronology instead of message ID ordering.
- Truncation cleanup now removes stale files by file timestamp more reliably.
- Repeated compaction now keeps earlier tool-call history in summaries instead of dropping orphaned results.
- Blob-based attachments now load correctly in the web UI. (@rexdotsh)

## Desktop

### Improvements

- Added much broader locale coverage across the desktop app.
- Export full session transcripts as JSON from the UI.

### Bugfixes

- Session timelines now respect chronological message boundaries more reliably.
- Stored messages now stay ordered by creation time.
- Session lists now sort by persisted activity time more reliably.
- Language names now stay native in the locale picker.
- Filled in missing translations across existing locales.

**Thank you to 3 community contributors:**
- @rexdotsh:
  - fix(server): allow blob attachments in web UI (#40692)
- @ayubun:
  - fix(tui): support copying over ssh with `set-clipboard on` tmux config (#30472)
- @dangooddd:
  - feat(tui): add cursor style configuration (#32295)


## v1.18.14 — 2026-08-05

## Core

### Improvements

- Simplified xAI login to a single device-code flow that works better in headless and remote environments.

### Bugfixes

- Preserved structured mid-stream provider errors so compatible providers can retry failed responses.
- Retried more transient provider and network errors instead of failing immediately.
- Counted cache writes in ACP usage totals.
- Logged remote workspace 5xx response bodies in the host logs to make proxy failures easier to debug. (@jamesmurdza)
- Stopped sending the host `directory` path to remote workspaces so prompts resolve from the remote project root. (@jamesmurdza)
- Waited for queued ACP session updates before ending a turn.

**Thank you to 1 community contributor:**
- @jamesmurdza:
  - fix(server): don't forward host directory to remote workspace (#40136)
  - fix(server): log upstream 5xx bodies from proxied workspace requests (#40135)


## v1.18.13 — 2026-08-04

## TUI
### Bugfixes
- GitHub pull request reviews now include the pull request number and URL in context.

## Desktop
### Bugfixes
- Fixed several right-to-left layout issues across tabs, drawers, resizing, and titlebar interactions.
- Fixed shared right-to-left UI behavior such as directional icons and drawer placement.
- Sessions without titles now fall back to generated names instead of appearing blank.
- Moved markdown parsing off the main thread to keep the app more responsive while rendering messages.

### Improvements
- Localized more desktop UI copy, including native menus, update dialogs, and help content.
- Added early right-to-left layout support across the app and session views.
- Added locale-aware plural rules so translated counts and summaries read correctly.
- Expanded translation coverage and added more supported desktop languages.

**Thank you to 1 community contributor:**
- @amypoolside:
  - docs: add Poolside provider setup (#39187)


## v1.18.12 — 2026-08-04

## Core
### Bugfixes
- Fixed Azure GPT-5.5+ completion requests failing when reasoning is enabled. (@frederiknsgo)

## Desktop
### Bugfixes
- Reduced composer lag when drafts include large pasted images or attachments.
- Let project search match any known recent project instead of only the first five. (@NumerousJLs)
- Cleared stale assistant errors from the timeline once the same turn resumes streaming.
- Skipped legacy config reads against v2 servers to avoid spurious config loading issues. (@resetsix)

**Thank you to 4 community contributors:**
- @resetsix:
  - fix(app): skip legacy config reads for v2 (#40211)
- @NumerousJLs:
  - fix(app): search every known project in the open project dialog (#40202)
- @MagnumGoYB:
  - docs: remove obsolete vouch system section (#40266)
- @frederiknsgo:
  - fix: gpt-5.5+ in combination with azure fails with reasoningEffort (#40265)


## v1.18.11 — 2026-08-01

## Core

### Bugfixes

- Stopped MCP SSE connections from getting stuck in reconnect loops after server error responses.
- Fixed provider model configs that use interleaved reasoning fields like `reasoning_text` or custom field names.

## Desktop

### Bugfixes

- Open external links in the system browser instead of inside the app.
- Fixed stale session tab state in the desktop title bar. (@OpeOginni)
- Open the legacy directory picker at your home folder when no home path is loaded yet.
- Prevent the file tree tab from clipping when resized smaller. (@OpeOginni)
- Fixed debug gutter labels and values misaligning.

**Thank you to 2 community contributors:**
- @devennavani:
  - docs: add Modal provider setup (#39710)
- @OpeOginni:
  - fix(app): prevent file tree tab clipping (#39770)
  - fix(app): prevent stale session tab reads (#39767)
  - fix(app): prevent stale prompt control reads (#39842)


## v1.18.10 — 2026-07-30

## Core
- Discover available Modal models automatically. (@devennavani)

## Desktop
### Improvements
- Prevent adding the same attachment more than once.
- Always show the new session button.
- Improve toast notifications with better stacking, dismissal, and mobile layout.
- Refine tab hover, active, and overflow states.

### Bugfixes
- Repair malformed saved tabs so broken tab state no longer persists across launches. (@OpeOginni)
- Hide the model variant selector until model data finishes loading.
- Preserve the custom agent picker for existing users.

**Thank you to 3 community contributors:**
- @lakshyaag-tavily:
  - docs(ecosystem): add opencode-tavily plugin (#38709)
- @devennavani:
  - feat: discover Modal models (#39066)
- @OpeOginni:
  - fix(app): repair malformed persisted tabs (#39645)


## v1.18.9 — 2026-07-28

## Core
### Bugfixes
- Restored compatibility with legacy MCP SDK clients.

## Desktop
### Bugfixes
- Fixed a Solid cleanup crash that could break navigation in the desktop app.
- Fixed home session loading so the session list can update without suspending the whole page.

### Improvements
- Removed the extra vertical borders from the V2 home projects view.
- Added an opt-in V2 desktop sidecar backed by the bundled CLI service.
- Added collapsible model provider sections in V2 settings.

**Thank you to 1 community contributor:**
- @roborew:
  - fix(desktop): patch @dnd-kit/solid to preserve core scroll plugins (#38119)


## v1.18.8 — 2026-07-28

## Core

### Improvements

- Improved compatibility with newer MCP servers and OAuth flows.

### Bugfixes

- Reconnects MCP servers after expired SDK sessions, including concurrent requests.
- Honors configured MCP OAuth callback ports in `mcp debug`.
- Stops sending deprecated sampling defaults to newer Gemini models.

## Desktop

### Improvements

- Added a shortcut to open the project selector in new sessions.

### Bugfixes

- Tab keyboard navigation now follows the visible tab order.
- Opening files now expands Windows folders with trailing separators.
- Server status uses blue when an integration needs attention.
- Provider connection state now refreshes immediately after changes.
- Linux packages now install AppStream metadata. (@develop7)
- Local desktop runs now use the channel database.
- Prevents freezes when closing projects from the home view.
- Prevents the right panel from freezing the session view while loading.

**Thank you to 2 community contributors:**
- @OpeOginni:
  - fix(core): correct MCP environment field in built-in skill (#39175)
- @develop7:
  - fix(desktop): install AppStream metainfo in Linux packages (#36872)


## v1.18.7 — 2026-07-27

## Desktop
### Bugfixes
- Remove the extra titlebar inset in fullscreen on macOS.
- Keep command palette entries from reappearing incorrectly when shadowed commands are removed.
- Add scrolling to the project selector dropdown when the list is long. (@david1gp)

**Thank you to 2 community contributors:**
- @ProdigyRahul:
  - fix(ui): keep mutable selects open (#39027)
- @david1gp:
  - fix(app): add scroll to project selector dropdown (#39016)


## v1.18.6 — 2026-07-27

## Core
### Bugfixes
- Fixed branch-specific repository caches so refreshing one reference no longer moves another branch checkout.

## Desktop
### Improvements
- Improved compatibility with the newer client API across directory, project, session, and terminal flows.

### Bugfixes
- Fixed legacy MCP state refreshing when opening a V1 workspace.
- Fixed provider lists not refreshing after connecting a provider or finishing provider OAuth on V1 servers.


## v1.18.5 — 2026-07-24

## Core
### Bugfixes
- Improve Claude adaptive thinking handling across more response shapes.
- Avoid OpenAI Responses phase handling that could break some conversations.
- Preserve grep symlink paths in search results. (@remixz)
- Preserve Mistral reasoning history across turns.
- Stabilize Mistral prompt caching.
- Use the correct prompt cache keys for each SDK.
- Fix MiniMax M3 thinking variant selection.

## Desktop
### Improvements
- Support the current server terminal transport.
- Support current-server review data in the desktop app.
- Update server discovery flows for current servers.
- Support current-server session actions, including prompts and commands.
- Render current-server session timelines.
- Stream current-server events in the desktop app.
- Detect legacy and current servers so the desktop app can work with both.

### Bugfixes
- Restore optimistic timeline updates while responses are still streaming.
- Hide legacy-only features when connected to current servers.
- Preserve inline file mentions when sending prompts to legacy servers.
- Stop auto-accepting config permissions on current servers.
- Keep current servers out of the legacy layout.
- Show plain file contents in file-specific tabs instead of review diffs.
- Keep the prompt input agent toggle in sync.
- Keep paginated session timelines in the right order.
- Restore directory-scoped session status for legacy servers.
- Reload legacy session progress after hydration.

**Thank you to 2 community contributors:**
- @dleopold:
  - fix(app): classify existing web profiles for layout transition (#38117)
- @remixz:
  - fix(opencode): preserve grep symlink paths (#38581)


## v1.18.4 — 2026-07-20

## Core

### Improvements

- Use adaptive thinking controls for Kimi models on Anthropic-compatible providers, with summarized reasoning output by default. (@chouqin)

### Bugfixes

- Reduce OpenAI provider header timeouts during slow connection setup.
- Respect provider-defined reasoning options instead of falling back to the wrong reasoning controls.
- Restore Azure Cognitive Services endpoint support for Azure-hosted models.

## Desktop

### Improvements

- Sync the embedded terminal theme with the app theme.
- Improve the review panel so open file tabs can stay aligned with the current diff view.
- Rewrite the v2 prompt input for more reliable command, context, shell, attachment, and history interactions.
- Improve review panel resizing and sticky controls.

### Bugfixes

- Preserve command drafts in the command menu.
- Avoid session view failures when message parent links are missing.
- Prevent sending empty prompt text parts.
- Restore model variant selection accessibility.
- Show keybind tooltips on prompt input controls. (@ProdigyRahul)
- Deduplicate repeated file entries in diff summaries.
- Prevent recovery window handling from touching destroyed windows.

**Thank you to 3 community contributors:**
- @jerome-benoit:
  - fix(nix): relax Bun version check for desktop build (#36767)
  - fix(nix): restore desktop integration (#37197)
- @ProdigyRahul:
  - fix(app): show keybind tooltips on prompt input controls (#37824)
- @chouqin:
  - feat(opencode): use adaptive thinking effort for kimi family on anthr… (#37696)


## v1.18.3 — 2026-07-16

## Core
### Improvements
- Added an Up Arrow shortcut to close the subagent picker when the first item is selected.

## Desktop
### Bugfixes
- Fixed home page scrolling so sticky headers and the session list behave correctly.
- Fixed startup readiness so WSL server loading is included before the desktop app reports ready.
- Removed the inactive help button from the app layout.
- Fixed custom agent selector visibility when custom agents are available.

### Improvements
- Home page command palette search can now find and open sessions.


## v1.18.2 — 2026-07-15

## Core

### Bugfixes

- Stopped subagents from launching nested subagents by default, with a configurable `subagent_depth` limit when needed.
- Improved default reasoning depth for Meta models.

## Desktop

### Improvements

- Added `Mod+N` as another shortcut for opening a new tab.

### Bugfixes

- Restored the Help button in release builds.
- Kept sessions with `null` archive times visible instead of dropping them from the home list.
- Hid the drawer close button on Windows where it conflicts with the window chrome.

**Thank you to 1 community contributor:**
- @BB-84C:
  - fix(core): tolerate AlreadyExists in FSUtil.ensureDir (#36542)


## v1.18.1 — 2026-07-14

## Desktop
### Bugfixes
- Fixed spacing between model provider sections in Settings.


## v1.18.0 — 2026-07-14

## Desktop

### Improvements

- Completed the Desktop v2 migration, including upgrade handling for the new layout and first-launch onboarding.
- Added a setting to switch between the new and old Desktop layouts during the transition period.

### Bugfixes

- Fixed file views using the wrong background in the v2 layout.
- Fixed connected project picker positioning when its anchor is still loading.
- Kept permission auto-accept state separate for each server.
- Fixed a project picker positioning crash.
- Kept terminal tab rename focused while editing.
- Enabled remote sessions to auto-accept permissions correctly.
- Fixed terminal tabs stealing focus when they mount.
- Loaded more timeline history at once to reduce repeated backfill while scrolling.
- Resynced the timeline correctly after reconnecting.
- Preserved the composer caret after request updates.
- Reduced Home cold-load time substantially.
- Preserved timeline bottom anchoring more reliably.
- Clarified status indicator severity.


## v1.17.20 — 2026-07-13

## Core
### Bugfixes
- Removed an obsolete Codex workaround that could interfere with OpenAI Luna Responses Lite requests.

### Improvements
- Updated Azure AI support for GPT-5.6.


## v1.17.19 — 2026-07-13

## Core

### Bugfixes

- Supported OpenAI pro reasoning mode.
- Disabled response storage by default for xAI Responses. (@geraint0923)
- Added OAuth support for Luna Responses Lite.
- Switched to another available org after logging out in the console.
- Used Codex context limits for GPT-5.6 over OAuth. (@nabilfreeman)

## TUI

### Bugfixes

- Forwarded CLI environment variables to the TUI worker.

## Desktop

### Bugfixes

- Removed interface transition changes that were accidentally shipped to `dev`.
- Fixed clipped labels and branch tooltips.
- Stopped the review panel width from jumping when opening or closing it.
- Focused the prompt input when starting a new session.
- Prevented some new-session updates from blocking the UI.
- Fixed timeline outlines getting clipped.
- Aligned context token counts with usage totals.
- Kept the file tree visible while opening files.

### Improvements

- Redesigned attachment cards and file comment chips in the new interface.
- Updated the review panel with persistent file browsing, better file tabs, and easier open-in-app actions.
- Restyled the Edit Project modal to match the new interface.
- Added middle-click to open sessions in a new tab.
- Added a temporary setting to switch between the old and new interface.
- Added per-prompt model selection in the composer.
- Polished the new interface styling across the session view and terminal.

**Thank you to 2 community contributors:**
- @nabilfreeman:
  - fix(openai): use codex context limits for gpt-5.6 (#36248)
- @geraint0923:
  - fix(xai): default store to false for Responses (#36629)


## v1.17.18 — 2026-07-09

## Core

### Bugfixes

- Prevent crashes and bad pricing data when GitHub Copilot returns models with a zero billing batch size.

### Improvements

- Add a model-specific system prompt for Meta Muse Spark.


## v1.17.17 — 2026-07-09

## Core
### Bugfixes
- Improved Meta model handling for reasoning variants and provider requests.

## Desktop
### Bugfixes
- Fixed clipped descenders in model selector labels.

### Improvements
- Added a dismissible tabs intro popup and refreshed the help entry point.
- Updated sub-agent task rows to match the v2 session design more closely.
- Restyled the revert dock in v2 sessions for clearer restore actions.
- Added a v2 free-model selector with faster access to more providers.


## v1.17.16 — 2026-07-09

## Core
### Bugfixes
- Exposed reasoning effort variants for Grok models.
- Improved xAI prompt cache routing and PDF file support in Responses models.

## Desktop
### Improvements
- Added an Open containing folder action for projects on the home screen.
- Added a composer add menu for files, commands, context, and shell mode without losing draft text.
- Added a provider setup tip on new sessions when no external providers are connected.
- Remember review panel mode and selected file per session.
- Added inline file browser tabs for opening and previewing files from the side panel.
- Updated desktop translations.

### Bugfixes
- Kept the review pane usable on wide screens by reserving its minimum width.
- Fixed hidden session panes staying mounted and causing side-panel glitches.
- Routed legacy drafts back to the session page.
- Loaded full review diffs for large patches when the initial diff is capped.
- Removed the first-open flash in the command palette.
- Routed the new session shortcut through tabs in the new layout.
- Kept session routes inside the correct layout when opening legacy session URLs.


## v1.17.15 — 2026-07-07

## Core
### Bugfixes
- Better classify Z.ai context-window overflow errors so oversized requests surface the right failure mode (@fengjikui)
- Handle unavailable config directories more gracefully when reading config files

## Desktop
### Improvements
- Restore model details tooltips in the model picker (@arvsrn)
- Refresh the v2 command palette to better match the rest of the new desktop UI (@arvsrn)

### Bugfixes
- Make terminal shortcuts take priority when the terminal is focused
- Show unread state on tabs with pending questions
- Keep session tab titles available after reloads while session data is still loading
- Apply theme changes only after you select them in Settings
- Fix macOS titlebar appearance mismatches in Sequoia and adjust traffic light placement (@arvsrn)

**Thank you to 3 community contributors:**
- @arvsrn:
  - feat(app): align cmd k menu with v2 styles (#35152)
  - feat(app): visual improvements (#35134)
  - feat(app): reintroduce model context tooltip in model selector (#35087)
  - feat(app): change traffic light position, fix sequoia bug (#35081)
- @StarpTech:
  - fix(core): expand home-relative permission paths (#35737)
- @fengjikui:
  - fix(llm): classify zai token limit overflow (#35671)


## v1.17.14 — 2026-07-06

## Core

### Improvements

- Added a code mode MCP adapter for running confined orchestration scripts against connected MCP tools.
- Hid the `execute` tool unless code mode is enabled.

### Bugfixes

- Fixed paginated MCP tool catalogs losing tool metadata and output schema validation.
- Preserved low reasoning effort for OpenRouter small-model variants instead of disabling it.
- Fixed GitHub Copilot model routing to honor each model's advertised chat or responses endpoint.
- Fixed session lists to match equivalent instance directories reliably.
- Fixed Cerebras reasoning replay so earlier assistant reasoning is sent back in the provider-supported field.

## TUI

### Bugfixes

- Fixed spinner registration so loading indicators keep rendering across TUI surfaces.

## Desktop

### Improvements

- Show draft server status in the title bar.
- Unified the provider connect flow across the app.
- Improved the integrated terminal experience. (@arvsrn)
- Added reopening for closed tabs and background tab opening. (@usrnk1)
- Improved model search in picker dialogs. (@arvsrn)
- Added recently closed projects to Home. (@usrnk1)
- Made tab navigation respond on mouse down in the new layout.
- Overhauled the v2 review panel. (@arvsrn)
- Refined the session tab preview popover. (@usrnk1)

### Bugfixes

- Fixed new sessions from Home using the wrong project.
- Fixed first-launch onboarding so it only appears when appropriate.
- Improved large review pane performance.
- Fixed timeline loads that started on assistant replies by backfilling the missing user turn.
- Restored typing in the composer while the window is unfocused.
- Fixed dropdown search behavior. (@arvsrn)
- Kept the v2 review pane mounted when switching session tabs.
- Kept the terminal mounted when switching session tabs in a workspace.
- Fixed session tab busy indicators to stay scoped to the correct server.
- Fixed child-session navigation and lineage resolution during tab transitions.
- Kept desktop window tabs after closing and reopening the app.

**Thank you to 3 community contributors:**
- @usrnk1:
  - feat(desktop): refine session tab preview popover (#34792)
  - feat(desktop): add recently closed projects to home (#34926)
  - feat(desktop): papercut fixes (#34939)
  - feat(desktop): reopen closed tabs and background tab open (#35010)
- @arvsrn:
  - feat(app): v2 review panel overhaul (#31882)
  - feat(app): align subagent UI with v2 (#34931)
  - feat(app): improvements to model search (#34954)
  - feat(app): dropdown search fix (#34961)
  - feat(app): terminal improvements (#34747)
- @StarpTech:
  - feat(tui): add debug info dialog with copy to clipboard (#35004)


## v1.17.13 — 2026-07-01

## Core

### Bugfixes

- Force reasoning mode for OpenAI-compatible reasoning models so reasoning settings apply reliably on custom deployments
- Stop replaying stale GitHub Copilot response item IDs, avoiding follow-up request failures

## Desktop

### Bugfixes

- Let question prompts be minimized and restored without dismissing them (@arvsrn)
- Clean up stale empty and old draft store files to reduce desktop state buildup
- Keep pending question requests open while reviewing them, instead of dismissing them accidentally (@eXamadeus)
- Keep session page failures scoped to the affected tab instead of breaking the whole app

### Improvements

- Improve markdown and message layout alignment in the v2 session UI (@arvsrn)
- Add a searchable v2 model picker and model management flow in the composer (@arvsrn)
- Show a hover preview for session tabs with the project, path, branch, and server (@usrnk1)
- Streamline WSL server setup with clearer distro checks and install flows (@arvsrn)
- Keep desktop tabs scoped to each window so windows restore their own tab sets

**Thank you to 3 community contributors:**
- @arvsrn:
  - feat(app): v2 wsl ui (#34233)
  - feat(app): composer improvements (#34720)
  - feat(app): more v2 ui alignment (#34465)
  - feat(app): minor fixes (#34748)
- @eXamadeus:
  - fix(app): question UI fixes and UX improvements (#34116)
- @usrnk1:
  - feat(desktop): session tab hover preview popover (#34678)
  - feat(desktop): improve markdown heading spacing in session timeline (#34738)


## v1.17.12 — 2026-06-30

## Core
### Bugfixes
- Enable adaptive thinking for Claude Sonnet 5.
- Prefer MCP content responses over structured output when both are present.
- Reconnect MCP servers after OAuth even if the server was disabled. (@MaxAnderson95)
- Request MCP refresh-token scope during OAuth.
- Show MCP OAuth completion errors instead of a generic failure.
- Refresh cached remote skills.
- Preserve skill resource paths.
- Pick better default small models across providers.
- Scope MCP auth status to each server URL.

## TUI
### Improvements
- Add a yolo mode to auto-approve permissions.
- Pass ServerAuth headers through external served TUI connections. (@OpeOginni)

## Desktop
### Improvements
- Autocomplete MCP resources in the composer.
- Add workspace controls when starting a new session.
- Show stored token and cost totals in the session context. (@OpeOginni)

### Bugfixes
- Autocomplete configured references in prompts.
- Restore the prompt cursor when the composer regains focus.
- Remember the last active desktop URL across restarts.
- Preserve the selected model when promoting a session. (@usrnk1)
- Keep session pages in sync during concurrent events.
- Support normal auth input prompts in the desktop connect-provider dialog. (@OpeOginni)
- Prevent hidden terminal tabs from hanging or resizing incorrectly.
- Re-enable auto-accept in session settings.
- Keep session tabs scoped to the correct server.
- Remember the selected home project and server.

## SDK
### Improvements
- Add a live event subscription stream.
- Add SDK access to active sessions.
- Restore session runtime operations such as event streaming, interrupts, and message lookup.
- Add paged durable session history.
- Add session permission request create and fetch endpoints.

### Bugfixes
- Preserve `V2Event` names in SSE streams.
- Wake embedded session execution after new prompts.
- Improve V2 runtime tool results and avoid duplicate model switch events.
- Resolve MIME types for prompt attachments sent by URI.

**Thank you to 11 community contributors:**
- @usrnk1:
  - feat(app): refine session UI styling (#33860)
  - fix(desktop): preserve selected model during session promotion (#34466)
  - fix(desktop): context menu button / tab intermittent issue (#34420)
  - feat(desktop): add hover background to session title and single-click edit (#34589)
  - feat(app): hide separators around active tabs (#34591)
  - feat(desktop): polish inline session title editing (#34607)
  - feat(desktop): make error view draggable (#34627)
  - feat(desktop): polish tooltips and session search (#34632)
- @arvsrn:
  - feat(app): updates to design system (#34066)
  - feat(app): update home screen alignment + markdown styles (#34172)
  - feat(app): minor visual updates (#34205)
  - feat(app): new debug bar (#34237)
  - feat(app): sticky session list header (#34220)
  - feat(app): show loader on session hover (#34224)
  - feat(app): new timeline header (#34192)
  - feat(app): improve projects sidebar reactivity (#34391)
  - feat(app): update message part ui to v2 (#34394)
  - feat(app): align slash popover to v2 tokens (#34286)
- @ariane-emory:
  - docs(providers): document blacklist and whitelist model filtering (#33792)
- @Slickstef11:
  - docs: route enterprise contact links (#34080)
- @affanali2k3:
  - fix(app): slow tooltip display for models (#30745)
- @OpeOginni:
  - fix(desktop): recognize normal auth metadata input prompts in connect provider dialog (#33024)
  - feat(desktop): Display stored totals for Tokens and Cost in Desktop Session Context (#28887)
  - feat(tui): integrate ServerAuth headers into transport configuration for external served TUI thread (#29876)
- @BenGu3:
  - fix(tui): register `prompt.skills` keybinds (#34180)
- @neriousy:
  - fix(app): disable `add project` when given server is offline (#34294)
  - fix(app): disable empty server chevron (#34292)
- @MaxAnderson95:
  - fix(mcp): reconnect after OAuth even when server is disabled
- @StarpTech:
  - fix(console): cancel upstream provider requests (#34467)
- @runvip:
  - fix(docs): fix Russian translation for index.mdx (#34001)


## v1.17.11 — 2026-06-25

## Core
### Improvements
- Add session snapshots and revert controls so you can roll a session back to an earlier message, including file changes.

### Bugfixes
- Always print the MCP OAuth URL so manual sign-in still works when opening the browser flow.

## Desktop
### Improvements
- Add Chrome-style tab cycle shortcuts with `mod+1` through `mod+9`.
- Add draggable tabs. (@arvsrn)
- Improve the empty home state when you have no sessions. (@arvsrn)
- Restyle the jump-to-latest button in the v2 session view. (@arvsrn)
- Improve the redesigned desktop layout, including better titlebar tabs and archived sessions. (@arvsrn)

### Bugfixes
- Keep prompt drafts attached to the correct project server.
- Restore consistent titlebar tab sizing and layout.
- Restore home actions when session lists are empty or still loading.
- Keep todo docks in place when switching between sessions.
- Automatically close tabs for sessions that no longer exist.
- Keep provider dialogs, prompt rollbacks, and async attachments tied to the session where they started.
- Clear late session notifications after you open the session.
- Remove the session loading stripe.

**Thank you to 2 community contributors:**
- @isaachuangGMICLOUD:
  - docs: add GMI Cloud provider entry to providers directory (#32914)
- @arvsrn:
  - feat(app): draggable tabs (#31364)
  - feat(app): ui improvements (#32438)
  - fix(app): update all v1 new-session icons (#32017)
  - feat(app): no sesssions empty state (#33315)
  - feat(app): restyle v2 jump-to-latest button (#33809)


## v1.17.10 — 2026-06-24

## Core

### Improvements

- Added MCP server instructions to session context. (@Arcadi4)
- Added Opencode-managed provider integration support.
- Added MCP resource template listing.
- Added MCP resource read tools.
- Added a `--mini` CLI mode.

### Bugfixes

- Hid MCP resource template tools when access is denied.
- Prevented MCP resource tools from colliding when servers expose the same keys.
- Emitted skill base directories as filesystem paths instead of `file://` URLs. (@shyuan)
- Restored legacy MCP tool names for existing integrations.
- Restored v1 account config loading.
- Bound MCP OAuth callbacks to IPv4 loopback for better local auth reliability. (@he-yufeng)
- Preserved structured error details in surfaced failures.
- Fixed snapshots from subdirectories so they only include the right files and paths.
- Fixed ACP resource text sourcing on Windows and other cross-platform path cases.
- Preserved file source paths in ACP resource text.
- Waited for plugins before loading reference-backed config and system context.
- Hid `gpt-5.5-pro` when using Codex OAuth.

## TUI

### Improvements

- Added a configurable keybind to open the diff viewer.
- Added diff viewer support for comparing against the main branch.

### Bugfixes

- Prevented worker rejections from breaking the TUI process.

## Desktop

### Improvements

- Kept draft prompt state per tab.
- Added a new session progress indicator. (@arvsrn)
- Added mobile bottom navigation.
- Added collapsible server sections. (@arvsrn)
- Added server-aware session routes to keep same-session navigation separated across servers.

### Bugfixes

- Always applied safe-area insets.
- Made session navigation more stable and faster.
- Routed new sessions through tabs correctly.
- Cleared viewed session notifications reliably.
- Scoped drafts created from Home to the right server and project.
- Throttled directory tree loading.
- Persisted drafts and prompt state more reliably.
- Improved iOS PWA shell behavior.
- Refined the mobile session layout.
- Added the server button dropdown. (@arvsrn)
- Restored review line comments.
- Improved the mobile home layout.

## SDK

### Improvements

- Exposed provider integration IDs in the SDK.

## Extensions

### Improvements

- Added namespaced plugin hook APIs.
- Added the V2 plugin API for Effect and Promise plugins.

**Thank you to 6 community contributors:**
- @remorses:
  - feat(llm): add video and audio media support to Gemini protocol (#31889)
- @arvsrn:
  - feat(app): collapsible servers (#33384)
  - fix(app): add server button dropdown (#33358)
  - feat(app): new session progress indicator (#32662)
  - feat(app): update all components to use v2 tokens (#33598)
- @ReStranger:
  - fix: Skip bun version check for nix version (#33166)
- @he-yufeng:
  - fix(mcp): bind oauth callback to IPv4 loopback (#30022)
- @shyuan:
  - fix(skill): emit base directory as filesystem path, not file:// URL (#33580)
- @Arcadi4:
  - feat(mcp): append server instructions to context (#32490)


## v1.17.9 — 2026-06-21

## Core

### Bugfixes

- Honor configured agent step limits by forcing a final text response instead of failing mid-run.
- Fix Devstral model detection when provider IDs use different casing. (@Robin1987China)
- Pass configured custom headers to Copilot model requests.

### Improvements

- Add `high` and `max` thinking variants for GLM-5.2 across supported providers. (@imranshaiedi-byte)
- Stop wrapping follow-up user messages in a steering reminder so prompt caching stays effective.

## TUI

### Bugfixes

- Only show the background subagent shortcut when the server supports it.

**Thank you to 4 community contributors:**
- @Grantmartin2002:
  - fix(core): fix command docs in customize-opencode skill (#32718)
- @Robin1987China:
  - fix(opencode): use toLowerCase for Devstral model detection (#33109)
- @kimnamu:
  - fix(experimental llm pkg): forward topK to Converse via additionalModelRequestFields (#33030)
- @imranshaiedi-byte:
  - feat(opencode): expose High/Max thinking variants for GLM-5.2 (#32446)


## v1.17.8 — 2026-06-17

## Core
### Improvements
- Session timelines load much faster and avoid flicker or scroll jumps.

### Bugfixes
- OpenAI-compatible providers now accept MCP tool schemas that previously failed validation. (@jquense)
- Cloudflare AI Gateway now receives the configured API key correctly. (@keefetang)
- MCP tools without declared schema properties now work with providers that expect object properties.
- Long-running MCP tools now keep their timeout alive when they report progress. (@Nomadcxx)
- The MCP OAuth callback server now shuts down once authorization finishes or is cancelled.
- MCP tool failures now surface the server's error text instead of a generic failure.
- MCP OAuth error pages now escape provider error text correctly.

## Desktop
### Improvements
- Added a Home tab toggle so you can quickly switch between Home and your last tab.
- The new desktop file and folder picker is faster and easier to navigate in the v2 layout.

**Thank you to 3 community contributors:**
- @Nomadcxx:
  - fix(mcp): enable progress timeout resets (#32477)
- @keefetang:
  - fix(provider): pass apiKey to createUnified for Cloudflare AI Gateway (#32052)
- @jquense:
  - fix(opencode): sanitize OpenAI MCP tool schemas (#32489)


## v1.17.7 — 2026-06-14

## Core

### Bugfixes

- Plugin client requests now reuse the active server instead of assuming the default local port.
- ACP shell tool calls now show the command and working directory from the start.
- Plugin-provided shell environment variables now apply to PTY sessions.

### Improvements

- MCP servers can now receive the current workspace as a client root.

## TUI

### Bugfixes

- MCP debug now uses the SDK's latest protocol version.

## Desktop

### Bugfixes

- The new session route now stays scoped to its own draft server, so prompts and state target the right workspace.

## SDK

### Improvements

- SDK clients now refresh model and provider availability when integrations change, and credential update and remove calls accept `location`.


## v1.17.6 — 2026-06-13

## Core
### Bugfixes
- Improved MCP server compatibility by declaring OpenCode's supported client capabilities.


## v1.17.5 — 2026-06-13

## Core
### Improvements
- Added external browser OAuth for the Snowflake Cortex provider (@santigc6)
- Improved project copy management and move-session flows in v2

### Bugfixes
- Recovered expired MCP sessions instead of leaving MCP tools disconnected
- Cleared closed MCP clients so stale MCP connections do not linger
- Returned structured MCP tool output in a readable form
- Fixed duplicate renderable IDs that could break TUI rendering
- Fixed commands using `$ARGUMENTS` so file contents are not injected twice (@verdverm)

## TUI
### Bugfixes
- Added auth headers to `RunCommand` fetch requests (@OpeOginni)

## Desktop
### Improvements
- Brought v2 visibility settings to the web app
- Refreshed the oc-2 color theme (@arvsrn)

### Bugfixes
- Made the terminal resize gutter easier to grab
- Faded overflowing titlebar tabs instead of clipping them abruptly

**Thank you to 5 community contributors:**
- @verdverm:
  - fix(tui): double file content injection in commands using $ARGUMENTS (#31245)
- @arvsrn:
  - feat(app): update oc-2 colors (#31071)
- @Slickstef11:
  - docs: update North Mini Code privacy terms (#32096)
- @santigc6:
  - feat(opencode): add external browser OAuth for snowflake cortex provider (#31700)
- @OpeOginni:
  - fix(opencode): add authorization header to fetch requests in RunCommand (#29877)


## v1.17.4 — 2026-06-12

## Core

### Improvements

- Added `cwd` support for local MCP servers so they can start from a workspace-relative directory. (@Grantmartin2002)
- Added connector-based authentication flows and support for stored provider credentials.
- Added v2 API endpoints to create and fetch sessions, list session questions, and resolve the active location.
- File reads now return raw content with the correct content type for API and SDK clients.
- MCP server log notifications are now surfaced in opencode logs.

### Bugfixes

- Fixed Gemini tool schemas that used multi-type fields so compatible tools keep working. (@Killusions)
- Content-filtered model responses now surface as visible errors instead of failing silently. (@kkdawkins)
- Fixed MCP auth and debug requests dropping configured headers.
- Snapshot creation now reuses source Git objects to avoid long re-hashing delays on huge repos. (@dmtrKovalenko)
- Fixed MCP catalog request timeouts not applying when listing prompts, resources, or tools.

**Thank you to 5 community contributors:**
- @dmtrKovalenko:
  - fix(snapshot): reuse source git objects to avoid re-hashing huge repos (#31798)
- @tobwen:
  - fix(tui): preserve exit epilogue during scoped shutdown (#31805)
- @kkdawkins:
  - fix(opencode): surface content-filter finish reason as visible error (#31745)
- @Killusions:
  - fix(gemini): prevent gemini incompatibility with some tools (#31877)
- @Grantmartin2002:
  - feat(opencode): support cwd on local MCP servers (#30676)


## v1.17.3 — 2026-06-10

Fixed issue with 1.17.2 desktop crashing

## v1.17.2 — 2026-06-10

## Core
### Bugfixes
- Recover from expired remote config auth by prompting you to log in again instead of failing to load config (@Ayushlm10)
- Let subagents use their own configured permissions again

## Desktop
### Bugfixes
- Restore Linux launcher and icon identity so pinned apps keep opening correctly (@neriousy)
- Restore the device attachment picker (@rexdotsh)

**Thank you to 3 community contributors:**
- @Ayushlm10:
  - fix: recover from expired enterprise auth on remote config load (#31661)
- @rexdotsh:
  - fix(app): restore device attachment picker (#31707)
- @neriousy:
  - fix(desktop): restore linux launcher identity (#31709)


## v1.17.1 — 2026-06-10

## Core

### Improvements

- References can include usage descriptions for agents, show up in the new docs, and be hidden from `@` autocomplete when needed.

### Bugfixes

- Deprecated `reference` config entries continue to load under the newer `references` config key.
- MCP prompt and resource requests now respect configured server timeouts.
- Anthropic fallback responses are handled correctly again.
- MCP servers that fail during client setup now fail cleanly instead of leaving a broken connection behind.

## Desktop

### Improvements

- The new desktop session flow now has a dedicated `/new-session` route with draft tabs that keep your prompt and project selection together until you start the session.

### Bugfixes

- Restored macOS auto-updates.


## v1.17.0 — 2026-06-10

## Core
### Improvements
- Faster file search across large projects with the new `fff`-backed search tools. (@dmtrKovalenko)
- Added `X-Session-Id` headers for proxy setups that need sticky routing. (@songchaow)
- Added Cohere North model support.
- Added `reasoning` as an interleaved field option for vLLM providers. (@delta9000)
- `mcp add` now works in non-interactive flows.
- `auth logout` now supports search when choosing an account.

### Bugfixes
- Improved MCP connection status messages so failures are easier to act on.
- Added Claude Fable reasoning support.
- MCP tool calls now receive abort signals, so cancellations stop more reliably.
- MCP catalogs now paginate correctly instead of truncating larger lists.
- OpenRouter reasoning variants now generate for all models. (@AnthonyMLau)
- Added MiniMax M3 thinking toggle support.
- Java multi-module Maven workspaces now resolve JDTLS from the topmost `pom.xml`. (@areyouok)
- MCP servers now respect advertised capabilities.
- Session lists now respect directory filters in workspace setups. (@rexdotsh)
- Sessions can recover once from provider context-overflow errors instead of failing immediately.
- Bedrock Mantle config now honors configured API key and region settings.

## TUI
### Improvements
- The session move flow now highlights project copies more clearly and keeps the current location selected.
- Project copies can now be deleted directly from the move dialog.

### Bugfixes
- New project copies are now bootstrapped before the TUI switches into them.
- Moving a session now injects a reminder about the new working directory.

## Desktop
### Improvements
- Added a help button to the tabs bar.
- Prompt drafts are preserved while you switch tabs.
- File attachments now open in the active project.
- App updates now stay responsive and persist across restarts.
- Added WSL-backed Desktop support and WSL server management on Windows.
- Improved the sessions list UI. (@arvsrn)
- Improved the servers UI. (@arvsrn)

### Bugfixes
- Updated Electron and fixed related panel layout issues.
- Fixed several WSL Desktop bugs. (@neriousy)
- Hidden agents no longer get cycled accidentally.
- MCP status now refreshes when the active directory changes.
- The Home screen now keeps a larger recent-session list with scrolling.

## SDK
### Improvements
- Large v2 tool outputs are now bounded and expose retained output paths for follow-up inspection.

**Thank you to 11 community contributors:**
- @rexdotsh:
  - fix(session): respect directory filter with workspaces (#30804)
- @arvsrn:
  - feat(app): improve servers UI (#30961)
  - feat(app): updates to project avatar (#30964)
  - feat(app): sessions list improvements (#30941)
- @dmtrKovalenko:
  - feat(opencode): fff search tools (#27802)
- @fancive:
  - docs: fix MCP header interpolation example to {env:VAR} (#31078)
- @robertDouglass:
  - fix(tui): sort connect providers alphabetically (#30891)
- @neriousy:
  - fix(desktop): few WSL bugs (#31095)
- @areyouok:
  - fix(lsp): resolve JDTLS root to topmost pom.xml in Java Maven multi-module projects (#28761)
- @remorses:
  - fix(session): merge per-call tool rules into session permission (#30529)
- @AnthonyMLau:
  - fix(opencode): generate reasoning variants for all OpenRouter models. (#30332)
- @delta9000:
  - feat: add "reasoning" as interleaved field option for vLLM providers (#30477)
- @songchaow:
  - feat: add X-Session-Id header for proxy cache routing affinity (#31511)


## v1.16.2 — 2026-06-05

## Core

### Bugfixes

- Reasoning summaries now only run on providers that support them, avoiding GPT-5 request failures on compatible backends.
- Edit operations now refuse loose matches that could overwrite the wrong code or replace an existing file by mistake.
- Fixed Bedrock sessions hanging before a model response starts. (@alblez)

### Improvements

- Diff viewer now supports next and previous hunk navigation.
- Terminal themes now refresh after live terminal reloads without stale colors or broken highlighting.
- Running subagents can now be sent to the background so you can keep working.
- Sessions now persist system context updates during long-running conversations.
- Added Snowflake Cortex provider support. (@kameshsampath)

## TUI

### Bugfixes

- Fixed the external editor fallback so attach-mode sessions still open when the original project path is unavailable locally. (@pcadena-lila)
- Permission replies now route through the correct session directory.
- `/mo` now prefers the models command in slash autocomplete.
- Fixed crashes from malformed path or diff metadata in permission and session views.

## Desktop

### Bugfixes

- Fixed titlebar tab overflow clipping.
- Fixed overflowed titlebar tabs so scrolling and drag regions behave correctly.
- Improved tab closing and navigation so the next tab is selected more reliably.

### Improvements

- Improved multi-server desktop support with per-server home state and session tabs.

**Thank you to 5 community contributors:**
- @kameshsampath:
  - feat(core): add Snowflake Cortex provider (#29901)
- @pcadena-lila:
  - fix(tui): fall back to local cwd when editor spawns in attach mode (#30583)
- @weiconghe:
  - fix: use mapError instead of orDie for context snapshot decoding (#30905)
- @alblez:
  - fix(opencode): resolve Bedrock hang by using node build conditions (#30873)
- @jerome-benoit:
  - fix(workflows): retry nix-hashes compute-hash on transient failure (#30743)


## v1.16.0 — 2026-06-05

## Core

### Improvements

- Added managed workspace cloning that keeps dirty and untracked files.
- Added moving sessions between workspaces and directories.
- Added proper OpenAI model support through AWS Bedrock.
- Added skill discovery and file-based agent loading.
- Updated GitHub Copilot usage tracking for token-based billing.
- Added `run --replay` for interactive session replay.
- Improved startup time. (@StarpTech)

### Bugfixes

- Added Vue syntax highlighting.
- Restored full ACP session replay when loading saved sessions. (@imnotlxy)
- Fixed shell cancellation races.
- Fixed SAP AI Core OpenAI reasoning variants. (@jerome-benoit)
- Fixed delegated tasks losing their selected reasoning variant.
- Fixed OpenAI websocket sessions getting stuck idle.
- Fixed Windows path normalization in migrated storage.
- Fixed prompt corruption when pasting near wide characters. (@dauphinYan)
- Fixed ACP cancel so it aborts the active run. (@smagnuso)
- Fixed SAP AI Core Anthropic Opus 4.7+ adaptive reasoning. (@jerome-benoit)

## TUI

### Improvements

- Improved the experimental session switcher.
- Truncated long sidebar file paths.

### Bugfixes

- Show a toast when the variant hotkey is used with no variants. (@ariane-emory)
- Routed question responses to the right session directory.
- Stopped the background task spinner from sticking.

## Desktop

### Improvements

- Added color themes. (@arvsrn)
- Show local server startup failures in the app.
- Added a thinking level selector for v2 prompts.
- Added a Servers tab in Settings.
- Added an update button. (@arvsrn)

### Bugfixes

- Fixed session review refresh and VCS diff caching.
- Hid update actions when desktop updates are unavailable.
- Fixed tab title truncation and close button placement.
- Show project sessions before path sync finishes. (@mhart)

## SDK

- Exposed session location data in v2 responses.

## Extensions

### Bugfixes

- GitHub now refuses to commit without an existing git author identity. (@ulises-jeremias)

**Thank you to 10 community contributors:**
- @jerome-benoit:
  - fix(opencode): support sap-ai-core anthropic opus 4.7+ adaptive reasoning (#29991)
  - fix(opencode): route SAP AI Core reasoning variants through modelParams (#30482)
- @mhart:
  - fix(app): show project sessions before path sync resolves (#30167)
- @smagnuso:
  - fix(acp): honor session/cancel by aborting the running turn (#30145)
- @dauphinYan:
  - fix(tui): prevent prompt corruption when pasting near wide characters (#29710)
- @arvsrn:
  - feat(app): v2 desktop UI improvements (#29689)
  - feat(app): polish home projects list UI (#30436)
  - feat(app): polish select-v2 component (#30446)
  - feat(app): new update button  (#30460)
  - feat(app): color themes (#30824)
- @StarpTech:
  - refactor(opencode): improve startup time by 38% (#30453)
- @ulises-jeremias:
  - fix(github): enforce existing git author identity (#30507)
  - fix(opencode): fallback to sh for curl upgrade (#30499)
- @ariane-emory:
  - fix(tui): show toast when variant_list keybind used with no variants (#30724)
- @imnotlxy:
  - fix(opencode): `ACP.loadSession` should replay all messages (#30761)
- @colinhacks:
  - fix: bump @openrouter/ai-sdk-provider to 2.9.0 (#30800)


## v1.15.13 — 2026-05-30

## Core

### Bugfixes

- Gateway Anthropic Opus 4.7+ adaptive reasoning now keeps summarized thinking instead of returning empty thinking blocks.

### Improvements

- Sessions can now store custom metadata through the API and SDK. (@shantur)
- Config now loads from the opened location upward, so directory-specific settings and provider policies apply more predictably.

## TUI

### Bugfixes

- Wrapped inline tool rows now stay aligned, and failed inline tools can expand their error details in place.

**Thank you to 1 community contributor:**
- @shantur:
  - feat(core): add session metadata support (#23068)


## v1.15.12 — 2026-05-28

## Core
### Improvements
- ACP integrations can now send prompts, slash commands, and usage updates through `acp-next`
- Added WebSocket transport for OpenAI responses on supported channels (set OPENCODE_EXPERIMENTAL_WEBSOCKETS=true)

### Bugfixes
- Enabled adaptive reasoning controls for Anthropic Opus 4.7+ models
- Allowed colons in passwords (@neriousy)
- Sped up warm `acp-next` model and config switches
- Improved first-session `acp-next` startup time
- Kept OpenAI WebSocket response timeouts active
- Retried failed OpenAI WebSocket streams before falling back
- Handled `acp-next` permission prompts correctly
- Used the persisted session directory for existing-session requests
- Forwarded remote workspace request bodies correctly
- Supported custom base URLs for OpenAI WebSocket responses (@Tarquinen)

## TUI
### Improvements
- Added a workspace management dialog

### Bugfixes
- Kept session navigation working while prompt modes are open
- Restored the thinking spinner
- Surfaced subagent retry status
- Fixed opening editors from non-Git project paths (@OpeOginni)

## Desktop
### Improvements
- Added a setting to switch tab layouts

### Bugfixes
- Improved the home empty state and fixed V2 font usage
- Fixed tab close buttons not showing reliably

**Thank you to 5 community contributors:**
- @OpeOginni:
  - fix(tui): handle non-git project paths when opening editor (#29180)
- @gotjoshua:
  - docs: fix ts error in math examples (#18244)
- @Tarquinen:
  - fix(openai): support websocket custom base URLs (#29636)
- @24KaratAu:
  - docs: fix grammar in config.mdx (#29683)
- @neriousy:
  - fix(core): allow colons inside passwords (#29576)


## v1.15.11 — 2026-05-27

## Core
### Improvements
- Added `headerTimeout` config for provider requests, with a 10s default for default OpenAI setups.
- Experimental background agents now push updates without polling.
- You can now set only `modalities.input` or `modalities.output` in config. (@robposch)
- Remote-backed projects now resolve a stable project identity.

### Bugfixes
- Dynamically added MCP servers now disconnect cleanly when removed.
- DigitalOcean inference now uses your OAuth token directly instead of creating a MAK. (@Spherrrical)
- Config loading now falls back cleanly when user info is unavailable.
- Fixed Google tool calling after the upstream tool ID regression.
- Experimental flags can now override the umbrella experimental flag.
- Resumed sessions no longer continue orphaned interrupted tools. (@edevil)
- OpenAI reasoning summaries now render as separate blocks.
- Updated Google Vertex support for reasoning signatures.
- The shell tool now advertises your configured timeout to the model.

## TUI
### Improvements
- Made the prompt resize with terminal width and added prompt size config. (@bjschafer)

### Bugfixes
- Accelerated diff viewer scrolling.
- External editors now open from the worktree directory when available.

## Desktop
### Improvements
- Refined the Desktop v2 home screen, prompt, status popover, and session controls.

### Bugfixes
- Fixed V2 titlebar errors when a session sync cache was deleted. (@Eric-Guo)
- Web deployments no longer run desktop health checks.
- Duplicate server connections are now merged in the server list.
- Stabilized virtualized session timeline interactions.
- Fixed the white flash when restoring the desktop window.

## Extensions
### Improvements
- Added a `dispose` hook for plugins.

### Bugfixes
- Fixed Codex plugin requests to send the expected session ID header.

**Thank you to 7 community contributors:**
- @jerome-benoit:
  - fix(nix): re-inherit patches in desktop, ad-hoc sign .app on darwin (#27869)
- @edevil:
  - fix(session): exclude orphaned interrupted tools from run-loop continuation (#26178)
- @bjschafer:
  - feat(tui): make prompt size responsive and configurable (#28255)
- @robposch:
  - tweak (config): make modalities input/output fields optional so that u can specify one without both being required  (#29268)
- @Eric-Guo:
  - fix(app): handle deleted session sync cache in V2 titlebar (#29328)
- @StarpTech:
  - docs(web): update LSP docs wording (#29435)
  - docs: add tip to lsp section (#29444)
- @Spherrrical:
  - fix(digitalocean): use OAuth token directly for inference instead of creating MAK (#28897)


## v1.15.10 — 2026-05-23

## Desktop
### Bugfixes
- Restored the legacy production desktop flows for opening projects and starting sessions.


## v1.15.9 — 2026-05-22

## Core

### Improvements

- Redesigned the diff viewer with a file tree and refreshed layout.

### Bugfixes

- Return to the previous screen when closing the diff viewer.
- Show clearer errors when a default model is invalid or unavailable.
- Surface missing PTY session errors instead of failing generically.
- Improve diff viewer empty states and context handling.
- Show clearer errors when a skill invocation fails as expected.
- Show clearer errors when an installation upgrade fails.
- Show clearer project not found errors from the HTTP API.
- Return PTY error bodies from the HTTP API.
- Enable the diff viewer by default.
- Return MCP server not found errors from the HTTP API.
- Let MCP OAuth configs set a callback port and include configured scopes in client metadata. (@sebin)
- Use working Vertex Anthropic endpoints for `us` and `eu` multi-region setups. (@JPFrancoia)
- Return session busy error bodies from the HTTP API.
- Preserve native reasoning continuation metadata across turns.

## TUI

### Improvements

- Copy the current worktree path from the command palette.

### Bugfixes

- Refine diff viewer keyboard shortcuts.
- Restore question prompt key handling.
- Keep the spinner color aligned with the active agent. (@OpeOginni)

## Desktop

### Improvements

- Move tab navigation into the title bar and tighten session tab shortcuts.
- Show session status in the title bar.

### Bugfixes

- Extract user codes correctly from callback URLs that contain multiple colons. (@OpeOginni)
- Debounce VCS refreshes to reduce session page churn.

**Thank you to 4 community contributors:**
- @vglafirov:
  - chore(deps): bump gitlab-ai-provider to 6.7.0 (#28218)
- @OpeOginni:
  - fix(opencode): update spinner color logic (#28032)
  - fix(desktop): correct user code extraction when URL contains colons (#28837)
- @JPFrancoia:
  - fix(vertex): Vertex (Antropic) provider: use .rep.googleapis.com for continental multi-region endpoints (us, eu) (#28347)
- @sebin:
  - fix(mcp): include scope in clientMetadata and add callbackPort option (#28810)


## v1.15.7 — 2026-05-21

## Core
### Improvements
- Added Grok OAuth sign-in, including device-code login. (@Jaaneek)

### Bugfixes
- V2 session APIs now return safe `UnknownError` responses with log reference IDs when stored messages are corrupt.
- Generic API 500s no longer expose config details from server errors.
- Unknown API errors now include reference IDs so you can match responses to server logs.
- V2 session APIs now return `503 ServiceUnavailableError` for mutations that are not available yet.
- V2 session APIs now return `SessionNotFoundError` for missing sessions.
- Deduped concurrent Codex OAuth refreshes to avoid repeated refresh failures. (@cooper-oai)
- Restored native OpenAI OAuth requests.
- Tool schema failures now surface as friendly tool errors.
- Added PDF attachment support for Grok.
- Restored OpenAI reasoning streams.

## TUI
### Bugfixes
- Collapsed thinking labels now use clearer punctuation.
- New sessions now default to the local project.
- Single-select question checkmarks no longer run into option labels.

## Desktop
### Improvements
- Added a pinch zoom setting for the desktop app.
- Added a new desktop home view, session entry flow, and titlebar.
- Refined the new desktop UI and moved app update actions into the titlebar.
- Added desktop log export.

## SDK
### Bugfixes
- V2 global event streams now include account add, remove, and switch events.

**Thank you to 3 community contributors:**
- @cooper-oai:
  - fix(opencode): dedupe concurrent Codex OAuth refreshes (#28236)
- @Jaaneek:
  - feat(opencode): add xAI Grok OAuth (SuperGrok) + device-code login (#28557)
- @kagura-agent:
  - fix(ui): preserve target attribute in DOMPurify config for markdown links (#28598)


## v1.15.6 — 2026-05-20

## Core

### Improvements

- Added a diff viewer in the TUI for reviewing changes.
- Collapsed single-child directories in the diff viewer file tree.
- Added shell mode to the `run` prompt.
- Replaced subagent tabs with an on-demand picker in `run`.
- Plugin file load errors no longer break the rest of plugin loading.
- Anthropic API-key models now use the native runtime.
- The v2 HTTP API now exposes structured public error schemas.

### Bugfixes

- Zed editor context now only activates inside Zed terminals.
- The v2 HTTP API now exposes catalog errors.
- The v2 HTTP API now exposes request errors.
- The v2 OpenAPI spec now preserves endpoint error responses.
- `opencode login` now defaults to `https://console.opencode.ai`.
- Agent and command names now resolve correctly from relative config paths.
- Invalid `OPENCODE_PERMISSION` JSON no longer crashes startup.
- Plugin tools with missing `args` no longer break tool loading.
- Restored legacy `PgUp` and `PgDn` TUI keybind aliases.
- Native runtime now prefers the console provider token for OpenCode models.

## TUI

### Improvements

- The diff viewer now focuses the first file automatically.

### Bugfixes

- Imported sessions now refresh their directory and relative path fields correctly. (@OpeOginni)

## Desktop

### Improvements

- Added initial desktop tabs support.
- Added a native app menu on Windows.
- Added Ukrainian locale support. (@MYMDO)

### Bugfixes

- Custom providers now appear immediately after config updates. (@tianxiaoliang)

## SDK

- Updated `opentui` dependencies to `0.2.15`.

**Thank you to 4 community contributors:**
- @MYMDO:
  - feat(i18n): add Ukrainian (uk) locale support (#28061)
- @StarpTech:
  - chore(team): add starptech to the team members list (#28320)
  - chore(docs): remove beta zen go (#28317)
  - chore(triage): add 'starptech' to core and inference teams (#28376)
- @tianxiaoliang:
  - fix(app): invalidate provider queries after config update to show custom providers immediately (#28313)
- @OpeOginni:
  - fix(opencode): Update directory and path fields of imported session (#27516)
  - fix(enterprise): message nav hovercard and active state (#23964)


## v1.15.5 — 2026-05-18

## Core

### Improvements

- Preview the native OpenAI runtime path behind an experimental flag
- Add `--replay` and `--replay-limit` to show recent history when resuming interactive runs

### Bugfixes

- Fix plugin tools using `ask` so tool calls complete correctly
- Reduce missed `/event` updates caused by a subscription race
- Sort the v2 session list by most recently updated

## TUI

### Improvements

- Refresh the prompt layout after pasting content

### Bugfixes

- Keep file references scoped to the current workspace
- Preserve pasted prompt content when copying
- Collapse very long tool output lines to keep the layout readable
- Use a higher-contrast paste summary badge color in some themes (@kagura-agent)

## Desktop

### Improvements

- Allow desktop notifications from the renderer
- Show free-limit and usage-exceeded dialogs in Desktop
- Speed up large session timelines

### Bugfixes

- Fix question dock overflow and message layout clipping
- Hide the prompt placeholder when the input only contains whitespace (@ShrootBuck)
- Sync the PWA status bar color with the active theme (@heimoshuiyu)
- Install the newest available desktop update instead of reusing a stale download

**Thank you to 4 community contributors:**
- @heimoshuiyu:
  - fix: sync PWA status bar theme-color with app color scheme (#28006)
- @ShrootBuck:
  - fix(app): hide prompt placeholder for whitespace input (#28101)
- @kagura-agent:
  - fix(tui): use contrast-aware foreground for paste summary badge (#27969)
- @SpiritChen51:
  - fix(ui): fallback to execCommand for clipboard copy when navigator.clipboard fails (#27993)


## v1.15.4 — 2026-05-17

## Core

### Bugfixes

- Fixed project-scoped bus events so file watcher and update notifications reach the right instance.
- Fixed custom LSP servers not sending refresh events after they initialize.
- Hid background subagent task instructions unless experimental background mode is enabled.

## TUI

### Improvements

- Made Markdown H1 headings easier to distinguish.

**Thank you to 1 community contributor:**
- @necropheus:
  - docs: update README.es.md (#27739)


## v1.15.3 — 2026-05-16

## Core
### Bugfixes
- Reduced wasted work when reading very large files after output truncation.

## TUI
### Bugfixes
- Fixed async commands losing the active instance context, which could break agent generation and GitHub-driven runs.


## v1.15.2 — 2026-05-16

## Core

### Improvements

- Reduced unnecessary prompting around shell, task, and todo flows.

### Bugfixes

- Fixed sync events not reaching project-scoped subscribers in injected instances.

## TUI

### Improvements

- Newly pinned sessions now stay at the end of the pinned list instead of jumping to the top.

### Bugfixes

- Fixed `opencode run --agent` resolving project-local agents.

**Thank you to 1 community contributor:**
- @gigamonster256:
  - feat(nix): add opencode-electron derivation (#16163)


## v1.15.1 — 2026-05-16

## Core

### Improvements

- Clarified how to recover when the npm package is installed without its native binary.

### Bugfixes

- Avoid duplicate consecutive entries in prompt history.
- Show full config validation errors during TUI startup instead of a generic failure.
- Fixed npm installs so the CLI can recover and fetch the right native binary on more setups.
- Fixed multiline `@` mentions in prompts.
- Preserved custom tool metadata from Zod schemas.
- Preserved custom tool argument descriptions in generated schemas.
- Fixed file watching in repos where `.git` is a symlink. (@kagura-agent)

## TUI

### Improvements

- Added a collapsed thinking view that can be expanded inline.
- Added pinned sessions with quick-switch slots in the session picker.

### Bugfixes

- Fixed thinking mode defaults so reasoning starts collapsed consistently.
- Limited session quick-switching to pinned sessions.
- Fixed Markdown table rendering in chat output.

**Thank you to 1 community contributor:**
- @kagura-agent:
  - fix(watcher): resolve symlinked .git path before subscribing (#27016)


## v1.15.0 — 2026-05-15

## Core
### Improvements
- Added an Effect-based core event system for more complete event delivery across sessions and integrations.

### Bugfixes
- Ignored invalid exports in custom tool modules instead of failing tool loading.
- Ignored project instruction lookup errors so sessions keep loading when project instruction discovery fails.
- Fixed versioned event projector lookups so event replay uses the right handlers.

## Desktop
### Improvements
- Auto-hide the menu bar on Linux and Windows. (@shi-gg)

### Bugfixes
- Fixed archived sessions being reprocessed when their archive state did not change.

## SDK
### Bugfixes
- Restored missing event types in the JavaScript SDK, including session and message events.

**Thank you to 1 community contributor:**
- @shi-gg:
  - feat(desktop): auto-hide menu bar on Linux and Windows (#27618)


## v1.14.51 — 2026-05-15

## Core

### Improvements

- Added experimental background subagents so tasks can keep running while you continue working.
- Added the required billing origin header for NVIDIA endpoints. (@nv-kasikritc)

### Bugfixes

- Fixed worktree creation requests that omitted the POST body.
- Fixed sessions getting stuck with interrupted assistant messages after cancellation.
- Fixed repeated auto-compaction in sessions after compaction reordered messages.
- Updated LiteLLM compatibility to require `v1.85.0-rc.2+` for current GPT-5 and tool-call behavior. (@Sameerlite)
- Fixed truncated shell output streams closing cleanly.
- Stopped exposing internal named defect details from the HTTP API.
- Fixed Azure `gpt-5.5` requests through the completions API. (@frederiknsgo)
- Restored automatic image resizing for oversized image attachments.

## TUI

### Bugfixes

- Preserved text selection when clicking question prompt options. (@nikhil-patel-whatnot)

## Desktop

### Improvements

- Added MCP connection status for client registration and authentication, with direct re-auth flows in the app. (@OpeOginni)

### Bugfixes

- Fixed Windows app detection by reading `where` output correctly.

## Extensions

### Bugfixes

- Fixed DigitalOcean OAuth to request only the GenAI scopes it needs. (@Spherrrical)

**Thank you to 7 community contributors:**
- @nikhil-patel-whatnot:
  - fix(tui): preserve text selection on question prompt options (#24988)
- @frederiknsgo:
  - fix: bug encountered when using azure gpt-5.5 w/ completions api (#26222)
- @OpeOginni:
  - feat(desktop): add mcp client registration status and authentication handling (#27525)
- @Sameerlite:
  - fix(provider): remove LiteLLM workarounds ported upstream, requires LiteLLM v1.85.0-rc.2+ (#26819)
- @bo-tato:
  - docs(app): stale reference to removed multi-edit tool (#27579)
- @Spherrrical:
  - fix(plugin): scope digitalocean oauth to genai (#27599)
- @nv-kasikritc:
  - feat(provider): add NVIDIA endpoints origin header (#27394)


## v1.14.50 — 2026-05-14

## Core
### Bugfixes
- Kept HTTP event streams open after the initial connect event so subscribers continue receiving instance updates.
- Returned proper busy errors when a session is already running prompt or shell work.
- Let invalid `small_model` config values fall back cleanly instead of breaking small-model selection.
- Improved missing-model errors with suggestions across CLI and typed callers.

## TUI
### Improvements
- Restored markdown rendering for session output by default.

## SDK
### Improvements
- Added `instance.directory` and `instance.workspace` query support to the v2 model and provider calls.


## v1.14.49 — 2026-05-13

## Core
### Improvements
- Added the v2 model and provider listing API.
- Added DigitalOcean OAuth and Inference Router support. (@Spherrrical)
- Create a global `opencode.jsonc` automatically when no config exists.
- Enable `customize-opencode` by default with a linked full schema.
- Autocomplete configured `@mentions` in prompts.
- Parse fenced Markdown code blocks in patch diffs by default.

### Bugfixes
- Fix keymap fallback priority and make TUI config errors clearer.
- Restore model suggestions for unloaded providers and missing models.
- Preserve layered permission rule order in config merges. (@asuffield)
- Preserve attachments returned by custom tools.
- Keep recent turns after compaction instead of folding them into the summary.
- Fix prompt cursor movement and mentions for wide characters.
- Prevent duplicate submits from creating empty phantom sessions.
- Keep compacted tail history when forking a session.
- Return proper busy-session errors from the HTTP API.

## TUI
### Improvements
- Add pinned recent sessions, quick slots, and recent-session cycling.

### Bugfixes
- Restore non-interactive `run` exit behavior.
- Make the websearch provider label update reactively. (@NormallyGaussian)
- Reduce flicker when switching workspaces.
- Fix `run --json` output draining.
- Fix prompt history and line up/down commands.

## Desktop
### Improvements
- Add Ctrl/Cmd+number shortcuts to switch projects.
- Remember whether the todo dock is collapsed.
- Restore AppStream metadata in Linux desktop builds.

### Bugfixes
- Show clearer wrapped server errors in the app. (@OpeOginni)
- Use the login shell when loading desktop environment variables. (@qwq202)
- Remember the selected model variant when switching sessions or projects.
- Open the next available project when closing the current one.
- Prevent streamed Markdown from being cut off.

**Thank you to 5 community contributors:**
- @NormallyGaussian:
  - fix(tui): make websearch provider label reactive (#26943)
- @Spherrrical:
  - feat(plugin): add DigitalOcean OAuth + Inference Routers (#26095)
- @asuffield:
  - fix: preserve permission ordering by accepting a layered array (#23214)
- @qwq202:
  - fix(desktop): resolve login shell when loading env (#26449)
- @OpeOginni:
  - fix(app): enhance error handling by unwrapping SDK-wrapped errors in formatServerError (#27061)


## v1.14.48 — 2026-05-11

## Core
### Improvements
- Preserve original image attachments instead of resizing them before sending them to the model


## v1.14.47 — 2026-05-11

## Core
### Bugfixes
- Restored prompt editing keybindings in the TUI textarea, including aliases like `esc` and `enter`
- Model changes now persist reliably across session activity
- HTTP API schema validation errors now return a readable 400 response body

### Improvements
- Scout can now materialize configured reference repositories up front so they are ready to search
- Large image attachments are now auto-resized before sending, with configurable size limits

## TUI
- File and directory paths now render relative to the session directory when possible


## v1.14.46 — 2026-05-10

## Core

### Improvements

- Added a built-in `customize-opencode` skill so opencode config edits are less likely to break startup.

### Bugfixes

- Fixed numeric HTTP API query parameters in the generated OpenAPI spec and SDK for session and file endpoints.
- Fixed boolean HTTP API query handling so SDK types and runtime validation stay aligned.
- Tolerated legacy stored numeric values in sessions, diffs, and retry events instead of failing to load old data.
- Fixed old sessions with negative token counts causing message loads and Desktop startup to fail.
- Fixed MCP tool discovery when a server publishes broken `outputSchema` references.
- Fixed workspace HTTP API query drift so workspace-routed endpoints expose the right query parameters in OpenAPI and the SDK.
- Fixed a Plan Mode security bypass where subagents could ignore parent-agent deny rules.


## v1.14.45 — 2026-05-10

## Core
### Bugfixes
- Provider configs and API responses now accept models marked as `active`.
- Read tool permission rules now match worktree-relative paths, so read allowlists and denylists apply correctly.
- Workspace-routed HTTP API endpoints no longer reject valid `directory` and `workspace` query params.

## TUI
### Bugfixes
- Startup errors now report every failed bootstrap request instead of only the first one.
- Opening a session no longer crashes when the messages request fails.

## Desktop
### Bugfixes
- Older migrated sessions with missing diff file details load again.
- Older migrated sessions with missing diff patches load again. (@OpeOginni)

## SDK
### Bugfixes
- `throwOnError: true` now throws a real `Error` with the server message and preserves the response body in `cause`.

## Extensions
### Improvements
- TUI plugins using the deprecated `api.command` API keep working while you migrate to `api.keymap`.

### Bugfixes
- Provider plugins can no longer mutate shared provider model state for the rest of the app.

**Thank you to 1 community contributor:**
- @OpeOginni:
  - fix(sessions): allow optional patch field in diff for migrated sessions (#26574)


## v1.14.44 — 2026-05-09

## Core
### Bugfixes
- Fixed upgrades failing for existing workspaces when adding the `time_used` field.


## v1.14.43 — 2026-05-09

## Core
### Bugfixes
- Keep provider and config API responses working when auth loaders add non-JSON options to providers.
- Include tool image attachments in ACP updates and session replays. (@SteffenDE)

**Thank you to 1 community contributor:**
- @SteffenDE:
  - fix(acp): include tool image attachments in updates (#25128)


## v1.14.42 — 2026-05-09

## Core

### Improvements

- Added HTTP API response compression for large non-streaming responses.
- Added the Scout agent for repo research, docs lookup, and dependency-source inspection.
- Added workspace sync so adapter-backed workspaces can be discovered and registered automatically.
- Added an interactive split-footer mode for `opencode run`.
- Simplified TUI keybinding config into a flat keybind format.
- Made duplicate worktree names fall back to the parent directory for clearer labels.

### Bugfixes

- Fixed HTTP API auth responses to match the previous wire format for empty authorize results and share errors.
- Returned structured validation errors from the HTTP API.
- Rejected invalid permission and question IDs in the HTTP API.
- Included auth challenges on typed HTTP API `401` responses.
- Fixed the HTTP API OpenAPI document route.
- Fixed detached sessions so they are claimed by the source project again.
- Forwarded `SIGINT`, `SIGTERM`, and `SIGHUP` correctly when running through the npm shim. (@chubes4)
- Allowed skills without descriptions to load correctly.
- Required auth on effect HTTP API root routes. (@RajvardhanPatil07)
- Kept tool ordering stable so tool lists stop reshuffling between runs.
- Made retry dialogs more specific to the provider and failure reason.
- Fixed Gemini reasoning controls so supported effort levels and small-mode defaults match the model.
- Fixed Anthropic Opus 4.5 reasoning effort options.
- Limited OpenAI deep research models to the reasoning level they actually support.
- Fixed GPT-5 reasoning variants so the exposed effort options match each model family.

## TUI

### Improvements

- Show retrying sessions as active in the project sidebar. (@edemaine)

### Bugfixes

- Fixed the sidebar message shown for language server state. (@Polo123456789)
- Sorted the session picker by full last-updated time instead of day buckets. (@Sleepful)
- Kept longer cleared prompts in draft history so they can be restored.

## Desktop

### Improvements

- Switched desktop updates to silent per-user install flow.

**Thank you to 5 community contributors:**
- @edemaine:
  - feat(desktop): working indicator on project sidebar (#26223)
- @RajvardhanPatil07:
  - fix(server): require auth for effect root routes (#26361)
- @chubes4:
  - fix(cli): forward signals from npm shim (#26259)
- @Sleepful:
  - fix(tui): sort session picker by full updated timestamp (#24725)
- @Polo123456789:
  - fix(sidebar): fix logic and missleading message #26469 (#26470)


## v1.14.41 — 2026-05-07

## Core

### Bugfixes

- Restored formatter output handling so formatting still works when formatters write to stdout or stderr. (@ferdinandyb)

### Improvements

- Warping a session to another workspace can now carry over your uncommitted file changes.

## TUI

### Bugfixes

- Restored custom provider setup in `/connect`.

## Desktop

### Bugfixes

- Added a macOS Settings menu entry. (@jessedi0n)

### Improvements

- Moved the desktop app's local server into a separate utility process for more reliable startup and shutdown.

## Extensions

### Improvements

- ACP clients now restore the last model, mode, and effort when loading sessions, and can close sessions cleanly.

**Thank you to 4 community contributors:**
- @carmithersh:
  - docs: add opencode-jfrog-plugin to ecosystem list for JFrog integration (#26019)
- @jessedi0n:
  - fix(desktop): add macOS settings menu entry (#26081)
- @ferdinandyb:
  - fix(format): restore stdout/stderr ignore for formatter processes (#26037)
- @YGoetschel:
  - fix: guard undefined contents in diff renderer to fix share viewer SSR crash (#21763)


## v1.14.40 — 2026-05-07

## Core

### Improvements

- Support `.well-known/opencode` configs that point to a separate remote config file.

### Bugfixes

- Preserve assistant text when replaying signed reasoning blocks. (@edevil)
- Return consistent not-found errors for missing sessions.
- Apply CORS headers before auth so browser clients can reach legacy server endpoints.
- Fix `serve`, `web`, and ACP network options triggering runtime re-entry errors.
- Only show connected workspaces in warp flows, and carry the new directory into the session after warping.
- Restore web terminal CSP allowances.
- Sanitize invalid surrogate characters before provider transforms.
- Fix Cloudflare AI Gateway provider options for OpenAI-compatible models. (@NathanDrake2406)
- Use the current workspace with `/new`, including local-project warps.
- Keep editor selection context stable until it is sent.
- Retry `server_is_overloaded` API errors automatically.
- Restore Mistral Medium 3.5 variants so model selection works correctly.
- Show compaction summaries before retained tail messages.

## TUI

### Bugfixes

- Keep the selected model when model data refreshes.
- Fix `/agent create` to use the `/agents` path. (@OpeOginni)

## Desktop

### Improvements

- Allow trusted app windows to write to the clipboard without permission failures.

### Bugfixes

- Ignore broken pipe (`EPIPE`) errors in desktop console logging.
- Stop auto-installing updates when quitting the app.
- Silence noisy browser API Sentry reports in production.
- Prevent sync bootstrap queries from failing during app startup.

**Thank you to 6 community contributors:**
- @OpeOginni:
  - fix(TUI): update agent create target path from "/agent" to "/agents" (#14427)
- @NathanDrake2406:
  - fix(cf-ai-gateway): route provider options through openaiCompatible key (#24432) (#25573)
- @imduchuyyy:
  - docs: update desktop app references from Tauri to Electron (#25965)
- @kill74:
  - docs: fix CLI attach section order (#25749)
- @zharinov:
  - fix(ui): preserve SVG tags in DOMPurify config for KaTeX math rendering (#25866)
- @edevil:
  - fix(provider): preserve assistant message content when reasoning blocks present (#21370)


## v1.14.39 — 2026-05-05

## Desktop

### Bugfixes

- Respect `HTTP_PROXY` and related proxy environment variables in the desktop app.
- Return `null` instead of failing when the desktop app cannot read a stored value.


## v1.14.38 — 2026-05-05

## Core
### Bugfixes
- Embedded UI requests now work with arbitrary `connect-src` origins under the default CSP.

## Desktop
### Bugfixes
- Desktop now trusts system CA certificates for HTTPS connections.


## v1.14.37 — 2026-05-05

## Core

### Bugfixes

- Canceling a task now also cancels child subtask sessions.

### Improvements

- Improved v2 session rendering with cleaner tool states, better compaction summaries, and more accurate timing.
- Warp a session into another workspace or back to the local project.

## Desktop

### Bugfixes

- Run the desktop migration on startup so existing installs transition correctly after the desktop packaging move.
- Stabilized the Windows titlebar when changing zoom levels.


## v1.14.35 — 2026-05-05

## Core
### Bugfixes
- Preserve diff patch boundaries so session diffs keep rendering correctly when file contents include `diff --git` text.


## v1.14.34 — 2026-05-04

## Core

### Improvements

- Add PTY connection tickets so authenticated terminal websockets work more reliably across clients.
- Add v2 session failure events so clients can detect and show failed runs.
- Improve shell command handling for Bash, PowerShell, and cmd sessions.

### Bugfixes

- Return structured error bodies from the effect HTTP server instead of empty failures.
- Reload server auth environment variables correctly for each new HTTP listener.
- Stop worktree creation from hanging while bootstrap commands run.
- Fix Azure Anthropic model resolution when using the Anthropic SDK.
- Fix the web UI proxy so public manifest assets load and proxied responses do not break on `transfer-encoding`. (@OpeOginni)
- Allow Codex Spark models when signing in with Codex OAuth. (@Utkub24)
- Fix embedded UI serving from the standalone server build.
- Fix PTY websocket connections from Desktop when using the HttpApi server.
- Respect custom basic auth usernames in opencode clients.
- Prompt browsers for basic auth on protected server logins. (@OpeOginni)
- Show real server error messages in the CLI and SDK instead of bare `{}`.
- Prevent large diffs from using unbounded memory.
- Fix v2 session API responses to encode optional fields correctly.
- Fix pagination `Link` headers to use the real request host.

## TUI

### Improvements

- Add `debug info` to print environment and diagnostic details.

### Bugfixes

- Add a `--username` option for basic-auth server connections. (@OpeOginni)
- Pass server auth through internal ACP connections.
- Show provider login errors from stderr instead of swallowing them.

## Desktop

### Bugfixes

- Prevent terminal reconnect loops after recovery failures.
- Preserve auth-token credentials when reopening the app.

**Thank you to 4 community contributors:**
- @PanAchy:
  - chore(opencode): exclude .map files from CLI binary build (#25500)
- @OpeOginni:
  - fix(httpapi): add basic auth challenge for browser login
  - fix(auth): add username option for basic auth in RunCommand (#25600)
  - fix(opencode): strip transfer-encoding in UI proxy and allow public manifest assets (#25698)
- @Utkub24:
  - fix: allow Codex Spark with Codex OAuth (#25640)
- @cgilly2fast:
  - chore(docs): rename firmware provider to frogbot (#25453)


## v1.14.33 — 2026-05-02

## Core
- Fix issue with custom agents in plugins not loading

**Thank you to 3 community contributors:**
- @jerome-benoit:
  - fix(nix): remove stale packages/shared filter (#24930)
- @OpeOginni:
  - docs: CLI docs for current commands and flags (#25399)
- @HyeokjaeLee:
  - fix(instance): restore InstanceBootstrap init parameter for non-Effec… (#25449)


## v1.14.32 — 2026-05-02

## Core
- Shell mode in the prompt stays editable, so backspace, cursor movement, and other editing keys work again.
- Fixed HTTP API workspace adapters losing instance context, which could break workspace create, sync, and routing flows.
- Fixed experimental workspace creation requests that omit `extra`.
- Fixed OpenAPI parameter schemas so generated clients match the public API.
- Unsupported image formats now fall back to text reads instead of being sent as image attachments. (@zeke)
- Agents can use the global temp directory without extra permission prompts.
- Fixed Bedrock sessions that include reasoning content when switching models.
- Session archive timestamps now reject non-finite values, avoiding invalid JSON in API payloads.

## TUI
- Reduced startup theme flashing when using the system theme.
- The animated logo now avoids subpixel rendering on terminals without truecolor support.

**Thank you to 2 community contributors:**
- @luojiyin1987:
  - fix: correct documentation typos (#25260)
- @zeke:
  - fix(read): prevent unsupported image formats from being sending to provider (#21114)


## v1.14.31 — 2026-05-01

## Core
- Azure setup now prompts for the resource name when needed and saves it with the API key.
- Task child sessions now preserve parent `external_dir` and deny permissions. (@remorses)
- Invalid remote MCP URLs now fail with a clear error instead of breaking setup.

## Desktop
- Restoring saved messages no longer crashes the app when a model is missing.

**Thank you to 1 community contributor:**
- @remorses:
  - fix(opencode): preserve `external_dir` and `deny` parent permissions in task child sessions (#23290)


## v1.14.30 — 2026-04-29

## Core
- Fixed missing sessions in Desktop caused by path mismatches, including recovery for existing stored data.
- Fixed Azure Responses defaults to avoid reasoning item ordering errors.
- Improved DeepSeek compatibility with providers that vary model naming.
- Added Mistral Medium 3.5 with reasoning support. (@rubdos)
- Made instruction precedence more predictable by applying global instructions before project and skill instructions.
- Reconnected editor context when switching to a session in another directory.
- Fixed forked sessions so compacted history stays intact. (@spark4862)
- Reduced memory growth in long-running bash tool usage.
- Sessions now filter to the current path by default, with a setting to show the whole project.
- Kept GitHub Copilot model variants in sync with the latest API capabilities.
- Fixed Zed selections with UTF-8 text so editor context uses the right ranges.

## TUI
- Added a quick toggle for paste summaries.
- Invalid custom themes no longer crash the TUI on startup.

**Thank you to 3 community contributors:**
- @Vect0rM:
  - docs: add Atomic Chat provider section (#23069)
- @spark4862:
  - fix(session): remap compaction tail_start_id when forking (#24898)
- @rubdos:
  - feat: add Mistral Medium 3.5 with reasoning support (#24996)


## v1.14.29 — 2026-04-28

## Core
- Sessions now keep a relative workspace path.
- Moonshot and Kimi tool schemas are sanitized to avoid rejected tool calls.
- MCP OAuth errors now match the native API more closely.
- Provider OAuth authorize errors now match the native API more closely.
- Shell cancellations now finish cleanly instead of leaving aborted commands in a bad state.
- Creating a session over HTTP now works with an empty request body.
- Workspace HTTP API routes are now mounted through the bridge.
- Tool streaming now defaults off for non-Anthropic models when using the Anthropic SDK.
- DeepSeek OpenAI-compatible setups now keep `reasoning_content` interleaved by default.
- The experimental LSP tool now forwards the workspace symbol query.
- Google Vertex now defaults tool call streaming off.

## TUI
- Zed context polling stays responsive.
- Pressing Enter in dialogs now triggers the dialog instead of leaking through. (@CasualDeveloper)
- File context is clearer, can be turned off, and clears after sending.
- `opencode agent create` now writes a valid `permissions.deny` config. (@21pounder)

## Desktop
- Per-workspace icon overrides now stay applied for subdirectories in the same repo.
- Sync state loading is more reliable for MCP, LSP, and workspace refreshes.

**Thank you to 3 community contributors:**
- @21pounder:
  - fix(opencode): agent create generates permissions field with deny ins… (#24482)
- @SeashoreShi:
  - docs: fix duplicated word in CLI env var table (#24614)
- @CasualDeveloper:
  - fix(tui): consume Enter in dialog useKeyboard handlers (#23390)


## v1.14.28 — 2026-04-27

## Core

- Fixed issue with `opencode upgrade` failing for bun installs unless in a directory with package.json

## v1.14.27 — 2026-04-27

## Core

- Added a configurable default shell for terminals and agent shell commands, with a Desktop setting to manage it.
- Reduced extra terminal noise while creating TUI workspaces.

## TUI

- Hid provider connection checks until onboarding is complete.
- Restored the default toast timeout when no custom duration is provided. (@OpeOginni)

**Thank you to 1 community contributor:**
- @OpeOginni:
  - fix(tui): update toast duration handling to use default value (#23395)


## v1.14.26 — 2026-04-26

## Core

- Fixed config parsing to preserve permission rule order.
- Fixed OpenRouter DeepSeek reasoning output handling.
- Sent an `opencode/<version>` `User-Agent` header with HTTP requests.

## TUI
- Added Zed editor selection support for editor context.
- Show a `/connect` tip when no models are configured.
- Fixed editor lock detection to ignore locks from unrelated workspaces. (@jjjermiah)

**Thank you to 2 community contributors:**
- @ariane-emory:
  - fix: correct typo in comment (#24420)
- @jjjermiah:
  - fix(editor): reject lock files with no workspace match for cwd (#24323)


## v1.14.25 — 2026-04-25

## Core

- Fixed permission config preserving rule order and exposes full IntelliSense for tool permission keys
- LSP permission prompts now include request details like the operation, file, and cursor position
- Shell commands keep the correct working directory after login shell startup files run
- Added Roslyn LSP support for Razor, `.cshtml`, and C# script files
- GPT-5.5 with OpenAI OAuth now uses the correct context limits to avoid compaction issues

**Thank you to 2 community contributors:**
- @altendky:
  - fix(opencode): clarify git amend condition to require verifying commit landed (#19937)
- @b0o:
  - fix(build): add prettier to devDependencies (#23255)


## v1.14.24 — 2026-04-24

## Core
- Fixed DeepSeek assistant messages so reasoning is always included, avoiding provider formatting failures.
- Fixed inherited model configs so interleaved-capability models keep working when that field falls back to an existing model. (@07akioni)
- Added an experimental HTTP API endpoint for MCP server status.
- Added experimental HTTP API endpoints to list files, read file contents, and check project file status.

**Thank you to 1 community contributor:**
- @07akioni:
  - fix: use existingModel as fallback for interleaved field (#24172)


## v1.14.23 — 2026-04-24

## Core
- Respect custom `.npmrc` registry settings when checking package versions and updates.

## TUI
- Render all non-synthetic text in a user message instead of showing only the first text block.


## v1.14.22 — 2026-04-23

## Core

- Respect `.npmrc` settings during npm installs.
- Let projects store a custom icon override so the chosen icon persists correctly.

## Desktop

- Fix session views and nested session items not getting stuck with stale state when switching between sessions.


## v1.14.21 — 2026-04-23

## Core
- Support pull diagnostics from LSP servers that use them, including C# and Kotlin.
- Fix project detection and caching for bare Git repos and worktrees. (@StevenTCramer)
- Improve session compaction so long threads keep more useful context when older history is summarized.
- Preserve UTF-8 BOMs when files are edited, patched, or rewritten through tools.
- Use Roslyn Language Server for C# support instead of `csharp-ls`. (@jmbryan4)
- Add the high reasoning variant for supported Mistral Small models. (@rubdos)
- Hide unsupported variants for Kimi models that do not expose them.

## TUI
- Fail fast when opening an invalid or missing session instead of starting the TUI in a broken state.
- Skip upgrade checks when auto-update is disabled. (@rahuliyer95)

## Desktop
- Keep project avatar previews consistent between the sidebar and edit dialog.
- Improve project icon overrides so uploaded icons and color fallbacks behave correctly in the edit dialog.
- Improve Linux desktop metadata for app listings and categorization. (@NN708)

**Thank you to 6 community contributors:**
- @rahuliyer95:
  - fix(tui): don't check for version upgrades if it's disabled by the user (#20089)
- @github-actions[bot]:
  - Update VOUCHED list
- @rubdos:
  - feat: add Mistral Small reasoning variant support (issue #19479) (#23735)
- @jmbryan4:
  - feat: replace csharp-ls with roslyn-language-server (#14463)
- @NN708:
  - fix(desktop): update desktop file and MetaInfo file (#14933)
- @StevenTCramer:
  - fix(project): use git common dir for bare repo project cache (#19054)


## v1.14.20 — 2026-04-21

## Core
- Fixed a system theme regression in the TUI.
- Added `GET /config` to the experimental HTTP API.
- Fixed local dynamic imports on Windows when running under Node, improving plugin and tool loading.

## TUI
- Fixed permission replies using remote workspaces so they are sent to the correct workspace.

## Desktop
- Stopped prompt controls from replaying their fade-in animation on every render.
- Added a setting to hide the session progress bar while the agent is working.
- Fixed the Select Server dialog layout so the server list and actions size correctly. (@OpeOginni)
- Fixed synced project updates so desktop project state changes apply reliably.
- Fixed sidebar project avatars to fall back to `icon.url` when no override is set. (@ysm-dev)

## SDK
- Fixed the `WorkspaceAdaptor.create` type to include the `env` parameter. (@jamesmurdza)

**Thank you to 4 community contributors:**
- @heimoshuiyu:
  - fix(ui): use parentID matching instead of positional scan for assistant messages (#23093)
- @ysm-dev:
  - fix(app): fall back to icon.url in sidebar avatar (#18747)
- @jamesmurdza:
  - fix(plugin): add env parameter to WorkspaceAdaptor.create type (#23235)
- @OpeOginni:
  - fix(desktop): adjust layout properties in DialogSelectServer component (#23589)


## v1.14.19 — 2026-04-20

## Core

- Prevented compiled binaries from failing on startup because of a circular session schema dependency.
- Renamed the compaction setting to `preserve_recent_tokens` for the budget that keeps recent turns verbatim.
- Preserved concurrent edits to the same file instead of letting parallel edits overwrite each other.
- Fixed managed installs on Windows and added bundled ripgrep support for Windows ARM64.
- Added NVIDIA as a built-in provider option, including connection docs and required attribution headers. (@anniesurla)
- Kept recent conversation turns verbatim during session compaction so follow-up work keeps more local context.
- Fell back to summarizing the full conversation when preserved recent turns include too much media to fit safely.

## Desktop

- Reduced loading flicker when opening projects and bringing prompt controls online.
- Added a separate terminal font setting and bundled JetBrainsMono Nerd Font Mono.

**Thank you to 1 community contributor:**
- @anniesurla:
  - feat(provider): add NVIDIA to popular providers, docs, and attribution headers (#22927)


## v1.14.18 — 2026-04-19

## Core
- Restore the native ripgrep backend so file search and file listing work reliably again.

**Thank you to 1 community contributor:**
- @ariane-emory:
  - docs: document --dangerously-skip-permissions CLI flag (#23371)


## v1.14.17 — 2026-04-19

## Core
- Preserve executable permissions before Docker builds when artifacts lose their exec bits.
- Fix plugins reinstalling more often than needed.
- Use `display: summarized` by default for Anthropic Bedrock Opus 4.7 requests.
- Detect attachment types from file contents so images and PDFs still work with incorrect or missing extensions.
- Support `OTEL_RESOURCE_ATTRIBUTES` for custom telemetry resource tags.
- Fix package installs when `node_modules` is missing.
- Fix GitHub Copilot Anthropic Haiku requests by disabling unsupported tool streaming.

## TUI
- Add a full-session option when forking from the session dialog.
- Show the session ID in the sidebar on non-production channels.

**Thank you to 1 community contributor:**
- @OpeOginni:
  - fix(desktop): adjust ui tool diff sticky header offset (#23149)


## v1.4.11 — 2026-04-18

## Core
- Fixed workspace routing so requests reach the correct workspace instance.
- Stopped share sync attempts for sessions that were never shared.


## v1.4.10 — 2026-04-17

## Core

- Restored workspace history on connect so existing sessions catch up before live sync resumes
- Passed OTEL exporter settings into managed workspaces so telemetry works there too
- Normalized provider metadata defaults so models still load when catalog data is incomplete
- Passed `EXA_API_KEY` to the `websearch` tool to reduce rate limits (@rasdani)

## TUI

- Added a restore flow for sessions whose workspace is unavailable, with clearer workspace status indicators
- Fixed agent cycling when no agent is selected and improved prompt key handling

**Thank you to 1 community contributor:**
- @rasdani:
  - fix(opencode): pass `EXA_API_KEY` to `websearch` tool to avoid rate limits (#16362)


## v1.4.9 — 2026-04-17

## Core
- Added LLM Gateway as a provider, including config support and model usage reporting. (@smakosh)
- Limited GitHub Copilot Opus 4.7 models to medium reasoning effort to avoid unsupported variants. (@OpeOginni)
- Improved remote workspace reconnection with exponential backoff and clearer failure handling.

## TUI
- Fixed `--session-id` so it opens the requested session after app startup.
- Fixed light mode detection in Ghostty.

## Desktop
- Fixed the beta desktop app so the file tree still appears when enabled in settings.

**Thank you to 3 community contributors:**
- @OpeOginni:
  - fix(opencode): rescrict github copilot opus 4.7 variants to "medium" (#23097)
- @jenperson:
  - docs: adding Mistral to docs as a provider (it is already a provider, just docs update) #23070 (#23072)
- @smakosh:
  - feat: add LLM Gateway provider (#7847)


## v1.4.8 — 2026-04-17

## Core

- Fixed a crash when experimental mode was enabled.
- Let plugin tools return metadata in execute results. (@jquense)
- Show real filenames instead of `/dev/null` in revert diffs.
- Improved workspace session handling when a workspace no longer exists.
- Fixed Windows `ctrl+z` terminal suspend and input undo behavior.
- Enabled Azure prompt caching with a default per-session cache key.

## TUI

- Preserve prompt input when views unmount and remount.
- Keep session list dialogs ordered more consistently within each day.

## Desktop

- Fixed desktop workspace loading so ready state persists correctly.
- Fixed desktop session syncing when loading project data from query cache.
- Added beta desktop settings to hide title bar tools like navigation, search, terminal, status, and file tree.
- Improved desktop session change loading in the review panel.

**Thank you to 1 community contributor:**
- @jquense:
  - fix: preserve plugin tool metadata in execute result (#22827)


## v1.4.7 — 2026-04-16

## Core
- GitHub Copilot `gpt-5-mini` now uses low reasoning effort for better request compatibility. (@thakrarsagar)
- Fixed Github Copilot overbilling issue
- Workspaces now receive your auth context, so provider sign-in carries across workspace sessions.
- Cloudflare AI Gateway now drops `max_tokens` for OpenAI reasoning models so GPT-5 and o-series requests stop failing. (@kobicovaldev)
- Azure models now default `store=true`, fixing requests that require stored responses.
- Claude Opus 4.7 now supports `xhigh` adaptive reasoning. (@GrahamCampbell)
- Claude Opus 4.7 now shows summarized thinking by default.
- TUI plugins now load against the correct project when multiple directories are open.
- The bash tool uses less memory on large command output.
- Experimental workspaces now wait for sync to finish before returning writes, reducing stale reads and missed updates.
- Session restore can now replay a session into another workspace in batches.
- Sessions now retry provider 5xx errors even when the provider SDK does not mark them retryable.

## TUI
- Pasting files or large text no longer inserts content twice.
- `--agent` on the command line is no longer overwritten by the session's saved agent. (@CarloWood)
- Empty LSP, MCP, formatter, and session status responses no longer break TUI sync state.

## Desktop
- Desktop builds now show a Beta or Dev badge in the title bar when applicable.

**Thank you to 8 community contributors:**
- @ariane-emory:
  - fix(core): Remove dead code and documentation related to the obsolete list tool.  (#22672)
- @CarloWood:
  - fix(tui): Don't overwrite the agent that was specified on the command line (#20554)
- @jerome-benoit:
  - fix(nix): add shared package to bun install filters (#22665)
- @GrahamCampbell:
  - feat: Add support for claude opus 4.7 xhigh adaptive reasoning effort (#22833)
- @B67687:
  - fix: align stale bot message with actual 60-day threshold (#22842)
- @trbutler4:
  - fix: add missing glob dependency  (#22851)
- @kobicovaldev:
  - fix(opencode): drop max_tokens for OpenAI reasoning models on Cloudflare AI Gateway (#22864)
- @thakrarsagar:
  - fix(opencode): use low reasoning effort for GitHub Copilot gpt-5 models (#22824)


## v1.4.6 — 2026-04-15

## Core

- Fixed snapshot staging for very long file lists and improved staging performance.
- Fixed OTEL header parsing when a header value contains `=`.

## Desktop

- Fixed prompt submission state updates to avoid failed or inconsistent sends.
- Improved session title input spacing while editing.

**Thank you to 1 community contributor:**
- @github-actions[bot]:
  - Update VOUCHED list


## v1.4.5 — 2026-04-15

## Core
- Export AI SDK telemetry spans to OTLP trace backends.
- Expose the experimental question API schema and OpenAPI spec from `@opencode-ai/server`.
- Expose a reusable question handler factory for custom question API hosts.

## Desktop
- Start desktop shell commands from the home directory.
- Avoid bootstrap error popups while global sync initializes.


## v1.4.4 — 2026-04-15

## Core
- Restored instance and logger context during prompt runs so prompt-time tools and logging behave correctly.
- Kept GitHub Copilot compaction requests valid.
- Restored the flat reply shape for question API responses.
- Persisted MCP OAuth connections that finish immediately, so authenticated servers stay connected.
- Prevented duplicate user messages in ACP clients.
- Stopped emitting `user_message_chunk` events during session and prompt turns in ACP clients. (@RAIT-09)
- Fixed reasoning summary injection for `@ai-sdk/openai-compatible` providers. (@nazarhnatyshen)
- Added the experimental `compaction.autocontinue` hook to stop auto-continuing after compaction.
- Added Alibaba provider support with cache support.
- Snapshots now fully respect `.gitignore`, including previously tracked files.
- Reading images no longer counts against quota.
- Sessions can now update project permissions mid-run. (@remorses)
- Enabled thinking for `zhipuai-coding-plan` and fixed Korean IME truncation. (@claudianus)

## TUI
- Added `opencode export --sanitize` to redact PII and confidential transcript data.
- Fixed diff line number contrast in built-in themes.
- Plugin auth login now asks for an API key when a plugin needs authorization. (@goniz)
- Plugin auth no longer asks for an API key when the plugin has no `authorize` method. (@goniz)

## Desktop
- Fixed the Windows desktop backend hanging before shutdown.

## SDK
- The JavaScript SDK now throws a clear error when an older server responds with HTML instead of the API.

## Extensions
- Plugins can now register custom workspace adaptors that appear in workspace creation.

**Thank you to 9 community contributors:**
- @claudianus:
  - fix: enable thinking for zhipuai-coding-plan & prevent Korean IME truncation (#22041)
- @remorses:
  - feat: allow session permission updates (#22070)
- @simonklee:
  - chore(github): vouch simonklee (#22127)
- @shafdev:
  - fix(opencode): remove spurious scripts and randomField from package.json (#22160)
- @goniz:
  - fix(cli): auth login now asks for api key in handlePluginAuth (#21641)
  - fix(cli): handlePluginAuth asks for api key only if authorize method exists (#22475)
- @github-actions[bot]:
  - Update VOUCHED list
- @nazarhnatyshen:
  - fix(provider): guard reasoningSummary injection for @ai-sdk/openai-compatible providers (#22352)
- @RAIT-09:
  - fix(acp): stop emitting user_message_chunk during session/prompt turn (#21851)
- @gigamonster256:
  - chore(nix): remove external ripgrep (#22482)


## v1.4.3 — 2026-04-10

## Core

- Fixed `agent create` for OpenAI accounts authenticated with OAuth.
- Interrupted Bash commands now keep their final output and truncation details instead of ending as aborted.
- Added fast mode variants for supported Claude and GPT models.

## TUI

- Restored the hidden session scrollbar as the default.

## Extensions

- Added configurable OAuth redirect URIs for remote MCP servers. (@egze)

**Thank you to 2 community contributors:**
- @egze:
  - feat(mcp): add OAuth redirect URI configuration for MCP servers (#21385)
- @simonklee:
  - opencode: lazy-load top-level CLI commands
  - Revert "opencode: lazy-load top-level CLI commands" (#21726)


## v1.4.2 — 2026-04-09

## TUI
- Fix subagents not being clickable until finished


## Desktop

- Removed the forced loading delay while the app connects


## v1.4.1 — 2026-04-09

## Core
- Fix `clangd` choosing `CMakeLists.txt` or `Makefile` as the project root in C and C++ workspaces. (@nonbanana)
- Add permission prompts for GitLab Duo Workflow tool calls instead of auto-running them. (@vglafirov)
- Hide unsupported variants for Big Pickle models.

## TUI
- Show an OpenCode Go subscribe prompt when free usage limits are reached.
- Simplify provider labels in the model and provider pickers.

## Desktop
- Fix terminal connections in same-origin desktop and web app setups. (@OpeOginni)
- Fix session review and change lists when diff data arrives in inconsistent shapes.

## SDK
- Fix the generated SDK and OpenAPI types for `/providers` and session shell responses.

**Thank you to 3 community contributors:**
- @OpeOginni:
  - fix(app): skip url password setting for same-origin server and web app (#19923)
- @vglafirov:
  - feat(llm): integrate GitLab DWS tool approval with permission system (#19955)
- @nonbanana:
  - fix(lsp): remove CMakeLists.txt and Makefile from clangd root markers (#21466)


## v1.4.0 — 2026-04-08

## Breaking Changes in SDK

Due to some performance issues we had to make a few breaking changes in our data model.

### Diff metadata
The diffs contained in the metadata for the edit and patch tool will no longer contain a `to` and `from` field with full file contents. they will only contain a `patch` field with the unified diff

Additionally all snapshot diffs contained in user message and session diff will follow this format

### `UserMessage.variant`

Before the user message had a `variant` field - it is now nested under `model` so `userMessage.model.variant`

## Core
- Added OTLP observability export support.
- Fixed failed web fetches leaving stale timeouts behind.
- Improved `opencode login` transport error messages.
- Retried Alibaba provider rate-limit errors instead of failing immediately.
- Kept model variants scoped to the selected model.
- Added full HTTP proxy support.
- Fixed OpenRouter provider issues.
- Aligned GitHub Copilot Anthropic reasoning levels and removed incorrect Qwen variants.
- Reduced TypeScript LSP memory use by using the native project config. (@derekbar90)

## TUI
- Added a keybinding option for "Switch model variant". (@ariane-emory)
- Added PDF drag and drop for attachments. (@gitpush-gitpaid)
- Added `opencode run --dangerously-skip-permissions` to auto-approve non-denied permission prompts.

## Desktop
- Improved subagent sessions with clearer titles, navigation, and progress states.
- Moved auto-accept permissions into Settings.
- Showed full file names on attachment chips.

**Thank you to 4 community contributors:**
- @derekbar90:
  - fix(lsp): MEMORY LEAK: ensure typescript server uses native project config (#19953)
- @mchenco:
  - docs: update Cloudflare provider setup to reflect /connect prompt flow (#20589)
- @gitpush-gitpaid:
  - feat(opencode): Add PDF attachment Drag and Drop (#16926)
- @ariane-emory:
  - fix(tui): use sentence case for theme mode command palette items (#21192)
  - feat(tui): allow variant_list keybind for the "Switch model variant" command (#21185)


## v1.3.17 — 2026-04-06

## Core
- Cloudflare Workers AI and AI Gateway now prompt for missing account details and show clear setup errors when required Cloudflare variables are missing (@mchenco)

## TUI
- Restored the default kitty keyboard handling on Windows terminals to avoid input issues from the workaround rollback

**Thank you to 1 community contributor:**
- @mchenco:
  - fix: show clear error when Cloudflare provider env vars are missing (#20399)


## v1.3.16 — 2026-04-06

## Core

- Support Azure model options on both chat and responses paths (@meruiden)
- Expose session model and mode config options through ACP (@georgeharker)
- Add a separating blank line before read tool file contents for clearer output
- Fix output token totals when reasoning tokens are reported separately

## TUI

- Default `Ctrl+Z` to undo on Windows instead of terminal suspend
- Let you disable TUI mouse capture in config or with `OPENCODE_DISABLE_MOUSE` (@blackheaven)
- Hide org switching when there is only one org to choose from
- Label Console-managed providers and let you switch orgs from the provider UI

## Extensions

- Fix plugin installs from npm aliases and git URLs, including Windows cache path issues

**Thank you to 3 community contributors:**
- @blackheaven:
  - feat(tui): make the mouse disablable (#6824, #7926) (#13748)
- @georgeharker:
  - fix(core): implement proper configOptions for acp (#21134)
- @meruiden:
  - fix: pass both 'openai' and 'azure' providerOptions keys for @ai-sdk/azure (#20272)


## v1.3.15 — 2026-04-04

## Core
- Prevent npm installs from failing when Arborist hits the compiled binary's `node-gyp` path

**Thank you to 1 community contributor:**
- @Yuxin-Dong:
  - refactor: remove redundant Kimi skill section (#20393)


## v1.3.14 — 2026-04-04

## Core
- Restored git-backed review modes, including uncommitted and branch diffs.
- Fixed revert chains so restoring an earlier message also restores the right snapshot state. (@natewill)
- Added macOS managed preferences for MDM-enforced config. (@lennyvaknine43)
- Fixed sessions getting stuck after tool calls with OpenAI-compatible providers. (@valenvivaldi)
- Kept compaction summaries in the conversation's language. (@aaron-he-zhu)
- Added Venice AI as a provider. (@dpuyosa)
- Respected model-specific `limit.input` overrides. (@ykswang)

## TUI
- Kept the prompt cursor with dialogs instead of refocusing the background prompt.
- Added a one-time confirmation before sharing a session for the first time.
- Applied scroll settings consistently across TUI scroll views.
- Kept text selections intact during global key handling.
- Fell back to the first available agent if the last-used agent is unavailable.

## Desktop
- Added file mentions in review comments.
- Restored prompt focus after closing agent, model, and variant pickers.
- Added keyboard navigation and shortcuts to the question dock.
- Hid model controls in shell mode.
- Stopped the todo dock from auto-scrolling while tasks update.

## SDK
- Fixed JS SDK server and TUI launch and shutdown on Windows.
- Fixed object-defined `Tool.define()` tools from wrapping `execute` multiple times. (@jpcarranza94)

## Extensions
- Added support for theme-only plugin packages.

**Thank you to 12 community contributors:**
- @github-actions[bot]:
  - Update VOUCHED list
- @JosXa:
  - fix: normalize filepath in FileTime to prevent Windows path mismatch (#20367)
- @valenvivaldi:
  - fix(core): prevent agent loop from stopping after tool calls with OpenAI-compatible providers (#14973)
- @aaron-he-zhu:
  - fix(session): compaction agent responds in same language as conversation (#20581)
- @dpuyosa:
  - feat(opencode): Add Venice AI package as dependency (#20570)
- @noamzbr:
  - feat: add optional messageID to ShellInput (#20657)
  - feat(acp): Add messageID and emit user_message_chunk on prompt/command (#18625)
- @BYK:
  - fix(format): use biome format instead of check to prevent import removal (#20545)
- @lennyvaknine43:
  - feat: add macOS managed preferences support for enterprise MDM deployments (#19178)
- @ykswang:
  - fix(opencode): honor model limit.input overrides (#16306)
- @jpcarranza94:
  - fix: prevent Tool.define() wrapper accumulation on object-defined tools (#16952)
- @kflansburg:
  - feat: Send x-session-affinity and x-parent-session-id headers (#20744)
- @natewill:
  - fix(core): fix restoring earlier messages in a reverted chain (#20780)


## v1.3.13 — 2026-04-01

- Bump opentui version


## v1.3.12 — 2026-03-31

## Core
- Enabled prompt caching and cache token tracking for Google Vertex Anthropic. (@major)
- Fixed Azure provider options being forwarded correctly after the AI SDK v6 migration.

## TUI
- Fixed plugin `replace` slots mounting content more than once.

**Thank you to 2 community contributors:**
- @major:
  - feat: enable prompt caching and cache token tracking for google-vertex-anthropic (#20266)
- @github-actions[bot]:
  - Update VOUCHED list


## v1.3.11 — 2026-03-31

## Core

- Add a dedicated system prompt for Kimi models. (@Yuxin-Dong)

## TUI

- Improve TUI terminal output passthrough so external command output renders more reliably.

## Extensions

- Skip plugins that do not expose a matching server or TUI entrypoint, warn instead of failing, and apply default options from package exports on install.
- Pin explicit plugin versions during install and block package install scripts from running.

**Thank you to 1 community contributor:**
- @Yuxin-Dong:
  - feat: add a dedicated system prompt for Kimi models (#20259)


## v1.3.10 — 2026-03-31

## Core
- Subagent tool calls stay clickable while they are pending.
- Improved storage migration reliability so malformed legacy records or failed migrations do not corrupt upgraded state.

## TUI
- Improved muted text contrast in the Catppuccin themes.


## v1.3.9 — 2026-03-30

## Core

- Fixed plugin entrypoint resolution for paths without leading dot


## v1.3.8 — 2026-03-30

No notable changes

## v1.3.7 — 2026-03-30

## Core

- Added first-class PowerShell support on Windows
- Plugin installs now preserve JSONC comments in configuration files
- Fixed `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT` not being respected for project-level CLAUDE.md

## TUI

- Improved variant modal behavior to be less intrusive
- Added theme colors for dialog textarea placeholders

**Thank you to 2 community contributors:**
- @KnutZuidema:
  - fix: discourage _noop tool call during LiteLLM compaction (#18539)
- @yejiming:
  - docs: rename patch tool to apply_patch and clarify apply_patch behavior (#19979)


## v1.3.6 — 2026-03-29

# Unreleased Changes

## TUI

- PR #19917: Fixed variant dialog search so typing now properly filters the list of variants

## Desktop

## Core

- PR #19758: Fixed token usage double-counting for Anthropic and Amazon Bedrock providers that caused inflated token counts in session metrics


## v1.3.5 — 2026-03-29

## Core
- Fix plugin hooks to properly handle async operations
- Adjust GPT prompt to be more minimal and fix file reference annoyances

## v1.3.4 — 2026-03-29

## Core
- Add prompt slot feature
- Update opencode-gitlab-auth to 2.0.1 (@vglafirov)
- Refactored session processor to use effect-based architecture
- Use AppFileSystem instead of raw Filesystem for better abstraction
- Upgrade OpenTUI to version 0.1.91
- Adjust bash tool description to increase cache hit rates between projects
- Update Effect to version 4.0.0-beta.42
- Refactor session compaction service to use Effect
- Add single target plugin entrypoints
- Use ChildProcessSpawner instead of Process.spawn for formatting
- Move more responsibility to workspace routing
- Refactor Session service to use Effect-based architecture
- Add support for AI SDK v6
- Add additional overflow error patterns to error handling
- Fix flaky plugin tests by removing mock.module which is not supported in Bun
- Split out instance and route through workspaces
- Effectify Plugin service internals
- Effectify Skill service internals
- Add TUI plugins support
- Refactor tool registry to yield Config and Plugin services using Effect.forEach
- Ignore generated models snapshot files
- Replace async git() with ChildProcessSpawner in VCS module
- Yield services instead of promise facades in Effect refactor
- Fixed web UI bundle build on Windows
- Improve app startup performance
- Close MCP transport on failed or timed-out connections
- Use cachedInvalidateWithTTL for config and bump Effect to beta.37
- Refactor Config service to use Effect
- Remove workspace server and WorkspaceContext, improve routing architecture
- Add GPT prompt so non-Codex GPT models have their own system prompt modeled after Codex CLI
- Refactor LSP service with InstanceState using Effect

## TUI
- Use theme color for prompt placeholder
- Add dialog variant menu and improve subagent functionality
- Open dialog for model variant selection instead of cycling
- Check KV theme before falling back to default theme
- Add top spacing to session view and remove obsolete documentation prompt
- Restore subagent footer and fix style guide violations
- Add model variant selection dialog
- Remove variant cycle display from footer
- Move session context into prompt footer

## Desktop
- Improved app startup efficiency
- Use Azure Artifact Signing for Windows releases
- Default file tree to closed with minimum width
- Resize layout viewport when mobile keyboard appears (@BYK)
- Persist queued followups across project switches
- Reduce markdown jank while responses stream in UI
- Remove fork session button from app
- Default shell tool to collapsed state
- Don't bundle fonts in app

**Thank you to 3 community contributors:**
- @BYK:
  - fix(app): resize layout viewport when mobile keyboard appears (#15841)
- @vglafirov:
  - fix: update opencode-gitlab-auth to 2.0.1 (#19552)
- @gigamonster256:
  - fix: respect semver build identifiers for nix (#11915)
  - fix: nix embedded web-ui support (#19561)


## v1.3.3 — 2026-03-26

## TUI

- Bypass local SSE event streaming in worker for improved performance (#19183)
- Fix image paste support on Windows Terminal 1.25+ with kitty keyboard enabled (#17674)

## Desktop

- Embed WebUI directly in the binary with configurable proxy flags (#19299)
- Fix agent normalization in desktop app (#19169)
- Fix project switch flickering when using keybinds by pre-warming globalSync state (#19088)
- Move message navigation from cmd+arrow to cmd+opt+[ / cmd+opt+] to preserve native cursor movement (#18728)
- Add createDirectory option to directory picker in Electron app (#19071)
- Remove `.json` extension from electron-store for seamless Tauri to Electron migration (#19082)

## Core

- Initial implementation of event-sourced syncing system for session data (#17814)
- Fix enterprise URL not being set properly during authentication flow (#19212)
- Classify ZlibError from Bun fetch as retryable instead of unknown error (#19104)
- Skip snapshotting files larger than 2MB to improve performance (#19043)
- Respect agent permission configuration for todowrite tool (#19125)
- Fix DWS workflow tools being silently cancelled due to missing tool approval support (#19185)
- Fix MCP servers disappearing after transient errors and improve OAuth handling (#19042)

## Misc

- Revert git-backed review modes to restore compatibility with older CLI builds (#19295)

## v1.3.2 — 2026-03-24

## TUI

- Added heap snapshot functionality allowing users to capture memory snapshots of both TUI and server processes via the "Write heap snapshot" command. Snapshots are saved to `tui.heapsnapshot` and `server.heapsnapshot` files.


## v1.3.1 — 2026-03-24

## Features

- Added Poe as a built-in authentication provider with OAuth and API key support (#18477)
- Enabled token caching for custom Amazon Bedrock providers (#18959)
- Added syntax highlighting support for Kotlin, HCL, Lua, and TOML files (#18198)
- Added manual lock/unlock for theme mode (#18905)

## Fixes

- Fixed session timeline jumping when scrolling (#18993)
- Fixed GitLab Duo Workflow models showing incorrect identity (#18928)
- Fixed theme mode switching between dark and light modes (#18851)
- Fixed console account URL handling for better navigation (#18809)
- Fixed session busy state handling for better responsiveness (#18758)
- Fixed stale session hover preview (#18727)
- Fixed project hover state (#18732)
- Fixed prompt history navigation (#18775)
- Fixed filtering of non-renderable part types (#18926)
- Fixed ProviderIcon optional chaining issue (#18927)
- Fixed process cleanup when closing terminal tabs (#16057)
- Fixed batching of multi-file prompt attachments via picker, paste, and drag-drop (#18722)
- Fixed patch tool counts visibility when displaying files with long names (#18678)
- Fixed project avatar popover flicker when switching projects via sidebar (#18660)

## Improvements

- Improved startup efficiency (#18985)
- Updated Feishu community links for Chinese (zh) locales (#18975)
- Improved file tree panel to maintain its minimum width when resized (#18777)
- Improved desktop app stability with more robust sidecar process cleanup (#18742)
- Changed command palette shortcut to `Cmd+K` (with `Cmd+P` still working as fallback) (#18731)
- Restored keyboard project switching in open sidebar with proper Enter key activation (#18682)

## v1.3.0 — 2026-03-22

## Important

- Removed anthropic oauth plugin, see: https://github.com/anomalyco/opencode/pull/18186/changes

## New Features

- **GitLab Agent Platform** (#18014): GitLab Agent Platform is now fully supported with automatic discovery of workflow models from your GitLab instance. Workflow models can use opencode's local tools (file read/write, shell, etc.) over WebSocket.
- **Git-backed Session Review** (#17961): Added git-backed session review modes, enabling users to review uncommitted changes and branch diffs directly within opencode. Git changes are now the default review source with the desktop review tree staying synchronized with your selected source.
- **Multistep Authentication** (#18103, #18035): TUI and Desktop both support multistep authentication flows which means providers like Github Copilot for Enterprise deployments now work as intended
- **Interactive Update Flow** (#18662): Major and minor updates now show a confirmation dialog before upgrading, allowing you to review changes before updating. You can also skip specific versions if you prefer to stay on your current release.
- **Node.js Support** (#18324): opencode can now run on Node.js in addition to Bun, with a dedicated Node.js entry point and build script that bundles the server with database migrations.

## Desktop App Improvements

- **Project Navigation** (#18502): Navigate between projects faster using keyboard shortcuts (cmd+option+arrow keys).
- **File Uploads** (#18403): Desktop app now supports file type filters and multiple file selection when uploading files.
- **Workspace Switching** (#18207): Fixed visual flickering when switching between workspaces or projects - the interface now transitions smoothly without showing loading spinners during navigation.
- **Sidebar Resize** (#18647): Fixed issue where sidebar would automatically close when being resized to minimum width. The sidebar now clamps at minimum width instead of closing.
- **Loading States** (#18501): Improved loading state management across the app for smoother, more consistent feedback during async operations.
- **Console Login** (#18281): Fixed console device login to properly handle pending authorization states, ensuring the login process continues polling instead of failing while waiting for approval.

## Terminal & Editor

- **Terminal Rename** (#18263): Fixed terminal renaming from the context menu, which previously failed due to dropdown focus conflicts.
- **Terminal Error Recovery** (#17591): Fixed an issue where terminals would become unresponsive when the server returned a "not found" error for terminal sessions. Terminals now properly reinitialize and remain interactive.
- **Paste Operations** (#18079): Paste operations now preserve raw byte data, enabling proper handling of binary content and special characters when pasting into the terminal.
- **Prevent Duplicate Submits** (#18148): Fixed issue where rapidly pressing Enter could submit prompts multiple times. Now ignores repeated Enter submits.

## Providers & Models

- **xAI Responses API** (#18175): Improved xAI reasoning models performance in long multi-turn conversations by switching to the responses API with encrypted content support.
- **GPT Model List** (#18101): Updated the GPT subscription model list with the latest available models.
- **Vertex AI Fix** (#18283): Fixed Vertex AI errors with non-thinking models (like gemini-2.0-flash) by only applying thinking configuration to models that support reasoning capabilities.
- **vLLM Context Overflow** (#17763): Improved error detection for vLLM context overflow errors, providing clearer feedback when context limits are exceeded during inference.
- **Cost Chunk Format** (#16817): Fixed streaming error where cost data was sent in upstream provider format instead of client-requested format, preventing validation errors when mixing provider formats.

## Review & Collaboration

- **File Attachments** (#17815): Fixed file and image attachments being silently lost when reusing or forking a previous prompt with attachments.
- **Snapshot Revert** (#18093): Fixed snapshot revert issues where overlapping file changes could apply the wrong patch hash, and resolved a sorting bug in hidden file ordering.

## Authentication & Account

- **Stale Credentials** (#18426): Fixed stale server URL and email on re-login. Previously, logging into a different server could fail due to cached credentials from a previous environment.
- **Codex Access** (#18337): OAuth plan users can now access codex instructions freely without the previous whitelisting restrictions.

## UI/UX Improvements

- **Theme Improvements** (#17958): Improved UI contrast and reduced brightness of hover/active elements for better readability and reduced eye strain.
- **System Prompt** (#18140): Cleaner AI responses with a streamlined fallback system prompt that removes unnecessary boilerplate text.
- **Agent & Skill Ordering** (#18261): More consistent AI responses with improved prompt caching by stabilizing the order of agents and skills in system prompts.

## Bug Fixes

- **Remote Server Switching** (#17214): Fixed issues when switching between remote servers that caused stale project data, broken terminal spawning, and sidebar showing incorrect projects.
- **Windows Commands** (#18010): Fixed Windows command execution for shims (.cmd/.bat files) to resolve failures during upgrades, uninstalls, IDE installs, and LSP launches.
- **Tool Discovery** (#18320): Fixed tool discovery for npm-installed packages by including the cache bin directory in PATH lookups, ensuring locally installed tools are properly found.
- **Error Messages** (#18165): Tool and session error messages now display in clean, human-readable format instead of showing confusing technical error strings.
- **Chunk Timeout** (#18264): Disabled chunk timeout by default to prevent issues across various use cases; users can still enable it in their configuration if needed.
- **Event Ordering** (#18259): Events in real-time streams now process sequentially in order, ensuring consistent and predictable event display instead of potentially out-of-order delivery.
- **Desktop Stability** (#18300): Improved desktop stability with more reliable workspace and session routing, fixing sidebar selection mismatches and race conditions when switching projects.

**Thank you to 16 community contributors:**
- @jquense:
  - fix(opencode): preserve prompt tool enables with empty agent permissions (#17064)
- @bugulo:
  - fix(app): agent switch should not reset thinking level (#17470)
- @ghost91-:
  - fix(core): consider code: context_length_exceeded as context overflow in API call errors (#17748)
  - fix(core): detect vLLM context overflow errors (#17763)
- @Tarquinen:
  - fix(opencode): apply message transforms during compaction (#17823)
- @AbigailJixiangyuyu:
  - fix(windows): restore /editor support on Windows (#17146)
- @altendky:
  - fix(tui): check for selected text instead of any selection in dialog escape handler (#16779)
  - docs: add describe annotation to snapshot config field (#17861)
- @OpeOginni:
  - docs: mark tools config as deprecated (#17951)
  - docs(cli): update experimental TY LSP flag description for clarity across multiple languages (#14770)
  - fix(desktop): fix error handling by adding errorName function to identify NotFoundError rather than statusCode (#17591)
  - fix(desktop): remote server switching (#17214)
- @ariane-emory:
  - fix: Add apply_patch to EDIT_TOOLS filter (#18009)
- @anduimagui:
  - fix(app): ignore repeated Enter submits in prompt input (#18148)
- @jorgitin02:
  - fix: stabilize agent and skill ordering in prompt descriptions (#18261)
- @Jaaneek:
  - feat: switch xai provider to responses API (#18175)
- @mchenco:
  - docs: add Cloudflare Workers AI provider (#18322)
- @vglafirov:
  - feat: enable GitLab Agent Platform with workflow model discovery (#18014)
- @github-actions[bot]:
  - Update VOUCHED list
- @Protocol-zero-0:
  - fix(provider): only set thinkingConfig for models with reasoning capability (#18283)
- @neriousy:
  - fix(app): terminal rename from context menu (#18263)

## v1.2.27 — 2026-03-16

## Core
- Fixed VCS watcher if statement logic
- Delete legacy permission module
- Clean up pending entry when question is aborted
- Remove SIGHUP exit handler
- Effectify PermissionNext and fix InstanceState ALS bug
- Inline branded ID schemas
- Refactor QuestionService to use effects
- Ensure that compaction message is tracked as agent initiated
- Increase default chunk timeout from 2 minutes to 5 minutes
- Fix lost sessions across worktrees and orphan branches (@michaeldwan)
## Desktop
- Remove open label from UI
- Handle multiline web paste in prompt composer

**Thank you to 4 community contributors:**
- @michaeldwan:
  - fix(opencode): lost sessions across worktrees and orphan branches (#16389)
- @marcusschiesser:
  - fix(ui): prevent long filenames from overlapping actions (#17151)
- @Gojer16:
  - docs(es): fix Spanish intro page translation, grammar, and terminology (#17563)
- @erikengervall:
  - docs: Add opencode-firecrawl to ecosystem documentation (#17672)

## v1.2.26 — 2026-03-13

## Core
- Scaffold effect-to-zod bridge for schema conversion
- Serialize configuration for Bun installations
- Support text attachments in app
- Paginate session history for improved server performance
- Sessions lost after git init in existing project (@michaeldwan)
- Fail fast on config dependency installs in end-to-end tests
- Filter empty content blocks for Bedrock provider (@Tom-Ryder)
- Refactor ProviderAuthService to use Effect pattern
- Add console account subcommands to CLI
- Refactor AuthService to use Effect pattern
## TUI
- Hide console command from help output
- Remove OpenRouter warning
- Reorder provider list in providers login
## Desktop
- Model selection now persists by session
- Polish prompt composer controls
- Synchronize sidebar state across the application
- Use new-session icon in sidebar buttons
- Avoid clipping new session during sidebar animation
- Animate titlebar controls on sidebar open
- Restore sidebar dash and sync session spinner colors
- Fork should copy prompt into new session
- Improved sidebar spacing and session list spinner transition
- Terminal cloning without retry
- Scroll falls behind prompt input
- Adjust spacing in todo list component
- Better optimistic prompt submit in app
- Synchronize internationalization translations
- Use cursor session history loading for improved performance
- List item background colors fixed in app
- Stabilize todo dock end-to-end tests with composer probe
- Desktop multi-window support added to Electron
- Increase CI end-to-end test workers

**Thank you to 2 community contributors:**
- @Tom-Ryder:
  - fix: filter empty content blocks for Bedrock provider (#14586)
- @michaeldwan:
  - fix(opencode): sessions lost after git init in existing project (#16814)

## v1.2.25 — 2026-03-12

## Core
- Support non-OpenAI Azure models that use completions endpoints
- Flow branded ProviderID and ModelID through internal signatures
- Brand ProviderID and ModelID types for improved type safety
- Remove external sourcemap generation to reduce build artifacts
- Brand PermissionID, PtyID, QuestionID, and ToolID types for improved type safety
- Add ARM64 release targets for Windows CLI and desktop
- Brand PartID through Drizzle and Zod schemas
- Brand WorkspaceID through Drizzle and Zod schemas
- Resolve symlinks in Instance cache to prevent duplicate contexts (@jmylchreest)
- Brand SessionID through Drizzle and Zod schemas
- Restore plugin serverUrl getter so plugins can connect to local server
- Re-enable snapshot in ACP (@noamzbr)
- Adjust skill presentation to reduce token usage
- Brand ProjectID through Drizzle and Zod schemas
- Tighten effect-based account flows
- Read stdout and stderr in PackageRegistry.info before waiting for process to exit (@ghost91-)
- Improve skill presentation to agent to increase likelihood of skill invocations
- Hide Windows background consoles in Electron
- Add GOOGLE_VERTEX_LOCATION environment variable support for Vertex AI (@SOUMITRO-SAHA)
- Implement resilient organization data fetching with error handling
- Make account login upgrades safe while adding multi-account workspace authentication
- Don't permit access to system directories
- Allow passing workspaceID into session create endpoint
- Fixed chunk timeout when processing LLM stream
- Make worktrees read the project ID from local workspace
- Add thinking variants support for SAP AI provider (@jerome-benoit)
- Upgrade OpenTUI to v0.1.87
- Fix OAuth auto-connect failing on first MCP connection (@domdomegg)
- Extract createApp function for server initialization
- Put workspace routing behind OPENCODE_EXPERIMENTAL_WORKSPACES flag
- Replace Bun semver with npm semver package
- Replace Bun shell with direct spawn calls in core flows
- Change pathToFileURL imports from bun to url module
- Multiple jdtls LSPs eating memory in Java monorepos (@stevoland)
## TUI
- Use parse() at boundaries instead of manual make() for imports
- Wait for model store before auto-submitting --prompt in TUI (@altendky)
- Handle error when creating a session in TUI
## Desktop
- Fix broken mobile sidebar sizing issue in workflows mode (@5w14)
- Fixed terminal animation in application
- Fix sidebar quirks in app
- Rework default server initialization and connection handling in desktop client
- Fix terminal e2e test flakiness by implementing a real terminal driver
- Set default WebSocket username and fix terminal spawn lifecycle issues in desktop app (@OpeOginni)
- Theme Windows titlebar overlay in Electron
- Guard comment accessor in message timeline
- Re-focus prompt after terminal opens in slash-terminal test
- Restore to message and fork session functionality in app
- Todos not clearing in app
- Skip editor reconcile during IME composition (@ysm-dev)
- Simplify review pane
- Trim session render work in app for improved performance
- Fix tests in app package
- Fixed terminal jank in the app
- Fixed terminal focus issues and reduced jank in the app
- Add debug window to app
- Display development statistics in the application
- Terminal state corruption fixed
## SDK
- Fix ESM imports for @opencode-ai/plugin

**Thank you to 15 community contributors:**
- @stevoland:
  - fix: Multiple jdtls LSPs eating memory in java monorepos (#12123)
- @altendky:
  - fix(tui): wait for model store before auto-submitting --prompt (#7476)
- @bhaktatejas922:
  - docs: update opencode-morph-fast-apply to opencode-morph-plugin in ecosystem (#16634)
  - docs: update opencode-morph-plugin in all language ecosystem pages (#16869)
- @domdomegg:
  - fix(mcp): fix OAuth auto-connect failing on first connection (#15547)
- @jerome-benoit:
  - fix(opencode): add thinking variants support for SAP AI provider (#14958)
- @SOUMITRO-SAHA:
  - fix: add GOOGLE_VERTEX_LOCATION env var support for Vertex AI (#16922)
- @neriousy:
  - fix(app): make error tool card respect settings (#17005)
- @andyWang1688:
  - docs(providers): clarify npm choice for chat vs responses APIs (#16974)
- @ghost91-:
  - fix(core): read stdout and stderr in PackageRegistry.info before waiting for the process to exit (#16998)
- @ysm-dev:
  - fix(app): skip editor reconcile during IME composition (#17041)
- @noamzbr:
  - fix: re-enable snapshot in acp (#14918)
- @jmylchreest:
  - fix: resolve symlinks in Instance cache to prevent duplicate contexts (#16651)
- @OpeOginni:
  - fix(desktop): set default WebSocket username and prevent repeated calling of terminal spawn properly closing the terminal (#17061)
- @5w14:
  - fix(web): fix broken mobile sidebar (in workflows mode) sizing issue by adding flex-1 (#17055)
- @Wangmerlyn:
  - docs: clarify subagent session navigation keybinds (#16455)

## v1.2.24 — 2026-03-09

## Core
- Add initial support for workspaces into the TUI
- Send context-1m-2025-08-07 beta header to GitLab to enable 1M context window (@Krule)
- Add Copilot GPT-5.4 xhigh support
## Desktop
- Fix scroll jitter and loop issues in app
- Session title turn spinner now displays correctly
- Dismiss toast notifications when questions or permissions are resolved (@neriousy)

**Thank you to 3 community contributors:**
- @Krule:
  - feat(gitlab): send context-1m-2025-08-07 beta header to enable 1M context window (#16153)
- @ShriKaranHanda:
  - fix(storybook): add ci build workflow (#16760)
- @neriousy:
  - fix(app): dismiss toast notifications when questions or permissions a… (#16758)

## v1.2.23 — 2026-03-09

## Core
- Disable fallback to free nano for small model requests
## TUI
- Pass missing auth headers in run --attach (@ericclemmons)
## Desktop
- Remove oc-1 theme from app
- Fix sidebar workspace container sizing to prevent content overflow
- Don't animate review panel in/out
- Revert "Stupid Sexy Timeline" feature
- Sanitize workspace store filenames on Windows
- Generate color palettes in app

**Thank you to 3 community contributors:**
- @ariane-emory:
  - docs: add session_child_first keybinding to documentation (#16631)
- @ericclemmons:
  - fix(opencode): pass missing auth headers in `run --attach` (#16097)
- @yihuikhuu:
  - fix(app): fix issue with scroll jumping when pressing escape in comment text area (#15374)

## v1.2.22 — 2026-03-08

## Core
- Canonicalize current working directory after changing directories in TUI
- Fix broken MCP toggling in TUI (@natewill)
- Update database path test to verify correct channel-based filename
- Allow beta channel to share database with stable channel
- Add OPENCODE_SKIP_MIGRATIONS flag to bypass database migrations
## TUI
- Guard TUI exit to prevent premature termination
- Avoid TTY corruption from double cleanup (@tobwen)
## Desktop
- Fix sidebar background color when collapsed
- Suppress hover when opening project menu or right-clicking to prevent flickering
- Trim retained desktop terminal buffers
- Messages not loading reliably
- Prune and evict stale app session caches
- Restore new-session logo on dev so users recognize OpenCode immediately
- Revert new session logo on dev branch to ship UI change with auto-accept-permissions feature
- Add OpenCode logo to new session screen for immediate app identification
- Revert prompt control docking in TUI
- Dock auto-accept after thinking and move Add file to bottom-left
- Balance titlebar columns so center content doesn't get squeezed by long side content
- Center empty states vertically in session view and improve review panel messaging for projects without version control
- Review panel transition fixed in app

**Thank you to 3 community contributors:**
- @natewill:
  - fix(tui): fix broken /mcp toggling (#16431)
- @tobwen:
  - fix(opencode): avoid TTY corruption from double cleanup (#16565)
- @Bezkup:
  - docs(zen.mdx): correct Italian grammar and punctuation errors (#16590)

## v1.2.21 — 2026-03-07

## Core
- Preserve original line endings in edit tool (@ranqn)
- Fix Git path resolution for modified files across Git Bash, MSYS2, and Cygwin on Windows
- Fix PTY session handle leak (@kikuchan)
- Sanitize preview database filenames
- Log stack trace when schema validation fails
- I need to see the actual commit diff to understand what was fixed and provide an accurate changelog entry.
- Add project git init API
- Update Drizzle and channel database handling
- Speed up share loads
- Enable auto-accept keybind regardless of permission config (@luisfelipesena)
## TUI
- Fix broken /export toggling in TUI (@natewill)
## Desktop
- Guard session-header current() against undefined when options is empty (@cyberprophet)
- Preserve file tree tab on reopen and fix e2e test regressions (@neriousy)
- Remove close button from project hover popover
- New session uses agent model/variant
- Model sticks to session after being changed
- Based on the commit message "fix(app): all panels transition", here's the changelog entry:

All panels transition correctly
- Can't scroll files in app
- Fix maximum width on timeline component
- Align session empty states in TUI
- Add interactive timeline visualization feature
- Share workspace slug wait helper across e2e specs
- Abort sessions and wait for idle before e2e cleanup
- Show skill issue when snapshotting is off in desktop app
- Fix portal positioning for sidebar menus and tooltips by removing conditional mount logic
- Add end-to-end tests for app (part 67) (@neriousy)
- Add sidebar reveal animation, hover peek overlay, and weaker dividers to app
- Better review and file tree empty states
- Enable Safari autocorrect in normal mode, disable in shell mode (@alexandrereyes)
- Revert stale read error fix in app
- Add English to locale matchers (@KirillTregubov)

**Thank you to 12 community contributors:**
- @luisfelipesena:
  - fix(app): enable auto-accept keybind regardless of permission config (#16259)
- @imdzx:
  - feat: Add Vietnamese README and update all language navigation links … (#16322)
- @KirillTregubov:
  - fix(app): add english to locale matchers (#16280)
- @hoshiumiarata:
  - fix(ui): prevent unwanted key events during composition in LineCommentEditor (#16361)
- @alexandrereyes:
  - fix(app): enable Safari autocorrect in normal mode, disable in shell mode (#15563)
- @neriousy:
  - tests(app): e2e tests part 67 (#16406)
  - fix(app): preserve file tree tab on reopen + fix e2e test regressions (#16482)
- @kikuchan:
  - fix(pty): pty session handle leak (#15599)
- @ShriKaranHanda:
  - fix(config): point GitHub PR search tool at current repository (#16441)
  - fix(storybook): restore build by mocking useLocation (#16472)
- @natewill:
  - fix(tui): fix broken /export toggling (#16443)
- @ranqn:
  - fix(opencode): preserve original line endings in 'edit' tool (#9443)
- @cyberprophet:
  - fix(app): guard session-header current() against undefined when options is empty (#16478)
- @Eric-Guo:
  - fix(app): text-shimmer undefined length (#16475)

## v1.2.20 — 2026-03-06

## Core
- Stop leaking fsmonitor daemons that caused 60GB+ of committed memory after running tests
- Replace Bun.which with npm which in OpenCode
## TUI
- Restore Bun stdin reads for prompt input

## v1.2.19 — 2026-03-06

## Core
- Add GPT-5.4 to Codex allowed models list (@msadiks)
- Replace Bun.stderr and Bun.color with Node.js equivalents
- Replace Bun.connect with net.createConnection for better compatibility
- Use SHA1 for hash instead of unsupported xxHash3-XXH64
- Replace Bun.hash with Hash.fast using xxhash3-xxh64
- Replace Bun.write with Filesystem.write in config files
- Replace Bun.write/file with Filesystem utilities in snapshot
- Replace Bun.sleep with Node.js timers for better compatibility
## TUI
- Use node:stream/consumers for stdin reading
- Replace Bun.stdin.text with Node.js stream reading for better compatibility
## Desktop
- Fix stale show in app (@neriousy)
- Remove keyboard shortcut tooltips from new session and new workspace buttons in the sidebar
- Load tab when opening file

**Thank you to 3 community contributors:**
- @Seungjun0906:
  - fix(console): follow-up for #13108 docs/en routing and locale cookie sync (#13608)
- @neriousy:
  - fix(app): stale show (#16236)
- @msadiks:
  - feat: add "gpt-5.4" to codex allowed models list (#16274)

## v1.2.18 — 2026-03-05

## Core
- Handle SIGHUP signal and kill process gracefully
## TUI
- Add onClick handler to InlineTool and Task components
- Add options to auth login command to skip interactive questions (@dbpolito)
- Don't let Dax touch the UI
## Desktop
- Fork Ghostty for web-based terminal implementation
- Show errors for stale keyed components
- Fixed locale error in app
- Resolve stale read error in app
- Improve provider settings consistency in app
- Preserve question dock state across session switches (@ualtinok)
- Fix icon jiggle in app
- Open search with Mod+F even when editor is not focused
- Improve error handling and translation in desktop server error formatting (@OpeOginni)
- Improve agent selection logic to correctly pass configured models and variants (@OpeOginni)
- Remove unnecessary macOS entitlements
- Add desktop deep link support for creating new sessions
- Prefer using useLocation hook instead of window.location in app
## SDK
- Update SDK package.json

**Thank you to 4 community contributors:**
- @stolinski:
  - docs: Add opencode-sentry-monitor to ecosystem documentation (#16037)
- @dbpolito:
  - feat(opencode): Adding options to auth login to skip questions (#14470)
- @OpeOginni:
  - fix(app): improve agent selection logic passing in configured models and variants correctly (#16072)
  - refactor(desktop): improve error handling and translation in server error formatting (#16171)
- @ualtinok:
  - fix(app): preserve question dock state across session switches (#16173)

## v1.2.17 — 2026-03-04

## Core
- Rework workspace integration and adaptor interface
- Clarify output capture guidance in bash tool documentation
## TUI
- Show scrollbar by default
- Prevent orphaned opencode subprocesses on shutdown
- Validate agent when running with attach flag (@alberti42)
## Desktop
- Remove blur from todos in app
- Delay dock animation on session load
- Remove diff lines from sessions in sidebar
- Loading session should be scrolled to the bottom
- Close terminal tabs properly

**Thank you to 3 community contributors:**
- @Copilot:
  - revert: undo turbo typecheck dependency change from #14828 (#15902)
- @alberti42:
  - fix: `run --attach` agent validation (#11812)
- @Niraj12chaudhary:
  - fix(docs): update dead opencode-daytona ecosystem link (#15979)

## v1.2.16 — 2026-03-03

## Core
- Normalize trailing slashes in auth login URLs (@elithrar)
- Upgrade OpenTUI to v0.1.86 and enable markdown rendering by default
- Avoid Gemini combiner schema sibling injection
- Forward metadata options to Cloudflare AI Gateway provider (@ryanskidmore)
- Clone part data in Bus event to preserve token values (@ryanskidmore)
- Recover from 413 Request Entity Too Large errors via automatic compaction (@bentrd)
- Show human-readable message for HTML error responses (@rianvdm)
- Kill orphaned MCP child processes and expose OPENCODE_PID on shutdown (@ryanwyler)
- Add workspace_id to session table
- Add WorkspaceContext to core
- Basic implementation of remote workspace support
- Change keybindings to navigate between child sessions
- Fixed test issues
- Fixed terminal rendering and interaction issues in the application
## TUI
- Replace curved arrow with straight arrow for better terminal compatibility
- Show pending tool call count in TUI instead of generic 'Running...' message
- Use arrow indicator for active tool execution in TUI
- Disable session navigation commands when no parent session (@jerome-benoit)
- Fixed project ID conflict and updated handling for same session ID (@noamzbr)
- Improve task tool display with subagent keybind hints and spinner animations
- Add Go provider list command
## Desktop
- Defer diff rendering
- Fixed timeline performance jank in the application
- Tighten up header elements in the app
- Stabilize project close navigation
- Add comprehensive animation system with multiple easing functions and transition utilities
- Default auto-respond to false
- Refactor app to use SolidJS
- Move session review bottom padding to UI layer
- Fix latest.json finalizer in desktop application
- Revert Polish Turkish translations
- Use correct download link in finalize-latest-json script
- Faster session switching via windowed rendering and staged timeline
- Add compact UI to the app (@neriousy)
- Polish Turkish translations (@vaur94)
- Fallback to synthetic icon for unknown provider IDs (@rexdotsh)
- Fixed scroll issues in the app
- Synchronize internationalization translations
- Add Warp to the open menu
- Add latest.json finalizer script for desktop builds
- Auto-accept permissions in app
- Add Turkish locale support for app and UI packages (@vaur94)
- Add recent projects section to command palette (@neriousy)
- Move desktop open_path functionality to Rust
- Allow providing username and password when connecting to remote server
- Fixed permission indicator in app
- Add permission notifications to app
- Show keybind on context tab close button
- Better diff and code comments in app
- Deduplicate file tree scroll state management
- Align review changes select height
- Mute inactive file tab icons
- Set max-width on session when review is closed but file tree is open
- Add border to file tree on scroll
- Fix session tab alignment in compact view to prevent vertical overflow
- New tabs styling in the app
- Auto-accept all permissions mode
- Enhance project tile interaction with suppress hover functionality (@OpeOginni)
- Simplify review layout
- Restore shell path environment for desktop sidecar
- Open app in PowerShell instead of Command Prompt on Windows (@neriousy)
## SDK
- Add zen mode feature

**Thank you to 17 community contributors:**
- @neriousy:
  - fix(app): open in powershell (#15112)
  - feat(app): recent projects section in command pallette (#15270)
  - fix(app): show proper usage limit errors (#15496)
  - fix(app): make provider icon resolved id reactive (#15583)
  - feat(app): add compact ui (#15578)
  - feat(app): show which messages are queued (#15587)
- @niushuai1991:
  - docs: Sync zh_CN docs with English Version (#15228)
- @OpeOginni:
  - refactor(desktop): enhance project tile interaction with suppress hover functionality (#15214)
- @pirrozani:
  - docs(readme): add Greek translation and update language navigation (#15281)
- @vaur94:
  - feat(app): add Turkish (tr) locale for app and ui packages (#15278)
  - fix(i18n): polish turkish translations (#15491)
- @Niraj12chaudhary:
  - docs: add missing Bosanski link to Arabic README (#15399)
- @alexyaroshuk:
  - fix(app): make bash output selectable (#15378)
  - fix(app): display skill name in skill tool call (#15413)
- @rexdotsh:
  - fix(app): fallback to synthetic icon for unknown provider IDs (#15295)
- @inkdust2021:
  - docs(ecosystem): add opencode-vibeguard (#15464)
- @ryanwyler:
  - fix: kill orphaned MCP child processes and expose OPENCODE_PID on shu… (#15516)
- @rianvdm:
  - fix(opencode): show human-readable message for HTML error responses (#15407)
- @noamzbr:
  - fix: project ID conflict, and update on same session id (#15596)
- @bentrd:
  - fix: recover from 413 Request Entity Too Large via auto-compaction (#14707)
- @ryanskidmore:
  - fix(opencode): clone part data in Bus event to preserve token values (#15780)
  - fix(provider): forward metadata options to cloudflare-ai-gateway provider (#15619)
- @jerome-benoit:
  - fix(opencode): disable session navigation commands when no parent session (#15762)
- @06ergin06:
  - fix: update Turkish translations (#15835)
- @elithrar:
  - fix(auth): normalize trailing slashes in auth login URLs (#15874)

## v1.2.15 — 2026-02-26

## Core
- Fix most segfaults on Windows with Bun v1.3.10 stable
- Split TUI and server configuration
## Desktop
- Remove interactive shell flag from sidecar spawn to prevent hang on macOS (@kilhyeonjun)
- Fixed permissions and questions handling from child sessions in the app
- Fixed keyboard navigation for previous/next message (@neriousy)
- Correct Copilot provider description in i18n files (@Oleksii-Pavliuk)

**Thank you to 5 community contributors:**
- @Oleksii-Pavliuk:
  - fix(app): correct Copilot provider description in i18n files (#15071)
- @neriousy:
  - fix(app): keyboard navigation previous/next message (#15047)
- @OpeOginni:
  - fix(docs): update schema URL in share configuration examples across multiple languages (#15114)
- @kilhyeonjun:
  - fix(desktop): remove interactive shell flag from sidecar spawn to prevent hang on macOS (#15136)
- @choephix:
  - fix(app): middle-click tab close in scrollable tab bar (#15081)

## v1.2.14 — 2026-02-25

## Core
- Add message delete endpoint (@shantur)
## TUI
- Consume stdout concurrently with process exit in auth login (@Ayushlm10)

**Thank you to 2 community contributors:**
- @Ayushlm10:
  - fix: consume stdout concurrently with process exit in auth login (#15058)
- @shantur:
  - feat(core): add message delete endpoint (#14417)

## v1.2.13 — 2026-02-25

No notable changes

## v1.2.12 — 2026-02-25

## Core
- Synchronize changes
- Temporarily disable plan enter tool to prevent unintended mode switches during task execution
- Migrate Bun.spawn to Process utility with timeout and cleanup
- Disable Bun config cache in CI
- Await git ID cache write in project module
- Import custom tools via file URL
## TUI
- Add Go SDK code generation script
- Show LSP errors for apply_patch tool
## Desktop
- Enhance Windows app resolution and UI loading states (@neriousy)
- Update desktop README for accuracy

**Thank you to 1 community contributor:**
- @neriousy:
  - feat(desktop): enhance Windows app resolution and UI loading states (#13320)

## v1.2.11 — 2026-02-24

## Core
- Add workspace-serve command (experimental)
- ACP both live and load share synthetic pending status preceding actual data (@noamzbr)
- Replace structuredClone with spread operator for process.env in tests
- Add 50ms tolerance for NTFS mtime precision in Windows FileTime assertions
- Replace Unix-only test assumptions with cross-platform alternatives
- Use path.sep in discovery test for cross-platform path matching
- Normalize backslash paths in config rel() and file ignore on Windows
- Fix plugin resolution with createRequire fallback on Windows
- Harden preload cleanup against Windows EBUSY errors
- Normalize git excludesFile path for Windows in tests
- Stream bash output and add synthetic pending events to ACP (@noamzbr)
- Add git flags for snapshot operations and fix tests for cross-platform on Windows
- Handle CRLF line endings in markdown frontmatter parsing on Windows
- Use path.join for cross-platform glob test assertions
- Upgrade to Bun 1.3.10 canary and force baseline builds always
- Normalize paths at permission boundaries on Windows
- Windows path support and canonicalization (@edemaine)
- Upgrade OpenTUI to v0.1.81
- Change detection on Windows, especially Cygwin (@edemaine)
- Cache platform binary in postinstall for faster startup
- Revert caching platform binary in postinstall for faster startup
- Cache platform binary in postinstall for faster startup
- Publish desktop beta releases to a separate repository
- Add experimental endpoint to list all sessions
- Fixed terminal issues in the app
- Respect info exclude in snapshot staging
- Missing plugin dependencies cause TUI to black screen (@elithrar)
## TUI
- Support variant parameter in GitHub Actions and OpenCode GitHub run command (@elithrar)
## Desktop
- Ignore stale part deltas in the application
- Fix bug where lines remain highlighted after canceling a comment (@neriousy)
- Replace error handling with serverErrorMessage utility and add ConfigInvalidError checks (@OpeOginni)
- Preserve native path separators in file path helpers
- Remove file tree tooltips
- Update createOpenReviewFile test to match new call order
- Wait for loadFile to complete before opening file tab
- Windows E2E test failures due to IPv6 networking issues resolved
- Correct inverted chevron direction in todo list (@kevinWangSheng)
- Feed customization options
- Add beta icon to desktop application
- E2E test updated to current version
- Remove double-border in share button
- Better sound effect disabling UX
- Add custom scroll view to app
- Show and hide reasoning summaries in the app
- Stay pinned with auto-scroll on todos, questions, and permissions
- Bring back -i flag in sidecar arguments for desktop
- Large text pasted into prompt input no longer causes main thread to lock
## SDK
- Scripts using Turbo commands would not run on Windows

**Thank you to 10 community contributors:**
- @elithrar:
  - fix(cli): missing plugin deps cause TUI to black screen (#14432)
  - fix(github): support variant in github action and opencode github run (#14431)
- @tuhin-cmd:
  - docs: add Bangla README translation (#14331)
- @Seungjun0906:
  - docs(ko): improve wording in gitlab, ide, index, keybinds, and lsp docs (#14517)
- @github-actions[bot]:
  - Update VOUCHED list
- @pirrozani:
  - docs(tui): correct typo in TUI documentation (#14604)
- @edemaine:
  - fix(desktop): change detection on Windows, especially Cygwin (#13659)
  - fix: Windows path support and canonicalization (#13671)
- @kevinWangSheng:
  - fix(app): correct inverted chevron direction in todo list (#14628)
- @noamzbr:
  - feat: ACP - stream bash output and synthetic pending events (#14079)
  - fix: ACP both live and load share synthetic pending status preceeding… (#14916)
- @OpeOginni:
  - refactor: replace error handling with serverErrorMessage utility and checks for if error is ConfigInvalidError (#14685)
- @neriousy:
  - fix(app): on cancel comment unhighlight lines (#14103)

## v1.2.10 — 2026-02-20

## Desktop
- Don't spawn sidecar if default is localhost server
## SDK
- Build SDK to dist/ instead of dist/src

**Thank you to 1 community contributor:**
- @rmk40:
  - docs: clarify tool name collision precedence (#14313)

## v1.2.9 — 2026-02-20

## Core
- Add missing id, sessionID, and messageID to MCP tool attachments (@NatChung)
- Remove unnecessary deep clones from session loop and LLM stream
- Remove User-Agent header assertion from LLM test to fix failing test
## TUI
- Use structuredClone instead of remeda's clone for better performance and native support (@mhart)
## Desktop
- Restore settings header mask

**Thank you to 2 community contributors:**
- @mhart:
  - Use structuredClone instead of remeda's clone (#14351)
- @NatChung:
  - fix: add missing id/sessionID/messageID to MCP tool attachments (#14345)

## v1.2.8 — 2026-02-19

## Core
- Support adaptive thinking for Claude Sonnet 4.6 (@tctev)
## TUI
- Add custom tool and MCP call responses that are visible and collapsible (@yanosh-k)
## Desktop
- Black screen on launch with sidecar server fixed
- Clear todos on abort

**Thank you to 2 community contributors:**
- @yanosh-k:
  - feat(tui): add custom tool and mcp call responses visible and collapsable (#10649)
- @tctev:
  - feat(opencode): support adaptive thinking for claude sonnet 4.6 (#14283)

## v1.2.7 — 2026-02-19

## Core
- Fixed terminal rendering and interaction issues in the application
- Normalize file status paths relative to instance directory (@shantur)
- Migrate from Bun.Glob to npm glob package
- Bump AI SDK packages for Google, Google Vertex, Anthropic, Bedrock, and provider utils
- Add support for medium reasoning with Gemini 3.1
- Remove use of Bun.file
- Text files misclassified as binary
- Fetch default server at top level in desktop application
- Terminal rework in the app
- Bake in the AWS and Google authentication packages
- Token substitution in OPENCODE_CONFIG_CONTENT now works correctly (@ariane-emory)
- Revert migration from Bun.file() to Filesystem module
- Migrate project.ts from Bun.file() to Filesystem/stat modules
- Migrate read tool from Bun.file() to Filesystem module
- Migrate write tool from Bun.file() to Filesystem module
- Migrate Edit tool from Bun.file() to Filesystem module
- Migrate remaining tool files from Bun.file() to Filesystem/stat modules
- Migrate storage.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate src/storage/json-migration.ts from Bun.file() to Filesystem module
- Migrate MCP auth module from Bun file APIs to Filesystem module
- Migrate storage database from Bun.file() to statSync for file existence checks
- Migrate session prompt module from Bun.file() to Filesystem/stat modules
- Fix crash in `opencode run` and show errored tool calls in output
- Migrate skill discovery to use Filesystem module instead of Bun file APIs
- Migrate session instruction handling from Bun.file() to Filesystem module
- Migrate provider.ts from Bun.file() to Filesystem module
- Migrate shell.ts from Bun.file() to statSync for improved file system operations
- Migrate log utility from Bun.file() to Node.js fs module for better compatibility
- Migrate models.ts from Bun.file()/Bun.write() to Filesystem module
- Use HashiCorp releases API for installing terraform-ls (@edubxb)
- Migrate LSP server from Bun.file()/Bun.write() to Filesystem module
- Migrate session command from Bun.file() to statSync for improved file system operations
- Migrate agent.ts from Bun.file() to Filesystem module
- Migrate auth module from Bun.file()/Bun.write() to Filesystem module
- Pass sessionID and callID to shell.env hook input (@tesdal)
- Fix terminal cross-talk issue in the application
- Update SST version
- Migrate src/global/index.ts from Bun.file() to Filesystem module
- Emit PROMPT_TOO_LARGE error when GitHub context overflows (@elithrar)
- Migrate src/bun/index.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate config/markdown.ts from Bun.file() to Filesystem module
- Migrate file/index.ts from Bun.file() to Filesystem module
- Migrate format/formatter.ts from Bun.file() to Filesystem module
- Allow readJson to be called without explicit type parameter
- Migrate file/ripgrep.ts from Bun APIs to Filesystem module
- Migrate index.ts from Bun.file() to Filesystem module
- Add Julia language server support (@zarly)
- Bump GitLab AI provider to 3.6.0 to add Sonnet 4.6 support (@vglafirov)
- Add centralized filesystem module for Bun.file migration
- Fix Clojure syntax highlighting (@finalfantasia)
- Ensure explore subagent prompts for external directory permission instead of auto-denying
- Don't autoload kilo
- Add Kilo as a native provider (@Nomadcxx)
- Simplify redundant ternary in updateMessage (@yikayiyo)
- Ensure Read tool uses fs/promises for all file system operations
- Make read tool more memory efficient
- Surface plugin auth providers in the login picker (@anoldguy)
- Invalidate OAuth credentials when OAuth provider indicates they are invalid (@GreenStage)
- Don't fetch models.dev on completion (@gigamonster256)
- Recover state after SSE reconnect and harden SSE streams
- Keep message part order stable when files resolve asynchronously
- Drop IDs from attachments in tools and assign them in prompt.ts instead
## TUI
- Improve GitHub action branch detection and handle 422 errors (@elithrar)
- Ensure onExit callback fires after terminal output is written
- Migrate TUI thread module from Bun.file() to Filesystem module
- Migrate agent command from Bun.file()/Bun.write() to Filesystem module
- Migrate import command from Bun.file() to Filesystem module
- Update pasteImage to only increment count when the previous attachment is an image (@OpeOginni)
- Migrate editor.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate clipboard.ts from Bun.file() to Filesystem module
- Migrate CLI run command from Bun.file() to Filesystem/stat modules
- Session list --max-count parameter now correctly limits the number of sessions displayed (@mharris717)
- Exit cleanly without hanging after session ends
- Style scrollbox for permission and sidebar (@akronb)
- Increase button heights and improve permission prompt layout alignment
- Display new session banner with logo and project details in TUI
## Desktop
- Update Japanese translations for WSL integration (@taroj1205)
- Made localhost URLs work correctly in isLocal function
- Navigate to last session when navigating to a project
- Fix typecheck errors in app
- Deduplicate allServers list in app
- Adjust session turn horizontal padding
- Tighten prompt dock padding in app
- Fixed sidecar spawning a window on Windows
- Delay prompt mode toggle tooltip
- Shorten prompt mode toggle tooltips in the app
- Reduce review panel padding
- Tweak search button style in UI
- Expanded color state on titlebar buttons
- Tweak hover and active styles for title bar buttons
- Share button now has a border
- Adjust file tree background color
- Handle sidecar key in projectsKey for desktop projects
- Fixed desktop app incorrectly identifying local servers
- Refactor server management backend
- Use group-hover for file tree icon color swap at all nesting levels
- Simplify mode toggle icon styling in TUI
- Clean up desktop implementation
- Temporarily disable WSL support in desktop application
- Use radio group in prompt input
- Simplify prompt mode toggle icon colors via CSS and tighten message timeline padding in TUI
- Fix prompt input quirks in app
- Terminal disconnect and resync functionality fixed
- Replicate tauri-plugin-shell logic in desktop application
- Improve modified file visibility and button spacing in TUI
- Show monochrome file icons by default in tree view, revealing colors on hover to reduce visual clutter
- Fix share button text styling to use consistent 12px regular font weight
- Add warning icon to permission requests for better visibility
- Extract dock prompt shell component
- UI no longer flashes when switching tabs (@neriousy)
- Avoid sidecar health-check timeout on shell startup in desktop app (@ysm-dev)
- Increase prompt mode toggle height for better clickability
- Add more end-to-end tests for desktop application (@neriousy)
- Update magnifying-glass icon in UI
- Tighten titlebar action padding
- Refine titlebar search and open padding
- Center titlebar search and soften keybind styling
- Align titlebar search text size
- Match titlebar active background to hover
- Use weak borders in titlebar actions
- Reduce titlebar right padding
- Keep file tree toggle visible
- Adjust icon button spacing in UI
- Session timeline and turn handling reworked in app
- Keep Escape handling local to prompt input on macOS desktop (@itskritix)
- Hide server CLI window on Windows
## SDK
- Fix nested exports transformation in SDK publish script

**Thank you to 25 community contributors:**
- @itskritix:
  - fix(app): keep Escape handling local to prompt input on macOS desktop (#13963)
- @vynnlee:
  - docs(ko): improve Korean translation accuracy and clarity in Zen docs (#13951)
- @chenmijiang:
  - docs: improve zh-cn and zh-tw documentation translations (#13942)
- @hmu332233:
  - fix(docs): correct reversed meaning in Korean plugins logging section (#13945)
- @neriousy:
  - feat(desktop): more e2e tests (#13975)
  - fix(app): ui flashing when switching tabs (#13978)
- @ysm-dev:
  - fix(desktop): avoid sidecar health-check timeout on shell startup (#13925)
- @alexcarpenter:
  - fix: Homepage video section layout shift (#13987)
- @gigamonster256:
  - fix: don't fetch models.dev on completion (#13997)
- @GreenStage:
  - fix: Invalidate oauth credentials when oauth provider says so (#14007)
- @anoldguy:
  - feat: surface plugin auth providers in the login picker (#13921)
- @akronb:
  - fix(tui): style scrollbox for permission and sidebar (#12752)
- @yikayiyo:
  - refactor: simplify redundant ternary in updateMessage (#13954)
- @Nomadcxx:
  - feat: add Kilo as a native provider (#13765)
- @finalfantasia:
  - fix(opencode): fix Clojure syntax highlighting (#13453)
- @mharris717:
  - fix(cli): session list --max-count not honored, shows too few sessions (#14162)
- @vglafirov:
  - feat: GitLab Duo - bump gitlab-ai-provider to 3.6.0 (adds Sonnet 4.6) (#14115)
- @zarly:
  - feat: add Julia language server support (#14129)
- @elithrar:
  - fix(github): emit PROMPT_TOO_LARGE error on context overflow (#14166)
  - fix(github): action branch detection and 422 handling (#14322)
- @OpeOginni:
  - fix(opencode): update pasteImage to only increment count when the previous attachment is an image too (#14173)
- @tesdal:
  - feat(plugin): pass sessionID and callID to shell.env hook input (#13662)
- @edubxb:
  - fix(lsp): use HashiCorp releases API for installing terraform-ls (#14200)
- @ariane-emory:
  - fix: token substitution in OPENCODE_CONFIG_CONTENT (alternate take) (#14047)
- @Seungjun0906:
  - docs(ko): improve wording in ecosystem, enterprise, formatters, and github docs (#14220)
- @shantur:
  - fix(core): normalize file.status paths relative to instance dir (#14207)
- @taroj1205:
  - feat(i18n): update Japanese translations to WSL integration (#13160)

## v1.2.6 — 2026-02-16

## Core
- Add dfmt formatter support for D language files (@burner)
- Bump GitLab provider and auth plugin for mid-session token refresh (@vglafirov)
- Remove unnecessary per-message title LLM calls (@rmk40)
- Prioritize user-defined variables over environment variables in Google Vertex AI configuration
- Add OpenAI-compatible endpoint support for Google Vertex provider (@leehack)
- Add Venice support for temperature, topP, topK, and smallOption parameters (@dpuyosa)
- Add cljfmt formatter support for Clojure files (@finalfantasia)
## TUI
- Make use of server directory path for file references in prompts (@OpeOginni)
- Add database migration command to convert JSON storage to SQLite
- Add --continue and --fork flags to attach command
- Fixed inaccurate tips in TUI (@imanolmzd-svg)
## Desktop
- Normalize Linux Wayland/X11 backend and decoration policy (@bnema)
- Use process-wrap library instead of manual job object handling in desktop (@Brendonovich)

**Thank you to 12 community contributors:**
- @finalfantasia:
  - feat(opencode): add `cljfmt` formatter support for Clojure files (#13426)
- @pkx07:
  - fix(website): correct zh-CN translation of proprietary terms in zen.mdx (#13734)
- @Brendonovich:
  - desktop: use process-wrap instead of manual job object (#13431)
- @dpuyosa:
  - feat(opencode): Add Venice support in temperature, topP, topK and smallOption (#13553)
- @bnema:
  - fix(desktop): normalize Linux Wayland/X11 backend and decoration policy (#13143)
- @leehack:
  - feat: add openai-compatible endpoint support for google-vertex provider (#10303)
- @hobostay:
  - fix(docs): correct critical translation errors in Russian zen page (#13830)
- @rmk40:
  - fix(core): remove unnecessary per-message title LLM calls (#13804)
- @imanolmzd-svg:
  - fix (tui): Inaccurate tips (#13845)
- @vglafirov:
  - fix: bump GitLab provider and auth plugin for mid-session token refresh (#13850)
- @OpeOginni:
  - fix(tui): make use of server dir path for file references in prompts (#13781)
- @burner:
  - feat(opencode): add `dfmt` formatter support for D language files (#13867)

## v1.2.5 — 2026-02-15

## Core
- Ensure SQLite migration logs to stderr instead of stdout
## Desktop
- Fixed issue viewing new files opened from the file tree (@shanebishop1)
- Only navigate prompt history at input boundaries (@nexxeln)
- Add keyboard shortcut Shift+Tab to the application (@neriousy)
- Focus window after update and relaunch (@zerone0x)
- Add GeistMono Nerd Font to available mono font options (@brandon-julio-t)

**Thank you to 7 community contributors:**
- @brandon-julio-t:
  - feat: Add GeistMono Nerd Font to available mono font options (#13720)
- @zerone0x:
  - fix(desktop): focus window after update/relaunch (#13701)
- @dector:
  - docs: add Ukrainian README translation (#13697)
- @neriousy:
  - fix(app): keybind [shift+tab] (#13695)
- @nexxeln:
  - fix(app): only navigate prompt history at input boundaries (#13690)
- @shanebishop1:
  - fix(desktop): issue viewing new files opened from the file tree (#13689)
- @alexyaroshuk:
  - feat(app): localize "free usage exceeded" error & "Add credits" clickable link (#13652)

## v1.2.4 — 2026-02-15

## Core
- Add db command for database inspection and querying
- Derive all IDs from file paths during JSON migration
## Desktop
- Clear notifications action
- Fixed stack overflow issue in file tree component

## v1.2.3 — 2026-02-15

## Core
- Ensure Anthropic models on OpenRouter also have variant support
- Add WAL checkpoint on database open
- Ensure Vercel variants pass Amazon models under Bedrock key

## v1.2.2 — 2026-02-14

## Core
- Add comprehensive test coverage for Session.list() filters
- Filter sessions at database level to improve session list loading performance
- Fix Vercel gateway variants
- Bump Vertex AI packages

## v1.2.1 — 2026-02-14

v1.2.0 and beyond includes a data migration that will execute on first run. It will migrate all flat files in data directory to a single sqlite database. Depending on how much data you have and speed of computer this can take some time.

if anything goes wrong you can retrigger the migration by deleting `~/.local/share/opencode/opencode.db*` files (%APPDATA% on windows)

If you have any issues with the migration the original data is not yet deleted and downgrading should work. But please open an issue so we can investigate and include sqlite in the issue title.


SDK Users

We now have a PartDelta event which sends only incremental changes to parts. This avoids sending the full content of text parts over and over when it is updated

## Core
- Show all project sessions from any working directory
- Tweak websearch tool description date info to avoid cache busts

## v1.2.0 — 2026-02-14

This release includes a data migration that will execute on first run. It will migrate all flat files in data directory to a single sqlite database. Depending on how much data you have and speed of computer this can take some time.

if anything goes wrong you can retrigger the migration by deleting ~/.local/share/opencode/opencode.db* files (%APPDATA% on windows)

If you have any issues with the migration the original data is not yet deleted and downgrading should work. But please open an issue so we can investigate and include sqlite in the issue title.

SDK Users

We now have a PartDelta event which sends only incremental changes to parts. This avoids sending the full content of text parts over and over when it is updated

```js
    PartDelta: BusEvent.define(
      "message.part.delta",
      z.object({
        sessionID: z.string(),
        messageID: z.string(),
        partID: z.string(),
        field: z.string(),
        delta: z.string(),
      }),
    )
```

## Core
- Revert to SQLite database implementation
- Move timeout configuration from programmatic API to CLI flag (@yanhao98)
- Update AI SDK packages and use adaptive reasoning for Claude Opus 4.6 on Vertex, Bedrock, and Anthropic
## TUI
- Prevent crash when tool inputs are malformed during opencode run (@0xK3vin)
- Add --dir option to run command (@BlankParticle)
## Desktop
- Fix Rust compilation issues in desktop application (@Brendonovich)
- Remove OPENCODE_SQLITE environment variable from desktop (@Brendonovich)
- Terminal resize handling fixed in app
- Use prompt_async endpoint to avoid timeout over VPN/tunnel (@eytans)
- Remount SDK and sync tree when server URL changes (@ysm-dev)
- Sync docs locale cookie on alias redirects (@Seungjun0906)
- Performance optimization for showing large diffs and files in desktop (@neriousy)

**Thank you to 12 community contributors:**
- @BlankParticle:
  - feat(cli): add --dir option to run command (#12443)
- @neriousy:
  - fix(desktop): performance optimization for showing large diff & files  (#13460)
- @Seungjun0906:
  - fix(web): sync docs locale cookie on alias redirects (#13109)
  - docs(ko): polish Korean phrasing in acp, agents, config, and custom-tools docs (#13446)
- @ysm-dev:
  - fix(app): remount SDK/sync tree when server URL changes (#13437)
- @Annopick:
  - docs: Fix zh-cn translation mistake in tools.mdx (#13407)
- @eytans:
  - fix(web): use prompt_async endpoint to avoid timeout over VPN/tunnel (#12749)
- @G36maid:
  - docs: add pacman installation option for Arch Linux alongside AUR (#13293)
- @yanhao98:
  - fix(test): move timeout config to CLI flag (#13494)
- @niushuai1991:
  - fix: standardize zh-CN docs character set and terminology (#13500)
- @kitlangton:
  - fix(ui): support cmd-click links in inline code (#12552)
- @0xK3vin:
  - fix: prevent opencode run crash on malformed tool inputs (#13051)
- @Brendonovich:
  - desktop: remote OPENCODE_SQLITE env (#13545)
  - desktop: fix rust

## v1.1.65 — 2026-02-13

## Core
- Revert token substitution in OPENCODE_CONFIG_CONTENT
- Ensure @-mentioning a directory uses the read tool instead of deprecated list tool
- Add tool.definition hook for plugins to modify tool description and parameters (@spoons-and-mirrors)
- Remove worktree delete functionality
- Resolve ACP hanging indefinitely in thinking state on Windows (@ASidorenkoCode)
## Desktop
- Reconnect event stream on disconnect
- Toggle all provider models in settings
- Clean up desktop loading page (@Brendonovich)
- Notification should navigate to session
- Fix prompt input behavior quirks
- Failed to create store in app
- Only show loading window if SQLite migration is necessary (@Brendonovich)

**Thank you to 3 community contributors:**
- @ASidorenkoCode:
  - fix: resolve ACP hanging indefinitely in thinking state on Windows (#13222)
- @Brendonovich:
  - desktop: only show loading window if sqlite migration is necessary
  - cleanup desktop loading page
- @spoons-and-mirrors:
  - feat(hook): add tool.definition hook for plugins to modify tool description and parameters (#4956)

## v1.1.64 — 2026-02-12

## Core
- Token substitution in OPENCODE_CONFIG_CONTENT environment variable (@ariane-emory)
- Look for recent model in fallback in CLI (@smitchaudhary)
- Baseline CPU detection fixed (@Hona)
- Windows selection behavior and manual Ctrl+C handling (@Hona)
- Terminal PTY isolation for app
## TUI
- Do not open console on error
## Desktop
- Option to turn off sound effects
- Normalize OAuth error messages
- Suggestion active state broken
- Fixed remote HTTP server connections in the app

**Thank you to 4 community contributors:**
- @amankalra172:
  - docs: update STACKIT provider documentation with typo fix (#13357)
- @Hona:
  - feat: windows selection behavior, manual ctrl+c (#13315)
  - fix: baseline CPU detection (#13371)
- @smitchaudhary:
  - fix: look for recent model in fallback in cli (#12582)
- @ariane-emory:
  - fix: token substitution in OPENCODE_CONFIG_CONTENT (#13384)

## v1.1.63 — 2026-02-12

## Core
- Improve Codex model list

## v1.1.62 — 2026-02-12

## Core
- Return image attachments from webfetch tool
- Expose tool arguments in shell hook for plugin visibility
## Desktop
- Project icons no longer unload unexpectedly
- Preserve undo history for plain-text paste in app (@gitRasheed)
- Refactor app for better SolidJS hygiene
- More defensive session context metrics handling in app

**Thank you to 2 community contributors:**
- @dtfiedler:
  - fix(docs): correct `format` attribute in `StructuredOutputs` (#13340)
- @gitRasheed:
  - fix(app): preserve undo history for plain-text paste (#13351)

## v1.1.61 — 2026-02-12

## Core
- Allow model configurations without npm/api provider details
- Tool outputs are now more LLM-friendly
## Desktop
- Add diff virtualization to improve performance for large diffs
- Display progress bar for SQLite migrations in desktop app (@Brendonovich)

**Thank you to 1 community contributor:**
- @Brendonovich:
  - desktop: sqlite migration progress bar (#13294)
  - Testing SignPath Integration (#13308)

## v1.1.60 — 2026-02-12

## Core
- Support Claude agent SDK-style structured outputs in the OpenCode SDK (@K-Mistele)
- Support custom API URL per model
- Add automatic variant generation for Venice models (@dpuyosa)
- Use Promise.all for MCP listTools calls to improve performance
- Upgrade OpenTUI to version 0.1.79
- Improve compaction check logic
- Make read tool offset 1-indexed to match line numbers and avoid confusion
- Add directory reading capability to the read tool
## TUI
- Use FFI to resolve Windows raw input and Ctrl+C handling issues (@Hona)
- Add toggle to hide session header in TUI (@kitlangton)
## Desktop
- Guard randomUUID in insecure browser contexts
- Workspace reset functionality fixed (@neriousy)

**Thank you to 6 community contributors:**
- @neriousy:
  - fix(app):workspace reset (#13170)
- @github-actions[bot]:
  - Update VOUCHED list
- @dpuyosa:
  - feat(opencode): Venice Add automatic variant generation for Venice models (#12106)
- @kitlangton:
  - feat(tui): add toggle to hide session header (#13244)
- @K-Mistele:
  - feat: support claude agent SDK-style structured outputs in the OpenCode SDK  (#8161)
- @Hona:
  - fix(win32): use ffi to get around bun raw input/ctrl+c issues (#13052)

## v1.1.59 — 2026-02-11

## Desktop
- Add translations support to the application
- I don't have access to git commands. Could you provide the full commit message or the PR description for #13166 so I can create an appropriate changelog entry? (@neriousy)
- Add more end-to-end tests for the application
- Fixed sidebar remounting issue

**Thank you to 1 community contributor:**
- @neriousy:
  - Fix/reverception (#13166)

## v1.1.58 — 2026-02-11

## TUI
- Dismiss dialogs with Ctrl+C in TUI (@kitlangton)
- Keep /share command available to copy existing share link (@kitlangton)
- Add mode-specific input placeholders to improve context-aware prompts (@kitlangton)
- Prevent home wordmark corruption in height-constrained terminals (@kitlangton)
## Desktop
- Revert WSL backend mode feature for desktop
- Notifications enabled on child sessions
- Terminal PTY buffer now properly carries over between sessions
- Terminal resize functionality fixed in app

**Thank you to 1 community contributor:**
- @kitlangton:
  - fix(tui): prevent home wordmark corruption in height-constrained terminals (#13069)
  - feat(prompt): mode-specific input placeholders (#12388)
  - fix(tui): keep /share available to copy existing link (#12532)
  - fix(tui): dismiss dialogs with ctrl+c (#12884)

## v1.1.57 — 2026-02-11

## Core
- Add additional context overflow cases and remove overcorrecting ones
- Ensure compaction is more reliable by adding reserve token buffer to provide enough room for input window compaction
- Improve /review prompt to detect behavior changes more explicitly
- Improve Amazon Bedrock check to include container credentials (@OpeOginni)
## TUI
- Default session sidebar to auto
## Desktop
- Fixed terminal copy/paste functionality
- Copy path button styles fixed in app
- Use tracing for logging in desktop application (@Brendonovich)
- Enhance Windows app resolution and UI loading states (@neriousy)
- Improve desktop app server spawn resilience
- Read Wayland preference from store in desktop application (@Brendonovich)
- Add WSL backend mode for desktop (@Brendonovich)
## SDK
- Encode non-ASCII directory paths in v1 SDK HTTP headers (@MrMushrooooom)

**Thank you to 9 community contributors:**
- @github-actions[bot]:
  - Update VOUCHED list
- @OpeOginni:
  - fix(tui): improve amazon-bedrock check to include container credentials (#13037)
- @ariane-emory:
  - docs: remove 'Migrating to 1.0' documentation section (#13076)
- @Brendonovich:
  - feat(desktop): add WSL backend mode (#12914)
  - fix(desktop): read wayland preference from store (#13081)
  - desktop: use tracing for logging (#13135)
- @webwww123:
  - fix(docs): avoid footer language selector truncation (#13124)
- @Seungjun0906:
  - docs(ko): improve translations for intro, cli, and commands (#13094)
- @neriousy:
  - feat(desktop): enhance Windows app resolution and UI loading states (#13084)
- @MrMushrooooom:
  - fix: encode non-ASCII directory paths in v1 SDK HTTP headers (#13131)
- @taroj1205:
  - fix(web): prevent language select label truncation (#13100)

## v1.1.56 — 2026-02-10

## Desktop
- Task tool rendering fixed in app
- Open apps with executables on Windows (@neriousy)
- Don't close sidebar on session change

**Thank you to 1 community contributor:**
- @neriousy:
  - fix(desktop): open apps with executables on Windows (#13022)

## v1.1.55 — 2026-02-10

## Core
- Increase test timeout to 30s to prevent failures during package installation
- Memory leak fixed in platform fetch for events
- Show helpful message when free usage limit is exceeded
## Desktop
- Disable terminal transparency

## v1.1.54 — 2026-02-10

## Core
- No changes in review pane
- Fix terminal replay in application
- Fix workspace reset issues in the app
- Resolve Homebrew upgrade requiring multiple runs (@GeneCodeSavvy)
- Publish session.error event for invalid model selection (@surma)
- Create file if it doesn't exist when writing via ACP (@BryceRyan)
- Adjust agent variant logic to check if variant is available for model instead of requiring exact match
- Add new ContextOverflowError type
- Remove obsolete Copilot model enablement instructions (@fgonzalezurriola)
- Enable thinking for all reasoning models on Alibaba Cloud (DashScope) (@AdJIa)
- Parse mid-stream OpenAI response errors to prevent infinite retries on unrecoverable errors
- Revert web input focus shortcut feature (@gigamonster256)
- Add web input focus shortcut (@ChangeHow)
- Add models.dev schema reference for model autocomplete in opencode.json (@remorses)
- Set variant in assistant messages (@shantur)
- Add skill discovery from URLs via well-known RFC
- Clean up orphaned worktree directories (@maharshi365)
- Properly encode file URLs with special characters (@yudgnahk)
- SessionPrompt.shell() now triggers loop if messages are queued (@goniz)
- Use reasoning summary auto for GPT-5 models that are not chat (@scratchmex)
- Add specific system prompt for Trinity model (@mariamjabara)
- Correct prefix selection for amazon-bedrock provider in getSmallModel (@NachoFLizaur)
- Don't rely on metadata.summary in task tool render
- Handle step-start and step-finish parts in GitHub response text extraction (@elithrar)
- Bump @gitlab/gitlab-ai-provider to 3.5.0 (@vglafirov)
- Add directory parameter to plugin client for multi-project support (@cooooooooooode)
- Correct /data API usage and data format for importing share URLs (@yuvrajvirk)
- Parallelize skill downloads for faster loading in TUI
- Add skill discovery from URLs via well-known RFC
- Handle dollar sign character with file pattern in configuration (@hstove)
## TUI
- Clean up dialog-model.tsx per code review
- Revert addition of version to session header and status dialog
- Revert showing connected providers in /connect dialog
- Use sender color for queued messages in TUI (@mcostasilva)
- Revert footer restoration in session view
- Add Claude Code-style --fork flag to duplicate sessions before continuing (@ariane-emory)
- Restore footer to session view (@ariane-emory)
- Increase skill dialog width
- Improve skills dialog readability (@kynnyhsap)
## Desktop
- Back to platform fetch for now
- Include basic authentication in app
- Fixed global event default fetch behavior in app
- Fixed memory leak in event fetch operation
- Don't dispose instance after reset workspace
- Based on the commit message "fix(app): regressions" without access to the actual changes, I can only provide a generic summary:

Fix regressions in the app
- Use agent configured variant in app
- Persist defensiveness in app
- Add redo and undo end-to-end test (@neriousy)
- Use absolute paths for sidebar session navigation (@riftzen-bit)
- New session in workspace now correctly uses the selected workspace
- Add Cmd+[/] keybinds for session history navigation (@kitlangton)
- Correct module name for linux_display in main.rs (@Hona)
- Set maximum widths in app
- Incorrect workspace on new session
- Update tab file contents on change
- Polish Open in icon treatment
- Add fallback for when crypto.randomUUID is unavailable
- Allow creating sessions on touch devices (@kitlangton)
- Add native Wayland toggle on Linux desktop (@IsraelAraujo70)
- Include sandboxes in project unseen message and error notifications (@Brendonovich)
- Persist current sidecar URL in state when isSidecar prop is true (@OpeOginni)
- Track current sidecar URL in desktop application (@Brendonovich)
- Exclude devtools from production builds (@sneycampos)
- Add isSidecar prop to AppInterface and persist sidecar server URLs (@OpeOginni)
- Localize "close tab" in command palette (@alexyaroshuk)
- Improve workspace header truncation and item interaction (@kitlangton)
- Add default clipboard copy affordance to TextField component (@kitlangton)
- Fix stale context in prompt input
- Tighten slash command autocomplete matching (@kitlangton)
- Display toast notification when session is missing on prompt submit (@DNGriffin)
- Add native clipboard image paste and fix text paste in desktop app (@invarrow)
- Respect terminal toggle keybind when terminal is focused (@ryanmiville)
- Keep /share available to copy existing link (@kitlangton)
- Disable 3 Safari prompt-input annoyances (@DNGriffin)
- Add drag-and-drop support for @mentioning files in the app (@DNGriffin)
- Handle Windows paths in frontend file URL encoding (@yudgnahk)
- Move workspace New session button into header (@kitlangton)
- Toggle file tree and review panel with improved UX (@ProdigyRahul)
- Allow agent select to use full width on Windows (@abdiths)
- Keep startup script field scrollable in edit project dialog (@itskritix)
- Fix terminal replay issues in app
- Added macOS support for displaying only installed editors and added Sublime Text editor (@OpeOginni)
- Remove extra error page and use default error boundary
- Add loading window and restructure Rust desktop code (@Brendonovich)
- Hide 'open in app' button on narrow viewports
- Update server removal logic to clear default server URL if removed (@OpeOginni)
- Display session last updated time in command palette search (@alexyaroshuk)
- Add Windows File Explorer icon for session header (@maharshi365)
- Support desktop titlebar double-click maximize (@crob19)
- Add keyboard accelerators to menu items (@Brendonovich)
- Add more basic menu bar items to desktop application (@Brendonovich)
- Always show project menu button on mobile for accessibility (@DNGriffin)
- Maximize main window by default (@Brendonovich)

**Thank you to 44 community contributors:**
- @kynnyhsap:
  - fix(opencode): improve skills dialog readability (#12356)
- @hstove:
  - fix(config): handle $ character with {file:} pattern (#12390)
- @AksharP5:
  - feat(tui): highlight esc label on hover in dialog (#12383)
- @Brendonovich:
  - desktop: maximize main window by default (#12433)
  - desktop: add more basic menu bar items
  - desktop: add key accelerators to menu itms
  - desktop: add loading window and restructure rust (#12176)
  - desktop: track currentSidecarUrl
  - app: include sandboxes in project unseen/error notifs
- @DNGriffin:
  - fix(app): always show project menu button for mobile a11y  (#11258)
  - feat(app): drag-n-drop to @mention file (#12569)
  - fix(app): disable 3 safari prompt-input annoyances (#12558)
  - fix(app): Toast when session is missing on prompt-submit (#12654)
- @crob19:
  - fix(desktop): support desktop titlebar double-click maximize (#12459)
- @maharshi365:
  - fix(ui): add Windows File Explorer icon for session header (#12386)
  - fix(opencode): cleanup orphaned worktree directories (#12399)
- @alexyaroshuk:
  - feat(app): session last updated time display in command pallete's search (#12376)
  - fix(app): localize "close tab" in command pallete (#12756)
- @OpeOginni:
  - fix(desktop): update server removal logic to clear default server URL if removed (#12372)
  - feat(desktop): added Macos support for displaying only installed editors & added sublime text editor (#12501)
  - fix(docs-windows-wsl): update caution note for server security (#12467)
  - feat(desktop): add isSidecar prop to AppInterface and logic to persist sidecar server urls (#12366)
  - feat(desktop): persist currentSidecarUrl in state when isSidecar prop is true (#12792)
- @yuvrajvirk:
  - fix: correct /data API usage and data format for importing share URLs (#7381)
- @cooooooooooode:
  - fix: add directory parameter to plugin client for multi-project support (#11344)
- @vglafirov:
  - chore(deps): bump @gitlab/gitlab-ai-provider to 3.5.0 (#12496)
- @elithrar:
  - fix(github): handle step-start/step-finish parts in extractResponseText (#12470)
- @ariane-emory:
  - feat(tui): restore footer to session view (#12245)
  - feat(tui): add Claude Code-style --fork flag to duplicate sessions before continuing (resolves #11137) (#11340)
  - docs(cli): add documentation for --fork flag (#12561)
- @NachoFLizaur:
  - fix(opencode): correct prefix selection for amazon-bedrock provider in getSmallModel (#12281)
- @mariamjabara:
  - feat: add specific system prompt for Trinity model (#12144)
- @scratchmex:
  - feat(opencode): use reasoning summary auto for gpt-5 models that are not chat (#12502)
- @dbpolito:
  - feat(desktop): Session Review Images (#12360)
- @goniz:
  - fix(opencode): SessionPrompt.shell() now triggers loop if messages are queued (#10987)
- @itskritix:
  - fix(app): keep startup script field scrollable in edit project dialog (#12431)
- @abdiths:
  - fix(desktop): allow agent select to use full width on windows (#12428)
- @yudgnahk:
  - fix: properly encode file URLs with special characters (#12424)
  - fix(app): handle Windows paths in frontend file URL encoding (#12601)
- @shantur:
  - feat(core): Set variant in assistant messages too (#12531)
- @remorses:
  - feat: add models.dev schema ref for model autocomplete in opencode.json (#12528)
- @ProdigyRahul:
  - fix(app): toggle file tree and review panel better ux (#12481)
- @kitlangton:
  - fix(app): move workspace New session into header (#12624)
  - fix(web): keep /share available to copy existing link (#12533)
  - refine(app): tighten slash autocomplete matching (#12647)
  - ui: default TextField copy affordance to clipboard (#12714)
  - fix(layout): improve workspace header truncation and item interaction (#12655)
  - fix(app): allow creating sessions on touch devices (#12765)
  - feat(app): add Cmd+[/] keybinds for session history navigation (#12880)
- @ChangeHow:
  - feat(app): add web input focus shortcut (#12493)
- @gigamonster256:
  - fix: revert "feat(app): add web input focus shortcut (#12493)" (#12639)
  - feat(nix): disable build time models.dev fetching (#12644)
  - feat(nix): expose overlay for downstream use (#12643)
- @ryanmiville:
  - fix(app): respect terminal toggle keybind when terminal is focused (#12635)
- @invarrow:
  - fix(desktop): add native clipboard image paste and fix text paste (#12682)
- @jerome-benoit:
  - refactor(nix): use native Bun APIs and propagate errors (#12694)
  - fix(nix): watch scripts in nix-hashes workflow (#12818)
  - fix(nix): restore install script in fileset for desktop build (#12842)
- @AdJIa:
  - fix: enable thinking for all reasoning models on alibaba-cn (DashScope) (#12772)
- @fgonzalezurriola:
  - fix(provider): remove obsolete copilot model enablement instructions (#12739)
- @sneycampos:
  - feat: exclude devtools from production builds (#12290)
- @IsraelAraujo70:
  - feat(desktop): add native Wayland toggle on Linux (#11971)
- @jcampuza:
  - fix(app): make keyboard focus visible in settings (#12612)
- @BryceRyan:
  - fix(opencode): ACP File write should create the file if it doesn't exist (#12854)
- @Hona:
  - fix(desktop): correct module name for linux_display in main.rs (#12862)
- @surma:
  - fix: publish session.error event for invalid model selection (#8451)
- @mcostasilva:
  - fix(tui): use sender color for queued messages (#12832)
- @github-actions[bot]:
  - Update VOUCHED list
- @GeneCodeSavvy:
  - fix: resolve homebrew upgrade requiring multiple runs (#5375) (#10118)
- @riftzen-bit:
  - fix: use absolute paths for sidebar session navigation (#12898)
- @neriousy:
  - test(e2e): redo & undo test (#12974)

## v1.1.53 — 2026-02-05

## Core
- Load user plugins after built-in plugins
- Fix unhandled errors when aborting with queued messages
- User plugins override built-in plugins for the same provider (@rmk40)
- Move Codex 5.3 model definition to plugin to avoid showing unsupported model to other users
- Add session usage tracking to ACP (@SteffenDE)
- Update transforms for GPT-5.3
## TUI
- Allow mouse escape via "esc" labels in dialogs (@AksharP5)
## Desktop
- Make close comment button visible in prompt input (@alexyaroshuk)
- Hide prompt input when there are permissions requests or questions
- More terminal stability fixes
- Modified file color contrast in app for better visibility
- Add button to open files in external applications
- Allow toggling file tree closed independently
- Stop showing SessionSkeleton on new workspace (@dbpolito)
- Set workspace name earlier to improve creation and deletion (@dbpolito)

**Thank you to 7 community contributors:**
- @SteffenDE:
  - feat(acp): add session usage (#12299)
- @dbpolito:
  - feat(desktop): Set Workspace Name Earlier to Improve Creation / Deletion (#12213)
  - feat(desktop): Stop Showing SessionSkeleton on New Workspace (#12209)
- @alexyaroshuk:
  - fix(app): make close comment button visible in prompt input  (#12349)
- @edoedac0:
  - docs: add Bosnian README translation (#12341)
- @ariane-emory:
  - docs: websearch tool (#12359)
- @rmk40:
  - fix(plugin): user plugins override built-in plugins for same provider (#12361)
- @AksharP5:
  - fix(tui): allow mouse escape via "esc" labels in dialogs  (#11421)

## v1.1.52 — 2026-02-05

## Core
- Enable Claude 3.5 Sonnet (new) model support
- Silently ignore proxy command failures to prevent config initialization crashes
- Ensure GitHub Copilot plugin properly sets headers when used in clients other than TUI
- Bundle GitLab auth plugin directly instead of dynamic install
- Fix plugin installation to use direct package.json manipulation instead of bun add
- Fix image reading with OpenAI-compatible providers like Kimi K2.5 (@zhming0)
- Downgrade xai ai-sdk package due to errors
- Revert model autocomplete feature using models.dev schema reference
- Add models.dev schema reference for model autocomplete in opencode.json (@remorses)
- Adjust task tool description and input to reduce tool call failures with GPT models
- Wait for dependencies before loading custom tools and plugins
- Allow the function to hide or show thinking blocks to be bound to a key (@ariane-emory)
- Skip dependency installation in read-only configuration directories (@shantur)
- Ensure Kimi for Coding plan has thinking enabled by default for k2p5 (@monotykamary)
- Fixed Cloudflare Workers AI provider
- Prevent random hangs in plugin installs when using HTTP proxy by adding --no-cache flag
- Session errors when attachment file not found are now handled gracefully
- Support remote server connections in terminal and fix GLIBC compatibility (@lucas-jo)
## TUI
- Add running spinner to bash tool in TUI (@goniz)
- Add hover states to question tool tabs (@maharshi365)
## Desktop
- File changes not always available in app
- File tree kept in sync with filesystem changes
- Add Bosnian locale (@edoedac0)
- Fix terminal URL handling issues
- Remove extra horizontal padding around prompt input on mobile (@Brendonovich)
- Refresh workspace sessions when switching projects (@neriousy)
- Fixed terminal URL handling in the application
- Fix terminal end-of-line handling issues
- Refresh file contents when changing workspaces to prevent stale data (@ParkerSm1th)
- Derive terminal WebSocket URL from browser origin instead of hardcoded localhost (@0xdsqr)
- Last turn changes rendered in review pane
- Safety triangle for sidebar hover to prevent menu from closing
- Clear comments on prompt submission
- Fix e2e test action in app
- Terminal hyperlink clicks now work correctly
- Fix dated e2e tests in app
- Don't show scroll-to-bottom button unnecessarily
- File tree not staying in sync across projects/sessions
- Move session options to the session page
- Add session options to app
- Opened tabs follow created session
- Removed compression from RPM bundle to save 15 minutes in CI (@goniz)

**Thank you to 13 community contributors:**
- @lucas-jo:
  - fix(terminal): support remote server connections and fix GLIBC compatibility (#11906)
- @goniz:
  - fix(desktop): removed compression from rpm bundle to save 15m in CI (#12097)
  - feat(tui): add running spinner to bash tool in TUI (#12317)
- @monotykamary:
  - fix: ensure kimi-for-coding plan has thinking on by default for k2p5 (#12147)
- @0xdsqr:
  - fix(app): derive terminal WebSocket URL from browser origin instead o… (#12178)
- @ParkerSm1th:
  - fix(desktop): Refresh file contents when changing workspaces to not have stale contents (#11728)
- @shantur:
  - fix(core): skip dependency install in read-only config dirs (#12128)
- @maharshi365:
  - fix(tui): add hover states to question tool tabs (#12203)
- @ariane-emory:
  - feat: Allow the function to hide or show thinking blocks to be bound to a key (resolves #12168) (#12171)
- @neriousy:
  - fix(app): refresh workspace sessions on project switch (#12189)
- @remorses:
  - feat: add models.dev schema ref for model autocomplete in opencode.json (#12112)
- @zhming0:
  - fix(opencode): Fixes image reading with OpenAI-compatible providers like Kimi K2.5. (#11323)
- @Brendonovich:
  - app: remove extra x padding around prompt input on mobile
- @edoedac0:
  - feat(i18n): add Bosnian locale (#12283)

## v1.1.51 — 2026-02-04

## Core
- Revert change that caused headers to be double merged if provider was authenticated in multiple places
- Document the built-in agents
- Prevent double-prefixing of Bedrock cross-region inference models (@sergical)
- Prioritize OPENCODE_CONFIG_DIR for AGENTS.md (@lgladysz)
## TUI
- Restore direct OSC52 support
## Desktop
- Tighten up session padding-top for mobile (@DNGriffin)

**Thank you to 4 community contributors:**
- @lgladysz:
  - fix: prioritize OPENCODE_CONFIG_DIR for AGENTS.md (#11536)
- @DNGriffin:
  - fix(app): tighten up session padding-top for mobile (#11247)
- @sergical:
  - fix: prevent double-prefixing of Bedrock cross-region inference models (#12056)
- @schaoss:
  - docs: add agent-compatible paths to skills documentation (#12067)

## v1.1.50 — 2026-02-04

## Core
- Prevent memory leaks from AbortController closures (@MaxLeiter)
- Revert addition of Trinity model system prompt support
- Add Trinity model system prompt support (@mariamjabara)
- Add shell.env hook for manipulating environment in tools and shell (@tylergannon)
- Use official ai-gateway-provider package for Cloudflare AI Gateway (@elithrar)
- Allow theme colors in agent customization (@IdrisGit)
- Add support for reading skills from .agents/skills directories
- Provider headers from config not applied to fetch requests (@cloudyan)
- Ensure MCP tools are sanitized
- Add .slnx to C#/F# LSP root detection (@workedbeforepush)
- Improve skills system with better prompting, fix permission requests after skill invocation, and ensure agents can locate scripts and resources
- Exclude k2p5 from reasoning variants (@neavo)
- Handle nested array items for Gemini schema validation (@mugnimaestra)
- Plugins are always reinstalled (@neriousy)
- Strip properties and required fields from non-object types in Gemini schema (@ChickenBreast-ky)
- Make CLI run command non-interactive
## TUI
- Add --thinking flag to show reasoning blocks in run command
- Always fall back to native clipboard after OSC52 (@MartinWie)
## Desktop
- Faster end-to-end tests (@neriousy)
- Update command palette placeholder text
- Model selector truncating too soon
- Improve spacing in application UI
- Allow empty prompt with review comments in desktop (@dbpolito)
- Fixed terminal serialization bug in app
- Don't force mount tooltips in the app
- Restore previously opened session tabs on app restart (@ProdigyRahul)
- Edit project dialog icon now shows on hover (@ProdigyRahul)
- Move session search to command palette
- Fix custom providers overflow in app (@DNGriffin)

**Thank you to 18 community contributors:**
- @ChickenBreast-ky:
  - fix(provider): strip properties/required from non-object types in Gemini schema (#11888)
- @neriousy:
  - fix(core): plugins are always reinstalled  (#9675)
  - refactor(e2e): faster tests (#12021)
- @DNGriffin:
  - fix(app):  custom providers overflow (#11252)
- @ProdigyRahul:
  - fix(app): edit project dialog icon on hover (#11921)
  - fix(app): session tabs to open the previous opened (#11914)
- @luiz290788:
  - docs: add --mdns-domain flag documentation (#11933)
- @dbpolito:
  - feat(desktop): Allow empty prompt with review comments (#11953)
- @mugnimaestra:
  - fix: handle nested array items for Gemini schema validation (#11952)
- @neavo:
  - fix: exclude k2p5 from reasoning variants (#11918)
- @workedbeforepush:
  - feat: Add .slnx to C#/F# LSP root detection (#11928)
- @cloudyan:
  - fix: provider headers from config not applied to fetch requests (#11788)
- @MartinWie:
  - fix: always fall back to native clipboard after OSC52 (#11994)
- @IdrisGit:
  - docs: add missing environmental flags to the list (#11146)
  - feat(tui): allow theme colors in agent customization (#11444)
- @elithrar:
  - fix(opencode): use official ai-gateway-provider package for Cloudflare AI Gateway (#12014)
- @tylergannon:
  - feat(plugin): add shell.env hook for manipulating environment in tools and shell (#12012)
- @tlinhart:
  - docs: fix logging example for plugin (#11989)
- @Evren-os:
  - docs: fix grammar and formatting in README (#11985)
- @mariamjabara:
  - feat: add Trinity model system prompt support (#12025)
- @MaxLeiter:
  - fix: prevent memory leaks from AbortController closures (#12024)

## v1.1.49 — 2026-02-03

## Core
- Revert pull request that was mistakenly merged
- Add --mdns-domain flag to customize mDNS hostname (@luiz290788)
- Added and deleted file status now correctly calculated in app
- Add User-Agent header for GitLab AI Gateway requests (@vglafirov)
- Add Ormolu code formatter for Haskell (@mimi1vx)
- Use OpenTUI OSC52 clipboard implementation
- Convert system message content to string for Copilot provider (@jogi47)
- Give OPENCODE_CONFIG_CONTENT proper priority for setting config based on docs (@OpeOginni)
- Fixed session title generation with OpenAI models (@oomathias)
- Simplify directory tree output for prompts
- Fix task status to show current tool state from message store
- Allow starting new sessions after errors by fixing stuck session status
- Adjust resolve parts to properly order tool calls when messages contain multiple @ references
- Hide badge for builtin slash commands
- Add workspace tests to the app (@neriousy)
- Send custom agent prompts as developer messages instead of user messages when using Codex subscriptions
- Fixed variant logic for Anthropic models through OpenAI compatibility endpoint
- Add prompt caching support for Claude Opus on AWS Bedrock (@rgodha24)
- Scope agent variant to model (@neavo)
- Prevent duplicate AGENTS.md injection when reading instruction files (@code-yeongyu)
- OpenCode no longer hangs when using client.app.log() during initialization (@desmondsow)
- Remove outer backtick wrapper in session transcript tool formatting (@zerone0x)
- Allow user plugins to override built-in auth plugins (@JosXa)
- Binary file handling in file view (@alexyaroshuk)
- Ensure switching Anthropic models mid-conversation works without errors and fix reasoning opaque not being picked up for Gemini models
- Fix issue where folders and files starting with "." could not be mentioned with @
- Show actual retry error message instead of generic error message
- Use process.env directly for runtime environment mutations in provider (@jerome-benoit)
- Add reasoning variants support for SAP AI Core (@jerome-benoit)
- Add UTF-8 encoding defaults for Windows PTY (@01luyicheng)
## TUI
- Respect terminal transparency in system theme (@pablopunk)
- Truncate session title in exit banner to prevent display overflow
- Show exit message banner in TUI
- Add spinner animation for Task tool
- Correct pluralization of match count in grep and glob tools (@adamjhf)
- Remove extra padding between search and results in dialog-select
- Add UI for skill tool in session view
- Conditionally render bash tool output in TUI
- Add skill dialog for selecting and inserting skills
- Enable password authentication for remote session attachment
- Fix documentation issues (@lailoo)
- Revert skill slash commands feature
- Add skill slash commands to the app
## Desktop
- Fix prompt input overflow issue in app (@neriousy)
- Sidebar losing projects on collapse has been fixed
- Add workspace toggle command to command palette and prompt input (@alexyaroshuk)
- Search through sessions
- Standardize icon sizes in the application
- Navigate to last project on open
- User messages not rendering consistently
- Add project context menu on right-click
- Open project search in app (@neriousy)
- Add tab close keybind to app (@ProdigyRahul)
- Enhance responsive design with additional breakpoints for larger screen layout adjustments (@OpeOginni)
- Add keyboard shortcuts for navigating between unread sessions (@Brendonovich)
- Fix Rust build and bindings formatting in desktop application (@Brendonovich)
- Remove unnecessary setTimeout in desktop app (@Brendonovich)
- Throttle window state persistence in desktop application (@Brendonovich)
- Integrate tauri-specta for desktop application (@Brendonovich)
- Keep macOS titlebar stable under zoom (@Brendonovich)
- Kill zombie server process on startup timeout (@heyitsmohdd)
- Show skill and MCP badges for slash commands
- Use static language names in Thai localization (@alexyaroshuk)
- Add tests for general settings, shortcuts, providers and status popover (@neriousy)
- Fixed session header 'share' button to hug content (@alexyaroshuk)

**Thank you to 29 community contributors:**
- @alexyaroshuk:
  - fix(app): session header 'share' button to hug content (#11371)
  - fix(app): use static language names in Thai localization (#11496)
  - fix(app): binary file handling in file view (#11312)
  - feat(app): add workspace toggle command to command palette and prompt input (#11810)
- @01luyicheng:
  - fix(pty): Add UTF-8 encoding defaults for Windows PTY (#11459)
  - docs: improve zh-TW punctuation to match Taiwan usage (#11574) (#11589)
- @jerome-benoit:
  - feat(opencode): add reasoning variants support for SAP AI Core (#8753)
  - fix(nix): restore native runners for darwin hash computation (#11495)
  - fix(provider): use process.env directly for runtime env mutations (#11482)
  - fix(ci): portable hash parsing in nix-hashes workflow (#11533)
- @lailoo:
  - docs: fix documentation issues (#11435)
- @neriousy:
  - test(app): general settings, shortcuts, providers and status popover  (#11517)
  - fix(app): rendering question tool when the step are collapsed (#11539)
  - fix(app): show retry status only on active turn (#11543)
  - docs: prefer wsl over native windows stuff (#11637)
  - test(app): workspace tests (#11659)
  - fix(app): open project search (#11783)
  - fix(app): prompt input overflow issue (#11840)
- @adamjhf:
  - fix: correct pluralization of match count in grep and glob tools (#11565)
- @AlperKartkaya:
  - docs: add Turkish README translation (#11524)
- @JosXa:
  - fix: allow user plugins to override built-in auth plugins (#11058)
- @AxelMrak:
  - fix(ecosystem): fix link Daytona  (#11621)
- @zerone0x:
  - fix(tui): remove outer backtick wrapper in session transcript tool formatting (#11566)
- @desmondsow:
  - fix: opencode hanging when using client.app.log() during initialization (#11642)
- @code-yeongyu:
  - fix: prevent duplicate AGENTS.md injection when reading instruction files (#11581)
- @neavo:
  - fix(opencode): scope agent variant to model (#11410)
- @gigamonster256:
  - fix(desktop): nix - add missing dep (#11656)
- @rgodha24:
  - fix: prompt caching for opus on bedrock (#11664)
- @sum2it:
  - docs (web): Update incorrect Kimi model name in zen.mdx (#11677)
- @aaroniker:
  - feat(ui): Select, dropdown, popover styles & transitions (#11675)
  - feat(ui): Smooth fading out on scroll, style fixes (#11683)
- @oomathias:
  - fix: session title generation with OpenAI models. (#11678)
- @OpeOginni:
  - fix(opencode): give OPENCODE_CONFIG_CONTENT proper priority for setting config based on docs (#11670)
  - fix(desktop): added inverted svg for steps expanded for nice UX (#10462)
  - feat(app): enhance responsive design with additional breakpoints for larger screen layout adjustments (#10459)
- @jogi47:
  - fix: convert system message content to string for Copilot provider (#11600)
- @heyitsmohdd:
  - fix(desktop): kill zombie server process on startup timeout (#11602)
- @Brendonovich:
  - fix(desktop): keep mac titlebar stable under zoom (#11747)
  - chore(desktop): integrate tauri-specta (#11740)
  - fix(desktop): throttle window state persistence (#11746)
  - fix(desktop): remove unnecessary setTimeout
  - desktop: fix rust build + bindings formatting
  - feat(app): unread session navigation keybinds (#11750)
- @ldelelis:
  - fix(ui): adjusts alignment of elements to prevent incomplete scroll (#11649)
- @sam-huckaby:
  - Fix(app): the Vesper theme's light mode (#9892)
- @mimi1vx:
  - feat(opencode): ormolu code formatter for haskell (#10274)
- @ProdigyRahul:
  - feat(app): add tab close keybind (#11780)
- @vglafirov:
  - feat(provider): add User-Agent header for GitLab AI Gateway requests (#11818)
- @pablopunk:
  - fix(tui): respect terminal transparency in system theme (#8467)
- @luiz290788:
  - feat(server): add --mdns-domain flag to customize mDNS hostname (#11796)

## v1.1.48 — 2026-01-31

## Core
- Sync changes
- Allow specifying custom models file path via OPENCODE_MODELS_PATH environment variable
- Ensure models configuration is not empty before loading
- Make skills invokable as slash commands in the TUI
- Don't follow symbolic links by default in grep and ripgrep operations
- Prevent parallel test runs from contaminating environment variables
- Ensure Mistral ordering fixes also apply to Devstral
- Add Copilot-specific provider to properly handle reasoning tokens (@SteffenDE)
- Respect OPENCODE_MODELS_URL environment variable in build process (@bbartels)
- Use snake_case for thinking parameter with OpenAI-compatible APIs (@Chesars)
- Bump AI SDK packages
- Ensure ask question tool isn't included when using acp
- Handle redirected statement treesitter node in bash permissions (@pschiel)
- Remove special case handling for Google Vertex Anthropic provider in response generation (@MichaelYochpaz)
- Exclude chat models from textVerbosity setting
## Desktop
- Revert transitions, spacing, scroll fade, and prompt area updates
- Add session actions tests (@neriousy)
- Refactored tests and added project tests (@neriousy)

**Thank you to 7 community contributors:**
- @neriousy:
  - refactor(app): refactored tests + added project tests (#11349)
  - test(app): session actions (#11386)
- @MichaelYochpaz:
  - refactor(provider): remove google-vertex-anthropic special case in ge… (#10743)
- @pschiel:
  - fix: handle redirected_statement treesitter node in bash permissions (#6737)
- @IdrisGit:
  - docs: update agents options section to include color and top_p options (#11355)
- @Chesars:
  - fix(provider): use snake_case for thinking param with OpenAI-compatible APIs (#10109)
- @bbartels:
  - feat(build): respect OPENCODE_MODELS_URL env var (#11384)
- @SteffenDE:
  - feat(opencode): add copilot specific provider to properly handle copilot reasoning tokens (#8900)

## v1.1.47 — 2026-01-30

## Core
- I need to see the actual commit message to summarize it. Could you please provide the commit message you'd like me to summarize for the changelog entry?

## v1.1.46 — 2026-01-30

## Core
- Remove unused experimental keys from TUI (@IdrisGit)
- Add continuous integration configuration
- Remove AI SDK middleware that was preventing think blocks from being sent back as assistant message content
## Desktop
- Change language test in app (@neriousy)
- Add transitions, spacing improvements, scroll fade effects, and prompt area updates (@aaroniker)

**Thank you to 3 community contributors:**
- @aaroniker:
  - feat: Transitions, spacing, scroll fade, prompt area update (#11168)
- @neriousy:
  - test(app): change language test (#11295)
- @IdrisGit:
  - chore(tui): remove unused experimental keys (#11195)

## v1.1.45 — 2026-01-30

## Desktop
- Free model layout improvements in app

## v1.1.44 — 2026-01-30

No notable changes

## v1.1.43 — 2026-01-30

No notable changes

## v1.1.42 — 2026-01-29

## Core
- Revert to Anthropic completions endpoint to avoid rate limiting issues with copilot
- Fix frontmatter adding newlines causing invalid model IDs
- Ensure that Kimi doesn't have fake variants available
- Add sequential numbering for forked session titles (@ariane-emory)
## TUI
- Add additional timeout race condition guards
- Guard destroyed input field in timeout callback
- Include cache tokens in CLI statistics (@bold84)

**Thank you to 2 community contributors:**
- @bold84:
  - feat(cli): include cache tokens in stats (#10582)
- @ariane-emory:
  - feat: Sequential numbering for forked session titles (Issue #10105) (#10321)

## v1.1.41 — 2026-01-29

## Core
- Ensure variants for Copilot models work with maxTokens being set
- Fixed maxOutputTokens being accidentally hardcoded to undefined which caused kimi-k2.5 issues on some inference providers (@ideallove)
- Include provider ID in SDK cache key to prevent cache collisions (@saba-ch)
- Allow media-src data: URL for small audio files in Content Security Policy (@tanapok)
- Update experimental environment variables in CLI documentation (@bbabou)
- Add `ctx.abort` to grep tool
- Add AbortSignal support to Ripgrep.files() and GlobTool (@goniz)
## Desktop
- Make settings more responsive for mobile and small web/desktop (@DNGriffin)
- Fixed type errors in app package (@Brendonovich)
- Auto scroll to file tabs on open and enable mouse wheel scrolling (@alexyaroshuk)
- Remove duplicate keys causing TypeScript failures (@eXamadeus)
- Normalize Chinese punctuation for Chinese UI (@MaxMiksa)
- Fill missing Chinese translation keys to avoid English fallback (@MaxMiksa)
- Fix alignment and padding in dialogs (@alexyaroshuk)

**Thank you to 12 community contributors:**
- @R44VC0RP:
  - fix(script): remove highlights template from release notes (#11052)
- @zerone0x:
  - fix(ui): allow KaTeX inline math to be followed by punctuation (#11033)
- @alexyaroshuk:
  - fix(app): alignment and padding in dialogs (#10866)
  - fix(app): file tabs - auto scroll on open & scroll via mouse wheel (#11070)
- @MaxMiksa:
  - fix(app): fill missing zh keys to avoid English fallback (#10841)
  - fix(opencode): normalize zh punctuation for Chinese UI (#10842)
  - fix(ui): improve zh duration display formatting (#10844)
- @goniz:
  - fix(opencode): add `AbortSignal` support to `Ripgrep.files()` and `GlobTool` (#10833)
- @eXamadeus:
  - fix(typescript errors): remove duplicate keys causing typescript failures (#11071)
- @Brendonovich:
  - fix(app): types
- @bbabou:
  - docs: update experimental environment variables in CLI docs (#11030)
- @DNGriffin:
  - fix(app): make settings more responsive for mobile and small web/desktop (#10775)
- @tanapok:
  - fix(opencode): allow media-src data: URL for small audio files (#11082)
- @saba-ch:
  - fix(provider): include providerID in SDK cache key (#11020)
- @ideallove:
  - fix: maxOutputTokens was accidentally hardcoded to undefined  (#10995)

## v1.1.40 — 2026-01-28

## Core
- Add SubtaskPart with metadata reference (@YangTianz)
- Add global configuration support to app
- Global configuration updates in app package
- Bump plugins
## TUI
- Add streaming prop to markdown element (@remorses)
## Desktop
- Close review pane when pressing escape key
- Enable ctrl+n and ctrl+p for popover navigation in desktop app (@sairajchouhan)
- Add Thai locale support (@natt-v)
- Add custom provider support to app

**Thank you to 4 community contributors:**
- @natt-v:
  - feat(i18n): add th locale support (#10809)
- @sairajchouhan:
  - fix(desktop): enable ctrl+n and ctrl+p for popover navigation (#10777)
- @YangTianz:
  - fix: add SubtaskPart with metadata reference (#10990)
- @remorses:
  - fix(markdown): Add streaming prop to markdown element (#11025)

## v1.1.39 — 2026-01-28


## Core
- Ensure Copilot plugin properly sets headers for new messages API

## v1.1.38 — 2026-01-28

## Core
- Prevent AGENTS.md from being loaded multiple times during parallel tool execution
- Bump plugin version
- Ensure unsubscribe from PartUpdated is always called in TaskTool (@goniz)
- Restore brand integrity of CLI wordmark (@mynameistito)
- Add experimental OpenTUI markdown component to app (@remorses)

**Thank you to 4 community contributors:**
- @remorses:
  - feat(app): use opentui markdown component behind experimental flag (#10900)
- @jamesmurdza:
  - docs: add Daytona OpenCode plugin to ecosystem (#10917)
- @mynameistito:
  - fix(cli): restore brand integrity of CLI wordmark (#10912)
- @goniz:
  - fix(opencode): ensure unsub(PartUpdated) is always called in TaskTool (#9992)

## v1.1.37 — 2026-01-28

## Core
- Support headless authentication for ChatGPT/Codex (@rgodha24)
- Add recommended topP and temperature settings for Kimi K2.5 model
- Adjust retry check to be more defensive
- Handle Venice cache creation tokens (@dpuyosa)
- Add worktree to plugin tool context
- Expose Instance.directory to custom tools
- Use Instance.directory instead of process.cwd() in read tool
- Fix reactive file tree to properly update when files change
- Attach Anthropic beta headers when using Messages API for Copilot
- Add retry logic to handle certain provider problems
- Ensure OpenAI 404 errors are retried (@tim-smart)
- Use Anthropic-compatible messages API for Anthropic models through Copilot
- Upgrade OpenTUI to v0.1.75
- Dynamically resolve AGENTS.md files from subdirectories as agent explores them
- Add agent description to OpenCode (@SteffenDE)
- Fix query selector handling of non-Latin characters
- Await SessionRevert.cleanup for shell to prevent race conditions (@noamzbr)
- Don't override source in custom provider loaders
- Add provider settings to app
- Run start command after reset in app
- Remove log statement
## TUI
- Handle 4-5 digit codes in copy logic
- Make diff wrapping toggle always available in command list and fix type error (@ariane-emory)
- Add visual feedback for diff wrap and conceal toggles (@IdrisGit)
- Adjust TUI syncing logic to prevent agents from being undefined or missing
- Remove broken app.tsx command option
- Move animations toggle to global System category (@ariane-emory)
## Desktop
- Reintroduce review tab in app
- Auto-scroll to keep relevant content in view
- Add 'connect provider' button to the manage models dialog (@alexyaroshuk)
- Fix terminal corruption issue in app
- File tree not always loading in app
- Fix outdated e2e test in app package
- Do not auto-navigate to last project on app load
- Add Tauri localization support to desktop application
- Add internationalization support for Tauri desktop application
- Better memory management in app
- Don't connect to localhost through VPN
- Show 5 highlights in app
- Highlight selected change in the app
- Set filetree padding to 6px
- Align file tree change styling
- Delay navigation tooltips
- Adjust titlebar left spacing
- Shorten navigation tooltips
- Add filetree tooltips with diff labels
- Color file tree change dots by diff kind
- Improved app layout
- Fix session diffs not always loading in app
- New end-to-end smoke tests for app
- Add translations to the app
- Update settings in general settings
- Swallow file search errors in app
- Fix tooltips causing getComputedStyle errors in model select
- Clean up Tailwind CSS versus pure CSS usage in app
- Navigate to tabs when opening file in app
- Open markdown links in external browser
- Shared terminal ghostty-web instance for better performance
- Cleanup connect provider timers
- Don't keep parts in memory
- Don't show session skeleton after workspace reset
- Add max-width to tabs with text truncation
- Use smaller close icon on tabs to match comment cards
- Only show left border on plus button when sticky
- Update review empty states to 14px font size and align select file empty state
- Center file tree empty state with 32px top margin
- Implement non-fatal error handling in app
- Fix agent fallback colors in app
- Added forward and back navigation buttons
- Add missing tooltips in app
- Auto-scroll button sometimes sticks in the app
- Deduplicate Tauri configuration files (@Brendonovich)
- Only show files in select dialog when clicking + tab
- Disable magnification gestures on macOS desktop (@ysm-dev)
- Add Connect provider in model selector (@ProdigyRahul)
- Add file tree specification tests
- Enable file watcher in app
- Improve file tree performance in app
- Add highlights feature
- Add new release modal
- Fix Zen mode disconnect not working in app
- Disconnect Zen provider
- Fix e2e test in app package
- Disable tooltips in file tree tabs
- Move file tree toggle button to the right side
- Fade filetree guide lines on hover
- Dim non-deep filetree guide lines in the app interface
- Reduce file tree folder indent
- Refine file tree row spacing and indentation
- Use medium font weight for filetree items
- Use chevron icons for filetree folders
- Tighten file tree row spacing
- Adjust filetree panel padding
- Scope filetree pill tabs styling
- Add Vercel AI Gateway provider description
- Add provider descriptions to settings
- Add transition to command palette
- Add transition to select provider dialog
- Add optional transition animations to dialog
- Style view all button with interactive color and margin
- Add models icon and use in settings UI
- Add providers icon and use in settings
- Use default cursor for environment provider text
- Add hover text for environment-connected providers
- Set provider row height to 56px
- Update button styles and disconnect button size in UI
- Fix session synchronization issue in application
- Add missing i18n strings in app
- Add session load limit to prevent excessive memory usage
- Add end-to-end test for sidebar navigation
- Replace signals with createStore in app
- Add file tree mode to app
- Add file tree view to app
- Use focus-visible instead of focus to prevent sticky hover effect on click (@ProdigyRahul)
- Better sidebar hover behavior when collapsed
- Make sidebar full-height in app
- Add full-height hover effect to sidebar
- Add model settings to application
- Add model settings interface to app
- Handle non-tool call permissions in app
- Default servers on web
- Performance improvements in the app
- Add missing translations for status messages
- Don't allow workspaces in non-VCS projects

**Thank you to 17 community contributors:**
- @MartinWie:
  - docs: fix permission event name (permission.asked not permission.updated) (#10588)
- @ariane-emory:
  - fix(tui): Move animations toggle to global System category (resolves #10495) (#10497)
  - fix: Make diff wrapping toggle always available in command_list and correct a type error (resolves #10682) (#10683)
- @R44VC0RP:
  - Add highlight tag parsing for changelog with video support
  - Add collapsible sections, sticky version header, and style refinements for changelog highlights
  - fix(web): update spacing on the changelog page
  - docs: add warning about Claude Pro/Max subscription support (#10595)
  - fix: move changelog footer outside content div to fix padding (#10712)
  - fix: add 44px top padding to sticky version header on changelog (#10715)
  - feat(release): add highlights template to draft releases (#10745)
  - feat: add /learn command to extract session learnings to scoped AGENTS.md files (#10717)
- @IdrisGit:
  - fix(tui): add visual feedback for diff wrap and conceal toggles (#10655)
- @noamzbr:
  - fix: await SessionRevert.cleanup for shell (#10669)
- @SteffenDE:
  - feat(opencode): add agent description (#10680)
- @sam-huckaby:
  - fix(app): Order themes alphabetically (#10698)
- @alexyaroshuk:
  - fix(app): restore external link opening in system browser (#10697)
  - feat(app): add 'connect provider' button to the manage models dialog (#10887)
- @ProdigyRahul:
  - fix(ui): use focus-visible instead of focus to prevent sticky hover effect on click (#10651)
  - fix(app): add connect provier in model selector (#10706)
- @zerone0x:
  - fix(enterprise): add message navigation to share page desktop view (#10071)
- @tim-smart:
  - fix: ensure openai 404 errors are retried (#10590)
- @fabiomartino:
  - docs: add Italian README (#10732)
- @ysm-dev:
  - fix(desktop): disable magnification gestures on macOS (#10605)
- @Brendonovich:
  - desktop: deduplicate tauri configs
- @dpuyosa:
  - feat(opencode): Handle Venice cache creation tokens (#10735)
- @OpeOginni:
  - chore(docs): Better explanation on how to allow tools in external directories (#10862)
- @rgodha24:
  - feat: support headless authentication for chatgpt/codex (#10890)

## v1.1.36 — 2026-01-25

## Core
- Enable thinking for Google Vertex Anthropic models (@MichaelYochpaz)
- Make question validation more lax to avoid tool call failures
## TUI
- Prevent crash when theme search returns no results (@ishaksebsib)
## Desktop
- Visual cleanup in app
- Scroll to comment on click in app
- Fixed crash when no default model is set
- Performance improvements in the app package
- Clean up comment component usage in app

**Thank you to 5 community contributors:**
- @MichaelYochpaz:
  - fix(provider): enable thinking for google-vertex-anthropic models (#10442)
- @ProdigyRahul:
  - fix(app): cursor on resize (#10293)
- @DNGriffin:
  - fix(app): mobile horizontal scrolling due to session stat btn (#10487)
- @ishaksebsib:
  - fix(tui): prevent crash when theme search returns no results (#10565)
- @R44VC0RP:
  - fix(web): add & fix the download button (#10566)

## v1.1.35 — 2026-01-25

## Core
- Add tests
- Sync changes from upstream
- Fix models snapshot loading to prevent caching issues
- Fix Nix configuration
- Fix unicode filename handling in snapshot diff by disabling quote escaping
- Deep merge providerOptions in applyCaching to preserve nested configuration (@zerone0x)
- Construct apply_patch metadata before requesting permission in web interface (@brittlewis12)
- Remove models.dev macro
- Tell the model what model it is in the environment section of the prompt
- Retry web fetch with simple user agent on 403 errors (@Arasple)
- Allow GPT-5.1-Codex model in Codex auth plugin (@Danztee)
- Bump gitlab-ai-provider version (@vglafirov)
- Add model information as part of task metadata (@shantur)
- Add xhigh reasoning effort for GitHub Copilot GPT-5 models (@Arthur742Ramos)
- Normalize path separators for session diff filtering on Windows (@alexyaroshuk)
- Faster workspace creation
## TUI
- Fix question selection click when terminal is unfocused (@maharshi365)
- Use min/maxHeight for question textarea
- Permission prompt should ignore keyboard events while dialog stack length is greater than zero (@justfortheloveof)
- Use selectedForeground for question prompt tab text visibility (@ariane-emory)
- Always center selected item in selection dialogs (@ariane-emory)
## Desktop
- Fix submit button state in app
- Fix unnecessary suspense flash in app
- Add active state to comment cards in prompt input
- Fix type error
- Terminal clone needs remount to function properly
- Remove terminal connection error overlay
- Remove space between ellipsis and truncated text in comment card tooltip
- Update status popover empty state text color and centering
- Prevent focus on share popover text field
- Add link icon and use it for copy-to-clipboard buttons in UI
- Adjust share popover position 64px to the left
- Update share popover gutter to 6px and radius to match status dropdown
- Add 8px spacing between share button and icon buttons in titlebar
- Replace Popover with DropdownMenu for server options in app
- Update options icon button styling with improved active state and hover effects
- Change server item actions div padding from px-4 to pl-4
- Add onFilter callback to List component and hide add server row during search
- Position status circle inside input wrapper and fix dialog padding
- Remove hover background color from server list items
- Allow add server row to grow for error messages in app
- Update add server button and row styling in app
- Update manage servers dialog styling and behavior
- Add truncation tooltip to server items in status popover
- Update server and MCP item styles in status popover
- Update status popover styling and positioning
- Use 4px border radius (rounded-sm) consistently in app components
- Update titlebar spacing and status popover styling in app
- Enable submit button when comment cards are present in app
- Add back button in subagent sessions (@tomzhu1024)
- Model select dropdown not closing when pressing Escape key
- Improve model selector user experience
- Fix inability to select text when creating a new session
- Fix scrolling in unpaid model selector
- Fix Adam integration issue
- Add critical shadow for comment input validation and set editor popover radius to 14px
- Improve comment popover with better error styling and click-outside detection
- Change prompt placeholder based on comment count in app
- Adjust prompt container padding to 16px on bottom and horizontal sides
- Adjust prompt input positioning to 12px from bottom and right edges, remove session panel bottom padding
- Add escape/click-away to close read-only comment popovers, 10px radius, and remove 'Click to view context' text
- Don't use findLast in app package
- Add state to pause existing audio for demo menus and add support for audio controls (@jcampuza)
- Implement new server management for web and desktop (@OpeOginni)
- New workspace appears expanded and at the top of the list
- Missing translations in app
- Better error screen when connecting to sidecar
- Fix line selection issues in the app
- Fixed reactive loops in the app
- Better session stream rendering performance
- Add Iosevka as a font choice in desktop app (@ariane-emory)
- Always close hovercard when view-sessions is clicked (@DNGriffin)
- Close comment input popover on Escape key or click away
- Use shadow-lg-border-base on read-only comment popovers and align label spacing
- Remove border from comment input popover
- Position read-only comment popover below icon with 4px gutter
- Style comment popovers with 14px radius, move label below comment, and adjust text colors and sizes
- Move filename and line count below comment text in popovers
- Add tooltip with path, 6px spacing before close icon, and reduce filename truncation to 14 characters in editor tabs
- Add middle truncation for filename in comment card
- Truncate filename from start to show end of path in the app
- Remove gap between filename and comment in comment card
- Add shadow-xs-border with hover state to comment card
- Fix comment card styling with 48px height, 2px gap, and truncated filename while preserving line count visibility
- Increase comment font size to 12px in the app
- Add 8px gap before close icon and truncate long filenames in app
- Keep close icon in top right of comment card
- Add transition-all to comment card hover states
- Add close-small icon and use it for comment card dismiss button
- Truncate comment text and set card max-width to 200px in app
- Indent comment text to align with filename in context card
- Style submitted comment icons to match comment popup style
- Update prompt input styling with refined borders, hover states, and spacing
- Update context cards styling with 8px padding/gap and 6px border radius
- Add button-primary-base variable and use primary variant for Comment button
- Improve comment popup styling and add new comment icon
- Center checkbox indicator in provider selection (@ProdigyRahul)
- Auto-open OAuth links for Codex and Copilot (@edoedac0)
- Close delete workspace dialog immediately
- Don't remount directory layout in app for better performance
- Reapply work in progress changes for line selection feature in app
- Revert line selection work in progress
- Fix view all sessions flakiness in app (@DNGriffin)

**Thank you to 18 community contributors:**
- @ProdigyRahul:
  - fix(app): enable dialog dismiss on model selector (dialog.tsx) (#10203)
  - fix(app): center checkbox indicator in provider selection (#10267)
  - fix(app): tooltip text in light mode to use inverted neutral scale (#9786)
  - fix(app): markdown rendering with morphdom for better dom functions (#10373)
- @DNGriffin:
  - fix(app): View all sessions flakiness  (#10149)
  - fix(app): Fix plan mode btn keyboard a11y issues (#10330)
  - fix(app): Always close hovercard when view-sessions clicked (#10326)
- @shantur:
  - docs(ecosystem): Add CodeNomad entry to ecosystem documentation (#10222)
  - feat(tasks): Add model info as part of metadata (#10307)
- @edoedac0:
  - feat(app): auto-open oauth links for codex and copilot (#10258)
- @ariane-emory:
  - feat: always center selected item in selection dialogs (resolves #10209) (#10207)
  - feat(desktop): add Iosevka as a font choice (resolves #10103) (#10347)
  - fix(tui): Use selectedForeground for question prompt tab text visibility (resolves #10334) (#10337)
- @alexyaroshuk:
  - fix(app): normalize path separators for session diff filtering on Windows (#10291)
- @Arthur742Ramos:
  - fix: add xhigh reasoning effort for GitHub Copilot GPT-5 models (#10092)
- @vglafirov:
  - fix: bump gitlab-ai-provider version (#10255)
- @Danztee:
  - fix: allow gpt-5.1-codex model in codex auth pluginFixes (#10181)
- @Arasple:
  - fix: retry webfetch with simple UA on 403 (#10328)
- @neriousy:
  - feat(docs): add a desktop troubleshooting guide (#10397)
- @justfortheloveof:
  - fix: permission prompt should ignore keyboard events while dialog stack len > 0 (#10338)
- @brittlewis12:
  - fix(web): construct apply_patch metadata before requesting permission (#10422)
- @OpeOginni:
  - feat(web): implement new server management for web and desktop (#8513)
- @zerone0x:
  - fix(provider): deep merge providerOptions in applyCaching (#10323)
- @jcampuza:
  - fix: add state to pause existing audio for demo menus, add support fo… (#10428)
- @maharshi365:
  - fix(opentui): question selection click when terminal unfocused (#9731)
- @tomzhu1024:
  - feat(app): back button in subagent sessions (#10439)

## v1.1.34 — 2026-01-23

## Desktop
- Fixed a reactive feedback loop in the global project cache sync (@Eric-Guo)
- Add line selection functionality to the app

**Thank you to 1 community contributor:**
- @Eric-Guo:
  - fix(desktop): Fixed a reactive feedback loop in the global project cache sync (#10139)

## v1.1.33 — 2026-01-23

## Core
- Add thinking presets for Google Vertex Anthropic provider (@zerone0x)
- Added support for OpenAI-based GitLab Duo models (@vglafirov)
- Show file path in apply_patch request permission screen (@iltenahmet)
## TUI
- Add weight to fuzzy search to maintain title priority in TUI (@IdrisGit)
## Desktop
- Session shouldn't be keyed
- Flash of fallback icon for projects fixed
- Fix project icon color flash on load
- Fixed folder suggestions missing last part in path completion
- Allow adding projects from any directory depth
- Allow adding projects from root directory in the app
- Non-git projects can now be renamed
- Add app version display to settings (@alexyaroshuk)

**Thank you to 5 community contributors:**
- @iltenahmet:
  - fix(ui): show file path in apply_patch request permission screen (#10079)
- @alexyaroshuk:
  - feat(app): add app version display to settings (#10095)
- @IdrisGit:
  - fix(tui): add weight to fuzzy search to maintain title priority (#10106)
- @vglafirov:
  - feat(gitlab): Added support for OpenAI based GitLab Duo models (#10108)
- @zerone0x:
  - fix(provider): add thinking presets for Google Vertex Anthropic (#9953)

## v1.1.32 — 2026-01-22

<highlight source="Desktop">
  <h2>Multi-Language Support</h2>
  <p short="OpenCode Desktop now available in 14 languages.">
    OpenCode Desktop now available in 14 languages.
  </p>

https://github.com/user-attachments/assets/e5d612cf-20fc-4d55-824d-7f66b9733da2

</highlight>


## Core
- Revert handling of special characters in paths and git snapshot reading logic
- Revert snapshot regression fix
- Ensure cat command triggers external directory permission check in Bash tool
- Print MCP stderr to OpenCode log file (@karta0807913)
- Write refresh tokens to OpenAI auth in Codex (@CasualDeveloper)
- Add workspace startup script to projects
- Ensure images are properly returned as tool results
- Rename `setSessionModel` to `unstable_setSessionModel` in ACP (@maxious)
- Correct spelling of 'supercedes' to 'supersedes' (@luojiyin1987)
- Add prompt cache key support for Venice provider (@dpuyosa)
- Include noop tool in activeTools for LiteLLM proxy compatibility (@danielfrg)
## TUI
- Allow remote directory specification in attach command (@gricha)
## Desktop
- Add Brazilian Portuguese locale support (@ygorsimoes)
- Make 'Learn More' link functional in theme settings (@LAG-4)
- Render images in session review
- Fix Windows path handling in app tests
- Fix new session button in app
- Add translations support to app
- Delete sessions
- Close projects from hover card
- Don't auto-navigate to workspace after reset
- Expand font stacks to include macOS Nerd Font default names (@bewareoftheleopard)
- Clear session hover state on navigation (@kyashrathore)
- Correct NO_PROXY environment variable syntax in desktop application (@Brendonovich)
- Improve desktop connection reliability (@Brendonovich)
- Add terminal smoke test to app test suite
- Add file viewer smoke test
- Add model picker smoke test
- Add smoke test for @ attachment functionality
- Add slash command smoke tests to app
- Settings smoke tests
- Fix type error in codebase
- Fix TypeScript satisfies operator usage
- Fix hover card scrolling behavior
- Auto-scroll to bottom when new messages arrive
- Add scrollbar styling to session page (@alexyaroshuk)
- Add support for Norwegian translations (@Finityno)
- Snap to bottom when user submits a prompt
- Add accessibility translations to the app
- Change project path tooltip position to bottom in desktop app (@ProdigyRahul)
- Session screen accessibility improvements (@ndarilek)
- Move markdown rendering to Rust in desktop app (@nexxeln)
- Add 8px left margin to sidebar toggle on desktop
- Match terminal toggle button size with sidebar and review toggles
- Update jump to latest button with circular design and animation
- Add Arabic language support (@NourEldin-Osama)
- Always show Toggle-Review button in app (@DNGriffin)
- Open terminal pane when creating new terminal (@kearns-cu)

**Thank you to 24 community contributors:**
- @R44VC0RP:
  - fix: scope PR recap to only PRs from today (#9905)
- @danielfrg:
  - fix: include _noop tool in activeTools for LiteLLM proxy compatibility (#9912)
- @dpuyosa:
  - feat: Add promptCacheKey for Venice provider (#9915)
- @kearns-cu:
  - fix(app): open terminal pane when creating new terminal (#9926)
- @luojiyin1987:
  - fix: correct spelling 'supercedes' to 'supersedes' (#9935)
- @maxious:
  - fix(acp): rename setSessionModel to unstable_setSessionModel (#9940)
- @IdrisGit:
  - docs: add API server section in CONTRIBUTING.md (#9888)
- @DNGriffin:
  - feat(app): always show Toggle-Review button  (#9944)
- @NourEldin-Osama:
  - feat(i18n): add Arabic language support (#9947)
- @nexxeln:
  - refactor(desktop): move markdown rendering to rust (#10000)
- @ndarilek:
  - fix(app): session screen accessibility improvements (#9907)
- @ProdigyRahul:
  - fix(desktop): change project path tooltip position to bottom (#9497)
- @Finityno:
  - feat: Add support for Norwegian translations (#10018)
- @alexyaroshuk:
  - feat(app): add scrollbar styling to session page (#10020)
  - fix(ui): prevent copy buttons from stealing focus from prompt input (#10084)
- @Brendonovich:
  - fix(desktop): attempt to improve connection reliability
  - fix(desktop): correct NO_PROXY syntax
- @kyashrathore:
  - fix(app): clear session hover state on navigation (#10031)
- @ryanmiville:
  - fix(app): support ctrl-n/p in lists (#10036)
- @bewareoftheleopard:
  - fix(desktop): Expand font stacks to include macOS Nerd Font default names  (#10045)
- @CasualDeveloper:
  - fix(codex): write refresh tokens to openai auth (#10010) (#10011)
- @karta0807913:
  - feat(mcp log): print mcp stderr to opencode log file (#9982)
- @LAG-4:
  - fix: make 'Learn More' link functional in theme settings (#10078)
- @shubh73:
  - feat(ui): add aura theme (#10056)
- @ygorsimoes:
  - feat(i18n): add br locale support (#10086)
- @gricha:
  - fix(attach): allow remote --dir (#8969)

## v1.1.31 — 2026-01-22

## Core
- Mark subagent sessions as agent-initiated to exclude them from quota limits
- Add chat.headers hook and update codex and copilot plugins to use it (thanks to @ananas-viber for catching)
## TUI
- Add Gruvbox theme to Web and App (@swolg)
## Desktop
- Add Traditional Chinese language support and rename Chinese to Chinese (Simplified) (@alexyaroshuk)
- Add Russian language support (@alexyaroshuk)
- Polish translations in app (@neriousy)

**Thank you to 4 community contributors:**
- @neriousy:
  - feat(app): polish translations (#9884)
- @alexyaroshuk:
  - feat(i18n): add Russian language support (#9882)
  - feat(i18n): add Traditional Chinese language support & rename 'Chinese' to 'Chinese (Simplified)' (#9887)
- @swolg:
  - feat(ui): add gruvbox theme (Web/App) (#9855)
- @R44VC0RP:
  - feat: add daily Discord recaps for issues and PRs (#9904)

## v1.1.30 — 2026-01-21

## Core
- Add session list and session fork support to ACP (@remorses)
- Fix metadata matching to use model.id instead of model.api.id to support legacy model identifiers
- Adjust textVerbosity and reasoningEffort defaults to better align with Codex CLI behavior
- Implement home directory expansion for permission patterns using `~` and `$HOME` prefixes (@Danztee)
- Add back todo list tools for OpenAI models
- Persist loaded model and mode when loading ACP sessions (@noamzbr)
- Update GitLab packages for better self-hosted instance support (@vglafirov)
- Make the models.dev domain configurable for offline environments (@bartbroere)
## Desktop
- Rename favicon on web again
- Improve provider OAuth error handling in app
- Fix renaming non-git projects affecting other projects
- Tab should select suggestion in the app
- Fix type error
- Fix terminal issues and regressions
- Remove terminal button border to align with close button (@allanhvam)
- Fixed navigation issues when working with large sessions in desktop app (@dbpolito)

**Thank you to 8 community contributors:**
- @bartbroere:
  - feat: Make the models.dev domain configurable for offline environments (#9258)
- @vglafirov:
  - chore(deps): update GitLab packages for better self-hosted instance support (#9856)
- @noamzbr:
  - fix: Persist loaded model and mode on ACP session load (#9829)
- @Danztee:
  - feat: implement home directory expansion for permission patterns using `~` and `$HOME` prefixes. (#9813)
- @dbpolito:
  - fix(desktop): Navigation with Big Sessions (#9529)
- @allanhvam:
  - fix(app): remove terminal button border to align with close button (#9874)
- @remorses:
  - feat(acp): add session/list and session/fork support (#7976)
- @gigamonster256:
  - fix: update pre-push hook to allow caret version differences (#9876)

## v1.1.29 — 2026-01-21

## Core
- Adjust skill tool description to clarify available skills
- Add caching support for Claude with Bedrock custom inference profiles (@stevoland)
- Add Laravel Pint as a PHP formatter (@nunomaduro)
- Change session title prompt to respond in user's language (@spoons-and-mirrors)
- Terminal improvements including focus handling, rename functionality, error state management, and CSP compliance (@unitythemaker)
- Fix snapshot regression in core module
- Handle special characters in paths and git snapshot reading logic (@shirukai)
- Update session summary after revert to show file changes
- Add OPENCODE_DISABLE_PROJECT_CONFIG environment variable to disable project configuration (@kdcokenny)
- Add OPENCODE_DISABLE_FILETIME_CHECK flag to skip file modification time checks (@luojiyin1987)
- Ensure apply patch tool emits edited events
- Ensure synthetic user message following subtasks is only added when user manually invoked subtask
- Don't update session timestamp for metadata-only changes (@ariane-emory)
- Fix issue when switching models between providers where past reasoning/metadata would cause 400 errors
## TUI
- Support responsive layout for narrow terminal screens (@vmotta8)
## Desktop
- New sound effects, downmixed to mono
- Fix keybind search dialog height in app
- Add new sounds to app
- Add missing internationalization keys in app package
- Add search functionality to settings shortcuts (@ProdigyRahul)
- Add new workspace button supporting all available languages (@ProdigyRahul)
- Add aria-labels to titlebar and sidebar buttons for improved accessibility (@ndarilek)
- Fix e2e tests in app package
- Fix type error
- Breaking out of auto-scroll in the app
- Add model tooltip metadata in chooser per Figma request (@kearns-cu)
- Fix workspaces padding inconsistency (@DNGriffin)
- Properly integrate window controls on Windows desktop (@Brendonovich)
- Add Japanese language support to the app
- Add workaround for nushell in desktop application (@Brendonovich)
- Add Danish translations to the application
- Add Japanese translations to the app
- Add French translations to the app
- Add Spanish translations to the app
- Add German translations to the application
- Add Korean language translations to the application
- Don't show notification on session if active
- Add manage models icon to selector (@kearns-cu)
- Allow users to select directory text on new session (@DNGriffin)
- Fix desktop app not connecting to sidecar when proxy is configured
- Standardize desktop layout icons (@jacobabahn)
- Fix numbered list rendering in web markdown (@R44VC0RP)
- Remove portal spacer and fix terminal toggle padding in UI (@alexyaroshuk)
- Add internationalization support to the app
- Add internationalization support for prompt input component
- Initial internationalization stubbing for the app
- Don't interfere with scroll when using message navigation
- Add keyboard shortcut (Mod+,) to open settings dialog
- Improve auto-scroll user experience in app

**Thank you to 20 community contributors:**
- @R44VC0RP:
  - docs: add Anthropic subscription warning and update feature list to highlight GitHub Copilot (#9721)
  - fix(app): fix numbered list rendering in web markdown (#9723)
- @alexyaroshuk:
  - fix(ui): remove portal spacer and fix terminal toggle padding (#9728)
- @jacobabahn:
  - feat(desktop): standardize desktop layout icons (#9685)
- @yxshee:
  - fix: correct dot prefix display in directory names for RTL text rendering issue #9579 (#9591)
- @ariane-emory:
  - fix: don't update session timestamp for metadata-only changes (resolves #9494) (#9495)
- @vmotta8:
  - fix(tui): responsive layout for narrow screens (#9703)
- @luojiyin1987:
  - feat: add OPENCODE_DISABLE_FILETIME_CHECK flag (#6581)
- @kdcokenny:
  - feat: add OPENCODE_DISABLE_PROJECT_CONFIG env var (#8093)
- @RiskyMH:
  - chore(opencode): Use Bun.semver instead of node-semver (#9773)
- @shirukai:
  - fix: handle special characters in paths and git snapshot reading logic(#9804) (#9807)
- @DNGriffin:
  - feat(app): allow users to select directory text on new session (#9760)
  - fix(app): workspaces padding wonkiness (#9772)
- @zerone0x:
  - fix(ui): preserve filename casing in edit/write tool titles (#9752)
- @kearns-cu:
  - feat(app): add manage models icon to selector (per Figma request) (#9722)
  - feat(app): model tooltip metadata in chooser (per Figma request) (#9707)
- @Brendonovich:
  - fix(desktop): add workaround for nushell
  - feat(desktop): properly integrate window controls on windows (#9835)
- @unitythemaker:
  - fix(app): terminal improvements - focus, rename, error state, CSP (#9700)
- @ndarilek:
  - fix(app): add aria-labels to titlebar and sidebar buttons (#9843)
- @ProdigyRahul:
  - fix(app): new workspace button with all languages (#9848)
  - feat(app): search on settings shortcuts  (#9850)
- @spoons-and-mirrors:
  - tweak(session title): change prompt to have the response with user language (#9847)
- @nunomaduro:
  - feat(formatters): add laravel pint as a `.php` formatter (#7312)
- @stevoland:
  - fix: Claude w/bedrock custom inference profile - caching support (#9838)

## v1.1.28 — 2026-01-20

## Core
- Preserve tool input from running state for MCP tool results (@rynfar)
- Pass arguments to commands without explicit placeholders (@remorses)
- Adjust Codex prompt to discourage unnecessary questions and encourage more autonomous decision-making
- Register OAuth callback before opening browser in MCP (@msvechla)
- Support ACP audience by mapping to ignore and synthetic (@noamzbr)
- Terminal no longer hangs on exit or Ctrl+D and closes the pane properly (@ProdigyRahul)
## TUI
- Prevent sidebar height from overflowing in terminal UI (@IdrisGit)
## Desktop
- Refactor Select component to use settings variant for settings modal styling
- Show "View all sessions" button for active project and close hovercard on click
- Remove close delay on hover cards to prevent overlapping
- Fix review empty state font size
- Fix race condition when editing project names (@DNGriffin)
- Resolve Select children type conflict with ButtonProps
- Fix prompt agent button style
- Fix type error
- Update keyboard shortcuts panel to match general settings styling
- Add color scheme preview on hover in appearance dropdown
- Update settings panel padding and make content full width
- Set 32px spacing between main title and group title
- Add fade gradient to settings panel headers
- Reset select trigger to default state after selection
- Add extra large dialog size and use it for settings modal
- Add triggerStyle prop to Select component and apply it to font selector
- Render font options in their respective fonts
- Wrap settings row groups with styled container
- Remove border and background from settings panel headers
- Remove subheader from General settings panel
- Add keyboard icon and use it for Shortcuts settings tab
- Add sliders icon and use it for General settings tab
- Update settings tabs layout and spacing
- Increase icon letter size to 32px in edit project dialog
- Increase session messages popover open delay to 1000ms
- Fix end-to-end tests in app package
- Add Windows end-to-end tests for the app
- Change terminal.new keybind to Ctrl+Alt+T (@ProdigyRahul)
- Cleanup PTY exited event listener on component unmount (@ProdigyRahul)
- Fix duplicate session loads in app
- Add tooltips to sidebar new session and workspace buttons (@ProdigyRahul)
- Better pending states for workspace operations
- Fix session loading loop in app
- Add restart and reload menu items on macOS (@BlankParticle)
- Fix broken app functionality
- Add settings page to app

**Thank you to 13 community contributors:**
- @ProdigyRahul:
  - fix(app): terminal no longer hangs on exit or ctrl + D and closes the pane (#9506)
  - feat(app): add tooltips to sidebar new session/workspace buttons (#9652)
  - fix(app): cleanup pty.exited event listener on unmount (#9671)
  - fix(app): change terminal.new keybind to ctrl+alt+t (#9670)
- @BlankParticle:
  - feat: add restart and reload menu items on macOS (#9212)
- @noamzbr:
  - feat: Support ACP audience by mapping to ignore and synthetic (#9593)
- @msvechla:
  - fix(mcp): register OAuth callback before opening browser (#9646)
- @remorses:
  - fix: pass arguments to commands without explicit placeholders (#9606)
- @zerone0x:
  - fix(ui): show filename in Edit/Write permission titles (#9662)
- @MBanucu:
  - fix(opencode): Allow compatible Bun versions in packageManager field (#9597)
- @DRunkPiano114:
  - fix(ui): prevent Enter key action during IME composition (#9564)
- @IdrisGit:
  - fix(tui): prevent sidebar height from overflowing. (#9689)
- @gigamonster256:
  - fix(opencode): relax bun version requirement (#9682)
- @DNGriffin:
  - fix(app): Edit-project name race condition (#9551)
- @rynfar:
  - fix(opencode): preserve tool input from running state for MCP tool results (#9667)
- @kdcokenny:
  - docs(web): add KDCO plugins to ecosystem (#7694)

## v1.1.27 — 2026-01-20

## Core
- Remove filetime assertions from patch tool
- Ensure truncation handling applies to MCP servers
- Update batch tool definition to outline correct value for max tool calls (@jamesmengo)
## TUI
- Add space toggle hint to tool selection prompt (@cjellick)
- Fix message history cleanup to prevent memory leaks in TUI
## Desktop
- Fixed flash of home page on application start
- Fixed localStorage quota handling in app
- Persist quota limits to prevent loss on reload
- Completely disable pinch to zoom in desktop application (@Brendonovich)
- Fix message list overflow and scrolling issues (@neriousy)
- Add 8px padding to recent sessions popover
- Remove top padding from edit project dialog form
- Update session messages popover gutter to 28px
- Position session messages popover at top
- Retain session hover state when popover is open and update border radius
- Update session hover popover styling
- Update review session empty state styling
- Add ability to select project directory text in web interface (@DNGriffin)

**Thank you to 5 community contributors:**
- @DNGriffin:
  - feat(app): Add ability to select project directory text to web (#9344)
- @neriousy:
  - fix(app): message list overflow & scrolling (#9530)
- @jamesmengo:
  - fix(batch): update batch tool definition to outline correct value for max tool calls (#9517)
- @cjellick:
  - fix: add space toggle hint to tool selection prompt (#9535)
- @Brendonovich:
  - fix(desktop): completely disable pinch to zoom

## v1.1.26 — 2026-01-19

## Core
- Increase maximum batch tool limit from 10 to 25 (@spoons-and-mirrors)
- Remove favicon from application
- Apply patch description
- Format only edited file in Cargo workspace instead of entire workspace (@goniz)
- Cargo fmt does not support formatting single files
- Rename uv formatter from 'uv format' to 'uv' for config consistency (@paulclou)
- Initial e2e test setup for app
- Reset worktree to clean state
- Delete workspace functionality
- Tweak apply_patch tool description
- Omit todo tools for OpenAI models
- Add proper variant support to copilot
- Track reasoning by output_index for Copilot compatibility (@NateSmyth)
- Add scheduler and cleanup module
- Auto-route GPT-5+ models to Responses API in GitHub Copilot integration (@christso)
- Use streamObject when using OpenAI OAuth in agent generation (@thmalek)
- Fix incorrect model variants for Grok models
- Note untracked files in review documentation
- Treat .fbs files as text instead of images in tool handling (@zerone0x)
- Update GitLab AI provider to version 1.3.2 (@vglafirov)
- Add command execute before hook (@spoons-and-mirrors)
- Overhaul Nix flake and packages (@gigamonster256)
- Preserve file attachment metadata during session replay (@liorshk)
- Update Scoop installation method (@chawyehsu)
- Fix import issue in patch module
- Restore persisted model and agent when loading ACP session (@noamzbr)
- Use single global event subscription and route by session ID in ACP (@noamzbr)
- Increase question header and label limits (@bdwelle)
- Add apply_patch tool for OpenAI models
- Fix Java language server download on Windows (@pschiel)
- Add vim-style line-by-line scrolling keybindings (@NathanFlurry)
- Prevent environment variables in config from being replaced with actual values
- Fix mDNS hostname discovery (@j0nl1)
- Revert OAuth redirect URI configuration for MCP servers
- Fix GPT ID handling in API responses
- Add OAuth polling safety margin in Copilot device authentication (@hamir-suspect)
- Open help dialog with tui/open-help route (@AksharP5)
## TUI
- Clarify resume session tip in TUI (@kearns-cu)
- Set input mode based on whether mouse or keyboard is in use to prevent unwanted mouse events (@jcampuza)
- Don't unnecessarily wrap lines and introduce an unneeded empty line (@ariane-emory)
- Add mouse support for permission buttons in TUI (@Hona)
- Fix Windows evaluating text on copy (@Hona)
- Uninstall OpenCode installed via Windows package managers (@itsrainingmani)
- Unify command registry and derive slash commands from command definitions (@kitlangton)
- Hide variants hint when list is empty
- Fix model state persistence when model store is not ready
- Centralize OSC 52 clipboard support for SSH sessions (@b3nw)
- Keep primary model after subagent runs (@sethcarlton)
- Make home/end keys work in menu list modal windows (@ariane-emory)
## Desktop
- Fix favicon in app
- Change keybind for cycling thinking effort in app (@neriousy)
- Fixed global terminal and review pane toggle functionality
- Fix hash-based navigation in the application
- Give feedback when trying to paste an unsupported file type (@neriousy)
- Rename favicons to v2 for cache busting (@R44VC0RP)
- Reload instance after workspace reset
- Make terminal sessions scoped to workspace
- Add hover overlay with upload and trash icons to project icon in edit dialog
- Tighten edit project color spacing
- Constrain edit project dialog width
- Tweak edit project icon container styling
- Adjust edit project icon helper text
- Update edit project dialog padding and avatar styles for consistency
- New layout improvements for app
- New session layout
- Improved session layout
- Hide settings button in app
- Add more end-to-end tests for the app
- Add end-to-end testing utilities for the application
- Tweak share button to prevent layout shift in desktop (@itsrainingmani)
- Apply getComputedStyle polyfill on all platforms in desktop app (@Slone123c)
- Improve layout and styling of desktop session search button (@OpeOginni)
- Remove redundant toast for thinking effort changes (@kitlangton)
- Add session unshare button to desktop application (@itsrainingmani)
- Remove max-width constraint from session name tooltip
- Adjust project path tooltip placement
- Remove max width on sidebar new buttons
- Adjust session list tooltip trigger and delay
- Keep project avatar hover styles while popover is open
- Adjust recent sessions popover padding
- Reduce prompt dock bottom spacing
- Show project name in avatar hover
- Remove loading text after splash screen
- Fix command palette file list item spacing
- Shrink project notification dot and apply masking
- Update desktop initializing splash logo
- Align project avatar notification dot
- Don't try to open command palette if a dialog is already open (@BlankParticle)
- Added Windows-only guard to make window.getComputedStyle fall back to document.documentElement (@Eric-Guo)
- Fix flaky session archiving behavior
- Prevent text clipping on search button descenders
- Remove secondary text from commands
- Limit search modal max-height to 480px
- Refine search modal styling and list component
- Reduce command item left padding in search modal
- Add hideIcon and class options to List search and customize search modal input styling
- Adjust command item left padding in search modal
- Add left padding to command items in search modal
- Increase keybind border radius in search modal
- Display arrow keys as symbols in keybind formatting
- Use Keybind component in search modal list
- Use Keybind component in titlebar search button
- Fix recent sessions gutter spacing
## Extensions
- Add use_github_token to example

**Thank you to 39 community contributors:**
- @ariane-emory:
  - fix: make home/end keys work in menu list modal windows (resolves #7190) (#8347)
  - fix: Don't unnecessarily wrap lines and introduce an unneeded empty line (resolves #9489) (#9488)
- @sethcarlton:
  - fix: keep primary model after subagent runs (#8951)
- @AksharP5:
  - fix: open help dialog with tui/open-help route (#8596)
- @b3nw:
  - fix: centralize OSC 52 clipboard support for SSH sessions (#8974)
- @gigamonster256:
  - fix(nix): add desktop application entry (#8972)
  - feat(nix): overhaul nix flake and packages  (#9032)
  - fix: nix ci - swapped dash/underscore (#9352)
- @dbpolito:
  - fix(desktop): Stream bash output + strip-asni (#8961)
- @hamir-suspect:
  - fix(opencode): add oauth polling safety margin in copilot device authentication (#8986)
- @jerome-benoit:
  - fix(nix): resolve hash race condition in parallel matrix jobs (#8995)
- @benjaminshafii:
  - docs: Add OpenWork to ecosystem (#8741)
- @Eric-Guo:
  - fix(desktop): Added a Windows-only guard that makes window.getComputedStyle fall back to document.documentElement (#9054)
- @j0nl1:
  - fix: mdns discover hostname (#9039)
- @Slone123c:
  - fix: escape CSS selector keys to handle special characters (#9030)
  - fix(desktop): apply getComputedStyle polyfill on all platforms (#9369)
- @cgilly2fast:
  - docs: add firmware provider to providers docs (#8993)
- @berenar:
  - docs(config): explain that `autoupdate` doesn't work when installed with a package manager (#9092)
- @BlankParticle:
  - fix: don't try to open command palette if a dialog is already open (#9116)
- @kitlangton:
  - refactor(tui): unify command registry and derive slash commands (#9115)
  - fix(app): remove redundant toast for thinking effort changes (#9181)
- @NathanFlurry:
  - feat: bind vim-style line-by-line scrolling (#8980)
- @pschiel:
  - fix(windows): fix jdtls download on Windows (#9195)
- @bdwelle:
  - feat(tool): increase question header and label limits (#9201)
- @noamzbr:
  - fix(acp): use single global event subscription and route by sessionID (#5628)
  - fix: restore persisted model/agent when loading ACP session (#7809)
- @itsrainingmani:
  - feat(cli): uninstall opencode installed via windows package managers (#8571)
  - feat(desktop): implement session unshare button (#8660)
  - refactor(desktop): tweak share button to prevent layout shift (#9322)
- @OpeOginni:
  - refactor(desktop): improve layout and styling of session search button (#9251)
- @chawyehsu:
  - refactor(installation): update scoop installation method (#9243)
- @liorshk:
  - fix(acp): preserve file attachment metadata during session replay (#6342)
- @spoons-and-mirrors:
  - feat(hook): command execute before hook (#9267)
  - tweak(batch): up restrictive max batch tool from `10` to `25` (#9275)
- @vglafirov:
  - fix: update gitlab-ai-provider to 1.3.2 (#9279)
  - docs: Improve Gitlab self-hosted instances documentation (#9391)
- @zerone0x:
  - fix(tool): treat .fbs files as text instead of images (#9276)
- @alanpog:
  - docs: clarify agent tool access and explore vs general distinction (#9300)
- @Hona:
  - fix: Windows evaluating text on copy (#9293)
  - feat(tui): use mouse for permission buttons (#9305)
- @thmalek:
  - fix(opencode): use streamObject when using openai oauth in agent generation (#9231)
- @christso:
  - fix(github-copilot): auto-route GPT-5+ models to Responses API (#5877)
- @NateSmyth:
  - fix: track reasoning by output_index for copilot compatibility (#9124)
- @kedMertens:
  - docs: update codecompanion.nvim acp doc (#9411)
- @paulclou:
  - fix(config): rename uv formatter from 'uv format' to 'uv' for config consistency (#9409)
- @jcampuza:
  - fix(app): list component jumping when mouse happens to be under the list and keyboard navigating. (#9435)
  - fix(opencode): sets input mode based on whether mouse vs keyboard is in use to prevent mouse events firing (#9449)
- @goniz:
  - fix(opencode): `cargo fmt` is formatting whole workspace instead of edited file (#9436)
- @R44VC0RP:
  - fix(web): rename favicons to v2 for cache busting (#9492)
- @neriousy:
  - fix(app): give feedback when trying to paste a unsupported filetype (#9452)
  - fix: keyboard nav when mouse hovered over list (#9500)
  - fix(app): change keybind for cycling thinking effort (#9508)
- @kearns-cu:
  - fix(tui): clarify resume session tip  (#9490)

## v1.1.25 — 2026-01-16

## Core
- Improve wording
- Revert tool attachment fix to prevent them being sent as user messages
- Reinstall plugins when cache module is missing (@kenryu42)
## Desktop
- Remember last opened project in app
- Truncate workspace title in app
- Handle new session correctly in app
- Center dialog on page instead of session

**Thank you to 3 community contributors:**
- @kenryu42:
  - fix(bun): reinstall plugins when cache module missing (#8815)
- @ariane-emory:
  - fix: make home/end keys work in menu list modal windows (resolves #7190) (#8347)

## v1.1.24 — 2026-01-16

## Core
- Upgrade OpenTUI to v0.1.74 and fix tmux kitty keyboard regression
- Ensure that tool attachments aren't sent as user messages
- Use dynamic import for session event in config.ts to avoid circular dependency
- Fix broken URL in documentation (@berenar)
- Fix itemId stripping logic for GPT models
- Revert test fix for image handling
- Update GPT models prompt
- Add OAuth redirect URI configuration for MCP servers (@christso)
- Adjust websearch tool to emphasize current date and clarify it's no longer 2024
- Clarify question tool guidance in documentation (@kitlangton)
- Set OpenCode as user agent for most inference requests
- Show auth URL when browser cannot open in remote sessions (@danlapid)
- Strip item IDs in more cases
- Stop changing main model/agent from subtasks invocation (@dbpolito)
- Fix default agent selection in ACP and headless mode (@assagman)
- Add LiteLLM proxy provider option for explicit compatibility (@seilk)
## TUI
- Add version to session header and /status dialog (@AksharP5)
- Correct theme count tip in TUI (@kitlangton)
- Dim question option prefixes in terminal UI (@kitlangton)
- Add tab navigation support for questions in terminal interface (@kitlangton)
- Add Carbonfox theme (@devatnull)
## Desktop
- Add ability to edit project and session titles
- Open workspace if navigating to session in workspace
- Can't expand workspaces
- Fixed scroll jumping when expanding workspaces
- Truncate the workspace name on hover
- Fix alignment of load more label
- Update panel minimum size and button maximum width
- Fix session icon and label alignment
- Fixed desktop hamburger menu shifting issue
- Center hamburger menu with project avatars
- Fix mobile menu on web
- Fix responsive menu on desktop
- Moved createMemo down to fix bug
- Updated project and sessions list width
- Fix styles for view all sessions state
- Add default icon to sessions
- Fix search bar sizing, padding, and keyboard shortcut styling
- Fixed avatar border radius and current project display
- Persist workspace order and collapsed state
- Add unified search for commands and files in app
- Add skeleton loader for sessions
- Fix project avatar border radius
## SDK
- Update OpenAPI TypeScript SDK generator to version 0.90.4
- Revert SDK OpenAPI TypeScript generator update to 0.90.4
- Update @hey-api/openapi-ts to 0.90.4 (@coleleavitt)

**Thank you to 13 community contributors:**
- @seilk:
  - feat: add litellmProxy provider option for explicit LiteLLM compatibility (#8658)
- @devatnull:
  - feat: add Carbonfox theme (#8723)
- @johnnyapu15:
  - fix:subagent reasoningEffort not being applied (#8646)
- @aaroniker:
  - feat(console): Fix /black page View Transition Safari issue (#8755)
  - feat(console): /black shader improvements, performance, details (#8871)
- @assagman:
  - fix(agent): default agent selection in acp and headless mode (#8678)
- @dbpolito:
  - fix: stop changing main model/agent from subtasks invocation (#7681)
  - feat(desktop): Terminal Splits (#8767)
- @ricardo-valero:
  - fix: nix desktop workflow (#8747)
- @danlapid:
  - fix(mcp): show auth URL when browser cannot open in remote sessions (#7884)
- @kitlangton:
  - docs: clarify question tool guidance (#8778)
  - fix(tui): add tab navigation in questions (#8777)
  - fix(tui): dim question option prefixes (#8776)
  - fix(tui): correct theme count tip (#8779)
- @AksharP5:
  - feat: add version to session header and /status dialog (#8802)
- @christso:
  - feat(mcp): add OAuth redirect URI configuration for MCP servers (#7379)
- @coleleavitt:
  - chore(sdk): update @hey-api/openapi-ts to 0.90.4 (#8921)
- @berenar:
  - fix(docs): Broken URL (#8918)

## v1.1.23 — 2026-01-15

## Core
- Ensure agent exists before processing title in session summary (@0x404)
- More defensive handling of project list to prevent errors
- Filter dead worktrees from git worktree list
- Load models.dev in development mode
- Ensure frontmatter can process same content as other agents
- Show toast error message when ConfigMarkdown parsing fails (@vvarp)
- Prettify retry duration display in TUI
- Handle broken symlinks gracefully in grep tool (@andrew-kramer-inno)
- Honor per-server MCP timeouts
- Upgrade OpenTUI to v0.1.73, fixing CJK word wrapping and Thai text rendering in non-tmux environments
- Add input limit for compaction (@brandon93s)
- Fix Codex ID issue
- Revert provider-level store option
- Allow provider-level store option (@cyhhao)
- Make dialog keybinds configurable (@CasualDeveloper)
## TUI
- Update black plan selection with light rays effect and mobile styles (@aaroniker)
- Use native text truncation for sidebar diff paths
- Center the initially selected session in the session list (@ariane-emory)
- Restore brand integrity of TUI wordmark (@kitlangton)
## Desktop
- Fix sidebar toggle on desktop
- Persist workspace branch selection across sessions
- Persist workspace order and collapsed state in sidebar
- Fix thinking animation opacity and improve design
- Fix session icon and name alignment
- Show session as busy even when it's the active session
- Stop killing opencode-cli process on dev mode restart (@dbpolito)
- Update desktop question tools (@dbpolito)
- Fix current session background color
- Remove the active state from load more button after press
- Fix new session tooltip position and add keyboard shortcut
- Remove more options tooltip
- Fix workspace name color in UI
- Hide "View all sessions" button when on active project page
- Fix avatar button states
- Reduce font size of load more button
- Fix recent sessions title color
- Fix project dropdown labels and sorting order
- Move left panel toggle button to the right
- Fix avatar background color
- Show project options on hover of row
- Increase delay on session list tooltips
- Fix tooltip gutter spacing on session items and archive buttons
- Archive icon replaces diff count on hover
- Fix hover state for recent sessions in gutter
- Fix search bar functionality in header
- Fixed layout issues in the app
- Fix stale sessions in new layout
- New app layout
- Open external links in system browser instead of webview in desktop app (@turculaurentiu91)

**Thank you to 15 community contributors:**
- @CasualDeveloper:
  - feat(tui): make dialog keybinds configurable (#6143) (#6144)
- @kitlangton:
  - fix: restore brand integrity of TUI wordmark (#8584)
- @cyhhao:
  - feat: allow provider-level store option (#8000)
- @ariane-emory:
  - fix(tui): Center the initially selected session in the session_list (resolves #8558) (#8560)
- @brandon93s:
  - fix(opencode): add input limit for compaction (#8465)
- @R44VC0RP:
  - fix: enable sticky header on changelog and download pages (#8556)
- @turculaurentiu91:
  - fix(desktop): open external links in system browser instead of webview (#7360)
- @LAG-4:
  - docs: fix typos in documentation (#8703)
- @andrew-kramer-inno:
  - fix: handle broken symlinks gracefully in grep tool (#8612)
- @vvarp:
  - fix: show toast error message on ConfigMarkdown parse error (#8049)
- @dbpolito:
  - chore(desktop): Question Tools Updates
  - chore(desktop): Stop Killing opencode-cli on dev
- @aaroniker:
  - feat(console): Update /black plan selection, light rays effect. mobile styles (#8731)
  - feat(console): Style improvements for /black, View Transition fixes (#8739)
- @nathannewyen:
  - docs: add /thinking command documentation (#8722)
- @0x404:
  - fix(session): ensure agent exists before processing title in session summary (#8662)
- @ricardo-valero:
  - fix: update hix hashes for all systems (#8732)

## v1.1.21 — 2026-01-15

## Core
- Add error message to prompt users to reauthenticate with Copilot
- Official Copilot plugin
- Adjust LSP wording to better encourage users to fix issues
- Fix plan path permissions
- Add check in case provider doesn't exist in models list
- Adjust GitLab logic in provider configuration
- Add AWS Web Identity Token File support for Bedrock (@bainos)
- Add Chocolatey and Scoop to OpenCode upgrade methods (@itsrainingmani)
- Remove duplicate path import in session module (@CasualDeveloper)
## TUI
- Improve question prompt UX in TUI (@kitlangton)

**Thank you to 8 community contributors:**
- @kitlangton:
  - feat(tui): improve question prompt UX (#8339)
- @R44VC0RP:
  - fix(homepage): Update FAQ to include desktop and web links (#8453)
  - docs: update screenshot images (#8479)
  - feat(console): add /changelog page (#8476)
  - docs: add Web usage page (#8482)
  - fix(console): make logo on /black link back to homepage (#8498)
  - feat(console): add OG image and SEO meta tags for /black page (#8506)
- @CasualDeveloper:
  - fix(session): remove typo'd duplicate path import (#8408) (#8412)
- @itsrainingmani:
  - feat: add choco and scoop to opencode upgrade methods (#8439)
- @aaroniker:
  - feat(console/app): Style changes, view transitions, small improvements (#8481)
- @bainos:
  - feat(opencode): add AWS Web Identity Token File support for Bedrock (#8461)
- @samiulsami:
  - feat(install): respect ZDOTDIR for zsh config detection (#8511)
- @IdrisGit:
  - docs: fix permission system documentation in agents section (#7652)

## v1.1.20 — 2026-01-14

## Core
- Fixed "load more" button behavior in desktop sidebar (@shanebishop1)
- Fix plan mode when not in git worktree
- Skip duplicate system prompt for Codex OAuth sessions (@zerone0x)
## TUI
- Fixed Docker image after SST rename in tips (@goniz)
- Show connected providers in /connect dialog (@AksharP5)
- Deduplicate file references in sent prompts (@felixzsh)
- Track all timeouts in Footer component to prevent memory leaks (@sauerdaniel)
- Make TUI work when OPENCODE_SERVER_PASSWORD is set (@LeonMueller-OneAndOnly)
## SDK
- Add missing metadata() and ask() definitions to ToolContext type (@danielmbrasil)

**Thank you to 21 community contributors:**
- @LeonMueller-OneAndOnly:
  - fix(TUI): make tui work when OPENCODE_SERVER_PASSWORD is set (#8179)
  - fix(github): add persist-credentials: false to workflow templates (#8202)
  - fix(TUI): make tui work when OPENCODE_SERVER_PASSWORD is set (#8179)
- @Eduard-Voiculescu:
  - docs: Update plan mode restrictions (#8290)
  - docs: Update plan mode restrictions (#8290)
- @mthezi:
  - docs: add 302ai provider (#8142)
  - docs: add 302ai provider (#8142)
- @danielmbrasil:
  - fix: add missing metadata() and ask() defintions to ToolContext type (#8269)
  - fix: add missing metadata() and ask() defintions to ToolContext type (#8269)
- @sauerdaniel:
  - fix(tui): track all timeouts in Footer to prevent memory leak (#8255)
  - fix(mcp): close existing client before reassignment to prevent leaks (#8253)
  - fix(state): delete key from recordsByKey on instance disposal (#8252)
  - fix(tui): track all timeouts in Footer to prevent memory leak (#8255)
- @felixzsh:
  - fix: deduplicate file refs in sent prompts (#8303)
  - fix: deduplicate file refs in sent prompts (#8303)
- @usvimal:
  - fix(desktop): correct health check endpoint URL to /global/health (#8231)
- @dbpolito:
  - feat(desktop): Adding Provider Icons (#8215)
  - fix(desktop): Revert provider icon on select model dialog (#8245)
  - feat(desktop): Ask Question Tool Support (#8232)
- @Brendonovich:
  - console: reduce desktop download cache ttl to 5 minutes
- @cmdr-chara:
  - feat: add Undertale and Deltarune built-in themes (#8240)
- @zeke:
  - docs: document ~/.claude/CLAUDE.md compatibility behavior (#8268)
- @vglafirov:
  - feat: Add GitLab Duo Agentic Chat Provider Support (#7333)
  - fix: Add Plugin Mocks to Provider Tests (#8276)
- @dmmulroy:
  - fix(cli): mcp auth duplicate radio button icon (#8273)
- @josephbharrison:
  - fix(prompt-input): handle Shift+Enter before IME check to prevent stuck state (#8275)
- @AlanThiec:
  - fix: update User-Agent string to latest Chrome version in webfetch (#8284)
- @zerone0x:
  - fix(session): skip duplicate system prompt for Codex OAuth sessions (#8357)
- @AksharP5:
  - feat: show connected providers in /connect dialog (#8351)
- @goniz:
  - fix(opencode): fix docker image after sst rename in tips (#8376)
- @neriousy:
  - fix(app): file listing  (#8309)
- @ajzbc:
  - fix(ui): layout-bottom icons (#8330)
- @shanebishop1:
  - fix(desktop): "load more" button behavior in desktop sidebar (#8430)

## v1.1.19 — 2026-01-14

## Core
- Do not allow agent to ask custom-less questions
- Improve prompt for explore agent
- Add plugin mocks to provider tests (@vglafirov)
- Update User-Agent string to latest Chrome version in webfetch (@AlanThiec)
- Add plan mode with enter and exit tools
- Add family to GPT 5.2 Codex in Codex plugin
- Add GitLab Duo Agentic Chat provider support (@vglafirov)
- Delete key from recordsByKey on instance disposal (@sauerdaniel)
- Close existing MCP client before reassignment to prevent resource leaks (@sauerdaniel)
- Added Ask Question tool support for desktop application (@dbpolito)
## TUI
- Tweak external directory permission rendering in TUI
- Ensure external directory and Bash tool invocations render working directory details
- Fix duplicate radio button icon in MCP auth CLI interface (@dmmulroy)
## Desktop
- Handle Shift+Enter before IME check to prevent stuck state in prompt input (@josephbharrison)
- Revert provider icon on select model dialog in desktop app (@dbpolito)

**Thank you to 8 community contributors:**
- @dbpolito:
  - fix(desktop): Revert provider icon on select model dialog (#8245)
  - feat(desktop): Ask Question Tool Support (#8232)
- @cmdr-chara:
  - feat: add Undertale and Deltarune built-in themes (#8240)
- @sauerdaniel:
  - fix(mcp): close existing client before reassignment to prevent leaks (#8253)
  - fix(state): delete key from recordsByKey on instance disposal (#8252)
- @zeke:
  - docs: document ~/.claude/CLAUDE.md compatibility behavior (#8268)
- @vglafirov:
  - feat: Add GitLab Duo Agentic Chat Provider Support (#7333)
  - fix: Add Plugin Mocks to Provider Tests (#8276)
- @dmmulroy:
  - fix(cli): mcp auth duplicate radio button icon (#8273)
- @josephbharrison:
  - fix(prompt-input): handle Shift+Enter before IME check to prevent stuck state (#8275)
- @AlanThiec:
  - fix: update User-Agent string to latest Chrome version in webfetch (#8284)

## v1.1.18 — 2026-01-13

## TUI
- Add persist-credentials: false to workflow templates to prevent credential exposure (@LeonMueller-OneAndOnly)
- Add fullscreen view to permission prompt
## Desktop
- Add provider icons to desktop application (@dbpolito)
- Correct desktop health check endpoint URL to /global/health (@usvimal)

**Thank you to 4 community contributors:**
- @usvimal:
  - fix(desktop): correct health check endpoint URL to /global/health (#8231)
- @dbpolito:
  - feat(desktop): Adding Provider Icons (#8215)
- @Brendonovich:
  - console: reduce desktop download cache ttl to 5 minutes
- @LeonMueller-OneAndOnly:
  - fix(github): add persist-credentials: false to workflow templates (#8202)

## v1.1.17 — 2026-01-13

## Core
- Remove the symlinkBinary function call that replaces the wrapper script
- Fix Homebrew auto-upgrade functionality
## TUI
- Prevent question tool keybindings when dialog is open (@zerone0x)
## Desktop
- Kill existing OpenCode CLI processes on macOS when launching desktop app (@Brendonovich)
- Set serverPassword in desktop app (@Brendonovich)
- Provide PTY socket authentication if available from desktop (@Brendonovich)
- Tie desktop and CLI to the same Windows JobObject (@Brendonovich)

**Thank you to 3 community contributors:**
- @zerone0x:
  - fix(tui): prevent question tool keybindings when dialog is open (#8147)
- @Brendonovich:
  - feat(desktop): Tie desktop & CLI to the same Windows JobObject (#8153)
  - fix(app): provide pty socket auth if available from desktop (#8210)
  - fix(desktop): set serverPassword
  - desktop: macos killall opencode-cli on launch
- @OpeOginni:
  - fix(ui): track memo-based items in useFilteredList without affecting async function based lists (#8216)

## v1.1.16 — 2026-01-13

## Core
- Handle write errors when updating schema in OpenCode config (@ShoeBoom)
- Ensure clear_thinking is disabled for zai model
- Improved edit and write tool feedback to prevent confusion about whether changes were successfully applied
- Prevent [object Object] error display in console output (@lengmodkx)
- Respect agent task permission for nested sub-agents (@malhashemi)
- Fix max completion tokens error for Cloudflare provider (@roerohan)
- Use reasoningConfig for Anthropic models on Bedrock (@Adam8234)
- Store API URL in session metadata (@jkoelker)
- Add nova-2 to region prefix models
- Tweak truncation directory permissions
- Make environment file reads ask user for permission instead of blocking
- Use Biome check instead of format to include import sorting (@kynnyhsap)
- Ensure plurals are properly handled
## TUI
- Support debug tool calling directly in CLI (@Eric-Guo)
- Don't submit prompt when switching sessions (@LeonMueller-OneAndOnly)
- Await auth.set to prevent race condition when setting API key (@darshkpatel)
- Actually modify OpenCode config when adding MCP servers with `mcp add` command (@paoloricciuti)
## Desktop
- Spawn local server with password in desktop app (@Brendonovich)
- Add missing args to Windows Tauri CLI spawn (@pschiel)
- Implement better dynamic terminal numbering (@OpeOginni)
- Add icon button for server removal in dialog select server (@OpeOginni)

**Thank you to 15 community contributors:**
- @kynnyhsap:
  - fix(formatter): use biome `check` instead of `format` to include import sorting (#8057)
- @OpeOginni:
  - feat(dialog-select-server): add icon button for server removal (#8053)
  - feat(terminal): implement better dynamic terminal numbering (#8081)
- @jkoelker:
  - fix(session): store api url in metadata (#8090)
- @paoloricciuti:
  - fix: actually modify opencode config with `mcp add` (#7339)
- @jerome-benoit:
  - fix(nix): initialize hashes.json with per-system format (#8095)
- @darshkpatel:
  - fix: await auth.set to prevent race condition when setting API key (#8075)
- @Adam8234:
  - fix(bedrock): use reasoningConfig for Anthropic models on Bedrock (#8092)
- @roerohan:
  - fix: max completion tokens error for cloudflare (#7970)
- @malhashemi:
  - fix(task): respect agent task permission for nested sub-agents (#8111)
- @pschiel:
  - fix: add missing args to windows tauri cli spawn (#8084)
- @lengmodkx:
  - fix: prevent [object Object] error display in console output (#8116)
- @LeonMueller-OneAndOnly:
  - fix(TUI): dont submit prompt when switching sessions (#8016)
- @Eric-Guo:
  - feat(cli): Support debug tool calling directly in CLI. (#6564)
- @ShoeBoom:
  - fix(config): handle write errors when updating schema in opencode config (#8125)
- @Brendonovich:
  - feat(desktop): spawn local server with password (#8139)

## v1.1.15 — 2026-01-12

## Core
- Rename OPENCODE_PASSWORD to OPENCODE_SERVER_PASSWORD for clearer authentication configuration
- Fix HTTP exception handling order to prevent NamedError from masking HTTP exceptions
- Add password authentication and improve server security
- Improve error handling for built-in plugin installation failures
- Allow wildcard permissions to match both the command with and without arguments
- Fix model selection in title generation to use user's model instead of assistant's
## TUI
- Prevent layout jump when toggling tips visibility in TUI (@R44VC0RP)
- Add hint for variants toggle in TUI
- Fix autocomplete reopening after backspace deletes space in terminal UI (@Raviguntakala)
- Rename kvStore to store for consistency in TUI
- Redesign tips display on home screen
- Redesign tips display on home screen
- Remove update complete toast notification from TUI
## Desktop
- Disable AppImage build (@Brendonovich)
- Improve server detection and connection logic in desktop application (@Brendonovich)
- Resolve defaultServerUrl inside AppInterface to improve server URL handling (@Brendonovich)

**Thank you to 7 community contributors:**
- @Brendonovich:
  - app: resolve defaultServerUrl inside AppInterface
  - fix(desktop): improve server detection & connection logic (#7962)
  - disable appimage
- @shubh73:
  - docs: fix typo (#8041)
- @jerome-benoit:
  - fix(nix): filter optional dependencies by target platform (#8033)
- @Raviguntakala:
  - fix(tui): reopen autocomplete after backspace deletes space (#6031)
- @dbpolito:
  - fix(desktop): Improve User Message Badges for Big Titles and Small Screens (#8037)
- @kdcokenny:
  - docs: fix permission rule ordering in examples (#7010)
- @R44VC0RP:
  - fix(tui): prevent layout jump when toggling tips visibility (#8068)

## v1.1.14 — 2026-01-12

## Core
- Support resource content type in MCP tool output (@antigremlin)
- Check worktree for external_directory permission in subdirectories (@dmmulroy)
- Bump Copilot plugin version
## TUI
- Add clickable navigation to subagent header
- Add mouse hover and click support to questions tool (@indeep99)
- Fix prompt ref initialization to prevent undefined reference errors
- Refactor event streaming in TUI to use SDK instead of manual RPC subscription
- Fix cursor position when pasting single-line text in TUI (@Octane0411)
- Add mouse hover and click support to autocomplete (@kitlangton)
- Copy OAuth URL when device code is unavailable (@itskingori)
- Fix slash command autocomplete highlighted row jumping (@kitlangton)
## Desktop
- Add image preview support for image attachments in desktop (@dbpolito)

**Thank you to 10 community contributors:**
- @kitlangton:
  - fix(tui): slash command autocomplete highlighted row jumping (#7815)
  - feat(tui): add mouse hover and click support to autocomplete (#7820)
- @itskingori:
  - fix(tui): copy oauth url when no device code (#7812)
- @zeke:
  - docs: fix typos on the providers page (#7829)
  - docs: fix typos in settings doc (#7892)
- @dbpolito:
  - feat(desktop): Image Preview support for Image Attachments (#7841)
  - feat(desktop): User Message Badges on Hover (#7835)
- @jacobwgillespie:
  - chore(lander): fix spacing in desktop app banner (#7822)
- @dmmulroy:
  - fix: check worktree for external_directory permission in subdirs (#7811)
- @Octane0411:
  - Fix: TUI single-line paste cursor position (#7277)
- @indeep99:
  - feat(tui): add mouse hover and click support to questions tool (#7905)
- @antigremlin:
  - fix(mcp): support `resource` content type in MCP tool output (#7879)
- @eyalch:
  - docs: fix scroll_speed default value (#7867)

## v1.1.13 — 2026-01-11

## Core
- Ensure Codex built-in plugin is always available
- Ensure /connect works for OpenAI Business plans by adding missing field
- Track file modifications in ACP (@wid4t)
- Pass sessionID to chat.system.transform (@spoons-and-mirrors)
- Extract external directory validation to shared utility to reduce code duplication across tools
- Exclude 'none' variant for gpt-5.2-codex (@Alejandro-CSt)
- Follow symlinks by default in ripgrep searches (@kdcokenny)
- Disable telemetry in the PHP language server (@madflow)
## TUI
- Move props.ref to onMount in TUI component (@itsrainingmani)
- Fixed command palette incorrectly highlighting items on mouse hover (@kitlangton)
## Desktop
- Add ability to fork sessions in desktop app (@dbpolito)
- Make mouse hover and click work on prompt input autocomplete (@dbpolito)
- Add missing StoreExt import and fix unused mut warning in desktop (@jerome-benoit)
- Fix missing import causing desktop build to fail (@Leka74)
- Support configuring default server URL for desktop (@athal7)
- Remove split operation in serverDisplayName function (@OpeOginni)

**Thank you to 13 community contributors:**
- @madflow:
  - fix: disable telemetry in the php lsp server (#7649)
- @dbpolito:
  - fix(desktop): Allow Selecting Card Errors (#7506)
  - feat(deskop): Add Copy to Messages (#7658)
  - feat(desktop): Make mouse hover / click work on prompt input autocomplete (#7661)
  - feat(desktop): Fork Session (#7673)
- @zerone0x:
  - fix(ui): allow text editing shortcuts in search dialogs on macOS (#7419)
- @OpeOginni:
  - fix(desktop): remove split operation in serverDisplayName function (#7397)
- @athal7:
  - feat: support configuring default server URL for desktop (#7363)
- @kdcokenny:
  - fix(grep): follow symlinks by default in ripgrep searches (#7501)
- @Alejandro-CSt:
  - fix: exclude 'none' variant for gpt-5.2-codex (#7682)
- @Leka74:
  - fix(desktop): build failing - missing import (#7697)
- @jerome-benoit:
  - fix(desktop): add missing StoreExt import and fix unused mut warning (#7707)
- @spoons-and-mirrors:
  - feat: pass sessionID to chat.system.transform (#7718)
- @kitlangton:
  - fix(opencode): command palette mouse hover highlights wrong item (#7721)
- @wid4t:
  - feat(acp): track file modified (#7723)
- @itsrainingmani:
  - fix(tui): move props.ref to onMount (#7702)

## v1.1.12 — 2026-01-10

## Core
- Add ChatGPT-Account-Id header for organization subscriptions (@fdematos)

**Thank you to 2 community contributors:**
- @vtemian:
  - docs(ecosystem): add micode and octto plugins (#7327)
- @fdematos:
  - fix: add ChatGPT-Account-Id header for organization subscriptions (#7603)

## v1.1.11 — 2026-01-10

## Core
- Ensure GPT-5.2-codex has variants
- Adjust Codex styling and fix hint display
- Update docs and authentication methods for OpenAI
- Improve Codex instructions prompt for better task planning
- Add Codex authentication support
## TUI
- Fix instance disposal to prevent memory leaks and dangling references

**Thank you to 1 community contributor:**
- @spoons-and-mirrors:
  - docs: add url based instructions to web docs (#7216)

## v1.1.10 — 2026-01-09

## Core
- Disable server unless explicitly opted in
- Report config errors instead of silent termination (@ariane-emory)
- Upgrade OpenTUI to v0.1.72
- Resolve broken forked sessions with compactions due to missing parent-child message references (@ryanwyler)
- Upgrade OpenTUI to v0.1.71, fixing capability detection and Kitty keyboard support
- Deduplicate plugins by name with priority-based resolution (@devxoul)
- Bump Copilot plugin version
- Fix model dialog search issues in favorites/recents list and prevent deprecated models from appearing
## TUI
- Enable API key prompt for Bedrock in auth login (@Raviguntakala)
## Desktop
- Remove inline JavaScript from the app
- Remove custom URL parameter from app
- Prevent model picker overflow with Zen mode in new sessions (@0xajka)
- Complete symlink support implementation and enable CI for PRs in desktop app (@jerome-benoit)
- Store terminal and review pane visibility per session
- Change terminal cursor to bar and stop blinking when not focused (@dbpolito)

**Thank you to 8 community contributors:**
- @RD201:
  - docs: Add Scaleway to provider docs (#7389)
- @dbpolito:
  - feat(desktop): Change Terminal's Cursor to Bar and Stop Blinking when not focused (#7402)
- @devxoul:
  - feat(config): deduplicate plugins by name with priority-based resolution (#5957)
- @jerome-benoit:
  - fix(desktop): complete symlink support implementation and enable CI for PRs (#7113)
- @0xajka:
  - fix: prevent model picker overflow with Zen in new sessions (#7495)
- @ryanwyler:
  - fix: resolve broken forked sessions with compactions due to missing parent-child message references (#6445)
- @Raviguntakala:
  - fix(cli): enable API key prompt for Bedrock in auth login (#7332)
- @ariane-emory:
  - fix: report config errors instead of silent termination (#7522)

## v1.1.8 — 2026-01-09

## Core
- Upgrade OpenTUI to v0.1.70
- Support multi-select questions
- Document cargofmt in docs (@marc2332)
## TUI
- Stop escape key propagation from dialogs
- Use full file path for fuzzy matching in autocomplete (@bagatka)
## Desktop
- Revert fix for opening external links in default browser
- Cache session-scoped stores and add optional context gating
- Incrementally render turns with markdown caching and lazy diff rendering
- Gate hydration side-effects and handoff while stores load
- Prefetch adjacent sessions in the app
- Implement chunked message loading and lazy diff loading for improved performance
- Fix project sidebar folder name display issue (@0xajka)

**Thank you to 4 community contributors:**
- @marc2332:
  - fix(docs): Document `cargofmt` (#7383)
- @bagatka:
  - fix(ui): use full file path for fuzzy matching in autocomplete (#6705)
- @0xajka:
  - Fix for #7229 Fix/project sidebar folder name (#7232)
- @Anthuang:
  - feat(desktop): add Vesper theme (#7331)

## v1.1.7 — 2026-01-08

## Core
- Add kind, title, and rawInput fields to ACP tool_call_update events (@noamzbr)
- Add help text to debug command and subcommands (@assagman)
- Allow disabling .claude prompt and skills loading (@freespace8)
- Add interactive question tool for gathering user preferences and clarifying instructions
- Fix issue with normal transform options conflicting with small model options when generating title
- Write truncated tool outputs to files
- Simplify task tool subagent filtering (@malhashemi)
- Improved title generation to avoid repetitive "Analyzing..." prefixes
- Use correct authorization server URL for OAuth discovery in MCP (@rscarvalho)
- Config precedence now correctly allows local config to override remote (@elithrar)
- Update Homebrew formula for anomalyco tap
## TUI
- Restore showDetails check removed in Permission rework (@ryanwyler)
- Cleanly restore terminal state on fatal error exit (@itsrainingmani)
- Improve responsive layout by hiding header and footer when sidebar is visible
- Simplified session settings management (@maxstevens-nl)
- Remove unused imports and variables from header component
- Add overlay sidebar for narrow screens to improve mobile experience
- Add expandable bash output for long commands to improve readability
- Remove username visibility toggle and simplify user message metadata display in TUI
- Improve indentation and label clarity for TUI answer options
- Ensure forked message text is inserted in prompt when forking conversations (@ariane-emory)
- Use selected foreground color for permission selection text (@ariane-emory)
- Constrain autocomplete height to available screen space in TUI (@Raviguntakala)
- Add selectedListItemText to orange themes for button text visibility (@ThanhNguyxn)
## Desktop
- Show custom models without valid release_date in web UI model selector (@zerone0x)
- Open external links in default browser on desktop (@athal7)

**Thank you to 15 community contributors:**
- @elithrar:
  - fix: config precedence now correctly allows local config to override remote (#7141)
- @ThanhNguyxn:
  - fix(theme): add selectedListItemText to orng themes for button text visibility (#7169)
- @rscarvalho:
  - fix(mcp): use correct authorization server URL for OAuth discovery (#7234)
- @Raviguntakala:
  - fix(tui): constrain autocomplete height to available screen space (#7181)
- @malhashemi:
  - refactor: simplify task tool subagent filtering (#7165)
- @ariane-emory:
  - fix: use selectedForeground's computer colour (or theme's selectedForeground value) for the colour of text in permission selection (resolves #7246) (#7251)
  - fix(tui): ensure forked message text is inserted in prompt (resolves #7257) (#7259)
- @athal7:
  - fix(desktop): open external links in default browser (#7221)
- @freespace8:
  - feat(flags): allow disabling .claude prompt and skills loading (#7205)
- @aaroniker:
  - feat: Polish dialog, popover shadows & borders, add missing provider logos (#7326)
- @assagman:
  - fix(cli): add help text to debug command and subcommands (#7328)
- @maxstevens-nl:
  - refactor: session settings simplification (#7342)
- @noamzbr:
  - fix: Add kind, title, rawInput to ACP tool_call_update events (#7368)
- @zerone0x:
  - fix(app): show custom models without valid release_date in web UI mod… (#7349)
- @itsrainingmani:
  - fix: cleanly restore terminal state on fatal error exit (#7359)
- @ryanwyler:
  - fix(tui): restore showDetails check removed in Permission rework (#7285)

## v1.1.6 — 2026-01-07

## Core
- Encode non-ASCII directory paths in HTTP headers (@jwaterwater)
- Add truncation for all tools
- Make General SubAgent visible in agent list (@dbpolito)
- Improve handling of unserializable errors
- Added ability to hide subagents from primary agent's system prompt (@Sewer56)
- Add --use-system-ca flag in execArgv to support system certificate authorities
- Ensure commands listing subagent work
## TUI
- Add theme functionality
- Reload theme when configuration changes
- Clear palette cache
- Add agent color to inline task tool ASCII character and highlight agent name (@spoons-and-mirrors)
- Escape backticks when passing commands to PowerShell (@NSPC911)
- Restore attach session lookup behavior in TUI (@rmk40)
## Desktop
- Fix pasting images when input is empty in desktop app (@dbpolito)
- Bundle media framework in desktop application (@Brendonovich)
- Fixed macOS application entitlements configuration (@Brendonovich)
- Add audio input and camera permissions to entitlements (@saeedvaziry)
- Bundle media framework in AppImage for desktop application (@Brendonovich)
- Use Show instead of Suspense in desktop application (@Brendonovich)
- Add UI package to desktop application (@Brendonovich)
- Show window immediately during desktop startup (@usvimal)
- Rework storage approach in app
- Fix session navigation with keyboard shortcuts
- Permission auto-accept should hide when not needed
- Improve terminal text selection visibility with better color contrast

**Thank you to 11 community contributors:**
- @rmk40:
  - fix(tui): restore attach session lookup behavior (#7150)
- @NSPC911:
  - fix: escape backticks when passing to powershell (#7157)
- @Sewer56:
  - Added: Ability to hide subagents from primary agents system prompt. (#4773)
- @Brendonovich:
  - use custom tauri-cli on linux
  - desktop: use regular tauri cli again
  - desktop: use correct tauri-cli branch
  - try using forked tauri-cli again
  - add ui package to desktop
  - desktop: use Show instead of Suspense
  - desktop: appimage bundleMediaFramework
  - fix entitlements
  - desktop: go back to regular tauri cli
  - desktop: bundleMediaFramework
- @spoons-and-mirrors:
  - add agent color to  inline task tool ascii char and highlight agent name (#7142)
- @usvimal:
  - perf: show window immediately during desktop startup (#6734)
- @dbpolito:
  - Make General SubAgent not hidden (#6752)
  - Desktop: Fix Paste image on empty input (#7130)
- @saeedvaziry:
  - Add audio input and camera permissions to entitlements (#7117)
- @shuv1337:
  - feat: add Night Owl theme (desktop) (#7151)
- @jwaterwater:
  - fix: encode non-ASCII directory paths in HTTP headers (#7145)
- @athal7:
  - fix(ui): prevent iOS Safari auto-zoom on input focus (#7214)

## v1.1.4 — 2026-01-06

## Core
- Add timeout to prevent hanging operations (@spoons-and-mirrors)
- Add support for URL-based instructions (@spoons-and-mirrors)
- Load OPENCODE_CONFIG_DIR AGENTS.md into the system prompt (@ThomasGormley)
- Fix title generation for subtask-only messages to extract actual user prompts instead of generic tool execution descriptions
- Ensure 'name' isn't being sent in request body for custom agent
- Restore skill filtering by agent permissions (@malhashemi)
- Add missing await for available skills in skill tool (@mwolting)
- Prevent Java Language Server path checks from throwing errors (@T1mn)
- Add automatic jp. prefix assignment for Tokyo region (ap-northeast-1) (@ikeda-tomoya-swx)
- Polish documentation markdown wording and capitalization (@T1mn)
- Filter dead worktrees in core functionality
- Handle cases where git is not available or initialized
- Upgrade OpenTUI to v0.1.69 with text rendering performance improvements
## TUI
- Add frecency-based file autocomplete to CLI (@galkatz373)
- Add keyboard shortcut 'c' to copy device code in OAuth flow (@akinfelami)
- Fix sidebar title padding to prevent scrollbar edge case (@ryanwyler)
## Desktop
- Copy and paste in terminal was broken
- Fix desktop documentation
- Increase contrast in terminal text for better readability
- Add view button to open files from review sidebar (@justrau)
- Open review sidebar when selecting file from picker (@justrau)
- Add middle-click to close tabs in review sidebar (@justrau)
- Improved web load performance through code splitting
- Improve scroll store performance in app
- Update Cargo.lock (@Brendonovich)
- Add single-instance plugin to prevent multiple desktop windows (@Junseo5)
- Make subtasks clickable in the task list (@OpeOginni)

**Thank you to 21 community contributors:**
- @OpeOginni:
  - Feat/clickable subtask (#6846)
- @T1mn:
  - docs: polish markdown wording and capitalization (#7019)
  - docs: add Simplified Chinese README (#7055)
  - fix: prevent jdtls path checks from throwing (#7052)
- @shanebishop1:
  - docs: fix order of permissions in agents docs (permissions subsection) (#7041)
- @xiliumz:
  - fix: use actual version in install script (#7044)
- @Junseo5:
  - fix(desktop): add single-instance plugin to prevent multiple windows (#6966)
- @Brendonovich:
  - update Cargo.lock
- @Eric-Guo:
  - Fix(app): @pierre/diffs will crash when a diff has undefined text (#7059)
- @justrau:
  - feat(app): add middle-click to close tabs in review sidebar (#7094)
  - fix(app): open review sidebar when selecting file from picker (#7096)
  - feat(app): add view button to open files from review sidebar (#7095)
  - fix(app): open links in new tab or browser (#7127)
- @athal7:
  - docs(ecosystem): add opencode-devcontainers plugin (#7100)
- @ryanwyler:
  - fix: sidebar title padding to prevent scrollbar edge case (#7089)
- @ikeda-tomoya-swx:
  - fix(provider): add jp. prefix auto-assignment for Tokyo region (ap-northeast-1) (#7053)
- @akinfelami:
  - feat(tui): add 'c' shortcut to copy device code in OAuth flow (#7020)
- @mwolting:
  - fix: add missing await for available skills in `skill` tool (#7072)
- @malhashemi:
  - fix: restore skill filtering by agent permissions (#7042)
- @jerome-benoit:
  - fix(desktop): use current_binary() to support symlinked executables (#7102)
- @DamianB-BitFlipper:
  - docs: Expand keybinds documentation (#7108)
- @ThomasGormley:
  - load `OPENCODE_CONFIG_DIR` AGENTS.md into the system prompt (#7115)
- @galkatz373:
  - feat(cli): frecency file autocomplete (#6603)
- @spoons-and-mirrors:
  - feat: url based instructions (#7125)
  - adding timeout (#7128)
- @mtymek:
  - docs: add OpenCode-Obsidian plugin (#7129)
- @dbpolito:
  - Desktop: Fix Big Messages (#7133)

## v1.1.3 — 2026-01-05

## Core
- Fixed terminal long-running processes in app
- Preserve permission config key order to maintain user-defined permission precedence
- Pass image parts to custom commands (@melihmucuk)
- Add support for jp. prefix in Amazon Bedrock cross-region inference profiles (@ikeda-tomoya-swx)
- Add configuration options and authentication precedence for Bedrock (@wnkz)
- Transform agent improvements and optimizations
- Filter out empty messages and reasoning for Anthropic API compatibility
## TUI
- Expand directory on Tab, select on Enter in TUI autocomplete (@yuguorui)
- Update GitHub Actions examples to use actions/checkout@v6 (@joshuadavidthomas)
- Fix Lucent Orange background transparency for slash commands (@roerohan)
- Add description for MCP command in documentation (@cravenceiling)
- Add system theme resolution and event handling to TUI
- Improve experience when operations are interrupted
## Desktop
- Store image attachments in the app
- Fix bottom padding in app interface
- Fixed terminal flakiness issues in the app
- Performance improvements through event batching in app
- Fix prompt input covering content in app
- Worktree selection now correctly navigates to the selected worktree
- Avoid unintended submits during IME composition (@MogamiTsuchikawa)
- Highlight collapsed active project in sidebar (@albingroen)
- Fix flicker and navigation issues when collapsing or expanding projects in the app (@albingroen)
- Add CLI installation to desktop application (@dbpolito)
- Fix image dragging in project edit dialog (@albingroen)

**Thank you to 10 community contributors:**
- @albingroen:
  - fix(app): fix image dragging in project edit dialog (#6700)
  - fix(app): fix flicker and navigation when collapsing/expanding projects (#6658)
  - feat(app): highlight collapsed active project in sidebar (#6958)
- @dbpolito:
  - Desktop: Install CLI (#6526)
- @MogamiTsuchikawa:
  - fix(app): avoid unintended submits during IME composition (#6952)
- @wnkz:
  - feat(bedrock): config options and authentication precedence (#6377)
- @cravenceiling:
  - docs: add description for MCP command (#6944)
- @roerohan:
  - fix: lucent-orng bg transparency for slash commands (#6938)
- @joshuadavidthomas:
  - docs: update GHA examples to use `actions/checkout@v6` (#6969)
- @ikeda-tomoya-swx:
  - fix(provider): add support for jp. prefix in Amazon Bedrock cross-region inference profiles (#6916)
- @melihmucuk:
  - fix: pass image parts to custom commands (#6525)
- @yuguorui:
  - tui: autocomplete: expand directory on Tab, select on Enter (#6975)

## v1.1.2 — 2026-01-05

## Core
- Fix permission rule matching to use permission field instead of pattern field
- Fix permission evaluation to use rule-based matching instead of wildcard patterns
- Handle skill scan failures for .claude files gracefully
- Handle case where big-pickle is unavailable as a fallback
- Prevent main model thinking variant from applying to small model (@melihmucuk)
- Increase default timeout to 30 seconds based on user feedback
- Add session search functionality with debounced input and server-side filtering
- Improve Rust formatter detection and add cargo fmt support
## TUI
- Allow exit when viewing child session in TUI (@rmk40)
- Fix symmetric padding in TUI input field
- Prevent session list rows from wrapping to two lines (@rgodha24)
- Fix optional session access to prevent runtime errors in TUI
## Desktop
- Implement auto-scroll for active command in slash popover (@OpeOginni)
- Fix responsive menu in desktop application (@dbpolito)
- Optimize model dialog visibility lookups (@shkumbinhasani)
- Add home icon to responsive menu in desktop app (@dbpolito)
- Add SVG preview support in session viewer (@shuv1337)
- Add AppStream MetaInfo file for desktop application (@NN708)
- Fix mobile screen size issues (@carterworks)
- Fix custom slash commands not showing on initial / (@Raviguntakala)
- Improved prompt input handling in the application

**Thank you to 11 community contributors:**
- @melihmucuk:
  - fix: prevent main model thinking variant from applying to small model (#6839)
- @rgodha24:
  - fix: prevent session list rows from wrapping to 2 lines (#6812)
- @albingroen:
  - fix(ui): fix select chevron alignment (#6690)
- @Raviguntakala:
  - fix(app): fix custom slash commands not showing on initial / (#6829)
- @carterworks:
  - Fix a few mobile screen size issues (#6808)
- @NN708:
  - feat(desktop): add AppStream MetaInfo file (#6030)
- @shuv1337:
  - feat(app): add SVG preview support in session viewer (#6868)
- @dbpolito:
  - Desktop: Improve Big Session Navigation - Scrollable (#6837)
  - Desktop: Adding Home Icon on Responsive Menu (#6794)
  - Desktop: Fix Responsive Menu (#6789)
- @shkumbinhasani:
  - perf: optimize model dialog visibility lookups (#6791)
- @OpeOginni:
  - feat(desktop): implement auto-scroll for active command in slash popover (#6797)
- @rmk40:
  - fix(tui): allow exit when viewing child session (#6898)

## v1.1.1 — 2026-01-04

This is a **major change** that overhauls the permissions system in OpenCode.

### Tools Merged into Permission

The `tools` configuration has been deprecated and merged into the `permission` field. Previously, you could enable/disable tools like this:

```json
{
  "tools": {
    "bash": true,
    "edit": false
  }
}
```

Now, this should be configured using `permission`:

```json
{
  "permission": {
    "bash": "allow",
    "edit": "deny"
  }
}
```

The old `tools` config is still supported for backwards compatibility and will be automatically migrated to the permission system.

### Granular Permissions with Object Syntax

Permissions now support granular control using an object syntax with pattern matching. When you specify a permission as an object, you can set different rules for different patterns:

```json
{
  "permission": {
    "bash": {
      "npm *": "allow",
      "git *": "allow",
      "rm *": "deny",
      "*": "ask"
    },
    "edit": {
      "*.md": "allow",
      "*.ts": "ask",
      "*": "deny"
    }
  }
}
```

Each key in the object is a glob pattern that matches against the tool's input, and the value is the action to take:
- `"allow"` - automatically approve
- `"deny"` - automatically reject
- `"ask"` - prompt the user for approval

You can also set a blanket permission using a simple string:

```json
{
  "permission": {
    "bash": "allow",
    "edit": "ask"
  }
}
```

Or set all permissions at once:

```json
{
  "permission": "allow"
}
```
### Breaking Changes for SDK Users

The permission events have changed significantly. The new `PermissionNext` module (`permission/next.ts`) has a different event structure compared to the old `Permission` module (`permission/index.ts`):

**Old Event Structure (`Permission.Event`):**
- `Updated`: `{ id, type, pattern, sessionID, messageID, callID, message, metadata, time }`
- `Replied`: `{ sessionID, permissionID, response }`

**New Event Structure (`PermissionNext.Event`):**
- `Asked`: `{ id, sessionID, permission, patterns, metadata, always, tool: { messageID, callID } }`
- `Replied`: `{ sessionID, requestID, reply }`

Key differences:
- Event name changed from `permission.updated` to `permission.asked`
- `type` renamed to `permission`
- `pattern` is now `patterns` (array of strings)
- `message` field removed
- `response` renamed to `reply`
- `permissionID` renamed to `requestID`
- New `always` field contains patterns that would be approved for future requests if user selects "always"

The reply values are the same: `"once"`, `"always"`, or `"reject"`

### Server Changes

- New endpoint: `POST /permission/:requestID/reply` for responding to permission requests
- Old endpoint `POST /session/:sessionID/permissions/:permissionID` is now deprecated
- `GET /permission` now returns `PermissionNext.Request[]` instead of `Permission.Info[]`
- Added CORS whitelist support via `server.cors` config option
- Added Content-Type headers for proxied static assets
- mDNS service name now includes port for uniqueness

### Other Changes

- Agent `tools` field is deprecated - use `permission` instead
- Agent `maxSteps` is deprecated - use `steps` instead
- Unknown agent properties are now collected into `options`
- Mode and plugin globs no longer search subdirectories (simplified to top-level only)

## Core
- Add development scripts for better debugging workflow in TUI
- Ensure @opencode-ai/plugin exists only on first run
- Add MCP resources support (@paoloricciuti)
- Initialize config in worktree
- Prioritize free GPT-5-mini for small model in GitHub Copilot
- Remove hardcoded .env read block and use new permissions model instead
- Prevent duplicate plugin function initialization (@ShpetimA)
- Update GitHub Copilot model priority list
- Add variant field to chat message input
- Update AGENTS.md documentation (@aryasaatvik)
- Fixed dependency installation and git worktree branch creation
- Fixed an issue in the codebase
- Add sandbox support for git worktrees to allow working in multiple directories per project
- Add timeout to MCP client connection calls (@RhysSullivan)
- Add per-project MCP config overrides (@jknlsn)
- Improve root detection for Gradle multi-project builds in Kotlin language server (@JBou)
- Improve plugin loading to handle builtin plugin failures gracefully
- Add reject message support to permission dialogs for better user feedback
- Wrap queued user messages with reminder to stay on track
- Add managed git worktrees
- Upgrade OpenTUI to v0.1.68 using GPA
- Add escape key handling to permission dialogs for better keyboard navigation
- Add TUI session selection API endpoint for navigation (@code-yeongyu)
- Add Kotlin LSP integration (@tjg184)
- Merge instructions arrays across config files instead of overriding them (@elithrar)
- Add variant support for minimal mode
- Fix Cloudflare AI Gateway SDK chat undefined error (@englishm)
- Handle NotFoundError for non-shared sessions in sync (@Hona)
- Improve plugin loading to handle builtin plugin failures gracefully
- Update CI configuration
- Add reload functionality and improve lazy utility with reset capability
- Remove memory leak fixes documentation after implementation
- Fix memory leaks in session management and improve permission error handling
- Fix TUI permission tests for new evaluate function signature
- Improve permission error handling and evaluation logic in TUI
- Ignore
- Add assistant metadata to session export (@dmmulroy)
- Ensure new permissions changes work for special case bash commands like rm, cd, etc
- Rework permission system
- Remove outdated Haiku filter for GitHub Copilot (@alcpereira)
- Make install dependencies non-blocking
- Use --no-cache flag when behind proxy to prevent connection hangs
- Check for context overflow mid-turn in finish-step (@aryasaatvik)
- Display error if invalid agent is used in a command (@Leka74)
- Add Content-Type headers for proxied static assets (@monotykamary)
## TUI
- Add missing theme list keybind in TUI (@aspiers)
- Handle duplicate PR creation when agent creates PR (@elithrar)
- Fix system theme diff highlighting in TUI
- Add --variant flag to run command (@shuv1337)
- Remove OpenRouter provider from priority list
- Make LSP status icon muted when no LSPs are active (@itsrainingmani)
- Make MCP status icon muted when no MCP servers are enabled (@itsrainingmani)
- Pass attach directory to SDK client in TUI (@shuv1337)
- Handle actions/checkout v6 credential storage change (@elithrar)
- Use Bun.sleep instead of Promise with setTimeout (@edlsh)
- Add Osaka Jade theme (@st-eez)
- Add heap snapshot option to system menu for debugging memory usage
- Fixed Windows fallback for "less" command in session list (@itsrainingmani)
- Fix import command regex to properly handle file paths
- Fix stats command day calculation and time filtering
## Desktop
- Fix scroll position restoration in app
- Don't override Ctrl+A on Windows
- Improve auto-scroll behaviors in the application
- Fixed editing projects in desktop application (@dbpolito)
- Update server URL normalization to retain path (@OpeOginni)
- Add image preview support in session viewer (@shuv1337)
- Add /compact session command to compress conversation history
- Adjust window drag region layout for desktop application
- Relax request timeouts
- Properly decode session ID for permission context in desktop app (@OpeOginni)
- Work in progress on application features
- Improve application startup time
- Add work in progress desktop functionality
- Add file context feature to app
- Improve desktop window resize handle (@dbpolito)

**Thank you to 30 community contributors:**
- @monotykamary:
  - fix(server): add Content-Type headers for proxied static assets (#6587)
- @Leka74:
  - fix: display error if invalid agent is used in a command (#6578)
- @aryasaatvik:
  - fix(session): check for context overflow mid-turn in finish-step (#6480)
  - docs: update AGENTS.md (#6800)
- @alcpereira:
  - fix: remove outdated Haiku filter for GitHub Copilot (#6593)
- @dbpolito:
  - Desktop: Improve Resize Handle (#6608)
  - Desktop: Edit Project Fix (#6757)
- @itsrainingmani:
  - fix: windows fallback for "less" cmd in `session list` (#6515)
  - fix(tui): make mcp status icon muted when no mcp servers are enabled (#6745)
  - fix(tui): make lsp status icon muted when no lsps are active (#6773)
- @dmmulroy:
  - feat: add assistant metadata to session export (#6611)
- @Hona:
  - fix(share): handle NotFoundError for non-shared sessions in sync (#6634)
- @OpeOginni:
  - fix(desktop): Properly decode session id for permission context (#6580)
  - fix(server): update server URL normalization to retain path (#6647)
- @albingroen:
  - fix(ui): fix slight vertical overflow in project selector (#6589)
- @st-eez:
  - feat(theme): add Osaka Jade theme (#6609)
- @edlsh:
  - refactor: use Bun.sleep instead of Promise setTimeout (#6620)
- @englishm:
  - fix: cloudflare-ai-gateway sdk.chat undefined error (#6407)
- @elithrar:
  - fix: handle actions/checkout v6 credential storage change (#6667)
  - fix: merge instructions arrays across config files (#6663)
  - github: handle duplicate PR creation when agent creates PR (#6777)
  - docs: add logging best practices for plugin authors (#6833)
- @spoons-and-mirrors:
  - docs: add subtask2 to ecosystem page (#6704)
- @tjg184:
  - feat: Add kotlin lsp integration (#6601)
- @code-yeongyu:
  - feat(plugin): add tui.session.select API endpoint for TUI navigation (#6565)
- @shuv1337:
  - fix(tui): pass attach directory to sdk client (#6715)
  - feat(app): add image preview support in session viewer (#6678)
  - feat: add --variant flag to run command  (#6805)
- @JBou:
  - fix(kotlin-ls): improve root detection for Gradle multi-project builds (#6717)
- @jknlsn:
  - feat: add per-project MCP config overrides (#5406)
- @sin4ch:
  - docs: enhance MCP servers documentation with a tip (#6713)
- @RhysSullivan:
  - fix(mcp): add timeout to client.connect() calls (#6760)
- @jerilynzheng:
  - docs: Add Vercel AI Gateway to provider docs (#6790)
- @benjaminshafii:
  - docs: Add opencode-scheduler plugin to ecosystem (#6804)
- @ShpetimA:
  - fix(plugin): prevent duplicate plugin function initialization (#6787)
- @johnconnor-sec:
  - docs: typo in subtask documentation (#6821)
- @felipeorlando:
  - Remove opencode-skills entry from ecosystem.mdx (#6817)
- @jerome-benoit:
  - feat(nix): preliminary desktop app flake integration (#6135)
- @paoloricciuti:
  - feat: mcp resources (#6542)
- @aspiers:
  - fix(tui): add missing `theme_list` keybind (#6779)

## v1.0.223 — 2026-01-01

## TUI
- Don't show 'Agent not found' toast for subagents
## Desktop
- Add context window configuration to app

## v1.0.222 — 2026-01-01

## Core
- Add Windows support for PTY and cross-platform build scripts in desktop application (@Hona)
- Prevent TimeoutOverflowWarning by capping setTimeout delay to maximum 32-bit signed integer value
## Desktop
- Add in-app update toasts to desktop application
- Add subagent mention support to desktop application (@dbpolito)

**Thank you to 2 community contributors:**
- @dbpolito:
  - Desktop: Add Subagents Mention Support (#6540)
- @Hona:
  - fix(desktop): Windows support for PTY and cross-platform build scripts (#6508)

## v1.0.221 — 2025-12-31

## Core
- Default to ai-sdk/openai-compatible when no npm package is provided
- Add support for LSP workspace/didChangeWatchedFiles notifications (@marceldev89)

## Desktop
- Improved model selector in app
- Auto-accept colors in app
- Fix tooltip colors in desktop application
- Better affordance for auto-accept in desktop app
- Add input changes functionality
- Don't show notifications when auto-accepting tasks in desktop app
- More defensive access in desktop application
- Better variant toggle in app
- Add keybind tooltip component to app
- Fix desktop prompt input cleanup behavior

**Thank you to 2 community contributors:**
- @marceldev89:
  - Add support for LSP workspace/didChangeWatchedFiles (#6524)
- @vtemian:
  - fix(tui): don't show 'Agent not found' toast for subagents (#6528)

## v1.0.220 — 2025-12-31

## Core
- Fix plugin and mode glob patterns
- Add debug agent subcommand to test agents in isolation (@Eric-Guo)
- Display MCP tag for prompts in autocomplete but not in prompt (@paoloricciuti)
## TUI
- Clarify agent-name placeholder in tips (@anzulaqeel-anunzio)
## Desktop
- Remove status bar and add new elements in header
- Better new session button in desktop app
- Add unified diff toggle to desktop application
- Fix desktop not rendering large sessions

**Thank you to 4 community contributors:**
- @paoloricciuti:
  - fix: display MCP tag for prompts in autocomplete but not in prompt (#6531)
- @anzulaqeel-anunzio:
  - fix: Clarify agent-name placeholder in tips (#6520)
- @Eric-Guo:
  - feat(cli): New debug agent <name> subcommand (#6529)
- @backnotprop:
  - docs: Add plannotator plugin (#6510)

## v1.0.219 — 2025-12-31

## Core
- MDNS no longer fails when service is already registered
- Allow configurable CORS hosts
- Add MCP prompts as slash commands (@paoloricciuti)
- Add Gemini 3 Flash to fast models list (@junmediatek)
- Bundle @ai-sdk/vercel version 1.0.31 for AI SDK v5 support (@OpeOginni)
- Cleaner view for subagents hint text
- Add configurable timeout for MCP tool calls to prevent hanging requests
- Read plural resource types and stop erroring on them
- Fix OpenAI variants for Codex models
- Add model usage statistics with input/output token breakdown to stats command (@processtrader)
- Add rustfmt formatter for Rust files (@frhd)
- Ensure variants work for completely custom models
## TUI
- Adjust keys for uniqueness calculations to use provider/model
## Desktop
- Don't open native folder select when connected to remote server
- Add model variants support to app
- Better notification icon in desktop app
- Upgrade to latest version on error page in desktop app

**Thank you to 6 community contributors:**
- @frhd:
  - feat(format): add rustfmt formatter for Rust files (#6482)
- @processtrader:
  - feat: add model usage statistics with input/output token breakdown to stats command (#6296)
- @brianclinkenbeard:
  - Update mise install command (#6504)
- @OpeOginni:
  - feat: bundle in @ai-sdk/vercel version 1.0.31 for aisdk v5 support (#6512)
- @junmediatek:
  - feat: add gemini-3-flash to fast models list (#6497)
- @paoloricciuti:
  - feat: mcp prompts as slash commands (alternative) (#5767)

## v1.0.218 — 2025-12-30

## Core
- Add CORS exception for Tauri desktop application
- Add Prisma language server (@ravshansbox)
- Add extract reasoning middleware (@snipeship)

**Thank you to 2 community contributors:**
- @snipeship:
  - feat: add extract reasoning middleware (#6463)
- @ravshansbox:
  - Add prisma language server (#6462)

## v1.0.217 — 2025-12-30

## Core
- Allow CORS requests from Tauri localhost origin
## TUI
- Move variant toggle to command bar

## v1.0.216 — 2025-12-30

## Core
- Allow CORS requests from *.opencode.ai subdomains

**Thank you to 1 community contributor:**
- @anntnzrb:
  - style(nix): use idiomatic inherit syntax (#6457)

## v1.0.215 — 2025-12-30

## TUI
- Fixed high CPU usage and memory leak when filtering model list to empty results (@d3vr)
## Desktop
- More defensive agent access in desktop application

**Thank you to 1 community contributor:**
- @d3vr:
  - Fix: High CPU / memory leak when filtering model list window to empty results (#6435)

## v1.0.214 — 2025-12-30

## Core
- Fix Cloudflare provider information (@roerohan)
## Desktop
- Sort desktop servers by health status
- Don't persist fallback server URLs in desktop app
- Improved text selection behavior in the app
- Share projects across all local servers in desktop app

**Thank you to 1 community contributor:**
- @roerohan:
  - fix: cloudflare provider information (#6426)

## v1.0.213 — 2025-12-30

## Core
- Upgrade OpenTUI to v0.1.67, fixing split diff alignment and markdown jitter
## Desktop
- Don't hang on to dead server in desktop app

## v1.0.212 — 2025-12-30

## Desktop
- Change server configuration in app

## v1.0.211 — 2025-12-30

## Core
- Revert OpenTUI to 0.1.63 to fix streaming jitter regression (@ryanwyler)

**Thank you to 2 community contributors:**
- @connorads:
  - docs: global claude skills (#6436)
- @ryanwyler:
  - fix: revert opentui to 0.1.63 to fix streaming jitter regression (#6439)

## v1.0.210 — 2025-12-30

## Core
- Add ability to open projects in web interface
- Read global Claude skills in addition to project-specific skills
- Use named import for bonjour-service to fix module resolution (@Jkker)
- Add variants toggle
- Expose server URL to plugins (@EduSantosBrito)
- Upgrade OpenTUI to v0.1.66 fixing split diff alignment
## TUI
- Prevent model list corruption from SolidJS reactivity (@joachim-isaksson)
## Desktop
- Add readline shortcuts to desktop app
- Disable sourcemap generation in desktop build
- Add system notifications support for desktop application

**Thank you to 4 community contributors:**
- @sneycampos:
  - fix: Correct theme command in tui.mdx (#6410)
- @EduSantosBrito:
  - feat(plugin): expose server URL to plugins (#6373)
- @Jkker:
  - fix(mdns): use named import for bonjour-service (resolves #6422) (#6423)
- @joachim-isaksson:
  - fix: prevent model list corruption from SolidJS reactivity (#6359)

## v1.0.209 — 2025-12-30

## Core
- Add timeout to file watcher subscriptions
- Adjust git watcher to ignore files other than HEAD
- Set small options for Google models on OpenRouter (@neominik)
- Add Nix syntax highlighting (@anntnzrb)
- Make format parameter optional with markdown default in WebFetch (@samcornor)
- Filter messages with only step-start parts in toModelMessage (@coleleavitt)
- Add nixfmt formatter for Nix files (@anntnzrb)
## Desktop
- Fix error page formatting in desktop app
- Improve error messages in desktop app

**Thank you to 7 community contributors:**
- @anntnzrb:
  - feat(format): add nixfmt formatter for Nix files (#6380)
  - feat(highlight): add nix syntax highlighting (#6386)
- @coleleavitt:
  - fix: filter messages with only step-start parts in toModelMessage (#6383)
- @gbpdt:
  - Support different Nix store path prefixes (#6367)
- @nexxeln:
  - add supermemory plugin to ecosystem (#6399)
- @samcornor:
  - fix(webfetch): make format parameter optional with markdown default (#6345)
- @neominik:
  - Set smallOptions for google models on openrouter (#6362)
- @panta82:
  - docs: opencode notificator plugin (fixed link) (#6341)

## v1.0.208 — 2025-12-29

## Core
- Prevent truncated Claude streams (@CasualDeveloper)
- Fix ESLint LSP server auto-installation failure on Windows (@fraineralex)
- Install local plugin dependencies from package.json (@elithrar)
- Preserve imperative statements in summary generation
- Add support for region and bearer token configuration in Bedrock (@wnkz)
- Add support for `.claude/skills` directory (@connorads)
## TUI
- Make authentication URLs clickable regardless of line wrapping in terminal interface (@brettheap)
## Desktop
- Fix scroll synchronization in desktop application
- Improve desktop performance and scrolling behavior
- Add auto-accept edits toggle in desktop application
- Add image preview and deduplicate file uploads in desktop application (@dbpolito)
- Improve desktop application performance and reduce jankiness
- Revert desktop jankiness fix
- Fix desktop application jankiness
- Add project editing functionality in desktop application (@dbpolito)
- Improve state update granularity for permissions in desktop application
- Improve state update granularity in desktop application
- Synchronize last agent and model when changing sessions in desktop application
- Fix context usage alignment in desktop application

**Thank you to 9 community contributors:**
- @connorads:
  - feat: add support for `.claude/skills` directory (#6252)
- @wnkz:
  - fix(bedrock): support region and bearer token configuration (#6332)
- @3mdistal:
  - docs: clarify that MCP tools require glob patterns to disable (#6306)
- @elithrar:
  - docs: add compaction, watcher, experimental and provider options (#6304)
  - meta: use colors for agents (#5845)
  - feat: install local plugin dependencies from package.json (#6302)
- @dbpolito:
  - Desktop: Edit Project (#6360)
  - Desktop: Image Preview and Dedupe File Upload (#6372)
- @airtonix:
  - docs: add opencode-skillful plugin to ecosystem page (#6333)
- @fraineralex:
  - fix(lsp): ESLint LSP server fails to auto-install on Windows (#6366)
- @brettheap:
  - fix(tui): make auth URLs clickable regardless of line wrapping (#6317)
- @CasualDeveloper:
  - fix: prevent truncated Claude streams (#6388)

## v1.0.207 — 2025-12-29

- Sync LSP updates (@dbpolito)
- Added theme preview
- Include current working directory in local MCP transport (@dbpolito)

**Thank you to 4 community contributors:**
- @didier-durand:
  - doc: fix typos in various files (#6294)
- @dbpolito:
  - Include current working directory in local MCP transport (#6303)
  - Desktop: Sync LSP updates (#6305)
- @mohak34:
  - docs: add opencode-notifier plugin to ecosystem (#6283)
- @elithrar:
  - docs: add plugin configuration documentation (#6301)

## v1.0.206 — 2025-12-28

No notable changes

## v1.0.205 — 2025-12-28

- Thinking & tool call visibility settings for `/copy` and `/export` (@rektide)
- Add bash shell completions (@scarf005)
- Fix stats command to correctly handle `--days 0` for current day statistics (@processtrader)
- Fix: search all recent models instead of only top 5 in TUI /models command
- Allow line numbers and ranges in autocomplete (@ewired)
- Themes
- Fix copy/paste in terminal
- Fix: drag file over entire body to attach
- Fix: handle non-text response parts in GitHub action (@elithrar)

**Thank you to 7 community contributors:**
- @ewired:
  - Allow line numbers and ranges in autocomplete (#4238)
- @panta82:
  - docs: add opencode-notificator to ecosystem plugins list (#6269)
- @processtrader:
  - fix: stats command to correctly handle `--days 0` for current day statistics (#6259)
- @Nindaleth:
  - docs: document attach command (#6254)
- @scarf005:
  - feat: add bash shell completions (#6239)
- @rektide:
  - Thinking & tool call visibility settings for `/copy` and `/export` (#6243)
- @elithrar:
  - fix: handle non-text response parts in GitHub action (#6173)

## v1.0.204 — 2025-12-27

- Added path traversal protection to File.read and File.list (#5985)
- Added ability to disable spinner animation (#6084)
- Added shfmt formatter for shell scripts (#6204)
- Added configurable compaction settings to allow users to disable auto-compaction and pruning via config instead of flags
- Fixed compact command after revert now properly cleans up revert state (#6235)
- Fixed compaction config checks to properly respect user settings
- Fixed `opencode web` baseURL error (#6181)
- Fixed upgrade command to use gh releases page if not npm/bun/pnpm install method
- Fixed mdns global config
- Reapplied optional mdns service
- Updated transform for gemini models so that topP and topK match gemini-cli values
- Only show diagnostics block when errors exist (#6175)
- Added MCP UI (#6162)
- Added permissions
- Fixed prompt input fixes, directory and branch in status bar
- Handle more errors
- Added support for issues and workflow_dispatch events (#6157)

**Thank you to 9 community contributors:**
- @JackNorris:
  - fix: only show diagnostics block when errors exist (#6175)
- @didier-durand:
  - doc: fix typos in various files (#6196)
  - doc: fix typos in various files (#6238)
- @dbpolito:
  - Desktop: MCP UI (#6162)
- @robertocarvajal:
  - fix(dep): Update package.json - fix perplexity provider version (#6199)
- @anntnzrb:
  - feat: add shfmt formatter for shell scripts (#6204)
  - feat: add ability to disable spinner animation (#6084)
- @rgodha24:
  - fix: `opencode web` baseURL error (#6181)
- @elithrar:
  - github: support issues and workflow_dispatch events (#6157)
- @ochsec:
  - fix: compact command after revert now properly cleans up revert state (#6235)
- @edlsh:
  - feat: add path traversal protection to File.read and File.list (#5985)

## v1.0.203 — 2025-12-26

- Make JDTLS use the correct config directory on Windows (@apersomany)
- Added Haskell LSP support (@amerocu)

**Thank you to 2 community contributors:**
- @amerocu:
  - feat: haskell lsp support (#6141)
- @apersomany:
  - fix(lsp): make JDTLS use the correct config directory on Windows (#6121)

## v1.0.202 — 2025-12-26

- Fixed padding
- Moved session context to top-right
- Fixed missing keybinds in tooltips
- Fixed can't collapse project with active session
- Added better indicator that session is busy

## v1.0.201 — 2025-12-25

- Fixed prompt input issues
- Removed list tool

## v1.0.200 — 2025-12-25

- Fixed scroll jank in session turn and review
- Fixed override agent model
- Fixed reconcile session diff updates

## v1.0.199 — 2025-12-25

- Fixed server connection failure display
- Fixed Content-Type headers for static assets on app.opencode.ai (@sourman)
- Disabled tips display in home route

**Thank you to 3 community contributors:**
- @robbtolli:
  - docs: Corrected the number of built-in subagents in documentation (#6133)
- @connorads:
  - docs: update skills to use canonical `~/.config/opencode` location (#6132)
- @sourman:
  - fix: correct Content-Type headers for static assets on app.opencode.ai (#6113)

## v1.0.198 — 2025-12-24

- revert responsive UI changes

## v1.0.195 — 2025-12-24

No notable changes

## v1.0.194 — 2025-12-24

- Added "Did you know?" start screen tips
- Added prompt stashing (@RhysSullivan)
- Handle tools/list_changed notifications in MCP (@seuros)
- Console copy-to-clipboard via opentui (@edlsh)
- Fixed textarea resizing when pasting prompt less than 150 characters (@OpeOginni)
- Prevented keybinds from executing when dialog is open (@anntnzrb)
- Fixed favorites and recents stay visible when filtering models (@DanielFGray)
- Updated current todo style
- Updated import and PR commands to use new share link URL
- Made "The socket connection was closed unexpectedly" errors retryable
- Improved error retry logic
- Fixed session sort when multiple active
- Fixed an issue where text selection was disabled
- Excluded deprecated models
- Conditionally show review pane toggle
- Fixed GitHub Pull Request event handling (@dbpolito)
- Added Cloudflare AI Gateway provider (@elithrar)

**Thank you to 12 community contributors:**
- @dbpolito:
  - Fix Github Pull Request Event (#6037)
- @RhysSullivan:
  - [feat]: prompt stashing (#6021)
- @anntnzrb:
  - fix(tui): prevent keybinds from executing when dialog is open (#6017)
  - feat(install): add standard CLI flags (--help, --version, --no-modify-path) (#5885)
- @elithrar:
  - docs: add MCP OAuth debugging section (#6047)
  - providers: add Cloudflare AI Gateway (#5174)
- @DanielFGray:
  - fix: favorites and recents stay visible when filtering models (#6053)
- @JRedeker:
  - Add opencode-shell-strategy plugin to ecosystem (#5995)
- @nagyv:
  - Update gitlab.mdx to use the 2.x component version (#6062)
- @OpeOginni:
  - fix: resize textarea when pasting prompt less than 150 chars (#6070)
- @edlsh:
  - feat(tui): console copy-to-clipboard via opentui (#5658)
- @seuros:
  - feat(mcp): handle tools/list_changed notifications (#5913)
- @xiantang:
  - docs: add Neovim to the list of editors (#6081)
- @R44VC0RP:
  - fix: remove SVG favicon to improve SEO (#5755)

## v1.0.193 — 2025-12-23

- Indent wrapped todo items properly

## v1.0.191 — 2025-12-23

- Improved `mcp` CLI and added ability to debug MCP OAuth (@elithrar)
- Fixed handling of Windows CRLF line endings in grep tool (@majiayu000)
- Added per-agent filtering to skill tool description (@malhashemi)
- Better styling for small screens (short and/or not wide)
- Changed task tool container to block layout for better subagent session display
- Better error messages on connection failure
- Allowed compaction hook to replace prompt entirely (@joelhooks)

**Thank you to 5 community contributors:**
- @malhashemi:
  - feat(skill): add per-agent filtering to skill tool description (#6000)
- @joelhooks:
  - feat(plugin): allow compaction hook to replace prompt entirely (#5907)
- @majiayu000:
  - fix: handle Windows CRLF line endings in grep tool (#5948)
- @elithrar:
  - improve `mcp` CLI + ability to debug MCP oauth (#5980)
- @Brendonovich:
  - console: add AppImage download link

## v1.0.190 — 2025-12-22


**Thank you to 1 community contributor:**
- @malhashemi:
  - feat: add native skill tool with permission system (#5930)

## v1.0.186 — 2025-12-22

- Added experimental LSP tool
- Added nixd as LSP for Nix language (@luochen1990)
- Supported clipboard image paste (Ctrl+V) on Windows (@zzzeian)
- Ensured installation commands use .quiet (@val-2)
- Added mobile responsiveness
- Added ARM64 build for Linux (@NN708)
- Polished dialog and list styles for the desktop app, and added fixed logos (@aaroniker)
- Cleaned up auto scroll
- Filtered child sessions from header
- Exposed auto parameter in session.summarize for plugins (@code-yeongyu)
- Added Agent Skills support
- Improved built-in /review prompt (@elithrar)
- Adjusted Minimax m2 topK and added Minimax m2.1 topP
- Fixed snapshots to be performed in cases where finish-step is not reached (@noamzbr)

**Thank you to 12 community contributors:**
- @code-yeongyu:
  - feat(server): expose auto param in session.summarize for plugins (#5924)
- @elithrar:
  - prompts: improve built-in /review prompt (#5918)
- @noamzbr:
  - fix: Perform snapshot in cases finish-step is not reached (#5912)
- @zzzeian:
  - fix: support clipboard image paste (Ctrl+V) on Windows (#5919)
- @ben-vargas:
  - docs: add ai-sdk-provider-opencode-sdk to ecosystem (#5772)
- @val-2:
  - fix: ensure installation commands are using .quiet (#5758)
- @luochen1990:
  - feat: add nixd as lsp for nix language (#5929)
- @Brendonovich:
  - remove actions artifact uploading
  - try uploading artifacts in workflow
- @NN708:
  - feat(desktop): arm64 build for linux (#5935)
- @aaroniker:
  - feat: polish dialog & list styles for the desktop app, add fixed logos from models.dev (#5925)
- @majiayu000:
  - fix: use current page port instead of hardcoded 4096 (#5949)
- @ashutoshpw:
  - server: ensure frontend has correct port for PTY websocket connections (#5898)

## v1.0.185 — 2025-12-21

- Fixed LSP server binary installation and shell command execution
- Updated kimi-k2 and kimi-k2-thinking to use recommended temperature values
- Fixed SDK context usage and server port fallback
- Added syntax highlighting for .ets files (@nalin-singh)
- Updated to the official MCP SDK for better tool schema handling (@seuros)
- Added support for schedule events (@elithrar)

**Thank you to 5 community contributors:**
- @elithrar:
  - github: support schedule events (#5810)
- @seuros:
  - fix: use official MCP SDK for better tool schema handling (#5463)
- @ahosker:
  - fix: prevent stats workflow from running on forks (#5897)
- @nalin-singh:
  - feat: add syntax highlighting for .ets files (#5889)
- @HelloGGX:
  - fix(deps): add missing @opencode-ai/plugin to dependencies (#5797)

## v1.0.184 — 2025-12-21

- Fixed layout regression
- Better keybind tooltips
- Allowed text selection
- Fixed incorrect state directory on macOS

## v1.0.183 — 2025-12-21

- Added verification that at least 1 primary agent is enabled
- Better error reporting
- Fixed file loading errors

**Thank you to 1 community contributor:**
- @christso:
  - Make CLI build script Windows-friendly (#5835)

## v1.0.182 — 2025-12-21

- Fixed a regression where config would error despite valid agents

## v1.0.181 — 2025-12-21


**Thank you to 8 community contributors:**
- @rcssdy:
  - feat: add cursor theme (#5850)
- @anntnzrb:
  - fix: prioritize session list loading when resuming with -c (#5816)
  - docs: add name property to model configuration example (#5853)
- @majiayu000:
  - fix: add transform case for gemini if mcp tool has missing array items (#5846)
- @elithrar:
  - feat: support configuring a default_agent across all API/user surfaces (#5843)
- @ShpetimA:
  - fix: system theme flicker (#5842)
- @shamil2:
  - feat: add Catppuccin Frappé theme (#5821)
- @R44VC0RP:
  - feat(docs): adding .md to docs pages shows raw markdown (#5823)
  - docs: clarify model ID format for OpenCode provider (#5854)
- @YuY801103:
  - docs: add Traditional Chinese (Taiwan) README translation (#5861)

## v1.0.180 — 2025-12-20

- Added endpoints to delete and update message parts (@remorses)
- Fixed sidebar UX issues
- Fixed event reconnect gaps

**Thank you to 1 community contributor:**
- @remorses:
  - feat: add endpoints to delete and update message parts (#5433)

## v1.0.176 — 2025-12-20

- Fixed sidebar UX issues
- Fixed event reconnect gaps

## v1.0.175 — 2025-12-20

- Fixed logic for determining when files should be encoded
- Added retries to initialization promises
- Fixed an issue where projects without metadata were missing from the layout

## v1.0.174 — 2025-12-20

- Reinsert forked message text in prompt text input box when forking session (@ariane-emory)
- Make LSP message more accurate when LSPs are disabled (@kasbah)
- Fixed file encoding issue (@crob19)
- Prevented file system scanning when in the root directory to avoid unnecessary operations
- Excluded hidden agents from the Agent Client Protocol (@josevalim)
- Upgraded OpenTUI to v0.1.62, enabling textarea mouse scroll and cursor set
- Improved auto-scroll and session performance
- Stopped using Tauri HTTP for SSE events
- Fixed error height

## v1.0.170 — 2025-12-19

## TUI
- User messages as markdown with toggle
- Implement smooth scrolling for autocomplete dropdown navigation (@HelloGGX)
- LSP: add oxlint server (@Eric162)
- Use correct Octokit API for PR review comment reactions (@elithrar)

## Desktop
- Fixed error handling
- Separate prompt history for shell
- Don't navigate prompt history if dirty
- Remove pinch-to-zoom on window (@Brendonovich)

**Thank you to 6 community contributors:**
- @Hona
- @24601
- @Brendonovich
- @elithrar
- @Eric162
- @HelloGGX

## v1.0.169 — 2025-12-19


**Thank you to 3 community contributors:**
- @rgodha24
- @Hona
- @24601

## v1.0.168 — 2025-12-18

- Add experimental support for Ty language server
- Add fork slash command for keyboard-friendly session forking in TUI
- Add shell mode for desktop
- Add custom update toast for desktop
- Improve Github Action Hallucinations
- Fix model validation before executing slash command
- Fix desktop expanded states
- Fix desktop smaller max-width when review open
- Fix desktop don't show image button in shell mode
- Fix desktop error styles
- Fix desktop prompt history navigation and optimistic prompt duplication
- Fix desktop session ordered by most recent
- Fix desktop disable pinch to zoom
- Fix Tauri pinch zoom on Linux
- Fix Tauri configure display backends more correctly on Linux
- Add OIDC_BASE_URL support for custom GitHub App installs
- Remove interleaved thinking filter for certain Kimi K2 thinking model providers that were bugged
- Improve retry cases

**Thank you to 7 community contributors:**
- @Brendonovich:
  - tauri: configure display backends more correctly on linux (#5730)
  - tauri: disable pinch zoom on linux (#5735)
- @dbpolito:
  - Improve Github Action Hallucinations (#5751)
- @byigitt:
  - docs: fix typos (#5753)
- @devxoul:
  - fix(command): validate model before executing slash command (#5740)
- @ariane-emory:
  - feat(tui): fork slash command for keyboard-friendly session forking (resolves #5599) (#5610)
- @elithrar:
  - github: add OIDC_BASE_URL for custom GitHub App installs (#5756)
- @OpeOginni:
  - feat: add experimental support for Ty language server (#5575)

## v1.0.167 — 2025-12-18

- Fixed handling of empty directory query parameter in server middleware
- Updated terminology from "OpenCode CLI" to "OpenCode Server" in Tauri
- Added copy logs button to server spawn failure dialog in Tauri
- Added option to disable terminal title in TUI
- Improved MCP authentication and OAuth state handling

**Thank you to 6 community contributors:**
- @R44VC0RP:
  - docs: add opencode.cafe to ecosystem page (#5714)
- @roerohan:
  - MCP improvements (#5699)
- @jknlsn:
  - feat(tui): add option to disable terminal title (#5713)
- @devxoul:
  - docs: add OPENCODE_DISABLE_TERMINAL_TITLE to environment variables (#5725)
- @Brendonovich:
  - tauri: server spawn fail dialog w/ copy logs button (#5729)
  - tauri: say OpenCode Server instead of OpenCode CLI
- @kcrommett:
  - fix: handle empty directory query parameter in server middleware (#5732)

## v1.0.166 — 2025-12-17

- Fixed init error messages to be more descriptive
- Fixed the TUI copying the wrong assistant message when the last message had been reverted

**Thank you to 1 community contributor:**
- @assagman:
  - fix(tui): exclude reverted assistant reply when copying last message (#5705)

## v1.0.165 — 2025-12-17

- Added startup error display in desktop client
- Added optimistic prompt submission in desktop client
- Better error messages throughout the application
- Prevent "1" from showing when preparing write
- Added `viewportOptions` to scrollbox for padding adjustments to avoid scrollbar overlap
- Show plugins in `/status` command
- Fixed session list selection from jumping to active session when confirming delete
- Added experimental `session.compacting` hook for pre-compaction context injection
- Fixed session status TypeError in TUI
- Keep session dialog open if deleting session fails
- Added `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX` environment variable to override 32k default
- Added Inter and IBM Plex Mono font support in desktop client
- Fixed `mcpName` being sent as state when authUrl doesn't have `state` parameter
- Enabled edit and todoread batch operations with clarified error messages
- Fixed subagent navigation order to newest-to-oldest
- Fixed config option `setCacheKey` not being respected
- Added Lucent Orange theme
- Fixed command shortcuts
- Improved diffs performance
- Added session sharing feature in desktop client
- Upgraded opentui to v0.1.61
- Added ability to disable terminal title using `OPENCODE_DISABLE_TERMINAL_TITLE` environment variable
- Added task tool execution hooks and command context tracking for plugins
- Added configurable mentions input for GitHub
- Increased session width in TUI to accommodate longer code blocks and improve readability
- Fixed load more button

**Thank you to 15 community contributors:**
- @elithrar:
  - github: add configurable mentions input (#5655)
- @spoons-and-mirrors:
  - plugin(hook): add task tool execution hooks and command context tracking (#5642)
  - batch: enable edit, todoread, clarify error message, minor tool description change (#5659)
  - UI: show plugins in /status (#4515)
- @devxoul:
  - Add availability to disable terminal title using OPENCODE_DISABLE_TERMINAL_TITLE env (#5661)
- @amadeus:
  - Diffs Performance Improvements (#5653)
- @Brendonovich:
  - tauri: dev icons + separate prod config (#5691)
  - tauri: only alert on update failure when triggered manually
  - tauri: return after update failures
  - tauri: update nsis icon
  - tauri: nsis header and sidebar
  - console: add /download/[platform] endpoint
  - console: use download proxy to rename mac and windows installers (#5697)
- @sachnun:
  - fix: remove unsupported parameter from bash tool description  (#5676)
- @roerohan:
  - feat: added lucent-orng theme (#5678)
- @Stoufiler:
  - docs: Sort LSP Server list (#5688)
- @shantur:
  - fix: config option setCacheKey not being respected (#5686)
- @RhysSullivan:
  - fix: change subagent navigation order to newest-to-oldest (#5680)
- @paoloricciuti:
  - fix: send `mcpName` as state if authUrl doesn't have `state` (#5681)
- @junmediatek:
  - add OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX to override 32k default (#5679)
- @Raviguntakala:
  - fix(tui): resolve session_status TypeError (#5520)
- @joelhooks:
  - feat(plugin): add experimental.session.compacting hook for pre-compaction context injection (#5698)
- @nalin-singh:
  - fix: prevent session list selection from jumping to active session when confirming delete (#5666)
  - feat: add viewportOptions to scrollbox for padding adjustments to avoid scrollbar overlap (#5703)

## v1.0.164 — 2025-12-16

- Fixed prompt history navigation in the desktop app
- Fixed focus on prompt input after closing dialogs
- Fixed prompt input for multi-line text
- Fixed defensive audio initialization
- Added ability to load more sessions per project using a button in the desktop app
- Added experimental oxfmt formatter support
- Fixed git branch filewatcher and added flag to completely disable watcher
- Fixed Tauri desktop app SSE connection timeout
- Desktop app now loads user shell environment variables
- Desktop app now shows retry attempts
- Desktop app now shows write tool output
- Fixed autocomplete file loading in the TUI
- Enabled shell alias expansion in the ! command
- Fixed GitHub install command for repos with dots in the name
- Fixed system prompt field usage from prompt input
- Fixed user invoked subtasks that were causing tool_use or missing thinking signatures

**Thank you to 8 community contributors:**
- @Brendonovich:
  - Keep release a draft until all builds are finished (#5632)
- @remorses:
  - fix: use system prompt field from prompt input (#5633)
- @connorads:
  - docs: add homebrew command for `opencode-desktop` (#5631)
- @jinzhongjia:
  - docs: Add new project entry for opencode.nvim frontend (#5626)
- @shekohex:
  - docs: fix typo in Google Antigravity github link (#5625)
- @Zeko369:
  - fix: enable shell alias expansion in ! command (#5621)
- @matrv:
  - feat: add experimental oxfmt formatter (#5620)
- @Eric-Guo:
  - feat(desktop): Loading more session number per project by button (#5616)

## v1.0.163 — 2025-12-16

- Fixed argument boundaries in run command
- Fixed TUI dialog select items taking up 2 lines when truncated
- Fixed debounce of LSP diagnostics to get complete results
- Fixed system prompt rejoining when experimental plugin hook triggers to preserve caching

**Thank you to 5 community contributors:**
- @duailibe:
  - make install script use tmp dir (#5601)
- @Tarquinen:
  - fix: rejoin system prompt if experimental plugin hook triggers to preserve caching (#5550)
- @Hona:
  - fix: debounce LSP diagnostics to get complete results (#5600)
- @Brendonovich:
  - tauri: macos-only app menu
  - tauri: explicitly kill sidecar before updater relaunch
- @simondmorias:
  - fix: preserve argument boundaries in run command (#4979)

## v1.0.162 — 2025-12-16

- No user-facing changes in this commit

## v1.0.161 — 2025-12-16

- Fixed LSP paths normalization on Windows (fixes Lua)
- Fixed missing LSP unable to unzip on Windows

**Thank you to 1 community contributor:**
- @Hona:
  - fix(win32): Missing LSP can now unzip on windows (#5594)
  - fix(win32): Normalise LSP paths on windows (fixes lua) (#5597)

## v1.0.160 — 2025-12-15

- Fixed ElixirLS extension Windows support by correcting filename from `language_server.bar` to `language_server.bat`
- Fixed LSP server lookups on Windows by using the correct path separator

**Thank you to 1 community contributor:**
- @Hona:
  - fix(win32): use path.delimiter for PATH separator in LSP server lookups (#5589)
  - fix(win32): correct ElixirLS extension typo (#5590)

## v1.0.158 — 2025-12-15

- Prioritize fuzzysort results that start with user input
- Fixed server response handling to prevent connection timeouts

**Thank you to 1 community contributor:**
- @justfortheloveof:
  - tweak: prioritize fuzzysort results that start with user input (#5571)

## v1.0.157 — 2025-12-15

- Core: Fix message caching for Anthropic models to improve response consistency

## v1.0.156 — 2025-12-15

- Fixed terminal in desktop
- Fixed share page
- Added F# language server support

**Thank you to 1 community contributor:**
- @nalin-singh:
  - feat: add F# language server support (#5549)

## v1.0.155 — 2025-12-15

- Added support for custom commands in the desktop application

## v1.0.154 — 2025-12-15

- Fixed error handling when empty image files are read with Anthropic provider
- Fixed input field visibility for transparent themes
- Fixed race condition in file editing by adding per-file locking
- Added dismiss button to Getting Started box
- Restored `experimental.chat.messages.transform` hook and added `experimental.chat.system.transform` hook
- Fixed unshare command not properly clearing share state
- Prompt is now auto-submitted when using the `--prompt` CLI flag
- Fixed `--continue` flag selecting the wrong session
- Added `experimental.continue_loop_on_deny` config option to allow agents to continue the loop when user denies actions

**Thank you to 8 community contributors:**
- @baaym:
  - feat: add experimental.continue_loop_on_deny config option (#4729)
- @Raviguntakala:
  - fix(tui): --continue selects wrong session (#5513)
  - fix(session): fix unshare command not clearing share state (#5523)
- @markjaquith:
  - feat(cli): auto-submit prompt when using --prompt flag (#4510)
- @Brendonovich:
  - tauri: rename sidecar to opencode-cli
  - tauri: use correct sidecar name
- @Tarquinen:
  - feat: restore experimental.chat.messages.transform and add experimental.chat.system.transform hooks (#5542)
- @spoons-and-mirrors:
  - fix(edit): add per-file lock to prevent read-before-write race (#4388)
- @nalin-singh:
  - fix: input lip visibility for transparent themes (#5544)
- @rwese:
  - Provider fix, anthropic Errorhandling if empty image file is read (#5521)
  - docs: Fix Wakatime repository link in ecosystem.mdx (#5552)

## v1.0.153 — 2025-12-14

- Fallback to provider default for temperature
- Fixed input borders not being drawn in transparent themes
- Added server_error, rate_limit, and no_kv_space retry logic to accommodate Foundry API issues
- Added Gleam LSP and formatter
- Added topK function to transform, with temperature defaults for GLM and Minimax
- Fixed TUI opening parent session instead of subagent on continue flag
- Limited LSP diagnostics to prevent context window waste
- Added ARM64 Docker image support
- Added Dockerfile language server
- Added TexLab language server and latexindent formatter
- Added support for GITHUB_TOKEN and skip OIDC in GitHub
- Added --session flag to attach command
- Muted project path in sidebar that precedes the final directory
- Muted the whole prompt area when leader key is active

**Thank you to 15 community contributors:**
- @charles-cooper:
  - fix: add --session flag to attach command (#5460)
- @elithrar:
  - github: support GITHUB_TOKEN + skip OIDC (#5459)
- @niklas-wortmann:
  - docs: JetBrains IDEs to ACP config docs page  (#5465)
  - docs: fix title for JetBrains ACP config file (#5479)
- @edlsh:
  - feat: add texlab language server and latexindent formatter (#5251)
  - feat: add dockerfile language server (#5252)
- @code-yeongyu:
  - docs: add oh-my-opencode to plugins list (#5481)
  - fix(ui): guard Node reference for SSR compatibility in isTriggerTitle (#5509)
- @felipe:
  - add ARM64 Docker image support (#5483)
- @remorses:
  - fix: limit LSP diagnostics to prevent context window waste (#5480)
- @ghoulr:
  - docs: Add opencode-websearch-cited to plugin list (#5501)
- @sachnun:
  - fix(tui): open parent session instead of subagent on continue flag (#5503)
- @Brendonovich:
  - tauri: bring back appimage
  - tauri: change mainBinaryName to just OpenCode
- @itzAymvn:
  - docs: Fix Wakatime link in ecosystem documentation (#5528)
- @LawEKS:
  - Add Gleam LSP and formatter (#5514)
- @shekohex:
  - docs: add `opencode-pty` and `opencode-google-antigravity-auth` plugins to the echosystem (#5530)
- @sellerscrisp:
  - feat: add server_error, rate_limit, and no_kv_space retry logic to accommodate Foundry API issues  (#5527)
- @nalin-singh:
  - fix: ensure input borders are drawn in transparent themes (#5524)

## v1.0.152 — 2025-12-12

- Improved shell handling on Windows with better detection of Git Bash and support for the `OPENCODE_GIT_BASH_PATH` environment variable
- Fixed app exit behavior so the app only exits when the prompt is empty; otherwise, the exit key will fall through to allow normal text input
- Improved shell fallback compatibility by removing the `-l` flag when executing commands in unknown shells

**Thank you to 1 community contributor:**
- @jdanbrown:
  - Shell: No -l in fallback, for max compatibility (#5452)

## v1.0.151 — 2025-12-12

- Fixed osascript for clipboard typo
- Fixed internal error on `/compact` command
- Made the logo on the home screen non-selectable
- Fixed debug LSP diagnostics command for certain LSPs
- Show indicator for in progress chats in the sessions list
- Restore input on timeline revert and show newest first
- Replay conversation history in session/load
- Removed cache mention from webfetch prompt
- Fixed fatal error UI readability in light mode
- Added foreground color to some TUI text elements for light mode visibility
- Fixed Windows LSP URIs using backslashes (Biome initialization failure)
- Better error message rendering in TUI
- Fixed bash tool to prevent excessive cd spam
- Added experimental `chat.messages.transform` hook

**Thank you to 11 community contributors:**
- @sachnun:
  - feat: add caching for opencode binary in GitHub Actions (#5384)
  - fix(server): make time field optional in session update validator (#5372)
  - fix(tui): restore input on timeline revert and show newest first (#5366)
- @jorgenwh:
  - add experimental.chat.messages.transform hook (#5207)
- @alopez-inf:
  - fix: Windows LSP URIs using backslashes (Biome initialization failure) (#5317)
- @koichincom:
  - fix: add fg color to some TUI text elements for light mode visibility (#5378)
  - fix(tui): ensure fatal error UI is readable in light mode (#5387)
- @airtonix:
  - docs: Add opencode-md-table-formatter and plugin template (#5405)
- @haoqixu:
  - acp: replay conversation history in session/load (#5385)
  - acp: fix internal error on `/compact` (#5424)
- @RhysSullivan:
  - [feat]: show indicator for in progress chats in the sessions list (#5417)
- @monostop:
  - fix: debug lsp diagnostics cmd for certain lsps (#5420)
- @Brendonovich:
  - tauri: initialise store and window-state plugins
  - tauri: create window with full screen size
  - tauri: add basic custom titlebar (#5438)
- @jeremyosih:
  - Change tooltip text from 'Open file' to 'New Terminal' (#5435)
- @Hona:
  - fix: osascript for clipboard typo (#5430)

## v1.0.150 — 2025-12-11

- Fixed CPU pinning to 100% when writing to stderr
- Added support for super modifier (Command/Windows key) in keybinds, allowing shortcuts like `super+z` for undo and `super+shift+z` for redo

**Thank you to 1 community contributor:**
- @shantur:
  - fix: Writing to Bun.stderr causes CPU pinning to 100%. (#5396)

## v1.0.149 — 2025-12-11

- Temporarily removed undo/redo keybinds

## v1.0.148 — 2025-12-11

- Fixed share image rendering

## v1.0.147 — 2025-12-11

- Allow custom keybindings for all textarea actions in the input area through config
- Align default input keybindings to improve consistency and add support for additional keyboard shortcuts (Ctrl+Right/Left for word navigation, Ctrl+D for character deletion, Alt+D for word deletion)
- Add ripgrep to the Docker image
- Improve GitHub reaction handling for issue comments to correctly identify and remove the OpenCode agent's "eyes" reaction
- Change terminal title to display "OpenCode" instead of "opencode"

**Thank you to 3 community contributors:**
- @Brendonovich:
  - write typescript artifacts to node_modules/.ts-dist
  - tauri: always build cli in predev
- @dbpolito:
  - Fix / Improve Github Eyes Reaction Removal (#5383)
- @gjedeer:
  - Add ripgrep to Docker image (#5379)

## v1.0.146 — 2025-12-11

- Git log output (e.g., `git log 1.0.145..HEAD`)
- Commit hashes and messages
- Commit details (hash, author, message, etc.)

## v1.0.145 — 2025-12-11

Downgraded bun

## v1.0.144 — 2025-12-11

- Fixed light mode visibility for filepath in /undo diff files
- Added Cerebras integration header with opencode identifier
- Improved compaction prompt
- More descriptive tool or subtask execution failed error messages
- Use |- for intermediate sub-agent steps
- Fixed custom provider lookup in 'Other' authentication flow
- Fixed CLI to obtain directory data from server
- Tauri app now automatically finds an available port instead of defaulting to 4096
- Added support for models.dev family
- Improved interleaved thinking functionality
- Set Gemini thinking level to high by default
- Upgraded OpenRouter SDK package
- Fixed /provider endpoint to return loaded providers
- Updated orange theme
- TUI now only shows active MCP server count
- Fixed doubled key events on some older terminal emulators
- Fixed add_buffer leaks for prompt input
- Removed input_forward_delete special handling
- Icon discovery feature is now enabled by default in the Tauri app

**Thank you to 19 community contributors:**
- @connorads:
  - docs: configure mise to use latest version instead of pinned version (#5316)
- @arc-source-coder:
  - tui: only show active MCP server count (#5327)
- @NoeFabris:
  - docs: Added opencode-antigravity-auth to ecosystem documentation (#5303)
- @elithrar:
  - themes: update orng theme (#5329)
- @angristan:
  - docs: add wakatime plugin to ecosystem page (#5326)
- @nick-vi:
  - docs: add opencode-type-inject to ecosystem plugins (#5331)
- @subtleGradient:
  - fix: upgrade OpenRouter sdk pkg (#5302)
- @dbpolito:
  - Add Eyes Reaction instead of Comment Working on Github Action (#5072)
- @igordertigor:
  - docs: document accept always behavior (#5340)
- @OpeOginni:
  - fix(cli): obtain directory data from server (#5320)
- @Yukaii:
  - fix(auth): add plugin lookup for custom provider in 'Other' flow (#5324)
- @H2Shami:
  - feat: add helicone docs + helicone session tracking (#5265)
- @paralin:
  - feat: use |- for intermediate sub-agent steps (#5336)
  - fix: more descriptive tool or subtask execution failed error (#5337)
- @shantur:
  - compaction: improve compaction prompt (#5348)
- @sebastiand-cerebras:
  - Add Cerebras integration header with opencode identifier (#5354)
- @zenyr:
  - docs(bash): clarify description parameter is required (#5353)
- @koichincom:
  - fix: light mode visibility for filepath in /undo diff files (#5352)
- @Brendonovich:
  - tauri: update icons
  - desktop: exclude ts-dist from tsconfig sources
- @AyushWalekar:
  - docs: update doc sdk.mdx (#5315)

## v1.0.143 — 2025-12-10

- Improve bash and grep tool documentation with clearer usage guidelines

## v1.0.142 — 2025-12-10

- Fixed exit command aliases ("exit", "quit", ":q") in the TUI prompt
- Fixed hook error suppression that was preventing errors from being properly reported
- Added Windows support for shell mode (! command) with support for cmd.exe and PowerShell
- Added CLI arguments to agent create command for scripting (--path, --description, --mode, --tools)

**Thank you to 3 community contributors:**
- @Timorleiderman:
  - feat: add CLI arguments to agent create command for scripting (#5157)
- @Brendonovich:
  - fix: use project references for desktop typecheck
  - tauri: comment out restart server dialog
  - tauri: update macos icon
  - tauri: don't ask to restart separately in updater
- @spoj:
  - fix: add Windows support for shell mode (! command) (#5311)

## v1.0.141 — 2025-12-10

- Added Biome LSP support
- Added ability to set colors for projects
- Added project names and icons
- Improved automatic project icon discovery from favicon/logo files
- Improved interleaved thinking support
- Fixed plugin caching when resolving 'latest' version to ensure subsequent starts use the cached version
- Fixed SVG file reading to allow reading SVG content as text
- Fixed visual spacing before the queued badge in the TUI
- Added OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS environment variable to configure bash command timeout
- Enabled project discovery for experimental builds

**Thank you to 3 community contributors:**
- @nick-vi:
  - fix: resolve 'latest' to actual version when caching plugins (#5292)
- @ry2009:
  - feat: add Biome LSP support (#5290)
- @hosenur:
  - docs: Add portal project to ecosystem documentation (#5300)

## v1.0.138 — 2025-12-09

- Added project update timestamps to track when projects were last modified
- Fixed custom headers being sent in MCP regardless of OAuth settings
- Added userId and sessionId metadata to experimental telemetry
- Added permission indicator to footer in TUI

**Thank you to 4 community contributors:**
- @terakael:
  - tui: add permission indicator to footer (#4813)
- @Brendonovich:
  - desktop: move updater logic to js
  - fix: use ts project references for desktop and tauri
- @Raviguntakala:
  - feat(telemetry): Add userId and sessionId metadata to experimental_telemetry (#5279)
- @edevil:
  - fix(mcp): send custom headers regardless of OAuth settings (#5273)

## v1.0.137 — 2025-12-09

- Added new "orng" theme
- Added catppuccin-macchiato theme
- Added mercury.com theme
- Added ability to toggle MCP servers in TUI
- Added bash-language-server LSP support
- Added terraform-ls language server and formatter
- Added OCaml LSP support
- Added ocamlformat support
- Added PDF support in read tool
- Added optional scrollbar to the session chat
- Added dynamic terminal window title
- Added uninstall command
- Added theme support for thinking text opacity
- Added experimental plugin hook for text completion
- Added OAuth authentication support for remote MCP servers
- Restored experimental flag for websearch/codesearch tools
- Fixed sidebar working directory colour contrast with modified files
- Fixed parcel watcher musl support
- Fixed provider filtering for /connect endpoint
- Fixed sorting of sessions by updated time
- Fixed colors for dialog prompt in light themes
- Fixed autocomplete text color with no matching items
- Fixed autocomplete popup repositioning on window resize
- Fixed SAP AI Core Vercel AI SDK v2 support
- Fixed themes sorted alphabetically in /theme modal
- Fixed toggle timestamps to properly hide/show timestamps when toggled
- Fixed opencode web command
- Fixed shell detection to support non-standard paths
- Fixed provider URL merging logic
- Fixed CLI help text wrapping
- Fixed sessions disappearing after git init
- Fixed timestamp toggle text to be dynamic in command list
- Fixed deprecated models from appearing in model picker
- Improved shift+space to insert as character again in opentui
- Improved diff color issues in light themes
- Added visual separator between username and timestamp for better readability
- Reduced overhead of task tool metadata
- Tweaked bash agent to have more awareness of current working directory and adjusted default timeout

**Thank you to 23 community contributors:**
- @franlol:
  - feat: add optional scrollbar to the session chat (#5116)
  - feat: add experimental.text.complete plugin hook (#4962)
- @dakdevs:
  - feat: add mercury.com theme (#5141)
- @crayment:
  - docs: update server API reference with complete endpoint list (#5136)
- @ben-vargas:
  - feat: restore experimental flag for websearch/codesearch tools (#5132)
- @ariane-emory:
  - fix: make timestamp toggle text dynamic in command list (resolves #5106) (#5108)
  - fix: toggle timestamps now properly hides/shows timestamps when toggled (resolves #5142) (#5145)
  - fix: Sort themes in the /theme modal alphabetically (resolves #5217) (#5219)
  - fix: sort sessions by updated time (resolves #5074) (#5080)
  - fix: improve sidebar working directory colour contrast with modified files (resolves #5184 (#5188)
- @IceWreck:
  - fix: update description to lowercase for ACP command (to be consistent with other commands) (#5137)
- @aryasaatvik:
  - feat(tui): add dynamic terminal window title (#5112)
- @Arindam200:
  - docs: Nebius Token Factory provider documentation (#2997)
- @nyxkrage:
  -  fix: update zed agent server linux url to tar.gz  (#5194)
- @mberrishdev:
  - fix: autocomplete popup repositions on window resize (#5196)
- @Brendonovich:
  - Desktop macOS codesigning and notarization (#5154)
  - Export DesktopInterface from desktop and add PlatformContext
- @ayatofrench:
  - fix: use basename for shell detection to support non-standard paths (#5205)
- @edlsh:
  - feat: add uninstall command (#5208)
  - feat: add theme support for thinking text opacity (#5240)
  - feat: add bash-language-server LSP (#5246)
  - feat: add terraform-ls language server and formatter (#5243)
- @edevil:
  - feat(mcp): add OAuth authentication support for remote MCP servers (#5014)
- @Patrick-Erichsen:
  - fix(cli): prevent help text wrapping (#5185)
- @ry2009:
  - fix: ensure Auth.all returns valid objs (#5128)
- @JUVOJustin:
  - docs: Update "model" inheritance for agents (#4894)
- @bishalr0y:
  - feat: add catppuccin-macchiato theme  (#5225)
- @jerome-benoit:
  - fix: SAP AI Core Vercel AI SDK v2 support (#5180)
- @dbpolito:
  - feat: ability to toggle MCP Servers in TUI (#4509)
- @nexxeln:
  - add ocamlformat support (#5229)
  - add ocaml lsp support (#5230)
- @Raviguntakala:
  - fix: apply provider filtering to /connect endpoint (#5233)
- @elithrar:
  - themes: add new orng theme (#5267)

## v1.0.134 — 2025-12-05

- Added max steps configuration for supervisor and sub-agents
- Added experimental OpenTelemetry config option to enable OTEL spans
- Fixed PTY session cloning on desktop reconnect
- Added Vercel theme
- Fixed ProviderInitError for GitHub Copilot Enterprise
- Fixed projects that transition from having no commits to having commits to properly migrate sessions
- Improved TUI dialog option descriptions with text wrapping
- Fixed VCS being set to git even if no commits exist in repository
- Increased default scroll speed
- Fixed SAP AI Core provider SDK initialization
- Restored terminal pane feature on desktop

**Thank you to 8 community contributors:**
- @jerome-benoit:
  - fix: add getModel to SAP AI Core provider for correct SDK initialization (#5086)
- @ry2009:
  - tui: wrap dialog option descriptions (#5083)
- @justmejulian:
  - fix: #5064 ProviderInitError github-copilot-enterprise (#5123)
- @anthonyshew:
  - feat(theme): Vercel (#5119)
- @noamzbr:
  - add experimental.open_telemetry config option to enable OTEL spans (#4978)
- @nwthomas:
  - feat: add max steps for supervisor and sub-agents (#4062)
- @shantur:
  - tweak: bash tool improve output metadata for agent consumption, fix small timeout issue (#5131)
- @Brendonovich:
  - OpenCode Desktop app (#5044)

## v1.0.133 — 2025-12-04

- f9dcd9793: Revert of terminal pane (skip - already reverted)
- d763c11a6: Terminal pane feature (skip - was reverted)
- b9c1f1001: SAP AI Core provider support ✓
- 7f86fe3f6: Optional prompt input to GitHub Action ✓
- a32cf70d7: Fix /new slash command being persisted ✓
- a607f3355: Improved bash tool messages ✓
- 350a32274: Fix model not being passed to tool ✓
- 27c99b46c: Preserve prompt input when creating new session ✓
- 1d6e3d477: Fix cursor color ✓
- 5a9f4e5c6: Fix checkUpgrade sets init ✓
- - Add SAP AI Core provider support
- Add optional prompt input to GitHub Action
- Fix /new slash command being persisted in prompt input
- Improve bash tool messages regarding timeouts and truncation for clarity
- Fix model not being passed correctly to tool
- Preserve prompt input when creating new session
- Fix TUI cursor color
- Fix checkUpgrade setting `init:` flag

**Thank you to 6 community contributors:**
- @code-yeongyu:
  - fix: ensure checkUpgrade sets `init:` (#5040)
- @DanielFGray:
  - Preserve prompt input when creating new session (#4993)
- @shantur:
  - tweak: bash tool messages regarding timeouts and truncation more clear for agent (#5066)
- @dbpolito:
  - add optional prompt Input to Github Action (#4828)
- @jerome-benoit:
  - feat: Add SAP AI Core provider support (#5023)
- @casonadams:
  - docs: add CodeCompanion.nvim integration instructions (#5079)

## v1.0.132 — 2025-12-04

- Fixed Anthropic API key error when using provider configuration

## v1.0.131 — 2025-12-04

- Fixed a TypeError that occurred when calculating token costs

## v1.0.130 — 2025-12-04

- Enhanced DeepSeek reasoning content handling
- Fixed provider ID issue
- Fixed compaction type issue
- Fixed DAX typo
- Added tool_details keybind with no default
- Added messages_last_user command to scroll TUI to last user message
- Fixed bunfs path on Windows
- Added experimental.primary_tools setting to allow users to set tools that should only be available to primary agents
- Added retry case for Grok resource exhausted

**Thank you to 5 community contributors:**
- @spoons-and-mirrors:
  - feat: experimental.primary_tools, allow user to set the tools that should only be available to primary agents (#4913)
- @Hona:
  - fix: bunfs path on windows (#5011)
- @ariane-emory:
  - feat: add messages_last_user command to scroll TUI to last user message (implements #4847) (#4855)
  - feat: add tool_details keybind w/ no default (#4976)
- @jackbisceglia:
  - docs: remove outdated theme section as system theme is now added back (#5041)
- @matjanos:
  - feat: Enhance DeepSeek reasoning content handling (#4975)

## v1.0.129 — 2025-12-03

- Fixed GitHub Copilot Enterprise authentication failing with sdk.chat undefined error
- Adjusted light/dark theme toggle
- Fixed Provider type in chat.params plugin hook
- Fixed handling of `0` in ANSI theme color definitions
- Bumped opentui to v0.1.55
- Added basic session list command
- Made homebrew update check use homebrew registry version info
- Fixed ability to unignore files in .ignore
- Tweaked message border to match color of agent it was sent to
- Increased default LSP server timeout
- Added toggle to hide username in TUI
- Added OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT environment variable

**Thank you to 4 community contributors:**
- @kandros:
  - toggle to hide username in TUI (#4750)
- @dl-alexandre:
  - fix: allow unignoring files in .ignore (#4814)
- @jason0x43:
  - fix: handle `0` in ANSI theme color definitions (#5009)
  - tweak: adjust light/dark theme toggle  (#5007)
- @ben-vargas:
  - fix: correct Provider type in chat.params plugin hook (#5003)

## v1.0.128 — 2025-12-02

- Fixed CLI to allow messages starting with a dash (-) when using the `run` command
- Hidden [REDACTED] chunks in reasoning display from OpenRouter
- Fixed handling of ANSI color indexes in theme resolution

**Thank you to 3 community contributors:**
- @dl-alexandre:
  - fix: handle ANSI color indexes in theme resolution (#4842)
- @iamdavidhill:
  - fix: website hero copy
  - Merge branch 'dev' of https://github.com/sst/opencode into dev
  - fix: add docs button
  - Merge branch 'dev' of https://github.com/sst/opencode into dev
- @ucirello:
  - fix(run): allow messages to start with dash (-) (#4904)

## v1.0.127 — 2025-12-02

- Added overridable review slash command
- Added ability to toggle tool details visibility
- Fixed TUI crash when no authenticated providers and default provider disabled
- Fixed authentication login to respect disabled/enabled providers configuration
- Fixed npm registry configuration not being respected during installation
- Fixed invalid schema cases for Gemini models
- Fixed Copilot responses bug with GPT 4o mini
- Fixed a case where OpenCode wasn't retrying on certain failures

**Thank you to 3 community contributors:**
- @stevoland:
  - fix(auth): Respect disabled/enabled providers config in auth login (#4940)
- @ariane-emory:
  - feat: toggle tool details visibility (resolves #4824) (#4882)
- @iamdavidhill:
  - fix: update the install copy

## v1.0.126 — 2025-12-01


**Thank you to 1 community contributor:**
- @blacksmith-sh[bot]:
  - .github/workflows: Migrate workflows to Blacksmith runners (#4941)

## v1.0.125 — 2025-12-01

- Close SSE stream when instance is disposed
- Do not conceal write tool output

## v1.0.124 — 2025-12-01

- Improved error messages from API providers by extracting detailed error information from response bodies
- Fixed compatibility issues with older Git versions by removing the `--path-format=absolute` flag
- Fixed header issue in Anthropic plugin

## v1.0.123 — 2025-12-01

- Bumped opentui to v0.1.54, removing the cc flicker feature and fixing diffs and input event handling
- Improved session compaction prompts to better preserve critical information for conversation continuity
- Enhanced plan mode prompt documentation with detailed workflow guidelines
- Added "Open docs" command to the command palette for quick access to documentation
- Fixed Codex integration with Copilot

**Thank you to 2 community contributors:**
- @JUVOJustin:
  - docs: Move tip to correct tool (#4891)
  - docs: explore subagent (#4893)
- @shantur:
  - tweak: compaction prompt (#4838)

## v1.0.122 — 2025-11-30

- Bump opentui to v0.1.53, fixing an event listener leak in the line number renderable (performance improvement)
- Tweak spinner to be background independent
- Clarify that the general agent can execute multiple parallel tasks

## v1.0.121 — 2025-11-29

- Fixed key repeat handling in the terminal UI by upgrading opentui to v0.1.52
- Added missing foreground color to permission keybind hints in the terminal UI
- Fixed a minor UI bug for transparent backgrounds
- Improved explore agent description to clarify tool availability

**Thank you to 2 community contributors:**
- @dkarter:
  - fix: minor ui bug for transparent backgrounds (#4886)
- @kavhnr:
  - fix(tui): add missing fg color to permission keybind hints (#4899)

## v1.0.120 — 2025-11-29

- Improved task display in session view to show tool names and completion status
- Added explore agent for fast codebase navigation
- Persist thinking blocks display to KV and indicate its current display state in the command list
- Added built-in Dart LSP server and formatter
- Improved provider dialog text clarity for better user guidance
- Fixed provider sorting to prioritize recommended options
- Removed cancel keybind hint from prompt dialog to simplify UI
- Hid favorite keybind in model dialog when disconnected to prevent errors

**Thank you to 7 community contributors:**
- @Alb-O:
  - nix: fix workflow failing on PRs (#4820)
- @Tarquinen:
  - fix: filter empty messages in toModelMessage (#4811)
- @mastermakrela:
  - core: add built-in Dart LSP server and formatter (#4841)
- @jaov:
  - tweak: gemini retry message to not be explicitly about gemini 3 (#4864)
- @singiamtel:
  - docs: formatter: false and lsp: false (#4833)
- @ariane-emory:
  -  feat: persist thinking blocks display to KV and indicate its current display state in the command_list (resolves #4582) (#4810)
- @JUVOJustin:
  - docs: Add tip to tools about subagents re todos (#4875)

## v1.0.119 — 2025-11-27

- Prevent codesearch and websearch tools from being accessible when webfetch permission is denied
- Prevent external diff tools from interfering with snapshot generation

## v1.0.118 — 2025-11-27

- Prevented footer from shrinking when terminal is resized
- Reverted TypeScript LSP to monorepo root

## v1.0.117 — 2025-11-27

- Rolled back TypeScript language server to the standard implementation
- Rolled back TypeScript language server to standard implementation

## v1.0.116 — 2025-11-27

- Temporarily restricted codesearch and websearch to OpenCode Zen users
- TUI design refinement
- Enabled parcel file watcher and expanded parcel ignore patterns for improved file watching
- Re-enabled virtual extmarks for file/agent mentions
- Fixed SVG paste bug
- Deduplicated file references in prompt

## v1.0.115 — 2025-11-26

- Fixed bootstrap errors display in TUI to show detailed error messages instead of empty objects
- Renamed `vcs.changed` to `vcs.branch.updated`
- Fixed MCP tool schemas to be compatible with Google Gemini
- Added favorites to model selector
- Fixed handling of remote image URLs in paste handler
- Added ability to react to PR Review Comments in GitHub workflows
- Added `diff_style` option to allow disabling columnar diffs
- Show current git branch in TUI
- Enabled exa code/websearch

## v1.0.114 — 2025-11-26

- Switched to vtsls for TypeScript language server support
- Fixed global prefix handling with AWS Bedrock

## v1.0.113 — 2025-11-26

- Fixed generation aborting in TUI when undo is pressed
- Added `setCacheKey` option for provider configuration
- Fixed prompt submit error when using `opencode -c`
- Switched TypeScript LSP to one per package to ensure it loads when TypeScript is not installed at root
- Better overloaded message

## v1.0.112 — 2025-11-25

- Retry anthropic overloaded errors for improved reliability
- Enhanced stats command to show average and median tokens per session
- Improved theme selector UX with current theme indicator and easier selection
- Better scroll speed default for Windows users
- Added prompt_async functionality to receive prompts and return immediately
- Refactored share system to separate session IDs from share IDs for better URL structure and security
- Fixed accordion styles for better visual appearance
- Fixed CSS code splitting issues for desktop application
- Fixed scroll gutter rendering issues
- Fixed markdown inline code styling
- Fixed share page style issues and metadata display
- Fixed plugin selection merging functionality
- Disabled virtual extmarks for file/agent mentions to improve performance
- Prevented auto-continuation when compaction was manually triggered
- Added social share images for better link previews
- Improved TUI compatibility with standard middle dot separators
- Prevented re-fetching of already synced sessions when switching sessions

## v1.0.111 — 2025-11-25

- Retry Anthropic overloaded errors
- Tweak stats command to show average & median tokens per session
- Theme selector UX improvements: current theme indicator and easier selection
- Fixed missing compacted event
- Fixed auto-continue when compaction was manual
- Disabled virtual extmarks for file/agent mentions
- Alphabetical ordering for opencode models output
- Fixed merge plugin selections
- Better scroll speed default for Windows
- Added prompt_async to receive prompt and return immediately
- Reverted basic auth support in opencode SDK
- Reverted setCacheKey in provider options
- Added setCacheKey in provider options
- Refactored share system to separate session IDs from share IDs
- Aligned session panel content with consistent left padding

## v1.0.110 — 2025-11-25

- TUI: Use standard middle dot separator for better terminal compatibility
- TUI: Fixed spacing issues
- TUI: Prevent re-fetching already synced sessions when switching sessions
- Bumped opentui to v0.1.50
- Added basic auth support to opencode SDK

## v1.0.109 — 2025-11-24

- Removed hardcoded OpenRouter provider configuration
- Added `--refresh` flag to models command for refreshing model list
- Adjusted bundled provider logic and fixed tree shaking issues
- Updated share functionality styling and UI improvements
- Added autoupdate notification feature
- Fixed textarea highlight cursor color in TUI

## v1.0.108 — 2025-11-24

- Non-corpo loading spinner
- TUI: Fixed null check for user.time in duration calculation
- Display MCPs in alphabetic order in the sidebar
- Persist light vs dark mode
- Modified files sidebar

## v1.0.107 — 2025-11-24

- Added better error message for GitHub Copilot when models are not supported, including a link to enable models in Copilot settings
- Fixed a fatal error where 'color.buffer' was undefined in the TUI
- Added explicit fallback model handling and prevented direct opencode provider calls when unavailable
- Improved title generation with better guidelines for creating meaningful conversation titles

## v1.0.106 — 2025-11-23

- Added optional selectedListItemText element in themes with luminance-based fallback to solve issue #4369
- Fixed TUI session text to respect theme foreground colors
- Fixed bash tool compatibility with WSL
- Fixed boolean handling in session prompts
- Prevented permission shortcuts from triggering when Ctrl/Meta keys are pressed
- Bundled AI SDK packages for improved performance
- Updated opentui to v0.1.49 with fixes for stdin handling and textarea cursor movement

## v1.0.105 — 2025-11-22

- Prevented concurrent Bun package installs that could cause corruption or conflicts
- Fixed message completion timing and duration display in session view
- Fixed auto upgrade toast message

## v1.0.104 — 2025-11-22

- Added Ctrl-Z terminal suspension support to TUI
- Fixed image attachments handling in session prompts

## v1.0.103 — 2025-11-22

- Removed bullet prefix from timestamps in session view for cleaner display

## v1.0.102 — 2025-11-22

- Fixed flickering issues in the TUI
- Fixed a bug where the assistant footer would crash after compaction

## v1.0.101 — 2025-11-22

- Fixed a bug where the TUI would crash when displaying assistant message footers after compaction

## v1.0.100 — 2025-11-22

- Improved model footer display with duration timing and visual enhancements
- Added toggle for showing/hiding timestamps in the TUI
- Enhanced message timestamps to show date when not on current day
- Added end time display for agent loops
- Updated title generation prompt to prevent "summarizing" responses

## v1.0.99 — 2025-11-22

- Summary optimizations for improved performance
- Migrated to devinxi-ed Solid Start framework

## v1.0.98 — 2025-11-22

- Fixed flickering and layout shift issues during work sessions in the TUI

## v1.0.97 — 2025-11-22

- Added missing system libraries to Docker image so the agent starts successfully

## v1.0.96 — 2025-11-22

- Fixed dockerfile installation path to use `/usr/local/bin` instead of current directory

## v1.0.95 — 2025-11-22

- **CI: ignore** - This appears to be a CI-related change with no user-facing impact

## v1.0.93 — 2025-11-22

./packages/opencode/dist/opencode-darwin-arm64.zip

## v1.0.92 — 2025-11-22

- Publish tar.gz for Linux

## v1.0.91 — 2025-11-22

- Fixed argument parsing issue
- Added enterprise package with session sharing capabilities
- Introduced new enterprise web interface for sharing sessions
- Added file icon assets moved from desktop to UI package
- Enhanced session management and sharing functionality
- Improved desktop application structure and components

## v1.0.90 — 2025-11-22

- Lowered opacity for thinking summaries to improve readability
- Split revert memo into smaller tracked computations to prevent unnecessary re-evaluations and improve performance
- Batched SDK events to reduce render churn and improve TUI responsiveness
- Disabled automatic config loading during CLI builds to prevent configuration interference

## v1.0.89 — 2025-11-22

./packages/opencode/dist/opencode-windows-x64.zip

## v1.0.88 — 2025-11-21

- Tweaked bash tool behavior to better support SHELL var

## v1.0.87 — 2025-11-21

- Fixed bash tool to respect the $SHELL environment variable
- Improved handling of unknown finish reasons in agent responses

## v1.0.86 — 2025-11-21

- Added provider whitelist/blacklist configuration options to control which providers are available
- Fixed agent context preservation during compaction to maintain conversation continuity
- Improved CLI error handling to ensure clean exit on provider/model errors
- Enhanced install script with better visuals, custom progress bar, and next steps guidance
- Updated logic for local and dev providers

## v1.0.85 — 2025-11-21

- Hidden GPT-5 Nano model from the model selection dialog

## v1.0.84 — 2025-11-21

- Replaced text shimmer with animated progress bar during model processing in TUI
- Simplified popular providers list to show only top 6 providers
- Added TUI onboarding flow
- Adjusted invalid directory error message
- Fixed "split is not a function" error
- Added field to allow user-only messages

## v1.0.83 — 2025-11-21

- Fixed a bug where the TUI would crash with an undefined error when no session was available

## v1.0.82 — 2025-11-20

- Fixed OpenRouter AI SDK package usage to resolve issues with interleaved thinking models
- Added automatic navigation to child sessions when they are requesting permissions
- Changed default child session cycle keybinds from `ctrl+right/left` to `<leader>right/left`
- Updated editor preference to use VISUAL environment variable over EDITOR per Unix convention

## v1.0.81 — 2025-11-20

- Made the MAX_OUTPUT_LENGTH in bash.ts overridable by OPENCODE_EXPERIMENTAL_BASH_MAX_OUTPUT_LENGTH
- Fixed autocomplete with existing space after trigger
- Replaced ruby-lsp with rubocop for better LSP performance
- Fixed issue where AI SDK warnings were being printed
- Added ability for users to name export files
- Fixed toast wrapping issue
- Made /export command go to current working directory

## v1.0.80 — 2025-11-20

- No user-facing changes in this commit

## v1.0.79 — 2025-11-20

- Added PHP Intelephense LSP support
- Added YAML language server support
- Made AUR build check for glibc vs musl system compatibility
- Disabled fetch timeout by default in provider options
- Fixed OpenRouter AI SDK package support
- Added bun install retries for better reliability
- Fixed external directory permission wildcarding to be more sane
- Made bash tool use external directory permissions
- Added ability to show reasoning summaries for Gemini models
- Fixed issue 4475
- Added subagents to agents modal (non-selectable)
- Allowed task tool to have resume capabilities
- Added top-level `lsp: false` and `formatter: false` options to disable all formatters or LSPs at once

## v1.0.78 — 2025-11-18

- Fixed image support check by passing model info to ReadTool
- Fixed permission checks for external_directory and doom_loop

## v1.0.77 — 2025-11-18

- Improved Gemini retry error messages to be more user-friendly and concise
- Fixed theme reference resolution to allow referencing colors from theme definitions
- Updated reasoning effort logic for GPT-5.1 models to use "low" instead of "minimal"

## v1.0.76 — 2025-11-18

- Added `opencode agent list` command to show all available agents with details
- Fixed Windows bash tool issue
- Fixed desktop reactivity issue on route change
- Fixed desktop response animation to only animate once

## v1.0.75 — 2025-11-18

- Fixed GPT compaction issue
- Changed Gemini 3 Pro to use temperature 1
- Fixed CSS typo in desktop application
- Fixed busy state and reactivity issues in desktop application

## v1.0.74 — 2025-11-18

- Fixed model dialog sorting
- Work in progress on new desktop layout

## v1.0.73 — 2025-11-18

- Reworked default model
- Added Nix support for installation and package management
- Added width constraints to toast component for proper text wrapping
- Added Swift syntax highlighting support
- Reverted scroll_speed to allow only positive integers (reverting previous change that allowed any positive number)

## v1.0.72 — 2025-11-18

- Fixed a bug where the `noReply` option was not properly handled in session prompts, causing unnecessary replies when users expected no response

## v1.0.71 — 2025-11-18

- Respect server suggestion for default model

## v1.0.70 — 2025-11-17

- Upgraded opentui to v0.1.46, enabling bracketed paste on Windows, fixing word wrapping with CJK characters, and allowing scroll speed configuration
- Fixed the `/exit` command functionality
- Reverted system theme background changes that affected terminal transparency

## v1.0.69 — 2025-11-17

- Added `/thinking` slash command to toggle thinking blocks visibility in OpenTUI
- Fixed system theme background to use 'none' for terminal transparency
- Updated help dialog to use dynamic keybind
- Fixed line count display on Windows
- Fixed Git Bash path mapping on Windows
- Added support for Azure Cognitive Services provider
- Fixed OPENCODE_CONFIG_DIR to properly load config files
- Bumped OpenTUI version to 0.1.45, fixing highlighting on Windows
- Added copy option to message context menu
- Improved retry display and handling for retry-after values exceeding 10 minutes
- Enhanced batch processing with per-tool UI feedback and UX improvements

## v1.0.68 — 2025-11-16

fix: promptCacheKey issue with certain providers

## v1.0.67 — 2025-11-16

- Fixed a panic when theme has 'none'

## v1.0.66 — 2025-11-16

- Fixed history JSONL file corruption cases
- Added Zenmux documentation and header
- Added Flexoki theme
- Fixed diff view to ignore line ending changes and Windows autocrlf
- Fixed snapshot history when running from git worktrees
- Added experimental batch tool
- Improved dropdown to only show for 3+ items
- Fixed union type with enum "true"/"false" in /find/file endpoint
- Fixed incorrect Sonnet price calculation
- Added support for local file paths for custom providers
- Added support for images in MCP tool responses
- Added global.event.subscribe() to SDK
- Added GPT-5-nano model
- Improved read tool end-of-file detection to prevent infinite loops

## v1.0.65 — 2025-11-14

- Handle config errors gracefully
- Fix max tokens when using models like opus with providers other than anthropic

## v1.0.64 — 2025-11-13

- Fixed TypeError case in formatting functionality
- Fixed opencode run timeout issues
- Fixed unreadable text in light mode for TUI interface

## v1.0.63 — 2025-11-13

- Fixed Windows installation issues for bun and pnpm global installs
- Added scroll acceleration support to the TUI (Terminal User Interface)
- Enabled Windows builds and resolved installation failures on Windows

## v1.0.62 — 2025-11-13

- Fixed tool calling on Windows
- Fixed GitHub action dirty check
- Added expandable sections for sidebar
- Fixed paste images in WSL using Ctrl+V
- Fixed usage & billing for custom model aliases and cached/reasoning tokens
- Fixed custom model name merging
- Fixed correct cache cost for OpenRouter and other OpenAI-compatible providers
- Upgraded opentui to 0.1.42, fixing some CJK/grapheme issues with prompt extmarks and char corruption
- Fixed clangd hanging

## v1.0.61 — 2025-11-12

- Added double-esc interrupt mechanism for long-running operations
- Added SourceKit LSP support
- Fixed autocomplete display to prevent long file paths from breaking layout

## v1.0.60 — 2025-11-12

- Added support for loading custom themes from .opencode/themes directory

## v1.0.59 — 2025-11-12

- Better errors on initial TUI boot
- Fixed @file references in slash commands with subagents
- Fixed config ordering
- Fixed revert dialog to move prompt to input box
- Added agent color configuration
- Upgraded OpenTUI to 0.1.41 with improved terminal support and performance enhancements
- Fixed costs being 0 when using custom model ID overrides
- Hide /share command when disabled
- Added test to verify OpenCode doesn't crash in git repositories with no commit history
- Restored full text when editing prompts with summarized content

## v1.0.58 — 2025-11-11

- Fixed crash when starting in repositories without any commits yet
- Increased review pane width in desktop interface
- Removed unused experimental flags for turn summary and no-bootstrap

## v1.0.57 — 2025-11-11

- Fixed TUI spawn to reset BUN_OPTIONS (#3606)
- Updated keymap.json bindings for OpenCode command (#4192)
- Fixed desktop prompt clearing inconsistencies
- Fixed desktop code/diff number container width display
- Fixed desktop session show more button being hidden on new sessions
- Fixed desktop prompt input not clearing and attachment issues
- Fixed desktop color grouping functionality
- Added web and codesearch tools
- Updated @opentui/core to v0.1.39 with build script fixes
- Keep session dot visible in list for currently active session (#4185)
- Cache project ID in root git folder for better performance
- Added help for users reading thinking blocks and improved todo sync trust
- Fixed Google Vertex configurations (#4169)
- Upgraded toast notification system (#4159)
- Updated code editor dark mode

## v1.0.56 — 2025-11-11

- Added inline LSP diagnostics in TUI file viewer to show type errors and compilation issues without leaving the interface
- Fixed TUI spawn to reset BUN_OPTIONS environment variable
- Updated TUI to use @opentui/core v0.1.39 with improved build script
- Enhanced session selection UI to keep current active session visible in the list
- Added support for reading thinking blocks and improved todo synchronization
- Added web search and code search tools for enhanced functionality
- Fixed Google Vertex AI provider configuration issues
- Upgraded toast notification system for better user feedback

## v1.0.55 — 2025-11-10

- Fixed a bug where the TUI would crash when model cost information was missing

## v1.0.54 — 2025-11-10

- TUI: Auto-scroll to bottom when switching between sessions

## v1.0.53 — 2025-11-10

- Made reasoning parts less ugly with improved syntax highlighting
- Fixed --model flag being ignored in TUI mode
- Added ability to configure doom loop & external directory permissions
- Added input context to chat.params and chat.message
- Fixed UI freezing when repository contains binary files
- Fixed continue session navigation to use most recent session instead of oldest session
- Fixed MATLAB Language Server compatibility issues
- Fixed theme palette filtering to remove null values
- Added 'Free' badge display for zero-cost models in model selection dialog
- Fixed billing button functionality
- Added logging when creating project instances to help debug startup issues

## v1.0.52 — 2025-11-10

- Improved session UI with better sidebar toggle and message handling
- Render reasoning parts with syntax highlighting instead of plain text
- Display 'Free' badge for zero-cost models in model selection dialog
- Fixed --model flag being ignored in TUI mode
- Allow user to configure doom loop & external dir permissions
- Set cap for max time to wait between retries
- Fixed messageID type in chat.message

## v1.0.51 — 2025-11-09

- Fixed a race condition in the TUI context synchronization that could cause the interface to load improperly

## v1.0.50 — 2025-11-09

- Reverted the display of 'Free' badge for zero-cost models in model selection dialog
- Added input context to chat.params and chat.message plugin hooks (sessionID, agent, model, messageID)
- Fixed UI freezing for several minutes when repository contains binary files

## v1.0.49 — 2025-11-09

- Fixed continue session navigation to wait for sync completion before redirecting
- Added logging when creating project instances to help users debug startup issues

## v1.0.48 — 2025-11-09

- TUI: Add logging when creating project instances to help users debug startup issues

## v1.0.47 — 2025-11-09

- Fixed continue session navigation to use most recent session instead of oldest session
- Improved startup speed
- Fixed LSP optional requests to avoid MethodNotFound (-32601) with MATLAB Language Server
- Fixed theme palette to filter out null values

## v1.0.46 — 2025-11-08

- Display 'Free' badge for zero-cost models in model selection dialog
- Added rate limiting to zen functionality

## v1.0.45 — 2025-11-08

- Refined polaris instructions for practical behavior
- Routed polaris-alpha models to polaris system prompt
- Fixed title generation refusal responses
- Added support for reading opencode.json(c) from .opencode/ directory
- Upgraded to opentui 0.1.39 with support for shift/ctrl+return/esc custom CSI in ghostty

## v1.0.44 — 2025-11-07

- Show more sessions in TUI list and fix sync timing to prevent race conditions

## v1.0.43 — 2025-11-07

- Fixed disappearing content and sticky scroll issues in the TUI
- Reworked ACP (Agent Communication Protocol) to support changes in Zed IDE
- Added command bar action to rename sessions
- Fixed scroll behavior when no session exists

## v1.0.41 — 2025-11-07

- Allow not specifying a limit on messages endpoint

## v1.0.40 — 2025-11-07

- Disabled scrollbar temporarily because of text wrap issues
- Added VS Code Insiders support
- Improved message storage performance
- Implemented network IP retrieval for remote access in web command
- Fixed ACP to respect user's default model config
- Resolved Mistral API compatibility issues

## v1.0.39 — 2025-11-07

- Fixed issue with input randomly breaking in TUI
- Improved codex provider transformation handling

## v1.0.38 — 2025-11-07

- Fixed issue with input randomly breaking in the TUI
- Improved Codex model configuration by removing text verbosity settings and adding store flag support

## v1.0.37 — 2025-11-06

- Added system theme support
- Fixed Mistral API compatibility issues
- Fixed auto-scroll to bottom when selecting session from list
- Added desktop review flow
- Fixed diff highlight rendering in desktop app

## v1.0.36 — 2025-11-06

- Only display last 100 messages in TUI
- Fixed opencode run not parsing model string
- Updated import command to accept share links
- Fixed undo command breaking other commands
- Added big dot (●) indicator for current session in modal

## v1.0.35 — 2025-11-06

- Fixed homebrew upgrade process by ensuring environment variables are properly passed through during installation

## v1.0.34 — 2025-11-06

- TUI: Reduced scrollbar visual prominence for less distracting interface
- TUI: Enabled scrollbar

## v1.0.33 — 2025-11-06

- Moved debug shortcuts (toggle debug panel and toggle console) from hidden keyboard shortcuts to the command palette for better discoverability
- Upgraded to opentui v0.1.36 (dependency update)

## v1.0.32 — 2025-11-06

- Temporarily use strip-ansi package to fix ANSI character display in TUI output until bun bug is resolved

## v1.0.31 — 2025-11-06

- Upgraded to opentui 0.1.35, mitigating disappearing content and crashes
- Fixed export command output to allow piping without UI interference

## v1.0.30 — 2025-11-05

- Added opencode import command to restore sessions from JSON exports
- Temporarily removed bun strip ansi due to bug
- Desktop app now incrementally loads sessions in the side navigation

## v1.0.29 — 2025-11-05

- Ask instead of throwing tool error if file is outside cwd
- Fixed max height on message diffs and session stats in desktop app
- Fixed sidebar modified files display

## v1.0.28 — 2025-11-05

- Updated authentication method for ACP (Agent Communication Protocol)
- Default ACP configuration now uses "big-pickle" model from opencode provider

## v1.0.27 — 2025-11-05

- Fixed autocomplete to prioritize exact matches by trimming display names for better fuzzy matching
- Added file count to session summary, showing the number of files changed in addition to additions and deletions
- Improved error handling in session view with user-friendly toast notifications when sessions are not found
- Fixed local development URL configuration in desktop application

## v1.0.26 — 2025-11-05

- Restructured Sidebar component to be scrollable
- Lowered paste summary threshold to trigger on shorter content
- Added --attach flag to opencode run
- Fixed eu-west-2 AWS Bedrock issue
- Normalized escape keybind

## v1.0.25 — 2025-11-05

- Fixed slash command bug in ACP package
- Allow @ agents to work even if not first thing in prompt
- Added /export and /copy commands to TUI
- Added Clojure syntax highlighting support
- Fixed command validation to prevent invalid commands from being executed
- Added support for R formatter in formatters

## v1.0.24 — 2025-11-05

- Fixed session abort when autocomplete is visible in TUI
- Fixed image reading error and added error toast for event bus
- Added command bar option to interrupt session
- Fixed permissions not responding to ESC key
- Added support for `uv format` in formatters
- Added GitHub Enterprise support for Copilot

## v1.0.23 — 2025-11-04

- Added readline-style autocomplete keybinds to TUI
- Fixed autocomplete showing when user types a space
- Added ability to interrupt running sessions from command palette

## v1.0.22 — 2025-11-04

- Fixed session performance issue from large diffs by storing diff data separately and only showing summary statistics (additions/deletions) in session summaries

## v1.0.21 — 2025-11-04

- Fixed worker path resolution in dev mode (#3778)
- Added support for scoped npm plugins (#3785)
- Fixed the /undo command functionality
- Made /mcp an alias for /status command (#3894)
- Fixed refocus prompt after session delete (#3882)
- Corrected history_next keybinding description (#3891)
- Added respect for disable_paste_summary setting
- Updated brew handling for installation
- Reverted opentui upgrade that was causing disappearing content issues (#3776, #3697)

## v1.0.20 — 2025-11-04

- Fixed tool permission lookup to use correct session ID in TUI
- Fixed persistence of -m model when switching agents
- Fixed piping functionality
- Fixed parsePatch error handling in TUI to prevent crashes
- Fixed file tagging in multi-line inputs
- Added OPENCODE & AGENT environment variables
- Fixed TUI history navigation to respect custom keybindings

## v1.0.19 — 2025-11-04

- Fixed model selection for models with nested paths in TUI
- Added stats command to display usage statistics
- Fixed display of modified keybinds in command list
- Updated logo
- Removed duplicate copy message command entry in TUI

## v1.0.18 — 2025-11-03

- Added copy last assistant message to session menu
- Fixed directories query parameter handling
- Removed /share hint when sharing is disabled
- Fixed session rename functionality
- Improved MCP sanitization
- Added support for Ctrl+_ key combination in keybind parser

## v1.0.17 — 2025-11-03

- Added new `web` command that starts a headless opencode server and opens the web interface
- Fixed MCP error handling issue (#3847)
- Fixed stdout flushing issue in generate command

## v1.0.16 — 2025-11-03

- Added optional `dirs` parameter to file search API
- Fixed incorrect keybind display in session delete confirmation message
- Fixed clipboard image encoding and binary handling issues
- Enhanced task display to show subagent type information
- Fixed TypeError when error handling encounters non-object errors

## v1.0.15 — 2025-11-03

- Fixed focus management and dialog interactions in the TUI
- Fixed file path handling when pasting images with spaces in filename
- Added /timeline command to quickly navigate to specific messages in session history
- Moved dialog select keybind to input for better user experience
- Upgraded to Bun 1.3.1 for improved performance and stability

## v1.0.13 — 2025-11-02

- Added back child session cycle functionality
- Fixed file path handling when pasting images with spaces in filename
- Added /timeline command to quickly navigate to specific messages in session history

## v1.0.12 — 2025-11-02

- Fixed duplicate plugin subscriptions
- Fixed typos in documentation and code comments
- Added nightowl theme back after opentui release

## v1.0.11 — 2025-11-02

- Fixed dialog functionality
- Prevented default Enter key behavior when selecting dialog options to avoid conflicts
- Upgraded to opentui 0.1.32, activating kitty keyboard

## v1.0.10 — 2025-11-01

- Added light mode support to the TUI interface
- Updated keybinds documentation with current defaults and removed deprecated bindings

## v1.0.9 — 2025-11-01

- Added `/exit` command to TUI with aliases `/quit` and `/q` to exit the application
- Added command aliases for existing TUI commands: `/summarize` for `/compact`, `/clear` for `/new`, and `/resume`/`/continue` for `/session`
- Enhanced autocomplete functionality to support command aliases in the TUI

## v1.0.8 — 2025-11-01

- Changed delete keybind to Ctrl+D in session list dialog
- Fixed modified files being empty
- Added ability to remember sidebar position
- Added `--prompt` option to TUI
- Added formatter status display to TUI status dialog
- Ensured wl-copy is available
- Fixed TUI clipboard copy errors handling
- Added toast notification for /share URL copy
- Made /init a default slash command on server side
- Fixed /editor command in TUI

## v1.0.7 — 2025-11-01

- Tab to accept autocomplete in TUI
- Fixed prompt text aggregation to exclude synthetic content

## v1.0.6 — 2025-10-31

- Prevented clipboard operations from throwing errors on process exit

## v1.0.5 — 2025-10-31

- Added keyboard shortcuts to cycle through recently used models (F2 to cycle forward, Shift+F2 to cycle backward)
- Improved keyboard navigation and MCP server status display

## v1.0.4 — 2025-10-31

- Revert "opentui: fix: Make worker.ts path independent from cwd (#3600)"

## v1.0.3 — 2025-10-31

- Added session rename functionality with `/rename` command
- Fixed worker.ts path dependency on current working directory
- Fixed grep failing when pattern started with a dash
- Simplified theme selection API by renaming `setSelectedTheme` to `set`
- Added theme support in config
- Removed conflicting "-h" aliases in TUI spawn and thread commands
- Fixed unsupported option error
- Added `/editor` command to autocomplete for opening external editor
- Added `/theme` command
- Reverted flags & docs matching fix
- Allowed Ctrl+D to exit the app
- Improved error boundary with button to easily create GitHub issue

## v1.0.2 — 2025-10-31

- Added tab key support for selecting autocomplete options in the TUI
- Improved autocomplete component styling with better text wrapping and layout
- Removed debug console.log statement from theme context

## v1.0.1 — 2025-10-31

- Added persistent key-value storage for user preferences in TUI
- Added `/session` command to list available sessions in TUI

## v1.0.0 — 2025-10-31

OpenCode 1.0 is a complete rewrite of the TUI.

We moved from the go+bubbletea based TUI which had performance and capability issues to an in-house framework (OpenTUI) written in zig+solidjs.

The new TUI works like the old one since it connects to the same opencode server.

---

## Upgrading

You should not be autoupgraded to 1.0 if you are currently using a previous
version. However some older versions of OpenCode always grab latest.


To upgrade manually, run
```bash
$ opencode upgrade 1.0.0
```

To downgrade back to 0.x, run
```bash
$ opencode upgrade 0.15.31
```

---

## UX changes

The session history is more compressed, only showing full details of the edit and bash tool.

We added a command bar which almost everything flows through. Press ctrl+p to bring it up in any context and see everything you can do.

Added a session sidebar (can be toggled) with useful information.

We removed some functionality that we weren't sure anyone actually used. If something important is missing please open an issue and we'll add it back quickly.

---

## Breaking changes

### Theme

The `system` theme has not yet been ported and custom themes aren't loaded yet but both of these will be fixed this week.

### Keybinds renamed

- messages_revert -> messages_undo
- switch_agent -> agent_cycle
- switch_agent_reverse -> agent_cycle_reverse
- switch_mode -> agent_cycle
- switch_mode_reverse -> agent_cycle_reverse

### Keybinds removed

- messages_layout_toggle
- messages_next
- messages_previous
- file_diff_toggle
- file_search
- file_close
- file_list
- app_help
- project_init
- tool_details
- thinking_blocks


## v0.15.31 — 2025-10-31

- Fixed crash caused by missing @opencode-ai/plugin dependency
- Filtered out deprecated models from model selection
- Normalized Unix-like identifiers to support Git Bash for Windows

## v0.15.30 — 2025-10-31

- Fixed bash permission handling for more accurate command pattern matching
- Fixed application hanging after exit, improving shutdown reliability
- Added optional headers field to model configuration for enhanced API customization
- Fixed hanging permission prompts in headless mode, enabling better automation support
- Improved Deno LSP server detection and configuration for better TypeScript/JavaScript support
- Enhanced frontmatter error messages for clearer configuration file troubleshooting

## v0.15.29 — 2025-10-30

- Added optional timeout field to MCP config to allow users to use slow responding servers
- Added doom loop detection
- Added positional argument support to slash commands

## v0.15.28 — 2025-10-29

- Fixed parcel watcher issue by adding missing platform-specific watcher dependencies for Darwin (macOS) and Linux systems

## v0.15.27 — 2025-10-29

- Only generate user message summary if no diffs are present, improving performance and reducing unnecessary AI calls
- Enhanced desktop message component to support both user and assistant messages with improved UI rendering
- Added user message display in session history with text truncation for better readability
- Improved message part visibility controls with `hideDetails` prop replacing `readonly` for better UI state management

## v0.15.26 — 2025-10-29

- Added enterprise page with contact form for organizations to request enterprise solutions
- Added enterprise FAQ section covering data ownership, SSO integration, and self-hosting options
- Added testimonial section to enterprise page with customer quote
- Fixed form submission functionality for enterprise inquiries
- Added enterprise navigation link to header menu

## v0.15.24 — 2025-10-29

- Added OpenAPI annotations to tui.ts control endpoints
- Session diff now only includes modified files
- Fixed models endpoint to be OpenAI compatible

## v0.15.23 — 2025-10-29

- Fixed timeout parameter validation in bash tool to ensure positive values
- Fixed MCP status() function to not overwrite connected state with failed state
- Improved output handling by using process.stdout.write instead of console.log for better CLI experience
- Added --title flag to opencode run command for custom session titles
- Fixed additions and deletions counting in edit tool filediff for more accurate change tracking
- Added OPENCODE_CONFIG_DIR environment variable to allow loading custom config directories

## v0.15.20 — 2025-10-28

- Fixed blank version issue in the Go SDK

## v0.15.19 — 2025-10-28

- Added OPENCODE_FAKE_VCS flag for VCS testing and updated todo tracking instructions
- Removed temperature setting for Claude models
- Added MCP server support, file diffs, and default slash commands (/init, /compact) in ACP
- Fixed LiteLLM error where tool parameter must be specified
- Removed reasoning effort setting to 'medium' for gpt-5-pro model
- Added session.started event that triggers when a new session is created
- Fixed build script to work cross-platform
- Removed claude-haiku-4.5 from default priority for GitHub Copilot session title generation

## v0.15.18 — 2025-10-26

- Fixed $ invocation not being quiet in LSP server
- Added noReply parameter to control response behavior
- Fixed timeout parameter to allow users to disable provider timeout
- Made title generation more reliable
- Updated Anthropic prompt

## v0.15.17 — 2025-10-25

- ACP: Added slash commands, agents, permissions, and @ references support
- Fixed bedrock reasoning functionality
- Made plan agent whitelist more conservative
- Added Lua LSP support
- Fixed autoupdate settings to respect local configuration
- Adjusted edit tool multiple matches error wording for better clarity

## v0.15.16 — 2025-10-24

- Fixed GPT-5 Codex models to not have reasoning effort set, while maintaining medium reasoning effort for other GPT-5 models
- Changed reasoning summary from "detailed" to "auto" for opencode provider with GPT-5 models

## v0.15.15 — 2025-10-24

- Fixed Opencode failing with ENOENT posix_spawn '/usr/bin/rg' error
- Added flag wildcard parsing support for bash tool
- Fixed `zod-to-json-schema` dependency placement
- Fixed `tool.execute.after` hook to properly modify MCP tool output

## v0.15.14 — 2025-10-23

- Added model management to ACP sessions, allowing users to manage models within agent sessions
- Adjusted retry logic so we can surface retries to end user (not surfaced yet)
- Added experimental turn summarization to compact conversation history, helping manage long conversations
- Added parent ID tracking to assistant messages for better conversation context
- Added Amazon Nova models to the us-* prefix requirement list for proper model routing
- Fixed opencode run command to not print to stderr, improving output handling
- Improved editor detection with auto-discovery and better error messages
- Added option to allow agent switches without changing the model

## v0.15.13 — 2025-10-21

- Fixed sourcemapping so errors show proper stack trace
- Refactored ACP (Agent Client Protocol) server command argument handling

## v0.15.12 — 2025-10-21

- Fixed provider option transforms functionality
- Added line-level statistics in file diffs to help users understand the scale of changes

## v0.15.11 — 2025-10-21

- Added `-f/--file` flag to opencode run command to run files directly
- Fixed OpenAI options when using @ai-sdk/azure
- Adjusted file API to encode images properly
- Updated to newer ACP package
- Improved error handling with console output for debugging

## v0.15.10 — 2025-10-20

- Added session diff API to show file changes between snapshots
- Added ACP (Agent Client Protocol) support for agent communication

## v0.15.9 — 2025-10-20

- Added Astro language server support with automatic installation for .astro files
- Fixed bash tool permission merging issues
- Fixed snapshot undo functionality bug
- Removed invalid GitHub Copilot provider option from the interface
- Improved argument replacement handling in session prompts

## v0.15.8 — 2025-10-18

- Made session compaction interruptible
- Improved error message for common directory typo in config files
- Added Australia region inference for Bedrock Haiku 4.5 models

## v0.15.7 — 2025-10-17

- Added Deno LSP support for enhanced language server functionality
- Reverted changes that attempted to avoid persisting empty thinking/text blocks

## v0.15.6 — 2025-10-16

- Fixed timeout option implementation to properly handle fetch requests with custom timeout values
- Fixed bash command execution to prevent hanging processes and properly clean up orphaned child processes
- Fixed connection closed errors in LSP file operations

## v0.15.5 — 2025-10-16

- Fixed GitHub action trigger patterns to properly respond to both `/oc` and `/opencode` commands
- Changed GitHub action model from `opencode/sonic` to `opencode/kimi-k2`
- Added GitHub Actions core libraries and Octokit dependencies for enhanced GitHub integration
- Improved handling of empty thinking/text blocks to avoid persisting them in sessions
- Adjusted GitHub workflow permissions from write to read access for contents, pull-requests, and issues

## v0.15.4 — 2025-10-16

- Fixed OpenAI provider to use chat language model instead of completion language model
- Added session option to attach command for connecting to specific sessions
- Added Slack integration package with Bolt framework support
- Simplified SDK getting started with single `createOpencode` function that creates both server and client
- Added `createOpencodeTui()` function to SDK for programmatic TUI launching
- Filtered out alpha status models from provider list for better model selection
- Made compact feature use streaming API for improved performance
- Updated Bedrock provider for Australian Sonnet 4.5 cross-region inference support
- Added support for custom tools through plugin system
- Allowed read tool to handle image files
- Improved HTTP error codes for better error reporting
- Added timeout to fetch models.dev refresh request for reliability
- Fixed false positive package manager detection in upgrade command
- Disabled workspace symbol lookup to prevent LSP performance issues
- Fixed config directory overrides for better configuration management
- Added useCompletionUrls option to fix certain Azure setups
- Included stack trace in server error responses for debugging
- Fixed typecheck issues across packages
- Fixed `rg` hanging forever when run in bash waiting for stdin
- Fixed perl6 file extension support
- Improved directory validation error messages
- Fixed clang formatter name configuration

## v0.15.3 — 2025-10-14

- Fixed false positive package manager detection in upgrade command
- Added session option to attach command for connecting to specific sessions
- Exported trimDiff function from edit tool for better API accessibility
- Resolved TypeScript errors in SDK package for improved reliability
- Added new Slack integration package with Bolt framework for Slack bot functionality
- Improved dependency management and error handling for more reliable builds

## v0.15.2 — 2025-10-14

- Fixed config directory overrides to prevent overwriting existing package.json and .gitignore files
- Fixed custom model aliases to properly map model IDs to their real provider model IDs
- Fixed clang formatter name detection
- Made shell execution more robust with proper shell-specific argument handling for bash, zsh, fish, and nu shells
- Added useCompletionUrls option to fix certain Azure OpenAI setups that require completion endpoints instead of responses endpoints
- Included stack traces in server error responses for better debugging

## v0.15.1 — 2025-10-13

- Fixed LSP performance issues by disabling workspace symbol lookup
- Fixed session compaction to properly pass model options during text generation
- Improved list tool prompt to better handle current working directory context
- Added timeout protection for models.dev refresh requests to prevent hanging

## v0.15.0 — 2025-10-12

- Fixed `rg` hanging forever when run in bash, waiting for stdin
- Improved directory validation error messages to help users fix invalid directory names
- Added support for Perl6 file extensions
- Ensured @opencode-ai/plugin is available in `.opencode` folder

## v0.14.7 — 2025-10-10

- Replaced chokidar with @parcel/watcher for better file system performance and cross-platform support
- Added ability for read tool to handle images (#3052)
- Added experimental skip bootstrap feature
- Improved MCP reliability with status monitoring
- Added timeout messages for commands that time out (#2986)
- Fixed file references and grep tool for Windows (#2980)
- Added Vertex AI support with google-vertex and google-vertex-anthropic providers (#2347)
- Added command to debug config (#2962)
- Added output-format flag to stream JSON output (#2471)
- Fixed bash command security validation to prevent accidental directory traversal
- Improved session API reliability with proper input validation
- Added todo list and session forking API endpoints
- Added session forking functionality
- Simplified getting started with single createOpencode function (removes need to manually coordinate separate server and client creation)
- Added createOpencodeTui() function for programmatic TUI launching (#2410)
- Added createOpencodeServer function with readiness waiting and random port usage
- Added /client and /server import paths for JS SDK
- Fixed type exports in package.json for better TypeScript compatibility (#2654)
- Added SSE streaming support
- Added dynamic tool registration for plugins and external services (#2420)
- Added plugin hook for config
- Fixed plugin exports and improved compatibility

## v0.14.6 — 2025-10-07

- Added MCP server status monitoring with new GET /mcp endpoint to check connection status of MCP servers
- Added 5-second timeout to MCP client verification to prevent hanging connections
- Automatically removes unresponsive MCP clients during initialization
- Updated Go SDK to version 0.16.2 with bug fixes for JSON key handling with special characters
- Updated minimum Go version requirement from 1.18 to 1.22
- Added new todo-related event types to the event system

## v0.14.5 — 2025-10-07

- Fixed MCP error handling in session prompts
- Improved grep tool to handle single file searches more effectively

## v0.14.4 — 2025-10-07

- Fixed bash command security validation to prevent accidental directory traversal outside project directory
- Added timeout message when commands timeout
- Fixed file references and grep tool compatibility issues on Windows
- Added todo list functionality with API endpoints
- Added session forking functionality to create new sessions from existing ones (api only)
- Improved session API reliability with better input validation

## v0.14.3 — 2025-10-05

- Added simplified SDK initialization with single `createOpencode` function that creates both server and client automatically
- Fixed max output tokens issue when using large thinking budget
- Fixed LSP filename matching when file extension is missing
- Added Vertex AI support with new `google-vertex` and `google-vertex-anthropic` providers
- Added `opencode debug config` command to output current configuration as JSON

## v0.14.1 — 2025-10-03

- Fixed JSON format output when running commands via `opencode run` 
- Enabled medium reasoning effort for GPT-5 Codex models

## v0.14.0 — 2025-10-02

- Fixed file search limit handling to properly respect the limit parameter when no query is provided
- Removed empty try-catch block from main entry point
- Added File module initialization to bootstrap process

## v0.13.8 — 2025-10-02

- core: make patch tool more reliable and consistent with other editing tools  The patch tool now works seamlessly alongside other file editing tools with improved error handling and a more intuitive permission system. Users will experience:  - More reliable patch application with better error messages - Consistent permission prompts that match other editing tools - Smoother integration when applying complex multi-file changes - Better feedback on what changes are being made before applying patches  This refactoring leverages the robust patch parsing engine while making the tool feel native to the opencode workflow, reducing friction when making bulk changes to your codebase.
- core: remove redundant patch integration test  The integration test was duplicating coverage already provided by the comprehensive patch namespace tests. Users benefit from faster test runs without losing any coverage of patch functionality. The remaining tests provide complete validation of patch parsing, application, and tool integration.
- Zen lander (#2907)  Co-authored-by: David Hill <iamdavidhill@gmail.com> Co-authored-by: GitHub Action <action@github.com> Co-authored-by: Adam <2363879+adamdotdevin@users.noreply.github.com> Co-authored-by: Jay V <air@live.ca>
- core: improve file search reliability and performance

## v0.13.7 — 2025-10-01

- core: prevent file deletion when reverting changes to existing files
- codex should not have reasoning effort

## v0.13.6 — 2025-10-01

- fix: worktree cmd (#2870)
- fix: tui stuck saying generating... even when it is done (#2872)
- update anthropic system prompts
- fix: adjust model dialog to handle same model id but different names (#2881)
- overhaul file search and support @ mentioning directories

## v0.13.5 — 2025-09-29

- fix: bash regex (#2858)

## v0.13.4 — 2025-09-29

No notable changes

## v0.13.3 — 2025-09-29

No notable changes

## v0.13.2 — 2025-09-29

- fix zen cookie
- sync
- core: fix config test by removing model field expectation
- core: configure turbo to avoid building opencode for web tests
- Include step-start and step-finish for cost tracking (#2810)
- sync
- Fix: Set OPENCODE_CALLER env in a more portable way for vscode extension (#2230)
- respect model id in opencode.json (#2833)
- core: improve webfetch tool content negotiation and format handling

## v0.12.1 — 2025-09-26

- fix(tool): follow symlinks when looking for tools (#2809)
- zen: accept tax id

## v0.12.0 — 2025-09-26

- fix: config loading not considering symlinks (#2800)
- zen: model management helper

## v0.11.8 — 2025-09-26

- disable aggressive config validation

## v0.11.7 — 2025-09-26

- core: add themes to allowed config directories
- fix(tui): cursor position

## v0.11.6 — 2025-09-26

- tui: fix cursor position offset in home screen

## v0.11.5 — 2025-09-26

- core: add config update endpoint and functionality
- validate config directory
- fix erroring on custom tool folder

## v0.11.4 — 2025-09-26

- feat(app): added command palette  (#2630)  Co-authored-by: Adam <2363879+adamdotdevin@users.noreply.github.com>
- feat: fuzzy file open
- fix: select dialog hover
- feat(app): changes view
- fix(app): changes view
- zen: billing
- zen: billing
- zen: fix parsing cache write tokens
- zen: check balance on enable billing
- zen: track tps
- Update opencode logo
- tweak: include usage by default for openai compatible providers (#2788)
- fix: openai reasoning issue (#2780)
- core: enable reasoning.encrypted_content and reasoningSummary for opencode provider\ntui: adjust editorY position calculation
- turn reasoning summaries back on by default for zen
- tui: fix opencode logo spacing in home view

## v0.11.3 — 2025-09-24

- feat: output-format flag to stream json output (#2471)  Co-authored-by: Siddhant Choudhary <sid@treaps.com> Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- zen: refund
- update copilot auth

## v0.11.2 — 2025-09-23

- fix: lsp spawn logic (#2723)
- feat: add Java LSP server support (#2547)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- fix: enforce extensions requirement for custom lsp servers (#2734)
- fix: lsp extension undefined handle (#2739)
- fix: theme css format
- fix: exclude generated css file
- Merge branch 'dev' of https://github.com/sst/opencode into dev
- fix: open text files
- zen: update logged endpoints
- fix: remove file existence check from LSP debug and format storage code
- fix codex errors

## v0.11.1 — 2025-09-21

- core: filter models without keys in opencode provider

## v0.11.0 — 2025-09-21

No notable changes

## v0.10.4 — 2025-09-20

- fix: no payment method (#2706)
- Enhance theme documentation with links (#2707)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- turn back on compaction summaries

## v0.10.3 — 2025-09-19

- zen: data share

## v0.10.2 — 2025-09-19

- fix: remove grok msg

## v0.10.1 — 2025-09-19

- fix task tool ui disappearing once done

## v0.10.0 — 2025-09-18

- fix: only keep aborted messages if they have sufficient parts (#2651)
- Support GLM coding plan
- fix: add synthetic user prompt after session compaction (#2659)  Co-authored-by: Julián Díaz <git@jdiaz.io>
- fix: type exports in package.json for SDK package (#2654)
- support custom tools (#2668)
- Plugin tool updates (#2670)
- rework custom tools
- fix(config): keybinds should not be required in config schema (#2669)

## v0.9.11 — 2025-09-17

- Revert "fix: type 'reasoning' was provided without its required follo… (#2648)

## v0.9.10 — 2025-09-17

- tweak: adjust title gen when using models like gpt-5-nano on non open… (#2646)
- fix: type 'reasoning' was provided without its required following item (#2633)
- fix(TUI): display correct branch name in git worktree (#2626)

## v0.9.9 — 2025-09-17

- only prune messages from more than 2 turns ago
- add `opencode attach` command to connect to a remote opencode server

## v0.9.8 — 2025-09-17

No notable changes

## v0.9.7 — 2025-09-17

- disable reading .env file automatically

## v0.9.6 — 2025-09-16

- disable thinking for opencode zen and gpt-5 temporarily

## v0.9.5 — 2025-09-16

- enable session pruning and allow disabling with OPENCODE_DISABLE_PRUNE

## v0.9.4 — 2025-09-16

- fix(windows): force npm cmd shim generation and update install docs (#2558)  Co-authored-by: Dax <mail@thdxr.com> Co-authored-by: GitHub Action <action@github.com>
- fix crash when todo content is empty fixes #2622

## v0.9.3 — 2025-09-16

- feat: enhance provider model mapping and reasoning capabilities  - Add npm package tracking to provider model mapping - Implement special handling for opencode provider with reasoning - Update provider options mapping to use npm package names

## v0.9.2 — 2025-09-16

- fix: restore chat.message plugin hook (#2619)
- feat: improve file watcher with chokidar and better ignore patterns (#2621)  Co-authored-by: GitHub Action <action@github.com>

## v0.9.1 — 2025-09-15

- feat: add desktop/web app package (#2606)  Co-authored-by: adamdotdevin <2363879+adamdottv@users.noreply.github.com> Co-authored-by: Adam <2363879+adamdotdevin@users.noreply.github.com> Co-authored-by: GitHub Action <action@github.com>

## v0.9.0 — 2025-09-15

- fix: fix wrong tool references `LS` and `Agent` (#2466)
- tweak: make bash permissions key off of command pattern (#2592)
- log bash output when using `opencode run` (#2595)
- fix: reasoning metadata persistence  (#2602)
- fix: visual token bug (#2603)
- Upgrade to Zod v4 (#2605)  Co-authored-by: GitHub Action <action@github.com>

## v0.8.0 — 2025-09-14

- Session management and prompt handling improvements (#2577)  Co-authored-by: GitHub Action <action@github.com>
- add disable OPENCODE_DISABLE_AUTOCOMPACT
- disable autocompact if context is 0
- tweak: keep aborted msgs in context (#2583)
- respect subagent in command, add `subtask` flag  (#2569)
- fix: token counting visual bug (#2587)
- fix(dev): build tui with correct file ext for windows (#2590)

## v0.7.9 — 2025-09-13

- fix: await cleanupRevert() to prevent dupe msgs after undo (#2572)
- fix: make permission always behavior match expectation (#2573)
- fix: ShellError: exit code 1 errors (#2568)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- nudge llm to continue properly after compaction

## v0.7.8 — 2025-09-12

- temporarily disable midstream compaction

## v0.7.7 — 2025-09-12

- undo session pruning

## v0.7.5 — 2025-09-12

No notable changes

## v0.7.4 — 2025-09-12

- fix compaction issues

## v0.7.3 — 2025-09-11

- fix: command being passed as arg when no args present (#2553)
- feat: Add an experimental option to disable paste summaries (#2552)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- properly support model level npm definition
- Merge branch 'production' into dev

## v0.7.2 — 2025-09-11

- fix: handle @dir in command (#2533)
- resolve nested commands (#2537)
- Update providers.mdx because of small typo (#2539)
- compaction improvements
- remove block anchor edit
- reduce LSP verbosity

## v0.7.1 — 2025-09-10

- fix issue with flags being parsed incorrectly

## v0.7.0 — 2025-09-10

- tweak: wrap build-switch w/ system-reminder (#2525)
- upgrade to latest bun

## v0.6.10 — 2025-09-10

- repair tool calls when casing is wrong

## v0.6.9 — 2025-09-09

- fix: exit code being non zero when using run cmd (#2523)
- feat: svelte lsp (#2508)

## v0.6.8 — 2025-09-09

- Remove debug logging

## v0.6.7 — 2025-09-09

- feat: add dynamic tool registration for plugins and external services (#2420)
- Merge branch 'production' into dev
- remove edit tool from plan agent (#2505)
- Hide experimental models

## v0.6.6 — 2025-09-08

- fix: dont paste collapse if in bash mode (#2482)
- fix: shell invocations are dropped if last interaction was revert (#2485)
- fix: silent error if bad flag was passed (#2486)
- fix: aws bedrock add check for govcloud (#2495)
- tweak: reenable todowrite & todoread for qwen models (#2499)
- Zen: telemetry
- feat: make npm package install work on windows (#2419)

## v0.6.5 — 2025-09-07

- wip console
- wip console
- wip console
- script package
- wip cloud smart
- wip console
- wip console
- wip console
- wip console
- fix: file fuzzy search (#2409)
- feat: add createOpencodeTui() function to SDK for programmatic TUI launching (#2410)
- fix: worktree file/content never includes patch
- fix: better file/content return
- fix: webfetch prompt mistake (#2424)
- Update index.tsx (#2423)
- tweak(edit): separate edit tool error message with clearer guidance to avoid llm doom editing loop (#2051)
- fix: file read response
- fix: default to last used model (#2443)
- fix: command model selection (#2448)
- fix: title not generated if first msg is shell invocation (#2451)
- fix: title gen w/ gpt-5-nano (#2473)
- fix: max output tokens when setting budget thinking tokens (#2056)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>

## v0.6.4 — 2025-09-03

- make @file references in custom slash commands more robust (#2203)  Co-authored-by: Adam Spiers <opencode@adamspiers.org> Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- fix: file.list relative to root
- fix: local subdirectory subagents not being picked up (#2376)
- tweak: update ls tool to use rg (#2367)
- support OPENCODE_CONFIG_CONTENT
- generate api key
- fix: more durable @ references for commands (#2386)
- wip cloud
- Patch Start to preload route css in SSR (#2389)
- wip console
- wip console

## v0.6.3 — 2025-09-02

- switch gpt-5 to default to codex prompt + high reasoning

## v0.6.2 — 2025-09-02

- fix: ensure enabled lsps are all logged (#2364)
- fix: ensure opencode still works if no commits present (#2363)

## v0.6.1 — 2025-09-01

- catch migration failures

## v0.6.0 — 2025-09-01

## Breaking Changes

This release has a bunch of minor breaking changes if you are using opencode plugins or sdk

1. storage events have been removed (we might bring this back but had some issues)
2. concept of `app` is gone - there is a new concept called `project` and endpoints to list projects and get the current project
3. plugin receives `directory` which is cwd and `worktree` which is where the root of the project is if it's a git repo
4. the session.chat function has been renamed to session.prompt in sdk. it no longer requires model to be passed in (model is now an object)
5. every endpoint takes an optional `directory` parameter to operate as though opencode is running in that directory

- Use a single rust LSP server instance for entire cargo workspace (#2292)
- fix: change command selection to prefer exact matches over fuzzy sear… (#2314)
- tweak: ensure run command doesn't send request if no prompt present (#2332)
- fix: resolve [pasted lines] when passing paste as arguments for command (#2333)
- add support for lsp workspace/didChangeConfiguration (#2334)
- fix: ensure command uses currently selected model (#2336)
- fix: resolve virtual envs for python LSP (#2155)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- fix: adjust title generation prompt to prevent direct response instead of title gen (#2338)
- fix: ensure shell cmds can be properly aborted (#2339)
- feat: Allow provider timeout override (#1982)
- fix: ensure gopls lsp id matches docs (#2344)
- add --command to opencode run (#2348)
- fix: tui attachment bound (#2361)

## v0.5.29 — 2025-08-30

- fix: shimmer cpu cost (#2084)
- sdk update
- feat: file list api
- fix: ensure / commands dont try to resolve @ references from cmd outputs (#2282)
- add synthetic user message before bash execution (when using !) (#2283)
- feat: include ignored files
- fix: tui not showing err toasts (#2290)
- Vercel AI Gateway key deeplinks into the dashboard (#2287)
- fix: mcp client name (#2289)
- feat: home dir in app info
- wip cloud
- wip cloud
- wip cloud
- allow slash commands to resolve ~/ references (#2295)
- fix: replace isomorphic-git status with direct git diff for worktree support (#1706)  Co-authored-by: Adam <2363879+adamdotdevin@users.noreply.github.com>
- tui: show actual error if command fails (#2296)
- fix: add additional encouragement for title gen (#2298)
- fix: lsp debug cmd log (#2310)
- Update sst
- Fix code block formatting in sdk.mdx (#2312)
- fix: mcp tool not triggering hooks (#2320)
- wip cloud
- Use a single rust LSP server instance for entire cargo workspace (#2292)

## v0.5.28 — 2025-08-26

- Add opencode workflow
- Add opencode workflow
- fix: model flag in non interactive mode (#2249)
- fix: eslint ENOTEMPTY (#2252)
- fix: bash tool description (#2260)
- Revert "fix(tui): too early"  This reverts commit 564418f1ff80fc4d39b864de76f36c8f1eb4fbd4.

## v0.5.27 — 2025-08-25

- fix(tui): too early

## v0.5.26 — 2025-08-25

- fix(tui): wording

## v0.5.25 — 2025-08-25

- fix(tui): fix logo color
- feat(tui): grok free
- fix(tui): sort custom commands lower
- fix(tui): sort custom commands lower
- fix(tui): wording

## v0.5.24 — 2025-08-24

No notable changes

## v0.5.23 — 2025-08-24

- fix: command model selection (#2219)

## v0.5.18 — 2025-08-23

- chore(openapi): set correct content type for server-sent events (#2045)
- add sse streaming to sdk
- fix: count reasoning tokens (#2187)
- feat(lsp): option to disable lsps installing automatically (#1997)  Co-authored-by: rekram1-node <aidenpcline@gmail.com>

## v0.5.15 — 2025-08-22

- await config hooks
- fix: preserve cache dir on cleanup (#2126)
- fix(js-sdk): fix types in session.chat (#1925)  Co-authored-by: zwingzheng <zwingzheng@tencent.com> Co-authored-by: rekram1-node <aidenpcline@gmail.com>
- allow importing sdk from @opencode-ai/sdk/server and @opencode-ai/sdk/client
- fix sdk config type
- fix: if lsp fails to spawn it shouldn't inject errors into edit diagnostics (#2145)
- add `createOpencodeServer` to js sdk and wait for readiness. always use random port for `opencode serve`. add `/client` and `/server` imports for js sdk
- tweak: adjust plan agent to ask when running bash, give it edit tooli… (#2150)
- deal with non existing cache folder
- fix: error logging (#2165)
- fix: correct typo in LSP documentation (#2164)
- Update duplicate-issues.yml
- slash commands (#2157)  Co-authored-by: adamdotdevin <2363879+adamdottv@users.noreply.github.com>
- fix: format error log (#2184)

## v0.5.13 — 2025-08-21

- fix: ignore case when checking Qwen in model ID for todos (#2122)
- tweak: adjust plan -> build transition prompt (#2111)
- add plugin hook for config
- await config hooks
- fix: preserve cache dir on cleanup (#2126)

## v0.5.12 — 2025-08-20

- remove auto browser open for now

## v0.5.10 — 2025-08-20

No notable changes

## v0.5.9 — 2025-08-20

- copilot auth update version

## v0.5.8 — 2025-08-20

- blacklist gpt-5-chat-latest (#2048)
- fix: ensure name isn't added as field in options: {...} (#2053)
- Update duplicate-issues.yml
- tweak: better agent create error handling (#2058)
- fix: interface conversion panic (#2060)
- fix: add type checking for MCP tool path parameters (#2073)  Co-authored-by: opencode-agent[bot] <opencode-agent[bot]@users.noreply.github.com>
- fix: tui panic from logger (#2075)
- fix(TUI): make it less shimmer (#2076)
- tweak: notify agent it is in build mode when switching from plan mode (#2065)
- fix: agent casing issue (#2081)
- fix: keybind panic (#2092)
- fix: don't let --continue access subagent session (#2091)
- sonic model

## v0.5.7 — 2025-08-18

- fix anthropic console auth (#2049)

## v0.5.6 — 2025-08-18

- feat: top level tool config (#2008)
- tweak(config): make markdown agent files in subfolder discoverable `.opencode/agent/some-folder/*.md` (#1999)
- fix: install script didnt use -e flag (#2009)
- fix: lsp bug (#1994)
- feat(lsp): add rust-analyzer (#1972)
- fix(opencode): add ulid dependency (#1988) (#1989)  Co-authored-by: Dax <mail@thdxr.com>
- fix: better binary file detection (#2025)
- fix: gh install trim remote origin (#2030)

## v0.5.5 — 2025-08-16

- fix: remove unsupported mode flag, change to agent (#1979)
- tweak: plan prompt, more explicit about not modifying files (#1991)
- feat(tui): retain cache when cycling between subagent/parent sessions for perf (#1981)
- fix(tui): text selection is sometimes not cleared when click+release without dragging (#1993)

## v0.5.4 — 2025-08-15

- fix: run command (#1971)
- tweak: fix scroll speed (#1974)

## v0.5.3 — 2025-08-15

- feat: add scroll speed to config (#1968)
- feat(TUI):  improves UX with message navigation modal to jump and restore to specific messages (#1969)
- fix(shell): commands expecting stdin will be "working" indefinitely (#1964)
- feat(shell): load .zshenv and respect ZDOTDIR if present (#1958)
- fix: some visual bugs in dialogs

## v0.5.2 — 2025-08-15

- fix: small tweak to support nushell (#1943)
- lander: match alternatives h3 font size with figcaption on mobile
- fix(TUI): fix agent types agents modal (#1942)
- fix: fish shell (#1950)
- fix: more permissive owner/repo detection (#1948)
- Feat: Render tool metadata after permission rejection. (#1949)  Signed-off-by: jmug <u.g.a.mariano@gmail.com>
- Add Vue LSP and enable eslint for `.vue` files. (#1952)
- feat(tui): support cycling recent models in reverse (#1953)
- fix(tui): issue with rendering markdown tables (#1956)
- fix: add missing keybinds to config
- fix: keybind docs out of sync
- feat: better queued visual
- fix: more commands cleanup
- feat: /tui/show-toast api
- feat(api): get session and session children routes
- feat(tui): navigate child sessions (subagents)

## v0.5.1 — 2025-08-14

- fix: support fish shell (#1911)
- fix for session stuck in "Working..."
- allow plugins to create custom auth providers

## v0.4.45 — 2025-08-13

- Fix: Error [ERR_DLOPEN_FAILED] (#1546)
- fix: bash should hide stdout from zshrc (#1909)

## v0.4.44 — 2025-08-13

- feat: convert attachments to text on delete (#1863)  Co-authored-by: Dax Raad <d@ironbay.co> Co-authored-by: Dax <mail@thdxr.com>
- fix: default scroll speed should be slower
- Fix incorrect AUR namespace (#1907)
- re-enable aur
- Fix: Error [ERR_DLOPEN_FAILED] (#1546)

## v0.4.43 — 2025-08-13

- fix: duplicates bot prompt (#1901)
- fix: js plugin support as per documentation (#1896)
- fix: grammatical error in agent launch example (by Opencode) (#1897)
- docs(cli): document ! bash commands and session persistence in CLI docs
- feat: bash commands
- support !shell commands
- feat: convert attachments to text on delete (#1863)  Co-authored-by: Dax Raad <d@ironbay.co> Co-authored-by: Dax <mail@thdxr.com>

## v0.4.42 — 2025-08-13

- fix: better error message when config has invalid references (#1874)
- fix: task tool prompt (#1887)
- fix: reasoning not supported (#1882)
- fix: permission prompting issues (#1884)
- Merge default agent permissions with global config (#1879)
- fix: update read tool description to exclude binary/image files
- fix: allow attachments outside cwd, and support svg
- fix: messages layout instability

## v0.4.41 — 2025-08-13

- fix unzip not found printing to tui
- update copilot prompt

## v0.4.40 — 2025-08-12

- disable todo tools for qwen models to improve compatibility
- bash truncate character max instead of line max
- refactor(agent-modal): revamped UI/UX for the agent modal (#1838)  Co-authored-by: Dax Raad <d@ironbay.co> Co-authored-by: Dax <mail@thdxr.com>
- feat: add session rename functionality to TUI modal (#1821)  Co-authored-by: opencode <noreply@opencode.ai> Co-authored-by: Dax Raad <d@ironbay.co> Co-authored-by: Dax <mail@thdxr.com>
- add openai prompt cache key
- fix(TUI): unsurfacing subagent from agents modal (#1873)

## v0.4.37 — 2025-08-12

- limit bash tool to 1000 lines of output
- disable todo tools for qwen models to improve compatibility

## v0.4.36 — 2025-08-12

- fix issue when @ tagging fiels throwing error
- fix: word wrapping with hyphens
- fix: markdown lists

## v0.4.34 — 2025-08-12

- fix: long word and attachment wrapping in editor
- Add agent-level permissions with whitelist/blacklist support (#1862)
- support OPENCODE_PERMISSION json env variable

## v0.4.29 — 2025-08-12

- fix: Missing ~/.local/share/opencode/bin directory causes misleading … (#1860)

## v0.4.28 — 2025-08-12

- fix: vscode extension cursor placement
- fix: Missing ~/.local/share/opencode/bin directory causes misleading … (#1860)

## v0.4.27 — 2025-08-12

- support wildcard matching tool names in config
- Update duplicate-issues.yml
- Update guidelines-check.yml
- fix: preserve process.env when spawning formatter commands (#1850)
- fix: use real cursor instead of virtual cursor

## v0.4.26 — 2025-08-12

- azure reasoning effort
- fix azure reasoningEffort

## v0.4.25 — 2025-08-12

- refactor: replace OPENCODE_AGENTS env var with HTTP API call  Replace environment variable passing of agent data from Node.js to TUI with proper HTTP API call to /agent endpoint. This improves architecture by eliminating env var dependencies and allows dynamic agent data fetching.
- Simplify git-committer agent definition for better maintainability

## v0.4.24 — 2025-08-12

- fix pyright

## v0.4.23 — 2025-08-12

- switch back to didUpdate instead of closing and opening file
- fix undo/redo when opencode is run in nested folders

## v0.4.22 — 2025-08-12

- update anthropic prompt and variables

## v0.4.21 — 2025-08-12

- Fix plugin file name (#1837)
- fix: complete item on space
- feat: add clangd for cpp

## v0.4.20 — 2025-08-11

- remove git bash tool coauthor message
- fix: take up less vertical space
- fix: collapsed tool calls hidden at times
- feat: add -c and -s args to tui command following run command pattern (#1835)
- Revert "feat: improve file attachment pasting (#1704)"  This reverts commit 81a3e02474445bc4d22c7857d4c3b1f591c1cb56.
- Fix plugin file name (#1837)

## v0.4.19 — 2025-08-11

- fix: don't display placeholder on error
- feat: toggle tool details visible
- Update GPT-5 system prompt to use copilot-specific prompt instead of codex prompt  🤖 Generated with [opencode](https://opencode.ai)  Co-Authored-By: opencode <noreply@opencode.ai>
- remove git bash tool coauthor message

## v0.4.18 — 2025-08-11

- fix: assistant message footer styles
- fix: assistant message footer styles
- fix: assistant message footer styles

## v0.4.17 — 2025-08-11

- fix: instructions should be able to handle absolute paths (#1762)
- fix: only load the first local and global rule file (#1761)
- Feat: Implement Wrap-Around Navigation for List Selection (for Models and Tools modal) (#1768)
- Fix: Respect agent's preferred model at TUI startup (#1683)  Co-authored-by: opencode <noreply@opencode.ai>
- fix: re-render messages on session error
- feat: placeholder on pending assistant message
- fix: reformat assistant message footer
- make models key optional in config
- fix azure gpt config

## v0.4.16 — 2025-08-11

No notable changes

## v0.4.15 — 2025-08-11

- fix run command to be less messy
- feat (tui): agents dialog (#1802)
- Fix: Sanitize MCP Tool Names for Consistency in User Expectations (#1769)
- Add support for biome.jsonc config file (#1791)
- Issue 1676: Don't eat up the last newline in a multi-line replacement (#1777)
- Feat: Add F2 Keybind to Cycle Through the 5 Most Recent Models (#1778)

## v0.4.12 — 2025-08-11

- fix plan mode bash tool making changes
- show combined output of bash tool progressively

## v0.4.11 — 2025-08-11

No notable changes

## v0.4.10 — 2025-08-11

- fix: enforce field requirement for cli cmds (#1796)

## v0.4.6 — 2025-08-11

- add OPENCODE_DISABLE_AUTOUPDATE flag

## v0.4.5 — 2025-08-11

- feat: improve file attachment pasting (#1704)
- wip gateway
- better permissions ux when denying (#1747)
- feat: eslint lsp (#1744)
- use minimal reasoning effort for gpt-5
- Update moonshot ai provider doc
- Feat: Add Agent Name in the LLM Response Footer (and re-order it) (#1770)
- feat: webfetch permission support (#1772)
- wip gateway
- feat: thinking blocks rendered in tui and share page
- support agent options
- switch gpt-5 to codex prompt
- fix(plugin): prevent compiled binary hang by removing lazy dynamic import (#1794)  Co-authored-by: opencode <noreply@opencode.ai>
- pass through additional agent options to the provider

## v0.4.2 — 2025-08-09

- fix(TUI): enable general (sub-) agent for @ referencing (#1705)
- fix(tui): preserve scroll position when reflowing due to message stream (#1716)
- fix deploy script
- fix deploy
- Clarify remote mcp error (#1729)  Co-authored-by: opencode <noreply@opencode.ai>
- chore(js-sdk): Compatible with nodenext (#1667)
- Reference the actual name of the windows package (#1700)
- feat(agent): allow mode selection during creation (#1699)
- Remove unused OpenTelemetry tracing and fix overlapping highlights (#1738)  Co-authored-by: opencode <noreply@opencode.ai>
- gpt-5 lower verbosity
- remove synthetic message in plan mode, fixes being confused in build mode

## v0.4.1 — 2025-08-08

- temporary fix for max output token

## v0.4.0 — 2025-08-08

- fix: text selection bug (#1664)
- fix: modal pastes (#1677)
- fix: get session api (#1684)
- Merge agent and mode into one (#1689)  The concept of mode has been deprecated, there is now only the agent field in the config.  An agent can be cycled through as your primary agent with <tab> or you can spawn a subagent by @ mentioning it. if you include a description of when to use it, the primary agent will try to automatically use it  Full docs here: https://opencode.ai/docs/agents/
- looser todo tool schema
- renable todo tool

## v0.3.133 — 2025-08-07

- fix: interface conversion panic (#1655)
- fix(docs): small_model is not used for summarization (#1360)
- add api to get session

## v0.3.132 — 2025-08-06

- fix: prevent title regeneration on auto compact (#1628)
- fix: markdown table renders (#1623)
- docs(plugins): fix typo (#1621)
- feat: better assistant message visual
- permissions disallow support (#1627)
- fix: handle undefined agent in task tool (#1642)
- fix: highlight after text wrap (#1640)
- fix: run command should use specified model from cli args if provided (#1648)
- add `snapshot` field in config to disable snapshots

## v0.3.131 — 2025-08-05

- fix(plugins): improve session idle event (#1615)
- fix: server.root is not a function (#1614)
- validate file part bounds to prevent panic (#1612)
- fix: allow disabling the default general agent (#1616)
- hint back to llm when tool does not exist

## v0.3.130 — 2025-08-05

- re-export shell $ for plugin

## v0.3.129 — 2025-08-05

- added vesper theme (#1602)
- fix: default value for models with no cost object (#1601)
- fix @opencode-ai/plugin exports

## v0.3.128 — 2025-08-04

- hack to return tool call errors back to model

## v0.3.127 — 2025-08-04

- Add typecheck workflow
- fix: patch marked-shiki (#1569)
- Add workflow_dispatch trigger to typecheck workflow
- fix docs
- fix double help printing (#1580)

## v0.3.126 — 2025-08-03

- fix bash tool getting stuck on interactive commands
- increase models.dev polling interval to hourly
- tweak: filter out duplicate instructions (#1567)
- fix bash tool not showing stderr

## v0.3.122 — 2025-08-03

- more efficient snapshots in parallel toolcalls

## v0.3.121 — 2025-08-03

- more fixes for shell 128 error
- fix(docs): move disabled providers paragraph to its proper section (#1547)

## v0.3.120 — 2025-08-03

No notable changes

## v0.3.119 — 2025-08-03

No notable changes

## v0.3.118 — 2025-08-03

- fix: expand tilde for file: references (#1553)
- fix shell error 128

## v0.3.117 — 2025-08-03

No notable changes

## v0.3.116 — 2025-08-03

No notable changes

## v0.3.115 — 2025-08-03

- Share link hotfix (#1513)

## v0.3.114 — 2025-08-03

- Add Zhipu AI provider
- sync
- remove: delete extension test file (#1554)

## v0.3.113 — 2025-08-02

- better configuration error messages (#1517)
- fix: include stderr in bash tool output (#1511)
- feat(models): enable Kimi k2 ⇄ Claude trajectory handoff (#1525)
- fix(tui): attachment source is not stored when using message from message history (#1542)
- fix(tui): attachment highlighting issues in messages (#1534)
- Choose model according to the docs (#1536)
- tweak: make gh action ignore url mentions of opencode (#1531)

## v0.3.112 — 2025-08-01

- allow search in provider select
- handle the optional `v` in upgrade command when using curl (#1500)
- fix(docs): Fix formatting for Node.js installation section (#1497)
- configurable lsp
- make top_p configurable
- force models.dev refresh on auth login

## v0.3.111 — 2025-08-01

- docs(permissions): add wildcard example (#1494)
- fix: {file:...} references weren't being parsed correctly in some cases (#1499)
- fix: bash tool errors for chmod (#1502)
- tweak: sanitize mcp server names (#831)
- fix: unshare command missing
- add version to user-agent

## v0.3.110 — 2025-08-01

- poll for models.dev changes

## v0.3.109 — 2025-08-01

- add user agent for models.dev request

## v0.3.108 — 2025-08-01

- Update STATS.md
- better guarding against bash commands that go outside of cwd
- do not mark errored tool calls as aborted

## v0.3.107 — 2025-08-01

- improve wildcard matching for permissions

## v0.3.106 — 2025-08-01

- Release v0.3.105
- fix escape button not canceling if retry in progress

## v0.3.105 — 2025-07-31

- Release v0.3.104
- formatter config

## v0.3.104 — 2025-07-31

- allow disabling formatter

## v0.3.103 — 2025-07-31

- Release v0.3.102
- Remove hardcoded vscode extension theme
- fix issue with some bash commands asking for permission

## v0.3.102 — 2025-07-31

- Release v0.3.101

- fix(editor): handle UTF-8 characters properly in SetValueWithAttachments (#1469)
- feat: more scriptable tui (api)
- fix: permission state hangs
- Add provider instruction for Azure OpenAI
- fix: session ordering (#1474)
- fix: load global jsonc (#1479)
- configurable permissions

## v0.3.101 — 2025-07-31

No notable changes

## v0.3.100 — 2025-07-31

- fix: process revert cleanup before creating new messages (#1448)
- feat: jsonc configuration file support (#1434)

## v0.3.93 — 2025-07-31

No notable changes

## v0.3.92 — 2025-07-31

- ci tweaks

## v0.3.90 — 2025-07-31

- fix: unit test assertion (#1435)  Signed-off-by: Yordis Prieto <yordis.prieto@gmail.com>
- fix: update glob pattern and path in tool test (#1436)
- use treesitter to parse bash commands and catch commands that go outside of cwd (#1443)
- fix typo in bash.ts (#1444)
- Add http-referer header for vercel ai gateway requests (#1403)
- feat: mode directory markdown configuration loading (#1377)
- Use responses API for Azure (#1428)

## v0.3.86 — 2025-07-30

- fix: attachment highlighting (#1427)
- release undo/redo
- lower max retries to 3 - ai sdk currently cannot abort during a retry delay so things appear to be frozen

## v0.3.85 — 2025-07-30

- build: add @octokit/rest to opencode dependencies (#1396)  Co-authored-by: Frank <frank@sst.dev>
- tweak: adjust astro css to render mixed nested lists (#1411)
- fix: quick grammar and spelling check (#1402)
- fix: prevent read tool from opening binary files and corrupting session (#1425)
- fix: attachment highlighting (#1427)

## v0.3.84 — 2025-07-30

- update beast prompt for openai models

## v0.3.83 — 2025-07-29

- experimental well-known auth support

## v0.3.82 — 2025-07-29

- fix: task type error (#1384)
- feat: add OPENCODE_CONFIG env var for specifying a custom config file (#1370)
- strip todo tool instructions from non anthropic models
- feat: show current git branch in status bar, and make it responsive (#1339)  Co-authored-by: adamdotdevin <2363879+adamdottv@users.noreply.github.com>
- fix: improve handling of global File object in uploads tests (#1394)
- fix: update file name extraction in uploads test to use __filename (#1395)
- feat: show git diff in reverted messages
- convert share backend to hono app
- remove min/max in tool schemas

## v0.3.81 — 2025-07-29

- Tweak auth cli copy
- trim opencode title
- fix: task type error (#1384)
- feat: add OPENCODE_CONFIG env var for specifying a custom config file (#1370)
- strip todo tool instructions from non anthropic models

## v0.3.80 — 2025-07-28

- fix: attachment bugs (#1335)
- show opencode button in vscode when focused on terminal
- vscode: bring oc terminal to front if already opened
- vscode: add cmd+shift+esc keybinding
- fix phantom tool call failed messages and empty text parts with some models

## v0.3.79 — 2025-07-27

- fix: strip thinking blocks from title (#1325)
- simplify github action
- fix input format affected by installing vscode extension

## v0.3.78 — 2025-07-26

No notable changes

## v0.3.77 — 2025-07-26

- fixing various typos in text. (#1185)

## v0.3.76 — 2025-07-25

- better mcp support - should fix hanging when streamable http server is added

## v0.3.75 — 2025-07-25

- qwen optimizations it works good now

## v0.3.74 — 2025-07-25

- Fix a broken example in the MCP documentation and add more clarity (#1322)
- qwen optimizations it works good now

## v0.3.73 — 2025-07-25

- Fix a broken example in the MCP documentation and add more clarity (#1322)

## v0.3.72 — 2025-07-25

- fix(headless): respect mode passed to /message endpoint (#1300)
- handle uploaded text/plain

## v0.3.71 — 2025-07-25

- fix issue with trailing whitespace error in assistant message
- feat: add csharp lsp (#1312)
- fix: apply content-level caching for non-anthropic providers (#1305)

## v0.3.70 — 2025-07-25

- fix double system prompt
- fix: header width to display header in one line when sharing disabled (#1310)
- fix reading model from config
- fix issue with trailing whitespace error in assistant message

## v0.3.69 — 2025-07-25

- disable todo tools by default in agent

## v0.3.68 — 2025-07-25

- fix symlinked agents
- disable todo tools by default in agent

## v0.3.67 — 2025-07-25

- agents better display when spawning

## v0.3.66 — 2025-07-25

No notable changes

## v0.3.65 — 2025-07-25

- Check if modelID includes "claude" for antropic/claude prompt caching (#1284)
- includ baseline builds
- fix: edit tool  (#1287)
- fix: add custom() to system prompt on summarize (#1289)
- feat: Replace unzip with @zip.js/zip.js for Windows compatibility (#662)
- (tui) tweak: add setting for scroll speed (#1288)
- Fix: added environment() to summarize() (#1290)
- real life totally configurabl ai subasians

## v0.3.61 — 2025-07-24

- fix "working" spinner animation (#1054) (#1259)
- tweak: handle pasted attachment references (#1257)
- feat: pass mode into task tool (#1248)
- basic undo feature (#1268)  Co-authored-by: adamdotdevin <2363879+adamdottv@users.noreply.github.com> Co-authored-by: Jay V <air@live.ca> Co-authored-by: Aiden Cline <63023139+rekram1-node@users.noreply.github.com> Co-authored-by: Andrew Joslin <andrew@ajoslin.com> Co-authored-by: GitHub Action <action@github.com> Co-authored-by: Tobias Walle <9933601+tobias-walle@users.noreply.github.com>
- fix header width
- fix: update max visible height in list tests (#1269)
- disable undo/redo for now
- add aura theme (#1280)
- fix: slog error log serialization (#1276)
- disable snapshots

## v0.3.58 — 2025-07-23

- tweak: ensure most recently interacted with session appears at the top (#1239)
- add debug paths command
- remove providers path

## v0.3.57 — 2025-07-23

- feat(tui): support pipe into tui (#1230)
- Allow multiline prompts for github agent (#1225)
- config: improve config schema

## v0.3.56 — 2025-07-22

- tweak: cleanup cancelled markdown (#1222)

## v0.3.55 — 2025-07-22

No notable changes

## v0.3.54 — 2025-07-21

- fix broken attachments

## v0.3.53 — 2025-07-21

No notable changes

## v0.3.52 — 2025-07-21

No notable changes

## v0.3.51 — 2025-07-21

- do not copy empty strings
- feat(tui): paste minimizing (#784)
- fix(tui): up/down arrow handling

## v0.3.50 — 2025-07-21

No notable changes

## v0.3.49 — 2025-07-21

- feat(tui): theme override with OPENCODE_THEME
- feat(tui): disable keybinds
- add toast for copy
- include newline between messages when copying

## v0.3.48 — 2025-07-21

No notable changes

## v0.3.47 — 2025-07-21

No notable changes

## v0.3.46 — 2025-07-20

- trimmed selection ui

## v0.3.45 — 2025-07-20

- implement copy paste much wow can you believe we went this long without it so stupid i blame adam

## v0.3.44 — 2025-07-20

- fix(windows): resolve numlock and French keyboard input issues (#1165)
- do not snapshot nongit projects for now

## v0.3.43 — 2025-07-20

- fix bad layout on first render of chat history

## v0.3.41 — 2025-07-20

- fix: adjust editor parsing to handle flags like --wait (#1160)
- fix: title generation for certain providers (#1159)

## v0.3.40 — 2025-07-19

No notable changes

## v0.3.37 — 2025-07-19

- Revert "fix: prevent sparse spacing in hyphenated words (#1102)"

## v0.3.36 — 2025-07-19

- fix(hooks): prevent session_complete hook from firing on subagent sessions (#1149)
- Revert "fix: prevent sparse spacing in hyphenated words (#1102)"

## v0.3.35 — 2025-07-19

- fix first run github copilot
- fix(hooks): prevent session_complete hook from firing on subagent sessions (#1149)

## v0.3.34 — 2025-07-19

./dist/opencode-windows-x64.zip

## v0.3.33 — 2025-07-19

./dist/opencode-windows-x64.zip

## v0.3.32 — 2025-07-19

./dist/opencode-windows-x64.zip

## v0.3.31 — 2025-07-19

- perf: more performance improvements

## v0.3.30 — 2025-07-19

- perf: scroll to bottom in thread

## v0.3.29 — 2025-07-19

- disable todo tools when running as task

## v0.3.27 — 2025-07-19

- fix openrouter caching

## v0.3.26 — 2025-07-19

- feat(tui): collapse session header into single line when sharing is disabled (#1145)
- fix: escape ansi sequences (#1139)
- fix: bullet display (#1148)
- remove log level from config
- shitty hack for terrible charm bubbletea performance

## v0.3.25 — 2025-07-19

./dist/opencode-windows-x64.zip

## v0.3.24 — 2025-07-19

- fix: func called before definition (#1134)
- feat(provider): add Gemini tool schema sanitization (#1132)
- fix table heading rendering (#1138)
- vercel ai gateway
- fix: prevent sparse spacing in hyphenated words (#1102)

## v0.3.23 — 2025-07-19

- fix: prevent sparse spacing in hyphenated words (#1102)

## v0.3.22 — 2025-07-18

- feat(tui): simpler layout, always stretched
- Added install dir priority & user feedback (#1129)
- feat(config): make small model configurable (#1030)

## v0.3.21 — 2025-07-18

- fix: \{return} should be replaced with new line on all lines (#1119)
- message rendering performance improvements

## v0.3.20 — 2025-07-18

./dist/opencode-windows-x64.zip

## v0.3.19 — 2025-07-17

./dist/opencode-windows-x64.zip

## v0.3.18 — 2025-07-17

- Remove binary file opencode (#1069)
- fix: type 'reasoning' was provided without its required following item (#1072)
- docs(share): add explicit manual share mode (#1074)
- feat(tui): remove sharing info from session header when sharing is disabled (#1076)
- fix(tui): user defined ctrl+z should take precedence over suspending (#1088)
- fix: message error centering (#1085)
- feat(tui): remove share commands from help if sharing is disabled (#1087)
- feat(tui): highlight current session in sessions modal (#1093)
- tweak: allow mcp servers to include headers (#1096)
- feat: support AWS_BEARER_TOKEN_BEDROCK for amazon bedrock provider autoloading (#1094)

## v0.3.17 — 2025-07-16

- fix(tui): slightly faster scroll speed
- fix(tui): expand edit calls
- Remove binary file opencode (#1069)

## v0.3.16 — 2025-07-16

- feat(tui): more ways to quit
- only include severity 1 diagnostics from lsp in edit tool output
- fix(tui): slightly faster scroll speed

## v0.3.15 — 2025-07-16

- sync
- perf: move ANSI regex compilations to package level (#1040)
- fix: don't sign snapshot commits (#1046)
- chore(tui): simplify messages component, remove navigate, add copy last message
- fix(tui): faster cache algo
- fix(tui): render attachments in user messages in accent color
- fix(gh): build
- fix(tui): pending tool call width
- fix(tui): diagnostics rendering
- Enhance private npm registry support (#998)
- feat(tui): shift+tab to cycle modes backward (#1049)
- fix: grep omitting text after a colon (#1053)
- fix: Prevent division by zero in context percentage calculation (#1055)
- Fix: Add escape sequence for @ symbols to prevent send blocking (#1029)
- Fix: better title generation (needs to change due to small models) (#1059)
- feat(tui): layout config to render full width
- fix: generate title should use same options as model it uses to gen (#1064)
- fix: missing dependency
- fix: missing dependency

## v0.3.13 — 2025-07-16

- enable bash tool in plan mode
- fix share page v1 message
- clean up export command

## v0.3.12 — 2025-07-16

- add small model for title generation
- feat(tui): add /export command to export conversation to editor (#989)
- add support for modified gemini-cli system prompt (#1033)
- move spoof prompt to support anthropic with custom modes (#1031)

## v0.3.11 — 2025-07-15

./dist/opencode-windows-x64.zip

## v0.3.10 — 2025-07-15

- fix(tui): rework lists and search dialog
- feat(tui): add keymap to remove entries from recently used models (#1019)
- tweak: (opencode run): adjust tool call rendering, reduce number of "Unknowns" (#1012)
- fix(tui): mouse scroll ansi parsing and perf
- fix(tui): wider max width
- add small model for title generation

## v0.3.9 — 2025-07-15

- Fix: failed to open session (#999)
- fix(tui): close completion dialog on ctrl+h (#1005)
- upgrade ai sdk
- fix logic for suprpessing snapshots in big directories
- fix(tui): rework lists and search dialog

## v0.3.8 — 2025-07-15

- fix panic

## v0.3.7 — 2025-07-15

- support anthropic console login flow
- Standardize parameter description references in Edit and MultiEdit tools (#984)
- improve error handling and logging for GitHub API failures in upgrade and install script (#972)
- Add support for job-control suspend (ctrl+z/SIGSTP). (#944)
- fix: --continue pull the latest session id consistently (#918)
- bring back task tool

## v0.3.5 — 2025-07-14

- feat(tui): add support for readline list nav (`ctrl-p`/`ctrl-n`) (#955)
- feat(tui): even better model selector
- fix(tui): support readline nav in new search component

## v0.3.4 — 2025-07-14

- Fix issue: Option to update username shown in conversations. (#975)
- feat(tui): add support for readline list nav (`ctrl-p`/`ctrl-n`) (#955)

## v0.3.3 — 2025-07-14

- Fix clipboard on Wayland systems (#941)
- fix: file command visual bug (#959)
- Explain usage of external references in AGENTS.md (#965)
- feat: ctrl+left arrow / ctrl+right arrow key support (#969)
- Fix failing git hooks (#966)
- feat: ability to create new session from session dialog (#920)
- fix(tui): find dialog bg color
- fix(tui): build and bg color
- fix init command and escape to cancel

## v0.3.2 — 2025-07-14

- share page hide step-finish events
- fix share page timestamps
- feat: add more ignore patterns to the ls tool (#913)
- fix packages being reinstalled on every start
- Fix: title generation (#949)
- fix: deduplicate command suggestions (#934)
- Added sharing config with auto/disabled options (#951)
- Part data model (#950)
- fix type error
- fix missing tokens
- ci
- get rid of cli markdown dep

## v0.2.33 — 2025-07-12

- fix issue preventing things from working when node_modules or package.json present in ~/

## v0.2.31 — 2025-07-12

- fix: avoid overwriting the provider.option.baseURL (#880)
- tweak: plan interactions should match web (TUI) (#895)
- switch global config to ~/.config/opencode/opencode.json

## v0.2.30 — 2025-07-11

- introduce cache version concept for auto cleanup when breaking cache changes happen

## v0.2.28 — 2025-07-11

- Api: add endpoint for getting github app token
- fix: avoid worker exception, graceful 404 (#869)
- fix(tui): actually fix mouse ansi codes leaking
- fix(tui): don't include /mode trigger
- fix(tui): help commands bg color
- fix: ENAMETOOLONG: name too long when adding custom mode (#881)
- fix(session): add fallback for undefined output token limit (#860)

## v0.2.27 — 2025-07-10

- fix(tui): mouse wheel ansi codes leaking into editor
- fix(tui): center help dilaog (#853)
- fix(tui): handle SIGTERM, closes #319
- Api: add endpoint for getting github app token

## v0.2.26 — 2025-07-10

- run: properly close session.list
- add step finish part

## v0.2.25 — 2025-07-10

- disable filewatcher, fixes file descriptor leak

## v0.2.24 — 2025-07-10

- fix: encode & decode file paths (#843)
- Adds real example in docs of how to configure custom provider (#840)
- feat(tui): accent editor border on leader key
- config: escape file: string content

## v0.2.23 — 2025-07-10

- feat(tui): modes
- feat(tui): add token and cost info to session header
- feat: mode flag in cli run command
- feat: --mode flag passed to tui
- set max output token limit to 32_000
- opencode run respects mode
- support env and file pointers in config

## v0.2.22 — 2025-07-10

- feat(tui): modes
- feat(tui): add token and cost info to session header
- feat: mode flag in cli run command
- feat: --mode flag passed to tui

## v0.2.21 — 2025-07-10

- fix(tui): textarea issues
- fix(tui): textarea cursor sync issues with attachments
- fix(tui): fouc in textarea on app load
- make LSP lazy again

## v0.2.20 — 2025-07-10

- disable lsp on non-git folders
- temporary grok 4 patch

## v0.2.19 — 2025-07-10

- feat(tui): @symbol attachments
- feat(tui): hide cost if using subscription model (#828)
- feat(tui): /editor - change the auto-send behavior to put content in input box instead (#827)
- feat(tui): subsitute cwd home path on status bar (#808)
- fix session is busy error

## v0.2.18 — 2025-07-10

- respect go.work when spawning LSP

## v0.2.17 — 2025-07-10

- feat(tui): treat pasted text file paths as file references (#809)
- modes concept
- do not wait for LSP to be fully ready
- better detection of prettier formatter

## v0.2.15 — 2025-07-09

- LSP: fix SimpleRoots to actually search in the root directory (#795)
- Add gpt-4.1 beast prompt (#778)

## v0.2.14 — 2025-07-09

- tweak: keep completion options open when trigger is still present (#789)
- fix(tui): markdown wrapping off sometimes
- fix(tui): don't panic on missing linux clipboard tool
- feat(tui): move logging to server logs
- feat: configurable log levels
- feat: discord redirect
- lsp: spawn only a single tsserver in project root

## v0.2.13 — 2025-07-09

- Add debounce before exit when using non-leader exit command (#759)
- fix(tui): clear command priority

## v0.2.12 — 2025-07-08

- fix(tui): panic when reading/writing clipboard on linux
- fix: documentation typo (#781)
- chore: vendor clipboard into go package
- chore: remove clipboard temp
- chore: vendor clipboard into go package
- Add debounce before exit when using non-leader exit command (#759)

## v0.2.11 — 2025-07-08

- add typescript lsp timeout if it fails to start

## v0.2.10 — 2025-07-08

- big rework of LSP system
- properly load typescript lsp in subpaths

## v0.2.9 — 2025-07-08

- fix(copilot): add vision request header (#773)
- fix(tui): model/provider arg parsing
- fix(tui): pasting causes panic on macos
- fix: env has to be string
- [config json schema] declare default values and examples for in-ide documentation (#754)
- Add support for the Zig Language Server (ZLS) (#756)
- fix: support cancelled task state (#775)
- feat(storage): ensure storage directory exists and handle paths correctly (#771)
- fix(tool): fix ripgrep invocation on Windows (#700)
- fix: make compact command interruptible (#691)

## v0.2.6 — 2025-07-08

- start file watcher only for tui
- feat(tui): handle --model and --prompt flags
- feat(tui): paste images and pdfs
- feat(tui): command aliases
- Update STATS.md
- fix: include symlinks in ripgrep searches
- fix: display errors when using `opencode run ...` (#751)
- fix: image reading

## v0.2.5 — 2025-07-08

./dist/opencode-darwin-x64.zip

## v0.2.4 — 2025-07-07

- fix crash when running on new project

## v0.2.3 — 2025-07-07

- run: truncate prompt
- fix mcp tools corrupting session

## v0.2.2 — 2025-07-07

- Add stdin support to run command
- append piped stdin to prompt

## v0.2.1 — 2025-07-07

- fix interrupt

## v0.2.0 — 2025-07-07

- v2 message format and upgrade to ai sdk v5 (#743)
- fix interrupt

## v0.1.195 — 2025-07-07

- Update download stats 2025-07-05
- fix openrouter caching with anthropic, should be a lot cheaper
- Update download stats 2025-07-06
- fix: Skip opencode upgrade if same version (#720)
- Fix Elixir LSP startup (#726)

## v0.1.194 — 2025-07-04

- use full filepath

## v0.1.193 — 2025-07-04

- fix(tui): optimistic rendering (#692)
- fix input bar not rendering capital letters

## v0.1.192 — 2025-07-04

- chore: document `instructions` configuration option (#670)
- removed banned command concept
- fix(tui): slower startup due to file.status
- feat(tui): file attachments
- feat(tui): render attachments
- fix(tui): handle pdf and image @ files
- fix(tui): markdown wrapping off sometimes
- file attachments
- fix(tui): full paths for attachments
- make file attachments work good like

## v0.1.190 — 2025-07-04

- Update download stats 2025-07-04
- disable snapshots temporarily

## v0.1.189 — 2025-07-04

- improve snapshotting speed further

## v0.1.188 — 2025-07-04

- improve snapshot speed

## v0.1.187 — 2025-07-03

- chore: add dev script (#666)
- add elixir lsp support

## v0.1.186 — 2025-07-03

- chore: better local dev with stainless script
- chore: simplify completions
- fix /unshare

## v0.1.185 — 2025-07-03

- fix(tui): panic on completions failure

## v0.1.184 — 2025-07-03

- flag for disabling file watcher
- fix(tui): redundant tool calls in each message in collapsed mode

## v0.1.183 — 2025-07-03

- Update download stats 2025-07-03
- fix webdomain
- fix(tui): selected message visuals
- fix(tui): include orphaned tool calls
- increase max retries to 10

## v0.1.182 — 2025-07-03

- fix: properly handle utf-8 in diff highlighting (#585)
- fix: simplify parallel map using channels (#582)
- fix(tui): better highlight visuals
- fix(tui): always show status bar
- feat(tui): unshare command
- Update download stats 2025-07-03

## v0.1.181 — 2025-07-03

- do not install gopls if go is not installed

## v0.1.180 — 2025-07-03

./dist/opencode-darwin-x64.zip

## v0.1.179 — 2025-07-03

- remove need for glibc

## v0.1.178 — 2025-07-03

- fix(tui): change messages layout toggle keybinding from <leader>m to <leader>p

## v0.1.177 — 2025-07-02

- fix lazy loading
- fix(formatting): check for enabled formatters (#611)
- fix: Ensure shared file previews use truncated content (#607)
- fix: Copilot Premium Requests (#595)
- Changed handling of OpenRouter requests to add some custom headers so that it can see the app (#613)
- feat(tui): file viewer, select messages
- fix: typescript error
- fix: unawaited promise causes opencode to use unenabled formatter (#625)

## v0.1.176 — 2025-07-02

- fix filewatcher not closing cleanly
- fix lazy loading

## v0.1.175 — 2025-07-02

- chore: rename OpenCode to opencode (#579)
- fix: Small typo in CLI `--model` flag description (#577)
- fix(tui): no space between agent and user message (#598)
- Update download stats 2025-07-02

## v0.1.174 — 2025-07-02

- Temporarily add admin unshare api
- fix: handle null case if tool args are empty for todos (#588)
- improve ripgrep download

## v0.1.173 — 2025-07-01

- snapshot functionality
- add file watcher
- fix write tool timeout

## v0.1.172 — 2025-07-01

- feat: better model dialog with sorting by release date (#563)
- fix(tui): layout issues
- Update download stats 2025-07-01
- fix(tui): better message rendering performance

## v0.1.171 — 2025-07-01

- fix lsp diagnostic accurancy

## v0.1.170 — 2025-06-30

./dist/opencode-darwin-x64.zip

## v0.1.169 — 2025-06-30

- fix formatting of bash tools
- fix bash tool extra line
- chore: remove duplicate EditTool in TOOLS array (#556)

## v0.1.168 — 2025-06-30

- fix(tui): layout issues

## v0.1.167 — 2025-06-30

./dist/opencode-darwin-x64.zip

## v0.1.166 — 2025-06-30

- add ruby formatter and lsp
- Update download stats 2025-06-30
- fix(#467): more granular bedrock modelID based on aws region (#482)
- feat: update user and agent messages width and alignment (#515)
- chore: rework layout primitives

## v0.1.165 — 2025-06-30

- chore: add .editorconfig (#536)
- Formatters as plugins (#487)
- restructure formatters
- add zig, python, clang, and kotlin formatters

## v0.1.164 — 2025-06-29

- fix issue with costs resetting once chat is completed

## v0.1.163 — 2025-06-29

- Add Option to Disable MCP Servers (#513)
- Update download stats 2025-06-29
- Update download stats 2025-06-29
- Update STATS.md
- better amazon bedrock caching with anthropic models

## v0.1.162 — 2025-06-29

- fix context display
- Add Option to Disable MCP Servers (#513)

## v0.1.161 — 2025-06-28

- fix(tui): share command and error messages

## v0.1.160 — 2025-06-28

- patch for scroll dumping characters into input buffer

## v0.1.159 — 2025-06-28

./dist/opencode-darwin-x64.zip

## v0.1.158 — 2025-06-28

- feat(web): add scroll to last message button
- Merge branch 'sst:dev' into feat/scroll-to-bottom-button
- chore: rework openapi spec and use stainless sdk
- smooth out initial onboarding flow
- add auto formatting and experimental hooks feature
- fix: don't use prettier for langs it doesn't format
- fix formatting output going into tui
- fix(tui): min width on user messages
- scripts/hooks: Change shebang to universal /bin/sh (#453)
- fix(web): remove system prompts from share page
- feat: add elixir file formatting (#458)
- lazy load formatters
- fix: bunproc stdout / stderr parsing, error handling for bun ResolveMessage (#468)
- feat: Add golang file formatting (#474)
- temporary patch for input lag on initial run
- chore: rework openapi spec and use stainless sdk
- smooth out initial onboarding flow
- Merge branch 'jeremyosih-feat/scroll-to-bottom-button' into dev
- optimize edit-tool rendering (#463)

## v0.1.157 — 2025-06-27

- fix: bunproc stdout / stderr parsing, error handling for bun ResolveMessage (#468)
- feat: Add golang file formatting (#474)
- temporary patch for input lag on initial run

## v0.1.156 — 2025-06-27

./dist/opencode-darwin-x64.zip

## v0.1.153 — 2025-06-27

- fix(tui): min width on user messages
- scripts/hooks: Change shebang to universal /bin/sh (#453)
- fix(web): remove system prompts from share page
- feat: add elixir file formatting (#458)
- lazy load formatters

## v0.1.152 — 2025-06-27

- fix formatting output going into tui
- fix(tui): min width on user messages

## v0.1.151 — 2025-06-27

- fix: don't use prettier for langs it doesn't format

## v0.1.150 — 2025-06-27

./dist/opencode-darwin-x64.zip

## v0.1.148 — 2025-06-27

- add auto formatting and experimental hooks feature

## v0.1.146 — 2025-06-26

- chore: document AGENTS.md
- redirect uncaught errors to log file
- fix codex not working
- add output length errors
- make edit tool more robust
- integrate gemini-cli strategies for edit tool
- more edit tool fixes
- fix: guard against large output limit causing infinite summarize loop (#399)
- Fix `undefined is not an object (evaluating 'G.title')` (#395)
- feat: default system theme (#419)
- fix(tui): make opencode theme default
- fix(tui): editor spinner colors
- chore: tui agents.md
- fix(tui): visual issue with modal selected items in system theme
- fix(tui): chat editor aesthetics
- feat(tui): show lsp diagnostics for edit and write tools
- fix(tui): editor width issues
- feat(tui): more themes
- feat(tui): more themes
- fix(tui): editor styles were off
- Merge branch 'rekram1-node-chore/update-config-docs' into dev
- fix: improve JSON formatting and add piped output support for run command
- disable task tool temporarily

## v0.1.145 — 2025-06-26

- fix(tui): editor styles were off

## v0.1.144 — 2025-06-26

- feat(tui): more themes
- feat(tui): more themes

## v0.1.143 — 2025-06-26

- fix(tui): chat editor aesthetics
- feat(tui): show lsp diagnostics for edit and write tools
- fix(tui): editor width issues

## v0.1.142 — 2025-06-26

./dist/opencode-linux-arm64.zip

## v0.1.141 — 2025-06-26

- feat: default system theme (#419)

## v0.1.140 — 2025-06-26

- fix: guard against large output limit causing infinite summarize loop (#399)
- Fix `undefined is not an object (evaluating 'G.title')` (#395)

## v0.1.139 — 2025-06-25

./dist/opencode-linux-arm64.zip

## v0.1.138 — 2025-06-25

- integrate gemini-cli strategies for edit tool

## v0.1.137 — 2025-06-25

- add output length errors
- make edit tool more robust

## v0.1.136 — 2025-06-25

- fix codex not working

## v0.1.135 — 2025-06-25

- better error message when bad directory is specified to start in
- redirect uncaught errors to log file

## v0.1.133 — 2025-06-25

- do not print error on ctrl+c during prompts
- Enhance auth command with environment variable display and add models command
- better error message when bad directory is specified to start in

## v0.1.132 — 2025-06-25

- remove accidental opanai autoloader

## v0.1.131 — 2025-06-25

- fix: file completions replaced wrong text when paths overlap (#378)

## v0.1.130 — 2025-06-24

- windows fixes (#374)

## v0.1.129 — 2025-06-24

- potential fix for failing to install provider package on first run

## v0.1.128 — 2025-06-24

- feat: delete sessions (#362)

## v0.1.127 — 2025-06-24

- feat(tui): add debounce logic to escape key interrupt (#169)
- externalize github copilot code
- remove debug code writing to /tmp/message.json

## v0.1.126 — 2025-06-24

- add HOMEBREW_NO_AUTO_UPDATE to brew upgrades

## v0.1.125 — 2025-06-24

- fix: typescript error (any) from models (#347)
- force use npm registry

## v0.1.124 — 2025-06-23

./dist/opencode-linux-arm64.zip

## v0.1.123 — 2025-06-23

- Fix project folder name starting with "-" in data (#323). Note old session data will still be in the old format in `~/.local/share/opencode/projects` - you can remove the leading dash to recover the,
- bundle models.dev at build time and ignore refresh errors

## v0.1.122 — 2025-06-23

- feat(copilot): edit headers for better rate limit avoidance (#321)
- chore: unused import
- fix: markdown wrapping issue
- fix: overlay border color issues
- fix(tui): less incorrect escapingn of < and >
- fix help copy
- feat(tui): optimistically render user messages

## v0.1.121 — 2025-06-23

- aws autoload include more env vars
- more graceful mcp failures

## v0.1.120 — 2025-06-22

- fix(tui): mouse wheel escape codes leaking into input
- combine stdout and stderr in bash tool output (#300)
- fix: resolve test failures by adding missing zod-openapi import (#301)
- fix(tui): help dialog visuals
- fix(tui): color contrast fixes for nord
- Add Github Copilot OAuth authentication flow (#305)
- fix double entry of github copilot in auth login

## v0.1.119 — 2025-06-22

- fix: invisible html tags and compact long delay (#304)
- fix(tui): cleanup help dialog
- fix(tui): mouse wheel escape codes leaking into input

## v0.1.118 — 2025-06-22

- footer clarifies it's showing context usage, not input token usage
- Add error handling on the calls to the server to debug issue #132 (#137)
- Created a Theme inspired by the matrix (#285)
- fix: session title generation (#293)
- fix(tui): theme dialog visuals
- fix(tui): cleanup modal visuals

## v0.1.117 — 2025-06-21

- huge optimization for token usage with anthropic

## v0.1.116 — 2025-06-21

- handle brew upgrades better
- Add --method option to upgrade command for manual installation method selection

## v0.1.115 — 2025-06-20

./dist/opencode-linux-arm64.zip

## v0.1.114 — 2025-06-20

- fix(tui): visual tweaks to themes

## v0.1.113 — 2025-06-20

- Consolidate session context handling and add global config support
- fix issue with conversations hanging
- feat(tui): theme switcher with preview (#264)
- feat(tui): custom themes
- feat(tui): nord theme
- feat(tui): catppuccin theme
- feat(tui): gruvbox theme
- feat(tui): kanagawa theme
- feat(tui): one dark theme

## v0.1.111 — 2025-06-20

- feat: forward provider options from model config (#202)

## v0.1.110 — 2025-06-20

- fix(tui): input latency optimization
- fix(tui): async load messages on theme/session switch
- chore(tui): rename theme colors
- chore: use client_id everywhere (#260)
- fix(#243): claude on aws bedrock (#241)

## v0.1.109 — 2025-06-20

- fix(tui): input feels laggy
- fix(tui): insert newline correctly positioned
- chore: fix typescript issues
- fix(tui): typeahead open/close perf
- fix(tui): fetch tool more defensive

## v0.1.108 — 2025-06-20

- fix: phantom input bug on wsl (#200)
- config validation

## v0.1.107 — 2025-06-19

- fix for azure models not liking tool definitions

## v0.1.106 — 2025-06-19

- remove unused permission timeout

## v0.1.105 — 2025-06-19

- Infra: fix DO tag

## v0.1.104 — 2025-06-19

- fix gopls download spewing into terminal

## v0.1.103 — 2025-06-19

- fix(tui): upgrade notification

## v0.1.101 — 2025-06-19

- fix(tui): better help on home

## v0.1.100 — 2025-06-19

- fix(tui): better tool titles
- Copy changes

## v0.1.99 — 2025-06-19

- fix(tui): sorted tool arg maps
- fix: typescript error
- fix(tui): sorted tool arg maps
- feat(tui): better task tool rendering

## v0.1.98 — 2025-06-19

- add schema descriptions to config fields
- use production share url

## v0.1.97 — 2025-06-19

- fix(tui): overlay border backgrounds
- fix(tui): vscode and mac terminal colors
- allow selecting model and continuing previous session for opencode run
- fix task agent performance issues

## v0.1.96 — 2025-06-19

- feat(tui): toast messages
- feat(tui): more toast messages
- fix(tui): toast placement and overlay rendering
- chore: cleanup logs

## v0.1.95 — 2025-06-19

- fix webfetch tool when returning html as text

## v0.1.94 — 2025-06-19

- support token caching for anthropic via openrouter

## v0.1.93 — 2025-06-19

- feat(tui): copy share url to clipboard

## v0.1.92 — 2025-06-19

./dist/opencode-linux-arm64.zip

## v0.1.91 — 2025-06-19

- feat(tui): expand input to fit message

## v0.1.90 — 2025-06-19

- Update SST
- hooks
- Fixes tool tip layering (#199)
- fix: include schema in converted toml config
- ensure session.info is synced when shared

## v0.1.89 — 2025-06-19

- fix: incorrect command on main screen for exiting application (#201)

## v0.1.88 — 2025-06-19

- stop loading models.dev format from global config

## v0.1.87 — 2025-06-19

BREAKING CONFIG CHANGE
We have changed the config format yet again - but this should be the
final time. You can see the readme for more details but the summary is

- got rid of global providers config
- got rid of global toml
- global config is now in `~/.config/opencode/config.json`
- it will be merged with any project level config

- chore: cleanup logs
- share types
- fix(tui): modal visuals
- Api: only return session messages
- fix(tui): file completion quirks
- chore: tui style tweaks
- feat(tui): show provider next to model
- support global config
- Render version
- rework config

## v0.1.86 — 2025-06-18

- feat(tui): configurable keybinds and mouse scroll
- fix(tui): help dialog sorting

## v0.1.84 — 2025-06-18

./dist/opencode-linux-arm64.zip

## v0.1.83 — 2025-06-18

- fix panic when invalid config

## v0.1.82 — 2025-06-18

- implemented diff trimming
- track version on session info

## v0.1.81 — 2025-06-18

- allow setting options in global provider store

## v0.1.80 — 2025-06-18

- remove call to npm causing noticible delay when starting chat
- fix deploys
- fix issue with provider cache

## v0.1.78 — 2025-06-18

- fix issue when running opencode in empty directory

## v0.1.77 — 2025-06-18

- Add Everforest Theme (#170)

## v0.1.76 — 2025-06-18

- integrate cache read/write data

## v0.1.74 — 2025-06-17

- state
- improve anthropic oauth token caching and authentication handling

## v0.1.73 — 2025-06-17

- support disabling providers from automatically being added

## v0.1.72 — 2025-06-17

- support global config for providers

## v0.1.71 — 2025-06-17

- fix issue with tool schemas and google

## v0.1.70 — 2025-06-17

- fix agent getting caught in summary loop

## v0.1.69 — 2025-06-17

- Fix TypeScript compilation errors and consolidate version handling

## v0.1.67 — 2025-06-17

- Add autoshare configuration and improve run command UI
- chore: consolidate chat page into tui.go
- feat: better collapsed tool call visuals

## v0.1.66 — 2025-06-17

- do not autoupgrade snapshot builds

## v0.1.64 — 2025-06-17

- Improve upgrade command with installation method detection (#158)
- autoupgrade

## v0.1.63 — 2025-06-16

- fix: incorrect lipgloss version (#131)
- feat: share and init commands

## v0.1.62 — 2025-06-16

- remove windows builds

## v0.1.61 — 2025-06-16

- BREAKING CHANGE: the config structure has changed, custom providers have an `npm` field now to specify which npm package to load. see examples in README.md
- opencode auth login: validation on provider id and better error messages
- remove windows builds

## v0.1.60 — 2025-06-16

- fix: include cached tokens in tui
- limit to 4 system prompts cached

## v0.1.59 — 2025-06-16

- feat: even faster tui init
- feat: believe it or not, even faster tui init

## v0.1.58 — 2025-06-16

- feat: faster tui init

## v0.1.57 — 2025-06-16

- properly track cache token counts

## v0.1.56 — 2025-06-16

- chore: remove status service
- fix: default provider and model

## v0.1.55 — 2025-06-16

- fix: typo and literal wording in packages/opencode/AGENTS.md (#134)
- fix: spinner background color
- enable prompt caching for anthropic

## v0.1.54 — 2025-06-16

- enhance ripgrep files function with query filtering and limit support

## v0.1.53 — 2025-06-16

- Fix: Improve Help UI Readability (Issue #99) (#117)
- first pass making system prompt less fat

## v0.1.52 — 2025-06-15

- fix: spelling, grammar and typos (#121)
- fix: background color rendering issues

## v0.1.51 — 2025-06-15

- Improve LSP server initialization with timeout handling and skip failed servers

## v0.1.50 — 2025-06-15

- chore: ignore intellij, vscode (#122)
- fix postinstall script for node

## v0.1.49 — 2025-06-15

- beginning of upgrade command
- remove .DS_Store (#112)
- fix: background color rendering issues

## v0.1.48 — 2025-06-15

- revert ctrl+d - conflicts with page down

## v0.1.47 — 2025-06-15

- fix aborting issue
- revert ctrl+d - conflicts with page down

## v0.1.46 — 2025-06-15

- fix issue continuing session after aborted
- fix issue with follow up tool calls and cancelation

## v0.1.45 — 2025-06-15

- sync
- fix: improve browser opening error handling in AuthLoginCommand (#111)
- Add Ayu dark theme (#109)

## v0.1.44 — 2025-06-14

- make ctrl+d quit too, just like shells (#105)
- nit: update commands displayed on home to match commands available (#108)
- tui: fix help dialog background (#110)

## v0.1.43 — 2025-06-14

- typo (#94)
- add focus tracking for tui so cursor will hide when not in focus (#103)
- downgrade to ai sdk v4.x

## v0.1.42 — 2025-06-14

- tui: remove quit dialog (#97)
- Enhance provider system with dynamic package resolution and improved logging
- typo (#94)

## v0.1.41 — 2025-06-14

- sync

## v0.1.40 — 2025-06-14

- naming fixes

## v0.1.39 — 2025-06-14

- fix(install): check if the path export command already exists (#28)
- Improve logging and simplify fzf implementation
- Add flag system and auto-share functionality
- naming fixes

## v0.1.38 — 2025-06-14

- screenshot
- sync
- Clean up workflows and enhance file discovery tools to include dot files
- fix(install): check if the path export command already exists (#28)

## v0.1.37 — 2025-06-13



## v0.1.36 — 2025-06-13



## v0.1.35 — 2025-06-13

- feat: claude 4 opus
- Nord theme (#64)
- Update README.md
- pin install script

## v0.1.34 — 2025-06-13

- feat: claude 4 opus
- Nord theme (#64)
- Update README.md
- pin install script

## v0.1.33 — 2025-06-13

- feat: claude 4 opus
- Nord theme (#64)
- Update README.md
- pin install script

## v0.1.32 — 2025-06-13

- feat: claude 4 opus
- Nord theme (#64)
- Update README.md
- pin install script

## v0.1.31 — 2025-06-13

- feat: claude 4 opus
- Nord theme (#64)
- Update README.md

## v0.1.30 — 2025-06-13



## v0.0.52 — 2025-05-22

## Changelog
* 2f8984fadb24ba7b369d0d09c6ad4823f7f48a63 Codex mini (#34)
* c84918cb47d17c10286985bce7539161dfd13869 feat: Add message history navigation with arrow keys (#30)
* 6e854a4df4e4933d478e5eb1d48ccb34db610194 fix: disable history navigation when filepicker is open (#39)
* 05bb065d00e00e21bffd6312162cf9de92421dce fix: log pane text wrapping (#32)
* daf03052032e3349ff1b8236d38df43230454949 fix: split out bedrock models
* 37429978898100cb0038d92a54cef8ec65018f70 fix: typo
* 2b258b14732c9a0f50cc3552a27ebf0f68be4e53 switch default to claude sonnet 4



## v0.0.51 — 2025-05-17

## Changelog
* d127a1c4ebe326344dc77fe3d136c033da6031fd feat: 0-255 color support in custom themes
* 623d132772b9c69dd6d99ed4004b26c46dbe43a4 feat: Add non-interactive mode (#18)
* 307982a0990f597608258b7de053fbf852d8dee3 feat: Add tool restriction flags for non-interactive mode (#29)
* b71cae63f1b59cc3f095912d040b915312d144ff feat: Add tools dialog accessible via F9 (#24)
* 4a444e9c9b7674c6b07a1a012a6467e45c3af1ec feat: Make shell configurable via config file (#23)
* c92f7c6630c5a4d010ea0c80380f2dbb6dd7e3e1 fix: Show correct file paths in permission window (#25)
* ba416e787b651ea045ff955eb32c0e7109a169e8 paste images with ctrl+v (#26)



## v0.0.50 — 2025-05-15

## Changelog
* 3944930fc04a57c3da9c80d9d7377effd1277004 chore: cleanup
* 87237b6462b9dfd379b22e69712e8dc516afad9d feat: support VertexAI provider (#153)
* 825c0b64af785e1bac6fa7ecb288725011b18768 fix: build
* b112216241ce6f17bd020d5299669c2eb0aa791d fix: build
* c9cca48d087cd512cea0b26a0245cbb1a64981a9 fix: layout
* d7af7dd3fefedb4484eddebeafb0fb5c48440233 fix: redundant status msg



## v0.0.49 — 2025-05-15

## Changelog
* 5f5f9dad877300bab3fe5442ea141551ba89421b add support to preview webp images and paste file paths
* ab150be7c393a91d9fb2347b7012ad2f7d77700b feat: Support named arguments in custom commands (#158)
* a65e593ab4f35e1a647832ba36be2c696e1f5165 feat: batch tool
* ddbb217d0d9f707f22610433664e15362cf98202 feat: better status bar
* a850320fadeb77a42913150f6631efe5b495134e fix: don't limit session logs
* aa8b3ce1eedff364e4b2b325f63b538a784ea01f fix: init ordering
* 5d9058eb74581091d84b2cd935927da636b3dd37 fix: tui height



## v0.0.48 — 2025-05-15

## Changelog
* acc084c9eaff715788acbcdde3f335b11132d02d chore(complete-module): lint
* a33e3e25b6646b6128975836d7f182e89f5eb891 chore: cleanup dead code
* 658faab2bfe387f639569af930f8b912052721c7 chore: update icon in readme
* 15bf40bc102ed5426fa2148b9e8f39acef1174a0 feat(complete-module): add completions logic, dialog and providers
* 797045ee29616f57025a6b44decd4dcfa795f8b0 feat: add configuration persistence for model selections
* a203fb8cccf45d74fb217bdc579155ee058af248 fix(complete-module): change completion start key to slash
* 3ee213081ec6bf42f6947d03e256319c29a8ce0e fix(complete-module): logging



## v0.0.47 — 2025-05-14

## Changelog
* 182e32e4f77a15154211806de5e6d324487f5d47 add screenshot
* c8f8d67a88cd8237b75ca9ee0e28555c2d501bfc feat: codeAction tool



## 0.0.47 — 2025-05-14

## Changelog
* 182e32e4f77a15154211806de5e6d324487f5d47 add screenshot
* c8f8d67a88cd8237b75ca9ee0e28555c2d501bfc feat: codeAction tool



## 0.0.45 — 2025-05-14

## Changelog
- auto LSP discovery/configuration
- auto-compact/summarize for indefinite sessions
- new logs page
- improved visuals
- a SHIT TON of fixes, performance stuff, stuff that was clearly just broken, lots of refactoring



