# DSH Chat Fold Development Guidelines

Read [`HORIZON.md`](HORIZON.md) before planning or implementing a change. These guidelines govern the standalone DSH Chat Fold plugin.

## Product boundary

The plugin owns:

- compact-turn presentation of the stock Harness Web transcript in long sessions;
- plugin-namespaced data attributes, one stylesheet, and one disclosure subtree per settled turn placed in the stock `turn-process` slot;
- the localized accessibility labels for that disclosure and the stock footer's localized end-to-end duration text;
- a one-time four-page preload through each selected Session object's public history operation.

The plugin does not own:

- session data, page-size constants, or any Harness RPC behavior;
- the stock fold feature; the plugin stands down whenever stock folding is active;
- the stock footer actions; the footer row itself is never a toggle target because a touch tap on it can activate stock actions such as fork;
- authentication, relay behavior, or Harness source.

## Architecture rules

1. **Client-only.** The Host face exists only so DSH can discover the Client half; it must stay empty.
2. **Locale and sessions only.** The client half declares `inject: ['locale', 'sessions']`, registers its own `dsh-chat-fold` namespace (en/zh), and uses the public sessions service only to preload four additional pages. Do not add further Cordis service dependencies.
3. **Semantic anchors only.** Read `data-chat-flow-kind`, `data-chat-turn`, `data-chat-anchor-key`, `data-actions-reveal`, `data-variant="think"`, ARIA dialog semantics, and `data-turn-process-member`. Never target generated CSS-module class names or parse localized duration text.
4. **Minimal writes.** The fold controller may set or remove only `data-dsh-fold-root`, `data-dsh-fold-standdown`, `data-dsh-fold-hidden`, and `data-dsh-fold-inline-hidden` on stock elements. Its disclosure `<button>` (`data-dsh-fold-disclosure`) owns its label span and SVG chevron inside the turn's empty stock `turn-process` row; never reparent or remove React-owned DOM. The stock `hidden="until-found"` hiding of that slot is overridden only for rows hosting the disclosure, only while not standing down.
5. **One observer, one pass.** A single document-scoped childList MutationObserver guards container liveness with an O(1) check and schedules one rAF-throttled classification per batch. Classification walks only direct flow-row children of the container.
6. **Diffed writes.** Attribute and disclosure-state writes diff against current state so streaming rows are not rewritten every frame; a stock re-render that removes the disclosure is healed by the next pass.
7. **Stock first.** When any row carries `data-turn-process-member`, the controller sets its stand-down marker, removes its disclosure buttons and fold attributes, and stops toggling.
8. **History preload is bounded.** The history controller subscribes only to the sessions list and the selected Session snapshot, calls `loadOlder()` sequentially at most four times per Session object, and stops on exhaustion, selection change, or disposal.
9. **Disposal is complete.** The disposers remove observers, subscriptions, click listeners, stylesheet, every owned attribute, and every disclosure subtree.
10. **English comments.** The SVG chevron and transforms are language-neutral; all plugin-owned product copy lives in the locale namespace, while the visible duration is copied verbatim from stock's localized footer.

## Testing

- Fold-controller tests use jsdom with real MutationObserver timing: mutations flush through a macrotask, and classification flushes through a deferred rAF queue. Coverage includes stock-duration reuse and fallback, system-prompt and final-row reasoning folding, live-turn exemption, stand-down, disclosure toggle and `aria-expanded`, SVG chevron state, self-healing, no-slot behavior, disposal, and container replacement.
- History-controller tests drive fake sessions/list stores and cover four sequential preloads, early exhaustion, selection changes, once-per-object behavior, failure containment, and disposal.
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
