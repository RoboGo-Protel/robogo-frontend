import React, { useEffect, useState } from "react";
import ThreeDView from "@/components/cards/ThreeDView";
import LogsCard from "@/components/cards/LogsCard";
import { AnimatePresence } from "framer-motion";
import PhotoDetailsWithPaths from "@/components/PhotoDetailsWithPaths";
import ImagesCard from "@/components/cards/ImagesCard";

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
      <div className="flex flex-col items-start justify-start w-full md:min-w-[450px] md:w-1/4 gap-4 h-full">
        <ImagesCard
          listPhotoWithDate={listPhotoWithDate}
          isLoadingImages={isLoadingImages}
          setSelectedPhoto={setSelectedPhoto}
        />

        <LogsCard />
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
