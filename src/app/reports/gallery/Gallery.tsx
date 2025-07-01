/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence } from "framer-motion";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import SyncLoader from "react-spinners/SyncLoader";
import { PulseLoader } from "react-spinners";
import { useDarkMode } from "@/context/DarkModeContext";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useUserConfig } from '@/hooks/useUserConfig';

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

interface Metadata {
  ultrasonic?: number;
  heading?: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  velocity?: number;
  velocityX?: number;
  velocityY?: number;
  magnetometer?: {
    magnetometerX?: number;
    magnetometerY?: number;
    magnetometerZ?: number;
  };
  position?: {
    positionX?: number;
    positionY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

export default function Gallery() {
  const [listPhotoWithDate, setListPhotoWithDate] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'metadata'>('original');

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        console.log('📷 [GALLERY DEBUG] Checking local mode...');
        console.log(
          '📷 [GALLERY DEBUG] window available:',
          typeof window !== 'undefined',
        );
        console.log(
          '📷 [GALLERY DEBUG] electronAPI available:',
          typeof window !== 'undefined' && !!window.electronAPI,
        );
        console.log(
          '📷 [GALLERY DEBUG] getConfig available:',
          typeof window !== 'undefined' &&
            window.electronAPI &&
            !!window.electronAPI.getConfig,
        );

        // Check if running in Electron with local mode enabled
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          console.log(
            '📷 [GALLERY DEBUG] Local mode config from Electron:',
            localModeConfig,
          );
          setIsLocalMode(!!localModeConfig);
        } else {
          // Fallback: check from API if not in Electron
          console.log('📷 [GALLERY DEBUG] Falling back to API check...');
          const response = await fetch('/api/user/config');
          if (response.ok) {
            const data = await response.json();
            console.log(
              '📷 [GALLERY DEBUG] Local mode config from API:',
              data.data?.localMode,
            );
            setIsLocalMode(data.data?.localMode || false);
          }
        }
      } catch (error) {
        console.error('📷 [GALLERY DEBUG] Error checking local mode:', error);
        setIsLocalMode(false);
      }
    };

    checkLocalMode();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
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

  useEffect(() => {
    const reports = document.querySelector('#reports-navbar');
    const top = document.querySelector('#top-navbar');
    const bottom = document.querySelector('#bottom-navbar');

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    if (reports) setReportsNavbarHeight(reports.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      if (reports) setReportsNavbarHeight(reports.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topNavbarHeight, bottomNavbarHeight, reportsNavbarHeight]);

  useEffect(() => {
    const fetchImagesList = async () => {
      try {
        console.log('📷 [GALLERY DEBUG] fetchImagesList started');
        console.log('📷 [GALLERY DEBUG] isLocalMode:', isLocalMode);
        console.log('📷 [GALLERY DEBUG] selectedDevice:', selectedDevice);

        setIsLoading(true);

        if (isLocalMode) {
          // Local mode: Get images directly from Electron folder
          console.log('📷 [GALLERY DEBUG] isLocalMode:', isLocalMode);
          console.log(
            '📷 [GALLERY DEBUG] window.electronAPI:',
            typeof window !== 'undefined'
              ? !!window.electronAPI
              : 'window undefined',
          );
          console.log(
            '📷 [GALLERY DEBUG] getImagesFromFolder:',
            typeof window !== 'undefined' && window.electronAPI
              ? !!window.electronAPI.getImagesFromFolder
              : 'electronAPI not available',
          );

          if (
            typeof window !== 'undefined' &&
            window.electronAPI?.getImagesFromFolder
          ) {
            console.log(
              '📷 [GALLERY LOCAL] Fetching images from reports/gallery/originals...',
            );

            const result = await window.electronAPI.getImagesFromFolder(
              'reports/gallery/originals',
            );

            console.log('📷 [GALLERY DEBUG] API result:', result);

            // Also check the main gallery folder for legacy photos
            const legacyResult =
              await window.electronAPI.getImagesFromFolder('reports/gallery');
            console.log(
              '📷 [GALLERY DEBUG] Legacy gallery result:',
              legacyResult,
            );

            // Check metadata folder for metadata view
            const metadataResult = await window.electronAPI.getImagesFromFolder(
              'reports/gallery/metadata',
            );
            console.log(
              '📷 [GALLERY DEBUG] Metadata folder result:',
              metadataResult,
            ); // Combine results from both locations
            interface ElectronImage {
              fileName: string;
              filePath: string;
              dateCreated: string;
              size: number;
              isDirectory?: boolean;
              isJson?: boolean;
              stats?: {
                mtime: Date;
                ctime: Date;
                size: number;
              };
            }

            let allImages: ElectronImage[] = [];
            if (viewMode === 'original') {
              // Original view: Show original images only
              // Add images from originals subfolder
              if (result.success && result.images) {
                // Filter out folders and keep only image files
                const imageFiles = (result.images as ElectronImage[]).filter(
                  (img) => {
                    const isDirectory = img.isDirectory || false;
                    const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                      img.fileName,
                    );
                    const isNotFolder = ![
                      'originals',
                      'metadata',
                      'json',
                    ].includes(img.fileName);
                    return !isDirectory && isImageFile && isNotFolder;
                  },
                );

                console.log(
                  '📷 [GALLERY LOCAL] Found',
                  result.images.length,
                  'items in originals folder,',
                  imageFiles.length,
                  'are image files',
                );
                allImages = [...imageFiles];
              }

              // Add legacy images from main gallery folder (exclude subfolders and metadata files)
              if (legacyResult.success && legacyResult.images) {
                // Filter for original images only (no metadata or from subfolders, exclude directories)
                const legacyOriginalImages = (
                  legacyResult.images as ElectronImage[]
                ).filter((img) => {
                  const isDirectory = img.isDirectory || false;
                  const isInRoot =
                    !img.filePath.includes('\\originals\\') &&
                    !img.filePath.includes('\\metadata\\') &&
                    !img.filePath.includes('\\json\\');
                  const isNotMetadata = !img.fileName.includes('_metadata');
                  const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                    img.fileName,
                  );
                  const isNotFolder = ![
                    'originals',
                    'metadata',
                    'json',
                  ].includes(img.fileName);
                  return (
                    !isDirectory &&
                    isInRoot &&
                    isNotMetadata &&
                    isImageFile &&
                    isNotFolder
                  );
                });

                console.log(
                  '📷 [GALLERY LOCAL] Found',
                  legacyOriginalImages.length,
                  'legacy original images in main gallery folder',
                );
                allImages = [...allImages, ...legacyOriginalImages];
              }
            } else {
              // Metadata view: Show metadata images only
              // Add images from metadata subfolder
              if (metadataResult.success && metadataResult.images) {
                // Filter out folders and keep only image files
                const imageFiles = (
                  metadataResult.images as ElectronImage[]
                ).filter((img) => {
                  const isDirectory = img.isDirectory || false;
                  const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                    img.fileName,
                  );
                  const isNotFolder = ![
                    'originals',
                    'metadata',
                    'json',
                  ].includes(img.fileName);
                  return !isDirectory && isImageFile && isNotFolder;
                });

                console.log(
                  '📷 [GALLERY LOCAL] Found',
                  metadataResult.images.length,
                  'items in metadata folder,',
                  imageFiles.length,
                  'are image files',
                );
                allImages = [...imageFiles];
              }

              // Add legacy metadata images from main gallery folder
              if (legacyResult.success && legacyResult.images) {
                // Filter for metadata images only (exclude directories and folder names)
                const legacyMetadataImages = (
                  legacyResult.images as ElectronImage[]
                ).filter((img) => {
                  const isDirectory = img.isDirectory || false;
                  const isInRoot =
                    !img.filePath.includes('\\originals\\') &&
                    !img.filePath.includes('\\metadata\\') &&
                    !img.filePath.includes('\\json\\');
                  const isMetadata = img.fileName.includes('_metadata');
                  const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                    img.fileName,
                  );
                  const isNotFolder = ![
                    'originals',
                    'metadata',
                    'json',
                  ].includes(img.fileName);
                  return (
                    !isDirectory &&
                    isInRoot &&
                    isMetadata &&
                    isImageFile &&
                    isNotFolder
                  );
                });

                console.log(
                  '📷 [GALLERY LOCAL] Found',
                  legacyMetadataImages.length,
                  'legacy metadata images in main gallery folder',
                );
                allImages = [...allImages, ...legacyMetadataImages];
              }
            }

            if (allImages.length > 0) {
              console.log(
                '📷 [GALLERY DEBUG] Total images found:',
                allImages.length,
              );
              console.log(
                '📷 [GALLERY DEBUG] Combined images data:',
                allImages,
              );

              // Convert electron image data to Gallery format
              const formattedImages: Image[] = allImages.map((img) => ({
                id: img.fileName,
                filename: img.fileName,
                path: img.filePath,
                imageUrl: `file://${img.filePath}`,
                timestamp: img.dateCreated,
                sessionId: 'local',
                category: false,
                takenWith: 'local_capture',
                obstacle: false,
                createdAt: img.dateCreated,
                metadata: {
                  ultrasonic: -1, // Use -1 to indicate no data loaded yet
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
                '📷 [GALLERY DEBUG] Formatted images:',
                formattedImages,
              );
              setListPhotoWithDate(formattedImages);
            } else {
              console.log('📷 [GALLERY LOCAL] No images found in any location');
              setListPhotoWithDate([]);
            }
          } else {
            console.log('📷 [GALLERY LOCAL] Electron API not available');
            setListPhotoWithDate([]);
          }
        } else {
          // Online mode: Get images from API endpoint
          const deviceName = selectedDevice?.deviceName;
          if (!deviceName) {
            console.log('Waiting for device to be selected...');
            setListPhotoWithDate([]);
            setIsLoading(false);
            return;
          }

          const response = await fetch(
            `/api/monitoring/realtime/images?deviceName=${encodeURIComponent(deviceName)}`,
          );
          const data = await response.json();

          setListPhotoWithDate(data.data || []);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching images list:', error);
        setListPhotoWithDate([]);
        setIsLoading(false);
      }
    };

    fetchImagesList();
  }, [selectedDevice, isLocalMode, viewMode]);

  const groupPhotosByDate = (photos: Image[]) => {
    const grouped: { [date: string]: Image[] } = {};

    photos.forEach((photo) => {
      const dateKey = new Date(photo.createdAt).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });

    return grouped;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--top-navbar-height', `${topNavbarHeight}px`);
    root.style.setProperty(
      '--reports-navbar-height',
      `${reportsNavbarHeight}px`,
    );
  }, [topNavbarHeight, reportsNavbarHeight]);

  const groupedPhotos = groupPhotosByDate(listPhotoWithDate);

  // Handle photo click - get metadata from JSON file for original photos
  const handlePhotoClick = async (item: Image) => {
    console.log('📷 [GALLERY DEBUG] Photo clicked:', item.filename);
    console.log('📷 [GALLERY DEBUG] Current viewMode:', viewMode);
    console.log('📷 [GALLERY DEBUG] isLocalMode:', isLocalMode);
    console.log('📷 [GALLERY DEBUG] Original metadata:', item.metadata);

    let metadata = item.metadata; // Default to existing metadata

    // If in local mode and original view, try to load metadata from JSON file
    if (
      isLocalMode &&
      viewMode === 'original' &&
      typeof window !== 'undefined' &&
      window.electronAPI?.readFile
    ) {
      try {
        console.log('📷 [GALLERY DEBUG] Attempting to load JSON metadata...');

        // Extract base filename without _original suffix
        let baseFilename = item.filename;
        console.log('📷 [GALLERY DEBUG] Original filename:', baseFilename);

        if (baseFilename.includes('_original')) {
          baseFilename = baseFilename.replace('_original', '');
          console.log(
            '📷 [GALLERY DEBUG] Filename after removing _original:',
            baseFilename,
          );
        }

        // Change extension from image to .json
        const jsonFilename = baseFilename.replace(
          /\.(jpg|jpeg|png|bmp|gif)$/i,
          '.json',
        );

        console.log('📷 [GALLERY DEBUG] Looking for JSON file:', jsonFilename);
        console.log(
          '📷 [GALLERY DEBUG] Full JSON path: reports/gallery/json/' +
            jsonFilename,
        );

        // Try to read the JSON file from reports/gallery/json folder
        const jsonResult = await window.electronAPI.readFile(
          `reports/gallery/json/${jsonFilename}`,
        );

        console.log('📷 [GALLERY DEBUG] JSON read result:', jsonResult);

        if (jsonResult.success && jsonResult.content) {
          console.log(
            '📷 [GALLERY DEBUG] JSON file found, content:',
            jsonResult.content,
          );
          console.log('📷 [GALLERY DEBUG] Parsing JSON...');

          const jsonData = JSON.parse(jsonResult.content);
          console.log('📷 [GALLERY DEBUG] Parsed JSON data:', jsonData);

          // Map JSON data to metadata format
          if (jsonData && jsonData.sensorData) {
            const sensorData = jsonData.sensorData;

            console.log('📷 [GALLERY DEBUG] sensorData found:', sensorData);
            console.log(
              '📷 [GALLERY DEBUG] sensorData keys:',
              Object.keys(sensorData),
            );

            // Helper function to check if a value is valid (not null, undefined, or empty)
            const isValidSensorData = (value: unknown) => {
              return (
                value !== undefined &&
                value !== null &&
                value !== '' &&
                !Number.isNaN(Number(value))
              );
            };

            // Only include fields that have actual data
            const newMetadata: Partial<Metadata> = {};

            // Check and include each sensor field only if it has valid data
            if (isValidSensorData(sensorData.ultrasonic)) {
              newMetadata.ultrasonic = Number(sensorData.ultrasonic);
            }

            if (isValidSensorData(sensorData.heading)) {
              newMetadata.heading = Number(sensorData.heading);
            }

            if (sensorData.direction && sensorData.direction.trim() !== '') {
              newMetadata.direction = sensorData.direction;
            }

            if (isValidSensorData(sensorData.accelerationMagnitude)) {
              newMetadata.accelerationMagnitude = Number(
                sensorData.accelerationMagnitude,
              );
            }

            if (isValidSensorData(sensorData.rotationRate)) {
              newMetadata.rotationRate = Number(sensorData.rotationRate);
            }

            if (isValidSensorData(sensorData.distanceTraveled)) {
              newMetadata.distanceTraveled = Number(
                sensorData.distanceTraveled,
              );
            }

            if (isValidSensorData(sensorData.linearAcceleration)) {
              newMetadata.linearAcceleration = Number(
                sensorData.linearAcceleration,
              );
            }

            if (isValidSensorData(sensorData.velocity)) {
              newMetadata.velocity = Number(sensorData.velocity);
            }

            if (isValidSensorData(sensorData.velocityX)) {
              newMetadata.velocityX = Number(sensorData.velocityX);
            }

            if (isValidSensorData(sensorData.velocityY)) {
              newMetadata.velocityY = Number(sensorData.velocityY);
            }

            // Handle magnetometer data if available
            if (
              sensorData.magnetometer &&
              (isValidSensorData(sensorData.magnetometer.magnetometerX) ||
                isValidSensorData(sensorData.magnetometer.magnetometerY) ||
                isValidSensorData(sensorData.magnetometer.magnetometerZ))
            ) {
              newMetadata.magnetometer = {
                magnetometerX: isValidSensorData(
                  sensorData.magnetometer.magnetometerX,
                )
                  ? Number(sensorData.magnetometer.magnetometerX)
                  : undefined,
                magnetometerY: isValidSensorData(
                  sensorData.magnetometer.magnetometerY,
                )
                  ? Number(sensorData.magnetometer.magnetometerY)
                  : undefined,
                magnetometerZ: isValidSensorData(
                  sensorData.magnetometer.magnetometerZ,
                )
                  ? Number(sensorData.magnetometer.magnetometerZ)
                  : undefined,
              };
            }

            // Handle position data if available
            if (
              sensorData.position &&
              (isValidSensorData(sensorData.position.positionX) ||
                isValidSensorData(sensorData.position.posX) ||
                isValidSensorData(sensorData.position.positionY) ||
                isValidSensorData(sensorData.position.posY))
            ) {
              newMetadata.position = {};

              if (
                isValidSensorData(sensorData.position.positionX) ||
                isValidSensorData(sensorData.position.posX)
              ) {
                newMetadata.position.positionX =
                  Number(sensorData.position.positionX) ||
                  Number(sensorData.position.posX);
              }

              if (
                isValidSensorData(sensorData.position.positionY) ||
                isValidSensorData(sensorData.position.posY)
              ) {
                newMetadata.position.positionY =
                  Number(sensorData.position.positionY) ||
                  Number(sensorData.position.posY);
              }
            }

            if (isValidSensorData(sensorData.pitch)) {
              newMetadata.pitch = Number(sensorData.pitch);
            }

            if (isValidSensorData(sensorData.roll)) {
              newMetadata.roll = Number(sensorData.roll);
            }

            if (isValidSensorData(sensorData.yaw)) {
              newMetadata.yaw = Number(sensorData.yaw);
            }

            console.log(
              '📷 [GALLERY DEBUG] New metadata created from available sensorData:',
              newMetadata,
            );
            console.log(
              '📷 [GALLERY DEBUG] Available sensor data keys:',
              Object.keys(newMetadata),
            );

            metadata = newMetadata;
          } else {
            console.log(
              '📷 [GALLERY DEBUG] No sensorData found in JSON, trying direct mapping...',
            );

            // Fallback: try direct mapping if sensorData is not available
            const isValidDirectData = (value: unknown) => {
              return (
                value !== undefined &&
                value !== null &&
                value !== '' &&
                !Number.isNaN(Number(value))
              );
            };

            const newMetadata: Partial<Metadata> = {};

            // Check and include each field only if it has valid data
            if (isValidDirectData(jsonData.ultrasonic)) {
              newMetadata.ultrasonic = Number(jsonData.ultrasonic);
            }

            if (isValidDirectData(jsonData.heading)) {
              newMetadata.heading = Number(jsonData.heading);
            }

            if (jsonData.direction && jsonData.direction.trim() !== '') {
              newMetadata.direction = jsonData.direction;
            }

            if (isValidDirectData(jsonData.accelerationMagnitude)) {
              newMetadata.accelerationMagnitude = Number(
                jsonData.accelerationMagnitude,
              );
            }

            if (isValidDirectData(jsonData.rotationRate)) {
              newMetadata.rotationRate = Number(jsonData.rotationRate);
            }

            if (isValidDirectData(jsonData.distanceTraveled)) {
              newMetadata.distanceTraveled = Number(jsonData.distanceTraveled);
            }

            if (isValidDirectData(jsonData.linearAcceleration)) {
              newMetadata.linearAcceleration = Number(
                jsonData.linearAcceleration,
              );
            }

            if (isValidDirectData(jsonData.velocity)) {
              newMetadata.velocity = Number(jsonData.velocity);
            }

            if (isValidDirectData(jsonData.velocityX)) {
              newMetadata.velocityX = Number(jsonData.velocityX);
            }

            if (isValidDirectData(jsonData.velocityY)) {
              newMetadata.velocityY = Number(jsonData.velocityY);
            }

            // Handle magnetometer data if available
            if (
              jsonData.magnetometer &&
              (isValidDirectData(jsonData.magnetometer.magnetometerX) ||
                isValidDirectData(jsonData.magnetometer.magnetometerY) ||
                isValidDirectData(jsonData.magnetometer.magnetometerZ))
            ) {
              newMetadata.magnetometer = {};

              if (isValidDirectData(jsonData.magnetometer.magnetometerX)) {
                newMetadata.magnetometer.magnetometerX = Number(
                  jsonData.magnetometer.magnetometerX,
                );
              }

              if (isValidDirectData(jsonData.magnetometer.magnetometerY)) {
                newMetadata.magnetometer.magnetometerY = Number(
                  jsonData.magnetometer.magnetometerY,
                );
              }

              if (isValidDirectData(jsonData.magnetometer.magnetometerZ)) {
                newMetadata.magnetometer.magnetometerZ = Number(
                  jsonData.magnetometer.magnetometerZ,
                );
              }
            }

            // Handle position data if available
            if (
              jsonData.position &&
              (isValidDirectData(jsonData.position.positionX) ||
                isValidDirectData(jsonData.position.positionY))
            ) {
              newMetadata.position = {};

              if (isValidDirectData(jsonData.position.positionX)) {
                newMetadata.position.positionX = Number(
                  jsonData.position.positionX,
                );
              }

              if (isValidDirectData(jsonData.position.positionY)) {
                newMetadata.position.positionY = Number(
                  jsonData.position.positionY,
                );
              }
            }

            if (isValidDirectData(jsonData.pitch)) {
              newMetadata.pitch = Number(jsonData.pitch);
            }

            if (isValidDirectData(jsonData.roll)) {
              newMetadata.roll = Number(jsonData.roll);
            }

            if (isValidDirectData(jsonData.yaw)) {
              newMetadata.yaw = Number(jsonData.yaw);
            }

            console.log(
              '📷 [GALLERY DEBUG] New metadata created from direct mapping:',
              newMetadata,
            );
            metadata = newMetadata;
          }
        } else {
          console.log(
            '📷 [GALLERY DEBUG] JSON file not found or read failed:',
            jsonResult.error || 'No content',
          );
          console.log(
            '📷 [GALLERY DEBUG] Using empty metadata for missing JSON file',
          );

          // For original photos without JSON file, use empty metadata
          // This will result in no stats cards being shown
          if (viewMode === 'original') {
            metadata = {}; // Empty metadata object
            console.log('📷 [GALLERY DEBUG] Using empty metadata:', metadata);
          }
        }
      } catch (error) {
        console.error('📷 [GALLERY DEBUG] Error loading JSON metadata:', error);

        // Use empty metadata when there's an error loading JSON file
        if (viewMode === 'original') {
          metadata = {}; // Empty metadata object
          console.log(
            '📷 [GALLERY DEBUG] Using empty metadata due to error:',
            metadata,
          );
        }
      }
    } else {
      console.log('📷 [GALLERY DEBUG] Skipping JSON metadata loading because:');
      console.log('  - isLocalMode:', isLocalMode);
      console.log('  - viewMode === original:', viewMode === 'original');
      console.log('  - window available:', typeof window !== 'undefined');
      console.log(
        '  - electronAPI available:',
        typeof window !== 'undefined' && !!window.electronAPI,
      );
      console.log(
        '  - readFile available:',
        typeof window !== 'undefined' &&
          window.electronAPI &&
          !!window.electronAPI.readFile,
      );

      // For original view in non-local mode or when Electron API is not available,
      // use empty metadata if no metadata is available
      if (viewMode === 'original') {
        metadata = metadata || {}; // Use empty object if no metadata
        console.log(
          '📷 [GALLERY DEBUG] Using metadata for original view (non-local):',
          metadata,
        );
      }
    }

    console.log('📷 [GALLERY DEBUG] Final metadata to be set:', metadata);
    console.log(
      '📷 [GALLERY DEBUG] Final metadata object keys:',
      Object.keys(metadata || {}),
    );
    console.log(
      '📷 [GALLERY DEBUG] Final metadata object values:',
      Object.values(metadata || {}),
    );
    console.log('📷 [GALLERY DEBUG] viewMode at photo click:', viewMode);

    // Set selected photo with the metadata (either from JSON or default)
    const photoDetails = {
      id: item.id,
      src: item.imageUrl || '/images/no_image.png',
      alt: item.filename,
      obstacle: item.obstacle ?? false,
      date: item.timestamp,
      fileName: item.filename,
      createdAt: item.createdAt,
      metadata: metadata,
      fromTab: viewMode, // Pass the current view mode to know which tab the photo came from
    };

    console.log('📷 [GALLERY DEBUG] Setting selectedPhoto to:', photoDetails);
    setSelectedPhoto(photoDetails);
  };

  // Don't render content until we have a selected device (only required in online mode)
  if (!isLocalMode && !selectedDevice?.deviceName) {
    return (
      <div
        className={clsx(
          'flex flex-col justify-center items-center p-5',
          isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
        )}
        style={{
          paddingTop: topNavbarHeight + reportsNavbarHeight,
          paddingBottom: bottomNavbarHeight + 20,
          height: `calc(100vh - ${
            topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
          }px)`,
        }}
      >
        <PulseLoader color='#60a5fa' loading={true} size={15} margin={5} />
        <p
          className={clsx(
            'mt-4 text-lg text-center',
            isDark ? 'text-gray-300' : 'text-gray-500',
          )}
        >
          Loading device configuration...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* View Mode Toggle - Fixed header, only show in local mode */}
      {isLocalMode && (
        <div
          className={clsx(
            'fixed w-full z-20 transition-colors duration-300',
            isDark ? 'bg-[#112133]' : 'bg-white',
          )}
          style={{
            top: topNavbarHeight + reportsNavbarHeight,
          }}
        >
          <div className='flex flex-row items-center justify-between px-5 py-4'>
            <div className='flex flex-row items-center gap-2'>
              <Icon
                icon='tabler:photo'
                width={24}
                height={24}
                className={isDark ? 'text-blue-400' : 'text-blue-500'}
              />
              <h2
                className={clsx(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-gray-800',
                )}
              >
                Gallery View
              </h2>
            </div>

            <div
              className={clsx(
                'flex flex-row items-center rounded-xl p-1 transition-colors duration-200',
                isDark
                  ? 'bg-[#1e293b] border border-gray-600'
                  : 'bg-gray-100 border border-gray-200',
              )}
            >
              <button
                onClick={() => setViewMode('original')}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'original'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-400 text-white shadow-md'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200',
                )}
              >
                <div className='flex flex-row items-center gap-2'>
                  <Icon icon='tabler:photo' width={16} height={16} />
                  Original
                </div>
              </button>

              <button
                onClick={() => setViewMode('metadata')}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'metadata'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-400 text-white shadow-md'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200',
                )}
              >
                <div className='flex flex-row items-center gap-2'>
                  <Icon
                    icon='fluent:document-data-16-filled'
                    width={16}
                    height={16}
                  />
                  Metadata
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={clsx(
          'flex flex-col gap-4 p-5 transition-colors duration-300',
          isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
        )}
        style={{
          paddingTop:
            topNavbarHeight + reportsNavbarHeight + (isLocalMode ? 78 : 0), // Increased padding for header + spacing
          paddingBottom: bottomNavbarHeight + 20,
        }}
      >
        {isLoading ? (
          <div
            className='flex flex-col justify-center items-center'
            style={{
              height: `calc(100vh - ${
                topNavbarHeight +
                bottomNavbarHeight +
                reportsNavbarHeight +
                (isLocalMode ? 120 : 0) +
                20
              }px)`,
            }}
          >
            <SyncLoader
              color='#60a5fa'
              loading={isLoading}
              size={15}
              margin={5}
            />
            <p
              className={clsx(
                'mt-4 text-lg',
                isDark ? 'text-gray-400' : 'text-gray-500',
              )}
            >
              {isLocalMode
                ? `Loading ${viewMode} photos...`
                : 'Loading photos, please wait...'}
            </p>
          </div>
        ) : listPhotoWithDate.length === 0 ? (
          <div
            className='flex flex-col justify-center items-center w-full p-4 border-2 border-gray-300 rounded-xl'
            style={{
              height: `calc(100vh - ${
                topNavbarHeight +
                bottomNavbarHeight +
                reportsNavbarHeight +
                (isLocalMode ? 120 : 0) +
                20
              }px)`,
            }}
          >
            <Icon
              icon='tabler:photo-off'
              width={48}
              height={48}
              className='text-gray-400'
            />
            <p
              className={clsx(
                'mt-4 text-lg',
                isDark ? 'text-gray-400' : 'text-gray-500',
              )}
            >
              {isLocalMode
                ? `No ${viewMode} photos found. ${viewMode === 'original' ? 'Take some photos' : 'Capture photos with metadata overlay'} to see them here!`
                : 'No photos available. Please check back later.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedPhotos).map(([dateKey, photos]) => (
            <div key={dateKey} className='mb-4'>
              <div
                className={clsx(
                  'w-full sticky z-10 rounded-b-2xl',
                  isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
                )}
                style={{
                  top: `calc(var(--top-navbar-height) + var(--reports-navbar-height) + ${isLocalMode ? 78 : 0}px)`,
                }}
              >
                <div
                  className={clsx(
                    'flex flex-row items-center gap-2.5 text-lg font-semibold mb-3 px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-400 text-white shadow',
                    'rounded-xl',
                  )}
                  style={{
                    borderRadius: '1rem 1rem 1rem 1rem',
                    marginBottom: '-1px',
                  }}
                >
                  <Icon icon='tabler:calendar-filled' width={24} height={24} />
                  <p>{formatDate(dateKey)}</p>
                </div>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 mt-4'>
                {photos.map((item, idx) => (
                  <div
                    key={idx}
                    className='relative cursor-pointer'
                    onClick={() => handlePhotoClick(item)}
                  >
                    <img
                      src={item.imageUrl || '/images/no_image.png'}
                      alt={item.filename}
                      className={clsx(
                        'w-full aspect-[4/3] object-cover rounded-xl',
                        isDark
                          ? 'border border-gray-700'
                          : 'border border-gray-200',
                      )}
                      loading='lazy'
                    />

                    <div className='flex items-center gap-2 absolute top-2 right-2'>
                      {/* Metadata indicator - only show in metadata view when there's actual sensor data */}
                      {viewMode === 'metadata' &&
                        item.metadata &&
                        Object.keys(item.metadata).some(
                          (key) =>
                            item.metadata[key as keyof Metadata] !==
                              undefined &&
                            item.metadata[key as keyof Metadata] !== null &&
                            item.metadata[key as keyof Metadata] !== '' &&
                            !Number.isNaN(
                              Number(item.metadata[key as keyof Metadata]),
                            ),
                        ) && (
                          <>
                            <span
                              className='bg-gradient-to-br from-blue-500 to-blue-400 text-white text-xs p-1 rounded-lg shadow-md'
                              data-tooltip-id={`metadata-${idx}`}
                              data-tooltip-content='There is metadata on this image!'
                            >
                              <Icon
                                icon='fluent:document-data-16-filled'
                                width={24}
                                height={24}
                              />
                            </span>
                            <ReactTooltip
                              id={`metadata-${idx}`}
                              place='top'
                              variant='info'
                              className='z-40'
                            />
                          </>
                        )}{' '}
                      {/* Obstacle indicator - only show in original view when ultrasonic <= 20 and data is available */}
                      {viewMode === 'original' &&
                        item.metadata &&
                        item.metadata.ultrasonic !== undefined &&
                        item.metadata.ultrasonic !== null &&
                        item.metadata.ultrasonic !== -1 &&
                        !Number.isNaN(item.metadata.ultrasonic) &&
                        item.metadata.ultrasonic > 0 &&
                        item.metadata.ultrasonic <= 20 && (
                          <>
                            <span
                              className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs p-1 rounded-lg shadow-md'
                              data-tooltip-id={`obstacle-${idx}`}
                              data-tooltip-content={`Obstacle detected! Distance: ${item.metadata.ultrasonic}cm`}
                            >
                              <Icon
                                icon='fluent:scan-object-24-filled'
                                width={24}
                                height={24}
                              />
                            </span>
                            <ReactTooltip
                              id={`obstacle-${idx}`}
                              place='top'
                              variant='error'
                              className='z-40'
                            />
                          </>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
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
