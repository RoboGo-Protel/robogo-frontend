"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";
import React, { useState, useRef } from "react";

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

export default function NavMenuDesktop() {
  const pathname = usePathname();
  const { isDark } = useDarkMode();
  const [isReportsHovered, setIsReportsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsReportsHovered(true);
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsReportsHovered(false);
    }, 200);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsReportsHovered(true);
  };

  const handleDropdownLeave = () => {
    setIsReportsHovered(false);
  };

  return (
    <div className="hidden sm:flex items-center justify-center w-full h-full">
      <div
        className={`flex items-center gap-4 rounded-full relative ${
          isDark ? "bg-[#17293d]" : "bg-[#e6f5fe]"
        }`}
      >
        {menuItems.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const icon = isActive ? item.icon.active : item.icon.inactive;
          const isReports = item.label === "Reports";
          const hasChildren = !!item.children;

          if (isReports) {
            return (
              <div key={index} className="relative">
                <Link
                  href={item.href}
                  className="relative z-10 flex items-center justify-center"
                  onMouseEnter={handleMenuEnter}
                  onMouseLeave={handleMenuLeave}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] shadow-md"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={`relative flex flex-row gap-2 items-center text-sm px-6 py-3 rounded-full transition-all duration-200 ${
                      isActive
                        ? "text-white font-medium"
                        : isDark
                          ? "text-white hover:bg-white/10"
                          : "text-black hover:bg-black/10"
                    }`}
                  >
                    <Icon icon={icon} width={22} height={22} />
                    <span>{item.label}</span>
                  </div>
                </Link>

                {isReportsHovered && hasChildren && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-full min-w-[220px] rounded-xl shadow-lg z-20 ${
                      isDark ? "bg-gray-800" : "bg-white"
                    }`}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <div className="py-2">
                      {item.children.map((child, childIdx) => {
                        const isChildActive = pathname === child.href;
                        const childIcon = isChildActive
                          ? child.fillIcon
                          : child.outlineIcon;

                        return (
                          <Link
                            href={child.href}
                            key={childIdx}
                            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 ${
                              isChildActive
                                ? "text-blue-500 font-medium"
                                : isDark
                                  ? "text-white hover:bg-white/10"
                                  : "text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            <Icon icon={childIcon} width={20} height={20} />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          }

          return (
            <Link
              href={item.href}
              key={index}
              className="relative z-10 flex items-center justify-center"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] shadow-md"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div
                className={`relative flex flex-row gap-2 items-center text-sm px-6 py-3 rounded-full transition-all duration-200 ${
                  isActive
                    ? "text-white font-medium"
                    : isDark
                      ? "text-white hover:bg-white/10"
                      : "text-black hover:bg-black/10"
                }`}
              >
                <Icon icon={icon} width={22} height={22} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
