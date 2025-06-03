import React from "react";
import { Icon } from "@iconify/react";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";

interface ImportLogResult {
  totalData: number;
  success: boolean;
  duplication: boolean;
  message: string;
}

interface ImportedReport {
  ultrasonic_logs: ImportLogResult;
  imu_logs: ImportLogResult;
}

interface StopMonitoringResultProps {
  result: {
    stopped: boolean;
    sessionId: number;
    date: string;
    importedReport: ImportedReport;
  };
}

const StopMonitoringResult: React.FC<StopMonitoringResultProps> = ({
  result,
}) => {
  const { stopped, sessionId, date, importedReport } = result;
  const { isDark } = useDarkMode();

  const formatDateWithSuffix = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    // Suffix
    const j = day % 10,
      k = day % 100;
    let suffix = "th";
    if (j === 1 && k !== 11) suffix = "st";
    else if (j === 2 && k !== 12) suffix = "nd";
    else if (j === 3 && k !== 13) suffix = "rd";
    return `${month} ${day}${suffix}, ${year}`;
  };

  // Mapping log type keys to user-friendly titles
  const logTypeTitleMap: Record<string, string> = {
    imu_logs: "IMU Logs",
    ultrasonic_logs: "Ultrasonic Logs",
    path_logs: "Path Logs",
    // Tambahkan mapping lain jika ada log type baru
  };

  return (
    <div
      className={clsx(
        "p-6 rounded-2xl border max-w-lg w-full shadow-lg relative",
        isDark
          ? "bg-[#112133] border-[#27426C] text-white"
          : "bg-white border-[#CFCFCF] text-black"
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
          <Icon
            icon={stopped ? "mdi:check-circle" : "mdi:close-circle"}
            width={28}
            height={28}
            className={stopped ? "text-white" : "text-red-500"}
          />
        </div>
        <div className="flex flex-col items-start justify-center">
          <h2
            className={clsx(
              "text-lg font-bold",
              isDark ? "text-white" : "text-black"
            )}
          >
            Stop Monitoring Result
          </h2>
          <span
            className={clsx(
              "text-sm",
              isDark ? "text-white/70" : "text-black/50"
            )}
          >
            {stopped
              ? "Monitoring stopped successfully"
              : "Monitoring failed to stop"}
          </span>
        </div>
      </div>
      <hr
        className={clsx(
          "w-full mb-3",
          isDark ? "border-white/15" : "border-black/15"
        )}
      />
      <div className="flex flex-row flex-wrap gap-4 mb-4 items-stretch w-full">
        <div
          className={clsx(
            "flex-1 min-w-[140px] p-3 rounded-xl border flex flex-row items-center gap-2 w-full",
            isDark
              ? "bg-[#1A2B48] border-[#27426C]"
              : "bg-gray-50 border-[#DFDFDF]"
          )}
        >
          <Icon icon="material-symbols:info-rounded" width={16} height={16} />
          <span className="font-bold text-sm">Session ID:</span>
          <span className="font-mono text-blue-500 dark:text-blue-300 text-sm ml-1 font-normal">
            {sessionId}
          </span>
        </div>
        <div
          className={clsx(
            "flex-1 min-w-[140px] p-3 rounded-xl border flex flex-row items-center gap-2 w-full",
            isDark
              ? "bg-[#1A2B48] border-[#27426C]"
              : "bg-gray-50 border-[#DFDFDF]"
          )}
        >
          <Icon icon="mingcute:time-fill" width={16} height={16} />
          <span className="font-bold text-sm">Date:</span>
          <span className="font-mono text-gray-500 dark:text-gray-300 text-sm ml-1 font-normal">
            {formatDateWithSuffix(date)}
          </span>
        </div>
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-2 text-base flex items-center gap-2">
          <Icon icon="mdi:file-document-outline" width={18} height={18} />{" "}
          Imported Report
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importedReport &&
            Object.entries(importedReport).map(([logType, logResult]) => (
              <div
                key={logType}
                className={clsx(
                  "p-0 rounded-xl border shadow-sm flex flex-col overflow-hidden",
                  isDark
                    ? "bg-[#1A2B48] border-[#27426C]"
                    : "bg-gray-50 border-[#DFDFDF]"
                )}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]">
                  <Icon
                    icon="mdi:file-document-outline"
                    width={18}
                    height={18}
                    className="text-white"
                  />
                  <span className="font-semibold text-sm text-white">
                    {logTypeTitleMap[logType] ||
                      logType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-2 px-4 py-4">
                  <div className="flex flex-row flex-wrap gap-2 text-xs">
                    <span className="text-gray-600 dark:text-gray-300">
                      Total:{" "}
                      <span className="font-mono">{logResult.totalData}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {logResult.success ? (
                        <>
                          <Icon
                            icon="mdi:check-circle"
                            width={16}
                            height={16}
                            className="text-green-400"
                          />
                          <span className="text-green-400 font-semibold">
                            Success
                          </span>
                        </>
                      ) : (
                        <>
                          <Icon
                            icon="mdi:close-circle"
                            width={16}
                            height={16}
                            className="text-red-400"
                          />
                          <span className="text-red-400 font-semibold">
                            Failed
                          </span>
                        </>
                      )}
                    </span>
                    {typeof logResult.duplication !== "undefined" && (
                      <span
                        className={clsx(
                          "font-semibold flex items-center gap-1",
                          logResult.duplication
                            ? "text-yellow-400"
                            : "text-gray-400"
                        )}
                      >
                        <Icon
                          icon="mdi:content-duplicate"
                          width={15}
                          height={15}
                        />
                        Duplication: {logResult.duplication ? "Yes" : "No"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="flex flex-row gap-4 items-center justify-center w-full h-fit mt-6">
        <a
          href="/reports"
          className={clsx(
            "flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl w-full border-[#367AF2]/20 hover:bg-blue-200/20 hover:border-[#3BD5FF] transition",
            "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white font-semibold text-sm text-center"
          )}
        >
          <Icon
            icon="solar:graph-up-bold"
            width={20}
            height={20}
            className="text-white"
          />
          Go to Reports
        </a>
      </div>
    </div>
  );
};

export default StopMonitoringResult;
