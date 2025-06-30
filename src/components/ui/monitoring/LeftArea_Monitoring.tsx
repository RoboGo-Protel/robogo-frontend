import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import CurrentPosition from '@/components/cards/CurrentPositionCard';
import { AnimatePresence } from 'framer-motion';
import PhotoDetailsWithPaths from '@/components/PhotoDetailsWithPaths';
import ImagesCard from '@/components/cards/ImagesCard';
import { infoItems } from '@/utils/info';
import ShortInfo from '@/components/cards/ShortInfoCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';
import { useLocalMode } from '@/context/LocalModeContext';
import clsx from 'clsx';

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
  };
  position?: {
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

interface Image {
  id: string;
  filename: string;
  path: string;
  imageUrl: string;
  timestamp: string;
  sessionId: number | string;
  category: boolean | string;
  takenWith: string;
  metadata: Metadata;
  obstacle?: boolean;
  createdAt: string;
}

interface LeftAreaMonitoringProps {
  dataMonitoring: Data[];
  isLocalMode?: boolean;
  isConnected?: boolean;
  connectedPort?: string | null;
  serialBuffer?: string;
  liveSerialData?: Metadata | null;
}

export default function LeftArea_Monitoring({
  dataMonitoring,
  isLocalMode = false,
  serialBuffer = '',
  liveSerialData = null,
}: LeftAreaMonitoringProps) {
  const { isDark } = useDarkMode();
  const { config } = useUserConfig();
  const { connectedPort, isConnected } = useLocalMode();
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [listPhotoWithDate, setListPhotoWithDate] = useState<Image[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata: Metadata;
  }>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Use the device status hook
  const {
    status: deviceStatus,
    refreshStatus,
    loading,
    updateAllComponents,
  } = useDeviceStatus(deviceName);

  // Auto-update device status when ESP32 connects/disconnects
  useEffect(() => {
    const autoUpdateStatus = async () => {
      if (deviceName) {
        if (isConnected && connectedPort) {
          // Auto set all components to ON when connected
          await updateAllComponents('ON');
        } else if (!isConnected || !connectedPort) {
          // Auto set all components to OFF when disconnected or no port
          await updateAllComponents('OFF');
        }
      }
    };

    autoUpdateStatus();
  }, [isConnected, connectedPort, deviceName, updateAllComponents]);

  // Additional effect to handle connectedPort changes specifically
  useEffect(() => {
    const handlePortStatusChange = async () => {
      if (deviceName) {
        if (connectedPort) {
          // When port is connected, set all components to ON
          await updateAllComponents('ON');
        } else {
          // When no port is connected, set all components to OFF
          await updateAllComponents('OFF');
        }
      }
    };

    handlePortStatusChange();
  }, [connectedPort, deviceName, updateAllComponents]);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    if (deviceName) {
      await refreshStatus();
    }
  };

  // Get deviceName from selected device
  useEffect(() => {
    const fetchDeviceName = async () => {
      if (!config?.selectedDevice) {
        setDeviceName(null);
        return;
      }

      try {
        // In local mode, use the device name directly from config
        const deviceName = config.selectedDevice; // Assuming it's already the device name
        setDeviceName(deviceName);
      } catch {
        // Error fetching device name handled silently
      }
    };

    fetchDeviceName();
  }, [config?.selectedDevice]);

  // Create dynamic info items with status from device
  const dynamicInfoItems = infoItems.map((item) => {
    // If connectedPort exists, override status to 'ON', otherwise use device status
    const currentStatus = connectedPort
      ? 'ON'
      : deviceStatus
        ? deviceStatus[item.component]
        : item.status;

    return {
      ...item,
      status: currentStatus,
    };
  });
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoadingImages(true);
        if (isLocalMode) {
          // For local mode, get images from electron folder using electronAPI
          if (
            typeof window !== 'undefined' &&
            window.electronAPI?.getImagesFromFolder
          ) {
            try {
              // Get images from the reports/gallery/originals folder
              const result = await window.electronAPI.getImagesFromFolder(
                'reports/gallery/originals',
              );

              if (result.success && result.images) {
                // Filter to show only original images (without metadata overlay)
                const originalImages = result.images.filter(
                  (img) =>
                    img.fileName.includes('_original.') ||
                    (!img.fileName.includes('_original.') &&
                      !img.fileName.endsWith('.json')),
                );

                // Convert electron image data to the format expected by ImagesCard
                const formattedImages: Image[] = originalImages.map((img) => ({
                  id: img.fileName,
                  filename: img.fileName,
                  path: img.filePath,
                  imageUrl: `file://${img.filePath}`, // Use file:// protocol for local images
                  timestamp: img.dateCreated,
                  sessionId: 'local',
                  category: false,
                  takenWith: 'local_capture',
                  obstacle: false, // Default to false for local images
                  createdAt: img.dateCreated,
                  metadata: {
                    ultrasonic: 0,
                    heading: 0,
                    direction: 'Unknown',
                    accelerationMagnitude: 0,
                    rotationRate: 0,
                    distanceTraveled: 0,
                    linearAcceleration: 0,
                    velocity: 0,
                    velocityX: 0,
                    velocityY: 0,
                    position: { positionX: 0, positionY: 0 },
                    pitch: 0,
                    roll: 0,
                    yaw: 0,
                  },
                }));

                setListPhotoWithDate(formattedImages);
              } else {
                setListPhotoWithDate([]);
              }
            } catch {
              setListPhotoWithDate([]);
            }
          } else {
            setListPhotoWithDate([]);
          }
        } else {
          // For online mode, get images from Firebase/realtime API
          const response = await fetch('/api/monitoring/realtime/images');
          const data = await response.json();
          setListPhotoWithDate(data.data || []);
        }
      } catch {
        setListPhotoWithDate([]); // Set empty array on error
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchImages();
  }, [dataMonitoring, isLocalMode]);

  return (
    <>
      <div className='flex flex-col items-start justify-start w-full md:min-w-[450px] md:w-1/4 gap-4 h-full'>
        {/* Robot Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.4,
            ease: 'easeOut',
            type: 'spring',
            stiffness: 100,
          }}
          className={clsx(
            'relative flex flex-col w-full gap-2 rounded-2xl p-4 transition-all duration-300',
            isDark
              ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
              : 'bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200/50',
          )}
        >
          {/* Robot Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.4,
              type: 'spring',
              stiffness: 120,
            }}
            className='flex w-full justify-center mb-2'
          >
            <Image
              src='/images/robogo_g1.png'
              alt='RoboGo G1'
              width={80}
              height={80}
              className='select-none rounded-xl bg-white/20 object-contain'
              style={{ maxWidth: 80, maxHeight: 80 }}
            />
          </motion.div>

          {/* Title and Refresh Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className='flex flex-row items-center gap-2 mb-2'
          >
            <h2 className='text-lg font-bold truncate text-center w-full'>
              RoboGo G1
            </h2>
            {deviceName && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={loading}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                  loading
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:scale-105 active:scale-95',
                  isDark
                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200',
                )}
                title='Refresh device status'
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    loading
                      ? { duration: 1, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.3 }
                  }
                >
                  <Icon
                    icon={
                      loading
                        ? 'mingcute:loading-line'
                        : 'mingcute:refresh-2-line'
                    }
                    width={14}
                    height={14}
                  />
                </motion.div>
                {loading ? 'Refreshing...' : 'Refresh'}
              </motion.button>
            )}
          </motion.div>

          {/* Status Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className='mt-1'
          >
            <ShortInfo infoItems={dynamicInfoItems} />
          </motion.div>
        </motion.div>

        {/* Auto Reconnect Control for Local Mode */}
        {/* {isLocalMode && <AutoReconnectControl />} */}
        <ImagesCard
          listPhotoWithDate={listPhotoWithDate}
          isLoadingImages={isLoadingImages}
          setSelectedPhoto={setSelectedPhoto}
        />
        <CurrentPosition
          dataMonitoring={dataMonitoring}
          serialBuffer={serialBuffer}
          liveSerialData={liveSerialData}
          isLocalMode={isLocalMode}
        />
        {/* <ThreeDView /> */}
      </div>
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetailsWithPaths
            details={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
