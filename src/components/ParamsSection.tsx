import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  SolidLine02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import {cn} from "@/utils/cn"


type Param = {
  isIncluded: boolean
  keyP: string
  value: string
}

export const paramArr: Param[] = [
  {
    isIncluded: true,
    keyP: 'Key-1',
    value: 'Value-1',
  },
  {
    isIncluded: false,
    keyP: 'Key-2',
    value: 'value-2',
  },
]

interface ParamObjProps {
  keyP: string
  value: string
  isIncluded: boolean
}

const ParamObj = ({ keyP, value, isIncluded }: ParamObjProps) => {

    const [keyV , setKeyV] = useState<string>(keyP);
    const [val , setVal] = useState<string>(value);
    

  
  const inputStyles =
    'focus:outline-none ml-2 px-2 py-2 focus:ring-1 focus:ring-blue-500 rounded-md placeholder:text-white/40 hover:cursor-default'


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
        <input type="text" 
        className={cn(inputStyles , "text-emerald-500")} 
        placeholder="Key"
        value={keyV}
        onChange={(e:React.ChangeEvent<HTMLInputElement>)=> setKeyV(e.target.value)}
        />
      </div>

      <div>
        <input type="text" 
        className={cn(inputStyles , "text-yellow-500")} 
        placeholder="Value" 
         value={val}
        onChange={(e:React.ChangeEvent<HTMLInputElement>)=> setVal(e.target.value)}
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

const ParamsSection = () => {
  return (
    <div className="h-full w-full scrollbar-none text-white">
      <div>
        {paramArr.map((item, idx) => (
          <ParamObj
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

export default ParamsSection
