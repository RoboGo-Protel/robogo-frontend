import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

// Fungsi untuk mengonversi timestamp ke waktu
const convertTimestampToTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return date.toLocaleTimeString("en-US", options);
};

// Tipe data untuk props
interface LogItem {
  timestamp: string;
  message: string;
}

interface LogsCardProps {
  logsItems: LogItem[];
}

const LogsCard: React.FC<LogsCardProps> = ({ logsItems }) => {
  return (
    <div
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 border-[#ECECEC] rounded-xl flex-1 overflow-hidden`}
    >
      <div className="flex flex-row items-center justify-start w-full gap-2">
        <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
          <Icon
            icon="fluent:data-usage-32-filled"
            width={20}
            height={20}
            className="text-white"
          />
        </div>
        <p className="font-semibold text-base">Logs</p>
      </div>

      <div className="flex flex-col items-start justify-start w-full gap-2 mt-3 overflow-y-auto pr-2">
        {logsItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-row items-center justify-start gap-2"
          >
            <p className="text-sm font-semibold text-[#979797]">
              [{convertTimestampToTime(item.timestamp)}]{" "}
              <span className="font-normal text-black">{item.message}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsCard;
