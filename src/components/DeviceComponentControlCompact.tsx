import React from 'react';
import { Icon } from '@iconify/react';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';

interface ComponentStatus {
  main: 'ON' | 'OFF';
  camera: 'ON' | 'OFF';
  ultrasonic: 'ON' | 'OFF';
  imu: 'ON' | 'OFF';
}

interface DeviceComponentControlCompactProps {
  deviceName: string;
}

const componentIcons = {
  main: 'fluent:wifi-1-24-filled',
  camera: 'fluent:camera-24-filled',
  ultrasonic: 'fluent:radar-24-filled',
  imu: 'fluent:gauge-24-filled',
};

const componentLabels = {
  main: 'Main',
  camera: 'Cam',
  ultrasonic: 'Ultra',
  imu: 'IMU',
};

export default function DeviceComponentControlCompact({
  deviceName,
}: DeviceComponentControlCompactProps) {
  const { status, loading, updateComponent, updateAllComponents } =
    useDeviceStatus(deviceName);

  if (!status) {
    return null;
  }

  const allComponentsOn = Object.values(status).every((s) => s === 'ON');

  return (
    <div className='w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='font-medium text-sm text-gray-900 dark:text-gray-100'>
            Device Control
          </h3>
          <span className='text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'>
            {deviceName}
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={() => updateAllComponents(allComponentsOn ? 'OFF' : 'ON')}
            disabled={loading}
            className='text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors flex items-center gap-1'
          >
            <Icon
              icon={
                allComponentsOn
                  ? 'fluent:power-off-24-filled'
                  : 'fluent:power-24-filled'
              }
              width={12}
              height={12}
            />
            {allComponentsOn ? 'All OFF' : 'All ON'}
          </button>
        </div>
      </div>

      {/* Component Grid */}
      <div className='grid grid-cols-4 gap-2'>
        {(Object.keys(status) as Array<keyof ComponentStatus>).map(
          (component) => {
            const icon = componentIcons[component];
            const isOn = status[component] === 'ON';

            return (
              <div
                key={component}
                className='flex flex-col items-center gap-1 p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 transition-all'
              >
                <div
                  className={`p-1.5 rounded-md transition-colors ${
                    isOn
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                      : 'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-500'
                  }`}
                >
                  <Icon icon={icon} width={12} height={12} />
                </div>

                <span className='text-xs font-medium text-center text-gray-700 dark:text-gray-300'>
                  {componentLabels[component]}
                </span>

                {/* Custom Toggle Switch */}
                <button
                  onClick={() =>
                    updateComponent(component, isOn ? 'OFF' : 'ON')
                  }
                  disabled={loading}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                    isOn ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isOn ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          },
        )}
      </div>

      {/* Status Summary */}
      <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
        <div className='flex items-center gap-1'>
          <div
            className={`w-2 h-2 rounded-full ${
              allComponentsOn
                ? 'bg-green-500'
                : Object.values(status).some((s) => s === 'ON')
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <span>
            {Object.values(status).filter((s) => s === 'ON').length}/4 Active
          </span>
        </div>

        {loading && (
          <div className='flex items-center gap-1'>
            <Icon
              icon='fluent:arrow-clockwise-24-filled'
              width={12}
              height={12}
              className='animate-spin'
            />
            <span>Updating...</span>
          </div>
        )}
      </div>
    </div>
  );
}
