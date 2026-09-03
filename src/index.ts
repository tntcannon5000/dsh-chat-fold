/**
 * Host face required for DSH to discover the browser plugin.
 * @param _ctx - host Cordis context; the fold feature lives entirely in the browser half.
 */
export function apply(_ctx: unknown): void {}

/** Stable Cordis plugin name. */
export const name = 'chat-fold'

/** The current host face owns no service dependency. */
export const inject: string[] = []
