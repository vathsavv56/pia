import { Cancel01Icon, PlusIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { NavLink } from 'react-router'
import { useCollectionStore } from '@/context/collectionStore'
import { findNode } from '@/utils/tree'
import type { FileNode } from '@/types/collection.type'
import type { HttpMethod } from '@/types/request.type'
import { cn } from '@/utils/cn'

const methodColor: Record<HttpMethod, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  PATCH: 'text-purple-400',
  DELETE: 'text-red-400',
  HEAD: 'text-cyan-400',
  OPTIONS: 'text-orange-400',
}

const colorOf = (method: HttpMethod) => methodColor[method] ?? 'text-white/60'

interface FileNodeProps {
  node: FileNode
  onClose: () => void
}

const FileNodeTab = ({ node, onClose }: FileNodeProps) => {
  const method = node.draft?.method ?? 'GET'

  return (
    <NavLink
      to={`/req/${node.id}`}
      aria-label={`${method} ${node.name}`}
      className={({ isActive }) =>
        cn(
          'flex h-8 shrink-0 items-center rounded-md px-1.5 transition-colors',
          'bg-lgray hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
          isActive && 'bg-white/10 ring-1 ring-white/20',
        )
      }
    >
      <span
        className={cn(
          'mt-0.5 shrink-0 font-mono text-[10px] leading-none font-medium',
          colorOf(method),
        )}
      >
        {method}
      </span>

      <span className="max-w-20 min-w-0 truncate px-1 text-sm text-white sm:max-w-32">
        {node.name}
      </span>

      <button
        type="button"
        aria-label={`Close ${node.name}`}
        className="flex size-7 shrink-0 items-center justify-center rounded-sm text-gray-400 transition-all hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          // Keep the tab strip stable: closing should not navigate.
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden />
      </button>
    </NavLink>
  )
}

const PageList = () => {
  const nodes = useCollectionStore((s) => s.nodes)
  const openIds = useCollectionStore((s) => s.openIds)
  const addNode = useCollectionStore((s) => s.addNode)
  const closeTab = useCollectionStore((s) => s.closeTab)

  /** Tabs read their label and method straight from the tree. */
  const openNodes = openIds.flatMap((id) => {
    const node = findNode(nodes, id)
    return node && !node.isFolder ? [node] : []
  })

  return (
    <div
      role="group"
      aria-label="Open requests"
      className="mt-1 ml-2 flex h-9 w-[calc(100%-0.5rem)] shrink-0 scrollbar-none items-center gap-2 overflow-x-auto overscroll-x-contain pe-2 sm:mt-2 sm:h-10"
    >
      {openNodes.map((node) => (
        <FileNodeTab
          key={node.id}
          node={node}
          onClose={() => closeTab(node.id)}
        />
      ))}

      <button
        type="button"
        aria-label="New request"
        className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
        onClick={() => addNode(null, false)}
      >
        <HugeiconsIcon
          icon={PlusIcon}
          className="text-white"
          size={13}
          aria-hidden
        />
      </button>
    </div>
  )
}

export { FileNodeTab }
export default PageList
