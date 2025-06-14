import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCardList from '@/components/cards/StatsCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import StopMonitoringResult from './StopMonitoringResult';
import { useStopMonitoringResult } from './StopMonitoringResultContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import StableCameraStream from './StableCameraStream';

interface ImportLogResult {
  totalData: number;
  success: boolean;
  duplication: boolean;
  message: string;
}

interface ImportedReport {
  ultrasonic_logs: ImportLogResult;
  imu_logs: ImportLogResult;
}

export interface StopMonitoringResultType {
  stopped: boolean;
  sessionId: number;
  date: string;
  importedReport: ImportedReport;
}

interface Metadata {
  ultrasonic: number;
  heading: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface Data {
  id: string;
  src: string;
  alt: string;
  obstacle: boolean;
  date: string;
  fileName: string;
  createdAt: string;
  metadata: Metadata;
}

interface MidAreaMonitoringProps {
  dataMonitoring: Data[];
  currentSession?: number | null;
}

export default function MidArea_Monitoring({
  dataMonitoring,
}: MidAreaMonitoringProps) {
  const { isDark } = useDarkMode();
  const { promise } = useToast();
  const { selectedDevice } = useUserConfig();
  const { stopResult, setStopResult } = useStopMonitoringResult();

  // States for monitoring controls
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
    'idle',
  );

  // Latest monitoring data for StableCameraStream
  const latestData = dataMonitoring[dataMonitoring.length - 1];

  // Start monitoring handler
  const handleStartMonitoring = async () => {
    if (!selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Starting monitoring...',
        success: 'Monitoring started successfully!',
        error: 'Please select a device before starting monitoring.',
      });
      return;
    }

    try {
      await promise(
        fetch(
          `/api/monitoring/realtime/start-monitoring?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
          { method: 'GET' },
        ).then((res) => {
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(
                text || res.statusText || 'Failed to start monitoring',
              );
            });
          }
        }),
        {
          loading: 'Starting monitoring...',
          success: `Monitoring started for device: ${selectedDevice.deviceName}!`,
          error: 'Failed to start monitoring. Please try again.',
        },
      );
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  // Stop monitoring handler
  const handleStopMonitoring = async () => {
    if (!selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Stopping monitoring...',
        success: 'Monitoring stopped successfully!',
        error: 'Please select a device before stopping monitoring.',
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/monitoring/realtime/stop-monitoring?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
        { method: 'GET' },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText || 'Failed to stop monitoring');
      }

      const json = await res.json();
      setStopResult(json.data);

      await promise(Promise.resolve(), {
        loading: 'Stopping monitoring...',
        success: `Monitoring stopped for device: ${selectedDevice.deviceName}!`,
        error: 'Failed to stop monitoring. Please try again.',
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      await promise(Promise.reject(), {
        loading: 'Stopping monitoring...',
        success: 'Monitoring stopped successfully!',
        error: 'Failed to stop monitoring. Please try again.',
      });
    }
  };

  // Recording handler
  const handleRecordClick = async () => {
    try {
      if (recordingState === 'idle') {
        const res = await fetch('http://localhost:4000/record/start');
        const json = await res.json();
        if (json.success) {
          setRecordingState('recording');
          await promise(Promise.resolve(), {
            loading: 'Starting recording...',
            success: 'Recording started successfully!',
            error: 'Failed to start recording.',
          });
        } else {
          throw new Error(json.message || 'Failed to start recording');
        }
      } else {
        const res = await fetch('http://localhost:4000/record/stop');
        const json = await res.json();
        if (json.success && json.saved) {
          setRecordingState('idle');
          await promise(Promise.resolve(), {
            loading: 'Stopping recording...',
            success: `Recording saved to: ${json.saved}`,
            error: 'Failed to stop recording.',
          });
        } else {
          throw new Error('Failed to stop/save recording');
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      await promise(Promise.reject(error), {
        loading: 'Processing...',
        success: 'Success!',
        error:
          error instanceof Error
            ? error.message
            : 'Recording operation failed.',
      });
    }
  };

  // Take photo handler
  const handleTakePhoto = async () => {
    try {
      await promise(
        fetch('http://localhost:4000/capture').then((res) => {
          if (!res.ok) {
            throw new Error('Failed to capture photo');
          }
          return res.json();
        }),
        {
          loading: 'Taking photo...',
          success: 'Photo captured successfully!',
          error: 'Failed to capture photo.',
        },
      );
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  // Recalibrate IMU handler
  const handleRecalibrateIMU = async () => {
    if (!selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Calibrating...',
        success: 'IMU calibrated!',
        error: 'Please select a device first.',
      });
      return;
    }

    try {
      await promise(
        fetch(`/api/devices/${selectedDevice.id}/calibrate-imu`, {
          method: 'POST',
        }).then((res) => {
          if (!res.ok) {
            throw new Error('Failed to calibrate IMU');
          }
        }),
        {
          loading: 'Calibrating IMU...',
          success: 'IMU calibration completed!',
          error: 'Failed to calibrate IMU.',
        },
      );
    } catch (error) {
      console.error('IMU calibration failed:', error);
    }
  };
  return (
    <div
      className={`flex flex-col items-start justify-start h-full gap-4 rounded-xl p-4 md:p-5 w-full border-2 ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      {' '}
      <div className='relative flex-1 w-full h-[300px] md:h-full rounded-2xl overflow-hidden'>
        {/* 🎥 STABLE CAMERA STREAM - Optimized WebSocket management */}
        <StableCameraStream metadata={latestData?.metadata} />
      </div>
      {/* Stats and monitoring data display */}
      {dataMonitoring && dataMonitoring.length > 0 ? (
        <div className='flex flex-col gap-4 items-stretch w-full h-fit'>
          <StatCardList
            variant='distance'
            infoItems={
              dataMonitoring[0]?.metadata?.distances
                ? [
                    {
                      title: 'Distance Total',
                      value:
                        latestData.metadata.distances.distTotal != null
                          ? `${latestData.metadata.distances.distTotal.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance X',
                      value:
                        latestData.metadata.distances.distX != null
                          ? `${latestData.metadata.distances.distX.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance Y',
                      value:
                        latestData.metadata.distances.distY != null
                          ? `${latestData.metadata.distances.distY.toFixed(2)} cm`
                          : '-',
                    },
                  ]
                : []
            }
          />
          <StatCardList
            variant='velocity'
            infoItems={
              dataMonitoring[0]?.metadata?.velocity
                ? [
                    {
                      title: 'Velocity Total',
                      value:
                        latestData.metadata.velocity.velTotal != null
                          ? `${latestData.metadata.velocity.velTotal.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocity != null
                            ? `${latestData.metadata.velocity.velocity.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity X',
                      value:
                        latestData.metadata.velocity.velX != null
                          ? `${latestData.metadata.velocity.velX.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityX != null
                            ? `${latestData.metadata.velocity.velocityX.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity Y',
                      value:
                        latestData.metadata.velocity.velY != null
                          ? `${latestData.metadata.velocity.velY.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityY != null
                            ? `${latestData.metadata.velocity.velocityY.toFixed(2)} m/s`
                            : '-',
                    },
                  ]
                : []
            }
          />{' '}
        </div>
      ) : (
        <div
          className={`flex items-center justify-center w-full h-32 rounded-xl font-semibold text-lg ${
            isDark ? 'bg-[#113541] text-gray-300' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Start monitoring to show the data
        </div>
      )}
      {/* Compact Control Panel - Always Visible */}
      <div className='flex flex-col w-full gap-2.5'>
        <div className='grid grid-cols-1 md:grid-cols-6 gap-2.5 w-full h-fit'>
          {/* Start Monitoring Button */}
          <motion.button
            onClick={handleStartMonitoring}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white col-span-1 md:col-span-3'
          >
            <Icon icon='mingcute:play-fill' width={20} height={20} />
            <p className='font-semibold text-sm text-white'>Start Monitoring</p>
          </motion.button>

          {/* Stop Monitoring Button */}
          <motion.button
            onClick={handleStopMonitoring}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white col-span-1 md:col-span-3'
          >
            <Icon icon='mingcute:stop-fill' width={20} height={20} />
            <p className='font-semibold text-sm text-white'>Stop Monitoring</p>
          </motion.button>

          {/* Recording Button */}
          <motion.button
            onClick={handleRecordClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl col-span-1 md:col-span-2 ${
              isDark
                ? 'border-blue-500/10 bg-[#0A1625] text-white'
                : 'border-blue-400/20 bg-white text-black'
            }`}
          >
            <p
              className={`font-semibold text-sm ${
                isDark
                  ? 'text-white'
                  : 'bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text'
              }`}
            >
              {recordingState === 'idle' ? 'Record' : 'Stop Rec'}
            </p>
            <Icon
              icon={
                recordingState === 'idle'
                  ? 'fluent:video-recording-20-filled'
                  : 'fluent:stop-24-filled'
              }
              width={20}
              height={20}
              className={isDark ? 'text-blue-500' : 'text-[#39A9F9]'}
            />
          </motion.button>

          {/* Take Photo Button */}
          <motion.button
            onClick={handleTakePhoto}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl col-span-1 md:col-span-2 ${
              isDark
                ? 'border-blue-500/10 bg-[#0A1625] text-white'
                : 'border-blue-400/20 bg-white text-black'
            }`}
          >
            <p
              className={`font-semibold text-sm ${
                isDark
                  ? 'text-white'
                  : 'bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text'
              }`}
            >
              Photo
            </p>
            <Icon
              icon='mingcute:camera-2-ai-fill'
              width={20}
              height={20}
              className={isDark ? 'text-blue-500' : 'text-[#39A9F9]'}
            />
          </motion.button>

          {/* Calibrate IMU Button */}
          <motion.button
            onClick={handleRecalibrateIMU}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl col-span-1 md:col-span-2 ${
              isDark
                ? 'border-blue-500/10 bg-[#0A1625] text-white'
                : 'border-blue-400/20 bg-white text-black'
            }`}
          >
            <p
              className={`font-semibold text-sm ${
                isDark
                  ? 'text-white'
                  : 'bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text'
              }`}
            >
              Calibrate
            </p>
            <Icon
              icon='mynaui:chip-solid'
              width={20}
              height={20}
              className={isDark ? 'text-blue-500' : 'text-[#39A9F9]'}
            />
          </motion.button>
        </div>
      </div>{' '}
      {/* Stop Monitoring Result Modal */}
      <AnimatePresence>
        {stopResult && <StopMonitoringResult result={stopResult} />}
      </AnimatePresence>
    </div>
  );
}
