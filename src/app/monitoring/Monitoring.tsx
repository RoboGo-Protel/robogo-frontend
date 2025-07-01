"use client";
import React, { useEffect, useState } from "react";
import LeftArea_Monitoring from "@/components/ui/monitoring/LeftArea_Monitoring";
import MidArea_Monitoring from "@/components/ui/monitoring/MidArea_Monitoring";
import RightArea_Monitoring from "@/components/ui/monitoring/RightArea_Monitoring";
import { useDarkMode } from "@/context/DarkModeContext";
import { database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";
import { SyncLoader } from "react-spinners";
import { StopMonitoringResultProvider } from "@/components/ui/monitoring/StopMonitoringResultContext";
import { useUserConfig } from '@/hooks/useUserConfig';
import { useUser } from '@/hooks/useUser';
import { useLocalMode } from '@/context/LocalModeContext';

interface Data {
  id: string;
  src: string;
  alt: string;
  obstacle: boolean;
  date: string;
  fileName: string;
  createdAt: string;
  metadata: Metadata;
  sessionId: number;
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

export default function Monitoring() {
  const { isDark } = useDarkMode();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [modeChecked, setModeChecked] = useState(false);

  // Auto Photo state - only used in local mode
  const [autoPhotoEnabled, setAutoPhotoEnabled] = useState<boolean>(false);

  // Auto photo toggle handler
  const handleAutoPhotoToggle = (enabled: boolean) => {
    setAutoPhotoEnabled(enabled);
    console.log(
      `🚨 [AUTO PHOTO] ${enabled ? 'Enabled' : 'Disabled'} from settings - will capture photos when obstacles detected (<10cm)`,
    );
  };

  // Get user and device context
  const { user, loading: userLoading } = useUser();
  const { selectedDevice, deviceChangeVersion } = useUserConfig(); // Get local mode context for serial data
  const { isLocalMode, serialBuffer, localData, isConnected } = useLocalMode();
  // Debug: Log local data
  useEffect(() => {
    console.log('🔍 [MONITORING DEBUG] isLocalMode:', isLocalMode);
    console.log('🔍 [MONITORING DEBUG] isConnected:', isConnected);
    if (localData) {
      console.log(
        '🔍 [MONITORING DEBUG] localData from useLocalMode:',
        localData,
      );
      console.log(
        '🔍 [MONITORING DEBUG] distanceTraveled:',
        localData.distanceTraveled,
      );
      console.log('🔍 [MONITORING DEBUG] ultrasonic:', localData.ultrasonic);
      console.log('🔍 [MONITORING DEBUG] velocity:', localData.velocity);
    } else {
      console.log('🔍 [MONITORING DEBUG] localData is null/undefined');
    }
  }, [localData, isLocalMode, isConnected]);

  // Only proceed if we have both user ID and selected device (online)
  const canFetch = !isOffline && user?.id && selectedDevice?.id;
  // Reset data and session when device changes (only for online mode)
  useEffect(() => {
    // Skip all Firebase operations in offline mode
    if (isOffline) {
      setData([]);
      setCurrentSession(null);
      setLoading(false);
      return;
    }

    if (!canFetch) {
      setData([]);
      setCurrentSession(null);
      setLoading(false);
      return;
    }
    setData([]);
    setCurrentSession(null);
    setLoading(true);
  }, [canFetch, user?.id, selectedDevice?.id, isOffline]); // Remove deviceChangeVersion

  useEffect(() => {
    // Skip all Firebase operations in offline mode
    if (isOffline) {
      setData([]);
      setLoading(false);
      return;
    }

    if (!canFetch || currentSession === null) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Hanya gunakan user.id jika online
    let userId: string | undefined = undefined;
    if (!isOffline && user) userId = user.id;
    const deviceId = selectedDevice.id;
    if (!userId && !isOffline) return;
    // Listen to user-scoped realtime monitoring data (online only)
    const dbRef = ref(
      database,
      `users/${userId}/${deviceId}/realtime_monitoring/${currentSession}`,
    );
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        setData([]);
        setLoading(false);
        return;
      }
      const array = Object.entries(value)
        .map(([id, item]) => ({
          id,
          ...(item as Omit<Data, 'id'>),
        }))
        .filter(
          (item: Data) =>
            item.metadata && Object.keys(item.metadata).length > 0,
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      setData(array);
      setLoading(false);
      console.log(
        'Loaded user-scoped data from session:',
        currentSession,
        array,
        { userId, deviceId },
      );
    });
    return () => unsubscribe();
  }, [
    canFetch,
    user,
    selectedDevice,
    currentSession,
    isOffline, // Add isOffline to dependencies and remove deviceChangeVersion
  ]);

  useEffect(() => {
    const top = document.querySelector('#top-navbar');
    const bottom = document.querySelector('#bottom-navbar');

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cek localMode saat mount
  useEffect(() => {
    (async () => {
      if (
        typeof window !== 'undefined' &&
        window.electronAPI &&
        window.electronAPI.getConfig
      ) {
        try {
          const localMode = await window.electronAPI.getConfig('localMode');
          setIsOffline(localMode === true);
        } catch {
          setIsOffline(false);
        }
      }
      setModeChecked(true);
    })();
  }, []);

  const renderContent = () => {
    // Tunggu pengecekan mode offline/online
    if (!modeChecked) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <SyncLoader color={isDark ? '#fff' : '#112133'} size={12} />
          <span className='ml-3'>Checking mode...</span>
        </div>
      );
    } // Di offline mode, port selector dan area monitoring selalu tampil
    if (isOffline) {
      return (
        <>
          {/* Area monitoring tetap tampil di offline mode tanpa tombol connect/disconnect ESP32 */}
          <LeftArea_Monitoring
            key={`left-offline`}
            dataMonitoring={data}
            isLocalMode={true}
            isConnected={isConnected}
            serialBuffer={serialBuffer}
            liveSerialData={
              localData
                ? {
                    ultrasonic: localData.ultrasonic,
                    heading: localData.heading,
                    direction: localData.direction,
                    accelerationMagnitude: localData.accelerationMagnitude,
                    rotationRate: localData.rotationRate,
                    distanceTraveled: localData.distanceTraveled,
                    linearAcceleration: localData.linearAcceleration,
                    velocity: localData.velocity,
                    velocityX: localData.velocityX,
                    velocityY: localData.velocityY,
                    position: {
                      positionX: localData.positionX,
                      positionY: localData.positionY,
                    },
                    pitch: localData.pitch,
                    roll: localData.roll,
                    yaw: localData.yaw,
                  }
                : null
            }
          />{' '}
          <MidArea_Monitoring
            key={`mid-offline`}
            dataMonitoring={data}
            currentSession={currentSession}
            isLocalMode={true}
            isConnected={isConnected}
            serialBuffer={serialBuffer}
            autoPhotoEnabled={autoPhotoEnabled}
            onAutoPhotoToggle={handleAutoPhotoToggle}
            liveSerialData={
              localData
                ? {
                    ultrasonic: localData.ultrasonic,
                    heading: localData.heading,
                    direction: localData.direction,
                    accelerationMagnitude: localData.accelerationMagnitude,
                    rotationRate: localData.rotationRate,
                    distanceTraveled: localData.distanceTraveled,
                    linearAcceleration: localData.linearAcceleration,
                    velocity: localData.velocity,
                    velocityX: localData.velocityX,
                    velocityY: localData.velocityY,
                    position: {
                      positionX: localData.positionX,
                      positionY: localData.positionY,
                    },
                    pitch: localData.pitch,
                    roll: localData.roll,
                    yaw: localData.yaw,
                  }
                : null
            }
          />{' '}
          <RightArea_Monitoring
            key={`right-offline`}
            serialBuffer={serialBuffer}
            liveSerialData={
              localData
                ? {
                    // Basic sensor data
                    ultrasonic: localData.ultrasonic,
                    heading: localData.heading,
                    direction: localData.direction,
                    accelerationMagnitude: localData.accelerationMagnitude,
                    rotationRate: localData.rotationRate,
                    distanceTraveled: localData.distanceTraveled,
                    linearAcceleration: localData.linearAcceleration,
                    velocity: localData.velocity,
                    velocityX: localData.velocityX,
                    velocityY: localData.velocityY,
                    position: {
                      positionX: localData.positionX,
                      positionY: localData.positionY,
                    },
                    pitch: localData.pitch,
                    roll: localData.roll,
                    yaw: localData.yaw,
                    // Additional fields for LogsCard
                    senderMac: localData.senderMac,
                    obstacle: localData.obstacle,
                    timestamp: localData.timestamp,
                    receivedAt: localData.receivedAt,
                    rssi: localData.rssi,
                    rssiDistance: localData.rssiDistance,
                    // Accelerometer details
                    accelX: localData.accelX,
                    accelY: localData.accelY,
                    accelZ: localData.accelZ,
                    // Gyroscope details
                    gyroX: localData.gyroX,
                    gyroY: localData.gyroY,
                    gyroZ: localData.gyroZ, // Magnetometer details (use direct field names to match LogsCard)
                    magX: localData.magX,
                    magY: localData.magY,
                    magZ: localData.magZ,
                    magnetometer: {
                      magnetometerX: localData.magX,
                      magnetometerY: localData.magY,
                      magnetometerZ: localData.magZ,
                    },
                    // Device status
                    mainDeviceStatus: localData.mainDeviceStatus,
                    ultrasonicSensorStatus: localData.ultrasonicSensorStatus,
                    imuSensorStatus: localData.imuSensorStatus,
                  }
                : null
            }
          />
        </>
      );
    }
    // Online mode: cek selectedDevice seperti biasa
    if (userLoading) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <SyncLoader color={isDark ? '#fff' : '#112133'} size={12} />
          <span className='ml-3'>Loading user data...</span>
        </div>
      );
    }
    if (!user) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <div className='text-center'>
            <p className='text-lg mb-2'>Authentication required</p>
            <p className='text-sm opacity-70'>
              Please log in to access monitoring data
            </p>
          </div>
        </div>
      );
    }
    if (!selectedDevice) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <div className='text-center'>
            <p className='text-lg mb-2'>No device selected</p>
            <p className='text-sm opacity-70'>
              Please select a device from settings to view monitoring data
            </p>
          </div>
        </div>
      );
    }
    if (loading) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <SyncLoader color={isDark ? '#fff' : '#112133'} size={12} />
          <span className='ml-3'>Loading monitoring data...</span>
        </div>
      );
    }
    return (
      <>
        {' '}
        <LeftArea_Monitoring
          key={`left-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`}
          dataMonitoring={data}
          serialBuffer={serialBuffer}
        />{' '}
        <MidArea_Monitoring
          key={`mid-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`}
          dataMonitoring={data}
          currentSession={currentSession}
          isLocalMode={false}
          isConnected={true}
          serialBuffer={serialBuffer}
          autoPhotoEnabled={autoPhotoEnabled}
          onAutoPhotoToggle={handleAutoPhotoToggle}
        />{' '}
        <RightArea_Monitoring
          key={`right-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`}
          serialBuffer={serialBuffer}
          liveSerialData={null}
        />
      </>
    );
  };

  return (
    <StopMonitoringResultProvider>
      <div
        className={`flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen md:h-screen p-5 ${
          isDark ? 'bg-[#112133] text-white' : 'bg-white text-black'
        }`}
        style={{
          paddingTop: topNavbarHeight,
          paddingBottom: bottomNavbarHeight + 20,
        }}
      >
        {renderContent()}
      </div>
    </StopMonitoringResultProvider>
  );
}
