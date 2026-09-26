## v1.3.4 — 2025-04-15

Moving forward, our new releases page is here: https://github.com/voideditor/binaries/releases.

# March 2025 update:

Void's latest beta release is now ready for download!


### Links.
- [Official Download Link](https://voideditor.com/download-beta).
- [Changelog](https://voideditor.com/changelog).
- [All Binaries](https://github.com/voideditor/binaries/releases).

This version of Void comes with checkpoints, Agent mode for all OSS models (like GPT 4.1 and R1), auto-updates, SSH and WSL support, and lots of improvements! 

- A special thanks to this release's contributors. Thanks especially to @bjoaquinc for helping with SSH and WSL, and @jcommaret for helping with the Mistral implementation. Additional shoutout to the many users in our Discord channel - your feedback and thoughts have been great!
- We host weekly contributing meetings in our [Discord channel](https://discord.gg/RSNjgaugJs) on Thursdays. If you're interested in hearing about our roadmap or contributing, we'd love for you to stop by!

## What's Changed
* Minor changes mar by @andrewpareles in https://github.com/voideditor/void/pull/342
* Vscodium patches by @andrewpareles in https://github.com/voideditor/void/pull/343
* More vscodium patches by @andrewpareles in https://github.com/voideditor/void/pull/344
* tslib by @andrewpareles in https://github.com/voideditor/void/pull/345
* fix vscodium patches by @andrewpareles in https://github.com/voideditor/void/pull/349
* xpm by @andrewpareles in https://github.com/voideditor/void/pull/350
* new code.ico by @andrewpareles in https://github.com/voideditor/void/pull/351
* dummy commit by @andrewpareles in https://github.com/voideditor/void/pull/353
* enable auto updates by @andrewpareles in https://github.com/voideditor/void/pull/354
* test update to 1.0.3 by @andrewpareles in https://github.com/voideditor/void/pull/355
* revert to 1.0.2 for testing by @andrewpareles in https://github.com/voideditor/void/pull/356
* bump to 1.0.3 to test auto-updates by @andrewpareles in https://github.com/voideditor/void/pull/357
* version -> voidVersion by @andrewpareles in https://github.com/voideditor/void/pull/358
* Minor changes mar by @andrewpareles in https://github.com/voideditor/void/pull/361
* 1.0.4 test by @andrewpareles in https://github.com/voideditor/void/pull/362
* Fixed the open-remote-ssh extension to point at binaries repo by @bjoaquinc in https://github.com/voideditor/void/pull/360
* Fixed default url in package.json since this is used by app by @bjoaquinc in https://github.com/voideditor/void/pull/363
* Minor changes mar by @andrewpareles in https://github.com/voideditor/void/pull/365
* Updated version argument to get voidVersion by @bjoaquinc in https://github.com/voideditor/void/pull/364
* Update CONTRIBUTING.md by @GhostDog98 in https://github.com/voideditor/void/pull/375
* Add checkpoints by @andrewpareles in https://github.com/voideditor/void/pull/378
* Update CONTRIBUTING.md by @GhostDog98 in https://github.com/voideditor/void/pull/376
* Added more models for agents from openRouter by @Dylan-86 in https://github.com/voideditor/void/pull/337
* Merge changes from vscode disabling mangling by @GhostDog98 in https://github.com/voideditor/void/pull/374
* Added open-remote-wsl to /extensions by @bjoaquinc in https://github.com/voideditor/void/pull/371
* Revert "Merge changes from vscode disabling mangling" by @andrewpareles in https://github.com/voideditor/void/pull/382
* Increased Support for Agent Mode (Ollama, vLLM, etc) by @andrewpareles in https://github.com/voideditor/void/pull/381
* Status bar for all changed files by @andrewpareles in https://github.com/voideditor/void/pull/379
* Model selection by @andrewpareles in https://github.com/voideditor/void/pull/384
* logs by @andrewpareles in https://github.com/voideditor/void/pull/385
* HOW_TO_CONTRIBUTE by @andrewpareles in https://github.com/voideditor/void/pull/386
* Dummy service update by @andrewpareles in https://github.com/voideditor/void/pull/387
* Misc 1.0.3 canary improvements - tool call fix, tooltips, lint error passing by @andrewpareles in https://github.com/voideditor/void/pull/389
* Prepare for 1.0.3 release by @andrewpareles in https://github.com/voideditor/void/pull/391
* Terminal prompt by @andrewpareles in https://github.com/voideditor/void/pull/392
* Quasar + misc fixes before 1.0.3 by @andrewpareles in https://github.com/voideditor/void/pull/393
* Merge remote-tracking branch 'origin/main' into model-selection by @andrewpareles in https://github.com/voideditor/void/pull/394
* minor fixes by @andrewpareles in https://github.com/voideditor/void/pull/395
* Misc by @andrewpareles in https://github.com/voideditor/void/pull/397
* [Provider]Mistral -😻- Mistral working : [OpenAICompatibleModel Chat + tools +  sendMistralFIM] by @jcommaret in https://github.com/voideditor/void/pull/321
* GPT 4.1 + fixes by @andrewpareles in https://github.com/voideditor/void/pull/398
* 1.2.0 by @andrewpareles in https://github.com/voideditor/void/pull/399
* GPT 4.1 and Claude 3.7 Thinking with Tools by @andrewpareles in https://github.com/voideditor/void/pull/400
* Model selection by @andrewpareles in https://github.com/voideditor/void/pull/401
* 1.2.1 updates by @andrewpareles in https://github.com/voideditor/void/pull/404
* Onboarding, SSH by @andrewpareles in https://github.com/voideditor/void/pull/406
* Fix AppImage creation bug by @Dylan-86 in https://github.com/voideditor/void/pull/403
* o3, o4-mini by @andrewpareles in https://github.com/voideditor/void/pull/407
* o3 fallback by @andrewpareles in https://github.com/voideditor/void/pull/408



## New Contributors
* @GhostDog98 made their first contribution in https://github.com/voideditor/void/pull/375
* @Dylan-86 made their first contribution in https://github.com/voideditor/void/pull/337

**Full Changelog**: https://github.com/voideditor/void/compare/v1.0.2...v1.2.4

## v1.0.2 — 2025-03-22

Void's beta release 1.0.2 is now ready for download! 


### Download link.
- [Official Download Link](https://voideditor.com/download-beta).

This version of Void comes with tool use, Agent mode, and lots of improvements! We are still in beta, but will be releasing people off our waitlist very soon for the official release (scroll for links). 


### Contributors.

- A special thanks to this release's contributors. @bjoaquinc, @jcommaret, and @bawsdeep were especially helpful in working out some tedious desktop-app related items.
- We host weekly contributing meetings in our Discord channel. If you're interested in contributing, feel free to attend! 


## New Contributors
* @DoctorGlitchy made their first contribution in https://github.com/voideditor/void/pull/259
* @bawsdeep made their first contribution in https://github.com/voideditor/void/pull/252
* @adrieljss made their first contribution in https://github.com/voideditor/void/pull/284
* @jhacksman made their first contribution in https://github.com/voideditor/void/pull/287
* @eswaldots made their first contribution in https://github.com/voideditor/void/pull/288
* @ZorinFoss made their first contribution in https://github.com/voideditor/void/pull/320


## What's Changed
* Beta! by @andrewpareles in https://github.com/voideditor/void/pull/215
* Minor usability updates by @andrewpareles in https://github.com/voideditor/void/pull/229
* DeepSeek as a provider by @andrewpareles in https://github.com/voideditor/void/pull/231
* Reset Window: Zoom Level default to 0 by @mathewpareles in https://github.com/voideditor/void/pull/239
* Add new experimental Gemini models to default settings by @Piyu-Pika in https://github.com/voideditor/void/pull/216
* [LLM]Mistral implementation by @jcommaret in https://github.com/voideditor/void/pull/190
* Improve React build by incorporating the watcher in base build commands by @bjoaquinc in https://github.com/voideditor/void/pull/183
* Fix npm run watchreact initial build bug by @bjoaquinc in https://github.com/voideditor/void/pull/233
* Latest UI updates by @andrewpareles in https://github.com/voideditor/void/pull/258
* Update voidSettingsTypes.ts by @DoctorGlitchy in https://github.com/voideditor/void/pull/259
* script to generate appimages by @bawsdeep in https://github.com/voideditor/void/pull/252
* UI improvements by @andrewpareles in https://github.com/voideditor/void/pull/273
* "Copy Prompt" icons on files by @andrewpareles in https://github.com/voideditor/void/pull/206
* fix(build): fixes void-reh (remote host) build crashes and updates the remote-host output path to say void rather than vscode by @bjoaquinc in https://github.com/voideditor/void/pull/278
* Latest streaming changes by @andrewpareles in https://github.com/voideditor/void/pull/281
* fix ENOENT error spawn on Windows by @adrieljss in https://github.com/voideditor/void/pull/284
* Tool use progress by @andrewpareles in https://github.com/voideditor/void/pull/290
* Provider Settings + UX improvements by @andrewpareles in https://github.com/voideditor/void/pull/294
* Added remote-ssh extension to /extensions by @bjoaquinc in https://github.com/voideditor/void/pull/282
* Fix Apply failure with <think> tags (#283) by @jhacksman in https://github.com/voideditor/void/pull/287
* Fix encryption service not working on Linux by @eswaldots in https://github.com/voideditor/void/pull/288
* Rebase vscode  onto void (microsoft/vscode 0480008e3221e6743799332fc0018a98e8e90457 -> voideditor/void 1e09852b3ced4b642f92f896266ef83e011c13f4) by @andrewpareles in https://github.com/voideditor/void/pull/301
* Add reasoning parsing, marketplace URL, chat selection state, misc UI by @andrewpareles in https://github.com/voideditor/void/pull/303
* Needed rework of my script to generate the Appimage by @bawsdeep in https://github.com/voideditor/void/pull/289
* Fix tailwind by @andrewpareles in https://github.com/voideditor/void/pull/304
* [Update]node version  in CONTRIBUTING.md by @jcommaret in https://github.com/voideditor/void/pull/308
* Tool use progress + UI by @andrewpareles in https://github.com/voideditor/void/pull/310
* Tool use improvements + Clear settings by @andrewpareles in https://github.com/voideditor/void/pull/312
* Terminal Service Progress + Fix Import Issue by @andrewpareles in https://github.com/voideditor/void/pull/319
* Enhance appimage creation by @ZorinFoss in https://github.com/voideditor/void/pull/320
* ⚙️ - Void version from : tag (semver) commit and date by @jcommaret in https://github.com/voideditor/void/pull/279
* Command Bar for Changes + Tool UI by @andrewpareles in https://github.com/voideditor/void/pull/324
* V1.0.2 by @andrewpareles in https://github.com/voideditor/void/pull/325
* Small (or empty) file editing by @andrewpareles in https://github.com/voideditor/void/pull/326

**Full Changelog**: https://github.com/voideditor/void/compare/v1.0.0...v1.0.2


### Links
- [Waitlist](https://voideditor.com/email) to be alerted about the first official non-beta release.
- [Discord](https://discord.gg/RSNjgaugJs) channel.


## v1.0.0 — 2025-01-19

Void's beta release 1.0.0 is now ready for download! 


### Download link.
- [Official Download Link](https://voideditor.com/download-beta).

Disclaimers: This is an early version of Void that doesn't have all our features yet! If you'd like to stay up to date or help us build Void, please join our Discord channel! Otherwise, feel free to join the waitlist to be alerted when the full release is ready (scroll for links).


### Contributors.

A special shoutout to this release's contributors!

We host weekly contributing meetings in our Discord channel. If you're interested in contributing, you're welcome to attend or shoot us a message.


## New Contributors.
* @eltociear made their first contribution in https://github.com/voideditor/void/pull/3
* @joshuajerin made their first contribution in https://github.com/voideditor/void/pull/1
* @sunmorgan made their first contribution in https://github.com/voideditor/void/pull/25
* @quant-eagle made their first contribution in https://github.com/voideditor/void/pull/29
* @anetaj made their first contribution in https://github.com/voideditor/void/pull/46
* @DaveHogan made their first contribution in https://github.com/voideditor/void/pull/42
* @w1gs made their first contribution in https://github.com/voideditor/void/pull/22
* @jcommaret made their first contribution in https://github.com/voideditor/void/pull/91
* @jack1582 made their first contribution in https://github.com/voideditor/void/pull/95
* @IDLe-Engineering made their first contribution in https://github.com/voideditor/void/pull/99
* @ShikangPang made their first contribution in https://github.com/voideditor/void/pull/98
* @okxiaoliang4 made their first contribution in https://github.com/voideditor/void/pull/51
* @SOUMITRO-SAHA made their first contribution in https://github.com/voideditor/void/pull/77
* @Piyu-Pika made their first contribution in https://github.com/voideditor/void/pull/134
* @Madhav160804 made their first contribution in https://github.com/voideditor/void/pull/140
* @dcqe made their first contribution in https://github.com/voideditor/void/pull/149
* @plon-Susk7 made their first contribution in https://github.com/voideditor/void/pull/142
* @nathfavour made their first contribution in https://github.com/voideditor/void/pull/145
* @pythons made their first contribution in https://github.com/voideditor/void/pull/144
* @bjoaquinc made their first contribution in https://github.com/voideditor/void/pull/181
* @PraveenAsh made their first contribution in https://github.com/voideditor/void/pull/202
* @rluvaton made their first contribution in https://github.com/voideditor/void/pull/203


## What's Changed.
* chore: update main.js by @eltociear in https://github.com/voideditor/void/pull/3
* Add Discord Link by @joshuajerin in https://github.com/voideditor/void/pull/1
* Clearout code selection from ctrl l by @sunmorgan in https://github.com/voideditor/void/pull/25
* Update CONTRIBUTING.md by @andrewpareles in https://github.com/voideditor/void/pull/28
* fix: update VS source to more recent version by @quant-eagle in https://github.com/voideditor/void/pull/29
* feat: use npm instead of yarn by @quant-eagle in https://github.com/voideditor/void/pull/30
* Apply vscode theme by @anetaj in https://github.com/voideditor/void/pull/46
* Fixes #7: case analysis on insert, delete, and replace by @andrewpareles in https://github.com/voideditor/void/pull/55
* Revert "fix: update VS source to more recent version" by @mathewpareles in https://github.com/voideditor/void/pull/60
* Link to settings from extension by @anetaj in https://github.com/voideditor/void/pull/61
* Rebase vscode into Void by @andrewpareles in https://github.com/voideditor/void/pull/66
* Minor improvement to whichapi & anthropic configuration by @DaveHogan in https://github.com/voideditor/void/pull/42
* Added Ollama integration by @w1gs in https://github.com/voideditor/void/pull/22
* Improve Void VS Code configuration by @andrewpareles in https://github.com/voideditor/void/pull/84
* MacOS IDE build by @jcommaret in https://github.com/voideditor/void/pull/91
* fixed dependencies that were preventing IDE builds by @w1gs in https://github.com/voideditor/void/pull/92
* Supports calling LLM in a way compatible with OpenAI's API, and adds explicit configuration items for users。 by @jack1582 in https://github.com/voideditor/void/pull/95
* Copy code block by @anetaj in https://github.com/voideditor/void/pull/47
* Input box style by @anetaj in https://github.com/voideditor/void/pull/52
* Persist chat threads history by @anetaj in https://github.com/voideditor/void/pull/53
* Update sendLLMMessage.ts by @IDLe-Engineering in https://github.com/voideditor/void/pull/99
* fix: Refactor openAICompatible initialization in sendLLMMessage.ts by @ShikangPang in https://github.com/voideditor/void/pull/98
* feat: system prompt `.voidrules` by @okxiaoliang4 in https://github.com/voideditor/void/pull/51
* Refactor and fix diff highlighting by @mathewpareles in https://github.com/voideditor/void/pull/101
* Split up Sidebar tabs into files and clearer message types (incorporates direction) by @andrewpareles in https://github.com/voideditor/void/pull/105
* Add Syntax Highlighting to Sidebar Code Snippets by @IDLe-Engineering in https://github.com/voideditor/void/pull/109
* Build prompt dynamically by @IDLe-Engineering in https://github.com/voideditor/void/pull/106
* Connect-src updates for OpenAICompatible by @IDLe-Engineering in https://github.com/voideditor/void/pull/108
* Fix: Add Syntax Highlighting to Sidebar Code Snippets by @SOUMITRO-SAHA in https://github.com/voideditor/void/pull/77
* Added displaying error messages in UI by @w1gs in https://github.com/voideditor/void/pull/87
* Settings update  by @andrewpareles in https://github.com/voideditor/void/pull/110
* Misc Improvements by @andrewpareles in https://github.com/voideditor/void/pull/113
* Editor Insets by @andrewpareles in https://github.com/voideditor/void/pull/119
* discord by @andrewpareles in https://github.com/voideditor/void/pull/120
* Doc : Build command fix by @jcommaret in https://github.com/voideditor/void/pull/121
* Speculative Edits by @andrewpareles in https://github.com/voideditor/void/pull/125
* Max tokens is optional + other config updates - Fixes #128 by @andrewpareles in https://github.com/voideditor/void/pull/133
* Gemini added #new feature by @Piyu-Pika in https://github.com/voideditor/void/pull/134
* docs: update .devcontainer/README.md by @eltociear in https://github.com/voideditor/void/pull/137
* Added Ollama Model Check for installed models by @Madhav160804 in https://github.com/voideditor/void/pull/140
* fix windows command by @dcqe in https://github.com/voideditor/void/pull/149
* pass build information to extension by @plon-Susk7 in https://github.com/voideditor/void/pull/142
* Main by @nathfavour in https://github.com/voideditor/void/pull/145
* lodash : package added to extension by @jcommaret in https://github.com/voideditor/void/pull/150
* Build.js : Fixing tsup command by @jcommaret in https://github.com/voideditor/void/pull/155
* Native Editor Insets by @andrewpareles in https://github.com/voideditor/void/pull/139
* Fix CORS + CSP by @andrewpareles in https://github.com/voideditor/void/pull/159
* Improve documentation by @andrewpareles in https://github.com/voideditor/void/pull/161
* Groq Added by @Piyu-Pika in https://github.com/voideditor/void/pull/141
* refactor: modularize LLM providers and types by @pythons in https://github.com/voideditor/void/pull/144
* Model selection by @andrewpareles in https://github.com/voideditor/void/pull/172
* Add native autocomplete by @mathewpareles in https://github.com/voideditor/void/pull/156
* UI improvements by @andrewpareles in https://github.com/voideditor/void/pull/168
* Minor Contrib.md changes by @andrewpareles in https://github.com/voideditor/void/pull/175
* UI Improvements by @andrewpareles in https://github.com/voideditor/void/pull/176
* Misc UI Improvements by @andrewpareles in https://github.com/voideditor/void/pull/180
* UI Improvements and Model Selection by @andrewpareles in https://github.com/voideditor/void/pull/182
* Fix React build crashing watch-client and added watch mode by @bjoaquinc in https://github.com/voideditor/void/pull/181
* Daily UI improvements by @andrewpareles in https://github.com/voideditor/void/pull/185
* New-services by @andrewpareles in https://github.com/voideditor/void/pull/189
* Merge model selection branch (ctrlK, model selection, UI) by @andrewpareles in https://github.com/voideditor/void/pull/195
* Fix - bundle - ajv missing deps by @jcommaret in https://github.com/voideditor/void/pull/192
* misc necessary updates by @andrewpareles in https://github.com/voideditor/void/pull/196
* Fix line indexing for CtrlK by @andrewpareles in https://github.com/voideditor/void/pull/197
* License update by @andrewpareles in https://github.com/voideditor/void/pull/199
* Update CONTRIBUTING.md by @PraveenAsh in https://github.com/voideditor/void/pull/202
* fix react build.js to properly find the base folder by @rluvaton in https://github.com/voideditor/void/pull/203
* License by @andrewpareles in https://github.com/voideditor/void/pull/211
* Latest updates by @andrewpareles in https://github.com/voideditor/void/pull/212
* Latest UX/UI updates by @andrewpareles in https://github.com/voideditor/void/pull/214


### Links
- [Waitlist](https://voideditor.com/email) for the official release.
- [Discord](https://discord.gg/RSNjgaugJs) channel.


