# DSH Chat Fold Development Guidelines

Read [`HORIZON.md`](HORIZON.md) before planning or implementing a change. These guidelines govern the standalone DSH Chat Fold plugin.

## Product boundary

The plugin owns:

- compact-turn presentation of the stock Harness Web transcript in long sessions;
- plugin-namespaced data attributes and one stylesheet on the conversation flow;
- the footer click-to-toggle interaction.

The plugin does not own:

- session data, history windowing, or any Harness RPC behavior;
- the stock fold feature; the plugin stands down whenever stock folding is active;
- authentication, relay behavior, or Harness source.

## Architecture rules

1. **Client-only.** The Host face exists only so DSH can discover the Client half; it must stay empty.
2. **No services.** The client half declares `inject: []` and works purely on public DOM anchors. Do not add Cordis service dependencies to hide, move, or replace stock UI.
3. **Semantic anchors only.** Read `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, and `data-turn-process-member`. Never target generated CSS-module class names.
4. **Attribute-only writes.** The controller may set or remove only `data-dsh-fold-root`, `data-dsh-fold-standdown`, `data-dsh-fold-hidden`, `data-dsh-fold-toggle`, and `data-dsh-fold-open`. Never reparent, create, or remove React-owned DOM.
5. **One observer, one pass.** A single document-scoped childList MutationObserver guards container liveness with an O(1) check and schedules one rAF-throttled classification per batch. Classification walks only direct flow-row children of the container.
6. **Minimal writes.** Attribute writes diff against the current attribute state so streaming rows are not rewritten every frame.
7. **Stock first.** When any row carries `data-turn-process-member`, the controller sets its stand-down marker, clears its own attributes, and stops toggling.
8. **Disposal is complete.** The disposer removes the observer, click listener, stylesheet, and every owned attribute.
9. **English comments; locale-free presentation.** The chevron glyphs are language-neutral; do not add product copy.

## Testing

- Unit tests use jsdom with real MutationObserver timing (flush with a macrotask) and cover: fold classification, answer selection, live-turn exemption, stand-down, toggle and interactive-child guard, late footer arrival, disposal, and container replacement.
- Run `pnpm run check` (typecheck, tests, build) before every commit.
- Live validation loads the built `lib/client.js` through a Web profile `link:` dependency and exercises a long session where stock folding is dormant, plus a short session where stock folding engages.

## Distribution model

- Develop and distribute one standalone DSH plugin from its own GitHub repository.
- Do not modify or fork the DeepSeek Harness source.
- Installation may add the plugin dependency and bundle entry to a Web profile. Back up the profile manifest and lockfile before the first installation, then inspect the resulting diff.
- Use a local `link:` dependency during development and a pinned release tag for normal installation.
- Release by pushing a GitHub tag matching the package version; `dsh` resolves the repository through the `dsh-plugin` topic and `dsh.plugin add`.
