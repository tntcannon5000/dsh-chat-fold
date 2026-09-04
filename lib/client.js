/* dsh-chat-fold v0.1.0-alpha.5 */
window.__ModuleLoader__.load({
	id: "dsh-chat-fold",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/labels.ts
		/** English labels. */
		const en = {
			"fold.show": "Show turn process",
			"fold.hide": "Hide turn process",
			"fold.toolCall.one": "{count} tool call",
			"fold.toolCall.other": "{count} tool calls",
			"fold.message.one": "{count} message",
			"fold.message.other": "{count} messages",
			"fold.separator": " · ",
			"fold.thought": "Thought for a while",
			"fold.ranFor": "Ran for {duration}"
		};
		/** Simplified Chinese labels. */
		const zh = {
			"fold.show": "显示轮次过程",
			"fold.hide": "收起轮次过程",
			"fold.toolCall.one": "{count} 次工具调用",
			"fold.toolCall.other": "{count} 次工具调用",
			"fold.message.one": "{count} 条消息",
			"fold.message.other": "{count} 条消息",
			"fold.separator": " · ",
			"fold.thought": "已思考",
			"fold.ranFor": "用时 {duration}"
		};
		//#endregion
		//#region src/client/styles.ts
		/**
		* Presentation-only CSS for the fold controller. Every rule scopes behind the
		* plugin-owned root marker and drives off plugin-owned data attributes, so the
		* sheet stays inert the moment the controller disposes. The disclosure rules
		* mirror the stock turn-process button's layout one-for-one, except for the
		* closed-state bottom margin: stock pairs its 8px disclosure margin with an
		* 8px answer-row gap (`data-turn-process-answer`, set only while stock folding
		* is active). Here the answer row keeps the default 16px flow rhythm, so the
		* copied margin would render a 24px blank row below the hairline.
		*/
		const CHAT_FOLD_STYLES = `
[data-dsh-fold-root]:not([data-dsh-fold-standdown])
:is([data-dsh-fold-hidden], [data-dsh-fold-inline-hidden]) {
  display: none !important;
}

/* The answer's inline reasoning sits inside a bare stock pass-through wrapper
   that carries no anchor while stock folding is dormant. Hiding the reasoning
   row alone leaves that wrapper as a zero-height flex item in the answer
   body, and the body's 16px flex gap then renders as a blank row below the
   disclosure hairline. Hide the wrapper as well; the owned child attribute
   keeps the rule scoped without writing to the stock element. */
[data-dsh-fold-root]:not([data-dsh-fold-standdown])
:has(> [data-dsh-fold-inline-hidden]) {
  display: none !important;
}

[data-dsh-fold-root]:not([data-dsh-fold-standdown])
[data-chat-flow-kind='turn-process'][data-turn-process-hidden]:has(> [data-dsh-fold-disclosure]) {
  display: block !important;
  content-visibility: visible !important;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] {
  appearance: none;
  background: none;
  border: none;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  box-sizing: border-box;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  font: inherit;
  height: 33px;
  min-width: 0;
  padding: 0 0 8px;
  text-align: left;
  width: 100%;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > span:first-child {
  font-size: 15px;
  line-height: 24px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > svg {
  color: var(--dsw-alias-label-tertiary);
  flex: none;
  margin-left: 7px;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: transform 140ms ease;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure][data-dsh-fold-open] > svg {
  transform: rotate(0deg);
}

@media (prefers-reduced-motion: reduce) {
  [data-dsh-fold-root] [data-dsh-fold-disclosure] > svg {
    transition: none;
  }
}
`;
		//#endregion
		//#region src/client/fold-controller.ts
		/**
		* Chat fold controller.
		*
		* Restores compact turn folding for sessions where the stock Web transcript
		* keeps every completed row expanded. The stock UI disables turn folding while
		* any older history page is unloaded (`historyIncomplete`), so very long
		* sessions never fold at all. This controller re-creates the stock Compact
		* presentation on top of the stock DOM using only semantic `data-*` anchors
		* published by the Chat flow rows:
		*
		* - rows carry `data-chat-turn` and `data-chat-flow-kind`;
		* - every turn renders an (empty, stock-hidden through `hidden="until-found"`)
		*   `turn-process` row ahead of the finalized answer — the exact slot the
		*   stock disclosure occupies when it can fold;
		* - a settled turn renders a `turn-tail` footer row;
		* - stock folding, when active, marks its own rows `data-turn-process-member`.
		*
		* The controller hides folded process rows through plugin-owned data
		* attributes and one stylesheet, and toggles a turn through one plugin-owned
		* disclosure button placed inside the empty `turn-process` row — visually the
		* stock disclosure line above the final answer, labeled with the footer's
		* localized end-to-end duration and never placed at the bottom of the chat.
		* The disclosure is self-healing: a stock re-render that removes it
		* is observed and the next classification pass re-appends it. While stock
		* folding is active the controller stands down completely and removes its own
		* additions.
		*/
		/** One flow row kind that stock folding never hides. */
		const INDEPENDENT_KINDS = /* @__PURE__ */ new Set([
			"user",
			"steering",
			"turn-process",
			"turn-error",
			"turn-max-tokens",
			"turn-tail"
		]);
		const FLOW_ROW_ATTR = "data-chat-flow-kind";
		const TURN_ATTR = "data-chat-turn";
		const ANCHOR_ATTR = "data-chat-anchor-key";
		const STOCK_MEMBER_ATTR = "data-turn-process-member";
		const TOOL_CALL_KIND = "tool-call";
		const ROOT_ATTR = "data-dsh-fold-root";
		const STANDDOWN_ATTR = "data-dsh-fold-standdown";
		const HIDDEN_ATTR = "data-dsh-fold-hidden";
		const INLINE_HIDDEN_ATTR = "data-dsh-fold-inline-hidden";
		const DISCLOSURE_ATTR = "data-dsh-fold-disclosure";
		const OPEN_ATTR = "data-dsh-fold-open";
		const THINK_SELECTOR = "[data-variant=\"think\"]";
		const SVG_NS = "http://www.w3.org/2000/svg";
		function rowOf(element) {
			const kind = element.getAttribute(FLOW_ROW_ATTR);
			const turnValue = element.getAttribute(TURN_ATTR);
			if (kind === null || turnValue === null) return null;
			const turn = Number(turnValue);
			if (!Number.isFinite(turn)) return null;
			return {
				element,
				kind,
				turn,
				anchorKey: element.getAttribute(ANCHOR_ATTR) ?? ""
			};
		}
		function directFlowRows(container) {
			const rows = [];
			for (const element of container.children) {
				const row = rowOf(element);
				if (row !== null) rows.push(row);
			}
			return rows;
		}
		function interpolate(template, count) {
			return template.replace("{count}", String(count));
		}
		/**
		* Restore compact turn folding on the stock Chat transcript.
		* @param options - localized labels for the per-turn disclosure.
		* @returns disposer removing every listener, element, attribute, and style the controller owns.
		*/
		function installChatFoldController(options) {
			const style = document.createElement("style");
			style.dataset.dshChatFoldStyles = "";
			style.textContent = CHAT_FOLD_STYLES;
			document.head.appendChild(style);
			let state = null;
			let documentObserver = null;
			let frame = null;
			let disposed = false;
			const writeRow = (element, attribute, present) => {
				if (present === element.hasAttribute(attribute)) return;
				if (present) element.setAttribute(attribute, "");
				else element.removeAttribute(attribute);
			};
			const clearOwnedAdditions = (container) => {
				for (const element of container.querySelectorAll(`[${HIDDEN_ATTR}], [${INLINE_HIDDEN_ATTR}]`)) {
					element.removeAttribute(HIDDEN_ATTR);
					element.removeAttribute(INLINE_HIDDEN_ATTR);
				}
				for (const disclosure of container.querySelectorAll(`[${DISCLOSURE_ATTR}]`)) disclosure.remove();
			};
			/** Compose the count fallback used when stock exposes no turn duration. */
			const summaryOf = (toolCalls, messages) => {
				const segments = [];
				if (toolCalls > 0) segments.push(interpolate(toolCalls === 1 ? options.toolCallOne : options.toolCallOther, toolCalls));
				if (messages > 0) segments.push(interpolate(messages === 1 ? options.messageOne : options.messageOther, messages));
				return segments.length === 0 ? options.thoughtLabel : segments.join(options.separator);
			};
			/** Reuse stock's localized end-to-end duration without parsing or reformatting it. */
			const runLabelOf = (group) => {
				const tail = group.find((row) => row.kind === "turn-tail")?.element;
				if (tail === void 0) return null;
				const markerAt = options.ranForTemplate.indexOf("{duration}");
				if (markerAt === -1) return null;
				const prefix = options.ranForTemplate.slice(0, markerAt);
				const suffix = options.ranForTemplate.slice(markerAt + 10);
				for (const button of tail.querySelectorAll("[data-actions-reveal] button[aria-haspopup=\"dialog\"]")) {
					const text = button.textContent?.trim() ?? "";
					if (text.startsWith(prefix) && text.endsWith(suffix) && text.length > prefix.length + suffix.length) return text;
				}
				return null;
			};
			const createChevron = () => {
				const svg = document.createElementNS(SVG_NS, "svg");
				svg.setAttribute("viewBox", "0 0 16 16");
				svg.setAttribute("width", "16");
				svg.setAttribute("height", "16");
				svg.setAttribute("aria-hidden", "true");
				svg.setAttribute("focusable", "false");
				const path = document.createElementNS(SVG_NS, "path");
				path.setAttribute("d", "M4 6l4 4 4-4");
				path.setAttribute("fill", "none");
				path.setAttribute("stroke", "currentColor");
				path.setAttribute("stroke-width", "1.5");
				path.setAttribute("stroke-linecap", "round");
				path.setAttribute("stroke-linejoin", "round");
				svg.appendChild(path);
				return svg;
			};
			const syncDisclosure = (processRow, summary, open) => {
				let disclosure = processRow.querySelector(`:scope > [${DISCLOSURE_ATTR}]`);
				if (disclosure === null) {
					disclosure = document.createElement("button");
					disclosure.type = "button";
					disclosure.setAttribute(DISCLOSURE_ATTR, "");
					const labelSpan = document.createElement("span");
					disclosure.append(labelSpan, createChevron());
					processRow.appendChild(disclosure);
				}
				const labelSpan = disclosure.querySelector(":scope > span:first-child");
				if (labelSpan !== null && labelSpan.textContent !== summary) labelSpan.textContent = summary;
				const actionLabel = `${open ? options.hideLabel : options.showLabel}: ${summary}`;
				if (disclosure.getAttribute("aria-label") !== actionLabel) disclosure.setAttribute("aria-label", actionLabel);
				disclosure.setAttribute("aria-expanded", String(open));
				writeRow(disclosure, OPEN_ATTR, open);
			};
			const classify = (bound) => {
				const rows = directFlowRows(bound.container);
				const stockActive = rows.some((row) => row.element.hasAttribute(STOCK_MEMBER_ATTR));
				bound.container.toggleAttribute(STANDDOWN_ATTR, stockActive);
				if (stockActive) {
					clearOwnedAdditions(bound.container);
					return;
				}
				const groups = /* @__PURE__ */ new Map();
				for (const row of rows) {
					const group = groups.get(row.turn);
					if (group === void 0) groups.set(row.turn, [row]);
					else group.push(row);
				}
				const liveKeys = /* @__PURE__ */ new Set();
				bound.turnKeys.clear();
				for (const [turn, group] of groups) {
					const key = `${turn}:${group[0]?.anchorKey ?? ""}`;
					bound.turnKeys.set(turn, key);
					liveKeys.add(key);
					const settled = group.some((row) => row.kind === "turn-tail");
					const processRow = group.find((row) => row.kind === "turn-process");
					const answerIndex = group.findLastIndex((row) => row.kind === "assistant-step");
					const inlineReasoning = (answerIndex === -1 ? void 0 : group[answerIndex]?.element)?.querySelectorAll(THINK_SELECTOR) ?? [];
					const open = bound.expanded.has(key);
					const folded = settled && processRow !== void 0 && !open;
					let toolCalls = 0;
					let messages = 0;
					let foldableRows = 0;
					for (const [index, row] of group.entries()) {
						const isAnswer = row.kind === "assistant-step" && index === answerIndex;
						const foldable = !INDEPENDENT_KINDS.has(row.kind) && !isAnswer;
						writeRow(row.element, HIDDEN_ATTR, foldable && folded);
						if (!foldable) continue;
						foldableRows += 1;
						if (row.kind === TOOL_CALL_KIND) toolCalls += 1;
						else if (row.kind === "assistant-step") messages += 1;
					}
					for (const reasoning of inlineReasoning) writeRow(reasoning, INLINE_HIDDEN_ATTR, folded);
					const foldableSegments = foldableRows + inlineReasoning.length;
					if (!settled || processRow === void 0 || foldableSegments === 0) {
						processRow?.element.querySelector(`:scope > [${DISCLOSURE_ATTR}]`)?.remove();
						continue;
					}
					const summary = runLabelOf(group) ?? summaryOf(toolCalls, messages);
					syncDisclosure(processRow.element, summary, open);
				}
				for (const key of bound.expanded) if (!liveKeys.has(key)) bound.expanded.delete(key);
			};
			const schedule = (bound) => {
				if (frame !== null) return;
				frame = window.requestAnimationFrame(() => {
					frame = null;
					if (!disposed && state === bound) classify(bound);
				});
			};
			const adopt = () => {
				const row = document.querySelector(`[${FLOW_ROW_ATTR}]`);
				if (row === null || row.parentElement === null) return false;
				const container = row.parentElement;
				if (state !== null && state.container === container) return true;
				state = {
					container,
					expanded: /* @__PURE__ */ new Set(),
					turnKeys: /* @__PURE__ */ new Map()
				};
				container.setAttribute(ROOT_ATTR, "");
				const bound = state;
				container.addEventListener("click", onClick);
				classify(bound);
				return true;
			};
			const onDocumentMutation = (records) => {
				if (disposed) return;
				const bound = state;
				if (bound !== null) {
					if (!bound.container.isConnected) {
						if (frame !== null) window.cancelAnimationFrame(frame);
						frame = null;
						bound.container.removeEventListener("click", onClick);
						bound.container.removeAttribute(ROOT_ATTR);
						bound.container.removeAttribute(STANDDOWN_ATTR);
						clearOwnedAdditions(bound.container);
						state = null;
					} else if (records.some((record) => bound.container.contains(record.target))) {
						schedule(bound);
						return;
					} else return;
				}
				adopt();
			};
			const onClick = (event) => {
				if (state === null || state.container.hasAttribute(STANDDOWN_ATTR)) return;
				const disclosure = (event.target instanceof Element ? event.target : null)?.closest(`[${DISCLOSURE_ATTR}]`);
				if (disclosure === null || disclosure === void 0) return;
				const row = disclosure.closest(`[${FLOW_ROW_ATTR}]`);
				if (row === null || row === void 0) return;
				const clicked = rowOf(row);
				if (clicked === null) return;
				const key = state.turnKeys.get(clicked.turn);
				if (key === void 0) return;
				if (state.expanded.has(key)) state.expanded.delete(key);
				else state.expanded.add(key);
				classify(state);
			};
			documentObserver = new MutationObserver(onDocumentMutation);
			documentObserver.observe(document, {
				childList: true,
				subtree: true
			});
			adopt();
			return () => {
				disposed = true;
				documentObserver?.disconnect();
				documentObserver = null;
				if (frame !== null) window.cancelAnimationFrame(frame);
				frame = null;
				if (state !== null) {
					state.container.removeEventListener("click", onClick);
					state.container.removeAttribute(ROOT_ATTR);
					state.container.removeAttribute(STANDDOWN_ATTR);
					clearOwnedAdditions(state.container);
					state = null;
				}
				style.remove();
			};
		}
		/**
		* Preload four additional history pages once per selected Session object.
		* A resolved pull must publish a prepend revision before another page starts.
		* @param sessions - public sessions service.
		* @returns disposer removing list and Session subscriptions.
		*/
		function installHistoryPreloader(sessions) {
			const remaining = /* @__PURE__ */ new WeakMap();
			const loading = /* @__PURE__ */ new WeakSet();
			let selected = null;
			let disposeSelected = null;
			let disposed = false;
			const pump = (binding) => {
				const session = binding.session;
				if (disposed || selected !== binding || loading.has(session)) return;
				const snapshot = session.getSnapshot();
				const pages = remaining.get(session) ?? 4;
				if (snapshot.openState !== "open" || snapshot.loadingOlder || pages === 0) return;
				if (!snapshot.hasMore) {
					remaining.set(session, 0);
					return;
				}
				remaining.set(session, pages - 1);
				loading.add(session);
				const beforeRevision = binding.eventSource.getSnapshot().revision;
				session.loadOlder().then(() => {
					const window = binding.eventSource.getSnapshot();
					if (window.revision <= beforeRevision || window.change.kind !== "prepend") remaining.set(session, 0);
				}).catch((error) => {
					remaining.set(session, 0);
					console.error("[dsh-chat-fold] history preload failed:", error);
				}).finally(() => {
					loading.delete(session);
					if (selected === binding) pump(binding);
				});
			};
			const syncSelection = () => {
				const current = sessions.list.getSnapshot().current;
				const next = current === void 0 ? null : sessions.binding(current) ?? null;
				if (selected === next) {
					if (next !== null) pump(next);
					return;
				}
				disposeSelected?.();
				disposeSelected = null;
				selected = next;
				if (next === null) return;
				if (!remaining.has(next.session)) remaining.set(next.session, 4);
				disposeSelected = next.session.subscribe(() => {
					pump(next);
				});
				pump(next);
			};
			const disposeList = sessions.list.subscribe(syncSelection);
			syncSelection();
			return () => {
				disposed = true;
				disposeList();
				disposeSelected?.();
				disposeSelected = null;
				selected = null;
			};
		}
		//#endregion
		//#region src/client/index.ts
		/** DSH Chat Fold browser plugin. */
		/** Stable Client plugin name. */
		const name = "chat-fold";
		/** Services required for localized folding and bounded history preload. */
		const inject = ["locale", "sessions"];
		function labelsOf(t) {
			return {
				showLabel: t("fold.show"),
				hideLabel: t("fold.hide"),
				toolCallOne: t("fold.toolCall.one"),
				toolCallOther: t("fold.toolCall.other"),
				messageOne: t("fold.message.one"),
				messageOther: t("fold.message.other"),
				separator: t("fold.separator"),
				thoughtLabel: t("fold.thought"),
				ranForTemplate: t("fold.ranFor")
			};
		}
		/**
		* Mount compact folding and the bounded selected-session history preload.
		* @param context - browser Cordis context providing locale and sessions services.
		*/
		function apply(context) {
			context.effect(() => {
				const disposeLocale = context.locale.register("dsh-chat-fold", {
					en,
					zh
				});
				const disposeController = installChatFoldController(labelsOf(context.locale.bind("dsh-chat-fold")));
				const disposeHistory = installHistoryPreloader(context.sessions);
				return () => {
					disposeHistory();
					disposeController();
					disposeLocale();
				};
			}, "dsh-chat-fold: compact turn folding for long sessions");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map