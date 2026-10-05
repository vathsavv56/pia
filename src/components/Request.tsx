import { useRef, useState } from 'react'
import ParamsSection from '@/components/ParamsSection'
import Headers from '@/components/Headers'
import Auth from '@/components/Auth'
import Body from '@/components/Body'
import { useDraft } from '@/context/requestStore'
import type { KeyValueRow } from '@/types/request.type'
import { cn } from '@/utils/cn'

type Tab = 'Params' | 'Headers' | 'Auth' | 'Body'

const tabArr: Tab[] = ['Params', 'Headers', 'Auth', 'Body']

const tabId = (tab: Tab) => `request-tab-${tab}`
const panelId = (tab: Tab) => `request-panel-${tab}`

/** Rows that actually carry a key, so the badge means something useful. */
const filledCount = (rows: KeyValueRow[]) =>
  rows.filter((row) => row.keyP.trim() !== '').length

const Request = () => {
  const renderTab = (tab: Tab) => {
    switch (tab) {
      case 'Params':
        return <ParamsSection />

      case 'Headers':
        return <Headers />

      case 'Auth':
        return <Auth />

      case 'Body':
        return <Body />

      default:
        return null
    }
  }

  const [currTab, setCurrTab] = useState<Tab>('Params')

  const tablistRef = useRef<HTMLDivElement>(null)

  const params = useDraft((draft) => draft.params)
  const headers = useDraft((draft) => draft.headers)

  const focusTab = (tab: Tab) => {
    setCurrTab(tab)
    tablistRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(tab))}`)
      ?.focus()
  }

  const handleTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabArr.indexOf(currTab)

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        focusTab(tabArr[(current + 1) % tabArr.length])
        break
      case 'ArrowLeft':
        e.preventDefault()
        focusTab(tabArr[(current - 1 + tabArr.length) % tabArr.length])
        break
      case 'Home':
        e.preventDefault()
        focusTab(tabArr[0])
        break
      case 'End':
        e.preventDefault()
        focusTab(tabArr[tabArr.length - 1])
        break
      default:
        break
    }
  }

  return (
    <section className="bg-dgray flex min-h-[22rem] w-full flex-col rounded-md sm:min-h-[24rem] lg:h-full lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:shrink-0 lg:overflow-hidden">
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Request sections"
        onKeyDown={handleTabListKeyDown}
        className={cn(
          'mt-2 flex w-full shrink-0 scrollbar-none items-center gap-1 overflow-x-auto overscroll-x-contain px-1 text-white sm:mt-5 sm:w-fit sm:justify-around sm:gap-2 sm:px-0',
        )}
      >
        {tabArr.map((item) => {
          const isSelected = currTab === item
          const count =
            item === 'Params'
              ? filledCount(params)
              : item === 'Headers'
                ? filledCount(headers)
                : null

          return (
            <button
              key={item}
              id={tabId(item)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={isSelected ? panelId(item) : undefined}
              tabIndex={isSelected ? 0 : -1}
              className={cn(
                'flex h-fit w-fit shrink-0 items-center gap-1 rounded-md px-2 py-1 font-mono text-sm whitespace-nowrap hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
                isSelected && 'bg-white/10',
              )}
              onClick={() => setCurrTab(item)}
            >
              <span>{item}</span>
              {count !== null && (
                <span
                  aria-hidden
                  className={cn(
                    'text-sm',
                    item === 'Params' ? 'text-green-500' : 'text-amber-500',
                  )}
                >
                  {count}
                </span>
              )}
              {count !== null && (
                <span className="sr-only">{`, ${count} filled`}</span>
              )}
            </button>
          )
        })}
      </div>

      <div
        id={panelId(currTab)}
        role="tabpanel"
        aria-labelledby={tabId(currTab)}
        tabIndex={0}
        className="min-h-0 w-full flex-1 focus:outline-none"
      >
        {renderTab(currTab)}
      </div>
    </section>
  )
}

export default Request
