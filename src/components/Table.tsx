import React from "react";

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
  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-2xl shadow-md border border-gray-200 ${className}`}
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
      <div className="bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800">
            <tr>
              <th className="px-4 py-2 font-semibold">Timestamp</th>
              <th className="px-4 py-2 font-semibold">{secondHeaderValue}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
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
