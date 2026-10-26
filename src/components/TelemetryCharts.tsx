import React, { useState } from 'react';
import { LineChart, Activity, Thermometer, Compass, Zap } from 'lucide-react';
import { TelemetryReading, MissionConfig } from '../types';

interface TelemetryChartsProps {
  history: TelemetryReading[];
  config: MissionConfig;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history, config }) => {
  const [activeTab, setActiveTab] = useState<'temp' | 'motion' | 'humidity'>('temp');

  const sliceCount = 30;
  const recentHistory = history.slice(-sliceCount);

  // SVG Chart Dimensions
  const width = 600;
  const height = 160;
  const padding = { top: 20, right: 30, bottom: 25, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Temperature scale
  const tempMin = 0;
  const tempMax = 12;
  const tempToY = (t: number) => {
    const clamped = Math.min(tempMax, Math.max(tempMin, t));
    return padding.top + chartHeight - ((clamped - tempMin) / (tempMax - tempMin)) * chartHeight;
  };

  // Tilt scale (0 to 50°)
  const tiltMax = 50;
  const tiltToY = (deg: number) => {
    const clamped = Math.min(tiltMax, Math.max(0, deg));
    return padding.top + chartHeight - (clamped / tiltMax) * chartHeight;
  };

  // Humidity scale (0 to 100%)
  const humToY = (h: number) => {
    const clamped = Math.min(100, Math.max(0, h));
    return padding.top + chartHeight - (clamped / 100) * chartHeight;
  };

  const getX = (index: number) => {
    if (recentHistory.length <= 1) return padding.left;
    return padding.left + (index / (recentHistory.length - 1)) * chartWidth;
  };

  // Build SVG path strings
  const tempPath = recentHistory.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${tempToY(d.temperature)}`).join(' ');
  const tiltPath = recentHistory.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${tiltToY(d.tiltAngle)}`).join(' ');
  const gForcePath = recentHistory.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${tiltToY(d.gForce * 12)}`).join(' ');
  const humPath = recentHistory.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${humToY(d.humidity)}`).join(' ');

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Historical Telemetry Trends</h2>
            <p className="text-xs text-slate-400">Sensor timeline & audit logs</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('temp')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'temp'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature (°C)</span>
          </button>

          <button
            onClick={() => setActiveTab('motion')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'motion'
                ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>MPU6050 Motion</span>
          </button>

          <button
            onClick={() => setActiveTab('humidity')}
            className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'humidity'
                ? 'bg-blue-950 text-blue-300 border border-blue-800 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Humidity (%)</span>
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 select-none">
          {/* Background grid */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#334155" />

          {/* Tab 1: Temperature Chart */}
          {activeTab === 'temp' && (
            <>
              {/* Safe Zone Green Shaded Band (2 - 8 °C) */}
              <rect
                x={padding.left}
                y={tempToY(config.safeTempMax)}
                width={chartWidth}
                height={Math.abs(tempToY(config.safeTempMin) - tempToY(config.safeTempMax))}
                fill="rgba(16, 185, 129, 0.12)"
                stroke="rgba(16, 185, 129, 0.3)"
                strokeDasharray="4 4"
              />
              <text x={width - padding.right - 5} y={tempToY(config.safeTempMax) + 12} fill="#34d399" fontSize="9" textAnchor="end" fontFamily="monospace">
                8°C Max Safe
              </text>
              <text x={width - padding.right - 5} y={tempToY(config.safeTempMin) - 4} fill="#34d399" fontSize="9" textAnchor="end" fontFamily="monospace">
                2°C Min Safe
              </text>

              {/* Data line */}
              <path d={tempPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data point dots */}
              {recentHistory.map((d, i) => {
                const isOutOfRange = d.temperature < config.safeTempMin || d.temperature > config.safeTempMax;
                return (
                  <circle
                    key={i}
                    cx={getX(i)}
                    cy={tempToY(d.temperature)}
                    r={isOutOfRange ? 4 : 2}
                    fill={isOutOfRange ? '#f43f5e' : '#38bdf8'}
                    stroke={isOutOfRange ? '#fff' : 'none'}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Y Axis labels */}
              <text x={padding.left - 8} y={tempToY(10)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">10°C</text>
              <text x={padding.left - 8} y={tempToY(5)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">5°C</text>
              <text x={padding.left - 8} y={tempToY(0)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">0°C</text>
            </>
          )}

          {/* Tab 2: Motion (Tilt & Shock) Chart */}
          {activeTab === 'motion' && (
            <>
              {/* 30° Limit Line */}
              <line
                x1={padding.left}
                y1={tiltToY(config.tiltWarningThreshold)}
                x2={width - padding.right}
                y2={tiltToY(config.tiltWarningThreshold)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x={width - padding.right - 5} y={tiltToY(config.tiltWarningThreshold) - 4} fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">
                30° Tilt Warning Limit
              </text>

              {/* Tilt line */}
              <path d={tiltPath} fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Shock markers */}
              {recentHistory.map((d, i) => {
                if (d.shockDetected || d.gForce >= config.shockThresholdG) {
                  return (
                    <g key={i}>
                      <circle cx={getX(i)} cy={tiltToY(d.tiltAngle)} r="5" fill="#e11d48" stroke="#fff" strokeWidth="1" />
                    </g>
                  );
                }
                return null;
              })}

              <text x={padding.left - 8} y={tiltToY(40)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">40°</text>
              <text x={padding.left - 8} y={tiltToY(20)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">20°</text>
              <text x={padding.left - 8} y={tiltToY(0)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">0°</text>
            </>
          )}

          {/* Tab 3: Humidity Chart */}
          {activeTab === 'humidity' && (
            <>
              {/* Humidity safe band */}
              <rect
                x={padding.left}
                y={humToY(config.safeHumidityMax)}
                width={chartWidth}
                height={Math.abs(humToY(config.safeHumidityMin) - humToY(config.safeHumidityMax))}
                fill="rgba(59, 130, 246, 0.12)"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeDasharray="4 4"
              />
              <path d={humPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x={padding.left - 8} y={humToY(80)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">80%</text>
              <text x={padding.left - 8} y={humToY(50)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">50%</text>
              <text x={padding.left - 8} y={humToY(20)} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">20%</text>
            </>
          )}

          {/* X Axis Time Labels */}
          <text x={padding.left} y={height - 6} fill="#64748b" fontSize="9" fontFamily="monospace">30 mins ago</text>
          <text x={padding.left + chartWidth / 2} y={height - 6} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">15 mins ago</text>
          <text x={width - padding.right} y={height - 6} fill="#38bdf8" fontSize="9" textAnchor="end" fontFamily="monospace">Now (Live)</text>
        </svg>
      </div>
    </div>
  );
};
