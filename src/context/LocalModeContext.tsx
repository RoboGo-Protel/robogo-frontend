'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface LocalModeData {
  timestamp: number;
  receivedAt?: number; // Add receivedAt timestamp for uniqueness
  senderMac: string;
  obstacle: boolean;
  ultrasonic: number;
  heading: number;
  direction: string;
  accelerationMagnitude: number;
  linearAcceleration: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pitch: number;
  roll: number;
  yaw: number;
  rotationRate: number;
  distanceTraveled: number;
  velocity: number;
  velocityX: number;
  velocityY: number;
  magX: number;
  magY: number;
  magZ: number;
  positionX: number;
  positionY: number;
  distX: number;
  distY: number;
  rssi: number;
  rssiDistance: number;
  mainDeviceStatus?: string;
  ultrasonicSensorStatus?: string;
  imuSensorStatus?: string;
}

interface LocalModeContextType {
  isLocalMode: boolean;
  localData: LocalModeData | null;
  isConnected: boolean;
  setConnectionStatus: (connected: boolean) => void;
  connectToSerial: (port: string) => Promise<boolean>;
  disconnectSerial: () => Promise<void>;
  connectedPort: string | null;
  // Serial data for LogsCard
  serialBuffer: string;
  clearSerialBuffer: () => void;
  injectTestData: () => void;
  // Auto reconnect properties
  isAutoReconnectEnabled: boolean;
  setAutoReconnectEnabled: (enabled: boolean) => void;
  reconnectAttempts: number;
  lastSelectedPort: string | null;
  // Additional auto reconnect functions
  triggerManualReconnect: () => Promise<void>;
  resetReconnectAttempts: () => void;
}

const LocalModeContext = createContext<LocalModeContextType | undefined>(
  undefined,
);

interface LocalModeProviderProps {
  children: ReactNode;
}

export const LocalModeProvider: React.FC<LocalModeProviderProps> = ({
  children,
}) => {
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localData, setLocalData] = useState<LocalModeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPort, setConnectedPort] = useState<string | null>(null);
  const [serialBuffer, setSerialBuffer] = useState<string>('');

  // JSON buffer for handling fragmented serial data
  const [, setJsonBuffer] = useState<string>('');
  // Function to clear serial buffer
  const clearSerialBuffer = () => {
    setSerialBuffer('');
    setJsonBuffer(''); // Also clear JSON buffer
  };
  // Function to process fragmented JSON data
  const processJsonFragment = useCallback((fragment: string): void => {
    console.log('[LocalModeContext] Processing JSON fragment:', fragment);

    setJsonBuffer((prevBuffer) => {
      const updatedBuffer = prevBuffer + fragment;
      console.log('[LocalModeContext] Updated JSON buffer:', updatedBuffer);
      // Try to extract complete JSON objects from the buffer
      let buffer = updatedBuffer;

      // Keep looking for complete JSON objects until none are found
      while (buffer.length > 0) {
        // Find the start of a potential JSON object
        const jsonStartIndex = buffer.indexOf('{');
        if (jsonStartIndex === -1) {
          // No JSON start found, clear buffer of non-JSON data
          buffer = '';
          break;
        }

        // Remove any non-JSON data before the first '{'
        if (jsonStartIndex > 0) {
          console.log(
            '[LocalModeContext] Removing non-JSON prefix:',
            buffer.substring(0, jsonStartIndex),
          );
          buffer = buffer.substring(jsonStartIndex);
        }

        // Now try to find a complete JSON object starting from the beginning
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let jsonEndIndex = -1;

        for (let i = 0; i < buffer.length; i++) {
          const char = buffer[i];

          // Handle escape sequences
          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            continue;
          }

          // Handle string boundaries
          if (char === '"') {
            inString = !inString;
            continue;
          }

          // Only count braces outside of strings
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;

              // Found a complete JSON object
              if (braceCount === 0) {
                jsonEndIndex = i;
                break;
              }
            }
          }
        }

        if (jsonEndIndex !== -1) {
          // Extract the complete JSON object
          const completeJsonString = buffer.substring(0, jsonEndIndex + 1);
          console.log(
            '[LocalModeContext] Found complete JSON object (length ' +
              completeJsonString.length +
              ')',
          );
          console.log(
            '[LocalModeContext] JSON preview:',
            completeJsonString.substring(0, 100) +
              (completeJsonString.length > 100 ? '...' : ''),
          );

          try {
            // Clean the JSON string (remove any debug prefixes)
            let cleanJsonString = completeJsonString.trim();

            const debugPrefix = '[DEBUG] Forwarding JSON to UART2:';
            if (cleanJsonString.includes(debugPrefix)) {
              const prefixIndex = cleanJsonString.indexOf(debugPrefix);
              cleanJsonString = cleanJsonString
                .substring(prefixIndex + debugPrefix.length)
                .trim();
            }

            // Parse the JSON
            const parsedData = JSON.parse(cleanJsonString);
            console.log(
              '[LocalModeContext] ✅ Successfully parsed JSON! Timestamp:',
              parsedData.timestamp,
            );

            // Validate if it looks like ESP32 data
            if (
              parsedData &&
              typeof parsedData === 'object' &&
              (typeof parsedData.timestamp === 'number' ||
                parsedData.senderMac ||
                parsedData.ultrasonic !== undefined ||
                parsedData.obstacle !== undefined)
            ) {
              console.log(
                '[LocalModeContext] ✅ JSON validation passed, updating localData',
              );

              const dataWithTimestamp = {
                ...parsedData,
                timestamp: parsedData.timestamp || Date.now(),
                receivedAt: Date.now(),
              };

              setLocalData(dataWithTimestamp);
            } else {
              console.log(
                '[LocalModeContext] ❌ JSON validation failed - not ESP32 data',
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.log(
              '[LocalModeContext] ❌ Error parsing JSON:',
              errorMessage,
            );
            console.log(
              '[LocalModeContext] Failed JSON string preview:',
              completeJsonString.substring(0, 200),
            );
          }

          // Remove the processed JSON from buffer and continue looking for more
          buffer = buffer.substring(jsonEndIndex + 1);

          // If there's remaining data, log it
          if (buffer.length > 0) {
            console.log(
              '[LocalModeContext] Remaining buffer after processing (length ' +
                buffer.length +
                '):',
              buffer.substring(0, 50) + (buffer.length > 50 ? '...' : ''),
            );
          }
        } else {
          // No complete JSON found, keep the remaining buffer for next iteration
          console.log(
            '[LocalModeContext] ⏳ No complete JSON found, keeping buffer (length ' +
              buffer.length +
              ')',
          );
          console.log(
            '[LocalModeContext] Buffer preview:',
            buffer.substring(0, 100) + (buffer.length > 100 ? '...' : ''),
          );
          break;
        }
      }

      // If buffer gets too large without finding complete JSON, trim it to prevent memory issues
      if (buffer.length > 10000) {
        console.log('[LocalModeContext] Buffer too large, trimming...');
        // Keep only the last part that might contain a partial JSON
        const lastBraceIndex = buffer.lastIndexOf('{');
        if (lastBraceIndex !== -1) {
          buffer = buffer.substring(lastBraceIndex);
        } else {
          buffer = '';
        }
      }

      console.log(
        '[LocalModeContext] Final remaining buffer length:',
        buffer.length,
      );
      return buffer;
    });
  }, []);

  // Function to inject test data into serial buffer
  const injectTestData = () => {
    const testData = {
      timestamp: Date.now(),
      senderMac: '5C:01:3B:73:88:A8',
      obstacle: Math.random() > 0.7,
      ultrasonic: Math.round((Math.random() * 50 + 50) * 100) / 100, // 50-100 cm with 2 decimal places
      heading: Math.round(Math.random() * 360 * 100) / 100, // 0-360° with 2 decimal places
      direction: [
        'North',
        'Northeast',
        'East',
        'Southeast',
        'South',
        'Southwest',
        'West',
        'Northwest',
      ][Math.floor(Math.random() * 8)],
      accelerationMagnitude:
        Math.round((Math.random() * 1.5 + 0.5) * 1000) / 1000, // 0.5-2 with 3 decimal places
      linearAcceleration: Math.round(Math.random() * 0.1 * 1000) / 1000,
      accelX: Math.round((Math.random() - 0.5) * 0.02 * 1000000) / 1000000, // 6 decimal places like original
      accelY: Math.round((Math.random() - 0.5) * 0.02 * 1000000) / 1000000,
      accelZ: Math.round((Math.random() * 0.2 + 0.9) * 1000000) / 1000000, // Around 0.98 like original
      gyroX: Math.round((Math.random() - 0.5) * 4 * 100000) / 100000,
      gyroY: Math.round((Math.random() - 0.5) * 4 * 100000) / 100000,
      gyroZ: Math.round((Math.random() - 0.5) * 4 * 100000) / 100000,
      pitch: Math.round((Math.random() - 0.5) * 1 * 1000000) / 1000000, // Small values like original
      roll: Math.round((Math.random() - 0.5) * 1 * 1000000) / 1000000,
      yaw: Math.round(Math.random() * 360 * 100000) / 100000, // Same as heading with more precision      rotationRate: Math.round(Math.random() * 3 * 1000000) / 1000000,
      distanceTraveled: Math.round(Math.random() * 500 * 100) / 100, // 0-500 cm with 2 decimal places
      velocity: Math.round(Math.random() * 2 * 1000) / 1000, // 0-2 m/s with 3 decimal places
      velocityX: Math.round((Math.random() - 0.5) * 1.5 * 1000) / 1000, // -0.75 to 0.75 m/s
      velocityY: Math.round((Math.random() - 0.5) * 1.5 * 1000) / 1000, // -0.75 to 0.75 m/s
      magX: Math.round((Math.random() - 0.5) * 300 * 10000) / 10000, // Magnetometer values
      magY: Math.round((Math.random() - 0.5) * 300 * 10000) / 10000,
      magZ: Math.round((Math.random() - 0.5) * 300 * 10000) / 10000,
      positionX: Math.round((Math.random() - 0.5) * 100 * 100) / 100, // -50 to 50 with 2 decimal places
      positionY: Math.round((Math.random() - 0.5) * 100 * 100) / 100, // -50 to 50 with 2 decimal places
      distX: Math.round(Math.random() * 200 * 100) / 100, // 0-200 cm with 2 decimal places
      distY: Math.round(Math.random() * 200 * 100) / 100, // 0-200 cm with 2 decimal places
      rssi: Math.floor(Math.random() * 40) - 80, // -80 to -40 dBm
      rssiDistance: Math.round((Math.random() * 5 + 1) * 10) / 10, // 1-6 meters with 1 decimal
      rotationRate: Math.round(Math.random() * 3 * 1000000) / 1000000, // 0-3 rad/s with 6 decimal places
      mainDeviceStatus: 'active', // Not in original format, keeping for compatibility
      ultrasonicSensorStatus: 'active',
      imuSensorStatus: 'active',
    };
    try {
      const jsonString = JSON.stringify(testData);
      const timestamp = new Date().toISOString();

      // Add to serial buffer with timestamp (similar to real serial data)
      const newLog = `${timestamp} | ${jsonString}`;
      setSerialBuffer((prev) => (prev ? `${newLog}\n${prev}` : newLog)); // Also directly set localData for immediate UI update
      const dataWithTimestamp = {
        ...testData,
        timestamp: testData.timestamp || Date.now(),
        receivedAt: Date.now(), // Add a received timestamp for uniqueness
      } as LocalModeData;
      setLocalData(dataWithTimestamp);

      console.log('[LocalModeContext] Test data injected:', jsonString);
      console.log(
        '[LocalModeContext] localData updated with:',
        dataWithTimestamp,
      );
    } catch (error) {
      console.error('[LocalModeContext] Error injecting test data:', error);
    }
  };

  // Auto reconnect states
  const [isAutoReconnectEnabled, setIsAutoReconnectEnabled] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastSelectedPort, setLastSelectedPort] = useState<string | null>(null);
  const [reconnectInterval, setReconnectInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Maximum reconnect attempts and delay
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Clear reconnect interval
  const clearReconnectInterval = useCallback(() => {
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      setReconnectInterval(null);
    }
  }, [reconnectInterval]);

  // Connect to serial with auto reconnect support
  const connectToSerial = useCallback(
    async (port: string): Promise<boolean> => {
      if (!window.electronAPI) {
        return false;
      }
      try {
        console.log(`[LocalModeContext] Attempting to connect to ${port}`);
        const result = await window.electronAPI.openSerialPort(port, 115200);
        console.log(`[LocalModeContext] Open serial port result:`, result);

        if (result.success) {
          const readingResult = await window.electronAPI.startSerialReading();
          console.log(
            `[LocalModeContext] Start serial reading result:`,
            readingResult,
          );

          if (readingResult.success) {
            console.log(
              `[LocalModeContext] Setting connection state: connected to ${port}`,
            );
            setIsConnected(true);
            setConnectedPort(port);
            setLastSelectedPort(port); // Save the last connected port
            setReconnectAttempts(0); // Reset reconnect attempts on successful connection
            clearReconnectInterval(); // Clear any existing reconnect interval

            // Add a small delay to ensure state updates propagate
            setTimeout(() => {
              console.log(
                `[LocalModeContext] State should be updated now. isConnected: true, connectedPort: ${port}`,
              );
            }, 100);

            return true;
          } else {
            console.log(
              `[LocalModeContext] Serial reading failed, closing port`,
            );
            await window.electronAPI.closeSerialPort();
            return false;
          }
        } else {
          console.log(
            `[LocalModeContext] Failed to open serial port:`,
            result.message,
          );
          return false;
        }
      } catch (error) {
        console.error(`[LocalModeContext] Error during connection:`, error);
        return false;
      }
    },
    [clearReconnectInterval],
  );

  // Auto reconnect function
  const attemptReconnect = useCallback(async () => {
    if (!isAutoReconnectEnabled || !lastSelectedPort || isConnected) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached, stopping auto reconnect');
      clearReconnectInterval();
      return;
    }

    console.log(
      `Attempting to reconnect to ${lastSelectedPort} (attempt ${reconnectAttempts + 1})`,
    );
    setReconnectAttempts((prev) => prev + 1);

    const success = await connectToSerial(lastSelectedPort);
    if (success) {
      console.log('Reconnection successful');
      setReconnectAttempts(0);
      clearReconnectInterval();
    }
  }, [
    isAutoReconnectEnabled,
    lastSelectedPort,
    isConnected,
    reconnectAttempts,
    MAX_RECONNECT_ATTEMPTS,
    clearReconnectInterval,
    connectToSerial,
  ]);

  // Start auto reconnect
  const startAutoReconnect = useCallback(() => {
    if (!isAutoReconnectEnabled || !lastSelectedPort || reconnectInterval) {
      return;
    }

    console.log('Starting auto reconnect...');
    const interval = setInterval(attemptReconnect, RECONNECT_DELAY);
    setReconnectInterval(interval);
  }, [
    isAutoReconnectEnabled,
    lastSelectedPort,
    reconnectInterval,
    attemptReconnect,
    RECONNECT_DELAY,
  ]);

  // Manual reconnect function
  const triggerManualReconnect = useCallback(async () => {
    if (!lastSelectedPort) {
      console.log('No previous port to reconnect to');
      return;
    }

    console.log('Manual reconnect triggered');
    setReconnectAttempts(0);
    clearReconnectInterval();

    const success = await connectToSerial(lastSelectedPort);
    if (!success && isAutoReconnectEnabled) {
      startAutoReconnect();
    }
  }, [
    lastSelectedPort,
    clearReconnectInterval,
    connectToSerial,
    isAutoReconnectEnabled,
    startAutoReconnect,
  ]);

  // Reset reconnect attempts
  const resetReconnectAttempts = useCallback(() => {
    setReconnectAttempts(0);
  }, []);
  // Disconnect serial
  const disconnectSerial = async (): Promise<void> => {
    if (!window.electronAPI) {
      return;
    }

    try {
      await window.electronAPI.closeSerialPort();
      setIsConnected(false);
      setConnectedPort(null);
      setLocalData(null);
      setSerialBuffer(''); // Clear serial buffer when disconnecting
      setJsonBuffer(''); // Clear JSON buffer when disconnecting
      // Stop auto reconnect when manually disconnecting
      setIsAutoReconnectEnabled(false);
      clearReconnectInterval();
    } catch {
      // Ignore errors
    }
  };

  // Set connection status
  const setConnectionStatus = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setConnectedPort(null);
      setLocalData(null);
    }
  };

  // Monitor connection status for auto reconnect
  useEffect(() => {
    if (!isLocalMode || !isAutoReconnectEnabled || !lastSelectedPort) {
      return;
    }

    if (!isConnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      startAutoReconnect();
    } else if (isConnected) {
      clearReconnectInterval();
      setReconnectAttempts(0);
    }

    return () => {
      clearReconnectInterval();
    };
  }, [
    isConnected,
    isLocalMode,
    isAutoReconnectEnabled,
    lastSelectedPort,
    reconnectAttempts,
    clearReconnectInterval,
    startAutoReconnect,
    MAX_RECONNECT_ATTEMPTS,
  ]); // Check user config for local mode setting
  useEffect(() => {
    let isMounted = true;
    const cacheKey = 'localModeConfig';
    const cacheTimeKey = 'localModeConfigTime';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    const checkLocalMode = async () => {
      try {
        // Check if we have cached data that's still valid
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedTime && cachedData) {
          const timeDiff = Date.now() - parseInt(cachedTime);
          if (timeDiff < CACHE_DURATION) {
            console.log('[LocalModeContext] Using cached local mode config');
            if (isMounted) {
              setIsLocalMode(cachedData === 'true');
            }
            return;
          }
        }

        // In Electron mode, use Electron's config instead of server API
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          console.log(
            '[LocalModeContext] Using Electron config for local mode',
          );
          const mode = await window.electronAPI.getConfig('localMode');
          if (isMounted) {
            const isLocal = !!mode;
            setIsLocalMode(isLocal);
            // Cache the result
            localStorage.setItem(cacheKey, isLocal.toString());
            localStorage.setItem(cacheTimeKey, Date.now().toString());
          }
          return;
        }

        // In web mode, use server API
        console.log('[LocalModeContext] Using server API for local mode');
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            const isLocal = data.data?.localMode || false;
            setIsLocalMode(isLocal);
            // Cache the result
            localStorage.setItem(cacheKey, isLocal.toString());
            localStorage.setItem(cacheTimeKey, Date.now().toString());
          }
        } else {
          console.log(
            '[LocalModeContext] Server API failed, defaulting to false',
          );
          if (isMounted) {
            setIsLocalMode(false);
          }
        }
      } catch (error) {
        console.error('Error checking local mode:', error);
        if (isMounted) {
          setIsLocalMode(false);
        }
      }
    };

    checkLocalMode();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for serial data when in local mode and connected
  useEffect(() => {
    // Only clear data if local mode is disabled
    if (!isLocalMode) {
      setLocalData(null);
      setIsConnected(false);
      setConnectedPort(null);
      setSerialBuffer(''); // Clear serial buffer when local mode is disabled
      setJsonBuffer(''); // Clear JSON buffer when local mode is disabled
      return;
    }

    // Only set up serial listener if connected
    if (!isConnected) {
      return;
    } // Check if running in Electron
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    if (!isElectron) {
      return; // Just return, don't reset connection state
    } // Listen for serial data
    const handleSerialData = (data: string) => {
      console.log('[LocalModeContext] ===== SERIAL DATA RECEIVED =====');
      console.log('[LocalModeContext] Data length:', data.length);
      console.log('[LocalModeContext] Data type:', typeof data);
      console.log(
        '[LocalModeContext] First 500 chars:',
        data.substring(0, 500),
      );
      console.log('[LocalModeContext] ==================================');

      // Store raw data for LogsCard (always do this first)
      // Add timestamp to each block for better tracking
      const timestamp = new Date().toISOString();
      setSerialBuffer((prev) => {
        const newBuffer = `[${timestamp}] ${data}\n` + prev;
        // Prevent buffer from growing too large (keep last 100KB of data)
        if (newBuffer.length > 100000) {
          return newBuffer.substring(0, 100000);
        }
        return newBuffer;
      });

      const trimmedData = data.trim();
      if (!trimmedData) return; // Skip empty data

      // Quick format detection and prioritized parsing
      const hasKeyValue =
        trimmedData.includes('=') && trimmedData.includes(',');
      const isJsonLike =
        trimmedData.startsWith('{') && trimmedData.endsWith('}');
      const isReadableFormat = trimmedData.startsWith('READABLE_DATA|');
      const isEsp32HumanReadable =
        trimmedData.includes('====== SENT DATA ======') ||
        trimmedData.includes('Timestamp:') ||
        trimmedData.includes('Accel (') ||
        trimmedData.includes('Heading:') ||
        trimmedData.includes('Ultrasonic Distance:');

      // Try ESP32 human-readable format FIRST (highest priority)
      if (isEsp32HumanReadable) {
        console.log(
          '[LocalModeContext] Attempting ESP32 human-readable parsing...',
        );
        const esp32Data = parseESP32HumanReadable(trimmedData);
        if (esp32Data) {
          const dataWithTimestamp = {
            ...esp32Data,
            timestamp: esp32Data.timestamp || Date.now(),
            receivedAt: Date.now(),
          };

          setLocalData(dataWithTimestamp);
          console.log(
            '[LocalModeContext] ✅ Data updated from ESP32 human-readable format',
          );
          return; // Success - exit early
        }
        console.log(
          '[LocalModeContext] ESP32 human-readable parsing failed, trying other formats...',
        );
      }

      // Try readable format SECOND (READABLE_DATA| format)
      if (isReadableFormat) {
        console.log('[LocalModeContext] Attempting readable format parsing...');
        const readableData = parseReadableFormat(trimmedData);
        if (readableData) {
          const dataWithTimestamp = {
            ...readableData,
            timestamp: readableData.timestamp || Date.now(),
            receivedAt: Date.now(),
          };

          setLocalData(dataWithTimestamp);
          console.log(
            '[LocalModeContext] ✅ Data updated from readable format',
          );
          return; // Success - exit early
        }
        console.log(
          '[LocalModeContext] Readable format parsing failed, trying other formats...',
        );
      }

      // Try simple key=value format SECOND (more reliable and faster than JSON)
      if (hasKeyValue) {
        console.log(
          '[LocalModeContext] Attempting simple key=value parsing...',
        );
        const simpleData = parseSimpleFormat(trimmedData);
        if (simpleData) {
          const dataWithTimestamp = {
            ...simpleData,
            timestamp: simpleData.timestamp || Date.now(),
            receivedAt: Date.now(),
          };

          setLocalData(dataWithTimestamp);
          console.log('[LocalModeContext] ✅ Data updated from simple format');
          return; // Success - exit early
        }
        console.log(
          '[LocalModeContext] Simple format parsing failed, trying JSON fallback...',
        );
      }

      // Fallback to JSON format if simple format fails or not detected
      if (isJsonLike) {
        console.log('[LocalModeContext] Attempting JSON parsing...');
        try {
          const parsedData = JSON.parse(trimmedData);

          // Quick validation for ESP32 data
          if (
            parsedData &&
            typeof parsedData === 'object' &&
            (parsedData.timestamp ||
              parsedData.senderMac ||
              parsedData.ultrasonic !== undefined)
          ) {
            const dataWithTimestamp = {
              ...parsedData,
              timestamp: parsedData.timestamp || Date.now(),
              receivedAt: Date.now(),
            };

            setLocalData(dataWithTimestamp);
            console.log('[LocalModeContext] ✅ Data updated from JSON format');
            return; // Success - exit early
          }

          console.log(
            '[LocalModeContext] JSON validation failed - not ESP32 data',
          );
        } catch (error) {
          console.log(
            '[LocalModeContext] JSON parsing failed:',
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Log unrecognized format for debugging
      console.log(
        '[LocalModeContext] ❌ Unrecognized data format. Preview:',
        trimmedData.substring(0, 50) + (trimmedData.length > 50 ? '...' : ''),
      );
    };

    // Set up listener
    if (window.electronAPI) {
      window.electronAPI.onSerialData(handleSerialData);
    }
    return () => {
      // Cleanup listener
      if (window.electronAPI) {
        window.electronAPI.removeSerialDataListener();
      }
    };
  }, [isLocalMode, isConnected, processJsonFragment]); // Function to parse readable format (READABLE_DATA|key=value|key=value)
  const parseReadableFormat = (data: string): LocalModeData | null => {
    try {
      console.log(
        '[LocalModeContext] Parsing readable format data:',
        data.substring(0, 100) + '...',
      );

      // Remove the READABLE_DATA prefix
      if (!data.startsWith('READABLE_DATA|')) {
        return null;
      }

      const cleanData = data.substring('READABLE_DATA|'.length);

      // Split by pipe and parse key=value pairs
      const pairs = cleanData.split('|');
      const result: Record<string, unknown> = {};
      let validFieldCount = 0;
      let totalParsedFields = 0;

      for (const pair of pairs) {
        const equalIndex = pair.indexOf('=');
        if (equalIndex === -1) continue;

        const key = pair.substring(0, equalIndex).trim();
        const value = pair.substring(equalIndex + 1).trim();

        if (!key || value === '') continue; // Allow value to be 0 or false

        // Enhanced type conversion with better number handling
        if (value === 'true' || value === 'YES') {
          result[key] = true;
        } else if (value === 'false' || value === 'NO') {
          result[key] = false;
        } else if (value === 'null' || value === 'undefined') {
          result[key] = null;
        } else {
          // Try to parse as number
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            result[key] = numValue;
          } else {
            // Store as string, removing quotes if present
            result[key] = value.replace(/^["']|["']$/g, '');
          }
        }

        totalParsedFields++;

        // Count critical ESP32 fields for validation
        const criticalFields = [
          'timestamp',
          'senderMac',
          'ultrasonic',
          'obstacle',
          'heading',
          'accelX',
          'gyroX',
          'pitch',
          'velocity',
        ];
        if (criticalFields.includes(key)) {
          validFieldCount++;
        }
      }

      console.log(
        `[LocalModeContext] Parsed ${totalParsedFields} total fields, ${validFieldCount} critical fields from readable format`,
      );

      // Enhanced validation - require at least 4 critical fields AND minimum total fields
      const hasMinimumData = validFieldCount >= 4 && totalParsedFields >= 8;
      const hasRequiredFields =
        result.timestamp || result.senderMac || result.ultrasonic !== undefined;

      if (hasMinimumData && hasRequiredFields) {
        console.log('[LocalModeContext] ✅ Readable format validation passed');

        // Ensure required fields have default values if missing
        const processedResult = {
          timestamp: result.timestamp || Date.now(),
          senderMac: result.senderMac || 'Unknown',
          obstacle: result.obstacle || false,
          ultrasonic: result.ultrasonic || 0,
          heading: result.heading || 0,
          direction: result.direction || 'Unknown',
          accelerationMagnitude: result.accelerationMagnitude || 0,
          linearAcceleration: result.linearAcceleration || 0,
          accelX: result.accelX || 0,
          accelY: result.accelY || 0,
          accelZ: result.accelZ || 0,
          gyroX: result.gyroX || 0,
          gyroY: result.gyroY || 0,
          gyroZ: result.gyroZ || 0,
          pitch: result.pitch || 0,
          roll: result.roll || 0,
          yaw: result.yaw || 0,
          rotationRate: result.rotationRate || 0,
          distanceTraveled: result.distanceTraveled || 0,
          velocity: result.velocity || 0,
          velocityX: result.velocityX || 0,
          velocityY: result.velocityY || 0,
          magX: result.magX || 0,
          magY: result.magY || 0,
          magZ: result.magZ || 0,
          positionX: result.positionX || 0,
          positionY: result.positionY || 0,
          distX: result.distX || 0,
          distY: result.distY || 0,
          rssi: result.rssi || -128,
          rssiDistance: result.rssiDistance || 0,
          // Add optional status fields
          mainDeviceStatus: result.mainDeviceStatus || 'Unknown',
          ultrasonicSensorStatus: result.ultrasonicSensorStatus || 'Unknown',
          imuSensorStatus: result.imuSensorStatus || 'Unknown',
          ...result, // Spread any additional fields
        } as LocalModeData;

        return processedResult;
      }

      console.log(
        `[LocalModeContext] ❌ Readable format validation failed - valid fields: ${validFieldCount}, total: ${totalParsedFields}`,
      );
      return null;
    } catch (error) {
      console.log('[LocalModeContext] Error parsing readable format:', error);
      return null;
    }
  };

  // Function to parse simple key=value format (enhanced robust version)
  const parseSimpleFormat = (data: string): LocalModeData | null => {
    try {
      console.log(
        '[LocalModeContext] Parsing simple format data:',
        data.substring(0, 100) + '...',
      );

      // Clean the data - remove common debug prefixes and whitespace
      let cleanData = data.trim();

      // Remove debug prefixes if present
      const debugPrefixes = [
        '[DEBUG] Forwarding JSON to UART2:',
        '[TEST_DATA]',
        '[ESP32]',
        '[INFO]',
        '[DEBUG]',
      ];

      for (const prefix of debugPrefixes) {
        if (cleanData.includes(prefix)) {
          const prefixIndex = cleanData.indexOf(prefix);
          cleanData = cleanData.substring(prefixIndex + prefix.length).trim();
        }
      }

      // Split by comma and parse key=value pairs
      const pairs = cleanData.split(',');
      const result: Record<string, unknown> = {};
      let validFieldCount = 0;
      let totalParsedFields = 0;

      for (const pair of pairs) {
        const equalIndex = pair.indexOf('=');
        if (equalIndex === -1) continue;

        const key = pair.substring(0, equalIndex).trim();
        const value = pair.substring(equalIndex + 1).trim();

        if (!key || value === '') continue; // Allow value to be 0 or false

        // Enhanced type conversion with better number handling
        if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else if (value === 'null' || value === 'undefined') {
          result[key] = null;
        } else {
          // Try to parse as number
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            result[key] = numValue;
          } else {
            // Store as string, removing quotes if present
            result[key] = value.replace(/^["']|["']$/g, '');
          }
        }

        totalParsedFields++;

        // Count critical ESP32 fields for validation
        const criticalFields = [
          'timestamp',
          'senderMac',
          'ultrasonic',
          'obstacle',
          'heading',
          'accelX',
          'gyroX',
          'pitch',
          'velocity',
        ];
        if (criticalFields.includes(key)) {
          validFieldCount++;
        }
      }

      console.log(
        `[LocalModeContext] Parsed ${totalParsedFields} total fields, ${validFieldCount} critical fields`,
      );

      // Enhanced validation - require at least 4 critical fields AND minimum total fields
      const hasMinimumData = validFieldCount >= 4 && totalParsedFields >= 8;
      const hasRequiredFields =
        result.timestamp || result.senderMac || result.ultrasonic !== undefined;

      if (hasMinimumData && hasRequiredFields) {
        console.log('[LocalModeContext] ✅ Simple format validation passed');

        // Ensure required fields have default values if missing
        const processedResult = {
          timestamp: result.timestamp || Date.now(),
          senderMac: result.senderMac || 'Unknown',
          obstacle: result.obstacle || false,
          ultrasonic: result.ultrasonic || 0,
          heading: result.heading || 0,
          direction: result.direction || 'Unknown',
          accelerationMagnitude: result.accelerationMagnitude || 0,
          linearAcceleration: result.linearAcceleration || 0,
          accelX: result.accelX || 0,
          accelY: result.accelY || 0,
          accelZ: result.accelZ || 0,
          gyroX: result.gyroX || 0,
          gyroY: result.gyroY || 0,
          gyroZ: result.gyroZ || 0,
          pitch: result.pitch || 0,
          roll: result.roll || 0,
          yaw: result.yaw || 0,
          rotationRate: result.rotationRate || 0,
          distanceTraveled: result.distanceTraveled || 0,
          velocity: result.velocity || 0,
          velocityX: result.velocityX || 0,
          velocityY: result.velocityY || 0,
          magX: result.magX || 0,
          magY: result.magY || 0,
          magZ: result.magZ || 0,
          positionX: result.positionX || 0,
          positionY: result.positionY || 0,
          distX: result.distX || 0,
          distY: result.distY || 0,
          rssi: result.rssi || -128,
          rssiDistance: result.rssiDistance || 0,
          // Add optional status fields
          mainDeviceStatus: result.mainDeviceStatus || 'Unknown',
          ultrasonicSensorStatus: result.ultrasonicSensorStatus || 'Unknown',
          imuSensorStatus: result.imuSensorStatus || 'Unknown',
          ...result, // Spread any additional fields
        } as LocalModeData;

        return processedResult;
      }

      console.log(
        `[LocalModeContext] ❌ Simple format validation failed - valid fields: ${validFieldCount}, total: ${totalParsedFields}`,
      );
      return null;
    } catch (error) {
      console.log('[LocalModeContext] Error parsing simple format:', error);
      return null;
    }
  };

  // Function to parse ESP32 human-readable format data (multi-line blocks)
  const parseESP32HumanReadable = (data: string): LocalModeData | null => {
    try {
      console.log(
        '[LocalModeContext] parseESP32HumanReadable - Input data length:',
        data.length,
      );
      console.log(
        '[LocalModeContext] parseESP32HumanReadable - First 300 chars:',
        data.substring(0, 300),
      );

      const result: Record<string, unknown> = {};
      let validFieldCount = 0;

      // Handle both single line and multi-line formats
      let processData = data;

      // If this looks like a multi-line ESP32 block, extract it properly
      if (data.includes('====') && data.includes('ESP32')) {
        // This is a complete block, process as-is
        processData = data;
      }

      // Split into lines and process each line
      const lines = processData
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      console.log(
        '[LocalModeContext] parseESP32HumanReadable - Processing',
        lines.length,
        'lines',
      );

      for (const line of lines) {
        // Parse magnetometer: Mag (uT): X=78.58 Y=89.15 Z=-2331.04
        const magMatch = line.match(
          /Mag.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
        );
        if (magMatch) {
          result.magX = parseFloat(magMatch[1]);
          result.magY = parseFloat(magMatch[2]);
          result.magZ = parseFloat(magMatch[3]);
          validFieldCount++;
          continue;
        }

        // Parse accelerometer: Accel (bias-corr g): X=0.009 Y=-0.000 Z=1.004
        const accelMatch = line.match(
          /Accel.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
        );
        if (accelMatch) {
          result.accelX = parseFloat(accelMatch[1]);
          result.accelY = parseFloat(accelMatch[2]);
          result.accelZ = parseFloat(accelMatch[3]);
          validFieldCount++;
          continue;
        }

        // Parse gyroscope: Gyro (dps): X=-0.09 Y=0.49 Z=-0.12
        const gyroMatch = line.match(
          /Gyro.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
        );
        if (gyroMatch) {
          result.gyroX = parseFloat(gyroMatch[1]);
          result.gyroY = parseFloat(gyroMatch[2]);
          result.gyroZ = parseFloat(gyroMatch[3]);
          validFieldCount++;
          continue;
        }

        // Parse combined pitch, roll, yaw: Pitch: 0.46 °, Roll: 0.00 °, Yaw: 276.79 °
        const combinedOrientationMatch = line.match(
          /Pitch:\s*([-\d.]+)\s*°.*?Roll:\s*([-\d.]+)\s*°.*?Yaw:\s*([-\d.]+)\s*°/,
        );
        if (combinedOrientationMatch) {
          result.pitch = parseFloat(combinedOrientationMatch[1]);
          result.roll = parseFloat(combinedOrientationMatch[2]);
          result.yaw = parseFloat(combinedOrientationMatch[3]);
          validFieldCount++;
          continue;
        }

        // Parse separate pitch and roll: Pitch: -0.75° Roll: -1.09°
        const pitchRollMatch = line.match(
          /Pitch:\s*([-\d.]+)°\s+Roll:\s*([-\d.]+)°/,
        );
        if (pitchRollMatch) {
          result.pitch = parseFloat(pitchRollMatch[1]);
          result.roll = parseFloat(pitchRollMatch[2]);
          validFieldCount++;
          continue;
        }

        // Parse separate yaw: Yaw: 276.79°
        const yawMatch = line.match(/Yaw:\s*([-\d.]+)°/);
        if (yawMatch && !result.yaw) {
          result.yaw = parseFloat(yawMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse heading: Heading: 276.79 ° (West)
        const headingMatch = line.match(/Heading:\s*([-\d.]+)\s*°\s*\((\w+)\)/);
        if (headingMatch) {
          result.heading = parseFloat(headingMatch[1]);
          result.direction = headingMatch[2];
          validFieldCount++;
          continue;
        }

        // Parse ultrasonic: Ultrasonic Distance: 3.52 cm
        const ultrasonicMatch = line.match(
          /Ultrasonic Distance:\s*([-\d.]+)\s*cm/,
        );
        if (ultrasonicMatch) {
          result.ultrasonic = parseFloat(ultrasonicMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse obstacle: Obstacle Detected: YES/NO
        const obstacleMatch = line.match(/Obstacle Detected:\s*(YES|NO)/);
        if (obstacleMatch) {
          result.obstacle = obstacleMatch[1] === 'YES';
          validFieldCount++;
          continue;
        }

        // Parse position: Current Pos (KF Displacement): (-3802951.25, -2584435.75) cm
        const positionMatch = line.match(
          /Current Pos.*?\(([-\d.]+),\s*([-\d.]+)\)\s*cm/,
        );
        if (positionMatch) {
          result.positionX = parseFloat(positionMatch[1]);
          result.positionY = parseFloat(positionMatch[2]);
          validFieldCount++;
          continue;
        }

        // Parse velocity: Velocity (KF): 26807.59 cm/s (Vx=-19318.75, Vy=-18585.83)
        const velocityMatch = line.match(
          /Velocity.*?:\s*([-\d.]+)\s*cm\/s.*?Vx=([-\d.]+),\s*Vy=([-\d.]+)/,
        );
        if (velocityMatch) {
          result.velocity = parseFloat(velocityMatch[1]);
          result.velocityX = parseFloat(velocityMatch[2]);
          result.velocityY = parseFloat(velocityMatch[3]);
          validFieldCount++;
          continue;
        }

        // Parse distance traveled: Total Distance Traveled (KF): 4752065.50 cm
        const distanceTraveledMatch = line.match(
          /Total Distance Traveled.*?:\s*([-\d.]+)\s*cm/,
        );
        if (distanceTraveledMatch) {
          result.distanceTraveled = parseFloat(distanceTraveledMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse rotation rate: Rotation Rate: 1.24 dps
        const rotationRateMatch = line.match(
          /Rotation Rate:\s*([-\d.]+)\s*dps/,
        );
        if (rotationRateMatch) {
          result.rotationRate = parseFloat(rotationRateMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse acceleration magnitude: Acceleration Magnitude: 1.03 g
        const accelMagMatch = line.match(
          /Acceleration Magnitude:\s*([-\d.]+)\s*g/,
        );
        if (accelMagMatch) {
          result.accelerationMagnitude = parseFloat(accelMagMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse linear acceleration: Linear Acceleration: 0.88 m/s^2
        const linearAccelMatch = line.match(
          /Linear Acceleration:\s*([-\d.]+)\s*m\/s/,
        );
        if (linearAccelMatch) {
          result.linearAcceleration = parseFloat(linearAccelMatch[1]);
          validFieldCount++;
          continue;
        }

        // Parse timestamp: Timestamp: 975090 ms
        const timestampMatch = line.match(/Timestamp:\s*(\d+)\s*ms/);
        if (timestampMatch) {
          result.timestamp = parseInt(timestampMatch[1]);
          validFieldCount++;
          continue;
        }
      }

      console.log(
        '[LocalModeContext] parseESP32HumanReadable - Final result:',
        result,
      );
      console.log(
        '[LocalModeContext] parseESP32HumanReadable - Valid field count:',
        validFieldCount,
      );

      // Return the parsed object if we have valid fields (at least 3 fields for meaningful data)
      if (validFieldCount >= 3) {
        // Add default values for required fields if missing
        const defaultData: LocalModeData = {
          timestamp: (result.timestamp as number) || Date.now(),
          receivedAt: Date.now(),
          senderMac: 'ESP32',
          obstacle: (result.obstacle as boolean) || false,
          ultrasonic: (result.ultrasonic as number) || -1,
          heading: (result.heading as number) || 0,
          direction: (result.direction as string) || 'Unknown',
          accelerationMagnitude: (result.accelerationMagnitude as number) || 0,
          linearAcceleration: (result.linearAcceleration as number) || 0,
          accelX: (result.accelX as number) || 0,
          accelY: (result.accelY as number) || 0,
          accelZ: (result.accelZ as number) || 0,
          gyroX: (result.gyroX as number) || 0,
          gyroY: (result.gyroY as number) || 0,
          gyroZ: (result.gyroZ as number) || 0,
          pitch: (result.pitch as number) || 0,
          roll: (result.roll as number) || 0,
          yaw: (result.yaw as number) || 0,
          rotationRate: (result.rotationRate as number) || 0,
          distanceTraveled: (result.distanceTraveled as number) || 0,
          velocity: (result.velocity as number) || 0,
          velocityX: (result.velocityX as number) || 0,
          velocityY: (result.velocityY as number) || 0,
          magX: (result.magX as number) || 0,
          magY: (result.magY as number) || 0,
          magZ: (result.magZ as number) || 0,
          positionX: (result.positionX as number) || 0,
          positionY: (result.positionY as number) || 0,
          distX: 0, // Not available in human-readable format
          distY: 0, // Not available in human-readable format
          rssi: -50, // Default value
          rssiDistance: 0, // Default value
        };
        return defaultData;
      }

      return null;
    } catch (error) {
      console.warn(
        '[LocalModeContext] Error parsing ESP32 human-readable format:',
        error,
      );
      return null;
    }
  };

  return (
    <LocalModeContext.Provider
      value={{
        isLocalMode,
        localData,
        isConnected,
        setConnectionStatus,
        connectToSerial,
        disconnectSerial,
        connectedPort,
        serialBuffer,
        clearSerialBuffer,
        injectTestData,
        isAutoReconnectEnabled,
        setAutoReconnectEnabled: setIsAutoReconnectEnabled,
        reconnectAttempts,
        lastSelectedPort,
        triggerManualReconnect,
        resetReconnectAttempts,
      }}
    >
      {children}
    </LocalModeContext.Provider>
  );
};

export const useLocalMode = (): LocalModeContextType => {
  const context = useContext(LocalModeContext);
  if (context === undefined) {
    throw new Error('useLocalMode must be used within a LocalModeProvider');
  }
  return context;
};
