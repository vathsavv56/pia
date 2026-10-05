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
  'focus:outline-none w-full min-w-0 rounded-md px-1.5 py-1.5 focus:ring-1 focus:ring-blue-500 placeholder:text-white/55 hover:cursor-default bg-transparent sm:px-2 sm:py-2'

const KeyValueList = ({ list }: { list: ListKey }) => {
  const rows = useRequestStore((s) => s[list])
  const updateRow = useRequestStore((s) => s.updateRow)
  const toggleRow = useRequestStore((s) => s.toggleRow)
  const removeRow = useRequestStore((s) => s.removeRow)

  return (
    <div
      role="group"
      aria-label={list === 'params' ? 'Query parameters' : 'Request headers'}
      className="h-full w-full scrollbar-none overflow-y-auto text-white"
    >
      <div className="flex flex-col gap-1 p-1 sm:gap-0.5">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-1 gap-y-0.5 rounded-md px-0.5 py-1 hover:bg-white/7 sm:grid-cols-[auto_1fr_1fr_auto] sm:gap-x-2 sm:px-1 sm:py-0"
          >
            <button
              type="button"
              aria-pressed={row.isIncluded}
              aria-label={`Include ${row.keyP || `row ${index + 1}`}`}
              onClick={() => toggleRow(list, row.id)}
              className="row-span-2 flex size-5 shrink-0 items-center justify-center rounded-sm focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none sm:row-span-1"
            >
              <HugeiconsIcon
                icon={row.isIncluded ? CheckmarkSquare02Icon : SolidLine02Icon}
                size={14}
                className={row.isIncluded ? 'text-green-500' : 'text-white/50'}
                aria-hidden
              />
            </button>

            <input
              type="text"
              aria-label={`Key ${index + 1}`}
              className={cn(
                inputStyles,
                'col-start-2 row-start-1 text-base text-emerald-500 sm:text-sm',
              )}
              placeholder="Key"
              value={row.keyP}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateRow(list, row.id, { keyP: e.target.value })
              }
            />

            <input
              type="text"
              aria-label={`Value ${index + 1}`}
              className={cn(
                inputStyles,
                'col-start-2 row-start-2 text-base text-yellow-500 sm:col-start-3 sm:row-start-1 sm:text-sm',
              )}
              placeholder="Value"
              value={row.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateRow(list, row.id, { value: e.target.value })
              }
            />

            <button
              type="button"
              aria-label={`Delete ${row.keyP || `row ${index + 1}`}`}
              onClick={() => removeRow(list, row.id)}
              className="col-start-3 row-start-1 flex size-5 shrink-0 items-center justify-center rounded-sm text-white/50 opacity-45 transition-opacity hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none sm:col-start-4 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyValueList
