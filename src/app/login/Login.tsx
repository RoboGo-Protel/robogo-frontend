"use client";
import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";
import Link from "next/link";
import { useToast } from "@/context/ToastProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from 'next-auth/react';

export default function Login() {
  const { isDark } = useDarkMode();
  const { promise } = useToast();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    const updateHeights = () => {
      const top = document.querySelector('#top-navbar');
      if (top) setTopNavbarHeight(top.clientHeight);
      else setTopNavbarHeight(0);
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  const router = useRouter();
  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in with callback:', callbackUrl);

      const result = await signIn('google', {
        callbackUrl: callbackUrl,
        redirect: true,
      });

      console.log('Google signIn result:', result);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await promise(
      fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Login failed');
        }
        return res.json();
      }),
      {
        loading: 'Logging in...',
        success: (data) => {
          router.replace(callbackUrl);
          return `Welcome back, ${data.data?.user?.name || 'User'}!`;
        },
        error: (err) =>
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
    );
  };

  return (
    <div
      className={clsx(
        'min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300',
        isDark
          ? 'bg-gradient-to-br from-[#0a0e1a] via-[#112133] to-[#1a2332]'
          : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
      )}
      style={{ paddingTop: topNavbarHeight }}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]'></div>
      </div>{' '}
      {/* Floating Elements */}
      <div
        className={clsx(
          'absolute top-20 left-10 w-20 h-20 rounded-full blur-xl opacity-30 animate-pulse',
          isDark ? 'bg-blue-500' : 'bg-blue-500',
        )}
      ></div>
      <div
        className={clsx(
          'absolute bottom-20 right-10 w-32 h-32 rounded-full blur-xl opacity-20 animate-pulse delay-1000',
          isDark ? 'bg-blue-400' : 'bg-blue-400',
        )}
      ></div>
      {/* Main Container */}
      <div className='relative z-10 w-full max-w-md mx-auto p-6'>
        {/* Logo/Brand Section */}
        <div className='text-center mb-8'>
          {' '}
          <div
            className={clsx(
              'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg',
              isDark
                ? 'bg-gradient-to-br from-blue-500 to-blue-400'
                : 'bg-gradient-to-br from-blue-500 to-blue-400',
            )}
          >
            <span className='text-2xl font-bold text-white'>R</span>
          </div>
          <h1
            className={clsx(
              'text-3xl font-bold mb-2',
              isDark ? 'text-white' : 'text-gray-800',
            )}
          >
            Welcome Back
          </h1>
          <p
            className={clsx(
              'text-sm',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}
          >
            Sign in to your RoboGo account
          </p>
        </div>

        {/* Login Card */}
        <div
          className={clsx(
            'backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-3xl',
            isDark
              ? 'bg-white/5 border-white/10 shadow-black/20'
              : 'bg-white/80 border-white/20 shadow-black/5',
          )}
        >
          <form className='space-y-6' onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className='space-y-2'>
              <label
                className={clsx(
                  'block text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}
              >
                Email Address
              </label>
              <div className='relative'>
                {' '}
                <input
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none',
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 hover:bg-white/10'
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white',
                  )}
                  required
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <svg
                    className={clsx(
                      'w-5 h-5',
                      isDark ? 'text-gray-400' : 'text-gray-500',
                    )}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                    />
                  </svg>
                </div>
              </div>
            </div>
            {/* Password Field */}
            <div className='space-y-2'>
              <label
                className={clsx(
                  'block text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}
              >
                Password
              </label>
              <div className='relative'>
                {' '}
                <input
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none',
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 hover:bg-white/10'
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white',
                  )}
                  required
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <svg
                    className={clsx(
                      'w-5 h-5',
                      isDark ? 'text-gray-400' : 'text-gray-500',
                    )}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
              </div>
            </div>{' '}
            {/* Remember Me & Forgot Password */}
            <div className='flex items-center justify-between text-sm'>
              <label className='flex items-center space-x-3 cursor-pointer group'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    id='remember-me-checkbox'
                    className='sr-only peer'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    htmlFor='remember-me-checkbox'
                    className={clsx(
                      'w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center cursor-pointer',
                      'group-hover:shadow-md group-hover:scale-105',
                      rememberMe
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400 border-transparent'
                        : isDark
                          ? 'border-white/20 bg-white/5 hover:bg-white/10'
                          : 'border-gray-300 bg-white/50 hover:bg-white/70',
                    )}
                  >
                    <svg
                      className={clsx(
                        'w-3 h-3 text-white transition-opacity duration-300',
                        rememberMe ? 'opacity-100' : 'opacity-0',
                      )}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </label>
                </div>
                <span
                  className={clsx(
                    'transition-colors duration-300 group-hover:text-blue-500',
                    isDark ? 'text-gray-300' : 'text-gray-600',
                  )}
                >
                  Remember me
                </span>{' '}
              </label>{' '}
              <Link
                href='/forgot-password'
                className='text-blue-500 hover:text-blue-400 transition-colors'
              >
                Forgot password?
              </Link>
            </div>{' '}
            {/* Submit Button */}
            <button
              type='submit'
              className='w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-500/90 hover:to-blue-400/90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]'
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className='my-6 flex items-center'>
            <div
              className={clsx(
                'flex-1 h-px',
                isDark ? 'bg-gray-600' : 'bg-gray-300',
              )}
            ></div>
            <span
              className={clsx(
                'px-4 text-sm',
                isDark ? 'text-gray-400' : 'text-gray-500',
              )}
            >
              or
            </span>
            <div
              className={clsx(
                'flex-1 h-px',
                isDark ? 'bg-gray-600' : 'bg-gray-300',
              )}
            ></div>
          </div>

          {/* Social Login Buttons */}
          <div className='space-y-3'>
            <button
              className={clsx(
                'w-full py-3 px-4 border rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2',
                isDark
                  ? 'border-white/10 text-white hover:bg-white/5'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50',
              )}
              onClick={handleGoogleSignIn}
            >
              <svg className='w-5 h-5' viewBox='0 0 24 24'>
                <path
                  fill='currentColor'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='currentColor'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='currentColor'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='currentColor'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Register Link */}
          <p
            className={clsx(
              'mt-6 text-sm text-center',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}
          >
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='text-blue-500 hover:text-blue-400 font-medium transition-colors'
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Switch to Local/Offline Mode */}
        <div className='my-4 flex justify-center'>
          <button
            type='button'
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all duration-200',
              typeof window !== 'undefined' && window.electronAPI
                ? 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-2 border-blue-400'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed',
            )}
            disabled={typeof window === 'undefined' || !window.electronAPI}
            onClick={async () => {
              if (
                typeof window !== 'undefined' &&
                window.electronAPI?.setConfig
              ) {
                await window.electronAPI.setConfig('localMode', true);
                window.location.href = '/';
              }
            }}
          >
            Switch to Local/Offline Mode (Electron Only)
          </button>
        </div>

        {/* Footer */}
        <div className='mt-8 text-center'>
          <p
            className={clsx(
              'text-xs',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          >
            By signing in, you agree to our{' '}
            <a
              href='#'
              className='underline hover:text-blue-500 transition-colors'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='#'
              className='underline hover:text-blue-500 transition-colors'
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
