import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Trash2, 
  Thermometer, 
  Compass, 
  Zap, 
  Droplets 
} from 'lucide-react';
import { AlertEvent } from '../types';

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertEvent[];
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const filtered = alerts.filter(a => {
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  const getIcon = (type: AlertEvent['type']) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'tilt':
        return <Compass className="w-4 h-4 text-amber-400" />;
      case 'shock':
        return <Zap className="w-4 h-4 text-rose-400" />;
      case 'humidity':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Alerts & Violation Audit Log</h2>
              <p className="text-xs text-slate-400">Total registered events: {alerts.length}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Quick Actions */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                filter === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical ({alerts.filter(a => a.severity === 'critical').length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
                filter === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Warnings ({alerts.filter(a => a.severity === 'warning').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAcknowledge('all')}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge All</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No active alerts or violations</p>
              <p className="text-xs text-slate-500 mt-0.5">All telemetry parameters within clinical thresholds.</p>
            </div>
          ) : (
            filtered.map((alert) => (
              <div
                key={alert.id}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl border transition-all ${
                  alert.acknowledged
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                    : alert.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-800/80 shadow-md shadow-rose-950/30'
                    : 'bg-amber-950/20 border-amber-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wide ${
                          alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {alert.value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                      <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()} ({new Date(alert.timestamp).toLocaleDateString()})
                      </div>
                    </div>
                  </div>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition cursor-pointer shrink-0 font-medium"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 bg-slate-900 rounded shrink-0">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Medical audit retention: 50 events</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
