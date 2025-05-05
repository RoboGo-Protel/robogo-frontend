"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import IMUTable from "@/components/IMUTable";
import { PulseLoader } from "react-spinners";
import { Icon } from "@iconify/react/dist/iconify.js";

interface OptionType {
  value: string;
  label: string;
}

interface Acceleration {
  x: number;
  y: number;
  z: number;
}

interface Gyroscope {
  x: number;
  y: number;
  z: number;
}

interface IMULogs {
  id: string;
  timestamp: string;
  sessionId: number;
  acceleration: Acceleration;
  gyroscope: Gyroscope;
  heading: number;
  direction: string;
  status: string;
  createdAt: string;
}

export default function IMU() {
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<IMULogs[]>([]);
  const [summaries, setSummaries] = useState({
    average_heading: 0,
    heading_range: [0, 0],
    total_orientation_changes: 0,
    max_turn_angle: 0,
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
        const response = await fetch("/api/reports/imu/summaries");
        const data = await response.json();

        setSummaries({
          average_heading: data.data.average_heading,
          heading_range: data.data.heading_range,
          total_orientation_changes: data.data.total_orientation_changes,
          max_turn_angle: data.data.max_turn_angle,
        });
      } catch (error) {
        console.error("Error fetching summaries:", error);
      }
    };

    const fetchDatesWithSessions = async () => {
      try {
        const response = await fetch("/api/reports/imu/dates-with-sessions");
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
          `/api/reports/imu/date/${selectedDate.value}/session/${selectedSession.value}`
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

  function getDirectionFromHeading(heading: number): string {
    const directions = [
      "North (N)",
      "North-Northeast (NNE)",
      "Northeast (NE)",
      "East-Northeast (ENE)",
      "East (E)",
      "East-Southeast (ESE)",
      "Southeast (SE)",
      "South-Southeast (SSE)",
      "South (S)",
      "South-Southwest (SSW)",
      "Southwest (SW)",
      "West-Southwest (WSW)",
      "West (W)",
      "West-Northwest (WNW)",
      "Northwest (NW)",
      "North-Northwest (NNW)",
      "North (N)",
    ];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  }

  const summaryItems = [
    {
      icon: "lets-icons:compass-north",
      title: "Average Heading",
      summary: `${summaries.average_heading.toFixed(
        2
      )}° - ${getDirectionFromHeading(summaries.average_heading)}`,
    },
    {
      icon: "ph:compass-rose-fill",
      title: "Heading Range",
      summary: `${summaries.heading_range[0].toFixed(
        2
      )}° - ${summaries.heading_range[1].toFixed(2)}°`,
    },
    {
      icon: "uil:rotate-360",
      title: "Total Orientation Changes",
      summary: `${summaries.total_orientation_changes} Times`,
    },
    {
      icon: "material-symbols:u-turn-right-rounded",
      title: "Max Turn Angle",
      summary: `${summaries.max_turn_angle.toFixed(2)}°`,
    },
  ] as const;

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
        <div
          className="flex flex-col justify-center items-center"
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
            Loading IMU reports, please wait...
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
            No IMU reports available. Please check back later.
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
              />
            </div>
            <div className="flex items-center">
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
              />
            </div>
          </div>
          <IMUTable reports={reports} />
        </>
      )}
    </div>
  );
}
