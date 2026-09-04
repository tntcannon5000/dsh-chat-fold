import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installChatFoldController } from '../src/client/fold-controller.js'

interface RowSpec {
  readonly kind: string
  readonly turn: number
  readonly anchorKey: string
  readonly text?: string
  readonly stockMember?: boolean
  readonly stockHidden?: boolean
}

const OPTIONS = {
  showLabel: 'Show turn process',
  hideLabel: 'Hide turn process',
  toolCallOne: '{count} tool call',
  toolCallOther: '{count} tool calls',
  messageOne: '{count} message',
  messageOther: '{count} messages',
  separator: ' · ',
  thoughtLabel: 'Thought for a while',
} as const

function rowElement(spec: RowSpec): HTMLElement {
  const row = document.createElement('div')
  row.setAttribute('data-chat-flow-kind', spec.kind)
  row.setAttribute('data-chat-turn', String(spec.turn))
  row.setAttribute('data-chat-anchor-key', spec.anchorKey)
  if (spec.stockMember === true) row.setAttribute('data-turn-process-member', '')
  if (spec.stockHidden === true) row.setAttribute('hidden', 'until-found')
  if (spec.text !== undefined) row.textContent = spec.text
  return row
}

function fixture(rows: readonly RowSpec[]): HTMLElement {
  const container = document.createElement('div')
  container.id = 'flow'
  for (const spec of rows) container.append(rowElement(spec))
  document.body.append(container)
  return container
}

function row(container: HTMLElement, anchorKey: string): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-chat-anchor-key="${anchorKey}"]`)
}

function disclosure(container: HTMLElement, turn: number): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(
    `[data-chat-flow-kind="turn-process"][data-chat-turn="${turn}"] > [data-dsh-fold-disclosure]`,
  )
}

async function flushMutations(): Promise<void> {
  await new Promise(resolve => { setTimeout(resolve, 0) })
}

let frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1

function flushFrames(): void {
  for (const [id, callback] of [...frames]) {
    frames.delete(id)
    callback(0)
  }
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  frames = new Map()
  nextFrameId = 1
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrameId
    nextFrameId += 1
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
})

describe('chat fold controller', () => {
  it('folds settled turns behind a stock-style disclosure above the answer', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'context', turn: 1, anchorKey: 'c1', text: 'context' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'narration' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a2', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 2m' },
      { kind: 'user', turn: 2, anchorKey: 'u2', text: 'next question' },
      { kind: 'tool-call', turn: 2, anchorKey: 't2', text: 'live tool' },
      { kind: 'assistant-step', turn: 2, anchorKey: 'a3', text: 'live step' },
    ])
    const dispose = installChatFoldController(OPTIONS)

    await flushMutations()
    flushFrames()

    expect(container.hasAttribute('data-dsh-fold-root')).toBe(true)
    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)
    expect(row(container, 'c1')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)
    expect(row(container, 'a1')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)
    expect(row(container, 'a2')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(row(container, 'u1')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    const summary = disclosure(container, 1)
    expect(summary?.getAttribute('aria-expanded')).toBe('false')
    expect(summary?.querySelector('span')?.textContent).toBe('1 tool call · 1 message')
    expect(summary?.querySelector('span:last-child')?.textContent).toBe('⌄')
    // The still-running turn 2 has no footer row and stays untouched.
    expect(row(container, 't2')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(row(container, 'a3')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(disclosure(container, 2)).toBeNull()

    dispose()
  })

  it('keeps stock folding in charge while its markers are present', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool', stockMember: true },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 1m' },
    ])
    const dispose = installChatFoldController(OPTIONS)

    await flushMutations()
    flushFrames()

    expect(container.hasAttribute('data-dsh-fold-standdown')).toBe(true)
    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(disclosure(container, 1)).toBeNull()

    dispose()
  })

  it('expands a turn from its disclosure and collapses it again', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'tool-call', turn: 1, anchorKey: 't2', text: 'tool' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 3m' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()
    const summary = disclosure(container, 1)
    if (summary === null) throw new Error('disclosure missing')

    summary.click()
    await flushMutations()
    flushFrames()

    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(row(container, 't2')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    expect(summary.getAttribute('aria-expanded')).toBe('true')

    summary.click()
    await flushMutations()
    flushFrames()

    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)
    expect(summary.getAttribute('aria-expanded')).toBe('false')
    dispose()
  })

  it('summarizes a tool-free turn as thought for a while', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'context', turn: 1, anchorKey: 'c1', text: 'context' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: '' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()

    const summary = disclosure(container, 1)
    expect(summary?.querySelector('span')?.textContent).toBe('Thought for a while')
    expect(row(container, 'c1')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)
    dispose()
  })

  it('re-appends the disclosure after a stock re-render removes it', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 4m' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()
    const summary = disclosure(container, 1)
    if (summary === null) throw new Error('disclosure missing')

    summary.remove()
    await flushMutations()
    flushFrames()

    const restored = disclosure(container, 1)
    expect(restored).not.toBeNull()
    expect(restored?.querySelector('span')?.textContent).toBe('1 tool call')
    dispose()
  })

  it('does not fold a settled turn without its disclosure slot', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 5m' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()

    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    dispose()
  })

  it('removes every owned marker, element, and listener on dispose', async () => {
    const container = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 6m' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()

    dispose()

    expect(container.hasAttribute('data-dsh-fold-root')).toBe(false)
    expect(document.querySelectorAll('[data-dsh-fold-hidden],[data-dsh-fold-disclosure]')).toHaveLength(0)
    expect(document.querySelector('style[data-dsh-chat-fold-styles]')).toBeNull()

    const tail = row(container, 'tail1')
    if (tail === null) throw new Error('tail row missing')
    expect(() => { tail.click() }).not.toThrow()
    expect(row(container, 't1')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
  })

  it('rebinds when the conversation replaces the flow container', async () => {
    const first = fixture([
      { kind: 'user', turn: 1, anchorKey: 'u1', text: 'question' },
      { kind: 'turn-process', turn: 1, anchorKey: 'p1', stockHidden: true },
      { kind: 'tool-call', turn: 1, anchorKey: 't1', text: 'tool' },
      { kind: 'assistant-step', turn: 1, anchorKey: 'a1', text: 'answer' },
      { kind: 'turn-tail', turn: 1, anchorKey: 'tail1', text: 'Ran for 7m' },
    ])
    const dispose = installChatFoldController(OPTIONS)
    await flushMutations()
    flushFrames()

    const second = document.createElement('div')
    second.id = 'flow-next'
    for (const spec of [
      { kind: 'user', turn: 7, anchorKey: 'u7', text: 'new session' },
      { kind: 'turn-process', turn: 7, anchorKey: 'p7', stockHidden: true },
      { kind: 'tool-call', turn: 7, anchorKey: 't7', text: 'tool' },
      { kind: 'assistant-step', turn: 7, anchorKey: 'a7', text: 'answer' },
      { kind: 'turn-tail', turn: 7, anchorKey: 'tail7', text: 'Ran for 8m' },
    ] as const) second.append(rowElement(spec))
    first.replaceWith(second)
    await flushMutations()
    flushFrames()

    expect(second.hasAttribute('data-dsh-fold-root')).toBe(true)
    expect(first.hasAttribute('data-dsh-fold-root')).toBe(false)
    expect(row(second, 't7')?.hasAttribute('data-dsh-fold-hidden')).toBe(true)

    const summary = disclosure(second, 7)
    if (summary === null) throw new Error('replacement disclosure missing')
    summary.click()
    await flushMutations()
    flushFrames()
    expect(row(second, 't7')?.hasAttribute('data-dsh-fold-hidden')).toBe(false)
    dispose()
  })
})
