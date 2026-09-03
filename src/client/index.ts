/** DSH Chat Fold browser plugin. */
import { installChatFoldController } from './fold-controller.js'

/** Stable Client plugin name. */
export const name = 'chat-fold'

/** The fold feature needs no Cordis service; it works on public DOM anchors. */
export const inject: string[] = []

/**
 * Mount the compact-transcript fold controller.
 * @param context - browser Cordis context; unused because the feature is presentation-only.
 */
export function apply(context: { effect: (setup: () => () => void, label: string) => void }): void {
  context.effect(
    () => installChatFoldController(),
    'dsh-chat-fold: compact turn folding for long sessions',
  )
}
