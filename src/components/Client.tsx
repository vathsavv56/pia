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

      <div className="w-full h-full flex items-center ">
        <Request/>
        <Response/>
      </div>
    </div>
  )
}

export default Client