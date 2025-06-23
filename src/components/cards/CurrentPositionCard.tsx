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
  serialBuffer?: string;
  liveSerialData?: Metadata | null;
  isLocalMode?: boolean;
}

export default function CurrentPositionCard({
  dataMonitoring,
  serialBuffer = '',
  liveSerialData = null,
  isLocalMode = false,
}: CurrentPositionCardProps) {
  const { isDark } = useDarkMode();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const padding = 40;
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // State to store live position history for path creation
  const [livePositionHistory, setLivePositionHistory] = useState<
    Array<{ x: number; y: number; timestamp: number }>
  >([]);

  // Debug: Log data received
  useEffect(() => {
    console.log('📍 [CURRENT POSITION DEBUG] Props received:', {
      isLocalMode,
      hasLiveData: !!liveSerialData,
      liveDataPosition: liveSerialData?.position,
      serialBufferLength: serialBuffer.length,
      dataMonitoringCount: dataMonitoring.length,
      liveHistoryCount: livePositionHistory.length,
    });
  }, [
    isLocalMode,
    liveSerialData,
    serialBuffer,
    dataMonitoring,
    livePositionHistory,
  ]);

  // Update live position history when new serial data arrives
  useEffect(() => {
    if (isLocalMode && liveSerialData && liveSerialData.position) {
      const posX = liveSerialData.position.positionX;
      const posY = liveSerialData.position.positionY;

      if (posX !== undefined && posY !== undefined) {
        const newPosition = { x: posX, y: posY, timestamp: Date.now() };
        setLivePositionHistory((prev) => {
          // Check if position actually changed (avoid duplicates)
          const lastPos = prev[prev.length - 1];
          if (
            lastPos &&
            Math.abs(lastPos.x - posX) < 0.1 &&
            Math.abs(lastPos.y - posY) < 0.1
          ) {
            return prev; // Skip if position hasn't changed significantly
          } // Add new position without limiting history
          const newHistory = [...prev, newPosition];

          console.log('📈 [LIVE POSITION HISTORY] Updated:', {
            newPos: newPosition,
            historyLength: newHistory.length,
            allPositions: newHistory,
          });

          return newHistory;
        });
      }
    }
  }, [isLocalMode, liveSerialData]);

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
  // Combine Firebase data with live serial data
  const getAllPositions = () => {
    // Get positions from Firebase data
    const firebasePositions = dataMonitoring
      .map((item) => {
        const posX = item.metadata.position?.positionX;
        const posY = item.metadata.position?.positionY;
        if (posX === undefined || posY === undefined) return null;
        return { x: posX, y: posY, source: 'firebase' };
      })
      .filter(
        (pos): pos is { x: number; y: number; source: string } => pos !== null,
      );

    // If in local mode, combine Firebase positions with live position history
    if (isLocalMode && livePositionHistory.length > 0) {
      const livePositions = livePositionHistory.map((pos) => ({
        x: pos.x,
        y: pos.y,
        source: 'live',
      }));

      // Return Firebase positions + live position history for seamless transition
      return [...firebasePositions, ...livePositions];
    }

    // Add single live serial data position if available (fallback)
    const positions = [...firebasePositions];
    if (isLocalMode && liveSerialData && liveSerialData.position) {
      const posX = liveSerialData.position.positionX;
      const posY = liveSerialData.position.positionY;
      if (posX !== undefined && posY !== undefined) {
        positions.push({ x: posX, y: posY, source: 'live' });
      }
    }

    return positions;
  };

  const validPositions = getAllPositions();

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

  const maxAbsX = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const maxAbsY = Math.max(Math.abs(minY), Math.abs(maxY)) || 1;

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
    .join(' ');

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
    return <div ref={wrapperRef} className='w-full h-full' />;
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full rounded-xl overflow-hidden border-2 ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      {' '}
      {/* Header */}
      <div className='absolute top-4 left-4 z-30 flex flex-row items-center gap-2'>
        <div className='p-1.5 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow'>
          <Icon
            icon='material-symbols-light:navigation-rounded'
            width={18}
            height={18}
            className='text-white rotate-45'
          />
        </div>
        <p
          className={`font-semibold text-base ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          Current Position
        </p>{' '}
        {/* Live path indicator */}
        {isLocalMode && livePositionHistory.length > 0 && (
          <div className='flex items-center gap-1.5 ml-2 px-2 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30'>
            <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
            <span className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
              LIVE ({livePositionHistory.length})
            </span>
          </div>
        )}
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
        <TransformComponent wrapperClass='w-full h-full'>
          <div
            className='relative'
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
                  isDark ? '#1f2e40' : '#e0e0e0'
                } 1px, transparent 1px), linear-gradient(to bottom, ${
                  isDark ? '#1f2e40' : '#e0e0e0'
                } 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />{' '}
            {/* Polyline Path */}
            <svg
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className='absolute top-0 left-0 w-full h-full z-10'
            >
              {/* Firebase path */}
              <polyline
                points={polylinePoints}
                fill='none'
                stroke='url(#path-gradient)'
                strokeWidth='8'
                strokeLinecap='round'
              />

              {/* Live position history path */}
              {isLocalMode &&
                livePositionHistory.length > 1 &&
                (() => {
                  const livePolylinePoints = livePositionHistory
                    .map((pos) => {
                      const pixelPos = convertToPixelPosition(pos.x, pos.y);
                      return `${pixelPos.pixelX},${pixelPos.pixelY}`;
                    })
                    .join(' ');

                  return (
                    <polyline
                      points={livePolylinePoints}
                      fill='none'
                      stroke='url(#live-path-gradient)'
                      strokeWidth='6'
                      strokeLinecap='round'
                      strokeDasharray='5,5'
                      opacity='0.9'
                    />
                  );
                })()}

              {/* Live position point (current position) */}
              {isLocalMode &&
                liveSerialData &&
                liveSerialData.position &&
                (() => {
                  const livePosX = liveSerialData.position.positionX;
                  const livePosY = liveSerialData.position.positionY;
                  if (livePosX !== undefined && livePosY !== undefined) {
                    const livePos = convertToPixelPosition(livePosX, livePosY);
                    return (
                      <circle
                        cx={livePos.pixelX}
                        cy={livePos.pixelY}
                        r='6'
                        fill='url(#live-gradient)'
                        stroke='white'
                        strokeWidth='2'
                      />
                    );
                  }
                  return null;
                })()}

              <defs>
                <linearGradient id='path-gradient' x1='0' y1='0' x2='1' y2='0'>
                  <stop offset='0%' stopColor='#3b82f6' />
                  <stop offset='100%' stopColor='#60a5fa' />
                </linearGradient>{' '}
                <linearGradient
                  id='live-path-gradient'
                  x1='0'
                  y1='0'
                  x2='1'
                  y2='0'
                >
                  <stop offset='0%' stopColor='#3b82f6' />
                  <stop offset='100%' stopColor='#60a5fa' />
                </linearGradient>
                <radialGradient id='live-gradient'>
                  <stop offset='0%' stopColor='#3b82f6' />
                  <stop offset='100%' stopColor='#60a5fa' />
                </radialGradient>
              </defs>
            </svg>{' '}
            {/* Pointer */}
            {(() => {
              // Use live position if available in local mode, otherwise use last Firebase position
              let currentX, currentY, currentPos;

              if (isLocalMode && liveSerialData && liveSerialData.position) {
                currentX = liveSerialData.position.positionX;
                currentY = liveSerialData.position.positionY;
                if (currentX !== undefined && currentY !== undefined) {
                  currentPos = convertToPixelPosition(currentX, currentY);
                } else {
                  // Fallback to last Firebase position
                  currentX = last.x;
                  currentY = last.y;
                  currentPos = pos;
                }
              } else {
                currentX = last.x;
                currentY = last.y;
                currentPos = pos;
              }

              return (
                <div
                  className='absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pt-4'
                  style={{ left: currentPos.left, top: currentPos.top }}
                >
                  <div className='relative w-10 h-10'>
                    {' '}
                    <div
                      className={`absolute inset-0 rounded-full opacity-40 blur-2xl ${
                        isLocalMode && liveSerialData && liveSerialData.position
                          ? 'bg-blue-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        isLocalMode && liveSerialData && liveSerialData.position
                          ? 'bg-gradient-to-br from-blue-500 to-blue-400'
                          : 'bg-gradient-to-br from-blue-500 to-blue-400'
                      }`}
                    >
                      <Icon
                        icon='material-symbols-light:navigation-rounded'
                        width={24}
                        height={24}
                        className='text-white'
                        style={{
                          transform: `rotate(${angleDeg}deg)`,
                          transition: 'transform 0.3s ease-in-out',
                        }}
                      />
                    </div>
                  </div>{' '}
                  {/* Coordinates below icon */}
                  <div
                    className={`mt-1 text-xs font-mono select-none ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                  >
                    X: {currentX.toFixed(2)}, Y: {currentY.toFixed(2)}
                  </div>
                </div>
              );
            })()}
            {/* Optional: show origin (0,0) */}
            <div
              className='absolute w-2 h-2 bg-red-500 rounded-full'
              style={{
                left: `${(dimensions.width / 2 / dimensions.width) * 100}%`,
                top: `${(dimensions.height / 2 / dimensions.height) * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
              }}
              title='Origin (0,0)'
            />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
