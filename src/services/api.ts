import { TelemetryReading, AlertEvent, MissionConfig, TelemetryResponse } from '../types';

export const api = {
  async getLatestTelemetry(): Promise<TelemetryResponse> {
    const res = await fetch('/api/telemetry/latest');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getHistory(): Promise<{ history: TelemetryReading[]; waypoints: { lat: number; lng: number }[] }> {
    const res = await fetch('/api/telemetry/history');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getAlerts(): Promise<{ alerts: AlertEvent[] }> {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; alerts: AlertEvent[] }> {
    const res = await fetch('/api/alerts/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async clearAlerts(): Promise<{ success: boolean }> {
    const res = await fetch('/api/alerts/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getConfig(): Promise<{ config: MissionConfig }> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateConfig(newConfig: Partial<MissionConfig>): Promise<{ success: boolean; config: MissionConfig }> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async simulateEvent(eventType: string, value?: any): Promise<{ success: boolean; reading: TelemetryReading }> {
    const res = await fetch('/api/telemetry/simulate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, value }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async sendTelemetry(data: Partial<TelemetryReading>): Promise<{ success: boolean; reading: TelemetryReading }> {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};
