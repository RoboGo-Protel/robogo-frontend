// Test component untuk ESP32-CAM debugging
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
  controlCameraFlash,
  FLASH_ACTIONS,
  type FlashAction,
} from '@/utils/flashControlUtils';

interface TestESP32CamProps {
  url?: string;
}

export default function TestESP32Cam({
  url = 'ws://192.168.137.133:81/',
}: TestESP32CamProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState(url);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog((prev) => [
      ...prev.slice(-9),
      `[${timestamp}] ${message}`,
    ]);
    console.log(message);
  };

  const testConnection = () => {
    // Clear previous state
    setError('');
    setIsConnected(false);
    setConnectionLog([]);

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    addLog(`🔌 Attempting to connect to: ${customUrl}`);

    try {
      wsRef.current = new WebSocket(customUrl);
      wsRef.current.binaryType = 'blob';

      wsRef.current.onopen = () => {
        addLog('✅ WebSocket connected successfully!');
        setIsConnected(true);
        setError('');
      };

      wsRef.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          addLog(`📸 Received image blob: ${event.data.size} bytes`);
          const imageUrl = URL.createObjectURL(event.data);

          if (imgRef.current) {
            imgRef.current.src = imageUrl;
            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
          }
        } else {
          addLog(`📨 Received message: ${event.data}`);
        }
      };

      wsRef.current.onerror = (error) => {
        addLog(`❌ WebSocket error occurred`);
        console.error('WebSocket error details:', error);
        setError('Connection error occurred');
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        addLog(
          `🔌 Connection closed (Code: ${event.code}, Reason: ${event.reason})`,
        );
        setIsConnected(false);

        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly: ${event.code}`);
        }
      };
    } catch (err) {
      addLog(`❌ Failed to create WebSocket: ${err}`);
      setError('Failed to create connection');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    addLog('🔌 Manually disconnected');
  };
  // Test HTTP endpoint
  const testHttpEndpoint = async () => {
    const httpUrl = customUrl.replace('ws://', 'http://').replace(':81/', '/');
    addLog(`🌐 Testing HTTP endpoint: ${httpUrl}`);

    try {
      const response = await fetch(httpUrl, { method: 'HEAD' });
      addLog(`📡 HTTP response: ${response.status} ${response.statusText}`);
    } catch (err) {
      addLog(`❌ HTTP test failed: ${err}`);
    }
  };
  // Flash control functions
  const controlFlash = async (action: FlashAction) => {
    addLog(`💡 Setting flash: ${action.toUpperCase()}`);

    try {
      const result = await controlCameraFlash(customUrl, action);
      if (result.success) {
        addLog(`✅ Flash response: ${result.message}`);
      } else {
        addLog(`❌ Flash control failed: ${result.message}`);
      }
    } catch (err) {
      addLog(`❌ Flash control error: ${err}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className='p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto'>
      <h2 className='text-xl font-bold mb-4 text-gray-800 dark:text-white'>
        🧪 ESP32-CAM Connection Test
      </h2>
      {/* URL Input */}
      <div className='mb-4'>
        <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
          WebSocket URL:
        </label>
        <input
          type='text'
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
          placeholder='ws://192.168.137.133:81/'
        />
      </div>{' '}
      {/* Control Buttons */}
      <div className='flex flex-wrap gap-2 mb-4'>
        <button
          onClick={testConnection}
          disabled={isConnected}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Icon
            icon='fluent:plug-connected-24-regular'
            className='inline mr-2'
          />
          Connect
        </button>

        <button
          onClick={disconnect}
          disabled={!isConnected}
          className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Icon
            icon='fluent:plug-disconnected-24-regular'
            className='inline mr-2'
          />
          Disconnect
        </button>

        <button
          onClick={testHttpEndpoint}
          className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
        >
          <Icon icon='fluent:globe-24-regular' className='inline mr-2' />
          Test HTTP
        </button>
      </div>
      {/* Flash Control Buttons */}
      <div className='mb-4'>
        <h3 className='text-lg font-medium mb-2 text-gray-800 dark:text-white'>
          💡 Flash Control:
        </h3>{' '}
        <div className='flex flex-wrap gap-2'>
          {(Object.keys(FLASH_ACTIONS) as FlashAction[]).map((action) => {
            const config = FLASH_ACTIONS[action];
            return (
              <button
                key={action}
                onClick={() => controlFlash(action)}
                className={`px-3 py-2 text-white rounded text-sm flex items-center gap-2 ${config.color}`}
              >
                <Icon icon={config.icon} className='w-4 h-4' />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Status */}
      <div
        className={`p-3 rounded mb-4 ${
          isConnected
            ? 'bg-green-100 text-green-800 border border-green-200'
            : error
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        <div className='flex items-center'>
          <Icon
            icon={
              isConnected
                ? 'fluent:checkmark-circle-24-filled'
                : error
                  ? 'fluent:error-circle-24-filled'
                  : 'fluent:info-24-regular'
            }
            className='mr-2'
          />
          <span className='font-medium'>
            {isConnected ? 'Connected' : error ? 'Error' : 'Disconnected'}
          </span>
        </div>
        {error && <p className='text-sm mt-1'>{error}</p>}
      </div>
      {/* Image Display */}
      <div className='mb-4'>
        <h3 className='text-lg font-medium mb-2 text-gray-800 dark:text-white'>
          Live Stream:
        </h3>
        <div className='border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-black'>
          <img
            ref={imgRef}
            alt='ESP32-CAM Stream'
            className='max-w-full max-h-full object-contain'
            style={{ display: 'none' }}
            onLoad={() => {
              if (imgRef.current) {
                imgRef.current.style.display = 'block';
              }
            }}
            onError={() => {
              addLog('❌ Image load error');
            }}
          />
          {!isConnected && (
            <div className='text-gray-500 text-center'>
              <Icon
                icon='fluent:camera-off-24-regular'
                className='text-4xl mb-2'
              />
              <p>No stream available</p>
            </div>
          )}
        </div>
      </div>
      {/* Connection Log */}
      <div>
        <h3 className='text-lg font-medium mb-2 text-gray-800 dark:text-white'>
          Connection Log:
        </h3>
        <div className='bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-40 overflow-y-auto'>
          {connectionLog.length > 0 ? (
            connectionLog.map((log, index) => (
              <div
                key={index}
                className='text-sm font-mono text-gray-700 dark:text-gray-300'
              >
                {log}
              </div>
            ))
          ) : (
            <p className='text-gray-500 text-sm'>
              No connection attempts yet...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
