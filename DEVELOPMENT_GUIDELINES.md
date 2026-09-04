# DSH Chat Fold Development Guidelines

Read [`HORIZON.md`](HORIZON.md) before planning or implementing a change. These guidelines govern the standalone DSH Chat Fold plugin.

## Product boundary

The plugin owns:

- compact-turn presentation of the stock Harness Web transcript in long sessions;
- plugin-namespaced data attributes, one stylesheet, and one disclosure button element per settled turn placed in the stock `turn-process` slot;
- the localized summary and labels for that disclosure through the plugin's own locale namespace.

The plugin does not own:

- session data, history windowing, or any Harness RPC behavior;
- the stock fold feature; the plugin stands down whenever stock folding is active;
- the stock footer actions; the footer row itself is never a toggle target because a touch tap on it can activate stock actions such as fork;
- authentication, relay behavior, or Harness source.

## Architecture rules

1. **Client-only.** The Host face exists only so DSH can discover the Client half; it must stay empty.
2. **Locale for labels.** The client half declares `inject: ['locale']`, registers its own `dsh-chat-fold` namespace (en/zh), and passes the summary and label templates into the controller. Do not add further Cordis service dependencies.
3. **Semantic anchors only.** Read `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, and `data-turn-process-member`. Never target generated CSS-module class names.
4. **Minimal writes.** The controller may set or remove only `data-dsh-fold-root`, `data-dsh-fold-standdown`, and `data-dsh-fold-hidden` on stock rows. The one element it creates is its disclosure `<button>` (`data-dsh-fold-disclosure`), appended as the only child of the turn's empty stock `turn-process` row; never reparent or remove React-owned DOM. The stock `hidden="until-found"` hiding of that slot is overridden only for rows hosting the disclosure, only while not standing down.
5. **One observer, one pass.** A single document-scoped childList MutationObserver guards container liveness with an O(1) check and schedules one rAF-throttled classification per batch. Classification walks only direct flow-row children of the container.
6. **Diffed writes.** Attribute and disclosure-state writes diff against current state so streaming rows are not rewritten every frame; a stock re-render that removes the disclosure is healed by the next pass.
7. **Stock first.** When any row carries `data-turn-process-member`, the controller sets its stand-down marker, removes its disclosure buttons and fold attributes, and stops toggling.
8. **Disposal is complete.** The disposer removes the observer, click listener, stylesheet, every owned attribute, and every disclosure button.
9. **English comments.** The chevron glyph and transforms are language-neutral; all product copy lives in the locale namespace.

## Testing

- Unit tests use jsdom with real MutationObserver timing: mutations flush through a macrotask, and classification flushes through a deferred rAF queue (never synchronously inside the observer callback). Coverage: fold classification, answer selection, summary composition (tool calls, messages, thought fallback), live-turn exemption, stand-down, disclosure toggle and `aria-expanded`, disclosure self-healing after removal, turns without a disclosure slot staying unfolded, disposal, and container replacement.
- Run `pnpm run check` (typecheck, unit tests, build, and built-artifact verification) before every commit.
- The artifact verifier executes `lib/client.js` alone and between neighboring Harness-style factory registrations, verifies its module id and Cordis exports, checks the source map, and rejects a publication layout that ignores or omits the built Client files.
- Live validation loads the built `lib/client.js` through a Web profile `link:` dependency and exercises a clean Web cold start, a long session where stock folding is dormant, and a short session where stock folding engages.

## Distribution model

- Develop and distribute one standalone DSH plugin from its own GitHub repository.
- Do not modify or fork the DeepSeek Harness source.
- Installation may add the plugin dependency and bundle entry to a Web profile. Back up the profile manifest and lockfile before the first installation, then inspect the resulting diff.
- Use a local `link:` dependency during development and a pinned release tag for normal installation.
- Keep `lib/` tracked. GitHub-tag installation consumes repository contents directly, so a tag without the built Host, Client, declarations, and maps is not a release.
- Stamp the package version into the Client registration banner. Harness serves startup combinations as immutable content-addressed resources; release provenance must therefore change the artifact bytes and its bundle revision.
- Release by pushing a GitHub tag matching the package version; `dsh` resolves the repository through the `dsh-plugin` topic and `dsh plugin add`.
