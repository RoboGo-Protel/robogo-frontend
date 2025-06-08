"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useDarkMode } from "@/context/DarkModeContext";
import PopUpConfirmation from "@/components/PopUpConfirmation";
import { useToast } from "@/context/ToastProvider";
import { useMeQuery } from '@/hooks/useMeQuery';

const basePath = '/reports';

const menuItems = [
  {
    label: 'Home',
    href: '/',
    icon: {
      active: 'solar:home-2-bold',
      inactive: 'solar:home-2-linear',
    },
  },
  {
    label: 'Monitoring',
    href: '/monitoring',
    icon: {
      active: 'ph:monitor-play-fill',
      inactive: 'ph:monitor-play',
    },
  },
  {
    label: 'Reports',
    href: basePath,
    icon: {
      active: 'ph:read-cv-logo-fill',
      inactive: 'ph:read-cv-logo',
    },
    children: [
      {
        name: 'Gallery',
        href: `${basePath}/gallery`,
        fillIcon: 'solar:gallery-wide-bold',
        outlineIcon: 'solar:gallery-wide-broken',
      },
      {
        name: 'Ultrasonic Sensor',
        href: `${basePath}/ultrasonic`,
        fillIcon: 'mingcute:remote-fill',
        outlineIcon: 'mingcute:remote-line',
      },
      {
        name: 'MPU-9250 (IMU)',
        href: `${basePath}/imu`,
        fillIcon: 'mynaui:chip-solid',
        outlineIcon: 'mynaui:chip',
      },
      {
        name: 'Paths',
        href: `${basePath}/paths`,
        fillIcon: 'bxs:navigation',
        outlineIcon: 'bx:navigation',
      },
    ],
  },
  {
    label: 'Profile',
    icon: {
      active: 'solar:user-bold',
      inactive: 'solar:user-linear',
    },
    children: [
      {
        name: 'Profile',
        href: '/profile',
        fillIcon: 'solar:user-bold',
        outlineIcon: 'solar:user-linear',
      },
      {
        name: 'Settings',
        href: '/settings',
        fillIcon: 'mdi:cog',
        outlineIcon: 'mdi:cog-outline',
      },
      {
        name: (context: MenuActionContext) =>
          context.isDark ? 'Light Mode' : 'Dark Mode',
        action: (context: MenuActionContext) => {
          context.toggleDark();
          context.showToast(
            `Theme changed to ${context.isDark ? 'light' : 'dark'}!`,
            'success',
          );
        },
        fillIcon: (context: MenuActionContext) =>
          context.isDark ? 'mage:sun-fill' : 'mage:moon-fill',
        outlineIcon: 'solar:settings-linear',
      },
      {
        name: 'Logout',
        action: (context: MenuActionContext) => {
          context.setIsPopUpLogout(true);
        },
        fillIcon: 'mdi:logout',
        outlineIcon: 'mdi:logout',
      },
    ],
  },
];

type MenuActionContext = {
  toggleDark: () => void;
  isDark: boolean;
  showToast: (
    msg: string,
    type?: 'success' | 'error' | 'info' | 'loading',
  ) => void;
  setIsPopUpLogout: (b: boolean) => void;
};

export default function BottomNavbar() {
  const [isPopUpLogout, setIsPopUpLogout] = useState(false);
  const { isDark, toggleDark } = useDarkMode();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  const { data: user, isLoading } = useMeQuery();

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/login';
    } else {
      alert('Logout failed');
    }
  };

  const handleConfirmLogout = () => {
    setIsPopUpLogout(false);
    handleLogout();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  if (isLoading) return null;
  if (!user) return null;

  return (
    <>
      {/* Overlay saat dropdown aktif */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/20 z-40 md:hidden'
            onClick={() => setOpenDropdown(null)}
          />
        )}
      </AnimatePresence>

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
        )}{' '}
      </AnimatePresence>

      <nav id='bottom-navbar' className='fixed bottom-0 left-0 right-0 z-50'>
        {/* Mobile Version */}
        <div
          className={`md:hidden shadow py-1 ${
            isDark ? 'bg-[#182941]' : 'bg-[#e6f5fe]'
          }`}
        >
          <div className='flex justify-around items-center h-14 relative'>
            {menuItems.map((item, index) => {
              const isActive = item.href
                ? item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
                : false;
              const isLastItem = index === menuItems.length - 1;

              if (item.children) {
                return (
                  <div
                    key={item.label}
                    className='flex flex-col items-center text-xs relative'
                    ref={
                      openDropdown === item.label ? dropdownWrapperRef : null
                    }
                  >
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`flex flex-col items-center ${
                        isActive
                          ? 'text-blue-400'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      <Icon
                        icon={isActive ? item.icon.active : item.icon.inactive}
                        width={24}
                        height={24}
                      />
                      <span
                        className={`text-[10px] ${
                          isActive
                            ? 'text-blue-400 font-semibold'
                            : isDark
                              ? 'text-gray-400'
                              : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>

                    {/* Dropup Menu */}
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className={`absolute bottom-16 shadow-xl rounded-xl py-2 px-3 z-50 w-48 space-y-2 ${
                            isLastItem ? '-right-6' : ''
                          } ${isDark ? 'bg-[#182941]' : 'bg-white'}`}
                        >
                          {' '}
                          {item.children.map((child, childIndex) => {
                            const childActive =
                              child.href && pathname === child.href;
                            const childName =
                              typeof child.name === 'function'
                                ? child.name({
                                    toggleDark,
                                    isDark,
                                    showToast,
                                    setIsPopUpLogout,
                                  })
                                : child.name;
                            const childKey =
                              typeof child.name === 'string'
                                ? child.name
                                : `child-${childIndex}`;

                            if (typeof child.href === 'string') {
                              return (
                                <Link
                                  key={childKey}
                                  href={child.href}
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <div
                                    className={`flex items-center gap-2 text-sm p-2 rounded-md transition-all ${
                                      childActive
                                        ? 'text-blue-400 font-semibold'
                                        : isDark
                                          ? 'text-gray-300'
                                          : 'text-gray-700'
                                    } hover:${
                                      isDark ? 'bg-neutral-700' : 'bg-gray-100'
                                    }`}
                                  >
                                    <Icon
                                      icon={
                                        childActive
                                          ? child.fillIcon
                                          : child.outlineIcon
                                      }
                                      width={20}
                                      height={20}
                                    />
                                    <span>{childName}</span>
                                  </div>
                                </Link>
                              );
                            }

                            if (child.action) {
                              return (
                                <button
                                  key={childKey}
                                  type='button'
                                  className={`flex items-center gap-2 text-sm p-2 rounded-md w-full text-left transition-all ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                  } hover:${
                                    isDark ? 'bg-neutral-700' : 'bg-gray-100'
                                  }`}
                                  onClick={() => {
                                    child.action({
                                      toggleDark,
                                      isDark,
                                      showToast,
                                      setIsPopUpLogout,
                                    });
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <Icon
                                    icon={
                                      typeof child.fillIcon === 'function'
                                        ? child.fillIcon({
                                            toggleDark,
                                            isDark,
                                            showToast,
                                            setIsPopUpLogout,
                                          })
                                        : child.outlineIcon
                                    }
                                    width={20}
                                    height={20}
                                  />
                                  <span>{childName}</span>
                                </button>
                              );
                            }
                            return null;
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className='flex flex-col items-center text-xs relative'
                  >
                    <div
                      className={`relative ${
                        isActive
                          ? 'text-blue-400'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      <Icon
                        icon={isActive ? item.icon.active : item.icon.inactive}
                        width={24}
                        height={24}
                      />
                    </div>{' '}
                    <span
                      className={
                        isActive
                          ? 'text-blue-400 font-semibold'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              } else {
                return (
                  <button
                    key={item.label}
                    className='flex flex-col items-center text-xs relative focus:outline-none'
                    type='button'
                    tabIndex={0}
                  >
                    <div
                      className={`relative ${
                        isActive
                          ? 'text-blue-400'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      <Icon
                        icon={isActive ? item.icon.active : item.icon.inactive}
                        width={24}
                        height={24}
                      />
                    </div>
                    <span
                      className={
                        isActive
                          ? 'text-blue-400 font-semibold'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
