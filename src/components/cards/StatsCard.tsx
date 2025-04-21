import React from "react";
import { Icon } from "@iconify/react";

interface InfoItem {
  title: string;
  value: string;
}

interface StatCardListProps {
  infoItems: readonly InfoItem[];
  variant: "distance" | "velocity";
}

const VARIANT_MAP = {
  distance: {
    icon: "ri:pin-distance-fill",
    fromColor: "#3BD5FF",
    toColor: "#367AF2",
    borderColor: "#3BD5FF",
  },
  velocity: {
    icon: "material-symbols:speed-rounded",
    fromColor: "#FFD057",
    toColor: "#FF9F1C",
    borderColor: "#FFD057",
  },
};

const StatCardList: React.FC<StatCardListProps> = ({ infoItems, variant }) => {
  const theme = VARIANT_MAP[variant];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-fit">
      {infoItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-2 rounded-2xl border-2"
          style={{
            borderColor: `${theme.borderColor}33`,
            background: `linear-gradient(to bottom right, ${theme.fromColor}1A, ${theme.toColor}1A)`,
          }}
        >
          <div
            className="p-1 rounded-lg shadow-md"
            style={{
              background: `linear-gradient(to bottom right, ${theme.fromColor}, ${theme.toColor})`,
            }}
          >
            <Icon
              icon={theme.icon}
              width={14}
              height={14}
              className="text-white"
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <p className="text-[13px] font-semibold text-black">{item.value}</p>
            <p className="text-[10px] text-black/40">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCardList;
