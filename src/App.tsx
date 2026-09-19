import NavBar from '@/components/NavBar'
import Client from '@/components/Client'
import FileExp from '@/components/FileExp'
import { useState } from 'react'

const App = () => {
  const [isFileExpOpen, setIsFileExpOpen] = useState<boolean>(true)

  return (
    <div className="bg-dgray h-screen w-full font-normal">
      <div className="flex h-screen w-full">
        <NavBar setIsFileExpOpen={setIsFileExpOpen} />
        <FileExp fileExpIsOpen={isFileExpOpen} />
        <Client />
      </div>
    </div>
  )
}

export default App
