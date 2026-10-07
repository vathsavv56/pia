# Pia — Request Flow (UI → Reverse Proxy)

How a request travels from the moment the app boots until it leaves the
browser for the reverse proxy. Each step names the file where it happens.

```
Boot:  main.tsx → App.tsx → MainContainer.tsx → Client.tsx
                                    ↳ warmup.ts (proxy wake-up ping)

Edit:  URLbar / Request tabs ──► requestStore ──► collectionStore (draft lives in tree node)

Send:  URLbar "Send" ──► responseStore.send()
                          ├─► buildRequest.ts  (draft → SerializedRequest)
                          └─► api.ts: sendSerializedRequest()
                                ├─► proxy mode:  POST PROXY_URL  ◄── YOU ARE HERE
                                └─► direct mode: request to target URL
```

---

## 1. Boot — `src/main.tsx` → `src/App.tsx`

- `main.tsx` mounts `<App />` into `#root` (React `StrictMode`).
- `App.tsx` builds a `createBrowserRouter` with one layout route:
  - `/` → `MainContainer`, children: index → `Client`, `req/:id` → `Client`.
  - `*` → redirect to `/`.

## 2. Shell + proxy warmup — `src/MainContainer.tsx`, `src/api/warmup.ts`

- `MainContainer` renders the app frame: `NavBar` (top) + `FileExp` (sidebar)
  + `<Outlet />` (the `Client` page for the current route).
- On mount it calls `warmupProxy()` (`src/api/warmup.ts`): a fire-and-forget
  `GET {PROXY_URL}/health` with retries at 0s / 5s / 15s. Render's free tier
  sleeps when idle, so this wakes the proxy before the user hits Send.
  Only runs when `VITE_REVERSE_PROXY_URL` is set (see `src/config.ts`:
  `PROXY_URL`, `IS_PROXY_MODE`, `DEFAULT_TARGET_URL`, `REQUEST_TIMEOUT_MS`).

## 3. Page + routing — `src/components/Client.tsx`

- Reads `:id` from the URL, finds that node in the collection tree
  (`findNode` in `src/utils/tree.ts`).
- Deep link `/req/:id` → opens that request as a tab (`openTab`).
- Keeps URL ↔ active request in sync (`/req/{activeId}`), then renders:
  `PageList` (tabs) + `UrlBar` on top, `Request` (editor) + `Response`
  (result pane) below.

## 4. Where the draft lives — collection tree + request stores

This is the part that confuses everyone, so read it twice:

- `src/types/collection.type.ts` — a `FileNode` is either a folder
  (`child: FileNode[]`) or a request (`draft: RequestDraft`).
- `src/context/collectionStore.ts` — the **single source of truth** (zustand +
  `persist` to localStorage key `pia-collection`). Holds `nodes` (the tree),
  `openIds` (tab order), `activeId` (what you're editing). Every edit goes
  through `editActive()`, which maps over the tree and patches only the
  active request's draft. First run seeds `My Collection/Request-1`
  (`startCollection`); reloads reconcile saved data (`reconcile.ts`,
  `toPersisted` strips un-persistable `File` bodies).
- `src/types/request.type.ts` — the `RequestDraft` shape: `method`, `url`,
  `params`/`headers` (arrays of `{id, isIncluded, keyP, value}` rows),
  `auth` (`None | Basic | Bearer | API Key`), `body`
  (`None | Text | JSON | File`).
- `src/context/Keyvalue.ts` — `freshDraft()` (GET + `DEFAULT_TARGET_URL` +
  one blank param/header row), `newRow()`, `withTrailingBlank()` (the grid
  always keeps one empty row to type into), `repairDraft()` (fills missing
  fields when loading old saves).
- `src/context/requestStore.ts` — a thin lens over the collection store:
  `useDraft(selector)` reads one slice of the **active** draft
  (e.g. `useDraft(d => d.params)`), `useActiveDraft()` grabs the whole thing
  (only the sender needs this), `useDraftActions()` exposes
  `setMethod/setUrl/setAuth/setBody/updateRow/toggleRow/removeRow/clearList`.

## 5. Editing the request — `URLbar.tsx`, `Request.tsx` + tabs

- `src/components/URLbar.tsx` — method `Dropdown` (colour-coded per verb) +
  URL `<input>` + Send/Cancel button. Both bound to the active draft via
  `useDraft`/`useDraftActions`. `Enter` in the URL field sends.
  `handleSend = () => void send(draft)` — the draft snapshot is passed out;
  editing components never touch the network.
- `src/components/Request.tsx` — tab shell (`Params | Headers | Auth |
  Body`, keyboard-navigable, with filled-row count badges).
  - `ParamsSection.tsx` / `Headers.tsx` → `KeyValueList.tsx` (the
    checkbox + key + value grid driven by `updateRow/toggleRow/removeRow`).
  - `Auth.tsx` — None / Basic / Bearer / API Key forms → `setAuth`.
  - `Body.tsx` — None / Text / JSON (with auto-pair, tab indent,
    live valid/invalid indicator) / File picker → `setBody`.
- Sidebar/tabs: `FileExp.tsx` (folder/request tree), `PageList.tsx` (open
  tabs), `NavBar.tsx`, `Dropdown.tsx` — all read/write `collectionStore`
  only. They decide *which* draft is active, never what it contains.

## 6. Send — `src/context/responseStore.ts` (`send`)

`UrlBar`'s Send button calls `send(draft)` with the full draft snapshot:

1. Aborts any in-flight request (`inFlight: AbortController`), creates a new
   controller, records `startedAt`, sets `{ isLoading: true, result: null }`.
2. `await buildRequest(draft)` (`src/utils/buildRequest.ts`):
   - Trims + validates the URL (`http(s)` only, else `RequestBuildError`
     with stage `'build'` — "Request not sent").
   - Keeps only ticked rows with non-empty keys (`includedRows`,
     `rowsToRecord` — later rows win on duplicate keys).
   - `readBody()` resolves Text → raw text, JSON → validated JSON string
     (+ `Content-Type`), File → `file.text()` (+ file MIME); throws
     `RequestBuildError` on invalid JSON.
   - `authHeader()` builds `Basic base64(user:pass)` / `Bearer …`; API Key
     goes to header or query param. Explicit headers win over generated ones.
   - Returns the flat `SerializedRequest`: `{ method, url, bodyMode,
     headers, params, body, contentType }` — the wire contract.
3. `await sendSerializedRequest(request, signal)` (see §7). If the signal was
   aborted mid-flight, the result is silently dropped.
4. Success → `toApiResponse(axiosRes, startedAt)` stored as
   `{ ok: true, response }`; failure → `toResponseError(thrown)` stored as
   `{ ok: false, error: { message, stage, status } }` where stage is
   `'build' | 'network' | 'proxy'`. Never rejects — the UI just reads
   `result`/`isLoading` (rendered by `Response.tsx`).

## 7. The wire — `src/api/api.ts` (ends at the reverse proxy)

- `client` — one shared axios instance: 30s timeout, `validateStatus: () =>
  true` (a 404/500 is data to display, not an exception).
- `sendSerializedRequest(request, signal)` — the fork:
  - **Proxy mode** (`IS_PROXY_MODE`, i.e. `VITE_REVERSE_PROXY_URL` is set):
    `sendViaProxy` → **`client.post(PROXY_URL, request, { signal,
    responseType: 'arraybuffer', transformResponse: [identity] })`**.
    The whole serialized request goes as the POST body; the proxy replays it
    against the real API and returns the upstream status/headers/body
    transparently (plus its own `x-proxy-final-url` header, which becomes
    `response.url`). **The request leaves the browser here.**
  - **Direct mode** (no proxy URL): `sendDirect` → `client.request({ method,
    url, params, headers, data: body, signal, ...same buffer config })`
    straight at the target (needs the API to allow CORS).
- `responseType: 'arraybuffer'` + identity transform is deliberate: axios
  never parses, so binary bodies (images) survive; `toApiResponse` decodes
  with `TextDecoder`, sniffs the kind (`readPayload`: content-type first,
  then JSON → HTML → XML → text, images via `image/*` → base64 `data:` URL),
  flattens headers (array values joined), and records
  `sizeBytes = bytes.byteLength` and `durationMs` from `startedAt`.
- Types for all of this live in `src/types/response.type.ts`
  (`statusKind`, `payloadKind`, `responseSchema`, `sendResultSchema` —
  a discriminated union, so `if (result.ok)` is exhaustive).

## 8. After the response lands (for orientation, not part of this flow)

- `Response.tsx` re-sniffs stale `text` payloads (`detectDisplayKind`), picks
  a viewer per kind (JSON tree, formatted XML, sandboxed HTML `<iframe>`,
  line-numbered text, `<img>`), shows status/size/timing/type badge, headers
  in a `Disclosure`, and pretty/raw (or preview/code/raw) tabs.
- `scripts/check.ts` (`bun run check`) covers this pipeline: URL building,
  header joining, `toApiResponse` payload detection, and zod validation.

## Cheat sheet — "where do I change X?"

| Want to… | File |
|---|---|
| Change where requests go / timeouts | `src/config.ts` (+ `.env`) |
| Change how the draft becomes a request | `src/utils/buildRequest.ts` |
| Change proxy vs direct sending | `src/api/api.ts` (`sendViaProxy` / `sendDirect`) |
| Change body-type detection | `src/api/api.ts` (`readPayload`), `src/components/Response.tsx` (`detectDisplayKind`) |
| Change response rendering | `src/components/Response.tsx` |
| Change draft shape / auth / body modes | `src/types/request.type.ts`, `src/context/Keyvalue.ts` |
| Change persistence / tree behaviour | `src/context/collectionStore.ts`, `src/context/reconcile.ts`, `src/utils/tree.ts` |
| Wake-up ping for the proxy | `src/api/warmup.ts` |
