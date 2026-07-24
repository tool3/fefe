import type { Api } from '@shared/ipc'

/**
 * The typed bridge to the main process, injected by the preload script.
 * Accessing it through this module (rather than `window.api` scattered
 * everywhere) keeps the dependency explicit and easy to mock in tests.
 */
export const api: Api = window.api
