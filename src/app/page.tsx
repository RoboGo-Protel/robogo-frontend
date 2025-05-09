"use client";
import React, { useEffect, useState } from "react";
import LeftArea_Home from "@/components/ui/home/LeftArea_Home";
import MidArea_Home from "@/components/ui/home/MidArea_Home";
import RightArea_Home from "@/components/ui/home/RightArea_Home";
import { clsx } from "clsx";

export default function Home() {
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
      className={clsx(
        "flex flex-row items-center justify-center gap-4 h-screen p-5 transition-colors duration-300 bg-white text-black"
      )}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      <LeftArea_Home />
      <MidArea_Home />
      <RightArea_Home />
    </div>
  );
}
