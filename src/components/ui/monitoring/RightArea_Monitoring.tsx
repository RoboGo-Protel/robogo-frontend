"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MonitoringInfo from "@/components/cards/MonitoringInfoCard";
import { monitoringItems } from "@/utils/monitoring";
import { AnimatePresence, motion } from "framer-motion";
import CurrentPosition from "@/components/cards/CurrentPositionCard";
import Table from "@/components/Table";

type SensorKey = "ultrasonic" | "battery" | "gps" | "obstacle";

const sensorConfigs: Record<
  SensorKey,
  {
    title: string;
    model: string;
    secondHeaderValue: string;
    data: { timestamp: string; value: number }[];
  }
> = {
  ultrasonic: {
    title: "Ultrasonic Sensor",
    model: "JSN-SR04T",
    secondHeaderValue: "Distance (m)",
    data: [
      { timestamp: "09:41:45", value: 1.1 },
      { timestamp: "09:41:40", value: 0.95 },
      { timestamp: "09:41:35", value: 0.39 },
      { timestamp: "09:41:30", value: 0.4 },
      { timestamp: "09:41:30", value: 0.4 },
    ],
  },
  battery: {
    title: "Battery Status",
    model: "12V Li-ion",
    secondHeaderValue: "Voltage (V)",
    data: [
      { timestamp: "09:41:45", value: 25 },
      { timestamp: "09:41:40", value: 24 },
      { timestamp: "09:41:35", value: 23 },
      { timestamp: "09:41:30", value: 22 },
      { timestamp: "09:41:25", value: 21 },
    ],
  },
  gps: {
    title: "IMU Heading Direction",
    model: "MPU-9250",
    secondHeaderValue: "Heading (°)",
    data: [
      { timestamp: "09:41:45", value: 118 },
      { timestamp: "09:41:40", value: 120 },
      { timestamp: "09:41:35", value: 122 },
      { timestamp: "09:41:30", value: 124 },
      { timestamp: "09:41:25", value: 126 },
    ],
  },
  obstacle: {
    title: "Obstacle Detection",
    model: "ToF VL53L0X",
    secondHeaderValue: "Distance (m)",
    data: [
      { timestamp: "09:41:45", value: 0.48 },
      { timestamp: "09:41:40", value: 0.5 },
      { timestamp: "09:41:35", value: 0.52 },
      { timestamp: "09:41:30", value: 0.55 },
      { timestamp: "09:41:25", value: 0.58 },
    ],
  },
};

export default function RightArea_Monitoring() {
  const [selectedKey, setSelectedKey] = useState<SensorKey>("ultrasonic");

  const handleSelect = (key: SensorKey) => {
    setSelectedKey(key);
  };

  return (
    <div className="flex flex-col items-start justify-start min-w-[450px] max-w-none gap-4 h-full">
      <div className="flex flex-col items-center justify-start w-full px-5 py-4 rounded-xl flex-1 border-2 border-[#ECECEC] gap-3">
        <div className="flex flex-row items-center justify-start w-full gap-2 z-10">
          <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
            <Icon
              icon="fluent:data-usage-32-filled"
              width={20}
              height={20}
              className="text-white"
            />
          </div>
          <p className="font-semibold text-base">Real-time Monitoring</p>
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
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <CurrentPosition />
    </div>
  );
}
