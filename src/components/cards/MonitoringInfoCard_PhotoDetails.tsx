"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface InfoItem {
  icon: string;
  value: string;
  title: string;
  status: "normal" | "warning" | "danger";
}

interface MonitoringInfoPhotoDetailsProps<K extends string = string> {
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

function MonitoringInfoPhotoDetails<K extends string = string>({
  infoItems,
  onSelect,
}: MonitoringInfoPhotoDetailsProps<K>) {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex gap-4 w-full">
        {infoItems.map((item, index) => {
          const theme = statusTheme[item.status];
          return (
            <div
              key={index}
              onClick={() => onSelect?.(item.key)}
              className="flex items-center gap-2 p-3 min-w-[180px] rounded-2xl border-2 bg-white w-full"
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
              <div className="flex flex-col items-start justify-center">
                <p className="text-sm font-semibold text-black">{item.value}</p>
                <p className="text-xs text-black/40">{item.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonitoringInfoPhotoDetails;
