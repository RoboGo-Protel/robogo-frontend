'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import clsx from 'clsx';

interface SummaryData {
  totalImages: number;
  totalUltrasonicData: number; // JSON sessions in ultrasonic/{date}/ folders
  totalIMUData: number; // JSON sessions in imu/{date}/ folders
  totalPathReports: number; // JSON sessions in paths/{date}/ folders
}

const HomeSummaryCard: React.FC = () => {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalImages: 0,
    totalUltrasonicData: 0,
    totalIMUData: 0,
    totalPathReports: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Check for local mode on component mount
  useEffect(() => {
    const checkLocalMode = async () => {
      try {
        // Check if running in Electron with local mode enabled
        if (typeof window !== 'undefined' && window.electronAPI?.getConfig) {
          const localModeConfig =
            await window.electronAPI.getConfig('localMode');
          setIsLocalMode(!!localModeConfig);
        } else {
          // Fallback: check from API if not in Electron
          const response = await fetch('/api/user/config');
          if (response.ok) {
            const data = await response.json();
            setIsLocalMode(data.data?.localMode || false);
          }
        }
      } catch (error) {
        console.error('Error checking local mode:', error);
        setIsLocalMode(false);
      }
    };

    checkLocalMode();
  }, []); // Function to fetch summary data from local folders (Electron only)
  const fetchLocalSummaryData = useCallback(async (): Promise<SummaryData> => {
    const defaultData: SummaryData = {
      totalImages: 0,
      totalUltrasonicData: 0,
      totalIMUData: 0,
      totalPathReports: 0,
    };

    try {
      if (
        !window.electronAPI?.getImagesFromFolder ||
        !window.electronAPI?.getConfig
      ) {
        return defaultData;
      }

      // Ambil path reportsFolder dari config
      let reportsFolder = await window.electronAPI.getConfig('reportsFolder');
      if (!reportsFolder || typeof reportsFolder !== 'string') {
        // fallback ke default
        const userHome = '';
        reportsFolder = userHome
          ? `${userHome}/Documents/RoboGo/reports`
          : 'reports';
      }

      // Helper join path (karena path.join tidak tersedia di browser)
      function pathJoin(...parts: string[]): string {
        return parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
      }

      // Count images from gallery/originals folder
      const galleryOriginalsPath = pathJoin(
        String(reportsFolder),
        'gallery',
        'originals',
      );
      const imagesResult =
        await window.electronAPI.getImagesFromFolder(galleryOriginalsPath);
      if (imagesResult.success && imagesResult.images) {
        defaultData.totalImages = imagesResult.images.length;
      } // Helper function to count JSON files recursively in date subfolders
      const countJSONFilesInDateFolders = async (
        basePath: string,
      ): Promise<number> => {
        try {
          if (!window.electronAPI?.getImagesFromFolder) {
            return 0;
          }

          // Get all date folders (e.g., 2025-06-23)
          const dateResult =
            await window.electronAPI.getImagesFromFolder(basePath);
          if (!dateResult.success || !dateResult.images) {
            return 0;
          }

          let totalCount = 0;

          // For each date folder, count JSON files
          for (const dateItem of dateResult.images) {
            // dateItem is an object with fileName, filePath, etc.
            const folderName = dateItem.fileName;

            // Check if this looks like a date folder (YYYY-MM-DD format)
            if (folderName && /^\d{4}-\d{2}-\d{2}$/.test(folderName)) {
              // This is a date folder, check inside for JSON files
              const dateFolderPath = pathJoin(basePath, folderName);
              const jsonResult =
                await window.electronAPI.getImagesFromFolder(dateFolderPath);

              if (jsonResult.success && jsonResult.images) {
                // Count only .json files
                const jsonFiles = jsonResult.images.filter(
                  (fileItem) =>
                    fileItem.fileName &&
                    fileItem.fileName.toLowerCase().endsWith('.json'),
                );
                totalCount += jsonFiles.length;
              }
            }
          }

          return totalCount;
        } catch (error) {
          console.error(`Error counting files in ${basePath}:`, error);
          return 0;
        }
      };

      // Count files in each report type folder
      const ultrasonicPath = pathJoin(String(reportsFolder), 'ultrasonic');
      const imuPath = pathJoin(String(reportsFolder), 'imu');
      const pathsPath = pathJoin(String(reportsFolder), 'paths');

      const [ultrasonicCount, imuCount, pathsCount] = await Promise.all([
        countJSONFilesInDateFolders(ultrasonicPath),
        countJSONFilesInDateFolders(imuPath),
        countJSONFilesInDateFolders(pathsPath),
      ]);

      defaultData.totalUltrasonicData = ultrasonicCount;
      defaultData.totalIMUData = imuCount;
      defaultData.totalPathReports = pathsCount;
      console.log('📊 [SUMMARY] Local data counts:', {
        images: defaultData.totalImages,
        ultrasonic: defaultData.totalUltrasonicData,
        imu: defaultData.totalIMUData,
        paths: defaultData.totalPathReports,
        reportsFolder: String(reportsFolder),
      });

      // Debug information about folder structure
      console.log('📁 [SUMMARY] Folder structure used:');
      console.log(`  - Images: ${galleryOriginalsPath}`);
      console.log(
        `  - Ultrasonic: ${pathJoin(String(reportsFolder), 'ultrasonic')}`,
      );
      console.log(`  - IMU: ${pathJoin(String(reportsFolder), 'imu')}`);
      console.log(`  - Paths: ${pathJoin(String(reportsFolder), 'paths')}`);
    } catch (error) {
      console.error('Error fetching local summary data:', error);
    }

    return defaultData;
  }, []);
  useEffect(() => {
    const fetchSummaryData = async () => {
      // In local mode, don't require device selection
      if (isLocalMode) {
        setIsLoading(true);
        try {
          const localData = await fetchLocalSummaryData();
          setSummaryData(localData);
        } catch (error) {
          console.error('Error fetching local summary data:', error);
          // Reset to default values on error
          setSummaryData({
            totalImages: 0,
            totalUltrasonicData: 0,
            totalIMUData: 0,
            totalPathReports: 0,
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // In online mode, require device selection
      if (!selectedDevice?.deviceName) {
        // Reset to default values if no device selected
        setSummaryData({
          totalImages: 0,
          totalUltrasonicData: 0,
          totalIMUData: 0,
          totalPathReports: 0,
        });
        return;
      }

      setIsLoading(true);
      try {
        const deviceName = encodeURIComponent(selectedDevice.deviceName); // Fetch all data in parallel
        const [imagesRes, ultrasonicRes, imuRes, pathsRes] = await Promise.all([
          fetch(
            `/api/monitoring/realtime/images?deviceName=${deviceName}`,
          ).catch(() => null),
          fetch(`/api/reports/ultrasonic?deviceName=${deviceName}`).catch(
            () => null,
          ),
          fetch(`/api/reports/imu?deviceName=${deviceName}`).catch(() => null),
          fetch(`/api/reports/paths?deviceName=${deviceName}`).catch(
            () => null,
          ),
        ]);

        let totalImages = 0;
        let totalUltrasonicData = 0;
        let totalIMUData = 0;
        let totalPathReports = 0;

        // Process images data
        if (imagesRes?.ok) {
          const imagesData = await imagesRes.json();
          totalImages = imagesData.data?.length || 0;
        } // Process ultrasonic data
        if (ultrasonicRes?.ok) {
          const ultrasonicData = await ultrasonicRes.json();
          totalUltrasonicData = ultrasonicData.data?.length || 0;
        }

        // Process IMU data
        if (imuRes?.ok) {
          const imuData = await imuRes.json();
          totalIMUData = imuData.data?.length || 0;
        }

        // Process path data
        if (pathsRes?.ok) {
          const pathData = await pathsRes.json();
          totalPathReports = pathData.data?.length || 0;
        }

        setSummaryData({
          totalImages,
          totalUltrasonicData,
          totalIMUData,
          totalPathReports,
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, [selectedDevice?.deviceName, isLocalMode, fetchLocalSummaryData]);
  const summaryItems = [
    {
      icon: 'solar:camera-bold',
      title: 'Photos',
      value: summaryData.totalImages,
      color: 'blue',
    },
    {
      icon: 'solar:radar-2-bold',
      title: 'Ultrasonic Sessions',
      value: summaryData.totalUltrasonicData,
      color: 'blue',
    },
    {
      icon: 'solar:compass-bold',
      title: 'IMU Sessions',
      value: summaryData.totalIMUData,
      color: 'blue',
    },
    {
      icon: 'solar:routing-2-bold',
      title: 'Path Sessions',
      value: summaryData.totalPathReports,
      color: 'blue',
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
      }}
      className='w-full'
    >
      <div
        className={clsx(
          'relative overflow-hidden shadow-md rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg',
          isDark
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200/50',
        )}
      >
        {/* Mode Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='relative z-10 flex items-center justify-between mb-4'
        >
          <div className='flex items-center gap-2'>
            <Icon
              icon={isLocalMode ? 'solar:monitor-bold' : 'solar:cloud-bold'}
              className={clsx(
                'w-4 h-4',
                isLocalMode
                  ? isDark
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : isDark
                    ? 'text-blue-400'
                    : 'text-blue-600',
              )}
            />
            <span
              className={clsx(
                'text-sm font-medium',
                isDark ? 'text-blue-300' : 'text-blue-700',
              )}
            >
              {isLocalMode ? 'Local Mode' : 'Online Mode'}
            </span>
          </div>
          {isLocalMode && (
            <span
              className={clsx(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-600',
              )}
            >
              Local folders
            </span>
          )}
          {!isLocalMode && !selectedDevice?.deviceName && (
            <span
              className={clsx(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-600',
              )}
            >
              No device
            </span>
          )}
        </motion.div>

        {/* Summary Cards Grid - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4'
        >
          {summaryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={clsx(
                'relative flex flex-row items-start justify-between p-4 rounded-xl border transition-all duration-300 min-h-[72px]',
                isDark
                  ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/50 hover:from-slate-600/60 hover:to-slate-700/60'
                  : 'bg-gradient-to-br from-white/80 to-blue-50/80 border-blue-200/50 hover:from-white hover:to-blue-50 hover:shadow-md',
              )}
            >
              {/* Label & Value kiri atas */}
              <div className='flex flex-col items-start justify-start'>
                <span
                  className={clsx(
                    'text-xs font-medium mb-1',
                    isDark ? 'text-blue-300' : 'text-blue-700',
                  )}
                >
                  {item.title}
                </span>
                <span
                  className={clsx(
                    'text-xl font-bold tabular-nums tracking-tight',
                    isDark ? 'text-white' : 'text-gray-900',
                  )}
                >
                  {isLoading ? (
                    <span className='animate-pulse'>...</span>
                  ) : (
                    item.value.toLocaleString()
                  )}
                </span>
              </div>
              {/* Icon kanan atas */}
              <div className='absolute top-3 right-3'>
                <Icon
                  icon={item.icon}
                  width={28}
                  height={28}
                  className={clsx(isDark ? 'text-blue-400' : 'text-blue-600')}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomeSummaryCard;
