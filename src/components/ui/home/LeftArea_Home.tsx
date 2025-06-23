import React, { useState, useEffect } from "react";
import ClockWeather from "./ClockWeather";
import { AnimatePresence, motion } from "framer-motion";
import "react-loading-skeleton/dist/skeleton.css";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import { useDarkMode } from "@/context/DarkModeContext";
import ImagesCard from "@/components/cards/ImagesCard";
import LogsCard from "@/components/cards/LogsCard";

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
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

export default function LeftArea_Home() {
  const { isDark } = useDarkMode();
  const [listPhotoWithDate, setListPhotoWithDate] = useState([]);
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

  const [isLoadingImages, setIsLoadingImages] = useState(true);

  useEffect(() => {
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

    fetchImages();
  }, []);

  return (
    <>
      <div
        className={`flex flex-col items-start justify-start w-full md:min-w-[450px] md:max-w-[450px] gap-4 h-full ${
          isDark ? "bg-[#112133] text-white" : "bg-white text-black"
        }`}
      >
        <ClockWeather />

        <ImagesCard
          listPhotoWithDate={listPhotoWithDate}
          isLoadingImages={isLoadingImages}
          setSelectedPhoto={setSelectedPhoto}
        />

        {/* Logs Section */}
        <LogsCard />
      </div>

      {/* Selected Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            key="photo-details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black/40"
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
