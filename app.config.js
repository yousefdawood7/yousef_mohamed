module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config?.extra,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        process.env.EXPO_PUBLIC_API_URL ||
        'https://magenta-stork-707380.hostingersite.com/api/v1',
      mqttBrokerUrl:
        process.env.EXPO_PUBLIC_MQTT_BROKER_URL ||
        'wss://a20566c276a245bd862cd068994dec4e.s1.eu.hivemq.cloud:8884/mqtt',
      mqttUsername: process.env.EXPO_PUBLIC_MQTT_USERNAME || 'yd7',
      mqttPassword: process.env.EXPO_PUBLIC_MQTT_PASSWORD || '123456789',
    },
  };
};
