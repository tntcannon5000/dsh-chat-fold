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
/** Options accepted by {@link installChatFoldController}. */
export interface ChatFoldControllerOptions {
    /** Accessible label for expanding a folded turn. */
    readonly showLabel: string;
    /** Accessible label for collapsing an expanded turn. */
    readonly hideLabel: string;
    /** "{count} tool call" singular template. */
    readonly toolCallOne: string;
    /** "{count} tool calls" plural template. */
    readonly toolCallOther: string;
    /** "{count} message" singular template. */
    readonly messageOne: string;
    /** "{count} messages" plural template. */
    readonly messageOther: string;
    /** Segment separator between summary counts. */
    readonly separator: string;
    /** Summary fallback for a turn with no counted process segments. */
    readonly thoughtLabel: string;
}
/**
 * Restore compact turn folding on the stock Chat transcript.
 * @param options - localized labels for the per-turn disclosure.
 * @returns disposer removing every listener, element, attribute, and style the controller owns.
 */
export declare function installChatFoldController(options: ChatFoldControllerOptions): () => void;
