import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";



interface ResponseProps {
  jsonData?: string | object;
}


interface HeadersListProps {
  headersList ?: string | object,
}



const HeadersList = ({
  headersList
}:HeadersListProps)=>{

  const [toggle , setToggle] = useState<boolean>(false);

  const fakeHeaders = {
    "X-Powered-By": "My hunger to learn",
    "X-Mood": "Happy as always",
    "Content-Type": "application/vathsavv56 ",
    "Cache-Control": "no-cache, because I don't remember anything "
  };

  // Use provided headers or fallback to fake ones
  let displayHeaders: Record<string, any> = fakeHeaders;
  if (headersList) {
    try {
      displayHeaders = typeof headersList === 'string' ? JSON.parse(headersList) : headersList;
    } catch (e) {
      displayHeaders = { "Error": "Invalid headers format" };
    }
  }

  return(
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-6 rounded-md flex items-center justify-center hover:cursor-pointer hover:bg-white/10 " onClick={()=> setToggle(prev => !prev)} >
          <HugeiconsIcon icon={ArrowDown01Icon} className={`text-white/60 transition-transform duration-300 ${toggle ? "rotate-0" : "-rotate-90"}`} />
        </div>
        <span className="text-white/80 font-medium text-sm select-none cursor-pointer" onClick={()=> setToggle(prev => !prev)}>Headers</span>
      </div>
      
      {toggle && 
        <div className="ml-8 mr-2 bg-[#0d1117]/50 rounded-md p-3 border border-white/5">
          <table className="w-full text-left text-sm font-mono">
            <tbody>
              {Object.entries(displayHeaders).map(([key, value]) => (
                <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-1.5 pr-4 text-blue-500 font-medium whitespace-nowrap w-[30%] align-top">{key}</td>
                  <td className="py-1.5 text-green-500 break-all align-top">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  )
}









const Response = ({
  jsonData = {
    status: 200,
    message: "Welcome to pia! 🚀",
    developer: "vathsavv56",
    github: "https://github.com/vathsavv56/pia",
    funFact: "The first computer bug was an actual real-life moth found in a relay in 1947. 🐛"
  }



}: ResponseProps) => {
  let parsedData = jsonData;
  if (typeof jsonData === 'string') {
    try {
      parsedData = jsonData ? JSON.parse(jsonData) : {};
    } catch (e) {
      parsedData = { data: jsonData };
    }
  }

  return (
    <div className="w-[50%] h-full bg-lgray rounded-md overflow-auto p-5  ">
      <HeadersList/>
      <JsonView 
        value={parsedData as object} 
        style={{ 
          ...githubDarkTheme, 
          backgroundColor: "transparent",
          fontSize: "14px",
          lineHeight: "2"
        }} 
      />
    </div>
  )
}

export default Response;