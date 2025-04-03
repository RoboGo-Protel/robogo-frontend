"use client";
import React, { useEffect, useState } from "react";
import LeftArea_Monitoring from "@/components/ui/monitoring/LeftArea_Monitoring";
import MidArea_Monitoring from "@/components/ui/monitoring/MidArea_Monitoring";
import RightArea_Monitoring from "@/components/ui/monitoring/RightArea_Monitoring";

export default function Monitoring() {
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

    console.log("Top Navbar Height:", topNavbarHeight);
    console.log("Bottom Navbar Height:", bottomNavbarHeight);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [topNavbarHeight, bottomNavbarHeight]);

  return (
    <div
      className="bg-white flex flex-row items-center justify-center gap-4 text-black h-screen p-5"
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
