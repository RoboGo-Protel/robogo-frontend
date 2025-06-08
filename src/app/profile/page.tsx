import { Suspense } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import ProfileClient from './ProfileClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - RoboGo',
  description: 'Profile untuk melihat informasi akun pengguna',
};

export default function ProfilePage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileClient />
      </Suspense>
    </ProtectedLayout>
  );
}
