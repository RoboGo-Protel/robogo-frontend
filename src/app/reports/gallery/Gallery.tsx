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

export default function Gallery() {
  const [listPhotoWithDate, setListPhotoWithDate] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
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
    const reports = document.querySelector("#reports-navbar");
    const top = document.querySelector("#top-navbar");
    const bottom = document.querySelector("#bottom-navbar");

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    if (reports) setReportsNavbarHeight(reports.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      if (reports) setReportsNavbarHeight(reports.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [topNavbarHeight, bottomNavbarHeight, reportsNavbarHeight]);

  useEffect(() => {
    const fetchImagesList = async () => {
      try {
        const deviceName = selectedDevice?.deviceName;
        if (!deviceName) {
          console.log('Waiting for device to be selected...');
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `/api/monitoring/realtime/images?deviceName=${encodeURIComponent(deviceName)}`,
        );
        const data = await response.json();

        setListPhotoWithDate(data.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching images list:', error);
        setIsLoading(false);
      }
    };

    fetchImagesList();
  }, [selectedDevice?.deviceName]);

  const groupPhotosByDate = (photos: Image[]) => {
    const grouped: { [date: string]: Image[] } = {};

    photos.forEach((photo) => {
      const dateKey = new Date(photo.createdAt).toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });

    return grouped;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--top-navbar-height", `${topNavbarHeight}px`);
    root.style.setProperty(
      "--reports-navbar-height",
      `${reportsNavbarHeight}px`
    );
  }, [topNavbarHeight, reportsNavbarHeight]);

  const groupedPhotos = groupPhotosByDate(listPhotoWithDate);

  // Don't render content until we have a selected device
  if (!selectedDevice?.deviceName) {
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
        <PulseLoader
          color='#60a5fa'
          loading={true}
          size={15}
          margin={5}
        />
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
              Loading photos, please wait...
            </p>
          </div>
        ) : listPhotoWithDate.length === 0 ? (
          <div
            className='flex flex-col justify-center items-center w-full p-4 border-2 border-gray-300 rounded-xl'
            style={{
              height: `calc(100vh - ${
                topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
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
              No photos available. Please check back later.
            </p>
          </div>
        ) : (
          Object.entries(groupedPhotos).map(([dateKey, photos]) => (
            <div key={dateKey} className='mb-4'>
              <div
                className={clsx(
                  'w-full sticky top-[calc(var(--top-navbar-height)+var(--reports-navbar-height))] z-10 rounded-b-2xl',
                  isDark ? 'bg-[#112133] text-white' : 'bg-white text-black',
                )}
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
                    onClick={() =>
                      setSelectedPhoto({
                        id: item.id,
                        src: item.imageUrl || '/images/no_image.png',
                        alt: item.filename,
                        obstacle: item.obstacle ?? false,
                        date: item.timestamp,
                        fileName: item.filename,
                        createdAt: item.createdAt,
                        metadata: item.metadata,
                      })
                    }
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
                      {item.metadata &&
                        Object.keys(item.metadata).length > 0 && (
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
                        )}

                      {item.obstacle && (
                        <>
                          <span
                            className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs p-1 rounded-lg shadow-md'
                            data-tooltip-id={`obstacle-${idx}`}
                            data-tooltip-content='This image contains an obstacle!'
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
