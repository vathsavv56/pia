import UrlBar from '@/components/URLbar'
import Response from '@/components//Response'
import Request from '@/components/Request'
import PageList from '@/components/PageList'

const Client = () => {
  return (
    <div id="client" className="flex h-full w-full flex-col items-center gap-2">
      <div className="flex min-h-[10%] w-full flex-col gap-2">
        <PageList />
        <UrlBar />
      </div>

      <div className="bg-lgray mx-2 mb-2 flex w-[calc(100%-1rem)] flex-1 items-center overflow-hidden rounded-md">
        <Request />
        <Response />
      </div>
    </div>
  )
}

export default Client
