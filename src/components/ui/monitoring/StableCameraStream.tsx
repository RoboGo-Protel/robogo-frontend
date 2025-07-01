import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Icon } from '@iconify/react';
import { useUserConfig } from '@/hooks/useUserConfig';
import CompassHUD from '@/components/CompassHUD';
import Link from 'next/link';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
// import BoatOrientationHUD from '@/components/OrientationHUD';

interface Metadata {
  ultrasonic?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  distanceTraveled?: number;
}

interface StableCameraStreamProps {
  metadata?: Metadata;
  isLocalMode?: boolean;
  autoPhotoEnabled?: boolean;
  onAutoPhotoToggle?: (enabled: boolean) => void;
}

export interface StableCameraStreamRef {
  captureFrame: () => Promise<Blob>;
  isConnected: boolean;
  toggleFlipVertical: () => void;
}

const StableCameraStream = forwardRef<
  StableCameraStreamRef,
  StableCameraStreamProps
>(
  (
    {
      metadata,
      isLocalMode = false,
      autoPhotoEnabled = false,
      onAutoPhotoToggle,
    },
    ref,
  ) => {
    // Debug: Log metadata received
    useEffect(() => {
      // Debug logging removed for production
    }, [metadata]);

    const imgRef = useRef<HTMLImageElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef<number>(0);
    const maxReconnectAttempts = 3;

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFlippedVertical, setIsFlippedVertical] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [streamQuality, setStreamQuality] = useState<
      'fast' | 'normal' | 'slow'
    >('normal');
    const { config } = useUserConfig();

    // Debug: Log config changes
    useEffect(() => {
      // Debug logging removed for production
    }, [config]); // Memoize camera URL - keep original URL for streaming
    const cameraUrl = useMemo(() => {
      const url = config?.cameraStreamUrl || '';
      // Simply use the URL as configured without modification
      return url;
    }, [config]);

    // Function to send quality setting to ESP32
    const sendQualityToESP32 = async (quality: 'fast' | 'normal' | 'slow') => {
      try {
        const baseUrl = config?.cameraStreamUrl || '';
        if (!baseUrl) return;

        // Extract IP address for HTTP request
        let ip = '';
        try {
          const url = new URL(baseUrl);
          ip = url.hostname;
        } catch {
          // Fallback: try to extract IP from string manually
          const ipMatch = baseUrl.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch) {
            ip = ipMatch[1];
          }
        }

        if (ip) {
          const qualityUrl = `http://${ip}/${quality}`;
          // Send HTTP request to ESP32 to change quality
          await fetch(qualityUrl, {
            method: 'GET',
          }).catch(() => {
            // Quality setting failed silently
          });
        }
      } catch {
        // Error handling silently
      }
    };

    // Memoize stream type determination
    const streamType = useMemo(() => {
      if (!cameraUrl) return 'none';
      if (cameraUrl.startsWith('ws://') || cameraUrl.startsWith('wss://')) {
        return 'websocket';
      }
      if (cameraUrl.startsWith('http://') || cameraUrl.startsWith('https://')) {
        return 'http';
      }
      return 'direct';
    }, [cameraUrl]);
    // Expose capture function via ref
    useImperativeHandle(
      ref,
      () => ({
        captureFrame: () => {
          return new Promise<Blob>((resolve, reject) => {
            if (!imgRef.current || !imgRef.current.src || !isConnected) {
              reject(new Error('No camera stream available to capture'));
              return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Failed to create canvas context'));
              return;
            }

            const img = imgRef.current;
            canvas.width = img.naturalWidth || img.width || 640;
            canvas.height = img.naturalHeight || img.height || 480;

            try {
              // Apply flip transformation if enabled
              if (isFlippedVertical) {
                ctx.scale(1, -1);
                ctx.translate(0, -canvas.height);
              }

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to create blob from canvas'));
                  }
                },
                'image/jpeg',
                0.9,
              );
            } catch (error) {
              reject(error);
            }
          });
        },
        isConnected,
        toggleFlipVertical: () => {
          setIsFlippedVertical((prev) => !prev);
        },
      }),
      [isConnected, isFlippedVertical],
    );

    // Stable WebSocket connection function
    const connectWebSocket = useMemo(() => {
      if (streamType !== 'websocket' || !cameraUrl) return null;

      return () => {
        // Prevent multiple connections
        if (
          wsRef.current?.readyState === WebSocket.CONNECTING ||
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          return;
        }

        setIsLoading(true);
        setError('');

        try {
          const ws = new WebSocket(cameraUrl);
          ws.binaryType = 'blob';
          wsRef.current = ws;

          ws.onopen = () => {
            setIsConnected(true);
            setIsLoading(false);
            setError('');
            reconnectAttempts.current = 0; // Reset attempts on successful connection
          };

          ws.onmessage = (event) => {
            try {
              if (event.data instanceof Blob && imgRef.current) {
                const imageUrl = URL.createObjectURL(event.data);
                imgRef.current.src = imageUrl;

                // Clean up blob URL after a delay
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
              }
            } catch {
              // Frame processing error handled silently
            }
          };
          ws.onerror = () => {
            setError('WebSocket connection failed');
            setIsConnected(false);
            setIsLoading(false);
          };

          ws.onclose = (event) => {
            setIsConnected(false);
            setIsLoading(false);

            // Only attempt reconnection if it wasn't a manual close and we haven't exceeded max attempts
            if (
              event.code !== 1000 &&
              reconnectAttempts.current < maxReconnectAttempts
            ) {
              reconnectAttempts.current++;
              setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                  connectWebSocket?.();
                }
              }, 2000 * reconnectAttempts.current); // Progressive delay
            } else {
              setError('Connection lost');
            }
          };
        } catch (err) {
          // Handle specific SecurityError for mixed content
          if (err instanceof DOMException && err.name === 'SecurityError') {
            const currentUrl = window.location.href;

            setError(`WebSocket Security Error: Cannot connect to insecure WebSocket (ws://) from HTTPS page.
          
Solutions:
1. Change camera URL to use wss:// (secure WebSocket)
2. Use HTTP stream instead (http://)
3. Access this page via HTTP instead of HTTPS

Current page: ${currentUrl}
Camera URL: ${cameraUrl}`);
          } else {
            setError(
              'Failed to connect to camera: ' +
                (err instanceof Error ? err.message : 'Unknown error'),
            );
          }
          setIsLoading(false);
        }
      };
    }, [cameraUrl, streamType]);

    // Single useEffect for managing connection - only depends on memoized values
    useEffect(() => {
      if (!cameraUrl) {
        setError('No camera URL configured');
        setIsLoading(false);
        return;
      }

      if (streamType === 'websocket' && connectWebSocket) {
        connectWebSocket();
      } else if (streamType === 'http' && imgRef.current) {
        // Simple HTTP/MJPEG stream
        setIsLoading(true);
        imgRef.current.src = cameraUrl;
        imgRef.current.onload = () => {
          setIsConnected(true);
          setIsLoading(false);
          setError('');
        };
        imgRef.current.onerror = () => {
          setError('Failed to load stream');
          setIsLoading(false);
        };
      }

      // Cleanup function
      return () => {
        if (wsRef.current) {
          const ws = wsRef.current;
          if (
            ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING
          ) {
            ws.close(1000, 'Component cleanup');
          }
          wsRef.current = null;
        }
      };
    }, [cameraUrl, streamType, connectWebSocket]);
    // Manual reconnect function
    const handleReconnect = () => {
      reconnectAttempts.current = 0; // Reset attempts

      if (wsRef.current) {
        wsRef.current.close(1000, 'Manual reconnect');
      }

      setTimeout(() => {
        if (connectWebSocket) {
          connectWebSocket();
        } else if (streamType === 'http' && imgRef.current) {
          // Force reload for HTTP streams
          const currentSrc = imgRef.current.src;
          imgRef.current.src = '';
          setTimeout(() => {
            if (imgRef.current) {
              imgRef.current.src = currentSrc;
            }
          }, 100);
        }
      }, 500);
    }; // Handle quality change with ESP32 communication
    const handleQualityChange = (newQuality: 'fast' | 'normal' | 'slow') => {
      setStreamQuality(newQuality);
      // Send quality setting to ESP32
      sendQualityToESP32(newQuality);
    };

    // Check if camera URL is properly configured
    const isCameraConfigured = useMemo(() => {
      if (!cameraUrl || cameraUrl.trim() === '') return false;

      // Check if it's still default placeholder values
      const defaultUrls = [
        'http://192.168.1.100/stream',
        'http://192.168.1.100',
        'ws://192.168.1.100:8080',
        'ws://192.168.1.100',
      ];

      return !defaultUrls.includes(cameraUrl.trim());
    }, [cameraUrl]);

    if (!cameraUrl || !isCameraConfigured) {
      return (
        <div className='w-full h-full flex items-center justify-center bg-gray-900 rounded-2xl'>
          <div className='text-center text-gray-400 max-w-md mx-auto p-6'>
            <Icon
              icon='fluent:camera-off-24-regular'
              width={64}
              height={64}
              className='mx-auto mb-4 text-gray-500'
            />
            <h3 className='text-xl font-semibold text-white mb-2'>
              {!cameraUrl ? 'Camera Not Configured' : 'Camera Settings Needed'}
            </h3>
            <p className='text-gray-400 mb-6 leading-relaxed'>
              {!cameraUrl
                ? 'No camera stream URL has been configured yet. Please set up your camera settings to start streaming.'
                : 'Please update your camera settings with the correct IP address and configuration for your ESP32 camera.'}
            </p>
            <div className='space-y-3'>
              <Link
                href='/settings'
                className='w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium'
              >
                <Icon
                  icon='fluent:settings-24-regular'
                  width={20}
                  height={20}
                />
                Open Camera Settings
              </Link>

              <p className='text-xs text-gray-500'>
                Configure HTTP or WebSocket camera stream in settings
              </p>
            </div>
            {/* Debug info - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className='mt-4 p-3 bg-gray-800 rounded-lg text-xs text-left'>
                <p className='text-gray-400 mb-1'>Debug Info:</p>
                <p className='text-gray-500'>URL: {cameraUrl || 'empty'}</p>
                <p className='text-gray-500'>
                  Configured: {isCameraConfigured ? 'yes' : 'no'}
                </p>
                <p className='text-gray-500'>
                  Config: {config ? 'loaded' : 'null'}
                </p>
                <p className='text-gray-500'>
                  Config URL: {config?.cameraStreamUrl || 'empty'}
                </p>
              </div>
            )}{' '}
          </div>
        </div>
      );
    }

    return (
      <div className='relative w-full h-full bg-black rounded-2xl overflow-hidden'>
        {' '}
        {/* Video Stream */}{' '}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          alt='RoboGo Camera Stream'
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isFlippedVertical ? 'scale-y-[-1]' : ''
          }`}
          style={{ display: isConnected ? 'block' : 'none' }}
        />
        {/* Loading State */}
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-900'>
            <div className='text-center text-white'>
              <Icon
                icon='fluent:spinner-ios-20-filled'
                width={32}
                height={32}
                className='mx-auto mb-2 animate-spin'
              />
              <p className='text-sm'>Connecting to camera...</p>
            </div>
          </div>
        )}{' '}
        {/* Auto-Capture Badge - When WiFi disconnected */}
        {!isConnected && cameraUrl && isCameraConfigured && (
          <div className='absolute top-4 left-4 z-30'>
            <div
              className='bg-gradient-to-r from-orange-600/95 to-red-600/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-orange-500/50 shadow-lg cursor-help'
              data-tooltip-id='auto-capture-info'
              data-tooltip-content='ESP32-CAM automatically captures photos every 5 seconds when WiFi connection is lost or unstable. Photos are saved directly to the SD card for later retrieval. This ensures continuous monitoring even during network interruptions.'
            >
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <Icon
                    icon='fluent:camera-24-filled'
                    width={16}
                    height={16}
                    className='text-white'
                  />
                  <div className='absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                </div>
                <div className='flex flex-col'>
                  <span className='text-white text-xs font-bold'>
                    AUTO CAPTURE
                  </span>
                  <span className='text-orange-200 text-xs'>
                    Every 5s → SD Card
                  </span>
                </div>
                <Icon
                  icon='fluent:info-24-regular'
                  width={12}
                  height={12}
                  className='text-orange-200 ml-1'
                />
              </div>
            </div>

            {/* Tooltip Component */}
            <ReactTooltip
              id='auto-capture-info'
              place='bottom'
              style={{
                backgroundColor: '#1f2937',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12px',
                maxWidth: '280px',
                zIndex: 9999,
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>
        )}
        {/* Error State */}
        {error && !isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-gray-900 p-6'>
            <div className='text-center max-w-lg'>
              <Icon
                icon={
                  error.includes('Security Error')
                    ? 'fluent:shield-error-24-regular'
                    : 'fluent:error-circle-24-regular'
                }
                width={48}
                height={48}
                className='mx-auto mb-4 text-red-400'
              />

              {error.includes('Security Error') ? (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-red-400'>
                    WebSocket Security Error
                  </h3>
                  <p className='text-sm text-gray-300'>
                    Cannot connect to insecure WebSocket (ws://) from secure
                    HTTPS page.
                  </p>

                  <div className='bg-gray-800 rounded-lg p-4 text-left'>
                    <p className='text-sm font-semibold text-yellow-400 mb-2'>
                      Solutions:
                    </p>
                    <ul className='text-xs text-gray-300 space-y-1'>
                      <li>
                        • Change camera URL to use{' '}
                        <span className='text-green-400 font-mono'>wss://</span>{' '}
                        (secure WebSocket)
                      </li>
                      <li>
                        • Use{' '}
                        <span className='text-blue-400 font-mono'>http://</span>{' '}
                        stream instead
                      </li>
                      <li>
                        • Access this page via HTTP (not recommended for
                        production)
                      </li>
                    </ul>
                  </div>

                  <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                    <button
                      onClick={() => window.open('/settings', '_blank')}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm'
                    >
                      Open Settings
                    </button>
                    <button
                      onClick={handleReconnect}
                      className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm'
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <p className='text-red-400 text-sm whitespace-pre-line'>
                    {error}
                  </p>
                  <button
                    onClick={handleReconnect}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Reconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        )}{' '}
        {/* Control Buttons - always visible */}
        <div className='absolute top-4 right-4 flex gap-2 z-20'>
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className='p-2 bg-black/70 hover:bg-black/90 rounded-lg transition-colors'
            title='Stream Settings'
          >
            <Icon
              icon='fluent:settings-24-regular'
              width={20}
              height={20}
              className='text-white'
            />
          </button>

          {/* Refresh/Reconnect Button */}
          <button
            onClick={handleReconnect}
            disabled={isLoading}
            className='p-2 bg-black/70 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors'
            title='Refresh Connection'
          >
            <Icon
              icon={
                isLoading
                  ? 'fluent:spinner-ios-20-filled'
                  : 'fluent:arrow-clockwise-24-regular'
              }
              width={20}
              height={20}
              className={`text-white ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>{' '}
        {/* HUD Overlays - show when connected (with or without metadata) */}
        {isConnected && (
          <>
            {/* Orientation HUD - Commented out for now */}
            {/* <div className='absolute top-16 right-4'>
            <BoatOrientationHUD roll={metadata.roll ?? 0} />
          </div> */}
          </>
        )}{' '}
        {/* Compass HUD - Always visible (center top position) */}
        <div
          className='absolute top-4 left-1/2 transform -translate-x-1/2 z-30'
          style={{
            pointerEvents: 'auto',
            width: '300px',
          }}
        >
          <CompassHUD heading={metadata?.heading ?? 284.49} />
        </div>
        {/* Status Indicator and Auto Photo Toggle - Always visible */}
        <div className='absolute bottom-4 left-4 flex items-center gap-2 z-30'>
          {/* Status Indicator */}
          <div className='flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg border border-white/20'>
            <div
              className={`w-2 h-2 rounded-full ${isConnected && !error ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            ></div>
            <span className='text-white text-sm font-medium'>
              {isConnected && !error ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className='text-gray-300 text-xs'>
              {streamType.toUpperCase()}
            </span>
          </div>

          {/* Auto Photo Toggle - only show in local mode */}
          {isLocalMode && (
            <button
              onClick={() => onAutoPhotoToggle?.(!autoPhotoEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                autoPhotoEnabled
                  ? 'bg-green-600/80 border-green-500/50 hover:bg-green-600'
                  : 'bg-black/70 border-white/20 hover:bg-black/90'
              }`}
              title={`Auto Photo Capture: ${autoPhotoEnabled ? 'ON' : 'OFF'} - Automatically capture photos when obstacles detected (<10cm)`}
            >
              <Icon
                icon={
                  autoPhotoEnabled
                    ? 'fluent:camera-sparkles-24-filled'
                    : 'fluent:camera-sparkles-24-regular'
                }
                width={16}
                height={16}
                className={autoPhotoEnabled ? 'text-white' : 'text-gray-300'}
              />
              <span
                className={`text-xs font-medium ${autoPhotoEnabled ? 'text-white' : 'text-gray-300'}`}
              >
                AUTO
              </span>
              {autoPhotoEnabled && (
                <div className='w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse' />
              )}
            </button>
          )}
        </div>{' '}
        {/* Compact Obstacle Warning - Top Left */}
        {isConnected &&
          metadata &&
          (() => {
            const distance = metadata?.ultrasonic ?? 0;
            if (distance <= 20 && distance > 0) {
              return (
                <div className='absolute top-4 left-4 z-30'>
                  <div className='bg-red-600/90 text-white px-2 py-1 rounded-md animate-pulse border border-red-400/50'>
                    <div className='flex items-center gap-1.5'>
                      <Icon
                        icon='fluent:warning-24-filled'
                        width={12}
                        height={12}
                        className='text-white'
                      />
                      <span className='font-bold text-xs'>DANGER</span>
                      <span className='font-mono text-xs'>
                        {distance.toFixed(1)}cm
                      </span>
                    </div>
                  </div>
                </div>
              );
            } else if (distance <= 50 && distance > 0) {
              return (
                <div className='absolute top-4 left-4 z-30'>
                  <div className='bg-yellow-600/90 text-black px-2 py-1 rounded-md border border-yellow-400/50'>
                    <div className='flex items-center gap-1.5'>
                      <Icon
                        icon='fluent:warning-24-regular'
                        width={12}
                        height={12}
                        className='text-black'
                      />
                      <span className='font-semibold text-xs'>CAUTION</span>
                      <span className='font-mono text-xs'>
                        {distance.toFixed(1)}cm
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        {/* Distance Information with Obstacle Warning - Horizontal Layout */}
        <div className='absolute bottom-4 right-4 z-30'>
          <div className='bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl p-3 border border-white/10 shadow-xl'>
            {(() => {
              const distance = metadata?.ultrasonic ?? 0;
              const distanceTraveled = metadata?.distanceTraveled ?? 0;

              const getObstacleStatus = (dist: number) => {
                if (dist <= 20 && dist > 0) {
                  return {
                    level: 'CRITICAL',
                    color: 'text-red-400',
                    bgGradient: 'from-red-500/30 to-red-600/20',
                    borderColor: 'border-red-500/50',
                    icon: 'fluent:warning-24-filled',
                    pulse: true,
                  };
                } else if (dist <= 50 && dist > 0) {
                  return {
                    level: 'CAUTION',
                    color: 'text-yellow-400',
                    bgGradient: 'from-yellow-500/30 to-orange-500/20',
                    borderColor: 'border-yellow-500/50',
                    icon: 'fluent:warning-24-regular',
                    pulse: false,
                  };
                } else if (dist > 50 && dist <= 100) {
                  return {
                    level: 'CLEAR',
                    color: 'text-green-400',
                    bgGradient: 'from-green-500/30 to-emerald-500/20',
                    borderColor: 'border-green-500/50',
                    icon: 'fluent:checkmark-circle-24-regular',
                    pulse: false,
                  };
                } else {
                  return {
                    level: 'NO DATA',
                    color: 'text-gray-400',
                    bgGradient: 'from-gray-500/30 to-gray-600/20',
                    borderColor: 'border-gray-500/50',
                    icon: 'fluent:question-circle-24-regular',
                    pulse: false,
                  };
                }
              };

              const status = getObstacleStatus(distance);

              return (
                <div
                  className={`relative bg-gradient-to-r ${status.bgGradient} border ${status.borderColor} rounded-lg p-2 ${status.pulse ? 'animate-pulse' : ''}`}
                >
                  {/* Ultra Compact Horizontal Layout */}
                  <div className='flex items-center gap-2'>
                    {/* Left Side: Distance Information */}
                    <div className='flex flex-col items-center'>
                      {/* Status with Icon inline */}
                      <div className='flex items-center gap-1 mb-0.5'>
                        <Icon
                          icon={status.icon}
                          width={12}
                          height={12}
                          className={status.color}
                        />
                        <span className={`text-xs font-bold ${status.color}`}>
                          {status.level}
                        </span>
                      </div>

                      {/* Distance Display */}
                      <div className='flex items-baseline gap-0.5'>
                        <span className='text-xl font-bold text-white'>
                          {distance > 0 ? distance.toFixed(1) : '--'}
                        </span>
                        <span className='text-xs text-gray-300'>cm</span>
                      </div>
                    </div>
                    {/* Vertical Separator Bar */}
                    <div className='w-px h-8 bg-white/20'></div>{' '}
                    {/* Right Side: Compact Progress Bar and Stats */}
                    <div className='flex flex-col gap-1.5 flex-1'>
                      {/* Distance Bar (Horizontal - Full Width) */}
                      <div className='relative w-full h-1.5 bg-black/30 rounded-full overflow-hidden'>
                        <div
                          className={`h-full transition-all duration-500 ease-out ${
                            distance <= 20
                              ? 'bg-red-500'
                              : distance <= 50
                                ? 'bg-yellow-500'
                                : distance <= 100
                                  ? 'bg-green-500'
                                  : 'bg-gray-500'
                          }`}
                          style={{
                            width:
                              distance > 0
                                ? `${Math.min((distance / 100) * 100, 100)}%`
                                : '0%',
                          }}
                        />
                        {/* Danger zone markers */}
                        <div className='absolute top-0 left-[20%] w-px h-full bg-red-400/60' />
                        <div className='absolute top-0 left-[50%] w-px h-full bg-yellow-400/60' />
                      </div>

                      {/* Inline Stats */}
                      <div className='flex justify-between text-xs'>
                        <div className='flex items-center gap-1'>
                          <Icon
                            icon='fluent:location-24-regular'
                            width={8}
                            height={8}
                            className='text-blue-400'
                          />
                          <span className='text-gray-400'>
                            {(distanceTraveled / 100).toFixed(1)}m
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Icon
                            icon='fluent:compass-northwest-24-regular'
                            width={8}
                            height={8}
                            className='text-blue-400'
                          />
                          <span className='text-gray-400'>
                            {metadata?.heading?.toFixed(0) ?? '--'}°
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>{' '}
        {/* Settings Modal */}
        {showSettings && (
          <div className='absolute inset-0 bg-black/70 flex items-center justify-center z-40'>
            <div className='bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-white text-lg font-semibold'>
                  Stream Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <Icon
                    icon='fluent:dismiss-24-regular'
                    width={20}
                    height={20}
                  />
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Stream Quality
                  </label>
                  <div className='space-y-2'>
                    {(['fast', 'normal', 'slow'] as const).map((quality) => (
                      <label
                        key={quality}
                        className='flex items-center space-x-3 cursor-pointer'
                      >
                        {' '}
                        <input
                          type='radio'
                          name='streamQuality'
                          value={quality}
                          checked={streamQuality === quality}
                          onChange={(e) =>
                            handleQualityChange(
                              e.target.value as 'fast' | 'normal' | 'slow',
                            )
                          }
                          className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500'
                        />
                        <span className='text-gray-300 capitalize'>
                          {quality}
                        </span>
                        <span className='text-gray-500 text-xs'>
                          {quality === 'fast' && '(High FPS, Lower Quality)'}
                          {quality === 'normal' && '(Balanced)'}
                          {quality === 'slow' && '(High Quality, Lower FPS)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className='pt-4 border-t border-gray-700'>
                  <button
                    onClick={() => setShowSettings(false)}
                    className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

StableCameraStream.displayName = 'StableCameraStream';

export default StableCameraStream;
