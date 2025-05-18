/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import ClockWeather from "./ClockWeather";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";

interface Logs {
  id: string;
  timestamp: string;
  sessionId: number;
  logType: string;
  message: string;
  createdAt: string;
}

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
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
}

export default function LeftArea_Home() {
  const convertTimestampToTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return date.toLocaleTimeString("en-US", options);
  };

  const [logsItems, setLogsItems] = useState<Logs[]>([]);
  const [listPhotoWithDate, setListPhotoWithDate] = useState<Image[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
    metadata: Metadata;
  }>(null);

  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const response = await fetch("/api/monitoring/logs");
        const data = await response.json();
        setLogsItems(data.data || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    const fetchImages = async () => {
      try {
        setIsLoadingImages(true);
        const response = await fetch("/api/monitoring/realtime/images");
        const data = await response.json();
        setListPhotoWithDate(data.data || []);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchLogs();
    fetchImages();
  }, []);

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full sm:min-w-[450px] sm:max-w-[450px] gap-4 h-full">
        <ClockWeather />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-start w-full px-5 py-4 border-2 border-[#ECECEC] rounded-xl"
        >
          <div className="flex flex-row items-center justify-start w-full gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
              <Icon
                icon="mage:image-fill"
                width={20}
                height={20}
                className="text-white"
              />
            </div>
            <p className="font-semibold text-base">Images</p>
          </div>

          <div className="flex flex-wrap items-center justify-start w-full gap-2.5 mt-2 min-h-[80px]">
            {isLoadingImages ? (
              // Skeleton placeholder for images
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton
                    key={i}
                    width={48}
                    height={48}
                    borderRadius={12}
                    baseColor="#E6E6E6"
                    highlightColor="#F5F5F5"
                  />
                ))
            ) : listPhotoWithDate.length > 0 ? (
              <>
                {listPhotoWithDate
                  .slice(0, 6)
                  .map((item: Image, index: number) => (
                    <div
                      key={item.id || index}
                      className="flex flex-row items-center justify-start gap-3 mt-2 cursor-pointer"
                      onClick={() =>
                        setSelectedPhoto({
                          id: item.id,
                          src: item.imageUrl
                            ? item.imageUrl
                            : "/images/no_image.png",
                          alt: item.filename,
                          obstacles: item.obstacle ?? false,
                          date: item.timestamp,
                          fileName: item.filename,
                          dateTime: item.timestamp,
                          metadata: item.metadata,
                        })
                      }
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-[#E6E6E6] rounded-xl overflow-hidden">
                        <img
                          src={
                            item.imageUrl
                              ? item.imageUrl
                              : "/images/no_image.png"
                          }
                          alt={`image-${index}`}
                          className="object-cover w-full h-full border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>
                  ))}

                {listPhotoWithDate.length > 6 && (
                  <Link
                    className="flex flex-row items-center justify-start gap-3 mt-2 cursor-pointer"
                    href="/reports/gallery"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-[#D9D9D9] rounded-xl text-sm text-gray-700 font-medium">
                      +{listPhotoWithDate.length - 6}
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No photos available</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center justify-start w-full px-5 py-4 border-2 border-[#ECECEC] rounded-xl flex-1 overflow-hidden"
        >
          <div className="flex flex-row items-center justify-start w-full gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
              <Icon
                icon="fluent:data-usage-32-filled"
                width={20}
                height={20}
                className="text-white"
              />
            </div>
            <p className="font-semibold text-base">Logs</p>
          </div>

          <div className="flex flex-col items-start justify-start w-full gap-2 mt-3 overflow-y-auto pr-2 max-h-[300px] sm:max-h-[400px]">
            {isLoadingLogs ? (
              // Skeleton placeholder for logs
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton
                    key={i}
                    height={20}
                    borderRadius={4}
                    baseColor="#E6E6E6"
                    highlightColor="#F5F5F5"
                    style={{ marginBottom: 8 }}
                  />
                ))
            ) : logsItems.length > 0 ? (
              logsItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-row items-center justify-start gap-2"
                >
                  <p className="text-sm font-semibold text-[#979797]">
                    [{convertTimestampToTime(item.timestamp)}]{" "}
                    <span className="font-normal text-black">
                      {item.message}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">No logs available</p>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            key="photo-details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <PhotoDetailsWithPaths
              details={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
