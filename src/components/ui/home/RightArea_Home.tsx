import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { infoItems } from '@/utils/info';
import { motion, AnimatePresence } from 'framer-motion';
import ShortInfo from '@/components/cards/ShortInfoCard';
import { useDarkMode } from '@/context/DarkModeContext';
import DynamicVideoStream from '@/components/DynamicVideoStream';
import { useUserConfig } from '@/hooks/useUserConfig';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';

export default function RightArea_Home() {
  const { isDark } = useDarkMode();
  const { config } = useUserConfig();

  const [flashOn, setFlashOn] = useState(false);
  const [fps] = useState(0);
  const [resolution] = useState({ width: 0, height: 0 });
  const [deviceCamera] = useState('None');
  const [isStreamActive] = useState(false);
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [cameraUrlError, setCameraUrlError] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  // Use the device status hook
  const {
    status: deviceStatus,
    deviceData,
    refreshStatus,
    loading,
  } = useDeviceStatus(deviceName);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    if (deviceName) {
      await refreshStatus();
    }
  };

  // Get deviceName from selected device
  useEffect(() => {
    const fetchDeviceName = async () => {
      if (!config?.selectedDevice) {
        setDeviceName(null);
        return;
      }

      try {
        const response = await fetch('/api/devices/user');
        if (response.ok) {
          const data = await response.json();
          const selectedDeviceData = data.data?.find(
            (device: { id: string; deviceName: string }) =>
              device.id === config.selectedDevice,
          );
          if (selectedDeviceData) {
            setDeviceName(selectedDeviceData.deviceName);
          }
        }
      } catch (error) {
        console.error('Error fetching device name:', error);
      }
    };

    fetchDeviceName();
  }, [config?.selectedDevice]);

  // Update camera URL when device data changes
  useEffect(() => {
    if (deviceData?.cameraStreamUrl) {
      setCameraUrl(deviceData.cameraStreamUrl);
      setCameraUrlError('');
    }
  }, [deviceData]);

  // Fetch user configuration for camera URL fallback
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.cameraStreamUrl && !cameraUrl) {
            setCameraUrl(data.data.cameraStreamUrl);
            setCameraUrlError('');
          } else if (!cameraUrl) {
            setCameraUrl(
              'http://localhost:4000/api/v1/monitoring/camera-stream',
            ); // fallback to original hardcoded URL
          }
        } else {
          console.warn('Failed to fetch user config, using fallback URL');
          if (!cameraUrl) {
            setCameraUrl(
              'http://localhost:4000/api/v1/monitoring/camera-stream',
            );
          }
        }
      } catch (error) {
        console.error('Error fetching user config:', error);
        if (!cameraUrl) {
          setCameraUrl('http://localhost:4000/api/v1/monitoring/camera-stream'); // fallback to original hardcoded URL
        }
      }
    };

    if (!cameraUrl) {
      fetchUserConfig();
    }
  }, [cameraUrl]);

  // Create dynamic info items with status from device
  const dynamicInfoItems = infoItems.map((item) => ({
    ...item,
    status: deviceStatus ? deviceStatus[item.component] : item.status,
  }));
  // Validate camera URL for WebSocket and other protocols
  const validateCameraUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    try {
      const urlObj = new URL(url);
      const validProtocols = [
        'http:',
        'https:',
        'ws:',
        'wss:',
        'rtsp:',
        'rtmp:',
      ];
      return validProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  // Check if current camera URL is valid
  const isCameraUrlValid = validateCameraUrl(cameraUrl);

  return (
    <div
      className={`flex flex-col items-start justify-start w-full max-w-[450px] md:max-w-[450px] h-full gap-4 rounded-xl p-4 md:p-5 border-2 transition-colors ${
        isDark
          ? 'border-blue-500/10 bg-[#112133] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      {/* Header */}
      <div className='flex flex-col items-center justify-center w-full gap-4'>
        <h1 className='text-2xl font-bold'>RoboGo G1</h1>
        <Image
          src='/images/robogo_g1.png'
          alt='RoboGo G1'
          width={180}
          height={180}
          className='select-none'
        />
      </div>{' '}
      {/* Info Cards */}
      <div className='flex flex-col w-full gap-3'>
        <div className='flex justify-between items-center'>
          <h2
            className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}
          >
            Device Status
          </h2>
          {deviceName && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-105 active:scale-95'
              } ${
                isDark
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
              }`}
              title='Refresh device status'
            >
              <Icon
                icon={
                  loading ? 'mingcute:loading-line' : 'mingcute:refresh-2-line'
                }
                width={16}
                height={16}
                className={loading ? 'animate-spin' : ''}
              />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
        <ShortInfo infoItems={dynamicInfoItems} />
      </div>
      {/* Camera Stream */}
      <div className='h-full w-full rounded-2xl flex items-center justify-center relative min-h-[300px]'>
        <AnimatePresence mode='wait'>
          {isStreamActive ? (
            <motion.div
              key='stream-on'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='h-full w-full rounded-2xl relative flex items-center justify-center'
            >
              <div className='absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full'>
                <div className='font-semibold flex flex-row items-center gap-2 text-white p-2.5'>
                  <p>{deviceCamera}</p>
                  <Icon icon='fluent:video-24-filled' width={20} height={20} />
                </div>
              </div>
              <div className='absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full'>
                <AnimatePresence mode='wait'>
                  <motion.p
                    key={`${resolution.width}x${resolution.height}-${fps}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className='text-white p-2.5'
                  >
                    {resolution.height}P | {fps}
                  </motion.p>
                </AnimatePresence>
                <button
                  onClick={() => setFlashOn(!flashOn)}
                  type='button'
                  aria-label='Flash'
                  title='Flash'
                  className={`text-sm font-semibold p-2.5 rounded-xl shadow-md transition-all ${
                    flashOn
                      ? 'bg-gradient-to-br from-blue-500 to-blue-400'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-white/20 hover:bg-[#285ec9]'
                  } text-white`}
                >
                  <Icon icon='fluent:flash-32-filled' width={20} height={20} />
                </button>{' '}
              </div>{' '}
              {cameraUrl && isCameraUrlValid ? (
                <DynamicVideoStream
                  url={cameraUrl}
                  alt='Live Camera Stream'
                  className='rounded-2xl w-auto h-full object-cover max-h-[400px]'
                  onError={(error: string) => {
                    console.error('Camera stream error:', error);
                    setCameraUrlError(error);
                  }}
                  onLoad={() => setCameraUrlError('')}
                  refreshInterval={500} // 500ms refresh for HTTP streams
                />
              ) : (
                <div className='flex flex-col items-center justify-center w-full h-full min-h-[300px]'>
                  <Icon
                    icon='fluent:video-off-24-filled'
                    width={48}
                    height={48}
                    className='text-gray-400 mb-2'
                  />
                  <p className='text-gray-400 text-center'>
                    {cameraUrlError || 'Invalid camera URL'}
                  </p>
                  <p className='text-xs text-gray-500 mt-2 text-center'>
                    Configure camera URL in Settings
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col gap-2.5 p-4 items-center justify-center w-full h-full rounded-2xl border-2 min-h-[300px] transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-blue-500/5 to-blue-400/5 border-blue-500/10'
                  : 'bg-gradient-to-br from-blue-500/10 to-blue-400/10 border-blue-500/20'
              }`}
            >
              <div className='p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400'>
                <Icon
                  icon='fluent:video-off-24-filled'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div>{' '}
              <p className='font-semibold text-lg bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text text-center'>
                Video Stream Unavailable!
              </p>
              <div className='flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full text-white text-sm text-center'>
                Please check RoboGo connection!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
