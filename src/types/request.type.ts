import { z } from 'zod'



export const httpMethodArr = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const

export const httpMethodSchema = z.enum(httpMethodArr)
export type HttpMethod = z.infer<typeof httpMethodSchema>

export const listKeyArr = ['params', 'headers'] as const
export const listKeySchema = z.enum(listKeyArr)
export type ListKey = z.infer<typeof listKeySchema>


export const keyValueRowSchema = z.object({
  id: z.string(),
  isIncluded: z.boolean(),
  keyP: z.string(),
  value: z.string(),
})
export type KeyValueRow = z.infer<typeof keyValueRowSchema>


export const authTypeArr = ['None', 'Basic', 'Bearer', 'API Key'] as const
export const authTypeSchema = z.enum(authTypeArr)
export type AuthType = z.infer<typeof authTypeSchema>

export const apiKeyLocationArr = ['Header', 'Query Param'] as const
export const apiKeyLocationSchema = z.enum(apiKeyLocationArr)
export type ApiKeyLocation = z.infer<typeof apiKeyLocationSchema>

export const authSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('None') }),
  z.object({
    type: z.literal('Basic'),
    username: z.string(),
    password: z.string(),
  }),
  z.object({ type: z.literal('Bearer'), token: z.string() }),
  z.object({
    type: z.literal('API Key'),
    key: z.string(),
    value: z.string(),
    location: apiKeyLocationSchema,
  }),
])
export type Auth = z.infer<typeof authSchema>





export const bodyModeArr = ['None', 'Text', 'JSON', 'File'] as const
export const bodyModeSchema = z.enum(bodyModeArr)
export type BodyMode = z.infer<typeof bodyModeSchema>

export const requestBodySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('None') }),
  z.object({ mode: z.literal('Text'), text: z.string() }),
  z.object({ mode: z.literal('JSON'), json: z.string() }),
  z.object({ mode: z.literal('File'), file: z.custom<File>().nullable() }),
])
export type RequestBody = z.infer<typeof requestBodySchema>


export const requestDraftSchema = z.object({
  method: httpMethodSchema,
  url: z.string(),
  params: z.array(keyValueRowSchema),
  headers: z.array(keyValueRowSchema),
  auth: authSchema,
  body: requestBodySchema,
})
export type RequestDraft = z.infer<typeof requestDraftSchema>


/* -------------------------------------------------------------------------- */
/*                     What actually travels over the wire                   */
/* -------------------------------------------------------------------------- */

/**
 * The flattened, ready-to-send shape. The proxy (or the browser) only needs
 * these fields, so this is the contract we hand to `src/api/api.ts`.
 */
export const serializedRequestSchema = z.object({
  method: httpMethodSchema,
  url: z.string().min(1, 'Request URL is required'),
  bodyMode: bodyModeSchema,
  headers: z.record(z.string(), z.string()),
  params: z.record(z.string(), z.string()),
  body: z.string().nullable(),
  contentType: z.string().nullable(),
})
export type SerializedRequest = z.infer<typeof serializedRequestSchema>

/* -------------------------------------------------------------------------- */
/*                              Fresh value factories                         */
/* -------------------------------------------------------------------------- */

export const freshAuth = (type: AuthType): Auth => {
  switch (type) {
    case 'Basic':
      return { type: 'Basic', username: '', password: '' }
    case 'Bearer':
      return { type: 'Bearer', token: '' }
    case 'API Key':
      return {
        type: 'API Key',
        key: 'X-API-Key',
        value: '',
        location: 'Header',
      }
    default:
      return { type: 'None' }
  }
}

export const freshBody = (mode: BodyMode): RequestBody => {
  switch (mode) {
    case 'Text':
      return { mode: 'Text', text: '' }
    case 'JSON':
      return { mode: 'JSON', json: '' }
    case 'File':
      return { mode: 'File', file: null }
    default:
      return { mode: 'None' }
  }
}
