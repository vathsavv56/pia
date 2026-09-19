import UrlBar from "@/components/URLbar"
import Response from "@/components//Response"
import Request from "@/components/Request"
import PageList from "@/components/PageList"



const Client = () => {
  return (
    <div id="client"
      className="w-full h-full flex flex-col items-center gap-2"
    >
      <div className="w-full min-h-[10%] flex flex-col gap-2 ">
        <PageList />
        <UrlBar />
      </div>

      <div className="w-[calc(100%-1rem)] mx-2 flex-1 flex items-center bg-lgray rounded-md mb-2 overflow-hidden">
        <Request/>
        <Response/>
      </div>
    </div>
  )
}

export default Client