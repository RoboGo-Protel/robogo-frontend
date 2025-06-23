'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastProvider';
import { useMeQuery } from '@/hooks/useMeQuery';
import { truncateProfileName } from '@/utils/nameUtils';

export default function ProfileClient() {
  const { isDark } = useDarkMode();
  const { showToast } = useToast();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMeQuery();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);

  useEffect(() => {
    if (userLoading === false && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const updateHeights = () => {
      const top = document.querySelector('#top-navbar');
      const bottom = document.querySelector('#bottom-navbar');

      if (top) setTopNavbarHeight(top.clientHeight);
      else setTopNavbarHeight(0);

      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      else setBottomNavbarHeight(0);
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        showToast('Logged out successfully', 'success');
        window.location.href = '/login';
      } else {
        showToast('Logout failed', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  };

  if (userLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className='text-center'>
          <Icon
            icon='solar:loading-circle-bold'
            className={`w-8 h-8 animate-spin mx-auto mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#0a0e1a] via-[#112133] to-[#1a2332]'
          : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100'
      }`}
      style={{
        paddingTop: topNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {' '}
      <div className='w-full p-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-3 mb-4'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center'>
              <Icon icon='solar:user-bold' className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Profile
              </h1>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                View your account information
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* User Profile Card */}
          <div
            className={`backdrop-blur-xl rounded-2xl p-6 border shadow-lg ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}
          >
            <div className='text-center'>
              <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Icon icon='solar:user-bold' className='w-10 h-10 text-white' />
              </div>
              {user && (
                <>
                  <h2
                    className={`text-xl font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {truncateProfileName(user.name)}
                  </h2>
                  <p
                    className={`text-sm mb-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {user.email}
                  </p>
                  <div
                    className={`text-xs p-2 rounded-lg ${
                      isDark
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
            <div className='mt-6'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-200'
              >
                <Icon icon='solar:logout-2-bold' className='w-5 h-5' />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Settings Guide Card */}
          <div
            className={`backdrop-blur-xl rounded-2xl p-6 border shadow-lg ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}
          >
            <div className='flex items-center space-x-3 mb-6'>
              <Icon
                icon='solar:settings-bold'
                className='w-6 h-6 text-blue-500'
              />
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Settings & Configuration
              </h3>
            </div>

            <div className='space-y-4'>
              <div
                className={`p-4 rounded-lg border-2 border-dashed ${
                  isDark
                    ? 'border-blue-500/30 bg-blue-900/10'
                    : 'border-blue-300/50 bg-blue-50/50'
                }`}
              >
                <div className='flex items-start space-x-3'>
                  <Icon
                    icon='solar:info-circle-bold'
                    className='w-5 h-5 text-blue-500 mt-0.5'
                  />
                  <div>
                    <h4
                      className={`font-medium mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      Access Settings from Top Navigation
                    </h4>
                    <p
                      className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      Click on your profile avatar in the top navigation bar to
                      access:
                    </p>
                    <ul
                      className={`mt-2 space-y-1 text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <li className='flex items-center space-x-2'>
                        <Icon
                          icon='solar:devices-bold'
                          className='w-4 h-4 text-blue-500'
                        />
                        <span>
                          Profile Settings - Manage devices & assignments
                        </span>
                      </li>
                      <li className='flex items-center space-x-2'>
                        <Icon
                          icon='solar:camera-bold'
                          className='w-4 h-4 text-blue-500'
                        />
                        <span>Camera Settings - Configure camera streams</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='pt-2'>
                <p
                  className={`text-xs text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  All your settings are automatically saved to your account and
                  synchronized across sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
