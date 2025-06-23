'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { useDarkMode } from '@/context/DarkModeContext';
import { useLocalMode } from '@/hooks/useLocalMode';

const convertTimestampToTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleTimeString('en-US', options);
};

// Function to parse and format JSON data for better readability
const parseAndFormatSerialData = (rawData: string) => {
  const lines = rawData.split('\n').filter((line) => line.trim());
  const formattedData: Array<{
    type: 'json' | 'text';
    timestamp: string;
    data: unknown;
    raw: string;
    receivedAt: string; // Add actual received time
  }> = [];

  // Process only last 20 lines for better performance in formatted view
  // Since serial data is already in newest-first order, keep that order
  const linesToProcess = lines.slice(-20);

  linesToProcess.forEach((line, index) => {
    const trimmedLine = line.trim();
    // Skip standalone timestamp lines from serial data
    // Format 1: [2025-06-22T03:22:07.769Z]
    // Format 2: 2025-06-22T04:07:09.627Z (without content after |)
    if (
      trimmedLine.match(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]$/) ||
      trimmedLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*\|\s*$/)
    ) {
      return; // Skip these timestamp-only lines
    }

    // Extract original data without timestamp prefix
    let cleanData = trimmedLine;

    // Handle different timestamp formats:
    // 1. [2025-06-22T03:22:07.769Z] format (from file logs)
    const bracketTimestampMatch = trimmedLine.match(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]\s*(.*)$/,
    );
    // 2. 2025-06-22T04:07:09.627Z | format (from test data injection)
    const pipeTimestampMatch = trimmedLine.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*\|\s*(.*)$/,
    );

    if (bracketTimestampMatch) {
      cleanData = bracketTimestampMatch[1];
    } else if (pipeTimestampMatch) {
      cleanData = pipeTimestampMatch[1];
    }

    // Generate timestamp that corresponds to actual data order
    // Since data is newest-first, earlier indices should get more recent timestamps
    const now = new Date();
    const entryTime = new Date(now.getTime() - index * 1000);
    const receivedAt = entryTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Check if line contains JSON data
    if (cleanData.includes('{') && cleanData.includes('}')) {
      try {
        // Extract JSON from debug messages or direct JSON
        let jsonString = cleanData;

        // Remove debug prefix if present
        const debugPrefix = '[DEBUG] Forwarding JSON to UART2:';
        if (cleanData.includes(debugPrefix)) {
          jsonString = cleanData
            .substring(cleanData.indexOf(debugPrefix) + debugPrefix.length)
            .trim();
        }

        // Handle test data prefix like [TEST_DATA] or [ESP32]
        const testDataMatch = jsonString.match(
          /^\[(?:TEST_DATA|ESP32)\]\s*(.*)$/,
        );
        if (testDataMatch) {
          jsonString = testDataMatch[1].trim();
        }

        // Parse JSON
        const jsonData = JSON.parse(jsonString);

        formattedData.push({
          type: 'json',
          timestamp: receivedAt,
          data: jsonData,
          raw: trimmedLine,
          receivedAt: entryTime.toISOString(),
        });
      } catch {
        // If parsing fails, treat as regular text
        if (cleanData.length > 0) {
          formattedData.push({
            type: 'text',
            timestamp: receivedAt,
            data: cleanData,
            raw: trimmedLine,
            receivedAt: entryTime.toISOString(),
          });
        }
      }
    } else if (cleanData.length > 0) {
      formattedData.push({
        type: 'text',
        timestamp: receivedAt,
        data: cleanData,
        raw: trimmedLine,
        receivedAt: entryTime.toISOString(),
      });
    }
  });

  // Return data in newest-first order, matching the original serial data order
  return formattedData;
};

// Function to render formatted ESP32 sensor data with simple design
const renderFormattedSensorData = (
  data: Record<string, unknown>,
  isDark: boolean,
) => {
  const sensorGroups = {
    'Device Info': {
      icon: 'mdi:chip',
      data: {
        'Sender MAC': data.senderMac,
        'Signal Strength': `${data.rssi} dBm`,
        Distance: `${data.rssiDistance} m`,
        Timestamp: data.timestamp,
      },
    },
    'Obstacle Detection': {
      icon: 'mdi:radar',
      data: {
        Status: data.obstacle ? '🚫 Detected' : '✅ Clear',
        'Ultrasonic Distance':
          data.ultrasonic === -1 ? 'No reading' : `${data.ultrasonic} cm`,
      },
    },
    Orientation: {
      icon: 'mdi:compass',
      data: {
        Heading:
          typeof data.heading === 'number'
            ? `${data.heading.toFixed(1)}°`
            : 'N/A',
        Direction: data.direction,
        Pitch:
          typeof data.pitch === 'number' ? `${data.pitch.toFixed(1)}°` : 'N/A',
        Roll:
          typeof data.roll === 'number' ? `${data.roll.toFixed(1)}°` : 'N/A',
        Yaw: typeof data.yaw === 'number' ? `${data.yaw.toFixed(1)}°` : 'N/A',
      },
    },
    Motion: {
      icon: 'mdi:motion',
      data: {
        Velocity: `${data.velocity} m/s`,
        'Velocity X': `${data.velocityX} m/s`,
        'Velocity Y': `${data.velocityY} m/s`,
        'Distance Traveled': `${data.distanceTraveled} m`,
        'Position X': `${data.positionX} m`,
        'Position Y': `${data.positionY} m`,
      },
    },
    Acceleration: {
      icon: 'mdi:speedometer',
      data: {
        'Linear Accel': `${data.linearAcceleration} m/s²`,
        Magnitude:
          typeof data.accelerationMagnitude === 'number'
            ? `${data.accelerationMagnitude.toFixed(3)} m/s²`
            : 'N/A',
        'Accel X':
          typeof data.accelX === 'number'
            ? `${data.accelX.toFixed(3)} m/s²`
            : 'N/A',
        'Accel Y':
          typeof data.accelY === 'number'
            ? `${data.accelY.toFixed(3)} m/s²`
            : 'N/A',
        'Accel Z':
          typeof data.accelZ === 'number'
            ? `${data.accelZ.toFixed(3)} m/s²`
            : 'N/A',
      },
    },
    Gyroscope: {
      icon: 'mdi:rotate-3d-variant',
      data: {
        'Rotation Rate':
          typeof data.rotationRate === 'number'
            ? `${data.rotationRate.toFixed(3)} rad/s`
            : 'N/A',
        'Gyro X':
          typeof data.gyroX === 'number'
            ? `${data.gyroX.toFixed(3)} rad/s`
            : 'N/A',
        'Gyro Y':
          typeof data.gyroY === 'number'
            ? `${data.gyroY.toFixed(3)} rad/s`
            : 'N/A',
        'Gyro Z':
          typeof data.gyroZ === 'number'
            ? `${data.gyroZ.toFixed(3)} rad/s`
            : 'N/A',
      },
    },
    Magnetometer: {
      icon: 'mdi:magnet',
      data: {
        'Mag X':
          typeof data.magX === 'number' ? `${data.magX.toFixed(1)} µT` : 'N/A',
        'Mag Y':
          typeof data.magY === 'number' ? `${data.magY.toFixed(1)} µT` : 'N/A',
        'Mag Z':
          typeof data.magZ === 'number' ? `${data.magZ.toFixed(1)} µT` : 'N/A',
      },
    },
  };

  return (
    <div className='space-y-3'>
      {Object.entries(sensorGroups).map(([groupName, group]) => (
        <div
          key={groupName}
          className={`p-3 rounded-lg border ${
            isDark
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className='flex items-center gap-2 mb-3'>
            <Icon
              icon={group.icon}
              width={14}
              height={14}
              className={isDark ? 'text-gray-400' : 'text-gray-500'}
            />
            <h4
              className={`text-sm font-semibold ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              {groupName}
            </h4>
          </div>

          <div className='space-y-2'>
            {Object.entries(group.data).map(([key, value]) => (
              <div
                key={key}
                className={`flex justify-between items-center py-1 px-2 rounded ${
                  isDark ? 'bg-gray-700/30' : 'bg-white/70'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {key}
                </span>
                <span
                  className={`text-xs font-mono ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface LogItem {
  id: string;
  timestamp: string;
  sessionId: number;
  logType: string;
  message: string;
  createdAt: string;
  source?: 'api' | 'serial';
  isRawSerial?: boolean; // New field to distinguish raw serial logs
}

interface LogsCardProps {
  serialBuffer?: string; // Raw serial data buffer from parent
  connectedPort?: string; // Connected port info from parent
  onClearSerialBuffer?: () => void; // Function to clear serial buffer in parent
}

const LogsCard: React.FC<LogsCardProps> = ({
  serialBuffer: externalSerialBuffer = '',
  connectedPort = '',
  onClearSerialBuffer,
}) => {
  const { isDark } = useDarkMode();
  const { isConnected } = useLocalMode();

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const [logsItems, setLogsItems] = useState<LogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [serialBuffer, setSerialBuffer] = useState<string>(''); // Local serial buffer (fallback)
  const [showFormattedView, setShowFormattedView] = useState(true); // Toggle between raw and formatted view
  const [autoScroll, setAutoScroll] = useState(true); // Auto scroll to bottom
  const [isWritingToFile, setIsWritingToFile] = useState(false); // File writing state
  const [isFirstConnection, setIsFirstConnection] = useState(true); // Track if this is first connection for header
  const [showToast, setShowToast] = useState(false); // Toast notification state
  const [toastMessage, setToastMessage] = useState(''); // Toast message
  // FIXED: Default to static tab instead of scroll
  const [activeTab, setActiveTab] = useState<'scroll' | 'static'>('static'); // Tab selection - default to static
  const [latestJsonData, setLatestJsonData] = useState<Record<
    string,
    unknown
  > | null>(null); // Latest JSON data for static view
  const hasFetched = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scroll
  const serialMonitorRef = useRef<HTMLDivElement>(null); // Ref for serial monitor auto-scroll

  // Use external serial buffer from parent (Monitoring.tsx) or fallback to local buffer
  const currentSerialBuffer = externalSerialBuffer || serialBuffer;

  // Function to show toast notification
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Hide toast after 3 seconds
  };

  // Function to handle clearing all logs
  const handleClearAllLogs = () => {
    // Clear API logs
    setLogsItems([]);
    // Clear local serial buffer (fallback)
    setSerialBuffer('');
    // Clear latest JSON data for static view
    setLatestJsonData(null);
    // Clear external serial buffer via parent callback
    if (onClearSerialBuffer) {
      onClearSerialBuffer();
    }
    showToastMessage('All logs cleared');
  };

  // Function to handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentSerialBuffer);
      showToastMessage('Logs copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToastMessage('Failed to copy logs');
    }
  };

  // Function to write logs to file (Electron only)
  const writeLogsToFile = useCallback(
    async (newData: string, isInitialConnection: boolean = false) => {
      if (!isElectron) return;
      // Use type assertion to access the writeLogsToFile method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electronAPI = window.electronAPI as any;
      console.log(
        '[LogsCard] writeLogsToFile called, electronAPI available:',
        !!electronAPI,
      );
      console.log(
        '[LogsCard] writeLogsToFile method available:',
        !!electronAPI?.writeLogsToFile,
      );

      if (!electronAPI?.writeLogsToFile) return;

      try {
        setIsWritingToFile(true);
        // Create filename with current date only (one file per day)
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `esp32-logs-${dateStr}.txt`;

        // Check if file exists first (for header)
        const fileExists = await electronAPI.checkFileExists?.(
          `logs/${filename}`,
        );

        let logEntry = '';

        // Add header if file doesn't exist or this is initial connection
        if (!fileExists || isInitialConnection) {
          const headerTimestamp = now.toISOString();
          const deviceInfo = connectedPort ? ` on ${connectedPort}` : '';
          const header = `
=================================================================
ESP32 Serial Monitor Log
=================================================================
Device: ESP32${deviceInfo}
Session started: ${headerTimestamp}
Log file: ${filename}
=================================================================

`;
          logEntry = header;
        }

        // Prepare log entry (timestamp already included in newData)
        logEntry += `${newData}\n`;

        console.log(
          '[LogsCard] Writing to file:',
          filename,
          'content length:',
          logEntry.length,
        );

        // Write to file using the new API
        const result = await electronAPI.writeLogsToFile(logEntry, filename);
        console.log('[LogsCard] Write result:', result);

        if (!result.success) {
          console.error('Failed to write logs to file:', result.error);
        }
      } catch (error) {
        console.error('Error writing logs to file:', error);
      } finally {
        setIsWritingToFile(false);
      }
    },
    [isElectron, connectedPort],
  );

  // Auto-scroll to bottom when new logs are added
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll serial monitor when data is added
  const scrollSerialMonitorToTop = () => {
    if (serialMonitorRef.current) {
      serialMonitorRef.current.scrollTop = 0;
    }
  };

  // Auto-scroll functionality untuk serial monitor
  // Since we now show newest entries at the top, scroll to top instead of bottom
  useEffect(() => {
    if (autoScroll && serialMonitorRef.current && activeTab === 'scroll') {
      serialMonitorRef.current.scrollTop = 0;
    }
  }, [currentSerialBuffer, autoScroll, activeTab]);

  // Effect to scroll when logs change or serial buffer changes
  useEffect(() => {
    scrollToBottom();
    if (autoScroll && activeTab === 'scroll') {
      scrollSerialMonitorToTop();
    }
  }, [logsItems, currentSerialBuffer, autoScroll, activeTab]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await fetch('/api/monitoring/logs');
        const data = await response.json();
        // Limit to last 100 logs to prevent performance issues
        const logs = data.data || [];
        setLogsItems(logs.slice(-100));
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []);

  // FIXED: Effect to update latest JSON data for static view
  useEffect(() => {
    if (currentSerialBuffer) {
      const formattedData = parseAndFormatSerialData(currentSerialBuffer);
      // Since parseAndFormatSerialData now returns data in newest-first order,
      // we need to find the first JSON item to get the newest
      const jsonItems = formattedData.filter((item) => item.type === 'json');
      console.log('[LogsCard] Total JSON items found:', jsonItems.length);
      if (jsonItems.length > 0) {
        // Get the first (newest) JSON item since data is in newest-first order
        const latestJson = jsonItems[0];
        console.log(
          '[LogsCard] Latest JSON data for static tab:',
          latestJson.data,
        );
        setLatestJsonData(latestJson.data as Record<string, unknown>);
      }
    }
  }, [currentSerialBuffer]);

  // Only set up local listener if no external buffer is provided (fallback mode)
  // LogsCard should NOT setup its own serial listener anymore
  // All serial data should come from parent component (Monitoring.tsx) via props
  useEffect(() => {
    // Only update local buffer if external buffer is provided
    if (externalSerialBuffer) {
      setSerialBuffer(externalSerialBuffer);
    }
  }, [externalSerialBuffer, isConnected, isElectron]);

  // Write logs to file when new serial data is received (real or test data)
  const lastSerialBufferLength = useRef(0);
  useEffect(() => {
    if (
      isElectron &&
      currentSerialBuffer.length > lastSerialBufferLength.current
    ) {
      // Get only the new data since last write
      const newData = currentSerialBuffer.substring(
        lastSerialBufferLength.current,
      );
      if (newData.trim()) {
        // For file writing, we add timestamp here to each line
        const lines = newData.trim().split('\n');
        const timestampedData = lines
          .map((line) => {
            if (line.trim()) {
              const timestamp = new Date().toISOString();
              // Mark test data in file for clarity
              const dataType = isConnected ? 'ESP32' : 'TEST_DATA';
              return `[${timestamp}] [${dataType}] ${line.trim()}`;
            }
            return '';
          })
          .filter((line) => line)
          .join('\n');

        writeLogsToFile(timestampedData, isFirstConnection && isConnected);
        if (isFirstConnection && isConnected) {
          setIsFirstConnection(false);
        }
      }
      lastSerialBufferLength.current = currentSerialBuffer.length;
    }
  }, [
    currentSerialBuffer,
    isConnected,
    isElectron,
    writeLogsToFile,
    isFirstConnection,
  ]);

  // Reset first connection flag when connection status changes
  useEffect(() => {
    if (isConnected) {
      setIsFirstConnection(true);
      lastSerialBufferLength.current = 0; // Reset buffer length when reconnecting
    }
  }, [isConnected, connectedPort]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 rounded-xl flex-1 overflow-hidden h-full ${
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

        {/* Clear logs button and view controls */}
        <div className='flex items-center gap-2'>
          {/* Only show clear button if there are API logs OR if there is serial data (connected or test data) */}
          {(logsItems.length > 0 || currentSerialBuffer.length > 0) && (
            <button
              onClick={handleClearAllLogs}
              className='px-2 py-1.5 text-xs bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 rounded-md border border-gray-200 transition-colors'
              title='Clear all logs'
            >
              <Icon icon='mdi:trash-can-outline' width={12} height={12} />
            </button>
          )}

          {/* Connection status indicator - read-only */}
          {isElectron && isConnected && (
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30'>
              <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                Connected to ESP32{connectedPort ? ` on ${connectedPort}` : ''}
              </span>
            </div>
          )}

          {/* Test data mode indicator */}
          {isElectron && !isConnected && currentSerialBuffer.length > 0 && (
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/30'>
              <div className='w-2 h-2 bg-orange-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-orange-600 dark:text-orange-400 font-medium'>
                Test Data Mode
              </span>
            </div>
          )}

          {/* File writing indicator */}
          {isElectron && isWritingToFile && (
            <div className='flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded border border-blue-200 dark:border-blue-500/30'>
              <Icon
                icon='mdi:file-document-edit'
                width={12}
                height={12}
                className='text-blue-500'
              />
              <span className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                Writing to file...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content area with proper flex layout */}
      <div className='flex flex-col w-full mt-3 flex-1 min-h-0'>
        {isLoadingLogs ? (
          <div className='flex items-center justify-center flex-1'>
            <ClipLoader size={24} color={isDark ? '#3b82f6' : '#60a5fa'} />
          </div>
        ) : (
          <>
            {/* Main logs display area - takes full available height */}
            <div className='flex-1 min-h-0 overflow-hidden'>
              {/* Combined logs container with full height */}
              <div className='h-full flex flex-col overflow-hidden'>
                {/* Regular API logs section */}
                {logsItems.filter((item) => item.source !== 'serial').length >
                  0 && (
                  <div className='flex-1 min-h-0 overflow-y-auto space-y-1.5 p-1'>
                    {' '}
                    {logsItems
                      .filter((item) => item.source !== 'serial')
                      .reverse() // Reverse to show newest logs first
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border-l-4 ${
                            item.logType === 'error'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : item.logType === 'warning'
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Icon
                                icon={
                                  item.logType === 'error'
                                    ? 'mdi:alert-circle'
                                    : item.logType === 'warning'
                                      ? 'mdi:alert'
                                      : 'mdi:information'
                                }
                                width={14}
                                height={14}
                                className={
                                  item.logType === 'error'
                                    ? 'text-red-500'
                                    : item.logType === 'warning'
                                      ? 'text-yellow-500'
                                      : 'text-blue-500'
                                }
                              />
                              <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                                {item.logType.toUpperCase()}
                              </span>
                            </div>
                            <span className='text-xs text-gray-500 font-mono'>
                              {convertTimestampToTime(item.timestamp)}
                            </span>
                          </div>
                          <p className='text-sm mt-1 text-gray-700 dark:text-gray-200'>
                            {item.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {/* Serial Monitor Data Display - takes remaining space */}
                {isElectron && currentSerialBuffer.length > 0 && (
                  <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
                    {/* Tab Navigation - minimal style */}
                    <div className='mb-2 flex justify-center'>
                      <div className='flex'>
                        {/* FIXED: Static tab first */}
                        <button
                          onClick={() => setActiveTab('static')}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === 'static'
                              ? isDark
                                ? 'text-blue-400'
                                : 'text-blue-600'
                              : isDark
                                ? 'text-gray-500 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon
                            icon='mdi:view-dashboard'
                            className='inline mr-1'
                            width={12}
                            height={12}
                          />
                          Static
                        </button>
                        <span
                          className={`mx-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                        >
                          |
                        </span>
                        <button
                          onClick={() => setActiveTab('scroll')}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === 'scroll'
                              ? isDark
                                ? 'text-blue-400'
                                : 'text-blue-600'
                              : isDark
                                ? 'text-gray-500 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon
                            icon='mdi:format-list-bulleted'
                            className='inline mr-1'
                            width={12}
                            height={12}
                          />
                          Scroll
                        </button>
                      </div>
                    </div>

                    {/* FIXED: Static view first in conditional */}
                    {activeTab === 'static' ? (
                      // Static View - Latest JSON data only
                      <div
                        className={`flex-1 min-h-0 w-full rounded-md border-l-4 border-orange-500 overflow-hidden ${
                          isDark ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}
                      >
                        <div className='h-full overflow-y-auto'>
                          {latestJsonData ? (
                            <div className='p-4'>
                              <div className='flex items-center justify-between mb-4'>
                                <div className='flex items-center gap-2'>
                                  <Icon
                                    icon='mdi:dashboard'
                                    className={
                                      isDark
                                        ? 'text-orange-400'
                                        : 'text-orange-600'
                                    }
                                    width={16}
                                    height={16}
                                  />
                                  <h3
                                    className={`text-sm font-semibold ${
                                      isDark
                                        ? 'text-orange-400'
                                        : 'text-orange-600'
                                    }`}
                                  >
                                    Latest ESP32 Data
                                  </h3>
                                </div>
                                <div
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isDark
                                      ? 'bg-orange-900/30 text-orange-300'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  Live
                                </div>
                              </div>
                              {renderFormattedSensorData(
                                latestJsonData,
                                isDark,
                              )}
                            </div>
                          ) : (
                            <div
                              className={`flex flex-col items-center justify-center h-full text-center p-4 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              <Icon
                                icon='mdi:signal-variant'
                                width={48}
                                height={48}
                                className='mb-3 opacity-50'
                              />
                              <p className='text-sm font-medium mb-1'>
                                Waiting for ESP32 data...
                              </p>
                              <p className='text-xs opacity-70'>
                                {isConnected
                                  ? 'Connect your ESP32 device to start receiving data'
                                  : 'Enable test data mode to see demo information'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Scroll View - Original scrolling behavior
                      <div
                        ref={serialMonitorRef}
                        className={`flex-1 min-h-0 w-full rounded-md border-l-4 border-blue-500 overflow-hidden ${
                          isDark ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}
                      >
                        <div className='h-full overflow-y-auto'>
                          {showFormattedView ? (
                            // Formatted Data Display
                            (() => {
                              const formattedData =
                                parseAndFormatSerialData(currentSerialBuffer);
                              // Debug: Log to verify data order
                              console.log(
                                '[LogsCard] Formatted data order (showing first 3):',
                                formattedData.slice(0, 3).map((item) => ({
                                  timestamp: item.timestamp,
                                  type: item.type,
                                  preview:
                                    typeof item.data === 'string'
                                      ? item.data.substring(0, 30) + '...'
                                      : JSON.stringify(item.data).substring(
                                          0,
                                          30,
                                        ) + '...',
                                })),
                              );
                              // Since serial data is already in newest-first order, keep that order
                              // No need to reverse for scroll tab
                              return (
                                <div className='p-3 space-y-4'>
                                  {formattedData.map(
                                    (
                                      item,
                                      index, // Data is already in newest-first order
                                    ) => (
                                      <div
                                        key={index}
                                        className='border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0'
                                      >
                                        <div className='flex items-center gap-2 mb-2'>
                                          <span className='text-xs text-gray-500 font-mono'>
                                            [{item.timestamp}]
                                          </span>
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                              item.type === 'json'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}
                                          >
                                            {item.type === 'json'
                                              ? 'JSON Data'
                                              : 'Text'}
                                          </span>
                                        </div>

                                        {item.type === 'json' ? (
                                          renderFormattedSensorData(
                                            item.data as Record<
                                              string,
                                              unknown
                                            >,
                                            isDark,
                                          )
                                        ) : (
                                          <div
                                            className={`p-2 rounded-md font-mono text-sm ${
                                              isDark
                                                ? 'bg-gray-800 text-gray-300'
                                                : 'bg-white text-gray-700'
                                            }`}
                                          >
                                            {String(item.data)}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                  {formattedData.length === 0 && (
                                    <div
                                      className={`text-center py-4 text-sm ${
                                        isDark
                                          ? 'text-gray-400'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      Waiting for serial data...
                                    </div>
                                  )}

                                  {/* Performance info */}
                                  {formattedData.length > 0 && (
                                    <div
                                      className={`text-center py-2 text-xs border-t ${
                                        isDark
                                          ? 'text-gray-500 border-gray-700'
                                          : 'text-gray-400 border-gray-200'
                                      }`}
                                    >
                                      Showing last {formattedData.length}{' '}
                                      entries (max 20 for performance)
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            // Raw Data Display - with proper wrapping for long JSON
                            // Show newest entries at the top
                            <div className='p-3 h-full overflow-y-auto'>
                              <pre
                                className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full ${
                                  isDark ? 'text-green-400' : 'text-green-700'
                                }`}
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {(() => {
                                  // Since serial data is already in newest-first order, just display it
                                  // Filter out empty lines but maintain the newest-first order
                                  const lines = currentSerialBuffer
                                    .split('\n')
                                    .filter((line) => line.trim());
                                  // Debug: Log first few lines to verify order
                                  console.log(
                                    '[LogsCard] Raw data lines order (showing first 3):',
                                    lines
                                      .slice(0, 3)
                                      .map(
                                        (line, idx) =>
                                          `${idx}: ${line.substring(0, 50)}...`,
                                      ),
                                  );
                                  return lines.join('\n');
                                })()}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state - only show when no data at all (no API logs AND no serial data) */}
                {logsItems.filter((item) => item.source !== 'serial').length ===
                  0 &&
                  currentSerialBuffer.length === 0 && (
                    <div className='flex flex-1 items-center justify-center text-center'>
                      <div className='flex flex-col items-center justify-center gap-3'>
                        <Icon
                          icon='mdi:file-document-outline'
                          width={48}
                          height={48}
                          className='text-gray-400 opacity-50'
                        />
                        <div>
                          <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            No logs available
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-500'>
                            {isElectron
                              ? 'Connect ESP32 or enable test data to see logs'
                              : 'Logs will appear here when available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Serial Monitor Controls - Show if there is serial data (connected or test data) */}
            {isElectron && currentSerialBuffer.length > 0 && (
              <div
                className={`mt-4 p-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Mobile-first responsive layout */}
                <div className='space-y-3'>
                  {/* Top row - Status info */}
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <Icon
                        icon='mdi:monitor-dashboard'
                        width={14}
                        height={14}
                        className={isDark ? 'text-gray-400' : 'text-gray-600'}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Serial Monitor
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {
                        currentSerialBuffer.split('\n').filter((l) => l.trim())
                          .length
                      }{' '}
                      lines
                    </div>
                  </div>

                  {/* Bottom row - Action buttons (full width, buttons on right) */}
                  <div className='flex items-center justify-start w-full gap-2'>
                    {activeTab === 'scroll' && (
                      <>
                        <button
                          onClick={() =>
                            setShowFormattedView(!showFormattedView)
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                            isDark
                              ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                          }`}
                          title='Toggle view mode'
                        >
                          <Icon
                            icon={
                              showFormattedView ? 'mdi:code-json' : 'mdi:eye'
                            }
                            width={12}
                            height={12}
                          />
                          {showFormattedView ? 'Raw' : 'Format'}
                        </button>
                        <button
                          onClick={() => setAutoScroll(!autoScroll)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                            autoScroll
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                              : isDark
                                ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                          }`}
                          title='Toggle auto scroll'
                        >
                          <Icon
                            icon={
                              autoScroll
                                ? 'mdi:arrow-down'
                                : 'mdi:arrow-down-bold-outline'
                            }
                            width={12}
                            height={12}
                          />
                          Auto
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleCopyToClipboard}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                      title='Copy to clipboard'
                    >
                      <Icon icon='mdi:content-copy' width={12} height={12} />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setSerialBuffer('');
                        setLatestJsonData(null);
                        if (onClearSerialBuffer) {
                          onClearSerialBuffer();
                        }
                        showToastMessage('Serial buffer cleared');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                        isDark
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      }`}
                      title='Clear buffer'
                    >
                      <Icon icon='mdi:delete-sweep' width={12} height={12} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Auto-scroll target */}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
      {/* Toast notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <div className='flex items-center gap-2'>
            <Icon
              icon='mdi:check-circle'
              width={16}
              height={16}
              className='text-green-500'
            />
            <span className='text-sm font-medium'>{toastMessage}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LogsCard;
