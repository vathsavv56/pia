/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the reverse proxy. Leave empty to send requests directly. */
  readonly VITE_REVERSE_PROXY_URL?: string
  /** Pre-filled URL shown in the URL bar for a fresh request. */
  readonly VITE_DEFAULT_TARGET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
