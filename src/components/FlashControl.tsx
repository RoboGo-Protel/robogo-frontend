/**
 * Flash Control Component for ESP32-CAM
 */
'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  controlCameraFlash,
  FLASH_ACTIONS,
  type FlashAction,
  type FlashControlResult,
} from '@/utils/flashControlUtils';
import { useToast } from '@/context/ToastProvider';

interface FlashControlProps {
  cameraUrl: string;
  enabled?: boolean;
  compact?: boolean;
  onFlashResult?: (result: FlashControlResult) => void;
  className?: string;
  isDark?: boolean;
}

export default function FlashControl({
  cameraUrl,
  enabled = true,
  compact = false,
  onFlashResult,
  className = '',
  isDark = false,
}: FlashControlProps) {
  const [isControlling, setIsControlling] = useState<FlashAction | null>(null);
  const { promise } = useToast();

  const handleFlashControl = async (action: FlashAction) => {
    if (!enabled || !cameraUrl) return;

    setIsControlling(action);

    try {
      console.log(`🎛️ Flash control initiated: ${action} for ${cameraUrl}`);
      const result = await promise(controlCameraFlash(cameraUrl, action), {
        loading: `Setting flash to ${action}...`,
        success: (data: FlashControlResult) =>
          `Flash ${data.action.toUpperCase()}: ${data.message}`,
        error: (err: unknown) =>
          `Flash control failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });

      console.log(`🎛️ Flash control result:`, result);
      onFlashResult?.(result);
    } catch (error) {
      console.error(`🎛️ Flash control error:`, error);
      const errorResult: FlashControlResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        action,
      };
      onFlashResult?.(errorResult);
    } finally {
      setIsControlling(null);
    }
  };

  if (!enabled || !cameraUrl) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {(['on', 'off'] as FlashAction[]).map((action) => {
          const config = FLASH_ACTIONS[action];
          const isLoading = isControlling === action;

          return (
            <button
              key={action}
              onClick={() => handleFlashControl(action)}
              disabled={!!isControlling}
              className={`p-2 rounded-lg transition-colors text-white text-sm ${
                config.color
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={config.description}
            >
              {isLoading ? (
                <Icon
                  icon='fluent:spinner-ios-16-filled'
                  className='w-4 h-4 animate-spin'
                />
              ) : (
                <Icon icon={config.icon} className='w-4 h-4' />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className='flex items-center gap-2 mb-2'>
        <Icon
          icon='fluent:lightbulb-24-regular'
          className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
        />
        <h3
          className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Flash Control
        </h3>
      </div>

      <div className='flex flex-wrap gap-2'>
        {(Object.keys(FLASH_ACTIONS) as FlashAction[]).map((action) => {
          const config = FLASH_ACTIONS[action];
          const isLoading = isControlling === action;

          return (
            <button
              key={action}
              onClick={() => handleFlashControl(action)}
              disabled={!!isControlling}
              className={`px-3 py-2 rounded-lg transition-colors text-white text-sm flex items-center gap-2 ${
                config.color
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={config.description}
            >
              {isLoading ? (
                <Icon
                  icon='fluent:spinner-ios-16-filled'
                  className='w-4 h-4 animate-spin'
                />
              ) : (
                <Icon icon={config.icon} className='w-4 h-4' />
              )}
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
