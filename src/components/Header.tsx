import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  Bell, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Settings, 
  Clock, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { TelemetryReading, AlertEvent, MissionConfig } from '../types';
import { alarmAudio } from '../utils/audioAlarm';

interface HeaderProps {
  reading: TelemetryReading | null;
  isEsp32Connected: boolean;
  lastPingSecondsAgo: number | null;
  alerts: AlertEvent[];
  config: MissionConfig;
  onOpenAlerts: () => void;
  onOpenEsp32Guide: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  reading,
  isEsp32Connected,
  lastPingSecondsAgo,
  alerts,
  config,
  onOpenAlerts,
  onOpenEsp32Guide,
  onOpenSettings,
}) => {
  const [isMuted, setIsMuted] = useState(alarmAudio.isMuted());
  const [elapsedCitSeconds, setElapsedCitSeconds] = useState(0);

  // Compute Cold Ischemia Time (CIT) elapsed since departure
  useEffect(() => {
    const updateElapsed = () => {
      const depTime = new Date(config.departureTime).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - depTime) / 1000));
      setElapsedCitSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [config.departureTime]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    alarmAudio.setMuted(next);
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const hasCritical = unacknowledgedAlerts.some(a => a.severity === 'critical');

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner for Demo Status Notice */}
      <div className={`px-4 py-1 text-xs font-medium flex items-center justify-between border-b ${
        reading?.isLiveEsp32 
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
          : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
      }`}>
        <div className="flex items-center gap-2">
          {reading?.isLiveEsp32 ? (
            <>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE ESP32 HARDWARE STREAMING ACTIVE</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-semibold tracking-wide">DEMO DATA MODE</span>
              <span className="hidden sm:inline text-amber-400/80">— Simulated medical transit telemetry. Switch to your ESP32 anytime via REST API.</span>
            </>
          )}
        </div>
        <button
          onClick={onOpenEsp32Guide}
          className="text-[11px] underline hover:text-white transition-colors flex items-center gap-1 font-mono cursor-pointer"
        >
          <Cpu className="w-3 h-3" />
          <span>ESP32 Setup & API Key</span>
        </button>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Medical Mission Info */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-900/30 text-white shrink-0">
              <Heart className="w-6 h-6 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Smart Organ Transportation
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Cold-Chain IoT
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                <span className="text-rose-400 font-medium">{config.organType}</span>
                <span className="text-slate-600">•</span>
                <span>Donor ID: <strong className="text-slate-300 font-mono">{config.donorId}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">{config.donorHospital.name.split(' ')[0]} → {config.recipientHospital.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Right Metrics: Timer, Hardware Status, Controls */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 shrink-0">
            
            {/* Cold Ischemia Time Counter */}
            <div className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-left">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Cold Ischemia Time</span>
              </div>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {formatTimer(elapsedCitSeconds)}
                <span className="text-[10px] font-normal text-slate-500 ml-1">(Max 4h)</span>
              </div>
            </div>

            {/* Battery & Hardware Status */}
            <div className="hidden sm:flex flex-col text-right text-xs">
              <div className="flex items-center justify-end gap-1.5 text-slate-300">
                <Battery className={`w-4 h-4 ${
                  (reading?.batteryLevel || 100) > 30 ? 'text-emerald-400' : 'text-rose-400'
                }`} />
                <span className="font-mono font-semibold">{reading?.batteryLevel ?? 92}%</span>
                <span className="text-slate-500 text-[10px]">Cooler Battery</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {lastPingSecondsAgo !== null ? (
                  <span>Ping: <strong className="text-slate-200">{lastPingSecondsAgo}s ago</strong></span>
                ) : (
                  <span>Demo stream: <strong className="text-emerald-400">Active</strong></span>
                )}
              </div>
            </div>

            {/* Actions: Sound, Alerts, Setup, Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={isMuted ? "Unmute Alarm Sound" : "Mute Alarm Sound"}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-slate-800/70 text-slate-400 border-slate-700 hover:text-white' 
                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Alerts Button with count badge */}
              <button
                onClick={onOpenAlerts}
                title="View Alert Log"
                className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
                  unacknowledgedAlerts.length > 0
                    ? hasCritical
                      ? 'bg-rose-950 text-rose-200 border-rose-600 animate-pulse'
                      : 'bg-amber-950 text-amber-200 border-amber-600'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unacknowledgedAlerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-600 text-white shadow">
                    {unacknowledgedAlerts.length}
                  </span>
                )}
              </button>

              {/* ESP32 Connect Modal Button */}
              <button
                onClick={onOpenEsp32Guide}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-800 text-xs font-medium transition cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ESP32 REST API</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                title="System Thresholds & Mission Config"
                className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
