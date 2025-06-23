import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { infoItems } from '@/utils/info';
import ShortInfo from '@/components/cards/ShortInfoCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';
import DigitalClock from './DigitalClock';
import HomeSummaryCard from './HomeSummaryCard';

export default function LeftArea_Home() {
  const { isDark } = useDarkMode();
  const { config } = useUserConfig();
  const [deviceName, setDeviceName] = useState<string | null>(null);
  // Use the device status hook
  const {
    status: deviceStatus,
    refreshStatus,
    loading,
  } = useDeviceStatus(deviceName);

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
        const response = await fetch('/api/devices/user');
        if (response.ok) {
          const data = await response.json();
          const selectedDeviceData = data.data?.find(
            (device: { id: string; deviceName: string }) =>
              device.id === config.selectedDevice,
          );
          if (selectedDeviceData) {
            setDeviceName(selectedDeviceData.deviceName);
          }
        }
      } catch (error) {
        console.error('Error fetching device name:', error);
      }
    };

    fetchDeviceName();
  }, [config?.selectedDevice]);

  // Create dynamic info items with status from device
  const dynamicInfoItems = infoItems.map((item) => ({
    ...item,
    status: deviceStatus ? deviceStatus[item.component] : item.status,
  }));
  return (
    <div
      className={`flex flex-col items-start justify-start w-full min-w-[350px] max-w-[400px] gap-4 self-stretch h-full ${
        isDark ? 'bg-[#112133] text-white' : 'bg-white text-black'
      }`}
      style={{ minHeight: '100%' }}
    >
      <DigitalClock />{' '}
      <div
        className={
          `relative flex flex-col w-full gap-2 rounded-2xl p-5 transition-all duration-300 h-full justify-start items-stretch ` +
          (isDark
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200/50')
        }
        style={{ minHeight: 220 }}
      >
        {/* Gambar robot center di atas card */}
        <div className='flex w-full justify-center mb-2'>
          <Image
            src='/images/robogo_g1.png'
            alt='RoboGo G1'
            width={110}
            height={110}
            className='select-none rounded-xl bg-white/20 object-contain border border-white/20 shadow-lg'
            style={{ maxWidth: 110, maxHeight: 110 }}
          />
        </div>
        {/* Judul dan tombol refresh */}
        <div className='flex flex-row items-center gap-2 mb-2 mt-1'>
          <h1 className='text-2xl font-bold truncate'>RoboGo G1</h1>
          {deviceName && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:scale-105 active:scale-95'
              } ${
                isDark
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
              }`}
              title='Refresh device status'
            >
              <Icon
                icon={
                  loading ? 'mingcute:loading-line' : 'mingcute:refresh-2-line'
                }
                width={16}
                height={16}
                className={loading ? 'animate-spin' : ''}
              />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
        {/* Info status */}
        <div className='mt-1 mb-2'>
          <ShortInfo infoItems={dynamicInfoItems} />
        </div>
      </div>
      <HomeSummaryCard />
    </div>
  );
}
