/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PhotoDetailsWithPaths from '@/components/PhotoDetailsWithPaths';
import { useDarkMode } from '@/context/DarkModeContext';

interface ReportData {
  id: string;
  timestamp: string;
  sessionId?: number;
  distance: number;
  imageId?: string;
  alertLevel: 'High' | 'Medium' | 'Safe' | 'Unknown';
  image?: string;
  alt?: string;
  obstacles?: boolean;
  fileName?: string;
  dateTime?: string;
  createdAt: string;
  metadata: Metadata;
  imageFileName?: string; // Store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
}

interface UltrasonicSensorTableProps {
  reports: ReportData[];
}

interface Metadata {
  ultrasonic: number;
  heading: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
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
}

export default function UltrasonicSensorTable({
  reports,
}: UltrasonicSensorTableProps) {
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'Safe':
        return (
          <span className='bg-gradient-to-br from-blue-500 to-blue-400 text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon icon='mdi:check-circle' className='w-4 h-4 mr-1' />
            Safe
          </span>
        );
      case 'Medium':
        return (
          <span className='bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon icon='solar:danger-bold' className='w-4 h-4 mr-1' />
            Medium
          </span>
        );
      case 'High':
        return (
          <span className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon icon='solar:danger-triangle-bold' className='w-4 h-4 mr-1' />
            High
          </span>
        );
      default:
        return (
          <span className='bg-gradient-to-br from-gray-400 to-gray-600 text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon icon='mdi:help-circle' className='w-4 h-4 mr-1' />
            Unknown
          </span>
        );
    }
  };

  const getTimeOnlyWithoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  // Pagination calculations
  const totalItems = reports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = reports.slice(startIndex, endIndex);

  // Reset to first page when reports change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [reports.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const { isDark } = useDarkMode();

  return (
    <>
      <div
        className={`overflow-x-auto w-full rounded-xl shadow-sm ${
          isDark ? 'bg-[#112133]' : 'bg-white'
        }`}
      >
        {' '}
        <table
          className={`min-w-[800px] w-full border-collapse ${isDark ? 'text-white' : 'text-black'}`}
        >
          <thead>
            <tr
              className={`${isDark ? 'bg-[#1a3350] border-[#223c5c]' : 'bg-blue-400/10 border-gray-200'} border-b`}
            >
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                No
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Timestamp
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Distance (cm)
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Alert Level
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Image
              </th>
              <th
                className={`py-3 px-4 text-left text-xs md:text-sm font-medium uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-[#223c5c]' : 'divide-gray-200'}>
            {currentItems.map((report, index) => (
              <tr
                key={report.id}
                className={isDark ? 'hover:bg-[#1a3350]' : 'hover:bg-gray-50'}
              >
                <td
                  className={`py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {startIndex + index + 1}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {getTimeOnlyWithoutDate(report.createdAt)}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {report.distance}
                </td>{' '}
                <td
                  className={`py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {getAlertBadge(report.alertLevel)}
                </td>
                <td
                  className={`py-3 px-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {report.hasImage && report.imagePath ? (
                    <div
                      className={`h-10 w-16 rounded cursor-pointer ${isDark ? 'bg-[#23262F]' : 'bg-gray-200'}`}
                      onClick={() =>
                        setSelectedPhoto({
                          id: report.id.toString(),
                          src: `file://${report.imagePath}`,
                          alt: report.imageFileName || 'Ultrasonic Image',
                          obstacle: report.obstacles || false,
                          date: report.dateTime || report.createdAt || '',
                          fileName:
                            report.imageFileName || `ultrasonic-${report.id}`,
                          createdAt: report.createdAt || '',
                          metadata: report.metadata,
                        })
                      }
                    >
                      <img
                        src={`file://${report.imagePath}`}
                        alt='Ultrasonic Report'
                        className='h-10 w-16 rounded object-cover'
                        onError={(e) => {
                          console.warn(
                            '🔊 [TABLE] Failed to load image:',
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
                <td className='py-3 px-4 text-sm space-x-2'>
                  <button
                    disabled
                    className={`border rounded-full px-3 py-2 text-sm hover:bg-gray-50 disabled:border-[#DFDFDF] disabled:text-[#DFDFDF] disabled:bg-[#F5F5F5]/15
                      ${isDark ? 'border-[#23262F] text-[#DFDFDF] hover:bg-[#23262F]' : 'border-gray-300 text-gray-600'}
                    `}
                    onClick={() => console.log(`Edit report ${report.id}`)}
                  >
                    <Icon
                      icon='mage:edit-fill'
                      className='inline mr-1'
                      width={16}
                      height={16}
                    />
                    Edit
                  </button>
                  <button
                    className={`border border-red-300 text-red-600 rounded-full px-3 py-2 text-sm hover:bg-red-50 ${isDark ? 'hover:bg-[#23262F]' : ''}`}
                  >
                    <Icon
                      icon='mingcute:delete-fill'
                      className='inline mr-1'
                      width={16}
                      height={16}
                    />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className={`flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 rounded-xl ${
            isDark ? 'bg-[#112133] text-white' : 'bg-white text-black'
          }`}
        >
          {/* Items per page selector */}
          <div className='flex items-center gap-2'>
            <span className='text-sm'>Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className={`px-3 py-1 rounded border text-sm ${
                isDark
                  ? 'bg-[#1a3350] text-white border-[#223c5c]'
                  : 'bg-white text-black border-gray-300'
              }`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page info */}
          <div className='text-sm'>
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
            {totalItems} entries
          </div>

          {/* Pagination buttons */}
          <div className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded border text-sm transition-colors ${
                currentPage === 1
                  ? isDark
                    ? 'bg-[#1a3350] text-gray-500 border-[#223c5c] cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#1a3350] text-white border-[#223c5c] hover:bg-[#223c5c]'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon icon='mdi:chevron-left' className='w-4 h-4' />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else {
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded border text-sm transition-colors ${
                    currentPage === pageNum
                      ? isDark
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-blue-500 text-white border-blue-500'
                      : isDark
                        ? 'bg-[#1a3350] text-white border-[#223c5c] hover:bg-[#223c5c]'
                        : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded border text-sm transition-colors ${
                currentPage === totalPages
                  ? isDark
                    ? 'bg-[#1a3350] text-gray-500 border-[#223c5c] cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#1a3350] text-white border-[#223c5c] hover:bg-[#223c5c]'
                    : 'bg-white text-black border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon icon='mdi:chevron-right' className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <PhotoDetailsWithPaths
          details={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
