import { useEffect, useId, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { UnfoldMoreDownIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/utils/cn'

export type DropdownOption<T extends string> = {
  value: T
  label: string
  icon?: IconSvgElement
  className?: string
}

type DropdownProps<T extends string> = {
  label: string
  value: T
  options: DropdownOption<T>[]
  onSelect: (value: T) => void
  icon?: IconSvgElement
  placement?: 'top' | 'bottom'
  triggerClassName?: string
  menuClassName?: string
  optionClassName?: string
  renderOption?: (option: DropdownOption<T>) => React.ReactNode
}

const Dropdown = <T extends string>({
  label,
  value,
  options,
  onSelect,
  icon,
  placement = 'top',
  triggerClassName,
  menuClassName,
  optionClassName,
  renderOption,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeValue, setActiveValue] = useState<T>(value)

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const menuId = useId()

  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    menuRef.current?.focus()
  }, [isOpen])

  const open = () => {
    setActiveValue(value)
    setIsOpen(true)
  }

  const step = (delta: number) => {
    const current = options.findIndex((option) => option.value === activeValue)
    const next = (current + delta + options.length) % options.length
    setActiveValue(options[next].value)
  }

  const commit = (next: T) => {
    onSelect(next)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        step(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        step(-1)
        break
      case 'Home':
        e.preventDefault()
        setActiveValue(options[0].value)
        break
      case 'End':
        e.preventDefault()
        setActiveValue(options[options.length - 1].value)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeValue)
        break
      case 'Tab':
        setIsOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className={cn(
          'flex h-8 items-center gap-1 rounded-md px-2 font-mono text-sm text-white hover:bg-white/7 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none',
          triggerClassName,
        )}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
      >
        {icon && <HugeiconsIcon icon={icon} size={13} />}
        <span>{selected?.label ?? value}</span>
        <HugeiconsIcon icon={UnfoldMoreDownIcon} size={14} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${menuId}-${activeValue}`}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'bg-lgray absolute left-0 z-50 w-32 scrollbar-none rounded-xl border border-white/10 p-1 shadow-md focus:outline-none',
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            menuClassName,
          )}
        >
          {options.map((option) => (
            <div
              key={option.value}
              id={`${menuId}-${option.value}`}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveValue(option.value)}
              onClick={() => commit(option.value)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-sm text-white hover:bg-white/10',
                option.value === activeValue && 'bg-white/10',
                option.className,
                optionClassName,
              )}
            >
              {renderOption ? (
                renderOption(option)
              ) : (
                <>
                  {option.icon && (
                    <HugeiconsIcon
                      icon={option.icon}
                      size={13}
                      className="text-white/60"
                    />
                  )}
                  <span>{option.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
