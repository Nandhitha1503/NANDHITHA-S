export interface TelemetryReading {
  id: string;
  timestamp: string;
  temperature: number;      // °C
  humidity: number;         // %
  latitude: number;
  longitude: number;
  speedKmh?: number;
  shockDetected: boolean;
  gForce: number;           // Gs (1.0 = nominal gravity)
  tiltAngle: number;        // degrees (from vertical/level)
  pitch: number;            // degrees
  roll: number;             // degrees
  batteryLevel: number;     // %
  rssi?: number;            // dBm
  source: 'esp32' | 'demo';
  isLiveEsp32: boolean;
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  type: 'temperature' | 'shock' | 'tilt' | 'humidity' | 'connection';
  severity: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  value: string;
  acknowledged: boolean;
}

export interface MissionConfig {
  donorHospital: {
    name: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  recipientHospital: {
    name: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  organType: string;
  donorId: string;
  recipientId: string;
  safeTempMin: number;       // default 2.0 °C
  safeTempMax: number;       // default 8.0 °C
  safeHumidityMin: number;   // default 40 %
  safeHumidityMax: number;   // default 70 %
  tiltWarningThreshold: number; // default 30.0 deg
  shockThresholdG: number;   // default 1.8 G
  departureTime: string;
  estimatedArrival: string;
}

export interface TelemetryResponse {
  reading: TelemetryReading;
  isEsp32Connected: boolean;
  lastPingSecondsAgo: number | null;
  historyCount: number;
  activeAlertsCount: number;
}
