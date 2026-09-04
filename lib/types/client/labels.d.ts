/** Localized labels the fold controller needs for its disclosure button. */
/** Labels carried from the plugin's locale registration into the controller. */
export interface ChatFoldLabels {
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
/** English labels. */
export declare const en: {
    'fold.show': string;
    'fold.hide': string;
    'fold.toolCall.one': string;
    'fold.toolCall.other': string;
    'fold.message.one': string;
    'fold.message.other': string;
    'fold.separator': string;
    'fold.thought': string;
};
/** Simplified Chinese labels. */
export declare const zh: {
    'fold.show': string;
    'fold.hide': string;
    'fold.toolCall.one': string;
    'fold.toolCall.other': string;
    'fold.message.one': string;
    'fold.message.other': string;
    'fold.separator': string;
    'fold.thought': string;
};
