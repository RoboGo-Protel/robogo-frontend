"use client";
// import { useState } from "react";
import { Icon } from "@iconify/react";
// import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import { useDarkMode } from "@/context/DarkModeContext";

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
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface IMULogs {
  id: string;
  timestamp: string;
  sessionId: number;
  metadata: Metadata;
  status: string;
  createdAt: string;
}

interface IMUTableProps {
  reports: IMULogs[];
}

export default function IMUTable({ reports }: IMUTableProps) {
  const { isDark } = useDarkMode();
  // const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // const [selectedPhoto, setSelectedPhoto] = useState<null | {
  //   src: string;
  //   alt: string;
  //   obstacle: boolean;
  //   date: string;
  //   fileName: string;
  //   createdAt: string;
  // }>(null);

  // const toggleSelectItem = (id: number) => {
  //   if (selectedItems.includes(id)) {
  //     setSelectedItems(selectedItems.filter((item) => item !== id));
  //   } else {
  //     setSelectedItems([...selectedItems, id]);
  //   }
  // };

  // const toggleSelectAll = () => {
  //   if (selectedItems.length === reports.length) {
  //     setSelectedItems([]);
  //   } else {
  //     setSelectedItems(reports.map((report) => report.id));
  //   }
  // };

  // const deleteReport = (id: number) => {
  //   setReports(reports.filter((report) => report.id !== id));
  //   setSelectedItems(selectedItems.filter((item) => item !== id));
  // };

  const convertDegreesToDirection = (degrees: number) => {
    const directions = [
      "North (N)",
      "North-North-East (NNE)",
      "North-East (NE)",
      "East-North-East (ENE)",
      "East (E)",
      "East-South-East (ESE)",
      "South-East (SE)",
      "South-South-East (SSE)",
      "South (S)",
      "South-South-West (SSW)",
      "South-West (SW)",
      "West-South-West (WSW)",
      "West (W)",
      "West-North-West (WNW)",
      "North-West (NW)",
      "North-North-West (NNW)",
    ];

    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.round((normalizedDegrees % 360) / 22.5) % 16;
    return directions[index];
  };

  const getNotesBadge = (level: string) => {
    const baseStyle =
      "text-white text-sm py-2 px-3 rounded-full inline-flex items-center gap-x-1";

    const iconStyle = "w-4 h-4 shrink-0";

    switch (level) {
      case "IMU Calibrated":
        return (
          <span
            className={`bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] ${baseStyle}`}
          >
            <Icon icon="tabler:rotate-2" className={iconStyle} />
            {level}
          </span>
        );
      case "Turn Detected":
        return (
          <span
            className={`bg-gradient-to-br from-[#FFC107] to-[#FF9800] ${baseStyle}`}
          >
            <Icon
              icon="f7:arrow-uturn-right-circle-fill"
              className={iconStyle}
            />
            {level}
          </span>
        );
      case "Normal":
        return (
          <span
            className={`bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] ${baseStyle}`}
          >
            <Icon icon="material-symbols:check-circle" className={iconStyle} />
            {level}
          </span>
        );
      default:
        return null;
    }
  };

  const getTimeOnlyWithoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    return date.toLocaleTimeString("id-ID", options).replace(/:/g, ".");
  };

  return (
    <>
      <div
        className={`overflow-x-auto w-full rounded-xl shadow-sm ${
          isDark ? "bg-[#112133]" : "bg-white"
        }`}
      >
        <table
          className={`w-full border-collapse text-sm md:text-sm md:table-fixed min-w-[1000px] ${isDark ? "text-white" : "text-black"}`}
        >
          <colgroup>
            <col className="w-10" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-28" />
          </colgroup>

          <thead>
            <tr
              className={`${isDark ? "bg-[#1a3350] border-[#223c5c]" : "bg-[#367AF2]/10 border-gray-200"} border-b`}
            >
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                No
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                Timestamp
              </th>
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Velocity (m/s²)
              </th>
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Orientation (rad/s²)
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                Heading (°)
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                Direction
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                Notes
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? "text-white" : "text-black"}`}
              >
                Action
              </th>
            </tr>

            <tr
              className={`${isDark ? "bg-[#1a3350] border-[#223c5c]" : "bg-[#367AF2]/10 border-gray-200"} border-b`}
            >
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                Total
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                X
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                Y
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                Pitch
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                Roll
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? "text-white" : "text-black"}`}
              >
                Yaw
              </th>
            </tr>
          </thead>

          <tbody className={isDark ? "divide-[#223c5c]" : "divide-gray-200"}>
            {reports.map((report, index) => (
              <tr
                key={report.id}
                className={isDark ? "hover:bg-[#1a3350]" : "hover:bg-gray-50"}
              >
                <td className="py-3 px-2">{index + 1}</td>
                <td className="py-3 px-2">
                  {getTimeOnlyWithoutDate(report.createdAt)}
                </td>

                <td className="py-3 px-2 text-center">
                  {report.metadata.velocity?.velocity?.toFixed(2) || "0.00"}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.metadata.velocity?.velocityX?.toFixed(2) || "0.00"}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.metadata.velocity?.velocityY?.toFixed(2) || "0.00"}
                </td>

                <td className="py-3 px-2 text-center">
                  {report.metadata.pitch?.toFixed(2) || "0.00"}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.metadata.roll?.toFixed(2) || "0.00"}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.metadata.yaw?.toFixed(2) || "0.00"}
                </td>

                <td className="py-3 px-2">{report.metadata.heading}°</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-x-2 min-w-0">
                    <Icon
                      icon="material-symbols:north-rounded"
                      className="text-[#367AF2] shrink-0"
                      style={{
                        transform: `rotate(${((report.metadata.heading % 360) + 360) % 360}deg)`,
                      }}
                      width={20}
                      height={20}
                    />
                    <span className="break-words">
                      {convertDegreesToDirection(report.metadata.heading)}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-2">{getNotesBadge(report.status)}</td>

                <td className="py-3 px-2">
                  <div className="flex flex-row flex-nowrap items-center space-x-2">
                    <button
                      disabled
                      className={`whitespace-nowrap border rounded-full px-3 py-2 text-sm min-w-[80px] ${
                        isDark
                          ? "border-[#223c5c] text-[#b0b8c1] bg-[#112133]/15 hover:bg-[#1a3350]"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15"
                      }`}
                    >
                      <Icon
                        icon="mage:edit-fill"
                        className="inline-block mr-1 align-middle"
                        width={16}
                        height={16}
                      />
                      Edit
                    </button>
                    <button
                      className={`whitespace-nowrap border rounded-full px-3 py-2 text-sm min-w-[80px] ${
                        isDark
                          ? "border-[#EB0C0F]/40 text-[#EB0C0F] bg-[#112133]/15 hover:bg-[#1a3350]"
                          : "border-red-300 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <Icon
                        icon="mingcute:delete-fill"
                        className="inline-block mr-1 align-middle"
                        width={16}
                        height={16}
                      />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* {selectedPhoto && (
        <PhotoDetailsWithPaths
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )} */}
    </>
  );
}
