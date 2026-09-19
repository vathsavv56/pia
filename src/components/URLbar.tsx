import { UnfoldMoreDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

type HttpMethod =
  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

const UrlBar = () => {
  const [valueT, setValueT] = useState<string>('')
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  

  const setColor = (node: HttpMethod) => {
    switch (node) {
      case 'GET':
        return 'text-green-500'

      case 'POST':
        return 'text-blue-500'

      case 'PUT':
        return 'text-yellow-500'

      case 'PATCH':
        return 'text-purple-500'

      case 'DELETE':
        return 'text-red-500'

      case 'HEAD':
        return 'text-cyan-500'

      case 'OPTIONS':
        return 'text-orange-500'

      default:
        return 'text-gray-500'
    }
  }
  return (
    <div className="bg-lgray mx-2 flex h-15 w-[calc(100%-1rem)] items-center justify-evenly rounded-md px-2">
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          className="flex h-8 items-center gap-1 rounded-md px-2 text-white hover:bg-white/7  "
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          <span className={`${setColor(method)}`}>{method}</span>

          <HugeiconsIcon icon={UnfoldMoreDownIcon} size={14} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="bg-lgray absolute top-full left-0 z-50 mt-1 w-32 rounded-xl border border-white/10 p-1 shadow-md">
            {(
              [
                'GET',
                'POST',
                'PUT',
                'PATCH',
                'DELETE',
                'HEAD',
                'OPTIONS',
              ] as HttpMethod[]
            ).map((m) => (
              <button
                key={m}
                type="button"
                className={cn(
                  'w-full rounded px-2 py-1.5 text-left text-sm text-white hover:bg-white/10',
                  `${setColor(m)}`,
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMethod(m)
                  setIsOpen(false)
                }}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* {"Input"} */}
      <div id="input" className="mx-2 h-6 w-full">
        <input
          type="text"
          className="h-full w-full text-[16px] tracking-wider text-blue-500 placeholder:text-white/30 hover:cursor-default focus:outline-none"
          value={valueT}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValueT(e.target.value)
          }
          placeholder={isHovered ? 'Enter a URL' : 'Hey Thanks For Using Pia ❤️'}
          onMouseOver={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </div>

      <button
        id="send"
        className="text-md flex h-8 w-fit items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-white hover:cursor-pointer"
      >
        Send
      </button>
    </div>
  )
}

export default UrlBar
