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
import { reconcileCollection } from '@/context/reconcile'

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

console.log('\n-- buttons have handlers --')

/**
 * A button with no handler does nothing and looks fine: it typechecks, it lints,
 * it builds. That is exactly how a broken Send button shipped once already.
 * This scans the opening tag of every <button> in our components.
 */
const componentDir = './src/components'
const buttonFiles = [...new Bun.Glob('*.tsx').scanSync({ cwd: componentDir })]

// Fail loudly if the scan found nothing, otherwise this passes vacuously and
// protects nothing.
check(
  'the button scan actually found components',
  buttonFiles.length > 0,
  buttonFiles.length,
)

const deadButtons: string[] = []

for (const file of buttonFiles) {
  const source = await Bun.file(`${componentDir}/${file}`).text()
  for (const match of source.matchAll(/<button\b([^>]*)>/g)) {
    const attrs = match[1] ?? ''
    // A disabled button is inert on purpose, so it is not a missing handler.
    const hasHandler =
      attrs.includes('onClick') ||
      attrs.includes('onSubmit') ||
      attrs.includes('onMouseDown') ||
      attrs.includes('onPointerDown') ||
      attrs.includes('disabled')
    if (!hasHandler) deadButtons.push(`${file}: ${attrs.trim().slice(0, 60)}`)
  }
}

check('no <button> is missing a handler', deadButtons.length === 0, deadButtons)

console.log('\n-- saved collection (the two bugs that were reported) --')

const mkReq = (id: string, name: string): FileNode => ({
  id,
  name,
  isFolder: false,
  draft: freshDraft(),
})
const mkTree = (kids: FileNode[]): FileNode[] => [
  { id: 'f1', name: 'My Collection', isFolder: true, child: kids },
]

// Bug 1: an earlier version re-seeded when storage was empty, wiping the tree.
const savedTree = mkTree([mkReq('r1', 'Keep me'), mkReq('r2', 'Keep me too')])
const fallback = {
  nodes: mkTree([mkReq('seed', 'Seeded')]),
  openIds: ['seed'],
  activeId: 'seed',
}
const kept = reconcileCollection(
  { nodes: savedTree, openIds: ['r1'], activeId: 'r1' },
  fallback,
)
check(
  'saved nodes are never replaced',
  kept.nodes[0]?.child?.length === 2,
  kept.nodes,
)
check('saved names survive', kept.nodes[0]?.child?.[1]?.name === 'Keep me too')
check('active request is kept', kept.activeId === 'r1')

// Bug 2: an earlier version restored activeId: null, which made every draft
// edit a no-op, so the URL bar and Send button did nothing.
const stale = reconcileCollection(
  { nodes: savedTree, openIds: [], activeId: null },
  fallback,
)
check(
  'null activeId opens a request instead',
  stale.activeId !== null,
  stale.activeId,
)
check(
  'that request is really in the tree',
  stale.nodes[0]?.child?.some((n) => n.id === stale.activeId) === true,
  stale.activeId,
)
check('it also becomes a tab', stale.openIds.includes(stale.activeId as string))

const staleOpen = reconcileCollection(
  { nodes: savedTree, openIds: ['r1'], activeId: null },
  fallback,
)
check(
  'existing tab is preferred over inventing one',
  staleOpen.activeId === 'r1',
)

// A tab whose request was deleted must not linger.
const gone = reconcileCollection(
  { nodes: savedTree, openIds: ['r1', 'deleted'], activeId: 'deleted' },
  fallback,
)
check('tab for a deleted request is dropped', !gone.openIds.includes('deleted'))
check('activeId falls back to a real request', gone.activeId === 'r1')

// First run: nothing saved, so the seeded collection is what you get.
const first = reconcileCollection(undefined, fallback)
check('first run keeps the seeded request', first.activeId === 'seed')
check('first run keeps the seeded nodes', first.nodes === fallback.nodes)

// Older saves missing fields entirely.
const partial = reconcileCollection(
  { nodes: mkTree([{ id: 'r9', name: 'Old', isFolder: false } as FileNode]) },
  fallback,
)
check(
  'a saved node missing a draft is repaired',
  partial.nodes[0]?.child?.[0]?.draft?.method === 'GET',
)
check('missing openIds does not crash', Array.isArray(partial.openIds))
check('still opens something', partial.activeId === 'r9')

// A File body cannot be serialised, so it is dropped on the way out.
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
