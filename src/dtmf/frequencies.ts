import type { DTMFDigit, DTMFFreqPair } from './types';

export const ROW_FREQS = [697, 770, 852, 941] as const;
export const ROW_FREQS_DEFAULT = ROW_FREQS[0];
export const COL_FREQS = [1209, 1336, 1477, 1633] as const;
export const COL_FREQS_DEFAULT = COL_FREQS[0];

export const DTMF_TABLE: ReadonlyArray<ReadonlyArray<DTMFDigit>> = [
  ['1', '2', '3', 'A'],
  ['4', '5', '6', 'B'],
  ['7', '8', '9', 'C'],
  ['*', '0', '#', 'D'],
] as const;

export const DIGIT_FREQS: Record<DTMFDigit, DTMFFreqPair> = (() => {
  const map = {} as Record<DTMFDigit, DTMFFreqPair>;
  for (let r = 0; r < DTMF_TABLE.length; r++) {
    for (let c = 0; c < (DTMF_TABLE[r]?.length ?? 0); c++) {
      const digit = DTMF_TABLE[r]?.[c];
      if (digit != null) {
        map[digit] = { low: ROW_FREQS[r] ?? ROW_FREQS_DEFAULT, high: COL_FREQS[c] ?? COL_FREQS_DEFAULT };
      }
    }
  }
  return map;
})();

export const ALL_DTMF_FREQS = [...ROW_FREQS, ...COL_FREQS] as const;

/** Convert a frequency to its nearest FFT bin index */
export const freqToBin = (freq: number, sampleRate: number, fftSize: number): number =>
  Math.round((freq * fftSize) / sampleRate);

/** Get dB value at a specific frequency from FFT data */
export const dbAtFreq = (data: Float32Array, freq: number, sampleRate: number, fftSize: number): number => {
  const bin = freqToBin(freq, sampleRate, fftSize);
  return data[bin] ?? -Infinity;
};
