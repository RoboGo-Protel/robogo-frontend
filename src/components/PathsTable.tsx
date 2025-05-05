"use client";
import { Icon } from "@iconify/react";

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
      <div className="bg-white overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#367AF2]/10 border-b border-gray-200 rounded-xl">
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Pos (x, y)
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Timestamp
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Speed (m/s)
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Heading (°)
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Direction
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-black uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.position.x}, {report.position.y}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {getTimeOnlyWithoutDate(report.timestamp)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.speed}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.heading}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
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
                <td className="py-4 px-4 text-sm text-gray-900">
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
