import { nanoid } from 'nanoid'

export type KeyValueRow = {
  id: string
  isIncluded: boolean
  keyP: string
  value: string
}

export type ListKey = 'params' | 'headers'

export const newRow = (): KeyValueRow => ({
  id: nanoid(8),
  isIncluded: true,
  keyP: '',
  value: '',
})

export const withTrailingBlank = (rows: KeyValueRow[]): KeyValueRow[] => {
  const last = rows[rows.length - 1]
  if (rows.length === 0) return [newRow()]
  if (last.keyP !== '' || last.value !== '') return [...rows, newRow()]
  return rows
}
