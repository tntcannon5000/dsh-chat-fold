/**
 * Presentation-only CSS for the fold controller. Every rule scopes behind the
 * plugin-owned root marker and drives off plugin-owned data attributes, so the
 * sheet stays inert the moment the controller disposes.
 */
export const CHAT_FOLD_STYLES = `
[data-dsh-fold-root]:not([data-dsh-fold-standdown]) [data-dsh-fold-hidden] {
  display: none !important;
}

[data-dsh-fold-root] [data-dsh-fold-button] {
  appearance: none;
  background: transparent;
  border: 0;
  box-sizing: border-box;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: 2px 0 0 auto;
  padding: 0;
  font: inherit;
  line-height: 1;
  opacity: 0.55;
}

[data-dsh-fold-root] [data-dsh-fold-button]:hover {
  opacity: 1;
}

[data-dsh-fold-root] [data-dsh-fold-button][data-dsh-fold-labeled] {
  width: auto;
  gap: 4px;
  padding: 0 8px;
}
`
