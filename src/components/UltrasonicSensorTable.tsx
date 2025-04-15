"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import PhotoDetails from "./PhotoDetails";

interface ReportData {
  id: number;
  timestamp: string;
  distance: number;
  alertLevel: "Safe" | "Medium" | "High";
  image?: string;
  alt?: string;
  obstacles?: boolean;
  fileName?: string;
  dateTime?: string;
}

export default function UltrasonicSensorTable() {
  const [reports, setReports] = useState<ReportData[]>([
    {
      id: 1,
      timestamp: "09:41:25",
      distance: 1.25,
      alertLevel: "Safe",
      alt: "Image 15",
      obstacles: false,
      fileName: "RoboGo-G1_20250324_143244.jpg",
      dateTime: "2025-03-24T14:32:44",
      image:
        "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    },
    {
      id: 2,
      timestamp: "09:41:30",
      distance: 0.82,
      alertLevel: "Medium",
    },
    {
      id: 3,
      timestamp: "09:41:35",
      distance: 0.32,
      alertLevel: "High",
      alt: "Image 15",
      obstacles: false,
      fileName: "RoboGo-G1_20250324_143244.jpg",
      dateTime: "2025-03-24T14:32:44",
      image:
        "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    },
    {
      id: 4,
      timestamp: "09:41:40",
      distance: 0.45,
      alertLevel: "High",
      alt: "Image 15",
      obstacles: false,
      fileName: "RoboGo-G1_20250324_143244.jpg",
      dateTime: "2025-03-24T14:32:44",
      image:
        "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    },
    {
      id: 5,
      timestamp: "09:41:45",
      distance: 0.93,
      alertLevel: "Medium",
    },
    {
      id: 6,
      timestamp: "09:41:50",
      distance: 1.12,
      alertLevel: "Safe",
    },
    {
      id: 7,
      timestamp: "09:41:55",
      distance: 0.78,
      alertLevel: "Medium",
    },
    {
      id: 8,
      timestamp: "09:42:00",
      distance: 0.46,
      alertLevel: "High",
      alt: "Image 15",
      obstacles: false,
      fileName: "RoboGo-G1_20250324_143244.jpg",
      dateTime: "2025-03-24T14:32:44",
      image:
        "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    src: string;
    alt: string;
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
  }>(null);

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === reports.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(reports.map((report) => report.id));
    }
  };

  const deleteReport = (id: number) => {
    setReports(reports.filter((report) => report.id !== id));
    setSelectedItems(selectedItems.filter((item) => item !== id));
  };

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

  return (
    <>
      <div className="bg-white overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th className="py-3 px-4 relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 appearance-none checked:bg-blue-600 checked:border-transparent ring-1 ring-[#367AF2] focus:outline-none hover:cursor-pointer hover:bg-[#367AF2]/10"
                  checked={
                    selectedItems.length === reports.length &&
                    reports.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                {selectedItems.length === reports.length && (
                  <Icon
                    icon="mdi:check"
                    className="absolute text-white h-3 w-3 pointer-events-none"
                  />
                )}
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                No
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Timestamp
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Distance (m)
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
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 appearance-none checked:bg-blue-600 checked:border-transparent ring-1 ring-[#367AF2] focus:outline-none"
                      checked={selectedItems.includes(report.id)}
                      onChange={() => toggleSelectItem(report.id)}
                    />
                    {selectedItems.includes(report.id) && (
                      <Icon
                        icon="mdi:check"
                        className="absolute text-white h-3 w-3 pointer-events-none"
                      />
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">{report.id}</td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.timestamp}
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
                          src: report.image || "",
                          alt: report.alt || "Image",
                          obstacles: report.obstacles || false,
                          date: report.dateTime || "",
                          fileName: report.fileName || "",
                          dateTime: report.dateTime || "",
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
                  <button
                    className="border border-red-300 text-red-600 rounded-full px-3 py-2 text-sm hover:bg-red-50"
                    onClick={() => deleteReport(report.id)}
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
        <PhotoDetails
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
