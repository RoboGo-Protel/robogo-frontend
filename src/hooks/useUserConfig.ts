import { useState, useEffect } from 'react';

interface Device {
  id: string;
  deviceName: string;
  status: string;
  user_id: string | null;
}

interface UserConfig {
  selectedDevice: string | null;
  cameraStreamUrl: string;
  streamQuality: 'low' | 'medium' | 'high';
  assignedDevices: string[];
  hideMonitoringControls?: boolean;
}

export function useUserConfig() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceChangeVersion, setDeviceChangeVersion] = useState(0);

  const fetchUserConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/config');
      if (response.ok) {
        const data = await response.json();
        const configData = data.data || {
          selectedDevice: null,
          cameraStreamUrl: 'http://192.168.1.100/stream',
          streamQuality: 'medium',
          assignedDevices: [],
          hideMonitoringControls: false,
        };
        setConfig(configData);
        return configData;
      } else {
        throw new Error('Failed to fetch user config');
      }
    } catch (err) {
      console.error('Error fetching user config:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDevices = async () => {
    try {
      const response = await fetch('/api/devices/user');
      if (response.ok) {
        const data = await response.json();
        const devices = data.data || [];
        setUserDevices(devices);
        return devices;
      } else {
        throw new Error('Failed to fetch user devices');
      }
    } catch (err) {
      console.error('Error fetching user devices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  };
  const updateSelectedDevice = async (deviceId: string | null) => {
    if (!config) return false;

    try {
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
        setConfig(updatedConfig);
          // Immediately update the selectedDevice state
        if (deviceId && userDevices.length > 0) {
          const selected = userDevices.find(
            (device: Device) => device.id === deviceId,
          );
          setSelectedDevice(selected || null);
        } else {
          setSelectedDevice(null);
        }
        
        // Increment version to force re-renders in dependent components
        setDeviceChangeVersion(prev => prev + 1);
        
        return true;
      } else {
        throw new Error('Failed to update selected device');
      }
    } catch (err) {
      console.error('Error updating selected device:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };
  useEffect(() => {
    const initializeData = async () => {
      const [configData, devices] = await Promise.all([
        fetchUserConfig(),
        fetchUserDevices(),
      ]);

      if (configData && devices && configData.selectedDevice) {
        const selected = devices.find(
          (device: Device) => device.id === configData.selectedDevice,
        );
        setSelectedDevice(selected || null);
      }
    };

    initializeData();
  }, []);
  useEffect(() => {
    if (config && userDevices.length > 0 && config.selectedDevice) {
      const selected = userDevices.find(
        (device: Device) => device.id === config.selectedDevice,
      );
      setSelectedDevice(selected || null);
    }
  }, [config, userDevices]);
  return {
    config,
    userDevices,
    selectedDevice,
    loading,
    error,
    deviceChangeVersion,
    refetch: async () => {
      const [configData, devices] = await Promise.all([
        fetchUserConfig(),
        fetchUserDevices(),
      ]);
      if (configData && devices && configData.selectedDevice) {
        const selected = devices.find(
          (device: Device) => device.id === configData.selectedDevice,
        );
        setSelectedDevice(selected || null);
      }
    },
    updateSelectedDevice,
  };
}
