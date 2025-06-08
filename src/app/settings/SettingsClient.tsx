'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
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

export default function SettingsClient() {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const { data: user } = useMeQuery();

  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
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
      setSaving(true);

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
      setSaving(false);
    }
  };

  const saveConfig = async (configToSave = config) => {
    try {
      setSaving(true);

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
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Icon
              icon='solar:loading-circle-bold'
              className={`w-12 h-12 animate-spin ${isDark ? 'text-white' : 'text-gray-900'}`}
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
                <div className='flex items-center space-x-3 mb-6'>
                  {' '}
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
                            </div>

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
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        No devices assigned to you
                      </p>
                    )}
                  </div>

                  {/* Available Devices */}
                  {availableDevices.length > 0 && (
                    <div>
                      <h3
                        className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Available Devices
                      </h3>

                      <div className='space-y-3'>
                        {availableDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`p-4 rounded-xl border flex items-center justify-between ${
                              isDark
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className='flex items-center space-x-3'>
                              <Icon
                                icon='solar:cpu-bolt-line-duotone'
                                className='w-6 h-6 text-gray-400'
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
                            <button
                              onClick={() => assignDevice(device.id)}
                              disabled={saving}
                              className='px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 disabled:bg-gray-400 text-white rounded-lg transition-colors'
                            >
                              {saving ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    </label>
                    <input
                      type='url'
                      value={config.cameraStreamUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          cameraStreamUrl: e.target.value,
                        }))
                      }
                      placeholder='http://192.168.1.100/stream'
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <p
                      className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Enter the IP camera or streaming URL for robot camera feed
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
                <Icon icon='solar:diskette-bold' className='w-6 h-6' />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
