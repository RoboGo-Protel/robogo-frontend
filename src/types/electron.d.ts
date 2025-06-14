// Type declarations for Electron API
interface ElectronAPI {
  getSerialPorts: () => Promise<SerialPortInfo[]>;
  getAllSerialPorts: () => Promise<SerialPortInfo[]>; // Debug function
  openSerialPort: (
    portPath: string,
    baudRate: number,
  ) => Promise<{ success: boolean; message: string }>;
  closeSerialPort: () => Promise<{ success: boolean; message: string }>;
  startSerialReading: () => Promise<{ success: boolean; message: string }>;
  onSerialData: (callback: (data: string) => void) => void;
  removeSerialDataListener: () => void;
}

interface SerialPortInfo {
  path: string;
  manufacturer: string;
  productId?: string;
  vendorId?: string;
  serialNumber?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
