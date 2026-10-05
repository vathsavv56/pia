import JsonView from '@uiw/react-json-view'
import { githubDarkTheme } from '@uiw/react-json-view/githubDark'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ClockIcon,
} from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { useResponseStore } from '@/context/responseStore'
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

const Response = () => {
  const result = useResponseStore((s) => s.result)
  const isLoading = useResponseStore((s) => s.isLoading)
  const [view, setView] = useState<'pretty' | 'raw'>('pretty')

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

  const { response } = result
  const showPretty =
    view === 'pretty' && response.payloadKind === 'json' && response.data

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
        {response.payloadKind !== 'empty' && (
          <div className="ml-auto flex gap-1">
            {(['pretty', 'raw'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                disabled={response.payloadKind !== 'json'}
                className={cn(
                  'rounded-md px-2 py-1 text-xs capitalize transition-colors',
                  'focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
                  view === mode
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white',
                  response.payloadKind !== 'json' &&
                    'cursor-not-allowed opacity-40 hover:text-white/50',
                )}
                onClick={() => setView(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      <Disclosure label={`Headers (${Object.keys(response.headers).length})`}>
        <HeadersTable headers={response.headers} />
      </Disclosure>

      <div className="min-w-0" aria-live="polite">
        {response.payloadKind === 'empty' ? (
          <p className="text-sm text-white/50">Empty body.</p>
        ) : showPretty ? (
          <JsonView
            value={response.data as object}
            style={{
              ...githubDarkTheme,
              backgroundColor: 'transparent',
              fontSize: '14px',
              lineHeight: '2',
            }}
          />
        ) : (
          <pre className="font-mono text-xs break-all whitespace-pre-wrap text-white/80 sm:text-sm">
            {response.raw}
          </pre>
        )}
      </div>
    </section>
  )
}
export default Response
