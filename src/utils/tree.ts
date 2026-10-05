import type { FileNode } from '@/types/collection.type'

/** Depth-first search for a node by id. Returns `null` when not found. */
export const findNode = (nodes: FileNode[], id: string): FileNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.child) {
      const hit = findNode(node.child, id)
      if (hit) return hit
    }
  }
  return null
}

/**
 * Replaces one node using `patch`. Arrays and nodes that were not on the path
 * to `id` are returned untouched, by reference, so React can skip them. That
 * matters here: this runs on every keystroke in the request editor.
 */
export const mapNode = (
  nodes: FileNode[],
  id: string,
  patch: (node: FileNode) => FileNode,
): FileNode[] => {
  let changed = false

  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true
      return patch(node)
    }
    if (!node.child) return node

    const child = mapNode(node.child, id, patch)
    if (child === node.child) return node

    changed = true
    return { ...node, child }
  })

  return changed ? next : nodes
}

/** Removes a node and everything under it. */
export const removeNode = (nodes: FileNode[], id: string): FileNode[] =>
  nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.child ? { ...node, child: removeNode(node.child, id) } : node,
    )

/**
 * Inserts `node` inside the folder `parentId`. When `parentId` is `null` the
 * node goes to the top level.
 */
export const insertNode = (
  nodes: FileNode[],
  parentId: string | null,
  node: FileNode,
): FileNode[] => {
  if (parentId === null) return [...nodes, node]
  return nodes.map((current) => {
    if (current.id === parentId) {
      return { ...current, child: [...(current.child ?? []), node] }
    }
    if (!current.child) return current
    return { ...current, child: insertNode(current.child, parentId, node) }
  })
}

/** Every request node in the tree, in the order they appear. */
export const collectRequests = (nodes: FileNode[]): FileNode[] =>
  nodes.flatMap((node) =>
    node.isFolder ? collectRequests(node.child ?? []) : [node],
  )

/**
 * Makes sure a name is unique among its siblings, so two requests never end
 * up looking identical in the tree.
 */
export const uniqueName = (
  siblings: FileNode[],
  name: string,
  id: string,
): string => {
  const taken = new Set(
    siblings.filter((node) => node.id !== id).map((node) => node.name),
  )
  if (!taken.has(name)) return name
  let count = 2
  while (taken.has(`${name} ${count}`)) count += 1
  return `${name} ${count}`
}

/** Siblings of a node, or the roots when the node does not exist. */
export const siblingsOf = (
  nodes: FileNode[],
  id: string | null,
): FileNode[] => {
  if (id === null) return nodes
  const parent = nodes
    .flatMap((node) =>
      node.child ? [{ parent: node, children: node.child }] : [],
    )
    .find((entry) => entry.children.some((child) => child.id === id))
  return parent ? parent.children : nodes
}
