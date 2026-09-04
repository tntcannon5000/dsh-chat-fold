# DSH Chat Fold

Unofficial, removable DeepSeek Harness plugin that restores compact turn folding in long sessions. Once a session outgrows the initial transcript window, stock folding stays disabled and every completed process segment remains expanded forever. This plugin restores the compact interaction and preloads a five-times-larger default history window without touching Harness or the relay.

## What it does

- Every settled turn collapses behind a disclosure above the final answer, in the same slot stock uses. System prompts, tool calls, context injections, intermediate narration, and reasoning embedded in the answer row are folded; user/steering rows, final prose, errors, and the footer remain visible.
- The disclosure reuses stock's localized end-to-end `Ran for …` value, renders it slightly larger, and uses a crisp rotating SVG chevron. Clicking expands the turn in place; clicking again re-collapses it.
- Selecting a session automatically loads four more stock pages after its initial page, expanding the default history window from 50 to as many as 250 messages.
- A turn still streaming is never folded; it folds automatically when its footer arrives. While stock folding is available, the plugin stands down completely.

The fold controller writes plugin-namespaced `data-dsh-fold-*` attributes and one stylesheet on top of stock semantic anchors. Its only DOM addition is the disclosure subtree inside each turn's empty stock `turn-process` row. It copies stock's already-formatted duration label verbatim rather than parsing localized text or estimating timing. A separate bounded controller calls the selected Session's public `loadOlder()` operation sequentially. The disclosure is self-healing against stock re-renders, and React reconciliation, streaming, rewind, fork, and footer actions remain untouched.

## Install

Development (local checkout):

```sh
pnpm install
pnpm run check
```

Then add a `link:` dependency to the Web profile's `package.json` and append `dsh-chat-fold` to that profile's `dsh.profile.bundles` list. Build this package before reloading Harness because the Web runtime serves `lib/client.js`. Tagged releases include the same checked build artifacts used by local development.

From GitHub:

```sh
dsh plugin add tntcannon5000/dsh-chat-fold
```

## Compatibility

The current development target is DeepSeek Harness `0.1.2-alpha.4`; the DOM anchors are pinned to that release. The plugin works alongside other client plugins, including `dsh-mobile-web`, because each owns its own namespaced attributes.

## Known Limitations and Deferred Work

- Expansion state lives in memory: it resets on reload and on session switch.
- Rows hidden by this plugin stay hidden for in-page search; revealing a search hit inside a folded turn requires expanding that turn first.
- If stock cannot derive a turn duration because a boundary is outside the available event window, the disclosure falls back to the previous tool/message-count summary.
- Turn classification trusts the stock `turn-tail` and empty `turn-process` rows as markers; if a future Harness release changes these anchors, the plugin degrades to no-op rather than breaking the transcript.
