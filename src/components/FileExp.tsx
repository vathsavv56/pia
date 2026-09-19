const FileExp = ({ fileExpIsOpen }: { fileExpIsOpen: boolean }) => {
  return (
    <div
      id="files"
      className={`bg-dgray border-r-lgray h-full min-w-[15%] border-r ${fileExpIsOpen ? 'block' : 'hidden'}`}
    ></div>
  )
}

export default FileExp
