import { create } from 'zustand'
import { newRow, withTrailingBlank } from './Keyvalue'
import type { KeyValueRow, ListKey } from './Keyvalue'

export type AuthType = 'None' | 'Basic' | 'Bearer' | 'API Key'
export type ApiKeyLocation = 'Header' | 'Query Param'
export type BodyMode = 'None' | 'Text' | 'JSON' | 'File'

export type Auth =
  | { type: 'None' }
  | { type: 'Basic'; username: string; password: string }
  | { type: 'Bearer'; token: string }
  | {
      type: 'API Key'
      key: string
      value: string
      location: ApiKeyLocation
    }

export type RequestBody =
  | { mode: 'None' }
  | { mode: 'Text'; text: string }
  | { mode: 'JSON'; json: string }
  | { mode: 'File'; file: File | null }

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

type RequestStoreType = {
  params: KeyValueRow[]
  headers: KeyValueRow[]
  auth: Auth
  body: RequestBody
  updateRow: (list: ListKey, id: string, patch: Partial<KeyValueRow>) => void
  toggleRow: (list: ListKey, id: string) => void
  removeRow: (list: ListKey, id: string) => void
  clearList: (list: ListKey) => void
  setAuth: (auth: Auth) => void
  setBody: (body: RequestBody) => void
}

export const useRequestStore = create<RequestStoreType>()((set) => ({
  params: [newRow()],
  headers: [newRow()],
  auth: freshAuth('None'),
  body: freshBody('None'),

  updateRow: (list, id, patch) =>
    set((state) => {
      const rows = state[list].map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      )
      return { [list]: withTrailingBlank(rows) } as Partial<RequestStoreType>
    }),

  toggleRow: (list, id) =>
    set((state) => {
      const rows = state[list].map((row) =>
        row.id === id ? { ...row, isIncluded: !row.isIncluded } : row,
      )
      return { [list]: rows } as Partial<RequestStoreType>
    }),

  removeRow: (list, id) =>
    set((state) => {
      const rows = state[list].filter((row) => row.id !== id)
      return { [list]: withTrailingBlank(rows) } as Partial<RequestStoreType>
    }),

  clearList: (list) => set({ [list]: [newRow()] } as Partial<RequestStoreType>),

  setAuth: (auth) => set({ auth }),
  setBody: (body) => set({ body }),
}))
