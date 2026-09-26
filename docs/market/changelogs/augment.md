<!-- fonte: https://www.augmentcode.com/changelog -->

Skip to content

Product

Solutions
Context EnginePricingDocsBlog
Resources

Sign inGet Started

Product

Software FactoryCLICloud AgentsChangelog

Solutions

Software FactoryConnect agents across your SDLCCode ReviewReview every PR with agentsTest CoverageCoverage that climbs, suites that stay greenIncident ManagementInvestigate alerts before humans arriveTicket to PRAssign a ticket, merge a reviewed PRLarge ProjectsFrom design doc to shipped featureAutomationsRecurring work as repeatable workflowsSecurity RemediationFrom CVE alert to a reviewed fixMigrationsModernization as a program, not a projectOnboardingRamp every engineer in daysTeam Standards at ScaleYour best workflow, everyone's default

Context EnginePricingDocsBlogResources

WorkflowsPodcastBooks & GuidesCustomersStatus PageTrust Center

Talk to SalesSign in

Try CosmosGet Started

CHANGELOG

## What's New
Features, improvements, and milestones over time.

6 months

Sep

Aug

Jul

Jun

May

Apr

42 contributions between

Mar 26, 2026
and
Sep 26, 2026

AllVS CodeJetBrainsCLICode ReviewCosmosModels

SEPTEMBER 2026

2 updates

Sep 14

## IntelliJ Plugin v0.491.0 Release Notes

Changes below are new since the last stable IntelliJ plugin, v0.488.0-stable.

## Improvements
- The agent now asks for your approval before reading a file that looks sensitive — .env files, private keys and certificates, and credential- or secret-named files — as well as any file excluded by your .augmentignore. Directory listings are unaffected, and .gitignore is still not treated as a read boundary.
- MCP servers reached over HTTP, SSE, or Streamable HTTP now go through your configured HTTP proxy, so MCP tools work on machines that require a proxy for outbound traffic.
- Skills with invalid SKILL.md frontmatter are now shown in Settings with an actionable error instead of being silently dropped. An invalid skill also no longer hides a valid skill of the same name.

## Reliability & Performance
- The plugin's sidecar process can now use up to 4096 MB of heap, instead of Node's default ceiling of roughly 1.7 GB, so loading a very large conversation no longer exhausts memory. If it still runs out, you now get an explicit out-of-memory message instead of the sidecar disappearing silently. The ceiling can be overridden with the -Daugment.sidecar.maxOldSpaceSizeMb IDE system property.
- Chat now automatically retries a response that is interrupted part-way through the stream, instead of ending the turn with an error you have to resend.
- Opening Find Action no longer freezes the UI while the BYOK actions read your stored credentials; that lookup now runs off the UI thread.
- After a restart, a turn that was interrupted now stays finished. Previously late startup loading could revive it, leaving the conversation appearing to still generate with tool calls stuck unresolved.

## Bug Fixes
- Fixed remote tool integrations (GitHub, Linear, Notion, and others) disappearing from Settings when the first tool fetch happened before sign-in completed. The list now heals as soon as you sign in, instead of staying empty for up to an hour or until you restart the IDE.
- Fixed the agent being unable to read a file by absolute path from outside the project's content roots, such as a plugin-installed skill under ~/.augment/skills/.
- Fixed a response that hits the model's output limit with no tool call ending as a silently truncated success. It is now surfaced as an interrupted response.
- Fixed agent checkpoints failing to save for files in deeply nested workspaces, where the generated checkpoint filename exceeded the filesystem's limit. Existing checkpoint filenames are preserved.
- Fixed a git checkout that deletes and immediately recreates a file racing the file watcher into deleting the freshly recreated file.
- Fixed a chat message whose Markdown could not be parsed breaking the rendered response. It now shows an inline "Failed to render Markdown." notice, and rapid streaming updates always settle on the latest content.
- Fixed a failed MCP Tool Search setting write in Settings being reported as a load failure, which made the whole MCP server list look broken.

Sep 14

## VSCode Extension 0.901.1 Release Notes

## New Features
- Chat submit is now a rebindable VS Code keyboard shortcut. "Submit Chat Message" (Enter) and "Submit Chat Message Immediately" (Ctrl+Enter / Cmd+Enter) appear in Keyboard Shortcuts and can be remapped.

## Improvements
- Workspace-defined Augment hooks now run only in trusted workspaces. Command hooks supplied by a workspace stay disabled until you grant workspace trust, and are armed as soon as trust is granted.
- The agent now asks for approval before viewing sensitive files — .env files, private keys and certificates, credential- and secret-named files, and paths excluded by .augmentignore.
- Skills in .augment that fail to parse are now listed in Settings with the reason they were rejected, instead of disappearing silently.
- MCP Tool Search in Settings now distinguishes a failure to save your changes from a failure to load the current configuration.
- Remote MCP servers (HTTP and SSE) now honor the HTTP_PROXY and HTTPS_PROXY environment variables.

## Reliability & Performance
- Chat responses now recover from mid-stream interruptions automatically. Recovery is suppressed after a tool call has already completed, so tools are never re-executed by a retry.
- A stream that ends abnormally now reports a neutral, retriable "response was interrupted" message instead of guessing that your network connection failed.
- Recovered chat turns settle into a finished state. Tools that were running when a conversation was interrupted no longer appear to run forever after it is restored.
- The conversation you are working in is preserved when the extension host restarts or reactivates.
- Remote tool integrations no longer disappear when sign-in finishes while the extension is still starting up.

## Bug Fixes
- Responses cut short by the model's output limit are no longer reported as complete. Chat now shows an explicit truncation failure.
- Markdown that fails to parse now renders an inline fallback message instead of leaving the response blank.
- Agent checkpoints in deeply nested workspaces no longer fail to restore because of over-long checkpoint filenames.
- Files that Git recreates during a checkout are no longer deleted again by the agent's checkpoint file watcher.

AUGUST 2026

6 updates

Aug 21

## Auggie CLI 0.36.0 Release Notes

## New Features
- Reasoning Effort Flag: Added a flag to control the model's reasoning effort from the CLI.

## Bug Fixes
- Fixed a crash that could occur when replaying a session summary that included unsupported thinking content.
- Removed the `secret get --reveal` flag since it did not work.
- The daemon now validates the host's Git version at startup and reports a clear error if it's too old.
- Fixed the agent failing to parse file view ranges from malformed tool calls.
- Improved error messages when an MCP server's header secret configuration fails.
- Fixed prompt module output being cut off before completion.
- Fixed duplicate error notifications when a VFS sync failed.
- Extended the knowledgebase download timeout to prevent failures on large codebases.
- Patched security vulnerabilities identified in a routine dependency scan.
- Fixed several issues where VFS syncing could destroy or resurrect deleted files.

Aug 17

## IntelliJ Plugin v0.488.0 Release Notes

Changes below are new since the last stable IntelliJ plugin, v0.482.3-stable.

## Improvements
- Command hooks supplied by a repository's own `.augment/settings.json` now run only in projects you have marked as trusted. In an untrusted project those hooks are blocked; hooks you configure yourself at the user, system, or plugin level continue to run as before. Changing a project's trust state takes effect on the next hook event, with no restart needed.
- MCP servers that announce a changed tool list during a session are now picked up automatically. Previously the tool list was read once at startup and could go stale for the rest of the session.
- MCP servers are now verified with a real round-trip at startup, so a server that completes its handshake but cannot actually service calls no longer shows as connected.
- Removing an MCP server now sticks. Previously a removed server could reappear when the set of active servers was rebuilt.

## Groundwork
- Included early groundwork for a future guided migration experience. It is not enabled in this release and has no effect today.

## Reliability & Performance
- Chat now recovers quickly when a response stream drops mid-way. Previously an interrupted request could keep spinning until it eventually surfaced a "Request appears to have stalled" message; it now surfaces a retriable failure promptly so you can try again.
- Your most recent conversations are no longer lost on restart after a long chat history grows past the webview's storage limit. Previously the conversation list could revert to an earlier point.
- Saving a conversation that times out or fails is now retried automatically instead of being marked saved, and concurrent saves of the same conversation no longer pile up.
- Long-running MCP tool calls now respect the configured timeout, and a tool result that does not match its declared schema is passed through instead of failing the whole call.
- Long conversations that cross a summarization boundary no longer fail with a provider error on models that return reasoning content.
- Chat startup is more tolerant of a slow local connection between the chat panel and the plugin, and retries only the cases that can succeed on a retry.
- Refreshing a project's source roots now tolerates files that have gone away mid-refresh instead of failing the refresh.

## Bug Fixes
- Fixed the chat panel missing indexing progress and the initial codebase summary when the panel was opened after indexing had already started. The current indexing state is now replayed once the panel is ready, including after a panel reload.
- Fixed the Context Usage popover overstating how full the context window was by counting MCP tool definitions twice. Tool definitions are now counted once, and the breakdown reconciles with the reported total.
- Fixed a "Failed to render" error in chat caused by a code block whose language tag was unrecognized. Unknown languages now fall back to plain text.
- Fixed a "Failed to render" error in chat that could appear for conversations saved by an older version of the plugin.

## Compatibility
- Added support for JetBrains 2026.2 IDEs (build 262). The plugin was previously capped at 2026.1.
- The plugin now requires JetBrains IDEs 2025.2 (build 252) or newer. It previously installed on 2024.2 and later. If you are on an IDE older than 2025.2, this update is not offered and your currently installed version keeps working; update your IDE to 2025.2 or newer to receive further plugin updates.

Aug 13

## Auggie CLI 0.35.0 Release Notes

## New Features
- Daemon Pool Bundles: Added declarative configuration for daemon pools.

## Improvements
- Environment Rebuilds: Environment rebuild operations now run asynchronously.
- Plan-Mode Editors: Plan-mode editor paths now expand `~` to the home directory.
- MCP Scopes: Private and shared MCP scope changes now work when organization-level access controls are disabled.
- Local Daemons: Prevented duplicate local daemons from starting.
- Explore Agents: Corrected the tool allowlist for explore sub-agents.

## Bug Fixes
- OAuth Recovery: Improved recovery when hosted MCP OAuth sessions expire.
- Azure DevOps Projects: Preserved Azure DevOps repository project information.
- Authentication Security: Auth session tokens are now written with restricted file permissions.

Aug 13

## Cosmos Week 33 Release Notes

## All your connections in one place
Integrations and MCP servers have all moved to a new experience in Settings > Connectors. Easily see what you have connected in the left pane and browse all available integrations and MCP servers on the right. Add a custom MCP server that is not listed in the marketplace by clicking Add Connector. You can also quickly see which MCP servers have connection errors or need your attention in the sidebar.

## New features
- Restore earlier versions of files, link directly to Markdown headings, download binary files, and see recognizable names on comments.
- Personal profiles and Experts can now use icons, emojis, or uploaded avatars.

## Improvements
- The integration catalog is now easier to browse and uses recognizable provider branding.
- Experts can now inspect reactions on Slack messages.
- Repository updates and environment rebuilds are safer, recover better from temporary failures, and provide clearer progress and error messages.
- Archived workers resume when contacted, worker activity is reported more accurately, and long reports are easier to view and copy.
- Cost Analytics now applies Cosmos filters consistently, supports better tag filtering, and calculates cost per session correctly.
- Expert lists now load faster.
- Command K finds results faster by searching synchronized local data first.
- File changes begin streaming sooner, and outdated clients can no longer recreate deleted files.

## Bug fixes
- Chat history, queued messages, connection banners, startup progress, and switching between sessions now recover more reliably.
- MCP connections now recover more reliably during OAuth refreshes, reconnections, and startup.
- Sessions no longer crash on malformed messages or get stuck while switching conversations.
- Pinned folders and sessions keep their context, refresh after agent changes, and show unread activity correctly.
- The installed web app now leaves room for the iOS home indicator.
- Avatars no longer flicker repeatedly when an image is unavailable.

Aug 10

## VSCode Extension 0.893.1 Release Notes

## Reliability & Performance
- Interrupted chat responses now surface a retriable failure quickly instead of appearing to stall.
- Reopening very large workspaces no longer briefly freezes the editor.

## Bug Fixes
- Fixed Context Usage double-counting MCP tool definitions.

Aug 5

## Cosmos Week 32 Release Notes

## Configure your session tabs
You can now choose which session tabs appear in the main pane and side pane. Move Terminal, Files, Diffs, or Subscriptions by dragging a tab or using the pane's overflow menu; your layout is saved and applied to new sessions. Work between your agent, terminal, and code exactly how you want.

## New features
- You can now connect ClickUp and Snowflake, with clearer workflows for GitLab, Linear, Asana, Jira, and Confluence.
- Automations now have dedicated overview and history pages, along with a clearer setup experience for triggers.
- Cost Analytics now supports CSV exports, flexible filters, secondary breakdowns, and more accurate totals.
- You can restore earlier versions of files, and agents can list, add, and reply to file comments.
- Daemon pools and Expert sessions can now use isolated workspaces.

## Improvements
- Environment setup is clearer, rebuilds restore repositories safely, and stale updates offer better recovery options.
- MCP connection status, OAuth recovery, JSON imports, and connection testing are now clearer and more reliable.
- Transcripts, queued messages, drafts, status updates, reconnects, repository-clone warnings, and startup progress are now more reliable.
- Expert lists load faster, worker status and reports are more accurate, and Cosmos Advisor is available across eligible Spaces.
- Uploaded avatars and clearer errors make agent actions in Slack easier to understand.
- Folders keep their context, the sidebar refreshes in real time, and settings, integration pages, and mobile layouts are easier to use.

## Bug fixes
- Secret values remain write-only, duplicate names are rejected, and saved values are no longer exposed in the browser.
- The Can use role now works when enabled, and pinned sessions can be unpinned from folders.
- Comment authors, notification ordering, binary downloads, HTML previews, and file-sharing controls now behave consistently.
- Fixed GitLab form submission, Linear reconnection, Asana setup, and guidance for Jira and Confluence tools.

JULY 2026

2 updates

Jul 30

## Cosmos Week 31 Release Notes

## New features
- File comments: agents can now read and add comments on shared files.
- Cost Analytics: export CSV reports.

## Improvements
- Integrations: settings pages have clearer navigation, GitLab tokens submit with Enter, and Linear warns when reconnection is required.
- Sessions: active worker counts appear on tabs, draft changes persist locally, and shared sessions accept standard user roles.
- Agent tools: Slack actions now return clearer errors when they cannot be completed.
- Guidance: Experts, Environments, and Automations now link directly to relevant documentation.

## Bug fixes
- Cost Analytics: corrected Cosmos totals and token sorting.
- Changes: restored views recover when a saved source no longer exists, and workspace badges align correctly.
- Files: HTML previews no longer show a duplicate scrollbar.
- Experts: system controls no longer overlap.
- Automations: removed inaccurate run counters.

Jul 30

## Auggie CLI 0.34.0 Release Notes

## New Features
- Billing JSON Output: Included billing information in CLI JSON output.
- Sensitive Path Protection: Added approval requirements for saving files to sensitive paths.
- Daemon Environments: `auggie cloud environment get` now supports daemon targets.

## Improvements
- Hosted Artifacts Consent: Gated hosted-artifacts feature descriptions on explicit user consent.
- Expert Triggers: Preserved trigger actors when applying expert configurations.

## Bug Fixes
- Credential Resolution: Restored interactive credential resolution for MCP servers.
- Daemon Lifecycle: Preserved daemon execution lifecycle during automatic updates.

## PRODUCT
- Cosmos
- CLI
- Pricing

## SOLUTIONS
- Software Factory
- Code Review
- Test Coverage
- Incident Management
- Ticket to PR
- Large Projects
- Automations
- Security Remediation
- Migrations
- Onboarding
- Team Standards at Scale

## RESOURCES
- Customers
- Docs
- Blog
- Guides
- Learn
- Tools
- Books & Guides

## COMPANY
- Careers
- Press Inquiries
- Press Kit
- Contact Sales
- Contact Support
- Changelog
- Privacy & Security
- Trust Center
- Status Page

## LEGAL
- Legal Overview
- Cookie Policy
- Privacy Policy
- SLA and Support Policy
- 
Terms of Service

© 2026 Augment Code. All rights reserved.

DARK

LIGHT

SYSTEM
