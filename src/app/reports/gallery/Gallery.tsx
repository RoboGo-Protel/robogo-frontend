/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence } from "framer-motion";
import PhotoDetails from "@/components/PhotoDetails";
import SyncLoader from "react-spinners/SyncLoader"; // Gantilah ClipLoader dengan SyncLoader

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

export default function Gallery() {
  const [listPhotoWithDate, setListPhotoWithDate] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
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
        const response = await fetch("/api/images");
        const data = await response.json();

        setListPhotoWithDate(data.data || []);
        console.log("Images List:", data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching images list:", error);
        setIsLoading(false);
      }
    };

    fetchImagesList();
  }, []);

  const groupPhotosByDate = (photos: Image[]) => {
    const grouped: { [date: string]: Image[] } = {};

    photos.forEach((photo) => {
      const dateKey = new Date(photo.timestamp).toISOString().split("T")[0]; // e.g. '2025-04-29'
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(photo);
    });

    return grouped;
  };

  const groupedPhotos = groupPhotosByDate(listPhotoWithDate);

  return (
    <>
      <div
        className={clsx(
          "flex flex-col gap-4 p-5 transition-colors duration-300 bg-white text-black"
        )}
        style={{
          paddingTop: topNavbarHeight + reportsNavbarHeight,
          paddingBottom: bottomNavbarHeight + 20,
        }}
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-[400px]">
            <SyncLoader
              color="#367AF2"
              loading={isLoading}
              size={15}
              margin={5}
            />
            <p className="mt-4 text-lg text-gray-500">
              Loading photos, please wait...
            </p>
          </div>
        ) : (
          Object.entries(groupedPhotos).map(([dateKey, photos]) => (
            <div key={dateKey} className="mb-8">
              <div className="flex flex-row items-center gap-2.5 text-lg font-semibold mb-3 px-5 py-2.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white rounded-xl shadow">
                <Icon icon="tabler:calendar-filled" width={24} height={24} />
                <p>{formatDate(dateKey)}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {photos.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative cursor-pointer"
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
                    <img
                      src={
                        item.imageUrl ? item.imageUrl : "/images/no_image.png"
                      }
                      alt={item.filename}
                      className="object-cover rounded-xl border border-2 border-gray-200 w-[180px] h-32"
                      loading="lazy"
                    />
                    {item.obstacle && (
                      <span className="absolute top-2 right-2 bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs p-1 rounded-lg">
                        <Icon
                          icon="fluent:scan-object-24-filled"
                          width={20}
                          height={20}
                        />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetails
            details={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
