import React, { Suspense } from 'react';
import RegisterClient from './RegisterClient';
import { SyncLoader } from 'react-spinners';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - RoboGo',
  description: 'Register untuk mengontrol Robot Gorong Gorong',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center h-screen'>
          <SyncLoader color='#2563EB' size={12} />
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
