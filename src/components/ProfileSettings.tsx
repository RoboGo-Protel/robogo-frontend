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

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettings({
  isOpen,
  onClose,
}: ProfileSettingsProps) {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const { data: user } = useMeQuery();

  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [config, setConfig] = useState<UserConfig>({
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
          setConfig((prev) => ({
            ...prev,
            ...data.data,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user config:', error);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const userDevicesResponse = await fetch('/api/devices/user');

      const availableDevicesResponse = await fetch('/api/devices/unassigned');

      if (userDevicesResponse.ok) {
        const userDevicesData = await userDevicesResponse.json();
        setUserDevices(userDevicesData.data || []);

        if (
          userDevicesData.data &&
          userDevicesData.data.length > 0 &&
          !config.selectedDevice
        ) {
          setConfig((prev) => ({
            ...prev,
            selectedDevice: userDevicesData.data[0].id,
          }));
        }
      }

      if (availableDevicesResponse.ok) {
        const availableDevicesData = await availableDevicesResponse.json();
        setAvailableDevices(availableDevicesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      showToast('Failed to load devices', 'error');
    } finally {
      setLoading(false);
    }
  }, [config.selectedDevice, showToast]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserConfig().then(() => {
        fetchDevices();
      });
    }
  }, [isOpen, user, fetchUserConfig, fetchDevices]);

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
      await fetchDevices();

      const newConfig = {
        ...config,
        selectedDevice: deviceId,
        assignedDevices: [...config.assignedDevices, deviceId],
      };
      setConfig(newConfig);
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

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center'>
              <Icon icon='solar:settings-bold' className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2
                className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Profile & Settings
              </h2>
              <p
                className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Manage your devices and camera settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon icon='solar:close-circle-bold' className='w-6 h-6' />
          </button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center p-12'>
            <Icon
              icon='solar:loading-circle-bold'
              className={`w-8 h-8 animate-spin ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
          </div>
        ) : (
          <div className='p-6 space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Device Settings */}
              <div
                className={`rounded-xl p-6 border ${
                  isDark
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center space-x-3 mb-4'>
                  <Icon
                    icon='solar:devices-bold'
                    className='w-6 h-6 text-blue-500'
                  />
                  <h3
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    Robot Devices
                  </h3>
                </div>

                {/* User's Devices */}
                <div className='space-y-4'>
                  <div>
                    <h4
                      className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Your Devices
                    </h4>

                    {userDevices.length > 0 ? (
                      <div className='space-y-2'>
                        {userDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`p-3 rounded-lg border flex items-center justify-between ${
                              config.selectedDevice === device.id
                                ? isDark
                                  ? 'bg-blue-900/30 border-blue-500'
                                  : 'bg-blue-50 border-blue-300'
                                : isDark
                                  ? 'bg-gray-600 border-gray-500'
                                  : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className='flex items-center space-x-3'>
                              <Icon
                                icon='solar:cpu-bolt-bold'
                                className='w-5 h-5 text-blue-500'
                              />
                              <div>
                                <p
                                  className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {device.deviceName}
                                </p>
                                <p
                                  className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
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
                              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                config.selectedDevice === device.id
                                  ? 'bg-blue-500 text-white'
                                  : isDark
                                    ? 'bg-gray-500 text-gray-300 hover:bg-gray-400'
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
                      <h4
                        className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Available Devices
                      </h4>

                      <div className='space-y-2'>
                        {availableDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`p-3 rounded-lg border flex items-center justify-between ${
                              isDark
                                ? 'bg-gray-600 border-gray-500'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className='flex items-center space-x-3'>
                              <Icon
                                icon='solar:cpu-bolt-line-duotone'
                                className='w-5 h-5 text-gray-400'
                              />
                              <div>
                                <p
                                  className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {device.deviceName}
                                </p>
                                <p
                                  className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  Status: {device.status}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => assignDevice(device.id)}
                              disabled={saving}
                              className='px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors'
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
                className={`rounded-xl p-6 border ${
                  isDark
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center space-x-3 mb-4'>
                  <Icon
                    icon='solar:camera-bold'
                    className='w-6 h-6 text-blue-500'
                  />
                  <h3
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    Camera Settings
                  </h3>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
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
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
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
                      className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
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
                          ? 'bg-gray-600 border-gray-500 text-white'
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
            </div>

            {/* Save Button */}
            <div className='flex justify-end'>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className='flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200'
              >
                <Icon icon='solar:diskette-bold' className='w-5 h-5' />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
