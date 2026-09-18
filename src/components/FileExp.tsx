
const FileExp = ({fileExpIsOpen} : {fileExpIsOpen : boolean}) => {
  return (
    <div id="files"
      className={`min-w-[15%] h-full bg-dgray border-r border-r-lgray ${fileExpIsOpen ? "block" : "hidden"}`}
    >

    </div>
  )
}

export default FileExp