import React from "react";
import { Icon } from "@iconify/react";

export default function ClockWeather() {
  return (
    <div className="flex flex-col items-start justify-start w-full gap-4 h-fit">
      <div className="flex flex-col items-start justify-start w-full gap-1 px-5 py-4 border-2 border-[#ECECEC] rounded-xl">
        <p className="text-xl font-semibold">
          9:41:40 <span className="text-sm">AM</span>
        </p>
        <p>Monday, 23 October 2023</p>
      </div>
      <div className="flex flex-row items-center justify-between w-full px-5 py-4 border-2 border-[#ECECEC] rounded-xl">
        <div className="flex flex-col items-start justify-center gap-1.5">
          <div className="flex flex-row items-center justify-start gap-2.5">
            <Icon
              icon="material-symbols:cloudy"
              width={24}
              height={24}
              className="text-[#367AF2]"
            />
            <p className="text-xl font-semibold">Cloudy</p>
          </div>
          <p>Surabaya, East Java</p>
        </div>
        <p className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] bg-clip-text text-transparent text-3xl font-bold">
          26°C
        </p>
      </div>
    </div>
  );
}
