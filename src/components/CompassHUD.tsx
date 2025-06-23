"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';

export default function CompassHUD({ heading = 0 }: { heading: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(300); // Reduced default width
  // Debug logging
  useEffect(() => {
    console.log('🧭 [COMPASS DEBUG] Component rendered with:', {
      heading,
      normalizedHeading: ((heading % 360) + 360) % 360,
      containerWidth,
      containerExists: !!containerRef.current,
    });
  }, [heading, containerWidth]);
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      if (width > 0) {
        setContainerWidth(width);
      }
    }
  }, []);

  useEffect(() => {
    // Initial width update with a small delay to ensure DOM is ready
    const timer = setTimeout(updateWidth, 100);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [updateWidth]);
  const pixelsPerDegree = 3;
  const markerSpacing = 15;

  const normalizedHeading = ((heading % 360) + 360) % 360;
  const directionPoints = useMemo(
    () => [
      { label: 'N', labelFull: 'North', degree: 0 },
      { label: 'NE', labelFull: 'NorthEast', degree: 45 },
      { label: 'E', labelFull: 'East', degree: 90 },
      { label: 'SE', labelFull: 'SouthEast', degree: 135 },
      { label: 'S', labelFull: 'South', degree: 180 },
      { label: 'SW', labelFull: 'SouthWest', degree: 225 },
      { label: 'W', labelFull: 'West', degree: 270 },
      { label: 'NW', labelFull: 'NorthWest', degree: 315 },
    ],
    [],
  );
  const renderCompass = useCallback(() => {
    const markers = [];
    // Use simple center calculation without padding adjustment
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
        (d) => d.degree === normalizedDegree,
      );

      markers.push(
        <div
          key={`marker-${degree}`}
          className='absolute flex flex-col items-center'
          style={{
            left: positionX,
            transform: 'translateX(-50%)',
          }}
        >
          <div className='h-3 w-[1.5px] bg-white opacity-70 mb-1' />
          {directionPoint && (
            <div className='text-white text-xs font-semibold'>
              {directionPoint.label}
            </div>
          )}
        </div>,
      );
    }

    return markers;
  }, [containerWidth, normalizedHeading, directionPoints]);
  return (
    <div
      className='relative w-full max-w-[300px] min-w-[200px] overflow-hidden mx-auto bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg p-2'
      style={{ minHeight: '60px' }}
    >
      <div
        ref={containerRef}
        className='relative h-14 w-full transition-all duration-300 ease-in-out'
      >
        {/* Compass elements */}
        <div className='absolute inset-0'>{renderCompass()}</div>

        {/* Center indicator + degree text */}
        <div className='absolute inset-0 pointer-events-none z-10'>
          {/* Garis tengah - precisely centered */}
          <div
            className='absolute inset-y-0 w-[2px] bg-white opacity-90 h-9'
            style={{
              left: `calc(50% - 1px)`,
            }}
          />{' '}
          {/* Degree text di bawah garis */}
          <div className='absolute left-1/2 top-[40px] transform -translate-x-1/2 text-white text-sm font-semibold flex items-center gap-1 transition-all duration-150 ease-out bg-black/50 px-2 py-1 rounded whitespace-nowrap'>
            <span>
              {normalizedHeading % 1 === 0
                ? normalizedHeading.toFixed(0)
                : normalizedHeading.toFixed(2)}
              °
            </span>
            <span>
              {
                directionPoints.find(
                  (d) => d.degree === Math.round(normalizedHeading / 45) * 45,
                )?.labelFull
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
