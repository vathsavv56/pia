import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  SolidLine02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

type Header = {
  isIncluded: boolean
  keyP: string
  value: string
}

export const headerArr: Header[] = [
  {
    isIncluded: true,
    keyP: 'Accept',
    value: '*/*',
  },
  {
    isIncluded: false,
    keyP: 'Content-Type',
    value: 'application/json',
  },
]

interface HeaderObjProps {
  keyP: string
  value: string
  isIncluded: boolean
}

const HeaderObj = ({ keyP, value, isIncluded }: HeaderObjProps) => {
  const [keyV, setKeyV] = useState<string>(keyP)
  const [val, setVal] = useState<string>(value)

  const inputStyles =
    'focus:outline-none ml-2 px-2 py-2 focus:ring-1 focus:ring-blue-500 rounded-md placeholder:text-white/40 hover:cursor-default bg-transparent'

  return (
    <div className="group flex w-full items-center justify-around text-white/80 hover:bg-white/7">
      <div className="w-fit">
        {isIncluded ? (
          <HugeiconsIcon icon={CheckmarkSquare02Icon} />
        ) : (
          <HugeiconsIcon icon={SolidLine02Icon} />
        )}
      </div>

      <div>
        <input
          type="text"
          className={cn(inputStyles, 'text-emerald-500')}
          placeholder="Key"
          value={keyV}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyV(e.target.value)}
        />
      </div>

      <div>
        <input
          type="text"
          className={cn(inputStyles, 'text-yellow-500')}
          placeholder="Value"
          value={val}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
        />
      </div>

      <div className="flex size-5 items-center justify-center rounded-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10">
        <HugeiconsIcon
          icon={Delete02Icon}
          size={14}
          className="text-white/60 hover:text-white"
        />
      </div>
    </div>
  )
}

const Headers = () => {
  return (
    <div className="h-full w-full scrollbar-none text-white">
      <div>
        {headerArr.map((item, idx) => (
          <HeaderObj
            key={idx}
            keyP={item.keyP}
            isIncluded={item.isIncluded}
            value={item.value}
          />
        ))}
      </div>
    </div>
  )
}

export default Headers
