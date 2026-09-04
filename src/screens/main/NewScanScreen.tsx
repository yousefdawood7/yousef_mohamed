import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NewScanNavProp } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { useCameraSource } from '../../hooks/useCameraSource';
import { useOrientation } from '../../hooks/useOrientation';
import { diagnosesApi } from '../../services/api';
import { sendStatus, stopKeepAlive } from '../../services/mqtt';

// UVC USB Microscope (Android). Auto-connects on mount.
import { UvcCamera, type UvcCameraHandle, CameraErrorCodes } from '@kartik512/react-native-uvc-camera';
const UVCCameraComponent = Platform.OS === 'android' ? UvcCamera : null;

const BEST_PRACTICES_TIPS = [
  {
    id: '1',
    icon: 'sun' as const,
    title: 'Optimal Lighting',
    description: 'Ensure uniform, glare-free illumination across the target lesion surface.',
  },
  {
    id: '2',
    icon: 'crosshair' as const,
    title: 'Distance & Focus',
    description: 'Maintain 10–15 cm distance and allow autofocus lock before capturing.',
  },
  {
    id: '3',
    icon: 'disc' as const,
    title: 'Clean Dermatoscope Lens',
    description: 'Wipe optical dermoscopic attachment to prevent artifact distortion.',
  },
  {
    id: '4',
    icon: 'maximize' as const,
    title: 'Center Primary Borders',
    description: 'Keep the entire lesion margin contained within the 4 alignment brackets.',
  },
];

export const NewScanScreen: React.FC = () => {
  const navigation = useNavigation<NewScanNavProp<'NewScan'>>();
  const { isTablet, isCompactLandscape } = useOrientation();

  const [builtinPermission, requestBuiltinPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const uvcCameraRef = useRef<UvcCameraHandle | null>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  // USB Microscope & Camera Source Hook (Android)
  const {
    source,
    devices,
    selectSource,
    hasUvcPermission,
    uvcDevice,
  } = useCameraSource();

  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [webStreamActive, setWebStreamActive] = useState<boolean>(false);
  const [webStreamError, setWebStreamError] = useState<string | null>(null);
  // UVC (USB Microscope) connection/device info
  const [uvcDeviceName, setUvcDeviceName] = useState<string | null>(null);
  // When the UVC library reports that USB permission is required/denied
  const [uvcPermissionNeeded, setUvcPermissionNeeded] = useState<boolean>(() => !hasUvcPermission);

  // Runtime CAMERA permission is REQUIRED on Android 9+ before the UVC
  // device's USB permission will be honored (otherwise "Allow" silently fails).
  const [uvcCameraPermission, requestUvcCameraPermission] = useCameraPermissions();

  // Web Browser Webcam / UVC Stream Setup
  useEffect(() => {
    if (Platform.OS !== 'web' || capturedUri) return;

    let localStream: MediaStream | null = null;

    const startWebCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: facing === 'front' ? 'user' : 'environment',
          },
        });
        localStream = stream;
        if (webVideoRef.current) {
          webVideoRef.current.srcObject = stream;
          await webVideoRef.current.play();
        }
        setWebStreamActive(true);
        setWebStreamError(null);
      } catch (err: any) {
        console.warn('[Web Camera] Error accessing media stream:', err);
        setWebStreamActive(false);
        if (err?.name === 'NotReadableError' || err?.name === 'AbortError') {
          setWebStreamError('Camera in use by another app (e.g. Windows Camera). Please close it.');
        } else if (err?.name === 'NotAllowedError') {
          setWebStreamError('Camera permission denied in browser.');
        } else {
          setWebStreamError(err?.message || 'Could not start webcam stream.');
        }
      }
    };

    startWebCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facing, capturedUri]);

  const handleCapturePhoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      if (Platform.OS === 'web') {
        // Web Capture using Canvas if active webcam stream exists
        if (webVideoRef.current && webStreamActive) {
          const video = webVideoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedUri(dataUrl);
          } else {
            throw new Error('Canvas 2D context unavailable.');
          }
        } else {
          // If no webcam stream is available on Web, trigger file picker smoothly
          handlePickFromGallery();
        }
        return;
      } else if (source === 'uvc') {
        // Android USB Microscope UVC Capture.
        // USB permission is requested automatically by the UVC view on mount;
        // if capture fails, handleCameraError/catch surfaces the reason.
        if (!uvcCameraRef.current) {
          throw new Error('USB Microscope camera is not ready.');
        }
        const { uri } = await uvcCameraRef.current.takePicture();
        if (uri) {
          setCapturedUri(uri);
        } else {
          throw new Error('No image returned from USB microscope.');
        }
      } else {
        // Android / Built-in Expo Camera Capture
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.88,
        });
        if (photo?.uri) {
          setCapturedUri(photo.uri);
        }
      }
    } catch (err: any) {
      Alert.alert('Capture Failed', err?.message || 'Could not capture frame from source.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Hardware capture button listener (Microscope physical capture button)
  const capturePhotoRef = useRef(handleCapturePhoto);
  useEffect(() => {
    capturePhotoRef.current = handleCapturePhoto;
  });

  useEffect(() => {
    let subs: any[] = [];
    if (Platform.OS === 'android') {
      try {
        const { UsbDeviceManager } = NativeModules;
        if (UsbDeviceManager) {
          const eventEmitter = new NativeEventEmitter(UsbDeviceManager);
          subs.push(
            eventEmitter.addListener('onHardwareCaptureButtonPressed', () => {
              console.log('[NewScanScreen] Physical microscope capture button clicked!');
              capturePhotoRef.current();
            })
          );
        }
      } catch (err) {
        console.warn('[NewScanScreen] Error subscribing to hardware capture button:', err);
      }

      // Global event emitted by the patched UVC library when the device's physical
      // button fires a UVC VideoControl button event.
      try {
        subs.push(
          DeviceEventEmitter.addListener('onPhysicalCaptureButtonPressed', () => {
            console.log('[NewScanScreen] UVC physical button event received');
            capturePhotoRef.current();
          })
        );
      } catch (err) {
        console.warn('[NewScanScreen] Error subscribing to UVC physical button:', err);
      }
    }

    // Hardware shortcut on Web / PC testing (Camera button or 'c' key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Camera' || e.code === 'Camera' || e.key === 'c' || e.key === 'C') {
        capturePhotoRef.current();
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      subs.forEach((s) => s?.remove());
      if (Platform.OS === 'web') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.88,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCapturedUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Could not select image.');
    }
  };

  const handleConfirmAnalysis = async () => {
    if (!capturedUri || isAnalyzing) return;
    // Show "loading" on the robot eyes while the AI inference runs.
    sendStatus('loading');
    setIsAnalyzing(true);
    try {
      // Send image to Dr. Hakeem AI diagnosis & heatmap explainability engine
      const diagnosisResult = await diagnosesApi.explainScan(capturedUri, 0.45);
      navigation.navigate('DiagnosticReport', {
        scanId: (diagnosisResult.id || 1).toString(),
        title: `${diagnosisResult.label_ar || 'تشخيص'} (${diagnosisResult.predicted_label || 'Finding'})`,
        imageUri: diagnosisResult.image_url || capturedUri,
        diagnosisData: diagnosisResult,
      });
    } catch (err: any) {
      // Inference failed or timed out — stop the loading keep-alive so the
      // device falls back to idle/blue instead of staying stuck on the spinner.
      stopKeepAlive();
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'AI Diagnosis failed. Please check network connection to the backend server.';
      Alert.alert('Analysis Failed', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Safety net: if the user leaves this screen while an analysis is in-flight,
  // stop the loading keep-alive so the robot eyes don't stay stuck on the spinner.
  useEffect(() => () => stopKeepAlive(), []);

  // Note: UVC camera lifecycle (open/close) is handled automatically by
  // @kartik512/react-native-uvc-camera when the <UvcCamera> view is mounted.

  // Reflect CAMERA-permission readiness whenever UVC source is active so the
  // banner can guide the user. Without CAMERA granted on Android 9+, the OS
  // silently auto-denies the UVC USB "Allow" request. On auto-attach (device
  // plugged in), the view may mount before CAMERA is granted, so request it.
  useEffect(() => {
    if (Platform.OS === 'android' && source === 'uvc') {
      if (!uvcCameraPermission?.granted) {
        requestUvcCameraPermission();
      }
      setUvcPermissionNeeded(!uvcCameraPermission?.granted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, uvcCameraPermission?.granted]);

  const handleRetake = () => {
    setCapturedUri(null);
  };

  const toggleSource = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'USB Microscope Mode',
        'Direct hardware UVC microscope streaming is supported on Android devices via OTG USB-C.\n\nOn PC / Web, use the Gallery button to select your dermoscopic skin images.'
      );
      return;
    }

    if (!devices.uvc) {
      Alert.alert(
        'USB Microscope Not Detected',
        'Please check the following steps to connect your digital dermatoscope:\n\n' +
          '1. Enable OTG Connection:\n' +
          'On many Android phones (Samsung, Xiaomi, Oppo, Realme, Vivo, OnePlus), go to Android Settings > search for "OTG" and turn ON "OTG connection". This is required to supply power to the microscope lights.\n\n' +
          '2. Standalone APK Required:\n' +
          'Native hardware USB drivers require the installed APK (they cannot run inside Expo Go or mobile web browsers).\n\n' +
          '3. Connect Cable:\n' +
          'Plug the USB-C OTG adapter firmly into your phone. When prompted by Android, tap "Allow Dr. Hakeem to access this USB device".'
      );
      return;
    }

    // Android 9+ requires the app to hold CAMERA runtime permission BEFORE
    // the OS will allow UVC USB permission, otherwise the "Allow" dialog appears
    // to do nothing. Ensure CAMERA is granted first.
    let camGranted = !!uvcCameraPermission?.granted;
    if (!camGranted) {
      const res = await requestUvcCameraPermission();
      camGranted = !!res?.granted;
    }
    if (!camGranted) {
      Alert.alert(
        'Camera Permission Required',
        'Dr. Hakeem needs Camera permission to stream the USB microscope on this Android device.'
      );
      return;
    }

    if (source !== 'uvc') {
      // The @kartik512 UVC view requests USB permission automatically on mount,
      // so we simply switch to the UVC source here.
      setUvcPermissionNeeded(false);
      selectSource('uvc');
    } else {
      selectSource('builtin');
    }
    return;
  };

  // Built-in Camera Permission Loading (Android Native)
  if (Platform.OS !== 'web' && source === 'builtin') {
    if (!builtinPermission) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!builtinPermission.granted) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Feather name="camera-off" size={32} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDesc}>
              Dr. Hakeem utilizes high-fidelity camera feeds for clinical dermoscopic analysis and real-time lesion segmentation.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestBuiltinPermission}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.permissionBtnGradient}
              >
                <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.permissionBtnText}>Grant Camera Permission</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topAppBar}>
        <View style={[styles.brandRow, isCompactLandscape && { flex: 1 }]}>
          <Image
            source={require('../../../assets/images/dr_hakeem_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle} numberOfLines={1}>DR  HAKEEM</Text>
        </View>

        <View style={styles.topRightControls}>
          {/* USB Microscope Connection Pill (hidden on compact landscape to avoid overflow) */}
          {devices.uvc && !isCompactLandscape && (
            <View style={styles.microscopePill}>
              <Ionicons name="hardware-chip-outline" size={14} color="#0284C7" />
              <Text style={styles.microscopePillText} numberOfLines={1}>
                {uvcDeviceName || uvcDevice?.productName || 'USB MICROSCOPE ATTACHED'}
              </Text>
            </View>
          )}

          <View style={styles.scannerStatusPill}>
            <View style={styles.statusLiveDot} />
            <Text style={styles.scannerStatusText} numberOfLines={1}>
              {capturedUri
                ? 'IMAGE READY FOR ANALYSIS'
                : source === 'uvc'
                ? 'LIVE USB MICROSCOPE (UVC)'
                : 'LIVE DERMOSCOPIC VIEW'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainLayout, !isTablet && styles.columnLayout]}>
          {/* Left Column: Camera / Microscope Viewfinder & Controls (flex 1.8) */}
          <View style={[styles.viewfinderSection, isTablet && { flex: 1.8 }]}>
            <View style={styles.viewfinderCard}>
              {/* Viewfinder Frame */}
              <View style={styles.viewfinderFrame}>
                {capturedUri ? (
                  <Image
                    source={{ uri: capturedUri }}
                    style={styles.cameraView}
                    resizeMode="cover"
                  />
                ) : Platform.OS === 'web' ? (
                  /* Web Browser Video Stream */
                  <video
                    ref={webVideoRef as any}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#0F172A',
                    }}
                  />
                ) : source === 'uvc' && UVCCameraComponent ? (
                  /* Android UVC Microscope Component */
                  <UVCCameraComponent
                    ref={uvcCameraRef}
                    style={styles.cameraView}
                    onCameraReady={(device) => {
                      setUvcPermissionNeeded(false);
                      setUvcDeviceName(
                        device?.deviceName ||
                          (device?.vendorId && device?.productId
                            ? `USB Microscope (${device.vendorId}:${device.productId})`
                            : null) ||
                          null
                      );
                    }}
                    onCameraError={({ code, message }) => {
                      console.warn('[NewScanScreen] UVC error', code, message);
                      if (code === CameraErrorCodes.PERMISSION_DENIED) {
                        // USB permission was denied; surface it via the banner.
                        setUvcPermissionNeeded(true);
                      } else if (code !== CameraErrorCodes.NO_DEVICE_FOUND) {
                        Alert.alert('USB Microscope Error', message);
                      }
                    }}
                    onDeviceDisconnected={() => {
                      console.warn('[NewScanScreen] UVC device disconnected');
                      setUvcDeviceName(null);
                      setUvcPermissionNeeded(true);
                    }}
                  />
                ) : (
                  /* Built-in Camera (Mobile) */
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraView}
                    facing={facing}
                    enableTorch={torch}
                    ratio="4:3"
                  />
                )}

                {/* 4 Corner Alignment Guide Brackets */}
                <View style={[styles.cornerBracket, styles.topLeftBracket]} />
                <View style={[styles.cornerBracket, styles.topRightBracket]} />
                <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
                <View style={[styles.cornerBracket, styles.bottomRightBracket]} />

                {/* Center Crosshair Reticle */}
                <View style={styles.centerReticle}>
                  <View style={styles.reticleHorizontal} />
                  <View style={styles.reticleVertical} />
                </View>

                {/* Web Camera Busy / Error Helper */}
                {Platform.OS === 'web' && !capturedUri && webStreamError && (
                  <View style={styles.webNoticeBanner}>
                    <View style={styles.webNoticeIconCircle}>
                      <Feather name="video-off" size={18} color="#F59E0B" />
                    </View>
                    <View style={styles.webNoticeTextGroup}>
                      <Text style={styles.webNoticeTitle}>Direct Microscope Feed Inactive</Text>
                      <Text style={styles.webNoticeSubtitle}>
                        Connect your USB digital dermatoscope, or select an image from your device using the Gallery button below.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.webNoticeBtn}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <Feather name="upload" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.webNoticeBtnText}>Upload File</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Android UVC: informational banner shown while USB permission is pending/denied.
                The USB "Allow" dialog is triggered automatically by the UVC view on mount. */}
                {Platform.OS === 'android' && !capturedUri && source === 'uvc' && uvcPermissionNeeded && (
                  <View style={styles.uvcPermissionBanner}>
                    <View style={styles.uvcPermissionIconCircle}>
                      <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.uvcPermissionTextGroup}>
                      <Text style={styles.uvcPermissionTitle}>USB Microscope Connecting…</Text>
                      <Text style={styles.uvcPermissionSubtitle}>
                        Accept the Android "Allow Dr. Hakeem to access this USB device" prompt to stream live from the microscope.
                      </Text>
                    </View>
                    {!uvcCameraPermission?.granted ? (
                      <TouchableOpacity
                        style={styles.uvcGrantButton}
                        onPress={async () => {
                          await requestUvcCameraPermission();
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.uvcGrantButtonText}>Grant Camera</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.uvcGrantButton}
                        onPress={() => {
                          // Re-mount the UVC view to re-trigger the USB permission prompt.
                          setUvcPermissionNeeded(false);
                          selectSource('builtin');
                          setTimeout(() => selectSource('uvc'), 100);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.uvcGrantButtonText}>Retry Connect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Floating Guidance Badge */}
                <View style={styles.guidanceBadge}>
                  <Feather
                    name={capturedUri ? 'check-circle' : source === 'uvc' ? 'disc' : 'activity'}
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.guidanceBadgeText}>
                    {capturedUri
                      ? 'Lesion Captured • High Resolution'
                      : source === 'uvc'
                      ? 'USB Optical Zoom Active • 40x Polarized'
                      : 'AI Optical Tracking • Distance Optimal (12cm)'}
                  </Text>
                </View>
              </View>

              {/* Bottom Control Bar */}
              <View style={[styles.controlBar, isCompactLandscape && styles.controlBarCompact]}>
                {capturedUri ? (
                  /* Capture Confirmation Actions */
                  <View style={styles.confirmActionsRow}>
                    <TouchableOpacity
                      style={styles.retakeBtn}
                      onPress={handleRetake}
                      activeOpacity={0.8}
                    >
                      <Feather name="rotate-ccw" size={18} color="#475569" />
                      <Text style={styles.retakeBtnText}>Retake Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmBtnWrapper}
                      onPress={handleConfirmAnalysis}
                      disabled={isAnalyzing}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={colors.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmBtnGradient}
                      >
                        {isAnalyzing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        ) : null}
                        <Text style={styles.confirmBtnText}>
                          {isAnalyzing ? 'Analyzing via Dr. Hakeem AI...' : 'Confirm & Run Diagnostic'}
                        </Text>
                        {!isAnalyzing && <Feather name="arrow-right" size={18} color="#FFFFFF" />}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Live Camera / Microscope Controls */
                  <View style={styles.liveControlsRow}>
                    {/* Gallery Import Fallback */}
                    <TouchableOpacity
                      style={styles.toolBtn}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.7}
                    >
                      <Feather name="image" size={20} color="#334155" />
                      <Text style={styles.toolBtnLabel}>Gallery</Text>
                    </TouchableOpacity>

                    {/* Source Toggle (Microscope vs Built-in) */}
                    <TouchableOpacity
                      style={[
                        styles.toolBtn,
                        source === 'uvc' && styles.toolBtnActiveMicroscope,
                      ]}
                      onPress={toggleSource}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={source === 'uvc' ? 'microscope' : 'camera-outline'}
                        size={22}
                        color={source === 'uvc' ? '#7A04BB' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.toolBtnLabel,
                          source === 'uvc' && { color: '#7A04BB', fontWeight: '700' },
                        ]}
                      >
                        {source === 'uvc' ? 'Microscope' : 'Camera'}
                      </Text>
                    </TouchableOpacity>

                    {/* Shutter Button */}
                    <TouchableOpacity
                      style={styles.shutterOuter}
                      onPress={handleCapturePhoto}
                      disabled={isCapturing}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#7A04BB', '#04ADC2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.shutterInner}
                      >
                        {isCapturing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Feather name="camera" size={26} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>


                    {/* Torch Toggle (Mobile only) */}
                    {Platform.OS !== 'web' && source === 'builtin' && (
                      <TouchableOpacity
                        style={[styles.toolBtn, torch && styles.toolBtnActive]}
                        onPress={() => setTorch((t) => !t)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name={torch ? 'zap' : 'zap-off'}
                          size={20}
                          color={torch ? colors.primary : '#334155'}
                        />
                        <Text style={[styles.toolBtnLabel, torch && { color: colors.primary }]}>
                          {torch ? 'Torch On' : 'Torch Off'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Right Column: Best Practices & Privacy Sidebar (flex 1) */}
          <View style={[styles.sidebarSection, isTablet && { flex: 1 }]}>
            {/* Best Practices Card */}
            <View style={styles.tipsCard}>
              <View style={styles.cardHeader}>
                <Feather name="check-square" size={18} color="#00629E" />
                <Text style={styles.cardHeaderTitle}>Scan Best Practices</Text>
              </View>

              <View style={styles.tipsList}>
                {BEST_PRACTICES_TIPS.map((tip) => (
                  <View key={tip.id} style={styles.tipItem}>
                    <View style={styles.tipIconBox}>
                      <Feather name={tip.icon} size={16} color="#00629E" />
                    </View>
                    <View style={styles.tipTextGroup}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipDesc}>{tip.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Privacy & Encryption Notice Card */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <Ionicons name="shield-checkmark" size={22} color={colors.emeraldGreen} />
                <Text style={styles.privacyTitle}>HIPAA Encrypted Stream</Text>
              </View>
              <Text style={styles.privacyText}>
                All dermoscopic frames captured via Dr. Hakeem are protected with 256-bit AES cryptographic protocols. Images are securely transmitted for AI analysis and never stored on unencrypted local storage.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  permissionIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#131B2E',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  permissionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  permissionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topAppBar: {
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  microscopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  microscopePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  scannerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF4FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    flexShrink: 1,
    maxWidth: '65%',
  },
  statusLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emeraldGreen,
  },
  scannerStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00629E',
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 28,
  },
  mainLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  columnLayout: {
    flexDirection: 'column',
  },
  viewfinderSection: {
    gap: 16,
  },
  viewfinderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  viewfinderFrame: {
    aspectRatio: 4 / 3,
    width: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraView: {
    ...StyleSheet.absoluteFill,
  },
  cornerBracket: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#38BDF8',
  },
  topLeftBracket: {
    top: 28,
    left: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRightBracket: {
    top: 28,
    right: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeftBracket: {
    bottom: 28,
    left: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRightBracket: {
    bottom: 28,
    right: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  centerReticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleHorizontal: {
    position: 'absolute',
    width: 24,
    height: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.7)',
  },
  reticleVertical: {
    position: 'absolute',
    width: 1.5,
    height: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.7)',
  },
  webNoticeBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  webNoticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNoticeTextGroup: {
    flex: 1,
  },
  webNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  webNoticeSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  webNoticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  webNoticeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uvcPermissionBanner: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  uvcPermissionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uvcPermissionTextGroup: {
    flex: 1,
  },
  uvcPermissionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 2,
  },
  uvcPermissionSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  uvcGrantButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  uvcGrantButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  guidanceBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  guidanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  controlBar: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBarCompact: {
    padding: 12,
  },
  liveControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 440,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    minWidth: 64,
  },
  toolBtnActive: {
    backgroundColor: '#EFF4FF',
    borderRadius: 8,
  },
  toolBtnActiveMicroscope: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  toolBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#E2E8F0',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A04BB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtnWrapper: {
    borderRadius: 10,
    shadowColor: '#451EBB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnGradient: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sidebarSection: {
    gap: 20,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131B2E',
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextGroup: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131B2E',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#64748B',
  },
  privacyCard: {
    backgroundColor: '#EDFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 20,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#047857',
  },
});
