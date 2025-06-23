import {
  useQuery,
  UseQueryOptions,
  QueryFunction,
} from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

/**
 * Custom hook yang mencegah refetch berlebihan saat window focus
 * Berguna untuk data yang tidak perlu di-refresh terlalu sering
 */
export function useStableQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    stableTimeMinutes?: number;
    cacheTimeMinutes?: number;
  },
) {
  const lastFetchTime = useRef<number>(0);
  const isWindowHidden = useRef<boolean>(false);

  // Default stable times
  const staleTime = (options.stableTimeMinutes || 10) * 60 * 1000; // 10 minutes default
  const cacheTime = (options.cacheTimeMinutes || 30) * 60 * 1000; // 30 minutes default

  // Track window visibility to prevent unnecessary fetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      isWindowHidden.current = document.hidden;
      if (!document.hidden) {
        // Only log when window becomes visible, don't trigger refetch
        console.log('Window became visible - using cached data if available');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true,
    });
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const originalQueryFn = options.queryFn as QueryFunction<TData>;

  return useQuery<TData, TError>({
    ...options,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Only refetch if data is truly stale
    refetchInterval: false,
    queryFn: async (...args) => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;

      // If we recently fetched and window was hidden, use cached data
      if (timeSinceLastFetch < staleTime && isWindowHidden.current) {
        console.log(
          'Using cached data due to recent fetch and window visibility change',
        );
        throw new Error('Using cached data');
      }

      lastFetchTime.current = now;
      if (typeof originalQueryFn === 'function') {
        return originalQueryFn(...args);
      }
      throw new Error('No query function provided');
    },
  });
}
