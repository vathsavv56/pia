import { useState } from 'react'
import ParamsSection from '@/components/ParamsSection'
import Headers from '@/components/Headers'
import Auth from '@/components/Auth'
import Body from '@/components/Body'
import { useRequestStore } from '@/context/requestStore'
import { cn } from '@/utils/cn'

type Tab = 'Params' | 'Headers' | 'Auth' | 'Body'

const tabArr: Tab[] = ['Params', 'Headers', 'Auth', 'Body']

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

  const params = useRequestStore((s) => s.params)
  const headers = useRequestStore((s) => s.headers)
  const filledCount = (rows: typeof params) =>
    rows.filter((row) => row.keyP !== '').length

  return (
    <section className="bg-dgray flex w-full min-h-[24rem] flex-col rounded-md lg:h-full lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:shrink-0 lg:overflow-hidden">
      <div
        role="tablist"
        className={cn(
          'scrollbar-none mt-2 flex w-full shrink-0 items-center gap-1 overflow-x-auto text-white sm:mt-5 sm:w-fit sm:justify-around sm:gap-2',
        )}
      >
        {tabArr.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={currTab === item}
            className={cn(
              'flex h-fit w-fit shrink-0 items-center gap-1 rounded-md px-2 py-1 font-mono text-sm whitespace-nowrap hover:bg-white/5',
              currTab === item && 'bg-white/10',
            )}
            onClick={() => setCurrTab(item)}
          >
            <span>{item}</span>
            {item === 'Params' && (
              <span className="text-sm text-green-500">
                {filledCount(params)}
              </span>
            )}
            {item === 'Headers' && (
              <span className="text-sm text-amber-500">
                {filledCount(headers)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 w-full flex-1">{renderTab(currTab)}</div>
    </section>
  )
}

export default Request
