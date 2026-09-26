## v7.8.1 — 2026-09-25

## VS Code

### 7.8.1

#### Patch Changes

- [#14513](https://github.com/Kilo-Org/kilocode/pull/14513) [`03b5606`](https://github.com/Kilo-Org/kilocode/commit/03b56063453b0fbb1cdb66be4181cffe6c741580) - Publish CycloneDX software bills of materials alongside every release artifact. Each CLI archive, npm package, container image, VS Code extension, and JetBrains plugin now ships a machine-readable inventory of its components, bound to the artifact's SHA-256 and signed as a GitHub attestation.

### 7.8.0

#### Minor Changes

- [#13804](https://github.com/Kilo-Org/kilocode/pull/13804) [`9f739b0`](https://github.com/Kilo-Org/kilocode/commit/9f739b045b69c41ea70a7e6f441092797da53d93) - Support public HTTPS pages and public CDN resources in localhost previews with a high-resolution streamed Agent Manager browser. Explain missing browser installations and provide download, retry, and settings actions. Keep clipboard actions ordered, honor page clipboard handlers, and close stalled browser sessions without waiting on renderer input. Preserve native cross-origin request checks while blocking unowned browser pages.

- [#13808](https://github.com/Kilo-Org/kilocode/pull/13808) [`430e6cf`](https://github.com/Kilo-Org/kilocode/commit/430e6cf1f1e1677a9efcadb60557983cf076664f) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Add commands to close the current task or all visible task tabs.

- [#14540](https://github.com/Kilo-Org/kilocode/pull/14540) [`277103f`](https://github.com/Kilo-Org/kilocode/commit/277103f4d2d7c6ae82a400f224ed7e116de51f7d) Thanks [@vkeerthivikram](https://github.com/vkeerthivikram)! - Add a stop button to session cleanup: a running cleanup pass can now be stopped from the settings screen. Already-deleted sessions stay deleted, the interrupted pass records its partial result, and the session database reclaims the freed disk space.

#### Patch Changes

- [#14449](https://github.com/Kilo-Org/kilocode/pull/14449) [`f677743`](https://github.com/Kilo-Org/kilocode/commit/f677743b94fe860cad5d11e52070b79e2b77e230) - Support Azure Entra ID sign-in with a resource name or full endpoint URL, including when the value comes from the connect dialog instead of `AZURE_RESOURCE_NAME`. Also block variable references in project MCP headers nested under `mcp.servers`.

- [#14491](https://github.com/Kilo-Org/kilocode/pull/14491) [`b6eece6`](https://github.com/Kilo-Org/kilocode/commit/b6eece6e6e5ff0c96c30396e7ede0627605b270d) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Run Explain Code, Fix Code, Improve Code, and Add to Context when the sidebar is showing History, switching to the chat first.

- [#14536](https://github.com/Kilo-Org/kilocode/pull/14536) [`66d36d4`](https://github.com/Kilo-Org/kilocode/commit/66d36d41d0e808580c0a30e4c57f0869f9d41de5) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Keep chats opened from "Load more" in History open when returning to History or reloading VS Code.

- Adopt OpenCode v1.18.21 through v1.18.26 improvements, including Cloudflare AI Gateway routing and Anthropic model ID fixes, parent session headers for session-aware providers, Azure Microsoft Entra ID sign-in through the Azure CLI, V2 config field compatibility in V1 reads, more reliable Bedrock reasoning handling and GPT-5.6 `none` reasoning effort, tolerance for stale Claude 5 thinking blocks, accurate tool-call timing during metadata updates, and OpenAI-compatible providers no longer receiving an unsupported `textVerbosity` value.

- [#14557](https://github.com/Kilo-Org/kilocode/pull/14557) [`9a6abc0`](https://github.com/Kilo-Org/kilocode/commit/9a6abc0fb81ef0437540a7d9757fe6d8b7aabdc3) - Keep inaccessible historical folders from blocking project startup, and recover Agent Manager initialization when selecting a healthy project.

- [#14556](https://github.com/Kilo-Org/kilocode/pull/14556) [`8f80a09`](https://github.com/Kilo-Org/kilocode/commit/8f80a09c27b8e61975f7682eb5c81cc5b63bb8fd) - Fix Agent Manager worktree creation failing when a pooled worktree slot is deleted on disk. The pool now evicts the stale slot and falls back to a normal worktree, and worktree creation failures are written to the Output channel.

### 7.7.12

#### Minor Changes

- [#14510](https://github.com/Kilo-Org/kilocode/pull/14510) [`c06228d`](https://github.com/Kilo-Org/kilocode/commit/c06228d6a0090307331a572d726348b7ad3df722) - Install MCP servers with companion skills from the marketplace, preview the included skills, and remove owned skills with the server.

- [#14490](https://github.com/Kilo-Org/kilocode/pull/14490) [`bfa384d`](https://github.com/Kilo-Org/kilocode/commit/bfa384dc326ecb1146933f80670755117a048deb) - Animate tool calls in chat more smoothly. New tool rows rise into place, their details reveal as input arrives, the icon shows when a tool is working and when it finishes, and the transcript glides instead of jumping when output or results appear. To-dos tick off as they finish, and write, edit, and patch rows show the file path, command, and a live change count while the model is still writing them. History and session switches stay still. The reasoning headline no longer jumps between a long and a short title while it streams.

- [#14533](https://github.com/Kilo-Org/kilocode/pull/14533) [`3380e16`](https://github.com/Kilo-Org/kilocode/commit/3380e167c2aef2c0232f49cacdc3fe5e1d87f63e) - Enable task subagent model selection by default and remove the `experimental.task_model_selection` flag. You can now request a model, provider, or reasoning effort for an individual subagent task without enabling an experiment.

#### Patch Changes

- [#14535](https://github.com/Kilo-Org/kilocode/pull/14535) [`3499a48`](https://github.com/Kilo-Org/kilocode/commit/3499a48d97cc3dd38f14c1432fc63e0d03d591c6) - Preserve the loaded page in the Agent Manager browser panel when switching between worktrees, projects, or sessions.

- [#14531](https://github.com/Kilo-Org/kilocode/pull/14531) [`89f0cba`](https://github.com/Kilo-Org/kilocode/commit/89f0cbad721733723191a436b91c435dfe9de714) - Fix Agent Manager session recovery and model providers when the CLI backend reconnects during startup.

- [#14529](https://github.com/Kilo-Org/kilocode/pull/14529) [`df604a1`](https://github.com/Kilo-Org/kilocode/commit/df604a1710869e29f24fe87e4246cea724b36bb3) - Preserve selected tabs, tab order, and review context when switching between projects and worktrees in Agent Manager.

- [#14532](https://github.com/Kilo-Org/kilocode/pull/14532) [`4e86042`](https://github.com/Kilo-Org/kilocode/commit/4e86042270437c3251250559c67f336b43e7ec89) - Keep Agent Manager session tab titles in sync after renaming a session.

- [#14534](https://github.com/Kilo-Org/kilocode/pull/14534) [`4bbed24`](https://github.com/Kilo-Org/kilocode/commit/4bbed242e2a56476c6e091d689c4163a95032f5f) - Fix the chat transcript getting stuck in a constant re-render after switching to some sessions with expanded edit diffs, which made worktree and session switching slow.

- [#14530](https://github.com/Kilo-Org/kilocode/pull/14530) [`9394c52`](https://github.com/Kilo-Org/kilocode/commit/9394c523380f9b6bbeb887f54f4c394e1ffa1901) - Do not create the `.kilo/worktrees` directory when worktree pre-warming is turned off.

- Updated dependencies [[`c06228d`](https://github.com/Kilo-Org/kilocode/commit/c06228d6a0090307331a572d726348b7ad3df722)]:
  - @kilocode/sdk@7.8.0
  - @kilocode/kilo-ui@7.7.10
  - @kilocode/plugin@7.7.10
  - @opencode-ai/ui@7.7.10
  - @opencode-ai/core@7.7.10
  - @kilocode/kilo-gateway@7.7.10
  - @kilocode/kilo-indexing@7.7.10

## CLI

### 7.8.1

#### Patch Changes

- [#14513](https://github.com/Kilo-Org/kilocode/pull/14513) [`03b5606`](https://github.com/Kilo-Org/kilocode/commit/03b56063453b0fbb1cdb66be4181cffe6c741580) - Publish CycloneDX software bills of materials alongside every release artifact. Each CLI archive, npm package, container image, VS Code extension, and JetBrains plugin now ships a machine-readable inventory of its components, bound to the artifact's SHA-256 and signed as a GitHub attestation.

### 7.8.0

#### Minor Changes

- [#13804](https://github.com/Kilo-Org/kilocode/pull/13804) [`9f739b0`](https://github.com/Kilo-Org/kilocode/commit/9f739b045b69c41ea70a7e6f441092797da53d93) - Support public HTTPS pages and public CDN resources in localhost previews with a high-resolution streamed Agent Manager browser. Explain missing browser installations and provide download, retry, and settings actions. Keep clipboard actions ordered, honor page clipboard handlers, and close stalled browser sessions without waiting on renderer input. Preserve native cross-origin request checks while blocking unowned browser pages.

- [#14540](https://github.com/Kilo-Org/kilocode/pull/14540) [`277103f`](https://github.com/Kilo-Org/kilocode/commit/277103f4d2d7c6ae82a400f224ed7e116de51f7d) Thanks [@vkeerthivikram](https://github.com/vkeerthivikram)! - Add a stop button to session cleanup: a running cleanup pass can now be stopped from the settings screen. Already-deleted sessions stay deleted, the interrupted pass records its partial result, and the session database reclaims the freed disk space.

#### Patch Changes

- [#14449](https://github.com/Kilo-Org/kilocode/pull/14449) [`f677743`](https://github.com/Kilo-Org/kilocode/commit/f677743b94fe860cad5d11e52070b79e2b77e230) - Support Azure Entra ID sign-in with a resource name or full endpoint URL, including when the value comes from the connect dialog instead of `AZURE_RESOURCE_NAME`. Also block variable references in project MCP headers nested under `mcp.servers`.

- [#14502](https://github.com/Kilo-Org/kilocode/pull/14502) [`249cd72`](https://github.com/Kilo-Org/kilocode/commit/249cd725942a07b3df01810660460db73afdc1a8) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Keep sub-agent sessions during automatic session cleanup while their parent chat is still in use.

- Adopt OpenCode v1.18.21 through v1.18.26 improvements, including Cloudflare AI Gateway routing and Anthropic model ID fixes, parent session headers for session-aware providers, Azure Microsoft Entra ID sign-in through the Azure CLI, V2 config field compatibility in V1 reads, more reliable Bedrock reasoning handling and GPT-5.6 `none` reasoning effort, tolerance for stale Claude 5 thinking blocks, accurate tool-call timing during metadata updates, and OpenAI-compatible providers no longer receiving an unsupported `textVerbosity` value.

- [#14557](https://github.com/Kilo-Org/kilocode/pull/14557) [`9a6abc0`](https://github.com/Kilo-Org/kilocode/commit/9a6abc0fb81ef0437540a7d9757fe6d8b7aabdc3) - Keep inaccessible historical folders from blocking project startup, and recover Agent Manager initialization when selecting a healthy project.

- [#14540](https://github.com/Kilo-Org/kilocode/pull/14540) [`277103f`](https://github.com/Kilo-Org/kilocode/commit/277103f4d2d7c6ae82a400f224ed7e116de51f7d) Thanks [@vkeerthivikram](https://github.com/vkeerthivikram)! - Reclaim disk space after session cleanup: the session database now shrinks on disk once a cleanup pass frees enough pages, instead of keeping the old file size forever.

- [#14449](https://github.com/Kilo-Org/kilocode/pull/14449) [`b1ea859`](https://github.com/Kilo-Org/kilocode/commit/b1ea859d2f10fb7a7ddee98a26942256d5195a75) - Allow settings saves in configs containing supported V2 values while preserving comments, existing config syntax, and Kilo-specific settings.

- [#13523](https://github.com/Kilo-Org/kilocode/pull/13523) [`d6bb0ef`](https://github.com/Kilo-Org/kilocode/commit/d6bb0ef058cef3d993cf4390810aeea9dd00e0a5) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Show network-disconnect errors inline in the TUI instead of appearing to hang: the error (e.g. "Connection refused") is displayed with a "waiting for network" hint while the session waits for connectivity, and it resumes automatically once the network is back. Requests that stall on a dead connection are now detected after ~10 seconds of provider silence instead of hanging forever: they wait for connectivity when nothing has streamed yet, or surface a visible network error when output was already received. The offline check probes the provider's own endpoint over TCP — the same configured URL the SDK requests — so slow local models, private DNS endpoints, and busy servers are never mistaken for a dead network.

### 7.7.12

#### Minor Changes

- [#14508](https://github.com/Kilo-Org/kilocode/pull/14508) [`e09883c`](https://github.com/Kilo-Org/kilocode/commit/e09883c19ac7e1e1ba895b217cbb9f6dcf8aa13d) - Support MCP OAuth client metadata documents while preserving dynamic registration and configured client credentials.

- [#14510](https://github.com/Kilo-Org/kilocode/pull/14510) [`c06228d`](https://github.com/Kilo-Org/kilocode/commit/c06228d6a0090307331a572d726348b7ad3df722) - Install MCP servers with companion skills from the marketplace, preview the included skills, and remove owned skills with the server.

- [#14533](https://github.com/Kilo-Org/kilocode/pull/14533) [`3380e16`](https://github.com/Kilo-Org/kilocode/commit/3380e167c2aef2c0232f49cacdc3fe5e1d87f63e) - Enable task subagent model selection by default and remove the `experimental.task_model_selection` flag. You can now request a model, provider, or reasoning effort for an individual subagent task without enabling an experiment.

#### Patch Changes

- [#14480](https://github.com/Kilo-Org/kilocode/pull/14480) [`5e05988`](https://github.com/Kilo-Org/kilocode/commit/5e05988b17ced03fb040476c8748c86eae992e31) - Deliver plan completion questions to directory-scoped clients such as JetBrains without requiring a reconnect.

- Updated dependencies [[`c06228d`](https://github.com/Kilo-Org/kilocode/commit/c06228d6a0090307331a572d726348b7ad3df722)]:
  - @kilocode/sdk@7.8.0
  - @kilocode/plugin@7.7.10
  - @opencode-ai/tui@7.7.10
  - @opencode-ai/ui@7.7.10
  - @kilocode/kilo-gateway@7.7.10
  - @kilocode/kilo-indexing@7.7.10
  - @kilocode/plugin-atomic-chat@7.7.10
  - @opencode-ai/server@7.7.10
  - @kilocode/kilo-telemetry@7.7.10

## jetbrains/v7.1.8 — 2026-09-25

### Added

- Add Checkpoints settings for snapshots and automatic session cleanup, including manual cleanup controls and the latest cleanup result.
- Install companion skills when adding MCP servers from the marketplace.
- Publish CycloneDX software bills of materials alongside JetBrains release artifacts.
- Support MCP servers that use client ID metadata documents for OAuth registration.

### Fixed

- Avoid a crash when reloading or unloading the JetBrains plugin while editor history still references Kilo virtual files.
- Keep model selection isolated to each session, including overlapping agent runs and cleanup.
- Keep sub-agents that belong to an active chat during session cleanup.
- Make background-agent and todo strip headers expand, collapse, and highlight consistently while keeping expanded agent links actionable.
- Show specific revert guidance when snapshots are disabled, a checkpoint is unavailable, or the project is not a Git repository.

### Changed

- Reclaim database space after session cleanup and allow cleanup to be stopped.
- Speed up switching between worktree session editor tabs with long transcripts and reduce unnecessary Agent Manager list repainting.
- Trim single-line transcript labels more consistently with an ellipsis when they overflow.


## v7.7.9 — 2026-09-23

## VS Code

### 7.7.9

#### Minor Changes

- [#14444](https://github.com/Kilo-Org/kilocode/pull/14444) [`f85f62c`](https://github.com/Kilo-Org/kilocode/commit/f85f62ca72b24d41e09cc1a7f8b2b3b15109bc87) - Add Close to the Right to the Agent Manager tab menu. It closes the session, terminal, and review tabs that sit after the target tab and keeps pinned tabs open.

- [#14485](https://github.com/Kilo-Org/kilocode/pull/14485) [`9088b7d`](https://github.com/Kilo-Org/kilocode/commit/9088b7d0b261f725505cdb6a3da906ab885d0680) - Install Marketplace plugins from a git repository. Plugin catalog entries can now use a git source such as `git:github.com/owner/repo@v1.2.3#subdir`, so a plugin can be distributed from a public repository without publishing to npm. The client clones the repository at the pinned ref into the plugin cache and loads the plugin from there.

- [#14281](https://github.com/Kilo-Org/kilocode/pull/14281) [`7c59855`](https://github.com/Kilo-Org/kilocode/commit/7c59855ff37416ff40e9ef2b47b851d1ed01634e) - Install plugins from the Kilo Marketplace. The Marketplace now lists plugin items alongside agents, skills, and MCP servers, and installing one adds the npm package to Kilo's plugin configuration for the chosen project or global scope. Removing a plugin item cleans the configuration entry again.

- [#14446](https://github.com/Kilo-Org/kilocode/pull/14446) [`fccda25`](https://github.com/Kilo-Org/kilocode/commit/fccda25ca19275156714c0b6195f558934957423) - Add pinning and Close to the Right to the sidebar session tabs. Pinned tabs stay at the front and survive Close Others and Close to the Right.

#### Patch Changes

- [#14482](https://github.com/Kilo-Org/kilocode/pull/14482) [`ae5cfbc`](https://github.com/Kilo-Org/kilocode/commit/ae5cfbc53156bbb2be362b2650372bf97e5a7ece) - Show the latest output of long-running terminal commands in chat. Bash output now keeps the end of the stream instead of the start, follows new lines while the command runs, and stops following while you scroll up.

- [#14487](https://github.com/Kilo-Org/kilocode/pull/14487) [`c887e66`](https://github.com/Kilo-Org/kilocode/commit/c887e66c88d0d8a6b901d15cea68c2d69f4e5ea4) - Keep Agent Manager status icons current for sessions in other projects. A session that reconnects after a network drop no longer shows "Error or connection lost.", and completed, failed, waiting, and scheduled states now also update while another project is selected.

- [#14447](https://github.com/Kilo-Org/kilocode/pull/14447) [`390b92c`](https://github.com/Kilo-Org/kilocode/commit/390b92cf974da361dcfeed52e45582bf745d1715) - Show the full arguments of a pending MCP tool call in the permission prompt so they can be inspected before approval, including nested objects and arrays.

- [#13513](https://github.com/Kilo-Org/kilocode/pull/13513) [`3add597`](https://github.com/Kilo-Org/kilocode/commit/3add59707346f6f14f33c3dd6e7c4132d578e301) - Adopt OpenCode v1.18.19 through v1.18.20 improvements, including subagent error and permission handling in non-interactive runs, network and stream error retry coverage, Cerebras completion limit handling, Cloudflare AI Gateway support, and TUI reasoning status updates.

- [#14464](https://github.com/Kilo-Org/kilocode/pull/14464) [`b9dc741`](https://github.com/Kilo-Org/kilocode/commit/b9dc741b11a5e86db1832e60cac1de1fc9c326b9) - Explain that file checkpoints require Git when a revert cannot restore files. Reverting in a folder that is not a Git repository now shows "File checkpoints require a Git repository" instead of the generic "No file checkpoint was available" notice.

- [#14484](https://github.com/Kilo-Org/kilocode/pull/14484) [`065bc5c`](https://github.com/Kilo-Org/kilocode/commit/065bc5c2e7a0779853f6231a215f2a1990c5fdd3) - Keep session costs complete after reopening paginated conversations, including nested subagents without counting their parents or siblings.

- [#14486](https://github.com/Kilo-Org/kilocode/pull/14486) [`d52cd88`](https://github.com/Kilo-Org/kilocode/commit/d52cd889df656d5624c8ad5242e178f8db2a1f0f) - Fix messages and tool calls above the last reply sometimes disappearing after switching sessions until the transcript was scrolled.

- [#14361](https://github.com/Kilo-Org/kilocode/pull/14361) [`f27140a`](https://github.com/Kilo-Org/kilocode/commit/f27140aceff68b4bdd0862eb1cb35a0c93ed307e) - Render streaming shell output faster in the chat transcript by highlighting only the lines that changed since the previous chunk instead of rebuilding the whole output block on every update.

- Updated dependencies [[`065bc5c`](https://github.com/Kilo-Org/kilocode/commit/065bc5c2e7a0779853f6231a215f2a1990c5fdd3)]:
  - @kilocode/sdk@7.7.8
  - @kilocode/kilo-ui@7.7.8
  - @kilocode/plugin@7.7.8
  - @opencode-ai/ui@7.7.8
  - @opencode-ai/core@7.7.8
  - @kilocode/kilo-gateway@7.7.8
  - @kilocode/kilo-indexing@7.7.8

## CLI

### 7.7.9

#### Minor Changes

- [#14445](https://github.com/Kilo-Org/kilocode/pull/14445) [`1ac7cc1`](https://github.com/Kilo-Org/kilocode/commit/1ac7cc17003f4c4ecf2a19c5932f7cdd2af7f08e) - Let the agent start or resume a session goal itself with the `goal` tool. The agent's call arms the goal without cancelling the current turn, then the goal loop continues after that turn. The tool uses the `goal` permission, which is allowed by default and can be set to `ask` or `deny`.

- [#14312](https://github.com/Kilo-Org/kilocode/pull/14312) [`dfeeb48`](https://github.com/Kilo-Org/kilocode/commit/dfeeb48bd8f4e15fabb7c7c2deade0b199687be6) - Add a `monitor` action to the `background_process` tool that streams a long command's output back as it arrives, bounded by a line cap (default 200) and a wall-time cap (default 120000 ms) so a waiting agent reads progress instead of polling `logs`. Existing `background_process` actions are unchanged. Add session cron scheduling through `cron_create`, `cron_list`, and `cron_delete`: a recurring 5-field expression or a one-shot time/delay fires the session between turns after it goes idle, missed windows are not replayed, fire times carry deterministic jitter, each task expires seven days after creation, and tasks survive `--resume`.

- [#14268](https://github.com/Kilo-Org/kilocode/pull/14268) [`f330846`](https://github.com/Kilo-Org/kilocode/commit/f3308468990769a6f8303b6b49c833f1b44fae82) - Add experimental `get_context_info` and `compact` tools that let an agent inspect and compact its own context. Reach them with `KILO_EXPERIMENTAL=1`, or `KILO_EXPERIMENTAL_CONTEXT_TOOLS=true`.

- [#14485](https://github.com/Kilo-Org/kilocode/pull/14485) [`9088b7d`](https://github.com/Kilo-Org/kilocode/commit/9088b7d0b261f725505cdb6a3da906ab885d0680) - Install Marketplace plugins from a git repository. Plugin catalog entries can now use a git source such as `git:github.com/owner/repo@v1.2.3#subdir`, so a plugin can be distributed from a public repository without publishing to npm. The client clones the repository at the pinned ref into the plugin cache and loads the plugin from there.

- [#14281](https://github.com/Kilo-Org/kilocode/pull/14281) [`7c59855`](https://github.com/Kilo-Org/kilocode/commit/7c59855ff37416ff40e9ef2b47b851d1ed01634e) - Install plugins from the Kilo Marketplace. The Marketplace now lists plugin items alongside agents, skills, and MCP servers, and installing one adds the npm package to Kilo's plugin configuration for the chosen project or global scope. Removing a plugin item cleans the configuration entry again.

#### Patch Changes

- [#14318](https://github.com/Kilo-Org/kilocode/pull/14318) [`5edf432`](https://github.com/Kilo-Org/kilocode/commit/5edf432c2f4a34f333ff4e498e111d6f854cbe95) - An empty compaction response no longer replaces the conversation; the CLI reports that compaction did not run and lets you retry with /compact.

- [#14315](https://github.com/Kilo-Org/kilocode/pull/14315) [`3fbb454`](https://github.com/Kilo-Org/kilocode/commit/3fbb454a4c3efdbf613a54212520c7a1990c970b) - Link a session to its pull request reliably, on GitHub, GitLab and Bitbucket. An explicit link (`link_pr`, `kilo pr link`, or the app's set-PR-link action) always wins, and a check every 5 minutes asks the session's own git host whether an open pull request exists for its branch. A stale link is cleared when that check finds the pull request no longer open, so the app row updates when the pull request closes.

- [#14492](https://github.com/Kilo-Org/kilocode/pull/14492) [`43f5d55`](https://github.com/Kilo-Org/kilocode/commit/43f5d5551a77ccb1140388bd62f08c74510da2c0) - Fix git-hosted Marketplace plugins so `~/` repository paths resolve, a failed clone leaves no staging directory, and POSIX paths that contain a backslash are preserved. The plugin install dialog no longer describes every plugin as an npm plugin.

- [#14196](https://github.com/Kilo-Org/kilocode/pull/14196) [`49df20f`](https://github.com/Kilo-Org/kilocode/commit/49df20fc74661e237df91f4a83d2b22560663e86) - Fix `kilo mcp auth` failing at the last step when another Kilo process touches the same MCP server while the browser tab is open: the OAuth flow now keeps its own state and PKCE verifier instead of reading them back from the process-shared `mcp-auth.json`, and every remaining failure names the step that failed (the token exchange, the browser authorization, a timeout, or a superseded authorization attempt). Running `kilo mcp auth` for the same server at the same time in two terminals now works too: the newer attempt takes the local callback listener over, the later browser tab completes, and the earlier command reports that it was replaced.

- [#13513](https://github.com/Kilo-Org/kilocode/pull/13513) [`3add597`](https://github.com/Kilo-Org/kilocode/commit/3add59707346f6f14f33c3dd6e7c4132d578e301) - Adopt OpenCode v1.18.19 through v1.18.20 improvements, including subagent error and permission handling in non-interactive runs, network and stream error retry coverage, Cerebras completion limit handling, Cloudflare AI Gateway support, and TUI reasoning status updates.

- [#14448](https://github.com/Kilo-Org/kilocode/pull/14448) [`9340d34`](https://github.com/Kilo-Org/kilocode/commit/9340d34f5297919a436e22e0ff87d6f1c8a816cf) - Fix provider initialization failing with an HTTP 500 when `enabled_providers` excludes Kilo while a Kilo login is stored. Excluded providers are now skipped before their auth loader runs.

- [#14464](https://github.com/Kilo-Org/kilocode/pull/14464) [`b9dc741`](https://github.com/Kilo-Org/kilocode/commit/b9dc741b11a5e86db1832e60cac1de1fc9c326b9) - Explain that file checkpoints require Git when a revert cannot restore files. Reverting in a folder that is not a Git repository now shows "File checkpoints require a Git repository" instead of the generic "No file checkpoint was available" notice.

- [#14484](https://github.com/Kilo-Org/kilocode/pull/14484) [`065bc5c`](https://github.com/Kilo-Org/kilocode/commit/065bc5c2e7a0779853f6231a215f2a1990c5fdd3) - Keep session costs complete after reopening paginated conversations, including nested subagents without counting their parents or siblings.

- Updated dependencies [[`065bc5c`](https://github.com/Kilo-Org/kilocode/commit/065bc5c2e7a0779853f6231a215f2a1990c5fdd3)]:
  - @kilocode/sdk@7.7.8
  - @kilocode/plugin@7.7.8
  - @opencode-ai/tui@7.7.8
  - @opencode-ai/ui@7.7.8
  - @kilocode/kilo-gateway@7.7.8
  - @kilocode/kilo-indexing@7.7.8
  - @kilocode/plugin-atomic-chat@7.7.8
  - @opencode-ai/server@7.7.8
  - @kilocode/kilo-telemetry@7.7.8

## jetbrains/v7.1.7 — 2026-09-23

### Added

- Fold and unfold large pasted text blocks directly from the prompt input and transcript.
- Add a Marketplace page to JetBrains settings for browsing, installing, and removing marketplace agents, MCP servers, and skills without leaving the IDE.
- Install Marketplace plugins from npm packages or from a git repository (for example `git:github.com/owner/repo@v1.2.3#subdir`).
- Add Kilo Swarm support to JetBrains, including an Agent Behavior toggle, readable board tool cards, and a board viewer for session collaboration.
- Add a cleanup flow for leftover Agent Manager worktree folders, with size reporting, git-checkout warnings, and safe removal from JetBrains.
- Add unique avatars for subagents and a background agents strip in the session header, with a collapsed preview so active work stays visible without expanding the panel.
- Add copy path and reveal actions when nested worktree deletion is blocked.
- Add CLI support for background process monitoring, session cron scheduling, pull request linking, and experimental self-context tools.

### Fixed

- Pause the working timer while waiting on a permission prompt or a question.
- Prevent snapshot progress from hanging a session.
- Keep diagnostics edits responsive during large edits.
- Warn when posting to the shared board targets a stopped subagent.
- Keep a session goal running when a new message arrives instead of dropping it.
- Only route auxiliary tasks to `kilo-auto/small` when using Kilo credentials.
- Stop looping on repeated malformed tool calls.
- Keep Keep Awake active while a wakeup is scheduled, and clear it when a session with pending wakeups is deleted.
- Speed up local recall searches and improve match ranking.
- Link sessions to their pull requests without a slow, timed `gh pr view` probe.
- Submit and cancel custom answers correctly in the question dialog.
- Format detailed code review findings as distinct sections.
- Collapse pasted text in JetBrains only after larger 15-line or 4000-character blocks, matching VS Code and avoiding over-folding ordinary snippets.
- Recover shared agent board reads when a stale or foreign cursor appears, instead of leaving a sub-agent stuck on repeated tool errors.
- Reduce unnecessary sandbox escalation prompts for read-only `git` and `gh` commands while keeping mutating commands protected.
- Stop a slow `gh` lookup from blanking PR badges.
- Make worktree runs use the worktree's own logs and npm configs.
- Wrap long session status messages instead of clipping them in the JetBrains UI.
- Normalize markdown line endings before rendering, preventing unexpected formatting breaks in JetBrains chat.
- Recover pending questions and permission prompts after reconnecting to an existing session.
- Use normal session model defaults when creating sessions in new worktrees.
- Ground selected-code prompts in the active editor selection so the agent receives the intended context.
- Remove deselected models from custom OpenAI-compatible providers, including delete-and-recreate flows and providers saved in another settings scope.
- Improve Swarm board readability by wrapping long messages, keeping the board open while navigating, and adding copy-all.
- Explain that file checkpoints require Git when a revert cannot restore files, showing "File checkpoints require a Git repository" instead of the generic "No file checkpoint was available" notice.
- Keep Agent Manager attention badges in sync with resolved prompts, surface sandbox escalation permissions, and center status glyphs.
- Keep JetBrains worktree session tabs responsive by deferring and batching transcript updates accumulated while a tab is hidden.
- Fix the JetBrains shared board dialog layout when resizing and remove redundant message hover tooltips.
- Add missing JetBrains release locale keys and guard localized bundles against stale entries.
- Fix git-hosted Marketplace plugins so `~/` repository paths resolve, a failed clone leaves no staging directory, POSIX paths with a backslash are preserved, and uninstalling a plugin deletes its cloned cache when no scope still uses it.

### Changed

- Speed up the first worktree snapshot by skipping unnecessary re-hashing of the checkout.
- Skip resolving the source project when moving sessions without changes, for faster session moves.


## v7.7.7 — 2026-09-22

## VS Code

### 7.7.7

#### Patch Changes

- Adopt OpenCode v1.18.14 through v1.18.15 improvements, including message ordering fixes, compaction serialization, locale coverage, and TUI enhancements.

- Adopt OpenCode v1.18.16 through v1.18.18 improvements, including conversation-aware compaction, expanded reasoning effort support, provider compatibility fixes, and retry handling.

- [#14360](https://github.com/Kilo-Org/kilocode/pull/14360) [`675ed4b`](https://github.com/Kilo-Org/kilocode/commit/675ed4b12d9a11d4fa1c103ee3f2dc24e417a550) - Retry transient connection drops when approving permissions so auto-approve and manual approvals no longer leave agents waiting.

## CLI

### 7.7.7

#### Patch Changes

- Adopt OpenCode v1.18.14 through v1.18.15 improvements, including message ordering fixes, compaction serialization, locale coverage, and TUI enhancements.

- Adopt OpenCode v1.18.16 through v1.18.18 improvements, including conversation-aware compaction, expanded reasoning effort support, provider compatibility fixes, and retry handling.

## v7.7.6 — 2026-09-21

## VS Code

### 7.7.6

#### Minor Changes

- [#14054](https://github.com/Kilo-Org/kilocode/pull/14054) [`3b6746c`](https://github.com/Kilo-Org/kilocode/commit/3b6746c05aa631c10d2132f09e0d66cd8355e1eb) Thanks [@vkeerthivikram](https://github.com/vkeerthivikram)! - Reintroduce automatic session cleanup in Settings > Checkpoints. Keep it off by default and apply the configured retention period across all projects and Kilo clients on the machine. Protect running sessions and sessions with a recent fork, confirm manual cleanup, and show live session-level progress with a spinner and processed, deleted, and failed counts. Avoid scanning unrelated session history and preserve progress when status updates are delayed.

- [#14301](https://github.com/Kilo-Org/kilocode/pull/14301) [`f03ebe3`](https://github.com/Kilo-Org/kilocode/commit/f03ebe3cfef67c1b0da07b84a1ecfa185a1b9942) - Create new Git projects and clone repositories directly from Agent Manager. Choose where projects are stored and attach them without changing the VS Code workspace. Adding a project or cloning a repository that is already present opens the existing project instead of creating a duplicate, and a repository whose checkout failed can still be attached.

  Create empty, unsigned bootstrap commits without normal commit hooks, while preserving staged files and Git configuration.

- [#14282](https://github.com/Kilo-Org/kilocode/pull/14282) [`d0475a6`](https://github.com/Kilo-Org/kilocode/commit/d0475a6f5ca7081a0fbc117b73d79e6adf913d95) - Label prompts that Kilo sends on your behalf, such as worktree updates from base, expanded slash commands, and editor or terminal code actions, with a "Sent by Kilo" header. Long prompts collapse to their first paragraph with a "Show prompt" toggle to inspect the full text, and reverting or editing a turn restores the command instead of the full template.

- [#14344](https://github.com/Kilo-Org/kilocode/pull/14344) [`83d276a`](https://github.com/Kilo-Org/kilocode/commit/83d276a8701bea1d1cfe180821562b2833870fdf) - Load older chats on demand in the session history with a "Load more" control instead of stopping at the 100 most recent. Paging works across the workspace and every worktree directory.

- [#14346](https://github.com/Kilo-Org/kilocode/pull/14346) [`65702ab`](https://github.com/Kilo-Org/kilocode/commit/65702ab0decee832217288d8d21ba5194cf24163) - Preview session display settings with an automatic sample conversation that streams reasoning, tool progress, and an answer beside the controls.

  Apply review-focused or compact display presets from settings, and use the same display defaults during onboarding.

- [#14292](https://github.com/Kilo-Org/kilocode/pull/14292) [`8c724ef`](https://github.com/Kilo-Org/kilocode/commit/8c724efe59222fc6e448f9e6c429a9c9eec09f27) - Show a clock status on Agent Manager tabs and worktrees when a session is waiting for a scheduled wakeup.

#### Patch Changes

- [#13979](https://github.com/Kilo-Org/kilocode/pull/13979) [`fbdbe11`](https://github.com/Kilo-Org/kilocode/commit/fbdbe11082e172b9ddcdb93dd9492e7ef0d98827) Thanks [@mardausdennis](https://github.com/mardausdennis)! - Pin Agent Manager session tabs. Right-click a session tab and choose Pin to move it to the front of the tab bar; pinned tabs keep that position across reloads, survive Close Others, and can be dragged among themselves. Unpin returns the tab to its normal spot.

- [#14349](https://github.com/Kilo-Org/kilocode/pull/14349) [`1030bdb`](https://github.com/Kilo-Org/kilocode/commit/1030bdbe52885bce040e4bbb36ea871fbaf17600) - Focus the Changes diff viewport when the diff shortcut opens it or its reading content is clicked, show its complete focus border only while it owns reading focus, and restore the previous prompt or opener when it closes. Keep delayed prompt recovery from stealing diff focus, release diff focus on outside clicks, and route paste from non-editable areas to the prompt. Scroll a page with Shift+ArrowDown or Shift+ArrowUp when the diff viewport itself has focus and no text is selected.

- [#14348](https://github.com/Kilo-Org/kilocode/pull/14348) [`24898d5`](https://github.com/Kilo-Org/kilocode/commit/24898d57bf80ab940a4538056fff5d158f1ef383) - Stop session progress spinners when sessions finish in a background project, and recover their status after reconnecting.

- [#14333](https://github.com/Kilo-Org/kilocode/pull/14333) [`74717ee`](https://github.com/Kilo-Org/kilocode/commit/74717eeb0cc9dc1d3002ccc13929540b4af27609) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Fix the chat prompt sending the wrong text after a collapsed paste chip is deleted.

- [#14324](https://github.com/Kilo-Org/kilocode/pull/14324) [`238aff2`](https://github.com/Kilo-Org/kilocode/commit/238aff2ce90a0d128b6b9a2c05494a16eade5571) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Anchor review comments to the right list item when a markdown file separates its list items with blank lines.

- [#14322](https://github.com/Kilo-Org/kilocode/pull/14322) [`f47c29d`](https://github.com/Kilo-Org/kilocode/commit/f47c29dfe9ef1e8c760ed1fb4db17ec522120ea5) Thanks [@BambinoSK](https://github.com/BambinoSK)! - Remember the unified/split choice in Kilo diff viewers. Toggling the style once persists it for future diff viewers.

- [#14286](https://github.com/Kilo-Org/kilocode/pull/14286) [`5bbad4c`](https://github.com/Kilo-Org/kilocode/commit/5bbad4c2d65110cfe1abeb21ce282dce2663de3c) - Retry transient backend connection drops instead of surfacing a "terminated" error.

- [#14343](https://github.com/Kilo-Org/kilocode/pull/14343) [`9d81d4a`](https://github.com/Kilo-Org/kilocode/commit/9d81d4a22daebd1dd669cb9ae8fbfce4d2d440a0) - Translate session cleanup progress and error messages in all supported languages.

## CLI

### 7.7.6

#### Patch Changes

- [#13340](https://github.com/Kilo-Org/kilocode/pull/13340) [`f3d6d09`](https://github.com/Kilo-Org/kilocode/commit/f3d6d0947a30216fade139615205bfe1a093f0f4) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Fix auto-compaction triggering far below the configured context threshold. The threshold now applies to the context window shown in the UI and is anchored to provider-reported token usage plus newly added content, instead of an inflated estimate of the whole payload on models with separate input limits. New system prompts and tool schemas are counted even when a provider report is available, and cancelled responses or reports that omit input usage no longer leave later content uncounted. On models whose input limit is smaller than their context window, the reserved input safety buffer can still trigger compaction before a high configured percentage is reached.

- [#14351](https://github.com/Kilo-Org/kilocode/pull/14351) [`a7d1596`](https://github.com/Kilo-Org/kilocode/commit/a7d1596339f236654898762a8db0b6adaeabfc50) Thanks [@jezdez](https://github.com/jezdez)! - Support encrypted reasoning from OpenAI models accessed through Amazon Bedrock.

- [#14282](https://github.com/Kilo-Org/kilocode/pull/14282) [`d0475a6`](https://github.com/Kilo-Org/kilocode/commit/d0475a6f5ca7081a0fbc117b73d79e6adf913d95) - Label prompts that Kilo sends on your behalf, such as worktree updates from base, expanded slash commands, and editor or terminal code actions, with a "Sent by Kilo" header. Long prompts collapse to their first paragraph with a "Show prompt" toggle to inspect the full text, and reverting or editing a turn restores the command instead of the full template.

- [#14216](https://github.com/Kilo-Org/kilocode/pull/14216) [`5c366fa`](https://github.com/Kilo-Org/kilocode/commit/5c366fa5097a8e87db744ffc580ace3c551d1f46) Thanks [@grandmaster451](https://github.com/grandmaster451)! - Stop MCP server requests from repeating once per second when the server answers the optional GET stream probe with a body that is not an event stream. The response is now reported as "no stream on this endpoint", which the MCP client treats as supported.

- [#14345](https://github.com/Kilo-Org/kilocode/pull/14345) [`02353b0`](https://github.com/Kilo-Org/kilocode/commit/02353b0c959c5596db0576c3227f47cb7d1a8209) - Project skills, agents, commands, and instruction files that contain `${env:...}` or `${file:...}` placeholders now load instead of failing with an environment reference error. The placeholders stay literal there, while project JSON config still rejects them.

- [#14283](https://github.com/Kilo-Org/kilocode/pull/14283) [`18c0384`](https://github.com/Kilo-Org/kilocode/commit/18c03848a5f7d6231626b76b1ed86525faa82d51) - Always include the saved plan file hint when switching from Plan to Code, and remove the vestigial `KILO_EXPERIMENTAL_PLAN_MODE` flag.

- [#14335](https://github.com/Kilo-Org/kilocode/pull/14335) [`be871f3`](https://github.com/Kilo-Org/kilocode/commit/be871f3867da8a4f85ce3b473312ede389edafa3) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Report what `semantic_search` actually covered. It names the indexed root it searched, and an empty result now says whether the index was complete, still building, disabled, or failed, so a miss is no longer mistaken for code that does not exist.

## v7.7.5 — 2026-09-18

## VS Code

### 7.7.5

#### Minor Changes

- [#14251](https://github.com/Kilo-Org/kilocode/pull/14251) [`b3ef153`](https://github.com/Kilo-Org/kilocode/commit/b3ef15319edd94b481f50821fc350a467f28e327) - Add `@model`, `@past-chats`, and `@worktrees` mentions to the Agent Manager New Worktree prompt. Past chats and worktrees are sent as attachments to the new session, and model references stay inline text.

- [#14249](https://github.com/Kilo-Org/kilocode/pull/14249) [`d73b514`](https://github.com/Kilo-Org/kilocode/commit/d73b5145d6b8bc75125549c02c436eb94f987046) - Run worktree-independent slash commands from the Agent Manager New Worktree prompt. Custom commands, skills, MCP prompts, and /goal now appear in the prompt menu and execute when a new worktree is created. Typing /goal alone starts a two-step flow, so the objective can be entered before the session starts.

#### Patch Changes

- [#14274](https://github.com/Kilo-Org/kilocode/pull/14274) [`d162846`](https://github.com/Kilo-Org/kilocode/commit/d162846963f2e82196b1a7f58c004c166e8587a3) - Keep the Agent Manager `.kilo` directory out of git in subdirectory workspaces and avoid creating it in folders that are not git repositories.

- [#14277](https://github.com/Kilo-Org/kilocode/pull/14277) [`d8eaefd`](https://github.com/Kilo-Org/kilocode/commit/d8eaefdf1d84fa6779c8cb1634ef516948d76f06) - Recover permission approval dialogs that stall instead of leaving the approval buttons disabled.

- [#14280](https://github.com/Kilo-Org/kilocode/pull/14280) [`815a81b`](https://github.com/Kilo-Org/kilocode/commit/815a81b46cadc7854af1e4a89524fed0080db070) - Fix a memory leak that made Agent Manager session switching slower the longer the window stayed open. Tool card fade animations kept unmounted transcript rows alive.

- Updated dependencies [[`d8eaefd`](https://github.com/Kilo-Org/kilocode/commit/d8eaefdf1d84fa6779c8cb1634ef516948d76f06)]:
  - @kilocode/sdk@7.7.5
  - @kilocode/kilo-ui@7.7.5
  - @kilocode/plugin@7.7.5
  - @opencode-ai/ui@7.7.5
  - @opencode-ai/core@7.7.5
  - @kilocode/kilo-gateway@7.7.5
  - @kilocode/kilo-indexing@7.7.5

## CLI

### 7.7.5

#### Patch Changes

- [#14279](https://github.com/Kilo-Org/kilocode/pull/14279) [`cfc786a`](https://github.com/Kilo-Org/kilocode/commit/cfc786a0f014ed22c660455e6f6da25677231cec) - Keep the model's behaviour in sync with the selected agent after switching. Every agent change now adds one reminder that names the previous and current agent and states whether the current agent may modify files, based on its configured permissions. This covers built-in, custom, and organization agents, and fixes Ask still trying to edit files after switching from Code back to Ask.

- [#14284](https://github.com/Kilo-Org/kilocode/pull/14284) [`bab87b4`](https://github.com/Kilo-Org/kilocode/commit/bab87b4abe6c05aa44e0cc6332422fc7bff56017) - Stop denying read-only bash commands in Ask, Plan, and Explore modes when a shell operator is only literal text, such as `grep "=>"`, `rg "foo|bar"`, or `cat <<'EOF'` bodies, or when output is discarded with `2>/dev/null` or `2>&1`. Real file redirects, pipes, chaining, and command substitution are still denied.

- Updated dependencies [[`d8eaefd`](https://github.com/Kilo-Org/kilocode/commit/d8eaefdf1d84fa6779c8cb1634ef516948d76f06)]:
  - @kilocode/sdk@7.7.5
  - @kilocode/plugin@7.7.5
  - @opencode-ai/tui@7.7.5
  - @opencode-ai/ui@7.7.5
  - @kilocode/kilo-gateway@7.7.5
  - @kilocode/kilo-indexing@7.7.5
  - @kilocode/plugin-atomic-chat@7.7.5
  - @opencode-ai/server@7.7.5
  - @kilocode/kilo-telemetry@7.7.5

## v7.7.4 — 2026-09-18

## VS Code

### 7.7.4

#### Minor Changes

- [#14233](https://github.com/Kilo-Org/kilocode/pull/14233) [`b07646f`](https://github.com/Kilo-Org/kilocode/commit/b07646fc078dd7d5bc117a36f195a879f228b201) - Open Mermaid diagrams in a fullscreen zoom viewer with zoom in/out, reset, mouse-wheel zoom, and drag-to-pan

- [#14255](https://github.com/Kilo-Org/kilocode/pull/14255) [`4881829`](https://github.com/Kilo-Org/kilocode/commit/4881829c38d41ae92671508784d3523ece54a8fe) - Leftover worktree folders now show a count and total size in the warning banner, with a "Resolve…" action that opens a dialog listing each folder's path, size, and whether it still holds a git checkout. While the total is still being measured the banner says so, and if the measurement fails it reports the count alone instead of claiming 0 B. Measuring stops as soon as you start a delete, or whenever the folder list changes, rather than walking folders that are on their way out, and then re-measures whatever is left. The dialog's explanation starts collapsed to its first paragraph behind a "Show more" link, and its checkboxes are drawn the way each IDE draws its own. Deletion runs in the background so the UI never freezes, folders that still contain a checkout are unchecked by default, and a completion notification reports how many were removed. Worktree deletion is also more thorough: JetBrains now tears down backend state and removes the snapshot repository for a deleted worktree the same way VS Code already does, and a directory that reappears immediately after deletion is cleaned up once more automatically.

#### Patch Changes

- [#14230](https://github.com/Kilo-Org/kilocode/pull/14230) [`6b5e8a0`](https://github.com/Kilo-Org/kilocode/commit/6b5e8a04e4d73a03c2a9a47c11f3639114588a32) - Add an experimental Programmatic Tool Calling setting under Settings > Experimental. When enabled, the agent calls MCP tools from a confined JavaScript program and discovers tools on demand, so fewer MCP tool definitions are sent to the model. The `KILO_EXPERIMENTAL_CODE_MODE` environment variable still enables it.

- [#14231](https://github.com/Kilo-Org/kilocode/pull/14231) [`7e0ce5e`](https://github.com/Kilo-Org/kilocode/commit/7e0ce5ec6db0d9472dbcc94f8e4a50f1adaa50a0) - Generate chat session titles after a turn provides enough context instead of from the first message alone. A short first message now keeps the placeholder title until the session has a longer request, a second message, or real tool work, so titles describe the actual task rather than a bare URL or a truncated first line.

- [#14225](https://github.com/Kilo-Org/kilocode/pull/14225) [`88d2315`](https://github.com/Kilo-Org/kilocode/commit/88d23150b6b0a5f24d120f7ebe5ce43b0c95a718) - Prevent failed status notifications from leaving completed sessions marked busy and blocking reload.

- [#14015](https://github.com/Kilo-Org/kilocode/pull/14015) [`12b44cb`](https://github.com/Kilo-Org/kilocode/commit/12b44cb7cb09fdfa175804897f59716cc51f8141) Thanks [@intentionally-left-nil](https://github.com/intentionally-left-nil)! - Fix "missing x-opencode-session" errors from memory consolidation, prompt enhancement, and the roll-call diagnostic command when using an OpenCode-managed model.

- [#14255](https://github.com/Kilo-Org/kilocode/pull/14255) [`8bc3e84`](https://github.com/Kilo-Org/kilocode/commit/8bc3e84d2be23d9b96900071ec3fcf901de01794) - Move the Agent Manager leftover worktree folder notice to the top of the worktree list and rework its cleanup dialog to match VS Code, including an explanation of what the listed folders are before any bulk delete

- [#14221](https://github.com/Kilo-Org/kilocode/pull/14221) [`6c066a5`](https://github.com/Kilo-Org/kilocode/commit/6c066a58771bc9c2a9c20ca5de4bd2ff9f1a0467) - Hide voice input in remote VS Code windows, where microphone capture runs on the remote machine and fails, and explain the limit in the Speech to Text settings

- [#14226](https://github.com/Kilo-Org/kilocode/pull/14226) [`9f45df5`](https://github.com/Kilo-Org/kilocode/commit/9f45df567e1b77090d1f28925e42eecb16ae566c) - Explain sandbox escalation prompts accurately: approval runs the whole command outside the sandbox for that command only, and Bash allow rules and auto-approve never cover it.

- [#14237](https://github.com/Kilo-Org/kilocode/pull/14237) [`9d2a46f`](https://github.com/Kilo-Org/kilocode/commit/9d2a46fbc491e27a3494ca1fa90d053aec8d1c37) - Improve chat responsiveness when switching sessions and sending prompts, and keep the transcript pinned without flicker while a turn streams

## CLI

### 7.7.4

#### Patch Changes

- [#14262](https://github.com/Kilo-Org/kilocode/pull/14262) [`7467f7a`](https://github.com/Kilo-Org/kilocode/commit/7467f7a8aa6dee929e64f10a9c552136e025851e) - Keep the current turn's reasoning variant when an Agent Manager task names the same model.

- [#14236](https://github.com/Kilo-Org/kilocode/pull/14236) [`74869c8`](https://github.com/Kilo-Org/kilocode/commit/74869c8833f39e8f2e46cba5f06dd6acd2a8e8fa) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Recover shared board reads when their cursor is no longer valid.

- [#14230](https://github.com/Kilo-Org/kilocode/pull/14230) [`6b5e8a0`](https://github.com/Kilo-Org/kilocode/commit/6b5e8a04e4d73a03c2a9a47c11f3639114588a32) - Add an experimental Programmatic Tool Calling setting under Settings > Experimental. When enabled, the agent calls MCP tools from a confined JavaScript program and discovers tools on demand, so fewer MCP tool definitions are sent to the model. The `KILO_EXPERIMENTAL_CODE_MODE` environment variable still enables it.

- [#14231](https://github.com/Kilo-Org/kilocode/pull/14231) [`7e0ce5e`](https://github.com/Kilo-Org/kilocode/commit/7e0ce5ec6db0d9472dbcc94f8e4a50f1adaa50a0) - Generate chat session titles after a turn provides enough context instead of from the first message alone. A short first message now keeps the placeholder title until the session has a longer request, a second message, or real tool work, so titles describe the actual task rather than a bare URL or a truncated first line.

- [#14225](https://github.com/Kilo-Org/kilocode/pull/14225) [`88d2315`](https://github.com/Kilo-Org/kilocode/commit/88d23150b6b0a5f24d120f7ebe5ce43b0c95a718) - Prevent failed status notifications from leaving completed sessions marked busy and blocking reload.

- [#14195](https://github.com/Kilo-Org/kilocode/pull/14195) [`864831e`](https://github.com/Kilo-Org/kilocode/commit/864831efaa6d3565a23d342db46d1f3fbdac7a72) - Keep the pull request link a session reports available to `kilo pr status` after the session exits, so GitLab merge requests and Bitbucket pull requests link the same way GitHub pull requests do.

- [#14195](https://github.com/Kilo-Org/kilocode/pull/14195) [`864831e`](https://github.com/Kilo-Org/kilocode/commit/864831efaa6d3565a23d342db46d1f3fbdac7a72) - Link CLI sessions to GitLab merge requests and Bitbucket pull requests, not only GitHub PRs.

- [#14223](https://github.com/Kilo-Org/kilocode/pull/14223) [`13e05d0`](https://github.com/Kilo-Org/kilocode/commit/13e05d06696f6de8c4e56e104f12f28b4fe8d26a) - Allow read-only `gh` commands such as `gh pr view` and `gh issue list` in Plan and Ask modes and the Explore agent without a prompt.

- [#14214](https://github.com/Kilo-Org/kilocode/pull/14214) [`a728fbf`](https://github.com/Kilo-Org/kilocode/commit/a728fbf8f3d209ee8631d9fa8ea6d0afbe6f919d) - Log the remote sessions `kilo remote` runs: one line when a session starts and one when it ends, with the session id, start time, model, working directory, exit reason and duration.

- [#14226](https://github.com/Kilo-Org/kilocode/pull/14226) [`9f45df5`](https://github.com/Kilo-Org/kilocode/commit/9f45df567e1b77090d1f28925e42eecb16ae566c) - Explain sandbox escalation prompts accurately: approval runs the whole command outside the sandbox for that command only, and Bash allow rules and auto-approve never cover it.

- [#14222](https://github.com/Kilo-Org/kilocode/pull/14222) [`f90dc84`](https://github.com/Kilo-Org/kilocode/commit/f90dc846fc52ce8560307ca012c5f4bd485ae7f0) - Stop asking to leave the sandbox for read-only git commands such as `git remote -v`, `git stash list`, and `git branch -v`.

## v7.7.3 — 2026-09-17

## VS Code

### 7.7.3

#### Major Changes

- [#14209](https://github.com/Kilo-Org/kilocode/pull/14209) [`3eaf47b`](https://github.com/Kilo-Org/kilocode/commit/3eaf47ba52179d385a1945c0be323c5d8fa2b4ee) - Remove KiloClaw: the VS Code chat panel and sidebar button, the `/kiloclaw` TUI command and chat view, the Kilo Chat client and token handling, and the `kilo.claw.status` and `kilo.claw.chatCredentials` gateway endpoints.

#### Minor Changes

- [#14204](https://github.com/Kilo-Org/kilocode/pull/14204) [`d202c80`](https://github.com/Kilo-Org/kilocode/commit/d202c80ea9d7c23df90305e20c4182e3d7059b6b) - Animate the Kilo logo on the welcome screen: hover the mark to see it turn and play the yellow slot-machine animation.

- [#13519](https://github.com/Kilo-Org/kilocode/pull/13519) [`9e61d68`](https://github.com/Kilo-Org/kilocode/commit/9e61d686699002a0a940084b62974a73932d76c3) - Show ChatGPT Codex quota alongside other provider usage in the CLI and VS Code.

- [#14170](https://github.com/Kilo-Org/kilocode/pull/14170) [`36771e6`](https://github.com/Kilo-Org/kilocode/commit/36771e61926911280d135f606fd35411ebc46759) - Show large pasted text in the prompt input as an expandable `[Pasted ~N lines]` block that restores the full text when expanded, copied, or sent.

- [#14137](https://github.com/Kilo-Org/kilocode/pull/14137) [`91040bc`](https://github.com/Kilo-Org/kilocode/commit/91040bcff4995784ad36ad9dcaa6f8d1bbb2b652) - Report worktree problems accurately and repair them: stale entries are cleaned up on their own, a deleted worktree can be restored from its branch or removed while keeping its sessions, leftover folders are listed with a cleanup action, and a failed status check now says so instead of showing a worktree as unchanged. Pull request lookups no longer stall on an unresponsive GitHub CLI, a single broken worktree no longer slows down the others, and deleting a worktree while its status is being checked no longer hides review and CI badges on every other worktree until the IDE restarts. The cleanup notice now marks leftover folders that still contain a git checkout and warns that they may hold uncommitted work, and removing a stale worktree entry no longer fails when its terminals cannot be stopped. New "Show Worktree Diagnostics" command in VS Code and "Copy report" action in JetBrains settings.

#### Patch Changes

- [#14200](https://github.com/Kilo-Org/kilocode/pull/14200) [`78a4d93`](https://github.com/Kilo-Org/kilocode/commit/78a4d932a664d998e54c154d2a1405ba244eeb6c) - Fix Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y undo and redo in the chat input, including on non-Latin keyboard layouts

- [#14210](https://github.com/Kilo-Org/kilocode/pull/14210) [`8437096`](https://github.com/Kilo-Org/kilocode/commit/8437096975098889d0955b3a4c07b8cc9ce1b02c) - Restrict chat search to user and assistant messages, so reasoning blocks, tool calls, and tool output no longer produce matches

- [#14185](https://github.com/Kilo-Org/kilocode/pull/14185) [`b51f2e3`](https://github.com/Kilo-Org/kilocode/commit/b51f2e388364d9994bdf9ed50e48e061dcc4ec61) - Fix document previews reporting "Document is outside the worktree" for files inside the project when the path casing differs

- [#14206](https://github.com/Kilo-Org/kilocode/pull/14206) [`634d1a7`](https://github.com/Kilo-Org/kilocode/commit/634d1a777803b71ba28d51da18fcc345d479cfec) - Make Agent Manager worktree deletion near-instant in large repositories: the directory is detached without waiting for other git operations, backend cleanup no longer boots an instance for the worktree, and checkpoint cleanup finishes in the background. A worktree whose conversations cannot be re-homed is still deleted instead of leaving an undeletable card.

- [#14199](https://github.com/Kilo-Org/kilocode/pull/14199) [`98918cd`](https://github.com/Kilo-Org/kilocode/commit/98918cd691df15261666b98f4499b2991f30613e) - Render inline edit and write diffs in the chat with the same gutter bars, word highlighting, and colors as the diff viewer, and keep them mounted while the tool streams.

- [#14183](https://github.com/Kilo-Org/kilocode/pull/14183) [`3a98691`](https://github.com/Kilo-Org/kilocode/commit/3a98691ca1d4deb4910f185cc39672494caa93f2) - Reload the pull request diff after a review comment is rejected because its snapshot expired, so the comment can be posted again without reopening the review.

- [#14180](https://github.com/Kilo-Org/kilocode/pull/14180) [`dd2f2f9`](https://github.com/Kilo-Org/kilocode/commit/dd2f2f9a977891920896d5bc371468fde8f0f76e) Thanks [@WebReflection](https://github.com/WebReflection)! - Keep model and reasoning choices when switching modes, and remember explicit new-session choices as the default without changing open sessions.
  - Keep an untouched draft on Default reasoning when selecting a different effort in another draft.
  - Keep the model and reasoning effort together when a mode-only command starts a new session.

- [#14208](https://github.com/Kilo-Org/kilocode/pull/14208) [`1d187e8`](https://github.com/Kilo-Org/kilocode/commit/1d187e857d5e6a7af10438da11eec89d325633fe) - Remove the deprecated `/local-review` and `/local-review-uncommitted` command aliases. Use `/review` with its scopes instead.

- [#14049](https://github.com/Kilo-Org/kilocode/pull/14049) [`c6936a7`](https://github.com/Kilo-Org/kilocode/commit/c6936a7453ab61e244fb9727090af1038c68a075) - Restore built-in Playwright browser automation and its settings under Web Tools. Keep the experimental Integrated Browser independent and allow its panel to open before selecting a session.

- [#14142](https://github.com/Kilo-Org/kilocode/pull/14142) [`68879be`](https://github.com/Kilo-Org/kilocode/commit/68879beb36220fbbe9895eff8112689714c95853) Thanks [@mondalaci](https://github.com/mondalaci)! - Restore chat prompt focus when returning to VS Code if the prompt was focused before the window was deactivated.

- [#14170](https://github.com/Kilo-Org/kilocode/pull/14170) [`9be66de`](https://github.com/Kilo-Org/kilocode/commit/9be66de3514c482face9361e4fccf97db96ab394) - Keep large review diffs from jumping when file rows are re-created at a different panel width.

- [#14201](https://github.com/Kilo-Org/kilocode/pull/14201) [`5bf040e`](https://github.com/Kilo-Org/kilocode/commit/5bf040ea69cda7d53641acca8977037fef779792) - Load skills from `skills.paths` entries written with a leading slash, such as `/.github/skills`, by falling back to the project root when no such directory exists at the filesystem root. Show skills in the VS Code slash menu under their own Skills group and list a skill that shares a name with a command as `/name:skill`.

- [#14203](https://github.com/Kilo-Org/kilocode/pull/14203) [`96b2b16`](https://github.com/Kilo-Org/kilocode/commit/96b2b16aeb2af98f5a65c3553f3fc5a191f2207c) - Keep the chat transcript steady while the agent works. A question prompt no longer disappears for a moment when it is answered, updates that arrive in the same frame now paint once, the view stays pinned to the bottom while a permission is pending or the composer grows, and expanded edit diffs no longer collapse and re-expand when they scroll back into view.

- Updated dependencies [[`3eaf47b`](https://github.com/Kilo-Org/kilocode/commit/3eaf47ba52179d385a1945c0be323c5d8fa2b4ee)]:
  - @kilocode/kilo-gateway@8.0.0
  - @kilocode/sdk@8.0.0
  - @opencode-ai/core@7.7.3
  - @kilocode/kilo-indexing@7.7.3
  - @kilocode/kilo-ui@7.7.3
  - @kilocode/plugin@7.7.3
  - @opencode-ai/ui@7.7.3

## CLI

### 7.7.3

#### Major Changes

- [#14209](https://github.com/Kilo-Org/kilocode/pull/14209) [`3eaf47b`](https://github.com/Kilo-Org/kilocode/commit/3eaf47ba52179d385a1945c0be323c5d8fa2b4ee) - Remove KiloClaw: the VS Code chat panel and sidebar button, the `/kiloclaw` TUI command and chat view, the Kilo Chat client and token handling, and the `kilo.claw.status` and `kilo.claw.chatCredentials` gateway endpoints.

#### Minor Changes

- [#13519](https://github.com/Kilo-Org/kilocode/pull/13519) [`9e61d68`](https://github.com/Kilo-Org/kilocode/commit/9e61d686699002a0a940084b62974a73932d76c3) - Show ChatGPT Codex quota alongside other provider usage in the CLI and VS Code.

#### Patch Changes

- [#14206](https://github.com/Kilo-Org/kilocode/pull/14206) [`634d1a7`](https://github.com/Kilo-Org/kilocode/commit/634d1a777803b71ba28d51da18fcc345d479cfec) - Make Agent Manager worktree deletion near-instant in large repositories: the directory is detached without waiting for other git operations, backend cleanup no longer boots an instance for the worktree, and checkpoint cleanup finishes in the background. A worktree whose conversations cannot be re-homed is still deleted instead of leaving an undeletable card.

- [#14208](https://github.com/Kilo-Org/kilocode/pull/14208) [`1d187e8`](https://github.com/Kilo-Org/kilocode/commit/1d187e857d5e6a7af10438da11eec89d325633fe) - Remove the deprecated `/local-review` and `/local-review-uncommitted` command aliases. Use `/review` with its scopes instead.

- [#14201](https://github.com/Kilo-Org/kilocode/pull/14201) [`5bf040e`](https://github.com/Kilo-Org/kilocode/commit/5bf040ea69cda7d53641acca8977037fef779792) - Load skills from `skills.paths` entries written with a leading slash, such as `/.github/skills`, by falling back to the project root when no such directory exists at the filesystem root. Show skills in the VS Code slash menu under their own Skills group and list a skill that shares a name with a command as `/name:skill`.

- Updated dependencies [[`3eaf47b`](https://github.com/Kilo-Org/kilocode/commit/3eaf47ba52179d385a1945c0be323c5d8fa2b4ee)]:
  - @kilocode/kilo-gateway@8.0.0
  - @kilocode/sdk@8.0.0
  - @kilocode/kilo-indexing@7.7.3
  - @kilocode/kilo-telemetry@7.7.3
  - @kilocode/plugin@7.7.3
  - @opencode-ai/tui@7.7.3
  - @opencode-ai/ui@7.7.3
  - @opencode-ai/server@7.7.3
  - @kilocode/plugin-atomic-chat@7.7.3

## v7.7.2 — 2026-09-15

## VS Code

### 7.7.2

#### Minor Changes

- [#14155](https://github.com/Kilo-Org/kilocode/pull/14155) [`f894108`](https://github.com/Kilo-Org/kilocode/commit/f894108d4522550f2ac13e14ebb4f7dc3d5c531c) - Show message timestamps on hover in the chat transcript, including the turn's finish time and duration.

- [#14168](https://github.com/Kilo-Org/kilocode/pull/14168) [`a16e5e9`](https://github.com/Kilo-Org/kilocode/commit/a16e5e994e903f0b80154d7c683c95804df2e608) - Show code added with "Add to Context" as a collapsible context card in the prompt input instead of pasting the path and code block as text

- [#12714](https://github.com/Kilo-Org/kilocode/pull/12714) [`23ecd42`](https://github.com/Kilo-Org/kilocode/commit/23ecd42c80f916789ebf673d636b7e164e204df5) - Move marketplace catalog, installation, removal, and installed-item detection into the CLI backend so editor clients use the shared marketplace API.

- [#14159](https://github.com/Kilo-Org/kilocode/pull/14159) [`0480c79`](https://github.com/Kilo-Org/kilocode/commit/0480c79e6bb0470f479572303ea976dcc7ddb567) - Support a custom speech-to-text source. Point voice input at any OpenAI-compatible transcription API with a base URL and optional API key, instead of always using Kilo Gateway. Switching back to Kilo Gateway restores a valid Gateway transcription model instead of showing the custom one, and a custom endpoint requires its own model ID. Custom transcription settings are read from the global config only, so a workspace config cannot redirect voice input.

#### Patch Changes

- [#14149](https://github.com/Kilo-Org/kilocode/pull/14149) [`60628ee`](https://github.com/Kilo-Org/kilocode/commit/60628eed9ffca0234f691d09f436731b55167ef5) - Move Add project to a fixed footer in the Agent Manager project list

- [#14158](https://github.com/Kilo-Org/kilocode/pull/14158) [`5517390`](https://github.com/Kilo-Org/kilocode/commit/5517390afb9a7f9a75346c81f05eb409cc6f12f3) - Stream subagent transcripts smoothly in the Agent Manager inspector instead of in coarse background batches

- [#14165](https://github.com/Kilo-Org/kilocode/pull/14165) [`ae0afbf`](https://github.com/Kilo-Org/kilocode/commit/ae0afbfd5474efdf70d41bdf59c67d06af68ebd3) - Keep the computer awake while a session has a scheduled wakeup, instead of releasing Keep Awake as soon as the session goes idle.

- [#14164](https://github.com/Kilo-Org/kilocode/pull/14164) [`136f411`](https://github.com/Kilo-Org/kilocode/commit/136f411853b90c5ff266a36e7460cca3c40e996c) - Keep text selections in the chat transcript intact while the agent streams and when it finishes, including selections inside code blocks, and pause auto-scroll after you select text so it does not jump away

- [#14154](https://github.com/Kilo-Org/kilocode/pull/14154) [`f77ae0b`](https://github.com/Kilo-Org/kilocode/commit/f77ae0b092149624d2b85f8589fe70e7b62351e6) - Keep the session header height stable while a turn streams. The activity timeline, context bar, and token counts now fill in place with skeleton rows instead of appearing one at a time and shifting the transcript.

- [#14166](https://github.com/Kilo-Org/kilocode/pull/14166) [`b4df88d`](https://github.com/Kilo-Org/kilocode/commit/b4df88d0f8044ade4544788fbc26d4730f4ff0b3) - Stop the transcript from jumping up and down while subagents run. Task cards keep their expanded state when the next assistant step starts, and finished turns no longer remount every row in the virtualized list.

- [#14160](https://github.com/Kilo-Org/kilocode/pull/14160) [`1c33649`](https://github.com/Kilo-Org/kilocode/commit/1c33649f94720708ed9c5beff2af3a1bf35dac1c) - Move the Kilo Swarm setting out of Experimental to Agent Behaviour. The setting stays enabled by default and is now controlled by the top-level `shared_agent_board` key. The `experimental.shared_agent_board` key is no longer read, and a warning is logged when it is still present.

- [#14156](https://github.com/Kilo-Org/kilocode/pull/14156) [`1b62b5e`](https://github.com/Kilo-Org/kilocode/commit/1b62b5e5254617fc592ebadbf0f58461e6a3bf14) - Stop the working indicator from cutting off the status label with a fading edge when it returns to a shorter status such as "Thinking".

## CLI

### 7.7.2

#### Minor Changes

- [#12714](https://github.com/Kilo-Org/kilocode/pull/12714) [`23ecd42`](https://github.com/Kilo-Org/kilocode/commit/23ecd42c80f916789ebf673d636b7e164e204df5) - Move marketplace catalog, installation, removal, and installed-item detection into the CLI backend so editor clients use the shared marketplace API.

#### Patch Changes

- [#14163](https://github.com/Kilo-Org/kilocode/pull/14163) [`1df6993`](https://github.com/Kilo-Org/kilocode/commit/1df69932660a7b30b7a5521b3a40b3dc0e91de0f) - Stop looping on repeated malformed tool calls. A turn now aborts with an error after three identical invalid-argument failures instead of retrying the same broken tool call indefinitely.

- [#14160](https://github.com/Kilo-Org/kilocode/pull/14160) [`1c33649`](https://github.com/Kilo-Org/kilocode/commit/1c33649f94720708ed9c5beff2af3a1bf35dac1c) - Move the Kilo Swarm setting out of Experimental to Agent Behaviour. The setting stays enabled by default and is now controlled by the top-level `shared_agent_board` key. The `experimental.shared_agent_board` key is no longer read, and a warning is logged when it is still present.

## v7.7.1 — 2026-09-15

## VS Code

### 7.7.1

#### Minor Changes

- [#14126](https://github.com/Kilo-Org/kilocode/pull/14126) [`4fb9f38`](https://github.com/Kilo-Org/kilocode/commit/4fb9f3831054c3b254fe491c167ce4296a3a15fb) - Copy a link to any PR review comment from the Agent Manager PR panel.

- [#14144](https://github.com/Kilo-Org/kilocode/pull/14144) [`53a553f`](https://github.com/Kilo-Org/kilocode/commit/53a553f03b751756a29439400feb5e73b74eb774) - Add a Reasoning Blocks display setting with Expanded, Preview, and Headline modes. Headline shows only the reasoning header and streaming indicator until you open the block, and your open or closed choice is kept while the response streams. Preview keeps a short capped scrolling preview while the agent writes and stays compact after it finishes, and blocks from earlier sessions start collapsed. Expanded keeps the full text open. The setting replaces Auto-Collapse Reasoning; existing `auto_collapse_reasoning: true` configurations map to Preview.

  Keep the Preview viewport anchored to the newest reasoning text after the block finishes, so later tool calls no longer make it jump back to the top.

  Background subagent transcripts use the same Reasoning Blocks setting instead of always showing the capped preview.

#### Patch Changes

- [#14127](https://github.com/Kilo-Org/kilocode/pull/14127) [`7bbba88`](https://github.com/Kilo-Org/kilocode/commit/7bbba885b97f4d29f3d7164e779cdcf64e402f49) - Fix "Close Others" in the Agent Manager leaving closed session tabs open in the local tab bar.

- [#14150](https://github.com/Kilo-Org/kilocode/pull/14150) [`94c3e3c`](https://github.com/Kilo-Org/kilocode/commit/94c3e3c328fe2e8b1497e55be7682195e968bfca) - Fix the Agent Manager sidebar going blank when a PR badge changes status

- [#14145](https://github.com/Kilo-Org/kilocode/pull/14145) [`c1195f0`](https://github.com/Kilo-Org/kilocode/commit/c1195f081544f8b0c452006feffcd3b5d29186c5) - Stop showing a merged or closed pull request of an old branch on an Agent Manager worktree that only reuses its branch name.

- [#14146](https://github.com/Kilo-Org/kilocode/pull/14146) [`9701f12`](https://github.com/Kilo-Org/kilocode/commit/9701f1242e15f526d6c9a748f3259f5d625a8fb5) - Keep the project row with its New worktree button pinned while scrolling the Agent Manager project list.

### 7.7.0

#### Minor Changes

- [#14102](https://github.com/Kilo-Org/kilocode/pull/14102) [`81ecad2`](https://github.com/Kilo-Org/kilocode/commit/81ecad2b13a413c8404c74940d99cddd81ae369c) - Mention sessions, worktrees, terminals, and open documents by dragging their tab or card into the prompt.

- [#14051](https://github.com/Kilo-Org/kilocode/pull/14051) [`b30b2cf`](https://github.com/Kilo-Org/kilocode/commit/b30b2cf0d37b3eaec335254b44f28080e81b8cd8) - Let permission denials include feedback so the agent can adjust before retrying.

  Keep saved approval rules unchanged unless explicitly selected, and show a clear message when an edit has no changes to review.

- [#14025](https://github.com/Kilo-Org/kilocode/pull/14025) [`1ef46bd`](https://github.com/Kilo-Org/kilocode/commit/1ef46bd36050f9ea75a63cae97f9ba17837122c5) - Post inline comments to a checked-out GitHub pull request from Changes and Agent Manager diff views. The compact composer saves locally, sends to Kilo, or posts to GitHub with an explicit destination choice. Cmd/Ctrl+Enter saves a comment, and pressing it again in the review view sends all comments to Kilo without publishing to GitHub. The toolbar shows separate send-all-to-Kilo and send-all-to-GitHub actions, and only the Kilo action carries the keyboard shortcut. GitHub posting stops on the first error so unpublished comments are kept.

- [#14105](https://github.com/Kilo-Org/kilocode/pull/14105) [`b06c745`](https://github.com/Kilo-Org/kilocode/commit/b06c745de20a57f60ee647ff386d38dadf6c253b) - Disconnect built-in providers without disabling them, and let users change stored API keys directly for providers with standard API-key authentication.

  Keep settings saves available after disabling or enabling a provider.

- [#14134](https://github.com/Kilo-Org/kilocode/pull/14134) [`50fc57d`](https://github.com/Kilo-Org/kilocode/commit/50fc57db0cacf4210e8ee47d7bde8e767ecf162c) - Enable the Kilo Swarm shared board by default. Turn it off in Agent Behaviour settings or with `experimental.shared_agent_board: false`.

- [#14050](https://github.com/Kilo-Org/kilocode/pull/14050) [`7a6ab9a`](https://github.com/Kilo-Org/kilocode/commit/7a6ab9abf4104bd76a80d018e0a0af948e13ef01) - Speed up Agent Manager worktree creation by pre-warming reusable worktrees and claiming a ready one instead of running a full checkout. Control the pre-warming in Agent Manager settings under "Pre-warm worktrees"; it is enabled by default and uses one extra checkout of disk space per open project.

  Prepare snapshots during session creation to reduce first-prompt initialization work. Start no-script sessions after environment files are copied, while preserving setup-script completion before agent startup. Discarded worktrees now remove their checkpoint data instead of leaving it behind.

  Resolve the primary checkout with one git call instead of four and discover agents and skills for a new worktree before the first prompt arrives, so the first response starts sooner.

#### Patch Changes

- [#14104](https://github.com/Kilo-Org/kilocode/pull/14104) [`3c040da`](https://github.com/Kilo-Org/kilocode/commit/3c040da646ac288197590205e1a663c500acfffb) - Keep background subagent task cards collapsed and show their reasoning as a compact preview instead of expanding while the agent runs.

- [#14116](https://github.com/Kilo-Org/kilocode/pull/14116) [`81b9c21`](https://github.com/Kilo-Org/kilocode/commit/81b9c21c24ac50a849a8b095be33b008439d782b) - Reduce GitHub API usage of Agent Manager PR status polling by resolving all worktrees in one request per sync.

- [#14045](https://github.com/Kilo-Org/kilocode/pull/14045) [`f64c664`](https://github.com/Kilo-Org/kilocode/commit/f64c6646d672a8e896215621aa39e2fbc6d7d14d) - Move the compaction model setting to the Models settings tab and link to it from the Compaction section.

- [#14106](https://github.com/Kilo-Org/kilocode/pull/14106) [`20c5742`](https://github.com/Kilo-Org/kilocode/commit/20c5742952cd5874c9b6d119f32363f10b51f80c) - Close the @ mention menu when prose follows a typed or picked mention, keep it closed after Escape, and let Enter send the message instead of replacing the draft with a loose fuzzy match.

- [#14103](https://github.com/Kilo-Org/kilocode/pull/14103) [`3a2c5d5`](https://github.com/Kilo-Org/kilocode/commit/3a2c5d5c2e28980f36b8ac020206c11a626183ff) - Reload the entire project for `/reload` and the reload actions. A reload from an Agent Manager worktree now reboots every loaded instance of the same project, so a project config change applies to the main checkout and all worktrees. The reload is refused while any session in the project is running.

- [#14046](https://github.com/Kilo-Org/kilocode/pull/14046) [`e49e786`](https://github.com/Kilo-Org/kilocode/commit/e49e7862f95ba646801a4d8b3f5ee1ce0d4bce74) - Keep the working indicator snug above the prompt at every sidebar width instead of floating in the empty space reserved for the wrapped session actions row.

- [#14115](https://github.com/Kilo-Org/kilocode/pull/14115) [`f40394f`](https://github.com/Kilo-Org/kilocode/commit/f40394f07a92e7fc3441b03485096d08777212ed) - Start the first snapshot of a new worktree several times faster. Seeding now reuses the checkout's index state instead of re-hashing every file, snapshot preparation reconciles the working tree before the first prompt arrives, and repacking snapshot objects waits until the snapshot repository is idle instead of blocking the tool steps of the running turn.

  Delay the replacement of a claimed pre-warmed worktree so its checkout does not compete with the new session's first prompt.

- [#14044](https://github.com/Kilo-Org/kilocode/pull/14044) [`ea6d9b3`](https://github.com/Kilo-Org/kilocode/commit/ea6d9b3f1d3bbf00b2db68ce0deb5e0423461bdc) - Stop the transcript from twitching down and back up for one frame when the agent starts its next step after running tools

## CLI

### 7.7.1

#### Minor Changes

- [#14148](https://github.com/Kilo-Org/kilocode/pull/14148) [`02e92bc`](https://github.com/Kilo-Org/kilocode/commit/02e92bcc6d9fe8f24b8b1226df7f4f381514f786) - Speed up local session recall for common search terms across large conversation histories, rank whole-word matches above matches inside longer words, return flagged partial matches when no session contains every term, and match small typos against session titles.

### 7.7.0

#### Minor Changes

- [#14051](https://github.com/Kilo-Org/kilocode/pull/14051) [`b30b2cf`](https://github.com/Kilo-Org/kilocode/commit/b30b2cf0d37b3eaec335254b44f28080e81b8cd8) - Let permission denials include feedback so the agent can adjust before retrying.

  Keep saved approval rules unchanged unless explicitly selected, and show a clear message when an edit has no changes to review.

- [#14103](https://github.com/Kilo-Org/kilocode/pull/14103) [`3a2c5d5`](https://github.com/Kilo-Org/kilocode/commit/3a2c5d5c2e28980f36b8ac020206c11a626183ff) - Reload the entire project for `/reload` and the reload actions. A reload from an Agent Manager worktree now reboots every loaded instance of the same project, so a project config change applies to the main checkout and all worktrees. The reload is refused while any session in the project is running.

- [#14094](https://github.com/Kilo-Org/kilocode/pull/14094) [`b7070e5`](https://github.com/Kilo-Org/kilocode/commit/b7070e507662db283fb09a72d37db60648a2bf04) - Support scheduling and cancelling future wakeups: the agent can ask to resume a session at a later time, see what it scheduled, and cancel a pending wakeup before it fires.

- [#14134](https://github.com/Kilo-Org/kilocode/pull/14134) [`50fc57d`](https://github.com/Kilo-Org/kilocode/commit/50fc57db0cacf4210e8ee47d7bde8e767ecf162c) - Enable the Kilo Swarm shared board by default. Turn it off in Agent Behaviour settings or with `experimental.shared_agent_board: false`.

#### Patch Changes

- [#14101](https://github.com/Kilo-Org/kilocode/pull/14101) [`5665631`](https://github.com/Kilo-Org/kilocode/commit/5665631aba6adcaf0fe80e5a9c6f445674a61a1b) - Keep a session goal running when you send a message. The message takes priority for that turn, then the goal continues. Pause or stop the goal explicitly with Stop or `/goal pause`. Shell commands and slash commands still pause it.

- [#14048](https://github.com/Kilo-Org/kilocode/pull/14048) [`d4e894f`](https://github.com/Kilo-Org/kilocode/commit/d4e894f2594a8b1cbe3fe7309a5ab2b8affa3280) - Format detailed findings in `/review` as numbered, severity-tagged sections so each issue is visually distinct.

- [#14051](https://github.com/Kilo-Org/kilocode/pull/14051) [`877f976`](https://github.com/Kilo-Org/kilocode/commit/877f9767164ab4ca80b34387c01627e5f01cefdc) - Reject pending permissions without feedback when using the app exit shortcut, returning to the normal prompt and its exit confirmation. Preserve Escape to open or cancel rejection feedback.

- [#14047](https://github.com/Kilo-Org/kilocode/pull/14047) [`203f19f`](https://github.com/Kilo-Org/kilocode/commit/203f19f5d6829659c52081c5a5048bdeccefe55a) - Keep output and exit status of short-lived terminal commands that finish before the terminal session attaches its listeners

- [#14075](https://github.com/Kilo-Org/kilocode/pull/14075) [`fdf1bca`](https://github.com/Kilo-Org/kilocode/commit/fdf1bca9d9ac4b1371fc25ea895ab6ee48f91cd1) - Let an app-controlled session set its pull-request link through the `set_pr_link` remote command, so the CLI advertises the PR the app already knows and stops local detection.

- [#14075](https://github.com/Kilo-Org/kilocode/pull/14075) [`fdf1bca`](https://github.com/Kilo-Org/kilocode/commit/fdf1bca9d9ac4b1371fc25ea895ab6ee48f91cd1) - Detect the session pull-request link from local git signals, the PR URL a session prints in its own output, and at most one REST lookup, so Kilo no longer burns the GitHub GraphQL rate limit probing for a PR on a timer.

- [#13192](https://github.com/Kilo-Org/kilocode/pull/13192) [`1e73d38`](https://github.com/Kilo-Org/kilocode/commit/1e73d3862489c23e5937f51fc02d2e21b99c6b74) Thanks [@maphew](https://github.com/maphew)! - Only route auxiliary tasks (session titles, commit messages, branch names) to the cloud kilo-auto/small model when kilo credentials are configured; otherwise fall back to the session's own model so offline and local-only setups keep working.

- [#14115](https://github.com/Kilo-Org/kilocode/pull/14115) [`f40394f`](https://github.com/Kilo-Org/kilocode/commit/f40394f07a92e7fc3441b03485096d08777212ed) - Start the first snapshot of a new worktree several times faster. Seeding now reuses the checkout's index state instead of re-hashing every file, snapshot preparation reconciles the working tree before the first prompt arrives, and repacking snapshot objects waits until the snapshot repository is idle instead of blocking the tool steps of the running turn.

  Delay the replacement of a claimed pre-warmed worktree so its checkout does not compete with the new session's first prompt.

- [#14050](https://github.com/Kilo-Org/kilocode/pull/14050) [`7a6ab9a`](https://github.com/Kilo-Org/kilocode/commit/7a6ab9abf4104bd76a80d018e0a0af948e13ef01) - Speed up Agent Manager worktree creation by pre-warming reusable worktrees and claiming a ready one instead of running a full checkout. Control the pre-warming in Agent Manager settings under "Pre-warm worktrees"; it is enabled by default and uses one extra checkout of disk space per open project.

  Prepare snapshots during session creation to reduce first-prompt initialization work. Start no-script sessions after environment files are copied, while preserving setup-script completion before agent startup. Discarded worktrees now remove their checkpoint data instead of leaving it behind.

  Resolve the primary checkout with one git call instead of four and discover agents and skills for a new worktree before the first prompt arrives, so the first response starts sooner.

## v7.6.2 — 2026-09-10

## CLI

### 7.6.2

#### Patch Changes

- [#14013](https://github.com/Kilo-Org/kilocode/pull/14013) [`d2381d7`](https://github.com/Kilo-Org/kilocode/commit/d2381d7ac0949226df5c05680de0c5c5e0a3b690) - Enable the experimental shared agent board (Kilo Swarm) with the `KILO_EXPERIMENTAL_SHARED_AGENT_BOARD` environment variable, or the umbrella `KILO_EXPERIMENTAL`, in addition to the `experimental.shared_agent_board` config key.

## v7.6.1 — 2026-09-10

## VS Code

### 7.6.1

#### Minor Changes

- [#14006](https://github.com/Kilo-Org/kilocode/pull/14006) [`e9f18b7`](https://github.com/Kilo-Org/kilocode/commit/e9f18b744208588b44866bd93f346f1794985211) - Reference a model inline in the prompt with `@`, opening a model picker that inserts an `@provider/model` mention for Agent Manager or subagent instructions.

#### Patch Changes

- [#13932](https://github.com/Kilo-Org/kilocode/pull/13932) [`a508228`](https://github.com/Kilo-Org/kilocode/commit/a508228b405b6ff6fea3fc52c816a510cc4ede5b) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Open attention notifications for Agent Manager sessions in Agent Manager instead of the sidebar, selecting the right project, worktree or Local tab, and session

- [#14007](https://github.com/Kilo-Org/kilocode/pull/14007) [`546321e`](https://github.com/Kilo-Org/kilocode/commit/546321e599308c2f5d805edc166c93551402e7a1) - Speed up rendering of expanded bash tool cards in the VS Code chat webview.

- [#13995](https://github.com/Kilo-Org/kilocode/pull/13995) [`685afc6`](https://github.com/Kilo-Org/kilocode/commit/685afc6f6793d3287b3dd534fa17c8042f1e5603) Thanks [@WebReflection](https://github.com/WebReflection)! - Remove the redundant "(Experimental)" suffix from the Claude Code Migration label in the Experimental settings tab

- [#14011](https://github.com/Kilo-Org/kilocode/pull/14011) [`ee6ff21`](https://github.com/Kilo-Org/kilocode/commit/ee6ff21e656472147aa5049ee9feec3d8a612f06) - Render collapsed diff tool cards without parsing and mount deferred tool bodies within a frame budget, so expanded transcripts fill in faster.

- [#13936](https://github.com/Kilo-Org/kilocode/pull/13936) [`35c487f`](https://github.com/Kilo-Org/kilocode/commit/35c487f72448d9a00deb11dc7c728499547e64ad) - Pause the working timer while a turn is waiting on your permission or question response, so the reported working time no longer includes time spent waiting for you.

- [#13993](https://github.com/Kilo-Org/kilocode/pull/13993) [`b41b3d2`](https://github.com/Kilo-Org/kilocode/commit/b41b3d2ff0624bd940de5ac2b5de777af88db70d) - Keep unlisted Auto models in the regular provider list instead of featuring them in the Auto Models section.

- [#13977](https://github.com/Kilo-Org/kilocode/pull/13977) [`d12a139`](https://github.com/Kilo-Org/kilocode/commit/d12a1392bb13a503d663177544b2d455f03915b6) Thanks [@WebReflection](https://github.com/WebReflection)! - Prevent duplicate permission prompts and response races in Agent Manager.

- [#14000](https://github.com/Kilo-Org/kilocode/pull/14000) [`7e0bc21`](https://github.com/Kilo-Org/kilocode/commit/7e0bc2175fd4494aba25db26c54ac00acd573a7b) - Speed up Agent Manager worktree deletion by skipping a redundant source project resolve when sessions move without their changes.

- [#14012](https://github.com/Kilo-Org/kilocode/pull/14012) [`c0e4d51`](https://github.com/Kilo-Org/kilocode/commit/c0e4d51f30c2f0460c3a9c738672760bde1d6d0d) - Render tool cards faster by not building collapsed tool content on mount.

- [#14002](https://github.com/Kilo-Org/kilocode/pull/14002) [`8d5cae6`](https://github.com/Kilo-Org/kilocode/commit/8d5cae6843fe649e698f2b2d29adadeb88cd32a0) - Render streamed assistant text and reasoning at frame cadence in the VS Code webview instead of waiting for the fixed 100 ms throttle, so text appears smoothly as it arrives. Completed history still renders at the slower cadence.

- [#14004](https://github.com/Kilo-Org/kilocode/pull/14004) [`5d1e7a2`](https://github.com/Kilo-Org/kilocode/commit/5d1e7a25eaf81dcf083424e544474364540f1dfb) - Show a neutral frame shimmer while a subagent starts, then animate it into the agent's identity glyph once the child session is known, and label the card with the agent type instead of the internal tool name.

- [#14005](https://github.com/Kilo-Org/kilocode/pull/14005) [`2205cdb`](https://github.com/Kilo-Org/kilocode/commit/2205cdb4ef5e88b8d5526ca2c8def36cc08e7f3b) - Speed up rendering of to-do list tool cards in the chat.

## CLI

### 7.6.1

#### Patch Changes

- [#14003](https://github.com/Kilo-Org/kilocode/pull/14003) [`7c23a3e`](https://github.com/Kilo-Org/kilocode/commit/7c23a3e9380dcca59aec248c9e4e3058464e311d) - Fix the TUI question dialog so Enter submits and Escape cancels a custom answer while the prompt autocomplete mode is active.

## v7.6.0 — 2026-09-10

## VS Code

### 7.6.0

#### Minor Changes

- [#13951](https://github.com/Kilo-Org/kilocode/pull/13951) [`492a2ff`](https://github.com/Kilo-Org/kilocode/commit/492a2ffa2609fcffa86471a46cbc0e5b8923130e) - Ask the agent to commit and push when you send pull request CI failures or review comments from the Agent Manager PR panel, or update a worktree from its base, so the pull request updates without a follow-up prompt. Permission prompts still confirm each commit and push. Turn off "Push Pull Request Fixes" in Settings, Agent Behaviour to keep commits manual.

- [#13927](https://github.com/Kilo-Org/kilocode/pull/13927) [`ed3cdc6`](https://github.com/Kilo-Org/kilocode/commit/ed3cdc6a144c73215e3fa50bea0555130d6c5796) - Add the `/caffeinate` command and notifications that explain when Kilo keeps the computer awake while agents work.

- [#13929](https://github.com/Kilo-Org/kilocode/pull/13929) [`9dae829`](https://github.com/Kilo-Org/kilocode/commit/9dae82992534ee7d91f221dc8fe6690b3e7ddc2a) Thanks [@WebReflection](https://github.com/WebReflection)! - Add an opt-in, one-time import of supported global Claude Code instructions, simple skills, and disabled MCP definitions into Kilo.

- [#13965](https://github.com/Kilo-Org/kilocode/pull/13965) [`6bbe6ac`](https://github.com/Kilo-Org/kilocode/commit/6bbe6ac379c2651fbc957072393bc1adcd85bf00) - Click the thinking indicator to scroll the current chat to the latest message.

- [#13903](https://github.com/Kilo-Org/kilocode/pull/13903) [`99eab84`](https://github.com/Kilo-Org/kilocode/commit/99eab84a23bef0ff003c4e71f9a50a699289ef6b) - Write and preview multiline PR comments and code suggestions, reply from the PR panel or diff view, and edit or delete your own comments directly in Agent Manager.

  Comment on selected PR diff lines, submit reviews, and preview and apply suggested changes to the local worktree without staging, committing, or pushing.

- [#13771](https://github.com/Kilo-Org/kilocode/pull/13771) [`3c28e7a`](https://github.com/Kilo-Org/kilocode/commit/3c28e7a9a3d837fdf16dcf72408a9a114450dd0f) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Alert you when Kilo finishes a task, needs your input, needs permission, or hits a terminal error. Enable VS Code notifications, native OS notifications (Windows, macOS, and Linux), or both — OS notifications reach you while the editor is in the background, and VS Code notifications wait for you with a **Show** action that opens the session and jumps to the latest message. Notifications are skipped for the session you are already looking at, they follow your selected language, and a **Test** button confirms native notifications work on your system.

- [#13958](https://github.com/Kilo-Org/kilocode/pull/13958) [`4c2a6eb`](https://github.com/Kilo-Org/kilocode/commit/4c2a6eb69001c3ac7134bdb38f69609fbfd4681f) - Show commits, force pushes, merges, approvals, and the pull request description in the Agent Manager PR conversation, in the order they happened.

- [#13953](https://github.com/Kilo-Org/kilocode/pull/13953) [`3c04a86`](https://github.com/Kilo-Org/kilocode/commit/3c04a86c59bda4e2e8c5a444c2390854859c4090) - Show pull request approvals and merge readiness in Agent Manager, with GitHub-backed branch updates, merge methods, auto-merge, and conflict resolution with Kilo.

- [#13679](https://github.com/Kilo-Org/kilocode/pull/13679) [`e27ff0a`](https://github.com/Kilo-Org/kilocode/commit/e27ff0a6db3763de6170776eda552cfcb9340ba0) - Keep working toward a session goal with `/goal`, with shared pause, resume, and clear controls in the terminal and VS Code. Pause goals after no-action replies, terminal failures, Stop, new messages, and backend restarts. Rename custom commands or MCP prompts named `goal` to use this reserved command. Show a labeled Goal icon with hover details while work runs.

  Compose multiline goals with images and file attachments in VS Code. Select `/goal` to enter goal mode, or cancel to keep the draft as ordinary chat. Keep drafts and attachments when submission fails.

  Keep the current goal running when replacement attachments are invalid. Make pending Goal submissions read-only, and preserve the draft when Cancel exits Goal mode before acknowledgement.

  Disable clarification questions during active goals and delegated work while keeping permission approvals unchanged. Make safe, reversible decisions autonomously and report completion or blockers.

  Retain Active, Complete, Blocked, and Paused goals with their objective and reason until explicitly cleared. Let the working model explicitly report completion or a blocker with the Goal-only reporting tool, without a separate evaluator or independent verification claim. Pause no-action turns that have no explicit report. Keep complete goals complete after a backend restart and label their resume action as Restart.

  Starting a Goal while a response is running replaces that response after the Goal request is validated.

- [#13940](https://github.com/Kilo-Org/kilocode/pull/13940) [`b8fe009`](https://github.com/Kilo-Org/kilocode/commit/b8fe0095d14a08c36b5648fe3c957c81e402911c) - Identify subagents with consistent theme-colored avatars in Task cards, background agents, subagent tabs, and swarm messages. Show all participants in board message headers, and animate running avatars instead of showing a separate loading indicator.

- [#13782](https://github.com/Kilo-Org/kilocode/pull/13782) [`4d2d800`](https://github.com/Kilo-Org/kilocode/commit/4d2d8001e550c39cfb871f83943b1d5411fd5234) - View and reset the shared agent board from its owning session without stopping agents or clearing conversations.

#### Patch Changes

- [#13926](https://github.com/Kilo-Org/kilocode/pull/13926) [`818d31d`](https://github.com/Kilo-Org/kilocode/commit/818d31d0aa888bbea6f7da2660f1d74fbf1d02fd) - Explain that Agent Manager requires a specific project folder when the VS Code workspace is the home folder or a filesystem root.

- [#13975](https://github.com/Kilo-Org/kilocode/pull/13975) [`e85805f`](https://github.com/Kilo-Org/kilocode/commit/e85805f30b7a3cf9adeb757d1f23d5ca307ae622) - Keep the Agent Manager PR push toggle synchronized with the Settings value across open Kilo views.

- [#13916](https://github.com/Kilo-Org/kilocode/pull/13916) [`1ec6268`](https://github.com/Kilo-Org/kilocode/commit/1ec62684fcd82402b7e1628ce233117ccdee1092) - Regroup the Agent Manager toolbar: optional session panels (documents, subagents) sit left of a separator, and the fixed workbench (changes, PR, apply, open in VS Code, browser, run, terminal) keeps stable positions on the right. Toolbar icons render at a uniform 1px stroke and dim when disabled. Open the full-screen review from the changes panel header instead of a toolbar button.

- [#13990](https://github.com/Kilo-Org/kilocode/pull/13990) [`7febec5`](https://github.com/Kilo-Org/kilocode/commit/7febec58fe96ffacc60592e5e94a0b800f9bdd2c) - Report the direct recipient execution state in board_post results and warn when that recipient stopped, failed, was cancelled, or is unknown, so agents do not assume a finished subagent will read the message.

- [#13967](https://github.com/Kilo-Org/kilocode/pull/13967) [`0aad88e`](https://github.com/Kilo-Org/kilocode/commit/0aad88ec3034be8a62e0a2e9bad4d41162a1ef4e) - Resolve agent board route metadata from the session store while a message is still being written, so sender and recipient avatars and titles appear without waiting for the completed tool result.

- [#13920](https://github.com/Kilo-Org/kilocode/pull/13920) [`05c763f`](https://github.com/Kilo-Org/kilocode/commit/05c763f12e9b387213939e5f2600c8e021bae113) - Show an actionable message when creating worktrees from a repository with no commits.

- [#13925](https://github.com/Kilo-Org/kilocode/pull/13925) [`cdbb926`](https://github.com/Kilo-Org/kilocode/commit/cdbb9265536e440854b30c6f3f35d86cd5ac38f0) - Reduce Kilo Console startup time by loading project, terminal, diff, and configuration features on demand.

- [#13970](https://github.com/Kilo-Org/kilocode/pull/13970) [`fa986a1`](https://github.com/Kilo-Org/kilocode/commit/fa986a115d82ae3efb02f5cae4600afc1743963f) - Defer automatic plan previews until their agent session is active.

- [#13991](https://github.com/Kilo-Org/kilocode/pull/13991) [`448c821`](https://github.com/Kilo-Org/kilocode/commit/448c8214b741c29801b37d5b9bbd450b37772df0) - Keep disclosure chevron buttons unhighlighted when expanded, so Agent Manager section headers and chat task headers render consistently. Expanded and collapsed section headers now use the same chevron glyph.

- [#13928](https://github.com/Kilo-Org/kilocode/pull/13928) [`3e05727`](https://github.com/Kilo-Org/kilocode/commit/3e057279b5011c886d68690434bb44faaf6c65cd) - Fix Agent Manager terminal tabs getting stuck at an expanded width after closing a tab.

- [#13959](https://github.com/Kilo-Org/kilocode/pull/13959) [`29a16ff`](https://github.com/Kilo-Org/kilocode/commit/29a16ffd0ee89444e81428f84747afecf88ebf5f) - Keep expanded Agent Manager PR comments readable by hiding their duplicate header previews.

- [#13943](https://github.com/Kilo-Org/kilocode/pull/13943) [`ada216a`](https://github.com/Kilo-Org/kilocode/commit/ada216a9020a6c4d36f3e3ef6dd2f374ee1e7c5c) - Keep multi-project Agent Manager behind its existing experimental setting while remaining state bugs and the project worktree-start control are addressed. The worktree-start control can currently scroll out of view, so this rollback does not introduce a sticky or replacement control.

- [#13949](https://github.com/Kilo-Org/kilocode/pull/13949) [`a658942`](https://github.com/Kilo-Org/kilocode/commit/a6589426458fcbe9f30c2771b36508f3ae3deeed) - Fix a crash when session repository metadata is resolved without an instance context (e.g. the API fallback path): it now degrades to no git metadata instead of throwing.

- [#13913](https://github.com/Kilo-Org/kilocode/pull/13913) [`2c99cd6`](https://github.com/Kilo-Org/kilocode/commit/2c99cd6f5115484c44bc9422ac1600fe8ba75714) - Keep deleted diff bars visible without coloring deleted line numbers.

- [#13966](https://github.com/Kilo-Org/kilocode/pull/13966) [`8992b3c`](https://github.com/Kilo-Org/kilocode/commit/8992b3c25ce7e72aebca11b02496a9b8b54507d0) - Open Agent Manager worktree PR buttons in the internal PR sidebar instead of directly in GitHub.

- [#13952](https://github.com/Kilo-Org/kilocode/pull/13952) [`19d6dbc`](https://github.com/Kilo-Org/kilocode/commit/19d6dbca6fefa305ae2b8c6caaa3c8020bc7cd51) - Show reviewer avatars and GitHub-style review states in the Agent Manager PR sidebar, and remove the redundant review decision row.

- [#13971](https://github.com/Kilo-Org/kilocode/pull/13971) [`6d21b59`](https://github.com/Kilo-Org/kilocode/commit/6d21b591b165e653dd94e459986cf1e5c739dd4e) - Keep the speech-to-text button pointer stable while microphone capture or transcription is in progress.

- [#13987](https://github.com/Kilo-Org/kilocode/pull/13987) [`5026f6d`](https://github.com/Kilo-Org/kilocode/commit/5026f6d451e09c607f047d68ca50a37c611c75c7) - Keep tool reveal animations from replaying when switching Agent Manager worktrees or sessions, and settle encrypted reasoning blocks as soon as the response moves on instead of pulsing until the whole reasoning item finishes.

- [#13962](https://github.com/Kilo-Org/kilocode/pull/13962) [`b9433fc`](https://github.com/Kilo-Org/kilocode/commit/b9433fcf33205e2babf554754a0536f8fe1eb500) - Smooth out reasoning blocks with auto-collapse enabled: the streaming viewport scrolls smoothly without a flickering scrollbar, finished blocks rest in place instead of jumping and collapsing, and new tool calls grow in instead of popping.

- [#13976](https://github.com/Kilo-Org/kilocode/pull/13976) [`df4bc06`](https://github.com/Kilo-Org/kilocode/commit/df4bc068ae6e9a754c19f02fe73531d8fd6e0be8) - Refine the Agent Manager auto-merge button with centered content, a muted blue split-button treatment, and a clean chevron hover state.

- [#13949](https://github.com/Kilo-Org/kilocode/pull/13949) [`a658942`](https://github.com/Kilo-Org/kilocode/commit/a6589426458fcbe9f30c2771b36508f3ae3deeed) - Remote sessions started outside the selected repository now show the correct repository name and branch in the sessions list.

- [#13973](https://github.com/Kilo-Org/kilocode/pull/13973) [`e67ea3c`](https://github.com/Kilo-Org/kilocode/commit/e67ea3c9526c2b8da711b0a793e1d6830d3052de) - Resize and right-align the Agent Manager Create Worktree button.

- [#13974](https://github.com/Kilo-Org/kilocode/pull/13974) [`d3dfa36`](https://github.com/Kilo-Org/kilocode/commit/d3dfa365c1485a5e49067323f626051f2ae861f9) - Keep reasoning blocks at a steady width and stop them from flickering while the reasoning streams.

- [#13948](https://github.com/Kilo-Org/kilocode/pull/13948) [`a5667d2`](https://github.com/Kilo-Org/kilocode/commit/a5667d23fc92856c8a1ef0ec67c8b5bed880c9da) - Unify icon-button sizing, states, accessibility, and split-button interactions across Kilo webviews.

- Updated dependencies [[`448c821`](https://github.com/Kilo-Org/kilocode/commit/448c8214b741c29801b37d5b9bbd450b37772df0), [`2c99cd6`](https://github.com/Kilo-Org/kilocode/commit/2c99cd6f5115484c44bc9422ac1600fe8ba75714), [`b5cf426`](https://github.com/Kilo-Org/kilocode/commit/b5cf426158d86573eb0eeb08d754231d813f2d64), [`e27ff0a`](https://github.com/Kilo-Org/kilocode/commit/e27ff0a6db3763de6170776eda552cfcb9340ba0), [`4d2d800`](https://github.com/Kilo-Org/kilocode/commit/4d2d8001e550c39cfb871f83943b1d5411fd5234), [`a5667d2`](https://github.com/Kilo-Org/kilocode/commit/a5667d23fc92856c8a1ef0ec67c8b5bed880c9da)]:
  - @kilocode/kilo-ui@7.6.0
  - @kilocode/sdk@8.0.0
  - @kilocode/plugin@7.5.17
  - @opencode-ai/ui@7.5.17
  - @opencode-ai/core@7.5.17
  - @kilocode/kilo-gateway@7.5.17
  - @kilocode/kilo-indexing@7.5.17

## CLI

### 7.6.0

#### Major Changes

- [#13793](https://github.com/Kilo-Org/kilocode/pull/13793) [`b5cf426`](https://github.com/Kilo-Org/kilocode/commit/b5cf426158d86573eb0eeb08d754231d813f2d64) - Remove the `interactive_terminal` tool, in-session terminal controls, and related API endpoints. Run commands that need keyboard input in your own terminal instead.

#### Minor Changes

- [#13927](https://github.com/Kilo-Org/kilocode/pull/13927) [`ed3cdc6`](https://github.com/Kilo-Org/kilocode/commit/ed3cdc6a144c73215e3fa50bea0555130d6c5796) - Add the `/caffeinate` command and notifications that explain when Kilo keeps the computer awake while agents work.

- [#13929](https://github.com/Kilo-Org/kilocode/pull/13929) [`9dae829`](https://github.com/Kilo-Org/kilocode/commit/9dae82992534ee7d91f221dc8fe6690b3e7ddc2a) Thanks [@WebReflection](https://github.com/WebReflection)! - Add an opt-in, one-time import of supported global Claude Code instructions, simple skills, and disabled MCP definitions into Kilo.

- [#13679](https://github.com/Kilo-Org/kilocode/pull/13679) [`e27ff0a`](https://github.com/Kilo-Org/kilocode/commit/e27ff0a6db3763de6170776eda552cfcb9340ba0) - Keep working toward a session goal with `/goal`, with shared pause, resume, and clear controls in the terminal and VS Code. Pause goals after no-action replies, terminal failures, Stop, new messages, and backend restarts. Rename custom commands or MCP prompts named `goal` to use this reserved command. Show a labeled Goal icon with hover details while work runs.

  Compose multiline goals with images and file attachments in VS Code. Select `/goal` to enter goal mode, or cancel to keep the draft as ordinary chat. Keep drafts and attachments when submission fails.

  Keep the current goal running when replacement attachments are invalid. Make pending Goal submissions read-only, and preserve the draft when Cancel exits Goal mode before acknowledgement.

  Disable clarification questions during active goals and delegated work while keeping permission approvals unchanged. Make safe, reversible decisions autonomously and report completion or blockers.

  Retain Active, Complete, Blocked, and Paused goals with their objective and reason until explicitly cleared. Let the working model explicitly report completion or a blocker with the Goal-only reporting tool, without a separate evaluator or independent verification claim. Pause no-action turns that have no explicit report. Keep complete goals complete after a backend restart and label their resume action as Restart.

  Starting a Goal while a response is running replaces that response after the Goal request is validated.

- [#13782](https://github.com/Kilo-Org/kilocode/pull/13782) [`4d2d800`](https://github.com/Kilo-Org/kilocode/commit/4d2d8001e550c39cfb871f83943b1d5411fd5234) - View and reset the shared agent board from its owning session without stopping agents or clearing conversations.

#### Patch Changes

- [#13990](https://github.com/Kilo-Org/kilocode/pull/13990) [`7febec5`](https://github.com/Kilo-Org/kilocode/commit/7febec58fe96ffacc60592e5e94a0b800f9bdd2c) - Report the direct recipient execution state in board_post results and warn when that recipient stopped, failed, was cancelled, or is unknown, so agents do not assume a finished subagent will read the message.

- [#13944](https://github.com/Kilo-Org/kilocode/pull/13944) [`1423442`](https://github.com/Kilo-Org/kilocode/commit/1423442f2659429bc29e7e65bc416099e7ebc710) - Improve CLI link activation and hover feedback across terminal emulators.

- [#13921](https://github.com/Kilo-Org/kilocode/pull/13921) [`36d6d7d`](https://github.com/Kilo-Org/kilocode/commit/36d6d7dab6c7305ff1a25b2cb1d6c6bd22b8f3df) - Include CLI changes alongside VS Code changes in GitHub release notes.

- [#13960](https://github.com/Kilo-Org/kilocode/pull/13960) [`445660b`](https://github.com/Kilo-Org/kilocode/commit/445660b420c791e963b927b6f25500e690dc6c05) - Keep TypeScript file edits responsive while refreshing diagnostics after parallel edits, moves, deletes, and failed checks.

- [#13945](https://github.com/Kilo-Org/kilocode/pull/13945) [`9db9718`](https://github.com/Kilo-Org/kilocode/commit/9db971865f3f95d8150b6fde1b307026402f4edb) - Prevent interrupted snapshot progress from poisoning future prompts, and skip snapshot lock waits when snapshots are disabled.

- Updated dependencies [[`b5cf426`](https://github.com/Kilo-Org/kilocode/commit/b5cf426158d86573eb0eeb08d754231d813f2d64), [`4d2d800`](https://github.com/Kilo-Org/kilocode/commit/4d2d8001e550c39cfb871f83943b1d5411fd5234)]:
  - @kilocode/sdk@8.0.0
  - @kilocode/plugin@7.5.17
  - @opencode-ai/tui@7.5.17
  - @opencode-ai/ui@7.5.17
  - @kilocode/kilo-gateway@7.5.17
  - @kilocode/kilo-indexing@7.5.17
  - @kilocode/plugin-atomic-chat@7.5.17
  - @opencode-ai/server@7.5.17
  - @kilocode/kilo-telemetry@7.5.17

## v7.5.16 — 2026-09-08

## 7.5.16

### Minor Changes

- [#12974](https://github.com/Kilo-Org/kilocode/pull/12974) [`822d0aa`](https://github.com/Kilo-Org/kilocode/commit/822d0aab4ae1bbe0fb50ff457c81a646739051f1) - Add a default-off Keep Awake toggle for busy agent sessions without keeping the display on or disabling screen locking. Remember the safety notice after its first acceptance. Keep multi-project toolbar controls visible in narrow sidebars.

- [#13878](https://github.com/Kilo-Org/kilocode/pull/13878) [`512efb6`](https://github.com/Kilo-Org/kilocode/commit/512efb6610427bb04ad858cdae2f07c31d93e2ad) - Group and collapse PR checks in the Agent Manager while keeping failures and pending checks visible.

- [#13867](https://github.com/Kilo-Org/kilocode/pull/13867) [`1210261`](https://github.com/Kilo-Org/kilocode/commit/1210261d61d6a11bf62c2529c8321ea2e4d16844) - Send failed CI checks to the agent from the PR panel, with compact feedback and on-demand log retrieval.

- [#13541](https://github.com/Kilo-Org/kilocode/pull/13541) [`3141112`](https://github.com/Kilo-Org/kilocode/commit/3141112eb71351a4e2c97dd0b67ec20b75d070b2) - Show GitHub PR review threads with author avatars inline in the PR panel, Agent Manager, and Changes. Use committed PR code for thread previews so local edits do not move current comments out of the diff. Jump to a comment's diff location, copy the thread, or send it to chat.

- [#13861](https://github.com/Kilo-Org/kilocode/pull/13861) [`e207b42`](https://github.com/Kilo-Org/kilocode/commit/e207b423518f170ac716ae68d6900964c57fae15) - Support starting Agent Manager sessions in an explicitly selected existing managed worktree.

- [#13877](https://github.com/Kilo-Org/kilocode/pull/13877) [`a1c674a`](https://github.com/Kilo-Org/kilocode/commit/a1c674adacdea502870aeba79ae77f2cdc661e11) - Allow Agent Manager sessions to reply to the session that sent them a prompt.

- [#13881](https://github.com/Kilo-Org/kilocode/pull/13881) [`077c744`](https://github.com/Kilo-Org/kilocode/commit/077c7448831f356b857d7b1abb6812e7108f71e6) - Add emoji reactions to GitHub pull request comments in Agent Manager, including comments shown in diffs.

- [#13810](https://github.com/Kilo-Org/kilocode/pull/13810) [`ef48a50`](https://github.com/Kilo-Org/kilocode/commit/ef48a50de3b8d27caf49ec0ae79a2e3e26174c51) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Jump to matching options by typing in the agent and reasoning effort selectors.

### Patch Changes

- [#13908](https://github.com/Kilo-Org/kilocode/pull/13908) [`6ec7f10`](https://github.com/Kilo-Org/kilocode/commit/6ec7f105b4ff52f0753b2beee614b91a58847ce8) - Keep the webview aligned when jumping through chat messages, search results, and pull request comments.

- [#13794](https://github.com/Kilo-Org/kilocode/pull/13794) [`2dc5951`](https://github.com/Kilo-Org/kilocode/commit/2dc5951b41d6340d5779d9d391bd0fe1f7e72714) - Keep chat input undo and redo from changing files open in Markdown custom editors.

- [#13876](https://github.com/Kilo-Org/kilocode/pull/13876) [`b174266`](https://github.com/Kilo-Org/kilocode/commit/b1742663cfbb66079538051ab2c40587d5399a9a) - Show source attribution inside initial and follow-up Agent Manager messages, with navigation to an already open source session. Hide internal markers from displayed and copied text.

- [#13890](https://github.com/Kilo-Org/kilocode/pull/13890) [`a99f63a`](https://github.com/Kilo-Org/kilocode/commit/a99f63a3b631e3787ebd9f127428497f64303d7f) - Show a filled coffee icon and clarify that Keep Awake prevents system sleep while Kilo agents work.

- [#13868](https://github.com/Kilo-Org/kilocode/pull/13868) [`66053ef`](https://github.com/Kilo-Org/kilocode/commit/66053ef651ad70747a8b9313b50dfa7a68b5d514) - Load recent messages faster when opening large sessions, speed up token-usage totals across child sessions, and keep older history available on demand.

- [#13847](https://github.com/Kilo-Org/kilocode/pull/13847) [`9903abb`](https://github.com/Kilo-Org/kilocode/commit/9903abbe4b87f1e3f7e32b2721d10f120d306783) - Improve live subagent transcript performance in editor tabs and Agent Manager, especially with many parallel agents and shared-board messages.

- [#13885](https://github.com/Kilo-Org/kilocode/pull/13885) [`6f35a32`](https://github.com/Kilo-Org/kilocode/commit/6f35a327a4631468e548ea07bb7d4aad83775494) - Fix Agent Manager worktree deletion after closing all tabs.

- [#13859](https://github.com/Kilo-Org/kilocode/pull/13859) [`111cf3f`](https://github.com/Kilo-Org/kilocode/commit/111cf3f41379fd625c65d893e2b604d01d43f33d) - Use the selected model, reasoning effort, and agent for the active session's Update from base command.

- [#13892](https://github.com/Kilo-Org/kilocode/pull/13892) [`c65dd72`](https://github.com/Kilo-Org/kilocode/commit/c65dd72fbca6b9170ef6b81351158b2acf966f11) - Fix `/update-from-base` silently failing when sending the selected model.

- [#13863](https://github.com/Kilo-Org/kilocode/pull/13863) [`c373eb3`](https://github.com/Kilo-Org/kilocode/commit/c373eb3d71063f7b563bc752a6813f89106e3b3d) - Prevent invalid Git output from becoming the indexing directory when resolving worktree projects with older Git versions.

- [#13874](https://github.com/Kilo-Org/kilocode/pull/13874) [`99a5856`](https://github.com/Kilo-Org/kilocode/commit/99a5856a2615ff20c027f92abd88a87708264417) - Allow removing stale Agent Manager entries for deleted worktrees when terminal cleanup cannot reach the backend.

- [#13871](https://github.com/Kilo-Org/kilocode/pull/13871) [`3ef395a`](https://github.com/Kilo-Org/kilocode/commit/3ef395a01847ae2528fd81da60ac40bee0c9dfaf) - Collapse files marked `linguist-generated` in repository `.gitattributes` rules while keeping explicitly visible files such as English and German translations expanded by default.

- [#13853](https://github.com/Kilo-Org/kilocode/pull/13853) [`1be0f7e`](https://github.com/Kilo-Org/kilocode/commit/1be0f7e11d3280dc5343e458a5e481719538cb8a) - Show relative dates on inline pull request review comments.

- [#13901](https://github.com/Kilo-Org/kilocode/pull/13901) [`3256564`](https://github.com/Kilo-Org/kilocode/commit/325656483ee96fb12e5fd11c533ea8d72b5e0f04) - Keep automatic plan opens scoped to the active agent session and its worktree.

- [#13883](https://github.com/Kilo-Org/kilocode/pull/13883) [`6024a76`](https://github.com/Kilo-Org/kilocode/commit/6024a76db57dc0b5f1d3e904eea426a299bcf653) - Open saved plan files automatically when an agent requests user review in VS Code.

- [#13911](https://github.com/Kilo-Org/kilocode/pull/13911) [`4416661`](https://github.com/Kilo-Org/kilocode/commit/4416661dec50cd685cd6727223198aeb2ae29a7c) - Show GitHub review-thread reactions and timestamps for every comment reply in Agent Manager.

- [#13866](https://github.com/Kilo-Org/kilocode/pull/13866) [`7a9e5f1`](https://github.com/Kilo-Org/kilocode/commit/7a9e5f15a4c95673c2b1e9c494fdaaeb6b81e3cd) - Use clearer "Fix with Kilo" actions for PR review comments in Agent Manager.

- [#13904](https://github.com/Kilo-Org/kilocode/pull/13904) [`44febac`](https://github.com/Kilo-Org/kilocode/commit/44febacc84f9a9f39071288bf7f20b32005fd736) - Show Fix with Kilo and jump-to-section actions in the Agent Manager PR summary, so CI failures, review threads, and PR comments can be handed to Kilo without scrolling.

- [#13860](https://github.com/Kilo-Org/kilocode/pull/13860) [`18e1ac4`](https://github.com/Kilo-Org/kilocode/commit/18e1ac42902a6cbca0e5391963368a28d55df242) - Preserve explicit Git branch names in Agent Manager and expose automatic branch naming and prefix controls in its settings.

- [#13906](https://github.com/Kilo-Org/kilocode/pull/13906) [`ba2bc26`](https://github.com/Kilo-Org/kilocode/commit/ba2bc26666e2a27940f15398dfbd24d21a6dcbb5) - Preserve Local tab order and remember the active tab when switching worktrees and projects in Agent Manager.

- [#13872](https://github.com/Kilo-Org/kilocode/pull/13872) [`a74df51`](https://github.com/Kilo-Org/kilocode/commit/a74df512a422893e562c057a9c8ae4267013fb38) - Prevent new worktrees from showing unrelated merged or closed pull requests that share the same commit.

- [#13862](https://github.com/Kilo-Org/kilocode/pull/13862) [`35ba4aa`](https://github.com/Kilo-Org/kilocode/commit/35ba4aa7088ca075c4bb75ae5d53895df56b3e16) - Use the diff theme color for deleted-line indicators, including when line numbers are hidden.

- [#13879](https://github.com/Kilo-Org/kilocode/pull/13879) [`f7ba2fc`](https://github.com/Kilo-Org/kilocode/commit/f7ba2fc480c45dec0df6b7b8cdcade4ef08d6f82) - Keep Agent Manager PR comment headers and toggles consistent when expanding or collapsing a thread, and remove the top ellipsis strip from diff previews.

- [#13869](https://github.com/Kilo-Org/kilocode/pull/13869) [`e930067`](https://github.com/Kilo-Org/kilocode/commit/e9300675973772f3bb509b45f6bb0a255a7cb115) - Remove deleted worktree cards with a smoother exit: the row acknowledges the click immediately, the title is crossed out from left to right, and the card is swept away in about a third of a second, only after successful deletion. Respect reduced motion and require the explicit Delete? button to confirm deletion instead of a card click.

- [#13907](https://github.com/Kilo-Org/kilocode/pull/13907) [`5cdba6e`](https://github.com/Kilo-Org/kilocode/commit/5cdba6ee9ea6d3cac7245121aedb09c768eefa0f) - Use the default white spinner for GitHub PR checks and review processing indicators.

- Updated dependencies [[`3141112`](https://github.com/Kilo-Org/kilocode/commit/3141112eb71351a4e2c97dd0b67ec20b75d070b2)]:
  - @kilocode/kilo-ui@7.5.16

## jetbrains/v7.1.6 — 2026-09-08

### Added

- Move a session to a worktree directly from the worktree editor.
- Fork a session from the worktree editor.
- Add Ctrl+1/2/3/0 shortcuts to cycle mode, model, and reasoning effort.
- Exclude Kilo worktrees from IntelliJ project indexing.
- Run project run configurations delegated to Gradle inside a worktree.
- Surface pull request and run status in the Agent Manager worktree list.

### Fixed

- Refresh pull request badges app-wide when the IDE regains focus.
- Settle attention badges correctly during auto-approve.
- Fill session dialog cards with a raised surface instead of a flat background.
- Fixed config warnings being attributed to the IDE's working directory instead of the actual project, which could show a stray "home directory" warning banner.
- Fixed worktree deletion blocking the UI for large directories and failing when other worktrees were busy at the same time.
- Fixed the worktree session list unexpectedly expanding when starting or forking a session.
- Reduced CLI startup overhead on Windows.
- Sped up cold session loading.
- Fixed inference cost showing as $0 for OpenRouter BYOK sessions.


## v7.5.15 — 2026-09-06

No notable changes

## v7.5.14 — 2026-09-04

## 7.5.14

### Patch Changes

- [#13796](https://github.com/Kilo-Org/kilocode/pull/13796) [`626d1cc`](https://github.com/Kilo-Org/kilocode/commit/626d1cc5777530f2785c34eadbe4faac02f7b13a) - Keep codebase indexing status current and support workspace paths with non-ASCII characters.

- [#13795](https://github.com/Kilo-Org/kilocode/pull/13795) [`2fd7123`](https://github.com/Kilo-Org/kilocode/commit/2fd712321566699899ea44e54201add097cb9824) - Pause Changes, Review, and chat badge polling while their panels are hidden, and reuse unchanged file counts to reduce CPU use in large repositories.

## v7.5.13 — 2026-09-04

## 7.5.13

### Patch Changes

- [#13792](https://github.com/Kilo-Org/kilocode/pull/13792) [`5d2038d`](https://github.com/Kilo-Org/kilocode/commit/5d2038daa6f1c49b1e1c05891e97fedd9f97de2a) - Keep Shift+Tab available for reasoning variant cycling while the slash command menu is open, without selecting a command or changing the draft.

- [#13791](https://github.com/Kilo-Org/kilocode/pull/13791) [`294219b`](https://github.com/Kilo-Org/kilocode/commit/294219be7d54f3f706501cb4357c4185a652e1a5) - Use consistent icon buttons with clear tooltips for Open, Apply, and Run in the Agent Manager toolbar.

## v7.5.12 — 2026-09-04

## 7.5.12

### Patch Changes

- [#13789](https://github.com/Kilo-Org/kilocode/pull/13789) [`b1ed65e`](https://github.com/Kilo-Org/kilocode/commit/b1ed65ed673fedc51af01e04c93526a836f9f2f9) - Keep model and reasoning selectors open during automatic prompt focus restoration.

## 7.5.11

### Minor Changes

- [#13734](https://github.com/Kilo-Org/kilocode/pull/13734) [`d95e20d`](https://github.com/Kilo-Org/kilocode/commit/d95e20d1c10b0b6bb19bb685274934fa63db942c) - Explain worktrees, parallel agents, PR status, and conflict resolution with an inline Agent Manager introduction. Remember whether it is enabled and let users restore it from the welcome screen.

- [#13776](https://github.com/Kilo-Org/kilocode/pull/13776) [`46dfbbc`](https://github.com/Kilo-Org/kilocode/commit/46dfbbc67737406348e64b0677d85902a26d9dbf) - Show pull request discussion comments and review submissions at the bottom of the Agent Manager PR view with actions to send them to the agent or terminal, copy, and dismiss.

- [#13779](https://github.com/Kilo-Org/kilocode/pull/13779) [`737fba0`](https://github.com/Kilo-Org/kilocode/commit/737fba02c3bdbf931653d44436e54f3bda99215a) - Add a refresh button to fetch the latest pull request state in Agent Manager.

- [#13735](https://github.com/Kilo-Org/kilocode/pull/13735) [`5a1da63`](https://github.com/Kilo-Org/kilocode/commit/5a1da6345b5b33581386aefe5e50fdfe20a541be) - Ask the worktree agent to update from its saved base branch with `/update-from-base`, the worktree menu, or Command Palette, without stashing or discarding uncommitted work.

- [#13592](https://github.com/Kilo-Org/kilocode/pull/13592) [`6a224d2`](https://github.com/Kilo-Org/kilocode/commit/6a224d2d7224a1fdcf4e0d8067409b00e67ac634) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Search the whole `@` menu with one query. Names with spaces are now searchable, so `@my report.txt` finds the file it names, and past chats are found by title in the list instead of only behind **Past chats**. Files, chats, and entries such as **Terminal**, **Git changes**, and **Browse files...** are ranked together by how well they fit the query, rather than listed in fixed groups.

- [#13733](https://github.com/Kilo-Org/kilocode/pull/13733) [`d969f8b`](https://github.com/Kilo-Org/kilocode/commit/d969f8b3e10dd0a499f046ef607e502fdda63185) - Show unresolved review thread counts beside worktree PR numbers in Agent Manager, with a shortcut to open the comments.

- [#13727](https://github.com/Kilo-Org/kilocode/pull/13727) [`ce274e6`](https://github.com/Kilo-Org/kilocode/commit/ce274e6762255e2318a477dd225f629ed6708e17) - Support agent-defined default answers for single-select questions, with Enter confirmation in the CLI and VS Code.

- [#13629](https://github.com/Kilo-Org/kilocode/pull/13629) [`c0eba39`](https://github.com/Kilo-Org/kilocode/commit/c0eba39ef5cfdd96ce2e220850c091dc9473f848) - Introduce Kilo Swarm, an opt-in shared board scoped to a main session and its task descendants, with persistent session history and fixed activity notices in tool results. Enable Kilo Swarm in Experimental settings for parallel solution attempts or complementary work, not every task. Post messages with `board_post` and read peer messages explicitly with `board_read`, without treating them as user requests or approval. Posting a message does not guarantee delivery or reading, or start an agent. Keep `experimental.shared_agent_board`, tool names, stored identifiers, history, and permissions unchanged.

  Keep background task status available for models without a reasoning variant.

  Warn when a direct board post targets a task known to be inactive, without restarting it.

  Keep peer content out of user turns and privileged instructions. Coalesce activity notices on genuine tool results, with message bodies available only through explicit reads. Preserve the parent's model and reasoning settings when background tasks finish.

### Patch Changes

- [#13753](https://github.com/Kilo-Org/kilocode/pull/13753) [`62c3660`](https://github.com/Kilo-Org/kilocode/commit/62c36601192bfc4bb478f1477112fa5729fca512) - Reference /update-from-base in the Agent Manager introduction to explain how to merge the latest base branch changes into a worktree.

- [#13730](https://github.com/Kilo-Org/kilocode/pull/13730) [`64123bc`](https://github.com/Kilo-Org/kilocode/commit/64123bc8a9706df100b949e48118e278d88ca9be) - Show the target session and full outgoing prompt when asking permission to send a prompt through Agent Manager.

- [#13731](https://github.com/Kilo-Org/kilocode/pull/13731) [`05ae514`](https://github.com/Kilo-Org/kilocode/commit/05ae51436c859fc529aa08b068666b0f12eb0ed6) - Clear completed session indicators when you return to their chat across sidebar, editor, worktree, and subagent tabs. Keep indicators for sessions that finish while already open, and preserve unresolved input requests, errors, and turn diagnostics.

- [#13758](https://github.com/Kilo-Org/kilocode/pull/13758) [`64df333`](https://github.com/Kilo-Org/kilocode/commit/64df33388812200fe753d8f54721ef413a9be466) Thanks [@WebReflection](https://github.com/WebReflection)! - Reduce Agent Manager change-detection key sizes without changing update behavior.

- [#13707](https://github.com/Kilo-Org/kilocode/pull/13707) [`e14b4db`](https://github.com/Kilo-Org/kilocode/commit/e14b4db1a8ffaf4d3fbf675b98987faab0b4345a) - Speed up worktree deletion when multiple terminals need to close, while preserving conversation history and process cleanup checks.

- [#13777](https://github.com/Kilo-Org/kilocode/pull/13777) [`6876856`](https://github.com/Kilo-Org/kilocode/commit/68768565418c35a326a41d46467ac8d639a2b7fb) - Restore worktree delete actions when Agent Manager misses a shortcut modifier key release

- [#13706](https://github.com/Kilo-Org/kilocode/pull/13706) [`9a8ce09`](https://github.com/Kilo-Org/kilocode/commit/9a8ce09c7afbcb916a1d572798b515872afea463) - Restore sending all Agent Manager diff comments with a second Cmd+Enter or Ctrl+Enter, including quick consecutive presses.

- [#13775](https://github.com/Kilo-Org/kilocode/pull/13775) [`d842b97`](https://github.com/Kilo-Org/kilocode/commit/d842b975abe21bde9462fcf6bfbfbcae22deb493) - Clear stale Agent Manager running indicators when a background agent finishes while another project is selected.

- [#13704](https://github.com/Kilo-Org/kilocode/pull/13704) [`3c04984`](https://github.com/Kilo-Org/kilocode/commit/3c049845e70296c5d9ae59efbaf23976fef8b12d) - Clear subagent permission prompts after approval or denial, even when the subagent view is closed, and prevent stale recovery responses from restoring resolved prompts.

- [#13738](https://github.com/Kilo-Org/kilocode/pull/13738) [`8d347a9`](https://github.com/Kilo-Org/kilocode/commit/8d347a94160ccb6bd249cfcac2ac1f4e5e0cc176) - Show initial Agent Manager worktree prompts immediately while they are being sent.

- [#13692](https://github.com/Kilo-Org/kilocode/pull/13692) [`8c077fb`](https://github.com/Kilo-Org/kilocode/commit/8c077fbee7fa253c53201dbbf2161b1423cce724) Thanks [@WebReflection](https://github.com/WebReflection)! - Use organization model defaults in VS Code while preserving valid preferences. Return consistent defaults from the CLI provider APIs, respect environment credential overrides, and prevent public-model fallbacks for Org accounts.

- [#13773](https://github.com/Kilo-Org/kilocode/pull/13773) [`f18516e`](https://github.com/Kilo-Org/kilocode/commit/f18516ea000ad0e03d2ef8b7dc7ecd68c6b7c963) - Keep Agent Manager sections collapsed when deleting worktrees and select the nearest visible worktree with a session instead.

- [#13728](https://github.com/Kilo-Org/kilocode/pull/13728) [`0c72ddd`](https://github.com/Kilo-Org/kilocode/commit/0c72dddc81a7655923079d31ad84aea76e541829) - Reduce change-badge overhead in large repositories by reusing unchanged file counts and limiting concurrent file reads.

- [#13783](https://github.com/Kilo-Org/kilocode/pull/13783) [`1ac2666`](https://github.com/Kilo-Org/kilocode/commit/1ac26660f52be7bb18b747bf5ddd91a5c2702481) - Remove the help icon from the Agent Manager toolbar.

- [#13716](https://github.com/Kilo-Org/kilocode/pull/13716) [`05a9013`](https://github.com/Kilo-Org/kilocode/commit/05a9013936b22cbb4e1eaa1d3e6e0e5de6b64929) - Suggest `/review worktree` first in Agent Manager worktrees.

- [#13743](https://github.com/Kilo-Org/kilocode/pull/13743) [`62acc16`](https://github.com/Kilo-Org/kilocode/commit/62acc16a2b26d8375e910605466d9c845456ee4f) - Show sessions that end with a review suggestion as completed in Agent Manager.

- [#13732](https://github.com/Kilo-Org/kilocode/pull/13732) [`beb84eb`](https://github.com/Kilo-Org/kilocode/commit/beb84eb506a3f6f3af9ce9ff2d28df8b260114f6) - Show session titles and agent icons in board communication routes, with readable long-name tooltips and each message body shown once. Expose available agent execution state and report inactive or unknown recipients without implying delivery or reading.

- [#13715](https://github.com/Kilo-Org/kilocode/pull/13715) [`54689a5`](https://github.com/Kilo-Org/kilocode/commit/54689a57793ce7732ac074d59d878f1dd00bf65b) - Keep terminal-only tabs active when switching between Agent Manager worktrees and Local, without adding a new session when returning from another project.

- [#13774](https://github.com/Kilo-Org/kilocode/pull/13774) [`7b4f502`](https://github.com/Kilo-Org/kilocode/commit/7b4f502df3ec572fac3009c7b879983f05975e6b) - Allow Update from base to dismiss unanswered questions and preserve local work with recovery data isolated per worktree, without asking how to save it or bypassing permission approvals.

- [#13683](https://github.com/Kilo-Org/kilocode/pull/13683) [`e0dd6c8`](https://github.com/Kilo-Org/kilocode/commit/e0dd6c8e0a4f737ddf88381b1be35935d5a8c04f) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Open images attached to sent chat messages in an editor tab preview instead of a modal, matching the behavior of images attached in the prompt input.

- [#13714](https://github.com/Kilo-Org/kilocode/pull/13714) [`e7f66a8`](https://github.com/Kilo-Org/kilocode/commit/e7f66a84ef156fa9920b7ba483953af7e1270e9d) - Select the nearest worktree with an open session after deleting a worktree in Agent Manager.

- Updated dependencies [[`bbc26e4`](https://github.com/Kilo-Org/kilocode/commit/bbc26e425a6c75ec012ae6fc739e21320ec3a8a7), [`8c077fb`](https://github.com/Kilo-Org/kilocode/commit/8c077fbee7fa253c53201dbbf2161b1423cce724), [`ce274e6`](https://github.com/Kilo-Org/kilocode/commit/ce274e6762255e2318a477dd225f629ed6708e17), [`b8e1dae`](https://github.com/Kilo-Org/kilocode/commit/b8e1daecebd779b11cf63114b47d62b625876978), [`c0eba39`](https://github.com/Kilo-Org/kilocode/commit/c0eba39ef5cfdd96ce2e220850c091dc9473f848), [`beb84eb`](https://github.com/Kilo-Org/kilocode/commit/beb84eb506a3f6f3af9ce9ff2d28df8b260114f6)]:
  - @kilocode/kilo-indexing@7.5.10
  - @kilocode/kilo-gateway@7.5.10
  - @kilocode/sdk@7.6.0
  - @kilocode/kilo-ui@7.5.10
  - @opencode-ai/core@7.5.10
  - @kilocode/plugin@7.5.10
  - @opencode-ai/ui@7.5.10

## v7.5.9 — 2026-09-02

## 7.5.8

### Minor Changes

- [#13501](https://github.com/Kilo-Org/kilocode/pull/13501) [`9231c25`](https://github.com/Kilo-Org/kilocode/commit/9231c25548060bb7b3b1de413802b65ff61d32a5) - Preview local applications in Agent Manager with embedded developer tools, grouped diagnostics, and review-style element feedback for precise frontend changes.

- [#13556](https://github.com/Kilo-Org/kilocode/pull/13556) [`52d4247`](https://github.com/Kilo-Org/kilocode/commit/52d4247d9c0d2201fb4f3431d1930293489604eb) - Edit queued messages in VS Code before they are sent, while preserving their text and attachments.

- [#13565](https://github.com/Kilo-Org/kilocode/pull/13565) [`49692a6`](https://github.com/Kilo-Org/kilocode/commit/49692a6abfc50ac9956c1f48f5952193fbe65538) - Advertise optional instance kind, process start time, and current Git branch in CLI heartbeats.

- [#13557](https://github.com/Kilo-Org/kilocode/pull/13557) [`6624c1a`](https://github.com/Kilo-Org/kilocode/commit/6624c1a2b07c0a7871532b0b5175d01a03c6e61e) - Allow the orchestrating agent to choose a model, provider, and reasoning effort for each subagent task behind an experimental setting.

- [#13645](https://github.com/Kilo-Org/kilocode/pull/13645) [`cd366ce`](https://github.com/Kilo-Org/kilocode/commit/cd366ceff2e5521e83bcc75475f9ebc0df4ad023) - Show CLI activity in Agent Manager terminal tabs and worktree indicators, including working, waiting for input, retrying, errors, and completed tasks.

### Patch Changes

- [#13630](https://github.com/Kilo-Org/kilocode/pull/13630) [`242bb18`](https://github.com/Kilo-Org/kilocode/commit/242bb18a801d222bb804e72c1fd5cbcf763d9ede) - Use the Agent Manager panel for terminals by default when no destination is configured, while preserving existing choices.

- [#13663](https://github.com/Kilo-Org/kilocode/pull/13663) [`17bb54d`](https://github.com/Kilo-Org/kilocode/commit/17bb54d43af8178808486c4b5cc6760314ea82ad) - Keep finished background agents in the compact header with status icons, and automatically collapse their list when all agents finish.

- [#13666](https://github.com/Kilo-Org/kilocode/pull/13666) [`2e76572`](https://github.com/Kilo-Org/kilocode/commit/2e76572ec99c94d275a19b5726649a3166d6e308) - Speed up forking long sessions while preserving conversation history and independent child sessions.

- [#13646](https://github.com/Kilo-Org/kilocode/pull/13646) [`e803815`](https://github.com/Kilo-Org/kilocode/commit/e803815029ccf8efda3bd544d1833d81677e93fe) - Fix the invisible collapse icon in the background agents panel.

- [#13637](https://github.com/Kilo-Org/kilocode/pull/13637) [`36804b0`](https://github.com/Kilo-Org/kilocode/commit/36804b034bead09f021ca494a9b142f5c82b6ae2) - Fix an empty extension sidebar after installing a build with browser automation support.

- [#13597](https://github.com/Kilo-Org/kilocode/pull/13597) [`915b4a2`](https://github.com/Kilo-Org/kilocode/commit/915b4a2dd7a478ef50c4bc900571288205d11e12) - Show live activity indicators for subagent tabs in Agent Manager, including running, retrying, waiting for input, completed, and error states.

- [#13468](https://github.com/Kilo-Org/kilocode/pull/13468) [`32e4b0a`](https://github.com/Kilo-Org/kilocode/commit/32e4b0a39e9b806c880d2090084964dd3f67fb49) - Release worktree processes and terminals before removing Agent Manager worktrees on Windows.

- [#13601](https://github.com/Kilo-Org/kilocode/pull/13601) [`438dbe7`](https://github.com/Kilo-Org/kilocode/commit/438dbe7c252a246f5b953832c7d220cdc7361683) - Show deliberately stopped agent sessions as idle instead of finished.

- [#13641](https://github.com/Kilo-Org/kilocode/pull/13641) [`dd390c1`](https://github.com/Kilo-Org/kilocode/commit/dd390c1930d0cc548fe997ed20c0f2be7967fd30) - Support stopping the main agent without cancelling background agents, and add Stop all to the VS Code background-agent bar.

- [#13650](https://github.com/Kilo-Org/kilocode/pull/13650) [`a6bdd6f`](https://github.com/Kilo-Org/kilocode/commit/a6bdd6f2c5e2347b1e74ec0e525e72e29822d7c6) - Keep Agent Manager inspector panels open during state updates when browser automation is disabled.

- [#13665](https://github.com/Kilo-Org/kilocode/pull/13665) [`bb87cc8`](https://github.com/Kilo-Org/kilocode/commit/bb87cc850096e4390358bdbf140b81e243f90a70) - Open all background agents at once with compact, matching toolbar controls.

- [#13667](https://github.com/Kilo-Org/kilocode/pull/13667) [`1d8689f`](https://github.com/Kilo-Org/kilocode/commit/1d8689f6d10877589c066c96e81a1e95105ce2f3) - Match answered question text to other tool output and respect the Kilo font size setting.

- [#13610](https://github.com/Kilo-Org/kilocode/pull/13610) [`b5ee423`](https://github.com/Kilo-Org/kilocode/commit/b5ee423c727a5d83b42b807b5ec2aaa3e8d5cfc8) - Restore Agent Manager side panels for each project, worktree, and session when navigating, while keeping closed panels closed.

- [#13605](https://github.com/Kilo-Org/kilocode/pull/13605) [`25d9448`](https://github.com/Kilo-Org/kilocode/commit/25d9448d63dad21da61dc0c6100f3b1b56be5617) - Stop checking for unsupported legacy Kilo migrations at startup while keeping Roo Code session import available.

- [#13604](https://github.com/Kilo-Org/kilocode/pull/13604) [`edb929d`](https://github.com/Kilo-Org/kilocode/commit/edb929d8358efb71c9d2cafe80ab3eff59290b93) - Keep background agent spinners animating smoothly during status updates.

- [#13602](https://github.com/Kilo-Org/kilocode/pull/13602) [`0701c5f`](https://github.com/Kilo-Org/kilocode/commit/0701c5fe494b36465876350cf41c626547156a4f) - Allow subagent task headers to collapse and share the saved timeline preference with the main agent.

- [#13603](https://github.com/Kilo-Org/kilocode/pull/13603) [`08757f7`](https://github.com/Kilo-Org/kilocode/commit/08757f708028b7836011098ccd3cf7d34cdd4d73) - Reduce empty space below the chat prompt in wide Agent Manager panes while preserving the side margins.

- Updated dependencies [[`7c845aa`](https://github.com/Kilo-Org/kilocode/commit/7c845aa0ec8a0ff46f25cff26545260c0126c3f7), [`dd390c1`](https://github.com/Kilo-Org/kilocode/commit/dd390c1930d0cc548fe997ed20c0f2be7967fd30), [`6624c1a`](https://github.com/Kilo-Org/kilocode/commit/6624c1a2b07c0a7871532b0b5175d01a03c6e61e)]:
  - @kilocode/sdk@7.6.0
  - @kilocode/kilo-ui@7.5.7
  - @kilocode/plugin@7.5.7
  - @opencode-ai/ui@7.5.7
  - @opencode-ai/core@7.5.7
  - @kilocode/kilo-gateway@7.5.7
  - @kilocode/kilo-indexing@7.5.7

## jetbrains/v7.1.5 — 2026-09-01

### Fixed

- Keep Agent Manager run/action buttons available while the IDE is indexing, instead of disabling them and showing "waits for analysis" tooltips.


## jetbrains/v7.1.4 — 2026-09-01

### Added

- feat: keep background agents running when the main agent stops by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13641
- feat(remote): advertise instance kind and process identity by @iscekic in https://github.com/Kilo-Org/kilocode/pull/13565
- feat(agent-manager): show CLI activity in terminal tabs and worktrees by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13645
- feat(vscode): open all background agents from the toolbar by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13665

### Fixed

- fix(vscode): preserve packaged Playwright runtime by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13637
- fix(vscode): default Agent Manager terminals to the side panel by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13630
- fix(agent-manager): preserve side panels across context switches by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13610
- fix(vscode): show background agents collapse icon by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13646
- fix(agent-manager): keep inspectors open on browser state updates by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13650
- fix(cli): surface real tool name when tool call repair fails by @maphew in https://github.com/Kilo-Org/kilocode/pull/13446
- fix(vscode): keep finished background agents compact by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13663
- fix(jetbrains): show a changes badge for uncommitted worktree work by @kirillk in https://github.com/Kilo-Org/kilocode/pull/13636
- fix(agent-manager): speed up long-session forks by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13666
- fix(cli): wait for background continuations before headless exit by @lambertjosh in https://github.com/Kilo-Org/kilocode/pull/13623
- fix(jetbrains): rescale Agent Manager list rows on IDE zoom by @kirillk in https://github.com/Kilo-Org/kilocode/pull/13635
- fix(cli): remember bash permission migration by @noobezlol in https://github.com/Kilo-Org/kilocode/pull/12642
- fix(vscode): align answered question font with tool output by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13667
- fix(jetbrains): open the worktree row popup only for pull requests by @kirillk in https://github.com/Kilo-Org/kilocode/pull/13676
- fix(cli): separate environment details from user prompt text by @maphew in https://github.com/Kilo-Org/kilocode/pull/13190

### Changed

- release(jetbrains): v7.1.3 by @kilo-maintainer[bot] in https://github.com/Kilo-Org/kilocode/pull/13634
- Undefined or null by @WebReflection in https://github.com/Kilo-Org/kilocode/pull/13639
- refactor(gateway): share device authorization HTTP requests by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13642
- refactor(vscode): share terminal directory blocking by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13644
- refactor(vscode): share context request bookkeeping by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13643
- refactor(vscode): share not-found error detection by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13647
- refactor(ui): share project-relative path formatting by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13649
- refactor(cli): share common bash permission entries by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13648
- refactor(vscode): share local activity indicator by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13651
- refactor(kilo-console): remove duplicate remote MCP normalization by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13653
- refactor(vscode): reuse Git directory resolver by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13652
- refactor(vscode): share autocomplete FIM model selection by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13655
- refactor(cli): reuse config overlay reader after updates by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13654
- refactor(vscode): reuse Markdown fence formatting by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13657
- refactor(vscode): share dropped mention text insertion by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13656
- refactor(kilo-console): share CLI settings toggle by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13658
- refactor(vscode): reuse metadata leaf validators by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13660
- refactor(vscode): share context menu styles by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13659
- refactor(kilo-console): share model picker choices by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13661
- refactor(vscode): reuse script error formatting by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13662
- refactor(kilo-console): share available provider selection by @marius-kilocode in https://github.com/Kilo-Org/kilocode/pull/13664


## jetbrains/v7.1.3 — 2026-09-01

### Added

- Hover a worktree row to see its pull request details, review state, and CI status at a glance.
- Copy a worktree's branch name, path, or pull request reference (title plus link) from the worktree row menu.
- Guided onboarding on first launch, including a wizard that imports your Kilo v5 settings and providers.

### Fixed

- Selecting a model from a custom provider now resolves its API key environment variable correctly, and keeps custom headers when the variable is cleared.
- Pull request and GitHub status now refresh promptly when you return to the IDE, without flooding the backend with lookups.
- Keep showing a pull request when GitHub declines review details or the API budget is spent, instead of blanking the badges.
- Onboarding and the migration wizard stay usable if Skip or Later fails.
- Center the empty state in the diff editor.
- Worktree row popups no longer clip long pull request titles or jump while the list refreshes.

### Changed

- Refreshed the JetBrains Marketplace listing description.


## jetbrains/v7.1.2 — 2026-08-31

### Added

- Run and manage build/run configurations directly from the worktree editor.
- Render all Mermaid diagram types in chat, not just flowcharts.
- Add worktree transfer safety checks, unified change summaries, setup scripts, and GitHub integration controls.
- Add a session right-click menu with sharing actions.

### Fixed

- Stop showing a false "Git is not installed" warning for worktrees that were deleted from disk.
- Linkify URLs inside inline code in chat.
- Stop the mode picker from cancelling a running session.
- Reduce Kilo Core CLI startup initialization work.

### Changed

- Consolidate worktree change summaries into the Changes panel.


## v7.5.6 — 2026-08-28

## 7.5.6

### Minor Changes

- [#13512](https://github.com/Kilo-Org/kilocode/pull/13512) [`13a9673`](https://github.com/Kilo-Org/kilocode/commit/13a9673d08cfc69eebb89898861a1ee80278f226) - Reference other Agent Manager worktrees with a searchable @ picker that prioritizes recently opened worktrees. Share paths, branches, and session IDs without attaching diffs or chat history. Keep picker results in sync when clearing search.

- [#13533](https://github.com/Kilo-Org/kilocode/pull/13533) [`6d15d18`](https://github.com/Kilo-Org/kilocode/commit/6d15d18fa766aaf6a478b63aa98c10ffd23e3d4c) - Choose a separate model for conversation compaction in Context settings.

- [#13498](https://github.com/Kilo-Org/kilocode/pull/13498) [`46bd29d`](https://github.com/Kilo-Org/kilocode/commit/46bd29d733d69545de60a5100997512756ad61b3) - Review all committed and uncommitted Agent Manager worktree changes with `/review worktree`.

### Patch Changes

- [#13502](https://github.com/Kilo-Org/kilocode/pull/13502) [`094ca19`](https://github.com/Kilo-Org/kilocode/commit/094ca1987e0516dcac6df47c52944b737b87d70e) - Keep Agent Manager worktree spinners active while background agents are running.

- [#13505](https://github.com/Kilo-Org/kilocode/pull/13505) [`b382a3b`](https://github.com/Kilo-Org/kilocode/commit/b382a3b838e317acc284442361b9bae2f39c992e) - Load Agent Manager changes faster and preserve cached diffs when switching sessions.

- [#13499](https://github.com/Kilo-Org/kilocode/pull/13499) [`8c0a570`](https://github.com/Kilo-Org/kilocode/commit/8c0a570222fcc51e23041c63f69db7118d5f4c7b) - Place the prompt navigator on the outer sidebar edge and delay hover previews to avoid accidental popups. Keep the navigator on the right in Agent Manager and editor tabs.

- [#13547](https://github.com/Kilo-Org/kilocode/pull/13547) [`2fd53b0`](https://github.com/Kilo-Org/kilocode/commit/2fd53b027b1dee21a82967180e436524dd8e46b8) - Prevent cleared questions from reappearing after saving settings.

- [#13545](https://github.com/Kilo-Org/kilocode/pull/13545) [`b8058a3`](https://github.com/Kilo-Org/kilocode/commit/b8058a30be6211cf9db234c53aed9db13320ca59) - Clear false failure banners after successful context overflow recovery while preserving terminal errors.

- [#13544](https://github.com/Kilo-Org/kilocode/pull/13544) [`f5a7a1d`](https://github.com/Kilo-Org/kilocode/commit/f5a7a1d61bf7eaaa7bc307a976f6f56150fa6264) - Resume interrupted tasks from the empty send button without adding a chat message.

- [#13546](https://github.com/Kilo-Org/kilocode/pull/13546) [`31e76dd`](https://github.com/Kilo-Org/kilocode/commit/31e76dd11db8eb368216faa175663d8c648df187) - Use configured agent reasoning in new sessions instead of outdated saved defaults, and preserve explicit Default selections.

- [#13540](https://github.com/Kilo-Org/kilocode/pull/13540) [`bac3043`](https://github.com/Kilo-Org/kilocode/commit/bac3043143dec08557c3b9013f1cec3a7193924c) - Avoid checkpoint cleanup errors when deleting worktrees under protected parent folders.

- [#13528](https://github.com/Kilo-Org/kilocode/pull/13528) [`de9e1ed`](https://github.com/Kilo-Org/kilocode/commit/de9e1edcfb87f5650a265f96cfcc092f015c4d77) - Keep queued prompt text visible while attachment context loads, and hide empty queued placeholders and internal messages.

- [#13543](https://github.com/Kilo-Org/kilocode/pull/13543) [`67b299f`](https://github.com/Kilo-Org/kilocode/commit/67b299f66e62a76967f58a0f2da371cc3e699261) - Clear stale failures when an agent resumes, keep optional review suggestions from triggering attention, and explain Agent Manager status icons on hover. Keep progress spinners separate from attention warnings during worktree operations.

- [#13500](https://github.com/Kilo-Org/kilocode/pull/13500) [`c8df9c4`](https://github.com/Kilo-Org/kilocode/commit/c8df9c4a7dc871fcd616accbf1e917241e48f777) - Keep chat scroll position during streaming, including small upward gestures, direction changes, and scrolling over message controls.

- [#13466](https://github.com/Kilo-Org/kilocode/pull/13466) [`64c75a5`](https://github.com/Kilo-Org/kilocode/commit/64c75a53ab29caf408a0fad1f8ae8c8d19565a17) - Prevent intermittent server connection failures during VS Code startup.

- [#13475](https://github.com/Kilo-Org/kilocode/pull/13475) [`be2ec51`](https://github.com/Kilo-Org/kilocode/commit/be2ec51159fdbeeee852c1e25682f3b1cc46036e) - Use the Git executable configured in VS Code when creating worktrees on Windows.

- [#13542](https://github.com/Kilo-Org/kilocode/pull/13542) [`47dc16b`](https://github.com/Kilo-Org/kilocode/commit/47dc16b153829c0aa238c9282ae79ebe7bcbcb3a) - Open running background agents directly from the header and show an overflow count for agents that do not fit.

- [#12830](https://github.com/Kilo-Org/kilocode/pull/12830) [`bb20d34`](https://github.com/Kilo-Org/kilocode/commit/bb20d34d308af96dc0184bfd5f0cd2313f60950d) Thanks [@thomasboom](https://github.com/thomasboom)! - Open files by clicking their names in read tool headers.

- [#13560](https://github.com/Kilo-Org/kilocode/pull/13560) [`454b101`](https://github.com/Kilo-Org/kilocode/commit/454b1013e8673bc2cab87e87b5c2ca69d40a62d0) - Keep dismissed background agents hidden when switching sessions or returning from History and empty chats.

- [#13531](https://github.com/Kilo-Org/kilocode/pull/13531) [`c1d1e9b`](https://github.com/Kilo-Org/kilocode/commit/c1d1e9bcd7e63c52af888fa8f3baf079ff2c6af8) - Keep focus in active text fields when questions appear or refresh.

- [#13476](https://github.com/Kilo-Org/kilocode/pull/13476) [`45202c0`](https://github.com/Kilo-Org/kilocode/commit/45202c0764a2b8946a783f3376b2a1bad75a17ff) - Remove deleted worktree checkpoints without losing conversation history and stop showing activity for deleted sessions.

- [#13548](https://github.com/Kilo-Org/kilocode/pull/13548) [`039a235`](https://github.com/Kilo-Org/kilocode/commit/039a235b6ac492d08c079a035a04a49a01cc175d) - Queue Agent Manager follow-up prompts when the target session is busy instead of rejecting them.

- [#13529](https://github.com/Kilo-Org/kilocode/pull/13529) [`8cb1931`](https://github.com/Kilo-Org/kilocode/commit/8cb1931275b1df6d145b8a283cef550ae2851e29) - Stop offscreen loading animations while preserving their original appearance, and release obsolete transcript pages from memory.

- [#13530](https://github.com/Kilo-Org/kilocode/pull/13530) [`5d1313f`](https://github.com/Kilo-Org/kilocode/commit/5d1313f8a23dc5f58ae66fed35c4756bf81913d5) - Search the latest 5,000 chats across the worktree family and display the best 50 matches in the sidebar and Agent Manager. Skip inaccessible folders from unrelated projects when finding past chats.

- [#13504](https://github.com/Kilo-Org/kilocode/pull/13504) [`f293ecb`](https://github.com/Kilo-Org/kilocode/commit/f293ecbba849384ae8b10bc7735dc79791c62cdf) - Show consistent running, completion, and input-required indicators across session tabs and Agent Manager worktrees.

- [#13553](https://github.com/Kilo-Org/kilocode/pull/13553) [`1e13220`](https://github.com/Kilo-Org/kilocode/commit/1e132201958eb14522968cc7de29ab94d7504c66) - Keep session and worktree activity indicators stable during routine server reconnects without hiding connection failures.

- [#13422](https://github.com/Kilo-Org/kilocode/pull/13422) [`83e2772`](https://github.com/Kilo-Org/kilocode/commit/83e27728e56d461d8c749ba60722836c4bcad1f6) - Recognize sessions discovered in managed Agent Manager worktrees during orchestration actions.

- Updated dependencies [[`13a9673`](https://github.com/Kilo-Org/kilocode/commit/13a9673d08cfc69eebb89898861a1ee80278f226), [`b382a3b`](https://github.com/Kilo-Org/kilocode/commit/b382a3b838e317acc284442361b9bae2f39c992e), [`f5a7a1d`](https://github.com/Kilo-Org/kilocode/commit/f5a7a1d61bf7eaaa7bc307a976f6f56150fa6264), [`f9ddb78`](https://github.com/Kilo-Org/kilocode/commit/f9ddb78b17714075ab4f5d1ccb26f2cdbcd644bf), [`34b10a6`](https://github.com/Kilo-Org/kilocode/commit/34b10a672b3048ed53477a1019f08832b522db2d), [`8cb1931`](https://github.com/Kilo-Org/kilocode/commit/8cb1931275b1df6d145b8a283cef550ae2851e29)]:
  - @opencode-ai/ui@7.5.6
  - @kilocode/kilo-ui@7.5.6
  - @kilocode/sdk@7.5.6
  - @opencode-ai/core@7.5.6
  - @kilocode/kilo-indexing@7.5.6
  - @kilocode/plugin@7.5.6
  - @kilocode/kilo-gateway@7.5.6

## jetbrains/v7.1.1 — 2026-08-28

### Added

- Render Mermaid diagrams directly in JetBrains chat, with editor-tab viewing, zoom, pan, fit-to-view, source view, and PNG copy support.
- Add clearer JetBrains worktree session empty states, labeled create actions, and a persisted toggle for showing or hiding the worktree session list.

### Fixed

- Retry failed JetBrains turns by continuing the original request, keeping transcript and workspace context intact instead of rolling back or appending a placeholder prompt.
- Surface JetBrains failed-turn errors more clearly and hide the failure card as soon as Retry starts.
- Prevent compaction recovery from replaying requests incorrectly, looping, or dropping pending tool progress in Kilo Core.
- Avoid unsafe indexing and checkpoint cleanup behavior in filesystem roots, home directories, and protected parent directories.
- Return real subagent results instead of empty task responses in Kilo Core.
- Avoid duplicated plan-mode permission rule stacking.

### Changed

- Update the pinned Kilo Core CLI used by JetBrains from 7.4.23 to 7.5.5.
- Improve JetBrains worktree session guidance with branch-aware copy and localized empty-state text.


## v7.5.5 — 2026-08-26

## 7.5.5

### Patch Changes

- [#13489](https://github.com/Kilo-Org/kilocode/pull/13489) [`b74dc0c`](https://github.com/Kilo-Org/kilocode/commit/b74dc0c1b60007fedf7a13259e35ee6f040fa89a) - Prevent inaccessible Windows PowerShell execution aliases from blocking CLI and extension startup.

## v7.5.4 — 2026-08-26

## Fixed

- Restore CLI and TUI startup after v7.5.0 could open to a black screen on Windows and macOS.
- Fix the Windows startup failure caused by Bun 1.4 raising `EACCES` while probing `WindowsApps\pwsh.exe`.
- Restore the proven Bun 1.3.14 runtime and non-split compiled CLI configuration from v7.4.23.
- Ship the corrected CLI in the npm package and all stable VS Code Marketplace and Open VSX platform builds.

This release supersedes v7.5.0.

## Upgrade

```sh
npm install -g @kilocode/cli@latest
kilo --version
```

The reported version should be `7.5.4`. VS Code installations receive the corrected extension through the normal stable update channel.

## Validation

- Built and validated all CLI release targets.
- Passed artifact smoke tests on Windows x64/arm64, macOS x64/arm64, Linux x64/arm64, and Alpine x64/arm64.
- Passed the end-to-end pre-publish agent smoke gate.

Fixes [#13467](https://github.com/Kilo-Org/kilocode/issues/13467) and [#13473](https://github.com/Kilo-Org/kilocode/issues/13473). Implemented in [#13481](https://github.com/Kilo-Org/kilocode/pull/13481).

## v7.5.0 — 2026-08-26

## 7.5.0

### Minor Changes

- [#13372](https://github.com/Kilo-Org/kilocode/pull/13372) [`7baefdd`](https://github.com/Kilo-Org/kilocode/commit/7baefdddf3717ec88de37e455b4e6544bfd02096) - Add an agent_manager answer action so orchestrating agents can resolve a managed session's pending question instead of only stopping it. Prompting a session that waits on input now fails immediately with the pending question named.

- [#13306](https://github.com/Kilo-Org/kilocode/pull/13306) [`abcb6cb`](https://github.com/Kilo-Org/kilocode/commit/abcb6cb5973cb54f8b71b4809c0fa8a4577cf2ca) - Open edit, write, and patch changes in the Agent Manager side panel instead of a new editor tab. Clicking a tool or file name expands the change inline, while the open-diff button shows the full change in the Agent Manager panel, or in a diff tab outside Agent Manager. Multi-file patches now open every changed file, each sized to its own diff, and the panel keeps the unified or split view you last selected.

- [#11611](https://github.com/Kilo-Org/kilocode/pull/11611) [`486f66c`](https://github.com/Kilo-Org/kilocode/commit/486f66c022c0f240bdc68368c1e7cf5c1611c0a6) - View current provider plan usage and quota windows in the CLI and VS Code profile.

- [#13245](https://github.com/Kilo-Org/kilocode/pull/13245) [`190b4a4`](https://github.com/Kilo-Org/kilocode/commit/190b4a4dc6ed38a71978a82c4cc2d3e0824106e7) - Add an Agent Manager document inspector that previews Markdown files with inline review comments that can be sent to the agent, while source files open in the VS Code editor.

### Patch Changes

- [#13421](https://github.com/Kilo-Org/kilocode/pull/13421) [`0f576d0`](https://github.com/Kilo-Org/kilocode/commit/0f576d0866b56780b22ab60701e03f2780835d49) - Fix project-scoped Agent Manager history activation and session placement.

- [#13428](https://github.com/Kilo-Org/kilocode/pull/13428) [`e0aeb84`](https://github.com/Kilo-Org/kilocode/commit/e0aeb847135bf7b3286a342e845832af9ecefd43) - Prevent overlapping Agent Manager history activations from leaving stale project-switch state.

- [#13448](https://github.com/Kilo-Org/kilocode/pull/13448) [`613414e`](https://github.com/Kilo-Org/kilocode/commit/613414eb706d9eebc257e55b2203ad0b6defb5f3) - Prevent false GitHub CLI installation errors when switching Agent Manager projects.

- [#13407](https://github.com/Kilo-Org/kilocode/pull/13407) [`2f73013`](https://github.com/Kilo-Org/kilocode/commit/2f7301368f6997d6a1e897fbe4a6c6a37cf9e7da) - Replace the per-project SESSIONS list in the Agent Manager sidebar with a per-project history button. The sessions view is now scoped to the clicked project and offers per-session actions to resume it in the project's local tabs or in a freshly created worktree.

- [#13369](https://github.com/Kilo-Org/kilocode/pull/13369) [`6b86526`](https://github.com/Kilo-Org/kilocode/commit/6b8652657a7cbe1c6bfe7aa1bef89932f1a1c502) - Move Agent Manager worktree settings into the Kilo Settings editor and add project selection for multi-project workspaces.

- [#13406](https://github.com/Kilo-Org/kilocode/pull/13406) [`47599a3`](https://github.com/Kilo-Org/kilocode/commit/47599a304f7c051f480a4e813a5e49156f06784e) - Use the DOM renderer for Agent Manager terminals to avoid WebGL context failures, while batching output and pausing hidden-terminal rendering

- [#13366](https://github.com/Kilo-Org/kilocode/pull/13366) [`acc1c21`](https://github.com/Kilo-Org/kilocode/commit/acc1c217bb50a77dc810f369cab5fe0dc24a3de5) - Even out the Agent Manager toolbar: every context button now shares one height and spacing, and the Run, terminal, and new-session split buttons use identical chevrons, so the row stays tidy no matter which optional actions are shown.

- [#13188](https://github.com/Kilo-Org/kilocode/pull/13188) [`097a922`](https://github.com/Kilo-Org/kilocode/commit/097a922ec9cb9ff297e4acbe787b4e3398a188ad) Thanks [@LCZcn96](https://github.com/LCZcn96)! - Ensure Enter and Tab execute the slash command highlighted in the VS Code command picker.

- [#13356](https://github.com/Kilo-Org/kilocode/pull/13356) [`3e2adcf`](https://github.com/Kilo-Org/kilocode/commit/3e2adcf37041aadf6bc7a6177f2c292380a86edd) - Keep answered questions expanded in chat history and improve their text wrapping.

- [#13410](https://github.com/Kilo-Org/kilocode/pull/13410) [`d6e50cd`](https://github.com/Kilo-Org/kilocode/commit/d6e50cd1523ebc65cf65aa98a547b89d36841835) - Reduce duplicate event processing across VS Code when multiple sessions run concurrently.

- [#13353](https://github.com/Kilo-Org/kilocode/pull/13353) [`2a9dcbe`](https://github.com/Kilo-Org/kilocode/commit/2a9dcbe8957f4c0dc5dfbd3c03afcc718da022d7) - Add a button to copy pull request links from the Agent Manager PR panel.

- Enable background subagents by default, including automatic completion notifications and foreground-to-background promotion. Running background agents now appear in a collapsible strip in the chat header, so they stay visible after the task card scrolls away and can be opened from there.

- [#13419](https://github.com/Kilo-Org/kilocode/pull/13419) [`78692a7`](https://github.com/Kilo-Org/kilocode/commit/78692a7f2a06d6b30e1b75385888fdb2f823a26a) - Allow Agent Manager task model overrides to specify an explicit provider when resolving model names.

- [#13411](https://github.com/Kilo-Org/kilocode/pull/13411) [`ea74bda`](https://github.com/Kilo-Org/kilocode/commit/ea74bda3996d55ace921a80b96e3ddb65636652b) - Load Agent Manager worktree diffs faster and keep warmed reviews visible when switching worktrees.

- [#13447](https://github.com/Kilo-Org/kilocode/pull/13447) [`ecb864e`](https://github.com/Kilo-Org/kilocode/commit/ecb864e0fa2d4297d432190249f479dac6ccc88d) - Speed up Agent Manager worktree creation and show ready sessions immediately.

- [#13425](https://github.com/Kilo-Org/kilocode/pull/13425) [`e748515`](https://github.com/Kilo-Org/kilocode/commit/e748515a2c45b7833cc4ffd626b0df9d6f925a76) - Prevent stale subagent cards from showing background promotion and respect the background-subagent capability when promoting running tasks.

- [#13450](https://github.com/Kilo-Org/kilocode/pull/13450) [`6a9fb70`](https://github.com/Kilo-Org/kilocode/commit/6a9fb70ab97938a6b3ee31af2271e927aeaf315b) - Prevent completed sessions from staying stuck in the working state.

- [#13417](https://github.com/Kilo-Org/kilocode/pull/13417) [`45695e6`](https://github.com/Kilo-Org/kilocode/commit/45695e6190687a8d8cde17c09263799f7b793747) - Prevent duplicate-event tracking from suppressing delayed sync events after reconnects or high event bursts.

- [#13316](https://github.com/Kilo-Org/kilocode/pull/13316) [`9694ff6`](https://github.com/Kilo-Org/kilocode/commit/9694ff66007c3ccf303da1a540e143548f37038d) - Keep the working indicator and the session actions row flush with the prompt input, so the row above the composer no longer jumps when a turn finishes.

- [#13393](https://github.com/Kilo-Org/kilocode/pull/13393) [`7e633ce`](https://github.com/Kilo-Org/kilocode/commit/7e633ce277fa542b475d934e23f6c1e03d300ac0) - Allow each foreground subagent to continue in the background independently, including when several subagents run in parallel.

- [#13430](https://github.com/Kilo-Org/kilocode/pull/13430) [`2a00175`](https://github.com/Kilo-Org/kilocode/commit/2a001759d29fb23c99aed55840a1aed42a5d6674) - Prevent duplicate reasoning and response text while subagent sessions are open.

- [#13309](https://github.com/Kilo-Org/kilocode/pull/13309) [`fd0b639`](https://github.com/Kilo-Org/kilocode/commit/fd0b639613a2cad682f703c838580e1637015a05) - Allow model selector searches to match provider prefixes in colon-separated model names.

- [#13453](https://github.com/Kilo-Org/kilocode/pull/13453) [`6722ea6`](https://github.com/Kilo-Org/kilocode/commit/6722ea600ef30eac7149bd49eb9b3b64dd207e75) Thanks [@WebReflection](https://github.com/WebReflection)! - Keep Review-first onboarding permissions editable in Auto-Approve settings.

- [#13365](https://github.com/Kilo-Org/kilocode/pull/13365) [`98ea338`](https://github.com/Kilo-Org/kilocode/commit/98ea338c829e0cb2e4b155c9a248dab08ec5727f) - Prefer PowerShell 7 over legacy Windows PowerShell 5.1 when running agent commands on Windows. PowerShell 7 installs are now found even when `pwsh` is missing from PATH, Agent Manager setup and run scripts launch pwsh when available, and an explicit `shell` in kilo.json still overrides detection.

- [#13457](https://github.com/Kilo-Org/kilocode/pull/13457) [`c880daf`](https://github.com/Kilo-Org/kilocode/commit/c880daf76447eadf67d28ed25d1de18b76777b92) - Preserve the chat reading position when dragging the scrollbar or using extended scrolling gestures while a response streams.

- [#13310](https://github.com/Kilo-Org/kilocode/pull/13310) [`c171b12`](https://github.com/Kilo-Org/kilocode/commit/c171b12fc32246020574a533bb47c84effe7d75c) - Use a shared responsive minimum gutter for prompt inputs across the VS Code sidebar, Agent Manager, and worktree dialogs.

- [#13376](https://github.com/Kilo-Org/kilocode/pull/13376) [`e779480`](https://github.com/Kilo-Org/kilocode/commit/e779480abc7959738203fa04c632c6608080efaa) - Stop manually aborted turns without briefly showing an interruption warning.

- [#13304](https://github.com/Kilo-Org/kilocode/pull/13304) [`6e55714`](https://github.com/Kilo-Org/kilocode/commit/6e557140930e0cb3bb6f1e1a5b2955a75e19c975) - Load the correct Agent Manager session history on the first worktree switch between projects.

- [#13405](https://github.com/Kilo-Org/kilocode/pull/13405) [`538b893`](https://github.com/Kilo-Org/kilocode/commit/538b893a6a16bd151fda042d6038797e84aa8818) - Remove the model reset button from the chat and worktree prompt controls.

- [#13370](https://github.com/Kilo-Org/kilocode/pull/13370) [`062d11f`](https://github.com/Kilo-Org/kilocode/commit/062d11f996704007c0cc5b098eb8059640865ab3) - Restore attached images when undoing the last prompt.

- [#13358](https://github.com/Kilo-Org/kilocode/pull/13358) [`8bff56d`](https://github.com/Kilo-Org/kilocode/commit/8bff56de664504b1490c5109e9a15616b6336d69) - Show review comment text directly in the chat message instead of hiding it behind a click. Each comment is now a row with the file, line and a two-line preview, expands in place to reveal the full body and code snippet, and long lists collapse to the first few comments with a "Show more" toggle. Opening a source file from a review comment now uses a native VS Code editor tab.

- [#13458](https://github.com/Kilo-Org/kilocode/pull/13458) [`b925f25`](https://github.com/Kilo-Org/kilocode/commit/b925f25a1af3d2a624ffffc78be0aef330443f70) - Add consistent spacing between review comments and their follow-up message in chat.

- [#13429](https://github.com/Kilo-Org/kilocode/pull/13429) [`5da8d6b`](https://github.com/Kilo-Org/kilocode/commit/5da8d6b851b70fb079bede223c771dab8c922072) - Preserve the Agent Manager sidebar scroll position when worktrees are deleted.

- [#13408](https://github.com/Kilo-Org/kilocode/pull/13408) [`4736250`](https://github.com/Kilo-Org/kilocode/commit/4736250c4fb99f9bed91df86f94ee91a66a59dae) - Keep the session transcript glued to its bottom while a response streams, so text, tool cards, reasoning, and message actions no longer twitch as they update.

- [#13379](https://github.com/Kilo-Org/kilocode/pull/13379) [`54bb7f3`](https://github.com/Kilo-Org/kilocode/commit/54bb7f3de063501ea123df98aee41273072f1045) - Stop moving editor context between user messages so providers with prefix caching, including local models, can reuse the conversation across turns.

- [#13416](https://github.com/Kilo-Org/kilocode/pull/13416) [`b1f1dec`](https://github.com/Kilo-Org/kilocode/commit/b1f1dec04e2cf49f85c8745f0b480c9f53a4f3ff) - Use a browser-valid close code when Agent Manager terminal replay exceeds its buffer limit

- [#13221](https://github.com/Kilo-Org/kilocode/pull/13221) [`8038220`](https://github.com/Kilo-Org/kilocode/commit/80382209e823289ce4f05e15aff4b50cbe019ad2) - Prevent Agent Manager terminal processes from escaping cleanup while a worktree is deleted.

- Updated dependencies [[`c880daf`](https://github.com/Kilo-Org/kilocode/commit/c880daf76447eadf67d28ed25d1de18b76777b92), [`486f66c`](https://github.com/Kilo-Org/kilocode/commit/486f66c022c0f240bdc68368c1e7cf5c1611c0a6), [`4736250`](https://github.com/Kilo-Org/kilocode/commit/4736250c4fb99f9bed91df86f94ee91a66a59dae)]:
  - @kilocode/kilo-ui@7.5.0

## jetbrains/v7.1.0 — 2026-08-27

### Added

- Add the JetBrains Agent Manager beta for creating, opening, organizing, renaming, deleting, and tracking worktree-based tasks and their sessions from the IDE.
- Show Agent Manager worktree activity, changes, ahead/behind, pull request, failure, and attention badges with clearer row actions, menus, tooltips, and drag-and-drop reordering.
- Add New, From PR, and From Branch tabs to the New Worktree dialog for clearer worktree creation and import flows.
- Add JetBrains logging settings with log reveal and backend log download actions for easier diagnostics.
- Add JetBrains workflow settings so workflows can be reviewed and managed from the plugin.
- Show permission-prompt diffs and approval reasons on JetBrains tool cards before acting on tool requests.
- Open sub-agent sessions in JetBrains editor tabs with live collapsed task previews.
- Add Retry to failed JetBrains chat turns so the original request can be rerun without retyping.

### Fixed

- Improve Agent Manager reliability by anchoring worktrees to the main repository storage, pruning stale metadata, hiding dead managed worktrees, refusing unmanaged paths, and preserving session history by worktree.
- Keep failed, stopped, deleted, resumed, and recovered JetBrains sessions represented correctly in chat, session lists, worktree rows, activity badges, and Agents-tab attention dots.
- Detect unsupported JetBrains remote workspaces and missing or moved worktree folders with clearer in-session states instead of ambiguous failures.
- Keep slash completion open and responsive while typing quickly.
- Stabilize JetBrains chat and Agent Manager layout, including header popups, PR badges, row spacing, hover popups, overlays, worktree tab painting, and dialog branch pickers.
- Preserve project-level snapshot disabling across restarts after choosing to disable snapshots from the slow-repo prompt.
- Keep Ask and Plan modes read-only even when broad permission rules are configured.
- Improve Kilo Core reliability for JetBrains by preserving output budgets, recovering reasoning-only incomplete responses, preserving Cerebras completion limits, restoring terminal startup, and removing duplicate skill catalog content from prompts.
- Fix Agent Manager session creation on strict providers and OpenAI Responses API models by allowing nullable tool fields and explicit provider selection.
- Clear empty failed assistant responses when sending a normal follow-up after a provider failure.

### Changed

- Update the pinned Kilo Core CLI used by JetBrains from 7.4.22 to 7.4.23.
- Improve Kilo Core cold and warm startup speed for JetBrains and other clients.
- Show failed-turn details in a clearer error card with the error kind and retry action, while manually stopped turns render as a muted "Stopped" note.
- Put new, imported, or moved Agent Manager worktrees at the top of the list unless manually reordered.
- Make Agent Manager rows visually quieter with regular-weight labels, subdued idle icons, and less stale deleted-session status.
- Remove the experimental agent requirements and task-aware output pruning features from the bundled Kilo Core runtime.
- Remove an unused JetBrains Compose compiler plugin dependency.


## v7.4.23 — 2026-08-20

## 7.4.23

### Minor Changes

- [#13010](https://github.com/Kilo-Org/kilocode/pull/13010) [`b5bf1d9`](https://github.com/Kilo-Org/kilocode/commit/b5bf1d996b2d314674d086e0574971c51d33d43e) - Support setting default open or collapsed state for MCP and generic tool blocks in Display settings

- [#13241](https://github.com/Kilo-Org/kilocode/pull/13241) [`ea4f9e0`](https://github.com/Kilo-Org/kilocode/commit/ea4f9e0f0d7352427670291ffe92de2adc477e65) - Rework PR review comments in the Agent Manager PR panel: resolved threads now collapse into one-line rows in a Resolved group instead of being dimmed, each thread shows its replies, and every card has prominent Send to agent, Resolve, Copy, Open file, and Open on GitHub actions. A single button sends all unresolved comments to the agent, and comments arrive as structured review comments instead of pasted text.

- [#13173](https://github.com/Kilo-Org/kilocode/pull/13173) [`53d0af7`](https://github.com/Kilo-Org/kilocode/commit/53d0af74f61c1d5760ad10d0fddafde6ddef4bad) - Open delegated subagent sessions in Agent Manager inspector tabs alongside terminals.

### Patch Changes

- [#12977](https://github.com/Kilo-Org/kilocode/pull/12977) [`b9a48bf`](https://github.com/Kilo-Org/kilocode/commit/b9a48bff94702bd25549bb53200df6f43b541084) - Fix Agent Manager project accordions that stayed on a loading indicator until you clicked into them. Expanded projects other than the active one now receive their worktrees, sessions, and git stats as soon as Agent Manager opens and again after the panel reloads. While a project is still loading, its local row and section headings stay in place and the rows below fade in as skeleton placeholders instead of showing a single centered spinner, so several projects loading at once look consistent.

- [#13230](https://github.com/Kilo-Org/kilocode/pull/13230) [`99e0e81`](https://github.com/Kilo-Org/kilocode/commit/99e0e81185560bd43b45ca2007c3029acaec5edb) - Capture `@terminal` from the focused Agent Manager terminal, including embedded Run and Setup terminals, instead of using an unrelated active VS Code terminal.

- [#13121](https://github.com/Kilo-Org/kilocode/pull/13121) [`e2966ab`](https://github.com/Kilo-Org/kilocode/commit/e2966abcba4906383d13b385d61ecd50016e4d7d) - Keep the selected agent after switching from Ask to Code, and remind the model that previous Ask-mode restrictions no longer apply.

- [#13200](https://github.com/Kilo-Org/kilocode/pull/13200) [`59048c4`](https://github.com/Kilo-Org/kilocode/commit/59048c44bdd1a443503b416fde6fa81034460642) - Keep the Agent Manager inline diff position stable while scrolling upward through large reviews

- [#13263](https://github.com/Kilo-Org/kilocode/pull/13263) [`27ba156`](https://github.com/Kilo-Org/kilocode/commit/27ba156ce129bf86b4fd548c7d0246f51339cb4e) - Use the remote's current default branch for diff totals and new worktrees when local Git metadata still points to a retired trunk.

- [#12542](https://github.com/Kilo-Org/kilocode/pull/12542) [`5d713f7`](https://github.com/Kilo-Org/kilocode/commit/5d713f7d9602db301452292d20f83b87c22f6a30) Thanks [@Githubguy132010](https://github.com/Githubguy132010)! - Remove installed agents from every writable configuration source and report removal failures.

- [#13175](https://github.com/Kilo-Org/kilocode/pull/13175) [`ae26eed`](https://github.com/Kilo-Org/kilocode/commit/ae26eed9b14741dede333c4093ded1281cb73c0b) - Keep provider names out of the compact prompt model selector label while retaining them in the expanded picker.

- [#13209](https://github.com/Kilo-Org/kilocode/pull/13209) [`ff16bc2`](https://github.com/Kilo-Org/kilocode/commit/ff16bc2c9c25d4f11af5303cd79267546456cb1e) - Keep Agent Manager terminals and nested Kilo sessions alive across configuration reloads and location idle eviction, while cleaning them up on explicit close, worktree deletion, and server shutdown.

- [#13162](https://github.com/Kilo-Org/kilocode/pull/13162) [`8ad3f90`](https://github.com/Kilo-Org/kilocode/commit/8ad3f9088989c234c8161d0f820a501e3a33ffc4) - Use NVIDIA Parakeet TDT 0.6B v3 as the default speech-to-text model while retaining dynamic model discovery and offline fallback support.

- [#13183](https://github.com/Kilo-Org/kilocode/pull/13183) [`017410b`](https://github.com/Kilo-Org/kilocode/commit/017410bf6fbfdaa1e3a050f00f7e0cd3dd5371ad) - Accept JWT share tokens when importing a session from a Kilo share URL.

- [#13196](https://github.com/Kilo-Org/kilocode/pull/13196) [`b4c8387`](https://github.com/Kilo-Org/kilocode/commit/b4c83878e94be07d2f7b9f7c219635ee76792ee0) - Fix Agent Manager PR and base-branch worktrees when a repository uses a restrictive Git fetch refspec.

- [#13264](https://github.com/Kilo-Org/kilocode/pull/13264) [`10b73a4`](https://github.com/Kilo-Org/kilocode/commit/10b73a4ca722cea7f18d021b579e30a63cdff354) - Prevent invalid GitHub check timestamps from displaying incorrect PR durations.

- [#13261](https://github.com/Kilo-Org/kilocode/pull/13261) [`ab08cba`](https://github.com/Kilo-Org/kilocode/commit/ab08cbaa03683e6bef969ce18a5f7cd32af43beb) - Keep Agent Manager subagent inspector tabs aligned with the selected session and worktree.

- [#13168](https://github.com/Kilo-Org/kilocode/pull/13168) [`ba2e20a`](https://github.com/Kilo-Org/kilocode/commit/ba2e20a87dead59858b2af5c6b63d8fd81eac798) - Restore incremental assistant text streaming across Kilo chat surfaces.

- [#13246](https://github.com/Kilo-Org/kilocode/pull/13246) [`efa48c8`](https://github.com/Kilo-Org/kilocode/commit/efa48c8cda9e81cdc1dccc841f1bd237976428c2) - Keep tool-output action buttons visible above streamed output.

- [#13262](https://github.com/Kilo-Org/kilocode/pull/13262) [`5300ce5`](https://github.com/Kilo-Org/kilocode/commit/5300ce51f3e0fcaebc1068dc57f467a86083b006) - Use the displayed current branch as the base when creating a worktree from the New Worktree dialog.

- [#13158](https://github.com/Kilo-Org/kilocode/pull/13158) [`c4dcb3d`](https://github.com/Kilo-Org/kilocode/commit/c4dcb3d225feb571c71b08c85f129aba5600dc3e) - Keep file mention suggestions current and scoped to the active workspace while preserving instant cached results.

- [#11728](https://github.com/Kilo-Org/kilocode/pull/11728) [`2246ef7`](https://github.com/Kilo-Org/kilocode/commit/2246ef70b55b93db9b84cb8a6a9e1ae9dbc29fa2) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Typing extra text after the `/memory show` command (for example `/memory show my notes`) used to clear that text from the chat input when the command ran. The text now stays in the input so you don't lose what you typed.

- [#13156](https://github.com/Kilo-Org/kilocode/pull/13156) [`be8b85c`](https://github.com/Kilo-Org/kilocode/commit/be8b85c8ce5222edd94d9fa5b8cbe11136e06d5a) - Optimize Agent Manager tab switching and context transition latency

- [#13154](https://github.com/Kilo-Org/kilocode/pull/13154) [`5b06d7d`](https://github.com/Kilo-Org/kilocode/commit/5b06d7dea047795b882ead9896902bcf3d0bf4ea) - Optimize large session loading performance and reduce reactive re-render overhead in the webview.

- [#13155](https://github.com/Kilo-Org/kilocode/pull/13155) [`f9df66c`](https://github.com/Kilo-Org/kilocode/commit/f9df66c9c57ec6346782c7062f328ea881f05734) - Optimize TaskHeader and timeline bar calculation performance in the webview.

- [#13201](https://github.com/Kilo-Org/kilocode/pull/13201) [`bee6fb3`](https://github.com/Kilo-Org/kilocode/commit/bee6fb3b237ff5be73d76eba9d69ec7237cebcc5) - Keep the Allow and Deny buttons reachable when a permission prompt contains a large diff or a long command: the prompt now scrolls its own content and shrinks with the available chat height instead of pushing its buttons out of view

- [#13213](https://github.com/Kilo-Org/kilocode/pull/13213) [`3793736`](https://github.com/Kilo-Org/kilocode/commit/3793736c82feae46b462ed9195d3b1253387f6bd) - Render Agent Manager pull request comment diffs with the Pierre-backed diff viewer and syntax highlighting.

- [#13174](https://github.com/Kilo-Org/kilocode/pull/13174) [`60aee11`](https://github.com/Kilo-Org/kilocode/commit/60aee1118e24f7fc27a6bb6f1df114bc9f5d702b) - Preserve cached reasoning variants when starting new VS Code sessions.

- [#13194](https://github.com/Kilo-Org/kilocode/pull/13194) [`af158e6`](https://github.com/Kilo-Org/kilocode/commit/af158e6156f6906e6e34846afe9bbe6e7679f246) - Prevent subagent descriptions from appearing as Agent Manager worktree titles.

- [#13222](https://github.com/Kilo-Org/kilocode/pull/13222) [`26a9c44`](https://github.com/Kilo-Org/kilocode/commit/26a9c44f63ef10f545c36b67651cda0b0c4d1036) - Remove the separate trust action from Agent Manager multi-project repositories. Added projects are now immediately available, while VS Code workspace trust still protects setup and run scripts.

- [#13225](https://github.com/Kilo-Org/kilocode/pull/13225) [`da10638`](https://github.com/Kilo-Org/kilocode/commit/da1063865480bb7cd2aeeb8c18a949a805bd4872) - Remove the experimental agent requirements check and its configuration flag.

- [#13226](https://github.com/Kilo-Org/kilocode/pull/13226) [`ba45731`](https://github.com/Kilo-Org/kilocode/commit/ba4573185031583079ffff9c2b4c8c2f1112e6ba) - Remove the floating scroll-to-top button from the Agent Manager PR sidebar.

- [#13214](https://github.com/Kilo-Org/kilocode/pull/13214) [`e1bcb32`](https://github.com/Kilo-Org/kilocode/commit/e1bcb320d94efe6ed8abf7c33fe6475a67a2e1e7) - Remove the experimental task-aware tool-output pruning feature and its related settings and indicators.

- [#13167](https://github.com/Kilo-Org/kilocode/pull/13167) [`bc395d6`](https://github.com/Kilo-Org/kilocode/commit/bc395d6b40962ed8c0b4e4cdd0bb42ea20612cba) - Restore live Git change statistics on the Agent Manager diff toggle for local and worktree selections.

- [#13236](https://github.com/Kilo-Org/kilocode/pull/13236) [`dd8947a`](https://github.com/Kilo-Org/kilocode/commit/dd8947abb5b5a11a49aa75be6f6d60312ee76bbc) - Ensure interactive terminal state is isolated per directory and cleaned up when its scope closes.

- [#13142](https://github.com/Kilo-Org/kilocode/pull/13142) [`f8dce5b`](https://github.com/Kilo-Org/kilocode/commit/f8dce5b457474800f89a38ed69aa0ade380ccf80) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Fix agent mode switch getting stuck on draft/cloud-import sessions: apply the explicitly selected agent instead of reverting to the stale session agent.

- [#13177](https://github.com/Kilo-Org/kilocode/pull/13177) [`3387172`](https://github.com/Kilo-Org/kilocode/commit/3387172a5380ccd0239d494f55a92eba00891ae1) - Show the model provider next to every model in the model selector.

- [#13176](https://github.com/Kilo-Org/kilocode/pull/13176) [`f1909f9`](https://github.com/Kilo-Org/kilocode/commit/f1909f9c4e5a74f367df9d10ad8b1e17f44d2b65) - Keep queued prompts visible while the server confirms and loads their message parts.

- [#13164](https://github.com/Kilo-Org/kilocode/pull/13164) [`181363e`](https://github.com/Kilo-Org/kilocode/commit/181363e1d148cce9229365bc20f77ecf1c912101) - Show token throughput by default, with a Display setting to hide it when needed.

- [#11728](https://github.com/Kilo-Org/kilocode/pull/11728) [`2246ef7`](https://github.com/Kilo-Org/kilocode/commit/2246ef70b55b93db9b84cb8a6a9e1ae9dbc29fa2) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Preserve existing text when selecting a slash command at the start of the chat input. Previously, typing `/new` or another slash command with text before the cursor would wipe the existing content entirely.

- [#13231](https://github.com/Kilo-Org/kilocode/pull/13231) [`c995fd1`](https://github.com/Kilo-Org/kilocode/commit/c995fd1ae7b0e4ed47be729edcc9c07347c867d4) - Keep the conversation from shifting when a turn starts or finishes. The working indicator and the session actions now share one row above the composer that keeps its height in both states, instead of resizing two separate areas.

- [#13270](https://github.com/Kilo-Org/kilocode/pull/13270) [`10b6701`](https://github.com/Kilo-Org/kilocode/commit/10b67018693b75443dcc3b15912c91c085d8ae3b) - Keep the working indicator steady while the agent works: the status label now shimmers and glides into its new width instead of jumping the spinner sideways on every status change.

- [#13229](https://github.com/Kilo-Org/kilocode/pull/13229) [`76d6ce3`](https://github.com/Kilo-Org/kilocode/commit/76d6ce3e7e96f7c4c0be323e9059353c3d8a89ae) - Make Agent Manager shortcuts follow the focused area. In the center, Cmd/Ctrl+T creates a new session tab and Cmd/Ctrl+Shift+T creates a central terminal tab, whether the prompt or a central terminal is focused. In the right sidebar terminal, Cmd/Ctrl+T creates another sidebar terminal tab and Cmd/Ctrl+Shift+T does nothing. Returning from a terminal with Cmd/Ctrl+Shift+M restores the previous session tab before focusing its prompt. Update the shortcut dialog and hints to show the distinct actions.

- [#13265](https://github.com/Kilo-Org/kilocode/pull/13265) [`8461a2f`](https://github.com/Kilo-Org/kilocode/commit/8461a2f7762687886d8284c49eb17ed137091969) - Bootstrap missing locked workspace dependencies before building the extension from an Agent Manager worktree.

- [#13179](https://github.com/Kilo-Org/kilocode/pull/13179) [`2477bde`](https://github.com/Kilo-Org/kilocode/commit/2477bde2c25e46a46489be436de0c332f195837b) - Open `/sessions` on a git worktree with the Worktree history filter selected by default.

- Updated dependencies [[`97abdab`](https://github.com/Kilo-Org/kilocode/commit/97abdab66cf0bc01c8f3364e5f640dadde15b7d3), [`cba6ebc`](https://github.com/Kilo-Org/kilocode/commit/cba6ebc6fa7ba313bc0aae51550389626621d9c5), [`f39e163`](https://github.com/Kilo-Org/kilocode/commit/f39e1631855859222966350bd5fae373b9877297), [`e1bcb32`](https://github.com/Kilo-Org/kilocode/commit/e1bcb320d94efe6ed8abf7c33fe6475a67a2e1e7)]:
  - @opencode-ai/core@7.4.23
  - @kilocode/kilo-ui@7.4.23
  - @kilocode/kilo-gateway@8.0.0
  - @opencode-ai/ui@7.4.23
  - @kilocode/kilo-indexing@7.4.23

## jetbrains/v7.0.16 — 2026-08-14

### Fixed

- Improve JetBrains chat readability with refreshed session surfaces, softer spacing, clearer prompt bubbles, and more consistent hover states.
- Make JetBrains CLI downloads more reliable by retrying transient failures and rate limits, and by avoiding authentication on public CLI asset fetches.

### Changed

- Update the JetBrains plugin CLI pin to Kilo Core 7.4.22.
- Refresh Kilo Core with upstream provider, model variant, and session runtime updates.


## v7.4.22 — 2026-08-13

## 7.4.22

### Minor Changes

- [#11219](https://github.com/Kilo-Org/kilocode/pull/11219) [`8013e5f`](https://github.com/Kilo-Org/kilocode/commit/8013e5f50451225bb32b1284579322c137f497e3) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Make file references in agent responses clickable by validating inline code spans against the filesystem. Code spans that match real files in the workspace become clickable links that open the file at the referenced line. Non-existent paths stay as plain code. Also adds fallback workspace search and "File not found" warning when clicking dead links.

- [#13071](https://github.com/Kilo-Org/kilocode/pull/13071) [`3e3dd3d`](https://github.com/Kilo-Org/kilocode/commit/3e3dd3dcb2a711192ec2477ef7c0532b11f67886) Thanks [@cosi-conda](https://github.com/cosi-conda)! - Add Agent Manager PR comment actions: resolve/unresolve review threads, jump to comments section, and scroll-to-top for PR diff view.

- [#13084](https://github.com/Kilo-Org/kilocode/pull/13084) [`5c97b48`](https://github.com/Kilo-Org/kilocode/commit/5c97b481d233d294859bcb737448661910fd4916) - Remove the built-in experimental Morph WarpGrep codebase search tool and ignore its retired configuration flag.

### Patch Changes

- [#13063](https://github.com/Kilo-Org/kilocode/pull/13063) [`ca9a99f`](https://github.com/Kilo-Org/kilocode/commit/ca9a99ffd8f118b5445e0fc2c890c4c6dd797d66) - Show and select the model's default reasoning variant in chat and Agent Manager.

- [#13100](https://github.com/Kilo-Org/kilocode/pull/13100) [`753d560`](https://github.com/Kilo-Org/kilocode/commit/753d5609859f2b646c404392e71ca048714f61dd) - Support structured AWS access keys and Google Cloud service-account JSON when connecting Bedrock and Vertex AI in VS Code.

- [#12373](https://github.com/Kilo-Org/kilocode/pull/12373) [`3a99f36`](https://github.com/Kilo-Org/kilocode/commit/3a99f36d96d316f03d481d7b120b9f1aaca243f1) Thanks [@mvanhorn](https://github.com/mvanhorn)! - Fix subagent permission errors that referenced phantom deny rules and blocked commands the subagent's own config explicitly allowed. A read-only or delegating agent's `readOnlyBash` allowlist is no longer projected onto a writable subagent as a bash ceiling, so a delegated subagent can run its own allowed commands (e.g. `git status`). Edit, notebook, and MCP denials are still inherited as hard ceilings.

- [#13088](https://github.com/Kilo-Org/kilocode/pull/13088) [`9f4ab3a`](https://github.com/Kilo-Org/kilocode/commit/9f4ab3a8be8fedf23eb3950226dd92fcc9f0cc27) - Keep the Changes chip and Git changes visible across tab switches in multi-repository workspaces.

- Changes from opencode v1.17.13 to v1.18.0 upstream:
  - Core Improvements: Added a code mode MCP adapter for running confined orchestration scripts against connected MCP tools.
  - Core Improvements: Hid the `execute` tool unless code mode is enabled.
  - Core Improvements: Add a model-specific system prompt for Meta Muse Spark.
  - Core Improvements: Updated Azure AI support for GPT-5.6.
  - Core Bugfixes: Fixed paginated MCP tool catalogs losing tool metadata and output schema validation.
  - Core Bugfixes: Preserved low reasoning effort for OpenRouter small-model variants instead of disabling it.
  - Core Bugfixes: Fixed GitHub Copilot model routing to honor each model's advertised chat or responses endpoint.
  - Core Bugfixes: Fixed session lists to match equivalent instance directories reliably.
  - Core Bugfixes: Fixed Cerebras reasoning replay so earlier assistant reasoning is sent back in the provider-supported field.
  - Core Bugfixes: Better classify Z.ai context-window overflow errors so oversized requests surface the right failure mode (@fengjikui)
  - Core Bugfixes: Handle unavailable config directories more gracefully when reading config files
  - Core Bugfixes: Exposed reasoning effort variants for Grok models.
  - Core Bugfixes: Improved xAI prompt cache routing and PDF file support in Responses models.
  - Core Bugfixes: Improved Meta model handling for reasoning variants and provider requests.
  - Core Bugfixes: Prevent crashes and bad pricing data when GitHub Copilot returns models with a zero billing batch size.
  - Core Bugfixes: Supported OpenAI pro reasoning mode.
  - Core Bugfixes: Disabled response storage by default for xAI Responses. (@geraint0923)
  - Core Bugfixes: Added OAuth support for Luna Responses Lite.
  - Core Bugfixes: Switched to another available org after logging out in the console.
  - Core Bugfixes: Used Codex context limits for GPT-5.6 over OAuth. (@nabilfreeman)
  - Core Bugfixes: Removed an obsolete Codex workaround that could interfere with OpenAI Luna Responses Lite requests.
  - TUI Bugfixes: Fixed spinner registration so loading indicators keep rendering across TUI surfaces.
  - TUI Bugfixes: Forwarded CLI environment variables to the TUI worker.

- Adopt upstream improvements from v1.18.1 through v1.18.13, including model compatibility, MCP reliability, and TUI enhancements.

- [#13104](https://github.com/Kilo-Org/kilocode/pull/13104) [`9b01d97`](https://github.com/Kilo-Org/kilocode/commit/9b01d97cf336e42a33ede75d44232c907c022938) - Preserve workspace restoration outcomes when reverting fresh VS Code sessions.

## v7.4.21 — 2026-08-11

## 7.4.21

### Minor Changes

- [#12945](https://github.com/Kilo-Org/kilocode/pull/12945) [`e0dfec0`](https://github.com/Kilo-Org/kilocode/commit/e0dfec020dd087c97a7b5644db3ab76105fab212) - Improve Agent Manager terminal focus and keyboard navigation. `Cmd+/` now focuses a visible embedded terminal before hiding it, `Cmd+Shift+T` creates a side terminal only while that terminal area has focus, and `Cmd+Shift+[` / `]` switch terminal tabs. `Cmd+Shift+M` focuses the Agent Manager prompt instead of opening VS Code Problems. `Cmd+W` hides the last side terminal instead of stopping its shell.

- [#12943](https://github.com/Kilo-Org/kilocode/pull/12943) [`28ca073`](https://github.com/Kilo-Org/kilocode/commit/28ca0733bbe007c15b98eb28ddbf5a2bbb7a3fd8) - Improve model search relevance with provider-aware results and personalized usage suggestions.

- [#12931](https://github.com/Kilo-Org/kilocode/pull/12931) [`fa99749`](https://github.com/Kilo-Org/kilocode/commit/fa9974996ac9f8d0bd37a62ecb339c0b524e4a26) - Let Agent Manager users choose the repository when creating or importing a worktree in multi-project mode.

- [#12995](https://github.com/Kilo-Org/kilocode/pull/12995) [`729f791`](https://github.com/Kilo-Org/kilocode/commit/729f79133e60748a90a596fb3ec5f9566ec48a76) Thanks [@bagatao-anaconda](https://github.com/bagatao-anaconda)! - Move the "why was this tool call approved" line to after the tool output instead of between the header and body, add an icon to it, and add a Display setting to hide it.

- [#12991](https://github.com/Kilo-Org/kilocode/pull/12991) [`0e1f11b`](https://github.com/Kilo-Org/kilocode/commit/0e1f11bed6b243f5f9379ecf05f68577e666e87a) - Add nested slash command suggestions for `/review` in VS Code and support `staged`, `unpushed`, and `quick` review modes.

- [#13014](https://github.com/Kilo-Org/kilocode/pull/13014) [`73844ae`](https://github.com/Kilo-Org/kilocode/commit/73844ae68d27d095681c2369a8093156b106a453) - Support browsing an instance's model catalog before a session starts.

- [#12859](https://github.com/Kilo-Org/kilocode/pull/12859) [`7db6b96`](https://github.com/Kilo-Org/kilocode/commit/7db6b9609d370c692c1b0e5d25cb898411236ef4) - Support model, agent, variant, and sandbox slash commands in Agent Manager worktree prompts.

### Patch Changes

- [#12940](https://github.com/Kilo-Org/kilocode/pull/12940) [`3092ce0`](https://github.com/Kilo-Org/kilocode/commit/3092ce036c493844338c5c77cb58d5a692079ce9) - Fix the Agent Manager sidebar keyboard shortcut badge so it appears on the right edge of local rows and only while hovered or holding the jump modifier, give worktree titles more room by no longer reserving space for hidden row actions, align project names and section headings with the row icons below them, and show which worktree a session belongs to in the search palette.

- [#12975](https://github.com/Kilo-Org/kilocode/pull/12975) [`56e981b`](https://github.com/Kilo-Org/kilocode/commit/56e981b589c3c772fc388e6a0d349da6d5543b17) - Align multi-project Agent Manager header actions with the worktree controls.

- [#13034](https://github.com/Kilo-Org/kilocode/pull/13034) [`4ff8f5e`](https://github.com/Kilo-Org/kilocode/commit/4ff8f5e1105652b98f49210608e9f28e98a92f8b) - Show underlying models for every Auto model in the model selector when the catalog includes them.

- [#12941](https://github.com/Kilo-Org/kilocode/pull/12941) [`bddce1a`](https://github.com/Kilo-Org/kilocode/commit/bddce1a49dd78c9673e971cdedd3665758378ac6) - Automatically expose broad reasoning effort options for custom provider models and link saved providers to advanced JSON configuration.

- [#12927](https://github.com/Kilo-Org/kilocode/pull/12927) [`58f8b02`](https://github.com/Kilo-Org/kilocode/commit/58f8b02520b816a02a3acd9fad38042c6e693f24) - Remember Agent Manager worktree dialog model, variant, mode, and sandbox selections when reopened.

- [#12924](https://github.com/Kilo-Org/kilocode/pull/12924) [`b521829`](https://github.com/Kilo-Org/kilocode/commit/b5218296422e015b69d8019a1cb7fb864b0855e3) - Reduce Agent Manager background Git polling load across large worktree sets.

- [#12865](https://github.com/Kilo-Org/kilocode/pull/12865) [`35801cb`](https://github.com/Kilo-Org/kilocode/commit/35801cbeed53f48c3198dc17bfebedca613ac705) - Prevent VS Code sessions and Agent Manager worktrees from starting unused file watchers and defer file indexing until search is used.

- [#12982](https://github.com/Kilo-Org/kilocode/pull/12982) [`454cb93`](https://github.com/Kilo-Org/kilocode/commit/454cb934a04c2b62d2cbe38715e4f8f2a2c967d0) - Update the active model, mode, and thinking selectors when executing a slash command with configured overrides.

- [#12983](https://github.com/Kilo-Org/kilocode/pull/12983) [`40121d8`](https://github.com/Kilo-Org/kilocode/commit/40121d832591d743cd360482e4f19e21a353310a) - Compress speech-to-text audio input to AAC format across macOS, Linux, and Windows to prevent payload size errors on long recordings.

- [#13046](https://github.com/Kilo-Org/kilocode/pull/13046) [`9816009`](https://github.com/Kilo-Org/kilocode/commit/981600921ae695decac7f80449d765cae67cd83d) - Improve custom provider edit dialog layout, make advanced configuration action prominent, and add bulk toggle buttons for reasoning and image modalities across all models.

- [#12979](https://github.com/Kilo-Org/kilocode/pull/12979) [`0485e36`](https://github.com/Kilo-Org/kilocode/commit/0485e361c6fcde687923daf2d42a1761bd315366) - Start Agent Manager worktree sessions faster by prefetching base branches, reducing workspace file-watcher load, and overlapping independent multi-session setup.

- [#12985](https://github.com/Kilo-Org/kilocode/pull/12985) [`5ebec95`](https://github.com/Kilo-Org/kilocode/commit/5ebec9502d106a692dd8bc7adabbd69cbeb8615a) - Fix the Agent Manager terminal toolbar button to toggle panel visibility directly.

- [#12936](https://github.com/Kilo-Org/kilocode/pull/12936) [`26e113c`](https://github.com/Kilo-Org/kilocode/commit/26e113c100eb0fd7cf17424b68954646f695ff06) - Prevent extension-managed GitHub CLI commands from opening transient Windows Terminal windows.

- [#12958](https://github.com/Kilo-Org/kilocode/pull/12958) [`fdc4665`](https://github.com/Kilo-Org/kilocode/commit/fdc46654c5860c01276d7034ba715f779b163bca) - Reduce noisy memory timeout warnings and retry transient background consolidation failures once.

- [#12993](https://github.com/Kilo-Org/kilocode/pull/12993) [`d3c50e6`](https://github.com/Kilo-Org/kilocode/commit/d3c50e62128ac53718b40d841f254f83dc91ba45) - Route Agent Manager tool-launched sessions to the project that owns the tool event directory, keep sandboxed worktree sessions inside their active worktree, and wait for busy managed sessions before prompting them.

- [#12843](https://github.com/Kilo-Org/kilocode/pull/12843) [`b894206`](https://github.com/Kilo-Org/kilocode/commit/b894206b6306c42bc1bddf8eccfca4e3689d49e7) - Fix multi-project Agent Manager keyboard navigation and Cmd/Ctrl shortcut selection when worktrees are grouped in sections.

- [#12850](https://github.com/Kilo-Org/kilocode/pull/12850) [`561d178`](https://github.com/Kilo-Org/kilocode/commit/561d1782aedd2c8b98f6e2cd6d88937b9c37fd5b) - Fix Agent Manager progress indicators when multiple projects are expanded.

- [#12871](https://github.com/Kilo-Org/kilocode/pull/12871) [`5a95577`](https://github.com/Kilo-Org/kilocode/commit/5a955778daec603e11495343a432555736b4778f) - Speed up local VS Code snapshot installs and scope Agent Manager session events and Git status to the active project, including edits inside nested repositories.

- [#12894](https://github.com/Kilo-Org/kilocode/pull/12894) [`573a660`](https://github.com/Kilo-Org/kilocode/commit/573a660cc1026469338b2fabcff52b8012a4f78a) Thanks [@bagatao-anaconda](https://github.com/bagatao-anaconda)! - Fix the sidebar navigation bar (New Task, History, Agent Manager, KiloClaw, Marketplace, Profile, Settings) disappearing in Cursor when the Kilo Code view is docked in the Secondary Side Bar. Cursor now renders the navigation inside the webview itself so it stays visible regardless of dock location. VS Code is unaffected — it continues to use its native title bar toolbar, which already worked correctly everywhere.

- [#13009](https://github.com/Kilo-Org/kilocode/pull/13009) [`c514c08`](https://github.com/Kilo-Org/kilocode/commit/c514c08749dbb72fe4db64c12c75218997b769ff) - Fix flickering and sticky scrolling when scrolling up in Agent Manager and chat sessions.

- [#13040](https://github.com/Kilo-Org/kilocode/pull/13040) [`48c4a4a`](https://github.com/Kilo-Org/kilocode/commit/48c4a4af227572011bf44c172ab0ae86e0c2a429) - Ignore negative pricing entries from model catalogs and handle unpriced models gracefully in UI price formatting.

- [#12866](https://github.com/Kilo-Org/kilocode/pull/12866) [`ee1ac30`](https://github.com/Kilo-Org/kilocode/commit/ee1ac30e464b9f40b6362d276ec1dc059e1bd5e3) - Accept terminal input immediately while the Agent Manager shell starts.

- [#12981](https://github.com/Kilo-Org/kilocode/pull/12981) [`ead46f4`](https://github.com/Kilo-Org/kilocode/commit/ead46f43415a121bacc28780bc47fe43b1b736ba) Thanks [@fxnie](https://github.com/fxnie)! - Fix Mermaid Copy PNG/SVG in VS Code webviews so they put images on the clipboard instead of failing or copying SVG markup.

- [#12989](https://github.com/Kilo-Org/kilocode/pull/12989) [`e3e2327`](https://github.com/Kilo-Org/kilocode/commit/e3e2327803f72c42d44dbd587a34f884b1f2009d) - Keep Agent Manager terminals aligned and correctly wrapped when the terminal panel is narrow.

- [#12819](https://github.com/Kilo-Org/kilocode/pull/12819) [`220cdd2`](https://github.com/Kilo-Org/kilocode/commit/220cdd20c8af4d4420ee0c4bf9bc7da8a0e82673) - Keep recent sessions and the Show History action inset and usable in narrow VS Code sidebars.

- [#12695](https://github.com/Kilo-Org/kilocode/pull/12695) [`a606a91`](https://github.com/Kilo-Org/kilocode/commit/a606a91e6929807e9979148083fb2e73af5da85c) - Changes from opencode v1.17.9 to v1.17.13 upstream:
  - Core Improvements: MCP servers can append their instructions to the model context, and MCP resources are available as tools with template listing.
  - Core Improvements: Model variants are generated from models.dev data, including modes exposed as models.
  - Core Improvements: Tool definitions pass `strict` through for Codex parity, and Gemini requests support video and audio media.
  - Core Bugfixes: Interrupted assistant steps settle instead of leaving sessions stuck busy.
  - Core Bugfixes: MCP OAuth reconnects after authorization even when the server is disabled, refreshes credentials on reauthentication, requests refresh token scope, surfaces completion errors, and binds its callback to the IPv4 loopback.
  - Core Bugfixes: MCP tool results prefer content over structured output, and denied resource template tools stay hidden.
  - Core Bugfixes: Stale GitHub Copilot Responses item IDs are no longer replayed, and OpenAI reasoning variants are forced where required.
  - Core Bugfixes: Adaptive thinking is enabled for Claude Sonnet 5, and expired promos were removed from the zen catalog.
  - Core Bugfixes: Preserve released prompt history during database replay and keep native event streams connected for all supported Kilo events.
  - Core Bugfixes: Remote skill manifests support optional per-skill versions; changing a version refreshes the cached skill atomically, and skill base directories are emitted as filesystem paths.
  - CLI Improvements: Ports increment from the default when busy.
  - CLI Improvements: Use `--auto` to start the TUI in a run-scoped auto-approve mode, and leave the mode mid-session from the command palette.
  - TUI Improvements: Redesigned crash screen, model picker sorted by release date, bindable diff viewer and Move Session commands, main-branch diff source, and inline skill load errors.
  - TUI Bugfixes: File autocomplete is scoped to the session, multi-day durations format correctly, and root sessions load in the session switcher.

- [#12844](https://github.com/Kilo-Org/kilocode/pull/12844) [`245ada5`](https://github.com/Kilo-Org/kilocode/commit/245ada532e30f0eb2ba494531f8f33dec5855861) - Allow Agent Manager project headers to collapse or expand their project body, and persist that state across panel opens and VS Code restarts.

- [#12944](https://github.com/Kilo-Org/kilocode/pull/12944) [`1e17055`](https://github.com/Kilo-Org/kilocode/commit/1e1705551990dc07254a385a2ef3f7fb3fdd6c15) - Preserve the selected reasoning effort when switching to a model that supports the same or nearest available variant.

- [#12845](https://github.com/Kilo-Org/kilocode/pull/12845) [`8fe5329`](https://github.com/Kilo-Org/kilocode/commit/8fe53293076e410e9428112e1ed1d0681b3b0792) - Show previous and next navigation hints using each project's own Agent Manager sidebar order.

- [#12860](https://github.com/Kilo-Org/kilocode/pull/12860) [`a8edd85`](https://github.com/Kilo-Org/kilocode/commit/a8edd857ae43c32e4ef76faa27d5488faaa07520) - Keep Agent Manager worktree rows isolated when projects contain identical raw worktree IDs.

- [#12883](https://github.com/Kilo-Org/kilocode/pull/12883) [`95da8ee`](https://github.com/Kilo-Org/kilocode/commit/95da8ee6fc7ff3a7d7df71d6a56068e68484cba3) - Move the prompt navigator rail to the panel edge so it is harder to open by accident, and keep it clear of the pane splitter while resizing.

- [#12888](https://github.com/Kilo-Org/kilocode/pull/12888) [`c0649f7`](https://github.com/Kilo-Org/kilocode/commit/c0649f7cb27aabf2cf992aa88eaed132adee91f9) - Reduce Agent Manager Git polling overhead by reusing the validated Git executable and bypassing the macOS developer-tool launcher when safe.

- [#12925](https://github.com/Kilo-Org/kilocode/pull/12925) [`70daa63`](https://github.com/Kilo-Org/kilocode/commit/70daa630d3f83f960f9255d9c95e5727b79ce229) - Use a compatible Kilo wordmark in embedded Agent Manager terminals.

- [#12885](https://github.com/Kilo-Org/kilocode/pull/12885) [`817c04b`](https://github.com/Kilo-Org/kilocode/commit/817c04b6640fb20fc5085f9d9f45e4a53370760a) - Prevent Agent Manager overview requests from timing out while refreshing Git statistics across many worktrees.

- [#12851](https://github.com/Kilo-Org/kilocode/pull/12851) [`44a908a`](https://github.com/Kilo-Org/kilocode/commit/44a908a8d4a94c9a41676ac895ed11fa1d2dfd9f) - Remove the redundant selected-project indicator from Agent Manager.

- [#12600](https://github.com/Kilo-Org/kilocode/pull/12600) [`4e36297`](https://github.com/Kilo-Org/kilocode/commit/4e36297668bb36ab34c0b4f0bc6a0484baef3145) - Apply saved sandbox settings to existing sessions and use the latest settings when enabling sandboxing

- [#13001](https://github.com/Kilo-Org/kilocode/pull/13001) [`d047224`](https://github.com/Kilo-Org/kilocode/commit/d047224302041a5388f9ad1a04ce3a7f2e652581) Thanks [@bagatao-anaconda](https://github.com/bagatao-anaconda)! - Show the permission approval reason for reads and writes outside the workspace, matching other tools

- [#13045](https://github.com/Kilo-Org/kilocode/pull/13045) [`00dc8d0`](https://github.com/Kilo-Org/kilocode/commit/00dc8d0242f787a48e0cf44396f6a743b75b45e0) - Keep model and provider errors visible in VS Code when chat history refreshes.

- [#12857](https://github.com/Kilo-Org/kilocode/pull/12857) [`d210a92`](https://github.com/Kilo-Org/kilocode/commit/d210a92a3fb29f2a34eb3c3e9a94e7a1741eddb5) - Show only one empty-state panel after removing the last Agent Manager worktree.

- [#13008](https://github.com/Kilo-Org/kilocode/pull/13008) [`b234d25`](https://github.com/Kilo-Org/kilocode/commit/b234d25337142417b07d83a715e7ad4c3391dca4) - Surface process exit signals and structured spawn failure details in server startup diagnostics

- [#12858](https://github.com/Kilo-Org/kilocode/pull/12858) [`e227378`](https://github.com/Kilo-Org/kilocode/commit/e2273783f68c039d74d666e34f45c13c07229b5a) - Persist the Agent Manager inspector width, share it between the terminal and diff viewer, and keep resizing responsive.

- [#12956](https://github.com/Kilo-Org/kilocode/pull/12956) [`6083de8`](https://github.com/Kilo-Org/kilocode/commit/6083de856517f9a3915967a2d3e7419deaee2d8d) - Translate the Agent Manager terminal focus shortcut label in all supported locales.

- [#12971](https://github.com/Kilo-Org/kilocode/pull/12971) [`e2db064`](https://github.com/Kilo-Org/kilocode/commit/e2db06453915fe25a42122a64348285aee2c8f60) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Long skill folder paths and URLs shown in the tooltip on the Skills settings page now wrap inside the viewport instead of overflowing on a single line.

- [#12852](https://github.com/Kilo-Org/kilocode/pull/12852) [`87b53e4`](https://github.com/Kilo-Org/kilocode/commit/87b53e4e793a59beb639ef579ea36d4e0e7189a7) - Keep multi-project worktree rename inputs focused while selection updates are still settling.

- Updated dependencies [[`9816009`](https://github.com/Kilo-Org/kilocode/commit/981600921ae695decac7f80449d765cae67cd83d), [`fdc4665`](https://github.com/Kilo-Org/kilocode/commit/fdc46654c5860c01276d7034ba715f779b163bca), [`c514c08`](https://github.com/Kilo-Org/kilocode/commit/c514c08749dbb72fe4db64c12c75218997b769ff), [`48c4a4a`](https://github.com/Kilo-Org/kilocode/commit/48c4a4af227572011bf44c172ab0ae86e0c2a429)]:
  - @kilocode/kilo-ui@7.4.21
  - @kilocode/kilo-memory@7.4.21
  - @kilocode/kilo-gateway@7.4.21
  - @opencode-ai/core@7.4.21
  - @kilocode/kilo-indexing@7.4.21
  - @opencode-ai/ui@7.4.21

## jetbrains/v7.0.15 — 2026-08-10

### Added

- Include editor context in JetBrains prompts, including the active file, open and visible files, selected text, and shell context when available.
- Show selected text and attached files as prompt attachments in user messages, with clickable links back to source files and selections.
- Add a JetBrains Context setting to enable or disable automatic editor context.

### Fixed

- Avoid JetBrains prompt editor crashes during undo/redo bulk updates.
- Keep completed question and tool views in the correct JetBrains transcript position.
- Keep JetBrains chat pinned to the bottom when a turn finishes after modified-file updates.


## jetbrains/v7.0.14 — 2026-08-07

### Fixed

- Improve slash command matching in the JetBrains plugin so typed commands resolve more reliably.
- Avoid startup crashes when the Kilo CLI database is temporarily locked by another process.


## jetbrains/v7.0.13 — 2026-08-06

### Added

- Show the pinned Kilo Core version and whether JetBrains is using a downloaded or bundled CLI build.

### Fixed

- Avoid GitHub checksum API rate limits when JetBrains verifies downloaded Kilo Core CLI assets.
- Add dropped files as JetBrains file references so attachments are available to Kilo reliably.
- Stop eager Kilo Core file watchers when running from JetBrains to reduce unnecessary background work.
- Improve JetBrains session diff rendering, including full-file editor diffs, multi-hunk diffs, fallback handling, gutter line numbers, and session-scoped diff paths.
- Speed up local recall searches in Kilo Core.
- Omit persona details from generated session names.
- Make invalid tool-argument errors clearer and more actionable to the model.
- Handle SQLite lock errors more gracefully.

### Changed

- Bump the JetBrains CLI pin to Kilo CLI v7.4.20.
- Include upstream OpenCode updates through v1.17.13.
- Adopt upstream reasoning variant metadata from OpenCode v1.18.11.


## v7.4.20 — 2026-08-04

## 7.4.20

### Patch Changes

- [#12841](https://github.com/Kilo-Org/kilocode/pull/12841) [`744c5c4`](https://github.com/Kilo-Org/kilocode/commit/744c5c4a6b244d2aac38b7acc08f98a4086544ad) - Discover available speech-to-text models from the Kilo Gateway while retaining offline fallback support and organization model restrictions.

- [#12842](https://github.com/Kilo-Org/kilocode/pull/12842) [`2613ff9`](https://github.com/Kilo-Org/kilocode/commit/2613ff93c6446eb3a662ed6d4a4b063131a6a371) - Show the first Agent Manager terminal prompt sooner by deferring optional terminal enhancements until after initial paint.

- [#12839](https://github.com/Kilo-Org/kilocode/pull/12839) [`4af1d1c`](https://github.com/Kilo-Org/kilocode/commit/4af1d1c8abd15881f5c06554cca8e2f6133003ee) - Keep the final file visible when expanding multi-file patch results.

## v7.4.19 — 2026-08-04

## 7.4.19

### Minor Changes

- [#12729](https://github.com/Kilo-Org/kilocode/pull/12729) [`ce7984f`](https://github.com/Kilo-Org/kilocode/commit/ce7984fc4247fb2805990ef62e1b1d9f286de9d9) - Configure a model and reasoning variant for each workflow from Agent Behaviour settings.

### Patch Changes

- [#12796](https://github.com/Kilo-Org/kilocode/pull/12796) [`20d1648`](https://github.com/Kilo-Org/kilocode/commit/20d1648e7a10f981fde09fc4d5e9de5c89b1dda8) - Fix Agent Manager mode shortcuts in the New Worktree dialog so the selected mode and its matching model stay in sync.

- [#12725](https://github.com/Kilo-Org/kilocode/pull/12725) [`f239f36`](https://github.com/Kilo-Org/kilocode/commit/f239f36f65a1edb5ef89748933b49b3f21639a45) - Show aggregate added and removed line counts for multi-file patch tool calls.

- [#12803](https://github.com/Kilo-Org/kilocode/pull/12803) [`9819c1c`](https://github.com/Kilo-Org/kilocode/commit/9819c1c315bd05631862ad6f21bbef21d73b7bdc) - Restore Agent Manager sections and worktree drag-and-drop when multiple projects are shown, with ordering and section moves scoped to the owning project.

- [#12836](https://github.com/Kilo-Org/kilocode/pull/12836) [`4f7dfe6`](https://github.com/Kilo-Org/kilocode/commit/4f7dfe65cc85ef7d103a9d0d93f86b030f7142e0) - Remove the duplicate border along the Kilo Code sidebar edge.

- [#12814](https://github.com/Kilo-Org/kilocode/pull/12814) [`cd7d053`](https://github.com/Kilo-Org/kilocode/commit/cd7d053f03fa7b5434b6fcae9e2c68e415b54331) - Start voice input faster on macOS with native AVFoundation capture.

- [#12795](https://github.com/Kilo-Org/kilocode/pull/12795) [`37559f8`](https://github.com/Kilo-Org/kilocode/commit/37559f8643ef8ecb68ee04eae770c9b47feee88a) - Restore keyboard focus to the prompt or pending question when switching Agent Manager worktrees and sessions.

- [#12799](https://github.com/Kilo-Org/kilocode/pull/12799) [`7cfaeb2`](https://github.com/Kilo-Org/kilocode/commit/7cfaeb2c8dbe7355b1d92d9a8f62d6bdfb7f6d46) - Show and hide Agent Manager worktree hover cards instantly.

- [#12805](https://github.com/Kilo-Org/kilocode/pull/12805) [`8490124`](https://github.com/Kilo-Org/kilocode/commit/84901241c0c6dcb735d7e229bd9bce2c0f7e5c36) - Keep the prompt controls at a consistent height when the model selector shows the prompt-training indicator.

- [#12810](https://github.com/Kilo-Org/kilocode/pull/12810) [`e04f653`](https://github.com/Kilo-Org/kilocode/commit/e04f6531bf3ef2eed5cde6e1d81a4983f276b9ca) - Update model search results instantly and keep the active match visible while typing.

- [#12815](https://github.com/Kilo-Org/kilocode/pull/12815) [`3d4294e`](https://github.com/Kilo-Org/kilocode/commit/3d4294e3bb50630159233c8063b253dc5f3da8d3) - Allow Agent Manager sessions to move their worktree between sections or ungroup it through the `agent_manager` tool.

- [#12798](https://github.com/Kilo-Org/kilocode/pull/12798) [`dfc1607`](https://github.com/Kilo-Org/kilocode/commit/dfc16076934decb6578730ea41f9705e2acc0923) - Bind voice input to Cmd/Ctrl+K in Kilo prompt and review comment fields, with hold-to-talk and release-to-send support.

- [#12801](https://github.com/Kilo-Org/kilocode/pull/12801) [`4810766`](https://github.com/Kilo-Org/kilocode/commit/4810766d058f53084b8a6cb0fe4d1ff42973e89b) - Preserve prompt or Agent Manager terminal focus independently for each session when switching sessions.

- [#12812](https://github.com/Kilo-Org/kilocode/pull/12812) [`6ae16f9`](https://github.com/Kilo-Org/kilocode/commit/6ae16f9d6272b3bfba998bb516cba7667935d6e4) - Start a fresh shell in the same Agent Manager terminal tab when the user types after the terminal ends.

- [#12733](https://github.com/Kilo-Org/kilocode/pull/12733) [`63220e0`](https://github.com/Kilo-Org/kilocode/commit/63220e019c048d6df639a4b2fbd4c5c3f124547f) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Fix skill folder path and URL rows clipping and pushing the remove (×) button off-screen in narrow Skills settings panels. Long paths and URLs now truncate within their row, and hovering a truncated value shows the full path or URL in a tooltip.

## jetbrains/v7.0.12 — 2026-08-01

### Added

- Support sending another JetBrains prompt while a session is still running. Queued prompts now appear in the conversation and can be removed before Kilo starts processing them.
- Show verbatim skill commands and the skill name in JetBrains permission prompts so approvals are easier to review.
- Add improved session changes and diff review, including branch changes in the session header, richer diff navigation, and full-context file diffs.
- Support executing commands from skill context with batch approval.

### Fixed

- Keep JetBrains permission prompts deterministic, including queued permissions, compacted summaries, escaped skill names, and auto-approve transitions.
- Improve JetBrains diff review reliability by restoring toolbar actions, aligning file headers, bounding branch-diff patch loading, and preserving promoted permissions.
- Improve large branch diff performance by capping huge inline diff previews, compacting diff tree paths, and allowing horizontal scrolling for long file names.
- Reflow existing long chat sessions after they load so transcripts lay out at the correct width without needing to resize the tool window.
- Keep the prompt send/stop button synchronized when attachments are added, removed, or cleared while a session is busy.
- Reduce transcript restyling work during streaming so large sessions remain responsive.
- Prevent CLI agent loops from freezing when a provider stalls after response headers.
- Enforce permissions for shell commands that cannot be scanned by the parser, and fail closed for untrusted or malformed skill command batches.
- Keep session reverts atomic and make snapshot diffs more resilient on Windows.
- Surface provider stream error details more clearly and keep retry handling consistent for rate limits and response stream failures.
- Handle missing nested config unsets and remove unset config keys from layered config files.
- Reduce CLI startup time by deferring Kilo module loading and telemetry work.

### Changed

- Bump the JetBrains CLI pin to Kilo CLI v7.4.17.
- Include upstream OpenCode updates through v1.17.9.


## v7.4.18 — 2026-07-31

## 7.4.18

### Minor Changes

- [#12681](https://github.com/Kilo-Org/kilocode/pull/12681) [`3ab1122`](https://github.com/Kilo-Org/kilocode/commit/3ab1122e0fbbff5c6821acb21df7d3d93f52955f) - Add a scope selector and base branch picker to the Agent Manager diff review. The side panel and full-screen review now let you switch between Branch, Staged, Unstaged, and Session scopes for the selected worktree, and the Branch scope's base branch can be overridden from a picker next to it. Branch stays the default, so existing review behavior is unchanged.

- [#12566](https://github.com/Kilo-Org/kilocode/pull/12566) [`46b7e55`](https://github.com/Kilo-Org/kilocode/commit/46b7e55f8d8f1e4b0722076b09d4a56bf8031939) - Add an experimental multi-project foundation for Agent Manager behind the Multi-Project Agent Manager toggle in Kilo Settings > Experimental. A persistent project registry catalogs additional Git repositories across restarts while the current workspace repository stays the pinned default project, and all repository-bound services (state, worktrees, setup scripts, stale tracking, polling) are now owned by immutable per-project contexts that can be activated, expanded, and switched through new project protocol messages. Every expanded project runs its own git stats and PR pollers, so all visible project accordions show live data at the same time; switching projects keeps previously visited projects expanded and restores the exact worktree or session that was open there. Sessions created anywhere (sidebar, another window, the CLI) appear in the owning project's list immediately, and open tabs stay private to the project they were opened in. Single-project behavior is unchanged when the experiment is disabled.

- [#12709](https://github.com/Kilo-Org/kilocode/pull/12709) [`5c140b1`](https://github.com/Kilo-Org/kilocode/commit/5c140b12cf54d883e3a31329e07dbdd2d4b38829) - Make the Agent Manager diff review follow the sidebar selection instead of a single session. Switching session tabs inside a worktree no longer refetches the Branch, Staged, and Unstaged scopes, the Session scope now swaps to the active session's changes on tab switch, and the Local tab gains the Session scope so sessions running in the workspace can be reviewed on their own. The Session scope shows a notice when snapshots are disabled instead of a blank list, worktrees without an open session now still show their branch diff, and the Apply dialog lists the worktree's changes again.

- [#12680](https://github.com/Kilo-Org/kilocode/pull/12680) [`49223b3`](https://github.com/Kilo-Org/kilocode/commit/49223b3adecb891b185d7a21bac8d4993d3bee65) - Run Agent Manager project scripts in the terminal selected by the existing toolbar dropdown. Agent Manager panel uses the named side terminal, while VS Code terminal retains the integrated task flow.

- [#12424](https://github.com/Kilo-Org/kilocode/pull/12424) [`d6380b2`](https://github.com/Kilo-Org/kilocode/commit/d6380b246b0d0ad99e5cf2084d97e381f1bc94e3) Thanks [@bsflasher](https://github.com/bsflasher)! - Add Persian (Farsi) as a UI language, including right-to-left layout. Contributed by Babak Safabahar.

- [#12606](https://github.com/Kilo-Org/kilocode/pull/12606) [`286b672`](https://github.com/Kilo-Org/kilocode/commit/286b67265f6be79b14bb3ca4051880339c695c3f) Thanks [@bagatao-anaconda](https://github.com/bagatao-anaconda)! - Show skill shell commands in the permission prompt. When a skill runs embedded shell commands, the approval dialog now lists every command with Allow / Reject.

- [#12703](https://github.com/Kilo-Org/kilocode/pull/12703) [`5076b62`](https://github.com/Kilo-Org/kilocode/commit/5076b629741e4cae71277405470f7c382f800bb3) - Run Agent Manager worktree setup scripts in the terminal selected by the toolbar dropdown. Agent Manager panel shows live setup output in a named `Setup` side tab that reveals itself while provisioning and hides again on success unless you engaged with the panel, while VS Code terminal retains the integrated task flow.

### Patch Changes

- [#12696](https://github.com/Kilo-Org/kilocode/pull/12696) [`a2b22d0`](https://github.com/Kilo-Org/kilocode/commit/a2b22d07c2b773dcbcc71b8e6999a9bd1c118b91) - Apply the Agent Manager base branch picker selection to the active diff immediately. Changing the base branch now refreshes the diff against the new base instead of keeping the previous comparison until the scope or session changed.

- [#12720](https://github.com/Kilo-Org/kilocode/pull/12720) [`57a9a60`](https://github.com/Kilo-Org/kilocode/commit/57a9a6012c7eac98a7a0704443f671101935a795) - Fix Agent Manager embedded terminals not opening in the side panel or as a tab.

- [#12691](https://github.com/Kilo-Org/kilocode/pull/12691) [`301c14e`](https://github.com/Kilo-Org/kilocode/commit/301c14e558caf1deb4510be847f6ba3fba804a5d) - Make Cmd/Ctrl+/ toggle the Agent Manager terminal even when the webview keybinding forwarding drops the key while the prompt input is focused, and stop it from triggering the Agent Manager terminal while the Kilo sidebar is focused.

- [#12694](https://github.com/Kilo-Org/kilocode/pull/12694) [`af6bb00`](https://github.com/Kilo-Org/kilocode/commit/af6bb00eed3fec25429bb459db95709667761909) - Match the Agent Manager terminal shortcut fallback to the platform modifier (Cmd on macOS, Ctrl elsewhere) and consume the extension echo once per keypress so unrelated invocations are no longer swallowed.

- [#12722](https://github.com/Kilo-Org/kilocode/pull/12722) [`5678c09`](https://github.com/Kilo-Org/kilocode/commit/5678c09cf54ed73e4d712a87bca730ee0d64001d) - Fix the Agent Manager detail pane blanking when an unassigned session is selected. Clicking a session that belongs to no worktree now renders the chat and read-only banner again instead of an empty content area, and live terminal tabs stay mounted across the switch.

- [#12658](https://github.com/Kilo-Org/kilocode/pull/12658) [`dbcd582`](https://github.com/Kilo-Org/kilocode/commit/dbcd5825da6a3253015f6c38e55a7faf5d1715b8) - Keep the Agent Manager terminal cursor visible on the bottom row.

- [#12369](https://github.com/Kilo-Org/kilocode/pull/12369) [`44f1373`](https://github.com/Kilo-Org/kilocode/commit/44f13738a30668483a2cc5c22c6ba82a718cdb90) - Allow users to enable web search for models from all providers through Kilo configuration, VS Code settings, and Kilo Console settings.

- [#12624](https://github.com/Kilo-Org/kilocode/pull/12624) [`af4cb42`](https://github.com/Kilo-Org/kilocode/commit/af4cb422038538643fe0303674ceeb43b6d7185b) Thanks [@Hardik180704](https://github.com/Hardik180704)! - Persist MCP server enable and disable changes from VS Code settings across window reloads.

- [#12656](https://github.com/Kilo-Org/kilocode/pull/12656) [`f0d2c8f`](https://github.com/Kilo-Org/kilocode/commit/f0d2c8ffc801ae964bb3821500ed4b116de5bccd) - Navigate long conversations from a compact prompt rail that loads earlier history as you scroll.

- [#12692](https://github.com/Kilo-Org/kilocode/pull/12692) [`faf0236`](https://github.com/Kilo-Org/kilocode/commit/faf0236ca4208ac798407fe70f86845a1de0b510) - Fix the `@` "Past chats" picker in Agent Manager showing only the current session's directory. It now lists previous sessions across the whole worktree family — the local workspace and every Agent Manager worktree — each labeled with its worktree name, matching the Agent Manager session search. Any listed session can be attached as context, including chats from other worktrees of the same repository.

- [#12689](https://github.com/Kilo-Org/kilocode/pull/12689) [`1cd81a9`](https://github.com/Kilo-Org/kilocode/commit/1cd81a9e1f973574271cc3cee1051ed37e22422f) - Open an embedded terminal automatically when switching to a worktree without one.

- [#12693](https://github.com/Kilo-Org/kilocode/pull/12693) [`1e2a7f1`](https://github.com/Kilo-Org/kilocode/commit/1e2a7f17d7242ce48eb46e7268ebcdefed8b8336) - Make Agent Manager panel terminals behave like session tabs: right-click Close and Close Others, arrow-key tab navigation, overflow scrolling with edge fades, and stable tab widths while closing. The new-terminal button now sits directly next to the last terminal tab instead of the far edge of the panel.

- [#12738](https://github.com/Kilo-Org/kilocode/pull/12738) [`84b8b96`](https://github.com/Kilo-Org/kilocode/commit/84b8b9676a3912793f8bf38208b38760f6e79b17) - Show a write-aware cache hit rate in the VS Code session usage bar.

- Updated dependencies [[`0d923d0`](https://github.com/Kilo-Org/kilocode/commit/0d923d0ef56d42cd7eb6d1e2d5fc58c7b508a80b)]:
  - @kilocode/kilo-memory@7.4.18

## v7.4.17 — 2026-07-29

## 7.4.17

### Minor Changes

- [#12631](https://github.com/Kilo-Org/kilocode/pull/12631) [`3321216`](https://github.com/Kilo-Org/kilocode/commit/3321216c0157e1a8a1829b0c8e0a1cae8d2f2ad2) - Show the ⌘1-9 (Ctrl+1-9 on Windows/Linux) shortcut badges on every Agent Manager sidebar card while the modifier key is held, making it easy to see which number jumps to which worktree before pressing it.

- [#12598](https://github.com/Kilo-Org/kilocode/pull/12598) [`c6711fc`](https://github.com/Kilo-Org/kilocode/commit/c6711fcf6cea9fdbe78a04b95276d09a2faabfa7) - Let users open Agent Manager terminals in the VS Code terminal or an embedded side panel. The terminal button's dropdown picks the destination; the side panel shares the right-hand inspector with the diff view and keeps running in the background when hidden.

- [#12633](https://github.com/Kilo-Org/kilocode/pull/12633) [`23039c0`](https://github.com/Kilo-Org/kilocode/commit/23039c0fb1e5b32704119ddde10a6a28ccd6bff3) - Support multiple Agent Manager side-panel terminals per context. The panel header is now a tab strip that reuses the main tab bar's terminal tabs: click to switch, drag to reorder, X to close a single terminal, and + to open another one. Terminal numbers fill gaps left by closed terminals, and tabs pick up the live title from the shell or running program (OSC escape codes), so a dev server or build names its own tab.

- [#12632](https://github.com/Kilo-Org/kilocode/pull/12632) [`0d853df`](https://github.com/Kilo-Org/kilocode/commit/0d853df3ec338ac99e025939f74136dec6d9daa1) - Add a prompt navigator rail to the chat transcript. A thin rail of ticks on the left edge shows one tick per prompt you sent; hovering or focusing it expands a card listing those prompts with a short preview of the answer, and clicking jumps the transcript to that turn. It appears in the sidebar, Kilo editor tabs, the sub-agent viewer, and Agent Manager, and never changes the readable width of the chat.

### Patch Changes

- [#12629](https://github.com/Kilo-Org/kilocode/pull/12629) [`0a1c140`](https://github.com/Kilo-Org/kilocode/commit/0a1c14073a4bf14f8ad4e3c8295dc6ae6bfbfdaf) - Keep each Agent Manager panel's terminal destination consistent. A dropdown pick is now remembered per panel and no longer flips when another window rewrites the shared terminal destination setting, so the terminal shortcut keeps opening the terminal type that panel is actually using. The shortcut also no longer dead-ends on worktrees without an active session, and terminals left over from a reloaded webview are cleaned up instead of leaking.

- [#12587](https://github.com/Kilo-Org/kilocode/pull/12587) [`16f8e7e`](https://github.com/Kilo-Org/kilocode/commit/16f8e7ef7fbd47755395539e7df54af3baae0c63) - Keep conversations and workspace files unchanged when a checkpoint cannot be fully restored.

- [#12333](https://github.com/Kilo-Org/kilocode/pull/12333) [`290a5af`](https://github.com/Kilo-Org/kilocode/commit/290a5af56e6ddccd8b4a459883625e30f2ae0344) Thanks [@IamCoder18](https://github.com/IamCoder18)! - Include basic-auth credentials in the Local and Network Console URLs printed by `kilo console`, so users on headless hosts (no `DISPLAY`/`WAYLAND_DISPLAY`, SSH sessions, CI runners) can open the URL in a browser on another machine and reach the Console.

- [#12630](https://github.com/Kilo-Org/kilocode/pull/12630) [`a7f972f`](https://github.com/Kilo-Org/kilocode/commit/a7f972f63bc948d70b73a36a5beab6d694316037) - Open Agent Manager terminals faster and avoid delayed shell prompts.

- [#12560](https://github.com/Kilo-Org/kilocode/pull/12560) [`65c5e9d`](https://github.com/Kilo-Org/kilocode/commit/65c5e9d2c03cea152b140710228075edf9156def) - Update the visible agent mode when cycling modes in Kilo sidebars and pending session tabs.

- [#12561](https://github.com/Kilo-Org/kilocode/pull/12561) [`44f5963`](https://github.com/Kilo-Org/kilocode/commit/44f596366931d5336f1cd4dfdd97ef54e0f2fa4c) - Fix settings changes sometimes failing to save and apply in VS Code.

- [#12540](https://github.com/Kilo-Org/kilocode/pull/12540) [`2da8949`](https://github.com/Kilo-Org/kilocode/commit/2da89498138e49f857c354924fdecac85337e742) Thanks [@Githubguy132010](https://github.com/Githubguy132010)! - Preserve parenthesized tilde expressions as literal text in rendered chat messages.

- [#12591](https://github.com/Kilo-Org/kilocode/pull/12591) [`625d2b9`](https://github.com/Kilo-Org/kilocode/commit/625d2b974de1381b4d475808c9215becb263d1f0) - Show prompt input toggle tooltips instantly on hover instead of after a delay.

- [#12460](https://github.com/Kilo-Org/kilocode/pull/12460) [`51d8031`](https://github.com/Kilo-Org/kilocode/commit/51d8031c9997bd5478bcde715562169f732d04d4) - Changes from opencode v1.17.5 to v1.17.9 upstream:
  - Core Bugfixes: Improved MCP server compatibility by declaring Kilo's supported client capabilities.
  - Core Bugfixes: Plugin client requests now reuse the active server instead of assuming the default local port.
  - Core Bugfixes: ACP shell tool calls now show the command and working directory from the start.
  - Core Bugfixes: Plugin-provided shell environment variables now apply to PTY sessions.
  - Core Bugfixes: OpenAI-compatible providers now accept MCP tool schemas that previously failed validation. (@jquense)
  - Core Bugfixes: Cloudflare AI Gateway now receives the configured API key correctly. (@keefetang)
  - Core Bugfixes: MCP tools without declared schema properties now work with providers that expect object properties.
  - Core Bugfixes: Long-running MCP tools now keep their timeout alive when they report progress. (@Nomadcxx)
  - Core Bugfixes: The MCP OAuth callback server now shuts down once authorization finishes or is cancelled.
  - Core Bugfixes: MCP tool failures now surface the server's error text instead of a generic failure.
  - Core Bugfixes: MCP OAuth error pages now escape provider error text correctly.
  - Core Bugfixes: Honor configured agent step limits by forcing a final text response instead of failing mid-run.
  - Core Bugfixes: Queue steering prompts before dismissing pending questions so the previous turn cannot resume first.
  - Core Bugfixes: Prevent local server credentials from leaking into spawned PTY processes.
  - Core Bugfixes: Fix Devstral model detection when provider IDs use different casing. (@Robin1987China)
  - Core Bugfixes: Pass configured custom headers to Copilot model requests.
  - Core Improvements: MCP servers can now receive the current workspace as a client root.
  - Core Improvements: Session timelines load much faster and avoid flicker or scroll jumps.
  - Core Improvements: Add `high` and `max` thinking variants for GLM-5.2 across supported providers. (@imranshaiedi-byte)
  - Core Improvements: Stop wrapping follow-up user messages in a steering reminder so prompt caching stays effective.
  - TUI Bugfixes: MCP debug now uses the SDK's latest protocol version.
  - TUI Bugfixes: Only show the background subagent shortcut when the server supports it.
  - UI Bugfixes: Render completed Mermaid blocks from diagram source instead of fenced Markdown.

- [#11984](https://github.com/Kilo-Org/kilocode/pull/11984) [`26dac19`](https://github.com/Kilo-Org/kilocode/commit/26dac197fe28294c391c8d437abf06e18e2d22bd) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Mention `@` file references in the chat input placeholder so users know they can add file mentions. Translated across all supported languages.

- [#12593](https://github.com/Kilo-Org/kilocode/pull/12593) [`160b066`](https://github.com/Kilo-Org/kilocode/commit/160b06661acc5f04b21221ab6578c468325f64c5) - Prevent the VS Code backend from eagerly starting native file watchers for every Agent Manager worktree.

- [#12123](https://github.com/Kilo-Org/kilocode/pull/12123) [`3075d35`](https://github.com/Kilo-Org/kilocode/commit/3075d35f13ba9738446ac28fa2eebf054097f2f5) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Keep message and response copy buttons working after switching focus away from VS Code.

- [#12583](https://github.com/Kilo-Org/kilocode/pull/12583) [`1310c12`](https://github.com/Kilo-Org/kilocode/commit/1310c1200ab613b316f27fe4fd59e23e262df02f) Thanks [@noobezlol](https://github.com/noobezlol)! - Keep Windows snapshot diffs parseable and preserve valid files when a stored patch is malformed.

- [#12410](https://github.com/Kilo-Org/kilocode/pull/12410) [`85d65a3`](https://github.com/Kilo-Org/kilocode/commit/85d65a3137ecadfcbda8255bfb4a40daf1f155fb) - Open Kilo chats, settings, and files as tabs in the selected editor pane without creating, locking, or resizing editor panes.

- [#12639](https://github.com/Kilo-Org/kilocode/pull/12639) [`8a47d8b`](https://github.com/Kilo-Org/kilocode/commit/8a47d8b78885fa8fd14c73b3aecdb57e1fc96c9c) - Stop flashing a "Turn interrupted" warning when a follow-up message is queued while the assistant is still working. The running turn now closes with a dedicated "superseded" reason instead of "interrupted" when it hands off to the queued prompt, so the premature-stop warning only appears for real interruptions.

- [#12602](https://github.com/Kilo-Org/kilocode/pull/12602) [`5d87ca5`](https://github.com/Kilo-Org/kilocode/commit/5d87ca598c4c66328f0e476cb1be3fc9b26d05aa) - Remove unused translation keys from the Agent Manager, sidebar webview, shared kilo-i18n, and autocomplete dictionaries across all locales, and add a conservative lint test for unreferenced, unprotected dictionary keys.

- [#12463](https://github.com/Kilo-Org/kilocode/pull/12463) [`1f3383c`](https://github.com/Kilo-Org/kilocode/commit/1f3383cf3de37327b02e0fc2a1c5ac176ca9134f) Thanks [@IamCoder18](https://github.com/IamCoder18)! - Show the `Ctrl+T` variant cycling shortcut in the TUI prompt hint row whenever the active model exposes reasoning variants, as the first hint before the agent and command palette hints

- [#12634](https://github.com/Kilo-Org/kilocode/pull/12634) [`4c5c242`](https://github.com/Kilo-Org/kilocode/commit/4c5c2428927f26c4c818f23a650cfaf5723b7641) - Show the worktree directory name on the Agent Manager worktree hover card

## jetbrains/v7.0.11 — 2026-07-27

### Added

- Add a signed GitHub-hosted bundled JetBrains plugin build that includes the Kilo CLI for offline or restricted-network installs.

### Fixed

- Load global skills reliably from JetBrains projects that are not inside a Git repository.
- Support adaptive thinking for Claude Opus and Sonnet 5+ model identifiers across Anthropic, AI Gateway, and Bedrock providers.
- Flush pending cloud session updates when the Kilo Core runtime shuts down, reducing cases where the final assistant message is missing when a session is reopened elsewhere.
- Prune stale bundled CLI versions after upgrading bundled JetBrains installs.

### Changed

- Update the JetBrains CLI pin from Kilo Core 7.4.15 to 7.4.16.


## v7.4.16 — 2026-07-24

## 7.4.16

### Minor Changes

- [#12370](https://github.com/Kilo-Org/kilocode/pull/12370) [`b367105`](https://github.com/Kilo-Org/kilocode/commit/b367105c8d648c8e05b62c2d27a28a95a4772f61) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Support deleting queued chat messages from the VS Code chat before they run.

- [#12297](https://github.com/Kilo-Org/kilocode/pull/12297) [`bcff5cb`](https://github.com/Kilo-Org/kilocode/commit/bcff5cb3608f9fc6a6a441405cf50694f6bf3efa) - Emit session queue state so remote clients can show queued messages.

- [#12456](https://github.com/Kilo-Org/kilocode/pull/12456) [`3d648d7`](https://github.com/Kilo-Org/kilocode/commit/3d648d7fcdc186f86b2c63ab842e70acb1f0aee2) - Reference past chats inline with `@` in the prompt. Typing `@` now surfaces a "Past chats" option that opens a searchable picker of previous sessions (scoped to the current workspace/worktree, searched like the Agent Manager session search); selecting one attaches that session's transcript as context so the model can build on a prior conversation. Clicking the mention opens that session. Available in the CLI TUI and the VS Code extension.

- [#12462](https://github.com/Kilo-Org/kilocode/pull/12462) [`8eeaa54`](https://github.com/Kilo-Org/kilocode/commit/8eeaa546aeec9c06d513248b42546ec779ab2178) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Add a searchable open-tabs switcher to the sidebar tab bar.

- [#12494](https://github.com/Kilo-Org/kilocode/pull/12494) [`85dbf44`](https://github.com/Kilo-Org/kilocode/commit/85dbf443af727524a90c1838eeecd37d5011bcaa) Thanks [@bagatao-anaconda](https://github.com/bagatao-anaconda)! - Show why a tool call was auto-approved. Expanding a tool call now explains whether it ran automatically or after your approval, and which rule allowed it — from your agent, the project config, your global config, or auto-approve (YOLO) mode.

- [#12509](https://github.com/Kilo-Org/kilocode/pull/12509) [`99c04c7`](https://github.com/Kilo-Org/kilocode/commit/99c04c7163efb8cafa6e35f052b743c6dcf96f12) - Filter `/sessions` history to sessions in the current Agent Manager worktree.

### Patch Changes

- [#12486](https://github.com/Kilo-Org/kilocode/pull/12486) [`d0e8a86`](https://github.com/Kilo-Org/kilocode/commit/d0e8a86bfce001821441e8ac8d7398bfba6c93f6) Thanks [@hdcodedev](https://github.com/hdcodedev)! - Prevent Enter from activating the first result in searchable lists when no row is highlighted.

- [#12511](https://github.com/Kilo-Org/kilocode/pull/12511) [`9e1b54d`](https://github.com/Kilo-Org/kilocode/commit/9e1b54d8754e670dd149a8536ed25b16e223fe2e) - Open plan implementation sessions immediately and submit recovered plan choices without requiring a second click.

- [#12496](https://github.com/Kilo-Org/kilocode/pull/12496) [`2fcb137`](https://github.com/Kilo-Org/kilocode/commit/2fcb137ebcbf9101ca655804d0a61af2f222bbc5) - Preserve unexpected provider finish reasons and show the request and Gateway generation IDs when a response ends unexpectedly.

- [#12488](https://github.com/Kilo-Org/kilocode/pull/12488) [`c25f041`](https://github.com/Kilo-Org/kilocode/commit/c25f041eb3922defc4dadb9ad7b2f8c8edb74fbd) - Show the request ID when a model response ends without a finish reason.

- Updated dependencies [[`b367105`](https://github.com/Kilo-Org/kilocode/commit/b367105c8d648c8e05b62c2d27a28a95a4772f61), [`c1f057a`](https://github.com/Kilo-Org/kilocode/commit/c1f057ad5a2021cd57e003cad7d45e5e6b0b4cba), [`2fcb137`](https://github.com/Kilo-Org/kilocode/commit/2fcb137ebcbf9101ca655804d0a61af2f222bbc5), [`f715e2f`](https://github.com/Kilo-Org/kilocode/commit/f715e2f5fa4db5abe5c734e1c360e8da3367f3e5), [`dcc0d64`](https://github.com/Kilo-Org/kilocode/commit/dcc0d64a3249bdd3aa27d564759253126ff9a5fe)]:
  - @kilocode/kilo-ui@7.5.0
  - @kilocode/sdk@7.5.0
  - @kilocode/kilo-gateway@7.4.16
  - @kilocode/plugin@7.4.16
  - @opencode-ai/ui@7.4.16
  - @opencode-ai/core@7.4.16
  - @kilocode/kilo-indexing@7.4.16

## jetbrains/v7.0.10 — 2026-07-24

### Added

- Render edit, write, and apply-patch tool results as expandable diff previews with clickable file links, change counts, syntax-highlighted diffs, and clearer multi-file patch sections.

### Fixed

- Improve session performance for large transcripts.
- Fix Kilo Core failures caused by strict OpenAI-compatible compaction requests, unexpected provider finish reasons, read-only database files at startup, AWS profile credentials, and config files being rewritten just by reading them.

### Changed

- Update the JetBrains CLI pin from Kilo Core 7.4.13 to 7.4.15.


## v7.4.15 — 2026-07-22

## 7.4.15

### Patch Changes

- [#12422](https://github.com/Kilo-Org/kilocode/pull/12422) [`28d015f`](https://github.com/Kilo-Org/kilocode/commit/28d015f8fefd166348e4d4eb0b4c2ae0aa011a03) - Simplify project memory settings and activity visibility, replace direct editing with folder inspection, add nested memory slash-command completion and status views, improve empty-project handling, compact native tool-call summaries, and remove legacy memory audit logs.

- [#12454](https://github.com/Kilo-Org/kilocode/pull/12454) [`2f389f9`](https://github.com/Kilo-Org/kilocode/commit/2f389f9fb13f88da9b74364f6c4c1ad7fd0bb09b) - Show a clear warning when reloading is blocked by a running session instead of a generic "Reload failed" error, and surface the server error message for other reload failures

- [#11928](https://github.com/Kilo-Org/kilocode/pull/11928) [`c08302b`](https://github.com/Kilo-Org/kilocode/commit/c08302b47a4fc68e4efda8f722e87e3018601bd8) Thanks [@jhapate0704](https://github.com/jhapate0704)! - Fix scroll position not resetting when switching between diff files in the chat and virtual diff viewer

- [#12414](https://github.com/Kilo-Org/kilocode/pull/12414) [`badf70d`](https://github.com/Kilo-Org/kilocode/commit/badf70dcedc9559769969c34aff9a63fcc9bdb5f) - Keep Linux sandbox setup working when a writable directory contains an unreadable subdirectory (for example a folder with mode 600); unreadable subdirectories are now protected with a read-only mount instead of failing every sandboxed tool call with an access error.

- Updated dependencies [[`28d015f`](https://github.com/Kilo-Org/kilocode/commit/28d015f8fefd166348e4d4eb0b4c2ae0aa011a03)]:
  - @kilocode/kilo-memory@7.4.14
  - @kilocode/kilo-ui@7.4.14

## 7.4.13

### Minor Changes

- [#12271](https://github.com/Kilo-Org/kilocode/pull/12271) [`38013f7`](https://github.com/Kilo-Org/kilocode/commit/38013f70fad82f55b9ebe02d8d6883a26d791934) - Allow agents to stop and remove a targeted Agent Manager session.

- [#12401](https://github.com/Kilo-Org/kilocode/pull/12401) [`210a6bb`](https://github.com/Kilo-Org/kilocode/commit/210a6bbf9b89b30b408d744cf0f253482370eed6) - Support choosing a reasoning effort per model in the Agent Manager Compare Models picker, so compared worktrees can run the same prompt at different effort levels. The selected effort is shown next to the model name in the collapsed selector.

- [#12306](https://github.com/Kilo-Org/kilocode/pull/12306) [`c081f58`](https://github.com/Kilo-Org/kilocode/commit/c081f582abecaba98a303069140d014a9ee90ca9) - Configure a custom file extension allowlist for codebase indexing to limit scans to relevant project files and support additional text formats.

- [#12292](https://github.com/Kilo-Org/kilocode/pull/12292) [`6dcaeb3`](https://github.com/Kilo-Org/kilocode/commit/6dcaeb3e97f256e9e98d5093610a0a02aedf84de) - Add JetBrains Context settings for compaction and file watcher ignore patterns.

- [#12403](https://github.com/Kilo-Org/kilocode/pull/12403) [`5819c68`](https://github.com/Kilo-Org/kilocode/commit/5819c689961ccf61f510896c5477a96e9d2a3459) - Cycle reasoning effort variants with Shift+Tab in prompt inputs. Works in the sidebar chat, Agent Manager, and the New Worktree dialog. The variant selector tooltip shows the shortcut on hover, and the behavior can be turned off with the `kilo-code.new.chat.shiftTabCyclesVariant` setting (also available under Settings > Display) to restore Shift+Tab focus navigation.

### Patch Changes

- [#12301](https://github.com/Kilo-Org/kilocode/pull/12301) [`d854c10`](https://github.com/Kilo-Org/kilocode/commit/d854c1077da0b55afe454c86b43c3240cdac053c) - Respect the Terminal Command Blocks display setting for background process tool cards.

- [#12304](https://github.com/Kilo-Org/kilocode/pull/12304) [`79fe757`](https://github.com/Kilo-Org/kilocode/commit/79fe75745fc6abd7bd3aad0c079e8f5150751a2c) - Display here-document content as plain text in terminal approval prompts.

- [#11944](https://github.com/Kilo-Org/kilocode/pull/11944) [`f857248`](https://github.com/Kilo-Org/kilocode/commit/f85724830c6483d22368d3ad75d12639e1488733) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Support bidirectional text in chat messages so right-to-left and mixed-language conversations render in the correct direction.

- [#12302](https://github.com/Kilo-Org/kilocode/pull/12302) [`ad66c90`](https://github.com/Kilo-Org/kilocode/commit/ad66c908a4bec5f29e6d83fa9efbd1f6cc2cd416) - Clarify when reverting a conversation does not restore workspace changes and link disabled snapshots to the Checkpoints setting.

- [#12279](https://github.com/Kilo-Org/kilocode/pull/12279) [`6ce16e7`](https://github.com/Kilo-Org/kilocode/commit/6ce16e7cae1c58b545d5eaf00f1c6c44830e22e6) - Open the Agent Manager new-worktree dialog from primary actions and keyboard shortcuts, with an explicit quick-create action in its dropdown.

- [#12415](https://github.com/Kilo-Org/kilocode/pull/12415) [`a695930`](https://github.com/Kilo-Org/kilocode/commit/a695930d792ce3882cf3d7231ebc9be0e2adfa13) - Fix diff content painting through and above the sticky headers of expanded Edit, Write, and Apply Patch tool cards when scrolling large diffs.

- [#12213](https://github.com/Kilo-Org/kilocode/pull/12213) [`55fe160`](https://github.com/Kilo-Org/kilocode/commit/55fe1608fb24705258232665f1adfff0b4227e24) - Keep sessions usable after deprecated local review commands complete without a session status transition.

- [#12378](https://github.com/Kilo-Org/kilocode/pull/12378) [`b402cc2`](https://github.com/Kilo-Org/kilocode/commit/b402cc2635c1dae836a684f9d7a981c05491a930) - Include image-output models in the Kilo Gateway chat model list.

- [#12401](https://github.com/Kilo-Org/kilocode/pull/12401) [`210a6bb`](https://github.com/Kilo-Org/kilocode/commit/210a6bbf9b89b30b408d744cf0f253482370eed6) - Fix double scrollbars in the Agent Manager new-worktree prompt field and widen the dialog so longer prompts stay readable. The prompt box now grows with its content like the sidebar chat input, the textarea is the only element that scrolls, and manual resize of the prompt area keeps working.

- Updated dependencies [[`084bcea`](https://github.com/Kilo-Org/kilocode/commit/084bceadaedf193568ccf71256bd299c0d11e90c), [`c081f58`](https://github.com/Kilo-Org/kilocode/commit/c081f582abecaba98a303069140d014a9ee90ca9), [`ff703fb`](https://github.com/Kilo-Org/kilocode/commit/ff703fba621e35a4a5d8e4801620502228cca5bf)]:
  - @kilocode/kilo-gateway@7.4.12
  - @kilocode/kilo-indexing@7.5.0
  - @opencode-ai/core@7.4.12
  - @kilocode/kilo-ui@7.4.12
  - @opencode-ai/ui@7.4.12

## jetbrains/v7.0.9 — 2026-07-21

### Added

- Add a Rules settings page under Agent Behavior for managing instruction files and Claude Code compatibility.

### Fixed

- Restore importing cloud-only session history by updating the JetBrains CLI pin to Kilo Core 7.4.13.

### Changed

- Improve xAI prompt cache usage in Kilo Core for better cache hit rates.


## jetbrains/v7.0.8 — 2026-07-21

### Added

- Add settings for context controls, including context mentions and ignore patterns.
- Add settings for skills, including editing local skills and viewing remote skills as read-only.
- Add auto-approve settings for permission rules, with filters and wildcard labels.
- Use Kilo Core for JetBrains file mention search so @-mentions match CLI indexing behavior.

### Changed

- Update the JetBrains CLI pin from Kilo Core 7.4.5 to 7.4.11.


## v7.4.11 — 2026-07-16

## 7.4.11

### Minor Changes

- [#12254](https://github.com/Kilo-Org/kilocode/pull/12254) [`30e7ec4`](https://github.com/Kilo-Org/kilocode/commit/30e7ec4ab45fac724b41ec0b4342e272e7f584d2) - Improve project-memory activity in VS Code with a task-header menu, quick actions, and optional verbose details.

- [#12250](https://github.com/Kilo-Org/kilocode/pull/12250) [`bd69158`](https://github.com/Kilo-Org/kilocode/commit/bd69158131aafdcc2f44aede22b573c2b0432f21) - Support verbose project-memory settings and show recalled memory snippets in conversation markers when enabled.

### Patch Changes

- [#12287](https://github.com/Kilo-Org/kilocode/pull/12287) [`bb75928`](https://github.com/Kilo-Org/kilocode/commit/bb759287495fabc1f3fa7e0fbecff13ab4d41cb2) - Use distinct icons for context, project memory, and code indexing, and group context controls to preserve task titles in narrow VS Code sidebars.

- [#12285](https://github.com/Kilo-Org/kilocode/pull/12285) [`9fa2e18`](https://github.com/Kilo-Org/kilocode/commit/9fa2e187047a4d2b6e76066af3c139c21851e854) - Prevent sessions from freezing after submitting or dismissing a question.

- [#12274](https://github.com/Kilo-Org/kilocode/pull/12274) [`5180c10`](https://github.com/Kilo-Org/kilocode/commit/5180c10c4f69500ce303437646371500a71dba46) - Show newly submitted messages immediately after reverting a conversation.

- Updated dependencies [[`319f159`](https://github.com/Kilo-Org/kilocode/commit/319f159ac333d18855a72ddb1fa61ed471ebf2d9), [`bb75928`](https://github.com/Kilo-Org/kilocode/commit/bb759287495fabc1f3fa7e0fbecff13ab4d41cb2), [`9fa8a13`](https://github.com/Kilo-Org/kilocode/commit/9fa8a13e26db552373149e1275597eb07861de91), [`30e7ec4`](https://github.com/Kilo-Org/kilocode/commit/30e7ec4ab45fac724b41ec0b4342e272e7f584d2), [`bd69158`](https://github.com/Kilo-Org/kilocode/commit/bd69158131aafdcc2f44aede22b573c2b0432f21)]:
  - @kilocode/kilo-gateway@7.4.10
  - @kilocode/kilo-ui@7.4.10
  - @kilocode/kilo-memory@7.5.0
  - @kilocode/sdk@7.5.0
  - @opencode-ai/core@7.4.10
  - @kilocode/kilo-indexing@7.4.10
  - @kilocode/plugin@7.4.10
  - @opencode-ai/ui@7.4.10

## v7.4.9 — 2026-07-15

## 7.4.9

### Patch Changes

- [#12194](https://github.com/Kilo-Org/kilocode/pull/12194) [`46fe0a9`](https://github.com/Kilo-Org/kilocode/commit/46fe0a91d91ec42931a3af78e409334f05de91ea) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Toggle chat search from the Command Palette, jump focus back to the chat input when it closes, and auto-expand the collapsed tool call or reasoning block containing the current search match.

- [#11977](https://github.com/Kilo-Org/kilocode/pull/11977) [`a76dc77`](https://github.com/Kilo-Org/kilocode/commit/a76dc773805d6cdb67e66a0533b39f44487bf742) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Fix file @mentions for filenames containing spaces or non-ASCII characters. Such mentions now stay fully highlighted in the sent message and are read correctly instead of failing with "File not found".

## v7.4.8 — 2026-07-15

## 7.4.8

### Minor Changes

- [#12159](https://github.com/Kilo-Org/kilocode/pull/12159) [`1083bb8`](https://github.com/Kilo-Org/kilocode/commit/1083bb82b65e986dfbc7092647b6ee2650951265) - Report active CLI and VS Code app and session presence.

- [#12065](https://github.com/Kilo-Org/kilocode/pull/12065) [`2040f6c`](https://github.com/Kilo-Org/kilocode/commit/2040f6c896df41a4ac6c233b839ff938b86a1a30) - Hovering or focusing a bar in the task timeline now highlights the matching tool call in the transcript, making it easier to see which bar belongs to which tool.

- [#11687](https://github.com/Kilo-Org/kilocode/pull/11687) [`c8047e6`](https://github.com/Kilo-Org/kilocode/commit/c8047e65f5aaf05294a76be2ac3534b0a45ec78a) - Add the prompt enhancer to the New Worktree dialog, so prompts can be enhanced before creating worktree sessions.

### Patch Changes

- [#11868](https://github.com/Kilo-Org/kilocode/pull/11868) [`5b97ba1`](https://github.com/Kilo-Org/kilocode/commit/5b97ba1c06b662095a55b4a3686f71f55d39a4c2) Thanks [@Tamsi](https://github.com/Tamsi)! - Improve agent behaviour setting descriptions for Temperature, Top P, and Max Steps.

- [#12183](https://github.com/Kilo-Org/kilocode/pull/12183) [`751cac5`](https://github.com/Kilo-Org/kilocode/commit/751cac5e757d626c66e66122ffce312cc4182a29) Thanks [@AmariahAK](https://github.com/AmariahAK)! - Move "Browse files..." to the end of the @-mention dropdown so the closest matching file is the default selection instead of the file picker.

- [#12211](https://github.com/Kilo-Org/kilocode/pull/12211) [`b478786`](https://github.com/Kilo-Org/kilocode/commit/b47878636bd4004dfd0f91b9e51b5244df1636a1) - Correct the token usage summary's cache-read indicator and group cached input with other input tokens.

- [#11922](https://github.com/Kilo-Org/kilocode/pull/11922) [`07dab7b`](https://github.com/Kilo-Org/kilocode/commit/07dab7bf113a090df4de07a92249039454ef25e3) Thanks [@LEN5010](https://github.com/LEN5010)! - Improve question option visibility in light VS Code themes.

- [#11783](https://github.com/Kilo-Org/kilocode/pull/11783) [`6a3e5f3`](https://github.com/Kilo-Org/kilocode/commit/6a3e5f39011e4b1a63ab5d0ae0dbf8195ea29d4c) - Inherit sandbox state when a sandboxed agent starts new Agent Manager sessions.

- [#12174](https://github.com/Kilo-Org/kilocode/pull/12174) [`3ba4c33`](https://github.com/Kilo-Org/kilocode/commit/3ba4c33544451076bd5ecb3b698e74ede0434c82) - Inspect managed Agent Manager sessions and send a targeted prompt to an idle existing session from the native Agent Manager tool. Require a separate explicit approval before prompting another managed session.

- [#12212](https://github.com/Kilo-Org/kilocode/pull/12212) [`38d7608`](https://github.com/Kilo-Org/kilocode/commit/38d760896573a4667bc87c67da5b304f39f14b0a) - Preserve the current local commit when moving a session into a worktree.

- [#11536](https://github.com/Kilo-Org/kilocode/pull/11536) [`be7418f`](https://github.com/Kilo-Org/kilocode/commit/be7418f94ac2a7a3f762ea21b1425d99c0d66e83) - Keep Task tool subagents out of Agent Manager tabs.

- [#12201](https://github.com/Kilo-Org/kilocode/pull/12201) [`51848c4`](https://github.com/Kilo-Org/kilocode/commit/51848c42cb43fccc0f413b9537d7093eaab60a92) - Remember initial session prompts when navigating chat input history with the arrow keys.

- [#12158](https://github.com/Kilo-Org/kilocode/pull/12158) [`3b1e07c`](https://github.com/Kilo-Org/kilocode/commit/3b1e07cc0033bdb37e762ed6e0f85dab4214780d) - Enforce read and ignore permissions when file mentions add content to a prompt.

- [#12177](https://github.com/Kilo-Org/kilocode/pull/12177) [`e372cb3`](https://github.com/Kilo-Org/kilocode/commit/e372cb3d54b36465156fbca4b01cd160ce2fa804) - Keep keyboard focus on the active sidebar tab after closing an inactive session tab.

- [#11424](https://github.com/Kilo-Org/kilocode/pull/11424) [`3a4438e`](https://github.com/Kilo-Org/kilocode/commit/3a4438e748f80a23bd33eb4aa824d3dffb3d588a) - Stop active Agent Manager sessions and their subagents when a session tab or the Agent Manager tab closes.

- Updated dependencies [[`6a3e5f3`](https://github.com/Kilo-Org/kilocode/commit/6a3e5f39011e4b1a63ab5d0ae0dbf8195ea29d4c), [`227c65d`](https://github.com/Kilo-Org/kilocode/commit/227c65d1004fc1f48e71335cc574a2e6986c4893), [`3ba4c33`](https://github.com/Kilo-Org/kilocode/commit/3ba4c33544451076bd5ecb3b698e74ede0434c82)]:
  - @kilocode/sdk@7.4.8
  - @kilocode/kilo-indexing@7.4.8
  - @kilocode/kilo-ui@7.4.8
  - @kilocode/plugin@7.4.8
  - @opencode-ai/ui@7.4.8
  - @opencode-ai/core@7.4.8
  - @kilocode/kilo-gateway@7.4.8

## jetbrains/v7.0.7 — 2026-07-16

### Added

- Add support for OpenAI-compatible custom providers.

### Fixed

- Improve custom provider setup by validating required fields and showing configuration errors in the dialog.
- Close the custom provider dialog correctly after adding a provider.
- Clean up deleted custom providers by using the disconnect flow.

### Changed

- Keep the JetBrains plugin pinned to Kilo Core 7.4.5 for this release.


## jetbrains/v7.0.6 — 2026-07-14

### Fixed

- Honor the IDE's certificate and proxy settings for outbound HTTPS requests.
- Scale the session UI correctly with IDE zoom, fixing double-scaled heights and extra empty space in the transcript and prompt composer.


## jetbrains/v7.0.5 — 2026-07-14

### Added

- Add an elapsed-time indicator to the session progress footer so long-running tasks show how long they have been active.
- Support importing legacy JetBrains v5 data directly from raw storage when the previous consolidated migration file is unavailable.

### Fixed

- Restore the v5 migration wizard for users whose legacy provider, OAuth, MCP, mode, setting, or session data was not detected during upgrade.
- Improve migration reliability by preserving checklist todos, importing legacy tool calls as assistant parts, validating raw session IDs, and reducing migration memory usage.
- Polish session controls with more native prompt icons, progress footer spacing, auto-hiding prompt scrollbars, and improved rollback/redo scrolling.

### Changed

- Keep the JetBrains plugin pinned to Kilo Core 7.4.5 for this release.


## v7.4.7 — 2026-07-13

## 7.4.7

### Patch Changes

- [#12176](https://github.com/Kilo-Org/kilocode/pull/12176) [`b740152`](https://github.com/Kilo-Org/kilocode/commit/b74015280aee3cf2de901f39386025073a8726f0) - Focus the sidebar prompt after closing an active session tab.

## 7.4.6

### Minor Changes

- [#12155](https://github.com/Kilo-Org/kilocode/pull/12155) [`7a7c28c`](https://github.com/Kilo-Org/kilocode/commit/7a7c28c27139f12dbe1e674db3fbf7b7cb42c6fa) - Add in-chat search to the VS Code sidebar and editor tabs. Click the search icon in the session header to find text across the current conversation, with match case, whole word, and regular expression options, then step through highlighted matches with the next/previous controls.

- [#10466](https://github.com/Kilo-Org/kilocode/pull/10466) [`4051eec`](https://github.com/Kilo-Org/kilocode/commit/4051eec1707b1b9dc59f645742739a293a0ae0aa) - Open multiple same-repository sessions as tabs from Kilo sidebar and editor-tab chats.

- [#12075](https://github.com/Kilo-Org/kilocode/pull/12075) [`1e0b25a`](https://github.com/Kilo-Org/kilocode/commit/1e0b25a134a11c03494d5871be3e43a6881f1d87) - Support configuring network destinations that sandboxed tools can reach while network access is otherwise restricted.

- [#12028](https://github.com/Kilo-Org/kilocode/pull/12028) [`b2831c2`](https://github.com/Kilo-Org/kilocode/commit/b2831c20d9c39aaec053672161f9ce4791374f43) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Add a "Browse files..." option to the @ mention dropdown in the VS Code extension prompt input. Selecting it opens a native file picker and mentions the chosen file, so you can point Kilo Code at files outside the current workspace. Files outside the workspace are not auto-attached; Kilo Code reads them on request through the normal Read tool, respecting your file access permissions.

### Patch Changes

- [#12093](https://github.com/Kilo-Org/kilocode/pull/12093) [`8b46601`](https://github.com/Kilo-Org/kilocode/commit/8b466010c58497acd35867c8a67292c063f3dac4) - Speed up VS Code settings saves by draining pending prompts and disposing worktree instances concurrently.

- [#12162](https://github.com/Kilo-Org/kilocode/pull/12162) [`3ee9144`](https://github.com/Kilo-Org/kilocode/commit/3ee91448eeadf353fc611d8e42ac1f5c8cb5eac0) - Show troubleshooting and migration guidance when Google Gemini rejects API credentials.

- [#12040](https://github.com/Kilo-Org/kilocode/pull/12040) [`93c209b`](https://github.com/Kilo-Org/kilocode/commit/93c209bfd1f068b26b38ac4e9b7237d4c7f095e1) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Hide gpt-5.5-pro from the model picker when using ChatGPT OAuth login, since Codex rejects it with HTTP 400.

- [#12059](https://github.com/Kilo-Org/kilocode/pull/12059) [`7e7ab7e`](https://github.com/Kilo-Org/kilocode/commit/7e7ab7e795ca0922f16bfa549d088c23fe631c2f) - Support rollback and redo controls in JetBrains sessions and clarify when reverted changes can be redone.

- [#12089](https://github.com/Kilo-Org/kilocode/pull/12089) [`e674cdf`](https://github.com/Kilo-Org/kilocode/commit/e674cdf6688383a7418441483ac55007489b6bbb) - Load expanded diff previews consistently when opening a review.

- [#12077](https://github.com/Kilo-Org/kilocode/pull/12077) [`39468b0`](https://github.com/Kilo-Org/kilocode/commit/39468b0441ddb46aa24a27d2efd6d6a2662ef392) - Show effective permission defaults and clarify external-directory approvals in VS Code.

- [#12078](https://github.com/Kilo-Org/kilocode/pull/12078) [`09f12c2`](https://github.com/Kilo-Org/kilocode/commit/09f12c2351ba20408b1b3030dbe32fdfbd6599b5) - Show sandbox controls only after sandboxing is enabled in settings.

- [#12105](https://github.com/Kilo-Org/kilocode/pull/12105) [`e0bfed3`](https://github.com/Kilo-Org/kilocode/commit/e0bfed308ce7906e4d9ca923e82eda1c20cefd2b) - Shut down the headless `kilo serve` process automatically when the editor client that launched it exits without a clean signal, preventing orphaned CLI processes.

- [#12152](https://github.com/Kilo-Org/kilocode/pull/12152) [`f6149e8`](https://github.com/Kilo-Org/kilocode/commit/f6149e8b1ff3300f4244190628e6f081811ac5b8) - Start Agent Manager local sessions on Windows when workspace drive-letter casing differs.

- Updated dependencies [[`039b73d`](https://github.com/Kilo-Org/kilocode/commit/039b73dfaefe93452501a48914eaeeb2f83c572b), [`1e0b25a`](https://github.com/Kilo-Org/kilocode/commit/1e0b25a134a11c03494d5871be3e43a6881f1d87), [`94b553b`](https://github.com/Kilo-Org/kilocode/commit/94b553b91b130d996ce833e168e579df51a14957)]:
  - @kilocode/kilo-indexing@7.4.6
  - @kilocode/sdk@7.5.0
  - @kilocode/kilo-ui@7.4.6
  - @kilocode/plugin@7.4.6
  - @opencode-ai/ui@7.4.6
  - @kilocode/kilo-gateway@7.4.6
  - @opencode-ai/core@7.4.6

## jetbrains/v7.0.4 — 2026-07-10

### Fixed

- Stop orphaned Kilo Core processes on Windows so closing the IDE no longer leaves a lingering `kilo serve` process or blocks the next IDE launch.
- Improve JetBrains CLI shutdown ordering so app close kills the process tree before closing streams, preventing Windows shutdown deadlocks.


## jetbrains/v7.0.3 — 2026-07-10

### Added

- Add rollback redo controls in JetBrains sessions so reverted changes can be restored from the chat UI.
- Add inline revert progress in JetBrains sessions, including localized status text and safer cancellation handling.
- Add Kilo Core support for localized commit-message generation, AI image generation, large bash-output pruning, and improved model-usage display.

### Fixed

- Harden Kilo Core startup and shutdown so startup failures show clearer diagnostics, app close stops the CLI process, and lingering child processes are cleaned up more reliably.
- Fix workspace reload recovery so stale reload state no longer disrupts the session connection.
- Fix JetBrains rollback and revert flows so prompt focus, scroll state, diff order, and turn state are preserved more reliably.
- Fix Kilo Core Bedrock SSO credential resolution and commit-message error handling when no changes are available.

### Changed

- Update the JetBrains plugin to download Kilo Core 7.4.5.


## v7.4.5 — 2026-07-09

No notable changes

## v7.4.4 — 2026-07-09

## 7.4.4

### Patch Changes

- [#12049](https://github.com/Kilo-Org/kilocode/pull/12049) [`394af39`](https://github.com/Kilo-Org/kilocode/commit/394af39c64b2920fa8c84f14670f213820cef2ec) - Configure sandboxing through first-class sandbox settings, and show its controls in the dedicated Sandboxing page for all supported macOS and Linux users while keeping it disabled by default.

- Updated dependencies [[`394af39`](https://github.com/Kilo-Org/kilocode/commit/394af39c64b2920fa8c84f14670f213820cef2ec)]:
  - @kilocode/sdk@7.5.0
  - @kilocode/kilo-ui@7.4.4
  - @kilocode/plugin@7.4.4
  - @opencode-ai/ui@7.4.4
  - @kilocode/kilo-gateway@7.4.4
  - @kilocode/kilo-indexing@7.4.4
  - @opencode-ai/core@7.4.4

## v7.4.3 — 2026-07-09

## 7.4.2

### Minor Changes

- [#11826](https://github.com/Kilo-Org/kilocode/pull/11826) [`dfa712d`](https://github.com/Kilo-Org/kilocode/commit/dfa712d98979680479cb10cbe34a23f7be244726) Thanks [@vkeerthivikram](https://github.com/vkeerthivikram)! - Add experimental AI image generation tool. Enable via `experimental.image_generation` in config. Supports text-to-image generation and image editing through the Kilo Gateway or a BYO OpenRouter API key.

- [#12010](https://github.com/Kilo-Org/kilocode/pull/12010) [`2184888`](https://github.com/Kilo-Org/kilocode/commit/21848889cdee0f0e485780bd2fd97be1cc68ef61) - Render images inline in the chat view when the agent reads an image file. Images appear below the read tool card and can be clicked to open a full-size preview.

- [#11954](https://github.com/Kilo-Org/kilocode/pull/11954) [`b0348cb`](https://github.com/Kilo-Org/kilocode/commit/b0348cbc01438f603f767117ca6f2e15370e099e) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Integrate project memory into the VS Code extension: memory status and controls in the Context settings tab, task-header and assistant-message affordances, the `/memory` prompt command, and Show/Toggle Project Memory command-palette entries.

- [#11631](https://github.com/Kilo-Org/kilocode/pull/11631) [`0734e3d`](https://github.com/Kilo-Org/kilocode/commit/0734e3d75a588a3468a608255a65b52a7bd325e0) - Enable autocomplete across supported languages in Jupyter notebooks.

- [#12004](https://github.com/Kilo-Org/kilocode/pull/12004) [`cef3dc7`](https://github.com/Kilo-Org/kilocode/commit/cef3dc7ae8a7ef7f26e36fb690af5014b542b7bb) - Add a reload action that reboots the per-directory instance, picking up config, skills, agents, commands, and MCP prompts changed on disk. Sessions and history are preserved. Surfaces: `/reload` in the CLI palette and editor chat, a reload button in the task header and settings panel, the `Kilo Code: Reload Config and Skills` command, and a `POST /instance/reload` HTTP endpoint. The endpoint returns 409 while a session is actively running.

- [#12025](https://github.com/Kilo-Org/kilocode/pull/12025) [`2d724f1`](https://github.com/Kilo-Org/kilocode/commit/2d724f158b2828eecf9eab60b790e071f8d05d20) Thanks [@sylwester-liljegren](https://github.com/sylwester-liljegren)! - Click or press Enter/Space on a bar in the task timeline to jump the transcript to that message.

### Patch Changes

- [#12007](https://github.com/Kilo-Org/kilocode/pull/12007) [`a5df5bc`](https://github.com/Kilo-Org/kilocode/commit/a5df5bc8e4bfca64c3846955d781ae67edcbb186) - Fix the reasoning-variant and mode dropdowns being clipped inside the New Worktree dialog. The dialog's scroll-container overflow escape now covers all inline selector popovers, not just the model picker, so dropdowns render fully above the prompt input.

- [#12033](https://github.com/Kilo-Org/kilocode/pull/12033) [`9fc1a1d`](https://github.com/Kilo-Org/kilocode/commit/9fc1a1d94c29236ce0d949e9a6b2fefc70afaab8) - Show a clear "No changes found to generate a commit message for" error instead of a generic "Unexpected server error" when there is nothing to commit. The endpoint now returns a typed 422, and the extension surfaces the real message directly.

- [#11825](https://github.com/Kilo-Org/kilocode/pull/11825) [`0b78469`](https://github.com/Kilo-Org/kilocode/commit/0b784691f271fac4ca983468656bac248aa98f3f) Thanks [@jackson-zhou](https://github.com/jackson-zhou)! - Support marking custom provider models as image-capable in VS Code settings.

- [#12002](https://github.com/Kilo-Org/kilocode/pull/12002) [`885a994`](https://github.com/Kilo-Org/kilocode/commit/885a994106741ea7caf59c051812cd7521f4cf2c) - Defer Agent Manager automatic branch naming until the conversation shows a durable task. The first user message no longer renames the branch; naming waits for a second message (up to four) or for the worktree to contain changes, and renames only run while the session is idle. Read-only verification questions (for example "is X fixed?") no longer claim the branch name.

- [#12015](https://github.com/Kilo-Org/kilocode/pull/12015) [`4dc994d`](https://github.com/Kilo-Org/kilocode/commit/4dc994d93bc589798293cc848a64e89fc8cfed60) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Support bidirectional text in the Agent Manager new worktree prompt.

- [#12006](https://github.com/Kilo-Org/kilocode/pull/12006) [`5c41d65`](https://github.com/Kilo-Org/kilocode/commit/5c41d65fe4295537eeeb70fcb020a2dd8fa47648) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Fix multiline bidirectional prompt input rendering and file mention arrow navigation.

- [#12032](https://github.com/Kilo-Org/kilocode/pull/12032) [`e4ae1c7`](https://github.com/Kilo-Org/kilocode/commit/e4ae1c75cec7e2aee3c82ebf2c1a3dd8a06a2031) - Fix settings sidebar truncating localized section labels in non-English languages.

- [#12042](https://github.com/Kilo-Org/kilocode/pull/12042) [`22b9f7f`](https://github.com/Kilo-Org/kilocode/commit/22b9f7fd932043722096919aabb08109901f01de) Thanks [@shssoichiro](https://github.com/shssoichiro)! - Respect nested `.gitignore` and `.kilocodeignore` files during codebase indexing.

- [#11936](https://github.com/Kilo-Org/kilocode/pull/11936) [`3d16f29`](https://github.com/Kilo-Org/kilocode/commit/3d16f29520646461101d4059789b2639e3fcb46a) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Allow Shift+Arrow selections in the prompt input to shrink back across file mentions.

- [#12000](https://github.com/Kilo-Org/kilocode/pull/12000) [`dfce405`](https://github.com/Kilo-Org/kilocode/commit/dfce4059f364da8c294723e582c44885fa6e55e1) - Fix the model usage panel showing just "free" for auto-routed sessions. The routed model id (e.g. `tencent/hy3:free`) is now displayed correctly instead of being collapsed to its `:free` suffix.

- [#12008](https://github.com/Kilo-Org/kilocode/pull/12008) [`e29196c`](https://github.com/Kilo-Org/kilocode/commit/e29196c949897d56efa9923e8655301635c26d66) - Widen the Additional Writable Paths input in the Sandboxing settings so longer filesystem paths are easier to read while typing.

- [#11994](https://github.com/Kilo-Org/kilocode/pull/11994) [`eefd891`](https://github.com/Kilo-Org/kilocode/commit/eefd891c62fb064275a4ec815c320422ca7e70ac) Thanks [@IOLOII](https://github.com/IOLOII)! - Generate commit messages in the user's selected UI language instead of always using English.

- [#12043](https://github.com/Kilo-Org/kilocode/pull/12043) [`8ff2a16`](https://github.com/Kilo-Org/kilocode/commit/8ff2a163affffa52a69fabd04ac4f542113b4488) - Fixed dismissed question tool content not showing in chat history. Dismissed questions now render with a "Dismissed" label and "N dismissed" subtitle instead of being invisible.

- [#12009](https://github.com/Kilo-Org/kilocode/pull/12009) [`130b256`](https://github.com/Kilo-Org/kilocode/commit/130b2568153f18be73744b85249f7ca0ab7d8e4e) - Preserve the selected mode when sending the first message in a new VS Code task so the chosen model is paired with the correct agent instructions.

- [#12001](https://github.com/Kilo-Org/kilocode/pull/12001) [`6ad16cd`](https://github.com/Kilo-Org/kilocode/commit/6ad16cd86924cc5400bf1a02ec1007d9f896559c) - Wait for microphone capture to start before showing voice input as recording.

- Updated dependencies [[`b976b5a`](https://github.com/Kilo-Org/kilocode/commit/b976b5a0137b6fa6c7959d5c8a548478efee1d1e), [`22b9f7f`](https://github.com/Kilo-Org/kilocode/commit/22b9f7fd932043722096919aabb08109901f01de), [`61b9e09`](https://github.com/Kilo-Org/kilocode/commit/61b9e0935cb3314acdabb4d3237b95395bfffb06), [`adcbe0f`](https://github.com/Kilo-Org/kilocode/commit/adcbe0f37321704abdc0994d4e1f78919c9bfa5a)]:
  - @kilocode/sdk@7.5.0
  - @kilocode/kilo-memory@7.5.0
  - @kilocode/kilo-indexing@7.4.2
  - @kilocode/kilo-gateway@7.4.2
  - @kilocode/kilo-ui@7.4.2
  - @kilocode/plugin@7.4.2
  - @opencode-ai/ui@7.4.2
  - @opencode-ai/core@7.4.2

## jetbrains/v7.0.2 — 2026-07-07

### Added

- First GA release of the native Kilo extension for JetBrains IDEs.
- Download the pinned Kilo Core release at runtime instead of bundling CLI binaries, keeping the JetBrains plugin smaller while verifying downloaded archives before use.
- Show Kilo Core runtime details from the JetBrains plugin so users can see which Core release is active.

### Fixed

- Improve JetBrains runtime CLI download reliability by pruning stale binaries, using the shell environment for PATH resolution, and surfacing exact release-resolution failures.

### Changed

- Polish JetBrains chat UI with auto-collapsing reasoning previews, clearer retry/offline footer state, and more balanced prompt, code, question, todo, history, and popup spacing.
- Show the active routed model name and remote status more consistently in CLI runtime surfaces.


## v7.4.1 — 2026-07-03

## 7.4.1

### Patch Changes

- [#11918](https://github.com/Kilo-Org/kilocode/pull/11918) [`4e4e41f`](https://github.com/Kilo-Org/kilocode/commit/4e4e41f6ce29b59730f3b66262bf4c6b13b7c80b) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Support bidirectional text in the prompt input.

- [#11926](https://github.com/Kilo-Org/kilocode/pull/11926) [`e79b751`](https://github.com/Kilo-Org/kilocode/commit/e79b75126c3da34a6aa6ac83cbf24672497c0910) Thanks [@trim21](https://github.com/trim21)! - Fix missing kilo-sandbox-mutation-worker.js in VS Code extension bundle, which caused sandboxed file operations to fail with "Module not found".

- [#11924](https://github.com/Kilo-Org/kilocode/pull/11924) [`1755f56`](https://github.com/Kilo-Org/kilocode/commit/1755f567fc8cbf4e8b950a3f862ff4e72ab77d70) - Fix the reasoning-variant (and mode) picker in the New Worktree dialog so selecting a variant actually applies. The pickers portaled their popover to the page body, where the dialog's modal overlay intercepted pointer events and swallowed the click before the option handler ran. Render the popovers inline (`portal={false}`), matching the model picker already fixed for the same reason.

## v7.4.0 — 2026-07-03

## 7.4.0

### Minor Changes

- [#11741](https://github.com/Kilo-Org/kilocode/pull/11741) [`0f43e2e`](https://github.com/Kilo-Org/kilocode/commit/0f43e2e08a19b0562cf9c0b0d3df863d285e4829) - Automatically give Agent Manager branches task-focused names once the conversation establishes a clear workstream, with optional prefixes and a setting to disable automatic naming.

### Patch Changes

- [#11442](https://github.com/Kilo-Org/kilocode/pull/11442) [`5df7aa4`](https://github.com/Kilo-Org/kilocode/commit/5df7aa4f93dbfed53b240d31adfa2c838d5c8b33) Thanks [@IamCoder18](https://github.com/IamCoder18)! - Free webview memory for deleted VS Code sessions by clearing unsent prompt text, review comments, and pending image attachments that were retained in the per-session draft cache after `sessionDeleted`.

  Also restores an in-flight failed draft into the live prompt after a session is deleted mid-send (whether user-initiated or via external CLI/TUI/cascade delete), while never rehydrating it into a prompt the user explicitly cleared.

- [#11843](https://github.com/Kilo-Org/kilocode/pull/11843) [`76d0b21`](https://github.com/Kilo-Org/kilocode/commit/76d0b2103ee855c66ac6568f052f077febd4f30f) - Keep the chat in sync with the selected Agent Manager session when the backend connection is briefly unavailable, so switching sessions no longer updates only the side diff while the conversation stays on the previous session.

- [#11572](https://github.com/Kilo-Org/kilocode/pull/11572) [`aa19c98`](https://github.com/Kilo-Org/kilocode/commit/aa19c9839135279424d3924926a977e290f67f42) Thanks [@ysheikh2](https://github.com/ysheikh2)! - Fix AWS Bedrock requests failing in the VS Code extension when Bedrock is configured through SSO or an AWS credential chain.

- [#11893](https://github.com/Kilo-Org/kilocode/pull/11893) [`a8b4b72`](https://github.com/Kilo-Org/kilocode/commit/a8b4b72da61dc1c89c6b2fa3253a7ef3aee1974c) - Fix slow message loading when opening or switching sessions. The per-model token usage breakdown scanned the entire message history on every session open, which blocked the transcript from rendering for several seconds on large histories.

- [#11890](https://github.com/Kilo-Org/kilocode/pull/11890) [`b0a50da`](https://github.com/Kilo-Org/kilocode/commit/b0a50da0e49989989f28441d4ff928992f6a5888) - Close read-only bash escapes where allowed commands could still run arbitrary programs via flags (`sort --compress-program`, `rg --pre`, `ag --pager`, `man -P`/`-H`).

- [#11522](https://github.com/Kilo-Org/kilocode/pull/11522) [`f42441b`](https://github.com/Kilo-Org/kilocode/commit/f42441b310f5bb2b67eadf2d32738c20e788fafc) Thanks [@Drixled](https://github.com/Drixled)! - Align subagent and MCP output surfaces with other tool results and prevent completed subagent results from opening with a clipped row.

- [#11824](https://github.com/Kilo-Org/kilocode/pull/11824) [`78cdc9c`](https://github.com/Kilo-Org/kilocode/commit/78cdc9c8960c8feb7dae0f334644da5a9a7be499) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Preserve the model picker preview panel expand/collapse state across reloads and restarts.

- [#11896](https://github.com/Kilo-Org/kilocode/pull/11896) [`c36c293`](https://github.com/Kilo-Org/kilocode/commit/c36c293f3c9a7d6d67e392cdf3f57c3a4955b993) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Report the plan file that was actually saved in Plan mode: point the "Plan is ready" link, the follow-up prompt, and the new-session handoff at the real file instead of a wrongly generated name, and fail plan_exit with a clear error when no plan was written.

- [#11808](https://github.com/Kilo-Org/kilocode/pull/11808) [`ce09eb3`](https://github.com/Kilo-Org/kilocode/commit/ce09eb39b5c7199e941a4df3229ab5ad2a3af230) - Show an interactive Implement / Keep refining panel when Plan mode is ready instead of asking users to type a numbered choice.

- [#11881](https://github.com/Kilo-Org/kilocode/pull/11881) [`9ff1062`](https://github.com/Kilo-Org/kilocode/commit/9ff1062d916669511d38d05e861080e129f6a271) - Make "Show more providers" a prominent entry in the Popular providers list and collapse Disabled Providers by default in the Providers settings.

- [#11915](https://github.com/Kilo-Org/kilocode/pull/11915) [`0c1a7ce`](https://github.com/Kilo-Org/kilocode/commit/0c1a7cee9978c2af17610fd6509c3e1f06333f70) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Remove the balance chip from the session header.

- [#11838](https://github.com/Kilo-Org/kilocode/pull/11838) [`eec075b`](https://github.com/Kilo-Org/kilocode/commit/eec075bc86a0f67b17f778908bd4c2d796024cda) - Retain the sandbox toggle state when forking a session or moving it to a worktree, instead of resetting it to the workspace default.

- [#11910](https://github.com/Kilo-Org/kilocode/pull/11910) [`5c4ce72`](https://github.com/Kilo-Org/kilocode/commit/5c4ce7251a4165ac575c28ecef45a9149e033fda) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Remember the model picker expand/collapse choice across the sidebar and the Agent Manager

- [#11832](https://github.com/Kilo-Org/kilocode/pull/11832) [`3943462`](https://github.com/Kilo-Org/kilocode/commit/394346247de9e05d7f1806fe29357d5703b58b32) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Warn before continuing a session whose spend is above the configured max cost. Opt-in and disabled by default — set a whole-dollar Session Cost Alert under Auto-Approve settings to enable it.

- [#11803](https://github.com/Kilo-Org/kilocode/pull/11803) [`9638de5`](https://github.com/Kilo-Org/kilocode/commit/9638de532ba8a32bbc3f13d1113de1aed6776bee) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Show account balance in the VS Code header account switcher and surface Kilo Pass details on the profile page.

## 7.3.63

### Minor Changes

- [#11714](https://github.com/Kilo-Org/kilocode/pull/11714) [`7b2063f`](https://github.com/Kilo-Org/kilocode/commit/7b2063f35440fd65e9ec2d38fd656da960ff48b6) - Connect to a local Anaconda Desktop text-generation model server from the CLI or VS Code.

- [#11693](https://github.com/Kilo-Org/kilocode/pull/11693) [`1fb3e06`](https://github.com/Kilo-Org/kilocode/commit/1fb3e0679dfd7be2a4ae3161ecaf1c6e4ae32ef5) - Support NVIDIA Parakeet TDT 0.6B v3 for speech-to-text input.

- [#11786](https://github.com/Kilo-Org/kilocode/pull/11786) [`123a939`](https://github.com/Kilo-Org/kilocode/commit/123a9395d2ec645c3dc247170188f42bbf7c9333) - Allow Agent Manager chat tools to discover available models and reasoning variants by model name, then start each session with the chosen model and reasoning effort. Agent Manager resolves the provider for a named model automatically, preferring the provider behind the current default model and falling back to the Kilo Gateway.

- [#11689](https://github.com/Kilo-Org/kilocode/pull/11689) [`9e04e74`](https://github.com/Kilo-Org/kilocode/commit/9e04e74ebd7be6dce7ed15d7394c9b9eb2772e64) - Add a sandbox toggle to the Agent Manager New Worktree modal so each worktree session can start sandboxed

- [#11597](https://github.com/Kilo-Org/kilocode/pull/11597) [`b943970`](https://github.com/Kilo-Org/kilocode/commit/b9439700bd5a1c2d2fe78bfa147a60eb37ee46a5) - Enable autocomplete in Jupyter notebooks.

- [#11640](https://github.com/Kilo-Org/kilocode/pull/11640) [`c264515`](https://github.com/Kilo-Org/kilocode/commit/c264515773376d0ce4e0f179aafbdf29e2d50734) - Filter marketplace items to those relevant to the current workspace's files and installed VS Code extensions.

- [#11659](https://github.com/Kilo-Org/kilocode/pull/11659) [`7f4702b`](https://github.com/Kilo-Org/kilocode/commit/7f4702bec9028206b9479e0add9725e13b09b86c) - Enforce the sandbox network restriction for agent commands on Linux, including TCP, UDP, IPv4, IPv6, and descendant processes.

- [#11603](https://github.com/Kilo-Org/kilocode/pull/11603) [`9fbc456`](https://github.com/Kilo-Org/kilocode/commit/9fbc456b75887ee314c339bc1eba7decba79c6c0) - Block outbound network access from agent commands and in-process HTTP tools with the optional macOS sandbox, with a Sandboxing setting to allow network access when needed.

- [#11698](https://github.com/Kilo-Org/kilocode/pull/11698) [`80ed571`](https://github.com/Kilo-Org/kilocode/commit/80ed571bd692b49b091a7553d615ef8da951ea33) - Notify when a marketplace item matches your workspace, with a one-click install button and a "Don't show again" option per suggestion.

- [#11582](https://github.com/Kilo-Org/kilocode/pull/11582) [`45eadab`](https://github.com/Kilo-Org/kilocode/commit/45eadab047e820bc020149e0f7f92e7feb09a8d6) - Browse skills, agents, and MCP servers together and filter them by category.

- [#11644](https://github.com/Kilo-Org/kilocode/pull/11644) [`c193ee8`](https://github.com/Kilo-Org/kilocode/commit/c193ee856118c1315ef01b497b38614846e7cd73) - Support safely reading, editing, and executing Jupyter notebook cells directly from Kilo in VS Code, including absolute workspace paths and content-based edit conflict detection.

- [#11726](https://github.com/Kilo-Org/kilocode/pull/11726) [`6bc57fe`](https://github.com/Kilo-Org/kilocode/commit/6bc57fe6f8ef8523f8fca39c2fc42f98b0dbfb94) - Let the notebook tools create a new empty notebook.

- [#11548](https://github.com/Kilo-Org/kilocode/pull/11548) [`c55e804`](https://github.com/Kilo-Org/kilocode/commit/c55e804c1cf7b0a0d9f7693e19daeeb91c4c8624) - Confine agent shell and file-tool writes to project and Kilo state directories with the optional macOS and Linux sandboxes.

- [#11570](https://github.com/Kilo-Org/kilocode/pull/11570) [`1d16eff`](https://github.com/Kilo-Org/kilocode/commit/1d16effe952f6da42044550c718e15213e930058) - Let users hide the codebase indexing button while indexing is off.

- [#11681](https://github.com/Kilo-Org/kilocode/pull/11681) [`27fb550`](https://github.com/Kilo-Org/kilocode/commit/27fb5500e320258c259f2e9d53c5a4f4d38954e2) - Toggle the current session sandbox with `/sandbox` in the sidebar and Agent Manager.

### Patch Changes

- [#11785](https://github.com/Kilo-Org/kilocode/pull/11785) [`5e22a7b`](https://github.com/Kilo-Org/kilocode/commit/5e22a7b2558d1976cf396d7879fefa9e1f41c593) - Color Agent Manager PR badges by pull request state (open, draft, merged, closed) and show CI and review status as a separate icon, so a failing check is no longer mistaken for a closed PR.

- [#11792](https://github.com/Kilo-Org/kilocode/pull/11792) [`401e0fd`](https://github.com/Kilo-Org/kilocode/commit/401e0fd8c4ecf2957430465b2a5dfe100387279f) - Remember the Agent Manager new-worktree sandbox toggle for future sessions.

- [#11762](https://github.com/Kilo-Org/kilocode/pull/11762) [`d89b1b6`](https://github.com/Kilo-Org/kilocode/commit/d89b1b6e16fb935c785f731faa37bdd79556ee7a) - Gate experimental agents on their declared skill, MCP, and VS Code extension requirements. VS Code shows requirement groups with Marketplace shortcuts, and the CLI stops before sending when requirements are unmet.

- [#11776](https://github.com/Kilo-Org/kilocode/pull/11776) [`2da40af`](https://github.com/Kilo-Org/kilocode/commit/2da40afed4169936074a59fdc315e6042d73bb6b) - Translate the Anaconda Desktop provider strings into all supported languages instead of falling back to English.

- [#11487](https://github.com/Kilo-Org/kilocode/pull/11487) [`f47c8c3`](https://github.com/Kilo-Org/kilocode/commit/f47c8c333a25157a334e4c17161a97e51f540291) Thanks [@Drixled](https://github.com/Drixled)! - Animate tool-call and reasoning details when expanding and collapsing.

- [#11724](https://github.com/Kilo-Org/kilocode/pull/11724) [`9394887`](https://github.com/Kilo-Org/kilocode/commit/9394887e1344eb1333ad2a60ec7c974a1cad8eec) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Open the model picker expanded by default, keep the preview pinned while hovering, separate Kilo Auto models into their own marked group with summary tooltips, and show backend-provided Auto Efficient model choices.

- [#11526](https://github.com/Kilo-Org/kilocode/pull/11526) [`579a787`](https://github.com/Kilo-Org/kilocode/commit/579a787047632ad15fc1ca90aabd7e1d1edd5a7c) - Run Windows PowerShell tool commands without `-EncodedCommand` to reduce antivirus false positives.

- [#11592](https://github.com/Kilo-Org/kilocode/pull/11592) [`dcd2ae3`](https://github.com/Kilo-Org/kilocode/commit/dcd2ae3adb46f5a813451d9165ee075c91124003) - Use the matching FIM model for chat autocomplete when Next Edit is selected.

- [#11639](https://github.com/Kilo-Org/kilocode/pull/11639) [`15da733`](https://github.com/Kilo-Org/kilocode/commit/15da733c70f9b53b81da2a114a0569773eb144cf) - Explain Marketplace item types, installation scopes, destination files, and MCP security before installation.

- [#11733](https://github.com/Kilo-Org/kilocode/pull/11733) [`be82a8e`](https://github.com/Kilo-Org/kilocode/commit/be82a8eaa560e60a608892a9f3b1c80252ba25b0) - Start the Agent Manager with the Sessions list collapsed while preserving each workspace's saved choice.

- [#11683](https://github.com/Kilo-Org/kilocode/pull/11683) [`2919d2b`](https://github.com/Kilo-Org/kilocode/commit/2919d2b9aec8b66ee74c2531f105596d8b77adfb) - Show experimental sandbox controls by default for non-Windows users.

- [#11602](https://github.com/Kilo-Org/kilocode/pull/11602) [`e7db09e`](https://github.com/Kilo-Org/kilocode/commit/e7db09ed84b4c2ebee5791fc0aab3034d82f65b1) - Improve autocomplete error messages to clarify BYOK and credits issues

  When autocomplete is paused due to a payment or auth error, the messages now explain all possible causes: no Kilo credits, API key (BYOK) quota exhausted, not signed in, or invalid/missing API key.

- [#11798](https://github.com/Kilo-Org/kilocode/pull/11798) [`1d798a1`](https://github.com/Kilo-Org/kilocode/commit/1d798a106f315dc3c1c4c78382eff7a6bd23343b) - Fix opening KiloClaw from the CLI and VS Code slash commands.

- [#11777](https://github.com/Kilo-Org/kilocode/pull/11777) [`ff427e5`](https://github.com/Kilo-Org/kilocode/commit/ff427e5fbfcd8f3bfeb0c6e84bab49b20836a780) - Keep @mentions highlighted on the correct text after slash commands expand.

- [#11672](https://github.com/Kilo-Org/kilocode/pull/11672) [`cbe29c6`](https://github.com/Kilo-Org/kilocode/commit/cbe29c64f7291175e32c71c0c72f4270ca616c23) - Preserve new-chat prompts, attachments, and scroll position when toggling sandbox, and keep sandbox status stable while switching sessions.

- [#11788](https://github.com/Kilo-Org/kilocode/pull/11788) [`4e7f0e7`](https://github.com/Kilo-Org/kilocode/commit/4e7f0e775c3c307a4ec52c6b2e6134ad69f0dace) Thanks [@johnnyeric](https://github.com/johnnyeric)! - Use the models sparkle icon for Auto models in the model selector.

- [#11645](https://github.com/Kilo-Org/kilocode/pull/11645) [`bd623cc`](https://github.com/Kilo-Org/kilocode/commit/bd623cceeee1b1db117da7470384936bab4a832f) - Show sandbox state changes as concise VS Code notifications.

- [#11774](https://github.com/Kilo-Org/kilocode/pull/11774) [`4549623`](https://github.com/Kilo-Org/kilocode/commit/4549623572d29f2f67979e32ca4e6f587727d5aa) - Open the model selector instantly, even with large model catalogs.

- [#11588](https://github.com/Kilo-Org/kilocode/pull/11588) [`14a389f`](https://github.com/Kilo-Org/kilocode/commit/14a389fea95c7d5f5e761a82f8d683dec747d75b) - Preserve unchanged codebase indexes when extension or VS Code updates interrupt an incremental scan.

- [#11573](https://github.com/Kilo-Org/kilocode/pull/11573) [`5dc511b`](https://github.com/Kilo-Org/kilocode/commit/5dc511b4e91939d998378bba2328d8223c015c30) - Keep attention sounds silent for permission requests handled by auto-approve.

- [#11696](https://github.com/Kilo-Org/kilocode/pull/11696) [`be3ae82`](https://github.com/Kilo-Org/kilocode/commit/be3ae82962bff96b7caff4cc66424bcef3f41e84) - Remember sandbox choices per session and start new sessions with the last selected sandbox state.

- [#11716](https://github.com/Kilo-Org/kilocode/pull/11716) [`acfcbca`](https://github.com/Kilo-Org/kilocode/commit/acfcbcace8072dab781d036c51fcda47f5849c30) - Support resetting read notifications from the VS Code extension settings.

- [#11822](https://github.com/Kilo-Org/kilocode/pull/11822) [`8cc33de`](https://github.com/Kilo-Org/kilocode/commit/8cc33def94e6960ed955edd988d245b45d1b0a5a) - Support sending inline review draft comments directly from the diff without first saving them as pending comments.

- [#11610](https://github.com/Kilo-Org/kilocode/pull/11610) [`d2dff88`](https://github.com/Kilo-Org/kilocode/commit/d2dff8844d1d93430514c0cd9809ddd9af7385d7) - Show full external directory paths in permission auto-approve rules.

- [#11556](https://github.com/Kilo-Org/kilocode/pull/11556) [`9b0c45c`](https://github.com/Kilo-Org/kilocode/commit/9b0c45ca382186a246e0f23ffe0c1c4efeaace24) - Show the concrete model reported for routed Kilo auto-model steps in CLI and VS Code session timelines, and break down TUI sidebar token usage, cache rate, and cost by model across subagent sessions.

- [#11679](https://github.com/Kilo-Org/kilocode/pull/11679) [`37d81bf`](https://github.com/Kilo-Org/kilocode/commit/37d81bf6b136f3eab1fba73a82838c432d316739) - Show filesystem and network restriction states in the sandbox tooltip.

- [#11557](https://github.com/Kilo-Org/kilocode/pull/11557) [`d086710`](https://github.com/Kilo-Org/kilocode/commit/d086710f85a625aaba620fad824a1b6f4d52e660) Thanks [@rakshith1928](https://github.com/rakshith1928)! - Sort slash-command dropdown results by relevance. Exact matches now appear first, followed by prefix matches, then substring matches.

- [#11628](https://github.com/Kilo-Org/kilocode/pull/11628) [`2638e06`](https://github.com/Kilo-Org/kilocode/commit/2638e06ffbeff598672b671837380ef282f9f34c) - Add session-local macOS sandbox controls, show the effective active state, and confirm toggles in the CLI and VS Code extension.

- [#11660](https://github.com/Kilo-Org/kilocode/pull/11660) [`6e390c1`](https://github.com/Kilo-Org/kilocode/commit/6e390c1d378564d02f78cc11b55b6ee9adf668b8) - Stop shipping the local-only `.cli-version` build marker in packaged VSIX installs, which previously made production installs detect as local builds and inject a dev-only bwrap fallback.

- [#11746](https://github.com/Kilo-Org/kilocode/pull/11746) [`5080c78`](https://github.com/Kilo-Org/kilocode/commit/5080c78e628b2598f01f9c5d9685d767340dec29) - Include session-tree IDs in model usage API responses and show full task token usage with a provider-grouped model breakdown in the VS Code session header.

- Updated dependencies [[`7b2063f`](https://github.com/Kilo-Org/kilocode/commit/7b2063f35440fd65e9ec2d38fd656da960ff48b6), [`123a939`](https://github.com/Kilo-Org/kilocode/commit/123a9395d2ec645c3dc247170188f42bbf7c9333), [`dcd2ae3`](https://github.com/Kilo-Org/kilocode/commit/dcd2ae3adb46f5a813451d9165ee075c91124003), [`1d798a1`](https://github.com/Kilo-Org/kilocode/commit/1d798a106f315dc3c1c4c78382eff7a6bd23343b), [`be1f77d`](https://github.com/Kilo-Org/kilocode/commit/be1f77d4320603efbbfab0587a1dc0d9ec911001), [`be3ae82`](https://github.com/Kilo-Org/kilocode/commit/be3ae82962bff96b7caff4cc66424bcef3f41e84), [`9b0c45c`](https://github.com/Kilo-Org/kilocode/commit/9b0c45ca382186a246e0f23ffe0c1c4efeaace24), [`2638e06`](https://github.com/Kilo-Org/kilocode/commit/2638e06ffbeff598672b671837380ef282f9f34c), [`5080c78`](https://github.com/Kilo-Org/kilocode/commit/5080c78e628b2598f01f9c5d9685d767340dec29)]:
  - @kilocode/sdk@7.4.0
  - @kilocode/kilo-gateway@7.3.55
  - @kilocode/kilo-ui@7.3.55
  - @kilocode/plugin@7.3.55
  - @opencode-ai/ui@7.3.55
  - @kilocode/kilo-indexing@7.3.55

## v7.3.54 — 2026-06-23

No notable changes

## v7.3.53 — 2026-06-22

## 7.3.53

### Patch Changes

- [#11533](https://github.com/Kilo-Org/kilocode/pull/11533) [`15f42d4`](https://github.com/Kilo-Org/kilocode/commit/15f42d4bec51bbb127636738275f36fdc07e7b33) - Restore bounded text-file reads and keep zero-limit pagination and Unicode truncation from producing unusable tool output.

- Updated dependencies [[`6c55c28`](https://github.com/Kilo-Org/kilocode/commit/6c55c28ec345a6d90d2d7a4e345abf962f208e29)]:
  - @kilocode/kilo-gateway@7.3.53
  - @kilocode/kilo-indexing@7.3.53
  - @kilocode/kilo-ui@7.3.53
  - @opencode-ai/ui@7.3.53

## 7.3.52

### Patch Changes

- [#11450](https://github.com/Kilo-Org/kilocode/pull/11450) [`cc924a6`](https://github.com/Kilo-Org/kilocode/commit/cc924a67d9b190ccffebaefa983213e173db54d8) - Changes from opencode v1.15.9 to v1.15.13 upstream:
  - Core Improvements: Added `headerTimeout` config for provider requests, with a 10s default for default OpenAI setups.
  - Core Improvements: Experimental background agents now push updates without polling.
  - Core Improvements: You can now set only `modalities.input` or `modalities.output` in config. (@robposch)
  - Core Improvements: Remote-backed projects now resolve a stable project identity.
  - Core Improvements: ACP integrations can now send prompts, slash commands, and usage updates through `acp-next`
  - Core Improvements: Added WebSocket transport for OpenAI responses on supported channels (set KILO_EXPERIMENTAL_WEBSOCKETS=true)
  - Core Improvements: Sessions can now store custom metadata through the API and SDK. (@shantur)
  - Core Improvements: Config now loads from the opened location upward, so directory-specific settings and provider policies apply more predictably.
  - Core Bugfixes: Dynamically added MCP servers now disconnect cleanly when removed.
  - Core Bugfixes: DigitalOcean inference now uses your OAuth token directly instead of creating a MAK. (@Spherrrical)
  - Core Bugfixes: Config loading now falls back cleanly when user info is unavailable.
  - Core Bugfixes: Fixed Google tool calling after the upstream tool ID regression.
  - Core Bugfixes: Experimental flags can now override the umbrella experimental flag.
  - Core Bugfixes: Resumed sessions no longer continue orphaned interrupted tools. (@edevil)
  - Core Bugfixes: OpenAI reasoning summaries now render as separate blocks.
  - Core Bugfixes: Updated Google Vertex support for reasoning signatures.
  - Core Bugfixes: The shell tool now advertises your configured timeout to the model.
  - Core Bugfixes: Enabled adaptive reasoning controls for Anthropic Opus 4.7+ models
  - Core Bugfixes: Allowed colons in passwords (@neriousy)
  - Core Bugfixes: Sped up warm `acp-next` model and config switches
  - Core Bugfixes: Improved first-session `acp-next` startup time
  - Core Bugfixes: Kept OpenAI WebSocket response timeouts active
  - Core Bugfixes: Retried failed OpenAI WebSocket streams before falling back
  - Core Bugfixes: Handled `acp-next` permission prompts correctly
  - Core Bugfixes: Used the persisted session directory for existing-session requests
  - Core Bugfixes: Forwarded remote workspace request bodies correctly
  - Core Bugfixes: Supported custom base URLs for OpenAI WebSocket responses (@Tarquinen)
  - Core Bugfixes: Gateway Anthropic Opus 4.7+ adaptive reasoning now keeps summarized thinking instead of returning empty thinking blocks.
  - TUI Improvements: Made the prompt resize with terminal width and added prompt size config. (@bjschafer)
  - TUI Improvements: Added a workspace management dialog
  - TUI Bugfixes: Accelerated diff viewer scrolling.
  - TUI Bugfixes: External editors now open from the worktree directory when available.
  - TUI Bugfixes: Kept session navigation working while prompt modes are open
  - TUI Bugfixes: Restored the thinking spinner
  - TUI Bugfixes: Surfaced subagent retry status
  - TUI Bugfixes: Fixed opening editors from non-Git project paths (@OpeOginni)
  - TUI Bugfixes: Wrapped inline tool rows now stay aligned, and failed inline tools can expand their error details in place.
  - Extensions Improvements: Added a `dispose` hook for plugins.
  - Extensions Bugfixes: Fixed Codex plugin requests to send the expected session ID header.

## v7.3.50 — 2026-06-19

## 7.3.50

### Minor Changes

- [#11421](https://github.com/Kilo-Org/kilocode/pull/11421) [`ccec216`](https://github.com/Kilo-Org/kilocode/commit/ccec2162383a6f378ed5e62d630720607d185209) - Show a BYOK badge for Kilo Gateway models that can use an enabled personal or organization provider key.

### Patch Changes

- [#11418](https://github.com/Kilo-Org/kilocode/pull/11418) [`8b32375`](https://github.com/Kilo-Org/kilocode/commit/8b32375fe67d96f29fa88933d711699e3720ebf4) - Describe custom providers independently of their selected API protocol.

- [#11455](https://github.com/Kilo-Org/kilocode/pull/11455) [`4d09333`](https://github.com/Kilo-Org/kilocode/commit/4d0933371ca9be212cdd0357605e250ebacf7e1b) - Hide reverted provider errors so Redo controls remain visible after rewinding a session.

- [#11423](https://github.com/Kilo-Org/kilocode/pull/11423) [`aa17a8a`](https://github.com/Kilo-Org/kilocode/commit/aa17a8a4191a04604b3a402e75d5c7e7b8149da4) - Keep changed identifiers intact when highlighting edits within diff lines.

- [#11453](https://github.com/Kilo-Org/kilocode/pull/11453) [`f7e68d1`](https://github.com/Kilo-Org/kilocode/commit/f7e68d19d9d8b23b087d3c7c92d487abced8d7ec) - Limit completion sounds to parent agent sessions.

- [#10940](https://github.com/Kilo-Org/kilocode/pull/10940) [`4de8293`](https://github.com/Kilo-Org/kilocode/commit/4de82931ed3d5315e6717827a9b53b11c1162e7f) Thanks [@mjnaderi](https://github.com/mjnaderi)! - Avoid failing Agent Manager startup when another extension already registered VS Code panel commands.

- [#11464](https://github.com/Kilo-Org/kilocode/pull/11464) [`c829642`](https://github.com/Kilo-Org/kilocode/commit/c8296420544a68e730fa4307e1a045210d79fcad) - Keep chat output updating after reverting and resubmitting a prompt.

- [#11433](https://github.com/Kilo-Org/kilocode/pull/11433) [`867beac`](https://github.com/Kilo-Org/kilocode/commit/867beac3a19881861536d6c22a9efcb5ae379cc4) - Prevent concurrent subagent updates from blanking the Agent Manager webview.

- [#11463](https://github.com/Kilo-Org/kilocode/pull/11463) [`909ec73`](https://github.com/Kilo-Org/kilocode/commit/909ec73b9c852de6899c20f473b6da14d6c428b5) - Speed up Agent Manager worktree hover cards so pull request details appear and dismiss more quickly.

- [#11451](https://github.com/Kilo-Org/kilocode/pull/11451) [`732fbc3`](https://github.com/Kilo-Org/kilocode/commit/732fbc30dc3ee969caabc96282ad1a0ff5c652ce) - Widen the chat readable lane from 88ch to 98ch so conversations, tools, and diffs can use more editor space.

- Updated dependencies [[`ccec216`](https://github.com/Kilo-Org/kilocode/commit/ccec2162383a6f378ed5e62d630720607d185209), [`2c9e72c`](https://github.com/Kilo-Org/kilocode/commit/2c9e72c14a87387199fd42546746bbea30aa1570), [`f7e68d1`](https://github.com/Kilo-Org/kilocode/commit/f7e68d19d9d8b23b087d3c7c92d487abced8d7ec)]:
  - @kilocode/kilo-gateway@7.4.0
  - @kilocode/sdk@7.3.50
  - @kilocode/kilo-indexing@7.3.50
  - @kilocode/kilo-ui@7.3.50
  - @kilocode/plugin@7.3.50
  - @opencode-ai/ui@7.3.50

## 7.3.49

### Minor Changes

- [#11303](https://github.com/Kilo-Org/kilocode/pull/11303) [`6faa3f1`](https://github.com/Kilo-Org/kilocode/commit/6faa3f14b619144a1353f169a0a2855dcbf69bbb) - Add an "Import Sessions from Roo Code" button in the About settings tab that discovers and imports conversation history from an existing Roo Code installation, reusing the existing migration wizard.

## 7.3.48

### Minor Changes

- [#11239](https://github.com/Kilo-Org/kilocode/pull/11239) [`a5b87fa`](https://github.com/Kilo-Org/kilocode/commit/a5b87fafa37f223877d07cfba2882b298a25f742) - Support multiple provider APIs, adaptive thinking, split reasoning, and output effort variants for custom providers.

- [#11331](https://github.com/Kilo-Org/kilocode/pull/11331) [`c5bd1b3`](https://github.com/Kilo-Org/kilocode/commit/c5bd1b3e0959e019b015ca73c8db71726a5ffba3) - Support closing other Agent Manager tabs from the tab context menu.

- [#11098](https://github.com/Kilo-Org/kilocode/pull/11098) [`b0ec91c`](https://github.com/Kilo-Org/kilocode/commit/b0ec91cef439633eef955d44747e03bb5e15ee4f) - Offer opt-in attention sounds when sessions finish, error, or need input across the sidebar, editor tabs, and Agent Manager.

- [#11367](https://github.com/Kilo-Org/kilocode/pull/11367) [`1933cf7`](https://github.com/Kilo-Org/kilocode/commit/1933cf7cab911e295b99cb0ecf8821312e47c23e) - Open the selected Agent Manager worktree's pull request with Cmd/Ctrl+Shift+R.

- [#11308](https://github.com/Kilo-Org/kilocode/pull/11308) [`d56bfdd`](https://github.com/Kilo-Org/kilocode/commit/d56bfdd9aa8c3112550be11f4761c66918283dde) - Keep conversations readable across the sidebar, editor tabs, and Agent Manager by aligning messages, tool output, and the composer in one centered lane.

- [#11258](https://github.com/Kilo-Org/kilocode/pull/11258) [`056e069`](https://github.com/Kilo-Org/kilocode/commit/056e06911b0bf4232021e8a56676ae9b3f888bb0) - Render image changes in diff viewers and open images with VS Code's image preview.

- [#11294](https://github.com/Kilo-Org/kilocode/pull/11294) [`c961f66`](https://github.com/Kilo-Org/kilocode/commit/c961f66bd4f38c922640d721d1ebdbcc9f97c0a6) - Search and switch between local sessions, worktrees, and their sessions from the Agent Manager sidebar.

- [#11317](https://github.com/Kilo-Org/kilocode/pull/11317) [`a2ccf57`](https://github.com/Kilo-Org/kilocode/commit/a2ccf574a7b3f1414b9e9d785265dc9c4d16b44e) - Support VS Code switch links that select a Kilo model, agent, or both.

### Patch Changes

- [#11242](https://github.com/Kilo-Org/kilocode/pull/11242) [`9211000`](https://github.com/Kilo-Org/kilocode/commit/9211000aadd909f0d46746604c3e963966a59660) - Support unauthenticated OpenAI-compatible endpoints for codebase indexing without requiring a placeholder API key.

- [#11249](https://github.com/Kilo-Org/kilocode/pull/11249) [`2c30dc7`](https://github.com/Kilo-Org/kilocode/commit/2c30dc75ce18c018f603a30d1c9e3c70fe8fc036) - Show a clear, retryable provider rate-limit error instead of raw response JSON in chat.

- [#11080](https://github.com/Kilo-Org/kilocode/pull/11080) [`e335f97`](https://github.com/Kilo-Org/kilocode/commit/e335f97856c2a13ab75c2cb6e24f7df2626d41a0) Thanks [@Githubguy132010](https://github.com/Githubguy132010)! - Support opening code edit and diff blocks expanded by default in the VS Code chat.

- [#11297](https://github.com/Kilo-Org/kilocode/pull/11297) [`06da363`](https://github.com/Kilo-Org/kilocode/commit/06da3635993c17053d33cfd64d5002f3868eba11) - Remove stray rounded corners between files in the Changes diff viewer.

- [#11352](https://github.com/Kilo-Org/kilocode/pull/11352) [`5dd5c9a`](https://github.com/Kilo-Org/kilocode/commit/5dd5c9a0de5d92b1646c647e3efbeeee29937721) - Improve screen reader navigation and provider group controls in the model picker.

- [#10788](https://github.com/Kilo-Org/kilocode/pull/10788) [`941007b`](https://github.com/Kilo-Org/kilocode/commit/941007b68dfa9500ad604620ae861accf2a74643) Thanks [@noobezlol](https://github.com/noobezlol)! - Handle string-form permission values when migrating bash permissions.

- [#11158](https://github.com/Kilo-Org/kilocode/pull/11158) [`8ff8371`](https://github.com/Kilo-Org/kilocode/commit/8ff83711766ff6b18ea23d1990d6fedd8e79c5ae) - Add a shared model setting to hide Kilo Gateway models that may train on your prompts across Kilo clients.

- [#11349](https://github.com/Kilo-Org/kilocode/pull/11349) [`a5395a3`](https://github.com/Kilo-Org/kilocode/commit/a5395a35210b92d658b8efacea0fb9d25ddb27d0) - Highlight the exact changed characters within modified diff lines.

- [#10261](https://github.com/Kilo-Org/kilocode/pull/10261) [`8efc296`](https://github.com/Kilo-Org/kilocode/commit/8efc296ae54292183579e004eae52813a96abe0d) Thanks [@singhvishalkr](https://github.com/singhvishalkr)! - Ignore Enter while IME composition is active (including Windows virtual-key 229) so composed text is not accidentally submitted from chat and sidebar inputs.

- [#11236](https://github.com/Kilo-Org/kilocode/pull/11236) [`1511d13`](https://github.com/Kilo-Org/kilocode/commit/1511d13b3f7f20001d2111f14bdfae7155372cf8) Thanks [@kapelame](https://github.com/kapelame)! - Add an instant/thinking reasoning toggle for MiniMax M-series models, matching the existing glm/kimi/qwen behavior.

- [#11358](https://github.com/Kilo-Org/kilocode/pull/11358) [`0920b3f`](https://github.com/Kilo-Org/kilocode/commit/0920b3ffa8ec5f7b327681f446af1616d6d652a2) - Clean up incomplete worktrees when moving a session fails to transfer its Git changes.

- [#11348](https://github.com/Kilo-Org/kilocode/pull/11348) [`d190725`](https://github.com/Kilo-Org/kilocode/commit/d190725c3cfd30741aa0e19dac3ee7d626654bd1) - Announce every Settings tab by name to screen readers in compact sidebars.

- [#11257](https://github.com/Kilo-Org/kilocode/pull/11257) [`f42789d`](https://github.com/Kilo-Org/kilocode/commit/f42789d0ef5585aad4080bdc5c96856675cd9503) - Changes from opencode v1.14.51 to v1.15.4 upstream:
  - Core Improvements: Clarified how to recover when the npm package is installed without its native binary.
  - Core Improvements: Reduced unnecessary prompting around shell, task, and todo flows.
  - Core Bugfixes: Ignored invalid exports in custom tool modules instead of failing tool loading.
  - Core Bugfixes: Ignored project instruction lookup errors so sessions keep loading when project instruction discovery fails.
  - Core Bugfixes: Fixed versioned event projector lookups so event replay uses the right handlers.
  - Core Bugfixes: Avoid duplicate consecutive entries in prompt history.
  - Core Bugfixes: Show full config validation errors during TUI startup instead of a generic failure.
  - Core Bugfixes: Fixed npm installs so the CLI can recover and fetch the right native binary on more setups.
  - Core Bugfixes: Fixed multiline `@` mentions in prompts.
  - Core Bugfixes: Preserved custom tool metadata from Zod schemas.
  - Core Bugfixes: Preserved custom tool argument descriptions in generated schemas.
  - Core Bugfixes: Fixed file watching in repos where `.git` is a symlink. (@kagura-agent)
  - Core Bugfixes: Fixed sync events not reaching project-scoped subscribers in injected instances.
  - Core Bugfixes: Reduced wasted work when reading very large files after output truncation.
  - Core Bugfixes: Fixed project-scoped bus events so file watcher and update notifications reach the right instance.
  - Core Bugfixes: Fixed custom LSP servers not sending refresh events after they initialize.
  - Core Bugfixes: Hid background subagent task instructions unless experimental background mode is enabled.
  - TUI Improvements: Added a collapsed thinking view that can be expanded inline.
  - TUI Improvements: Added pinned sessions with quick-switch slots in the session picker.
  - TUI Improvements: Newly pinned sessions now stay at the end of the pinned list instead of jumping to the top.
  - TUI Improvements: Made Markdown H1 headings easier to distinguish.
  - TUI Bugfixes: Fixed thinking mode defaults so reasoning starts collapsed consistently.
  - TUI Bugfixes: Limited session quick-switching to pinned sessions.
  - TUI Bugfixes: Fixed Markdown table rendering in chat output.
  - TUI Bugfixes: Fixed `kilo run --agent` resolving project-local agents.
  - TUI Bugfixes: Fixed async commands losing the active instance context, which could break agent generation and GitHub-driven runs.

- [#11356](https://github.com/Kilo-Org/kilocode/pull/11356) [`326ff35`](https://github.com/Kilo-Org/kilocode/commit/326ff351460342f93b0bf97f0beb6383357c5d05) - Changes from opencode v1.15.4 to v1.15.9 upstream:
  - Core Improvements: Preview the native OpenAI runtime path behind an experimental flag
  - Core Improvements: Add `--replay` and `--replay-limit` to show recent history when resuming interactive runs
  - Core Improvements: Added a diff viewer in the TUI for reviewing changes.
  - Core Improvements: Collapsed single-child directories in the diff viewer file tree.
  - Core Improvements: Added shell mode to the `run` prompt.
  - Core Improvements: Replaced subagent tabs with an on-demand picker in `run`.
  - Core Improvements: Plugin file load errors no longer break the rest of plugin loading.
  - Core Improvements: Anthropic API-key models now use the native runtime.
  - Core Improvements: The v2 HTTP API now exposes structured public error schemas.
  - Core Improvements: Added Grok OAuth sign-in, including device-code login. (@Jaaneek)
  - Core Improvements: Redesigned the diff viewer with a file tree and refreshed layout.
  - Core Bugfixes: Fix plugin tools using `ask` so tool calls complete correctly
  - Core Bugfixes: Reduce missed `/event` updates caused by a subscription race
  - Core Bugfixes: Sort the v2 session list by most recently updated
  - Core Bugfixes: Zed editor context now only activates inside Zed terminals.
  - Core Bugfixes: Agent and command names now resolve correctly from relative config paths.
  - Core Bugfixes: Invalid `KILO_PERMISSION` JSON no longer crashes startup.
  - Core Bugfixes: Plugin tools with missing `args` no longer break tool loading.
  - Core Bugfixes: Restored legacy `PgUp` and `PgDn` TUI keybind aliases.
  - Core Bugfixes: Native runtime now prefers the console provider token for OpenCode models.
  - Core Bugfixes: V2 session APIs now return safe `UnknownError` responses with log reference IDs when stored messages are corrupt.
  - Core Bugfixes: Generic API 500s no longer expose config details from server errors.
  - Core Bugfixes: Unknown API errors now include reference IDs so you can match responses to server logs.
  - Core Bugfixes: V2 session APIs now return `503 ServiceUnavailableError` for mutations that are not available yet.
  - Core Bugfixes: V2 session APIs now return `SessionNotFoundError` for missing sessions.
  - Core Bugfixes: Deduped concurrent Codex OAuth refreshes to avoid repeated refresh failures. (@cooper-oai)
  - Core Bugfixes: Restored native OpenAI OAuth requests.
  - Core Bugfixes: Tool schema failures now surface as friendly tool errors.
  - Core Bugfixes: Added PDF attachment support for Grok.
  - Core Bugfixes: Restored OpenAI reasoning streams.
  - Core Bugfixes: Return to the previous screen when closing the diff viewer.
  - Core Bugfixes: Show clearer errors when a default model is invalid or unavailable.
  - Core Bugfixes: Surface missing PTY session errors instead of failing generically.
  - Core Bugfixes: Improve diff viewer empty states and context handling.
  - Core Bugfixes: Show clearer errors when a skill invocation fails as expected.
  - Core Bugfixes: Show clearer errors when an installation upgrade fails.
  - Core Bugfixes: Show clearer project not found errors from the HTTP API.
  - Core Bugfixes: Return PTY error bodies from the HTTP API.
  - Core Bugfixes: Enable the diff viewer by default.
  - Core Bugfixes: Return MCP server not found errors from the HTTP API.
  - Core Bugfixes: Let MCP OAuth configs set a callback port and include configured scopes in client metadata. (@sebin)
  - Core Bugfixes: Use working Vertex Anthropic endpoints for `us` and `eu` multi-region setups. (@JPFrancoia)
  - Core Bugfixes: Return session busy error bodies from the HTTP API.
  - Core Bugfixes: Preserve native reasoning continuation metadata across turns.
  - TUI Improvements: Refresh the prompt layout after pasting content
  - TUI Improvements: The diff viewer now focuses the first file automatically.
  - TUI Improvements: Copy the current worktree path from the command palette.
  - TUI Bugfixes: Keep file references scoped to the current workspace
  - TUI Bugfixes: Preserve pasted prompt content when copying
  - TUI Bugfixes: Collapse very long tool output lines to keep the layout readable
  - TUI Bugfixes: Use a higher-contrast paste summary badge color in some themes (@kagura-agent)
  - TUI Bugfixes: Imported sessions now refresh their directory and relative path fields correctly. (@OpeOginni)
  - TUI Bugfixes: Collapsed thinking labels now use clearer punctuation.
  - TUI Bugfixes: New sessions now default to the local project.
  - TUI Bugfixes: Single-select question checkmarks no longer run into option labels.
  - TUI Bugfixes: Refine diff viewer keyboard shortcuts.
  - TUI Bugfixes: Restore question prompt key handling.
  - TUI Bugfixes: Keep the spinner color aligned with the active agent. (@OpeOginni)

- [#11146](https://github.com/Kilo-Org/kilocode/pull/11146) [`481f836`](https://github.com/Kilo-Org/kilocode/commit/481f8361cfc5ea4be929d9afd63d996ed51131af) Thanks [@Drixled](https://github.com/Drixled)! - Polish chat tool-call previews for shell, search, and background-process output.

- [#11373](https://github.com/Kilo-Org/kilocode/pull/11373) [`f21a34a`](https://github.com/Kilo-Org/kilocode/commit/f21a34a1e63107da085eb9e57172ca6025d2dbe0) - Skip attention sounds when a session is manually interrupted.

- [#11351](https://github.com/Kilo-Org/kilocode/pull/11351) [`94bdfb9`](https://github.com/Kilo-Org/kilocode/commit/94bdfb9f8e4d88205f876e7936e10908c68a8b44) - Enable remote control from Agent Manager without disrupting concurrent sidebar sessions, and include all open Agent Manager sessions.

- [#11318](https://github.com/Kilo-Org/kilocode/pull/11318) [`7f18708`](https://github.com/Kilo-Org/kilocode/commit/7f18708308ad47fd14f876ed4a25c4322bd29751) - Remove the divider between agent conversations and the prompt input across extension chat views.

- [#11295](https://github.com/Kilo-Org/kilocode/pull/11295) [`2fa0890`](https://github.com/Kilo-Org/kilocode/commit/2fa0890928f7dd060125ad4f4083b8bd2bf3e69b) - Restore speech input when profile details are unavailable, move transcription model selection to the Models tab, and default transcription to Whisper Large V3 Turbo.

- [#11221](https://github.com/Kilo-Org/kilocode/pull/11221) [`9b73bf9`](https://github.com/Kilo-Org/kilocode/commit/9b73bf91e4303249f30517d4cacfa8287680a82c) - Restore popular provider suggestions in the VS Code provider settings panel when provider metadata is unavailable.

- [#11410](https://github.com/Kilo-Org/kilocode/pull/11410) [`344a6a5`](https://github.com/Kilo-Org/kilocode/commit/344a6a5f0f8377d8ab38792e6141d08947a7dc19) - Keep server controls and events connected to active sessions and subagents.

- [#11221](https://github.com/Kilo-Org/kilocode/pull/11221) [`987da27`](https://github.com/Kilo-Org/kilocode/commit/987da2728731e1da1c974996b5bcddafe745cea7) - Show shared provider descriptions and provider icons in JetBrains and VS Code provider settings.

- [#11357](https://github.com/Kilo-Org/kilocode/pull/11357) [`14cb3df`](https://github.com/Kilo-Org/kilocode/commit/14cb3dfd048ba4217bcd1f26ad7b76ce9a2a2e7f) - Show line numbers in edit approval diffs, including compact sidebar views.

- [#11402](https://github.com/Kilo-Org/kilocode/pull/11402) [`146c4f4`](https://github.com/Kilo-Org/kilocode/commit/146c4f4396fd45c6bfc567f9b3ee1de46e26a3b6) - Prevent large highlighted shell outputs from blanking the VS Code webview when expanded.

- [#11404](https://github.com/Kilo-Org/kilocode/pull/11404) [`f35d9c5`](https://github.com/Kilo-Org/kilocode/commit/f35d9c5fa3017dcc35d260b5669daf87411419f5) - Keep the Stop button working when an active session moves between the workspace and an Agent Manager worktree.

- [#11366](https://github.com/Kilo-Org/kilocode/pull/11366) [`4739954`](https://github.com/Kilo-Org/kilocode/commit/47399547e1d60f016542f6a83fbf91a2bce91692) - Widen the sidebar chat readable lane from 78ch to 88ch so tools and content use a little more screen space.

- Updated dependencies [[`9211000`](https://github.com/Kilo-Org/kilocode/commit/9211000aadd909f0d46746604c3e963966a59660), [`2fa0890`](https://github.com/Kilo-Org/kilocode/commit/2fa0890928f7dd060125ad4f4083b8bd2bf3e69b), [`973d02c`](https://github.com/Kilo-Org/kilocode/commit/973d02cfd15b3bf3eefefe92e7fb61059eba26f7), [`66af690`](https://github.com/Kilo-Org/kilocode/commit/66af6907005b99bb39a0869b35dfe1ec180cc0b5)]:
  - @kilocode/kilo-indexing@7.4.0
  - @kilocode/sdk@7.4.0
  - @kilocode/kilo-ui@7.3.47
  - @kilocode/plugin@7.3.47
  - @opencode-ai/ui@7.3.47
  - @kilocode/kilo-gateway@7.3.47

## v7.3.46 — 2026-06-15

### Patch Changes

- [#11184](https://github.com/Kilo-Org/kilocode/pull/11184) [`adf03a9`](https://github.com/Kilo-Org/kilocode/commit/adf03a98245e8877c580cb1f77a7e0ea4f0af61d) - Support model-specific reasoning overrides for task subagents, including custom subagents with their own model and variant settings.

- [#11238](https://github.com/Kilo-Org/kilocode/pull/11238) [`fb2db2e`](https://github.com/Kilo-Org/kilocode/commit/fb2db2e0182b637d92d3158da9dbea953974cf71) - Allow reasoning to be removed from custom provider models after it has been enabled.

- [#11232](https://github.com/Kilo-Org/kilocode/pull/11232) [`f326be4`](https://github.com/Kilo-Org/kilocode/commit/f326be4b6c9d5af9d944c8e5e7f9c524c173052f) - Clarify potential loop permission prompts and auto-approval rules with localized tool names.

- [#11183](https://github.com/Kilo-Org/kilocode/pull/11183) [`1fd0960`](https://github.com/Kilo-Org/kilocode/commit/1fd0960cbcc82cb78a17c62332c08c5a7ba7d7c4) - Restore reverted sessions on the first Redo click.

- [#11169](https://github.com/Kilo-Org/kilocode/pull/11169) [`e2939c7`](https://github.com/Kilo-Org/kilocode/commit/e2939c7557a08e2377c2dbbc0433f4817f4a121f) - Route question responses to the worktree where the question was created.

- [#11240](https://github.com/Kilo-Org/kilocode/pull/11240) [`f820e57`](https://github.com/Kilo-Org/kilocode/commit/f820e57bab6c1ddd26f73964160bee7134488b96) - Prevent skill removal from recursively deleting working directories.

## v7.3.45 — 2026-06-12

### Minor Changes

- [#9750](https://github.com/Kilo-Org/kilocode/pull/9750) [`57f2e79`](https://github.com/Kilo-Org/kilocode/commit/57f2e794ca2301108dd01c73f43d0171c00756c6) - Support choosing an agent autonomy preset during VS Code onboarding.

- [#10827](https://github.com/Kilo-Org/kilocode/pull/10827) [`235e769`](https://github.com/Kilo-Org/kilocode/commit/235e769fb359531da4716999ef5feac839affdcc) - Support selecting Kilo Gateway catalog models from VS Code deep links.

### Patch Changes

- [#11152](https://github.com/Kilo-Org/kilocode/pull/11152) [`b23d3df`](https://github.com/Kilo-Org/kilocode/commit/b23d3dfd756461ae02e2ed2872aded09d65dc1af) - Allow Escape to stop Agent Manager prompts while their sessions are still starting.

- [#11173](https://github.com/Kilo-Org/kilocode/pull/11173) [`555dc23`](https://github.com/Kilo-Org/kilocode/commit/555dc2359373774a68e546b1dbe58d9d942d453f) - Show submitted review comments as interactive message cards instead of raw markdown.

- [#11175](https://github.com/Kilo-Org/kilocode/pull/11175) [`fb62e61`](https://github.com/Kilo-Org/kilocode/commit/fb62e61caf1a4a14ec8db30648e9f008e70604b3) - Hide turn outcome warnings caused only by unfinished to-dos.

## v7.3.41 — 2026-06-09

### Minor Changes

- [#10879](https://github.com/Kilo-Org/kilocode/pull/10879) [`b0a4f03`](https://github.com/Kilo-Org/kilocode/commit/b0a4f0391106a837b78200e6de52621a6872b890) - Show Terminal Bench completion scores and per-attempt costs in supported model details.

- [#10948](https://github.com/Kilo-Org/kilocode/pull/10948) [`6ee090b`](https://github.com/Kilo-Org/kilocode/commit/6ee090b5a404924f00c1f4771b09c1f4a1e352ca) - Restore cloud session filesystem changes from synced session diffs when importing sessions, including inherited changes across imported session forks.

### Patch Changes

- [#10094](https://github.com/Kilo-Org/kilocode/pull/10094) [`7ac7c1e`](https://github.com/Kilo-Org/kilocode/commit/7ac7c1e2832235e418eb7d27f4defdb6a3d139c6) Thanks [@IamCoder18](https://github.com/IamCoder18)! - Fix agent-manager model sync on config change

- [#10999](https://github.com/Kilo-Org/kilocode/pull/10999) [`ad93990`](https://github.com/Kilo-Org/kilocode/commit/ad93990ca9c84215bd71dee9febe76eebf07f1b5) - Show a pointer cursor for clickable controls and links in Kilo webviews.

- [#11038](https://github.com/Kilo-Org/kilocode/pull/11038) [`70f9441`](https://github.com/Kilo-Org/kilocode/commit/70f9441b50568d2f3330b81b316f5907f4f797e0) - Speed up long streamed responses by preserving completed Markdown blocks and updating only the active tail.

- [#11033](https://github.com/Kilo-Org/kilocode/pull/11033) [`10520d0`](https://github.com/Kilo-Org/kilocode/commit/10520d04e19a8b85072bdc25ff8d3dd51e5c7629) - Keep Agent Manager streaming responsive when multiple sessions run concurrently.

- [#11039](https://github.com/Kilo-Org/kilocode/pull/11039) [`422bc8a`](https://github.com/Kilo-Org/kilocode/commit/422bc8aca87794858ddd3c0b5e0081def0033758) - Remove the obsolete speech-to-text enabled setting while preserving provider-based availability and model selection.

- [#10992](https://github.com/Kilo-Org/kilocode/pull/10992) [`2d7c49d`](https://github.com/Kilo-Org/kilocode/commit/2d7c49d2a8d8fe32f80eab732774defed55da27f) - Rename Mercury autocomplete model labels to distinguish FIM and Next Edit modes.

- [#10787](https://github.com/Kilo-Org/kilocode/pull/10787) [`c6679ea`](https://github.com/Kilo-Org/kilocode/commit/c6679eaec5112e0355f81c140901171df64481a3) - Route Agent Manager permission approvals to the worktree that created the request.

- Updated dependencies [[`ad93990`](https://github.com/Kilo-Org/kilocode/commit/ad93990ca9c84215bd71dee9febe76eebf07f1b5), [`b0a4f03`](https://github.com/Kilo-Org/kilocode/commit/b0a4f0391106a837b78200e6de52621a6872b890)]:
  - @kilocode/kilo-ui@7.3.41
  - @kilocode/kilo-gateway@7.4.0
  - @kilocode/kilo-indexing@7.3.41

## v7.3.40 — 2026-06-06

No notable changes

## v7.3.33 — 2026-06-05

### Patch Changes

- [#10935](https://github.com/Kilo-Org/kilocode/pull/10935) [`6cab5f1`](https://github.com/Kilo-Org/kilocode/commit/6cab5f18e76b5ab0f738c2e20e93f12f3679b5dc) - Prevent the macOS Apple Silicon CLI from failing to start because of malformed bundled exports.

## v7.3.32 — 2026-06-05

No notable changes

## v7.3.31 — 2026-06-04

No notable changes

## v7.3.21 — 2026-06-02

No notable changes

## v7.3.16 — 2026-05-28

### Patch Changes

- [#10637](https://github.com/Kilo-Org/kilocode/pull/10637) [`7d8ec09`](https://github.com/Kilo-Org/kilocode/commit/7d8ec095c0d7d05b4c3f91149b873f9944716b23) - Show DeepSeek in the Popular Providers list instead of GitHub Copilot.

- [#10599](https://github.com/Kilo-Org/kilocode/pull/10599) [`46213dc`](https://github.com/Kilo-Org/kilocode/commit/46213dcebda653c1575b67ef93fc8aab065a9db7) Thanks [@Drixled](https://github.com/Drixled)! - Improve chat error styling in the VS Code extension.

- Updated dependencies [[`46213dc`](https://github.com/Kilo-Org/kilocode/commit/46213dcebda653c1575b67ef93fc8aab065a9db7)]:
  - @kilocode/kilo-ui@7.3.15

## v7.3.15 — 2026-05-28

### Patch Changes

- [#10637](https://github.com/Kilo-Org/kilocode/pull/10637) [`7d8ec09`](https://github.com/Kilo-Org/kilocode/commit/7d8ec095c0d7d05b4c3f91149b873f9944716b23) - Show DeepSeek in the Popular Providers list instead of GitHub Copilot.

- [#10599](https://github.com/Kilo-Org/kilocode/pull/10599) [`46213dc`](https://github.com/Kilo-Org/kilocode/commit/46213dcebda653c1575b67ef93fc8aab065a9db7) Thanks [@Drixled](https://github.com/Drixled)! - Improve chat error styling in the VS Code extension.

- Updated dependencies [[`46213dc`](https://github.com/Kilo-Org/kilocode/commit/46213dcebda653c1575b67ef93fc8aab065a9db7)]:
  - @kilocode/kilo-ui@7.3.15

## v7.3.12 — 2026-05-26

### Minor Changes

- [#10505](https://github.com/Kilo-Org/kilocode/pull/10505) [`19f166d`](https://github.com/Kilo-Org/kilocode/commit/19f166dc71085ad08de558648cc164101c6ea43b) - Support choosing agent model and variant overrides from dropdowns.

### Patch Changes

- [#10581](https://github.com/Kilo-Org/kilocode/pull/10581) [`722eb44`](https://github.com/Kilo-Org/kilocode/commit/722eb44d6383d4e2670661632152716630127d02) - Show voice transcription automatically when you are signed in with the Kilo provider.

- [#10441](https://github.com/Kilo-Org/kilocode/pull/10441) [`f26d55f`](https://github.com/Kilo-Org/kilocode/commit/f26d55f2d3edc652408a424262b356dc902bd64d) - Keep inline subagent streaming responsive during tool-heavy sessions.

- [#10443](https://github.com/Kilo-Org/kilocode/pull/10443) [`8e76807`](https://github.com/Kilo-Org/kilocode/commit/8e7680794da86c6d938d6626066157c9cd18adbb) - Support configuring the default task subagent model and reasoning effort while safely inheriting the calling agent model when the override is unavailable.

- [#10559](https://github.com/Kilo-Org/kilocode/pull/10559) [`33eb706`](https://github.com/Kilo-Org/kilocode/commit/33eb706c580bd89d4c9bc408de62b8bdf65fd61d) - Add explicit Mistral and Inception autocomplete options that use connected provider API keys for FIM requests.

- [#10439](https://github.com/Kilo-Org/kilocode/pull/10439) [`18a7367`](https://github.com/Kilo-Org/kilocode/commit/18a73672eac8b9faf064b86b2718bce1cd92331e) - Remove the duplicate Work badge from busy Agent Manager tab search results.

- [#10483](https://github.com/Kilo-Org/kilocode/pull/10483) [`637527d`](https://github.com/Kilo-Org/kilocode/commit/637527d80edad5ee0816a32ee0bd94b1f753aab9) - Hide sub-agent sessions from recent session shortcuts in the extension.

- [#10575](https://github.com/Kilo-Org/kilocode/pull/10575) [`6415432`](https://github.com/Kilo-Org/kilocode/commit/6415432d225d696f29e030a84780e91011c1cf25) - Restore readable diff add and remove highlights in VS Code across dark and light themes.

- [#10573](https://github.com/Kilo-Org/kilocode/pull/10573) [`48af33f`](https://github.com/Kilo-Org/kilocode/commit/48af33f940c9a41ce0ca326e9ec3f0b1284f51cd) - Explain in disabled Speech to Text controls that voice input currently requires Kilo Gateway access.

- [#10486](https://github.com/Kilo-Org/kilocode/pull/10486) [`0ec80b0`](https://github.com/Kilo-Org/kilocode/commit/0ec80b0c6f401253fc05a7bd5c876e94320dfaa1) - Keep streamed Markdown code blocks stable while assistant output is still arriving.

- Updated dependencies [[`6415432`](https://github.com/Kilo-Org/kilocode/commit/6415432d225d696f29e030a84780e91011c1cf25), [`0ec80b0`](https://github.com/Kilo-Org/kilocode/commit/0ec80b0c6f401253fc05a7bd5c876e94320dfaa1)]:
  - @kilocode/kilo-ui@7.3.11
  - @opencode-ai/ui@7.3.11

## v7.3.11 — 2026-05-26

### Minor Changes

- [#10505](https://github.com/Kilo-Org/kilocode/pull/10505) [`19f166d`](https://github.com/Kilo-Org/kilocode/commit/19f166dc71085ad08de558648cc164101c6ea43b) - Support choosing agent model and variant overrides from dropdowns.

### Patch Changes

- [#10581](https://github.com/Kilo-Org/kilocode/pull/10581) [`722eb44`](https://github.com/Kilo-Org/kilocode/commit/722eb44d6383d4e2670661632152716630127d02) - Show voice transcription automatically when you are signed in with the Kilo provider.

- [#10441](https://github.com/Kilo-Org/kilocode/pull/10441) [`f26d55f`](https://github.com/Kilo-Org/kilocode/commit/f26d55f2d3edc652408a424262b356dc902bd64d) - Keep inline subagent streaming responsive during tool-heavy sessions.

- [#10443](https://github.com/Kilo-Org/kilocode/pull/10443) [`8e76807`](https://github.com/Kilo-Org/kilocode/commit/8e7680794da86c6d938d6626066157c9cd18adbb) - Support configuring the default task subagent model and reasoning effort while safely inheriting the calling agent model when the override is unavailable.

- [#10559](https://github.com/Kilo-Org/kilocode/pull/10559) [`33eb706`](https://github.com/Kilo-Org/kilocode/commit/33eb706c580bd89d4c9bc408de62b8bdf65fd61d) - Add explicit Mistral and Inception autocomplete options that use connected provider API keys for FIM requests.

- [#10439](https://github.com/Kilo-Org/kilocode/pull/10439) [`18a7367`](https://github.com/Kilo-Org/kilocode/commit/18a73672eac8b9faf064b86b2718bce1cd92331e) - Remove the duplicate Work badge from busy Agent Manager tab search results.

- [#10483](https://github.com/Kilo-Org/kilocode/pull/10483) [`637527d`](https://github.com/Kilo-Org/kilocode/commit/637527d80edad5ee0816a32ee0bd94b1f753aab9) - Hide sub-agent sessions from recent session shortcuts in the extension.

- [#10575](https://github.com/Kilo-Org/kilocode/pull/10575) [`6415432`](https://github.com/Kilo-Org/kilocode/commit/6415432d225d696f29e030a84780e91011c1cf25) - Restore readable diff add and remove highlights in VS Code across dark and light themes.

- [#10573](https://github.com/Kilo-Org/kilocode/pull/10573) [`48af33f`](https://github.com/Kilo-Org/kilocode/commit/48af33f940c9a41ce0ca326e9ec3f0b1284f51cd) - Explain in disabled Speech to Text controls that voice input currently requires Kilo Gateway access.

- [#10486](https://github.com/Kilo-Org/kilocode/pull/10486) [`0ec80b0`](https://github.com/Kilo-Org/kilocode/commit/0ec80b0c6f401253fc05a7bd5c876e94320dfaa1) - Keep streamed Markdown code blocks stable while assistant output is still arriving.

- Updated dependencies [[`6415432`](https://github.com/Kilo-Org/kilocode/commit/6415432d225d696f29e030a84780e91011c1cf25), [`0ec80b0`](https://github.com/Kilo-Org/kilocode/commit/0ec80b0c6f401253fc05a7bd5c876e94320dfaa1)]:
  - @kilocode/kilo-ui@7.3.11
  - @opencode-ai/ui@7.3.11

## v7.3.1 — 2026-05-19

### Minor Changes

- [#10382](https://github.com/Kilo-Org/kilocode/pull/10382) [`6ce2ded`](https://github.com/Kilo-Org/kilocode/commit/6ce2ded75c452326d1eec840d728a1616c7fb1db) - Make sections in the model picker collapsible. Click any section header (Favorites, Recommended, or a provider like Kilo Gateway) to hide its models. Collapse state resets each time the picker opens.

- [#10274](https://github.com/Kilo-Org/kilocode/pull/10274) [`14a25b0`](https://github.com/Kilo-Org/kilocode/commit/14a25b037bbbd7596aea88729989511ffe4dfce6) - Support speech-to-text voice input in Agent Manager inline review comments.

- [#10286](https://github.com/Kilo-Org/kilocode/pull/10286) [`6fcc3b6`](https://github.com/Kilo-Org/kilocode/commit/6fcc3b6a1e77e419482fe5c0377767b5500dbd51) - Export full VS Code session transcripts as Markdown files.

### Patch Changes

- [#10280](https://github.com/Kilo-Org/kilocode/pull/10280) [`3ac16c5`](https://github.com/Kilo-Org/kilocode/commit/3ac16c5be5c27ca35d46ca20da9475c606e048c5) - Keep long New Worktree prompts clear of selector controls and show inline model picker options without clipping.

- [#10278](https://github.com/Kilo-Org/kilocode/pull/10278) [`3031de6`](https://github.com/Kilo-Org/kilocode/commit/3031de63028e2ba07e0d171bd671fb7ee5b10c50) - Keep continued Agent Manager sessions in the selected worktree instead of moving them to Local.

- [#10287](https://github.com/Kilo-Org/kilocode/pull/10287) [`233da82`](https://github.com/Kilo-Org/kilocode/commit/233da827686f6dd38f908519b216eacc1cc8a012) - Keep inline review voice capture stable in rendered Markdown diffs.

- [#10132](https://github.com/Kilo-Org/kilocode/pull/10132) [`b914576`](https://github.com/Kilo-Org/kilocode/commit/b91457673cd6a810e356f4f4cae0c6d0f257c6b2) - Restore only the Kilo Code sidebar, Agent Manager, or both on VS Code restart based on which views were open before shutdown.

- [#10277](https://github.com/Kilo-Org/kilocode/pull/10277) [`4b816f6`](https://github.com/Kilo-Org/kilocode/commit/4b816f621baa163c8aaf3ec84ce15219d77bae19) - Send recorded voice prompts directly when the prompt send button is pressed.

## v7.3.0 — 2026-05-15

No notable changes

## v7.2.52 — 2026-05-11

### Patch Changes

- [#10143](https://github.com/Kilo-Org/kilocode/pull/10143) [`ea023b0`](https://github.com/Kilo-Org/kilocode/commit/ea023b06dd269445eaf0c433fb42f4c9de2605b9) - Reduce delays in long sessions by compacting older tool outputs when the model request becomes too large.

## v7.2.49 — 2026-05-09

No notable changes

## v7.2.40 — 2026-05-05

No notable changes

## v7.2.34 — 2026-05-04

### Minor Changes

- [#9737](https://github.com/Kilo-Org/kilocode/pull/9737) [`d5fb9eb`](https://github.com/Kilo-Org/kilocode/commit/d5fb9eb2265c03127e776c99020b03bb770255a1) - Support starting Agent Manager local sessions and worktree sessions from an experimental agent tool.

- [#9704](https://github.com/Kilo-Org/kilocode/pull/9704) [`22b5283`](https://github.com/Kilo-Org/kilocode/commit/22b5283f79e4dd8461764904b908001df969cce9) - Keep reasoning blocks expanded by default and add a setting to auto-collapse them after completion.

- [#9708](https://github.com/Kilo-Org/kilocode/pull/9708) [`f2db4d1`](https://github.com/Kilo-Org/kilocode/commit/f2db4d165cacc8b52148e7fe77fd4af7ff71b7bc) - Add a Display setting to collapse terminal command blocks by default instead of keeping them expanded.

### Patch Changes

- [#9317](https://github.com/Kilo-Org/kilocode/pull/9317) [`ce4a595`](https://github.com/Kilo-Org/kilocode/commit/ce4a595cdcba5074b0ebdf74f24213a8322f2cc7) - Dispose autocomplete editor listeners when inline completions are disabled.

- [#9651](https://github.com/Kilo-Org/kilocode/pull/9651) [`bc91af3`](https://github.com/Kilo-Org/kilocode/commit/bc91af398db6e52e4a6bbd1d26efce1b306d4697) - Center the sidebar prompt toolbar on wider sidebars and hide unavailable toolbar actions.

- [#9753](https://github.com/Kilo-Org/kilocode/pull/9753) [`fb11c7b`](https://github.com/Kilo-Org/kilocode/commit/fb11c7b56d49cdd52f8ee96fdfc9ce30d2c883b7) - Center welcome notifications in wide VS Code views.

- [#9460](https://github.com/Kilo-Org/kilocode/pull/9460) [`26e4c11`](https://github.com/Kilo-Org/kilocode/commit/26e4c1148f4e7a734bb8e535e02a1a9ad75be584) - Scope the custom commit message prompt to the current project. Setting it in the VS Code settings now writes to the workspace's `kilo.json` so different repositories can have different conventions, instead of silently applying globally. Also fixes the project-level config update endpoint, which previously wrote to a file that wasn't loaded.

- [#9742](https://github.com/Kilo-Org/kilocode/pull/9742) [`a076e33`](https://github.com/Kilo-Org/kilocode/commit/a076e336b34f897a6b9463b48d2181d90f9dd997) - Preserve Agent Manager local sessions across panel restarts when session refreshes complete out of order.

- [#9733](https://github.com/Kilo-Org/kilocode/pull/9733) [`e9f2760`](https://github.com/Kilo-Org/kilocode/commit/e9f2760d8e9a93d4b71dba6ef5aae522cb4fe263) - Support configuring custom agent tool permissions from the VS Code agent editor.

- [#9669](https://github.com/Kilo-Org/kilocode/pull/9669) [`0bf14eb`](https://github.com/Kilo-Org/kilocode/commit/0bf14eb2ff5ef59f9dc98342218addc670a87481) - Stop emitting `ai.*` and `gen_ai.*` OpenTelemetry spans from AI SDK calls, and remove the PostHog bridge that forwarded them. Tool/session/indexing telemetry is unchanged.

## v7.2.31 — 2026-04-29

### Patch Changes

- [#9687](https://github.com/Kilo-Org/kilocode/pull/9687) [`9028174`](https://github.com/Kilo-Org/kilocode/commit/9028174cfd5fdd0cf2f3dd87d5ace7cfa780cc4d) - Show compact todo update cards when checking off items in long todo lists.

- [#9691](https://github.com/Kilo-Org/kilocode/pull/9691) [`ae726cd`](https://github.com/Kilo-Org/kilocode/commit/ae726cdc45317a6bc6d2a77066c191dd674d0aa2) - Show apply_patch diffs in the permission prompt before approval.

## v7.2.25 — 2026-04-27

No notable changes

## v7.2.24 — 2026-04-25

### Patch Changes

- [#9423](https://github.com/Kilo-Org/kilocode/pull/9423) [`a87a461`](https://github.com/Kilo-Org/kilocode/commit/a87a461e971864377d2139c35e778cc98d5cca19) - Fix two Agent Manager tab-bar regressions. New session and terminal tabs now consistently open at the right end of the tab bar instead of sometimes slipping in front of existing tabs. Dragging a terminal tab now shows the same floating label preview as dragging a session tab.

- [#9026](https://github.com/Kilo-Org/kilocode/pull/9026) [`61516b4`](https://github.com/Kilo-Org/kilocode/commit/61516b4d3f5a87f623a34b9112b8e1ff3725f93c) - Support attaching Git changes from prompt mentions in the VS Code extension.

## v7.2.22 — 2026-04-24

### Patch Changes

- [#9444](https://github.com/Kilo-Org/kilocode/pull/9444) [`35f13cb`](https://github.com/Kilo-Org/kilocode/commit/35f13cbc8678f80cf6870c233f74f47b028bf705) - Fix restoring and paginating very long VS Code sessions.

## v7.2.20 — 2026-04-22

No notable changes

## v7.2.19 — 2026-04-22

No notable changes

## v7.2.18 — 2026-04-22

No notable changes

## v7.2.14 — 2026-04-17

### Minor Changes

- [#8976](https://github.com/Kilo-Org/kilocode/pull/8976) [`4ef6bbf`](https://github.com/Kilo-Org/kilocode/commit/4ef6bbff5093dc68a607f1f268e6ab662781922e) - Support browsing and resuming sessions from Agent Manager with `/sessions`.

- [#9023](https://github.com/Kilo-Org/kilocode/pull/9023) [`5301258`](https://github.com/Kilo-Org/kilocode/commit/530125828e891d3c50fe8d783201b65e3c4db8e4) - Support mentioning folders in the prompt with @ references, including top-level folder file contents.

### Patch Changes

- [#9121](https://github.com/Kilo-Org/kilocode/pull/9121) [`c8fd421`](https://github.com/Kilo-Org/kilocode/commit/c8fd4218236afb7d9f525ca667ddf53734c47d4a) - Fix the sidebar "Show Changes" diff viewer: the file tree now renders correctly (previously the file rows were cramped onto a single line due to missing styles), and per-file revert buttons are available, matching the Agent Manager.

- [#9046](https://github.com/Kilo-Org/kilocode/pull/9046) [`671129d`](https://github.com/Kilo-Org/kilocode/commit/671129d4d70587352f963f9f409d6c24e9e86436) - Fix a native memory leak on Windows where `kilo serve` would grow to several GB of RAM within minutes of opening the Agent Manager. Git diff polling now runs directly in the extension host instead of routing through the CLI subprocess, and the diff detail view caps per-file reads at 20 MB to prevent memory spikes when opening very large files.

- [#9118](https://github.com/Kilo-Org/kilocode/pull/9118) [`343455b`](https://github.com/Kilo-Org/kilocode/commit/343455b87895a0551760b5710b1ffe58fae21efd) - Respect per-agent model selections when an agent has a `model` configured in `kilo.jsonc`. Switching the model for such an agent now sticks across agent switches and CLI restarts. To pick up a newly edited agent default, re-select the model once (or clear `~/.local/share/kilo/storage/model.json`).

- [#9067](https://github.com/Kilo-Org/kilocode/pull/9067) [`959a8b4`](https://github.com/Kilo-Org/kilocode/commit/959a8b498de6efd28756683162296dd40eb9b454) - Fix "assistant prefill" errors when a user queues a prompt while the previous turn is still streaming. The queued message no longer lands in the middle of the prior turn's history, so the next request always ends with the user prompt.

- [#9123](https://github.com/Kilo-Org/kilocode/pull/9123) [`9749cc1`](https://github.com/Kilo-Org/kilocode/commit/9749cc178d999f96669cc815709a7cdf3129aefd) - Show MCP tool call inputs alongside outputs in chat, with JSON syntax highlighting for both.

- [#8911](https://github.com/Kilo-Org/kilocode/pull/8911) [`eac2dba`](https://github.com/Kilo-Org/kilocode/commit/eac2dbafa009adedeb4b44016956f2c6cd96b715) - Make switching between sessions in Agent Manager near-instant. Long sessions no longer freeze the UI when selected, and the chat view self-heals if it missed any messages while the session was in the background.

- [`f270639`](https://github.com/Kilo-Org/kilocode/commit/f27063987765bba2443f559629bc8c05fad996df) - Show an inline error in the Settings save bar when the configuration fails to save (for example, due to an invalid value) so the user can correct the config and retry instead of losing their unsaved changes silently.

- Updated dependencies [[`eac2dba`](https://github.com/Kilo-Org/kilocode/commit/eac2dbafa009adedeb4b44016956f2c6cd96b715)]:
  - @opencode-ai/ui@7.2.13
  - @kilocode/kilo-ui@7.2.13

## v7.2.10 — 2026-04-15

- Preserve write tool alongside apply_patch for GPT-5 models (@jacksonkasi1)
- Add `kilo help --all` command for full CLI reference in markdown or text (@maphew)
- Auto-generate CLI reference docs from help.ts (@maphew)
- Improve config warning UX across CLI, TUI, and VS Code
- Surface schema validation errors to user in CLI
- Skip invalid agent/command configs instead of crashing
- Align /local-review diff with agent manager diff viewer
- Various CLI documentation improvements
- Thanks also to @justincqz, @thomasboom, @ScuttleBot

## v7.2.9 — 2026-04-15

- Preserve write tool alongside apply_patch for GPT-5 models (@jacksonkasi1)
- Add `kilo help --all` command for full CLI reference in markdown or text (@maphew)
- Auto-generate CLI reference docs from help.ts (@maphew)
- Improve config warning UX across CLI, TUI, and VS Code
- Surface schema validation errors to user in CLI
- Skip invalid agent/command configs instead of crashing
- Align /local-review diff with agent manager diff viewer
- Various CLI documentation improvements
- Thanks also to @justincqz, @thomasboom, @ScuttleBot

## v7.2.8 — 2026-04-15

- Preserve write tool alongside apply_patch for GPT-5 models (@jacksonkasi1)
- Add `kilo help --all` command for full CLI reference in markdown or text (@maphew)
- Auto-generate CLI reference docs from help.ts (@maphew)
- Improve config warning UX across CLI, TUI, and VS Code
- Surface schema validation errors to user in CLI
- Skip invalid agent/command configs instead of crashing
- Align /local-review diff with agent manager diff viewer
- Various CLI documentation improvements
- Thanks also to @justincqz, @thomasboom, @ScuttleBot

## v7.2.1 — 2026-04-08

## Core
- Preserve write tool alongside apply_patch for GPT-5 models (@jacksonkasi1)
- Strengthen sync test and add missing ConfigCLICommand
- Align /local-review diff with agent manager diff viewer
- Make 'kilo help' show same output as 'kilo -h'
- Restore native --help for subcommands
- Add kilocode markers on mode block
- Add kilocode markers on agent block
- Add kilocode markers on command block
- Add workflows section to CLI documentation
- Add KILO_CONFIG_DIR to command paths in CLI documentation
- Add sync check ensuring commands.ts and index.ts stay in sync
- Disable built-in help command to allow `kilo help --all` to work
- Track remote connection opened event in PostHog
- Drop explicit CommandModule type from commands array to fix typecheck
- Add completion command to commands array for help --all and cli-reference
- Minimize index.ts diff and remove spurious changes
- Guard session import in config error handlers
- Fix kilocode_change markers in CLI code
- Let managed config errors propagate
- Include detail in validation error
- Move commands barrel to kilocode directory and restore upstream-style index.ts chain
- Improve config warning UX across CLI, TUI, and VS Code
- Add documentation explaining the purpose of commands.ts barrel file
- Add RemoteCommand to barrel exports, fix recursive subcommands, and include $0 commands in help --all output
- Add config warnings endpoint and surface errors to TUI/extension
- Add CONTEXT.md to CLI instructions list
- Add KILO_CONFIG_DIR to command lookup
- Widen KILO_DISABLE_PROJECT_CONFIG description in CLI documentation
- List all managed configuration files in CLI documentation
- Fix instructions auto-discovery list in CLI documentation
- Add missing opencode.jsonc to global paths documentation
- Add named-command lookup guidance to kilo-config skill
- Widened kilo-config skill to cover path location questions
- Add legacy paths to kilo-config skill documentation
- Surface schema validation errors to user in CLI
- Remove unscoped session.error publish from CLI
- Skip invalid agent/command configs instead of crashing
- Add regression tests for config resilience
- Remove empty openapi.json artifact and add DbCommand to test fixture (@maphew)
- Address bot review concerns (@maphew)
- Remove invalid ResolveMessage import and fix cli-reference link path (@maphew)
- Skip undescribed commands in review process and rename ambiguous variable (@maphew)
- Address review feedback: await rejects, gate options.all, sanitize cwd, add AttachStub (@maphew)
- Auto-generate CLI reference docs from help.ts (@maphew)
- Log catch block and document yargs version dependency (@maphew)
- Add kilo help --all command for full CLI reference in markdown or text (@maphew)
## TUI
- Add kilocode_change marker to prompt flexShrink prop
- Add kilocode_change markers in toast code
- Add flexShrink={0} to prompt border box to prevent shrinking

**Thank you to 6 community contributors:**
- @maphew:
  - feat: add kilo help --all command for full CLI reference in markdown or text
  - the plan for implementing help --all cmd
  - fix: address review — log catch block, document yargs version dependency
  - feat: auto-generate CLI reference docs from help.ts
  - fix: address review — await rejects, gate options.all, sanitize cwd, add AttachStub
  - fix: address review — skip undescribed commands, rename ambiguous var, remove marker
  - Merge remote-tracking branch 'origin/main' into feat/help-all-command
  - Merge upstream/main into feat/help-all-command; add DbCommand and WorkspaceServeCommand
  - fix: remove invalid ResolveMessage import and fix cli-reference link path
  - Merge branch 'main' into feat/help-all-command
  - fix: address bot review concerns
  - fix: remove empty openapi.json artifact, add DbCommand to test fixture
- @aravhawk:
  - Merge branch 'Kilo-Org:main' into session/agent_58776529-50a0-40ff-9d78-3f2f7e4d28b6
- @justincqz:
  - remove references to 'kilo web' in documentation
- @thomasboom:
  - Update bonus credits and AI model versions in README
  - Merge branch 'main' into docs/updated-models-mentioned
- @jacksonkasi1:
  - fix: preserve write tool alongside apply_patch for gpt-5 models
- @ScuttleBot:
  - docs: update for task timeline graph and Agent Manager PR badges (#8532)

## v7.2.0 — 2026-04-07

## Core
- Remove local storage from ignored folder
- Add mutex lock, incremental add, and batched revert to snapshot performance (@johnnyeric)

**Thank you to 1 community contributor:**
- @johnnyeric:
  - perf(snapshot): add mutex lock, incremental add, and batched revert

## v7.1.23 — 2026-04-07

## Core
- Guard against prompt injection in commits
- Add scope context and better git commands to review prompt
- Inject --rm flag for Docker MCP containers to prevent accumulation (@johnnyeric)
- Comment out specific conditions in ID check logic
- Add support for GLM, Kimi, and Qwen reasoning models
- Follow-up execution is now aware of the saved plan file (@shssoichiro)
- Update minimatch, @modelcontextprotocol/sdk, and @aws-sdk dependencies
- Update Hono to fix authentication bypass and server vulnerabilities
- Update simple-git dependency to fix critical remote code execution vulnerability
- Preserve specific MCP tool rules when propagating permissions to sub-agents
- Propagate MCP restrictions to sub-agents alongside edit and bash
- Preserve inherited restrictions across multi-hop sub-agent chains
- Apply read-only bash and MCP restrictions to plan mode and propagate bash restrictions to sub-agents
- Plan mode now respects edit restrictions and sub-agents inherit caller's file access permissions

**Thank you to 2 community contributors:**
- @shssoichiro:
  - fix(core): make follow-up execution aware of the saved plan file
- @johnnyeric:
  - fix(mcp): inject --rm flag for Docker MCP containers to prevent accumulation

## v7.1.22 — 2026-04-06

## Core
- Cache full diff and ignore legacy local storage to prevent redundant git processes (@Varuu-0)

**Thank you to 1 community contributor:**
- @Varuu-0:
  - fix(cli): cache diffFull and ignore legacy local storage to prevent redundant git processes (#8400)

## v7.1.21 — 2026-04-05

## Core
- Session migration improvements for better handling of session state transitions
- Exclude /global/health from request logging
- Add org support for /kiloclaw command

**Thank you to 1 community contributor:**
- @St0rmz1:
  - docs: add scheduled triggers documentation
  - docs: fix scheduled trigger example to use weekly frequency for weekdays
  - Merge pull request #8281 from Kilo-Org/docs/add-scheduled-triggers-documentation

## v7.1.20 — 2026-04-02

No notable changes

## v7.1.19 — 2026-04-02

## Core
- Fixed hung state disposal during provider authentication refresh
- RevertBanner UI now shows no changes after successful file revert (@IamCoder18)
- Based on the generic commit message "refactor: address issues" without access to the actual changes, here's a cleaned up version:

Address refactoring issues
- Based on the commit message "refactor: fix unmount", without access to see the actual changes, here's the most reasonable changelog summary:

Fixed unmount cleanup and lifecycle handling
- Improve SDK claw types
- Based on the generic commit message "refactor: improve comments" without additional context about what was actually changed:

Improve code documentation and comments
- Add KiloClaw Chat to TUI
## TUI
- Guard against null theme in TUI resolveTheme and Proxy

**Thank you to 1 community contributor:**
- @IamCoder18:
  - fix: RevertBanner UI shows no changes after successful file revert (#8121)

## v7.1.18 — 2026-04-02

## Core
- Prevent unbounded log file growth with size-based rotation
- Import disabled MCPs with enabled: false instead of skipping them
- Skip logging for /log and /telemetry/capture endpoints to improve performance

**Thank you to 2 community contributors:**
- @wiliyam:
  - fix: register tr, nl, uk locales in i18n test coverage (#7271)
  - fix: add missing agentBehaviour and profile keys to tr/nl/uk locales
  - fix: remove duplicate profile.switchingAccount English fallback from nl.ts
- @St0rmz1:
  - docs(kiloclaw): add Triggers section with webhooks documentation
  - Merge pull request #8091 from Kilo-Org/docs/kiloclaw-webhooks

## v7.1.17 — 2026-04-01

No notable changes

## v7.1.16 — 2026-04-01

## Core
- Inject plan file path into non-experimental plan mode prompt

## v7.1.15 — 2026-04-01

## Core
- Keep plan follow-up sessions in the same worktree
## TUI
- Revert prevention of zombie `kilo serve` processes on extension host crash

## v7.1.14 — 2026-04-01

## Core
- Skip request logging for /telemetry/capture endpoint
## TUI
- Prevent zombie kilo serve processes on extension host crash

## v7.1.13 — 2026-04-01

## Core
- Revert restoration of directory tree in system prompt

## v7.1.12 — 2026-03-31

## Core
- Based on the commit title "Migration error handling (#8010)", here's the changelog summary:

Improved error handling for database migrations
- Migrate legacy sessions into new extension
- Based on the commit message "Clarify comment" with no additional context available:

Clarified code comment for better readability
- Fix global skills overriding project skills in skillDirectories()
- Handle tool-call without prior tool-input-start event
- Simplify self-config tips in CLI
- Register Apertis as CLI provider with dynamic model fetching (@theQuert)
## SDK
- Pass duplex in fetch init to survive VS Code proxy-agent wrapper

**Thank you to 2 community contributors:**
- @theQuert:
  - feat: add Apertis provider to VS Code legacy migration mapping
  - Merge branch 'main' into feat/apertis-opencode-provider
  - feat: register Apertis as CLI provider with dynamic model fetching
- @halaxa:
  - Fix typo in Linux x64 download link

## v7.1.11 — 2026-03-31

## Core
- Normalize directory path when listing sessions to fix Windows case mismatch

## v7.1.10 — 2026-03-31

## Core
- Restore agent picker labels
- Propagate deprecated field in agent merge and show description in dialog (@IamCoder18)
- Read remote_control from global config only
- Add remote_control config to auto-enable remote session relay
- Restore directory tree in system prompt
- Use git branch --list instead of -l flag
- Add WebSocket activity watchdog with heartbeat acknowledgment support
- Clarify read-only wording in ask prompt
- Restrict git branch/tag/remote commands to read-only flags
- Use allowlist for read-only git commands
- Fix user denying override MCP ask rules
- Remove find from Ask allowlist and add git write denials
- Add Ask agent permission tests
- Add MCP tool support to Ask agent
- Cache MCP listTools results to avoid redundant RPCs per loop step
- Add read-only bash commands to Ask agent
- Prevent CMD window flash on Windows by adding windowsHide flag to all spawn/exec calls
- Deprecated orchestrator agent with visual badge across UI (@IamCoder18)

**Thank you to 4 community contributors:**
- @cyphercodes:
  - fix: Reset All Settings now clears globalState items (variantSelections, recentModels, dismissedNotificationIds)
- @IamCoder18:
  - fix(vscode): enable scrolling in local session history list
  - core: deprecate orchestrator agent with visual badge across UI
  - fix: propagate deprecated field in agent merge and show description in dialog
  - Merge branch 'main' into feat/deprecate-orchestrator-agent
- @armaniacs:
  - fix: prevent Enter from sending message during IME composition
- @so-nerdyy:
  - fix: preserve separator style when migrating .kilocode to .kilo paths (#7562)

## v7.1.9 — 2026-03-28

## Core
- Gate Kilo API calls behind enabled_providers to prevent data leaks
- Make FreeUsageLimitError non-retryable to prevent unrecoverable backoff loop
- Prevent infinite loop when agent returns empty tool calls
- Add failing test for empty tool-calls loop
- Added TUI settings reference to kilo-config skill
- Guard builtin skill removal after lookup
- Fixed managed config paths for all platforms in CLI documentation
- Reject removal of built-in skills
- Normalize paths to prevent directory traversal bypass
- Include parent session ID in heartbeat session info
- Exempt plan files and protect global config directory from silent access
- Extract helpers to reduce duplication in CLI
- Check movePath in apply_patch config guard
- Detect nested config directories in isRelative function
- Add built-in kilo-config skill for on-demand config reference
- Close absolute-path bypass and extract DISABLE_ALWAYS_KEY constant
- Force permission prompt for config file edits
- Add config path detection for permission protection
## TUI
- Hide 'Always allow' option in TUI for config file edits
## SDK
- Add duplex: half to fix fetch in Node.js/Electron environments

## v7.1.8 — 2026-03-26

No notable changes

## v7.1.7 — 2026-03-26

No notable changes

## v7.1.6 — 2026-03-26

## Core
- Isolate checkpoints per worktree
- Strip bloated file contents from tool metadata to fix session loading performance
- Use load-time constant for KILO_SESSION_RETRY_LIMIT
- Hide commit-message git windows on Windows
- Clean up code quality issues in CLI
- Reuse MAX_DIFF_SIZE constant across CLI
- Add missing kilocode_change markers to CLI code
- Add configurable session retry limit
- Extract maximum diff size constant in CLI
- Remove /new worker/subprocess restart functionality
- Update Vercel AI SDK OpenAI Provider to support phase configuration
- Use subprocess instead of Worker thread for actual memory reclamation
- Restart worker on /new to reclaim native memory
- Use byte length for size check in CLI
- Scrub oversized diffs from stored session_diff on read
- Use git cat-file -s to pre-check size before reading file content
- Cap file content at 256 KB in Snapshot.diffFull()
## TUI
- Add kilocode_change markers to CLI code
- Replay workspace after restart
- Detach RPC listener on cleanup
- Evict child sessions recursively
- Strip summary.diffs from messages in TUI store
- Keep permission and question on evict
- Evict per-session data from TUI store on navigation
- Strip before/after from TUI session_diff store

## v7.1.5 — 2026-03-26

## Core
- Deny task tool usage in subagent sessions unless explicitly allowed by agent (@Githubguy132010)
- Always deny task permission in subagent sessions (@Githubguy132010)

**Thank you to 3 community contributors:**
- @Githubguy132010:
  - fix: always deny task permission in subagent sessions
  - fix: deny task in subagent sessions unless agent explicitly allows it
  - Merge branch 'main' into fix/block-subagents-spawning-subagents
- @AnDr-WaY:
  - feat(vscode): add open locally action for unassigned sessions (#7627)
- @ScuttleBot:
  - docs: add Inception to supported BYOK providers list (#7638)

## v7.1.4 — 2026-03-25

## Core
- Remove commands that can execute arbitrary code from bash allowlist
- Check legacy TOML config for bash permission in migration
- Trim bash allowlist to safe commands and handle legacy config
- Correct bash permission type annotation for typecheck
- Move bash migration to config loading and add safe command defaults
- Change default bash permission to ask for new users only
- Enforce bash deny after user config in orchestrator permissions
- Restore commented-out bash line for upstream merge compatibility
- Add OpenAI-compatible API settings
- Handle Windows cross-drive paths in ignore checks
- User config now overrides orchestrator allowlist for deny rules
- Remove unused imports
- Comment out bash access instead of removing the line
- Convert Kilo/OpenRouter variants to OpenAI/Anthropic format if necessary
- Remove bash access from orchestrator mode to prevent direct file editing (@Kilo)
- Based on the commit message alone, here's a concise changelog entry:

Reduce code duplication in core modules
- Based on the commit message "Make less brittle" without additional context, here's a generic summary:

Improve code robustness and reduce fragility
- Retain AI SDK provider configuration
- Avoid building a new SDK object
- Address remote relay review feedback — race, leak, and stuck-state fixes
- Centralized process spawning in util/process.ts to enforce windowsHide option
- Added support for custom modes in Kilo gateway
- Scope process.type shim to VS Code context via KILO_PLATFORM environment variable
- Honor ai_sdk_provider metadata for Vercel AI SDK provider selection
- Add remote session relay over WebSocket
- Prevent cmd.exe windows from appearing on Windows
- Fix infinite loading issue when generating commit messages by explicitly consuming response streams
- Improve agent handling in CLI (@shssoichiro)
- Preserve selected model variant across sessions (@shssoichiro)
- Use configured Code model when implementing a plan (@shssoichiro)

**Thank you to 2 community contributors:**
- @shssoichiro:
  - fix(cli): use configured Code model when implementing a plan
  - fix(cli): preserve selected variant as well
  - fix(cli): improve agent handling
- @Kilo:
  - fix(cli): remove bash access from orchestrator mode to prevent direct file editing

## v7.1.3 — 2026-03-24

## Core
- Reverted default bash auto-approve rule back to original setting
- Clarify configuration file paths
- Use strict .kilo/ directive in config hint
- Remove `.opencode/` from config directory hint
- Prefer existing config directory over creating .kilo/
- Add tip about saving repetitive tasks as commands
- Add config location awareness to system prompt

## v7.1.2 — 2026-03-23

## Core
- Always use kilo.db regardless of channel
- Add missing git config flags to cleanup() for Windows (@mvanhorn)

**Thank you to 1 community contributor:**
- @mvanhorn:
  - fix(snapshot): add missing git config flags to cleanup() for Windows

## v7.1.1 — 2026-03-23

## Core
- More targeted change, now identical to upstream
- Change default bash auto-approve rule to ask
- Remove context-1m-2025-08-07 anthropic-beta header
## TUI
- Remove dead docs link from GitHub setup wizard output
- Replace dead documentation and GitHub links, exclude vercel.link from link checker
## Desktop
- Complete Dutch language registrations (@Githubguy132010)
- Add Dutch (nl) language to desktop internationalization index files (@Githubguy132010)
- Add Dutch language support (@Githubguy132010)
## SDK
- Add drag-and-drop reordering for sidebar worktrees in Agent Manager

**Thank you to 2 community contributors:**
- @Githubguy132010:
  - feat: add Dutch language support
  - fix: add nl to desktop i18n index files
  - fix: complete Dutch language registrations
  - Merge branch 'main' into feat/add-dutch-language
- @Darkatek7:
  - fix(docs): correct kilocode-docs path reference in contributing guide (#7390)

## v7.1.0 — 2026-03-20

## Core
- Improved subagent permissions handling
- Replace x-opencode-* headers with x-kilo-* across codebase and upstream scripts
- Resolve missed merge conflicts from previous merge (@johnnyeric)
- Refactor Kilo compatibility for v1.2.24 (@johnnyeric)
- Save changes automatically when settings are updated
- Update Storybook due to theme name change in upstream v1.2.23 (@johnnyeric)
- Mention config paths in /status tip
- Show onboarding tip for first-time users on free model
- Fix package.json bin configuration after upstream merge
- Refactor Kilo compatibility for v1.2.22
- Add initial support for workspaces into the TUI (@jlongster)
- Send context-1m-2025-08-07 beta header to GitLab to enable 1M context window (@Krule)
- Add Copilot GPT-5.4 xhigh support (@MrMushrooooom)
- Disable fallback to free nano for small model (@thdxr)
- Canonicalize working directory after changing directory in TUI (@Hona)
- Fix broken /mcp toggling in TUI (@natewill)
- Update database path test to verify correct channel-based filename (@thdxr)
- Allow beta channel to share database with stable channel (@thdxr)
- Add OPENCODE_SKIP_MIGRATIONS flag to bypass database migrations (@thdxr)
## TUI
- Pass missing auth headers in `run --attach` (@ericclemmons)
- Exclude anonymous Kilo provider from connected check
- Show tips for connected first-time users
- Respect tips toggle during onboarding
- Show config and project paths in /status dialog
- Prevent TUI from exiting prematurely with proper exit guards (@kommander)
- Avoid TTY corruption from double cleanup (@tobwen)
## Desktop
- Remove oc-1 theme from app (@adamdotdevin)
- Fixed sidebar workspace container sizing to prevent content overflow (@iamdavidhill)
- Don't animate review panel in/out (@adamdotdevin)
- Reverted "Stupid Sexy Timeline" feature from app (@adamdotdevin)
- Sanitize workspace store filenames on Windows (@Hona)
- Add color palette generation to the app (@adamdotdevin)
- Fixed scroll jitter and infinite scroll loop in app (@adamdotdevin)
- Fix session title turn spinner in app (@iamdavidhill)
- Dismiss toast notifications when questions or permissions are shown (@neriousy)
- Fixed sidebar background color when collapsed (@iamdavidhill)
- Suppress hover when opening project menu or right-clicking to prevent flickering (@iamdavidhill)
- Trim retained desktop terminal buffers (@nexxeln)
- Messages not loading reliably in app (@adamdotdevin)
- Prune and evict stale app session caches (@nexxeln)
- Restore new-session logo on dev so users recognize OpenCode immediately (@iamdavidhill)
- Revert new-session logo on dev so this UI change only ships with auto-accept-permissions (@iamdavidhill)
- Add OpenCode logo to new session screen for immediate app identification (@iamdavidhill)
- Revert prompt control docking in TUI (@iamdavidhill)
- Dock auto-accept after thinking and move Add file button to bottom-left (@iamdavidhill)
- Balance titlebar columns so center content doesn't get squeezed by long side content (@iamdavidhill)
- Center empty states vertically in session view and improve review panel messaging for projects without version control (@iamdavidhill)
- Review panel transition fixed (@adamdotdevin)

**Thank you to 22 community contributors:**
- @adamdotdevin:
  - fix(app): review panel transition
  - fix(app): messages not loading reliably
  - fix(app): less auto-expand/collapse
  - feat(app): generate color palettes (#16232)
  - revert(app): "STUPID SEXY TIMELINE (#16420)" (#16745)
  - fix(app): don't animate review panel in/out
  - fix(app): remove oc-1 theme
  - fix(app): scroll jitter/loop
- @fwang:
  - zen: fix graph legend
- @thdxr:
  - core: add OPENCODE_SKIP_MIGRATIONS flag to bypass database migrations
  - core: allow beta channel to share database with stable channel
  - core: update database path test to verify correct channel-based filename
  - disable fallback to free nano for small model
  - core: prevent accidental edits to migration files by restricting agent access
- @iamdavidhill:
  - tui: center empty states vertically in session view and improve review panel messaging for projects without version control
  - tui: align numeric displays consistently across tool outputs and diff counters using tabular numerals
  - tui: balance titlebar columns so center content doesn't get squeezed by long side content
  - tui: dock auto-accept after thinking and move Add file to bottom-left
  - tui: revert prompt control docking
  - tui: keep model + thinking selectors beside Add file
  - tui: add more editor bottom padding for prompt controls
  - tui: expose auto-accept as a permissions select
  - tui: use text-base color for prompt selects
  - tui: add opencode logo to new session screen so users can immediately identify the app when starting a fresh session
  - tui: revert new-session logo on dev so this UI change only ships with auto-accept-permissions
  - tui: restore new-session logo on dev so users recognize OpenCode immediately
  - tui: remove prompt model/thinking/permissions selectors on dev so the composer stays simple
  - Revert "tui: remove prompt model/thinking/permissions selectors on dev so the composer stays simple"
  - Revert "tui: use text-base color for prompt selects"
  - Revert "tui: expose auto-accept as a permissions select"
  - Revert "tui: add more editor bottom padding for prompt controls"
  - Revert "tui: keep model + thinking selectors beside Add file"
  - Revert "tui: dock auto-accept after thinking and move Add file to bottom-left"
  - app: suppress hover when opening project menu or right-clicking to prevent flickering
  - tui: fix sidebar background color when collapsed
  - tui: fix sidebar workspace container sizing by adding box-border class to prevent content overflow issues
  - fix(app): session title turn spinner (#16764)
- @natewill:
  - fix(tui): fix broken /mcp toggling (#16431)
- @tobwen:
  - fix(opencode): avoid TTY corruption from double cleanup (#16565)
- @Bezkup:
  - docs(zen.mdx): correct Italian grammar and punctuation errors (#16590)
- @nexxeln:
  - fix: prune and evict stale app session caches (#16584)
  - fix: trim retained desktop terminal buffers (#16583)
- @Hona:
  - fix(tui): canonicalize cwd after chdir (#16641)
  - fix(app): sanitize workspace store filenames on Windows (#16703)
- @kommander:
  - guard tui exit (#16640)
- @ariane-emory:
  - docs: add session_child_first keybinding to documentation (#16631)
- @opencode-agent[bot]:
  - docs(i18n): sync locale docs from english changes
- @ericclemmons:
  - fix(opencode): pass missing auth headers in `run --attach` (#16097)
- @yihuikhuu:
  - fix(app): fix issue with scroll jumping when pressing escape in comment text area (#15374)
- @MrMushrooooom:
  - add copilot gpt-5.4 xhigh support (#16294)
- @Krule:
  - feat(gitlab): send context-1m-2025-08-07 beta header to enable 1M context window (#16153)
- @jlongster:
  - feat(tui): add initial support for workspaces into the tui (#16230)
- @ShriKaranHanda:
  - fix(storybook): add ci build workflow (#16760)
- @neriousy:
  - fix(app): dismiss toast notifications when questions or permissions a… (#16758)
- @johnnyeric:
  - fix: Update kilo-ui and kilo-vscode to use BasicTool that replaced ToolCall from previous OpenCode releases
  - fix(kilo-ui): Restore kilo-ui message-part fork dependencies removed by upstream v1.2.23
  - fix: Add unit test to cover BasicTool and GenericTool export
  - fix(kilo-vscode): Update storybook due to theme name change in upstream v1.2.23
  - refactor: kilo compat for v1.2.24
  - resolve merge conflicts
  - fix: Adjust missing merge conflicts not caught before
- @marius-kiloclaw:
  - fix(vscode): add upper bounds check in mode switcher keyboard navigation (#7335)
- @Githubguy132010:
  - docs(kilo-docs): add VS Code rollback install guidance (#7372)

## v7.0.51 — 2026-03-19

## Core
- Add required id fields to ephemeral environment details part
- Bump opentui to v0.1.87
- Remove "message" typo from system prompt
- Save permissions without disposing instances
- Add Windows ARM64 build support for CLI and VS Code extension
- Delay paste summary in CLI
- Add bell() utility for terminal attention requests
- Update session prompt configuration
- Fix package.json configuration
- Refactor and fix test
- Avoid mutating stored message when injecting environment details
- Preserve editor context on synthetic summary user messages
- Recompute environment details when user message changes mid-loop
- Cache environment details per turn for prompt caching
- Include ISO 8601 timestamp with timezone in per-message environment details
- Inject environment details ephemerally to avoid stale accumulation across turns
- Remove timezone from editor context prompt options
- Add system prompt instruction about environment details block
- Move dynamic editor context from system prompt to user message
- Refactor Kilo compatibility for version 1.2.21
- Preserve original line endings in edit tool (@ranqn)
- Fix git path resolution for modified files across Git Bash, MSYS2, and Cygwin on Windows (@Hona)
- Fix PTY session handle leak (@kikuchan)
- Sanitize preview database filenames (@Hona)
- Log stack trace when schema validation fails (@jlongster)
- Fix issue with migration (@thdxr)
- Add project git init API (@nexxeln)
- Update Drizzle ORM and improve channel database handling (@thdxr)
- Speed up share loads (@nexxeln)
- Enable auto-accept keybind regardless of permission config (@luisfelipesena)
- Stop leaking fsmonitor daemons causing 60GB+ of committed memory after running tests (@Hona)
- Replace Bun.which with npm which package for better cross-platform compatibility (@thdxr)
- Add GPT-5.4 to Codex allowed models list (@msadiks)
- Replace Bun.stderr and Bun.color with Node.js equivalents (@thdxr)
- Replace Bun.connect with net.createConnection for better compatibility (@thdxr)
- Use SHA1 for hash instead of unsupported xxHash3-XXH64 (@thdxr)
- Replace Bun.hash with Hash.fast using xxhash3-xxh64 (@thdxr)
- Replace Bun.write with Filesystem.write in config files (@thdxr)
- Replace Bun.write/file with Filesystem utilities in snapshot tests (@thdxr)
- Replace Bun.sleep with Node.js timers for better compatibility (@thdxr)
- Handle SIGHUP signal and kill process gracefully (@jlongster)
## TUI
- Add prompt history navigation with ArrowUp/ArrowDown in VS Code extension
- Show notifications in ctrl+p menu
- Add notifications toggle to CLI
- Add bell toggle to CLI settings
- Remove terminal bell sound from CLI run command
- Skip input bell sound on route change
- Skip bell sound on session route change
- Skip bell sound in JSON format mode for kilo run command
- Ring bell on task completion in kilo run
- Ring bell on permission and question prompts
- Ring bell when task completes in TUI
- Fix broken /export toggling in TUI (@natewill)
- Restore Bun stdin reads for prompt input (@thdxr)
- Use node:stream/consumers for stdin reading (@thdxr)
- Replace Bun.stdin.text with Node.js stream reading for better compatibility (@thdxr)
- Add onClick handler to InlineTool and Task components in TUI (@thdxr)
- Add options to auth login command to skip interactive questions (@dbpolito)
- Don't let Dax touch the UI (@Hona)
## Desktop
- Fixed compatibility issues with OpenCode v1.2.21
- Guard session-header current() against undefined when options is empty (@cyberprophet)
- Preserve file tree tab on reopen and fix E2E test regressions (@neriousy)
- Remove close button from project hover popover in TUI (@iamdavidhill)
- Add support for using agent model/variant when creating new sessions (@adamdotdevin)
- Model selection now persists correctly across sessions (@adamdotdevin)
- All panels transition in app (@adamdotdevin)
- Can't scroll files in app (@adamdotdevin)
- Fix max-width on timeline in app (@adamdotdevin)
- Align session empty states in TUI (@iamdavidhill)
- Add interactive timeline visualization to Agent Manager (@kitlangton)
- Share workspace slug wait helper across e2e specs (@Hona)
- Abort sessions and wait for idle before e2e cleanup (@Hona)
- Show skill issue when snapshotting is disabled in desktop app (@Hona)
- Fix portal positioning for sidebar menus and tooltips by removing conditional mount logic (@iamdavidhill)
- Add end-to-end tests for app (part 67) (@neriousy)
- Sidebar reveal animation, hover peek overlay, and weaker dividers (@iamdavidhill)
- Better review and file tree empty states in the app (@iamdavidhill)
- Enable Safari autocorrect in normal mode, disable in shell mode (@alexandrereyes)
- Add English to locale matchers (@KirillTregubov)
- Fix stale show in app (@neriousy)
- Remove keyboard shortcut tooltips from new session and new workspace buttons in the sidebar (@iamdavidhill)
- Load tab when opening file (@adamdotdevin)
- Fork Ghostty Web terminal emulator for integration (@adamdotdevin)
- Fix stale keyed show errors in app (@adamdotdevin)
- Fix locale error in app (@adamdotdevin)
- Provider settings consistency across the application (@adamdotdevin)
- Preserve question dock state across session switches (@ualtinok)
- Fix icon jiggle animation in app interface (@adamdotdevin)
- Mod+F always opens search in the application (@adamdotdevin)
- Improve error handling and translation in server error formatting (@OpeOginni)
- Improve agent selection logic to correctly pass configured models and variants (@OpeOginni)
- Remove unnecessary macOS entitlements from desktop app (@nexxeln)
- Add deep link support for creating new sessions in desktop app (@Brendonovich)
- Prefer using useLocation instead of window.location in app (@Brendonovich)
## SDK
- Update SDK package.json (@thdxr)

**Thank you to 30 community contributors:**
- @iamdavidhill:
  - chore(console): switch /go page to go.* i18n keys
  - docs: send Go landing page links to Go docs
  - chore(console): edit copy
  - chore(console): update copy
  - docs: replace Go landing page video with interactive limits graph
  - docs: clarify Go models in FAQ answer
  - docs: update Go privacy copy for global hosting
  - docs: de-link Go testimonials and swap Zen→Go
  - docs: localize Go graph and testimonial copy
  - docs: make Go hero CTA translatable with pricing emphasis
  - tui: reduce excessive spacing in go route layout to improve visual balance
  - tui: clarify which models are available in Go subscription
  - tui: show Go request limits per 5-hour session
  - tweak(ui): remove section
  - tweak(ui): darker text
  - chore(ui): remove quotes
  - docs: redesign Go pricing graph with horizontal bars and inline request labels
  - wip: Make bar colors in limit graph customizable via CSS variables for consistent theming across the go route visualization
  - tui: clarify free tier includes Big Pickle and promotional requests on Go pricing page
  - tui: clearer graph labels and responsive layout for usage visualization
  - tui: prevent Go pricing graph from overflowing on medium screens by constraining width and moving axis labels outside SVG for sharper rendering
  - tui: remove keyboard shortcut tooltips from new session and new workspace buttons in the sidebar
  - fix(app): better review/filetree empty states (#16221)
  - feat(app): sidebar reveal animation, hover peek overlay, and weaker dividers (#16374)
  - app: fix portal positioning for sidebar menus and tooltips by removing conditional mount logic
  - tui: align session empty states (#16412)
  - tui: remove close button from project hover popover (#16403)
- @fwang:
  - Merge branch 'dev' into go-page
  - Merge branch 'go-page' into dev
  - wip: zen
  - zen: update go page
  - zen: gpt5.4
  - zen: gpt5.3 codex spark
  - zen: gpt 5.4 pro
- @stolinski:
  - docs: Add opencode-sentry-monitor to ecosystem documentation (#16037)
- @opencode-agent[bot]:
  - docs(i18n): sync locale docs from english changes
- @jlongster:
  - fix(core): handle SIGHUP and kill process (#16057)
  - fix(core): log stack trace when schema validation fails (#16401)
- @Hona:
  - dont let dax touch the ui (#16060)
  - fix(git): stop leaking fsmonitor daemons e.g. 60GB+ of commited memory after running tests (#16249)
  - fix(opencode): sanitize preview database filenames (#16430)
  - feat(desktop): show skill issue when snapshotting is off (#16432)
  - fix(windows): git path resolution for modified files across Git Bash, MSYS2, and Cygwin (#16422)
  - test(app): abort sessions and wait for idle before e2e cleanup (#16439)
  - test(app): share workspace slug wait helper across e2e specs (#16446)
- @dbpolito:
  - feat(opencode): Adding options to auth login to skip questions (#14470)
- @Brendonovich:
  - app: prefer using useLocation instead of window.location (#15989)
  - desktop-electon: handle latest version update check properly
  - desktop: new-session deeplink (#15322)
- @nexxeln:
  - desktop: remove unnecessary macOS entitlements (#16161)
  - share: speed up share loads (#16165)
  - feat: add project git init api (#16383)
- @OpeOginni:
  - fix(app): improve agent selection logic passing in configured models and variants correctly (#16072)
  - refactor(desktop): improve error handling and translation in server error formatting (#16171)
- @adamdotdevin:
  - fix(app): no delay on tooltip close
  - fix(app): mod+f always opens search
  - chore(console): go page i18n
  - fix(app): icon jiggle
  - fix(app): file icon stability
  - fix(app): file path truncation in session turn
  - fix(app): provider settings consistency
  - fix(app): websearch and codesearch tool rendering
  - fix(app): stale read error
  - fix(app): locale error
  - fix(app): stale keyed show errors
  - chore(app): ghostty-web fork
  - fix(app): load tab on open file
  - Revert "fix(app): stale keyed show errors"
  - Revert "fix(app): stale read error"
  - fix(app): part type gate
  - fix(app): fix max-width on timeline
  - fix(app): task agent title
  - fix(app): can't scroll files
  - fix(app): all panels transition
  - fix(app): model sticks to session
  - fix(app): new session uses agent model/variant
- @ualtinok:
  - fix(app): preserve question dock state across session switches (#16173)
- @thdxr:
  - update sdk package.json
  - feat(tui): add onClick handler to InlineTool and Task components (#16187)
  - refactor: replace Bun.sleep with node timers (#15013)
  - refactor: replace Bun.write/file with Filesystem utilities in snapshot
  - refactor: replace Bun.write with Filesystem.write in config files
  - refactor: replace Bun.hash with Hash.fast using xxhash3-xxh64
  - refactor: replace Bun.stdin.text with Node.js stream reading
  - refactor: use node:stream/consumers for stdin reading
  - fix: use sha1 for hash instead of unsupported xxhash3-xxh64
  - refactor: replace Bun.connect with net.createConnection
  - refactor: replace Bun.stderr and Bun.color with Node.js equivalents
  - refactor(opencode): replace Bun.which with npm which (#15012)
  - fix: restore Bun stdin reads for prompt input (#16300)
  - chore(storage): update drizzle and channel db handling
  - fix issue with migration
- @Seungjun0906:
  - fix(console): follow-up for #13108 docs/en routing and locale cookie sync (#13608)
- @neriousy:
  - fix(app): stale show (#16236)
  - tests(app): e2e tests part 67 (#16406)
  - fix(app): preserve file tree tab on reopen + fix e2e test regressions (#16482)
- @msadiks:
  - feat: add "gpt-5.4" to codex allowed models list (#16274)
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
- @jayair:
  - docs: update legal policies for 2026 terms refresh
- @kikuchan:
  - fix(pty): pty session handle leak (#15599)
- @ShriKaranHanda:
  - fix(config): point GitHub PR search tool at current repository (#16441)
  - fix(storybook): restore build by mocking useLocation (#16472)
- @natewill:
  - fix(tui): fix broken /export toggling (#16443)
- @ranqn:
  - fix(opencode): preserve original line endings in 'edit' tool (#9443)
- @kitlangton:
  - STUPID SEXY TIMELINE (#16420)
- @cyberprophet:
  - fix(app): guard session-header current() against undefined when options is empty (#16478)
- @Eric-Guo:
  - fix(app): text-shimmer undefined length (#16475)
- @Githubguy132010:
  - feat(vscode): add slash command support to chat input (#7263)
  - feat(vscode): implement client-side slash commands (/new, /sessions, /models, etc.) (#7296)

## v7.0.50 — 2026-03-18

## Core
- Remove allow always button (@imanolmzd-svg)
- Propagate isFree flag from cloud API through CLI to extension (@kirillk)
- Update mDNS runtime defaults from opencode.local to kilo.local (@kilo-code-bot[bot])
- Updated retry logic in session management
- Use .cmd shim for local tsc on Windows (@alex-alecu)
- Add undo/redo functionality with per-message revert button in VS Code extension
- Reset global config lazy cache on session dispose so marketplace writes take effect
- Race pipe drains against timeout so tsc hangs are killed (@alex-alecu)
- Save permission rules to configuration file (@imanolmzd-svg)
- Replace remaining "opencode" branding references with "kilo" (@kilo-code-bot[bot])
- Publish bus event after TsClient diagnostics (@alex-alecu)
- Add timeout to TypeScript diagnostic wait to prevent indefinite hanging (@alex-alecu)
- Kill stuck tsgo process after timeout (@alex-alecu)
- Resolve workspace-local tsc from node_modules (@alex-alecu)
- Fallback to TsClient when tsgo LSP spawn fails in experimental mode (@alex-alecu)
- Use persistent tsgo LSP server when KILO_EXPERIMENTAL_LSP_TOOL is enabled (@alex-alecu)
- Remove process tree status dialog feature (@alex-alecu)
- Enable incremental mode for warm tsgo runs, reducing subsequent checks to 200-400ms (@alex-alecu)
- Defer tsgo to waitForDiagnostics and skip warm-up calls (@alex-alecu)
- Resolve native tsgo binary directly, skip node.js wrapper (@alex-alecu)
- Replace TypeScript language server with lightweight tsgo client (@alex-alecu)
- Add lightweight LSPClient adapter backed by tsgo diagnostics (@alex-alecu)
- Add tsgo/tsc diagnostic runner for lightweight TypeScript checking (@alex-alecu)
- Cap TypeScript server memory at 1.5 GB and disable automatic typing acquisition (@alex-alecu)
- Use ucomm for reliable ps parsing and extract script names from args (@alex-alecu)
- Add GET /process server route for process status (@alex-alecu)
- Add process tree utility for memory diagnostics (@alex-alecu)
## TUI
- Update PR command implementation
- Apply code review suggestions
- Use variable for binary name in pr.ts to minimize upstream diff (@kilo-code-bot[bot])
- Rename shadowed args variable in PR command to fix typecheck (@kilo-code-bot[bot])
- Display process tree with memory usage in TUI status dialog (@alex-alecu)
## SDK
- Regenerate SDK with ProcessInfo and ProcessStatus types (@alex-alecu)

**Thank you to 5 community contributors:**
- @alex-alecu:
  - feat: add process tree utility for memory diagnostics
  - feat: add GET /process server route for process status
  - chore(sdk): regenerate SDK with ProcessInfo and ProcessStatus types
  - feat: display process tree with memory usage in TUI status dialog
  - fix: use ucomm for reliable ps parsing and extract script names from args
  - fix: cap tsserver memory at 1.5 GB and disable automatic typing acquisition
  - feat: add tsgo/tsc diagnostic runner for lightweight TypeScript checking
  - feat: add lightweight LSPClient adapter backed by tsgo diagnostics
  - feat: replace typescript-language-server with lightweight tsgo client
  - fix: resolve native tsgo binary directly, skip node.js wrapper
  - fix: defer tsgo to waitForDiagnostics, skip warm-up calls
  - perf: enable --incremental for warm tsgo runs (~200-400ms after first check)
  - Merge branch 'main' into feat/process-diagnostics-status-dialog
  - refactor: remove process tree status dialog feature
  - feat: use persistent tsgo --lsp server when KILO_EXPERIMENTAL_LSP_TOOL is enabled
  - fix: fallback to TsClient when tsgo LSP spawn fails in experimental mode
  - fix: resolve workspace-local tsc from node_modules
  - kill stuck tsgo process after timeout
  - add timeout to TsClient diagnostic wait
  - publish bus event after TsClient diagnostics
  - fix(cli): race pipe drains against timeout so tsc hangs are killed
  - fix(cli): use .cmd shim for local tsc on Windows
  - Merge pull request #7083 from Kilo-Org/feat/process-diagnostics-status-dialog
- @kirillk:
  - feat(vscode): add Recommended group to model selector
  - feat(vscode): align model selector active state and group label styling with kilo-ui design system
  - feat(vscode): filter model selector by model name only
  - feat(vscode): sort models within groups alphabetically to cluster same-prefix models together
  - feat(vscode): wire isFree attribute to free badge with cost fallback, use kilo-ui Tag
  - feat(vscode): scroll active model into center view when model picker opens
  - feat(vscode): set selectedIndex to active model when model picker opens
  - fix(vscode): update isFree tests to match new isFree/cost-based signature
  - Merge branch 'main' into kirillk/model-picker
  - fix(vscode): gate isFree on kilo gateway provider with cost fallback
  - feat(vscode): propagate isFree from cloud API through CLI to extension
  - test(vscode): remove isFree fallback tests now handled by backend
  - Merge pull request #7137 from Kilo-Org/kirillk/model-picker
- @kilo-code-bot[bot]:
  - test(vscode): add CI check for missing translation keys
  - test(vscode): add locale completeness checks and fix missing translations
  - fix(vscode): address i18n test review feedback
  - fix(cli): replace remaining "opencode" branding references with "kilo"
  - fix(cli): rename shadowed args variable in pr command to fix typecheck
  - fix(cli): use variable for binary name in pr.ts to minimize upstream diff
  - fix(cli): update mDNS runtime defaults from opencode.local to kilo.local
  - test(vscode): add marketplace screenshot stories for MCP and Modes tabs
  - fix(vscode): re-fetch merged config after settings update to prevent revert
- @imanolmzd-svg:
  - Save permission rules to config (#7143)
  - Remove allow always button (#7159)
  - Rename PermissionDock dropdown (#7212)
  - Rename permission dock button (#7214)
- @Githubguy132010:
  - fix(vscode): preview pasted images in chat input (#7052)

## v7.0.49 — 2026-03-17

## Core
- Don't dispose all instances on global config update
- Fix build and publish scripts
- Merge opencode v1.2.19
- Merge opencode v1.2.18
- Add Kilo change markers to shared code for easier upstream merges
- Fix npm package publishing workflow
- Resolve merge conflicts
## TUI
- Fix SDK generation for VS Code extension tests
## Desktop
- Set Tauri database location to app data directory
- Remove unnecessary console log statement
## SDK
- Fix malformed JSON after merge

**Thank you to 1 community contributor:**
- @kilo-code-bot[bot]:
  - fix(vscode): reload autocomplete when CLI backend connection state changes

## v7.0.48 — 2026-03-17

## Core
- Add WarpGrep AI-powered codebase search tool (@DhruvBhatia0)
- Comment out proxy code instead of deleting it (@kilo-code-bot[bot])
- Disable external proxy to app.opencode.ai (@kilo-code-bot[bot])
- Granular bash permission rules (@imanolmzd-svg)
- Use correct config.json schema URL (app.kilo.ai) (@brick-pixel)
- Guard temperature and prevent prompt injection in enhance-prompt
- Also remove mode from legacy .kilocodemodes files used by ModesMigrator
- Add backend route to delete custom mode files from disk
- Use direct generateText for prompt enhancement instead of LLM.stream
- Validate skill location against registry before deletion and re-sync webview on failure
- Adjust for OpenRouter and improve various components
- Switch skill removal to POST with JSON body instead of DELETE with query params
- Rely on optimistic removal instead of stale backend response
- Return updated skills list from DELETE endpoint to fix stale UI
- Rename routes to KilocodeRoutes at /kilocode prefix
- Move DELETE /skill endpoint to dedicated route file
- Add DELETE /skill endpoint and use CLI backend for skill removal
- Revert removal of duplicate reasoning hack for kilo provider
- Add styling and tooltips to permissions UI (@imanolmzd-svg)
- Permission toggles per-pattern in permission dock (@imanolmzd-svg)
- Refactor for compatibility with Kilo v1.2.17
- Rework workspace integration and adaptor interface (@jlongster)
- Clarify output capture guidance in Bash tool documentation (@thdxr)
## TUI
- Re-add Kilocode changes to refactored thread file
- Show scrollbar by default (@kommander)
- Prevent orphaned opencode subprocesses on shutdown (@thdxr)
- Validate agent existence when using run --attach command (@alberti42)
## Desktop
- Remove blur from todos in app (@adamdotdevin)
- Delay dock animation on session load (@adamdotdevin)
- Remove diff lines from sessions in sidebar (@adamdotdevin)
- Loading session should be scrolled to the bottom (@adamdotdevin)
- Fix terminal tab close functionality in app (@adamdotdevin)
- Add Electron version to desktop app (@Brendonovich)
## SDK
- Regenerate SDK endpoints (@imanolmzd-svg)

**Thank you to 16 community contributors:**
- @Copilot:
  - revert: undo turbo typecheck dependency change from #14828 (#15902)
- @alberti42:
  - fix: `run --attach` agent validation (#11812)
- @thdxr:
  - docs(bash): clarify output capture guidance (#15928)
  - fix(process): prevent orphaned opencode subprocesses on shutdown (#15924)
  - remove build from typecheck
- @jlongster:
  - feat(core): rework workspace integration and adaptor interface (#15895)
- @fwang:
  - zen: fix aws bedrock header
- @Brendonovich:
  - desktop: add electron version (#15663)
  - ui: rely on task part href instead of onClick handler (#15978)
- @Niraj12chaudhary:
  - fix(docs): update dead opencode-daytona ecosystem link (#15979)
- @opencode-agent[bot]:
  - docs(i18n): sync locale docs from english changes
- @adamdotdevin:
  - fix(app): terminal tab close
  - fix(app): loading session should be scrolled to the bottom
  - fix(app): remove diff lines from sessions in sidebar
  - fix(app): delay dock animation on session load
  - fix(app): remove blur from todos
- @kommander:
  - show scrollbar by default (#15282)
- @imanolmzd-svg:
  - Permission toggles per-pattern in permission dock (#6977)
  - Permissions: styling and tooltips (#7025)
  - Improved permission prompt layout (#7037)
  - Permission prompt style improvements (#7050)
  - chore(sdk): regenerate endpoints (#7062)
  - Granular bash permission rules (#7091)
  - Visual regression tests for PermissionDock dropdown states (#7146)
- @kilo-code-bot[bot]:
  - fix: remove redundant vscode.env.openExternal call during login flow
  - docs: add Android Studio known issues to JetBrains troubleshooting section
  - Add CI check to prevent kilocode_change markers in kilo packages
  - Move kilocode_change check into existing test-vscode workflow instead of separate workflow
  - Move kilocode_change check to package.json script following knip pattern
  - refactor: pass settings command URI as i18n interpolation variable instead of hardcoding in locale files
  - fix(vscode): append to prompt instead of replacing on Add to Context
  - fix(vscode): implement terminal Add to Context using clipboard-based selection
  - docs: prune migration plan to remaining work only
  - Remove (NEW) labels and feature toggle from VS Code extension
  - feat(gateway): change default model from kilo-auto/frontier to kilo-auto/balanced
  - fix(kilo-docs): replace broken Unbound gateway link with working /connect URL
  - fix(cli): disable external proxy to app.opencode.ai
  - fix(cli): comment out proxy code instead of deleting it
- @kirillk:
  - feat(vscode): add dev-snapshot build script with username in version
  - docs(vscode): update snapshot build docs with directory and version info
  - fix(vscode): include username in vsix filename, deduplicate path output
  - chore(vscode): move snapshot scripts to bottom of package.json
  - fix(vscode): semver-safe sanitization of git user.name in snapshot version
  - fix(vscode): run full typecheck (extension + webview) in snapshot build
  - Merge branch 'main' into kirillk/dogfood
  - Update packages/kilo-vscode/script/dev-snapshot.ts
  - chore(vscode): replace install-dev-extension with snapshot:install task
  - chore(vscode): add DevSnapshot Build and Install tasks
  - chore(vscode): use green checkmark for install success message
  - fix(vscode): fix laggy hover in ModelSelector, clarify naming
  - fix(vscode): debounce ModelSelector search input by 250ms
  - Merge branch 'main' into kirillk/model-dropdown-6997
  - Merge pull request #7036 from Kilo-Org/kirillk/model-dropdown-6997
  - Merge pull request #7028 from Kilo-Org/kirillk/dogfood
- @St0rmz1:
  - docs(kiloclaw): add GitHub integration page and nav entry
  - Merge pull request #7033 from Kilo-Org/docs/kiloclaw-github-integration
- @brick-pixel:
  - fix: use correct config.json schema URL (app.kilo.ai) (#7086)
- @DhruvBhatia0:
  - feat: add WarpGrep AI-powered codebase search tool (#6685)

## v7.0.47 — 2026-03-13

## Core
- Handle malformed JSON in legacy .kilocode/mcp.json files (@marius-kiloclaw)
- Apply suggestions from code review
- Restore Kilo share URL support in import command
- Use .kilo instead of .kilocode for config directories
- Run script/format.ts to format codebase (@imanolmzd-svg)
- Lazy-load worktree diff details in Agent Manager
- Update ACP agent implementation
- Update provider error handling
- Use mercury-2 model ID in tests instead of mercury-2-coder (@apoorvumang)
- Remove instant reasoning effort for Mercury-2 on Kilo Gateway and direct Inception (@apoorvumang)
- Add reasoning effort support for Inception Mercury-2 (@apoorvumang)
- Add missing kilocode_change markers to oauth-callback.ts and codex.ts
- Update path for plans
- Refactor Kilo compatibility for v1.2.16
- Replace OpenCode with Kilo in OAuth callback pages and auth metadata
- Normalize trailing slashes in authentication login URLs (@elithrar)
- Upgrade OpenTUI to v0.1.86 and enable markdown rendering by default (@kommander)
- Avoid Gemini combiner schema sibling injection (@nexxeln)
- Forward metadata options to Cloudflare AI Gateway provider (@ryanskidmore)
- Clone part data in Bus event to preserve token values (@ryanskidmore)
- Recover from 413 Request Entity Too Large errors via automatic context compaction (@bentrd)
- Show human-readable message for HTML error responses (@rianvdm)
- Kill orphaned MCP child processes and expose OPENCODE_PID on shutdown (@ryanwyler)
- Add workspace_id to session table (@jlongster)
- Add WorkspaceContext to provide workspace-level state management (@jlongster)
- Add basic implementation of remote workspace support (@jlongster)
- Change keybindings to navigate between child sessions (@jlongster)
- Fix test (@adamdotdevin)
- Terminal rendering and interaction fixes in desktop app (@adamdotdevin)
## TUI
- Guard against malformed JSON in import response
- Respect KILO_SESSION_INGEST_URL environment variable in import command
- Replace curved arrow with straight arrow for better terminal compatibility (@thdxr)
- Show pending tool call count in TUI instead of generic 'Running...' message (@thdxr)
- Use arrow indicator for active tool execution in TUI (@thdxr)
- Disable session navigation commands when no parent session (@jerome-benoit)
- Fix project ID conflict and update handling for same session ID (@noamzbr)
- Improve task tool display with subagent keybind hints and spinner animations (@thdxr)
## Desktop
- Defer diff rendering in app (@adamdotdevin)
- Reduce timeline jank in app (@adamdotdevin)
- Tighten up header elements in app (@adamdotdevin)
- Stabilize project close navigation in app (@MrMushrooooom)
- Added comprehensive animation system with multiple animation types and controls (@kitlangton)
- Default auto-respond to false in app (@adamdotdevin)
- SolidJS refactoring for app package (@adamdotdevin)
- Move session review bottom padding to UI component (@iamdavidhill)
- Fix desktop app update finalizer for latest.json publishing (@Brendonovich)
- Revert Polish Turkish translations (@nexxeln)
- Use correct download link in finalize-latest-json for desktop app (@Brendonovich)
- Faster session switching via windowed rendering and staged timeline (@kitlangton)
- Add compact UI to app (@neriousy)
- Polish Turkish translations (@vaur94)
- Fallback to synthetic icon for unknown provider IDs in app (@rexdotsh)
- Fix scroll issues in the app (@adamdotdevin)
- Synchronize internationalization translations for the app (@adamdotdevin)
- Add Warp to the open menu (@kitlangton)
- Add latest.json finalizer script for desktop builds (@Brendonovich)
- Auto-accept permissions in app (@adamdotdevin)
- Add Turkish locale support for app and UI packages (@vaur94)
- Add recent projects section in command palette (@neriousy)
- Move desktop open_path functionality to Rust (@Brendonovich)
- Allow providing username and password when connecting to remote server (@Brendonovich)
- Add permission indicator to app (@adamdotdevin)
- Add permission notifications to the app (@adamdotdevin)
- Show keybind hint on context tab close button (@iamdavidhill)
- Better diff and code comments in app (@adamdotdevin)
- Deduplicate file tree scroll state management (@kitlangton)
- Align review changes select height in app (@iamdavidhill)
- Mute inactive file tab icons (@iamdavidhill)
- Add max-width to session when review is closed but file tree is open (@iamdavidhill)
- Add border to file tree on scroll (@iamdavidhill)
- Fix session tab alignment in compact view to prevent vertical overflow (@iamdavidhill)
- New tabs styling in app (@adamdotdevin)
- Auto-accept all permissions mode (@adamdotdevin)
- Enhance project tile interaction with suppress hover functionality in desktop app (@OpeOginni)
## SDK
- Add workspace query parameter to worktree diff endpoints (@kilo-code-bot[bot])
- Enable Zen mode for focused coding sessions (@fwang)

**Thank you to 36 community contributors:**
- @fwang:
  - wip: zen
  - zen: fix go plan usage limit
  - doc: opencode go
  - doc: go
  - doc: add zen deprecated models
  - zen: docs
- @niushuai1991:
  - docs: Sync zh_CN docs with English Version (#15228)
- @OpeOginni:
  - refactor(desktop): enhance project tile interaction with suppress hover functionality (#15214)
- @adamdotdevin:
  - feat(app): auto-accept all permissions mode
  - feat(app): new tabs styling (#15284)
  - fix(app): terminal issues
  - Revert "fix(ui): prevent filename and diff count overlap in session changes (#14773)"
  - fix: test
  - feat(app): better diff/code comments (#14621)
  - fix(app): permission notifications
  - fix(app): permission indicator
  - fix(app): scroll jacking
  - fix(app): update provider sprite
  - fix(app): auto-accept permissions
  - chore(app): i18n sync (#15362)
  - fix(app): scroll issues
  - chore(app): deps
  - chore(console): i18n sync (#15360)
  - chore(docs): i18n sync (#15417)
  - chore(app): solidjs refactoring (#13399)
  - fix(app): default auto-respond to false
  - fix(app): timeline jank
  - fix(app): tighten up header elements
  - fix(app): defer diff rendering
- @nexxeln:
  - fix(ui): avoid truncating workspace paths in assistant text (#14584)
  - fix(ui): prevent filename and diff count overlap in session changes (#14773)
  - Revert "fix(i18n): polish turkish translations" (#15656)
  - fix(opencode): avoid gemini combiner schema sibling injection (#15318)
- @iamdavidhill:
  - tui: fix session tab alignment in compact view to prevent vertical overflow
  - tweak(ui): add border to filetree on scroll
  - tweak(ui): max-width on session when the review is closed but the file tree is open
  - fix(ui): mute inactive file tab icons
  - tweak(app): align review changes select height
  - tweak(app): show keybind on context tab close
  - core: keep review header buttons visible when scroll thumb shows
  - ui: widen scroll thumb hit area
  - ui: tighten scroll thumb and review padding
  - ui: avoid session review header clipping
  - ui: move session review bottom padding
- @kitlangton:
  - refactor(app): dedupe filetree scroll state
  - chore(script): source team members from TEAM_MEMBERS (#15369)
  - feat(app): add Warp to the open menu (#15368)
  - perf(session): faster session switching via windowed rendering and staged timeline (#15474)
  - Animation Smorgasbord (#15637)
- @Brendonovich:
  - app: allow providing username and password when connecting to remote server (#14872)
  - desktop: move open_path to rust (#15323)
  - desktop: add latest.json finalizer script (#15335)
  - desktop: use correct download link in finalize-latest-json
  - desktop: fix latest.json finalizer
- @neriousy:
  - feat(app): recent projects section in command pallette (#15270)
  - fix(app): show proper usage limit errors (#15496)
  - fix(app): make provider icon resolved id reactive (#15583)
  - feat(app): add compact ui (#15578)
  - feat(app): show which messages are queued (#15587)
- @pirrozani:
  - docs(readme): add Greek translation and update language navigation (#15281)
- @vaur94:
  - feat(app): add Turkish (tr) locale for app and ui packages (#15278)
  - fix(i18n): polish turkish translations (#15491)
- @jlongster:
  - Change keybindings to navigate between child sessions (#14814)
  - feat(core): basic implementation of remote workspace support (#15120)
  - feat(core): add WorkspaceContext (#15409)
  - feat(core): add workspace_id to `session` table (#15410)
- @Niraj12chaudhary:
  - docs: add missing Bosanski link to Arabic README (#15399)
- @alexyaroshuk:
  - fix(app): make bash output selectable (#15378)
  - fix(app): display skill name in skill tool call (#15413)
- @jayair:
  - docs: Update OpenCode Go subscription and usage details (#15415)
- @rexdotsh:
  - fix(app): fallback to synthetic icon for unknown provider IDs (#15295)
- @thdxr:
  - docs: fix broken config imports in translated documentation
  - feat(tui): improve task tool display with subagent keybind hints and spinner animations (#15607)
  - tui: use arrow indicator for active tool execution (#15887)
  - tui: show pending toolcall count instead of generic 'Running...' message
  - tui: replace curved arrow with straight arrow for better terminal compatibility
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
- @MrMushrooooom:
  - fix(app): stabilize project close navigation (#15817)
- @06ergin06:
  - fix: update Turkish translations (#15835)
- @opencode-agent[bot]:
  - docs(i18n): sync locale docs from english changes
- @kommander:
  - Upgrade opentui to v0.1.86 and activate markdown renderable by default (#14974)
- @elithrar:
  - fix(auth): normalize trailing slashes in auth login URLs (#15874)
- @hdcodedev:
  - fix: correct package paths and commands in CONTRIBUTING.md
- @apoorvumang:
  - feat: add reasoning effort support for Inception Mercury-2
  - fix: remove instant reasoning effort for mercury-2 on kilo gateway and direct inception
  - fix: use mercury-2 model ID in tests instead of mercury-2-coder
  - Merge branch 'main' into feat/inception-mercury2-reasoning-effort
- @kilo-code-bot[bot]:
  - docs: update Auto Model Frontier tier from Sonnet 4.5 to Sonnet 4.6
  - Remove outdated vercel-ai-gateway architecture doc
  - Remove references to deleted vercel-ai-gateway architecture doc
  - fix: prevent infinite loop in visual regression CI when screenshots are non-deterministic
  - fix: use commit message check instead of re-running tests for loop prevention
  - fix: eliminate network dependency in avatar visual regression test
  - feat(sdk): add workspace query param to worktree diff endpoints
  - fix: use avatar silhouette image instead of solid black for WithImage story
  - fix: remove stale screenshots for deleted stories in visual regression CI
  - fix: use timestamp-based stale screenshot detection instead of deleting all baselines
  - fix: use storybook index to detect stale baselines instead of timestamps
  - revert: restore original baseline screenshots
- @evanjacobson:
  - Add KiloClaw architecture diagram to architecture overview docs
  - Merge pull request #6954 from Kilo-Org/docs/kiloclaw-architecture-diagram
  - feat(kilo-docs): add PostHog reverse proxy via Next.js rewrites
  - chore(kilo-docs): remove dead POSTHOG_HOST env var comment
  - chore(kilo-docs): add inline comments to PostHog proxy config
  - fix(kilo-docs): add basePath: false to PostHog proxy rewrites
  - Merge pull request #7005 from Kilo-Org/improvement/posthog-reverse-proxy-kilo-docs
- @kirillk:
  - feat(vscode): surface CLI startup errors in the extension
  - style(vscode): remove redundant color declarations from startup error banner
  - fix(vscode): include CLI path in startup error message
  - style(vscode): use editor background for startup error details panel
  - Merge branch 'main' into kirillk/cli-init-failure-6209
  - feat(vscode): surface userMessage/userDetails in StartupErrorBanner
  - test(vscode): add tests for toErrorMessage and improve Error: line matching
  - feat(vscode): add i18n for cli-backend server errors and translate all locales
  - unescape header text
  - fix(vscode): deduplicate concurrent initializeConnection calls to prevent orphaned subscriptions
  - Merge pull request #6955 from Kilo-Org/kirillk/cli-init-failure-6209
  - fix: show full text in question option descriptions instead of truncating with ellipsis
  - fix: wrap long mode descriptions instead of truncating with ellipsis
  - revert model switcher changes
  - fix(vscode): use vscode-font-size token for mode switcher item
  - model popover fixes
  - fix(vscode): selected mode description inherits active selection foreground
  - Merge pull request #7008 from Kilo-Org/kirillk/model-selector-ui
  - Merge pull request #7007 from Kilo-Org/kirillk/chat-options-truncate-6988
- @imanolmzd-svg:
  - fix: run script/format.ts
  - Merge pull request #6984 from Kilo-Org/fix/formatting-applied
- @marius-kiloclaw:
  - fix(mcp-migrator): handle malformed JSON in legacy .kilocode/mcp.json (#7012)

## v7.0.46 — 2026-03-11

No notable changes

## v7.0.45 — 2026-03-11

## Core
- Remove Kilo PR command from README (@kilo-code-bot[bot])
- Fix README based on review feedback (@kilo-code-bot[bot])
- Add README for npm package (@kilo-code-bot[bot])

**Thank you to 2 community contributors:**
- @kilo-code-bot[bot]:
  - fix: remove rounded corners from bash output box in vscode extension
  - Add README for npm package
  - Fix README based on review feedback
  - Remove kilo pr command from README
  - chore(kilo-vscode): run prettier on unformatted i18n files
  - ci(kilo-vscode): add prettier format check to CI
  - feat(vscode): add beta notice banner to provider settings screen
- @kirillk:
  - fix: pass time field in cloud session messages to fix TextPartDisplay crash
  - refactor: extract CloudSessionMessage type and mapCloudSessionMessageToWebviewMessage utility
  - Merge branch 'main' into kirillk/stuck-session-loading
  - Merge pull request #6899 from Kilo-Org/kirillk/stuck-session-loading

## v7.0.44 — 2026-03-11

## Core
- Wait for stdio streams to drain before flushing decoders in bash tool (@evanjacobson)
- Flush StringDecoder at EOF to surface trailing buffered bytes (@evanjacobson)
- Use separate StringDecoder per stream to prevent cross-pipe corruption (@evanjacobson)
- Use StringDecoder for UTF-8 multi-byte stream decoding (@evanjacobson)

**Thank you to 2 community contributors:**
- @kilo-code-bot[bot]:
  - docs(kilo-docs): remove model-provider-blocklist doc and nav item
  - Validate cloud session ID starts with 'ses_' on import
  - Revise legacy session ID message and remove formatting-only changes
  - Remove unhelpful 'use a different session ID' guidance from legacy session error
- @evanjacobson:
  - fix: use StringDecoder for UTF-8 multi-byte stream decoding
  - fix: use separate StringDecoder per stream to prevent cross-pipe corruption
  - docs: add before/after screenshots for UTF-8 bug fix PR
  - fix: flush StringDecoder at EOF to surface trailing buffered bytes
  - fix: wait for stdio streams to drain before flushing decoders in bash tool
  - Delete posted screenshots
  - Merge pull request #6883 from Kilo-Org/fix/utf8-multibyte-stream-decoding

## v7.0.43 — 2026-03-10

No notable changes

## v7.0.42 — 2026-03-10

## Core
- Add windowsHide option to all spawn calls to prevent CMD window flash on Windows
- Add --cloud-fork CLI option to import cloud sessions locally

**Thank you to 2 community contributors:**
- @kilo-code-bot[bot]:
  - docs: remove exec approvals info callout from Control UI page
- @evanjacobson:
  - Merge pull request #6873 from Kilo-Org/docs/remove-exec-approvals-info-callout

## v7.0.41 — 2026-03-10

## Core
- Update permission config from string to object format
- Save and load per-agent model selection in CLI (@shssoichiro)
- Migrate .opencode project folder to .kilo
- Use separate task ID for title generation to prevent model leak
## Desktop
- Add missing translations for provider toggle and mode switch dialog keys

**Thank you to 3 community contributors:**
- @kilo-code-bot[bot]:
  - docs: add custom subagents configuration page to CLI documentation
  - docs: convert Copy page button into dropdown menu with Open markdown and Edit page options (#6763)
  - docs: remove Kilo Web reference from architecture overview
  - fix: skip auto-commit of visual regression screenshots for fork PRs
  - fix: update fork PR error message to direct contributors to Kilo developers
  - fix(vscode): show todo permission prompts in bottom dock
  - feat(kilo-vscode): open Settings and Profile in editor panes instead of sidebar
  - docs: add AWS Bedrock as a supported BYOK provider
  - fix: add foreground color to selected mode/thinking selector items for light theme contrast
  - Replace discord.gg/kilocode URLs with kilo.ai/discord
- @ParthProLegend:
  - Add installation instructions for GitHub Releases
  - Update README with x64-baseline instruction details
  - Fix download links in README for Linux and Windows ARM
  - Add npm install note for hidden `.kilo` file
  - Fix typo in Linux ARM download link
  - Update README.md
  - Document hidden .kilo file for npm installation
  - Merge branch 'main' into main
- @shssoichiro:
  - fix(cli): save and load per-agent model selection

## v7.0.40 — 2026-03-06

## Core
- Adjusted copy on connect message (@imanolmzd-svg)
- Avoid parsing provider-less Kilo default models in ACP (@Snow-in-Dublin)
- Added toast notifications for Kilo errors (@imanolmzd-svg)
- Moved Kilo-specific code to kilocode folder (@imanolmzd-svg)
- Better messages for authentication required errors (@imanolmzd-svg)
- Apply code review suggestions
- Kilo-auto is not a provider
- Rename auto-small model to kilo-auto/small
- Migrate default model to kilo-auto/frontier across codebase (@kilo-code-bot[bot])
- Disallow plan_exit from batch tool execution (@alex-alecu)
- Restore unconditional plan_exit tool registration (@alex-alecu)
- Add model per mode settings
- Removed dependencies (@imanolmzd-svg)
- Remove disposeAll() call on auth to prevent premature resource cleanup (@imanolmzd-svg)
## TUI
- Prevent extension hang on server shutdown

**Thank you to 4 community contributors:**
- @imanolmzd-svg:
  - fix: Remove disposeAll() on auth
  - fix: Removed dependencies
  - Merge branch 'main' into fix/migration-dispose-change
  - refactor: extract ErrorDisplay component and shared unwrapError utility
  - refactor: use shared unwrapError in VscodeSessionTurn
  - feat: add error parsing and classification helpers for Kilo API errors
  - feat: add specific error displays for paid model and promotion limit in ErrorDisplay
  - feat: wire up login callback from VscodeSessionTurn to ErrorDisplay
  - style: use plain layout with legacy copy for auth error displays
  - style: add auth-prompt component styles using data-component/data-slot convention
  - feat: add i18n keys and wire up useLanguage for error displays
  - fix: Translations formatting
  - fix: use SDK AssistantMessage type for parseAssistantError parameter
  - Merge pull request #6676 from Kilo-Org/fix/migration-dispose-change
  - Merge pull request #6700 from Kilo-Org/feat/error-prompts
  - feat: Better messages for auth required errors
  - fix: Moved kilocode specific code to kilocode folder
  - fix: Added toast for Kilo errors
  - fix: Adjusted copy on connect message
  - Merge branch 'main' into feat/auth-messages
  - Merge pull request #6723 from Kilo-Org/feat/auth-messages
- @alex-alecu:
  - fix(plan): restore unconditional plan_exit tool registration
  - fix(batch): disallow plan_exit from batch tool execution
  - Merge branch 'main' into fix/plan_exit_regression
  - Merge pull request #6699 from Kilo-Org/fix/plan_exit_regression
- @kilo-code-bot[bot]:
  - refactor(model): migrate default to kilo-auto/frontier across codebase
  - docs: add KiloClaw pre-installed software reference (#6720)
- @Snow-in-Dublin:
  - fix(acp): avoid parsing provider-less kilo default models

## v7.0.39 — 2026-03-05

## Core
- Add unit test and apply review bot fixes (@imanolmzd-svg)
- Invalidate model cache on authentication and organization changes and reload state after disposal (@imanolmzd-svg)
- Remove duplicate reasoning hack for Kilo provider (@kilo-code-bot[bot])

**Thank you to 3 community contributors:**
- @Br1an67:
  - fix: add cursor pointer to subagent link in chat messages
- @kilo-code-bot[bot]:
  - fix: remove duplicate reasoning hack for kilo provider
  - fix: add redirect for broken voice transcription docs link (#6051)
  - fix: use sidebar background color for chat panel to distinguish from editor
  - Change worktree remove icon from X to trash can (#6611)
  - fix: add cursor pointer to clickable elements (#6255)
  - fix: remove borders from reasoning blocks and text parts in agent responses
  - fix: right-align prompt enhance and send buttons in chat input
  - fix: filter subagent sessions from session history
- @imanolmzd-svg:
  - fix: invalidate model cache on auth/org changes and reload state after dispose
  - fix: Add unit test and review bot fixes
  - Update packages/kilo-vscode/src/KiloProvider.ts
  - Merge branch 'main' into fix/auth-reload-state
  - Merge pull request #6659 from Kilo-Org/fix/auth-reload-state

## v7.0.38 — 2026-03-04

## Core
- Disable 'kilo web' command (unsupported OpenCode web UI) (@kilo-code-bot[bot])
- Remove kilocode_change markers from kilo-specific packages
- Improve migration with shared disposeAll debounce, MCP timeout handling, and bash rule merge
- Address bot review feedback for migration: improve partial failure handling, debounce disposeAll, enhance error handling, and fix YAML quote formatting
- Add KILOCODE_VERSION environment variable support to editor header (@kilo-code-bot[bot])
- Switch Kilo default model to auto-small (@kilo-code-bot[bot])
- Update migration UI
## TUI
- Add colorblind-friendly theme to the CLI (@idreesmuhammadqazi-create)

**Thank you to 2 community contributors:**
- @kilo-code-bot[bot]:
  - fix(opencode-provider): switch kilo default model to auto-small
  - feat(kilo-gateway): add KILOCODE_VERSION support to editor header
  - fix: docs banner respects dark/light mode theme (#6576)
  - disable 'kilo web' command (unsupported opencode web UI)
  - docs: high-priority screenshot test coverage gaps
  - feat: add Storybook stories for all high-priority screenshot test coverage gaps
- @idreesmuhammadqazi-create:
  - Add colorblind-friendly theme to the cli (again) (#6493)

## v7.0.37 — 2026-03-03

## Core
- Ask mode respects user permission configuration for edit tools
- Guard npm-dependent install artifact test (@sonwr)
- Clean up temporary install artifact fixture in CLI tests (@sonwr)
- Clarify hidden .kilo install artifact behavior in CLI documentation (@sonwr)
## TUI
- Stop doing models.length for every model to improve performance (@tspader)

**Thank you to 4 community contributors:**
- @Br1an67:
  - fix: wrap chat input buttons on narrow sidebar
- @tspader:
  - fix: stop doing models.length for every model
  - Merge pull request #6533 from Kilo-Org/fix/slow-model-filter
- @sonwr:
  - docs(cli): clarify hidden .kilo install artifact behavior
  - test(cli): clean up temp install artifact fixture
  - test(cli): guard npm-dependent install artifact test
- @kilo-code-bot[bot]:
  - docs: add RELEASING.md documenting the release process
  - docs: clarify that version input should be left empty by default

## v7.0.36 — 2026-03-03

## Core
- Fix agent interrupt AbortError leak
- Add sparkle button to enhance prompts before sending in VS Code extension
- Bootstrap session ingest after import

## v7.0.35 — 2026-03-03

## Core
- Fix Agent Manager worktree diff base branch calculation
- Check if current branch tracks a remote branch and is up to date with the remote
- Use the family property for model configuration
- Update duplicate reasoning hack after OpenRouter AI SDK patch

**Thank you to 2 community contributors:**
- @mikij:
  - fix: chat message autocomplete respects autocomplete switch
  - Merge branch 'main' into fix/chat-msg-autocomplete
- @imanolmzd-svg:
  - fix: migrate kilo gifs to LFS pointer
  - Merge pull request #6543 from Kilo-Org/fix/gifs-to-lfs
  - fix: Remove old kilo gif
  - Update README.md
  - Update packages/kilo-vscode/README.md
  - Merge pull request #6548 from Kilo-Org/fix/remove-old-kilo-gif

## v7.0.34 — 2026-03-03

## Core
- Update TUI configuration file
- Update naming conventions across the codebase
- Include opencode directory in build output
- Guard log string allocation behind info check in ingest queue
- Remove redundant info log on retry and enrich error log with attempt count
- Add debug logging for session ingest flush
- Filter notifications by showIn property to target CLI-only and extension-only notifications to the correct client (@kilo-code-bot[bot])
- Fixed end-to-end test
- Improve error logging and test type safety in VS Code extension (@imanolmzd-svg)
- Update SDK consumers to use renamed Kilo SDK exports (@imanolmzd-svg)
- Rename project references and branding to Kilo
- Refactor Kilo compatibility for v1.2.15
- Fixed most segfaults on Windows with Bun v1.3.10 stable (@Hona)
- Split TUI and server configuration (@kommander)
## TUI
- Publish Session.Event.Created on import to trigger session ingestion
- Add missing closing quote in SDK import code sample (@imanolmzd-svg)
## Desktop
- Fix Windows tests
- Add context-free package name patterns to auto-transform mock.module references (@imanolmzd-svg)
- Remove interactive shell flag from sidecar spawn to prevent hang on macOS (@kilhyeonjun)
- Fixed permissions and questions handling from child sessions in the app (@adamdotdevin)
- Add keyboard navigation to move between previous and next messages (@neriousy)
- Correct Copilot provider description in i18n files (@Oleksii-Pavliuk)
## SDK
- Type FIM stream response instead of using z.any() or unknown (@imanolmzd-svg)
- Clean tsbuildinfo on build, auto-rebuild SDK, and remove skipLibCheck (@imanolmzd-svg)
- Regenerate stale SDK types that drifted from server API after rebase (@imanolmzd-svg)
- Rename OpencodeClient to KiloClient in generated SDK files (@imanolmzd-svg)
- Rename public API to Kilo branding (@imanolmzd-svg)

**Thank you to 16 community contributors:**
- @PeterDaveHello:
  - Update and refine zh-TW locale translations
- @R44VC0RP:
  - chore(workflows): label vouched users and restrict vouch managers (#15075)
- @Oleksii-Pavliuk:
  - fix(app): correct Copilot provider description in i18n files (#15071)
- @neriousy:
  - fix(app): keyboard navigation previous/next message (#15047)
- @iamdavidhill:
  - tweak(ui): keep reasoning inline code subdued in dark mode
- @fwang:
  - wip: zen go
  - wip: zen
- @kommander:
  - split tui/server config (#13968)
- @OpeOginni:
  - fix(docs): update schema URL in share configuration examples across multiple languages (#15114)
- @adamdotdevin:
  - fix(app): permissions and questions from child sessions (#15105)
- @kilhyeonjun:
  - fix(desktop): remove interactive shell flag from sidecar spawn to prevent hang on macOS (#15136)
- @choephix:
  - fix(app): middle-click tab close in scrollable tab bar (#15081)
- @Hona:
  - fix: most segfaults on windows with Bun v1.3.10 stable (#15181)
- @imanolmzd-svg:
  - chore(sdk): rename public API to Kilo branding
  - chore(sdk): rename OpencodeClient to KiloClient in generated files
  - chore(sdk): update consumers to use renamed Kilo SDK exports
  - chore(upstream): add SDK rename rules to prevent reversion on merge
  - chore(kilo-vscode): switch tsconfig to bundler module resolution
  - refactor(kilo-vscode): replace HttpClient with SDK KiloClient in ConnectionService
  - chore(kilo-vscode): migrate consumers from HttpClient to SDK KiloClient
  - chore(kilo-vscode): replace SSEClient with SDK-based SdkSSEAdapter
  - chore(kilo-vscode): eliminate duplicate types and delete obsolete files
  - fix(kilo-vscode): resolve tsc errors from bundler resolution and SDK DOM types
  - fix(kilo-vscode): use fire-and-forget for profile calls to handle gateway 401 gracefully
  - fix(kilo-vscode): Restore SSE logging
  - chore(kilo-vscode): log full SSE event payload in SdkSSEAdapter for debugging
  - chore(kilo-vscode): migrate cloud sessions and worktree diff to SDK after rebase
  - fix(opencode): add missing closing quote in SDK import code sample
  - fix(kilo-vscode): wrap profile refresh after org switch in try/catch for best-effort handling
  - fix(vscode): increase SSE heartbeat timeout to 90s to prevent unnecessary reconnections
  - chore(kilo-vscode): improve error logging and test type safety
  - refactor(kilo-vscode): use typed SDK events in kilo-provider-utils tests
  - refactor(kilo-vscode): remove unnecessary type casts where SDK types are already correct
  - fix(upstream): add context-free package name patterns to auto-transform mock.module references
  - build(kilo-vscode): regenerate SDK types before extension build
  - fix(kilo-vscode): migrate WorktreeStatsPoller from HttpClient to SDK after rebase
  - fix(sdk): regenerate stale SDK types that drifted from server API after rebase
  - feat(gateway): pass organization context to FIM autocomplete reqs
  - refactor: remove unnecessary type assertions in AgentManagerProvider
  - refactor: remove unnecessary type assertions in KiloProvider and BrowserAutomationService
  - refactor: remove weak typing on KiloProvider.ts
  - refactor: replace weak typing in normalizeProviders, AutocompleteModel and BrowserAutomationService
  - refactor: rename normalizeProviders to indexProvidersById
  - fix(autocomplete): restore OpenAI-compatible SSE chunk parsing in FIM completion
  - refactor(autocomplete): use SDK client for FIM completion instead of manual fetch
  - refactor: move ProfileView import to profile/ subfolder (align with upstream)
  - revert: undo DiffPanel/FullScreenDiffView auto-open changes (upstream has better solution)
  - revert: remove manual sessionKey prop (upstream uses diffSessionKey memo)
  - feat: add isEventFromForeignProject to kilo-provider-utils for SDK event types
  - feat: add projectID filtering and pendingSessionRefresh to KiloProvider (SDK)
  - Merge remote-tracking branch 'upstream/main' into feat/use-sdk
  - Update packages/kilo-vscode/src/services/cli-backend/connection-service.ts
  - Update packages/kilo-vscode/src/kilo-provider-utils.ts
  - fix: wrap handleLogout throwOnError in try/catch to prevent unhandled rejection
  - refactor: simplify SSE event extraction using typed GlobalEvent.payload
  - fix: wrap cloud session import in try/catch to prevent unhandled rejection
  - Merge branch 'feat/use-sdk' of github.com:imanolmzd-svg/kilocode into feat/use-sdk
  - fix(tests): migrate upstream tests from HttpClient to SDK KiloClient
  - fix(kilo-vscode): add .catch() to consumeLoop fire-and-forget to prevent silent rejections
  - fix(kilo-vscode): remove unsafe as cast for cloudSessions response, use SDK types directly
  - Update packages/kilo-vscode/src/KiloProvider.ts
  - feat(autocomplete): abort stale FIM requests on new keystrokes
  - Merge branch 'main' into feat/use-sdk
  - fix(tests): fix session refresh test mock for CI compatibility
  - Merge branch 'main' into fix/cli-notification-filter
  - Merge pull request #6452 from Kilo-Org/fix/cli-notification-filter
  - fix(sdk): clean tsbuildinfo on build, auto-rebuild SDK, remove skipLibCheck
  - fix: type FIM stream response instead of z.any()/unknown
  - Merged main into feat/use-sdk
  - Merge pull request #6356 from imanolmzd-svg/feat/use-sdk
- @Phoen1xCode:
  - feat(vscode): add back button to ProfileView
- @kilo-code-bot[bot]:
  - fix: filter notifications by showIn so CLI-only and extension-only notifications target the right client
  - Update SECURITY.md to align with kilo.ai/security messaging
  - fix(docs): self-host favicon assets and fix broken head declarations (#6463)
  - Add pink pony message to 404 page (#6518)
  - Rename 'Kilo Claw' to 'KiloClaw' in architecture docs (#6524)
  - Skip visual regression tests on macOS (darwin)
  - Add paths filter to docs link checker pull_request trigger
- @dennismeister93:
  - docs: update kilo for slack part with gitlab
  - Update packages/kilo-docs/pages/automate/integrations.md
  - Merge branch 'main' into docs/kilo-for-slack-gitlab-update

## v7.0.33 — 2026-02-27

## Core
- Build and release CLI
- Refactor VS Code chat view
- Refactor code to improve reusability
- Honor model metadata values from API responses
- Refactor for Kilo compatibility with version 1.2.14
- Remove broad memory regression test suite (@alex-alecu)
- Remove MCP-specific docs and lifecycle tests from memory module (@alex-alecu)
- Drop MCP transport monkey patching (@alex-alecu)
- Add family, prompt, and variants fields to the Kilo gateway
- Replace orphan sleeps with exit waits in memory tests (@alex-alecu)
- Wait for MCP process exit before counting in memory tests (@alex-alecu)
- Scope orphan baselines per test to prevent conflicts (@alex-alecu)
- Isolate MCP baseline measurement per test to prevent interference between test cases (@alex-alecu)
- Remove unsafe LSP any casts in memory tests (@alex-alecu)
- Make memory test isAlive function errno-aware (@alex-alecu)
- Refactor Kilo compatibility for v1.2.13
- Update postinstall script
- Restore function to fix duplicate reasoning in responses
- Add compatibility support for Kilo version 1.2.11
- Add message delete endpoint (@shantur)
- Restore Claude tool call ID normalization from upstream (@kilo-code-bot[bot])
- Ensure MCP process tracking cleanup runs even if close rejects (@alex-alecu)
- Replace empty catch blocks in memory test helpers with isAlive/trySendSignal utilities (@alex-alecu)
- Close existing MCP client before creating new one to prevent process map corruption (@alex-alecu)
- Close existing MCP client before spawning replacement in connect() (@alex-alecu)
- Document SDK version for private _process field access (@alex-alecu)
- Prevent MCP child process orphaning on close/dispose (@alex-alecu)
- Sync with upstream changes (@thdxr)
- Temporarily disable plan enter tool to prevent unintended mode switches during task execution (@thdxr)
- Migrate Bun.spawn to Process utility with timeout and cleanup (@thdxr)
- Disable Bun cache in CI for config operations (@Hona)
- Await git ID cache write to prevent race conditions (@Hona)
- Import custom tools via file URL (@Hona)
- Add experimental workspace-serve command for multi-workspace server management (@jlongster)
- Fix ACP live and load share synthetic pending status preceding issue (@noamzbr)
- Replace structuredClone with spread operator for process.env in tests (@Hona)
- Add 50ms tolerance for NTFS mtime fuzziness in FileTime assert on Windows (@Hona)
- Add memory leak tests to reproduce the bug (@alex-alecu)
- Replace Unix-only test assumptions with cross-platform alternatives (@Hona)
- Use path.sep in discovery test for cross-platform path matching (@Hona)
- Normalize backslash paths in configuration relative paths and file ignore on Windows (@Hona)
- Fix plugin resolution on Windows using createRequire fallback (@Hona)
- Harden preload cleanup against Windows EBUSY errors in tests (@Hona)
- Normalize git excludesFile path for Windows in tests (@Hona)
- Stream bash output and add synthetic pending events for ACP (@noamzbr)
- Add git flags for snapshot operations and fix tests for cross-platform compatibility (@Hona)
- Handle CRLF line endings in markdown frontmatter parsing on Windows (@Hona)
- Use path.join for cross-platform glob test assertions (@Hona)
- Upgrade to Bun 1.3.10 canary and force baseline builds always (@Hona)
- Normalize paths at Windows permission boundaries (@Hona)
- Windows path support and canonicalization (@edemaine)
- Upgrade OpenTUI to v0.1.81 (@kommander)
- Change detection on Windows, especially Cygwin (@edemaine)
- Cache platform binary in postinstall for faster startup (@rekram1-node)
- Revert caching of platform binary in postinstall for faster startup (@rekram1-node)
- Cache platform binary in postinstall for faster startup (@rekram1-node)
- Publish desktop beta releases to a separate repository (@Brendonovich)
- Add experimental endpoint to list all sessions across workspaces (@R44VC0RP)
- Fix terminal issues in app (@adamdotdevin)
- Respect info exclude in snapshot staging (@nexxeln)
## TUI
- Allow TUI worker termination retries after failure (@alex-alecu)
- Terminate orphaned CLI when terminal parent exits (@alex-alecu)
- Clear RPC channel for faster shutdown (@alex-alecu)
- Unref shutdown timer in TUI worker to avoid keeping process alive (@alex-alecu)
- Consume stdout concurrently with process exit in auth login to prevent deadlocks (@Ayushlm10)
- Guard terminateWorker against multiple invocations (@alex-alecu)
- Resolve /exit hang caused by undelivered worker RPC response (@alex-alecu)
- Add Go language support to the CLI (@thdxr)
- Show LSP errors for apply_patch tool (@thdxr)
- Support variant in GitHub Action and OpenCode GitHub run (@elithrar)
## Desktop
- Stabilize diff viewer state and improve large-file review UX in agent manager
- Rename directory
- Enhance Windows app resolution and UI loading states in desktop application (@neriousy)
- Make desktop README more accurate (@Brendonovich)
- Ignore stale part deltas in app (@adamdotdevin)
- On cancel comment, unhighlight lines (@neriousy)
- Replace error handling with serverErrorMessage utility and add ConfigInvalidError checks (@OpeOginni)
- Preserve native path separators in file path helpers (@Hona)
- Remove filetree tooltips (@adamdotdevin)
- Update createOpenReviewFile test to match new call order (@Hona)
- Wait for loadFile before opening file tab (@Brendonovich)
- Windows sometimes uses IPv6 which can cause E2E test failures (@Hona)
- Correct inverted chevron direction in todo list (@kevinWangSheng)
- Add feed customization options to app (@adamdotdevin)
- Add beta icon to desktop app (@Brendonovich)
- Update outdated end-to-end test (@adamdotdevin)
- Remove double-border in share button (@adamdotdevin)
- Better sound effect disabling UX (@adamdotdevin)
- Add custom scroll view component to app (@adamdotdevin)
- Show and hide reasoning summaries in the app (@adamdotdevin)
- Stay pinned with auto-scroll on todos, questions, and permissions (@adamdotdevin)
- Bring back -i flag in desktop sidecar arguments (@Brendonovich)
- Large text pasted into prompt-input causes main thread lock (@adamdotdevin)
## SDK
- Fixed Turbo commands failing to run on Windows (@Hona)

**Thank you to 26 community contributors:**
- @nexxeln:
  - fix(snapshot): respect info exclude in snapshot staging (#13495)
  - fix(ui): preserve url slashes for root workspace (#14294)
- @elithrar:
  - fix(github): support variant in github action and opencode github run (#14431)
- @adamdotdevin:
  - fix(app): terminal issues (#14435)
  - fix(app): large text pasted into prompt-input causes main thread lock
  - fix(app): patch tool renders like edit tool
  - fix(app): stay pinned with auto-scroll on todos/questions/perms
  - feat(app): show/hide reasoning summaries
  - wip(app): custom scroll view
  - fix(app): session review re-rendering too aggressively
  - fix(app): better sound effect disabling ux
  - fix(app): remove double-border in share button
  - fix: e2e test outdated
  - fix(app): terminal issues
  - feat(app): feed customization options
  - Revert "fix(app): terminal issues"
  - fix(app): duplicate markdown
  - fix(app): remove filetree tooltips
  - fix(app): ignore stale part deltas
- @R44VC0RP:
  - feat: add list sessions for all sessions (experimental) (#14038)
  - fix: update workflows for better automation (#14809)
- @Brendonovich:
  - desktop: bring back -i in sidecar arguments
  - desktop: publish betas to separate repo (#14376)
  - desktop: beta icon
  - app: wait for loadFile before opening file tab
  - desktop: make readme more accurate
- @rekram1-node:
  - cache platform binary in postinstall for faster startup (#14396)
  - Revert "cache platform binary in postinstall for faster startup" (#14457)
  - cache platform binary in postinstall for faster startup (#14467)
- @fwang:
  - zen: gpt safety_identifier
  - wip: zen lite
  - zen: track session in usage
  - zen: display session in usage
  - zen: display BYOK cost
  - zen: remove alpha models from models endpoint
  - zen: restrict alpha models to admin workspaces
  - zen: gpt 5.3 codex
  - zen: go
  - wip: zen go
- @tuhin-cmd:
  - docs: add Bangla README translation (#14331)
- @Seungjun0906:
  - docs(ko): improve wording in gitlab, ide, index, keybinds, and lsp docs (#14517)
- @Phoen1xCode:
  - feat(vscode): add back button to ProfileView
- @github-actions[bot]:
  - Update VOUCHED list
- @pirrozani:
  - docs(tui): correct typo in TUI documentation (#14604)
- @edemaine:
  - fix(desktop): change detection on Windows, especially Cygwin (#13659)
  - fix: Windows path support and canonicalization (#13671)
- @kommander:
  - upgrade opentui to v0.1.81 (#14605)
- @Hona:
  - fix(win32): normalize paths at permission boundaries (#14738)
  - fix(cicd): flakey typecheck (#14828)
  - fix(win32): scripts/turbo commands would not run (#14829)
  - fix(win32): e2e sometimes fails because windows is weird and sometimes ipv6 (#14833)
  - upgrade to bun 1.3.10 canary and force baseline builds always (#14843)
  - fix: update createOpenReviewFile test to match new call order (#14881)
  - fix(test): use path.join for cross-platform glob test assertions (#14837)
  - fix(win32): add bun prefix to console app build scripts (#14884)
  - fix(win32): handle CRLF line endings in markdown frontmatter parsing (#14886)
  - fix(win32): add git flags for snapshot operations and fix tests for cross-platform (#14890)
  - fix(test): normalize git excludesFile path for Windows (#14893)
  - fix(test): harden preload cleanup against Windows EBUSY (#14895)
  - fix(win32): fix plugin resolution with createRequire fallback (#14898)
  - fix(win32): normalize backslash paths in config rel() and file ignore (#14903)
  - fix(test): use path.sep in discovery test for cross-platform path matching (#14905)
  - fix(test): replace Unix-only assumptions with cross-platform alternatives (#14906)
  - fix(win32): add 50ms tolerance for NTFS mtime fuzziness in FileTime assert (#14907)
  - fix(test): replace structuredClone with spread for process.env (#14908)
  - fix(app): preserve native path separators in file path helpers (#14912)
  - fix(opencode): import custom tools via file URL (#14971)
  - fix(project): await git id cache write (#14977)
  - fix(opencode): disable config bun cache in CI (#14985)
- @kevinWangSheng:
  - fix(app): correct inverted chevron direction in todo list (#14628)
- @noamzbr:
  - feat: ACP - stream bash output and synthetic pending events (#14079)
  - fix: ACP both live and load share synthetic pending status preceeding… (#14916)
- @alex-alecu:
  - feat: Add memory leak tests to reproduce the bug
  - fix: prevent MCP child process orphaning on close/dispose
  - fix: resolve /exit hang caused by undelivered worker RPC response
  - fix: cleanup
  - Merge branch 'main' into fix/memory-leak
  - fix: guard terminateWorker against multiple invocations
  - fix: document SDK version for private _process field access
  - fix: close existing MCP client before spawning replacement in connect()
  - Merge branch 'fix/memory-leak' of https://github.com/Kilo-Org/kilocode into fix/memory-leak
  - fix: close existing MCP client before create() in add() to prevent process map corruption
  - fix: replace empty catch blocks in memory test helpers with isAlive/trySendSignal utilities
  - fix: unref shutdown timer in TUI worker to avoid keeping process alive
  - fix: ensure MCP process tracking cleanup runs even if close rejects
  - fix: Clear RPC channel for faster shutdown
  - fix(tui): terminate orphaned CLI when terminal parent exits
  - test(memory): make isAlive errno-aware
  - test(memory): remove unsafe LSP any casts
  - test(memory): isolate MCP baseline per test
  - test(memory): scope orphan baselines per test
  - test(memory): wait for MCP process exit before counting
  - test(memory): replace orphan sleeps with exit waits
  - fix: restore accidental AgentManagerApp deletion
  - fix: drop MCP transport monkey patching
  - test(memory): remove MCP-specific docs and lifecycle tests
  - test(memory): remove broad memory regression suite
  - fix(tui): allow terminateWorker retries after failure
  - Merge pull request #6236 from Kilo-Org/fix/memory-leak
- @OpeOginni:
  - refactor: replace error handling with serverErrorMessage utility and checks for if error is ConfigInvalidError (#14685)
- @neriousy:
  - fix(app): on cancel comment unhighlight lines (#14103)
  - feat(desktop): enhance Windows app resolution and UI loading states (#13320)
- @jlongster:
  - feat(core): add workspace-serve command (experimental) (#14960)
- @thdxr:
  - refactor: migrate Bun.spawn to Process utility with timeout and cleanup (#14448)
  - core: temporarily disable plan enter tool to prevent unintended mode switches during task execution
  - feat: show LSP errors for apply_patch tool (#14715)
  - sync
  - opencode go copy
- @Ayushlm10:
  - fix: consume stdout concurrently with process exit in auth login (#15058)
- @kilo-code-bot[bot]:
  - fix: restore Claude tool call ID normalization from upstream
  - docs(kiloclaw): clarify redeploy options — same version or upgrade to latest (#6456)
- @shantur:
  - feat(core): add message delete endpoint (#14417)
- @imanolmzd-svg:
  - feat(gateway): pass organization context to FIM autocomplete reqs
  - Merge pull request #6427 from Kilo-Org/feat/autocomplete-add-orgs

## v7.0.30 — 2026-02-25

## Core
- Resolve diff viewer race condition and add diagnostics for Agent Manager
- Use Anthropic prompt for kilo/auto model
- Filter tool diagnostics to only edited files, reducing session payload 50-77%
- Remove fixDuplicateReasoning function

## v7.0.29 — 2026-02-25

## Core
- Add diff viewer panel to Agent Manager
- Update Kilo-specific code markers and documentation
- Fix plugin package name from @opencode-ai/plugin to @kilocode/plugin
- Fix plan_exit call (@alex-alecu)
- Show implementation suggestions only when LLM has all the information (@alex-alecu)

**Thank you to 1 community contributor:**
- @alex-alecu:
  - fix(plan): Show implementation suggestions only when LLM has all the information
  - Merge branch 'main' into fix/fix-plan-mode-suggestions
  - fix: Fix plan_exit call
  - Merge branch 'fix/fix-plan-mode-suggestions' of https://github.com/Kilo-Org/kilocode into fix/fix-plan-mode-suggestions
  - Merge pull request #6240 from Kilo-Org/fix/fix-plan-mode-suggestions

## v7.0.28 — 2026-02-25

## Core
- Refactor Kilo compatibility for v1.2.10
- Refactor Kilo compatibility for v1.2.9
- Refactor for Kilo compatibility with version 1.2.8
- Use toDateString() instead of toISOString() in system prompt to preserve caching
- Update SDK with latest server API changes
- Add support for .kilo configuration file
- Reverse messages before full sync to maintain correct chronological order
- Sort and organize package.json dependencies
- Reformat multiline expressions for readability
- Fixed type errors
- Address review feedback on cloud sessions feature
- Refactor Kilo for compatibility with version 1.2.7
- Fire Session.Event.Created after cloud session import
- Refactor for Kilo v1.2.6 compatibility
- Write imported sessions to SQLite instead of filesystem
- Add telemetry tracking for agent-manager sessions
- Refactor Kilo compatibility for v1.2.5
- Add endpoint to import Kilo Cloud sessions
- Refactor Kilo compatibility for version 1.2.4
- Add missing id, sessionID, and messageID to MCP tool attachments (@NatChung)
- Remove unnecessary deep clones from session loop and LLM stream (@thdxr)
- Remove User-Agent header assertion from LLM test to fix failing test (@thdxr)
- Support adaptive thinking for Claude Sonnet 4.6 (@tctev)
- Fix terminal issues in the app (@adamdotdevin)
- Normalize file.status paths relative to instance directory (@shantur)
- Migrate from Bun.Glob to npm glob package (@thdxr)
- Bump AI SDK packages for Google, Google Vertex, Anthropic, Bedrock, and provider utilities (@rekram1-node)
- Add support for medium reasoning with Gemini 3.1 (@rekram1-node)
- Remove use of Bun.file (@thdxr)
- Text files misclassified as binary (@adamdotdevin)
- Fetch default server at top level in desktop application (@Brendonovich)
- Terminal rework in app (@adamdotdevin)
- Bake in AWS and Google authentication packages (@rekram1-node)
- Token substitution in OPENCODE_CONFIG_CONTENT now works correctly (@ariane-emory)
- Revert refactor commits migrating from Bun.file() to Filesystem module (@thdxr)
- Migrate project.ts from Bun.file() to Filesystem/stat modules (@thdxr)
- Migrate read tool from Bun.file() to Filesystem module (@thdxr)
- Migrate write tool from Bun.file() to Filesystem module (@thdxr)
- Migrate edit tool from Bun.file() to Filesystem module (@thdxr)
- Migrate remaining tool files from Bun.file() to Filesystem/stat modules (@thdxr)
## TUI
- Fix issue from structuredClone addition by using unwrap (@rekram1-node)
- Use structuredClone instead of remeda's clone for better performance (@mhart)
- Add custom tool and MCP call responses that are visible and collapsible in TUI (@yanosh-k)
- Improve GitHub action branch detection and handle 422 errors (@elithrar)
- Ensure TUI onExit callback fires after terminal output is written (@thdxr)
## Desktop
- Skip end-to-end tests on Windows (win32) platform
- Skip e2e tests due to instability
- Reformat long string values onto single lines in i18n files
- Rename directory
- Remove unused files
- Re-introduce Kilo-specific changes after upstream merge
- Readjust path
- Add kilocode_change markers to shared code for easier upstream merging
- Applied suggestion from @catrielmuller
- Apply suggestion from Kilo Connect bot
- Don't spawn sidecar in desktop app if default server is localhost (@Brendonovich)
- Restore settings header mask in desktop app (@iamdavidhill)
- Black screen on launch with sidecar server fixed (@adamdotdevin)
- Clear todos on abort (@adamdotdevin)
- Update Japanese translations to WSL integration (@taroj1205)
- Make localhost URLs work in isLocal utility function (@Brendonovich)
- Navigate to last session on project navigation (@adamdotdevin)
- Fix typecheck errors in app package (@Brendonovich)
- Deduplicate allServers list in app (@Brendonovich)
- Adjust session turn horizontal padding in app (@iamdavidhill)
- Tighten prompt dock padding in app (@iamdavidhill)
## SDK
- Support session IDs starting with "ses_" in cloud import dialog and remove cloud_agent_session_id field
- Regenerate SDK for cloud session endpoints
- Build SDK to dist/ instead of dist/src (@Brendonovich)
- Fix nested exports transformation in SDK publish script (@thdxr)

**Thank you to 17 community contributors:**
- @thdxr:
  - refactor: migrate remaining tool files from Bun.file() to Filesystem/stat modules (#14121)
  - refactor: migrate src/tool/edit.ts from Bun.file() to Filesystem module (#14120)
  - refactor: migrate src/tool/write.ts from Bun.file() to Filesystem module (#14119)
  - refactor: migrate src/tool/read.ts from Bun.file() to Filesystem module (#14118)
  - refactor: migrate src/project/project.ts from Bun.file() to Filesystem/stat modules (#14126)
  - Revert: all refactor commits migrating from Bun.file() to Filesystem module
  - tui: ensure onExit callback fires after terminal output is written
  - sdk: fix nested exports transformation in publish script
  - Remove use of Bun.file (#14215)
  - refactor: migrate from Bun.Glob to npm glob package
  - Revert "refactor: migrate from Bun.Glob to npm glob package"
  - refactor: migrate from Bun.Glob to npm glob package (#14317)
  - core: remove User-Agent header assertion from LLM test to fix failing test
  - fix(web): correct config import path in Korean enterprise docs
  - remove unnecessary deep clones from session loop and LLM stream (#14354)
- @iamdavidhill:
  - tweak(ui): combine diffs in review into one group
  - Update oc-2.json
  - tweak(ui): group edited files list styling
  - tweak(ui): show added diff counts in review
  - tweak(ui): tighten review diff file info gap
  - tweak(ui): use chevron icons for review diff rows
  - tweak(ui): add open-file tooltip icon
  - tweak(app): tighten prompt dock padding
  - tweak(app): adjust session turn horizontal padding
  - tweak(ui): rtl-truncate edited file paths
  - tweak(ui): rotate collapsible chevron icon
  - tweak(ui): stabilize collapsible chevron hover
  - tweak(ui): nudge edited files chevron
  - fix(desktop): restore settings header mask
  - tweak(ui): refine session feed spacing
  - tweak(ui): tone down reasoning emphasis
  - tweak(ui): adjust session feed spacing
- @Brendonovich:
  - app: deduplicate allServers list
  - desktop: fetch defaultServer at top level
  - app: fix typecheck
  - app: make localhost urls work in isLocal
  - desktop: don't spawn sidecar if default is localhost server
  - sdk: build to dist/ instead of dist/src (#14383)
- @ariane-emory:
  - fix: token substitution in OPENCODE_CONFIG_CONTENT (alternate take) (#14047)
- @rekram1-node:
  - tweak: bake in the aws and google auth pkgs (#14241)
  - tweak: add support for medium reasoning w/ gemini 3.1 (#14316)
  - core: bump ai sdk packages for google, google vertex, anthropic, bedrock, and provider utils (#14318)
  - fix: issue from structuredClone addition by using unwrap (#14359)
- @adamdotdevin:
  - fix(app): terminal rework (#14217)
  - fix(core): text files missclassified as binary
  - fix(app): accordion styles
  - fix(app): navigate to last session on project nav
  - fix(app): terminal issues (#14329)
  - fix(app): clear todos on abort
  - fix(app): black screen on launch with sidecar server
- @fwang:
  - zen: gemini 3.1 pro
- @Seungjun0906:
  - docs(ko): improve wording in ecosystem, enterprise, formatters, and github docs (#14220)
- @shantur:
  - fix(core): normalize file.status paths relative to instance dir (#14207)
- @taroj1205:
  - feat(i18n): update Japanese translations to WSL integration (#13160)
- @elithrar:
  - fix(github): action branch detection and 422 handling (#14322)
- @yanosh-k:
  - feat(tui): add custom tool and mcp call responses visible and collapsable (#10649)
- @tctev:
  - feat(opencode): support adaptive thinking for claude sonnet 4.6 (#14283)
- @jayair:
  - docs: update providers layout and Windows sidebar label
- @mhart:
  - Use structuredClone instead of remeda's clone (#14351)
- @NatChung:
  - fix: add missing id/sessionID/messageID to MCP tool attachments (#14345)
- @rmk40:
  - docs: clarify tool name collision precedence (#14313)

## v7.0.27 — 2026-02-23

This release includes a data migration that will execute on first run. It will migrate all flat files in data directory to a single sqlite database. Depending on how much data you have and speed of computer this can take some time.

if anything goes wrong you can retrigger the migration by deleting ~/.local/share/kilo/kilo.db* files (%APPDATA% on windows)

If you have any issues with the migration the original data is not yet deleted and downgrading should work. But please open an issue so we can investigate and include sqlite in the issue title.

## Core
- Refactor for Kilo v1.2.3 compatibility
- Ensure Anthropic models on OpenRouter also have variant support (@rekram1-node)
- Add WAL checkpoint on database open (@thdxr)
- Ensure Vercel variants pass Amazon models under Bedrock key (@rekram1-node)

**Thank you to 2 community contributors:**
- @rekram1-node:
  - fix: ensure vercel variants pass amazon models under bedrock key (#13631)
  - fix: ensure anthropic models on OR also have variant support (#13498)
- @thdxr:
  - fix: add WAL checkpoint on database open (#13633)

## v7.0.26 — 2026-02-23

This release includes a data migration that will execute on first run. It will migrate all flat files in data directory to a single sqlite database. Depending on how much data you have and speed of computer this can take some time.

if anything goes wrong you can retrigger the migration by deleting ~/.local/share/kilo/kilo.db* files (%APPDATA% on windows)

If you have any issues with the migration the original data is not yet deleted and downgrading should work. But please open an issue so we can investigate and include sqlite in the issue title.

## Core
- Rename GitHub repository
- Change LLM completion telemetry properties to be consistent with old extension
- Rename database references for consistency
- Include migrations in the build
- Refactor Kilo compatibility for version 1.2.2
- Refactor Kilo for compatibility with v1.2.1
- Refactor Kilo compatibility for v1.2.0
- Update repository URLs from kilo to kilocode
- Add plan followup tracking to telemetry (@alex-alecu)
- Apply suggestion from Kiloconnect bot
- Allow reasoning for Claude models on Kilo gateway and restore preserved reasoning
- Add comprehensive test coverage for Session.list() filters (@thdxr)
- Filter sessions at database level to improve session list loading performance (@thdxr)
- Fix Vercel gateway variants (@rekram1-node)
- Bump Vertex AI packages (@rekram1-node)
- Show all project sessions from any working directory in TUI (@thdxr)
- Tweak websearch tool description date info to avoid cache busts (@rekram1-node)
- Use SQLite for database operations (@thdxr)
- Move timeout config to CLI flag (@yanhao98)
- Update AI SDK packages and use adaptive reasoning for Claude Opus 4.6 on Vertex, Bedrock, and Anthropic (@rekram1-node)
## TUI
- Prevent OpenCode run crash on malformed tool inputs (@0xK3vin)
- Add --dir option to run command (@BlankParticle)
## Desktop
- Fix Rust build issues in desktop application (@Brendonovich)
- Remove OPENCODE_SQLITE environment variable from desktop app (@Brendonovich)
- Terminal resize handling fixed in app (@adamdotdevin)
- Use prompt_async endpoint to avoid timeout over VPN/tunnel in web interface (@eytans)
- Remount SDK and sync tree when server URL changes (@ysm-dev)
- Sync docs locale cookie on alias redirects (@Seungjun0906)
- Performance optimization for showing large diff and files in desktop app (@neriousy)
## SDK
- Use Kilo binary instead of OpenCode in SDK server and TUI spawn

**Thank you to 20 community contributors:**
- @rekram1-node:
  - feat: update some ai sdk packages and uuse adaptive reasoning for opus 4.6 on vertex/bedrock/anthropic (#13439)
  - fix: tweak websearch tool description date info to avoid cache busts (#13559)
  - bump vertex ai packages (#13625)
  - fix vercel gateway variants (#13541)
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
- @adamdotdevin:
  - fix(app): terminal resize
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
- @thdxr:
  - sqlite again (#10597)
  - tui: show all project sessions from any working directory
  - core: filter sessions at database level to improve session list loading performance
  - core: add comprehensive test coverage for Session.list() filters
- @Brendonovich:
  - desktop: remote OPENCODE_SQLITE env (#13545)
  - desktop: fix rust
- @fwang:
  - zen: minimax m2.5 & glm5
- @pschiel:
  - fix: use kilo.exe as binary name on win32
- @thomasboom:
  - Revise model details in README to reference SOTA models
  - Merge branch 'main' into fix/readme-reference-frontier-models
- @alex-alecu:
  - feat(telemetry): add plan followup tracking
  - Merge branch 'main' into feat/plan-mode-telemetry
  - Merge pull request #6152 from Kilo-Org/feat/plan-mode-telemetry
- @mujtaba93:
  - Update packages/kilo-docs/markdoc/partials/install-cli.md

## v1.0.25 — 2026-02-23

## Core
- Display plan message as non-synthetic in new sessions (@alex-alecu)
- Add worktree setup script support to agent manager
- Close sub-agents to prevent orphan processes (@alex-alecu)
- Handover task list and compacted context to next session after planning (@alex-alecu)
- Split ask() function, extract constants, and remove redundant context label (@alex-alecu)
- Reject pending plan followup question on abort signal (@alex-alecu)
- Avoid empty context (@alex-alecu)
- Include compact summary of explored files in new sessions after planning to avoid redundant codebase searches (@alex-alecu)
- Add predefined suggestions after planning session to improve context management (@alex-alecu)
- Add length constraint to question tool prompt to ensure concise option labels (@pschiel)
## TUI
- Ensure abort fires even if shutdown throws in web.ts (@alex-alecu)
- Ensure abort fires even if shutdown throws in serve.ts (@alex-alecu)
## Desktop
- Skip intermittent e2e test

**Thank you to 6 community contributors:**
- @Githubguy132010:
  - fix(vscode): stop duplicate permission prompts (#408)
  - Merge branch 'dev' into fix/vscode-permission-prompt-408
  - Fix permission dock fallback for non-tool requests
  - Merge pull request #3 from Githubguy132010/codex/gate-permission-dock-rendering-by-tool-presence
- @pschiel:
  - fix: add length constraint in question tool prompt
- @haliliceylan:
  - fix(ui): remove redundant copy button from TextPartDisplay
  - fix(ui): show horizontal scrollbar on code blocks in markdown
  - refactor(ui): remove unused text part copy wrapper styles
- @alex-alecu:
  - feat: Add predefined suggestions after finishing the planning session to improve context management
  - feat: When starting a new session after planning, include a compact summary of what was explored and which files were read so the AI doesn't have to re-search the codebase.
  - fix: Avoid empty context
  - fix: Reject pending plan followup question on abort signal
  - Merge branch 'dev' into feat/suggestions-after-plan-end
  - refactor: split ask(), extract constants, remove redundant context label
  - feat: Handover task list and compacted context to next session after planning
  - fix: Close sub-agents, preventing them from becoming orphan processes
  - feat(plan): display plan message as non-synthetic in new sessions
  - Merge branch 'feat/suggestions-after-plan-end' of github.com:Kilo-Org/kilo into feat/suggestions-after-plan-end
  - Merge pull request #459 from Kilo-Org/feat/suggestions-after-plan-end
  - fix: ensure abort fires even if shutdown throws in serve.ts
  - fix: ensure abort fires even if shutdown throws in web.ts
  - Merge branch 'dev' into fix/fix-orphan-sub-agents
  - Merge pull request #520 from Kilo-Org/fix/fix-orphan-sub-agents
- @Olusammytee:
  - docs(cloud-agent): clarify Setup Commands vs .kilocode/setup-script
  - docs: update mode-specific custom instruction file guidance
  - docs: clarify YAML-first custom modes behavior
- @maphew:
  - fix: update broken contributing docs link in CONTRIBUTING.md
  - fix(docs): remove broken sidebar nav links for annual-billing and memory-bank

