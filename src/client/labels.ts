/** Localized labels the fold controller needs for its disclosure button. */

/** Labels carried from the plugin's locale registration into the controller. */
export interface ChatFoldLabels {
  /** Accessible label for expanding a folded turn. */
  readonly showLabel: string
  /** Accessible label for collapsing an expanded turn. */
  readonly hideLabel: string
  /** "{count} tool call" singular template. */
  readonly toolCallOne: string
  /** "{count} tool calls" plural template. */
  readonly toolCallOther: string
  /** "{count} message" singular template. */
  readonly messageOne: string
  /** "{count} messages" plural template. */
  readonly messageOther: string
  /** Segment separator between summary counts. */
  readonly separator: string
  /** Summary fallback for a turn with no counted process segments. */
  readonly thoughtLabel: string
  /** Stock-compatible end-to-end duration template. */
  readonly ranForTemplate: string
}

/** English labels. */
export const en = {
  'fold.show': 'Show turn process',
  'fold.hide': 'Hide turn process',
  'fold.toolCall.one': '{count} tool call',
  'fold.toolCall.other': '{count} tool calls',
  'fold.message.one': '{count} message',
  'fold.message.other': '{count} messages',
  'fold.separator': ' · ',
  'fold.thought': 'Thought for a while',
  'fold.ranFor': 'Ran for {duration}',
}

/** Simplified Chinese labels. */
export const zh = {
  'fold.show': '显示轮次过程',
  'fold.hide': '收起轮次过程',
  'fold.toolCall.one': '{count} 次工具调用',
  'fold.toolCall.other': '{count} 次工具调用',
  'fold.message.one': '{count} 条消息',
  'fold.message.other': '{count} 条消息',
  'fold.separator': ' · ',
  'fold.thought': '已思考',
  'fold.ranFor': '用时 {duration}',
}
