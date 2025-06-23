'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { useDarkMode } from '@/context/DarkModeContext';
import NavMenuDesktop from './NavMenuDesktop';
import { useToast } from '@/context/ToastProvider';
import Link from 'next/link';
import { useMeQuery } from '@/hooks/useMeQuery';
import PopUpConfirmation from './PopUpConfirmation';
import { AnimatePresence, motion } from 'framer-motion';
import { database } from '../firebase/firebase';
import { ref, onValue } from 'firebase/database';
import { useUserConfig } from '@/hooks/useUserConfig';
import { truncateProfileName } from '@/utils/nameUtils';
import { useLocalMode } from '@/context/LocalModeContext';
import { ClipLoader } from 'react-spinners';

export default function TopNavbar() {
  const { isDark, toggleDark } = useDarkMode();
  const [isPopUpLogout, setIsPopUpLogout] = useState(false);
  const { showToast } = useToast();
  const { data: user } = useMeQuery();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Device selector state
  const [deviceSelectorOpen, setDeviceSelectorOpen] = useState(false);
  const deviceSelectorRef = useRef<HTMLDivElement>(null);
  const {
    selectedDevice,
    userDevices,
    updateSelectedDevice,
    loading: deviceLoading,
  } = useUserConfig();
  const [rssiValue, setRssiValue] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<number | null>(null); // ESP32 Connection State
  const {
    isConnected,
    connectToSerial,
    disconnectSerial,
    connectedPort,
    injectTestData,
    localData,
  } = useLocalMode();
  // Test data injection function - now uses LocalModeContext
  const handleInjectTestData = () => {
    if (!isElectron) {
      showToast(
        'Test data feature is only available in Electron app.',
        'error',
      );
      return;
    }

    try {
      injectTestData();
      showToast('Test data injected!', 'success');
    } catch (error) {
      console.error('Error injecting test data:', error);
      showToast('Failed to inject test data', 'error');
    }
  };

  // Debug: Log connection state changes
  useEffect(() => {
    console.log(
      `[TopNavbar] Connection state changed - isConnected: ${isConnected}, connectedPort: ${connectedPort}`,
    );
  }, [isConnected, connectedPort]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<
    {
      path: string;
      manufacturer: string;
      vendorId?: string;
      productId?: string;
      serialNumber?: string;
    }[]
  >([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        deviceSelectorRef.current &&
        !deviceSelectorRef.current.contains(event.target as Node)
      ) {
        setDeviceSelectorOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    if (!user?.id || !selectedDevice?.id) {
      setCurrentSession(null);
      return;
    }

    const sessionRef = ref(
      database,
      `users/${user.id}/${selectedDevice.id}/current_session`,
    );
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const session = snapshot.val();
      const sessionNumber =
        typeof session === 'number' ? session : Number(session);
      setCurrentSession(isNaN(sessionNumber) ? null : sessionNumber);
    });
    return () => unsubscribe();
  }, [user?.id, selectedDevice?.id]);

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/login';
    } else {
      alert('Logout failed');
    }
  };
  const handleConfirmLogout = () => {
    handleLogout();
  };

  // ESP32 Connection Functions
  const getAvailablePorts = async () => {
    if (!isElectron) {
      showToast('This feature is only available in Electron app.', 'error');
      return;
    }

    try {
      const ports = await window.electronAPI!.getSerialPorts();
      setAvailablePorts(ports);
      if (ports.length === 0) {
        // If no filtered ports found, try to get all ports
        const allPorts = await window.electronAPI!.getAllSerialPorts();
        if (allPorts.length > 0) {
          setAvailablePorts(allPorts);
          setShowConnectModal(true);
          showToast(
            `Auto-filter found no ESP32. Showing all ports (${allPorts.length} ports).`,
            'error',
          );
        } else {
          showToast(
            'No serial ports detected. Make sure ESP32 is connected.',
            'error',
          );
        }
      } else {
        setShowConnectModal(true);
      }
    } catch (error) {
      console.error('Error getting serial ports:', error);
      showToast('Failed to get serial ports list.', 'error');
    }
  };
  const connectToSerialPort = async () => {
    if (!selectedPort) {
      showToast('Please select a port first.', 'error');
      return;
    }

    try {
      console.log(`[TopNavbar] Starting connection to ${selectedPort}`);
      setIsConnecting(true);
      const success = await connectToSerial(selectedPort);
      console.log(`[TopNavbar] Connection result: ${success}`);

      if (success) {
        setShowConnectModal(false);
        showToast(`Connected to ESP32 on ${selectedPort}`, 'success');
        // Keep the selected port info for display, don't clear it
        // setSelectedPort(''); // Remove this line

        // Small delay to ensure state updates properly
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(
          `[TopNavbar] After delay - isConnected: ${isConnected}, connectedPort: ${connectedPort}`,
        );
      } else {
        showToast('Failed to connect to ESP32.', 'error');
      }
    } catch (error) {
      console.error('Error connecting to serial port:', error);
      showToast('Failed to connect to serial port.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromSerialPort = async () => {
    try {
      await disconnectSerial();
      setSelectedPort('');
      showToast('Disconnected from ESP32', 'success');
    } catch (error) {
      console.error('Error disconnecting from serial port:', error);
      showToast('Error disconnecting from serial port.', 'error');
    }
  };

  const handleConnectClick = () => {
    if (isConnected) {
      disconnectFromSerialPort();
    } else {
      getAvailablePorts();
    }
  };

  // Local Mode/Offline Mode detection
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const [localMode, setLocalMode] = useState<null | boolean>(null);

  useEffect(() => {
    const checkLocalMode = async () => {
      if (isElectron && window.electronAPI?.getConfig) {
        const mode = await window.electronAPI.getConfig('localMode');
        setLocalMode(typeof mode === 'boolean' ? mode : null);
      } else {
        setLocalMode(false);
      }
    };
    checkLocalMode();
  }, [isElectron]);
  // Guest user object for Local/Offline Mode
  const userGuest = localMode ? { name: 'Guest', id: 'guest' } : null;
  const effectiveUser = user || userGuest; // Handle RSSI from local serial data in local mode
  useEffect(() => {
    if (localMode && localData?.rssi !== undefined) {
      setRssiValue(localData.rssi);
    } else if (localMode && (!localData || localData.rssi === undefined)) {
      // In local mode but no RSSI data available
      setRssiValue(null);
    }
  }, [localMode, localData]);
  // Handle RSSI from Firebase in online mode
  useEffect(() => {
    // Skip Firebase RSSI in local mode
    if (localMode) return;

    if (currentSession === null || !user?.id || !selectedDevice?.id) {
      setRssiValue(null);
      return;
    }

    const dbRef = ref(
      database,
      `users/${user.id}/${selectedDevice.id}/realtime_monitoring/${currentSession}`,
    );
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const value = snapshot.val();
      let latestRssi: number | null = null;
      if (value) {
        const items = Object.values(value) as Array<Record<string, unknown>>;
        const sorted = items.sort((a, b) => {
          const aCreated =
            typeof a.createdAt === 'string'
              ? new Date(a.createdAt).getTime()
              : 0;
          const bCreated =
            typeof b.createdAt === 'string'
              ? new Date(b.createdAt).getTime()
              : 0;
          return bCreated - aCreated;
        });
        if (sorted.length > 0 && typeof sorted[0].rssi === 'number') {
          latestRssi = sorted[0].rssi as number;
        }
      }
      setRssiValue(latestRssi);
    });
    return () => unsubscribe();
  }, [currentSession, user?.id, selectedDevice?.id, localMode]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Synchronize selectedPort with connectedPort from context
  useEffect(() => {
    // Only sync when connection status changes, not when user manually selects
    if (isConnected && connectedPort) {
      // When connected, sync with the actual connected port
      setSelectedPort(connectedPort);
    } else if (!isConnected) {
      // When disconnected, clear selection only if we're not in the middle of connecting
      if (!isConnecting) {
        setSelectedPort('');
      }
    }
  }, [connectedPort, isConnected, isConnecting]);

  return (
    <>
      <AnimatePresence>
        {isPopUpLogout && (
          <div
            className='fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center'
            style={{ zIndex: 9999 }}
          >
            <motion.div
              key='verify-email'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className='w-full h-full inset-0 flex items-center justify-center'
            >
              <PopUpConfirmation
                isOpen={isPopUpLogout}
                onClose={() => setIsPopUpLogout(false)}
                icon='material-symbols:logout-rounded'
                iconColor='text-red-500'
                title='Konfirmasi Keluar'
                titleColor='text-red-500'
                message='Apakah Anda yakin ingin keluar?'
                confirmButtonText='Keluar'
                cancelButtonText='Batal'
                confirmButtonColor='bg-[#fb2c36]'
                cancelButtonColor={isDark ? 'bg-[#112133]' : 'bg-white'}
                leftToRight={false}
                onConfirm={handleConfirmLogout}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav
        id='top-navbar'
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 p-5 h-[80px] transition-colors duration-300 ${
          isDark ? 'bg-[#112133] text-white' : 'bg-white text-black'
        }`}
      >
        <Link href='/' className='flex items-center gap-2 w-fit'>
          {isDark ? (
            <Icon icon='ph:boat-fill' className='text-3xl text-white' />
          ) : (
            <Image
              src='/images/robogo_logo.png'
              alt='Logo'
              width={32}
              height={32}
            />
          )}
          <p
            className={`font-bold text-2xl ${
              isDark
                ? 'text-white'
                : 'text-transparent bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text'
            }`}
          >
            RoboGo
          </p>
        </Link>{' '}
        {/* Only show navigation menu if user is authenticated or in local mode */}
        {effectiveUser && (
          <div className='absolute left-1/2 transform -translate-x-1/2'>
            <NavMenuDesktop />
          </div>
        )}{' '}
        <div className='flex items-center justify-end gap-3 relative'>
          {' '}
          {/* Signal indicator - only show when user is authenticated or in local mode */}
          {effectiveUser && (
            <div
              className={`flex items-center gap-2 select-none px-3 py-2 min-h-12 min-w-12 rounded-xl border transition duration-200 ease-in-out ${
                isDark
                  ? 'bg-[#0F1B2D] border-blue-400/30 text-white'
                  : 'bg-white border-gray-300 text-black'
              }`}
              title={rssiValue !== null ? `RSSI: ${rssiValue} dBm` : undefined}
            >
              {' '}
              {typeof rssiValue === 'number' ? (
                <Icon
                  icon='streamline:wifi-signal-full-remix'
                  className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                />
              ) : (
                <Icon
                  icon='streamline:wifi-signal-full-remix'
                  className={`text-xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                />
              )}
              {rssiValue !== null && (
                <span className='text-xs hidden sm:block'>{rssiValue} dBm</span>
              )}
            </div>
          )}
          {/* Device Selector - only show when user is authenticated and has devices */}
          {effectiveUser && userDevices.length > 0 && (
            <div ref={deviceSelectorRef} className='relative'>
              <div
                onClick={() => setDeviceSelectorOpen(!deviceSelectorOpen)}
                className={`flex items-center gap-2 px-3 py-2 min-h-12 rounded-xl border transition duration-200 ease-in-out cursor-pointer select-none ${
                  isDark
                    ? 'bg-[#0F1B2D] border-blue-400/30 text-white hover:bg-[#1a2332]'
                    : 'bg-white border-blue-400 text-black hover:bg-gray-50'
                }`}
                title={
                  selectedDevice
                    ? `Currently selected: ${selectedDevice.deviceName}`
                    : 'Select a device'
                }
              >
                <Icon icon='material-symbols:devices' className='text-lg' />
                <span className='hidden md:block text-sm'>
                  {deviceLoading
                    ? 'Loading...'
                    : selectedDevice
                      ? selectedDevice.deviceName
                      : 'Select Device'}
                </span>
                <Icon
                  icon={
                    deviceSelectorOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'
                  }
                  className='text-sm'
                />
              </div>

              {deviceSelectorOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border ${
                    isDark
                      ? 'border-gray-700 bg-[#112133] text-white'
                      : 'border-gray-300 bg-white text-black'
                  } flex flex-col z-50 max-h-60 overflow-y-auto`}
                >
                  {userDevices.map((device) => (
                    <div
                      key={device.id}
                      onClick={async () => {
                        // Close dropdown immediately for better UX
                        setDeviceSelectorOpen(false);

                        // Reset signal status while switching
                        setRssiValue(null);
                        setCurrentSession(null);

                        try {
                          const success = await updateSelectedDevice(device.id);
                          if (success) {
                            showToast(
                              `Device switched to ${device.deviceName}`,
                              'success',
                            );

                            // Force a small delay to ensure all state updates propagate
                            await new Promise((resolve) =>
                              setTimeout(resolve, 200),
                            );

                            // Manually trigger a re-render by updating a state that forces components to remount
                            console.log(
                              `Device switch completed for: ${device.deviceName}`,
                            );
                          } else {
                            showToast('Failed to switch device', 'error');
                          }
                        } catch (error) {
                          console.error('Device switch error:', error);
                          showToast('Error switching device', 'error');
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 cursor-pointer ${
                        selectedDevice?.id === device.id
                          ? isDark
                            ? 'bg-blue-600/20 border-l-4 border-blue-400'
                            : 'bg-blue-100 border-l-4 border-blue-500'
                          : isDark
                            ? 'hover:bg-blue-400/10'
                            : 'hover:bg-blue-50'
                      } ${userDevices.indexOf(device) === 0 ? 'rounded-t-lg' : ''} ${
                        userDevices.indexOf(device) === userDevices.length - 1
                          ? 'rounded-b-lg'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          device.status === 'online'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <div className='flex-1'>
                        <div className='text-sm font-medium'>
                          {device.deviceName}
                        </div>
                        <div
                          className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {device.status === 'ON' ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      {selectedDevice?.id === device.id && (
                        <Icon
                          icon='mdi:check'
                          className='text-blue-500 text-lg'
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}{' '}
          {/* Connect Button - only show when user is authenticated or in local mode */}
          {effectiveUser && isElectron && (
            <>
              {/* Test Data Button */}
              <button
                onClick={handleInjectTestData}
                className={`flex items-center gap-2 px-4 py-2 min-h-12 rounded-xl border transition duration-200 ease-in-out ${
                  isDark
                    ? 'bg-[#0F1B2D] border-orange-400/30 text-orange-400 hover:bg-orange-400/10'
                    : 'bg-white border-orange-400 text-orange-600 hover:bg-orange-50'
                }`}
                title='Inject test data for development'
              >
                <Icon icon='mdi:test-tube' className='text-lg' />
                <span className='hidden md:block text-sm font-medium'>
                  Test Data
                </span>
              </button>

              {/* Connect Button */}
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className={`flex items-center gap-2 px-4 py-2 min-h-12 rounded-xl border transition duration-200 ease-in-out ${
                  isConnected
                    ? isDark
                      ? 'bg-red-900/20 border-red-400/30 text-red-400 hover:bg-red-400/10'
                      : 'bg-red-50 border-red-400 text-red-600 hover:bg-red-100'
                    : isDark
                      ? 'bg-[#0F1B2D] border-green-400/30 text-green-400 hover:bg-green-400/10'
                      : 'bg-white border-green-400 text-green-600 hover:bg-green-50'
                } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={
                  isConnected
                    ? `Disconnect ESP32 from ${connectedPort || 'port'}`
                    : 'Connect to ESP32'
                }
              >
                {isConnecting ? (
                  <ClipLoader size={16} color='currentColor' />
                ) : (
                  <Icon
                    icon={
                      isConnected
                        ? 'material-symbols:cast-connected'
                        : 'material-symbols:cast'
                    }
                    className='text-lg'
                  />
                )}{' '}
                <span className='hidden md:block text-sm font-medium'>
                  {isConnecting
                    ? 'Connecting...'
                    : isConnected
                      ? `Disconnect ${connectedPort || 'ESP32'}`
                      : 'Connect'}
                </span>
                {isConnected && (
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                )}
              </button>
            </>
          )}
          {/* Profile/account dropdown hanya tampil di desktop (sm+) */}
          {effectiveUser ? (
            <div
              ref={dropdownRef}
              className='w-fit sm:flex flex-col items-end relative hidden'
            >
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-fit flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition duration-200 ease-in-out min-h-12 border cursor-pointer select-none ${
                  isDark
                    ? 'bg-[#0F1B2D] border-blue-400/30 text-white'
                    : 'bg-white border-blue-400 text-black'
                }`}
              >
                <p className='md:block hidden'>
                  {truncateProfileName(effectiveUser?.name)}
                </p>
                <Icon icon='mage:user-square-fill' fontSize={24} />
              </div>
              {dropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-36 rounded-lg shadow-lg border ${
                    isDark
                      ? 'border-gray-700 bg-[#112133] text-white'
                      : 'border-gray-300 bg-white text-black'
                  } flex flex-col z-50`}
                >
                  {/* Profile & Settings: hide Profile for Guest */}
                  {user && !localMode && (
                    <Link
                      href='/profile'
                      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors duration-200 hover:${
                        isDark ? 'bg-blue-400/30' : 'bg-blue-400/20'
                      }`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Icon icon='mdi:account-circle-outline' width={20} />
                      <span>Profile</span>
                    </Link>
                  )}
                  <Link
                    href='/settings'
                    className={`flex items-center gap-2 px-4 py-2 transition-colors duration-200 hover:${
                      isDark ? 'bg-blue-400/30' : 'bg-blue-400/20'
                    }`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Icon icon='mdi:cog-outline' width={20} />
                    <span>Settings</span>
                  </Link>
                  {/* Tombol darkmode tetap tampil */}
                  <button
                    onClick={() => {
                      toggleDark();
                      showToast(
                        `Theme changed to ${isDark ? 'light' : 'dark'}!`,
                        'success',
                      );
                    }}
                    className={`flex items-center gap-2 px-4 py-2 transition-colors duration-200 w-full text-left ${
                      isDark
                        ? 'hover:bg-blue-500/10 text-white'
                        : 'hover:bg-blue-400/10 text-black'
                    }`}
                  >
                    <Icon
                      icon={isDark ? 'mage:sun-fill' : 'mage:moon-fill'}
                      className='text-xl'
                    />
                    <span>{isDark ? 'Light' : 'Dark'}</span>
                  </button>
                  {/* Logout hanya jika user login */}
                  {user && !localMode && (
                    <button
                      onClick={() => {
                        setIsPopUpLogout(true);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-b-lg transition-colors duration-200 w-full text-left ${
                        isDark
                          ? 'hover:bg-[#fb2c36]/30 text-red-400'
                          : 'hover:bg-[#fb2c36]/20 text-red-600'
                      }`}
                    >
                      <Icon icon='mdi:logout' width={20} />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              )}{' '}
            </div>
          ) : null}
        </div>
        {/* Mobile: Menu button with dropdown */}
        <div className='relative sm:hidden'>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition duration-200 ease-in-out ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label='Menu'
          >
            <Icon
              icon={
                mobileMenuOpen
                  ? 'solar:close-circle-bold'
                  : 'solar:hamburger-menu-bold'
              }
              fontSize={20}
            />
          </button>

          {mobileMenuOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border ${
                isDark
                  ? 'border-gray-700 bg-[#112133] text-white'
                  : 'border-gray-300 bg-white text-black'
              } flex flex-col z-50 overflow-hidden`}
            >
              {user && !localMode ? (
                <>
                  <Link
                    href='/login'
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:${
                      isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon
                      icon='solar:login-3-bold'
                      width={20}
                      className='text-blue-500'
                    />
                    <span>Login</span>
                  </Link>
                  <Link
                    href='/register'
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:${
                      isDark ? 'bg-blue-400/20' : 'bg-blue-400/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon
                      icon='solar:user-plus-bold'
                      width={20}
                      className='text-blue-400'
                    />
                    <span>Register</span>
                  </Link>
                  <div
                    className={`h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mx-2`}
                  ></div>
                  <button
                    onClick={() => {
                      toggleDark();
                      setMobileMenuOpen(false);
                      showToast(
                        `Theme changed to ${isDark ? 'light' : 'dark'}!`,
                        'success',
                      );
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                    type='button'
                  >
                    <Icon
                      icon={isDark ? 'solar:sun-bold' : 'solar:moon-bold'}
                      width={20}
                      className={isDark ? 'text-yellow-500' : 'text-blue-600'}
                    />
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </>
              ) : effectiveUser ? (
                <>
                  <div className='flex items-center gap-3 px-4 py-3 font-semibold'>
                    <Icon icon='mage:user-square-fill' width={20} />
                    <span>Guest</span>
                  </div>
                  <Link
                    href='/settings'
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:${
                      isDark ? 'bg-blue-400/20' : 'bg-blue-400/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon icon='mdi:cog-outline' width={20} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      toggleDark();
                      setMobileMenuOpen(false);
                      showToast(
                        `Theme changed to ${isDark ? 'light' : 'dark'}!`,
                        'success',
                      );
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                    type='button'
                  >
                    <Icon
                      icon={isDark ? 'solar:sun-bold' : 'solar:moon-bold'}
                      width={20}
                      className={isDark ? 'text-yellow-500' : 'text-blue-600'}
                    />
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>{' '}
      </nav>

      {/* ESP32 Connection Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`w-full max-w-md rounded-2xl p-6 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl max-h-[80vh] overflow-hidden flex flex-col`}
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Modal Header */}
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center space-x-3'>
                  <Icon icon='mdi:usb-port' className='w-6 h-6 text-blue-500' />
                  <h3
                    className={`text-xl font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Connect ESP32
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedPort('');
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon icon='solar:close-bold' className='w-5 h-5' />
                </button>
              </div>

              <div className='flex items-center justify-between mb-4'>
                <p
                  className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Select ESP32 Serial Port
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {availablePorts.length} available
                </span>
              </div>

              {/* Port List */}
              <div className='flex-1 overflow-y-auto mb-6'>
                {availablePorts.length > 0 ? (
                  <div className='space-y-2'>
                    {availablePorts.map((port, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPort(port.path)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                          selectedPort === port.path
                            ? isDark
                              ? 'bg-blue-900/40 border-blue-500/50 shadow-sm'
                              : 'bg-blue-50 border-blue-300/50 shadow-sm'
                            : isDark
                              ? 'hover:bg-gray-700/50 border-gray-600'
                              : 'hover:bg-gray-100/50 border-gray-200'
                        }`}
                      >
                        {/* Custom Radio Button */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            selectedPort === port.path
                              ? 'border-blue-500 bg-blue-500'
                              : isDark
                                ? 'border-gray-500'
                                : 'border-gray-300'
                          }`}
                        >
                          {selectedPort === port.path && (
                            <div className='w-2 h-2 rounded-full bg-white'></div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`text-sm font-medium ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {port.path}
                            </span>
                            {port.path.toLowerCase().includes('com8') && (
                              <span className='text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full'>
                                Recommended
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs truncate ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {port.manufacturer || 'Unknown Manufacturer'}
                            {port.vendorId && ` • VID: ${port.vendorId}`}
                            {port.productId && ` • PID: ${port.productId}`}
                          </div>{' '}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Icon
                      icon='mdi:usb-port'
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      No ESP32 ports found
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className='flex items-center gap-3'>
                <button
                  onClick={connectToSerialPort}
                  disabled={!selectedPort || isConnecting}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    !selectedPort || isConnecting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white'
                  }`}
                >
                  {isConnecting ? (
                    <div className='flex items-center justify-center gap-2'>
                      <ClipLoader size={16} color='#ffffff' />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedPort('');
                  }}
                  className={`px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={getAvailablePorts}
                  className={`px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title='Refresh ports'
                >
                  <Icon icon='mdi:refresh' className='w-5 h-5' />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
