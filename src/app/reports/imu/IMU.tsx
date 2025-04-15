"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import IMUTable from "@/components/IMUTable";

const summaryItems = [
  {
    icon: "lets-icons:compass-north",
    title: "Average Heading",
    summary: "118° SE",
  },
  {
    icon: "ph:compass-rose-fill",
    title: "Heading Range",
    summary: "95° - 145°",
  },
  {
    icon: "uil:rotate-360",
    title: "Total Orientation Changes",
    summary: "5 Times",
  },
  {
    icon: "material-symbols:u-turn-right-rounded",
    title: "Max Turn Angle",
    summary: "48°",
  },
] as const;

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
      width: "auto",
      minWidth: 140,
    }),
    control: (provided) => ({
      ...provided,
      height: 64,
      minHeight: 64,
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
        "flex flex-col gap-4 p-5 transition-colors duration-300 bg-white text-black"
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      <div className="flex w-full gap-4 items-stretch">
        <div className="flex-1 flex flex-col">
          <ShortSummary
            summaryItems={summaryItems}
            layout="grid grid-cols-4 gap-4"
          />
        </div>

        <div className="flex items-center">
          <Select
            options={options}
            styles={customStyles}
            defaultValue={options[0]}
            isSearchable={false}
          />
        </div>
      </div>
      <IMUTable />
    </div>
  );
}
