import JsonView from '@uiw/react-json-view'
import { githubDarkTheme } from '@uiw/react-json-view/githubDark'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ClockIcon,
} from '@hugeicons/core-free-icons'
import { useEffect, useMemo, useState } from 'react'
import { useResponseStore } from '@/context/responseStore'
import type { ApiResponse } from '@/types/response.type'
import type { StatusKind } from '@/types/response.type'
import { cn } from '@/utils/cn'

/** Status buckets map straight onto a colour, so no giant switch in the JSX. */
const statusColor: Record<StatusKind, string> = {
  success: 'text-green-400',
  redirect: 'text-cyan-400',
  clientError: 'text-amber-400',
  serverError: 'text-red-400',
}

/** The pane keeps the same box at every state; only its contents change. */
const paneStyles =
  'bg-lgray flex min-h-[16rem] w-full flex-col overflow-y-auto overscroll-contain rounded-md p-2 sm:min-h-[18rem] sm:p-4 lg:h-full lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:shrink-0 lg:p-5'

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* -------------------------------------------------------------------------- */
/*                         Body-type auto detection                           */
/* -------------------------------------------------------------------------- */

type DisplayKind = 'json' | 'xml' | 'html' | 'text' | 'image' | 'empty'

const KIND_LABEL: Record<DisplayKind, string> = {
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  text: 'Text',
  image: 'Image',
  empty: 'Empty',
}

const headerContentType = (response: ApiResponse): string => {
  if (response.contentType) return response.contentType
  for (const [key, value] of Object.entries(response.headers)) {
    if (key.toLowerCase() === 'content-type') return value.split(';')[0]?.trim().toLowerCase() ?? ''
  }
  return ''
}

/** Sniffs text bodies so old `text` results (or lying servers) still land in the right viewer. */
const sniffText = (raw: string, contentType: string): DisplayKind => {
  const trimmed = raw.trim()
  if (trimmed === '') return 'empty'
  const ct = contentType.toLowerCase()

  if (
    ct.includes('json') ||
    ct.endsWith('+json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[')
  ) {
    try {
      JSON.parse(raw)
      return 'json'
    } catch {
      // Not actually JSON — keep sniffing.
    }
  }
  if (
    ct.includes('html') ||
    /^\s*<!doctype\s+html/i.test(raw) ||
    /^\s*<html[\s>]/i.test(raw)
  ) {
    return 'html'
  }
  if (
    ct.includes('xml') ||
    ct.endsWith('+xml') ||
    ct.includes('svg') ||
    /^\s*<\?xml/i.test(raw) ||
    (/^\s*<[a-zA-Z][^>]*>/.test(trimmed) && /<\/[^>]+>\s*$/.test(trimmed))
  ) {
    return 'xml'
  }
  if (ct.startsWith('image/')) return 'image'
  return 'text'
}

/**
 * The single source of truth for which viewer to show. Trusts the
 * API layer's `payloadKind` for fresh responses, and re-sniffs stale
 * `text` payloads so HTML/XML/JSON mislabelled as text still preview
 * correctly.
 */
const detectDisplayKind = (response: ApiResponse): DisplayKind => {
  if (response.payloadKind === 'text') {
    return sniffText(response.raw, headerContentType(response))
  }
  return response.payloadKind
}

/* -------------------------------------------------------------------------- */
/*                              XML formatting                               */
/* -------------------------------------------------------------------------- */

/** Tiny pretty-printer: one tag per line with 2-space indentation. */
const formatXml = (raw: string): string => {
  const tokens = raw
    .replace(/>\s+</g, '><')
    .match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[^>]+>|[^<]+/g)
  if (!tokens) return raw
  let depth = 0
  const lines: string[] = []
  for (const token of tokens) {
    const t = token.trim()
    if (t === '') continue
    if (/^<\//.test(t)) depth = Math.max(0, depth - 1)
    lines.push(`${'  '.repeat(depth)}${t}`)
    if (/^<[^?!/][^>]*[^/]>$/.test(t) && !/^<[^>]*\/>$/.test(t)) depth += 1
  }
  return lines.join('\n')
}

/** Splits markup into coloured spans: tags blue, attr names amber, text plain. */
const highlightMarkup = (code: string, keyPrefix: string) => {
  const parts = code.match(
    /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[a-zA-Z][^>]*?>|[^<]+/g,
  )
  if (!parts) return code
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (!part.startsWith('<')) {
      return (
        <span key={key} className="text-white/80">
          {part}
        </span>
      )
    }
    if (part.startsWith('<!--') || part.startsWith('<?')) {
      return (
        <span key={key} className="text-white/35 italic">
          {part}
        </span>
      )
    }
    const tagMatch = part.match(/^(<\/?)([a-zA-Z0-9:._-]+)([\s\S]*?)(\/?>)$/)
    if (!tagMatch) {
      return (
        <span key={key} className="text-sky-300">
          {part}
        </span>
      )
    }
    const [, open, name, attrs, close] = tagMatch
    return (
      <span key={key}>
        <span className="text-sky-300">{open}</span>
        <span className="font-semibold text-sky-200">{name}</span>
        <span className="text-amber-200/90">{attrs}</span>
        <span className="text-sky-300">{close}</span>
      </span>
    )
  })
}

/* -------------------------------------------------------------------------- */
/*                              Small components                              */
/* -------------------------------------------------------------------------- */

interface HeadersTableProps {
  headers: Record<string, string>
}

const HeadersTable = ({ headers }: HeadersTableProps) => {
  const entries = Object.entries(headers)

  if (entries.length === 0) {
    return <p className="text-sm text-white/50">No headers came back.</p>
  }

  return (
    <table className="w-full table-fixed text-left font-mono text-xs sm:text-sm">
      <tbody>
        {entries.map(([key, value]) => (
          <tr
            key={key}
            className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
          >
            <td className="w-[30%] py-1.5 pr-4 align-top font-medium break-all text-blue-500">
              {key}
            </td>
            <td className="py-1.5 align-top break-all text-green-500">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface DisclosureProps {
  label: string
  children: React.ReactNode
}

const Disclosure = ({ label, children }: DisclosureProps) => {
  const [toggle, setToggle] = useState<boolean>(false)

  return (
    <div className="mb-4">
      <button
        type="button"
        aria-expanded={toggle}
        className="mb-2 flex items-center gap-2 text-white/80 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
        onClick={() => setToggle((prev) => !prev)}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-white/10">
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden
            className={cn(
              'text-white/60 transition-transform duration-300',
              toggle ? 'rotate-0' : '-rotate-90',
            )}
          />
        </span>
        <span className="text-sm font-medium select-none">{label}</span>
      </button>

      {toggle && (
        <div className="bg-lgray mr-2 ml-6 rounded-md border border-white/5 p-3 sm:ml-8">
          {children}
        </div>
      )}
    </div>
  )
}

const Empty = () => (
  <p className="text-sm text-white/50">
    Send a request and the response shows up here.
  </p>
)

const RawPre = ({ text }: { text: string }) => (
  <pre className="font-mono text-xs break-all whitespace-pre-wrap text-white/80 sm:text-sm">
    {text}
  </pre>
)

/** Monospace block with line numbers, used for text / xml / html code views. */
const NumberedCode = ({
  code,
  highlightKey,
}: {
  code: string
  highlightKey?: string
}) => {
  const lines = useMemo(() => code.split('\n'), [code])
  return (
    <pre className="overflow-x-auto font-mono text-xs leading-6 text-white/80 sm:text-sm">
      <code>
        {lines.map((line, idx) => (
          <span key={idx} className="flex">
            <span className="w-10 shrink-0 pr-3 text-right text-white/25 select-none">
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1 break-all whitespace-pre-wrap">
              {highlightKey ? highlightMarkup(line, `${highlightKey}-${idx}`) : line}
            </span>
          </span>
        ))}
      </code>
    </pre>
  )
}

type ViewMode = 'pretty' | 'raw' | 'preview' | 'code'

const VIEW_TABS: Record<DisplayKind, ViewMode[]> = {
  json: ['pretty', 'raw'],
  xml: ['pretty', 'raw'],
  text: ['pretty', 'raw'],
  html: ['preview', 'code', 'raw'],
  image: [],
  empty: [],
}

const DEFAULT_VIEW: Record<DisplayKind, ViewMode> = {
  json: 'pretty',
  xml: 'pretty',
  text: 'pretty',
  html: 'preview',
  image: 'pretty',
  empty: 'pretty',
}

const Response = () => {
  const result = useResponseStore((s) => s.result)
  const isLoading = useResponseStore((s) => s.isLoading)
  const [view, setView] = useState<ViewMode>('pretty')
  const [copied, setCopied] = useState(false)

  const response: ApiResponse | null =
    result && result.ok ? result.response : null
  const kind: DisplayKind = useMemo(
    () => (response ? detectDisplayKind(response) : 'empty'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [response?.timestamp, response?.raw, response?.payloadKind],
  )
  const contentType = response ? headerContentType(response) : ''

  // Reset the viewer whenever a new response arrives, so e.g. an HTML
  // preview tab doesn't linger after the next request returns JSON.
  useEffect(() => {
    setView(DEFAULT_VIEW[kind])
    setCopied(false)
  }, [response?.timestamp, kind])

  if (isLoading) {
    return (
      <section aria-label="Response" aria-busy="true" className={paneStyles}>
        <p role="status" className="text-sm text-white/60">
          Sending request...
        </p>
      </section>
    )
  }

  if (!result) {
    return (
      <section aria-label="Response" className={paneStyles}>
        <Empty />
      </section>
    )
  }

  if (!result.ok) {
    return (
      <section aria-label="Response" className={paneStyles}>
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3"
        >
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-red-400"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-300">
              {result.error.stage === 'build'
                ? 'Request not sent'
                : 'Request failed'}
            </p>
            <p className="mt-1 text-sm break-words text-white/70">
              {result.error.message}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!response) {
    return (
      <section aria-label="Response" className={paneStyles}>
        <Empty />
      </section>
    )
  }

  const tabs = VIEW_TABS[kind]
  const activeView = tabs.includes(view) ? view : DEFAULT_VIEW[kind]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const renderBody = () => {
    switch (kind) {
      case 'empty':
        return <p className="text-sm text-white/50">Empty body.</p>

      case 'image': {
        const src = response.dataUrl
        if (!src) {
          return (
            <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Image response ({contentType || 'unknown type'}). Preview is
              only available for freshly sent requests — resend to load the
              image bytes.
            </div>
          )
        }
        return (
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Response (${contentType})`}
              className="max-h-96 w-auto max-w-full rounded-md border border-white/10 bg-white object-contain"
            />
            <p className="mt-2 font-mono text-xs text-white/40">
              {contentType} · {formatSize(response.sizeBytes)}
            </p>
          </div>
        )
      }

      case 'json':
        if (activeView === 'raw' || response.data == null) {
          return <RawPre text={response.raw} />
        }
        return (
          <JsonView
            value={response.data as object}
            style={{
              ...githubDarkTheme,
              backgroundColor: 'transparent',
              fontSize: '14px',
              lineHeight: '2',
            }}
          />
        )

      case 'xml': {
        const formatted = formatXml(response.raw)
        return activeView === 'raw' ? (
          <RawPre text={response.raw} />
        ) : (
          <NumberedCode code={formatted} highlightKey="xml" />
        )
      }

      case 'html':
        if (activeView === 'raw') return <RawPre text={response.raw} />
        if (activeView === 'code')
          return <NumberedCode code={response.raw} highlightKey="html" />
        return (
          <div className="min-w-0">
            <iframe
              title="HTML preview"
              sandbox=""
              srcDoc={response.raw}
              className="h-80 w-full rounded-md border border-white/10 bg-white"
            />
            <p className="mt-2 text-xs text-white/40">
              Sandboxed preview — scripts and same-origin access are blocked.
            </p>
          </div>
        )

      case 'text':
      default:
        return activeView === 'raw' ? (
          <RawPre text={response.raw} />
        ) : (
          <NumberedCode code={response.raw} />
        )
    }
  }

  return (
    <section
      aria-label="Response"
      className="bg-lgray flex min-h-[16rem] w-full flex-col overflow-y-auto overscroll-contain rounded-md p-2 sm:min-h-[18rem] sm:p-4 lg:h-full lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:shrink-0 lg:p-5"
    >
      {/* Status line */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={cn(
            'font-mono text-lg font-medium',
            statusColor[response.kind],
          )}
        >
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 text-xs text-white/55">
          <HugeiconsIcon icon={ClockIcon} size={13} aria-hidden />
          {response.durationMs} ms
        </span>
        <span className="text-xs text-white/55">
          {formatSize(response.sizeBytes)}
        </span>
        <span
          title={contentType || 'unknown content type'}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70"
        >
          {KIND_LABEL[kind]}
        </span>
        {kind !== 'empty' && (
          <div className="ml-auto flex items-center gap-1">
            {tabs.map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={activeView === mode}
                className={cn(
                  'rounded-md px-2 py-1 text-xs capitalize transition-colors',
                  'focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
                  activeView === mode
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white',
                )}
                onClick={() => setView(mode)}
              >
                {mode}
              </button>
            ))}
            {kind !== 'image' && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md px-2 py-1 text-xs text-white/50 transition-colors hover:text-white focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>

      <Disclosure label={`Headers (${Object.keys(response.headers).length})`}>
        <HeadersTable headers={response.headers} />
      </Disclosure>

      <div className="min-w-0" aria-live="polite">
        {renderBody()}
      </div>
    </section>
  )
}
export default Response
