import React from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";

const modalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

type PopUpConfirmationProps = {
  isOpen: boolean;
  onClose?: () => void;
  icon?: string;
  iconColor: string;
  title: string;
  titleColor?: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  leftToRight?: boolean;
  onConfirm?: () => void;
  loading?: boolean;
};

export default function PopUpConfirmation({
  isOpen,
  onClose,
  icon = "mdi:alert-circle-outline",
  iconColor,
  title,
  titleColor = "text-gray-900",
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "bg-blue-500",
  cancelButtonColor = "bg-white",
  onConfirm,
  loading = false,
}: PopUpConfirmationProps) {
  const { isDark } = useDarkMode();
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center p-6 text-black`}
          style={{ zIndex: 1000 }}
        >
          <motion.div
            className={`relative rounded-2xl shadow-2xl p-8 w-full max-w-md border transition-colors
              ${
                isDark
                  ? "bg-[#18181b] border-[#27272a] text-gray-100"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
              onClick={handleCancel}
              aria-label="Close"
              type="button"
              disabled={loading}
            >
              <Icon icon="mdi:close" width={24} height={24} />
            </button>

            {/* Icon dan Title */}
            <div className={`flex items-center justify-start mb-4 gap-2.5`}>
              {icon && (
                <Icon
                  icon={icon}
                  width={32}
                  height={32}
                  className={`text-2xl ${iconColor}`}
                />
              )}
              <h2 className={`${titleColor} text-xl font-bold`}>{title}</h2>
            </div>

            {/* Pesan */}
            <p className="mb-8 text-base">{message}</p>

            {/* Tombol aksi */}
            <div className="flex justify-end gap-3">
              <button
                className={`px-5 py-2 rounded-lg font-medium border transition-colors ${cancelButtonColor}
                  ${
                    isDark
                      ? "bg-transparent border-gray-600 text-gray-200 hover:bg-gray-700"
                      : "bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                onClick={handleCancel}
                disabled={loading}
              >
                {cancelButtonText}
              </button>
              <button
                className={`px-5 py-2 rounded-lg font-medium text-white hover:brightness-90 transition-colors ${confirmButtonColor}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Loading..." : confirmButtonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
