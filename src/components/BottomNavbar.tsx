"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  {
    name: "Home",
    href: "/",
    fillIcon: "solar:home-2-bold",
    outlineIcon: "solar:home-2-linear",
  },
  {
    name: "Monitoring",
    href: "/monitoring",
    fillIcon: "ph:monitor-play-fill",
    outlineIcon: "ph:monitor-play",
  },
  {
    name: "Reports",
    href: "/reports",
    fillIcon: "ph:read-cv-logo-fill",
    outlineIcon: "ph:read-cv-logo",
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      id="bottom-navbar"
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around bg-[#e6f5fe] p-5 rounded-t-xl"
    >
      {menuItems.map((item, index) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
            <span className="mt-1">{item.name}</span>
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
