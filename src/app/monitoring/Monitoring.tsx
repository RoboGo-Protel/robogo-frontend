"use client";
import React, { useEffect, useState } from "react";
import LeftArea_Monitoring from "@/components/ui/monitoring/LeftArea_Monitoring";
import MidArea_Monitoring from "@/components/ui/monitoring/MidArea_Monitoring";
import RightArea_Monitoring from "@/components/ui/monitoring/RightArea_Monitoring";
import { useDarkMode } from "@/context/DarkModeContext";

export default function Monitoring() {
  const { isDark } = useDarkMode();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);

  useEffect(() => {
    const top = document.querySelector("#top-navbar");
    const bottom = document.querySelector("#bottom-navbar");

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`flex flex-col md:flex-row items-start justify-center gap-4 min-h-screen md:h-screen p-5 ${
        isDark ? "bg-[#112133] text-white" : "bg-white text-black"
      }`}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      <LeftArea_Monitoring />
      <MidArea_Monitoring />
      <RightArea_Monitoring />
    </div>
  );
}
