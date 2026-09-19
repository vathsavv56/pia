import { cn } from '@/utils/cn'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Folder01Icon,
  HelpCircleIcon,
  UserRoundCheckIcon,
  UserSquareIcon,
} from '@hugeicons/core-free-icons'
import LOGO from '@/assets/logo-favicon.svg'
interface NavBarProps {
  setIsFileExpOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const NavBar = ({ setIsFileExpOpen }: NavBarProps) => {
  return (
    <nav
      id="left-nav"
      className={cn(
        'border-lgray flex h-full w-[2.5%] flex-col items-center justify-between border p-2',
      )}
    >
      <div
        id="one"
        className="flex h-20 w-full flex-col items-center justify-around gap-2"
      >
        <div
          id="logo"
          className={cn('flex size-10 items-center justify-center')}
        >
          <img src={LOGO} alt="logo" className="w-8" />
        </div>

        <div
          id="files"
          className={cn(
            'flex size-10 items-center justify-center rounded-lg hover:bg-white/10',
          )}
          onClick={() => setIsFileExpOpen((prev) => !prev)}
        >
          <HugeiconsIcon icon={Folder01Icon} className="size-6 text-white" />
        </div>
      </div>

      <div
        id="two"
        className="flex h-20 w-full flex-col items-center justify-around gap-2"
      >
        <div id="logo" className="flex size-10 items-center justify-center">
          <HugeiconsIcon icon={HelpCircleIcon} fill="white" />
        </div>
        <div id="files" className="flex size-10 items-center justify-center">
          <HugeiconsIcon icon={UserSquareIcon} className="text-white" />
        </div>
      </div>
    </nav>
  )
}

export default NavBar
