"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function TopNavbar() {
  const [theme, setTheme] = useState("light");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;

    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      // hanya kalau belum pernah diset
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const fallback = prefersDark ? "dark" : "light";
      setTheme(fallback);
      localStorage.setItem("theme", fallback);
      document.documentElement.setAttribute("data-theme", fallback);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    // 🔥 Broadcast event ke seluruh app
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <nav
      id="top-navbar"
      className={`fixed top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 p-5 h-[80px] transition-colors duration-300
      ${theme === "dark" ? "bg-[#112133] text-white" : "bg-white text-black"}`}
    >
      <div className="flex items-center gap-2 w-fit">
        {theme === "dark" ? (
          <Icon icon="ph:boat-fill" className={`text-3xl text-white`} />
        ) : (
          <Image
            src="/images/robogo_logo.png"
            alt="Logo"
            width={32}
            height={32}
          />
        )}
        <p className="font-bold text-2xl text-[var(--foreground)]">RoboGo</p>
      </div>
      <div className="flex items-center justify-end gap-3">
        {connected && (
          <div
            className={`flex items-center gap-3 px-4 py-2 border-2 rounded-xl ${
              theme === "dark"
                ? "bg-[#314559] border-[#4D647D]"
                : "bg-white border-gray-300"
            }`}
          >
            <div className="p-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
              <Icon
                icon="ic:round-signal-wifi-3-bar"
                className="text-base text-white"
              />
            </div>
            <p className="font-bold text-lg text-[var(--foreground)]">88%</p>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center gap-1 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out min-w-12 min-h-12 cursor-pointer"
        >
          <Icon
            icon={theme === "dark" ? "mage:sun-fill" : "mage:moon-fill"}
            className="text-2xl"
          />
        </button>
        {connected ? (
          <button
            onClick={() => setConnected(!connected)}
            className="w-fit flex items-center justify-center gap-2 px-5 py-2.5 text-white bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] rounded-xl transition duration-200 ease-in-out min-h-12 cursor-pointer"
          >
            <p>Disconnect</p>
            <Icon icon="fluent:plug-disconnected-28-filled" fontSize={24} />
          </button>
        ) : (
          <button
            onClick={() => setConnected(!connected)}
            className="w-fit flex items-center justify-center gap-2 px-5 py-2.5 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out min-h-12 cursor-pointer"
          >
            <p>Connect</p>
            <Icon
              icon="clarity:connect-solid"
              fontSize={24}
              className="-rotate-45"
            />
          </button>
        )}
      </div>
    </nav>
  );
}
