import { Icon } from "@iconify/react";
import React, { useRef, useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const maxX = 10;
const maxY = 6;
const iconOffset = 0;

const defaultPathData = [
  {
    x: 0,
    y: 0,
  },
  {
    x: 2,
    y: 1,
    imageUrl:
      "https://img.waterworld.com/files/base/ebm/ww/image/2022/05/16x9/dreamstime_xxl_103719318.62790c38b9109.png?auto=format,compress&fit=max&q=45&w=640&width=640",
    isEndpoint: false,
  },
  {
    x: 4.8,
    y: 2.5,
    imageUrl:
      "https://img.waterworld.com/files/base/ebm/ww/image/2022/05/16x9/dreamstime_xxl_103719318.62790c38b9109.png?auto=format,compress&fit=max&q=45&w=640&width=640",
    isEndpoint: false,
  },
  {
    x: 7.5,
    y: 3.5,
    imageUrl:
      "https://img.waterworld.com/files/base/ebm/ww/image/2022/05/16x9/dreamstime_xxl_103719318.62790c38b9109.png?auto=format,compress&fit=max&q=45&w=640&width=640",
    isEndpoint: false,
  },
  {
    x: 8.5,
    y: 4.5,
    imageUrl:
      "https://img.waterworld.com/files/base/ebm/ww/image/2022/05/16x9/dreamstime_xxl_103719318.62790c38b9109.png?auto=format,compress&fit=max&q=45&w=640&width=640",
    isEndpoint: false,
  },
  {
    x: 9,
    y: 6,
    isEndpoint: true,
  },
];

export default function TunnelPath({
  showStartpoint = false,
  showEndpoint = false,
  pathData = defaultPathData,
}: {
  showStartpoint?: boolean;
  showEndpoint?: boolean;
  pathData?: typeof defaultPathData;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
          console.log("Width:", width, "Height:", height);
        }
      }
    });

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const convertToPixelForLine = (x: number, y: number) => {
    const pixelX = (x / maxX) * dimensions.width;
    const pixelY = ((maxY - y) / maxY) * dimensions.height;
    return { pixelX, pixelY };
  };

  const getMarkerPosition = (x: number, y: number) => {
    const pixelX = (x / maxX) * dimensions.width;
    const pixelY = ((maxY - y) / maxY) * dimensions.height;
    return { left: pixelX, top: pixelY - iconOffset };
  };

  const polylinePoints = pathData
    .map((point) => {
      const { pixelX, pixelY } = convertToPixelForLine(point.x, point.y);
      return `${pixelX},${pixelY}`;
    })
    .join(" ");

  const handleClick = (point: { x: number; y: number }) => {
    alert(`Detail Titik\nx: ${point.x}, y: ${point.y}`);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[500px] rounded-xl overflow-hidden"
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
            <div className="absolute z-50 top-3 right-3 flex gap-2">
              <button
                onClick={() => zoomIn()}
                className="bg-blue-500 text-white px-3 py-1 rounded-md"
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
                className="bg-blue-500 text-white px-3 py-1 rounded-md"
              >
                -
              </button>
              <button
                onClick={() => resetTransform()}
                className="bg-gray-300 text-black px-3 py-1 rounded-md"
              >
                Reset
              </button>
            </div>

            <TransformComponent wrapperClass="w-full h-full">
              <div
                className="relative"
                style={{ width: dimensions.width, height: dimensions.height }}
              >
                <div
                  className="absolute inset-0 bg-[length:20px_20px] z-0"
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
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#3BD5FF" />
                      <stop offset="100%" stopColor="#367AF2" />
                    </linearGradient>
                  </defs>
                </svg>

                {pathData.map((point, idx) => {
                  const pos = getMarkerPosition(point.x, point.y);
                  if (idx === 0 && showStartpoint) {
                    return (
                      <div
                        key={idx}
                        className="absolute flex flex-col items-center z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: pos.left, top: pos.top }}
                        onClick={() => handleClick(point)}
                      >
                        <div className="rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center">
                          <div className="rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800] flex items-center justify-center" />
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
                        className="absolute flex flex-col items-center z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        style={{ left: pos.left, top: pos.top }}
                        onClick={() => handleClick(point)}
                      >
                        <div className="rounded-full w-8 h-8 bg-gradient-to-br from-[#FF623B]/30 to-[#CD2323]/30 flex items-center justify-center">
                          <div className="rounded-full w-5 h-5 bg-gradient-to-br from-[#FF623B] to-[#CD2323] flex items-center justify-center" />
                        </div>
                      </div>
                    );
                  } else {
                    const cardHeight = 120;
                    const shouldPlaceAbove =
                      dimensions.height > 0
                        ? pos.top + cardHeight > dimensions.height
                        : false;

                    return (
                      <div
                        key={idx}
                        className="absolute flex flex-col items-center z-20"
                        style={{
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <>
                          <div
                            onClick={
                              shouldPlaceAbove
                                ? () => handleClick(point)
                                : undefined
                            }
                            className={`${
                              shouldPlaceAbove
                                ? "cursor-pointer"
                                : "invisible cursor-default"
                            } rounded-xl border border-gray-300 bg-white shadow-md p-1 hover:shadow-lg transition`}
                          >
                            <img
                              src={point.imageUrl}
                              className="w-40 h-24 object-cover rounded-md"
                              alt={`Tunnel at ${point.x}, ${point.y}`}
                            />
                            <p className="text-xs text-center pt-1 font-medium">
                              x: {point.x} – y: {point.y}
                            </p>
                          </div>
                          <div className="flex items-center justify-center bg-gradient-to-br from-[#FF623B] to-[#CD2323] rounded-full p-1.5 my-1 shadow">
                            <Icon
                              icon="mynaui:danger-triangle-solid"
                              className="text-white"
                              width={24}
                              height={24}
                            />
                          </div>
                          <div
                            onClick={
                              shouldPlaceAbove
                                ? undefined
                                : () => handleClick(point)
                            }
                            className={`${
                              shouldPlaceAbove
                                ? "invisible cursor-default"
                                : "cursor-pointer"
                            } rounded-xl border border-gray-300 bg-white shadow-md p-1 hover:shadow-lg transition`}
                          >
                            <img
                              src={point.imageUrl}
                              className="w-40 h-24 object-cover rounded-md"
                              alt={`Tunnel at ${point.x}, ${point.y}`}
                            />
                            <p className="text-xs text-center pt-1 font-medium">
                              x: {point.x} – y: {point.y}
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
