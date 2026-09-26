<!-- fonte: https://kiro.dev/changelog/ -->

## Changelog

Stay up to date with the latest updates and improvements to Kiro.
Follow us:Bluesky,X,Discord,andLinkedIn

RSS Feed

Atom Feed

AllIDECLIWebCrewModelsGeneral

Sep 24, 2026
1.1.70IDE

## Configurable Terminal Timeouts, Clickable File Links, and Agent Focus Session Restore

IDE 1.1.70 lets you set a default timeout for local agent commands, opens Markdown links to workspace files in the editor, and keeps Agent Focus file and folder context aligned with the active project. Restored Agent Focus sessions now reconnect without leaving a blank chat pane. Background process output cards show their results, Markdown tables keep their styling, and Mermaid diagrams no longer leave stray error graphics while streaming.

Improvements

Fixes

Sep 24, 2026
0.7.0Crew

## Live Settings, Durable Work, and Broader Pull Request Watches

Kiro Crew 0.7.0 makes day-to-day work more durable and easier to control. Most settings apply as soon as you save them, accepted background work survives Gateway restarts, and updates wait for active work to finish. Long chats gain a turn minimap, clearer tool-call titles, and direct model and reasoning controls, while pull request watches expand to GitLab, Bitbucket Cloud, and Azure DevOps Services. Windows gets isolated pods and a faster Gateway start, and Preview users can choose more agent backends, let Jev route individual turns, or run remote crews on AWS Fargate.

## Settings That Apply While You Work

Most settings now reach the running Gateway as soon as you save config.json or change a value in Settings. Fields that still need a restart identify themselves in the UI; the Slack slash-command field is the current boot-only setting and carries a Changes need a restart badge.

Learn more ->

## Chat That Keeps Up With You

A turn minimap in the left gutter of a desktop chat shows one marker per loaded turn, with hover previews, click-to-jump navigation, and an end cap that loads older history. The model chip now puts model and reasoning-effort choices in one place, and Selectable Models controls which options appear. When the agent is working, choose Steer to redirect the current turn or Queue to wait for the next one; Cmd or Ctrl plus Enter performs the other action for one send.

Side Chat opens from /side or /btw for an ephemeral question beside the main conversation. On sessions using the Kiro CLI backend, it can run read-only lookups without approval; changes and MCP tools are refused. Tables can be copied as Markdown or CSV, and long code blocks repeat their actions at the bottom.

Learn more ->

## Work That Survives the Gateway

Accepted subagent work, Task Runner steps, and workflow calls now enter a durable queue before they run. A Gateway restart restores queued work instead of dropping it, and the System page shows the active queue and the concurrency capacity currently in force.

For long-horizon work, the optional Crew log records an append-only session trail and powers a durable session ledger across context compaction. Set KIROCREW_CREW_LOG=1 in ~/.kiro/crew/.env and restart the Gateway to enable its status, usage, timeline, tools, and approvals views. The kirocrew-crew-log MCP server provides read-only access for agents.

Learn more ->

## Pull Request Watches Beyond GitHub

The structured pull request watch now accepts GitHub, GitLab, Bitbucket Cloud, and Azure DevOps Services URLs. GitLab uses glab; Azure DevOps uses az with the azure-devops extension and either an az login session or AZURE_DEVOPS_EXT_PAT; private Bitbucket pull requests can use BITBUCKET_EMAIL and BITBUCKET_API_TOKEN.

Azure DevOps Server and Bitbucket Data Center are not supported. Azure DevOps and private Bitbucket watches must start from a dashboard conversation. Stop and inspect actions now work across plain timer loops, pull request watches, and workflow watches, including from Webex.

Learn more ->

## More Agent Backends (Preview)

OpenCode and goose join Kiro CLI, Claude Code, Codex, and KAS in the Agent Backend selector. Crew verifies each backend's permission path before the first prompt and shows missing installation components in the selector. Codex and OpenCode sessions can compact, and Crew's own tools reach OpenCode and goose sessions.

Pi is also available when both pi and pi-acp are installed. Pi sessions do not carry Kiro Crew's MCP tools, so choose another backend when you need Crew subagents, scheduling, memory, or other MCP capabilities. kirocrew doctor reports this limitation.

Learn more ->

## Jev Decides for Each Turn (Preview)

Enable Decisions (Jev) under Settings > Developer > Feature Previews, then choose Auto (Jev) in a chat's model picker to classify each message as simple, medium, or complex and route it through decisions.model_route. Choose Auto (Jev) on the busy send button to let Jev decide whether a mid-turn message should steer or queue. Each decision appears on the message it shaped, with feedback controls.

The Preview is opt-in. Model routing and busy-send decisions start only when you select Auto (Jev) in the corresponding control. The settings card explains what content can be sent to the configured provider; separate consent switches govern tool arguments, compaction inputs, and recalled-memory snippets.

Learn more ->

## Fargate Remote Crews

AWS Fargate joins SSH and AWS Systems Manager Session Manager (SSM) as a remote-crew connection method. Crew reaches the task through SSM with no inbound network rule, using the AWS CLI and Session Manager plugin on your laptop. Tasks live for six hours by default and the runtime admits at most ten at once. Change the lifetime with fargate.task_ttl_seconds in cloud.json; the ten-task ceiling is fixed.

Learn more ->

## Updates That Wait for Active Work

The Gateway now checks for updates at startup and every twelve hours. An automatic update pauses new work and waits for active turns, scheduled runs, subagents, Task Runner steps, and workflows to become idle before applying, then restarts the Gateway. If a source update needs a newer Python than the current virtual environment provides, Crew refuses before moving the checkout and names the interpreter that needs attention.

Managed installs can also arm an update from the update and What's New dialogs, using the same time-limited host approval shown under Settings > About.

Learn more ->

## Isolated Pods on Windows

The isolated-pod workflow now runs on Windows through Task Scheduler. kirocrew pod up, down, ls, status, token, url, logs, prune, and provision cover the pod lifecycle for a Kiro Crew source worktree. pod api remains unavailable on Windows because the private request channel requires a Unix-domain socket.

With Dev Fleet enabled under Apps > Library, an agent can start or stop a worktree pod and receive its address, port, and short-lived token without leaving the chat.

Learn more ->

## Skills Discovered by Search

skills.max_triggered now defaults to 0. Sessions receive a short skill index and agents use skill_search to load relevant instructions, instead of injecting every trigger match automatically. Set a positive value to allow up to that many matched skills to inject per message.

Learn more ->

Improvements

Fixes

Sep 23, 2026
2.24.0CLI

## Session-Wide Tool Approval, Session Dashboard Controls, and Environment Isolation

Use session-wide tool approval in V3, combine session dashboard filters, and control which environment variables your chats and tools inherit.

This release adds session-wide tool approval to V3 and makes /sessions controls easier to discover and combine. Project .env files no longer load automatically into chat sessions, MCP servers, or tools. In V2, image handling now recovers when images exceed supported dimensions. Terminal rendering, settings, and agent config upgrades also receive reliability updates.

## Session-wide tool approval (V3)

Run /tools trust-all to automatically approve tool calls for the rest of the current V3 session. By default, Kiro shows a safety warning and asks you to confirm before enabling it, so enable trust-all only in an environment you trust. Learn more ->

## Session dashboard controls (V3)

In /sessions, open the Filter, Sort, or Group control to see its options inline. You can combine the current workspace, main sessions, and bookmarked filters; includes empty reveals empty sessions, which are hidden by default. Learn more ->

## Environment isolation

Project .env files no longer load automatically into chat sessions, MCP servers, or tools. Kiro starts with the environment inherited from your terminal. If your workflow relies on variables from a project .env, export them in your shell before starting Kiro. For MCP servers, reference the exported values in the server configuration. Learn more ->

## More resilient image handling (V2)

In V2, Kiro resizes images that exceed supported dimensions while preserving their aspect ratio, and scales down oversized images in saved history when a session loads. If the model provider still rejects an image, Kiro retries automatically, then replaces the rejected images with a placeholder and shows a notice so the conversation can continue. Learn more ->

Improvements

Fixes

Sep 22, 2026
Web

## Reasoning Effort and a Grouped Timeline

Kiro Web now lets you choose reasoning effort for supported models, and folds reasoning and tool activity into a collapsible timeline so the agent's response stays in view. Document attachments hold up across long sessions, sessions reconnect when you return to a background tab, and Reviews and What's new are easier to find.

## Choose the Reasoning Effort for a Model

For models that offer reasoning levels, choose a lower effort for quick edits or a higher one for work that needs more care. The selector appears only when the model supports it, holds its place while levels load, and supports keyboard navigation. Learn more ->

## A Timeline That Stays Out of the Way

Consecutive reasoning steps and tool calls now fold into one collapsible block, keeping the agent's response in view. Expand it for the details. Startup actions group under a single Session setup row. Steering, Configuration Sync, and task lists present their results in a more readable form. Learn more ->

## Attach Documents Across a Long Session

Uploading a sixth document partway through a long session no longer blocks new attachments. The five-document limit applies to each message instead of accumulating across the session, so earlier uploads no longer block later messages. Affected sessions recover on the next message without a reset or restart.

## Sessions Reconnect When You Return to the Tab

A Kiro Web tab left in the background now reconnects when you return and replays session activity that arrived while you were away. This restores the latest session state after sleep or a network change without requiring another message. Learn more ->

Improvements

Fixes

Sep 21, 2026
2.23.0CLI

Latest Patches

2.23.1Sep 23, 2026

## Reasoning Controls and Cloud Sessions

Configure thinking and effort from /model and start V3 cloud sessions before connecting a repository.

This release brings reasoning controls into /model and lets V3 cloud sessions start before you connect a repository. Improvements add clearer live progress, smoother streaming, and more efficient fullscreen scrolling. Reliability fixes cover models, sessions, tools, and non-interactive runs.

## Reasoning controls in /model

Open /model to switch models and configure the selected model's thinking and effort in one place. The panel shows only the options supported by that model and saves your choices for future sessions. /model is now the primary interface for reasoning settings. In V2, bare /effort is a legacy command: it shows a deprecation warning and opens the Effort setting in /model; /effort <level> remains supported. In V3, /effort continues to open its own picker. Learn more ->

## Cloud sessions before repository connection (V3)

You can start a cloud session before connecting a repository. Run /repo when you're ready to attach one. If no source provider is connected, Kiro opens the connection screen, where the repository is marked as optional. Learn more ->

Improvements

Fixes

Patches

Sep 16, 2026
Models

## Claude Fable 5.1 Preview Begins Rolling Out to Kiro Enterprise

Claude Fable 5.1 is beginning to roll out in Preview across Kiro clients for Kiro Enterprise organizations. Anthropic's most capable agentic coding model traces problems to root causes, maintains context and intent across complex tasks, and improves reliability for multi-file refactors and long autonomous runs. It has a 1M context window and a 6x credit multiplier. Inference runs only in US East (N. Virginia) (us-east-1).

Availability is limited during the Preview rollout. Organizations with access can enable Fable 5.1 through model governance. After model access management is enabled, administrators can add Fable 5.1 from Manage approved list and make it available to their users.

All Fable 5.1 traffic is retained for up to 30 days (unless otherwise required by law) for automated offline abuse detection. Classifier-flagged traffic will be subject to potential human review performed by AWS, and we may review flagged traffic for abuse. Learn more ->

Sep 16, 2026
2.22.0CLI

Latest Patches

2.22.1Sep 17, 2026

## Fullscreen Chat and Streamlined Sessions

Expand chat to a dedicated terminal screen, browse a streamlined V3 session dashboard, and keep long sessions running reliably.

This release adds fullscreen chat for interactive TUI and Lite sessions, streamlines the V3 session dashboard, and improves reliability during long-running work.

## Fullscreen chat

Type /fullscreen to move the current conversation to a dedicated terminal screen with its own scrollable view, independent of your shell history. Type /fullscreen again to return inline. Fullscreen is available in interactive TUI and Lite sessions on both V2 and V3.

Scroll with your mouse, touchpad, or keyboard, and click and drag to copy selected text. To start future interactive TUI sessions in fullscreen, open /settings, choose Display, and turn on Start fullscreen. Learn more ->

## Streamlined session dashboard (V3)

/sessions has been redesigned: search, filter, sort, and grouping controls are now separated from the session list. It opens as a flat list ordered by last use, supports sorting by last use, session name, or message count, and remembers your selection. Use Tab to move between the controls and results. Learn more ->

Improvements

Fixes

Patches

Sep 14, 2026
Models

## GPT-5.6 Sol, Terra, and Luna upgraded to 1M context window

GPT-5.6 Sol, Terra, and Luna now support a 1M token context window, up from 272K, in the Kiro IDE, CLI, and Web. Entire codebases, long-form documents, and extended multi-turn agent histories fit in a single request, so repository-scale refactors, end-to-end debugging, and long-horizon agentic tasks run without chunking or losing earlier context. Credit multipliers for the GPT-5.6 family are updated with this launch and follow the two-tier context model OpenAI and Amazon Bedrock use: requests up to 272K tokens bill at the short context rate (Sol 4.4x, Terra 2.2x, Luna 1.1x), and requests above 272K tokens bill at double that rate. 1M context is rolling out gradually with experimental support to Kiro Pro, Pro+, Pro Max, and Power customers. Restart your IDE or CLI, or refresh Kiro Web, to see the updated models. Learn more ->

Sep 14, 2026
1.1IDE

Latest Patches

1.1.70Sep 24, 2026

## Agent Artifacts and Native ARM64 Builds

IDE 1.1 lets agents produce durable artifacts you can review and return to, adds native ARM64 builds for Windows and Linux, and updates the editor foundation to Code OSS 1.131. Compacted conversations retain the right context, MCP failures are clearer, Hooks are more reliable, and enterprise profiles route requests to the selected region.

## Review agent-created artifacts

Kiro can turn documents, diagrams, code, images, and other agent outputs into durable artifacts instead of leaving them buried in the chat transcript. Open a compact preview from the conversation, review the full artifact beside the chat in Agent Focus, or return to it from the Agent Focus context panel. Learn more ->

## Install Kiro natively on ARM64

Install native ARM64 builds for Windows and Linux instead of relying on x64 emulation. Choose the ARM64 download for your platform from the Kiro downloads page.

## Recent IDE 1.0 highlights

These capabilities shipped earlier in the IDE 1.0 release line and are included here for context.

- Cloud Configuration and synced Powers (1.0.437): Access supported personal configuration across IDE surfaces and try cloud-synced Powers from the installed list. Release notes ->

- Permission improvements and configured Windows shells (1.0.337): Keep ignored files out of search, apply filesystem and command permission rules more accurately, and run agent commands in your configured Windows terminal profile. Release notes ->

- Cloud Sessions and Agent Focus upgrades (1.0.293): Start Cloud Sessions from Agent Focus, collapse the session rail for more chat space, answer attention cards in place, and move back or forward between views. Release notes ->

- Agent Plugin support and session pinning (1.0.288): Use Agent Plugins through Powers and pin important Agent Focus sessions. Release notes ->

Improvements

Fixes

Patches

Sep 11, 2026
2.21.4CLI

## Session Search Scope, V2 Harness Flag, and Unified Settings Keyboard

Choose whether session search covers agent responses, run a single session on the V2 harness, and move through every settings menu with the same keys.

This version lets you choose what session search covers, adds a flag that selects the V2 agent harness for a single run, and gives every settings menu the same keyboard behavior.

## Choose what session search covers

In V3, /sessions search indexes session titles, your prompts, and agent responses, so you can find a session by what Kiro answered rather than only by what you asked. Open /settings and choose Session search to switch between Prompts only and Prompts and agent responses. Tool output is not indexed in either mode. If your local index currently covers prompts only, /sessions asks once before rebuilding it. Learn more ->

## Select the agent harness for a single run

Pass --v2 to run one session on the V2 agent harness. It works on both kiro-cli and kiro-cli chat, and it takes precedence over a saved chat.agentEngine value without overwriting it, so your default stays as you set it. Learn more ->

Improvements

Fixes

123...13

Loading image...

## Product
- About Kiro
- IDE
- CLI
- Web
- Mobile
- Crew
- Pricing
- Downloads

## For
- Enterprise
- Startups
- Students

## Community
- Overview
- Ambassadors
- Discord
- Events
- Powers
- Shop
- Showcase

## Resources
- Docs
- Blog
- Changelog
- FAQs
- Report a bug
- Suggest an idea
- Billing support

## Social
- 
- 
- 
- 
- 
- 
- 

English

Site TermsLicenseResponsible AI PolicyLegalPrivacy PolicyCookie PreferencesEnglish

Loading image...

- Apps
- CLI
- Web
- Enterprise
- Pricing
- Docs
- Community
- Resources

SIGN INDOWNLOADS

Loading image...
