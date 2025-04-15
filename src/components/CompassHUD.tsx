"use client";
import React, { useEffect, useRef, useState } from "react";

export default function CompassHUD({ heading = 0 }: { heading: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pixelsPerDegree = 3;
  const markerSpacing = 15;

  const normalizedHeading = ((heading % 360) + 360) % 360;

  const directionPoints = [
    { label: "N", degree: 0 },
    { label: "NE", degree: 45 },
    { label: "E", degree: 90 },
    { label: "SE", degree: 135 },
    { label: "S", degree: 180 },
    { label: "SW", degree: 225 },
    { label: "W", degree: 270 },
    { label: "NW", degree: 315 },
  ];

  const renderCompass = () => {
    const markers = [];
    const centerX = containerWidth / 2;

    const degreesVisible = containerWidth / pixelsPerDegree;
    const startDegree = normalizedHeading - degreesVisible / 2 - 30;
    const endDegree = normalizedHeading + degreesVisible / 2 + 30;

    for (
      let degree = Math.floor(startDegree / markerSpacing) * markerSpacing;
      degree <= Math.ceil(endDegree / markerSpacing) * markerSpacing;
      degree += markerSpacing
    ) {
      const positionX =
        centerX - (normalizedHeading - degree) * pixelsPerDegree;

      const normalizedDegree = ((degree % 360) + 360) % 360;
      const directionPoint = directionPoints.find(
        (d) => d.degree === normalizedDegree
      );

      markers.push(
        <div
          key={`marker-${degree}`}
          className="absolute flex flex-col items-center"
          style={{
            left: positionX,
            transform: "translateX(-50%)",
          }}
        >
          <div className="h-3 w-[1.5px] bg-white opacity-70 mb-1" />
          {directionPoint && (
            <div className="text-white text-xs font-semibold">
              {directionPoint.label}
            </div>
          )}
        </div>
      );
    }

    return markers;
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-[600px] overflow-hidden"
    >
      <div className="relative h-14 w-full transition-all duration-300 ease-in-out">
        {/* Compass elements */}
        <div className="absolute inset-0">{renderCompass()}</div>

        {/* Center indicator + degree text */}
        <div className="absolute inset-0 pointer-events-none z-50">
          {/* Garis tengah */}
          <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white opacity-90 transform -translate-x-1/2 h-9" />

          {/* Degree text di bawah garis */}
          <div className="absolute left-1/2 top-[40px] transform -translate-x-1/2 text-white text-sm font-semibold flex items-center gap-1 transition-all duration-150 ease-out">
            <span>{normalizedHeading.toFixed(0)}°</span>
            <span>
              {
                directionPoints.find(
                  (d) => d.degree === Math.round(normalizedHeading / 45) * 45
                )?.label
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
