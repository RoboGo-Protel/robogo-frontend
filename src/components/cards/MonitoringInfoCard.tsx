"use client";

import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion, useMotionValue } from "framer-motion";

interface InfoItem {
  icon: string;
  value: string;
  title: string;
  status: "normal" | "warning" | "danger";
}

interface MonitoringInfoProps<K extends string = string> {
  infoItems: readonly (InfoItem & { key: K })[];
  onSelect?: (key: K) => void;
}

const statusTheme = {
  normal: {
    borderColor: "#3BD5FF",
    fromColor: "#3BD5FF",
    toColor: "#367AF2",
  },
  warning: {
    borderColor: "#facc15",
    fromColor: "#FF9800",
    toColor: "#FFC107",
  },
  danger: {
    borderColor: "#ef4444",
    fromColor: "#FF9799",
    toColor: "#EB0C0F",
  },
};

function MonitoringInfo<K extends string = string>({
  infoItems,
  onSelect,
}: MonitoringInfoProps<K>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });
  const x = useMotionValue(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const scrollWidth = wrapper.scrollWidth;
      const clientWidth = wrapper.clientWidth;

      const gapSize = 16;
      const sidePadding = 10;

      const maxDrag = scrollWidth - clientWidth + sidePadding + gapSize;
      setDragBounds({
        left: -maxDrag,
        right: 0,
      });
    }
  }, [infoItems]);

  return (
    <div ref={wrapperRef} className="relative w-full overflow-hidden pr-6">
      <motion.div
        className="flex gap-4 w-full cursor-grab active:cursor-grabbing none"
        drag="x"
        dragConstraints={dragBounds}
        dragElastic={0.1}
        style={{ x }}
      >
        {infoItems.map((item, index) => {
          const theme = statusTheme[item.status];
          return (
            <div
              key={index}
              onClick={() => onSelect?.(item.key)}
              className={`shrink-0 flex items-center gap-2 p-3 min-w-[180px] rounded-2xl border-2 bg-white`}
              style={{
                borderColor: `${theme.borderColor}33`,
                background: `linear-gradient(to bottom right, ${theme.fromColor}1A, ${theme.toColor}1A)`,
              }}
            >
              <div
                className="p-2 rounded-lg shadow-md"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.fromColor}, ${theme.toColor})`,
                }}
              >
                <Icon
                  icon={item.icon}
                  width={20}
                  height={20}
                  className="text-white"
                />
              </div>
              <div className="flex flex-col items-start justify-center text-nowrap">
                <p className="text-sm font-semibold text-black">{item.value}</p>
                <p className="text-xs text-black/40">{item.title}</p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default MonitoringInfo;
