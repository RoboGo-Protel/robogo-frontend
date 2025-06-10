/**
 * Utility functions for device camera URL management
 * Provides optimized data fetching and caching for camera streams
 */

interface DeviceWithCamera {
  deviceId: string;
  deviceName: string;
  cameraStreamUrl: string;
  status: string;
}

interface UserConfigWithDevices {
  selectedDevice: string | null;
  cameraStreamUrl: string;
  streamQuality: 'low' | 'medium' | 'high';
  assignedDevices: string[];
  assignedDevicesWithUrls: DeviceWithCamera[];
  hideMonitoringControls?: boolean;
}

// Cache for user config with devices
let configCache: {
  data: UserConfigWithDevices | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch user config with all assigned devices and their camera URLs
 * Uses caching to reduce API calls
 */
export async function getUserConfigWithDevices(): Promise<UserConfigWithDevices | null> {
  try {
    // Check cache first
    if (configCache.data && Date.now() - configCache.timestamp < CACHE_TTL) {
      return configCache.data;
    }

    const response = await fetch('/api/user/config/with-devices');
    if (!response.ok) {
      throw new Error('Failed to fetch user config with devices');
    }

    const result = await response.json();
    const data = result.data;

    // Update cache
    configCache = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error('Error fetching user config with devices:', error);
    return null;
  }
}

/**
 * Get camera URL for a specific device
 * First checks the cached devices, then falls back to single device query
 */
export async function getDeviceCameraUrl(
  deviceId: string,
): Promise<string | null> {
  try {
    // Try to get from cached config first
    const configWithDevices = await getUserConfigWithDevices();
    if (configWithDevices?.assignedDevicesWithUrls) {
      const device = configWithDevices.assignedDevicesWithUrls.find(
        (d) => d.deviceId === deviceId,
      );
      if (device) {
        return device.cameraStreamUrl || null;
      }
    } // Fallback: query single device
    const response = await fetch(`/api/devices/user`);
    if (response.ok) {
      const result = await response.json();
      const device = result.data?.find(
        (d: DeviceWithCamera) => d.deviceId === deviceId,
      );
      return device?.cameraStreamUrl || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting device camera URL:', error);
    return null;
  }
}

/**
 * Get camera URL for currently selected device
 */
export async function getSelectedDeviceCameraUrl(): Promise<string | null> {
  try {
    const configWithDevices = await getUserConfigWithDevices();
    if (!configWithDevices?.selectedDevice) {
      return null;
    }

    return getDeviceCameraUrl(configWithDevices.selectedDevice);
  } catch (error) {
    console.error('Error getting selected device camera URL:', error);
    return null;
  }
}

/**
 * Get all devices with their camera URLs for current user
 */
export async function getAllUserDevicesWithCameras(): Promise<
  DeviceWithCamera[]
> {
  try {
    const configWithDevices = await getUserConfigWithDevices();
    return configWithDevices?.assignedDevicesWithUrls || [];
  } catch (error) {
    console.error('Error getting user devices with cameras:', error);
    return [];
  }
}

/**
 * Clear cache (useful when devices are updated)
 */
export function clearDeviceCameraCache(): void {
  configCache = {
    data: null,
    timestamp: 0,
  };
}

/**
 * Update specific device camera URL in cache
 */
export function updateDeviceCameraInCache(
  deviceId: string,
  cameraUrl: string,
): void {
  if (configCache.data?.assignedDevicesWithUrls) {
    const deviceIndex = configCache.data.assignedDevicesWithUrls.findIndex(
      (d) => d.deviceId === deviceId,
    );

    if (deviceIndex !== -1) {
      configCache.data.assignedDevicesWithUrls[deviceIndex].cameraStreamUrl =
        cameraUrl;
    }
  }
}

/**
 * Hook to validate camera URL format
 */
export function validateCameraUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    // Check for relative URLs or IP addresses
    const patterns = [
      /^https?:\/\/.+/i, // HTTP/HTTPS URLs
      /^ws:\/\/.+/i, // WebSocket URLs
      /^wss:\/\/.+/i, // Secure WebSocket URLs
      /^rtsp:\/\/.+/i, // RTSP URLs
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
    ];

    return patterns.some((pattern) => pattern.test(url));
  }
}

export type { DeviceWithCamera, UserConfigWithDevices };
