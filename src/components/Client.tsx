import UrlBar from '@/components/URLbar'
import Response from '@/components/Response'
import Request from '@/components/Request'
import PageList from '@/components/PageList'

const Client = () => {
  return (
    <main
      id="client"
      className="flex h-full w-full min-w-0 flex-1 flex-col items-center gap-1.5 overflow-hidden sm:gap-2"
    >
      <div className="flex w-full shrink-0 flex-col gap-1.5 sm:gap-2">
        <PageList />
        <UrlBar />
      </div>

      <div className="bg-lgray mx-2 mb-2 flex min-h-0 w-[calc(100%-1rem)] flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain rounded-md lg:flex-row lg:overflow-hidden">
        <Request />
        <Response />
      </div>
    </main>
  )
}

export default Client
