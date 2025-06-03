"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import NavMenuDesktop from "./NavMenuDesktop";
import { useToast } from "@/context/ToastProvider";
import Link from "next/link";
import { useMeQuery } from "@/hooks/useMeQuery";
import PopUpConfirmation from "./PopUpConfirmation";
import { AnimatePresence, motion } from "framer-motion";
import { database } from "../firebase/firebase";
import { ref, onValue } from "firebase/database";

export default function TopNavbar() {
  const { isDark, toggleDark } = useDarkMode();
  const [isPopUpLogout, setIsPopUpLogout] = useState(false);
  const { showToast } = useToast();
  const { data: user } = useMeQuery();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [signalStatus, setSignalStatus] = useState<string>("-");
  const [rssiValue, setRssiValue] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ambil currentSession
  useEffect(() => {
    const sessionRef = ref(database, "current_session");
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const session = snapshot.val();
      const sessionNumber =
        typeof session === "number" ? session : Number(session);
      setCurrentSession(isNaN(sessionNumber) ? null : sessionNumber);
    });
    return () => unsubscribe();
  }, []);

  // Ambil RSSI dari session aktif
  useEffect(() => {
    if (currentSession === null) {
      setSignalStatus("-");
      setRssiValue(null);
      return;
    }
    const dbRef = ref(database, `realtime_monitoring/${currentSession}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const value = snapshot.val();
      let latestRssi: number | null = null;
      if (value) {
        const items = Object.values(value) as Array<Record<string, unknown>>;
        const sorted = items.sort((a, b) => {
          const aCreated =
            typeof a.createdAt === "string"
              ? new Date(a.createdAt).getTime()
              : 0;
          const bCreated =
            typeof b.createdAt === "string"
              ? new Date(b.createdAt).getTime()
              : 0;
          return bCreated - aCreated;
        });
        if (sorted.length > 0 && typeof sorted[0].rssi === "number") {
          latestRssi = sorted[0].rssi as number;
        }
      }
      setRssiValue(latestRssi);
      let status = "-";
      if (typeof latestRssi === "number") {
        if (latestRssi >= -60) {
          status = "🟢 Excellent";
        } else if (latestRssi >= -70) {
          status = "🟡 Good";
        } else if (latestRssi >= -80) {
          status = "🟠 Weak";
        } else {
          status = "🔴 Poor — High risk of disconnection";
        }
      }
      setSignalStatus(status);
    });
    return () => unsubscribe();
  }, [currentSession]);

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/login";
    } else {
      alert("Logout failed");
    }
  };

  const handleConfirmLogout = () => {
    handleLogout();
  };

  return (
    <>
      <AnimatePresence>
        {isPopUpLogout && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center"
            style={{ zIndex: 9999 }}
          >
            <motion.div
              key="verify-email"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full inset-0 flex items-center justify-center"
            >
              <PopUpConfirmation
                isOpen={isPopUpLogout}
                onClose={() => setIsPopUpLogout(false)}
                icon="material-symbols:logout-rounded"
                iconColor="text-red-500"
                title="Konfirmasi Keluar"
                titleColor="text-red-500"
                message="Apakah Anda yakin ingin keluar?"
                confirmButtonText="Keluar"
                cancelButtonText="Batal"
                confirmButtonColor="bg-[#fb2c36]"
                cancelButtonColor={isDark ? "bg-[#112133]" : "bg-white"}
                leftToRight={false}
                onConfirm={handleConfirmLogout}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav
        id="top-navbar"
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 p-5 h-[80px] transition-colors duration-300 ${
          isDark ? "bg-[#112133] text-white" : "bg-white text-black"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 w-fit">
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
            className={`font-bold text-2xl ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            RoboGo
          </p>
        </Link>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <NavMenuDesktop />
        </div>

        <div className="flex items-center justify-end gap-3 relative">
          {/* Indikator Sinyal */}
          <div
            className={`flex items-center gap-2.5 select-none px-3 py-2 min-h-12 min-w-12 rounded-xl border transition duration-200 ease-in-out ${
              typeof rssiValue === "number"
                ? rssiValue >= -60
                  ? "bg-green-100 border-green-400"
                  : rssiValue >= -70
                    ? "bg-yellow-100 border-yellow-400"
                    : rssiValue >= -80
                      ? "bg-orange-100 border-orange-400"
                      : "bg-red-100 border-red-400"
                : isDark
                  ? "bg-[#0F1B2D] border-[#367AF2]/30"
                  : "bg-white border-[#367AF2]"
            } ${
              isDark && typeof rssiValue !== "number"
                ? "text-white"
                : "text-black"
            }`}
            title={rssiValue !== null ? `RSSI: ${rssiValue} dBm` : undefined}
          >
            {typeof rssiValue === "number" ? (
              rssiValue >= -60 ? (
                <Icon
                  icon="streamline:wifi-signal-full-remix"
                  className="text-xl text-green-500"
                />
              ) : rssiValue >= -70 ? (
                <Icon
                  icon="streamline:wifi-signal-full-remix"
                  className="text-xl text-yellow-400"
                />
              ) : rssiValue >= -80 ? (
                <Icon
                  icon="streamline:wifi-signal-full-remix"
                  className="text-xl text-orange-400"
                />
              ) : (
                <Icon
                  icon="streamline-ultimate:wifi-alert-attention-bold"
                  className="text-xl text-red-500"
                />
              )
            ) : (
              <Icon
                icon="streamline:wifi-signal-full-remix"
                className={`text-xl ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
            )}
            <span className="hidden sm:block">
              {signalStatus.replace(/^[^ ]+ /, "")}
            </span>
            {rssiValue !== null && (
              <span className="text-xs">({rssiValue} dBm)</span>
            )}
          </div>
          {/* Profile/account dropdown hanya tampil di desktop (sm+) */}
          {user ? (
            <div
              ref={dropdownRef}
              className="w-fit sm:flex flex-col items-end relative hidden"
            >
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-fit flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition duration-200 ease-in-out min-h-12 border cursor-pointer select-none ${
                  isDark
                    ? "bg-[#0F1B2D] border-[#367AF2]/30 text-white"
                    : "bg-white border-[#367AF2] text-black"
                }`}
              >
                <p className="md:block hidden">{user?.name}</p>
                <Icon icon="mage:user-square-fill" fontSize={24} />
              </div>

              {dropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-36 rounded-lg shadow-lg border ${
                    isDark
                      ? "border-gray-700 bg-[#112133] text-white"
                      : "border-gray-300 bg-white text-black"
                  } flex flex-col z-50`}
                >
                  <Link
                    href="/profile"
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors duration-200 hover:${
                      isDark ? "bg-[#367AF2]/30" : "bg-[#367AF2]/20"
                    }`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Icon icon="mdi:account-circle-outline" width={20} />
                    <span>Profile</span>
                  </Link>
                  {/* Tombol darkmode dipindahkan ke dalam menu profile */}
                  <button
                    onClick={() => {
                      toggleDark();
                      showToast(
                        `Theme changed to ${isDark ? "light" : "dark"}!`,
                        "success"
                      );
                    }}
                    className={`flex items-center gap-2 px-4 py-2 transition-colors duration-200 w-full text-left ${
                      isDark
                        ? "hover:bg-[#3BD5FF]/10 text-white"
                        : "hover:bg-[#367AF2]/10 text-black"
                    }`}
                  >
                    <Icon
                      icon={isDark ? "mage:sun-fill" : "mage:moon-fill"}
                      className="text-xl"
                    />
                    <span>{isDark ? "Light" : "Dark"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPopUpLogout(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-b-lg transition-colors duration-200 w-full text-left ${
                      isDark
                        ? "hover:bg-[#fb2c36]/30 text-red-400"
                        : "hover:bg-[#fb2c36]/20 text-red-600"
                    }`}
                  >
                    <Icon icon="mdi:logout" width={20} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="w-fit items-center justify-center gap-2 px-5 py-2.5 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out min-h-12 cursor-pointer sm:flex hidden"
            >
              <p className="md:block hidden">Log In</p>
              <Icon icon="solar:login-3-bold" fontSize={24} />
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
