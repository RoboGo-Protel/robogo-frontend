'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ClipLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import { useMeQuery } from '@/hooks/useMeQuery';

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
    cameraStreamUrl: 'http://192.168.1.100/stream',
    streamQuality: 'medium',
    assignedDevices: [],
  });
  const [originalConfig, setOriginalConfig] = useState<UserConfig>({
    selectedDevice: null,
    cameraStreamUrl: 'http://192.168.1.100/stream',
    streamQuality: 'medium',
    assignedDevices: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cameraUrlError, setCameraUrlError] = useState<string | null>(null);

  // Valid protocols for camera stream URLs
  const validProtocols = ['http:', 'https:', 'ws:', 'wss:', 'rtsp:', 'rtmp:'];

  const validateCameraUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Allow empty URL

    try {
      const urlObj = new URL(url);
      return validProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const handleCameraUrlChange = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      cameraStreamUrl: value,
    }));

    if (value.trim() && !validateCameraUrl(value)) {
      setCameraUrlError(
        'Please enter a valid URL with supported protocol (http, https, ws, wss, rtsp, rtmp)',
      );
    } else {
      setCameraUrlError(null);
    }
  };
  const fetchUserConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/user/config');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const newConfig = {
            selectedDevice: data.data.selectedDevice || null,
            cameraStreamUrl:
              data.data.cameraStreamUrl || 'http://192.168.1.100/stream',
            streamQuality: data.data.streamQuality || 'medium',
            assignedDevices: data.data.assignedDevices || [],
          };
          setConfig(newConfig);
          setOriginalConfig(newConfig);
        }
      }
    } catch (error) {
      console.error('Error fetching user config:', error);
    }
  }, []);
  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  const filteredAvailableDevices = availableDevices.filter((device) =>
    device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (user) {
      fetchUserConfig().then(() => {
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
      });
    }
  }, [user, fetchUserConfig, showToast]);
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

      // Validate camera URL before saving
      if (
        configToSave.cameraStreamUrl &&
        !validateCameraUrl(configToSave.cameraStreamUrl)
      ) {
        showToast(
          'Please enter a valid camera URL with supported protocol',
          'error',
        );
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
    // Check for validation errors before saving
    if (cameraUrlError) {
      showToast('Please fix validation errors before saving', 'error');
      return;
    }
    saveConfig();
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

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight,
      }}
    >
      <div className='max-w-6xl mx-auto p-5'>
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
                                </p>
                                <p
                                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  Status: {device.status}
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
                  {' '}
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
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Camera Stream URL
                    </label>{' '}
                    <input
                      type='text'
                      value={config.cameraStreamUrl}
                      onChange={(e) => handleCameraUrlChange(e.target.value)}
                      placeholder='http://192.168.1.100/stream or ws://192.168.1.100:8080'
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        cameraUrlError
                          ? 'border-red-500 focus:ring-red-500'
                          : isDark
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    {cameraUrlError && (
                      <p className='text-red-500 text-xs mt-1'>
                        {cameraUrlError}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Enter the camera streaming URL (supports HTTP/HTTPS,
                      WebSocket, RTSP, RTMP protocols)
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
            </div>{' '}
            {/* Save Button */}
            <div className='flex justify-end'>
              {' '}
              <button
                onClick={handleSaveSettings}
                disabled={saving || !hasChanges()}
                className={`flex items-center space-x-3 px-8 py-4 rounded-xl transition-colors duration-200 text-lg font-medium ${
                  saving || !hasChanges()
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
                                Status: {device.status}
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
