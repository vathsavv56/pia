import { useState } from 'react'
import { cn } from '@/utils/cn'
import Dropdown from '@/components/Dropdown'

type HttpMethod =
  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

const methodArr: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]

const UrlBar = () => {
  const [valueT, setValueT] = useState<string>('')
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [method, setMethod] = useState<HttpMethod>('GET')

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
    <div className="bg-lgray mx-2 flex h-14 w-[calc(100%-1rem)] min-w-0 items-center gap-1 rounded-md px-1.5 sm:h-15 sm:gap-2 sm:px-2">
      <Dropdown
        label="HTTP method"
        value={method}
        placement="bottom"
        options={methodArr.map((m) => ({
          value: m,
          label: m,
          className: setColor(m),
        }))}
        onSelect={setMethod}
        triggerClassName={cn('font-mono', setColor(method))}
        menuClassName="font-mono"
        optionClassName="block"
        renderOption={(option) => option.label}
      />

      {/* {"Input"} */}
      <div id="input" className="h-6 w-full min-w-0 flex-1 sm:mx-2">
        <input
          type="text"
          aria-label="Request URL"
          className="h-full w-full min-w-0 text-[16px] tracking-wider text-blue-500 placeholder:text-white/50 hover:cursor-default focus:outline-none"
          value={valueT}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValueT(e.target.value)
          }
          placeholder={
            isHovered ? 'Enter a URL' : 'Hey Thanks For Using Pia ❤️'
          }
          onMouseOver={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </div>

      <button
        id="send"
        type="button"
        className="sm:text-md flex h-8 w-fit shrink-0 items-center justify-center rounded-md bg-blue-500 px-2.5 text-sm text-white hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-white focus-visible:outline-none sm:px-4"
      >
        Send
      </button>
    </div>
  )
}

export default UrlBar
