"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import StatCardList from "./cards/StatsCard";
import MonitoringInfo from "./cards/MonitoringInfoCard_PhotoDetails";
import TunnelPath from "./cards/TunnelPathCard";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";
import RemoveImagePopup from "./PopUpRemoveImage";
import ImageWithAnalysis from './ImageWithAnalysis';

type SensorKey = 'ultrasonic' | 'battery' | 'gps' | 'obstacle';

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
    posX?: number;
    posY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface PhotoDetailsProps {
  details: {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata?: Metadata;
    fromTab?: string; // Track which tab the photo came from ('original' or 'metadata')
  };
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { y: '-10vh', opacity: 0 },
  visible: { y: '0', opacity: 1 },
  exit: { y: '10vh', opacity: 0 },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const menuItems = [
  {
    name: 'Information',
    fillIcon: 'ph:read-cv-logo-fill',
    outlineIcon: 'ph:read-cv-logo',
  },
  {
    name: 'Paths',
    fillIcon: 'bxs:navigation',
    outlineIcon: 'bx:navigation',
  },
];

interface TabMenuProps {
  activeIndex: number;
  onTabChange: (index: number) => void;
}

function TabMenu({ activeIndex, onTabChange }: TabMenuProps) {
  const { isDark } = useDarkMode();
  return (
    <nav
      id='reports-navbar'
      className={`flex items-center justify-around w-full mb-2.5 ${
        isDark ? 'bg-[#112133]' : 'bg-white'
      }`}
    >
      {menuItems.map((item, index) => {
        const isActive = activeIndex === index;
        const icon = isActive ? item.fillIcon : item.outlineIcon;
        const baseClass =
          'flex flex-row gap-3 items-center justify-center text-base font-medium transition duration-200 ease-in-out rounded-xl py-3 px-4 w-full cursor-pointer';
        const activeClass =
          'bg-gradient-to-br from-blue-500 to-blue-400 cursor-default pointer-events-none w-full';
        const inactiveClass = isDark
          ? 'text-white hover:bg-white/10'
          : 'text-black hover:bg-white/20';

        return (
          <div key={index} className='w-full'>
            <div
              onClick={() => onTabChange(index)}
              className={`${baseClass} ${isActive ? activeClass : inactiveClass} ${
                isActive ? 'text-white' : isDark ? 'text-white' : 'text-black'
              }`}
            >
              <Icon icon={icon} width={24} height={24} />
              <span className='mt-1'>{item.name}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wibDate = new Date(utc + 7 * 60 * 60 * 1000);

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  const formattedDate = wibDate.toLocaleDateString('en-US', options);
  const hours = wibDate.getHours().toString().padStart(2, '0');
  const minutes = wibDate.getMinutes().toString().padStart(2, '0');
  const seconds = wibDate.getSeconds().toString().padStart(2, '0');
  return `${formattedDate} - ${hours}:${minutes}:${seconds} WIB`;
};

export default function PhotoDetailsWithPaths({
  details,
  onClose,
}: PhotoDetailsProps) {
  // Only show tabs if photo is from 'original' tab and has metadata
  const showTabs = details.fromTab === 'original';
  // Removed strict metadata check - tabs should always show for original photos
  // Debug logging for metadata
  useEffect(() => {
    console.log(
      '📸 [PHOTO DETAILS DEBUG] Component mounted with details:',
      details,
    );
    console.log('📸 [PHOTO DETAILS DEBUG] fromTab:', details.fromTab);
    console.log('📸 [PHOTO DETAILS DEBUG] showTabs:', showTabs);
    console.log('📸 [PHOTO DETAILS DEBUG] showTabs condition check:');
    console.log(
      '  - details.fromTab === "original":',
      details.fromTab === 'original',
    );
    console.log(
      '📸 [PHOTO DETAILS DEBUG] Metadata received:',
      details.metadata,
    );
    console.log(
      '📸 [PHOTO DETAILS DEBUG] Metadata keys:',
      details.metadata ? Object.keys(details.metadata) : 'No metadata',
    );
    console.log(
      '📸 [PHOTO DETAILS DEBUG] Metadata length:',
      details.metadata ? Object.keys(details.metadata).length : 0,
    ); // Debug specific values
    if (details.metadata) {
      console.log(
        '📸 [PHOTO DETAILS DEBUG] ultrasonic value:',
        details.metadata.ultrasonic,
        typeof details.metadata.ultrasonic,
      );
      console.log(
        '📸 [PHOTO DETAILS DEBUG] heading value:',
        details.metadata.heading,
        typeof details.metadata.heading,
      );
      console.log(
        '📸 [PHOTO DETAILS DEBUG] direction value:',
        details.metadata.direction,
        typeof details.metadata.direction,
      );
      console.log(
        '📸 [PHOTO DETAILS DEBUG] position data:',
        details.metadata.position,
        typeof details.metadata.position,
      );
      // Debug position X and Y specifically
      if (details.metadata.position) {
        console.log(
          '📸 [PHOTO DETAILS DEBUG] positionX:',
          details.metadata.position.positionX,
          'posX:',
          details.metadata.position.posX,
        );
        console.log(
          '📸 [PHOTO DETAILS DEBUG] positionY:',
          details.metadata.position.positionY,
          'posY:',
          details.metadata.position.posY,
        );
      }
      console.log(
        '📸 [PHOTO DETAILS DEBUG] metadata object check:',
        details.metadata && Object.keys(details.metadata).length > 0,
      );
    }
  }, [details, showTabs]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  const [isPopUpRemoveImageOpen, setIsPopUpRemoveImageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { isDark } = useDarkMode();
  const categoryAlert = (ultrasonic: number | string) => {
    if (typeof ultrasonic === 'number') {
      if (ultrasonic < 10) {
        return 'High';
      } else if (ultrasonic >= 10 && ultrasonic <= 20) {
        return 'Medium';
      } else {
        return 'Safe';
      }
    }
    return null;
  };

  const categoryStatusAlert = (ultrasonic: number | string) => {
    if (typeof ultrasonic === 'number') {
      if (ultrasonic < 10) {
        return 'danger';
      } else if (ultrasonic >= 10 && ultrasonic <= 20) {
        return 'warning';
      } else {
        return 'normal';
      }
    }
    return null;
  };
  // Check if we're in Electron mode
  const isElectronMode = typeof window !== 'undefined' && window.electronAPI;

  const handleOpenInExplorer = async () => {
    console.log(
      '🔍 [OPEN EXPLORER DEBUG] Attempting to open file:',
      details.src,
    );
    console.log('🔍 [OPEN EXPLORER DEBUG] File details:', {
      id: details.id,
      fileName: details.fileName,
      src: details.src,
      fromTab: details.fromTab,
    });

    if (isElectronMode) {
      try {
        // For local mode, show the file in the system explorer
        const result = await window.electronAPI?.showItemInFolder?.(
          details.src,
        );
        console.log('🔍 [OPEN EXPLORER DEBUG] Result from Electron:', result);

        if (!result?.success) {
          console.error('Failed to show item in folder:', result?.error);
          alert(
            `Failed to open file location in explorer: ${result?.error || 'Unknown error'}`,
          );
        } else {
          console.log(
            '✅ [OPEN EXPLORER DEBUG] Successfully opened file in explorer',
          );
        }
      } catch (err) {
        console.error('Error opening file in explorer:', err);
        alert('Failed to open file location in explorer');
      }
    } else {
      // For online mode, show a message or provide alternative action
      alert('File explorer access is only available in desktop mode');
    }
  };

  const handleDeletePhoto = async () => {
    if (isElectronMode) {
      // For local mode, we'll just trigger the remove popup
      // The actual deletion will be handled by the RemoveImagePopup component
      setIsPopUpRemoveImageOpen(true);
    } else {
      // For online mode, we could implement server-side deletion
      setIsPopUpRemoveImageOpen(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        <RemoveImagePopup
          id={details.id}
          imageUrl={details.src}
          isOpen={isPopUpRemoveImageOpen}
          onConfirm={() => {
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }}
          onCancel={() => {
            setIsPopUpRemoveImageOpen(false);
          }}
        />
      </AnimatePresence>
      <motion.div
        className={clsx(
          'fixed top-0 left-0 w-full z-[100] flex items-center justify-center p-5 h-[100dvh]',
          isDark ? 'bg-[#112133]/70' : 'bg-black/70',
        )}
        style={{ overflowY: 'auto' }}
        variants={backdropVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={clsx(
            'rounded-2xl shadow-lg w-full',
            activeTab === 0 ? 'h-full' : 'h-fit',
            'max-w-[1000px] mx-auto flex md:hidden flex-col items-center justify-center relative border max-h-[85dvh]',
            isDark
              ? 'bg-[#112133] border-[#27426C]'
              : 'bg-white border-[#CFCFCF]',
          )}
          variants={modalVariants}
          transition={{ duration: 0.4 }}
        >
          <div
            className={clsx(
              'w-full h-full overflow-y-auto p-5',
              isDark ? 'text-white' : 'text-black',
            )}
          >
            <div className='flex flex-row items-center justify-center w-full mb-2'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-md mr-3'>
                <Icon
                  icon='mage:image-fill'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div>
              <div className='w-full flex flex-col items-start justify-start'>
                <h2
                  className={clsx(
                    'text-lg font-bold',
                    isDark ? 'text-white' : 'text-black',
                  )}
                >
                  Photo Details
                </h2>
                <p
                  className={clsx(
                    'text-sm',
                    isDark ? 'text-white/70' : 'text-black/50',
                  )}
                >
                  See the details of the captured photo
                </p>
              </div>
            </div>{' '}
            <hr
              className={clsx(
                'w-full mb-2.5',
                isDark ? 'border-white/15' : 'border-black/15',
              )}
            />{' '}
            {showTabs && (
              <TabMenu activeIndex={activeTab} onTabChange={setActiveTab} />
            )}
            <AnimatePresence mode='wait'>
              {activeTab === 0 || !showTabs ? (
                <motion.div
                  key='information'
                  variants={tabContentVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  transition={{ duration: 0.4 }}
                  className='w-full flex flex-col gap-4'
                >
                  <div
                    className={clsx(
                      'w-full flex gap-4',
                      details.fromTab === 'metadata'
                        ? 'flex-col items-center justify-center'
                        : 'flex-col md:flex-row items-center md:items-start justify-center',
                    )}
                  >
                    <ImageWithAnalysis details={details} isDark={isDark} />

                    {/* Only show info panel for original tab photos */}
                    {details.fromTab === 'original' && (
                      <div
                        className={clsx(
                          'flex flex-col gap-5 items-start justify-start w-96 p-4 border rounded-xl break-words',
                          isDark
                            ? 'border-[#27426C] bg-[#1A2B48] text-white'
                            : 'border-[#DFDFDF] bg-white text-black',
                        )}
                      >
                        <div className='flex flex-col gap-1 w-full'>
                          <div
                            className={clsx(
                              'flex flex-row items-center gap-2 text-sm font-bold',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            <Icon
                              icon='material-symbols:info-rounded'
                              width={16}
                              height={16}
                            />
                            <p>ID</p>
                          </div>
                          <p
                            className={clsx(
                              'text-sm',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            {details.id}
                          </p>
                        </div>

                        {details.fileName && (
                          <div className='flex flex-col gap-1 w-full'>
                            <div
                              className={clsx(
                                'flex flex-row items-center gap-2 text-sm font-bold',
                                isDark ? 'text-white' : 'text-black',
                              )}
                            >
                              <Icon
                                icon='ic:round-drive-file-rename-outline'
                                width={16}
                                height={16}
                              />
                              <p>File Name</p>
                            </div>
                            <p
                              className={clsx(
                                'text-sm break-words',
                                isDark ? 'text-white' : 'text-black',
                              )}
                            >
                              {details.fileName}
                            </p>
                          </div>
                        )}

                        <div className='flex flex-col gap-1 w-full'>
                          <div
                            className={clsx(
                              'flex flex-row items-center gap-2 text-sm font-bold',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            <Icon
                              icon='mingcute:time-fill'
                              width={16}
                              height={16}
                            />
                            <p>Date & Time</p>
                          </div>
                          <p
                            className={clsx(
                              'text-sm',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            {formatDateTime(details.createdAt)}
                          </p>
                        </div>

                        <div className='flex flex-col gap-1 w-full'>
                          <div
                            className={clsx(
                              'flex flex-row items-center gap-2 text-sm font-bold',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            <Icon
                              icon='solar:tag-bold'
                              width={16}
                              height={16}
                            />
                            <p>Categories</p>
                          </div>
                          {details.metadata?.ultrasonic !== undefined &&
                          details.metadata.ultrasonic <= 20 ? (
                            <div className='w-fit px-4 py-2 rounded-full bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs font-normal flex items-center gap-1'>
                              <Icon
                                icon='fluent:scan-object-24-filled'
                                width={16}
                                height={16}
                              />
                              <p>Obstacle</p>
                            </div>
                          ) : (
                            <div className='w-fit px-4 py-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 text-white text-xs font-normal flex items-center gap-1'>
                              <Icon
                                icon='material-symbols:check-rounded'
                                width={16}
                                height={16}
                              />
                              <p>Normal</p>
                            </div>
                          )}
                        </div>

                        <div className='flex flex-col gap-1 w-full'>
                          <div
                            className={clsx(
                              'flex flex-row items-center gap-2 text-sm font-bold',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            <Icon
                              icon='mingcute:camera-2-ai-fill'
                              width={16}
                              height={16}
                            />
                            <p>Shot with</p>
                          </div>{' '}
                          <p
                            className={clsx(
                              'text-sm',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            ESP32-CAM
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Velocity Card - only show for original tab photos with velocity data */}
                  {details.fromTab === 'original' &&
                    details.metadata?.velocity !== undefined && (
                      <StatCardList
                        variant='velocity'
                        infoItems={[
                          {
                            title: 'Velocity',
                            value: `${details.metadata.velocity} cm/s`,
                          },
                          ...(details.metadata.velocityX !== undefined
                            ? [
                                {
                                  title: 'Velocity X',
                                  value: `${details.metadata.velocityX} cm/s`,
                                },
                              ]
                            : []),
                          ...(details.metadata.velocityY !== undefined
                            ? [
                                {
                                  title: 'Velocity Y',
                                  value: `${details.metadata.velocityY} cm/s`,
                                },
                              ]
                            : []),
                        ]}
                      />
                    )}
                  {/* Sensor Info Card - only show when ultrasonic or heading data is available */}
                  {details.fromTab === 'original' &&
                    details.metadata &&
                    (details.metadata.ultrasonic !== undefined ||
                      details.metadata.heading !== undefined) && (
                      <div className='flex flex-col md:flex-row gap-4 items-center w-full'>
                        <MonitoringInfo<SensorKey>
                          infoItems={[
                            ...(details.metadata.ultrasonic !== undefined
                              ? [
                                  {
                                    key: 'ultrasonic' as const,
                                    icon: 'mdi:proximity-sensor',
                                    status: 'normal' as const,
                                    title: 'Ultrasonic Reading',
                                    value: `${details.metadata.ultrasonic.toFixed(2)} cm`,
                                  },
                                ]
                              : []),
                            ...(details.metadata.heading !== undefined
                              ? [
                                  {
                                    key: 'gps' as const,
                                    icon: 'fa6-solid:compass',
                                    status: 'normal' as const,
                                    title: 'IMU Heading Direction',
                                    value: `${details.metadata.heading.toFixed(2)}° ${details.metadata.direction ?? ''}`,
                                  },
                                ]
                              : []),
                            ...(details.metadata.ultrasonic !== undefined
                              ? [
                                  {
                                    key: 'obstacle' as const,
                                    icon: 'mynaui:danger-triangle-solid',
                                    status: (categoryStatusAlert(
                                      details.metadata.ultrasonic,
                                    ) || 'normal') as
                                      | 'normal'
                                      | 'warning'
                                      | 'danger',
                                    title: 'Obstacle Detection Alert',
                                    value: `${categoryAlert(details.metadata.ultrasonic)}`,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    )}
                </motion.div>
              ) : (
                <motion.div
                  key='paths'
                  variants={tabContentVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  transition={{ duration: 0.4 }}
                  className='w-full flex flex-col items-center justify-center'
                >
                  {' '}
                  <div
                    className={clsx(
                      'w-full h-full rounded-xl border flex items-center justify-center relative overflow-hidden',
                      isDark
                        ? 'border-[#27426C] bg-[#1A2B48]'
                        : 'border-[#DFDFDF] bg-white',
                    )}
                  >
                    <TunnelPath
                      showStartpoint
                      showEndpoint
                      pathData={
                        details.metadata?.position
                          ? [
                              {
                                id: details.id,
                                timestamp: details.createdAt,
                                sessionId: 1,
                                position: {
                                  x:
                                    details.metadata.position.positionX ??
                                    details.metadata.position.posX ??
                                    0,
                                  y:
                                    details.metadata.position.positionY ??
                                    details.metadata.position.posY ??
                                    0,
                                },
                                speed: details.metadata.velocity ?? 0,
                                heading: details.metadata.heading ?? 0,
                                status: 'active',
                                createdAt: details.createdAt,
                                imageUrl: details.src,
                                isEndpoint: true,
                              },
                            ]
                          : []
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className='flex flex-col md:flex-row gap-4 items-center justify-center w-full h-fit mt-7'>
              <button
                onClick={handleOpenInExplorer}
                className={clsx(
                  'flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl w-full',
                  'border-blue-400/20 hover:bg-blue-200/20 hover:border-blue-500 transition',
                  isElectronMode ? '' : 'opacity-50 cursor-not-allowed',
                )}
                disabled={!isElectronMode}
              >
                <p className='bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text font-semibold text-sm'>
                  Open in Explorer
                </p>
                <Icon
                  icon='material-symbols:folder-open-outline'
                  width={20}
                  height={20}
                  className='text-[#39A9F9]'
                />
              </button>
              <button
                onClick={handleDeletePhoto}
                className={clsx(
                  'flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl w-full',
                  'border-red-500/30 text-red-500 hover:bg-red-200/20 hover:border-red-500 transition',
                )}
              >
                <p className='font-semibold text-sm'>Delete Photo</p>
                <Icon
                  icon='material-symbols:delete-outline'
                  width={20}
                  height={20}
                  className='text-red-500'
                />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className={clsx(
              'absolute top-3 right-3 p-1 rounded-full transition-all duration-300 cursor-pointer',
              isDark
                ? 'bg-[#27426C] text-white hover:bg-red-500 hover:text-white'
                : 'bg-[#e5e7ec] text-[#98A2B3] hover:bg-red-500 hover:text-white',
            )}
          >
            <Icon icon='tabler:x' width={20} height={20} />
          </button>
        </motion.div>

        <motion.div
          className={clsx(
            'rounded-2xl shadow-lg p-5 w-fit mx-auto hidden md:flex flex-col gap-4 items-center justify-center relative border-[1px]',
            isDark
              ? 'bg-[#112133] border-[#27426C]'
              : 'bg-white border-[#CFCFCF]',
          )}
          variants={modalVariants}
          transition={{ duration: 0.4 }}
        >
          <div className='flex flex-row items-center justify-center w-full'>
            <div className='p-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-md mr-3'>
              <Icon
                icon='mage:image-fill'
                width={28}
                height={28}
                className='text-white'
              />
            </div>
            <div className='w-full flex flex-col items-start justify-start'>
              <h2
                className={clsx(
                  'text-lg font-bold',
                  isDark ? 'text-white' : 'text-black',
                )}
              >
                Photo Details
              </h2>
              <p
                className={clsx(
                  'text-sm',
                  isDark ? 'text-white/70' : 'text-black/50',
                )}
              >
                See the details of the captured photo
              </p>
            </div>
          </div>
          <hr
            className={clsx(
              'w-full',
              isDark ? 'border-white/15' : 'border-black/15',
            )}
          />{' '}
          {showTabs && (
            <TabMenu activeIndex={activeTab} onTabChange={setActiveTab} />
          )}
          <AnimatePresence mode='wait'>
            {activeTab === 0 || !showTabs ? (
              <motion.div
                key='information'
                variants={tabContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                transition={{ duration: 0.4 }}
                className='w-full flex flex-col gap-4'
              >
                {' '}
                <div
                  className={clsx(
                    'w-full flex gap-3',
                    details.fromTab === 'metadata'
                      ? 'flex-col items-center justify-center'
                      : 'items-stretch justify-start',
                  )}
                >
                  <ImageWithAnalysis details={details} isDark={isDark} />

                  {/* Only show info panel for original tab photos */}
                  {details.fromTab === 'original' && (
                    <div
                      className={clsx(
                        'flex flex-col gap-5 items-start justify-start w-96 p-4 border rounded-xl break-words',
                        isDark
                          ? 'border-[#27426C] bg-[#1A2B48] text-white'
                          : 'border-[#DFDFDF] bg-white text-black',
                      )}
                    >
                      <div className='flex flex-col gap-1 w-full'>
                        <div
                          className={clsx(
                            'flex flex-row items-center gap-2 text-sm font-bold',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          <Icon
                            icon='material-symbols:info-rounded'
                            width={16}
                            height={16}
                          />
                          <p>ID</p>
                        </div>
                        <p
                          className={clsx(
                            'text-sm',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          {details.id}
                        </p>
                      </div>
                      {details.fileName && (
                        <div className='flex flex-col gap-1 w-full'>
                          <div
                            className={clsx(
                              'flex flex-row items-center gap-2 text-sm font-bold',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            <Icon
                              icon='ic:round-drive-file-rename-outline'
                              width={16}
                              height={16}
                            />
                            <p>File Name</p>
                          </div>
                          <p
                            className={clsx(
                              'text-sm',
                              isDark ? 'text-white' : 'text-black',
                            )}
                          >
                            {details.fileName}
                          </p>
                        </div>
                      )}
                      <div className='flex flex-col gap-1 w-full'>
                        <div
                          className={clsx(
                            'flex flex-row items-center gap-2 text-sm font-bold',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          <Icon
                            icon='mingcute:time-fill'
                            width={16}
                            height={16}
                          />
                          <p>Date & Time</p>
                        </div>
                        <p
                          className={clsx(
                            'text-sm',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          {formatDateTime(details.createdAt)}
                        </p>
                      </div>
                      <div className='flex flex-col gap-1 w-full'>
                        <div
                          className={clsx(
                            'flex flex-row items-center gap-2 text-sm font-bold',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          <Icon icon='solar:tag-bold' width={16} height={16} />
                          <p>Categories</p>
                        </div>
                        {details.metadata?.ultrasonic !== undefined &&
                        details.metadata.ultrasonic <= 20 ? (
                          <div className='w-fit px-4 py-2 rounded-full bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs font-normal flex items-center gap-1'>
                            <Icon
                              icon='fluent:scan-object-24-filled'
                              width={16}
                              height={16}
                            />
                            <p>Obstacle</p>
                          </div>
                        ) : (
                          <div className='w-fit px-4 py-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 text-white text-xs font-normal flex items-center gap-1'>
                            <Icon
                              icon='material-symbols:check-rounded'
                              width={16}
                              height={16}
                            />
                            <p>Normal</p>
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col gap-1 w-full'>
                        <div
                          className={clsx(
                            'flex flex-row items-center gap-2 text-sm font-bold',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          <Icon
                            icon='mingcute:camera-2-ai-fill'
                            width={16}
                            height={16}
                          />
                          <p>Shot with</p>
                        </div>
                        <p
                          className={clsx(
                            'text-sm',
                            isDark ? 'text-white' : 'text-black',
                          )}
                        >
                          ESP32-CAM
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Velocity Card - only show for original tab photos with velocity data */}
                {details.fromTab === 'original' &&
                  details.metadata?.velocity !== undefined && (
                    <StatCardList
                      variant='velocity'
                      infoItems={[
                        {
                          title: 'Velocity',
                          value: `${details.metadata.velocity} cm/s`,
                        },
                        ...(details.metadata.velocityX !== undefined
                          ? [
                              {
                                title: 'Velocity X',
                                value: `${details.metadata.velocityX} cm/s`,
                              },
                            ]
                          : []),
                        ...(details.metadata.velocityY !== undefined
                          ? [
                              {
                                title: 'Velocity Y',
                                value: `${details.metadata.velocityY} cm/s`,
                              },
                            ]
                          : []),
                      ]}
                    />
                  )}
                {/* Sensor Info Card - only show when ultrasonic or heading data is available */}
                {details.fromTab === 'original' &&
                  details.metadata &&
                  (details.metadata.ultrasonic !== undefined ||
                    details.metadata.heading !== undefined) && (
                    <div className='flex flex-col md:flex-row gap-4 items-center w-full'>
                      <MonitoringInfo<SensorKey>
                        infoItems={[
                          ...(details.metadata.ultrasonic !== undefined
                            ? [
                                {
                                  key: 'ultrasonic' as const,
                                  icon: 'mdi:proximity-sensor',
                                  status: 'normal' as const,
                                  title: 'Ultrasonic Reading',
                                  value: `${details.metadata.ultrasonic.toFixed(2)} cm`,
                                },
                              ]
                            : []),
                          ...(details.metadata.heading !== undefined
                            ? [
                                {
                                  key: 'gps' as const,
                                  icon: 'fa6-solid:compass',
                                  status: 'normal' as const,
                                  title: 'IMU Heading Direction',
                                  value: `${details.metadata.heading.toFixed(2)}° ${details.metadata.direction ?? ''}`,
                                },
                              ]
                            : []),
                          ...(details.metadata.ultrasonic !== undefined
                            ? [
                                {
                                  key: 'obstacle' as const,
                                  icon: 'mynaui:danger-triangle-solid',
                                  status: (categoryStatusAlert(
                                    details.metadata.ultrasonic,
                                  ) || 'normal') as
                                    | 'normal'
                                    | 'warning'
                                    | 'danger',
                                  title: 'Obstacle Detection Alert',
                                  value: `${categoryAlert(details.metadata.ultrasonic)}`,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  )}
              </motion.div>
            ) : (
              <motion.div
                key='paths'
                variants={tabContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                transition={{ duration: 0.4 }}
                className='w-full flex flex-col items-start justify-start'
              >
                {' '}
                <div
                  className={clsx(
                    'w-full h-full rounded-xl border flex items-start justify-start relative overflow-hidden',
                    isDark
                      ? 'border-[#27426C] bg-[#1A2B48]'
                      : 'border-[#DFDFDF] bg-white',
                  )}
                >
                  <TunnelPath
                    showStartpoint
                    showEndpoint
                    pathData={
                      details.metadata?.position
                        ? [
                            {
                              id: details.id,
                              timestamp: details.createdAt,
                              sessionId: 1,
                              position: {
                                x:
                                  details.metadata.position.positionX ??
                                  details.metadata.position.posX ??
                                  0,
                                y:
                                  details.metadata.position.positionY ??
                                  details.metadata.position.posY ??
                                  0,
                              },
                              speed: details.metadata.velocity ?? 0,
                              heading: details.metadata.heading ?? 0,
                              status: 'active',
                              createdAt: details.createdAt,
                              imageUrl: details.src,
                              isEndpoint: true,
                            },
                          ]
                        : []
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className='flex flex-row gap-4 items-center justify-center w-full h-fit mt-7'>
            <button
              onClick={handleOpenInExplorer}
              className={clsx(
                'flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl w-full',
                'border-blue-400/20 hover:bg-blue-200/20 hover:border-blue-500 transition',
                isElectronMode ? '' : 'opacity-50 cursor-not-allowed',
              )}
              disabled={!isElectronMode}
            >
              <p className='bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text font-semibold text-sm'>
                Open in Explorer
              </p>
              <Icon
                icon='material-symbols:folder-open-outline'
                width={20}
                height={20}
                className='text-[#39A9F9]'
              />
            </button>

            <button
              onClick={handleDeletePhoto}
              className={clsx(
                'flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl w-full',
                'border-red-500/30 text-red-500 hover:bg-red-200/20 hover:border-red-500 transition',
              )}
            >
              <p className='font-semibold text-sm'>Delete Photo</p>
              <Icon
                icon='material-symbols:delete-outline'
                width={20}
                height={20}
                className='text-red-500'
              />
            </button>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'absolute top-3 right-3 p-1 rounded-full transition-all duration-300 cursor-pointer',
              isDark
                ? 'bg-[#27426C] text-white hover:bg-red-500 hover:text-white'
                : 'bg-[#e5e7ec] text-[#98A2B3] hover:bg-red-500 hover:text-white',
            )}
          >
            <Icon icon='tabler:x' width={20} height={20} />
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
