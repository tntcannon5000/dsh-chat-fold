/* dsh-chat-fold v0.1.0-alpha.4 */
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
			"fold.thought": "Thought for a while"
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
			"fold.thought": "已思考"
		};
		//#endregion
		//#region src/client/styles.ts
		/**
		* Presentation-only CSS for the fold controller. Every rule scopes behind the
		* plugin-owned root marker and drives off plugin-owned data attributes, so the
		* sheet stays inert the moment the controller disposes. The disclosure rules
		* mirror the stock turn-process button's layout one-for-one.
		*/
		const CHAT_FOLD_STYLES = `
[data-dsh-fold-root]:not([data-dsh-fold-standdown]) [data-dsh-fold-hidden] {
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

[data-dsh-fold-root] [data-dsh-fold-disclosure]:not([data-dsh-fold-open]) {
  margin-bottom: 8px;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > span:first-child {
  font-size: 14px;
  line-height: 24px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > span:last-child {
  color: var(--dsw-alias-label-tertiary);
  flex: none;
  height: 16px;
  margin-left: 6px;
  transform: rotate(-90deg);
  transition: transform 100ms ease;
  width: 16px;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure][data-dsh-fold-open] > span:last-child {
  transform: rotate(0deg);
}

@media (prefers-reduced-motion: reduce) {
  [data-dsh-fold-root] [data-dsh-fold-disclosure] > span:last-child {
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
		* stock "N tool calls ›" line above the final answer, never at the bottom of
		* the chat. The disclosure is self-healing: a stock re-render that removes it
		* is observed and the next classification pass re-appends it. While stock
		* folding is active the controller stands down completely and removes its own
		* additions.
		*/
		/** One flow row kind that stock folding never hides. */
		const INDEPENDENT_KINDS = /* @__PURE__ */ new Set([
			"system-prompt",
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
		const DISCLOSURE_ATTR = "data-dsh-fold-disclosure";
		const OPEN_ATTR = "data-dsh-fold-open";
		const FOLDED_GLYPH = "⌄";
		const EXPANDED_GLYPH = "⌄";
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
				for (const element of container.querySelectorAll(`[${HIDDEN_ATTR}]`)) element.removeAttribute(HIDDEN_ATTR);
				for (const disclosure of container.querySelectorAll(`[${DISCLOSURE_ATTR}]`)) disclosure.remove();
			};
			/** Compose the stock disclosure summary from the turn's counted rows. */
			const summaryOf = (toolCalls, messages) => {
				const segments = [];
				if (toolCalls > 0) segments.push(interpolate(toolCalls === 1 ? options.toolCallOne : options.toolCallOther, toolCalls));
				if (messages > 0) segments.push(interpolate(messages === 1 ? options.messageOne : options.messageOther, messages));
				return segments.length === 0 ? options.thoughtLabel : segments.join(options.separator);
			};
			const syncDisclosure = (processRow, summary, open) => {
				let disclosure = processRow.querySelector(`:scope > [${DISCLOSURE_ATTR}]`);
				if (disclosure === null) {
					disclosure = document.createElement("button");
					disclosure.type = "button";
					disclosure.setAttribute(DISCLOSURE_ATTR, "");
					const labelSpan = document.createElement("span");
					const glyphSpan = document.createElement("span");
					glyphSpan.textContent = FOLDED_GLYPH;
					disclosure.append(labelSpan, glyphSpan);
					processRow.appendChild(disclosure);
				}
				const labelSpan = disclosure.querySelector(":scope > span:first-child");
				if (labelSpan !== null && labelSpan.textContent !== summary) labelSpan.textContent = summary;
				if (disclosure.getAttribute("aria-label") !== summary) disclosure.setAttribute("aria-label", summary);
				disclosure.setAttribute("aria-expanded", String(open));
				writeRow(disclosure, OPEN_ATTR, open);
				const glyphSpan = disclosure.querySelector(":scope > span:last-child");
				if (glyphSpan !== null && glyphSpan.textContent !== EXPANDED_GLYPH) glyphSpan.textContent = EXPANDED_GLYPH;
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
					const open = bound.expanded.has(key);
					let toolCalls = 0;
					let messages = 0;
					let foldableRows = 0;
					for (const [index, row] of group.entries()) {
						const isAnswer = row.kind === "assistant-step" && index === answerIndex;
						if (!(!INDEPENDENT_KINDS.has(row.kind) && !isAnswer)) continue;
						foldableRows += 1;
						if (row.kind === TOOL_CALL_KIND) toolCalls += 1;
						else if (row.kind === "assistant-step") messages += 1;
						writeRow(row.element, HIDDEN_ATTR, settled && processRow !== void 0 && !open);
					}
					if (!settled || processRow === void 0 || foldableRows === 0) continue;
					syncDisclosure(processRow.element, summaryOf(toolCalls, messages), open);
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
						bound.container.removeEventListener("click", onClick);
						bound.container.removeAttribute(ROOT_ATTR);
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
		//#endregion
		//#region src/client/index.ts
		/** DSH Chat Fold browser plugin. */
		/** Stable Client plugin name. */
		const name = "chat-fold";
		/** The locale service carries the toggle button's accessible labels. */
		const inject = ["locale"];
		function labelsOf(t) {
			return {
				showLabel: t("fold.show"),
				hideLabel: t("fold.hide"),
				toolCallOne: t("fold.toolCall.one"),
				toolCallOther: t("fold.toolCall.other"),
				messageOne: t("fold.message.one"),
				messageOther: t("fold.message.other"),
				separator: t("fold.separator"),
				thoughtLabel: t("fold.thought")
			};
		}
		/**
		* Mount the compact-transcript fold controller with localized toggle labels.
		* @param context - browser Cordis context providing the locale service.
		*/
		function apply(context) {
			context.effect(() => {
				const disposeLocale = context.locale.register("dsh-chat-fold", {
					en,
					zh
				});
				const disposeController = installChatFoldController(labelsOf(context.locale.bind("dsh-chat-fold")));
				return () => {
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