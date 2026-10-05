import {
  AddCircleIcon,
  ArrowDown01Icon,
  Delete02Icon,
  Edit02Icon,
  File02Icon,
  Folder01Icon,
  FolderPlusIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { NavLink } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { useCollectionStore } from '@/context/collectionStore'
import type { FileNode } from '@/types/collection.type'
import { cn } from '@/utils/cn'

/** Actions used by every row, collected once per row. */
const useTreeActions = () => {
  const addNode = useCollectionStore((s) => s.addNode)
  const renameNode = useCollectionStore((s) => s.renameNode)
  const removeTreeNode = useCollectionStore((s) => s.removeTreeNode)
  const openTab = useCollectionStore((s) => s.openTab)
  return { addNode, renameNode, removeTreeNode, openTab }
}

interface ActionButtonProps {
  label: string
  icon: typeof Edit02Icon
  onClick: () => void
}

const ActionButton = ({ label, icon, onClick }: ActionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    tabIndex={-1}
    className="flex size-5 shrink-0 items-center justify-center rounded-sm text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
      // Row click handles folders, these are their own buttons.
      e.stopPropagation()
      onClick()
    }}
  >
    <HugeiconsIcon icon={icon} size={13} aria-hidden />
  </button>
)

interface RenameInputProps {
  initial: string
  onCommit: (name: string) => void
  onCancel: () => void
}

const RenameInput = ({ initial, onCommit, onCancel }: RenameInputProps) => {
  const [value, setValue] = useState<string>(initial)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <input
      ref={ref}
      type="text"
      aria-label="Node name"
      spellCheck={false}
      className="min-w-0 flex-1 rounded-sm bg-white/10 px-1 py-0.5 text-sm text-white focus:outline-none"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setValue(e.target.value)
      }
      onBlur={() => onCommit(value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onCommit(value)
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}

interface NodeProps {
  node: FileNode
  depth: number
}

const Node = ({ node, depth }: NodeProps) => {
  const [expand, setExpand] = useState<boolean>(false)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const { addNode, renameNode, removeTreeNode, openTab } = useTreeActions()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (isRenaming) return
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('#file-tree [role="treeitem"]'),
    )
    const index = items.indexOf(e.currentTarget)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        items[index + 1]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        items[index - 1]?.focus()
        break
      case 'ArrowRight':
        if (node.isFolder && !expand) {
          e.preventDefault()
          setExpand(true)
        }
        break
      case 'ArrowLeft':
        if (node.isFolder && expand) {
          e.preventDefault()
          setExpand(false)
        }
        break
      case 'Home':
        e.preventDefault()
        items[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        items[items.length - 1]?.focus()
        break
      default:
        break
    }
  }

  const icon = node.isFolder ? (
    <>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={14}
        aria-hidden
        className={cn(
          'mr-1 shrink-0 transition-transform duration-200',
          expand ? 'rotate-0' : '-rotate-90',
        )}
      />
      <HugeiconsIcon
        icon={Folder01Icon}
        size={16}
        aria-hidden
        className="mr-2 shrink-0 text-blue-400"
      />
    </>
  ) : (
    <>
      <div className="mr-1 w-3.5 shrink-0" aria-hidden />
      <HugeiconsIcon
        icon={File02Icon}
        size={16}
        aria-hidden
        className="mr-2 shrink-0 text-gray-400"
      />
    </>
  )

  const actions = (
    <div
      className={cn(
        'ml-auto flex shrink-0 items-center gap-0.5 pl-1',
        !isRenaming &&
          'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
      )}
    >
      {node.isFolder && (
        <ActionButton
          label={`New request inside ${node.name}`}
          icon={AddCircleIcon}
          onClick={() => addNode(node.id, false)}
        />
      )}
      <ActionButton
        label={`New folder inside ${node.name}`}
        icon={FolderPlusIcon}
        onClick={() => addNode(node.id, true)}
      />
      <ActionButton
        label={`Rename ${node.name}`}
        icon={Edit02Icon}
        onClick={() => setIsRenaming(true)}
      />
      <ActionButton
        label={`Delete ${node.name}`}
        icon={Delete02Icon}
        onClick={() => removeTreeNode(node.id)}
      />
    </div>
  )

  const label = isRenaming ? (
    <RenameInput
      initial={node.name}
      onCommit={(name) => {
        renameNode(node.id, name)
        setIsRenaming(false)
      }}
      onCancel={() => setIsRenaming(false)}
    />
  ) : (
    <span className="truncate">{node.name}</span>
  )

  const sharedClassName =
    'group flex w-full min-w-0 cursor-pointer items-center rounded-sm py-1.5 pr-1 text-sm text-gray-300 transition-colors select-none hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none'

  if (node.isFolder) {
    return (
      <div className="w-full min-w-0" role="none">
        <div
          role="treeitem"
          aria-level={depth + 1}
          aria-expanded={expand}
          tabIndex={0}
          className={sharedClassName}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setExpand((prev) => !prev)}
          onKeyDown={handleKeyDown}
        >
          {icon}
          {label}
          {actions}
        </div>

        {expand && node.child && node.child.length > 0 && (
          <div role="group" className="flex w-full min-w-0 flex-col">
            {node.child.map((child) => (
              <Node key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full min-w-0" role="none">
      <NavLink
        to={`/req/${node.id}`}
        role="treeitem"
        aria-level={depth + 1}
        tabIndex={0}
        className={({ isActive }) =>
          cn(
            sharedClassName,
            isActive ? 'bg-white/10 text-white' : 'text-gray-300',
          )
        }
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => openTab(node.id)}
        onKeyDown={handleKeyDown}
      >
        {icon}
        {label}
        {actions}
      </NavLink>
    </div>
  )
}

const FileExp = ({
  fileExpIsOpen,
  onClose,
}: {
  fileExpIsOpen: boolean
  onClose: () => void
}) => {
  const nodes = useCollectionStore((s) => s.nodes)
  const { addNode } = useTreeActions()

  return (
    <>
      {fileExpIsOpen && (
        <button
          type="button"
          aria-label="Close file explorer"
          onClick={onClose}
          className="absolute inset-y-0 left-11 z-30 w-full cursor-default bg-black/60 sm:left-14 lg:hidden"
        />
      )}

      <aside
        id="file-explorer"
        aria-label="File explorer"
        className={cn(
          'bg-dgray border-lgray flex h-full w-64 max-w-[80vw] shrink-0 flex-col overflow-y-auto overscroll-contain border-r py-2 text-white',
          'absolute inset-y-0 left-11 z-40 shadow-2xl sm:left-14 lg:static lg:left-0 lg:z-auto lg:w-56 lg:max-w-none lg:shadow-none xl:w-72',
          fileExpIsOpen ? 'flex' : 'hidden',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2">
          <p className="truncate text-sm">Collection</p>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="New request"
              className="flex size-6 items-center justify-center rounded-sm text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
              onClick={() => addNode(null, false)}
            >
              <HugeiconsIcon icon={AddCircleIcon} size={15} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="New folder"
              className="flex size-6 items-center justify-center rounded-sm text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
              onClick={() => addNode(null, true)}
            >
              <HugeiconsIcon icon={FolderPlusIcon} size={15} aria-hidden />
            </button>
          </div>
        </div>

        <div
          id="file-tree"
          role="tree"
          aria-label="Requests"
          className="min-w-0"
        >
          {nodes.length === 0 ? (
            <p className="px-3 text-sm text-white/45">
              Nothing here yet. Add a request to get started.
            </p>
          ) : (
            nodes.map((node) => <Node key={node.id} node={node} depth={0} />)
          )}
        </div>
      </aside>
    </>
  )
}

export default FileExp
