/**
 * Every value the app reads from the environment lives here, so there is
 * exactly one place to look when a request goes to the wrong place.
 */

/** Trailing slashes break axios path joining, so strip them once, up front. */
const trimSlash = (value: string) => value.replace(/\/+$/, '')

/**
 * Where the reverse proxy lives. When this is empty the app talks to the
 * target URL directly, which only works for APIs that allow cross-origin
 * requests. Point it at your proxy to defeat CORS.
 */
export const PROXY_URL = trimSlash(
  (import.meta.env.VITE_REVERSE_PROXY_URL ?? '').trim(),
)

/** True when we are routing through the proxy rather than hitting the API. */
export const IS_PROXY_MODE = PROXY_URL !== ''

/**
 * Placeholder target used for a brand new request. Swap the env var to
 * change the default without touching code.
 */
export const DEFAULT_TARGET_URL =
  (import.meta.env.VITE_DEFAULT_TARGET_URL ?? '').trim() ||
  'https://jsonplaceholder.typicode.com/todos/1'

/** How long we wait before giving up on a request. */
export const REQUEST_TIMEOUT_MS = 30_000
