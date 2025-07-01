import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCardList from '@/components/cards/StatsCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import StopMonitoringResult from './StopMonitoringResult';
import { useStopMonitoringResult } from './StopMonitoringResultContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import StableCameraStream, {
  StableCameraStreamRef,
} from './StableCameraStream';

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
  velocity?: number;
  velocityX?: number;
  velocityY?: number;
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };  position: {
    positionX?: number;
    positionY?: number;
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
  isLocalMode?: boolean;
  isConnected?: boolean;
  serialBuffer?: string;
  liveSerialData?: Metadata | null;
  autoPhotoEnabled?: boolean;
  onAutoPhotoToggle?: (enabled: boolean) => void;
}

export default function MidArea_Monitoring({
  dataMonitoring,
  currentSession = 0,
  isLocalMode = false,
  isConnected = false,
  serialBuffer = '',
  liveSerialData = null,
  autoPhotoEnabled = false,
  onAutoPhotoToggle,
}: MidAreaMonitoringProps) {
  const { isDark } = useDarkMode();
  const { promise } = useToast();
  const { selectedDevice } = useUserConfig();
  const { stopResult, setStopResult } = useStopMonitoringResult();
  // Ref for camera stream
  const cameraStreamRef = useRef<StableCameraStreamRef>(null); // States for monitoring controls
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
    'idle',
  );

  // Auto photo capture states - using props instead of local state
  const [isCapturingObstaclePhoto, setIsCapturingObstaclePhoto] =
    useState<boolean>(false);

  // Constants for obstacle detection - single threshold, no interval
  const OBSTACLE_THRESHOLD = 20; // cm - Auto-capture when ultrasonic < 20cm

  // Local mode session management
  const [localCurrentSession, setLocalCurrentSession] = useState<number | null>(
    null,
  );
  interface UltrasonicData {
    ultrasonic: number;
    timestamp: string;
    imageFileName?: string;
  }

  interface IMUData {
    heading?: number;
    pitch?: number;
    roll?: number;
    yaw?: number;
    ultrasonic?: number;
    accelerationMagnitude?: number;
    rotationRate?: number;
    linearAcceleration?: number;
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    distanceTraveled?: number;
    magnetometer?: {
      magnetometerX: number;
      magnetometerY: number;
      magnetometerZ: number;
    };
    position?: {
      positionX?: number;
      positionY?: number;
    };
    distances?: {
      distTotal?: number;
      distX?: number;
      distY?: number;
    };
    timestamp: string;
    imageFileName?: string;
  }

  interface PathData {
    timestamp: string;
    position: {
      positionX?: number;
      positionY?: number;
    };
    velocity?: number;
    heading?: number;
    direction?: string;
    distanceTraveled?: number;
    ultrasonic?: number;
    imageFileName?: string;
  }

  // Monitoring data collection states
  const [monitoringData, setMonitoringData] = useState<{
    ultrasonic: UltrasonicData[];
    imu: IMUData[];
    paths: PathData[];
  }>({
    ultrasonic: [],
    imu: [],
    paths: [],
  });

  // Function to get current session from config
  const getCurrentSessionFromConfig = async (): Promise<number> => {
    try {
      if (window.electronAPI?.getConfig) {
        const currentSession =
          await window.electronAPI.getConfig('currentSession');
        return typeof currentSession === 'number' ? currentSession : 1;
      }
    } catch (error) {
      console.error('Error getting session from config:', error);
    }
    return 1;
  };

  // Function to increment and save session to config
  const incrementSessionInConfig = async (): Promise<number> => {
    try {
      if (window.electronAPI?.setConfig) {
        const currentSession = await getCurrentSessionFromConfig();
        const newSession = currentSession + 1;
        await window.electronAPI.setConfig('currentSession', newSession);
        return newSession;
      }
    } catch (error) {
      console.error('Error setting session in config:', error);
    }
    return Date.now(); // Fallback to timestamp
  };

  // Function to save monitoring data to JSON files
  const saveMonitoringDataToFiles = async (sessionId: number) => {
    if (!window.electronAPI?.saveImageToFolder) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Save ultrasonic data
      if (monitoringData.ultrasonic.length > 0) {
        const ultrasonicContent = JSON.stringify(
          monitoringData.ultrasonic,
          null,
          2,
        );
        const ultrasonicBuffer = new Uint8Array(
          Buffer.from(ultrasonicContent, 'utf-8'),
        );

        await window.electronAPI.saveImageToFolder(
          ultrasonicBuffer,
          `${sessionId}.json`,
          `reports/ultrasonic/${today}`,
        );
        console.log(
          '💾 [MONITORING] Saved ultrasonic data:',
          monitoringData.ultrasonic.length,
          'entries',
        );
      }

      // Save IMU data
      if (monitoringData.imu.length > 0) {
        const imuContent = JSON.stringify(monitoringData.imu, null, 2);
        const imuBuffer = new Uint8Array(Buffer.from(imuContent, 'utf-8'));

        await window.electronAPI.saveImageToFolder(
          imuBuffer,
          `${sessionId}.json`,
          `reports/imu/${today}`,
        );
        console.log(
          '💾 [MONITORING] Saved IMU data:',
          monitoringData.imu.length,
          'entries',
        );
      }

      // Save paths data
      if (monitoringData.paths.length > 0) {
        const pathsContent = JSON.stringify(monitoringData.paths, null, 2);
        const pathsBuffer = new Uint8Array(Buffer.from(pathsContent, 'utf-8'));

        await window.electronAPI.saveImageToFolder(
          pathsBuffer,
          `${sessionId}.json`,
          `reports/paths/${today}`,
        );
        console.log(
          '💾 [MONITORING] Saved paths data:',
          monitoringData.paths.length,
          'entries',
        );
      }

      console.log('💾 [MONITORING] All monitoring data saved successfully!');
    } catch (error) {
      console.error('💾 [MONITORING] Error saving monitoring data:', error);
    }
  }; // Function to inject imageFileName into monitoring data
  const injectImageFileName = React.useCallback((imageFileName: string) => {
    console.log(
      '📸 [MONITORING] Starting imageFileName injection:',
      imageFileName,
    );

    // Add imageFileName to the latest entries of each type with enhanced logic
    setMonitoringData(
      (prev: {
        ultrasonic: UltrasonicData[];
        imu: IMUData[];
        paths: PathData[];
      }) => {
        const newData = { ...prev };
        let injectionCount = 0;

        // Add to latest ultrasonic entry if exists
        if (newData.ultrasonic.length > 0) {
          const lastIndex = newData.ultrasonic.length - 1;
          newData.ultrasonic[lastIndex] = {
            ...newData.ultrasonic[lastIndex],
            imageFileName,
          };
          injectionCount++;
          console.log(
            `📸 [MONITORING] Injected imageFileName to ultrasonic entry ${lastIndex}:`,
            newData.ultrasonic[lastIndex],
          );
        } else {
          console.log('📸 [MONITORING] No ultrasonic data to inject into');
        }

        // Add to latest IMU entry if exists
        if (newData.imu.length > 0) {
          const lastIndex = newData.imu.length - 1;
          newData.imu[lastIndex] = {
            ...newData.imu[lastIndex],
            imageFileName,
          };
          injectionCount++;
          console.log(
            `📸 [MONITORING] Injected imageFileName to IMU entry ${lastIndex}:`,
            newData.imu[lastIndex],
          );
        } else {
          console.log('📸 [MONITORING] No IMU data to inject into');
        }

        // Add to latest paths entry if exists
        if (newData.paths.length > 0) {
          const lastIndex = newData.paths.length - 1;
          newData.paths[lastIndex] = {
            ...newData.paths[lastIndex],
            imageFileName,
          };
          injectionCount++;
          console.log(
            `📸 [MONITORING] Injected imageFileName to paths entry ${lastIndex}:`,
            newData.paths[lastIndex],
          );
        } else {
          console.log('📸 [MONITORING] No paths data to inject into');
        }

        console.log(
          `📸 [MONITORING] Successfully injected imageFileName "${imageFileName}" into ${injectionCount} data types`,
        );

        return newData;
      },
    );
  }, []);
  // Cache untuk mencegah duplikasi - HARUS di luar useEffect agar persisten
  const processedDataCacheRef = useRef(new Set<string>());
  const timestampCounterRef = useRef(0);

  // Effect to process serial buffer data
  useEffect(() => {
    // Function to parse serial data into reports format
    const parseSerialDataToReports = (serialData: string, sourceInfo = '') => {
      try {
        // Try to parse as JSON
        const data = JSON.parse(serialData);

        // Create a unique key untuk deduplication berdasarkan data ESP32 timestamp dan sensor values
        const dataKey = `${data.timestamp}_${data.ultrasonic}_${data.heading}_${data.pitch}_${data.roll}`;

        // Skip jika data sudah pernah diproses
        if (processedDataCacheRef.current.has(dataKey)) {
          console.log(
            '📊 [MONITORING] Skipping duplicate data:',
            dataKey,
            sourceInfo,
          );
          return;
        }

        // STRICT validation - must have actual sensor data, not just timestamp
        const hasValidUltrasonicData =
          (data.ultrasonic !== undefined &&
            data.ultrasonic !== null &&
            typeof data.ultrasonic === 'number' &&
            data.ultrasonic >= 0) ||
          (data.ultrasonicDistance !== undefined &&
            data.ultrasonicDistance !== null &&
            typeof data.ultrasonicDistance === 'number' &&
            data.ultrasonicDistance >= 0);

        const hasValidIMUData =
          (data.heading !== undefined &&
            data.heading !== null &&
            typeof data.heading === 'number' &&
            !isNaN(data.heading)) ||
          (data.pitch !== undefined &&
            data.pitch !== null &&
            typeof data.pitch === 'number' &&
            !isNaN(data.pitch)) ||
          (data.roll !== undefined &&
            data.roll !== null &&
            typeof data.roll === 'number' &&
            !isNaN(data.roll));

        const hasValidPosData =
          (data.position &&
            typeof data.position === 'object' &&
            (typeof data.position.positionX === 'number' ||
              typeof data.position.positionY === 'number')) ||
          (typeof data.positionX === 'number' && data.positionX !== null) ||
          (typeof data.positionY === 'number' && data.positionY !== null);

        // Must have at least one type of valid sensor data (not just timestamp)
        const hasValidSensorData =
          hasValidUltrasonicData || hasValidIMUData || hasValidPosData;

        // Skip entries that only have timestamp or other metadata
        if (!hasValidSensorData) {
          console.log(
            '📊 [MONITORING] Skipping entry without valid sensor data:',
            data,
          );
          return;
        }

        // Add to cache untuk prevent duplicate processing
        processedDataCacheRef.current.add(dataKey);

        // Limit cache size untuk prevent memory leak
        if (processedDataCacheRef.current.size > 1000) {
          const firstKey = processedDataCacheRef.current.values().next().value;
          if (firstKey) {
            processedDataCacheRef.current.delete(firstKey);
          }
        }

        // Buat timestamp unik berdasarkan waktu kita menerima data
        const now = Date.now();
        const timestamp = new Date(
          now + timestampCounterRef.current,
        ).toISOString();
        timestampCounterRef.current += 1; // Increment 1ms per entry untuk ensure uniqueness

        // Debug logging to see the actual data structure
        console.log('📊 [DEBUG] Valid sensor data found:', data, sourceInfo);
        console.log('📊 [DEBUG] Generated timestamp:', timestamp);
        console.log('📊 [DEBUG] Data key:', dataKey);

        // Extract ultrasonic data - only if valid with strict validation
        if (hasValidUltrasonicData) {
          const ultrasonicValue =
            data.ultrasonic !== undefined && data.ultrasonic >= 0
              ? data.ultrasonic
              : data.ultrasonicDistance;

          const ultrasonicEntry = {
            ultrasonic: ultrasonicValue,
            timestamp,
            ...(data.imageFileName && { imageFileName: data.imageFileName }),
          };

          setMonitoringData((prev) => ({
            ...prev,
            ultrasonic: [...prev.ultrasonic, ultrasonicEntry],
          }));

          console.log(
            '📊 [MONITORING] Added ultrasonic entry:',
            ultrasonicEntry,
          );
        }

        // Extract IMU data - only if valid with strict validation
        if (hasValidIMUData) {
          const imuEntry = {
            heading: data.heading,
            pitch: data.pitch,
            roll: data.roll,
            yaw: data.yaw,
            ultrasonic:
              data.ultrasonic !== undefined && data.ultrasonic >= 0
                ? data.ultrasonic
                : undefined,
            accelerationMagnitude: data.accelerationMagnitude,
            rotationRate: data.rotationRate,
            linearAcceleration: data.linearAcceleration,
            velocity: data.velocity,
            velocityX: data.velocityX,
            velocityY: data.velocityY,
            distanceTraveled: data.distanceTraveled,
            magnetometer: data.magnetometer,
            position: data.position,
            distances: data.distances,
            timestamp,
            ...(data.imageFileName && { imageFileName: data.imageFileName }),
          };

          setMonitoringData((prev) => ({
            ...prev,
            imu: [...prev.imu, imuEntry],
          }));

          console.log('📊 [MONITORING] Added IMU entry:', imuEntry);
        }

        // Extract paths data - hanya jika ada data posisi atau movement yang valid
        const hasValidPositionData =
          (data.position &&
            typeof data.position === 'object' &&
            (data.position.positionX !== undefined ||
              data.position.positionY !== undefined)) ||
          (data.positionX !== undefined && data.positionX !== null) ||
          (data.positionY !== undefined && data.positionY !== null) ||
          (data.x !== undefined && data.x !== null) ||
          (data.y !== undefined && data.y !== null);

        const hasValidMovementData =
          data.heading !== undefined &&
          data.heading !== null &&
          !isNaN(data.heading) &&
          ((data.speed !== undefined && data.speed !== null) ||
            (data.velocity !== undefined && data.velocity !== null));

        if (hasValidPositionData || hasValidMovementData) {
          // Handle different position formats
          let positionData = {
            positionX: 0,
            positionY: 0,
          };

          if (data.position && typeof data.position === 'object') {
            // Nested position format
            positionData = {
              positionX: data.position.positionX ?? data.position.x ?? 0,
              positionY: data.position.positionY ?? data.position.y ?? 0,
            };
          } else if (
            data.positionX !== undefined ||
            data.positionY !== undefined
          ) {
            // Flat position format
            positionData = {
              positionX: data.positionX ?? 0,
              positionY: data.positionY ?? 0,
            };
          } else if (data.x !== undefined || data.y !== undefined) {
            // Alternative flat format
            positionData = {
              positionX: data.x ?? 0,
              positionY: data.y ?? 0,
            };
          }

          const pathEntry = {
            timestamp,
            position: positionData,
            speed: data.speed ?? data.velocity ?? 0,
            velocity: data.velocity,
            heading: data.heading,
            direction: data.direction,
            distanceTraveled: data.distanceTraveled,
            ultrasonic: data.ultrasonic >= 0 ? data.ultrasonic : undefined,
            ...(data.imageFileName && { imageFileName: data.imageFileName }),
          };

          console.log('📊 [DEBUG] Adding valid path entry:', pathEntry);

          setMonitoringData((prev) => ({
            ...prev,
            paths: [...prev.paths, pathEntry],
          }));
        }

        console.log(
          '📊 [MONITORING] Successfully processed valid sensor data:',
          {
            timestamp,
            hasValidUltrasonic: hasValidUltrasonicData,
            hasValidIMU: hasValidIMUData,
            hasValidPosition: hasValidPosData,
            ultrasonicValue:
              data.ultrasonic !== undefined && data.ultrasonic >= 0
                ? data.ultrasonic
                : data.ultrasonicDistance,
            dataKeys: Object.keys(data),
          },
        );
      } catch (error) {
        console.warn(
          '📊 [MONITORING] Failed to parse serial data:',
          serialData,
          error,
        );
      }
    };
    if (serialBuffer && isLocalMode && localCurrentSession) {
      // Track processed JSON content untuk prevent duplicate processing dari fragments
      const processedJsonContent = new Set<string>();

      // Split by lines dan reassemble JSON yang terpotong
      const lines = serialBuffer
        .split('\n')
        .filter((line: string) => line.trim());

      lines.forEach((line: string) => {
        // Extract JSON dari ESP32 log format: [timestamp] [ESP32] {json}
        // Match complete JSON objects that start with { and end with }
        const jsonMatch = line.match(/\{[^}]*\}$/);

        if (jsonMatch) {
          // JSON lengkap ditemukan
          const jsonStr = jsonMatch[0];

          // Check if this exact JSON content has been processed already
          if (processedJsonContent.has(jsonStr)) {
            console.log(
              '📊 [MONITORING] Skipping already processed JSON content',
            );
            return;
          }

          try {
            // Test parsing untuk memastikan JSON valid dan complete
            const testData = JSON.parse(jsonStr);

            // Minimal validation - harus ada field sensor data, bukan hanya timestamp
            if (
              testData &&
              typeof testData === 'object' &&
              (typeof testData.ultrasonic === 'number' ||
                typeof testData.heading === 'number' ||
                typeof testData.pitch === 'number' ||
                typeof testData.roll === 'number' ||
                (testData.position && typeof testData.position === 'object'))
            ) {
              // Mark this JSON content as processed
              processedJsonContent.add(jsonStr);
              parseSerialDataToReports(jsonStr, 'complete_json');
            } else {
              console.log(
                '📊 [MONITORING] Skipping JSON without actual sensor data:',
                jsonStr,
              );
            }
          } catch {
            console.warn('📊 [MONITORING] Invalid JSON found:', jsonStr);
          }
        } else {
          // DISABLE fragment processing untuk prevent duplikasi
          // Hanya process JSON yang sudah lengkap
          console.log(
            '📊 [MONITORING] Ignoring fragment to prevent duplication:',
            line,
          );
        }
      });
    }
  }, [serialBuffer, isLocalMode, localCurrentSession]);

  const latestData = dataMonitoring[dataMonitoring.length - 1];
  // Create default data for local mode when connected but no data yet
  const defaultLocalData = React.useMemo(
    () => ({
      metadata: {
        ultrasonic: 0,
        heading: 0,
        direction: 'North',
        accelerationMagnitude: 0,
        rotationRate: 0,
        distanceTraveled: 0,
        linearAcceleration: 0,
        velocity: 0,
        velocityX: 0,
        velocityY: 0,
        magnetometer: { magnetometerX: 0, magnetometerY: 0, magnetometerZ: 0 },
        position: { positionX: 0, positionY: 0 },
        pitch: 0,
        roll: 0,
        yaw: 0,
      },
    }),
    [],
  ); // Use latest data or live serial data or default data for local mode
  const displayData = React.useMemo(() => {
    console.log('🔍 [DISPLAY DATA DEBUG] Computing displayData:');
    console.log('  - latestData:', latestData);
    console.log('  - liveSerialData:', liveSerialData);
    console.log('  - isLocalMode:', isLocalMode);
    console.log('  - isConnected:', isConnected);

    const result =
      latestData ||
      (liveSerialData ? { metadata: liveSerialData } : null) ||
      (isLocalMode && isConnected ? defaultLocalData : null);

    console.log('  - Final displayData:', result);
    return result;
  }, [latestData, liveSerialData, isLocalMode, isConnected, defaultLocalData]);
  // Debug: Log data flow for camera overlay
  useEffect(() => {
    console.log('🔍 [CAMERA DATA DEBUG] Props received:');
    console.log('  - isLocalMode:', isLocalMode);
    console.log('  - isConnected:', isConnected);
    console.log('  - liveSerialData:', liveSerialData);
    console.log('🔍 [CAMERA DATA DEBUG] displayData:', displayData);
    console.log('🔍 [CAMERA DATA DEBUG] latestData:', latestData);
    console.log(
      '🔍 [CAMERA DATA DEBUG] metadata for camera:',
      displayData?.metadata,
    );
  }, [displayData, liveSerialData, latestData, isLocalMode, isConnected]);

  // Auto obstacle detection and photo capture
  useEffect(() => {
    // Only run in local mode with active monitoring session and auto photo enabled
    if (!isLocalMode || !localCurrentSession || !autoPhotoEnabled) return;

    // Get current ultrasonic value from displayData or liveSerialData
    const currentUltrasonic =
      displayData?.metadata?.ultrasonic ?? liveSerialData?.ultrasonic ?? null;

    // Check if we have valid ultrasonic data and it indicates an obstacle
    if (
      currentUltrasonic !== null &&
      typeof currentUltrasonic === 'number' &&
      currentUltrasonic >= 0 &&
      currentUltrasonic < OBSTACLE_THRESHOLD
    ) {
      console.log(
        `🚨 [OBSTACLE MONITOR] Obstacle detected: ${currentUltrasonic.toFixed(2)}cm (threshold: ${OBSTACLE_THRESHOLD}cm)`,
      );

      // Trigger auto photo capture
      handleAutoObstaclePhoto(currentUltrasonic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displayData?.metadata?.ultrasonic,
    liveSerialData?.ultrasonic,
    isLocalMode,
    localCurrentSession,
    autoPhotoEnabled,
    OBSTACLE_THRESHOLD,
    // handleAutoObstaclePhoto - excluded to avoid circular dependency
  ]);

  // Determine the effective current session (use localCurrentSession in local mode, currentSession in online mode)
  const effectiveCurrentSession = isLocalMode
    ? localCurrentSession || 0
    : currentSession || 0;
  // Start monitoring handler
  const handleStartMonitoring = async () => {
    if (isLocalMode) {
      // Local mode: Create monitoring session and initialize data collection
      try {
        await promise(
          new Promise<void>(async (resolve, reject) => {
            try {
              // Check if running in Electron
              if (
                typeof window !== 'undefined' &&
                window.electronAPI &&
                window.electronAPI.createFolder
              ) {
                // Get new session ID from config
                const newSessionId = await incrementSessionInConfig();

                // Clear previous monitoring data
                setMonitoringData({
                  ultrasonic: [],
                  imu: [],
                  paths: [],
                });

                // Reset deduplication cache untuk session baru
                processedDataCacheRef.current.clear();
                timestampCounterRef.current = 0;
                console.log(
                  '📊 [MONITORING] Reset deduplication cache for new session',
                );

                // Create monitoring session folder
                const sessionFolder = `monitoring/${newSessionId}`;
                const result =
                  await window.electronAPI.createFolder(sessionFolder);
                if (result.success) {
                  // Store current session for photo capture and data collection
                  setLocalCurrentSession(newSessionId);
                  console.log(
                    `📊 [MONITORING] Session ${newSessionId} started - data collection initialized`,
                  );
                  resolve();
                } else {
                  throw new Error(
                    result.error || 'Failed to create monitoring folder',
                  );
                }
              } else {
                throw new Error('Electron API not available');
              }
            } catch (error) {
              reject(error);
            }
          }),
          {
            loading: 'Starting monitoring session...',
            success: 'Monitoring started! Real-time data collection is active.',
            error: 'Failed to start monitoring session.',
          },
        );
      } catch (error) {
        console.error('Error starting local monitoring:', error);
      }
      return;
    }

    // Online mode: existing logic
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
  }; // Stop monitoring handler
  const handleStopMonitoring = async () => {
    if (isLocalMode) {
      // Local mode: Save monitoring data and clean up session
      try {
        await promise(
          new Promise<void>(async (resolve, reject) => {
            try {
              if (localCurrentSession) {
                // Save all collected monitoring data to reports
                await saveMonitoringDataToFiles(localCurrentSession);

                // Clear current session
                setLocalCurrentSession(null);

                // Clear monitoring data
                setMonitoringData({
                  ultrasonic: [],
                  imu: [],
                  paths: [],
                });

                console.log(
                  '📊 [MONITORING] Session stopped and data saved to reports',
                );
                resolve();
              } else {
                console.log('📊 [MONITORING] No active session to stop');
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }),
          {
            loading: 'Stopping monitoring and saving data...',
            success: 'Monitoring stopped! Data saved to reports folder.',
            error: 'Failed to stop monitoring session.',
          },
        );
      } catch (error) {
        console.error('Error stopping local monitoring:', error);
      }
      return;
    }

    // Online mode: existing logic
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

  // Toggle vertical flip handler
  const handleToggleFlip = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.toggleFlipVertical();
    }
  };
  // Take photo handler - capture from websocket and post to realtime endpoint or save locally
  const handleTakePhoto = async () => {
    // In local mode, we don't need selectedDevice validation
    if (!isLocalMode && !selectedDevice) {
      await promise(Promise.reject(new Error('No device selected')), {
        loading: 'Taking photo...',
        success: 'Photo captured!',
        error: 'Please select a device before taking photo.',
      });
      return;
    }

    if (!cameraStreamRef.current?.isConnected) {
      await promise(Promise.reject(new Error('Camera not connected')), {
        loading: 'Taking photo...',
        success: 'Photo captured!',
        error: 'Camera stream is not connected.',
      });
      return;
    }

    try {
      await promise(
        new Promise<void>(async (resolve, reject) => {
          try {
            // Capture frame from camera stream
            const blob = await cameraStreamRef.current!.captureFrame();
            if (isLocalMode) {
              // Local mode: Save photo locally with professional metadata layout
              const image = new Image();
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              if (!ctx) {
                throw new Error('Canvas context not available');
              }

              // Convert blob to image
              const imageUrl = window.URL.createObjectURL(blob);

              await new Promise<void>((imageResolve, imageReject) => {
                image.onload = () => {
                  // Prepare metadata text
                  const currentTime = new Date().toLocaleString();
                  const deviceName = isLocalMode
                    ? 'ESP32 (Local Mode)'
                    : selectedDevice?.deviceName || 'Unknown Device';

                  const metadataLines = [
                    `RoboGo Capture - ${currentTime}`,
                    `Device: ${deviceName}`,
                  ];

                  if (displayData?.metadata) {
                    const metadata = displayData.metadata;
                    metadataLines.push(
                      `Ultrasonic: ${metadata.ultrasonic?.toFixed(2) || 'N/A'} cm`,
                      `Heading: ${metadata.heading?.toFixed(2) || 'N/A'}°`,
                      `Direction: ${metadata.direction || 'N/A'}`,
                    );

                    if (
                      metadata.pitch !== undefined ||
                      metadata.roll !== undefined ||
                      metadata.yaw !== undefined
                    ) {
                      metadataLines.push(
                        `Pitch: ${metadata.pitch?.toFixed(2) || 'N/A'}°`,
                        `Roll: ${metadata.roll?.toFixed(2) || 'N/A'}°`,
                        `Yaw: ${metadata.yaw?.toFixed(2) || 'N/A'}°`,
                      );
                    }

                    if (
                      metadata.position?.positionX !== undefined ||
                      metadata.position?.positionY !== undefined
                    ) {
                      metadataLines.push(
                        `Position X: ${metadata.position.positionX?.toFixed(2) || 'N/A'}`,
                        `Position Y: ${metadata.position.positionY?.toFixed(2) || 'N/A'}`,
                      );
                    }

                    if (
                      metadata.velocityX !== undefined ||
                      metadata.velocityY !== undefined
                    ) {
                      metadataLines.push(
                        `Velocity X: ${metadata.velocityX?.toFixed(2) || 'N/A'} m/s`,
                        `Velocity Y: ${metadata.velocityY?.toFixed(2) || 'N/A'} m/s`,
                      );
                    }
                  } // Calculate dynamic height based on content
                  const originalWidth = image.width;
                  const originalHeight = image.height;

                  // Calculate required height for metadata
                  const headerHeight = 60;
                  const lineHeight = 18;
                  const padding = 20;
                  const footerHeight = 30;
                  const sensorDataLines = metadataLines.length - 2; // Exclude timestamp and device name
                  const columnsCount = Math.min(
                    3,
                    Math.ceil(originalWidth / 200),
                  ); // Dynamic columns based on width
                  const itemsPerColumn = Math.ceil(
                    sensorDataLines / columnsCount,
                  );
                  const contentHeight =
                    headerHeight +
                    80 +
                    itemsPerColumn * lineHeight +
                    padding +
                    footerHeight;

                  const metadataHeight = Math.max(200, contentHeight); // Minimum 200px
                  const totalWidth = originalWidth;
                  const totalHeight = originalHeight + metadataHeight;

                  // Set canvas size to accommodate both image and metadata
                  canvas.width = totalWidth;
                  canvas.height = totalHeight;

                  // Fill background with a clean color
                  ctx.fillStyle = '#f8fafc';
                  ctx.fillRect(0, 0, totalWidth, totalHeight); // Draw the original image at the top
                  ctx.drawImage(image, 0, 0, originalWidth, originalHeight);

                  // Add a subtle border around the image
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(0, 0, originalWidth, originalHeight);

                  // Draw metadata area background below the image
                  const metadataY = originalHeight;
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, metadataY, originalWidth, metadataHeight);

                  // Add horizontal divider line
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(0, metadataY);
                  ctx.lineTo(originalWidth, metadataY);
                  ctx.stroke(); // Draw header section
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(0, metadataY, originalWidth, headerHeight);

                  // Draw RoboGo logo/title
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 20px Arial, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText('RoboGo', originalWidth / 2, metadataY + 25);
                  ctx.font = '12px Arial, sans-serif';
                  ctx.fillText(
                    'Capture Report',
                    originalWidth / 2,
                    metadataY + 45,
                  );

                  // Draw metadata content
                  ctx.fillStyle = '#374151';
                  ctx.font = '14px Arial, sans-serif';
                  ctx.textAlign = 'left';

                  let currentY = metadataY + headerHeight + 20;
                  const leftMargin = 20;
                  const columnWidth = (originalWidth - 40) / columnsCount; // Dynamic columns

                  metadataLines.forEach((line, index) => {
                    if (index === 0) {
                      // Timestamp - full width
                      ctx.fillStyle = '#6366f1';
                      ctx.font = 'bold 14px Arial, sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText(line, originalWidth / 2, currentY);
                      currentY += lineHeight + 10;

                      // Draw separator line
                      ctx.strokeStyle = '#e5e7eb';
                      ctx.lineWidth = 1;
                      ctx.beginPath();
                      ctx.moveTo(leftMargin, currentY - 5);
                      ctx.lineTo(originalWidth - leftMargin, currentY - 5);
                      ctx.stroke();
                      currentY += 10;
                    } else if (index === 1) {
                      // Device name - full width
                      ctx.fillStyle = '#374151';
                      ctx.font = 'bold 14px, Arial, sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText(line, originalWidth / 2, currentY);
                      currentY += lineHeight + 15;

                      // Reset for column layout
                      currentY = metadataY + headerHeight + 80;
                      ctx.textAlign = 'left';
                    } else {
                      // Sensor data in dynamic columns
                      const dataIndex = index - 2;
                      const currentColumn = Math.floor(
                        dataIndex / itemsPerColumn,
                      );
                      const itemInColumn = dataIndex % itemsPerColumn;

                      const xPos = leftMargin + currentColumn * columnWidth;
                      const yPos = currentY + itemInColumn * lineHeight;
                      if (
                        currentColumn < columnsCount &&
                        yPos < metadataY + metadataHeight - footerHeight - 10
                      ) {
                        ctx.fillStyle = '#374151';
                        ctx.font = '12px Arial, sans-serif'; // Split label and value for better formatting
                        const [label, value] = line.split(': ');
                        const maxLabelWidth = columnWidth * 0.6; // 60% for label

                        // Truncate label if too long
                        let displayLabel = label;
                        ctx.fillStyle = '#374151';
                        ctx.font = '12px Arial, sans-serif';
                        if (
                          ctx.measureText(displayLabel + ':').width >
                          maxLabelWidth
                        ) {
                          while (
                            ctx.measureText(displayLabel + '...').width >
                              maxLabelWidth &&
                            displayLabel.length > 3
                          ) {
                            displayLabel = displayLabel.slice(0, -1);
                          }
                          displayLabel += '...';
                        }

                        ctx.fillText(`${displayLabel}:`, xPos, yPos);

                        ctx.fillStyle = '#059669';
                        ctx.font = 'bold 12px Arial, sans-serif';
                        const labelWidth = ctx.measureText(
                          `${displayLabel}:`,
                        ).width;
                        ctx.fillText(
                          value || 'N/A',
                          xPos + labelWidth + 5,
                          yPos,
                        );

                        ctx.fillStyle = '#374151';
                        ctx.font = '12px Arial, sans-serif';
                      }
                    }
                  }); // Add footer with branding (dynamic position)
                  const footerY = totalHeight - footerHeight + 10;
                  ctx.fillStyle = '#94a3b8';
                  ctx.font = '10px Arial, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(
                    'Generated by RoboGo Dashboard',
                    originalWidth / 2,
                    footerY,
                  ); // Convert canvas to blob
                  canvas.toBlob(
                    async (resultBlob) => {
                      if (resultBlob) {
                        try {
                          // Generate filename with date-time and metadata
                          const now = new Date();
                          const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
                          const timeStr = now
                            .toTimeString()
                            .split(' ')[0]
                            .replace(/:/g, '-'); // HH-MM-SS
                          const dateTime = `${dateStr}_${timeStr}`;
                          const deviceNameClean = isLocalMode
                            ? 'esp32_local'
                            : selectedDevice?.deviceName?.replace(
                                /[^a-zA-Z0-9]/g,
                                '_',
                              ) || 'unknown'; // Base filename without extension
                          const baseFileName = `robogo_capture_${deviceNameClean}_${dateTime}`;

                          // Inject imageFileName into monitoring data for reports
                          if (localCurrentSession) {
                            injectImageFileName(baseFileName);
                          }

                          // Different filenames for each type
                          const originalFileName = `${baseFileName}_original.jpg`;
                          const metadataFileName = `${baseFileName}_metadata.jpg`;
                          const jsonFileName = `${baseFileName}.json`;

                          // Check if running in Electron and save locally
                          if (
                            typeof window !== 'undefined' &&
                            window.electronAPI?.saveImageToFolder
                          ) {
                            // 1. Save original image (without metadata overlay)
                            const originalBuffer = new Uint8Array(
                              await blob.arrayBuffer(),
                            );

                            // 2. Save metadata-enhanced image (current resultBlob)
                            const metadataBuffer = new Uint8Array(
                              await resultBlob.arrayBuffer(),
                            ); // 3. Create and save metadata JSON file
                            const metadataJson = {
                              captureInfo: {
                                timestamp: now.toISOString(),
                                createdAt: baseFileName, // Date-time format for categorization
                                deviceName: deviceNameClean,
                                captureMode: 'local',
                                originalFileName: originalFileName,
                                metadataFileName: metadataFileName,
                                jsonFileName: jsonFileName,
                              },
                              sensorData: displayData?.metadata || {},
                              imageInfo: {
                                width: image.width,
                                height: image.height,
                                format: 'JPEG',
                                quality: 0.95,
                              },
                              session: {
                                sessionId: localCurrentSession || 'no-session',
                                sessionActive: !!localCurrentSession,
                              },
                            };

                            const jsonContent = JSON.stringify(
                              metadataJson,
                              null,
                              2,
                            );
                            const jsonBlob = new Blob([jsonContent], {
                              type: 'application/json',
                            });
                            const jsonBuffer = new Uint8Array(
                              await jsonBlob.arrayBuffer(),
                            );
                            const saveResults = []; // Determine save location based on session
                            const baseLocation = localCurrentSession
                              ? `monitoring/${localCurrentSession}`
                              : 'reports/gallery';

                            // Define organized subfolders for each file type
                            const originalLocation = `${baseLocation}/originals`;
                            const metadataLocation = `${baseLocation}/metadata`;
                            const jsonLocation = `${baseLocation}/json`;

                            try {
                              // Save all three files to their respective organized folders
                              const originalResult =
                                await window.electronAPI.saveImageToFolder(
                                  originalBuffer,
                                  originalFileName,
                                  originalLocation,
                                );
                              saveResults.push({
                                type: 'original',
                                result: originalResult,
                              });

                              const metadataResult =
                                await window.electronAPI.saveImageToFolder(
                                  metadataBuffer,
                                  metadataFileName,
                                  metadataLocation,
                                );
                              saveResults.push({
                                type: 'metadata',
                                result: metadataResult,
                              });

                              // Save JSON metadata using the same API (it should handle any file type)
                              const jsonResult =
                                await window.electronAPI.saveImageToFolder(
                                  jsonBuffer,
                                  jsonFileName,
                                  jsonLocation,
                                );
                              saveResults.push({
                                type: 'json',
                                result: jsonResult,
                              });

                              // Log results
                              console.log(
                                '📸 [CAPTURE RESULTS] All files saved:',
                              );
                              saveResults.forEach(({ type, result }) => {
                                if (result.success) {
                                  console.log(
                                    `✅ ${type.toUpperCase()}: ${result.filePath}`,
                                  );
                                } else {
                                  console.error(
                                    `❌ ${type.toUpperCase()}: ${result.error}`,
                                  );
                                }
                              });

                              // Check if all saves were successful
                              const allSuccessful = saveResults.every(
                                ({ result }) => result.success,
                              );

                              if (!allSuccessful) {
                                const failedSaves = saveResults
                                  .filter(({ result }) => !result.success)
                                  .map(({ type }) => type)
                                  .join(', ');
                                throw new Error(
                                  `Failed to save: ${failedSaves}`,
                                );
                              }
                            } catch (saveError) {
                              console.error(
                                '📸 [CAPTURE ERROR] Save failed:',
                                saveError,
                              );
                              throw saveError;
                            }
                          } else {
                            // Fallback: download as usual (if not in Electron)
                            const url = window.URL.createObjectURL(resultBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = metadataFileName; // Use the metadata filename

                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          }

                          window.URL.revokeObjectURL(imageUrl);
                          imageResolve();
                        } catch (error) {
                          window.URL.revokeObjectURL(imageUrl);
                          imageReject(error);
                        }
                      } else {
                        imageReject(new Error('Failed to create image blob'));
                      }
                    },
                    'image/jpeg',
                    0.95,
                  );
                };

                image.onerror = () => {
                  window.URL.revokeObjectURL(imageUrl);
                  imageReject(new Error('Failed to load image'));
                };

                image.src = imageUrl;
              });

              resolve();
            } else {
              // Cloud mode: Upload to Firebase
              // Create FormData to send image and metadata
              const formData = new FormData();
              formData.append('image', blob, `capture_${Date.now()}.jpg`);
              formData.append('obstacle', 'false');
              formData.append('takenWith', 'websocket_capture');

              // Add current metadata if available
              if (displayData?.metadata) {
                const metadata = displayData.metadata;
                if (metadata.ultrasonic !== undefined)
                  formData.append('ultrasonic', metadata.ultrasonic.toString());
                if (metadata.heading !== undefined)
                  formData.append('heading', metadata.heading.toString());
                if (metadata.pitch !== undefined)
                  formData.append('pitch', metadata.pitch.toString());
                if (metadata.roll !== undefined)
                  formData.append('roll', metadata.roll.toString());
                if (metadata.yaw !== undefined)
                  formData.append('yaw', metadata.yaw.toString()); // Add distance data
                if (metadata.distanceTraveled !== undefined)
                  formData.append(
                    'distanceTraveled',
                    metadata.distanceTraveled.toString(),
                  );

                // Add velocity data
                if (metadata.velocity !== undefined)
                  formData.append('velocity', metadata.velocity.toString());
                if (metadata.velocityX !== undefined)
                  formData.append('velocityX', metadata.velocityX.toString());
                if (metadata.velocityY !== undefined)
                  formData.append('velocityY', metadata.velocityY.toString());

                // Add position data
                if (metadata.position) {
                  if (metadata.position.positionX !== undefined)
                    formData.append(
                      'positionX',
                      metadata.position.positionX.toString(),
                    );
                  if (metadata.position.positionY !== undefined)
                    formData.append(
                      'positionY',
                      metadata.position.positionY.toString(),
                    );
                }
              }

              const endpoint = `/api/monitoring/realtime?deviceName=${encodeURIComponent(selectedDevice!.deviceName)}`;

              // Post to monitoring/realtime endpoint
              const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save captured photo');
              }

              await response.json();
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        }),
        {
          loading: isLocalMode
            ? 'Capturing and saving photos...'
            : 'Capturing and saving photo...',
          success: isLocalMode
            ? `3 files captured and saved locally! (Original + Metadata + JSON)`
            : `Photo captured and saved for device: ${selectedDevice!.deviceName}!`,
          error: 'Failed to capture photo from stream.',
        },
      );
    } catch {
      // Photo capture failed silently
    }
  };

  // Auto obstacle photo capture handler - captures photo when obstacle detected
  const handleAutoObstaclePhoto = React.useCallback(
    async (ultrasonicValue: number, forceCapture = false) => {
      // Check if auto photo is enabled or force capture
      if (!autoPhotoEnabled && !forceCapture) return;

      // Check if obstacle detected (distance < threshold)
      const isObstacle = ultrasonicValue < OBSTACLE_THRESHOLD;
      if (!isObstacle && !forceCapture) return;

      // No interval check - capture immediately on every obstacle detection

      // Check if already capturing to prevent multiple simultaneous captures
      if (isCapturingObstaclePhoto) {
        console.log('🚨 [AUTO PHOTO] Skipping - already capturing');
        return;
      }

      // Check camera connection
      if (!cameraStreamRef.current?.isConnected) {
        console.log('🚨 [AUTO PHOTO] Skipping - camera not connected');
        return;
      }

      // Check if we have active monitoring session (local mode only)
      if (isLocalMode && !localCurrentSession) {
        console.log('🚨 [AUTO PHOTO] Skipping - no active monitoring session');
        return;
      }

      try {
        setIsCapturingObstaclePhoto(true);

        console.log(
          `🚨 [AUTO PHOTO] OBSTACLE DETECTED! Distance: ${ultrasonicValue.toFixed(2)}cm - Capturing photo...`,
        );
        console.log(
          '📸 [UI INDICATOR] Auto-capture indicator should now be visible!',
        );

        // Capture frame from camera stream
        const blob = await cameraStreamRef.current!.captureFrame();

        if (isLocalMode) {
          // Local mode: Use SAME LOGIC as manual take photo for consistency
          const image = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas context not available');
          }

          // Convert blob to image
          const imageUrl = window.URL.createObjectURL(blob);

          await new Promise<void>((imageResolve, imageReject) => {
            image.onload = () => {
              // Prepare metadata text with OBSTACLE WARNING
              const currentTime = new Date().toLocaleString();
              const deviceName = isLocalMode
                ? 'ESP32 (Local Mode)'
                : selectedDevice?.deviceName || 'Unknown Device';

              const metadataLines = [
                `🚨 OBSTACLE AUTO-CAPTURE - ${currentTime}`,
                `Device: ${deviceName}`,
              ];

              if (displayData?.metadata) {
                const metadata = displayData.metadata;
                metadataLines.push(
                  `⚠️ OBSTACLE: ${metadata.ultrasonic?.toFixed(2) || ultrasonicValue.toFixed(2)} cm`,
                  `Heading: ${metadata.heading?.toFixed(2) || 'N/A'}°`,
                  `Direction: ${metadata.direction || 'N/A'}`,
                );

                if (
                  metadata.pitch !== undefined ||
                  metadata.roll !== undefined ||
                  metadata.yaw !== undefined
                ) {
                  metadataLines.push(
                    `Pitch: ${metadata.pitch?.toFixed(2) || 'N/A'}°`,
                    `Roll: ${metadata.roll?.toFixed(2) || 'N/A'}°`,
                    `Yaw: ${metadata.yaw?.toFixed(2) || 'N/A'}°`,
                  );
                }

                if (
                  metadata.position?.positionX !== undefined ||
                  metadata.position?.positionY !== undefined
                ) {
                  metadataLines.push(
                    `Position X: ${metadata.position.positionX?.toFixed(2) || 'N/A'}`,
                    `Position Y: ${metadata.position.positionY?.toFixed(2) || 'N/A'}`,
                  );
                }

                if (
                  metadata.velocityX !== undefined ||
                  metadata.velocityY !== undefined
                ) {
                  metadataLines.push(
                    `Velocity X: ${metadata.velocityX?.toFixed(2) || 'N/A'} m/s`,
                    `Velocity Y: ${metadata.velocityY?.toFixed(2) || 'N/A'} m/s`,
                  );
                }
              }

              // Calculate dynamic height based on content (SAME as manual take photo)
              const originalWidth = image.width;
              const originalHeight = image.height;

              // Calculate required height for metadata
              const headerHeight = 60;
              const lineHeight = 18;
              const padding = 20;
              const footerHeight = 30;
              const sensorDataLines = metadataLines.length - 2; // Exclude timestamp and device name
              const columnsCount = Math.min(3, Math.ceil(originalWidth / 200)); // Dynamic columns based on width
              const itemsPerColumn = Math.ceil(sensorDataLines / columnsCount);
              const contentHeight =
                headerHeight +
                80 +
                itemsPerColumn * lineHeight +
                padding +
                footerHeight;

              const metadataHeight = Math.max(200, contentHeight); // Minimum 200px
              const totalWidth = originalWidth;
              const totalHeight = originalHeight + metadataHeight;

              // Set canvas size to accommodate both image and metadata
              canvas.width = totalWidth;
              canvas.height = totalHeight;

              // Fill background with OBSTACLE WARNING COLOR
              ctx.fillStyle = '#fef2f2'; // Light red background for obstacle warning
              ctx.fillRect(0, 0, totalWidth, totalHeight);

              // Draw the original image at the top
              ctx.drawImage(image, 0, 0, originalWidth, originalHeight);

              // Add a RED border around the image for obstacle warning
              ctx.strokeStyle = '#dc2626';
              ctx.lineWidth = 4;
              ctx.strokeRect(0, 0, originalWidth, originalHeight);

              // Draw metadata area background below the image
              const metadataY = originalHeight;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, metadataY, originalWidth, metadataHeight);

              // Add horizontal divider line
              ctx.strokeStyle = '#dc2626'; // Red divider for obstacle warning
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(0, metadataY);
              ctx.lineTo(originalWidth, metadataY);
              ctx.stroke();

              // Draw header section with OBSTACLE WARNING
              ctx.fillStyle = '#dc2626'; // Red header for obstacle
              ctx.fillRect(0, metadataY, originalWidth, headerHeight);

              // Draw RoboGo logo/title with obstacle warning
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 20px Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(
                '🚨 RoboGo AUTO-CAPTURE',
                originalWidth / 2,
                metadataY + 25,
              );
              ctx.font = '12px Arial, sans-serif';
              ctx.fillText(
                'Obstacle Detection Report',
                originalWidth / 2,
                metadataY + 45,
              );

              // Draw metadata content (SAME layout as manual take photo)
              ctx.fillStyle = '#374151';
              ctx.font = '14px Arial, sans-serif';
              ctx.textAlign = 'left';

              let currentY = metadataY + headerHeight + 20;
              const leftMargin = 20;
              const columnWidth = (originalWidth - 40) / columnsCount; // Dynamic columns

              metadataLines.forEach((line, index) => {
                if (index === 0) {
                  // Timestamp - full width
                  ctx.fillStyle = '#dc2626'; // Red for obstacle warning
                  ctx.font = 'bold 14px Arial, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(line, originalWidth / 2, currentY);
                  currentY += lineHeight + 10;

                  // Draw separator line
                  ctx.strokeStyle = '#e5e7eb';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(leftMargin, currentY - 5);
                  ctx.lineTo(originalWidth - leftMargin, currentY - 5);
                  ctx.stroke();
                  currentY += 10;
                } else if (index === 1) {
                  // Device name - full width
                  ctx.fillStyle = '#374151';
                  ctx.font = 'bold 14px, Arial, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(line, originalWidth / 2, currentY);
                  currentY += lineHeight + 15;

                  // Reset for column layout
                  currentY = metadataY + headerHeight + 80;
                  ctx.textAlign = 'left';
                } else {
                  // Sensor data in dynamic columns
                  const dataIndex = index - 2;
                  const currentColumn = Math.floor(dataIndex / itemsPerColumn);
                  const itemInColumn = dataIndex % itemsPerColumn;

                  const xPos = leftMargin + currentColumn * columnWidth;
                  const yPos = currentY + itemInColumn * lineHeight;
                  if (
                    currentColumn < columnsCount &&
                    yPos < metadataY + metadataHeight - footerHeight - 10
                  ) {
                    ctx.fillStyle = '#374151';
                    ctx.font = '12px Arial, sans-serif';
                    // Split label and value for better formatting
                    const [label, value] = line.split(': ');
                    const maxLabelWidth = columnWidth * 0.6; // 60% for label

                    // Truncate label if too long
                    let displayLabel = label;
                    ctx.fillStyle = '#374151';
                    ctx.font = '12px Arial, sans-serif';
                    if (
                      ctx.measureText(displayLabel + ':').width > maxLabelWidth
                    ) {
                      while (
                        ctx.measureText(displayLabel + '...').width >
                          maxLabelWidth &&
                        displayLabel.length > 3
                      ) {
                        displayLabel = displayLabel.slice(0, -1);
                      }
                      displayLabel += '...';
                    }

                    ctx.fillText(`${displayLabel}:`, xPos, yPos);

                    // Use RED color for obstacle values
                    ctx.fillStyle = line.includes('OBSTACLE')
                      ? '#dc2626'
                      : '#059669';
                    ctx.font = 'bold 12px Arial, sans-serif';
                    const labelWidth = ctx.measureText(
                      `${displayLabel}:`,
                    ).width;
                    ctx.fillText(value || 'N/A', xPos + labelWidth + 5, yPos);

                    ctx.fillStyle = '#374151';
                    ctx.font = '12px Arial, sans-serif';
                  }
                }
              });

              // Add footer with AUTO-CAPTURE branding (dynamic position)
              const footerY = totalHeight - footerHeight + 10;
              ctx.fillStyle = '#dc2626'; // Red footer for obstacle
              ctx.font = '10px Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(
                '🚨 AUTO-CAPTURED: OBSTACLE DETECTION SYSTEM',
                originalWidth / 2,
                footerY,
              );

              // Convert canvas to blob
              canvas.toBlob(
                async (resultBlob) => {
                  if (resultBlob) {
                    try {
                      // Generate filename with obstacle prefix (SAME naming as manual)
                      const now = new Date();
                      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
                      const timeStr = now
                        .toTimeString()
                        .split(' ')[0]
                        .replace(/:/g, '-'); // HH-MM-SS
                      const dateTime = `${dateStr}_${timeStr}`;
                      const deviceNameClean = isLocalMode
                        ? 'esp32_local'
                        : selectedDevice?.deviceName?.replace(
                            /[^a-zA-Z0-9]/g,
                            '_',
                          ) || 'unknown';

                      // SPECIAL filename for obstacle detection
                      const baseFileName = `robogo_OBSTACLE_${deviceNameClean}_${dateTime}_${ultrasonicValue.toFixed(2)}cm`;

                      // ENHANCED: Inject imageFileName into monitoring data for reports (SAME as manual)
                      // Also create monitoring data entry if needed to ensure auto-captured images appear in reports
                      if (localCurrentSession) {
                        console.log(
                          '📸 [AUTO PHOTO] Injecting imageFileName into monitoring data...',
                        );

                        // First inject into existing monitoring data
                        injectImageFileName(baseFileName);

                        // Also ensure we have at least one monitoring entry for this image
                        // This is critical for auto-captured images to appear in reports
                        setTimeout(() => {
                          setMonitoringData((prev) => {
                            const newData = { ...prev };
                            const timestamp = now.toISOString();

                            // Check if any monitoring data was updated with imageFileName
                            const hasUltrasonicWithImage =
                              newData.ultrasonic.some(
                                (item) => item.imageFileName === baseFileName,
                              );
                            const hasIMUWithImage = newData.imu.some(
                              (item) => item.imageFileName === baseFileName,
                            );
                            const hasPathsWithImage = newData.paths.some(
                              (item) => item.imageFileName === baseFileName,
                            );

                            console.log(
                              `📸 [AUTO PHOTO] Monitoring data check: ultrasonic=${hasUltrasonicWithImage}, imu=${hasIMUWithImage}, paths=${hasPathsWithImage}`,
                            );

                            // If no monitoring data has this imageFileName, create entries
                            if (
                              !hasUltrasonicWithImage &&
                              !hasIMUWithImage &&
                              !hasPathsWithImage
                            ) {
                              console.log(
                                '📸 [AUTO PHOTO] Creating monitoring entries for auto-captured image...',
                              );

                              // Create ultrasonic entry with obstacle data
                              const ultrasonicEntry: UltrasonicData = {
                                ultrasonic: ultrasonicValue,
                                timestamp,
                                imageFileName: baseFileName,
                              };
                              newData.ultrasonic.push(ultrasonicEntry);

                              // Create IMU entry with current sensor data
                              if (displayData?.metadata) {
                                const imuEntry: IMUData = {
                                  heading: displayData.metadata.heading || 0,
                                  pitch: displayData.metadata.pitch || 0,
                                  roll: displayData.metadata.roll || 0,
                                  yaw: displayData.metadata.yaw || 0,
                                  ultrasonic: ultrasonicValue,
                                  timestamp,
                                  imageFileName: baseFileName,
                                };
                                newData.imu.push(imuEntry);
                              }

                              // Create paths entry if position data available
                              if (
                                displayData?.metadata?.position ||
                                displayData?.metadata?.velocityX !==
                                  undefined ||
                                displayData?.metadata?.velocityY !== undefined
                              ) {
                                const pathsEntry: PathData = {
                                  timestamp,
                                  position: {
                                    positionX:
                                      displayData.metadata.position
                                        ?.positionX || 0,
                                    positionY:
                                      displayData.metadata.position
                                        ?.positionY || 0,
                                  },
                                  velocity: displayData.metadata.velocity || 0,
                                  heading: displayData.metadata.heading || 0,
                                  direction:
                                    displayData.metadata.direction || 'North',
                                  distanceTraveled:
                                    displayData.metadata.distanceTraveled || 0,
                                  ultrasonic: ultrasonicValue,
                                  imageFileName: baseFileName,
                                };
                                newData.paths.push(pathsEntry);
                              }

                              console.log(
                                '📸 [AUTO PHOTO] Created monitoring entries for auto-captured image:',
                                {
                                  ultrasonic: ultrasonicEntry,
                                  totalUltrasonic: newData.ultrasonic.length,
                                  totalIMU: newData.imu.length,
                                  totalPaths: newData.paths.length,
                                },
                              );
                            }

                            return newData;
                          });
                        }, 100); // Small delay to ensure injection completes first
                      }

                      // SAME file structure as manual take photo
                      const originalFileName = `${baseFileName}_original.jpg`;
                      const metadataFileName = `${baseFileName}_metadata.jpg`;
                      const jsonFileName = `${baseFileName}.json`;

                      // Check if running in Electron and save locally (SAME as manual)
                      if (
                        typeof window !== 'undefined' &&
                        window.electronAPI?.saveImageToFolder
                      ) {
                        // 1. Save original image (without metadata overlay)
                        const originalBuffer = new Uint8Array(
                          await blob.arrayBuffer(),
                        );

                        // 2. Save metadata-enhanced image (current resultBlob)
                        const metadataBuffer = new Uint8Array(
                          await resultBlob.arrayBuffer(),
                        );

                        // 3. Create and save metadata JSON file (SAME as manual)
                        const metadataJson = {
                          captureInfo: {
                            timestamp: now.toISOString(),
                            createdAt: baseFileName,
                            deviceName: deviceNameClean,
                            captureMode: 'auto_obstacle_detection', // Special mode
                            obstacleDistance: ultrasonicValue,
                            dangerLevel: 'HIGH',
                            originalFileName: originalFileName,
                            metadataFileName: metadataFileName,
                            jsonFileName: jsonFileName,
                          },
                          sensorData: displayData?.metadata || {},
                          obstacleInfo: {
                            detected: true,
                            distance: ultrasonicValue,
                            threshold: OBSTACLE_THRESHOLD,
                            autoCapture: true,
                          },
                          imageInfo: {
                            width: image.width,
                            height: image.height,
                            format: 'JPEG',
                            quality: 0.95,
                          },
                          session: {
                            sessionId: localCurrentSession || 'no-session',
                            sessionActive: !!localCurrentSession,
                          },
                        };

                        const jsonContent = JSON.stringify(
                          metadataJson,
                          null,
                          2,
                        );
                        const jsonBlob = new Blob([jsonContent], {
                          type: 'application/json',
                        });
                        const jsonBuffer = new Uint8Array(
                          await jsonBlob.arrayBuffer(),
                        );

                        const saveResults = [];

                        // IMPORTANT: Auto-captured images should ALWAYS go to reports/gallery
                        // (same as manual take photo) so they appear in gallery and reports
                        const baseLocation = 'reports/gallery';

                        // SAME organized subfolders as manual take photo
                        const originalLocation = `${baseLocation}/originals`;
                        const metadataLocation = `${baseLocation}/metadata`;
                        const jsonLocation = `${baseLocation}/json`;

                        try {
                          // Save all three files to SAME organized folders as manual
                          const originalResult =
                            await window.electronAPI.saveImageToFolder(
                              originalBuffer,
                              originalFileName,
                              originalLocation,
                            );
                          saveResults.push({
                            type: 'original',
                            result: originalResult,
                          });

                          const metadataResult =
                            await window.electronAPI.saveImageToFolder(
                              metadataBuffer,
                              metadataFileName,
                              metadataLocation,
                            );
                          saveResults.push({
                            type: 'metadata',
                            result: metadataResult,
                          });

                          // Save JSON metadata using the same API
                          const jsonResult =
                            await window.electronAPI.saveImageToFolder(
                              jsonBuffer,
                              jsonFileName,
                              jsonLocation,
                            );
                          saveResults.push({
                            type: 'json',
                            result: jsonResult,
                          });

                          // Log results
                          console.log(
                            '🚨 [AUTO PHOTO] All obstacle files saved to reports/gallery (same as manual photos):',
                          );
                          saveResults.forEach(({ type, result }) => {
                            if (result.success) {
                              console.log(
                                `✅ ${type.toUpperCase()}: ${result.filePath}`,
                              );
                            } else {
                              console.error(
                                `❌ ${type.toUpperCase()}: ${result.error}`,
                              );
                            }
                          });

                          // Check if all saves were successful
                          const allSuccessful = saveResults.every(
                            ({ result }) => result.success,
                          );

                          if (!allSuccessful) {
                            const failedSaves = saveResults
                              .filter(({ result }) => !result.success)
                              .map(({ type }) => type)
                              .join(', ');
                            throw new Error(`Failed to save: ${failedSaves}`);
                          }

                          console.log(
                            `🚨 [AUTO PHOTO] Obstacle photo saved to reports/gallery: ${baseFileName}`,
                          );
                        } catch (saveError) {
                          console.error(
                            '🚨 [AUTO PHOTO] Save failed:',
                            saveError,
                          );
                          throw saveError;
                        }
                      } else {
                        // Fallback: download as usual (if not in Electron)
                        const url = window.URL.createObjectURL(resultBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = metadataFileName; // Use the metadata filename

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      }

                      window.URL.revokeObjectURL(imageUrl);
                      imageResolve();
                    } catch (error) {
                      window.URL.revokeObjectURL(imageUrl);
                      imageReject(error);
                    }
                  } else {
                    imageReject(
                      new Error('Failed to create obstacle image blob'),
                    );
                  }
                },
                'image/jpeg',
                0.95,
              );
            };

            image.onerror = () => {
              window.URL.revokeObjectURL(imageUrl);
              imageReject(new Error('Failed to load image'));
            };

            image.src = imageUrl;
          });
        } else {
          // Cloud mode: Upload with obstacle flag
          const formData = new FormData();
          formData.append('image', blob, `obstacle_capture_${Date.now()}.jpg`);
          formData.append('obstacle', 'true'); // Mark as obstacle detection
          formData.append('takenWith', 'auto_obstacle_detection');
          formData.append('ultrasonicDistance', ultrasonicValue.toString());

          // Add current metadata if available
          if (displayData?.metadata) {
            const metadata = displayData.metadata;
            if (metadata.ultrasonic !== undefined)
              formData.append('ultrasonic', metadata.ultrasonic.toString());
            if (metadata.heading !== undefined)
              formData.append('heading', metadata.heading.toString());
            if (metadata.pitch !== undefined)
              formData.append('pitch', metadata.pitch.toString());
            if (metadata.roll !== undefined)
              formData.append('roll', metadata.roll.toString());
            if (metadata.yaw !== undefined)
              formData.append('yaw', metadata.yaw.toString());

            // Add distance data
            if (metadata.distanceTraveled !== undefined)
              formData.append(
                'distanceTraveled',
                metadata.distanceTraveled.toString(),
              );

            // Add velocity data
            if (metadata.velocity !== undefined)
              formData.append('velocity', metadata.velocity.toString());
            if (metadata.velocityX !== undefined)
              formData.append('velocityX', metadata.velocityX.toString());
            if (metadata.velocityY !== undefined)
              formData.append('velocityY', metadata.velocityY.toString());

            // Add position data
            if (metadata.position) {
              if (metadata.position.positionX !== undefined)
                formData.append(
                  'positionX',
                  metadata.position.positionX.toString(),
                );
              if (metadata.position.positionY !== undefined)
                formData.append(
                  'positionY',
                  metadata.position.positionY.toString(),
                );
            }
          }

          const endpoint = `/api/monitoring/realtime?deviceName=${encodeURIComponent(selectedDevice!.deviceName)}`;

          // Post to monitoring/realtime endpoint
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to save obstacle photo');
          }

          await response.json();
          console.log(
            `🚨 [AUTO PHOTO] Obstacle photo uploaded to cloud: ${ultrasonicValue.toFixed(2)}cm`,
          );
        }
      } catch (error) {
        console.error('🚨 [AUTO PHOTO] Error capturing obstacle photo:', error);
      } finally {
        setIsCapturingObstaclePhoto(false);
        console.log(
          '📸 [UI INDICATOR] Auto-capture indicator should now be hidden!',
        );
      }
    },
    [
      autoPhotoEnabled,
      isLocalMode,
      localCurrentSession,
      OBSTACLE_THRESHOLD,
      isCapturingObstaclePhoto,
      displayData,
      selectedDevice,
      injectImageFileName,
    ],
  );

  const listButtons = [
    {
      icon:
        recordingState === 'idle'
          ? 'fluent:video-recording-20-filled'
          : 'fluent:stop-24-filled',
      text: recordingState === 'idle' ? 'Start Recording' : 'Stop Recording',
      onClick: handleRecordClick,
    },
    {
      icon: 'mingcute:camera-2-ai-fill',
      text: 'Take Photo',
      onClick: handleTakePhoto,
    },
    {
      icon: 'tabler:flip-vertical',
      text: 'Flip Camera',
      onClick: handleToggleFlip,
    },
    // Removed Auto Photo Toggle - now in settings modal
    // ...(isLocalMode
    //   ? [
    //       {
    //         icon: 'mingcute:download-fill',
    //         text: 'Export Logs',
    //         onClick: handleExportLogs,
    //       },
    //     ]
    //   : []),
  ];

  return (
    <div className='flex flex-col items-center justify-start w-full gap-4 h-full'>
      {' '}
      {/* Camera Stream */}
      <div
        className={`relative w-full flex-1 rounded-xl overflow-hidden border-2 ${
          isDark ? 'border-[#113541] bg-[#0F1B2B]' : 'border-[#ECECEC] bg-white'
        }`}
      >
        <StableCameraStream
          ref={cameraStreamRef}
          metadata={displayData?.metadata}
          isLocalMode={isLocalMode}
          autoPhotoEnabled={autoPhotoEnabled}
          onAutoPhotoToggle={onAutoPhotoToggle}
          isCapturingObstaclePhoto={isCapturingObstaclePhoto}
        />
      </div>{' '}
      {/* Stats and monitoring data display */}
      {(() => {
        const shouldShowStats =
          // Show stats if we have monitoring session active OR if we have data
          (effectiveCurrentSession && effectiveCurrentSession > 0) ||
          (dataMonitoring && dataMonitoring.length > 0 && latestData);

        return shouldShowStats ? (
          <div className='flex flex-col gap-4 items-stretch w-full h-fit'>
            <StatCardList
              variant='velocity'
              infoItems={
                displayData?.metadata
                  ? [
                      {
                        title: 'Velocity Total',
                        value:
                          (displayData.metadata?.velocity ?? 0) > 0
                            ? `${displayData.metadata.velocity!.toFixed(2)} m/s`
                            : '-',
                      },
                      {
                        title: 'Velocity X',
                        value:
                          (displayData.metadata?.velocityX ?? 0) !== 0
                            ? `${displayData.metadata.velocityX!.toFixed(2)} m/s`
                            : '-',
                      },
                      {
                        title: 'Velocity Y',
                        value:
                          (displayData.metadata?.velocityY ?? 0) !== 0
                            ? `${displayData.metadata.velocityY!.toFixed(2)} m/s`
                            : '-',
                      },
                    ]
                  : []
              }
            />
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed ${
              isDark
                ? 'border-gray-600 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            <Icon
              icon='mdi:chart-line-variant'
              width={32}
              height={32}
              className='mb-2'
            />
            <p className='text-sm'>No monitoring data available</p>
            <p className='text-xs'>Start monitoring to see real-time stats</p>
          </div>
        );
      })()}
      {/* Control buttons - always visible */}
      <div className='flex flex-col w-full gap-4'>
        <div className='flex flex-col w-full gap-2.5'>
          {' '}
          <div className='grid grid-cols-2 md:grid-cols-6 gap-2.5 w-full h-fit'>
            {' '}
            <button
              onClick={handleStartMonitoring}
              disabled={
                !!effectiveCurrentSession && effectiveCurrentSession > 0
              }
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white col-span-1 md:col-span-3 ${!!effectiveCurrentSession && effectiveCurrentSession > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon icon='mingcute:play-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Start Monitoring
              </p>
            </button>{' '}
            <button
              onClick={handleStopMonitoring}
              disabled={
                !effectiveCurrentSession || effectiveCurrentSession === 0
              }
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl col-span-1 md:col-span-3 ${effectiveCurrentSession && effectiveCurrentSession > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-400 text-white opacity-50 cursor-not-allowed'}`}
            >
              <Icon icon='mingcute:stop-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Stop Monitoring
              </p>
            </button>{' '}
            {listButtons.map((item, index) => {
              // Define column spans for grid-cols-20
              const getColSpan = () => {
                // Now we have 3 buttons total: Take Photo, Flip Camera
                return 'col-span-1 md:col-span-2'; // 3 buttons: 6+7+7 = 20 (approximately equal distribution)
              };

              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl ${getColSpan()} ${
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
                    {item.text}
                  </p>
                  <Icon
                    icon={item.icon}
                    width={20}
                    height={20}
                    className={isDark ? 'text-blue-500' : 'text-[#39A9F9]'}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Stop Monitoring Result */}
      <AnimatePresence>
        {stopResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='w-full'
          >
            <StopMonitoringResult result={stopResult!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}