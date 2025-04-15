import React from "react";
import { Icon } from "@iconify/react";
import { logsItems } from "@/utils/logs";
import ClockWeather from "./ClockWeather";
import { useTheme } from "@/context/ThemeContext";

export default function LeftArea_Home() {
  const { theme } = useTheme();
  const convertTimestampToTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return date.toLocaleTimeString("en-US", options);
  };

  return (
    <div className="flex flex-col items-start justify-start min-w-[450px] max-w-[450px] gap-4 h-full">
      <ClockWeather />
      <div
        className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 ${
          theme === "dark" ? "" : "border-[#ECECEC]"
        } rounded-xl`}
      >
        <div className="flex flex-row items-center justify-start w-full gap-2">
          <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
            <Icon
              icon="mage:image-fill"
              width={20}
              height={20}
              className="text-white"
            />
          </div>
          <p className="font-semibold text-base">Images</p>
        </div>
        <div className="flex flex-wrap items-center justify-start w-full gap-3 mt-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex flex-row items-center justify-start gap-3 mt-2"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-[#E6E6E6] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div
        className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 ${
          theme === "dark" ? "" : "border-[#ECECEC]"
        } rounded-xl flex-1 overflow-hidden`}
      >
        <div className="flex flex-row items-center justify-start w-full gap-2">
          <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
            <Icon
              icon="fluent:data-usage-32-filled"
              width={20}
              height={20}
              className="text-white"
            />
          </div>
          <p className="font-semibold text-base">Logs</p>
        </div>

        <div className="flex flex-col items-start justify-start w-full gap-2 mt-3 overflow-y-auto pr-2">
          {logsItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-row items-center justify-start gap-2"
            >
              <p className="text-sm font-semibold text-[#979797]">
                [{convertTimestampToTime(item.timestamp)}]{" "}
                <span className="font-normal text-black">{item.message}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
