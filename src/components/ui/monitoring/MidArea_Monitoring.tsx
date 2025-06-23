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
}

export default function MidArea_Monitoring({
  dataMonitoring,
  currentSession = 0,
  isLocalMode = false,
  isConnected = false,
  serialBuffer = '',
  liveSerialData = null,
}: MidAreaMonitoringProps) {
  const { isDark } = useDarkMode();
  const { promise } = useToast();
  const { selectedDevice } = useUserConfig();
  const { stopResult, setStopResult } = useStopMonitoringResult();
  // Ref for camera stream
  const cameraStreamRef = useRef<StableCameraStreamRef>(null);
  // States for monitoring controls
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>(
    'idle',
  );
  // Local mode session management
  const [localCurrentSession, setLocalCurrentSession] = useState<number | null>(
    null,
  );

  // Latest monitoring data for StableCameraStream
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

  // Determine the effective current session (use localCurrentSession in local mode, currentSession in online mode)
  const effectiveCurrentSession = isLocalMode
    ? localCurrentSession
    : currentSession;

  // Start monitoring handler
  const handleStartMonitoring = async () => {
    if (isLocalMode) {
      // Local mode: Create monitoring session folder
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
                // Generate new session ID
                const newSessionId = Date.now(); // Create monitoring session folder
                const sessionFolder = `monitoring/${newSessionId}`;
                const result =
                  await window.electronAPI.createFolder(sessionFolder);
                if (result.success) {
                  // Store current session for photo capture
                  setLocalCurrentSession(newSessionId);
                  console.log(`Monitoring session ${newSessionId} started`);
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
            loading: 'Starting local monitoring...',
            success: 'Local monitoring started successfully!',
            error: 'Failed to start local monitoring.',
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
  };
  // Stop monitoring handler
  const handleStopMonitoring = async () => {
    if (isLocalMode) {
      // Local mode: Clean up session
      try {
        await promise(
          new Promise<void>((resolve) => {
            // Clear current session
            setLocalCurrentSession(null);
            console.log('Local monitoring session stopped');
            resolve();
          }),
          {
            loading: 'Stopping local monitoring...',
            success: 'Local monitoring stopped successfully!',
            error: 'Failed to stop local monitoring.',
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
                          // Generate filename with timestamp and metadata
                          const timestamp = new Date()
                            .toLocaleString()
                            .replace(/[\/:\s]/g, '-')
                            .replace(/,/g, '');
                          const deviceNameClean = isLocalMode
                            ? 'esp32_local'
                            : selectedDevice?.deviceName?.replace(
                                /[^a-zA-Z0-9]/g,
                                '_',
                              ) || 'unknown';

                          // Add sensor data to filename if available
                          let metadataInfo = '';
                          if (displayData?.metadata) {
                            const metadata = displayData.metadata;
                            metadataInfo = `_U${metadata.ultrasonic?.toFixed(0) || 'NA'}_H${metadata.heading?.toFixed(0) || 'NA'}`;
                          }

                          // Base filename without extension
                          const baseFileName = `robogo_capture_${deviceNameClean}_${timestamp}${metadataInfo}`;

                          // Different filenames for each type
                          const originalFileName = `${baseFileName}_original.jpg`;
                          const metadataFileName = `${baseFileName}.jpg`;
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
                            );

                            // 3. Create and save metadata JSON file
                            const metadataJson = {
                              captureInfo: {
                                timestamp: new Date().toISOString(),
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

                            const saveResults = [];

                            // Determine save location based on session
                            const saveLocation = localCurrentSession
                              ? `monitoring/${localCurrentSession}`
                              : 'images';

                            try {
                              // Save all three files
                              const originalResult =
                                await window.electronAPI.saveImageToFolder(
                                  originalBuffer,
                                  originalFileName,
                                  saveLocation,
                                );
                              saveResults.push({
                                type: 'original',
                                result: originalResult,
                              });

                              const metadataResult =
                                await window.electronAPI.saveImageToFolder(
                                  metadataBuffer,
                                  metadataFileName,
                                  saveLocation,
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
                                  saveLocation,
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
  // Recalibrate IMU handler
  const handleRecalibrateIMU = async () => {
    if (isLocalMode) {
      // In local mode, IMU calibration is not available through API
      await promise(Promise.resolve(), {
        loading: 'Calibrating...',
        success: 'IMU calibration request sent to ESP32!',
        error: 'Failed to calibrate IMU.',
      });
      return;
    }

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
  // Export logs handler for local mode
  const handleExportLogs = async () => {
    if (!isLocalMode) {
      await promise(
        Promise.reject(new Error('Export only available in local mode')),
        {
          loading: 'Exporting logs...',
          success: 'Logs exported!',
          error: 'Export only available in local mode.',
        },
      );
      return;
    }

    try {
      await promise(
        new Promise<void>((resolve, reject) => {
          try {
            // Helper function to create table format
            const createTable = (headers: string[], rows: string[][]) => {
              const colWidths = headers.map((header, index) =>
                Math.max(
                  header.length,
                  ...rows.map((row) => (row[index] || '').toString().length),
                ),
              );

              const separator =
                '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+\n';

              let table = separator;

              // Header row
              table +=
                '|' +
                headers
                  .map(
                    (header, index) => ` ${header.padEnd(colWidths[index])} `,
                  )
                  .join('|') +
                '|\n';

              table += separator;

              // Data rows
              rows.forEach((row) => {
                table +=
                  '|' +
                  row
                    .map(
                      (cell, index) =>
                        ` ${(cell || '').toString().padEnd(colWidths[index])} `,
                    )
                    .join('|') +
                  '|\n';
              });

              table += separator;
              return table;
            };

            // Create formatted log content
            let logContent = ''; // Add header
            logContent += `RoboGo Sensor Data Export\n`;
            logContent += `${'='.repeat(60)}\n`;
            logContent += `Export Date: ${new Date().toLocaleString()}\n`;
            logContent += `Device: ${selectedDevice?.deviceName || 'ESP32 (Local Mode)'}\n`;
            logContent += `Mode: Local Mode\n`;
            logContent += `${'='.repeat(60)}\n\n`;
            // Process serial buffer data if available
            if (serialBuffer && serialBuffer.trim().length > 0) {
              const lines = serialBuffer
                .trim()
                .split('\n')
                .filter((line) => line.trim());

              // Parse and create structured data table from JSON lines
              const structuredData: Array<{
                timestamp: string;
                ultrasonic?: number;
                heading?: number;
                direction?: string;
                pitch?: number;
                roll?: number;
                yaw?: number;
                positionX?: number;
                positionY?: number;
                velocityX?: number;
                velocityY?: number;
                distX?: number;
                distY?: number;
              }> = [];
              lines.forEach((line) => {
                try {
                  let jsonString = line.trim();

                  const debugPrefix = '[DEBUG] Forwarding JSON to UART2:';

                  if (jsonString.includes(debugPrefix)) {
                    const jsonStartIndex =
                      jsonString.indexOf(debugPrefix) + debugPrefix.length;
                    jsonString = jsonString.substring(jsonStartIndex).trim();
                  }

                  const parsedData = JSON.parse(jsonString);
                  if (
                    parsedData &&
                    (parsedData.ultrasonic !== undefined ||
                      parsedData.heading !== undefined)
                  ) {
                    // Use original timestamp from the parsed data
                    let entryTimestamp: string;

                    if (parsedData.receivedAt) {
                      // Use receivedAt timestamp if available
                      entryTimestamp = new Date(
                        parsedData.receivedAt,
                      ).toLocaleString();
                    } else if (parsedData.timestamp) {
                      // Use timestamp field if available
                      entryTimestamp = new Date(
                        parsedData.timestamp,
                      ).toLocaleString();
                    } else {
                      // If no timestamp in data, use 'No timestamp'
                      entryTimestamp = 'No timestamp';
                    }

                    structuredData.push({
                      timestamp: entryTimestamp,
                      ultrasonic: parsedData.ultrasonic,
                      heading: parsedData.heading,
                      direction: parsedData.direction,
                      pitch: parsedData.pitch,
                      roll: parsedData.roll,
                      yaw: parsedData.yaw,
                      positionX: parsedData.positionX,
                      positionY: parsedData.positionY,
                      velocityX: parsedData.velocityX,
                      velocityY: parsedData.velocityY,
                      distX: parsedData.distX,
                      distY: parsedData.distY,
                    });
                  }
                } catch {
                  // Ignore non-JSON lines
                }
              });

              // Create structured sensor data table if parsed data is available
              if (structuredData.length > 0) {
                logContent += `SENSOR DATA TABLE\n`;
                logContent += `${'-'.repeat(40)}\n`;
                logContent += `Total Sensor Records: ${structuredData.length}\n\n`;

                const sensorHeaders = [
                  'No',
                  'Timestamp',
                  'Ultrasonic (cm)',
                  'Heading (°)',
                  'Direction',
                  'Pitch (°)',
                  'Roll (°)',
                  'Yaw (°)',
                  'Position X',
                  'Position Y',
                  'Velocity X',
                  'Velocity Y',
                  'Dist X',
                  'Dist Y',
                ];

                const sensorRows = structuredData.map((data, index) => [
                  (index + 1).toString(),
                  data.timestamp,
                  data.ultrasonic?.toFixed(2) || 'N/A',
                  data.heading?.toFixed(2) || 'N/A',
                  data.direction || 'N/A',
                  data.pitch?.toFixed(2) || 'N/A',
                  data.roll?.toFixed(2) || 'N/A',
                  data.yaw?.toFixed(2) || 'N/A',
                  data.positionX?.toFixed(2) || 'N/A',
                  data.positionY?.toFixed(2) || 'N/A',
                  data.velocityX?.toFixed(2) || 'N/A',
                  data.velocityY?.toFixed(2) || 'N/A',
                  data.distX?.toFixed(2) || 'N/A',
                  data.distY?.toFixed(2) || 'N/A',
                ]);

                logContent += createTable(sensorHeaders, sensorRows);
                logContent += '\n';
              } else {
                logContent += `NO STRUCTURED SENSOR DATA AVAILABLE\n`;
                logContent += `${'-'.repeat(40)}\n`;
                logContent += `No valid JSON sensor data found in serial buffer.\n`;
                logContent += `Make sure the device is sending structured data.\n\n`;
              }
            } else {
              logContent += `NO SERIAL LOGS AVAILABLE\n`;
              logContent += `${'-'.repeat(40)}\n`;
              logContent += `The serial buffer is empty. Make sure the device is connected\n`;
              logContent += `and generating data before exporting logs.\n\n`;
            }

            // Add current live data summary if available
            if (liveSerialData) {
              logContent += `CURRENT LIVE DATA SUMMARY\n`;
              logContent += `${'-'.repeat(40)}\n\n`;

              const liveHeaders = ['Sensor', 'Value', 'Unit'];
              const liveRows = [
                [
                  'Ultrasonic',
                  liveSerialData.ultrasonic?.toFixed(2) || 'N/A',
                  'cm',
                ],
                ['Heading', liveSerialData.heading?.toFixed(2) || 'N/A', '°'],
                ['Direction', liveSerialData.direction || 'N/A', ''],
                ['Pitch', liveSerialData.pitch?.toFixed(2) || 'N/A', '°'],
                ['Roll', liveSerialData.roll?.toFixed(2) || 'N/A', '°'],
                ['Yaw', liveSerialData.yaw?.toFixed(2) || 'N/A', '°'],
                [
                  'Position X',
                  liveSerialData.position?.positionX?.toFixed(2) || 'N/A',
                  '',
                ],
                [
                  'Position Y',
                  liveSerialData.position?.positionY?.toFixed(2) || 'N/A',
                  '',
                ],
                [
                  'Velocity Total',
                  liveSerialData.velocity?.toFixed(2) || 'N/A',
                  'm/s',
                ],
                [
                  'Distance Total',
                  liveSerialData.distanceTraveled?.toFixed(2) || 'N/A',
                  'cm',
                ],
              ];

              logContent += createTable(liveHeaders, liveRows);
              logContent += '\n';
            }

            // Add export footer
            logContent += `\n${'='.repeat(60)}\n`;
            logContent += `Export completed at: ${new Date().toLocaleString()}\n`;
            logContent += `Generated by: RoboGo Dashboard v1.0\n`;
            logContent += `${'='.repeat(60)}\n`;

            // Create and download the file
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; // Generate filename with timestamp
            const timestamp = new Date()
              .toLocaleString()
              .replace(/[\/:\s]/g, '-')
              .replace(/,/g, '');
            const deviceName =
              selectedDevice?.deviceName?.replace(/[^a-zA-Z0-9]/g, '_') ||
              'esp32_local';
            link.download = `robogo_sensor_data_${deviceName}_${timestamp}.txt`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        {
          loading: 'Exporting logs...',
          success: 'Logs exported successfully!',
          error: 'Failed to export logs.',
        },
      );
    } catch (error) {
      console.error('Error during log export:', error);
    }
  };
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
      icon: 'mynaui:chip-solid',
      text: 'Recalibrate IMU',
      onClick: handleRecalibrateIMU,
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
    // Only show Export Logs button in local mode
    ...(isLocalMode
      ? [
          {
            icon: 'mingcute:download-fill',
            text: 'Export Logs',
            onClick: handleExportLogs,
          },
        ]
      : []),
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
        />
      </div>
      {/* Stats and monitoring data display */}{' '}
      {(() => {
        const shouldShowStats =
          // Show stats if we have monitoring session active OR if we have data
          (effectiveCurrentSession && effectiveCurrentSession > 0) ||
          (dataMonitoring && dataMonitoring.length > 0 && latestData);

        return shouldShowStats;
      })() ? (
        <div className='flex flex-col gap-4 items-stretch w-full h-fit'>
          <StatCardList
            variant='velocity'
            infoItems={
              displayData?.metadata
                ? [
                    {
                      title: 'Velocity Total',
                      value:
                        displayData.metadata.velocity != null
                          ? `${displayData.metadata.velocity.toFixed(2)} m/s`
                          : '-',
                    },
                    {
                      title: 'Velocity X',
                      value:
                        displayData.metadata.velocityX != null
                          ? `${displayData.metadata.velocityX.toFixed(2)} m/s`
                          : '-',
                    },
                    {
                      title: 'Velocity Y',
                      value:
                        displayData.metadata.velocityY != null
                          ? `${displayData.metadata.velocityY.toFixed(2)} m/s`
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
          />{' '}
          <p className='text-sm'>No monitoring data available</p>
          <p className='text-xs'>Start monitoring to see real-time stats</p>
        </div>
      )}
      {/* Control buttons - always visible */}
      <div className='flex flex-col w-full gap-4'>
        <div className='flex flex-col w-full gap-2.5'>
          {' '}
          <div className='grid grid-cols-2 md:grid-cols-20 gap-2.5 w-full h-fit'>
            {' '}
            <button
              onClick={handleStartMonitoring}
              disabled={
                !!effectiveCurrentSession && effectiveCurrentSession > 0
              }
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white col-span-1 md:col-span-10 ${!!effectiveCurrentSession && effectiveCurrentSession > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl col-span-1 md:col-span-10 ${effectiveCurrentSession && effectiveCurrentSession > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-400 text-white opacity-50 cursor-not-allowed'}`}
            >
              <Icon icon='mingcute:stop-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Stop Monitoring
              </p>
            </button>{' '}
            {listButtons.map((item, index) => {
              // Define column spans for grid-cols-20
              const getColSpan = () => {
                if (isLocalMode) {
                  return 'col-span-1 md:col-span-4'; // 5 buttons: 4+4+4+4+4 = 20
                } else {
                  return 'col-span-1 md:col-span-5'; // 4 buttons: 5+5+5+5 = 20
                }
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
            <StopMonitoringResult result={stopResult} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
