'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ClipLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import { useMeQuery } from '@/hooks/useMeQuery';

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
  localMode?: boolean;
  // Camera field settings - stored separately
  cameraProtocol?: 'http' | 'websocket';
  cameraIpAddress?: string;
  cameraPort?: string;
  cameraPath?: string;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 40 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function SettingsClient() {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const { data: user } = useMeQuery();
  // Add hasMounted state to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(
    null,
  );
  const [unassigningDeviceId, setUnassigningDeviceId] = useState<string | null>(
    null,
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'unassign';
    deviceId: string;
    deviceName: string;
  } | null>(null);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState<UserConfig>({
    selectedDevice: null,
    cameraStreamUrl: '',
    streamQuality: 'medium',
    assignedDevices: [],
    hideMonitoringControls: false,
    localMode: false,
    cameraProtocol: undefined,
    cameraIpAddress: '',
    cameraPort: '',
    cameraPath: '',
  });
  const [originalConfig, setOriginalConfig] = useState<UserConfig>({
    selectedDevice: null,
    cameraStreamUrl: '',
    streamQuality: 'medium',
    assignedDevices: [],
    hideMonitoringControls: false,
    localMode: false,
    cameraProtocol: undefined,
    cameraIpAddress: '',
    cameraPort: '',
    cameraPath: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Electron: Logs Save Folder state
  const [logsSaveFolder, setLogsSaveFolder] = useState<string>('');
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  // Tambahkan state dan effect untuk localMode
  const [localMode, setLocalMode] = useState<boolean>(false); // Camera URL builder functions - doesn't depend on config to avoid loops
  const buildCameraUrl = useCallback(
    (protocol: string, ipAddress: string, port: string, path: string) => {
      if (!ipAddress.trim()) return '';

      if (protocol === 'http') {
        const portStr = port ? `:${port}` : '';
        const pathStr = path ? `/${path}` : '';
        return `http://${ipAddress}${portStr}${pathStr}`;
      } else {
        // websocket
        const portStr = port ? `:${port}` : ':8080';
        return `ws://${ipAddress}${portStr}`;
      }
    },
    [],
  ); // Helper function to format device status for display
  const formatDeviceStatus = (status: string | ComponentStatus): string => {
    if (typeof status === 'string') {
      return status;
    }

    if (typeof status === 'object' && status !== null) {
      // Count how many components are ON
      const onComponents = Object.entries(status).filter(
        ([, value]) => value === 'ON',
      );
      const totalComponents = Object.keys(status).length;

      if (onComponents.length === 0) {
        return 'All OFF';
      } else if (onComponents.length === totalComponents) {
        return 'All ON';
      } else {
        // Show which components are ON
        const onComponentNames = onComponents.map(
          ([key]) => key.charAt(0).toUpperCase() + key.slice(1),
        );
        return `${onComponentNames.join(', ')} ON`;
      }
    }
    return 'Unknown';
  };
  const fetchUserConfig = useCallback(async () => {
    if (
      localMode &&
      typeof window !== 'undefined' &&
      window.electronAPI?.getConfig
    ) {
      // Ambil config dari Electron
      let localCfg = await window.electronAPI.getConfig('userConfig');
      if (
        !localCfg ||
        typeof localCfg !== 'object' ||
        Array.isArray(localCfg)
      ) {
        // fallback ke default UserConfig jika kosong atau salah tipe
        localCfg = {
          selectedDevice: null,
          cameraStreamUrl: 'http://192.168.1.100/stream',
          streamQuality: 'medium',
          assignedDevices: [],
          hideMonitoringControls: false,
          localMode: true,
          cameraProtocol: 'http',
          cameraIpAddress: '192.168.1.100',
          cameraPort: '',
          cameraPath: 'stream',
        };
      }

      // Cast to UserConfig for easier manipulation
      const userConfig = localCfg as UserConfig;
      // Ensure camera fields are populated from URL if they don't exist
      if (
        userConfig.cameraStreamUrl &&
        (!userConfig.cameraProtocol || !userConfig.cameraIpAddress)
      ) {
        try {
          const urlObj = new URL(userConfig.cameraStreamUrl);
          const isWebsocket =
            urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';

          userConfig.cameraProtocol = isWebsocket ? 'websocket' : 'http';
          userConfig.cameraIpAddress = urlObj.hostname || '192.168.1.100';
          userConfig.cameraPort = urlObj.port || (isWebsocket ? '8080' : '');
          userConfig.cameraPath = !isWebsocket
            ? urlObj.pathname.startsWith('/')
              ? urlObj.pathname.substring(1)
              : urlObj.pathname || 'stream'
            : '';
        } catch {
          // Use defaults if parsing fails
          userConfig.cameraProtocol = 'http';
          userConfig.cameraIpAddress = '192.168.1.100';
          userConfig.cameraPort = '';
          userConfig.cameraPath = 'stream';
        }
      }

      // Ensure URL is always generated from fields to maintain consistency
      if (userConfig.cameraProtocol && userConfig.cameraIpAddress) {
        const generatedUrl = buildCameraUrl(
          userConfig.cameraProtocol,
          userConfig.cameraIpAddress,
          userConfig.cameraPort || '',
          userConfig.cameraPath || 'stream',
        );
        if (generatedUrl) {
          userConfig.cameraStreamUrl = generatedUrl;
        }
      }

      setConfig(userConfig);
      setOriginalConfig(userConfig);
      // Dummy devices untuk offline
      setUserDevices([
        {
          id: 'esp32-local',
          deviceName: 'ESP32 (Offline)',
          status: 'ON',
          user_id: 'guest',
        },
      ]);
      setAvailableDevices([]);
      setLoading(false);
      return;
    }
    try {
      // Use optimized endpoint that bypasses cache and gets fresh data
      const response = await fetch('/api/user/config/with-devices');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const newConfig = {
            selectedDevice: data.data.selectedDevice || null,
            cameraStreamUrl:
              data.data.cameraStreamUrl || 'http://192.168.1.100/stream',
            streamQuality: data.data.streamQuality || 'medium',
            assignedDevices: data.data.assignedDevices || [],
            hideMonitoringControls: data.data.hideMonitoringControls || false,
            localMode: data.data.localMode || false,
            cameraProtocol: data.data.cameraProtocol || 'http',
            cameraIpAddress: data.data.cameraIpAddress || '192.168.1.100',
            cameraPort: data.data.cameraPort || '',
            cameraPath: data.data.cameraPath || 'stream',
          };
          // Ensure camera fields are populated from URL if they don't exist
          if (
            newConfig.cameraStreamUrl &&
            (!newConfig.cameraProtocol || !newConfig.cameraIpAddress)
          ) {
            try {
              const urlObj = new URL(newConfig.cameraStreamUrl);
              const isWebsocket =
                urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';

              newConfig.cameraProtocol = isWebsocket ? 'websocket' : 'http';
              newConfig.cameraIpAddress = urlObj.hostname || '192.168.1.100';
              newConfig.cameraPort = urlObj.port || (isWebsocket ? '8080' : '');
              newConfig.cameraPath = !isWebsocket
                ? urlObj.pathname.startsWith('/')
                  ? urlObj.pathname.substring(1)
                  : urlObj.pathname || 'stream'
                : '';
            } catch {
              // Use defaults if parsing fails
              newConfig.cameraProtocol = 'http';
              newConfig.cameraIpAddress = '192.168.1.100';
              newConfig.cameraPort = '';
              newConfig.cameraPath = 'stream';
            }
          }

          // Ensure URL is always generated from fields to maintain consistency
          if (newConfig.cameraProtocol && newConfig.cameraIpAddress) {
            const generatedUrl = buildCameraUrl(
              newConfig.cameraProtocol,
              newConfig.cameraIpAddress,
              newConfig.cameraPort || '',
              newConfig.cameraPath || 'stream',
            );
            if (generatedUrl) {
              newConfig.cameraStreamUrl = generatedUrl;
            }
          }

          setConfig(newConfig);
          setOriginalConfig(newConfig);
        }
      }
    } catch (error) {
      console.error('Error fetching user config:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMode]); // buildCameraUrl is stable (empty deps) so we can exclude it
  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  const filteredAvailableDevices = availableDevices.filter((device) =>
    device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const checkLocalMode = async () => {
      if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
        const mode = await window.electronAPI.getConfig('localMode');
        setLocalMode(!!mode);
      } else {
        setLocalMode(false);
      }
    };
    checkLocalMode();
  }, []);

  useEffect(() => {
    if (user || localMode) {
      fetchUserConfig();
      if (!localMode) {
        setLoading(true);
        fetch('/api/devices/user')
          .then((response) => response.json())
          .then((userDevicesData) => {
            setUserDevices(userDevicesData.data || []);
            return fetch('/api/devices/unassigned');
          })
          .then((response) => response.json())
          .then((availableDevicesData) => {
            setAvailableDevices(availableDevicesData.data || []);
          })
          .catch((error) => {
            console.error('Error fetching devices:', error);
            showToast('Failed to load devices', 'error');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [user, fetchUserConfig, showToast, localMode]);
  const assignDevice = async (deviceId: string) => {
    try {
      setAssigningDeviceId(deviceId);

      const response = await fetch('/api/devices/assign', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign device');
      }
      showToast('Device assigned successfully!', 'success');

      const userDevicesResponse = await fetch('/api/devices/user');
      const availableDevicesResponse = await fetch('/api/devices/unassigned');

      if (userDevicesResponse.ok) {
        const userDevicesData = await userDevicesResponse.json();
        setUserDevices(userDevicesData.data || []);
      }

      if (availableDevicesResponse.ok) {
        const availableDevicesData = await availableDevicesResponse.json();
        setAvailableDevices(availableDevicesData.data || []);
      }
      const newConfig = {
        ...config,
        selectedDevice: deviceId,
        assignedDevices: [...config.assignedDevices, deviceId],
      };
      setConfig(newConfig);
      setOriginalConfig(newConfig);
      await saveConfig(newConfig);
    } catch (error) {
      console.error('Error assigning device:', error);
      showToast('Failed to assign device', 'error');
    } finally {
      setAssigningDeviceId(null);
    }
  };
  const saveConfig = async (configToSave = config) => {
    try {
      setSaving(true);
      if (
        localMode &&
        typeof window !== 'undefined' &&
        window.electronAPI?.setConfig
      ) {
        await window.electronAPI.setConfig('userConfig', configToSave);
        setOriginalConfig(configToSave);

        // Dispatch custom event to notify other components about config change
        const configChangeEvent = new CustomEvent('local-config-changed', {
          detail: { config: configToSave },
        });
        window.dispatchEvent(configChangeEvent);

        showToast('Settings saved locally!', 'success');
        return;
      }
      const response = await fetch('/api/user/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      setOriginalConfig(configToSave);
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleSaveSettings = () => {
    if (!isCameraConfigValid()) {
      showToast('Please fill in all camera fields before saving!', 'error');
      return;
    }
    saveConfig();
  }; // Validasi field kamera sebelum save
  const isCameraConfigValid = () => {
    return (
      config.cameraProtocol &&
      config.cameraIpAddress &&
      config.cameraPath &&
      config.cameraStreamUrl
    );
  };

  useEffect(() => {
    const top = document.querySelector('#top-navbar');
    const bottom = document.querySelector('#bottom-navbar');

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current logs save folder on mount (Electron only)
  useEffect(() => {
    if (isElectron && window.electronAPI?.getLogsSaveFolder) {
      window.electronAPI.getLogsSaveFolder().then((folder: string) => {
        setLogsSaveFolder(folder || '');
      });
    }
  }, [isElectron]);

  const handleOpenRobogoFolder = async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.openRobogoFolder) {
      try {
        const result = await window.electronAPI.openRobogoFolder();
        if (result.success) {
          showToast(`RoboGo folder opened!\n${result.path}`, 'success');
        } else {
          showToast('Failed to open RoboGo folder', 'error');
        }
      } catch (error) {
        console.error('Error opening RoboGo folder:', error);
        showToast('Failed to open RoboGo folder', 'error');
      }
    } else {
      showToast('Not running in Electron', 'error');
    }
  };
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Sync localMode state with config.localMode to avoid inconsistencies
  useEffect(() => {
    if (localMode !== (config.localMode || false)) {
      setLocalMode(config.localMode || false);
    }
  }, [config.localMode, localMode]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight,
      }}
    >
      <div className='w-full p-5'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center'>
                <Icon
                  icon='solar:settings-bold'
                  className='w-7 h-7 text-white'
                />
              </div>
              <div>
                <h1
                  className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  Settings
                </h1>
                <p
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Manage your devices and camera settings
                </p>
              </div>
            </div>
          </div>
        </div>{' '}
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <ClipLoader
              color={isDark ? '#ffffff' : '#3b82f6'}
              size={60}
              speedMultiplier={0.8}
            />
          </div>
        ) : (
          <div className='space-y-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Device Settings */}
              <div
                className={`rounded-2xl p-8 border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } shadow-lg`}
              >
                {' '}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <Icon
                      icon='solar:devices-bold'
                      className='w-7 h-7 text-blue-500'
                    />
                    <h2
                      className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      Robot Devices
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowAddDeviceModal(true)}
                    disabled={assigningDeviceId !== null}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                      assigningDeviceId !== null
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                    }`}
                  >
                    <Icon icon='solar:add-circle-bold' className='w-5 h-5' />
                    <span className='text-sm font-medium'>
                      {assigningDeviceId !== null
                        ? 'Processing...'
                        : 'Add Device'}
                    </span>
                  </button>
                </div>
                {/* User's Devices */}
                <div className='space-y-6'>
                  <div>
                    <h3
                      className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Your Devices
                    </h3>
                    {userDevices.length > 0 ? (
                      <div className='space-y-3'>
                        {userDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                              config.selectedDevice === device.id
                                ? isDark
                                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 border-blue-500 shadow-md'
                                  : 'bg-gradient-to-r from-blue-500/10 to-blue-400/10 border-blue-500 shadow-md'
                                : isDark
                                  ? 'bg-gray-700 border-gray-600'
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className='flex items-center space-x-3'>
                              {' '}
                              <Icon
                                icon='solar:cpu-bolt-bold'
                                className='w-6 h-6 text-blue-500'
                              />
                              <div>
                                <p
                                  className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {device.deviceName}
                                </p>{' '}
                                <p
                                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  Status: {formatDeviceStatus(device.status)}
                                </p>
                              </div>
                            </div>{' '}
                            <div className='flex items-center space-x-2'>
                              <button
                                onClick={() =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    selectedDevice: device.id,
                                  }))
                                }
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                  config.selectedDevice === device.id
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                                    : isDark
                                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {config.selectedDevice === device.id
                                  ? 'Selected'
                                  : 'Select'}
                              </button>{' '}
                              <button
                                onClick={() =>
                                  setShowConfirmDialog({
                                    type: 'unassign',
                                    deviceId: device.id,
                                    deviceName: device.deviceName,
                                  })
                                }
                                disabled={unassigningDeviceId !== null}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                  unassigningDeviceId !== null
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : isDark
                                      ? 'bg-orange-600 text-white hover:bg-orange-500'
                                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                }`}
                              >
                                {unassigningDeviceId === device.id ? (
                                  <ClipLoader
                                    color='#ffffff'
                                    size={16}
                                    speedMultiplier={1.2}
                                  />
                                ) : (
                                  'Unassign'
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        No devices assigned to you
                      </p>
                    )}{' '}
                  </div>{' '}
                </div>
              </div>
              {/* Camera Settings */}
              <div
                className={`rounded-2xl p-8 border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } shadow-lg`}
              >
                <div className='flex items-center space-x-3 mb-6'>
                  <Icon
                    icon='solar:camera-bold'
                    className='w-7 h-7 text-blue-500'
                  />
                  <h2
                    className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    Camera Settings
                  </h2>
                </div>
                <div className='space-y-6'>
                  {' '}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Camera Stream Settings
                    </label>
                    {/* Protocol Selection */}
                    <div className='mb-4'>
                      <label
                        className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        Protocol
                      </label>{' '}
                      <select
                        value={config.cameraProtocol || ''}
                        onChange={(e) => {
                          const newProtocol = e.target.value as
                            | 'http'
                            | 'websocket';
                          const newUrl = buildCameraUrl(
                            newProtocol,
                            config.cameraIpAddress || '',
                            config.cameraPort || '',
                            config.cameraPath || '',
                          );
                          setConfig((prev) => ({
                            ...prev,
                            cameraProtocol: newProtocol,
                            cameraStreamUrl: newUrl,
                          }));
                        }}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          !config.cameraProtocol
                            ? isDark
                              ? 'bg-gray-700 border-red-500 text-white'
                              : 'bg-white border-red-300 text-gray-900'
                            : isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value=''>Select Protocol</option>
                        <option value='http'>HTTP</option>
                        <option value='websocket'>WebSocket (WS/WSS)</option>
                      </select>
                    </div>
                    {/* IP Address and Port */}
                    <div className='grid grid-cols-3 gap-3 mb-4'>
                      <div className='col-span-2'>
                        <label
                          className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          IP Address
                        </label>{' '}
                        <input
                          type='text'
                          value={config.cameraIpAddress || ''}
                          onChange={(e) => {
                            const newIpAddress = e.target.value;
                            const newUrl = buildCameraUrl(
                              config.cameraProtocol || 'http',
                              newIpAddress,
                              config.cameraPort || '',
                              config.cameraPath || '',
                            );
                            setConfig((prev) => ({
                              ...prev,
                              cameraIpAddress: newIpAddress,
                              cameraStreamUrl: newUrl,
                            }));
                          }}
                          placeholder='192.168.1.100'
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Port
                        </label>{' '}
                        <input
                          type='text'
                          value={config.cameraPort || ''}
                          onChange={(e) => {
                            const newPort = e.target.value;
                            const newUrl = buildCameraUrl(
                              config.cameraProtocol || 'http',
                              config.cameraIpAddress || '192.168.1.100',
                              newPort,
                              config.cameraPath || 'stream',
                            );
                            setConfig((prev) => ({
                              ...prev,
                              cameraPort: newPort,
                              cameraStreamUrl: newUrl,
                            }));
                          }}
                          placeholder={
                            (config.cameraProtocol || 'http') === 'websocket'
                              ? '8080'
                              : '80'
                          }
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                    {/* Path (only for HTTP) */}{' '}
                    {(config.cameraProtocol || 'http') === 'http' && (
                      <div className='mb-4'>
                        <label
                          className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Path (after /)
                        </label>{' '}
                        <input
                          type='text'
                          value={config.cameraPath || ''}
                          onChange={(e) => {
                            const newPath = e.target.value;
                            const newUrl = buildCameraUrl(
                              config.cameraProtocol || 'http',
                              config.cameraIpAddress || '',
                              config.cameraPort || '',
                              newPath,
                            );
                            setConfig((prev) => ({
                              ...prev,
                              cameraPath: newPath,
                              cameraStreamUrl: newUrl,
                            }));
                          }}
                          placeholder='stream'
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    )}
                    {/* Generated URL Preview */}
                    <div className='mb-4'>
                      <label
                        className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        Generated URL
                      </label>
                      <div
                        className={`w-full px-4 py-3 rounded-xl border font-mono text-sm ${
                          isDark
                            ? 'bg-gray-800 border-gray-600 text-gray-300'
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        {config.cameraStreamUrl ||
                          'Please fill in the fields above'}
                      </div>
                    </div>{' '}
                    {/* WebSocket Security Warning */}
                    {config.cameraStreamUrl.startsWith('ws://') &&
                      typeof window !== 'undefined' &&
                      window.location.protocol === 'https:' && (
                        <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                          <div className='flex items-start'>
                            <Icon
                              icon='fluent:warning-24-regular'
                              className='text-yellow-600 mt-0.5 mr-2 flex-shrink-0'
                              width={16}
                              height={16}
                            />
                            <div className='text-xs'>
                              <p className='font-semibold text-yellow-800 mb-1'>
                                Security Warning
                              </p>
                              <p className='text-yellow-700 mb-2'>
                                Insecure WebSocket (ws://) cannot be used on
                                HTTPS pages.
                              </p>
                              <p className='text-yellow-700'>
                                <strong>Solutions:</strong> Use{' '}
                                <span className='font-mono bg-green-100 px-1 rounded'>
                                  wss://
                                </span>{' '}
                                for secure WebSocket or{' '}
                                <span className='font-mono bg-blue-100 px-1 rounded'>
                                  http://
                                </span>{' '}
                                for HTTP stream.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}{' '}
                    <p
                      className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {(config.cameraProtocol || 'http') === 'websocket'
                        ? 'WebSocket streaming for real-time video data'
                        : 'HTTP streaming for standard video streams (MJPEG, etc.)'}
                    </p>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Stream Quality
                    </label>
                    <select
                      value={config.streamQuality}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          streamQuality: e.target.value as
                            | 'low'
                            | 'medium'
                            | 'high',
                        }))
                      }
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value='low'>Low (320x240)</option>
                      <option value='medium'>Medium (640x480)</option>
                      <option value='high'>High (1280x720)</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Monitoring Settings */}
              <div
                className={`rounded-2xl p-8 border mt-8 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                } shadow-lg`}
              >
                <div className='flex items-center space-x-3 mb-6'>
                  <Icon
                    icon='solar:radar-bold'
                    className='w-7 h-7 text-blue-500'
                  />
                  <h2
                    className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    Monitoring Settings
                  </h2>
                </div>
                <div className='space-y-6'>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Monitoring Interface
                    </label>
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className='flex flex-col'>
                        <span
                          className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                          Hide Directional Controls
                        </span>
                        <span
                          className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Hide directional buttons (up, down, left, right) in
                          monitoring
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            hideMonitoringControls:
                              !prev.hideMonitoringControls,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          config.hideMonitoringControls
                            ? 'bg-blue-500'
                            : isDark
                              ? 'bg-gray-600'
                              : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                            config.hideMonitoringControls
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Local Mode (Offline)
                    </label>
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className='flex flex-col'>
                        <span
                          className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                          Use serial monitor data instead of API for monitoring
                          page. Only works in Electron app with ESP32 connected.
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          const newLocalMode = !config.localMode;
                          setConfig((prev) => ({
                            ...prev,
                            localMode: newLocalMode,
                          }));
                          // Also update the separate localMode state to keep them in sync
                          setLocalMode(newLocalMode);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          config.localMode
                            ? 'bg-green-500'
                            : isDark
                              ? 'bg-gray-600'
                              : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                            config.localMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>{' '}
              {/* RoboGo Data Folder (Local Mode Only) */}
              {hasMounted && localMode && isElectron && (
                <div
                  className={`rounded-2xl p-8 border mt-8 ${
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  } shadow-lg`}
                >
                  <div className='flex items-center space-x-3 mb-6'>
                    <Icon
                      icon='solar:folder-bold'
                      className='w-7 h-7 text-blue-500'
                    />
                    <h2
                      className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      RoboGo Data Folder
                    </h2>
                  </div>

                  <div className='space-y-4'>
                    <p
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      All your photos, logs, monitoring sessions, and
                      configuration are stored here:
                    </p>

                    <div className='flex items-center gap-3'>
                      <div
                        className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-300'
                            : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        {logsSaveFolder || 'Documents/RoboGo'}
                      </div>

                      <button
                        onClick={handleOpenRobogoFolder}
                        className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                          isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <Icon
                          icon='solar:folder-open-bold'
                          className='w-4 h-4 inline mr-2'
                        />
                        Open Folder
                      </button>
                    </div>

                    <div
                      className={`text-xs p-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <strong>Contains:</strong> robogo-config.json,
                      monitoring/, logs/, images/ folders
                    </div>
                  </div>
                </div>
              )}
            </div>{' '}
            {/* Save Button */}
            <div className='flex justify-end'>
              {' '}
              <button
                onClick={handleSaveSettings}
                disabled={saving || !hasChanges() || !isCameraConfigValid()}
                className={`flex items-center space-x-3 px-8 py-4 rounded-xl transition-colors duration-200 text-lg font-medium ${
                  saving || !hasChanges() || !isCameraConfigValid()
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                }`}
              >
                {saving ? (
                  <ClipLoader color='#ffffff' size={20} speedMultiplier={1.2} />
                ) : (
                  <Icon icon='solar:diskette-bold' className='w-6 h-6' />
                )}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>{' '}
            </div>
          </div>
        )}{' '}
        {/* Add Device Modal */}
        <AnimatePresence>
          {showAddDeviceModal && (
            <motion.div
              className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
              variants={backdropVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`w-full max-w-md rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-2xl max-h-[80vh] overflow-hidden flex flex-col`}
                variants={modalVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Modal Header */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <Icon
                      icon='solar:add-circle-bold'
                      className='w-6 h-6 text-blue-500'
                    />
                    <h3
                      className={`text-xl font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      Add Device
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddDeviceModal(false);
                      setSearchQuery('');
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon icon='solar:close-bold' className='w-5 h-5' />
                  </button>
                </div>

                {/* Search Input */}
                <div className='mb-4'>
                  <div className='relative'>
                    <Icon
                      icon='solar:magnifer-bold'
                      className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
                    />
                    <input
                      type='text'
                      placeholder='Search devices...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Device List */}
                <div className='flex-1 overflow-y-auto'>
                  {filteredAvailableDevices.length > 0 ? (
                    <div className='space-y-3'>
                      {filteredAvailableDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            isDark
                              ? 'bg-gray-700 border-gray-600'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className='flex items-center space-x-3'>
                            <Icon
                              icon='solar:cpu-bolt-line-duotone'
                              className='w-6 h-6 text-blue-500'
                            />
                            <div>
                              <p
                                className={`font-medium ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}
                              >
                                {device.deviceName}
                              </p>
                              <p
                                className={`text-sm ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                Status: {formatDeviceStatus(device.status)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              assignDevice(device.id);
                              setShowAddDeviceModal(false);
                              setSearchQuery('');
                            }}
                            disabled={assigningDeviceId !== null}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                              assigningDeviceId !== null
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                            }`}
                          >
                            {assigningDeviceId === device.id && (
                              <ClipLoader
                                color='#ffffff'
                                size={16}
                                speedMultiplier={1.2}
                              />
                            )}
                            <span>
                              {assigningDeviceId === device.id
                                ? 'Assigning...'
                                : 'Assign'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <Icon
                        icon='solar:box-bold'
                        className={`w-12 h-12 mx-auto mb-3 ${
                          isDark ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {searchQuery
                          ? 'No devices found matching your search'
                          : 'No available devices'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    onClick={() => {
                      setShowAddDeviceModal(false);
                      setSearchQuery('');
                    }}
                    className={`w-full py-3 px-4 rounded-xl border transition-colors ${
                      isDark
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>{' '}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Confirm Dialog */}
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
              variants={backdropVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`w-full max-w-md rounded-2xl p-6 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } shadow-2xl`}
                variants={modalVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Modal Header */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <Icon
                      icon='solar:warning-bold'
                      className='w-6 h-6 text-red-500'
                    />
                    <h3
                      className={`text-xl font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      Confirm Action
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowConfirmDialog(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon icon='solar:close-bold' className='w-5 h-5' />
                  </button>
                </div>{' '}
                {/* Confirm Message */}
                <div className='mb-6'>
                  {' '}
                  <p
                    className={`text-base ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    } mb-2`}
                  >
                    Are you sure you want to unassign &quot;
                    {showConfirmDialog.deviceName}&quot;?
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    This device will become available for other users to assign.
                  </p>
                </div>
                {/* Modal Footer */}
                <div className='flex justify-end space-x-4'>
                  <button
                    onClick={() => setShowConfirmDialog(null)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>{' '}
                  <button
                    onClick={async () => {
                      setUnassigningDeviceId(showConfirmDialog.deviceId);
                      try {
                        const response = await fetch('/api/devices/unassign', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            deviceId: showConfirmDialog.deviceId,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to unassign device');
                        }
                        showToast('Device unassigned successfully!', 'success');

                        const userDevicesResponse =
                          await fetch('/api/devices/user');
                        const availableDevicesResponse = await fetch(
                          '/api/devices/unassigned',
                        );

                        if (userDevicesResponse.ok) {
                          const userDevicesData =
                            await userDevicesResponse.json();
                          setUserDevices(userDevicesData.data || []);
                        }

                        if (availableDevicesResponse.ok) {
                          const availableDevicesData =
                            await availableDevicesResponse.json();
                          setAvailableDevices(availableDevicesData.data || []);
                        }

                        // Update config if the unassigned device was selected
                        if (
                          config.selectedDevice === showConfirmDialog.deviceId
                        ) {
                          const newConfig = {
                            ...config,
                            selectedDevice: null,
                            assignedDevices: config.assignedDevices.filter(
                              (id) => id !== showConfirmDialog.deviceId,
                            ),
                          };
                          setConfig(newConfig);
                          setOriginalConfig(newConfig);
                          await saveConfig(newConfig);
                        }
                      } catch (error) {
                        console.error('Error unassigning device:', error);
                        showToast('Failed to unassign device', 'error');
                      } finally {
                        setUnassigningDeviceId(null);
                        setShowConfirmDialog(null);
                      }
                    }}
                    disabled={unassigningDeviceId !== null}
                    className={`px-6 py-2 rounded-xl transition-colors font-medium ${
                      unassigningDeviceId !== null
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : isDark
                          ? 'bg-orange-600 text-white hover:bg-orange-500'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {' '}
                    {unassigningDeviceId === showConfirmDialog.deviceId
                      ? 'Unassigning...'
                      : 'Unassign'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}{' '}
        </AnimatePresence>
      </div>
      {/* RoboGo Folder Location (Local Mode Only) */}
    </div>
  );
}
