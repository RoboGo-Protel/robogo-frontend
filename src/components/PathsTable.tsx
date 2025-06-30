/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PhotoDetailsWithPaths from '@/components/PhotoDetailsWithPaths';
import { useDarkMode } from '@/context/DarkModeContext';

interface Position {
  x: number;
  y: number;
}

interface ReportData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
  imageFileName?: string; // Store original imageFileName from JSON
  hasImage?: boolean; // Flag to indicate if image exists in gallery
  imagePath?: string; // Full path to image file if exists
}

interface PathsTableProps {
  reports: ReportData[];
}

export default function PathsTable({ reports }: PathsTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<null | {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata: {
      ultrasonic: number; // Required field for PhotoDetailsWithPaths
      heading?: number;
      position?: {
        positionX?: number;
        positionY?: number;
      };
      velocity?: number; // Map speed to velocity
      distanceTraveled?: number;
      direction?: string; // Map status to direction
    };
  }>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { isDark } = useDarkMode();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Start':
        return (
          <span className='bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon
              icon='material-symbols:not-started-rounded'
              className='w-4 h-4 mr-1'
            />
            {status}
          </span>
        );
      case 'Moving':
        return (
          <span className='bg-gradient-to-br from-blue-500 to-blue-400 text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon
              icon='svg-spinners:blocks-shuffle-3'
              className='w-4 h-4 mr-1'
            />
            {status}
          </span>
        );
      case 'Stop':
        return (
          <span className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-white px-3 py-2 rounded-full flex items-center justify-center w-fit'>
            <Icon icon='gravity-ui:stop-fill' className='w-4 h-4 mr-1' />
            {status}
          </span>
        );
      default:
    }
  };

  const convertDegreesToDirection = (degrees: number) => {
    const directions = [
      'North (N)',
      'North-East (NE)',
      'East (E)',
      'South-East (SE)',
      'South (S)',
      'South-West (SW)',
      'West (W)',
      'North-West (NW)',
    ];

    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.round((normalizedDegrees % 360) / 45) % 8;
    return directions[index];
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

  return (
    <>
      <div
        className={`overflow-x-auto rounded-xl shadow-sm ${
          isDark ? 'bg-[#112133]' : 'bg-white'
        }`}
      >
        <table
          className={`min-w-[700px] w-full text-sm text-left ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          <thead
            className={`border-b border-gray-200 ${
              isDark ? 'bg-blue-400/10' : 'bg-blue-400/10'
            }`}
          >
            <tr>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                No
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Pos (x, y)
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Timestamp
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Speed (cm/s)
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Heading (°)
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Direction
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Image
              </th>
              <th className='py-3 px-4 text-xs md:text-sm font-semibold uppercase tracking-wider whitespace-nowrap'>
                Status
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}
          >
            {currentItems.map((report, index) => (
              <tr
                key={report.id}
                className={`transition-colors ${
                  isDark ? 'hover:bg-[#1a2b44]' : 'hover:bg-gray-50'
                }`}
              >
                <td className='py-3 px-4 whitespace-nowrap'>
                  {startIndex + index + 1}
                </td>
                <td className='py-3 px-4 whitespace-nowrap'>
                  {report.position.x}, {report.position.y}
                </td>
                <td className='py-3 px-4 whitespace-nowrap'>
                  {getTimeOnlyWithoutDate(report.timestamp)}
                </td>
                <td className='py-3 px-4 whitespace-nowrap'>{report.speed}</td>
                <td className='py-3 px-4 whitespace-nowrap'>
                  {report.heading}
                </td>
                <td className='py-3 px-4 whitespace-nowrap'>
                  <div className='flex items-center gap-2'>
                    <Icon
                      icon='material-symbols:north-rounded'
                      className='text-blue-400 shrink-0'
                      style={{
                        transform: `rotate(${((report.heading % 360) + 360) % 360}deg)`,
                      }}
                      width={20}
                      height={20}
                    />
                    <span>{convertDegreesToDirection(report.heading)}</span>
                  </div>
                </td>
                <td className='py-3 px-4 whitespace-nowrap'>
                  {report.hasImage && report.imagePath ? (
                    <div
                      className={`h-10 w-16 rounded cursor-pointer ${isDark ? 'bg-[#23262F]' : 'bg-gray-200'}`}
                      onClick={() =>
                        setSelectedPhoto({
                          id: report.id.toString(),
                          src: `file://${report.imagePath}`,
                          alt: report.imageFileName || 'Path Image',
                          obstacle: false,
                          date: report.timestamp || report.createdAt || '',
                          fileName: report.imageFileName || `path-${report.id}`,
                          createdAt: report.createdAt || '',
                          metadata: {
                            ultrasonic: 0, // Default value since this is for Paths data
                            heading: report.heading,
                            position: {
                              positionX: report.position.x,
                              positionY: report.position.y,
                            },
                            velocity: report.speed,
                            direction: report.status,
                          },
                        })
                      }
                    >
                      <img
                        src={`file://${report.imagePath}`}
                        alt='Path Report'
                        className='h-10 w-16 rounded object-cover'
                        onError={(e) => {
                          console.warn(
                            '🛤️ [TABLE] Failed to load image:',
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
                <td className='py-3 px-4 whitespace-nowrap'>
                  {getStatusBadge(report.status)}
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
