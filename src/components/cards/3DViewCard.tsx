import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

export default function ThreeDView() {
  return (
    <div
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 relative border-[#ECECEC] rounded-xl flex-1 overflow-hidden`}
    >
      <div
        className="absolute inset-0 bg-[length:20px_20px] z-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)",
        }}
      />
      <div className="flex flex-row items-center justify-start w-full gap-2 z-10">
        <div className="p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
          <Icon
            icon="iconamoon:3d-fill"
            width={20}
            height={20}
            className="text-white"
          />
        </div>
        <p className="font-semibold text-base">3D View</p>
      </div>
    </div>
  );
}
