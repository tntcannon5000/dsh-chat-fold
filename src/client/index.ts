/** DSH Chat Fold browser plugin. */
import {
  en as labelsEn,
  zh as labelsZh,
  type ChatFoldLabels,
} from './labels.js'
import { installChatFoldController } from './fold-controller.js'

/** Stable Client plugin name. */
export const name = 'chat-fold'

/** The locale service carries the toggle button's accessible labels. */
export const inject = ['locale']

/** Small portion of the public locale service used by this plugin. */
export interface ChatFoldLocale {
  register(namespace: string, dictionaries: { en: typeof labelsEn, zh: typeof labelsZh }): () => void
  bind(namespace: string): (key: keyof typeof labelsEn) => string
}

/** Client context needed to mount the fold controller. */
export interface ChatFoldClientContext {
  locale: ChatFoldLocale
  effect(setup: () => () => void, label: string): void
}

function labelsOf(t: (key: keyof typeof labelsEn) => string): ChatFoldLabels {
  return { showLabel: t('fold.show'), hideLabel: t('fold.hide') }
}

/**
 * Mount the compact-transcript fold controller with localized toggle labels.
 * @param context - browser Cordis context providing the locale service.
 */
export function apply(context: ChatFoldClientContext): void {
  context.effect(() => {
    const disposeLocale = context.locale.register('dsh-chat-fold', { en: labelsEn, zh: labelsZh })
    const disposeController = installChatFoldController(
      labelsOf(context.locale.bind('dsh-chat-fold')),
    )
    return () => {
      disposeController()
      disposeLocale()
    }
  }, 'dsh-chat-fold: compact turn folding for long sessions')
}
