## v0.96.1 — 2026-09-21

# Quick little theme API adjustment

Hey! ICYMI [we released support for themes](https://github.com/charmbracelet/crush/releases/tag/v0.96.0) a few hours ago. Before they get too widely adopted, we’re making one small breaking API change to the names of keys.:

`insert_bg` -> `insert_code_bg`
`delete_bg` -> `delete_code_bg`

This is what it looks like in code:

```jsonc
{
  // ...
  "diff_insert_fg": "#629657",
  "diff_insert_code_bg": "#2d3431",
  "diff_insert_gutter_bg": "#282d2c",
  "diff_delete_fg": "#a45c59",
  "diff_delete_code_bg": "#33272d",
  "diff_delete_gutter_bg": "#2a232a",
  // ...
}
```

See ya!
Charm 🎸

## Changelog
### Other stuff
* 56abdfa7f1fa2cbe1e073f553bc10b06598046f9: themes: prefix diff theme keys with diff_ (@meowgorithm)
* a88b5735ff056b52eee8d30121b85c8a8ca79601: themes: small adjustments to the key names in the theme API (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.96.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.96.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.96.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.96.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.96.0 — 2026-09-21

# Themes and more!

This release is *HUGE* and we are so excited to share what our team and contributors have done!

## The long awaited feature!

<p><img width="800" alt="out" src="https://github.com/user-attachments/assets/656752be-6b87-4515-a3ab-68e43b655dd9" /></p>

Crush now has themes! 🎨 Open the new Themes dialog from the command palette to switch looks with live preview, try the built-in Gruvbox Dark, or create and edit your own custom palettes right inside the TUI. Thank @meowgorithm and @gurnben for this feature!

## QoL and fixes

Small changes but no less important.

* Hypercredits are now displayed in real time!
* Added spaces to errors in chat by @taciturnaxolotl
* Increased default timeout to 2 minutes by @andreynering
* Fixed extended help, while in a mode by @meowgorithm
* Fixed wrapping while displaying the plan
* Fixed syntax highlighting on long bash calls by @taciturnaxolotl
* More bang mode and bash tools improvement also by our favorite @taciturnaxolotl

See more below!

Happy week!
Charm XX 💫

## Changelog
### New!
* b07464e98e61248469ca2307ceb30520b1316d5b: feat(hyper): live display of hypercredits (#3699) (@andrinoff)
* f38b7947fd52b635b84f9b4ce70713675534080c: feat: add theme support (#3884) (@gurnben)
### Fixed
* 051fb37ae1d6bd6d6f2f6cbc8a629d5f85aa9bd7: fifix(ui): color the to-do task name while the tool is still running (@taciturnaxolotl)
* b8e93d119273032cb51cb249d87ca994d61fe7e5: fix(bash): let the agent recover truncated tool output (@taciturnaxolotl)
* 10ec02a58c581c060aaa52279347bf716ad7ef08: fix(shell): bound bang-mode output and spill the rest to a file (@taciturnaxolotl)
* 2019da14717e4e00aeee7664873c6b78f147a3eb: fix(tui): unfreeze spinner clock when the boot busy probe lands (#3839) (@andreynering)
* 242b4d3aaa024e26937f7579869d81e007c17c42: fix(ui): drop the empty gap under a failed edit (#3851) (@taciturnaxolotl)
* e41ae8ee78dafe884eb4f6e18ffd38d3d6d706e5: fix(ui): keep syntax highlighting across a wrapped tool parameter (#3850) (@taciturnaxolotl)
* eb845a9eacd25c5ce6522ae90c82289f43b5833d: fix(ui): nudge the yolo/plan badges + align help (#3863) (@meowgorithm)
* fd58b5ed201f490641d018cab6f06a29cdaff2c0: fix(ui): read the session transcript off the event loop (@taciturnaxolotl)
* 87a5bbd874d4d78a506237ba4b6d94d8a4f5b59e: fix(ui): set the finish banner off from the message above it (#3815) (@taciturnaxolotl)
* 9636af6446be2274b9b5b048c1d122ebad9c7b41: fix: wrapping in plan display (#3888) (@andrinoff)
### Other stuff
* 239d00630d719b8cc8838806201ae9205c12466e: chore: auto-update files (@charmcli)
* 3bc8ff4fc76ef38fbecf3f6df338fce3d1616001: chore: auto-update files (@charmcli)
* 27a53ef82b8b63817f92540d37850482dd9daddd: chore: auto-update files (@charmcli)
* 591167920d6850effe669c423d8e76b184057570: chore: bump devShell to Go 1.27 (#3832) (@LarsArtmann)
* 460653aa2599329a99b9c0d493e53e0f356d8ea5: chore: double default request timeout from 60 to 120 seconds (#3862) (@andreynering)
* d55e017d60cdb87ecb21a19a9fed9a2097c0da64: perf(agent): read only the post-summary tail of a compacted session (@taciturnaxolotl)
* 978d49d53f9343f2e57406cc503daddf282e12ae: perf(db): cap prompt history at the 200 most recent messages (@taciturnaxolotl)
* 296b5c396260ece70fdceed288ed25c7a99ba349: perf(db): index messages by role so user-message reads stop scanning (@taciturnaxolotl)
* 595f625f19a6a186307b911d59dd37c764541251: perf(message): decode message parts in one structural pass (@taciturnaxolotl)
* 9207cb2c053ecbe3ec5c0c3985b746877c1f322d: perf(ui): skip the global prompt-history scan when a session is loading (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.96.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.96.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.96.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.96.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.95.0 — 2026-09-16

# Hello, Plan Mode

This release introduces many improvements but, most importantly, and a solid new feature from one of our very talented contributors:

## Let’s plan

<p><img width="600" src="https://github.com/user-attachments/assets/8118b573-6d41-4cfd-a602-141b5e59f28e" /></p>

At last, thanks to the very talented work of @vadiminshakov and @andrinoff, we present the long awaited Plan Mode.

Plan Mode is for…planning. Talk to the agent, answer questions, and put together a plan and then, when you’re ready, get to to work. You can activate plan mode with <kbd>shift+tab</kbd>.

## Juicing more perf

@andreynering and @taciturnaxolotl marched forward in the quest for max perf in this release. Details below.

That's all for now. See you soon!

Cheers,
Charm xx 🌟


## Changelog
### New!
* 1648f10ac039e126635e26d4a16647331b2d6f0c: feat: add plan mode (#2822) (@vadiminshakov)
### Fixed
* 051fb37ae1d6bd6d6f2f6cbc8a629d5f85aa9bd7: fifix(ui): color the to-do task name while the tool is still running (@taciturnaxolotl)
* 2019da14717e4e00aeee7664873c6b78f147a3eb: fix(tui): unfreeze spinner clock when the boot busy probe lands (#3839) (@andreynering)
* fd58b5ed201f490641d018cab6f06a29cdaff2c0: fix(ui): read the session transcript off the event loop (@taciturnaxolotl)
### Other stuff
* d55e017d60cdb87ecb21a19a9fed9a2097c0da64: perf(agent): read only the post-summary tail of a compacted session (@taciturnaxolotl)
* 978d49d53f9343f2e57406cc503daddf282e12ae: perf(db): cap prompt history at the 200 most recent messages (@taciturnaxolotl)
* 296b5c396260ece70fdceed288ed25c7a99ba349: perf(db): index messages by role so user-message reads stop scanning (@taciturnaxolotl)
* 595f625f19a6a186307b911d59dd37c764541251: perf(message): decode message parts in one structural pass (@taciturnaxolotl)
* 9207cb2c053ecbe3ec5c0c3985b746877c1f322d: perf(ui): skip the global prompt-history scan when a session is loading (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.95.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.95.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.95.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.95.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.94.2 — 2026-09-14

## Lil’ OpenAI-Compatible Protocol Fix

This is a hot little mini patch to fix a regression in OpenAI-compatible endpoints that could occur when turns were stopped partway through. This regression happened because we were _furiously_ making improvements for the DeepSeek V4.X Flash series that you all cannot seem to get enough of!

Thanks also to the very patient @teddytennant who fixed a small bug around turning home dirs into ~s.

xoxo,
Charm

## Changelog

* 6f670995436a0bab99e3fdddd0eebc5c52c39072: fix(home): require path boundary when shortening or expanding ~ (#3552) (@teddytennant)
* 066f4444d086aeac877ec0a67eb2a3d56fedde27: openaicompat: bump fantasy to fix regression around reasoning-only turns (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.94.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.94.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.94.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.94.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.94.1 — 2026-09-12

# ChatGPT subs, non-interactive improvements, and a touch of perf

This is a pretty solid release with some nice contributions from both the Charm team and one of our fave contributors. Let's go!

## Use your ChatGPT subscription in Crush

If you love Crush _and_ your ChatGPT subscription you’ll _love_ this release. Enjoy!

<img width="500" src="https://github.com/user-attachments/assets/8d171404-b982-45cd-9afe-124fea8f605c" />

## Non-interactive mode: reasoning

Headless Crush users now get more control with a new `--reasoning-effort` flag in `crush run`. Go crazy and orchestrate to the max!

If you (or your agent) mistypes a reasoning effort you'll get the proper accepted values, too.

```bash
crush run --model "hyper/glm-5.3" --reasoning-effort "max"
```

<p><img width="700" src="https://github.com/user-attachments/assets/ffaecd31-6458-49f2-8fa3-40ef6760393d" /></p>

## Shredding the perf

@taigrr contributed a bunch of solid performance improvements to scrolling and spinners. Mouse scroll events are coalesced, chat scrolls are memoized and the spinners all use a shared clock. This stuff is really good: check it out.

<p><img width="500" src="https://github.com/user-attachments/assets/f6ba708c-bee7-472f-8cad-36707217d1f7" /></p>

## Choppin’ off 4MB

We also ripped the Swagger stuff from client-server mode with a hand-rolled—but fully OpenAPI v3.2.1 compliant—implementation. This shaved about 4MB off the binary and will nullify chances of in the long run. Thanks, Go type system!

Have a great weekend,
Charm 💌

## Changelog

* efba40b7bf88ca143587cbdebb74cf1b463c316a: feat: OpenAI oAuth (@andrinoff)
* 4a74b9e095792217e95867bf74c1aa86fef44ee2: fix(sessions): keep list position after deletion (#3769) (@ifsin)
* 33be610debb1eaf33bac40e0b089e1aa84d05602: fix: @meowgorithm review (@andrinoff)
* 63829edfa302a120d954866bada40e1ca9003ea8: fix: always emit tool results right after calls (#3743) (@andrinoff)
* cdc72006bf73e9d137516d3fa44c44d64ec192cf: fix: always show full bash command in tui, output stays collapsible (@andreynering)
* d25b5eee64b950bf8095506e312bc8f46b77cc26: fix: colorize CLI mode and use localhost URL (@andrinoff)
* 45a45c5cc1768bf70c6ee5cb02760c3111eb6133: fix: do not remove from API catalogue (@andrinoff)
* 80ebee418ceb66d79c0a2edd5a37f798a43e84e5: fix: dropped reasoning effort (#3748) (@andrinoff)
* 074e41e18e794b578566ab14f43eedf844f6e2a7: fix: keep scroll position when expanding or collapsing chat items (@andreynering)
* 094ac5db6dd347dd204f1b940b57e02f90e5c836: fix: match ex. anthropic UI on choice (@andrinoff)
* 04eed5d491a91b80fb17a2849a30df0c521c8708: fix: refine first page (@andrinoff)
* 652f74ffe2773b975aa8e74c8f51b973f0ddbaa9: fix: remove re-routing logic (@andrinoff)
* 3a84d5e726fe5a03ddfc439129cd43f28282ba1a: fix: remove the Sign In with ChatGPT in catalogue (@andrinoff)
* 616c17ba8a762656fa18a36ea504a35cf93e4ab8: fix: remove the separate sections (@andrinoff)
* 833bef6306750976921f30fee17b834aff6a9d45: fix: show content in full when collapsing would hide only one line (@andreynering)
* bb33cee2d32780cb5afa31fc3aa815302b9f7443: chore(event-bus): make event fan-in helpers generic methods (#3768) (@taigrr)
* 8829832414aeb363f095e804c60c23baf7555b06: chore: bump fantasy (@andrinoff)
* e5687e2d97eee9952bbe4fd6c79dc8949251ebf4: chore: lint (@andrinoff)
* 8db8331c38ccc7e9434bc4317bd5b67244029b8d: noninteractive: add --reasoning-effort flag with model validation (@meowgorithm)
* 18447d5fe71733c3d06ff94ad534aa8fb0e5a94a: oauth-cli: adjust inline logout TUIs (@meowgorithm)
* bc3931c8ab45965b22817eb43b1a51af242bbf1f: oauth-cli: overhaul and unify oauth TUIs (@meowgorithm)
* 7a63cb157a77079507b4eb54d9cc5a4e5a8e5fad: oauth-ui: small nudges (@meowgorithm)
* e2f077cd157c0853ca955bb4c423d5914b05f093: oauth-ui: use ChatGPT instead of OpenAI in the auth dialog copy (@meowgorithm)
* c21c7c45f1db69fb8e95beb80faffc9ea5ba0d3e: refactor: replace swaggo annotations with a Go-native endpoint registry (@meowgorithm)
* 8ce2bdfb6da9f1375f99510678e053fb37bf47f7: ui-perf: drive all spinners from one shared animation clock (@taigrr)
* 0ffab3f772bf02bf503e2636769ae4a1f5334367: ui-perf: memoize rendered frames for scroll-only updates (@taigrr)
* 35b5f8777681fc991521c5621f5664998b71b4f7: ui-perf: stop coalesced wheel scrolls from rewinding to the selection (@taigrr)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.94.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.94.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.94.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.94.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.93.1 — 2026-09-09

## Disable mouse support + more

Hey, how's your week going? We have a few changes today, including mostly fixes but also a few nice additions.

## Disable mouse support

Want to disable mouse support in Crush? Feel lucky because our favorite contributor @timotheosh added just that.

With the config below you can achieve that. It's also possible to toggle it via the command palette dialog.

`crushrc`:

```bash
option ui mouse false
```

`crush.json`:

```json
{ "options": { "tui": { "mouse": false } } }
```

<img width="600" alt="image" src="https://github.com/user-attachments/assets/ad64e680-d244-4e7e-9cb4-1b7fff6271ed" />

<img width="600" alt="image" src="https://github.com/user-attachments/assets/a2fd43cd-bb46-4326-93cf-596e5361d77d" />

## Fixed UX for non-vision models

In some cases, Crush were allowing you to attach an image even when the selected model was not vision-capable. The attachment was then being silent dropped in the request.

Now, we're properly validating it and showing a message so you know when it's not supported.

## Fixed some models on GitHub Copilot

On Copilot some models only works on the `/responses` endpoint: named GPT-6 Astra and the Grok models.

## Fixed some models on OpenCode Zen & Go

OpenCode also require some models to use specific endpoints. Not every model support the `/chat/completions` endpoint; some require `/responses` or `/messages`.

We fixed this issue for the models OpenCode currently supports.

## Fixed Sentry MCP + others

A misconfiguration made it impossible to authenticate with OAuth2 with a few the MCPs, including the [Sentry MCP](https://mcp.sentry.dev/). This is now fixed!

## Fixed potential memory leak

@caniko discovered a memory leak, specifically when `discover_models: true` is set. This issue was fixed!

To read the technical explanation, see #3162 and #3683.

---

See you in the next release!
The Charm Team :tm:

## Changelog

* fix(clipboard): only report copy success if it happens by @taciturnaxolotl in https://github.com/charmbracelet/crush/pull/3682
* fix: stop long reasoning traces from running away with the heap by @taciturnaxolotl in https://github.com/charmbracelet/crush/pull/3683
* fix(config): honor providers.json when auto-update is disabled by @kvnloo in https://github.com/charmbracelet/crush/pull/3693
* fix: inline code copying by @andrinoff in https://github.com/charmbracelet/crush/pull/3678
* fix: flickering screen when inline code was present by @andrinoff in https://github.com/charmbracelet/crush/pull/3708
* fix(copilot): route grok models through responses api by @DaVinci42 in https://github.com/charmbracelet/crush/pull/3705
* fix(discover): keep a user-set supports_attachments in the LM Studio enricher by @devYRPauli in https://github.com/charmbracelet/crush/pull/3703
* fix: assign models from opencode zen by @andrinoff in https://github.com/charmbracelet/crush/pull/3718
* fix(list): keep AtBottom honest when the top item is taller than the viewport by @taciturnaxolotl in https://github.com/charmbracelet/crush/pull/3720
* fix: make timeout configurable by @andrinoff in https://github.com/charmbracelet/crush/pull/3677
* feat(hyper): show the routed model that served each turn by @andreynering in https://github.com/charmbracelet/crush/pull/3713
* fix(copilot): route GPT-6 Astra through Responses API by @DaVinci42 in https://github.com/charmbracelet/crush/pull/3724
* docs(db): fix timestamp unit comments in initial migration by @LarsArtmann in https://github.com/charmbracelet/crush/pull/3576
* fix(config): resolve the provider cache through the global data dir by @devYRPauli in https://github.com/charmbracelet/crush/pull/3738
* feat(tui): add option to disable mouse support by @timotheosh in https://github.com/charmbracelet/crush/pull/3542
* fix: keep `top_k` for known custom providers by @jackgene in https://github.com/charmbracelet/crush/pull/3736
* chore: add CC-BY-4.0 to allowed licenses by @andrinoff in https://github.com/charmbracelet/crush/pull/3755
* fix: do not upload images if vision is not supported by @andrinoff in https://github.com/charmbracelet/crush/pull/3754
* fix: bump mcp sdk by @andrinoff in https://github.com/charmbracelet/crush/pull/3716
* fix(alibaba): do not send `enable_thinking` when we have an effort by @andreynering in https://github.com/charmbracelet/crush/pull/3758
* chore(deps): migrate `mvdan.cc/sh/moreinterp` to `mvdan.cc/sh/x` by @andreynering in https://github.com/charmbracelet/crush/pull/3761

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.93.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.93.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.93.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.93.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).




## v0.92.0 — 2026-08-31

# Compact Exit Banner + Mode

This release includes some fixes + an UX improvement.

## Compact Exit Banner

It's now possible to configure the exits banner to more compact, if you so wish.

`.crushrc`:

```bash
option ui exit-banner compact
option ui exit-banner none
option ui exit-banner default  # default
```

`crush.json`:

```json
{
  "options": {
    "tui": {
      "exit_banner": "compact"
    }
  }
}
```

Default:

<img width="467" height="216" alt="image" src="https://github.com/user-attachments/assets/d159cace-6bdd-46b9-94fc-2d93c23a8a13" />

Compact:

<img width="538" height="93" alt="image" src="https://github.com/user-attachments/assets/a75db291-a310-4fac-af7a-b001bf8f9c41" />

## Agentic fixes

We made quite a few fixes to [Fantasy](https://github.com/charmbracelet/fantasy/releases/tag/v0.42.0) to make it more stable and fix a few issues with some inference providers.

## Small Bash config fix

@devYRPauli made a fix to the Bash config. When adding a model, `--price-cache-create` and `--price-cache-hit` were swapped but this issue is now addressed.

The Charm Team


## Changelog
### New!
* a83480eb156fd75cd96b4fecaf3cc40570bb3142: feat: centralize tui option defaults and extract exit banner rendering (@taciturnaxolotl)
### Fixed
* ee455a9966c33086494d897b2c8b4b73d70c0ff5: fix(config): resolve provider base URL before custom validation (#3350) (@joestump-agent)
* 1e5be92e2ac9100959b34f90347522b2557f477a: fix(mcp): bound MCP init waits so a wedged server can't blank the app (#199) (#3467) (@joestump-agent)
* 1ea2714720ba2f7c2cd0889d965d83e28c0883e3: fix(mcp): scope error teardown to the erroring session; serialize refreshers (#3468) (@joestump-agent)
* 46469e2c710d65d2935da4503e7924f05479e54c: fix(selection): pin the selected item to the top (#3670) (@andrinoff)
* 404a93c6c8e114fa8c9e07e16a02a5c9b7f3f902: fix(shellconfig): stop model add swapping the two cache prices (#3679) (@devYRPauli)
* 7b38a40e760c1ee6e507334123761a1aee78dac9: fix(ui): preserve single line breaks in submitted user messages (#3655) (@joestump-agent)
* 7944b8e52225d8805e31eacbf7ef24856b0dfb7a: fix: update fantasy with several inference fixes (#3667) (@andreynering)
### Docs
* 599a4abc2db6af374f773eb35ac066c5da07cff8: docs: fix typo regarding JSON format deprecation (#3604) (@wangjiawen2013)
### Other stuff
* 07d662d9a5b0a49adbb6a233eae884c669a7a3f8: chore: auto-update files (@charmcli)
* 6d14dd93a9e526505f7de54ae5999431bc32a793: chore: auto-update files (@charmcli)
* 773c35656467769a12394ccd77119ec3bc960abc: resume: compact resume banner option (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.92.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.92.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.92.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.92.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.91.2 — 2026-08-26

# Fixed GitHub MCP + UI fixes

A small patch with a couple fixes.

## Fixed GitHub MCP

The GitHub MCP stopped working in Crush in the recent days, but it's now working again.

We `"sessionless": true` (or `--sessionless true`) that some MCPs might need to work correctly. For GitHub MCP, we're enabling that automatically so it works without extra config for you.

## Code indentation fixes

We fixed a couple bugs with wrong indentation in code in the UI. This could happen on tool calls previews or code inside markdown.

Example screenshots:

<details><summary>Before</summary>
<p>

<img width="1054" height="554" alt="Screenshot 2026-08-26 at 11 28 55" src="https://github.com/user-attachments/assets/70377d02-cc31-401a-bf9e-39c686968b8d" />

</p>
</details>

<details><summary>After</summary>
<p>

<img width="954" height="554" alt="Screenshot 2026-08-26 at 11 39 35" src="https://github.com/user-attachments/assets/99dd82f2-9090-4277-803b-97c1394d4db9" />

</p>
</details>

## New Hyper models

Last news, we have 3 new models available in Hyper!

* Qwen3.8-Flash
* Qwen3.8-27B
* Qwen3.8-2.4T-A95B

These are really good models, I hope you enjoy!

Don't know Hyper yet? Hyper is Charm's provider with a $20/m subscription. [Check it out!](https://hyper.charm.land/)

That's all for today. Keep crushing!
Charm 💌 

## Changelog
### Fixed
* 82557e2af69ff67fe50e53055bbe83dddbe07f6b: fix(mcp): fix sessionless mcp servers (e.g. github mcp) (#3651) (@andreynering)
* 460a877fcb60c32d3194a09f262be4cb4d5928bf: fix: preserve first line indentation in tool call previews (#3652) (@andreynering)
* 75962c4887d87dcd203b5fba9bf46fd3b52c77c3: fix: weird indentation on code blocks (#3642) (@andrinoff)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.91.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.91.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.91.1 — 2026-08-25

# Small patch

Hello friends. This release address a few small issues.

## MCP fixes

Our fave contributor @joestump did a couple fixes on how Crush handles MCPs to make it more reliable, specially when the MCP is mis-configured or mis-behaves.

## UX fixes

@andrinoff also made a couple fixes:

* Fixed <kbd>ctrl+a</kbd> after [v0.91.0](https://github.com/charmbracelet/crush/releases/tag/v0.91.0).
* Improved copying by selection with wrapped lines
* Added documentation on how to set a custom [Catwalk](https://github.com/charmbracelet/catwalk) URL

That's all for today. See ya!
Charm

## Changelog
### Fixed
* cce887189161f4be7fb2bfcdd1bcd5d78d43e7bf: fix(mcp): repair stdio startup diagnostics (#3634) (@joestump)
* a0fe47b62871ad39eea3723e9231a47ffb924cdf: fix: return to the start of the line (#3635) (@andrinoff)
* 8f63ee5937e29174466896918f60a558e3dd103e: fix: wrapped messages counted as newlines (#3627) (@andrinoff)
### Docs
* 06345cc328127ae6e71ca83c32d3bba1a4f8342c: docs: add documentation on how to override catwalk URL (#3585) (@andrinoff)
### Other stuff
* b0115a1baa2f7827240c0d443e2296a7d13638ac: chore: bump bubbles (#3636) (@andrinoff)
* c824c880768a4a251c841213d69b09bc0ab4d954: chore: bump golangci version to 2.13.1 (#3628) (@andrinoff)
* c4835512e04464fd8ea8dd9fdbc1059b9ec485d4: chore: merge main after v0.91.0 (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.91.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.91.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.91.0 — 2026-08-22

# Text selection and better mouse support

Just a few QOL improvements to the prompt editor and session picker for the weekend!

## Text selection

Hold <kbd>shift</kbd> and use the arrow keys or click and drag with your mouse to select text in the prompt editor. From there, you can use any of the fancy new shortcuts 👀

* <kbd>ctrl+shift+a</kbd> selects everything
* <kbd>ctrl+shift+c</kbd> copies the selection
* <kbd>ctrl+shift+x</kbd> cuts the selection
* <kbd>ctrl+shift+v</kbd> pastes text

Typing or pasting over selected text replaces it.

<p><img width="700" src="https://github.com/user-attachments/assets/9c68bd80-410b-43bd-aff0-6d1b1bd0d78e" /></p>

## Mouse support in the session picker

We've been missing mouse support in the session picker for too long! You can now scroll through sessions with the mouse wheel, click an entry to select it, or double-click to open it.

<img width="700" src="https://github.com/user-attachments/assets/6648ffa4-dbb2-4a7f-b8ac-f226ec035789" />

## A small Windows fix

Pressing a modifier key by itself could send some dialogs back to the top on Windows. They should stay put now.

Keep crushing!
Charm 💌

## Changelog
### New!
* 08552fb918a3b6247c2f8366d330f3b7f02fc891: feat: textarea selection (#3507) (@andrinoff)
* 90bc466d6f35b120070b6fd8a73f4262f155086a: session picker: add mouse support (@Amolith)
### Fixed
* 8661a1c4baa171f49b6f7ab3d4db7836cf5b5548: fix(windows): scrolling up on modifier keys alone (#3598) (@andrinoff)
### Other stuff
* 37f36e93824e5c4f892e4a817f7f628e2682fe14: chore: auto-update files (@charmcli)
* 7d78d7422a92918441a68d01d96d48fa3b9fd9db: chore: standardize go toolchain on v1.26.6 (#3592) (@aleksclark)


---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.91.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.90.0 — 2026-08-19

## Tiny patch

This is a tiny release, but we thought it would be worth it.

* Updated [Bubble Tea](https://github.com/charmbracelet/bubbletea/releases/tag/v2.0.9) with a couple fixes for some terminal emulators.
* Updated [Fantasy](https://github.com/charmbracelet/fantasy/releases/tag/v0.41.2) with fixes for AWS SSO and better cache hitting.
*  Fixed wrong background color on permissions dialog. This was a regression from adding Bash syntax highlighting on [v0.89.0](https://github.com/charmbracelet/crush/releases/tag/v0.89.0).
* Updated our `.gitattributes` to make development easier on Windows. We're normalizing LF (instead of CRLF) as line breaks to fix some tests on Windows.

## Changelog
### Fixed
* ed15da4c46e0bdc3afae4842db54e7def7b9f15e: fix(ui): use dialog background for bash syntax highlighting in permissions (#3575) (@andreynering)
### Other stuff
* 0f14334fb03703a5557f875d182e347e6375e0e7: chore: normalize line endings to `lf` via `.gitattributes` (#3555) (@Lin-BoYuan)


---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.90.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.90.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.90.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.90.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.89.0 — 2026-08-12

# A couple QoL goodies

We're releasing a few Quality of Life :tm: enhacements for you. They're simple, but these simple improvements compound with time to make Crush better and better.

## Hint on quitting Crush

When quitting Crush, you'll see a splash screen with a hind on how to quickly continue from the session you left.

<img width="468" height="351" alt="Screenshot 2026-08-12 at 16 41 43" src="https://github.com/user-attachments/assets/1b483466-f784-4176-9622-d3e4ca269839" />

## Bash tool syntax highlighting

When displaying what Crush is running using the Bash tool, the shell command will now have syntax highlighting. It's a small addition, but definitely improves legibility.

> Moo :cow:

<img width="862" height="561" alt="Screenshot 2026-08-12 at 16 47 25" src="https://github.com/user-attachments/assets/9a8a4523-7a50-4b27-a63c-fb96406f8c9b" />

## ctrl+end to jump to bottom + follow

If you want to quickly jump to the bottom of the chat, you can now just press <kbd>ctrl+end</kbd>. This will also ensure Crush will follow the chat as new messages arrive.

## MCP improvements

We enhanced things to make it more stable and fix a couple of edge-case bugs.

That's all for today. See you in the next release!
Charm 💌 

## Changelog
### New!
* 804324fb80a1133f678b0d8c3d74f32c16988c12: feat(session): print session id on exit (#3398) (@BrunoKrugel)
* b82d7d05d8883e3f05c9cb86a6f47bfa3b2ec59b: feat(session): restore last used provider/model from session (@meowgorithm)
* 90b48cda0991c37d3202327e20680f262c798c24: feat(ux): add bash syntax highlighting to bash tool (@andreynering)
* 36a4f79ac0e4056d8b5396bb741d91832998a785: feat(ux): strip redundant cd-to-project prefix from bash tool display (@andreynering)
* 25bf6a2551df8c5baefb94ff6d77c4105a2ce8c3: feat: ctrl+end to go to the bottom and follow (#3535) (@andrinoff)
* 01da7bc6a8cb3f3d5fe6bf68734fc22c43e4458b: feat: use anthropic sdk from upstream (#3544) (@andreynering)
### Fixed
* c78cc67457a027b4e774904240446ed4f28d8b95: fix(mcp): only wait for slow MCP servers in non-interactive runs (@meowgorithm)
* 48768f8b3d37dcbde70a5d1e1c1b8d5021c656f8: fix(ui): don't block interactive prompts on MCP initialization (@meowgorithm)
* ec2fe4379f84efa91ad42cddcd02ac5784a5fbcd: fix: send hyper api key when fetching provider catalog (#3546) (@andreynering)
### Other stuff
* f50509d460badf3c914341ac367c91cd708d9131: chore(mcp): log how long each MCP server takes to connect (@meowgorithm)
* 2e024135e8bef2c929ff0a6e6ffc5837204c9e70: chore: auto-update files (@charmcli)
* feb63006e9452be370721c22a0c2a3be008fd475: telemetry: differentiate invocation types (#3533) (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.89.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.89.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.89.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.89.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.88.1 — 2026-08-07

# It’s Time for a Bugfix Throwdown

This release is all about stability and quality of life with a buncha fixes around MCP, server-client, and odds and ends. Here's what’s inside:

* **UX:** Typing `clear` in the command will match Summarize; thanks, @joestump!
* **LSP:** @piakdev fixed a case where LSP could panic
* **MCP:** Slow loading MCPs could block messages from being sent: we reduce default timeout
* **Server-Client:** MCP OAuth didn't work in server-client mode; now it does
* **Server-Client:** Clients in the same workspace could kill each other: not anymore
* **Server-Client:** When the server is running over TCP keystrokes no longer hit the server and slow everything down
* **Hyper:** Added various small improvements for better UX

Thanks for using Crush. Have good weekend!
Charm 💌

## Changelog

### New!

* cfad8143fc0414d1406a8b846708a43ee511a757: feat(dialog): alias `clear` to summarize in command palette (#3464) (@joestump)

### Fixed
* bdad0f11cd6a279548c9458349fec313cbbea4fb: fixmcp): don't hold callback port open permanently (#3481) (@taciturnaxolotl)
* 1134a5ddb8e762aa85452df12a98c17172ec189b: fix(dialog): raise permission-guard quiet period to survive natural typing pauses (#3393) (@albatrossflyon-coder)
* 768ffad29a49fcd4a63792fab057b2246e213622: fix(hyper): keep working cache when provider cache can't be written (@meowgorithm)
* 9efc08c7aeb6f46c3a5d260115856b610df187aa: fix(hyper): render error messages from back-end (#3513) (@andreynering)
* 42f3ce0cbea37e37cd4ef6bd3d83e1dab0401403: fix(lsp): handle window/workDoneProgress/create to prevent server crash (#3445) (@piakdev)
* 604a7e30e624ecbe5969d288c58ad1b092ac8917: fix(providers): swap the provider cache instead of rewriting it (@meowgorithm)
* 85d83ce4e2308e3d45298eacdeb1d6943a286cb4: fix(server): keep concurrent sessions from killing each other (@meowgorithm)
* ebd18571086389396004118a6680408d7ca87356: fix(server): mcp auth in client-server mode (@meowgorithm)
* 71fa577a7d40bc529d90c1ca0263e57f6170c1ed: fix(server): release test DB before Windows temp-dir cleanup (@meowgorithm)
* 390ee36122ded4bd60f412e47cf5383719355a84: fix(server): replace stale servers that predate shutdown_if_idle (@meowgorithm)
* 7cdef9e6ee69634dcbc694d9096b65fef2a092e7: fix(server): typing lag over TCP in client/server mode (@meowgorithm)
* cf4f4df3216cc0c5948241e4aac2cf7968e26e8a: fix(server): widen permission cross-client test timeout to stop CI flake (@meowgorithm)
* 69080c969ef16ec64127732a8c2deab4270807bf: fix(workspace): retire integration-test clients so the DB closes (@meowgorithm)
* 8fd69b4548a01606ae6d49bc9202b3be75904acb: fix(workspace): wait for recovery notice before asserting resync (@meowgorithm)
* bb3d44954d4769c6f66c960df89e0f1b8d3f4777: fix: reduce default and suggested mcp timeout (#3509) (@andreynering)
### Docs
* 5f11f8e28aa7c757cfb7b54483b0b6654a64f776: docs(agents): mark crushrc as primary config format over crush.json (@meowgorithm)
* d99076e5ce59a73c8c3d21f8a3bd52bf4691c94d: docs: add missing OAuth flags to mcp add in crush-config skill (@pshickeydev)
### Other stuff
* 97ac1544991c1fc572fd3db7703f99db93dc3049: chore(mcp,ui): make 'needs auth' color tang, consolidate theme naming (@meowgorithm)
* 9882a88a2d668818047c445cc2e6fd4d7a7e2ea4: hyper: hide hypercredits if the server sends USD as the monetary unit (@meowgorithm)
* fb0f6c5808ea869e8b5f79a9b28248884fadf30c: refactor(server): tidy mcp client-server auth wiring (@taciturnaxolotl)
* b109e35f260cbb6a7903581728dbeb6d11895d57: refactor(ui): route all agent-model rebuilds through one helper (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.88.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.88.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.88.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.88.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.88.0 — 2026-07-31

# `.crushrc` is here!

Hey! Hope everybody had a great week. We were pretty productive at Charm and we're releasing some cool stuff today.

## Bash configuration! (`.crushrc`)

Yep, `.crushrc` has come! You existing JSON config still works, but we just started migrating to something a lot more flexible!

An example on why this is cool: if you manage Crush config in a `dotfiles` repo, you can still have machine-specific overrides by using `source` to call a separate file that will be in your `.gitignore`. I'm sure there are many other use cases.

To read the full documentation on this, [read this document](https://github.com/charmbracelet/crush/tree/main/docs/config).

See a snipped so you have an idea on how it looks:

```bash
# Add Ollama.
provider add ollama --type ollama --base-url "http://localhost:11434/v1"

# Register a model on Ollama.
model add ollama/llama3.3 --name "Llama 3.3" --context-window 128000

# Auto-approve some tools.
permissions allow view edit

# Add an MCP server
mcp add github \
  --type http \
  --url "https://api.githubcopilot.com/mcp/" \
  --header Authorization "Bearer $GITHUB_TOKEN"

# Load some extra config
source "$XDG_CONFIG_HOME/squid-config.sh"

# Change config based on the machine you're on.
if [[ $HOSTNAME == "babysquid" ]]; then
    option skill-path "$HOME/squid-skills"
fi
```

Want to give feedback? Join the `#crush` channel on [Discord](https://charm.land/discord).

## Better AWS Bedrock SSO support

@jan-xyz did a great job bringing this one to life!

When using AWS Bedrock via SSO, tokens expire with time and need to be refreshed. Crush now has a proper configuration and UX for authenticating, and it will appear whenever tokens need to be refreshed.

To read more about it, see #2886.

<img width="572" height="231" alt="Screenshot 2026-07-31 at 18 04 21" src="https://github.com/user-attachments/assets/993034d2-89d2-42f4-ba9c-30b01a1debd6" />

## More reliable Agent Fetch

@sven2718 contributed with better retries in searches when they don't work in the first try. Searches will be more reliable now, specially when doing many in a short period of time.

## Fix for Fable 5

@sven2718 also contributed with a fix for Fable 5. When Anthropic decides to reject your prompt for security reasons, we'll now a proper error message in Crush. Before, Crush would just stop without giving context on why.

## Crush now compiles on IlluminOS

Never heard of [IllumiOS](https://illumos.org/)? Neither none of us at Charm, but @timotheosh adjusted the code to ensure it compiles there now!

Go compiles to many environments, and it's always fun to see Crush working on more operating systems! By the way, do you know you can use Crush on Android? :robot:

## Enhanced MCP OAuth

In the last release, we shipped support for OAuth authentication for MCPs.

@BrunoKrugel did a few fixes to make more MCPs that require OAuth work as expected.

## Agentic fixes

Quite a few fixes were made to Crush as an agent as well. Some of these were made on [Fantasy](https://charm.land/fantasy) and brought to Crush.

## New Hyper models

Not less important, we keep bringing updates to [Hyper](https://hyper.charm.land), which is more stable than ever and has Minimax M3 and Qwen3.7-Flash avalable now.

---

A lot happened this week! We hope you enjoy, and Keep Crushing :tm:!
Charm

## Changelog
### New!
* 9e3ed61cfb6e1a6f087fef45e3a76faa9289a01e: feat(bedrock): retry the turn automatically after AWS SSO re-auth (@jan-xyz)
* 7810d0382d8d7699ddbaa2f9bbc484d5e6daaace: feat(config): apply top-level env vars on startup (@jan-xyz)
* 155072b32603bb0ebc2594fc90c2e47e25d2f566: feat(noninteractive): make the spinner text use terminal default (@taciturnaxolotl)
* 1c074540c33e76b22bb3536541a9422e05a63404: feat(oauth): give the browser redirect a real landing page (@taciturnaxolotl)
* c74146308cf8a02a3ebace4af07fa78acd259fa4: feat: add "option reset" to wipe shell config list options (@meowgorithm)
* 987ba71fba70b2d2bc9bbbb878ba8b437e1a416d: feat: add crush.sh discovery and loading (@meowgorithm)
* 528d8379b9785b96de0738acf292b93a30eb2566: feat: add permissions deny to hide tools from the agent (@meowgorithm)
* a5156e62153d7c35c53a2953230e046a9f24c9a5: feat: add provider-model builtin for defining provider models (@meowgorithm)
* 3f54c0e9ec522f2ffdeb66c6a94206f717189b0b: feat: add shell config builtins and ConfigBuilder infrastructure (@meowgorithm)
* c2b8f164564e381c32f04841e16c7ac7f35823d4: feat: add structured logging to shell config builtins (@meowgorithm)
* 9d31a1a45bb666c2a61d00024bbdaaf2443d8b87: feat: add verb-first hook add/remove shell config commands (@meowgorithm)
* eea3bf7fc1dc8364020d1dd11ba5f85de106f8dc: feat: add verb-first lsp add/remove shell config commands (@meowgorithm)
* 9a3cdbf99326b80fcc2c5dcd2f83764eccdcfd3e: feat: add verb-first mcp add/remove shell config commands (@meowgorithm)
* 52e041cdec17222d707f8bdf4ce51e27d41de6c1: feat: clarify model pricing flags in crushrc (@meowgorithm)
* c6fb635c895048887a6fadb72d0951706726943b: feat: configure attribution from crushrc (@meowgorithm)
* e99b8d6824f36f91835bb3fc043954e18eb44dbf: feat: expose CRUSH_VERSION to shell config scripts (@meowgorithm)
* 0b584610efa1a8d9ea7046e9b6268c1f87468f3d: feat: expose remaining advanced config through crushrc (@meowgorithm)
* 8bf07dab012aa70cccfaf18cb343442ff8a3801f: feat: make permissions use verb-first allow subcommand (@meowgorithm)
* 650bf3c2cd3ab8d1b90fab4687da9415e58766cc: feat: rename shell config to crushrc with local .crushrc override (@meowgorithm)
* 479da0f3f62f45540506c2a7d38182cffd1492f5: feat: verb-first provider and model shell config commands (@meowgorithm)
### Fixed
* 5e1cd7efe90f60caba4aa3febe919a5d7183faf5: (fix: fable) surface model refusals in the TUI instead of silently stopping work (#3453) (@sven2718)
* 63dc1f01b7ebf688fc333f1474cf0d23439c4f06: fix(auth): stop parallel sessions from invalidating each other's login (@taciturnaxolotl)
* 21619894abc598da8d0626dd5599568e0935ca06: fix(config): capture rollback snapshot before configureProviders (@taciturnaxolotl)
* 20e4dbc68e43e9548f471edaad97e4e8358a8dfb: fix(config): only warn when JSON and crushrc keys actually conflict (@taciturnaxolotl)
* 4dd4442a4a374f2bf51dd26de3b2b62e9f51932c: fix(config): retry transient Windows rename failures in atomicWriteFi… (#3469) (@joestump-agent)
* c7a59999560c4ffeba878c6e952799a611ec27c2: fix(config): track all discovered config paths for staleness (@taciturnaxolotl)
* ecdc6ed1d2b38c74bbbbeabd7ae4964549abaa7b: fix(config): validate crushrc JSON output, skip empty config paths (@taciturnaxolotl)
* b679ba1e0bba139562bd43a81c95770910a3ee58: fix(edit): auto-correct whitespace mismatches in edit tool (@taciturnaxolotl)
* 677046d28d5f794636787b18de5a93282ba18d17: fix(illumos): support building and running crush" (#3422) (@timotheosh)
* 560986ca010462769361ee46012f29eab05131ae: fix(mcp): MCP server loading in server-client mode (@meowgorithm)
* 2ca5a8c3680a5c04cd7673ce981e29d95f4059bb: fix(mcp): normalize oauth metadata redirects (#3415) (@BrunoKrugel)
* e68041a674711eb4986ee26e3e3bac1677fc41ca: fix(mcp): pin go-sdk to main for protocol version header fix (#3421) (@taciturnaxolotl)
* c3fd60ea6ac05eb7732bc3847e87791365fab7a7: fix(mcp): remove orphaned tokens from oauths MCP (#3418) (@BrunoKrugel)
* 3a71bdf3adac93930a13d20bbdac308a915fa1d1: fix(noninteractive): don't block non interactive mode on session title (@taciturnaxolotl)
* 954deae9ea9d146aefe99466eb63ea77578091dc: fix(server): deliver permission and question events reliably to clients (@taciturnaxolotl)
* 359c13f7aa195a3208cf75b60df53bdca0f2b0c9: fix(shellconfig): assert section/childMap don't overwrite non-map values (@taciturnaxolotl)
* a45ab254f99145eb22fde5068bf35e64d98002bc: fix(shellconfig): bound crushrc execution with context and timeout (@taciturnaxolotl)
* f14e773d9bd0b900a1c34074d65bbfe9b3ae5ecf: fix(shellconfig): dedup model add, document optionSpecs, pin deny target (@taciturnaxolotl)
* de671233b9f4eadcbc6aae4b3846800b7f72c490: fix(tools): surface DuckDuckGo rate limiting instead of empty results (@sven2718)
* 80ce583417c58a8abbfaa8de85a04b3d8eec586c: fix(ui): prevent double spinner on session reload after kill (#3457) (@taciturnaxolotl)
* b0c8c24a9076814fd54631fd17788f3c72a1c577: fix: accept mixed-case booleans in shell config (@meowgorithm)
* f13f8ebb9d7be16890b30a8bcb0f13876e1ed174: fix: discover global crush.sh, not just crush.json (@meowgorithm)
* 601f7f7dcbdeeaeb455d6a7ba6ac62b7f83d3b3b: fix: make crushrc source test pass on Windows (@meowgorithm)
* 7d8e93fb5783890266c8f6a016b84d1a898dc280: fix: never execute crushrc from machine data directories (@meowgorithm)
* ad709357ac90327fa41115ce7fd84cc89d839e0c: fix: resolve short session IDs in local 'crush run --session' (#3460) (@taciturnaxolotl)
* 884391f90f30dc215b31be6dd5ed5a3e832503f6: fix: stop long thinking blocks from re-rendering the entire document every frame (#3454) (@taciturnaxolotl)
### Docs
* 6fc78009db9743bd5c53faa04fd70ce71a28b5b8: docs(config): add notes on future state migration, update readme/docs (@meowgorithm)
* d8cae42ba5dc417db2f72438e55647ae7b2cea0b: docs(config): add windows paths, copyedits (@meowgorithm)
* 77444e407bfaee5124751a78ed337cb860d6b145: docs(config): make documentation more human (@meowgorithm)
* 0813dcb08d5318d87c939208e78e4a0636b41f8d: docs(crushrc): note that empty headers are dropped from requests (@meowgorithm)
* da35cd7da9c04ae609cc35b8ec5503e3d22ec165: docs(readme): improve flow of configuration section a bit (@meowgorithm)
* 874c0af8dfff0c34867b1efa3483df36ba632c09: docs(readme): update readme per bash-based config (@meowgorithm)
* f02ffbcec15a9f95cb9bcff895833df10f829aae: docs(ui): capture dialog rendering and chat perf rules (@taciturnaxolotl)
* 6f9b90c8ec30b736ca93a22a2878b468729dace7: docs: add config guide and future-work notes (@meowgorithm)
* 6421a2ba1a5793bd05359a7cca04ee64d832ef1a: docs: default crush-config skill to the crush.sh format (@meowgorithm)
* 810168b058cf53cbe510b59ba6e0d7ce17df6fe2: docs: document aws_auth_refresh and top-level env config (@taciturnaxolotl)
* 5d8af19548c1ea81496781dd812b8963e65d543e: docs: finish crushrc examples and option help (@meowgorithm)
* 3c736beb749c85feaebfef91b208e6a3e20d532a: docs: fix typos, grammar, and document deny-wins precedence (@taciturnaxolotl)
* f8c83fbe95042ab4772d5f083269027eb05639f4: docs: fix version typo and clarify config trust wording (@meowgorithm)
* 5e735ec8fc021eddab323037d2189033c26b8fd3: docs: lead README configuration with the crush.sh format (@meowgorithm)
* e3dee0b2045ca8e99d2b2d963cdfa96e4510a8f0: docs: note the deferred visible-but-always-denied tool state (@meowgorithm)
* 7b8f59f4c2bdc40ae627f6e1a3325afc98a6162c: docs: present crushrc commands as CLI-style help (@meowgorithm)
* b55a092f35980fcb54baa8ece0e80e1753ebade2: docs: update AGENTS.md with Bash config format (@meowgorithm)
* 812dc09b1ec7045d7f0024c8568d42a070101f3b: docs: use a local Ollama example in the config quick-start (@meowgorithm)
### Other stuff
* 5b88f46d34d22347e6bf71a9e1c63667c3695d84: bench(config): add crushrc load benchmark (@taciturnaxolotl)
* 0e7db4a91fa9aa78d9ae730ee2a07c355da92b1e: chore(crushrc): drop deadcode (@meowgorithm)
* 7aef2316d01c9523b3b0eef44c1eb8d2e26ffda9: chore(crushrc): log conflicting keys when json and crushrc compete (@meowgorithm)
* 38f5d98911e3f55c8e9bf6b18c353b3607b48790: chore: auto-update files (@charmcli)
* d15f793e8fc35f586f079c9916c0056d282bb9d1: chore: auto-update files (@charmcli)
* 100c8bd9750cceb440f79c27d5213df31a604634: chore: auto-update files (@charmcli)
* aa57f56120d3243f7979addb4f100147b531a620: chore: auto-update files (@charmcli)
* abceac2e2ac282055509a618556981949d3fb476: chore: auto-update files (@charmcli)
* f4ff2eaa37f397f5b2a914fe2aca2630832bca80: chore: bump fantasy to v0.39.0 (#3470) (@taciturnaxolotl)
* b83944c45805a4b7abcf3e245acddb8e58294972: chore: bump mcp sdk to 1.7.0 (#3447) (@taciturnaxolotl)
* 618a1182fafc0f467c06a3022d9ab1216ec25c32: chore: format (@taciturnaxolotl)
* def12cc6d8e162d6f48a7db260dde5ea3cc5f906: chore: gufumpt (@andreynering)
* 6785e86c1377f79cbfcc1ea728706b49117e959e: chore: merge main into crushrc (@meowgorithm)
* 15d2e1a3716d8f9fea7c75bfe7c7fb9562627567: chore: regen golden files (@taciturnaxolotl)
* 35d82d02ea8789e4f4ac78899c6a895cd84afb7e: chore: regenerate swagger docs (@taciturnaxolotl)
* 92d699898a9a1e4e03857ab0e53fab3b419af792: refactor(shell): unify jq into the builtin registry (@taciturnaxolotl)
* 5d082a14ee519a8680c3b9cb2920467162486ef2: refactor(shellconfig): collapse option type system into one table (@taciturnaxolotl)
* 7303e15ee71fb62fd26b8b31f7ccd43b18034926: refactor(shellconfig): replace copy-pasted flag loops with declarative engine (@taciturnaxolotl)
* 2a89bcacf550852b02b83cbc0b2d3ce35bc4c8fb: refactor(shellconfig): unify flagInt/flagInt64, make boolTrue a flagKind, checked assertions (@taciturnaxolotl)
* 6a6b21524710fe297ae9be4b014cbf952b2d49e0: refactor: build shell config imperatively instead of via JSON fragments (@meowgorithm)
* d8e0e734ee001cfa7b5ca3c2f178f651711ccf15: refactor: make list option keys singular (@meowgorithm)
* 84f5b9cfb14cd26fdbbaf64119158281d1416646: refactor: make permissions deny the only tool-blocking command (@meowgorithm)
* 3e176aff2980110785abe58a10d9dc77c1db8a1f: refactor: rename provider/model unset to remove (alias rm) (@meowgorithm)
* 380c219e01507e9b0c1f902dafd0feb8216ecb08: refactor: simplify shell config option booleans (@meowgorithm)
* 6c043ebc45dd37265f967999cac10698a50f3070: refactor: unify notification config under a single notifications key (@meowgorithm)
* 196dcf62a91de02a47cd2b04737b21a79ba420ec: refactor: use positional provider ID for provider-model, rename options to option (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.88.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.88.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.88.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.88.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.87.0 — 2026-07-24

# MCP OAuth, performance and more

Happy Friday everybody!

We're releasing some nice features for you so you can enjoy your weekend vibecoding. (Or not, stay outside :sun_with_face: and return to Crush on Monday! :smiley:).

## MCP OAuth

That's it, it's finally here! Some of you have been asking for this for long.

This is required for some MCPs to work. Want to know to it set it up? [Refer to this section into the README](https://github.com/charmbracelet/crush#mcp-oauth).

Thank @joestump and his agent @joestump-agent for this contribution. And of course, our favorite @taciturnaxolotl also helped.

## Claude Channels MCP extension

@joestump (and his agent) _also_ added an initial implementation to support the [Claude Channels MCP extension](https://code.claude.com/docs/en/channels-reference), which means MCPs can now send notifications to Crush when certain events happen.

Give this a try if you're interested, and let us know how well it works for you.

## Restored MCP prompts

MCP prompts were unintentionally disabled in a previous release, but they were now added back!

## LSP performance boost

Another cool contrib was made by @TheJhyeFactor, who vastly improved the CPU and memory usage on handling LSP servers in large repositories!

See #3370 for a more in-depth explanation of the optimizations.

## Bang mode performance boost

@TheJhyeFactor _also_ improved performance of output streaming when running command in bang mode.

Check #3381 to see some benchmarking.

## `/etc/crush/crush.json`

You read it right! Thank to @Muttaqin86 you can now have a system-wide Crush configuration on `/etc/crush/crush.json`.

The motivation for this was improving compatibility with NixOS.

## Fixed Copilot + GPT-5.6

All three GPT-5.6 models (Sol, Terra and Luna) are now fixed when running via GitHub Copilot. Kudos to @nghiant03 for this!

That was a lot, but it's really fun to how much the community is enganged with Crush dev.

Keep Crushing! :tm:
Charm


## Changelog
### New!
* 6f8a7fe8b2cd619e82683a70de252238f333052f: feat(client): reconnect the event stream after it drops (@meowgorithm)
* d291d9f2c189d1d8c1c4a18d4b73650fc4d20ac9: feat(cmd): add --channels opt-in flag for MCP channel servers (@joestump)
* 37fc995daca4486501acb6d03445a4bd6969d7f3: feat(mcp): OAuth 2.1 authorization for HTTP MCP servers (@taciturnaxolotl)
* 1588ae868a8ae7a0f13738cf04542c466dd50f65: feat(mcp): SSE OAuth, metadata fixups, and resource param stripping (@taciturnaxolotl)
* d338af88648a8f33f05624800013fcd11b0f1b97: feat(mcp): add OAuth support for HTTP MCP servers (@joestump)
* a1cf002270dede2be0b415ace5e36b199cb5773e: feat(mcp): detect claude/channel capability and receive channel messages (@joestump)
* b238696201229f30b073078b246c4f47416dd34c: feat(ui): tell a lost connection apart from an uninitialized agent (@meowgorithm)
### Fixed
* fbf59341beee53600e8e4f55b60d9392371dc22c: fix(agent): close dispatch completion-boundary cancel race (@joestump-agent)
* ae9257b9cdce0dfc4afb6a5e7407d40e988c616c: fix(agent): serialize in-process run dispatch to prevent concurrent turns (@joestump)
* a09cb3668c2871469250d42e1ced905fef84d820: fix(backend): log channel flag mismatch on duplicate workspace creation (@joestump-agent)
* 086dc626c68292089fb1c7d7e0569dc7efa52005: fix(client): add MCP prompts to ui in client-server mode (@meowgorithm)
* ca9ef6adeceed920f882a44f68b61ba9de2d9aba: fix(cmd): make --channels a persistent flag so `crush run` inherits it (@joestump-agent)
* 213ad7945184fbbd5ae0830a8ffc313fd8f3722f: fix(config): load system-wide config from /etc/crush/crush.json (#2984) (@Muttaqin86)
* 8ccf6945d6f9f0de98ed2e1f9900a322f7c91fab: fix(copilot): add additional responses models (#3416) (@nghiant03)
* 26399fc2ef5968db46627d3bcb2c57d4d330472c: fix(mcp): address OAuth review findings (timeout, refresh, concurrency) (@joestump-agent)
* bc8ff341a02f8d739dea37af2375f5dcde712474: fix(mcp): buffer channel notifications during capability negotiation (@joestump-agent)
* 1f623ec075cc28fbd1f683c6431bb8b54c23dd17: fix(mcp): filter channel events from the shared app event stream (@joestump-agent)
* 14fa1de881f0927f09c12bdeebb57ef36fb6578a: fix(mcp): prevent clients from inheriting channel opt-ins (@meowgorithm)
* 533fcf1e7c1006213cda8aeace3fff784d9a1c41: fix(mcp): prevent panic when auth signal fires twice (#3403) (@meowgorithm)
* f7c53cbc1d89c08622911c8407cfdaadfb922705: fix(mcp): route channel messages through must-deliver broker path (@joestump-agent)
* fed86b00bab56754bc97cd45875923e1489c737d: fix(mcp): tighten channel meta key validation for XML name safety (@joestump-agent)
* fd55b5d102169644a365f0835c09aca88303f419: fix(server): don't shut down while a workspace is being created (@meowgorithm)
* 2cb0bdb26778fbe65eba16aa010801367c0fc64c: fix(server): stop mapping channel events to spurious state changes (@joestump-agent)
* fa6ec09dc56bfa799be6b4639ff5e0569ef640d9: fix(server): wait before shutting down so back-to-back sessions don't race it (@meowgorithm)
* 00a18434bd33953c5458399ed57bf0238dccdb09: fix(test): fix nil pointer crash in Windows CI tests (@meowgorithm)
* 1b4ef73f1f6343832e57fbd3e7f71c3f03d0d835: fix(ui): keep shell progress output from corrupting the TUI (@taciturnaxolotl)
### Docs
* 7946b21e2e7c41838cb7685b41032151a20248b5: docs(mcp): add OAuth configuration guide and regenerate schema (@taciturnaxolotl)
### Other stuff
* 2af939d8e900f15edb5e78d766ff0b74dd4fe87e: chore(cli): hide --channels (@meowgorithm)
* 1ba4dc4b978e25b1486ebdab81871601ddd765de: chore(mcp): merge main; fix createTransport arity; inject browser opener (@joestump-agent)
* d2c66483d204effe8bb5f191a11e53e1da9ddc14: chore: auto-update files (@charmcli)
* b647ccd131099a652294dd31dfb5c568c44ca90d: chore: auto-update files (@charmcli)
* cba1ebcf9c21874c886920e0818bc1c7dad71b53: chore: auto-update files (@charmcli)
* cc971bd60d54d660632bd12c0fb83dbcd33f06ea: perf(lsp): filter servers before searching `$PATH` (#3370) (@TheJhyeFactor)
* e4175c52b8e14a4e158106ac5988fd42a8958457: perf(ui): avoid quadratic shell output rendering (#3381) (@TheJhyeFactor)
* 67e748e11c102be90cf881fabd954d2a0f290cee: revert: remove #3348 OAuth implementation (superseded) (@taciturnaxolotl)
* 1dad49ce8a2ddaefe9abffcae74f33d2d0e15c02: style: gofmt formatting cleanup (@joestump-agent)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.87.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.87.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.87.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.87.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.86.0 — 2026-07-20

# LSP tools, scrollable sidebar, removable attachments + more

Hey all. We're starting the week in style by shipping some LSP stuff and more goodies.

## Brand new LSP tools

These new LSP tools will allow the model to more accurately do some refactors:

* `lsp_rename` - Rename a symbol and all its references in the project
* `lsp_replace_symbol` - Replace, insert before/after, or delete an entire function/method/class by name

If something doesn't work as expected by the LSP, don't worry. We'll report an error to the model so it can fallback to using the `edit` tool.

## Scrollable sidebar

This one is pretty cool. Got out-of-space in your sidebar? Don't worry, you can scroll its content now!

<p><img width="600" src="https://github.com/user-attachments/assets/dfceb292-45e5-4946-8f75-fc6659b75c46" /></p>

Keyboard:

* When focused on the chat view: <kbd>l</kbd> or <kbd>right arrow</kbd> focuses on the sidebar
* <kbd>j/k</kbd> or <kbd>up/down arrow</kbd> scrolls up and down
* <kbd>g</kbd> scrolls to top <kbd>shift+g</kbd> scrolls to the bottom
* <kbd>h</kbd> or <kbd>left arrow</kbd> focuses back on the chat view
* <kbd>tab</kbd> always returns focus to the editor

## Removable attachments

It's now possible to remove attachments with your mouse! Just click on the `X` button:

<img width="618" height="174" alt="Screenshot 2026-07-20 at 17 26 51" src="https://github.com/user-attachments/assets/d2dc816e-e273-4252-8efc-48543b06466b" />

## Better Hyper OAuth

When authentication on [Charm Hyper ™️](https://hyper.charm.land/) or GitHub Copilot you can now press <kbd>u</kbd> to copy the URL. This is needed for certain scenarios, like when using Crush over SSH, where it might not be possible to open the browser automatically.

<img width="574" height="413" alt="Screenshot 2026-07-20 at 17 33 21" src="https://github.com/user-attachments/assets/56ef14e5-276d-4106-b375-907bbaa5e534" />

## Quit dialog hint

When rendering the quit dialog, we're now showing an hint that it's possible to skip the confirmation completely by simple pressing <kbd>ctrl+c</kbd> twice.

<img width="339" height="207" alt="Screenshot 2026-07-17 at 17 20 12" src="https://github.com/user-attachments/assets/886f1f59-3d00-42de-82d3-28ae44096d5f" />

## Agent fixes

* Reasoning effort level `none` is now working for Baseten models
* Thinking blocks are now rendering for MiniMax M3 via OpenCode (thanks @marifcelik)

That's all for today. Keep crushing!
Charm

## Changelog
### New!
* cd8c06ceb10f6cc90cc7989575e49d0c4c27b476: feat(lsp): add 4 new lsp tools (@taciturnaxolotl)
* 17ad5c7ffb7fa3021681528e68180d708d3b42e5: feat(lsp): add LSP superpowers tools (@taciturnaxolotl)
* 7eca7a04b1a7165b7088642612edf4ddc1cba171: feat(lsp): fancy diff view renders (@taciturnaxolotl)
* 8ad59d226c3e10eaa6c4c527a273d29b09ef92f9: feat(lsp): update system prompt to recommend lsp tools (@taciturnaxolotl)
* f8d855d5fe0808d83684611a820704e2789b654b: feat(ui): add scrollable sidebar with focus-based navigation (@meowgorithm)
* f413c9a9b24650e0c72fc4b77df219f3f8436045: feat(ui): auto expand reasoning dialog based on count (#3332) (@taciturnaxolotl)
* f604d989311458ab8063a5aa916588f1d84c8bc0: feat(ui): clickable ✕ remove button on attachment chips (@joestump)
* 4244f520330ce338045425899a2598cdf8858972: feat(ui): scroll sidebar with mouse wheel when focused (@meowgorithm)
* 047998766524393119b534b4ae5996a91ad93cd4: feat(ui): scroll sidebar with mouse wheel when focused (@meowgorithm)
* 79eedf79f9c12d23e3580339b7520e8f1384f286: feat(ui): show g/G shortcuts in sidebar full help (@meowgorithm)
* d50076469d7509345936d54853e98cd9a041a3d4: feat(ui): widen sidebar to 32 cells and reserve scrollbar column (@meowgorithm)
* 3446255daa028ba22505539dee6f6544f0faecbb: feat: add --all and --crawl-dir modes to stats subcommand (#2811) (@taciturnaxolotl)
* 12e96776a4a5d47146981f18c4fec3383128d151: feat: add keybinding and logic to copy verification URL in OAuth dialog #3323 (#3324) (@biisal)
* a02a9809a1420843ad14c6bc72f6523cf002013a: feat: on quit dialog, add hint on how to skip confirmation (#3356) (@andreynering)
* 8db57337ad5f0353154f0d61747b3624a84da290: feat: recover cleanly from mid-stream provider connection resets (@taciturnaxolotl)
### Fixed
* 1be8408601d4da2d61469ff96217d98e714ab6bc: Review fixes: attachment remove button (hidden clicks, mouse button, chip spacing) (#158) (@meowgorithm)
* 001a2f8542ebcbf56c2dfc95848b45f2ea378f97: fix(agent): preserve attachment chips in user messages after sending (@joestump)
* aca40878e2bb13d63ca8d89ce3b09993347090bd: fix(baseten): fix "none" reasoning level (#3386) (@andreynering)
* 461976d035ef984ce00145fed83f4454fb533228: fix(commands): scope logout command to oauth providers (@taciturnaxolotl)
* 55b2f0d1afbbf698fecef488e36baab080522e4f: fix(config): prevent data race when reading config during reload (#3362) (@taciturnaxolotl)
* b9a1182b8b4345150463be258297d9209108eccc: fix(lsp): add word boundaries to symbol grep and validate against LSP (@taciturnaxolotl)
* 07044a9b6a21d6e85bb5a38aa0c35d3a41a81956: fix(lsp): fix TrackConfigured startup race and relative path resolution (@taciturnaxolotl)
* 70cd684a71df6c571c1fb4b09b9a178aa1d1be9c: fix(lsp): lsp restart failing (@taciturnaxolotl)
* 132a8c89d84726c3e8e60ec9e104d684f3a7df85: fix(mcp): clear tools and close the session on MCP error; reap stdio process groups (@claude)
* 009ce621814d35d726f3f1c52d40e2d84dba92d6: fix(mcp): serialize renewals, restore all registries, arm init gate (@meowgorithm)
* 8246dff514e91e8a0a564b8bb467b7f799715e93: fix(mcp): wait for MCP init before building the tool list (@claude)
* 1ef42ef8688a325f955af89f4a119a6680ccff4c: fix(queue): fix pill border on queued messages (#3333) (@taciturnaxolotl)
* 4f4b84695dbb3b232a2df582383bdf62ab6c2d14: fix(refactor): refactor the edit tool to not duplicate find and replace (@taciturnaxolotl)
* 18c27999e3a8dce5555609bb399466515c927fe1: fix(tools): report every matching line per file in internal grep (#2994) (@officialasishkumar)
* d1626158d058f96b91aaf9ffce7cdf48a94579db: fix(tui): prevent stale background refreshes from overwriting UI state (#169) (@meowgorithm)
* 5b7d7f714d4371d3ecd5906c8191f2ecf5f009bd: fix(ui): align the compact sidebar logo (@meowgorithm)
* 4413344cfc85518689aaff70840bd044150a4bdf: fix(ui): keep chips in place when toggling attachment delete-mode (@joestump-agent)
* 885fe4d38f0d37f0e0f4354f3912c032adc75990: fix(ui): keep sidebar layout while scrolling full content (@meowgorithm)
* c5bf189cff3dade660822be11209a39652efeb6c: fix(ui): leave an empty column between sidebar content and scrollbar (@meowgorithm)
* 4b729a9351c7e0eb538609d20e058c05a2021984: fix(ui): only allow sidebar focus when content overflows (@meowgorithm)
* 5d9d37bcf55172d874a2993b7e38516ed37bbedc: fix(ui): prevent sidebar text clipping and restore sidebar focus (@meowgorithm)
* 74e725b393ecc45146fa8084cf934915790527e9: fix(ui): resolve timer display conflicts in thinking animation and tool spinners (#3353) (@taciturnaxolotl)
* 15e73964347903c0207b3e022c28c465d129884b: fix(ui): restore right padding on the attachment remove button (@joestump-agent)
* c3b320344e23b9fff0d3e5a28de33ed7c0566404: fix(ui): scroll sidebar details below the logo (@meowgorithm)
* c880f929c3732c5412fe9fae16efad0406461c25: fix(ui): use fgmostsubtle for canceled text (#3360) (@taciturnaxolotl)
* a882695e6053be206a48fea19d401c08d7575fd6: fix: enable thinking blocks for minimax m3 on opencode providers (#3335) (@marifcelik)
* 6d272018e5a9c2facfd074d310194a58fbb5feff: fix: keep chat pinned to bottom after a resize (#3336) (@taciturnaxolotl)
* 0d4c2bbc8ddeb8edebc5fa15075f21d2e99c5256: fix: keep the spinner animating when a response restarts (@taciturnaxolotl)
* a283fbd9fd696d3ff034b9ac6c78aaf006e497f3: fix: prevent new sessions from hanging in client-server mode (@meowgorithm)
### Other stuff
* e6756c9a9d181c69a8a5471c882efe7088b2faf6: chore(ui): remove dead Editor.AddFile keybinding (@joestump)
* d6543ba0fc5be2f4d80eb54196e8146c2c1ea696: chore: auto-update files (@charmcli)
* 8198d8eec7b11f74f8337087c67a4b7b31b063c7: chore: auto-update files (@charmcli)
* c95cdae6b20c9a30fb4446ef04a43a28f71cdeac: chore: bump modernc.org/sqlite (#3334) (@taciturnaxolotl)
* 57c63b99d280b9a6e0cbe54794b6303ecba31da5: chore: generate golden files (@taciturnaxolotl)
* 3b9f01937b71c273ab3dbc2e756c6930f257c363: fix(lsp/ui): fix stale sidebar state on render (@taciturnaxolotl)
* bd232eabf151e1d081b2d4f5b955c9c683a63489: perf(tui): keep synchronous workspace probes off the per-message Update path (@joestump-agent)
* efbe30833ddecc86c4bd0d7eb0b4947b931b5e15: refactor(ui): move sidebar scroll state mutation out of draw function (@meowgorithm)
* 6b6fab5e06a585f3ababd9c73ac8e3bd7fdb4c98: refactor: simplify edit tools and enforce Sourcegraph result limits (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.86.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.86.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.86.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.86.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.85.0 — 2026-07-16

# If you have questions, we have answers

This release brings us a question tool (at last!) plus a bunch of bugfixes and niceties. Let's go!

## The Question Tool

So! Crush now ships with a first class question tool, useful for when LLMs wanna grill you. The question tool comes in many forms, like single choice, multiple choice, free form text, and yes/no. Questions can be ganged together to build a form, too.

<p><img width="600" src="https://github.com/user-attachments/assets/81097b9b-6819-4e7d-9944-6ae771f6dab5" /></p>

What’s that you say? “Does it have mouse support?” Why, yes it does.

<p><img width="600" src="https://github.com/user-attachments/assets/75911693-49c9-4475-b812-935221337f5b" /></p>

What is this sorcery? Only @taciturnaxolotl knows. He solo’d this whole feature exclusively with open source models on [Hyper](https://hyper.charm.land).

## Hurry up and wait

Ever put an LLM to work, only to forget about it and come back and wonder how long it's been cranking? @andrinoff sure did. Wonder no more.

<p><img width="411" alt="output" src="https://github.com/user-attachments/assets/a2e35914-d89f-4a77-97d6-3283f1de06a3" /></p>

## And so much more

Like Prince in the 80s, @taciturnaxolotl continued his tour of awesomeness alongside @andreynering to make Crush better under the hood too:

* Fixed: `crush auth` now works outside of client/server mode
* New: Crush now auto retries auth under the hood when it fails
* Improved: dialogues now render great on tiny screens
* Perf: scrollbar optimizations for faster rendering
* Perf: memoized markdown renderer for faster rendering
* Perf: short circuit `jq` builtin operations if the turn was canceled before it started
* Yay! OpenAI merged our PR upstream so we're back off our fork

Buckle up, we have a bunch more coming.

xoxo,
Charm 💘

## Changelog
### New!
* 686a3f46e1876e9025a29bf846f11fac91bbb3f3: feat(dialog): hide list info column when it would crowd item names (@taciturnaxolotl)
* 75e7195fbd713d7f13dd242b8f994f11e070fe6b: feat(question): add client server integration (@taciturnaxolotl)
* 6f33b6668505ce0e30ef7e83fa642c9bf8c23c95: feat(question): add mouse scrolling (@taciturnaxolotl)
* 321c661e88079a6af12cec7a4606a389a5627a73: feat(question): add mouse support (@taciturnaxolotl)
* 1b5994c04f5a3e1c0d94cb05c80ccd07a187ebf1: feat(question): add paste support in text areas (@taciturnaxolotl)
* c2a6f76565600492aa2769d66ccd5ef7c00ea6a0: feat(question): add question tool with structured UI (@taciturnaxolotl)
* 9f4f145ad7c63bf6526d4517b88e8a98aa5bda96: feat(question): adjust question prompts and error messages (@taciturnaxolotl)
* 5e611a70a6e48ccb7dbb3ff020ee1efa5d37772d: feat(question): allow newlines and make free text like pop (@taciturnaxolotl)
* f69a91e5ab058a78c581af68c4e6bdde569bad44: feat(question): extend length limits on question tool (@taciturnaxolotl)
* 3bf40358a06e43863dc9689ea2bd286937063ca6: feat(question): make escape cancel the question instead of submitting empty answers (@taciturnaxolotl)
* 81a8ee4b54a980e4f4d08d1f7edfcbdd7a24b810: feat(question): redo tab resizing and mouse -> keyboard transition (@taciturnaxolotl)
* a5a5c6c54b40620ec2fdc20ccdf4b3224961a654: feat(question): tweak the confirmation tab (@taciturnaxolotl)
* 29f5691db4a9646910397bf7437e91f30c5d4fa3: feat(question): tweak yes/no to add shortcuts (@taciturnaxolotl)
* dc1609977e53f62843f6a9df78ba4283da62793c: feat: elapsed seconds timer (#3223) (@andrinoff)
* 64bbbebc430dd5031b92d62f179cbd6a22c09069: feat: integrate fantasy OnAuthRefresh for transparent auth retry (@taciturnaxolotl)
* d1489a603d357ab3e07dda66079130d4d5cdccb9: feat: wire LM Studio vision capabilities to SupportsImages (#3280) (@josh-socium)
### Fixed
* f3592bd8c501732e56128be07ce5fa694b008318: fix(dialog): account for the input prompt width so long values don't wrap (@taciturnaxolotl)
* 2c6424c179ee6ef21d2190744410ca289a9ad9da: fix(dialog): center permission buttons in fullscreen (@taciturnaxolotl)
* bbf654fb92f578bf5a1e4956b0d38b9297768fef: fix(dialog): centralize keybind hint rendering and stop overflow (@taciturnaxolotl)
* d6c63d31e255841038270d4b88ef347986e8da63: fix(dialog): clamp DrawCenter and DrawOnboarding content to screen bounds (@taciturnaxolotl)
* f6528f72ff5057fbb40d8e9b4f2ebf67b3fc119f: fix(dialog): constrain Quit dialog padding on narrow screens (@taciturnaxolotl)
* 31550cb4f9c04d9fc1d5e552be7745d2333cfee6: fix(dialog): fix OAuth content wrapping and full-width layout (@taciturnaxolotl)
* 352e26515901b9fd563fcbe7b8d945da678135d6: fix(dialog): fix model provider label truncation at low widths (@taciturnaxolotl)
* a69ace5e0bb4e0461c230498c29805446b137083: fix(dialog): keep dialogs stable on small screens (@taciturnaxolotl)
* 151b38d424fe561bc19669b10d7ee3aa66a4b19c: fix(dialog): make APIKeyInput width responsive to terminal size (@taciturnaxolotl)
* 3e2bd1cc4535eb5988c6990224f778256fcfb457: fix(dialog): make OAuth dialog width responsive to terminal size (@taciturnaxolotl)
* aaf92f866282d0eccacfa5a21025bcd25a504afc: fix(dialog): mute command list shortcut hints (@taciturnaxolotl)
* 605dfc9e3d3cc497f7594ced3820312cc32ddc3f: fix(dialog): remove dead space beside the list scrollbar (@taciturnaxolotl)
* 6407b8529ed394e6fef49c08fac3cdab165b8013: fix(dialog): scale FilePicker down on small screens (@taciturnaxolotl)
* 0c61aeee761afa9c967e9c6990e003bc4f5e6de7: fix(dialog): stop list item names from wrapping past the list width (@taciturnaxolotl)
* e271cecb3617626d8cf98fe94672c050d1eff2fd: fix(dialog): subtract border size in Reasoning and Notifications width (@taciturnaxolotl)
* e8c2772d272f179a9073b7214e236a2159429058: fix(dialog): truncate TitleInfo when it exceeds dialog width (@taciturnaxolotl)
* 2b4a01ae994cce7c2c9b5c08bb9d2aafad5dd15a: fix(dialog): truncate dialog titles instead of wrapping on small screens (@taciturnaxolotl)
* b5cd46c2381afda7adee567f7abadc101ef4dc2c: fix(errors): properly supress context cancelation error (@taciturnaxolotl)
* e34e707c175abd1a46f0135a2657d308129adb41: fix(events): restore file picker event (#3314) (@taciturnaxolotl)
* b75d6bc27b33bffb59b8ea9f304999515db74ff3: fix(oauth): fix the ui freeze on loading model endpoints (@taciturnaxolotl)
* 82e889858c654896b73bcd3e80616b5adc62fe11: fix(question): address PR review feedback (@taciturnaxolotl)
* ca5a19d7432a50eee59539b7568ce825a0bca2ce: fix(question): fix a bug with the hover state coming deselected (@taciturnaxolotl)
* cbb9d4f2614ad87d0d2feaf7b348189fa464e25f: fix(question): fix scrollbar disappearing in single-select (@taciturnaxolotl)
* 9e6175a2ea839a8a875f59e7ca05aa05e8780fde: fix(question): make scroll containers consistent (@taciturnaxolotl)
* 70c64b5794ec77cac6735007d68e20ae4e2fddd9: fix(question): route scrolling properly depending on which area is (@taciturnaxolotl)
* 5e6890de82a029bbb83b5e8205e483ec44e57207: fix(tests): bail on precancelled ctx in handleJQ (#3058) (@taciturnaxolotl)
* 1937ac54c597bb04553e8242e79314b5b1c0a9b7: fix: match question tool cursor color to main editor (@meowgorithm)
* ee00ec7bb6d0b698bad0bcda2cbf9e23ef307582: fix: respect client-server mode during login (#3315) (@andreynering)
### Other stuff
* 3c51a9f2f03e3f2e9de59a84d7a75e999c5ebe52: bug(client/server): fix non interactive init (@taciturnaxolotl)
* 2b969b2a862c250cbb8c529fe7148574a060f793: chore: auto-update files (@charmcli)
* 4721e53c30a0c51a718b84ff54f42cdee4e63ae0: chore: auto-update files (@charmcli)
* 14483caceb20c1d2283ffc69da1db7d42fb58540: chore: switch back to upstream openai sdk (#3308) (@andreynering)
* 4d901d1be4d4aec2dd1098b7e39c28e19c505b84: perf(ui): keep chat resize smooth on large conversations (@taciturnaxolotl)
* d29fc2ca6c84404ae40ff7dd72c76a079ed3a1bf: perf(ui): memoize chroma lexer lookups by filename (@taciturnaxolotl)
* 1bfc53f66fb92d9491b00b8602b7dff805bccca4: perf(ui): memoize the chroma syntax-highlight style (@taciturnaxolotl)
* e456a902c30e24fe5f4e7e8aa9060294079ed1a3: refactor(dialog): dedupe scrollbar joins and tame the permission Draw (@taciturnaxolotl)
* 492460a854cd890ac362390580b56f38ee2dd359: refactor: make the coordinator use a struct (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.85.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.85.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.85.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.85.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.84.1 — 2026-07-11

# Session affinity, for real this time

This bumps [Fantasy](https://github.com/charmbracelet/fantasy) upstream, which was missing in the last release to _actually_ send session id headers in the last revision.

Enjoy!
Charm 💘

## Changelog

* https://github.com/charmbracelet/crush/pull/3282/changes/5a7899eeba613ca0ddf3c03fdcf227cec0f85f36 chore(deps): bump fantasy (0.35.2 -> 0.36.0) (@coloryourlife)
---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.84.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.84.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.84.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.84.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.84.0 — 2026-07-10

# If you like caching and coding on your Android, you’ll love Crush v0.84.0

This is a mini release with two little niceties:

## Cachemaxxing

Crush now sends the fabled `x-session-affinity` header (and `x-session-id`) in its requests. Supporting providers can pick the header up, pin the session to a given replica, and go cache wild. The session header is a hash with no personally identifiable information, of course.

## Fixed: Termux

If you’re a nerd with an Android, you probably use Termux, the hot Android terminal emulator. If you’re a cool nerd, you probably _want_ to use Crush on an Android and are annoyed that it was broken. Thanks to @Ricardo-M-L, Crush now works on Android again.

Hope you're having a great summer! Unless you're in South America, Central America, the Southern part of Mexico, parts of Africa or Australia, in which case…hope you're enjoying the Winter!

xoxo,
Charm 🍔

## Changelog
### New!
* ebd845c003579484171922fda8a671367eee7684: feat(agent): send session hash in header for cache affinity (@meowgorithm)
### Fixed
* 5b61432984ba271cf9cb3791295ba94e9c2c8f81: fix(release): drop broken .termux.deb artifact (#2848) (@Ricardo-M-L)
* e3074f14cec703bdddba13e6df5cf2242b34194c: fix(server): show update notices in client-server mode (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.84.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.84.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.84.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.84.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.83.0 — 2026-07-08

# Prep for GPT-5.6

GPT-5.6 should launch tomorrow, and this release is to ensure Crush is ready for when it happens.

## Bang mode fix

We also included a UX small fix when navigating the history when previous prompts were Bash commands (using bang mode :tm:).

Charm 💘 

## Changelog
### New!
* d0dc9fc9dfce76b9e35b2686ee4bfccfca796222: feat: prepare for gpt-5.6 (#3270) (@andreynering)
### Fixed
* cb1292026cc113e2a2e61f14686f2a36551f74a0: fix(bangmode): don't add extra ! when browsing history (@meowgorithm)
### Other stuff
* 72c5668eface73b6e3745cccc8098f2cd1e55879: system prompt: avoid emdashes in source code (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.83.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.83.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.83.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.83.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.82.0 — 2026-07-07

# General fixes

Hello. This small patch includes some varied fixes.

## Better chat scroll

On some rare occasions, the chat could stop scrolling automatically to the bottom as the model works. We made some changes to make this more reliable!

## General agent fixes

There were a few fixes here and there making the agent behave better. We made thinking on/off and reasoning levels behave better for providers like Alibaba and Baseten, for example.

We are finally mentioning [Hyper](https://hyper.charm.land/) on README, which are our favourite inference service for Crush.

See ya!

## Changelog
### New!
* cbb6daaa80841614abc091f3201c5e635895c22e: feat(ui): preserve newlines in expanded tool content (#3239) (@taciturnaxolotl)
### Fixed
* d341d84b24fbe6471708c15f4dc08533a9ea6dc4: fix(alibaba): fix missing thinking traces on deepseek via aliababa (#3259) (@andreynering)
* 3ac7f1c48bbe3031772fb2f47c2f356283790591: fix(baseten): make the thinking on/off toggle work for baseten (@andreynering)
* 78a205cdb5f988aa6daa6c1907e88b4b9d2b2769: fix(copilot): guard nil request body in initiator transport (#3246) (@truffle-dev)
* ff12fa014e8f530daa8e52eecc716c79d18a363c: fix(scrollbar): only show on human scroll (@taciturnaxolotl)
* 6437f0d78c72987f9c90b5257f22504326b19c78: fix(ui): make chat follow-scroll reliable when content grows (#3240) (@taciturnaxolotl)
### Docs
* 3d603684539ffe2d5716784f1eee17e2e59ab843: docs(readme): mention `MOONSHOT_API_KEY` (#3251) (@TheRAWagent)
### Other stuff
* ebf6e826ebf8c58754597ef88dce3649ec91abbb: chore: add alibaba us (#3249) (@andreynering)
* e01ecdf2054af14a452109eb1d4d8402ad28f703: readme: add hyper (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.82.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.82.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.82.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.82.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.81.0 — 2026-06-29

# Some UX stuff for ya

We're starting the week in good style by adding some nice additions and improvements.

## Chat scrollbar

This is it, the chat just got a scrollbar! This should make your life easier on navigation long session. You can now see exactly where you are when scrolling.

It's possible to adjust the behavior with a setting: `options.tui.scrollbar`.

* `default` (hides after 2 seconds)
* `always`
* `never`

```jsonc
{
  "options": {
    "tui": {
      "scrollbar": "default" // default, always, never
    }
  }
}
```

https://github.com/user-attachments/assets/c0c0f888-78d4-4457-ae32-eb1a2dd5f575

## Herdr Support

Have you been wanting to use [herdr.dev](https://herdr.dev/) for all your agent management needs? Well now its even better! @taciturnaxolotl merged support for agent status signaling so now herdr can pick up on the status of crush and send you notifications when it is blocked or finished!

<img width="1470" height="956" alt="image" src="https://github.com/user-attachments/assets/4ab696c7-d105-4c91-b658-8902e930dc5f" />

## Lower CPU usage

Crush could use too much CPU when streaming thinking traces and showing them for you. @taciturnaxolotl worked through an optimization and that's now fixed!

## Fix possible deadlock on startup

If you happen to have a model ID in your config that does not exist anymore (was removed from the providers), Crush could lock when booting and not start at all. This bug was addressed.

## Images and your session

This is another fix to prevent your session from breaking when you switch to a non-vision model but your session already has images. We're going to skip the images so your session keep working.

That's all!
Charm

## Changelog
### New!
* b39a85ec2b2be2ca8c759383cdc39ce325dda1dd: feat(herdr): add herdr socket integration (@taciturnaxolotl)
* b72f9aab844ab42de7bcf778e3fcf743a010d0bd: feat(ui): add scrollbar to chat view (#3018) (@andreynering)
* db8add714e294401ce2e716459376f3803fac3ce: feat(ui): allow expanding toolcall names (@taciturnaxolotl)
### Fixed
* f75435a2ac2e69cf4d64ad15bf5d84f284cdecd6: fix(agent): fall back to first reasoning level when default is unset (#3218) (@syf2211)
* d3d68045ff907c8a7103f78c99c5b517476aa65a: fix(agent): prevent session bricking when non-vision models receive tool result media (@taciturnaxolotl)
* a08e3329c0b540cc851f5d2e0e9405cd06fa7c2c: fix(bash): keep TruncateOutput from splitting UTF-8 characters (@feizhuzheng)
* 1535ebb7cd206029591dfe9ae5b269193d4cad2f: fix(config): prevent stale ReasoningEffort from leaking across providers (#3209) (@huaiyuWangh)
* d4dc84e91471a6c794a037ff5012e42fd070e960: fix(config): prevent startup deadlock when configured model ID is invalid (@taciturnaxolotl)
* 188dea64e2e84468c4d2059e4e8ce2f580c2efdb: fix(fsext): DirTrim renders wrong character for non-ASCII directory names (#3214) (@feizhuzheng)
* a07d304f9174d57059a5264b2c34dfd431fa00ff: fix(hyper): refresh hyper oauth token before fetching credits (#3212) (@andreynering)
* a1b19ebc33e4085af0322d665cb3bb7fbd66c713: fix(prompts): unindent heredoc (@taciturnaxolotl)
* a9e3a57f7a9f40cd411e5ac1b98156b8240ed1fb: fix(shell): skip persistence when session no longer exists (@syf2211)
* 3a99992e863a5fe82266f9eec6433affac956b12: fix(ui): ansi.truncate instead of byte slicing in todos (@taciturnaxolotl)
* 9c61c7d032504a21760478c4c72f81cce7a11efc: fix(ui): use ansi.truncate everywhere (@taciturnaxolotl)
* 3295a085cfb405c450ae3ac1fd89ab8989793e99: fix: cache streaming thinking renders to avoid CPU burn during long reasoning traces (@taciturnaxolotl)
### Other stuff
* 5c934c30954f6241fb1acb582ef4376bb958702a: chore: auto-update files (@charmcli)
* f645040c1ba002fa8c65e0addd5e5be4eae35337: chore: auto-update files (@charmcli)
* fcccdfee42a77eb67b54d670ca3463121522dc4a: chore: auto-update files (@charmcli)
* 358d75dbdbc4bd329cde36e71065805cf5762ed1: chore: regen golden files (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.81.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.81.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.81.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.81.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.80.0 — 2026-06-25

# The Ol’ Thursday Patch

Hi all! It's patch time, and time for some bonus features. Let's go!

## Fixin’ broken tool calls

Occasionally a model will opt to do a tool call with invalid arguments (invalid JSON), the session was just breaking, and even new prompts wouldn't anymore. We're now validating the issue and reporting it as an error to the model so it can correct itself. Of course, we also fixed the associated bug in Crush so sessions will no longer break.

## Local models: auto-detectin’ context windows

Who loves [local models](https://github.com/charmbracelet/crush#local-models)? Now, Crush will now automatically detect models context windows with you add an endpoint for `llamacpp`, `omlx`, `lmstudio`, `litellm`, and `ollama`. Prior to this it was mis-setting window sizes to zero.

## Config: harder, faster, stronger

Okay maybe not harder. But config in Crush is definitely faster and stronger.

We refactored on the so it's _way_ more performant and safe for big, long configs where there are many providers, models, and so on. This also means that the model picker dialog will load faster too! We also added some safeguards to prevent race conditions when multiple Crush instances try to update the config at the same time.

## You look great

That's all for today! Keep crushing it, everyone. :cupid:

## Changelog
### New!
* c1a482267431964b9c27f16b925fd659a1b222c2: feat(providers): add llamacpp enricher (@taciturnaxolotl)
* 4be77c5675b38f851a94040794cbe3417f5dee20: feat: log provider warnings from fantasy step results (@taciturnaxolotl)
### Fixed
* de6792039e757b533589da4165a2ed4182ed94cb: fix(auth): stop two Crush instances from invalidating each other's login (@taciturnaxolotl)
* b10f890f55b1c00969b8e59a6828b6f405103b5a: fix(config): make concurrent config access race-free via copy-on-write (@taciturnaxolotl)
* af76fa73bfce9042c1ffeaade2371355a869cfee: fix(docs): set proper auto discovery models flag (@taciturnaxolotl)
* 67f50014e81be7fbdf1187fa78e65279b87b7908: fix(glob): keep file search fast and bounded on large directories (@taciturnaxolotl)
* bb44fb1f4955920076da9f78a9f0738c2f4d5ecb: fix(hooks): bridge Claude Code additionalContext onto HookResult.Context (@ken-jo)
* 720698112727dacfd3d468c0414003b427aa7691: fix(scrolling): stale scrolling acceleration (#3197) (@chardoncs)
* cfdca3587fd5d515963db79e15a9f06071b18caa: fix: correct model discovery enrichment for local providers (@taciturnaxolotl)
* 1bb945c83f68f841c187b24638c4ca4d1ef4a8b7: fix: prevent flaky diffview golden tests on Windows CI (@taciturnaxolotl)
* 1350167227756c67ea429c5191a05f6b23fd35b8: fix: render pills box reliably when todos or queue appear mid-session (@taciturnaxolotl)
* 21a457d5e0de4cc56419ff239676bcfe52054b3d: fix: validate tool call JSON before storing to prevent stuck conversations (@taciturnaxolotl)
### Other stuff
* a5896b4f62d74643daad01ed03a34423386d6650: chore: auto-update files (@charmcli)
* aa3bdedafedaaff8043f3a9091c1fe0adfdd552d: chore: bump fantasy to 0.33.2 (@taciturnaxolotl)
* 7f7eb603ac7437156733b42be60c4e8961867fb3: chore: bump golangci version to fix lint issues in ci (@taciturnaxolotl)
* 6b68930b2d6a9d99b7bd7fe1a84ddf1e8498f475: chore: fix lint on interp.ExecHandler (#3200) (@taciturnaxolotl)
* f5b996bff40ecd881b5d92d8b876a08b62a94373: perf(config): make model selection and config reload fast (@taciturnaxolotl)
* 173b2be61b2906bf0bcb107081d700ed36550a85: perf(ui): skip theme rebuild when provider keeps the same theme (@taciturnaxolotl)
* 81cb9d990aa272dc1fdf17ae086b2b23ee3cae08: refactor(ui): optimize model ui rendering (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.80.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.80.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.80.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.80.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.79.1 — 2026-06-20

# Bang Bang

This release introduces a number of small but mighty UX improvements to improve the Bang Mode experience overall. Details below.

Hope you’re chilling out,
Charm 💘

## Changelog
### Fixed
* 11662010521e5211d825fcc21c4fdf8c72fda08e: fix(bangmode): activate bang mode when ! is preceded by whitespace (@meowgorithm)
* 7e4bd6a0b44ce3c32f0e36d48ffcd77c1955d641: fix(bangmode): engage bang mode when pasting text starting with ! (@meowgorithm)
* f342edf052ef1ca35fb202c235a976b9ef6f45f9: fix(bangmode): include bang commands in history (@meowgorithm)
* d20e29ae75004991e801fc4fd18c83e68913b5ab: fix(bangmode): sync bang mode with external editor (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.79.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.79.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.79.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.79.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.79.0 — 2026-06-19

# More Bang Mode™ improvements

[This morning we released the new Bang Mode](https://github.com/charmbracelet/crush/releases/tag/v0.78.0). For this release, we did a couple small fixes and enhancements to it:

* We tweaked the font colors to make it more legible;
* A long-running command will now show immediately and stream output as the command runs;
* Session name generation is fixed for sessions started with a command.

## Agent bug fixes

We made a few bug fixes to [Fantasy](https://github.com/charmbracelet/fantasy) to make Crush behave better with certains providers and models.

* The `tool not found` error now print the list of available tool. This is targeting certain models like Kimi that sometimes can get lost and call tools that doesn't exist;
* Fixes potential tool call errors with the GLM family via Fireworks;
* Fixed some GPT models via Azure (thanks @dustinlagoy);
* Fixes Gemini via VertexAI (thanks @eswar-7116);
* Fixed tool calls sometimes not working properly for local models.

Have a great weekend and keep crushing! :rocket:
The Charm Team


## Changelog
### New!
* 1c2da8930cdf77c0cff1ba8014028b4ec31f5f82: feat(bang): remap ansi 16 colors (@taciturnaxolotl)
* 6db54b3a969389d97a414fb20f3d527a237d7565: feat(bang): show pending spinner (@taciturnaxolotl)
* 6814ccfca6715ac018ac1ff7046146a913b24824: feat(bang): stream results in (@taciturnaxolotl)
* 5f07034e42387e2b47b2cd81c8802df8d90b992c: feat(bangmode): adjust command output color (@taciturnaxolotl)
* ee47eb808cfeedafac0aba2d2acc2be9f2c9a73e: feat(bangmode): allow prefixing a string with bangmode (@taciturnaxolotl)
* 47ed0f3a2fc96feed9a127ea83960fe5a681e30a: feat(bangmode): cancel command execution (@taciturnaxolotl)
* f46387bb525c8bf27fed2a7e8adf28aceff2ab68: feat(bangmode): copy message result (@taciturnaxolotl)
* 175ce34cc8d1325f6727ab896df22c8babcaca3b: feat(bangmode): properly strip ansi in copy and context (@taciturnaxolotl)
* a06fd0348a10152468600761f57d46a74f17f689: feat(schema): fix the reflection on provider options (@taciturnaxolotl)
### Fixed
* 03bfdc66fb2633b799170d95c984625d03f9db8d: fix(bang): set title in bang mode (@taciturnaxolotl)
* 8305eb033961aa0eabf11c25340e2fc39945813c: fix(bangmode): fix duplicate command message race condition (@taciturnaxolotl)
* 48e9cca2ffe2ab012ee305bcb20b64601f3945ee: fix(bangmode): interleave stderr and stdout (@taciturnaxolotl)
* cf0d7c2f5e9f2b1acdb4fd387361021119298705: fix(bangmode): move ansi remaping into common and cleanup bangmode (@taciturnaxolotl)
### Other stuff
* ce2dc1ee7e799924f6534ce119994951834d4db5: chore(bangmode): adjust ANSI16 colors (@meowgorithm)
* 2f89862dccf03213c6e049735064a0feb25d7534: chore(bangmode): adjust working indicator text color (@meowgorithm)
* f82a46860d608c453b941fb88a74952d6d0788c8: chore: auto-update files (@charmcli)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.79.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.79.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.79.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.79.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.78.0 — 2026-06-19

# Bang Bang!

We're ending the week in style with one awesome feature you've been asking for and one awesome feature you didn’t! Let’s go!

## Bang Mode

“What’s bang mode?" you ask. Why it’s simply a nice way to let you run Bash commands directly in a session. It’s great for taking advantage of the shell without leaving Crush. To enter bang mode, just type a `!`. To exit, hit backspace.

<p><img width="600" height="1137" alt="Bang Mode Demo" src="https://github.com/user-attachments/assets/710fadc0-dd14-4e42-b2a5-16ec62add197" /></p>

<!--
<p>
<img width="223" height="102" src="https://github.com/user-attachments/assets/1111b58c-dff9-4978-a884-5faf1b37d44e" />
</p>

<p>
<img width="216" height="80" src="https://github.com/user-attachments/assets/99f2a26a-a299-4601-b5db-373c1d0c8302" />
</p>
-->

Of course, the best thing about bang mode is that the model can also see the out, so if you run a command you can then chat with the model about it.

<!--
<p>
<img width="225" height="88" src="https://github.com/user-attachments/assets/a639ada9-da25-458f-97c0-ca371e42eeb3" />
</p>
-->

<p>
<img width="542" height="357" src="https://github.com/user-attachments/assets/14cb91a1-4629-4ce6-a17a-a3b6f766651e" />
</p>

Special thanks to @taigrr for the initial implementation to @taciturnaxolotl for turning it up several notches, with some suggestions from @nobilelucifero. Enjoy and let us know if you have of any feedback!

## Local Model Auto-Discovery

@taciturnaxolotl _loves_ local models. What he did _not_ love was manually adding them to the Crush, and like a true open source devotee, and he took matters into his own hands. **Crush can now auto-discover local models** for a given endpoint so you don't have to declare them manually.

```jsonc
{
   // Look Ma, no manual model definitions!
  "providers": {
    "ollama": {
      "name": "Ollama",
      "base_url": "http://localhost:11434/v1/",
      "type": "ollama"
    }
  }
}
```

This works for MLX, LMStudio, LiteLLM and Ollama. [More info in the README](https://github.com/charmbracelet/crush#local-models).

(Is cool or what? Someone get @taciturnaxolotl a Strix Halo!)

## The clipboard: now clipper than ever

We improved the way the clipboard works in Crush big time, particularly in X11 and Wayland: `xclip` and `xsel` are no longer required! You can also paste TIFFs (WeChat users, rejoice!) and <kbd>super+v</kbd> (yes, <kbd>⌘+v</kbd>, macOS people) will also now paste images.

## Fireworks

By popular demand Crush now supports a new provider: [Fireworks](https://fireworks.ai/)! Grab your API key, choose a model on Fireworks and go to town.

## Thanks

As always keep the good vibes coming, and keep crushing It!

The Charm™ Team

## Changelog
### New!
* 98d79e95a52f31307f6943af3b0cbe7e87daa01d: feat(clipboard): migrate clipboard to golang.design/x/clipboard (@taciturnaxolotl)
* f6a841eca9e9d0ec45536e292cd6f70ce8c1bf02: feat(dialog): track last closed dialog in open with grace (@taciturnaxolotl)
* 0f2790574ec8d380562a38cd5661900995d95366: feat(enricher): add litellm enricher (@taciturnaxolotl)
* 3c4e6547b48c95949f969655e01a261fe34cdb3d: feat(enricher): add lmstudio enricher (@taciturnaxolotl)
* 9299ad47d86f5706de43b26717121c59688d9bea: feat(enricher): add ollama enricher (@taciturnaxolotl)
* 89b680d2d6b22126a29b2c9e45553452b6b12608: feat(enricher): add omlx enricher (@taciturnaxolotl)
* ac4bd9c151566800fdf6b1adce9b9a337f816793: feat(scrolling): move to delta coalescing filter (#3135) (@taciturnaxolotl)
* f45712a32da871a962b05fbe9d93d4b444de9a17: feat(ui): extract hypercredits from fantasy (@taciturnaxolotl)
* 99a5fad5370d6c47a94791f803a275348fae891e: feat: add bang mode for direct shell command execution (#3013) (@taigrr)
* 9886d223909e479e373007a5100eda0c1e12a6b6: feat: add support for fireworks provider (@andreynering)
* 7303158426f938ac1648e63fdaba900658ff752b: feat: auto-discover models from openai-compat providers (@taciturnaxolotl)
### Fixed
* 4bd011669bdc6a91a47702752319f481b7dbceb0: fix(clipboard): support platforms without clipboard access (@taciturnaxolotl)
* f98791e9868dc4d3acdebe331d69e68cf4fdd331: fix(server): show LSP status in client-server mode (@meowgorithm)
* d3af321b0f52f199c1e47cecc2cc08535640cbea: fix(shell): isolate child processes from Crush's session (#3097) (@taciturnaxolotl)
* 1cfa9a151569362e44b11d243ad4c4be6b9b13a9: fix(subagents): fixed subagents returning empty responses (#3125) (@taoeffect)
* 46c1799abcaf852f092126c81923b00569c70a34: fix(title): fallback title generation (@taciturnaxolotl)
### Docs
* 70ef7073149da3283da7c5d3940ff515d77316ce: docs: add auto discovery to readme (@taciturnaxolotl)
### Other stuff
* ffd47965720647af86c8ffd6c37287836db69d23: chore: auto-update files (@charmcli)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.78.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.78.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.78.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.78.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.77.0 — 2026-06-14

# Global context, better commit messages…and you

It's been a bit! There’s lots of good stuff in this release, so let’s get right to it.

## Global context

Want Crush to always call you Shirley? Or maybe you want it to default to Jujutsu? This is now a piece of cake with user-level context files thanks to @Amolith.

If you create `~/.config/AGENTS.md` or `~/.config/crush/CRUSH.md`, Crush will reference it on session start just like your usual project-level `AGENTS.md` and `CRUSH.md`. Nice!

## Crashes? Not on Kieran’s watch.

Kieran, otherwise known as @taciturnaxolotl, is fast. Really fast. The other day Crush crashed for him, he honed in on two bugs in [Lip Gloss](github.com/charmbracelet/lipgloss) and [Glamour](github.com/charmbracelet/glamour), and patched them before we could say, "Don’t panic!" Thanks, Kieran!

## Better commit messages and PR descriptions

You know what drives us crazy? When LLMs write overly-technical commit messages and PR descriptions that reference obscure parts of the code. Commit messages and PRs should be understandable to readers unfamiliar with the codebase.

This PR improves the system prompt so LLMs author clearer, more understandable commit messages for human beings.

## Named hooks

Thanks to contributor @BrunoKrugel, you can now name your hooks, making them easier to identify in the CLI.

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "name": "Mr. Hot Hook",
        "matcher": "bash",
        "command": "./hooks/my-hot-hook.sh",
      },
    ],
  },
}
```

For more info see https://github.com/charmbracelet/crush/pull/2778.

## Client-server: socket fixes

Client-server mode isn’t quite ready for prime time yet, but many of us are using it day-to-day regardless. One of the coolest things about client server mode is that it runs over unix domain sockets (which absolutely rock) and named pipes on Windows. This release fixes two bugs around that:

* Stale sockets are now cleaned up on startup, allowing Crush to run properly
*  On unix systems sockets now live in the places they actually belong: `$XDG_RUNTIME_DIR` on Linux and `$TMPDIR` on macOS, rather than `/tmp`.

Try out client-server mode with `CRUSH_CLIENT_SERVER=1`.

## See u soon

Thanks for all the positive feedback about Crush. We ❤️ you!

Charm

## Changelog

### New!
* 6242e4f47743190fe60a27ba881ba3d6a9b36deb: feat(config): load user-level context files (@Amolith)
* 021e3773a63366a1970563543e694c36c6bb6e38: feat(hooks): add name field to hooks (@BrunoKrugel)

### Fixed
* 7c9f4bbb647a2c642607bd921c2c35bb12f226e2: fix(server): clean up stale sockets + correct socket location (#3095) @meowgorithm 
* 3e6f95eb2409f5187053d337e6e48dc810b04539: fix: address potential indentation on commit messages trailings (#3106) (@andreynering)
* e4c82db68f8e9fb0ddd0c8d188c44a623042354b: fix: bump lipgloss to v2.0.4 and glamour to v2.0.1 to fix crashes (@taciturnaxolotl)
* aad8cbad258484dba2dc416832dce9a9a589a2f5: fix(bash/git): improve git commit and PR message standards (#3052) (@meowgorithm)

### Docs
* aadb7e7932a819b184317fbde074ed6bd15be7b6: docs(hooks): add name field (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.77.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.77.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.77.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.77.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.76.0 — 2026-06-05

# Friday patch

Shipping a couple small things for those who will keep crushing during the weekend.

## Permissions UX fix

We made a change to avoid accidental interactions when the permission dialog shows. Crush will now ignore key presses up to 350ms after the dialog is shown. This will prevent you from accepting or denying something by mistake when you're typing when the dialog appears.

## `crush models` fix

`crush models` will not shown all models, and not only the configured ones.

## More client-server

And more and more fixes for the experimental client-server architecture are merged. This will power Crush to do really nice things once finished!

That's for this week. Enjoy your weekend!
Charm ✨ 

## Changelog
### New!
* 90b1a2a67bf70a2f5fc1f998ccd84317cab5d68b: feat(server): make server prompts independent of client connections (@meowgorithm)
* 363ffec9ec38bf84fd2476d28c6906965cda9822: feat: discover skills from git root in monorepos (#3078) (@taigrr)
### Fixed
* 6292bfa304c596f04caef653c47e53427ea40ca6: fix(cli): show all providers in crush models, not just configured ones (@meowgorithm)
* 7da9695fc10b16cd52bfe01788c1b4e7256e393d: fix(permissions): ignore all keys briefly after dialog opens (#3055) (@taciturnaxolotl)
* d7a814c540c258f06cb798c29beff676ed4b130b: fix(server): close a queued-prompt cancel race (@meowgorithm)
* d411ab5edc99865159f2a86fc3c1a2b8ef3bd56b: fix(server): complete background prompts that fail early (@meowgorithm)
* cbec4916b3d9bcdaeaff75157071e5e87a7526ef: fix(server): complete queued prompts independently (@meowgorithm)
* a6a8459c07cc2088cd1ce012171b0cc9c05a1339: fix(server): ignore background errors from unrelated prompts (@meowgorithm)
* 34995e9333082f6f8a6437e4bc75a55fca45c981: fix(server): prevent cancels from affecting future prompts (@meowgorithm)
* 6ec75f9f8651a53732dc6f38dd2bd44736856e95: fix(ui): fix session rename rendering (#3071) (@taciturnaxolotl)
### Other stuff
* ee94df068af1d5d029fe425dc80d337aed09f263: chore(server): acknowledge accepted prompts with HTTP 202 (@meowgorithm)
* d2e9e51fceddf5ed4c57c23bbb15f7a799e88892: chore(server): apply asynchronous prompt contract to clients (@meowgorithm)
* 4347015ab7669b1376e6cb814c10f89aef3481ad: chore(server): honor cancels immediately after prompt acceptance (@meowgorithm)
* 0a977431d6445551253c8677ec230beffdf215fe: chore(server): report background prompt failures via events (@meowgorithm)
* 8b242c5313a79630d22429c04b699adcb624a89a: chore(server): run accepted server prompts in the background (@meowgorithm)
* 3c0619397fe9e05fa4fadf129f8e09dbc8d021e5: chore(server,tesst): cover multi-client prompt cancellation flows (@meowgorithm)
* 5aaa709b92582a38d4e5d183bcd675a2c997dff3: chore(server,tests): cover async cancellation cleanup behavior (@meowgorithm)
* c6d15905a9ca53b176c1c3430c03a497de33a983: chore(server,tests): cover the accepted-prompt cancel race end to end (@meowgorithm)
* b5fd4c08e906143becf39ef23d27db322174c679: chore: auto-update files (@charmcli)
* 84bcc3c6c24fe6676e6547a05d9e271842c89ec3: chore: update fantasy and catwalk (#3087) (@andreynering)
* 0e8b879720d219e74970525e4c9d2615ca414519: refactor(commands): centralise skill discovery (@Amolith)
* 8d7166e67ebe7c93b4ecca5ab9a2f02fa92d87a0: refactor(server): share prompt validation before background dispatch (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.76.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.76.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.76.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.76.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.75.0 — 2026-06-02

# Bug fixin'

This is a maintenance release which fixes a couple small bugs.

## Hyper OAuth fix

We fixed a bug where the Hyper OAuth dialog could appear mid-session, in case you had multiple Crush sessions that attempted to refresh the access token at the very same time.

## Fixed rare startup bug

This is a rare edge-case, but we fixed a bug that could prevent Crush from starting in case it can't find a default large or small model for a provider, due to it being removed.

That's all for today. Stay tuned! 📺 

## Changelog
### New!
* f6b8592a5acaffa144dd35c2cd78f24fa270b77e: feat: prepare alibaba migration to `/messages` (#3067) (@andreynering)
### Fixed
* 3cd88ac8902c1ce421d9a2b32ae0ef7b9578d35e: fix(agent): add 401 retry and reauth notification to sub-agent runs (@taciturnaxolotl)
* 90197756b670d743ad3c84528e4d69d2884a057a: fix(agent): centralize 401 retry logic and fix notify-on-success bug (@taciturnaxolotl)
* 23157b6a1dbbca77b4ce482f12ff98ea5e19d9e4: fix(agent): move reauth notification from agent to coordinator (@taciturnaxolotl)
* 5b5f7b687d324b8835e90d064e6e16970ebc92ea: fix(config): sort SetConfigFields keys, remove redundant MkdirAll, rename test (@taciturnaxolotl)
* d87a632af1cd528b8ed76adbc3f45041acd2b128: fix(oauth): harden IsExpired with minimum buffer and ExpiresIn guard (@taciturnaxolotl)
* c83418d10ba6c166419d1ff781380c3a0b0b0ca1: fix(oauth): stop fabricating token lifetime when expires_in is missing (@taciturnaxolotl)
* ffaeec192ff121408b9a115b14e3be9965ca138e: fix: avoid startup crash if unable to find default models (#3066) (@andreynering)
### Other stuff
* 3570ea632225c2a6ad92d2457119904896960802: chore: auto-update files (@charmcli)
* 81170ce5d33280947e889ba8afb93a057d26b801: refactor(config): replace reload booleans with reloadMu mutex (@taciturnaxolotl)
* 7ce093611c8304aaa8099bdecc9b4e36ce2ff477: refactor(lock): add canonical internal/lock package, migrate db and cmd callers (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.75.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.75.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.75.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.75.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.74.1 — 2026-05-29

# Friday patch

Finishing the week with a few fixes.

## Fix for `bash` tool

@taigrr helped with a fix to prevent the `bash` tool hanging when the model tries to run interactive commands like `git rebase -i` and others.

## OpenCode + Qwen 3.7 fix

Qwen3.7-Max via OpenCode is not working. OpenCode requires the Anthropic Messages API for this model.

## Client-server

Even more fixes for the experimental client-server architecture. Currently opt-in via `CRUSH_CLIENT_SERVER=1`.

That's all for this week!
Charm :sparkles:

## Changelog
### Fixed
* e14d47a8135cef6950d6a337a8f7e3c62157bc27: fix(noninteractive): crush run reliability in client/server mode (@meowgorithm)
* b7f4ad6cf61bcca11e052f19c2f2b653aaf818be: fix(opencode): fix qwen3.7-max on opencode (#3040) (@andreynering)
* a4181d6d4ecc3a246ae949784b115f6c970bd105: fix(scrollbar): fix track position calculation (@andreynering)
* c2be8cbf9b3700029cf3f291c0087f3a9f0b640a: fix: set non-interactive env vars in shell to prevent editor hangs (#3025) (@taigrr)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.74.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.74.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.74.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.74.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.74.0 — 2026-05-28

# More client-server, better notifications, and more

Bringing you a few enhancements and bug fixes. Let's check them out!

## Client-server

The experiment client-server architecture got even more fixes.

Want to test? Set `CRUSH_CLIENT_SERVER=1`.

## Better notifications

We updated our notifications to be smarter. They will now work when using Crush over SSH, and support for more platforms were improved as well.

## Copilot fixes

A couple more models that require the Responses API will now use them and work again. This includes GPT 5.4 and GPT 5.5.

## Bedrock fixes

A couple more improvements were made to AWS Bedrock, in particular regarding Bedrock Europe and the support for authentication via `aws login`.

See you in the next release!
Charm

## Changelog
### New!
* e764240d9ceb74a626cccdd404afaaa76e128314: feat(api): expose in progress flag on session responses (@meowgorithm)
* ec85e9ef686c23ce3366c46589cdfabc05cd2199: feat(api): report how many clients are watching each session (@meowgorithm)
* 6923820a8f60a06a0a25100214871ccfd382e8e1: feat(db): refuse to open a data directory in use by another crush (@meowgorithm)
* e7f5c68501e01df446ba908843ed08599a0c96b3: feat(notifications): add configurable backend and bell support (@taciturnaxolotl)
* 3fa7d3f270aef1d1cdd16bd20f626d72cca4db6d: feat(notifications): migrate disabled and add picker (@taciturnaxolotl)
* d9acf860a7523c6a6e7467e4d6dc65a34166a0a0: feat(server): broadcast config changes to all connected clients (@meowgorithm)
* 1ce40dfc00b9394a8212ef008f05e7fd7efc8fba: feat(server): share one workspace per directory across clients (@meowgorithm)
* 178cd11dd49f322b9701f3ec2484f3b7a816c6e2: feat(server): track which session each client is currently viewing (@meowgorithm)
* d14f3b1b754a8770d3851886d96803eb0a3884c3: feat(tools): add diff view for denied tools (@taciturnaxolotl)
* 8f9a697c0373e5975521d1b163ae4475a0719132: feat(tui): auto close permission prompt when another client responds (@meowgorithm)
* 6da5c959dd816ca17decb89b4fde91ce9289fd67: feat: support notifications for ssh terminal (@nghiant03)
### Fixed
* 179a6f3556b672e41d6445e4aedaeed41f0e9674: chore: fix(bedrock): apply region if given for aws config as well (@andreynering)
* a1e4a7c944bb75fe3c2adb47de137985b5eaa7c8: fix(backend): fix data race in tests using captureDebugLogs (@meowgorithm)
* 57ae2b44f570193d7a45c19aacabb9afdb30d91f: fix(bedrock): improve detection of pre-existing aws credentials (@andreynering)
* 36f0976c84b0cf4f4adbb921e1e2578863ca3e72: fix(bedrock): load aws credentials for bedrock europe (@andreynering)
* ed870ecb91c53a98a9114d930cf62fa9c9170993: fix(client): prevent event subscription panic on cancellation (@meowgorithm)
* 82d57e5e0098816e8bb9900ecf51afd02f066a39: fix(copilot): add additional responses models (@taciturnaxolotl)
* c986a35c465fdc22fbaede2609522e3e1997e632: fix(db): only enforce the data directory lock in client server mode (@meowgorithm)
* 86568da1153b165d47a79d8a14f1addec5a41289: fix(permissions): make permission resolution idempotent across clients (@meowgorithm)
* 7d927319c4039f324614ed233db66219218fbc24: fix(server): one client's cancel should not send a 500 to others (@meowgorithm)
* 2bb52564f2ad9cec0174f2a5c74cadae98d508cd: fix(server): release pooled DB on test shutdown so Windows can clean temp dir (@meowgorithm)
* c8d0244049301ccfe389eacde883d4504d76de07: fix(ui): properly render model name in summarize (@taciturnaxolotl)
### Docs
* f9676ebeffd4ef5476f09dfd289f82b4c8efbcb6: docs: describe how Crush shares a workspace across clients (@meowgorithm)
### Other stuff
* 3c981c192fd23879a2e8531391e0971b3d1ecfd0: chore(db): log lock metadata write failures and explain lock file lifetime (@meowgorithm)
* 3f9bb5e07c4b9e358702e97ebdb241d803334ff8: chore: auto-update files (@charmcli)
* 37802798cf224208d226d3a29e9eb08927d8f04f: chore: auto-update files (@charmcli)
* b20b2328eaddd9f193fa97011cf007a7139b48ae: chore: gofumpt (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.74.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.74.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.74.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.74.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.73.0 — 2026-05-26

# Follow-up to Bedrock

Last Friday, we shipped some changes for Bedrock to make it work by default for most users.

Before that release, your `AWS_REGION` or `AWS_DEFAULT_REGION` could instruct Crush to try to reach Bedrock at a different region, and it could not work at all because most models are only available in very few regions. Because it was not clear why Crush was not working for Bedrock, this could be confusing to users. We then enforced `us-east-1` for region because that one should work for everyone.

## Bedrock Europe 🇪🇺 

Since then, a few of you reached out telling us that models are also available on `eu-west-1`, and some users in Europe might prefer or need (due to employer restrictions) to use an European region.

Starting on this release, you'll see two providers if you search for "bedrock":

* Bedrock US: will use `us-east-1`
* Bedrock Europe: will use `eu-west-1`

<img width="679" height="447" alt="Screenshot 2026-05-26 at 14 45 31" src="https://github.com/user-attachments/assets/c6447ef7-3913-42e4-9758-bcc2bcd2d1cd" />

That's all for today.
Stay tuned for the next releases!

## Changelog
### New!
* ae20f1f65175e4b1c2b9bbfc3f9b556a1589b7ec: feat: add aws bedrock europe (#3016) (@andreynering)
### Fixed
* 1db7629b199a8950078caf14f924b07e6460f7dd: fix(ui): improve model changed notification (#3015) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.73.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.73.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.73.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.73.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.72.0 — 2026-05-25

# QoL Release

Hey all! Some of you in the US 🇺🇸 are enjoying a Holiday, but we're still here shipping stuff.

Today's release ships some Quality of Life :tm: improvements.

## Better user-invocable skill commands

Skills can have user-invocable commands, and we'll now also show a description if available. Easier to see what's that command about.

<img width="500"  alt="image" src="https://github.com/user-attachments/assets/7039bee9-1ff6-4d6b-b9c9-46394a5866e5" />

## Scrollbar in the sessions list

In the last released we added a scrollbar to the models list dialog. The same very scrollbar is not also in the sessions list dialog. It's a small addition, but really help navigating the list.

https://github.com/user-attachments/assets/e1cbab14-e3bc-4d91-881a-b50f4caed273

## TODO expanded by default

The TODO list will be render expanded by default, unless your terminal height is too short. This is useful to see what's happening as the model works.

Want to toggle it? Just press <kbd>ctrl+t</kbd> to open or close it.

https://github.com/user-attachments/assets/62e7c7ee-41e9-43de-8a41-d926d4bbefbe

## <kbd>ctrl+y</kbd> to toggle YOLO

Having to open the command palette to enable or disable YOLO can be inconvenint. You can now do that by just pressing <kbd>ctrl+y</kbd>.

https://github.com/user-attachments/assets/0b0f5794-72ee-4690-9403-7d7e48609563

That's all for today.
Charm :cupid:


## Changelog
### New!
* 55721653ceb67f04abd53c278ade01d05043bf7d: feat(skills): add descriptions to skill picker and use attachements (@taciturnaxolotl)
* 2b941aaa0d3b983e0c64e92b3b04a0e4ba855747: feat(ui): add ctrl+y keybinding to toggle yolo mode (@andreynering)
* 092ac3e73a100d3ae7ec7fc16306de3fe5476f31: feat(ui): add scrollbar to sessions dialog (#3005) (@andreynering)
* ba692cc55a73e027b9ea5805bac63fd8b3936400: feat(ui): auto-expand pills when terminal height is sufficient (@andreynering)
* 8ad3f5bf3a9fc482c339aad5069569988f8fe45d: feat(ui): show notification when toggling yolo mode (#3008) (@taigrr)
### Fixed
* 66795b1ec57abeef4ecff1f4cf3e8b040687427c: fix(tests): fix flaky async windows test (@taciturnaxolotl)
* db9d9399d31aa883cb74f688d8dafc2f067188ce: fix(ui): only auto-expand pills once per session lifecycle (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.72.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.72.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.72.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.72.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.71.0 — 2026-05-22

# Small feats, fixes, Bedrock and more

We have quite a good number of things for a Friday. Let's take a quick look at them!

## Scrollbar

The model list now got a scrollbar, so you can see how long the list is and where you are on it. It's a small addition, but nice and useful.

<img width="674" height="438" alt="Screenshot 2026-05-22 at 17 29 28" src="https://github.com/user-attachments/assets/e78cc790-7201-4fee-a0c0-bcb7bfbf73f1" />

## Token usage

Some providers do not report how many tokens were used in a request. In these cases, Crush wasn't showing the token usage or estimated cost in the sidebar.

@taoeffect added token and cost estimation when the provider doesn't report this. Now you'll have an idea on how fast you're burning tokens.

## Bedrock

We made some changes to avoid some confusing when using AWS Bedrock.

Before, Crush was using whichever region you had set on `AWS_REGION` or `AWS_DEFAULT_REGION` variables. The problem is that most region have few models available, so you could be unable to use them if you had a different region set.

We're always using the `us-east-1` region, which have all models available. This should make Crush work out-of-the-box with Bedrock without specific local region configuration.

If you have any feedback on Crush for Bedrock, reach out on our [Discord](https://charm.land/discord) or [Slack](https://charm.land/slack) communities.

## Stream fixes

@ethanndickson contributed with two fixes on [Fantasy](https://github.com/charmbracelet/fantasy) that should fix some errors related to streaming.

## Permission prompts

We tightned up permission prompts a bit to improve security, when the model wants to run Bash comments with pipes, redirection, etc. Crush will now always ask for permission in these cases.

## Reasoning effort level fix

We fixed a bug to ensure Crush won't ever send a reasoning effort level when the model doesn't supports it. This should fix potential errors for a couple providers.

## More client-server

More fixes to the experimental client-server architecture were merged.

You can opt-in to this mode with `export CRUSH_CLIENT_SERVER=1`.

## That's all

There were more small fixes and improvements, but the list above is a good summary.

Enjoy your weekend (and Holiday for Americans) and see you next week!
Charm :sparklers:

## Changelog
### New!
* 96728b15d037f187424db63cd6bdb20a01fbe08f: feat(permissions): require a permission prompt for chained commands (@taciturnaxolotl)
* 6716ef09fc0612e3f707469395546362922e0dc4: feat(skills): add support for user invocable skills (@taciturnaxolotl)
* ce395837b7f584d025574fab7939fc37a445fae1: feat: render scrollbar for model list (dialog and onboarding) (#2978) (@andreynering)
### Fixed
* 83d2abbf0a62f8bda0cb4b5ef499eff11dd81a20: fix(agent): clear stale summary token counts (@taoeffect)
* 2e9c65057b8ca5abc8aa54b21856b869c733d52c: fix(agent): correct fallback usage accounting (@taoeffect)
* 6ed8852b621faff72fe3f791efdc41678b439b9e: fix(agent): estimate missing streamed usage (@taoeffect)
* 74e6e378e37493440cb01c956ef6de7ebcde38e1: fix(agent): harden fallback usage accounting (@taoeffect)
* 74b84f6968fde0d80562be9f31f56cbc8cf35cf7: fix(bedrock): enforce `us-east-1` as region for bedrock (#2985) (@andreynering)
* 56cf50adac921ae8cb57d894e7930f06cfc1e8d7: fix(db): keep SQLite temp files in memory (@taciturnaxolotl)
* 841eec8f89335d0eebb8f334057a1a2ee0efb159: fix(models): fix sorting of hyper (@taciturnaxolotl)
* 1811bec2cc6d7d595a9d1c9ff19dd9e239a41392: fix(prompts): tweak file reads to encourage more targetted reads (@taciturnaxolotl)
* d025403923d4f2fc8523d962f5e9d51a854ac801: fix(server): display available skills in client (@meowgorithm)
* 27a35c94cc1496bd4a2f5fdb4e398427815a4715: fix(server): support attachments in client-server mode (@meowgorithm)
* 9595d1f073dde42e1749853688299a4bad19f496: fix(session): preserve estimated usage marker (@taoeffect)
* 5d7797d0f1b37a1ccf19f5ab1e1c48c3598daa5d: fix(ui): add locking around markdown rendering (@neomantra)
* 5b1b2b435cd805462e6c01fa6d3453bea0199166: fix(ui): guard divide-by-zero display error (@neomantra)
* 2736e487cf511a686daf691d9135f9491d4ac865: fix(ui): mark estimated context usage (@taoeffect)
* 4fc17ddcae6a37eb14f824f81b3befbcd1da03fd: fix(ui): preserve estimated usage percentage color (@taoeffect)
* 1320fcf5ce10ce0b8ac0e2f3580ae3adf1da18cc: fix(ui): scroll to the properly select model (@taciturnaxolotl)
* 2faa467ab08de94aaa7583836491c6d4f7fabcf8: fix: fix sometimes sending reasoning effort when it shouldn't (#2982) (@andreynering)
* 6b312bee06bf3ca90ba587035a7287594b97e186: fix: potential data race on `permissionService` (#2964) (@mei2jun1)
* 3250fef354eb7ebc40faaa0a1c4c5c9f37f0f6dc: fix: update fantasy with stream fixes (#2968) (@andreynering)
### Other stuff
* 8468c8c011095520a3b6eda23ee1d03c2e9eefc2: chore(tests): update golden files (@taciturnaxolotl)
* 88e97a05a307e87fbddb25aa692d7be1ee906d1a: chore: auto-update files (@charmcli)
* df3a04d19d8a43e4568c1dc89cd86ebe6c707424: chore: isolate store test (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.71.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.71.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.71.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.71.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.70.0 — 2026-05-18

# Alibaba, Better Retries, and Client-Server

We're starting the week with some good stuff. Let's check them out!

## New Provider: Alibaba

A new provider is available: Alibaba! Just open the model picker with <kbd>ctrl+m</kbd>, search for Alibaba and paste your API key. Alternatively, you can set `$ALIBABA_SINGAPORE_API_KEY`.

Alibaba has a few regions, but we're starting with the main one: Singapore as the hot new models are available there, like the newer Qwens.

<img width="680" height="442" alt="Screenshot 2026-05-18 at 14 52 17" src="https://github.com/user-attachments/assets/96d69d21-0d39-450f-afbe-434d6070a6d7" />

## Better Retries

Thanks to @processtrader, Crush is now a bit smarter on retries. Instead of just retrying on specific error codes (400, 500, etc), Crush will now _also_ retry on network errors (in case you're offline for a second, or a DNS query failed, etc).

## Hardening Client-Server Mode

Crush has an experimental/client server mode which can be used to extend Crush, operate more effectively with multiple sessions, and connect to remote Crush instances.

We’re using client/server more and more internally, so it's time to harden it. This release fixes some bugs that were blocking us from using it day to day.

If you want to try out client/server mode,  Crush has an experimental client-server architecture refactor happening, currently available via:

```bash
export CRUSH_CLIENT_SERVER=1
```

That's it for today. Stay tuned for more soon!
Charm :cupid:

## Changelog
### New!
* 4882cbc015577578d61ac90b4393fa28ae2633c6: feat: add aliababa (singapore) provider (#2949) (@andreynering)
### Fixed
* 0c99e778d9d9fdf05606b33ec5dc666fdb89e06f: fix(auth): support oauth in client-server mode (@meowgorithm)
* 9c35ee0141f5afb99f69cd912797d018d9681c9f: fix(server): recover from handler panics + return 500 (@meowgorithm)
* 0bbc8a87e8695c5224d870df49f613191122c740: fix(ui): restore pills to-do in client/server mode (@meowgorithm)
* a4befc299ab9b69647fd5dc3607b5fa79e67bd11: fix: retry on network errors (#2945) (@andreynering)
### Other stuff
* 45b1e634a5479297d94141ffc603a1d09f9b6326: chore: gofumpt project (@meowgorithm)
* c433fd633a084c52f7efd0155454564135fa5330: perf: remove hot-path slog.Info from SSE event delivery (#2929) (@taigrr)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.70.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.70.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.70.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.70.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.69.1 — 2026-05-15

# It’s Perf Time

This release is all about juicin’ UI perf. We did a ton of work around it, and it should be particularly noticeable with long sessions, long messages, long, open-toggled thinking blocks, mouse selection, scrolling and stuff like that.

We always strive to make the Crush user experience top-notch, so if you notice any places where perf _is_ suffering please let us know!

Have a great weekend,
The Charm Team

## Changelog
### Fixed
* 646a5053bd58635316bf960f3d8e5d4a0996a24b: fix(ui): keep tool spinners animating during long-running tasks (@meowgorithm)
### Other stuff
* 30f9c6ed55daf68b5ee5cc6a3f0fcebbf2559252: chore(ui): make spinner deterministic for testing (@meowgorithm)
* 8370edb6910e3044f0e7e375685431110a3eac9c: perf(chat): cache the parts of an assistant message separately (@meowgorithm)
* 771117cafeedffc8a9b5859503fc055bcd525d3e: perf(chat): cache the prefixed render of chat messages (@meowgorithm)
* 77b6c38b0fb150d97dbce466f737d1217e5a7604: perf(chat): only render the chat lines that fit on screen (@meowgorithm)
* 1c7ccfd7f78853dd86598eeef103f4ac0c29e8b2: perf(chat): reuse the rendered prefix of a streaming reply (@meowgorithm)
* 43b986c8c00a81b83fcf0422d5334ad61ab046c8: perf(chat): show only the tail of long reasoning blocks when expanded (@meowgorithm)
* 65f30a13430a93ef3f271adb3cee4b535ade3de6: perf(chat): skip re-parsing the rendered chat when nothing has changed (@meowgorithm)
* 6b101f38600cd4e4b974ee56af3c9d2382cc2c43: perf(chat): skip re-rendering chat list items that have not changed (@meowgorithm)
* 6938dedd6cde0378f428b2a90d1591f69dbce6eb: perf: batch streaming message updates (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.69.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.69.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.69.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.69.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.69.0 — 2026-05-15

# DeepSeek regression fix

We fixed a regression for the DeepSeek provider. In v0.68.0 all requests were returning a 400 (Bad Request), but on this release it's all working again.

## Changelog
### New!
* ce08b2204512203b05cf0451fe64151ae5dc8fdc: feat(dirs): add some styling to the dirs command (@taciturnaxolotl)
### Fixed
* f34f890edfe101fb7f7e10db9afd8867abc3f443: fix(deepseek): fix 400 bad request for deepseek provider (#2923) (@andreynering)
### Other stuff
* 5331fe25e1f1c7b5d9055b4ea4ec453f30a9ca75: add -p flag to dirs command (@bbrodriges)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.69.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.69.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.69.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.69.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.68.0 — 2026-05-14

# Stability release

Another release, another list of fixes to make Crush better for you.

## Advancements on the server-client arch

The experimental refactor into a server-client architecture got many fixes.

This is not ready for daily use, but if you're feeling adventurous it can be enabled with `CRUSH_CLIENT_SERVER=1`.

## Mention `gh` and `rg` in system prompt if available

If `gh` or `rg` (ripgrep) are available in your system, they will be mentioned in the system prompt now. This will hint the model to use them for a better experience.

Thanks to @taigrr for contributing with this one!

## Old system prompt removed

In past releases, we talked about how we shrinked the system prompt to save your tokens and make smaller models behave better.

You could still opt-in for the old prompt with `CRUSH_SHORT_TOOL_DESCRIPTIONS=0`, but that is now removed.

## Thinking and reasoning level fixes

We fixed the thinking on/off toggle for some providers. In some case it wasn't being respected properly.

This should make all GitHub Copilot models work now. A few of them were erroring due to thinking or reasoning misconfiguration.

Also, thanks @johnjansen for fixing the reasoning effort level setting for Anthropic via AWS Bedrock!

## Crushing on Android :robot:

We fixed a potential bug on Android where Crush could not always resolve DNS.

By the way, it's awesome to see that people love Crushing on the go!

## Small sidebar render bug

Sometime files in the list could break into the next line. This is now fixed.

<details><summary>Before</summary>
<p>

<img width="236" height="137" src="https://github.com/user-attachments/assets/abcf96da-c491-4347-9db1-f8290e203981" />

</p>
</details> 

<details><summary>After</summary>
<p>

<img width="240" height="128" src="https://github.com/user-attachments/assets/568c7518-bae8-4f16-8547-96cbc8859d56" />

</p>
</details> 

## Fixed `.crush` dir location

In some edge-cases, Crush could create its `.crush` data directory in the wrong place, but that is now fixed.

This bug could affect, for example, Git worktrees.

---

That was a lot, but we're happy to be shipping!

See you in the next release.
Charm ✨

## Changelog
### New!
* 79b2d6197e51d4c02de41e8d0e6f1caf589d0974: feat(fsext): stop upward lookup at a boundary directory (@meowgorithm)
* b223e24ed8f65117f02bb2fafd1cf3184b731b21: feat(logs): add a log line for dropped events (@taciturnaxolotl)
* 303b153b975786ac1cd156203cc622bd96f27ed5: feat(oauth): add logout command (#2838) (@taciturnaxolotl)
* 0c1014e5f7465e09483716b4c3732d1e8af76c84: feat(prompts): extend templating system to more prompts (@taciturnaxolotl)
* efb3b03390d40c41cf54a009230b8db3eac7072c: feat(prompts): remove long prompt option (@taciturnaxolotl)
* 5ad8beee37a55c4d3b9e0137c3ed9960aad42063: feat(prompts): template prompts and add github and ripgrep info (@taciturnaxolotl)
* f6dc495d97b10bdc8d0dcd0be6503285a54ba7f6: feat(responses): opt in specific copilot models to responses (@taciturnaxolotl)
* 959bf7e289622a0870ae6894a9e9d07d7b9d64d7: feat(tools): create an allow list for MCP tools (#2800) (@BrunoKrugel)
### Fixed
* c8379c306f3c13b14225106d70c87a8b89ce16ec: fix(auth): add better atomic refresh for hyper (@taciturnaxolotl)
* 0490a8a6b48f7bd956a9a017f87549a0540c68a3: fix(bedrock): honor reasoning_effort for Anthropic-on-Bedrock models (#2887) (@johnjansen)
* c853a939ef079d5e8b662df41f61fe7932d61628: fix(config): always resolve the data directory to an absolute path (#2883) (@meowgorithm)
* e2e0bc093145650a45a1e663bc9674ea3542bea1: fix(config): scope .crush discovery to the current repo (@meowgorithm)
* e1123687f01a02482d1d2e5e4c9b98ee5eab2074: fix(config): scope crush.json discovery to the current repo (@meowgorithm)
* cc7d651a9e9304d13c581511038b889b61588b38: fix(config): use large model for small if not configured (#2873) (@taciturnaxolotl)
* 61ee2d2e0e6fca03f13ef3b0c3bdce00ff67e205: fix(db): use connection pool to avoid corrupted writes (@taciturnaxolotl)
* a19dd58171f507dee35b861220839c4b8e3bf319: fix(dns): fix tmux dns resolver (@taciturnaxolotl)
* 5569be61a74dfe2c9d16805a133b84b8b1505ca7: fix(lint): require `exec.CommanadContext` over `exec.Command` (@meowgorithm)
* bf5dd26e59741737bd359739249a67a304e4f1ef: fix(paste): normalize windows newlines (@taciturnaxolotl)
* 02b783a380c074c934f1534226c989d03e1642a8: fix(permission): fix publish-before-lock race and use O(1) session permission lookups (@taciturnaxolotl)
* 9b8b888efe7c237ad0f1248d317af30f18561c75: fix(prompts): don't include ripgrep and gh prompts in testing (@taciturnaxolotl)
* 0585f498ba16b43902708aec87914fbd63c68e8d: fix(pubsub): raise default per-subscriber buffer (64 -> 4096) (@sven2718)
* 08c5c7d8affa520f3508bb6e247f46c4e5140d36: fix(reasoning): enforce can reason from catwalk before sending reasoning_effor (@taciturnaxolotl)
* 8021114b23ab5149fdb623bb44f61749ca7882bc: fix(server): keep the spawned server alive after the parent exits (@meowgorithm)
* 9b366c36c3759181f58cde42d57845e2c99908d7: fix(server): probe readiness over HTTP instead of statting the socket (@meowgorithm)
* d41c118511926aad5a5d78db7f86833e7964e59a: fix(server): serialize concurrent server spawns with a per-host lock (@meowgorithm)
* d17d61ce2dc90fad83a99952f43a2e1d8f40a8ae: fix(server): spawn after stale shutdown + handle socket errors (@meowgorithm)
* 6f91b0ca22110e4055b0818dae58027d55934c0b: fix(tools): switch bufio scanner for reader (#2884) (@taciturnaxolotl)
* 295a62dc389c6a0fd7a9150a140a56b97b70f40f: fix(ui): calculation bug that would cause modified files to wrap (@meowgorithm)
* ed91948fe4e0a12ddac53b77e02e2471e23d1afb: fix(ui): regression in tool output in client/server mode (#2878) (@meowgorithm)
* 8e7451fc1e2c44523b5a52a288738839507fb9e4: fix(ui): show custom skills reliably on startup (@ilgax)
* 0a2de47f0ed37a66ee2398ea2371dc9eb2ff6939: fix: address thinking on/off toggle for provider (#2916) (@andreynering)
* 9e126c27dac80e0d754680eb6e1a24e9ba1ef38e: fix: detect stale server during development with BuildID (@taigrr)
* ea847f28903fdfccec844f4be0522d7f9bffffd3: fix: make thinking on/off toggle work for deepseek provider (@andreynering)
* 3625ade17104b8f07145229a3144bf2ba7912033: fix: render permission dialog content in client/server mode (#2877) (@meowgorithm)
### Other stuff
* 651abb48aecf6a46e0557dd69d0ad1f399b2de9e: chore(golden): rerecord vhs (@taciturnaxolotl)
* 0485adc4776f82c2b44a6fae30187e871ad487b8: chore(tests): update golden files (@taciturnaxolotl)
* 3413970fee2b99ae6915c20f26fe50de72484b47: chore: auto-update files (@charmcli)
* 7b34700a8fddcbe0fa28dae999bf04fe55d26443: chore: auto-update files (@charmcli)
* 4373f63e2effda45468cde5a85b12ce9efb2627d: chore: fetch updated info from hyper (@andreynering)
* eb03b3bb9396a5f0d92ebd5bf170adbb94e1bfb0: fix(test,race): probe server health during the run, not after (@meowgorithm)
* dd1be0e0c12b39f774eae783ce0ca35cfd4d5917: refactor(server): derive per-host cache dir from parsed host URL (@meowgorithm)
* b8989b964abf98e0e09b4c4c2f2af49ccc608f80: refactor(skills): make coordinator the sole skill discovery publisher (@taciturnaxolotl)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.68.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.68.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.68.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.68.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.67.0 — 2026-05-11

# Busy Monday

We had a busy Monday mergin' all sorts of additions and small fixes. Thanks for using Crush, thanks for your contributions, and read on for all the details.

## Hooks now use the built-in shell interpreter

By default, Hooks will now use the built-in shell interpreter instead of the one from the system. This particularly improves support for Windows, where `bash` isn't always available. It's also great for general portability as you can ensure that Bash behaves the same across systems, including environments where Bash isn't available. Of course, if the script has a shebang, we'll still respect that and run on the specified tool.

Curious about Hooks in Crush? [Check out the docs.](https://github.com/charmbracelet/crush/blob/main/docs/hooks/README.md)

## Bring back shell expansion in config values

Speaking of shell, we fixed a regression with shell expansion in config values. So now you can do things like:

```json
"api_key": "$(vault kv get my/secret/token)"
```

The bonus here is that we're also using the embedded shell interpreter, so all the Bash-like things you expect to work here will.

> [!NOTE]
> If you're wondering how are we do all this awesome Bash stuff, it's with [mvdan/sh](https://github.com/mvdan/sh) from @mvdan. It's an absolutely solid project.

## Fixed: big file reads and updates

Crush has a size limit on certain operations to avoid the whole context window getting filled up rendering a session useless. There were some bugs around this which we fixed, tool-to-tool. So now, if your project is a single huge `index.php`, file Crush should be able to work it out just fine.

Special thanks to @taoeffect for working on this.

## Assisted-by, now in the style of the Linux Kernel 

The AI community is still figuring it out patterns and conventions, and we're adjusting as things go. We adjusted the `Assisted-by` trailer on Git commit messages to follow [the current convention of the Linux kernel](https://docs.kernel.org/process/coding-assistants.html#attribution) which seems to be where people are settling at the moment.

For those following along, it was:

```
Assisted-by: {modelName} via Crush <crush@charm.land>
```

And now it’s:

```
Assisted-by: Crush:{modelID}
```


## Smaller things

* Fixed expanding/collapsing thinking blocks with the keyboard.
* More reliable detection of image files attachment. Misrenamed your `.png` as `.jpg`? No problem, Crush will now look for the content instead of the extension.
* We adopted the `write` tool to allow the model to create empty files (thanks @vorticalbox).
* LSPs should now work better on Windows (thanks @sven2718).

Hope you crush your week!
The Charm™ team


## Changelog
### New!
* dbd40d82dccf4f6c13e67f37e9bb889a38fd1d39: feat(config): resolve MCP args and thread resolver through env/headers/args (@meowgorithm)
* f71645753fb8429356354b1354a58c439580d9bc: feat(config): resolve MCP url through shell expansion (@meowgorithm)
* 3b3f992f059643fa07612e5c143623e6986f338c: feat(hooks): propagate CRUSH/AGENT env vars to builtin shell (@meowgorithm)
* 22d6f44e0f4409c64e602841e6d90a485eb91053: feat(hooks): run via shell.Run instead of sh -c (@meowgorithm)
* 711d3a384f27bdf4548579292f8ae80d34e5e30f: feat(shell): add ExpandValue for config value shell expansion (@meowgorithm)
* 2e8e5365a2d20cc75c93b6e064efecf2edf4a1e7: feat(shell): shebang/binary/in-process dispatch handler (@meowgorithm)
* 010ca2f5bf4f0d039b6fe086f195838374582bd6: feat: add touch tool for empty files (@vorticalbox)
### Fixed
* 9d3466885813791119e6d3bf72460eb0b623f894: fix(agent): release activeRequests before publishing TypeAgentFinished (@sven2718)
* 61a9fcedcbaea1bceb66a2ad70cfeb66d60c8579: fix(config): individual errors on json parse (@taciturnaxolotl)
* 78088cd25c6803234a59aab46f50c8882a6e77f1: fix(lsp): update powernap with fix for lsps windows (#2862) (@andreynering)
* da262be6374f90da2f889cb8edcafe85ace85038: fix(schema): fix schema descriptions being cut off (@taciturnaxolotl)
* c9fd6be3e3720fccdc2e2afad55dcf504141cc52: fix(shell): convert path to posix path in tests (@taciturnaxolotl)
* af002dca8ef30c30d6f894dbbb8532e53e5ea326: fix(shell): ctx-aware jq builtin (@meowgorithm)
* 32410e29a464f7a4c5e0aa27046ee9a725fcb4ec: fix(shell): fix build error post-refactor (@meowgorithm)
* 2235a49d0dc5433e1d7015f90f10aa4d65864383: fix: limit view size checks to returned content (#2785) (@taoeffect)
* 24da509486e374024e9a03d27aab26bfdeef9cc8: fix: properly follow the `Assisted-by` header spec (#2871) (@andreynering)
### Docs
* d745ff590a6945c2d47bae67b304ad01a9f10dbc: docs(README): add note about shell expansion in MCP config (@meowgorithm)
* 1d42341dc89ce897280360612d345fdc26a776fc: docs(hooks): clarify relative paths (@taciturnaxolotl)
* 5dacf9e40568e6f027ff2964c49617ddd25d75bb: docs(hooks): document new embedded shell model (@meowgorithm)
* 06f43507a3254ef30f09674003000f42e6c22b0b: docs(skill): document shell expansion in crush-config skill (@meowgorithm)
* bcce66238bfe697f6ff8aef71197d8e4b19f426e: docs: document lenient shell expansion and security model (@meowgorithm)
* 45f7484b495a6ec4e155d38a82a9935bdb11d8a5: docs: update resolver godoc to match lenient default (@meowgorithm)
### Other stuff
* 3b0d5de2b831f76b9a03533142aad48c0a5bfc76: chore: auto-update files (@charmcli)
* b7607a0bdb6822c227d4e443889cfce57083292d: chore: auto-update files (@charmcli)
* 302f4ecf357152659b645a823613eff61dfb29cc: chore: modernize errors.As to errors.AsType (@meowgorithm)
* f23e9982cc216751e509e15b9a147477070478bb: config: fail provider header expansion loudly and drop empty values (@meowgorithm)
* f9134777c941001444eb57ecc81bfcb49c6366f5: config: remove unused environment variable resolver (@meowgorithm)
* 0da13d76995011ec0ba85bf19d444710f04fdf88: fix(tools/touch): gate outside-workingDir paths via permission prompt (@vorticalbox)
* ac79e5bb0343722d4403607ff6bc6072e6e61081: fix(tools/view): detect image mime type; don't rely on extension (#2757) (@meowgorithm)
* d7d25cf89fe2613851aa083267ccb0e4389f05a1: fix(ui/chat): make keyboard expand work for assistant thinking blocks (#2791) (@meowgorithm)
* 1f83559440dda9ef8654c1fe3cc8e48f98c143dd: lsp: expand shell variables in args and env (@meowgorithm)
* 9af81e357b90ee2ec569d1c3f536bce7c96cfcf3: merge: resolve conflicts with main (@taciturnaxolotl)
* c1352663ccbb330ea518feb45f53b2afee26aa56: refactor(config): make Resolved{Env,Headers} pure and error-returning (@meowgorithm)
* 5dc30cfac53a4db94cc0f81b0d8d8879afd72196: refactor(config): resolve shell vars via shell.ExpandValue (@meowgorithm)
* f6ef43e9de46e6cf04a44a901389806a57e61b3e: refactor(shell): extract stateless run entrypoint (@meowgorithm)
* 7da38da0b09f58ccbc623beb616ce2db80ad70e6: refactor(tools): remove touch tool; allow empty write content (@vorticalbox)
* abacef933667599de956fc9493166bf9f92c56f6: shell: switch config value expansion to lenient by default (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.67.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.67.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.67.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.67.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.66.1 — 2026-05-08

# Small things + killin' bugs

Hey all. This release includes some small goodies and fixes. Let's take a look.

## Exited is aliased to Quit

When filtering for commands in the command dialog, "exit" will be properly return the "quit" command.

<img width="174" height="118" alt="Screenshot 2026-05-08 at 18 10 35" src="https://github.com/user-attachments/assets/111f030f-bd35-46f6-9d8b-85ff2377ef5f" />

## New `flat_rate` provider config

If you want to skip cost calculation for a given provider, you can now set it as a flat rate provider on your `crush.json`. This is useful when using subscription, where the cost is theorically zero as you're not really paying per token.

This is nicely done by @huaiyuWangh.

```json
{
  "providers": {
    "my-favorite-provider": {
      "flat_rate": true
    }
  }
}
```

## Show error if project initialization fails

Another one from @huaiyuWangh. If the project initialization fails, Crush will now properly show in the staatus bar that it failed.

## Fixed model stopping after Glob

In certain scenarios, the model could stop working when no files were returned in a `glob` tool call. We now fixed it, so the model will keep working.

## Fixed context window issue with background jobs

When the model inspected the output of a background job, it would fill the context window if the output is too large. We're doing the same as regular Bash command: truncating large output to something reasonable.

## Fixed behavior on invalid tool call

When the model called a tool with invalid parameters, it could hang the session. @mkaaad worked on a fix to ensure the error is reported to the model so it can continue to work.

---

There are a few more fixes, but those make a good highlight.

Enjoy your weekend and keep Crushing!
Charm :tm:

## Changelog
### Fixed
* 5816fada9363c15bd9bc211c70f97e0e38af2f34: fix(agent): support flat_rate cost handling (#2116) (@huaiyuWangh)
* 8bc4a75289efc3e819a95f9c16f351f9cd4a091f: fix(config): atomically update multiple fields during oauth (@taciturnaxolotl)
* 11eabdfc6e35a1baa8a764184c5b4afe106f4d66: fix(errors): surface errors in subagents (@taciturnaxolotl)
* ae1c95ac45ce9472abd12ca347a58e71919b9259: fix(posthog): do not discard custom properties of an error (#2829) (@andreynering)
* abeaff09a811234805d566db38131cf5cbbda94b: fix(pubsub): respect channelBufferSize parameter in Subsribe (@yeonuk-hwang)
* 89181a6809289f3a775e90972da409becc264a28: fix(tools): don't return a go error on glob tool failure (@taciturnaxolotl)
* 5aad7904dba7dab2607d96cbdb3e62483316cea3: fix(tools): fix a potential nill crash in cached glob results (@taciturnaxolotl)
* 44ece2c849d22e473b4af4fd97b01a7322de969d: fix(tools): truncate long running background commands to 30k chars (@taciturnaxolotl)
* a924ca1cb6bb15869fd1c9c10c4fbdc5feb8c7f9: fix(tui): show initialization mark errors in status footer (#2825) (@huaiyuWangh)
* 95e93e96ebdc86adc05ad30207ff6302c9d7ce5f: fix(ui): add exit alias to the quit command (@taciturnaxolotl)
* b90bcc3f2f946052f6981fbf2ee19fa46f24c7c7: fix(ui): allow oauth modals to consume enter (@taciturnaxolotl)
* 086cfdaeda19d075a4248017070e9f83de776805: fix: update fantasy with tool call fixes (#2839) (@andreynering)
### Docs
* 3b9b361bb4de52586f8b3be7a912001023de5a5b: docs(readme): document `HYPER_API_KEY` (@andreynering)
* d5b47658cb1e2c9bc6491f65726c84ccc7e1adec: docs(readme): fixed typo in hooks (#2801) (@ardevd)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.66.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.66.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.66.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.66.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.66.0 — 2026-05-06

# Wednesday patch

Hey you, how's your week going?

We're shipping a few bug fixes and enhancements today. Let's take a look.

## Summarization fixes

@taciturnaxolotl made some nice fixes to summarization. Summarization happens when the model's context window is filled, and Crush generates a summary of the session so you can continue using it.

* After summarization, Crush will not automatically send any messages waiting in the queue.
* For OAuth integrations (Hyper and Copilot), refresh token if needed before summarizing.
* If summarization errors for any reason, show an error in the screen. Before, you'd only see the spinner.

## Small YOLO render fix

Another one from @taciturnaxolotl. The prompt will now properly render in YOLO mode when you start Crush as `crush --yolo`. Before, this render mode was only working when you activated YOLO via <kbd>ctrl+p</kbd>.

## No more duplicate skills in the UI

A small bug allows skills to be rendered twice in the sidebar list, but @ilgax fixed it!

## Fixed image error when switching models

This one was reported by @LarsArtmann. When you were in a session with images attached, and then switched to a model that doesn't support images, new prompts would error. We're now ignore attachments for these models so you can continue to use the session.

That's all for today!
See you on the internet.
Charm

## Changelog
### New!
* 452cd75277496b7a0203d70064ce91253b4ea434: feat: add Nix flake for development environment (#2512) (@taciturnaxolotl)
### Fixed
* 61f49b23ed3fa9bf3abc5677489068712b916b74: fix(agent): drain queued messages after manual session summarize (@taciturnaxolotl)
* a4020df6279f6e32dae43204f86fa9db3344de95: fix(summarize): reauthenticate oauth tokens when used to summarize (@taciturnaxolotl)
* 6bdd233b03104c31105c0b7282ef20f9105bbe6d: fix(ui): display error on summarization instead of leaving spinning (@taciturnaxolotl)
* 0e039d005194c303e5c0a9ba43cce8f1760008f6: fix(ui): prevent duplicate custom skills from rendering (@ilgax)
* 6d95ecc5c7b530f88fa7503d3897a3456a252f53: fix: skip image attachments in history when model doesn't support them (#2818) (@andreynering)
### Other stuff
* 3d95ca948e3e5137df3b852cc4e934f80c49eb02: bug: yollo mode via flag doesn't activate prompt (@taciturnaxolotl)
* 8cd4786cc66b29da2412e6cc9f40cfa364cd1a17: refactor(coordinator): extract token refresh helpers to reduce duplication (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.66.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.66.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.66.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.66.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.65.3 — 2026-05-04

# Small fixes

Hey all. This is just some small fixes to start the week.

## Fixed multi-session token refresh

Crush currently support two OAuth-based providers: Hyper and Copilot. For these integrations we need to refresh tokens once they expire.

We fixed an issue affecting users that have multiple Crush instances running at the same time. Before attempting to refresh a tokens, Crush will now look on the disk if it was already refreshed by another instance.

> [!TIP]
> Didn't know about Hyper yet? [Check out our announcement on the past release!](https://github.com/charmbracelet/crush/releases/tag/v0.65.2)

## Rendering performance

We did improvements on some internal caching to boost rendering performance on big sessions.

## SQLite enhancements

@taoeffect helped with enhancements on how our SQLite driver configuration. This will mitigate some edge cases we've seen where Crush databases could be corrupted.

See ya!
Charm

## Changelog
### Fixed
* 99bc5ce850c1da02207ceba39f92afee6cba73fa: fix(config): check config file for newer token before OAuth refresh (@andreynering)
* 401084133df3e7b1895de169c4b67aea0f72b572: fix(db): prevent SQLITE_NOTADB corruption under concurrent sub-agents (#2690) (@taoeffect)
* 19197e30864f22f1b7e29b9f005d3fe6d2bae728: fix(ui): cache glamour renderers (@meowgorithm)
### Other stuff
* ecebe91e2c3bd4882f53429bbfaec2a34ee22041: chore: auto-update files (@charmcli)
* 1ed6f5248c5eb8d86d002d22578b206a09e2ceed: refactor(ui): pair markdown cache invalidation with the styles mutation (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.65.3/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.65.3/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.65.3/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.65.3/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.65.2 — 2026-05-01

<p><a href="https://charm.land"><img width="700" alt="Charm™ Hyper" src="https://github.com/user-attachments/assets/64fca84c-0857-45d0-8f92-6ebcde0138e2" /></a></p>

# It’s Hypercrush Time

Hi! Today's release adds first class support for Hyper, our inference service for coding focused on price, performance, and privacy.

Hyper's currently in private beta. To sign up, choose a Hyper model in Crush, or visit [hyper.charm.land](https://hyper.charm.land/auth?mode=signup). Beta users get 100 free monthly Hypercredits, our mystical monetary unit. If you’re approved you’ll get an email.

In addition to Crush, you can also use Hyper with any tool you’d like.

Let us know what you think, and thanks for your support! 💖

<p><a href="https://charm.land"><img width="600" src="https://github.com/user-attachments/assets/2898c7c9-9844-47c8-8bd0-cbb66b4b0045" /></a></p>

## Changelog

### New!

* feat(hyper): show remaining hypercredits in the sidebar by @andreynering in https://github.com/charmbracelet/crush/pull/2766
* feat: launch hyper beta by @andreynering in https://github.com/charmbracelet/crush/pull/2768

## Fixed

* fix: fix thinking on/off toggle for certain openai-compat providers by @andreynering in https://github.com/charmbracelet/crush/pull/2755

## Other Stuff

* chore(ui): change wording: rewrote input to rewrote output by @meowgorithm in https://github.com/charmbracelet/crush/pull/2742
* chore(tools/view): update `view` tool limit to 200KB by @andreynering in https://github.com/charmbracelet/crush/pull/2767
* chore(ui): hypercrush small type treatment by @meowgorithm in https://github.com/charmbracelet/crush/pull/2774

**Full Changelog**: https://github.com/charmbracelet/crush/compare/v0.64.0...v0.65.2

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).

## v0.64.0 — 2026-04-29

# Patch Day

It's patch Wednesday, coming in hot with improved stability and fixed bugs.

## Fixed: Hook Matcher

Did you see that [we released an initial hook](https://github.com/charmbracelet/crush/releases/tag/v0.63.0) in the past release? If not, go check it out.

Anyway, there, was a bug in which hooks would run for every tool call and totally ignore matcher rules (e.g. `^bash$`). Oof. Fixed.

## Anthropic Fix

Kudos to @ljuti who [fixed a bug in Fantasy](https://github.com/charmbracelet/fantasy/pull/219) that could cause errors on certain sessions when using Anthropic or Anthropic-compatible providers. Thanks, @ljuti!

## Background Jobs, Fixed

The `job_kill` tool had some prompt changes that caused a regression. We've roll that back and job killin’ should be easer than ever.

## Style Council

We also made a bunch more changes under the hood to prep for theming. The design goal is to be able to make themes quickly by setting only a few variables, but also keep the door open for very specific, targeted styling.

## High Status

Sometimes the status bar wasn't rendering messages properly. Now, thanks to some good logic, it should be solid as a rock.

That's all for today.
And stay tuned: we have exciting stuff coming soon.
Charm ✨ 

## Changelog
### New!
* a4488ca06a3e0f7427fc2979b54aeb3877272e72: feat(ui): switch to hyper theme when provider hyper is chosen (@meowgorithm)
### Fixed
* 4d16e96bd30016f674f162fc47128d3c108353eb: fix(app): replace single events channel with pubsub.Broker for fan-out (#2663) (@taigrr)
* 38a846d334f55c83e170e87a0a65bcdd00c8b4a3: fix(hooks): recompile matchers after config reload (@meowgorithm)
* 2be20248403dc5d2470c3e73a86a04eb40224322: fix(hyper): re-auth at selection time to ensure provider availability (@meowgorithm)
* cfcffd216122c42dbeb6a47a1df5733129fbda5a: fix(styles): fix some regressions where colors were incorrect (@meowgorithm)
* 09a112040fb774e9799dc611736baf405e438b1d: fix(ui): notification width and text truncation (@meowgorithm)
* 64c47cbbb3f0825432876786fb72737089732f55: fix(ui): restore 'update available' notification (@meowgorithm)
* 066fb5a1166bdbe4ca7012cd1d5a5051d9d5d3d2: fix: remove unused build (#2734) (@BrunoKrugel)
### Other stuff
* 81fbaca81c2221fd60c660e5902f310d2b3a5148: chore(hyper): update endpoint to new one (@andreynering)
* 8ebab21f60d8b5471398422a13a0a44664fb3ac5: chore(styles): clean up theme definitions (@meowgorithm)
* 9d4653e8c9436c59d3633599bbb400e4ce286f40: chore(styles): use hypercrush theme when hyper is selected (@meowgorithm)
* 9c4a3162ec8bef5703d8920d442e373032567bc1: chore(ui,styles): color edits and copyedits for the oAuth view (@meowgorithm)
* b07664e3570a3bef19f52c39cafa400dba876c0b: chore: auto-update files (@charmcli)
* 86bb80559238480bb88739361400f32c866037bb: fix(tools/job_kill): use longer job_kill desc to improve reliability (#2747) (@meowgorithm)
* c84ca2d92f42d52e3a6fdedc33c8df1b76e7a936: refactor(hooks): move matcher compilation into the runner (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.64.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.64.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.64.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.64.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.63.0 — 2026-04-27

# Baby’s First Hook

At last, Crush is getting support for hooks. We spent a lot of time on the design to make sure it's future proof and can support a wide variety of use cases.

<p><img width="748" height="264" src="https://github.com/user-attachments/assets/00c17b5f-f15a-470a-82bb-92a39053834f" /></p>

We're starting with just one hook, `PreToolUse`, which runs before a tool call. You can use it to deny tool calls, halt turns, rewrite rewrite bash commands, and perform any number of silent side effects. One popular use of `PreToolUse` to use [`rtk`](https://github.com/rtk-ai/rtk) to reduce the number of tokens used by many common Bash commands. [Here’s a hook you can use to get started with `rtk`](https://github.com/charmbracelet/crush/blob/main/docs/hooks/examples/rtk-rewrite.sh).

Let us know what other hooks you'd like to see next in [the discussions](https://github.com/charmbracelet/crush/discussions).

There's an also a builtin `crush-hook` skill which you can use to build, manage, and configure hooks. It's very easy to have Crush help you get the most out of hooks.

Note that Crush is also compatible with Claude Code hooks. That said, the Crush-specific API will typically produce simpler hooks and less code.

For the full run-down on hooks see [the official hooks docs](https://github.com/charmbracelet/crush/tree/main/docs/hooks).

Enjoy!
Charm :cupid:

## Changelog
### New!
* dc003bf728f7fe06993f29cba31a5d1196a5eaf0: feat: PreToolUse hook (#2598) (@meowgorithm)
### Fixed
* 7a6149df39c1e2767d2f61e0e564007476b4bee8: fix(ui): don't show disabled skills (@BrunoKrugel)
* 3cda50f83a3a683526e485f57cb1e34efe6400eb: fix(ui): fix dialog box shift when session rename is active (@meowgorithm)
### Docs
* e5611c3f82161fbf694a401129f711cd99656256: docs(hooks): improve hook documentation (@meowgorithm)
### Other stuff
* b9fdf72e8707b5929a432bf4d46d6189cdad84dc: chore(hooks,skills): update crush-hooks skill per recent changes (@meowgorithm)
* a7546adcdc06f5be224ae42e473279178ada13d3: chore(tests): regression test for (lack of) disabled skills in the ui (@meowgorithm)
* 755f6fae6f723333adfe47c01949409d243fdfdb: chore(ui): theme prep (@meowgorithm)
* f68699966309e8fc1c68e0118da519bc29429b82: chore: auto-update files (@charmcli)
* 1948ca7fa4b490a2e4eaae4cd59732131258926f: fix(ui/hooks): restore hook styling (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.63.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.63.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.63.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.63.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.62.1 — 2026-04-24

# Stability release

Open Source :tm: is all about community, and this release got some nice contributions from our loved users!

## MiniMax fix

Crush wasn't allowing users to  _some_ MiniMax API keys, but now all keys should work.

For context, MiniMax does not have an endpoint to validate API keys. We were checking they at least start with `sk-`, but not all keys from MiniMax have this prefix.

Kudos to @flynn-eye for the help with this one!

## Fantasy fix

@carsonfarmer made [a contribution](https://github.com/charmbracelet/fantasy/pull/196) to [Fantasy](https://github.com/charmbracelet/fantasy) to fix some scenario where the request could fail.

This should fix some 400 Bad Request errors for some providers.

## Tiny fixes

@iceymoss, which has been doing some good patches, got two more merged into this release.

* LSP servers startup should now be a bit more reliable (#2498)
* Better logs when Crush is retrying a request that failed (#2700)

Have a great weekend :sparkles:
Charm

## Changelog
### Fixed
* 549f717263b3fc4520ec1fede5009ddc951db057: fix(agent): implement OnRetry logging with structured retry fields (#2700) (@iceymoss)
* e5d95aa79c55b11476d6eb1a5818955844605bdb: fix(hyper): fix re-authorization flow not triggering on certain conditions (#2703) (@andreynering)
* f669bd3634215a5e2b3feb8ef7872df0f56d28b8: fix(lsp): replace sticky unavailable cache with retry backoff (#2498) (@iceymoss)
* 81daa266819ce8bf4bbb93bb03095116b8de42b4: fix(styles): use semantic names in styles + drop deadcode (@meowgorithm)
* 511916ab376490ecd924fd662de1ee0606185b29: fix(ui): logo and grad arguments from earlier refactor (@meowgorithm)
* cce8edf9a216337cca46c6457f9ab208c48babd1: fix: remove minimax api key validate (#2688) (@flynn-eye)
### Docs
* 28ab548ad2462c659aa4b6325288cae39e3915b0: docs(readme): tiny updates (@andreynering)
### Other stuff
* 15f20e6a7acdff8f671ec805671c205addd3dacd: chore(ui): add new letterforms: h, y, p, e, with alts (@meowgorithm)
* 4f3a308f708ea53e3b27cb92a02e6515107092ff: chore(ui): formal hypercrush type treatment (@meowgorithm)
* 7cbb1dbae2ae8484f72ff627a049d37131bdd4ca: chore(ui): use Lip Gloss for color blends (@meowgorithm)
* 31025a1addb9124ceadcc80f346a9e834fcf34a4: chore: auto-update files (@charmcli)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.62.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.62.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.62.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.62.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.62.0 — 2026-04-22

# Crushing the system prompt…and more!

Hi! The big star of this release is a massively reduced system prompt. Read on for more!

## Tool descriptions, now with 98% fewer tokens

You read that right. We made changes to our system prompt to vastly reduce how many tokens they use by default. On average, this should save around 120k tokens per session. This was announced on [v0.57.0](https://github.com/charmbracelet/crush/releases/tag/v0.57.0) as a preview feature, and now we're making it the default.

Crush originally shipped with pretty hefty tool instructions, but since then models have gotten a lot better (local models included) and vastly shorter instructions work just fine. This is not only a win on cost due to using fewer tokens. It also means small models (specially tiny, local models) should behave better given their small context windows.

For now, you can still opt to the old behavior with `export CRUSH_SHORT_TOOL_DESCRIPTIONS=0` for now, but. Keep in mind we might remove that support soon. If this is something you find valuable, let us know.

## Not so fast, `fetch`

The `fetch` tool reads web pages and API endpoints right into the context. We significantly reduced the max size for this tool to prevent it from eating the context window. The limit used to be 5MB, which was sort of crazy. Now, if the content is larger than 100KB, it'll be truncated (for big stuff, the `download` tool is available). This change is particularly important for small models.

## If it looks like a diff and smells like a diff, it's probably a diff

Crush’s `edit` tool has always had great diff rendering, however sometimes other tools, such as the GitHub MCP server, print diffs as well. Crush will now automatically detect that looks like a diff and render it accordingly.

Before:

<p><img width="750" src="https://github.com/user-attachments/assets/b23073ca-9c69-49be-b1a3-ea6d44a84b8b" /></p>

After:

<p><img width="750" src="https://github.com/user-attachments/assets/e6eebb4d-0a34-41de-a330-9e517482085f" /></p>

## Less noise in the logs

This is a small one, but if you noticed a lot of warnings about Crush poking around and finding skills in the logs (`crush logs -f`) ya won't see those anymore. They were a bit annoying, eh?

Thanks for using Crush , and stay tuned: we have some good stuff coming.
Charm :sparkles:

## Changelog
### New!
* f7beb12689a337dade9d9c9bef575947188bcab7: feat: generally render output that looks like a diff as a diff (#2607) (@meowgorithm)
### Fixed
* d3f6d98ab9c02d560c40b34a2899438f04f9cc53: fix(lsp): mitigate stale diagnostics (@meowgorithm)
* 9d555a70b64e33e1b0051cc237043d28f1f12f7c: fix: reduce `fetch` and `view` tools truncation size to 100KB (@andreynering)
* da3388385da340dcd94a2c73491e3152e8e4cacf: fix: reduce token usage, use short tool descriptions by default (#2679) (@andreynering)
* 7437d2b830477f06cb8a84c12f779d54423ca300: fix: silence unless warning about non-existent skill paths (@andreynering)
### Other stuff
* bbab2bcbd45ead4033d57308d45ebd2b3191f382: chore: auto-update files (@charmcli)
* b0b5c140e8262a94b96e65ea98e735c1e8b1b1d2: chore: remove CODEOWNERS (@andreynering)
* 7cc020b7d36eb4669d8f35c8eb857048e6f17775: chore: update catwalk to new domain (#2680) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.62.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.62.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.62.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.62.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.61.1 — 2026-04-21

# Some small, nice enhancements

This is a small release, but with some small fixed and QoL enhancements.

## More reliable skills

We made changes, inclusing in the system prompt, to ensure the model will load a skill when it should.

## Fixes for light theme

If you use your terminal emulator with a light theme, it was possible that some markdown content appeared to be invisible. This happened due to a dark text on dark background issue, but it's now fixed!

<details><summary>Screenshot: Before</summary>

<img width="500" height="536" alt="Screenshot 2026-04-20 at 14 16 01" src="https://github.com/user-attachments/assets/5a0a0360-96b3-48b6-a3bc-8e59c01c76db" />

</details>

<details><summary>Screenshot: After</summary>

<img width="1136" height="580" alt="Screenshot 2026-04-20 at 14 17 37" src="https://github.com/user-attachments/assets/bbe1ea97-e6f6-43dc-a99e-9f8d3a2ee882" />

</details>

## iTerm2 progress bar: it’s back

iTerm2 users will now see a progress bar when the agent is working, just like it already worked for Ghostty and Rio.

Remember that you want you can disable this with this setting on your `crush.json`

```json
{
  "options": {
    "progress": false
  }
}
```

## Clipboard fix for Apple Terminal

Copying a code when authenticating with an OAuth provider is now fixed for some terminals, like the Apple Terminal on macOS.

## Changelog

* feat: enable progress bar on iterm2 by @andreynering in https://github.com/charmbracelet/crush/pull/2641
* fix(oauth): fix copy to clipboard on terminals that don't support osc52 by @andreynering in https://github.com/charmbracelet/crush/pull/2642
* fix: use same chroma formatter as diffview for markdown by @andreynering in https://github.com/charmbracelet/crush/pull/2656
* fix(skills): increase skill load reliability by @meowgorithm in https://github.com/charmbracelet/crush/pull/2654

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.61.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.61.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.61.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.61.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).

## v0.60.0 — 2026-04-17

👀

## Changelog
### New!
* ea86101bf6c61ee05ca3e887ea65d2f5ff9e68d7: feat(hyper): use openai-compatible endpoint for hyper (#2640) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.60.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.60.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.60.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.60.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.59.0 — 2026-04-16

# Skills in sidebar, built-in `jq`, performance

Hey all! We hope you're having a great week!

Today's release is very cool, with some nice goodies :sparkles:, let's check them out!

## Skills sidebar

Crush will now show, in the sidebar, which skills are available. Very useful feature contributed by @huaiyuWangh to help discoverability.

<img width="216" height="153" alt="Screenshot 2026-04-16 at 18 20 40" src="https://github.com/user-attachments/assets/315acc40-08e6-4154-9c9d-b6eecc3fd453" />

## Built-in `jq`

Do you know [`jq`](https://jqlang.org/)? It's a very popular CLI to query JSON files from the terminal. It's very useful for agents when models want to search inside a big JSON file.

Crush will now include `jq` built-in, which means Crush can use it even when it's not installed in your machine! Additionally, we're including a built-in `jq` skill to instruct the model on how to use it.

Huge kudos to @itchyny for implementing [`gojq`](https://github.com/itchyny/gojq), the `jq` port to Go we're using internally for this! :clap:

## Fixed CPU spike

Many thanks to @Chronostasys who fixed a bug in [Ultraviolet](https://github.com/charmbracelet/ultraviolet) that affected Crush. The presence of wide-characters (non-Latin languages or emojis) could result in a CPU spike.

## Progress bar on Rio

You know [Rio Terminal](https://rioterm.com/)? (If not, you should). It recently got support for progress bar feedback, so we just enabled it for Rio as well.

See ya :wave:
Charm


## Changelog
### New!
* 3773b23cb44afc4567d892f01c41c8dc62556ca0: feat(shell): add jq as a bash builtin + a jq skill for it (@meowgorithm)
* b37649e45299d426aeae73a54efc0d1155fb5c91: feat(ui): add skills discovery status to sidebar and landing page (#2384) (@huaiyuWangh)
* e8f5e2025d2401ffe06123c42226f3b7a20abe3a: feat: show progress bar on rio terminal (#2624) (@andreynering)
### Fixed
* f546a071891c4ced02c832ff1789534df2874bda: fix(prompt): remind coder to follow `<git_commits>` format on commit (@andreynering)
* 1528c82f2e2d03c1ef5eaa56edd469f0f8309baf: fix: inject synthetic tool_result for orphaned tool_use on session resume (#2622) (@KimBioInfoStudio)
### Other stuff
* e0a3f4dbb8f85d2b7ad2e744c86a0dd97b94e39b: chore: `task fmt` (@andreynering)
* 1e0e816381f436db7f67211d6a9a2fe9c6d3cd0e: chore: bump bubbletea to v2.0.6 to fix wide char issue (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.59.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.59.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.59.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.59.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.58.0 — 2026-04-15

# Small Patch

✨ Hey everyone!  This is mostly a small update with a couple good fixes:

## So long, tea_debug.log

The previous release would litter `tea_debug.log` file around. Wow! No longer.

## Você fala inglês?

Prior to this release, smaller models would respond to the user in Portuguese regardless of what language they were using. As much as we love capoeira, we fixed the prompt so it doesn't do that anymore. 😅 

Funny bug, eh? We had told the model to respond in the same spoken language as prompted, with a Portuguese example, and the less capable models saw the Portuguese and ran with it. Bom demais!

See ya!
Charm

## Changelog

* bcf863c30e0fdd2be829c36c742b5893165cfe6b: chore: auto-update files (@charmcli)
* aea4e997b170a57a492589a9e88bd6775b42ae6a: chore: bump bubbletea to v2.0.5 to fix tea_debug.log file issue (@aymanbagabas)
* e048e71c5f61e6c81e90b8b4cab34bfb9d71c9f8: feat: add opencode zen and opencode go support (@andreynering)
* fd18c38cbb16af55c1907d124271fa9363b5bd48: fix(system-prompt): remove "portuguese" as example (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.58.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.58.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.58.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.58.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.57.0 — 2026-04-13

# Session Hardening, Token Savings and More

There are a bunch of solid housekeeping improvements in this release, including opt-in token savings and some serious work on session integrity and guarding against session corruptions.

## Fewer Tokens (Preview)

In this release we're introducing a new flag that reduces the size of tool call descriptions by about 98%, which we're estimating will save about 120K tokens/session! The `tl;dr` is that LLMs are a lot better nowadays at tool descriptions and shorter descriptions will do.

We're just keeping this behind a flag a bit to test more models with it, but find it generally works well for most models. If you want to opt-in, just do:

```bash
export CRUSH_SHORT_TOOL_DESCRIPTIONS=1
```

## Session Hardening

When a session becomes corrupted, things really suck. This release contains two fixes to prevent that:

* Crush will now detect malformed image data and gracefully handle it so the session doesn't break. This is a common situation when doing frontend web development, including using MCPs, like Figma's MCP.
* Prior to this fix, tool calls could fire off while streaming, which could result in tool results without tool calls. This would in turn result in a corrupted sessions. Not anymore!

## Better skill discovery

@huaiyuWangh came in hot with another solid patch, this time improving how Crush discovers and parses your skills, particularly in non-latin contexts (e.g. Chinese, Japanese, Korean, Arabic, and so on).

## Crush Info Improvements

The `crush_info` tool also got a little bit smarter, and now show your attribution settings.

If you don't yet know, `crush_info` is a tool available for the model that shows your current Crush configuration. It's one of the things that helps Crush to debug and configure itself. Pair it with `crush_logs` and the `crush-config` skill and you'll find Crush is quite self aware!

That's all for today! Keep Crushing and see you in the next release.

Charm™

## Changelog

### New!
* a2081e1f3717e5f8d7ebd23497d5c4c821aad3ed: feat(config): support `HYPER_API_KEY` for hyper auth (#2583) (@andreynering)

### Fixed
* 7a6a179ccc0fc1d5744bad3a7ccabd085a6474ca: refactor: simplify skills parsing and improve discovery visibility (#2350) (@huaiyuWangh)
* 4a1298ecd1dff83e1e704ca6b65b5a18d86e0490: chore: bump bubbletea and ultraviolet to v2.03 and 73592393e1ad and fix (@aymanbagabas)
* 4d62229045b4cc0242056ae2b57caedb14a53320: fix(tools/bash): restore cross-platform instructions in bash tool (@meowgorithm)
* efe42e801fbb5a44db1463f2e8ace2957328e504: fix(agent): prevent session corruption due to malformed image data (#2597) (@meowgorithm)
* c41a1a0e40b90fa2ce20b076a3741cfa6dbdff8a: fix(agent): validate tool call/results + strip tags from titles (@meowgorithm)
* e5712f07f08e1a6d81e07ab766dd3528251c3713: fix(ci): use stable Go version in security workflow (@aymanbagabas)
* d9f857fb29317f25d2af8f7104802d88b3417a5b: fix(events): prevent early events from being dropped before init (#2611) (@meowgorithm)
* d96d0443c2d61e4684514ce8545dd3db919063e3: fix(tools): add missing strconv import (@meowgorithm)
* f78baed0f06e40a3be64d21c69422ef8a6def832: fix(tools): drastically reduce tool call description lengths (@meowgorithm)
* 2e8767df512b4ab2245c7477f1f18ad6ae690c27: fix(tools): modernize string split (@meowgorithm)
* 40b7cdd46685c3d4b96b74cdcab48a2181951cb0: fix(ui): format code in ui.go (@aymanbagabas)
* 95fcd88870eee23c0389d97784b297b1482ccb15: fix: show attribution setting on `crush_info` tool (#2594) (@andreynering)
* b680a4a1cf96e757d772e7f462e08da2809418e2: fix: use proper bool check (@meowgorithm)
### Other stuff
* 3e8c1489e44f5cf34f4702fefe2ec98a81b9e2c6: chore(agent): move filter logic into a function (@meowgorithm)
* ff003b461548c4efd0a41178d31aac00a07e80bc: chore(tests): re-record vcr cassettes (@meowgorithm)
* a02ce4a98b6af7ff4f75491d838c901f4a3916a4: chore(tools): gate short descs with CRUSH_SHORT_TOOL_DESCRIPTIONS (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.57.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.57.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.57.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.57.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.56.0 — 2026-04-08

# Crush better at Crush

You might have noticed that on [v0.55.0](https://github.com/charmbracelet/crush/releases/tag/v0.55.0) we added a built-in skill to instruct Crush on how to configure itself. Adding a custom provider, LSP or MCP; changing settings, etc. can be easily done with prompts.

In this release, we added two new tools to help Crush debug itself:

* **`crush_info`**: Returns configuration, so Crush can see what is in the final configuration with all config files merged.
* **`crush_logs`**: Show logs from Crush itself. Helps Crush to debug itself in case something is now working right.

Of course, the model should only call these tools if asked to. If you want to disable them to ensure it's never available, add this to your config:

```json
{
  "options": {
    "disabled_tools": ["crush_info", "crush_logs"]
  }
}
```

## LSPs back to sidebar

LSPs are now showing again at the sidebar. There was an issue preventing them appearing there. Thanks @fuleinist for the fix!

## Config JSON schema fixed

@BrunoKrugel worked on a fix for an issue related to auto-generating the JSON schema for our config. This is typically used by code editors and even models, and it's not fixed!

See ya all in the next release 👋 
Charm

## Changelog
### New!
* df39b6443987ca34ff516efd6b62e54f59b36efa: feat(tools): add crush_info tool implementation files (@meowgorithm)
* 77fcc761173795afb85ef900f427e370c1fcb170: feat(tools): add crush_logs tool for reading application logs (@meowgorithm)
* 27727343e0ce15d0f29d7d575e88d8566ebaf566: feat(tools): crush_info tool for readling live config (@meowgorithm)
* 59943a82e2fdb19dc0867607de851ac3411f6a83: feat: open Hyper auth dialog automatically on unauthorized error (@andreynering)
### Fixed
* fccf061d46394c0feb21c8b7743eb57530024653: fix(app): derive shutdown context from `context.Background()` instead of cancelled `globalCtx` (#2242) (@AnyCPU)
* baae1b6d0e03f6db36c13a2915d8ef379bbb0564: fix(lsp): clone slice to avoid mutation (@andreynering)
* fa1565813cc109d70c6d5ef2d312b25cf3c657b8: fix(schema): fix `crush.json` schema generation (#2574) (@BrunoKrugel)
* 85445d7f50b004722f568496d61c2d7e2b51fb7a: fix(ui): subscribe to `app.LSPEvent` instead of `workspace.LSPEvent` (#2565) (@fuleinist)
### Docs
* 18823f3556d7d2a9701a75925540cde43cb2f911: docs(readme): mention `AVIAN_API_KEY` (#2557) (@avianion)
### Other stuff
* 1bb46270a9fc0a05e409804ab7950056384bf24b: chore(skills/crush-config): improve crush config skill (#2556) (@meowgorithm)
* 1b7a457f279e9726032ac92b7ccfe4ee17479ffb: chore: add custom error and message for hyper unauthorized (#2577) (@andreynering)
* 85b66c3733061d389f3b4fe1d818589548843e16: chore: auto-update files (@charmcli)
* 6e854b488d0ebdc39ddf65beab2188d572831e4d: chore: update unauthorize message (@andreynering)
* 6f7762fce8aca534b141d977d13c75237220aa63: feat(tools/crush_info): add skill status (@meowgorithm)
* 269bc30e2038750b0dbff76f329d5b07775a13e5: feat(tools/crush_info): handle config staleness (@meowgorithm)
* 816453b49639ed32efbd5bbf6ea8a286c12167ec: feat(tools/crush_info): staleness detection and auto-reload (@meowgorithm)
* 2e07c0d34de293db26caf49d62bbe5af6c59a46b: style: standardize log capitalization (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.56.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.56.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.56.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.56.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.55.1 — 2026-04-06

# Patch for local models

Many of you use Crush to use LLM models running in your local machines. In this release, our favorite contributor @Kartik33 worked on two small fixes to make Crush more compatible with local models:

* Some apps like LM Studio rejects `max_tokens = 0`, so we'll omit the field when unnset instead of sending zero to make them happy.
* When context window was unset (`context_window = 0`),  Crush would immediately try to summarize a brand new session. We'll skip summarization when the context windows is unset or unknown.

If you're using Crush for local models,  please let us know how we can make it better for you in [Slack](https://charm.land/slack) or [Discord](https://charm.land/discord)!

Charm ✨

## Changelog
### Fixed
* 741c18a21121fde99dbcadc7eadafca037ba790e: fix: support local models with unknown max_tokens and context window (#2554) (@Kartik33)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.55.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.55.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.55.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.55.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.55.0 — 2026-04-02

# Builtin "Crush config" skill + an experimental thing

We have a couple new feats on this release. Let's check them out!

## Built-in "Crush config" skill

Starting on this release, Crush has the concept "built-in skills". Those are skill built in Crush, so you don't need to manually copy them to your machine or project.

For now we have a single one: "Crush config". Crush can now configure itself, so if you don't want to manually edit your `crush.json` config, you can just ask Crush itself to do it for you. You can ask it to add a custom providers, add a MCP, add a LSP, change a setting, etc.

## Disable skill

We also added the ability to disable skills, no matter if built-in, global or project skill. Just add this to your `crush.json`:

```json
{
  "$schema": "https://charm.land/crush.json",
  "options": {
    "disabled_skills": ["crush-config"]
  }
}
```

## Experimental server-client architecture

If you run Crush with `CRUSH_CLIENT_SERVER=1`, it'll now run via a brand new server-client architecture.

Keep in mind, though, this is ***VERY*** experimental! There are known bugs when using Crush in this mode. We'll be polishing it with time and only make it the default once it's stable.

Happy Easter!
Charm ✨ 

## Changelog
### New!
* 0f2e2f0526cdb2d46596b1cad927575e57f0402f: feat(server): initial implementation of Crush RPC server/client (@aymanbagabas)
* 2832d5277fe92dad9e577ba9cabadaf4535c4432: feat(skills): builtin skills + skill disabling + crush-config builtin (#2466) (@meowgorithm)
* 9a63da505a6a98fb3f7f8e36347b6e91785f4322: feat: add AppWorkspace implementation of Workspace interface gated behind CRUSH_CLIENT_SERVER env var (@aymanbagabas)
* 248d8b99c6f9332aa1b5a0f71b27d76011e83331: feat: add generated swagger docs and serve them in the server (@aymanbagabas)
* 6dcaab1195c72bd81581cd23511bac6d86fc377b: feat: add swagger api docs generation (@aymanbagabas)
* 1b37d55bb6f00810032f9d0330750a89e5914ea0: feat: send server client version info (@aymanbagabas)
### Fixed
* eb7ed4f97aa86330cd29e29b23cdcf82cc507b30: fix(client): add ListWorkspaces method to retrieve all workspaces from the server (@aymanbagabas)
* e410d7acd459b4ded2803766376fd0440dafe20e: fix(server): encode sessions in proto format (@aymanbagabas)
* bc383d98359b53b291eb2154289e098e1cfe15a3: fix(server): log to stderr if it's a terminal (@aymanbagabas)
* 344eb3223b01d7d8e4c88e135bc20c5c0b550777: fix: ensure proper resource cleanup and add retry logic for workspace creation (@aymanbagabas)
* 65974bb4ea1c57ba942caee8e7748b67446d3487: fix: setup logging in server and client commands (@aymanbagabas)
* 2182fc469cdccc517550233d00101bcc7918678d: fix: update UI tests to use test workspace (@aymanbagabas)
### Other stuff
* 40c426a95088174708be1d97d0f5bb1e48855427: chore: add a workaround for slog calls in config.Load leaking to stderr (@aymanbagabas)
* 7572ce1f0f2b9d1d02258d11a051c9ce1f75a3f7: chore: auto-update files (@charmcli)
* de04fc21cf1202bf4a26b5d6c80f58dd49835fd9: chore: auto-update files (@charmcli)
* ed716339ab8354be265c6bb2ddaf7e6b38e81806: ci(lint): fix yet another lint issue (@andreynering)
* 33863b10c24b8c59798349970989840c529d2b15: refactor(server): move agent, session, permission, and event logic to backend package (@aymanbagabas)
* 206aecfbfdc9adcb854f38d1addeb7db959032cd: refactor: centralize user config path in a single func `home.Config()` (#2542) (@andreynering)
* e44211db2573aeda9100334cfc76908f918ad0bc: refactor: migrate run and login commands to use client API instead of direct app access (@aymanbagabas)
* e3df84efb4067f61a0fcb8359308782ace5d9b1a: refactor: modernize (#2548) (@BrunoKrugel)
* 64f6cdf5602a75e83aeb521af8db3607b63cf6e7: refactor: rename Permissions.SkipRequests to Overrides().SkipPermissionRequests (@aymanbagabas)
* 7bb3a7ba97706a3bebfedcd364ce5ce6fc5d43a9: refactor: simplify LSP diagnostic counts retrieval (@aymanbagabas)
* 72251dd90681476e158a931069d5b078261c0323: refactor: update client methods to return proto types (@aymanbagabas)
* e70c8ba8f6dedd224ebaa712f374b9a54d10c669: refactor: use client and server for workspace access and management (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.55.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.55.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.55.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.55.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.54.0 — 2026-03-31

# Small feats + more

We have a good number of fixes and enhacements in this release. Note how many contributors helped with this release! It's exciting to see the Crush community grow. :rocket:

## Better init prompt

@Amolith made some nice improvements on the prompt to generate a `AGENTS.md` file for new projects.

## Custom Git ignore file support

If you happen to have a custom global ignore file for Git (`core.excludesfile`), Crush will now respect that when listing files. Thanks @mavaa for implementing this!

## Skills on `crush session`

`crush session show` and `crush session last` commands will now show a header with the all skills used by the session.

<details><summary>Screenshot</summary>

<img width="710" height="317" alt="skills" src="https://github.com/user-attachments/assets/1be7d299-fc22-4241-b47b-09530e73eaa9" />

</details>

## LSP Auto-Start setting

Setting `options.auto_lsp` to `false` on your config was supposed to prevent LSP servers from booting automatically, unless you had manually configured them. There was a bug with this setting, but @BrunoKrugel helped us by fixing it.

## UI fix for non-image models

@huaiyuWangh contributed with this fix. If the model you're using doesn't support images, Crush will now hide the help items in the bottom with the keybinding to attach images.

## No more `.crush/.gitignore` on your `git diff`

We recently changed the content of this file to not ignore `.crush/skills/*` by default, but a small annoying side-effect made that file itself visible by Git. We're now _also_ ignoring the `.crush/.gitignore` file itself again.

Keep crushing!
Charm :cupid:


## Changelog
### New!
* bf21a59b9d559f19b720d8325edad73cbeca8d40: feat(init): elicit control/data flow, arch descs (#1790) (@Amolith)
### Fixed
* cda2719416c1bad7291017db3c5f5e1b93795c2c: fix(commands): add timeout context for MCP prompt retrieval (#2517) (@iceymoss)
* 664aae78f8d04e594d4e846f26f143da46e2d0e8: fix(csync): use pointer receiver for JSONSchemaAlias (#2521) (@huaiyuWangh)
* 8e743cbfeb8e0dbb2b3a605a93c2acc754024d27: fix(event): prevent panic on non-string telemetry keys (#2502) (@iceymoss)
* 3412194cc489ff259ee2e46059930830f5c54857: fix(ls): respect git's `core.excludesfile` config if set (#2314) (@mavaa)
* 0e640a1f32215bd9cac244ca8722febf20591709: fix(lsp): respect lsp auto start config (#2487) (@BrunoKrugel)
* 5cf6e5ab3c1214d9d0549a418e10bc4ad091f8ca: fix(taskfile): fix syntax error on task `run:onboarding` (@andreynering)
* f416931307d5b446dfe1e376d9c0ade4a28b6406: fix: conditionally show image keybindings based on model support (#2522) (@huaiyuWangh)
* 42c8bcc60cd81fb9d3bc5f5a5545abb3369ca18c: fix: do not commit `.crush/.gitignore` (#2531) (@andreynering)
* 73c2a9dd82591875b4b9f2ce85310b33d5ef834d: fix: skip non-existent command dirs instead of creating them (#2534) (@majiayu000)
### Other stuff
* 2bcc97bd4b3fa951b87cbf256a043b6cf8dc2cb0: chore(lint): fix some small lint warnings (#2488) (@BrunoKrugel)
* 8b30fad1066b01df0e9bfbf26ae8a1643be3d656: chore: auto-update files (@charmcli)
* b68823b0aef7e7b913b461529096d17ad4d36599: feat(cli/session): show skill metadata (#2541) (@meowgorithm)
* d161cbcf5d5500286b3526951e72fcfeeefeb6d5: feat(init-cmd): mention progressive disclosure (#1786) (@Amolith)
* 97c9f4b0f555af501fd56f87f5710dbad72cff71: refactor(ui): replace hardcoded cursor offset with style-based calculation (#2530) (@huaiyuWangh)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.54.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.54.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.54.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.54.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.53.0 — 2026-03-27

# GLM-5.1 + Mr. Big Prompt

Hey all! Friday is here and we have a few fun goodies for « Le Week-End ». Read on!

## ⚡️ GLM-5.1

Z.ai's GLM-5.1 was released just today as part of their coding plan, and it's available in Crush now. GLM-5.1 is a hot, new open source model that claims to come close to Opus 4.6. Enjoy and let us know what you think!

<p><img width="600" src="https://github.com/user-attachments/assets/f155ea87-b1e4-46c9-823c-169a80bb504a" /></p>

## 💬 A Bigger Prompt

When we first released Crush, three lines for prompting felt great. Now it feels really tiny! Fear not: in this release we made the prompt input area dynamically grow up to 15 rows in height as needed.

<p><img src="https://github.com/user-attachments/assets/d63c94f0-50f4-4590-981d-1a7dbb879142" width="600" alt="Dynamic prompt sizing demo in Crush"></p>

## 🔥 Hot Fixes

* **Diffs:** in some scenarios, the diff for a changed file weren't behavior correctly and looked like the whole file was changed. Not anymore.
* **Tools calls:** if user canceled the session (with <kbd>esc+esc</kbd>) in the middle of a tool call, that could result in a broken session, making impossible to send new prompts. Fixed!
* **Session titles:** the prompt to generate a title for a session was further enhanced to avoid generating in the wrong language if the chosen small model wasn't too smart.
* **Cleanup:** we're now ensuring we clean temporary files created when you press <kbd>ctrl+e</kbd> (opens external editor to write prompt).

Enjoy your weekend!
Charm ✨


## Changelog
### New!
* a81a652178eb25dde56fc5caecc9a8ebeabd13ba: feat(ui): variable height prompt input field (#2468) (@meowgorithm)
### Fixed
* 4a3df1ec90eb9536e74b54d292d75a1442e4e58e: fix(dialog): use valid key binding name for OAuth success state (#2491) (@huaiyuWangh)
* e7a41461a24eb5bca3463c0c18f9b15f2444871c: fix(diffview): use `udiff.Lines` and not `udiff.Strings` (@andreynering)
* 4501438f8125924e549e436a2b8b64608358f29d: fix(ui): always clean up external editor temp file (#2503) (@iceymoss)
* 2928dcb2e81dd68919b5fde3b1abd2ca4172c8c8: fix: append error tool message when tool call is cancelled (#2492) (@fuleinist)
* dd7b58df1b8037146f4aa8d33e09b711ef777196: fix: enhance session title prompt to fix language issue (#2497) (@andreynering)
### Docs
* da39f6f1a8554ffe9bb6aee6cb7a317dc7ae3296: docs(readme): add q&a section and note about clipboard support (#2509) (@andreynering)
### Other stuff
* 65b9ea53c46466ee862ba760169f32b9740742bb: chore(taskfile): add one more file to dependencies (@andreynering)
* 6efc370154912db8cc8d25d0a9be41dd7820863d: chore: update catwalk (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.53.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.53.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.53.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.53.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.52.0 — 2026-03-25

# Project skills + more

Hey! It's Wednesday already (time flies), and we're here bringing you a few good nice enhancements. Stay with us!

## Project skills

We just added support for local skills. This means that you can easily share skills with your team mates or contributors inside the repository by just committing them.

Crush will look for the following projects paths:

* `.agents/skills`
* `.crush/skills`
* `.claude/skills`
* `.cursor/skills`

Another related enhancement is that Windows users will also be able to put global skills on `~/.config/crush/skills` or `~/.config/agents/skills`, which is a little bit easier to manage to having them on `~\AppData\Local\crush\skills\`.

[Check out the complete docs here](https://github.com/charmbracelet/crush?tab=readme-ov-file#agent-skills).

## Non-English prompts

We improved our system prompts to enforce that the model should respond to message and generate session titles according to _your_ prompt language. For example, if you're talking to the model in Portuguese 🇵🇹 🇧🇷, you'll want it to respond in Portuguese.

## Better file picker order

You know that you can easily pick files fro the text area by typing `@`, right? @huaiyuWangh made a great contribution on significantly improving the sorting based on your filter. This is a very signiifcant UX improvement for bug repos.

Talking about @huaiyuWangh, he also fixed the "Open file picker" option in the command pallette (<kbd>ctrl+p</kbd>).

## Allow apps to detect Crush

Starting on this release, Crush will set these ENVs when running Bash commands via the Bash tool. The intention is to allow programs to detect that they are being ran by Crush.

* `CRUSH=1`
* `AGENT=crush`
* `AI_AGENT=crush`

The `AGENT` and `AI_AGENT` ENVs are _kinda_ a unofficial new standard, so a few tools already look for them.

That's all for today.
Enjoy the release and keep Crushing!
The Charm Team ✨ 

## Changelog
### New!
* 0f5df9bec255742fa46046ce2993399cdc5ebe67: feat(bash): set `CRUSH=1`, `AGENT=crush` and `AI_AGENT=crush` (#2484) (@andreynering)
* 0fcf79baf4aebd2b87cb49a8a287a18e6ad1dcac: feat(ui): improve file completion ranking algorithm (@huaiyuWangh)
* f67fa357932387ab20dada0ea1ac416da021143a: feat(ui): prioritize filename-based completion ranking (@huaiyuWangh)
* cd5c937d2e265a1defbb45b953592286787f2346: feat: load project skills automatically from `.crush/skills` and more (@andreynering)
### Fixed
* d89120c5309359561c267b76e36918fab0ff6b1f: fix(hyper): ensure it's possible to override with `HYPER_URL` (@andreynering)
* ffc7a9d261421de4031b386da030b696e88aa95d: fix(log): don't conflate body drain errors with HTTP errors (@meowgorithm)
* 697fad9548abd5bf9f842896469de6119e7b401d: fix: complete file picker dialog action (#2483) (@huaiyuWangh)
* db043c375866dcf9246e8bdb36677439168de482: fix: on windows, also load skills from `$HOME/.config/crush/skills` (@andreynering)
* 06cf63fa9d929aac71eaa66f4612681c21ca4f9f: fix: session titles should keep the same spoken language (@andreynering)
### Docs
* 0e3d47273fe9a8bc749a6e928b8e7d9f102c1956: docs(readme): update skill docs with updates and new paths (@andreynering)
* 09da90a2a6b9c7b0a498304f1fb924a3012e750b: docs(ui): add comprehensive comments to completion ranking algorithm (@huaiyuWangh)
### Other stuff
* 6920cf1174e9f33b82e5f4a2ac2f93eba6b6ce1c: chore(lint): modernize interfaces in the db package (@meowgorithm)
* 1a0b6389f0624d5696235bb6343c7a7837ed8da3: chore: update generated `.crush/.gitignore` to not ignore skills (@andreynering)
* 2325de7aca97f98dafdda5832db4637328788210: fix(system-prompt): tell the model to respond in the prompt spoken language (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.52.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.52.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.52.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.52.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.51.3 — 2026-03-24

# Little patch

A couple small bugs were fixed in this release.

## Long pasted content

We improved the detection of long text pasted into the prompt. Crush will add the content as a file attachment if the content is 3+ lines long, but that wasn't accounting for long single line texts (like a big un-indented JSON). This is now addressed.

## Fetching big web pages

The model tried to fetch a web page that is long enough, it could not have enough context window to handle all that. We reduced the max file size to something more resoanable. The models will still see the content, but truncated.

## SQLite

Also, the SQLite driver was updated to a new version that is faster, in particular on boot time, so Crush startup should be a little bit faster.

## Tiny fix

And not less important, @faelis removed a duplicated help in the bottom.

See ya 👋 
Charm

## Changelog
### Fixed
* 96f51ca5cf873532a15e7cb149b755f2d5ed03eb: fix(tui): remove duplicate ctrl+g help binding in FullHelp (#2465) (@faelis)
* 0c6fb42a0359d381085e531f4fcec6e0af07c988: fix: improve long text detection to account for long text in a single line (#2442) (@andreynering)
* dfc57d4c1d779da45197d6b5ec6569cf515e4d77: fix: reduce max read size from 5mb to 1mb for view and fetch tools (#2447) (@andreynering)
### Other stuff
* c771cf119ff7e00fd8fe4b5ad6c8024089bc59c4: chore: update `google.golang.org/grpc` with security fix (#2464) (@andreynering)
* 91bec12ceb49c9272c3f28ebc27728c7ea63f113: chore: update ncruces/go-sqlite3 to v0.33.0 (#2461) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.51.3/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.51.3/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.3/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.3/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.51.2 — 2026-03-20

# Friday patch

Hello coders. We're bringing you a patch with a couple small but yet meaningful fixes.

## Copilot tool calls

GitHub Copilot tool calls were broken when they had no arguments. An example of a a tool that don't require arguments is listing files when in the project root. This has now been fixed.

## Ollama tool calls

In a similar manner, Ollama tools can differ a bit compared to OpenAI and other OpenAI-compatible providers. We improved how we handle those so tool calls for Ollama are now working!

Enjoy your weekend and keep crushing!
Charm 🌟 

## Changelog
### Fixed
* a2d45378c20e3747b7a0ad73b4f93cc0c2130ff0: fix(fantasy): fix copilot tool calls, fix ollama compatibility (#2444) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.51.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.51.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.51.1 — 2026-03-19

# Mini Avian fix

Hi! This is a tiny patch to fix the Avian provider. Fly, Robin, fly!

xx, Charm 💘 

## Changelog
### Fixed
* ad5368f1d3192e12bca20cecfc0b46b688c294cb: fix: update fantasy with a fix for avian (#2438) (@andreynering)
* df094bdeca6717cb36c127fddda69a041b4e38f1: fix(mcp): handle raw/whitespace base64 (@meowgorithm)
* 351e5620f7c63cec6c2d2b42ce4b5e17031f6423: fix(mcp/docker): only write config after docker startup succeeds (@meowgorithm)
* 600310508e2b00a933454e3afcea33cd5eda3054: fix(ui/docker): don't block ui when checking for docker desktop (@meowgorithm)
* 6c61cae0003a32efbce087116af67ad65c7c2a8c: fix(ui/docker): stable sort mcp parameters (@meowgorithm)
### Other stuff
* 12dfcdf25aae3b204247b8912461dfe7e44e10ef: docs(mcp/docker): comments (@meowgorithm)
* f6e7a43a81b342bae6c7ed4d8f3c72087bc9de4c: fix(mcp/docker): harden tests (@meowgorithm)
* 00cefc951a10423db00c1285adccaf124279ca61: fix: remove deadcode (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.51.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.51.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.51.0 — 2026-03-19

# Crush + Docker MCP :whale:

We teamed up with [Docker](https://www.docker.com/) to natively integrate the [Docker MCP Catalog](https://hub.docker.com/mcp) into Crush and—if we do say so ourselves—it rocks!

There are also some CLI improvements and bug fixes in this release, too. Let’s get to it!

## One MCP to Rule Them All

<p><img width="300" alt="image" src="https://github.com/user-attachments/assets/b6bb6fdd-e7c6-48aa-8a03-8971c08796c8" /></p>

As we were saying, the big feature in this release is an integration with the [Docker MCP Catalog](https://hub.docker.com/mcp).

During a conversation, Crush and Docker work together to pull in relevant MCPs on demand. Working with Postgres? Building a robot? Going deep on ARM? Crush and Docker will load in the MCP you need, when you need it (and yes, Crush will still ask for permission).

To get started, make sure Docker Desktop is running, then fire up Crush, press <kbd>ctrl+p</kbd>, choose “Enable Docker MCP Catalog”, and get to work.

For more info on this rad feature [check out the blog post](https://charm.land/blog/crush-and-docker-mcp/).

<img width="600" alt="image" src="https://github.com/user-attachments/assets/a532dac3-45a0-432d-9982-d79403b32cd2" />

## CLI Ergonomics

People love `crush run` and `crush session`. What they do not, love, however, is typing. We have a solution for this, behold!

* `crush run` -> `crush r`
* `crush session` -> `crush s`

We also added `--session` and `--continue` flags to `crush`, allowing you to quickly pick resume sessions in both the CLI and the TUI.

```bash
crush --continue     # continue the last session in the TUI
crush run --continue # continue the last session non-interactively
```

For more see `crush —help`.

These flags are now also available for the interactive mode, so you can just run `crush --continue` to automatically open the last chat, or `crush --session {session-id}` to automatically open a specific session.

## Anthropic + Vertex Fix

If you work at a big company you probably know all about burning your boss’s tokens freely. This release fixes an authentication issuewith Anthropic via Google Vertex allowing you to resume token burning For more info see https://github.com/charmbracelet/fantasy/pull/157.

Enjoy the release :whale:
Charm

## Changelog
### New!
* ddd99cd2f650adfa9dc9ec961365266d8512c4a0: feat: add aliases: `crush r` -> `crush run`, `crush s` -> `crush session` (#2424) (@andreynering)
* 630ff8c5dfeaabc96b8f05917d28455ad7e1075e: feat: add support for `--session` and `--continue` for the tui (#2422) (@andreynering)
* e0dcaba820b1a5f391fad9b89590e8c8932b6404: feat: docker mcp integration (#2026) (@kujtimiihoxha)
### Other stuff
* aa253c524ad789c0d0eccad57322b18ae469edbc: chore(taskfile): enhance `deps` task to work for recent releases (@andreynering)
* a3288de0d2a6b70aab1c1caa238f307a401b259f: chore: auto-update files (@charmcli)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.51.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.51.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.51.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.50.1 — 2026-03-17

# [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini) and [GPT-5.4 Nano](https://developers.openai.com/api/docs/models/gpt-5.4-nano) support

This release adds support for the new OpenAI models, GPT-5.4 Mini and Nano, released just today. GPT-5.4 Nano is also the new default small model for OpenAI.

<p><img width="300" src="https://github.com/user-attachments/assets/721efa33-4951-49b5-8ae3-8acb62113ce0" /></p>

Enjoy! ✨ 
Charm


## Changelog
### Other stuff
* 695ced1118986921448f2b3941877eca4023125d: chore: add support for gpt 5.4 mini and nano (#2419) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.50.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.50.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.50.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.50.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.50.0 — 2026-03-16

# Catching up with `crush run`

Did you know that you can Crush in a non-interactive manner? It's easy as `crush run`.

```bash
crush run "what's the best tui framework for go?"
```

That’s been a thing for a while. Starting with this release you can pickup sessions non-interactively thanks to an awesome feature by @seroperson:

* `--continue` (`-C`): continue last session
* `--session` (`-s`): continue a specific session

```bash
# Continue a previous session
crush run --session {session-id} "um, can you repeat that?"

# Continue the most recent session
crush run --continue "tell me more"
```

How can you find your session ID? You can use the [session management commands we added 4 days ago](https://github.com/charmbracelet/crush/releases/tag/v0.48.0). In short:

```bash
# List all sessions (ordered by most recent)
crush session list

# Alternatively output JSON, useful for scripts, etc.
crush session list --json
```

The week is just started. See ya in a few!
Charm :sparkles:


## Changelog
### New!
* fad58e2c269654c052a768191cc7a3ec0af391e5: feat: be able to continue non-interactive sessions (#2401) (@seroperson)
### Fixed
* b05a4add77941265581e3508ce50429143e6a8fa: fix(ui): render nested tools consistently across states (@meowgorithm)
* efb52db17ed78f68bb7de7c79bd575263292642a: fix(vercel): fix validation of api keys for vercel (#2415) (@andreynering)
* c9efb207ea0575ca837e2d957738452da78b366b: fix: keep original order when filtering models (#2416) (@andreynering)
### Other stuff
* a1fc44bb0d851f240a345cf3a1c76d5a9f78a3d2: chore(events): add events for the CLI session series of commands (#2408) (@meowgorithm)
* 9a5a510e68619bc4cdb4131665306219b1995cb2: ci(labeler): add vercel label (@andreynering)
* 6e56a7f45acab2f19463ce69b29d13529ef81f35: lint: modernize new pointer creation (e.g. new(true)) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.50.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.50.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.50.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.50.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.49.0 — 2026-03-13

# Friday patch

Hope you had a great weekend! Here's a patch with some small fixes and improvements.

## No background

Added new command on the command palette (<kbd>ctrl+p</kbd>) to toggle on/off the background color (a.k.a. enable "transparent mode"). This will be persisted.

<details><summary>Screenshots</summary>

<img width="600" alt="image" src="https://github.com/user-attachments/assets/63ec34ec-40fc-4f9b-8159-4fb55f13f166" />

<img width="600" alt="image" src="https://github.com/user-attachments/assets/5c4dcc55-6b06-4d5a-ab36-149a9fa422ca" />

</details> 

## Easier Bedrock

If you use AWS Bedrock, you'll now be able to just paste your API key in the input as any other provider.

Before, it was working only via environment setup (`AWS_BEARER_TOKEN_BEDROCK` env or `aws login`).

## Updated OpenAI SDK from v2 to v3

Note that this SDK is used not only for OpenAI, but for any provider that is OpenAI compatible.

This might look like a technical detail, but it means we're covered with the latest bug fixes. A couple users confirmed this fixed some rare errors on some providers.

## `auto_background_after`

@portertech contributed by adding a new `auto_background_after` param to the Bash tool.

With this param, the model can ask Crush how many seconds it should wait before moving that command into a background job. Before it was always 60 seconds, which is still the current default.

Enjoy your weekend!
The Charm team :tm:

## Changelog
### New!
* f1bdb9c9b815f884b81e5b6bf810e74b8f5f48a6: feat: add configurable auto-background threshold for bash tool (#2183) (@portertech)
* eaa9a4a9bffb62a3adadc53986a51c033bece785: feat: allow to paste bedrock api keys (#2407) (@andreynering)
### Other stuff
* 81f2d3811970d823e7fbaa83d60d6ef1d6ad707d: chore(ui): add toggle for transparent bg to command palette (#2405) (@meowgorithm)
* 451faa7110d13931c60923889078340cec50df18: chore: update openai sdk to v3 (#2406) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.49.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.49.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.49.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.49.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.48.0 — 2026-03-12

# Notifications, CLI-based session management, and more

:wave: Hello all! This is a fairly beefy release with a some nice features and a slew of bugfixes.

## Notifications

Sometimes LLMs take a while to do so things and, naturally, we go and do other things in the meantime. Now, Crush will send a notification when it needs your attention (e.g. permission requests) and when it finishes its work. How thoughtful!

<p><img width="275" src="https://github.com/user-attachments/assets/706221e6-a59c-4402-a9c6-eae702496466" /></p>

If you find this annoying, it's easy to toggle notifs on and off, too:

<p><img width="500" alt="image" src="https://github.com/user-attachments/assets/2f0ef33e-0af0-45c0-a8c9-3989978121d4" /></p>

This feature was implemented by star contributor @Amolith, who waited _so_ patiently for us to QA this incredibly tricky feature across the various platforms we support.

## Sessions on the CLI for humans and agents

We're big believers in `crush run`, Crush's non-interactive mode, and this release brings a host of session-based features to the CLI for humans and agents alike.

In particular, now you can browse sessions with `crush session list` and inspect former sessions with `crush session <id>`. Agents and machines can add `--json` for structured output, allowing you to fully inspect past sessions in their entirety. You can also rename and delete sessions, opening a lot of possibilities around non-interactive mode, i.e. `crush run`.

For full details on headless session management see `crush session --help`.

<p><img width="582" height="467" alt="image" src="https://github.com/user-attachments/assets/43533bb0-6fe1-40df-96f0-2ca454333410"></p>

<details>
<summary>Demo: listing sessions:</summary>

<p><img src="https://github.com/user-attachments/assets/68cc2b12-2790-4434-bbee-ec0d6a64c0db" width="600"></p>
</details>

<details>
<summary>Demo: viewing sessions:</summary>

<p><img src="https://github.com/user-attachments/assets/bd54ecf8-4eff-43a0-8c0b-b487fee27465" width="600"></p>
</details>

## A Crush User-Agent

Now Crush will present itself on the network with a user agent, e.g. `Charm-Crush/0.48.0 (https://charm.land/crush)`. This makes it a lot easier to identify with observability tools. Enjoy!

## Crushing the bugs

We also absolutely hosed a handful of bugs in this release. Good riddance!

Happy hacking,
Charm ✨ 

## Changelog
### New!
* f8da538c509f77dffd1ad1926f8a41ac75953016: feat(notification): alert on turn completion and permission request (#1356) (@Amolith)
* cfcbd69eb24e2d992a74d835384ce9b0426fb4ce: feat: CLI-based session access and management (#2373) (@meowgorithm)
* a897f65d682f7634539a763f74da8c32c998b0d4: feat: set user-agent to Charm Crush/<version> (#2357) (@meowgorithm)
### Fixed
* ec8c8dd22b46496729e725387e15a33ddede26c9: fix(events): panic when metrics are disabled (@meowgorithm)
* e0d3141af1477da55bf4591a85fe98a8a80a6f28: fix(events): remove redundant posthog exit event (#2371) (@meowgorithm)
* 2dacfbd90c237d269d2f42b4cfc9880a54c72857: fix(noninteractive): actually use models to generate titles (#2372) (@meowgorithm)
* 7f2e9f88ea2285c212abfba4996f7e4db7a54d54: fix(ui): format xhigh as XHigh (not Xhigh) (#2369) (@meowgorithm)
* 4fee559a7e675ff21bb04162d44cca3b89dcdcc5: fix(ui): properly truncate info message (#2379) (@aymanbagabas)
### Other stuff
* a3bfa1975f4a9842e4f52735424145f521e9bab1: chore(agent): allocate errors once, reuse errors (@meowgorithm)
* 7d50e8f8e7a8bc9b32000a5c97c43f8fc1b1b8df: chore(agent): cleanup logic (@meowgorithm)
* ca32607dc23f2b3f93204dcad32c89ef6ebb7e7a: chore(ui): add command palette entry for toggling notifications (#2402) (@meowgorithm)
* 79c3ffa3ae922655a025d7ce0b0a4b5ec3722d61: chore: improve examples in `crush --help` (@meowgorithm)
* 45c25b34733f5f0b59bb9f7a05b057100eae3632: chore: update AGENTS.md (#2388) (@meowgorithm)
* 53ca4dc3e9eb84fffc9d7128a764bddbd5973b2b: chore: update and improve ui/AGENTS.md (@meowgorithm)
* cee203d423aa9a1249fcc40fb7ea06225d27a290: chore: update user-agent string to better follow the convention (@andreynering)
* 5ff8d6876005ba48686a58fa71417c3a3f17bebe: refactor(config): introduce ConfigStore and Scope for better config m… (#2395) (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.48.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.48.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.48.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.48.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.47.2 — 2026-03-05

# GPT 5.4

Second patch of the day to bring you some new goodies.

## OpenAI [GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4) and [GPT-5.4 Pro](https://developers.openai.com/api/docs/models/gpt-5.4-pro)

Both these models were released today. We usually don't require updating Crush to use new models or providers, but these were an exception.

> [!NOTE]
> The Pro version is considerably more expensive and slower then other OpenAI models. Check its price before using.

## New providers

We recently added a couple new providers. You don't really need to update Crush to use them, but we're mentioning them below:

* [Zhipu and Zhipu Coding](https://bigmodel.cn/)
* QiniuCloud

Keep crushing,
Charm ✨ 

## Changelog
### Fixed
* ef0671ccf9af76c74dd3d97cc6e2968649024109: fix: suppress message when clipboard is empty (#2361) (@andreynering)
### Other stuff
* eb71faf2449032851a52df81e28b56c0e77c8c9e: chore: add gpt 5.4 and gpt 5.4 pro (#2363) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.47.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.47.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.47.1 — 2026-03-05

# Window resize fix

This patch fixes an issue of Crush not adapting well to window resizes in some terminal emulators, like the Windows Terminal.

There is also a minor fix for LSP integration regarding handling non-UTF8 encodings.

See ya 👋 
Charm

## Changelog
### Other stuff
* ca1366121cc016a60a0bf62d75c639440417ba7d: chore: update bubble tea to v2.0.1 (#2360) (@andreynering)
* ae1bac33d20768c95327120fd7d11eaf4dd29f73: chore: update hyper (#2354) (@andreynering)
* fae0f2e82da57a0e0335d86b417a819121f4e69f: fix(lsp/edit): properly handle non-ascii chars (e.g. CJK) (#2325) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.47.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.47.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.47.0 — 2026-03-04

# Community patch

We're shipping a small release with two nice contributions from the community.

## Better background jobs

@portertech implemented a new `wait: true` optional parameter on the `job_output` tool. This means that the model can now ask Crush to wait for a background job command to finish before returning its output. This is important to prevent polling, which would also consume more tokens than needed.

## LSP connection fix

@taigrr worked on a patch to ensure that LSP connections are closed once the server is shut down.

Enjoy!


## Changelog
### New!
* 9ec46b8d439646a505018576e7197b2daacfb7b3: feat(shell): add blocking wait option to job_output tool (#2189) (@portertech)
### Fixed
* 56d79d108ee5036224ef13155871457425c7729e: fix(lsp): fallback to Kill() on timeout (#2349) (@taigrr)
### Other stuff
* aa0997b31590d4ac61221f6d6f35eef2de50628f: chore: bump powernap to v0.1.2 (@aymanbagabas)
* 6d89de6320761c6eb8791cd7e87c3812a6ee5ce0: chore: update catwalk (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.47.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.47.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.47.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.46.2 — 2026-03-02

# Tiny patch

A very small patch to fix scroll not always following bottom when it should.

Our favorite contributor @huaiyuWangh also continues to deliver good patches, this time a small fix for an edge-case on LSPs integration.

Have a great week!
Charm ✨ 

## Changelog
### Fixed
* 4596b02f5617c29fd7e8a3768c49be71fd68098b: fix(lsp): treat adjacent ranges as non-overlapping per LSP spec (#2322) (@huaiyuWangh)
* 8762efc8fa0970883f807a5f564b5ef8b6042e4c: fix(ui): follow scroll when at bottom (#2336) (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.46.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.46.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.46.1 — 2026-02-27

# File tools performance fixed ✅ 

A few of you told us that some tools call like `view` and `edit` were sometimes taking a few seconds to complete, making your sessions slow to proceed. Well, that happened because Crush notifies LSP servers about the files you're viewing or touching, and waits for a response. Some LSPs are slow, and it things took some time to happen.

In this release we not only made a good number of fixes to file tools + LSPs, but we also added a 300ms timeout so if something got stuck Crush will proceed anyway.

The `find_references` also got fixes. It allows the model to query for your LSPs to find refences for a given type/function/etc.

Special thanks to our favorite contributors @huaiyuWangh and @taigrr to helping and testing these improvements! ✨ 

Enjoy your weekend!
Charm ™️ 

## Changelog
### Fixed
* 02ec5db4742886c1e81339c6fc18fa234a49c7c8: bugfix: find references, double timeout (@taigrr)
* 41a931ebc9b3a4a96f7ec799142569fc1022f47d: fix(mcp): restore handling for unsupported resources/list method (@meowgorithm)
* 6e5bbef78da317dcde97bec412542fcb5a37891e: fix: use typed context keys in tests to satisfy staticcheck (@huaiyuWangh)
### Other stuff
* ded666aa641e7b9cabb750fcb68441b9edff6a45: chore(lint): don't shadow err vars (@meowgorithm)
* 058322169d3c1b3e1ffad43da8bb7c00c94e706d: fix(tools/view): fix view paging, test for edge cases (@meowgorithm)
* 773efbf84f5bc426633cf7221621ce7af2120f3b: fix(tools/view): perform UTF-8 validity check only if read succeeds (@meowgorithm)
* 6604dd0e38440369e98c7462e977bc2e015f292a: perf(lsp): don't watch for changes when simply reading files (@meowgorithm)
* d98c854a148e5dce070c9d1d0a9b07749fbebaf5: perf(lsp): use shared timeout for parallel diagnostics collection (@meowgorithm)
* 12f0d9f512e01bde5d08d2c88e60fd0eb38eb891: perf(tools/view): avoid scanning entire file to count lines (@meowgorithm)
* 3c5fcff3855762e6d24cf19fd45d8d69253ee594: perf(tools/view): pause briefly for LSP diagnostics when viewing a file (@meowgorithm)
* e0d545486846749445745269aabb30c73bba628f: refactor: extract common sub-agent execution logic (@huaiyuWangh)
* 07d065d780610a4a37e516733da951888293bf4b: refactor: simplify context value retrieval using generics (@huaiyuWangh)
* 42aee6d2bde0d48d0d752629f5c3e9791c2f2a7c: refactor: use params struct for runSubAgent and add unit tests (@huaiyuWangh)
* d3682ac4719bd5892ceb21c15c66009c1e0b9b54: use new wg pattern (@taigrr)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.46.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.46.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.46.0 — 2026-02-26

# Small feats

Making your Thursday happier by bringing some small feats to Crush.

## More perf

Our favorite contributor @acmacalister (actually, every contributor is our favorite) made yet another perf optimization for big repos.

(We’re cooking more performance enhancements for the next release). 

## New model: Sonnet 4.6

This was recently released by Anthropic and it's already available in Crush (even if you use an old release).

<img width="500" alt="Screenshot 2026-02-26 at 17 26 19" src="https://github.com/user-attachments/assets/9d789749-76ae-4a9b-8581-aad37722aa05" />

## Anthropic reasoning levels

For Opus 4.6 and Sonnet 4.6, you'll now be able to choose a reasoning level. Before, this was just an on/off toggle.

This thinking level is "adaptive", which means the model will skip thinking for simple prompts to avoid consuming your tokens. The higher the reasoning level, the more likely it is the model will think.

<img width="500" alt="image" src="https://github.com/user-attachments/assets/5babf49c-99b9-462e-bf8c-ebcab698ad26" />

## New provider: MiniMax China

Crush has been supporting MiniMax for a while. We now also support the Chinese variant, which uses a different endpoint for Chinese users.

<img width="500" alt="Screenshot 2026-02-26 at 17 25 15" src="https://github.com/user-attachments/assets/02030c2b-4676-4a7a-9b96-95831e786599" />

Bye bye!
Charm ✨ 

## Changelog
### New!
* cd34bd6f2cb5f22214abb47e8f5741196c140ef0: feat: add minimax china provider (#2315) (@aisk)
* c6f854605cd8918932d823363a398c03f7595335: feat: add support for anthropic thinking effort (#2318) (@andreynering)
### Fixed
* 24f99f0d93aa9b71abb72ef8c89bc939cca71b78: fix(lsp): replace recursive fastwalk with filepath.Glob in root marker detection (#2316) (@acmacalister)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.46.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.46.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.46.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.45.1 — 2026-02-25

# Small patch

Small release with a few bug fixes to make Crush more stable for you. 💪 

We're working on some nice stuff to be released in the near future. Stay tuned!
Charm

## Changelog
### Fixed
* 4018154c7aacbc73aae07decd239b71c450b7ed9: fix(event): guard against panic (#2310) (@meowgorithm)
* 62b8c0b3def656ebbdb4f2e39e5ea4e97dfbd975: fix(lsp): fix multiple bugs in lsp client lifecycle and handlers (#2305) (@huaiyuWangh)
* 655ce65564a2813bae27d6be0a7562b6a28e60e4: fix(ui): truncate status messages that would otherwise wrap (#2306) (@meowgorithm)
* 643919d24d8e517faeaa81c57241303615db475a: fix: initialize lsp manager callback to prevent nil pointer panic (#2307) (@andreynering)
### Other stuff
* 3994293474aa5b5c60e6f79a82d00e4e68edebd5: chore(events): log when crush stats is called (@meowgorithm)
* c9fec16209f049eb1940eed03c0082817d914c24: chore: update catwalk (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.45.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.45.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.45.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.45.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.45.0 — 2026-02-24

# GPT 5.3 Codex + Gemini 3 thinking levels

On this release we're shipping a few model improvements + small fixes.

## GPT 5.3 Codex

This was just made available via API by OpenAI today, and it's already available in Crush. Just open the model picker and choose it.

<img width="680" height="162" alt="Screenshot 2026-02-24 at 18 02 52" src="https://github.com/user-attachments/assets/c0e20ae9-87c4-4473-a064-62095ff24d5a" />

## Gemini 3+ thinking levels

Gemini 3 and 3.1 not support thinking levels. Before we only had an on/off toggle for thinking, but now you can choose levels for Gemini:

<img width="468" height="239" alt="Screenshot 2026-02-24 at 17 04 15" src="https://github.com/user-attachments/assets/357c1daf-1ed2-45e1-b266-a417722bd165" />

## Other highlights

* This is for Rustaceans :crab:. Crush won't attempt to start the `rls` LSP automatically anymore. `rls` was deprecated in favor of `rust-analyzer`, which will still be used automatically used if installed.
* @0xarcher fixed an issue that made some MCP server failing to start.
* @huaiyuWangh made a great job fixing a good number of small bugs related in the agent.

## One more thing

Crush is now using the final v2 release of Charm libraries: [Lip Gloss](https://github.com/charmbracelet/lipgloss), [Bubble Tea](https://github.com/charmbracelet/bubbletea) and [Bubbles](https://github.com/charmbracelet/bubbles). These were literally released today! Want to read more? [Read our blog post about the release](https://charm.land/blog/v2/).

See ya!
Charm

## Changelog
### New!
* 841165eba07a62808453ba68348c7a097f0d2559: feat: add support or gemini 3+ thinking levels (@andreynering)
### Fixed
* 262c74ef8c0bd5528be3562657ed1641d50b8f90: fix(agent): fix minor bugs in coordinator and view tool (#2276) (@huaiyuWangh)
* dcc67b784556c01570fd7cb73020dc7fbd7a884e: fix(app): fix goroutine leak, shutdown context, and model matching (#2298) (@huaiyuWangh)
* dff955fcdb3e613eeb35e75c433a54891e5fe6e7: fix(mcp): gracefully handle Method not found for resources/list (#2239) (@0xarcher)
* 38c6632b2ddefad3060dd4ec920d7bf1c18d944b: fix: wrap correct error (#2296) (@andreynering)
### Other stuff
* eb12fbef1f489755ce9d452acdd904839b5f6081: chore: update `x/powernap` (#2295) (@andreynering)
* a439237bdb5785f16505fe76190136f4db49a12b: chore: update catwalk to v0.22.0 (@andreynering)
* 407ab1f6e2564c8110c9fdb9dd4034af87e4c25c: chore: update fantasy to v0.10.0 (@andreynering)
* c0462191b33bc25af6e096092cf57e812d2be129: chore: update lip gloss, bubble tea and bubbles to v2.0.0 (#2299) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.45.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.45.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.45.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.45.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.44.0 — 2026-02-22

# Smallish Rendering Things

You may have noticed we care about integrity in user interfaces a lot. That's what this small release is all about.

## Which skill?

Skills are awesome, but currently a little mysterious in Crush, and we found ourselves asking whether a skill was loaded or the LLM was just improvising. Now it's super clear when skills are read in courtesy a little bit of visual flourish.

<img width="637" height="369" alt="image" src="https://github.com/user-attachments/assets/f62c21c6-baa7-4341-81b2-28dc8559b8c9" />

## Size Calcs

We noticed some cases where a character or two would get clipped at certain widths, which was a little annoying. Now it's fixed.

That's it for v0.44.0. See ya later! ✌️


## Changelog
### New!
* c1d294d161dbee0d1bd5061c3270050c980b8d98: feat(ui): indicate when skills are loaded (@meowgorithm)
### Fixed
* 12a6372bee85e72b717aa407747395258ad40ee7: fix(ui): apply the message style to each line of the message items (@aymanbagabas)
* e3376ad117f8cfd267fa8a94221662b45e58d44a: fix(ui): fix cases where compact header and footer bleed off screen (#2279) (@meowgorithm)
### Other stuff
* d6312f4f3d2813fc0eac06b00ca3a4932cb5a15d: chore(styles): create specific styles for image loading indicators (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.44.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.44.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.44.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.44.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.43.4 — 2026-02-20

# Killin’ some bugs

We’re finishing the week by crushing some small bugs. Some highlights:

* Fixed a potential panic related to LSP configuration
* Fixed an authorization bug for MiniMax that was affecting a minority of the users
* IO.net API keys are now properly validated
* Fixed a bug related to thinking in the chosen small model
* Fixed a bug where Crush would struggle with certain disks on Windows

Have an incredible weekend ✨ 
Charm

## Changelog

* fix(lsp): prevent nil client from being stored in clients map by @acmacalister in https://github.com/charmbracelet/crush/pull/2262
* fix: use `Authorization` header for MiniMax by @taoeffect in https://github.com/charmbracelet/crush/pull/2269
* fix: proper validate io.net api keys by @andreynering in https://github.com/charmbracelet/crush/pull/2272
* fix(agent): pass correct model config to small provider builder by @0xarcher in https://github.com/charmbracelet/crush/pull/2236
* fix: more reliably detect windows drive by @andreynering in https://github.com/charmbracelet/crush/pull/2273

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.43.4/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.43.4/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.4/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.4/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).

## v0.43.2 — 2026-02-19

# A Quick Patch

This release fixes two regressions from the previous release:

* Cache work was reverted in favor of a new optimization, due to a bug on UI rendering.
* A potential panic was fixed.

See you in the next release,
Charm

## Changelog
### Fixed
* 72bb0866a4481e5dcb695e3d7149dcefe5185148: Revert "fix(ui): cache blurred and focused renderings separately for assistant messages (#2252)" (@aymanbagabas)
* 46ebd20b63d8e5265e14393821ce747e8ce44ff3: fix(ui): optimize assistant message rendering to improve performance (#2258) (@aymanbagabas)
* 9862d3a5552d3246eaff554cca83f2b4eee42ffd: fix: address `nil` pointer dereference panics on lsp client methods (#2256) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.43.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.43.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.43.1 — 2026-02-18

# Who loves perf?

Perhaps the more apt question, is, “Who _doesn’t_ love perf?” Presumably no one. Anyway, this release juices performance and fixes some regressions. Read on for more.

## Semaphores galores

A few releases ago, we added a mutex so Crush can wait for LSP servers to complete their diagnoses. That was cool, except it ate CPU like @caarlos0 in a steak house. In this release that doesn't happen anymore.

## Scrolling

The valiant @aymanbagabas worked in some caching to noticeably improve scrolling performance, specially on large sessions. Enjoy!

## Infinite loops now finite

The great thing about open source is that you can take matters into your own hands. That's exactly what contributor @huaiyuWangh did when he noticed LLMs going crazy and getting stuck in agent loops. Thanks to him, Crush will gently halt models spinning out of control. This was particularly common with local models and models with small context windows.

## RISC-V Bonus

We know you all secretly love RISC-V. Contributor @wallacegibbon has enabled image pasting on RISC-V, which honestly rocks. If you haven't used image pasting in Crush yet, pick a model with image support (like Kimi K2.5), copy an image to the clipboard and <kbd>ctrl+v</kbd>.

See you in the next release,
Charm 🍔

## Changelog
### Fixed
* 7ac4061b6c8af87e05edbf6bfaa94ded48315545: fix(lsp): properly remove clients from map on stop/kill (@andreynering)
* 2656a188bca1a241911b9145a75290d735b82b48: fix(ui): cache blurred and focused renderings separately for assistant messages (#2252) (@aymanbagabas)
* e471e75e7d732e2d88088f60d1abbe81aa0c897c: fix(ui): early exit AtBottom() when totalHeight exceeds viewport height (@aymanbagabas)
* 540deef219de0646cf531fd4874d09f7c01cffa1: fix(ui): toggle pills to follow scroll (#2218) (@aymanbagabas)
* af86738e0d6edfeb0ae7fb239b8bdabd4c162fca: fix: detect and stop tool call infinite loops (#2130) (#2214) (@huaiyuWangh)
* 7fe592d73c354ef85fe2a071998c40217b888760: fix: make reasoning effort dialog smaller (#2247) (@andreynering)
### Deps
* 44c7535a5ebf75fa57107c7b25348e1fda69b9d9: fix(deps): update `go-nativeclipboard` version to compile to RISC-V. (#2216) (@wallacegibbon)
### Other stuff
* ddf2fadb23b8e2d42a3f40c4eeb479b5cb6de651: chore: update fantasy with fix for json schema in openai (#2221) (@andreynering)
* df0dfbed15c573f69603262282901db8743c9142: ci(labeler): add minimax label (@andreynering)
* eecb1bfe22c36451003f65d1b30dac81e2e2ccaf: perf: remove mutex from lsp manager (@caarlos0)
* 699c8d79c3ac44fa676c00c674e5ed8787a0bfeb: refactor: simplify some code by using `cmp.Or` (#2253) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.43.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.43.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.43.0 — 2026-02-13

# Faster Crush on big repos

If you've been following our recent releases, you probably noticed we're frequently shipping performance improvements. We really want Crush to be light on CPU, memory and disk.

For this release, our talented contributor @acmacalister did an incredible job on profiling and addressing a few performance bottlenecks for projects with many files (the so-called monorepos). This greatly reduces both CPU usage and disk access for these big projects.

Enjoy!
The Charm™ Team :sparkles:

## Changelog
### New!
* 8ccb3c70918b2affbe0b0f96717e972313f2cd8f: feat(pills): add toggle todos/pills menu item (#2202) (@meowgorithm)
### Fixed
* eae61e16b238063ee1d8c4a03ce396e011dd8d0e: fix(ui): completions offset for attachments row (#2208) (@caarlos0)
* aa1ea496985d81e219a537271ca9ba993a3d0f0f: fix: add io.net api key validation fallback (@andreynering)
### Docs
* 27548b6424ec062185ebbe2a435ba8fdda698d9f: docs(readme): mention io.net provider (@andreynering)
### Other stuff
* db46f5e1c8d5fe3a76dc00eec215e94c6b954c4c: chore: auto-update files (@charmcli)
* 45663b77649a540f4ffcc2f24478475c99bfd944: chore: update catwalk to v0.19.0 (@andreynering)
* 976cca116c531a915e7ad301f6a7e4a728c8d62e: chore: upgrade lipgloss and colorprofile to fix windows terminal bash (@aymanbagabas)
* d7e225282c3d4b5a4a9d3ecea08240d439fa2d8b: perf: replace regex-based gitignore with glob-based matching (#2199) (@acmacalister)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.43.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.43.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.43.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.42.0 — 2026-02-11

# GLM 5 + general fixes

GLM 5 via z.AI is now available!

<img width="670" height="293" alt="Screenshot 2026-02-11 at 18 11 16" src="https://github.com/user-attachments/assets/4048399a-5521-487f-b27d-9d97471f4d7b" />

## Many small fixes

Several small adjustments were made as well. Some of them:

* We recently made an optimization to only start LSP servers when needed, but it caused some confusion for some users because they weren't being shown in the UI until started. We'll now show these servers in the UI as "unstarted".
* Fixed cursor misplacement when file attachments were added to the prompt.
* Addressed regression regarding the `disable_default_providers` setting. (This setting is for users only interested in using local models).
* Changed key binding to open and close TODO to <kbd>ctrl+t</kbd> because <kbd>ctrl+space</kbd> don't work on all terminal emulators.
* Fixed potential issue on running shell commands on Windows.
* Some visual adjustments were made to the dialogs.

## Changelog
### New!
* 5179b28efd13e48cb3419fede83958930a065682: feat(lsp): show user-configured LSPs in the UI (#2192) (@caarlos0)
### Fixed
* 47ca98d0e29b0da47a6084bb0eaef132e1608369: fix(config): correct Task agent ID in SetupAgents (#2101) (@AnyCPU)
* 5b2a0bf38e8dd67707e3d433e59de5740aedfc97: fix(grep): do not go outside cwd, add timeout (#2188) (@caarlos0)
* d6643a64aca64744d4156126835d8bbfccce2f73: fix(lsp): files outside cwd (#2180) (@caarlos0)
* d391ea85ed2f43d8e1290a2c64269c0782a6185a: fix(mcp): cancel context on MCP session close to prevent leak (#2157) (@AnyCPU)
* 48157c6c4eac6af31bda49697f0ef26b90d88df6: fix(sqlite): increase busy timeout (#2181) (@caarlos0)
* 9917b226e39863c3c053ea96ee64453cdfa9092c: fix(ui): adjust sessions dialog size (@aymanbagabas)
* f87d95b8522e5def84ce3dc749411dad1a7835a9: fix(ui): correctly position cursor when attachments are present (#2190) (@aymanbagabas)
* 155fc618b392eb0f9e49daeb8ad233c943e0349c: fix(ui): dialogs: loop around and scroll list when navigating with up/down keys (@aymanbagabas)
* 361a318e2240239b175f24584265a31befc8538f: fix(ui): ensure the min size accounts for the dialog border (@aymanbagabas)
* 4f3b056c91840b2be251ff58efa0ffb02bcff56f: fix(ui): truncate dialog titles with ellipsis (@aymanbagabas)
* baedc28232f80b434664c1a85f957c4848c1e84c: fix: address potential panic on shell command execution (#2200) (@andreynering)
* f791e5c4d9540c2faf65fb25158db9800c3b874c: fix: change binding to open/close todo list from `ctrl+space` to `ctrl+t` (#2201) (@andreynering)
* 22ed1e5d39ab871ae30219631c213dba6906556d: fix: clear regex cache on new session to prevent unbounded growth (#2161) (@AnyCPU)
* 0b618f40fb824abb8ddf5b9ea7d145150c4d501a: fix: ensure all providers are shown unless `disable_default_providers` is set (#2197) (@andreynering)
* d1032ba98b7e20300f1fa75b4e8e33d601ec19d4: fix: respect disable_default_providers (#2177) (@caarlos0)
### Docs
* 1f42acfb37e8f336cf6130f23c290638ab98dd48: docs(readme): mention subscriptions (#2184) (@andreynering)
* 5c29ad2fd5625c83f9d9c4cdedf8133961e119df: docs(ui): comment typo (@aymanbagabas)
* 8c9eb4718f0767549a13b895e61cd6b7882d7128: docs: update LICENSE copyright (@meowgorithm)
### Other stuff
* 8eb4dc0578b528901da779d6a34b986e9f6281cc: chore(taskfile): add `-v` to `go build` (@andreynering)
* 29800c488955f57c0fd52a9463b9ccf0b7473c4c: chore(taskfile): add `modernize` task (@andreynering)
* 9e4f8e0a6a0b7ba331a4b4451e902dfd8859b838: chore(taskfile): add `run:catwalk` task to run with local catwalk (@andreynering)
* d329ad5558c5ed967fda50ed4dd711ecc977601a: chore(taskfile): add `run:onboarding` to test onboarding flow (@andreynering)
* f962087445719a88cdf6371fc977ea30acecf615: chore(taskfile): avoid compiling when not needed (@andreynering)
* 8a6f25f945785322cfcbb78772a3819610861a59: chore(taskfile): run binary with extension on windows (@andreynering)
* 82b7aec40ebf2f434f4c95c1d21abfdbafafe6f1: chore: add `omitempty` back as `omitzero` (@andreynering)
* f22ec5fcad7b4905ffa2d1ea31be930911291cae: chore: auto-update files (@charmcli)
* 09cea778fc09a6dbee7dd4a3e8e5111b2ace0952: chore: auto-update files (@charmcli)
* 5e23ecdb4da522af4db2251b96d92e0c368389df: chore: run `modernize` (@andreynering)
* 7a83144f8629c26d2e45eb28ebfefe9710d91eef: chore: update `AGENTS.md`, mention `x/ansi` package (@andreynering)
* db0ce0bf185655597443be0f7539231c6b687bfe: chore: update fantasy (#2186) (@andreynering)
* 7f3d7c756d4bc289c45ccb23e2a8a9c1c2e21b0b: refactor: use csync.Map for regex caches (#2187) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.42.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.42.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.42.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.42.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.41.0 — 2026-02-09

# Let’s Edit our API Keys

At last: edit your API keys in the TUI. Open the models dialog (<kbd>ctrl+m</kbd>), choose a model and hit <kbd>ctrl+e</kbd>. That’s it. This works for oAuth providers too: <kbd>ctrl+e</kbd> will prompt you to re-auth via the OAuth2 flow.

This is another small but nice Quality of Life™ improvement. Before, you could only edit API keys by manually editing your `crush.json` config file. Voilà!

## Changelog
### New!
* 1615de50386d14d80b022a3677a6bbb475a80106: feat: add ability to re-authenticate / edit api key (#2179) (@andreynering)
### Fixed
* 340ce206c0248d1a226649b19e5e2c2adaab006f: fix(ui): fix help wrapping on dialogs (@andreynering)
### Other stuff
* 7d00857e4c549ddc067a30c16e97e580bb3c0d50: perf: track and start lsp on command (#2176) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.41.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.41.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.41.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.41.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.40.0 — 2026-02-09

# Optimized LSPs + MiniMax support

Good stuff is being shipped on this Monday, so you have a better joy using Crush on the rest of your week! 🌞 

## On-demand LSP start-up

@caarlos0 made a great work optimizing how LSP servers are handled on this release.

* An LSP server will now only be started once the model interact with a file of that language.
* Once you start a new session, the running servers will be shutdown until needed again.
* When you switch into a different session, only the relevant servers will be kept running.

All this ensure less CPU and memory are used by Crush, specially on new or small sessions.

## MiniMax support

[MiniMax](https://www.minimax.io/) is now officially supported as a provider, and this includes the [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan), which start at $10/month.

Enjoy!

## Changelog
### New!
* 02f66a2e8614a6c029260bea7d3ca1565786915a: feat(lsp): start LSPs on demand, improve auto-start (#2103) (@caarlos0)
* b66f96ea78b4cddc9aefc1c1e3094008419e3a0a: feat(mcp): resources support (#2123) (@caarlos0)
* fc9db0563b86da23e22a227bac2e801f0c82d5c9: feat: add clipboard image paste support (ctrl+v) (#2148) (@caarlos0)
### Fixed
* 775cf3ae2609aa95ad1963a68b4a960c331371e1: fix(mcp): race condition, logs (#2145) (@caarlos0)
* c3d4ece8b5f889a0905a63d816554727908a6081: fix(ui): `highlighter` now modifies the cell directly. (#2171) (@biisal)
* fb9eb927de330fb1e23772daefdee871710a4829: fix(ui): clear image cache when FilePicker closes to prevent unbounded memory growth (#2158) (@AnyCPU)
* 722093b9398fb3f5ce00888ad02c5e0bf0619e78: fix(ui): prevent nil pointer in completions size update (#2162) (@kslamph)
* 3a9d95d82ebebd7605c7f377e1376c7d34540ff5: fix(ui): use plain letters for lsp status (#2121) (@caarlos0)
* dc890f399504b6158a8d6b70edc449b7cb646a8a: fix: build linux/386 (#2153) (@caarlos0)
* 989b0d28cefcd82f1575087d4b9ed8be9b742df0: fix: cap posthog shutdown timeout (#2138) (@meowgorithm)
* 63e009898a0fc6f2f1aa29a2f375ab4ebd579061: fix: improving shutdown (#2175) (@caarlos0)
* 54a6978534ced00f11e5ced64205ddee32af8320: fix: make it possible to add api key for minimax (@andreynering)
* 3b3a3d78c8a329ab9274fe95b47deada3f8a133c: fix: prevent goroutine orphaning in mcp.Close() and shell.KillAll() (#2159) (@AnyCPU)
* e9b59c4b8cd7c6613cd48e533dd6b319c6bd7c69: fix: thinking sidebar (#2151) (@caarlos0)
### Docs
* e54c5ae7a1c5c9dbce4582ec8fca2dbe4d437269: docs(readme): add mention to minimax (@andreynering)
### Other stuff
* ff212d6a0f09013a2b93af04b394317b6833ccd1: chore: auto-update files (@charmcli)
* 04d05e158480513828a2c2538853432a92f2a630: chore: bump bubbletea and ultraviolet dependencies (@aymanbagabas)
* afb5be912ec2f98493fa7bbef41de3f4b53d9749: chore: update `charm.land/catwalk` with minimax support (@andreynering)
* 74aff5d4a19f390532b9739c99099443623b6c5d: chore: update fantasy to v0.7.1 (#2139) (@andreynering)
* 0491b670e4eefde474876dbb7b699ed2d8b9e318: perf: timer leak in setupSubscriber (#2147) (@caarlos0)
* 074917b7418c3541458963b3c720fa1546745690: refactor(lsp): use same handle file in client and manager (#2168) (@caarlos0)
* 59887a301733b1ba9cd1949cec1ac05d321e53a9: refactor: cleanup the code a bit (@andreynering)
* f285804b6c5c45d0a37fad2e2edb0e56fe8aa034: refactor: remove empty slice declarations (#2150) (@andreynering)
* 2c9670a890c216626e5f9212fe9cf7099525b2da: refactor: remove global config (#2132) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.40.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.40.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.40.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.40.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.39.3 — 2026-02-05

# Tiny UI Fix

Tiny fix for an apparently empty message being selected in the UI.

<details><summary>Screenshot</summary>
<p>

<img width="1896" height="874" alt="Image" src="https://github.com/user-attachments/assets/938cd4a7-eddd-48a6-b96e-743dc20b7d36" />

</p>
</details> 

## Changelog
### Fixed
* f22a6f986a32e94bdd46672557bccf8544575859: fix(ui): list: ensure the offset line does not go negative when scrolling up (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.39.3/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.39.3/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.3/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.3/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.39.2 — 2026-02-05

# Quick Windows fix

Pasting text on Windows :window: is working again.

Thank you for all the support.
The Charm Team ™️ 

## Changelog
### Fixed
* afed74cbee977bc05541bc9106dbe2f698dcd987: fix(ui): api key dialog typo (#2131) (@nickgrim)
* b28f4ced49e4ce5c76446a9ee3e3fcd90adac744: fix(ui): completions popup gets too narrow on single item (#2125) (@caarlos0)
* 2d0a0e2764686ccb503f91215a22c911fada30c0: fix(ui): fix bug preventing pasting text on windows (#2126) (@andreynering)
* 142c854e52e50d48dd37497b6aad09bc222cba51: fix: change hyper url (#2120) (@caarlos0)
* 8adfe70c4454363bc839ca405657de91da01998b: fix: hyper provider cancel (#2133) (@kujtimiihoxha)
* d29d0e21216eb5bb68bce18134e1fba8d2d7d362: fix: realtime session file changes (#2134) (@kujtimiihoxha)
### Other stuff
* 874c1ca0e8bf89533ce1fafcbe7c1dd37187e30b: chore: update ui/agents.md (#2122) (@caarlos0)
* 9013bb012202eae93a936273782014f5c6ae35d2: refactor: remove old tui (#2008) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.39.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.39.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.39.1 — 2026-02-04

# A mini UI patch

Oh hi. This is a mini patch release to address fixes various to UI bugs. 🍔

xoxo,
Charm ⚡️

## Changelog
### Fixed
* f53402d57eac0590d009611cf892c8957eab15e7: fix(ui): context percentage updates (#2115) (@aymanbagabas)
* 112fea822b66cbac3d295a3a2f86d8ac9e534060: fix(ui): cursor mispositioned when pasting large blocks of text in textarea (#2113) (@aymanbagabas)
* 3bda767c6700db1ead64af01471b3e7b868a569f: fix(ui): ensure we anchor the chat view to the bottom when toggling (#2117) (@aymanbagabas)
* 15a729cbddc6aa087d4a8189829253924d5019f2: fix(ui): only scroll to selected item if item collapsed (@aymanbagabas)
* fd35a87b4c1621b3b1338fd95930756f7990a4eb: fix(ui): padding in the view (#2107) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.39.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.39.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.39.0 — 2026-02-03

# Hello, UI rewrite

Hi! Today we're releasing a complete rewrite of the UI portion of the codebase.  We vastly simplified and flattened the UI code, putting into practice our current thinking on how complex [Bubble Tea](https://github.com/charmbracelet/bubbletea) applications should be architected. ✨

This means you get:

* Considerable performance improvements and a snappier UI
* A much better experience in long sessions
* The ability to contribute to the codebase easier than ever

What’s that you say? “Handsome Charm team, I need features?” Well, allow us to tell you more.

## History navigation, freakin’ finally

Yeah! Now you can press <kbd>up</kbd> and <kbd>down</kbd> to cycle through past prompts, just like in Bash, VSCode, and lots of other tools. Enjoy!

<p><img width="600" src="https://github.com/user-attachments/assets/863f8b55-a267-4135-bb05-580d3f1dfc34" /></p>

## Better session management

<p><img width="600" src="https://github.com/user-attachments/assets/0b0477c1-9cf2-4632-8f55-54e944adce59" /></p>

Sessions are great, but let’s face it: sometimes you want to wipe one of them off the face of the Earth. Other times you want to rename them because the LLM just didn't quite get the title right. Now you can.

In the session dialog:

* Rename sessions with <kbd>ctrl+r</kbd>
* Delete sessions with <kbd>ctrl+x</kbd>

## Expand and contract

That’s what my stomach does through out the day. It's also what you can now do with items in the chat.

* You can now click on code, diffs and thinking blocks to expand/collapse.
* The sessions dialog will now show the last updated time of each session.

## Other good stuff

* Better compatibility when dragging and dropping files into the chat
* Improved selecting and copying text from the chat
* You'll now see exactly what provider you're using in the sidebar, panel, and in message footers

Let us know what you think in [Slack](https://charm.land/discord) and [Discord](https://charm.land/discord) and keep an eye open for more enhancements coming soon.

Keep crushing it!
Charm :cupid:

## Changelog
### New!
* d0ed2c508fedb1c67ea4bae1438729f15cdcd8c2: feat(ui): transparent mode (#2087) (@caarlos0)
* ea8c39f4cf3baf8f816f82c4a6bdb796a8b3750c: feat: add configurable timeout for LSP initialization (#2075) (@huaiyuWangh)
* bf1c65ebfc5f2cf09967fec0281dc96aeacef2e0: feat: release new ui refactor (#2105) (@andreynering)
### Fixed
* 0979bd3e2646765dbe4cdd01ca09a8ccb2fa4837: fix(styles): increase text contrast in active session deletion item (@meowgorithm)
* e6a4896481f0b979d3dff7be2449ddb7fc012b3a: fix(ui): ensure `%d Queued` text is visible (#2096) (@andreynering)
* 56769bb10c336332d0f950218da7e6c3b9bf967b: fix(ui): fix permissions dialog rendering on small windows (#2093) (@andreynering)
* 0cbaacdbf0d60dab9d3f2cbc94f062663a50ea8a: fix(ui): scroll to expanded item (#2088) (@aymanbagabas)
* 3c8be6926cda50f4129e358bf78af65e7b315d32: fix: fix pasting files on some terminal emulators (#2106) (@andreynering)
### Other stuff
* d4b9b356f60a9a26fbc22c432b10d8ed9edfddd3: chore(style): add specific style for session rename placeholder (@meowgorithm)
* 7c5d6ca4c52359ddf4883f99764c7d131d268351: chore(styles): make rename style definitions match UI language (@meowgorithm)
* 02ec6827295e060b6781f1ed3274dbf82e84ef47: chore: auto-update files (@charmcli)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.39.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.39.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.39.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.38.1 — 2026-02-02

## Whoops

This release fixes a regression in previous release that could cause a crash on startup. Not anymore!

(Editors note: @andreynering ftw.)

## Changelog
### Fixed
* b7e07a59275cb0e03e80813c44bd8eccb21de67c: fix: address potential panic on initialization (#2092) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.38.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.38.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.38.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.38.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.38.0 — 2026-02-02

# Fixes for LSPs, tools behind proxies and more

This releases includes fixes for LSPs, in particular to make auto-discovery way more reliable.

Crush will now also respect your HTTP proxy configuration fro your operating system, ensuring the tools that need internet access will properly work behind proxies.

Vercel is now a proper provider under the hood, instead being considered just an OpenAI provider. This improves support for Vercel's many available models.

Enjoy your week!
The Charm Team :tm:

## Changelog
### New!
* 00bbf45427e278fc8e19e4b6fb4dd03af535ddd5: feat: add support for vercel provider (#2090) (@kujtimiihoxha)
### Fixed
* 46068b8fbe8f1b2506a633cfb8e34965ad522e65: fix(lsp): improve auto discovery (#2086) (@caarlos0)
* 4a03cbaf3cf5e96cb5f6ac849817de025558e642: fix(lsp): improve lsp tools (#2089) (@caarlos0)
* 514318dbcae86487260f18ecd4c403d8c5f4d44a: fix(ui): show auto-discovered LSPs (#2077) (@jamestrew)
* 7119b7e6981ceff5764bd3903ac8cb995a65759c: fix(ui): update layout and size after session switch (@aymanbagabas)
* 47f5f429313ad1ab8694daa22611272df3397ce8: fix: ensure all tools work when behind a http proxy (#2065) (@bittoby)
* 552fa171bc6c0ed03b0121d6e98adb11697e8479: fix: ensure the commands and models dialogs render with borders (#2068) (@andreynering)
### Other stuff
* 66556b5679cf28aada4f4d09abde7fd462ef9839: chore: handle hyper config correctly (#2027) (@kujtimiihoxha)
* 25f05a6a84f8ee43a675d2d4154d30d18687bb31: refactor(chat): handle double click & triple click (#1959) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.38.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.38.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.38.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.38.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.37.0 — 2026-01-30

# LSP Auto-Discovery and More

Hi! We've been cranking. How about you? This release adds some bugfixes nice quality-of-life features, and Copilot improvements. More below.

## Auto-LSP

LSPs in Crush are awesome. What is less awesome is setting them up. Now, with Crush v0.37.0, you don't have to. Crush will auto-detect LSPs and set 'em up as needed. So go on, install that `haskell-language-server` you've been meaning to, fire up Crush, and get knee-deep in monads.

## More Copilot Models

We made all Copilot models available on Crush, which means you'll a few more models available now, particularly Gemini 3 Pro (Preview) and Gemini 3 Flash (Preview).

## New UI? What new UI?

We're continuing to iterate, test, and add features the new UI which we're pretending is a secret. Wanna try it? Set `CRUSH_NEW_UI=1` in your environment.

Enjoy your weekend!
Charm 💘

## Changelog

### New!
* c81b02f440a1c442fe731122f5b2150547ab8fd3: feat(lsp): auto-discover LSPs (#1834) (@caarlos0)
* fea878e4d4c315f91c190d589891eddbeb8f7ac4: feat(mcp): support server side instructions (#2015) (@caarlos0)
* c0a8c7e8219b39d47ab6400438b61ff2dd357164: feat: allow to disable indeterminate progress bar (#2048) (@caarlos0)
* 3a929ffcff89aba677c2fb7620e93870f1c47f5b: feat: filetracker per session (#2033) (@caarlos0)
* 033584c7d0c88834011697d13361d13810a86d46: feat: implement prompt history (#2005) (@kujtimiihoxha)
* aa2cacd24af953a858dfb17f84ef37ff1db74ff3: feat: open commands dialog on pressing `/` (#2034) (@andreynering)

### Fixed
* df2c001c27c3e46b11dbbc57e4bdf7d5215ad7f4: fix(lsp): scope client to working directory (#1792) (@Amolith)
* 216f904749612ce82fe078ddbe4b03c73f823144: fix(posthog): check correct error; prevent panic (#2036) (@meowgorithm)
* daf786fe3df633bf146b5a3246866c173e9d8370: fix(stats): resizing breaks pie charts (#2030) (@caarlos0)
* 230b99c7bd158dee449848fa4a671cfb0c58edbd: fix(ui): arrow navigation wasnt working when todo view is open (#2052) (@caarlos0)
* 5e384b2e8f7ba72395581d164c18e232152e1023: fix(ui): ensure the message list does not scroll beyond the last item (#1993) (@aymanbagabas)
* aae4c3082281f9233484609f73169e60257da73c: fix(ui): fix selection of code blocks with tabs inside markdown (#2039) (@andreynering)
* e57687f170b9744abfcc7dc83ccca0e0d4272116: fix(ui): fix wrong color on selected item info on dialogs (#2041) (@andreynering)
* 6c26f2a97cca5562159c532977147caa7c9deca4: fix(ui): switch focus on click (#2055) (@andreynering)
* ac03cb02b28265074bbd001291b793633f822395: fix(ui): typo in ListItemStyles type name (@meowgorithm)
* 115adebe89e0166c2a15f323bb901a5f5151d208: fix(ui): use setState method to change UI state and focus (#1994) (@aymanbagabas)
* 02bb76b4098479a3efe3326d550163afba52a924: fix: allow HYPER_URL with embedded provider (#2031) (@caarlos0)
* de64b00392249ff77ab1a178234ab4e223f11fa6: fix: decouple thinking/reasoning from provider type (#2032) (@caarlos0)
* b51c2e02e52ea23e4b5284b97dbfbc22510dca53: fix: do not scroll to bottom if user has scrolled up (#2049) (@andreynering)
* 3a2a045c3edb8e53b36cb71951f91213e4c3fb5c: fix: improve logs, standardize capitalized (#2047) (@caarlos0)
* 8d3064ffe778438dae209f3520d6449e2ec60bdf: fix: layout calculations when editor has attachments (#2012) (@kujtimiihoxha)
* 699ae40fd953bf671e740fbc16a1b841fa566ac3: fix: make the check for sidebar toggle inclusive (#2013) (@kujtimiihoxha)
* 87fad188fca6f37acea2bc6e6dcdab7ccf8e606d: fix: make the commands dialog less taller (#2035) (@andreynering)
* 7ace8d58f38e755d2d844b983aab5cff1e64ae4e: fix: panic when matching titles in session dialogue (@meowgorithm)
* c3ae2306d5d8163d428685a13e71f08212f7e9e6: fix: respect disabled indeterminate progress bar setting on app start (#2054) (@meowgorithm)
* 99aabb0179cb65f46166b4add30156360afb0ba9: fix: schema incorrectly marks optional fields as required (#1996) (@huaiyuWangh)
* 4228f7506d72a0a381c011539de17635f578f7d7: fix: slice string at the grapheme level, not byte level (@meowgorithm)
* 632666e5f926f74423bc4c2af39ed713f2327bce: fix: typo on `crush stats` html page (@andreynering)

### Docs
* 5011ba264a8b2c854d0f72d1364bb2a78f89e01e: docs: improve clarity and fluency of mandarin tagline (#2022) (@oug-t)

### Other stuff
* c5f0e4da2baa31e865effd3da90abf7a222bb98f: Handle unknown tool calls in the TUI (#2001) (@kujtimiihoxha)
* 857cc282d54af48d2b85b4e485c3b0829e9272b2: perf(ui): string efficiency (@meowgorithm)
* 87c2165cd5cd5afa897d4e2c4a95ff590c785ef4: chore: `chmod +x scripts/check_log_capitalization.sh` (@andreynering)
* 50ae9f26e0d3f83fd76b0cf50b7a38925abf7548: chore: auto-update files (@charmcli)
* 40869ecb5974d716d0f61316aae25f80eda43ab2: chore: auto-update files (@charmcli)
* 1696e72e92298d205e74384de36f94143ecabc38: chore: update catwalk and its import paths to `charm.land/catwalk` (@andreynering)
* c6b0a8a13ec47ebddcbc2b6ab14d2006cc1d4acd: refactor: terminal capability handling (#2014) (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.37.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.37.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.37.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.37.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.36.0 — 2026-01-27

# Say hi to `crush stats` :wave:

Just try it! Run `crush stats` and you'll see a beautiful dashboard with statistics of your Crush usage for the current project. ✨ 

<details><summary>Spoiler Screenshot</summary>
<p>

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/cf181531-202a-4f36-8757-bf173e97681e" />


</p>
</details> 

## Summarized sessions: fixed

We also fixed a bug affecting sessions sometimes not being summarized automatically when they should (when they become big enough). This should keep Crush working as designed for long sessions.

## Secret-not-so-secret refactor

Finally, we're doing lot's of progress on the UI refactor, accessible via `CRUSH_NEW_UI=1`. This refactor is focused on performance, and should become the default soon! In the meantime, we suggest you to try and give us any feedback.

Have a great week!

## Changelog
### New!
* b94495230b21203935ad3b043fcaa789dd49d7d7: feat: add ability to drag & drop multiple file at once + support windows (#1992) (@andreynering)
* 0eee0616609b2c890ccc69f6a4ab3aba0b8a8630: feat: crush stats (#1920) (@caarlos0)
* abbee92df2ec996ee3c86eecc4c32859de149532: feat: delete sessions (#1963) (@kujtimiihoxha)
* 7154e46becc542a08a56d6149de754fc5873a7c1: feat: update session title (#1988) (@kujtimiihoxha)
### Fixed
* dd3834ab37670dd8be2be0805d2b3d47780d20ec: fix(agent): read step data for summarization check (#1787) (@Amolith)
* 9faa8b227fc13c741ea89751024765bd8a2437a1: fix: enable left/right scrolling of diff (#1984) (@kujtimiihoxha)
* 9622c2591282b8377d7ab0821cff1cac4799c9f0: fix: should also copy on `y` (additionally to `c`) (#1989) (@andreynering)
* f7914468a9e05dd1ce3a7d8b8bd674b401817969: fix: stats chart don't account for cached tokens (@caarlos0)
* 5ddf9d1068cc01d2cea20500cecd6fabf9370fb4: fix: token calculation (#2004) (@kujtimiihoxha)
### Docs
* 3193895cad9eb15d49a72c21de9e7aa7ed92ac2e: docs(readme): add SYNTHETIC_API_KEY (#1971) (@billycao)
* 8e7a331c03a359c491eb93df354cb28da4293afb: docs(readme): add Z.ai API key info (@meowgorithm)
### Other stuff
* 38ec868b94763e4837042b14d66e116d487dfae8: chore: bump glamour to v2.0.0-20260123212943-6014aa153a9b (@aymanbagabas)
* 668adccfcae951f5523b33c91f03a6d4a4ca1650: ci(goreleaser): fix aur_sorces build to properly set the version (#1978) (@gdamjan)
* 99a896d10897177e7c67e7861ceb8dd47248a769: refactor: use `ContainsAnyOf` from `x` (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.36.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.36.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.36.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.36.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.35.0 — 2026-01-23

# Vercel AI Gateway and secret UI stuff

This release adds support for Vercel's fancy AI Gateway as well as a boatload of improvements to the secret-not-secret UI refactor that we've cleverly hidden behind a flag. Details below.

## Hello Vercel AI Gateway

If you're one of those so-called “production-grade AI” people then you might like to know that Crush now supports the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). Just pop in your API key (pro tip: use your boss’s key), choose your fave model, mash out a prompt and LET IT RIP.

<img width="650" src="https://github.com/user-attachments/assets/ae5ee47d-a014-40f9-bbce-202802c54eda" />

## Shhhhh

We're refactoring the UI for speed and code simplicity. It's not totally finished yet but, if you dare, set `CRUSH_NEW_UI=1` to try it out. Feedback welcome!

## You probably already know this but…

…you rock. Thanks for all the Crush love. Your feedback for us is like ambrosia for Zeus.

Enjoy your weekend! 💖

## Changelog
### New!
* 88d10d13367eb0722898196b78a422cf98b6c21e: feat(ui): add keybinding to copy chat message content to clipboard (#1947) (@aymanbagabas)
* 28e0ff355198c3858f45fe87fea3d389f9a47b8e: feat: implement onboarding flow on the new ui codebase (@andreynering)
* 0d4cbf82ab6e3b93696e01d075357c2c3331ddfa: feat: lsp_restart (#1930) (@caarlos0)
### Fixed
* 44e1ca7c4a0c7d008b79a34521360a1d11d16883: fix(dialogs): prevent panic due to negative index (@andreynering)
* 1073723a7e7d2f5c16ec7fd15b05974fc7293bf2: fix(list): prevent panic due to negative index (@andreynering)
* 676c0382db253bc417e2380c72b7d499b6942b8c: fix(ui): models: ensure select loop breaks correctly and scroll to top on filter (@aymanbagabas)
* b50d5799ac5642af2ce58c72922685e319768caf: fix(ui): only copy chat highlight when we have highlighted content (@aymanbagabas)
* 8a37a3405a2461305b8300ba5deceb9bb2c753c8: fix(ui): prevent AAAA probe bleed in terminals without Kitty graphics support (#1967) (@AnyCPU)
* 505283a22e75b2e6420ae90777527f23c834347a: fix(ui): rework cursor can appear out of place on multi-line (#1948) (@aymanbagabas)
* 1fad83be4a3fb73b18047e00a68af5e3b29e3322: fix: add back suspend (@kujtimiihoxha)
* 9604c92efbc0f6a97ac3dbcdc85fb7abf8967e99: fix: commands height (#1954) (@kujtimiihoxha)
* fb3eeb010283210d3a60e3ed17e84b8dcd27821c: fix: completions width (#1956) (@kujtimiihoxha)
* 1e691e0c49c343e0df46bc332f5d973b4cd85b7f: fix: ensure hyper is the first provider in the list (@andreynering)
* 698b7c8049bd0bb75fccc47c11d472cb500b16ba: fix: handle new session when focused on the list (@kujtimiihoxha)
* f002e6f855752dfa7fc197edbfaa84213771e675: fix: lsp sort (@kujtimiihoxha)
* 4cf6af059742f4ed8ba58e1e24ca15bfb0f8aea5: fix: make sure we have a fresh model/tools on each call (@kujtimiihoxha)
* 6ba301e6e1214eb8f8f5fcf2d51af0781d8ef7be: fix: new/update message behavior (#1958) (@kujtimiihoxha)
* 945006a58431cebc294c7ee567ba6868f21735b0: fix: permission notification (#1955) (@kujtimiihoxha)
* 138275336dd7523e73a3d576d053e0491bce7760: fix: route mouse events to the dialog if its showing (#1953) (@kujtimiihoxha)
* 891b5353207386f5b3753380dbb41105d2f132bf: fix: tab to chat only when in chat (@kujtimiihoxha)
### Docs
* da6f51e388663f93ad6e7fdcc14ee0ac04997681: docs: add vercel ai gateway to readme (#1951) (@jerilynzheng)
### Other stuff
* 1b61cd2b80d2aebe3f7ced80d944639a1ead6345: chore: change the dialog sizes a bit (@kujtimiihoxha)
* e753d09af1e9279302388f7d4a15a7e7135b4396: chore: do not scroll sessions if not neccessary (@kujtimiihoxha)
* 8ebe91437c994ec0f88c005497b26feaad3e58c8: refactor(ui): add references tool (#1940) (@kujtimiihoxha)
* 4e66b9c985cfa478dd7d75dcc8eb9bf65077f7d1: refactor(ui): enable initialize (@kujtimiihoxha)
* 5454a2ed119bd5baad60853665c7315aa97255b5: refactor: rename `uiConfigure` to `uiOnboarding` (@andreynering)
* 49a41de935eb6ae77eff4a9f3295055eec51c162: refactor: use different ansi image library (#1964) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.35.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.35.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.35.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.35.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.34.0 — 2026-01-21

# Non-interactive improvements + more!

How's it going? We've been busy! The main focus of this release is `crush run`, aka non-interactive mode, but there are some other gems here as well. For more, read on.

## Now with more non-interactivity

Crush is really powerful in scripts, CI/CD, and so on, and we're seeing more and more headless Crush usage. On that note, this release adds some improvements to non-interactive mode.

You can can now specify a model with the `--model` flag, which allows you to specify a model and provider via a `{model}` or `{provider}/{model}` format. For example:

```bash
# Model arguments are case sensitive
crush run --model "glm-4.7"                              # Find the first available configured instance of GLM-4.7
crush run --model "openai/gpt-5.2-codex"                 # Use GPT-5.2-Codex at OpenAI
crush run --model "synthetic/hf:MiniMaxAI/MiniMax-M2.1"  # Multiple slashes are totally fine
```

Wondering what models are available? Check out `crush models`. Works great with `grep`, too.

<p><img width="550" alt="Crush Models" src="https://github.com/user-attachments/assets/a56efd18-39cf-49ea-ad7e-b9213540711d" /></p>

## Better edits and QoL

Not less important, this release include some [bug](https://github.com/charmbracelet/crush/pull/1921) [fixes](https://github.com/charmbracelet/crush/pull/1915) for the edit tool. Also, the [terminal tab title will be set automatically](https://github.com/charmbracelet/crush/pull/1886) as a small QoL improvement brough by our contributor @mhpenta.

## Why are there so many commits?

You… might also have noticed there are a boatload of commits in this release. We're overhauling the UI internals to greatly reduce code complexity and improve performance. To try the new version, set `CRUSH_NEW_UI=1`, and let us know if you have any feedback, bearing in mind that the new UI is still a work in progress.

See ya!
Charm 💘

## Changelog
### New!
* 4316ef3c2f6b14d242e04d569d99d4fcea829ce8: feat(chat): expandable thinking for assistant (@kujtimiihoxha)
* 27fa971aff9352dc74acf834d2a5ca87800d4f8b: feat(ui): add basic dialog and new UI structure (@aymanbagabas)
* 7d9976252d289b3331376ff1e0aa3d597736d708: feat(ui): add chat and editor models with keybindings (@aymanbagabas)
* 82bc601d267ea1e9b8b1fb2d966a2a965aa52782: feat(ui): add common utils and refactor chat message items and tools (@aymanbagabas)
* 470e6f6de7b40957e080a17f25b879c4296eb329: feat(ui): add initial sidebar component with logo (@aymanbagabas)
* afb546733555e78a5970c544062e72e9c4f4360b: feat(ui): add mouse click handling to lazy list items (@aymanbagabas)
* b71baee343d715660693d430fa5ff420b6f9cfab: feat(ui): add optimized list component with focus navigation (@aymanbagabas)
* 9c001302115b716d9a00c787f9b61be3668d35a4: feat(ui): add text highlighting support to lazylist (@aymanbagabas)
* ca3e06a43cd8bd111952f174b27e945cc6a9e3d3: feat(ui): chat: add navigation and keybindings (@aymanbagabas)
* a5c597bdc26d27025046daaa19b8eecb1d558fc6: feat(ui): copy chat highlighted content to clipboard (@aymanbagabas)
* 5d2c533d9c2cea817506d8a8618c0859b469174b: feat(ui): dialog: add file picker dialog with image preview (@aymanbagabas)
* 517a3613c12513d91d93b59c56aae5204c12b4e6: feat(ui): dialog: wrap navigation from last to first and vice versa (@aymanbagabas)
* 77ecb3924f3378c6a494984ba190a48f99a44a56: feat(ui): filepicker: add image attachment support with preview (@aymanbagabas)
* d4ffb554cd6aaded7fd280d5b3f6aa793cba58a1: feat(ui): filepicker: support kitty graphics in tmux (@aymanbagabas)
* 8ded0befafd9b876220159a753de464a19f6982d: feat(ui): filepicker: support kitty graphics in tmux (#1884) (@aymanbagabas)
* 22040d2c844aaf87b3eae9817447dca2867d60bb: feat(ui): implement tea.Layer Draw for UI model (@aymanbagabas)
* 063398841cb5bcca61d7a6b7d6a08cd8146b26be: feat(ui): initial chat ui implementation (@aymanbagabas)
* cd88520924a23f2258ec25302a7916760335c12d: feat(ui): initial lazy-loaded list implementation (@aymanbagabas)
* 8d7e64fef8dbfdf31aa5bfa8831d7f1b114457e2: feat(ui): invalidate rendered items on focus/blur (@aymanbagabas)
* c0be798cb5dfda1408a87f3a90bf8294aca6601a: feat(ui): list: expose filterable items source type and return values for selection methods (@aymanbagabas)
* 90491b4b8ae5be3605cd92d77418edfd5aa4f3e1: feat(ui): model dialog: implement model selection handling (@aymanbagabas)
* 26145a76b5f82158dc0d3ab7a4a513aed3a8b7e1: feat(ui): model selection dialog (@aymanbagabas)
* f5415908291cbb713943aa5f42b3f9e54a5cfa1c: feat(ui): models dialog: filter by provider and model name (@aymanbagabas)
* c280dd546834d6f54c74ea0484c49fc0c5920caf: feat(ui): models dialog: improve group filtering by ignoring spaces (@aymanbagabas)
* 819c33d24e6753836ddfe137596842316f17bc4f: feat(ui): new session selector dialog (@aymanbagabas)
* 953d181984a5daf537bba6a7c713c343e2e55d6a: feat(ui): optimize ScrollToBottom in lazylist (@aymanbagabas)
* 8783795bcbeedfafd2b58b566a5589d8d6bb8f6f: feat(ui): restructure UI package into subpackages (@aymanbagabas)
* b93a3347acf294d59c338c8bad52d28ca9bce5ba: feat(ui): show working directory in window title (@aymanbagabas)
* d9e67367226436d629078fe392e38bc2d61aefeb: feat(ui): simplify editor and embed into main UI model (@aymanbagabas)
* 17e66163283638c8de1bf73557e9c0766b38062d: feat(ui): status: add status bar with info messages and help toggle (@aymanbagabas)
* 742b4d3543ed4977e2e9c578bac36cc6bcad509e: feat(ui): use the new UI behind a feature flag (@aymanbagabas)
* 3f7de0eaaddd6ada99972a8c84ea74649c6fdb61: feat(ui): wip: add commands dialog to show available commands (@aymanbagabas)
* cd81f945f2a19d0af08c6d9b6db646da3781f19b: feat(ui): wip: basic chat message sending (@aymanbagabas)
* 030c8fc58ea90cdf796827a8eb69b1e9f02cb5c6: feat: allow to send the prompt if its empty but has text attachments (#1809) (@caarlos0)
* b66db250ad9915f6957c79cd8a35c105e0812017: feat: attachments (#1797) (@caarlos0)
* 23e0b06d0054203cf4deb033b18e48037ed99e5d: feat: completions menu (#1781) (@caarlos0)
* 366942352a14d6361e40ef44a470bb051548fa78: feat: crush run --model, and crush models (#1889) (@caarlos0)
* dcd664a4a19a9920fb30048962ba7f0f64839bf9: feat: implement api key input dialog on new ui codebase (#1836) (@andreynering)
* f2f44540f58e3cca3602f11d5bd7c002e3ff3109: feat: implement github copilot oauth flow in the new ui codebase (@andreynering)
* c45b1521640ccc513507ae0815609e7c031941d0: feat: implement hyper oauth flow in the new ui codebase (@andreynering)
* f48a3edc33ca62dd9d6ff5f6a226f12f659ce57a: feat: implement text highlighting in list items (#1536) (@aymanbagabas)
* 4086e2f007ac54f1785535546f0fc0bae47afada: feat: increase paste lines as attachment threshold (#1936) (@caarlos0)
* 7c99274dd8a8cbbd0afadbadfc0ae550854a9c23: feat: open editor in the right position (#1803) (@caarlos0)
* 1e83e6657d52c1a7746a6b9425861de1cf83ff28: feat: paste as file (#1800) (@caarlos0)
### Fixed
* 03beedc2002cb9f909568ec3c32775fca0faf023: fix(chat): do not mark tools with results as canceled (@kujtimiihoxha)
* ff9cbf656f77745a147b285ea1a6311ca1533210: fix(chat): only spin when there is no and no tool calls (@kujtimiihoxha)
* b6185b1d9e8f0c58531c3567750d43f20274489b: fix(chat): race condition (@kujtimiihoxha)
* d5f0987bd52d458f86cdfadec0cad4920bb2ce2a: fix(chat): reset index and paused animations (@kujtimiihoxha)
* c74a5c4d64491606fbeff0eda109b7eae5e4e52c: fix(dialog): commands: execute command handlers properly (@aymanbagabas)
* e38ffc3804b85e5dd70c39063a7a9f553fbdff4b: fix(models): ensure that we show unknown providers on the list (@andreynering)
* b66676c52acc2ae0d151d4f5f819820fd188ddcd: fix(sec): do not output resolved command (#1934) (@caarlos0)
* 098bc8abf07fd8dd0506669376c34e6445a07f10: fix(sessions): select the current session in dialog (@kujtimiihoxha)
* 6b8ca6a7c512daea687c8389657db2a421707c31: fix(ui): accurately calculate help and main height in UI layout (@aymanbagabas)
* 706e359b34d1a498a2569532f0b1006fabb169bc: fix(ui): adjust app and help area margins (@aymanbagabas)
* 675d8515bfa37db9dd270f6d97faa494c650af2f: fix(ui): adjust dialog sizing to account for dynamic title and help heights (@aymanbagabas)
* 84bbd5b7587ad538c0b67f27ad9b48934a149cf5: fix(ui): change UI model receiver to pointer back (@aymanbagabas)
* f0942a72d202fb74ef0666a1b26ac3f1443f1aa2: fix(ui): change pointer receivers to value receivers (@aymanbagabas)
* 6a5746354cd9998fabadf57dc9c9ce0a91023e4c: fix(ui): completions: load files asynchronously (@aymanbagabas)
* 0c8cd47548296e9eaed766d8569411f9d3193f1f: fix(ui): completions: simplify Close method (@aymanbagabas)
* 6c0573915f184d935786ef8ecdfc18571f6dc0d9: fix(ui): completions: simplify completions popup message handling (@aymanbagabas)
* e2a586ca40e3fa0f9c4c3d19ec7f80d54c61057f: fix(ui): correct scrolling up behavior in lazy list (@aymanbagabas)
* 9899424bb063ddb626a6de6df603cfbdcb1118e0: fix(ui): dialog sessions refactor and close commands dialog on select (@aymanbagabas)
* d54a5e7eb11892ecb67e3f8510028d037c4978f9: fix(ui): dialog: align radio buttons with checkboxes (@aymanbagabas)
* f14253f1085fe7d5de9559805cddc6e6710835ab: fix(ui): dialog: clarify session age display (@aymanbagabas)
* 67ac46a526623357497b409f2848a15b5dbee0be: fix(ui): dialog: no need for groupItems map in ModelsList.VisibleItems (@aymanbagabas)
* fedf05910715b0c6349092cd6afbfa68a41c830d: fix(ui): dialog: saveKeyAndContinue should return Action (@aymanbagabas)
* 82eafde6a9ce0b10ea44c3b54ee0ba6b01b9bf4f: fix(ui): dialog: show provider name for recent models (@aymanbagabas)
* 179e17f64604c2facf843199b069d23c08a5155c: fix(ui): dialog: show shortcut/info in list items (@aymanbagabas)
* fb78b802586c10dc40dbdd2602ef62a3c51f08c4: fix(ui): dialogs: ensure returned commands are executed (@aymanbagabas)
* 876048d8b45fdbe0a57c6e0a7db8f5f9da2dac32: fix(ui): do not allow summarizing if agent is busy (@kujtimiihoxha)
* aec65c42f57648ab2d2715fe49851f09647d6271: fix(ui): don't use separate showFullHelp field (@aymanbagabas)
* 065f33999124673c5a9ab6c2e3de6f0393c31520: fix(ui): dry highlighting items in lazylist (@aymanbagabas)
* fa5c593c61775ffb3d14f02b06f784c696cea303: fix(ui): dry up session dialog key bindings (@aymanbagabas)
* c4cdc5dee1ce6c86f9d86b03d8845120f8c804f6: fix(ui): dry up up/down key binding in dialog commands (@aymanbagabas)
* 7b1914262610b73ed6873705402dee5760b32feb: fix(ui): editor: show yolo prompt correctly (@aymanbagabas)
* 749a966f306f81cfa34ed7e56f6f0c4501674711: fix(ui): ensure MCPs are displayed in configured order (@aymanbagabas)
* 9f5284f56cebf49d8a13d5bbfb294c0499bb820d: fix(ui): filepicker: defer image preview until after transmission (@aymanbagabas)
* cb8ddcb99c013dabc7de902e5b8ae74ba16e0abc: fix(ui): filepicker: remove redundant Init method and Action type (@aymanbagabas)
* f97faa180bd3274539158fe14dbc6457af579af5: fix(ui): filepicker: simplify cmd return (@aymanbagabas)
* ded1e6b277bbfac8168dc1f978de3da5f3bc0138: fix(ui): filepicker: simplify tmux kitty image encoding (@aymanbagabas)
* f79c9ce48407073360b55c21c008567d28b56524: fix(ui): fix scrolling up last item (@aymanbagabas)
* 98df293310d9d86cb416647f2f526c1907e4d377: fix(ui): handle model selection in models dialog (@aymanbagabas)
* a52e0306c3603b969daed15a59cc88683fac9e8c: fix(ui): hide cursor when editor is not visible (@aymanbagabas)
* d5b83c0dbbaa228bf3f783495d73e6db84489e2d: fix(ui): implement Highlightable interface for message items (@aymanbagabas)
* 1bb5aa8e0784f68313c07d54188a083b5d009121: fix(ui): improve key handling and keybindings for chat/editor (@aymanbagabas)
* 8e244e651a6d8e662f88e6b640ef3541a319ae62: fix(ui): improve thinking message truncation display (@aymanbagabas)
* 158f7a957cb8438324335c97783805b28ee3b18c: fix(ui): increase paste lines threshold (#1937) (@caarlos0)
* 1c968b8804acb3b5fe30fa1c1d4bfe13ce48fcc4: fix(ui): lint: use consistent receiver names in EditorModel methods (@aymanbagabas)
* 03b18fe755acf77f5e10b9000ed7a2cf605af465: fix(ui): list: countLines should return 1 for empty strings (@aymanbagabas)
* dd9e8ca15c72160f63fb017777a76029d65cbcef: fix(ui): list: move focused logic to render callback (@aymanbagabas)
* 318b2c681bb917a21b9126ef4ed2f2d1cad646f7: fix(ui): list: prevent negative offset in list rendering (@aymanbagabas)
* a1648a8c5f2599c240dfa8b8f5a943032266cb30: fix(ui): list: scroll to bottom after session load (@aymanbagabas)
* 5df46965eb6221b8a524f0c8a3b0d6c5b61f71fb: fix(ui): model dialog: skip non-model items when navigating selection (@aymanbagabas)
* 909244e4706a2408acf625ce38a7c5592c9322aa: fix(ui): models dialog: filter each group separately (@aymanbagabas)
* 60882473c933131a4cd78ed2eb3a4a3ff591c430: fix(ui): move canvas initialization to View method (@aymanbagabas)
* 7b267bc6a68bd8de20e8bbea9c25024e63412731: fix(ui): openEditor and handle pasted files in editor (@aymanbagabas)
* ece936a9bfa80b7ede2d8f09ee9a6c2cb55a6e0d: fix(ui): prevent panic when session is nil (@aymanbagabas)
* b4495455256ca33210e67c76722ec93c985dd694: fix(ui): properly align session item age text (@aymanbagabas)
* e86304d5a6f6d9c0a806ae9e402ee971fcf8ee62: fix(ui): remove redundant check in thinking rendering (@aymanbagabas)
* 1460d7577690c9b0e131442670c82911f6147e2b: fix(ui): scroll down off by one (@aymanbagabas)
* 039f7443e21fb5e4d602a9f8366d7a11264a5725: fix(ui): simplify QuitDialogKeyMap by embedding key bindings directly (@aymanbagabas)
* 01c052473d7c9e95dc7391c188ed8deb34ad3b95: fix(ui): simplify suffix handling in message editor (@aymanbagabas)
* 7bc57e7e1689bf2a284aa3120c7e4e92868a4d09: fix(ui): use Content instead of Layer for main view (@aymanbagabas)
* bea6010aa9d8f025b0c9f97cbfad12674dacda8a: fix(ui): use new lipgloss compositor (@aymanbagabas)
* 4c938aa1f773150fb5119c640e9427d684a1015e: fix: address "verifying..." now showing on side of spinner (@andreynering)
* f27f5460223ea98f91ef41b826218d1de882c3e8: fix: address double vertical margins between sections (@andreynering)
* 6caf8788dcbaa9bf3ee2326abc738dbf428f8f5a: fix: align "authentication successful" on the left (@andreynering)
* 2fa1f4dd56d9edced17df1942973d925a4d6cbb8: fix: correct spelling from marshall to marshal (@meowgorithm)
* 4403170ac0af2eb076d23fa9ed4d85ee667cf98d: fix: correct typo in log message (@meowgorithm)
* f8a9b943e7069b76518c10b7db50694c5dd6345c: fix: ensure that hyper and copilot models show up even if not configured (@andreynering)
* 077706036c3a6dc502d7f5d30f2bc77ad1b4d733: fix: recent models dont go into the schema (#1892) (@caarlos0)
* c4add9e0fa401da01b8d0ea6d1b42d03bc354de1: fix: use cached lsp.DiagnosticCounts (#1814) (@caarlos0)
* 4c223c375378ed805f04692e06f22e84646929a8: fix: use canvas to render UI view (@aymanbagabas)
* 7c21b1f0c06d414f9205beae9bd14834fb36b12f: fix: use strconv.ParseBool (@aymanbagabas)
### Docs
* 292688313b69dd295d57618c73e104d9899ad6fd: docs(readme): remove link to site that is offline (#1926) (@andreynering)
### Other stuff
* f2f63d1dfcd528a8fb64387f38f716cb0ca7378f: Refactor Custom Command Arguments Dialog (#1869) (@kujtimiihoxha)
* 7a2769c0a3b51fb0bfe6988c43208eb272f03d67: Refactor commands (#1847) (@kujtimiihoxha)
* 4379251cfe71ddc892b80d3385a3b0b9e6ba54db: Refactored permissions dialog (#1796) (@kujtimiihoxha)
* 95bae1017e11e4312ef98d78eed21eceb2211087: chore(chat): add some missing docs (@kujtimiihoxha)
* 34741602aab75afb82e3eba797efe6ec6d97aefc: chore(chat): remove empty assistant messages (@kujtimiihoxha)
* 8cea0883824de2cfb0627069333c579ea41648ee: chore(chat): remove unused style (@kujtimiihoxha)
* b0dd9830ad278754699406aff3c44b97d01fb8be: chore(chat): rename funcs (@kujtimiihoxha)
* 14ff2243a2f79c3925bc56247d7234aab1d332cd: chore(chat): small improvements (@kujtimiihoxha)
* b8d39c6abdf3d8ff47b6c0cdb9b0d2fbb62ce1de: chore(chat): some more docs missing (@kujtimiihoxha)
* c6e7e3904aeda3768f871827a23538d950c62c98: chore(prompt): small edits (#1915) (@meowgorithm)
* 9e018b939547b9a953cb5ecba72fcad614b3594e: chore(tools/edit): various fixes (#1921) (@meowgorithm)
* 4e541e1910f3f2d8362259da1b0776f59e6a12c9: chore(ui): add TODO for model API and auth validation (@aymanbagabas)
* 8d5226d29f3929dcbd7c8089e5995c068706fe2f: chore(ui): add comments to internal/ui/model/ui.go (@aymanbagabas)
* ed7ef782eae8e202e606c09e1aecf9635dea9eae: chore(ui): standardize dialog identifiers (@aymanbagabas)
* 4665ad27daeb777fe519f7d8057c4dfea7923e9d: chore(ui): standardize truncation message format (@aymanbagabas)
* 26edcdc405cea27dac32208f060a36d565930c0a: chore: add chat sidebar (#1510) (@kujtimiihoxha)
* e2b071d0cea57829f85270871753af34535e1a25: chore: add log when new UI is enabled (@aymanbagabas)
* 4c540cfccb48ce16b5b4fa53c11e48bc238577b9: chore: fix const type (@caarlos0)
* f4b848b50db54d17cfb162d0b8ba80109ac67d5a: chore: implement missing command and fix summarize (#1882) (@kujtimiihoxha)
* db5c3eb3983e838eec277e959e42c6fa18f4272a: chore: initialize functionality & landing page (@kujtimiihoxha)
* f7a22a80999eb57b0dadc26f230fb5818bc664dd: chore: remove dead (duplicate) code (#1913) (@meowgorithm)
* 36354358f302018ba173bd3f2866580ed228098a: chore: remove redundant zero value initialization (@meowgorithm)
* 1ca8abc0a1f24778c64091b2a0cd96e00a6b03f2: chore: remove unnecessary testing concerns from env.New (@meowgorithm)
* bbce33fb50e8b53e02c0d54453047b5789ea64af: chore: rename isSpinning to spinning (@kujtimiihoxha)
* 2f845cc20e1b01310886a7dcbd440011e80cc8d4: chore: return empty slices instead of nil for safety (@meowgorithm)
* b7c128a33cfa79a8ae45b1865b453c7b9353a3c8: chore: simplify struct initialization to direct return (@meowgorithm)
* 614b0bc970f6b82584d0e9159e57a522e3077d4b: chore: some cleanup (@kujtimiihoxha)
* e16eae1a23ea4849429d0f69f711dd58d3e12638: perf(ui): dialog: preallocate slice for filterable items in ModelsList (@aymanbagabas)
* 2f1feaa17247968b07c722b78fc2cc71ff33d929: refactor(chat): add bash related tools (@kujtimiihoxha)
* df22d89a0ebfa2871dc089abde20dd1b5ab9326c: refactor(chat): add file tools (@kujtimiihoxha)
* 5699a91ad5573613fb72bc8f3dc73a8ae739ccf8: refactor(chat): add search tools (@kujtimiihoxha)
* 462cdf644189170903c3a51c4ee0363263d1d026: refactor(chat): hook up events for tools (@kujtimiihoxha)
* 4f07a5485d11fd11e7216954bebd85cfcd1d4f0c: refactor(chat): implement user message (#1644) (@kujtimiihoxha)
* 0896789b516e50c4a13c2ddc01a02fe4466c4bd8: refactor(chat): initial setup for tool calls (@kujtimiihoxha)
* ed18aac98e9f06cc1ad6aa2bef0f779ff894dc43: refactor(chat): only show animations for items that are visible (@kujtimiihoxha)
* 2cccd515a848a5df0d9dffea3c3f5f037752c07b: refactor(chat): rename GetMessageItems to ExtractMessageItems and GetToolRenderer to ToolRenderer (@aymanbagabas)
* 3d9d4e6a3d2c800d52269b0d234e10df56029a2f: refactor(chat): simple assistant message (@kujtimiihoxha)
* 17de9c79dbd908b2d988a736da74d558ba942c7b: refactor(list): remove item IDs for simpler API (@aymanbagabas)
* 5d6dbc865bbda659517373683c1a7972bbff2d7e: refactor(list): simplify focus and highlight interfaces (@aymanbagabas)
* c4440754e5b532f1669296b3565e346aac1602e5: refactor(ui):  reimplement UI components (#1652) (@aymanbagabas)
* 41b819f5204422eaf842d04454c4a1609ef07ae2: refactor(ui): chat: abstract tool message rendering (@aymanbagabas)
* 6dc2dd8fdcfca657ceb572348c410dc32b1c7e91: refactor(ui): cleanup and remove unused list code (@aymanbagabas)
* 1f0605ae33299a887971130f120dc7fca5cf635f: refactor(ui): dialog: cleanup render logic and use RenderContext (#1871) (@aymanbagabas)
* 7fad242ae375f9d8a7b2b6803cfea700b5e558ce: refactor(ui): dialog: improve command and session dialogs (@aymanbagabas)
* fcd1b83168efee74b3cf34f0b33c0a5f2a2bbf2f: refactor(ui): dialog: message and draw handling (#1822) (@aymanbagabas)
* e24c9c387693b83baa43d4cfc7deaa274a74661b: refactor(ui): dialog: rename Add/Remove to Open/Close (@aymanbagabas)
* eed0b49f8ceee2d23afd1dd3db0ff6ac295cb571: refactor(ui): dialog: unify session and model switching dialogs (@aymanbagabas)
* 18ee5408c46833f1d9328b1e51913e8d2988e97d: refactor(ui): dialog: use Action pattern and lipgloss layers (@aymanbagabas)
* 2dc5d0b02728a411df96c38f41612e01f70eeaf6: refactor(ui): list: remove mouse highlighting state, add render callbacks (@aymanbagabas)
* ba9e4528b292d4ad01e90fda3726829adfd7e14b: refactor(ui): pass app.App to common.Common and access config via common (@aymanbagabas)
* 94de6bc884658ed35797ff0dbca1ed5571af3e14: refactor(ui): remove dirty tracking from LazyList (@aymanbagabas)
* e5932974c5cbc41e1dde2624fc38be3e5d96ab3e: refactor(ui): rename files.go to session.go and update session loading logic (@aymanbagabas)
* b25730d0c30129f642b0ade59e9804bfceab52ad: refactor(ui): rename lazylist package to list and update imports (@aymanbagabas)
* 706e182730c2ea7542c0da0224c72b44c5d0db5d: refactor(ui): reorganize ui components into flat structure (@aymanbagabas)
* efaa956d77b90321e9979b78405f28b1b2d358dd: refactor(ui): rework init and support different layouts (#1463) (@kujtimiihoxha)
* 53d38c08edbabad0edd47d38a9b126d271b8301c: refactor(ui): simplify dialog model and rendering (@aymanbagabas)
* 2f95dcc6a6ce61554e851fc6eab69aa2f91f5c89: refactor(ui): use uiutil for command handling and error reporting (@aymanbagabas)
* c0e3f79756a0f405da72cb0c78ce93e773bee073: refactor: add agent tools and rename simple->compact (@kujtimiihoxha)
* 0decf78c95af8e3acbe6a9e056a179afa0a38c15: refactor: add assistant info item (#1881) (@kujtimiihoxha)
* 67efe867a128a9cea1bcde85b51864445dd8be39: refactor: add more tools (@kujtimiihoxha)
* 19c67f7ffc90d1470a4de5644ac78733f4020a42: refactor: compact mode (#1850) (@kujtimiihoxha)
* ccb1a643e9b0959e19bd0263e493a8b7a8544972: refactor: make oauth dialog generic and move provider logic to interface (@andreynering)
* ead5bf4857f22e583b78c6b26a4caeea38594460: refactor: mcp tool item (#1923) (@kujtimiihoxha)
* 4261dfbf156ae6c82e5e0d534eacd2651bd1f896: refactor: move domain-specific type out of generic pubsub package (@meowgorithm)
* c3e9196ed126e12d675092f02f3ddd4f42f8001b: refactor: pills section (#1916) (@kujtimiihoxha)
* e70d46fce15611861c38eeeb3ad11e42bb9fe28b: refactor: reasoning dialog (#1880) (@kujtimiihoxha)
* 8b5cc439a99cdf71bc8c66b62d4ed4471260585b: refactor: remove duplication on functions to open dialogs (@andreynering)
* 9f7be9d2924780b7b10d70061d46d2b9ff2bc997: refactor: remove init in favor of returning cmd on new (@andreynering)
* 599866a9c499a2227b0b97dd0161cc31b4cea93f: refactor: use `cmp.Or` (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.34.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.34.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.34.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.34.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.33.3 — 2026-01-18

# Mini MCP Fix

This patch reverts a change which caused MCPs to block the first interaction until loaded. No more! MCPs are back to async.

Hope you're having a great weekend! 💘

### Fixed
* c0662f13c0a71c584f71aee9bdbe8a63f6dca457: fix: do not wait for MCP on interactive mode (@kujtimiihoxha)
* e55706507ff00460f09cfabb8b15278ccc2ee8d0: fix: don't build native clipboard for ios (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.33.3/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.33.3/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.33.3/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.33.3/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.33.2 — 2026-01-16

# Pasting images from the ol’ clipboard :framed_picture:

Thanks to contributor @kslamph you can now paste images from clipboard directly into Crush.

Many other fixes are included to make Crush more stable and reliable as well.

Enjoy! :sparkles:

## Changelog
### New!
* feat: add clipboard image paste functionality to chat editor by @kslamph in https://github.com/charmbracelet/crush/pull/1151
### Fixed
* fix: race in agent.go by @caarlos0 in https://github.com/charmbracelet/crush/pull/1853
* fix: resolve extra headers for providers by @kujtimiihoxha in https://github.com/charmbracelet/crush/pull/1764
* fix: make hyper and copilot link styled on ui by @andreynering in https://github.com/charmbracelet/crush/pull/1872
* fix: try to make the search tool more reliable by @kujtimiihoxha in https://github.com/charmbracelet/crush/pull/1779
* fix: mcps loading in non interactive mode by @kujtimiihoxha in https://github.com/charmbracelet/crush/pull/1894
### Other stuff
* chore(README): update crush art by @meowgorithm in https://github.com/charmbracelet/crush/pull/1861
* chore: tidy agent package by @meowgorithm in https://github.com/charmbracelet/crush/pull/1857
* chore: fix more typos by @meowgorithm in https://github.com/charmbracelet/crush/pull/1863
* docs(readme): update features section by @meowgorithm in https://github.com/charmbracelet/crush/pull/1883
* docs(readme): pull extra comma by @meowgorithm in https://github.com/charmbracelet/crush/pull/1887
* chore: use posthog's default exception reporting by @andreynering in https://github.com/charmbracelet/crush/pull/1895

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.33.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.33.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.33.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.33.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.32.1 — 2026-01-13

# For a Few Fixes More

This is tiny patch release where we fix a panic that could occur in Gemini as well as another a race condition where session titles might be generated but not applied.

We also increased security jobs, turned on the race detector, and improved builds overall in CI.

Cheers!
Charm 💘

## Changelog
### Fixed
* 87df08c4088afb265a3886380db96ca6387c518d: fix: race condition where title might not be generated (#1844) (@meowgorithm)
* 9d9cfa1bf20db357350e4a053d8f554d158941b4: fix: update fantasy with panic fix for google gemini (#1840) (@andreynering)
### Other stuff
* dd0d6cf73d20a378961482aae74bbfbfca8d0a95: chore: fix some typos (@jeis4wpi)
* 3fd9d970149e706149c47e86f3d007512472ff12: ci(sec): add more security jobs, improve build, enable race detector (#1849) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.32.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.32.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.32.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.32.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.32.0 — 2026-01-12

# Optimizations and More

Our most ripped dev @caarlos0 ripped more than his abs in today’s release. Thanks to him, Crush now uses less memory and has faster startup and shutdown times across the board.

If you only use Crush because of local models, you might be interested in the contribution from @jonhoo who added a `disable_default_providers` setting to disable all default providers. Note that `CRUSH_DISABLE_DEFAULT_PROVIDERS=1` has been around for a bit and will also work.

See you on the internet! 🌐 

## Changelog
### New!
* 163abdc1c4903bebbe19643e73f0335740ec7c6d: feat: add `disable_default_providers` option (#1675) (@jonhoo)
* 617f9e28f634089fed552cc28a987851f23c48e0: feat: allow to send the prompt if its empty but has text attachments (#1806) (@caarlos0)
* 467418d5346b5c253dc141ef44d60ca3e1f1f6f8: feat: open editor in the right position (#1804) (@caarlos0)
### Fixed
* df6f51492ef104be308f77066442bb5eded86261: fix(sqlite): busy timeout (#1815) (@caarlos0)
* 2350f7ea30658e7fe0240b901818b22896d32a37: fix: make sure to unlock in goroutine (#1820) (@caarlos0)
### Docs
* a4f5d722761e9d3a8e90c5d9c3662b57ada6fe71: docs(README): add FreeBSD installation instructions (@meowgorithm)
### Other stuff
* 6f0f5197e36c494d69ace2ee3d011696d5b656fc: Fix shutdown (#1833) (@kujtimiihoxha)
* b2252f8f98ff5f60e8757b1fc47defeff2f4ae3a: chore: auto-update files (@charmcli)
* a447f55c5c3091d0d1dd406ea9e96e97aaaa12ff: perf(config): simplify loadFromConfigPaths (#1821) (@caarlos0)
* e4400ad2413fdf57d85e5e07d641c61e357d3c2a: perf(shell): reduce allocations in updateShellFromRunner (#1817) (@caarlos0)
* b8847674247c0acb21b863c57f77ca44631185ca: perf: fix possibly unclosed resp.body (#1818) (@caarlos0)
* 6f646c9151a63d2c609f349847ef670420dddc4e: perf: improve startup and shutdown speed (#1829) (@caarlos0)
* d1382bb55d03936047df0fc81b3ab9da3cafe4b5: perf: reduce memory usage (#1812) (@caarlos0)
* 0868681f6665c05552491ad1d9f71939fd47f68e: perf: use strings.Builder for string concatenation in loops (#1819) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.32.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.32.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.32.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.32.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.31.0 — 2026-01-07

# Fixes and ch-ch-ch-changes

How's it going? This is primarily a maintenance release.

* Skills can now be loaded from a general "agents" directory (e.g `~/.config/agents/skills`)
* Claude Code support was removed to align with Anthropic’s terms of service
* Various small fixes and UX improvements

Special thanks, as always, to star contributor @Amolith for the constant improvements. See you next release 💘

## Changelog
### New!
* 6b3cd26f9f78ae7318153922763025bfa8831443: feat(skills): also load from .config/agents (#1755) (@Amolith)
* 5590161f86806f00bc8e4702b0c67d2abcaa9c62: feat: remove claude code support (#1783) (@andreynering)
### Fixed
* bf39639c3d152196384fc139161719202f04f2f8: Revert "fix: prevent filename insertion when dragging attachments" (#1773) (@meowgorithm)
* 43b0e0bcba1930653125dc156dd532e436a63b1d: fix(mcp): centrally filter disabled tools (#1622) (@Amolith)
* ca21111b7672c775ddfab566063c2b9ad044dee3: fix(posthog): correct bool prop name for non-interactive mode (#1771) (@andreynering)
* 56f1b37a19e145b210ae1fdaca1f0637ed41ef82: fix(posthog): normalize `interactive` prop case (@andreynering)
* 2bdac87e4a1505af3b17e1154b92bdf963c1df7b: fix: mark files that are attched as read (#1777) (@kujtimiihoxha)
### Other stuff
* 4cc3aeb4ee100841de75f58c8cbece3f3f4f241d: chore: fix typo in const name (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.31.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.31.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.31.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.31.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.30.3 — 2026-01-05

# More Models

This release brings new models to GitHub Copilot users:

* Claude Opus 4.5
* GPT 5.2
* GPT 5.1
* GPT 5.1 Codex
* GPT 5.1 Max

Remember that you need to enable those [in Copilot settings](https://github.com/settings/copilot/features) in order for them to work properly!

Also included are fixes to reduce the number of count requests on Copilot when using sub-agents (searches, etc).

## Changelog
### Fixed
* 5f7beb0e8c647fd6e8326db2df61760a28c955c4: fix: enable responses api for github copilot (@andreynering)
* a94866c85c68f036c343710145bbc5e71e755382: fix: quota for subagents in copilot (@kujtimiihoxha)
### Other stuff
* 58b2c5b26d54421ae4e3303bc366b20220b46786: chore(copilot): update message: "wait a minute" -> "wait 5 minutes" (@andreynering)
* c70d34db16b603bc5cfd9b861f2eae492df552dd: chore: make it so the small model also is always considered a subagent (@kujtimiihoxha)
* 65e20ea8ad8dea9c90c31402d4bc2866719b48ae: chore: update fantasy to v0.6.0 (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.30.3/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.30.3/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.3/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.3/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.30.2 — 2026-01-04

# Quick ’Lil Patch

This is a tiny patch release to fix a nil pointer issue in the last release, as reported by @umairimtiaz9. Thanks, Umair! 💘

## Changelog
### Fixed
* b618a5bc98367c6011f6ed2a2d85d1faa90ad500: fix(sessions): nil pointer dereference (#1759) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.30.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.30.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.30.1 — 2026-01-03

# A Fistful of Fixes

Happy New Year! This is a little patch release to fix session naming, Copilot quota usage, and symlinks in skill directories, and a potential panic.

Best wishes for 2026! 💘

## Changelog

### Fixed
* aeadffde3bbb407bec508f7c8b95acf0991b1f3c: fix: copilot quota handling (#1738) (@Gustave-241021, @kujtimiihoxha)
* 7315fceb643a44014da37257f88ed23e79ab4b50: fix(sessions): generate title with large model if small model fails (@meowgorithm)
* d361a3311470b91c9d9184a968ed13c56e74f6cb: fix(skills): use fastwalk to resolve symlinks (#1732) (@Amolith)
* c49b4fe243ffd6b9ded5afdc53c9e85e0dff404c: fix(sessions): tag removal, handle multibyte (@meowgorithm)
* 63a3d831881d76b9a4aab615ba8581498fcb5ae0: fix(tui): guard model selection when list is empty (#1715) (@jamestrew)

### Other stuff
* 7091b4f77b0d58a482f3872b8bfd3d3586b78c21: chore(cli): simplify help text (#1752) (@meowgorithm)
* 67e8f140fab298698c7b15d41a95097256551ac3: chore: auto-update files (@charmcli)
* 59e4adc2fb034f51e0757a7ee94642196a758977: chore: minor internal/app improvements (#1696) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.30.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.30.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.30.0 — 2025-12-27

# Skills (to pay the bills?)

This release adds support for the [Agent Skills](https://agentskills.io/) open format. Skills are a great, simple way to give the agent new capabilities, and they're automatically loaded on demand so they won't clutter up the context. Anyway, it's a pretty cool feature and we recommend giving it a try! For more info, and some instructions getting started, see [the Agent Skills section in the README](https://github.com/charmbracelet/crush?tab=readme-ov-file#agent-skills).

See you soon,
Charm 💘

## Changelog
### New!
* 1fbe7d48900d8734d4a8c4aaffe734e95f2b786d: feat: agent skills (#1690) (@kujtimiihoxha)
### Fixed
* 63a3d831881d76b9a4aab615ba8581498fcb5ae0: fix(tui): guard model selection when list is empty (#1715) (@jamestrew)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.30.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.30.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.30.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.29.1 — 2025-12-22

# Mini Attachments Patch

This is tiny update to improve the behavior when files are dragged and dropped into Crush, and when long blocks of text are pasted in.

Hope you're chilling out! 💘

## Changelog
### Fixed
* 41335547790de560fad7f33a69ef32d53591c41f: fix: prevent filename insertion when dragging attachments (#1683) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.29.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.29.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.29.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.29.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.29.0 — 2025-12-19

# Paste, drag ’n drop, and other things from Xerox Parc

How's it going? We just added support for dragging and pasting attachments of all kinds into Crush, in an effort to make Crush your favorite desktop app in the terminal. We also added support to treat big pieces of pasted text as attachments. 

<p><img src="https://github.com/user-attachments/assets/c3ff217e-f055-454b-ba87-baa1523cfae9" width="600"></p>

Oh, and we also fixed a handful of bugs.

Hope you're staying warm (unless you're in the southern hemisphere, in which case, stay cool). See you soon and thanks for all the support! 🎁

## Changelog
### New!
* b3f73213fd7ee20329632d3b9d47f792ba00482c: feat: paste long content as an attachment (#1634) (@caarlos0)
### Fixed
* 1c5443358e99bb196bdd812969109126cb99937f: fix: initial api key load (#1672) (@kujtimiihoxha)
* 4f6d0e9373ffb015cba1715a4985298e037d6d14: fix: race condition (#1649) (@kujtimiihoxha)
* 0f76e63276c5d17bcf12bdf973f91a7feca7df19: fix: remove unsupported image types (@kujtimiihoxha)
* ec226090e2865b5bc9f3d4a186c6d71afdce6dc8: fix: splash padding y (#1680) (@caarlos0)
* 5d419e806bdd202e84549ff580922e1a6f150d6c: fix(aws-bedrock): update fantasy with `panic` fix (#1681) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.29.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.29.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.29.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.29.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.28.0 — 2025-12-18

# Onboarding Stuff

This release is mostly to improve and fix the onboarding flow:

* Fixed a bug that made impossible to type <kbd>c</kbd> on onboarding (model filter and API key input). Oops!
* It's now possible to properly login to Hyper and/or GitHub Copilot via the onboarding flow.

See ya! 🎁 🎄 

## Changelog
### New!
* a326efef45a6b223f0341a548cd5c39cabe4c0a4: feat: add ability to set envs to override config directories (#1661) (@andreynering)
* 13f315cb30efb673178ec4059547a2306a0d7c50: feat: make hyper and copilot login work on onboarding (@andreynering)
### Fixed
* 68ad2981a0017a510f1df6ba89c7492ecb1b4338: fix(copilot): change import to happen on demand, and also on onboarding (@andreynering)
* b945baa3ddf8dd81e090514b06a35ade3d508363: fix(onboarding): address `c` key press not working on onboarding (#1663) (@andreynering)
* 5b66c8d81e07f77ee824d54c5567ab0bb9a2834b: fix: handle `ctrl+c` in hypercrush auth (#1665) (@meowgorithm)
### Other stuff
* 2ba5a82e45d4adc69040512127ebb14b52d9a41b: chore(ux): remove extra uneeded line (@andreynering)
* e1817142d18df38dec897bb6f019ba971e9b8de2: chore: auto-update files (@charmcli)
* bcebf0708f5bd3f7f0d3f3ed3f56652c44853a00: chore: auto-update files (@charmcli)
* 996539f2aef74d645452d77f6260b1d3c31ec97d: chore: remove cspell.json (#1664) (@aymanbagabas)
* cffe0cf1f98256f9e9271d0c8d7a46b1158de5e8: fix(tui/mcp): singularize tool/prompt count when 1 (#1623) (@Amolith)
* 3c22cb840b4aa163f0cc3756cf0ea65ec195929b: refactor(config): add ToProvider method to ProviderConfig (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.28.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.28.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.28.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.28.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.27.0 — 2025-12-17

# GitHub Copilot

It's almost the new year. Some people are celebrating things. In some places it's snowing. In other places it’s summertime.

🎁 Whatever’s going on for you, we have a little gift. The gift of Github Copilot auth in Crush.

Copilot should work automatically if you have already logged in your machine, otherwise, you'll be prompted to login once you choose a Copilot model. `crush login copilot` is also an option to login.

Enjoy!
Charm 💇🏻‍♀️

<img width="554" height="359" alt="Screenshot 2025-12-17 at 11 27 37" src="https://github.com/user-attachments/assets/e50f422a-d339-4784-906d-42e1be14c0e8" />

## Changelog
### New!
* 5fe017723303e8cdd40f4f14de9da46c911e761f: feat: add github copilot auth flow via tui (#1645) (@andreynering)
* ab057fdf04affbe4454d35741684277362a92095: feat: add github copilot support (#1645) (@andreynering, @marifcelik and @mikluko)
### Other stuff
* e67c16e6b34d47322a200a3e1a822e4b633f4732: chore(cmd/projects): improve help text (#1647) (@meowgorithm)
* 66a272d8b6054cfeba0d29157370f2dad90889b9: chore: auto-update files (@charmcli)
* 77e0475d2ba275cc930b111f8ef31a145b2d8619: chore: auto-update files (@charmcli)
* cddb306ab52dd6c24b11cb972def396a6a8e02ad: refactor(hyper): a couple of small adjustments (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.27.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.27.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.27.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.27.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.26.0 — 2025-12-16

# CCC: Carlos Crushes Code

This is primarily a maintenance release to move some things and around, update packages, and prep some stuff for the future. Special thanks to @caarlos0 (and @aymanbagabas!) for pushing Charm™ future-facing tech and infrastructure.

<details>
<summary>Huh?</summary>
<p><a href="https://console.charm.land"><img width="512" src="https://github.com/user-attachments/assets/0a625189-5ac2-4085-b3a3-f06a28a0ee9e" /></a></p>
</details>

## Changelog
### New!
* 5291b1dbebb48e84e72571a11b561b49f42a15b2: feat: hyper integration (#1642) (@caarlos0)
### Fixed
* 4529235c045074a14375727883f6ed52a1651d4e: fix: check if token is expired before sending the request (#1641) (@caarlos0)
### Other stuff
* 2b506d64ee5e7b7dff52578eb25df1458a778013: chore: bump bubbletea to fix moving the cursor to the bottom of screen (@aymanbagabas)
* b54c06b83607ba923eae743cb330a924428e70e2: chore: bump bubbletea to latest rc2 version (@aymanbagabas)
* 6cecb82e61eb79b63cb4db6e4ba17d85a2ce5fd3: chore: update bubbletea to latest rc2 version (@aymanbagabas)
* 7fd14ff479be2d2f14d0be0b6a68f65f8bb79e6d: refactor(tui): move ExecShell to uiutil package (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.26.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.26.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.26.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.26.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.25.0 — 2025-12-16

# Project tracking ’n’ bug fixes

This release introduces a new `crush projects` command that you can use to see all the projects where you used Crush that it knows about. Keep in mind that you need to start Crush at least once, with this new release, to get it recognized. It was primarily designed for programmatic use (see the `--json` flag, but maybe people will like it too). For details see `crush projects --help`).

We're also shipping some important bug fixes, including a patch for a possible broken session that could occur when OpenAI-compatible providers like Grok if you interrupted the model while it was thinking.

Keep crushing it! 💘

## Changelog
### New!
* 4b86d090392a761106d4b33b2937e183af62bcd6: feat: add centralized project tracking (for Splitrail) (#1553) (@mike1858)
### Fixed
* a2678eb4c642faf52e5496da9af1ad94d847a336: fix(uiutil): add Cursor interface (@aymanbagabas)
* 9ca655702eaebdbc058a11361c2af9968689516a: fix: typo in Subscriber type name (#1616) (@meowgorithm)
* 33d8aafb54b884f2bbcea4f1b21e75cd850c6007: fix: update fantasy with fix for empty messages bug (#1639) (@andreynering)
* c822651c9bfe6071fe6d29c1f470c9221faf0613: fix:remove 100MB file size limit from download tool (#1631) (@Gustave-241021)
### Deps
* a7d13872fe1ba8b6b3c8b1690583dbc74281e338: fix(deps): use charm.land glamour and log (#1469) (@caarlos0)
### Other stuff
* b1d93ebbadd2e3ec4d74015f3b8eeadbbc0b18cc: chore(ui): remove left padding in thinking blocks (#1629) (@meowgorithm)
* 69d3ac961bfccc36a1df5b3b680a7b67fb929b01: chore: search improvements (#1632) (@kujtimiihoxha)
* 0d0ac7ce6776844e1bd2ad3e97bec67c14f3ad38: chore: send `interactive` attribute (for `crush run`) (#1635) (@andreynering)
* df6f35a694dd3e36ead0b985b996b45b9a68489d: refactor(tui): move UI message handling to internal/uiutil (@aymanbagabas)
* 7918c90ed0587dc67a178f6bd7884b6899387a63: refactor(tui): move command loading to uicmd package (@aymanbagabas)
* 31e155c2ce1a7a906c244d381daf15dd5481c5e7: refactor(tui): unify commandType definition (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.25.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.25.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.25.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.25.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.24.0 — 2025-12-12

# To-Dos and More!

At last to-dos! We also made some improved noninteractive Crush and hardened things all around. Read on!

## To-Dos

Apparently, LLMs are just like people: they _need_ a to-do list to get anything useful done. That why we’ve finally granted Crush a first class to-do list, Charm-style. Now Crush will create to-dos list as-needed for better execution on tasks.

<p><img src="https://github.com/user-attachments/assets/f79b6d28-c3eb-4137-8867-2cdb67983f6e" width="960"></p>

Does this mean that (with the right MCP) you can use Crush for grocery shopping? Why the heck not.

## U so Fancy, Crush Run

There are a lot of people using Crush in sneaky places with its non-interacive (and super yolo) mode: `crush run`. As true command line connoisseurs, we've upgraded `crush run` to support output redirection (or pipes, if you will).

```
cat Taskfile | crush run "add descriptions please"
crush run "Summarize this project" > summary.md
crush run "Rate my Pokémon collection" < Pokedex.md > Pokerating.md
```

## Bugz

We and the community crushed a bunch around rendering (thanks @aymanbagabas!), user interface (thanks @dawndiy!), and tools (thanks @Gustave-241021!).

That's all for now, but we have lots more on the way. Enjoy your weekend and maybe eat a burger. 🍔

—Charm 💋


## Changelog
### New!
* 88831a1b004e3dd44d72023ee283e95e84c27a4d: feat: todo tool (@kujtimiihoxha)
### Fixed
* 36d471b68228d1abfa68577fdcbb0fa1f20ac56a: fix(noninteractive): support output redirection (aka, pipes) (#1594) (@meowgorithm)
* cc08edc9b388af373404b339d138607b39b1681e: fix(tui): fix list wrap behave when it has unfocusable items (#1312) (@dawndiy)
* 2d43901fe3faedf9c057daa1bd2095946e6aa6a1: fix(ui): list highlight selection scrolling (#1575) (@aymanbagabas)
* 2e466d841c1355a883565a0b35d750739a760123: fix: edit tool error on new file creation due to logical fallthrough (#1566) (@Gustave-241021)
### Other stuff
* 448b78ba38f10f3007be8f663e084e6ca1f7a7a9: chore: bump bubbletea and ultraviolet to fix non en lang rendering (@aymanbagabas)
* c5d2ccb35d4564bef66cf3b7d8dbaa7d6a206e6d: chore: update bubbletea to latest rc2 version (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.24.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.24.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.24.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.24.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.23.0 — 2025-12-11

# GPT 5.2 is here! ✨ 

OpenAI just released [GPT 5.2](https://platform.openai.com/docs/models/gpt-5.2) and Crush already supports it. Enjoy!

We also added [GPT 5.1 Codex _Max_](https://platform.openai.com/docs/models/gpt-5.1-codex-max), which was missing until today. And of course, star contributors @Amolith is back with some nice small additions.

More good stuff coming soon! 💘

## Changelog
### New!
* 47b50d4622eb65862e5d10fe78d5b444ea13e442: feat(tui): show / hint when editor is empty (#1512) (@Amolith)
* 0cc2bf5f86676a6ce0334e9ee769dfd0ebf72370: feat: update fantasy and catwalk for support to gpt 5.2 and 5.1 codex max (@andreynering)
### Other stuff
* 954872edd64a021fcc964531ff0098b281c22c69: chore(taskfile): add task to update fantasy and catwalk (@andreynering)
* ef61c051eaae57dea2406eebe368bf29f5361ec4: chore: bump bt and uv to fix scroll empty line artifact bug (@aymanbagabas)
* de451cc1390edd420ae070d40166a394b545ded8: chore: bump bubbletea and ultraviolet to fix cursor related rendering artifacts (@aymanbagabas)
* 4143ccd46f4d131d867e834efc4c457533dccd18: chore: bump bubbletea and ultraviolet to fix kitty keyboard exiting (@aymanbagabas)
* 23cf8afd75334a09bd404e8870fa94766cc218bb: chore: bump bubbletea to module replace (@aymanbagabas)
* d354b61eceedfc50c3da54fdfcf83a7f8e8cdafa: chore: bump dependencies (@aymanbagabas)
* d8f8889faaae63484cdf33464447ac65c071032a: chore: bump lipgloss to the latest v2 version (@aymanbagabas)
* 6219de7ca9a8625fa88b02414477f4fe7cc891a8: feat(mcp-config): add list of disabled_tools (#1533) (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.23.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.23.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.23.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.23.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.22.2 — 2025-12-10

# Long Sesh in Claude Max? No problem.

This release improves how Crush refresh tokens from Claude Code or API key templates. It'll now automatically refresh when it expires and continue transparently. This affected long session only (8+ hours), and was only partially working until now. Kudos to @taciturnaxolotl for reporting and helping with this fix!

Additionally, @taigrr made a change to sort sessions by activity instead of creation on the dialog opened by <kbd>ctrl+s</kbd>.

@meowgorithm also fixed the need to press <kbd>ctrl+c</kbd> twice to close `crush run`. Pressing a single time will now work.

Happy coding! 🎄

## Changelog
### Fixed
* ab55cb6ce2636a7d6fd2dfce1cd6aba7c2e6c23e: fix(claude): add authentication refresh on 401 errors (#1581) (@taciturnaxolotl)
* 3c7ee39258d0b47f7602160096103baad73bf2b4: fix(noninteractive): cancel on signal (#1584) (@meowgorithm)
* be746ce1f680abe22c1c89969a77b8c1d71bcaf9: fix: typo choise -> choice (#1579) (@caarlos0)
### Other stuff
* 409773299ad33b436e10f93d28c27e0a3c25d612: perf: improve startup, specifically provider updates (#1577) (@caarlos0)
* 94a87508f832a15c29e9257c4fe2c23bbf0f26c9: sort sessions by most recently used instead of creation (#1467) (@taigrr)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.22.2/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.22.2/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.2/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.2/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.22.1 — 2025-12-08

# Image results, for real this time

Whooooops! This fixes a bug in [Fantasy](https://github.com/charmbracelet/fantasy) that broke image results. Now they’re workin’ properly.


### Fixed
* 814bb204948662f10a0f8d5bb817afbeac4da889: fix: update fantasy to fix image loading (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.22.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.22.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.22.0 — 2025-12-08

# Web Search and Images

This release introduces two solid, completely different features. One is around web search and the other is around images. Let's get into it!

## Quack, Quack

Crush can now search the web, courtesy [DuckDuckGo](https://duckduckgo.com) 🦆. This is super cool, because you can just tell Crush what you’re looking for and it will reach for agentic fetch and get to work! Agentic fetch is especially good here because it hides the search-related context from the main model, reducing the context in the your main session and keeping the agent focused.

<p><img src="https://github.com/user-attachments/assets/cbd58adb-9144-4fa9-a41d-8c8b4e056712" width="700"></p>



<details>
<summary>Here’s a detailed image what it looks like in action.</summary>
<img width="1024" src="https://github.com/user-attachments/assets/67a6ac7a-e439-4176-8ba1-4674db737a95" />
</details>


## Tools and Images

Crush now supports tools and MCPs that return images, such as [Playwright](https://github.com/microsoft/playwright-mcp), everyone’s fave webdev tool. This opens up lots of web agentic coding possibilities. Why look at images when computers can do it for you!

<p><img width="900" src="https://github.com/user-attachments/assets/d9d85c99-ba2c-4921-91dd-51d800b5a404" /></p>

<details>
<summary>Here's how it looks with Playwright</summary >
<img width="1024" src="https://github.com/user-attachments/assets/75bba252-04e0-41cb-9a38-f2728bb61c1b" />
</details>

## Gustave FTW

Also, many bug fixes were merged, many by a hot, new first time contributor @Gustave-241021! That you, Gustave for all the awesomeness! ✨ 

See ya next release! 💘

## Changelog
### New!
* db22f2f0a9dd1d340edd4546bb807e1d99524c59: feat: add web search (#1565) (@kujtimiihoxha)
* bbd0887700f277df7b6f76d4435f688995757923: feat: support image results from tools (#1549) (@kujtimiihoxha)
### Fixed
* 70a4fa178a7898e9f2e41077c59d5b55133b7c03: fix(list): cap rendered filterable list while keeping full search set (#1492) (@jamestrew)
* 95b9a4298e1a23c20a5023b41565c3d797530753: fix: faster shutdown (#1570) (@caarlos0)
* da5c2839d7a682e217cc443b9e54e2713c6eb3cb: fix: ignore mouse clicks when `isProjectInit` is active (#1561) (@Gustave-241021)
* 8ab8324be9bfa66240d3d30a22a0e1122c6c8a65: fix: prevent nil pointer dereference when updating agent model  (#1560) (@Gustave-241021)
* a0e1bf138ca9e8430e37cd405df5a166c24b2b6f: fix: update MultiEdit permission desc to reflect actual applied edits (#1564) (@Gustave-241021)
* edf63666b85386e757b8d5cbbd41d5dcefe65d61: fix: use visual width instead of byte length for text truncation (#1562) (@Gustave-241021)
* c65ec47d6c16d49f6a1661638c6cb6f2a38a3fb2: fix:prevent crash when pressing ctrl+f on model selector (#1573) (@Gustave-241021)
### Other stuff
* 31c221187af6f4a42ce1e6e91665c1576cd53e31: chore: fix fantasy version (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.22.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.22.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.22.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.21.0 — 2025-12-04

# Parallel tool calls, better GLM, and a hot, new prompt

This a _great_ release with a bunch of nice things. Let's get into it!

## Let’s do everything at the same time

Waiting for stuff sucks. Now Crush can run parallel tool calls to shred through tasks. Let's get to work!

<img src="https://github.com/user-attachments/assets/47dd78ed-7389-460b-96a3-6ac04f228bd2" width="600">

## GLM is short for Great Large Model

There are lots of Crush users using GLM-4.6! We did a series of optimizations in this release to improve the general experience for that family of models. Enjoy and let us know how it works for you.

## Prompt improvements

We tuned the system prompt to work better across models in general. See a model misbehaving? Let us know.

There's more good stuff coming. Stay tuned!

xoxo,
💘 Charm

## Changelog

### New!
* e0bfd35b4d87b0cbfe08e885464be11bd09910a4: feat: allow tools to run in parallel (#1543) (@kujtimiihoxha)
* 2c97eb8a5ba3a25d4ebc703cb2ed154b8c7afd42: feat: show progress bar on iterm2 and rio (@andreynering)

### Fixed
* 7272a90ed5f5036b69acd4e800abab26b3ace67e: fix: add ValidArgs and Args to login cmd (#1540) (@caarlos0)

### Other stuff
* 431d6fb4e380ac0157020d716d6bef51246386b2: chore: bump ultraviolet to fix rendering issues with unnecessary cursor movements and erasing line background color (@aymanbagabas)
* 5c96ab406c57136ac57505e831097daccc4abf93: chore: improve prompt (#1502) (@kujtimiihoxha)
* 54204dab0c6c245e32557ce9227345249d11e241: chore: improve zai tool calls (#1551) (@kujtimiihoxha)
* 8173d58fe538517d176a26cdee91284776fcddbd: ci(labeler): add copilot label (@andreynering)
* 59a4b4759e7f9ca79555047ef26f97659d860938: refactor: use contains any (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.21.0/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.21.0/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.21.0/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.21.0/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).

## v0.20.1 — 2025-12-01

## `crush login claude`

A few people had trouble authenticating with Claude Code Max when running Crush via SSH, tmux, etc. because it's not always possible to copy the URL to the clipboard or open the browser. We added a `crush login claude` command so you can do it via the CLI instead of the TUI.

* 2b222e3d951d317389f361f8f12be0fbc77267eb fix: remove `max_tokens` minimum requirement to fix json schema issue (#1532) (@masroor-ahmad)
* d898662d3e37b0a88be032da68d914b8ff168ac6 feat: add `crush login claude` command (#1537) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.20.1/checksums.txt) and the [`checksums.txt.sigstore.json` file](https://github.com/charmbracelet/crush/releases/download/v0.20.1/checksums.txt.sigstore.json) files, for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.20.1/checksums.txt'
wget 'https://github.com/charmbracelet/crush/releases/download/v0.20.1/checksums.txt.sigstore.json'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle 'checksums.txt.sigstore.json' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.19.4 — 2025-12-01

# Post-Holiday patch

Two small fixes made by community. @thezbm made <kbd>c</kbd> work on the model filter again, and @Amolith made multi-argument `$EDITOR` (like `export EDITOR="zed --wait"`) work as expected.

## Changelog
### Fixed
* 4f37cff65d79273b67faa83b1b1f78a69b8fddaa: fix(editor): fix opening `$EDITOR` w/ and w/o args (#1520) (@Amolith)
* e5639f03895140587312d55d056a5e22c36249a6: fix: fix `c` key not working in model filter (#1534) (@thezbm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.19.4/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.19.4/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.19.4/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.19.4/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.19.3 — 2025-11-29

# A small fix for Claude Code Max

Claude Code Max tokens last 8 hours. Crush refreshed that at boot only, but if you kept Crush open for that long, it would eventually expire. We'll now refresh tokens automatically without a restart.

### Fixed
* b621f9312f4e7677062e3dec2028091279ba4b2d: fix: refresh oauth token in the background (@raphamorim)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.19.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.19.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.19.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.19.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.19.2 — 2025-11-26

# Minor Holiday Patch

You know what would suck? Trying to use a broken Crush during Thanksgiving hacking time. On that note, here's a quick patch to fix a couple small regressions.

The first being a UI rendering glitch where Crush won't show the UI until it receives an event after it resumes from background. The second one is related to Crush getting stuck when you try to open your TUI `EDITOR`, oof! That's all 😄 

Anyway, happy Thanksgiving. Or, if you're not in the US...enjoy your Thursday?

## Changelog
### Fixed
* 9b1ec537337706c42683d081b8a67ebc3f00cd8d: Revert "fix(editor): fix opening `$EDITOR` when it contains arguments… (#1519) (@aymanbagabas)
### Other stuff
* 5ab204873d6d785733de241d929e96aa8470ed99: chore: update bubbletea to fix restoring terminal first render (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.19.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.19.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.19.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.19.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.19.1 — 2025-11-26

# Stability release

We don't want to ruin your vibecoding during Thanksgiving, so here's an extra release with a couple of bug fixes, including one by our frequent contributor @Amolith.

## Changelog
### Fixed
* 9f536ba81f79d4bbe10def517815ee1d4dd99372: fix(claude): simplify code and fix potential unauthorized error (@andreynering)
* 77da29d673bd2d01a80849821db06f0e6444010d: fix(editor): fix opening `$EDITOR` when it contains arguments (#1481) (@Amolith)
* 3a5375faf49699ce47ed05ef30e1eab02f1b06b9: fix: fix `h` and `l` keys not working on models filter (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.19.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.19.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.19.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.19.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.19.0 — 2025-11-26

# We hear ya: Claude Code Max support is here

You can now use your Claude Code Max subscription in Crush. Just select your favorite Anthropic model and you'll be prompted to proceed with the authentication flow.

Happy coding! 🚀 

<details><summary>Screenshots</summary>
<p>

<img width="556" height="402" alt="Screenshot 2025-11-26 at 11 35 47" src="https://github.com/user-attachments/assets/1a3af58f-220d-4f2b-a0c4-d46ece26a363" />
<br>
<img width="554" height="179" alt="Screenshot 2025-11-26 at 11 35 54" src="https://github.com/user-attachments/assets/48b24073-1131-49d5-b764-cde1e998ae03" />
<br>
<img width="551" height="178" alt="Screenshot 2025-11-26 at 11 36 05" src="https://github.com/user-attachments/assets/0721be00-e433-494f-8b60-0deaeac11236" />

</p>
</details>

## Changelog
### New!
* 191a6c803e51093faa45af6c1352411dc48bc1db: feat: add support for claude code max (#1514) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.19.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.19.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.19.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.19.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.6 — 2025-11-24

# A Little Release for Arch Linux, btw

Hi! This mostly just a release to re-trigger an AUR release to fix an issue with the AUR package. See you next release! 💘

## Changelog
### Other stuff
* a34a8a3291fb8db97903acc43b3a136c75d5def8: chore: swap error related logs to use error log level (#1505) (@tauraamui)
* 303bf8c846660c4a7c295a0a154354d8f0c4413b: chore: update bubbletea to use string view content (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.6/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.6/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.6/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.6/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.5 — 2025-11-21

# There’s an update, WE GET IT

This is a tiny release to reduce the update notification time on screen from 30 seconds to 10. That’s pretty much it.

Have a good weekend and go outside! 💘

## Changelog
### Housekeeping
* b363612510b0d5071a7d4e5643682ddb003728d3: chore(ui): adjust status notification details (#1490) (@meowgorithm)
* 7b4691ea9120343c93109cd1d92ba88260cf676d: chore: add gopls settings from Carlos's dotfiles (#1424) (@meowgorithm)
### Docs
* 281e7fa203f378fda7f0ab59dfa87eebfd8daed1: docs(readme): update "aws bedrock" to "amazon bedrock" (#1478) (@micahwalter)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.5/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.5/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.5/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.5/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.4 — 2025-11-19

# Kimi for Coding!

Did you know [Kimi has a subscription plan for coding](https://www.kimi.com/coding/docs/en/)? This release adds support for exactly that.

Let us know how you like it and see you in the next release! 💘

## Changelog
### Fixed
* f08e8525207b456dea90d90a0bdb993564f6a62e: fix: detect version for `go install ...@main` (#1476) (@andreynering)
* 4827f4cda3ed74068b446250ab204db69f1cf7d0: fix: kimi coding api key validation (#1477) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.4/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.4/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.4/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.4/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.3 — 2025-11-19

# Google Gemini 3: So Hot Right Now

So…Gemini 3 is out and Crush has full support for it, available right now! This release adds support and improves reasoning for all Google models hosted at both Google and OpenRouter. You’ll need to update Crush for this to work. Speaking of which…

…Crush will now notify you when there is a new version available, so you can always have the freshest Crush.

See ya in the next update! 💘

### Fixed
* 42122dc2fced97e806c074593e6725b8feed5808: fix: add missing openai-compat in schema (#1461) (@BrunoKrugel)
* 8f437ac589bae52167870281279b3d7622fe6dc7: fix: don't notify update available when running local build (#1465) (@BrunoKrugel)
* c38183438c27b1eea10e413b554c93bc1a884c83: fix: handle google reasoning (#1474) (@kujtimiihoxha)
### Other stuff
* afc8fd0be1763d68a6461df1a3b290589ebdd8ad: chore: notify about new crush versions (#361) (@raphamorim)
* 12f093d83e7dbd75df725d661959a3887868627f: chore: show a different message if crush is built from source (@andreynering)
* e53c73305cb6c3ebd5c2cf8363efd7247af62e52: chore: bump bubbles to v2.0.0-rc.1 and update textarea and help width usage (@aymanbagabas)
* fb7d5b6a93336b36e0acc570df29e03dc82969a3: style: small code style updates (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.2 — 2025-11-17

# Cybermode 2026

This is a small release with a big punch: Crush (and really, [Bubble Tea v2](https://github.com/charmbracelet/bubbletea/releases/tag/v2.0.0-rc.2)) now supports Mode 2026, which synchronizes the renderer with the rendering cycles in the terminal, resulting in even smoother rendering overall.

Other small niceties in this release:

* Assisted-by is now the default
* Small rendering edge cases have been fixed
* @novalis78 fixed a bug with tool discovery

Enjoy the release! We have lots more in the pipe. 💘

## Changelog

### Fixed
* cd3bd53d7e1ab6631244a39895028235d6dec8d0: fix(mcp): always call `ListTools` to discover available tools (#1447) (@novalis78)

### Other stuff
* 9d70d1d18c731fcbd584eefc769ea30bd09a8436: chore(attribution): default to assisted-by + email (#1444) (@Amolith)
* a2e2e64ad3dd953c1d552e38f78d093119960b61: chore(setup): model chooser language copyedit (@meowgorithm)
* ce5ffb0e24b3a5df9b868b45233e06e0da381603: chore: bump bubbletea and ultraviolet to reduce resize tearing (#1460) (@aymanbagabas)
* 3dd157cc8ed45ff25da0fc02e4bc27d8bb7002aa: chore: bump bubbletea and ultraviolet to support mode 2026 (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.1 — 2025-11-13

# OMG! GPT-5.1!

This update adds support for gpt-5.1, gpt-5.1-codex, gpt-5.1-codex-mini. Get it now!

### Docs
* 882914dcae7b52302c59c10880a5f66dc0d2923e: docs(readme): add initialize_as (#1438) (@Amolith)
### Other Stuff
* 7af916bfec670b92c6915c938bbc2fda0317b097:  chore: update fantasy & add support for gpt-5.1 (#1439) (@kujtimiihoxha)
---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.18.0 — 2025-11-13

# Alright, alright: AGENTS.md

Crush will now default to creating an `AGENTS.md` by default on new projects, instead of the `CRUSH.md` you know and love. This all in effort of standards and is another step to more closely following [that convention](https://agents.md/). If your project still has a `CRUSH.md` file, don't worry. We'll still read that if available.

Like things the old way? Want to use a different filename altogether? Cool: [you can customize the behavior](https://github.com/charmbracelet/crush?tab=readme-ov-file#initialization).

This is, of course, another feature from our hot contributor friend, @Amolith.

Thanks, and see you in the next release! 💘

## Changelog
### New!
* 4e40b4714644fd1bcb03fc3f0a74ca037f2189a5: feat(config): default to AGENTS.md w/ new setting (#1403) (@Amolith)
### Fixed
* c094eaf6c73a02e1972ce1d323175b92d4315d5e: fix(test): set a fixed attribution to avoid system prompt mismatch (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.18.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.18.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.18.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.18.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.17.0 — 2025-11-12

# It’s all about @Amolith 

Star contributor @Amolith rolled in hot this release with a series of fixes and improvements. Let's get into it!

## This Year’s Model

There are a lot of models available in Crush. If you’re like @Amolith you usually switch between a few of your faves—and now that's a lot easier to do as your recently chosen models are now automatically collected at the top of the model chooser. It's quite handy!

<img width="750" src="https://github.com/user-attachments/assets/31b4b279-45c1-4f09-a239-eb78c0cb1cdc" />

## Assisted-by is the New Co-Authored-by

The Fedora Council recently put together [some guidelines for disclosing AI assistance in open source](https://docs.fedoraproject.org/en-US/council/policy/ai-contribution-policy/). We think the guidelines are really cool, and so does @Amolith—and he took it upon himself to make this vision a reality in Crush.

```
Assisted-by: Claude Sonnet 4.5 via Crush
```

This is currently opt-in, and the behavior is [customizable](https://github.com/charmbracelet/crush?tab=readme-ov-file#attribution-settings).

## Other Stuff

@danielmerja, @caarlos0, and @kujtimiihoxha rolled in hot with a bunch fixes and, of course, no release would be complete without the fine detail work of @andreynering. Cheers everyone, and thanks for the contributions.

Let us know what you think and enjoy the release! 💘

## Changelog

### New!
* 7b47c6ccf32072aeeac39004d72401b46c751f7b: feat(config): add trailer_style option (@Amolith)
* 27093ea42e1fe96bb99d84b62b68978d8e3156c2: feat(config): migrate deprecated co_authored_by (@Amolith)
* fa283472586b87236abf101bff15b42ffde4d600: feat: recent models section in picker (#1374) (@Amolith)

### Fixed
* 425d873242950cc313bb0a40561ebc7f4ba87eff: fix(bash): use model name instead of ID (@Amolith)
* 5a7c715414e0b77e68bf5ce5ae5bf4dbc4afc241: fix(mcp): client being killed (#1419) (@caarlos0)
* 665ee069cf9b6e15e7b520b7cef4ed5564132c6f: fix: append `ImageURLContent` part in `unmarshallParts` (#1387) (@danielmerja)
* e9b30f720f6a369798438388d415b9891e7b2d10: fix: recent models test (@kujtimiihoxha)

### Docs
* 025d6041ed4d19a884fbf9abb9a1ca59c4282ea9: docs(readme): move "local models" section to be under "custom providers" (#1402) (@andreynering)

### Other stuff
* c9ca0b72e657d761bec0f7c9d5ba16f9c4e8b260: chore(task): fetch tags before installing (@meowgorithm)
* 02329dc80bad5bd340ad3761f2fd36ecf4ba4a3b: chore(taskfile): add task to record all cassettes (@andreynering)
* b095afd649295d86d9c1d74cfa7ee7b345195c08: chore: record all cassettes after fantasy update (@andreynering)
* 4e244de616891a49f9535a093b87cd4fb329bb99: chore: update fantasy to v0.2.1 (@andreynering)
* ef1990a520259dfde9a83e39a861368156d51adb: refactor(bash): make whitespace conform to spec (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.17.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.17.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.17.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.17.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.16.1 — 2025-11-07

# Small Quality of Life ™️ improvements

Some highlights of this release, mostly focused on QoL:

* When an API call to the provider fails, we're now presenting more useful error messages. (We want to improve this even further with time!)
* In the same area, a bug was fixed for some OpenAI compatible providers where errors were basically blank. We're now showing a meaningful error message so you can better understand what gone wrong.
* Retries were happening more times than we intended. This is now fixes and the relevant errors (too many requests, etc) will be retried up to 2 extra times only.
* Some rendering fixes were made on the TUI.

Have a great weekend!

## Changelog
### Fixed
* 07a4738eecdf33e66e659e0a77ad70db21aaea0d: fix: improve ux for presenting errors from providers (#1388) (@andreynering)
### Other stuff
* 87df66ddc0f9a21af2529738572dc9e73c73f66c: chore: upgrade dependencies and fix related code (#1404) (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.16.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.16.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.16.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.16.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.16.0 — 2025-11-07

# Jobs!

The big, new feature today is background jobs! Crush can spawn and manage background jobs. Spin up servers, run parallel builds, and go crazy. The asynchronous world is now at your (LLM’s) fingertips.

Let us know what you think! 💘

<p><img width="850" src="https://github.com/user-attachments/assets/c36041c5-9a0d-497e-b584-4a5bd8b9f2f6" /></p>

## Changelog
### New!
* 4401d5b37f037b712d5b493bb94ba04f5bb6be3c: feat: background jobs & remove persistent shell (#1328) (@kujtimiihoxha)
### Other stuff
* a8f90ff06ce66abb19b7e9a847cf20d8e60ef67c: chore: remove flaky tests (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.16.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.16.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.16.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.16.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.15.2 — 2025-11-06

## Finally, a model chooser hotkey

This small release makes <kbd>ctrl+l</kbd>/<kbd>ctrl+m</kbd> open the model switcher for you to choose your favorite model. Use them keys!

## Crushing the Renderer!

We pushed a small fix to resolve rendering glitches on some terminals where Crush would start with a blank screen until a resize happens.

## Changelog
### New!
* 530690734d636ea62d6092f4adad1278fe6d7d1b: feat(ui): ctrl+l/ctrl+m to open model switcher (#1274) (@caarlos0)
### Other stuff
* 557bfa7c0f441560721251a6680555ac61c6481e: chore: upgrade bubbletea to fix rendering issue #1389 (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.15.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.15.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.15.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.15.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.15.1 — 2025-11-05

# Perf Hotfix

This release fixes an issue where terminals not capable of rendering truecolor would spend some extra CPU cycles processing things. Let's keep things cool!

Special thanks to @aymanbagabas for going deep.

xoxo, Charm 💘

## Changelog
### Fixed
* 323c8cdaa15ddec44572af515a1887772a1c6a58: chore: fix: upgrade dependencies and fix rendering on non-tc terminals (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.15.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.15.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.15.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.15.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.15.0 — 2025-11-05

## Fetching with Agents + UX Stuff

We're so excited for this release! It brings a new tool for agents and some UX improvements. Read on for more.

## New Tool: Agentic Fetch

Now you can pull stuff down from a URL with a subagent. This means that Crush can reason about the content it fetched from the URL, and keep going until it finds what it needs.

<p><img width="600" src="https://github.com/user-attachments/assets/25a562ac-d847-4732-9648-6bc1e6ab486e" /></p>

The non-agentic fetch tool is still there, too. If you’d like the agent to choose one or the other, just ask.

## UX Updates

We made two UX changes in this release courtesy star-contributor @Amolith.

1. You can now press <kbd>/</kbd> in an empty textarea to show the command palette will show. You can, of course, still press <kbd>ctrl+p</kbd> anytime to show it as well.
2. <kbd>@</kbd> now opens the filepicker (instead of <kbd>/</kbd>), as `/` felt too much like the start of an absolute path.

## See You Soon!

Let us know what you think about the release in [Slack](https://charm.land/slack), [Discord](https://charm.land/discord) or GitHub. See you in the next release! 💘

## Changelog
### New!
* 51a2144e772461a111a5d0bfffdf812ef3252555: feat: agentic fetch tool (#1315) (@kujtimiihoxha)
### Changed
* 757d8232d86649129ddb590948c46df0e2fbdbbf: feat(tui,chat): use @ for files, / for commands (#1377) (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.15.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.15.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.15.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.15.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.14.0 — 2025-11-04

# The most v0.14.0 release yet

How's it going? This release is a good mix of big and small things.

## MCP Prompts

Did you know MCP can support stored prompts—essentially templates for doing MCP things? Welp, now Crush now supports them. Press <kbd>ctrl+p</kbd> to open the command prompt, press <kbd>tab</kbd> to move the second tab marked MCP.

<img width="600" src="https://github.com/user-attachments/assets/14d5008a-aa0d-4ee2-a607-d8296b3459a2" />

## Windows users: pretend you’re on Linux

If you'd like, now you can put your config on `%USERPROFILE%\.config\crush\crush.json` just like on Darwin and Linux. Cool, huh?

## Bonus

* `crush run` has always been a little off for interactive use. We issued a handful fixes and improvements to make the user experience better when you're in a TTY.
* On Ghostty and the Windows Terminal, Crush will now send loading feedback while starting up

## Thank you!

Thanks so much for all your feedback! See ya in the next release (i.e. tomorrow). 💘

## Changelog
### New!
* 4ca34bbcdd91a906069999a83f6c3ee0fcff2fa6: feat(mcp): refactor, support prompts (@caarlos0)
* 0182d943911ceba6fef0c7444d3e6acdf5b2ef50: feat: show progress bar on boot for feedback (#1371) (@andreynering)
### Fixed
* fc128be5fcc377e526ebc328b40c5d586d0eb910: fix(catwalk): improve fetch logging message (@andreynering)
* e519d6fe2a48210ab563dff92f2ca8da8c796d94: fix(mcp): tool/prompt list update (@caarlos0)
* 2fd5ab2ebcd5245c7377bb575533c71eb58b12ce: fix(noninteractive): always print newline after output (@meowgorithm)
* 339857700a871ce9d908b8b3eead6b4a06a832ed: fix(noninteractive): spinner text on light backgrounds (@meowgorithm)
* 60ca35fa116b4f897e7d0d443fd66b427efe7591: fix(noninteractive): strip leading newline from assistant responses (@meowgorithm)
* 5d011730c39013e00332757c3b90ed5d7eb66411: fix: handle delayed mcp init (@caarlos0)
* a2f7cbbfb3b1ba1715095161f22b21482396b06c: fix: improve code (@caarlos0)
* a074fa94725acc538fa0a92dd262c055320325ec: fix: missing handle call (@caarlos0)
* 927221886008fcf0aae0fdd681b4575c962edd78: fix: rethink global config path on windows: use `$HOME/.config` (#1352) (@andreynering)
### Docs
* 29a73e1181828f8de1d69228946700d1cf2fdf5f: docs(readme): improve mcp example to have the real github url (#1378) (@andreynering)
### Other stuff
* 389a6ab86b752a989b6f55b0d05c20afe284efde: chore(noninteractive): accept a writer for output (@meowgorithm)
* ac8017516fab5280d78d4cfef20e24c7e7520019: chore: switch from bar cursor to blocky cursor (@meowgorithm)
* 88c88c65059f0c4821c84680bbb940ce356040ee: refactor(agent): clarify user-initiated cancellations and denials (#1368) (@Amolith)
* 449de92d283aa41575befa57fee49a9210034f31: refactor(catwalk): remove stale helper to avoid confusion (@andreynering)
* 54076c0536cccf25cd23a2cf9811d51fdd14c7f4: refactor(mcp): some more decoupling (@caarlos0)
* c65899425cdcf55fe3313f9ab39a36cca5d3b968: refactor: simplify `home.Dir()` (#1353) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.14.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.14.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.14.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.14.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.7 — 2025-10-31

# Perf ⚡️ and more!

Hi! We have two solid items in release. Read on!

## Rendering goes brrrrrrrrr

This release was all about improving Crush’s rendering speeds. Crush will now render much faster, especially when scrolling through the conversation. This also means that Crush CPU usage should be lower, particularly in big, long sessions. Go crazy!

## Azure in the Age of Reason

We also made the full OpenAI feature set available to models at Azure. In particular, you can now choosing reasoning (Low! Medium! High!).

See you in the next release. We have some fun stuff coming next week! 💘

## Changelog
### New!
* df4d66b410a70f1a8d00c71346dbf3f1bf6c2f5a: feat: keep successful edits even if some fail (#1327) (@kujtimiihoxha)
### Fixed
* f6e82a40baf297c757ca9ff7f0c8749f6192ca43: fix: address panic due to possible `nil` map (#1348) (@andreynering)
### Other stuff
* be68f48142105f339594e8ca34873a755bf83c6e: perf: significantly improve list performance (#1325) (@kujtimiihoxha and @raphamorim)
* 83acb62f3068a5a4cb0e7b237a83a8dea42646a5: chore(.gitignore): ignore `/tmp` dir (@andreynering)
* 07eb36c9a8b3467915909efdca28c606a0590fd4: chore: gramatical edit (#1350) (@meowgorithm)
* c467d135f93d7ea9d9d52cbebf39576dda5a4362: chore: improve azure support (#1351) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.7/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.7/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.7/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.7/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.6 — 2025-10-30

# A few minor fixes

When bugs happen, we fix ’em. 🐞 💥 🔨

* Fixed tools not working properly with `crush run` (non-interactive mode). By the way, have you tried this mode?
* We'll only use built-in version (Go implementation) of the core utils on Windows from now on. They exist so Windows gets support for commands like `cp`, `rm`, `mv`, `mkdir` and many others. On other platforms, we'll actually use the system version to guarantee 100% compatibility.
* A couple of rendering and UX fixes.

Stay tuned! We have more prepared for the near future. 🚀 

## Changelog
### Fixed
* 04bc0154c1209b9a1dede09795a0b145cfa58a42: fix(ux): fix crush logo flicker on window resizes (#1338) (@andreynering)
* ae70537ec536ed026614f17e88ebffed7d1b11ff: fix: fix broken tools on `crush run` (#1333) (@andreynering)
* 569044c5a03f1be9313f39f27ccae5b58f46bafa: fix: only enable built-in core utils by default on windows (@andreynering)
* a885da8d90e383d256083ee5c92bcd72820da14b: fix: upgrade bubbletea to fix rendering issues (#1340) (@aymanbagabas)
### Other stuff
* b9e41f8cb9ea66a3ca5c37b8d4325a9375cef830: refactor(shell): some small code adjustments (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.6/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.6/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.6/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.6/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.5 — 2025-10-29

# Notifs, now less crazy

This release fixes an issue in iTerm2 where progress events would be triggered as notifications. Thanks to @melgu for reporting the issue!

Also, a bonus: permission dialog sizes are now responsive, courtesy @jamestrew.

We really appreciate all the contributions, feedback, support and positive vibes. Keep it coming! 💘

## Changelog
### Fixed
* 05577de71848be1bae6f9684ddcec280c18fa7ec: fix(tui): disable progress bar for unsupported terminals (#1329) (@aymanbagabas)
* 7b4cb401563a102eb72b60cac5bd184849ff90a5: fix(tui): make permissions dialog height responsive to resize (#877) (@jamestrew)
### Other stuff
* cf6beffc65926f90d359bc4c07a27776b6893b21: chore: add vcr cassette files to `.gitignore` (#1332) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.5/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.5/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.5/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.5/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.4 — 2025-10-29

# OpenRouter key validation: fixed

This release fixes a regression with OpenRouter key validation in the UI. Cheers! 💘

## Changelog
### Fixed
* 2834bf7402c622e5087a0a749d67ae9e86531915: fix: openrouter key validation (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.4/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.4/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.4/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.4/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.3 — 2025-10-28

# It's time to tidy up Grok 4, multi-tool calls, and more

This release fixes for some bugs and regressisions found since v0.13.0, including

* Restore xAI Grok 4 functionality (https://github.com/charmbracelet/catwalk/pull/92 by @andreynering)
* Restore llama.cpp + gpt-oss functionality (https://github.com/charmbracelet/crush/issues/1314, https://github.com/charmbracelet/fantasy/pull/50 by @andreynering)
* Fixed issue that could show when doing multiple tool calls at once (https://github.com/charmbracelet/fantasy/pull/48 by @kujtimiihoxha)
* Ensure that the `system_prompt_prefix` setting is always used (https://github.com/charmbracelet/crush/pull/1311 by @kujtimiihoxha)

Keep crushing! 🚀 

## Changelog
### Fixed
* 68fcf9f69dcea38b8e8ed245447d76838d32ab61: fix: update fantasy and catwalk with fixes (@andreynering)
* fd5f8308a06ced43b33b6fd98f0e7e604695e79c: fix(test): normalize file separator to make vcr cassette match (@andreynering)
* d32831ebad27f6d4a883551aa4c1b1d1a96286a2: fix(test): normalize output of download tool to make tests pass on windows (@andreynering)
* 019b7a201164a53f22c8fc1240576a08515cc11d: fix(tools): fix handling of abs paths on windows (@andreynering)
* e159237eff40318531452df57361353736b91de8: fix: add prefix if exists in all calls (#1311) (@kujtimiihoxha)
### Other stuff
* 311605de3a9b57fd8ddbe76b6c627115342c225c: chore: update fantasy (#1316) (@kujtimiihoxha)
* 092ff22de311b8b38c49c56b2f6e51561eb09719: fix(agent-test): instruct the model to not output the file timestamp (@andreynering)
* 133f6980c8a07ec25d54520727a6164128645518: refactor: make test code a little bit cleaner (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.2 — 2025-10-28

## Tidying Up

This tiny release corrects the package manifest (i.e. `go mod tidy`). See ya later! 💘

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.1 — 2025-10-28

## Quick Little Hotfix

This releases fixes a provider-level panic. Thanks for the heads up! 💘

### Fixed
* 0374b7cf46d88967375478fb302ccdaa8861c316: fix: fantasy nil panic (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.13.0 — 2025-10-27

# A smarter, stronger Crush

Hi everyone! 👋 

This new release includes a significant refactor on Crush internals:

* Crush is now much more resilient on the provider level and  is now powered by [a new library](https://charm.land/fantasy) we've developed to normalize agentic workflows across providers.
* System prompts, tool calls and other important pieces were also tweaked to generally improve Crush’s behavior.

As a result, Crush should now to perform better on the provider-model and system prompt levels for better speeds, lower token usage, and better output across the board.

## Config update for OpenAI-compatible providers

If you have any custom providers that use an OpenAI-compatible API, we highly recommend updating its `type` on the config from `openai` to `openai-compat`. With this, Crush will now behave better with these providers, with extra features that were previously unavailable.

```jsonc
{
  "$schema": "https://charm.land/crush.json",
  "providers": {
    "my-custom-provider": {
      "type": "openai-compat",
      // ...
    }
  }
}
```

> [!NOTE]
> If you have a custom provider that is just a proxy or router through the actual OpenAI API, please keep the `type` as just `openai`.

Do not hesitate to reach out on our [Slack](https://charm.land/slack) and [Discord](https://charm.land/discord) servers if you have any feedback! ✨ 

## Changelog
### New!
* bc3858f8707b4bfc227ddcb42803103553a25ca7 feat: refactor providers and improve system prompt (#1171) (@kujtimiihoxha and @andreynering)
### Fixed
* 139749a72edef70d96a4521273e715a3bdd2f04c: fix(tests): remove embedded providers, regenerate fixtures (@kujtimiihoxha)
### Docs
* 85c57a4148d441edb448efd34c0e194cd33c02fe: docs(readme): add note section about `openai` vs. `openai-compat` (@andreynering)
### Other stuff
* 14ca920d1a50f1217735e3824780d602e467253a: chore: change providers url in the log (@kujtimiihoxha)
* f1b0dbb476efd7379aa6502469f742b3b2880baa: chore: clone headers (@kujtimiihoxha)
* a314610c516f4eb8c7d4c1a5acbe38f402e33f31: chore: do not override old headers (@kujtimiihoxha)
* 847cbbead0e0168eaa013bcfa6e2d0564d57b6a9: chore: do not prompt for init when empty (@kujtimiihoxha)
* ca09597f2af00c967f1b544fc197691af5a387bf: chore: do not respond with error (@kujtimiihoxha)
* 13d75fe32b176a020cf332d1947336d1fe95f6c3: chore: improve edit instructions (@kujtimiihoxha)
* ec9f94fb6c48cc86f836e03c487c0670f212aeef: chore: improve initialize (@kujtimiihoxha)
* 2aedcb7fad6f06c747b3f4b80851d1d5b6c11fef: chore: improve summarize logic (@kujtimiihoxha)
* 780459f7ee9e6a15b634f0f5d057e3a0889c4567: chore: make thinking mode persistent (@kujtimiihoxha)
* 5d42049cb3cb7fad053dd07d005dc32f0cdabced: chore: more prompt improvements (@kujtimiihoxha)
* 042725f1e262c675674da6aa879567d2b18b37b8: chore: small fix (@kujtimiihoxha)
* a3e699de52c16af60575e41877526b3cf57de0e5: chore: small fixes and catwalk update (@kujtimiihoxha)
* 342bc9e26adfc8cf8e6e727e6b9f9afa0c439d62: chore: update docs (@kujtimiihoxha)
* f172aaa25faba5a9dbc2cbd719c5851f271ec0dc: perf: init coder agent in a goroutine (#1289) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.13.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.13.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.13.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.13.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.12.3 — 2025-10-24

# A small fix for AWS Bedrock

Since v0.12.0 we had a regression on authenticating with AWS Bedrock specifically when using `aws sso login`. This is now fixed!

## Changelog
### Fixed
* 9d5a6d0384d4ff8b11cface340d001433e5d570d: fix(bedrock): update anthropic sdk with fix for aws sso (#1297) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.12.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.12.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.12.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.12.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.12.2 — 2025-10-23

# Bumpin’ the Internals

This is a small patch that mainly upgrades Bubble Tea to the awesome [v2 Beta 5](https://github.com/charmbracelet/bubbletea/releases/tag/v2.0.0-beta.5) and fixes some minor odds and ends.

Stay tuned! We have some really good stuff in the pipe! 💘

## Changelog
### Fixed
* 9f2c7d096bcc8b524f25ed011620f8f2d08c212d: fix(logs): disable color output when stdout is not a tty (#1286) (@jamestrew)
* eba309cfb7b6ecac0a88828a53f64c02f91d1574: fix: diagnostics log double quotting (@caarlos0)
### Other stuff
* 14f2f9c703b917cb9492dcba141a4d7a2d4be2a0: refactor: use v2 declarative API (#1229) (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.12.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.12.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.12.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.12.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.12.1 — 2025-10-22

# Perf ’n Providers

Hi! This is a small but mighty mini release with two important changes. Read on for details.

## File search performance improvements

@jamestrew rolled in hot and juiced perf in the file search utility (you know, the one that appears when you press <kbd>/</kbd>). It’s _way_ better in large repos. If this sort of thing is your bag you can read more about it in #1193.

## New providers, right away

Prior to this release Crush would load provider and model updates from [Catwalk](https://github.com/charmbracelet/catwalk), the Crush model service, when starting…then not display them until you relaunched Crush. That was silly. Now updated providers and models update as soon as they’re loaded.

Thanks for using Crush! 💘

## Changelog

### Fixed
* a292b299e74ba280154a8eac5b5fb660bf4ff124: perf(list): optimize filter performance and limit results (#1193) (@jamestrew)
* 092b3515ce644dbb4fe09f5bea12414e13e4832a: fix: always fetch providers live and not in background (#1281) (@andreynering)
* 23417aaec66ce592b6f47982df54ca3f1d61a402: fix: only debug if enabled (#1279) (@caarlos0)

### Other stuff
* 7eef0b18d2548c1db74550914d38e2541d6b36d7: chore: embed version in build/install tasks (#1278) (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.12.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.12.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.12.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.12.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.12.0 — 2025-10-21

# A new tool!

Hi! This release has features and fixes in almost equal measure courtesy Brazil’s finest open source duo, @caarlos0 and @andreynering.

MCPs received a speedup, we've streamlined searching files for content, and we added better discovery of symbol references via the attached LSPs.

## The Finding References Tool

The biggest feature here is the new Find References tool which lets Crush tap into your LSP and find references with more speed and precision than the `grep` tool. If you're not using Crush with an LSP [get on it!](https://github.com/charmbracelet/crush?tab=readme-ov-file#lsps).

<p><img width="750" src="https://github.com/user-attachments/assets/ac3d0788-c01a-4378-b187-60882911bc29" /></p>

Thank you for dropping by and stay tuned for more! 💘

## Changelog

### New!
* 2708121abecf192a1c7b5e2d38ba3cdd51d3de08: feat(bedrock): add support for `AWS_BEARER_TOKEN_BEDROCK` for bedrock (@andreynering)
* a64a4def3ea855ac2c84cd0c12d165fe5098b1a5: feat(lsp): find references tool (#1233) (@caarlos0)

### Fixed
* 4519e198cc50fc8950198a19b8e6f39d68e33930: fix(mcp): improve cache hits when using MCPs (#1271) (@caarlos0)
* 015632a146db8ce0d04c989b4394f67490ad0c21: fix(mcp): make sure to cancel context on error (#1246) (@caarlos0)
* beb3bc0d8a751bdcf3a0782e118222ddc62e96bd: fix(tui): remove ctrl+d deny keybind (#1269) (@caarlos0)

### Docs
* f478c4c009aa01f42c41e614ccb5463248c7825e: docs: update aws bedrock docs on readme (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.12.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.12.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.12.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.12.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.11.2 — 2025-10-16

# We ❤️ MCP

Especially @caarlos0. He fixed a handful of MCP related bugs in this release. Now the question is _what_ is he doing with MCP?

Thanks also to @neomantra, @BrunoKrugel , and Crush all-star @Amolith for crushin’ some other bugs.

Thanks for using Crush and see you soon! 💘

## Changelog

### Fixed
* 8c9ce8e765d0b0db1e6cf8065983db19d2997a03: fix: close binding in user cmd dialog (#1221) (@Amolith)
* 69be8c20e2152d3a0c053d005013286d8bfe57c6: fix(bedrock): detect credentials set by `aws configure` (#1232) (@andreynering)
* 1a40fbabbd8cfce50824072aa3b52bafc9a56a1c: fix(grep): check mime type (#1228) (@caarlos0)
* 23e0fd441709aa040dda95d00de19ff2770ab037: fix(mcp): add type assertion guards (#1239) (@neomantra)
* ce72a48378780d5fc76da7333353348aa05502fe: fix(mcp): append to os.Environ() (#1242) (@caarlos0)
* b896a2584775d3b4f4179a2774350fee4b6313cf: fix(mcp): avoid nil errors for tool parameters (#1245) (@BrunoKrugel)
* 3a9954297f6d5c20e53d4a64335d5bccb9323792: fix(mcp): improve STDIO error handling (#1244) (@caarlos0)
* 4b1001cf3391473faf43233a10cc4240ec147eb9: fix(tui): paste on arguments input (#1240) (@caarlos0)

### Other stuff
* 05457d52a5467a1168676b8bdff802bac9cddd54: refactor: use clamp from /x/exp/ordered (#1236) (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.11.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.11.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.11.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.11.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.11.1 — 2025-10-14

# Fixed “prompt too long” errors

The last release had a small regression that could cause Crush to exceed the allowed amount of tokens for a prompt. Fixed!

## Changelog
### Fixed
* 9ffa58723de56761baef45b595f0a9e48266aa6d: fix(ls): properly handle limits (#1230) (@caarlos0)
### Other stuff
* 02cd9ab3861d611cf20870b645983ee9fe073874: chore(task): also push empty named commit in release (#1231) (@meowgorithm)
* 595c9401bb70818601dda9a483bc96402408d950: chore(task): set commit desc automatically (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.11.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.11.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.11.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.11.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.11.0 — 2025-10-13

# MCP, “Progress”, and more

This release contains a few small, powerful features, a handful of fixes, and support for that terminal progress bar thing that everyone loves.

## Progress

If you didn't think Crush could get any flashier, think again. Crush now triggers application-level progress bar in supporting terminals like Windows Terminal and Ghostty. Is that progress or what?

<img src="https://github.com/user-attachments/assets/e2e7537a-f4b5-4f46-921e-a083e320ef8c" width="620" />

## Notifications in MCP

You can just do things. That’s exactly what @linw1995 did in #967 when he added notification support for MCP. There's an awesome video in the PR where he shows Crush talking to Neovim. Check it out!

https://github.com/user-attachments/assets/aa3c5cb8-a1b1-4962-9a07-4835dd7624b3

## There’s more where that came from

Read on for all the fixes in this release. Thanks for using Crush and stay tuned for more! 💘

## Changelog
### New!
* 8c7c0db22606db51910c2a24dc15319369ce60f6: feat(mcp): notifications support - tools/list_changed (#967) (@linw1995)
* d0724b16aa37057635896d04d0032413cf7923c7: feat(tui): progress bar (#1162) (@caarlos0)
* c96abaed6b4115352e490129006dcfd165b49cba: feat: limit filepath walk, automatic low limits when not git repo (#1052) (@caarlos0)
### Fixed
* 04210801f02d2ee5db7ae89a7ec28e34d5d14d5b: fix(lsp): small UI improvements (#1211) (@caarlos0)
* 886bb7c7101ec637104d17b34dce8573e1daa5ee: fix(mcp): fix ui description, double spaces (#1210) (@caarlos0)
* a824240d128010ef52f870356dea6ba7c5b5f00e: fix(tui): fix progress not cleaning up some times (#1219) (@caarlos0)
* 4969c34d18747159dcdb2f6c8543afe3ef2c2e0d: fix(tui): panic (#1220) (@caarlos0)
* 7ac96ef0686106b53324a6901fac10a9f00e8a4f: fix(vertex): small fix for anthropic models via google vertex (#1214) (@andreynering)
* f7ffd8a884cd07ad3b59ef00e79a50b787500bab: fix: don't supress application level panics (@meowgorithm)
* a430043677c5fdf019ec0a7cc19bfc26d401b6a4: fix: move some logs to debug (@caarlos0)
### Other stuff
* fccc49f4cb9ba90027b6eda64ae7257b633def66: chore(lint): ignore staticcheck in helpful crash error (@meowgorithm)
* 8c1e3764c76b47845e066ca7a4fddd4820b2b551: chore(task): add helper for fetching tags (@meowgorithm)
* 390983a851b54d39b5812bd5aaaab2101703ca14: chore: allow to pass args to task run (@caarlos0)
* 75a602ae3bdb8d3d22cb95f294f48348e0d4a267: chore: print a bug reporting notice when crush crashes (@meowgorithm)
* ca66a11ab6293b7f598a83596f724f00e2960831: refactor(mcp): use the new mcp library (#1208) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.11.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.11.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.11.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.11.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.10.4 — 2025-09-30

# Take that, SSE MCPs

Another day, another flurry of commits by @caarlos0. He also benched 200kg yesterday, but that's another matter. Anyway, let's see what's in today's release:

## Fixed: SSE MCPs

SSE-based MCPs weren’t working right, and now they should be. Voilà. Thanks, Carlos.

## New: Crush directories and you

Carlos also added a handy CLI feature in Crush via `crush dirs`, which you can use to get information about where Crush

<p><img width="500" height="283" src="https://github.com/user-attachments/assets/ecfd27f3-07d9-4264-bd92-ce8cf1265081" /></p>

There's a handful of helpful applications for this for example:

```bash
# Open the main config file
vim "$(crush dirs config)/crush.json"

# Hose all ephemeral settings
rm -rf "$(crush dirs data)"
```

## Who is this dude?

His name is Heartbit (courtesy the mysterious @fablemodem) and you can find him in `crush -v`.

<p><img width="500" height="524" src="https://github.com/user-attachments/assets/7fcede5b-c60b-4187-8796-5d1a507d13b8" /></p>

Thanks all for now. You look great.

xoxo, Charm 💘

## Changelog
### New!
* afa10c5eb9c84e8a78233446ec4c2803b1c868d8: feat: crush dirs (#551) (@caarlos0)
### Fixed
* 6cd1733aed022fefe5ec54416c2b01d42c797288: fix(mcp): SSE MCPs not working (#1157) (@caarlos0)
* 598e2f68ea98d11c0a87a566aa4a4e79396c1825: fix(style): heartbit in --version (@caarlos0)
### Other stuff
* 53a4703c97e6a55008dd19fe663ec8738452aaf2: chore(taskfile): change `release` task to add a commit for the tag (#1159) (@andreynering)
* cfa3244a77c8eb4326bbc6c4ecb91fdc70c8693f: chore: update model chooser key help text (@meowgorithm)
* de306c21924e3ed6c174dcc8c58f771c53cdf3a4: chore: update session chooser key help text (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.10.4/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.10.4/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.10.4/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.10.4/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.10.3 — 2025-09-29

# Hotfixes: so hot today

This release corrects a status issue with MCPs and addresses stability with models on OpenAI.

Thanks for the contributions and feedback. Keep it coming! 💘

## Changelog

### Fixed!

* e762ddf8232a9ca2419f4c3c4b0417026b8d4d59: fix(agent): remove timout for now (#1158) (@kujtimiihoxha)
* 4f28c51bf5d38084c332b7383f8a927fab839c3b: fix(mcp): do not eat list tools errors (#1138) (@caarlos0)
* 107a82355d85442613e419ca5f29ac471f867c84: fix(openai): 429 insuffice not retry (#546) (@ngnhng)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.10.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.10.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.10.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.10.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.10.2 — 2025-09-29

# Mr. Quick Patch

Hi! This is another quick patch release to add stability to Gemini as well as improve the way we chunk data.

That's all. See ya in a bit! 💘

### Fixed!
* 34ff32621ccdeccc72947a9249a253a75f67a79c: fix(agent): timer should reset after each chunk (@kujtimiihoxha)
* e0c1cfcb3783edbbf50a5391c3db299042f89275: fix(gemini): use full MIME type for binary content in message conversion (fixes charmbracelet/crush#995) (@kslamph)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.10.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.10.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.10.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.10.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.10.1 — 2025-09-29

# Hotfixes coming in…hot

Life moves fast. This is a series of fixes and improvements over the past few days. Most importantly, @kslamph swooped in fast to fix an issue with Gemini (thank you!).

Other fixes include improvements to streaming (thanks @vadiminshakov!), improvements to LSP (thanks @Amolith, as always) and various other fixes around stability and dependability by @caarlos0 and @andreynering on the Charm team. What an open source tour de force!

We love you all. Keep it coming and thanks for using Crush. See ya soon! 💘

## Changelog

### Fixed
* b22fd0884367fbd59286c9bd158c4fc615f20f66: fix(fsext): panic on fastwalk (#1122) (@caarlos0)
* baf053409d1f4945513ab77ff8772c3abe150985: fix(gemini): add baseURL resolution and conditional HTTPOptions configuration (#1144) (@kslamph)
* efb77aced1e23c9363958bb04f0a747bb3a58f64: fix(gemini): add missing newline at end of file (@kslamph)
* e3240a2209b9b2f99a6fb03283fac7ca8ebe861d: fix(lsp): allow directories as root markers (#1117) (@Amolith)
* 09d8e75b7be61fb501ecd28682b5a56717db4465: fix(mcp/lsp): expand variable in commands (#1116) (@caarlos0)
* 5633f242b26e043db12004959d867406c3b71e8d: fix(provider): do not retry auth errors (@caarlos0)
* a48d4e3538ad46db534c20e8f5860789a7cf5966: fix(stream): stream hang, add stream timeout (#1070) (@vadiminshakov)
* 63eda4deeb95abdd683edb31c187de22d5ac3dc5: fix: improve retry (@caarlos0)
* c8bdb0b659cd98bd4ef537d7a77b3ab66645ef19: fix: improve shutdown (#1133) (@caarlos0)
* 2cc3fe25d95f22bdf336955fca2ec1299465e895: fix: strip path from `$SHELL` (#1119) (@andreynering)
* 9365343e4f1c16e695029026ff7a97ba6320d73f: refactor: use http.Status... consts (@caarlos0)

### Other stuff

* 9fd7f48e07bb6231676c6891879ee510e81cdd0d: chore(metrics): better identifier fallback (#1130) (@andreynering)
* a6a4fa7e419fc9c9ba0ed3d530120d25b0e355b2: chore: add name for helper tool name resolver (@tauraamui)
* 51cee9e947104ece95de6553bd06ce4f1d3cc866: chore: add task release (@caarlos0)
* 5f7c46dd1418f8ce7c7f11aeed7e278a1592f799: chore: fix version (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.10.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.10.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.10.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.10.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.10.0 — 2025-09-24

# Odds and Ends, Hugging Face, Metrics and a Star-Studded Cast

This release has a bunch of small quality-of-life features—largely from the community—and a barrel of bug fixes.

## Thanks, community!

@caarlos0 went ham and merged a bunch of feature, fix and housekeeping PRs from the community. We’re so floored with your highly-quality contributions and we’re honored you’re spending time in the Crush codebase. Thank you!

## Hugging Face

We all love [Hugging Face][hf], and their commitment to open source models is very much in line with our ethos. With that, we're happy release adds support for [their inference layer][hi].

<img width="600" height="806" src="https://github.com/user-attachments/assets/a122dc3e-8657-420c-8f36-a0ea03279410" />

[hf]: https://huggingface.co
[hi]: https://huggingface.co/docs/inference-providers/en/index

## Metrics

This release adds pseudoanonymous usage metrics (via a device hash) to help us inform development and support priorities. The metrics solely include usage data; prompts and responses are never collected.

For details on what’s collected, and to opt-out, see the [README](https://github.com/charmbracelet/crush?tab=readme-ov-file#metrics).

## Thank you

Thanks, as always, for your contributions, feedback, good jokes, and great vibes. See you next release! 💘

## Changelog

### New!

* 6b161d29e9832fe1abafea231d7947e03d76f574: feat(config): allow custom providers of type gemini (#585) (@kslamph)
* 701e550fbb7f94ef29002cd92b6c18d8ad5a883d: feat(config): search`crush.json` recursively up from the working directory (#898) (@bbrodriges)
* 0da5e6b17d7c3d379784fd4b43ac9d8a790a8ae4: feat(lsp): load defaults by either name or command (#1109) (@caarlos0)
* 9654218e61ff58326e4524f34086822e6d7c2864: feat(permissions): pretty-print MCP JSON (@Amolith)
* 3b6a37597433a631bcbed50c11e102b6dfeffa96: feat: add alt/option+esc binding to current esc key behavior (@maxjustus)

### Fixed!

* 831a95abf071c5837c5ba135c0545da4dc483b35: fix(deps,lsp): update powernap for zig (@caarlos0)
* 1f46a69b546885ac95b93d8c4d5b06b97cf84977: fix(grep): resolve Windows path parsing with null separation (#1095) (@zoete)
* 4926722bff84205322d2a27663b0da45c2462794: fix(lsp): command (@caarlos0)
* 4dd2b17f1116ed0481444bff894f63e80676e973: fix(lsp): improve error messages (@caarlos0)
* 2fd3b4360e011a2c5c8d81181317b85d43a21b40: fix(mcp): improve timeout errors (#1108) (@caarlos0)
* 91b6b3134a63036b1528da8e38d80bfe998c3d05: fix(mcp): pass down mcp name to logger (#1078) (@caarlos0)
* 38bde491ad1c74e34ce0e4d8f7eba82c61436680: fix(tui): yes/no init selection (#1074) (@aymanbagabas)
* ab96589e7ed71411582ae2b970ddadd1bb9d3a83: fix: disable providers (#1087) (@caarlos0)
* 1f35d54ac294f61297be4584f4ccb387207028f2: fix: lsp/mcp command expand ~ (#1105) (@caarlos0)
* 36947685bd6c205bf1c95cc68f1ee0c392b44a24: fix: remove <think></think> from title (@caarlos0)
* 47a6d0285724a7e078b4134a538cf90ebe765cac: fix: session summarization dialog hanging indefinitely (#528) (@bold84)
* fa34edc67f1c25328b3a54e01a7243ec9a64c93f: refactor: put tool descriptions in markdown files (#1077) (@caarlos0)
* 6c990b25efb2eba3111618cf5491f7eeffd8e637: refactor: remove unused prompt (#1083) (@caarlos0)

### Docs

* 976425c7b17bdd3a02ae64e9251a5c046bde7014: docs(readme): add mini Chinese description (thanks @ohjia) (@meowgorithm)
* d55f807f120bb7954e67fe9f39fb13c91464e5df: docs: add bit about nixos module (#606) (@taciturnaxolotl)
* c2d85d15612d2cb89c50341dd38f3fc1a0085fd7: docs: add huggingface inference (@kujtimiihoxha)
* 3ba15bfda8f8ce6181a5e96c77a02b914164e521: docs: aws profile/region envs (#1104) (@caarlos0)
* ee860b9ace8136ce46338073ee710822fa1fec56: docs: document more mcp options (@caarlos0)
* 00072cd29c0d789e146996027902afb4ca861f41: docs(readme): fix a typo (#1084) (@msteinert)

### Other stuff

* ef6a32453abdf3b943ef9f56800a7ec9c0135c46: chore: add metrics and error tracking (@andreynering)
* d0edf44c4fe4ad5af3f76e3c7fde694abef9fe6b: chore: home pkg godoc (@caarlos0)
* feb184d8023eb6a9a2868d0b603a45cc72c13d3d: chore: task fmt (#1098) (@Amolith)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.10.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.10.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.10.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.10.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.9.3 — 2025-09-24

This release was mis-tagged, per semver. Please see [v0.10.0](https://github.com/charmbracelet/crush/releases/tag/v0.10.0).

## v0.9.2 — 2025-09-19

# API key validation: now more validate-y

This release fixes a bug where users were unable to validate API keys for the Z.ai provider. Z.ai integration should now work as expected.

Thanks everyone for reporting this one! 💘

## Changelog
### Bug fixes and improvements
* 58eda7ccabb9a596dd4fc6920b9e2a7dce3d1ad3: fix: handle z.ai key validation differently (@kujtimiihoxha & @tauraamui)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.9.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.9.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.9.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.9.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.9.1 — 2025-09-19

# We love perf

Perf is a special kind of yak shave and, let me tell you, we're very good at yak shaves. This time @caarlos0 went in, refactored (read: removed) a class of file watchers for great good. ["Damn good deal if you ask me,"](https://github.com/charmbracelet/crush/commit/016b3b6dddf8dbafc3fd186086533edc2f9a42c5) he says. We agree.

Keep crushing it! 💘

## Changelog

### Perf
* 016b3b6dddf8dbafc3fd186086533edc2f9a42c5: feat(lsp): remove internal watcher (#1062) (@caarlos0)
* d66dfa2c92173e85d707ea20edceed7b9aba32d4: fix(lsp): use csync for lsp clients (#1073) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.9.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.9.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.9.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.9.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.9.0 — 2025-09-17

# LSP, attributions and…12,000 deletions?

Hi! This is a release with a solid LSP overhaul and nice lil' feature. Read on!

## Time for your LSP to take a power nap

@caarlos0 SLASHED AND BURNED over 12k lines of Code by implementing this _awesome_ LSP library that @raphamorim built called [Power Nap](https://github.com/charmbracelet/x/tree/main/powernap). This reduced an enormous amount of complexity in the Crush codebase and improved the LSP experience a lot! [More here](https://github.com/charmbracelet/crush/pull/1011).

Why @raphamorim named the repo Power Nap we will never know.

## Attribution, or not

@Amolith is such a pro. He's been delivering high quality Crush PRs left and right. Today he introduced a features where you could disable the Crush attribution in commit messages. For details see [the README](https://github.com/charmbracelet/crush). Thanks @Amolith!

# See u soon

Thanks for all your awesome contributions. Keep 'em coming! 💘

## Changelog

### New!
* b00ffcc671ae0cd06d3b1baf5e8c537634e46ccd: feat: LSP implementation using x/powernap (#1011) (@caarlos0)
* 6c380d4414ee83b49d04aa299ef0616b45408f26: feat: add attribution settings to config and bash tool (#1025) (@Amolith)

### Fixed!
* 898f1ee9e43d31d711b97a602db9bc152f18ccac: fix(config): look for more than just crush.md (@Amolith)

### Docs updates
* 2f73e6c017a6c551f4a9dd7979d89bccfd412152: docs(readme): mention contributing guide (#1067) (@andreynering)

### Other stuff

* 382f1ca6f6c0e564a3a722d93838ad15145eecc4: chore: fix labeler script (@andreynering)
* 0bba5af1396a605a1bc8daeb1bd68d2e02056e66: chore: task run (@caarlos0)
* 34457697efabe3fc88bee0ed84d16714e8d1af77: chore: various attention to detail edits via @andreynering (@meowgorithm)
* 11c6e4f941e7d902779b7cc1d3d9659207b8a898: ci(issue-labeler): add azure (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.9.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.9.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.9.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.9.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.8.3 — 2025-09-16

# Watcher nuances, better Gemini, and a Windows bugfix

This release add further tuning for and file watching. It also includes a hotfix for tools in Gemini (Thanks @dvcrn!) and a bugfix on Windows.

Thanks for love and support: you crush. 💘

## Changelog
### Fixed!
* e2e952b1ab297774145897de1c0d28eebda13bb3: fix: only enable watcher for git repos (#1060) (@raphamorim)
* a9d3080174b8c9995555da3a1cb2bd9b71074af5: fix(gemini): ensure tool responses have the user role (@dvcrn)
* 9a8574b5095d73bac1705896ab49f224354772bc: fix: bump fang to v0.4.1 to fix a Windows issue #1041 (@aymanbagabas)
### Docs
* 0146161bcbb8b1920cac3436c777a2dd7bf26d57: docs(readme): add cerebras API key to table (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.8.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.8.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.8.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.8.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.8.2 — 2025-09-15

# “Too many files open?” Not anymore.

Our past release included improvements when it comes to LSP. Some users notified us about a regression where Crush would error with "too many files open". This was happening in particular when opening Crush inside a directory with several files, which could be a big monorepo or `$HOME`, for example. We've done a fix for it, but we know it can still happen in some scenarios. The next release will likely include further enhancements in the area.

Thanks for your awesome support!

## Changelog
### Fixed!
* 9a132dcbf2d9019b66fca90112158ed9c1fb701e: fix: introduce notify ignore files (@raphamorim)
* de3d46bbcc232b76d714ce7800c7559342df811d: fix: make the limit really high on non-unix (@raphamorim)
* fd6b617ad5ee1f6e50f4093eb6085e19a2d57894: fix: remove ulimt as go 1.19 automatically raises file descriptors (@raphamorim)
* d401aa3a4a21de982db8752fae5ad9a4d1745b68: fix: request MaximizeOpenFileLimit for unix (@raphamorim)
* 8cae31408ea74778380e7a1ae35ae60e9d2a57ca: fix(lint): windows number formatting (@raphamorim)
* 7ff6ba95be162d727eb3b0059566192dfd5f321f: refactor: make func unexported (@andreynering)
* 18ea1c976a933abc8f716770d43943d70c2b0bca: fix: handle ctx cancel event (@vadiminshakov)
### Other stuff
* 6ec5a77ad4c479ac96c5060b4d9c560933e44e32: chore(devs): update `github.com/raphamorim/notify` to v0.9.4 (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.8.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.8.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.8.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.8.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.8.1 — 2025-09-13

# Work smarter, not harder

This is a hotfix for cases when Crush's file watcher could open too many files open in large file trees. As a side-effect of this patch, the file watcher is now _highly_ optimized, way leaner, and way more performant than before.

Special thanks to @raphamorim for swooping in with the fix in record time and making it look really easy.

Hope you’re having a good weekend! 💘

## Changelog

### Fixed!
* 544f3b722a53d4fb72424c795f5dd70d196b6355: feat: fix too many open files issue (#1033) (@raphamorim)

### Docs
* 8c0d7b692f27ba8cfef0e76e92e6c89a78aa37a8: docs(readme): copyedits to provider disabling section (@meowgorithm)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.8.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.8.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.8.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.8.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.8.0 — 2025-09-12

# Reasoning controls, “offline mode”, tool disabling and so much more!

There's a _bunch_ of good stuff in Crush v0.8.0. ⚡️

**tl;dr** you can now:

* Change OpenAI reasoning in-app
* Disable provider auto-updates and be totally offline
* Search by provider in the model chooser
* Disable tools

We also squashed a buncha bugs. Read on for more info!

## Setting reasoning with OpenAI models

For the OpenAI models that support reasoning, you can now choose which level of reasoning you want to use inside the TUI. Before this release, it was possible only by manually editing `crush.json`.

<img width="675" src="https://github.com/user-attachments/assets/155bc6b7-9f3f-44cf-bc15-21cc899eca9a" />

<!--
<img width="675" height="362" alt="Screenshot 2025-09-12 at 18 41 24" src="https://github.com/user-attachments/assets/0207da0f-fdd3-4954-8367-c7e72d076fba" />

<img width="485" height="234" alt="Screenshot 2025-09-12 at 18 41 31" src="https://github.com/user-attachments/assets/5865a7e3-e396-4930-bb04-b8b715ec924b" />
-->

## Wanna turn off provider auto-updating? Now you can.

[The most upvoted issue](https://github.com/charmbracelet/crush/issues/453) on our repo is finally closed. Some of you wanted what was called "offline mode", which essentially prevents Crush from fetching provider and model updates from `https://catwalk.charm.sh/*`. This is particularly important for users in environments where internet access is restructed. 

On this release, we're adding a setting to disable this auto-update mechanism. You can do that by adding the setting below to your `crush.json` or by setting `CRUSH_DISABLE_PROVIDER_AUTO_UPDATE`.

```jsonc
// ~/.config/crush/crush.json
{
  "options": {
    "disable_provider_auto_update": true
  }
}
```

```bash
export CRUSH_DISABLE_PROVIDER_AUTO_UPDATE=1
```

By default, when set, Crush will use the embedded providers bundled at the time of the Crush release. If you need to manually update that, we now also introduced a new command `crush update-providers` to manually run the update when you can:

```bash
# Update providers remotely from Catwalk
crush update-providers

# Update providers from a custom URL
crush update-providers https://example.com/

# Update providers from a local file
crush update-providers /path/to/local-providers.json

# Update providers from embedded version
crush update-providers embedded
```

## Better model search

The model chooser filter will now match the provider name and handle multiple words well, making it really easy to find that "one model from that one provider."

<img width="583" height="428" alt="Screenshot 2025-09-12 at 18 43 38" src="https://github.com/user-attachments/assets/358e468e-1001-402b-b47a-341a09a9c772" />

## Disable specific tools

If you want to disable specific tools for whatever reason, it is now possible by adding the following to your `config.json`:

```jsonc
// ~/.config/crush/crush.json
{
  "options": {
    // All available listed as example.
    // Only include the ones you want to disable.
    "disabled_tools": [
       "bash",
       "download",
       "edit",
       "fetch",
       "glob",
       "grep",
       "ls",
       "multiedit",
       "sourcegraph",
       "view",
       "write",
    ]
  }
}
```

## Fixed double key press on Windows

Whoops, there was  regression in the last release is fixed where, in Windows terminals that are not Windows Terminal, some key presses were being registered twice. This is now fixed.

## That's all folks!

That's all for today! Keep crushing and see you in the next release! 💘

## Changelog

### New!
* ad50cf423769b7738d53d1cf057f6999f6f64bfb: feat(config): define disabled tools option which filters out agent tools access (#1016) (@tauraamui)
* c0edda610fd7acd8234fa2cd3ec4c40f4ba6c2c2: feat: add `crush update-providers` command (@andreynering)
* 230e4de83c23292ab42598dbffa327405bcb3c42: feat: add ability to disable providers auto-update from catwalk (@andreynering)
* 3710b3c683f3c2acfde9ca103d517fa7a110a6d2: feat: add reasoning dialog (@kujtimiihoxha)

### Fixed
* 49a1e214596d7ba7b209be16ba707f2cf315e3af: fix: add else (@kujtimiihoxha)
* f186e5876751564617ebaf3facccb0f378d544d3: fix: add mcps after the filter (@kujtimiihoxha)
* 8e0d9b5b9aaed5841d44457858716de08405917e: fix: agent tool not working when switching models (@kujtimiihoxha)
* 15fe8dfd84c2a6ee398158acbc4af3f7e002c27a: fix: allow multi word search (@kujtimiihoxha)
* 6da6c7d1cf173cfd1a7c020175bd49b0615b4b6c: fix: allow searching by provider name (@kujtimiihoxha)
* 8d46cf0e51ada7596ba81a522c94c3d8fd7ff442: fix: fix agent (@kujtimiihoxha)
* fb5e0584a75a443ee7f76a52281f7e72a353e5d3: fix: fix the group search (@kujtimiihoxha)
* 6766386feddc6ce363ae51f22d1f2ba37c15c5bb: fix: handle providers that do not send unique tool call IDs (@kujtimiihoxha)
* 861db845ebe9491ea66b08047ca95470dcb4e078: fix: improve group filtering (#1024) (@caarlos0)
* bab2bec7315bf48ae9394b1330a786e0a961b38e: fix: set reasoning param when selecting model (@kujtimiihoxha)

### Docs
* dc5475f2986cb256c98e143e5d798216d5dd1f4f: docs(readme): add bluesky to socials (@andreynering)
* 04b571071999560ad975ba2a7de283cc0ba4833a: docs(readme): document how to disable providers auto-update (@andreynering)

### Other stuff
* 4561c2a0620ef75832f905400fc83b75528a0e1f: chore: bump ultraviolet to fix double encoding keys on windows (@aymanbagabas)
* 9bc8c6b7b2718a6da4858a84a8bf158d24b45d2a: chore: do not hide the reasoning content (@kujtimiihoxha)
* 9c3a1b4c2996e10f35071f56ef5056576ba9b458: chore: lint (@kujtimiihoxha)
* bd4503ee32b216df36321711fed6b0a20a743a2a: chore: provider error message copyedit (#1029) (@meowgorithm)
* c571aefa310c0a4643d7619ec0a32434ce31df32: chore: refactor (@kujtimiihoxha)
* c7d33353631a30b88cbef07cd8fb0e4c2f44ed0c: chore: remove duplicate tools (@kujtimiihoxha)
* 2e2b743eefb61ed0011d8a747d2388fc6aab7b29: chore: revert  ctx change (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.8.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.8.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.8.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.8.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [X](https://x.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.social/@charmcli), [Bluesky](https://bsky.app/profile/charm.land).



## v0.7.10 — 2025-09-11

# `ctrl+c` is back!

A bug was preventing you to press `ctrl+c` if a dialog was opened, meaning you had to close the dialog to be able to close Crush. This is now fixed!

See you in the next release!

## Changelog
### Bug fixes and improvements
* a4da218e56cfb87695723f72f2cb0eb336919a51: fix: ensure it's possible to quit (`ctrl+c`) even when a dialog is open (#1007) (@andreynering)
### Other work
* c4a976e7db184a8e0d12c0bd07a521f64f32e1c6: add buffer size (@vadiminshakov)
* 49d86a70ae6d9dbc0195bd220b3090b73c3f9b6f: chore(readme): fix build badge url (@andreynering)
* 5e366e15c2f490d9e412a221ea1d955d87cd5599: no need to check cancelled ctx (@vadiminshakov)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.10/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.10/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.10/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.10/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.9 — 2025-09-10

# LSP Perf: Juiced. Escape key: Fixed.

## LSPs: 101% better

So @caarlos0 went ham on LSP performance and **reduced file descriptors by 99%.** If you use LSPs with Crush (you should!) especially multiple LSPs, prepare to get your socks knocked off.

(Spoiler alert: if you like LSPs you’re going to _love_ what's coming up next).

## The escape key: fixed!

This release includes a fix for the <kbd>esc</kbd> key working on some terminal emulators. That was pretty annoying!

We love you. Keep crushing it! 💘

## Changelog

### New!
* 46a3a3771def1f842c7beae16d5b014def868cf1: feat: optimize lsp file watcher and ignore files (#959) (@caarlos0)

### Fixed
* d78ed25f1faa7e449303590c795692e27b93d3f5: fix: add back init setting ulimit (@caarlos0)
* 869511335b317f80f9fc64df76596dd08fe049b8 and https://github.com/charmbracelet/ultraviolet/commit/aa00947622991e417d4dc5ead1299917ffd148c9: fix: esc key not being recognized (@aymanbagabas)
* df2e64ead1cc499c222ac57ed9bab0424dfac62f: refactor(fsext): improve hierarchical ignore handling and consolidate file exclusion logic (#999) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.9/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.9/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.9/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.9/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.8 — 2025-09-09

# Windows, Multiline Paste …and You 😉 

We've been getting some feedback about users having trouble pasting multiline text on Windows. Well, after v0.7.8, not anymore. Windows users can now paste with reckless abandon!

# Secure Database Delete Operations

Thanks to @bbrodriges for noticing and taking the time to implement secure SQLite data deletion rules. This is one of the great features of SQLite that makes it such an amazing project to work with ❤️ 

## Changelog
### Other work
* 442867dc2a9fe440804d50c2af5e961e5acc23cc: chore: bump bubbletea/ultraviolet to enable bracketed paste on windows (#1003) (@aymanbagabas)
* 78540b012f6ace2a377a00daadf05176d0335ce8: security(sqlite): enable `secure_delete` pragma (#966) (@bbrodriges)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.8/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.8/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.8/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.8/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.7 — 2025-09-09

# Gotta Validate ’Em All

This is this another quick patch release to fix a bug where OpenRouter keys weren't always properly validated when being input in the TUI. Special thanks to @andreynering for the swift fix.

Thanks for all good vibes, contributions and support. We appreciate u! 💘

## Changelog

### Fixed!

* 913ea55074c698d26ab2fa69c9298b00e53d69fc: fix(openrouter): fix api key validation for openrouter (#997) (@andreynering)
* 65d8269dba1df14b856577cb0ab762659a207492: refactor: check for id instead of name (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.7/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.7/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.7/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.7/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.6 — 2025-09-07

# Gemini Minifix

This is a quick patch release to fix a bug where Gemini could spin out of control when trying to generate a session title. Now it only spins _in_ control.

Thanks for all the feedback + keep it coming! 💘

### Fixed!
* 60d85105ec8875b3a03ffec00eaa3621863408d2: fix: handle no content for gemini provider (#982) (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.6/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.6/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.6/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.6/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.5 — 2025-09-05

# Better Bash

This is a patch release that mainly updates the builtin `cd` command with better output to keep the agent from getting confused. Prior to this, the agent could try to `cd` into a directory that didn't exist and not know that the command failed.

Thanks for all the contributions and support—keep it coming! 💘

## Changelog

### Security

* 72dc56689031b5d79225e36ef6d85c6ddfcd3760: sec: show persistent shell path in permission dialog (#916) (@caarlos0)
 
### Fixed!
* 1ab4d28ce357014b1974604cb3213be597f190cf: fix: update `mvdan/sh` for `cd` command update @caarlos0 
* e76fd5488f9e72ea75784e2c4c90f9350a444b45: fix: tool calls break the conversation if interrupted. (@undo76)

### Other work

* 48553e1d677be8f06c7e7906f23121954ce6a0db: chore(labeler): adjust xai grok label (@andreynering)
* a2e89c82fb02965730366f347f91d702f0cd99f6: chore: `IsSubset` was moved to `x/exp/slice` (#923) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.5/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.5/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.5/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.5/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.4 — 2025-08-28

# xAI Grok Minifix

This is a little patch release to fix an issue where xAI Grok which wasn't behaving correctly with tool calls. Have fun with the new Grok Code Fast, available now in Crush.

## Changelog
### Bug fixes and improvements
* 2b1d87d289176346fa32fc8b0610a7f74e17a9a6: fix: handle providers that do not send the right index (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.4/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.4/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.4/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.4/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.3 — 2025-08-28

# OpenRouter: Fixed!

This small patch release fixes the OpenAI and Anthropic models when used via OpenRouter.

Thanks for using Crush, and thanks for contributing! 💘

## Changelog
### Bug fixes and improvements
* 71bca980cce575bf79b1f91e206fb941577dbfc0: fix: anthropic via openrouter (@kujtimiihoxha)
* 0c8e111af5d8bccf77d544da967c28f7df56d36f: fix: openai via openrouter (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.2 — 2025-08-27

# A Fistful of Improvements

This release is a big pass on stability and UI improvements in Crush! On the stability front, we fixed a handful of potential panics and bugs. On the UI side, we have a few subtle niceties to improve the UX.

## UI Stuff

Did you know that Crush has a file picker? You can open it by pressing <kbd>ctrl+f</kbd> and choose files (like images or others) to send as part of the prompt. It was already there for a long time, but from now on it will behave better in small terminal sizes.

Crush will now also tell you which path you are when asking if you want to initialize the current project.

## Bonus: Termux

Last but definitely not least, this release includes another small fix for the `.termux.deb` package for those using Crush on Termux for Android. Keep mashing Crush on your phones and tablets.

Thanks for _all_ your contributions. See you in the next release! 💘

## Changelog

### New!

* a378eb0f68cfd4ca94ad6416ed8e43aaedf1f5f1: feat: show path when asking if the user wants to initialize project (#867) (@andreynering)
* ae3a31fcad4e9e3f8dfe935d24ab34bec08a750f: feat: support Anthropic base url option (#702) (@wwwjfy)

### Fixed!

* 9d9372038e6b14907cdd71710e993bf9c71d3646: ci: fix termux /usr/etc instead of /etc (@caarlos0)
* 40599a04e42bd410295933e10e7547df48eb9632: fix(filepicker): general fixes to size and position (@andreynering)
* 3b9babbc87819a6ec047c6f9ab11d92d45a6ad5d: fix(lsp): simplify init/ping, store capabilities (#713) (@caarlos0)
* 15b989cfc7bc9eb4ecdd4eaf80def2b69f798388: fix(tui): further guard against type accessor and map panics (#783) (@meowgorithm)
* 4bd2cddfee45bb072623c68a9e5cd4efc138488c: fix: fix `panic` that happens on `crush run` with tool calls (@andreynering)
* d01ef3e4ed2266e3787c512eaec5f6c4832b612b: fix: fix goroutine panic due to waiting for channel for too long (@andreynering)
* 5bdccdfbbd2eec17e54ef46cfb4ccb17330dc36b: fix: fix panic with gemini via litellm (@andreynering)
* 3cd1515932ece0953a8e968ef4f3c8a9eb375560: fix: improve provider cache logs (#885) (@caarlos0)
* 6268f1e23a976041578fe3499f2271465232dc61: fix: panic at mcp config (#860) (@khareyash05)
* 3993b8ce4265f9d8902cce618a6b110e545076db: fix: prevent nil pointer dereference in mcp tools parameters (#850) (@linw1995)
* 2c71f23ee458d0b6a885b42ff6ed3a90fedbd6f5: fix: resolve the baseurl for anthropic (@kujtimiihoxha)
* 472889c3bd0a65ed6e18a1031228b5b8fdf32508: fix: return nil for empty tools slice to handle omitzero properly (#861) (@linw1995)
* a65efa5bfce78e533a50d28d810a8df610564fe0: fix: validate resolved url (@kujtimiihoxha)
* 8d735d6e3d859a5d61d835372b1e0b497c5ee4d5: refactor: home.Dir, home.Short, home.Long (#884) (@caarlos0)

### Docs

* 74e6643954b4d545cb8f804efa9538d4df2e95d8: docs(readme): fix typo (#900) (@henrebotha)
* c761a6a99e202c0b69111b11b3a9ffcd728758b3: docs: update license link to point to `LICENSE.md` (#892) (@xhos)

### Other stuff

* 3fab905e3964d9c7fa6071096efeee3fbfa86b89: chore(dependabot): remove `docker` as we don't have docker for now (@andreynering)
* 68adc067c95f8ec5c1f743156698aecf5973dd76: chore: fix typo in constant name (@andreynering)
* 9bf5410bf49d2e2692666d025efdcba299dfa31b: chore: group dependabot updates to reduce noise (@andreynering)
* e2e99af1446e4f6a243dc1550da25c4baeac8c6e: chore: run `modernize` (#906) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).

## v0.7.1 — 2025-08-21

# Fix: win32 Input Mode + Termux Support

This release contains a fix for terminal emulators on Windows that don't support win32 input mode.

Terminals in Windows that don't support win32 input mode were behaving incorrectly, which is the large majority of terminal emulators outside Windows Terminal. This release fixes that. As part of the fix, we had to temporarily revert the Windows Terminal paste enhancements released on v0.7.0 to fix the issue for the other terminals. Once we're able to address that issue, we'll re-add that feature.

This release should also fix the `.deb` package for Termux on Android.

Thanks for using and Crush and keep sending your feedback! 💘

## Changelog

### Fixed!
* ccf55b865e4a0aaf7d9cd597776ac75bf954bca3: fix(windows): downgrade ultraviolet to fix non-win32 terminals on windows (#856) (@andreynering)
* 255f5e3b79bb359d8ba7bfce5de2488cb5d9a87d: ci: fix termux dirs (#822) (@caarlos0)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.7.0 — 2025-08-20

# Fast Windows Paste + Crushing `.crush`

This is a solid lil’ release that makes Crush on Windows _way_ better and really matures how we're handling about the `.crush` dir. Read on!

## Pasting on Windows is fast now

Remember how pasting in Windows was slow? Not anymore. @aymanbagabas worked a small miracle to enable bracketed paste on Windows without losing the deep, high fidelity interaction we'd normally have to relinquish to get bracketed paste. Enjoy!

## Crushing the `.crush` dir

This release also contains a bunch of improvements around the `.crush` directory, which contains Crush state.

* @tazjin added a new `--data-dir` (`-D`) flag that allow you to choose a custom path for `.crush` directory. Note that it was already possible to set that in the config via the `data_directory` setting.
* If a `.crush` dir exists in a parent directory Crush will now find that and use it, similar to how `git` finds `.git` directories in parents. This means that you can move into a subdirectory of your project and Crush will be able to reuse the same data dir from the main workspace.

## Bonus

Last but not least, we fixed a gnarly, bug made that occasionally made the initial model selector stop responding to keypresses. Oof!

Thank you for all your support and contributions—keep it coming! We love ya! 💘 

## Changelog

### New!

* f74abf2e75f88c405022cd3f74a058c91fa31583: feat(cmd): support overriding the data directory (@tazjin)
* 84bd3246b2ee68fd5e42097a208989cddcfc0301: feat(fsext): add function to search for something in parent directories (@andreynering)
* 897796e2029c886864e3d855e7056dc5404ac2d7: feat: add `fsext` function to get owner of directory (@andreynering)
* f3a8061d405da1b6b999f9fe90672ec1bbf707a1: feat: if a `.crush` directory is present in a parent dir, use that (@andreynering)

### Fixed
* 26481f00a7595b71a4fd083dd5ea1d8fc51fc915: chore: bump bubbletea and ultraviolet to support win32 input mode (#838) (@aymanbagabas)
* 8f45a84be3e7232330ae100c006d736657ef7d42: fix(fsext): stop traversing if the directory owner changes (@andreynering)
* 4c8d4a5ce0a1161d49cd6c8fcd68434fa7f311a3: fix(onboarding): fix onboarding screen freezing when on click on it (@andreynering)
* da667ceb7f0511a87fa0ea33b7453e830e7ec033: fix: scrolling the editor after paste (#466) (@aymanbagabas)
* 0c314813bcd7a340228a831fdb277fe7977ad1fc: fix: treat data directory the same in logs as elsewhere (@tazjin)
* ca6a55a8f72df639da4eea359a0622ecc1de7e98: refactor: improve check a little bit (@andreynering)
* 172df744f4ebb1b5199839c670f52803d18ee426: refactor: move `HomeDir()` to `fsext` package (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.7.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.7.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.7.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.7.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.6.3 — 2025-08-18

# Performance, QoL improvements and lots of bug fixes!

This release enhances performance, fixes many bugs, improves security, add some Quality of Life™ features.

Highlights:

* The security was enhanced in the matter of which commands the model is allowed to run.
* Crush is now compiled using the brand new Go's [GreenTea Garbage Collection](https://github.com/golang/go/issues/73581). This means a lower memory footprint, smaller CPU usage, and fewer freezes.
* The `.crush` directory created in your workspace will now by ignored by Git by default (no more manual `.gitignore` inclusions).
* It's now possible to set custom environment variables to be passed by LSP servers.
* Some possible `panic`s and other small bugs were fixed!

## Changelog
### New Features
* 82c0aff87ab3a9d610662a732065e564ad304cfb: feat(lsp): allow to set custom env to lsp servers via config (#778) (@bbrodriges)
* c5c8bfd1d8425ebc6d03b113527e348c04bb93e1: feat: create `.crush/.gitignore` automatically (@andreynering)
### Security updates
* 74bcdaff28e591e39b0162e5f45a9618f25133ed: sec: remove `go` from safe programs (#820) (@caarlos0)
* b4492299c17d11c6beb9663344f5d79f8f1f1e8c: fix(shell): block `go test -exec` and ensure it works using equals (@andreynering)
* cbdd2e522033a6286dce57addc9b6fd5a7d131d3: fix(shell): refactor arguments blocker to check for flags in any position (@andreynering)
### Bug fixes and improvements
* 2437feb0ab546bc8db82f1a9f8e943b8bd7e1908: fix(llm): log error when retrying (#781) (@caarlos0)
* e2dc8e14a3f21d02157c0298a559d481daf6ec2c: fix(tui): fix model filter placeholder text (#790) (@lpmitchell)
* 63e53f1bc91482a8230954336c36fe79cba06b8b: fix(tui): prevent dialog keymaps from being swallowed (#782) (@uri)
* a02bd99a2d89e36f75b5afc2d1d0d68b71912427: fix: Expose Required params to Anthropic API (#752) (@neomantra)
* 117c6b6d5679d7ded452c213683c7b627308760d: fix: Update erro msg for bash tool (#803) (@sainadh-d)
* d86f739009b28f83d9cb8403b1876c0be7c93b0e: fix: fix panic that can happen on sending a message (#817) (@andreynering)
* 2d2ee7f5abb2e7fcd7aaa79def712455f085ab5e: refactor: have shorter argument name (@andreynering)
* 9eb207f3cf28e8dd72217204b5e1d8ef8702bcd0: refactor: migrate bool to empty struct for lower memory usage (@andreynering)
* 532b47391677d52a34ac2ebb4dd9b0fdadd8306d: refactor: remove duplicated `emerge` entry (@andreynering)
### Other work
* 6a4398ef69609ae0e4fde0b1a06e040c82bf860a: chore(go): upgrade to go 1.25 and enable `GOEXPERIMENT=greenteagc` (@andreynering)
* 915fda527d9c529d29a8aa70524725c5c915d71c: chore(taskfile): set `CGO_ENABLED=0` by default (@andreynering)
* 5a9968522169d6285b2478ff9723e0dd7a63b48b: chore: fix `golangci-lint` locally (#815) (@andreynering)
* fd4baa4a121674f9bd87e1c6261dcf2125effb09: chore: set commit authors to @charmcli (#614) (@caarlos0)
* 5be56eca71cd4237b67b6cbc3e540a7ffe9006bb: feat: add `IsSubset` helper (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.6.3/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.6.3/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.6.3/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.6.3/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.6.2 — 2025-08-15

# Lil’ Patch

This is patch release that removes the provider timeout which could cause long sessions to cancel. There are some other fixes well.

Also, Crush is **now available for Termux on Android**, so you can Crush on the move.

💘 Thanks for all the support!

## Changelog

### Fixed!

* 0354fefad4ca8cbe65e3da01835f8b0f2a205503: fix(fsext): prevent `.*` on gitignore from ignoring entire root dir (#766) (@jamestrew)
* 169b63fa538864ad42a64ed532d5db19711abc8d: fix(keyboard-input): operate on characters, not bytes (@meowgorithm)
* 8b12e097ead56b526fd3c56258180db75e71aad7: fix(lint): correct shadowed variable (@meowgorithm)
* 1bc41c8c387a289e96a54755dd760cb4eabf6b5e: fix(tui): guard against panics in map member access (@meowgorithm)
* 2eaad5104af88ce0ebfa7f337332df69c2940559: fix: remove llm timout (@kujtimiihoxha)

### Other Stuff

* 3c82e31532c3b9133ce47f65d0fce82a82cbecda: ci(goreleaser): start releasing for android / termux (#780) (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.6.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.6.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.6.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.6.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.6.1 — 2025-08-14

# MCPs Stability, Better LSPs, and a Barrel o’ Fixes

This is another quality of life release around MCPs and bug fixes. Read on for details.

💘 Thanks for using Crush and for _all_ your contributions!

## MCP Stability

MCP servers are like people: sometimes reliable and sometimes not. Crush will now restart or reconnect to MCPs when necessary and eventually timeout. The default timeout is 15 seconds, but you can customize timeouts per MCP in the config:

```json
"mcp": {
  "example": {
    "type": "http",
    "url": "https://example.org/mcp/",
    "timeout": 30
  }
}
```

## Restrict LSPs to Filetypes

Now you can restrict LSP servers to specific file types in your config for improved efficiency. Here's how:

```json
"lsp": {
  "Go": {
    "command": "gopls",
    "filetypes": [
      "go",
      "mod",
      "sum",
      "work"
    ]
  }
}
```

“But shouldn't you restrict known language servers to certain filetypes by default, you ask?" Yes, as a matter of fact, we have filetype associations for the following:

* `bash-language-server`
* `clangd`
* `elixir-ls`
* `gopls`
* `jdtls`
* `lua-language-server`
* `pylsp`
* `pyright`
* `rust-analyzer`
* `solargraph`
* `typescript-language-server`
* `vscode-css-languageserver`
* `vscode-html-languageserver`
* `vscode-json-languageserver`
* `vtsls`
* `yaml-language-server`
* `zls`

Don’t your fave LSP here (ahem `haskell-language-server`)? Just send a PR. 

## Shredding bugs

This release also contains a barrel o’ bugs in this UI improving Gemini (thanks @samiulsami), LSPs (thanks @liznear), User interface, performance in the raw Linux console and more.

## Changelog

### New!

* 90097e9adb207608cfe94c45d9744c87fc49d02a: feat(lsp): add filetypes configuration (#666) (@caarlos0)
* bc52493640ce98e9ed34717731ab43b754e5b82c: feat(mcp): configurable MCP timeout (@caarlos0)
* 5af4d192f1e24633224d1439fdbd0b2eb12f7346: feat(mcp): ping and recreate mcp client if needed (#772) (@caarlos0)

### Bug fixes and improvements

* 5ff0f32f8c954d72b6c33f6200e3598be2501b39: fix(gemini): fix tool calls for google gemini (#779) (@samiulsami)
* 16f540091d3539abeef535ce4a25f10615798fe4: fix(lint): check length before slicing to avoid a panic in list (@meowgorithm)
* 0f403feafcd57045802ce0e24b4eff01d409cef5: fix(llm): set request timeout (#736) (@caarlos0)
* f8da476b54f9f4e3f3178294775d393ee13b7cc1: fix(lsp): return a copy of lsp diagnostics to avoid data race (#681) (@liznear)
* 57df1f9b5f96d53a46f17d12f0cb11c18d8ed747: fix(tui): underline quit dialog buttons (#548) (@aymanbagabas)
* dcca5abd5c2e36528cfb898584eb25d8d3ace6c9: fix(tui): truncate long paths in compact header (#773) (@meowgorithm)

### Other stuff

* eb3ef66bcb680a50e56083fdfb0f9f9bd0891c6a: chore(deps): bump bubbletea for colorprofile update (@aymanbagabas)
* 64e8235dfca8e2f155d8dfffcae8995a2a654e9e: chore(deps): bump dependencies to fix linux console perf (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.6.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.6.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.6.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.6.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.6.0 — 2025-08-13

# Power Steering

Sometimes LLMs do what you want. Other times, they don't. That's why we're introducing Power Steering. When the model's working you can queue up messages for it to pick up in between tool calls, or when it's simply finished with its task. To clear messages, simply press <kbd>esc</kbd>.

<p><img src="https://github.com/user-attachments/assets/4b7d2b99-038d-4116-9d39-79e1b47ab384" width="600"></p>

## Also: Fixes

There are also a handful of solid bug fixes in this release: details the changelog below. Thanks for using Crush and stay tuned for more good stuff. We have a lot in the pipe!

## Changelog

### New!
* b550c69b567dee1be4f43a4b6213caf16309cd8a: feat: steering (#605) (@kujtimiihoxha)

### Fixed!

* 39ede6e4db414bbda4674131a56ac80537b614c6: fix(editor): better sorting of files when completing with <kbd>/</kbd> (#733) (@caarlos0)
* 073d130b756615c799274187fc1ceb67509edcb7: fix(mcp): tool output join with new line (#686) (@caarlos0)
* d795c00063f05d41fff12e0d5137ca862fbad921: fix: make the queue push the messages above (@kujtimiihoxha)
* 96dcf0d797049d0cfab212934541f71c34465fd3: fix: stdio mcp startups to match mark3labs upgrade (#742) (@taigrr)

### Other Stuff
* e0042b40dd4cf1bb1327f56b6631ef92731a8f8c: chore: bump bubbletea to v2.0.0-beta.4.0.20250813191918-4ea1703d4181 (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.6.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.6.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.6.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.6.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.5.0 — 2025-08-11

# Perf, Default Diff Mode, and Community

This release contains a bunch of good stuff from the community. @tazjin went deep into the Charm ecosystem and tuned perf all the way up. @ras0q, a Crush contributor extraordinaire, fixed a solid bug with Gemini and retries. @bbrodriges added a setting for default diff mode. Find it all in the changelog below.

## What’s your fave diff mode?

@bbrodriges definitely has a favorite diff mode. We have no idea what it is, but it's important enough to him that he added a feature that allows you to set this in the config. Valid options are `unified` and `split`. Here’s what the config looks like:

```json
{
  "options": {
    "tui": {
      "diff_mode": "unified",
    }
  }
}
```

## Changelog

### New!
* df23e9ab003a5a7d1ab72782642747c06917642e: feat(config): allow configure the default diff mode (#454) (@bbrodriges)

### Perf
* dce957814d811c22389afaee24cfddb1ce1f0482: perf: bump glamour/ultraviolet/cellbuf for @tazjin's performance improvements (@aymanbagabas)
* bdb0a4c7c8b81f1f49f9265374aaf9d4ee4b0231: perf: reduce gc pressure in rendering pipeline (#687) (@tazjin)

### Fixed!
* 9d68f99ea15e3ff72954fc7f2ccfd625e7fc790e: fix(gemini): retry at rate limit (@ras0q)
* 705d6f6a6a0116a8ca62a7cd5fae1ec470909f39: fix(sidebar): compute the right line count even on windows / crlf (@andreynering)
* dba44be045f1d3029705c6d6aa56ddeb4532fcab: fix(sidebar): fix full path appearing on sidebar on windows (@andreynering)
* a3efafc93058aacbec64d5f3ac3328fd71ef1288: fix(tool): fix `edit` and `multi-edit` tools on windows (@andreynering and @theguy000)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.5.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.5.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.5.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.5.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.4.0 — 2025-08-08

# Yolo, Builtins, Perf and More Mouse

Another day, another release. We've been working hard on Crush! Let's see what's new.

## Yolo on Demand

Yolo Mode is when you bypass all permission dialogs and let Crush run free.

So far, you've been able to start Crush in Yolo Mode with `crush --yolo`. The thing about yolo'ing, however, is that you never know when the desire to yolo might strike. That's why we added a yolo toggle to the menu. Just press <kbd>ctrl+p</kbd> and choose Toggle Yolo Mode to yolo and un-yolo to your heart's content.

> [!WARNING]
> Yolo Mode is cray cray and can theoretically really mess stuff up. Be careful.

<p><img src="https://github.com/user-attachments/assets/dbef0841-784e-482b-afcd-a646de6e9808" width="600"></p>

## Mouse Around Your Diffs

Real developers use mice. That’s why we introduced mouse mode in the diff view. Keep using those mice!

<p><img src="https://github.com/user-attachments/assets/317b9433-bd8c-44ae-bedc-6742c6838efd" width="600"></p>

## Windows Powerups

We love Windows. It's great for gaming, and great for Crushing. Windows users now have the following coreutils built-in:

* `base64`
* `gzip`
* `mktemp`
* `shasum`
* `tar`

For everyone else: because these utilities are now compiled in they're much faster as there's no longer a need to shell out to them.

## CPU: Now Less CPU-y

We did some work deep under the hood to prevent rogue CPU spikes, so Crush should now run better than ever.

## Env Prefixes

Want to restrict environment variables to Crush? Thanks to @taigrr, now you can with a `CRUSH_` prefix. So go on, set that `CRUSH_ANTHROPIC_API_KEY`.

## Thank You

💘 Your feedback's been so helpful in helping us understand what you want where your pain points are. Thanks, everyone, and please keep it coming.

## Changelog

### New!

* 291710919dd70c2eb82cb27ec26af9346eec465e: feat(diffview): add support for mouse scrolling (@andreynering)
* a47d761651f29a1e3f0c35b66fa9f47b076b47fc: feat: add yolo mode command (#654) (@kujtimiihoxha)
* 65cd249cb4488c1c1c0fe817ccb92b6a3cc8c27c: feat: allow for using CRUSH_ prefixed env-vars without clobbering default env vars (#391) (@taigrr)

### Fixed!

* ae3b3d746fa4539a6d276b903fb34854755eb12d: fix(mcp): append to output instead of replacing (#658) (@caarlos0)
* 42a346ceb034cd1ebe0a10b696ac7c796984521d: fix(mcp): give a time limit for startup (#660) (@caarlos0)
* fd890f19c893325eb80aa0d6f0edade3f40b6b47: fix(selection): fix panic that can happen on selection (@andreynering)
* e00a70a637f2920a026ae9754c0776ad0453df8d: fix(tools): do not truncate output (#657) (@caarlos0)
* 9719451a3d6fb3483ef94757923b7340470e4410: fix: config.HomeDir sync.OnceValue, use user.Current().HomeDir (@caarlos0)
* 5195f8a77837cffe70d03edbdbe3c6b400f86196: fix: panic: `fuzzy` library doesn't like empty lists (@andreynering)
* 1dc7f20533700ce2de87eee36ec67842a982d502: fix: panic: start can't be greater than end (@andreynering)
* a32c16cb8720bc4288cbd81b1999aad232528e77: refactor: use core utils middleware from `mvdan/sh` (#323) (@andreynering)
* fbe879d4b56d1f95fd02b36b986def6afe8eb0f8: fix: improve .crushignore and .gitignore behavior (@caarlos0)

### Perf

* ae87e4dbbdf0b778b81635ea798954f20cbb1d71: perf: bump bubble tea for improved CPU usage (@aymanbagabas)
* a05b4342f64130c25feddf7234a1da7666bf0ac5: perf: make stuff a tad faster (@caarlos0)

### Other Stuff

* 1e47f4eda8772536b63ef866209e65b6b81cae37: chore(csync.Map): added GetOrSet (@caarlos0)
* fb6dab0df3737f81697763ff713d72d6c9d22b26: chore(diffview): only process scroll events when pointer is over dialog (@andreynering)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.4.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.4.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.4.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.4.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.3.0 — 2025-08-07

# Mice, OpenAI, and You

Crush `v0.3.0` is here with highly anticipated mouse selection, OpenAI provider improvements, and lots of little fixes and improvements. Enjoy the release and keep the feedback coming!

## Copying Text, with a Mouse

Selecting text with a mouse. It's as natural as craving love and shelter. Crush now supports it, so go ahead and select text with a mouse to your hearts' content.

<p><img src="https://github.com/user-attachments/assets/d68ab9c6-eaec-4806-9004-904e1ee88ca1" width="600" alt="An example of text selection with a mouse in Crush"></p>

## Drag Race

You can now drag images into Crush in almost any terminal; even Apple Terminal. The visible world is at your fingertips! Just note that not all models can process images.

<p><img src="https://github.com/user-attachments/assets/abf89393-166e-434c-ac63-2606cd6122da" width="600" alt="An example of drag and drop in Crush"></p>

## OpenAI

We improved prompts for OpenAI models and introduced support for minimal reasons. You're welcome, Sam.

## GPT-5

Speaking of OpenAI, GPT-5 was released today Crush supports it out of the box! Have fun!

## Nixpkgs

Crush is [on Nixpkgs unstable now](https://search.nixos.org/packages?channel=unstable&from=0&size=50&sort=relevance&type=packages&query=crush)! Just keep in mind it can be slightly behind the latest version, so for best results, use Crush the NUR. For details [see the installation instructions](https://github.com/charmbracelet/crush?tab=readme-ov-file#installation).

## Changelog

### New!

* 3d91fd0fa25a65f30086b800a5bdd91122e308f1: feat(chat): copy selected text in chat messages via keybind (@aymanbagabas)
* a6ad0d90f0f79b1891317e8be4d03484ea79c143: feat(tui): chat: add copy and clear selection keybinds to help (@aymanbagabas)
* f0377a3a862f9c4ffffa112f137ca28989b108bf: feat(tui): chat: clear selection on esc (@aymanbagabas)
* 8566940e36c2f3aa4b2b184838eebd4583081fcd: feat(tui): chat: support double-click to select and copy text after (@aymanbagabas)

### Fixed!

* 6b545747ded24028e506ec8442eff1315bb6c231: fix(chat): expose copy key binding (@aymanbagabas)
* 7e58d53f58f14028fcfa1aef1500b0fef8447d4b: fix(chat): focus chat and editor on mouse click (@aymanbagabas)
* 3671bd0f7330fa4c0b0592f27b7bd5166ebc020a: fix(list): include inbetween empty lines when selecting text (@aymanbagabas)
* c770a8a2ac38c53759342a42d37740c93c581314: fix(tui): editor: sanitize pasted paths (@aymanbagabas)
* b0b85e6e8108ef3f9fc46714759a3e25648324b5: fix: add $schema to jsonschema (@caarlos0)
* 2e30226da8879b2f7bf67fa83fb179cde72a9a2e: fix: handle compact mode (@kujtimiihoxha)
* 3280b4a85d98038d631349a662bb1365739ef97f: feat: support reasoning model minimal in OpenAI (@kujtimiihoxha)
* 567b778645113721822df45824a43b73281fe40e: feat(list): selection colors (@meowgorithm)
* ce1a674c9867f8fe1252831838caa9fd5e5d28f0: fix: bump bubbles to fix textarea cursor issue (@aymanbagabas)
* d8da2fba6d4c25a1c53cf2e6964cb5e1449a65c5: fix: handle smaller text than screen size (@kujtimiihoxha)

### Other stuff

* 1f8bc4e2d3ed389463fe0ce04c2d5d9bce8acabe: chore(list): add HasSelection method and selectionView for text-only output (@aymanbagabas)
* 926f30d044eef6c4a882aff8756084bf7749579e: chore: remove cache from prefix (@kujtimiihoxha)
* 31dc01ecfaeb94750fc78259000bb842263bbc79: chore: rename default theme + infer default theme name (#570) (@meowgorithm)
* 45e4e275577e6701194de993aee300446d4e0c57: chore: update openai prompt (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.3.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.3.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.3.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.3.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.2.2 — 2025-08-06

# JetBrains, Scoop, and a Barrel of Improvements

There are lots of great things in this release, from better support for JetBrains products, a Scoop distribution, and a ton of small improvements with big impacts. Read on for more.

As always, get the latest release [from a package manager](https://github.com/charmbracelet/crush/releases/tag/v0.2.2) or download a release below.

## JetBrains Improvements

The big news in this release in that we've vastly improved rendering in JetBrains products like Goland, IntelliJ, PyCharm and so on. JetBrains uses its own terminal (JediTerm) which we've made a bunch of changes to better support. Special thanks to the community for flagging this one with us.

## Scoop

At last, you now have an easy way to install `crush` on Windows. `winget` is also coming very soon, if that's your kind of thing.

```bash
# Scoop
scoop bucket add charm https://github.com/charmbracelet/scoop-bucket.git
scoop install crush
```

## Ollama and LMStudio

Crush has always supported local models via OpenAI API, however to make it easier to setup, we added [setup instructions to the readme](https://github.com/charmbracelet/crush?tab=readme-ov-file#local-models).

## LSP status

<p><img width="600" alt="image" src="https://github.com/user-attachments/assets/16d38b2a-7208-4553-a3da-76a1189f8267" /></p>

LSPs and MCPs will now indicate their status in the UI, indicating offline, starting up, online and error states. Note that for full details on LSP status, you can run `crush logs`.

## Improvements Galore

There are a bucket of fixes in this release to greatly improve the Crush experience, from preventing certain files from over-consuming context, to ironing out differences in how providers interpret the OpenAI API, adding reasoning to more OpenRouter models, and more. Read on for the full details…and thanks for using Crush! 💘

## Changelog

### Fixed!

* b045eec87edfc09660f4e8b862a41c48c8618087: fix: jediterm rendering (via ultraviolet) (@aymanbagabas)
* d72bac2307e3027ed4e98b34723d0f999314f185: fix(mcp): set logger on all mcp clients (#554) (@caarlos0)
* 87ee7dfa77f871b5c31ef5e8d9940b05bd03c7bf: fix(mcp): update lib, set transport logger (#510) (@caarlos0)
* 4739ba93436327408a4e320463a5ab2fa0710ee8: fix(mcp/lsp): correctly show mcp and lsp states (@kujtimiihoxha)
* 8940ba1ddf3d686e2e8b3f29a04ab904ec2e8c66: fix: variance in openai compatible providers (@kujtimiihoxha)
* 7f7749601a0792f772c0fffdbc73e05121b5055e: fix: handle nil body in http log (@kujtimiihoxha)
* cf72cb88b53588d77725e3af4e49524479b885b2: fix: make sure to make rendered string concurrency sage (@kujtimiihoxha)
* cb6642b5fb1a67cfe5feb8052df36c7aa55f1c40: fix: sidebar files shuffling (@kujtimiihoxha)
* 0de5b24655432cfaf8268e1387251e902940dfef: fix: some openai providers (@kujtimiihoxha)
* 7c6e39d83a885da2beb82e8f0308693021192079: fix: summarize provider should be large (@kujtimiihoxha)
* dbb998c76e336b6e57a57a11a5478726a3ad7c93: fix: width related commands not showing (@kujtimiihoxha)
* 1b50cb61c81702d0a94bded3b0007ec3d4c348c1: fix: add reasoning to openrouter models that support it (@kujtimiihoxha)

### Docs

* 2673806884a295b144be542278b5e71aa6ebf423: docs(readme): add Ollama and LMStudio config (#538) (@kujtimiihoxha)
* 5df3ebbe8eb7dbcc501f9c2b3f4ae2608ebc5fad: docs(readme): add bedrock and vertex info (@meowgorithm)

### Other stuff

* 9ce53b18fc16c23c068669a6cf0ac30eb4cbfcd2: chore(tui/status): remove parens around MCP detail (#580) (@meowgorithm)
* 19d3cd06eed1a9cb594a0e31bd18d113d6de5729: chore: change LSP/MCP loading icon colors (@meowgorithm)
* bfd089d4193cbd3da9d81a4ac52852ab08eeee89: chore: fix missing assignment (@kujtimiihoxha)
* 5177982f3ff60f98cf55e5cb33215cc742e48927: chore: fix model settings (@kujtimiihoxha)
* fcbe9666bddf20c6c996b04891a962d374687226: chore: limit tool output (@kujtimiihoxha)
* e130e0385682a0ede0a63630e527328a4d187e49: chore: set notices size (@kujtimiihoxha)
* d9b0062208beee9e71cfb3e606a7de377b8c9493: chore: simplify model filtering (@kujtimiihoxha)
* 9a9861c693fdc6a69a67628c35e0bb80bee22202: chore: update catwalk (@kujtimiihoxha)
* 75fd9510edbf29acf9507ff82dcf8230bd33c257: chore: update catwalk (@kujtimiihoxha)
* 6a04f6755b6de499a2451fd0f8dd732b437e8546: chore: the escape key can also deny prompts (@bbrodriges)
* 4f7098f3569de595131d07524243b4047a86d038: chore: bump bubbletea to v2.0.0-beta.4.0.20250805190305 (@aymanbagabas)
* e23563af5f3c6a3e0a76fdf541a73cf43db25a59: chore: bump charmbracelet/x/ansi to v0.10.0 (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.2.2/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.2.2/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.2.2/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.2.2/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.2.1 — 2025-08-02

# Mini Hotfix

This release fixes a bug where a panic would occasionally occur when canceling requests in debug mode. Happy debugging!

## Changelog
### Bug fixes and improvements
* 0b477ea49470db978e9f9eb43a224def73c41101: fix: http log (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/v0.2.1/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.2.1/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.2.1/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.2.1/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.2.0 — 2025-08-02

# Lifestyle Improvements

At Charm, we're all about creature comforts. This release contains a couple nice quality-of-life features and a handful of fixes, particularly around MCPs. Let’s see what’s new:

## Crushignore

Crush respects `.gitignore` files by default, but now you can also use a `.crushignore` file to specify additional files and directories that Crush should not pay attention to. This is useful for excluding files that you want in version control but don't want Crush to consider when providing context.

The `.crushignore` file uses the same syntax as `.gitignore` and can be placed in both the root of your project and in subdirectories.

## Debug Harder

Now when you run `crush --debug` Crush will also log provider responses, allowing you to _really_ get an idea about what’s going on. Logs are stored in `.crush/logs/crush.log` and can be viewed and tailed with the `crush logs` command. [More on logging.](https://github.com/charmbracelet/crush?tab=readme-ov-file#logging)

## Thanks

Special thanks to @andreynering from the Charm team for automating issue labeling to help us wrangle issues and contributions. We're at least 125% more organized thanks to him.

🌈 And thank _you_ for using, Crush. Enjoy the release and stay tuned: we have _so_ much coming.

## Changelog

### New!

* 0e52ccd26a5d82c27446b3e7f80cc28929f87064: feat: --debug also logs request response details (#407) (@caarlos0)
* 2a431845803adcded25746d24d6d093c4f4076cb: feat: grep should also support gitignore/crushignore (#428) (@caarlos0)
* 5a6329cc343a16df1b0441fc6d1932b6aed68edd: feat: support `.crushignore` in addition to `.gitignore` (@caarlos0)

### Fixed

* b1b5851f233182cc0fd22cdea7edcd3c7f76db4e: fix(tui): background color of file view component (#349) (@ras0q)
* cd3ef8dbd487252fc811041b43110a8fe32f28b1: fix: do not init MCP client on every tool request (#459) (@caarlos0)
* 6da65000781ebcb323d1aede6468d7f9314c70f8: fix: MCP client must be started (#474) (@caarlos0)
* 428d71a162480cac31d12db1e0ea54b3e8b5fd59: fix: MCP clients (@kujtimiihoxha)
* d3f28ddd95a4572d508dfd15cfe3d667a3c1a94b: fix: handle code agent not initialized (@kujtimiihoxha)
* 5b7951051df6aa5ab8d243e388c4357c166e9102: fix: improve path prefix checking reliability (@kujtimiihoxha)
* e698239ace608a9ea084be6fd8bc2c89f273306a: fix: lint noctx issues (@caarlos0)
* 3eed18432f360fb21404bd23a61f9ed22a5f7559: fix: permissions path (@kujtimiihoxha)
* c99034909d4e422286965f307e667d52e65e30f2: fix: default permissions of 0600 in crush.json (@petersanchez)

### Other stuff

* 867484b46aa4b0581984213c782bbbf9f3b7cde2: refactor: move `run` to its own file (@caarlos0)
* 2ddc453573b1e5eefb36344f59ab050ca34145c5: chore: refactor prefix implementation (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.2.0/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.2.0/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.2.0/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.2.0/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.11 — 2025-07-31

# Even More Hot Fixes

This small release fixes a bug on Windows where typing is broken when the NumLock key is on. It also fix VertexAI using an incorrect provider in some scenarios as well as view related UI bugs.

## Changelog
### Bug fixes and improvements
* 705790d336a684c9cd7f809605870e7a5761fa61: fix: nil pointer in view (#403) (@caarlos0)
* 8248e4f649d8045ddf8201ea8648370a48d7abec: fix: use anthropic provider for vertexAI (#398) (@kujtimiihoxha)
### Other work
* 2c82ed28123b48a42a736edd066454bad652e683: chore: bump charmbracelet/ultraviolet to v0.0.0-20250731212901-76da584cc9a5 (@aymanbagabas)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.11/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.11/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.11/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.11/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.10 — 2025-07-31

# More Hot, Hot Fixes

Hello! This is another series of small fixes on corrections to fix a buy in API key entry (particularly on Windows) as well as improve Vertex integration. Thanks, as always, for your contributions!

### Bug fixes and improvements

* e69b513e1a2b06d31be7f87294ed2531b487c2b2: fix(onboarding): correct y/n key press on model list and api key field (#402) (@andreynering)
* d2f7bb7cfe827dc96d112bff8fefc90ad7034e23: fix: vertex provider (@kujtimiihoxha)
* 52d459c477b7701da7d1f35e4dd060ef5d02f3b0: fix: tests (@kujtimiihoxha)

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.10/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.10/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.10/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.10/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.9 — 2025-07-31

# Provider Fixes, Coming in Hot

This release fixes an issue with the OpenRouter API fixes and a crushes a panic. Thanks for using Crush and I let me know what you think.

## Changelog

### Bug fixes and improvements

* 28b67f95acac531d5ee8f1a087b07cf32a628d57 fix: openrouter api
* 43ac8d4870f5f56f3595332be2d13adacc2cb2ac fix: panic in non-interactive mode when no providers set up

### Other work

* 317c5dbfafc0ebda8b86f25e8e4c8cda281b8df2 chore: bump bubbletea/v2

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.9/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.9/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.9/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.9/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.8 — 2025-07-30

# Bedrock Regions

This is a patch release that fixes region detections for Amazon Bedrock. 'Amazon Bedrock' is a pretty bizarre combination of words, eh? Anyway, enjoy!

## Changelog
* 329c4dafa76c29a3655e1aad339b105f4fce6cb4 fix: fix region detection for bedrock

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.8/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.8/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.8/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.8/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.7 — 2025-07-30

# This and That

This is just a handful of small fixes and improvements. Thanks for using Crush!

## Changelog

### Bug fixes and improvements

* 6235248b93b4635e294ff7ca123c55e0c3f6e222 fix(tui): apply border styling to error messages in selected state
* 3839c364d601edf602dcff50a862b993661a4b40 fix: lint for var blocks
* d63856d90db8a15d3bc3e530f8a02c1458fdcdb4 fix: bedrock and azure
* 11a90e1cf6d6a63d5c9b2d369ed3d6207605247c fix: custom headers and system prefix
* 30b508fc5d167d4eacd9c81defbef02f0407a1aa fix: openrouter issues
* aaa03ab1dcf5f20b26f4d25871a1307159d4b81c fix: word case

### Performance

* 760e5c4f1271b8813f6d2fe89e01df18dd0ececa perf: avoid regex compilation in runtime

### Other work

* 4ae839a02380da9498a5a039e0604412529be05a chore: make "list" tool preview cleaner
* 34e68acb8a0842d0cf39ca58cac72919bd3095cc chore: add agents to the default context
* 979ddb593d8fed38b3060aa3fe3c475b62a1e5af chore: bump ultraviolet
* 121825d8e3f497982a1d9fa181f9b6d29cc26f9a chore: prevent switching the model while agent is working
* 54bf4a6e02327e58ddda2ba9df37465c33c4aa58 chore: remove log

---

<details>
<summary>Verifying the artifacts</summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.7/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.7/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.7/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.7/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

<a href="https://charm.land/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack), [The Fediverse](https://mastodon.technology/@charm).



## v0.1.6 — 2025-07-29

<img width="450" height="464" alt="Charm Crush" src="https://github.com/user-attachments/assets/975b3fbe-d051-48e1-9508-1d0c90389d46" />

# Meet Crush

This is the first public release of Crush, your AI coding bestie for the terminal. Give it a try and let us know what you think! If you prefer to install via package manager check out [the installation instructions](https://github.com/charmbracelet/crush?tab=readme-ov-file#installation).


---

<details>
<summary><strong>Verifying the artifacts</strong></summary>

First, download the [`checksums.txt` file](https://github.com/charmbracelet/crush/releases/download/0.1.6/checksums.txt), for example, with `wget`:

```bash
wget 'https://github.com/charmbracelet/crush/releases/download/v0.1.6/checksums.txt'
```

Then, verify it using [`cosign`](https://github.com/sigstore/cosign):

```bash
cosign verify-blob \
  --certificate-identity 'https://github.com/charmbracelet/meta/.github/workflows/goreleaser.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --cert 'https://github.com/charmbracelet/crush/releases/download/v0.1.6/checksums.txt.pem' \
  --signature 'https://github.com/charmbracelet/crush/releases/download/v0.1.6/checksums.txt.sig' \
  ./checksums.txt
```

If the output is `Verified OK`, you can safely use it to verify the checksums of other artifacts you downloaded from the release using `sha256sum`:

```bash
sha256sum --ignore-missing -c checksums.txt
```

Done! You artifacts are now verified!

</details>

---

<a href="https://charm.sh/"><img alt="The Charm logo" src="https://stuff.charm.sh/charm-banner-next.jpg" width="400"></a>

Thoughts? Questions? We love hearing from you. Feel free to reach out on [Twitter](https://twitter.com/charmcli), [Discord](https://charm.land/discord), [Slack](https://charm.land/slack) or [The Fediverse](https://mastodon.technology/@charm).


