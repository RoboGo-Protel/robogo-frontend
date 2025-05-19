"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import React, { useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import NavMenuDesktop from "./NavMenuDesktop";
import { useToast } from "@/context/ToastProvider";

export default function TopNavbar() {
  const { isDark, toggleDark } = useDarkMode();
  const [connected, setConnected] = useState(false);
  const { showToast } = useToast();

  return (
    <nav
      id="top-navbar"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 p-5 h-[80px] transition-colors duration-300 ${
        isDark ? "bg-[#112133] text-white" : "bg-white text-black"
      }`}
    >
      {/* Kiri */}
      <div className="flex items-center gap-2 w-fit">
        {isDark ? (
          <Icon icon="ph:boat-fill" className="text-3xl text-white" />
        ) : (
          <Image
            src="/images/robogo_logo.png"
            alt="Logo"
            width={32}
            height={32}
          />
        )}
        <p
          className={`font-bold text-2xl ${isDark ? "text-white" : "text-black"}`}
        >
          RoboGo
        </p>
      </div>

      {/* Tengah */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <NavMenuDesktop />
      </div>

      {/* Kanan */}
      <div className="flex items-center justify-end gap-3">
        {connected && (
          <div
            className={`flex items-center gap-3 px-4 py-2 border-2 rounded-xl ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="p-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md">
              <Icon
                icon="ic:round-signal-wifi-3-bar"
                className="text-base text-white"
              />
            </div>
            <p
              className={`font-bold text-lg ${isDark ? "text-white" : "text-black"}`}
            >
              88%
            </p>
          </div>
        )}

        <button
          onClick={() => {
            toggleDark();
            showToast(
              `Theme changed to ${isDark ? "light" : "dark"}!`,
              "success"
            );
          }}
          className="flex items-center justify-center gap-1 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out min-w-12 min-h-12 cursor-pointer"
        >
          <Icon
            icon={isDark ? "mage:sun-fill" : "mage:moon-fill"}
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
