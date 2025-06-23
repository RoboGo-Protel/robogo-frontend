import { useState, useEffect, useRef, useCallback } from 'react';

interface OnboardingStatus {
  needsOnboarding: boolean;
  hasConfig: boolean;
  hasDevices: boolean;
  deviceCount: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  const checkStatus = useCallback(
    async (force: boolean = false) => {
      // Jangan fetch jika baru saja fetch dan tidak dipaksa
      const now = Date.now();
      if (
        !force &&
        now - lastFetchTime.current < CACHE_DURATION &&
        status !== null
      ) {
        console.log('useOnboardingStatus: Using cached data');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('useOnboardingStatus: Fetching fresh data...');

        const response = await fetch('/api/user/onboarding-status', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch onboarding status');
        }

        const data = await response.json();
        setStatus(data.data);
        lastFetchTime.current = now;
        console.log('useOnboardingStatus: Data fetched successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    checkStatus(true); // Initial fetch selalu force
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    refetch: () => checkStatus(true), // Manual refetch selalu force
  };
}
