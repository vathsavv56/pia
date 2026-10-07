import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FileNode } from '@/types/collection.type'
import type {
  Auth,
  HttpMethod,
  KeyValueRow,
  ListKey,
  RequestBody,
  RequestDraft,
} from '@/types/request.type'
import { freshDraft, newRow, withTrailingBlank } from './Keyvalue'
import { collectRequests, insertNode, mapNode, removeNode } from '@/utils/tree'
import { reconcileCollection, toPersisted } from './reconcile'
import type { PersistedCollection } from './reconcile'

/* -------------------------------------------------------------------------- */
/*                              Node factories                                */
/* -------------------------------------------------------------------------- */

const newFolder = (id: string, name: string): FileNode => ({
  id,
  name,
  isFolder: true,
  child: [],
})

const newRequest = (id: string, name: string): FileNode => ({
  id,
  name,
  isFolder: false,
  draft: freshDraft(),
})

/**
 * A fresh install has nothing to edit, and every draft edit is a no-op without
 * an open request. So we hand the user one request, already open, rather than
 * an editor that silently ignores typing.
 *
 * This is the *initial* state only. It must never be re-applied over saved
 * data, or the whole collection would be wiped on every load.
 */
const startCollection = (): Pick<
  CollectionStoreType,
  'nodes' | 'openIds' | 'activeId'
> => {
  const requestId = nanoid(8)
  const root = newFolder(nanoid(8), 'My Collection')

  return {
    nodes: [{ ...root, child: [newRequest(requestId, 'new Request')] }],
    openIds: [requestId],
    activeId: requestId,
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Store                                    */
/* -------------------------------------------------------------------------- */

type CollectionStoreType = {
  /** The whole tree, folders and requests alike. */
  nodes: FileNode[]
  /** Ids of the requests shown as tabs, in tab order. */
  openIds: string[]
  /** The request the editor is showing right now. */
  activeId: string | null

  /* --- draft editing, always aimed at the active request --- */
  setMethod: (method: HttpMethod) => void
  setUrl: (url: string) => void
  setAuth: (auth: Auth) => void
  setBody: (body: RequestBody) => void
  updateRow: (list: ListKey, id: string, patch: Partial<KeyValueRow>) => void
  toggleRow: (list: ListKey, id: string) => void
  removeRow: (list: ListKey, id: string) => void
  clearList: (list: ListKey) => void

  /* --- tree editing --- */
  addNode: (parentId: string | null, isFolder: boolean) => string
  renameNode: (id: string, name: string) => void
  removeTreeNode: (id: string) => void

  /* --- tabs --- */
  openTab: (id: string) => void
  closeTab: (id: string) => void
  setActive: (id: string | null) => void
}

export const useCollectionStore = create<CollectionStoreType>()(
  persist(
    (set) => {
      /**
       * Every draft action funnels through here so "which request am I
       * editing" is answered in exactly one place.
       */
      const editActive = (edit: (draft: RequestDraft) => RequestDraft) =>
        set((state) => {
          if (state.activeId === null) return state
          return {
            nodes: mapNode(state.nodes, state.activeId, (node) =>
              node.isFolder
                ? node
                : { ...node, draft: edit(node.draft ?? freshDraft()) },
            ),
          }
        })

      return {
        ...startCollection(),

        setMethod: (method) => editActive((draft) => ({ ...draft, method })),
        setUrl: (url) => editActive((draft) => ({ ...draft, url })),
        setAuth: (auth) => editActive((draft) => ({ ...draft, auth })),
        setBody: (body) => editActive((draft) => ({ ...draft, body })),

        updateRow: (list, id, patch) =>
          editActive((draft) => ({
            ...draft,
            [list]: withTrailingBlank(
              draft[list].map((row) =>
                row.id === id ? { ...row, ...patch } : row,
              ),
            ),
          })),

        toggleRow: (list, id) =>
          editActive((draft) => ({
            ...draft,
            [list]: draft[list].map((row) =>
              row.id === id ? { ...row, isIncluded: !row.isIncluded } : row,
            ),
          })),

        removeRow: (list, id) =>
          editActive((draft) => ({
            ...draft,
            [list]: withTrailingBlank(
              draft[list].filter((row) => row.id !== id),
            ),
          })),

        clearList: (list) =>
          editActive((draft) => ({ ...draft, [list]: [newRow()] })),

        addNode: (parentId, isFolder) => {
          const id = nanoid(8)
          set((state) => ({
            nodes: insertNode(
              state.nodes,
              parentId,
              isFolder
                ? newFolder(id, 'New Folder')
                : newRequest(id, 'New Request'),
            ),
            // A new folder just appears. A new request also becomes the open
            // one, otherwise nothing is being edited and the URL bar and Send
            // button stay inert until the user clicks the node themselves.
            ...(isFolder
              ? {}
              : {
                  openIds: state.openIds.includes(id)
                    ? state.openIds
                    : [...state.openIds, id],
                  activeId: id,
                }),
          }))
          return id
        },

        renameNode: (id, name) => {
          const trimmed = name.trim()
          if (trimmed === '') return
          set((state) => ({
            nodes: mapNode(state.nodes, id, (node) => ({
              ...node,
              name: trimmed,
            })),
          }))
        },

        removeTreeNode: (id) =>
          set((state) => {
            const nodes = removeNode(state.nodes, id)
            const openIds = state.openIds.filter((openId) => openId !== id)
            const stillThere = collectRequests(nodes).some(
              (node) => node.id === state.activeId,
            )
            return {
              nodes,
              openIds,
              activeId: stillThere ? state.activeId : (openIds[0] ?? null),
            }
          }),

        openTab: (id) =>
          set((state) => ({
            openIds: state.openIds.includes(id)
              ? state.openIds
              : [...state.openIds, id],
            activeId: id,
          })),

        closeTab: (id) =>
          set((state) => {
            const openIds = state.openIds.filter((openId) => openId !== id)
            if (state.activeId !== id) return { openIds }
            // Closing the visible tab hands focus to the neighbour on the left.
            const closedAt = state.openIds.indexOf(id)
            const fallback = openIds[Math.max(0, closedAt - 1)] ?? null
            return { openIds, activeId: fallback }
          }),

        setActive: (id) => set({ activeId: id }),
      }
    },
    {
      name: 'pia-collection',
      version: 1,
      /**
       * Only the tree and the tabs are stored. A picked `File` cannot be
       * written to localStorage, so we drop it and let the user pick again.
       */
      partialize: (state) => toPersisted(state),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedCollection> | undefined
        const fallback = {
          nodes: current.nodes,
          openIds: current.openIds,
          activeId: current.activeId,
        }
        return { ...current, ...reconcileCollection(saved, fallback) }
      },
    },
  ),
)

/* -------------------------------------------------------------------------- */
/*                                 Selectors                                  */
/* -------------------------------------------------------------------------- */

/** The request the editor is showing, or `null` when nothing is open. */
export const useActiveNode = (): FileNode | null =>
  useCollectionStore((state) => {
    if (state.activeId === null) return null
    const hit = collectRequests(state.nodes).find(
      (node) => node.id === state.activeId,
    )
    return hit ?? null
  })
