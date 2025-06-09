// filepath: g:\Kuliah\Semester 6\Proyek Telematika\RoboGo\Dashboard Website\RoboGo\client\src\hooks\useAuth.ts
import { useEffect, useState } from 'react';

interface AuthToken {
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthToken {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from cookies or session storage
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
        } else {
          throw new Error('Failed to get authentication token');
        }
      } catch (err) {
        console.error('Error getting auth token:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  return { token, loading, error };
}

// Utility function to get headers with auth token
export function getAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
