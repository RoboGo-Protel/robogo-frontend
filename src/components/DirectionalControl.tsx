import { Icon } from "@iconify/react";
import React from "react";

const directions = [
  {
    name: "up",
    icon: "icon-park-solid:up-two",
    className: "row-start-1 col-start-2",
  },
  {
    name: "left",
    icon: "icon-park-solid:left-two",
    className: "row-start-2 col-start-1",
  },
  {
    name: "center",
    icon: "",
    className: "row-start-2 col-start-2",
    isCenter: true,
  },
  {
    name: "right",
    icon: "icon-park-solid:right-two",
    className: "row-start-2 col-start-3",
  },
  {
    name: "down",
    icon: "icon-park-solid:down-two",
    className: "row-start-3 col-start-2",
  },
];

export default function DirectionalControl({
  onDirectionClick,
}: {
  onDirectionClick?: (dir: string) => void;
}) {
  return (
    <div className="grid grid-rows-3 grid-cols-3 gap-x-4 gap-y-1 place-items-center w-fit mx-auto">
      {directions.map((dir) =>
        dir.isCenter ? (
          <div
            key={dir.name}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#E0F3FF] to-[#CFE8FF] shadow-inner ${dir.className}`}
          />
        ) : (
          <button
            key={dir.name}
            onClick={() => onDirectionClick?.(dir.name)}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] flex items-center justify-center shadow-md text-white ${dir.className}`}
          >
            <Icon icon={dir.icon} width={20} height={20} />
          </button>
        )
      )}
    </div>
  );
}
