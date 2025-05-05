/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { infoItems } from "@/utils/info";
import { motion, AnimatePresence } from "framer-motion";
import ShortInfo from "@/components/cards/ShortInfoCard";

export default function RightArea_Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [deviceCamera, setDeviceCamera] = useState("None");
  const [isStreamActive, setIsStreamActive] = useState(false);

  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectSocket = () => {
      socket = new WebSocket("ws://localhost:3001/ws");

      socket.onopen = () => {
        console.log("🔌 WebSocket Connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "frame") {
            setImageSrc(message.data);
            setIsStreamActive(true);
            lastFrameTimeRef.current = Date.now();
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        console.warn("⚠️ WebSocket closed, retrying in 3s...");
        setIsStreamActive(false);
        reconnectTimer = setTimeout(connectSocket, 3000);
      };
    };

    connectSocket();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFrame = now - lastFrameTimeRef.current;

      if (timeSinceLastFrame > 5000) {
        setIsStreamActive(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:3001/info")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFps(data.fps);
            const [w, h] = data.resolution.split("x").map(Number);
            setResolution({ width: w, height: h });
            setDeviceCamera(data.device);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-start justify-start min-w-[450px] h-full gap-4 border-2 border-[#ECECEC] rounded-xl p-5">
      <div className="flex flex-col items-center justify-center w-full gap-4">
        <h1 className="text-2xl font-bold">RoboGo G1</h1>
        <Image
          src="/images/robogo_g1.png"
          alt="RoboGo G1"
          width={180}
          height={180}
        />
      </div>

      <ShortInfo infoItems={infoItems} />

      <div className="h-full w-full rounded-2xl flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {isStreamActive ? (
            <motion.div
              key="stream-on"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full rounded-2xl relative flex items-center justify-center"
            >
              <div className="absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full">
                <div className="font-semibold flex flex-row items-center gap-2 text-white p-2.5">
                  <p>{deviceCamera}</p>
                  <Icon icon="fluent:video-24-filled" width={20} height={20} />
                </div>
              </div>

              <div className="absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${resolution.width}x${resolution.height}-${fps}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="text-white p-2.5"
                  >
                    {resolution.height}P | {fps}
                  </motion.p>
                </AnimatePresence>

                <button
                  onClick={() => setFlashOn(!flashOn)}
                  type="button"
                  aria-label="Flash"
                  title="Flash"
                  className={`${
                    flashOn
                      ? "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]"
                      : "bg-white/20"
                  } text-white text-sm font-semibold p-2.5 rounded-xl shadow-md hover:bg-[#285ec9] transition-all`}
                >
                  <Icon icon="fluent:flash-32-filled" width={20} height={20} />
                </button>
              </div>

              <img
                src={imageSrc!}
                alt="Live Camera Stream"
                className="rounded-2xl w-auto h-full object-cover"
              />
            </motion.div>
          ) : (
            <motion.div
              key="stream-off"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2.5 p-4 items-center justify-center bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 w-full h-full rounded-2xl border-2 border-[#3BD5FF]/20"
            >
              <div className="p-2 rounded-xl shadow-md bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]">
                <Icon
                  icon="fluent:video-off-24-filled"
                  width={28}
                  height={28}
                  className="text-white"
                />
              </div>
              <p className="font-semibold text-lg bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text">
                Video Stream Unavailable!
              </p>
              <div className="flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-full text-white text-sm text-center">
                Please check RoboGo connection or camera stream.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
