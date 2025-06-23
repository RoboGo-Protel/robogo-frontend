'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useMeQuery } from '@/hooks/useMeQuery';
import { SyncLoader } from 'react-spinners';
import { useDarkMode } from '@/context/DarkModeContext';

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const router = useRouter();
  const { data: user, isLoading, unauthorized } = useMeQuery();
  const { isDark } = useDarkMode();
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const [localMode, setLocalMode] = useState<null | boolean>(null);
  const [localModeChecked, setLocalModeChecked] = useState(false);
  const [setupValid, setSetupValid] = useState<boolean>(true);

  // Ambil localMode dari Electron saat mount
  useEffect(() => {
    const checkLocalMode = async () => {
      if (isElectron && window.electronAPI?.getConfig) {
        try {
          const isLocal = await window.electronAPI.getConfig('localMode');
          setLocalMode(typeof isLocal === 'boolean' ? isLocal : null);
        } catch {
          setLocalMode(null);
        }
      } else {
        setLocalMode(false); // default non-electron ke online mode
      }
      setLocalModeChecked(true);
    };
    checkLocalMode();
  }, [isElectron]);

  // Redirect ke /welcome jika localMode belum dipilih (masih null) dan pengecekan sudah selesai
  useEffect(() => {
    if (localModeChecked && localMode === null) {
      router.replace('/welcome');
    }
  }, [localMode, localModeChecked, router]);

  // Redirect ke /login jika mode online & unauthorized
  useEffect(() => {
    if (
      localModeChecked &&
      localMode === false && // online mode
      unauthorized
    ) {
      const callbackUrl = window.location.pathname + window.location.search;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [unauthorized, router, localMode, localModeChecked]); // Periodic check untuk validitas RoboGo setup (folder dan config)
  useEffect(() => {
    if (!isElectron) return;

    const checkSetupValidity = async () => {
      // Only check if document is visible (user is actively using the app)
      if (document.hidden) return;

      try {
        if (window.electronAPI?.checkRoboGoSetupValidity) {
          const isValid = await window.electronAPI.checkRoboGoSetupValidity();
          if (!isValid) {
            console.log('[SETUP] RoboGo setup invalid, redirecting to welcome');
            setSetupValid(false);
            router.replace('/welcome');
          } else {
            setSetupValid(true);
          }
        }
      } catch (error) {
        console.error('[SETUP] Error checking setup validity:', error);
        setSetupValid(false);
        router.replace('/welcome');
      }
    };

    // Check setup validity when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSetupValidity();
      }
    };

    // Initial check
    checkSetupValidity();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check setiap 10 detik (hanya saat tab aktif)
    const interval = setInterval(checkSetupValidity, 10000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isElectron, router]);
  // Saat loading (belum cek localMode atau user), tampilkan loading spinner
  if (!localModeChecked || isLoading || !setupValid) {
    return (
      <div
        className={`flex items-center justify-center h-screen transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#0a0e1a] via-[#112133] to-[#1a2332]'
            : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
        }`}
      >
        <SyncLoader color={isDark ? '#60a5fa' : '#2563eb'} />
      </div>
    );
  }

  // Local mode -> langsung tampilkan konten
  if (localMode) return <>{children}</>;

  // Online mode tapi belum login
  if (!user && unauthorized) {
    return null; // sedang redirect ke /login
  }

  // Logged in
  return <>{children}</>;
};

export default ProtectedLayout;
