"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import UltrasonicSensorTable from "@/components/UltrasonicSensorTable";
import { PulseLoader } from "react-spinners";
import { Icon } from "@iconify/react/dist/iconify.js";

interface OptionType {
  value: string;
  label: string;
}

interface Metadata {
  ultrasonic: number;
  heading: number;
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
  const [dateWithSessions, setDateWithSessions] = useState<
    { value: string; label: string; sessions: OptionType[] }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<OptionType | null>(null);
  const [selectedSession, setSelectedSession] = useState<OptionType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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
    const fetchSummaries = async () => {
      try {
        const response = await fetch("/api/reports/ultrasonic/summaries");
        const data = await response.json();

        setSummaries({
          totalImages: data.data.totalImages,
          totalObstacles: data.data.totalObstacles,
          closestDistance: data.data.closestDistance,
          averageDistance: data.data.averageDistance,
        });
      } catch (error) {
        console.error("Error fetching summaries:", error);
      }
    };

    const fetchDatesWithSessions = async () => {
      try {
        const response = await fetch(
          "/api/reports/ultrasonic/dates-with-sessions"
        );
        const result = await response.json();

        const data = result.data;
        setDateWithSessions(data);

        if (data.length > 0) {
          const defaultDate = data[0];
          setSelectedDate({
            value: defaultDate.value,
            label: defaultDate.label,
          });

          if (defaultDate.sessions.length > 0) {
            setSelectedSession(defaultDate.sessions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching dates with sessions:", error);
      }
    };

    fetchSummaries();
    fetchDatesWithSessions();
  }, []);

  useEffect(() => {
    const fetchFilteredReports = async () => {
      if (!selectedDate || !selectedSession) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/reports/ultrasonic/date/${selectedDate.value}/session/${selectedSession.value}`
        );
        const result = await response.json();
        setReports(result.data || []);
      } catch (error) {
        console.error("Error fetching filtered reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredReports();
  }, [selectedDate, selectedSession]);

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
        "flex flex-col gap-4 p-4 md:p-5 transition-colors duration-300 bg-white text-black"
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {isLoading ? (
        <div
          className="flex flex-col justify-center items-center text-center"
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <PulseLoader
            color="#367AF2"
            loading={isLoading}
            size={15}
            margin={5}
          />
          <p className="mt-4 text-lg text-gray-500">
            Loading ultrasonic reports, please wait...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center w-full p-4 border-2 border-gray-300 rounded-xl text-center"
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <Icon
            icon="tabler:photo-off"
            width={48}
            height={48}
            className="text-gray-400"
          />
          <p className="mt-4 text-lg text-gray-500">
            No ultrasonic reports available. Please check back later.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="flex-1 flex flex-col">
              <ShortSummary
                summaryItems={summaryItems}
                layout="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-stretch"
              />
            </div>

            <div className="flex flex-row gap-4 items-stretch md:items-center">
              <Select
                options={dateWithSessions.map((d) => ({
                  value: d.value,
                  label: d.label,
                }))}
                styles={customStyles}
                value={selectedDate}
                onChange={(option) => {
                  setSelectedDate(option);
                  const selected = dateWithSessions.find(
                    (d) => d.value === option?.value
                  );
                  if (selected?.sessions.length) {
                    setSelectedSession(selected.sessions[0]);
                  } else {
                    setSelectedSession(null);
                  }
                }}
                isSearchable={false}
                className="flex-1"
              />
              <Select
                options={
                  selectedDate
                    ? dateWithSessions.find(
                        (d) => d.value === selectedDate.value
                      )?.sessions || []
                    : []
                }
                styles={customStyles}
                value={selectedSession}
                onChange={setSelectedSession}
                isSearchable={false}
                isDisabled={!selectedDate}
                className="flex-1"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <UltrasonicSensorTable reports={reports} />
          </div>
        </>
      )}
    </div>
  );
}
