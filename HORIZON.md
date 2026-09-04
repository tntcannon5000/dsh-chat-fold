# DSH Chat Fold Horizon

## Mission

Restore compact conversation folding for DeepSeek Harness sessions whose history is too large for the stock Web transcript to fold. Stock Harness disables turn folding while any older history page is unloaded, so very long sessions render every completed tool row forever. This plugin delivers the stock Compact presentation — a settled turn collapses behind the stock-style "N tool calls ›" disclosure row that sits above the final answer — as a removable standalone plugin with no Harness source changes.

## Gold standard

The visual and interaction target is the stock `TurnProcessNodeView` disclosure ("26 tool calls ›") that stock renders in short sessions. The replica must match it one-for-one: same slot (the empty stock-hidden `turn-process` row ahead of the finalized answer), same summary composition (tool calls · messages, "Thought for a while" fallback), same hairline-underlined row, same chevron rotation, same click-to-expand-then-collapse behavior.

## Success conditions

1. On a session where stock folding is dormant (`hasMore` true), every settled turn (one with a `turn-tail` footer) shows only its independent rows — user, steering, system prompt, footer, error, and turn markers — plus its final assistant row and its disclosure row; all process rows (tool calls, context injections, intermediate assistant narration) are hidden.
2. A settled turn is toggled only through its plugin-owned disclosure button in the `turn-process` slot; expansion shows the complete turn in natural order.
3. No toggle control ever renders at the bottom of a turn: the footer row is not a toggle target.
4. A turn still streaming (no footer yet) is never folded; when its footer arrives, it folds automatically.
5. While stock folding is active (rows marked `data-turn-process-member`), the plugin writes nothing and hides nothing.
6. The plugin never reparents or removes React-owned DOM; it writes only plugin-namespaced `data-*` attributes on stock rows, one stylesheet, and its own disclosure button element inside the empty stock `turn-process` rows.
7. Turn expansion survives re-classification while the turn's rows remain mounted and resets cleanly when the transcript is replaced.

## Fixed decisions

1. One standalone DSH plugin in its own GitHub repository, MIT licensed, installable through a Web profile dependency and bundle row.
2. Compatible with the tested Harness release only (`0.1.2-alpha.4`); anchors are pinned to that release's DOM contract.
3. Semantic anchors only: `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, and the stock `data-turn-process-member` marker. Generated CSS-module class names are forbidden.
4. No broad DOM mutation: one document-scoped childList observer with an O(1) liveness guard drives one rAF-throttled classification pass over the flow container.
5. Plugin-owned attributes are namespaced `data-dsh-fold-*`; the only element the plugin creates is its disclosure button, appended inside the empty stock `turn-process` row and self-healing against stock re-renders.
6. The disclosure slot overrides the stock `hidden="until-found"` hiding only for the `turn-process` row that hosts it, and only while the controller is not standing down.
7. The footer row is never a toggle target. Its stock actions (copy, feedback, context view, fork) stay always revealed on touch, and a footer-row toggle was observed forking sessions by accident.
8. The disclosure replicates the stock summary composition — tool calls, then messages, joined by the stock separator, with the stock "Thought for a while" fallback — through the plugin's own locale namespace; subagent counts are not derivable from the DOM and are omitted.
9. Engine pinned exactly to the tested Harness release; the plugin stays disposable with complete attribute, element, listener, and style cleanup.

## Explicit non-goals

- Replacing the stock Chat view, Trajectory, Context, or any Conversation View.
- Synthesizing flow rows outside the stock `turn-process` slots or restyling stock rows beyond the disclosure button.
- Own persistence of expansion state across reloads or sessions.
- Desktop feature parity work beyond what folding needs, authentication, relay behavior, or Harness source changes.
