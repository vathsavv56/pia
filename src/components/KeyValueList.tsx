import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  SolidLine02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/utils/cn'
import { useRequestStore } from '@/context/requestStore'
import type { ListKey } from '@/context/Keyvalue'

const inputStyles =
  'focus:outline-none w-full min-w-0 rounded-md px-2 py-2 focus:ring-1 focus:ring-blue-500 placeholder:text-white/40 hover:cursor-default bg-transparent'

const KeyValueList = ({ list }: { list: ListKey }) => {
  const rows = useRequestStore((s) => s[list])
  const updateRow = useRequestStore((s) => s.updateRow)
  const toggleRow = useRequestStore((s) => s.toggleRow)
  const removeRow = useRequestStore((s) => s.removeRow)

  return (
    <div className="h-full w-full scrollbar-none overflow-y-auto text-white">
      <div className="flex flex-col gap-0.5 p-1">
        {rows.map((row) => (
          <div
            key={row.id}
            className="group grid w-full grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-md px-1 hover:bg-white/7"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={row.isIncluded}
              aria-label={`Toggle ${row.keyP || 'row'}`}
              onClick={() => toggleRow(list, row.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded-sm"
            >
              <HugeiconsIcon
                icon={row.isIncluded ? CheckmarkSquare02Icon : SolidLine02Icon}
                size={14}
                className={row.isIncluded ? 'text-green-500' : 'text-white/40'}
              />
            </button>

            <input
              type="text"
              className={cn(inputStyles, 'text-emerald-500')}
              placeholder="Key"
              value={row.keyP}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateRow(list, row.id, { keyP: e.target.value })
              }
            />

            <input
              type="text"
              className={cn(inputStyles, 'text-yellow-500')}
              placeholder="Value"
              value={row.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateRow(list, row.id, { value: e.target.value })
              }
            />

            <button
              type="button"
              aria-label={`Delete ${row.keyP || 'row'}`}
              onClick={() => removeRow(list, row.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded-sm text-white/40 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyValueList
