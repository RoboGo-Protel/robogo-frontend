/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";
import { useToast } from "@/context/ToastProvider";

type RemoveImagePopupProps = {
  id: string;
  imageUrl: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 40 },
};

const RemoveImagePopup: React.FC<RemoveImagePopupProps> = ({
  id,
  imageUrl,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useDarkMode();
  const { promise } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await promise(
        fetch(`/api/reports/gallery/${id}`, {
          method: "DELETE",
        }).then((res) => {
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(
                text || res.statusText || "Failed to delete image"
              );
            });
          }
        }),
        {
          loading: "Removing image...",
          success: "Image removed successfully!",
          error: "Failed to remove image. Please try again.",
        }
      );

      onConfirm();
    } catch (error) {
      console.error("Error removing image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-[5px] p-8 ${
            isDark ? "bg-black/70" : "bg-black/50"
          }`}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
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
              onClick={onCancel}
              aria-label="Close"
              type="button"
              disabled={loading}
            >
              <Icon icon="mdi:close" width={24} height={24} />
            </button>
            <div className="flex items-center mb-4">
              <Icon
                icon="mdi:alert-circle-outline"
                className="text-red-500 mr-3"
                width={32}
                height={32}
              />
              <h2 className="text-xl font-bold">Remove Image</h2>
            </div>
            <img
              src={imageUrl}
              alt="Image to be removed"
              className="w-full h-auto rounded-lg mb-4"
            />
            <p className="mb-8 text-base">
              Are you sure you want to remove this image? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className={`px-5 py-2 rounded-lg font-medium border transition-colors
                  ${
                    isDark
                      ? "bg-transparent border-gray-600 text-gray-200 hover:bg-gray-700"
                      : "bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={handleRemove}
                disabled={loading}
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RemoveImagePopup;
