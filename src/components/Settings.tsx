'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 40 },
};

export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialCameraUrl?: string;
  onSave?: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  initialCameraUrl = '',
  onSave,
}) => {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const [cameraUrl, setCameraUrl] = useState(initialCameraUrl);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('cameraSourceUrl', cameraUrl);
      showToast('Camera source updated!', 'success');
      if (onSave) onSave(cameraUrl);
      onClose();
    } catch (err) {
      console.error('Failed to save camera source:', err);
      showToast('Failed to save camera source!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCameraUrl(initialCameraUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className='fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-[5px] p-8'
          style={{
            background: isDark ? 'rgba(16,23,38,0.85)' : 'rgba(0,0,0,0.5)',
          }}
        >
          <motion.div
            className={`relative rounded-2xl shadow-2xl p-8 w-full max-w-md border transition-colors ${
              isDark
                ? 'bg-[#18181b] border-[#27272a] text-gray-100'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
            variants={modalVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Close button */}
            <button
              className='absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors'
              onClick={handleCancel}
              aria-label='Close'
              type='button'
              disabled={loading}
            >
              <Icon icon='mdi:close' width={24} height={24} />
            </button>
            <div className='flex items-center mb-4 gap-2.5'>
              <Icon
                icon='mdi:cctv'
                width={32}
                height={32}
                className='text-blue-400'
              />
              <h2 className='text-xl font-bold'>Camera Settings</h2>
            </div>
            <p className='mb-6 text-base text-gray-500 dark:text-gray-300'>
              Enter the camera (stream) source URL you want to use.
            </p>
            <div className='flex flex-col gap-2 mb-8'>
              <label htmlFor='camera-url' className='font-medium text-sm mb-1'>
                Camera Source URL
              </label>
              <input
                id='camera-url'
                type='text'
                className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                  isDark
                    ? 'bg-[#23272f] border-[#2d3748] text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-black placeholder-gray-400'
                } focus:border-blue-400`}
                placeholder='Example: http://192.168.1.100:8080/video'
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className='flex justify-end gap-3'>
              <button
                className={`px-5 py-2 rounded-lg font-medium border transition-colors ${
                  isDark
                    ? 'bg-transparent border-gray-600 text-gray-200 hover:bg-gray-700'
                    : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className='px-5 py-2 rounded-lg font-medium bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white hover:brightness-90 transition-colors'
                onClick={handleSave}
                disabled={loading || !cameraUrl.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Settings;
