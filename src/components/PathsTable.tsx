"use client";
import { Icon } from "@iconify/react";

interface ReportData {
  id: number;
  x: number;
  y: number;
  timestamp: string;
  speed: number;
  heading: number;
  status: string;
}

const reportData: ReportData[] = [
  {
    id: 1,
    x: 0,
    y: 0,
    timestamp: "09:41:25",
    speed: 1.25,
    heading: 45,
    status: "Start",
  },
  {
    id: 2,
    x: 1,
    y: 1,
    timestamp: "09:42:25",
    speed: 2.5,
    heading: 90,
    status: "Moving",
  },
  {
    id: 3,
    x: 2,
    y: 2,
    timestamp: "09:43:25",
    speed: 0,
    heading: 135,
    status: "Stop",
  },
];

export default function PathsTable({
  pathData = reportData,
}: {
  pathData?: ReportData[];
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Start":
        return (
          <span className="bg-gradient-to-br from-[#D2D2D2] to-[#545454] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
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
          <span className="bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit">
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
            {pathData.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.x}, {report.y}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {report.timestamp}
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
                      icon={getArrowDirection(report.heading)}
                      className="text-[#367AF2]"
                      width={24}
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
