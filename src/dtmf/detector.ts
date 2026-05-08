import type { DetectionEvent, DTMFDigit } from './types';
import { ROW_FREQS, COL_FREQS, DTMF_TABLE, dbAtFreq } from './frequencies';

export const THRESHOLD_DB = -40 as const;
const MIN_TONE_MS = 40 as const;
const COOLDOWN_MS = 120 as const;

interface DetectorState {
  lastDigit: DTMFDigit | null;
  toneStartMs: number | null;
  cooldownUntilMs: number;
}

export const createDetector = () => {
  const state: DetectorState = {
    lastDigit: null,
    toneStartMs: null,
    cooldownUntilMs: 0,
  };

  /**
   * Run detection on one FFT frame.
   * Returns a DetectionEvent if a new digit was confirmed, null otherwise.
   */
  const detect = (fftData: Float32Array, sampleRate: number, fftSize: number, nowMs: number): DetectionEvent | null => {
    const rowHit = ROW_FREQS.findIndex((f) => dbAtFreq(fftData, f, sampleRate, fftSize) > THRESHOLD_DB);
    const colHit = COL_FREQS.findIndex((f) => dbAtFreq(fftData, f, sampleRate, fftSize) > THRESHOLD_DB);

    const tonePresent = rowHit !== -1 && colHit !== -1;
    const digit: DTMFDigit | undefined = tonePresent ? DTMF_TABLE[rowHit]?.[colHit] : undefined;

    if (!tonePresent || digit == null) {
      state.toneStartMs = null;
      state.lastDigit = null;
      return null;
    }

    if (nowMs < state.cooldownUntilMs) return null;

    if (state.lastDigit !== digit) {
      state.lastDigit = digit;
      state.toneStartMs = nowMs;
      return null;
    }

    if (state.toneStartMs == null) {
      state.toneStartMs = nowMs;
      return null;
    }

    if (nowMs - state.toneStartMs >= MIN_TONE_MS) {
      const rowFreq = ROW_FREQS[rowHit] ?? 697;
      const colFreq = COL_FREQS[colHit] ?? 1209;
      const confidence =
        (dbAtFreq(fftData, rowFreq, sampleRate, fftSize) + dbAtFreq(fftData, colFreq, sampleRate, fftSize)) / 2;

      state.toneStartMs = null;
      state.lastDigit = null;
      state.cooldownUntilMs = nowMs + COOLDOWN_MS;

      return { digit, timestamp: nowMs, lowFreq: rowFreq, highFreq: colFreq, confidence };
    }

    return null;
  };

  const reset = () => {
    state.lastDigit = null;
    state.toneStartMs = null;
    state.cooldownUntilMs = 0;
  };

  return { detect, reset };
};

export type Detector = ReturnType<typeof createDetector>;
