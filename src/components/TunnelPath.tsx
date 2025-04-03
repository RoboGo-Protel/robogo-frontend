import { Icon } from "@iconify/react";
import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const maxX = 10;
const maxY = 6;
const viewportWidth = 600;
const viewportHeight = 400;
const iconOffset = 65;

const pathData = [
  { x: 2, y: 2 },
  { x: 4.8, y: 2.5 },
  { x: 7.5, y: 3.5 },
];

const convertToPixelPosition = (x: number, y: number) => {
  const pixelX = (x / maxX) * viewportWidth;
  const pixelY = ((maxY - y) / maxY) * viewportHeight - iconOffset;
  return {
    left: `${(x / maxX) * 100}%`,
    top: `${((maxY - y) / maxY) * 100}%`,
    pixelX,
    pixelY,
  };
};

const imageUrl =
  "https://img.waterworld.com/files/base/ebm/ww/image/2022/05/16x9/dreamstime_xxl_103719318.62790c38b9109.png?auto=format,compress&fit=max&q=45&w=640&width=640";

export default function TunnelPath() {
  const polylinePoints = pathData
    .map((point) => {
      const pos = convertToPixelPosition(point.x, point.y);
      return `${pos.pixelX},${pos.pixelY}`;
    })
    .join(" ");

  const handleClick = (point: { x: number; y: number }) => {
    alert(`Detail Titik\nx: ${point.x}, y: ${point.y}`);
  };

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
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
            {/* Optional: Zoom controls */}
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
              <div className="relative w-[600px] h-[400px]">
                {/* Grid background */}
                <div
                  className="absolute inset-0 bg-[length:20px_20px] z-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)",
                  }}
                />

                {/* Polyline Path */}
                <svg
                  viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
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

                {/* Points and images */}
                {pathData.map((point, idx) => {
                  const pos = convertToPixelPosition(point.x, point.y);
                  return (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: pos.left, top: pos.top }}
                      onClick={() => handleClick(point)}
                    >
                      {/* Warning icon */}
                      <div className="flex items-center justify-center bg-gradient-to-br from-[#FF623B] to-[#CD2323] rounded-full p-1.5 mb-1 shadow">
                        <Icon
                          icon="mynaui:danger-triangle-solid"
                          className="text-white"
                          width={24}
                          height={24}
                        />
                      </div>

                      {/* Image card */}
                      <div className="rounded-xl border border-gray-300 bg-white shadow-md p-1 hover:shadow-lg transition">
                        <img
                          src={imageUrl}
                          className="w-40 h-24 object-cover rounded-md"
                          alt={`Tunnel at ${point.x}, ${point.y}`}
                        />
                        <p className="text-xs text-center pt-1 font-medium">
                          x: {point.x} – y: {point.y}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
