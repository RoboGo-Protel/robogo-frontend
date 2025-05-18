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
    const updateHeights = () => {
      const top = document.querySelector("#top-navbar");
      const bottom = document.querySelector("#bottom-navbar");

      if (top) setTopNavbarHeight(top.clientHeight);
      else setTopNavbarHeight(0);

      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      else setBottomNavbarHeight(0);
    };

    updateHeights();

    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, []);

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 min-h-screen sm:h-screen p-5 transition-colors duration-300 text-black overflow-auto"
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
