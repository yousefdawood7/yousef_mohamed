import { useState, useEffect, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { UsbDeviceManager } = NativeModules;

export type CameraSourceType = 'uvc' | 'builtin';

export interface UvcDeviceInfo {
  deviceId: number;
  deviceName: string;
  vendorId: number;
  productId: number;
  productName: string;
  manufacturerName: string;
  hasPermission: boolean;
  isUvc: boolean;
}

export interface UseCameraSourceReturn {
  source: CameraSourceType;
  devices: {
    uvc: boolean;
    builtin: boolean;
  };
  selectSource: (source: CameraSourceType) => void;
  hasUvcPermission: boolean;
  requestUvcPermission: () => Promise<boolean>;
  uvcDevice: UvcDeviceInfo | null;
}

export function useCameraSource(): UseCameraSourceReturn {
  const [source, setSource] = useState<CameraSourceType>('builtin');
  const [uvcAvailable, setUvcAvailable] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [uvcDevice, setUvcDevice] = useState<UvcDeviceInfo | null>(null);

  // Check initial USB devices & permissions on Android
  const checkConnectedDevices = useCallback(async () => {
    if (Platform.OS !== 'android' || !UsbDeviceManager) {
      setUvcAvailable(false);
      setHasPermission(false);
      return;
    }

    try {
      const connectedDevices: UvcDeviceInfo[] = await UsbDeviceManager.getConnectedUvcDevices();
      if (connectedDevices && connectedDevices.length > 0) {
        const firstUvc = connectedDevices[0];
        setUvcAvailable(true);
        setUvcDevice(firstUvc);
        setHasPermission(firstUvc.hasPermission);

        // Auto-select UVC microscope when attached
        setSource('uvc');
      } else {
        setUvcAvailable(false);
        setUvcDevice(null);
        setHasPermission(false);
        setSource('builtin');
      }
    } catch (err) {
      console.warn('[useCameraSource] Error fetching UVC devices:', err);
    }
  }, []);

  const requestUvcPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !UsbDeviceManager) {
      return false;
    }
    try {
      const granted: boolean = await UsbDeviceManager.requestUvcPermission();
      setHasPermission(granted);
      if (granted) {
        setSource('uvc');
      }
      return granted;
    } catch (err) {
      console.warn('[useCameraSource] Error requesting UVC permission:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    checkConnectedDevices();

    if (Platform.OS !== 'android' || !UsbDeviceManager) {
      return;
    }

    const eventEmitter = new NativeEventEmitter(UsbDeviceManager);

    const attachSub = eventEmitter.addListener('onUvcDeviceAttached', (device: UvcDeviceInfo) => {
      console.log('[useCameraSource] USB Microscope attached:', device);
      setUvcAvailable(true);
      setUvcDevice(device);
      setHasPermission(device.hasPermission || false);
      // Auto-switch to UVC microscope on plug-in
      setSource('uvc');
    });

    const detachSub = eventEmitter.addListener('onUvcDeviceDetached', (device: UvcDeviceInfo) => {
      console.log('[useCameraSource] USB Microscope detached:', device);
      setUvcAvailable(false);
      setUvcDevice(null);
      setHasPermission(false);
      // Fallback automatically to built-in camera
      setSource('builtin');
    });

    const permSub = eventEmitter.addListener('onUvcPermissionChanged', (data: { granted: boolean; device?: UvcDeviceInfo }) => {
      console.log('[useCameraSource] USB permission changed:', data);
      setHasPermission(data.granted);
      if (data.device) {
        setUvcDevice(data.device);
      }
      if (data.granted) {
        setSource('uvc');
      }
    });

    return () => {
      attachSub.remove();
      detachSub.remove();
      permSub.remove();
    };
  }, [checkConnectedDevices]);

  const selectSource = useCallback((newSource: CameraSourceType) => {
    if (newSource === 'uvc' && !uvcAvailable) {
      return;
    }
    setSource(newSource);
  }, [uvcAvailable]);

  return {
    source,
    devices: {
      uvc: uvcAvailable,
      builtin: true,
    },
    selectSource,
    hasUvcPermission: hasPermission,
    requestUvcPermission,
    uvcDevice,
  };
}
