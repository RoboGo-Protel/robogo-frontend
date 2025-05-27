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

export default function TopNavbar() {
  const { isDark, toggleDark } = useDarkMode();
  const [isPopUpLogout, setIsPopUpLogout] = useState(false);
  const { showToast } = useToast();
  const { data: user } = useMeQuery();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <button
            onClick={() => {
              toggleDark();
              showToast(
                `Theme changed to ${isDark ? "light" : "dark"}!`,
                "success"
              );
            }}
            className={`flex items-center justify-center gap-1 rounded-xl transition duration-200 ease-in-out min-w-12 min-h-12 cursor-pointer px-3 py-2 ${
              isDark
                ? "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white"
                : "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white"
              // Bisa juga sesuaikan warna text jika mau, tapi biar konsisten di sini aku pakai white saja.
            }`}
          >
            <Icon
              icon={isDark ? "mage:sun-fill" : "mage:moon-fill"}
              className="text-2xl"
            />
          </button>

          {user ? (
            <div
              ref={dropdownRef}
              className="w-fit flex flex-col items-end relative"
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
              className="w-fit flex items-center justify-center gap-2 px-5 py-2.5 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out min-h-12 cursor-pointer"
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
