import ShortSummary from "@/components/cards/ShortSummaryCard";
import TunnelPath from "@/components/cards/TunnelPathCard";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import clsx from 'clsx';

// Type definition for ultrasonic data
interface UltrasonicDataItem {
  distance: number;
  timestamp?: string;
  ultrasonic?: number;
  ultrasonicDistance?: number;
}

// Default path data as fallback
const defaultPathData = [
  {
    id: 'R1YdU00PTvQoeZZOKml3',
    timestamp: '2025-04-27T08:51:35.092Z',
    sessionId: 1,
    position: {
      x: 0.5,
      y: 0.5,
    },
    speed: 1.25,
    heading: 45,
    status: 'Start',
    createdAt: '2025-05-05T04:34:30.027Z',
  },
  {
    id: 'PeFkafFbvirNb2A9QyZO',
    timestamp: '2025-04-27T08:53:40.092Z',
    sessionId: 1,
    position: {
      x: 2.5,
      y: 1,
    },
    imageUrl:
      'https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg',
    speed: 2.5,
    heading: 90,
    status: 'Moving',
    createdAt: '2025-05-05T04:34:45.276Z',
  },
  {
    id: 'tNwMn6erKWr5i1XZwQF5',
    timestamp: '2025-04-27T08:58:40.092Z',
    sessionId: 1,
    position: {
      x: 5.8,
      y: 3.4,
    },
    speed: 0,
    heading: 134,
    status: 'Stop',
    createdAt: '2025-05-05T05:50:19.979Z',
  },
];

export default function MidArea_Home() {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<number | null>(null);
  const [pathData, setPathData] = useState(defaultPathData);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalImages: 0,
    totalObstacles: 0,
    totalPaths: 0,
    averageDistance: 0,
  });

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          const isLocal = !!localModeConfig;
          setIsLocalMode(isLocal);
          console.log('🔍 Mode Detection: Local Mode =', isLocal);
          console.log('📁 Window electronAPI available:', !!window.electronAPI);
        } else {
          const response = await fetch('/api/user/config');
          if (response.ok) {
            const data = await response.json();
            const isLocal = data.data?.localMode || false;
            setIsLocalMode(isLocal);
            console.log(
              '🔍 Mode Detection: Local Mode =',
              isLocal,
              '(from API)',
            );
          }
        }
      } catch (error) {
        console.error('❌ Error checking local mode:', error);
        setIsLocalMode(false);
      }
    };
    checkLocalMode();
  }, []);
  // Function to fetch summary data from local reports folders
  const fetchSummaryData = async (reportsFolder: string) => {
    try {
      console.log('📊 Fetching summary data from local folder:', reportsFolder);
      // Use forward slashes for consistent relative paths
      const pathJoin = (a: string, b: string) => {
        // Remove trailing slashes and backslashes
        const cleanA = a.replace(/[/\\]+$/, '');
        const cleanB = b.replace(/^[/\\]+/, '');
        return `${cleanA}/${cleanB}`;
      };
      let totalImages = 0;
      let totalObstacles = 0;
      let totalPaths = 0;
      let totalDistance = 0;

      // Check gallery folder for total images
      const galleryFolder = pathJoin(String(reportsFolder), 'gallery');
      console.log('🖼️ Checking gallery folder:', galleryFolder);
      if (window.electronAPI?.getImagesFromFolder) {
        const galleryResult =
          await window.electronAPI.getImagesFromFolder(galleryFolder);
        if (galleryResult?.success && galleryResult.images) {
          totalImages = galleryResult.images.filter(
            (img) =>
              img.fileName && /\.(jpg|jpeg|png|bmp|gif)$/i.test(img.fileName),
          ).length;
          console.log('📷 Total images found:', totalImages);
        }
      }

      // Check ultrasonic folder for obstacles (distance < 10cm)
      const ultrasonicFolder = pathJoin(String(reportsFolder), 'ultrasonic');
      console.log('📡 Checking ultrasonic folder:', ultrasonicFolder);
      if (window.electronAPI?.getImagesFromFolder) {
        const ultrasonicResult =
          await window.electronAPI.getImagesFromFolder(ultrasonicFolder);
        if (ultrasonicResult?.success && ultrasonicResult.images) {
          for (const dateFolder of ultrasonicResult.images) {
            if (
              dateFolder.fileName &&
              /^\d{4}-\d{2}-\d{2}$/.test(dateFolder.fileName)
            ) {
              const dateFolderPath = pathJoin(
                ultrasonicFolder,
                dateFolder.fileName,
              );
              const dateResult =
                await window.electronAPI.getImagesFromFolder(dateFolderPath);
              if (dateResult?.success && dateResult.images) {
                for (const jsonFile of dateResult.images) {
                  if (
                    jsonFile.fileName &&
                    jsonFile.fileName.endsWith('.json')
                  ) {
                    if (window.electronAPI?.readFile) {
                      // Use relative path from Documents/RoboGo to avoid duplication
                      const relativePath = `${dateFolderPath}/${jsonFile.fileName}`;
                      console.log(
                        '🔧 Using relative ultrasonic file path:',
                        relativePath,
                      );

                      const fileResult =
                        await window.electronAPI.readFile(relativePath);
                      if (fileResult?.success && fileResult.content) {
                        try {
                          const data = JSON.parse(fileResult.content);
                          const dataArray = Array.isArray(data) ? data : [data];
                          totalObstacles += dataArray.filter(
                            (item) =>
                              (item.ultrasonic ||
                                item.ultrasonicDistance ||
                                item.distance) < 10,
                          ).length;
                        } catch (e) {
                          console.warn('Error parsing ultrasonic JSON:', e);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        console.log('🚧 Total obstacles found:', totalObstacles);
      }

      // Check paths folder for total paths and average distance
      const pathsFolder = pathJoin(String(reportsFolder), 'paths');
      console.log('🛤️ Checking paths folder:', pathsFolder);
      if (window.electronAPI?.getImagesFromFolder) {
        const pathsResult =
          await window.electronAPI.getImagesFromFolder(pathsFolder);
        if (pathsResult?.success && pathsResult.images) {
          console.log('📂 Found path date folders:', pathsResult.images.length);
          for (const dateFolder of pathsResult.images) {
            if (
              dateFolder.fileName &&
              /^\d{4}-\d{2}-\d{2}$/.test(dateFolder.fileName)
            ) {
              const dateFolderPath = pathJoin(pathsFolder, dateFolder.fileName);
              const dateResult =
                await window.electronAPI.getImagesFromFolder(dateFolderPath);
              if (dateResult?.success && dateResult.images) {
                console.log(
                  `📄 Found ${dateResult.images.length} files in ${dateFolder.fileName}`,
                );
                for (const jsonFile of dateResult.images) {
                  if (
                    jsonFile.fileName &&
                    jsonFile.fileName.endsWith('.json')
                  ) {
                    if (window.electronAPI?.readFile) {
                      // Use relative path from Documents/RoboGo to avoid duplication
                      const relativePath = `${dateFolderPath}/${jsonFile.fileName}`;
                      console.log(
                        '🔧 Using relative paths file path:',
                        relativePath,
                      );

                      const fileResult =
                        await window.electronAPI.readFile(relativePath);
                      if (fileResult?.success && fileResult.content) {
                        try {
                          const data = JSON.parse(fileResult.content);
                          const dataArray = Array.isArray(data) ? data : [data];
                          totalPaths += dataArray.length;
                          console.log(
                            `📍 ${jsonFile.fileName}: ${dataArray.length} path points`,
                          );

                          // Calculate distances between consecutive points
                          for (let i = 1; i < dataArray.length; i++) {
                            const prev = dataArray[i - 1];
                            const curr = dataArray[i];
                            if (prev.position && curr.position) {
                              const dx =
                                (curr.position.positionX ||
                                  curr.position.x ||
                                  0) -
                                (prev.position.positionX ||
                                  prev.position.x ||
                                  0);
                              const dy =
                                (curr.position.positionY ||
                                  curr.position.y ||
                                  0) -
                                (prev.position.positionY ||
                                  prev.position.y ||
                                  0);
                              totalDistance += Math.sqrt(dx * dx + dy * dy);
                            }
                          }
                        } catch (e) {
                          console.warn('Error parsing paths JSON:', e);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const finalSummary = {
        totalImages,
        totalObstacles,
        totalPaths,
        averageDistance: totalPaths > 0 ? totalDistance / totalPaths : 0,
      };

      console.log('📈 Final Summary Data:', finalSummary);
      setSummaryData(finalSummary);
    } catch (error) {
      console.error('❌ Error fetching summary data:', error);
      setSummaryData({
        totalImages: 0,
        totalObstacles: 0,
        totalPaths: 0,
        averageDistance: 0,
      });
    }
  };
  // Function to fetch summary data from online APIs
  const fetchSummaryDataOnline = useCallback(async () => {
    try {
      if (!selectedDevice?.deviceName) return;

      let totalImages = 0;
      let totalObstacles = 0;
      let totalPaths = 0;
      let averageDistance = 0;

      // Fetch from gallery API
      try {
        const galleryResponse = await fetch(
          `/api/monitoring/realtime/images?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
        );
        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json();
          totalImages = galleryData.data?.length || 0;
        }
      } catch (e) {
        console.warn('Error fetching gallery data:', e);
      }

      // Fetch from ultrasonic API
      try {
        const ultrasonicResponse = await fetch(
          `/api/reports/ultrasonic?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
        );
        if (ultrasonicResponse.ok) {
          const ultrasonicData = await ultrasonicResponse.json();
          totalObstacles =
            ultrasonicData.data?.filter(
              (item: UltrasonicDataItem) => item.distance < 10,
            ).length || 0;
        }
      } catch (e) {
        console.warn('Error fetching ultrasonic data:', e);
      }

      // Fetch from paths API
      try {
        const pathsResponse = await fetch(
          `/api/reports/paths?deviceName=${encodeURIComponent(selectedDevice.deviceName)}`,
        );
        if (pathsResponse.ok) {
          const pathsData = await pathsResponse.json();
          totalPaths = pathsData.data?.length || 0;

          // Calculate average distance from paths
          if (pathsData.data && pathsData.data.length > 1) {
            let totalDistance = 0;
            for (let i = 1; i < pathsData.data.length; i++) {
              const prev = pathsData.data[i - 1];
              const curr = pathsData.data[i];
              if (prev.position && curr.position) {
                const dx = curr.position.x - prev.position.x;
                const dy = curr.position.y - prev.position.y;
                totalDistance = totalDistance + Math.sqrt(dx * dx + dy * dy);
              }
            }
            averageDistance = totalDistance / (pathsData.data.length - 1);
          }
        }
      } catch (e) {
        console.warn('Error fetching paths data:', e);
      }
      setSummaryData({
        totalImages,
        totalObstacles,
        totalPaths,
        averageDistance,
      });
    } catch (error) {
      console.error('Error fetching online summary data:', error);
      setSummaryData({
        totalImages: 0,
        totalObstacles: 0,
        totalPaths: 0,
        averageDistance: 0,
      });
    }
  }, [selectedDevice?.deviceName]);
  // Fetch last activity from paths folder
  useEffect(() => {
    const fetchLastActivity = async () => {
      try {
        console.log(
          '🔄 Fetching last activity. Mode:',
          isLocalMode ? 'LOCAL' : 'ONLINE',
        );

        if (
          isLocalMode &&
          typeof window !== 'undefined' &&
          window.electronAPI?.getImagesFromFolder &&
          window.electronAPI?.getConfig
        ) {
          // Local mode: check reports/paths folder
          console.log('💻 Running in LOCAL mode - checking local files'); // Use forward slashes for consistent relative paths
          const pathJoin = (a: string, b: string) => {
            // Remove trailing slashes and backslashes
            const cleanA = a.replace(/[/\\]+$/, '');
            const cleanB = b.replace(/^[/\\]+/, '');
            return `${cleanA}/${cleanB}`;
          };
          const reportsFolder =
            await window.electronAPI.getConfig('reportsFolder');

          console.log('📁 Reports folder config:', reportsFolder);
          console.log('📁 Reports folder type:', typeof reportsFolder); // Instead of using the absolute path, use relative paths from Documents/RoboGo
          // This avoids all path duplication issues
          const cleanReportsFolder = 'reports'; // Always use relative path

          if (cleanReportsFolder) {
            const pathsFolder = pathJoin(String(cleanReportsFolder), 'paths');
            const result =
              await window.electronAPI.getImagesFromFolder(pathsFolder);

            console.log('📂 Paths folder result:', result);

            if (result.success && result.images) {
              // Get all date folders and find the most recent one
              const dateFolders = result.images
                .filter(
                  (item) =>
                    item.fileName && /^\d{4}-\d{2}-\d{2}$/.test(item.fileName),
                )
                .sort((a, b) =>
                  (b.fileName || '').localeCompare(a.fileName || ''),
                );

              console.log(
                '📅 Found date folders:',
                dateFolders.map((f) => f.fileName),
              );

              if (dateFolders.length > 0) {
                const latestDate = dateFolders[0].fileName;
                setLastActivity(latestDate || null);
                setHasData(true);
                console.log('✅ Latest activity date:', latestDate);

                // Try to load path data from the latest date
                await loadPathDataFromDate(
                  latestDate || '',
                  pathsFolder,
                  pathJoin,
                ); // Also fetch summary data from all reports folders
                await fetchSummaryData(String(cleanReportsFolder));
              } else {
                console.log('⚠️ No date folders found');
                setLastActivity(null);
                setLastSessionId(null);
                setHasData(false);
                setPathData([]); // Clear path data if no data available
                setSummaryData({
                  totalImages: 0,
                  totalObstacles: 0,
                  totalPaths: 0,
                  averageDistance: 0,
                });
              }
            } else {
              console.log(
                '❌ Failed to access paths folder or no images found',
              );
            }
          } else {
            console.log('❌ No reports folder configured');
          }
        } else if (!isLocalMode && selectedDevice?.deviceName) {
          // Online mode: fetch from API
          console.log('🌐 Running in ONLINE mode - fetching from APIs');
          try {
            const response = await fetch(
              `/api/reports/paths?deviceName=${encodeURIComponent(selectedDevice.deviceName)}&limit=1`,
            );
            if (response.ok) {
              const data = await response.json();
              if (data.data && data.data.length > 0) {
                const latestReport = data.data[0];
                const activityDate = new Date(
                  latestReport.createdAt || latestReport.timestamp,
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                setLastActivity(activityDate);
                setHasData(true);

                // Extract session ID from latest report
                const sessionId =
                  latestReport.sessionId || latestReport.session || 1;
                setLastSessionId(sessionId);
                console.log('📊 Latest session ID (online):', sessionId);

                // Update path data with recent data
                const recentResponse = await fetch(
                  `/api/reports/paths?deviceName=${encodeURIComponent(selectedDevice.deviceName)}&limit=10`,
                );
                if (recentResponse.ok) {
                  const recentData = await recentResponse.json();
                  if (recentData.data && recentData.data.length > 0) {
                    setPathData(recentData.data.slice(0, 3)); // Show last 3 points
                  }
                } // Fetch summary data from APIs
                await fetchSummaryDataOnline();
              } else {
                setLastActivity(null);
                setLastSessionId(null);
                setHasData(false);
                setPathData([]);
                setSummaryData({
                  totalImages: 0,
                  totalObstacles: 0,
                  totalPaths: 0,
                  averageDistance: 0,
                });
              }
            } else {
              setLastActivity(null);
              setLastSessionId(null);
              setHasData(false);
              setPathData([]);
              setSummaryData({
                totalImages: 0,
                totalObstacles: 0,
                totalPaths: 0,
                averageDistance: 0,
              });
            }
          } catch (error) {
            console.error('Error fetching last activity from API:', error);
            setLastActivity('Error loading data');
          }
        } else {
          console.log('⚠️ Waiting for mode detection or device selection...');
          console.log('isLocalMode:', isLocalMode);
          console.log('selectedDevice:', selectedDevice);
          console.log('window.electronAPI available:', !!window.electronAPI);
        }
      } catch (error) {
        console.error('❌ Error fetching last activity:', error);
        setLastActivity('Error loading data');
      }
    };
    fetchLastActivity();
  }, [isLocalMode, selectedDevice, fetchSummaryDataOnline]);
  // Function to load path data from specific date folder
  const loadPathDataFromDate = async (
    date: string,
    pathsFolder: string,
    pathJoin: (a: string, b: string) => string,
  ) => {
    try {
      if (
        !window.electronAPI?.getImagesFromFolder ||
        !window.electronAPI?.readFile
      )
        return;
      console.log('📄 Loading path data from date:', date);
      console.log('📁 Paths folder:', pathsFolder);
      const dateFolderPath = pathJoin(pathsFolder, date);
      console.log('📂 Date folder path:', dateFolderPath);
      const dateResult =
        await window.electronAPI.getImagesFromFolder(dateFolderPath);

      if (dateResult?.success && dateResult.images) {
        // Find JSON files in the date folder
        const jsonFiles = dateResult.images.filter(
          (file) =>
            file.fileName && file.fileName.toLowerCase().endsWith('.json'),
        );
        if (jsonFiles.length > 0) {
          // Load the first JSON file to get recent path data
          const jsonFile = jsonFiles[0];
          console.log('📄 Reading JSON file:', jsonFile.fileName);
          console.log('📂 Full file path:', jsonFile.filePath); // Use relative path from Documents/RoboGo to avoid duplication
          const relativePath = `${dateFolderPath}/${jsonFile.fileName}`;
          console.log('🔧 Using relative file path:', relativePath);

          const result = await window.electronAPI.readFile(relativePath);

          if (result && result.success && result.content) {
            try {
              const pathDataArray = JSON.parse(result.content);
              if (Array.isArray(pathDataArray) && pathDataArray.length > 0) {
                // Extract session ID from the latest path data
                const latestItem = pathDataArray[pathDataArray.length - 1];
                let sessionId = latestItem.sessionId || latestItem.session;

                // If no session ID in data, try to extract from filename
                if (!sessionId) {
                  const match = jsonFile.fileName?.match(/(\d+)\.json$/);
                  sessionId = match ? parseInt(match[1]) : 1;
                }

                setLastSessionId(sessionId);
                console.log(
                  '📊 Latest session ID:',
                  sessionId,
                  '(from file:',
                  jsonFile.fileName,
                  ')',
                );

                // Convert to the format expected by TunnelPath
                const convertedData = pathDataArray.slice(-3).map(
                  (
                    item: {
                      timestamp?: string;
                      createdAt?: string;
                      position?: {
                        positionX?: number;
                        positionY?: number;
                        x?: number;
                        y?: number;
                      };
                      speed?: number;
                      velocity?: number;
                      heading?: number;
                      sessionId?: number;
                      session?: number;
                    },
                    index: number,
                  ) => ({
                    id: `${date}-${index}`,
                    timestamp: item.timestamp || new Date().toISOString(),
                    sessionId: item.sessionId || item.session || 1,
                    position: {
                      x: item.position?.positionX || item.position?.x || 0,
                      y: item.position?.positionY || item.position?.y || 0,
                    },
                    speed: item.speed || item.velocity || 0,
                    heading: item.heading || 0,
                    status:
                      index === 0
                        ? 'Start'
                        : index === pathDataArray.length - 1
                          ? 'Stop'
                          : 'Moving',
                    createdAt:
                      item.createdAt ||
                      item.timestamp ||
                      new Date().toISOString(),
                  }),
                );

                setPathData(convertedData);
              }
            } catch (parseError) {
              console.error('Error parsing path data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading path data from date:', error);
    }
  };
  // Dynamic summary items based on real data
  const summaryItems = React.useMemo(
    () => [
      {
        icon: 'fluent:image-sparkle-24-filled',
        title: 'Total Images Collected',
        summary: `${summaryData.totalImages} Images`,
      },
      {
        icon: 'mdi:map-marker-path',
        title: 'Total Path Points',
        summary: `${summaryData.totalPaths} Points`,
      },
      {
        icon: 'fluent:scan-object-20-filled',
        title: 'Total Obstacles Detected',
        summary: `${summaryData.totalObstacles} Obstacles`,
      },
      {
        icon: 'ri:pin-distance-fill',
        title: 'Average Path Distance',
        summary: `${summaryData.averageDistance.toFixed(2)} cm`,
      },
    ],
    [summaryData],
  );
  // Format last activity display
  const formatLastActivity = (
    activity: string | null,
    sessionId: number | null,
  ) => {
    if (!activity) return 'No Activity Yet';

    let formattedActivity = activity;

    // If it's a date in YYYY-MM-DD format, convert it to readable format
    if (/^\d{4}-\d{2}-\d{2}$/.test(activity)) {
      const date = new Date(activity);
      formattedActivity = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Add session information if available
    if (sessionId !== null) {
      return `${formattedActivity} - Session ${sessionId}`;
    }

    return formattedActivity;
  };
  // For testing: Force local mode if we're in development and local files exist
  useEffect(() => {
    const forceLocalModeForTesting = async () => {
      if (process.env.NODE_ENV === 'development' && !isLocalMode) {
        // Check if we have local reports data
        const reportsPath =
          'g:\\Kuliah\\Semester 6\\Proyek Telematika\\RoboGo\\Dashboard Website\\RoboGo\\reports';
        try {
          console.log(
            '🧪 Development mode detected - checking for local reports...',
          );
          // If we detect local files but mode is not local, show a manual override option
          if (
            typeof window !== 'undefined' &&
            window.electronAPI?.getImagesFromFolder
          ) {
            const result = await window.electronAPI.getImagesFromFolder(
              `${reportsPath}/paths`,
            );
            if (result?.success && result.images && result.images.length > 0) {
              console.log(
                '📂 Local reports found! Consider forcing local mode for testing...',
              );
              // For now, let's manually set local mode for testing
              setIsLocalMode(true);
              console.log(
                '💡 Automatically switching to local mode for testing with found data',
              );
            }
          }
        } catch (error) {
          console.log('🔍 Could not check for local reports:', error);
        }
      }
    };

    forceLocalModeForTesting();
  }, [isLocalMode]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
      }}
      className={clsx(
        'flex flex-col items-start justify-start w-full flex-1 gap-4 border-2 rounded-xl p-5 self-stretch',
        isDark ? 'border-[#113541]' : 'border-[#ECECEC]',
      )}
      style={{ minHeight: '100%' }}
    >
      {/* Last Activity Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.4,
          type: 'spring',
          stiffness: 120,
        }}
        className='flex flex-row gap-2.5 items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-400/10 w-full h-fit rounded-xl border-2 border-blue-500/20 px-4 py-2 text-center'
      >
        {' '}
        <p className='font-semibold text-base bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text w-full'>
          Last Activity - {formatLastActivity(lastActivity, lastSessionId)}
        </p>
      </motion.div>{' '}
      {/* Tunnel Path */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          type: 'spring',
          stiffness: 100,
        }}
        className='flex-1 w-full min-h-0'
      >
        {hasData && pathData.length > 0 ? (
          <TunnelPath showStartpoint showEndpoint pathData={pathData} />
        ) : (
          <div
            className={clsx(
              'flex flex-col items-center justify-center h-full min-h-[200px] rounded-xl border-2 border-dashed',
              isDark
                ? 'border-gray-700 text-gray-400'
                : 'border-gray-300 text-gray-500',
            )}
          >
            <div
              className={clsx(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                isDark ? 'bg-gray-800' : 'bg-gray-100',
              )}
            >
              <svg
                width='32'
                height='32'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
                <polyline points='7.5,10 12,13 16.5,10'></polyline>
                <line x1='12' y1='13' x2='12' y2='21'></line>
              </svg>
            </div>
            <p className='text-center font-medium'>No Path Data Available</p>
            <p className='text-center text-sm opacity-75 mt-1'>
              {isLocalMode
                ? 'No reports found in local folders'
                : 'No path reports found for this device'}
            </p>
          </div>
        )}
      </motion.div>
      {/* Short Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.4,
          type: 'spring',
          stiffness: 120,
        }}
        className='w-full'
      >
        <ShortSummary
          summaryItems={summaryItems}
          layout='grid grid-cols-2 gap-4'
        />
      </motion.div>
    </motion.div>
  );
}
