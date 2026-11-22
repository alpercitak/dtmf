import { COL_FREQS, COL_FREQS_DEFAULT, DTMF_TABLE, dbAtFreq, ROW_FREQS, ROW_FREQS_DEFAULT } from './frequencies';
import type { DetectionEvent, DTMFDigit } from './types';

interface DetectorState {
  lastDigit: DTMFDigit | null;
  toneStartMs: number | null;
  cooldownUntilMs: number;
}

export const THRESHOLD_DB = -40 as const;
const MIN_TONE_MS = 40 as const;
const COOLDOWN_MS = 120 as const;
/** The chosen row (or column) must beat the next loudest in its group by this much; rejects speech and music. */
const MIN_DOMINANCE_DB = 6 as const;
/** Max level difference between the row and column tone (DTMF "twist"). */
const MAX_TWIST_DB = 8 as const;

/** The loudest frequency in a group, if it is over the threshold and clearly louder than the rest of the group. */
const dominant = (fftData: Float32Array, freqs: readonly number[], sampleRate: number, fftSize: number) => {
  let index = -1;
  let db = -Infinity;
  let runnerUp = -Infinity;
  freqs.forEach((f, i) => {
    const level = dbAtFreq(fftData, f, sampleRate, fftSize);
    if (level > db) {
      runnerUp = db;
      db = level;
      index = i;
    } else if (level > runnerUp) {
      runnerUp = level;
    }
  });
  return db > THRESHOLD_DB && db - runnerUp >= MIN_DOMINANCE_DB ? { index, db } : null;
};

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
    const row = dominant(fftData, ROW_FREQS, sampleRate, fftSize);
    const col = dominant(fftData, COL_FREQS, sampleRate, fftSize);
    const digit =
      row && col && Math.abs(row.db - col.db) <= MAX_TWIST_DB ? DTMF_TABLE[row.index]?.[col.index] : undefined;

    if (!row || !col || digit == null) {
      state.toneStartMs = null;
      state.lastDigit = null;
      return null;
    }

    if (state.lastDigit !== digit) {
      state.lastDigit = digit;
      state.toneStartMs = nowMs;
      return null;
    }

    // toneStartMs is null once this tone has been emitted; it must end before the digit can fire again.
    if (state.toneStartMs == null || nowMs < state.cooldownUntilMs) {
      return null;
    }

    if (nowMs - state.toneStartMs >= MIN_TONE_MS) {
      const rowFreq = ROW_FREQS[row.index] ?? ROW_FREQS_DEFAULT;
      const colFreq = COL_FREQS[col.index] ?? COL_FREQS_DEFAULT;
      const confidence = (row.db + col.db) / 2;

      state.toneStartMs = null;
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
