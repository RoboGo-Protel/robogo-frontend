import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCardList from '@/components/cards/StatsCard';
// import DirectionalControl from '@/components/DirectionalControl';
import CompassHUD from '@/components/CompassHUD';
import BoatOrientationHUD from '@/components/OrientationHUD';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import StopMonitoringResult from './StopMonitoringResult';
import { useStopMonitoringResult } from './StopMonitoringResultContext';
import DynamicVideoStream from '@/components/DynamicVideoStreamOptimized';
import { useUserConfig } from '@/hooks/useUserConfig';

interface ImportLogResult {
  totalData: number;
  success: boolean;
  duplication: boolean;
  message: string;
}

interface ImportedReport {
  ultrasonic_logs: ImportLogResult;
  imu_logs: ImportLogResult;
}

export interface StopMonitoringResultType {
  stopped: boolean;
  sessionId: number;
  date: string;
  importedReport: ImportedReport;
}

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
  currentSession = 0,
}: MidAreaMonitoringProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
    'idle',  );  const { promise } = useToast();  const { isDark } = useDarkMode();
  // const [flashOn, setFlashOn] = useState(false); // Flash control is now integrated into stream settings dropdown
  const [fps] = useState(0);
  const [resolution] = useState({ width: 0, height: 0 });
  const [deviceCamera] = useState('None');

  const { stopResult, setStopResult } = useStopMonitoringResult();
  const [cameraUrl, setCameraUrl] = useState<string>('');const [cameraUrlError, setCameraUrlError] = useState<string>('');
  const [streamType, setStreamType] = useState<string>('');  const [hasWebSocketError, setHasWebSocketError] = useState<boolean>(false);
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState<boolean>(false);  const [isStreamLoaded, setIsStreamLoaded] = useState<boolean>(false);
  const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);  const [newCameraUrl, setNewCameraUrl] = useState<string>('');
  const [showStreamSettings, setShowStreamSettings] = useState<boolean>(false);  const [streamQuality, setStreamQuality] = useState<string>('NORMAL');
  const [isChangingQuality, setIsChangingQuality] = useState<boolean>(false);
  const [currentFlashState, setCurrentFlashState] = useState<string>('off');
  // Device management
  const { selectedDevice, config } = useUserConfig();

  // Fetch user configuration on component mount
  useEffect(() => {    const fetchUserConfig = async () => {
      try {
        // Use config from useUserConfig hook if available
        if (config?.cameraStreamUrl) {
          console.log('Using camera URL from config:', config.cameraStreamUrl);
          setCameraUrl(config.cameraStreamUrl);
          setCameraUrlError('');
          setIsStreamLoaded(false); // Reset stream loaded state
          setHasWebSocketError(false); // Reset error states
          setIsWebSocketConnecting(false);
          // Detect stream type
          if (config.cameraStreamUrl.startsWith('ws://') || config.cameraStreamUrl.startsWith('wss://')) {
            setStreamType('WEBSOCKET');
          } else if (config.cameraStreamUrl.startsWith('http://') || config.cameraStreamUrl.startsWith('https://')) {
            setStreamType('HTTP');
          } else {
            setStreamType('UNKNOWN');
          }
          return;
        }

        // Fallback to API call if config not loaded yet
        const response = await fetch('/api/user/config');
        if (response.ok) {
          const data = await response.json();          console.log('API response:', data);
          if (data.data?.cameraStreamUrl) {
            console.log(
              'Using camera URL from API:',
              data.data.cameraStreamUrl,
            );
            setCameraUrl(data.data.cameraStreamUrl);
            setCameraUrlError('');
            setIsStreamLoaded(false); // Reset stream loaded state
            setHasWebSocketError(false); // Reset error states
            setIsWebSocketConnecting(false);
            // Detect stream type
            if (data.data.cameraStreamUrl.startsWith('ws://') || data.data.cameraStreamUrl.startsWith('wss://')) {
              setStreamType('WEBSOCKET');
            } else if (data.data.cameraStreamUrl.startsWith('http://') || data.data.cameraStreamUrl.startsWith('https://')) {
              setStreamType('HTTP');
            } else {
              setStreamType('UNKNOWN');
            }
          } else {
            console.log('No camera URL in API response, using fallback');
            setCameraUrl('http://192.168.171.17/stream'); // fallback to original hardcoded URL
            setStreamType('HTTP');
            setIsStreamLoaded(false);
            setHasWebSocketError(false);
            setIsWebSocketConnecting(false);
          }        } else {
          console.warn('Failed to fetch user config, using fallback URL');
          setCameraUrl('http://192.168.171.17/stream');
          setStreamType('HTTP');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);
          setIsWebSocketConnecting(false);
        }
      } catch (error) {
        console.error('Error fetching user config:', error);
        setCameraUrl('http://192.168.171.17/stream'); // fallback to original hardcoded URL
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
  }; // Check if current camera URL is valid
  const isCameraUrlValid = validateCameraUrl(cameraUrl);  // Debug logs
  console.log('Camera URL:', cameraUrl);
  console.log('Camera URL valid:', isCameraUrlValid);
  console.log('Stream type:', streamType);
  console.log('Has WebSocket error:', hasWebSocketError);
  console.log('Is WebSocket connecting:', isWebSocketConnecting);
  console.log('Is stream loaded:', isStreamLoaded);
    // Stream is active when we have a valid camera URL and no active connection errors
  // We don't wait for onLoad for WebSocket streams as they may not fire the event consistently
  const isStreamActive = cameraUrl && isCameraUrlValid && !hasWebSocketError;
  console.log('Stream active:', isStreamActive);

  // Debug HUD visibility
  const shouldShowHUD = (isStreamLoaded || cameraUrl);
  console.log('Should show HUD:', shouldShowHUD);
  console.log('Data monitoring length:', dataMonitoring?.length || 0);
  if (dataMonitoring && dataMonitoring.length > 0) {
    console.log('Latest heading:', dataMonitoring[dataMonitoring.length - 1]?.metadata?.heading);
    console.log('Latest roll:', dataMonitoring[dataMonitoring.length - 1]?.metadata?.roll);
  }

  const latestData = dataMonitoring[dataMonitoring.length - 1];

  const handleRecordClick = async () => {
    try {
      if (recordingState === 'idle') {
        const res = await fetch('http://localhost:4000/record/start');
        const json = await res.json();
        if (json.success) {
          setRecordingState('recording');
          alert('Recording started!');
        } else {
          alert('❌ Failed: ' + json.message);
        }
      } else {
        const res = await fetch('http://localhost:4000/record/stop');
        const json = await res.json();
        if (json.success && json.saved) {
          alert('📁 Recording saved to:\n' + json.saved);
        } else {
          alert('❌ Failed to stop/save recording.');
        }
        setRecordingState('idle');
      }
    } catch (err) {
      console.error('Recording error:', err);
      alert('❌ Error saat menghubungi server.');
    }
  };
  const handleStartMonitoring = async () => {
    if (!selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Starting monitoring...',
        success: 'Monitoring started successfully!',
        error: 'Please select a device before starting monitoring.',
      });
      return;
    }
    try {
      await promise(
        fetch(
          `/api/monitoring/realtime/start-monitoring?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
          {
            method: 'GET',
          },
        ).then((res) => {
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(
                text || res.statusText || 'Failed to start monitoring',
              );
            });
          }
        }),
        {
          loading: 'Starting monitoring...',
          success: `Monitoring started for device: ${selectedDevice.deviceName}!`,
          error: 'Failed to start monitoring. Please try again.',
        },
      );
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const showStopResult = (result: StopMonitoringResultType) => {
    setStopResult(result);
  };
  const handleStopMonitoring = async () => {
    if (!selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Stopping monitoring...',
        success: 'Monitoring stopped successfully!',
        error: 'Please select a device before stopping monitoring.',
      });
      return;
    }
    try {
      const res = await fetch(
        `/api/monitoring/realtime/stop-monitoring?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
        {
          method: 'GET',
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText || 'Failed to stop monitoring');
      }
      const json = await res.json();
      showStopResult(json.data);
      await promise(Promise.resolve(), {
        loading: 'Stopping monitoring...',
        success: `Monitoring stopped for device: ${selectedDevice.deviceName}!`,
        error: 'Failed to stop monitoring. Please try again.',
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      await promise(Promise.reject(), {
        loading: 'Stopping monitoring...',
        success: 'Monitoring stopped successfully!',
        error: 'Failed to stop monitoring. Please try again.',
      });
    }
  };
  const listButtons = [
    {
      icon:
        recordingState === 'idle'
          ? 'fluent:video-recording-20-filled'
          : 'fluent:stop-24-filled',
      text: recordingState === 'idle' ? 'Start Recording' : 'Stop Recording',
      onClick: handleRecordClick,
    },
    {
      icon: 'mynaui:chip-solid',
      text: 'Recalibrate IMU',
      onClick: () => {},
    },
    {
      icon: 'mingcute:camera-2-ai-fill',
      text: 'Take Photo',
      onClick: () => {
        fetch('http://localhost:4000/capture')
          .then((res) => res.json())
          .then((data) => {
            console.log('📸 Captured:', data);
            alert('Snapshot berhasil disimpan!');
          })
          .catch((err) => {
            console.error('Capture failed:', err);
          });
      },
    },
  ];

  // Function to handle camera URL configuration
  const handleCameraUrlConfig = () => {
    setNewCameraUrl(cameraUrl || '');
    setShowUrlConfig(true);
  };

  const handleSaveCameraUrl = async () => {
    if (!newCameraUrl.trim()) {
      await promise(Promise.reject(new Error('Camera URL cannot be empty')), {
        loading: 'Validating URL...',
        success: 'URL validated!',
        error: 'Please enter a valid camera URL.',
      });
      return;
    }

    try {
      await promise(
        fetch('/api/user/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cameraStreamUrl: newCameraUrl.trim(),
          }),
        }).then((res) => {
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(text || res.statusText || 'Failed to save camera URL');
            });
          }
          return res.json();
        }),
        {
          loading: 'Saving camera URL...',
          success: 'Camera URL saved successfully!',
          error: 'Failed to save camera URL. Please try again.',
        }
      );

      // Update local state
      setCameraUrl(newCameraUrl.trim());
      setCameraUrlError('');
      setIsStreamLoaded(false);
      setHasWebSocketError(false);
      setIsWebSocketConnecting(false);
      
      // Detect and set stream type
      if (newCameraUrl.trim().startsWith('ws://') || newCameraUrl.trim().startsWith('wss://')) {
        setStreamType('WEBSOCKET');
      } else if (newCameraUrl.trim().startsWith('http://') || newCameraUrl.trim().startsWith('https://')) {
        setStreamType('HTTP');
      } else {
        setStreamType('UNKNOWN');
      }
      
      setShowUrlConfig(false);
    } catch (error) {
      console.error('Error saving camera URL:', error);
    }
  };
  // Function to handle stream disconnect
  const handleStreamDisconnect = () => {
    setCameraUrl('');
    setCameraUrlError('Stream disconnected by user');
    setIsStreamLoaded(false);
    setHasWebSocketError(false);
    setIsWebSocketConnecting(false);
    setStreamType('');
  };

  // Function to handle stream connect
  const handleStreamConnect = async () => {
    // Get the last used camera URL or use default
    try {
      const response = await fetch('/api/user/config');
      if (response.ok) {
        const data = await response.json();
        if (data.data?.cameraStreamUrl) {
          setCameraUrl(data.data.cameraStreamUrl);
          setCameraUrlError('');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);
          setIsWebSocketConnecting(false);
          
          // Detect stream type
          if (data.data.cameraStreamUrl.startsWith('ws://') || data.data.cameraStreamUrl.startsWith('wss://')) {
            setStreamType('WEBSOCKET');
          } else if (data.data.cameraStreamUrl.startsWith('http://') || data.data.cameraStreamUrl.startsWith('https://')) {
            setStreamType('HTTP');
          } else {
            setStreamType('UNKNOWN');
          }
          
          await promise(Promise.resolve(), {
            loading: 'Connecting to stream...',
            success: 'Stream connection initiated!',
            error: 'Failed to connect to stream.',
          });
        } else {
          // No URL configured, open configuration modal
          handleCameraUrlConfig();
        }
      } else {
        // API error, open configuration modal
        handleCameraUrlConfig();
      }
    } catch (error) {
      console.error('Error connecting to stream:', error);
      // On error, open configuration modal
      handleCameraUrlConfig();
    }
  };  // Function to handle stream quality change
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
      
      console.log(`📡 Setting stream quality to ${quality} via: ${qualityEndpoint}`);
      
      await promise(
        fetch(qualityEndpoint, {
          method: 'GET',
          mode: 'no-cors',
        }),
        {
          loading: `Setting stream quality to ${quality}...`,
          success: `Stream quality set to ${quality}`,
          error: `Failed to set stream quality to ${quality}`,
        }
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
  const handleFlashControl = async (action: 'on' | 'off' | 'bright' | 'medium' | 'low' | 'dim') => {
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
        }
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
    >      <div className='relative flex-1 w-full h-[300px] md:h-full rounded-2xl overflow-hidden'>
        <AnimatePresence mode='wait'>          {isStreamActive ? (
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
              <CompassHUD heading={dataMonitoring && dataMonitoring.length > 0 ? dataMonitoring[dataMonitoring.length - 1]?.metadata?.heading ?? 0 : 0} />
              <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                <BoatOrientationHUD
                  roll={dataMonitoring && dataMonitoring.length > 0 ? dataMonitoring[dataMonitoring.length - 1]?.metadata?.roll ?? 0 : 0}
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
                  className='w-full h-full object-cover absolute inset-0'
                  onError={(error: string) => {
                      console.error('🚨 Camera stream error:', error);
                      console.error('Camera URL was:', cameraUrl);
                      console.error('URL validation result:', isCameraUrlValid);
                      console.error('Is changing quality:', isChangingQuality);
                      
                      // Don't reset connection if we're just changing quality
                      if (isChangingQuality) {
                        console.log('🔄 Ignoring error during quality change');
                        return;
                      }
                      
                      setCameraUrlError(error);
                      setIsStreamLoaded(false);
                      
                      // Check for WebSocket connection errors
                      if (error.includes('1006') || error.includes('Connection closed') || 
                          (streamType === 'WEBSOCKET' && (error.includes('WebSocket') || error.includes('connection')))) {
                        setHasWebSocketError(true);
                        setIsWebSocketConnecting(false);
                      }
                      
                      // Check if it's still connecting
                      if (error.includes('Connecting to WebSocket') || error.includes('connecting')) {
                        setIsWebSocketConnecting(true);
                        setHasWebSocketError(false);
                      }
                    }}
                    onLoad={() => {                      console.log(
                        '✅ Camera stream loaded successfully for URL:',
                        cameraUrl,
                      );
                      setCameraUrlError('');
                      setHasWebSocketError(false); // Reset error state on successful load
                      setIsWebSocketConnecting(false); // Reset connecting state
                      setIsStreamLoaded(true); // Mark stream as loaded
                    }}
                    refreshInterval={1000} // 1 second refresh for HTTP streams
                  />
                  {/* HUD Overlays - Show when stream is active */}
                  {(isStreamLoaded || cameraUrl) && (
                    <>
                      <div className='absolute top-4 left-4 z-30 p-2 bg-black/20 rounded-lg backdrop-blur-sm'>
                        <CompassHUD heading={dataMonitoring && dataMonitoring.length > 0 ? dataMonitoring[dataMonitoring.length - 1]?.metadata?.heading ?? 0 : 45} />
                      </div>
                      
                      <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-30'>
                        <div className='p-4 bg-black/10 rounded-lg backdrop-blur-sm'>
                          <BoatOrientationHUD
                            roll={dataMonitoring && dataMonitoring.length > 0 ? dataMonitoring[dataMonitoring.length - 1]?.metadata?.roll ?? 0 : 15}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Stream Control Buttons - Bottom Right Corner */}
                  <div className='absolute bottom-4 right-4 flex flex-col gap-2 z-20'>{/* Settings Dropdown */}                    <div className='relative stream-settings-dropdown'>
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
                            <div className={`p-1.5 rounded-lg ${
                              isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                            }`}>
                              <Icon 
                                icon='fluent:settings-24-filled' 
                                width={16} 
                                height={16} 
                                className='text-blue-500'
                              />
                            </div>
                            <span className={`font-semibold text-sm ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
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
                                className={isDark ? 'text-gray-400' : 'text-gray-600'}
                              />
                              <span className={`text-xs font-medium ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Quality Control
                              </span>
                            </div>
                            <div className='grid grid-cols-3 gap-2'>
                              {(['FAST', 'NORMAL', 'SLOW'] as const).map((quality) => (
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
                              ))}
                            </div>
                          </div>
                          
                          {/* Flash Control Section */}
                          <div className={`border-t pt-4 ${
                            isDark ? 'border-gray-600/30' : 'border-gray-200/50'
                          }`}>
                            <div className='flex items-center gap-2 mb-3'>
                              <Icon 
                                icon='fluent:lightbulb-24-regular' 
                                width={14} 
                                height={14} 
                                className={isDark ? 'text-gray-400' : 'text-gray-600'}
                              />
                              <span className={`text-xs font-medium ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
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
                                    icon={action === 'on' ? 'fluent:lightbulb-24-filled' : 'fluent:lightbulb-24-regular'} 
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
                                ))}                              </div>
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
                        title='Stream Settings'
                      >
                        <Icon 
                          icon={showStreamSettings ? 'fluent:settings-24-filled' : 'fluent:settings-24-regular'} 
                          width={20} 
                          height={20} 
                        />
                      </button>
                    </div>
                    
                    {/* Disconnect Button */}
                    <button
                      onClick={handleStreamDisconnect}
                      className='p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors'
                      title='Disconnect Stream'
                    >
                      <Icon icon='fluent:plug-disconnected-24-regular' width={20} height={20} />                    </button>
                  </div>
                </>
              ) : (<div className='flex flex-col items-center justify-center w-full h-full'>
                  <Icon
                    icon='fluent:video-off-24-filled'
                    width={48}
                    height={48}
                    className='text-gray-400 mb-2'
                  />                  <p className='text-gray-400 text-center text-sm'>
                    {isWebSocketConnecting 
                      ? 'Connecting to WebSocket...' 
                      : hasWebSocketError && streamType === 'WEBSOCKET' 
                        ? 'WebSocket connection lost' 
                        : (cameraUrlError || 'Camera stream not available')
                    }
                  </p>
                  <p className='text-gray-300 text-center text-xs mt-1'>
                    URL: {cameraUrl || 'Not configured'}
                  </p>
                  <p className='text-gray-300 text-center text-xs'>
                    Valid: {isCameraUrlValid ? 'Yes' : 'No'}
                  </p>
                  {streamType && (
                    <p className='text-gray-300 text-center text-xs'>
                      Stream Type: {streamType}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ) : (            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='relative flex flex-col gap-2.5 p-4 items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-400/10 w-full h-full rounded-2xl border-2 border-blue-500/20'
            >
              {' '}
              <div className='p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400'>
                <Icon
                  icon='fluent:video-off-24-filled'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div><p className='font-semibold text-lg bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text text-center'>
                {isWebSocketConnecting ? 'Connecting to Stream...' : 'Video Stream Unavailable!'}
              </p>
              <div className='flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full text-white text-sm text-center'>
                {isWebSocketConnecting ? 'Please wait while connecting...' : 'Please check RoboGo connection!'}
              </div>              {streamType && (
                <div className='flex flex-row items-center gap-2 px-3 py-1 bg-gray-500/20 rounded-full text-gray-600 text-xs text-center mt-2'>
                  Stream Type: {streamType}
                </div>
              )}
              
              {/* Stream Control Buttons */}
              <div className='flex flex-col sm:flex-row gap-3 mt-4'>
                {/* Connect Button - Primary action */}
                <button
                  onClick={handleStreamConnect}
                  className='flex flex-row items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-br from-blue-500 to-blue-400 text-white hover:from-blue-600 hover:to-blue-500 transition-colors'
                  title="Connect to Stream"
                >
                  <Icon icon='fluent:plug-connected-24-regular' width={18} height={18} />
                  Connect to Stream
                </button>
                
                {/* Configure URL Button - Secondary action */}
                {!isWebSocketConnecting && (
                  <button
                    onClick={handleCameraUrlConfig}
                    className={`flex flex-row items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border-2 ${
                      isDark
                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                        : 'border-blue-500/30 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                    title="Configure Camera URL"
                  >
                    <Icon icon='fluent:settings-24-regular' width={16} height={16} />
                    Configure URL
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
      )}{' '}      {/* Control buttons - always visible */}
      <div className='flex flex-col md:flex-row w-full gap-4'>
        {/* Conditionally render directional control based on user config */}
        {/* {!config?.hideMonitoringControls && (
          <DirectionalControl onDirectionClick={(dir) => console.log(dir)} />
        )} */}
        <div className='flex flex-col w-full gap-2.5'>
          <div className='grid grid-cols-1 md:grid-cols-6 gap-2.5 w-full h-fit'>
            <button
              onClick={handleStartMonitoring}
              disabled={!!currentSession && currentSession > 0}
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white col-span-1 md:col-span-3 ${!!currentSession && currentSession > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon icon='mingcute:play-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Start Monitoring
              </p>
            </button>

            <button
              onClick={handleStopMonitoring}
              disabled={!currentSession || currentSession === 0}
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl col-span-1 md:col-span-3 ${currentSession && currentSession > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-400 text-white opacity-50 cursor-not-allowed'}`}
            >
              <Icon icon='mingcute:stop-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Stop Monitoring
              </p>
            </button>            {listButtons.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl col-span-1 md:col-span-2 ${
                  isDark
                    ? 'border-blue-500/10 bg-[#0A1625] text-white'
                    : 'border-blue-400/20 bg-white text-black'
                }`}
              >
                <p
                  className={`font-semibold text-sm ${
                    isDark
                      ? 'text-white'
                      : 'bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text'
                  }`}
                >
                  {item.text}
                </p>
                <Icon
                  icon={item.icon}
                  width={20}
                  height={20}
                  className={isDark ? 'text-blue-500' : 'text-[#39A9F9]'}
                />
              </button>
            ))}
          </div>
  </div>
      </div>
      
      {/* Camera URL Configuration Modal */}
      <AnimatePresence>
        {showUrlConfig && (
          <motion.div
                        className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
                        variants={{
                          hidden: { opacity: 0 },
                          visible: { opacity: 1 },
                          exit: { opacity: 0 },
                        }}
                        initial='hidden'
                        animate='visible'
                        exit='exit'
                        transition={{ duration: 0.3 }}
                      >
            <div className={`rounded-xl shadow-xl p-6 max-w-md w-full mx-4 relative ${
              isDark ? 'bg-[#101c2b] text-white' : 'bg-white text-black'
            }`}>
              <button
                className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl font-bold z-10 p-1 rounded-full transition-colors'
                onClick={() => setShowUrlConfig(false)}
                aria-label='Close'
                type='button'
              >
                <Icon icon='mingcute:close-line' width={20} height={20} />
              </button>
              
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400'>
                  <Icon icon='fluent:video-24-filled' width={24} height={24} className='text-white' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>Configure Camera URL</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter your camera stream URL
                  </p>
                </div>
              </div>
              
              <div className='space-y-4'>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Camera Stream URL
                  </label>
                  <input
                    type='text'
                    value={newCameraUrl}
                    onChange={(e) => setNewCameraUrl(e.target.value)}
                    placeholder='ws://192.168.1.100:81/stream or http://192.168.1.100/stream'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDark
                        ? 'bg-[#1a2332] border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Supports WebSocket (ws://, wss://) and HTTP (http://, https://) streams
                  </p>
                </div>
                
                <div className='flex gap-3'>
                  <button
                    onClick={() => setShowUrlConfig(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCameraUrl}
                    className='flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-br from-blue-500 to-blue-400 text-white hover:from-blue-600 hover:to-blue-500 transition-colors'
                  >
                    Save URL
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dialog Stop Monitoring Result */}
      <AnimatePresence>
        {stopResult && (
          <motion.div
            key='stop-result-popup'
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
          >
            <div className='bg-white rounded-xl shadow-xl p-0 md:p-0 max-w-lg w-full relative dark:bg-[#101c2b]'>
              <button
                className='absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl font-bold z-10 p-2 rounded-full transition-colors'
                onClick={() => setStopResult(null)}
                aria-label='Close'
                type='button'
              >
                <Icon icon='mingcute:close-line' width={24} height={24} />
              </button>
              <StopMonitoringResult result={stopResult} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
