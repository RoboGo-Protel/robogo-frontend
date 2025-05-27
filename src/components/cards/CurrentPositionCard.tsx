"use client";

import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useDarkMode } from "@/context/DarkModeContext";

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

interface CurrentPositionCardProps {
  dataMonitoring: Data[];
}

export default function CurrentPositionCard({
  dataMonitoring,
}: CurrentPositionCardProps) {
  const { isDark } = useDarkMode();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const padding = 40;
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    });

    const currentWrapper = wrapperRef.current;
    if (currentWrapper) {
      observer.observe(currentWrapper);
    }

    return () => {
      if (currentWrapper) {
        observer.unobserve(currentWrapper);
      }
    };
  }, []);

  // Ambil posisi valid dari positionX dan positionY
  const validPositions = dataMonitoring
    .map((item) => {
      const posX = item.metadata.position.positionX;
      const posY = item.metadata.position.positionY;
      if (posX === undefined || posY === undefined) return null;
      return { x: posX, y: posY };
    })
    .filter((pos): pos is { x: number; y: number } => pos !== null);

  // Cari nilai min dan max untuk x dan y
  const minX = validPositions.length
    ? Math.min(...validPositions.map((p) => p.x))
    : -10;
  const maxX = validPositions.length
    ? Math.max(...validPositions.map((p) => p.x))
    : 10;
  const minY = validPositions.length
    ? Math.min(...validPositions.map((p) => p.y))
    : -10;
  const maxY = validPositions.length
    ? Math.max(...validPositions.map((p) => p.y))
    : 10;

  // Ambil nilai mutlak terbesar supaya skala simetris di tengah
  const maxAbsX = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const maxAbsY = Math.max(Math.abs(minY), Math.abs(maxY)) || 1;

  // Fungsi konversi koordinat kartesius ke posisi pixel di container dengan 0,0 di tengah
  const convertToPixelPosition = (x: number, y: number) => {
    const pixelX =
      (x / maxAbsX) * ((dimensions.width - padding * 2) / 2) +
      dimensions.width / 2;
    const pixelY =
      (-y / maxAbsY) * ((dimensions.height - padding * 2) / 2) +
      dimensions.height / 2;

    return {
      left: `${(pixelX / dimensions.width) * 100}%`,
      top: `${(pixelY / dimensions.height) * 100}%`,
      pixelX,
      pixelY,
    };
  };

  const pathData =
    validPositions.length > 0 ? validPositions : [{ x: 0, y: 0 }];

  const polylinePoints = pathData
    .map((point) => {
      const pos = convertToPixelPosition(point.x, point.y);
      return `${pos.pixelX},${pos.pixelY}`;
    })
    .join(" ");

  const last = pathData[pathData.length - 1];
  const pos = convertToPixelPosition(last.x, last.y);

  let angleDeg = 0;
  if (pathData.length >= 2) {
    const a = pathData[pathData.length - 2];
    const b = pathData[pathData.length - 1];
    const dx = b.x - a.x;
    const dy = -(b.y - a.y);
    angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  }

  if (!dimensions.width || !dimensions.height) {
    return <div ref={wrapperRef} className="w-full h-full" />;
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full rounded-xl overflow-hidden border-2 ${
        isDark
          ? "border-[#113541] bg-[#0F1B2B] text-white"
          : "border-[#ECECEC] bg-white text-black"
      }`}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 z-30 flex flex-row items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow">
          <Icon
            icon="material-symbols-light:navigation-rounded"
            width={18}
            height={18}
            className="text-white rotate-45"
          />
        </div>
        <p
          className={`font-semibold text-base ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          Current Position
        </p>
      </div>

      {/* Map */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ step: 50 }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent wrapperClass="w-full h-full">
          <div
            className="relative"
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {/* Grid */}
            <div
              className={`absolute inset-0 z-0 opacity-60 pointer-events-none`}
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  isDark ? "#1f2e40" : "#e0e0e0"
                } 1px, transparent 1px), linear-gradient(to bottom, ${
                  isDark ? "#1f2e40" : "#e0e0e0"
                } 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Polyline Path */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="absolute top-0 left-0 w-full h-full z-10"
            >
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="path-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3BD5FF" />
                  <stop offset="100%" stopColor="#367AF2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Pointer */}
            <div
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pt-4"
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-[#3BD5FF] opacity-40 blur-2xl" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] flex items-center justify-center shadow-lg">
                  <Icon
                    icon="material-symbols-light:navigation-rounded"
                    width={24}
                    height={24}
                    className="text-white"
                    style={{
                      transform: `rotate(${angleDeg}deg)`,
                      transition: "transform 0.3s ease-in-out",
                    }}
                  />
                </div>
              </div>

              {/* Koordinat di bawah icon */}
              <div
                className={`mt-1 text-xs font-mono select-none ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                X: {last.x.toFixed(2)}, Y: {last.y.toFixed(2)}
              </div>
            </div>

            {/* Optional: show origin (0,0) */}
            <div
              className="absolute w-2 h-2 bg-red-500 rounded-full"
              style={{
                left: `${(dimensions.width / 2 / dimensions.width) * 100}%`,
                top: `${(dimensions.height / 2 / dimensions.height) * 100}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 15,
              }}
              title="Origin (0,0)"
            />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
