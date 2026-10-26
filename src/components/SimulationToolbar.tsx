import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Compass, 
  Zap, 
  ThermometerSnowflake, 
  ThermometerSun, 
  CheckCircle2, 
  FlaskConical 
} from 'lucide-react';

interface SimulationToolbarProps {
  isAutoSimulating: boolean;
  onToggleAutoSim: () => void;
  onSimulateEvent: (type: string) => Promise<void>;
  isLiveEsp32: boolean;
}

export const SimulationToolbar: React.FC<SimulationToolbarProps> = ({
  isAutoSimulating,
  onToggleAutoSim,
  onSimulateEvent,
  isLiveEsp32,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800/80">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Interactive Simulation & Alert Testing Deck</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold">
                  DEMO CONTROLS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger real-time clinical alarm conditions to test visual, audio, and map alert responses.
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            
            {/* Freeze Alert (<2°C) */}
            <button
              onClick={() => onSimulateEvent('temp-freeze')}
              title="Trigger Low Temperature Alert (1.1°C)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/80 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Freeze (1.1°C)</span>
            </button>

            {/* Overheat Alert (>8°C) */}
            <button
              onClick={() => onSimulateEvent('temp-heat')}
              title="Trigger High Temperature Alert (9.8°C)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-rose-300 border border-rose-800/80 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <ThermometerSun className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Heat (9.8°C)</span>
            </button>

            {/* Tilt Alert (>30°) */}
            <button
              onClick={() => onSimulateEvent('tilt-spill')}
              title="Trigger MPU6050 Tilt > 30° Alert (38°)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-amber-950 text-amber-300 border border-amber-800/80 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Tilt (38° &gt; 30°)</span>
            </button>

            {/* Shock Alert (>1.8G) */}
            <button
              onClick={() => onSimulateEvent('shock-impact')}
              title="Trigger MPU6050 Shock Impact Alert (2.85G)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-rose-300 border border-rose-800/80 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Shock (2.85G)</span>
            </button>

            {/* Reset to Safe Normal */}
            <button
              onClick={() => onSimulateEvent('temp-normal')}
              title="Reset all sensors to safe clinical values"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reset Safe (4.5°C, Normal)</span>
            </button>

            {/* Auto-Drive Vehicle Simulation Toggle */}
            <button
              onClick={onToggleAutoSim}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 cursor-pointer font-semibold ${
                isAutoSimulating
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoSimulating ? 'Pause Route Sim' : 'Auto-Advance Route'}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
