import React, { useState } from 'react';
import { X, Settings, Sliders, Hospital, Save, RotateCcw } from 'lucide-react';
import { MissionConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MissionConfig;
  onSaveConfig: (newConfig: Partial<MissionConfig>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [tempMin, setTempMin] = useState(config.safeTempMin.toString());
  const [tempMax, setTempMax] = useState(config.safeTempMax.toString());
  const [humidityMin, setHumidityMin] = useState(config.safeHumidityMin.toString());
  const [humidityMax, setHumidityMax] = useState(config.safeHumidityMax.toString());
  const [tiltWarning, setTiltWarning] = useState(config.tiltWarningThreshold.toString());
  const [shockThreshold, setShockThreshold] = useState(config.shockThresholdG.toString());
  const [organType, setOrganType] = useState(config.organType);
  const [donorHospitalName, setDonorHospitalName] = useState(config.donorHospital.name);
  const [recipientHospitalName, setRecipientHospitalName] = useState(config.recipientHospital.name);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig({
        safeTempMin: parseFloat(tempMin) || 2.0,
        safeTempMax: parseFloat(tempMax) || 8.0,
        safeHumidityMin: parseFloat(humidityMin) || 40.0,
        safeHumidityMax: parseFloat(humidityMax) || 70.0,
        tiltWarningThreshold: parseFloat(tiltWarning) || 30.0,
        shockThresholdG: parseFloat(shockThreshold) || 1.8,
        organType,
        donorHospital: {
          ...config.donorHospital,
          name: donorHospitalName,
        },
        recipientHospital: {
          ...config.recipientHospital,
          name: recipientHospitalName,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTempMin('2.0');
    setTempMax('8.0');
    setHumidityMin('40.0');
    setHumidityMax('70.0');
    setTiltWarning('30.0');
    setShockThreshold('1.8');
    setOrganType('Human Heart (Allograft)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">System & Threshold Configuration</h2>
              <p className="text-xs text-slate-400">Clinical alarm boundaries & transit parameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-300">
          
          {/* Temperature Range (2-8°C) */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-white flex items-center justify-between">
              <span>Safe Temperature Limits (°C)</span>
              <span className="text-emerald-400 font-mono text-[11px]">Hypothermic Standard: 2.0 – 8.0°C</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Safe Min Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Safe Max Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* MPU6050 Motion Limits (Tilt > 30° and Shock G) */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-white flex items-center justify-between">
              <span>MPU6050 Motion & Shock Limits</span>
              <span className="text-purple-400 font-mono text-[11px]">Inertial Thresholds</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Max Tilt Angle (Degrees)</label>
                <input
                  type="number"
                  step="1"
                  value={tiltWarning}
                  onChange={(e) => setTiltWarning(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
                <span className="text-[10px] text-slate-500">Standard organ box limit: 30°</span>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Shock Impact Limit (Gs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={shockThreshold}
                  onChange={(e) => setShockThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
                <span className="text-[10px] text-slate-500">Standard drop limit: 1.8G</span>
              </div>
            </div>
          </div>

          {/* Humidity Range */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-white">Chamber Humidity Range (%)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Safe Min Humidity (%)</label>
                <input
                  type="number"
                  step="1"
                  value={humidityMin}
                  onChange={(e) => setHumidityMin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Safe Max Humidity (%)</label>
                <input
                  type="number"
                  step="1"
                  value={humidityMax}
                  onChange={(e) => setHumidityMax(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Organ & Hospital Metadata */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div className="font-semibold text-white">Transit Logistics</div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Organ / Tissue Specimen</label>
              <input
                type="text"
                value={organType}
                onChange={(e) => setOrganType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Donor Hospital A</label>
                <input
                  type="text"
                  value={donorHospitalName}
                  onChange={(e) => setDonorHospitalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Recipient Hospital B</label>
                <input
                  type="text"
                  value={recipientHospitalName}
                  onChange={(e) => setRecipientHospitalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Clinical Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-xs px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
