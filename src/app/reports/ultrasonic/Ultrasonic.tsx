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

      // Prioritize originals folder for display, then check main gallery
      const galleryFolders = [
        'reports/gallery/originals',
        'reports/gallery/metadata',
        'reports/gallery',
      ];

      for (const folder of galleryFolders) {
        try {
          console.log(`🔊 [ULTRASONIC DEBUG] Checking folder: ${folder}`);

          const galleryResult =
            await window.electronAPI.getImagesFromFolder(folder);

          console.log(
            `🔊 [ULTRASONIC DEBUG] Gallery result for ${folder}:`,
            galleryResult,
          );

          if (galleryResult.success && galleryResult.images) {
            console.log(
              `🔊 [ULTRASONIC DEBUG] Images in ${folder}:`,
              galleryResult.images.map((img) => img.fileName),
            );

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
              // Try multiple filename patterns for auto-captured images
              const patterns = [
                imageFileName.endsWith(extension)
                  ? imageFileName
                  : `${imageFileName}${extension}`,
                `${imageFileName}_original${extension}`, // Auto-captured pattern
                `${imageFileName}_metadata${extension}`, // Alternative pattern
              ];

              for (const targetFilename of patterns) {
                console.log(
                  `🔊 [ULTRASONIC DEBUG] Looking for: ${targetFilename}`,
                );

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

  // Function to parse ultrasonic file content (JSON or ESP32 log format)
  const parseUltrasonicFile = async (
    content: string,
    date: string,
    sessionId: number,
  ): Promise<Ultrasonic[]> => {
    try {
      console.log(
        '🔊 [ULTRASONIC DEBUG] Parsing ultrasonic file content, length:',
        content.length,
      );

      const reports: Ultrasonic[] = [];
      let data: UltrasonicData[] = [];

      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          data = parsed;
          console.log(
            '🔊 [ULTRASONIC DEBUG] Parsed as JSON array, length:',
            data.length,
          );
        } else {
          data = [parsed];
          console.log('🔊 [ULTRASONIC DEBUG] Parsed as single JSON object');
        }
      } catch {
        // If JSON parsing fails, try ESP32 log format (line by line)
        console.log(
          '🔊 [ULTRASONIC DEBUG] JSON parsing failed, trying ESP32 log format',
        );
        const lines = content.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          // ESP32 log format: [timestamp] [ESP32] {json}
          const jsonMatch = line.match(/\{.*\}/);
          if (jsonMatch) {
            try {
              const lineData = JSON.parse(jsonMatch[0]);
              data.push(lineData);
            } catch {
              console.warn('🔊 [ULTRASONIC DEBUG] Failed to parse line:', line);
            }
          }
        }
        console.log(
          '🔊 [ULTRASONIC DEBUG] Parsed ESP32 log format, entries:',
          data.length,
        );
      }

      // Convert data to Ultrasonic format
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // Generate timestamp if not provided
        const timestamp =
          item.timestamp || item.createdAt || new Date().toISOString();

        // Check if image exists in gallery
        let hasImage = false;
        let imagePath = '';
        if (item.imageFileName) {
          const imageCheck = await checkImageExistsInGallery(
            item.imageFileName,
          );
          hasImage = imageCheck.exists;
          imagePath = imageCheck.imagePath || '';
          console.log(
            '🔊 [ULTRASONIC DEBUG] Image check for',
            item.imageFileName,
            ':',
            imageCheck,
          );
        }

        // Calculate alert level based on distance
        const ultrasonicValue = item.ultrasonic || 0;
        const alertLevel: 'High' | 'Medium' | 'Safe' =
          ultrasonicValue < 10
            ? 'High'
            : ultrasonicValue < 20
              ? 'Medium'
              : 'Safe';

        const report: Ultrasonic = {
          id: `${date}-${sessionId}-${i}`,
          timestamp,
          sessionId,
          distance: ultrasonicValue,
          alertLevel,
          imageId:
            item.imageFileName || item.imageId || item.fileName || `image-${i}`,
          createdAt: timestamp,
          imageFileName: item.imageFileName,
          hasImage,
          imagePath,
          metadata: {
            ultrasonic: ultrasonicValue,
            heading: item.heading || 0,
            direction: item.direction,
            accelerationMagnitude: item.accelerationMagnitude,
            rotationRate: item.rotationRate,
            distanceTraveled: item.distanceTraveled,
            linearAcceleration: item.linearAcceleration,
            velocity: item.velocity,
            velocityX: item.velocityX,
            velocityY: item.velocityY,
            position: item.position || { positionX: 0, positionY: 0 },
            pitch: item.pitch,
            roll: item.roll,
            yaw: item.yaw,
          },
        };

        reports.push(report);
      }

      console.log(
        '🔊 [ULTRASONIC DEBUG] Final reports generated:',
        reports.length,
      );
      return reports;
    } catch (error) {
      console.error(
        '🔊 [ULTRASONIC DEBUG] Error parsing ultrasonic file:',
        error,
      );
      return [];
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
      backgroundColor: isDark ? '#23272f' : '#fff',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDark
          ? '#3b82f6'
          : '#60a5fa'
        : state.isFocused
          ? isDark
            ? '#374151'
            : '#e3f2fd'
          : 'transparent',
      color:
        state.isSelected || state.isFocused ? '#fff' : isDark ? '#fff' : '#333',
      ':hover': {
        backgroundColor: isDark ? '#374151' : '#e3f2fd',
        color: '#fff',
      },
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
          // LOCAL MODE: Read from reports/ultrasonic/{date}/{sessionId}.json
          console.log(
            '🔊 [ULTRASONIC DEBUG] Local mode - fetching ultrasonic data from files',
          );

          try {
            if (!window.electronAPI?.getUltrasonicFiles) {
              throw new Error('electronAPI.getUltrasonicFiles not available');
            }

            // Read ultrasonic folder structure
            const folderResult =
              await window.electronAPI.getUltrasonicFiles('reports/ultrasonic');
            console.log(
              '🔊 [ULTRASONIC DEBUG] Ultrasonic folder result:',
              folderResult,
            );

            if (!folderResult.success) {
              throw new Error(
                folderResult.error || 'Failed to read ultrasonic folder',
              );
            }

            const allDateSessions: {
              value: string;
              label: string;
              sessions: OptionType[];
            }[] = [];
            const allReports: Ultrasonic[] = [];

            // Process each date folder
            for (const item of folderResult.images || []) {
              if (item.isDirectory) {
                const dateFolder = item.fileName;
                console.log(
                  '🔊 [ULTRASONIC DEBUG] Processing date folder:',
                  dateFolder,
                );

                const sessions: OptionType[] = [];

                // Get session files for this date
                const sessionResult =
                  await window.electronAPI.getUltrasonicFiles(
                    `reports/ultrasonic/${dateFolder}`,
                  );
                console.log(
                  '🔊 [ULTRASONIC DEBUG] Session result for',
                  dateFolder,
                  ':',
                  sessionResult,
                );

                if (sessionResult.success && sessionResult.images) {
                  for (const sessionItem of sessionResult.images) {
                    if (
                      !sessionItem.isDirectory &&
                      sessionItem.fileName.endsWith('.json')
                    ) {
                      const sessionId = sessionItem.fileName.replace(
                        '.json',
                        '',
                      );
                      sessions.push({
                        value: sessionId,
                        label: `Session ${sessionId}`,
                      });

                      // Read and parse session file
                      try {
                        if (!window.electronAPI?.readFileContent) {
                          console.error(
                            '🔊 [ULTRASONIC DEBUG] readFileContent API not available',
                          );
                          continue;
                        }

                        const fileResult =
                          await window.electronAPI.readFileContent(
                            `reports/ultrasonic/${dateFolder}/${sessionItem.fileName}`,
                          );
                        console.log(
                          '🔊 [ULTRASONIC DEBUG] File result for',
                          sessionItem.fileName,
                          ':',
                          fileResult,
                        );

                        if (fileResult.success && fileResult.content) {
                          const sessionReports = await parseUltrasonicFile(
                            fileResult.content,
                            dateFolder,
                            parseInt(sessionId),
                          );
                          allReports.push(...sessionReports);
                          console.log(
                            '🔊 [ULTRASONIC DEBUG] Parsed',
                            sessionReports.length,
                            'ultrasonic reports from',
                            sessionItem.fileName,
                          );
                        }
                      } catch (parseError) {
                        console.error(
                          '🔊 [ULTRASONIC DEBUG] Error parsing ultrasonic file:',
                          sessionItem.fileName,
                          parseError,
                        );
                      }
                    }
                  }
                }

                if (sessions.length > 0) {
                  allDateSessions.push({
                    value: dateFolder,
                    label: new Date(dateFolder).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    sessions: sessions.sort(
                      (a, b) => parseInt(a.value) - parseInt(b.value),
                    ),
                  });
                }
              }
            }

            console.log(
              '🔊 [ULTRASONIC DEBUG] Total dates with sessions:',
              allDateSessions.length,
            );
            console.log(
              '🔊 [ULTRASONIC DEBUG] Total ultrasonic reports:',
              allReports.length,
            );

            // Sort dates by newest first
            allDateSessions.sort(
              (a, b) =>
                new Date(b.value).getTime() - new Date(a.value).getTime(),
            );

            // Sort sessions within each date by newest first
            allDateSessions.forEach((dateItem) => {
              if (dateItem.sessions && dateItem.sessions.length > 0) {
                console.log(
                  '🔊 [ULTRASONIC DEBUG] Before sorting sessions for',
                  dateItem.value,
                  ':',
                  dateItem.sessions.map((s) => s.value),
                );
                dateItem.sessions.sort((a, b) => {
                  // Extract session numbers for comparison
                  const sessionA = parseInt(a.value.replace(/\D/g, '')) || 0;
                  const sessionB = parseInt(b.value.replace(/\D/g, '')) || 0;
                  return sessionB - sessionA; // Newest (highest number) first
                });
                console.log(
                  '🔊 [ULTRASONIC DEBUG] After sorting sessions for',
                  dateItem.value,
                  ':',
                  dateItem.sessions.map((s) => s.value),
                );
              }
            });

            setDateWithSessions(allDateSessions);

            // Auto-select the most recent date and session (only if not already selected)
            if (allDateSessions.length > 0 && !selectedDate) {
              const defaultDate = allDateSessions[0];
              const defaultSession =
                defaultDate.sessions.length > 0
                  ? defaultDate.sessions[0]
                  : null;

              setSelectedDate(defaultDate);
              setSelectedSession(defaultSession);
            }

            // Set all reports, filtering will be handled by useMemo
            const sortedReports = allReports.sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
            setReports(sortedReports);

            console.log(
              '🔊 [ULTRASONIC LOCAL] Successfully processed ultrasonic data:',
              {
                totalReports: allReports.length,
                totalWithImages: allReports.filter((r) => r.hasImage).length,
                dates: allDateSessions.length,
                reportsBySession: allReports.reduce(
                  (acc, report) => {
                    const key = `${report.timestamp.split('T')[0]}-${report.sessionId}`;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
                allReportIds: allReports.map((r) => ({
                  id: r.id,
                  sessionId: r.sessionId,
                  date: r.timestamp.split('T')[0],
                })),
              },
            );
          } catch (localError) {
            console.error(
              '🔊 [ULTRASONIC DEBUG] Error in local mode:',
              localError,
            );
            setReports([]);
            setDateWithSessions([]);
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

          if (
            (date && session) ||
            (data.length > 0 && data[0].sessions.length > 0)
          ) {
            const finalSession = session || data[0].sessions[0];
            const reportsRes = await fetch(
              `/api/reports/ultrasonic/date/${useDate?.value}/session/${finalSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.deviceName, isLocalMode]);

  // Additional useEffect to handle session changes for online mode
  useEffect(() => {
    const fetchSessionData = async () => {
      if (
        !isLocalMode &&
        selectedDate &&
        selectedSession &&
        selectedDevice?.deviceName
      ) {
        try {
          const deviceName = selectedDevice.deviceName;
          const reportsRes = await fetch(
            `/api/reports/ultrasonic/date/${selectedDate.value}/session/${selectedSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
          );
          const reportsData = await reportsRes.json();
          const sortedReports = (reportsData.data || []).sort(
            (a: Ultrasonic, b: Ultrasonic) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setReports(sortedReports);
        } catch (error) {
          console.error('Error fetching session data:', error);
          setReports([]);
        }
      }
    };

    // Only fetch if we're in online mode and have valid selections
    if (!isLocalMode && selectedDate && selectedSession) {
      fetchSessionData();
    }
  }, [selectedDate, selectedSession, isLocalMode, selectedDevice?.deviceName]);

  // Calculate filtered reports for display (computed during render, not in useEffect)
  const filteredReports = React.useMemo(() => {
    console.log('🔊 [FILTER DEBUG] Starting filter calculation:', {
      isLocalMode,
      selectedDate: selectedDate?.value,
      selectedSession: selectedSession?.value,
      totalReports: reports.length,
    });

    if (isLocalMode && selectedDate && selectedSession) {
      const filtered = reports.filter((report) => {
        const reportDate = report.timestamp.split('T')[0];
        const reportSessionId = report.sessionId.toString();
        const selectedSessionId = selectedSession.value.replace(/\D/g, '');

        const matches =
          reportDate === selectedDate.value &&
          reportSessionId === selectedSessionId;

        console.log('🔊 [FILTER DEBUG] Report filter check:', {
          reportId: report.id,
          reportDate,
          reportSessionId,
          selectedDate: selectedDate.value,
          selectedSessionId,
          matches,
        });

        return matches;
      });

      console.log('🔊 [FILTER DEBUG] Filter result:', {
        totalFiltered: filtered.length,
        filteredIds: filtered.map((r) => r.id),
      });

      return filtered;
    }

    console.log(
      '🔊 [FILTER DEBUG] Not in local mode or missing selections, returning all reports',
    );
    return reports;
  }, [reports, selectedDate, selectedSession, isLocalMode]);
  // Calculate summaries based on filtered reports (computed during render)
  const computedSummaries = React.useMemo(() => {
    const reportsToUse = isLocalMode ? filteredReports : reports;

    // Total Images should count only reports with actual images
    const totalImages = reportsToUse.filter((r) => r.hasImage).length;
    const totalObstacles = reportsToUse.filter(
      (r) => r.alertLevel === 'High',
    ).length;
    const distances = reportsToUse.map((r) => r.distance);
    const closestDistance = distances.length > 0 ? Math.min(...distances) : 0;

    // Fix average distance calculation - don't round, use proper decimal
    const averageDistance =
      distances.length > 0
        ? parseFloat(
            (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(
              1,
            ),
          )
        : 0;

    console.log('🔊 [ULTRASONIC DEBUG] Summary calculation:', {
      totalReports: reportsToUse.length,
      reportsWithImages: reportsToUse.filter((r) => r.hasImage).length,
      distances: distances,
      totalDistanceSum: distances.reduce((a, b) => a + b, 0),
      averageCalculation:
        distances.length > 0
          ? distances.reduce((a, b) => a + b, 0) / distances.length
          : 0,
      finalAverage: averageDistance,
    });

    return {
      totalImages,
      totalObstacles,
      closestDistance,
      averageDistance,
    };
  }, [filteredReports, reports, isLocalMode]);
  const summaryItems = [
    {
      icon: 'fluent:image-sparkle-24-filled',
      title: 'Total Images Collected',
      summary: `${computedSummaries.totalImages} Images`,
    },
    {
      icon: 'fluent:scan-object-20-filled',
      title: 'Total Obstacles Detected',
      summary: `${computedSummaries.totalObstacles} Obstacles`,
    },
    {
      icon: 'subway:close-corner-arrow-2',
      title: 'Closest Distance',
      summary: `${computedSummaries.closestDistance} cm`,
    },
    {
      icon: 'ri:pin-distance-fill',
      title: 'Average Distance',
      summary: `${computedSummaries.averageDistance} cm`,
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
                      neutral20: isDark ? '#fff' : '#333',
                      neutral50: isDark ? '#fff' : '#333',
                      neutral60: isDark ? '#fff' : '#333',
                      neutral10: isDark ? '#fff' : '#333',
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
                  onChange={(newSession) => {
                    console.log('🔊 [SESSION CHANGE] Session changed:', {
                      from: selectedSession?.value,
                      to: newSession?.value,
                      selectedDate: selectedDate?.value,
                    });
                    setSelectedSession(newSession);
                  }}
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
                      neutral20: isDark ? '#fff' : '#333',
                      neutral50: isDark ? '#fff' : '#333',
                      neutral60: isDark ? '#fff' : '#333',
                      neutral10: isDark ? '#fff' : '#333',
                    },
                  })}
                />
              </div>
            )}{' '}
          </div>

          <div className='overflow-x-auto'>
            <UltrasonicSensorTable
              reports={(() => {
                console.log(
                  '🔊 [ULTRASONIC DEBUG] Sending to table:',
                  filteredReports.map((r) => ({
                    id: r.id,
                    hasImage: r.hasImage,
                    imagePath: r.imagePath,
                    imageFileName: r.imageFileName,
                    distance: r.distance,
                  })),
                );
                return filteredReports;
              })()}
            />
          </div>
        </>
      )}
    </div>
  );
}
