import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory data store for telemetry
export interface TelemetryReading {
  id: string;
  timestamp: string;
  temperature: number;      // °C
  humidity: number;         // %
  latitude: number;
  longitude: number;
  speedKmh?: number;
  shockDetected: boolean;
  gForce: number;           // Gs (e.g. 1.0 is normal gravity, >1.8 is shock)
  tiltAngle: number;        // degrees (max of pitch/roll)
  pitch: number;            // degrees
  roll: number;             // degrees
  batteryLevel: number;     // %
  rssi?: number;            // dBm WiFi signal
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
  safeTempMin: number;
  safeTempMax: number;
  safeHumidityMin: number;
  safeHumidityMax: number;
  tiltWarningThreshold: number;
  shockThresholdG: number;
  departureTime: string;
  estimatedArrival: string;
}

// Default Mission Configuration
let missionConfig: MissionConfig = {
  donorHospital: {
    name: "St. Jude Metropolitan Medical Center",
    latitude: 37.7749,
    longitude: -122.4194,
    city: "San Francisco, CA"
  },
  recipientHospital: {
    name: "Stanford Medical Center & Organ Institute",
    latitude: 37.4346,
    longitude: -122.1764,
    city: "Palo Alto, CA"
  },
  organType: "Human Heart (Allograft)",
  donorId: "D-98421",
  recipientId: "R-10492",
  safeTempMin: 2.0,
  safeTempMax: 8.0,
  safeHumidityMin: 40.0,
  safeHumidityMax: 70.0,
  tiltWarningThreshold: 30.0,
  shockThresholdG: 1.8,
  departureTime: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
  estimatedArrival: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
};

// Seed route waypoints between Hospital A and Hospital B
const ROUTE_WAYPOINTS = [
  { lat: 37.7749, lng: -122.4194 },
  { lat: 37.7580, lng: -122.4080 },
  { lat: 37.7280, lng: -122.3990 },
  { lat: 37.6620, lng: -122.4050 },
  { lat: 37.6213, lng: -122.3790 },
  { lat: 37.5630, lng: -122.3255 },
  { lat: 37.5300, lng: -122.2850 },
  { lat: 37.4980, lng: -122.2350 },
  { lat: 37.4580, lng: -122.2010 },
  { lat: 37.4346, lng: -122.1764 }
];

let telemetryHistory: TelemetryReading[] = [];
let alertHistory: AlertEvent[] = [];
let lastEsp32PingTime: number | null = null;

// Initial state with realistic medical cold chain telemetry
const now = Date.now();
for (let i = 20; i >= 0; i--) {
  const t = new Date(now - i * 60 * 1000).toISOString();
  const progress = Math.min(1, Math.max(0, (20 - i) / 35));
  const wayIndex = Math.min(
    ROUTE_WAYPOINTS.length - 1,
    Math.floor(progress * (ROUTE_WAYPOINTS.length - 1))
  );
  const wp = ROUTE_WAYPOINTS[wayIndex];

  telemetryHistory.push({
    id: `hist-${i}`,
    timestamp: t,
    temperature: +(4.2 + Math.sin(i / 3) * 0.4).toFixed(1),
    humidity: +(54 + Math.cos(i / 2) * 3).toFixed(1),
    latitude: +(wp.lat + (Math.random() - 0.5) * 0.002).toFixed(5),
    longitude: +(wp.lng + (Math.random() - 0.5) * 0.002).toFixed(5),
    speedKmh: +(58 + Math.random() * 8).toFixed(1),
    shockDetected: false,
    gForce: +(1.02 + Math.random() * 0.08).toFixed(2),
    tiltAngle: +(3.2 + Math.random() * 2).toFixed(1),
    pitch: +(1.8 + Math.random() * 1.5).toFixed(1),
    roll: +(2.5 + Math.random() * 1.5).toFixed(1),
    batteryLevel: +(94 - (20 - i) * 0.2).toFixed(0),
    rssi: -68,
    source: 'demo',
    isLiveEsp32: false,
  });
}

let latestReading: TelemetryReading = telemetryHistory[telemetryHistory.length - 1];

// Evaluation helper for alerts
function evaluateAlerts(reading: TelemetryReading) {
  const newAlerts: AlertEvent[] = [];

  // 1. Temperature Check (2 - 8 °C safe standard)
  if (reading.temperature < missionConfig.safeTempMin) {
    newAlerts.push({
      id: `alert-temp-low-${Date.now()}`,
      timestamp: reading.timestamp,
      type: 'temperature',
      severity: 'critical',
      title: 'CRITICAL: Temperature Below Safe Minimum',
      message: `Preservation temperature dropped to ${reading.temperature}°C (Limit: ≥ ${missionConfig.safeTempMin}°C). Risk of freezing damage to donor tissue!`,
      value: `${reading.temperature}°C`,
      acknowledged: false,
    });
  } else if (reading.temperature > missionConfig.safeTempMax) {
    newAlerts.push({
      id: `alert-temp-high-${Date.now()}`,
      timestamp: reading.timestamp,
      type: 'temperature',
      severity: 'critical',
      title: 'CRITICAL: Temperature Above Safe Maximum',
      message: `Preservation temperature elevated to ${reading.temperature}°C (Limit: ≤ ${missionConfig.safeTempMax}°C). Ischemic warm injury risk!`,
      value: `${reading.temperature}°C`,
      acknowledged: false,
    });
  }

  // 2. Shock Detection (MPU6050 accelerometer impact)
  if (reading.shockDetected || reading.gForce >= missionConfig.shockThresholdG) {
    newAlerts.push({
      id: `alert-shock-${Date.now()}`,
      timestamp: reading.timestamp,
      type: 'shock',
      severity: 'critical',
      title: 'CRITICAL: High Impact / Shock Detected',
      message: `Severe mechanical shock registered at ${reading.gForce.toFixed(2)}G. Inspect container physical integrity!`,
      value: `${reading.gForce.toFixed(2)}G`,
      acknowledged: false,
    });
  }

  // 3. Tilt Angle (MPU6050 gyro/tilt > 30 deg)
  if (reading.tiltAngle > missionConfig.tiltWarningThreshold) {
    newAlerts.push({
      id: `alert-tilt-${Date.now()}`,
      timestamp: reading.timestamp,
      type: 'tilt',
      severity: 'warning',
      title: 'WARNING: Container Tilt Exceeds 30° Limit',
      message: `Container orientation tilted to ${reading.tiltAngle.toFixed(1)}° (Pitch: ${reading.pitch.toFixed(1)}°, Roll: ${reading.roll.toFixed(1)}°). Perfusion liquid may spill or shift!`,
      value: `${reading.tiltAngle.toFixed(1)}°`,
      acknowledged: false,
    });
  }

  // 4. Humidity Check
  if (reading.humidity < missionConfig.safeHumidityMin || reading.humidity > missionConfig.safeHumidityMax) {
    newAlerts.push({
      id: `alert-humidity-${Date.now()}`,
      timestamp: reading.timestamp,
      type: 'humidity',
      severity: 'warning',
      title: 'WARNING: Humidity Range Deviation',
      message: `Chamber humidity is ${reading.humidity}% (Safe: ${missionConfig.safeHumidityMin}% - ${missionConfig.safeHumidityMax}%).`,
      value: `${reading.humidity}%`,
      acknowledged: false,
    });
  }

  // Prepend to alert history (keep last 50)
  if (newAlerts.length > 0) {
    alertHistory = [...newAlerts, ...alertHistory].slice(0, 50);
  }
}

// ----------------- API ROUTES ----------------- //

// REST API for ESP32 and clients
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Smart Organ Transportation Monitoring System',
    time: new Date().toISOString(),
    isEsp32Active: lastEsp32PingTime !== null && (Date.now() - lastEsp32PingTime < 30000),
  });
});

// Latest Telemetry endpoint
app.get('/api/telemetry/latest', (req: Request, res: Response) => {
  const isEsp32Active = lastEsp32PingTime !== null && (Date.now() - lastEsp32PingTime < 30000);
  res.json({
    reading: latestReading,
    isEsp32Connected: isEsp32Active,
    lastPingSecondsAgo: lastEsp32PingTime ? Math.floor((Date.now() - lastEsp32PingTime) / 1000) : null,
    historyCount: telemetryHistory.length,
    activeAlertsCount: alertHistory.filter(a => !a.acknowledged).length,
  });
});

// History endpoint for trends and charts
app.get('/api/telemetry/history', (req: Request, res: Response) => {
  res.json({
    history: telemetryHistory,
    waypoints: ROUTE_WAYPOINTS,
  });
});

// Alerts endpoint
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json({
    alerts: alertHistory,
  });
});

// Acknowledge alert
app.post('/api/alerts/acknowledge', (req: Request, res: Response) => {
  const { alertId } = req.body;
  if (alertId === 'all') {
    alertHistory = alertHistory.map(a => ({ ...a, acknowledged: true }));
  } else {
    alertHistory = alertHistory.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
  }
  res.json({ success: true, alerts: alertHistory });
});

// Clear alerts
app.post('/api/alerts/clear', (req: Request, res: Response) => {
  alertHistory = [];
  res.json({ success: true, alerts: [] });
});

// Mission configuration endpoint
app.get('/api/config', (req: Request, res: Response) => {
  res.json({ config: missionConfig });
});

app.post('/api/config', (req: Request, res: Response) => {
  if (req.body && typeof req.body === 'object') {
    missionConfig = {
      ...missionConfig,
      ...req.body,
    };
  }
  res.json({ success: true, config: missionConfig });
});

/**
 * ESP32 REST Ingestion Endpoint:
 * POST /api/telemetry
 * 
 * Expected JSON payload from ESP32:
 * {
 *   "temperature": 4.5,            // Required: Float °C
 *   "humidity": 55.2,               // Required: Float %
 *   "latitude": 37.6213,            // Optional: Float GPS Lat
 *   "longitude": -122.3790,         // Optional: Float GPS Lng
 *   "speedKmh": 62.4,               // Optional: Float speed
 *   "shockDetected": false,         // Optional: Boolean
 *   "gForce": 1.05,                 // Optional: Float total G-force (sqrt(x^2+y^2+z^2))
 *   "tiltAngle": 12.4,              // Optional: Float tilt angle degrees
 *   "pitch": 5.2,                   // Optional: MPU6050 pitch
 *   "roll": 11.2,                   // Optional: MPU6050 roll
 *   "batteryLevel": 88,             // Optional: Integer battery %
 *   "rssi": -65,                    // Optional: WiFi signal dBm
 *   "source": "esp32"               // Optional: 'esp32' or 'demo'
 * }
 */
app.post('/api/telemetry', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.temperature === undefined || data.humidity === undefined) {
      return res.status(400).json({
        error: 'Missing required sensor fields: "temperature" and "humidity" must be provided.'
      });
    }

    const isLive = data.source === 'esp32' || data.isLiveEsp32 === true;
    if (isLive) {
      lastEsp32PingTime = Date.now();
    }

    // Compute tilt if not directly supplied but pitch and roll are provided
    let tilt = typeof data.tiltAngle === 'number' ? data.tiltAngle : 0;
    const pitch = typeof data.pitch === 'number' ? data.pitch : 0;
    const roll = typeof data.roll === 'number' ? data.roll : 0;
    if (!data.tiltAngle && (pitch || roll)) {
      tilt = Math.sqrt(pitch * pitch + roll * roll);
    }

    const gForce = typeof data.gForce === 'number' ? data.gForce : (data.shockDetected ? 2.5 : 1.0);
    const shock = data.shockDetected === true || gForce >= missionConfig.shockThresholdG;

    const newReading: TelemetryReading = {
      id: `tel-${Date.now()}`,
      timestamp: new Date().toISOString(),
      temperature: Number(Number(data.temperature).toFixed(2)),
      humidity: Number(Number(data.humidity).toFixed(1)),
      latitude: data.latitude !== undefined ? Number(data.latitude) : latestReading.latitude,
      longitude: data.longitude !== undefined ? Number(data.longitude) : latestReading.longitude,
      speedKmh: data.speedKmh !== undefined ? Number(data.speedKmh) : latestReading.speedKmh,
      shockDetected: shock,
      gForce: Number(gForce.toFixed(2)),
      tiltAngle: Number(tilt.toFixed(1)),
      pitch: Number(pitch.toFixed(1)),
      roll: Number(roll.toFixed(1)),
      batteryLevel: data.batteryLevel !== undefined ? Math.min(100, Math.max(0, Math.round(data.batteryLevel))) : (latestReading.batteryLevel || 90),
      rssi: data.rssi !== undefined ? Number(data.rssi) : -65,
      source: isLive ? 'esp32' : 'demo',
      isLiveEsp32: isLive,
    };

    latestReading = newReading;
    telemetryHistory.push(newReading);
    if (telemetryHistory.length > 200) {
      telemetryHistory.shift();
    }

    // Trigger alerts check
    evaluateAlerts(newReading);

    return res.status(200).json({
      success: true,
      message: 'Telemetry received and processed successfully',
      reading: newReading,
      alertsTriggered: alertHistory.length > 0 && alertHistory[0].timestamp === newReading.timestamp,
    });
  } catch (err: any) {
    console.error('Error ingesting telemetry:', err);
    return res.status(500).json({ error: 'Internal server error processing telemetry' });
  }
});

// Demo Simulation Injector (allows testing alert triggers from UI)
app.post('/api/telemetry/simulate-event', (req: Request, res: Response) => {
  const { eventType, value } = req.body;
  const current = { ...latestReading };
  current.id = `sim-${Date.now()}`;
  current.timestamp = new Date().toISOString();
  current.source = 'demo';
  current.isLiveEsp32 = false;

  if (eventType === 'temp-freeze') {
    current.temperature = 1.1; // Below 2°C
  } else if (eventType === 'temp-heat') {
    current.temperature = 9.8; // Above 8°C
  } else if (eventType === 'temp-normal') {
    current.temperature = 4.5;
  } else if (eventType === 'tilt-spill') {
    current.tiltAngle = 42.0;
    current.pitch = 38.0;
    current.roll = 18.0;
  } else if (eventType === 'tilt-normal') {
    current.tiltAngle = 4.2;
    current.pitch = 2.1;
    current.roll = 3.6;
  } else if (eventType === 'shock-impact') {
    current.shockDetected = true;
    current.gForce = 2.85; // High G shock
  } else if (eventType === 'shock-normal') {
    current.shockDetected = false;
    current.gForce = 1.02;
  } else if (eventType === 'custom' && value) {
    Object.assign(current, value);
  }

  latestReading = current;
  telemetryHistory.push(current);
  if (telemetryHistory.length > 200) {
    telemetryHistory.shift();
  }

  evaluateAlerts(current);
  res.json({ success: true, reading: current });
});

// Start Vite middleware in development or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Smart Organ Transportation System listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
