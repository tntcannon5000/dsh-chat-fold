# DSH Chat Fold

Unofficial, removable DeepSeek Harness plugin that restores compact turn folding in long sessions. Stock Harness Web folds each completed turn behind a "N tool calls ›" disclosure row — but only while the entire session history is loaded. Once a session outgrows the initial transcript window, stock folding stays disabled and every completed tool row remains expanded forever. This plugin brings the stock Compact presentation back one-for-one, without touching Harness or the relay.

## What it does

- Every settled turn (one with a footer row) collapses behind a disclosure row that sits above the final answer, in the same slot stock uses: tool calls, context injections, and intermediate narration are hidden; user rows, system prompt, the answer, and the footer stay.
- The disclosure replicates the stock row one-for-one: the summary ("27 tool calls · 16 messages", or "Thought for a while"), the hairline underline, and the rotating chevron; clicking it expands the turn in place, clicking again re-collapses it.
- A turn still streaming is never folded; it folds automatically when its footer arrives.
- While stock folding is available (short sessions with Compact transcript view), the plugin stands down completely and writes nothing.

The controller writes plugin-namespaced `data-dsh-fold-*` attributes and one stylesheet on top of the stock semantic anchors. Its only DOM addition is the localized disclosure button inside each turn's empty stock `turn-process` row, whose stock `hidden="until-found"` hiding is overridden only for rows hosting the disclosure. The disclosure is self-healing against stock re-renders, and React reconciliation, streaming, search, rewind, and fork keep working untouched. The footer row itself is never a toggle target because its stock actions (copy, feedback, context view, fork) stay always revealed on touch and a row-wide toggle would activate them by accident.

## Install

Development (local checkout):

```sh
pnpm install
pnpm run check
```

Then add a `link:` dependency to the Web profile's `package.json` and append `dsh-chat-fold` to that profile's `dsh.profile.bundles` list. Build this package before reloading Harness because the Web runtime serves `lib/client.js`.

From GitHub:

```sh
dsh plugin add tntcannon5000/dsh-chat-fold
```

## Compatibility

The current development target is DeepSeek Harness `0.1.2-alpha.4`; the DOM anchors are pinned to that release. The plugin works alongside other client plugins, including `dsh-mobile-web`, because each owns its own namespaced attributes.

## Known Limitations and Deferred Work

- Expansion state lives in memory: it resets on reload and on session switch.
- Rows hidden by this plugin stay hidden for in-page search; revealing a search hit inside a folded turn requires expanding that turn first.
- The summary counts tool calls and intermediate model messages but not subagent runs, because the transcript DOM does not distinguish them; turns with neither show the stock "Thought for a while" fallback.
- Turn classification trusts the stock `turn-tail` and empty `turn-process` rows as markers; if a future Harness release changes these anchors, the plugin degrades to no-op rather than breaking the transcript.
