/* eslint-disable @next/next/no-img-element */
'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import PhotoDetailsWithPaths from '@/components/PhotoDetailsWithPaths';
import { useDarkMode } from '@/context/DarkModeContext';

interface Metadata {
  heading: number;
  ultrasonic: number;
  accelerationMagnitude?: number;
  direction?: string;
  distanceTraveled?: number;
  linearAcceleration?: number;
  velocity?: number;
  velocityX?: number;
  velocityY?: number;
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
  rotationRate?: number;
}

interface IMULogs {
  id: string;
  timestamp: string;
  sessionId: number;
  accelerationMagnitude?: number;
  direction?: string;
  distanceTraveled?: number;
  heading: number;
  linearAcceleration?: number;
  pitch?: number;
  roll?: number;
  rotationRate?: number;
  ultrasonic: number;
  yaw?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
  };
  status: string;
  createdAt: string;
  imageFileName?: string; // Store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
}

interface IMUTableProps {
  reports: IMULogs[];
}

export default function IMUTable({ reports }: IMUTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata: Metadata;
  }>(null);

  const { isDark } = useDarkMode();

  const convertDegreesToDirection = (degrees: number) => {
    const directions = [
      'North (N)',
      'North-North-East (NNE)',
      'North-East (NE)',
      'East-North-East (ENE)',
      'East (E)',
      'East-South-East (ESE)',
      'South-East (SE)',
      'South-South-East (SSE)',
      'South (S)',
      'South-South-West (SSW)',
      'South-West (SW)',
      'West-South-West (WSW)',
      'West (W)',
      'West-North-West (WNW)',
      'North-West (NW)',
      'North-North-West (NNW)',
    ];

    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.round((normalizedDegrees % 360) / 22.5) % 16;
    return directions[index];
  };

  const getTimeOnlyWithoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleTimeString('id-ID', options).replace(/:/g, '.');
  };

  return (
    <>
      <div
        className={`overflow-x-auto w-full rounded-xl shadow-sm ${
          isDark ? 'bg-[#112133]' : 'bg-white'
        }`}
      >
        <table
          className={`w-full border-collapse text-sm md:text-sm md:table-fixed min-w-[1000px] ${isDark ? 'text-white' : 'text-black'}`}
        >
          {' '}
          <colgroup>
            <col className='w-10' />
            <col className='w-24' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-16' />
            <col className='w-24' />
            <col className='w-24' />
            <col className='w-24' />
            <col className='w-32' />
          </colgroup>
          <thead>
            <tr
              className={`${isDark ? 'bg-[#1a3350] border-[#223c5c]' : 'bg-blue-400/10 border-gray-200'} border-b`}
            >
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                No
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                Timestamp
              </th>
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Velocity (m/s²)
              </th>
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Orientation (rad/s²)
              </th>{' '}
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Magnetometer (µT)
              </th>
              <th
                colSpan={3}
                className={`py-3 px-2 text-center font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Motion Data
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                Heading (°)
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                Direction
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                Image
              </th>
              <th
                rowSpan={2}
                className={`py-3 px-2 text-left font-medium uppercase align-top ${isDark ? 'text-white' : 'text-black'}`}
              >
                Action
              </th>
            </tr>
            <tr
              className={`${isDark ? 'bg-[#1a3350] border-[#223c5c]' : 'bg-blue-400/10 border-gray-200'} border-b`}
            >
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Total
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                X
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Y
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Pitch
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Roll
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Yaw
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                X
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Y
              </th>{' '}
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Z
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Accel Mag
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Rotation Rate
              </th>
              <th
                className={`py-2 px-2 text-center font-medium uppercase ${isDark ? 'text-white' : 'text-black'}`}
              >
                Linear Accel
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-[#223c5c]' : 'divide-gray-200'}>
            {reports.map((report, index) => (
              <tr
                key={report.id}
                className={isDark ? 'hover:bg-[#1a3350]' : 'hover:bg-gray-50'}
              >
                <td className='py-3 px-2'>{index + 1}</td>
                <td className='py-3 px-2'>
                  {getTimeOnlyWithoutDate(report.createdAt)}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.velocity?.velocity?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.velocity?.velocityX?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.velocity?.velocityY?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.pitch?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.roll?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.yaw?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.magnetometer?.magnetometerX?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.magnetometer?.magnetometerY?.toFixed(2) ?? '0.00'}
                </td>{' '}
                <td className='py-3 px-2 text-center'>
                  {report.magnetometer?.magnetometerZ?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.accelerationMagnitude?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.rotationRate?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.linearAcceleration?.toFixed(2) ?? '0.00'}
                </td>
                <td className='py-3 px-2 text-center'>
                  {report.heading.toFixed(2)}
                </td>
                <td className='py-3 px-2'>
                  <div className='flex items-center gap-x-2 min-w-0'>
                    <Icon
                      icon='material-symbols:north-rounded'
                      className='text-blue-400 shrink-0'
                      style={{
                        transform: `rotate(${(((report.heading ?? 0) % 360) + 360) % 360}deg)`,
                      }}
                      width={20}
                      height={20}
                    />
                    <span className='break-words'>
                      {convertDegreesToDirection(report.heading ?? 0)}
                    </span>
                  </div>
                </td>
                <td className='py-3 px-2'>
                  {report.hasImage && report.imagePath ? (
                    <div
                      className={`h-10 w-16 rounded cursor-pointer ${isDark ? 'bg-[#23262F]' : 'bg-gray-200'}`}
                      onClick={() =>
                        setSelectedPhoto({
                          id: report.id.toString(),
                          src: `file://${report.imagePath}`,
                          alt: report.imageFileName || 'IMU Image',
                          obstacle: false,
                          date: report.createdAt || '',
                          fileName: report.imageFileName || `imu-${report.id}`,
                          createdAt: report.createdAt || '',
                          metadata: {
                            heading: report.heading,
                            ultrasonic: report.ultrasonic,
                            accelerationMagnitude: report.accelerationMagnitude,
                            direction: report.direction,
                            distanceTraveled: report.distanceTraveled,
                            linearAcceleration: report.linearAcceleration,
                            velocity: report.velocity?.velocity,
                            velocityX: report.velocity?.velocityX,
                            velocityY: report.velocity?.velocityY,
                            magnetometer: report.magnetometer,
                            position: report.position,
                            pitch: report.pitch,
                            roll: report.roll,
                            yaw: report.yaw,
                            rotationRate: report.rotationRate,
                          },
                        })
                      }
                    >
                      <img
                        src={`file://${report.imagePath}`}
                        alt='IMU Report'
                        className='h-10 w-16 rounded object-cover'
                        onError={(e) => {
                          console.warn(
                            '📊 [IMU TABLE] Failed to load image:',
                            report.imagePath,
                          );
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-10 w-16 rounded flex items-center justify-center ${isDark ? 'bg-[#23262F] text-gray-500' : 'bg-gray-200 text-gray-400'}`}
                    >
                      <Icon icon='mdi:image-off' className='w-4 h-4' />
                    </div>
                  )}
                </td>
                <td className='py-3 px-2'>
                  <div className='flex flex-row flex-nowrap items-center space-x-2'>
                    <button
                      disabled
                      className={`whitespace-nowrap border rounded-full px-3 py-2 text-sm min-w-[80px] ${
                        isDark
                          ? 'border-[#223c5c] text-[#b0b8c1] bg-[#112133]/15 hover:bg-[#1a3350]'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15'
                      }`}
                    >
                      <Icon
                        icon='mage:edit-fill'
                        className='inline-block mr-1 align-middle'
                        width={16}
                        height={16}
                      />
                      Edit
                    </button>
                    <button
                      className={`whitespace-nowrap border rounded-full px-3 py-2 text-sm min-w-[80px] ${
                        isDark
                          ? 'border-[#EB0C0F]/40 text-[#EB0C0F] bg-[#112133]/15 hover:bg-[#1a3350]'
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Icon
                        icon='mingcute:delete-fill'
                        className='inline-block mr-1 align-middle'
                        width={16}
                        height={16}
                      />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedPhoto && (
        <PhotoDetailsWithPaths
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
