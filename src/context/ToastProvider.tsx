"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Icon } from "@iconify/react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastProviderProps = {
  children: React.ReactNode;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center"
    | "top-center"
    | "center";
  toastClassName?: string;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
  children,
  position = "bottom-center",
  toastClassName,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);

  useEffect(() => {
    const updateHeights = () => {
      const bottom = document.querySelector("#bottom-navbar");

      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      else setBottomNavbarHeight(0);
    };

    updateHeights();

    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = uuidv4();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "md:bottom-4 right-4",
    "bottom-left": "md:bottom-4 left-4",
    "bottom-center": "md:bottom-4 left-1/2 transform -translate-x-1/2",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
  };

  const defaultClass = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      case "info":
      default:
        return "bg-blue-600 text-white";
    }
  };

  const iconMap: Record<ToastType, string> = {
    success: "line-md:confirm-circle",
    error: "line-md:alert-circle",
    info: "line-md:info-circle",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={`fixed z-50 w-full flex flex-col items-center space-y-2 ${positionClasses[position]}`}
            style={
              (position === "bottom-center" ||
                position === "bottom-left" ||
                position === "bottom-right") &&
              bottomNavbarHeight > 0
                ? {
                    bottom: bottomNavbarHeight + 16,
                  }
                : undefined
            }
          >
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className={`w-fit mx-4 md:mx-0 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 break-words ${
                    toastClassName || defaultClass(toast.type)
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <Icon icon={iconMap[toast.type]} width={20} height={20} />
                  </div>
                  <span className="text-sm leading-snug">{toast.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
