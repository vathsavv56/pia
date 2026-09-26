import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleIcon,
  BracesIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  TextIcon,
  UnfoldMoreDownIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/utils/cn'
import { useRequestStore, freshBody } from '@/context/requestStore'
import type { BodyMode } from '@/context/requestStore'

const bodyModeArr: BodyMode[] = ['None', 'Text', 'JSON', 'File']

const modeIcon: Record<BodyMode, IconSvgElement> = {
  None: Cancel01Icon,
  Text: TextIcon,
  JSON: BracesIcon,
  File: File01Icon,
}

const inputStyles =
  'focus:outline-none rounded-md px-2 py-2 focus:ring-1 focus:ring-blue-500 placeholder:text-white/40 hover:cursor-default bg-transparent'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const unit = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(unit))
  return `${(bytes / unit ** i).toFixed(i === 0 ? 0 : 1)} ${['B', 'KB', 'MB', 'GB'][i]}`
}

type Edit = { value: string; start: number; end: number }

const pairs: Record<string, string> = {
  '{': '}',
  '[': ']',
  '(': ')',
  '"': '"',
  "'": "'",
}

const closers = new Set(['}', ']', ')', '"', "'"])

const jsonKeyEdit = (
  key: string,
  value: string,
  start: number,
  end: number,
): Edit | null => {
  const hasSelection = start !== end

  if (key === 'Tab') {
    return {
      value: value.slice(0, start) + '  ' + value.slice(end),
      start: start + 2,
      end: start + 2,
    }
  }

  if (key === 'Enter') {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const indent = (/^[ \t]*/.exec(value.slice(lineStart, start)) ?? [''])[0]
    const line = value.slice(lineStart, start).trimEnd()
    const added = indent
    let skip = end
    while (skip < value.length && (value[skip] === ' ' || value[skip] === '\t'))
      skip++

    if (/[{[(]$/.test(line)) {
      const inner = added + '  '
      return {
        value:
          value.slice(0, start) +
          '\n' +
          inner +
          '\n' +
          added +
          value.slice(skip),
        start: start + 1 + inner.length,
        end: start + 1 + inner.length,
      }
    }

    return {
      value: value.slice(0, start) + '\n' + added + value.slice(skip),
      start: start + 1 + added.length,
      end: start + 1 + added.length,
    }
  }

  if (!hasSelection && closers.has(key) && value.charAt(start) === key) {
    return { value, start: start + 1, end: end + 1 }
  }

  const closing = pairs[key]
  if (!closing) return null

  if (hasSelection) {
    const selected = value.slice(start, end)
    return {
      value:
        value.slice(0, start) + key + selected + closing + value.slice(end),
      start: start + 1,
      end: end + 1,
    }
  }

  if (key === '"' || key === "'") {
    const next = value.charAt(start)
    if (next !== '' && !/[\s[\]{}(),:;]/.test(next)) return null
    if (/[\w$.]/.test(value.charAt(start - 1))) return null
  }

  return {
    value: value.slice(0, start) + key + closing + value.slice(start),
    start: start + 1,
    end: start + 1,
  }
}

const Body = () => {
  const body = useRequestStore((s) => s.body)
  const setBody = useRequestStore((s) => s.setBody)
  const [tabMovesFocus, setTabMovesFocus] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const applyEdit = ({ value, start, end }: Edit) => {
    const el = jsonRef.current
    if (!el) return
    el.value = value
    el.setSelectionRange(start, end)
    if (body.mode === 'JSON') setBody({ ...body, json: value })
  }

  const handleJsonKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setTabMovesFocus(true)
      return
    }
    if (e.key === 'Tab' && tabMovesFocus) {
      setTabMovesFocus(false)
      return
    }

    const el = e.currentTarget
    const edit = jsonKeyEdit(
      e.key,
      el.value,
      el.selectionStart,
      el.selectionEnd,
    )
    if (!edit) return

    e.preventDefault()
    applyEdit(edit)
  }

  const json = body.mode === 'JSON' ? body.json : ''
  const text = body.mode === 'Text' ? body.text : ''
  const file = body.mode === 'File' ? body.file : null

  const isJsonValid = (() => {
    if (json.trim() === '') return true
    try {
      JSON.parse(json)
      return true
    } catch {
      return false
    }
  })()

  const formatJson = () => {
    if (body.mode !== 'JSON') return
    try {
      setBody({ ...body, json: JSON.stringify(JSON.parse(json), null, 2) })
    } catch {
      return
    }
  }

  return (
    <div className="flex h-full w-full flex-col text-white">
      <div className="min-h-0 flex-1 scrollbar-none">
        {body.mode === 'None' && (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-white/30 select-none">
              This request does not send a body
            </p>
          </div>
        )}

        {body.mode === 'Text' && (
          <div className="h-full w-full px-1">
            <textarea
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBody({ ...body, text: e.target.value })
              }
              placeholder="Enter your text body"
              spellCheck={false}
              className={cn(
                inputStyles,
                'h-full w-full resize-none scrollbar-none font-mono text-sm text-white/90',
              )}
            />
          </div>
        )}

        {body.mode === 'JSON' && (
          <div className="h-full w-full px-1">
            <textarea
              ref={jsonRef}
              value={json}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBody({ ...body, json: e.target.value })
              }
              onKeyDown={handleJsonKeyDown}
              onBlur={() => setTabMovesFocus(false)}
              placeholder='{\n  "key": "value"\n}'
              spellCheck={false}
              className={cn(
                inputStyles,
                'h-full w-full resize-none scrollbar-none font-mono text-sm text-emerald-500',
              )}
            />
          </div>
        )}

        {body.mode === 'File' && (
          <div className="flex h-full w-full flex-col px-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setBody({ ...body, file: e.target.files?.[0] ?? null })
              }
            />

            {file === null ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-white/10 text-white/40 hover:border-white/20 hover:bg-white/5 hover:text-white/70"
              >
                <HugeiconsIcon icon={File01Icon} size={24} />
                <span className="text-sm">Select a file to send</span>
              </button>
            ) : (
              <div className="group flex w-full items-center justify-between self-start rounded-md border border-white/10 px-3 py-2 hover:bg-white/5">
                <div className="flex min-w-0 items-center gap-2">
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={16}
                    className="shrink-0 text-blue-500"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-sm text-white/90">
                      {file.name}
                    </span>
                    <span className="font-mono text-xs text-white/40">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setBody({ ...body, file: null })}
                  className="flex size-6 shrink-0 items-center justify-center rounded-sm text-gray-500 transition-all hover:bg-white/10 hover:text-white"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/5 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              className="flex h-8 items-center gap-1 rounded-md px-2 font-mono text-sm text-white hover:bg-white/7"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <HugeiconsIcon icon={modeIcon[body.mode]} size={13} />
              <span>{body.mode}</span>
              <HugeiconsIcon icon={UnfoldMoreDownIcon} size={14} />
            </button>

            {isOpen && (
              <div
                role="listbox"
                className="bg-lgray absolute bottom-full left-0 z-50 mb-1 w-32 rounded-xl border border-white/10 p-1 shadow-md"
              >
                {bodyModeArr.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="option"
                    aria-selected={body.mode === item}
                    className={cn(
                      'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-sm text-white hover:bg-white/10',
                      body.mode === item && 'bg-white/10',
                    )}
                    onClick={() => {
                      setBody(freshBody(item))
                      setIsOpen(false)
                    }}
                  >
                    <HugeiconsIcon
                      icon={modeIcon[item]}
                      size={13}
                      className="text-white/60"
                    />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {tabMovesFocus && (
            <span className="font-mono text-xs text-blue-500">
              Tab moves focus
            </span>
          )}
        </div>

        {body.mode === 'JSON' && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isJsonValid ? 'text-green-500' : 'text-red-500',
              )}
            >
              <HugeiconsIcon
                icon={isJsonValid ? CheckmarkCircle01Icon : AlertCircleIcon}
                size={13}
              />
              <span className="font-mono">
                {json.trim() === ''
                  ? 'Empty'
                  : isJsonValid
                    ? 'Valid JSON'
                    : 'Invalid JSON'}
              </span>
            </div>

            <button
              type="button"
              onClick={formatJson}
              disabled={!isJsonValid || json.trim() === ''}
              className="flex h-7 w-fit items-center gap-1 rounded-md px-2 text-sm text-white/70 hover:cursor-default hover:bg-white/7 disabled:text-white/20 disabled:hover:bg-transparent"
            >
              <HugeiconsIcon icon={BracesIcon} size={13} />
              <span>Format</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Body
