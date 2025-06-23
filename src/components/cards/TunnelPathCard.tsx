/* eslint-disable @next/next/no-img-element */
import { useDarkMode } from "@/context/DarkModeContext";
import { Icon } from "@iconify/react";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import clsx from 'clsx';

const iconOffset = 0;

interface Position {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
  imageUrl?: string;
  isEndpoint?: boolean;
}

interface TunnelPathProps {
  pathData?: PathData[];
  showStartpoint?: boolean;
  showEndpoint?: boolean;
}

export default function TunnelPath({
  pathData = [],
  showStartpoint = false,
  showEndpoint = false,
}: TunnelPathProps) {
  const { isDark } = useDarkMode();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  // Calculate dynamic maxX and maxY based on pathData
  const { maxX, maxY, minX, minY } = useMemo(() => {
    if (pathData.length === 0) {
      return { maxX: 10, maxY: 10, minX: 0, minY: 0 }; // Default fallback values
    }

    const xValues = pathData.map((point) => point.position.x);
    const yValues = pathData.map((point) => point.position.y);

    const minXValue = Math.min(...xValues);
    const maxXValue = Math.max(...xValues);
    const minYValue = Math.min(...yValues);
    const maxYValue = Math.max(...yValues);

    // Calculate range
    const xRange = maxXValue - minXValue;
    const yRange = maxYValue - minYValue;

    // Add padding (20% of range, minimum 1 unit on each side)
    const xPadding = Math.max(xRange * 0.2, 1);
    const yPadding = Math.max(yRange * 0.2, 1);

    const dynamicMinX = minXValue - xPadding;
    const dynamicMaxX = maxXValue + xPadding;
    const dynamicMinY = minYValue - yPadding;
    const dynamicMaxY = maxYValue + yPadding;

    console.log('🗺️ [TUNNEL PATH DEBUG] Calculated dynamic bounds:');
    console.log(
      '🗺️ [TUNNEL PATH DEBUG] X range:',
      minXValue,
      'to',
      maxXValue,
      '→ bounds:',
      dynamicMinX,
      'to',
      dynamicMaxX,
    );
    console.log(
      '🗺️ [TUNNEL PATH DEBUG] Y range:',
      minYValue,
      'to',
      maxYValue,
      '→ bounds:',
      dynamicMinY,
      'to',
      dynamicMaxY,
    );

    return {
      maxX: dynamicMaxX,
      maxY: dynamicMaxY,
      minX: dynamicMinX,
      minY: dynamicMinY,
    };
  }, [pathData]);

  // Debug pathData
  useEffect(() => {
    console.log('🗺️ [TUNNEL PATH DEBUG] pathData received:', pathData);
    console.log('🗺️ [TUNNEL PATH DEBUG] pathData length:', pathData.length);
    if (pathData.length > 0) {
      console.log(
        '🗺️ [TUNNEL PATH DEBUG] first point position:',
        pathData[0].position,
      );
      console.log(
        '🗺️ [TUNNEL PATH DEBUG] first point x:',
        pathData[0].position.x,
      );
      console.log(
        '🗺️ [TUNNEL PATH DEBUG] first point y:',
        pathData[0].position.y,
      );
    }
  }, [pathData]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
          console.log('Width:', width, 'Height:', height);
        }
      }
    });

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);
  const convertToPixelForLine = (x: number, y: number) => {
    // Normalize coordinates to 0-1 range, then scale to pixel dimensions
    const normalizedX = (x - minX) / (maxX - minX);
    const normalizedY = (y - minY) / (maxY - minY);

    const pixelX = normalizedX * dimensions.width;
    const pixelY = (1 - normalizedY) * dimensions.height; // Flip Y for screen coordinates

    return { pixelX, pixelY };
  };

  const getMarkerPosition = (x: number, y: number) => {
    // Normalize coordinates to 0-1 range, then scale to pixel dimensions
    const normalizedX = (x - minX) / (maxX - minX);
    const normalizedY = (y - minY) / (maxY - minY);

    const pixelX = normalizedX * dimensions.width;
    const pixelY = (1 - normalizedY) * dimensions.height; // Flip Y for screen coordinates

    // Debug pixel calculations
    console.log('🗺️ [TUNNEL PATH DEBUG] Calculating position for:', { x, y });
    console.log(
      '🗺️ [TUNNEL PATH DEBUG] bounds - minX:',
      minX,
      'maxX:',
      maxX,
      'minY:',
      minY,
      'maxY:',
      maxY,
    );
    console.log('🗺️ [TUNNEL PATH DEBUG] normalized:', {
      normalizedX,
      normalizedY,
    });
    console.log('🗺️ [TUNNEL PATH DEBUG] dimensions:', dimensions);
    console.log(
      '🗺️ [TUNNEL PATH DEBUG] calculated pixelX:',
      pixelX,
      'pixelY:',
      pixelY,
    );
    console.log('🗺️ [TUNNEL PATH DEBUG] final position:', {
      left: pixelX,
      top: pixelY - iconOffset,
    });

    return { left: pixelX, top: pixelY - iconOffset };
  };

  const polylinePoints = pathData
    .map((point) => {
      const { pixelX, pixelY } = convertToPixelForLine(
        point.position.x,
        point.position.y,
      );
      return `${pixelX},${pixelY}`;
    })
    .join(' ');

  const handleClick = (point: { x: number; y: number }) => {
    alert(`Detail Titik\nx: ${point.x}, y: ${point.y}`);
  };
  return (
    <div
      ref={wrapperRef}
      className={`relative w-full h-full rounded-xl overflow-hidden ${
        isDark ? 'bg-[#112133]' : 'bg-white'
      }`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ step: 50 }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Control Buttons */}
            <div className='absolute z-30 top-3 right-3 flex gap-2'>
              <button
                onClick={() => zoomIn()}
                className='bg-blue-500 text-white px-3 py-1 rounded-md'
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
                className='bg-blue-500 text-white px-3 py-1 rounded-md'
              >
                -
              </button>
              <button
                onClick={() => resetTransform()}
                className={`px-3 py-1 rounded-md ${
                  isDark
                    ? 'bg-[#1E334A] text-white hover:bg-[#2A435C]'
                    : 'bg-gray-300 text-black hover:bg-gray-200'
                }`}
              >
                Reset
              </button>
            </div>

            <TransformComponent wrapperClass='w-full h-full'>
              <div
                className='relative'
                style={{ width: dimensions.width, height: dimensions.height }}
              >
                {/* Grid background */}
                <div
                  className='absolute inset-0 bg-[length:20px_20px] z-0'
                  style={{
                    backgroundImage: isDark
                      ? 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
                      : 'linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)',
                  }}
                />

                {/* Polyline layer */}
                <svg
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  className='absolute top-0 left-0 w-full h-full z-10'
                >
                  <polyline
                    points={polylinePoints}
                    fill='none'
                    stroke='url(#gradient)'
                    strokeWidth='8'
                    strokeLinecap='round'
                  />
                  <defs>
                    <linearGradient
                      id='gradient'
                      x1='0'
                      y1='0'
                      x2='100%'
                      y2='0'
                    >
                      <stop offset='0%' stopColor='#3b82f6' />
                      <stop offset='100%' stopColor='#60a5fa' />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Markers & Cards */}
                {pathData.map((point, idx) => {
                  const pos = getMarkerPosition(
                    point.position.x,
                    point.position.y,
                  );
                  const cardHeight = 120;
                  const shouldPlaceAbove =
                    dimensions.height > 0
                      ? pos.top + cardHeight > dimensions.height
                      : false;

                  const cardClass = `rounded-xl border p-1 shadow-md hover:shadow-lg transition ${
                    isDark
                      ? 'bg-[#1E334A] border-[#2A435C] text-white'
                      : 'bg-white border-gray-300 text-black'
                  }`;
                  if (idx === 0 && showStartpoint) {
                    return (
                      <div
                        key={idx}
                        className='absolute flex flex-col items-center z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer'
                        style={{ left: pos.left, top: pos.top }}
                        onClick={() => handleClick(point.position)}
                      >
                        {' '}
                        {/* Tooltip always visible */}
                        <div
                          className={clsx(
                            'mb-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg backdrop-blur-sm',
                            'transform transition-all duration-200 ease-in-out',
                            isDark
                              ? 'bg-gray-900/90 text-yellow-300 border border-yellow-500/30'
                              : 'bg-white/90 text-amber-700 border border-amber-300',
                          )}
                        >
                          <span className='text-xs'>🟡</span> (
                          {point.position.x.toFixed(2)},{' '}
                          {point.position.y.toFixed(2)})
                        </div>
                        <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center'>
                          <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800]' />
                        </div>
                      </div>
                    );
                  } else if (
                    idx === pathData.length - 1 &&
                    point.isEndpoint &&
                    showEndpoint
                  ) {
                    return (
                      <div
                        key={idx}
                        className='absolute flex flex-col items-center z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer'
                        style={{ left: pos.left, top: pos.top }}
                        onClick={() => handleClick(point.position)}
                      >
                        {' '}
                        {/* Tooltip always visible */}
                        <div
                          className={clsx(
                            'mb-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg backdrop-blur-sm',
                            'transform transition-all duration-200 ease-in-out',
                            isDark
                              ? 'bg-gray-900/90 text-red-300 border border-red-500/30'
                              : 'bg-white/90 text-red-700 border border-red-300',
                          )}
                        >
                          <span className='text-xs'>🔴</span> (
                          {point.position.x.toFixed(2)},{' '}
                          {point.position.y.toFixed(2)})
                        </div>
                        <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FF623B]/30 to-[#CD2323]/30 flex items-center justify-center'>
                          <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FF623B] to-[#CD2323]' />
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={idx}
                        className='absolute flex flex-col items-center z-20'
                        style={{
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <>
                          {' '}
                          {/* Tooltip always visible above marker */}
                          <div
                            className={clsx(
                              'mb-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg backdrop-blur-sm',
                              'transform transition-all duration-200 ease-in-out',
                              isDark
                                ? 'bg-gray-900/90 text-blue-300 border border-blue-500/30'
                                : 'bg-white/90 text-blue-700 border border-blue-300',
                            )}
                          >
                            <span className='text-xs'>📍</span> (
                            {point.position.x.toFixed(2)},{' '}
                            {point.position.y.toFixed(2)})
                          </div>
                          {/* Top card */}
                          <div
                            onClick={
                              shouldPlaceAbove
                                ? () => handleClick(point.position)
                                : undefined
                            }
                            className={`${
                              shouldPlaceAbove
                                ? 'cursor-pointer'
                                : 'invisible cursor-default'
                            } ${cardClass}`}
                          >
                            <img
                              src={point.imageUrl || '/images/no_image.png'}
                              className='w-40 h-24 object-cover rounded-md'
                              alt={`Tunnel at ${point.position.x}, ${point.position.y}`}
                            />
                            <p className='text-xs text-center pt-1 font-medium'>
                              x: {point.position.x} – y: {point.position.y}
                            </p>
                          </div>
                          {/* Middle icon */}
                          <div className='flex items-center justify-center bg-gradient-to-br from-[#FF623B] to-[#CD2323] rounded-full p-1.5 my-1 shadow'>
                            <Icon
                              icon='mynaui:danger-triangle-solid'
                              className='text-white'
                              width={24}
                              height={24}
                            />
                          </div>
                          {/* Bottom card */}
                          <div
                            onClick={
                              shouldPlaceAbove
                                ? undefined
                                : () => handleClick(point.position)
                            }
                            className={`${
                              shouldPlaceAbove
                                ? 'invisible cursor-default'
                                : 'cursor-pointer'
                            } ${cardClass}`}
                          >
                            <img
                              src={point.imageUrl || '/images/no_image.png'}
                              className='w-40 h-24 object-cover rounded-md'
                              alt={`Tunnel at ${point.position.x}, ${point.position.y}`}
                            />
                            <p className='text-xs text-center pt-1 font-medium'>
                              x: {point.position.x} – y: {point.position.y}
                            </p>
                          </div>
                        </>
                      </div>
                    );
                  }
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
