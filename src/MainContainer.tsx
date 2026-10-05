import NavBar from '@/components/NavBar'

import FileExp from '@/components/FileExp'
import { useState } from 'react'
import { Outlet } from 'react-router'

const MainContainer = () => {
  const [isFileExpOpen, setIsFileExpOpen] = useState<boolean>(
    () => window.matchMedia('(min-width: 64rem)').matches,
  )

  return (
    <div className="bg-dgray relative flex h-dvh w-full overflow-hidden font-normal">
      <NavBar setIsFileExpOpen={setIsFileExpOpen} />
      <FileExp
        fileExpIsOpen={isFileExpOpen}
        onClose={() => setIsFileExpOpen(false)}
      />
      <Outlet />
    </div>
  )
}

export default MainContainer
