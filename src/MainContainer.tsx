import NavBar from '@/components/NavBar'

import FileExp from '@/components/FileExp'
import { useState } from 'react'
import { Outlet } from 'react-router'

const MainContainer =  () => {
  const [isFileExpOpen, setIsFileExpOpen] = useState<boolean>(true)

  return (
    <div className="bg-dgray h-screen w-full font-normal">
      <div className="flex h-screen w-full">
        <NavBar setIsFileExpOpen={setIsFileExpOpen} />
        <FileExp fileExpIsOpen={isFileExpOpen} />
        <Outlet/>
      </div>
    </div>
  )
}

export default MainContainer;