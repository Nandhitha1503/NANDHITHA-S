import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight, BellRing } from 'lucide-react';
import { AlertEvent, TelemetryReading, MissionConfig } from '../types';

interface CriticalAlertBannerProps {
  alerts: AlertEvent[];
  reading: TelemetryReading | null;
  config: MissionConfig;
  onAcknowledgeAll: () => void;
  onViewAlerts: () => void;
}

export const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({
  alerts,
  reading,
  config,
  onAcknowledgeAll,
  onViewAlerts,
}) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  // Check live reading thresholds directly as well, in case immediate feedback is needed
  const tempViolation = reading && (reading.temperature < config.safeTempMin || reading.temperature > config.safeTempMax);
  const shockViolation = reading && (reading.shockDetected || reading.gForce >= config.shockThresholdG);
  const tiltViolation = reading && (reading.tiltAngle > config.tiltWarningThreshold);

  const hasAnyAlarm = activeAlerts.length > 0 || tempViolation || shockViolation || tiltViolation;

  if (!hasAnyAlarm) {
    return null;
  }

  const isCritical = activeAlerts.some(a => a.severity === 'critical') || tempViolation || shockViolation;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
        isCritical 
          ? 'bg-rose-950/80 border-rose-500/80 text-rose-100 shadow-lg shadow-rose-950/50 animate-critical-alert'
          : 'bg-amber-950/80 border-amber-500/80 text-amber-100 shadow-lg shadow-amber-950/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isCritical ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-600 text-white'
            }`}>
              {isCritical ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 animate-spin text-rose-300" />
                  {isCritical ? 'CRITICAL TRANSIT BREACH DETECTED' : 'CAUTION: TRANSIT PARAMETER WARNING'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-black/40 border border-white/10">
                  {activeAlerts.length || 1} Alert(s) Active
                </span>
              </div>

              {/* Specific violation summary pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {tempViolation && (
                  <span className="px-2 py-0.5 rounded bg-rose-900/90 text-rose-200 border border-rose-400 font-semibold">
                    🌡️ Temperature: {reading?.temperature}°C (Limit: {config.safeTempMin}°C – {config.safeTempMax}°C)
                  </span>
                )}
                {tiltViolation && (
                  <span className="px-2 py-0.5 rounded bg-amber-900/90 text-amber-200 border border-amber-400 font-semibold">
                    📐 Tilt Angle: {reading?.tiltAngle}° (Limit: ≤ {config.tiltWarningThreshold}°)
                  </span>
                )}
                {shockViolation && (
                  <span className="px-2 py-0.5 rounded bg-rose-900/90 text-rose-200 border border-rose-400 font-semibold">
                    💥 High Shock Impact: {reading?.gForce.toFixed(2)}G (Limit: &lt; {config.shockThresholdG}G)
                  </span>
                )}
                {!tempViolation && !tiltViolation && !shockViolation && activeAlerts[0] && (
                  <span className="text-slate-200">
                    {activeAlerts[0].message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={onViewAlerts}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>View Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onAcknowledgeAll}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer ${
                isCritical 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow'
                  : 'bg-amber-600 hover:bg-amber-500 shadow'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge Alerts</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
