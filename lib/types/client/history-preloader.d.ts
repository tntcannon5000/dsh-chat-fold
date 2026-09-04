/** Bounded selected-session history preload through the public Session face. */
/** Minimal observable store used by the preloader. */
export interface HistorySnapshotSource<T> {
    getSnapshot(): T;
    subscribe(listener: () => void): () => void;
}
/** Session state required to sequence history pages. */
export interface HistorySessionSnapshot {
    readonly openState: string;
    readonly hasMore: boolean;
    readonly loadingOlder: boolean;
}
/** Public Session operations used by the preloader. */
export interface HistorySession extends HistorySnapshotSource<HistorySessionSnapshot> {
    loadOlder(): Promise<void>;
}
/** One event-window revision used to verify that a resolved pull actually prepended. */
export interface HistoryEventWindow {
    readonly revision: number;
    readonly change: {
        readonly kind: string;
    };
}
/** Stable Session binding returned by the public sessions service. */
export interface HistorySessionBinding {
    readonly session: HistorySession;
    readonly eventSource: HistorySnapshotSource<HistoryEventWindow>;
}
/** Sessions service surface required by the preloader. */
export interface HistorySessions {
    readonly list: HistorySnapshotSource<{
        readonly current?: string | undefined;
    }>;
    binding(id: string): HistorySessionBinding | undefined;
}
/** Four stock pages plus the Session Controller's initial page make the 5× window. */
export declare const EXTRA_HISTORY_PAGES = 4;
/**
 * Preload four additional history pages once per selected Session object.
 * A resolved pull must publish a prepend revision before another page starts.
 * @param sessions - public sessions service.
 * @returns disposer removing list and Session subscriptions.
 */
export declare function installHistoryPreloader(sessions: HistorySessions): () => void;
