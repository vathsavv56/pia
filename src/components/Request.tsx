import { useState } from 'react'
import ParamsSection from '@/components/ParamsSection'
import Headers from '@/components/Headers'
import Auth from '@/components/Auth'
import Body from '@/components/Body'
import { useRequestStore } from '@/context/requestStore'

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
    <div className="bg-dgray flex h-full w-[50%] scrollbar-none flex-col overflow-auto rounded-md">
      <div className="mt-5 flex h-10 w-fit shrink-0 items-center justify-around gap-2 text-white">
        {tabArr.map((item) => (
          <p
            key={item}
            className={`flex h-fit w-fit items-center gap-1 rounded-md px-2 py-1 font-mono text-sm hover:cursor-default hover:bg-white/5 ${currTab === item ? 'bg-white/10' : ''}`}
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
          </p>
        ))}
      </div>

      <div className="min-h-0 w-full flex-1">{renderTab(currTab)}</div>
    </div>
  )
}

export default Request
