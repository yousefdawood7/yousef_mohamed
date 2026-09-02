const { withAndroidManifest } = require('@expo/config-plugins');

const withUsbCamera = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure uses-feature android.hardware.usb.host
    if (!androidManifest['uses-feature']) {
      androidManifest['uses-feature'] = [];
    }

    const hasUsbFeature = androidManifest['uses-feature'].some(
      (feature) => feature.$['android:name'] === 'android.hardware.usb.host'
    );

    if (!hasUsbFeature) {
      androidManifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.usb.host',
          'android:required': 'false',
        },
      });
    }

    // Ensure MainActivity intent filter for USB_DEVICE_ATTACHED
    const mainApplication = androidManifest.application?.[0];
    if (mainApplication && mainApplication.activity) {
      const mainActivity = mainApplication.activity.find(
        (a) => a.$['android:name'] === '.MainActivity'
      );

      if (mainActivity) {
        if (!mainActivity['intent-filter']) {
          mainActivity['intent-filter'] = [];
        }

        const hasUsbIntent = mainActivity['intent-filter'].some((filter) =>
          filter.action?.some(
            (action) =>
              action.$['android:name'] ===
              'android.hardware.usb.action.USB_DEVICE_ATTACHED'
          )
        );

        if (!hasUsbIntent) {
          mainActivity['intent-filter'].push({
            action: [
              {
                $: {
                  'android:name':
                    'android.hardware.usb.action.USB_DEVICE_ATTACHED',
                },
              },
            ],
          });
        }

        if (!mainActivity['meta-data']) {
          mainActivity['meta-data'] = [];
        }

        const hasMetaData = mainActivity['meta-data'].some(
          (meta) =>
            meta.$['android:name'] ===
            'android.hardware.usb.action.USB_DEVICE_ATTACHED'
        );

        if (!hasMetaData) {
          mainActivity['meta-data'].push({
            $: {
              'android:name': 'android.hardware.usb.action.USB_DEVICE_ATTACHED',
              'android:resource': '@xml/device_filter',
            },
          });
        }
      }
    }

    return config;
  });
};

module.exports = withUsbCamera;
