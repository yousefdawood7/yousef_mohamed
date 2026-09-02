package com.yousefdawood7.yousef_mohamed.usb

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class UsbDeviceManagerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    companion object {
        const val TAG = "UsbDeviceManager"
        private const val ACTION_USB_PERMISSION = "com.yousefdawood7.yousef_mohamed.USB_PERMISSION"
        var instance: UsbDeviceManagerModule? = null

        fun sendHardwareCaptureEvent() {
            instance?.sendEvent("onHardwareCaptureButtonPressed", null)
        }
    }

    private val usbManager: UsbManager? by lazy {
        reactContext.getSystemService(Context.USB_SERVICE) as? UsbManager
    }

    private var permissionPromise: Promise? = null
    private var isReceiverRegistered = false

    init {
        instance = this
        reactContext.addLifecycleEventListener(this)
        registerReceiver()
    }

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return
            val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
            }

            when (action) {
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                    if (device != null && isUvcDevice(device)) {
                        Log.d(TAG, "UVC USB Device Attached: ${device.deviceName}")
                        val params = deviceToMap(device)
                        sendEvent("onUvcDeviceAttached", params)
                    }
                }
                UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                    if (device != null && isUvcDevice(device)) {
                        Log.d(TAG, "UVC USB Device Detached: ${device.deviceName}")
                        val params = deviceToMap(device)
                        sendEvent("onUvcDeviceDetached", params)
                    }
                }
                ACTION_USB_PERMISSION -> {
                    synchronized(this) {
                        val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                        Log.d(TAG, "USB Permission result: granted = $granted for device: ${device?.deviceName}")
                        
                        val params = Arguments.createMap().apply {
                            putBoolean("granted", granted)
                            if (device != null) {
                                putMap("device", deviceToMap(device))
                            }
                        }
                        sendEvent("onUvcPermissionChanged", params)

                        permissionPromise?.resolve(granted)
                        permissionPromise = null
                    }
                }
            }
        }
    }

    init {
        reactContext.addLifecycleEventListener(this)
        registerReceiver()
    }

    override fun getName() = "UsbDeviceManager"

    private fun registerReceiver() {
        if (!isReceiverRegistered) {
            val filter = IntentFilter().apply {
                addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
                addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
                addAction(ACTION_USB_PERMISSION)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(usbReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                reactContext.registerReceiver(usbReceiver, filter)
            }
            isReceiverRegistered = true
        }
    }

    private fun unregisterReceiver() {
        if (isReceiverRegistered) {
            try {
                reactContext.unregisterReceiver(usbReceiver)
            } catch (e: Exception) {
                Log.e(TAG, "Error unregistering receiver", e)
            }
            isReceiverRegistered = false
        }
    }

    private fun isUvcDevice(device: UsbDevice): Boolean {
        // Direct video class
        if (device.deviceClass == UsbConstants.USB_CLASS_VIDEO) {
            return true
        }
        // Miscellaneous (239) / Common Class (2) / Interface Association Descriptor (1)
        if (device.deviceClass == 239 && device.deviceSubclass == 2 && device.deviceProtocol == 1) {
            return true
        }
        // Check interfaces for Video class (14)
        for (i in 0 until device.interfaceCount) {
            val usbInterface: UsbInterface = device.getInterface(i)
            if (usbInterface.interfaceClass == UsbConstants.USB_CLASS_VIDEO || usbInterface.interfaceClass == 14) {
                return true
            }
        }
        return false
    }

    private fun deviceToMap(device: UsbDevice): WritableMap {
        val hasPerm = usbManager?.hasPermission(device) ?: false
        return Arguments.createMap().apply {
            putInt("deviceId", device.deviceId)
            putString("deviceName", device.deviceName)
            putInt("vendorId", device.vendorId)
            putInt("productId", device.productId)
            putString("productName", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) device.productName ?: "USB Microscope" else "USB Microscope")
            putString("manufacturerName", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) device.manufacturerName ?: "" else "")
            putBoolean("hasPermission", hasPerm)
            putBoolean("isUvc", isUvcDevice(device))
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error emitting event $eventName", e)
        }
    }

    @ReactMethod
    fun getConnectedUvcDevices(promise: Promise) {
        try {
            val mgr = usbManager
            val list = Arguments.createArray()
            if (mgr != null) {
                val devices = mgr.deviceList
                for ((_, device) in devices) {
                    if (isUvcDevice(device)) {
                        list.pushMap(deviceToMap(device))
                    }
                }
            }
            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("GET_DEVICES_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun hasUvcPermission(promise: Promise) {
        try {
            val mgr = usbManager
            if (mgr == null) {
                promise.resolve(false)
                return
            }
            var hasPerm = false
            for ((_, device) in mgr.deviceList) {
                if (isUvcDevice(device)) {
                    if (mgr.hasPermission(device)) {
                        hasPerm = true
                        break
                    }
                }
            }
            promise.resolve(hasPerm)
        } catch (e: Exception) {
            promise.reject("HAS_PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestUvcPermission(promise: Promise) {
        try {
            val mgr = usbManager
            if (mgr == null) {
                promise.reject("USB_MANAGER_NULL", "UsbManager not available")
                return
            }

            var uvcDevice: UsbDevice? = null
            for ((_, device) in mgr.deviceList) {
                if (isUvcDevice(device)) {
                    uvcDevice = device
                    break
                }
            }

            if (uvcDevice == null) {
                promise.reject("NO_UVC_DEVICE", "No UVC USB device attached")
                return
            }

            if (mgr.hasPermission(uvcDevice)) {
                promise.resolve(true)
                return
            }

            this.permissionPromise = promise
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val permissionIntent = PendingIntent.getBroadcast(
                reactContext,
                0,
                Intent(ACTION_USB_PERMISSION).setPackage(reactContext.packageName),
                flags
            )
            mgr.requestPermission(uvcDevice, permissionIntent)
        } catch (e: Exception) {
            promise.reject("REQUEST_PERMISSION_ERROR", e.message, e)
        }
    }

    override fun onHostResume() {
        registerReceiver()
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {
        unregisterReceiver()
    }
}
