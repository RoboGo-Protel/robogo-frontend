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
  source?: 'api' | 'serial';
}

const LogsCard: React.FC = () => {
  const { isDark } = useDarkMode();
  const [logsItems, setLogsItems] = useState<LogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [availablePorts, setAvailablePorts] = useState<
    {
      path: string;
      manufacturer: string;
      vendorId?: string;
      productId?: string;
      serialNumber?: string;
    }[]
  >([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPortSelector, setShowPortSelector] = useState(false);
  const hasFetched = useRef(false);
  const serialLogCounter = useRef(0);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await fetch('/api/monitoring/logs');
        const data = await response.json();
        setLogsItems(data.data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchLogs();
  }, []);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI; // Function to get available serial ports
  const getAvailablePorts = async () => {
    if (!isElectron) {
      alert('Fitur ini hanya tersedia di aplikasi Electron.');
      return;
    }

    try {
      const ports = await window.electronAPI!.getSerialPorts();
      console.log('Filtered ports received:', ports);

      setAvailablePorts(ports);
      if (ports.length === 0) {
        // Jika tidak ada port yang terfilter, coba ambil semua port
        const allPorts = await window.electronAPI!.getAllSerialPorts();
        console.log('All ports (unfiltered):', allPorts);

        if (allPorts.length > 0) {
          setAvailablePorts(allPorts);
          setShowPortSelector(true);
          alert(
            `Filter otomatis tidak menemukan ESP32. Menampilkan semua port (${allPorts.length} port). Port COM8 mungkin ada di daftar ini.`,
          );
        } else {
          alert(
            'Tidak ada port serial yang terdeteksi sama sekali. Pastikan ESP32 terhubung dan driver terinstall.',
          );
        }
      } else {
        setShowPortSelector(true);
      }
    } catch (error) {
      console.error('Error getting serial ports:', error);
      alert(
        'Gagal mendapatkan daftar port serial. Periksa console untuk detail error.',
      );
    }
  };
  // Function to connect to selected serial port
  const connectToSerialPort = async () => {
    if (!selectedPort) {
      alert('Pilih port terlebih dahulu.');
      return;
    }

    try {
      setIsConnecting(true);
      await window.electronAPI!.openSerialPort(selectedPort, 115200);

      // Start listening for serial data
      window.electronAPI!.onSerialData((data: string) => {
        const lines = data.split('\n');
        lines.forEach((line: string) => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            const newLog: LogItem = {
              id: `serial_${serialLogCounter.current++}`,
              timestamp: new Date().toISOString(),
              sessionId: 0,
              logType: 'ESP32',
              message: trimmedLine,
              createdAt: new Date().toISOString(),
              source: 'serial',
            };

            setLogsItems((prev) => [...prev, newLog]);
          }
        });
      });

      await window.electronAPI!.startSerialReading();
      setIsSerialConnected(true);
      setShowPortSelector(false);
    } catch (error) {
      console.error('Error connecting to serial port:', error);
      alert('Gagal menghubungkan ke port serial.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to disconnect from serial port
  const disconnectFromSerialPort = async () => {
    try {
      window.electronAPI!.removeSerialDataListener();
      await window.electronAPI!.closeSerialPort();
      setIsSerialConnected(false);
      setSelectedPort('');
    } catch (error) {
      console.error('Error disconnecting from serial port:', error);
    }
  };

  // Debug function to show all ports
  const showAllPorts = async () => {
    if (!isElectron) return;

    try {
      const allPorts = await window.electronAPI!.getAllSerialPorts();
      console.log('=== DEBUG: All Available Ports ===');
      allPorts.forEach((port, index) => {
        console.log(`Port ${index + 1}:`, port);
      });

      alert(
        `Debug: Found ${allPorts.length} total ports. Check console for details. Looking for COM8...`,
      );

      // Cari COM8 specifically
      const com8 = allPorts.find((port) =>
        port.path.toLowerCase().includes('com8'),
      );
      if (com8) {
        console.log('=== COM8 FOUND ===', com8);
        alert(
          `COM8 ditemukan! Path: ${com8.path}, Manufacturer: ${com8.manufacturer}`,
        );

        // Auto-set COM8 sebagai selected port
        setAvailablePorts([
          com8,
          ...allPorts.filter((p) => p.path !== com8.path),
        ]);
        setSelectedPort(com8.path);
        setShowPortSelector(true);
      } else {
        console.log('COM8 not found in available ports');
        setAvailablePorts(allPorts);
        setShowPortSelector(true);
      }
    } catch (error) {
      console.error('Debug error:', error);
      alert('Debug error - check console');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isSerialConnected && isElectron) {
        disconnectFromSerialPort();
      }
    };
  }, [isSerialConnected, isElectron]);
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
      <div className='flex flex-row items-center justify-between w-full gap-2'>
        <div className='flex flex-row items-center justify-start gap-2'>
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
        {/* ESP32 Serial Controls */}
        {isElectron && (
          <div className='flex items-center gap-2'>
            {isSerialConnected && (
              <div className='flex items-center gap-1'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-green-500 font-medium'>
                  ESP32
                </span>
              </div>
            )}

            {/* Debug Button */}
            <button
              onClick={showAllPorts}
              className='px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg'
              title='Debug: Show all ports'
            >
              🔍
            </button>

            <button
              onClick={
                isSerialConnected ? disconnectFromSerialPort : getAvailablePorts
              }
              disabled={isConnecting}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isSerialConnected
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isConnecting ? (
                <div className='flex items-center gap-1'>
                  <ClipLoader size={12} color='white' />
                  <span>Connecting...</span>
                </div>
              ) : isSerialConnected ? (
                'Disconnect'
              ) : (
                'Connect ESP32'
              )}
            </button>
          </div>
        )}
      </div>{' '}
      {/* Port Selector Modal */}
      {showPortSelector && (
        <div
          className={`w-full mt-3 p-3 rounded-lg border ${
            isDark
              ? 'border-gray-600 bg-gray-800'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <p className='text-sm font-medium mb-2'>
            Pilih Port ESP32 ({availablePorts.length} port tersedia):
          </p>
          <div className='space-y-2'>
            {availablePorts.map((port, index) => (
              <label
                key={index}
                className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedPort === port.path
                    ? isDark
                      ? 'bg-blue-900/30 border border-blue-500'
                      : 'bg-blue-100 border border-blue-300'
                    : isDark
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type='radio'
                  name='serialPort'
                  value={port.path}
                  checked={selectedPort === port.path}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className='text-blue-500 mt-1'
                />
                <div className='flex-1'>
                  <div className='text-sm font-medium'>{port.path}</div>
                  <div className='text-xs text-gray-500'>
                    {port.manufacturer || 'Unknown Manufacturer'}
                    {port.vendorId && ` (VID: ${port.vendorId})`}
                    {port.productId && ` (PID: ${port.productId})`}
                  </div>
                  {port.path.toLowerCase().includes('com8') && (
                    <div className='text-xs text-green-600 font-medium'>
                      ← Ini mungkin ESP32 Anda!
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className='flex gap-2 mt-3'>
            <button
              onClick={connectToSerialPort}
              disabled={!selectedPort || isConnecting}
              className='px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50'
            >
              Connect
            </button>
            <button
              onClick={() => setShowPortSelector(false)}
              className='px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg'
            >
              Cancel
            </button>
            <button
              onClick={showAllPorts}
              className='px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg'
            >
              Refresh/Debug
            </button>
          </div>
        </div>
      )}
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
              <div className='flex items-center gap-1'>
                {item.source === 'serial' && (
                  <Icon
                    icon='mdi:chip'
                    width={12}
                    height={12}
                    className='text-green-500'
                  />
                )}
                <p className='text-sm font-semibold text-[#979797]'>
                  [{convertTimestampToTime(item.timestamp)}]{' '}
                  <span
                    className={`font-normal ${isDark ? 'text-white' : 'text-black'}`}
                  >
                    {item.message}
                  </span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className='text-center mt-4'>
            <p className='text-sm text-gray-400 mb-2'>No logs available</p>
            {isElectron && !isSerialConnected && (
              <p className='text-xs text-gray-500'>
                Connect ESP32 to see serial monitor logs
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LogsCard;
