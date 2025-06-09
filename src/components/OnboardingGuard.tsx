'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useMeQuery } from '@/hooks/useMeQuery';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading: userLoading } = useMeQuery();
  const { status, loading: statusLoading } = useOnboardingStatus();
  const { isDark } = useDarkMode();

  const publicRoutes = useMemo(
    () => ['/login', '/register', '/forgot-password', '/reset-password'],
    [],
  );
  const onboardingRoute = '/onboarding';
  useEffect(() => {
    console.log('OnboardingGuard check:', {
      pathname,
      user: !!user,
      userLoading,
      status,
      statusLoading,
      isPublicRoute: publicRoutes.includes(pathname),
      isOnboardingRoute: pathname === onboardingRoute,
    });

    if (
      userLoading ||
      publicRoutes.includes(pathname) ||
      pathname === onboardingRoute
    ) {
      return;
    }

    if (!user) {
      console.log('No user found, staying on current page');
      return;
    }

    if (statusLoading) {
      console.log('Status still loading, waiting...');
      return;
    }

    if (status?.needsOnboarding && pathname !== onboardingRoute) {
      console.log('User needs onboarding, redirecting to onboarding');
      router.replace(onboardingRoute);
      return;
    }

    if (!status?.needsOnboarding && pathname === onboardingRoute) {
      console.log('User completed onboarding, redirecting to home');
      router.replace('/');
      return;
    }

    console.log('OnboardingGuard check complete, no action needed');
  }, [
    user,
    userLoading,
    status,
    statusLoading,
    pathname,
    router,
    publicRoutes,
  ]);

  if (
    user &&
    !publicRoutes.includes(pathname) &&
    pathname !== onboardingRoute &&
    statusLoading
  ) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className='text-center'>
          <Icon
            icon='solar:loading-circle-bold'
            className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
          <p
            className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Checking your setup...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
