"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import ShortSummary from "@/components/cards/ShortSummaryCard";
import Select, { StylesConfig } from "react-select";
import IMUTable from "@/components/IMUTable";
import { PulseLoader } from "react-spinners";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useDarkMode } from "@/context/DarkModeContext";
import { useUserConfig } from '@/hooks/useUserConfig';

interface OptionType {
  value: string;
  label: string;
}

// IMU Data format for local files
interface IMUData {
  heading: number;
  timestamp?: string;
  accelerationMagnitude?: number;
  direction?: string;
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
  rotationRate?: number;
  ultrasonic?: number;
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  distances?: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  status?: string;
  createdAt?: string;
  imageFileName?: string; // For gallery integration

  // Expected JSON format examples:
  // Array format:
  // [
  //   {"heading":45.5, "pitch":2.1, "roll":-1.3, "yaw":0.8, "ultrasonic":12.5, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original", "timestamp": "2025-06-23T03:16:44.973Z"},
  //   {"heading":47.2, "pitch":2.3, "roll":-1.1, "yaw":1.2, "timestamp": "2025-06-23T03:16:45.329Z"}
  // ]
  //
  // Single object format:
  // {"heading":45.5, "pitch":2.1, "roll":-1.3, "yaw":0.8, "ultrasonic":12.5, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original", "timestamp": "2025-06-23T03:16:44.973Z"}
  //
  // ESP32 log format (each line is a JSON object):
  // [2025-06-23T03:16:44.973Z] [ESP32] {"heading":45.5, "pitch":2.1, "roll":-1.3, "yaw":0.8, "imageFileName": "robogo_capture_esp32_local_2025-06-22_16-13-25_original"}
  // [2025-06-23T03:16:45.329Z] [ESP32] {"heading":47.2, "pitch":2.3, "roll":-1.1, "yaw":1.2}
}

interface IMULogs {
  id: string;
  timestamp: string;
  sessionId: number;
  accelerationMagnitude?: number;
  direction?: string;
  distanceTraveled?: number;
  heading: number;
  linearAcceleration?: number;
  pitch?: number;
  roll?: number;
  rotationRate?: number;
  ultrasonic: number;
  yaw?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
  };
  status: string;
  createdAt: string;
  imageFileName?: string; // Store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
}

export default function IMU() {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<IMULogs[]>([]);
  const [summaries, setSummaries] = useState({
    average_heading: 0,
    heading_range: [0, 0],
    total_orientation_changes: 0,
    max_turn_angle: 0,
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
      console.log(`📊 [IMU DEBUG] Checking image in gallery: ${imageFileName}`);

      // Check in both originals and main gallery folder
      const galleryFolders = ['reports/gallery/originals', 'reports/gallery'];

      for (const folder of galleryFolders) {
        try {
          console.log(`📊 [IMU DEBUG] Checking folder: ${folder}`);

          const galleryResult =
            await window.electronAPI.getImagesFromFolder(folder);

          console.log(
            `📊 [IMU DEBUG] Gallery result for ${folder}:`,
            galleryResult,
          );

          if (galleryResult.success && galleryResult.images) {
            for (const image of galleryResult.images) {
              const imageBaseName = image.fileName
                .replace(/\.(jpg|jpeg|png|gif|bmp|webp)$/i, '')
                .toLowerCase();
              const targetBaseName = imageFileName.toLowerCase();

              if (
                imageBaseName === targetBaseName ||
                imageBaseName.includes(targetBaseName) ||
                targetBaseName.includes(imageBaseName)
              ) {
                console.log(
                  `📊 [IMU DEBUG] Image found! ${imageFileName} -> ${image.filePath}`,
                );
                return {
                  exists: true,
                  imagePath: image.filePath,
                };
              }
            }
          }
        } catch (folderError) {
          console.warn(
            `📊 [IMU DEBUG] Error checking folder ${folder}:`,
            folderError,
          );
        }
      }

      console.log(
        `📊 [IMU DEBUG] Image not found in gallery: ${imageFileName}`,
      );
      return { exists: false };
    } catch (error) {
      console.error(`📊 [IMU DEBUG] Error checking image existence:`, error);
      return { exists: false };
    }
  };

  // Function to parse IMU file content (JSON or ESP32 log format)
  const parseIMUFile = async (
    content: string,
    date: string,
    sessionId: number,
  ): Promise<IMULogs[]> => {
    try {
      console.log(
        '📊 [IMU DEBUG] Parsing IMU file content, length:',
        content.length,
      );

      const reports: IMULogs[] = [];
      let data: IMUData[] = [];

      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          data = parsed;
          console.log(
            '📊 [IMU DEBUG] Parsed as JSON array, length:',
            data.length,
          );
        } else {
          data = [parsed];
          console.log('📊 [IMU DEBUG] Parsed as single JSON object');
        }
      } catch {
        // If JSON parsing fails, try ESP32 log format (line by line)
        console.log(
          '📊 [IMU DEBUG] JSON parsing failed, trying ESP32 log format',
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
              console.warn('📊 [IMU DEBUG] Failed to parse line:', line);
            }
          }
        }
        console.log(
          '📊 [IMU DEBUG] Parsed ESP32 log format, entries:',
          data.length,
        );
      }

      // Convert data to IMULogs format
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
            '📊 [IMU DEBUG] Image check for',
            item.imageFileName,
            ':',
            imageCheck,
          );
        }

        // Calculate alert level/status based on data (example logic)
        let status = 'Normal';
        if (item.rotationRate && Math.abs(item.rotationRate) > 50) {
          status = 'Turn Detected';
        } else if (
          item.accelerationMagnitude &&
          item.accelerationMagnitude > 15
        ) {
          status = 'IMU Calibrated';
        }

        const report: IMULogs = {
          id: `${date}-${sessionId}-${i}`,
          timestamp,
          sessionId,
          heading: item.heading || 0,
          accelerationMagnitude: item.accelerationMagnitude,
          direction: item.direction,
          distanceTraveled: item.distanceTraveled,
          linearAcceleration: item.linearAcceleration,
          pitch: item.pitch,
          roll: item.roll,
          rotationRate: item.rotationRate,
          ultrasonic: item.ultrasonic || 0,
          yaw: item.yaw,
          distances: item.distances || {
            distTotal: item.distanceTraveled || 0,
            distX: item.position?.positionX || 0,
            distY: item.position?.positionY || 0,
          },
          velocity: {
            velocity: item.velocity,
            velocityX: item.velocityX,
            velocityY: item.velocityY,
          },
          magnetometer: item.magnetometer,
          position: item.position || { positionX: 0, positionY: 0 },
          status,
          createdAt: timestamp,
          imageFileName: item.imageFileName,
          hasImage,
          imagePath,
        };

        reports.push(report);
      }

      console.log('📊 [IMU DEBUG] Final reports generated:', reports.length);
      return reports;
    } catch (error) {
      console.error('📊 [IMU DEBUG] Error parsing IMU file:', error);
      return [];
    }
  };

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        console.log('📊 [IMU DEBUG] Checking local mode...');
        console.log(
          '📊 [IMU DEBUG] window available:',
          typeof window !== 'undefined',
        );
        console.log(
          '📊 [IMU DEBUG] electronAPI available:',
          typeof window !== 'undefined' && !!window.electronAPI,
        );
        console.log(
          '📊 [IMU DEBUG] getConfig available:',
          typeof window !== 'undefined' &&
            window.electronAPI &&
            !!window.electronAPI.getConfig,
        );

        // Check if running in Electron with local mode enabled
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          console.log('📊 [IMU DEBUG] localModeConfig:', localModeConfig);
          setIsLocalMode(!!localModeConfig);
        } else {
          // Fallback: check from API if not in Electron
          console.log('📊 [IMU DEBUG] Falling back to API check...');
        }
      } catch (error) {
        console.error('📊 [IMU DEBUG] Error checking local mode:', error);
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
        console.log('📊 [IMU DEBUG] fetchAllData started');
        console.log('📊 [IMU DEBUG] isLocalMode:', isLocalMode);
        console.log('📊 [IMU DEBUG] selectedDevice:', selectedDevice);

        if (isLocalMode) {
          // LOCAL MODE: Read from reports/imu/{date}/{sessionId}.json
          console.log(
            '📊 [IMU DEBUG] Local mode - fetching IMU data from files',
          );

          try {
            if (!window.electronAPI?.getUltrasonicFiles) {
              throw new Error('electronAPI.getUltrasonicFiles not available');
            }

            // Read IMU folder structure
            const folderResult =
              await window.electronAPI.getUltrasonicFiles('reports/imu');
            console.log('📊 [IMU DEBUG] IMU folder result:', folderResult);

            if (!folderResult.success) {
              throw new Error(
                folderResult.error || 'Failed to read IMU folder',
              );
            }

            const allDateSessions: {
              value: string;
              label: string;
              sessions: OptionType[];
            }[] = [];
            const allReports: IMULogs[] = [];

            // Process each date folder
            for (const item of folderResult.images || []) {
              if (item.isDirectory) {
                const dateFolder = item.fileName;
                console.log(
                  '📊 [IMU DEBUG] Processing date folder:',
                  dateFolder,
                );

                const sessions: OptionType[] = [];

                // Get session files for this date
                const sessionResult =
                  await window.electronAPI.getUltrasonicFiles(
                    `reports/imu/${dateFolder}`,
                  );
                console.log(
                  '📊 [IMU DEBUG] Session result for',
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
                            '📊 [IMU DEBUG] readFileContent API not available',
                          );
                          continue;
                        }

                        const fileResult =
                          await window.electronAPI.readFileContent(
                            `reports/imu/${dateFolder}/${sessionItem.fileName}`,
                          );
                        console.log(
                          '📊 [IMU DEBUG] File result for',
                          sessionItem.fileName,
                          ':',
                          fileResult,
                        );

                        if (fileResult.success && fileResult.content) {
                          const sessionReports = await parseIMUFile(
                            fileResult.content,
                            dateFolder,
                            parseInt(sessionId),
                          );
                          allReports.push(...sessionReports);
                          console.log(
                            '📊 [IMU DEBUG] Parsed',
                            sessionReports.length,
                            'IMU reports from',
                            sessionItem.fileName,
                          );
                        }
                      } catch (parseError) {
                        console.error(
                          '📊 [IMU DEBUG] Error parsing IMU file:',
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
              '📊 [IMU DEBUG] Total dates with sessions:',
              allDateSessions.length,
            );
            console.log('📊 [IMU DEBUG] Total IMU reports:', allReports.length);

            // Sort dates by newest first
            allDateSessions.sort(
              (a, b) =>
                new Date(b.value).getTime() - new Date(a.value).getTime(),
            );

            // Sort sessions within each date by newest first
            allDateSessions.forEach((dateItem) => {
              if (dateItem.sessions && dateItem.sessions.length > 0) {
                console.log(
                  '📊 [IMU DEBUG] Before sorting sessions for',
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
                  '📊 [IMU DEBUG] After sorting sessions for',
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

            console.log('📊 [IMU LOCAL] Successfully processed IMU data:', {
              totalReports: allReports.length,
              totalWithImages: allReports.filter((r) => r.hasImage).length,
              dates: allDateSessions.length,
            });
          } catch (localError) {
            console.error('📊 [IMU DEBUG] Error in local mode:', localError);
            setReports([]);
            setDateWithSessions([]);
          }
        } else {
          // ONLINE MODE: Original API calls
          const deviceName = selectedDevice?.deviceName;
          if (!deviceName) {
            console.log('Waiting for device to be selected...');
            setIsLoading(false);
            return;
          }

          const datesRes = await fetch(
            `/api/reports/imu/dates-with-sessions?deviceName=${encodeURIComponent(deviceName)}`,
          );
          const datesData = await datesRes.json();
          const data = datesData.data;

          // Sort dates by newest first
          data.sort(
            (
              a: { value: string; label: string; sessions: OptionType[] },
              b: { value: string; label: string; sessions: OptionType[] },
            ) => new Date(b.value).getTime() - new Date(a.value).getTime(),
          );

          // Sort sessions within each date by newest first
          data.forEach(
            (dateItem: {
              value: string;
              label: string;
              sessions: OptionType[];
            }) => {
              if (dateItem.sessions && dateItem.sessions.length > 0) {
                dateItem.sessions.sort((a: OptionType, b: OptionType) => {
                  // Extract session numbers for comparison
                  const sessionA = parseInt(a.value.replace(/\D/g, '')) || 0;
                  const sessionB = parseInt(b.value.replace(/\D/g, '')) || 0;
                  return sessionB - sessionA; // Newest (highest number) first
                });
              }
            },
          );

          setDateWithSessions(data);

          // Auto-select the most recent date and session only if not already selected
          if (!selectedDate && data.length > 0) {
            const defaultDate = { value: data[0].value, label: data[0].label };
            const defaultSession =
              data[0].sessions.length > 0 ? data[0].sessions[0] : null;

            setSelectedDate(defaultDate);
            if (defaultSession) {
              setSelectedSession(defaultSession);
            }
          }

          // Use current selections or defaults for API calls
          const useDate =
            selectedDate ||
            (data.length > 0
              ? { value: data[0].value, label: data[0].label }
              : null);
          const useSession =
            selectedSession ||
            (data.length > 0 && data[0].sessions.length > 0
              ? data[0].sessions[0]
              : null);

          if (useDate && useSession) {
            const summariesRes = await fetch(
              `/api/reports/imu/summaries/date/${useDate.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
            );
            const summariesData = await summariesRes.json();
            const s = summariesData.data || {};
            setSummaries({
              average_heading: s.average_heading ?? 0,
              heading_range: [
                s.heading_range?.[0] ?? 0,
                s.heading_range?.[1] ?? 0,
              ],
              total_orientation_changes: s.total_orientation_changes ?? 0,
              max_turn_angle: s.max_turn_angle ?? 0,
            });

            const reportsRes = await fetch(
              `/api/reports/imu/date/${useDate.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
            );
            const reportsResult = await reportsRes.json();
            const sortedReports = (reportsResult.data || []).sort(
              (a: IMULogs, b: IMULogs) =>
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

  function getDirectionFromHeading(heading: number): string {
    const directions = [
      'North (N)',
      'North-Northeast (NNE)',
      'Northeast (NE)',
      'East-Northeast (ENE)',
      'East (E)',
      'East-Southeast (ESE)',
      'Southeast (SE)',
      'South-Southeast (SSE)',
      'South (S)',
      'South-Southwest (SSW)',
      'Southwest (SW)',
      'West-Southwest (WSW)',
      'West (W)',
      'West-Northwest (WNW)',
      'Northwest (NW)',
      'North-Northwest (NNW)',
      'North (N)',
    ];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  }

  // Calculate filtered reports for display (computed during render, not in useEffect)
  const filteredReports = React.useMemo(() => {
    if (isLocalMode && selectedDate && selectedSession) {
      return reports.filter((report) => {
        const reportDate = report.timestamp.split('T')[0];
        const reportSessionId = report.sessionId.toString();
        const selectedSessionId = selectedSession.value.replace(/\D/g, '');

        return (
          reportDate === selectedDate.value &&
          reportSessionId === selectedSessionId
        );
      });
    }
    return reports;
  }, [reports, selectedDate, selectedSession, isLocalMode]);

  // Calculate summaries based on filtered reports (computed during render)
  const computedSummaries = React.useMemo(() => {
    const reportsToUse = isLocalMode ? filteredReports : reports;

    if (reportsToUse.length === 0) {
      return {
        average_heading: 0,
        heading_range: [0, 0] as [number, number],
        total_orientation_changes: 0,
        max_turn_angle: 0,
      };
    }

    const headings = reportsToUse.map((r) => r.heading);
    const average_heading =
      headings.reduce((a, b) => a + b, 0) / headings.length;
    const heading_range: [number, number] = [
      Math.min(...headings),
      Math.max(...headings),
    ];

    // Count significant orientation changes (> 10 degrees difference)
    let total_orientation_changes = 0;
    let max_turn_angle = 0;

    for (let i = 1; i < reportsToUse.length; i++) {
      const angleDiff = Math.abs(
        reportsToUse[i].heading - reportsToUse[i - 1].heading,
      );
      if (angleDiff > 10) {
        total_orientation_changes++;
        max_turn_angle = Math.max(max_turn_angle, angleDiff);
      }
    }

    console.log('📊 [IMU DEBUG] Summary calculation:', {
      totalReports: reportsToUse.length,
      average_heading,
      heading_range,
      total_orientation_changes,
      max_turn_angle,
    });

    return {
      average_heading,
      heading_range,
      total_orientation_changes,
      max_turn_angle,
    };
  }, [filteredReports, reports, isLocalMode]);

  // Summary items that use current filtered data
  const summaryItems = React.useMemo(() => {
    const reportsToUse = isLocalMode ? filteredReports : reports;
    return [
      {
        icon: 'lets-icons:compass-north',
        title: 'Average Heading',
        summary: `${(summaries.average_heading ?? 0).toFixed(2)}° - ${getDirectionFromHeading(summaries.average_heading ?? 0)}`,
      },
      {
        icon: 'mdi:gauge',
        title: 'Total IMU Records',
        summary: `${reportsToUse.length} Records`,
      },
      {
        icon: 'mdi:camera-image',
        title: 'Images Captured',
        summary: `${reportsToUse.filter((r) => r.hasImage).length} Images`,
      },
      {
        icon: 'ph:compass-rose-fill',
        title: 'Heading Range',
        summary: `${(summaries.heading_range?.[0] ?? 0).toFixed(2)}° - ${(summaries.heading_range?.[1] ?? 0).toFixed(2)}°`,
      },
    ] as const;
  }, [summaries, filteredReports, reports, isLocalMode]);

  // Update summaries state when computed summaries change (only in local mode)
  React.useEffect(() => {
    if (isLocalMode) {
      setSummaries(computedSummaries);
    }
  }, [computedSummaries, isLocalMode]);

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
        'flex flex-col gap-4 p-5 transition-colors duration-300',
        isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {isLoading ? (
        <div
          className='flex flex-col justify-center items-center'
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
              isDark ? 'text-gray-300' : 'text-gray-500',
            )}
          >
            Loading IMU reports, please wait...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div
          className={clsx(
            'flex flex-col justify-center items-center w-full p-4 border-2 rounded-xl',
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
            No IMU reports available. Please check back later.
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
                      neutral20: isDark ? '#fff' : '#333',
                      neutral50: isDark ? '#fff' : '#333',
                      neutral60: isDark ? '#fff' : '#333',
                      neutral10: isDark ? '#fff' : '#333',
                    },
                  })}
                />
              </div>
            )}
          </div>
          <IMUTable reports={isLocalMode ? filteredReports : reports} />
        </>
      )}
    </div>
  );
}
