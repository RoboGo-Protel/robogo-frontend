"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MonitoringInfo from "@/components/cards/MonitoringInfoCard";
import { AnimatePresence, motion } from "framer-motion";
import CurrentPosition from "@/components/cards/CurrentPositionCard";
import Table from "@/components/Table";
import { useDarkMode } from "@/context/DarkModeContext";

type SensorKey = "ultrasonic" | "gps" | "obstacle";

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
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface Data {
  id: string;
  src: string;
  alt: string;
  obstacle: boolean;
  date: string;
  fileName: string;
  createdAt: string;
  metadata: Metadata;
}

interface MidAreaMonitoringProps {
  dataMonitoring: Data[];
}

export default function RightArea_Monitoring({
  dataMonitoring,
}: MidAreaMonitoringProps) {
  const [selectedKey, setSelectedKey] = useState<SensorKey>("ultrasonic");
  const { isDark } = useDarkMode();

  const formatWIBTime = (dateString: string) => {
    const date = new Date(dateString);
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 60 * 60000);
    const hours = wib.getHours().toString().padStart(2, "0");
    const minutes = wib.getMinutes().toString().padStart(2, "0");
    const seconds = wib.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds} WIB`;
  };

  const sensorConfigs: Record<
    SensorKey,
    {
      title: string;
      model?: string;
      secondHeaderValue: string;
      data: { timestamp: string; value: number; direction?: string }[];
    }
  > = {
    ultrasonic: {
      title: "Ultrasonic Sensor",
      model: "JSN-SR04T",
      secondHeaderValue: "Distance (cm)",
      data: dataMonitoring.slice(-5).map((d) => ({
        timestamp: formatWIBTime(d.createdAt),
        value: d.metadata.ultrasonic,
      })),
    },
    gps: {
      title: "IMU Heading Direction",
      model: "MPU-9250",
      secondHeaderValue: "Heading (°)",
      data: dataMonitoring.slice(-5).map((d) => ({
        timestamp: formatWIBTime(d.createdAt),
        value: d.metadata.heading,
        direction: d.metadata.direction,
      })),
    },
    obstacle: {
      title: "Obstacle Detection",
      secondHeaderValue: "Obstacle",
      data: dataMonitoring.slice(-5).map((d) => ({
        timestamp: formatWIBTime(d.createdAt),
        value: d.obstacle ? 1 : 0,
      })),
    },
  };

  const latest = dataMonitoring.at(-1);

  type InfoItem = {
    icon: string;
    status: "normal" | "warning" | "danger";
    title: string;
    value: string;
    realValue?: number;
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

  const monitoringItems: (InfoItem & { key: SensorKey })[] = [
    {
      key: "ultrasonic",
      icon: "mdi:proximity-sensor",
      status:
        (latest && categoryStatusAlert(latest.metadata.ultrasonic)) ?? "normal",
      title: "Ultrasonic Reading",
      value: latest ? `${latest.metadata.ultrasonic.toFixed(2)} cm` : "0 cm",
    },
    {
      key: "gps",
      icon: "fa6-solid:compass",
      status: "normal",
      title: "IMU Heading Direction",
      value: latest
        ? `${latest.metadata.heading.toFixed(2)}° ${latest.metadata.direction || ""}`
        : "0° North",
      realValue: latest ? latest.metadata.heading : 0,
    },
  ];

  const handleSelect = (key: SensorKey) => {
    setSelectedKey(key);
  };

  return (
    <div className="flex flex-col items-start justify-start w-full md:w-auto max-w-none md:min-w-[450px] gap-4 h-full">
      <div
        className={`flex flex-col items-center justify-start w-full px-4 md:px-5 py-4 rounded-xl flex-1 border-2 gap-3 ${
          isDark
            ? "border-[#113541] bg-[#0F1B2B] text-white"
            : "border-[#ECECEC] bg-white text-black"
        }`}
      >
        <div className="flex flex-row items-center justify-start w-full gap-2 z-10">
          <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
            <Icon
              icon="fluent:data-usage-32-filled"
              width={20}
              height={20}
              className="text-white"
            />
          </div>
          <p className="font-semibold text-sm md:text-base truncate">
            Real-time Monitoring
          </p>
        </div>

        <div className="w-full z-10">
          <MonitoringInfo<SensorKey>
            infoItems={monitoringItems}
            onSelect={handleSelect}
          />
        </div>

        <div className="w-full z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedKey}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Table
                data={sensorConfigs[selectedKey].data}
                sensorTitle={sensorConfigs[selectedKey].title}
                sensorModel={sensorConfigs[selectedKey].model}
                secondHeaderValue={sensorConfigs[selectedKey].secondHeaderValue}
                reverseOrder
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <CurrentPosition dataMonitoring={dataMonitoring} />
    </div>
  );
}
