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
import { freshDraft, newRow, repairDraft, withTrailingBlank } from './Keyvalue'
import { collectRequests, insertNode, mapNode, removeNode } from '@/utils/tree'

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

const startNodes = (): FileNode[] => [newFolder(nanoid(8), 'My Collection')]

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
              node.draft ? { ...node, draft: edit(node.draft) } : node,
            ),
          }
        })

      return {
        nodes: startNodes(),
        openIds: [],
        activeId: null,

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
      partialize: (state) => ({
        nodes: state.nodes.map((node) => stripFiles(node)),
        openIds: state.openIds,
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CollectionStoreType> | undefined
        const nodes = (saved?.nodes ?? []).map((node) => repairNode(node))
        return {
          ...current,
          nodes: nodes.length > 0 ? nodes : current.nodes,
          openIds: (saved?.openIds ?? []).filter((id) =>
            collectRequests(nodes).some((node) => node.id === id),
          ),
          activeId: saved?.activeId ?? null,
        }
      },
    },
  ),
)

/* -------------------------------------------------------------------------- */
/*                            Persistence helpers                             */
/* -------------------------------------------------------------------------- */

const stripFiles = (node: FileNode): FileNode => ({
  ...node,
  child: node.child?.map(stripFiles),
  draft:
    node.draft && node.draft.body.mode === 'File'
      ? { ...node.draft, body: { mode: 'File', file: null } }
      : node.draft,
})

/** Fills in anything an older saved version of the app did not have. */
const repairNode = (node: FileNode): FileNode => ({
  ...node,
  child: node.child?.map(repairNode),
  draft: node.draft ? repairDraft(node.draft) : undefined,
})

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
