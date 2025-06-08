"use client";
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { useDarkMode } from "@/context/DarkModeContext";

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

interface LogItem {
  id: string;
  timestamp: string;
  sessionId: number;
  logType: string;
  message: string;
  createdAt: string;
}

const LogsCard: React.FC = () => {
  const { isDark } = useDarkMode();
  const [logsItems, setLogsItems] = useState<LogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await fetch("/api/monitoring/logs");
        const data = await response.json();
        setLogsItems(data.data || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 rounded-xl flex-1 overflow-hidden ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      <div className='flex flex-row items-center justify-start w-full gap-2'>
        <div className='p-1.5 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-md'>
          <Icon
            icon='fluent:data-usage-32-filled'
            width={20}
            height={20}
            className='text-white'
          />
        </div>
        <p className='font-semibold text-base'>Logs</p>
      </div>

      <div className='flex flex-col items-start justify-start w-full gap-2 mt-3 overflow-y-auto pr-2 max-h-[300px] md:max-h-[400px]'>
        {isLoadingLogs ? (
          <div className='w-full flex items-center justify-center mt-10'>
            <ClipLoader size={24} color={isDark ? '#3b82f6' : '#60a5fa'} />
          </div>
        ) : logsItems.length > 0 ? (
          logsItems.map((item, index) => (
            <div
              key={index}
              className='flex flex-row items-center justify-start gap-2 w-full'
            >
              <p className='text-sm font-semibold text-[#979797]'>
                [{convertTimestampToTime(item.timestamp)}]{' '}
                <span
                  className={`font-normal ${isDark ? 'text-white' : 'text-black'}`}
                >
                  {item.message}
                </span>
              </p>
            </div>
          ))
        ) : (
          <p className='text-sm text-gray-400 mt-2'>No logs available</p>
        )}
      </div>
    </motion.div>
  );
};

export default LogsCard;
