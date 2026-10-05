/**
 * Sanity checks for the pure logic: request building, tree editing, row
 * helpers and response normalisation. No test runner is installed, so this is
 * a plain script. Run it with `bun run check`.
 */
import { buildRequest } from '@/utils/buildRequest'
import { freshDraft, newRow, withTrailingBlank } from '@/context/Keyvalue'
import { freshAuth, freshBody } from '@/types/request.type'
import {
  findNode,
  insertNode,
  mapNode,
  removeNode,
  uniqueName,
  siblingsOf,
} from '@/utils/tree'
import {
  responseSchema,
  statusKind,
  sendResultSchema,
} from '@/types/response.type'
import { toApiResponse } from '@/api/api'
import type { FileNode } from '@/types/collection.type'

let pass = 0,
  fail = 0
const check = (name: string, cond: boolean, extra?: unknown) => {
  if (cond) {
    pass++
    console.log(`  ok  ${name}`)
  } else {
    fail++
    console.log(`FAIL  ${name}`, extra ?? '')
  }
}

console.log('\n-- buildRequest --')
let d = freshDraft()
check('default url comes from config', d.url.includes('jsonplaceholder'), d.url)

let r = await buildRequest(d)
check('default GET has no body', r.body === null && r.bodyMode === 'None')
check('blank param rows are dropped', Object.keys(r.params).length === 0)

d.params = [
  { ...newRow(), keyP: 'a', value: '1' },
  { ...newRow(), keyP: 'b', value: '2', isIncluded: false },
  { ...newRow(), keyP: 'c', value: '' },
]
r = await buildRequest(d)
check(
  'only included rows with keys are sent',
  JSON.stringify(r.params) === '{"a":"1","c":""}',
  r.params,
)

d.headers = [{ ...newRow(), keyP: 'X-Test', value: 'yes' }]
r = await buildRequest(d)
check('custom header survives', r.headers['X-Test'] === 'yes')

d.auth = freshAuth('Basic')
if (d.auth.type === 'Basic') {
  d.auth.username = 'u'
  d.auth.password = 'p'
}
r = await buildRequest(d)
check(
  'basic auth base64',
  r.headers.Authorization === 'Basic dTpw',
  r.headers.Authorization,
)

d.auth = { type: 'API Key', key: 'k', value: 'v', location: 'Query Param' }
r = await buildRequest(d)
check('api key as query param', r.params.k === 'v', r.params)

d.auth = { type: 'API Key', key: 'k', value: 'v', location: 'Header' }
r = await buildRequest(d)
check('api key as header', r.headers.k === 'v')

d.body = freshBody('JSON')
if (d.body.mode === 'JSON') d.body.json = '{"ok":true}'
r = await buildRequest(d)
check(
  'json mode sets content-type',
  r.contentType === 'application/json',
  r.contentType,
)

d.body = { mode: 'JSON', json: '{bad}' }
let threw = ''
try {
  await buildRequest(d)
} catch (e) {
  threw = (e as Error).message
}
check(
  'invalid json is rejected before sending',
  threw.includes('not valid JSON'),
  threw,
)

try {
  await buildRequest({ ...freshDraft(), url: 'not a url' })
} catch (e) {
  threw = (e as Error).message
}
check('bad url is rejected', threw.includes('not a valid http'), threw)

d.body = freshBody('File')
if (d.body.mode === 'File')
  d.body.file = new File(['hello'], 'a.txt', { type: 'text/plain' })
r = await buildRequest(d)
check('file body is read as text', r.body === 'hello', r.body)
check(
  'file content type is used',
  r.contentType ===
    (d.body.mode === 'File'
      ? d.body.file?.type || 'application/octet-stream'
      : ''),
  r.contentType,
)

console.log('\n-- rows --')
check(
  'trailing blank row is added',
  withTrailingBlank([{ ...newRow(), keyP: 'a', value: 'b' }]).length === 2,
)
check(
  'trailing blank row is not duplicated',
  withTrailingBlank([newRow()]).length === 1,
)
check('empty list gets one row', withTrailingBlank([]).length === 1)

console.log('\n-- tree --')
const req: FileNode = {
  id: 'r1',
  name: 'R1',
  isFolder: false,
  draft: freshDraft(),
}
const tree: FileNode[] = [
  { id: 'f1', name: 'F1', isFolder: true, child: [req] },
]
check('findNode dives into folders', findNode(tree, 'r1') === req)
check('findNode misses cleanly', findNode(tree, 'nope') === null)
check('removeNode drops the subtree', removeNode(tree, 'f1').length === 0)
const other: FileNode = { id: 'f2', name: 'F2', isFolder: true, child: [] }
const twoBranches = [...tree, other]
const mapped = mapNode(twoBranches, 'r1', (n) => ({ ...n, name: 'X' }))
check('mapNode leaves unrelated branches identical', mapped[1] === other)
check(
  'mapNode renames only the target',
  findNode(mapped, 'r1')?.name === 'X' && tree[0].child![0].name === 'R1',
)
check('insertNode adds at root', insertNode(tree, null, req).length === 2)
check(
  'insertNode adds inside a folder',
  (insertNode(tree, 'f1', { id: 'r2', name: 'R2', isFolder: false }) as any)[0]
    .child.length === 2,
)
check(
  'uniqueName dedupes',
  uniqueName(tree, 'F1', 'other') === 'F1 2',
  uniqueName(tree, 'F1', 'other'),
)
check('siblingsOf finds the parent list', siblingsOf(tree, 'r1').length === 1)

console.log('\n-- response --')
check('2xx -> success', statusKind(204) === 'success')
check('3xx -> redirect', statusKind(302) === 'redirect')
check('404 -> clientError', statusKind(404) === 'clientError')
check('500 -> serverError', statusKind(500) === 'serverError')

const api = toApiResponse(
  {
    status: 200,
    statusText: 'OK',
    data: { hello: 'world' },
    headers: {
      'content-type': 'application/json',
      'set-cookie': ['a=1', 'b=2'],
    },
    config: { url: 'https://x.test/1' },
  } as any,
  1000,
)
check(
  'zod accepts the built response',
  responseSchema.safeParse(api).success,
  responseSchema.safeParse(api).error?.issues,
)
check(
  'json payload detected',
  api.payloadKind === 'json' && (api.data as any).hello === 'world',
)
check('array headers are joined', api.headers['set-cookie'] === 'a=1, b=2')
check('kind derived from status', api.kind === 'success' && api.ok === true)
check(
  'duration measured from start',
  toApiResponse(
    {
      status: 200,
      statusText: 'OK',
      data: '',
      headers: {},
      config: { url: 'u' },
    } as any,
    performance.now(),
  ).durationMs >= 0,
)

const txt = toApiResponse(
  {
    status: 404,
    statusText: 'Not Found',
    data: 'nope',
    headers: {},
    config: { url: 'u' },
  } as any,
  0,
)
check(
  '404 is still a response not a throw',
  txt.ok === false && txt.payloadKind === 'text',
)
check(
  '404 result validates',
  sendResultSchema.safeParse({ ok: true, response: txt }).success,
)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
