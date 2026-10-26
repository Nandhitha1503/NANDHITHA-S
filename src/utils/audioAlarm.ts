let audioCtx: AudioContext | null = null;
let isMuted = false;
let activeAlarmInterval: number | null = null;

// Initialize Web Audio Context upon user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const alarmAudio = {
  isMuted: (): boolean => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('organ_monitor_muted');
      if (stored !== null) {
        isMuted = stored === 'true';
      }
    }
    return isMuted;
  },

  setMuted: (muted: boolean) => {
    isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('organ_monitor_muted', muted ? 'true' : 'false');
    }
    if (muted) {
      alarmAudio.stopCriticalAlarm();
    }
  },

  playWarningBeep: () => {
    if (alarmAudio.isMuted()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio playback restrictions fallback
    }
  },

  playCriticalPulse: () => {
    if (alarmAudio.isMuted()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // High pitch medical alarm tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(950, now);
      osc1.frequency.setValueAtTime(800, now + 0.12);

      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);
    } catch (e) {
      // Audio playback restrictions fallback
    }
  },

  startCriticalAlarmLoop: () => {
    if (activeAlarmInterval !== null) return;
    alarmAudio.playCriticalPulse();
    activeAlarmInterval = window.setInterval(() => {
      alarmAudio.playCriticalPulse();
    }, 1800);
  },

  stopCriticalAlarm: () => {
    if (activeAlarmInterval !== null) {
      clearInterval(activeAlarmInterval);
      activeAlarmInterval = null;
    }
  }
};
