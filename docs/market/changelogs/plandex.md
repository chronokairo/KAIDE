## server/v2.2.1 — 2025-07-16

See CLI 2.2.1 release notes.

## cli/v2.2.1 — 2025-07-16

## 🖇️  Connect your Claude Pro or Max subscription

If you have a Claude Pro or Max subscription, Plandex can use it when calling Anthropic models. You can use it in either Integrated Models Mode on Plandex Cloud, or in BYO Key Mode (whether on Cloud or self-hosting).

Assuming you're using Anthropic models (which the default model pack does), you'll be asked if you want to connect your Claude subscription the first time you run Plandex. Follow the instructions to connect.

[Learn more in the docs.](https://docs.plandex.ai/models/claude-subscription)

## 🐞  Bug fixes

Fixed an [issue](https://github.com/plandex-ai/plandex/issues/291) with custom models and providers.

## server/v2.2.0 — 2025-07-01

See CLI 2.2.0 release notes.

## cli/v2.2.0 — 2025-07-01

This is a big release that is mainly focused on Plandex's model provider and model config system. It significantly increases model provider flexibility, makes custom model configuration much easier, reduces costs on Cloud, and adds built-in support for Ollama.

## 🔌  Model provider flexibility for BYO key mode

- Now when using Plandex in BYO key mode (either Cloud or self-hosted), you can easily use Plandex with a wide range of built-in model providers.

- Apart from OpenRouter and the OpenAI API (which were already built-in), built-in providers now include:
  - Anthropic API
  - Google AI Studio
  - Google Vertex AI
  - Azure OpenAI
  - AWS Bedrock
  - DeepSeek API
  - Perplexity API
  - Ollama (for local models—see below for details)

- See the new [model provider docs](https://docs.plandex.ai/models/model-providers) for more details.

![plandex-model-providers](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/2.2.0/new-providers.gif)

## 🛟  Provider fallback

- When API keys/credentials are provided for multiple providers for a model, Plandex will fail over to the last valid provider if the first one fails. This is especially useful when using a direct provider (like OpenAI or Anthropic) alongside OpenRouter. If the direct call fails, Plandex will fall back to OpenRouter, which has its *own* internal fallback system across multiple providers. You get the best of both worlds: direct access by default, with no additional cost or latency, plus multi-layered resilience in case of stability issues.

## 💰  5.5% price reduction for Plandex Cloud Integrated Models mode

- Thanks to the new model provider system described above, Plandex Cloud with Integrated Models mode can now make direct provider calls under the hood rather than defaulting to OpenRouter, which allows us to avoid OpenRouter's 5.5% surcharge on model calls and pass the savings on to you. OpenRouter is still used as a fallback for added resilience.

## ⚙️  JSON-based model config with IDE support

- Plandex now supports JSON-based model config, which make it much easier to try out different models, different settings, and to use custom models, providers, and model packs.

- The new JSON model config system integrates cleanly with your IDE or editor. When you first edit model settings, Plandex will prompt you to set a preferred editor, and the JSON config file will be opened in that editor.

- Model config files use JSON schemas, which allows for autocomplete, validation, and inline documentation/type hints in most IDEs and editors.

- Check out the new docs for [model settings](https://docs.plandex.ai/models/model-settings) and [custom models](https://docs.plandex.ai/models/custom-models) for full details.

### `set-model` and `set-model default` commands

- `set-model` has been simplified to work with the new system. If run without arguments, you'll be prompted to either select a built-in or custom model pack, or to directly edit the current plan's model config inline in JSON. You can also pass it a model pack name (`set-model daily-driver`) or jump straight to the JSON settings with `set-model --json`.

- `set-model default` works the same way, but allows you to configure the default model settings for new plans.

![plandex-model-settings-json](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/2.2.0/model-settings-json.gif)


### `models custom` command

- `models custom` is a new all-in-one command for managing custom providers, models, and model packs in one place. It replaces the `models add`, `models delete`, `model-packs create`, `model-packs update`, and `model-packs delete` commands.

- The first time you run it, if you haven't already configured any custom models or model packs, an example config file will be created to get you started. If you *do* already have custom models or model packs configured, the config file will be populated with those models and model packs.

![plandex-custom-models-json](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/2.2.0/custom-models-json.gif)

### `models` and `models default` commands

- The `models` and `models default` commands now show simplified output by default, with a new `--all` flag to show all properties.

- These commands also now show all fallback models (for large context, large output, errors, etc.) for each role, including multiple levels of fallback, which previously weren't always included in the output.

## 🦙  Built-in Ollama support

- Plandex now offers built-in support for Ollama, which makes it much easier to use local models. Check out the new [Ollama quickstart](https://docs.plandex.ai/models/ollama) for details.

![plandex-ollama](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/2.2.0/ollama.gif)

## 📖  Built-in models and models packs

- The docs now include all built-in [models](https://docs.plandex.ai/models/built-in/built-in-models) and [model packs](https://docs.plandex.ai/models/built-in/built-in-packs), making it easier to see what's available, and the settings for each model/model pack.

## 🧠  New built-in models

- `mistral/devstral-small`, with both OpenRouter and Ollama providers.

- The Qwen 3 series of models, from 8B to 235B, available with `cloud` variants for OpenRouter and `local` variants for Ollama.

- Distilled local versions of `deepseek/r1`, from 8b to 70b, available with Ollama provider.

## 🎛️  New model packs

- The `gemini-exp` model pack has been removed, and in its place there's now a new `gemini-planner` model pack, which uses Gemini 2.5 Pro for planning and context selection, and the default models for other roles, as well as a new `google` model pack, which uses either Gemini 2.5 Pro or Gemini 2.5 Flash for all roles.

- A new `o3-planner` model pack has been added, which uses OpenAI o3-medium for planning and context selection, and the default models for other roles.

## 🔄  Other built-in model updates

- Built-in Gemini 2.5 Pro and Gemini 2.5 Flash models now use the latest model identifiers (replacing old 2.5 Pro Preview and 2.5 Flash Preview identifiers)

- The `gemini-preview` model pack has been removed, and a new `gemini-planner` model pack has been added, which uses Gemini 2.5 Pro for planning and context selection, and the default models for other roles.

- OpenAI o3 models have had their pricing drastically reduced when using Plandex Cloud with Integrated Models mode—input tokens now cost $2/M, output $8/M, an 80% reduction.

- The `deepseek/r1` model has been updated to use the latest model identifier (`deepseek/deepseek-r1-0528`) on OpenRouter.

## 🐞  Bug fixes

- Fixed a file mapping bug for TypeScript files that caused directly exported symbols like `export const foo = 'bar'` to be omitted from map files. Also improved TypeScript mapping support for some other constructs like `declare global`, `namespace`, and `enum` blocks, and improved handling of arrow functions. Thanks to @mnahkies for the [PR](https://github.com/plandex-ai/plandex/pull/239) identifying this.

## 🔧  Other changes

- `plandex checkout` now has a `--yes/-y` flag to auto-confirm creating a new branch if it doesn't exist, so the command can be used for scripting with no user interaction.

- `plandex tell`, `plandex continue`, and `plandex build` all now support a `--skip-menu` flag to skip the interactive menu that appears when the response finishes and changes are pending. There's also a new `skip-changes-menu` config setting that can be set to `true` to skip this menu by default.

## server/v2.1.8 — 2025-06-08

- Fix for potential hang in file map queue

## server/v2.1.7 — 2025-06-04

- Fix for "conversation summary timestamp not found in conversation" error (https://github.com/plandex-ai/plandex/issues/274)
- Fix for potential panic/crash during plan stream (https://github.com/plandex-ai/plandex/issues/275)
- Better protection against panics/crashes in server goroutines across the board

## server/v2.1.6+1 — 2025-05-27

See CLI 2.1.6+1 release notes.

## server/v2.1.6 — 2025-05-27

See CLI 2.1.6 release notes.

## cli/v2.1.6+1 — 2025-05-27

- Error handling fix
- Fix for some roles in the `daily-driver` model pack that weren't correctly updated to Sonnet 4 in 2.1.6
- Added fallback from Sonnet 4 to Sonnet 3.7 to deal with occasional provider errors and rate limit issues

## cli/v2.1.6 — 2025-05-27

- The newly released Claude Sonnet 4 is now stable in testing, so it now replaces Sonnet 3.7 as the default model for context sizes under 200k across all model packs where 3.7 was previously used.
- A new `strong-opus` model pack is now available. It uses Claude Opus 4 for planning and coding, and is otherwise the same as the 'strong' pack. Use it with `\set-model strong-opus` to try it out.
- The `opus-4-planner` model pack that was introduced in 2.1.5 has been renamed to `opus-planner`, but the old name is still supported. This model pack uses Claude Opus 4 for planning, and the default models for other roles.
- Fix for occasional garbled error message when the model is unresponsive.
- Fix for occasional 'couldn't aquire lock' error after stream finishes.
- Additional retry when model is unresponsive or hits provider rate limits—helps particularly with new Opus 4 model on OpenRouter.

## server/v2.1.5 — 2025-05-24

See CLI 2.1.5 release notes.

## cli/v2.1.5 — 2025-05-24

- Added newly released Claude Sonnet 4 and Claude Opus 4 as built-in models.
- Sonnet 4 isn't yet used in the default 'daily-driver' model pack due to sporadic errors in early testing, but it can be used with the 'sonnet-4-daily' model pack (use '\set-model sonnet-4-daily' to use it). It will be promoted to the default model pack soon.
- Opus 4 can be used with the 'opus-4-planner' model pack ( '\set-model opus-4-planner'), which uses Opus 4 for planning and Sonnet 4 for coding.
- Removed error fallbacks for o4-mini and gemini-2.5-pro-preview.

## server/v2.1.4 — 2025-05-20

- Fix to remove occasional extraneous blank lines from start/end of edited files.

## server/v2.1.3 — 2025-05-19

- Fix for 'panic in execTellPlan' error when using a model pack that doesn't explicitly set the 'coder' or 'whole-file-builder' roles

## cli/v2.1.3 — 2025-05-15

- Fix for default model pack not being correctly applied to new plans
- Fix for potential crash on Linux when applying a plan

## server/v2.1.2 — 2025-05-08

- Fix for auto-load context error: 'Error decoding response → EOF'

## cli/v2.1.2 — 2025-05-08

- Fix for rare auto-load context timeout error when no files are loaded.

## server/v2.1.1+1 — 2025-05-05

- Improve error handling to catch yet another "context length exceeded" error message variation from Anthropic.

## server/v2.1.1 — 2025-05-02

See CLI 2.1.1 release notes.

## cli/v2.1.1 — 2025-05-02

- Fix for free Gemini 2.5 Pro Experimental OpenRouter endpoint.
- Retries for "No endpoints found that support cache control" error that showed up when OpenRouter temporarily disabled caching for Gemini 2.5 Pro Preview.
- Other minor improvements to error handling and retries.

## server/v2.1.0+1 — 2025-04-30

- Fix for context length exceeded error that still wasn't being caught and retried by the fallback correctly.

## cli/v2.1.0+1 — 2025-04-30

- Fix for potential encoding issue when loading files into context.

## cli/v2.1.0 — 2025-04-29

## 🚀  OpenRouter only for BYO key

- When using a BYO key mode (either cloud or self-hosted), you can now use Plandex with **only** an OpenRouter.ai account and `OPENROUTER_API_KEY` set. A separate OpenAI account is no longer required.

- You can still use a separate OpenAI account if desired by setting the `OPENAI_API_KEY` environment variable in addition to `OPENROUTER_API_KEY`. This will cause OpenAI models to make direct calls to OpenAI, which is slightly faster and cheaper.

## 🧠  New Models

### Gemini

- Google's Gemini 2.5 Pro Preview is now available as a built-in model, and is the new default model when context is between 200k and 1M tokens.

- A new `gemini-preview` model pack has been added, which uses Gemini 2.5 Pro Preview for planning and coding, and default models for other roles. You can use this pack by running the REPL with the `--gemini-preview` flag (`plandex --gemini-preview`), or with `\set-model gemini-preview` from inside the REPL. Because this model is still in preview, a fallback to Gemini 1.5 Pro is used on failure.

- Google's Gemini Flash 2.5 Preview is also now available as a built-in model. While it's not currently used by default in any built-in model packs, you can use with `\set-model` or a custom model pack.

### OpenAI

- OpenAI's o4-mini is now available as a built-in model with `high`, `medium`, and `low` reasoning effort levels. o3-mini has been replaced by the corresponding o4-mini models across all model packs, with a fallback to o3-mini on failure. This improves Plandex's file edit reliability and performance with no increase in costs. o4-mini-medium is also the new default planning model for the `cheap` model pack.

- OpenAI's o3 is now available as a built-in model with `high`, `medium`, and `low` reasoning effort levels. Note that if you're using Plandex in BYO key mode, OpenAI requires an organization verification step before you can use o3.

- o3-high is the new default planning model for the `strong` model pack, replacing o1. Due to the verification requirements for o3, the `strong` pack falls back to o4-mini-high for planning if o3 is not available.

- OpenAI's gpt-4.1, gpt-4.1-mini, and gpt-4.1-nano have been added as built-in models, replacing gpt-4o and gpt-4o-mini in all model packs that used them previously.

- gpt-4.1 is now used as a large context fallback for the default `coder` role, effectively increasing the context limit for the implementation phase from 200k to 1M tokens.

- gpt-4.1 is also the new `coder` model in the `cheap` model pack, and is also the new main planning and coding model in the `openai` model pack.

## 🛟  Model Fallbacks

- In order to better incorporate newly released models and preview models that may have initial reliability or capacity issues, a more robust fallback and retry system has been implemented. This will allow for faster introduction of new models in the future while still maintaining a high level of reliability.

- Fallbacks for 'context length exceeded' errors have also been improved, so that these errors will now trigger an automatic fallback to a model with a larger context limit if one is defined in the model pack. This will fix issues like https://github.com/plandex-ai/plandex/issues/232 where the stream errors with a 400 or 413 error when context is exceeded instead of falling back correctly.

## 💰  Gemini Caching

- Gemini models now support prompt caching, significantly reducing costs and latency during planning, implementation, and builds when using Gemini models.

## 🤫  Quieter Reasoning

- When using Claude 3.7 Sonnet thinking model in the `reasoning` AND `strong` model packs, reasoning is no longer included by default. This clears up some issues that were caused by output with specific formatting that Plandex takes action on being duplicated between the reasoning and the main output. It also feels a bit more relaxed to keep the reasoning behind-the-scenes, even though there can be a longer wait for the initial output.

## 💻  REPL Improvements

- Additional handling of possibly incorrect or mistyped commands in the REPL. Now apart from suggesting commands only based on possibly mistyped backslash commands, any likely command with or without the backslash will suggest possible commands rather than sending the prompt straight to the AI model, which can waste tokens due to minor typos or a missing backslash.

## ☁️  Plandex Cloud

- If you started a free trial of Plandex Cloud with BYO Key mode, you can now switch to a trial of Integrated Models mode if desired from your [billing dashboard](https://app.plandex.ai/settings/billing) (use `\billing` from the REPL to open the dashboard).

- When doing a trial in Integrated Models mode, you will now be warned when your trial credits balance goes below $1.00.

- In Integrated Models mode, the required number of credits to send a prompt is now much lower, so you can use more credits before getting an 'Insufficient credits' message.

## 🐞  Bug Fixes

- Fix for 'Plan replacement failed' error during file edits on Windows that was caused by mismatched line endings.

- Fix for 'tool calls not supported' error for custom models that use the XML output format (https://github.com/plandex-ai/plandex/issues/238).

- Fix for errors in some roles with Anthropic models when only a single system message was sent (https://github.com/plandex-ai/plandex/issues/208).

- Fix for potential back-pressure issue with large/concurrent project map operations.

- Plandex Cloud: fix for JSON parsing error on payment form when the card is declined. It will now show the proper error message.

## server/v2.1.0 — 2025-04-28

See CLI 2.1.0 release notes.

## cli/v2.0.7+1 — 2025-04-08

- Small adjustment to previous release: in the REPL, select the first auto-complete suggestion on 'enter' if any suggestions are listed.

## cli/v2.0.7 — 2025-04-08

- Better handling of partial or mistyped commands in the REPL. Rather than falling through to the AI model, a partial `\` command that matches only a single option will default to that command. If multiple commands could match, you'll be given a list of options. For input that begins with a `\` but doesn't match any command, there is now a confirmation step. This helps to prevent accidentally sending mistyped commands the model and burning tokens.

## server/v2.0.6 — 2025-04-03

- Improvements to process management and cleanup for command execution
- Remove extraneous model request logging

## cli/v2.0.6 — 2025-04-03

- Timeout for 'plandex browser' log capture command
- Better failure handling for 'plandex browser' command

## server/v2.0.5 — 2025-04-02

- Fix for a bug that was causing occasional model errors. Model calls should be much more reliable now.
- Better error handling and error messages for model errors (rate limits or other errors).
- No error retries for rate limit errors.
- Fixed bug that caused retries to add the prompt to the conversation multiple times.
- Error responses with no output no longer create a log entry.

## cli/v2.0.5 — 2025-04-02

- Consolidated to a single model pack for Gemini 2.5 Pro Experimental: 'gemini-exp'. Use it with 'plandex --gemini-exp' or '\set-model gemini-exp' in the REPL.
- Prevent the '\send' command from being included in the prompt when using multi-line mode in the REPL.

## server/v2.0.4 — 2025-04-01

- **Stability**
  - Enhanced database locking mechanisms.
  - Improved error notifications.

- **API Enhancements**
  - Added endpoints for managing custom models and updating model packs.

- **Execution**
  - Increased robustness in plan execution and subprocess lifecycle management.

- **Observability**
  - Real-time internal notifications for critical errors implemented.

- **Consistency**
  - Improved token management.
  - Enhanced summarization accuracy.

## cli/v2.0.4 — 2025-04-01

- **Models**
  - Claude Sonnet 3.7 thinking is now available as a built-in model. Try the `reasoning` model pack for more challenging tasks.
  - Gemini 2.5 pro (free/experimental version) is now available. Try the 'gemini-planner' or 'gemini-experimental' model packs to use it.
  - DeepSeek V3 03-24 version is available as a built-in model and is now used in the `oss` pack in the in the the `coder` role. 
  - OpenAI GPT 4.5 is available as a built-in model. It's not in any model packs so far due to rate limits and high cost, but is available to use via `set-model`
  
- **Debugging**
  - Plandex can now directly debug browser applications by catching errors and reading the console logs (requires Chrome).
  - Enhanced signal handling and subprocess termination robustness for execution control.

- **Model Packs**
  - Added commands:
    - `model-packs update`
    - `model-packs show`

- **Reliability**
  - Implemented HTTP retry logic with exponential backoff for transient errors.    

- **REPL**
  - Fixed whitespace handling issues.
  - Improved command execution flow.

- **Installation**
  - Clarified support for WSL-only environments.
  - Better handling of sudo and alias creation on Linux.

## server/v2.0.3 — 2025-03-27

- Fix for potential crash during chat/tell operation.
- Panic handling to prevent crashes in general.
- Fix for local queue handling bug during builds that could cause queue to get stuck and cause subsequent operations to hang.

## cli/v2.0.3 — 2025-03-26

- Fix potential race condition/goroutine explosion/crash in context update.
- Prevent crash with negative viewport height in stream tui.

## server/v2.0.2 — 2025-03-21

Server-side fix for context auto-load hanging when there's no valid context to load (for example, if they're all directories, which is only discovered client-side, and which can't be auto-loaded)

## cli/v2.0.2 — 2025-03-21

- Fixed bug where context auto-load would hang if there was no valid context to load (for example, if they're all directories, which is only discovered client-side, and which can't be auto-loaded)
- Fixed bug where the build output would sometimes wrap incorrectly, causing the Plan Stream TUI to get out of sync with the build output.
- Fixed bug where build output would jump between collapsed and expanded states during a stream, after the user manually expanded.

## cli/v2.0.1 — 2025-03-20

- Fix for REPL startup failing when self-hosting or using BYOK cloud mode (https://github.com/plandex-ai/plandex/issues/216)
- Fix for potential crash with custom model pack (https://github.com/plandex-ai/plandex/issues/217)

## server/v2.0.0+2 — 2025-03-19

- Version tag sanitation fix for GitHub Action to build and push server image to DockerHub

## server/v2.0.0+1 — 2025-03-19

- Fix for custom model creation (https://github.com/plandex-ai/plandex/issues/214)
- Fix for version check on self-hosted (https://github.com/plandex-ai/plandex/issues/213)
- Fix for GitHub Action to build and push server image to DockerHub

## server/v2.0.0 — 2025-03-19

See CLI 2.0.0 release notes.

## cli/v2.0.0 — 2025-03-19

👋 Hi, Dane here. I'm the creator and lead developer of Plandex.

I'm excited to announce the release of Plandex v2, featuring major improvements in capabilities, user experience, and automation.

## 🤖  Overview

While built on the same basic foundations as v1, v2 is best thought of as a new project with far more ambitious goals. 

Plandex is now a top-tier coding agent with fully autonomous capabilities.

By default, it combines the strengths of three top foundation model providers—Anthropic, OpenAI, and Google—to achieve significantly better coding results than can be achieved with only a single provider's models.

You get the coding abilities of Anthropic, the cost-effectiveness and speed of OpenAI's o3 mini, and the massive 2M token context window of Google Gemini, each used in the roles they're best suited for.

Plandex can: 
  - Discuss a project or feature at a high level
  - Load relevant context as needed throughout the discussion
  - Solidify the discussion into a detailed plan
  - Implement the changes
  - Apply the changes to your files
  - Run necessary commands
  - Automatically debug failures

Adding these capabilities together, Plandex can handle complex tasks that span entire large features or entire projects, generating 50-100 files or more in a single run.

Below is a more detailed look at what's new. You can also check out the updated [README](https://github.com/plandex-ai/plandex/blob/main/README.md), [website](https://plandex.ai), and [docs](https://docs.plandex.ai).

## 🧠  Newer, Smarter Models

- New default model pack combining Claude 3.7 Sonnet, o3-mini, and Gemini 1.5 Pro.

- A new set of built-in models and model packs for different use cases, including `daily-driver` (the default pack), `strong`, `cheap`, and `oss` packs, among others.

- New `architect` and `coder` roles that make it easier to use different models for different stages in the planning and implementation process.

## 📥  Better Context Management

- Automatic context selection with tree-sitter project maps (30+ languages supported).

- Effective 2M token context window for large tasks (massive codebases of ~20M tokens and more can be indexed for automatic context selection).

- Smart context management limits implementation steps to necessary files only, reducing costs and latency.

- Prompt caching for OpenAI and Anthropic models further reduces latency and costs.

## 📝  Reliable File Edits

- Much improved file editing performance and reliability, especially for large files.

- Simple edits can often be applied deterministically without a model call, reducing costs and latency.

- For more complex edits, validation and multiple fallbacks help ensure a very low failure rate.

- Supports individual files up to 100k tokens.

- On Plandex Cloud, a fine-tuned "instant apply" model further speeds up and reduces the cost of editing files up to 32k tokens in size. This is offered at no additional cost.

## 💻  New Developer Experience

- v2 includes a new default way to use Plandex: the Plandex REPL. Just type `plandex` in any project directory to start the REPL.

- Simple and intuitive chat-like experience.

- Fuzzy autocomplete for commands and files, 'chat' vs. 'tell' modes that separate ideation from implementation, and a multi-line mode for friendly editing of long prompts.

- All commands are still available as CLI calls directly from the terminal.

## 🚀  Configurable Automation

- Plandex is now capable of full autonomy with 'full auto' mode. It can load necessary context, apply changes, execute commands, and automatically debug problems.

- The automation level can be precisely configured depending on the task and your comfort level. A `basic` mode works just like Plandex v1, where files are loaded manually and execution is disabled. The new default in v2 is `semi-auto`, which enables automatic context loading, but still requires approval to apply changes and execute commands.

- By default, Plandex now includes command execution (with approval) in its planning process. It can install dependencies, build and run code, run tests, and more.

- Command execution is integrated with Plandex's diff review sandbox. Changes are tentatively applied before running commands, then rolled back if the command fails.

- A new `debug` command allows for automated debugging of any terminal command. Use it with type checkers, linters, builds, tests, and more.

## 💳  Built-in Payments, Credits, and Budgeting on Plandex Cloud

- Apart from the open source version of Plandex, which includes **all core features**, Plandex Cloud is a full-fledged product.

- It offers two subscription options: an **Integrated Models** mode that requires no additional accounts or API keys, and a **BYO API Key** mode that allows you to use your own OpenAI and OpenRouter.ai accounts and API keys. 

- In Integrated Models mode, you buy credits from Plandex Cloud and manage billing centrally. It includes usage tracking and reporting via the `usage` command, as well as convenience and budgeting features like an auto-recharge threshold, a notification threshold on monthly spend, and an overall monthly limit. You can [learn more about pricing here](https://plandex.ai#pricing).

- Billing settings are managed with a web dashboard (it can be accessed via the CLI with the `billing` command).

## 🪪  License Update

- Plandex has transitioned from AGPL 3.0 to the MIT License, simplifying future open-source contributions and allowing easier integration of proprietary enhancements in Plandex Cloud and related products.

- If you’ve previously contributed under AGPL and have concerns about this relicensing, please [reach out.](mailto:dane@plandex.ai)

## 🧰  And More

This isn't an exhaustive list! Apart from the above, there are many smaller features, bug fixes, and quality of life improvements. Give the updated [docs](https://docs.plandex.ai) a read for a full accounting of all commands and functionality.

## 🌟  Get Started

Go to the [quickstart](https://docs.plandex.ai/quick-start) to get started with v2 in minutes.

**Note:** while built on the same foundations, Plandex v2 is designed to be a run separately and independently from v1. It's not an in-place upgrade. So there's nothing in particular you need to do to upgrade; just follow the quickstart as if you were a brand new user. [More details here.](https://docs.plandex.ai/upgrading-v1-to-v2)

## 🙌  Don't Be A Stranger

- Jump into the [Plandex Discord](https://discord.gg/plandex-ai) if you have questions or feedback, or just want to hang out.

- You can [post an issue on GitHub](https://github.com/plandex-ai/plandex/issues) or [start a discussion](https://github.com/plandex-ai/plandex/discussions).

- You can reach out by email: [support@plandex.ai](mailto:support@plandex.ai).

- You can follow [@PlandexAI](https://x.com/plandexai) or my personal account [@Danenania](https://x.com/danenania) on X for updates, announcements, and random musings.

- You can subscribe on [YouTube](https://www.youtube.com/@plandex-ny5ry) for demonstrations, tutorials, and AI coding projects.

## cli/v2.0.0-rc.6 — 2025-03-09

Likely final release candidate for v2

## cli/v2.0.0-rc.5 — 2025-03-04

Placeholder for v2 release testing

## cli/v2.0.0-rc.4 — 2025-03-04

Placeholder for v2 release testing

## cli/v2.0.0-rc.3 — 2025-03-04

Placeholder for v2 release testing

## cli/v2.0.0-rc.2 — 2025-02-27

Placeholder for v2 release testing

## cli/v2.0.0-rc.1 — 2025-02-27

Placeholder for v2 release testing

## server/v1.1.1 — 2024-06-21

- Improvements to stream handling that greatly reduce flickering in the terminal when streaming a plan, especially when many files are being built simultaneously. CPU usage is also reduced on both the client and server side.
- Claude 3.5 Sonnet model and model pack (via OpenRouter.ai) is now built-in.

## cli/v1.1.1 — 2024-06-21

## Fix for terminal flickering when streaming plans 📺

Improvements to stream handling that greatly reduce flickering in the terminal when streaming a plan, especially when many files are being built simultaneously. CPU usage is also reduced on both the client and server side.

## Claude 3.5 Sonnet model pack is now built-in 🧠

You can now easily use Claude 3.5 Sonnet with Plandex through OpenRouter.ai.

1. Create an account at [OpenRouter.ai](https://openrouter.ai) if you don't already have one.
2. [Generate an OpenRouter API key](https://openrouter.ai/keys).
3. Run `export OPENROUTER_API_KEY=...` in your terminal.
4. Run `plandex set-model`, select `choose a model pack to change all roles at once` and then choose either `anthropic-claude-3.5-sonnet` (which uses Claude 3.5 Sonnet for all heavy lifting and Claude 3 Haiku for lighter tasks) or `anthropic-claude-3.5-sonnet-gpt-4o` (which uses Claude 3.5 Sonnet for planning and summarization, gpt-4o for builds, and gpt-3.5-turbo for lighter tasks)

![plandex-claude-3.5-sonnet](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/1.1.1/claude-3-5-sonnet.gif)

Remember, you can run `plandex model-packs` for details on all built-in model packs.

## server/v1.1.0 — 2024-06-11

- Give notes added to context with `plandex load -n 'some note'` automatically generated names in `context ls` list.
- Fixes for summarization and auto-continue issues that could Plandex to lose track of where it is in the plan and repeat tasks or do tasks out of order, especially when using `tell` and `continue` after the initial `tell`.
- Improvements to the verification and auto-fix step. Plandex is now more likely to catch and fix placeholder references like "// ... existing code ..." as well as incorrect removal or overwriting of code.
- After a context file is updated, Plandex is less likely to use an old version of the code from earlier in the conversation--it now uses the latest version much more reliably.
- Increase wait times when receiving rate limit errors from OpenAI API (common with new OpenAI accounts that haven't spent $50).

## cli/v1.1.0 — 2024-06-11

## Support for loading images into context with gpt-4o 🖼️

- You can now load images into context with `plandex load path/to/image.png`. Supported image formats are png, jpeg, non-animated gif, and webp. So far, this feature is only available with the default OpenAI GPT-4o model.

![plandex-load-images](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/1.1.0/plandex-images.gif)

## No more hard OpenAI requirement for builder, verifier, and auto-fix roles 🧠

- Non-OpenAI models can now be used for *all* roles, including the builder, verifier, and auto-fix roles, since streaming function calls are no longer required for these roles.

- Note that reliable function calling is still required for these roles. In testing, it was difficult to find models that worked reliably enough for these roles, despite claimed support for function calling. For this reason, using non-OpenAI models for these roles should be considered experimental. Still, this provides a path forward for using open source, local, and other non-OpenAI models for these roles in the future as they improve.

## Reject pending changes with `plandex reject` 🚫

- You can now reject pending changes to one or more files with the `plandex reject` command. Running it with no arguments will reject all pending changes after confirmation. You can also reject changes to specific files by passing one or more file paths as arguments.

![plandex-reject](https://github.com/plandex-ai/plandex/blob/main/releases/images/cli/1.1.0/plandex-reject.gif)

## Summarization and auto-continue fixes 🛤 ️

- Fixes for summarization and auto-continue issues that could Plandex to lose track of where it is in the plan and repeat tasks or do tasks out of order, especially when using `tell` and `continue` after the initial `tell`.

## Verification and auto-fix improvements 🛠️

- Improvements to the verification and auto-fix step. Plandex is now more likely to catch and fix placeholder references like "// ... existing code ..." as well as incorrect removal or overwriting of code.

## Stale context fixes 🔄

- After a context file is updated, Plandex is less likely to use an old version of the code from earlier in the conversation--it now uses the latest version much more reliably.

## `plandex convo` command improvements 🗣️

- Added a `--plain / -p` flag to `plandex convo` and `plandex summary` that outputs the conversation/summary in plain text with no ANSI codes.
- `plandex convo` now accepts a message number or range of messages to display (e.g. `plandex convo 1`, `plandex convo 1-5`, `plandex convo 2-`). Use `plandex convo 1` to show the initial prompt.

## Context management improvements 📄

- Give notes added to context with `plandex load -n 'some note'` an auto-generated name in the `context ls` list.
- `plandex rm` can now accept a range of indices to remove (e.g. `plandex rm 1-5`)
- Better help text if `plandex load` is run with incorrect arguments
- Fix for `plandex load` issue loading paths that begin with `./`

## Better rate limit tolerance 🕰️

- Increase wait times when receiving rate limit errors from OpenAI API (common with new OpenAI accounts that haven't spent $50)

## Built-in model updates 🧠

- Removed 'gpt-4-turbo-preview' from list of built-in models and model packs

## Other fixes 🐞

- Fixes for some occasional rendering issues when streaming plans and build counts
- Fix for `plandex set-model` model selection showing built-in model options that aren't compatible with the selected role--now only compatible models are shown

## Help updates 📚

- `plandex help` now shows a brief overview on getting started with Plandex rather than the full command list
- `plandex help --all` or `plandex help -a` shows the full command list

## server/v1.0.1 — 2024-05-24

- Fix for occasional 'Error getting verify state for file' error
- Fix for occasional 'Fatal: unable to write new_index file' error
- Fix for occasional 'nothing to commit, working tree clean' error
- When hitting OpenAI rate limits, Plandex will now parse error messages that include a recommended wait time and automatically wait that long before retrying, up to 30 seconds (https://github.com/plandex-ai/plandex/issues/123)
- Some prompt updates to encourage creation of multiple smaller files rather than one mega-file when generating files for a new feature or project. Multiple smaller files are faster to generate, use less tokens, and have a lower error rate compared to a continually updated large file.

## server/v1.0.0 — 2024-05-16

##   ☄️     gpt-4o is the real deal for coding

- gpt-4o, OpenAI's latest model, is the new default model for Plandex. 4o is much better than gpt-4-turbo (the previous default model) in early testing for coding tasks and agent workflows.
- If you have not used `plandex set-model` or `plandex set-model default` previously to set a custom model, you will now be use gpt-4o by default. If you *have* used one of those commands, use `plandex set-model` or `plandex set-model default` and select the new `gpt-4o-latest` model-pack to upgrade. 
 
##   🛰️     Reliability improvements: 90% reduction in syntax errors in early testing

- Automatic syntax and logic validation with an auto-correction step for file updates.
- Significantly improves reliability and reduces syntax errors, mistaken duplication or removal of code, placeholders that reference other code and other similar issues. 
- With a set of ~30 internal evals spanning 5 common languages, syntax errors were reduced by over 90% on average with gpt-4o. 
- Logical errors are also reduced (I'm still working on evals for those to get more precise numbers).
- Plandex is now much better at handling large files and plans that make many updates to the same file. Both could be problematic in previous versions.
- Plandex is much more resilient to incorrectly labelled file blocks when the model uses the file label format incorrectly to explain something rather than for a file. i.e. "Run this script" and then a bash script block. Previously Plandex would mistakenly create a file called "Run this script". It now ignores blocks like these.

##   🧠     Improvements to core planning engine: better memory and less laziness allow you to accomplish larger and more complex tasks without errors or stopping early

- Plandex is now much better at working through long plans without skipping tasks, repeating tasks it's already done, or otherwise losing track of what it's doing.
- Plandex is much less likely to leave TODO placeholders in comments instead of fully completing a task, or to otherwise leave a task incomplete.
- Plandex is much less likely to end a plan before all tasks are completed.

##   🏎️     Performance improvements: 2x faster planning and execution

- gpt-4o is twice as fast as gpt-4-turbo for planning, summarization, builds, and more.
- If you find it's streaming too fast and you aren't able to review the output, try using the `--stop / -s` flag with `plandex tell` or `plandex continue`. It will stop the plan after a single response so you can review it before proceeding. Use `plandex continue` to proceed with the plan once you're ready.
- Speaking of which, if you're in exploratory mode and want to use less tokens, you can also use the `--no-build / -n` flag with `plandex tell` and `plandex continue`. This prevents Plandex from building files until you run `plandex build` manually.

##   🪙    2x cost reduction: gpt-4o is half the per-token price of gpt-4-turbo

- For the same quantity of tokens, with improved quality and 2x speed, you'll pay half-price.

##   👩‍💻    New `plandex-dev` and `pdxd` alias in development mode

- In order to avoid conflicts/overwrites with the `plandex` CLI and `pdx` alias, a new `plandex-dev` command and `pdxd` alias have been added in development mode. 

##  🛠️     Bug fixes

- Fix for a potential panic during account creation (https://github.com/plandex-ai/plandex/issues/76)
- Fixes for some account creation flow issues (https://github.com/plandex-ai/plandex/issues/106)
- Fix for occasional "Stream buffer tokens too high" error (https://github.com/plandex-ai/plandex/issues/34).
- Fix for potential panic when updating model settings. Might possibly be the cause of or somehow related to https://github.com/plandex-ai/plandex/issues/121 but hard to be sure (maybe AWS was just being flakey).
- Attempted fix for rare git repo race condition @jesseswell_1 caught that gives error ending with: 
```
Exit status 128, output
      * Fatal: unable to write new_index file
```

##   📚    Readme updates

- The [readme](https://github.com/plandex-ai/plandex) has been revamped to be more informative and easier to navigate.

##  🏡    Easy self-contained startup script for local mode and self-hosting

```bash
git clone https://github.com/plandex-ai/plandex.git
cd plandex/app
./start_local.sh
``` 

- Sincere thanks to @ZanzyTHEbar aka @daofficialwizard on Discord who wrote the script! 🙏🙏

##   🚀     Upgrading   

- As always, cloud has already been updated with the latest version. To upgrade the CLI, run any `plandex` command (like `plandex version` or `plandex help` or whatever command you were about to run anyway 🙂)

##   📆     Join me for office hours every Friday 12:30-1:30pm PST in Discord, starting May 17th

- I'll be available by voice and text chat to answer questions, talk about the new version, and hear about your use cases. Come on over and hang out! 
- Join the discord to get a reminder when office hours are starting: https://discord.gg/plandex-ai

## cli/v1.0.0 — 2024-05-16

- CLI updates for the 1.0.0 release
- See the [server/v1.0.0 release notes](https://github.com/plandex-ai/plandex/releases/tag/server%2Fv1.0.0) for full details

## server/v0.9.1 — 2024-05-08

- Improvements to auto-continue check. Plandex now does a better job determining whether a plan is finished or should automatically continue by incorporating the either the latest plan summary or the previous conversation message (if the summary isn't ready yet) into the auto-continue check. Previously the check was using only the latest conversation message.
- Fix for 'exit status 128' errors in a couple of edge case scenarios.
- Data that is piped into `plandex load` is now automatically given a name in `context ls` via a call to the `namer` role model (previously it had no name, making multiple pipes hard to disambiguate).

## cli/v0.9.1 — 2024-05-08

- Fix for occasional stream TUI panic during builds with long file paths (https://github.com/plandex-ai/plandex/issues/105)
- If auto-upgrade fails due to a permissions issue, suggest re-running command with `sudo` (https://github.com/plandex-ai/plandex/issues/97 - thanks @kalil0321!)
- Include 'openrouter' in list of model providers when adding a custom model (https://github.com/plandex-ai/plandex/issues/107)
- Make terminal prompts that shouldn't be optional (like the Base URL for a custom model) required across the board (https://github.com/plandex-ai/plandex/issues/108)
- Data that is piped into `plandex load` is now automatically given a name in `plandex ls` via a call to the `namer` role model (previously it had no name, making multiple pipes hard to disambiguate).
- Still show the '(r)eject file' hotkey in the `plandex changes` TUI when the current file isn't scrollable. 

## server/v0.9.0 — 2024-04-29

- Support for custom models, model packs, and default models (see CLI 0.9.0 release notes for details).
- Better accuracy for updates to existing files.
- Plandex is less likely to screw up braces, parentheses, and other code structures.
- Plandex is less likely to mistakenly remove code that it shouldn't.
- Plandex is now much better at working through very long plans without skipping tasks, repeating tasks it's already done, or otherwise losing track of what it's doing.
- Server-side support for `plandex diff` command to show pending plan changes in `git diff` format.
- Server-side support for archiving and unarchiving plans.
- Server-side support for `plandex summary` command.
- Server-side support for `plandex rename` command.
- Descriptive top-line for `plandex apply` commit messages instead of just "applied pending changes".
- Better message in `plandex log` when a single piece of context is loaded or updated.
- Fixes for some rare potential deadlocks and conflicts when building a file or stopping astream.

## cli/v0.9.0 — 2024-04-29

## Major file update improvements 📄
- Much better accuracy for updates to existing files.
- Plandex is much less likely to screw up braces, parentheses, and other code structures.
- Plandex is much less likely to mistakenly remove code that it shouldn't.

## Major improvements to long plans with many steps 🛤️
- Plandex's 'working memory' has been upgraded. It is now much better at working through very long plans without skipping tasks, repeating tasks it's already done, or otherwise losing track of what it's doing.

## 'plandex diff' command ⚖️

![plandex-diff](https://github.com/plandex-ai/plandex/blob/03263a83d76785846fd472693aed03d36a68b86c/releases/images/cli/0.9.0/plandex-diff.gif)

- New `plandex diff` command shows pending plan changes in `git diff` format.

## Plans can be archived 🗄️

![plandex-archive](https://github.com/plandex-ai/plandex/blob/03263a83d76785846fd472693aed03d36a68b86c/releases/images/cli/0.9.0/plandex-archive.gif)

- If you aren't using a plan anymore, but you don't want to delete it, you can now archive it.
- Use `plandex archive` (or `plandex arc` for short) to archive a plan.
- Use `plandex plans --archived` (or `plandex plans -a`) to see archived plans in the current directory.
- Use `plandex unarchive` (or `plandex unarc`) to restore an archived plan.

## Custom models!! 🧠
### Use Plandex with models from OpenRouter, Together.ai, and more

![plandex-models](https://github.com/plandex-ai/plandex/blob/03263a83d76785846fd472693aed03d36a68b86c/releases/images/cli/0.9.0/plandex-models.gif)

- Use `plandex models add` to add a custom model and use any provider that is compatible with OpenAI, including OpenRouter.ai, Together.ai, Ollama, Replicate, and more.
- Anthropic Claude models are available via OpenRouter.ai. Google Gemini 1.5 preview is also available on OpenRouter.ai but was flakey in initial testing. Tons of open source models are available on both OpenRouter.ai and Together.ai, among other providers.
- Some built-in models and model packs (see 'Model packs' below) have been included as a quick way to try out a few of the more powerful model options. Just use `plandex set-model` to try these.
- You can use a custom model you've added with `plandex set-model`, or add it to a model pack (see 'Model packs' below) with `plandex model-packs create`. Delete custom models you've added with `plandex models delete`.
- The roles a custom model can be used for depend on its OpenAI compatibility.
- Each model provider has an `ApiKeyEnvVar` associated with it, like `OPENROUTER_API_KEY`, `TOGETHER_API_KEY`, etc. You will need to have the appropriate environment variables set with a valid api key for each provider that you're using.
- Because all of Plandex's prompts have been tested against OpenAI models, support for new models should be considered **experimental**.
- If you find prompting patterns that are effective for certain models, please share them on Discord (https://discord.gg/plandex-ai) or GitHub (https://github.com/plandex-ai/plandex/discussions) and they may be included in future releases.

## Model packs 🎛️
- Instead of changing models for each role one by one, a model packs let you switch out all roles at once.
- Use `plandex model-packs create` qto create your own model packs. 
- Use `plandex model-packs` to list built-in and custom model packs. 
- Use `plandex set-model` to load a model pack.
- Use `plandex model-packs delete` to remove a custom model pack.

## Model defaults ⚙️
- Instead of only changing models on a per-plan basis, you can set model defaults that will apply to all new plans you start.
- Use `plandex models default` to see default model settings and `plandex set-model default` to update them. 

## More commands 💻
- `plandex summary` to see the latest plan summary
- `plandex rename` to rename the current plan

## Quality of life improvements 🧘‍♀️
- Descriptive top-line for `plandex apply` commit messages instead of just "applied pending changes".
- Better message in `plandex log` when a single piece of context is loaded or updated.
- Abbreviate really long file paths in `plandex ls`.
- Changed `OPENAI_ENDPOINT` env var to `OPENAI_API_BASE`, which is more standardized. `OPENAI_ENDPOINT` is still quietly supported.
- guides/ENV_VARS.md now lists environment variables you can use with Plandex (and a few convenience variables have been addded) - thanks @knno! → https://github.com/plandex-ai/plandex/pull/94

## Bug fixes 🐞
- Fix for potential crash in `plandex changes` TUI.
- Fixes for some rare potential deadlocks and conflicts when building a file or stopping a plan stream.

## server/v0.8.4 — 2024-04-14

- Add support for new OpenAI models: `gpt-4-turbo` and `gpt-4-turbo-2024-04-09`
- Make `gpt-4-turbo` model the new default model for the planner, builder, and auto-continue roles -- in testing it seems to be better at reasoning and significantly less lazy than the previous default for these roles, `gpt-4-turbo-preview` -- any plan that has not previously had its model settings modified will now use `gpt-4-turbo` by default (those that have been modified will need to be updated manually) -- remember that you can always use `plandex set-model` to change models for your plans
- Fix for handling files that are loaded into context and later deleted from the file system (https://github.com/plandex-ai/plandex/issues/47)
- Handle file paths with ### prefixes (https://github.com/plandex-ai/plandex/issues/77)
- Fix for occasional race condition during file builds that causes error "Fatal: Unable to write new index file"

## cli/v0.8.3 — 2024-04-14

- Add support for new OpenAI models: `gpt-4-turbo` and `gpt-4-turbo-2024-04-09`
- Make `gpt-4-turbo` model the new default model for the planner, builder, and auto-continue roles -- in testing it seems to be better at reasoning and significantly less lazy than the previous default for these roles, `gpt-4-turbo-preview` -- any plan that has not previously had its model settings modified will now use `gpt-4-turbo` by default (those that have been modified will need to be updated manually) -- remember that you can always use `plandex set-model` to change models for your plans
- Fix for `set-model` command argument parsing (https://github.com/plandex-ai/plandex/issues/75)
- Fix for panic during plan stream when a file name's length exceeds the terminal width (https://github.com/plandex-ai/plandex/issues/84)
- Fix for handling files that are loaded into context and later deleted from the file system (https://github.com/plandex-ai/plandex/issues/47)
- Fix to prevent loading of duplicate files, directory trees, or urls into context (https://github.com/plandex-ai/plandex/issues/57)

## server/v0.8.3 — 2024-04-09

- SMTP_FROM environment variable for setting from address when self-hosting and using SMTP (https://github.com/plandex-ai/plandex/pull/39)
- Add support for OPENAI_ENDPOINT environment variable for custom OpenAI endpoints (https://github.com/plandex-ai/plandex/pull/46)
- Add support for OPENAI_ORG_ID environment variable for setting the OpenAI organization ID when using an API key with multiple OpenAI organizations.
- Fix for unhelpful "Error getting plan, context, convo, or summaries" error message when OpenAI returns an error for invalid API key or insufficient credits (https://github.com/plandex-ai/plandex/issues/32)

## cli/v0.8.2 — 2024-04-09

- Fix root level --help/-h to use custom help command rather than cobra's help message (re: https://github.com/plandex-ai/plandex/issues/25)
- Include 'survey' fork (https://github.com/plandex-ai/survey) as a proper module instead of a local reference (https://github.com/plandex-ai/plandex/pull/37)
- Add support for OPENAI_ENDPOINT environment variable for custom OpenAI endpoints (https://github.com/plandex-ai/plandex/pull/46)
- Add support for OPENAI_ORG_ID environment variable for setting the OpenAI organization ID when using an API key with multiple OpenAI organizations.

## server/v0.8.2 — 2024-04-05

- Fix for creating an org that auto-adds users based on email domain (https://github.com/plandex-ai/plandex/issues/24)
- Fix for possible crash after error in file build
- Added crash prevention measures across the board
- Fix for occasional "replacements failed" error
- Reliability and improvements for file updates
- Fix for role name of auto-continue model

## cli/v0.8.1 — 2024-04-03

- Fix for missing 'host' key when creating an account or signing in to a self-hosted server (https://github.com/plandex-ai/plandex/issues/11)
- `add` alias for `load` command + `unload` alias for `rm` command (https://github.com/plandex-ai/plandex/issues/12)
- Add `invite`, `revoke`, and `users` commands to `plandex help` output
- A bit of cleanup of extraneous logging

## server/v0.8.1 — 2024-04-02

- Fixes for two potential server crashes
- Fix for server git repo remaining in locked state after a crash, which caused various issues
- Fix for server git user and email not being set in some environments (https://github.com/plandex-ai/plandex/issues/8)
- Fix for 'replacements failed' error that was popping up in some circumstances
- Fix for build issue that could cause large updates to fail, take too long, or use too many tokens in some circumstances
- Clean up extraneous logging
- Prompt update to prevent ouputting files at absolute paths (like '/etc/config.txt')
- Prompt update to prevent sometimes using file block format for explanations, causing explanations to be outputted as files
- Prompt update to prevent stopping before the the plan is really finished 
- Increase maximum number of auto-continuations to 50 (from 30)

## server/v0.8.0 — 2024-03-27

- User management improvements and fixes
- Backend support for `plandex invite`, `plandex users`, and `plandex revoke` commands
- Improvements to copy for email verification emails
- Fix for org creation when creating a new account
- Send an email to invited user when they are invited to an org
- Add timeout when forwarding requests from one instance to another within a cluster

## cli/v0.8.0 — 2024-03-27

- `plandex invite` command to invite users to an org
- `plandex users` command to list users and pending invites for an org
- `plandex revoke` command to revoke an invite or remove a user from an org
- `plandex sign-in` fixes
- Fix for context update of directory tree when some paths are ignored
- Fix for `plandex branches` command showing no branches immediately after plan creation rather than showing the default 'main' branch

## server/v0.7.1 — 2024-03-26

- Fix for SMTP email issue
- Add '/version' endpoint to server

## server/v0.7.0 — 2024-03-23

Initial release

## cli/v0.7.3 — 2024-03-23

- Fixes for changes TUI replacement view
- Fixes for changes TUI text encoding issue
- Fixes context loading
- `plandex rm` can now remove a directory from context
- `plandex apply` fixes to avoid possible conflicts
- `plandex apply` ask user whether to commit changes
- Context update fixes
- Command suggestions can be disabled with PLANDEX_DISABLE_SUGGESTIONS environment variable

## cli/v0.7.2 — 2024-03-16

- PLANDEX_SKIP_UPGRADE environment variable can be used to disable upgrades
- Color fixes for light backgrounds

## cli/v0.7.1 — 2024-03-16

- Fix for re-running command after an upgrade
- Fix for user input prompts

## cli/v0.7.0 — 2024-03-14



