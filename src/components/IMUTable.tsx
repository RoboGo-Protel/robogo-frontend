"use client";
// import { useState } from "react";
import { Icon } from "@iconify/react";
// import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";

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
      <div className="overflow-x-auto w-full bg-white rounded-xl shadow-sm">
        <table className="w-full border-collapse text-sm sm:text-sm md:table-fixed min-w-[1000px]">
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
            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                Timestamp
              </th>
              <th
                colSpan={3}
                className="py-3 px-2 text-center font-medium text-black uppercase tracking-wider"
              >
                Acceleration (m/s²)
              </th>
              <th
                colSpan={3}
                className="py-3 px-2 text-center font-medium text-black uppercase tracking-wider"
              >
                Gyroscope (°/s)
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                Heading (°)
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                Direction
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                Notes
              </th>
              <th
                rowSpan={2}
                className="py-3 px-2 text-left font-medium text-black uppercase align-top"
              >
                Action
              </th>
            </tr>

            <tr className="bg-[#367AF2]/10 border-b border-gray-200">
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                X
              </th>
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                Y
              </th>
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                Z
              </th>
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                X
              </th>
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                Y
              </th>
              <th className="py-2 px-2 text-center font-medium text-black uppercase">
                Z
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-50">
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
                  <div className="flex items-center gap-x-2 min-w-0">
                    <Icon
                      icon="material-symbols:north-rounded"
                      className="text-[#367AF2] shrink-0"
                      style={{
                        transform: `rotate(${((report.heading % 360) + 360) % 360}deg)`,
                      }}
                      width={20}
                      height={20}
                    />
                    <span className="break-words">
                      {convertDegreesToDirection(report.heading)}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-2">{getNotesBadge(report.status)}</td>

                <td className="py-3 px-2">
                  <div className="flex flex-row flex-nowrap items-center space-x-2">
                    <button
                      disabled
                      className="whitespace-nowrap border border-gray-300 text-gray-600 rounded-full px-3 py-2 text-sm hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15 min-w-[80px]"
                    >
                      <Icon
                        icon="mage:edit-fill"
                        className="inline-block mr-1 align-middle"
                        width={16}
                        height={16}
                      />
                      Edit
                    </button>
                    <button className="whitespace-nowrap border border-red-300 text-red-600 rounded-full px-3 py-2 text-sm hover:bg-red-50 min-w-[80px]">
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
