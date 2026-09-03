# DSH Chat Fold Horizon

## Mission

Restore compact conversation folding for DeepSeek Harness sessions whose history is too large for the stock Web transcript to fold. Stock Harness disables turn folding while any older history page is unloaded, so very long sessions render every completed tool row forever. This plugin delivers the stock Compact presentation — a settled turn collapses to its user rows, final answer, and footer; a chevron button on the footer expands the turn — as a removable standalone plugin with no Harness source changes.

## Success conditions

1. On a session where stock folding is dormant (`hasMore` true), every settled turn (one with a `turn-tail` footer) shows only its independent rows — user, steering, system prompt, footer, error, and turn markers — plus its final assistant row; all process rows (tool calls, context injections, intermediate assistant narration) are hidden.
2. A settled turn is toggled only through its plugin-owned chevron button on the footer row; expansion shows the complete turn in natural order.
3. A turn still streaming (no footer yet) is never folded; when its footer arrives, it folds automatically.
4. While stock folding is active (rows marked `data-turn-process-member`), the plugin writes nothing and hides nothing.
5. The plugin never reparents or removes React-owned DOM; it writes only plugin-namespaced `data-*` attributes on stock rows, one stylesheet, and its own toggle button element inside settled footer rows.
6. Turn expansion survives re-classification while the turn's rows remain mounted and resets cleanly when the transcript is replaced.

## Fixed decisions

1. One standalone DSH plugin in its own GitHub repository, MIT licensed, installable through a Web profile dependency and bundle row.
2. Compatible with the tested Harness release only (`0.1.2-alpha.4`); anchors are pinned to that release's DOM contract.
3. Semantic anchors only: `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, and the stock `data-turn-process-member` marker. Generated CSS-module class names are forbidden.
4. No broad DOM mutation: one document-scoped childList observer with an O(1) liveness guard drives one rAF-throttled classification pass over the flow container.
5. Plugin-owned attributes are namespaced `data-dsh-fold-*`; the only element the plugin creates is its toggle button, appended inside settled footer rows and self-healing against stock re-renders.
6. The footer row itself is never a toggle target. Its stock actions (copy, feedback, context view, fork) stay always revealed on touch, and a row-wide toggle was observed forking sessions by accident; only the dedicated chevron button toggles.
7. The toggle button carries a localized `aria-label` from the plugin's own locale namespace and a language-neutral chevron glyph.
8. Engine pinned exactly to the tested Harness release; the plugin stays disposable with complete attribute, element, listener, and style cleanup.

## Explicit non-goals

- Replacing the stock Chat view, Trajectory, Context, or any Conversation View.
- Synthesizing disclosure rows or restyling stock rows beyond the plugin's toggle button.
- Own persistence of expansion state across reloads or sessions.
- Desktop feature parity work beyond what folding needs, authentication, relay behavior, or Harness source changes.
