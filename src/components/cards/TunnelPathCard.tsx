/* eslint-disable @next/next/no-img-element */
import { useDarkMode } from "@/context/DarkModeContext";
import { Icon } from "@iconify/react";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import clsx from 'clsx';

const iconOffset = 0;

// Ultrasonic sensor threshold for danger detection (in cm)
const ULTRASONIC_DANGER_THRESHOLD = 10; // If distance < 10cm, consider as danger/obstacle

interface Position {
  x: number;
  y: number;
}

interface PathData {
  id?: string;
  timestamp: string;
  sessionId?: number;
  position: Position;
  speed: number;
  velocity?: number;
  heading: number;
  direction?: string;
  status?: string;
  createdAt?: string;
  distanceTraveled?: number;
  imageFileName?: string;
  imageUrl?: string; // Keep this for backward compatibility
  isEndpoint?: boolean;
  hasImage?: boolean; // Add this to match Paths.tsx
  imagePath?: string; // Add this to match Paths.tsx
  ultrasonic?: number; // Add ultrasonic sensor data for obstacle detection
  isDanger?: boolean; // Add computed field for danger indication
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
      console.log(
        '🗺️ [TUNNEL PATH DEBUG] first point imageUrl:',
        pathData[0].imageUrl,
      );
      console.log(
        '🗺️ [TUNNEL PATH DEBUG] first point imageFileName:',
        pathData[0].imageFileName,
      );

      // Check each point for image data
      pathData.forEach((point, idx) => {
        console.log(`🗺️ [TUNNEL PATH DEBUG] Point ${idx}:`, {
          imageUrl: point.imageUrl,
          imageFileName: point.imageFileName,
          hasImage: point.imageUrl ? 'YES' : 'NO',
        });
      });
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
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
            {' '}
            {/* Control Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className='absolute z-30 top-3 right-3 flex gap-2'
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => zoomIn()}
                className='bg-blue-500 text-white px-3 py-1 rounded-md'
              >
                +
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => zoomOut()}
                className='bg-blue-500 text-white px-3 py-1 rounded-md'
              >
                -
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => resetTransform()}
                className={`px-3 py-1 rounded-md ${
                  isDark
                    ? 'bg-[#1E334A] text-white hover:bg-[#2A435C]'
                    : 'bg-gray-300 text-black hover:bg-gray-200'
                }`}
              >
                Reset
              </motion.button>
            </motion.div>
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

                  // Debug positioning logic
                  console.log(
                    `🗺️ [TUNNEL PATH DEBUG] Point ${idx} positioning:`,
                    {
                      position: point.position,
                      pixelPos: pos,
                      cardHeight,
                      dimensionHeight: dimensions.height,
                      shouldPlaceAbove,
                      hasImage: !!point.imageUrl,
                    },
                  );

                  const cardClass = `rounded-xl border p-1 transition ${
                    isDark
                      ? 'bg-[#1E334A] border-[#2A435C] text-white'
                      : 'bg-white border-gray-300 text-black'
                  }`; // Check if this is start point
                  const isStartPoint = idx === 0 && showStartpoint;
                  // Check if this is end point
                  const isEndPoint =
                    idx === pathData.length - 1 &&
                    point.isEndpoint &&
                    showEndpoint;
                  if (isStartPoint) {
                    return (
                      <div
                        key={idx}
                        className='absolute z-20'
                        style={{
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {/* If no image, show only marker with tooltip */}
                        {!point.imageUrl ? (
                          <div className='relative flex flex-col items-center'>
                            {' '}
                            {/* Tooltip positioned absolutely above marker */}{' '}
                            <div
                              className={clsx(
                                'absolute bottom-full mb-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                'min-w-max whitespace-nowrap z-30',
                                isDark
                                  ? 'bg-gray-900/95 text-yellow-300 border border-yellow-500/40'
                                  : 'bg-white/95 text-amber-700 border border-amber-300',
                              )}
                            >
                              <span className='text-sm'>🟡</span> START (
                              {point.position.x.toFixed(2)},{' '}
                              {point.position.y.toFixed(2)})
                            </div>
                            {/* Start point marker */}
                            <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center'>
                              <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800]' />
                            </div>
                          </div> /* If has image, show image cards with marker */
                        ) : (
                          <div className='flex flex-col items-center'>
                            {' '}
                            {/* Tooltip for start point with image - position based on card placement */}
                            <div
                              className={clsx(
                                'absolute px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                'min-w-max whitespace-nowrap z-30',
                                shouldPlaceAbove
                                  ? 'bottom-full mb-2' // If card is above, tooltip goes above the top card
                                  : 'top-full mt-2', // If card is below, tooltip goes below the bottom card
                                isDark
                                  ? 'bg-gray-900/95 text-yellow-300 border border-yellow-500/40'
                                  : 'bg-white/95 text-amber-700 border border-amber-300',
                              )}
                            >
                              🟡 START - 📍 ({point.position.x.toFixed(2)},{' '}
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
                                src={point.imageUrl}
                                className='w-40 h-24 object-cover rounded-md'
                                alt={`Start point at ${point.position.x}, ${point.position.y}`}
                              />
                            </div>
                            {/* Start point marker */}
                            <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center my-1'>
                              <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800]' />
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
                                src={point.imageUrl}
                                className='w-40 h-24 object-cover rounded-md'
                                alt={`Start point at ${point.position.x}, ${point.position.y}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else if (isEndPoint) {
                    return (
                      <div
                        key={idx}
                        className='absolute z-20'
                        style={{
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {/* If no image, show only marker with tooltip */}
                        {!point.imageUrl ? (
                          <div className='relative flex flex-col items-center'>
                            {' '}
                            {/* Tooltip positioned absolutely above marker */}{' '}
                            <div
                              className={clsx(
                                'absolute bottom-full mb-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                'min-w-max whitespace-nowrap z-30',
                                isDark
                                  ? 'bg-gray-900/95 text-red-300 border border-red-500/40'
                                  : 'bg-white/95 text-red-700 border border-red-300',
                              )}
                            >
                              <span className='text-sm'>🔴</span> END (
                              {point.position.x.toFixed(2)},{' '}
                              {point.position.y.toFixed(2)})
                            </div>
                            {/* End point marker */}
                            <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FF623B]/30 to-[#CD2323]/30 flex items-center justify-center'>
                              <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FF623B] to-[#CD2323]' />
                            </div>
                          </div> /* If has image, show image cards with marker */
                        ) : (
                          <div className='flex flex-col items-center'>
                            {' '}
                            {/* Tooltip for end point with image - position based on card placement */}
                            <div
                              className={clsx(
                                'absolute px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                'min-w-max whitespace-nowrap z-30',
                                shouldPlaceAbove
                                  ? 'bottom-full mb-2' // If card is above, tooltip goes above the top card
                                  : 'top-full mt-2', // If card is below, tooltip goes below the bottom card
                                isDark
                                  ? 'bg-gray-900/95 text-red-300 border border-red-500/40'
                                  : 'bg-white/95 text-red-700 border border-red-300',
                              )}
                            >
                              🔴 END - 🔊 ({point.position.x.toFixed(2)},{' '}
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
                                src={point.imageUrl}
                                className='w-40 h-24 object-cover rounded-md'
                                alt={`End point at ${point.position.x}, ${point.position.y}`}
                              />
                            </div>
                            {/* End point marker */}
                            <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FF623B]/30 to-[#CD2323]/30 flex items-center justify-center my-1'>
                              <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FF623B] to-[#CD2323]' />
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
                                src={point.imageUrl}
                                className='w-40 h-24 object-cover rounded-md'
                                alt={`End point at ${point.position.x}, ${point.position.y}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={idx}
                        className='absolute flex flex-col items-center z-20 group' // Added 'group' class for hover functionality
                        style={{
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <>
                          {/* Show image cards only if image exists */}{' '}
                          {point.imageUrl ? (
                            <>
                              {' '}
                              {/* Tooltip for image points - ONLY show on hover */}
                              <div
                                className={clsx(
                                  'absolute px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                  'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                  'min-w-max whitespace-nowrap z-30',
                                  'opacity-0 group-hover:opacity-100 pointer-events-none', // Only show on hover
                                  shouldPlaceAbove
                                    ? 'bottom-full mb-2' // If card is above, tooltip goes above the top card
                                    : 'top-full mt-2', // If card is below, tooltip goes below the bottom card
                                  isDark
                                    ? 'bg-gray-900/95 text-blue-300 border border-blue-500/40'
                                    : 'bg-white/95 text-blue-700 border border-blue-300',
                                )}
                              >
                                ({point.position.x.toFixed(2)},{' '}
                                {point.position.y.toFixed(2)})
                                {point.ultrasonic !== undefined && (
                                  <span
                                    className={`ml-2 ${point.ultrasonic < ULTRASONIC_DANGER_THRESHOLD ? 'text-red-500' : 'text-green-500'}`}
                                  >
                                    {point.ultrasonic.toFixed(2)}cm
                                  </span>
                                )}
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
                                  src={point.imageUrl}
                                  className='w-40 h-24 object-cover rounded-md'
                                  alt={`Tunnel at ${point.position.x}, ${point.position.y}`}
                                />
                              </div>{' '}
                              {/* Middle icon - show danger warning if obstacle detected */}
                              <div
                                className={`flex items-center justify-center rounded-full p-1.5 my-1 shadow ${
                                  point.ultrasonic !== undefined &&
                                  point.ultrasonic < ULTRASONIC_DANGER_THRESHOLD
                                    ? 'bg-gradient-to-br from-red-600 to-red-500 animate-pulse'
                                    : 'bg-gradient-to-br from-[#FF623B] to-[#CD2323]'
                                }`}
                              >
                                <Icon
                                  icon={
                                    point.ultrasonic !== undefined &&
                                    point.ultrasonic <
                                      ULTRASONIC_DANGER_THRESHOLD
                                      ? 'material-symbols:warning'
                                      : 'mynaui:danger-triangle-solid'
                                  }
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
                                  src={point.imageUrl}
                                  className='w-40 h-24 object-cover rounded-md'
                                  alt={`Tunnel at ${point.position.x}, ${point.position.y}`}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Simple marker for points without images */}
                              {/* Show danger marker if ultrasonic detects obstacle */}
                              {point.ultrasonic !== undefined &&
                              point.ultrasonic < ULTRASONIC_DANGER_THRESHOLD ? (
                                <div className='relative flex flex-col items-center'>
                                  {/* Danger tooltip */}
                                  <div
                                    className={clsx(
                                      'absolute bottom-full mb-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                      'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                      'min-w-max whitespace-nowrap z-30',
                                      isDark
                                        ? 'bg-red-900/95 text-red-300 border border-red-500/40'
                                        : 'bg-red-50/95 text-red-700 border border-red-300',
                                    )}
                                  >
                                    ⚠️ OBSTACLE ({point.ultrasonic.toFixed(1)}
                                    cm)
                                  </div>
                                  {/* Danger marker */}
                                  <div
                                    className='rounded-full w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 cursor-pointer shadow-lg animate-pulse flex items-center justify-center'
                                    onClick={() => handleClick(point.position)}
                                    title={`Obstacle detected: ${point.ultrasonic.toFixed(1)}cm at (${point.position.x}, ${point.position.y})`}
                                  >
                                    <Icon
                                      icon='material-symbols:warning'
                                      className='text-white'
                                      width={16}
                                      height={16}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className='relative flex flex-col items-center group'>
                                  {' '}
                                  {/* Added 'group' class for hover functionality */}
                                  {/* Regular tooltip for points with ultrasonic but no danger - ONLY show on hover */}
                                  {point.ultrasonic !== undefined && (
                                    <div
                                      className={clsx(
                                        'absolute bottom-full mb-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg backdrop-blur-sm',
                                        'left-1/2 transform -translate-x-1/2 transition-all duration-200 ease-in-out',
                                        'min-w-max whitespace-nowrap z-30',
                                        'opacity-0 group-hover:opacity-100 pointer-events-none', // Only show on hover
                                        isDark
                                          ? 'bg-gray-900/95 text-blue-300 border border-blue-500/40'
                                          : 'bg-white/95 text-blue-700 border border-blue-300',
                                      )}
                                    >
                                      🔊 {point.ultrasonic.toFixed(1)}cm - (
                                      {point.position.x.toFixed(2)},{' '}
                                      {point.position.y.toFixed(2)})
                                    </div>
                                  )}
                                  {/* Regular marker */}
                                  <div
                                    className='rounded-full w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-400 cursor-pointer shadow-lg'
                                    onClick={() => handleClick(point.position)}
                                    title={`Position: (${point.position.x}, ${point.position.y})${point.ultrasonic !== undefined ? ` - Distance: ${point.ultrasonic.toFixed(1)}cm` : ''}`}
                                  />
                                </div>
                              )}
                            </>
                          )}
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
    </motion.div>
  );
}
