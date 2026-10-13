// Web Audio API Retro Sound Synthesizer for Anomali SMK
// No external audio files needed - 100% lightweight procedural retro sounds

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentVolume = 1.0;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isAudioMuted ? 0 : currentVolume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function getMasterOutput(): AudioNode {
  const ctx = getAudioContext();
  if (masterGain) return masterGain;
  return ctx ? ctx.destination : ({} as AudioNode);
}

export const soundSettings = {
  setVolume: (val: number) => {
    currentVolume = Math.max(0, Math.min(1, val));
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isAudioMuted ? 0 : currentVolume, audioCtx.currentTime);
    }
  },
  getVolume: () => currentVolume,
  toggleMute: () => {
    isAudioMuted = !isAudioMuted;
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isAudioMuted ? 0 : currentVolume, audioCtx.currentTime);
    }
    return isAudioMuted;
  },
  isMuted: () => isAudioMuted,
};

export const playSound = {
  // Langkah kaki di ubin sekolah
  step: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  // Transisi ketemu alien di lorong (ala battle intro Pokemon)
  encounter: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const f = 200 + i * 180;
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + i * 0.08 + 0.08);
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.08);
      osc.connect(gain);
      gain.connect(getMasterOutput());
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.08);
    }
  },

  // Klik kartu / UI blip
  cardSelect: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  // Suara kartu berbalik / reroll (3D Flip Effect)
  cardFlip: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.12);
  },

  // Serangan Ringan (Light Attack / Penggaris / Kabel)
  attackLight: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.15);
  },

  // Serangan Berat (Heavy Attack / Kunci Pas / Buku Modul)
  attackHeavy: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.28);
  },

  // QTE Critical Sweet Spot Hit "TING!"
  qtePerfect: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046, 1318, 1567, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      gain.gain.setValueAtTime(0.18, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.22);
      osc.connect(gain);
      gain.connect(getMasterOutput());
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.22);
    });
  },

  // QTE Hit Normal
  qteGood: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587, now);
    osc.frequency.exponentialRampToValueAtTime(783, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.1);
  },

  // QTE Miss "BUZZ"
  qteMiss: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.setValueAtTime(75, now + 0.08);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.2);
  },

  // Bertahan / Shield Up "KLANK"
  shield: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.18);
  },

  // Minum Es Teh Kantin / Pulih HP
  heal: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
      osc.connect(gain);
      gain.connect(getMasterOutput());
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  },

  // Monster Kena Damage
  enemyHurt: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.2);
  },

  // Karakter Kena Hit
  playerHurt: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.25);
  },

  // Menang Pertarungan Jingle Fanfare
  victory: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523, 659, 783, 1046];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.22);
      osc.connect(gain);
      gain.connect(getMasterOutput());
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.22);
    });
  },

  // Klakson mobil / angkot "TIN-TIIINNN!"
  carHorn: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.12].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now + delay);
      gain.gain.setValueAtTime(0.16, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);
      osc.connect(gain);
      gain.connect(getMasterOutput());
      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    });
  },

  // Suara tabrakan mobil "BRUAAKK!"
  carCrash: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(getMasterOutput());
    osc.start();
    osc.stop(now + 0.35);
  },
};
