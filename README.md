# DSH Chat Fold

Unofficial, removable DeepSeek Harness plugin that restores compact turn folding in long sessions. Stock Harness Web folds each completed turn into one footer row — but only while the entire session history is loaded. Once a session outgrows the initial transcript window, stock folding stays disabled and every completed tool row remains expanded forever. This plugin brings the stock Compact presentation back without touching Harness or the relay.

## What it does

- Every settled turn (one with a footer row) collapses to its user rows, system prompt, final answer, and footer; tool calls, context injections, and intermediate narration are hidden.
- Clicking a settled turn's footer expands that turn in place; clicking again re-collapses it.
- A turn still streaming is never folded; it folds automatically when its footer arrives.
- While stock folding is available (short sessions, or the user set Transcript view to Normal with folding markers present), the plugin stands down completely and writes nothing.

The controller only writes plugin-namespaced `data-dsh-fold-*` attributes and one stylesheet on top of the stock semantic anchors. It never reparents or creates React-owned DOM, so React reconciliation, streaming, search, rewind, and fork keep working untouched.

## Install

Development (local checkout):

```sh
pnpm install
pnpm run check
```

Then add a `link:` dependency to the Web profile's `package.json` and append `dsh-chat-fold` to that profile's `dsh.profile.bundles` list. Build this package before reloading Harness because the Web runtime serves `lib/client.js`.

From GitHub (once published):

```sh
dsh plugin add <owner>/dsh-chat-fold
```

## Compatibility

The current development target is DeepSeek Harness `0.1.2-alpha.4`; the DOM anchors are pinned to that release. The plugin works alongside other client plugins, including `dsh-mobile-web`, because each owns its own namespaced attributes.

## Known Limitations and Deferred Work

- Expansion state lives in memory: it resets on reload and on session switch.
- Rows hidden by this plugin stay hidden for in-page search; revealing a search hit inside a folded turn requires expanding that turn first.
- The toggle affordance is the stock footer row restyled with a chevron; the plugin does not synthesize a separate disclosure header above the answer.
- Turn classification trusts the stock `turn-tail` row as the settled marker; if a future Harness release changes these anchors, the plugin degrades to no-op rather than breaking the transcript.
