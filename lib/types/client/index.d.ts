/** DSH Chat Fold browser plugin. */
import { en as labelsEn, zh as labelsZh } from './labels.js';
/** Stable Client plugin name. */
export declare const name = "chat-fold";
/** The locale service carries the toggle button's accessible labels. */
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
    effect(setup: () => () => void, label: string): void;
}
/**
 * Mount the compact-transcript fold controller with localized toggle labels.
 * @param context - browser Cordis context providing the locale service.
 */
export declare function apply(context: ChatFoldClientContext): void;
