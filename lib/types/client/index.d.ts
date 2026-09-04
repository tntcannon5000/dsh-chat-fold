/** DSH Chat Fold browser plugin. */
import { en as labelsEn, zh as labelsZh } from './labels.js';
import { type HistorySessions } from './history-preloader.js';
/** Stable Client plugin name. */
export declare const name = "chat-fold";
/** Services required for localized folding and bounded history preload. */
export declare const inject: string[];
/** Small portion of the public locale service used by this plugin. */
export interface ChatFoldLocale {
    register(namespace: string, dictionaries: {
        en: typeof labelsEn;
        zh: typeof labelsZh;
    }): () => void;
    bind(namespace: string): (key: keyof typeof labelsEn) => string;
}
/** Client context needed to mount the fold controller. */
export interface ChatFoldClientContext {
    locale: ChatFoldLocale;
    sessions: HistorySessions;
    effect(setup: () => () => void, label: string): void;
}
/**
 * Mount compact folding and the bounded selected-session history preload.
 * @param context - browser Cordis context providing locale and sessions services.
 */
export declare function apply(context: ChatFoldClientContext): void;
