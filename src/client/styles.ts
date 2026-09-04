/**
 * Presentation-only CSS for the fold controller. Every rule scopes behind the
 * plugin-owned root marker and drives off plugin-owned data attributes, so the
 * sheet stays inert the moment the controller disposes. The disclosure rules
 * mirror the stock turn-process button's layout one-for-one.
 */
export const CHAT_FOLD_STYLES = `
[data-dsh-fold-root]:not([data-dsh-fold-standdown])
:is([data-dsh-fold-hidden], [data-dsh-fold-inline-hidden]) {
  display: none !important;
}

[data-dsh-fold-root]:not([data-dsh-fold-standdown])
[data-chat-flow-kind='turn-process'][data-turn-process-hidden]:has(> [data-dsh-fold-disclosure]) {
  display: block !important;
  content-visibility: visible !important;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] {
  appearance: none;
  background: none;
  border: none;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  box-sizing: border-box;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  font: inherit;
  height: 33px;
  min-width: 0;
  padding: 0 0 8px;
  text-align: left;
  width: 100%;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure]:not([data-dsh-fold-open]) {
  margin-bottom: 8px;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > span:first-child {
  font-size: 15px;
  line-height: 24px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure] > svg {
  color: var(--dsw-alias-label-tertiary);
  flex: none;
  margin-left: 7px;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: transform 140ms ease;
}

[data-dsh-fold-root] [data-dsh-fold-disclosure][data-dsh-fold-open] > svg {
  transform: rotate(0deg);
}

@media (prefers-reduced-motion: reduce) {
  [data-dsh-fold-root] [data-dsh-fold-disclosure] > svg {
    transition: none;
  }
}
`
