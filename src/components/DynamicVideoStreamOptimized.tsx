/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Icon } from '@iconify/react';
import { validateCameraUrl } from '../utils/deviceCameraUtils';

interface DynamicVideoStreamProps {
  url: string;
  alt?: string;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  refreshInterval?: number; // For HTTP streams
}

export interface DynamicVideoStreamRef {
  disconnect: () => void;
}

const DynamicVideoStream = forwardRef<DynamicVideoStreamRef, DynamicVideoStreamProps>(
  ({
    url,
    alt = 'Video Stream',
    className = '',
    onError,
    onLoad,
    refreshInterval = 1000, // Default 1 second for HTTP streams
  }: DynamicVideoStreamProps, ref) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string>('');
    const [streamType, setStreamType] = useState<'websocket' | 'http' | 'other'>(
      'other',
    );

    // Expose disconnect method to parent
    useImperativeHandle(ref, () => ({
      disconnect: () => {
        console.log('🔌 Forcing disconnect via ref method');
        
        // Clean up WebSocket
        if (wsRef.current) {
          const ws = wsRef.current;
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            console.log('🔌 Force closing WebSocket via ref');
            ws.close(1000, 'Manual disconnect triggered');
          }
          wsRef.current = null;
        }
        
        // Clean up HTTP interval
        if (intervalRef.current) {
          console.log('⏹️ Clearing HTTP refresh interval via ref');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Reset state
        setIsConnected(false);
        setError('Disconnected');
        
        console.log('✅ Force disconnect completed via ref');
      }
    }));

    // Determine stream type based on URL
    const determineStreamType = (url: string): 'websocket' | 'http' | 'other' => {
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        return 'websocket';
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        return 'http';
      } else {
        return 'other';
      }
    }; // URL validation helper using utility function
    const isValidUrl = useCallback((url: string): boolean => {
      return validateCameraUrl(url);
    }, []);
    const initializeWebSocketStream = useCallback(() => {
      console.log('🔌 Connecting to ESP32-CAM WebSocket:', url);

      try {
        wsRef.current = new WebSocket(url);

        // Set binary type to 'blob' to handle ESP32-CAM data properly (same as HTML)
        wsRef.current.binaryType = 'blob';
        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          setIsConnected(true);
          setError('');
          onLoad?.();
        };

        wsRef.current.onmessage = (event) => {
          try {
            // Reset connection state if we receive data (confirm we're truly connected)
            if (!isConnected) {
              setIsConnected(true);
              setError('');
            }

            if (event.data instanceof Blob) {
              // Handle Blob data (ESP32-CAM format) - exactly like working HTML
              console.log(`📸 Received image blob: ${event.data.size} bytes`);
              const imageUrl = URL.createObjectURL(event.data);

              if (imgRef.current) {
                imgRef.current.src = imageUrl;
                // Clean up memory after a short delay
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
              }
            } else if (event.data instanceof ArrayBuffer) {
              // Handle ArrayBuffer data
              console.log(
                `📸 Received ArrayBuffer: ${event.data.byteLength} bytes`,
              );
              const blob = new Blob([event.data], { type: 'image/jpeg' });
              const imageUrl = URL.createObjectURL(blob);

              if (imgRef.current) {
                imgRef.current.src = imageUrl;
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
              }
            } else if (typeof event.data === 'string') {
              // Handle text messages
              console.log('📨 ESP32-CAM message:', event.data);

              // Try to parse as JSON first (for messages from stream-server)
              try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === 'frame' && parsed.data && imgRef.current) {
                  imgRef.current.src = parsed.data.startsWith('data:')
                    ? parsed.data
                    : `data:image/jpeg;base64,${parsed.data}`;
                }
              } catch {
                // If not JSON, treat as direct base64 or data URL
                if (imgRef.current) {
                  imgRef.current.src = event.data.startsWith('data:')
                    ? event.data
                    : `data:image/jpeg;base64,${event.data}`;
                }
              }
            } else {
              console.log('📥 Unknown data type received:', typeof event.data);
            }
          } catch (err) {
            console.error('❌ Error processing WebSocket frame:', err);
            setError('Error processing video frame');
            onError?.('Error processing video frame');
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error('Error details:', {
            readyState: wsRef.current?.readyState,
            url: wsRef.current?.url,
            protocol: wsRef.current?.protocol,
          });
          setError('WebSocket connection error');
          onError?.('WebSocket connection error');
          setIsConnected(false);
        };

        wsRef.current.onclose = (event) => {
          console.log(
            `❌ WebSocket closed: Code ${event.code}, Reason: ${event.reason}`,
          );
          setIsConnected(false);

          // Only set error if it wasn't a normal close
          if (event.code !== 1000) {
            setError(`Connection closed: ${event.code}`);
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        setError('Failed to create WebSocket connection');
        onError?.('Failed to create WebSocket connection');
        setIsConnected(false);
      }    return () => {
        console.log('🧹 Cleaning up WebSocket connection...');
        if (wsRef.current) {
          const ws = wsRef.current;
          console.log('📍 WebSocket state:', {
            readyState: ws.readyState,
            url: ws.url,
            states: {
              CONNECTING: WebSocket.CONNECTING,
              OPEN: WebSocket.OPEN,
              CLOSING: WebSocket.CLOSING,
              CLOSED: WebSocket.CLOSED
            }
          });
          
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            console.log('🔌 Forcefully closing WebSocket connection');
            ws.close(1000, 'Component unmounting - forced disconnect');
          }
          
          // Clear the reference
          wsRef.current = null;
          console.log('✅ WebSocket cleanup completed');
        } else {
          console.log('ℹ️ No WebSocket to cleanup');
        }
      };
    }, [url, onLoad, onError, isConnected]);

    const initializeHttpStream = useCallback(() => {
      console.log(
        `🌐 Initializing HTTP stream with ${refreshInterval}ms refresh:`,
        url,
      );
      setIsConnected(true);
      setError('');

      // Initial load
      if (imgRef.current) {
        imgRef.current.src = `${url}?t=${Date.now()}`;
      }

      // Set up refresh interval for HTTP streams (like MJPEG)
      intervalRef.current = setInterval(() => {
        if (imgRef.current) {
          // Add timestamp to prevent caching and ensure fresh frames
          imgRef.current.src = `${url}?t=${Date.now()}`;
        }
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [url, refreshInterval]);

    const initializeDirectStream = useCallback(() => {
      console.log('🔗 Initializing direct stream:', url);
      setIsConnected(true);
      setError('');

      if (imgRef.current) {
        imgRef.current.src = url;
      }

      return () => {
        // No cleanup needed for direct streams
      };
    }, [url]);
    useEffect(() => {
      // Validate URL first
      if (!isValidUrl(url)) {
        console.warn('❌ Invalid camera URL format:', url);
        setError('Invalid camera URL format');
        return;
      }

      const detectedType = determineStreamType(url);
      setStreamType(detectedType);

      console.log(`🎥 Initializing ${detectedType} stream:`, url);

      // Reset connection state
      setIsConnected(false);
      setError('');

      let cleanup: (() => void) | undefined;

      if (detectedType === 'websocket') {
        // Add small delay to ensure clean initialization
        const timer = setTimeout(() => {
          cleanup = initializeWebSocketStream();
        }, 100);

        return () => {
          clearTimeout(timer);
          cleanup?.();
        };
      } else if (detectedType === 'http') {
        cleanup = initializeHttpStream();
      } else {
        cleanup = initializeDirectStream();
      }

      return cleanup;
    }, [
      url,
      isValidUrl,
      initializeWebSocketStream,
      initializeHttpStream,
      initializeDirectStream,
    ]);

    const handleImageLoad = () => {
      console.log('🖼️ Image loaded successfully');
      onLoad?.();
    };

    const handleImageError = () => {
      const errorMsg = `Failed to load ${streamType} stream`;
      console.error('❌ Image load error:', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
    };

    // Cleanup on component unmount
    useEffect(() => {
      return () => {
        console.log('🧹 DynamicVideoStream component unmounting - cleanup all connections');
        
        // Clean up WebSocket
        if (wsRef.current) {
          const ws = wsRef.current;
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            console.log('🔌 Force closing WebSocket on component unmount');
            ws.close(1000, 'Component unmounted');
          }
          wsRef.current = null;
        }
        
        // Clean up HTTP interval
        if (intervalRef.current) {
          console.log('⏹️ Clearing HTTP refresh interval');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        console.log('✅ DynamicVideoStream cleanup completed');
      };
    }, []); // Empty dependency array - only run on unmount

    if (!url || !isValidUrl(url)) {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <Icon
            icon='fluent:video-off-24-filled'
            width={48}
            height={48}
            className='text-gray-400 mb-2'
          />
          <p className='text-gray-400 text-center text-sm'>
            No camera URL configured
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <Icon
            icon='fluent:video-off-24-filled'
            width={48}
            height={48}
            className='text-red-400 mb-2'
          />
          <p className='text-red-400 text-center text-sm'>{error}</p>
          <p className='text-gray-400 text-center text-xs mt-1'>
            Stream type: {streamType.toUpperCase()}
          </p>
        </div>
      );
    }

    if (!isConnected && streamType === 'websocket') {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <Icon
            icon='fluent:video-24-filled'
            width={48}
            height={48}
            className='text-blue-400 mb-2 animate-pulse'
          />
          <p className='text-blue-400 text-center text-sm'>
            Connecting to WebSocket...
          </p>
        </div>
      );
    }

    return (
      <img
        ref={imgRef}
        alt={alt}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000',
          borderRadius: 'inherit',
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  },
);

DynamicVideoStream.displayName = 'DynamicVideoStream';

export default DynamicVideoStream;
