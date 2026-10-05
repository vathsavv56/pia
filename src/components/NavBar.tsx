import { cn } from '@/utils/cn'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Folder01Icon,
  HelpCircleIcon,
  UserSquareIcon,
} from '@hugeicons/core-free-icons'
import LOGO from '@/assets/logo-favicon.svg'
interface NavBarProps {
  toggleFileExp: () => void
}

const NavBar = ({ toggleFileExp }: NavBarProps) => {
  return (
    <nav
      id="left-nav"
      className={cn(
        'border-lgray flex h-full w-11 shrink-0 flex-col items-center justify-between border-r p-1 sm:w-14 sm:p-2 lg:w-16',
      )}
    >
      <div
        id="nav-top"
        className="flex w-full flex-col items-center gap-2 pt-3 sm:pt-4"
      >
        <div
          id="logo"
          className={cn('flex size-8 items-center justify-center sm:size-10')}
        >
          <img src={LOGO} alt="logo" className="w-6 sm:w-8" />
        </div>

        <button
          type="button"
          id="file-exp-toggle"
          aria-label="Toggle file explorer"
          className={cn(
            'flex size-8 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none sm:size-10',
          )}
          onClick={toggleFileExp}
        >
          <HugeiconsIcon
            icon={Folder01Icon}
            className="size-5 text-white sm:size-6"
          />
        </button>
      </div>

      <div
        id="nav-bottom"
        className="flex w-full flex-col items-center gap-2 pb-3 sm:pb-4"
      >
        <button
          type="button"
          id="help"
          aria-label="Help"
          className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none sm:size-10"
        >
          <HugeiconsIcon
            icon={HelpCircleIcon}
            className="size-5 text-white sm:size-6"
          />
        </button>
        <button
          type="button"
          id="account"
          aria-label="Account"
          className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none sm:size-10"
        >
          <HugeiconsIcon
            icon={UserSquareIcon}
            className="size-5 text-white sm:size-6"
          />
        </button>
      </div>
    </nav>
  )
}

export default NavBar
