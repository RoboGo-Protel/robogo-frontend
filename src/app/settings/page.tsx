import { Suspense } from 'react';
import SettingsClient from './SettingsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - RoboGo',
  description: 'Manage your account settings and preferences.',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsClient />
    </Suspense>
  );
}
