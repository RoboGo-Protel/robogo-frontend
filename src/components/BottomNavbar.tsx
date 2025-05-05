"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

const basePath = "/reports";

const menuItems = [
  {
    label: "Home",
    href: "/",
    icon: {
      active: "solar:home-2-bold",
      inactive: "solar:home-2-linear",
    },
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: {
      active: "ph:monitor-play-fill",
      inactive: "ph:monitor-play",
    },
  },
  {
    label: "Reports",
    href: basePath,
    icon: {
      active: "ph:read-cv-logo-fill",
      inactive: "ph:read-cv-logo",
    },
    children: [
      {
        name: "Gallery",
        href: `${basePath}/gallery`,
        fillIcon: "solar:gallery-wide-bold",
        outlineIcon: "solar:gallery-wide-broken",
      },
      {
        name: "Ultrasonic Sensor",
        href: `${basePath}/ultrasonic`,
        fillIcon: "mingcute:remote-fill",
        outlineIcon: "mingcute:remote-line",
      },
      {
        name: "MPU-9250 (IMU)",
        href: `${basePath}/imu`,
        fillIcon: "mynaui:chip-solid",
        outlineIcon: "mynaui:chip",
      },
      {
        name: "Paths",
        href: `${basePath}/paths`,
        fillIcon: "bxs:navigation",
        outlineIcon: "bx:navigation",
      },
    ],
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <>
      {/* Overlay saat dropdown aktif di mobile */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setOpenDropdown(null)}
          />
        )}
      </AnimatePresence>

      <nav id="bottom-navbar" className="fixed bottom-0 left-0 right-0 z-50">
        {/* Mobile Version */}
        <div className="md:hidden bg-[#e6f5fe] shadow py-1">
          <div className="flex justify-around items-center h-14 relative">
            {menuItems.map((item, index) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const isLastItem = index === menuItems.length - 1;

              if (item.children) {
                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center text-xs relative"
                    ref={dropdownRef}
                  >
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`flex flex-col items-center ${
                        isActive ? "text-[#367AF2]" : "text-gray-500"
                      }`}
                    >
                      <Icon
                        icon={isActive ? item.icon.active : item.icon.inactive}
                        width={24}
                        height={24}
                      />
                      <span
                        className={`${
                          isActive
                            ? "text-[#367AF2] font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>

                    {/* Dropup */}
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className={`absolute bottom-16 bg-white shadow-xl rounded-xl py-2 px-3 z-50 w-48 space-y-2 ${
                            isLastItem ? "-right-6" : ""
                          }`}
                        >
                          {item.children.map((child) => {
                            const childActive = pathname === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setOpenDropdown(null)}
                              >
                                <div
                                  className={`flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-100 transition-all ${
                                    childActive
                                      ? "text-[#367AF2] font-semibold"
                                      : "text-gray-700"
                                  }`}
                                >
                                  <Icon
                                    icon={
                                      childActive
                                        ? child.fillIcon
                                        : child.outlineIcon
                                    }
                                    width={20}
                                    height={20}
                                  />
                                  <span>{child.name}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center text-xs relative"
                >
                  <div
                    className={`relative ${
                      isActive ? "text-[#367AF2]" : "text-gray-500"
                    }`}
                  >
                    <Icon
                      icon={isActive ? item.icon.active : item.icon.inactive}
                      width={24}
                      height={24}
                    />
                  </div>
                  <span
                    className={
                      isActive
                        ? "text-[#367AF2] font-semibold"
                        : "text-gray-500"
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Version */}
        <div className="hidden md:flex items-center justify-around bg-[#e6f5fe] shadow">
          {menuItems.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const icon = isActive ? item.icon.active : item.icon.inactive;
            const baseClass =
              "flex flex-row gap-3 items-center justify-center text-base transition duration-200 ease-in-out py-4 px-6 w-full";
            const activeClass =
              "text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] cursor-default pointer-events-none w-full font-medium";
            const inactiveClass = "text-black hover:bg-white/20";

            const content = (
              <div
                className={`${baseClass} ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                <Icon icon={icon} width={24} height={24} />
                <span className="mt-1">{item.label}</span>
              </div>
            );

            return isActive ? (
              <div key={index} className="w-full">
                {content}
              </div>
            ) : (
              <Link href={item.href} key={index} className="w-full">
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
