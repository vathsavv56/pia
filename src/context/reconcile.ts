import type { FileNode } from '@/types/collection.type'
import { collectRequests } from '@/utils/tree'
import { repairDraft } from '@/context/Keyvalue'

/** The slice of the store that gets written to localStorage. */
export type PersistedCollection = {
  nodes: FileNode[]
  openIds: string[]
  activeId: string | null
}

/** A picked File cannot be serialised, so it is dropped on the way to storage. */
export const stripFiles = (node: FileNode): FileNode => ({
  ...node,
  child: node.child?.map(stripFiles),
  draft:
    node.draft && node.draft.body.mode === 'File'
      ? { ...node.draft, body: { mode: 'File', file: null } }
      : node.draft,
})

/**
 * Fills in anything an older saved version of the app did not have.
 *
 * A request with no draft at all is given a fresh one, because every draft
 * edit writes into the open request's draft. A request without one would be
 * permanently read-only, which looks exactly like a frozen URL bar.
 */
export const repairNode = (node: FileNode): FileNode => ({
  ...node,
  child: node.child?.map(repairNode),
  draft: node.isFolder ? undefined : repairDraft(node.draft ?? {}),
})

/** Strips the parts of the store that must not be persisted. */
export const toPersisted = (
  state: Pick<PersistedCollection, 'nodes' | 'openIds' | 'activeId'>,
): PersistedCollection => ({
  nodes: state.nodes.map(stripFiles),
  openIds: state.openIds,
  activeId: state.activeId,
})

/**
 * Turns whatever was in localStorage back into usable state.
 *
 * Two rules matter here, and both were bugs:
 *
 * 1. It never replaces the saved tree. An earlier version re-seeded whenever
 *    storage was empty, which silently wiped the whole collection.
 * 2. It always leaves a request open when the tree contains one. An earlier
 *    version restored `activeId: null`, and because every draft edit targets
 *    the open request, that made the URL bar and Send button do nothing at all.
 *
 * Pure, so it can be tested without a browser.
 */
export const reconcileCollection = (
  saved: Partial<PersistedCollection> | undefined,
  fallback: PersistedCollection,
): PersistedCollection => {
  if (!saved || !Array.isArray(saved.nodes)) return fallback

  const nodes = saved.nodes.map(repairNode)
  const requests = collectRequests(nodes)

  // Drop tabs whose request no longer exists.
  const openIds = (saved.openIds ?? []).filter((id) =>
    requests.some((node) => node.id === id),
  )

  const savedActive = saved.activeId
  const activeId =
    savedActive !== null &&
    savedActive !== undefined &&
    openIds.includes(savedActive)
      ? savedActive
      : (openIds[0] ?? requests[0]?.id ?? null)

  return {
    nodes,
    openIds:
      activeId !== null && !openIds.includes(activeId)
        ? [...openIds, activeId]
        : openIds,
    activeId,
  }
}
