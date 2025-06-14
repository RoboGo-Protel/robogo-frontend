// Test page untuk ESP32-CAM
'use client';

import TestESP32Cam from '@/components/TestESP32Cam';

export default function TestCameraPage() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4'>
        <TestESP32Cam url='ws://192.168.137.133:81/' />
      </div>
    </div>
  );
}
