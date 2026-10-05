import {
  useActiveDraft,
  useDraft,
  useDraftActions,
} from '@/context/requestStore'
import { useResponseStore } from '@/context/responseStore'
import { httpMethodArr } from '@/types/request.type'
import type { HttpMethod } from '@/types/request.type'
import { cn } from '@/utils/cn'
import Dropdown from '@/components/Dropdown'
import { useState } from 'react'

/** One colour per verb, so the method reads at a glance. */
const methodColor = (method: HttpMethod) => {
  switch (method) {
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

const UrlBar = () => {
  const method = useDraft((draft) => draft.method)
  const url = useDraft((draft) => draft.url)
  const draft = useActiveDraft()
  const { setMethod, setUrl } = useDraftActions()
  const send = useResponseStore((s) => s.send)
  const cancel = useResponseStore((s) => s.cancel)
  const isLoading = useResponseStore((s) => s.isLoading)

  const [isHovered, setIsHovered] = useState<boolean>(false)

  const handleSend = () => void send(draft)

  return (
    <div className="bg-lgray mx-2 flex h-14 w-[calc(100%-1rem)] min-w-0 items-center gap-1 rounded-md px-1.5 sm:h-15 sm:gap-2 sm:px-2">
      <Dropdown
        label="HTTP method"
        value={method}
        placement="bottom"
        options={httpMethodArr.map((m) => ({
          value: m,
          label: m,
          className: methodColor(m),
        }))}
        onSelect={setMethod}
        triggerClassName={cn('font-mono', methodColor(method))}
        menuClassName="font-mono"
        optionClassName="block"
        renderOption={(option) => option.label}
      />

      <div id="input" className="mx-1 h-6 w-full min-w-0 flex-1 sm:mx-2">
        <input
          type="text"
          aria-label="Request URL"
          spellCheck={false}
          className="h-full w-full min-w-0 text-[16px] tracking-wider text-blue-500 placeholder:text-white/50 hover:cursor-default focus:outline-none"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUrl(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend()
          }}
          placeholder={
            isHovered ? 'Enter a URL' : 'Hey Thanks For Using Pia ❤️'
          }
          onMouseOver={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </div>

      {isLoading ? (
        <button
          id="cancel"
          type="button"
          aria-label="Cancel request"
          className="sm:text-md flex h-8 w-fit shrink-0 items-center justify-center rounded-md bg-red-500 px-3 text-sm text-white hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-white focus-visible:outline-none sm:px-4"
          onClick={cancel}
        >
          Cancel
        </button>
      ) : (
        <button
          id="send"
          type="button"
          className="sm:text-md flex h-8 w-fit shrink-0 items-center justify-center rounded-md bg-blue-500 px-3 text-sm text-white hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-white focus-visible:outline-none sm:px-4"
          onClick={handleSend}
        >
          Send
        </button>
      )}
    </div>
  )
}

export default UrlBar
