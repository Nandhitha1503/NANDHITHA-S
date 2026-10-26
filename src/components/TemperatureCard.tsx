import React from 'react';
import { Thermometer, AlertCircle, CheckCircle, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { TelemetryReading, MissionConfig } from '../types';

interface TemperatureCardProps {
  reading: TelemetryReading | null;
  config: MissionConfig;
  minRecorded: number;
  maxRecorded: number;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
  reading,
  config,
  minRecorded,
  maxRecorded,
}) => {
  const temp = reading ? reading.temperature : 4.5;
  const isTooLow = temp < config.safeTempMin;
  const isTooHigh = temp > config.safeTempMax;
  const isOptimal = !isTooLow && !isTooHigh;

  // Scale temp for gauge bar (-2°C to 12°C display spectrum)
  const spectrumMin = -2;
  const spectrumMax = 12;
  const percent = Math.min(100, Math.max(0, ((temp - spectrumMin) / (spectrumMax - spectrumMin)) * 100));

  const safeMinPercent = ((config.safeTempMin - spectrumMin) / (spectrumMax - spectrumMin)) * 100;
  const safeMaxPercent = ((config.safeTempMax - spectrumMin) / (spectrumMax - spectrumMin)) * 100;

  return (
    <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-md ${
      isOptimal
        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        : 'bg-rose-950/40 border-rose-600/80 shadow-lg shadow-rose-950/40'
    }`}>
      {/* Background glow when out of range */}
      {!isOptimal && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl ${
            isOptimal 
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80' 
              : 'bg-rose-900/80 text-rose-300 border border-rose-500 animate-pulse'
          }`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Preservation Temperature</h2>
            <p className="text-xs text-slate-400">Organ Cold-Chain Chamber</p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isOptimal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              SAFE RANGE
            </span>
          ) : isTooLow ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-200 border border-rose-500 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              FREEZING HAZARD
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-200 border border-rose-500 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              OVERHEATING
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${
          isOptimal ? 'text-white' : 'text-rose-400'
        }`}>
          {temp.toFixed(1)}
        </span>
        <span className="text-xl sm:text-2xl font-medium text-slate-400">°C</span>
        <span className="text-xs text-slate-500 ml-auto font-mono">
          Safe Protocol: <strong className="text-emerald-400">{config.safeTempMin} – {config.safeTempMax}°C</strong>
        </span>
      </div>

      {/* Visual Spectrum Bar (Freezing -> Safe -> Overheating) */}
      <div className="space-y-1.5 mb-4">
        <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          {/* Safe Zone Highlight Band */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-500/60"
            style={{
              left: `${safeMinPercent}%`,
              width: `${safeMaxPercent - safeMinPercent}%`,
            }}
          />

          {/* Indicator Needle Marker */}
          <div
            className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full shadow-md transition-all duration-500 ${
              isOptimal ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/80 animate-ping'
            }`}
            style={{ left: `${percent}%` }}
          />
        </div>

        {/* Spectrum Scale Labels */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>&lt;0°C (Freeze)</span>
          <span className="text-emerald-400 font-bold">2.0°C Min</span>
          <span className="text-emerald-400 font-bold">8.0°C Max</span>
          <span>&gt;10°C (Warm)</span>
        </div>
      </div>

      {/* Min / Max & Variance Summary */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-medium">Min Recorded</div>
          <div className="text-slate-200 font-mono font-semibold">{minRecorded.toFixed(1)}°C</div>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-medium">Max Recorded</div>
          <div className="text-slate-200 font-mono font-semibold">{maxRecorded.toFixed(1)}°C</div>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-medium">Deviation</div>
          <div className="text-emerald-400 font-mono font-semibold">
            ±{(Math.abs(temp - 4.5)).toFixed(1)}°C
          </div>
        </div>
      </div>

    </div>
  );
};
