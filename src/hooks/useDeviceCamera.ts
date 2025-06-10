import { useState, useEffect, useCallback } from 'react';
import {
  getUserConfigWithDevices,
  getDeviceCameraUrl,
  clearDeviceCameraCache,
  updateDeviceCameraInCache,
  type DeviceWithCamera,
  type UserConfigWithDevices,
} from '../utils/deviceCameraUtils';

interface UseDeviceCameraReturn {
  // Current state
  config: UserConfigWithDevices | null;
  selectedDeviceCameraUrl: string | null;
  allDevicesWithCameras: DeviceWithCamera[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshConfig: () => Promise<void>;
  updateCameraUrl: (deviceId: string, newUrl: string) => Promise<boolean>;
  selectDevice: (deviceId: string) => Promise<boolean>;
  clearCache: () => void;

  // Helpers
  getUrlForDevice: (deviceId: string) => Promise<string | null>;
  isDeviceSelected: (deviceId: string) => boolean;
}

/**
 * Hook for managing device camera URLs with optimized caching
 * Provides all necessary functions for camera stream management
 */
export function useDeviceCamera(): UseDeviceCameraReturn {
  const [config, setConfig] = useState<UserConfigWithDevices | null>(null);
  const [selectedDeviceCameraUrl, setSelectedDeviceCameraUrl] = useState<
    string | null
  >(null);
  const [allDevicesWithCameras, setAllDevicesWithCameras] = useState<
    DeviceWithCamera[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refresh config from server
  const refreshConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const configWithDevices = await getUserConfigWithDevices();
      if (configWithDevices) {
        setConfig(configWithDevices);
        setAllDevicesWithCameras(
          configWithDevices.assignedDevicesWithUrls || [],
        );

        // Update selected device camera URL
        if (configWithDevices.selectedDevice) {
          const selectedDevice =
            configWithDevices.assignedDevicesWithUrls?.find(
              (d) => d.deviceId === configWithDevices.selectedDevice,
            );
          setSelectedDeviceCameraUrl(
            selectedDevice?.cameraStreamUrl ||
              configWithDevices.cameraStreamUrl ||
              null,
          );
        } else {
          setSelectedDeviceCameraUrl(null);
        }
      }
    } catch (err) {
      console.error('Error refreshing device camera config:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load configuration',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Update camera URL for specific device
  const updateCameraUrl = useCallback(
    async (deviceId: string, newUrl: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/devices/${deviceId}/set-camera-url`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cameraStreamUrl: newUrl }),
          },
        );

        if (response.ok) {
          // Update cache
          updateDeviceCameraInCache(deviceId, newUrl);

          // Refresh config to get latest data
          await refreshConfig();

          return true;
        } else {
          throw new Error('Failed to update camera URL');
        }
      } catch (err) {
        console.error('Error updating camera URL:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update camera URL',
        );
        return false;
      }
    },
    [refreshConfig],
  );

  // Select a device (update user config)
  const selectDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      try {
        if (!config) return false;

        const updatedConfig = {
          ...config,
          selectedDevice: deviceId,
        };

        const response = await fetch('/api/user/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedConfig),
        });

        if (response.ok) {
          // Refresh to get updated config with camera URL
          await refreshConfig();
          return true;
        } else {
          throw new Error('Failed to update selected device');
        }
      } catch (err) {
        console.error('Error selecting device:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to select device',
        );
        return false;
      }
    },
    [config, refreshConfig],
  );

  // Clear cache
  const clearCache = useCallback(() => {
    clearDeviceCameraCache();
  }, []);

  // Get camera URL for specific device
  const getUrlForDevice = useCallback(
    async (deviceId: string): Promise<string | null> => {
      return await getDeviceCameraUrl(deviceId);
    },
    [],
  );

  // Check if device is currently selected
  const isDeviceSelected = useCallback(
    (deviceId: string): boolean => {
      return config?.selectedDevice === deviceId;
    },
    [config],
  );

  // Initialize on mount
  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  return {
    // State
    config,
    selectedDeviceCameraUrl,
    allDevicesWithCameras,
    loading,
    error,

    // Actions
    refreshConfig,
    updateCameraUrl,
    selectDevice,
    clearCache,

    // Helpers
    getUrlForDevice,
    isDeviceSelected,
  };
}

/**
 * Simplified hook for just getting the selected device camera URL
 * Useful when you only need the current camera stream
 */
export function useSelectedDeviceCamera(): {
  cameraUrl: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { selectedDeviceCameraUrl, loading, error, refreshConfig } =
    useDeviceCamera();

  return {
    cameraUrl: selectedDeviceCameraUrl,
    loading,
    error,
    refresh: refreshConfig,
  };
}

/**
 * Hook for managing camera URLs in settings/configuration screens
 * Provides bulk operations and device management
 */
export function useDeviceCameraManagement(): {
  devices: DeviceWithCamera[];
  loading: boolean;
  error: string | null;
  updateDeviceCamera: (deviceId: string, newUrl: string) => Promise<boolean>;
  refreshDevices: () => Promise<void>;
  bulkUpdateCameras: (
    updates: { deviceId: string; cameraUrl: string }[],
  ) => Promise<boolean>;
} {
  const {
    allDevicesWithCameras,
    loading,
    error,
    updateCameraUrl,
    refreshConfig,
  } = useDeviceCamera();

  const bulkUpdateCameras = useCallback(
    async (
      updates: { deviceId: string; cameraUrl: string }[],
    ): Promise<boolean> => {
      try {
        const promises = updates.map(({ deviceId, cameraUrl }) =>
          updateCameraUrl(deviceId, cameraUrl),
        );

        const results = await Promise.all(promises);
        return results.every((result) => result);
      } catch (err) {
        console.error('Error in bulk camera update:', err);
        return false;
      }
    },
    [updateCameraUrl],
  );

  return {
    devices: allDevicesWithCameras,
    loading,
    error,
    updateDeviceCamera: updateCameraUrl,
    refreshDevices: refreshConfig,
    bulkUpdateCameras,
  };
}
