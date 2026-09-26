import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  EyeClosedIcon,
  EyeIcon,
  Key01Icon,
  LockIcon,
  Ticket01Icon,
  UnfoldMoreDownIcon,
  UserAccountIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/utils/cn'
import { useRequestStore, freshAuth } from '@/context/requestStore'
import type { AuthType, ApiKeyLocation } from '@/context/requestStore'

const authTypeArr: AuthType[] = ['None', 'Basic', 'Bearer', 'API Key']
const apiKeyLocationArr: ApiKeyLocation[] = ['Header', 'Query Param']

const authIcon: Record<AuthType, IconSvgElement> = {
  None: Cancel01Icon,
  Basic: UserAccountIcon,
  Bearer: Ticket01Icon,
  'API Key': Key01Icon,
}

const inputStyles =
  'focus:outline-none rounded-md px-2 py-2 focus:ring-1 focus:ring-blue-500 placeholder:text-white/40 hover:cursor-default bg-transparent'

interface FieldProps {
  icon: IconSvgElement
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: 'text' | 'password'
  mono?: boolean
  className?: string
  endAdornment?: React.ReactNode
}

const Field = ({
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono = false,
  className,
  endAdornment,
}: FieldProps) => (
  <div className="flex w-full items-center gap-2 rounded-md bg-white/5 px-2 focus-within:ring-1 focus-within:ring-blue-500">
    <HugeiconsIcon icon={icon} size={15} className="shrink-0 text-white/40" />

    <input
      type={type}
      value={value}
      spellCheck={false}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      className={cn(
        inputStyles,
        'w-full px-0 py-1.5 hover:cursor-text focus:ring-0',
        mono ? 'font-mono text-sm' : 'text-sm',
        className,
      )}
    />

    {endAdornment}
  </div>
)

const Auth = () => {
  const auth = useRequestStore((s) => s.auth)
  const setAuth = useRequestStore((s) => s.setAuth)
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
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

  return (
    <div className="flex h-full w-full flex-col text-white">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none p-1">
        {auth.type === 'None' && (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-white/30 select-none">
              This request does not use authentication
            </p>
          </div>
        )}

        {auth.type === 'Basic' && (
          <div className="flex h-full w-full flex-col justify-start gap-2">
            <Field
              icon={UserAccountIcon}
              value={auth.username}
              onChange={(username) => setAuth({ ...auth, username })}
              placeholder="Username"
              className="text-emerald-500"
            />
            <Field
              icon={LockIcon}
              value={auth.password}
              onChange={(password) => setAuth({ ...auth, password })}
              placeholder="Password"
              type={isPasswordVisible ? 'text' : 'password'}
              className="text-yellow-500"
              endAdornment={
                <button
                  type="button"
                  aria-label={
                    isPasswordVisible ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm text-white/40 hover:text-white"
                >
                  <HugeiconsIcon
                    icon={isPasswordVisible ? EyeIcon : EyeClosedIcon}
                    size={14}
                  />
                </button>
              }
            />
          </div>
        )}

        {auth.type === 'Bearer' && (
          <div className="flex h-full w-full flex-col justify-start gap-2">
            <Field
              icon={Ticket01Icon}
              value={auth.token}
              onChange={(token) => setAuth({ ...auth, token })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
              mono
              className="text-blue-500"
            />
            <p className="px-1 font-mono text-xs text-white/30">
              Sent as an Authorization: Bearer header
            </p>
          </div>
        )}

        {auth.type === 'API Key' && (
          <div className="flex h-full w-full flex-col justify-start gap-2">
            <Field
              icon={Key01Icon}
              value={auth.key}
              onChange={(key) => setAuth({ ...auth, key })}
              placeholder="Key"
              mono
              className="text-emerald-500"
            />
            <Field
              icon={Key01Icon}
              value={auth.value}
              onChange={(value) => setAuth({ ...auth, value })}
              placeholder="Value"
              mono
              className="text-yellow-500"
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-t border-white/5 px-2 py-1.5">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="flex h-8 items-center gap-1 rounded-md px-2 font-mono text-sm text-white hover:bg-white/7"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <HugeiconsIcon icon={authIcon[auth.type]} size={13} />
            <span>{auth.type}</span>
            <HugeiconsIcon icon={UnfoldMoreDownIcon} size={14} />
          </button>

          {isOpen && (
            <div
              role="listbox"
              className="bg-lgray absolute bottom-full left-0 z-50 mb-1 w-32 rounded-xl border border-white/10 p-1 shadow-md"
            >
              {authTypeArr.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={auth.type === item}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-sm text-white hover:bg-white/10',
                    auth.type === item && 'bg-white/10',
                  )}
                  onClick={() => {
                    setAuth(freshAuth(item))
                    setIsOpen(false)
                  }}
                >
                  <HugeiconsIcon
                    icon={authIcon[item]}
                    size={13}
                    className="text-white/60"
                  />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {auth.type === 'API Key' ? (
          <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-white/5 p-0.5">
            {apiKeyLocationArr.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={auth.location === item}
                className={cn(
                  'rounded px-2 py-1 font-mono text-xs text-white/50 hover:bg-white/5',
                  auth.location === item && 'bg-white/10 text-white',
                )}
                onClick={() => setAuth({ ...auth, location: item })}
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          auth.type !== 'None' && (
            <span className="truncate font-mono text-xs text-white/30">
              {auth.type === 'Basic'
                ? 'Sent as an Authorization: Basic header'
                : auth.type === 'Bearer' && auth.token.trim() !== ''
                  ? 'Authorization: Bearer ****'
                  : 'Authorization: Bearer'}
            </span>
          )
        )}
      </div>
    </div>
  )
}

export default Auth
