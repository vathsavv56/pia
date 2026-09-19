import { useState } from 'react'
import ParamsSection from '@/components/ParamsSection'
import Headers from '@/components/Headers'
import Auth from '@/components/Auth'
import Body from '@/components/Body'

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

  return (
    <div className="bg-dgray h-full w-[50%] overflow-auto rounded-md">
      <div className="mt-5 flex h-10 w-fit items-center justify-around gap-2 text-white">
        {tabArr.map((item, index) => (
          <p
            key={index}
            className={`h-fit w-fit rounded-md px-2 py-1 font-mono text-sm hover:cursor-default hover:bg-white/5 ${currTab === item ? 'bg-white/10' : ''}`}
            onClick={() => setCurrTab(item)}
          >
            {item}
          </p>
        ))}
      </div>

      <div className="">{renderTab(currTab)}</div>
    </div>
  )
}

export default Request
