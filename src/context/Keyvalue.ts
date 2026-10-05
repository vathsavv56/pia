import { nanoid } from 'nanoid'
import { DEFAULT_TARGET_URL } from '@/config'
import type { KeyValueRow, ListKey, RequestDraft } from '@/types/request.type'
import { freshAuth, freshBody } from '@/types/request.type'

export type { KeyValueRow, ListKey }

export const newRow = (): KeyValueRow => ({
  id: nanoid(8),
  isIncluded: true,
  keyP: '',
  value: '',
})

/**
 * The grid always keeps one empty row at the bottom so there is somewhere to
 * type the next pair.
 */
export const withTrailingBlank = (rows: KeyValueRow[]): KeyValueRow[] => {
  if (rows.length === 0) return [newRow()]
  const last = rows[rows.length - 1]
  if (last.keyP !== '' || last.value !== '') return [...rows, newRow()]
  return rows
}

/** A brand new request, ready to be edited. */
export const freshDraft = (): RequestDraft => ({
  method: 'GET',
  url: DEFAULT_TARGET_URL,
  params: [newRow()],
  headers: [newRow()],
  auth: freshAuth('None'),
  body: freshBody('None'),
})

/** Used when an older saved request is missing a field we now expect. */
export const repairDraft = (draft: Partial<RequestDraft>): RequestDraft => {
  const base = freshDraft()
  return {
    method: draft.method ?? base.method,
    url: draft.url ?? base.url,
    params: withTrailingBlank(draft.params ?? base.params),
    headers: withTrailingBlank(draft.headers ?? base.headers),
    auth: draft.auth ?? base.auth,
    body: draft.body ?? base.body,
  }
}

export { freshAuth, freshBody }
