import React, { useEffect, useRef, useState, useMemo } from 'react';
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

export default function StableCameraStream({
  metadata,
}: StableCameraStreamProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const { config } = useUserConfig();

  // Memoize camera URL to prevent unnecessary re-connections
  const cameraUrl = useMemo(() => {
    return config?.cameraStreamUrl || '';
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
          setError('Connection error');
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
        setError('Failed to connect');
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
      {/* Video Stream */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt='RoboGo Camera Stream'
        className='w-full h-full object-cover'
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
      )}
      {/* Error State */}
      {error && !isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-900'>
          <div className='text-center text-red-400'>
            <Icon
              icon='fluent:error-circle-24-regular'
              width={48}
              height={48}
              className='mx-auto mb-2'
            />
            <p className='mb-4'>{error}</p>
            <button
              onClick={handleReconnect}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Reconnect
            </button>
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
      )}
    </div>
  );
}
