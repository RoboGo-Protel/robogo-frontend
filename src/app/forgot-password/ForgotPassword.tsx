'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useToast } from '@/context/ToastProvider';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIsEmailSent(true);
        showToast(
          'If an account with that email exists, we have sent a password reset link.',
          'success',
        );
      } else {
        setError(data.message || 'Failed to send reset email');
        showToast(data.message || 'Failed to send reset email', 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Something went wrong. Please try again.');
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'>
      {/* Animated Background Elements */}
      <div className='absolute inset-0'>
        {' '}
        <div className='absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse'></div>
        <div className='absolute top-40 right-32 w-80 h-80 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000'></div>
        <div className='absolute -bottom-32 left-32 w-96 h-96 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000'></div>
      </div>

      {/* Floating Particles */}
      <div className='absolute inset-0'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='absolute w-2 h-2 bg-white rounded-full opacity-10 animate-float'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className='relative z-10 flex items-center justify-center min-h-screen px-4'>
        <div className='w-full max-w-md'>
          {/* Back Button */}
          <div className='mb-6'>
            <Link
              href='/login'
              className='inline-flex items-center space-x-2 text-white/70 hover:text-white transition-all duration-300 group'
            >
              <Icon
                icon='solar:arrow-left-linear'
                className='w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300'
              />
              <span>Back to Login</span>
            </Link>
          </div>

          {/* Main Card */}
          <div className='backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 relative'>
            {/* Gradient Border Effect */}
            <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 p-[1px]'>
              <div className='rounded-2xl bg-slate-900/90 w-full h-full'></div>
            </div>

            <div className='relative z-10'>
              {!isEmailSent ? (
                <>
                  {/* Header */}
                  <div className='text-center mb-8'>
                    {' '}
                    <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Icon
                        icon='solar:letter-linear'
                        className='w-8 h-8 text-white'
                      />
                    </div>{' '}
                    <h1 className='text-3xl font-bold text-white mb-2'>
                      Forgot Password?
                    </h1>
                    <p className='text-gray-300'>
                      Enter your email address and we&apos;ll send you a link to
                      reset your password.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Email Input */}
                    <div className='space-y-2'>
                      <label
                        htmlFor='email'
                        className='text-sm font-medium text-gray-300 block'
                      >
                        Email Address
                      </label>
                      <div className='relative'>
                        {' '}
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <Icon
                            icon='solar:letter-linear'
                            className='h-5 w-5 text-gray-400'
                          />
                        </div>
                        <input
                          id='email'
                          type='email'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className='w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
                          placeholder='Enter your email address'
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className='flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3'>
                        <Icon
                          icon='solar:danger-circle-linear'
                          className='w-4 h-4 flex-shrink-0'
                        />
                        <span className='text-sm'>{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type='submit'
                      disabled={isLoading}
                      className='w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2'
                    >
                      {isLoading ? (
                        <>
                          <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Icon
                            icon='solar:send-square-linear'
                            className='w-5 h-5'
                          />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className='text-center'>
                    {' '}
                    <div className='w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <Icon
                        icon='solar:check-circle-linear'
                        className='w-8 h-8 text-white'
                      />
                    </div>{' '}
                    <h1 className='text-3xl font-bold text-white mb-2'>
                      Check Your Email!
                    </h1>
                    <p className='text-gray-300 mb-6'>
                      If an account with{' '}
                      <span className='text-blue-500 font-medium'>{email}</span>{' '}
                      exists, we&apos;ve sent a password reset link.
                    </p>
                    <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6'>
                      <p className='text-sm text-blue-300'>
                        Check your inbox and click the reset link if you
                        received one. The link will expire in 1 hour for
                        security.
                      </p>
                    </div>
                    <div className='space-y-3'>
                      <button
                        onClick={() => {
                          setIsEmailSent(false);
                          setEmail('');
                          setError('');
                        }}
                        className='w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 border border-white/20'
                      >
                        Send Another Email
                      </button>
                      <Link
                        href='/login'
                        className='block w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white py-3 px-4 rounded-lg font-semibold text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02]'
                      >
                        Back to Login
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Links */}
          <div className='text-center mt-6'>
            <p className='text-gray-400'>
              Remember your password?{' '}
              <Link
                href='/login'
                className='text-blue-500 hover:text-white transition-colors duration-300 font-medium'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(120deg);
          }
          66% {
            transform: translateY(-5px) rotate(240deg);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
