import { z } from 'zod'
import { requestDraftSchema } from './request.type'
import type { RequestDraft } from './request.type'

/**
 * A node in the collection tree. Folders hold children, requests hold the
 * draft that the editor is currently showing.
 */
export type FileNode = {
  id: string
  name: string
  isFolder: boolean
  child?: FileNode[]
  draft?: RequestDraft
}

export const fileNodeSchema: z.ZodType<FileNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    isFolder: z.boolean(),
    child: z.array(fileNodeSchema).optional(),
    draft: requestDraftSchema.optional(),
  }),
)

export const collectionSchema = z.object({
  nodes: z.array(fileNodeSchema),
})
export type Collection = z.infer<typeof collectionSchema>
