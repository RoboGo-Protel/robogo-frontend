/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';

interface WebSocketVideoStreamProps {
  url: string;
  alt?: string;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export default function WebSocketVideoStream({
  url,
  alt = 'Video Stream',
  className = '',
  onError,
  onLoad,
}: WebSocketVideoStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [isWebSocketUrl, setIsWebSocketUrl] = useState(false);

  useEffect(() => {
    // Check if URL is WebSocket
    const isWs = url.startsWith('ws://') || url.startsWith('wss://');
    setIsWebSocketUrl(isWs);

    if (!isWs) {
      return; // Let the parent component handle non-WebSocket URLs
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create WebSocket connection
    wsRef.current = new WebSocket(url);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setError('');
      onLoad?.();
    };

    wsRef.current.onmessage = (event) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          // Handle binary video data
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        } else if (typeof event.data === 'string') {
          // Handle base64 encoded images
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = event.data.startsWith('data:')
            ? event.data
            : `data:image/jpeg;base64,${event.data}`;
        }
      } catch (err) {
        console.error('Error processing WebSocket frame:', err);
        setError('Error processing video frame');
        onError?.('Error processing video frame');
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
      onError?.('WebSocket connection error');
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onError, onLoad]);
  if (!isWebSocketUrl) {
    // Fallback to regular img tag for non-WebSocket URLs
    return (
      <img
        src={url}
        alt={alt}
        className={className}
        onError={() => onError?.('Failed to load image')}
        onLoad={onLoad}
      />
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
      </div>
    );
  }

  if (!isConnected) {
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
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
