/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "@/context/ThemeContext";
import ThreeDView from "@/components/cards/3DViewCard";
import LogsCard from "@/components/cards/LogsCard";
import { AnimatePresence } from "framer-motion";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import Link from "next/link";

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

export default function LeftArea_Monitoring() {
  const [logsItems, setLogsItems] = useState<Logs[]>([]);
  const [listPhotoWithDate, setListPhotoWithDate] = useState([]);
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
  const { theme } = useTheme();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/monitoring/logs");
        const data = await response.json();
        setLogsItems(data.data || []);
        console.log("Logs data:", data.data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/reports/images");
        const data = await response.json();
        setListPhotoWithDate(data.data || []);
        console.log("Images data:", data.data);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchLogs();
    fetchImages();
  }, []);

  return (
    <>
      <div className="flex flex-col items-start justify-start min-w-[450px] max-w-none gap-4 h-full">
        <div
          className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 ${
            theme === "dark" ? "" : "border-[#ECECEC]"
          } rounded-xl`}
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
          <div className="flex flex-wrap items-center justify-start w-full gap-2.5 mt-2">
            {listPhotoWithDate.length > 0 ? (
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
        </div>

        <LogsCard logsItems={logsItems} />
        <ThreeDView />
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
