/** Bounded selected-session history preload through the public Session face. */

/** Minimal observable store used by the preloader. */
export interface HistorySnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** Session state required to sequence history pages. */
export interface HistorySessionSnapshot {
  readonly openState: string
  readonly hasMore: boolean
  readonly loadingOlder: boolean
}

/** Public Session operations used by the preloader. */
export interface HistorySession extends HistorySnapshotSource<HistorySessionSnapshot> {
  loadOlder(): Promise<void>
}

/** One event-window revision used to verify that a resolved pull actually prepended. */
export interface HistoryEventWindow {
  readonly revision: number
  readonly change: { readonly kind: string }
}

/** Stable Session binding returned by the public sessions service. */
export interface HistorySessionBinding {
  readonly session: HistorySession
  readonly eventSource: HistorySnapshotSource<HistoryEventWindow>
}

/** Sessions service surface required by the preloader. */
export interface HistorySessions {
  readonly list: HistorySnapshotSource<{ readonly current?: string | undefined }>
  binding(id: string): HistorySessionBinding | undefined
}

/** Four stock pages plus the Session Controller's initial page make the 5× window. */
export const EXTRA_HISTORY_PAGES = 4

/**
 * Preload four additional history pages once per selected Session object.
 * A resolved pull must publish a prepend revision before another page starts.
 * @param sessions - public sessions service.
 * @returns disposer removing list and Session subscriptions.
 */
export function installHistoryPreloader(sessions: HistorySessions): () => void {
  const remaining = new WeakMap<HistorySession, number>()
  const loading = new WeakSet<HistorySession>()
  let selected: HistorySessionBinding | null = null
  let disposeSelected: (() => void) | null = null
  let disposed = false

  const pump = (binding: HistorySessionBinding): void => {
    const session = binding.session
    if (disposed || selected !== binding || loading.has(session)) return
    const snapshot = session.getSnapshot()
    const pages = remaining.get(session) ?? EXTRA_HISTORY_PAGES
    if (snapshot.openState !== 'open' || snapshot.loadingOlder || pages === 0) return
    if (!snapshot.hasMore) {
      remaining.set(session, 0)
      return
    }
    remaining.set(session, pages - 1)
    loading.add(session)
    const beforeRevision = binding.eventSource.getSnapshot().revision
    void session.loadOlder().then(() => {
      const window = binding.eventSource.getSnapshot()
      if (window.revision <= beforeRevision || window.change.kind !== 'prepend') {
        remaining.set(session, 0)
      }
    }).catch((error: unknown) => {
      remaining.set(session, 0)
      console.error('[dsh-chat-fold] history preload failed:', error)
    }).finally(() => {
      loading.delete(session)
      if (selected === binding) pump(binding)
    })
  }

  const syncSelection = (): void => {
    const current = sessions.list.getSnapshot().current
    const next = current === undefined ? null : sessions.binding(current) ?? null
    if (selected === next) {
      if (next !== null) pump(next)
      return
    }
    disposeSelected?.()
    disposeSelected = null
    selected = next
    if (next === null) return
    if (!remaining.has(next.session)) remaining.set(next.session, EXTRA_HISTORY_PAGES)
    disposeSelected = next.session.subscribe(() => { pump(next) })
    pump(next)
  }

  const disposeList = sessions.list.subscribe(syncSelection)
  syncSelection()
  return () => {
    disposed = true
    disposeList()
    disposeSelected?.()
    disposeSelected = null
    selected = null
  }
}
