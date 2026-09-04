# DSH Chat Fold Horizon

## Mission

Restore compact conversation folding for DeepSeek Harness sessions whose history is too large for the stock Web transcript to fold. Stock Harness disables turn folding while any older history page is unloaded, so very long sessions render every completed process segment forever. This plugin collapses each settled turn behind a duration disclosure above the final answer and expands the initial history window to five stock pages, as a removable standalone plugin with no Harness source changes.

## Gold standard

The interaction target is the stock `TurnProcessNodeView` disclosure that stock renders in short sessions: the same empty `turn-process` slot ahead of the finalized answer, hairline-underlined row, and click-to-expand-then-collapse behavior. The plugin-owned presentation uses the stock footer's localized end-to-end `Ran for …` value as its larger label and a crisp rotating SVG chevron.

## Success conditions

1. On a session where stock folding is dormant (`hasMore` true), every settled turn (one with a `turn-tail` footer) shows only its user/steering row, footer, error/limit markers, final assistant prose, and disclosure row; system prompts, tool calls, context injections, intermediate assistant rows, and reasoning blocks embedded in the final assistant row are hidden.
2. A settled turn is toggled only through its plugin-owned disclosure button in the `turn-process` slot; expansion shows the complete turn in natural order.
3. No toggle control ever renders at the bottom of a turn: the footer row is not a toggle target.
4. A turn still streaming (no footer yet) is never folded; when its footer arrives, it folds automatically.
5. While stock folding is active (rows marked `data-turn-process-member`), the plugin writes nothing and hides nothing.
6. The plugin never reparents or removes React-owned DOM; it writes only plugin-namespaced `data-*` attributes on stock rows, one stylesheet, and its own disclosure button element inside the empty stock `turn-process` rows.
7. Turn expansion survives re-classification while the turn's rows remain mounted and resets cleanly when the transcript is replaced.
8. Opening a session automatically loads four additional stock history pages after the initial page, for a five-times-larger default message window; exhaustion, switching, errors, and disposal stop the preload cleanly.

## Fixed decisions

1. One standalone DSH plugin in its own GitHub repository, MIT licensed, installable through a Web profile dependency and bundle row.
2. Compatible with the tested Harness release only (`0.1.2-alpha.4`); anchors are pinned to that release's DOM contract.
3. Semantic anchors only: `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, `data-actions-reveal`, `data-variant="think"`, ARIA dialog semantics, and the stock `data-turn-process-member` marker. Generated CSS-module class names are forbidden.
4. No broad DOM mutation: one document-scoped childList observer with an O(1) liveness guard drives one rAF-throttled classification pass over the flow container.
5. Plugin-owned attributes are namespaced `data-dsh-fold-*`; the only subtree the plugin creates is its disclosure button and presentational SVG chevron, appended inside the empty stock `turn-process` row and self-healing against stock re-renders.
6. The disclosure slot overrides the stock `hidden="until-found"` hiding only for the `turn-process` row that hosts it, and only while the controller is not standing down.
7. The footer row is never a toggle target. Its stock actions (copy, feedback, context view, fork) stay always revealed on touch, and a footer-row toggle was observed forking sessions by accident.
8. The disclosure reuses the stock footer's already-localized `Ran for …` label verbatim. The plugin does not parse localized duration text or synthesize timing from message clocks; count summaries remain only as a fallback when stock cannot derive both turn boundaries.
9. A scoped sessions-service controller preloads exactly four additional pages once per selected Session object by calling its public `loadOlder()` operation sequentially; it does not alter RPCs, patch constants, or continue after history exhaustion.
10. Engine pinned exactly to the tested Harness release; the plugin stays disposable with complete attribute, element, listener, subscription, and style cleanup.
11. Tagged releases carry the built Host, Client, declaration, and source-map artifacts. The Client registration starts with package/version provenance so every release produces a distinct immutable Harness bundle revision.

## Explicit non-goals

- Replacing the stock Chat view, Trajectory, Context, or any Conversation View.
- Synthesizing flow rows outside the stock `turn-process` slots or restyling stock rows beyond the disclosure button.
- Own persistence of expansion state across reloads or sessions.
- Changing the Session Controller's page-size constants, RPC schema, or stock load-earlier control.
- Desktop feature parity work beyond what folding needs, authentication, relay behavior, or Harness source changes.
