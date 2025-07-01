"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Select, { StylesConfig } from "react-select";
import ShortSummary from '@/components/cards/ShortSummaryCard';
import PathsTable from '@/components/PathsTable';
import TunnelPath from '@/components/cards/TunnelPathCard';

// Ultrasonic sensor threshold for danger detection (in cm)
const ULTRASONIC_DANGER_THRESHOLD = 10;
import { Icon } from '@iconify/react/dist/iconify.js';
import { PulseLoader } from 'react-spinners';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';

interface OptionType {
  value: string;
  label: string;
}

interface Position {
  x: number;
  y: number;
}

// Path Data format for local files
interface PathFileData {
  timestamp?: string;
  createdAt?: string;
  position?: {
    positionX?: number;
    positionY?: number;
  };
  speed?: number;
  velocity?: number;
  heading?: number;
  direction?: string;
  distanceTraveled?: number;
  imageFileName?: string; // New field for gallery integration
  ultrasonic?: number; // Ultrasonic sensor distance in cm
  ultrasonicDistance?: number; // Alternative field name for ultrasonic
  distance?: number; // Generic distance field
}

interface PathData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
  imageFileName?: string; // Store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
  isEndpoint?: boolean; // Flag to indicate if this is the last point
  ultrasonic?: number; // Ultrasonic sensor data for obstacle detection
  isDanger?: boolean; // Computed field for danger indication
}

export default function Paths() {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<PathData[]>([]);
  const [summaries, setSummaries] = useState({
    totalPaths: 0,
    averageSpeed: 0,
    totalDistance: 0,
    maxSpeed: 0,
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
      console.log(`🛤️ [PATHS DEBUG] Checking image in gallery: ${imageFileName}`);

      // Check in both originals and main gallery folder
      const galleryFolders = ['reports/gallery/originals', 'reports/gallery'];

      for (const folder of galleryFolders) {
        try {
          console.log(`🛤️ [PATHS DEBUG] Checking folder: ${folder}`);

          const galleryResult =
            await window.electronAPI.getImagesFromFolder(folder);

          console.log(
            `🛤️ [PATHS DEBUG] Gallery result for ${folder}:`,
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
                  `🛤️ [PATHS DEBUG] Image found! ${imageFileName} -> ${image.filePath}`,
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
            `🛤️ [PATHS DEBUG] Error checking folder ${folder}:`,
            folderError,
          );
        }
      }

      console.log(
        `🛤️ [PATHS DEBUG] Image not found in gallery: ${imageFileName}`,
      );
      return { exists: false };
    } catch (error) {
      console.error(`🛤️ [PATHS DEBUG] Error checking image existence:`, error);
      return { exists: false };
    }
  };

  // Function to parse Path file content (JSON or ESP32 log format)
  const parsePathFile = async (
    content: string,
    date: string,
    sessionId: number,
  ): Promise<PathData[]> => {
    try {
      console.log(
        '🛤️ [PATHS DEBUG] Parsing Path file content, length:',
        content.length,
      );

      const reports: PathData[] = [];
      let data: PathFileData[] = [];

      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          data = parsed;
          console.log(
            '🛤️ [PATHS DEBUG] Parsed as JSON array, length:',
            data.length,
          );
        } else {
          data = [parsed];
          console.log('🛤️ [PATHS DEBUG] Parsed as single JSON object');
        }
      } catch {
        // If JSON parsing fails, try ESP32 log format (line by line)
        console.log(
          '🛤️ [PATHS DEBUG] JSON parsing failed, trying ESP32 log format',
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
              console.warn('🛤️ [PATHS DEBUG] Failed to parse line:', line);
            }
          }
        }
        console.log(
          '🛤️ [PATHS DEBUG] Parsed ESP32 log format, entries:',
          data.length,
        );
      }

      // Convert data to PathData format
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
            '🛤️ [PATHS DEBUG] Image check for',
            item.imageFileName,
            ':',
            imageCheck,
          );
        }        // Determine status based on position in data array
        let status: string;
        if (i === 0) {
          status = 'Start';
        } else if (i === data.length - 1) {
          status = 'Stop';
        } else {
          status = 'Moving';        }        // Parse ultrasonic data and determine danger status
        const ultrasonicValue = item.ultrasonic || item.ultrasonicDistance || item.distance;
        const isDanger = ultrasonicValue !== undefined && ultrasonicValue < ULTRASONIC_DANGER_THRESHOLD;

        // Debug ultrasonic data
        if (ultrasonicValue !== undefined) {
          console.log(`🛤️ [PATHS DEBUG] Point ${i} ultrasonic:`, {
            ultrasonicValue,
            isDanger,
            threshold: ULTRASONIC_DANGER_THRESHOLD,
            position: `(${item.position?.positionX || 0}, ${item.position?.positionY || 0})`,
          });
        }

        const report: PathData = {
          id: `${date}-${sessionId}-${i}`,
          timestamp,
          sessionId,
          position: {
            x: item.position?.positionX || 0,
            y: item.position?.positionY || 0,
          },
          speed: item.speed || item.velocity || 0,
          heading: item.heading || 0,
          status,
          createdAt: timestamp,
          imageFileName: item.imageFileName,
          hasImage,
          imagePath,
          isEndpoint: i === data.length - 1, // Mark last item as endpoint
          ultrasonic: ultrasonicValue, // Include ultrasonic sensor data
          isDanger, // Mark as danger if obstacle detected
        };

        reports.push(report);
      }

      console.log('🛤️ [PATHS DEBUG] Final reports generated:', reports.length);
      return reports;
    } catch (error) {
      console.error('🛤️ [PATHS DEBUG] Error parsing Path file:', error);
      return [];
    }
  };

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        console.log('🛤️ [PATHS DEBUG] Checking local mode...');
        console.log(
          '🛤️ [PATHS DEBUG] window available:',
          typeof window !== 'undefined',
        );
        console.log(
          '🛤️ [PATHS DEBUG] electronAPI available:',
          typeof window !== 'undefined' && !!window.electronAPI,
        );
        console.log(
          '🛤️ [PATHS DEBUG] getConfig available:',
          typeof window !== 'undefined' &&
            window.electronAPI &&
            !!window.electronAPI.getConfig,
        );

        // Check if running in Electron with local mode enabled
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          console.log('🛤️ [PATHS DEBUG] localModeConfig:', localModeConfig);
          setIsLocalMode(!!localModeConfig);
        } else {
          // Fallback: check from API if not in Electron
          console.log('🛤️ [PATHS DEBUG] Falling back to API check...');
        }
      } catch (error) {
        console.error('🛤️ [PATHS DEBUG] Error checking local mode:', error);
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
        console.log('🛤️ [PATHS DEBUG] fetchAllData started');
        console.log('🛤️ [PATHS DEBUG] isLocalMode:', isLocalMode);
        console.log('🛤️ [PATHS DEBUG] selectedDevice:', selectedDevice);

        if (isLocalMode) {
          // LOCAL MODE: Read from reports/paths/{date}/{sessionId}.json
          console.log(
            '🛤️ [PATHS DEBUG] Local mode - fetching Path data from files',
          );

          try {
            if (!window.electronAPI?.getUltrasonicFiles) {
              throw new Error('electronAPI.getUltrasonicFiles not available');
            }

            // Read Path folder structure
            const folderResult =
              await window.electronAPI.getUltrasonicFiles('reports/paths');
            console.log('🛤️ [PATHS DEBUG] Path folder result:', folderResult);

            if (!folderResult.success) {
              throw new Error(
                folderResult.error || 'Failed to read Path folder',
              );
            }

            const allDateSessions: {
              value: string;
              label: string;
              sessions: OptionType[];
            }[] = [];
            const allReports: PathData[] = [];

            // Process each date folder
            for (const item of folderResult.images || []) {
              if (item.isDirectory) {
                const dateFolder = item.fileName;
                console.log(
                  '🛤️ [PATHS DEBUG] Processing date folder:',
                  dateFolder,
                );

                const sessions: OptionType[] = [];

                // Get session files for this date
                const sessionResult =
                  await window.electronAPI.getUltrasonicFiles(
                    `reports/paths/${dateFolder}`,
                  );
                console.log(
                  '🛤️ [PATHS DEBUG] Session result for',
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
                            '🛤️ [PATHS DEBUG] readFileContent API not available',
                          );
                          continue;
                        }

                        const fileResult =
                          await window.electronAPI.readFileContent(
                            `reports/paths/${dateFolder}/${sessionItem.fileName}`,
                          );
                        console.log(
                          '🛤️ [PATHS DEBUG] File result for',
                          sessionItem.fileName,
                          ':',
                          fileResult,
                        );

                        if (fileResult.success && fileResult.content) {
                          const sessionReports = await parsePathFile(
                            fileResult.content,
                            dateFolder,
                            parseInt(sessionId),
                          );
                          allReports.push(...sessionReports);
                          console.log(
                            '🛤️ [PATHS DEBUG] Parsed',
                            sessionReports.length,
                            'Path reports from',
                            sessionItem.fileName,
                          );
                        }
                      } catch (parseError) {
                        console.error(
                          '🛤️ [PATHS DEBUG] Error parsing Path file:',
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
              '🛤️ [PATHS DEBUG] Total dates with sessions:',
              allDateSessions.length,
            );
            console.log(
              '🛤️ [PATHS DEBUG] Total Path reports:',
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
                  '🛤️ [PATHS DEBUG] Before sorting sessions for',
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
                  '🛤️ [PATHS DEBUG] After sorting sessions for',
                  dateItem.value,
                  ':',
                  dateItem.sessions.map((s) => s.value),
                );
              }
            });

            setDateWithSessions(allDateSessions);

            // Auto-select the most recent date and session only if not already selected
            if (!selectedDate && allDateSessions.length > 0) {
              const defaultDate = allDateSessions[0];
              const defaultSession =
                defaultDate.sessions.length > 0
                  ? defaultDate.sessions[0]
                  : null;

              setSelectedDate(defaultDate);
              if (defaultSession) {
                setSelectedSession(defaultSession);
              }
            }

            // Set ALL reports data (no filtering here - let useMemo handle filtering)
            setReports(
              allReports.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              ),
            );

            console.log('🛤️ [PATHS LOCAL] Successfully loaded ALL Path data:', {
              totalReports: allReports.length,
              totalWithImages: allReports.filter((r) => r.hasImage).length,
              dateWithSessions: allDateSessions.length,
            });
          } catch (localError) {
            console.error('🛤️ [PATHS DEBUG] Error in local mode:', localError);
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
            `/api/reports/paths/dates-with-sessions?deviceName=${encodeURIComponent(deviceName)}`,
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
            // Fetch reports
            const reportsRes = await fetch(
              `/api/reports/paths/date/${useDate.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
            );
            const reportsResult = await reportsRes.json();
            const pathData = reportsResult.data || [];

            const sortedReports = pathData.sort(
              (a: PathData, b: PathData) =>
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

  // Calculate filtered reports for display (computed during render, not in useEffect)
  const filteredReports = React.useMemo(() => {
    console.log('🛤️ [PATHS DEBUG] useMemo filteredReports triggered', {
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

        if (!matches) {
          console.log('🛤️ [PATHS DEBUG] Report filtered out:', {
            reportDate,
            reportSessionId,
            selectedDate: selectedDate.value,
            selectedSessionId,
            timestamp: report.timestamp,
          });
        }

        return matches;
      });

      console.log('🛤️ [PATHS DEBUG] Filtering result:', {
        totalReports: reports.length,
        filteredReports: filtered.length,
        selectedDate: selectedDate.value,
        selectedSession: selectedSession.value,
      });

      return filtered;
    }
    return reports;
  }, [reports, selectedDate, selectedSession, isLocalMode]);

  // Calculate summaries based on filtered reports (computed during render)
  const computedSummaries = React.useMemo(() => {
    const reportsToUse = isLocalMode ? filteredReports : reports;

    if (reportsToUse.length === 0) {
      return {
        totalPaths: 0,
        averageSpeed: 0,
        totalDistance: 0,
        maxSpeed: 0,
      };
    }

    // Calculate summaries from the data
    const totalPaths = reportsToUse.length;
    const speeds = reportsToUse
      .map((p: PathData) => p.speed)
      .filter((s: number) => s > 0);
    const averageSpeed =
      speeds.length > 0
        ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length
        : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    // Calculate total distance (rough estimate from position changes)
    let totalDistance = 0;
    for (let i = 1; i < reportsToUse.length; i++) {
      const prev = reportsToUse[i - 1];
      const curr = reportsToUse[i];
      const dx = curr.position.x - prev.position.x;
      const dy = curr.position.y - prev.position.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    console.log('🛤️ [PATHS DEBUG] Summary calculation:', {
      totalReports: reportsToUse.length,
      totalPaths,
      averageSpeed,
      maxSpeed,
      totalDistance,
    });

    return {
      totalPaths,
      averageSpeed,
      totalDistance,
      maxSpeed,
    };
  }, [filteredReports, reports, isLocalMode]);

  // Update summaries state when computed summaries change (only in local mode)
  React.useEffect(() => {
    if (isLocalMode) {
      setSummaries(computedSummaries);
    }
  }, [computedSummaries, isLocalMode]);

  // Summary items that use current filtered data
  const summaryItems = React.useMemo(() => {
    const currentSummaries = isLocalMode ? computedSummaries : summaries;
    return [
      {
        icon: 'mdi:map-marker-path',
        title: 'Total Path Points',
        summary: `${currentSummaries.totalPaths} Points`,
      },
      {
        icon: 'mdi:speedometer',
        title: 'Average Speed',
        summary: `${currentSummaries.averageSpeed.toFixed(2)} cm/s`,
      },
      {
        icon: 'mdi:map-marker-distance',
        title: 'Total Distance',
        summary: `${currentSummaries.totalDistance.toFixed(2)} cm`,
      },
      {
        icon: 'mdi:speedometer-medium',
        title: 'Max Speed',
        summary: `${currentSummaries.maxSpeed.toFixed(2)} cm/s`,
      },
    ];
  }, [summaries, computedSummaries, isLocalMode]);

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
              ? 'Loading local path data, please wait...'
              : 'Loading path reports, please wait...'}
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
              ? 'No path data found in local reports folder. Capture some movement data to see them here!'
              : 'No path reports available. Please check back later.'}
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
                    console.log('🛤️ [PATHS DEBUG] Date changed:', option);
                    setSelectedDate(option);
                    const selected = dateWithSessions.find(
                      (d) => d.value === option?.value,
                    );
                    if (selected?.sessions.length) {
                      console.log(
                        '🛤️ [PATHS DEBUG] Auto-selecting first session:',
                        selected.sessions[0],
                      );
                      setSelectedSession(selected.sessions[0]);
                    } else {
                      console.log(
                        '🛤️ [PATHS DEBUG] No sessions found for date',
                      );
                      setSelectedSession(null);
                    }
                  }}
                  isSearchable={false}
                  className='flex-1'
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
                  onChange={(option) => {
                    console.log('🛤️ [PATHS DEBUG] Session changed:', option);
                    setSelectedSession(option);
                  }}
                  isSearchable={false}
                  isDisabled={!selectedDate}
                  className='flex-1'
                />
              </div>
            )}
          </div>{' '}
          {/* Path Visualization */}
          <TunnelPath
            showStartpoint
            showEndpoint
            pathData={(() => {
              const dataToPass = (isLocalMode ? filteredReports : reports).map(
                (report) => ({
                  ...report,
                  imageUrl:
                    report.hasImage && report.imagePath
                      ? `file://${report.imagePath}`
                      : undefined,
                }),
              );
              console.log(
                '🛤️ [PATHS DEBUG] Data passed to TunnelPath:',
                dataToPass,
              );
              console.log(
                '🛤️ [PATHS DEBUG] Points with images:',
                dataToPass.filter((p) => p.imageUrl),
              );
              console.log('🛤️ [PATHS DEBUG] First point details:', {
                position: dataToPass[0]?.position,
                imageUrl: dataToPass[0]?.imageUrl,
                hasImage: dataToPass[0]?.hasImage,
                imagePath: dataToPass[0]?.imagePath,
                imageFileName: dataToPass[0]?.imageFileName,
              });
              return dataToPass;
            })()}
          />
          {/* Legends Section */}
          <div className='flex flex-col md:flex-row gap-4 w-full'>
            <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl text-white justify-center md:justify-start'>
              <Icon icon='mdi:map-legend' width={24} height={24} />
              <p>Legends</p>
            </div>
            <div
              className={clsx(
                'flex flex-wrap justify-between w-full gap-4 px-4 py-2 rounded-xl border-2',
                isDark ? 'border-[#223355]' : 'border-[#DCDCDC]',
              )}
            >
              {/* Each legend item */}
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center'>
                  <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800]' />
                </div>
                <p className='bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-transparent bg-clip-text font-medium'>
                  Start Point
                </p>
              </div>
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FF9799]/30 to-[#EB0C0F]/30 flex items-center justify-center'>
                  <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FF9799] to-[#EB0C0F]' />
                </div>
                <p className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-transparent bg-clip-text font-medium'>
                  End Point
                </p>
              </div>{' '}
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='w-8 h-1 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full' />
                <p className='bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text font-medium'>
                  RoboGo Path
                </p>
              </div>
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='rounded-full w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center animate-pulse'>
                  <Icon
                    icon='material-symbols:warning'
                    className='text-white'
                    width={16}
                    height={16}
                  />
                </div>
                <p className='bg-gradient-to-br from-red-600 to-red-500 text-transparent bg-clip-text font-medium'>
                  Obstacle Detected
                </p>
              </div>
            </div>
          </div>
          {/* Paths Table */}
          <div className='overflow-x-auto'>
            <PathsTable reports={isLocalMode ? filteredReports : reports} />
          </div>
        </>
      )}
    </div>
  );
}
