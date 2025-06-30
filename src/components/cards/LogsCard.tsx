"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { useDarkMode } from '@/context/DarkModeContext';
import { useLocalMode } from '@/hooks/useLocalMode';

const convertTimestampToTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleTimeString('en-US', options);
};

// Function to parse ESP32 human-readable format data
const parseESP32HumanReadableFormat = (
  data: string,
  receivedTimestamp?: number, // Add receive timestamp parameter
): Record<string, unknown> | null => {
  try {
    console.log(
      '[LogsCard] parseESP32HumanReadableFormat - Input data length:',
      data.length,
    );
    console.log(
      '[LogsCard] parseESP32HumanReadableFormat - First 300 chars:',
      data.substring(0, 300),
    );

    const result: Record<string, unknown> = {};
    let validFieldCount = 0;

    // Handle both single line and multi-line formats
    // If data contains multiple complete blocks, process the entire data
    let processData = data;

    // If this looks like a multi-line ESP32 block, extract it properly
    if (data.includes('====') && data.includes('ESP32')) {
      // Find the most recent complete block
      const blocks = data.split('====================================');
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].trim() && blocks[i].includes('ESP32')) {
          processData = blocks[i];
          console.log(
            '[LogsCard] Extracted ESP32 block from position',
            i,
            ':',
            processData.substring(0, 200),
          );
          break;
        }
      }
    }

    // Split into lines and process each line
    const lines = processData
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    console.log(
      '[LogsCard] parseESP32HumanReadableFormat - Processing',
      lines.length,
      'lines',
    );

    for (const line of lines) {
      console.log('[LogsCard] Processing line:', line);

      // Skip header/footer lines but log them
      if (
        line.includes('====') ||
        line.includes('ESP32') ||
        line.includes('Sensor Data')
      ) {
        console.log('[LogsCard] Skipping header/footer:', line);
        continue;
      } // Parse timestamp: Timestamp: 1699123456789 or Timestamp: 1699123456789 ms
      const timestampMatch = line.match(/Timestamp:\s*(\d+)(?:\s*ms)?/);
      if (timestampMatch) {
        const parsedTimestamp = parseInt(timestampMatch[1]);
        // Validate timestamp - should be a reasonable timestamp (after year 2000 and before far future)
        // Accept both seconds (10-11 digits) and milliseconds (13 digits) format
        if (
          (parsedTimestamp > 946684800 && parsedTimestamp < 4102444800) || // Seconds: 2000-2100
          (parsedTimestamp > 946684800000 && parsedTimestamp < 4102444800000) // Milliseconds: 2000-2100
        ) {
          result.timestamp = parsedTimestamp;
          validFieldCount++;
          console.log(
            '[LogsCard] Parsed valid ESP32 timestamp:',
            result.timestamp,
          );
        } else {
          console.log(
            '[LogsCard] Invalid ESP32 timestamp detected, ignoring:',
            parsedTimestamp,
          );
        }
        continue;
      }

      // Parse acceleration data: Accel (bias-corr g): X=0.020 Y=-0.013 Z=1.030
      // Also match: Accel (bias-corr g): X=-0.000 Y=0.008 Z=1.003
      const accelMatch = line.match(
        /Accel.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
      );
      if (accelMatch) {
        result.accelX = parseFloat(accelMatch[1]);
        result.accelY = parseFloat(accelMatch[2]);
        result.accelZ = parseFloat(accelMatch[3]);
        validFieldCount += 3;
        console.log('[LogsCard] Parsed acceleration:', {
          x: result.accelX,
          y: result.accelY,
          z: result.accelZ,
        });
        continue;
      }

      // Parse gyro data: Gyro (bias-corr dps): X=-0.146 Y=0.073 Z=-0.293
      const gyroMatch = line.match(
        /Gyro.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
      );
      if (gyroMatch) {
        result.gyroX = parseFloat(gyroMatch[1]);
        result.gyroY = parseFloat(gyroMatch[2]);
        result.gyroZ = parseFloat(gyroMatch[3]);
        validFieldCount += 3;
        console.log('[LogsCard] Parsed gyro:', {
          x: result.gyroX,
          y: result.gyroY,
          z: result.gyroZ,
        });
        continue;
      }

      // Parse magnetometer data: Mag (bias-corr µT): X=16.5 Y=-23.1 Z=-49.5
      const magMatch = line.match(
        /Mag.*?X=([-\d.]+)(?:\s+|,\s*)Y=([-\d.]+)(?:\s+|,\s*)Z=([-\d.]+)/,
      );
      if (magMatch) {
        result.magX = parseFloat(magMatch[1]);
        result.magY = parseFloat(magMatch[2]);
        result.magZ = parseFloat(magMatch[3]);
        validFieldCount += 3;
        console.log('[LogsCard] Parsed magnetometer:', {
          x: result.magX,
          y: result.magY,
          z: result.magZ,
        });
        continue;
      }

      // Parse combined pitch, roll, yaw: Pitch: 0.46 °, Roll: 0.00 °, Yaw: 276.79 °
      const combinedOrientationMatch = line.match(
        /Pitch:\s*([-\d.]+)\s*°.*?Roll:\s*([-\d.]+)\s*°.*?Yaw:\s*([-\d.]+)\s*°/,
      );
      if (combinedOrientationMatch) {
        result.pitch = parseFloat(combinedOrientationMatch[1]);
        result.roll = parseFloat(combinedOrientationMatch[2]);
        result.yaw = parseFloat(combinedOrientationMatch[3]);
        validFieldCount += 3;
        console.log('[LogsCard] Parsed combined orientation:', {
          pitch: result.pitch,
          roll: result.roll,
          yaw: result.yaw,
        });
        continue;
      }

      // Parse separate pitch and roll: Pitch: -0.75° Roll: -1.09°
      const pitchRollMatch = line.match(
        /Pitch:\s*([-\d.]+)°\s+Roll:\s*([-\d.]+)°/,
      );
      if (pitchRollMatch) {
        result.pitch = parseFloat(pitchRollMatch[1]);
        result.roll = parseFloat(pitchRollMatch[2]);
        validFieldCount += 2;
        console.log('[LogsCard] Parsed pitch/roll:', {
          pitch: result.pitch,
          roll: result.roll,
        });
        continue;
      }

      // Parse separate yaw: Yaw: 276.79°
      const yawMatch = line.match(/Yaw:\s*([-\d.]+)°/);
      if (yawMatch) {
        result.yaw = parseFloat(yawMatch[1]);
        validFieldCount++;
        console.log('[LogsCard] Parsed yaw:', result.yaw);
        continue;
      }

      // Parse heading: Heading: 276.79 ° (West)
      const headingMatch = line.match(/Heading:\s*([-\d.]+)\s*°\s*\((\w+)\)/);
      if (headingMatch) {
        result.heading = parseFloat(headingMatch[1]);
        result.direction = headingMatch[2];
        validFieldCount += 2;
        console.log(
          '[LogsCard] Parsed heading:',
          result.heading,
          result.direction,
        );
        continue;
      }

      // Parse ultrasonic: Ultrasonic Distance: 3.52 cm
      const ultrasonicMatch = line.match(
        /Ultrasonic Distance:\s*([-\d.]+)\s*cm/,
      );
      if (ultrasonicMatch) {
        result.ultrasonic = parseFloat(ultrasonicMatch[1]);
        validFieldCount++;
        console.log('[LogsCard] Parsed ultrasonic:', result.ultrasonic);
        continue;
      }

      // Parse obstacle: Obstacle Detected: YES/NO
      const obstacleMatch = line.match(/Obstacle Detected:\s*(YES|NO)/);
      if (obstacleMatch) {
        result.obstacle = obstacleMatch[1] === 'YES';
        validFieldCount++;
        console.log('[LogsCard] Parsed obstacle:', result.obstacle);
        continue;
      }

      // Parse position: Current Pos (KF Displacement): (-3802951.25, -2584435.75) cm
      const positionMatch = line.match(
        /Current Pos.*?\(([-\d.]+),\s*([-\d.]+)\)\s*cm/,
      );
      if (positionMatch) {
        result.positionX = parseFloat(positionMatch[1]);
        result.positionY = parseFloat(positionMatch[2]);
        validFieldCount += 2;
        console.log('[LogsCard] Parsed position:', {
          x: result.positionX,
          y: result.positionY,
        });
        continue;
      }

      // Parse velocity: Velocity (KF): 26807.59 cm/s (Vx=-19318.75, Vy=-18585.83)
      const velocityMatch = line.match(
        /Velocity.*?:\s*([-\d.]+)\s*cm\/s.*?Vx=([-\d.]+),\s*Vy=([-\d.]+)/,
      );
      if (velocityMatch) {
        result.velocity = parseFloat(velocityMatch[1]);
        result.velocityX = parseFloat(velocityMatch[2]);
        result.velocityY = parseFloat(velocityMatch[3]);
        validFieldCount += 3;
        console.log('[LogsCard] Parsed velocity:', {
          total: result.velocity,
          x: result.velocityX,
          y: result.velocityY,
        });
        continue;
      }

      // Parse distance traveled: Total Distance Traveled (KF): 4752065.50 cm
      const distanceTraveledMatch = line.match(
        /Total Distance Traveled.*?:\s*([-\d.]+)\s*cm/,
      );
      if (distanceTraveledMatch) {
        result.distanceTraveled = parseFloat(distanceTraveledMatch[1]);
        validFieldCount++;
        console.log(
          '[LogsCard] Parsed distance traveled:',
          result.distanceTraveled,
        );
        continue;
      }

      // Parse rotation rate: Rotation Rate: 1.24 dps
      const rotationRateMatch = line.match(/Rotation Rate:\s*([-\d.]+)\s*dps/);
      if (rotationRateMatch) {
        result.rotationRate = parseFloat(rotationRateMatch[1]);
        validFieldCount++;
        console.log('[LogsCard] Parsed rotation rate:', result.rotationRate);
        continue;
      }

      // Parse acceleration magnitude: Acceleration Magnitude: 1.03 g
      const accelMagMatch = line.match(
        /Acceleration Magnitude:\s*([-\d.]+)\s*g/,
      );
      if (accelMagMatch) {
        result.accelerationMagnitude = parseFloat(accelMagMatch[1]);
        validFieldCount++;
        console.log(
          '[LogsCard] Parsed acceleration magnitude:',
          result.accelerationMagnitude,
        );
        continue;
      }

      // Parse linear acceleration: Linear Acceleration: 0.88 m/s^2
      const linearAccelMatch = line.match(
        /Linear Acceleration:\s*([-\d.]+)\s*m\/s/,
      );
      if (linearAccelMatch) {
        result.linearAcceleration = parseFloat(linearAccelMatch[1]);
        validFieldCount++;
        console.log(
          '[LogsCard] Parsed linear acceleration:',
          result.linearAcceleration,
        );
        continue;
      }

      // Log unmatched lines for debugging
      if (line.length > 3 && !line.includes('DEBUG:')) {
        console.log('[LogsCard] Unmatched line:', line);
      }
    }
    console.log(
      '[LogsCard] parseESP32HumanReadableFormat - Final result:',
      result,
    );
    console.log(
      '[LogsCard] parseESP32HumanReadableFormat - Valid field count:',
      validFieldCount,
    ); // Return the parsed object if we have valid fields (at least 3 fields for meaningful data)
    if (validFieldCount >= 3) {
      // Convert individual positionX/positionY to position object for consistency
      if ('positionX' in result || 'positionY' in result) {
        result.position = {
          positionX: result.positionX,
          positionY: result.positionY,
        };
        // Keep the individual fields as well for fallback compatibility
      }
      // If no timestamp was found, use received timestamp as fallback
      if (!result.timestamp && receivedTimestamp) {
        result.timestamp = receivedTimestamp;
        console.log(
          '[LogsCard] No ESP32 timestamp found, using received time:',
          result.timestamp,
        );
      } else if (!result.timestamp) {
        result.timestamp = Date.now();
        console.log(
          '[LogsCard] No timestamp available, using current time:',
          result.timestamp,
        );
      }

      return result;
    }
    return null;
  } catch (error) {
    console.warn(
      '[LogsCard] Error parsing ESP32 human-readable format:',
      error,
    );
    return null;
  }
};

// Function to parse readable format data (READABLE_DATA|key=value|...)
const parseReadableFormat = (data: string): Record<string, unknown> | null => {
  try {
    console.log(
      '[LogsCard] parseReadableFormat - Input data:',
      data.substring(0, 100) + '...',
    );

    // Remove the READABLE_DATA prefix
    if (!data.startsWith('READABLE_DATA|')) {
      console.log(
        '[LogsCard] parseReadableFormat - Not readable format, missing prefix',
      );
      return null;
    }

    const cleanData = data.substring('READABLE_DATA|'.length);
    console.log(
      '[LogsCard] parseReadableFormat - Clean data:',
      cleanData.substring(0, 100) + '...',
    );

    // Split by pipe and parse key=value pairs
    const pairs = cleanData.split('|');
    console.log('[LogsCard] parseReadableFormat - Found pairs:', pairs.length);

    const result: Record<string, unknown> = {};
    let validFieldCount = 0;

    for (const pair of pairs) {
      const equalIndex = pair.indexOf('=');
      if (equalIndex === -1) continue;

      const key = pair.substring(0, equalIndex).trim();
      const value = pair.substring(equalIndex + 1).trim();

      if (!key || value === '') continue;

      // Enhanced type conversion
      if (value === 'true' || value === 'YES') {
        result[key] = true;
      } else if (value === 'false' || value === 'NO') {
        result[key] = false;
      } else if (value === 'null' || value === 'undefined') {
        result[key] = null;
      } else {
        // Try to parse as number
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          result[key] = numValue;
        } else {
          // Store as string, removing quotes if present
          result[key] = value.replace(/^["']|["']$/g, '');
        }
      }

      validFieldCount++;
    }

    console.log('[LogsCard] parseReadableFormat - Parsed result:', result);
    console.log(
      '[LogsCard] parseReadableFormat - Valid field count:',
      validFieldCount,
    );

    // Return the parsed object if we have valid fields
    return validFieldCount > 0 ? result : null;
  } catch (error) {
    console.warn('[LogsCard] Error parsing readable format:', error);
    return null;
  }
};

// Function to parse and format JSON data for better readability
const parseAndFormatSerialData = (rawData: string) => {
  const lines = rawData.split('\n').filter((line) => line.trim());
  const formattedData: Array<{
    type: 'json' | 'text' | 'readable';
    timestamp: string;
    data: unknown;
    raw: string;
    receivedAt: string; // Add actual received time
  }> = [];

  // Process only last 20 lines for better performance in formatted view
  // Since serial data is already in newest-first order, keep that order
  const linesToProcess = lines.slice(-20);

  linesToProcess.forEach((line, index) => {
    const trimmedLine = line.trim();
    // Skip standalone timestamp lines from serial data
    // Format 1: [2025-06-22T03:22:07.769Z]
    // Format 2: 2025-06-22T04:07:09.627Z (without content after |)
    if (
      trimmedLine.match(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]$/) ||
      trimmedLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*\|\s*$/)
    ) {
      return; // Skip these timestamp-only lines
    }

    // Extract original data without timestamp prefix
    let cleanData = trimmedLine;

    // Handle different timestamp formats:
    // 1. [2025-06-22T03:22:07.769Z] format (from file logs)
    const bracketTimestampMatch = trimmedLine.match(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]\s*(.*)$/,
    );
    // 2. 2025-06-22T04:07:09.627Z | format (from test data injection)
    const pipeTimestampMatch = trimmedLine.match(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*\|\s*(.*)$/,
    );

    if (bracketTimestampMatch) {
      cleanData = bracketTimestampMatch[1];
    } else if (pipeTimestampMatch) {
      cleanData = pipeTimestampMatch[1];
    }

    // Generate timestamp that corresponds to actual data order
    // Since data is newest-first, earlier indices should get more recent timestamps
    const now = new Date();
    const entryTime = new Date(now.getTime() - index * 1000);
    const receivedAt = entryTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }); // Priority 1: Check for ESP32 human-readable format (contains ESP32 data patterns)
    if (
      cleanData.includes('====') ||
      cleanData.includes('Timestamp:') ||
      cleanData.includes('Accel (') ||
      cleanData.includes('Gyro (') ||
      cleanData.includes('Heading:') ||
      cleanData.includes('Ultrasonic Distance:') ||
      cleanData.includes('Obstacle Detected:') ||
      cleanData.includes('Current Pos') ||
      cleanData.includes('Velocity (')
    ) {
      console.log(
        '[LogsCard] Found ESP32 human-readable format:',
        cleanData.substring(0, 200),
      );
      const esp32Data = parseESP32HumanReadableFormat(
        cleanData,
        entryTime.getTime(),
      );
      if (esp32Data) {
        // Override ESP32 timestamp with actual receive timestamp for accuracy
        esp32Data.timestamp = entryTime.getTime();
        esp32Data.receivedAt = entryTime.toISOString();

        console.log(
          '[LogsCard] Successfully parsed ESP32 human-readable data:',
          esp32Data,
        );
        formattedData.push({
          type: 'readable',
          timestamp: receivedAt,
          data: esp32Data,
          raw: trimmedLine,
          receivedAt: entryTime.toISOString(),
        });
        return;
      } else {
        console.log(
          '[LogsCard] Failed to parse ESP32 human-readable data, cleanData length:',
          cleanData.length,
        );
        console.log(
          '[LogsCard] CleanData sample lines:',
          cleanData.split('\n').slice(0, 5),
        );
      }
    }

    // Priority 2: Check for readable format (READABLE_DATA|key=value|...)
    if (cleanData.includes('READABLE_DATA|')) {
      console.log(
        '[LogsCard] Found READABLE_DATA format:',
        cleanData.substring(0, 100),
      );
      const readableData = parseReadableFormat(cleanData);
      if (readableData) {
        console.log(
          '[LogsCard] Successfully parsed readable data:',
          readableData,
        );
        formattedData.push({
          type: 'readable',
          timestamp: receivedAt,
          data: readableData,
          raw: trimmedLine,
          receivedAt: entryTime.toISOString(),
        });
        return;
      } else {
        console.log('[LogsCard] Failed to parse readable data');
      }
    } // Priority 3: Check if line contains JSON data
    if (cleanData.includes('{') && cleanData.includes('}')) {
      console.log('[LogsCard] Found JSON format:', cleanData.substring(0, 100));
      try {
        // Extract JSON from debug messages or direct JSON
        let jsonString = cleanData;

        // Remove debug prefix if present
        const debugPrefix = '[DEBUG] Forwarding JSON to UART2:';
        if (cleanData.includes(debugPrefix)) {
          jsonString = cleanData
            .substring(cleanData.indexOf(debugPrefix) + debugPrefix.length)
            .trim();
        }

        // Handle test data prefix like [TEST_DATA] or [ESP32]
        const testDataMatch = jsonString.match(
          /^\[(?:TEST_DATA|ESP32)\]\s*(.*)$/,
        );
        if (testDataMatch) {
          jsonString = testDataMatch[1].trim();
        }

        console.log(
          '[LogsCard] Attempting to parse JSON:',
          jsonString.substring(0, 100),
        );

        // Parse JSON
        const jsonData = JSON.parse(jsonString);
        console.log('[LogsCard] Successfully parsed JSON data:', jsonData);

        formattedData.push({
          type: 'json',
          timestamp: receivedAt,
          data: jsonData,
          raw: trimmedLine,
          receivedAt: entryTime.toISOString(),
        });
      } catch (error) {
        console.log('[LogsCard] Failed to parse JSON:', error);
        // If parsing fails, treat as regular text
        if (cleanData.length > 0) {
          formattedData.push({
            type: 'text',
            timestamp: receivedAt,
            data: cleanData,
            raw: trimmedLine,
            receivedAt: entryTime.toISOString(),
          });
        }
      }
    }
    // Priority 4: Check for key-value format (key=value pairs)
    else if (cleanData.includes('=') && !cleanData.includes('{')) {
      console.log(
        '[LogsCard] Found key-value format:',
        cleanData.substring(0, 100),
      );
      try {
        // Parse simple key-value format
        const pairs = cleanData.split(',').map((p) => p.trim());
        const kvData: Record<string, unknown> = {};
        let validPairs = 0;

        for (const pair of pairs) {
          const equalIndex = pair.indexOf('=');
          if (equalIndex === -1) continue;

          const key = pair.substring(0, equalIndex).trim();
          const value = pair.substring(equalIndex + 1).trim();

          if (!key || value === '') continue;

          // Type conversion
          if (value === 'true') {
            kvData[key] = true;
          } else if (value === 'false') {
            kvData[key] = false;
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && isFinite(numValue)) {
              kvData[key] = numValue;
            } else {
              kvData[key] = value;
            }
          }
          validPairs++;
        }

        console.log(
          '[LogsCard] Parsed key-value data:',
          kvData,
          'Valid pairs:',
          validPairs,
        );

        if (validPairs > 0) {
          formattedData.push({
            type: 'json', // Treat parsed key-value as JSON-like for consistent rendering
            timestamp: receivedAt,
            data: kvData,
            raw: trimmedLine,
            receivedAt: entryTime.toISOString(),
          });
        } else if (cleanData.length > 0) {
          formattedData.push({
            type: 'text',
            timestamp: receivedAt,
            data: cleanData,
            raw: trimmedLine,
            receivedAt: entryTime.toISOString(),
          });
        }
      } catch (error) {
        console.log('[LogsCard] Failed to parse key-value:', error);
        // If parsing fails, treat as regular text
        if (cleanData.length > 0) {
          formattedData.push({
            type: 'text',
            timestamp: receivedAt,
            data: cleanData,
            raw: trimmedLine,
            receivedAt: entryTime.toISOString(),
          });
        }
      }
    }
    // Priority 4: Treat as regular text
    else if (cleanData.length > 0) {
      console.log('[LogsCard] Treating as text:', cleanData.substring(0, 50));
      formattedData.push({
        type: 'text',
        timestamp: receivedAt,
        data: cleanData,
        raw: trimmedLine,
        receivedAt: entryTime.toISOString(),
      });
    }
  });

  // Return data in newest-first order, matching the original serial data order
  return formattedData;
};

// Function to render formatted ESP32 sensor data with simple design
const renderFormattedSensorData = (
  data: Record<string, unknown>,
  isDark: boolean,
) => {
  console.log('[LogsCard] renderFormattedSensorData - Input data:', data);
  console.log(
    '[LogsCard] renderFormattedSensorData - Data keys:',
    Object.keys(data),
  );

  // Helper function to safely format values
  const formatValue = (
    value: unknown,
    defaultValue: string = 'N/A',
    unit: string = '',
  ): string => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : `${value}${unit}`;
    }
    if (typeof value === 'string' && value.trim() === '') return defaultValue;
    return `${value}${unit}`;
  };

  // Helper function to safely format numbers with precision
  const formatNumber = (
    value: unknown,
    precision: number = 1,
    unit: string = '',
    defaultValue: string = 'N/A',
  ): string => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'number' && !isNaN(value)) {
      return `${value.toFixed(precision)}${unit}`;
    }
    return defaultValue;
  };

  const sensorGroups = {
    'Device Info': {
      icon: 'mdi:chip',
      data: {
        'Sender MAC': formatValue(data.senderMac, 'Unknown'),
        'Signal Strength': formatValue(data.rssi, '-', ' dBm'),
        Distance: formatValue(data.rssiDistance, '0', ' m'),
        Timestamp: (() => {
          if (!data.timestamp) return 'N/A';

          const timestamp = Number(data.timestamp);
          if (isNaN(timestamp) || timestamp <= 0) return 'N/A';

          // Handle both seconds and milliseconds timestamps
          // If timestamp is in seconds (10 digits), convert to milliseconds
          // If timestamp is in milliseconds (13 digits), use as is
          const timestampMs =
            timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;

          // Create date and check if it's valid
          const date = new Date(timestampMs);
          if (isNaN(date.getTime())) return 'N/A';

          // Format as readable string
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
        })(),
      },
    },
    'Obstacle Detection': {
      icon: 'mdi:radar',
      data: {
        Status:
          data.obstacle === true
            ? '🚫 Detected'
            : data.obstacle === false
              ? '✅ Clear'
              : '❓ Unknown',
        'Ultrasonic Distance': (() => {
          const ultrasonic = data.ultrasonic;
          if (ultrasonic === -1) return 'No reading';
          if (ultrasonic === undefined || ultrasonic === null) return 'N/A';
          return `${ultrasonic} cm`;
        })(),
      },
    },
    Orientation: {
      icon: 'mdi:compass',
      data: {
        Heading: formatNumber(data.heading, 1, '°'),
        Direction: formatValue(data.direction, 'Unknown'),
        Pitch: formatNumber(data.pitch, 1, '°'),
        Roll: formatNumber(data.roll, 1, '°'),
        Yaw: formatNumber(data.yaw, 1, '°'),
      },
    },
    Motion: {
      icon: 'mdi:motion',
      data: {
        Velocity: formatValue(data.velocity, '0', ' cm/s'),
        'Velocity X': formatValue(data.velocityX, '0', ' cm/s'),
        'Velocity Y': formatValue(data.velocityY, '0', ' cm/s'),
        'Distance Traveled': formatValue(data.distanceTraveled, '0', ' cm'),
        'Position X': formatValue(
          (data.position as { positionX?: number })?.positionX ||
            data.positionX,
          '0',
          ' cm',
        ),
        'Position Y': formatValue(
          (data.position as { positionY?: number })?.positionY ||
            data.positionY,
          '0',
          ' cm',
        ),
      },
    },
    Acceleration: {
      icon: 'mdi:speedometer',
      data: {
        'Linear Accel': formatValue(data.linearAcceleration, '0', ' m/s²'),
        Magnitude: formatNumber(data.accelerationMagnitude, 3, ' m/s²'),
        'Accel X': formatNumber(data.accelX, 3, ' m/s²'),
        'Accel Y': formatNumber(data.accelY, 3, ' m/s²'),
        'Accel Z': formatNumber(data.accelZ, 3, ' m/s²'),
      },
    },
    Gyroscope: {
      icon: 'mdi:rotate-3d-variant',
      data: {
        'Rotation Rate': formatNumber(data.rotationRate, 3, ' dps'),
        'Gyro X': formatNumber(data.gyroX, 3, ' dps'),
        'Gyro Y': formatNumber(data.gyroY, 3, ' dps'),
        'Gyro Z': formatNumber(data.gyroZ, 3, ' dps'),
      },
    },
    Magnetometer: {
      icon: 'mdi:magnet',
      data: {
        'Mag X': formatNumber(data.magX, 1, ' µT'),
        'Mag Y': formatNumber(data.magY, 1, ' µT'),
        'Mag Z': formatNumber(data.magZ, 1, ' µT'),
      },
    },
  };

  return (
    <div className='space-y-3'>
      {Object.entries(sensorGroups).map(([groupName, group]) => (
        <div
          key={groupName}
          className={`p-3 rounded-lg border ${
            isDark
              ? 'bg-gray-800/30 border-gray-700'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className='flex items-center gap-2 mb-3'>
            <Icon
              icon={group.icon}
              width={14}
              height={14}
              style={{ color: '#3B82F6' }}
            />
            <h4
              className={`text-sm font-semibold`}
              style={{ color: '#3B82F6' }}
            >
              {groupName}
            </h4>
          </div>

          <div className='space-y-2'>
            {Object.entries(group.data).map(([key, value]) => (
              <div
                key={key}
                className={`flex justify-between items-center py-1 px-2 rounded ${
                  isDark ? 'bg-gray-700/30' : 'bg-white/70'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {key}
                </span>
                <span
                  className={`text-xs font-mono ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface LogItem {
  id: string;
  timestamp: string;
  sessionId: number;
  logType: string;
  message: string;
  createdAt: string;
  source?: 'api' | 'serial';
  isRawSerial?: boolean; // New field to distinguish raw serial logs
}

interface LogsCardProps {
  serialBuffer?: string; // Raw serial data buffer from parent
  connectedPort?: string; // Connected port info from parent
  onClearSerialBuffer?: () => void; // Function to clear serial buffer in parent
  liveSerialData?: {
    // Basic sensor data
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
    };
    position: {
      positionX?: number;
      positionY?: number;
    };
    pitch?: number;
    roll?: number;
    yaw?: number;
    // Additional fields for LogsCard
    senderMac?: string;
    obstacle?: boolean;
    timestamp?: number;
    receivedAt?: number;
    rssi?: number;
    rssiDistance?: number;
    // Accelerometer details
    accelX?: number;
    accelY?: number;
    accelZ?: number; // Gyroscope details
    gyroX?: number;
    gyroY?: number;
    gyroZ?: number;
    // Magnetometer details (both formats for compatibility)
    magX?: number;
    magY?: number;
    magZ?: number;
    // Device status
    mainDeviceStatus?: string;
    ultrasonicSensorStatus?: string;
    imuSensorStatus?: string;
  } | null; // Live parsed serial data from parent
}

const LogsCard: React.FC<LogsCardProps> = ({
  serialBuffer: externalSerialBuffer = '',
  connectedPort = '',
  onClearSerialBuffer,
  liveSerialData = null,
}) => {
  const { isDark } = useDarkMode();
  const { isConnected } = useLocalMode();
  // Debug logging for props
  useEffect(() => {
    console.log('[LogsCard] ===== PROPS DEBUG =====');
    console.log(
      '[LogsCard] externalSerialBuffer length:',
      externalSerialBuffer.length,
    );
    console.log('[LogsCard] connectedPort:', connectedPort);
    console.log('[LogsCard] isConnected:', isConnected);
    console.log('[LogsCard] liveSerialData:', liveSerialData);
    if (externalSerialBuffer.length > 0) {
      console.log(
        '[LogsCard] externalSerialBuffer preview:',
        externalSerialBuffer.substring(0, 300),
      );
    }
    if (liveSerialData) {
      console.log(
        '[LogsCard] liveSerialData keys:',
        Object.keys(liveSerialData),
      );
      console.log('[LogsCard] liveSerialData values sample:', {
        senderMac: liveSerialData.senderMac,
        ultrasonic: liveSerialData.ultrasonic,
        heading: liveSerialData.heading,
        direction: liveSerialData.direction,
        velocity: liveSerialData.velocity,
        obstacle: liveSerialData.obstacle,
        timestamp: liveSerialData.timestamp,
        rssi: liveSerialData.rssi,
        accelX: liveSerialData.accelX,
        gyroX: liveSerialData.gyroX,
        magX: liveSerialData.magX,
      });
    }
    console.log('[LogsCard] ===============================');
  }, [externalSerialBuffer, connectedPort, isConnected, liveSerialData]);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const [logsItems, setLogsItems] = useState<LogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [serialBuffer, setSerialBuffer] = useState<string>(''); // Local serial buffer (fallback)
  const [autoScroll, setAutoScroll] = useState(true); // Auto scroll to bottom
  const [, setIsWritingToFile] = useState(false); // File writing state
  const [isFirstConnection, setIsFirstConnection] = useState(true); // Track if this is first connection for header
  const [showToast, setShowToast] = useState(false); // Toast notification state
  const [toastMessage, setToastMessage] = useState(''); // Toast message
  // FIXED: Default to static tab instead of scroll
  const [activeTab, setActiveTab] = useState<'scroll' | 'static'>('static'); // Tab selection - default to static
  const [latestJsonData, setLatestJsonData] = useState<Record<
    string,
    unknown
  > | null>(null); // Latest JSON data for static view
  const hasFetched = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scroll
  const serialMonitorRef = useRef<HTMLDivElement>(null); // Ref for serial monitor auto-scroll

  // Use external serial buffer from parent (Monitoring.tsx) or fallback to local buffer
  const currentSerialBuffer = externalSerialBuffer || serialBuffer;

  // Function to show toast notification
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Hide toast after 3 seconds
  };

  // Function to handle clearing all logs
  const handleClearAllLogs = () => {
    // Clear API logs
    setLogsItems([]);
    // Clear local serial buffer (fallback)
    setSerialBuffer('');
    // Clear latest JSON data for static view
    setLatestJsonData(null);
    // Clear external serial buffer via parent callback
    if (onClearSerialBuffer) {
      onClearSerialBuffer();
    }
    showToastMessage('All logs cleared');
  };

  // Function to handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentSerialBuffer);
      showToastMessage('Logs copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToastMessage('Failed to copy logs');
    }
  };

  // Function to write logs to file (Electron only)
  const writeLogsToFile = useCallback(
    async (newData: string, isInitialConnection: boolean = false) => {
      if (!isElectron) return;
      // Use type assertion to access the writeLogsToFile method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electronAPI = window.electronAPI as any;
      console.log(
        '[LogsCard] writeLogsToFile called, electronAPI available:',
        !!electronAPI,
      );
      console.log(
        '[LogsCard] writeLogsToFile method available:',
        !!electronAPI?.writeLogsToFile,
      );

      if (!electronAPI?.writeLogsToFile) return;

      try {
        setIsWritingToFile(true);
        // Create filename with current date only (one file per day)
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `esp32-logs-${dateStr}.txt`;

        // Check if file exists first (for header)
        const fileExists = await electronAPI.checkFileExists?.(
          `logs/${filename}`,
        );

        let logEntry = '';

        // Add header if file doesn't exist or this is initial connection
        if (!fileExists || isInitialConnection) {
          const headerTimestamp = now.toISOString();
          const deviceInfo = connectedPort ? ` on ${connectedPort}` : '';
          const header = `
=================================================================
ESP32 Serial Monitor Log
=================================================================
Device: ESP32${deviceInfo}
Session started: ${headerTimestamp}
Log file: ${filename}
=================================================================

`;
          logEntry = header;
        }

        // Prepare log entry (timestamp already included in newData)
        logEntry += `${newData}\n`;

        console.log(
          '[LogsCard] Writing to file:',
          filename,
          'content length:',
          logEntry.length,
        );

        // Write to file using the new API
        const result = await electronAPI.writeLogsToFile(logEntry, filename);
        console.log('[LogsCard] Write result:', result);

        if (!result.success) {
          console.error('Failed to write logs to file:', result.error);
        }
      } catch (error) {
        console.error('Error writing logs to file:', error);
      } finally {
        setIsWritingToFile(false);
      }
    },
    [isElectron, connectedPort],
  );

  // Auto-scroll to bottom when new logs are added
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll serial monitor when data is added
  const scrollSerialMonitorToTop = () => {
    if (serialMonitorRef.current) {
      serialMonitorRef.current.scrollTop = 0;
    }
  };

  // Auto-scroll functionality untuk serial monitor
  // Since we now show newest entries at the top, scroll to top instead of bottom
  useEffect(() => {
    if (autoScroll && serialMonitorRef.current && activeTab === 'scroll') {
      serialMonitorRef.current.scrollTop = 0;
    }
  }, [currentSerialBuffer, autoScroll, activeTab]);

  // Effect to scroll when logs change or serial buffer changes
  useEffect(() => {
    scrollToBottom();
    if (autoScroll && activeTab === 'scroll') {
      scrollSerialMonitorToTop();
    }
  }, [logsItems, currentSerialBuffer, autoScroll, activeTab]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await fetch('/api/monitoring/logs');
        const data = await response.json();
        // Limit to last 100 logs to prevent performance issues
        const logs = data.data || [];
        setLogsItems(logs.slice(-100));
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []); // FIXED: Effect to update latest JSON/readable data for static view
  // Priority: liveSerialData > parsed from currentSerialBuffer
  useEffect(() => {
    console.log('[LogsCard] DEBUG - Updating static tab data...');
    console.log('[LogsCard] DEBUG - liveSerialData:', liveSerialData);
    console.log(
      '[LogsCard] DEBUG - currentSerialBuffer length:',
      currentSerialBuffer.length,
    ); // Priority 1: Use liveSerialData if available (already parsed, real-time)
    if (liveSerialData) {
      console.log('[LogsCard] DEBUG - Using liveSerialData for static tab');

      // Create a copy of liveSerialData and override timestamp with current time for accuracy
      const liveDataWithCorrectTimestamp = {
        ...liveSerialData,
        timestamp: Date.now(), // Use current time instead of potentially invalid ESP32 timestamp
        receivedAt: new Date().toISOString(),
      };

      setLatestJsonData(
        liveDataWithCorrectTimestamp as Record<string, unknown>,
      );
      return;
    }

    // Priority 2: Parse from currentSerialBuffer if liveSerialData not available
    if (currentSerialBuffer) {
      console.log(
        '[LogsCard] DEBUG - Processing serial buffer, length:',
        currentSerialBuffer.length,
      );
      console.log(
        '[LogsCard] DEBUG - Raw buffer first 500 chars:',
        currentSerialBuffer.substring(0, 500),
      );

      const formattedData = parseAndFormatSerialData(currentSerialBuffer);
      // Since parseAndFormatSerialData now returns data in newest-first order,
      // we need to find the first structured data item (JSON or readable) to get the newest
      const structuredItems = formattedData.filter(
        (item) => item.type === 'json' || item.type === 'readable',
      );

      console.log(
        '[LogsCard] DEBUG - Total formatted items:',
        formattedData.length,
      );
      console.log(
        '[LogsCard] DEBUG - Total structured items found:',
        structuredItems.length,
      );

      if (structuredItems.length > 0) {
        // Get the first (newest) structured item since data is in newest-first order
        const latestStructured = structuredItems[0];
        console.log(
          '[LogsCard] DEBUG - Latest structured data for static tab:',
          latestStructured.data,
          'Type:',
          latestStructured.type,
        );
        console.log(
          '[LogsCard] DEBUG - Data keys:',
          Object.keys(latestStructured.data || {}),
        );
        const dataObj = latestStructured.data as Record<string, unknown>;
        console.log('[LogsCard] DEBUG - Data values sample:', {
          senderMac: dataObj?.senderMac,
          ultrasonic: dataObj?.ultrasonic,
          heading: dataObj?.heading,
          timestamp: dataObj?.timestamp,
          accelX: dataObj?.accelX,
          gyroX: dataObj?.gyroX,
          obstacle: dataObj?.obstacle,
        });
        setLatestJsonData(latestStructured.data as Record<string, unknown>);
      } else {
        console.log(
          '[LogsCard] DEBUG - No structured data found, clearing latestJsonData',
        );
        setLatestJsonData(null);
      }
    } else {
      // No data available
      console.log(
        '[LogsCard] DEBUG - No data available, clearing latestJsonData',
      );
      setLatestJsonData(null);
    }
  }, [liveSerialData, currentSerialBuffer]);

  // Only set up local listener if no external buffer is provided (fallback mode)
  // LogsCard should NOT setup its own serial listener anymore
  // All serial data should come from parent component (Monitoring.tsx) via props
  useEffect(() => {
    // Only update local buffer if external buffer is provided
    if (externalSerialBuffer) {
      setSerialBuffer(externalSerialBuffer);
    }
  }, [externalSerialBuffer, isConnected, isElectron]);

  // Write logs to file when new serial data is received (real or test data)
  const lastSerialBufferLength = useRef(0);
  useEffect(() => {
    if (
      isElectron &&
      currentSerialBuffer.length > lastSerialBufferLength.current
    ) {
      // Get only the new data since last write
      const newData = currentSerialBuffer.substring(
        lastSerialBufferLength.current,
      );
      if (newData.trim()) {
        // For file writing, we add timestamp here to each line
        const lines = newData.trim().split('\n');
        const timestampedData = lines
          .map((line) => {
            if (line.trim()) {
              const timestamp = new Date().toISOString();
              // Mark test data in file for clarity
              const dataType = isConnected ? 'ESP32' : 'TEST_DATA';
              return `[${timestamp}] [${dataType}] ${line.trim()}`;
            }
            return '';
          })
          .filter((line) => line)
          .join('\n');

        writeLogsToFile(timestampedData, isFirstConnection && isConnected);
        if (isFirstConnection && isConnected) {
          setIsFirstConnection(false);
        }
      }
      lastSerialBufferLength.current = currentSerialBuffer.length;
    }
  }, [
    currentSerialBuffer,
    isConnected,
    isElectron,
    writeLogsToFile,
    isFirstConnection,
  ]);

  // Reset first connection flag when connection status changes
  useEffect(() => {
    if (isConnected) {
      setIsFirstConnection(true);
      lastSerialBufferLength.current = 0; // Reset buffer length when reconnecting
    }
  }, [isConnected, connectedPort]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 rounded-xl flex-1 overflow-hidden h-full ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      <div className='flex flex-row items-center justify-between w-full gap-2'>
        <div className='flex flex-row items-center justify-start gap-2'>
          <div className='p-1.5 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-md'>
            <Icon
              icon='fluent:data-usage-32-filled'
              width={20}
              height={20}
              className='text-white'
            />
          </div>
          <p className='font-semibold text-base'>Logs</p>
        </div>

        {/* Clear logs button and view controls */}
        <div className='flex items-center gap-2'>
          {/* Test button for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                const testData = `[${new Date().toISOString()}] ====== SENT DATA ======
Timestamp: ${Date.now()} ms
Accel (bias-corr g): X=0.009 Y=-0.000 Z=1.004
Gyro (dps): X=-0.09 Y=0.49 Z=-0.12
Mag (uT): X=78.58 Y=89.15 Z=-2331.04
Pitch: -0.02° Roll: -0.51°
Yaw: 310.65°
Heading: 310.65 ° (Northwest)
Ultrasonic Distance: 113.16 cm
Obstacle Detected: NO
Current Pos (KF Displacement): (0.00, 0.00) cm
Velocity (KF): 0.00 cm/s (Vx=0.00, Vy=0.00)
Total Distance Traveled (KF): 0.00 cm
========================`;

                setSerialBuffer((prev) => testData + '\n' + prev);
                showToastMessage('Test ESP32 data injected');
                console.log('[LogsCard] Test data injected:', testData);
              }}
              className='px-2 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-md border border-green-200 transition-colors'
              title='Inject test ESP32 data'
            >
              Test
            </button>
          )}

          {/* Only show clear button if there are API logs OR if there is serial data (connected or test data) */}
          {(logsItems.length > 0 || currentSerialBuffer.length > 0) && (
            <button
              onClick={handleClearAllLogs}
              className='px-2 py-1.5 text-xs bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 rounded-md border border-gray-200 transition-colors'
              title='Clear all logs'
            >
              <Icon icon='mdi:trash-can-outline' width={12} height={12} />
            </button>
          )}

          {/* Connection status indicator - read-only */}
          {isElectron && isConnected && (
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30'>
              <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                Connected to ESP32{connectedPort ? ` on ${connectedPort}` : ''}
              </span>
            </div>
          )}

          {/* Test data mode indicator */}
          {isElectron && !isConnected && currentSerialBuffer.length > 0 && (
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/30'>
              <div className='w-2 h-2 bg-orange-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-orange-600 dark:text-orange-400 font-medium'>
                Test Data Mode
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content area with proper flex layout */}
      <div className='flex flex-col w-full mt-3 flex-1 min-h-0'>
        {isLoadingLogs ? (
          <div className='flex items-center justify-center flex-1'>
            <ClipLoader size={24} color={isDark ? '#3b82f6' : '#60a5fa'} />
          </div>
        ) : (
          <>
            {/* Main logs display area - takes full available height */}
            <div className='flex-1 min-h-0 overflow-hidden'>
              {/* Combined logs container with full height */}
              <div className='h-full flex flex-col overflow-hidden'>
                {/* Regular API logs section */}
                {logsItems.filter((item) => item.source !== 'serial').length >
                  0 && (
                  <div className='flex-1 min-h-0 overflow-y-auto space-y-1.5 p-1'>
                    {logsItems
                      .filter((item) => item.source !== 'serial')
                      .reverse() // Reverse to show newest logs first
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border-l-4 ${
                            item.logType === 'error'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : item.logType === 'warning'
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Icon
                                icon={
                                  item.logType === 'error'
                                    ? 'mdi:alert-circle'
                                    : item.logType === 'warning'
                                      ? 'mdi:alert'
                                      : 'mdi:information'
                                }
                                width={14}
                                height={14}
                                className={
                                  item.logType === 'error'
                                    ? 'text-red-500'
                                    : item.logType === 'warning'
                                      ? 'text-yellow-500'
                                      : 'text-blue-500'
                                }
                              />
                              <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                                {item.logType.toUpperCase()}
                              </span>
                            </div>
                            <span className='text-xs text-gray-500 font-mono'>
                              {convertTimestampToTime(item.timestamp)}
                            </span>
                          </div>
                          <p className='text-sm mt-1 text-gray-700 dark:text-gray-200'>
                            {item.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {/* Serial Monitor Data Display - takes remaining space */}
                {isElectron && currentSerialBuffer.length > 0 && (
                  <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
                    {/* Tab Navigation - minimal style */}
                    <div className='mb-2 flex justify-center'>
                      <div className='flex'>
                        {/* FIXED: Static tab first */}
                        <button
                          onClick={() => setActiveTab('static')}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === 'static'
                              ? isDark
                                ? 'text-blue-400'
                                : 'text-blue-600'
                              : isDark
                                ? 'text-gray-500 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon
                            icon='mdi:view-dashboard'
                            className='inline mr-1'
                            width={12}
                            height={12}
                          />
                          Static
                        </button>
                        <span
                          className={`mx-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                        >
                          |
                        </span>
                        <button
                          onClick={() => setActiveTab('scroll')}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === 'scroll'
                              ? isDark
                                ? 'text-blue-400'
                                : 'text-blue-600'
                              : isDark
                                ? 'text-gray-500 hover:text-gray-300'
                                : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon
                            icon='mdi:format-list-bulleted'
                            className='inline mr-1'
                            width={12}
                            height={12}
                          />
                          Scroll
                        </button>
                      </div>
                    </div>

                    {/* FIXED: Static view first in conditional */}
                    {activeTab === 'static' ? (
                      // Static View - Latest JSON data only
                      <div
                        className={`flex-1 min-h-0 w-full rounded-md overflow-hidden ${
                          isDark ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}
                      >
                        <div className='h-full overflow-y-auto'>
                          {latestJsonData ? (
                            <div className='p-4'>
                              {renderFormattedSensorData(
                                latestJsonData,
                                isDark,
                              )}
                            </div>
                          ) : (
                            <div
                              className={`flex flex-col items-center justify-center h-full text-center p-4 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              <Icon
                                icon='mdi:signal-variant'
                                width={48}
                                height={48}
                                className='mb-3 opacity-50'
                              />
                              <p className='text-sm font-medium mb-1'>
                                Waiting for ESP32 data...
                              </p>
                              <p className='text-xs opacity-70'>
                                {isConnected
                                  ? 'Connect your ESP32 device to start receiving data'
                                  : 'Enable test data mode to see demo information'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Scroll View - Raw text only (JSON parsing is available in Static tab)
                      <div
                        ref={serialMonitorRef}
                        className={`flex-1 min-h-0 w-full rounded-md border-l-4 border-blue-500 overflow-hidden ${
                          isDark ? 'bg-gray-900/50' : 'bg-gray-50'
                        }`}
                      >
                        <div className='h-full overflow-y-auto'>
                          {/* Raw Data Display - with proper wrapping for long lines */}
                          <div className='p-3 h-full overflow-y-auto'>
                            <div className='flex items-center gap-2 mb-3'>
                              <Icon
                                icon='mdi:console'
                                width={14}
                                height={14}
                                className={
                                  isDark ? 'text-blue-400' : 'text-blue-600'
                                }
                              />
                              <h3
                                className={`text-sm font-semibold ${
                                  isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}
                              >
                                Raw Serial Monitor
                              </h3>
                            </div>
                            <pre
                              className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full ${
                                isDark ? 'text-green-400' : 'text-green-700'
                              }`}
                              style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {(() => {
                                // Since serial data is already in newest-first order, just display it
                                // Filter out empty lines but maintain the newest-first order
                                const lines = currentSerialBuffer
                                  .split('\n')
                                  .filter((line) => line.trim());

                                if (lines.length === 0) {
                                  return (
                                    <div
                                      className={`text-center py-4 text-sm ${
                                        isDark
                                          ? 'text-gray-400'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      Waiting for serial data...
                                    </div>
                                  );
                                }

                                return lines.join('\n');
                              })()}
                            </pre>

                            {/* Performance info */}
                            {currentSerialBuffer
                              .split('\n')
                              .filter((l) => l.trim()).length > 0 && (
                              <div
                                className={`text-center py-2 text-xs border-t mt-3 ${
                                  isDark
                                    ? 'text-gray-500 border-gray-700'
                                    : 'text-gray-400 border-gray-200'
                                }`}
                              >
                                Total:{' '}
                                {
                                  currentSerialBuffer
                                    .split('\n')
                                    .filter((l) => l.trim()).length
                                }{' '}
                                lines
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state - only show when no data at all (no API logs AND no serial data) */}
                {logsItems.filter((item) => item.source !== 'serial').length ===
                  0 &&
                  currentSerialBuffer.length === 0 && (
                    <div className='flex flex-1 items-center justify-center text-center'>
                      <div className='flex flex-col items-center justify-center gap-3'>
                        <Icon
                          icon='mdi:file-document-outline'
                          width={48}
                          height={48}
                          className='text-gray-400 opacity-50'
                        />
                        <div>
                          <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                            No logs available
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-500'>
                            {isElectron
                              ? 'Connect ESP32 or enable test data to see logs'
                              : 'Logs will appear here when available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Serial Monitor Controls - Show if there is serial data (connected or test data) */}
            {isElectron && currentSerialBuffer.length > 0 && (
              <div
                className={`mt-4 p-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Mobile-first responsive layout */}
                <div className='space-y-3'>
                  {/* Top row - Status info */}
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <Icon
                        icon='mdi:monitor-dashboard'
                        width={14}
                        height={14}
                        className={isDark ? 'text-gray-400' : 'text-gray-600'}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Serial Monitor
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {
                        currentSerialBuffer.split('\n').filter((l) => l.trim())
                          .length
                      }{' '}
                      lines
                    </div>
                  </div>{' '}
                  {/* Bottom row - Action buttons (full width, buttons on right) */}
                  <div className='flex items-center justify-start w-full gap-2'>
                    {activeTab === 'scroll' && (
                      <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                          autoScroll
                            ? isDark
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                            : isDark
                              ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                        }`}
                        title='Toggle auto scroll'
                      >
                        <Icon
                          icon={
                            autoScroll
                              ? 'mdi:arrow-down'
                              : 'mdi:arrow-down-bold-outline'
                          }
                          width={12}
                          height={12}
                        />
                        Auto Scroll
                      </button>
                    )}

                    <button
                      onClick={handleCopyToClipboard}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                      title='Copy to clipboard'
                    >
                      <Icon icon='mdi:content-copy' width={12} height={12} />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setSerialBuffer('');
                        setLatestJsonData(null);
                        if (onClearSerialBuffer) {
                          onClearSerialBuffer();
                        }
                        showToastMessage('Serial buffer cleared');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 w-full justify-center ${
                        isDark
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      }`}
                      title='Clear buffer'
                    >
                      <Icon icon='mdi:delete-sweep' width={12} height={12} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Auto-scroll target */}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
      {/* Toast notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <div className='flex items-center gap-2'>
            <Icon
              icon='mdi:check-circle'
              width={16}
              height={16}
              className='text-green-500'
            />
            <span className='text-sm font-medium'>{toastMessage}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LogsCard;
