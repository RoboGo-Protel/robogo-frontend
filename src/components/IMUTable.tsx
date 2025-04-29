"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
// import PhotoDetails from "./PhotoDetails";

interface ReportData {
  id: number;
  timestamp: string;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  heading: number;
  notes: string;
}

export default function IMUTable() {
  const [reports, setReports] = useState<ReportData[]>([
    {
      id: 1,
      timestamp: "09:41:25",
      acceleration: { x: 0.1, y: 0.2, z: 0.3 },
      gyroscope: { x: 0.4, y: 0.5, z: 0.6 },
      heading: 180,
      notes: "Turn Detected",
    },

    {
      id: 2,
      timestamp: "09:41:26",
      acceleration: { x: 0.2, y: 0.3, z: 0.4 },
      gyroscope: { x: 0.5, y: 0.6, z: 0.7 },
      heading: 90,
      notes: "IMU Calibrated",
    },
    {
      id: 3,
      timestamp: "09:41:27",
      acceleration: { x: 0.3, y: 0.4, z: 0.5 },
      gyroscope: { x: 0.6, y: 0.7, z: 0.8 },
      heading: 45,
      notes: "Normal",
    },
    {
      id: 4,
      timestamp: "09:41:28",
      acceleration: { x: 0.4, y: 0.5, z: 0.6 },
      gyroscope: { x: 0.7, y: 0.8, z: 0.9 },
      heading: 270,
      notes: "Turn Detected",
    },
    {
      id: 5,
      timestamp: "09:41:29",
      acceleration: { x: 0.5, y: 0.6, z: 0.7 },
      gyroscope: { x: 0.8, y: 0.9, z: 1 },
      heading: -45,
      notes: "IMU Calibrated",
    },
    // Generate 3 more reports for testing

    {
      id: 6,
      timestamp: "09:41:30",
      acceleration: { x: 0.6, y: 0.7, z: 0.8 },
      gyroscope: { x: 0.9, y: 1, z: 1.1 },
      heading: -90,
      notes: "Normal",
    },
    {
      id: 7,
      timestamp: "09:41:31",
      acceleration: { x: 0.7, y: 0.8, z: 0.9 },
      gyroscope: { x: 1, y: 1.1, z: 1.2 },
      heading: -135,
      notes: "Turn Detected",
    },
    {
      id: 8,
      timestamp: "09:41:32",
      acceleration: { x: 0.8, y: 0.9, z: 1 },
      gyroscope: { x: 1.1, y: 1.2, z: 1.3 },
      heading: -180,
      notes: "IMU Calibrated",
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // const [selectedPhoto, setSelectedPhoto] = useState<null | {
  //   src: string;
  //   alt: string;
  //   obstacles: boolean;
  //   date: string;
  //   fileName: string;
  //   dateTime: string;
  // }>(null);

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

  const convertDegreesToDirection = (degrees: number) => {
    const directions = [
      "North (N)",
      "North-East (NE)",
      "East (E)",
      "South-East (SE)",
      "South (S)",
      "South-West (SW)",
      "West (W)",
      "North-West (NW)",
    ];

    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.round((normalizedDegrees % 360) / 45) % 8;
    return directions[index];
  };

  const getArrowDirection = (degrees: number) => {
    const directions = [
      "material-symbols:north-rounded",
      "material-symbols:north-east-rounded",
      "material-symbols:east-rounded",
      "material-symbols:south-east-rounded",
      "material-symbols:south-rounded",
      "material-symbols:south-west-rounded",
      "material-symbols:west-rounded",
      "material-symbols:north-west-rounded",
    ];

    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.round(normalizedDegrees / 45) % 8;
    return directions[index];
  };

  const getNotesBadge = (level: string) => {
    switch (level) {
      case "IMU Calibrated":
        return (
          <span className="bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon icon="tabler:rotate-2" className="w-4 h-4 mr-1" />
            {level}
          </span>
        );
      case "Turn Detected":
        return (
          <span className="bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon
              icon="f7:arrow-uturn-right-circle-fill"
              className="w-4 h-4 mr-1"
            />
            {level}
          </span>
        );
      case "Normal":
        return (
          <span className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon
              icon="material-symbols:check-circle"
              className="w-4 h-4 mr-1"
            />
            {level}
          </span>
        );
      default:
    }
  };

  return (
    <>
      <div className="bg-white overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-14" />
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
            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th
                rowSpan={2}
                className="py-3 px-2 align-top text-xs font-medium text-black uppercase"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      selectedItems.length === reports.length &&
                      reports.length > 0
                    }
                    className="h-5 w-5 rounded border-gray-300 appearance-none checked:bg-blue-600 checked:border-transparent ring-1 ring-[#367AF2] cursor-pointer"
                  />
                  {selectedItems.length === reports.length &&
                    reports.length > 0 && (
                      <Icon
                        icon="mdi:check"
                        className="absolute text-white h-3 w-3 pointer-events-none"
                      />
                    )}
                </div>
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                Timestamp
              </th>
              <th
                colSpan={3}
                className="py-3 px-2 text-center text-xs font-medium text-black uppercase tracking-wider"
              >
                Acceleration (m/s²)
              </th>
              <th
                colSpan={3}
                className="py-3 px-2 text-center text-xs font-medium text-black uppercase tracking-wider"
              >
                Gyroscope (°/s)
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                Heading (°)
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                Direction
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                Notes
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left text-xs font-medium text-black uppercase align-top"
              >
                Action
              </th>
            </tr>

            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                X
              </th>
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                Y
              </th>
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                Z
              </th>
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                X
              </th>
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                Y
              </th>
              <th className="py-2 px-2 text-center text-xs font-medium text-black uppercase">
                Z
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(report.id)}
                      onChange={() => toggleSelectItem(report.id)}
                      className="h-5 w-5 rounded border-gray-300 appearance-none checked:bg-blue-600 checked:border-transparent ring-1 ring-[#367AF2] cursor-pointer"
                    />
                    {selectedItems.includes(report.id) && (
                      <Icon
                        icon="mdi:check"
                        className="absolute text-white h-3 w-3 pointer-events-none"
                      />
                    )}
                  </div>
                </td>

                <td className="py-3 px-2">{report.id}</td>
                <td className="py-3 px-2">{report.timestamp}</td>

                <td className="py-3 px-2 text-center">
                  {report.acceleration.x.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.acceleration.y.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.acceleration.z.toFixed(2)}
                </td>

                <td className="py-3 px-2 text-center">
                  {report.gyroscope.x.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.gyroscope.y.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  {report.gyroscope.z.toFixed(2)}
                </td>

                <td className="py-3 px-2">{report.heading}°</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-1">
                    <Icon
                      icon={getArrowDirection(report.heading)}
                      className="text-[#367AF2]"
                      width={24}
                      height={24}
                    />
                    <div>{convertDegreesToDirection(report.heading)}</div>
                  </div>
                </td>

                <td className="py-3 px-2">{getNotesBadge(report.notes)}</td>

                <td className="py-3 px-2 text-sm space-x-2">
                  <button
                    disabled
                    className="border border-gray-300 text-gray-600 rounded-full px-3 py-2 text-sm hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15"
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

      {/* {selectedPhoto && (
        <PhotoDetails
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )} */}
    </>
  );
}
