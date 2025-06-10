'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import { useMeQuery } from '@/hooks/useMeQuery';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { ClipLoader } from 'react-spinners';

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
}

export default function OnboardingClient() {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const { data: user } = useMeQuery();
  const { refetch: refetchOnboardingStatus } = useOnboardingStatus();

  // Helper function to format device status for display
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

  const [currentStep, setCurrentStep] = useState(1);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [config, setConfig] = useState<UserConfig>({
    selectedDevice: null,
    cameraStreamUrl: 'http://192.168.1.100/stream',
    streamQuality: 'medium',
    assignedDevices: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);

  const fetchAvailableDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/devices/unassigned');
      if (response.ok) {
        const data = await response.json();
        setAvailableDevices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      showToast('Failed to load devices', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    const topNavbar = document.getElementById('top-navbar');
    const bottomNavbar = document.getElementById('bottom-navbar');

    if (topNavbar) {
      setTopNavbarHeight(topNavbar.offsetHeight);
    }
    if (bottomNavbar) {
      setBottomNavbarHeight(bottomNavbar.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAvailableDevices();
    }
  }, [user, fetchAvailableDevices]);

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

      const newConfig = {
        ...config,
        selectedDevice: deviceId,
        assignedDevices: [deviceId],
      };
      setConfig(newConfig);

      showToast('Device assigned successfully!', 'success');
      setCurrentStep(2);

      fetchAvailableDevices();
    } catch (error) {
      console.error('Error assigning device:', error);
      showToast('Failed to assign device', 'error');
    } finally {
      setSaving(false);
    }
  };
  const saveConfigAndComplete = async () => {
    try {
      setSaving(true);

      // Add onboardingCompleted flag to config
      const completedConfig = {
        ...config,
        onboardingCompleted: true,
      };

      const response = await fetch('/api/user/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completedConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      showToast('Setup completed successfully!', 'success');

      // Refetch onboarding status to trigger guard re-evaluation
      await refetchOnboardingStatus();

      // Dispatch custom event to notify OnboardingGuard
      window.dispatchEvent(new CustomEvent('onboarding-status-changed'));

      // Small delay then redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Failed to complete setup', 'error');
    } finally {
      setSaving(false);
    }
  };
  const skipOnboarding = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/user/skip-onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to skip onboarding');
      }
      showToast(
        'Setup skipped successfully! You can configure your device later in settings.',
        'success',
      );

      // Refetch onboarding status to trigger guard re-evaluation
      await refetchOnboardingStatus();

      // Dispatch custom event to notify OnboardingGuard
      window.dispatchEvent(new CustomEvent('onboarding-status-changed'));

      // Small delay then redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      showToast('Failed to skip setup', 'error');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <Icon
          icon='solar:loading-circle-bold'
          className={`w-12 h-12 animate-spin ${isDark ? 'text-white' : 'text-gray-900'}`}
        />
      </div>
    );
  }
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight,
      }}
    >
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8 relative'>
          {/* Skip Button */}{' '}
          <button
            onClick={skipOnboarding}
            disabled={saving}
            className={`absolute top-0 right-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              saving
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {saving ? (
              <>
                <ClipLoader size={16} color='#ffffff' />
                Processing...
              </>
            ) : (
              'Skip Setup'
            )}
          </button>
          <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4'>
            <Icon icon='solar:settings-bold' className='w-8 h-8 text-white' />
          </div>
          <h1
            className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Welcome to RoboGo!
          </h1>
          <p
            className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Let&apos;s set up your robot device and camera settings
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mb-12'>
          <div className='flex items-center justify-center space-x-4'>
            {[1, 2, 3].map((step) => (
              <div key={step} className='flex items-center'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <Icon icon='solar:check-circle-bold' className='w-6 h-6' />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className='flex justify-center mt-4 space-x-8'>
            <span
              className={`text-sm ${currentStep >= 1 ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Choose Device
            </span>
            <span
              className={`text-sm ${currentStep >= 2 ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Camera Setup
            </span>
            <span
              className={`text-sm ${currentStep >= 3 ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Complete
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div
          className={`rounded-2xl p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}
        >
          {/* Step 1: Device Selection */}
          {currentStep === 1 && (
            <div>
              <h2
                className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Step 1: Choose Your Robot Device
              </h2>
              <p
                className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Select a robot device to assign to your account. You can change
                this later in settings.
              </p>

              {availableDevices.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {availableDevices.map((device) => (
                    <div
                      key={device.id}
                      className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        config.selectedDevice === device.id
                          ? isDark
                            ? 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 border-blue-500'
                            : 'bg-gradient-to-r from-blue-500/10 to-blue-400/10 border-blue-500'
                          : isDark
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          selectedDevice: device.id,
                        }))
                      }
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          {' '}
                          <Icon
                            icon='solar:cpu-bolt-bold'
                            className='w-8 h-8 text-blue-500'
                          />
                          <div>
                            <h3
                              className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}
                            >
                              {device.deviceName}
                            </h3>{' '}
                            <p
                              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              Status: {formatDeviceStatus(device.status)}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            config.selectedDevice === device.id
                              ? 'border-blue-500 bg-blue-500'
                              : isDark
                                ? 'border-gray-400'
                                : 'border-gray-300'
                          }`}
                        >
                          {config.selectedDevice === device.id && (
                            <Icon
                              icon='solar:check-bold'
                              className='w-4 h-4 text-white'
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <Icon
                    icon='solar:device-broken-bold'
                    className='w-16 h-16 text-gray-400 mx-auto mb-4'
                  />
                  <p
                    className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    No devices available at the moment. Please contact your
                    administrator.
                  </p>
                </div>
              )}

              <div className='flex justify-end mt-8'>
                <button
                  onClick={() =>
                    config.selectedDevice && assignDevice(config.selectedDevice)
                  }
                  disabled={!config.selectedDevice || saving}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    !config.selectedDevice || saving
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                  }`}
                >
                  {saving ? 'Assigning...' : 'Assign Device & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Camera Setup */}
          {currentStep === 2 && (
            <div>
              <h2
                className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Step 2: Configure Camera Settings
              </h2>{' '}
              <p
                className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Set up your robot&apos;s camera stream URL and quality
                preferences.
              </p>
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
                  />{' '}
                  <p
                    className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Enter the IP camera or streaming URL for your robot&apos;s
                    camera feed
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
                    <option value='low'>
                      Low (320x240) - Best for slow connections
                    </option>
                    <option value='medium'>
                      Medium (640x480) - Balanced performance
                    </option>
                    <option value='high'>High (1280x720) - Best quality</option>
                  </select>
                </div>
              </div>
              <div className='flex justify-between mt-8'>
                <button
                  onClick={prevStep}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className='px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300'
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete Setup */}
          {currentStep === 3 && (
            <div className='text-center'>
              <Icon
                icon='solar:check-circle-bold'
                className='w-20 h-20 text-green-500 mx-auto mb-6'
              />
              <h2
                className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Setup Complete!
              </h2>{' '}
              <p
                className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Your robot device and camera settings have been configured.
                You&apos;re ready to start using RoboGo!
              </p>
              <div
                className={`rounded-xl p-6 mb-8 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <h3
                  className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  Configuration Summary:
                </h3>
                <div className='space-y-2 text-left'>
                  <p
                    className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    <span className='font-medium'>Selected Device:</span>{' '}
                    {config.selectedDevice || 'None'}
                  </p>
                  <p
                    className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    <span className='font-medium'>Camera URL:</span>{' '}
                    {config.cameraStreamUrl}
                  </p>
                  <p
                    className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    <span className='font-medium'>Stream Quality:</span>{' '}
                    {config.streamQuality.charAt(0).toUpperCase() +
                      config.streamQuality.slice(1)}
                  </p>
                </div>
              </div>
              <div className='flex justify-between'>
                <button
                  onClick={prevStep}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={saveConfigAndComplete}
                  disabled={saving}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
