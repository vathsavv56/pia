import NavBar from '@/components/NavBar'

import FileExp from '@/components/FileExp'
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { warmupProxy } from '@/api/warmup'

const MainContainer = () => {
  const [isFileExpOpen, setIsFileExpOpen] = useState<boolean>(
    () => window.matchMedia('(min-width: 64rem)').matches,
  )

  const toggleFileExp = useCallback(() => setIsFileExpOpen((prev) => !prev), [])

  // Wake the reverse proxy (Render sleeps when idle) as soon as the app loads.
  useEffect(() => {
    warmupProxy()
  }, [])

  // The sidebar covers the page on small screens, so Escape closes it.
  useEffect(() => {
    if (!isFileExpOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFileExpOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isFileExpOpen])

  const closeFileExp = useCallback(() => setIsFileExpOpen(false), [])

  return (
    <div className="bg-dgray font-body relative flex h-dvh w-full overflow-hidden">
      <NavBar toggleFileExp={toggleFileExp} />
      <FileExp fileExpIsOpen={isFileExpOpen} onClose={closeFileExp} />
      <Outlet />
    </div>
  )
}

export default MainContainer
