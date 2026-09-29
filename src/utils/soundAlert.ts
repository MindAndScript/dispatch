/**
 * Zero-dependency Web Audio API Emergency Siren Synthesizer
 * Produces an authentic oscillating two-tone ambulance/dispatch emergency siren.
 */

let audioCtx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let sirenInterval: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function playEmergencySiren() {
  if (typeof window === 'undefined') return;
  if (isPlaying) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    osc = ctx.createOscillator();
    gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(850, ctx.currentTime);

    // Master volume (moderate and punchy)
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    isPlaying = true;

    // Siren pitch oscillation
    let high = true;
    sirenInterval = setInterval(() => {
      if (!osc || !audioCtx) return;
      const targetFreq = high ? 650 : 920;
      high = !high;
      osc.frequency.linearRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.25);
    }, 350);
  } catch (err) {
    console.warn('Web Audio Siren unavailable or blocked by autoplay policy:', err);
  }
}

export function stopEmergencySiren() {
  if (!isPlaying) return;

  try {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }

    if (gainNode && audioCtx) {
      // Smooth fade out to avoid clicks
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      setTimeout(() => {
        try {
          if (osc) {
            osc.stop();
            osc.disconnect();
            osc = null;
          }
        } catch {
          // ignore
        }
      }, 120);
    } else if (osc) {
      osc.stop();
      osc.disconnect();
      osc = null;
    }
  } catch (err) {
    console.warn('Error stopping emergency siren:', err);
  } finally {
    isPlaying = false;
  }
}

export function isSirenActive(): boolean {
  return isPlaying;
}
