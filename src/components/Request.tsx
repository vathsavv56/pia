import { useState } from "react"
import ParamsSection from "@/components/ParamsSection";
import Headers from "@/components/Headers";
import Auth from "@/components/Auth";
import Body from "@/components/Body";


type Tab = "Params" | "Headers" | "Auth" | "Body";

const tabArr: Tab[] = [
  "Params",
  "Headers",
  "Auth",
  "Body"
]



const Request = () => {


  const renderTab = (tab: Tab) => {
    switch (tab) {
      case "Params":
        return <ParamsSection />;

      case "Headers":
        return <Headers />;

      case "Auth":
        return <Auth />;

      case "Body":
        return <Body />;

      default:
        return null;
    }
  };

  const [currTab, setCurrTab] = useState<Tab>("Params");


  return (
    <div className="w-[50%] h-full rounded-md bg-dgray overflow-auto">
      <div className="w-fit h-10 mt-5 flex items-center justify-around text-white gap-2">
        {tabArr.map((item, index) => (
          <p
            key={index}
            className={`w-fit h-fit px-2 py-1  text-sm hover:cursor-pointer  rounded-md ${currTab === item ? "bg-white/10" : ""}`}
            onClick={() => setCurrTab(item)}
          >{item}
          </p>
        ))}
      </div>

      <div className="">
        {renderTab(currTab)}
      </div>

    </div>
  )

}








export default Request;