"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import UltrasonicSensorTable from "@/components/UltrasonicSensorTable";
import { SyncLoader } from "react-spinners";

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

interface Metadata {
  ultrasonic: number | string;
  heading: number | string;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
}

interface Ultrasonic {
  id: string;
  timestamp: string;
  sessionId: number;
  distance: number;
  alertLevel: "High" | "Medium" | "Safe";
  imageId: string;
  createdAt: string;
  metadata: Metadata;
}

export default function Ultrasonic() {
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<Ultrasonic[]>([]);
  const [summaries, setSummaries] = useState({
    totalImages: 0,
    totalObstacles: 0,
    closestDistance: 0,
    averageDistance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchReportsList = async () => {
      try {
        const response = await fetch("/api/ultrasonic");
        const data = await response.json();
        setReports(data.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching reports list:", error);
        setIsLoading(false);
      }
    };
    const fetchSummaries = async () => {
      try {
        const response = await fetch("/api/ultrasonic/summaries");
        const data = await response.json();

        setSummaries({
          totalImages: data.data.totalImages,
          totalObstacles: data.data.totalObstacles,
          closestDistance: data.data.closestDistance,
          averageDistance: data.data.averageDistance,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching summaries:", error);
        setIsLoading(false);
      }
    };

    fetchReportsList();
    fetchSummaries();
  }, []);

  const summaryItems = [
    {
      icon: "fluent:image-sparkle-24-filled",
      title: "Total Images Collected",
      summary: `${summaries.totalImages} Images`,
    },
    {
      icon: "fluent:scan-object-20-filled",
      title: "Total Obstacles Detected",
      summary: `${summaries.totalObstacles} Obstacles`,
    },
    {
      icon: "subway:close-corner-arrow-2",
      title: "Closest Distance",
      summary: `${summaries.closestDistance} cm`,
    },
    {
      icon: "ri:pin-distance-fill",
      title: "Average Distance",
      summary: `${summaries.averageDistance} cm`,
    },
  ];

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
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-[400px]">
          <SyncLoader
            color="#367AF2"
            loading={isLoading}
            size={15}
            margin={5}
          />
          <p className="mt-4 text-lg text-gray-500">
            Loading ultrasonic logs, please wait...
          </p>
        </div>
      ) : (
        <>
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
          <UltrasonicSensorTable reports={reports} />
        </>
      )}
    </div>
  );
}
