interface SerialPort {
  path: string;
  manufacturer: string;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
  locationId?: string;
  pnpId?: string;
  friendlyName?: string;
}

interface ElectronAPI {
  // Serial Port APIs
  getSerialPorts: () => Promise<SerialPort[]>;
  getAllSerialPorts: () => Promise<SerialPort[]>;
  openSerialPort: (
    portPath: string,
    baudRate?: number,
  ) => Promise<{ success: boolean; message?: string; baudRate?: number }>;
  closeSerialPort: () => Promise<{ success: boolean; message?: string }>;
  startSerialReading: () => Promise<{ success: boolean; message?: string }>;
  onSerialData: (callback: (data: string) => void) => void;
  removeSerialDataListener: () => void;
  // File System APIs
  getPhotoSaveFolder: () => Promise<string>;
  setPhotoSaveFolder: (folderPath: string) => Promise<boolean>;
  selectPhotoSaveFolder: () => Promise<string | null>;
  saveImageToFolder: (
    buffer: unknown,
    fileName: string,
    folderPath?: string,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  createFolder: (
    folderPath: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Logs APIs
  getLogsSaveFolder: () => Promise<string>;
  setLogsSaveFolder: (folderPath: string) => Promise<boolean>;
  selectLogsSaveFolder: () => Promise<string | null>;
  writeLogsToFile: (
    content: string,
    filename: string,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  checkFileExists: (filePath: string) => Promise<boolean>;
  // Config APIs
  getLocalMode: () => Promise<boolean>;
  setLocalMode: (value: boolean) => Promise<boolean>;
  getConfig: (key: string) => Promise<unknown>;
  setConfig: (key: string, value: unknown) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;

  // Debug APIs
  getConfigFileLocation: () => Promise<{
    configPath: string;
    userDataPath: string;
    exists: boolean;
  }>;
  getFullConfig: () => Promise<Record<string, unknown>>;

  // Utility APIs
  openRobogoFolder: () => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;
  // Image reading APIs
  getImagesFromFolder: (folderPath: string) => Promise<{
    success: boolean;
    images?: Array<{
      fileName: string;
      filePath: string;
      dateCreated: string;
      size: number;
      stats?: {
        mtime: Date;
        ctime: Date;
        size: number;
      };
    }>;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
