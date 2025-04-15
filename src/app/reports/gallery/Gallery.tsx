"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AnimatePresence } from "framer-motion";
import PhotoDetails from "@/components/PhotoDetails";

const listPhotoWithDate = [
  {
    date: "2025-03-24",
    photos: [
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 1",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 2",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 3",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
    ],
  },
  {
    date: "2025-03-25",
    photos: [
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 4",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 5",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 6",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
    ],
  },
  {
    date: "2025-03-26",
    photos: [
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 7",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 8",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 9",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
    ],
  },
  {
    date: "2025-03-27",
    photos: [
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 10",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 11",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 12",
        obstacles: true,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
    ],
  },
  {
    date: "2025-03-28",
    photos: [
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 13",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 14",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
      {
        src: "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
        alt: "Image 15",
        obstacles: false,
        fileName: "RoboGo-G1_20250324_143244.jpg",
        dateTime: "2025-03-24T14:32:44",
      },
    ],
  },
];

export default function Gallery() {
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
    src: string;
    alt: string;
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
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
        {listPhotoWithDate.map((item, index) => (
          <div key={index} className="mb-8">
            <div className="flex flex-row items-center gap-2.5 text-lg font-semibold mb-3 px-5 py-2.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white rounded-xl shadow">
              <Icon icon="tabler:calendar-filled" width={24} height={24} />
              <p>{formatDate(item.date)}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {item.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer"
                  onClick={() =>
                    setSelectedPhoto({ ...photo, date: item.date })
                  }
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="object-cover rounded-xl shadow w-[180px] h-32"
                    loading="lazy"
                  />
                  {photo.obstacles && (
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
        ))}
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
