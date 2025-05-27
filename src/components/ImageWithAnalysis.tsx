import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ClipLoader } from "react-spinners";

interface Metadata {
  ultrasonic: number;
  heading?: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  distances?: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity?: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position?: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
}

interface PhotoDetailsProps {
  details: {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata?: Metadata;
  };
  isDark: boolean;
}

function ImageWithAnalysis({ details, isDark }: PhotoDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [obstacle, setObstacle] = useState<null | boolean>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // NEW

  const handleAnalyze = async () => {
    setLoading(true);
    setObstacle(null);
    setError(null); // Reset error
    try {
      const response = await fetch("/api/analyze/obstacle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: details.src }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.data) {
        throw new Error("Invalid response format");
      }

      setObstacle(data.data.obstacle);
      setImageBase64(data.data.image || null);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setObstacle(null);
      setImageBase64(null);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === "string") {
        setError(error);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx(
        "relative md:w-[420px] aspect-[4/3] rounded-xl overflow-hidden border-2",
        isDark ? "border-[#27426C]" : "border-[#DFDFDF]"
      )}
    >
      {/* Gambar */}
      <motion.img
        key={imageBase64 || details.src}
        src={imageBase64 || details.src}
        alt={details.alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Radar scanning effect */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 bg-black/20 z-10 overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-blue-400/40 to-transparent"
              initial={{ y: "-30%" }}
              animate={{ y: "110%" }}
              transition={{
                duration: 1.0,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay analyze */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[15px] px-3 py-2.5 flex justify-between items-center z-20">
        <button
          onClick={handleAnalyze}
          className="flex items-center justify-center bg-blue-600 text-white text-[13px] px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze"}
          {loading ? (
            <ClipLoader size={16} color="#ffffff" className="ml-2" />
          ) : (
            <Icon fontSize={20} icon="tabler:zoom-scan" className="ml-2" />
          )}
        </button>

        {(obstacle !== null || error) && (
          <motion.div
            className="ml-2 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Icon
              icon={
                error
                  ? "line-md:alert-circle"
                  : obstacle
                    ? "line-md:alert-circle-twotone-loop"
                    : "line-md:circle-to-confirm-circle-twotone-transition"
              }
              className={clsx(
                "text-xl",
                error
                  ? "text-yellow-400"
                  : obstacle
                    ? "text-red-400"
                    : "text-green-400"
              )}
            />
            <span
              className={clsx(
                "text-sm",
                error
                  ? "text-yellow-400"
                  : obstacle
                    ? "text-red-400"
                    : "text-green-400"
              )}
            >
              {error
                ? `Error: ${error}`
                : `Obstacle: ${obstacle ? "Yes" : "No"}`}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ImageWithAnalysis;
