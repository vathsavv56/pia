import { Cancel01Icon, PlusIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface FileNodeProps {
  method: string
  name: string
  onDelete: () => void
}

export const FileNode = ({ method, name, onDelete }: FileNodeProps) => {
  return (
    <div
      className={cn(
        'group flex h-8 shrink-0 items-center',
        'rounded-md px-1.5',
        'bg-lgray select-none',
      )}
    >
      {/* Method */}
      <div className="flex shrink-0 items-center px-1">
        <span className="mt-0.5 text-[10px] leading-none font-medium text-green-400">
          {method}
        </span>
      </div>

      {/* Name */}
      <span className="max-w-24 min-w-0 truncate px-1 text-sm text-white sm:max-w-32">
        {name}
      </span>

      {/* Close button */}
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={`Close ${name}`}
          className="flex size-6 items-center justify-center rounded-sm text-gray-400 transition-all hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
          onClick={onDelete}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const PageList = () => {
  const [pageArr, setPageArr] = useState<Omit<FileNodeProps, 'onDelete'>[]>([
    {
      method: 'GET',
      name: 'test-1',
    },
    {
      method: 'PUT',
      name: 'test-3',
    },
    {
      method: 'PATCH',
      name: 'github',
    },
    {
      method: 'QUERY',
      name: 'httpie',
    },
    {
      method: 'DELETE',
      name: 'abcd',
    },
  ])

  // Add a new node
  const add = () => {
    setPageArr((prev) => [
      ...prev,
      {
        method: 'GET',
        name: 'test-new',
      },
    ])
  }

  // Remove node by index
  const removeNode = (index: number) => {
    setPageArr((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      role="group"
      aria-label="Open requests"
      className="mt-1 ml-2 flex h-9 w-[calc(100%-0.5rem)] shrink-0 scrollbar-none items-center gap-2 overflow-x-auto sm:mt-2 sm:h-10"
    >
      {pageArr.map((node, index) => (
        <FileNode
          method={node.method}
          name={node.name}
          key={index}
          onDelete={() => removeNode(index)}
        />
      ))}

      {/* Add button */}
      <button
        type="button"
        aria-label="New request"
        className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
        onClick={add}
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

export default PageList
