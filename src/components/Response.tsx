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
    } catch (e) {
      displayHeaders = { Error: 'Invalid headers format' }
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex size-6 items-center justify-center rounded-md hover:cursor-pointer hover:bg-white/10"
          onClick={() => setToggle((prev) => !prev)}
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={`text-white/60 transition-transform duration-300 ${toggle ? 'rotate-0' : '-rotate-90'}`}
          />
        </div>
        <span
          className="cursor-pointer text-sm font-medium text-white/80 select-none"
          onClick={() => setToggle((prev) => !prev)}
        >
          Headers
        </span>
      </div>

      {toggle && (
        <div className="mr-2 ml-8 rounded-md border border-white/5 bg-[#0d1117]/50 p-3">
          <table className="w-full text-left font-mono text-sm">
            <tbody>
              {Object.entries(displayHeaders).map(([key, value]) => (
                <tr
                  key={key}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
                >
                  <td className="w-[30%] py-1.5 pr-4 align-top font-medium whitespace-nowrap text-blue-500">
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
    } catch (e) {
      parsedData = { data: jsonData }
    }
  }

  return (
    <div className="bg-lgray h-full w-[50%] overflow-auto rounded-md p-5">
      <HeadersList />
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
  )
}

export default Response
