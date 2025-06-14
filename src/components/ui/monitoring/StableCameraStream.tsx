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
import BoatOrientationHUD from '@/components/OrientationHUD';

interface Metadata {
  ultrasonic?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface StableCameraStreamProps {
  metadata?: Metadata;
}

export interface StableCameraStreamRef {
  captureFrame: () => Promise<Blob>;
  isConnected: boolean;
  toggleFlipVertical: () => void;
}

const StableCameraStream = forwardRef<
  StableCameraStreamRef,
  StableCameraStreamProps
>(({ metadata }, ref) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFlippedVertical, setIsFlippedVertical] = useState(false);

  const { config } = useUserConfig(); // Memoize camera URL to prevent unnecessary re-connections
  const cameraUrl = useMemo(() => {
    let url = config?.cameraStreamUrl || '';

    // Auto-upgrade WebSocket URL to secure if page is loaded over HTTPS
    if (
      url.startsWith('ws://') &&
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:'
    ) {
      console.warn(
        '🔐 [STABLE] Auto-upgrading WebSocket URL from ws:// to wss:// for HTTPS page',
      );
      url = url.replace('ws://', 'wss://');
    }

    // Development fallback: if wss:// fails and we're on localhost, provide warning
    if (
      url.startsWith('wss://') &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
    ) {
      console.info(
        '🔧 [STABLE] Development mode detected. If wss:// fails, consider using HTTP stream instead.',
      );
    }

    return url;
  }, [config?.cameraStreamUrl]);

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
        console.log(
          '🔄 [STABLE] WebSocket already connecting/connected, skipping',
        );
        return;
      }

      console.log('🔌 [STABLE] Connecting to WebSocket:', cameraUrl);
      setIsLoading(true);
      setError('');

      try {
        const ws = new WebSocket(cameraUrl);
        ws.binaryType = 'blob';
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ [STABLE] WebSocket connected');
          setIsConnected(true);
          setIsLoading(false);
          setError('');
          reconnectAttempts.current = 0; // Reset attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            if (event.data instanceof Blob && imgRef.current) {
              console.log(
                `📸 [STABLE] Received frame: ${event.data.size} bytes`,
              );
              const imageUrl = URL.createObjectURL(event.data);
              imgRef.current.src = imageUrl;

              // Clean up blob URL after a delay
              setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
            }
          } catch (err) {
            console.error('❌ [STABLE] Error processing frame:', err);
          }
        };
        ws.onerror = (error) => {
          console.error('❌ [STABLE] WebSocket error:', error);
          setError('WebSocket connection failed');
          setIsConnected(false);
          setIsLoading(false);
        };

        ws.onclose = (event) => {
          console.log(
            `🔌 [STABLE] WebSocket closed: ${event.code} - ${event.reason}`,
          );
          setIsConnected(false);
          setIsLoading(false);

          // Only attempt reconnection if it wasn't a manual close and we haven't exceeded max attempts
          if (
            event.code !== 1000 &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            reconnectAttempts.current++;
            console.log(
              `🔄 [STABLE] Reconnecting attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`,
            );
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
        console.error('❌ [STABLE] Failed to create WebSocket:', err);
        // Handle specific SecurityError for mixed content
        if (err instanceof DOMException && err.name === 'SecurityError') {
          const currentUrl = window.location.href;
          console.error(
            '🔒 [STABLE] Mixed content security error - HTTPS page trying to connect to ws://',
          );

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

    console.log(`🎥 [STABLE] Initializing ${streamType} stream`);

    if (streamType === 'websocket' && connectWebSocket) {
      connectWebSocket();
    } else if (streamType === 'http' && imgRef.current) {
      // Simple HTTP/MJPEG stream
      console.log('🌐 [STABLE] Loading HTTP stream:', cameraUrl);
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
        console.log('🧹 [STABLE] Cleaning up WebSocket');
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
    console.log('🔄 [STABLE] Manual reconnect triggered');
    reconnectAttempts.current = 0; // Reset attempts

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnect');
    }

    setTimeout(() => {
      if (connectWebSocket) {
        connectWebSocket();
      }
    }, 500);
  };

  if (!cameraUrl) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-gray-900 rounded-2xl'>
        <div className='text-center text-gray-400'>
          <Icon
            icon='fluent:camera-off-24-regular'
            width={48}
            height={48}
            className='mx-auto mb-2'
          />
          <p>No camera configured</p>
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
                  Cannot connect to insecure WebSocket (ws://) from secure HTTPS
                  page.
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
      )}
      {/* HUD Overlays - only show when connected */}
      {isConnected && metadata && (
        <>
          {/* Compass HUD */}
          <div className='absolute top-4 left-4'>
            <CompassHUD heading={metadata.heading ?? 0} />
          </div>

          {/* Orientation HUD */}
          <div className='absolute top-4 right-4'>
            <BoatOrientationHUD roll={metadata.roll ?? 0} />
          </div>

          {/* Status Indicator */}
          <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-white text-sm'>LIVE</span>
            <span className='text-gray-300 text-xs'>
              {streamType.toUpperCase()}
            </span>
          </div>

          {/* Ultrasonic Distance */}
          {metadata.ultrasonic !== undefined && (
            <div className='absolute bottom-4 right-4 bg-black/50 px-3 py-2 rounded-lg'>
              <span className='text-white text-sm'>
                Distance: {metadata.ultrasonic.toFixed(1)} cm
              </span>
            </div>
          )}
        </>
      )}{' '}
    </div>
  );
});

StableCameraStream.displayName = 'StableCameraStream';

export default StableCameraStream;
