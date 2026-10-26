import React from 'react';
import { Heart, Activity, ShieldCheck, Stethoscope, AlertCircle, FileText } from 'lucide-react';
import { MissionConfig, TelemetryReading } from '../types';

interface OrganTripCardProps {
  config: MissionConfig;
  reading: TelemetryReading | null;
}

export const OrganTripCard: React.FC<OrganTripCardProps> = ({ config, reading }) => {
  // Ischemia time safe limit for heart is typically 4 hours (240 min)
  const maxSafeIschemiaHours = 4.0;

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/80">
            <Heart className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Organ Transit Manifest</h2>
            <p className="text-xs text-slate-400">UNOS / Eurotransplant Protocol</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          ACTIVE BIO-CHAIN
        </span>
      </div>

      {/* Grid of Medical Manifest */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Allograft Type</div>
          <div className="text-slate-100 font-bold text-sm mt-0.5">{config.organType}</div>
          <div className="text-[10px] text-rose-400 mt-1 font-mono">Preservation: Custodiol HTK</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Donor ID</div>
          <div className="text-cyan-300 font-mono font-bold text-sm mt-0.5">{config.donorId}</div>
          <div className="text-[10px] text-slate-400 mt-1">Crossmatch: Negative</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Recipient ID</div>
          <div className="text-cyan-300 font-mono font-bold text-sm mt-0.5">{config.recipientId}</div>
          <div className="text-[10px] text-slate-400 mt-1">OR Prep: Team Standby</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Cold Ischemia Limit</div>
          <div className="text-amber-300 font-mono font-bold text-sm mt-0.5">&lt; {maxSafeIschemiaHours} Hours</div>
          <div className="text-[10px] text-emerald-400 mt-1">Window: On Schedule</div>
        </div>
      </div>

      {/* Medical Cold Chain Protocol Note */}
      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-300">
        <Stethoscope className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Clinical Criteria: </span>
          Hypothermic preservation requires chamber temperature maintained between <strong className="text-emerald-400">{config.safeTempMin}°C and {config.safeTempMax}°C</strong>. 
          Container tilt must remain below <strong className="text-amber-400">{config.tiltWarningThreshold}°</strong> to prevent preservation fluid leakage and tissue shear.
        </div>
      </div>
    </div>
  );
};
