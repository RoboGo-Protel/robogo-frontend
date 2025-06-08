"use client";

import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import Link from "next/link";
import { useToast } from "@/context/ToastProvider";
import { signIn } from 'next-auth/react';

export default function Register() {
  const { isDark } = useDarkMode();

  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { promise } = useToast();

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
  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords and confirm password do not match!');
      return;
    }

    setError('');
    await promise(
      fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Registration failed');
          throw new Error(data.message || 'Registration failed');
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        window.location.href = '/';
      }),
      {
        loading: 'Registering...',
        success: 'Registration successful! Setting up your account...',
        error: (err: unknown) =>
          err instanceof Error ? err.message : 'Registration failed',
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
      </div>

      {/* Floating Elements */}
      <div
        className={clsx(
          'absolute top-20 left-10 w-20 h-20 rounded-full blur-xl opacity-30 animate-pulse',
          isDark ? 'bg-[#3BD5FF]' : 'bg-[#3BD5FF]',
        )}
      ></div>
      <div
        className={clsx(
          'absolute bottom-20 right-10 w-32 h-32 rounded-full blur-xl opacity-20 animate-pulse delay-1000',
          isDark ? 'bg-[#367AF2]' : 'bg-[#367AF2]',
        )}
      ></div>

      {/* Main Container */}
      <div className='relative z-10 w-full max-w-md mx-auto p-6'>
        {/* Logo/Brand Section */}
        <div className='text-center mb-8'>
          <div
            className={clsx(
              'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg',
              isDark
                ? 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]'
                : 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]',
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
            Create Account
          </h1>
          <p
            className={clsx(
              'text-sm',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}
          >
            Join RoboGo and start your journey
          </p>
        </div>

        {/* Register Card */}
        <div
          className={clsx(
            'backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-3xl',
            isDark
              ? 'bg-white/5 border-white/10 shadow-black/20'
              : 'bg-white/80 border-white/20 shadow-black/5',
          )}
        >
          <form className='space-y-5' onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className='space-y-2'>
              <label
                className={clsx(
                  'block text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}
              >
                Full Name
              </label>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Enter your full name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#3BD5FF] focus:border-transparent outline-none',
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
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
              </div>
            </div>
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
                <input
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#3BD5FF] focus:border-transparent outline-none',
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
                <input
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#3BD5FF] focus:border-transparent outline-none',
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
            </div>
            {/* Confirm Password Field */}
            <div className='space-y-2'>
              <label
                className={clsx(
                  'block text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}
              >
                Confirm Password
              </label>
              <div className='relative'>
                <input
                  type='password'
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#3BD5FF] focus:border-transparent outline-none',
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
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
              {error && (
                <div className='flex items-center space-x-2 text-red-500 text-sm mt-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>{' '}
            {/* Terms and Conditions */}
            <div className='flex items-start space-x-3 text-sm'>
              <div className='relative mt-0.5'>
                <input
                  type='checkbox'
                  id='terms-checkbox'
                  className='sr-only peer'
                  required
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                />{' '}
                <label
                  htmlFor='terms-checkbox'
                  className={clsx(
                    'w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center cursor-pointer',
                    'hover:shadow-md hover:scale-105',
                    agreeToTerms
                      ? 'bg-gradient-to-r from-[#3BD5FF] to-[#367AF2] border-transparent'
                      : isDark
                        ? 'border-white/20 bg-white/5 hover:bg-white/10'
                        : 'border-gray-300 bg-white/50 hover:bg-white/70',
                  )}
                >
                  <svg
                    className={clsx(
                      'w-3 h-3 text-white transition-opacity duration-300',
                      agreeToTerms ? 'opacity-100' : 'opacity-0',
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
              <label
                htmlFor='terms-checkbox'
                className='cursor-pointer leading-relaxed'
              >
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  I agree to the{' '}
                  <a
                    href='#'
                    className='text-[#3BD5FF] hover:text-[#367AF2] transition-colors underline decoration-1 hover:decoration-2'
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href='#'
                    className='text-[#3BD5FF] hover:text-[#367AF2] transition-colors underline decoration-1 hover:decoration-2'
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>
            {/* Submit Button */}
            <button
              type='submit'
              className='w-full py-3 px-4 bg-gradient-to-r from-[#3BD5FF] to-[#367AF2] hover:from-[#3BD5FF]/90 hover:to-[#367AF2]/90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#3BD5FF] focus:ring-offset-2 active:scale-[0.98] flex items-center justify-center gap-2'
            >
              <span>Create Account</span>
              <Icon icon='solar:user-plus-bold' fontSize={20} />
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
          </div>{' '}
          {/* Social Register Buttons */}
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
          {/* Login Link */}
          <p
            className={clsx(
              'mt-6 text-sm text-center',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}
          >
            Already have an account?{' '}
            <Link
              href='/login'
              className='text-[#3BD5FF] hover:text-[#367AF2] font-medium transition-colors'
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className='mt-8 text-center'>
          <p
            className={clsx(
              'text-xs',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          >
            By creating an account, you agree to our{' '}
            <a
              href='#'
              className='underline hover:text-[#3BD5FF] transition-colors'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='#'
              className='underline hover:text-[#3BD5FF] transition-colors'
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
