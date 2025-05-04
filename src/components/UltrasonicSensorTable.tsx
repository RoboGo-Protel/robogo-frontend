/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import PhotoDetails from "./PhotoDetails";

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
}

export default function UltrasonicSensorTable({
  reports,
}: UltrasonicSensorTableProps) {
  // const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <div className="bg-white overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                No
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Timestamp
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Distance (cm)
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Alert Level
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Image
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm text-gray-900">{index + 1}</td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {formatDate(report.timestamp)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.distance}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {getAlertBadge(report.alertLevel)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.image && (
                    <div
                      className="h-10 w-16 bg-gray-200 rounded cursor-pointer"
                      onClick={() =>
                        setSelectedPhoto({
                          id: report.id.toString(),
                          src: report.image || "",
                          alt: report.alt || "Image",
                          obstacles: report.obstacles || false,
                          date: report.dateTime || "",
                          fileName: report.fileName || "",
                          dateTime: report.dateTime || "",
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
                <td className="py-4 px-4 text-sm space-x-2">
                  <button
                    disabled
                    className="border border-gray-300 text-gray-600 rounded-full px-3 py-2 text-sm hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15"
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
                  <button className="border border-red-300 text-red-600 rounded-full px-3 py-2 text-sm hover:bg-red-50">
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
        <PhotoDetails
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
