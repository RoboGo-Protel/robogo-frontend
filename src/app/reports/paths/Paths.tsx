"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Select, { StylesConfig } from "react-select";
import PathsTable from "@/components/PathsTable";
import TunnelPath from "@/components/cards/TunnelPathCard";
import { Icon } from "@iconify/react/dist/iconify.js";

const listDates = [
  "2025-03-24",
  "2025-03-25",
  "2025-03-26",
  "2025-03-27",
  "2025-03-28",
  "2025-11-24",
];

interface OptionType {
  value: string;
  label: string;
}

const pathData = [
  {
    id: 1,
    x: 0.5,
    y: 0.5,
    timestamp: "09:41:25",
    speed: 1.25,
    heading: 45,
    status: "Start",
    isEndpoint: false,
  },
  {
    id: 2,
    x: 2.5,
    y: 1,
    timestamp: "09:42:25",
    speed: 2.5,
    heading: 90,
    status: "Moving",
    imageUrl:
      "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    isEndpoint: false,
  },
  {
    id: 3,
    x: 5,
    y: 3.5,
    timestamp: "09:43:25",
    speed: 0,
    heading: 135,
    status: "Moving",
    imageUrl:
      "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    isEndpoint: false,
  },
  {
    id: 4,
    x: 7.5,
    y: 4,
    timestamp: "09:44:25",
    speed: 1.5,
    heading: 180,
    status: "Moving",
    imageUrl:
      "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    isEndpoint: false,
  },
  {
    id: 5,
    x: 9,
    y: 5,
    timestamp: "09:45:25",
    speed: 0,
    heading: 225,
    status: "Stop",
    isEndpoint: true,
  },
];

export default function IMU() {
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const reports = document.querySelector("#reports-navbar");
    const top = document.querySelector("#top-navbar");
    const bottom = document.querySelector("#bottom-navbar");

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    if (reports) setReportsNavbarHeight(reports.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      if (reports) setReportsNavbarHeight(reports.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [topNavbarHeight, bottomNavbarHeight, reportsNavbarHeight]);

  const options: OptionType[] = listDates.map((date) => ({
    value: date,
    label: formatDate(date),
  }));

  const customStyles: StylesConfig<OptionType, false> = {
    container: (provided) => ({
      ...provided,
      width: "full",
      minWidth: 140,
    }),
    control: (provided) => ({
      ...provided,
      height: 48,
      minHeight: 48,
      border: "none",
      borderRadius: "1rem",
      background: "linear-gradient(to bottom right, #3BD5FF, #367AF2)",
      boxShadow: "none",
      paddingLeft: "16px",
      paddingRight: "16px",

      overflow: "visible",
      whiteSpace: "nowrap",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
      fontSize: "1rem",
      overflow: "visible",
      whiteSpace: "nowrap",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "white",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  return (
    <div
      className={clsx(
        "flex flex-row gap-4 p-5 transition-colors duration-300 bg-white text-black"
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      <div className="flex flex-col gap-4 w-full h-full">
        <TunnelPath showStartpoint showEndpoint pathData={pathData} />
        <div className="flex flex-row gap-4 w-full h-full">
          <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl text-white">
            <Icon icon="mdi:map-legend" width={24} height={24} />
            <p>Legends</p>
          </div>
          <div className="flex flex-row gap-4 justify-between w-full px-4 py-2 rounded-xl border-2 border-[#DCDCDC]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-gradient-to-br from-[#FF623B] to-[#CD2323] rounded-full p-1.5 my-1 shadow">
                <Icon
                  icon="mynaui:danger-triangle-solid"
                  className="text-white"
                  width={18}
                  height={18}
                />
              </div>
              <p className="bg-gradient-to-br from-[#FF623B] to-[#CD2323] text-transparent bg-clip-text font-medium">
                Obstacle
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center">
                <div className="rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800] flex items-center justify-center" />
              </div>
              <p className="bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-transparent bg-clip-text font-medium">
                Startpoint
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full w-8 h-8 bg-gradient-to-br from-[#FF9799]/30 to-[#EB0C0F]/30 flex items-center justify-center">
                <div className="rounded-full w-5 h-5 bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] flex items-center justify-center" />
              </div>
              <p className="bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-transparent bg-clip-text font-medium">
                Endpoint
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-full" />
              <p className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text font-medium">
                RoboGo Path
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full gap-4 items-stretch">
        <Select
          options={options}
          styles={customStyles}
          defaultValue={options[0]}
          isSearchable={false}
        />
        <PathsTable pathData={pathData} />
      </div>
    </div>
  );
}
