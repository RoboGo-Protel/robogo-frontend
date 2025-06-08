import React, { Suspense } from 'react';
import ForgotPasswordClient from './ForgotPasswordClient';
import { SyncLoader } from 'react-spinners';

export const metadata = {
  title: 'Forgot Password - RoboGo',
  description: 'Reset password untuk akun RoboGo Anda',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center h-screen'>
          <SyncLoader color='#60a5fa' size={12} />
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}
