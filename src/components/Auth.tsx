import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  EyeClosedIcon,
  EyeIcon,
  Key01Icon,
  LockIcon,
  Ticket01Icon,
  UserAccountIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/utils/cn'
import Dropdown from '@/components/Dropdown'
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
  'focus:outline-none rounded-md px-2 py-2 focus:ring-1 focus:ring-blue-500 placeholder:text-white/55 hover:cursor-default bg-transparent'

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
      aria-label={placeholder}
      spellCheck={false}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      className={cn(
        inputStyles,
        'w-full px-0 py-1.5 text-base hover:cursor-text focus:ring-0 sm:text-sm',
        mono ? 'font-mono' : '',
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

  return (
    <div className="flex h-full w-full flex-col text-white">
      <div className="min-h-0 flex-1 scrollbar-none overflow-y-auto overscroll-contain p-1 pb-2">
        {auth.type === 'None' && (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-white/55 select-none">
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
            <p className="px-1 font-mono text-xs text-white/55">
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
        <Dropdown
          label="Authentication type"
          value={auth.type}
          options={authTypeArr.map((item) => ({
            value: item,
            label: item,
            icon: authIcon[item],
          }))}
          onSelect={(item) => setAuth(freshAuth(item))}
          icon={authIcon[auth.type]}
        />

        {auth.type === 'API Key' ? (
          <div
            role="group"
            aria-label="API key location"
            className="flex shrink-0 items-center gap-0.5 rounded-md bg-white/5 p-0.5"
          >
            {apiKeyLocationArr.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={auth.location === item}
                className={cn(
                  'rounded px-2 py-1 font-mono text-xs text-white/60 hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
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
            <span className="truncate font-mono text-xs text-white/50">
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
