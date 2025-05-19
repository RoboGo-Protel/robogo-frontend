"use client";

import { useDarkMode } from "@/context/DarkModeContext";
import BottomNavbar from "@/components/BottomNavbarMobile";
import TopNavbar from "@/components/TopNavbar";
import ScrollbarStyles from "@/components/ScrollbarStyles";

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDark } = useDarkMode();

  return (
    <div className={isDark ? "dark bg-[#112133] text-white" : "bg-white text-black"}>
      <TopNavbar />
      <main className="min-h-screen flex flex-col">{children}</main>
      <BottomNavbar />
      <ScrollbarStyles />
    </div>
  );
}
