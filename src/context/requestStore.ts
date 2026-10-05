import { useCollectionStore } from './collectionStore'
import { freshDraft } from './Keyvalue'
import { findNode } from '@/utils/tree'
import type {
  Auth,
  HttpMethod,
  KeyValueRow,
  ListKey,
  RequestBody,
  RequestDraft,
} from '@/types/request.type'

export { freshAuth, freshBody, newRow, withTrailingBlank } from './Keyvalue'
export type { KeyValueRow, ListKey }

/**
 * Shown while nothing is open, so the editor always has a valid shape to read
 * instead of branching on `null` in every component.
 */
const EMPTY_DRAFT = freshDraft()

/**
 * Reads one slice of the request being edited. The selector gets the draft, so
 * components ask for exactly what they need: `useDraft((d) => d.params)`.
 * The result is a stable reference, which is what keeps Zustand from
 * re-rendering on unrelated changes.
 */
export const useDraft = <T>(selector: (draft: RequestDraft) => T): T =>
  useCollectionStore((state) => {
    if (state.activeId === null) return selector(EMPTY_DRAFT)
    const node = findNode(state.nodes, state.activeId)
    return selector(node?.draft ?? EMPTY_DRAFT)
  })

/** The whole draft at once. Only for code that genuinely needs every field. */
export const useActiveDraft = (): RequestDraft => useDraft((d) => d)

export type DraftActions = {
  setMethod: (method: HttpMethod) => void
  setUrl: (url: string) => void
  setAuth: (auth: Auth) => void
  setBody: (body: RequestBody) => void
  updateRow: (list: ListKey, id: string, patch: Partial<KeyValueRow>) => void
  toggleRow: (list: ListKey, id: string) => void
  removeRow: (list: ListKey, id: string) => void
  clearList: (list: ListKey) => void
}

/** Every action the request editor needs, in one object. */
export const useDraftActions = (): DraftActions => {
  const setMethod = useCollectionStore((s) => s.setMethod)
  const setUrl = useCollectionStore((s) => s.setUrl)
  const setAuth = useCollectionStore((s) => s.setAuth)
  const setBody = useCollectionStore((s) => s.setBody)
  const updateRow = useCollectionStore((s) => s.updateRow)
  const toggleRow = useCollectionStore((s) => s.toggleRow)
  const removeRow = useCollectionStore((s) => s.removeRow)
  const clearList = useCollectionStore((s) => s.clearList)

  return {
    setMethod,
    setUrl,
    setAuth,
    setBody,
    updateRow,
    toggleRow,
    removeRow,
    clearList,
  }
}
