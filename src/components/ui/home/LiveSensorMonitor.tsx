import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';

interface SensorData {
  ultrasonic?: number;
  battery?: number;
  connectionStatus?: 'online' | 'offline' | 'connecting';
  mode?: string;
  signal?: number;
}

interface LiveSensorMonitorProps {
  data?: SensorData;
}

export default function LiveSensorMonitor({ data }: LiveSensorMonitorProps) {
  const { isDark } = useDarkMode();

  // Default values when no data provided
  const sensorData = {
    ultrasonic: data?.ultrasonic ?? 25.4,
    battery: data?.battery ?? 85,
    connectionStatus: data?.connectionStatus ?? 'online',
    mode: data?.mode ?? 'Autonomous',
    signal: data?.signal ?? 78,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      case 'connecting':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getDistanceStatus = (distance: number) => {
    if (distance < 10)
      return { color: 'text-red-500', bg: 'bg-red-500/10', level: 'DANGER' };
    if (distance < 30)
      return {
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        level: 'CAUTION',
      };
    return { color: 'text-green-500', bg: 'bg-green-500/10', level: 'CLEAR' };
  };

  const distanceStatus = getDistanceStatus(sensorData.ultrasonic);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className='w-full'
    >
      <div
        className={clsx(
          'rounded-2xl p-4 border transition-all duration-300',
          isDark
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-blue-50/95 border-blue-200/50',
        )}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h3
            className={clsx(
              'text-lg font-semibold',
              isDark ? 'text-white' : 'text-gray-900',
            )}
          >
            Live Sensors
          </h3>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className='w-2 h-2 bg-green-500 rounded-full'
          />
        </div>

        {/* Sensor Grid */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          {/* Distance Sensor */}
          <div
            className={clsx(
              'p-3 rounded-xl border',
              distanceStatus.bg,
              isDark ? 'border-slate-600/50' : 'border-gray-200/50',
            )}
          >
            <div className='flex items-center gap-2 mb-1'>
              <Icon
                icon='mingcute:radar-line'
                className={clsx('w-4 h-4', distanceStatus.color)}
              />
              <span className='text-xs font-medium text-gray-500'>
                Distance
              </span>
            </div>
            <div className='flex items-baseline gap-1'>
              <span
                className={clsx(
                  'text-xl font-bold',
                  isDark ? 'text-white' : 'text-gray-900',
                )}
              >
                {sensorData.ultrasonic.toFixed(1)}
              </span>
              <span className='text-xs text-gray-500'>cm</span>
            </div>
            <span className={clsx('text-xs font-medium', distanceStatus.color)}>
              {distanceStatus.level}
            </span>
          </div>

          {/* Battery */}
          <div
            className={clsx(
              'p-3 rounded-xl border',
              isDark
                ? 'bg-slate-700/30 border-slate-600/50'
                : 'bg-gray-50 border-gray-200/50',
            )}
          >
            <div className='flex items-center gap-2 mb-1'>
              <Icon
                icon='solar:battery-charge-bold'
                className={clsx(
                  'w-4 h-4',
                  sensorData.battery > 20 ? 'text-green-500' : 'text-red-500',
                )}
              />
              <span className='text-xs font-medium text-gray-500'>Battery</span>
            </div>
            <div className='flex items-baseline gap-1'>
              <span
                className={clsx(
                  'text-xl font-bold',
                  isDark ? 'text-white' : 'text-gray-900',
                )}
              >
                {sensorData.battery}
              </span>
              <span className='text-xs text-gray-500'>%</span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-1 mt-1'>
              <div
                className={clsx(
                  'h-1 rounded-full transition-all duration-300',
                  sensorData.battery > 20 ? 'bg-green-500' : 'bg-red-500',
                )}
                style={{ width: `${sensorData.battery}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className='space-y-2'>
          {/* Connection Status */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Icon
                icon='solar:wifi-router-bold'
                className={clsx(
                  'w-4 h-4',
                  getStatusColor(sensorData.connectionStatus),
                )}
              />
              <span className='text-sm text-gray-500'>Connection</span>
            </div>
            <div className='flex items-center gap-2'>
              <span
                className={clsx(
                  'text-sm font-medium capitalize',
                  getStatusColor(sensorData.connectionStatus),
                )}
              >
                {sensorData.connectionStatus}
              </span>
              <div className='flex items-center gap-1'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'w-1 h-3 rounded-full',
                      i < Math.floor(sensorData.signal / 25)
                        ? getStatusColor(sensorData.connectionStatus)
                        : 'bg-gray-300',
                    )}
                    style={{
                      backgroundColor:
                        i < Math.floor(sensorData.signal / 25)
                          ? sensorData.connectionStatus === 'online'
                            ? '#10b981'
                            : sensorData.connectionStatus === 'connecting'
                              ? '#f59e0b'
                              : '#ef4444'
                          : '#d1d5db',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Robot Mode */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Icon
                icon='solar:settings-bold'
                className={clsx(
                  'w-4 h-4',
                  isDark ? 'text-blue-400' : 'text-blue-600',
                )}
              />
              <span className='text-sm text-gray-500'>Mode</span>
            </div>
            <span
              className={clsx(
                'text-sm font-medium px-2 py-1 rounded-full',
                isDark
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-blue-100 text-blue-700',
              )}
            >
              {sensorData.mode}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
