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
        const result = await window.electronAPI.openSerialPort(port, 115200);

        if (result.success) {
          const readingResult = await window.electronAPI.startSerialReading();
          if (readingResult.success) {
            setIsConnected(true);
            setConnectedPort(port);
            setLastSelectedPort(port); // Save the last connected port
            setReconnectAttempts(0); // Reset reconnect attempts on successful connection
            clearReconnectInterval(); // Clear any existing reconnect interval
            return true;
          } else {
            await window.electronAPI.closeSerialPort();
            return false;
          }
        } else {
          return false;
        }
      } catch {
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
  ]);

  // Check user config for local mode setting
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();
          setIsLocalMode(data.data?.localMode || false);
        }
      } catch (error) {
        console.error('Error checking local mode:', error);
      }
    };

    checkLocalMode();
  }, []);

  // Listen for serial data when in local mode and connected
  useEffect(() => {
    // Only clear data if local mode is disabled
    if (!isLocalMode) {
      setLocalData(null);
      setIsConnected(false);
      setConnectedPort(null);
      return;
    }

    // Only set up serial listener if connected
    if (!isConnected) {
      return;
    }

    // Check if running in Electron
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    if (!isElectron) {
      return; // Just return, don't reset connection state
    }

    // Listen for serial data
    const handleSerialData = (data: string) => {
      try {
        let jsonString = data.trim();

        // Check if the data has the [DEBUG] prefix
        const debugPrefix = '[DEBUG] Forwarding JSON to UART2:';
        if (jsonString.includes(debugPrefix)) {
          // Extract the JSON part after the debug prefix
          const jsonStartIndex =
            jsonString.indexOf(debugPrefix) + debugPrefix.length;
          jsonString = jsonString.substring(jsonStartIndex).trim();
        }

        // Parse JSON data from serial monitor
        const parsedData = JSON.parse(jsonString);

        // More flexible validation - just check if it looks like ESP32 data
        if (
          parsedData &&
          (typeof parsedData.timestamp === 'number' ||
            parsedData.senderMac ||
            parsedData.ultrasonic !== undefined ||
            parsedData.obstacle !== undefined)
        ) {
          setLocalData(parsedData);
        }
      } catch {
        // Ignore non-JSON data
      }
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
  }, [isLocalMode, isConnected]);

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
