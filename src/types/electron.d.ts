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
  // Photo Save Folder APIs (Electron only)
  getPhotoSaveFolder?: () => Promise<string>;
  setPhotoSaveFolder?: (folder: string) => Promise<void>;
  selectPhotoSaveFolder?: () => Promise<string>;
  saveImageToFolder?: (
    buffer: Uint8Array,
    fileName: string,
    folderPath?: string,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  createFolder?: (
    folderPath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  // Logs Save Folder APIs (Electron only)
  getLogsSaveFolder?: () => Promise<string>;
  setLogsSaveFolder?: (folder: string) => Promise<void>;
  selectLogsSaveFolder?: () => Promise<string>;
  writeLogsToFile?: (
    content: string,
    filename: string,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  readFile?: (
    relativeFilePath: string,
  ) => Promise<{ success: boolean; content?: string; error?: string }>;
  checkFileExists?: (filePath: string) => Promise<boolean>; // Config API (Electron only)
  getLocalMode?: () => Promise<boolean>;
  setLocalMode?: (value: boolean) => Promise<boolean>;
  getConfig?: <T = unknown>(key: string) => Promise<T>;
  setConfig?: (key: string, value: unknown) => Promise<boolean>;
  resetConfig?: () => Promise<boolean>;
  // Setup validation API (Electron only)
  checkRoboGoSetupValidity?: () => Promise<boolean>;
  // Debug APIs (Electron only)
  getConfigFileLocation?: () => Promise<{
    configPath: string;
    userDataPath: string;
    exists: boolean;
  }>;
  getFullConfig?: () => Promise<Record<string, unknown>>;
  // Folder operation APIs (Electron only)
  openRobogoFolder?: () => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>; // Image reading APIs (Electron only)
  getImagesFromFolder?: (folderPath: string) => Promise<{
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

  // Ultrasonic files reading API
  getUltrasonicFiles?: (folderPath: string) => Promise<{
    success: boolean;
    images?: Array<{
      fileName: string;
      filePath: string;
      dateCreated: string;
      size: number;
      isDirectory?: boolean;
      stats?: {
        mtime: Date;
        ctime: Date;
        size: number;
      };
    }>;
    error?: string;
  }>;

  // Read file content API
  readFileContent?: (filePath: string) => Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;

  // Show file in system explorer
  showItemInFolder?: (filePath: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

interface SerialPortInfo {
  path: string;
  manufacturer: string;
  productId?: string;
  vendorId?: string;
  serialNumber?: string;
  friendlyName?: string;
  locationId?: string;
  pnpId?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
