import React from "react";
import { Icon } from "@iconify/react";

interface InfoItem {
  icon: string;
  status: "ON" | "OFF";
  title: string;
}

interface ShortInfoProps {
  infoItems: readonly InfoItem[];
}

const ShortInfo: React.FC<ShortInfoProps> = ({ infoItems }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-fit">
      {infoItems.map((item, index) => {
        const isActive = item.status === "ON";

        return (
          <div
            key={index}
            className={`flex flex-row items-center justify-start w-full gap-3 p-3 border-2 rounded-2xl 
              ${
                isActive
                  ? "border-[#3BD5FF]/20 bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10"
                  : "border-gray-300 bg-gray-100"
              } h-fit`}
          >
            <div
              className={`p-2 rounded-xl shadow-md 
              ${
                isActive
                  ? "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]"
                  : "bg-gray-300"
              }`}
            >
              <Icon
                icon={item.icon}
                width={24}
                height={24}
                className={isActive ? "text-white" : "text-gray-500"}
              />
            </div>
            <div className="flex flex-col items-start justify-start w-full">
              <p
                className={`text-base font-semibold ${
                  isActive ? "text-black" : "text-gray-500"
                }`}
              >
                {item.status}
              </p>
              <p className="text-xs opacity-40">{item.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShortInfo;
