import NavBar from "@/components/NavBar"
import Client from "@/components/Client"
import FileExp from "@/components/FileExp";
import { useState } from "react";

const App = () => {
  const [isFileExpOpen, setIsFileExpOpen] = useState<boolean>(false);


  return (
    <div className='bg-dgray h-screen w-full font-normal'>

      <div className="h-screen w-full flex">
        <NavBar setIsFileExpOpen={setIsFileExpOpen}/>
          <FileExp fileExpIsOpen={isFileExpOpen}/>       
        <Client />
      </div>
    </div>
  )
}

export default App