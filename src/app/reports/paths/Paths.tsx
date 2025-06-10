"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Select, { StylesConfig } from "react-select";
import ShortSummary from '@/components/cards/ShortSummaryCard';
import PathsTable from '@/components/PathsTable';
import TunnelPath from '@/components/cards/TunnelPathCard';
import { Icon } from '@iconify/react/dist/iconify.js';
import { PulseLoader } from 'react-spinners';
import { useDarkMode } from '@/context/DarkModeContext';
import { useUserConfig } from '@/hooks/useUserConfig';

interface OptionType {
  value: string;
  label: string;
}

interface Position {
  x: number;
  y: number;
}

interface PathData {
  id: string;
  timestamp: string;
  sessionId: number;
  position: Position;
  speed: number;
  heading: number;
  status: string;
  createdAt: string;
}

export default function Paths() {
  const { isDark } = useDarkMode();
  const { selectedDevice } = useUserConfig();
  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [bottomNavbarHeight, setBottomNavbarHeight] = useState(0);
  const [reportsNavbarHeight, setReportsNavbarHeight] = useState(0);
  const [reports, setReports] = useState<PathData[]>([]);
  const [summaries, setSummaries] = useState({
    totalPaths: 0,
    averageSpeed: 0,
    totalDistance: 0,
    maxSpeed: 0,
  });

  const [dateWithSessions, setDateWithSessions] = useState<
    { value: string; label: string; sessions: OptionType[] }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<OptionType | null>(null);
  const [selectedSession, setSelectedSession] = useState<OptionType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reports = document.querySelector('#reports-navbar');
    const top = document.querySelector('#top-navbar');
    const bottom = document.querySelector('#bottom-navbar');

    if (top) setTopNavbarHeight(top.clientHeight);
    if (bottom) setBottomNavbarHeight(bottom.clientHeight);
    if (reports) setReportsNavbarHeight(reports.clientHeight);

    const handleResize = () => {
      if (top) setTopNavbarHeight(top.clientHeight);
      if (bottom) setBottomNavbarHeight(bottom.clientHeight);
      if (reports) setReportsNavbarHeight(reports.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topNavbarHeight, bottomNavbarHeight, reportsNavbarHeight]);

  const customStyles: StylesConfig<OptionType, false> = {
    container: (provided) => ({
      ...provided,
      width: 'auto',
      minWidth: 140,
    }),
    control: (provided) => ({
      ...provided,
      height: 64,
      minHeight: 64,
      border: 'none',
      borderRadius: '1rem',
      background: 'linear-gradient(to bottom right, #3b82f6, #60a5fa)',
      boxShadow: 'none',
      paddingLeft: '16px',
      paddingRight: '16px',

      overflow: 'visible',
      whiteSpace: 'nowrap',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '1rem',
      overflow: 'visible',
      whiteSpace: 'nowrap',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const deviceName = selectedDevice?.deviceName;
        if (!deviceName) {
          console.log('Waiting for device to be selected...');
          setIsLoading(false);
          return;
        }

        const datesRes = await fetch(
          `/api/reports/paths/dates-with-sessions?deviceName=${encodeURIComponent(deviceName)}`,
        );
        const datesData = await datesRes.json();
        const data = datesData.data;
        setDateWithSessions(data);

        let date = selectedDate;
        let session = selectedSession;

        if (!date && data.length > 0) {
          date = { value: data[0].value, label: data[0].label };
          setSelectedDate(date);

          if (data[0].sessions.length > 0) {
            session = data[0].sessions[0];
            setSelectedSession(session);
          }
        }

        const useDate =
          date ||
          (data.length > 0
            ? { value: data[0].value, label: data[0].label }
            : null);
        const useSession =
          session ||
          (data.length > 0 && data[0].sessions.length > 0
            ? data[0].sessions[0]
            : null);

        if (useDate && useSession) {
          // Fetch reports
          const reportsRes = await fetch(
            `/api/reports/paths/date/${useDate.value}/session/${useSession.value}?deviceName=${encodeURIComponent(deviceName)}`,
          );
          const reportsResult = await reportsRes.json();
          const pathData = reportsResult.data || [];

          // Calculate summaries from the data
          const totalPaths = pathData.length;
          const speeds = pathData
            .map((p: PathData) => p.speed)
            .filter((s: number) => s > 0);
          const averageSpeed =
            speeds.length > 0
              ? speeds.reduce((a: number, b: number) => a + b, 0) /
                speeds.length
              : 0;
          const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

          // Calculate total distance (rough estimate from position changes)
          let totalDistance = 0;
          for (let i = 1; i < pathData.length; i++) {
            const prev = pathData[i - 1];
            const curr = pathData[i];
            const dx = curr.position.x - prev.position.x;
            const dy = curr.position.y - prev.position.y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
          }

          setSummaries({
            totalPaths,
            averageSpeed,
            totalDistance,
            maxSpeed,
          });

          const sortedReports = pathData.sort(
            (a: PathData, b: PathData) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          setReports(sortedReports);
        } else {
          setReports([]);
          setSummaries({
            totalPaths: 0,
            averageSpeed: 0,
            totalDistance: 0,
            maxSpeed: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [selectedDate, selectedSession, selectedDevice?.deviceName]);

  // Don't render content until we have a selected device
  if (!selectedDevice?.deviceName) {
    return (
      <div
        className={clsx(
          'flex flex-col justify-center items-center w-full p-4',
          isDark ? 'text-white bg-[#112133]' : 'text-black',
        )}
        style={{
          paddingTop: topNavbarHeight + reportsNavbarHeight,
          paddingBottom: bottomNavbarHeight + 20,
          height: `calc(100vh - ${
            topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
          }px)`,
        }}
      >
        <PulseLoader
          color='#60a5fa'
          loading={true}
          size={15}
          margin={5}
        />
        <p
          className={clsx(
            'mt-4 text-lg text-center',
            isDark ? 'text-gray-300' : 'text-gray-500',
          )}
        >
          Loading device configuration...
        </p>
      </div>
    );
  }

  const summaryItems = [
    {
      icon: 'mdi:map-marker-path',
      title: 'Total Path Points',
      summary: `${summaries.totalPaths} Points`,
    },
    {
      icon: 'mdi:speedometer',
      title: 'Average Speed',
      summary: `${summaries.averageSpeed.toFixed(2)} m/s`,
    },
    {
      icon: 'mdi:map-marker-distance',
      title: 'Total Distance',
      summary: `${summaries.totalDistance.toFixed(2)} m`,
    },
    {
      icon: 'mdi:speedometer-medium',
      title: 'Max Speed',
      summary: `${summaries.maxSpeed.toFixed(2)} m/s`,
    },
  ];

  return (
    <div
      className={clsx(
        'flex flex-col md:flex-row gap-4 p-4 md:p-5 transition-colors duration-300 w-full',
        isDark ? 'text-white bg-[#112133]' : 'text-black',
      )}
      style={{
        paddingTop: topNavbarHeight + reportsNavbarHeight,
        paddingBottom: bottomNavbarHeight + 20,
      }}
    >
      {isLoading ? (
        <div
          className='flex flex-col justify-center items-center w-full'
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <PulseLoader
            color='#60a5fa'
            loading={isLoading}
            size={15}
            margin={5}
          />
          <p
            className={clsx(
              'mt-4 text-lg text-center',
              isDark ? 'text-gray-300' : 'text-gray-500',
            )}
          >
            Loading path reports, please wait...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div
          className={clsx(
            'flex flex-col justify-center items-center w-full p-4 border-2 rounded-xl',
            isDark ? 'border-gray-700' : 'border-gray-300',
          )}
          style={{
            height: `calc(100vh - ${
              topNavbarHeight + bottomNavbarHeight + reportsNavbarHeight + 20
            }px)`,
          }}
        >
          <Icon
            icon='tabler:photo-off'
            width={48}
            height={48}
            className={clsx(isDark ? 'text-gray-600' : 'text-gray-400')}
          />
          <p
            className={clsx(
              'mt-4 text-lg text-center',
              isDark ? 'text-gray-300' : 'text-gray-500',
            )}
          >
            No path reports available. Please check back later.
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-4 w-full'>
          {/* Summary Cards */}
          <div className='w-full'>
            <ShortSummary
              summaryItems={summaryItems}
              layout='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            />
          </div>

          {/* Dropdown Section */}
          <div className='flex flex-col md:flex-row gap-4 w-full'>
            <Select
              options={dateWithSessions.map((d) => ({
                value: d.value,
                label: d.label,
              }))}
              styles={customStyles}
              value={selectedDate}
              onChange={(option) => {
                setSelectedDate(option);
                const selected = dateWithSessions.find(
                  (d) => d.value === option?.value,
                );
                if (selected?.sessions.length) {
                  setSelectedSession(selected.sessions[0]);
                } else {
                  setSelectedSession(null);
                }
              }}
              isSearchable={false}
              className='flex-1'
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: isDark ? '#23272f' : '#e3f2fd',
                  primary: isDark ? '#3b82f6' : '#60a5fa',
                  neutral0: isDark ? '#23272f' : '#fff',
                  neutral80: isDark ? '#fff' : '#333',
                },
              })}
            />
            <Select
              options={
                selectedDate
                  ? dateWithSessions.find(
                      (d) => d.value === selectedDate.value,
                    )?.sessions || []
                  : []
              }
              styles={customStyles}
              value={selectedSession}
              onChange={setSelectedSession}
              isSearchable={false}
              isDisabled={!selectedDate}
              className='flex-1'
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: isDark ? '#23272f' : '#e3f2fd',
                  primary: isDark ? '#3b82f6' : '#60a5fa',
                  neutral0: isDark ? '#23272f' : '#fff',
                  neutral80: isDark ? '#fff' : '#333',
                },
              })}
            />
          </div>

          {/* Path Visualization */}
          <TunnelPath showStartpoint showEndpoint pathData={reports} />

          {/* Legends Section */}
          <div className='flex flex-col md:flex-row gap-4 w-full'>
            <div className='flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl text-white justify-center md:justify-start'>
              <Icon icon='mdi:map-legend' width={24} height={24} />
              <p>Legends</p>
            </div>
            <div
              className={clsx(
                'flex flex-wrap justify-between w-full gap-4 px-4 py-2 rounded-xl border-2',
                isDark ? 'border-[#223355]' : 'border-[#DCDCDC]',
              )}
            >
              {/* Each legend item */}
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='flex items-center justify-center bg-gradient-to-br from-[#FF623B] to-[#CD2323] rounded-full p-1.5 shadow'>
                  <Icon
                    icon='mynaui:danger-triangle-solid'
                    className='text-white'
                    width={18}
                    height={18}
                  />
                </div>
                <p className='bg-gradient-to-br from-[#FF623B] to-[#CD2323] text-transparent bg-clip-text font-medium'>
                  Obstacle
                </p>
              </div>
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FFC107]/30 to-[#FF9800]/30 flex items-center justify-center'>
                  <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FFC107] to-[#FF9800]' />
                </div>
                <p className='bg-gradient-to-br from-[#FFC107] to-[#FF9800] text-transparent bg-clip-text font-medium'>
                  Startpoint
                </p>
              </div>
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='rounded-full w-8 h-8 bg-gradient-to-br from-[#FF9799]/30 to-[#EB0C0F]/30 flex items-center justify-center'>
                  <div className='rounded-full w-5 h-5 bg-gradient-to-br from-[#FF9799] to-[#EB0C0F]' />
                </div>
                <p className='bg-gradient-to-br from-[#FF9799] to-[#EB0C0F] text-transparent bg-clip-text font-medium'>
                  Endpoint
                </p>
              </div>
              <div className='flex items-center gap-2 min-w-[130px]'>
                <div className='w-8 h-1 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full' />
                <p className='bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text font-medium'>
                  RoboGo Path
                </p>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className='w-full'>
            <PathsTable reports={reports} />
          </div>
        </div>
      )}
    </div>
  );
}
