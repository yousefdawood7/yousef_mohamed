import mqtt, { MqttClient } from 'mqtt';

let expoExtra: any = null;
try {
  const Constants = require('expo-constants')?.default || require('expo-constants');
  expoExtra = Constants?.expoConfig?.extra;
} catch (_) {}

const WS_URL =
  process.env.EXPO_PUBLIC_MQTT_BROKER_URL ||
  expoExtra?.mqttBrokerUrl ||
  'wss://a20566c276a245bd862cd068994dec4e.s1.eu.hivemq.cloud:8884/mqtt';

const TOPIC = 'esp32/status';

const USERNAME =
  process.env.EXPO_PUBLIC_MQTT_USERNAME ||
  expoExtra?.mqttUsername ||
  'yd7';

const PASSWORD =
  process.env.EXPO_PUBLIC_MQTT_PASSWORD ||
  expoExtra?.mqttPassword ||
  '123456789';

const KEEP_ALIVE_INTERVAL_MS = 20000; // 20s (well under 60s ESP32 timeout)

export type RobotStatus = 'sick' | 'good';

let client: MqttClient | null = null;
let lastKnownStatus: RobotStatus | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function getClient(): MqttClient {
  if (client) return client;

  try {
    client = mqtt.connect(WS_URL, {
      username: USERNAME,
      password: PASSWORD,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: 'dr_hakeem_' + Math.random().toString(16).substring(2, 10),
    });

    client.on('connect', () => {
      console.log('[MQTT] Connected to HiveMQ Cloud broker successfully');
      if (lastKnownStatus) {
        publishStatus(lastKnownStatus);
      }
    });

    client.on('error', (err) => {
      console.warn('[MQTT] Broker connection warning:', err?.message || err);
    });

    client.on('close', () => {
      console.log('[MQTT] Broker connection closed');
    });

    client.on('offline', () => {
      console.log('[MQTT] Client offline');
    });
  } catch (err) {
    console.warn('[MQTT] Failed to initialize MQTT client:', err);
  }

  return client!;
}

function publishStatus(status: RobotStatus) {
  try {
    const c = getClient();
    if (!c) return;

    c.publish(TOPIC, status, { qos: 1 }, (err) => {
      if (err) {
        console.warn(`[MQTT] Failed to publish ${status}:`, err.message);
      } else {
        console.log(`[MQTT] Published status "${status}" to ${TOPIC}`);
      }
    });
  } catch (err) {
    console.warn('[MQTT] Error while publishing status:', err);
  }
}

/**
 * Sends a status update ('sick' | 'good') to the ESP32 robot eyes via MQTT.
 * Automatically initiates/refreshes the 20s keep-alive timer so the ESP32
 * does not time out and fall back to the unknown state.
 */
export function sendStatus(status: RobotStatus) {
  lastKnownStatus = status;

  // Publish immediately
  publishStatus(status);

  // Refresh keep-alive interval
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
  }

  keepAliveTimer = setInterval(() => {
    if (lastKnownStatus) {
      publishStatus(lastKnownStatus);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

/**
 * Stops the 20-second keep-alive timer (e.g. when leaving report screen or logging out).
 */
export function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
    console.log('[MQTT] Keep-alive timer stopped');
  }
}

/**
 * Gets the current last known status dispatched to the robot eyes.
 */
export function getLastKnownStatus(): RobotStatus | null {
  return lastKnownStatus;
}
