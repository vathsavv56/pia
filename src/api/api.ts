import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { IS_PROXY_MODE, PROXY_URL, REQUEST_TIMEOUT_MS } from '@/config'
import type { SerializedRequest } from '@/types/request.type'
import type { ApiResponse, ResponseError } from '@/types/response.type'
import { statusKind } from '@/types/response.type'

/**
 * The one axios instance the whole app uses. Timeouts live here so no caller
 * can forget them, and every request inherits the same defaults.
 */
export const client: AxiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  // A 404 or a 500 is still information we want to show, so never treat a
  // non-2xx status as a thrown error.
  validateStatus: () => true,
})

/** Turns axios header bags (which can hold arrays) into plain strings. */
const flattenHeaders = (
  headers: AxiosResponse['headers'],
): Record<string, string> => {
  const flat: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue
    flat[key] = Array.isArray(value) ? value.join(', ') : String(value)
  }
  return flat
}

/** Raw bytes straight from axios (`arraybuffer`) into a Uint8Array. */
const toBytes = (data: unknown): Uint8Array => {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (typeof data === 'string')
    return new TextEncoder().encode(data)
  if (data === undefined || data === null) return new Uint8Array(0)
  if (typeof data === 'object' && 'buffer' in (data as object)) {
    try {
      return new Uint8Array(data as ArrayBufferLike as ArrayBuffer)
    } catch {
      // fall through to JSON encoding below
    }
  }
  return new TextEncoder().encode(JSON.stringify(data))
}

const bytesToText = (bytes: Uint8Array): string => {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return ''
  }
}

/** Chunked base64 so large images don't blow the call stack. */
const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Case-insensitive lookup because proxies/casing vary. */
const contentTypeOf = (headers: Record<string, string>): string => {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'content-type') return value
  }
  return ''
}

const mimeOf = (contentType: string): string =>
  contentType.split(';')[0]?.trim().toLowerCase() ?? ''

type ReadPayload = {
  payloadKind: 'json' | 'xml' | 'html' | 'text' | 'image' | 'empty'
  data: unknown
  raw: string
  dataUrl: string | null
}

/**
 * Auto-detects the body type from the content-type header first, then by
 * sniffing the content, so mislabelled (or unlabelled) responses still
 * render in the right viewer.
 */
const readPayload = (
  bytes: Uint8Array,
  contentType: string,
): ReadPayload => {
  if (bytes.length === 0) {
    return { payloadKind: 'empty', data: null, raw: '', dataUrl: null }
  }

  const mime = mimeOf(contentType)

  // Images are binary — never try to decode them as text for display.
  if (mime.startsWith('image/')) {
    return {
      payloadKind: 'image',
      data: null,
      raw: '',
      dataUrl: `data:${mime};base64,${bytesToBase64(bytes)}`,
    }
  }

  const raw = bytesToText(bytes)
  if (raw.trim() === '') {
    // Whitespace-only bodies count as empty for display purposes, unless
    // they claim to be an image (handled above).
    if (mime.startsWith('text/') || mime === '') {
      return raw === ''
        ? { payloadKind: 'empty', data: null, raw: '', dataUrl: null }
        : { payloadKind: 'text', data: null, raw, dataUrl: null }
    }
  }

  const trimmed = raw.trimStart()
  const looksJson =
    mime.includes('json') ||
    mime.endsWith('+json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[')
  if (looksJson) {
    try {
      return { payloadKind: 'json', data: JSON.parse(raw), raw, dataUrl: null }
    } catch {
      // Server said JSON but sent something else — fall through to the
      // text/html/xml sniffing below instead of forcing raw JSON view.
    }
  }

  const looksHtml =
    mime.includes('html') ||
    /^\s*<!doctype\s+html/i.test(raw) ||
    /^\s*<html[\s>]/i.test(raw)
  if (looksHtml) {
    return { payloadKind: 'html', data: null, raw, dataUrl: null }
  }

  const looksXml =
    mime.includes('xml') ||
    mime.endsWith('+xml') ||
    mime.includes('svg') ||
    /^\s*<\?xml/i.test(raw) ||
    (/^\s*<[a-zA-Z][^>]*>/.test(trimmed) && /<\/[^>]+>\s*$/.test(raw.trimEnd()))
  if (looksXml) {
    return { payloadKind: 'xml', data: null, raw, dataUrl: null }
  }

  return { payloadKind: 'text', data: null, raw, dataUrl: null }
}

/** Maps anything axios can throw into our own error shape. */
const toResponseError = (thrown: unknown): ResponseError => {
  if (axios.isCancel(thrown)) {
    return { message: 'Request cancelled', stage: 'network', status: null }
  }
  if (axios.isAxiosError(thrown)) {
    const status = thrown.response?.status ?? null
    return {
      message: thrown.response
        ? `Request failed with status ${status}`
        : thrown.message,
      stage: thrown.response ? 'proxy' : 'network',
      status,
    }
  }
  return {
    message: thrown instanceof Error ? thrown.message : 'Unknown network error',
    stage: 'network',
    status: null,
  }
}

const toApiResponse = (res: AxiosResponse, startedAt: number): ApiResponse => {
  const headers = flattenHeaders(res.headers)
  const contentType = contentTypeOf(headers)
  const bytes = toBytes(res.data)
  const { payloadKind, data, raw, dataUrl } = readPayload(bytes, contentType)

  // In proxy mode res.config.url is the proxy's own address. The proxy tells
  // us the URL it actually reached, which is the one worth showing.
  const finalUrl = headers['x-proxy-final-url'] ?? String(res.config.url ?? '')

  return {
    status: res.status,
    statusText: res.statusText ?? '',
    kind: statusKind(res.status),
    ok: res.status >= 200 && res.status < 300,
    url: finalUrl,
    headers,
    payloadKind,
    contentType: mimeOf(contentType),
    dataUrl,
    raw,
    data,
    sizeBytes: bytes.byteLength,
    durationMs: Math.round(performance.now() - startedAt),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Ask for raw bytes and skip axios's built-in JSON transform. We decode and
 * sniff the payload ourselves in `readPayload`, which keeps binary bodies
 * (images) intact instead of mangling them into strings.
 */
const bufferConfig = {
  responseType: 'arraybuffer' as const,
  transformResponse: [(data: unknown) => data],
}

/**
 * Sends a built request through the reverse proxy. The proxy receives the
 * whole serialized request as a JSON body and is responsible for replaying
 * it against the real API.
 */
const sendViaProxy = async (
  request: SerializedRequest,
  signal: AbortSignal,
): Promise<AxiosResponse> =>
  client.post(PROXY_URL, request, { signal, ...bufferConfig })

/**
 * Sends straight to the target URL. Only works for APIs that allow
 * cross-origin requests, but it needs no backend at all, which makes it a
 * useful default until the proxy exists.
 */
const sendDirect = async (
  request: SerializedRequest,
  signal: AbortSignal,
): Promise<AxiosResponse> =>
  client.request({
    method: request.method,
    url: request.url,
    params: request.params,
    headers: request.headers,
    data: request.body,
    signal,
    ...bufferConfig,
  })

/**
 * Fires the request and hands back the raw axios response. Callers turn that
 * into a `SendResult`; anything thrown here is already in our error shape.
 */
export const sendSerializedRequest = async (
  request: SerializedRequest,
  signal: AbortSignal,
): Promise<AxiosResponse> => {
  try {
    return IS_PROXY_MODE
      ? await sendViaProxy(request, signal)
      : await sendDirect(request, signal)
  } catch (thrown) {
    throw toResponseError(thrown)
  }
}

export { toApiResponse, toResponseError }
