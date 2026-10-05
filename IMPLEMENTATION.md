# Implementation notes

Plain-language record of what changed in this pass and what each piece does.

**Before this pass** the app was a UI shell. The method and URL lived in
component state, the Send button had no click handler, and the Response pane
showed hard-coded demo data. There was no single object representing "the
request", so nothing could actually be sent.

**After this pass** there is a real request pipeline: type a request in the UI,
hit Send, and see the actual response.

---

## The request pipeline in four steps

```
UI  ->  draft (in the store)  ->  buildRequest()  ->  api.ts  ->  Response pane
```

1. **Draft** — what you see in the editor (method, URL, params, headers, auth,
   body). Stored per request file.
2. **buildRequest()** — flattens the draft into one small object and checks it
   is actually sendable (valid URL, valid JSON body).
3. **api.ts** — the axios instance. Sends it either through the reverse proxy
   or straight to the target URL.
4. **Response pane** — validates what came back with zod, then renders status,
   duration, size, headers and body.

---

## Files added

### `src/types/request.type.ts`

All zod schemas for the request side.

- `httpMethodSchema` — `GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS`
- `keyValueRowSchema` — one row in the Params/Headers grid
- `authSchema` — a _discriminated union_ on `type`: None, Basic, Bearer, API Key
- `requestBodySchema` — a discriminated union on `mode`: None, Text, JSON, File
- `requestDraftSchema` — the whole editable request
- `serializedRequestSchema` — the flattened object that actually travels over
  the wire. This is the contract handed to the proxy.

Also exports `freshAuth()` and `freshBody()`, which build an empty value for a
given auth type or body mode. The UI calls these when you switch modes.

### `src/types/response.type.ts`

All zod schemas for the response side.

- `responseSchema` — status, statusText, ok, url, headers, payloadKind, raw,
  data, sizeBytes, durationMs, timestamp
- `responseErrorSchema` — message + which stage failed (`build`, `network` or
  `proxy`)
- `sendResultSchema` — a discriminated union on `ok`. You either have a
  response or an error, never a half-state, so `if (result.ok)` is exhaustive.
- `statusKind()` — buckets a status code into success / redirect / clientError /
  serverError so the UI picks one colour instead of a big switch.

### `src/types/collection.type.ts`

The file tree shape. `fileNodeSchema` uses `z.lazy` because folders contain
nodes that are themselves folders.

### `src/config.ts`

Reads the environment once, in one place.

- `PROXY_URL` — from `VITE_REVERSE_PROXY_URL`
- `IS_PROXY_MODE` — false when that is empty
- `DEFAULT_TARGET_URL` — pre-filled URL for a new request
- `REQUEST_TIMEOUT_MS` — 30 seconds

### `src/vite-env.d.ts`

Types for `import.meta.env`, so `VITE_REVERSE_PROXY_URL` is a real string
instead of `any`.

### `src/api/api.ts`

The axios layer. One instance for the whole app.

- `client` — created with the shared timeout, and
  `validateStatus: () => true` so a 404 or 500 arrives as data to display
  rather than a thrown error.
- `sendSerializedRequest()` — the fork:
  - **proxy mode** (`VITE_REVERSE_PROXY_URL` set): `POST` the serialized
    request as JSON to your proxy. The proxy replays it against the real API.
  - **direct mode** (env var empty): send straight to the target URL. Works
    with no backend at all, for APIs that allow cross-origin requests.
- `toApiResponse()` — flattens headers, works out whether the body is JSON or
  text, parses it, measures size and duration.
- `toResponseError()` — turns anything axios can throw into our error shape.

### `src/utils/buildRequest.ts`

Turns the draft into a `SerializedRequest`. This is the only file that knows
how auth, params, headers and body combine.

- keeps only ticked rows that have a key
- later rows win when a key repeats
- Basic auth becomes `Authorization: Basic <base64>`
- Bearer becomes `Authorization: Bearer <token>`
- API Key goes to a header or a query param, depending on `location`
- sets `Content-Type` from the body mode, unless you set one yourself
- throws `RequestBuildError` for an empty/invalid URL or invalid JSON, so a
  broken request never leaves the browser

File bodies are read with `file.text()`, which is right for text and would
corrupt binary. Multipart upload is not implemented.

### `src/utils/tree.ts`

Pure helpers for the collection tree. No state, no React.

- `findNode` / `mapNode` / `removeNode` / `insertNode`
- `mapNode` returns untouched branches **by reference**, so typing in the
  request editor does not rebuild the whole tree and re-render the sidebar
- `collectRequests`, `uniqueName`, `siblingsOf`

### `src/context/collectionStore.ts`

The main Zustand store, persisted to `localStorage` under `pia-collection`.

Holds the tree (`nodes`), which requests are open as tabs (`openIds`), and
which one is showing (`activeId`). Every request node carries its own `draft`,
so switching tabs switches the whole editor.

Actions: `setMethod`, `setUrl`, `setAuth`, `setBody`, `updateRow`, `toggleRow`,
`removeRow`, `clearList`, `addNode`, `renameNode`, `removeTreeNode`,
`openTab`, `closeTab`, `setActive`.

All draft edits funnel through one helper, so "which request am I editing" is
answered in exactly one place.

Persistence only stores the tree and the tab list. A picked `File` cannot be
written to `localStorage`, so it is dropped and you pick the file again.

### `src/context/requestStore.ts`

Rewritten. This is now the read layer over the collection store.

- `useDraft((draft) => draft.params)` — read one slice of the open request
- `useActiveDraft()` — the whole draft, for code that needs everything
- `useDraftActions()` — every editing action in one object

### `src/context/responseStore.ts`

The send lifecycle: `result`, `isLoading`, `send`, `cancel`, `clear`.

`send()` builds, sends, then stores either `{ ok: true, response }` or
`{ ok: false, error }`. It never throws. Sending again aborts the request
already in flight. The abort controller lives outside the store because it is
not serialisable.

---

## Files changed

### `src/components/URLbar.tsx`

Method and URL moved from `useState` into the store, so they are part of the
request and survive a tab switch. Send is now wired to the store's `send`, and
Enter in the URL field sends too. While a request is in flight the button
becomes Cancel.

### `src/components/Response.tsx`

Rewritten to render real data. Shows status code and text, duration, size, a
Pretty/Raw toggle for JSON bodies, and a collapsible headers table. Shows a
"Request not sent" alert when the draft was invalid, and "Request failed" when
the network or proxy failed. The fake headers and fake welcome JSON are gone.

### `src/components/FileExp.tsx`

Was reading a hard-coded constant. Now a real tree:

- create request / create folder, at the root or inside any folder
- rename inline (type, Enter to save, Escape to cancel)
- delete, with the whole subtree
- requests are `NavLink`s, so the open one is highlighted and the URL is
  `/req/:id`
- kept the existing keyboard tree navigation

### `src/components/PageList.tsx`

Was a hard-coded array of five fake tabs, including `'QUERY'`, which is not an
HTTP method. Now driven by `openIds`, reading each tab's name and method from
the tree. Tab keys are node ids instead of array indexes, so closing a middle
tab no longer mis-associates the rest.

### `src/components/Client.tsx`

Opens the tab when the URL has an id (so a bookmarked `/req/:id` works),
redirects to `/` when the id is stale, and redirects `/` to the active request
so the URL and the open tab always agree.

### `src/App.tsx`

`/req/:id` now renders the real `Client` instead of a placeholder div with a
typo. Added a catch-all route so an unknown URL redirects home instead of
showing a blank page.

### `src/MainContainer.tsx`

Now passes `toggleFileExp` (a callback) instead of the raw state setter, and
closes the sidebar on Escape.

### `src/context/Keyvalue.ts`

Added `freshDraft()` and `repairDraft()`. Types now come from the zod schemas
instead of being declared twice. `repairDraft` fills in fields missing from
older saved data, so an old `localStorage` entry does not break the app.

### `src/components/Auth.tsx`, `Body.tsx`, `Request.tsx`, `KeyValueList.tsx`

Migrated from `useRequestStore` to `useDraft` / `useDraftActions`. Auth and
Body now take their mode lists from the zod files so the arrays cannot drift
out of sync with the unions. Badges count only rows that have a key.

### `src/components/Dropdown.tsx`

Fixed a real bug: option ids were built as `` `${menuId}-${option.value}` ``,
and `'API Key'` contains a space. That is an invalid HTML id and it broke
`aria-activedescendant`. Ids are now sanitised. Also guarded `step()`, `Home`
and `End` against an empty option list.

### `src/components/NavBar.tsx`

Fixed a duplicate DOM id: both the sidebar toggle button and the sidebar itself
used `id="files"`. The button is now `file-exp-toggle` and the sidebar is
`file-explorer`. Takes a `toggleFileExp` callback now.

### `src/components/Body.tsx` — bug fixes

- Alt/Meta+Tab and Ctrl/Cmd+Enter were being swallowed by the JSON editor and
  turned into spaces. They are now left alone.
- The editor auto-closed `'` and `()` in a JSON-only field, which produces
  invalid JSON. Only `{`, `[` and `"` are paired now.
- Removing a file did not clear the file input, so picking the _same_ file
  again fired no change event and looked like a dead button.

### `src/index.css`

- `--font-normal` shadowed Tailwind's own `font-normal` weight utility. Renamed
  to `--font-body`.
- Removed the unused `--color-lblue` token.
- Added a base layer that paints the dark background on `html`/`body`, so there
  is no white flash on load or overscroll.

### `tsconfig.json`

Added `baseUrl`/`paths` so the `@/` alias resolves for editors and for the
`bun` check script, not just for `tsc -b`.

### `package.json`

Added `check` — runs the sanity script. See below.

### `.env` / `.env.example` / `.gitignore`

`VITE_REVERSE_PROXY_URL` (empty by default) and `VITE_DEFAULT_TARGET_URL`.
`.gitignore` now keeps `.env.example` while still ignoring real `.env` files.

### `scripts/check.ts`

36 assertions over the pure logic: request building, auth headers, param
filtering, invalid-URL and invalid-JSON rejection, row helpers, tree
editing, status bucketing and response normalisation. Run with `bun run check`.
No test runner is installed in this project, so it is a plain script.

---

## How to use it

```bash
bun install
bun run check     # 36 assertions, no browser needed
bun run lint
bun run build
bun run dev
```

### Direct mode (works right now, no backend)

`VITE_REVERSE_PROXY_URL` is empty, so requests go straight to the target URL.
A new request starts on `https://jsonplaceholder.typicode.com/todos/1`, which
allows cross-origin requests. Press Send and you get a real response.

### Proxy mode (point it at your server)

```
VITE_REVERSE_PROXY_URL=https://your-proxy.example.com
```

Then `api.ts` sends:

```http
POST https://your-proxy.example.com
Content-Type: application/json

{
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/todos/1",
  "bodyMode": "None",
  "headers": {},
  "params": {},
  "body": null,
  "contentType": null
}
```

Your proxy reads that body and replays the request. Whatever it sends back —
status, headers, body — is what the Response pane renders. Point
`toApiResponse` at your proxy's response envelope if it wraps the result
differently; that is the single place to adapt.

---

## Still not done

- **The reverse proxy itself.** This pass is the frontend half. Your server
  takes the JSON above and does the actual HTTP call.
- **JWT auth** (todo 8) — skipped at your instruction. The Account button in
  the sidebar is still a stub with no handler.
- **A real database** (todo 9). Persistence is `localStorage`, which is per
  browser. A shared backend and profile pictures need a server.
- **Form-data / URL-encoded body modes.** Only None, Text, JSON and File exist.
- **Binary file upload.** File bodies are read as text, so images and PDFs will
  be corrupted. Needs multipart.
- **Request history, environments and `{{variable}}` interpolation.**
