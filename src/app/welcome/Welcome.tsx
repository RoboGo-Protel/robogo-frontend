'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '@/context/DarkModeContext';

export default function Welcome() {
  const { isDark } = useDarkMode();
  const router = useRouter();
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const [loading, setLoading] = useState(false);
  const [modeChecked, setModeChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cek mode hanya lewat Electron config, bukan localStorage
  useEffect(() => {
    if (!mounted) return;
    const checkMode = async () => {
      if (isElectron && window.electronAPI?.getConfig) {
        const localMode = await window.electronAPI.getConfig('localMode');
        if (localMode === true) {
          // Local mode aktif, reload ke root agar ProtectedLayout detect
          window.location.href = '/';
        } else if (localMode === false) {
          // Online mode, redirect ke login
          router.replace('/login');
        } else {
          // Belum memilih mode, tetap di halaman ini
          setModeChecked(true);
        }
      } else {
        // Non-Electron: selalu arahkan ke login (Online Mode)
        router.replace('/login');
      }
    };
    checkMode();
  }, [router, isElectron, mounted]);
  const handleSelectMode = async (mode: 'online' | 'local') => {
    setLoading(true);
    if (mode === 'local') {
      if (isElectron && window.electronAPI?.setConfig) {
        await window.electronAPI.setConfig('localMode', true);

        // Initialize RoboGo folders when selecting local mode
        try {
          // The Electron main process will handle folder creation automatically
          // when we try to use the APIs for the first time
          console.log(
            '✅ Local mode activated, folders will be initialized automatically',
          );
        } catch (error) {
          console.error('❌ Error setting local mode:', error);
        }
      }
      window.location.href = '/';
    } else {
      if (isElectron && window.electronAPI?.setConfig) {
        await window.electronAPI.setConfig('localMode', false);
      }
      router.replace('/login');
    }
  };

  if (!mounted || (!modeChecked && isElectron)) {
    // Tunggu pengecekan mode selesai sebelum render UI
    return null;
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#0a0e1a] via-[#112133] to-[#1a2332]'
          : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
      }`}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]'></div>
      </div>
      {/* Floating Elements */}
      <div
        className={`absolute top-20 left-10 w-20 h-20 rounded-full blur-xl opacity-30 animate-pulse ${isDark ? 'bg-blue-500' : 'bg-blue-500'}`}
      ></div>
      <div
        className={`absolute bottom-20 right-10 w-32 h-32 rounded-full blur-xl opacity-20 animate-pulse delay-1000 ${isDark ? 'bg-blue-400' : 'bg-blue-400'}`}
      ></div>
      {/* Main Container */}
      <div className='relative z-10 w-full max-w-md mx-auto p-6'>
        <div className='text-center mb-8'>
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${isDark ? 'bg-gradient-to-br from-blue-500 to-blue-400' : 'bg-gradient-to-br from-blue-500 to-blue-400'}`}
          >
            <span className='text-2xl font-bold text-white'>R</span>
          </div>
          <h1
            className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
          >
            Welcome to RoboGo
          </h1>
          <p
            className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Choose how you want to use RoboGo
          </p>
        </div>
        <div
          className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-3xl ${isDark ? 'bg-white/5 border-white/10 shadow-black/20' : 'bg-white/80 border-white/20 shadow-black/5'}`}
        >
          <div className='flex flex-col gap-6'>
            <button
              className='w-full px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 bg-gray-300 text-gray-400 cursor-not-allowed'
              onClick={() => handleSelectMode('online')}
              disabled={true}
            >
              Online Mode (Login/Register) - Disabled
            </button>
            <button
              className={`w-full px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isElectron
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-2 border-blue-400'
                  : 'bg-gray-300 text-gray-400 cursor-not-allowed'
              }`}
              onClick={() => isElectron && handleSelectMode('local')}
              disabled={!isElectron || loading}
            >
              Local Mode / Offline Mode {isElectron ? '' : '(Electron Only)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
