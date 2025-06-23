import React, { useEffect, useState } from "react";
import CurrentPosition from '@/components/cards/CurrentPositionCard';
import { AnimatePresence } from 'framer-motion';
import PhotoDetailsWithPaths from '@/components/PhotoDetailsWithPaths';
import ImagesCard from '@/components/cards/ImagesCard';

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
  };  position?: {
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
              console.log(
                '📷 [LOCAL IMAGES] Fetching images from local folder...',
              );
              console.log(
                '📷 [LOCAL IMAGES] ElectronAPI available:',
                !!window.electronAPI,
              );
              console.log(
                '📷 [LOCAL IMAGES] getImagesFromFolder method available:',
                !!window.electronAPI.getImagesFromFolder,
              ); // Get images from the reports/gallery/originals folder
              const result = await window.electronAPI.getImagesFromFolder(
                'reports/gallery/originals',
              );

              console.log('📷 [LOCAL IMAGES] API call result:', result);
              if (result.success && result.images) {
                console.log(
                  '📷 [LOCAL IMAGES] Raw images data:',
                  result.images,
                );

                // Filter to show only original images (without metadata overlay)
                const originalImages = result.images.filter(
                  (img) =>
                    img.fileName.includes('_original.') ||
                    (!img.fileName.includes('_original.') &&
                      !img.fileName.endsWith('.json')),
                );

                console.log(
                  '📷 [LOCAL IMAGES] Filtered original images:',
                  originalImages,
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

                console.log(
                  '📷 [LOCAL IMAGES] Formatted original images:',
                  formattedImages,
                );
                console.log(
                  '📷 [LOCAL IMAGES] Setting',
                  formattedImages.length,
                  'original images to state',
                );
                setListPhotoWithDate(formattedImages);
              } else {
                console.log(
                  '📷 [LOCAL IMAGES] No images found or error:',
                  result,
                );
                setListPhotoWithDate([]);
              }
            } catch (electronError) {
              console.error(
                '📷 [LOCAL IMAGES] Error getting images from electron:',
                electronError,
              );
              setListPhotoWithDate([]);
            }
          } else {
            console.log('📷 [LOCAL IMAGES] Electron API not available');
            setListPhotoWithDate([]);
          }
        } else {
          // For online mode, get images from Firebase/realtime API
          const response = await fetch('/api/monitoring/realtime/images');
          const data = await response.json();
          setListPhotoWithDate(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
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
        {/* Auto Reconnect Control for Local Mode */}
        {/* {isLocalMode && <AutoReconnectControl />} */}{' '}
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
