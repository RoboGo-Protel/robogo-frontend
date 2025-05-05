"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Select, { StylesConfig } from "react-select";
import PathsTable from "@/components/PathsTable";
import TunnelPath from "@/components/cards/TunnelPathCard";
import { Icon } from "@iconify/react/dist/iconify.js";
import { PulseLoader } from "react-spinners";

interface OptionType {
  value: string;
  label: string;
}

interface Position {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
}

export default function IMU() {
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<PathData[]>([]);

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

  useEffect(() => {
    const fetchDatesWithSessions = async () => {
      try {
        const response = await fetch("/api/reports/paths/dates-with-sessions");
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

    fetchDatesWithSessions();
  }, []);

  useEffect(() => {
    const fetchFilteredReports = async () => {
      if (!selectedDate || !selectedSession) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/reports/paths/date/${selectedDate.value}/session/${selectedSession.value}`
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

  return (
    <div
      className={clsx(
        "flex flex-row gap-4 p-5 transition-colors duration-300 bg-white text-black w-full"
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {isLoading ? (
        <div
          className="flex flex-col justify-center items-center w-full"
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
            Loading path reports, please wait...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div
          className="flex flex-col justify-center items-center w-full p-4 border-2 border-gray-300 rounded-xl"
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
            No path reports available. Please check back later.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 w-full h-full">
            <TunnelPath showStartpoint showEndpoint pathData={reports} />
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
            <div className="flex flex-row gap-4 w-full">
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
            <PathsTable reports={reports} />
          </div>
        </>
      )}
    </div>
  );
}
