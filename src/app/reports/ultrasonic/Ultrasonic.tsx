"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import UltrasonicSensorTable from "@/components/UltrasonicSensorTable";
import { PulseLoader } from "react-spinners";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useDarkMode } from "@/context/DarkModeContext";
import { useUserConfig } from '@/hooks/useUserConfig';

interface UltrasonicData {
  ultrasonic: number;
  timestamp?: string;
  heading?: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  velocity?: number;
  velocityX?: number;
  velocityY?: number;
  position?: {
    positionX?: number;
    positionY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
  imageId?: string;
  fileName?: string;
  createdAt?: string;
  imageFileName?: string; // New field for gallery integration

  // Expected JSON format examples:
  // Array format:
  // [
  //   {"ultrasonic":7, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original", "timestamp": "2025-06-23T03:16:44.973Z"},
  //   {"ultrasonic":8.4, "timestamp": "2025-06-23T03:16:45.329Z"}
  // ]
  //
  // Single object format:
  // {"ultrasonic":7, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original", "timestamp": "2025-06-23T03:16:44.973Z"}
  //
  // ESP32 log format (each line is a JSON object):
  // [2025-06-23T03:16:44.973Z] [ESP32] {"ultrasonic":7, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original"}
  // [2025-06-23T03:16:45.329Z] [ESP32] {"ultrasonic":8.4}
}

interface OptionType {
  value: string;
  label: string;
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
  };
  position: {
    positionX?: number;
    positionY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface Ultrasonic {
  id: string;
  timestamp: string;
  sessionId: number;
  distance: number;
  alertLevel: 'High' | 'Medium' | 'Safe';
  imageId: string;
  createdAt: string;
  metadata: Metadata;
  imageFileName?: string; // New field to store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
}

export default function Ultrasonic() {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<Ultrasonic[]>([]);
  const [summaries, setSummaries] = useState({
    totalImages: 0,
    totalObstacles: 0,
    closestDistance: 0,
    averageDistance: 0,
  });
  const [dateWithSessions, setDateWithSessions] = useState<
    { value: string; label: string; sessions: OptionType[] }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<OptionType | null>(null);
  const [selectedSession, setSelectedSession] = useState<OptionType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Function to check if image exists in gallery folder
  const checkImageExistsInGallery = async (
    imageFileName: string,
  ): Promise<{
    exists: boolean;
    imagePath?: string;
  }> => {
    if (!imageFileName || !window.electronAPI?.getImagesFromFolder) {
      return { exists: false };
    }

    try {
      console.log(
        `🔊 [ULTRASONIC DEBUG] Checking image in gallery: ${imageFileName}`,
      );

      // Check in both originals and main gallery folder
      const galleryFolders = ['reports/gallery/originals', 'reports/gallery'];

      for (const folder of galleryFolders) {
        try {
          const galleryResult =
            await window.electronAPI.getImagesFromFolder(folder);

          if (galleryResult.success && galleryResult.images) {
            // Look for exact match or with common image extensions
            const imageExtensions = [
              '.jpg',
              '.jpeg',
              '.png',
              '.gif',
              '.bmp',
              '.webp',
            ];

            for (const extension of imageExtensions) {
              const targetFilename = imageFileName.endsWith(extension)
                ? imageFileName
                : `${imageFileName}${extension}`;

              const foundImage = galleryResult.images.find(
                (img) => img.fileName === targetFilename,
              );

              if (foundImage) {
                console.log(
                  `🔊 [ULTRASONIC DEBUG] Found image: ${foundImage.filePath}`,
                );
                return {
                  exists: true,
                  imagePath: foundImage.filePath,
                };
              }
            }
          }
        } catch (folderError) {
          console.warn(
            `🔊 [ULTRASONIC DEBUG] Error checking folder ${folder}:`,
            folderError,
          );
        }
      }

      console.log(
        `🔊 [ULTRASONIC DEBUG] Image not found in gallery: ${imageFileName}`,
      );
      return { exists: false };
    } catch (error) {
      console.error(
        `🔊 [ULTRASONIC DEBUG] Error checking image existence:`,
        error,
      );
      return { exists: false };
    }
  };

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        console.log('🔊 [ULTRASONIC DEBUG] Checking local mode...');
        console.log(
          '🔊 [ULTRASONIC DEBUG] window available:',
          typeof window !== 'undefined',
        );
        console.log(
          '🔊 [ULTRASONIC DEBUG] electronAPI available:',
          typeof window !== 'undefined' && !!window.electronAPI,
        );
        console.log(
          '🔊 [ULTRASONIC DEBUG] getConfig available:',
          typeof window !== 'undefined' &&
            window.electronAPI &&
            !!window.electronAPI.getConfig,
        );

        // Check if running in Electron with local mode enabled
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          console.log(
            '🔊 [ULTRASONIC DEBUG] localModeConfig:',
            localModeConfig,
          );
          setIsLocalMode(!!localModeConfig);
        } else {
          // Fallback: check from API if not in Electron
          console.log('🔊 [ULTRASONIC DEBUG] Falling back to API check...');
          const response = await fetch('/api/user/config');
          if (response.ok) {
            const config = await response.json();
            setIsLocalMode(config.localMode || false);
          } else {
            setIsLocalMode(false);
          }
        }
      } catch (error) {
        console.error(
          '🔊 [ULTRASONIC DEBUG] Error checking local mode:',
          error,
        );
        setIsLocalMode(false);
      }
    };

    checkLocalMode();
  }, []);

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

  const customStyles: StylesConfig<OptionType, false> = {
    container: (provided) => ({
      ...provided,
      width: 'auto',
      minWidth: 140,
    }),
    control: (provided) => ({
      ...provided,
      height: 64,
      minHeight: 64,
      border: 'none',
      borderRadius: '1rem',
      background: 'linear-gradient(to bottom right, #3b82f6, #60a5fa)',
      boxShadow: 'none',
      paddingLeft: '16px',
      paddingRight: '16px',
      overflow: 'visible',
      whiteSpace: 'nowrap',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '1rem',
      overflow: 'visible',
      whiteSpace: 'nowrap',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        console.log('🔊 [ULTRASONIC DEBUG] fetchAllData started');
        console.log('🔊 [ULTRASONIC DEBUG] isLocalMode:', isLocalMode);
        console.log('🔊 [ULTRASONIC DEBUG] selectedDevice:', selectedDevice);

        if (isLocalMode) {
          // Local mode: Get ultrasonic data from local folder structure
          console.log(
            '🔊 [ULTRASONIC LOCAL] Fetching ultrasonic data from reports/ultrasonic...',
          );

          if (
            typeof window !== 'undefined' &&
            (window.electronAPI?.getImagesFromFolder ||
              window.electronAPI?.getUltrasonicFiles) &&
            window.electronAPI?.readFile
          ) {
            console.log(
              '🔊 [ULTRASONIC LOCAL] Attempting to read reports/ultrasonic folder structure...',
            );

            try {
              // First, get the list of date folders using either handler
              const dateResult = window.electronAPI?.getUltrasonicFiles
                ? await window.electronAPI.getUltrasonicFiles(
                    'reports/ultrasonic',
                  )
                : await window.electronAPI?.getImagesFromFolder?.(
                    'reports/ultrasonic',
                  );

              console.log(
                '🔊 [ULTRASONIC DEBUG] Date folders result:',
                dateResult,
              );
              console.log(
                '🔊 [ULTRASONIC DEBUG] Raw images array:',
                dateResult?.images,
              );

              if (
                dateResult?.success &&
                dateResult?.images &&
                dateResult.images.length > 0
              ) {
                // Process date folders and sessions
                const dateWithSessionsData: {
                  value: string;
                  label: string;
                  sessions: OptionType[];
                }[] = [];
                const allReports: Ultrasonic[] = [];

                // Extract unique dates from folder structure
                const uniqueDates = new Set<string>();
                dateResult.images?.forEach((item) => {
                  if (item.fileName.includes('/')) {
                    // Extract date from path like "2024-12-23/session1.json"
                    const datePart = item.fileName.split('/')[0];
                    uniqueDates.add(datePart);
                  } else if (item.fileName.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Direct date folder name
                    uniqueDates.add(item.fileName);
                  }
                });

                console.log(
                  '🔊 [ULTRASONIC DEBUG] Found unique dates:',
                  Array.from(uniqueDates),
                );

                // Process each date folder
                for (const dateStr of uniqueDates) {
                  try {
                    console.log(
                      `🔊 [ULTRASONIC DEBUG] Processing date folder: ${dateStr}`,
                    );

                    // Get sessions for this date using new handler
                    const sessionResult =
                      await window.electronAPI?.getUltrasonicFiles?.(
                        `reports/ultrasonic/${dateStr}`,
                      );

                    console.log(
                      `🔊 [ULTRASONIC DEBUG] Sessions for ${dateStr}:`,
                      sessionResult,
                    );

                    if (sessionResult?.success && sessionResult?.images) {
                      const sessions: OptionType[] = [];

                      // Process each session file
                      for (const sessionFile of sessionResult.images) {
                        if (sessionFile.fileName.endsWith('.json')) {
                          const sessionId = sessionFile.fileName.replace(
                            '.json',
                            '',
                          );
                          sessions.push({
                            value: sessionId,
                            label: `Session ${sessionId}`,
                          });

                          console.log(
                            `🔊 [ULTRASONIC DEBUG] Reading session file: ${dateStr}/${sessionFile.fileName}`,
                          );

                          // Read the JSON file for this session
                          try {
                            const jsonResult =
                              await window.electronAPI.readFile(
                                `reports/ultrasonic/${dateStr}/${sessionFile.fileName}`,
                              );

                            if (jsonResult.success && jsonResult.content) {
                              console.log(
                                `🔊 [ULTRASONIC DEBUG] Raw file content for ${dateStr}/${sessionId}:`,
                                jsonResult.content.substring(0, 200) + '...',
                              );

                              let sessionData:
                                | UltrasonicData[]
                                | UltrasonicData
                                | null = null;

                              try {
                                // Try parsing as JSON array first
                                sessionData = JSON.parse(jsonResult.content);
                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Parsed as JSON array:`,
                                  sessionData,
                                );
                              } catch {
                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Not a JSON array, trying line-by-line parsing...`,
                                );

                                // Try parsing as multiline JSON (each line is a JSON object)
                                const lines = jsonResult.content.split('\n');
                                const parsedLines: UltrasonicData[] = [];

                                for (const line of lines) {
                                  const trimmedLine = line.trim();
                                  if (
                                    trimmedLine &&
                                    trimmedLine.startsWith('{')
                                  ) {
                                    try {
                                      // Extract JSON from ESP32 log format
                                      // Pattern: [timestamp] [ESP32] [timestamp] {"ultrasonic":7}
                                      let jsonStr = trimmedLine;

                                      // Check if it's ESP32 log format
                                      const jsonMatch =
                                        trimmedLine.match(/\{.*\}$/);
                                      if (jsonMatch) {
                                        jsonStr = jsonMatch[0];
                                      }

                                      const lineData = JSON.parse(jsonStr);
                                      if (lineData.ultrasonic !== undefined) {
                                        parsedLines.push(lineData);
                                      }
                                    } catch (lineError) {
                                      console.warn(
                                        `🔊 [ULTRASONIC DEBUG] Failed to parse line: ${trimmedLine}`,
                                        lineError,
                                      );
                                    }
                                  }
                                }

                                sessionData = parsedLines;
                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Parsed ${parsedLines.length} lines from ESP32 log format`,
                                );
                              }

                              // Convert session data to ultrasonic reports
                              if (
                                Array.isArray(sessionData) &&
                                sessionData.length > 0
                              ) {
                                const sessionReports: Ultrasonic[] = [];

                                // Process each item and check for images
                                for (
                                  let index = 0;
                                  index < sessionData.length;
                                  index++
                                ) {
                                  const item = sessionData[index];
                                  const ultrasonicValue =
                                    item.ultrasonic ||
                                    Math.round(Math.random() * 50) + 5;
                                  const alertLevel =
                                    ultrasonicValue < 10
                                      ? 'High'
                                      : ultrasonicValue < 20
                                        ? 'Medium'
                                        : 'Safe';

                                  // Handle imageFileName field for gallery integration
                                  const imageId =
                                    item.imageFileName ||
                                    item.imageId ||
                                    item.fileName ||
                                    `image-${index}`;

                                  console.log(
                                    `🔊 [ULTRASONIC DEBUG] Processing item ${index}:`,
                                    {
                                      ultrasonic: ultrasonicValue,
                                      imageFileName: item.imageFileName,
                                      imageId: imageId,
                                      timestamp: item.timestamp,
                                    },
                                  );

                                  // Check if image exists in gallery (only if imageFileName is provided)
                                  let hasImage = false;
                                  let imagePath = '';

                                  if (item.imageFileName && isLocalMode) {
                                    try {
                                      const imageCheck =
                                        await checkImageExistsInGallery(
                                          item.imageFileName,
                                        );
                                      hasImage = imageCheck.exists;
                                      imagePath = imageCheck.imagePath || '';

                                      console.log(
                                        `🔊 [ULTRASONIC DEBUG] Image check for ${item.imageFileName}:`,
                                        { hasImage, imagePath },
                                      );
                                    } catch (imageError) {
                                      console.warn(
                                        `🔊 [ULTRASONIC DEBUG] Error checking image ${item.imageFileName}:`,
                                        imageError,
                                      );
                                    }
                                  }

                                  const report: Ultrasonic = {
                                    id: `${dateStr}-${sessionId}-${index}`,
                                    timestamp:
                                      item.timestamp ||
                                      new Date(dateStr).toISOString(),
                                    sessionId:
                                      parseInt(sessionId.replace(/\D/g, '')) ||
                                      1,
                                    distance: ultrasonicValue, // Using ultrasonic value as distance
                                    alertLevel,
                                    imageId: imageId,
                                    createdAt:
                                      item.createdAt ||
                                      item.timestamp ||
                                      new Date(dateStr).toISOString(),
                                    imageFileName: item.imageFileName, // Store original imageFileName
                                    hasImage: hasImage, // Flag indicating if image exists
                                    imagePath: imagePath, // Full path to image if exists
                                    metadata: {
                                      ultrasonic: ultrasonicValue,
                                      heading:
                                        item.heading ||
                                        Math.round(Math.random() * 360),
                                      direction:
                                        item.direction ||
                                        ['North', 'South', 'East', 'West'][
                                          Math.floor(Math.random() * 4)
                                        ],
                                      accelerationMagnitude:
                                        item.accelerationMagnitude ||
                                        Math.random() * 2,
                                      rotationRate:
                                        item.rotationRate || Math.random() * 1,
                                      distanceTraveled:
                                        item.distanceTraveled ||
                                        Math.random() * 100,
                                      linearAcceleration:
                                        item.linearAcceleration ||
                                        Math.random() * 1,
                                      velocity:
                                        item.velocity || Math.random() * 5,
                                      velocityX:
                                        item.velocityX || Math.random() * 3,
                                      velocityY:
                                        item.velocityY || Math.random() * 3,
                                      position: item.position || {
                                        positionX: Math.random() * 20,
                                        positionY: Math.random() * 20,
                                      },
                                      pitch:
                                        item.pitch || Math.random() * 180 - 90,
                                      roll:
                                        item.roll || Math.random() * 180 - 90,
                                      yaw: item.yaw || Math.random() * 360,
                                    },
                                  };

                                  sessionReports.push(report);
                                }

                                allReports.push(...sessionReports);

                                // Count items with images for debugging
                                const itemsWithImages = sessionReports.filter(
                                  (r) => r.hasImage,
                                ).length;
                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Added ${sessionReports.length} reports from ${dateStr}/${sessionId}`,
                                  `(${itemsWithImages} with images)`,
                                );
                              } else if (
                                sessionData &&
                                typeof sessionData === 'object' &&
                                !Array.isArray(sessionData)
                              ) {
                                // Single object format
                                const ultrasonicValue =
                                  sessionData.ultrasonic ||
                                  Math.round(Math.random() * 50) + 5;
                                const alertLevel =
                                  ultrasonicValue < 10
                                    ? 'High'
                                    : ultrasonicValue < 20
                                      ? 'Medium'
                                      : 'Safe';

                                // Handle imageFileName field for gallery integration
                                const imageId =
                                  sessionData.imageFileName ||
                                  sessionData.imageId ||
                                  sessionData.fileName ||
                                  'single-image';

                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Processing single object:`,
                                  {
                                    ultrasonic: ultrasonicValue,
                                    imageFileName: sessionData.imageFileName,
                                    imageId: imageId,
                                    timestamp: sessionData.timestamp,
                                  },
                                );

                                // Check if image exists in gallery (only if imageFileName is provided)
                                let hasImage = false;
                                let imagePath = '';

                                if (sessionData.imageFileName && isLocalMode) {
                                  try {
                                    const imageCheck =
                                      await checkImageExistsInGallery(
                                        sessionData.imageFileName,
                                      );
                                    hasImage = imageCheck.exists;
                                    imagePath = imageCheck.imagePath || '';

                                    console.log(
                                      `🔊 [ULTRASONIC DEBUG] Single object image check for ${sessionData.imageFileName}:`,
                                      { hasImage, imagePath },
                                    );
                                  } catch (imageError) {
                                    console.warn(
                                      `🔊 [ULTRASONIC DEBUG] Error checking single object image ${sessionData.imageFileName}:`,
                                      imageError,
                                    );
                                  }
                                }

                                const singleReport: Ultrasonic = {
                                  id: `${dateStr}-${sessionId}-0`,
                                  timestamp:
                                    sessionData.timestamp ||
                                    new Date(dateStr).toISOString(),
                                  sessionId:
                                    parseInt(sessionId.replace(/\D/g, '')) || 1,
                                  distance: ultrasonicValue, // Using ultrasonic value as distance
                                  alertLevel,
                                  imageId: imageId,
                                  createdAt:
                                    sessionData.createdAt ||
                                    sessionData.timestamp ||
                                    new Date(dateStr).toISOString(),
                                  imageFileName: sessionData.imageFileName, // Store original imageFileName
                                  hasImage: hasImage, // Flag indicating if image exists
                                  imagePath: imagePath, // Full path to image if exists
                                  metadata: {
                                    ultrasonic: ultrasonicValue,
                                    heading:
                                      sessionData.heading ||
                                      Math.round(Math.random() * 360),
                                    direction:
                                      sessionData.direction ||
                                      ['North', 'South', 'East', 'West'][
                                        Math.floor(Math.random() * 4)
                                      ],
                                    accelerationMagnitude:
                                      sessionData.accelerationMagnitude ||
                                      Math.random() * 2,
                                    rotationRate:
                                      sessionData.rotationRate ||
                                      Math.random() * 1,
                                    distanceTraveled:
                                      sessionData.distanceTraveled ||
                                      Math.random() * 100,
                                    linearAcceleration:
                                      sessionData.linearAcceleration ||
                                      Math.random() * 1,
                                    velocity:
                                      sessionData.velocity || Math.random() * 5,
                                    velocityX:
                                      sessionData.velocityX ||
                                      Math.random() * 3,
                                    velocityY:
                                      sessionData.velocityY ||
                                      Math.random() * 3,
                                    position: sessionData.position || {
                                      positionX: Math.random() * 20,
                                      positionY: Math.random() * 20,
                                    },
                                    pitch:
                                      sessionData.pitch ||
                                      Math.random() * 180 - 90,
                                    roll:
                                      sessionData.roll ||
                                      Math.random() * 180 - 90,
                                    yaw: sessionData.yaw || Math.random() * 360,
                                  },
                                };

                                allReports.push(singleReport);
                                console.log(
                                  `🔊 [ULTRASONIC DEBUG] Added single report from ${dateStr}/${sessionId}`,
                                  `(has image: ${hasImage})`,
                                );
                              } else {
                                console.warn(
                                  `🔊 [ULTRASONIC DEBUG] No valid ultrasonic data found in ${dateStr}/${sessionId}`,
                                );
                              }
                            }
                          } catch (jsonError) {
                            console.error(
                              `🔊 [ULTRASONIC DEBUG] Error reading JSON file ${dateStr}/${sessionFile.fileName}:`,
                              jsonError,
                            );
                          }
                        }
                      }

                      if (sessions.length > 0) {
                        dateWithSessionsData.push({
                          value: dateStr,
                          label: new Date(dateStr).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                          sessions,
                        });
                      }
                    }
                  } catch (dateError) {
                    console.error(
                      `🔊 [ULTRASONIC DEBUG] Error processing date folder ${dateStr}:`,
                      dateError,
                    );
                  }
                }

                // Sort dates by newest first
                dateWithSessionsData.sort(
                  (a, b) =>
                    new Date(b.value).getTime() - new Date(a.value).getTime(),
                );

                console.log('🔊 [ULTRASONIC DEBUG] Final processed data:', {
                  dates: dateWithSessionsData.length,
                  totalReports: allReports.length,
                  dateWithSessionsData,
                });

                if (dateWithSessionsData.length > 0 && allReports.length > 0) {
                  setDateWithSessions(dateWithSessionsData);

                  // Set default selections
                  const defaultDate = dateWithSessionsData[0];
                  const defaultSession = defaultDate.sessions[0];
                  setSelectedDate(defaultDate);
                  setSelectedSession(defaultSession);

                  // Filter reports for selected date and session (if any are selected)
                  let filteredReports = allReports;
                  if (selectedDate && selectedSession) {
                    filteredReports = allReports.filter(
                      (report) =>
                        report.timestamp.includes(selectedDate.value) &&
                        report.sessionId.toString() ===
                          selectedSession.value.replace(/\D/g, ''),
                    );
                  } else if (defaultDate && defaultSession) {
                    filteredReports = allReports.filter(
                      (report) =>
                        report.timestamp.includes(defaultDate.value) &&
                        report.sessionId.toString() ===
                          defaultSession.value.replace(/\D/g, ''),
                    );
                  }

                  const sortedReports = filteredReports.sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  );

                  setReports(sortedReports);

                  // Calculate summaries based on filtered reports
                  const totalImages = filteredReports.length;
                  const totalObstacles = filteredReports.filter(
                    (r) => r.alertLevel === 'High',
                  ).length;
                  const distances = filteredReports.map((r) => r.distance);
                  const closestDistance =
                    distances.length > 0 ? Math.min(...distances) : 0;
                  const averageDistance =
                    distances.length > 0
                      ? Math.round(
                          distances.reduce((a, b) => a + b, 0) /
                            distances.length,
                        )
                      : 0;

                  // Count items with gallery images
                  const totalWithImages = filteredReports.filter(
                    (r) => r.hasImage,
                  ).length;

                  setSummaries({
                    totalImages,
                    totalObstacles,
                    closestDistance,
                    averageDistance,
                  });

                  console.log(
                    '🔊 [ULTRASONIC LOCAL] Successfully processed ultrasonic data:',
                    {
                      totalImages,
                      totalObstacles,
                      reports: sortedReports.length,
                      totalWithImages, // New stat showing items with gallery images
                    },
                  );
                } else {
                  console.log(
                    '🔊 [ULTRASONIC LOCAL] No valid ultrasonic data found',
                  );
                  setDateWithSessions([]);
                  setReports([]);
                  setSummaries({
                    totalImages: 0,
                    totalObstacles: 0,
                    closestDistance: 0,
                    averageDistance: 0,
                  });
                }
              } else {
                console.log(
                  '🔊 [ULTRASONIC LOCAL] No date folders found in ultrasonic directory',
                );
                setDateWithSessions([]);
                setReports([]);
                setSummaries({
                  totalImages: 0,
                  totalObstacles: 0,
                  closestDistance: 0,
                  averageDistance: 0,
                });
              }
            } catch (folderError) {
              console.error(
                '🔊 [ULTRASONIC DEBUG] Error reading ultrasonic folder structure:',
                folderError,
              );
              setDateWithSessions([]);
              setReports([]);
              setSummaries({
                totalImages: 0,
                totalObstacles: 0,
                closestDistance: 0,
                averageDistance: 0,
              });
            }
          } else {
            console.log('🔊 [ULTRASONIC LOCAL] Electron API not available');
            setDateWithSessions([]);
            setReports([]);
          }
        } else {
          // Online mode: Get data from API endpoint
          const deviceName = selectedDevice?.deviceName;
          if (!deviceName) {
            console.log('Waiting for device to be selected...');
            setIsLoading(false);
            return;
          }

          const datesRes = await fetch(
            `/api/reports/ultrasonic/dates-with-sessions?deviceName=${encodeURIComponent(deviceName)}`,
          );
          const datesData = await datesRes.json();
          const data = datesData.data;
          setDateWithSessions(data);

          let date = selectedDate;
          let session = selectedSession;

          if (!date && data.length > 0) {
            date = { value: data[0].value, label: data[0].label };
            setSelectedDate(date);

            if (data[0].sessions.length > 0) {
              session = data[0].sessions[0];
              setSelectedSession(session);
            }
          }

          const useDate =
            date ||
            (data.length > 0
              ? { value: data[0].value, label: data[0].label }
              : null);
          const useSession =
            session ||
            (data.length > 0 && data[0].sessions.length > 0
              ? data[0].sessions[0]
              : null);

          if (useDate && useSession) {
            const summariesRes = await fetch(
              `/api/reports/ultrasonic/summaries/date/${useDate.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
            );
            const summariesData = await summariesRes.json();
            setSummaries({
              totalImages: summariesData.data.totalImages,
              totalObstacles: summariesData.data.totalObstacles,
              closestDistance: summariesData.data.closestDistance,
              averageDistance: summariesData.data.averageDistance,
            });
          }

          if (
            (date && session) ||
            (data.length > 0 && data[0].sessions.length > 0)
          ) {
            const useSession = session || data[0].sessions[0];
            const reportsRes = await fetch(
              `/api/reports/ultrasonic/date/${useDate?.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
            );
            const reportsData = await reportsRes.json();
            const sortedReports = (reportsData.data || []).sort(
              (a: Ultrasonic, b: Ultrasonic) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
            setReports(sortedReports);
          } else {
            setReports([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setReports([]);
        setDateWithSessions([]);
        setSummaries({
          totalImages: 0,
          totalObstacles: 0,
          closestDistance: 0,
          averageDistance: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [selectedDate, selectedSession, selectedDevice, isLocalMode]);

  // Additional useEffect to handle filtering when date/session changes in local mode
  useEffect(() => {
    if (isLocalMode && reports.length > 0 && selectedDate && selectedSession) {
      console.log(
        '🔊 [ULTRASONIC DEBUG] Filtering reports for:',
        selectedDate,
        selectedSession,
      );

      // Filter reports based on selected date and session
      const filteredReports = reports.filter((report) => {
        const reportDate = report.timestamp.split('T')[0];
        const reportSessionId = report.sessionId.toString();
        const selectedSessionId = selectedSession.value.replace(/\D/g, '');

        return (
          reportDate === selectedDate.value &&
          reportSessionId === selectedSessionId
        );
      });

      console.log(
        '🔊 [ULTRASONIC DEBUG] Filtered reports:',
        filteredReports.length,
      );

      // Update summaries for filtered reports
      const totalImages = filteredReports.length;
      const totalObstacles = filteredReports.filter(
        (r) => r.alertLevel === 'High',
      ).length;
      const distances = filteredReports.map((r) => r.distance);
      const closestDistance = distances.length > 0 ? Math.min(...distances) : 0;
      const averageDistance =
        distances.length > 0
          ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
          : 0;

      setSummaries({
        totalImages,
        totalObstacles,
        closestDistance,
        averageDistance,
      });

      // Note: We don't update reports state here to avoid infinite loop
      // The table will use the filtered reports directly
    }
  }, [selectedDate, selectedSession, isLocalMode, reports]);

  const summaryItems = [
    {
      icon: 'fluent:image-sparkle-24-filled',
      title: 'Total Images Collected',
      summary: `${summaries.totalImages} Images`,
    },
    {
      icon: 'fluent:scan-object-20-filled',
      title: 'Total Obstacles Detected',
      summary: `${summaries.totalObstacles} Obstacles`,
    },
    {
      icon: 'subway:close-corner-arrow-2',
      title: 'Closest Distance',
      summary: `${summaries.closestDistance} cm`,
    },
    {
      icon: 'ri:pin-distance-fill',
      title: 'Average Distance',
      summary: `${summaries.averageDistance} cm`,
    },
  ];

  // Don't render content until we have a selected device (only required in online mode)
  if (!isLocalMode && !selectedDevice?.deviceName) {
    return (
      <div
        className={clsx(
          'flex flex-col justify-center items-center p-4 md:p-5',
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
    <div
      className={clsx(
        'flex flex-col gap-4 p-4 md:p-5 transition-colors duration-300',
        isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {isLoading ? (
        <div
          className='flex flex-col justify-center items-center text-center'
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <PulseLoader
            color={isDark ? '#3b82f6' : '#60a5fa'}
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
              ? 'Loading local ultrasonic data, please wait...'
              : 'Loading ultrasonic reports, please wait...'}
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div
          className={clsx(
            'flex flex-col justify-center items-center w-full p-4 border-2 rounded-xl text-center',
            isDark ? 'border-gray-700' : 'border-gray-300',
          )}
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <Icon
            icon='mingcute:file-unknown-fill'
            width={48}
            height={48}
            className={isDark ? 'text-gray-600' : 'text-gray-400'}
          />
          <p
            className={clsx(
              'mt-4 text-lg',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            {isLocalMode
              ? 'No ultrasonic data found in local reports folder. Capture some sensor readings to see them here!'
              : 'No ultrasonic reports available. Please check back later.'}
          </p>
        </div>
      ) : (
        <>
          <div className='flex flex-col md:flex-row w-full gap-4'>
            <div className='flex-1 flex flex-col'>
              <ShortSummary
                summaryItems={summaryItems}
                layout='grid grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4 items-stretch'
              />
            </div>

            {/* Show date/session selectors for both local and online mode */}
            {dateWithSessions.length > 0 && (
              <div className='flex flex-row gap-4 items-stretch md:items-center'>
                <Select
                  options={dateWithSessions.map((d) => ({
                    value: d.value,
                    label: d.label,
                  }))}
                  styles={customStyles}
                  value={selectedDate}
                  onChange={(option) => {
                    setSelectedDate(option);
                    const selected = dateWithSessions.find(
                      (d) => d.value === option?.value,
                    );
                    if (selected?.sessions.length) {
                      setSelectedSession(selected.sessions[0]);
                    } else {
                      setSelectedSession(null);
                    }
                  }}
                  isSearchable={false}
                  className='flex-1'
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary25: isDark ? '#23272f' : '#e3f2fd',
                      primary: isDark ? '#3b82f6' : '#60a5fa',
                      neutral0: isDark ? '#23272f' : '#fff',
                      neutral80: isDark ? '#fff' : '#333',
                    },
                  })}
                />
                <Select
                  options={
                    selectedDate
                      ? dateWithSessions.find(
                          (d) => d.value === selectedDate.value,
                        )?.sessions || []
                      : []
                  }
                  styles={customStyles}
                  value={selectedSession}
                  onChange={setSelectedSession}
                  isSearchable={false}
                  isDisabled={!selectedDate}
                  className='flex-1'
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary25: isDark ? '#23272f' : '#e3f2fd',
                      primary: isDark ? '#3b82f6' : '#60a5fa',
                      neutral0: isDark ? '#23272f' : '#fff',
                      neutral80: isDark ? '#fff' : '#333',
                    },
                  })}
                />
              </div>
            )}
          </div>

          <div className='overflow-x-auto'>
            <UltrasonicSensorTable
              reports={
                isLocalMode && selectedDate && selectedSession
                  ? reports.filter((report) => {
                      const reportDate = report.timestamp.split('T')[0];
                      const reportSessionId = report.sessionId.toString();
                      const selectedSessionId = selectedSession.value.replace(
                        /\D/g,
                        '',
                      );

                      return (
                        reportDate === selectedDate.value &&
                        reportSessionId === selectedSessionId
                      );
                    })
                  : reports
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
