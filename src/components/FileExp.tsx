import { ArrowDown01Icon, Folder01Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";


type File = {
  id: string;
  name: string;
  isFolder: boolean;
  child?: File[];
};

const fakeFileArr: File[] = [
  {
    id: "1",
    name: "my-vite-app",
    isFolder: true,
    child: [
      {
        id: "2",
        name: "node_modules",
        isFolder: true,
        child: [],
      },

      {
        id: "3",
        name: "public",
        isFolder: true,
        child: [
          {
            id: "4",
            name: "vite.svg",
            isFolder: false,
          },
        ],
      },

      {
        id: "5",
        name: "src",
        isFolder: true,
        child: [
          {
            id: "6",
            name: "assets",
            isFolder: true,
            child: [
              {
                id: "7",
                name: "react.svg",
                isFolder: false,
              },
            ],
          },

          {
            id: "8",
            name: "App.css",
            isFolder: false,
          },

          {
            id: "9",
            name: "App.tsx",
            isFolder: false,
          },

          {
            id: "10",
            name: "index.css",
            isFolder: false,
          },

          {
            id: "11",
            name: "main.tsx",
            isFolder: false,
          },
        ],
      },

      {
        id: "12",
        name: ".gitignore",
        isFolder: false,
      },

      {
        id: "13",
        name: "eslint.config.js",
        isFolder: false,
      },

      {
        id: "14",
        name: "index.html",
        isFolder: false,
      },

      {
        id: "15",
        name: "package.json",
        isFolder: false,
      },

      {
        id: "16",
        name: "tsconfig.app.json",
        isFolder: false,
      },

      {
        id: "17",
        name: "tsconfig.json",
        isFolder: false,
      },

      {
        id: "18",
        name: "tsconfig.node.json",
        isFolder: false,
      },

      {
        id: "19",
        name: "vite.config.ts",
        isFolder: false,
      },
    ],
  },
];




const Node = ({ file, depth }: { file: File; depth: number }) => {
  const [expand, setExpand] = useState(false);

  return (
    <div className="w-full">
      <div
        className="w-full text-sm flex items-center py-1 hover:bg-white/10 cursor-pointer select-none text-gray-300 hover:text-white transition-colors"
        style={{ paddingLeft: `${depth * 12 + 12}px`, paddingRight: '12px' }}
        onClick={() => {
          if (file.isFolder) setExpand((p) => !p);
        }}
      >
        {file.isFolder ? (
          <>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              className={`mr-1 transition-transform duration-200 ${
                expand ? "rotate-0" : "-rotate-90"
              }`}
            />
            <HugeiconsIcon
              icon={Folder01Icon}
              size={16}
              className="mr-2 text-blue-400"
            />
          </>
        ) : (
          <>
            <div className="w-3.5 mr-1 shrink-0" />
            <HugeiconsIcon
              icon={File02Icon}
              size={16}
              className="mr-2 text-gray-400"
            />
          </>
        )}
        <span className="truncate">{file.name}</span>
      </div>

      {file.isFolder && file.child && expand && (
        <FileView list={file.child} depth={depth + 1} />
      )}
    </div>
  );
};

const FileView = ({ list, depth = 0 }: { list: File[]; depth?: number }) => {
  return (
    <div className="w-full flex flex-col">
      {list.map((item) => (
        <Node key={item.id} file={item} depth={depth} />
      ))}
    </div>
  );
};


const FileExp = ({ fileExpIsOpen }: { fileExpIsOpen: boolean }) => {
  return (
    <div
      id="files"
      className={`bg-dgray border-r-lgray h-full min-w-[15%] border-r text-white py-2 overflow-y-auto ${fileExpIsOpen ? 'block' : 'hidden'}`}>
      <FileView list={fakeFileArr} />
    </div>
  )
}

export default FileExp
