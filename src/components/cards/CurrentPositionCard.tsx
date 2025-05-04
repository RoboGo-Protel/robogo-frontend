"use client";

import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const maxX = 10;
const maxY = 6;
const pathData = [
  { x: 2, y: 2 },
  { x: 3.8, y: 2.5 },
  { x: 4.9, y: 3.5 },
  { x: 5.5, y: 1.2 },
];

export default function CurrentPositionCard() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      }
    });

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const convertToPixelPosition = (x: number, y: number) => {
    const { width, height } = dimensions;
    const pixelX = (x / maxX) * width;
    const pixelY = ((maxY - y) / maxY) * height;
    return {
      left: `${(x / maxX) * 100}%`,
      top: `${((maxY - y) / maxY) * 100}%`,
      pixelX,
      pixelY,
    };
  };

  const polylinePoints = pathData
    .map((point) => {
      const pos = convertToPixelPosition(point.x, point.y);
      return `${pos.pixelX},${pos.pixelY}`;
    })
    .join(" ");

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full rounded-xl overflow-hidden border border-[#ECECEC]"
    >
      <div className="absolute top-4 left-4 z-30 flex flex-row items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow">
          <Icon
            icon="material-symbols-light:navigation-rounded"
            width={18}
            height={18}
            className="text-white rotate-45"
          />
        </div>
        <p className="font-semibold text-base text-black">Current Position</p>
      </div>

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
            <div
              className="absolute inset-0 bg-[length:20px_20px] z-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)",
              }}
            />

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

            {(() => {
              const last = pathData[pathData.length - 1];
              const pos = convertToPixelPosition(last.x, last.y);
              let angleDeg = 0;
              if (pathData.length >= 2) {
                const a = pathData[pathData.length - 2];
                const b = pathData[pathData.length - 1];
                const dx = b.x - a.x;
                const dy = -(b.y - a.y);
                angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                console.log("Angle:", angleDeg);
              }

              return (
                <div
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
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
                </div>
              );
            })()}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
