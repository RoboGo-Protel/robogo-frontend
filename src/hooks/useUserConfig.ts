import { useState, useEffect, useCallback } from 'react';

interface ComponentStatus {
  main: 'ON' | 'OFF';
  camera: 'ON' | 'OFF';
  ultrasonic: 'ON' | 'OFF';
  imu: 'ON' | 'OFF';
}

interface Device {
  id: string;
  deviceName: string;
  status: string | ComponentStatus;
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
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [modeChecked, setModeChecked] = useState<boolean>(false);
  // Cek mode offline/local di awal
  useEffect(() => {
    (async () => {
      let localMode: boolean | undefined = undefined;
      if (
        typeof window !== 'undefined' &&
        window.electronAPI &&
        window.electronAPI.getConfig
      ) {
        try {
          localMode = await window.electronAPI.getConfig('localMode');
        } catch {
          localMode = undefined;
        }
      }
      if (localMode === true) {
        setIsOffline(true);

        // Load local config from Electron, including camera settings
        let localConfig: UserConfig = {
          selectedDevice: null,
          cameraStreamUrl: 'http://192.168.1.100/stream',
          streamQuality: 'medium',
          assignedDevices: [],
          hideMonitoringControls: true,
        };
        try {
          if (window.electronAPI?.getConfig) {
            const savedConfig =
              await window.electronAPI.getConfig('userConfig');
            if (
              savedConfig &&
              typeof savedConfig === 'object' &&
              !Array.isArray(savedConfig)
            ) {
              localConfig = {
                ...localConfig,
                ...(savedConfig as Partial<UserConfig>),
              };
            }
          }
        } catch (error) {
          console.warn('Failed to load local config, using defaults:', error);
        }

        setConfig(localConfig);
        setUserDevices([]);
        setSelectedDevice(null);
        setLoading(false);
        setError(null);
      } else {
        setIsOffline(false);
      }
      setModeChecked(true);
    })();
  }, []);
  // Listen for local config changes
  useEffect(() => {
    if (!isOffline || !modeChecked) return;

    const handleConfigChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Local config changed, reloading...', customEvent.detail);
      try {
        if (window.electronAPI?.getConfig) {
          const savedConfig = await window.electronAPI.getConfig('userConfig');
          if (
            savedConfig &&
            typeof savedConfig === 'object' &&
            !Array.isArray(savedConfig)
          ) {
            setConfig(savedConfig as UserConfig);
          }
        }
      } catch (error) {
        console.warn('Failed to reload config after change:', error);
      }
    };

    window.addEventListener('local-config-changed', handleConfigChange);

    return () => {
      window.removeEventListener('local-config-changed', handleConfigChange);
    };
  }, [isOffline, modeChecked]);

  const fetchUserConfig = useCallback(async () => {
    if (isOffline) return null;
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
  }, [isOffline]);

  const fetchUserDevices = useCallback(async () => {
    if (isOffline) return [];
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
  }, [isOffline]);

  const updateSelectedDevice = async (deviceId: string | null) => {
    if (isOffline) {
      setSelectedDevice(null);
      setConfig((prev) => (prev ? { ...prev, selectedDevice: null } : prev));
      setDeviceChangeVersion((prev) => prev + 1);
      return true;
    }
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
        if (deviceId && userDevices.length > 0) {
          const selected = userDevices.find(
            (device: Device) => device.id === deviceId,
          );
          setSelectedDevice(selected || null);
        } else {
          setSelectedDevice(null);
        }
        setDeviceChangeVersion((prev) => prev + 1);
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
    if (!modeChecked || isOffline) return;
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
  }, [modeChecked, isOffline, fetchUserConfig, fetchUserDevices]);

  useEffect(() => {
    if (isOffline) return;
    if (config && userDevices.length > 0 && config.selectedDevice) {
      const selected = userDevices.find(
        (device: Device) => device.id === config.selectedDevice,
      );
      setSelectedDevice(selected || null);
    }
  }, [config, userDevices, isOffline]);
  const updateConfig = useCallback(
    async (newConfig: Partial<UserConfig>) => {
      if (isOffline) {
        // In local mode, update the local state and save to Electron
        setConfig((prevConfig) => {
          if (!prevConfig) return null;
          return {
            ...prevConfig,
            ...newConfig,
          } as UserConfig;
        });

        // Save to Electron config if available
        try {
          if (window.electronAPI?.setConfig) {
            const updatedConfig = { ...config, ...newConfig };
            await window.electronAPI.setConfig('userConfig', updatedConfig);
          }
        } catch (error) {
          console.warn('Failed to save config to Electron:', error);
        }
      }
    },
    [isOffline, config],
  );

  return {
    config,
    userDevices,
    selectedDevice,
    loading,
    error,
    deviceChangeVersion,
    refetch: async () => {
      if (isOffline) {
        // In local mode, reload config from Electron
        try {
          if (window.electronAPI?.getConfig) {
            const savedConfig =
              await window.electronAPI.getConfig('userConfig');
            if (
              savedConfig &&
              typeof savedConfig === 'object' &&
              !Array.isArray(savedConfig)
            ) {
              setConfig((prevConfig) => {
                if (!prevConfig) return null;
                return {
                  ...prevConfig,
                  ...(savedConfig as Partial<UserConfig>),
                } as UserConfig;
              });
            }
          }
        } catch (error) {
          console.warn('Failed to reload local config:', error);
        }
        return;
      }

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
    updateConfig,
  };
}
