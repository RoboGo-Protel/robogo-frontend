'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SyncLoader } from 'react-spinners';
import { useMeQuery } from '@/hooks/useMeQuery';
import ResetPassword from './ResetPassword';

export default function ResetPasswordClient() {
  const router = useRouter();
  const { data: user, isLoading } = useMeQuery();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <SyncLoader color='#3BD5FF' size={12} />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <ResetPassword />;
}
