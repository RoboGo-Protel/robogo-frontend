import React from "react";
import { useDarkMode } from "@/context/DarkModeContext"; // ✅ Import

interface SensorData {
  timestamp: string;
  value: number;
}

interface TableProps {
  sensorTitle?: string;
  sensorModel?: string;
  secondHeaderValue?: string;
  data: SensorData[];
  className?: string;
}

const Table: React.FC<TableProps> = ({
  sensorTitle = "Ultrasonic Sensor",
  sensorModel,
  secondHeaderValue = "Distance (m)",
  data,
  className = "",
}) => {
  const { isDark } = useDarkMode(); // ✅ Gunakan dark mode context

  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-2xl shadow-md border ${
        isDark ? "border-neutral-700" : "border-gray-200"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex justify-center items-center gap-1 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] px-4 py-3 text-white text-sm font-semibold rounded-t-2xl">
        {sensorTitle}
        {sensorModel && (
          <>
            &nbsp;• <span className="font-bold">{sensorModel}</span>
          </>
        )}
      </div>

      {/* Table */}
      <div className={isDark ? "bg-neutral-900" : "bg-white"}>
        <table
          className={`w-full text-sm text-left ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          <thead
            className={`${
              isDark
                ? "bg-neutral-800 text-white"
                : "bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800"
            }`}
          >
            <tr>
              <th className="px-4 py-2 font-semibold">Timestamp</th>
              <th className="px-4 py-2 font-semibold">{secondHeaderValue}</th>
            </tr>
          </thead>
          <tbody
            className={
              isDark
                ? "divide-y divide-neutral-700"
                : "divide-y divide-gray-200"
            }
          >
            {data.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-2">{item.timestamp}</td>
                <td className="px-4 py-2">{item.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
