# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated & turbomodules
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Preserve all native JNI methods (critical for C++ and NDK)
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve React Native NativeModules and JavaScript Callbacks
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule {
    @com.facebook.react.bridge.ReactMethod *;
}
-keep class com.facebook.react.bridge.** { *; }

# =========================================================================
# UVC Camera Native JNI & Hardware Shutter Bindings
# =========================================================================
# Prevent R8 from obfuscating JNI classes instantiated from C++ in libuvc/libusb
-keep class com.uvccamera.** { *; }
-keepclassmembers class com.uvccamera.** { *; }
-keep interface com.uvccamera.** { *; }

-keep class com.serenegiant.** { *; }
-keepclassmembers class com.serenegiant.** { *; }
-keep interface com.serenegiant.** { *; }

# Custom USB Device Manager and hardware button listener
-keep class com.yousefdawood7.yousef_mohamed.usb.** { *; }
-keepclassmembers class com.yousefdawood7.yousef_mohamed.usb.** { *; }
-keep class com.yousefdawood7.yousef_mohamed.MainActivity { *; }
