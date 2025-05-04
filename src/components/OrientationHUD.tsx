"use client";
import React from "react";
import { motion } from "framer-motion";

interface BoatOrientationHUDProps {
  roll: number; // -45 ke 45 (kemiringan kapal ke kiri/kanan)
}

export default function BoatOrientationHUD({
  roll = 0,
}: BoatOrientationHUDProps) {
  return (
    <div className="relative w-full h-[150px] overflow-hidden rounded-md">
      {/* Background garis horizon */}
      <motion.div
        className="absolute inset-0 origin-center"
        animate={{
          rotate: roll,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      >
        {/* Garis horizon */}
        <div className="absolute top-1/2 left-0 w-full border-t-2 border-white opacity-20" />

        {/* Label derajat miring */}
        <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold">
          {roll.toFixed(1)}°
        </div>
      </motion.div>

      {/* Center marker tetap */}
      <div className="absolute top-1/2 left-1/2 w-10 h-[2px] bg-red-500 transform -translate-x-1/2 -translate-y-1/2 z-10" />
    </div>
  );
}
