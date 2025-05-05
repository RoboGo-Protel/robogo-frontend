/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";
import StatCardList from "./cards/StatsCard";
import MonitoringInfo from "./cards/MonitoringInfoCard_PhotoDetails";
import TunnelPath from "./cards/TunnelPathCard";

type SensorKey = "ultrasonic" | "battery" | "gps" | "obstacle";

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

interface PhotoWithCoordinatesProps {
  details: {
    id: string;
    src: string;
    alt: string;
    obstacles: boolean;
    date: string;
    fileName: string;
    dateTime: string;
    metadata: Metadata;
  };
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { y: "-10vh", opacity: 0 },
  visible: { y: "0", opacity: 1 },
  exit: { y: "10vh", opacity: 0 },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const menuItems = [
  {
    name: "Information",
    fillIcon: "ph:read-cv-logo-fill",
    outlineIcon: "ph:read-cv-logo",
  },
  {
    name: "Paths",
    fillIcon: "bxs:navigation",
    outlineIcon: "bx:navigation",
  },
];

interface TabMenuProps {
  activeIndex: number;
  onTabChange: (index: number) => void;
}

function TabMenu({ activeIndex, onTabChange }: TabMenuProps) {
  return (
    <nav
      id="reports-navbar"
      className="flex items-center justify-around w-full bg-white"
    >
      {menuItems.map((item, index) => {
        const isActive = activeIndex === index;
        const icon = isActive ? item.fillIcon : item.outlineIcon;
        const baseClass =
          "flex flex-row gap-3 items-center justify-center text-base font-medium transition duration-200 ease-in-out rounded-xl py-3 px-4 w-full cursor-pointer";
        const activeClass =
          "text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] cursor-default pointer-events-none w-full";
        const inactiveClass = "text-black hover:bg-white/20";

        return (
          <div key={index} className="w-full">
            <div
              onClick={() => onTabChange(index)}
              className={`${baseClass} ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <Icon icon={icon} width={24} height={24} />
              <span className="mt-1">{item.name}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${formattedDate} - ${hours}:${minutes}:${seconds} WIB`;
};

export default function PhotoWithCoordinates({
  details,
  onClose,
}: PhotoWithCoordinatesProps) {
  const [activeTab, setActiveTab] = useState(0);

  const categoryAlert = (ultrasonic: number | string) => {
    if (typeof ultrasonic === "number") {
      if (ultrasonic < 10) {
        return "High";
      } else if (ultrasonic >= 10 && ultrasonic <= 20) {
        return "Medium";
      } else {
        return "Safe";
      }
    }
    return null;
  };

  const categoryStatusAlert = (ultrasonic: number | string) => {
    if (typeof ultrasonic === "number") {
      if (ultrasonic < 10) {
        return "danger";
      } else if (ultrasonic >= 10 && ultrasonic <= 20) {
        return "warning";
      } else {
        return "normal";
      }
    }
    return null;
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-full bg-black/70 z-50 flex items-center justify-center p-5"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-5 w-fit mx-auto flex flex-col gap-4 items-center justify-center relative border-[1px] border-[#CFCFCF]"
        variants={modalVariants}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-row items-center justify-center w-full">
          <div className="p-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md mr-3">
            <Icon
              icon="mage:image-fill"
              width={28}
              height={28}
              className="text-white"
            />
          </div>
          <div className="w-full flex flex-col items-start justify-start">
            <h2 className="text-lg font-bold">Photo Details</h2>
            <p className="text-black/50 text-sm">
              See the details of the captured photo
            </p>
          </div>
        </div>
        <hr className="w-full border-[#000000] opacity-15" />

        {/* Tab Menu */}
        <TabMenu activeIndex={activeTab} onTabChange={setActiveTab} />

        {/* AnimatePresence untuk transisi antar konten tab */}
        <AnimatePresence mode="wait">
          {activeTab === 0 ? (
            <motion.div
              key="information"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="w-full flex items-center justify-center gap-3">
                <img
                  src={details.src}
                  alt={details.alt}
                  className="w-[420px] h-auto rounded-xl border-2 border-gray-200"
                />
                <div className="flex flex-col gap-5 items-start justify-start w-96 p-4 border border-[#DFDFDF] rounded-xl">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-row items-center gap-2 text-sm font-bold text-black">
                      <Icon
                        icon="material-symbols:info-rounded"
                        width={16}
                        height={16}
                      />
                      <p>ID</p>
                    </div>
                    <p className="text-sm text-black">{details.id}</p>
                  </div>
                  {details.fileName && (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex flex-row items-center gap-2 text-sm font-bold text-black">
                        <Icon
                          icon="ic:round-drive-file-rename-outline"
                          width={16}
                          height={16}
                        />
                        <p>File Name</p>
                      </div>
                      <p className="text-sm text-black">{details.fileName}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-row items-center gap-2 text-sm font-bold text-black">
                      <Icon icon="mingcute:time-fill" width={16} height={16} />
                      <p>Date & Time</p>
                    </div>
                    <p className="text-sm text-black">
                      {formatDateTime(details.dateTime)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-row items-center gap-2 text-sm font-bold text-black">
                      <Icon icon="solar:tag-bold" width={16} height={16} />
                      <p>Categories</p>
                    </div>
                    {details.obstacles ? (
                      <div className="w-fit px-4 py-2 rounded-full bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white text-xs font-normal flex items-center gap-1">
                        <Icon
                          icon="fluent:scan-object-24-filled"
                          width={16}
                          height={16}
                        />
                        <p>Obstacles</p>
                      </div>
                    ) : (
                      <div className="w-fit px-4 py-2 rounded-full bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white text-xs font-normal flex items-center gap-1">
                        <Icon
                          icon="material-symbols:check-rounded"
                          width={16}
                          height={16}
                        />
                        <p>Normal</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-row items-center gap-2 text-sm font-bold text-black">
                      <Icon
                        icon="mingcute:camera-2-ai-fill"
                        width={16}
                        height={16}
                      />
                      <p>Shot with</p>
                    </div>
                    <p className="text-sm text-black">ESP32-CAM</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4 items-center w-full h-fit">
                <StatCardList
                  variant="distance"
                  infoItems={[
                    {
                      title: "Distance",
                      value: `${details.metadata.distances.distTotal.toFixed(
                        2
                      )} cm`,
                    },
                    {
                      title: "Distance X",
                      value: `${details.metadata.distances.distX.toFixed(
                        2
                      )} cm`,
                    },
                    {
                      title: "Distance Y",
                      value: `${details.metadata.distances.distY.toFixed(
                        2
                      )} cm`,
                    },
                  ]}
                />
                <StatCardList
                  variant="velocity"
                  infoItems={[
                    {
                      title: "Velocity",
                      value: `${
                        details.metadata.velocity.velocity !== undefined
                          ? `${details.metadata.velocity.velocity.toFixed(2)}`
                          : "N/A"
                      } m/s`,
                    },
                    {
                      title: "Velocity X",
                      value: `${
                        details.metadata.velocity.velocityX !== undefined
                          ? `${details.metadata.velocity.velocityX.toFixed(2)}`
                          : "N/A"
                      } m/s`,
                    },
                    {
                      title: "Velocity Y",
                      value: `${
                        details.metadata.velocity.velocityY !== undefined
                          ? `${details.metadata.velocity.velocityY.toFixed(2)}`
                          : "N/A"
                      } m/s`,
                    },
                  ]}
                />
              </div>
              <div className="w-full">
                <MonitoringInfo<SensorKey>
                  infoItems={[
                    {
                      key: "ultrasonic",
                      icon: "mdi:proximity-sensor",
                      status: "normal",
                      title: "Ultrasonic Reading",
                      value: `${details.metadata.ultrasonic.toFixed(2)} cm`,
                    },
                    {
                      key: "gps",
                      icon: "fa6-solid:compass",
                      status: "normal",
                      title: "IMU Heading Direction",
                      value: `${details.metadata.heading.toFixed(2)}° ${
                        details.metadata.direction
                      }`,
                    },
                    {
                      key: "obstacle",
                      icon: "mynaui:danger-triangle-solid",
                      status: `${
                        categoryStatusAlert(details.metadata.ultrasonic) ||
                        "normal"
                      }`,
                      title: "Obstacle Detection Alert",
                      value: `${categoryAlert(details.metadata.ultrasonic)}`,
                    },
                  ]}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="paths"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center justify-center"
            >
              <div className="w-full h-full rounded-xl border border-[#DFDFDF] flex items-center justify-center relative overflow-hidden">
                <TunnelPath showStartpoint showEndpoint />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-row gap-4 items-center justify-center w-full h-fit mt-7">
          <button className="flex flex-row gap-2 items-center justify-center border-[#E2E2E2] px-6 py-3 border-2 rounded-xl w-full">
            <p className="text-[#5D6383] font-semibold text-sm">Delete</p>
            <Icon
              icon="material-symbols:delete-outline"
              width={20}
              height={20}
              className="text-[#5D6383]"
            />
          </button>
          <button className="flex flex-row gap-2 items-center justify-center border-[#367AF2]/20 px-6 py-3 border-2 rounded-xl w-full">
            <p className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text font-semibold text-sm">
              Download
            </p>
            <Icon
              icon="material-symbols:download"
              width={20}
              height={20}
              className="text-[#39A9F9]"
            />
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-[#e5e7ec] text-[#98A2B3] p-1 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer"
        >
          <Icon icon="tabler:x" width={20} height={20} />
        </button>
      </motion.div>
    </motion.div>
  );
}
