<!-- fonte: https://cursor.com/changelog -->

Skip to content
Cursor

- Models↓

- Grok
- Evals

- Product↓

- Agents
- Cloud
- Grok Bot ↗
- Mobile
- Automations
- CLI
- Marketplace ↗
- Review

- Enterprise
- Pricing
- Resources↓

- Changelog
- Blog
- Docs
- Community
- Help ↗
- Workshops
- Forum ↗
- Careers

- Models →
- Product →
- 
Enterprise

- 
Pricing

- Resources →

Sign inContactContact salesDownload

Changelog

Sep 23, 2026 · Changelog

## Rollouts and Security Review

Today we're launching two Cursor bots for the last mile of shipping code. Rollouts watches every change as it deploys and reports its health per environment. Security Review reports exploitable bugs on every pull request.

Both are available today on Teams and Enterprise plans.

## #Rollouts

Rollouts attaches a monitor to every pull request and watches the change as it deploys, reporting change health per environment: verified healthy, regression detected, or inconclusive. It's the Cursor version of Firetiger Change Monitors, rebuilt with the Bot Development Kit.

Enable it from the dashboard and connect source control, your deploy system, and your telemetry provider. Rollouts starts watching on the next pull request.

## #Monitoring plans

When a pull request opens, Rollouts reads the diff and the systems it touches, then writes a monitoring plan as a PR comment. The plan lists the risks it identified, the effect the change is meant to have, the signals it will check, and any gaps in instrumentation that would make the change hard to verify. Edit the plan in the PR and Rollouts uses your version.

## #Deploy tracking

Rollouts wakes on deploy events for the change's commit and runs the plan against your logs, metrics, and traces. It tracks each environment separately, so a change can be verified in staging and still flagged in production. Rollouts checks the change's intended effect alongside error and latency signals, and reports back on the PR when it reaches a verdict.

## #Regressions

When Rollouts detects a regression, it names the change it suspects and notifies the author. Depending on configuration, it can also open a revert PR for review or hand the finding to a cloud agent for a fix. Rollouts does not merge or roll back on its own today.

## #Integrations

Rollouts connects to Origin or GitHub for source control, to your continuous delivery system for deploy events, and to Datadog and other telemetry providers for signals. Feature flag integration is coming soon.

## #Security Review

Security Review is available today. It reads every pull request in the context of the codebase and posts one review comment reporting exploitable bugs. Style and quality stay with Bugbot.

Enable it from the dashboard for the repositories you want reviewed. Draft PRs are skipped.

## #What it reports

Security Review looks for injection across SQL, command, and template surfaces, along with authentication and authorization bypasses, including checks that a refactor stopped running. It also flags secrets and credentials committed to source, SSRF and unvalidated redirects, unsafe deserialization, and dependency changes that introduce known vulnerabilities. It traces where user input enters and what it passes through.

## #Findings

Each finding carries a severity, the attack path, and a proposed fix. Dismiss one with a reason and Security Review won't raise it again on that PR.

## #Team rules

Add rules for your codebase, such as which client external calls must go through or which tables are never queried from a request handler, and Security Review enforces them on every PR.

## #Get started

Rollouts and Security Reviewer are available today on Teams and Enterprise plans. Enable either bot from the automations tab.

For the next 10 days, we're including usage credits so teams can try Rollouts on real changes. Teams and Enterprise customers receive credits for roughly 50 and 500 changes, respectively.

Sep 10, 2026 · Changelog

## Cursor Projects

Today we're launching Projects in Cursor. Projects lets you take on larger bodies of work, such as a feature, a migration, or a full app. It maintains context over months of work, delegates tasks to thousands of subagents, and performs recurring work without being prompted.

Access Projects from the left-hand nav. The coordinator agent in a project doesn't write code itself; it plans the work, delegates it to agents that implement it, and brings the finished work back to you to check. Coordinators create and manage agents on your behalf, running as many in parallel as the work needs.

## #Powered by Cloud Agents

A Project runs on its own computer in the cloud, so closing your laptop doesn't stop it. When something needs testing on your machine, the coordinator spins up a local agent to run it there.

## #Shared context

You shouldn't have to onboard an agent every time you start a task. Each Project maintains a set of files that sync across every cloud and local machine its agents use. Agents add research and artifacts, along with what they learn about the codebase and how you prefer work to be done. If one agent figures out how to test a service, for example, every future agent can use those instructions. The shared context grows with the Project, making the coordinator more effective over time.

## #Subscriptions

Tell the coordinator agent to watch a Slack channel, run on a schedule, or follow all your PRs. This way it can take action based on signals it detects, without waiting for your prompt.

Connect Slack and point it at a bug-report channel, and it starts delegating each time a bug comes in.

Projects are available in beta and rolling out to all users starting today.

Sep 2, 2026 · Changelog

## Self-hosted machines

Cursor supports self-hosted machines, which let you keep tool execution entirely in your own network.

Your codebase, build outputs, and secrets all stay on internal machines running in your infrastructure, while the agent handles tool calls locally.

## #Dynamic pool scheduling

My Machines connects a single laptop or VM to your account for personal workflows.

Team pools are named queues of workers for a team or enterprise. Capacity can grow as requests arrive and shrink when workers disconnect, so your self-hosted machines can scale with demand. Pools are not tied to one repository: name the pool, and any available worker can claim the request.

Pools can also hibernate idle machines, then restore within a reconnect window when a follow-up arrives, so you don't keep expensive capacity warm just for the next prompt.

## #Run on your sandboxes

Cloud agents can now execute on infrastructure you already use, including from AWS Lambda, Coder, Cloudflare, Daytona, Modal, Namespace, Vercel, and E2B.

## #Computer use on Linux and Mac

Self-hosted workers now support computer use on Linux and Mac. With the right desktop packages, an agent can click, type, take screenshots, and drive the browser. You can watch its desktop or take control from Cursor.

Aug 27, 2026 · Changelog

## Start from scratch, without a repo

Cloud Agents no longer require a connected GitHub or other third-party SCM provider to get started. Prompt from the get-go, then save your work to a Cursor Origin repo.

## #Get started

Select Start from scratch in the repo picker, then prompt the agent. In the background, Cursor creates an Origin repo for you.

## #Turn it into a real repo, whenever you want

Once the agent's build is to your liking, click the Create repo button to save your work in an Origin repo. Choose a custom name or pick one of the suggested ones, then set the visibility to private or internal. You'll get a fully scaffolded Origin repo, ready to share or keep building on. Navigate to the Codebase tab to find your repo and access your project.

## #A live preview, right in the browser

Cursor now port-forwards your cloud agent's live environment straight to your browser, so you can preview it and use tools like design mode.

## #Publish your work

Connect a Vercel account and hit publish to get a live URL for what you built.

A Vercel account is required to use the publish feature.

Get started today.

Aug 19, 2026 · Changelog

## Cloud Agents and Cursor Harness Improvements

We're continuing to improve cloud agents and the Cursor harness so always-on agents can operate as a system, building and shipping software on their own without the need for intervention at each loop.

With this release, cloud agents can automatically pick up work in response to events, hold a goal until it's met, and stay on course through long-running sessions.

## #Subscriptions

Cursor can now monitor your PRs, watch a Slack thread, or run scheduled tasks. Cursor Agent subscribes to an event source (a thread or conversation) and wakes when something happens. Subscriptions are available for cloud agents only, for now.

Cloud agents automatically subscribe to PRs they create and drive them to completion, fixing CI and addressing bot comments. In Slack, ask @cursor check back in an hour and keep going until that feedback is in.

## #Custom modes

Use any skill as a Custom Mode: a skill that stays pinned in the chat. Custom modes keep agents focused on a skill - you can think about it like "always on" skills.

From /, pick a skill and press ⌥⏎ (Mac) or Alt+Enter (Windows), or choose Use as Mode.

## #Subagents on their own machines

Subagents can now run on their own virtual machines. Each gets an isolated copy of the project with clean context in its own cloud environment.

Have subagents test the parent agent's changes in fresh environments or swarm independent fixes without collisions. Try run a swarm of subagents to test my app for bugs, each in its own environment.

## #/goal

Use /goal to give the agent a long-lived objective to work towards until it's fully complete.

Try /goal fix all flaky tests and make CI green in a new chat. Pair it with a custom mode to follow a playbook, or /loop for recurring check-ins.

## #Steering improvements

You can now send a message to steer the agent while it's working without interruption. Follow-ups wait for the next tool call instead of cutting the agent off mid-action.

Type a follow-up and hit Send now, or press ⏎ twice.

Next →Older posts

## Product
- Agents
- Teams
- Enterprise
- Pricing
- Code Review
- CLI
- Cloud Agents
- Composer
- Marketplace ↗

## Resources
- Download
- Changelog
- Docs
- Learn ↗
- Value Calculator
- Forum ↗
- Help ↗
- Workshops
- Status ↗

## Company
- Careers
- Blog
- Community
- Students
- Brand
- Future
- Anysphere ↗

## Legal
- Terms of Service
- Acceptable Use Policy
- Grok Bot Terms
- Privacy Policy
- Cookie Policy
- Data Use
- Security

## Connect
- X ↗
- LinkedIn ↗
- YouTube ↗

© 2026 Anysphere, Inc.🛡 SOC 2 | ISO27001 | ISO42001 | AIUC-1 Certified

🌐English↓

- English✓
- 简体中文
- 日本語
- 繁體中文
- Español
- Français
- Português
- 한국어
- Deutsch
- हिन्दी

Skip to content
Cursor

- Models↓

- Grok
- Evals

- Product↓

- Agents
- Cloud
- Grok Bot ↗
- Mobile
- Automations
- CLI
- Marketplace ↗
- Review

- Enterprise
- Pricing
- Resources↓

- Changelog
- Blog
- Docs
- Community
- Help ↗
- Workshops
- Forum ↗
- Careers

- Models →
- Product →
- 
Enterprise

- 
Pricing

- Resources →

Sign inContactContact salesDownload

Changelog

Sep 23, 2026 · Changelog

## Rollouts and Security Review

Today we're launching two Cursor bots for the last mile of shipping code. Rollouts watches every change as it deploys and reports its health per environment. Security Review reports exploitable bugs on every pull request.

Both are available today on Teams and Enterprise plans.

## #Rollouts

Rollouts attaches a monitor to every pull request and watches the change as it deploys, reporting change health per environment: verified healthy, regression detected, or inconclusive. It's the Cursor version of Firetiger Change Monitors, rebuilt with the Bot Development Kit.

Enable it from the dashboard and connect source control, your deploy system, and your telemetry provider. Rollouts starts watching on the next pull request.

## #Monitoring plans

When a pull request opens, Rollouts reads the diff and the systems it touches, then writes a monitoring plan as a PR comment. The plan lists the risks it identified, the effect the change is meant to have, the signals it will check, and any gaps in instrumentation that would make the change hard to verify. Edit the plan in the PR and Rollouts uses your version.

## #Deploy tracking

Rollouts wakes on deploy events for the change's commit and runs the plan against your logs, metrics, and traces. It tracks each environment separately, so a change can be verified in staging and still flagged in production. Rollouts checks the change's intended effect alongside error and latency signals, and reports back on the PR when it reaches a verdict.

## #Regressions

When Rollouts detects a regression, it names the change it suspects and notifies the author. Depending on configuration, it can also open a revert PR for review or hand the finding to a cloud agent for a fix. Rollouts does not merge or roll back on its own today.

## #Integrations

Rollouts connects to Origin or GitHub for source control, to your continuous delivery system for deploy events, and to Datadog and other telemetry providers for signals. Feature flag integration is coming soon.

## #Security Review

Security Review is available today. It reads every pull request in the context of the codebase and posts one review comment reporting exploitable bugs. Style and quality stay with Bugbot.

Enable it from the dashboard for the repositories you want reviewed. Draft PRs are skipped.

## #What it reports

Security Review looks for injection across SQL, command, and template surfaces, along with authentication and authorization bypasses, including checks that a refactor stopped running. It also flags secrets and credentials committed to source, SSRF and unvalidated redirects, unsafe deserialization, and dependency changes that introduce known vulnerabilities. It traces where user input enters and what it passes through.

## #Findings

Each finding carries a severity, the attack path, and a proposed fix. Dismiss one with a reason and Security Review won't raise it again on that PR.

## #Team rules

Add rules for your codebase, such as which client external calls must go through or which tables are never queried from a request handler, and Security Review enforces them on every PR.

## #Get started

Rollouts and Security Reviewer are available today on Teams and Enterprise plans. Enable either bot from the automations tab.

For the next 10 days, we're including usage credits so teams can try Rollouts on real changes. Teams and Enterprise customers receive credits for roughly 50 and 500 changes, respectively.

Sep 10, 2026 · Changelog

## Cursor Projects

Today we're launching Projects in Cursor. Projects lets you take on larger bodies of work, such as a feature, a migration, or a full app. It maintains context over months of work, delegates tasks to thousands of subagents, and performs recurring work without being prompted.

Access Projects from the left-hand nav. The coordinator agent in a project doesn't write code itself; it plans the work, delegates it to agents that implement it, and brings the finished work back to you to check. Coordinators create and manage agents on your behalf, running as many in parallel as the work needs.

## #Powered by Cloud Agents

A Project runs on its own computer in the cloud, so closing your laptop doesn't stop it. When something needs testing on your machine, the coordinator spins up a local agent to run it there.

## #Shared context

You shouldn't have to onboard an agent every time you start a task. Each Project maintains a set of files that sync across every cloud and local machine its agents use. Agents add research and artifacts, along with what they learn about the codebase and how you prefer work to be done. If one agent figures out how to test a service, for example, every future agent can use those instructions. The shared context grows with the Project, making the coordinator more effective over time.

## #Subscriptions

Tell the coordinator agent to watch a Slack channel, run on a schedule, or follow all your PRs. This way it can take action based on signals it detects, without waiting for your prompt.

Connect Slack and point it at a bug-report channel, and it starts delegating each time a bug comes in.

Projects are available in beta and rolling out to all users starting today.

Sep 2, 2026 · Changelog

## Self-hosted machines

Cursor supports self-hosted machines, which let you keep tool execution entirely in your own network.

Your codebase, build outputs, and secrets all stay on internal machines running in your infrastructure, while the agent handles tool calls locally.

## #Dynamic pool scheduling

My Machines connects a single laptop or VM to your account for personal workflows.

Team pools are named queues of workers for a team or enterprise. Capacity can grow as requests arrive and shrink when workers disconnect, so your self-hosted machines can scale with demand. Pools are not tied to one repository: name the pool, and any available worker can claim the request.

Pools can also hibernate idle machines, then restore within a reconnect window when a follow-up arrives, so you don't keep expensive capacity warm just for the next prompt.

## #Run on your sandboxes

Cloud agents can now execute on infrastructure you already use, including from AWS Lambda, Coder, Cloudflare, Daytona, Modal, Namespace, Vercel, and E2B.

## #Computer use on Linux and Mac

Self-hosted workers now support computer use on Linux and Mac. With the right desktop packages, an agent can click, type, take screenshots, and drive the browser. You can watch its desktop or take control from Cursor.

Aug 27, 2026 · Changelog

## Start from scratch, without a repo

Cloud Agents no longer require a connected GitHub or other third-party SCM provider to get started. Prompt from the get-go, then save your work to a Cursor Origin repo.

## #Get started

Select Start from scratch in the repo picker, then prompt the agent. In the background, Cursor creates an Origin repo for you.

## #Turn it into a real repo, whenever you want

Once the agent's build is to your liking, click the Create repo button to save your work in an Origin repo. Choose a custom name or pick one of the suggested ones, then set the visibility to private or internal. You'll get a fully scaffolded Origin repo, ready to share or keep building on. Navigate to the Codebase tab to find your repo and access your project.

## #A live preview, right in the browser

Cursor now port-forwards your cloud agent's live environment straight to your browser, so you can preview it and use tools like design mode.

## #Publish your work

Connect a Vercel account and hit publish to get a live URL for what you built.

A Vercel account is required to use the publish feature.

Get started today.

Aug 19, 2026 · Changelog

## Cloud Agents and Cursor Harness Improvements

We're continuing to improve cloud agents and the Cursor harness so always-on agents can operate as a system, building and shipping software on their own without the need for intervention at each loop.

With this release, cloud agents can automatically pick up work in response to events, hold a goal until it's met, and stay on course through long-running sessions.

## #Subscriptions

Cursor can now monitor your PRs, watch a Slack thread, or run scheduled tasks. Cursor Agent subscribes to an event source (a thread or conversation) and wakes when something happens. Subscriptions are available for cloud agents only, for now.

Cloud agents automatically subscribe to PRs they create and drive them to completion, fixing CI and addressing bot comments. In Slack, ask @cursor check back in an hour and keep going until that feedback is in.

## #Custom modes

Use any skill as a Custom Mode: a skill that stays pinned in the chat. Custom modes keep agents focused on a skill - you can think about it like "always on" skills.

From /, pick a skill and press ⌥⏎ (Mac) or Alt+Enter (Windows), or choose Use as Mode.

## #Subagents on their own machines

Subagents can now run on their own virtual machines. Each gets an isolated copy of the project with clean context in its own cloud environment.

Have subagents test the parent agent's changes in fresh environments or swarm independent fixes without collisions. Try run a swarm of subagents to test my app for bugs, each in its own environment.

## #/goal

Use /goal to give the agent a long-lived objective to work towards until it's fully complete.

Try /goal fix all flaky tests and make CI green in a new chat. Pair it with a custom mode to follow a playbook, or /loop for recurring check-ins.

## #Steering improvements

You can now send a message to steer the agent while it's working without interruption. Follow-ups wait for the next tool call instead of cutting the agent off mid-action.

Type a follow-up and hit Send now, or press ⏎ twice.

Next →Older posts

## Product
- Agents
- Teams
- Enterprise
- Pricing
- Code Review
- CLI
- Cloud Agents
- Composer
- Marketplace ↗

## Resources
- Download
- Changelog
- Docs
- Learn ↗
- Value Calculator
- Forum ↗
- Help ↗
- Workshops
- Status ↗

## Company
- Careers
- Blog
- Community
- Students
- Brand
- Future
- Anysphere ↗

## Legal
- Terms of Service
- Acceptable Use Policy
- Grok Bot Terms
- Privacy Policy
- Cookie Policy
- Data Use
- Security

## Connect
- X ↗
- LinkedIn ↗
- YouTube ↗

© 2026 Anysphere, Inc.🛡 SOC 2 | ISO27001 | ISO42001 | AIUC-1 Certified

🌐English↓

- English✓
- 简体中文
- 日本語
- 繁體中文
- Español
- Français
- Português
- 한국어
- Deutsch
- हिन्दी
