import { useState, useEffect } from 'react';

interface OnboardingStatus {
  needsOnboarding: boolean;
  hasConfig: boolean;
  hasDevices: boolean;
  deviceCount: number;
}

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/onboarding-status');

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status');
      }

      const data = await response.json();
      setStatus(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refetch: checkStatus,
  };
}
