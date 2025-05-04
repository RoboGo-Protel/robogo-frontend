import React from "react";
import { Icon } from "@iconify/react";
import { logsItems } from "@/utils/logs";
import { useTheme } from "@/context/ThemeContext";
import ThreeDView from "@/components/cards/3DViewCard";
import LogsCard from "@/components/cards/LogsCard";

export default function LeftArea_Monitoring() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-start justify-start min-w-[450px] max-w-none gap-4 h-full">
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

      <LogsCard logsItems={logsItems} />
      <ThreeDView />
    </div>
  );
}
