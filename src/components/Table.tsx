import React from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import { Icon } from "@iconify/react/dist/iconify.js";

interface SensorData {
  timestamp: string;
  value: number;
  status?: "normal" | "warning" | "danger";
  direction?: string;
}

interface TableProps {
  sensorTitle?: string;
  sensorModel?: string;
  secondHeaderValue?: string;
  data: SensorData[];
  reverseOrder?: boolean;
  className?: string;
}

const categoryStatusAlert = (ultrasonic: number | string) => {
  if (typeof ultrasonic === "number") {
    if (ultrasonic < 10) {
      return "danger";
    } else if (ultrasonic >= 10 && ultrasonic <= 20) {
      return "warning";
    } else {
      return "normal";
    }
  }
  return null;
};

const statusTheme = {
  normal: {
    borderColor: '#3b82f6',
    fromColor: '#3b82f6',
    toColor: '#60a5fa',
  },
  warning: {
    borderColor: '#facc15',
    fromColor: '#FF9800',
    toColor: '#FFC107',
  },
  danger: {
    borderColor: '#ef4444',
    fromColor: '#FF9799',
    toColor: '#EB0C0F',
  },
};

const Table: React.FC<TableProps> = ({
  sensorTitle = 'Ultrasonic Sensor',
  sensorModel,
  secondHeaderValue = 'Distance (cm)',
  data,
  reverseOrder = false,
  className = '',
}) => {
  const { isDark } = useDarkMode();

  const displayData = reverseOrder ? [...data].reverse() : data;

  return (
    <div
      className={`w-full max-w-md overflow-hidden rounded-2xl shadow-md border ${
        isDark ? 'border-neutral-700' : 'border-gray-200'
      } ${className}`}
    >
      <div className='flex justify-center items-center gap-1 bg-gradient-to-br from-blue-500 to-blue-400 px-4 py-3 text-white text-sm font-semibold rounded-t-2xl'>
        {sensorTitle}
        {sensorModel && (
          <>
            &nbsp;• <span className='font-bold'>{sensorModel}</span>
          </>
        )}
      </div>

      <div className={isDark ? 'bg-neutral-900' : 'bg-white'}>
        <table
          className={`w-full text-sm text-left ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          <thead
            className={`${
              isDark
                ? 'bg-neutral-800 text-white'
                : 'bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800'
            }`}
          >
            <tr>
              <th className='px-4 py-2 font-semibold'>Timestamp</th>
              <th className='px-4 py-2 font-semibold'>{secondHeaderValue}</th>
            </tr>
          </thead>
          <tbody
            className={
              isDark
                ? 'divide-y divide-neutral-700'
                : 'divide-y divide-gray-200'
            }
          >
            {displayData.map((item, index) => {
              const status =
                sensorTitle === 'Ultrasonic Sensor'
                  ? categoryStatusAlert(item.value)
                  : null;

              return (
                <tr
                  key={index}
                  className={
                    index === 0
                      ? 'bg-gradient-to-br from-blue-500/20 to-blue-400/20 font-semibold'
                      : ''
                  }
                >
                  <td className='px-4 py-2'>{item.timestamp}</td>
                  <td className='px-4 py-2'>
                    {sensorTitle === 'Ultrasonic Sensor' ? (
                      <div className='flex items-center gap-2'>
                        {item.value.toFixed(2)}
                        {status === 'danger' ? (
                          <Icon
                            icon='mdi:alert-circle'
                            color='#ef4444'
                            fontSize={20}
                          />
                        ) : (
                          <span
                            className='w-3 h-3 rounded-full'
                            style={{
                              background: status
                                ? `linear-gradient(135deg, ${
                                    statusTheme[status].fromColor
                                  }, ${statusTheme[status].toColor})`
                                : '#ccc',
                            }}
                            title={
                              status
                                ? status.charAt(0).toUpperCase() +
                                  status.slice(1)
                                : 'Unknown'
                            }
                          ></span>
                        )}
                      </div>
                    ) : sensorTitle === 'IMU Heading Direction' ? (
                      <div className='flex items-center gap-2'>
                        {item.value.toFixed(2)}°{' '}
                        <Icon
                          icon='material-symbols:north-rounded'
                          className='text-blue-400 shrink-0'
                          style={{
                            transform: `rotate(${((item.value % 360) + 360) % 360}deg)`,
                          }}
                          width={20}
                          height={20}
                        />
                        {item.direction && (
                          <span className='text-xs text-gray-500'>
                            {item.direction}
                          </span>
                        )}
                      </div>
                    ) : (
                      item.value.toFixed(2)
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Render baris kosong jika kurang dari 5 */}
            {Array.from({ length: Math.max(0, 5 - displayData.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`}>
                  <td className='px-4 py-2'>&nbsp;</td>
                  <td className='px-4 py-2'>&nbsp;</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
