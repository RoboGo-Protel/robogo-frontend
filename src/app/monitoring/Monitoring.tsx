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

export default function Monitoring() {
  const { isDark } = useDarkMode();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<number | null>(null);  // Get user and device context
  const { user, loading: userLoading } = useUser();
  const { selectedDevice, deviceChangeVersion } = useUserConfig();
  // Only proceed if we have both user ID and selected device
  const canFetch = user?.id && selectedDevice?.id;
  // Reset data and session when device changes
  useEffect(() => {
    if (!canFetch) {
      setData([]);
      setCurrentSession(null);
      setLoading(false);
      return;
    }

    // Reset state when device changes
    setData([]);
    setCurrentSession(null);
    setLoading(true);
  }, [canFetch, user?.id, selectedDevice?.id, deviceChangeVersion]);

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    const userId = user.id;
    const deviceId = selectedDevice.id;

    // Listen to user-scoped current session
    const sessionRef = ref(
      database,
      `users/${userId}/${deviceId}/current_session`,
    );
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const session = snapshot.val();
      const sessionNumber =
        typeof session === 'number' ? session : Number(session);
      console.log('Fetched current_session for user/device:', sessionNumber, {
        userId,
        deviceId,
      });
      setCurrentSession(isNaN(sessionNumber) ? null : sessionNumber);
    });    return () => unsubscribe();
  }, [canFetch, user?.id, selectedDevice?.id, deviceChangeVersion]);
  useEffect(() => {
    if (!canFetch || currentSession === null) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const userId = user.id;
    const deviceId = selectedDevice.id;

    // Listen to user-scoped realtime monitoring data
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
    });    return () => unsubscribe();
  }, [canFetch, user?.id, selectedDevice?.id, currentSession, deviceChangeVersion]);

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
  const renderContent = () => {
    // Show loading if user data is being fetched
    if (userLoading) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <SyncLoader color={isDark ? '#fff' : '#112133'} size={12} />
          <span className='ml-3'>Loading user data...</span>
        </div>
      );
    }

    // Show message if user is not authenticated
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

    // Show message if no device is selected
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

    // Show loading if data is being fetched
    if (loading) {
      return (
        <div className='w-full flex justify-center items-center min-h-[200px]'>
          <SyncLoader color={isDark ? '#fff' : '#112133'} size={12} />
          <span className='ml-3'>Loading monitoring data...</span>
        </div>
      );
    }    return (
      <>
        <LeftArea_Monitoring key={`left-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`} dataMonitoring={data} />
        <MidArea_Monitoring
          key={`mid-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`}
          dataMonitoring={data}
          currentSession={currentSession}
        />
        <RightArea_Monitoring key={`right-${selectedDevice?.id || 'no-device'}-${deviceChangeVersion}`} dataMonitoring={data} />
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
