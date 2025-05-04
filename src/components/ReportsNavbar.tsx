"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

const basePath = "/reports";
const menuItems = [
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
];

export default function ReportsNavbar() {
  const pathname = usePathname();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const top = document.querySelector("#top-navbar");

    if (top) setTopNavbarHeight(top.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="reports-navbar"
      className={clsx(
        "fixed flex items-center justify-around px-5 rounded-t-xl w-full bg-white py-2.5 z-10 transition-shadow duration-300",
        {
          "shadow-xl": scrolled,
          "shadow-none": !scrolled,
        }
      )}
      style={{
        top: topNavbarHeight,
      }}
    >
      {menuItems.map((item, index) => {
        const isActive = pathname === item.href;
        const icon = isActive ? item.fillIcon : item.outlineIcon;
        const baseClass =
          "flex flex-row gap-3 items-center justify-center text-base font-medium transition duration-200 ease-in-out rounded-xl py-3 px-4 w-full";

        const activeClass =
          "text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] cursor-default pointer-events-none w-full";
        const inactiveClass = "text-black hover:bg-white/20";

        const content = (
          <div
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <Icon icon={icon} width={24} height={24} />
            <span>{item.name}</span>
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
    </nav>
  );
}
