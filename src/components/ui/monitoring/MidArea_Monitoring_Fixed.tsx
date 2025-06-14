import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCardList from '@/components/cards/StatsCard';
// import DirectionalControl from '@/components/DirectionalControl';
import CompassHUD from '@/components/CompassHUD';
import BoatOrientationHUD from '@/components/OrientationHUD';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
// import StopMonitoringResult from './StopMonitoringResult';
// import { useStopMonitoringResult } from './StopMonitoringResultContext';
import DynamicVideoStream from '@/components/DynamicVideoStreamOptimized';
import { useUserConfig } from '@/hooks/useUserConfig';

// interface ImportLogResult {
//   totalData: number;
//   success: boolean;
//   duplication: boolean;
//   message: string;
// }

// interface ImportedReport {
//   ultrasonic_logs: ImportLogResult;
//   imu_logs: ImportLogResult;
// }

// export interface StopMonitoringResultType {
//   stopped: boolean;
//   sessionId: number;
//   date: string;
//   importedReport: ImportedReport;
// }

interface Metadata {
  ultrasonic: number;
  heading: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface Data {
  id: string;
  src: string;
  alt: string;
  obstacle: boolean;
  date: string;
  fileName: string;
  createdAt: string;
  metadata: Metadata;
}

interface MidAreaMonitoringProps {
  dataMonitoring: Data[];
  currentSession?: number | null;
}

export default function MidArea_Monitoring({
  dataMonitoring,
  // currentSession = 0,
}: MidAreaMonitoringProps) {
  // const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
  //   'idle',
  // );
  const { promise } = useToast();
  const { isDark } = useDarkMode();
  const [fps] = useState(0);
  const [resolution] = useState({ width: 0, height: 0 });
  const [deviceCamera] = useState('None');  // const { stopResult, setStopResult } = useStopMonitoringResult();
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [, setCameraUrlError] = useState<string>('');
  const [streamType, setStreamType] = useState<string>('');
  const [hasWebSocketError, setHasWebSocketError] = useState<boolean>(false);
  const [isWebSocketConnecting, setIsWebSocketConnecting] =
    useState<boolean>(false);
  const [isStreamLoaded, setIsStreamLoaded] = useState<boolean>(false);
  // const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);
  // const [newCameraUrl, setNewCameraUrl] = useState<string>('');
  const [showStreamSettings, setShowStreamSettings] = useState<boolean>(false);
  const [streamQuality, setStreamQuality] = useState<string>('NORMAL');
  const [, setIsChangingQuality] = useState<boolean>(false);
  const [currentFlashState, setCurrentFlashState] = useState<string>('off');

  // Device management
  const { config } = useUserConfig();

  // Fetch user configuration on component mount
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        // Use config from useUserConfig hook if available
        if (config?.cameraStreamUrl) {
          console.log('Using camera URL from config:', config.cameraStreamUrl);
          setCameraUrl(config.cameraStreamUrl);
          setCameraUrlError('');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);
          setIsWebSocketConnecting(false);
          // Detect stream type
          if (
            config.cameraStreamUrl.startsWith('ws://') ||
            config.cameraStreamUrl.startsWith('wss://')
          ) {
            setStreamType('WEBSOCKET');
          } else if (
            config.cameraStreamUrl.startsWith('http://') ||
            config.cameraStreamUrl.startsWith('https://')
          ) {
            setStreamType('HTTP');
          } else {
            setStreamType('UNKNOWN');
          }
          return;
        }

        // Fallback to API call if config not loaded yet
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();
          console.log('API response:', data);
          if (data.data?.cameraStreamUrl) {
            console.log(
              'Using camera URL from API:',
              data.data.cameraStreamUrl,
            );
            setCameraUrl(data.data.cameraStreamUrl);
            setCameraUrlError('');
            setIsStreamLoaded(false);
            setHasWebSocketError(false);
            setIsWebSocketConnecting(false);
            // Detect stream type
            if (
              data.data.cameraStreamUrl.startsWith('ws://') ||
              data.data.cameraStreamUrl.startsWith('wss://')
            ) {
              setStreamType('WEBSOCKET');
            } else if (
              data.data.cameraStreamUrl.startsWith('http://') ||
              data.data.cameraStreamUrl.startsWith('https://')
            ) {
              setStreamType('HTTP');
            } else {
              setStreamType('UNKNOWN');
            }
          } else {
            console.log('No camera URL in API response, using fallback');
            setCameraUrl('http://192.168.171.17/stream');
            setStreamType('HTTP');
            setIsStreamLoaded(false);
            setHasWebSocketError(false);
            setIsWebSocketConnecting(false);
          }
        } else {
          console.warn('Failed to fetch user config, using fallback URL');
          setCameraUrl('http://192.168.171.17/stream');
          setStreamType('HTTP');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);
          setIsWebSocketConnecting(false);
        }
      } catch (error) {
        console.error('Error fetching user config:', error);
        setCameraUrl('http://192.168.171.17/stream');
        setStreamType('HTTP');
        setIsStreamLoaded(false);
        setHasWebSocketError(false);
        setIsWebSocketConnecting(false);
      }
    };

    fetchUserConfig();
  }, [config]);

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

  // Debug logs
  console.log('Camera URL:', cameraUrl);
  console.log('Camera URL valid:', isCameraUrlValid);
  console.log('Stream type:', streamType);
  console.log('Has WebSocket error:', hasWebSocketError);
  console.log('Is WebSocket connecting:', isWebSocketConnecting);
  console.log('Is stream loaded:', isStreamLoaded);

  // Stream is active when we have a valid camera URL and no active connection errors
  const isStreamActive = cameraUrl && isCameraUrlValid && !hasWebSocketError;
  console.log('Stream active:', isStreamActive);
  const latestData = dataMonitoring[dataMonitoring.length - 1];

  // Function to handle stream quality changes
  const handleStreamQuality = async (quality: 'FAST' | 'NORMAL' | 'SLOW') => {
    if (!cameraUrl) return;

    try {
      setIsChangingQuality(true); // Set flag to prevent stream reset

      // Extract IP address and construct HTTP URL for quality endpoints
      let baseUrl = '';

      if (cameraUrl.startsWith('ws://') || cameraUrl.startsWith('wss://')) {
        // For WebSocket URLs, extract IP address only
        const wsUrl = new URL(cameraUrl);
        const protocol = cameraUrl.startsWith('wss://') ? 'https' : 'http';
        const host = wsUrl.hostname; // Only IP address, no port

        baseUrl = `${protocol}://${host}`;
      } else {
        // For HTTP URLs, extract IP address only
        const httpUrl = new URL(cameraUrl);
        const protocol = httpUrl.protocol;
        const host = httpUrl.hostname; // Only IP address, no port

        baseUrl = `${protocol}//${host}`;
      }

      const qualityEndpoint = `${baseUrl}/${quality.toLowerCase()}`;

      console.log(
        `📡 Setting stream quality to ${quality} via: ${qualityEndpoint}`,
      );

      await promise(
        fetch(qualityEndpoint, {
          method: 'GET',
          mode: 'no-cors',
        }),
        {
          loading: `Setting stream quality to ${quality}...`,
          success: `Stream quality set to ${quality}`,
          error: `Failed to set stream quality to ${quality}`,
        },
      );

      setStreamQuality(quality);
      setShowStreamSettings(false);
    } catch (error) {
      console.error('Error setting stream quality:', error);
    } finally {
      // Reset flag after a delay to prevent immediate reconnection issues
      setTimeout(() => {
        setIsChangingQuality(false);
      }, 2000);
    }
  };

  // Function to handle flash control
  const handleFlashControl = async (
    action: 'on' | 'off' | 'bright' | 'medium' | 'low' | 'dim',
  ) => {
    if (!cameraUrl) return;

    try {
      // Extract IP address for flash control
      let baseUrl = '';

      if (cameraUrl.startsWith('ws://') || cameraUrl.startsWith('wss://')) {
        const wsUrl = new URL(cameraUrl);
        const protocol = cameraUrl.startsWith('wss://') ? 'https' : 'http';
        const host = wsUrl.hostname;
        baseUrl = `${protocol}://${host}`;
      } else {
        const httpUrl = new URL(cameraUrl);
        const protocol = httpUrl.protocol;
        const host = httpUrl.hostname;
        baseUrl = `${protocol}//${host}`;
      }

      const flashEndpoint = `${baseUrl}/flash_${action}`;

      console.log(`💡 Setting flash to ${action} via: ${flashEndpoint}`);

      await promise(
        fetch(flashEndpoint, {
          method: 'GET',
          mode: 'no-cors',
        }),
        {
          loading: `Setting flash to ${action}...`,
          success: `Flash ${action.toUpperCase()} activated`,
          error: `Failed to set flash to ${action}`,
        },
      );

      setCurrentFlashState(action);
      setShowStreamSettings(false);
    } catch (error) {
      console.error('Error controlling flash:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStreamSettings) {
        const target = event.target as Element;
        if (!target.closest('.stream-settings-dropdown')) {
          setShowStreamSettings(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStreamSettings]);

  return (
    <div
      className={`flex flex-col items-start justify-start h-full gap-4 rounded-xl p-4 md:p-5 w-full border-2 ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      <div className='relative flex-1 w-full h-[300px] md:h-full rounded-2xl overflow-hidden'>
        <AnimatePresence mode='wait'>
          {isStreamActive ? (
            <motion.div
              key='stream-on'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col gap-2.5 p-4 items-center justify-center w-full h-full rounded-2xl border-2 ${
                isDark
                  ? 'bg-[#0F1B2B] border-[#113541]'
                  : 'bg-gradient-to-br from-blue-500/10 to-blue-400/10 border-blue-500/20'
              }`}
            >
              <CompassHUD heading={dataMonitoring[0]?.metadata?.heading ?? 0} />
              <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                <BoatOrientationHUD
                  roll={dataMonitoring[0]?.metadata?.roll ?? 0}
                />
              </div>
              <div className='absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full z-10'>
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
                <div className='absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full'>
                  <div className='font-semibold flex flex-row items-center gap-2 text-white p-2.5'>
                    <p>{deviceCamera}</p>
                    <Icon
                      icon='fluent:video-24-filled'
                      width={20}
                      height={20}
                    />
                  </div>
                </div>
              </div>
              {cameraUrl && isCameraUrlValid ? (
                <DynamicVideoStream
                  url={cameraUrl}
                  alt='Live Camera Stream'
                  className='w-full h-full object-cover absolute inset-0 rounded-2xl'
                  onError={(error: string) => {
                    console.error('🚨 Camera stream error:', error);
                    setCameraUrlError(error);
                    setIsStreamLoaded(false);

                    if (
                      error.includes('1006') ||
                      error.includes('Connection closed') ||
                      (streamType === 'WEBSOCKET' &&
                        (error.includes('WebSocket') ||
                          error.includes('connection')))
                    ) {
                      setHasWebSocketError(true);
                      setIsWebSocketConnecting(false);
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Camera stream loaded successfully');
                    setCameraUrlError('');
                    setHasWebSocketError(false);
                    setIsWebSocketConnecting(false);
                    setIsStreamLoaded(true);
                  }}
                  refreshInterval={1000}
                />
              ) : (
                <div className='flex flex-col items-center justify-center w-full h-full'>
                  <Icon
                    icon='fluent:video-off-24-filled'
                    width={48}
                    height={48}
                    className='text-gray-400 mb-2'
                  />
                  <p className='text-gray-400 text-center text-sm'>
                    Camera stream not available
                  </p>
                </div>
              )}

              {/* HUD Overlays - Only show when stream is connected and loaded */}
              {isStreamActive &&
                isStreamLoaded &&
                !hasWebSocketError &&
                !isWebSocketConnecting &&
                latestData && (
                  <>
                    {/* Compass HUD - Top Right */}
                    <div className='absolute top-4 right-4 z-30 pointer-events-none'>
                      <div className='bg-black/40 backdrop-blur-sm rounded-xl p-2'>
                        <CompassHUD heading={latestData.metadata.heading} />
                      </div>
                    </div>{' '}
                    {/* Boat Orientation HUD - Top Left */}
                    <div className='absolute top-4 left-4 z-30 pointer-events-none'>
                      <div className='bg-black/40 backdrop-blur-sm rounded-xl p-2'>
                        <BoatOrientationHUD
                          roll={latestData.metadata.roll || 0}
                        />
                      </div>
                    </div>
                  </>
                )}

              {/* Stream Control Buttons - Bottom Right Corner */}
              <div className='absolute bottom-4 right-4 flex flex-col gap-2 z-20'>
                {/* Settings Dropdown */}
                <div className='relative stream-settings-dropdown'>
                  <AnimatePresence>
                    {showStreamSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`absolute bottom-full right-0 mb-3 rounded-xl shadow-2xl border backdrop-blur-md p-4 min-w-[220px] ${
                          isDark
                            ? 'bg-[#1a2332]/90 border-gray-600/50'
                            : 'bg-white/90 border-gray-200/50'
                        }`}
                      >
                        {/* Header */}
                        <div className='flex items-center gap-2 mb-4'>
                          <div
                            className={`p-1.5 rounded-lg ${
                              isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                            }`}
                          >
                            <Icon
                              icon='fluent:settings-24-filled'
                              width={16}
                              height={16}
                              className='text-blue-500'
                            />
                          </div>
                          <span
                            className={`font-semibold text-sm ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}
                          >
                            Stream Settings
                          </span>
                        </div>

                        {/* Stream Quality Section */}
                        <div className='mb-4'>
                          <div className='flex items-center gap-2 mb-3'>
                            <Icon
                              icon='fluent:gauge-24-regular'
                              width={14}
                              height={14}
                              className={
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              Quality Control
                            </span>
                          </div>
                          <div className='grid grid-cols-3 gap-2'>
                            {(['FAST', 'NORMAL', 'SLOW'] as const).map(
                              (quality) => (
                                <button
                                  key={quality}
                                  onClick={() => handleStreamQuality(quality)}
                                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                                    streamQuality === quality
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                                      : isDark
                                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                  }`}
                                >
                                  {quality}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        {/* Flash Control Section */}
                        <div
                          className={`border-t pt-4 ${
                            isDark ? 'border-gray-600/30' : 'border-gray-200/50'
                          }`}
                        >
                          <div className='flex items-center gap-2 mb-3'>
                            <Icon
                              icon='fluent:lightbulb-24-regular'
                              width={14}
                              height={14}
                              className={
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              Flash Control
                            </span>
                          </div>

                          {/* Main Flash Toggle */}
                          <div className='grid grid-cols-2 gap-2 mb-3'>
                            {(['on', 'off'] as const).map((action) => (
                              <button
                                key={action}
                                onClick={() => handleFlashControl(action)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                                  currentFlashState === action
                                    ? action === 'on'
                                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/25 transform scale-105'
                                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25 transform scale-105'
                                    : isDark
                                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <Icon
                                  icon={
                                    action === 'on'
                                      ? 'fluent:lightbulb-24-filled'
                                      : 'fluent:lightbulb-24-regular'
                                  }
                                  width={12}
                                  height={12}
                                />
                                {action.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          {/* Brightness Levels */}
                          <div className='space-y-2'>
                            <div className='grid grid-cols-2 gap-2'>
                              {(['bright', 'medium'] as const).map((action) => (
                                <button
                                  key={action}
                                  onClick={() => handleFlashControl(action)}
                                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                                    currentFlashState === action
                                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md shadow-orange-500/25'
                                      : isDark
                                        ? 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30 hover:text-gray-300'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                  }`}
                                >
                                  {action.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                              {(['low', 'dim'] as const).map((action) => (
                                <button
                                  key={action}
                                  onClick={() => handleFlashControl(action)}
                                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                                    currentFlashState === action
                                      ? 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                                      : isDark
                                        ? 'bg-gray-700/30 text-gray-400 hover:bg-gray-600/30 hover:text-gray-300'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                  }`}
                                >
                                  {action.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setShowStreamSettings(!showStreamSettings)}
                    className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                      showStreamSettings
                        ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                        : 'bg-black/50 hover:bg-black/70 text-white hover:scale-105'
                    }`}
                  >
                    <Icon
                      icon={
                        showStreamSettings
                          ? 'fluent:settings-24-filled'
                          : 'fluent:settings-24-regular'
                      }
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='flex flex-col gap-2.5 p-4 items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-400/10 w-full h-full rounded-2xl border-2 border-blue-500/20'
            >
              <div className='p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400'>
                <Icon
                  icon='fluent:video-off-24-filled'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div>
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

      {/* Stats and monitoring data display */}
      {dataMonitoring && dataMonitoring.length > 0 ? (
        <div className='flex flex-col gap-4 items-stretch w-full h-fit'>
          <StatCardList
            variant='distance'
            infoItems={
              dataMonitoring[0]?.metadata?.distances
                ? [
                    {
                      title: 'Distance Total',
                      value:
                        latestData.metadata.distances.distTotal != null
                          ? `${latestData.metadata.distances.distTotal.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance X',
                      value:
                        latestData.metadata.distances.distX != null
                          ? `${latestData.metadata.distances.distX.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance Y',
                      value:
                        latestData.metadata.distances.distY != null
                          ? `${latestData.metadata.distances.distY.toFixed(2)} cm`
                          : '-',
                    },
                  ]
                : []
            }
          />
          <StatCardList
            variant='velocity'
            infoItems={
              dataMonitoring[0]?.metadata?.velocity
                ? [
                    {
                      title: 'Velocity Total',
                      value:
                        latestData.metadata.velocity.velTotal != null
                          ? `${latestData.metadata.velocity.velTotal.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocity != null
                            ? `${latestData.metadata.velocity.velocity.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity X',
                      value:
                        latestData.metadata.velocity.velX != null
                          ? `${latestData.metadata.velocity.velX.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityX != null
                            ? `${latestData.metadata.velocity.velocityX.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity Y',
                      value:
                        latestData.metadata.velocity.velY != null
                          ? `${latestData.metadata.velocity.velY.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityY != null
                            ? `${latestData.metadata.velocity.velocityY.toFixed(2)} m/s`
                            : '-',
                    },
                  ]
                : []
            }
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center w-full h-32 rounded-xl font-semibold text-lg ${
            isDark ? 'bg-[#113541] text-gray-300' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Start monitoring to show the data
        </div>
      )}
    </div>
  );
}
