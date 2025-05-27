/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import { useDarkMode } from "@/context/DarkModeContext";

interface ReportData {
  id: string;
  timestamp: string;
  sessionId?: number;
  distance: number;
  alertLevel: "High" | "Medium" | "Safe";
  image?: string;
  alt?: string;
  obstacles?: boolean;
  fileName?: string;
  dateTime?: string;
  createdAt?: string;
  metadata: Metadata;
}

interface UltrasonicSensorTableProps {
  reports: ReportData[];
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
  pitch?: number;
  roll?: number;
  yaw?: number;
}

export default function UltrasonicSensorTable({
  reports,
}: UltrasonicSensorTableProps) {
  // const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata: Metadata;
  }>(null);

  // const toggleSelectItem = (id: number) => {
  //   if (selectedItems.includes(id)) {
  //     setSelectedItems(selectedItems.filter((item) => item !== id));
  //   } else {
  //     setSelectedItems([...selectedItems, id]);
  //   }
  // };

  // const deleteReport = (id: number) => {
  //   setSelectedItems(selectedItems.filter((item) => item !== id));
  // };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "Safe":
        return (
          <span className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon icon="mdi:check-circle" className="w-4 h-4 mr-1" />
            Safe
          </span>
        );
      case "Medium":
        return (
          <span className="bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon icon="solar:danger-bold" className="w-4 h-4 mr-1" />
            Medium
          </span>
        );
      case "High":
        return (
          <span className="bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 mr-1" />
            High
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

  const { isDark } = useDarkMode();

  return (
    <>
      <div
        className={`overflow-x-auto w-full rounded-xl shadow-sm ${
          isDark ? "bg-[#112133]" : "bg-white"
        }`}
      >
        <table
          className={`min-w-[800px] w-full border-collapse ${isDark ? "text-white" : "text-black"}`}
        >
          <thead>
            <tr
              className={`${isDark ? "bg-[#1a3350] border-[#223c5c]" : "bg-[#367AF2]/10 border-gray-200"} border-b`}
            >
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                No
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Timestamp
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Distance (cm)
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Alert Level
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Image
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? "divide-[#223c5c]" : "divide-gray-200"}>
            {reports.map((report, index) => (
              <tr
                key={report.id}
                className={isDark ? "hover:bg-[#1a3350]" : "hover:bg-gray-50"}
              >
                <td
                  className={`py-3 px-4 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {index + 1}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {getTimeOnlyWithoutDate(report.timestamp)}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {report.distance}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {getAlertBadge(report.alertLevel)}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {report.image && (
                    <div
                      className={`h-10 w-16 rounded cursor-pointer ${isDark ? "bg-[#23262F]" : "bg-gray-200"}`}
                      onClick={() =>
                        setSelectedPhoto({
                          id: report.id.toString(),
                          src: report.image || "",
                          alt: report.alt || "Image",
                          obstacle: report.obstacles || false,
                          date: report.dateTime || "",
                          fileName: report.fileName || "",
                          createdAt: report.createdAt || "",
                          metadata: report.metadata,
                        })
                      }
                    >
                      <img
                        src={report.image}
                        alt="Report"
                        className="h-10 w-16 rounded object-cover"
                      />
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm space-x-2">
                  <button
                    disabled
                    className={`border rounded-full px-3 py-2 text-sm hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15
                      ${isDark ? "border-[#23262F] text-[#DFDFDF] hover:bg-[#23262F]" : "border-gray-300 text-gray-600"}
                    `}
                    onClick={() => console.log(`Edit report ${report.id}`)}
                  >
                    <Icon
                      icon="mage:edit-fill"
                      className="inline mr-1"
                      width={16}
                      height={16}
                    />
                    Edit
                  </button>
                  <button
                    className={`border border-red-300 text-red-600 rounded-full px-3 py-2 text-sm hover:bg-red-50 ${isDark ? "hover:bg-[#23262F]" : ""}`}
                  >
                    <Icon
                      icon="mingcute:delete-fill"
                      className="inline mr-1"
                      width={16}
                      height={16}
                    />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedPhoto && (
        <PhotoDetailsWithPaths
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
