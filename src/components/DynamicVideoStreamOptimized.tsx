/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState, useCallback } from 'react';
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

export default function DynamicVideoStream({
  url,
  alt = 'Video Stream',
  className = '',
  onError,
  onLoad,
  refreshInterval = 1000, // Default 1 second for HTTP streams
}: DynamicVideoStreamProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [streamType, setStreamType] = useState<'websocket' | 'http' | 'other'>(
    'other',
  );

  // Determine stream type based on URL
  const determineStreamType = (url: string): 'websocket' | 'http' | 'other' => {
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return 'websocket';
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      return 'http';
    } else {
      return 'other';
    }
  };
  // URL validation helper using utility function
  const isValidUrl = useCallback((url: string): boolean => {
    return validateCameraUrl(url);
  }, []);

  const initializeWebSocketStream = useCallback(() => {
    console.log('🔌 Connecting to WebSocket:', url);
    wsRef.current = new WebSocket(url);

    // Set binary type to 'blob' to handle ESP32-CAM data properly
    wsRef.current.binaryType = 'blob';

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      setError('');
      onLoad?.();
    };

    wsRef.current.onmessage = (event) => {
      try {
        console.log('📥 WebSocket message received:', {
          dataType: typeof event.data,
          isBlob: event.data instanceof Blob,
          isArrayBuffer: event.data instanceof ArrayBuffer,
          size: event.data.size || event.data.byteLength || event.data.length,
        });

        if (event.data instanceof Blob) {
          // Handle Blob data (ESP32-CAM format) - same as working HTML
          console.log(`📸 Received image blob: ${event.data.size} bytes`);
          const imageUrl = URL.createObjectURL(event.data);

          if (imgRef.current) {
            imgRef.current.src = imageUrl;
            // Clean up memory after a short delay
            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Handle ArrayBuffer data
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);

          if (imgRef.current) {
            imgRef.current.src = imageUrl;
            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
          }
        } else if (typeof event.data === 'string') {
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
        }
      } catch (err) {
        console.error('❌ Error processing WebSocket frame:', err);
        setError('Error processing video frame');
        onError?.('Error processing video frame');
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
      setError('WebSocket connection error');
      onError?.('WebSocket connection error');
      setIsConnected(false);
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onLoad, onError]);

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
      setError('Invalid camera URL format');
      return;
    }

    const detectedType = determineStreamType(url);
    setStreamType(detectedType);

    console.log(`🎥 Initializing ${detectedType} stream:`, url);

    if (detectedType === 'websocket') {
      // Initialize WebSocket stream
      return initializeWebSocketStream();
    } else if (detectedType === 'http') {
      // Initialize HTTP stream with refresh interval
      return initializeHttpStream();
    } else {
      // Handle other protocols (RTSP, etc.) - fallback to direct img src
      return initializeDirectStream();
    }
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
}
