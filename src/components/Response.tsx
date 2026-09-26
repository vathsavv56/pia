import JsonView from '@uiw/react-json-view'
import { githubDarkTheme } from '@uiw/react-json-view/githubDark'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'

interface ResponseProps {
  jsonData?: string | object
}

interface HeadersListProps {
  headersList?: string | object
}

const HeadersList = ({ headersList }: HeadersListProps) => {
  const [toggle, setToggle] = useState<boolean>(false)

  const fakeHeaders = {
    'X-Powered-By': 'My hunger to learn',
    'X-Mood': 'Happy as always',
    'Content-Type': 'application/vathsavv56 ',
    'Cache-Control': "no-cache, because I don't remember anything ",
  }

  // Use provided headers or fallback to fake ones
  let displayHeaders: Record<string, any> = fakeHeaders
  if (headersList) {
    try {
      displayHeaders =
        typeof headersList === 'string' ? JSON.parse(headersList) : headersList
    } catch (e: unknown) {
      displayHeaders = {
        Error: e instanceof Error ? e.message : 'Invalid headers format',
      }
    }
  }

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
            className={`text-white/60 transition-transform duration-300 ${toggle ? 'rotate-0' : '-rotate-90'}`}
          />
        </span>
        <span className="text-sm font-medium select-none">Headers</span>
      </button>

      {toggle && (
        <div className="bg-lgray mr-2 ml-8 rounded-md border border-white/5 p-3">
          <table className="w-full table-fixed text-left font-mono text-xs sm:text-sm">
            <tbody>
              {Object.entries(displayHeaders).map(([key, value]) => (
                <tr
                  key={key}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
                >
                  <td className="w-[30%] py-1.5 pr-4 align-top font-medium break-all text-blue-500">
                    {key}
                  </td>
                  <td className="py-1.5 align-top break-all text-green-500">
                    {String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const Response = ({
  jsonData = {
    status: 200,
    message: 'Welcome to pia! 🚀',
    developer: 'vathsavv56',
    github: 'https://github.com/vathsavv56/pia',
    funFact:
      'The first computer bug was an actual real-life moth found in a relay in 1947. 🐛',
  },
}: ResponseProps) => {
  let parsedData = jsonData
  if (typeof jsonData === 'string') {
    try {
      parsedData = jsonData ? JSON.parse(jsonData) : {}
    } catch {
      parsedData = { data: jsonData }
    }
  }

  return (
    <section
      aria-label="Response"
      className="bg-lgray flex min-h-[18rem] w-full flex-col overflow-y-auto rounded-md p-3 sm:p-5 lg:h-full lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:shrink-0"
    >
      <HeadersList />
      <div className="min-w-0" aria-live="polite">
        <JsonView
          value={parsedData as object}
          style={{
            ...githubDarkTheme,
            backgroundColor: 'transparent',
            fontSize: '14px',
            lineHeight: '2',
          }}
        />
      </div>
    </section>
  )
}

export default Response
