
import { cn } from "@/utils/cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, HelpCircleIcon, UserRoundCheckIcon, UserSquareIcon } from "@hugeicons/core-free-icons";
import LOGO from "@/assets/logo-favicon.svg"
interface NavBarProps {
    setIsFileExpOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavBar = ({
    setIsFileExpOpen
}: NavBarProps) => {

    return (
        <nav id="left-nav"
            className={
                cn("h-full w-[2.5%]  border border-lgray p-2 flex flex-col items-center justify-between")
            }
        >

            <div id="one" className="w-full h-20  flex flex-col items-center justify-around gap-2">
                <div id="logo" className={cn(
                    "size-10  flex items-center justify-center",
                )}>
                    <img src={LOGO} alt="logo" className="w-8" />
                </div>

                <div
                    id="files"
                    className={cn(
                        "flex size-10 items-center justify-center rounded-lg hover:bg-white/10"
                    )}
                    onClick={() => setIsFileExpOpen(prev => !prev)}
                >
                    <HugeiconsIcon
                        icon={Folder01Icon}
                        className="size-6 text-white"
                    />
                </div>


            </div>



            <div id="two" className=" w-full h-20 flex flex-col items-center justify-around gap-2">
                <div id="logo" className="size-10 flex items-center justify-center">
                    <HugeiconsIcon icon={HelpCircleIcon} fill="white" />
                </div>
                <div id="files" className="size-10 flex items-center justify-center">
                    <HugeiconsIcon icon={UserSquareIcon} className="text-white" />
                </div>
            </div>

        </nav>

    )
}

export default NavBar