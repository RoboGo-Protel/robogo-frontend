"use client";
import { Icon } from "@iconify/react";
import { useDarkMode } from "@/context/DarkModeContext";

interface Position {
  x: number;
  y: number;
}

interface ReportData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
}

interface PathsTableProps {
  reports: ReportData[];
}

export default function PathsTable({ reports }: PathsTableProps) {
  const { isDark } = useDarkMode();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Start":
        return (
          <span className="bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon
              icon="material-symbols:not-started-rounded"
              className="w-4 h-4 mr-1"
            />
            {status}
          </span>
        );
      case "Moving":
        return (
          <span className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon
              icon="svg-spinners:blocks-shuffle-3"
              className="w-4 h-4 mr-1"
            />
            {status}
          </span>
        );
      case "Stop":
        return (
          <span className="bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
            <Icon icon="gravity-ui:stop-fill" className="w-4 h-4 mr-1" />
            {status}
          </span>
        );
      default:
    }
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
        className={`overflow-x-auto rounded-xl shadow-sm ${
          isDark ? "bg-[#112133]" : "bg-white"
        }`}
      >
        <table
          className={`min-w-[700px] w-full text-sm text-left ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          <thead
            className={`border-b border-gray-200 ${
              isDark ? "bg-[#367AF2]/10" : "bg-[#367AF2]/10"
            }`}
          >
            <tr>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                No
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Pos (x, y)
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Timestamp
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Speed (m/s)
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Heading (°)
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Direction
              </th>
              <th className="py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
          >
            {reports.map((report) => (
              <tr
                key={report.id}
                className={`transition-colors ${
                  isDark ? "hover:bg-[#1a2b44]" : "hover:bg-gray-50"
                }`}
              >
                <td className="py-3 px-4 whitespace-nowrap">
                  {reports.indexOf(report) + 1}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {report.position.x}, {report.position.y}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {getTimeOnlyWithoutDate(report.timestamp)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">{report.speed}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {report.heading}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="material-symbols:north-rounded"
                      className="text-[#367AF2] shrink-0"
                      style={{
                        transform: `rotate(${((report.heading % 360) + 360) % 360}deg)`,
                      }}
                      width={20}
                      height={20}
                    />
                    <span>{convertDegreesToDirection(report.heading)}</span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {getStatusBadge(report.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
