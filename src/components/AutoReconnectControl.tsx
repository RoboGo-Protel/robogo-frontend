import React from 'react';
import { useLocalMode } from '@/context/LocalModeContext';
import { Icon } from '@iconify/react';

export const AutoReconnectControl: React.FC = () => {
  const {
    isConnected,
    connectedPort,
    lastSelectedPort,
    isAutoReconnectEnabled,
    setAutoReconnectEnabled,
    reconnectAttempts,
    triggerManualReconnect,
    resetReconnectAttempts,
  } = useLocalMode();

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: 'material-symbols:check-circle-outline',
        text: 'Connected',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
      };
    } else if (reconnectAttempts > 0) {
      return {
        icon: 'material-symbols:refresh',
        text: `Reconnecting... (${reconnectAttempts}/10)`,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      };
    } else {
      return {
        icon: 'material-symbols:wifi-off',
        text: 'Disconnected',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700'>
      {/* Header */}
      <div className='p-4 border-b dark:border-gray-700'>
        <div className='flex items-center gap-2'>
          <Icon icon='material-symbols:wifi' className='h-5 w-5' />
          <h3 className='text-lg font-semibold'>ESP32 Connection</h3>
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
          Auto reconnect to your ESP32 device
        </p>
      </div>

      {/* Content */}
      <div className='p-4 space-y-4'>
        {/* Connection Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Status:</span>
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-md ${status.bgColor}`}
          >
            <Icon
              icon={status.icon}
              className={`h-4 w-4 ${status.color} ${reconnectAttempts > 0 ? 'animate-spin' : ''}`}
            />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>

        {/* Connected Port */}
        {(connectedPort || lastSelectedPort) && (
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Port:</span>
            <span className='text-sm text-gray-600 dark:text-gray-400 font-mono'>
              {connectedPort || lastSelectedPort}
            </span>
          </div>
        )}

        {/* Auto Reconnect Toggle */}
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <label className='text-sm font-medium cursor-pointer'>
              Auto Reconnect
            </label>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              Automatically reconnect when connection is lost
            </p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={isAutoReconnectEnabled}
              onChange={(e) => setAutoReconnectEnabled(e.target.checked)}
              className='sr-only peer'
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reconnect Attempts Info */}
        {reconnectAttempts > 0 && (
          <div className='flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800'>
            <div className='flex items-center gap-2'>
              <Icon
                icon='material-symbols:warning'
                className='h-4 w-4 text-yellow-500'
              />
              <span className='text-sm text-yellow-700 dark:text-yellow-300'>
                Attempting reconnection...
              </span>
            </div>
            <span className='text-sm font-mono text-yellow-700 dark:text-yellow-300'>
              {reconnectAttempts}/10
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <button
            onClick={triggerManualReconnect}
            disabled={isConnected || !lastSelectedPort}
            className='flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
          >
            <Icon icon='material-symbols:refresh' className='h-4 w-4' />
            Reconnect Now
          </button>

          {reconnectAttempts > 0 && (
            <button
              onClick={resetReconnectAttempts}
              className='px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200'
            >
              Reset
            </button>
          )}
        </div>

        {/* Info */}
        {lastSelectedPort && !isConnected && !isAutoReconnectEnabled && (
          <div className='text-xs text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800'>
            <Icon
              icon='material-symbols:lightbulb'
              className='inline h-4 w-4 mr-1 text-blue-500'
            />
            Enable auto reconnect to automatically connect to {lastSelectedPort}{' '}
            when it becomes available.
          </div>
        )}
      </div>
    </div>
  );
};
