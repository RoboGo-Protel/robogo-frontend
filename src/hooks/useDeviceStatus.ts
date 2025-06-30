import { useState, useEffect, useCallback } from 'react';

interface ComponentStatus {
  main: 'ON' | 'OFF';
  camera: 'ON' | 'OFF';
  ultrasonic: 'ON' | 'OFF';
  imu: 'ON' | 'OFF';
}

interface DeviceData {
  id: string;
  deviceName: string;
  status: ComponentStatus;
  cameraStreamUrl: string | null;
  updatedAt?: string;
}

interface UseDeviceStatusReturn {
  status: ComponentStatus | null;
  loading: boolean;
  error: string | null;
  updateComponent: (
    component: keyof ComponentStatus,
    newStatus: 'ON' | 'OFF',
  ) => Promise<boolean>;
  updateMultipleComponents: (
    updates: Partial<ComponentStatus>,
  ) => Promise<boolean>;
  updateAllComponents: (newStatus: 'ON' | 'OFF') => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  deviceData: DeviceData | null;
}

// Local storage keys
const DEVICE_STATUS_KEY = 'robogo_device_status';

// Default status for new devices
const DEFAULT_STATUS: ComponentStatus = {
  main: 'OFF',
  camera: 'OFF',
  ultrasonic: 'OFF',
  imu: 'OFF',
};

export function useDeviceStatus(
  deviceName: string | null,
): UseDeviceStatusReturn {
  const [status, setStatus] = useState<ComponentStatus | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get device status from localStorage
  const getStoredDeviceStatus = useCallback((name: string): ComponentStatus => {
    try {
      const stored = localStorage.getItem(`${DEVICE_STATUS_KEY}_${name}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.status || DEFAULT_STATUS;
      }
    } catch {
      // Failed to parse stored device status, return default
    }
    return DEFAULT_STATUS;
  }, []);

  // Save device status to localStorage
  const saveDeviceStatus = useCallback((name: string, deviceStatus: ComponentStatus) => {
    try {
      const deviceData = {
        id: name,
        deviceName: name,
        status: deviceStatus,
        cameraStreamUrl: null,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${DEVICE_STATUS_KEY}_${name}`, JSON.stringify(deviceData));
      return deviceData;
    } catch {
      // Failed to save device status
      return null;
    }
  }, []);

  // Fetch current device status from localStorage
  const fetchStatus = useCallback(async () => {
    if (!deviceName) {
      setStatus(null);
      setDeviceData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simulate async operation for consistency
      await new Promise(resolve => setTimeout(resolve, 50));

      const deviceStatus = getStoredDeviceStatus(deviceName);
      const data = {
        id: deviceName,
        deviceName,
        status: deviceStatus,
        cameraStreamUrl: null,
        updatedAt: new Date().toISOString(),
      };

      setStatus(deviceStatus);
      setDeviceData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch device status';
      setError(errorMessage);
      setStatus(null);
      setDeviceData(null);
    } finally {
      setLoading(false);
    }
  }, [deviceName, getStoredDeviceStatus]);

  // Update single component
  const updateComponent = useCallback(
    async (
      component: keyof ComponentStatus,
      newStatus: 'ON' | 'OFF',
    ): Promise<boolean> => {
      if (!deviceName) return false;

      try {
        setError(null);

        // Get current status
        const currentStatus = getStoredDeviceStatus(deviceName);
        
        // Update the specific component
        const updatedStatus = {
          ...currentStatus,
          [component]: newStatus,
        };

        // Save to localStorage
        const savedData = saveDeviceStatus(deviceName, updatedStatus);
        
        if (savedData) {
          setStatus(updatedStatus);
          setDeviceData(savedData);
          return true;
        } else {
          setError('Failed to update component status');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update component status';
        setError(errorMessage);
        return false;
      }
    },
    [deviceName, getStoredDeviceStatus, saveDeviceStatus],
  );

  // Update multiple components
  const updateMultipleComponents = useCallback(
    async (updates: Partial<ComponentStatus>): Promise<boolean> => {
      if (!deviceName) return false;

      try {
        setError(null);

        // Get current status
        const currentStatus = getStoredDeviceStatus(deviceName);
        
        // Apply updates
        const updatedStatus = {
          ...currentStatus,
          ...updates,
        };

        // Save to localStorage
        const savedData = saveDeviceStatus(deviceName, updatedStatus);
        
        if (savedData) {
          setStatus(updatedStatus);
          setDeviceData(savedData);
          return true;
        } else {
          setError('Failed to update components status');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update components status';
        setError(errorMessage);
        return false;
      }
    },
    [deviceName, getStoredDeviceStatus, saveDeviceStatus],
  );

  // Update all components to same status
  const updateAllComponents = useCallback(
    async (newStatus: 'ON' | 'OFF'): Promise<boolean> => {
      return updateMultipleComponents({
        main: newStatus,
        camera: newStatus,
        ultrasonic: newStatus,
        imu: newStatus,
      });
    },
    [updateMultipleComponents],
  );

  // Refresh status manually
  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Auto-fetch on deviceName change and set up polling
  useEffect(() => {
    fetchStatus();

    if (deviceName) {
      // Poll for status updates every 15 seconds
      const interval = setInterval(fetchStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, deviceName]);

  return {
    status,
    loading,
    error,
    updateComponent,
    updateMultipleComponents,
    updateAllComponents,
    refreshStatus,
    deviceData,
  };
}
