/** Localized labels the fold controller needs for its toggle button. */

/** Labels carried from the plugin's locale registration into the controller. */
export interface ChatFoldLabels {
  /** Accessible label for expanding a folded turn. */
  readonly showLabel: string
  /** Accessible label for collapsing an expanded turn. */
  readonly hideLabel: string
}

/** English labels. */
export const en = {
  'fold.show': 'Show turn process',
  'fold.hide': 'Hide turn process',
}

/** Simplified Chinese labels. */
export const zh = {
  'fold.show': '显示轮次过程',
  'fold.hide': '收起轮次过程',
}
