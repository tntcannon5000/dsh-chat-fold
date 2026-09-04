//#region src/index.ts
/**
* Host face required for DSH to discover the browser plugin.
* @param _ctx - host Cordis context; the fold feature lives entirely in the browser half.
*/
function apply(_ctx) {}
/** Stable Cordis plugin name. */
const name = "chat-fold";
/** The current host face owns no service dependency. */
const inject = [];
//#endregion
export { apply, inject, name };

//# sourceMappingURL=index.js.map