/**
 * Presentation-only CSS for the fold controller. Every rule scopes behind the
 * plugin-owned root marker and drives off plugin-owned data attributes, so the
 * sheet stays inert the moment the controller disposes.
 */
export const CHAT_FOLD_STYLES = `
[data-dsh-fold-root]:not([data-dsh-fold-standdown]) [data-dsh-fold-hidden] {
  display: none !important;
}

[data-dsh-fold-root] [data-dsh-fold-toggle] {
  cursor: pointer;
}

[data-dsh-fold-root] [data-dsh-fold-toggle]::after {
  content: '\\2304';
  margin-left: 6px;
  opacity: 0.6;
}

[data-dsh-fold-root] [data-dsh-fold-toggle][data-dsh-fold-open]::after {
  content: '\\2303';
}
`
