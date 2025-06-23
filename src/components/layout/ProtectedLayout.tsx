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
  }, [unauthorized, router, localMode, localModeChecked]);

  // Saat loading (belum cek localMode atau user), tampilkan loading spinner
  if (!localModeChecked || isLoading) {
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
