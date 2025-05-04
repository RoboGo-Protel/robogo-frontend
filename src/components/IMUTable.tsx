"use client";
// import { useState } from "react";
import { Icon } from "@iconify/react";
// import PhotoDetails from "./PhotoDetails";

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

interface IMUTableProps {
  reports: IMULogs[];
}

export default function IMUTable({ reports }: IMUTableProps) {
  // const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // const [selectedPhoto, setSelectedPhoto] = useState<null | {
  //   src: string;
  //   alt: string;
  //   obstacles: boolean;
  //   date: string;
  //   fileName: string;
  //   dateTime: string;
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

  const getTimeOnlyWithoutDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <div className="bg-white overflow-x-auto">
        <table className="table-fixed w-full border-collapse text-sm">
          <colgroup>
            {/* <col className="w-10" /> */}
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
              {/* <th
                rowSpan={2}
                className="py-3 px-2 align-top text-xs font-medium text-black uppercase"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    // onChange={toggleSelectAll}
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
              </th> */}
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
            {reports.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-50">
                {/* <td className="py-3 px-2">
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
                </td> */}

                <td className="py-3 px-2">{index + 1}</td>
                <td className="py-3 px-2">
                  {getTimeOnlyWithoutDate(report.timestamp)}
                </td>

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
                      icon="material-symbols:north-rounded"
                      className={`text-[#367AF2]`}
                      style={{
                        transform: `rotate(${
                          ((report.heading % 360) + 360) % 360
                        }deg)`,
                      }}
                      width={24}
                      height={24}
                    />
                    <div>{convertDegreesToDirection(report.heading)}</div>
                  </div>
                </td>

                <td className="py-3 px-2">{getNotesBadge(report.status)}</td>

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
                    // onClick={() => deleteReport(report.id)}
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
