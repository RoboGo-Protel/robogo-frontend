import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { infoItems } from '@/utils/info';
import ShortInfo from '@/components/cards/ShortInfoCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';
import { useLocalMode } from '@/context/LocalModeContext';
import DigitalClock from './DigitalClock';
import HomeSummaryCard from './HomeSummaryCard';
import clsx from 'clsx';

export default function LeftArea_Home() {
  const { isDark } = useDarkMode();
  const { config } = useUserConfig();
  const { connectedPort, isConnected } = useLocalMode();
  const [deviceName, setDeviceName] = useState<string | null>(null);
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
        // If config.selectedDevice is an ID, we'll use it as the device name
        // This assumes the selectedDevice is already the device name or we have it stored
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
      }}
      className={clsx(
        'flex flex-col items-start justify-start w-full min-w-[350px] max-w-[400px] gap-4 self-stretch h-full',
        isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
      )}
      style={{ minHeight: '100%' }}
    >
      {' '}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className='w-full'
      >
        <DigitalClock />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.2,
          duration: 0.4,
          ease: 'easeOut',
          type: 'spring',
          stiffness: 100,
        }}
        className={clsx(
          'relative flex flex-col w-full gap-2 rounded-2xl p-5 transition-all duration-300 h-full justify-start items-stretch',
          isDark
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200/50',
        )}
        style={{ minHeight: 220 }}
      >
        {' '}
        {/* Gambar robot center di atas card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.4,
            type: 'spring',
            stiffness: 120,
          }}
          className='flex w-full justify-center mb-2'
        >
          <Image
            src='/images/robogo_g1.png'
            alt='RoboGo G1'
            width={110}
            height={110}
            className='select-none rounded-xl bg-white/20 object-contain'
            style={{ maxWidth: 110, maxHeight: 110 }}
          />
        </motion.div>
        {/* Judul dan tombol refresh */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className='flex flex-row items-center gap-2 mb-2 mt-1'
        >
          <h1 className='text-2xl font-bold truncate text-center w-full'>
            RoboGo G1
          </h1>
          {deviceName && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={loading}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
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
                  width={16}
                  height={16}
                />
              </motion.div>
              {loading ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          )}
        </motion.div>
        {/* Info status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className='mt-1 mb-2'
        >
          <ShortInfo infoItems={dynamicInfoItems} />
        </motion.div>
      </motion.div>{' '}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.7,
          duration: 0.5,
          type: 'spring',
          stiffness: 100,
        }}
        className='w-full'
      >
        <HomeSummaryCard />
      </motion.div>
    </motion.div>
  );
}
