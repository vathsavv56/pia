import { UnfoldMoreDownIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"




const UrlBar = () => {
  return (
    <div className='w-[calc(100%-1rem)] h-15  flex items-center justify-evenly px-2 bg-lgray rounded-md mx-2'>
      <div id="method" className="h-8 w-fit px-4 py-2 flex items-center justify-center text-white rounded-md bg-teal-500 hover:cursor-pointer">
          GET <HugeiconsIcon icon={UnfoldMoreDownIcon}/>
      </div>

      <div id="input" className="h-6 w-full mx-2">
        <input type="text" className="w-full h-full focus:outline-none text-[16px] text-blue-500" />
      </div>

      <button id="send" className="h-8 w-fit text-white px-4 py-2 flex items-center justify-center text-md bg-blue-500 rounded-md hover:cursor-pointer">
          Send
      </button>

    </div>
  )
}

export default UrlBar