import React from 'react';
import { Compass, AlertTriangle, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { TelemetryReading, MissionConfig } from '../types';

interface MotionCardProps {
  reading: TelemetryReading | null;
  config: MissionConfig;
}

export const MotionCard: React.FC<MotionCardProps> = ({ reading, config }) => {
  const tilt = reading ? reading.tiltAngle : 4.0;
  const pitch = reading ? reading.pitch : 2.5;
  const roll = reading ? reading.roll : 3.1;
  const gForce = reading ? reading.gForce : 1.02;
  const isShock = reading ? (reading.shockDetected || reading.gForce >= config.shockThresholdG) : false;
  const isTiltExcess = tilt > config.tiltWarningThreshold;

  // Max 60 degrees scale for visual arc
  const tiltProgress = Math.min(100, Math.max(0, (tilt / 60) * 100));
  const tiltLimitPercent = (config.tiltWarningThreshold / 60) * 100;

  return (
    <div className={`p-5 rounded-2xl border transition-all backdrop-blur-md ${
      isShock || isTiltExcess
        ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/40'
        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl ${
            isShock || isTiltExcess 
              ? 'bg-rose-950 text-rose-300 border border-rose-500 animate-pulse' 
              : 'bg-purple-950 text-purple-400 border border-purple-800/80'
          }`}>
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">MPU6050 Motion & Tilt</h2>
            <p className="text-xs text-slate-400">6-Axis Gyroscope & Accelerometer</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          {isShock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-200 border border-rose-500 animate-pulse">
              <Zap className="w-3 h-3" />
              SHOCK IMPACT
            </span>
          )}
          {isTiltExcess && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-200 border border-amber-500 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              TILT &gt; 30°
            </span>
          )}
          {!isShock && !isTiltExcess && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              STABLE LEVEL
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Tilt Horizon + Shock Meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        
        {/* Tilt Angle & Gyroscope Horizon Box */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Tilt Inclination</span>
            <span className={`text-[11px] font-mono font-bold ${
              isTiltExcess ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              Limit: ≤ {config.tiltWarningThreshold}°
            </span>
          </div>

          <div className="flex items-center gap-3 my-1">
            {/* 3D Horizon Level Bubble Indicator */}
            <div className="relative w-14 h-14 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {/* Crosshairs */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-slate-700/80"></div>
                <div className="absolute h-full w-[1px] bg-slate-700/80"></div>
                <div className="absolute w-6 h-6 rounded-full border border-slate-700/60"></div>
              </div>

              {/* Dynamic Spirit Bubble / Perfusion Fluid Level */}
              <div 
                className={`w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                  isTiltExcess ? 'bg-rose-500 shadow-rose-500/80 animate-ping' : 'bg-cyan-400 shadow-cyan-400/50'
                }`}
                style={{
                  transform: `translate(${Math.max(-20, Math.min(20, roll * 0.8))}px, ${Math.max(-20, Math.min(20, pitch * 0.8))}px)`,
                }}
              />
            </div>

            {/* Readout */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-mono font-extrabold ${
                  isTiltExcess ? 'text-rose-400' : 'text-white'
                }`}>
                  {tilt.toFixed(1)}
                </span>
                <span className="text-lg text-slate-400">°</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Pitch: <strong className="text-slate-200">{pitch.toFixed(1)}°</strong> | Roll: <strong className="text-slate-200">{roll.toFixed(1)}°</strong>
              </div>
            </div>
          </div>

          {/* Tilt Progress Bar vs 30° Limit */}
          <div className="space-y-1 mt-2">
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              {/* 30° Limit Line */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10" 
                style={{ left: `${tiltLimitPercent}%` }} 
                title="Critical 30° Limit"
              />
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isTiltExcess ? 'bg-rose-500' : 'bg-purple-500'
                }`}
                style={{ width: `${tiltProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0° (Flat)</span>
              <span className="text-rose-400 font-bold">30° Limit</span>
              <span>60°</span>
            </div>
          </div>
        </div>

        {/* Shock Detection / Accelerometer G-Force */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Impact / G-Force</span>
            <span className={`text-[11px] font-mono font-bold ${
              isShock ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              Limit: &lt; {config.shockThresholdG}G
            </span>
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className={`p-3 rounded-xl border shrink-0 ${
              isShock 
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-mono font-extrabold ${
                  isShock ? 'text-rose-400' : 'text-white'
                }`}>
                  {gForce.toFixed(2)}
                </span>
                <span className="text-lg text-slate-400">G</span>
              </div>
              <div className="text-[11px] font-mono">
                {isShock ? (
                  <span className="text-rose-400 font-bold">CRITICAL IMPACT DETECTED!</span>
                ) : (
                  <span className="text-slate-400">1.0G (Standard Gravity)</span>
                )}
              </div>
            </div>
          </div>

          {/* G-Force bar */}
          <div className="space-y-1 mt-2">
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10" 
                style={{ left: `${(config.shockThresholdG / 3.0) * 100}%` }} 
                title="Shock Threshold"
              />
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isShock ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (gForce / 3.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0G</span>
              <span className="text-slate-400">1.0G Normal</span>
              <span className="text-rose-400 font-bold">1.8G Shock</span>
              <span>3.0G</span>
            </div>
          </div>
        </div>

      </div>

      {/* MPU6050 Sensor Detail Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
        <span>MPU6050 I2C Address: <code className="text-slate-300 font-mono">0x68</code></span>
        <span>Sampling: <strong className="text-slate-300 font-mono">20 Hz</strong></span>
        <span>Perfusion Fluid Risk: <strong className={isTiltExcess ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{isTiltExcess ? 'HIGH SPILL RISK' : 'LOW (NORMAL)'}</strong></span>
      </div>

    </div>
  );
};
