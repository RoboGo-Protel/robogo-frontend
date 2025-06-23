"use client";

import React from 'react';
import LogsCard from '@/components/cards/LogsCard';
import { useLocalMode } from '@/context/LocalModeContext';

interface RightAreaMonitoringProps {
  serialBuffer?: string;
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
  } | null;
}

export default function RightArea_Monitoring({
  serialBuffer = '',
  liveSerialData = null,
}: RightAreaMonitoringProps) {
  const { connectedPort, clearSerialBuffer } = useLocalMode();

  return (
    <div className='flex flex-col items-start justify-start w-full md:w-auto max-w-[450px] md:min-w-[450px] gap-4 h-full'>
      {' '}
      <LogsCard
        serialBuffer={serialBuffer}
        connectedPort={connectedPort || ''}
        onClearSerialBuffer={clearSerialBuffer}
        liveSerialData={liveSerialData}
      />
    </div>
  );
}
