import React, { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import { SyncLoader } from 'react-spinners';

export const metadata = {
  title: 'Reset Password - RoboGo',
  description: 'Reset password untuk akun RoboGo Anda',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center h-screen'>
          <SyncLoader color='#3b82f6' size={12} />
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
