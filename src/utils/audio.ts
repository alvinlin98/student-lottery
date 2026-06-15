/**
 * Web Audio API synthesizer for classroom sound effects.
 * Avoids external asset dependencies and implements native real-time audio.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global volume control
let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

/**
 * Standard button click sound
 */
export function playClick() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.error('Audio play error:', e);
  }
}

/**
 * Tick sound for spinner transitions
 */
export function playTick() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(400, ctx.currentTime + 0.01);

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.error('Audio play error:', e);
  }
}

/**
 * Short success chime
 */
export function playSuccess() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gainNode.gain.setValueAtTime(0.08, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.02);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.12);     // C5
    playNote(659.25, now + 0.1, 0.12);  // E5
    playNote(783.99, now + 0.2, 0.3);   // G5
  } catch (e) {
    console.error('Audio play error:', e);
  }
}

/**
 * Celebratory fanfare
 */
export function playTada() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gainNode.gain.setValueAtTime(0.08, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.02);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Upbeat progression
    playNote(523.25, now, 0.1);         // C5
    playNote(523.25, now + 0.1, 0.1);   // C5
    playNote(523.25, now + 0.2, 0.1);   // C5
    playNote(659.25, now + 0.3, 0.15);  // E5
    playNote(587.33, now + 0.45, 0.15); // D5
    playNote(659.25, now + 0.6, 0.15);  // E5
    playNote(698.46, now + 0.75, 0.15); // F5
    playNote(783.99, now + 0.9, 0.5, 'sine'); // G5 with sine for warm celebration
  } catch (e) {
    console.error('Audio play error:', e);
  }
}
