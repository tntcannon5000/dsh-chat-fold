/**
 * Chat fold controller.
 *
 * Restores compact turn folding for sessions where the stock Web transcript
 * keeps every completed row expanded. The stock UI disables turn folding while
 * any older history page is unloaded (`historyIncomplete`), so very long
 * sessions never fold at all. This controller re-creates that presentation on
 * top of the stock DOM using only semantic `data-*` anchors published by the
 * Chat flow rows:
 *
 * - rows carry `data-chat-turn` and `data-chat-flow-kind`;
 * - a settled turn renders a `turn-tail` footer row;
 * - stock folding, when active, marks its own rows `data-turn-process-member`.
 *
 * The controller hides folded process rows through plugin-owned data
 * attributes and one stylesheet, and toggles a turn through one plugin-owned
 * chevron button appended inside the turn's footer row. The footer row hosts
 * stock actions (including fork) that a touch tap must never activate by
 * accident, so the rest of the row is not a toggle target. The button is
 * self-healing: a stock re-render that removes it is observed and the next
 * classification pass re-appends it. While stock folding is active the
 * controller stands down completely and removes its own additions.
 */

import type { ChatFoldLabels } from './labels.js'
import { CHAT_FOLD_STYLES } from './styles.js'

/** One flow row kind that stock folding never hides. */
const INDEPENDENT_KINDS: ReadonlySet<string> = new Set([
  'system-prompt',
  'user',
  'steering',
  'turn-process',
  'turn-error',
  'turn-max-tokens',
  'turn-tail',
])

const FLOW_ROW_ATTR = 'data-chat-flow-kind'
const TURN_ATTR = 'data-chat-turn'
const ANCHOR_ATTR = 'data-chat-anchor-key'
const STOCK_MEMBER_ATTR = 'data-turn-process-member'

const ROOT_ATTR = 'data-dsh-fold-root'
const STANDDOWN_ATTR = 'data-dsh-fold-standdown'
const HIDDEN_ATTR = 'data-dsh-fold-hidden'
const BUTTON_ATTR = 'data-dsh-fold-button'
const OPEN_ATTR = 'data-dsh-fold-open'

const FOLDED_GLYPH = '⌄'
const EXPANDED_GLYPH = '⌃'

interface FlowRow {
  readonly element: HTMLElement
  readonly kind: string
  readonly turn: number
  readonly anchorKey: string
}

/** Active controller state for one flow container. */
interface FoldState {
  readonly container: HTMLElement
  /** Turn keys the user expanded, keyed `turn:firstRowAnchorKey`. */
  readonly expanded: Set<string>
  /** Anchor key of each classified turn's first row, keyed by turn number. */
  readonly turnKeys: Map<number, string>
}

/** Options accepted by {@link installChatFoldController}. */
export interface ChatFoldControllerOptions {
  /** Accessible label for expanding a folded turn. */
  readonly showLabel: string
  /** Accessible label for collapsing an expanded turn. */
  readonly hideLabel: string
}

function rowOf(element: Element): FlowRow | null {
  const kind = element.getAttribute(FLOW_ROW_ATTR)
  const turnValue = element.getAttribute(TURN_ATTR)
  if (kind === null || turnValue === null) return null
  const turn = Number(turnValue)
  if (!Number.isFinite(turn)) return null
  return {
    element: element as HTMLElement,
    kind,
    turn,
    anchorKey: element.getAttribute(ANCHOR_ATTR) ?? '',
  }
}

function directFlowRows(container: HTMLElement): FlowRow[] {
  const rows: FlowRow[] = []
  for (const element of container.children) {
    const row = rowOf(element)
    if (row !== null) rows.push(row)
  }
  return rows
}

/**
 * Restore compact turn folding on the stock Chat transcript.
 * @param options - localized labels for the per-turn toggle button.
 * @returns disposer removing every listener, element, attribute, and style the controller owns.
 */
export function installChatFoldController(options: ChatFoldControllerOptions): () => void {
  const labels: ChatFoldLabels = options
  const style = document.createElement('style')
  style.dataset.dshChatFoldStyles = ''
  style.textContent = CHAT_FOLD_STYLES
  document.head.appendChild(style)

  let state: FoldState | null = null
  let documentObserver: MutationObserver | null = null
  let frame: number | null = null
  let disposed = false

  const writeRow = (element: HTMLElement, attribute: string, present: boolean): void => {
    if (present === element.hasAttribute(attribute)) return
    if (present) element.setAttribute(attribute, '')
    else element.removeAttribute(attribute)
  }

  const clearOwnedAdditions = (container: HTMLElement): void => {
    for (const element of container.querySelectorAll(`[${HIDDEN_ATTR}]`)) {
      element.removeAttribute(HIDDEN_ATTR)
    }
    for (const button of container.querySelectorAll(`[${BUTTON_ATTR}]`)) {
      button.remove()
    }
  }

  const syncFoldButton = (tail: HTMLElement, open: boolean): void => {
    let button = tail.querySelector<HTMLButtonElement>(`:scope > [${BUTTON_ATTR}]`)
    if (button === null) {
      button = document.createElement('button')
      button.type = 'button'
      button.setAttribute(BUTTON_ATTR, '')
      tail.appendChild(button)
    }
    const label = open ? labels.hideLabel : labels.showLabel
    const glyph = open ? EXPANDED_GLYPH : FOLDED_GLYPH
    // A stopped turn's footer can carry no text at all; the label then makes
    // the lone chevron line self-explanatory.
    const tailHasText = [...tail.childNodes]
      .some(node => node !== button && node.textContent?.trim() !== '')
    if (tailHasText === button.hasAttribute('data-dsh-fold-labeled')) {
      if (tailHasText) button.removeAttribute('data-dsh-fold-labeled')
      else button.setAttribute('data-dsh-fold-labeled', '')
    }
    const desiredText = tailHasText ? glyph : `${glyph} ${label}`
    if (button.textContent !== desiredText) button.textContent = desiredText
    if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label)
    writeRow(button, OPEN_ATTR, open)
  }

  const classify = (bound: FoldState): void => {
    const rows = directFlowRows(bound.container)
    // Stock folding marks its own process rows; defer to it completely.
    const stockActive = rows.some(row => row.element.hasAttribute(STOCK_MEMBER_ATTR))
    bound.container.toggleAttribute(STANDDOWN_ATTR, stockActive)
    if (stockActive) {
      clearOwnedAdditions(bound.container)
      return
    }

    const groups = new Map<number, FlowRow[]>()
    for (const row of rows) {
      const group = groups.get(row.turn)
      if (group === undefined) groups.set(row.turn, [row])
      else group.push(row)
    }
    const liveKeys = new Set<string>()
    bound.turnKeys.clear()
    for (const [turn, group] of groups) {
      const key = `${turn}:${group[0]?.anchorKey ?? ''}`
      bound.turnKeys.set(turn, key)
      liveKeys.add(key)
      const tail = group.find(row => row.kind === 'turn-tail')
      const answerIndex = group.findLastIndex(row => row.kind === 'assistant-step')
      const open = bound.expanded.has(key)
      for (const [index, row] of group.entries()) {
        const processRow = !INDEPENDENT_KINDS.has(row.kind)
          && !(row.kind === 'assistant-step' && index === answerIndex)
        writeRow(row.element, HIDDEN_ATTR, tail !== undefined && processRow && !open)
      }
      if (tail !== undefined) syncFoldButton(tail.element, open)
    }
    for (const key of bound.expanded) {
      if (!liveKeys.has(key)) bound.expanded.delete(key)
    }
  }

  const schedule = (bound: FoldState): void => {
    if (frame !== null) return
    frame = window.requestAnimationFrame(() => {
      frame = null
      if (!disposed && state === bound) classify(bound)
    })
  }

  const adopt = (): boolean => {
    const row = document.querySelector(`[${FLOW_ROW_ATTR}]`)
    if (row === null || row.parentElement === null) return false
    const container = row.parentElement
    if (state !== null && state.container === container) return true
    state = { container, expanded: new Set(), turnKeys: new Map() }
    container.setAttribute(ROOT_ATTR, '')
    const bound = state
    container.addEventListener('click', onClick)
    classify(bound)
    return true
  }

  const onDocumentMutation = (records: MutationRecord[]): void => {
    if (disposed) return
    const bound = state
    if (bound !== null) {
      if (!bound.container.isConnected) {
        bound.container.removeEventListener('click', onClick)
        bound.container.removeAttribute(ROOT_ATTR)
        state = null
      } else if (records.some(record => bound.container.contains(record.target))) {
        schedule(bound)
        return
      } else {
        return
      }
    }
    adopt()
  }

  const onClick = (event: MouseEvent): void => {
    if (state === null || state.container.hasAttribute(STANDDOWN_ATTR)) return
    const target = event.target instanceof Element ? event.target : null
    const button = target?.closest(`[${BUTTON_ATTR}]`)
    if (button === null || button === undefined) return
    const row = button.closest(`[${FLOW_ROW_ATTR}]`)
    if (row === null || row === undefined) return
    const clicked = rowOf(row)
    if (clicked === null) return
    const key = state.turnKeys.get(clicked.turn)
    if (key === undefined) return
    if (state.expanded.has(key)) state.expanded.delete(key)
    else state.expanded.add(key)
    classify(state)
  }

  documentObserver = new MutationObserver(onDocumentMutation)
  documentObserver.observe(document, { childList: true, subtree: true })
  adopt()

  return () => {
    disposed = true
    documentObserver?.disconnect()
    documentObserver = null
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    if (state !== null) {
      state.container.removeEventListener('click', onClick)
      state.container.removeAttribute(ROOT_ATTR)
      state.container.removeAttribute(STANDDOWN_ATTR)
      clearOwnedAdditions(state.container)
      state = null
    }
    style.remove()
  }
}
