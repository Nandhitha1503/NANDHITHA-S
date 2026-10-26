import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  Map as MapIcon, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  ShieldAlert, 
  Compass, 
  SlidersHorizontal 
} from 'lucide-react';
import { TelemetryReading, AlertEvent, MissionConfig } from './types';
import { api } from './services/api';
import { alarmAudio } from './utils/audioAlarm';

// Components
import { Header } from './components/Header';
import { CriticalAlertBanner } from './components/CriticalAlertBanner';
import { TemperatureCard } from './components/TemperatureCard';
import { HumidityCard } from './components/HumidityCard';
import { MotionCard } from './components/MotionCard';
import { RouteMap } from './components/RouteMap';
import { OrganTripCard } from './components/OrganTripCard';
import { TelemetryCharts } from './components/TelemetryCharts';
import { AlertHistoryModal } from './components/AlertHistoryModal';
import { Esp32GuideModal } from './components/Esp32GuideModal';
import { SettingsModal } from './components/SettingsModal';
import { SimulationToolbar } from './components/SimulationToolbar';

export default function App() {
  const [reading, setReading] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isEsp32Connected, setIsEsp32Connected] = useState(false);
  const [lastPingSecondsAgo, setLastPingSecondsAgo] = useState<number | null>(null);
  const [config, setConfig] = useState<MissionConfig>({
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
    departureTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  });

  // Navigation & Modals
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isEsp32GuideOpen, setIsEsp32GuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(true);
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'map' | 'charts'>('dashboard');

  const simStepRef = useRef(0);

  // Fetch initial config, history, and alerts
  const loadInitialData = useCallback(async () => {
    try {
      const [configData, histData, alertsData, latestData] = await Promise.all([
        api.getConfig().catch(() => null),
        api.getHistory().catch(() => null),
        api.getAlerts().catch(() => null),
        api.getLatestTelemetry().catch(() => null),
      ]);

      if (configData?.config) setConfig(configData.config);
      if (histData?.history) setHistory(histData.history);
      if (histData?.waypoints) setWaypoints(histData.waypoints);
      if (alertsData?.alerts) setAlerts(alertsData.alerts);
      if (latestData) {
        setReading(latestData.reading);
        setIsEsp32Connected(latestData.isEsp32Connected);
        setLastPingSecondsAgo(latestData.lastPingSecondsAgo);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Polling loop for real-time telemetry (every 2.5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [telData, alertsData] = await Promise.all([
          api.getLatestTelemetry().catch(() => null),
          api.getAlerts().catch(() => null),
        ]);

        if (telData) {
          setReading(telData.reading);
          setIsEsp32Connected(telData.isEsp32Connected);
          setLastPingSecondsAgo(telData.lastPingSecondsAgo);

          // Update history list
          setHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1].id === telData.reading.id) {
              return prev;
            }
            return [...prev, telData.reading].slice(-200);
          });
        }

        if (alertsData?.alerts) {
          setAlerts(alertsData.alerts);
        }
      } catch (e) {
        // network error ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Audio Alarm Manager (checks if critical conditions exist)
  useEffect(() => {
    const unacknowledged = alerts.filter(a => !a.acknowledged);
    const hasCritical = unacknowledged.some(a => a.severity === 'critical');
    const liveTempViolation = reading && (reading.temperature < config.safeTempMin || reading.temperature > config.safeTempMax);
    const liveShockViolation = reading && (reading.shockDetected || reading.gForce >= config.shockThresholdG);
    const liveTiltViolation = reading && (reading.tiltAngle > config.tiltWarningThreshold);

    if (hasCritical || liveTempViolation || liveShockViolation) {
      alarmAudio.startCriticalAlarmLoop();
    } else if (liveTiltViolation || unacknowledged.some(a => a.severity === 'warning')) {
      alarmAudio.stopCriticalAlarm();
      alarmAudio.playWarningBeep();
    } else {
      alarmAudio.stopCriticalAlarm();
    }
  }, [alerts, reading, config]);

  // Auto-Simulation Transit Generator (advances the transport along the route)
  useEffect(() => {
    if (!isAutoSimulating || reading?.isLiveEsp32) return;

    const interval = setInterval(async () => {
      simStepRef.current += 1;
      const waypointsList = waypoints.length > 0 ? waypoints : [
        { lat: 37.7749, lng: -122.4194 },
        { lat: 37.6620, lng: -122.4050 },
        { lat: 37.5630, lng: -122.3255 },
        { lat: 37.4980, lng: -122.2350 },
        { lat: 37.4346, lng: -122.1764 }
      ];

      const step = simStepRef.current % (waypointsList.length * 4);
      const index = Math.min(waypointsList.length - 1, Math.floor(step / 4));
      const targetPoint = waypointsList[index];

      // Realistic normal micro fluctuations
      const nextTemp = +(4.2 + Math.sin(simStepRef.current * 0.3) * 0.3).toFixed(1);
      const nextHumidity = +(55 + Math.cos(simStepRef.current * 0.2) * 2.5).toFixed(1);
      const nextTilt = +(3.5 + Math.abs(Math.sin(simStepRef.current * 0.5) * 3)).toFixed(1);
      const nextG = +(1.02 + Math.abs(Math.sin(simStepRef.current * 0.8) * 0.1)).toFixed(2);

      try {
        await api.sendTelemetry({
          temperature: nextTemp,
          humidity: nextHumidity,
          latitude: +(targetPoint.lat + (Math.random() - 0.5) * 0.001).toFixed(5),
          longitude: +(targetPoint.lng + (Math.random() - 0.5) * 0.001).toFixed(5),
          speedKmh: +(60 + Math.random() * 8).toFixed(1),
          shockDetected: false,
          gForce: nextG,
          tiltAngle: nextTilt,
          pitch: +(nextTilt * 0.6).toFixed(1),
          roll: +(nextTilt * 0.8).toFixed(1),
          source: 'demo',
          isLiveEsp32: false,
        });
      } catch (err) {
        // quiet error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSimulating, reading?.isLiveEsp32, waypoints]);

  // Actions
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await api.acknowledgeAlert(id);
      setAlerts(res.alerts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAlerts = async () => {
    try {
      await api.clearAlerts();
      setAlerts([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateEvent = async (type: string) => {
    try {
      const res = await api.simulateEvent(type);
      setReading(res.reading);
      const alertsRes = await api.getAlerts();
      setAlerts(alertsRes.alerts);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (newConfig: Partial<MissionConfig>) => {
    try {
      const res = await api.updateConfig(newConfig);
      setConfig(res.config);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestPacket = async (payload: any) => {
    const res = await api.sendTelemetry(payload);
    setReading(res.reading);
    setIsEsp32Connected(true);
    setLastPingSecondsAgo(0);
    const alertsRes = await api.getAlerts();
    setAlerts(alertsRes.alerts);
  };

  // Min / Max calculation
  const temps = history.map(h => h.temperature);
  const minRecorded = temps.length > 0 ? Math.min(...temps) : (reading?.temperature || 4.2);
  const maxRecorded = temps.length > 0 ? Math.max(...temps) : (reading?.temperature || 4.5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        reading={reading}
        isEsp32Connected={isEsp32Connected}
        lastPingSecondsAgo={lastPingSecondsAgo}
        alerts={alerts}
        config={config}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenEsp32Guide={() => setIsEsp32GuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Critical Alert Warning Banner (Visible if out of safe bounds) */}
      <CriticalAlertBanner
        alerts={alerts}
        reading={reading}
        config={config}
        onAcknowledgeAll={() => handleAcknowledgeAlert('all')}
        onViewAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Interactive Simulation & Alert Testing Toolbar */}
      <SimulationToolbar
        isAutoSimulating={isAutoSimulating}
        onToggleAutoSim={() => setIsAutoSimulating(!isAutoSimulating)}
        onSimulateEvent={handleSimulateEvent}
        isLiveEsp32={reading?.isLiveEsp32 ?? false}
      />

      {/* Mobile Tab Navigation Bar (Visible on mobile/tablet) */}
      <div className="md:hidden max-w-7xl mx-auto px-4 mt-4 w-full">
        <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMobileTab('dashboard')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'dashboard'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Telemetry</span>
          </button>

          <button
            onClick={() => setMobileTab('map')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'map'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Route Map</span>
          </button>

          <button
            onClick={() => setMobileTab('charts')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'charts'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Audit Charts</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex-1 w-full space-y-6">
        
        {/* Organ Transit Manifest & Ischemia Limit Card */}
        <OrganTripCard config={config} reading={reading} />

        {/* Desktop Layout: Multi-column Grid */}
        {/* Mobile View: Controlled by mobileTab */}

        {/* 1. Primary Sensors Grid */}
        <div className={`${mobileTab !== 'dashboard' ? 'hidden md:grid' : 'grid'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`}>
          
          {/* Temperature Sensor Card (2 - 8 °C) */}
          <TemperatureCard
            reading={reading}
            config={config}
            minRecorded={minRecorded}
            maxRecorded={maxRecorded}
          />

          {/* Humidity Sensor Card */}
          <HumidityCard
            reading={reading}
            config={config}
          />

          {/* MPU6050 Motion, Tilt & Shock Sensor Card */}
          <div className="md:col-span-2 lg:col-span-1">
            <MotionCard
              reading={reading}
              config={config}
            />
          </div>

        </div>

        {/* 2. Interactive Route Tracking Map */}
        <div className={`${mobileTab !== 'map' ? 'hidden md:block' : 'block'}`}>
          <RouteMap
            reading={reading}
            config={config}
            waypoints={waypoints}
          />
        </div>

        {/* 3. Historical Telemetry Audit Charts */}
        <div className={`${mobileTab !== 'charts' ? 'hidden md:block' : 'block'}`}>
          <TelemetryCharts
            history={history}
            config={config}
          />
        </div>

        {/* Quick ESP32 Hardware Integration Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-cyan-900/60 bg-gradient-to-r from-cyan-950/40 to-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Connect Real ESP32 Microcontroller
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  REST Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to stream from physical MPU6050 and DHT22 sensors? Flash our tested Arduino code to stream live telemetry.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEsp32GuideOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer shrink-0"
          >
            <span>View ESP32 Guide & API URL</span>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Smart Organ Transportation Monitoring System • Medical Cold-Chain IoT</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Safe Temp Protocol: <strong className="text-slate-400">2.0°C – 8.0°C</strong></span>
            <span>Tilt Limit: <strong className="text-slate-400">≤ 30°</strong></span>
            <span>Shock Limit: <strong className="text-slate-400">&lt; 1.8G</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AlertHistoryModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onClearAll={handleClearAlerts}
      />

      <Esp32GuideModal
        isOpen={isEsp32GuideOpen}
        onClose={() => setIsEsp32GuideOpen(false)}
        onSendTestPacket={handleSendTestPacket}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

    </div>
  );
}
