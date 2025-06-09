'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';

interface ExtendedSession extends Session {
  accessToken?: string;
}

export default function AuthCookieSetter() {
  const { data: session, status } = useSession();
  const [cookieSet, setCookieSet] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const extendedSession = session as ExtendedSession;

  useEffect(() => {
    const setCookie = async () => {
      console.log('AuthCookieSetter status:', status);
      console.log('AuthCookieSetter session:', !!session);
      console.log(
        'AuthCookieSetter accessToken:',
        !!extendedSession?.accessToken,
      );
      console.log('AuthCookieSetter cookieSet:', cookieSet);
      console.log('AuthCookieSetter attempts:', attempts);

      if (
        status === 'authenticated' &&
        extendedSession?.accessToken &&
        !cookieSet &&
        attempts < 3
      ) {
        console.log('Attempting to set auth cookie from session...');
        setAttempts((prev) => prev + 1);

        try {
          const response = await fetch('/api/auth/set-cookie', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();
          console.log('Set cookie result:', result);

          if (result.success) {
            setCookieSet(true);
            console.log('Auth cookie set successfully via AuthCookieSetter');
            // Don't reload immediately, let the natural flow handle it
          } else {
            console.error('Failed to set auth cookie:', result.message);
          }
        } catch (error) {
          console.error('Error setting auth cookie:', error);
        }
      } else if (status === 'unauthenticated') {
        console.log('User not authenticated, resetting cookie state');
        setCookieSet(false);
        setAttempts(0);
      }
    };

    setCookie();
  }, [session, status, cookieSet, attempts, extendedSession?.accessToken]);

  // Reset when session changes
  useEffect(() => {
    if (status === 'authenticated' && extendedSession?.accessToken) {
      if (cookieSet) {
        console.log('Session authenticated and cookie already set');
      }
    }
  }, [extendedSession?.accessToken, status, cookieSet]);

  return null; // This component doesn't render anything
}
