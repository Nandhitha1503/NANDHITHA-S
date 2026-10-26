import React from 'react';
import { Droplets, CheckCircle, AlertTriangle } from 'lucide-react';
import { TelemetryReading, MissionConfig } from '../types';

interface HumidityCardProps {
  reading: TelemetryReading | null;
  config: MissionConfig;
}

export const HumidityCard: React.FC<HumidityCardProps> = ({ reading, config }) => {
  const humidity = reading ? reading.humidity : 55.0;
  const isOutOfRange = humidity < config.safeHumidityMin || humidity > config.safeHumidityMax;

  // Approximate dew point using Magnus formula
  const temp = reading ? reading.temperature : 4.5;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  return (
    <div className={`p-5 rounded-2xl border transition-all backdrop-blur-md ${
      isOutOfRange
        ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/40'
        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-xl ${
            isOutOfRange 
              ? 'bg-amber-950 text-amber-300 border border-amber-600' 
              : 'bg-blue-950 text-blue-400 border border-blue-800/80'
          }`}>
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Chamber Humidity</h2>
            <p className="text-xs text-slate-400">Atmospheric Moisture</p>
          </div>
        </div>

        {/* Status */}
        <div>
          {!isOutOfRange ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              STABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              RANGE ALERT
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${
          isOutOfRange ? 'text-amber-400' : 'text-white'
        }`}>
          {humidity.toFixed(1)}
        </span>
        <span className="text-xl sm:text-2xl font-medium text-slate-400">%</span>
        <span className="text-xs text-slate-500 ml-auto font-mono">
          Safe Band: <strong className="text-cyan-400">{config.safeHumidityMin}% – {config.safeHumidityMax}%</strong>
        </span>
      </div>

      {/* Visual Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          {/* Safe Band Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/30 border-x border-blue-500/60"
            style={{
              left: `${config.safeHumidityMin}%`,
              width: `${config.safeHumidityMax - config.safeHumidityMin}%`,
            }}
          />
          {/* Current Level Fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOutOfRange ? 'bg-amber-500' : 'bg-blue-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, humidity))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0%</span>
          <span className="text-blue-400 font-medium">Safe ({config.safeHumidityMin}-{config.safeHumidityMax}%)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Environmental stats */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-medium">Condensation Risk</div>
          <div className="text-slate-200 font-medium">
            {humidity > 80 ? '⚠️ High (Moisture)' : '✅ Low (Sterile)'}
          </div>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
          <div className="text-[10px] text-slate-400 font-medium">Dew Point (Est.)</div>
          <div className="text-slate-200 font-mono font-semibold">
            {isNaN(dewPoint) ? '--' : `${dewPoint.toFixed(1)}°C`}
          </div>
        </div>
      </div>

    </div>
  );
};
