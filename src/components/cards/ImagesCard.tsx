/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import clsx from "clsx";
import Image from "next/image";

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

export default function ImagesCard({
  listPhotoWithDate,
  isLoadingImages,
  setSelectedPhoto,
}: {
  listPhotoWithDate: Image[];
  isLoadingImages: boolean;
  setSelectedPhoto: (photo: {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata: Metadata;
  }) => void;
}) {
  const { isDark } = useDarkMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 rounded-xl ${
        isDark ? 'border-[#113541] bg-[#0F1B2B]' : 'border-[#ECECEC]'
      }`}
    >
      <div className='flex flex-row items-center justify-start w-full gap-2'>
        <div className='p-1.5 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow-md'>
          <Icon
            icon='mage:image-fill'
            width={20}
            height={20}
            className='text-white'
          />
        </div>
        <p className='font-semibold text-base'>Images</p>
      </div>

      <div className='flex flex-wrap items-center justify-start w-full gap-2.5 mt-2 min-h-[80px]'>
        {isLoadingImages ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                width={48}
                height={48}
                borderRadius={12}
                baseColor='#E6E6E6'
                highlightColor='#F5F5F5'
              />
            ))
        ) : listPhotoWithDate.length > 0 ? (
          <>
            {listPhotoWithDate.slice(0, 6).map((item: Image, index: number) => (
              <div
                key={item.id || index}
                className='flex flex-row items-center justify-start gap-3 mt-2 cursor-pointer'
                onClick={() =>
                  setSelectedPhoto({
                    id: item.id,
                    src: item.imageUrl ? item.imageUrl : '/images/no_image.png',
                    alt: item.filename,
                    obstacle: item.obstacle ?? false,
                    date: item.timestamp,
                    fileName: item.filename,
                    createdAt: item.createdAt,
                    metadata: item.metadata,
                  })
                }
              >
                <div className='flex items-center justify-center w-12 h-12 bg-[#E6E6E6] rounded-xl overflow-hidden'>
                  <img
                    src={item.imageUrl || '/images/no_image.png'}
                    alt={`image-${index}`}
                    width={48}
                    height={48}
                    className={clsx(
                      'object-cover w-full h-full rounded-xl',
                      isDark ? 'border-[#1D7C9F]' : 'border-[#D9D9D9]',
                    )}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            ))}

            {listPhotoWithDate.length > 6 && (
              <Link
                className={`flex flex-row items-center justify-start gap-3 mt-2 cursor-pointer ${
                  isDark ? 'text-white' : 'text-gray-700'
                }`}
                href='/reports/gallery'
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl text-sm font-medium ${
                    isDark
                      ? 'text-gray-200 bg-[#1D7C9F]'
                      : 'text-gray-700 bg-[#D9D9D9]'
                  }`}
                >
                  +{listPhotoWithDate.length - 6}
                </div>
              </Link>
            )}
          </>
        ) : (
          <p className='text-sm text-gray-400 mt-2'>No photos available</p>
        )}
      </div>
    </motion.div>
  );
}
