import { describe, expect, it, vi } from 'vitest'
import {
  EXTRA_HISTORY_PAGES,
  installHistoryPreloader,
  type HistorySession,
  type HistorySessionBinding,
  type HistorySessionSnapshot,
  type HistorySessions,
} from '../src/client/history-preloader.js'

class Source<T> {
  readonly listeners = new Set<() => void>()

  constructor(private value: T) {}

  getSnapshot(): T { return this.value }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  set(value: T): void {
    this.value = value
    for (const listener of [...this.listeners]) listener()
  }
}

class FakeSession extends Source<HistorySessionSnapshot> implements HistorySession {
  calls = 0
  pagesAvailable: number
  readonly eventSource = new Source({ revision: 0, change: { kind: 'replace' } })

  constructor(pagesAvailable: number, openState = 'open') {
    super({ openState, hasMore: pagesAvailable > 0, loadingOlder: false })
    this.pagesAvailable = pagesAvailable
  }

  async loadOlder(): Promise<void> {
    this.calls += 1
    this.set({ ...this.getSnapshot(), loadingOlder: true })
    await Promise.resolve()
    this.pagesAvailable -= 1
    const events = this.eventSource.getSnapshot()
    this.eventSource.set({ revision: events.revision + 1, change: { kind: 'prepend' } })
    this.set({ openState: 'open', hasMore: this.pagesAvailable > 0, loadingOlder: false })
  }
}

function fixture(entries: Record<string, FakeSession>, current?: string): {
  sessions: HistorySessions
  list: Source<{ current?: string }>
} {
  const list = new Source<{ current?: string }>(current === undefined ? {} : { current })
  const bindings = Object.fromEntries(Object.entries(entries).map(([id, session]) => [
    id,
    { session, eventSource: session.eventSource } satisfies HistorySessionBinding,
  ]))
  return {
    list,
    sessions: {
      list,
      binding: id => bindings[id],
    },
  }
}

async function settle(): Promise<void> {
  for (let i = 0; i < EXTRA_HISTORY_PAGES * 4; i++) await Promise.resolve()
}

describe('history preloader', () => {
  it('loads exactly four additional pages once per Session object', async () => {
    const session = new FakeSession(10)
    const { sessions } = fixture({ a: session }, 'a')
    const dispose = installHistoryPreloader(sessions)
    await settle()

    expect(session.calls).toBe(EXTRA_HISTORY_PAGES)
    expect(session.pagesAvailable).toBe(6)
    dispose()
  })

  it('stops early when history is exhausted', async () => {
    const session = new FakeSession(2)
    const { sessions } = fixture({ a: session }, 'a')
    const dispose = installHistoryPreloader(sessions)
    await settle()

    expect(session.calls).toBe(2)
    dispose()
  })

  it('follows selection and does not preload the same object twice', async () => {
    const a = new FakeSession(10)
    const b = new FakeSession(10)
    const { sessions, list } = fixture({ a, b }, 'a')
    const dispose = installHistoryPreloader(sessions)
    await settle()
    list.set({ current: 'b' })
    await settle()
    list.set({ current: 'a' })
    await settle()

    expect(a.calls).toBe(EXTRA_HISTORY_PAGES)
    expect(b.calls).toBe(EXTRA_HISTORY_PAGES)
    dispose()
  })

  it('waits for open and contains a rejected preload', async () => {
    const session = new FakeSession(10, 'loading')
    const error = new Error('network')
    session.loadOlder = vi.fn().mockRejectedValue(error)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { sessions } = fixture({ a: session }, 'a')
    const dispose = installHistoryPreloader(sessions)

    expect(session.loadOlder).not.toHaveBeenCalled()
    session.set({ openState: 'open', hasMore: true, loadingOlder: false })
    await settle()
    expect(session.loadOlder).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith('[dsh-chat-fold] history preload failed:', error)

    consoleError.mockRestore()
    dispose()
  })

  it('stops after a resolved pull that publishes no prepend', async () => {
    const session = new FakeSession(10)
    session.loadOlder = vi.fn().mockResolvedValue(undefined)
    const { sessions } = fixture({ a: session }, 'a')
    const dispose = installHistoryPreloader(sessions)
    await settle()

    expect(session.loadOlder).toHaveBeenCalledTimes(1)
    dispose()
  })

  it('removes every subscription on disposal', () => {
    const session = new FakeSession(0)
    const { sessions, list } = fixture({ a: session }, 'a')
    const dispose = installHistoryPreloader(sessions)
    expect(list.listeners.size).toBe(1)
    expect(session.listeners.size).toBe(1)

    dispose()
    expect(list.listeners.size).toBe(0)
    expect(session.listeners.size).toBe(0)
  })
})
