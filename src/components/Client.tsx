import UrlBar from '@/components/URLbar'
import Response from '@/components/Response'
import Request from '@/components/Request'
import PageList from '@/components/PageList'
import { useCollectionStore } from '@/context/collectionStore'
import { findNode } from '@/utils/tree'
import { Navigate, useParams } from 'react-router'
import { useEffect } from 'react'

const Client = () => {
  const { id } = useParams<{ id: string }>()
  const nodes = useCollectionStore((s) => s.nodes)
  const activeId = useCollectionStore((s) => s.activeId)
  const openTab = useCollectionStore((s) => s.openTab)

  const target = id ? findNode(nodes, id) : null

  // A pasted or bookmarked /req/:id URL should open the tab, not just render.
  useEffect(() => {
    if (id && target && !target.isFolder && activeId !== id) openTab(id)
  }, [id, target, activeId, openTab])

  // Keep the URL and the open request pointing at the same thing.
  if (id && (!target || target.isFolder)) return <Navigate replace to="/" />
  if (!id && activeId) return <Navigate replace to={`/req/${activeId}`} />

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
