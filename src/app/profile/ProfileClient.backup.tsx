'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

interface Settings {
  selectedDevice: string | null;
  cameraStreamUrl: string;
  streamQuality: 'low' | 'medium' | 'high';
}

export default function ProfileClient() {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMeQuery();

  const [userDevices, setUserDevices] = useState<Device[]>([]);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [settings, setSettings] = useState<Settings>({
    selectedDevice: null,
    cameraStreamUrl: 'http://192.168.1.100/stream',
    streamQuality: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const userDevicesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/others/devices/user`,
        {
          credentials: 'include',
        },
      );

      const availableDevicesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/others/devices/unassigned`,
        {
          credentials: 'include',
        },
      );

      if (userDevicesResponse.ok) {
        const userDevicesData = await userDevicesResponse.json();
        setUserDevices(userDevicesData.data || []);

        if (userDevicesData.data && userDevicesData.data.length > 0) {
          setSettings((prev) => ({
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
  }, [showToast]);

  useEffect(() => {
    if (user) {
      fetchDevices();
    } else if (userLoading === false && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router, fetchDevices]);

  const assignDevice = async (deviceId: string) => {
    try {
      setSaving(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/others/devices/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ deviceId }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to assign device');
      }

      showToast('Device assigned successfully!', 'success');
      await fetchDevices();

      setSettings((prev) => ({
        ...prev,
        selectedDevice: deviceId,
      }));
    } catch (error) {
      console.error('Error assigning device:', error);
      showToast('Failed to assign device', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      localStorage.setItem('robogo_settings', JSON.stringify(settings));

      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('robogo_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({
          ...prev,
          cameraStreamUrl: parsed.cameraStreamUrl || prev.cameraStreamUrl,
          streamQuality: parsed.streamQuality || prev.streamQuality,
        }));
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        showToast('Logged out successfully', 'success');
        window.location.href = '/login';
      } else {
        showToast('Logout failed', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  };

  if (userLoading || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className='text-center'>
          <Icon
            icon='solar:loading-circle-bold'
            className={`w-8 h-8 animate-spin mx-auto mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#0a0e1a] via-[#112133] to-[#1a2332]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100'
      }`}
    >
      {/* Header */}
      <div
        className={`backdrop-blur-xl border-b sticky top-0 z-50 ${
          isDark
            ? 'bg-gray-900/80 border-gray-700'
            : 'bg-white/80 border-gray-200'
        }`}
      >
        <div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center'>
              <Icon icon='solar:user-bold' className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Profile & Settings
              </h1>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Manage your account and device settings
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
            }`}
          >
            <Icon icon='solar:home-2-bold' className='w-5 h-5' />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* User Profile Card */}
          <div
            className={`backdrop-blur-xl rounded-2xl p-6 border shadow-lg ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}
          >
            <div className='text-center'>
              <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Icon icon='solar:user-bold' className='w-10 h-10 text-white' />
              </div>

              {user && (
                <>
                  <h2
                    className={`text-xl font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {user.name}
                  </h2>
                  <p
                    className={`text-sm mb-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {user.email}
                  </p>
                  <div
                    className={`text-xs p-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>

            <div className='mt-6'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200'
              >
                <Icon icon='solar:logout-2-bold' className='w-5 h-5' />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Device Settings */}
          <div
            className={`backdrop-blur-xl rounded-2xl p-6 border shadow-lg ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}
          >
            <div className='flex items-center space-x-3 mb-6'>
              <Icon
                icon='solar:devices-bold'
                className='w-6 h-6 text-blue-500'
              />
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Robot Devices
              </h3>
            </div>

            {/* User's Devices */}
            <div className='space-y-4'>
              <div>
                <h4
                  className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Your Devices
                </h4>

                {userDevices.length > 0 ? (
                  <div className='space-y-2'>
                    {userDevices.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          settings.selectedDevice === device.id
                            ? isDark
                              ? 'bg-blue-900/30 border-blue-500'
                              : 'bg-blue-50 border-blue-300'
                            : isDark
                              ? 'bg-gray-700 border-gray-600'
                              : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className='flex items-center space-x-3'>
                          <Icon
                            icon='solar:cpu-bolt-bold'
                            className='w-5 h-5 text-green-500'
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
                              className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              Status: {device.status}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              selectedDevice: device.id,
                            }))
                          }
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            settings.selectedDevice === device.id
                              ? 'bg-blue-500 text-white'
                              : isDark
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {settings.selectedDevice === device.id
                            ? 'Selected'
                            : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    No devices assigned to you
                  </p>
                )}
              </div>

              {/* Available Devices */}
              {availableDevices.length > 0 && (
                <div>
                  <h4
                    className={`text-sm font-medium mb-3 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Available Devices
                  </h4>

                  <div className='space-y-2'>
                    {availableDevices.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          isDark
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className='flex items-center space-x-3'>
                          <Icon
                            icon='solar:cpu-bolt-line-duotone'
                            className='w-5 h-5 text-gray-400'
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
                              className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              Status: {device.status}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => assignDevice(device.id)}
                          disabled={saving}
                          className='px-3 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors'
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
            className={`backdrop-blur-xl rounded-2xl p-6 border shadow-lg ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}
          >
            <div className='flex items-center space-x-3 mb-6'>
              <Icon
                icon='solar:camera-bold'
                className='w-6 h-6 text-purple-500'
              />
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Camera Settings
              </h3>
            </div>

            <div className='space-y-4'>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Camera Stream URL
                </label>
                <input
                  type='url'
                  value={settings.cameraStreamUrl}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cameraStreamUrl: e.target.value,
                    }))
                  }
                  placeholder='http://192.168.1.100/stream'
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <p
                  className={`text-xs mt-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Enter the IP camera or streaming URL for robot camera feed
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Stream Quality
                </label>
                <select
                  value={settings.streamQuality}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      streamQuality: e.target.value as
                        | 'low'
                        | 'medium'
                        | 'high',
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
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

              <div className='pt-4'>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className='w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200'
                >
                  <Icon icon='solar:diskette-bold' className='w-5 h-5' />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
