import type { Auth, KeyValueRow, RequestDraft } from '@/types/request.type'
import type { SerializedRequest } from '@/types/request.type'

/** Thrown when the draft cannot become a valid request. */
export class RequestBuildError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequestBuildError'
  }
}

/**
 * Only rows the user has ticked, and only rows with a key. A key with an
 * empty value is still a valid request line, so we keep it.
 */
const includedRows = (rows: KeyValueRow[]) =>
  rows.filter((row) => row.isIncluded && row.keyP.trim() !== '')

/** Later rows win, which matches how a spreadsheet of key/values reads. */
const rowsToRecord = (rows: KeyValueRow[]) => {
  const record: Record<string, string> = {}
  for (const row of includedRows(rows)) record[row.keyP.trim()] = row.value
  return record
}

/** `btoa` chokes on anything outside Latin-1, so encode via UTF-8 bytes. */
const base64 = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const authHeader = (auth: Auth): string | null => {
  switch (auth.type) {
    case 'Basic':
      return `Basic ${base64(`${auth.username}:${auth.password}`)}`
    case 'Bearer':
      return auth.token.trim() === '' ? null : `Bearer ${auth.token.trim()}`
    default:
      return null
  }
}

const hasHeader = (headers: Record<string, string>, name: string) =>
  Object.keys(headers).some((key) => key.toLowerCase() === name)

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Reads the body out of the draft and works out the content type that goes
 * with it. Returns `null` body when the mode sends nothing.
 */
const readBody = async (draft: RequestDraft) => {
  switch (draft.body.mode) {
    case 'Text': {
      const text = draft.body.text
      if (text === '') return { body: null, contentType: 'text/plain' }
      return { body: text, contentType: 'text/plain' }
    }
    case 'JSON': {
      const json = draft.body.json.trim()
      if (json === '') return { body: null, contentType: 'application/json' }
      try {
        JSON.parse(json)
      } catch {
        throw new RequestBuildError(
          'Body is not valid JSON. Fix the JSON tab before sending.',
        )
      }
      return { body: json, contentType: 'application/json' }
    }
    case 'File': {
      const file = draft.body.file
      if (!file) return { body: null, contentType: null }
      return {
        body: await file.text(),
        contentType: file.type || 'application/octet-stream',
      }
    }
    default:
      return { body: null, contentType: null }
  }
}

/**
 * Turns the draft the user is editing into the flat object that travels over
 * the wire. This is the only place that knows how auth, params, headers and
 * body combine, so the rest of the app never has to think about it.
 */
export const buildRequest = async (
  draft: RequestDraft,
): Promise<SerializedRequest> => {
  const url = draft.url.trim()
  if (url === '') throw new RequestBuildError('Enter a URL first.')
  if (!isValidUrl(url))
    throw new RequestBuildError(`"${url}" is not a valid http(s) URL.`)

  const params = rowsToRecord(draft.params)
  const headers = rowsToRecord(draft.headers)
  const { body, contentType } = await readBody(draft)

  // Auth first, so an explicit header can still win over the generated one.
  const authorization = authHeader(draft.auth)
  if (authorization) headers.Authorization = authorization

  if (draft.auth.type === 'API Key' && draft.auth.key.trim() !== '') {
    const key = draft.auth.key.trim()
    if (draft.auth.location === 'Query Param') params[key] = draft.auth.value
    else headers[key] = draft.auth.value
  }

  if (contentType && !hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = contentType
  }

  return {
    method: draft.method,
    url,
    bodyMode: draft.body.mode,
    headers,
    params,
    body,
    contentType: headers['Content-Type'] ?? null,
  }
}
