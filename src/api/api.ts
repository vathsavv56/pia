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

const textOf = (data: unknown): string => {
  if (typeof data === 'string') return data
  if (data === undefined || data === null) return ''
  return JSON.stringify(data)
}

/**
 * Works out whether the body is JSON, plain text, or nothing at all, and
 * keeps the parsed value around so the viewer does not parse twice.
 */
const readPayload = (raw: string, contentType: string) => {
  if (raw === '') return { payloadKind: 'empty' as const, data: null }

  const looksJson = contentType.includes('json') || /^\s*[[{]/.test(raw)
  if (looksJson) {
    try {
      return { payloadKind: 'json' as const, data: JSON.parse(raw) }
    } catch {
      // Server said JSON but sent something else. Show the text as-is.
    }
  }
  return { payloadKind: 'text' as const, data: null }
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
  const raw = textOf(res.data)
  const { payloadKind, data } = readPayload(raw, headers['content-type'] ?? '')

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
    raw,
    data,
    sizeBytes: new Blob([raw]).size,
    durationMs: Math.round(performance.now() - startedAt),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Sends a built request through the reverse proxy. The proxy receives the
 * whole serialized request as a JSON body and is responsible for replaying
 * it against the real API.
 */
const sendViaProxy = async (
  request: SerializedRequest,
  signal: AbortSignal,
): Promise<AxiosResponse> => client.post(PROXY_URL, request, { signal })

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
