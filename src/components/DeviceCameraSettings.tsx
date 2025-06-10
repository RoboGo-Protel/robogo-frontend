import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useDeviceCameraManagement } from '@/hooks/useDeviceCamera';
import { validateCameraUrl } from '@/utils/deviceCameraUtils';

interface DeviceCameraSettingsProps {
  isDark?: boolean;
}

export default function DeviceCameraSettings({
  isDark = false,
}: DeviceCameraSettingsProps) {
  const { devices, loading, error, updateDeviceCamera, refreshDevices } =
    useDeviceCameraManagement();

  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [tempUrls, setTempUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleEditStart = (deviceId: string, currentUrl: string) => {
    setEditingDevice(deviceId);
    setTempUrls((prev) => ({ ...prev, [deviceId]: currentUrl }));
  };
  const handleEditCancel = (deviceId: string) => {
    setEditingDevice(null);
    setTempUrls((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [deviceId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleEditSave = async (deviceId: string) => {
    const newUrl = tempUrls[deviceId];

    if (!validateCameraUrl(newUrl)) {
      alert('Invalid camera URL format');
      return;
    }

    setSaving((prev) => ({ ...prev, [deviceId]: true }));

    try {
      const success = await updateDeviceCamera(deviceId, newUrl);
      if (success) {
        setEditingDevice(null);
        setTempUrls((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [deviceId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        alert('Failed to update camera URL');
      }
    } catch (err) {
      console.error('Error updating camera URL:', err);
      alert('Error updating camera URL');
    } finally {
      setSaving((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleUrlChange = (deviceId: string, newUrl: string) => {
    setTempUrls((prev) => ({ ...prev, [deviceId]: newUrl }));
  };

  if (loading) {
    return (
      <div
        className={`p-6 rounded-xl border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className='flex items-center justify-center'>
          <Icon
            icon='fluent:spinner-ios-20-filled'
            className='w-6 h-6 animate-spin text-blue-500'
          />
          <span
            className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Loading device cameras...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-6 rounded-xl border ${
          isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className='flex items-center'>
          <Icon
            icon='fluent:error-circle-24-filled'
            className='w-6 h-6 text-red-500'
          />
          <span className={`ml-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Error: {error}
          </span>
        </div>
        <button
          onClick={refreshDevices}
          className='mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className='flex items-center justify-between mb-6'>
        <h3
          className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Device Camera URLs
        </h3>
        <button
          onClick={refreshDevices}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title='Refresh devices'
        >
          <Icon icon='fluent:arrow-clockwise-24-regular' className='w-5 h-5' />
        </button>
      </div>

      {devices.length === 0 ? (
        <div
          className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          <Icon
            icon='fluent:device-camera-video-off-24-regular'
            className='w-12 h-12 mx-auto mb-3 opacity-50'
          />
          <p>No devices with camera URLs found</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className={`p-4 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <Icon
                      icon='fluent:device-camera-video-24-regular'
                      className={`w-5 h-5 ${device.status === 'ON' ? 'text-green-500' : 'text-gray-400'}`}
                    />
                    <h4
                      className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {device.deviceName}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.status === 'ON'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>

                  {editingDevice === device.deviceId ? (
                    <div className='space-y-3'>
                      <input
                        type='text'
                        value={tempUrls[device.deviceId] || ''}
                        onChange={(e) =>
                          handleUrlChange(device.deviceId, e.target.value)
                        }
                        placeholder='Enter camera stream URL'
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <div className='flex space-x-2'>
                        <button
                          onClick={() => handleEditSave(device.deviceId)}
                          disabled={saving[device.deviceId]}
                          className='px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1'
                        >
                          {saving[device.deviceId] ? (
                            <>
                              <Icon
                                icon='fluent:spinner-ios-20-filled'
                                className='w-4 h-4 animate-spin'
                              />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Icon
                                icon='fluent:checkmark-24-regular'
                                className='w-4 h-4'
                              />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditCancel(device.deviceId)}
                          disabled={saving[device.deviceId]}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center justify-between'>
                      <span
                        className={`text-sm font-mono ${
                          device.cameraStreamUrl
                            ? isDark
                              ? 'text-gray-300'
                              : 'text-gray-600'
                            : isDark
                              ? 'text-gray-500'
                              : 'text-gray-400'
                        }`}
                      >
                        {device.cameraStreamUrl || 'No URL configured'}
                      </span>
                      <button
                        onClick={() =>
                          handleEditStart(
                            device.deviceId,
                            device.cameraStreamUrl,
                          )
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title='Edit camera URL'
                      >
                        <Icon
                          icon='fluent:edit-24-regular'
                          className='w-4 h-4'
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`mt-6 p-4 rounded-lg ${
          isDark
            ? 'bg-blue-900/20 border border-blue-800'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        <div className='flex items-start space-x-3'>
          <Icon
            icon='fluent:info-24-regular'
            className='w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5'
          />
          <div>
            <h4
              className={`font-medium text-sm ${isDark ? 'text-blue-400' : 'text-blue-800'}`}
            >
              Camera URL Formats
            </h4>
            <p
              className={`text-xs mt-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
            >
              Supported formats: HTTP/HTTPS, WebSocket (ws://), RTSP, or IP
              addresses. Example: http://192.168.1.100/stream or
              ws://device.local:81/stream
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
