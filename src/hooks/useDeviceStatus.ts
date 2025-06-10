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

export function useDeviceStatus(
  deviceName: string | null,
): UseDeviceStatusReturn {
  const [status, setStatus] = useState<ComponentStatus | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current device status
  const fetchStatus = useCallback(async () => {
    if (!deviceName) {
      setStatus(null);
      setDeviceData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/devices/status?deviceName=${encodeURIComponent(deviceName)}`,
      );
      const data = await response.json();

      if (data.success) {
        setStatus(data.data.status);
        setDeviceData(data.data);
      } else {
        setError(data.message || 'Failed to fetch device status');
        setStatus(null);
        setDeviceData(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch device status';
      setError(errorMessage);
      setStatus(null);
      setDeviceData(null);
    } finally {
      setLoading(false);
    }
  }, [deviceName]);

  // Update single component
  const updateComponent = useCallback(
    async (
      component: keyof ComponentStatus,
      newStatus: 'ON' | 'OFF',
    ): Promise<boolean> => {
      if (!deviceName) return false;

      try {
        setError(null);

        const response = await fetch(
          `/api/devices/status?deviceName=${encodeURIComponent(deviceName)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [component]: newStatus }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setStatus(data.data.status);
          setDeviceData(data.data);
          return true;
        } else {
          setError(data.message || 'Failed to update component status');
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
    [deviceName],
  );

  // Update multiple components
  const updateMultipleComponents = useCallback(
    async (updates: Partial<ComponentStatus>): Promise<boolean> => {
      if (!deviceName) return false;

      try {
        setError(null);

        const response = await fetch(
          `/api/devices/status?deviceName=${encodeURIComponent(deviceName)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          },
        );

        const data = await response.json();

        if (data.success) {
          setStatus(data.data.status);
          setDeviceData(data.data);
          return true;
        } else {
          setError(data.message || 'Failed to update components status');
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
    [deviceName],
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
