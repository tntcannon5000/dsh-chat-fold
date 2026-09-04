/** DSH Chat Fold browser plugin. */
import {
  en as labelsEn,
  zh as labelsZh,
  type ChatFoldLabels,
} from './labels.js'
import { installChatFoldController } from './fold-controller.js'
import { installHistoryPreloader, type HistorySessions } from './history-preloader.js'

/** Stable Client plugin name. */
export const name = 'chat-fold'

/** Services required for localized folding and bounded history preload. */
export const inject = ['locale', 'sessions']

/** Small portion of the public locale service used by this plugin. */
export interface ChatFoldLocale {
  register(namespace: string, dictionaries: { en: typeof labelsEn, zh: typeof labelsZh }): () => void
  bind(namespace: string): (key: keyof typeof labelsEn) => string
}

/** Client context needed to mount the fold controller. */
export interface ChatFoldClientContext {
  locale: ChatFoldLocale
  sessions: HistorySessions
  effect(setup: () => () => void, label: string): void
}

function labelsOf(t: (key: keyof typeof labelsEn) => string): ChatFoldLabels {
  return {
    showLabel: t('fold.show'),
    hideLabel: t('fold.hide'),
    toolCallOne: t('fold.toolCall.one'),
    toolCallOther: t('fold.toolCall.other'),
    messageOne: t('fold.message.one'),
    messageOther: t('fold.message.other'),
    separator: t('fold.separator'),
    thoughtLabel: t('fold.thought'),
    ranForTemplate: t('fold.ranFor'),
  }
}

/**
 * Mount compact folding and the bounded selected-session history preload.
 * @param context - browser Cordis context providing locale and sessions services.
 */
export function apply(context: ChatFoldClientContext): void {
  context.effect(() => {
    const disposeLocale = context.locale.register('dsh-chat-fold', { en: labelsEn, zh: labelsZh })
    const disposeController = installChatFoldController(
      labelsOf(context.locale.bind('dsh-chat-fold')),
    )
    const disposeHistory = installHistoryPreloader(context.sessions)
    return () => {
      disposeHistory()
      disposeController()
      disposeLocale()
    }
  }, 'dsh-chat-fold: compact turn folding for long sessions')
}
