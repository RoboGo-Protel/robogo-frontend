export interface ComponentStatus {
  main: 'ON' | 'OFF';
  camera: 'ON' | 'OFF';
  ultrasonic: 'ON' | 'OFF';
  imu: 'ON' | 'OFF';
}

export interface InfoItem {
  icon: string;
  title: string;
  status: 'ON' | 'OFF';
  component: keyof ComponentStatus;
}

export const infoItems: InfoItem[] = [
  {
    icon: 'ph:video-camera-fill',
    title: 'ESP32-CAM',
    status: 'OFF', // Default status
    component: 'camera',
  },
  {
    icon: 'mdi:motor',
    title: 'Motor DC',
    status: 'OFF', // Default status
    component: 'main',
  },
  {
    icon: 'mdi:proximity-sensor',
    title: 'Ultrasonic Sensor',
    status: 'OFF', // Default status
    component: 'ultrasonic',
  },
  {
    icon: 'fa6-solid:compass',
    title: 'MPU-9250 Sensor',
    status: 'OFF', // Default status
    component: 'imu',
  },
] as const;
